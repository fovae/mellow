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
let nextVersion = null; // set by the update test: sw.js is served as a newer release

before(async () => {
    server = createServer(async (request, response) => {
        const path = new URL(request.url, "http://x").pathname;
        // The account API answers as for someone signed in, and takes cloud copies (account.test.mjs runs the real one).
        const json = (body) => response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(body));
        if (path === "/api/me") return json({ nick: "tester", backup: null });
        if (path === "/api/backup" && request.method === "PUT") return request.resume().on("end", () => json({ savedAt: Date.now(), size: 1 }));
        const file = path === "/" ? "/index.html" : path;
        try {
            let body = await readFile(new URL(`.${file}`, ROOT));
            if (file === "/sw.js" && nextVersion) body = String(body).replace(/const VERSION = "[^"]+"/, `const VERSION = "${nextVersion}"`);
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
// The first screen, then the guide that follows it (skipped).
async function start() {
    await page.click("dialog .session-footer .btn-primary");
    await page.waitForFunction(() => JSON.parse(localStorage.mellow_state ?? "{}").dictionaries?.length === 2);
    await page.click("dialog .tour-skip");
    await page.waitForFunction(() => !document.querySelector("dialog"));
}

test("the first start adds topics for the chosen pair", async () => {
    await start();
    const { dictionaries, profiles, settings } = await state();
    assert.deepEqual([settings.native, settings.target], ["English", "Spanish"]);
    assert.deepEqual(profiles, [{ from: "English", to: "Spanish" }]);
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
    await active(".widget").filter({ hasText: "Add word" }).click();
    // It opens "My words" with the field in focus, ready to type.
    assert.ok(await page.evaluate(() => document.activeElement.closest(".add-word") !== null));
    await page.locator("dialog .add-word input").nth(1).fill("dog");
    await page.click("dialog .tag-btn");
    await page.click('dialog .add-word [type="submit"]');
    const mine = (await state()).dictionaries.find((d) => d.mine);
    assert.equal(mine.words.at(-1).translation, "el perro");
    assert.equal(await page.locator("dialog .word-list .row").count(), 1);
});

test("home: the word of the day opens, Mello gives a tip, the lesson starts", async () => {
    await start();
    const { dictionaries } = await state();
    const word = await active(".word-main > strong").textContent();
    await active(".word-main").click();
    assert.equal(await active(".word-meaning").textContent(), dictionaries[0].words.find((w) => w.translation === word).word);
    await active(".mello-btn").click();
    await page.waitForSelector(".toast");
    await active(".widget-lesson").click();
    await page.waitForSelector(".intro");
});

test("profiles: another language has its own course, switching back keeps the first", async () => {
    await start();
    await tab(5);
    const row = (name) => active(".cell").filter({ hasText: name }).first();
    await row("Add a language").click();
    await page.click("dialog .dropdown >> nth=1");
    await page.locator("dialog").last().locator('[data-value="German"]').click();
    await page.locator("dialog").first().locator(".btn-primary").click();
    await page.waitForFunction(() => JSON.parse(localStorage.mellow_state).dictionaries.length === 4);
    await page.waitForFunction(() => !document.querySelector("dialog"));
    const after = await state();
    assert.deepEqual([after.settings.native, after.settings.target, after.profiles.length], ["English", "German", 2]);
    await tab(2);
    assert.equal(await active(".dict-card").count(), 2);
    await active(".dict-card").first().click();
    await page.waitForSelector('dialog :text("hallo")');
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("dialog"));
    await tab(5);
    await active(".profile-row").nth(0).click();
    assert.equal((await state()).settings.target, "Spanish");
    await row("Delete a profile").click();
    await page.click('dialog [data-value="1"]');
    await page.locator("dialog").last().locator(".btn-danger").click();
    await page.waitForFunction(() => JSON.parse(localStorage.mellow_state).dictionaries.length === 2);
    assert.deepEqual((await state()).profiles, [{ from: "English", to: "Spanish" }]);
});

test("the course continues by itself and does not bring back a deleted topic", async () => {
    await start();
    await page.evaluate(() => {
        const s = JSON.parse(localStorage.mellow_state);
        for (const d of s.dictionaries) for (const w of d.words) w.srs = { due: Date.now() + 9e9, interval: 30, ease: 2.5, step: 0, lapses: 0 };
        s.removedTopics = ["numbers:English:Spanish"];
        localStorage.mellow_state = JSON.stringify(s);
    });
    await page.reload();
    await page.waitForFunction(() => JSON.parse(localStorage.mellow_state).dictionaries.length === 3);
    assert.equal((await state()).dictionaries[2].libraryKey, "time:English:Spanish");
});

test("data of the previous version becomes profiles", async () => {
    await start();
    await page.evaluate(() => {
        const s = JSON.parse(localStorage.mellow_state);
        s.version = 4;
        s.activeDictionaryId = s.dictionaries[1].id;
        s.dictionaries[0].to = "French";
        delete s.profiles;
        delete s.removedTopics;
        localStorage.mellow_state = JSON.stringify(s);
    });
    await page.reload();
    await page.waitForSelector(".is-ready");
    await tab(5);
    assert.equal(await active(".profile-row").count(), 2);
    await active(".profile-row").nth(0).click();
    const { profiles, settings, dictionaries } = await state();
    assert.deepEqual(profiles.map((p) => p.to), ["French", "Spanish"]);
    assert.equal(settings.target, "French");
    assert.equal(dictionaries[0].to, "Spanish");
    assert.ok(dictionaries.length === 2 && dictionaries.every((d) => d.words.length));
});

test("typing test accepts a word", async () => {
    await start();
    await tab(4);
    await active(".segmented").nth(0).locator("button").nth(1).click();
    await active(".btn-primary").click();
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
    await page.locator("dialog .add-word input").nth(0).fill("<b>x</b>");
    await page.locator("dialog .add-word input").nth(1).fill("<img src=x onerror=window.hacked=1>");
    await page.click('dialog .add-word [type="submit"]');
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.hacked), undefined);
    assert.equal((await state()).dictionaries[0].words.at(-1).translation, "<b>x</b>");
    assert.equal(await page.locator("dialog .word-list strong").first().textContent(), "<b>x</b>");
});

test("a lesson: every exercise, rewards, the path moves", async () => {
    await start();
    await tab(3);
    await active(".path-node.is-current").click();
    const { dictionaries } = await state();
    const [dict] = dictionaries;
    const pair = (text) => dict.words.find((w) => w.word === text || w.translation === text);
    const answers = (text) => dict.words.filter((w) => w.word === text || w.translation === text).flatMap((w) => [w.word, w.translation]);
    for (let i = 0; i < 60 && !(await page.locator(".session-summary").count()); i++) {
        if (await page.locator(".intro").count()) {
            await page.click(".session-footer .btn");
        } else if (await page.locator(".pairs").count()) {
            for (const el of await page.locator(".pairs-column").nth(0).locator("button").all()) {
                await el.click();
                await page.locator(".pairs-column").nth(1).getByText(pair(await el.textContent()).translation, { exact: true }).click();
            }
            await page.waitForFunction(() => !document.querySelector(".pairs"));
        } else {
            const prompt = await page.locator(".question-word").textContent();
            if (await page.locator("#answerForm").count()) {
                await page.fill(".input-large", pair(prompt).translation);
                await page.keyboard.press("Enter");
            } else {
                for (const option of await page.locator(".option").all()) {
                    const text = await option.textContent();
                    if (text !== prompt && answers(prompt).includes(text)) { await option.click(); break; }
                }
            }
            await page.waitForSelector(".feedback.is-correct");
            await page.click(".session-footer .btn");
        }
    }
    const after = await state();
    const day = Object.values(after.log)[0];
    assert.deepEqual([day.lessons, day.perfect, day.fresh], [1, 1, 6]);
    assert.ok(after.dictionaries[0].words.slice(0, 6).every((w) => w.srs.interval === 1));
    assert.ok(after.drops >= 25 && after.rewardedLevel >= 2, `${after.drops} ${after.rewardedLevel}`);
    await page.waitForSelector(".toast");
    await page.click(".session-footer .btn");
    await page.waitForFunction(() => !document.querySelector("dialog"));
    assert.equal(await active(".path-node.is-done").count(), 1);
});

test("leaving a lesson asks first; the shop sells only when there are drops", async () => {
    await start();
    await tab(3);
    await active(".path-node.is-current").click();
    await page.click(".session-footer .btn");
    await page.keyboard.press("Escape");
    await page.locator("dialog").last().locator(".btn-danger").click();
    await page.waitForFunction(() => !document.querySelector("dialog"));
    assert.equal(Object.values((await state()).log)[0]?.lessons ?? 0, 0);
    await tab(5);
    await active(".chip-stat").click();
    assert.ok(await page.locator("dialog .btn-small").isDisabled());
    await page.locator("dialog .swatch").nth(4).click();
    assert.equal((await state()).settings.accent, "mellow");
    await page.locator("dialog .swatch").nth(1).click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.accent), "ocean");
    await page.evaluate(() => { const s = JSON.parse(localStorage.mellow_state); s.drops = 100; localStorage.mellow_state = JSON.stringify(s); });
    await page.reload();
    await page.waitForSelector(".is-ready");
    await tab(5);
    await active(".chip-stat").click();
    await page.locator("dialog .btn-small").click();
    await page.locator("dialog .swatch").nth(4).click();
    const { drops, freezes, settings } = await state();
    assert.deepEqual([drops, freezes, settings.accent], [0, 2, "rose"]);
});

test("a freeze covers a missed day", async () => {
    await start();
    await page.evaluate(() => {
        const s = JSON.parse(localStorage.mellow_state);
        const key = (days) => { const d = new Date(); d.setDate(d.getDate() - days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
        s.log = { [key(2)]: { answers: 5, correct: 5 }, [key(3)]: { answers: 5, correct: 5 } };
        localStorage.mellow_state = JSON.stringify(s);
    });
    await page.reload();
    await page.waitForSelector(".toast");
    const { freezes, frozen } = await state();
    assert.deepEqual([freezes, Object.keys(frozen).length], [0, 1]);
    assert.equal(await active(".streak-value strong").textContent(), "2");
});

test("themes, languages and a narrow screen", async () => {
    await start();
    await tab(5);
    await active(".segmented button").nth(2).click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "dark");
    const row = (name) => active(".cell").filter({ hasText: name }).first();
    // A switch must not redraw the screen: its animation would be lost.
    await page.evaluate(() => { document.querySelector(".screen.is-active .profile-card").dataset.kept = "1"; });
    await row("Animations").click();
    assert.equal((await state()).settings.motion, false);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.motion), "off");
    assert.equal(await active('[data-kept="1"]').count(), 1);
    for (const name of ["Statistics", "Achievements", "Colour style"]) {
        await row(name).click();
        await page.waitForSelector("dialog .modal-body > *");
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => !document.querySelector("dialog"));
    }
    await row("App language").click();
    await page.click('dialog [data-value="ru"]');
    await page.waitForFunction(() => !document.querySelector("dialog"));
    await page.setViewportSize({ width: 320, height: 568 });
    for (let i = 1; i <= 5; i++) {
        await tab(i);
        const gaps = await page.evaluate(() => [...document.querySelectorAll(".screen.is-active .screen-scroll > *")].map((el) => el.getBoundingClientRect()).map((r, i, all) => (i ? r.top - all[i - 1].bottom : 99)));
        assert.ok(gaps.every((gap) => gap >= 12), `tab ${i} gaps ${gaps}`);
        assert.ok(await page.evaluate(() => [...document.querySelectorAll(".screen.is-active .screen-scroll *")].filter((el) => !el.closest(".topics")).every((el) => el.getBoundingClientRect().right <= 321)), `tab ${i}`);
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

test("the first screen: languages never match, pace and interface language are kept", async () => {
    assert.equal(await page.locator("dialog input").count(), 0, "no name field: the name is the nickname");
    await page.locator("dialog .screen-title", { hasText: "Hi, tester!" }).waitFor();
    await page.click('dialog .cell:has-text("I learn")');
    await page.locator("dialog").last().locator('[data-value="English"]').click();
    await page.waitForFunction(() => document.querySelectorAll("dialog").length === 1);
    await page.click('dialog [data-value="calm"]');
    await page.click('dialog .cell:has-text("App language")');
    await page.locator("dialog").last().locator('[data-value="ru"]').click();
    await page.waitForFunction(() => document.querySelectorAll("dialog").length === 1);
    // Escape must not close the first screen, even when focus has fallen to <body>.
    await page.evaluate(() => document.activeElement.blur());
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.click("dialog .session-footer .btn-primary");
    await page.waitForFunction(() => JSON.parse(localStorage.mellow_state).dictionaries.length === 2);
    const { username, settings } = await state();
    assert.deepEqual([username, settings.native, settings.target, settings.newPerDay, settings.dailyGoal, settings.language], ["tester", "Spanish", "English", 5, 10, "ru"]);
    // The guide follows the first screen: forward, back, then "Start learning" on the last story.
    await page.locator("dialog .tour").waitFor();
    for (let i = 0; i < 4; i++) await page.click("dialog .tour .session-footer .btn-primary");
    await page.locator("dialog .tour-title", { hasText: "облаке" }).waitFor();
    await page.click("dialog .tour .session-footer .btn-primary");
    await page.waitForFunction(() => !document.querySelector("dialog"));
});

test("a new release is offered, and \"Update\" switches to it", async () => {
    await start();
    await page.waitForFunction(() => navigator.serviceWorker?.controller, null, { timeout: 15000 });
    nextVersion = "99.0.0";
    try {
        await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()));
        await page.locator("dialog", { hasText: "Update available" }).waitFor({ timeout: 15000 });
        await Promise.all([page.waitForEvent("load"), page.click('dialog .btn-primary:has-text("Update")')]);
        await page.waitForFunction(() => caches.keys().then((keys) => keys.includes("mellow-99.0.0") && keys.length === 1), null, { timeout: 15000 });
    } finally {
        nextVersion = null;
    }
});
