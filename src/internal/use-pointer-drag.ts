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
   * Default: every type. Where a finger may drag, the consumer sets `touch-action: none` on the
   * element in its CSS: without it the browser takes a moving finger for a scroll, and the drag
   * arrives as `onCancel`.
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
   * A qualifying press, called with React's `pointerdown` event before anything is tracked. To keep
   * the browser from moving focus or starting a text selection, cancel the `mousedown` of the same
   * press, as the movable Dialog does: `preventDefault()` here would do it too, but it also takes
   * the `mousedown` and `mouseup` away from the rest of the page (a click-away listener waits for
   * them) and leaves the event cancelled for handlers further up. The drag goes on either way.
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
   * release makes is not delivered, so a drop is never also a click on what is under it. A release
   * the page never heard (the button let go outside the window) ends the drag too, at the first move
   * with no button down: `info` is then the last position the pointer had while pressed, and there
   * is no click to stop.
   */
  onEnd?: (info: PointerDragInfo) => void;
  /**
   * The drag was cancelled after it began: Esc (see `cancelOnEscape`), `pointercancel` (the browser
   * took the pointer, for instance a touch that became a scroll) or `lostpointercapture` before the
   * release. `info` is the last position reported. After Esc or a lost capture the button is still
   * down, and the `click` its release makes is not delivered either. A press that is over before the
   * threshold is never a cancel, and nothing is called once the component has unmounted. A drag
   * whose element leaves the DOM is not cancelled: no browser reports a lost capture for a removed
   * element, so the drag goes on through the document and ends with `onEnd`.
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
 * How long the guard against the click of a drag waits for that click at most. A mouse sends it in
 * the task of the release, a touch can send it later; a press or a key ends the wait sooner. This is
 * the bound for a click with neither before it, such as one that assistive technology sends, so that
 * such a click is not eaten long after the drag.
 */
const CLICK_GUARD_MS = 1000;

/**
 * Keeps the `click` that the release of a drag makes from being delivered: listeners in the capture
 * phase of the document hear it before anything else, wherever it lands, and stop and cancel it.
 *
 * - **Waiting** (after a cancel, with the button still down): it is armed when the `pointerup` of
 *   `pointerId` comes. A press, a `pointercancel` or a move with no button down of that pointer
 *   means the release was lost, and there is no click to stop.
 * - **Armed** (at once when `released`): it stops the first click. It goes, with no click stopped,
 *   at the next `pointerdown` or `keydown` (what they make is the user's own) or after
 *   `CLICK_GUARD_MS`.
 * - **The pair** of the click it stopped: that click may be one of a double click, the first (the
 *   second press is a plain one) or the second (the press before the drag was). The `dblclick` that
 *   comes with it or with the next click is stopped too; the next click itself is delivered. The pair
 *   ends with that next click, and so does this stage, on the task after it or at the next press,
 *   whichever comes first, since the browser sends the `dblclick` straight after its click.
 *
 * Returns what takes it away at any stage.
 */
function guardClick(doc: Document, pointerId: number, released: boolean): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** What the stage the guard is at listens to, in the capture phase of the document. */
  let listeners: Array<[string, EventListener]> = [];
  function stop() {
    clearTimeout(timer);
    for (const [type, listener] of listeners) doc.removeEventListener(type, listener, true);
    listeners = [];
  }
  /** Takes away what the last stage set, then listens for the next one, for `ms` at most. */
  const enter = (next: Array<[string, EventListener]>, ms?: number) => {
    stop();
    listeners = next;
    for (const [type, listener] of listeners) doc.addEventListener(type, listener, true);
    if (ms !== undefined) timer = setTimeout(stop, ms);
  };
  const cancel = (event: Event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const ofPointer = (event: Event) => (event as PointerEvent).pointerId === pointerId;

  const onDoubleClick: EventListener = (event) => {
    cancel(event);
    stop();
  };
  const pair = () =>
    enter([
      ['dblclick', onDoubleClick],
      [
        'click',
        // A `dblclick` follows its click with no press in between, so a press means the pair is
        // over: the timer does not decide alone when a busy main thread hands over queued input.
        () =>
          enter(
            [
              ['dblclick', onDoubleClick],
              ['pointerdown', stop],
            ],
            0,
          ),
      ],
    ]);
  const armed = () =>
    enter(
      [
        [
          'click',
          (event) => {
            cancel(event);
            pair();
          },
        ],
        ['pointerdown', stop],
        ['keydown', stop],
      ],
      CLICK_GUARD_MS,
    );
  if (released) {
    armed();
  } else {
    const lost: EventListener = (event) => {
      if (ofPointer(event)) stop();
    };
    enter([
      [
        'pointerup',
        (event) => {
          if (ofPointer(event)) armed();
        },
      ],
      ['pointerdown', lost],
      ['pointercancel', lost],
      [
        'pointermove',
        (event) => {
          if ((event as PointerEvent).buttons === 0) lost(event);
        },
      ],
    ]);
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
 * or a cancel. It listens on the document, in the capture phase, so it needs no handler but
 * `onPointerDown`, and a handler on the way that stops the pointer's events (a React `onPointerUp`
 * with `stopPropagation()`) does not hide them from it. Only the primary pointer and the main button
 * count (on Apple, a mouse press with Ctrl is a right click). A move of that pointer with no button
 * down means its release was lost (let go outside the window): a drag ends there with `onEnd`, and
 * a press that had not become one is let go quietly. It is the shared base of the movable Dialog and
 * of the DataGrid's column resize, column drag, group chips and row drag.
 *
 * A press that does not drag keeps its click: the pointer is captured only when the threshold is
 * crossed (just before `onStart`), so until then a click goes to what was pressed, a button or a
 * sort trigger inside the element included. From then on the capture keeps the drag going outside
 * the element and over iframes. A drag is not a click: the `click` that a gesture which crossed the
 * threshold makes when its button is let go is not delivered, on the element or anywhere else,
 * also when the drag was cancelled (Esc, a lost capture) before the release. That click is waited
 * for until it comes, the next press or key, or a second at most, since a touch may send it later
 * than the release. Nor is a drag half of a double click: the `dblclick` that the stopped click is
 * part of is not delivered either, while the plain click that makes the other half of the pair is.
 * So a consumer needs no click filter of its own.
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
  /** False once the component has unmounted, for a callback that unmounted it to be the last. */
  const mounted = useRef(false);

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

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      release();
      unguard.current?.();
    };
  }, [release]);

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

      /**
       * Ends the gesture as a release. `up` is its `pointerup`, or null when the release was lost:
       * then a drag ends where it last was, and no click comes that would need stopping.
       */
      const finish = (up: PointerEvent | null) => {
        // Read before releasing: the callbacks may unmount the component or start another press.
        const { started, pending } = next;
        release();
        if (!started) return;
        // The click this release is about to make is the drag's, not a click on what is under it.
        if (up) guard(next, true);
        const { onMove: report, onEnd } = latest.current;
        const flushed = pending ? infoOf(next, pending) : null;
        if (flushed) report?.(flushed);
        // The flushed move may have unmounted the component, and then it was the last call.
        if (!mounted.current) return;
        const end = up ? infoOf(next, up) : (flushed ?? next.last);
        if (end) onEnd?.(end);
      };

      const onMove = (move: PointerEvent) => {
        if (move.pointerId !== next.pointerId) return;
        // Every move of a press has a button down. One without means the button came up where the
        // page could not hear it (outside the window), so this is the release, late.
        if (move.buttons === 0) {
          finish(null);
          return;
        }
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
        if (up.pointerId === next.pointerId) finish(up);
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

      // Listened to from the moment the capture is taken. The capture can be lost without a release:
      // another element took the pointer, or the page let it go. An element that leaves the DOM is
      // not such a case: no engine fires `lostpointercapture` on a removed element (Chromium and
      // Firefox fire none, WebKit one at the document), so its drag goes on through the document
      // listeners and ends with `onEnd`. After a normal release `release()` has removed this listener
      // already, so the `lostpointercapture` that follows it is not a cancel.
      const onLostCapture = (lost: PointerEvent) => {
        if (lost.pointerId === next.pointerId) cancel(true);
      };

      // In the capture phase of the document, which hears an event before any element does: a
      // handler that stops it on its way (React stops the native event at its root) cannot keep the
      // release from the gesture and leave it armed.
      const doc = target.ownerDocument;
      doc.addEventListener('pointermove', onMove, true);
      doc.addEventListener('pointerup', onUp, true);
      doc.addEventListener('pointercancel', onPointerCancel, true);
      doc.addEventListener('keydown', onKeyDown, true);
      next.stop = () => {
        doc.removeEventListener('pointermove', onMove, true);
        doc.removeEventListener('pointerup', onUp, true);
        doc.removeEventListener('pointercancel', onPointerCancel, true);
        doc.removeEventListener('keydown', onKeyDown, true);
        target.removeEventListener('lostpointercapture', onLostCapture);
      };
    },
    [cancel, guard, release],
  );

  return { onPointerDown };
}
