import { h } from "../core/dom.js";
import { openModal } from "./modal.js";

export const openMessage = (title, text) => openModal({ title, build: () => h("p", { class: "muted" }, text) });
