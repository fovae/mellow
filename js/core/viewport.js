// Exposes the real visible height (iOS toolbars, on-screen keyboard) to CSS.
export function initViewport() {
    const root = document.documentElement;
    const update = () => {
        const height = Math.round(window.visualViewport?.height || window.innerHeight);
        root.style.setProperty("--app-height", `${height}px`);
    };
    ["resize", "orientationchange", "pageshow"].forEach((name) =>
        window.addEventListener(name, update, { passive: true }));
    window.visualViewport?.addEventListener("resize", update, { passive: true });
    update();
}
