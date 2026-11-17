/** What `resolveWidths` reads of a column: its fixed width, if it has one, and its least width. */
export interface WidthSpec {
  width: number | undefined;
  minWidth: number;
}

/**
 * The width in pixels of each column. A fixed `width` is as given. The flexible columns share what
 * is left equally, none under its `minWidth`: a column that would get less is held at its minimum
 * and the others share the rest. Whole pixels, the remainder one pixel at a time to the last
 * flexible columns, so the widths add up to `available`, or to the fixed widths plus the minimums
 * when that is more. With no flexible column the table may be narrower than `available`.
 */
export function resolveWidths(columns: readonly WidthSpec[], available: number): number[] {
  const widths = columns.map((column) => column.width ?? 0);
  // A minimum counts in whole pixels, so the sum stays whole.
  const minimum = (index: number) => Math.ceil(columns[index]!.minWidth);
  let free = columns.flatMap((column, index) => (column.width === undefined ? [index] : []));
  let left =
    (Number.isFinite(available) ? Math.max(0, Math.floor(available)) : 0) -
    widths.reduce((sum, width) => sum + width, 0);

  // Holding a column at its minimum leaves the others less, which may hold another: repeat until
  // every column that is left can take an equal share.
  for (;;) {
    const share = left / free.length;
    const held = free.filter((index) => minimum(index) > share);
    if (held.length === 0) break;
    for (const index of held) {
      widths[index] = minimum(index);
      left -= minimum(index);
    }
    free = free.filter((index) => !held.includes(index));
  }

  if (free.length > 0) {
    // A fixed width with a fraction can leave a fraction; the pixels shared out are whole.
    const whole = Math.floor(left);
    const base = Math.floor(whole / free.length);
    const remainder = whole - base * free.length;
    free.forEach((index, place) => {
      widths[index] = base + (place >= free.length - remainder ? 1 : 0);
    });
  }
  return widths;
}
