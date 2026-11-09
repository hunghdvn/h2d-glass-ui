import type { RefObject } from 'react';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';

/** The custom property of the frame that holds the height of the sticky heading. */
export const HEAD_HEIGHT_PROPERTY = '--flg-table-head-height';

/**
 * Hands the measured height of the `<thead>` of a sticky Table to its frame, as a custom property
 * the stylesheet takes the scroll padding from. A heading is as tall as what is in it: a button, a
 * second row of grouped columns or a larger font all change it, and no estimate made from the
 * padding can follow them. The property is set on the element and not through React, so a render
 * of the Table has nothing to reconcile and a `style` of the caller's is left as it is. Nothing is
 * measured when the heading does not stick, and where there is no ResizeObserver, as in jsdom, the
 * stylesheet's own estimate stays in place.
 */
export function useHeadHeight(
  frameRef: RefObject<HTMLElement | null>,
  tableRef: RefObject<HTMLTableElement | null>,
  active: boolean,
): void {
  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    const table = tableRef.current;
    if (!active || !frame || !table || typeof ResizeObserver === 'undefined') return undefined;
    let head: HTMLTableSectionElement | null = null;
    const measure = () => {
      // The heading may come and go while the table is on screen, so it is looked up each time.
      if (table.tHead !== head) {
        if (head) observer.unobserve(head);
        head = table.tHead;
        if (head) observer.observe(head);
      }
      if (head)
        frame.style.setProperty(HEAD_HEIGHT_PROPERTY, `${head.getBoundingClientRect().height}px`);
      else frame.style.removeProperty(HEAD_HEIGHT_PROPERTY);
    };
    const observer = new ResizeObserver(measure);
    // The table is watched too: a heading that is added or removed changes its size.
    observer.observe(table);
    measure();
    return () => {
      observer.disconnect();
      frame.style.removeProperty(HEAD_HEIGHT_PROPERTY);
    };
  }, [frameRef, tableRef, active]);
}
