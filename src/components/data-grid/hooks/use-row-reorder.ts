import { useCallback, useMemo, useRef } from 'react';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import type { ResolvedColumn } from '../engine/columns';
import type { FlatDataRow, FlatRow } from '../engine/flatten';
import { askOfMove, isPlacedAs, placeAfterMove } from '../engine/row-reorder';
import type { RowAsk, RowMove } from '../engine/row-reorder';
import type { DataGridKey, DataGridLabels, DataGridRowDrop } from '../types';

export interface RowReorderOptions<TRow> {
  /** Whether the grid reorders rows (`rowReorder`). */
  enabled: boolean;
  /** Whether the grid sorts or groups now: the handles and the keys do nothing but say why. */
  off: boolean;
  /** Every data row after the filter, in the order shown: the rows a move is counted among. */
  keyed: readonly FlatDataRow<TRow>[];
  /** The rows the app gave, which the move waits for a change of. */
  data: readonly TRow[];
  /** The column whose text names a row (the row header). */
  rowHeader: ResolvedColumn<TRow> | undefined;
  textOf: (row: TRow, column: ResolvedColumn<TRow>) => string;
  onRowReorder:
    ((from: DataGridKey, to: DataGridKey, position: DataGridRowDrop) => void) | undefined;
  labels: DataGridLabels;
  announce: (text: string) => void;
  /** The handle's `scrollToRow`: its page, then the row scrolled into view the least it takes. */
  scrollToRow: (key: DataGridKey) => boolean;
  /** The rows of the page shown: a row that left it has lost the place of the keyboard to its neighbour. */
  rows: readonly FlatRow<TRow>[];
  /** Puts the active place on the row with this key, and the focus there when the grid has it. */
  focusRow: (key: DataGridKey) => void;
}

export interface RowReorder {
  /** The keys of the rows after the filter, in the order shown; none while the grid does not reorder. */
  keys: readonly DataGridKey[];
  /** The row's header text, else its key: what the handle, the menu and the sentences call it. */
  nameOf: (row: unknown, key: DataGridKey) => string;
  /** A move of the menu or of the keys: the row follows the app's answer to its page and into sight. */
  move: (key: DataGridKey, how: RowMove) => void;
  /** A move by `mod+Shift+↑` or `↓`; while the grid sorts or groups it says why, once for a press. */
  moveByKey: (key: DataGridKey, step: -1 | 1, repeat: boolean) => void;
  /** A drop of the pointer: the line has said where, and the row is not followed (it is under the pointer). */
  drop: (key: DataGridKey, ask: RowAsk) => void;
}

const NO_KEYS: readonly DataGridKey[] = [];

/** A move waiting for the app's answer: the `data` it was asked of, which the answer is a change of. */
interface Pending {
  key: DataGridKey;
  ask: RowAsk;
  data: readonly unknown[];
}

/**
 * What the user does to the order of the rows (spec phase 6 §3.6, §6.3): the three ways to ask for a move
 * (the menu, the keys, a drop) are one function, which tells `onRowReorder` once with the row it goes to and
 * which side, and says where the row went, among the rows after the filter, before the app has answered. The
 * grid moves nothing: the app changes `data`.
 *
 * A move by the menu or the keys is followed. The place of the keyboard is by key, so it goes with a row
 * that stays on its page; the page and the sight are this hook's: at the first commit with another `data`
 * than the one the move was asked of, if the rows are in the order that was asked for, the row is scrolled
 * to, which goes to its page first when it is on another and then scrolls it into view the least it takes.
 * A row that left the page left the place with its neighbour (the keyboard does that for any row that goes),
 * so the commit that shows it on its page gives the place back to it, and the focus when the grid has it.
 * The first commit ends the request, whatever it shows: a `data` the app changed another way is not this
 * move's, and one the app never changed leaves it waiting for nothing but a change.
 */
export function useRowReorder<TRow>(options: RowReorderOptions<TRow>): RowReorder {
  const { enabled, keyed, data } = options;
  const keys = useMemo(() => (enabled ? keyed.map((row) => row.key) : NO_KEYS), [enabled, keyed]);
  const latest = useRef({ ...options, keys });
  useWriteOnCommit(() => {
    latest.current = { ...options, keys };
  });
  const pending = useRef<Pending | null>(null);

  const nameOf = useCallback((row: unknown, key: DataGridKey): string => {
    const { rowHeader, textOf } = latest.current;
    const text = rowHeader ? textOf(row as TRow, rowHeader) : '';
    return text === '' ? String(key) : text;
  }, []);

  const ask = useCallback(
    (key: DataGridKey, asked: RowAsk, follow: boolean): void => {
      const {
        keys: shown,
        keyed: rows,
        onRowReorder,
        labels,
        announce,
        data: given,
      } = latest.current;
      const place = placeAfterMove(shown, key, asked);
      if (!onRowReorder || place === 0) return;
      const row = rows.find((one) => Object.is(one.key, key));
      onRowReorder(key, asked.toKey, asked.position);
      announce(labels.announceRowMoved(nameOf(row?.row, key), place, shown.length));
      pending.current = follow ? { key, ask: asked, data: given } : null;
    },
    [nameOf],
  );

  const move = useCallback(
    (key: DataGridKey, how: RowMove): void => {
      const asked = askOfMove(latest.current.keys, key, how);
      if (asked) ask(key, asked, true);
    },
    [ask],
  );

  const moveByKey = useCallback(
    (key: DataGridKey, step: -1 | 1, repeat: boolean): void => {
      const { off, labels, announce } = latest.current;
      if (off) {
        if (!repeat) announce(labels.reorderDisabled);
        return;
      }
      move(key, step < 0 ? 'up' : 'down');
    },
    [move],
  );

  const drop = useCallback((key: DataGridKey, asked: RowAsk) => ask(key, asked, false), [ask]);

  // The row that went to another page, waiting to be shown there: the commit after the one that asked for
  // the page gives it its place back, or finds it is not shown and lets it go. Declared before the effect
  // that sets it, so the commit that asks does not settle it.
  const following = useRef<DataGridKey | null>(null);
  useIsoLayoutEffect(() => {
    const key = following.current;
    if (key === null) return;
    following.current = null;
    const now = latest.current;
    const shown = now.rows.some((row) => row.kind === 'data' && Object.is(row.key, key));
    if (now.enabled && shown) now.focusRow(key);
  });
  useIsoLayoutEffect(() => {
    const request = pending.current;
    if (!request || request.data === data) return;
    pending.current = null;
    const now = latest.current;
    if (!now.enabled || !isPlacedAs(now.keys, request.key, request.ask)) return;
    const shown = now.rows.some((row) => row.kind === 'data' && Object.is(row.key, request.key));
    now.scrollToRow(request.key);
    if (!shown) following.current = request.key;
  }, [data]);

  return useMemo(
    () => ({ keys, nameOf, move, moveByKey, drop }),
    [keys, nameOf, move, moveByKey, drop],
  );
}
