import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';

/** The custom property of `<html>` that holds the height of the sticky header. */
export const HEADER_OFFSET_PROPERTY = '--flg-app-shell-header-offset';

/**
 * Hands the measured height of the header to the document, as a custom property its scroll padding
 * is taken from: a sticky header covers the top of the viewport, so a control focused from below, an
 * `#anchor` or a find-in-page hit would land under it (WCAG 2.4.11). The first row of the grid takes
 * it too, where it is more than the height variable, so a taller header does not cover the main. A
 * header is as tall as what is in it, and the stylesheet only knows the height of an empty one, so it
 * is measured; its own `min-height` is the variable alone, so the measure never feeds it. The property
 * is set on the element and not through React, so a render has nothing to reconcile and a `style` of
 * the caller's on `<html>` is left alone, and only when the height changes. Where there is no
 * ResizeObserver, as in jsdom, nothing is written and the stylesheet's own 56px or 60px stays.
 * The header is an element and not a ref, so that a header that mounts after the shell is measured
 * too.
 */
export function useHeaderOffset(header: HTMLElement | null): void {
  useIsoLayoutEffect(() => {
    if (!header || typeof ResizeObserver === 'undefined') return undefined;
    const root = document.documentElement;
    let written: number | undefined;
    const measure = (entries: ResizeObserverEntry[] = []) => {
      // The size the observer reports is the layout one and keeps fractions; where an entry has no
      // border-box size the layout height is read, which is whole pixels.
      const entry = entries.find((candidate) => candidate.target === header);
      const height = entry?.borderBoxSize?.[0]?.blockSize ?? header.offsetHeight;
      if (height === written) return;
      written = height;
      root.style.setProperty(HEADER_OFFSET_PROPERTY, `${height}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    measure();
    return () => {
      observer.disconnect();
      root.style.removeProperty(HEADER_OFFSET_PROPERTY);
    };
  }, [header]);
}
