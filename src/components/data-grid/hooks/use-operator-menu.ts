import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createExternalStore, useExternalStore } from './use-external-store';
import type { ExternalStore } from './use-external-store';

/**
 * What the one operator menu of the grid is about: the column, and the button it opens under. `open` is the
 * only part that goes back and forth: a closed menu keeps its column and its button, so its items stay while
 * the browser hides it and the focus is given back to the button.
 */
export interface OperatorMenuView {
  readonly open: boolean;
  readonly columnId: string;
  readonly from: HTMLElement;
}

/**
 * The menu's state, apart from what the rows read: the buttons of the filter cells and the menu read it, so
 * opening and closing it draws no row and no title (spec phase 6 §3.8). `null` until it is first opened.
 */
export type OperatorMenuStore = ExternalStore<OperatorMenuView>;

/** The state of the menu, `null` before it was opened (and on the server). */
export const useOperatorMenuView = (store: OperatorMenuStore): OperatorMenuView | null =>
  useExternalStore(store);

export interface OperatorMenuControl {
  store: OperatorMenuStore;
  /**
   * Opens the menu of a column under its button. Asked while it is open, it closes and opens afresh a task
   * later: the press that asks has already light-dismissed the menu, and the browser reports that a task
   * later (the column menu's rule).
   */
  open: (columnId: string, from: HTMLElement) => void;
  close: () => void;
  /** The id of the menu's content, which an open button names in `aria-controls`. */
  contentId: string;
}

/** Opening the one operator menu of a grid, under the button of a filter cell (spec phase 6 §3.6, §4.3 F1). */
export function useOperatorMenu(contentId: string): OperatorMenuControl {
  const store = useState(() => createExternalStore<OperatorMenuView>())[0];
  const reopen = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const open = useCallback(
    (columnId: string, from: HTMLElement) => {
      clearTimeout(reopen.current);
      const view: OperatorMenuView = { open: true, columnId, from };
      const now = store.get();
      if (now?.open) {
        store.set({ ...now, open: false });
        reopen.current = setTimeout(() => store.set(view), 0);
      } else {
        store.set(view);
      }
    },
    [store],
  );

  // A close does not cancel a reopening that is waiting: the focus that moves from the menu to the button
  // of another column ends the menu by a timer of its own, which comes after the close that the reopening
  // began with.
  const close = useCallback(() => {
    const now = store.get();
    if (now?.open) store.set({ ...now, open: false });
  }, [store]);

  useEffect(() => () => clearTimeout(reopen.current), []);

  return useMemo(() => ({ store, open, close, contentId }), [store, open, close, contentId]);
}
