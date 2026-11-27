// Accounts end to end, against a running Worker (wrangler dev or the live site): see docs/SERVER.md.
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
const state = (page) => page.evaluate(() => JSON.parse(localStorage.mellow_state ?? "{}"));
const authScreen = (page) => page.locator("dialog #auth");
const submit = (page) => page.locator('dialog button[form="auth"]').click();

test("accounts: the sign-in screen comes first, sign up, another device, sign out, delete", { skip: !url && "MELLOW_URL is not set" }, async () => {
    const nick = `t${Date.now() % 1e9}`;
    const password = "correct horse 1";

    // First device: the sign-in screen cannot be skipped.
    const one = await device();
    await authScreen(one.page).waitFor();
    await one.page.keyboard.press("Escape");
    await one.page.keyboard.press("Escape");
    assert.equal(await authScreen(one.page).count(), 1);
    await one.page.getByLabel("Nickname").fill(nick);
    await one.page.getByLabel("Password").fill("short");
    await submit(one.page);
    await one.page.getByText("Password: at least 8 characters").waitFor();
    await one.page.getByLabel("Password").fill(password);
    await submit(one.page);
    const code = await one.page.locator(".recovery-code").textContent();
    assert.match(code, /^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/);
    await one.page.getByRole("button", { name: "I saved the code" }).click();

    // Then the usual first screen; the new profile goes to the cloud at once.
    // No name field: the name is the nickname. The guide follows.
    assert.equal(await one.page.locator("dialog #setup input").count(), 0);
    await one.page.click("dialog .session-footer .btn-primary");
    await one.page.waitForFunction(() => JSON.parse(localStorage.mellow_state ?? "{}").dictionaries?.length === 2);
    await one.page.waitForFunction(() => JSON.parse(localStorage.mellow_account ?? "{}").cloudAt);
    await one.page.click("dialog .tour-skip");
    await one.page.waitForFunction(() => !document.querySelector("dialog"));
    assert.equal((await state(one.page)).username, nick);
    const first = await me(one.page);
    assert.equal(first.nick, nick);
    assert.ok(first.backup.savedAt);
    assert.equal(await one.page.evaluate(() => document.cookie), "", "the session cookie is not readable by scripts");

    // Second device: sign in; the copy loads by itself, no first screen.
    const two = await device();
    await authScreen(two.page).waitFor();
    await two.page.getByRole("button", { name: "Sign in", exact: true }).click();
    await two.page.getByLabel("Nickname").fill(nick);
    await two.page.getByLabel("Password").fill("wrong password");
    await submit(two.page);
    await two.page.getByText("Wrong nickname or password").waitFor();
    two.problems.length = 0; // the browser logs that 401 by itself
    await two.page.getByLabel("Password").fill(password);
    await submit(two.page);
    await two.page.waitForFunction((name) => JSON.parse(localStorage.mellow_state ?? "{}").username === name, nick);
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

    // Signing out saves, clears this device and shows the sign-in screen again.
    await two.page.click(".tab:nth-child(5)");
    await two.page.locator(".screen.is-active .cell", { hasText: "Account" }).click();
    await two.page.getByRole("button", { name: "Sign out" }).click();
    await two.page.locator("dialog .btn-danger").click();
    await authScreen(two.page).waitFor();
    assert.ok(!(await state(two.page)).username, "words left the device");
    assert.equal((await me(two.page)).nick, null);

    // Deleting the account on the first device: everything goes, the sign-in screen is back.
    await one.page.click(".tab:nth-child(5)");
    await one.page.locator(".screen.is-active .cell", { hasText: "Account" }).click();
    await one.page.getByRole("button", { name: "Delete account" }).click();
    await one.page.locator("dialog").last().getByLabel("Password").fill(password);
    await one.page.locator("dialog .btn-danger").click();
    await authScreen(one.page).waitFor();
    assert.equal(await one.page.evaluate(() => localStorage.getItem("mellow_account")), null);
    assert.ok(!(await state(one.page)).username, "words left the device");

    await one.context.close();
    await two.context.close();
    assert.deepEqual([...one.problems, ...two.problems], []);
});

test("accounts: a slow server still asks to sign in first, a code survives a reload, words of another account leave", { skip: !url && "MELLOW_URL is not set" }, async () => {
    const nick = `s${Date.now() % 1e9}`;
    const password = "correct horse 2";

    // The server answers after 6 s: no first screen behind its back, the sign-in screen still comes first.
    const slow = await device();
    await slow.page.route("**/api/me", async (route) => { await new Promise((r) => setTimeout(r, 6000)); await route.continue(); });
    await slow.page.reload();
    await slow.page.waitForTimeout(4500);
    assert.equal(await slow.page.locator("dialog #setup").count(), 0, "no first screen before the account");
    await authScreen(slow.page).waitFor({ timeout: 15000 });
    await slow.page.unroute("**/api/me");

    // A recovery code that was not confirmed comes back after a reload.
    await slow.page.getByLabel("Nickname").fill(nick);
    await slow.page.getByLabel("Password").fill(password);
    await submit(slow.page);
    const code = await slow.page.locator(".recovery-code").textContent();
    await slow.page.reload();
    assert.equal(await slow.page.locator(".recovery-code").textContent(), code);
    await slow.page.getByRole("button", { name: "I saved the code" }).click();
    await slow.page.locator("dialog #setup").waitFor();
    await slow.page.reload();
    assert.equal(await slow.page.locator(".recovery-code").count(), 0, "a confirmed code is not shown again");
    await slow.page.click("dialog .session-footer .btn-primary");
    await slow.page.waitForFunction(() => JSON.parse(localStorage.mellow_account ?? "{}").cloudAt);
    await slow.page.click("dialog .tour-skip");

    // A device with someone else's words: signing in clears them and loads this account's copy.
    const other = await device();
    const someone = { ...(await state(slow.page)), username: "Somebody Else" };
    someone.dictionaries[0].words.push({ ...someone.dictionaries[0].words[0], id: "someone", term: "someone's word" });
    await other.page.evaluate((value) => { localStorage.mellow_state = value; }, JSON.stringify(someone));
    await other.page.reload();
    await authScreen(other.page).waitFor();
    assert.equal(await other.page.getByLabel("Nickname").inputValue(), "", "no nickname of another account in New account");
    await other.page.getByRole("button", { name: "Sign in", exact: true }).click();
    await other.page.getByLabel("Nickname").fill(nick);
    await other.page.getByLabel("Password").fill(password);
    await submit(other.page);
    await other.page.waitForFunction((name) => JSON.parse(localStorage.mellow_state ?? "{}").username === name, nick);
    await other.page.waitForFunction(() => !document.querySelector("dialog[open]"));
    assert.ok(!JSON.stringify(await state(other.page)).includes("someone's word"), "words of another account left");

    // After signing out the sign-in screen opens on "Sign in" with the nickname.
    await other.page.click(".tab:nth-child(5)");
    await other.page.locator(".screen.is-active .cell", { hasText: "Account" }).click();
    await other.page.getByRole("button", { name: "Sign out" }).click();
    await other.page.locator("dialog .btn-danger").click();
    await authScreen(other.page).waitFor();
    assert.equal(await other.page.getByLabel("Nickname").inputValue(), nick);
    assert.equal(await other.page.locator('dialog .segment[aria-pressed="true"]').textContent(), "Sign in");

    await slow.context.close();
    await other.context.close();
    assert.deepEqual([...slow.problems, ...other.problems], []);
});
