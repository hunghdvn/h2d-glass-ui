import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { createAutoScroll } from '../../../internal/auto-scroll';
import type { AutoScroll } from '../../../internal/auto-scroll';
import { usePointerDrag } from '../../../internal/use-pointer-drag';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import type { ResolvedColumn } from '../engine/columns';
import { isDataColumn } from '../engine/columns';
import { autoFitWidth, dataColumnsOf, freezeWidths, resizedWidth, widthOf } from '../engine/layout';
import type { PinPlace } from '../engine/layout';
import { markDragCursor, measureColumn, middleArea } from '../grid-dom';
import type { DataGridColumnLayout, DataGridLabels } from '../types';
import type { LiveWidthsStore } from './use-live-widths';

/** How long after the last key the new width is said, so a held key is said once. */
const ANNOUNCE_DELAY = 500;

export interface ColumnResizeOptions<TRow> {
  frameRef: RefObject<HTMLElement | null>;
  tableRef: RefObject<HTMLTableElement | null>;
  /** The shown columns, the column of boxes first when there is one. */
  columns: readonly ResolvedColumn<TRow>[];
  /** Where each of `columns` sticks, `undefined` for one in the middle. */
  pins: readonly (PinPlace | undefined)[];
  /** The width in pixels each of `columns` has now, once known: `undefined` before the frame is measured. */
  sizes: readonly (number | undefined)[];
  /** The layout as shown. */
  layout: DataGridColumnLayout;
  setColumnLayout: (next: DataGridColumnLayout) => void;
  store: LiveWidthsStore;
  labels: DataGridLabels;
  /** Says a text through the grid's live region; `delay` joins the calls made within it, and says the last. */
  announce: (text: string, options?: { delay?: number }) => void;
}

export interface ColumnResize {
  /** The press on the handle of the column `columnId`: the start of a drag. */
  onPointerDown: (event: ReactPointerEvent<HTMLElement>, columnId: string) => void;
  /** The double press on that handle: fits the column to its content. */
  onDoubleClick: (columnId: string) => void;
  /** Changes the width of a column by `delta` pixels, held to its limits (the keys). */
  resizeBy: (columnId: string, delta: number) => void;
  /** Gives a column the width its title and its drawn cells need (the double press, the menu). */
  fit: (columnId: string) => void;
}

/** A drag from its first move to its end. */
interface Session {
  id: string;
  handle: HTMLElement;
  frame: HTMLElement;
  doc: Document;
  /** The width of the column when the press began, and its least. */
  start: number;
  minWidth: number;
  /**
   * How far the frame has scrolled under the pointer since the press, as the auto-scroll reported it:
   * only what its own frames moved, so a clamp or a wheel adds nothing.
   */
  moved: number;
  /** The widths of every shown column, with the flexible ones frozen at what they measured. */
  frozen: Readonly<Record<string, number>>;
  /** How far the pointer is from where it was pressed, and the widths now. */
  dx: number;
  widths: Readonly<Record<string, number>>;
  /** `null` for a pinned column: its handle does not move when the middle scrolls. */
  autoScroll: AutoScroll | null;
}

/**
 * Resizing the columns (spec phase 6 §3.7, §3.8, §6.3): a drag of the handle on the right edge of a
 * title, the double press on it, and the keys. One `usePointerDrag` serves the whole heading.
 *
 * While a drag is in flight, the widths are written into the live store, which only the table and
 * the guide read: no row, no title and no toolbar is drawn for a move. The width is where the
 * pointer is, plus the scroll that the drag's own auto-scroll (`createAutoScroll`) has made since the
 * press, so a frame that scrolls under a pointer at its edge (for a column of the middle, the inner
 * edge of a pinned zone: `middleArea`) widens the column too. Only that scroll counts: a clamp of
 * `scrollLeft` (narrowing a column at the end of the frame) or a wheel adds nothing, and a pinned
 * column has no auto-scroll at all, since its handle does not move with the middle. The first resize
 * of a grid with flexible columns freezes them at the width they measured (the widget freeze), so a
 * drag makes the table wider or narrower and never takes the room of a neighbour. The layout is
 * changed once, at the release; Escape, `pointercancel` and a lost capture only take the live widths
 * away. What the drag set on the page (the cursor mark, the attribute on the handle, the scroll
 * listener, the auto-scroll) is taken off on each of those ends and when the grid goes in the middle
 * of one.
 *
 * Everything the handlers read comes from the latest commit, so they are the same functions for as
 * long as the grid lives.
 */
export function useColumnResize<TRow>(options: ColumnResizeOptions<TRow>): ColumnResize {
  const latest = useRef(options);
  useWriteOnCommit(() => {
    latest.current = options;
  });
  const pressed = useRef<{ id: string; handle: HTMLElement } | null>(null);
  const session = useRef<Session | null>(null);

  /** The shown data columns with the width each has now, for the freeze. */
  const shown = useCallback(() => {
    const { columns, pins, sizes } = latest.current;
    const data = dataColumnsOf(
      columns,
      pins.map((place) => place?.side),
    );
    return data.at.map((at) => ({
      id: columns[at]!.id,
      minWidth: columns[at]!.minWidth,
      size: sizes[at],
    }));
  }, []);

  /** The column of `id` if it can be resized, with its place among the shown columns. */
  const resizable = useCallback((id: string) => {
    const index = latest.current.columns.findIndex((column) => column.id === id);
    const column = latest.current.columns[index];
    return column && isDataColumn(column) && column.allowResizing ? { column, index } : undefined;
  }, []);

  const widthNow = useCallback((index: number) => {
    const { columns, sizes, layout } = latest.current;
    const column = columns[index]!;
    return sizes[index] ?? widthOf(layout.widths, column.id) ?? column.minWidth;
  }, []);

  // Where the pointer is now says a width; the scroll the drag made since the press adds to it.
  const apply = useCallback((current: Session, dx: number) => {
    current.dx = dx;
    current.widths = {
      ...current.frozen,
      [current.id]: resizedWidth(current.start, dx + current.moved, current.minWidth),
    };
    latest.current.store.set({ id: current.id, handle: current.handle, widths: current.widths });
  }, []);

  // Everything a drag set, taken off: the one place that does it, for each way a drag ends.
  const settle = useCallback((current: Session) => {
    current.autoScroll?.stop();
    markDragCursor(current.doc, null);
    current.handle.removeAttribute('data-dragging');
  }, []);

  const finish = useCallback(
    (commit: boolean) => {
      const current = session.current;
      if (!current) return;
      session.current = null;
      settle(current);
      const { layout, setColumnLayout, store } = latest.current;
      // A drag that ends at the width it began with changes nothing: flexible columns stay flexible.
      if (commit && (current.widths[current.id] ?? current.start) !== current.start) {
        setColumnLayout({ ...layout, widths: { ...layout.widths, ...current.widths } });
      }
      // After the layout, so a column does not go back to its old width for a frame between the two.
      store.set(null);
    },
    [settle],
  );

  const drag = usePointerDrag({
    onStart: () => {
      const press = pressed.current;
      const found = press && resizable(press.id);
      const frame = latest.current.frameRef.current;
      if (!press || !found || !frame) return;
      const start = widthNow(found.index);
      const pinned = latest.current.pins[found.index] !== undefined;
      const doc = frame.ownerDocument;
      const next: Session = {
        id: press.id,
        handle: press.handle,
        frame,
        doc,
        start,
        minWidth: found.column.minWidth,
        moved: 0,
        frozen: freezeWidths(latest.current.layout.widths, shown(), press.id, start),
        dx: 0,
        widths: {},
        autoScroll: pinned
          ? null
          : createAutoScroll(frame, {
              axis: 'x',
              // Measured from the pinned zones' inner edges, over the columns of the middle.
              area: () => middleArea(frame, latest.current.tableRef.current),
              onScroll: (scrolled) => {
                next.moved += scrolled;
                apply(next, next.dx);
              },
            }),
      };
      session.current = next;
      press.handle.setAttribute('data-dragging', '');
      markDragCursor(doc, 'col-resize');
    },
    onMove: ({ dx, x, y }) => {
      const current = session.current;
      if (!current) return;
      apply(current, dx);
      current.autoScroll?.update(x, y);
    },
    onEnd: () => finish(true),
    onCancel: () => finish(false),
  });

  useEffect(
    () => () => {
      const current = session.current;
      session.current = null;
      if (current) settle(current);
    },
    [settle],
  );

  const setWidth = useCallback(
    (id: string, caption: string, width: number) => {
      const { layout, setColumnLayout, labels, announce } = latest.current;
      setColumnLayout({ ...layout, widths: freezeWidths(layout.widths, shown(), id, width) });
      announce(labels.announceResized(caption, width), { delay: ANNOUNCE_DELAY });
    },
    [shown],
  );

  const resizeBy = useCallback(
    (id: string, delta: number) => {
      const found = resizable(id);
      if (!found) return;
      const now = widthNow(found.index);
      const width = resizedWidth(now, delta, found.column.minWidth);
      if (width !== now) setWidth(id, found.column.caption, width);
    },
    [resizable, widthNow, setWidth],
  );

  const fit = useCallback(
    (id: string) => {
      const found = resizable(id);
      const table = latest.current.tableRef.current;
      if (!found || !table) return;
      const width = autoFitWidth(measureColumn(table, found.index), found.column.minWidth);
      if (width !== widthNow(found.index)) setWidth(id, found.column.caption, width);
    },
    [resizable, widthNow, setWidth],
  );

  // The hook's handler is the same function for as long as the grid lives, and so is what this returns:
  // it is in the grid's context, which draws every row when it changes.
  const { onPointerDown: startDrag } = drag;
  return useMemo(
    () => ({
      onPointerDown: (event, columnId) => {
        pressed.current = { id: columnId, handle: event.currentTarget };
        startDrag(event);
      },
      onDoubleClick: fit,
      resizeBy,
      fit,
    }),
    [startDrag, fit, resizeBy],
  );
}
