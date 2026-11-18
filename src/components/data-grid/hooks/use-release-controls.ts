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
 * so they are not read and do not run the observer again. Without such a column there is no
 * observer. Returns the controls taken, for what counts them as focusable all the same
 * (`getFocusables`).
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
    if (!inBodies || !table) return;
    const bodies = Array.from(table.tBodies);
    const map = released.current;
    const observer = new MutationObserver((records) => {
      forgetRewritten(records, map);
      release(table, bodies, map);
      // The writes of this release are the grid's own: taken now, they are neither read as the
      // caller's nor a cause of another run. Nothing else runs while it writes, so they are all
      // that is taken.
      observer.takeRecords();
    });
    for (const body of bodies) {
      observer.observe(body, {
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

  return released.current;
}
