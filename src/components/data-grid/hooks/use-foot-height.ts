import type { RefObject } from 'react';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';

/** The custom property of the frame that holds the height of the sticky footer. */
export const FOOT_HEIGHT_PROPERTY = '--flg-data-grid-foot-height';

/**
 * Hands the measured height of the `<tfoot>` of a grid that scrolls its rows (a grid with a `height`) to
 * its frame, as a custom property the stylesheet takes the `scroll-margin-bottom` of the rows from, so a
 * row or a cell scrolled into view stops above the footer that sticks over the bottom of the frame, as
 * `useHeadHeight` does for the heading (the footer is as tall as what is in it, and no estimate follows it). The
 * property is set on the element and not through React, so a draw of the grid has nothing to reconcile.
 * Nothing is measured, and nothing is written, unless the grid has a height and a footer (`active`); the
 * stylesheet declares the property as `0px` on the frame, which is what a grid without one reads. Where
 * there is no ResizeObserver, as in jsdom, nothing is written.
 */
export function useFootHeight(
  frameRef: RefObject<HTMLElement | null>,
  tableRef: RefObject<HTMLTableElement | null>,
  active: boolean,
): void {
  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    const table = tableRef.current;
    if (!active || !frame || !table || typeof ResizeObserver === 'undefined') return undefined;
    let foot: HTMLTableSectionElement | null = null;
    const measure = (entries: ResizeObserverEntry[] = []) => {
      // The footer comes and goes while the table is on screen (the first rows load), so it is looked up
      // each time.
      let changed = false;
      if (table.tFoot !== foot) {
        if (foot) observer.unobserve(foot);
        foot = table.tFoot;
        if (foot) observer.observe(foot);
        changed = true;
      }
      if (!foot) {
        frame.style.removeProperty(FOOT_HEIGHT_PROPERTY);
        return;
      }
      // The layout size the observer reports keeps fractions and does not follow a transform.
      const entry = entries.find((candidate) => candidate.target === foot);
      if (!entry && !changed && entries.length > 0) return;
      const height = entry?.borderBoxSize?.[0]?.blockSize ?? foot.offsetHeight;
      frame.style.setProperty(FOOT_HEIGHT_PROPERTY, `${height}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(table);
    measure();
    return () => {
      observer.disconnect();
      frame.style.removeProperty(FOOT_HEIGHT_PROPERTY);
    };
  }, [frameRef, tableRef, active]);
}
