// Browser tests. BROWSER=chromium|webkit|firefox (chromium by default).
import test, { before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import playwright from "playwright";

const ROOT = new URL("../../", import.meta.url);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".woff2": "font/woff2" };
let server, browser, context, page, url, problems;

before(async () => {
    server = createServer(async (request, response) => {
        const path = new URL(request.url, "http://x").pathname;
        const file = path === "/" ? "/index.html" : path;
        try {
            const body = await readFile(new URL(`.${file}`, ROOT));
            response.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" }).end(body);
        } catch {
            response.writeHead(404).end();
        }
    }).listen(0, "localhost");
    await new Promise((resolve) => server.once("listening", resolve));
    url = `http://localhost:${server.address().port}/`;
    browser = await playwright[process.env.BROWSER ?? "chromium"].launch({ channel: process.env.CHANNEL || undefined });
});
after(async () => {
    await browser?.close();
    server.close();
});

beforeEach(async () => {
    problems = [];
    context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "en-US" });
    page = await context.newPage();
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("console", (message) => message.type() === "error" && problems.push(message.text()));
    page.on("request", (request) => !/^(blob:|data:)/.test(request.url()) && !request.url().startsWith(url) && problems.push(`external: ${request.url()}`));
    await page.addInitScript(() => sessionStorage.setItem("mellow_loader_seen", "1"));
    await page.goto(url);
});
afterEach(async () => {
    await context.close();
    assert.deepEqual(problems, []);
});

const state = () => page.evaluate(() => JSON.parse(localStorage.mellow_state));
const tab = (index) => page.click(`.tab:nth-child(${index})`);
const active = (selector) => page.locator(`.screen.is-active ${selector}`);
async function start() {
    await page.fill("dialog input", "Alex");
    await page.click("dialog .btn-primary");
    await page.waitForFunction(() => JSON.parse(localStorage.mellow_state ?? "{}").dictionaries?.length === 2);
    await page.waitForFunction(() => !document.querySelector("dialog"));
}

test("the first start adds topics for the chosen pair", async () => {
    await start();
    const { dictionaries, activeDictionaryId, settings } = await state();
    assert.deepEqual([settings.native, settings.target], ["English", "Spanish"]);
    assert.equal(activeDictionaryId, dictionaries[0].id);
    assert.equal(dictionaries[0].words[0].translation, "hola");
});

test("study: grade, undo, finish", async () => {
    await start();
    await active(".hero-btn").click();
    await page.click(".session-footer .btn-primary");
    await page.keyboard.press("4");
    assert.equal((await state()).dictionaries[0].words[0].srs.interval, 4);
    await page.click('[aria-label="Undo"]');
    assert.equal((await state()).dictionaries[0].words[0].srs, null);
    for (let i = 0; i < 10; i++) {
        await page.click(".session-footer .btn-primary");
        await page.keyboard.press("4");
    }
    await page.waitForSelector(".session-summary");
});

test("library: search and add", async () => {
    await start();
    await tab(2);
    await page.click(".hero-link");
    await page.fill('dialog [type="search"]', "perro");
    await page.locator(".topic .icon-btn").first().click();
    assert.ok((await state()).dictionaries.some((d) => d.libraryKey === "animals:English:Spanish"));
});

test("add a word with a suggestion", async () => {
    await start();
    await page.click(".quick:nth-child(4)");
    await page.locator("dialog .input").first().fill("dog");
    await page.click("dialog .tag-btn");
    await page.click("dialog .btn-primary");
    assert.equal((await state()).dictionaries[0].words.at(-1).translation, "el perro");
});

test("typing test accepts a word", async () => {
    await start();
    await tab(4);
    await active(".segmented").nth(0).locator("button").nth(1).click();
    await active(".card .btn-primary").click();
    const { dictionaries } = await state();
    const prompt = await page.textContent(".question-word");
    await page.fill(".input-large", dictionaries[0].words.find((w) => w.word === prompt).translation);
    await page.keyboard.press("Enter");
    await page.waitForSelector(".feedback.is-correct");
});

test("user text is never parsed as HTML", async () => {
    await start();
    await tab(2);
    await active(".dict-card").first().click();
    await page.click('dialog .btn:has-text("Import")');
    await page.locator("dialog").last().locator("textarea").fill("<img src=x onerror=window.hacked=1>;<b>x</b>");
    await page.locator("dialog").last().locator(".btn-primary").click();
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.hacked), undefined);
    assert.equal((await state()).dictionaries[0].words.at(-1).translation, "<b>x</b>");
});

test("themes, languages and a narrow screen", async () => {
    await start();
    await tab(5);
    await active(".segmented button").nth(2).click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "dark");
    await active("select").nth(2).selectOption({ label: "Русский" });
    await page.setViewportSize({ width: 320, height: 568 });
    for (let i = 1; i <= 5; i++) {
        await tab(i);
        assert.ok(await page.evaluate(() => [...document.querySelectorAll(".screen.is-active .screen-scroll *")].every((el) => el.getBoundingClientRect().right <= 321)), `tab ${i}`);
    }
    for (const name of ["privacy", "terms"]) {
        await page.goto(`${url}${name}.html`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.dataset.theme === "dark"));
        assert.ok(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight && (scrollTo(0, 300), scrollY > 100)), "page scrolls");
    }
});

test("a module that failed once does not leave an empty page", async () => {
    await start();
    let failed = false;
    const fresh = await browser.newContext({ serviceWorkers: "block" });
    const other = await fresh.newPage();
    await other.route("**/js/core/dom.js", (route) => (failed ? route.continue() : ((failed = true), route.abort())));
    await other.goto(url).catch(() => {});
    await other.waitForSelector(".tab");
    assert.ok(failed);
    await fresh.close();
});
