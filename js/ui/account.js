// The account: the sign-in screen that comes first, the account rows in settings and their sheets.
import * as api from "../core/account.js";
import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { getBackup, getState, readBackup, resetAll, restore, subscribe } from "../core/store.js";
import { cell, group } from "./cells.js";
import { mascot } from "./mascot.js";
import { confirmModal, field, openFullscreen, openModal } from "./modal.js";
import { refresh } from "./navigation.js";
import { toast } from "./toast.js";

// What the start found: "in" signed in, "out" signed out, "offline" no answer, "none" no API here (a plain static host).
let status = null;
let me = null; // { nick, backup: { savedAt, size, previousAt } | null, linked, password } while signed in
let google = false; // Google sign-in is set up on the server
let googleStep = null; // after coming back from Google: "nick" (a new account needs one) or an error text

const date = (ms) => new Date(ms).toLocaleDateString(getLocale(), { day: "numeric", month: "long", year: "numeric" });
const errorText = (error) => {
    const key = `account.error.${error?.code}`;
    return t(key) === key ? t("account.error.server") : t(key);
};
const updateLocal = (changes) => api.setLocal({ ...api.getLocal(), ...changes });
const CODE_KEY = "mellow_new_code"; // a recovery code not yet confirmed: it survives a reload

// After "Reset all data" this device must not send its empty state over the cloud copy by itself.
subscribe((type) => {
    if (type === "reset" && api.getLocal()) updateLocal({ linked: false });
});

const offline = () => new Promise((_, reject) => setTimeout(() => reject(new api.ApiError(0, "offline")), 10000));

// Asks the server once at start, and finishes a sign-in that came back from Google.
export async function checkAccount() {
    try {
        const answer = await Promise.race([api.getMe(), offline()]);
        status = answer.nick ? "in" : "out";
        google = Boolean(answer.google);
        me = answer.nick ? answer : null;
        await returnFromGoogle();
    } catch (error) {
        status = error.code === "no_server" ? "none" : "offline";
        me = null;
    } finally {
        refresh();
    }
}

async function returnFromGoogle() {
    const result = new URLSearchParams(location.search).get("google");
    if (!result) return;
    history.replaceState(null, "", location.pathname);
    if (result === "cancel") return;
    if (result !== "done") {
        googleStep = t("account.error.google");
        return;
    }
    try {
        const answer = await api.googleFinish();
        if (answer.need === "nick") googleStep = "nick";
        else if (answer.linked) {
            me = await api.getMe();
            setTimeout(() => toast("✅", t("account.googleLinked")), 2500);
        } else {
            me = await api.getMe();
            status = "in";
            googleStep = "entered";
        }
    } catch (error) {
        googleStep = errorText(error);
    }
}

// The start: resolves once someone is signed in on this device. Offline, an account that was here before goes on.
export async function accountGate() {
    if (status === "none") return;
    if (status === "offline" && api.getLocal()?.nick && getState().username) return;
    if (me && googleStep === "entered") {
        googleStep = null;
        await enterAccount(me.nick);
    }
    if (me) {
        const code = sessionStorage.getItem(CODE_KEY);
        if (code) await showRecoveryCode(code);
        autoSave();
        return;
    }
    const step = googleStep;
    googleStep = null;
    await showAuthScreen(step === "nick" ? "google" : api.getLocal()?.nick ? "login" : "signup", step === "nick" ? "" : step);
}

// The words on this device belong to one account. Signing in to another one (or with words of nobody) clears them first;
// then a cloud copy newer than this device has seen loads by itself on an empty device and is offered otherwise.
async function enterAccount(nick) {
    const local = api.getLocal();
    const same = local?.nick === nick;
    if (!same && (getState().username || getState().dictionaries.length)) resetAll({ keepLook: true });
    me = await api.getMe();
    status = "in";
    // "linked" only after the cloud copy is here: a failed load must not let an empty device replace it.
    api.setLocal({ nick, linked: same ? local.linked : !me.backup, cloudAt: same ? local.cloudAt : null });
    if (!me.backup || me.backup.savedAt <= (api.getLocal().cloudAt ?? 0)) return;
    if (!isEmpty()) return offerRestore();
    try {
        const next = readBackup(await api.downloadBackup());
        if (!next) return toast("❓", t("backup.invalid"));
        restore(next);
        updateLocal({ linked: true, cloudAt: me.backup.savedAt });
    } catch (error) {
        toast("❓", errorText(error));
    }
}

// The weekly save, only from a device that is linked to its cloud copy.
let saving = false;
// Not before the first screen is done: an empty profile is not worth a copy.
export async function autoSave() {
    if (!me || saving || !getState().username || !api.needsAutoSave(api.getLocal())) return;
    saving = true;
    try {
        const { savedAt } = await api.uploadBackup(getBackup());
        updateLocal({ linked: true, cloudAt: savedAt });
        me.backup = { ...me.backup, savedAt, previousAt: me.backup?.savedAt ?? null };
        refresh();
    } catch {
        // Next time: an automatic save never interrupts.
    } finally {
        saving = false;
    }
}

// Rows for the "Data" group of settings.
export function accountRows() {
    if (status === "none" || status === null) return [];
    if (!me) {
        return [cell({ icon: "cloud", tint: 6, label: t("account.title"), sub: t("account.pitch"), value: t("account.signIn"), attrs: { "aria-haspopup": "dialog" }, onClick: () => showAuthScreen() })];
    }
    return [
        cell({ icon: "cloud", tint: 6, label: t("account.title"), sub: me.nick, attrs: { "aria-haspopup": "dialog" }, onClick: openAccount }),
        cell({ icon: "share", tint: 4, label: t("account.save"), sub: me.backup ? date(me.backup.savedAt) : t("backup.never"), onClick: () => saveToCloud() }),
        me.backup && cell({ icon: "download", tint: 5, label: t("account.load"), sub: date(me.backup.savedAt), attrs: { "aria-haspopup": "dialog" }, onClick: () => offerRestore() }),
    ].filter(Boolean);
}

export const isSignedIn = () => Boolean(me);
export const nickname = () => me?.nick ?? api.getLocal()?.nick ?? "";
export const hasCloudCopy = () => Boolean(me?.backup);
export const loadFromCloud = () => offerRestore();
export const hasServer = () => status !== "none";

// A form in a sheet: fields, a line for errors and one button. submit() may throw an ApiError.
function sheetForm({ title, fields, action, danger, note, extra, submit }) {
    return openModal({
        title,
        build: (close) => {
            const error = h("p", { class: "feedback is-wrong", role: "status" });
            const button = h("button", { class: `btn ${danger ? "btn-danger" : "btn-primary"}`, type: "submit" }, action);
            const form = h("form", {
                class: "form", novalidate: true, onSubmit: async (event) => {
                    event.preventDefault();
                    if (button.disabled) return;
                    error.textContent = "";
                    button.disabled = true;
                    button.textContent = t("account.wait");
                    try {
                        await submit(close, (text) => { error.textContent = text; });
                    } catch (failure) {
                        error.textContent = failure instanceof api.ApiError ? errorText(failure) : failure.message;
                    } finally {
                        button.disabled = false;
                        button.textContent = action;
                    }
                },
            }, ...fields, note && h("p", { class: "muted" }, note), error, button, extra?.(close));
            return form;
        },
    });
}

const passwordInput = (autocomplete) => h("input", { class: "input", type: "password", autocomplete, minlength: api.MIN_PASSWORD, maxlength: 200, required: true });

function checkNick(nick) {
    if (!api.NICK.test(nick)) throw new Error(t("account.error.nick"));
}
function checkPassword(password) {
    if (password.length < api.MIN_PASSWORD) throw new Error(t("account.error.short", { count: api.MIN_PASSWORD }));
}

const isEmpty = () => !getState().username && !getState().dictionaries.some((d) => d.words.length);

// Google's letter in its own colours (Google's sign-in button rules), drawn here: no file from another site.
const googleMark = () => {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 48 48");
    svg.setAttribute("class", "google-mark");
    svg.setAttribute("aria-hidden", "true");
    for (const [fill, d] of [
        ["#EA4335", "M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"],
        ["#4285F4", "M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"],
        ["#FBBC05", "M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"],
        ["#34A853", "M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"],
    ]) {
        const path = document.createElementNS(ns, "path");
        path.setAttribute("fill", fill);
        path.setAttribute("d", d);
        svg.append(path);
    }
    return svg;
};
const toGoogle = (link = false) => { location.href = api.googleStartUrl(link); };

// The sign-in screen: create an account, sign in, a new password by the code, or a nickname for a new Google account.
// Resolves when signed in. It cannot be skipped.
export function showAuthScreen(mode = "signup", message = "") {
    return new Promise((resolve) => {
        const screen = openFullscreen(t("auth.title"), (event) => event.key === "Escape" && event.preventDefault(), () => {});
        const known = api.getLocal()?.nick ?? "";
        const nick = h("input", {
            class: "input cell-input", name: "username", value: mode === "signup" || mode === "google" ? "" : known, placeholder: t("auth.nickHint"),
            autocomplete: "username", autocapitalize: "off", autocorrect: "off", spellcheck: "false", maxlength: 20,
        });
        const password = h("input", { class: "input cell-input", type: "password", maxlength: 200 });
        const code = h("input", { class: "input cell-input", placeholder: t("auth.codeHint"), autocomplete: "off", autocapitalize: "characters", autocorrect: "off", spellcheck: "false", maxlength: 24 });
        const row = (label, input) => h("label", { class: "cell auth-field" }, h("span", { class: "auth-label" }, label), input);
        const action = () => t(mode === "google" ? "account.signupAction" : `account.${mode}Action`);

        function draw() {
            password.autocomplete = mode === "login" ? "current-password" : "new-password";
            password.placeholder = mode === "login" ? "" : t("auth.passwordHint", { count: api.MIN_PASSWORD });
            // A nickname from another account must not stay in "New account".
            if (mode === "signup" && nick.value === known) nick.value = "";
            if (mode === "login" && !nick.value) nick.value = known;
            const error = h("p", { class: "feedback is-wrong", role: "status" }, message);
            message = "";
            const button = h("button", { class: "btn btn-primary", type: "submit", form: "auth" }, action());
            const go = (next) => () => { mode = next; draw(); };
            const tabs = (mode === "signup" || mode === "login") && h("div", { class: "segmented", role: "group" }, ["signup", "login"].map((name) =>
                h("button", { class: `segment ${name === mode ? "is-active" : ""}`, type: "button", "aria-pressed": String(name === mode), onClick: go(name) }, t(`account.${name}`))));
            // Google first: one tap, nothing to type.
            const withGoogle = google && (mode === "signup" || mode === "login") && h("div", { class: "auth-google" },
                h("button", { class: "btn btn-google", type: "button", onClick: () => toGoogle() }, googleMark(), t("auth.google")),
                h("span", { class: "auth-or" }, t("auth.or")));
            const page = h("form", {
                class: "setup", id: "auth", novalidate: true,
                onSubmit: async (event) => {
                    event.preventDefault();
                    if (button.disabled) return;
                    error.textContent = "";
                    button.disabled = true;
                    button.textContent = t("account.wait");
                    try {
                        await submit();
                        screen.close();
                        resolve();
                    } catch (failure) {
                        error.textContent = failure instanceof api.ApiError ? errorText(failure) : failure.message;
                        button.disabled = false;
                        button.textContent = action();
                    }
                },
            },
                h("header", { class: "setup-head" }, mascot("happy", "mascot-large mascot-auth"),
                    h("h1", { class: "screen-title", tabindex: "-1" }, t("auth.title")), h("p", { class: "muted" }, t(`auth.intro.${mode}`))),
                withGoogle,
                tabs,
                group(null, [
                    row(t("auth.nick"), nick),
                    mode === "recover" && row(t("auth.code"), code),
                    mode !== "google" && row(t(mode === "login" ? "auth.password" : "auth.newPassword"), password),
                ], { foot: { signup: t("account.signupNote"), login: "", recover: t("account.recoverNote"), google: t("account.googleNote") }[mode] }),
                error);
            const link = mode === "recover" || mode === "google"
                ? h("button", { class: "link-btn", type: "button", onClick: go(mode === "recover" ? "login" : "signup") }, t("auth.back"))
                : mode === "login" && h("button", { class: "link-btn", type: "button", onClick: go("recover") }, t("account.to.recover"));
            screen.draw(page, h("div", { class: "session-footer auth-footer" }, button, link));
            page.querySelector(".screen-title").focus({ preventScroll: true, focusVisible: false });
        }

        async function submit() {
            const name = nick.value.trim();
            checkNick(name);
            if (mode === "google") {
                const result = await api.googleSignUp(name);
                await enterAccount(result.nick);
            } else {
                if (mode !== "login") checkPassword(password.value);
                if (mode === "signup") {
                    const result = await api.signUp(name, password.value);
                    sessionStorage.setItem(CODE_KEY, result.recovery);
                    await enterAccount(result.nick);
                    await showRecoveryCode(result.recovery);
                } else {
                    const result = mode === "login" ? await api.signIn(name, password.value) : await api.recover(name, code.value, password.value);
                    if (result.recovery) {
                        sessionStorage.setItem(CODE_KEY, result.recovery);
                        await showRecoveryCode(result.recovery);
                    }
                    await enterAccount(result.nick);
                }
            }
            toast("👋", t("account.hello", { nick: me.nick }));
            refresh();
        }

        draw();
    });
}

function offerRestore(previous = false) {
    const savedAt = previous ? me.backup.previousAt : me.backup.savedAt;
    openModal({
        title: t("account.restoreTitle"),
        emoji: "⛅",
        build: (close) => [
            h("p", { class: "muted" }, t("account.restoreText", { date: date(savedAt) })),
            h("div", { class: "actions" },
                h("button", { class: "btn btn-soft", type: "button", onClick: close }, t("account.notNow")),
                h("button", { class: "btn btn-primary", type: "button", onClick: async (event) => {
                    event.currentTarget.disabled = true;
                    try {
                        const next = readBackup(await api.downloadBackup(previous));
                        close();
                        if (!next) return toast("❓", t("backup.invalid"));
                        restore(next);
                        updateLocal({ linked: true, cloudAt: me.backup.savedAt });
                        toast("✅", t("account.restored"));
                    } catch (error) {
                        close();
                        toast("❓", errorText(error));
                    }
                } }, t("backup.restore"))),
        ],
    });
}

export async function saveToCloud({ quiet = false } = {}) {
    const local = api.getLocal();
    const upload = async () => {
        try {
            const { savedAt } = await api.uploadBackup(getBackup());
            me.backup = { savedAt, previousAt: me.backup?.savedAt ?? null };
            updateLocal({ linked: true, cloudAt: savedAt });
            if (!quiet) toast("⛅", t("account.saved"));
        } catch (error) {
            if (error.status === 401) signedOut();
            toast("❓", errorText(error));
        }
        refresh();
    };
    // This device has not loaded the cloud copy: replacing it must be a choice.
    if (!local?.linked && me.backup) {
        openModal({
            title: t("account.replaceTitle"),
            build: (close) => [
                h("p", { class: "muted" }, t("account.replaceText", { date: date(me.backup.savedAt) })),
                h("div", { class: "actions" },
                    h("button", { class: "btn btn-soft", type: "button", onClick: close }, t("common.cancel")),
                    h("button", { class: "btn btn-danger", type: "button", onClick: () => { close(); upload(); } }, t("account.replace"))),
            ],
        });
        return;
    }
    await upload();
}

function signedOut() {
    me = null;
    api.setLocal(null);
    refresh();
}

// Resolves when the person has seen the code.
const showRecoveryCode = (code) => new Promise((resolve) => {
    const close = openModal({
        title: t("account.codeTitle"),
        emoji: "🔑",
        dismissible: false,
        build: (close) => {
            const copy = h("button", { class: "btn btn-soft", type: "button", onClick: async () => {
                try {
                    await navigator.clipboard.writeText(code);
                    copy.textContent = t("account.copied");
                } catch {
                    copy.disabled = true;
                }
            } }, t("account.copy"));
            return [
                h("p", { class: "muted" }, t("account.codeText")),
                h("p", { class: "recovery-code", translate: "no" }, code),
                h("div", { class: "actions" }, copy, h("button", { class: "btn btn-primary", type: "button", onClick: () => {
                    sessionStorage.removeItem(CODE_KEY);
                    done();
                    resolve();
                } }, t("account.codeDone"))),
            ];
        },
    });
    const done = () => close();
});

// Asks for the password before something serious; without a password (Google) for the nickname typed again.
function withPassword({ title, text, action, danger, run }) {
    if (!me.password) {
        const nick = h("input", { class: "input", autocomplete: "off", autocapitalize: "off", autocorrect: "off", spellcheck: "false", maxlength: 20 });
        return sheetForm({ title, note: text, action, danger, fields: [field(t("account.typeNick", { nick: me.nick }), nick)], submit: (close) => run(null, close, nick.value) });
    }
    const password = passwordInput("current-password");
    sheetForm({ title, note: text, action, danger, fields: [field(t("account.password"), password)], submit: (close) => run(password.value, close) });
}

// Google in the account: link it, or take it off when a password remains.
function googleRow(then) {
    if (!google && !me.linked) return null;
    const onClick = !me.linked ? () => toGoogle(true)
        : me.password ? then(() => confirmModal({
            title: t("account.googleUnlinkTitle"), text: t("account.googleUnlinkText"), action: t("account.googleUnlink"),
            onConfirm: async () => {
                try {
                    await api.googleUnlink();
                    me.linked = false;
                    toast("✅", t("account.googleUnlinked"));
                } catch (error) {
                    toast("❓", errorText(error));
                }
            },
        }))
        : then(() => toast("🔑", t("account.googleOnly")));
    return cell({ icon: "globe", tint: 4, label: "Google", value: t(me.linked ? "account.googleOn" : "account.googleLink"), onClick });
}

function openAccount() {
    const { backup, nick } = me;
    openModal({
        title: nick,
        emoji: "⛅",
        build: (close) => {
            const then = (fn) => () => { close(); setTimeout(fn, 200); };
            return h("div", { class: "sheet-groups" },
                group(t("account.cloud"), [
                    cell({ icon: "share", tint: 4, label: t("account.save"), sub: backup ? date(backup.savedAt) : t("backup.never"), onClick: then(() => saveToCloud()) }),
                    backup && cell({ icon: "download", tint: 5, label: t("account.load"), sub: date(backup.savedAt), onClick: then(() => offerRestore()) }),
                    backup?.previousAt && cell({ icon: "calendar", tint: 3, label: t("account.loadPrevious"), sub: date(backup.previousAt), onClick: then(() => offerRestore(true)) }),
                ], { foot: t("account.autoNote", { count: api.AUTO_DAYS }) }),
                group(t("account.security"), [
                    googleRow(then),
                    cell({ icon: "key", tint: 2, label: t(me.password ? "account.changePassword" : "account.setPassword"), onClick: then(me.password ? openChangePassword : openSetPassword) }),
                    me.password && cell({ icon: "shield", tint: 1, label: t("account.newCode"), onClick: then(() => withPassword({
                        title: t("account.newCode"), text: t("account.newCodeText"), action: t("account.newCodeAction"),
                        run: async (password, done) => {
                            const { recovery } = await api.newRecoveryCode(me.nick, password);
                            done();
                            showRecoveryCode(recovery);
                        },
                    })) }),
                    cell({ icon: "logout", tint: 3, label: t("account.signOut"), onClick: then(confirmSignOut) }),
                ]),
                group(null, [cell({ icon: "trash", danger: true, label: t("account.delete"), onClick: then(() => withPassword({
                    title: t("account.delete"), text: t("account.deleteText"), action: t("common.delete"), danger: true,
                    run: async (password, done, typed) => {
                        if (password == null && typed.trim().toLowerCase() !== me.nick) throw new Error(t("account.error.typeNick"));
                        await api.deleteAccount(me.nick, password);
                        done();
                        leaveDevice();
                        toast("✅", t("account.deleted"));
                    },
                })) })]));
        },
    });
}

// An account made with Google: the first password, so the nickname works without Google too. A recovery code comes with it.
function openSetPassword() {
    const next = passwordInput("new-password");
    sheetForm({
        title: t("account.setPassword"),
        note: t("account.setPasswordNote"),
        fields: [field(t("account.newPassword"), next)],
        action: t("common.save"),
        submit: async (close) => {
            checkPassword(next.value);
            const { recovery } = await api.setFirstPassword(me.nick, next.value);
            me.password = true;
            close();
            sessionStorage.setItem(CODE_KEY, recovery);
            await showRecoveryCode(recovery);
        },
    });
}

function openChangePassword() {
    const current = passwordInput("current-password");
    const next = passwordInput("new-password");
    sheetForm({
        title: t("account.changePassword"),
        note: t("account.changeNote"),
        fields: [field(t("account.password"), current), field(t("account.newPassword"), next)],
        action: t("common.save"),
        submit: async (close) => {
            checkPassword(next.value);
            await api.changePassword(me.nick, current.value, next.value);
            close();
            toast("✅", t("account.passwordChanged"));
        },
    });
}

// The words belong to the account: they leave the device with it. The sign-in screen comes back (main.js, "reset").
// keepNick: after signing out the sign-in screen opens on "Sign in" with this nickname.
function leaveDevice(keepNick = false) {
    const nick = me?.nick;
    me = null;
    status = "out";
    api.setLocal(keepNick && nick ? { nick, linked: false, cloudAt: null } : null);
    resetAll();
}

function confirmSignOut() {
    confirmModal({
        title: t("account.signOutTitle"), text: t("account.signOutText"), action: t("account.signOut"),
        onConfirm: async () => {
            // A linked device saves first, so nothing done here since the last copy is lost.
            if (api.getLocal()?.linked) {
                try {
                    await api.uploadBackup(getBackup());
                } catch (error) {
                    return toast("❓", errorText(error));
                }
            }
            try { await api.signOut(); } catch { /* the cookie runs out by itself */ }
            leaveDevice(true);
            toast("👋", t("account.bye"));
        },
    });
}
