let locks = 0;
let saved: { overflow: string; gutter: string } | null = null;

/**
 * Stops the page from scrolling while a modal is open. Counted, so nested modals share one lock: the
 * first call saves the inline style of `<html>`, the last release restores it. When the page shows a
 * classic scrollbar, `scrollbar-gutter: stable` keeps its space so the layout does not shift.
 * Returns the release function; calling it twice is safe.
 */
export function lockScroll(): () => void {
  const root = document.documentElement;
  if (locks === 0) {
    saved = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter };
    const hasScrollbar = window.innerWidth > root.clientWidth;
    root.style.overflow = 'hidden';
    if (hasScrollbar) root.style.scrollbarGutter = 'stable';
  }
  locks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0 && saved) {
      root.style.overflow = saved.overflow;
      root.style.scrollbarGutter = saved.gutter;
      saved = null;
    }
  };
}
