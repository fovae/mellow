import { getState } from "./store.js";

const dark = window.matchMedia("(prefers-color-scheme: dark)");

// js/boot.js does this earlier, so the first frame already has the right colours.
export function applyTheme() {
    const { theme, accent, motion } = getState().settings;
    const value = theme === "auto" ? (dark.matches ? "dark" : "light") : theme;
    const root = document.documentElement;
    root.dataset.theme = value;
    root.dataset.accent = accent;
    root.dataset.motion = motion ? "on" : "off";
    document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue("--page").trim();
}

export const calmMotion = () => !getState().settings.motion || matchMedia("(prefers-reduced-motion: reduce)").matches;

dark.addEventListener("change", applyTheme);
