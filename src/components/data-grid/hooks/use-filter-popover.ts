import { useCallback, useMemo } from 'react';
import { useAnchoredOpen } from './use-anchored-open';
import type { AnchoredView } from './use-anchored-open';
import { useExternalStore } from './use-external-store';
import type { ExternalStore } from './use-external-store';

/**
 * What the one filter popover of the grid holds: the two ends of a range (`between`). The header filter's
 * list of values is its second kind.
 */
export type FilterPopoverKind = 'between';

/**
 * What the one filter popover of the grid is about: its kind, the column, and the element it opens under
 * and gives the focus back to (see `AnchoredView`).
 */
export interface FilterPopoverView extends AnchoredView {
  readonly kind: FilterPopoverKind;
  readonly columnId: string;
}

/**
 * The popover's state, apart from what the rows read: what opens it and the popover read it, so opening
 * and closing it draws no row and no title (spec phase 6 §3.8). `null` until it is first opened.
 */
export type FilterPopoverStore = ExternalStore<FilterPopoverView>;

/** The state of the popover, `null` before it was opened (and on the server). */
export const useFilterPopoverView = (store: FilterPopoverStore): FilterPopoverView | null =>
  useExternalStore(store);

export interface FilterPopoverControl {
  store: FilterPopoverStore;
  /** Opens the popover of a kind for a column, under `from` (and afresh, a task later, when it is open). */
  open: (kind: FilterPopoverKind, columnId: string, from: HTMLElement) => void;
  close: () => void;
  /** The id of the popover, which an open opener names in `aria-controls`. */
  contentId: string;
}

/** Opening the one filter popover of a grid (spec phase 6 §3.6, §6.3 "Lọc ở header"). */
export function useFilterPopover(contentId: string): FilterPopoverControl {
  const { store, open: openAnchored, close } = useAnchoredOpen<FilterPopoverView>();
  const open = useCallback(
    (kind: FilterPopoverKind, columnId: string, from: HTMLElement) =>
      openAnchored({ kind, columnId, from }),
    [openAnchored],
  );
  return useMemo(() => ({ store, open, close, contentId }), [store, open, close, contentId]);
}
