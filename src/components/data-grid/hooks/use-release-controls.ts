import { useRef } from 'react';
import type { RefObject } from 'react';
import { POPUP_SELECTOR } from '../../../internal/controls';
import { getTabbableKinds } from '../../../internal/focus';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';

/** The controls a grid took out of the Tab order, with the `tabindex` each had. */
export type ReleasedControls = ReadonlyMap<HTMLElement, string | null>;

/**
 * Takes the controls in `sections` of `table` out of the Tab order, and remembers the `tabindex` of
 * each. A cell is a stop and not a control of one; the box of the column of boxes is the stop of its
 * cell, which is how it gets its `tabindex`; a grid in a cell keeps its own stop; and a popup in a
 * cell (`[popover]`, `dialog`) is a place of its own, whose controls Tab goes through while it is
 * open, as it does for a key or a press in it. Elements that left the DOM are forgotten.
 */
function release(
  table: HTMLTableElement,
  sections: readonly (HTMLTableSectionElement | null)[],
  map: Map<HTMLElement, string | null>,
): void {
  for (const element of map.keys()) if (!element.isConnected) map.delete(element);
  for (const section of sections) {
    if (!section) continue;
    for (const element of getTabbableKinds(section)) {
      if (element instanceof HTMLTableCellElement && element.closest('table') === table) continue;
      if (element.closest('[data-service]')) continue;
      if (element.closest('table[role="grid"]') !== table) continue;
      const popup = element.closest(POPUP_SELECTOR);
      if (popup && table.contains(popup)) continue;
      map.set(element, element.getAttribute('tabindex'));
      element.setAttribute('tabindex', '-1');
    }
  }
}

/**
 * Keeps the controls of a grid's cells out of the Tab order, so the grid has its one stop (spec phase
 * 6 §3.6), and gives each its own `tabindex` back, as it was, when the grid goes; a value the caller
 * set since is not undone. The heading's controls (the sort buttons) are released after each commit
 * of the grid. The rows' are too when a column draws its own cells (`inBodies`), and then a
 * `MutationObserver` on the body also catches a control that a cell adds by its own render, which no
 * commit of the grid sees (a link that comes after a fetch, a "Do" that becomes "Undo"). Without
 * such a column there is no observer. Returns the controls taken, for what counts them as focusable
 * all the same (`getFocusables`).
 */
export function useReleaseControls(
  tableRef: RefObject<HTMLTableElement | null>,
  inBodies: boolean,
): ReleasedControls {
  const released = useRef(new Map<HTMLElement, string | null>());
  const watcher = useRef<MutationObserver | null>(null);

  useIsoLayoutEffect(() => {
    const map = released.current;
    return () => {
      for (const [element, tabindex] of map) {
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
    // What this commit changed is released here and now: the watcher need not look at it again.
    watcher.current?.takeRecords();
    const bodies = inBodies ? Array.from(table.tBodies) : [];
    release(table, [table.tHead, ...bodies], released.current);
  });

  useIsoLayoutEffect(() => {
    const table = tableRef.current;
    if (!inBodies || !table) return;
    const bodies = Array.from(table.tBodies);
    const observer = new MutationObserver(() => release(table, bodies, released.current));
    for (const body of bodies) observer.observe(body, { childList: true, subtree: true });
    watcher.current = observer;
    return () => {
      observer.disconnect();
      watcher.current = null;
    };
  }, [tableRef, inBodies]);

  return released.current;
}
