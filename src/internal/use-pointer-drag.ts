import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { isApplePlatform } from './platform';
import { isComposing } from './roving';
import { useIsoLayoutEffect } from './use-iso-layout-effect';

/**
 * Where a drag is, as every callback after the press receives it. Distances are in CSS pixels of the
 * viewport (`clientX` / `clientY`), so a caller that scrolls its own container adds the scroll itself.
 */
export interface PointerDragInfo {
  /** The pointer's `clientX` / `clientY` now. */
  x: number;
  y: number;
  /** The `clientX` / `clientY` of the press that began the gesture, before the threshold. */
  startX: number;
  startY: number;
  /** `x - startX` and `y - startY`: how far the pointer has travelled from the press. */
  dx: number;
  dy: number;
  /** The `pointerId` and `pointerType` of the pointer that is dragging. */
  pointerId: number;
  pointerType: string;
  /** The native event behind this report, for its modifier keys or `timeStamp`. */
  event: PointerEvent;
}

export interface PointerDragOptions {
  /**
   * The `pointerType`s that may start a drag, such as `['mouse', 'pen']` for a drag that would fight
   * a finger's scroll. A press of any other type is ignored whole: not even `onPress` runs.
   * Default: every type.
   */
  pointerTypes?: readonly string[];
  /**
   * How far, in pixels, the pointer must travel from the press, measured as a straight-line
   * distance and not per axis, before the press becomes a drag. A press released before that is
   * a plain click and none of the drag callbacks run. Default 4.
   */
  threshold?: number;
  /**
   * Whether Esc, while a drag is in flight, cancels it: `preventDefault` is called on the key and
   * `onCancel` runs. Esc during an input method's composition is left to the input method. Pass
   * `false` when Esc must keep its own meaning, such as closing the dialog that is being dragged.
   * Default `true`.
   */
  cancelOnEscape?: boolean;
  /**
   * A qualifying press, called with React's `pointerdown` event before anything is tracked. Call
   * `preventDefault()` on it to keep the browser from moving focus or starting a text selection;
   * the drag goes on either way.
   */
  onPress?: (event: ReactPointerEvent<HTMLElement>) => void;
  /**
   * The press became a drag: the pointer has travelled past `threshold`. Called once per drag,
   * for setting up the dragging state only. It carries the position of the event that crossed the
   * threshold, but `onMove` runs for that same event right after it with the same `info`, so
   * apply positions in `onMove` alone.
   */
  onStart?: (info: PointerDragInfo) => void;
  /**
   * The one place that applies a position. It runs synchronously for the event that crossed the
   * threshold, straight after `onStart`; after that it is coalesced to one call per animation
   * frame, with the last event of the frame, and a pending one is flushed just before `onEnd`,
   * so the last position is never lost.
   */
  onMove?: (info: PointerDragInfo) => void;
  /**
   * The pointer was released after a drag began; `info` is the final position. The `click` that the
   * release makes is not delivered, so a drop is never also a click on what is under it.
   */
  onEnd?: (info: PointerDragInfo) => void;
  /**
   * The drag was cancelled after it began: Esc (see `cancelOnEscape`), `pointercancel` (the browser
   * took the pointer, for instance a touch that became a scroll) or `lostpointercapture` before the
   * release. `info` is the last position reported. After Esc or a lost capture the button is still
   * down, and the `click` its release makes is not delivered either. A press that is over before the
   * threshold is never a cancel, and nothing is called once the component has unmounted.
   */
  onCancel?: (info: PointerDragInfo) => void;
}

/** What the hook returns: the one handler to put on the element that can be pressed to drag. */
export interface PointerDragHandlers {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
}

/** A gesture from its press to its end. */
interface Gesture {
  target: HTMLElement;
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  started: boolean;
  /** The last event received, which `onMove` has not reported yet. */
  pending: PointerEvent | null;
  /** What the callbacks last saw, for `onCancel`. */
  last: PointerDragInfo | null;
  frame: number | null;
  /** Removes the listeners the gesture added. */
  stop: () => void;
}

const DEFAULT_THRESHOLD = 4;

/**
 * Keeps the `click` that the release of a drag makes from being delivered: a listener in the capture
 * phase of the document hears it before anything else, wherever it lands, and stops and cancels it.
 * It is armed for that one click: at once when the button is up already (`released`), or, after a
 * cancel, when the `pointerup` of `pointerId` comes. A press or a `pointercancel` of that pointer
 * while it waits means the release was lost, and there is no click to stop. Once armed, it goes with
 * the click, or on the next task when no click came. Returns what takes it away at any stage.
 */
function guardClick(doc: Document, pointerId: number, released: boolean): () => void {
  let stage: 'waiting' | 'armed' | 'done' = 'waiting';
  let timer: ReturnType<typeof setTimeout> | undefined;
  const swallow = (click: MouseEvent) => {
    click.preventDefault();
    click.stopImmediatePropagation();
    stop();
  };
  const arm = () => {
    stage = 'armed';
    doc.addEventListener('click', swallow, true);
    timer = setTimeout(stop, 0);
  };
  const onRelease = (up: PointerEvent) => {
    if (up.pointerId !== pointerId) return;
    unlisten();
    arm();
  };
  const onLost = (other: PointerEvent) => {
    if (other.pointerId === pointerId) stop();
  };
  const unlisten = () => {
    doc.removeEventListener('pointerup', onRelease, true);
    doc.removeEventListener('pointerdown', onLost, true);
    doc.removeEventListener('pointercancel', onLost, true);
  };
  function stop() {
    if (stage === 'waiting') unlisten();
    if (stage === 'armed') {
      clearTimeout(timer);
      doc.removeEventListener('click', swallow, true);
    }
    stage = 'done';
  }
  if (released) {
    arm();
  } else {
    doc.addEventListener('pointerup', onRelease, true);
    doc.addEventListener('pointerdown', onLost, true);
    doc.addEventListener('pointercancel', onLost, true);
  }
  return stop;
}

function infoOf(gesture: Gesture, event: PointerEvent): PointerDragInfo {
  return {
    x: event.clientX,
    y: event.clientY,
    startX: gesture.startX,
    startY: gesture.startY,
    dx: event.clientX - gesture.startX,
    dy: event.clientY - gesture.startY,
    pointerId: gesture.pointerId,
    pointerType: gesture.pointerType,
    event,
  };
}

/**
 * One drag with a pointer: a press, a threshold that tells a drag from a click, moves, and an end
 * or a cancel. It listens on the document, so it needs no handler but `onPointerDown`. Only the
 * primary pointer and the main button count (on Apple, a mouse press with Ctrl is a right click).
 * It is the shared base of the movable Dialog and of the DataGrid's column resize, column drag,
 * group chips and row drag.
 *
 * A press that does not drag keeps its click: the pointer is captured only when the threshold is
 * crossed (just before `onStart`), so until then a click goes to what was pressed, a button or a
 * sort trigger inside the element included. From then on the capture keeps the drag going outside
 * the element and over iframes. A drag is not a click: the `click` that a gesture which crossed the
 * threshold makes when its button is let go is not delivered, on the element or anywhere else,
 * also when the drag was cancelled (Esc, a lost capture) before the release. So a consumer needs no
 * click filter of its own.
 *
 * The callbacks are read from the latest render, so a parent that passes new ones never restarts a
 * drag. Every listener, animation frame and capture it took is released when the drag ends, is
 * cancelled or the component unmounts; a drag in flight at unmount ends quietly, with no callback,
 * and the click it would have made is not waited for.
 */
export function usePointerDrag(options: PointerDragOptions): PointerDragHandlers {
  const latest = useRef(options);
  useIsoLayoutEffect(() => {
    latest.current = options;
  });
  const gesture = useRef<Gesture | null>(null);
  /** Takes away the guard against the click of the last drag, whatever stage it is at. */
  const unguard = useRef<(() => void) | null>(null);

  /** Stops the click of a drag that crossed the threshold (see `guardClick`). */
  const guard = useCallback((current: Gesture, released: boolean) => {
    unguard.current?.();
    unguard.current = guardClick(current.target.ownerDocument, current.pointerId, released);
  }, []);

  /** Releases everything the gesture took and forgets it; reports nothing. */
  const release = useCallback(() => {
    const current = gesture.current;
    gesture.current = null;
    if (!current) return;
    if (current.frame !== null) cancelAnimationFrame(current.frame);
    current.stop();
    try {
      if (current.target.hasPointerCapture?.(current.pointerId)) {
        current.target.releasePointerCapture(current.pointerId);
      }
    } catch {
      // The pointer is gone already, and so is its capture.
    }
  }, []);

  useEffect(
    () => () => {
      release();
      unguard.current?.();
    },
    [release],
  );

  /**
   * Ends the gesture as a cancel. `held` says that its button is still down (Esc, a lost capture),
   * so the release to come makes a click that belongs to the drag; after a `pointercancel` or a new
   * press no release comes.
   */
  const cancel = useCallback(
    (held: boolean) => {
      const current = gesture.current;
      if (!current) return;
      release();
      // A press that never reached the threshold was not a drag, so there is nothing to cancel.
      if (!current.started || !current.last) return;
      if (held) guard(current, false);
      latest.current.onCancel?.(current.last);
    },
    [guard, release],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const { pointerTypes, onPress } = latest.current;
      if (event.button > 0 || event.isPrimary === false) return;
      if (pointerTypes && !pointerTypes.includes(event.pointerType)) return;
      // A Ctrl press of the mouse is a right click on Apple systems, and `button` says 0 for it.
      if (event.pointerType === 'mouse' && event.ctrlKey && isApplePlatform()) return;

      // A new press of the primary pointer replaces a drag whose end never came.
      cancel(false);
      onPress?.(event);

      const target = event.currentTarget;
      const next: Gesture = {
        target,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        startX: event.clientX,
        startY: event.clientY,
        started: false,
        pending: null,
        last: null,
        frame: null,
        stop: () => {},
      };
      gesture.current = next;

      const flush = () => {
        next.frame = null;
        const pending = next.pending;
        next.pending = null;
        if (!pending) return;
        next.last = infoOf(next, pending);
        latest.current.onMove?.(next.last);
      };

      const onMove = (move: PointerEvent) => {
        if (move.pointerId !== next.pointerId) return;
        if (!next.started) {
          const distance = Math.hypot(move.clientX - next.startX, move.clientY - next.startY);
          if (distance < (latest.current.threshold ?? DEFAULT_THRESHOLD)) return;
          next.started = true;
          // Only now is the pointer the drag's. Captured, the drag goes on outside the element and
          // over iframes; before, a press that is let go stays a click on what was pressed.
          target.addEventListener('lostpointercapture', onLostCapture);
          try {
            target.setPointerCapture?.(next.pointerId);
          } catch {
            // A pointer that is gone already (a synthetic one) cannot be captured; the document
            // listeners still follow it.
          }
          next.last = infoOf(next, move);
          latest.current.onStart?.(next.last);
          // The crossing event is a move too, and is not held back for a frame. `onStart` may
          // have ended the gesture (an unmount, a cancel), and then there is nothing to move.
          if (gesture.current === next) latest.current.onMove?.(next.last);
          return;
        }
        next.pending = move;
        next.frame ??= requestAnimationFrame(flush);
      };

      const onUp = (up: PointerEvent) => {
        if (up.pointerId !== next.pointerId) return;
        // Read before releasing: the callbacks may unmount the component or start another press.
        const { started, pending } = next;
        release();
        if (!started) return;
        // The click this release is about to make is the drag's, not a click on what is under it.
        guard(next, true);
        const { onMove: report, onEnd } = latest.current;
        if (pending) report?.(infoOf(next, pending));
        onEnd?.(infoOf(next, up));
      };

      const onPointerCancel = (other: PointerEvent) => {
        if (other.pointerId === next.pointerId) cancel(false);
      };

      const onKeyDown = (key: KeyboardEvent) => {
        if (key.key !== 'Escape' || !next.started) return;
        if (latest.current.cancelOnEscape === false) return;
        if (isComposing({ nativeEvent: key })) return;
        key.preventDefault();
        cancel(true);
      };

      // Listened to from the moment the capture is taken. The capture can be lost without a release
      // (the element left the DOM, another element took the pointer). After a normal release
      // `release()` has removed this listener already, so the `lostpointercapture` that follows it
      // is not a cancel.
      const onLostCapture = (lost: PointerEvent) => {
        if (lost.pointerId === next.pointerId) cancel(true);
      };

      const doc = target.ownerDocument;
      doc.addEventListener('pointermove', onMove);
      doc.addEventListener('pointerup', onUp);
      doc.addEventListener('pointercancel', onPointerCancel);
      doc.addEventListener('keydown', onKeyDown, true);
      next.stop = () => {
        doc.removeEventListener('pointermove', onMove);
        doc.removeEventListener('pointerup', onUp);
        doc.removeEventListener('pointercancel', onPointerCancel);
        doc.removeEventListener('keydown', onKeyDown, true);
        target.removeEventListener('lostpointercapture', onLostCapture);
      };
    },
    [cancel, guard, release],
  );

  return { onPointerDown };
}
