import { useCallback, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { devWarn } from '../../../internal/warn';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import {
  applyChanges,
  canDelete,
  canEdit,
  canUpdate,
  flipsOnPress,
  mergeChange,
  readSaveError,
  rowDiff,
  savingChanges,
} from '../engine/edit';
import type { PendingChange, ShownRows } from '../engine/edit';
import { editorKind, fromEditorValue, toEditorValue } from '../engine/editor-values';
import { hasRules, validateRow } from '../engine/validate';
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
  /** The columns the rows draw a cell for: the cells of the row being edited, which a save checks. */
  layoutColumns: readonly ResolvedColumn<TRow>[];
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
  /** In `cell` mode `text` is the character that started the edit, which the editor opens with. */
  start(key: DataGridKey, columnId?: string, text?: string): void;
  /** Saves the row being edited; in `cell` mode, commits the cell being edited. */
  save(): void;
  cancel(): void;
  /** Whether the grid edits one cell at a time (`cell` mode). */
  readonly cell: boolean;
  /** The id of the column of the cell being edited in `cell` mode; `null` when none is. */
  targetColumn(): string | null;
  /** Whether the cell of a column in a row can be edited. */
  canEditCell(row: TRow, column: ResolvedColumn<TRow>): boolean;
  /** Whether the editor of a column has a text field a typed character can open it with. */
  canType(column: ResolvedColumn<TRow>): boolean;
  /** Flips a boolean cell and commits it, with no editor opened (`Space`). */
  toggle(key: DataGridKey, columnId: string): void;
}

/** A row's messages by column id. */
export type RowErrors = ReadonlyMap<string, string>;

/** The row a delete waits for the answer of the dialog on. */
export interface DeleteAsk<TRow> {
  key: DataGridKey;
  row: TRow;
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
  /** The words of the alert of a save that was refused; `null` when there is none. */
  saveError: string | null;
  /** Takes the alert away. */
  dismissError(): void;
  /** The row the dialog that asks before a delete is about; `null` while it is closed. */
  confirm: DeleteAsk<TRow> | null;
  /** The dialog's answers: close it, or delete the row it asks about. */
  closeConfirm(): void;
  acceptDelete(): void;
}

type Changes<TRow> = ReadonlyMap<DataGridKey, PendingChange<TRow>>;

/** The edit that was started: the row, and in `cell` mode the one cell of it. */
interface Started {
  key: DataGridKey;
  focus: string | null;
  column: string | null;
  take: boolean;
  typed: string | null;
}

/** A commit of `cell` mode that waits to be sent: its own fields only, over the saved row it was made on. */
interface Commit<TRow> {
  key: DataGridKey;
  column: ResolvedColumn<TRow>;
  data: Partial<TRow>;
  row: TRow;
}
const NO_CHANGES: Changes<never> = new Map();
const NO_ERRORS: RowErrors = new Map();
const NO_FIELD_ERRORS: ReadonlyMap<DataGridKey, RowErrors> = new Map();

/** Asks the cell that holds the editor of a column to take the focus again; `n` makes each ask a new one. */
interface Refocus {
  column: string;
  n: number;
}

/**
 * The draft with `value` written into the field of a column (or the fields its `setValue` makes of it), over the
 * row as it stands with what was typed. `raw` says whether the value is as the row holds it (a custom editor's) or
 * what a default editor holds, which `fromEditorValue` turns into the row's. `undefined` when a throwing
 * `setValue` set nothing.
 */
function nextDraft<TRow>(
  column: ResolvedColumn<TRow>,
  value: unknown,
  raw: boolean,
  row: TRow,
  typed: Partial<TRow>,
): Partial<TRow> | undefined {
  const held = { ...row, ...typed };
  const converted = raw ? value : fromEditorValue(column, value, held);
  const given = column.column;
  const field = given.field;
  const compute = 'setValue' in given ? given.setValue : undefined;
  if (typeof field === 'string') return { ...typed, [field]: converted } as Partial<TRow>;
  if (typeof compute === 'function') {
    try {
      return { ...typed, ...compute.call(given, held, converted) };
    } catch {
      devWarn('<DataGrid> a column setValue threw; the value is not set.');
    }
  }
  return undefined;
}

const isThenable = (value: unknown): value is PromiseLike<void> =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { then?: unknown }).then === 'function';

/** Whether two `editing` values say the same: the mode, the functions (by identity) and the flags. */
export function sameEditing(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const left = a as Partial<DataGridEditing<unknown>>;
  const right = b as Partial<DataGridEditing<unknown>>;
  return (
    left.mode === right.mode &&
    Object.is(left.allowUpdating, right.allowUpdating) &&
    Object.is(left.allowDeleting, right.allowDeleting) &&
    left.confirmDelete === right.confirmDelete &&
    left.startEditAction === right.startEditAction
  );
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
  const {
    editing,
    onSaving,
    resolved,
    layoutColumns,
    keyed,
    data,
    getKey,
    labels,
    announce,
    tableRef,
    size,
  } = options;
  const [target, setTarget] = useState<Started | null>(null);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState<Changes<TRow>>(NO_CHANGES);
  const [draft] = useState<ExternalStore<Partial<TRow>>>(createExternalStore);
  // The messages of the row being edited, by column id: what a commit or a save found, and what a server said.
  const [errors, setErrors] = useState<ReadonlyMap<DataGridKey, RowErrors>>(NO_FIELD_ERRORS);
  const [refocus, setRefocus] = useState<Refocus | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<DeleteAsk<TRow> | null>(null);
  // Counts the edits: an answer that comes after another edit began, the mode changed or the grid went is
  // not the one waited for. `pending` is whether a save is waiting, read by the next press and not by a render.
  const session = useRef(0);
  const pending = useRef(false);
  // The changes the grid holds, as the last `setChanges` left them: the saved row of a key that has one, which
  // the list shows over (`keyed` holds the shown row).
  const held = useRef<Changes<TRow>>(NO_CHANGES);
  // What the functions below read: the values of the last commit, and the key of the row being edited, which
  // `start` and `end` write at once so that a press before the next commit sees the edit it just made.
  const latest = useRef({ editing, onSaving, resolved, layoutColumns, labels, announce, tableRef });
  const current = useRef<Started | null>(null);
  // The commits of `cell` mode that wait their turn, the first of them being the one that is sent or pending.
  const queue = useRef<Commit<TRow>[]>([]);
  // The row each key has after the commits of `cell` mode that were sent and not refused: the next commit of the row
  // is sent over it, so its `row` holds what was sent before it. It lasts until the queue is empty.
  const sent = useRef<Map<DataGridKey, TRow>>(new Map());
  // The dialog's row as the press that opened it left it, which an answer reads (never a render's closure).
  const asked = useRef<DeleteAsk<TRow> | null>(null);
  useWriteOnCommit(() => {
    latest.current = { editing, onSaving, resolved, layoutColumns, labels, announce, tableRef };
  });
  const mode = editing?.mode ?? null;

  const reset = useCallback((): void => {
    session.current += 1;
    pending.current = false;
    queue.current = [];
    sent.current = new Map();
    current.current = null;
    draft.set(null);
    setTarget(null);
    setSaving(false);
    held.current = NO_CHANGES;
    setChanges(NO_CHANGES);
    setErrors(NO_FIELD_ERRORS);
    setRefocus(null);
    setSaveError(null);
  }, [draft]);

  const closeConfirm = useCallback((): void => {
    asked.current = null;
    setConfirm(null);
  }, []);

  // The focus goes to the cell of the editor that had it, before the editors go: never to `<body>`.
  const focusCell = useCallback((): void => {
    const table = latest.current.tableRef.current;
    const active = document.activeElement;
    if (table && active && table.contains(active)) {
      const cell = ownCell(active, table);
      if (cell && (cell.hasAttribute('data-editing') || cell.closest('tr[data-editing]'))) {
        focusInto(cell, cell);
      }
    }
  }, []);

  const end = useCallback((): void => {
    focusCell();
    reset();
  }, [focusCell, reset]);

  // `cell` mode ends the edit of its cell and nothing else: what waits to be sent, and a pending save, go on.
  const endCell = useCallback((): void => {
    current.current = null;
    draft.set(null);
    setTarget(null);
    setErrors(NO_FIELD_ERRORS);
    setRefocus(null);
  }, [draft]);

  // A mode that changes, editing that turns off and the grid going each end the edit and drop what was typed;
  // nothing is sent, and a save that is pending is no longer waited for.
  useIsoLayoutEffect(() => {
    reset();
    return () => {
      session.current += 1;
    };
  }, [mode, reset]);

  // The dialog that asks before a delete goes for good with what it belongs to: editing, its mode, and a grid
  // that cannot delete or does not ask any more (a function of `allowDeleting` is a change of its own only
  // when it appears or goes).
  const deletes = editing?.allowDeleting !== undefined && editing.allowDeleting !== false;
  const asks = editing?.confirmDelete !== false;
  useIsoLayoutEffect(() => closeConfirm(), [mode, deletes, asks, closeConfirm]);

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

  // The row as it is shown: the saved one with the changes that wait to be sent over it. A commit of `cell` mode
  // compares with this, so a value put back to what the cell shows is no change even while a save is pending.
  const shownOf = useCallback(
    (key: DataGridKey): TRow | undefined => {
      const change = held.current.get(key);
      return change?.type === 'update'
        ? ({ ...change.row, ...change.data } as TRow)
        : keyed.current.find((flat) => Object.is(flat.key, key))?.row;
    },
    [keyed],
  );

  /** The cells of a row that its editors are in: what a save checks. */
  const editableOf = useCallback((row: TRow): readonly ResolvedColumn<TRow>[] => {
    const { editing: config, layoutColumns: drawn } = latest.current;
    return drawn.filter((column) => canEdit(column, row, config ?? null));
  }, []);

  // The changes that wait to be sent, over the rows: what the grid shows while a save of `cell` mode is pending.
  const holdQueue = useCallback((): void => {
    const next = new Map<DataGridKey, PendingChange<TRow>>();
    for (const item of queue.current) {
      const merged = mergeChange(next.get(item.key), {
        type: 'update',
        key: item.key,
        data: item.data,
        row: item.row,
      });
      if (merged) next.set(item.key, merged);
    }
    held.current = next;
    setChanges(next.size === 0 ? NO_CHANGES : next);
  }, []);

  // A refused commit of `cell` mode: the alert says why, and the value goes back into its cell with the error
  // look and the words of the error (the field the server named, else the alert's), to be sent again with
  // `Enter` or dropped with `Esc`. It takes the focus only if the focus is in the grid; a cell that is being
  // edited meanwhile is not taken from its editor, and the refused value is only in the alert then.
  const refuse = useCallback(
    (item: Commit<TRow>, reason: unknown): void => {
      const now = latest.current;
      queue.current.shift();
      holdQueue();
      const failure = readSaveError(reason, item.key, [item.column], now.labels.saveFailed);
      setSaveError(failure.message);
      if (current.current !== null) return;
      const table = now.tableRef.current;
      const next: Started = {
        key: item.key,
        focus: item.column.id,
        column: item.column.id,
        take: table !== null && table.contains(document.activeElement),
        typed: null,
      };
      current.current = next;
      draft.set(item.data);
      setTarget(next);
      setErrors(
        new Map([
          [
            item.key,
            new Map([[item.column.id, failure.fields.get(item.column.id) ?? failure.message]]),
          ],
        ]),
      );
    },
    [draft, holdQueue],
  );

  // Sends the first commit of the queue, and the next ones as each is answered, in order. A throw is a reject.
  const pump = useCallback(
    function run(): void {
      if (pending.current) return;
      const item = queue.current[0];
      if (!item) {
        sent.current = new Map();
        setSaving(false);
        return;
      }
      const now = latest.current;
      // The row as the grid shows it now, but for this change: the saved row with the commits sent before it.
      const before = sent.current.get(item.key);
      const change: PendingChange<TRow> = {
        type: 'update',
        key: item.key,
        data: item.data,
        row: before ?? item.row,
      };
      const sending = savingChanges(new Map([[item.key, change]]), now.resolved);
      if (sending.length > 0) {
        sent.current.set(item.key, { ...change.row, ...change.data } as TRow);
      }
      // A refused commit is not in the row of the next one.
      const unsend = (): void => {
        if (before === undefined) sent.current.delete(item.key);
        else sent.current.set(item.key, before);
      };
      const answered = (): void => {
        queue.current.shift();
        holdQueue();
        run();
      };
      setSaveError(null);
      if (sending.length === 0) {
        answered();
        return;
      }
      let result: unknown;
      try {
        result = now.onSaving!(sending);
      } catch {
        devWarn('<DataGrid> onSaving threw; nothing was saved.');
        unsend();
        refuse(item, undefined);
        run();
        return;
      }
      if (!isThenable(result)) {
        now.announce(now.labels.announceSaved);
        answered();
        return;
      }
      const mine = session.current;
      pending.current = true;
      setSaving(true);
      result.then(
        () => {
          if (session.current !== mine) return;
          pending.current = false;
          now.announce(now.labels.announceSaved);
          answered();
        },
        (reason: unknown) => {
          if (session.current !== mine) return;
          pending.current = false;
          unsend();
          refuse(item, reason);
          run();
        },
      );
    },
    [holdQueue, refuse],
  );

  // Sends one change to `onSaving`, a row's update or a remove, and calls `done` when it has gone through: at
  // once for an answer that is no Promise, else when it resolves. A refusal (a reject, or a throw) keeps what is
  // there and says why: the words of the alert, and the cells a server marked. The alert of an earlier save goes.
  const send = useCallback(
    (
      change: PendingChange<TRow>,
      cells: readonly ResolvedColumn<TRow>[],
      done: () => void,
    ): void => {
      const now = latest.current;
      setSaveError(null);
      const refused = (reason: unknown): void => {
        const failure = readSaveError(reason, change.key, cells, now.labels.saveFailed);
        setSaveError(failure.message);
        if (failure.fields.size > 0) setErrors(new Map([[change.key, failure.fields]]));
      };
      let result: unknown;
      try {
        result = now.onSaving!(savingChanges(new Map([[change.key, change]]), now.resolved));
      } catch {
        // A throw is a reject: what is there stays.
        devWarn('<DataGrid> onSaving threw; nothing was saved.');
        refused(undefined);
        return;
      }
      if (!isThenable(result)) {
        done();
        return;
      }
      const mine = session.current;
      pending.current = true;
      setSaving(true);
      if (change.type === 'update') {
        held.current = new Map([[change.key, change]]);
        setChanges(held.current);
      }
      result.then(
        () => {
          if (session.current === mine) done();
        },
        (reason: unknown) => {
          // The edit stays: the change is kept over the row, and the editors take the keys again.
          if (session.current !== mine) return;
          pending.current = false;
          setSaving(false);
          refused(reason);
          if (queue.current.length > 0) pump();
        },
      );
    },
    [pump],
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
      // Every cell of the row that can be edited is checked, the ones nobody touched too. A row with a field
      // that fails is not sent: the focus goes to the first of them, and the count of fields is announced.
      const cells = editableOf(row);
      const found = validateRow({ ...row, ...typed }, cells, now.labels);
      if (found.size > 0) {
        setErrors(new Map([[key, found]]));
        const first = cells.find((column) => found.has(column.id))!;
        setRefocus((previous) => ({ column: first.id, n: (previous?.n ?? 0) + 1 }));
        now.announce(now.labels.announceErrors(found.size));
        return;
      }
      setErrors(NO_FIELD_ERRORS);
      const change: PendingChange<TRow> = { type: 'update', key, data: diff, row };
      send(change, cells, () => {
        now.announce(now.labels.announceSaved);
        end();
        after?.();
      });
    },
    [draft, end, rowOf, editableOf, send],
  );

  // Puts a commit of `cell` mode in the queue: the cell's own fields only, compared with the row as it is shown.
  // A value equal to it sends nothing; the rules of the column run first, and a value that fails them is not
  // queued (`false`): with `show` the cell is marked and its editor takes the focus back.
  const submit = useCallback(
    (
      key: DataGridKey,
      column: ResolvedColumn<TRow>,
      typed: Partial<TRow>,
      show: boolean,
    ): boolean => {
      const now = latest.current;
      const base = shownOf(key);
      const saved = rowOf(key);
      if (base === undefined || saved === undefined || typeof now.onSaving !== 'function') {
        return true;
      }
      const diff = rowDiff(base, typed, now.resolved);
      if (Object.keys(diff).length === 0) return true;
      const found = validateRow({ ...base, ...typed }, [column], now.labels);
      if (found.size > 0) {
        if (show) {
          setErrors(new Map([[key, found]]));
          setRefocus((previous) => ({ column: column.id, n: (previous?.n ?? 0) + 1 }));
        }
        now.announce(now.labels.announceErrors(found.size));
        return false;
      }
      queue.current.push({ key, column, data: diff, row: saved });
      holdQueue();
      pump();
      return true;
    },
    [shownOf, rowOf, holdQueue, pump],
  );

  // Commits the cell being edited (`cell` mode): the editor closes and the focus is on its cell, then `after`
  // runs (the next cell to edit). A value that fails its rules keeps the editor open. The cell is let go of
  // before the focus moves, so the editor losing the focus finds no edit to commit a second time.
  const commitCell = useCallback(
    (after?: () => void): void => {
      const edited = current.current;
      if (!edited || edited.column === null) return;
      const column = latest.current.layoutColumns.find((one) => one.id === edited.column);
      if (column && !submit(edited.key, column, draft.get() ?? {}, true)) return;
      current.current = null;
      focusCell();
      endCell();
      after?.();
    },
    [draft, submit, focusCell, endCell],
  );

  // Settles one field of the row being edited, as its editor lets go of it: the rules of its column run, and its
  // mark is made or taken off. A column with no rule has nothing to say, so what a server said of it stays.
  const commit = useCallback(
    (columnId: string): void => {
      const now = latest.current;
      const edited = current.current;
      if (!edited) return;
      // In `cell` mode the editor letting go of its field is the commit, which sends it.
      if (edited.column !== null) {
        if (edited.column === columnId) commitCell();
        return;
      }
      if (pending.current) return;
      const column = now.layoutColumns.find((one) => one.id === columnId);
      const row = rowOf(edited.key);
      if (!column || row === undefined || !hasRules(column)) return;
      const held = { ...row, ...draft.get() };
      const message = validateRow(held, [column], now.labels).get(columnId) ?? null;
      setErrors((previous) => {
        const mine = previous.get(edited.key);
        if ((mine?.get(columnId) ?? null) === message) return previous;
        const next = new Map(mine);
        if (message === null) next.delete(columnId);
        else next.set(columnId, message);
        return next.size === 0 ? NO_FIELD_ERRORS : new Map([[edited.key, next]]);
      });
    },
    [draft, rowOf, commitCell],
  );

  // Sends the delete of a row: the dialog has been answered, or none is asked. The table is busy while a Promise
  // is pending, and the dialog is not: it is closed already.
  const sendRemove = useCallback(
    (key: DataGridKey, row: TRow): void => {
      const now = latest.current;
      if (!now.editing || pending.current || typeof now.onSaving !== 'function') return;
      if (!canDelete(row, now.editing)) return;
      send({ type: 'remove', key, row }, [], () => {
        pending.current = false;
        setSaving(false);
        now.announce(now.labels.announceRowDeleted);
        if (queue.current.length > 0) pump();
      });
    },
    [send, pump],
  );

  const remove = useCallback(
    (key: DataGridKey): void => {
      const now = latest.current;
      const row = rowOf(key);
      if (!now.editing || pending.current || row === undefined || !canDelete(row, now.editing)) {
        return;
      }
      if (now.editing.confirmDelete === false) {
        sendRemove(key, row);
        return;
      }
      asked.current = { key, row };
      setConfirm(asked.current);
    },
    [rowOf, sendRemove],
  );

  const acceptDelete = useCallback((): void => {
    const ask = asked.current;
    closeConfirm();
    if (ask) sendRemove(ask.key, ask.row);
  }, [closeConfirm, sendRemove]);

  const dismissError = useCallback((): void => setSaveError(null), []);

  // Starts the edit of one cell (`cell` mode): the cell being edited is committed first, and stays when its value
  // fails its rules. `text` is the character that started it, which the editor opens with.
  const startCell = useCallback(
    (key: DataGridKey, columnId: string, text: string | undefined): void => {
      const now = latest.current;
      const row = shownOf(key);
      const column = now.layoutColumns.find((one) => one.id === columnId);
      if (!now.editing || row === undefined || !column || !canEdit(column, row, now.editing))
        return;
      const begin = (): void => {
        if (shownOf(key) === undefined) return;
        const next: Started = {
          key,
          focus: columnId,
          column: columnId,
          take: true,
          typed: text ?? null,
        };
        current.current = next;
        draft.set({});
        setErrors(NO_FIELD_ERRORS);
        setRefocus(null);
        setTarget(next);
      };
      const here = current.current;
      if (here === null) begin();
      else if (!Object.is(here.key, key) || here.column !== columnId) commitCell(begin);
    },
    [draft, shownOf, commitCell],
  );

  // Flips a boolean cell and sends it, with no editor opened; a cell being edited is committed first.
  const toggle = useCallback(
    (key: DataGridKey, columnId: string): void => {
      const now = latest.current;
      const row = shownOf(key);
      const column = now.layoutColumns.find((one) => one.id === columnId);
      if (!now.editing || row === undefined || !column || !canEdit(column, row, now.editing))
        return;
      if (!flipsOnPress(column)) return;
      const flip = (): void => {
        const base = shownOf(key);
        if (base === undefined) return;
        const next = nextDraft(column, toEditorValue(column, base) !== true, false, base, {});
        if (next) submit(key, column, next, false);
      };
      if (current.current === null) flip();
      else commitCell(flip);
    },
    [shownOf, submit, commitCell],
  );

  const start = useCallback(
    (key: DataGridKey, columnId?: string, text?: string): void => {
      const now = latest.current;
      if (!now.editing) return;
      if (now.editing.mode === 'cell') {
        if (columnId !== undefined) startCell(key, columnId, text);
        return;
      }
      const row = rowOf(key);
      if (row === undefined || !canUpdate(row, now.editing)) return;
      const begin = (): void => {
        if (rowOf(key) === undefined) return;
        const next: Started = {
          key,
          focus: columnId ?? null,
          column: null,
          take: true,
          typed: null,
        };
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
    [draft, rowOf, save, startCell],
  );

  // A press on a cell (`cell` mode): a plain boolean is flipped and committed, as `Space` does, with no editor
  // opened first; any other cell opens its editor.
  const press = useCallback(
    (key: DataGridKey, columnId: string): void => {
      const column = latest.current.layoutColumns.find((one) => one.id === columnId);
      if (column && flipsOnPress(column)) toggle(key, columnId);
      else start(key, columnId);
    },
    [toggle, start],
  );

  // Writes the value of a column into the draft. `raw` says whether it is the value as the row holds it (a custom
  // editor's) or what a default editor holds, which `fromEditorValue` turns into the row's.
  const write = useCallback(
    (columnId: string, value: unknown, raw: boolean): void => {
      const now = latest.current;
      const edited = current.current;
      const typed = draft.get();
      // A save that is pending locks the editors of a row; the cell being edited in `cell` mode is not one of them.
      if (!edited || typed === null || (pending.current && edited.column === null)) return;
      const row = edited.column === null ? rowOf(edited.key) : shownOf(edited.key);
      const column = now.resolved.find((one) => one.id === columnId);
      if (row === undefined || !column) return;
      const next = nextDraft(column, value, raw, row, typed);
      if (next) draft.set(next);
    },
    [draft, rowOf, shownOf],
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
    const edited = current.current;
    if (edited === null) return;
    if (edited.column === null) {
      end();
      return;
    }
    // A cell gives its value up and nothing else: the queue and a pending save go on. The alert of a refused value
    // goes with it, which `Esc` drops. The edit is let go of before the focus moves, as a commit does.
    current.current = null;
    focusCell();
    endCell();
    setSaveError(null);
  }, [end, focusCell, endCell]);

  // The functions the parts call are the same for as long as the grid lives, so nothing that reads them draws
  // for their sake.
  const saveNow = useCallback((): void => {
    if (current.current?.column != null) commitCell();
    else save();
  }, [save, commitCell]);

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
            cell: mode === 'cell',
            targetColumn: () => current.current?.column ?? null,
            canEditCell: (row, column) => canEdit(column, row, latest.current.editing ?? null),
            canType: (column) => {
              const kind = typeof column.column.editor === 'function' ? null : editorKind(column);
              return (
                kind === 'string' || kind === 'number' || kind === 'date' || kind === 'combobox'
              );
            },
            toggle,
          },
    [mode, start, saveNow, cancel, toggle],
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
            press,
            setValue,
            setRaw,
            commit,
            save: saveNow,
            cancel,
            remove,
          }
        : null,
    [editing, size, draft, start, press, setValue, setRaw, commit, saveNow, cancel, remove],
  );

  const view = useMemo<EditTarget | null>(
    () =>
      target
        ? {
            key: target.key,
            focus: target.focus,
            column: target.column,
            take: target.take,
            typed: target.typed,
            // A cell is edited while a save is pending, which only locks the editors of a row.
            saving: saving && target.column === null,
            errors: errors.get(target.key) ?? NO_ERRORS,
            refocus,
          }
        : null,
    [target, saving, errors, refocus],
  );

  const shown = useMemo(
    () => (changes.size === 0 ? null : applyChanges(data, changes, getKey)),
    [changes, data, getKey],
  );

  return {
    context,
    target: view,
    keys,
    shown,
    saving,
    saveError,
    dismissError,
    confirm,
    closeConfirm,
    acceptDelete,
  };
}
