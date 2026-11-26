// Exposes the real visible area (iOS toolbars, on-screen keyboard) to CSS.
const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

export function initViewport() {
    const root = document.documentElement;
    const update = () => {
        const view = window.visualViewport;
        const height = Math.round(view?.height || window.innerHeight);
        const top = Math.round(view?.offsetTop || 0);
        // iOS does not shrink the window for the keyboard: the part under the visible area is the keyboard.
        const keyboard = Math.max(0, Math.round(window.innerHeight - height - top));
        // iOS 26+ home-screen apps: the window can end above the screen bottom and the system draws the rest
        // (WebKit bug 301994). Then the home indicator area is already outside the window.
        const portrait = window.innerHeight >= window.innerWidth;
        const screenHeight = portrait ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
        const systemGap = standalone() ? Math.max(0, screenHeight - window.innerHeight) : 0;
        root.style.setProperty("--app-height", `${height}px`);
        root.style.setProperty("--app-top", `${top}px`);
        root.style.setProperty("--keyboard", `${keyboard}px`);
        root.style.setProperty("--bottom-gap", keyboard > 80 ? "100vh" : `${systemGap}px`);
        // Keep the field being typed in above the keyboard.
        const field = document.activeElement;
        if (keyboard > 80 && field?.matches("input, textarea")) requestAnimationFrame(() => field.scrollIntoView({ block: "nearest" }));
    };
    ["resize", "orientationchange", "pageshow"].forEach((name) =>
        window.addEventListener(name, update, { passive: true }));
    window.visualViewport?.addEventListener("resize", update, { passive: true });
    window.visualViewport?.addEventListener("scroll", update, { passive: true });
    update();
}
