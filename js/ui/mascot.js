// Mello, the cloud. Moods: calm, happy, sleepy, sad.
const NS = "http://www.w3.org/2000/svg";
const mouths = { calm: "M52 66 q8 6 16 0", happy: "M49 63 q11 15 22 0 z", sleepy: "M55 68 q5 -4 10 0", sad: "M52 70 q8 -7 16 0" };

const make = (tag, attrs) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
};

export function mascot(mood = "calm", size = "") {
    const svg = make("svg", { viewBox: "0 0 120 100", class: `mascot mascot-${mood} ${size}`, "aria-hidden": "true" });
    svg.append(
        make("path", { class: "mascot-body", d: "M32 90 A22 22 0 0 1 26 47 A26 26 0 0 1 48 22 A30 30 0 0 1 92 36 A25 25 0 0 1 92 90 Z" }),
        make("ellipse", { class: "mascot-cheek", cx: 38, cy: 64, rx: 6, ry: 4 }),
        make("ellipse", { class: "mascot-cheek", cx: 82, cy: 64, rx: 6, ry: 4 }));
    const eyes = make("g", { class: "mascot-eyes" });
    for (const x of [46, 74]) {
        eyes.append(mood === "sleepy"
            ? make("path", { class: "mascot-line", d: `M${x - 5} 54 q5 5 10 0` })
            : make("ellipse", { class: "mascot-eye", cx: x, cy: 53, rx: 4.5, ry: 6 }));
    }
    svg.append(eyes, make("path", { class: mood === "happy" ? "mascot-smile" : "mascot-line", d: mouths[mood] }));
    return svg;
}
