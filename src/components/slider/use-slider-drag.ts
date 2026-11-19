// The Slider's own drag, apart from the shared `usePointerDrag` (src/internal/use-pointer-drag.ts)
// that the movable Dialog and the DataGrid use. A press here moves the thumb at once, with no
// threshold, so it captures the pointer on the press, and its listeners are the handlers of the
// captured element, where the browser sends the pointer's events while it holds the capture, not
// listeners on the document: the lost release that the shared hook looks for (a move with no button
// down) does not apply, and a capture that goes ends the drag in `lostpointercapture`. Moving the
// Slider onto the shared hook is deferred. The names differ so that an import cannot take one for
// the other.
import { useRef } from 'react';
import type { MouseEvent, PointerEvent, RefObject } from 'react';

/** What a press starts: where along the track it landed, and the thumb it landed on, if any. */
export interface DragStart {
  /** 0 at the left end of the track, 1 at the right end. Already shifted by the grip offset. */
  fraction: number;
  thumb: HTMLElement | null;
}

export interface SliderDragOptions {
  /** The element whose width is the range of the slider: its left edge is 0 and its right edge 1. */
  trackRef: RefObject<HTMLElement | null>;
  disabled?: boolean;
  /** A press began. */
  onStart: (start: DragStart) => void;
  /** The pointer moved while pressed; `fraction` is clamped to 0..1. */
  onMove: (fraction: number) => void;
  /**
   * The drag ended. Called once per drag; `cancelled` is true when the browser took the pointer
   * away (a touch that became a scroll) or the capture was lost without a release, so the press
   * did not complete.
   */
  onEnd: (cancelled: boolean) => void;
}

/** The handlers for the element that carries the track and the thumbs. */
export interface SliderDragHandlers {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void;
  onMouseDown: (event: MouseEvent<HTMLElement>) => void;
}

const THUMB = '[role="slider"]';

/**
 * Dragging along a track with a pointer. A press captures the pointer, so the drag goes on outside
 * the element, and reports positions as a fraction of the track width until the pointer is released,
 * the browser cancels it (a touch that turned into a scroll) or the capture is lost; those two
 * report the end as cancelled.
 *
 * A press on a thumb keeps the distance between the pointer and the centre of the thumb, so the
 * value does not jump to where the pointer is; a press on the track puts the pointer at the value.
 * The default action of the mouse press is prevented: it would start a text selection and move the
 * focus away from the thumb that the caller has just focused.
 */
export function useSliderDrag({
  trackRef,
  disabled = false,
  onStart,
  onMove,
  onEnd,
}: SliderDragOptions): SliderDragHandlers {
  // The pointer being tracked and how far from the centre of the thumb it took hold, as a fraction.
  const drag = useRef<{ pointerId: number; grip: number } | null>(null);

  const fractionAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 0;
    return (clientX - rect.left) / rect.width;
  };
  const clamp01 = (fraction: number) => Math.min(Math.max(fraction, 0), 1);

  const end = (cancelled: boolean) => (event: PointerEvent<HTMLElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    // Cleared first: the browser releases the capture after `pointerup` and fires
    // `lostpointercapture`, which must not end the drag a second time.
    drag.current = null;
    onEnd(cancelled);
  };

  return {
    onPointerDown: (event) => {
      // Only the main button, and the primary pointer: a second finger is ignored, while a new press
      // of the primary pointer replaces a drag whose end was never reported.
      if (disabled || event.button > 0 || event.isPrimary === false) return;
      const thumb = (event.target as Element).closest<HTMLElement>(THUMB);
      let grip = 0;
      const rect = trackRef.current?.getBoundingClientRect();
      if (thumb && rect && rect.width > 0) {
        const box = thumb.getBoundingClientRect();
        grip = (event.clientX - (box.left + box.width / 2)) / rect.width;
      }
      drag.current = { pointerId: event.pointerId, grip };
      try {
        event.currentTarget.setPointerCapture?.(event.pointerId);
      } catch {
        // A pointer that is gone already (a synthetic one) cannot be captured; the drag still
        // works while the pointer stays over the element.
      }
      onStart({ fraction: clamp01(fractionAt(event.clientX) - grip), thumb });
    },
    onPointerMove: (event) => {
      if (drag.current?.pointerId !== event.pointerId) return;
      onMove(clamp01(fractionAt(event.clientX) - drag.current.grip));
    },
    onPointerUp: end(false),
    onPointerCancel: end(true),
    onLostPointerCapture: end(true),
    onMouseDown: (event) => {
      if (!disabled) event.preventDefault();
    },
  };
}
