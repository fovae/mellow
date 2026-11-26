// The account: a nickname and a password, one backup in the cloud. No DOM here.
// The password does not leave the device: a slow PBKDF2 turns it into a key, and the key is sent instead.
// The server hashes the key again with its secret (server/api.js).

const ROUNDS = 600000;
const LOCAL = "mellow_account";
export const AUTO_DAYS = 7;
export const NICK = /^[a-zA-Z0-9_]{3,20}$/;
export const MIN_PASSWORD = 8;

const toUrl = (bytes) => btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");

// The nickname is the salt: unique for each account, known before signing in.
export async function deriveKey(nick, password, rounds = ROUNDS) {
    const encoder = new TextEncoder();
    const base = await crypto.subtle.importKey("raw", encoder.encode(password.normalize("NFC")), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(`mellow-account-v1:${nick.trim().toLowerCase()}`), iterations: rounds }, base, 256);
    return toUrl(new Uint8Array(bits));
}

// What this device knows: the nickname, whether it is linked to the cloud copy, and when that copy was saved.
// "linked" is false after signing in on a device that did not load the cloud copy: then nothing is sent by itself,
// so an empty new device cannot replace good words in the cloud.
export function getLocal() {
    try {
        const saved = JSON.parse(localStorage.getItem(LOCAL));
        return saved && typeof saved.nick === "string" ? saved : null;
    } catch {
        return null;
    }
}
export const setLocal = (value) => (value ? localStorage.setItem(LOCAL, JSON.stringify(value)) : localStorage.removeItem(LOCAL));

// Whether a weekly save is due.
export const needsAutoSave = (local, now = Date.now()) =>
    Boolean(local?.nick && local.linked && (!local.cloudAt || now - local.cloudAt >= AUTO_DAYS * 86400000));

export class ApiError extends Error {
    constructor(status, code) {
        super(code);
        this.status = status;
        this.code = code;
    }
}

async function call(method, path, body) {
    const init = { method, credentials: "same-origin", cache: "no-store", headers: {} };
    if (body instanceof Uint8Array) {
        init.body = body;
        init.headers["content-type"] = "application/octet-stream";
    } else if (body) {
        init.body = JSON.stringify(body);
        init.headers["content-type"] = "application/json";
    }
    let response;
    try {
        response = await fetch(path, init);
    } catch {
        throw new ApiError(0, "offline");
    }
    const type = response.headers.get("content-type") ?? "";
    // A static host without the API answers with an HTML page.
    if (!type.startsWith("application/json") && !type.startsWith("application/octet-stream")) throw new ApiError(response.status, "no_server");
    if (!response.ok) throw new ApiError(response.status, (await response.json().catch(() => ({}))).error ?? "server");
    return type.startsWith("application/json") ? response.json() : new Uint8Array(await response.arrayBuffer());
}

export const signUp = async (nick, password) => call("POST", "/api/signup", { nick, key: await deriveKey(nick, password) });
export const signIn = async (nick, password) => call("POST", "/api/login", { nick, key: await deriveKey(nick, password) });
export const signOut = () => call("POST", "/api/logout");
export const getMe = () => call("GET", "/api/me");
export const recover = async (nick, code, password) => call("POST", "/api/recover", { nick, code, key: await deriveKey(nick, password) });
export const changePassword = async (nick, password, next) =>
    call("POST", "/api/password", { key: await deriveKey(nick, password), newKey: await deriveKey(nick, next) });
export const newRecoveryCode = async (nick, password) => call("POST", "/api/recovery-code", { key: await deriveKey(nick, password) });
export const deleteAccount = async (nick, password) => call("DELETE", "/api/account", { key: await deriveKey(nick, password) });

async function pipe(bytes, stream) {
    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}
export const packBackup = (text) => pipe(new TextEncoder().encode(text), new CompressionStream("gzip"));
export const unpackBackup = async (bytes) => new TextDecoder().decode(await pipe(bytes, new DecompressionStream("gzip")));

export const uploadBackup = async (text) => call("PUT", "/api/backup", await packBackup(text));
export const downloadBackup = async (previous = false) => unpackBackup(await call("GET", `/api/backup${previous ? "?which=previous" : ""}`));
