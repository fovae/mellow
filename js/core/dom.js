// Creates a DOM element. Strings become text nodes, so user content is never parsed as HTML.
export function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
        if (value === undefined || value === null || value === false) continue;
        if (key === "class") el.className = value;
        else if (key === "style") Object.assign(el.style, value);
        else if (key === "value") el.value = value;
        else if (key.startsWith("on")) el.addEventListener(key.slice(2).toLowerCase(), value);
        else el.setAttribute(key, value === true ? "" : value);
    }
    el.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false));
    return el;
}
