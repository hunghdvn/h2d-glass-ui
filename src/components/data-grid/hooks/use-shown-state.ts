import { useMemo } from 'react';
import type { MutableRefObject } from 'react';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import type { DataGridColumnLayout, DataGridState } from '../types';

export interface ShownStateOptions {
  /** The state as the app holds it, or as the grid does while it is uncontrolled. */
  state: DataGridState;
  /** The layout as it is shown. */
  shownLayout: DataGridColumnLayout;
  paged: boolean;
  /** The page as drawn: the index clamped to the pages there are. */
  pageIndex: number;
  size: number;
}

/**
 * The state the grid shows: what `getState()` returns and what the callbacks send, with the page as
 * drawn and the layout as shown. It is written into `shownRef` when the commit starts, never in a
 * render. The ref is made by the caller, early, because `useGridState` reads it too.
 */
export function useShownState(
  shownRef: MutableRefObject<DataGridState>,
  { state, shownLayout, paged, pageIndex, size }: ShownStateOptions,
): DataGridState {
  const shown = useMemo<DataGridState>(
    () => ({
      sort: state.sort,
      filter: state.filter,
      // With paging off the page is not the grid's to say: it stays as it is held, unused.
      page: paged ? { index: pageIndex, size } : state.page,
      selectedKeys: state.selectedKeys,
      columnLayout: shownLayout,
      grouping: state.grouping,
      expandedGroups: state.expandedGroups,
    }),
    [
      state.sort,
      state.filter,
      state.page,
      state.selectedKeys,
      state.grouping,
      state.expandedGroups,
      shownLayout,
      pageIndex,
      paged,
      size,
    ],
  );
  useWriteOnCommit(() => {
    shownRef.current = shown;
  });
  return shown;
}
