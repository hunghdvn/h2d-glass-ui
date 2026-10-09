/** A slot of the page row: a page number, or an ellipsis standing for two pages or more. */
export type PaginationItem = number | 'start-ellipsis' | 'end-ellipsis';

export interface PaginationRangeOptions {
  /** How many pages there are; below 1, or not a finite number, counts as 1. */
  count: number;
  /** The current page; kept within 1 and `count`, and 1 when not a finite number. */
  page: number;
  /** Pages shown on each side of the current one. */
  siblingCount: number;
  /** Pages always shown at each end. */
  boundaryCount: number;
}

/**
 * A number prop as a whole number. One that is not finite counts as 1: `Number()` of a missing
 * `?page=` is `NaN`, which no clamp would catch. The callers clamp the result.
 */
export const wholeNumber = (value: number): number =>
  Number.isFinite(value) ? Math.floor(value) : 1;

/** `from` to `to`, both included; empty when `from` is past `to`. */
const span = (from: number, to: number): number[] =>
  from > to ? [] : Array.from({ length: to - from + 1 }, (_, index) => from + index);

/**
 * The slots of the page row (spec §6.3 Pagination): `boundaryCount` pages at each end,
 * `siblingCount` pages on each side of the current one, and an ellipsis for each gap. A gap of a
 * single page shows that page instead, and the window of siblings slides inward near the ends, so
 * the row keeps `2 × boundaryCount + 2 × siblingCount + 3` slots once there are that many pages.
 */
export function getPaginationRange({
  count,
  page,
  siblingCount,
  boundaryCount,
}: PaginationRangeOptions): PaginationItem[] {
  const total = Math.max(1, wholeNumber(count));
  const current = Math.min(Math.max(wholeNumber(page), 1), total);
  const siblings = Math.max(0, wholeNumber(siblingCount));
  const boundary = Math.max(0, wholeNumber(boundaryCount));

  const startPages = span(1, Math.min(boundary, total));
  const endPages = span(Math.max(total - boundary + 1, boundary + 1), total);
  // The window around the current page, slid inward so that it keeps its width at the ends.
  const windowStart = Math.max(
    Math.min(current - siblings, total - boundary - siblings * 2 - 1),
    boundary + 2,
  );
  const windowEnd = Math.min(
    Math.max(current + siblings, boundary + siblings * 2 + 2),
    endPages.length > 0 ? (endPages[0] as number) - 2 : total - 1,
  );

  // Between the start pages and the window: an ellipsis, or the one page it would hide.
  const startGap: PaginationItem[] =
    windowStart > boundary + 2
      ? ['start-ellipsis']
      : boundary + 1 < total - boundary
        ? [boundary + 1]
        : [];
  const endGap: PaginationItem[] =
    windowEnd < total - boundary - 1
      ? ['end-ellipsis']
      : total - boundary > boundary
        ? [total - boundary]
        : [];

  return [...startPages, ...startGap, ...span(windowStart, windowEnd), ...endGap, ...endPages];
}
