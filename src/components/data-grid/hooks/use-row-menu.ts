import { useCallback, useMemo } from 'react';
import type { FlatRow } from '../engine/flatten';
import type { DataGridKey } from '../types';
import { useAnchoredOpen } from './use-anchored-open';
import type { AnchoredOpen, AnchoredView } from './use-anchored-open';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';

/** What the one row menu of the grid is about: the row, its name, and the handle it opens under. */
export interface RowMenuView extends AnchoredView {
  readonly key: DataGridKey;
  /** The row's header text, else its key: what the menu is named after. */
  readonly name: string;
}

export interface RowMenuControl {
  store: AnchoredOpen<RowMenuView>['store'];
  /** Opens the menu of the row with this key, named `name`, under its handle. */
  open: (key: DataGridKey, name: string, from: HTMLElement) => void;
  close: () => void;
}

/**
 * The one menu of the rows of a grid (spec phase 6 §3.6, §6.3): its state, which only the handles and the
 * menu read, so opening and closing it draws no row. A popup dies with what opened it (PR #44 5): it closes,
 * for good, when `rowReorder` turns off, when the grid starts to sort or group (`enabled` is whether the
 * handles can move a row now), and when its row leaves the rows shown.
 */
export function useRowMenu<TRow>({
  enabled,
  rows,
}: {
  enabled: boolean;
  rows: readonly FlatRow<TRow>[];
}): RowMenuControl {
  const { store, open: openAt, close } = useAnchoredOpen<RowMenuView>();
  const open = useCallback(
    (key: DataGridKey, name: string, from: HTMLElement) => openAt({ key, name, from }),
    [openAt],
  );
  useIsoLayoutEffect(() => {
    const view = store.get();
    if (!view?.open) return;
    if (!enabled || !rows.some((row) => row.kind === 'data' && Object.is(row.key, view.key))) {
      close();
    }
  });
  return useMemo(() => ({ store, open, close }), [store, open, close]);
}
