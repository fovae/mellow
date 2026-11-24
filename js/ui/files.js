import { h } from "../core/dom.js";

const MAX_BYTES = 10 * 1024 * 1024;

// Share sheet on phones (an installed iOS app cannot download well), download elsewhere.
// Resolves to false when the user cancels.
export async function saveFile(name, type, content) {
    const file = new File([content], name, { type });
    if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
        try {
            await navigator.share({ files: [file] });
            return true;
        } catch (error) {
            if (error.name === "AbortError") return false;
        }
    }
    const url = URL.createObjectURL(file);
    const link = h("a", { href: url, download: name });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
}

// onText gets the file text, or null when it cannot be read.
export function pickFile(accept, onText) {
    document.querySelector(".file-input")?.remove();
    const input = h("input", {
        class: "file-input", type: "file", accept, hidden: true,
        onChange: async () => {
            const file = input.files[0];
            input.remove();
            if (file) onText(file.size > MAX_BYTES ? null : await file.text().catch(() => null));
        },
    });
    document.body.append(input);
    input.click();
}

export const safeName = (name) => name.replace(/[\\/:*?"<>|\x00-\x1f]+/g, " ").trim().slice(0, 60) || "mellow";
