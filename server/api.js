// The account API. A nickname and a password, one cloud backup per user, nothing is synced by itself.
// The password never reaches the server: the device sends a key derived from it (PBKDF2, see js/core/account.js),
// and the server stores only HMAC(pepper, salt + key). The pepper is a secret of the Worker, not in the database.

const NICK = /^[a-z0-9_]{3,20}$/;
const KEY = /^[A-Za-z0-9_-]{43}$/; // 32 bytes in base64url
const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I
const DAY = 86400000;
const SESSION_DAYS = 180;
const SESSIONS_PER_USER = 10;
const SAVES_PER_USER = 20; // a day
export const MAX_BACKUP = 600 * 1024; // gzip bytes; base64 of two copies stays under D1's 2 MB row
// Whole service, a day. Worst case about 1000*3 + 5000*2 + 20000*2 = 53,000 written rows: under the free 100,000.
export const DAILY = { signup: 1000, login: 5000, save: 20000 };
export const COOKIE = "__Host-mellow";

class HttpError extends Error {
    constructor(status, code) {
        super(code);
        this.status = status;
        this.code = code;
    }
}
const stop = (status, code) => { throw new HttpError(status, code); };

const encoder = new TextEncoder();

export function toBase64(bytes) {
    let text = "";
    for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(text);
}
export const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
const toUrl = (bytes) => toBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
const fromUrl = (text) => fromBase64(text.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (text.length % 4)) % 4));
const random = (n) => crypto.getRandomValues(new Uint8Array(n));
const join = (...parts) => {
    const all = parts.map((p) => (typeof p === "string" ? encoder.encode(p) : p));
    const out = new Uint8Array(all.reduce((sum, p) => sum + p.length, 0));
    let at = 0;
    for (const p of all) { out.set(p, at); at += p.length; }
    return out;
};

async function hmac(env, ...parts) {
    const key = await crypto.subtle.importKey("raw", encoder.encode(env.PEPPER), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return toBase64(new Uint8Array(await crypto.subtle.sign("HMAC", key, join(...parts))));
}
const sha256 = async (bytes) => toUrl(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)));

// Compares without stopping at the first difference.
function same(a, b) {
    let diff = a.length ^ b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    return diff === 0;
}

const passwordHash = (env, salt, key) => hmac(env, "password\n", fromBase64(salt), fromUrl(key));
const codeHash = (env, code) => hmac(env, "recovery\n", code);
const newCode = () => Array.from(random(16), (n) => CODE_LETTERS[n % 32]).join(""); // 32 divides 256: no bias
const formatCode = (code) => code.match(/.{4}/g).join("-");
const today = (now) => new Date(now).toISOString().slice(0, 10);

// Responses ----------------------------------------------------------------

const json = (body, status = 200, headers = {}) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });

// WebKit drops Secure cookies on http://localhost, so local development may turn Secure off (.dev.vars only).
const devCookie = (env) => env.DEV_HTTP_COOKIE === "1";
const cookieName = (env) => (devCookie(env) ? "mellow-dev" : COOKIE);
const cookieFlags = (env) => `Path=/; ${devCookie(env) ? "" : "Secure; "}HttpOnly; SameSite=Strict`;
const cookie = (env, token) => `${cookieName(env)}=${token}; ${cookieFlags(env)}; Max-Age=${SESSION_DAYS * 86400}`;
const noCookie = (env) => `${cookieName(env)}=; ${cookieFlags(env)}; Max-Age=0`;

// Requests -----------------------------------------------------------------

// Reads at most max bytes, so a huge body is refused before it fills the memory.
async function readBody(request, max) {
    if (Number(request.headers.get("content-length")) > max) stop(413, "too_big");
    const chunks = [];
    let size = 0;
    if (request.body) {
        for await (const chunk of request.body) {
            size += chunk.length;
            if (size > max) stop(413, "too_big");
            chunks.push(chunk);
        }
    }
    return join(...chunks);
}

async function readJson(request) {
    if (!request.headers.get("content-type")?.startsWith("application/json")) stop(415, "type");
    try {
        const body = JSON.parse(new TextDecoder().decode(await readBody(request, 2048)));
        return body && typeof body === "object" ? body : stop(400, "bad");
    } catch (error) {
        if (error instanceof HttpError) throw error;
        return stop(400, "bad");
    }
}

const nickOf = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");
const keyOf = (value) => (typeof value === "string" && KEY.test(value) ? value : stop(400, "bad"));

// Changing requests must come from our own pages: together with SameSite=Strict this stops CSRF.
function sameOrigin(request, url) {
    const site = request.headers.get("sec-fetch-site");
    return request.headers.get("origin") === url.origin && (!site || site === "same-origin");
}

async function limit(binding, key) {
    if (!binding) stop(500, "config");
    const { success } = await binding.limit({ key });
    if (!success) stop(429, "slow");
}

// Counts an action of the whole service for today; refuses above the cap.
async function countDaily(env, kind, now) {
    const row = await env.DB.prepare(
        "INSERT INTO daily (day, kind, n) VALUES (?1, ?2, 1) ON CONFLICT (day, kind) DO UPDATE SET n = n + 1 RETURNING n",
    ).bind(today(now), kind).first();
    if (row.n > DAILY[kind]) stop(503, "busy");
}

function readCookie(request, env) {
    for (const part of (request.headers.get("cookie") ?? "").split(";")) {
        const [name, ...value] = part.trim().split("=");
        if (name === cookieName(env)) return value.join("=");
    }
    return null;
}

async function session(request, env, now) {
    const token = readCookie(request, env);
    if (!token || !KEY.test(token)) stop(401, "signed_out");
    const id = await sha256(fromUrl(token));
    const row = await env.DB.prepare(
        "SELECT s.id, u.id AS user_id, u.nick, u.salt, u.hash FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?1 AND s.expires_at > ?2",
    ).bind(id, now).first();
    return row ?? stop(401, "signed_out");
}

// A new session: returns the statement to run and the cookie to set.
async function newSession(env, userId, now) {
    const token = toUrl(random(32));
    const insert = env.DB.prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)")
        .bind(await sha256(fromUrl(token)), userId, now, now + SESSION_DAYS * DAY);
    return { insert, cookie: cookie(env, token) };
}

// Old and extra sessions of a user go away when a new one starts.
const pruneSessions = (env, userId, now) => env.DB.prepare(
    "DELETE FROM sessions WHERE user_id = ?1 AND (expires_at <= ?2 OR id NOT IN (SELECT id FROM sessions WHERE user_id = ?1 ORDER BY created_at DESC LIMIT ?3))",
).bind(userId, now, SESSIONS_PER_USER - 1);

async function checkPassword(env, user, key) {
    if (!same(await passwordHash(env, user.salt, key), user.hash)) stop(401, "wrong");
}

const ip = (request) => request.headers.get("cf-connecting-ip") ?? "local";

// Routes -------------------------------------------------------------------

async function signup(request, env, now) {
    await limit(env.AUTH_LIMIT, `ip:${ip(request)}`);
    const body = await readJson(request);
    const nick = nickOf(body.nick);
    if (!NICK.test(nick)) stop(400, "nick");
    const key = keyOf(body.key);
    if (await env.DB.prepare("SELECT 1 FROM users WHERE nick = ?1").bind(nick).first()) stop(409, "taken");
    await countDaily(env, "signup", now);

    const id = toUrl(random(16));
    const salt = toBase64(random(16));
    const code = newCode();
    const { insert, cookie: setCookie } = await newSession(env, id, now);
    try {
        await env.DB.batch([
            env.DB.prepare("INSERT INTO users (id, nick, salt, hash, recovery, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
                .bind(id, nick, salt, await passwordHash(env, salt, key), await codeHash(env, code), now),
            insert,
        ]);
    } catch (error) {
        // Two sign-ups with one nickname at the same moment.
        if (/UNIQUE/i.test(String(error?.message))) stop(409, "taken");
        throw error;
    }
    return json({ nick, recovery: formatCode(code) }, 201, { "set-cookie": setCookie });
}

// A fixed salt for unknown nicknames: the answer takes the same time and says the same thing.
const DUMMY = { salt: toBase64(new Uint8Array(16)), hash: "" };

async function login(request, env, now) {
    await limit(env.AUTH_LIMIT, `ip:${ip(request)}`);
    const body = await readJson(request);
    const nick = nickOf(body.nick);
    const key = typeof body.key === "string" && KEY.test(body.key) ? body.key : null;
    if (!NICK.test(nick) || !key) stop(401, "wrong");
    await limit(env.AUTH_LIMIT, `nick:${nick}`);
    const user = await env.DB.prepare("SELECT id, nick, salt, hash FROM users WHERE nick = ?1").bind(nick).first();
    await checkPassword(env, user ?? DUMMY, key);
    await countDaily(env, "login", now);
    const { insert, cookie: setCookie } = await newSession(env, user.id, now);
    await env.DB.batch([pruneSessions(env, user.id, now), insert]);
    return json({ nick: user.nick }, 200, { "set-cookie": setCookie });
}

async function logout(request, env, now) {
    const token = readCookie(request, env);
    if (token && KEY.test(token)) await env.DB.prepare("DELETE FROM sessions WHERE id = ?1").bind(await sha256(fromUrl(token))).run();
    return json({ ok: true }, 200, { "set-cookie": noCookie(env) });
}

// Signed out is a normal answer here, not an error: the app asks this at every start.
async function me(request, env, now) {
    const user = await session(request, env, now).catch((error) => (error.code === "signed_out" ? null : Promise.reject(error)));
    if (!user) return json({ nick: null, backup: null });
    const backup = await env.DB.prepare("SELECT saved_at, size, prev_saved_at FROM backups WHERE user_id = ?1").bind(user.user_id).first();
    return json({
        nick: user.nick,
        backup: backup ? { savedAt: backup.saved_at, size: backup.size, previousAt: backup.prev_saved_at ?? null } : null,
    });
}

async function saveBackup(request, env, now) {
    const user = await session(request, env, now);
    await limit(env.SAVE_LIMIT, `user:${user.user_id}`);
    if (request.headers.get("content-type") !== "application/octet-stream") stop(415, "type");
    const data = await readBody(request, MAX_BACKUP);
    if (data.length < 18 || data[0] !== 0x1f || data[1] !== 0x8b) stop(400, "not_gzip");
    await countDaily(env, "save", now);
    const day = today(now);
    // The previous copy is kept: one bad save cannot erase the user's words.
    const result = await env.DB.prepare(`
        INSERT INTO backups (user_id, data, saved_at, size, day, saves) VALUES (?1, ?2, ?3, ?4, ?5, 1)
        ON CONFLICT (user_id) DO UPDATE SET
            prev_data = data, prev_saved_at = saved_at, data = ?2, saved_at = ?3, size = ?4,
            saves = CASE WHEN day = ?5 THEN saves + 1 ELSE 1 END, day = ?5
        WHERE backups.day <> ?5 OR backups.saves < ?6`,
    ).bind(user.user_id, toBase64(data), now, data.length, day, SAVES_PER_USER).run();
    if (!result.meta.changes) stop(429, "saves_today");
    return json({ savedAt: now, size: data.length });
}

async function loadBackup(request, env, now, url) {
    const user = await session(request, env, now);
    const previous = url.searchParams.get("which") === "previous";
    const row = await env.DB.prepare(`SELECT ${previous ? "prev_data" : "data"} AS data FROM backups WHERE user_id = ?1`).bind(user.user_id).first();
    if (!row?.data) stop(404, "no_backup");
    return new Response(fromBase64(row.data), { headers: { "content-type": "application/octet-stream" } });
}

async function changePassword(request, env, now) {
    const user = await session(request, env, now);
    await limit(env.AUTH_LIMIT, `nick:${user.nick}`);
    const body = await readJson(request);
    await checkPassword(env, user, keyOf(body.key));
    const salt = toBase64(random(16));
    // Other devices are signed out.
    await env.DB.batch([
        env.DB.prepare("UPDATE users SET salt = ?1, hash = ?2 WHERE id = ?3").bind(salt, await passwordHash(env, salt, keyOf(body.newKey)), user.user_id),
        env.DB.prepare("DELETE FROM sessions WHERE user_id = ?1 AND id <> ?2").bind(user.user_id, user.id),
    ]);
    return json({ ok: true });
}

async function newRecoveryCode(request, env, now) {
    const user = await session(request, env, now);
    await limit(env.AUTH_LIMIT, `nick:${user.nick}`);
    const body = await readJson(request);
    await checkPassword(env, user, keyOf(body.key));
    const code = newCode();
    await env.DB.prepare("UPDATE users SET recovery = ?1 WHERE id = ?2").bind(await codeHash(env, code), user.user_id).run();
    return json({ recovery: formatCode(code) });
}

// A forgotten password: the recovery code sets a new one, gives a new code and signs out everywhere else.
async function recover(request, env, now) {
    await limit(env.AUTH_LIMIT, `ip:${ip(request)}`);
    const body = await readJson(request);
    const nick = nickOf(body.nick);
    const code = typeof body.code === "string" ? body.code.toUpperCase().replace(/[\s-]/g, "") : "";
    const key = keyOf(body.key);
    if (!NICK.test(nick) || !/^[A-Z0-9]{16}$/.test(code)) stop(401, "wrong");
    await limit(env.AUTH_LIMIT, `nick:${nick}`);
    const user = await env.DB.prepare("SELECT id, nick, recovery FROM users WHERE nick = ?1").bind(nick).first();
    const hash = await codeHash(env, code);
    if (!user || !same(hash, user.recovery)) stop(401, "wrong");
    await countDaily(env, "login", now);
    const salt = toBase64(random(16));
    const next = newCode();
    const { insert, cookie: setCookie } = await newSession(env, user.id, now);
    await env.DB.batch([
        env.DB.prepare("UPDATE users SET salt = ?1, hash = ?2, recovery = ?3 WHERE id = ?4")
            .bind(salt, await passwordHash(env, salt, key), await codeHash(env, next), user.id),
        env.DB.prepare("DELETE FROM sessions WHERE user_id = ?1").bind(user.id),
        insert,
    ]);
    return json({ nick: user.nick, recovery: formatCode(next) }, 200, { "set-cookie": setCookie });
}

async function deleteAccount(request, env, now) {
    const user = await session(request, env, now);
    await limit(env.AUTH_LIMIT, `nick:${user.nick}`);
    const body = await readJson(request);
    await checkPassword(env, user, keyOf(body.key));
    await env.DB.batch([
        env.DB.prepare("DELETE FROM backups WHERE user_id = ?1").bind(user.user_id),
        env.DB.prepare("DELETE FROM sessions WHERE user_id = ?1").bind(user.user_id),
        env.DB.prepare("DELETE FROM users WHERE id = ?1").bind(user.user_id),
    ]);
    return json({ ok: true }, 200, { "set-cookie": noCookie(env) });
}

const routes = {
    "POST /api/signup": signup,
    "POST /api/login": login,
    "POST /api/logout": logout,
    "GET /api/me": me,
    "PUT /api/backup": saveBackup,
    "GET /api/backup": loadBackup,
    "POST /api/password": changePassword,
    "POST /api/recovery-code": newRecoveryCode,
    "POST /api/recover": recover,
    "DELETE /api/account": deleteAccount,
};

const SECURITY_HEADERS = {
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "cross-origin-resource-policy": "same-origin",
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
};

export async function handleApi(request, env, now = Date.now()) {
    const url = new URL(request.url);
    const route = routes[`${request.method} ${url.pathname}`];
    let response;
    try {
        if (!route) stop(404, "not_found");
        if (request.method !== "GET" && !sameOrigin(request, url)) stop(403, "origin");
        if (typeof env.PEPPER !== "string" || env.PEPPER.length < 32) stop(500, "config");
        response = await route(request, env, now, url);
    } catch (error) {
        if (!(error instanceof HttpError)) console.error(error);
        const status = error instanceof HttpError ? error.status : 500;
        response = json({ error: error instanceof HttpError ? error.code : "server" }, status,
            status === 401 && error.code === "signed_out" ? { "set-cookie": noCookie(env) } : {});
    }
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
    return response;
}
