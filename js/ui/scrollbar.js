// Capsule scrollbar that fades in while the screen scrolls.
export function attachScrollbar(wrapper, scroller) {
    const thumb = wrapper.querySelector(".scroll-thumb");
    let frame = 0;
    let hideTimer;
    let size = null; // paddings and heights, measured once per scroll gesture

    const update = () => {
        frame = 0;
        if (!size) {
            const style = getComputedStyle(scroller);
            size = { top: parseFloat(style.paddingTop), bottom: parseFloat(style.paddingBottom), thumb: thumb.offsetHeight, height: scroller.clientHeight, full: scroller.scrollHeight };
        }
        const distance = size.full - size.height;
        if (distance <= 0) return;
        const travel = size.height - size.top - size.bottom - size.thumb;
        const ratio = Math.min(1, Math.max(0, scroller.scrollTop / distance));
        thumb.style.transform = `translate3d(0, ${size.top + ratio * Math.max(travel, 0)}px, 0)`;
        if (!hideTimer) thumb.classList.add("is-scrolling");
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            hideTimer = 0;
            size = null;
            thumb.classList.remove("is-scrolling");
        }, 650);
    };

    scroller.addEventListener("scroll", () => { frame ||= requestAnimationFrame(update); }, { passive: true });
}
