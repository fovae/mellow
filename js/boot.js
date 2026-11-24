// Classic script in <head>: runs before the first paint. js/core/theme.js takes over later.
(function () {
    var theme;
    try {
        theme = JSON.parse(localStorage.getItem("mellow_state")).settings.theme;
    } catch (e) {}
    if (theme !== "light" && theme !== "dark") theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = theme;

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
