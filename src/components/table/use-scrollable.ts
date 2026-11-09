import { useState } from 'react';
import type { RefObject } from 'react';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';

/**
 * Whether the scroll frame of a Table has something to scroll: the table is wider or taller than
 * the room the frame gives it. One ResizeObserver watches the frame and the table, since either
 * one changing can decide it, and the state is set only when the answer changes, so a resize that
 * leaves it as it was does not render again (and cannot start a loop of resize reports). Where
 * there is no ResizeObserver, as in jsdom, nothing is measured and the answer stays false.
 */
export function useScrollable(
  frameRef: RefObject<HTMLElement | null>,
  tableRef: RefObject<HTMLElement | null>,
): boolean {
  const [scrollable, setScrollable] = useState(false);
  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    const table = tableRef.current;
    if (!frame || typeof ResizeObserver === 'undefined') return undefined;
    let last = false;
    const look = () => {
      const next = frame.scrollWidth > frame.clientWidth || frame.scrollHeight > frame.clientHeight;
      if (next === last) return;
      last = next;
      setScrollable(next);
    };
    const observer = new ResizeObserver(look);
    observer.observe(frame);
    if (table) observer.observe(table);
    // The first look is before the first paint, so the frame has its role as soon as it shows.
    look();
    return () => observer.disconnect();
  }, [frameRef, tableRef]);
  return scrollable;
}
