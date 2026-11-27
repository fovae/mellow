// The account API. A nickname with a password or Google, one cloud backup per user, nothing is synced by itself.
// The password never reaches the server: the device sends a key derived from it (PBKDF2, see js/core/account.js),
// and the server stores only HMAC(pepper, salt + key). The pepper is a secret of the Worker, not in the database.
// Google: the usual OAuth code flow with PKCE, only the "openid" scope; the server keeps Google's account id and nothing else.

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
const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const GOOGLE_MINUTES = 10; // to finish a Google sign-in, nickname included

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
// The Google step lives in its own short cookie. Lax: it must come back with Google's redirect.
const googleName = (env) => (devCookie(env) ? "mellow-dev-google" : `${COOKIE}-google`);
const googleCookie = (env, value) =>
    `${googleName(env)}=${value}; Path=/; ${devCookie(env) ? "" : "Secure; "}HttpOnly; SameSite=Lax; Max-Age=${value ? GOOGLE_MINUTES * 60 : 0}`;

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

function readCookie(request, env, name = cookieName(env)) {
    for (const part of (request.headers.get("cookie") ?? "").split(";")) {
        const [key, ...value] = part.trim().split("=");
        if (key === name) return value.join("=");
    }
    return null;
}

// A small signed note for the browser to keep (the Google step): no database row until the person is signed in.
async function seal(env, data) {
    const body = toUrl(encoder.encode(JSON.stringify(data)));
    return `${body}.${toUrl(fromBase64(await hmac(env, "google\n", body)))}`;
}
async function unseal(env, value, now) {
    const [body, mac] = (value ?? "").split(".");
    if (!body || !mac || !same(toUrl(fromBase64(await hmac(env, "google\n", body))), mac)) return null;
    try {
        const data = JSON.parse(new TextDecoder().decode(fromUrl(body)));
        return data.until > now ? data : null;
    } catch {
        return null;
    }
}

async function session(request, env, now) {
    const token = readCookie(request, env);
    if (!token || !KEY.test(token)) stop(401, "signed_out");
    const id = await sha256(fromUrl(token));
    const row = await env.DB.prepare(
        "SELECT s.id, u.id AS user_id, u.nick, u.salt, u.hash, u.google FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?1 AND s.expires_at > ?2",
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

// An account made with Google has no password until one is set: hash is "" and never matches.
async function checkPassword(env, user, key) {
    if (!same(await passwordHash(env, user.salt, key), user.hash)) stop(401, "wrong");
}
const hasPassword = (user) => Boolean(user.hash);

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
    const google = googleReady(env);
    if (!user) return json({ nick: null, backup: null, google });
    const backup = await env.DB.prepare("SELECT saved_at, size, prev_saved_at FROM backups WHERE user_id = ?1").bind(user.user_id).first();
    return json({
        nick: user.nick,
        backup: backup ? { savedAt: backup.saved_at, size: backup.size, previousAt: backup.prev_saved_at ?? null } : null,
        google,
        linked: Boolean(user.google),
        password: hasPassword(user),
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

// Changes the password; an account made with Google sets its first one here and gets a recovery code.
async function changePassword(request, env, now) {
    const user = await session(request, env, now);
    await limit(env.AUTH_LIMIT, `nick:${user.nick}`);
    const body = await readJson(request);
    const first = !hasPassword(user);
    if (!first) await checkPassword(env, user, keyOf(body.key));
    const salt = toBase64(random(16));
    const hash = await passwordHash(env, salt, keyOf(body.newKey));
    if (first) {
        const code = newCode();
        await env.DB.prepare("UPDATE users SET salt = ?1, hash = ?2, recovery = ?3 WHERE id = ?4")
            .bind(salt, hash, await codeHash(env, code), user.user_id).run();
        return json({ ok: true, recovery: formatCode(code) });
    }
    // Other devices are signed out.
    await env.DB.batch([
        env.DB.prepare("UPDATE users SET salt = ?1, hash = ?2 WHERE id = ?3").bind(salt, hash, user.user_id),
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
    // Without a password the nickname typed again is the confirmation.
    if (hasPassword(user)) await checkPassword(env, user, keyOf(body.key));
    else if (nickOf(body.nick) !== user.nick) stop(401, "wrong");
    await env.DB.batch([
        env.DB.prepare("DELETE FROM backups WHERE user_id = ?1").bind(user.user_id),
        env.DB.prepare("DELETE FROM sessions WHERE user_id = ?1").bind(user.user_id),
        env.DB.prepare("DELETE FROM users WHERE id = ?1").bind(user.user_id),
    ]);
    return json({ ok: true }, 200, { "set-cookie": noCookie(env) });
}

// Google -------------------------------------------------------------------

const googleReady = (env) => Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_SECRET);
// Back to the app, which finishes the sign-in (js/ui/account.js).
const back = (url, result) => new Response(null, { status: 303, headers: { location: `${url.origin}/?google=${result}` } });
const redirectUri = (url) => `${url.origin}/api/google/callback`;

// The app sends the person here (a page, not fetch); Google sends them back to /callback.
// mode=link adds Google to the account that is signed in now.
async function googleStart(request, env, now, url) {
    if (!googleReady(env)) stop(404, "no_google");
    await limit(env.AUTH_LIMIT, `ip:${ip(request)}`);
    const link = url.searchParams.get("mode") === "link";
    const user = link ? await session(request, env, now) : null;
    const state = toUrl(random(24));
    const verifier = toUrl(random(32));
    const challenge = await sha256(encoder.encode(verifier));
    const target = new URL(GOOGLE_AUTH);
    for (const [name, value] of Object.entries({
        client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri(url), response_type: "code", scope: "openid",
        state, code_challenge: challenge, code_challenge_method: "S256", prompt: "select_account",
    })) target.searchParams.set(name, value);
    const note = await seal(env, { state, verifier, user: user?.user_id ?? null, until: now + GOOGLE_MINUTES * 60000 });
    return new Response(null, { status: 303, headers: { location: target.href, "set-cookie": googleCookie(env, note) } });
}

// Google's answer: the code becomes Google's account id, kept in the signed cookie until the app finishes (POST /finish).
async function googleCallback(request, env, now, url) {
    if (!googleReady(env)) stop(404, "no_google");
    const note = await unseal(env, readCookie(request, env, googleName(env)), now);
    const code = url.searchParams.get("code");
    if (!note?.verifier || !code || url.searchParams.get("state") !== note.state) {
        const cancelled = url.searchParams.has("error") && note;
        return withCookie(back(url, cancelled ? "cancel" : "error"), googleCookie(env, ""));
    }
    let sub;
    try {
        const answer = await fetch(GOOGLE_TOKEN, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_SECRET,
                redirect_uri: redirectUri(url), grant_type: "authorization_code", code_verifier: note.verifier,
            }),
        });
        const token = answer.ok ? (await answer.json()).id_token : null;
        // Straight from Google over TLS, so the signature need not be checked (OpenID Connect Core 3.1.3.7); the claims are.
        const claims = JSON.parse(new TextDecoder().decode(fromUrl(String(token).split(".")[1] ?? "")));
        if (GOOGLE_ISSUERS.includes(claims.iss) && claims.aud === env.GOOGLE_CLIENT_ID && claims.exp * 1000 > now && typeof claims.sub === "string") sub = claims.sub;
    } catch (error) {
        console.error(error);
    }
    if (!sub) return withCookie(back(url, "error"), googleCookie(env, ""));
    const done = await seal(env, { sub, user: note.user, until: now + GOOGLE_MINUTES * 60000 });
    return withCookie(back(url, "done"), googleCookie(env, done));
}

const withCookie = (response, value) => {
    response.headers.append("set-cookie", value);
    return response;
};

// The app asks what Google gave: a session for a known Google account, a link, or "nick" when a new account needs a nickname.
async function googleFinish(request, env, now) {
    const note = await unseal(env, readCookie(request, env, googleName(env)), now);
    if (!note?.sub) stop(401, "google");
    if (note.user) {
        const user = await session(request, env, now);
        if (user.user_id !== note.user) stop(401, "google");
        const owner = await env.DB.prepare("SELECT id FROM users WHERE google = ?1").bind(note.sub).first();
        if (owner && owner.id !== user.user_id) stop(409, "google_taken");
        await env.DB.prepare("UPDATE users SET google = ?1 WHERE id = ?2").bind(note.sub, user.user_id).run();
        return json({ nick: user.nick, linked: true }, 200, { "set-cookie": googleCookie(env, "") });
    }
    const user = await env.DB.prepare("SELECT id, nick FROM users WHERE google = ?1").bind(note.sub).first();
    if (!user) return json({ nick: null, need: "nick" });
    await countDaily(env, "login", now);
    const { insert, cookie: setCookie } = await newSession(env, user.id, now);
    await env.DB.batch([pruneSessions(env, user.id, now), insert]);
    const response = json({ nick: user.nick });
    response.headers.append("set-cookie", setCookie);
    response.headers.append("set-cookie", googleCookie(env, ""));
    return response;
}

// A new account for a new Google account: only the nickname is asked.
async function googleSignup(request, env, now) {
    await limit(env.AUTH_LIMIT, `ip:${ip(request)}`);
    const note = await unseal(env, readCookie(request, env, googleName(env)), now);
    if (!note?.sub || note.user) stop(401, "google");
    const nick = nickOf((await readJson(request)).nick);
    if (!NICK.test(nick)) stop(400, "nick");
    if (await env.DB.prepare("SELECT 1 FROM users WHERE nick = ?1").bind(nick).first()) stop(409, "taken");
    if (await env.DB.prepare("SELECT 1 FROM users WHERE google = ?1").bind(note.sub).first()) stop(409, "google_taken");
    await countDaily(env, "signup", now);
    const id = toUrl(random(16));
    const { insert, cookie: setCookie } = await newSession(env, id, now);
    try {
        await env.DB.batch([
            env.DB.prepare("INSERT INTO users (id, nick, salt, hash, recovery, google, created_at) VALUES (?1, ?2, '', '', '', ?3, ?4)").bind(id, nick, note.sub, now),
            insert,
        ]);
    } catch (error) {
        if (/UNIQUE/i.test(String(error?.message))) stop(409, "taken");
        throw error;
    }
    const response = json({ nick }, 201);
    response.headers.append("set-cookie", setCookie);
    response.headers.append("set-cookie", googleCookie(env, ""));
    return response;
}

// Google can be taken off only when a password remains to sign in with.
async function googleUnlink(request, env, now) {
    const user = await session(request, env, now);
    if (!hasPassword(user)) stop(409, "need_password");
    await env.DB.prepare("UPDATE users SET google = NULL WHERE id = ?1").bind(user.user_id).run();
    return json({ ok: true });
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
    "GET /api/google/start": googleStart,
    "GET /api/google/callback": googleCallback,
    "POST /api/google/finish": googleFinish,
    "POST /api/google/signup": googleSignup,
    "POST /api/google/unlink": googleUnlink,
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
        // The key made from the password must not travel in clear text.
        if (url.protocol !== "https:" && !devCookie(env)) stop(403, "https");
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
