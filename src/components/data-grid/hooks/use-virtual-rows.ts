import { useCallback, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { computeOffsets, findWindow, splitWindow } from '../engine/virtual';
import type { WindowPart } from '../engine/virtual';
import { dataRows, listIndexOf } from '../grid-dom';

/** Rows drawn beyond the viewport on each side, so a fast scroll finds rows there before the next frame. */
export const OVERSCAN = 6;

interface Scroll {
  /** The `scrollTop` of the frame. */
  top: number;
  /** The `clientHeight` of the frame; 0 until it is measured, and where there is no layout. */
  viewport: number;
}

interface Measured {
  /** The estimate this was measured under: a new estimate (density, variant, row height) drops it. */
  estimate: number;
  pitch: number;
}

export interface VirtualRowsOptions {
  /** Whether the grid is virtual. When it is not, nothing is listened to, observed or measured. */
  enabled: boolean;
  /**
   * The `<tbody>` of the rows, whose table and frame are its parent and grandparent. The body keeps
   * the window, and its effects run before the grid's own refs are set at mount (a parent's refs
   * come after its children's effects), so they are found from the body's element, which is.
   */
  bodyRef: RefObject<HTMLTableSectionElement | null>;
  /** How many rows there are in the list. */
  count: number;
  /** The height of a data row as the stylesheet draws it. */
  rowHeight: number;
  /** The height of a group row as the stylesheet draws it; `rowHeight` where no row is a group. */
  groupRowHeight: number;
  /** Whether the row of the list at an index is a group row. Called once for each row of a new list. */
  isGroup: (index: number) => boolean;
  /** The distance between the tops of two rows before one is measured. */
  estimate: number;
  /** A row that is drawn although it is outside the window: the one that has the keyboard. */
  keep: number | undefined;
  /** A second row to keep for a while: the one the keyboard is leaving, until the focus has left it. */
  hold: number | undefined;
  /** The row being edited, which is drawn wherever the frame is scrolled: its editors never unmount. */
  editedRow: number | undefined;
  /** How many rows the first window has, before the frame is measured (on the server too). */
  firstRows: number;
}

export interface VirtualRows {
  /** The window as parts to draw, in order; empty when the grid is not virtual. */
  parts: readonly WindowPart[];
  /** Scrolls the frame the least it takes for the row at `index` to be under the heading. */
  scrollToIndex: (index: number) => void;
}

const NO_PARTS: readonly WindowPart[] = [];

/** The table of a body of rows, and its frame: the grid draws them as parent and grandparent. */
const tableOf = (body: HTMLTableSectionElement | null): HTMLTableElement | null =>
  body?.parentElement instanceof HTMLTableElement ? body.parentElement : null;
const frameOf = (body: HTMLTableSectionElement | null): HTMLElement | null =>
  tableOf(body)?.parentElement ?? null;
const NO_OFFSETS = new Float64Array(1);

/**
 * The window of a virtual list (spec phase 6 §3.7). The frame's scroll is read in a passive
 * listener and applied once per animation frame, so a fast scroll makes one render per frame. The
 * rows have a fixed height, so the offsets are sums of two pitches: the one of a data row is the
 * estimate the stylesheet's numbers give, and the distance of two neighbour data rows once there are
 * two in the DOM (measured with `offsetTop`, which a transform does not change); the one of a group
 * row is that less the difference of the two heights, so the one measure serves both. Until the frame
 * has a height the window is the first `firstRows` rows, which is also what the server draws.
 *
 * A spacer is as tall as the rows it stands for, less the space a `striped` table puts between its
 * rows: that is added around a row of its own, so left in, the rows would drift by 2px for each
 * spacer.
 */
export function useVirtualRows({
  enabled,
  bodyRef,
  count,
  rowHeight,
  groupRowHeight,
  isGroup,
  estimate,
  keep,
  hold,
  editedRow,
  firstRows,
}: VirtualRowsOptions): VirtualRows {
  const [scroll, setScroll] = useState<Scroll>({ top: 0, viewport: 0 });
  const [measured, setMeasured] = useState<Measured | null>(null);
  const pitch = measured?.estimate === estimate ? measured.pitch : estimate;

  const groupPitch = pitch - (rowHeight - groupRowHeight);
  const offsets = useMemo(
    () =>
      enabled
        ? computeOffsets(count, (index) => (isGroup(index) ? groupPitch : pitch))
        : NO_OFFSETS,
    [enabled, count, pitch, groupPitch, isGroup],
  );

  const parts = useMemo(() => {
    if (!enabled) return NO_PARTS;
    const window =
      scroll.viewport > 0
        ? findWindow(offsets, scroll.top, scroll.viewport, OVERSCAN)
        : { start: 0, end: Math.min(count, firstRows) };
    const gap = Math.max(0, estimate - rowHeight);
    return splitWindow(offsets, window, [keep, hold, editedRow]).map((part) =>
      part.kind === 'spacer' ? { ...part, height: part.height - gap } : part,
    );
  }, [enabled, offsets, scroll, count, firstRows, estimate, rowHeight, keep, hold, editedRow]);

  // The scroll and the size of the frame.
  useIsoLayoutEffect(() => {
    const frame = frameOf(bodyRef.current);
    if (!enabled || !frame) return undefined;
    let pending = 0;
    const read = (): void => {
      pending = 0;
      const next = { top: frame.scrollTop, viewport: frame.clientHeight };
      setScroll((current) =>
        current.top === next.top && current.viewport === next.viewport ? current : next,
      );
    };
    const onScroll = (): void => {
      if (pending === 0) pending = requestAnimationFrame(read);
    };
    frame.addEventListener('scroll', onScroll, { passive: true });
    // The size is read now and when it changes; where nothing observes (jsdom) it is the one read.
    read();
    const observer =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => read());
    observer?.observe(frame);
    return () => {
      frame.removeEventListener('scroll', onScroll);
      observer?.disconnect();
      if (pending !== 0) cancelAnimationFrame(pending);
    };
  }, [enabled, bodyRef]);

  // The pitch: the distance of the tops of two rows that are neighbours in the list, as drawn.
  const measurable = enabled && count > 1;
  // Until a pitch is measured for this estimate, the effect runs again whenever the list changes: a
  // grid that mounts with its groups closed has no two neighbour data rows, and opens some later.
  const unmeasured = measured?.estimate !== estimate;
  const listKey = unmeasured ? count : -1;
  useIsoLayoutEffect(() => {
    const table = tableOf(bodyRef.current);
    if (!measurable || !table) return;
    const rows = dataRows(table);
    let distance = 0;
    for (let at = 0; at + 1 < rows.length && distance === 0; at++) {
      const first = rows[at]!;
      const second = rows[at + 1]!;
      if (listIndexOf(second, 0) - listIndexOf(first, 0) === 1) {
        distance = second.offsetTop - first.offsetTop;
      }
    }
    setMeasured((current) => {
      if (distance <= 0) return current?.estimate === estimate ? current : null;
      return current?.estimate === estimate && current.pitch === distance
        ? current
        : { estimate, pitch: distance };
    });
  }, [measurable, estimate, bodyRef, listKey]);

  const scrollToIndex = useCallback(
    (index: number): void => {
      const frame = frameOf(bodyRef.current);
      if (!enabled || !frame || !(index >= 0 && index < count)) return;
      // The heading is stuck over the first `head` pixels of the frame, so a row at `top` in the
      // list is `head + top` into what scrolls; the footer is stuck over the last `foot` pixels, which a
      // row must stay above.
      const table = tableOf(bodyRef.current);
      const head = table?.tHead?.offsetHeight ?? 0;
      const foot = table?.tFoot?.offsetHeight ?? 0;
      const top = offsets[index]!;
      const bottom = offsets[index + 1]!;
      let next = frame.scrollTop;
      if (top < next) next = top;
      else if (bottom + head + foot > next + frame.clientHeight) {
        next = bottom + head + foot - frame.clientHeight;
      }
      if (next === frame.scrollTop) return;
      frame.scrollTop = next;
      // The window is made now and not at the next scroll event, so a row that is not drawn is
      // there for the focus that follows.
      setScroll({ top: next, viewport: frame.clientHeight });
    },
    [enabled, bodyRef, offsets, count],
  );

  return { parts, scrollToIndex };
}
