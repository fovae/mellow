const NS = "http://www.w3.org/2000/svg";
const shapes = {
    home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
    dictionaries: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
    cards: "M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v5H3z",
    tests: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20 M12 6v6l4 2",
    profile: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8",
    bookmark: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z",
    edit: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
    trash: "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6",
    plus: "M12 5v14 M5 12h14",
    search: "M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14 M20 20l-4-4",
    sound: "M11 5L6 9H3v6h3l5 4z M15.5 8.5a5 5 0 0 1 0 7 M18.5 5.5a9 9 0 0 1 0 13",
    play: "M7 4l13 8-13 8z",
    undo: "M9 14l-5-5 5-5 M4 9h11a5 5 0 0 1 0 10h-4",
    chevron: "M9 6l6 6-6 6",
    settings: "M4 7h10 M18 7h2 M4 17h2 M10 17h10 M16 5v4 M8 15v4",
    download: "M12 4v11 M7 10l5 5 5-5 M5 20h14",
    share: "M12 15V4 M7 9l5-5 5 5 M5 20h14",
    folder: "M3 6h6l2 3h10v10H3z",
    bulb: "M9 18h6 M10 21h4 M12 3a6 6 0 0 0-4 10c1 1 1.5 1.5 1.5 3h5c0-1.500.5-2 1.500-3a6 6 0 0 0-4-10z",
    star: "M12 3l2.700 5.700 6.300.8-4.600 4.300 1.200 6.200-5.600-3.100-5.600 3.100 1.200-6.200L3 9.500l6.300-.8z",
    layers: "M12 3l9 5-9 5-9-5z M3 13l9 5 9-5",
    check: "M5 12l5 5L20 7",
    close: "M18 6L6 18 M6 6l12 12",
};

export function icon(name) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", "icon");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", shapes[name]);
    svg.append(path);
    return svg;
}
