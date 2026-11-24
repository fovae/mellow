// Colour styles; the colours themselves are in css/themes.css. price 0 = free.
export const accents = [
    { id: "mellow", price: 0 }, { id: "ocean", price: 0 }, { id: "forest", price: 0 }, { id: "sunset", price: 0 },
    { id: "rose", price: 60 }, { id: "aurora", price: 60 }, { id: "coffee", price: 90 }, { id: "graphite", price: 90 },
];
export const freeAccents = accents.filter((a) => !a.price).map((a) => a.id);
