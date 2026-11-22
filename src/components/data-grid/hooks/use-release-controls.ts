import { useRef } from 'react';
import type { RefObject } from 'react';
import { POPUP_SELECTOR } from '../../../internal/controls';
import { getTabbableKinds, giveBackControl, releaseControl } from '../../../internal/focus';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';

/**
 * Takes the controls in `parts` of `table` (its sections, or cells and rows of them) out of the Tab
 * order, remembers the `tabindex` of each, and marks each as released (`releaseControl` of
 * focus.ts), for the keys of the grid that go through the controls of a cell all the same
 * (`getFocusables` with `released`). A cell is a stop and not a control of one; the box of the
 * column of boxes and the button of the empty cell of a filtered grid are the stop of their cell,
 * which is how they get their `tabindex`; a grid in a cell
 * keeps its own stop; and a popup in a cell (`[popover]`, `dialog`) is a place of its own, whose
 * controls Tab goes through while it is open, as it does for a key or a press in it. Elements that
 * left the DOM are forgotten.
 */
function release(
  table: HTMLTableElement,
  parts: readonly (HTMLElement | null)[],
  map: Map<HTMLElement, string | null>,
): void {
  for (const element of map.keys()) {
    if (element.isConnected) continue;
    map.delete(element);
    giveBackControl(element);
  }
  for (const part of parts) {
    if (!part) continue;
    for (const element of getTabbableKinds(part)) {
      if (element instanceof HTMLTableCellElement && element.closest('table') === table) continue;
      if (element.closest('[data-service], [data-home]')) continue;
      if (element.closest('table[role="grid"]') !== table) continue;
      const popup = element.closest(POPUP_SELECTOR);
      if (popup && table.contains(popup)) continue;
      map.set(element, element.getAttribute('tabindex'));
      element.setAttribute('tabindex', '-1');
      releaseControl(element);
    }
  }
}

/** The cell of `table` that holds `node`, past the cells of a table in a cell; `null` for none. */
function cellOfTable(node: Node, table: HTMLTableElement): Element | null {
  const from = node instanceof Element ? node : node.parentElement;
  for (
    let cell = from?.closest('td, th') ?? null;
    cell;
    cell = cell.parentElement?.closest('td, th') ?? null
  ) {
    if (cell.closest('table') === table) return cell;
  }
  return null;
}

/**
 * Where the records say something changed, and the only parts the watcher looks through, not the
 * whole body: the cell of the table that each record is in, and the rows put into the body (a
 * window that moves, rows that come). What is in no cell of it, as an attribute of a row, is looked
 * through whole.
 */
function changedParts(records: readonly MutationRecord[], table: HTMLTableElement): HTMLElement[] {
  const parts = new Set<HTMLElement>();
  for (const record of records) {
    const cell = cellOfTable(record.target, table);
    if (cell instanceof HTMLElement) parts.add(cell);
    else if (record.type === 'childList') {
      for (const node of record.addedNodes) if (node instanceof HTMLElement) parts.add(node);
    } else if (record.target instanceof HTMLElement) parts.add(record.target);
  }
  return [...parts];
}

/**
 * The attributes that make an element a stop of Tab, or stop it being one, without a new element: a
 * control that a cell enables, a link that gets its `href`, a `tabindex` that a cell moves (a roving
 * one), a part that is shown or made inert again.
 */
const WATCHED_ATTRIBUTES = ['disabled', 'tabindex', 'href', 'contenteditable', 'hidden', 'inert'];

/**
 * Lets go of the controls whose `tabindex` was written since the grid wrote it. The records of the
 * grid's own writes are taken as soon as it makes them, so a `tabindex` record in `records` is the
 * caller's (a cell that moves its stop, a prop that changed). A value of 0 or more is taken again by
 * the release that follows, with the new value to give back; a negative one is the caller's own,
 * which stays as it is and is not given back.
 */
function forgetRewritten(
  records: readonly MutationRecord[],
  map: Map<HTMLElement, string | null>,
): void {
  for (const record of records) {
    if (record.attributeName === 'tabindex' && record.target instanceof HTMLElement) {
      map.delete(record.target);
      giveBackControl(record.target);
    }
  }
}

/**
 * Keeps the controls of a grid's cells out of the Tab order, so the grid has its one stop (spec phase
 * 6 §3.6), and gives each its own `tabindex` back, as it was, when the grid goes; a value the caller
 * set since is not undone. The heading's controls (the sort buttons) are released after each commit
 * of the grid. The rows' are too when a column draws its own cells (`inBodies`), and then a
 * `MutationObserver` on the body also catches what a cell changes by its own render, which no commit
 * of the grid sees: a control it adds (a link that comes after a fetch, a "Do" that becomes "Undo"),
 * or one it makes a stop by an attribute (a button it enables, a link that gets its `href`, a roving
 * `tabindex` it moves). The records of the grid's own writes are taken right after it makes them,
 * so they are not read and do not run the observer again. The observer looks only through the
 * cells and the rows its records name (`changedParts`), not the whole body. The heading is always
 * watched, whether or not a column has a `cell`: its filter row's controls render on their own (a
 * date cell makes its picker anew on Esc, which draws that cell and no commit of the grid), and
 * they must not become stops of Tab.
 */
export function useReleaseControls(
  tableRef: RefObject<HTMLTableElement | null>,
  inBodies: boolean,
): void {
  const released = useRef(new Map<HTMLElement, string | null>());
  const watcher = useRef<MutationObserver | null>(null);

  useIsoLayoutEffect(() => {
    const map = released.current;
    return () => {
      for (const [element, tabindex] of map) {
        giveBackControl(element);
        // A caller that set another value since is not undone.
        if (element.getAttribute('tabindex') !== '-1') continue;
        if (tabindex === null) element.removeAttribute('tabindex');
        else element.setAttribute('tabindex', tabindex);
      }
      map.clear();
    };
  }, []);

  useIsoLayoutEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    const map = released.current;
    // What this commit changed is read and released here and now, and the records of the grid's own
    // writes are taken after them: the watcher looks at neither again.
    forgetRewritten(watcher.current?.takeRecords() ?? [], map);
    const bodies = inBodies ? Array.from(table.tBodies) : [];
    release(table, [table.tHead, ...bodies], map);
    watcher.current?.takeRecords();
  });

  useIsoLayoutEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    const bodies = inBodies ? Array.from(table.tBodies) : [];
    const map = released.current;
    const observer = new MutationObserver((records) => {
      forgetRewritten(records, map);
      release(table, changedParts(records, table), map);
      // The writes of this release are the grid's own: taken now, they are neither read as the
      // caller's nor a cause of another run. Nothing else runs while it writes, so they are all
      // that is taken.
      observer.takeRecords();
    });
    for (const part of [table.tHead, ...bodies]) {
      if (!part) continue;
      observer.observe(part, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: WATCHED_ATTRIBUTES,
      });
    }
    watcher.current = observer;
    return () => {
      observer.disconnect();
      watcher.current = null;
    };
  }, [tableRef, inBodies]);
}
