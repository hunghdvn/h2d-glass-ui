/** The top of each row, and the total height at the end: `count + 1` prefix sums of the heights. */
export function computeOffsets(count: number, heightOf: (index: number) => number): Float64Array {
  const offsets = new Float64Array(count + 1);
  for (let index = 0; index < count; index++) {
    offsets[index + 1] = offsets[index]! + heightOf(index);
  }
  return offsets;
}

// The first index in `[0, count]` for which `before(index)` is false; `before` is true for a run of
// indices and then false for all the rest.
function firstWhere(count: number, before: (index: number) => boolean): number {
  let low = 0;
  let high = count;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (before(middle)) low = middle + 1;
    else high = middle;
  }
  return low;
}

/**
 * The rows that meet the viewport `[scrollTop, scrollTop + viewport)`, widened by `overscan` rows on
 * each side: `start` to `end`, `end` not included. A row that only touches an edge is not in it.
 * Two binary searches over the offsets, so the cost does not grow with the rows.
 */
export function findWindow(
  offsets: Float64Array,
  scrollTop: number,
  viewport: number,
  overscan: number,
): { start: number; end: number } {
  const count = offsets.length - 1;
  const top = Math.max(scrollTop, 0);
  // The first row whose bottom is below the top of the viewport…
  const first = firstWhere(count, (index) => offsets[index + 1]! <= top);
  // …and the first row that begins at or below its bottom.
  const last = firstWhere(count, (index) => offsets[index]! < top + viewport);
  return {
    start: Math.max(0, first - overscan),
    end: Math.min(count, Math.max(last, first) + overscan),
  };
}

/** A piece of the list: an empty box that stands for rows left out, or a run of rows to draw. */
export type WindowPart =
  { kind: 'spacer'; height: number } | { kind: 'rows'; start: number; end: number };

/**
 * The window as the parts to draw, in order: a spacer for the rows above, the rows, a spacer for
 * the rows below. `keep` is a row that must stay in the DOM although it is outside the window (the
 * one with the focus, so scrolling does not drop it): it is drawn at its own place, with a spacer
 * on each side. A spacer of no height is left out.
 */
export function splitWindow(
  offsets: Float64Array,
  window: { start: number; end: number },
  keep?: number,
): WindowPart[] {
  const count = offsets.length - 1;
  const ranges: Array<[number, number]> = [];
  const keepIsRow = keep !== undefined && Number.isInteger(keep) && keep >= 0 && keep < count;
  const keepBefore = keepIsRow && keep < window.start;
  const keepAfter = keepIsRow && keep >= window.end;
  if (keepBefore) ranges.push([keep, keep + 1]);
  if (window.end > window.start) ranges.push([window.start, window.end]);
  if (keepAfter) ranges.push([keep, keep + 1]);

  const parts: WindowPart[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    const height = offsets[start]! - offsets[cursor]!;
    if (height > 0) parts.push({ kind: 'spacer', height });
    // Next to the rows just before, the run goes on instead of starting another.
    const previous = parts.at(-1);
    if (start === cursor && previous?.kind === 'rows') previous.end = end;
    else parts.push({ kind: 'rows', start, end });
    cursor = end;
  }
  const rest = offsets[count]! - offsets[cursor]!;
  if (rest > 0) parts.push({ kind: 'spacer', height: rest });
  return parts;
}
