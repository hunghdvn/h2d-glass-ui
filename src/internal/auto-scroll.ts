import { clamp } from './number';

/** How close to an edge of the element, in pixels, the pointer starts to scroll it. */
const ZONE = 40;
/** The most it scrolls in a frame, at the edge and beyond it. */
const MAX_STEP = 20;

export interface AutoScrollOptions {
  /** The directions it scrolls in; `'both'` when left out. */
  axis?: 'x' | 'y' | 'both';
}

export interface AutoScroll {
  /** Tells it where the pointer is, in the client coordinates of the viewport. */
  update(x: number, y: number): void;
  /** Ends the loop; what `update` says after it starts it again. */
  stop(): void;
}

/**
 * How far to scroll in a frame for a pointer at `position` along an axis whose element runs from
 * `start` to `end`: 0 while it is `ZONE` or more from both edges, growing to `MAX_STEP` at an edge and
 * beyond it, towards the edge it is near. A step is a whole pixel, and at least one while there is
 * any, since an engine may round a smaller scroll away.
 */
function stepAt(position: number, start: number, end: number): number {
  const toStart = position - start;
  const toEnd = end - position;
  if (toStart < ZONE && toStart <= toEnd) {
    return -Math.ceil(MAX_STEP * clamp((ZONE - toStart) / ZONE, 0, 1));
  }
  if (toEnd < ZONE) return Math.ceil(MAX_STEP * clamp((ZONE - toEnd) / ZONE, 0, 1));
  return 0;
}

/**
 * Scrolls an element while a drag holds the pointer near one of its edges (spec phase 6 §3.8): within
 * 40px of an edge, in a `requestAnimationFrame` loop that scrolls a little more the closer it gets,
 * 20px a frame at the edge and beyond. The caller says where the pointer is on each move; the loop
 * goes on under a pointer that rests, and ends when it leaves the zones or when `stop` is called.
 * The box is read in each frame, so it follows an element that moves. No React: the caller owns when
 * to start and stop.
 */
export function createAutoScroll(
  element: HTMLElement,
  options: AutoScrollOptions = {},
): AutoScroll {
  const { axis = 'both' } = options;
  let pointer: { x: number; y: number } | null = null;
  let frame: number | null = null;

  const steps = () => {
    if (!pointer) return { x: 0, y: 0 };
    const box = element.getBoundingClientRect();
    return {
      x: axis === 'y' ? 0 : stepAt(pointer.x, box.left, box.right),
      y: axis === 'x' ? 0 : stepAt(pointer.y, box.top, box.bottom),
    };
  };

  const cancel = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  };

  const run = () => {
    frame = null;
    const { x, y } = steps();
    if (x === 0 && y === 0) return;
    element.scrollLeft += x;
    element.scrollTop += y;
    frame = requestAnimationFrame(run);
  };

  return {
    update(x, y) {
      pointer = { x, y };
      const { x: dx, y: dy } = steps();
      if (dx === 0 && dy === 0) cancel();
      else frame ??= requestAnimationFrame(run);
    },
    stop() {
      pointer = null;
      cancel();
    },
  };
}
