// The account API against a real SQLite (node:sqlite) that behaves like D1.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { gzipSync } from "node:zlib";
import { handleApi, COOKIE, DAILY, MAX_BACKUP } from "../server/api.js";
import { deriveKey } from "../js/core/account.js";

// D1's prepare/bind/first/run/batch on top of node:sqlite.
function fakeD1() {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON");
    db.exec(readFileSync(new URL("../server/schema.sql", import.meta.url), "utf8"));
    const statement = (sql, args = []) => ({
        bind: (...values) => statement(sql, values),
        first: async () => db.prepare(sql).get(...args) ?? null,
        all: async () => ({ results: db.prepare(sql).all(...args) }),
        run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...args).changes) } }),
        runNow: () => db.prepare(sql).run(...args),
    });
    return {
        raw: db,
        prepare: (sql) => statement(sql),
        batch: async (list) => {
            db.exec("BEGIN");
            try { list.forEach((s) => s.runNow()); db.exec("COMMIT"); } catch (e) { db.exec("ROLLBACK"); throw e; }
        },
    };
}

const limiter = (max = Infinity) => {
    const counts = new Map();
    return { limit: async ({ key }) => { counts.set(key, (counts.get(key) ?? 0) + 1); return { success: counts.get(key) <= max }; } };
};

const ORIGIN = "https://mellow.example";
function setup(limits = {}) {
    const env = { DB: fakeD1(), PEPPER: "p".repeat(40), AUTH_LIMIT: limiter(limits.auth), SAVE_LIMIT: limiter(limits.save) };
    let now = Date.UTC(2026, 10, 26, 12);
    const call = async (method, path, { body, cookie, headers = {}, raw } = {}) => {
        const init = { method, headers: { origin: ORIGIN, "sec-fetch-site": "same-origin", ...headers } };
        if (cookie) init.headers.cookie = `${COOKIE}=${cookie}`;
        if (raw) { init.body = raw; init.headers["content-type"] ??= "application/octet-stream"; }
        else if (body) { init.body = JSON.stringify(body); init.headers["content-type"] = "application/json"; }
        const response = await handleApi(new Request(ORIGIN + path, init), env, now);
        const setCookie = response.headers.get("set-cookie");
        const token = setCookie?.match(new RegExp(`${COOKIE}=([^;]*)`))?.[1];
        const type = response.headers.get("content-type") ?? "";
        const data = type.includes("json") ? await response.json() : new Uint8Array(await response.arrayBuffer());
        return { status: response.status, data, token, setCookie, response };
    };
    return { env, call, tick: (ms) => { now += ms; } };
}

// A fast key for tests; the app uses 600,000 rounds.
const key = (password, nick = "anna") => deriveKey(nick, password, 1000);
const backup = (text = "{}") => gzipSync(Buffer.from(text));

test("sign up, see the account, sign in elsewhere, sign out", async () => {
    const { call } = setup();
    const up = await call("POST", "/api/signup", { body: { nick: "Anna", key: await key("secret-1") } });
    assert.equal(up.status, 201);
    assert.equal(up.data.nick, "anna");
    assert.match(up.data.recovery, /^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/);
    assert.match(up.setCookie, /HttpOnly/);
    assert.match(up.setCookie, /SameSite=Strict/);
    assert.match(up.setCookie, /Secure/);

    const me = await call("GET", "/api/me", { cookie: up.token });
    assert.deepEqual(me.data, { nick: "anna", backup: null });
    assert.equal(me.response.headers.get("cache-control"), "no-store");

    const wrong = await call("POST", "/api/login", { body: { nick: "anna", key: await key("secret-2") } });
    assert.equal(wrong.status, 401);
    const unknown = await call("POST", "/api/login", { body: { nick: "nobody", key: await key("secret-1") } });
    assert.deepEqual([unknown.status, unknown.data], [wrong.status, wrong.data]);

    const second = await call("POST", "/api/login", { body: { nick: "ANNA", key: await key("secret-1") } });
    assert.equal(second.status, 200);
    assert.notEqual(second.token, up.token);

    assert.equal((await call("POST", "/api/logout", { cookie: second.token })).status, 200);
    assert.deepEqual((await call("GET", "/api/me", { cookie: second.token })).data, { nick: null, backup: null });
    assert.equal((await call("GET", "/api/me", { cookie: up.token })).data.nick, "anna");
});

test("nicknames: format and one owner", async () => {
    const { call } = setup();
    for (const nick of ["ab", "anna maria", "анна", "a".repeat(21), ""]) {
        assert.equal((await call("POST", "/api/signup", { body: { nick, key: await key("x") } })).status, 400, nick);
    }
    assert.equal((await call("POST", "/api/signup", { body: { nick: "anna_1", key: await key("x") } })).status, 201);
    assert.equal((await call("POST", "/api/signup", { body: { nick: "ANNA_1", key: await key("y") } })).status, 409);
    assert.equal((await call("POST", "/api/signup", { body: { nick: "bob", key: "short" } })).status, 400);
});

test("the server keeps no password and no session token", async () => {
    const { call, env } = setup();
    const k = await key("secret-1");
    const up = await call("POST", "/api/signup", { body: { nick: "anna", key: k } });
    const dump = JSON.stringify([...env.DB.raw.prepare("SELECT * FROM users").all(), ...env.DB.raw.prepare("SELECT * FROM sessions").all()]);
    assert.ok(!dump.includes(k));
    assert.ok(!dump.includes(up.token));
    assert.ok(!dump.includes(up.data.recovery.replaceAll("-", "")));
});

test("backups: save, read, keep the previous one, only one's own", async () => {
    const { call, tick } = setup();
    const anna = (await call("POST", "/api/signup", { body: { nick: "anna", key: await key("a-secret") } })).token;
    const bob = (await call("POST", "/api/signup", { body: { nick: "bob", key: await key("b-secret", "bob") } })).token;

    assert.equal((await call("GET", "/api/backup", { cookie: anna })).status, 404);
    const first = backup('{"n":1}');
    assert.equal((await call("PUT", "/api/backup", { cookie: anna, raw: first })).status, 200);
    tick(1000);
    const second = backup('{"n":2}');
    await call("PUT", "/api/backup", { cookie: anna, raw: second });

    assert.deepEqual((await call("GET", "/api/backup", { cookie: anna })).data, new Uint8Array(second));
    assert.deepEqual((await call("GET", "/api/backup?which=previous", { cookie: anna })).data, new Uint8Array(first));
    const me = (await call("GET", "/api/me", { cookie: anna })).data;
    assert.equal(me.backup.savedAt - me.backup.previousAt, 1000);

    // Bob sees nothing of Anna's and cannot ask for it.
    assert.equal((await call("GET", "/api/backup", { cookie: bob })).status, 404);
    assert.equal((await call("GET", "/api/backup?user_id=anna", { cookie: bob })).status, 404);
    assert.equal((await call("GET", "/api/backup")).status, 401);
    assert.equal((await call("GET", "/api/backup", { cookie: "A".repeat(43) })).status, 401);
});

test("backups: size, format and daily limits", async () => {
    const { call, tick } = setup();
    const token = (await call("POST", "/api/signup", { body: { nick: "anna", key: await key("a-secret") } })).token;
    assert.equal((await call("PUT", "/api/backup", { cookie: token, raw: Buffer.from("not gzip at all, just text") })).status, 400);
    assert.equal((await call("PUT", "/api/backup", { cookie: token, raw: Buffer.alloc(MAX_BACKUP + 1, 0x1f) })).status, 413);
    assert.equal((await call("PUT", "/api/backup", { cookie: token, raw: backup(), headers: { "content-type": "text/plain" } })).status, 415);
    for (let i = 0; i < 20; i++) assert.equal((await call("PUT", "/api/backup", { cookie: token, raw: backup() })).status, 200);
    assert.equal((await call("PUT", "/api/backup", { cookie: token, raw: backup() })).status, 429);
    tick(86400000);
    assert.equal((await call("PUT", "/api/backup", { cookie: token, raw: backup() })).status, 200);
});

test("requests from other sites are refused", async () => {
    const { call } = setup();
    const token = (await call("POST", "/api/signup", { body: { nick: "anna", key: await key("a-secret") } })).token;
    const evil = { origin: "https://evil.example", "sec-fetch-site": "cross-site" };
    assert.equal((await call("PUT", "/api/backup", { cookie: token, raw: backup(), headers: evil })).status, 403);
    assert.equal((await call("POST", "/api/logout", { cookie: token, headers: { origin: "" } })).status, 403);
    assert.equal((await call("POST", "/api/login", { body: {}, headers: { "sec-fetch-site": "same-site" } })).status, 403);
});

test("password change signs out other devices; recovery code works once", async () => {
    const { call } = setup();
    const up = await call("POST", "/api/signup", { body: { nick: "anna", key: await key("old-secret") } });
    const other = (await call("POST", "/api/login", { body: { nick: "anna", key: await key("old-secret") } })).token;

    assert.equal((await call("POST", "/api/password", { cookie: up.token, body: { key: await key("wrong"), newKey: await key("new-secret") } })).status, 401);
    assert.equal((await call("POST", "/api/password", { cookie: up.token, body: { key: await key("old-secret"), newKey: await key("new-secret") } })).status, 200);
    assert.equal((await call("GET", "/api/me", { cookie: other })).data.nick, null);
    assert.equal((await call("GET", "/api/me", { cookie: up.token })).data.nick, "anna");
    assert.equal((await call("POST", "/api/login", { body: { nick: "anna", key: await key("new-secret") } })).status, 200);

    const code = up.data.recovery.toLowerCase().replaceAll("-", " ");
    const recovered = await call("POST", "/api/recover", { body: { nick: "anna", code, key: await key("third-secret") } });
    assert.equal(recovered.status, 200);
    assert.notEqual(recovered.data.recovery, up.data.recovery);
    assert.equal((await call("GET", "/api/me", { cookie: up.token })).data.nick, null);
    assert.equal((await call("POST", "/api/recover", { body: { nick: "anna", code, key: await key("x") } })).status, 401);
    assert.equal((await call("POST", "/api/login", { body: { nick: "anna", key: await key("third-secret") } })).status, 200);

    const fresh = await call("POST", "/api/recovery-code", { cookie: recovered.token, body: { key: await key("third-secret") } });
    assert.equal(fresh.status, 200);
    assert.equal((await call("POST", "/api/recover", { body: { nick: "anna", code: recovered.data.recovery, key: await key("x") } })).status, 401);
});

test("deleting the account removes everything and needs the password", async () => {
    const { call, env } = setup();
    const token = (await call("POST", "/api/signup", { body: { nick: "anna", key: await key("a-secret") } })).token;
    await call("PUT", "/api/backup", { cookie: token, raw: backup() });
    assert.equal((await call("DELETE", "/api/account", { cookie: token, body: { key: await key("wrong") } })).status, 401);
    const gone = await call("DELETE", "/api/account", { cookie: token, body: { key: await key("a-secret") } });
    assert.equal(gone.status, 200);
    assert.match(gone.setCookie, /Max-Age=0/);
    for (const table of ["users", "sessions", "backups"]) assert.equal(env.DB.raw.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n, 0, table);
    assert.equal((await call("POST", "/api/signup", { body: { nick: "anna", key: await key("b-secret") } })).status, 201);
});

test("rate limits and the daily cap of the whole service", async () => {
    const { call } = setup({ auth: 3 });
    for (let i = 0; i < 3; i++) await call("POST", "/api/login", { body: { nick: "anna", key: await key("x") } });
    assert.equal((await call("POST", "/api/login", { body: { nick: "anna", key: await key("x") } })).status, 429);

    const busy = setup();
    busy.env.DB.raw.prepare("INSERT INTO daily (day, kind, n) VALUES ('2026-11-26', 'signup', ?)").run(DAILY.signup);
    assert.equal((await busy.call("POST", "/api/signup", { body: { nick: "anna", key: await key("x") } })).status, 503);
});

test("no secret, no service; unknown routes are 404", async () => {
    const { call, env } = setup();
    assert.equal((await call("GET", "/api/nothing")).status, 404);
    env.PEPPER = "short";
    assert.equal((await call("POST", "/api/signup", { body: { nick: "anna", key: await key("x") } })).status, 500);
});
