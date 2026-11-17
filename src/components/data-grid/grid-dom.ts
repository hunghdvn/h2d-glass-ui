/**
 * Where the rows of data are in the DOM. A virtual window draws some of the rows, so the place of a
 * `<tr>` among its siblings is not its place in the list; `aria-rowindex` says it (1 for the heading,
 * so the first row of data is 2), and is there only in a virtual grid. Without it the rows are all
 * drawn, in order, and the place in the DOM is the place in the list.
 */

/** The `aria-rowindex` of the first row of data: the heading is the first row. */
export const FIRST_ROW_INDEX = 2;

/** The rows of data that are drawn, in order: the other rows of the body (the spacers) are not these. */
export function dataRows(table: HTMLTableElement): HTMLTableRowElement[] {
  return Array.from(table.tBodies[0]?.rows ?? []).filter((row) =>
    row.classList.contains('flg-data-grid-row'),
  );
}

/** The place in the list of a drawn row, given its place among the drawn rows. */
export function listIndexOf(row: HTMLTableRowElement, drawnIndex: number): number {
  const said = row.getAttribute('aria-rowindex');
  return said === null ? drawnIndex : Number(said) - FIRST_ROW_INDEX;
}

/** The drawn row that is the `index`th of the list, `undefined` when it is not drawn. */
export function rowAt(table: HTMLTableElement, index: number): HTMLTableRowElement | undefined {
  const rows = dataRows(table);
  if (!rows[0]?.hasAttribute('aria-rowindex')) return rows[index];
  return rows.find((row) => listIndexOf(row, 0) === index);
}

/** Scrolls the row at `index` of the list into view the least it takes, if it is drawn. */
export function scrollRowIntoView(table: HTMLTableElement | null, index: number): void {
  const row = table ? rowAt(table, index) : undefined;
  // The frame's own scroll padding keeps it clear of the sticky heading. Not every DOM has the method.
  if (row && typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'nearest' });
}
