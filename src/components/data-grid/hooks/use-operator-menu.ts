import { useCallback, useMemo } from 'react';
import { useAnchoredOpen } from './use-anchored-open';
import type { AnchoredView } from './use-anchored-open';
import { useExternalStore } from './use-external-store';
import type { ExternalStore } from './use-external-store';

/**
 * What the one operator menu of the grid is about: the column, and the button it opens under (see
 * `AnchoredView`).
 */
export interface OperatorMenuView extends AnchoredView {
  readonly columnId: string;
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
  /** Opens the menu of a column under its button (and afresh, a task later, when it is open: `useAnchoredOpen`). */
  open: (columnId: string, from: HTMLElement) => void;
  close: () => void;
  /** The id of the menu's content, which an open button names in `aria-controls`. */
  contentId: string;
}

/** Opening the one operator menu of a grid, under the button of a filter cell (spec phase 6 §3.6, §4.3 F1). */
export function useOperatorMenu(contentId: string): OperatorMenuControl {
  const { store, open: openAnchored, close } = useAnchoredOpen<OperatorMenuView>();
  const open = useCallback(
    (columnId: string, from: HTMLElement) => openAnchored({ columnId, from }),
    [openAnchored],
  );
  return useMemo(() => ({ store, open, close, contentId }), [store, open, close, contentId]);
}
