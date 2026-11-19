import { useState } from 'react';
import type { RefObject } from 'react';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';

/**
 * Where the layer over a grid that loads starts: the bottom of the heading, in pixels from the top of
 * the main part that the layer is positioned in. It is measured, from layout sizes (`offsetTop`,
 * `offsetHeight`, `clientTop`, which a transform does not change), because the frame is not always at
 * the top of the main part and the heading not always at the top of the frame: a `striped` or
 * `minimal` frame is pulled up by its margin over its own padding, a `lined` one has an edge, and a
 * `striped` table has spacing of 2px around every row group, above the heading and between it and the
 * body, where an engine draws it (WebKit draws none there).
 *
 * The heading is `position: sticky`, so its own `offsetTop` says where it is stuck and not where it
 * rests. The body is not sticky: it starts after the heading and the spacing under it, and the
 * spacing above the heading is the same, so the bottom of the heading, at rest, is half way between
 * the top of the body and the heading's own height. That holds whether the engine draws the spacing
 * (the two are then 2px apart each side) or not (the body starts where the heading ends), and the
 * stylesheet's value is not read. Nothing is measured unless `active`; `undefined` until the table
 * has a body with a place, and where there is none to measure (a server, jsdom) the stylesheet's
 * estimate stands.
 */
export function useOverlayTop(
  frameRef: RefObject<HTMLElement | null>,
  tableRef: RefObject<HTMLTableElement | null>,
  active: boolean,
): number | undefined {
  const [top, setTop] = useState<number | undefined>(undefined);

  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    const table = tableRef.current;
    if (!active || !frame || !table) return undefined;
    const measure = () => {
      const body = table.tBodies[0];
      const headHeight = table.tHead?.offsetHeight ?? 0;
      if (!body || body.offsetTop === 0 || headHeight === 0) {
        setTop(undefined);
        return;
      }
      setTop(
        frame.offsetTop + frame.clientTop + table.offsetTop + (body.offsetTop + headHeight) / 2,
      );
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    // The heading changes size with what is in it, and the table with the heading.
    const observer = new ResizeObserver(measure);
    observer.observe(table);
    if (table.tHead) observer.observe(table.tHead);
    return () => observer.disconnect();
  }, [frameRef, tableRef, active]);

  return active ? top : undefined;
}
