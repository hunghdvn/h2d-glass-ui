import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { createAutoScroll } from '../../../internal/auto-scroll';
import type { AutoScroll } from '../../../internal/auto-scroll';
import { POPUP_SELECTOR } from '../../../internal/controls';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { usePointerDrag } from '../../../internal/use-pointer-drag';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import { sameList } from './use-kept';
import type { ResolvedColumn } from '../engine/columns';
import {
  columnStep,
  dataColumnsOf,
  dropMove,
  dropTarget,
  moveColumn,
  zoneOf,
} from '../engine/layout';
import type { DataColumns, Move, PinPlace, Zone } from '../engine/layout';
import { cellsOf, markDragCursor } from '../grid-dom';
import type { DataGridColumnLayout, DataGridLabels } from '../types';
import type { DragViewStore } from './use-drag-view';

export interface ColumnDragOptions<TRow> {
  frameRef: RefObject<HTMLElement | null>;
  tableRef: RefObject<HTMLTableElement | null>;
  /** The shown columns, the column of boxes first when there is one. */
  columns: readonly ResolvedColumn<TRow>[];
  /** Where each of `columns` sticks, `undefined` for one in the middle. */
  pins: readonly (PinPlace | undefined)[];
  /** The layout as shown. */
  layout: DataGridColumnLayout;
  setColumnLayout: (next: DataGridColumnLayout) => void;
  view: DragViewStore;
  labels: DataGridLabels;
  /** Says a text through the grid's live region. */
  announce: (text: string) => void;
}

export interface ColumnDrag {
  /** The press on the title of the column `columnId`: the start of a drag, when it is one that moves. */
  onPointerDown: (event: ReactPointerEvent<HTMLElement>, columnId: string) => void;
  /** Moves a column one place within its zone (`-1` left, `1` right), as the keys do. */
  moveBy: (columnId: string, step: -1 | 1) => void;
  /** The id of the column that is being dragged: the rows dim it. `null` when no drag is in flight. */
  source: string | null;
}

/** A drag from its first move to its end. */
interface Session {
  id: string;
  /** The place of the column among the data columns, and of its zone. */
  index: number;
  zone: Zone;
  doc: Document;
  frame: HTMLElement;
  table: HTMLTableElement;
  data: DataColumns;
  caption: string;
  /** Where the pointer was last, for the work that a scroll of the frame does again. */
  x: number;
  y: number;
  /** The boundary a drop would be on, counted from the start of the zone; `null` when there is none. */
  target: number | null;
  /** `null` for a pinned column: its zone does not scroll. */
  autoScroll: AutoScroll | null;
  onScroll: () => void;
}

/**
 * Where the pointer is over the heading, and so which boundary of the zone of the dragged column a drop
 * would be on: the x of the boundaries is read from the titles, which are where they are now (the frame
 * may have scrolled), and the answer is `null` outside the band of the heading, outside the zone, and
 * where the boundary is out of sight, under a pinned zone or beyond the frame. Returns the boundary
 * counted from the start of the zone, and its x.
 */
function targetAt(session: Session, x: number, y: number): { edge: number; x: number } | null {
  const { frame, table, data, zone, index } = session;
  const row = table.tHead?.rows[0];
  if (!row) return null;
  const frameBox = frame.getBoundingClientRect();
  // The band of the heading starts at the frame's own edge, its border included: a pointer on the border
  // is over the frame, and the heading is right under it.
  if (y < frameBox.top || y > row.getBoundingClientRect().bottom) return null;
  // What the frame shows sideways; the pinned zones cover the ends of what a middle column can show.
  let from = frameBox.left + frame.clientLeft;
  let to = from + frame.clientWidth;
  if (data.sides[index] === undefined) {
    const left = row.querySelector('[data-pinned="left"][data-pin-edge]');
    const right = row.querySelector('[data-pinned="right"][data-pin-edge]');
    if (left) from = Math.max(from, left.getBoundingClientRect().right);
    if (right) to = Math.min(to, right.getBoundingClientRect().left);
  }
  if (x < from || x > to) return null;
  const cells = cellsOf(row);
  const titles = data.at.slice(zone.first, zone.last + 1).map((at) => cells[at]!);
  const boxes = titles.map((title) => title.getBoundingClientRect());
  const edges = [...boxes.map((box) => box.left), boxes[boxes.length - 1]?.right ?? 0];
  const edge = dropTarget(edges, index - zone.first, x);
  const at = edge === null ? undefined : edges[edge];
  if (edge === null || at === undefined || at < from - 0.5 || at > to + 0.5) return null;
  return { edge, x: at };
}

/**
 * Reordering the columns (spec phase 6 §3.6, §3.8, §6.3): a drag of a title, and the keys
 * `mod+Shift+←` and `mod+Shift+→`. One `usePointerDrag` serves the whole heading, for a mouse and a
 * pen (a finger on a title scrolls the frame).
 *
 * A press starts it on the title of a column that can be moved, its sort button included: one that
 * stays under the threshold is the click of the button, and one that goes past it is a drag, whose
 * click is never delivered, so a drag never sorts. The handle that resizes, a popup inside a title and
 * the column of boxes are not starts. While a drag is in flight the pointer's place goes into a small
 * store that only the chip and the drop line read, and the rows read one change at the start (the
 * source column is dimmed) and one at the end. The column goes where the pointer is nearest to a
 * boundary of its own zone, the pinned zones and the middle being zones of their own; the two boundaries
 * beside the column and anywhere outside the zone or the heading are no move, and a drop there does
 * nothing. The layout is changed once, at the release; Escape, `pointercancel` and a lost capture only
 * take the drag away. What the drag set on the page (the cursor mark, the scroll listener, the
 * auto-scroll) is taken off on each of those ends and when the grid goes in the middle of one.
 *
 * After a move by the keys the title is scrolled into view the least it takes; it keeps the focus (React
 * moves the node of a keyed cell, and the keyboard of the grid gives back a focus that a move dropped).
 *
 * Everything the handlers read comes from the latest commit, so they are the same functions for as
 * long as the grid lives.
 */
export function useColumnDrag<TRow>(options: ColumnDragOptions<TRow>): ColumnDrag {
  const latest = useRef(options);
  useWriteOnCommit(() => {
    latest.current = options;
  });
  const pressed = useRef<string | null>(null);
  const session = useRef<Session | null>(null);
  const [source, setSource] = useState<string | null>(null);
  // The title that a move by the keys put in a new place, and the order that move asked for.
  const reveal = useRef<{ id: string; order: readonly string[] } | null>(null);

  /** The column of `id` when it can be moved, with its place among the data columns. */
  const movable = useCallback((id: string) => {
    const { columns, pins } = latest.current;
    const data = dataColumnsOf(
      columns,
      pins.map((pin) => pin?.side),
    );
    const index = data.ids.indexOf(id);
    const column = index < 0 ? undefined : columns[data.at[index]!];
    return index >= 0 && column?.allowReordering
      ? { column, index, data, zone: zoneOf(data.sides, index) }
      : undefined;
  }, []);

  /** Puts the column in its place in the layout: one change, and what is said about it. */
  const commit = useCallback((id: string, caption: string, data: DataColumns, move: Move) => {
    const { layout, setColumnLayout, labels, announce } = latest.current;
    const order = moveColumn(layout.order, id, move.target, move.side);
    setColumnLayout({ ...layout, order });
    const placed = moveColumn(data.ids, id, move.target, move.side);
    announce(labels.announceMoved(caption, placed.indexOf(id) + 1, placed.length));
    return order;
  }, []);

  // Where the pointer is now says where the column would go, and the chip and the line follow.
  const apply = useCallback((current: Session, x: number, y: number) => {
    current.x = x;
    current.y = y;
    const found = targetAt(current, x, y);
    current.target = found?.edge ?? null;
    latest.current.view.set({ caption: current.caption, x, y, edge: found?.x ?? null });
  }, []);

  // Everything a drag set, taken off: the one place that does it, for each way a drag ends.
  const settle = useCallback((current: Session) => {
    current.autoScroll?.stop();
    current.frame.removeEventListener('scroll', current.onScroll);
    markDragCursor(current.doc, null);
  }, []);

  const finish = useCallback(
    (done: boolean) => {
      const current = session.current;
      if (!current) return;
      session.current = null;
      settle(current);
      latest.current.view.set(null);
      setSource(null);
      // The columns of its zone are the ones it started with: a drag held while the parent hid or moved
      // one has boundaries that are no longer these, and what it would announce no longer true.
      const now = movable(current.id);
      const unchanged =
        now !== undefined &&
        sameList(
          current.data.ids.slice(current.zone.first, current.zone.last + 1),
          now.data.ids.slice(now.zone.first, now.zone.last + 1),
        );
      if (done && unchanged && current.target !== null) {
        commit(
          current.id,
          current.caption,
          current.data,
          dropMove(current.data.ids, current.zone, current.target),
        );
      }
    },
    [settle, commit, movable],
  );

  const drag = usePointerDrag({
    // A finger on a title scrolls the frame: it has no drag, and the keys and the menu move columns.
    pointerTypes: ['mouse', 'pen'],
    onStart: ({ x, y }) => {
      const id = pressed.current;
      const found = id === null ? undefined : movable(id);
      const { frameRef, tableRef } = latest.current;
      const frame = frameRef.current;
      const table = tableRef.current;
      if (id === null || !found || !frame || !table) return;
      const doc = frame.ownerDocument;
      const next: Session = {
        id,
        index: found.index,
        zone: found.zone,
        doc,
        frame,
        table,
        data: found.data,
        caption: found.column.caption,
        x,
        y,
        target: null,
        autoScroll:
          found.data.sides[found.index] === undefined
            ? createAutoScroll(frame, { axis: 'x' })
            : null,
        // The frame scrolls under a pointer that rests: the boundaries are somewhere else now.
        onScroll: () => apply(next, next.x, next.y),
      };
      session.current = next;
      frame.addEventListener('scroll', next.onScroll, { passive: true });
      markDragCursor(doc, 'grabbing');
      setSource(id);
    },
    onMove: ({ x, y }) => {
      const current = session.current;
      if (!current) return;
      apply(current, x, y);
      current.autoScroll?.update(x, y);
    },
    onEnd: () => finish(true),
    onCancel: () => finish(false),
  });

  useEffect(
    () => () => {
      const current = session.current;
      session.current = null;
      if (current) {
        settle(current);
        latest.current.view.set(null);
      }
    },
    [settle],
  );

  const moveBy = useCallback(
    (id: string, step: -1 | 1) => {
      const found = movable(id);
      if (!found) return;
      const move = columnStep(found.data, id, step);
      if (!move) return;
      reveal.current = {
        id,
        order: commit(id, found.column.caption, found.data, move),
      };
    },
    [movable, commit],
  );

  // After the commit of a move by the keys: a title that went out of sight is brought into it, sideways
  // (the frame is not scrolled the other way: a title sticks). The focus needs nothing here: it stays on
  // the title, or the keyboard of the grid gives it back (measured in the three engines, which differ
  // in what a moved node keeps). A move that the parent did not keep is not this one's: the order must
  // be the one asked for.
  const { layout, columns } = options;
  useIsoLayoutEffect(() => {
    const pending = reveal.current;
    reveal.current = null;
    const row = latest.current.tableRef.current?.tHead?.rows[0];
    if (!pending || !row || !sameList(layout.order, pending.order)) return;
    const title = cellsOf(row)[columns.findIndex((column) => column.id === pending.id)];
    if (title && typeof title.scrollIntoView === 'function') {
      title.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [layout, columns]);

  // The hook's handler is the same function for as long as the grid lives, and so is what this returns
  // but `source`: it is in the grid's context, which draws every row when it changes.
  const { onPointerDown: startDrag } = drag;
  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>, columnId: string) => {
      // The handle that resizes has a press of its own, and a popup inside the title is a place of
      // its own: a press there is for what it holds.
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('.flg-data-grid-resizer')) return;
      const popup = target?.closest(POPUP_SELECTOR);
      if (popup && event.currentTarget.contains(popup)) return;
      if (!movable(columnId)) return;
      pressed.current = columnId;
      startDrag(event);
    },
    [movable, startDrag],
  );
  return useMemo(() => ({ onPointerDown, moveBy, source }), [onPointerDown, moveBy, source]);
}
