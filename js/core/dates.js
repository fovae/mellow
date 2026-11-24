export const DAY = 86400000;

export function dayKey(date = new Date()) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Local midnight `days` from now. Uses calendar days, so it is safe across DST changes.
export function startOfDay(now, days = 0) {
    const d = new Date(now);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days).getTime();
}

export const lastDays = (count, now = Date.now()) =>
    Array.from({ length: count }, (_, i) => new Date(startOfDay(now, i - count + 1)));
