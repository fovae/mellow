// The account rows in settings and their sheets: sign in, the cloud backup, password, recovery code.
import * as api from "../core/account.js";
import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { getBackup, readBackup, restore, subscribe } from "../core/store.js";
import { cell, group } from "./cells.js";
import { field, openModal } from "./modal.js";
import { refresh } from "./navigation.js";
import { toast } from "./toast.js";

// null: not checked yet; false: no API here (a plain static host or offline at start).
let available = null;
let me = null; // { nick, backup: { savedAt, size, previousAt } | null } while signed in

const date = (ms) => new Date(ms).toLocaleDateString(getLocale(), { day: "numeric", month: "long", year: "numeric" });
const errorText = (error) => {
    const key = `account.error.${error?.code}`;
    return t(key) === key ? t("account.error.server") : t(key);
};
const updateLocal = (changes) => api.setLocal({ ...api.getLocal(), ...changes });

// After "Reset all data" this device must not send its empty state over the cloud copy by itself.
subscribe((type) => {
    if (type === "reset" && api.getLocal()) updateLocal({ linked: false });
});

// Asks the server once at start. Without a server the account rows stay hidden.
export async function checkAccount() {
    try {
        const answer = await api.getMe();
        available = true;
        me = answer.nick ? answer : null;
        if (!me) return;
        const local = api.getLocal();
        // Another account was used here before: this device is not linked to the new one.
        if (local?.nick !== me.nick) api.setLocal({ nick: me.nick, linked: false, cloudAt: null });
    } catch {
        available = false;
        me = null;
    } finally {
        refresh();
        autoSave();
    }
}

// The weekly save, only from a device that is linked to its cloud copy.
let saving = false;
export async function autoSave() {
    if (!me || saving || !api.needsAutoSave(api.getLocal())) return;
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
    if (!available) return [];
    if (!me) {
        return [cell({ icon: "cloud", tint: 6, label: t("account.title"), sub: t("account.pitch"), value: t("account.signIn"), attrs: { "aria-haspopup": "dialog" }, onClick: () => openAuth() })];
    }
    return [
        cell({ icon: "cloud", tint: 6, label: t("account.title"), sub: me.nick, attrs: { "aria-haspopup": "dialog" }, onClick: openAccount }),
        cell({ icon: "share", tint: 4, label: t("account.save"), sub: me.backup ? date(me.backup.savedAt) : t("backup.never"), onClick: () => saveToCloud() }),
    ];
}

export const isSignedIn = () => Boolean(me);
export const hasServer = () => available === true;

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

const nickInput = (value = "") => h("input", {
    class: "input", name: "username", value, autocomplete: "username", autocapitalize: "off", autocorrect: "off", spellcheck: "false", maxlength: 20, required: true,
});
const passwordInput = (autocomplete) => h("input", { class: "input", type: "password", autocomplete, minlength: api.MIN_PASSWORD, maxlength: 200, required: true });

function checkNick(nick) {
    if (!api.NICK.test(nick)) throw new Error(t("account.error.nick"));
}
function checkPassword(password) {
    if (password.length < api.MIN_PASSWORD) throw new Error(t("account.error.short", { count: api.MIN_PASSWORD }));
}

// Sign in, create an account, or set a new password with the recovery code.
export function openAuth(mode = "login") {
    const nick = nickInput(api.getLocal()?.nick ?? "");
    const password = passwordInput(mode === "signup" ? "new-password" : "current-password");
    const code = h("input", { class: "input", autocomplete: "off", autocapitalize: "characters", spellcheck: "false", placeholder: "XXXX-XXXX-XXXX-XXXX", maxlength: 24, required: true });
    const swap = (next) => (close) => h("button", { class: "btn btn-soft", type: "button", onClick: () => { close(); setTimeout(() => openAuth(next), 200); } }, t(`account.to.${next}`));

    sheetForm({
        title: t(`account.${mode}`),
        fields: [
            field(t("account.nick"), nick),
            mode === "recover" && field(t("account.code"), code),
            field(t(mode === "login" ? "account.password" : "account.newPassword"), password),
        ],
        note: { login: "", signup: t("account.signupNote"), recover: t("account.recoverNote") }[mode],
        action: t(`account.${mode}Action`),
        extra: (close) => h("div", { class: "actions form-extra" }, mode === "login" ? [swap("signup")(close), swap("recover")(close)] : swap("login")(close)),
        submit: async (close) => {
            const name = nick.value.trim();
            checkNick(name);
            checkPassword(password.value);
            if (mode === "signup") {
                const result = await api.signUp(name, password.value);
                me = { nick: result.nick, backup: null };
                api.setLocal({ nick: result.nick, linked: true, cloudAt: null });
                close();
                await saveToCloud({ quiet: true });
                showRecoveryCode(result.recovery);
            } else {
                const result = mode === "login" ? await api.signIn(name, password.value) : await api.recover(name, code.value, password.value);
                close();
                await afterSignIn(result.nick);
                if (result.recovery) showRecoveryCode(result.recovery);
            }
            refresh();
        },
    });
}

// A newer copy in the cloud than this device has seen is offered at once.
async function afterSignIn(nick) {
    const local = api.getLocal();
    me = await api.getMe();
    const known = local?.nick === nick ? local : null;
    api.setLocal({ nick, linked: known?.linked ?? !me.backup, cloudAt: known?.cloudAt ?? null });
    toast("👋", t("account.hello", { nick }));
    if (me.backup && me.backup.savedAt > (known?.cloudAt ?? 0)) offerRestore();
    else autoSave();
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

function showRecoveryCode(code) {
    openModal({
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
                h("div", { class: "actions" }, copy, h("button", { class: "btn btn-primary", type: "button", onClick: close }, t("account.codeDone"))),
            ];
        },
    });
}

// Asks for the password before something serious.
function withPassword({ title, text, action, danger, run }) {
    const password = passwordInput("current-password");
    sheetForm({ title, note: text, action, danger, fields: [field(t("account.password"), password)], submit: (close) => run(password.value, close) });
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
                    cell({ icon: "key", tint: 2, label: t("account.changePassword"), onClick: then(openChangePassword) }),
                    cell({ icon: "shield", tint: 1, label: t("account.newCode"), onClick: then(() => withPassword({
                        title: t("account.newCode"), text: t("account.newCodeText"), action: t("account.newCodeAction"),
                        run: async (password, done) => {
                            const { recovery } = await api.newRecoveryCode(me.nick, password);
                            done();
                            showRecoveryCode(recovery);
                        },
                    })) }),
                    cell({ icon: "logout", tint: 3, label: t("account.signOut"), onClick: then(async () => {
                        try { await api.signOut(); } catch { /* the cookie runs out by itself */ }
                        signedOut();
                        toast("👋", t("account.bye"));
                    }) }),
                ]),
                group(null, [cell({ icon: "trash", danger: true, label: t("account.delete"), onClick: then(() => withPassword({
                    title: t("account.delete"), text: t("account.deleteText"), action: t("common.delete"), danger: true,
                    run: async (password, done) => {
                        await api.deleteAccount(me.nick, password);
                        done();
                        signedOut();
                        toast("✅", t("account.deleted"));
                    },
                })) })]));
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
