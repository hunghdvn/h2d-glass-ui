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
  /** The pointer was released after a drag began; `info` is the final position. */
  onEnd?: (info: PointerDragInfo) => void;
  /**
   * The drag was cancelled after it began: Esc (see `cancelOnEscape`), `pointercancel` (the browser
   * took the pointer, for instance a touch that became a scroll) or `lostpointercapture` before the
   * release. `info` is the last position reported. A press that is over before the threshold is
   * never a cancel, and nothing is called once the component has unmounted.
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
 * or a cancel. It captures the pointer, so the drag goes on outside the element and over iframes,
 * and listens on the document for the rest, so it needs no handler but `onPointerDown`. Only the
 * primary pointer and the main button count (on Apple, a mouse press with Ctrl is a right click).
 * It is the shared base of the movable Dialog and of the DataGrid's column resize, column drag,
 * group chips and row drag.
 *
 * The callbacks are read from the latest render, so a parent that passes new ones never restarts a
 * drag. Every listener, animation frame and capture it took is released when the drag ends, is
 * cancelled or the component unmounts; a drag in flight at unmount ends quietly, with no callback.
 */
export function usePointerDrag(options: PointerDragOptions): PointerDragHandlers {
  const latest = useRef(options);
  useIsoLayoutEffect(() => {
    latest.current = options;
  });
  const gesture = useRef<Gesture | null>(null);

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

  useEffect(() => release, [release]);

  const cancel = useCallback(() => {
    const current = gesture.current;
    if (!current) return;
    release();
    // A press that never reached the threshold was not a drag, so there is nothing to cancel.
    if (current.started && current.last) latest.current.onCancel?.(current.last);
  }, [release]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const { pointerTypes, onPress } = latest.current;
      if (event.button > 0 || event.isPrimary === false) return;
      if (pointerTypes && !pointerTypes.includes(event.pointerType)) return;
      // A Ctrl press of the mouse is a right click on Apple systems, and `button` says 0 for it.
      if (event.pointerType === 'mouse' && event.ctrlKey && isApplePlatform()) return;

      // A new press of the primary pointer replaces a drag whose end never came.
      cancel();
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
      try {
        target.setPointerCapture?.(event.pointerId);
      } catch {
        // A pointer that is gone already (a synthetic one) cannot be captured; the document
        // listeners still follow it.
      }

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
        const { onMove: report, onEnd } = latest.current;
        if (pending) report?.(infoOf(next, pending));
        onEnd?.(infoOf(next, up));
      };

      const onPointerCancel = (other: PointerEvent) => {
        if (other.pointerId === next.pointerId) cancel();
      };

      const onKeyDown = (key: KeyboardEvent) => {
        if (key.key !== 'Escape' || !next.started) return;
        if (latest.current.cancelOnEscape === false) return;
        if (isComposing({ nativeEvent: key })) return;
        key.preventDefault();
        cancel();
      };

      // The capture can be lost without a release (the element left the DOM, another element took
      // the pointer). After a normal release `release()` has removed this listener already, so the
      // `lostpointercapture` that follows it is not a cancel.
      const onLostCapture = (lost: PointerEvent) => {
        if (lost.pointerId === next.pointerId) cancel();
      };

      const doc = target.ownerDocument;
      doc.addEventListener('pointermove', onMove);
      doc.addEventListener('pointerup', onUp);
      doc.addEventListener('pointercancel', onPointerCancel);
      doc.addEventListener('keydown', onKeyDown, true);
      target.addEventListener('lostpointercapture', onLostCapture);
      next.stop = () => {
        doc.removeEventListener('pointermove', onMove);
        doc.removeEventListener('pointerup', onUp);
        doc.removeEventListener('pointercancel', onPointerCancel);
        doc.removeEventListener('keydown', onKeyDown, true);
        target.removeEventListener('lostpointercapture', onLostCapture);
      };
    },
    [cancel, release],
  );

  return { onPointerDown };
}
