import { useCallback, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { devWarn } from '../../../internal/warn';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import { applyChanges, canUpdate, rowDiff, savingChanges } from '../engine/edit';
import type { PendingChange, ShownRows } from '../engine/edit';
import { fromEditorValue } from '../engine/editor-values';
import type { ResolvedColumn } from '../engine/columns';
import type { FlatDataRow } from '../engine/flatten';
import type { EditContextValue, EditTarget } from '../edit-context';
import { focusInto, ownCell } from '../grid-dom';
import type { DataGridEditing, DataGridKey, DataGridLabels, DataGridProps } from '../types';
import { createExternalStore } from './use-external-store';
import type { ExternalStore } from './use-external-store';

export interface EditingOptions<TRow> {
  /** The `editing` prop, made safe and kept by value: `undefined` is no editing. */
  editing: DataGridEditing<TRow> | undefined;
  onSaving: DataGridProps<TRow>['onSaving'];
  /** Every resolved column: a value column's `setValue` and the fields a save compares are read from them. */
  resolved: readonly ResolvedColumn<TRow>[];
  /**
   * The data rows of the list, which a key is looked up in: the grid writes the list of the last commit into it
   * (the pipeline that makes the list reads this hook's changes, so the list cannot be a plain option).
   */
  keyed: { readonly current: readonly FlatDataRow<TRow>[] };
  data: readonly TRow[];
  getKey: (row: TRow, index: number) => DataGridKey;
  labels: DataGridLabels;
  announce: (text: string) => void;
  tableRef: RefObject<HTMLTableElement | null>;
  size: 'sm' | 'md';
}

/** What the keys of the grid ask of the edit state: the same functions for as long as the grid lives. */
export interface EditKeyActions<TRow> {
  /** The key of the row being edited; `null` when none is. */
  target(): DataGridKey | null;
  /** Whether a row can be edited (`allowUpdating`). */
  canStart(row: TRow): boolean;
  start(key: DataGridKey, columnId?: string): void;
  save(): void;
  cancel(): void;
}

export interface Editing<TRow> {
  /** What the editing parts share; `null` when the grid does not edit. */
  context: EditContextValue<TRow> | null;
  /** The row being edited, for the body. */
  target: EditTarget | null;
  /** What the keys call; `null` when the grid does not edit. */
  keys: EditKeyActions<TRow> | null;
  /** The unsaved changes over the rows, for the pipeline: only a pending or a failed save leaves one. */
  shown: ShownRows<TRow> | null;
  /** Whether a save is pending: the table is busy. */
  saving: boolean;
}

type Changes<TRow> = ReadonlyMap<DataGridKey, PendingChange<TRow>>;
const NO_CHANGES: Changes<never> = new Map();

const isThenable = (value: unknown): value is PromiseLike<void> =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { then?: unknown }).then === 'function';

/** Whether two `editing` values say the same: the mode and the function (by identity) of `allowUpdating`. */
export function sameEditing(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const left = a as Partial<DataGridEditing<unknown>>;
  const right = b as Partial<DataGridEditing<unknown>>;
  return left.mode === right.mode && Object.is(left.allowUpdating, right.allowUpdating);
}

/**
 * The state of editing (spec phase 6 §6.3): the row being edited, what the user typed in it, a pending save and
 * the one function for each thing the user does (start, set a value, save, cancel). Every way to do one goes
 * through here: the button, the keys. Nothing of it is the grid's `state`: it is not controlled, and not in
 * `getState()` or `onStateChange`.
 *
 * The draft is in a store that each editor reads its own field of, so a key typed in an editor draws that
 * editor and nothing else; the row being edited is read by the body, so starting and ending an edit draws that
 * row. A save reads the draft when it is asked for (never a render's), and a request ends: a Promise that
 * settles after the edit was ended, the mode changed or the grid unmounted is not waited for.
 */
export function useEditing<TRow>(options: EditingOptions<TRow>): Editing<TRow> {
  const { editing, onSaving, resolved, keyed, data, getKey, labels, announce, tableRef, size } =
    options;
  const [target, setTarget] = useState<{ key: DataGridKey; focus: string | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState<Changes<TRow>>(NO_CHANGES);
  const [draft] = useState<ExternalStore<Partial<TRow>>>(createExternalStore);
  // Counts the edits: an answer that comes after another edit began, the mode changed or the grid went is
  // not the one waited for. `pending` is whether a save is waiting, read by the next press and not by a render.
  const session = useRef(0);
  const pending = useRef(false);
  // The changes the grid holds, as the last `setChanges` left them: the saved row of a key that has one, which
  // the list shows over (`keyed` holds the shown row).
  const held = useRef<Changes<TRow>>(NO_CHANGES);
  // What the functions below read: the values of the last commit, and the key of the row being edited, which
  // `start` and `end` write at once so that a press before the next commit sees the edit it just made.
  const latest = useRef({ editing, onSaving, resolved, labels, announce, tableRef });
  const current = useRef<{ key: DataGridKey; focus: string | null } | null>(null);
  useWriteOnCommit(() => {
    latest.current = { editing, onSaving, resolved, labels, announce, tableRef };
  });
  const mode = editing?.mode ?? null;

  const reset = useCallback((): void => {
    session.current += 1;
    pending.current = false;
    current.current = null;
    draft.set(null);
    setTarget(null);
    setSaving(false);
    held.current = NO_CHANGES;
    setChanges(NO_CHANGES);
  }, [draft]);

  const end = useCallback((): void => {
    // The focus goes to the cell of the editor that had it, before the editors go: never to `<body>`.
    const table = latest.current.tableRef.current;
    const active = document.activeElement;
    if (table && active && table.contains(active)) {
      const row = active.closest('tr[data-editing]');
      const cell = row ? ownCell(active, table) : null;
      if (cell && row?.contains(cell)) focusInto(cell, cell);
    }
    reset();
  }, [reset]);

  // A mode that changes, editing that turns off and the grid going each end the edit and drop what was typed;
  // nothing is sent, and a save that is pending is no longer waited for.
  useIsoLayoutEffect(() => {
    reset();
    return () => {
      session.current += 1;
    };
  }, [mode, reset]);

  // The saved row of a key: the one a change was made on while a save is pending or failed (the list shows the row
  // with the change over it), else the row of the list.
  const rowOf = useCallback(
    (key: DataGridKey): TRow | undefined => {
      const change = held.current.get(key);
      if (change?.type === 'update') return change.row;
      return keyed.current.find((flat) => Object.is(flat.key, key))?.row;
    },
    [keyed],
  );

  const save = useCallback(
    (after?: () => void): void => {
      const now = latest.current;
      const edited = current.current;
      if (!edited || !now.editing || pending.current) return;
      const { key } = edited;
      const row = rowOf(key);
      const typed = draft.get();
      const diff = row !== undefined && typed !== null ? rowDiff(row, typed, now.resolved) : {};
      // No change is no save; and without `onSaving` the change is dropped, which the grid has warned about.
      if (
        row === undefined ||
        Object.keys(diff).length === 0 ||
        typeof now.onSaving !== 'function'
      ) {
        end();
        after?.();
        return;
      }
      const change: PendingChange<TRow> = { type: 'update', key, data: diff, row };
      const settled = (): void => {
        now.announce(now.labels.announceSaved);
        end();
        after?.();
      };
      let result: unknown;
      try {
        result = now.onSaving(savingChanges(new Map([[key, change]]), now.resolved));
      } catch {
        // A throw is a reject: the edit stays.
        devWarn('<DataGrid> onSaving threw; the edit stays open.');
        return;
      }
      if (!isThenable(result)) {
        settled();
        return;
      }
      const mine = session.current;
      pending.current = true;
      setSaving(true);
      held.current = new Map([[key, change]]);
      setChanges(held.current);
      result.then(
        () => {
          if (session.current === mine) settled();
        },
        () => {
          // The edit stays: the change is kept over the row, and the editors take the keys again.
          if (session.current !== mine) return;
          pending.current = false;
          setSaving(false);
        },
      );
    },
    [draft, end, rowOf],
  );

  const start = useCallback(
    (key: DataGridKey, columnId?: string): void => {
      const now = latest.current;
      if (!now.editing) return;
      const row = rowOf(key);
      if (row === undefined || !canUpdate(row, now.editing)) return;
      const begin = (): void => {
        if (rowOf(key) === undefined) return;
        const next = { key, focus: columnId ?? null };
        current.current = next;
        draft.set({});
        setTarget(next);
      };
      if (current.current === null) {
        begin();
        return;
      }
      if (Object.is(current.current.key, key)) return;
      // One row at a time: the row being edited is saved first, and stays when its save does not go through.
      save(begin);
    },
    [draft, rowOf, save],
  );

  // Writes the value of a column into the draft. `raw` says whether it is the value as the row holds it (a custom
  // editor's) or what a default editor holds, which `fromEditorValue` turns into the row's.
  const write = useCallback(
    (columnId: string, value: unknown, raw: boolean): void => {
      const now = latest.current;
      const edited = current.current;
      const typed = draft.get();
      if (!edited || typed === null || pending.current) return;
      const row = rowOf(edited.key);
      const column = now.resolved.find((one) => one.id === columnId);
      if (row === undefined || !column) return;
      const held = { ...row, ...typed };
      const converted = raw ? value : fromEditorValue(column, value, held);
      const given = column.column;
      const field = given.field;
      const compute = 'setValue' in given ? given.setValue : undefined;
      let next: Partial<TRow> | undefined;
      if (typeof field === 'string') {
        next = { ...typed, [field]: converted } as Partial<TRow>;
      } else if (typeof compute === 'function') {
        try {
          next = { ...typed, ...compute.call(given, held, converted) };
        } catch {
          devWarn('<DataGrid> a column setValue threw; the value is not set.');
        }
      }
      if (next) draft.set(next);
    },
    [draft, rowOf],
  );

  const setValue = useCallback(
    (columnId: string, value: unknown): void => write(columnId, value, false),
    [write],
  );
  const setRaw = useCallback(
    (columnId: string, value: unknown): void => write(columnId, value, true),
    [write],
  );

  const cancel = useCallback((): void => {
    if (current.current !== null) end();
  }, [end]);

  // The functions the parts call are the same for as long as the grid lives, so nothing that reads them draws
  // for their sake.
  const saveNow = useCallback((): void => save(), [save]);

  const keys = useMemo<EditKeyActions<TRow> | null>(
    () =>
      mode === null
        ? null
        : {
            target: () => current.current?.key ?? null,
            canStart: (row) => canUpdate(row, latest.current.editing ?? null),
            start,
            save: saveNow,
            cancel,
          },
    [mode, start, saveNow, cancel],
  );

  const context = useMemo<EditContextValue<TRow> | null>(
    () =>
      editing
        ? {
            config: editing,
            mode: editing.mode,
            size,
            draft,
            start,
            setValue,
            setRaw,
            save: saveNow,
            cancel,
          }
        : null,
    [editing, size, draft, start, setValue, setRaw, saveNow, cancel],
  );

  const view = useMemo<EditTarget | null>(
    () => (target ? { key: target.key, focus: target.focus, saving } : null),
    [target, saving],
  );

  const shown = useMemo(
    () => (changes.size === 0 ? null : applyChanges(data, changes, getKey)),
    [changes, data, getKey],
  );

  return { context, target: view, keys, shown, saving };
}
