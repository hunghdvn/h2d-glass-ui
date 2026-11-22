import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { createAutoScroll } from '../../../internal/auto-scroll';
import type { AutoScroll } from '../../../internal/auto-scroll';
import { usePointerDrag } from '../../../internal/use-pointer-drag';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import type { FlatRow } from '../engine/flatten';
import { pagePlaces, rowDrop } from '../engine/row-reorder';
import type { RowAsk, RowDrop } from '../engine/row-reorder';
import { markDragCursor, rowBlocks } from '../grid-dom';
import type { DataGridKey } from '../types';
import type { DragViewStore } from './use-drag-view';

export interface RowDragOptions<TRow> {
  /** Whether a drag may start and go on: the grid reorders rows and neither sorts nor groups. */
  enabled: boolean;
  frameRef: RefObject<HTMLElement | null>;
  tableRef: RefObject<HTMLTableElement | null>;
  /** The rows of the page, the three kinds of them. */
  rows: readonly FlatRow<TRow>[];
  /** Whether the frame has a height and so scrolls its rows: only then does a drag scroll it. */
  scrolls: boolean;
  view: DragViewStore;
  /** The row's header text, else its key. */
  nameOf: (row: unknown, key: DataGridKey) => string;
  /** Tells the app where the row was dropped, with the sentence. */
  drop: (key: DataGridKey, ask: RowAsk) => void;
}

export interface RowDrag {
  /** The press on the handle of the row `key`: the start of a drag, once the pointer has gone past the threshold. */
  onPointerDown: (event: ReactPointerEvent<HTMLElement>, key: DataGridKey) => void;
}

/** A drag from its first move to its end. */
interface Session {
  key: DataGridKey;
  name: string;
  doc: Document;
  frame: HTMLElement;
  table: HTMLTableElement;
  /** Where the pointer was last, for the work that a scroll of the frame does again. */
  x: number;
  y: number;
  autoScroll: AutoScroll | null;
  onScroll: () => void;
}

/**
 * What the frame shows of its rows, vertically: under the sticky heading and above the footer that
 * sticks, or the bottom of the frame. A boundary outside it is out of sight, and no drop goes there.
 */
function visibleBand(frame: HTMLElement, table: HTMLTableElement): { top: number; bottom: number } {
  const box = frame.getBoundingClientRect();
  const top = box.top + frame.clientTop;
  const bottom = top + frame.clientHeight;
  const head = table.tHead?.getBoundingClientRect().bottom ?? top;
  const foot = table.tFoot?.getBoundingClientRect().top ?? bottom;
  return { top: Math.max(top, head), bottom: Math.min(bottom, foot) };
}

/**
 * Dragging a row by its handle (spec phase 6 §3.8, §4.3 R1 "Kéo dòng"; every pointer type, a finger
 * too, since the handle has `touch-action: none` and is only for this). One `usePointerDrag` serves
 * every handle; the press that starts it names the row, and the `mousedown` of that press is cancelled
 * by the handle, never the `pointerdown`.
 *
 * While the drag is in flight the pointer goes into the store the chip and the line read, so a move
 * draws no row; the body reads one change at the start and one at the end (the source row is dimmed).
 * The row under the pointer is read from the DOM at each move (a virtual window has drawn only some
 * rows, and a row that left it is no target), its half says before or after it, and the line is drawn
 * at the boundary only where a drop would move the row: not beside the row, not outside the rows, not
 * under the heading or the footer. The place of the row counts, not whether it is drawn, so a drag may
 * scroll past it. A frame with a height scrolls under a pointer near its edge, and the boundaries are
 * measured again after each scroll.
 *
 * A release tells the app once, where the line was; Escape, `pointercancel`, a lost capture, the grid
 * going and the feature being turned off (`enabled`) end the drag and tell nobody. Each end takes off what
 * the drag set: the cursor mark, the scroll listener, the auto-scroll, the store. Everything the handlers
 * read comes from the latest commit, so they are the same functions for as long as the grid lives.
 */
export function useRowDrag<TRow>(options: RowDragOptions<TRow>): RowDrag {
  const latest = useRef(options);
  const places = useMemo(
    () => (options.enabled ? pagePlaces(options.rows) : new Map<DataGridKey, number>()),
    [options.enabled, options.rows],
  );
  const latestPlaces = useRef(places);
  useWriteOnCommit(() => {
    latest.current = options;
    latestPlaces.current = places;
  });
  const pressed = useRef<DataGridKey | null>(null);
  const session = useRef<Session | null>(null);

  /** Where a drop at the pointer's place would go now, `null` where it would move nothing. */
  const dropAt = useCallback((current: Session, x: number, y: number): RowDrop | null => {
    const { rows } = latest.current;
    const from = latestPlaces.current.get(current.key);
    if (from === undefined) return null;
    const box = current.frame.getBoundingClientRect();
    const left = box.left + current.frame.clientLeft;
    if (x < left || x > left + current.frame.clientWidth) return null;
    const band = visibleBand(current.frame, current.table);
    if (y < band.top || y > band.bottom) return null;
    const blocks = rowBlocks(current.table, (index) => {
      const row = rows[index];
      return row?.kind === 'data' ? row.key : undefined;
    }).flatMap((block) => {
      const place = latestPlaces.current.get(block.key);
      return place === undefined ? [] : [{ ...block, place }];
    });
    const found = rowDrop(blocks, from, y);
    // A boundary that is out of sight (half of a row under the heading) is no place to drop.
    return found && found.y >= band.top - 0.5 && found.y <= band.bottom + 0.5 ? found : null;
  }, []);

  const apply = useCallback(
    (current: Session, x: number, y: number) => {
      current.x = x;
      current.y = y;
      latest.current.view.set({
        caption: current.name,
        x,
        y,
        edge: dropAt(current, x, y)?.y ?? null,
        axis: 'y',
        target: null,
        slot: null,
        chip: null,
        row: current.key,
      });
    },
    [dropAt],
  );

  // Everything a drag set, taken off: the one place that does it, for each way a drag ends.
  const settle = useCallback((current: Session) => {
    current.autoScroll?.stop();
    current.frame.removeEventListener('scroll', current.onScroll);
    markDragCursor(current.doc, null);
    latest.current.view.set(null);
  }, []);

  const finish = useCallback(
    (done: boolean) => {
      const current = session.current;
      if (!current) return;
      session.current = null;
      // The rows may have changed while the button was held: the drop is worked out again from them.
      const found = done && latest.current.enabled ? dropAt(current, current.x, current.y) : null;
      settle(current);
      if (found) latest.current.drop(current.key, found.ask);
    },
    [dropAt, settle],
  );

  const drag = usePointerDrag({
    onStart: ({ x, y }) => {
      const key = pressed.current;
      const { enabled, frameRef, tableRef, rows, scrolls, nameOf } = latest.current;
      const frame = frameRef.current;
      const table = tableRef.current;
      if (key === null || !enabled || !frame || !table) return;
      const row = rows.find((one) => one.kind === 'data' && Object.is(one.key, key));
      if (!row) return;
      const next: Session = {
        key,
        name: nameOf(row.kind === 'data' ? row.row : undefined, key),
        doc: frame.ownerDocument,
        frame,
        table,
        x,
        y,
        autoScroll: scrolls
          ? createAutoScroll(frame, {
              axis: 'y',
              area: () => ({ left: 0, right: 0, ...visibleBand(frame, table) }),
            })
          : null,
        // The frame scrolls under a pointer that rests: the boundaries are somewhere else now.
        onScroll: () => apply(next, next.x, next.y),
      };
      session.current = next;
      frame.addEventListener('scroll', next.onScroll, { passive: true });
      markDragCursor(next.doc, 'grabbing');
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

  // The feature turned off (or the grid starting to sort or group) in the middle of a drag takes the drag
  // with it, and so does the grid going.
  const { enabled } = options;
  useEffect(() => {
    if (!enabled) finish(false);
  }, [enabled, finish]);
  useEffect(
    () => () => {
      const current = session.current;
      session.current = null;
      if (current) settle(current);
    },
    [settle],
  );

  const { onPointerDown: startDrag } = drag;
  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>, key: DataGridKey) => {
      pressed.current = key;
      startDrag(event);
    },
    [startDrag],
  );
  return useMemo(() => ({ onPointerDown }), [onPointerDown]);
}
