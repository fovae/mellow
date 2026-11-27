// Classic script in <head>: runs before the first paint. js/core/theme.js takes over later.
(function () {
    var theme, accent, motion;
    // A new epoch clears what earlier test versions left on the device: it goes with a reset of the cloud database.
    var EPOCH = "2";
    try {
        if (localStorage.getItem("mellow_epoch") !== EPOCH) {
            ["mellow_state", "mellow_state_unreadable", "mellow_account"].forEach(function (key) { localStorage.removeItem(key); });
            localStorage.setItem("mellow_epoch", EPOCH);
        }
    } catch (e) {}
    try {
        var settings = JSON.parse(localStorage.getItem("mellow_state")).settings;
        theme = settings.theme;
        accent = settings.accent;
        motion = settings.motion;
    } catch (e) {}
    if (theme !== "light" && theme !== "dark") theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.accent = accent || "mellow";
    document.documentElement.dataset.motion = motion === false ? "off" : "on";
    // Home-screen app on iOS: a mark for css/base.css (the height of the page).
    if (navigator.standalone === true) document.documentElement.dataset.standalone = "";

    // A module that failed to load leaves an empty page: try again once.
    addEventListener("error", function (event) {
        if (!event.target || event.target.tagName !== "SCRIPT") return;
        try {
            if (sessionStorage.getItem("mellow_retry")) return;
            sessionStorage.setItem("mellow_retry", "1");
        } catch (e) { return; }
        location.reload();
    }, true);
    addEventListener("load", function () {
        setTimeout(function () { if (document.querySelector(".screen")) try { sessionStorage.removeItem("mellow_retry"); } catch (e) {} }, 1000);
    });
})();
