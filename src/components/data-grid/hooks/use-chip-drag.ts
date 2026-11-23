import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { takesOwnPress } from '../../../internal/controls';
import { usePointerDrag } from '../../../internal/use-pointer-drag';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import { levelTarget, slotAt } from '../engine/group-panel';
import { chipCenters, markDragCursor, overHeading } from '../grid-dom';
import type { DragViewStore } from './use-drag-view';
import type { GroupChip } from './use-group-panel';

export interface ChipDragOptions {
  /** Whether the panel is drawn: a drag in flight ends, with nothing done, when it is not. */
  enabled: boolean;
  frameRef: RefObject<HTMLElement | null>;
  tableRef: RefObject<HTMLTableElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  /** The chips as they are now. */
  chips: readonly GroupChip[];
  view: DragViewStore;
  /** Moves the level of the field to a place among the levels, with the sentence. */
  moveTo: (field: string, to: number) => void;
  /** Takes the level of the field out of the grouping, with the sentence. */
  ungroup: (field: string) => void;
}

export interface ChipDrag {
  /** The press on the chip of `field`: the start of a drag, unless the press is on one of its buttons. */
  onPointerDown: (event: ReactPointerEvent<HTMLElement>, field: string) => void;
}

/** A drag from its first move to its end. */
interface Session {
  field: string;
  caption: string;
  doc: Document;
  /** Where the pointer was last, to place again what a change of the chips made out of date. */
  x: number;
  y: number;
  /** What the pointer is over that takes a drop. */
  over: 'tray' | 'heading' | null;
  /** The place a drop on the panel gives the level; `null` beside itself and off the panel. */
  to: number | null;
}

/**
 * Dragging a chip of the group panel (spec phase 6 §3.8): to a place of the panel, which moves its level
 * (a drop beside itself changes nothing), onto the headings, which ungroups, and anywhere else it does
 * nothing. Every pointer type drags (a finger too: the chips are on the toolbar, which does not scroll
 * sideways, and have `touch-action: none`). A press on one of the chip's buttons is the button's
 * (`takesOwnPress`), and the `mousedown` of a press that may drag is cancelled by the chip, never the
 * `pointerdown`. The chip that follows the pointer is the grid's one (`DragLayer`); the panel reads
 * where the pointer is from the store of the drag, and the source chip is dimmed from it.
 *
 * Escape, `pointercancel`, a lost capture, the grid unmounting and the panel being turned off all end it
 * the same way: what the drag set on the page (the cursor mark, the store) is taken off by one function
 * (`settle`) and nothing is changed. The grouping changes once, at the release.
 */
export function useChipDrag(options: ChipDragOptions): ChipDrag {
  const latest = useRef(options);
  useWriteOnCommit(() => {
    latest.current = options;
  });
  const pressed = useRef<string | null>(null);
  const session = useRef<Session | null>(null);

  /** Where the pointer is now says what a drop would do: the panel shows the bar, the chip follows. */
  const apply = useCallback((current: Session, x: number, y: number) => {
    const { panelRef, frameRef, tableRef, chips, view } = latest.current;
    current.x = x;
    current.y = y;
    const panel = panelRef.current;
    const box = panel?.getBoundingClientRect();
    let slot: number | null = null;
    current.to = null;
    current.over = null;
    if (panel && box && x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
      current.over = 'tray';
      const from = chips.findIndex((chip) => chip.field === current.field);
      const at = slotAt(chipCenters(panel), x);
      current.to = from < 0 ? null : levelTarget(from, at);
      slot = current.to === null ? null : at;
    } else if (overHeading(frameRef.current, tableRef.current, x, y)) {
      current.over = 'heading';
    }
    view.set({
      caption: current.caption,
      x,
      y,
      edge: null,
      axis: 'x',
      target: current.over,
      slot,
      chip: current.field,
      row: null,
    });
  }, []);

  // Everything a drag set, taken off: the one place that does it, for each way a drag ends.
  const settle = useCallback((current: Session) => {
    markDragCursor(current.doc, null);
    latest.current.view.set(null);
  }, []);

  const finish = useCallback(
    (done: boolean) => {
      const current = session.current;
      if (!current) return;
      session.current = null;
      if (done) {
        // The chips may have changed while the button was held: the drop is worked out again from them.
        apply(current, current.x, current.y);
      }
      settle(current);
      if (!done) return;
      const { moveTo, ungroup } = latest.current;
      if (current.over === 'tray' && current.to !== null) moveTo(current.field, current.to);
      else if (current.over === 'heading') ungroup(current.field);
    },
    [apply, settle],
  );

  const drag = usePointerDrag({
    onStart: ({ x, y }) => {
      const field = pressed.current;
      const { enabled, panelRef, chips } = latest.current;
      const chip = chips.find((other) => other.field === field);
      const doc = panelRef.current?.ownerDocument;
      if (field === null || !enabled || !chip || !doc) return;
      session.current = { field, caption: chip.caption, doc, x, y, over: null, to: null };
      markDragCursor(doc, 'grabbing');
    },
    onMove: ({ x, y }) => {
      const current = session.current;
      if (current) apply(current, x, y);
    },
    onEnd: () => finish(true),
    onCancel: () => finish(false),
  });

  // A panel turned off in the middle of a drag takes the drag with it, and the grid going does too.
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
    (event: ReactPointerEvent<HTMLElement>, field: string) => {
      if (takesOwnPress(event)) return;
      pressed.current = field;
      startDrag(event);
    },
    [startDrag],
  );
  return useMemo(() => ({ onPointerDown }), [onPointerDown]);
}
