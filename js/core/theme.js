import { getState } from "./store.js";

const dark = window.matchMedia("(prefers-color-scheme: dark)");

// index.html repeats this inline so the first frame already has the right colours.
export function applyTheme() {
    const { theme } = getState().settings;
    const value = theme === "auto" ? (dark.matches ? "dark" : "light") : theme;
    document.documentElement.dataset.theme = value;
    document.querySelector('meta[name="theme-color"]').content = value === "dark" ? "#0f1018" : "#f4f6fd";
}

dark.addEventListener("change", applyTheme);
