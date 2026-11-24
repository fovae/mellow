// Capsule scrollbar that fades in while the screen scrolls.
export function attachScrollbar(wrapper, scroller) {
    const thumb = wrapper.querySelector(".scroll-thumb");
    let frame = 0;
    let hideTimer;

    const update = () => {
        frame = 0;
        const distance = scroller.scrollHeight - scroller.clientHeight;
        if (distance <= 0) return;
        const style = getComputedStyle(scroller);
        const top = parseFloat(style.paddingTop);
        const travel = scroller.clientHeight - top - parseFloat(style.paddingBottom) - thumb.offsetHeight;
        const ratio = Math.min(1, Math.max(0, scroller.scrollTop / distance));
        thumb.style.transform = `translate3d(0, ${top + ratio * Math.max(travel, 0)}px, 0)`;
        thumb.classList.add("is-scrolling");
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => thumb.classList.remove("is-scrolling"), 650);
    };

    scroller.addEventListener("scroll", () => { frame ||= requestAnimationFrame(update); }, { passive: true });
}
