// Pictures in the style of Mello: soft shapes, light from above, a thin outline, sometimes a face.
// Data keeps emoji as short names; the screen shows the picture.
// A picture is a list of layers: [paint, ...shapes]. Box 64 x 64.
//   paint "pink": a filled shape with an outline (shapes of one layer are joined)
//   paint "~pink" or "~pink:6": lines of a given width; "=#hex": a flat shape without outline
//   shape "c x y r" circle, "e x y rx ry" ellipse, "r x y w h radius" rectangle, anything else is a path
//   ["face", x, y, size, mood]: calm, happy, sleepy or eyes
//   a paint can end with "@name": the class art-name, used by animations in css/art.css
const NS = "http://www.w3.org/2000/svg";
const paints = {
    lilac: ["#f7f0ff", "#c9b2fb", "#a284ee"], white: ["#ffffff", "#e9e1fb", "#b9a5ea"], blue: ["#e6f3ff", "#8cc0ff", "#5893ea"],
    pink: ["#ffeaf3", "#ffa0c4", "#ea719f"], peach: ["#ffefdd", "#ffb17c", "#ec864a"], yellow: ["#fff8d6", "#ffd055", "#e3a326"],
    mint: ["#e4fcef", "#7cdaab", "#41b081"], red: ["#ffe1df", "#ff8783", "#dd585e"], brown: ["#f6e6d8", "#c8946a", "#9c6b45"], ink: ["#7a6aa8", "#43366b", "#33284f"],
};
const CLOUD = "M20 56A12 12 0 0 1 16.500 32.500A15 15 0 0 1 45 29A13.700 13.700 0 0 1 46 56Z";
const HEART = "M32 56C12 42 6 33 6 23C6 14 13 9 20 9C26 9 30 12 32 16C34 12 38 9 44 9C51 9 58 14 58 23C58 33 52 42 32 56Z";
const STAR = "M32 7L39.500 23.500L57 25.500L44 38L47.500 56L32 47L16.500 56L20 38L7 25.500L24.500 23.500Z";
const BUBBLE = "M15 11H49a9 9 0 0 1 9 9V36a9 9 0 0 1-9 9H31L19 56V45H15a9 9 0 0 1-9-9V20a9 9 0 0 1 9-9Z";
const bars = (...colors) => colors.map((color, i) => [`=${color}`, `r4 ${12 + (40 / colors.length) * i} 56 ${40 / colors.length + 0.5} 0`]);
const columns = (...colors) => colors.map((color, i) => [`=${color}`, `r${4 + (56 / colors.length) * i} 12 ${56 / colors.length + 0.5} 40 0`]);
const flag = (...layers) => ({ flag: true, layers });

const pictures = {
    // Topics
    "👋": [["peach@wave", "r17 19 8 28 4", "r26 12 8 30 4", "r35 14 8 28 4", "r44 21 7.5 26 3.7", "r17 31 34.5 25 12", "M22 52C12 46 6 38 9 34.5C12 31.500 17 36 22 40Z"], ["face", 35, 43, 0.8, "calm"]],
    "💬": [["lilac", BUBBLE], ["face", 32, 27, 1.1, "happy"]],
    "🔢": [["yellow", "r7 10 50 46 13"], ["~ink:3.4", "M15 28l4-3.500v17", "M27 28.500q.5-4.500 5-4.500t5 4.200q0 4-10 13.300h10.500", "M44 25h8l-4.500 6.500q5 .2 5 5t-5 5q-3.500 0-4.500-2.500"]],
    "🕐": [["blue", "c32 32 24"], ["white", "c32 32 17"], ["~ink:3.4", "M32 21V32l7 4"]],
    "❓": [["pink", "c32 32 24"], ["~ink:4.5", "M25 26q.5-7 7-7t7 6.500q0 4.200-4 6.200-3 1.600-3 5.300"], ["=#33284f", "c32 45 2.8"]],
    "👨‍👩‍👧": [["blue", "r6 18 23 38 11.5"], ["pink", "r35 18 23 38 11.5"], ["yellow", "r22 34 20 23 10"], ["face", 17.5, 29, 0.55, "calm"], ["face", 46.5, 29, 0.55, "calm"], ["face", 32, 44, 0.55, "happy"]],
    "🍎": [["~brown:4", "M32 20Q31 13 28 10"], ["mint", "M33 15C33 9 38 5 45 5C45 12 40 15 33 15Z"], ["red", "M32 20C26 14 9 16 9 34C9 48 19 58 27 58C30 58 30 56 32 56C34 56 34 58 37 58C45 58 55 48 55 34C55 16 38 14 32 20Z"], ["face", 32, 37, 1, "happy"]],
    "🍽️": [["~lilac:4", "M7 12V24q0 5 3 6V52", "M13 12V24q0 5-3 6", "M55 52V12q-4 6-4 18h4"], ["white", "c32 33 17"], ["lilac", "c32 33 11"], ["face", 32, 32, 0.6, "calm"]],
    "🏠": [["peach", "r13 26 38 31 8"], ["red", "M9 31L28 12Q32 8 36 12L55 31Q58 36 52 36H12Q6 36 9 31Z"], ["face", 32, 45, 0.85, "calm"]],
    "👕": [["blue", "M23 9L8 17L12 32L18 30V55H46V30L52 32L56 17L41 9Q32 18 23 9Z"], ["face", 32, 37, 0.85, "calm"]],
    "🎨": [["brown", "M32 8C17 8 6 19 6 32S17 56 29 56C36 56 36 50 34 47C32 43 36 40 41 40H47C53 40 58 36 58 30C58 17 46 8 32 8Z"], ["=#ff8783", "c20 24 5"], ["=#ffd055", "c34 18 5"], ["=#8cc0ff", "c46 27 5"], ["=#7cdaab", "c17 38 5"]],
    "🫀": [["pink@beat", HEART], ["~white:3.4", "M13 30h9l4-9 6 17 5-8h14"]],
    "🏙️": [["blue", "r5 27 19 30 5"], ["pink", "r41 33 18 24 5"], ["lilac", "r21 9 23 48 6"], ["=#ffffff", "r9 33 4 5 1.5", "r9 43 4 5 1.5", "r47 39 4 5 1.5", "r47 48 4 5 1.5", "r27 37 4 5 1.5", "r34 37 4 5 1.5", "r27 46 4 5 1.5", "r34 46 4 5 1.5"], ["face", 32.5, 22, 0.6, "calm"]],
    "✈️": [["blue@fly", "M8 34L55 10Q60 8 58 14L45 54Q43 58 40 54L31 41L10 39Q4 38 8 34Z"], ["white@fly", "M31 41L52 17L24 39Z"]],
    "🛍️": [["~pink:4", "M22 28V18a10 10 0 0 1 20 0V28"], ["pink", "M14 22H50Q52 22 52.500 24L56 52Q56 57 51 57H13Q8 57 8 52L11.500 24Q12 22 14 22Z"], ["face", 32, 40, 0.95, "happy"]],
    "🌿": [["mint", "M12 54C4 28 22 8 56 8C58 40 40 58 12 54Z"], ["~white:3.4", "M8 58C20 40 32 30 45 20", "M24 41V28", "M27 38H41"]],
    "⛅": [["~yellow:3.6@spin", "M22 3v4", "M4 21h4", "M9 8l3 3", "M36 8l-3 3"], ["yellow", "c22 21 12"], ["white@drift", CLOUD], ["face", 31, 43, 0.85, "happy"]],
    "🐾": [["brown", "e32 43 16 13"], ["brown", "e13 30 6 8", "e25 16 6.5 8.5", "e40 16 6.5 8.5", "e51 30 6 8"], ["face", 32, 42, 0.8, "calm"]],
    "💼": [["~brown:4", "M23 22V17a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v5"], ["brown", "r7 21 50 35 9"], ["~white:2.6", "M8 37H56"], ["yellow", "r27 32 10 10 4"]],
    "🎓": [["~yellow:3.4", "M54 26V43"], ["lilac", "M16 31V46Q32 57 48 46V31L32 38Z"], ["blue", "M32 11L59 25L32 38L5 25Z"], ["yellow", "c54 45 3.5"]],
    "💻": [["blue", "r10 10 44 34 7"], ["white", "r15 15 34 24 4"], ["lilac", "r4 46 56 9 4.5"], ["face", 32, 26, 0.75, "calm"]],
    "⚽": [["white@spin", "c32 32 24"], ["=#43366b", "M32 22L41.500 29L38 40H26L22.500 29Z"], ["~ink:2.6", "M32 22V10", "M41.500 29L53 25", "M38 40L45 50", "M26 40L19 50", "M22.500 29L11 25"]],
    "💛": [["yellow@beat", HEART], ["face", 32, 28, 1.1, "happy"]],
    "📏": [["yellow", "M9 42L42 9Q44 7 46 9L55 18Q57 20 55 22L22 55Q20 57 18 55L9 46Q7 44 9 42Z"], ["~ink:2.8", "M17 37l5 5", "M24 30l7 7", "M31 23l5 5", "M38 16l7 7"]],
    "🏃": [["red", "M6 42C6 30 9 22 15 21C18 28 24 29 29 24L41 36C51 37 58 41 58 47V50H6Z"], ["white", "r4 47 56 9 4.5"], ["~white:2.8", "M28 33l5-4", "M33 38l5-4"]],
    "🩺": [["~blue:4.5", "M15 8V21a11 11 0 0 0 22 0V8", "M26 32V42a10.500 10.500 0 0 0 21 0V36"], ["pink", "c47 30 7"], ["white", "c15 9 3", "c37 9 3"]],
    "⏰": [["red", "c14 14 7", "c50 14 7"], ["~red:5", "M18 52l-5 5", "M46 52l5 5"], ["red", "c32 34 22"], ["white", "c32 34 15.5"], ["~ink:3.4", "M32 25V34l6 3"]],
    "🗣️": [["pink", "M12 6H36a7 7 0 0 1 7 7V23a7 7 0 0 1-7 7H22L14 38V30H12a7 7 0 0 1-7-7V13a7 7 0 0 1 7-7Z"], ["blue", "M29 26H52a7 7 0 0 1 7 7V43a7 7 0 0 1-7 7V58L43 50H29a7 7 0 0 1-7-7V33a7 7 0 0 1 7-7Z"], ["face", 41, 37, 0.65, "happy"]],
    "🔑": [["~yellow:7", "M30 30L55 55", "M44 44l6-6", "M51 51l5-5"], ["yellow", "c22 22 15"], ["=#ffffff", "c19 19 5"]],
    "🍳": [["~ink:7", "M43 29L58 19"], ["ink", "c27 36 21"], ["white", "e27 36 15 12"], ["yellow", "c27 35 6.5"]],
    "🌍": [["blue", "c32 32 25"], ["=#7cdaab", "M12 22Q22 9 33 14Q37 20 29 24Q25 32 17 33Q9 30 12 22Z", "M40 34Q50 28 55 34Q53 47 43 52Q36 44 40 34Z"], ["face", 30, 33, 0.9, "calm"]],
    "☕": [["~white:4", "M46 28h4a7 7 0 0 1 0 14h-5"], ["~lilac:3.2@steam", "M22 5q4 4 0 9", "M34 5q4 4 0 9"], ["white", "M12 21H46Q48 21 48 23V40a16 16 0 0 1-16 16H26a16 16 0 0 1-16-16V23Q10 21 12 21Z"], ["face", 29, 36, 0.95, "calm"]],
    // Achievements
    "🌱": [["~mint:4.5", "M32 54V32"], ["mint", "M32 35C18 37 9 29 9 16C24 14 32 22 32 35Z", "M32 30C32 19 40 11 55 11C55 24 46 32 32 30Z"], ["brown", "e32 55 16 4.5"]],
    "💯": [["red", "c32 32 25"], ["~white:4", "M14 27l4-3.500v17", "M31 23.500a4.600 8.500 0 1 0 .1 0Z", "M46 23.500a4.600 8.500 0 1 0 .1 0Z"]],
    "🚀": [["yellow@flicker", "M25 46H39Q39 55 32 61Q25 55 25 46Z"], ["red", "M21 32L10 45V54L24 46Z", "M43 32L54 45V54L40 46Z"], ["white", "M32 4C45 15 47 31 42 48H22C17 31 19 15 32 4Z"], ["face", 32, 29, 0.75, "happy"]],
    "🔥": [["peach@flicker", "M32 4C34 16 53 22 53 40C53 52 44 60 32 60S11 52 11 40C11 32 15 28 19 22C20 28 23 30 26 30C24 20 28 10 32 4Z"], ["yellow", "M32 30C36 37 43 40 43 48C43 54 38 58 32 58S21 54 21 48C21 41 28 38 32 30Z"], ["face", 32, 47, 0.8, "happy"]],
    "⚡": [["yellow", "M37 4L12 36H28L24 60L52 26H35Z"]],
    "🏅": [["blue", "M18 4H46L39 28H25Z"], ["yellow", "c32 40 19"], ["face", 32, 39, 0.95, "happy"]],
    "⭐": [["yellow", STAR], ["face", 32, 33, 0.85, "happy"]],
    "🌟": [["~yellow:4@spin", "M32 1v4", "M4 12l3 3", "M60 12l-3 3"], ["yellow", STAR], ["face", 32, 33, 0.85, "happy"]],
    "👑": [["yellow", "M8 19L20 31L32 11L44 31L56 19L52 53H12Z"], ["pink", "c8 17 4", "c32 9 4", "c56 17 4"], ["face", 32, 42, 0.85, "calm"]],
    "📚": [["red", "r9 43 46 14 5"], ["blue", "r13 28 42 14 5"], ["yellow", "r8 13 43 14 5"], ["face", 34, 34.5, 0.55, "calm"]],
    "🎯": [["red", "c32 32 25"], ["white", "c32 32 17"], ["red", "c32 32 9"]],
    "🦉": [["brown", "M11 10Q20 17 32 15Q44 17 53 10V38Q53 58 32 58T11 38Z"], ["white", "c22.5 30 9.5", "c41.5 30 9.5"], ["yellow", "M28 38H36L32 45Z"], ["=#33284f", "c23 30 5.5", "c41 30 5.5"], ["=#ffffff", "c25 28 2", "c43 28 2"]],
    // Rewards and messages
    "💧": [["blue", "M32 4C42 18 53 28 53 41A21 21 0 0 1 11 41C11 28 22 18 32 4Z"], ["face", 32, 42, 1, "happy"]],
    "🧊": [["blue", "r9 10 46 46 13"], ["~white:3.4", "M17 27V24q0-6 6-6h3"], ["face", 32, 36, 1.05, "calm"]],
    "🎁": [["pink", "r10 26 44 31 7"], ["pink", "r6 18 52 14 6"], ["yellow", "r28 18 8 39 2"], ["yellow", "M32 18C22 2 10 8 17 18Z", "M32 18C42 2 54 8 47 18Z"]],
    "✨": [["yellow@twinkle", "M26 8Q29 27 48 32Q29 37 26 56Q23 37 4 32Q23 27 26 8Z"], ["pink@twinkle", "M50 4Q51 12 59 14Q51 16 50 24Q49 16 41 14Q49 12 50 4Z"], ["blue@twinkle", "M50 42Q51 49 58 51Q51 53 50 60Q49 53 42 51Q49 49 50 42Z"]],
    "💡": [["lilac", "r25 46 14 12 5"], ["yellow", "M32 5a19.500 19.500 0 0 0-11.500 35q4 3 4 8h15q0-5 4-8A19.500 19.500 0 0 0 32 5Z"], ["face", 32, 25, 0.95, "happy"]],
    "🌤️": [["~yellow:3.6@spin", "M22 3v4", "M4 21h4", "M9 8l3 3", "M36 8l-3 3"], ["yellow", "c22 21 12"], ["white@drift", CLOUD], ["face", 31, 43, 0.85, "happy"]],
    "💭": [["white@drift", "M22 42A12 12 0 0 1 18 18.500A15 15 0 0 1 46 15A13.700 13.700 0 0 1 47 42Z"], ["white", "c18 50 4.5"], ["white", "c10 58 2.6"], ["face", 33, 29, 0.85, "calm"]],
    "🏆": [["~yellow:4", "M17 15H9q0 15 12 17", "M47 15H55q0 15-12 17"], ["yellow", "r28 38 8 12 2", "r18 48 28 9 4.5"], ["yellow", "M15 8H49V24C49 36 42 43 32 43S15 36 15 24Z"], ["face", 32, 24, 0.95, "happy"]],
    "🃏": [["pink", "M30 8L53 13Q57 14 56 18L48 50Q47 54 43 53L24 48Z"], ["blue", "r8 11 30 42 8"], ["face", 23, 30, 0.7, "happy"]],
    "✏️": [["yellow", "M42 8L56 22L26 52L12 38Z"], ["pink", "M42 8Q46 4 50 8L56 14Q60 18 56 22Z"], ["white", "M12 38L26 52L8 56Z"], ["=#43366b", "M10 48.500L15.500 54.200L8 56Z"]],
    "✅": [["mint", "c32 32 25"], ["~white:6", "M20 33l8.500 8.500L45 24"]],
    "✦": [["yellow", "M32 5Q36 27 59 32Q36 37 32 59Q28 37 5 32Q28 27 32 5Z"]],
    // Flags
    "🇬🇧": flag(["=#4a63b5", "r4 12 56 40 0"], ["~=#ffffff:8", "M4 12L60 52", "M60 12L4 52"], ["~=#e2606b:3", "M4 12L60 52", "M60 12L4 52"], ["=#ffffff", "r26 12 12 40 0", "r4 26 56 12 0"], ["=#e2606b", "r29 12 6 40 0", "r4 29 56 6 0"]),
    "🇪🇸": flag(["=#e2606b", "r4 12 56 40 0"], ["=#ffd055", "r4 22 56 20 0"], ["=#c9534f", "r16 27 8 9 3"]),
    "🇫🇷": flag(...columns("#5a7bd6", "#ffffff", "#ee6b74")),
    "🇩🇪": flag(...bars("#4b4560", "#e2606b", "#ffd055")),
    "🇮🇹": flag(...columns("#55bd86", "#ffffff", "#ee6b74")),
    "🇵🇹": flag(["=#ee6b74", "r4 12 56 40 0"], ["=#4fae7c", "r4 12 22 40 0"], ["=#ffd055", "c26 32 9"], ["=#ee6b74", "c26 32 5"]),
    "🇳🇱": flag(...bars("#e2606b", "#ffffff", "#5a7bd6")),
    "🇵🇱": flag(...bars("#ffffff", "#ee6b74")),
    "🇺🇦": flag(...bars("#6aa5f0", "#ffd85e")),
    "🇷🇺": flag(...bars("#ffffff", "#5a7bd6", "#ee6b74")),
    "🇹🇷": flag(["=#e2606b", "r4 12 56 40 0"], ["=#ffffff", "c25 32 10"], ["=#e2606b", "c28 32 8"], ["=#ffffff", "M41 26l1.800 4 4.400.4-3.300 3 1 4.300-3.900-2.300-3.900 2.300 1-4.300-3.300-3 4.400-.4Z"]),
    "🇯🇵": flag(["=#ffffff", "r4 12 56 40 0"], ["=#ee6b74", "c32 32 11"]),
    "🇰🇷": flag(["=#ffffff", "r4 12 56 40 0"], ["=#5a7bd6", "c32 32 10"], ["=#ee6b74", "M22 32A10 10 0 0 1 42 32A5 5 0 0 1 32 32A5 5 0 0 0 22 32Z"], ["~=#43366b:2", "M12 22l5-4", "M14 25l5-4", "M47 18l5 4", "M45 21l5 4", "M12 42l5 4", "M14 39l5 4", "M47 46l5-4", "M45 43l5-4"]),
    "🇨🇳": flag(["=#e2606b", "r4 12 56 40 0"], ["=#ffd055", "M18 18l2.300 5 5.400.6-4 3.700 1.100 5.400-4.800-2.700-4.800 2.700 1.100-5.400-4-3.700 5.400-.6Z", "c30 18 1.6", "c33 23 1.6", "c33 29 1.6", "c30 34 1.6"]),
};

export const hasArt = (name) => name in pictures;

const make = (tag, attrs, ...children) => {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) if (value !== undefined) el.setAttribute(key, value);
    el.append(...children);
    return el;
};

// Gradients are shared by all pictures, so they are added to the page once.
function addPaints() {
    if (document.getElementById("art-paints")) return;
    document.body.append(make("svg", { id: "art-paints", class: "art-paints", "aria-hidden": "true" }, make("defs", {},
        ...Object.entries(paints).map(([name, [top, bottom]]) => make("linearGradient", { id: `art-${name}`, gradientUnits: "userSpaceOnUse", x1: 24, y1: 4, x2: 38, y2: 62 },
            make("stop", { offset: 0.1, "stop-color": top }), make("stop", { offset: 1, "stop-color": bottom }))),
        make("clipPath", { id: "art-flag" }, make("rect", { x: 4, y: 12, width: 56, height: 40, rx: 11 })))));
}

function shape(text, attrs) {
    const [x, y, a, b, c] = text.slice(1).split(" ");
    if (text[0] === "c") return make("circle", { cx: x, cy: y, r: a, ...attrs });
    if (text[0] === "e") return make("ellipse", { cx: x, cy: y, rx: a, ry: b, ...attrs });
    if (text[0] === "r") return make("rect", { x, y, width: a, height: b, rx: c, ...attrs });
    return make("path", { d: text, ...attrs });
}

function face([, x, y, size, mood]) {
    const eyes = [-10, 10].map((dx) => (mood === "sleepy"
        ? make("path", { class: "art-line", d: `M${dx - 4} 0q4 4 8 0` })
        : make("g", {}, make("ellipse", { cx: dx, cy: 0, rx: 4, ry: 5, fill: "#33284f" }), make("circle", { cx: dx + 1.4, cy: -2, r: 1.7, fill: "#fff" }))));
    const mouth = mood === "happy"
        ? make("path", { d: "M-5 6Q0 7.500 5 6Q5 12.500 0 12.500Q-5 12.500 -5 6Z", fill: "#33284f" })
        : mood !== "eyes" && make("path", { class: "art-line", d: "M-4 7Q0 11 4 7" });
    return make("g", { transform: `translate(${x} ${y}) scale(${size * 0.82})` },
        make("ellipse", { cx: -16, cy: 6, rx: 4.5, ry: 3, fill: "#ff7fac", opacity: 0.45 }), make("ellipse", { cx: 16, cy: 6, rx: 4.5, ry: 3, fill: "#ff7fac", opacity: 0.45 }),
        make("g", { class: "art-eyes" }, ...eyes), ...[mouth].filter(Boolean));
}

function layer(spec) {
    if (spec[0] === "face") return face(spec);
    const [, isLine, paint, width, move] = spec[0].match(/^(~?)(=?#?\w+)(?::([\d.]+))?(?:@([a-z]+))?$/);
    const flat = paint.startsWith("=") ? paint.slice(1) : null;
    const group = make("g", { class: move ? `art-${move}` : undefined });
    const shapes = spec.slice(1);
    const add = (attrs) => shapes.forEach((text) => group.append(shape(text, attrs)));
    const round = { "stroke-linejoin": "round", "stroke-linecap": "round" };
    if (isLine) {
        const color = flat ?? (paint === "white" ? "#fff" : paints[paint][2]);
        add({ fill: "none", stroke: color, "stroke-width": width ?? 4, ...round });
    } else if (flat) add({ fill: flat });
    else {
        add({ fill: paints[paint][2], stroke: paints[paint][2], "stroke-width": 3.6, ...round });
        add({ fill: `url(#art-${paint})` });
    }
    return group;
}

// An unknown emoji (an old file, for example) stays text.
export function art(name, className = "") {
    const picture = pictures[name];
    if (!picture) return document.createTextNode(name);
    addPaints();
    const svg = make("svg", { viewBox: "0 0 64 64", class: `art ${className}`, "aria-hidden": "true" });
    if (picture.flag) {
        svg.append(make("g", { "clip-path": "url(#art-flag)" }, ...picture.layers.map(layer)),
            make("rect", { x: 4, y: 12, width: 56, height: 40, rx: 11, fill: "none", stroke: "#b9a5ea", "stroke-width": 2 }));
    } else svg.append(...picture.map(layer));
    return svg;
}

// Text with a picture of a drop after it.
export const withDrop = (text) => [`${text} `, art("💧", "art-inline")];
