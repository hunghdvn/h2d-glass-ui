import type { MouseEvent } from 'react';
import { POPUP_SELECTOR } from '../../internal/controls';
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

/**
 * The cells of a row that are the grid's: the cells of its columns, in order, without the filler
 * column, which sits before the right zone when there is one and so is not always the last. The
 * place of a cell in this list is the place of its column; `cellIndex` and `cells[i]` count the
 * filler too.
 */
export function cellsOf(row: HTMLTableRowElement): HTMLTableCellElement[] {
  return Array.from(row.cells).filter((cell) => !cell.classList.contains('flg-data-grid-filler'));
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
  // The row's scroll margin keeps it clear of the sticky heading. Not every DOM has the method.
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

/** The box of a cell of the column of boxes, enabled or not; `null` for any other cell. */
export function boxOf(cell: HTMLTableCellElement): HTMLElement | null {
  return cell.hasAttribute('data-service') ? cell.querySelector<HTMLElement>('input') : null;
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

/**
 * The `mousedown` of a press on a title or on one of its parts (the title, the sort button, the handle
 * that resizes, the button of the menu): cancelled, so that no text is selected as the pointer goes and
 * the browser focuses no control of the title (which would put the grid in widget mode), and the title
 * takes the focus instead. Only the main button; and a press in a popup that stands inside the title
 * (the grid may itself stand in a dialog or a popover, which hold the title: that one does not count) is
 * the popup's. Never the `pointerdown`, whose cancelling would take the mouse events from what listens
 * for them.
 */
export function pressTitle(event: MouseEvent<HTMLElement>): void {
  if (event.button !== 0) return;
  const title = event.currentTarget.closest('th');
  const target = event.target instanceof Element ? event.target : null;
  const popup = target?.closest(POPUP_SELECTOR);
  if (popup && title?.contains(popup)) return;
  event.preventDefault();
  if (title) focusHomeOf(title);
}

/** Whether a press adds a level to the sort: Shift, or ⌘ on Apple and Ctrl elsewhere. */
export function addsLevel(event: {
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
}): boolean {
  return event.shiftKey || (isApplePlatform() ? event.metaKey : event.ctrlKey);
}

/** The attribute of `<html>` that gives the whole page a cursor for as long as a drag is in flight. */
export const DRAG_CURSOR_ATTRIBUTE = 'data-flg-grid-cursor';

/**
 * Gives the whole page a cursor while a drag is in flight, or takes it away (`null`): the pointer is
 * far from the handle that was pressed, and the browser would draw the cursor of what it is over. A
 * mark on `<html>` that the stylesheet reads (`data-grid.css`), so no element's style is touched. It
 * is taken off on every end of the drag: the release, a cancel, Escape, a lost capture and the grid
 * going away in the middle of it.
 */
export function markDragCursor(doc: Document, cursor: 'col-resize' | 'grabbing' | null): void {
  if (cursor === null) doc.documentElement.removeAttribute(DRAG_CURSOR_ATTRIBUTE);
  else doc.documentElement.setAttribute(DRAG_CURSOR_ATTRIBUTE, cursor);
}

// A length of a computed style in pixels, 0 where there is none (jsdom has no stylesheet).
const lengthOf = (value: string): number => Number.parseFloat(value) || 0;

/**
 * What a cell needs to show everything in it: the width of its content and what it has beyond that
 * (padding and borders). The content is measured with a `Range`, which gives the width of the text and
 * of the boxes in it even where the cell cuts them off with an ellipsis, and scaled back by how much a
 * transform makes the cell's box differ from its layout size, so a grid in a panel that scales in
 * does not measure the scale. Nothing is changed in the DOM, so no layout changes and nothing scrolls.
 */
function widthOfCell(cell: HTMLTableCellElement): number {
  const range = document.createRange();
  range.selectNodeContents(cell);
  const drawn = cell.getBoundingClientRect().width;
  const scale = drawn > 0 && cell.offsetWidth > 0 ? cell.offsetWidth / drawn : 1;
  const content = range.getBoundingClientRect().width * scale;
  const style = getComputedStyle(cell);
  const beyond =
    lengthOf(style.paddingLeft) +
    lengthOf(style.paddingRight) +
    (cell.offsetWidth - cell.clientWidth);
  return content + beyond;
}

/**
 * What a title needs to show its words whole: the room its content takes, which is the sum of its
 * parts and the gaps between them, plus the part of each title text that is cut off (its
 * `scrollWidth` beyond its `clientWidth`), plus what the cell has around the content. Read from sizes
 * in layout pixels, which a transform does not change.
 */
function widthOfTitle(title: HTMLTableCellElement): number {
  const content = title.querySelector<HTMLElement>('.flg-data-grid-head-content');
  if (!content) return widthOfCell(title);
  const parts = Array.from(content.children, (part) => (part as HTMLElement).offsetWidth);
  const gap = lengthOf(getComputedStyle(content).columnGap);
  const cut = Array.from(
    content.querySelectorAll<HTMLElement>('.flg-data-grid-head-title'),
    (text) => Math.max(0, text.scrollWidth - text.clientWidth),
  );
  const natural =
    parts.reduce((sum, part) => sum + part, 0) +
    gap * Math.max(0, parts.length - 1) +
    cut.reduce((sum, part) => sum + part, 0);
  return natural + (title.offsetWidth - content.offsetWidth);
}

/**
 * What the column at `index` (among the cells of a row, the filler column not counted) needs to show
 * everything in it: one measure for its title and one for each of its cells that is drawn (a virtual
 * grid draws a window, a grid with no rows none). `autoFitWidth` takes the greatest.
 */
export function measureColumn(table: HTMLTableElement, index: number): number[] {
  const measures: number[] = [];
  const title = table.tHead?.rows[0] ? cellsOf(table.tHead.rows[0])[index] : undefined;
  if (title) measures.push(widthOfTitle(title));
  for (const row of dataRows(table)) {
    const cell = cellsOf(row)[index];
    if (cell) measures.push(widthOfCell(cell));
  }
  return measures;
}

/**
 * Places a vertical line of the grid, the drop line of a drag or the guide of a resize: it is in
 * `.flg-data-grid-main` (its parent), as the loading layer is, and not in the frame, whose content it
 * would scroll with. Its middle is at `x` and it is `width` wide; it runs from `top` to the bottom of
 * what the frame shows (the frame's scrollbar is no part of it). Positions are client pixels, written
 * in layout pixels, scaled back by the one the grid is drawn at, so a grid in a panel that scales in
 * measures right. Says whether `x` is within what the frame shows sideways.
 */
export function placeLine(
  line: HTMLElement,
  frame: HTMLElement,
  x: number,
  top: number,
  width: number,
): boolean {
  const main = line.parentElement;
  if (!main) return false;
  const box = main.getBoundingClientRect();
  const scale = box.width > 0 ? main.offsetWidth / box.width : 1;
  const area = frame.getBoundingClientRect();
  const bottom = area.top + frame.clientTop + frame.clientHeight;
  const left = area.left + frame.clientLeft;
  line.style.left = `${(x - box.left) * scale - width / 2}px`;
  line.style.top = `${(top - box.top) * scale}px`;
  line.style.height = `${Math.max(0, (bottom - top) * scale)}px`;
  return x >= left && x <= left + frame.clientWidth;
}

/**
 * The part of `left`..`right` (client x) that the middle of a grid shows: what is left between the
 * pinned zones, whose edge titles in the heading `row` cover the ends. A column of the middle reads
 * it for where a drop can go and for where a drag or a resize scrolls the frame (spec phase 6 §3.8).
 */
export function middleSpan(
  row: HTMLTableRowElement | null | undefined,
  left: number,
  right: number,
): { left: number; right: number } {
  const start = row?.querySelector('[data-pinned="left"][data-pin-edge]');
  const end = row?.querySelector('[data-pinned="right"][data-pin-edge]');
  return {
    left: start ? Math.max(left, start.getBoundingClientRect().right) : left,
    right: end ? Math.min(right, end.getBoundingClientRect().left) : right,
  };
}

/**
 * The box a drag or a resize of a column of the middle scrolls the frame from: the frame's, less
 * the pinned zones, so its zones of 40px are over the columns the drag works on and not under one.
 */
export function middleArea(
  frame: HTMLElement,
  table: HTMLTableElement | null,
): { left: number; right: number; top: number; bottom: number } {
  const box = frame.getBoundingClientRect();
  const span = middleSpan(table?.tHead?.rows[0], box.left, box.right);
  return { left: span.left, right: span.right, top: box.top, bottom: box.bottom };
}
