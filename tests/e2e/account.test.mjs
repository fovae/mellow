// Accounts end to end, against a running Worker (wrangler dev): see docs/SERVER.md.
// MELLOW_URL=http://localhost:8787/ BROWSER=webkit node --test account.test.mjs
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import playwright from "playwright";

const url = process.env.MELLOW_URL;
let browser;
before(async () => { if (url) browser = await playwright[process.env.BROWSER ?? "chromium"].launch(); });
after(() => browser?.close());

async function device() {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "en-US" });
    const page = await context.newPage();
    const problems = [];
    page.on("pageerror", (error) => problems.push(error.message));
    // WebKit's own password AutoFill adds an inline stylesheet on submit, which the CSP blocks: not ours.
    page.on("console", (message) => message.type() === "error" && !message.text().startsWith("Refused to apply a stylesheet") && problems.push(message.text()));
    await page.addInitScript(() => sessionStorage.setItem("mellow_loader_seen", "1"));
    await page.goto(url);
    return { context, page, problems };
}
const me = (page) => page.evaluate(() => fetch("/api/me").then((r) => r.json()));
const state = (page) => page.evaluate(() => JSON.parse(localStorage.mellow_state));
const fill = async (page, label, value) => page.getByLabel(label, { exact: true }).fill(value);

test("an account: sign up on one device, load the copy on another, weekly save, delete", { skip: !url && "MELLOW_URL is not set" }, async () => {
    const nick = `t${Date.now() % 1e9}`;
    const password = "correct horse 1";

    // First device: the first screen, then the account in settings.
    const one = await device();
    await one.page.getByRole("button", { name: "Sign in" }).waitFor();
    await one.page.fill("dialog .setup-name", "Alex");
    await one.page.click("dialog .btn-primary");
    await one.page.waitForFunction(() => JSON.parse(localStorage.mellow_state ?? "{}").dictionaries?.length === 2);
    await one.page.waitForFunction(() => !document.querySelector("dialog"));
    await one.page.click(".tab:nth-child(5)");
    await one.page.locator(".screen.is-active .cell", { hasText: "Account" }).click();
    await one.page.getByRole("button", { name: "Create an account" }).click();
    await one.page.getByRole("dialog", { name: "New account" }).waitFor();
    await fill(one.page, "Nickname (latin letters, digits, _)", nick);
    await fill(one.page, "New password", "short");
    await one.page.getByRole("button", { name: "Create account" }).click();
    await one.page.getByText("Password: at least 8 characters").waitFor();
    await fill(one.page, "New password", password);
    await one.page.getByRole("button", { name: "Create account" }).click();
    const code = await one.page.locator(".recovery-code").textContent();
    assert.match(code, /^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/);
    await one.page.getByRole("button", { name: "I saved the code" }).click();
    await one.page.waitForFunction(() => JSON.parse(localStorage.mellow_account ?? "{}").cloudAt);
    const first = await me(one.page);
    assert.equal(first.nick, nick);
    assert.ok(first.backup.savedAt);
    // The session cookie is not readable by scripts.
    assert.equal(await one.page.evaluate(() => document.cookie), "");

    // Second device: sign in from the first screen and load the copy.
    const two = await device();
    await two.page.getByRole("button", { name: "Sign in" }).click();
    await two.page.getByRole("dialog", { name: "Sign in" }).waitFor();
    await fill(two.page, "Nickname (latin letters, digits, _)", nick);
    await fill(two.page, "Password", "wrong password");
    await two.page.getByRole("button", { name: "Sign in", exact: true }).last().click();
    await two.page.getByText("Wrong nickname or password").waitFor();
    two.problems.length = 0; // the browser logs that 401 by itself
    await fill(two.page, "Password", password);
    await two.page.getByRole("button", { name: "Sign in", exact: true }).last().click();
    await two.page.getByText("Load the copy from the cloud?").waitFor();
    await two.page.getByRole("button", { name: "Restore", exact: true }).click();
    await two.page.waitForFunction(() => JSON.parse(localStorage.mellow_state ?? "{}").username === "Alex");
    await two.page.waitForFunction(() => !document.querySelector("dialog[open]"));
    const [a, b] = [await state(one.page), await state(two.page)];
    assert.deepEqual(b.dictionaries.map((d) => d.words.length), a.dictionaries.map((d) => d.words.length));

    // A week later the device saves by itself; the cloud keeps the previous copy.
    await two.page.evaluate(() => {
        const local = JSON.parse(localStorage.mellow_account);
        localStorage.mellow_account = JSON.stringify({ ...local, cloudAt: Date.now() - 8 * 86400000 });
    });
    await two.page.reload();
    await two.page.waitForFunction(() => Date.now() - JSON.parse(localStorage.mellow_account).cloudAt < 60000);
    const second = await me(two.page);
    assert.ok(second.backup.savedAt > first.backup.savedAt);
    assert.equal(second.backup.previousAt, first.backup.savedAt);

    // "Reset all data" unlinks the device: its empty state is not saved over the cloud copy by itself.
    await two.page.evaluate(async () => (await import("/js/core/store.js")).resetAll());
    assert.equal(await two.page.evaluate(() => JSON.parse(localStorage.mellow_account).linked), false);

    // Delete from the first device: the second one is signed out too.
    await one.page.locator(".screen.is-active .cell", { hasText: "Account" }).click();
    await one.page.getByRole("button", { name: "Delete account" }).click();
    await fill(one.page, "Password", password);
    await one.page.locator("dialog .btn-danger").click();
    await one.page.getByText("Account deleted").waitFor();
    assert.equal((await me(two.page)).nick, null);
    assert.equal(await one.page.evaluate(() => localStorage.getItem("mellow_account")), null);

    await one.context.close();
    await two.context.close();
    assert.deepEqual([...one.problems, ...two.problems], []);
});
