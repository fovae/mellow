// Mello, the cloud. Moods: calm, happy, sleepy, sad. The same drawing as the icon (img/icons/logo.svg).
const NS = "http://www.w3.org/2000/svg";
const BODY = "M32 90A22 22 0 0 1 23.73 47.61A4 4 0 0 0 26.2 44.41A26 26 0 0 1 45.94 22.41A16 16 0 0 0 49.86 20.9A30 30 0 0 1 91.05 33.89A4 4 0 0 0 94.29 36.1A27 27 0 0 1 92 90Z";
let count = 0;

const make = (tag, attrs, ...children) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    el.append(...children);
    return el;
};
const line = (d) => make("path", { class: "mascot-line", d });
const ellipse = (name, cx, cy, rx, ry) => make("ellipse", { class: name, cx, cy, rx, ry });

const eye = (x) => [
    ellipse("mascot-eye", x, 57, 5.9, 7.4),
    ellipse("mascot-shine", x + 2, 54, 2.4, 2.4),
    ellipse("mascot-shine", x - 2, 60.2, 1.2, 1.2),
];
const openEyes = () => [...eye(46), ...eye(76)];
const eyes = {
    calm: openEyes,
    happy: openEyes,
    sleepy: () => [46, 76].map((x) => line(`M${x - 5.5} 57Q${x} 62.5 ${x + 5.5} 57`)),
    sad: openEyes,
};
const features = {
    calm: () => [line("M54 67.5Q61 74 68 67.5")],
    happy: () => [
        make("path", { class: "mascot-smile", d: "M52.5 67Q61 69.2 69.5 67C70 73.5 66 78 61 78C56 78 52 73.5 52.5 67Z" }),
        make("path", { class: "mascot-tongue", d: "M55.8 75Q61 70.6 66.2 75Q64.2 77.8 61 77.8Q57.8 77.8 55.8 75Z" }),
    ],
    sleepy: () => [line("M57 69Q61 72.5 65 69")],
    sad: () => [line("M56.5 72Q61 68.5 65.5 72"), line("M41 47Q44 44.2 47.5 43.2"), line("M81 47Q78 44.2 74.5 43.2")],
};

export function mascot(mood = "calm", size = "") {
    const id = `mello${count++}`;
    const stop = (name, offset) => make("stop", { class: name, offset });
    const cheek = (cx) => make("ellipse", { cx, cy: 68, rx: 9, ry: 6.5, fill: `url(#${id}c)` });
    return make("svg", { viewBox: "0 0 120 100", class: `mascot mascot-${mood} ${size}`, "aria-hidden": "true" },
        make("defs", {},
            make("linearGradient", { id: `${id}b`, x1: 0.35, y1: 0, x2: 0.6, y2: 1 }, stop("mascot-top", 0), stop("mascot-middle", 0.5), stop("mascot-bottom", 1)),
            make("radialGradient", { id: `${id}c` }, stop("mascot-blush", 0), stop("mascot-blush mascot-clear", 1))),
        make("path", { class: "mascot-shadow", d: BODY, transform: "translate(0 4)" }),
        make("path", { class: "mascot-body", d: BODY, fill: `url(#${id}b)` }),
        make("g", { transform: "translate(3 -2)" },
            cheek(34), cheek(88), make("g", { class: "mascot-eyes" }, ...eyes[mood]()), ...features[mood]()));
}
