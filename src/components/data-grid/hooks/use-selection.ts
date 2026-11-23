import { useCallback, useMemo, useRef } from 'react';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import type { FlatDataRow, FlatRow } from '../engine/flatten';
import { addKeys, rangeKeys, removeKeys, scopeState, toggleKey } from '../engine/selection';
import type { ScopeState } from '../engine/selection';
import type {
  DataGridKey,
  DataGridLabels,
  DataGridSelectAllMode,
  DataGridSelectionMode,
} from '../types';

export interface SelectionOptions<TRow> {
  mode: DataGridSelectionMode;
  /** The scope of "select all", with server mode already counted in. */
  allMode: DataGridSelectAllMode;
  /** The chosen keys, as the grid holds them. */
  keys: readonly DataGridKey[];
  /** `useGridState`'s `setSelectedKeys`. */
  setKeys: (
    change: (current: readonly DataGridKey[]) => readonly DataGridKey[] | undefined,
  ) => readonly DataGridKey[] | undefined;
  /** The rows of the page that is shown, in order; the group and detail rows in them are not chosen. */
  pageRows: readonly FlatRow<TRow>[];
  /** Every data row after the filter, in the order shown, the rows of closed groups too: the scope of `'all'`. */
  orderedRows: readonly FlatRow<TRow>[];
  /**
   * The rows of the list in order, of every page: a range is taken over the data rows among them, so
   * the rows a closed group hides are not in it.
   */
  listRows: readonly FlatRow<TRow>[];
  labels: DataGridLabels;
  announce: (text: string) => void;
}

/** What the rows and the title read of the selection: it changes with every choice. */
export interface SelectionView {
  /** The chosen keys as a set, for a row to ask whether it is chosen. */
  chosen: ReadonlySet<DataGridKey>;
  /** The box in the title: checked, mixed, or disabled when its scope is empty. */
  header: ScopeState;
}

/**
 * What a press or a key does. It is the same object for as long as the grid keeps its mode, and
 * reads the rows and the words of the last commit when it is called, so a choice that changes one
 * row does not give the other rows a new prop to draw again for.
 */
export interface SelectionActions {
  /** A press on a row, or on its box: with `range` (Shift) it adds the rows from the anchor to it. */
  press: (key: DataGridKey, range: boolean) => void;
  /** The box in the title: the rows of the scope are chosen, or taken off. */
  setAll: (checked: boolean) => void;
  /** mod+A: every row of the scope is chosen. */
  chooseAll: () => void;
}

// A group row and a detail row have no box: only the data rows are chosen.
const isData = <TRow>(row: FlatRow<TRow>): row is FlatDataRow<TRow> => row.kind === 'data';

function scopeKeys<TRow>({ allMode, pageRows, orderedRows }: SelectionOptions<TRow>) {
  return (allMode === 'all' ? orderedRows : pageRows).filter(isData).map((row) => row.key);
}

/**
 * Choosing rows (spec phase 6 §6.3, "Chọn dòng"). `single` replaces the choice; `multiple` toggles a
 * row, adds a range from the anchor (the last row toggled by a plain press or Space), and chooses
 * or takes off the scope of "select all". What is chosen is kept by key, so a sort, a page or a row
 * that leaves the data does not change it. Only an event calls anything, never a render.
 */
export function useSelection<TRow>(options: SelectionOptions<TRow>): {
  view: SelectionView;
  actions: SelectionActions;
} {
  const { mode, keys, allMode, pageRows, orderedRows } = options;
  const chosen = useMemo(() => new Set(keys), [keys]);
  const scope = allMode === 'all' ? orderedRows : pageRows;
  const header = useMemo(
    () =>
      scopeState(
        scope.filter(isData).map((row) => row.key),
        chosen,
      ),
    [scope, chosen],
  );
  const view = useMemo(() => ({ chosen, header }), [chosen, header]);

  // What the actions read when they are called, written when a commit starts.
  const latest = useRef(options);
  useWriteOnCommit(() => {
    latest.current = options;
  });
  // The row a range starts from: the last one a plain press or Space chose. No render shows it.
  const anchor = useRef<DataGridKey | null>(null);

  const press = useCallback(
    (key: DataGridKey, range: boolean) => {
      const { setKeys, listRows: listed, announce, labels } = latest.current;
      const ordered = listed.filter(isData);
      if (mode === 'single') {
        anchor.current = key;
        setKeys(() => [key]);
      } else if (mode === 'multiple' && range) {
        const next = setKeys((now) => addKeys(now, rangeKeys(ordered, anchor.current, key)));
        if (next) announce(labels.announceSelected(next.length));
      } else if (mode === 'multiple') {
        anchor.current = key;
        setKeys((now) => toggleKey(now, key));
      }
    },
    [mode],
  );

  const setAll = useCallback((checked: boolean) => {
    const { setKeys, announce, labels } = latest.current;
    const ofScope = scopeKeys(latest.current);
    const next = setKeys((now) => (checked ? addKeys(now, ofScope) : removeKeys(now, ofScope)));
    if (checked && next) announce(labels.announceSelected(next.length));
  }, []);

  const chooseAll = useCallback(() => {
    const { setKeys, announce, labels, keys: now } = latest.current;
    const ofScope = scopeKeys(latest.current);
    // Said even when every row of the scope was chosen already: whoever pressed the keys wants the count.
    announce(labels.announceSelected((setKeys((held) => addKeys(held, ofScope)) ?? now).length));
  }, []);

  const actions = useMemo(() => ({ press, setAll, chooseAll }), [press, setAll, chooseAll]);
  return { view, actions };
}
