import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { screenHeader } from "../ui/navigation.js";

export const renderTests = () => [
    screenHeader(t("tests.title"), t("tests.subtitle")),
    h("div", { class: "card empty" }, h("p", {}, t("tests.soon"))),
];
