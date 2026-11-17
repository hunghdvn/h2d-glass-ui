import { isApplePlatform } from '../../internal/platform';

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

/**
 * What takes the focus of a cell. A cell that holds one simple control, the box of the column of
 * boxes, gives the focus to it (spec phase 6 §3.6); the other cells have it themselves. A box that
 * cannot have it (it is disabled) leaves it to the cell.
 */
export function homeOf(cell: HTMLTableCellElement): HTMLElement {
  if (!cell.hasAttribute('data-service')) return cell;
  return cell.querySelector<HTMLElement>('input:not(:disabled)') ?? cell;
}

/**
 * Gives the focus to the home of a cell that is pressed, from the `mousedown` of a press whose
 * default is cancelled (so the browser moves no focus): after a press in the grid the focus is
 * where the active cell is, and the keys go on from there (spec phase 6 §3.6). The cell is in
 * sight, since it was pressed, so nothing scrolls.
 */
export function focusHomeOf(cell: HTMLTableCellElement): void {
  homeOf(cell).focus({ preventScroll: true });
}

/** Whether a press adds a level to the sort: Shift, or ⌘ on Apple and Ctrl elsewhere. */
export function addsLevel(event: {
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
}): boolean {
  return event.shiftKey || (isApplePlatform() ? event.metaKey : event.ctrlKey);
}
