// The on-screen keyboard, one mechanism for the whole app (the same as in Training):
//  - its height goes to CSS as --kb-h and html[data-kb] while it is open, the visible height as --vvh;
//    sheets and full screens keep their place and only make room at the bottom, so nothing jumps;
//  - the focused field scrolls into the visible part, with its row, in the nearest scrolling box.
// iOS (Safari and the home-screen app): the keyboard shrinks visualViewport, the window (innerHeight) stays:
// height = innerHeight - (vv.height + vv.offsetTop). Android may shrink the window itself: then --kb-h is 0
// (the window is already above it) but data-kb is set.
const MIN_KB = 120; // less is not a keyboard (toolbars, the suggestions bar)
const GAP = 12;

const isField = (el) => Boolean(el) && (el.tagName === "TEXTAREA" || el.isContentEditable
    || (el.tagName === "INPUT" && !/^(checkbox|radio|button|submit|range|color|file)$/.test(el.type)));
// iOS never shrinks the window for the keyboard; there a shorter window is Safari's own bar, not a keyboard.
const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const calm = () => document.documentElement.dataset.motion === "off" || matchMedia("(prefers-reduced-motion: reduce)").matches;

function scroller(el) {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const overflow = getComputedStyle(p).overflowY;
        if ((overflow === "auto" || overflow === "scroll") && p.scrollHeight > p.clientHeight) return p;
    }
    return null;
}

// Scrolls so that the field with its row (label, note) is fully above the keyboard.
function reveal(el) {
    const view = window.visualViewport;
    const top0 = view ? view.offsetTop : 0;
    const bottom0 = top0 + (view ? view.height : window.innerHeight);
    const row = el.closest(".cell, .field, .form") ?? el;
    const block = row.getBoundingClientRect().height < (bottom0 - top0) * 0.7 ? row : el;
    const box = scroller(block);
    const rect = block.getBoundingClientRect();
    let top = top0 + GAP;
    let bottom = bottom0 - GAP;
    if (box) {
        const b = box.getBoundingClientRect();
        top = Math.max(top, b.top + GAP);
        bottom = Math.min(bottom, b.bottom - GAP);
    }
    let dy = 0;
    if (rect.bottom > bottom) dy = rect.bottom - bottom;
    if (rect.top - dy < top) dy = rect.top - top;
    if (Math.abs(dy) < 2 || !box) return;
    box.scrollBy({ top: dy, behavior: calm() ? "instant" : "smooth" });
}

export function initViewport() {
    const root = document.documentElement;
    let baseHeight = window.innerHeight;
    let open = false;
    let timers = [];
    // Only a changed value is written: each write restyles the whole page.
    const written = {};
    const setVar = (name, value) => {
        if (written[name] === value) return;
        written[name] = value;
        root.style.setProperty(name, value);
    };

    const update = () => {
        const view = window.visualViewport;
        const focused = isField(document.activeElement);
        // No field in focus: no keyboard; remember the full window height (rotation, browser bars).
        if (!focused) baseHeight = window.innerHeight;
        const keyboard = view ? Math.max(0, window.innerHeight - view.height - view.offsetTop) : 0;
        const now = focused && (keyboard >= MIN_KB || (!ios && baseHeight - window.innerHeight >= MIN_KB));
        setVar("--kb-h", `${now ? Math.round(keyboard) : 0}px`);
        setVar("--vvh", `${Math.round(view ? view.height : window.innerHeight)}px`);
        if (now !== open) {
            open = now;
            root.toggleAttribute("data-kb", now);
        }
    };
    // The keyboard takes about 300 ms to come; checks again later in case iOS was still moving the page.
    const later = (ms) => {
        timers.forEach(clearTimeout);
        timers = [ms, ms + 450, ms + 1000].map((delay) => setTimeout(() => {
            update();
            if (isField(document.activeElement)) reveal(document.activeElement);
        }, delay));
    };

    window.visualViewport?.addEventListener("resize", () => { update(); later(60); });
    window.visualViewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", () => { baseHeight = window.innerHeight; update(); });
    document.addEventListener("focusin", (event) => {
        if (!isField(event.target)) return;
        update();
        later(open ? 0 : 320);
    });
    // Moving to the next field must not blink.
    document.addEventListener("focusout", () => setTimeout(update, 50));
    // iOS "Done" hides the keyboard but may leave the field focused: the next resize clears it as well.
    window.visualViewport?.addEventListener("resize", () => setTimeout(update, 350));
    update();
}
