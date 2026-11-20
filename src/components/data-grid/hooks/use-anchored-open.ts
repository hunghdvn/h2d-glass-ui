import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createExternalStore } from './use-external-store';
import type { ExternalStore } from './use-external-store';

/**
 * What a popup that the grid keeps one of is about: whether it shows, and the element it opens under.
 * `open` is the only part that goes back and forth: a closed popup keeps what it was about, so its content
 * stays while the browser hides it and the focus is given back to the element it opened from.
 */
export interface AnchoredView {
  readonly open: boolean;
  readonly from: HTMLElement;
}

export interface AnchoredOpen<V extends AnchoredView> {
  store: ExternalStore<V>;
  /**
   * Opens the popup for `detail`, under `detail.from`. Asked while it is open, it closes and opens afresh
   * a task later: the press that asks has already light-dismissed the popup, and the browser reports that
   * a task later (the column menu's rule).
   */
  open: (detail: Omit<V, 'open'>) => void;
  close: () => void;
}

/**
 * The state of a popup that the grid keeps one of (the menu of operators, the filter popover), apart from
 * what the rows read: the parts that open it and the popup read it, so opening and closing it draws no row
 * and no title (spec phase 6 §3.8). The store is `null` until the popup is first opened.
 */
export function useAnchoredOpen<V extends AnchoredView>(): AnchoredOpen<V> {
  const store = useState(() => createExternalStore<V>())[0];
  const reopen = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const open = useCallback(
    (detail: Omit<V, 'open'>) => {
      clearTimeout(reopen.current);
      const view = { ...detail, open: true } as V;
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

  // A close does not cancel a reopening that is waiting: the focus that moves from the popup to the opener
  // of another column ends the popup by a timer of its own, which comes after the close that the reopening
  // began with.
  const close = useCallback(() => {
    const now = store.get();
    if (now?.open) store.set({ ...now, open: false });
  }, [store]);

  useEffect(() => () => clearTimeout(reopen.current), []);

  return useMemo(() => ({ store, open, close }), [store, open, close]);
}
