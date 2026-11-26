import { useCallback, useMemo, useRef } from 'react';
import type { MutableRefObject, RefObject } from 'react';
import { devWarn } from '../../../internal/warn';
import { mergeChange, readSaveError, savingChanges } from '../engine/edit';
import type { PendingChange } from '../engine/edit';
import { isDataColumn } from '../engine/columns';
import type { ResolvedColumn } from '../engine/columns';
import type { DataGridKey, DataGridLabels, DataGridProps } from '../types';
import type { RowErrors, Started } from './use-editing';
import type { ExternalStore } from './use-external-store';

/** A commit of `cell` mode that waits to be sent: its own fields only, over the saved row it was made on. */
export interface Commit<TRow> {
  key: DataGridKey;
  /** The column of the cell the value came from; `null` for the whole of a new row. */
  column: ResolvedColumn<TRow> | null;
  data: Partial<TRow>;
  row: TRow;
  /** Whether it is a new row, sent as an `insert`. */
  insert?: true;
}

type Insert<TRow> = Extract<PendingChange<TRow>, { type: 'insert' }>;

/** What the queue reads of the values of the last commit of the grid. */
interface QueueNow<TRow> {
  onSaving: DataGridProps<TRow>['onSaving'];
  resolved: readonly ResolvedColumn<TRow>[];
  layoutColumns: readonly ResolvedColumn<TRow>[];
  labels: DataGridLabels;
  announce: (text: string) => void;
  tableRef: RefObject<HTMLTableElement | null>;
}

/** What the queue shares with the edit state: its refs, and the writers of what it shows. */
export interface CellQueueOptions<TRow> {
  latest: { readonly current: QueueNow<TRow> };
  /** Counts the edits: an answer that comes after the edit state was reset is not the one waited for. */
  session: MutableRefObject<number>;
  /** Whether a save is waiting, read by the next press and not by a render. */
  pending: MutableRefObject<boolean>;
  current: MutableRefObject<Started | null>;
  inserts: MutableRefObject<Map<DataGridKey, Insert<TRow>>>;
  draft: ExternalStore<Partial<TRow>>;
  /** Shows the changes held over the rows (`updates`; the new rows are added by the edit state). */
  publish(updates: ReadonlyMap<DataGridKey, PendingChange<TRow>>): void;
  setSaving(saving: boolean): void;
  setSaveError(message: string | null): void;
  setTarget(target: Started | null): void;
  setErrors(errors: ReadonlyMap<DataGridKey, RowErrors>): void;
}

/** The send queue of `cell` mode: what `use-editing.ts` calls. */
export interface CellQueue<TRow> {
  /** Puts a commit last in the queue; `pump()` sends it when its turn comes. */
  push(item: Commit<TRow>): void;
  /** Sends the first commit of the queue, and the next ones as each is answered, in order. */
  pump(): void;
  /** Shows the changes that wait to be sent, over the rows. */
  hold(): void;
  /** Whether the new row with this key is in the queue, being sent or waiting its turn. */
  holdsInsert(key: DataGridKey): boolean;
  /** The number of commits that are sent or wait. */
  size(): number;
  /** Calls `resolve` with whether every commit was sent without a refusal, when the queue has emptied. */
  wait(resolve: (ok: boolean) => void): void;
  /** Starts counting the refusals a `wait` reports. */
  startWaiting(): void;
  /** Drops what is queued and what was sent, and tells the waiters `false`: a reset of the edit state. */
  drop(): void;
}

const isThenable = (value: unknown): value is PromiseLike<void> =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { then?: unknown }).then === 'function';

/**
 * The commits of `cell` mode that wait their turn, the first of them being the one that is sent or pending, and
 * the way each is answered (spec phase 6 §6.3 "Chế độ `cell` khi Promise đang chờ"). It is kept apart from the
 * edit state so that its states (one send, a queue behind it, an answer, a refusal, a throw, a stale session) are
 * tested alone.
 */
export function useCellQueue<TRow>(options: CellQueueOptions<TRow>): CellQueue<TRow> {
  const { latest, session, pending, current, inserts, draft } = options;
  const { publish, setSaving, setSaveError, setTarget, setErrors } = options;
  // The commits that wait their turn, the first of them being the one that is sent or pending.
  const queue = useRef<Commit<TRow>[]>([]);
  // The row each key has after the commits that were sent and not refused: the next commit of the row is sent over
  // it, so its `row` holds what was sent before it. It lasts until the queue is empty.
  const sent = useRef<Map<DataGridKey, TRow>>(new Map());
  // Who waits for the commits to be sent (`saveChanges()`), and whether one of them was refused.
  const waiters = useRef<((ok: boolean) => void)[]>([]);
  const refusedSince = useRef(false);

  // The changes that wait to be sent, over the rows: what the grid shows while a save of `cell` mode is pending.
  const hold = useCallback((): void => {
    const next = new Map<DataGridKey, PendingChange<TRow>>();
    for (const item of queue.current) {
      if (item.insert) continue;
      const merged = mergeChange(next.get(item.key), {
        type: 'update',
        key: item.key,
        data: item.data,
        row: item.row,
      });
      if (merged) next.set(item.key, merged);
    }
    publish(next);
  }, [publish]);

  // A refused commit: the alert says why, and the value goes back into its cell with the error look and the words
  // of the error (the field the server named, else the alert's), to be sent again with `Enter` or dropped with
  // `Esc`. It takes the focus only if the focus is in the grid; a cell that is being edited meanwhile is not taken
  // from its editor, and the refused value is only in the alert then.
  const refuse = useCallback(
    (item: Commit<TRow>, reason: unknown): void => {
      const now = latest.current;
      refusedSince.current = true;
      queue.current.shift();
      hold();
      const { column } = item;
      // A new row that was refused stays, marked as a new row is, with the alert: it is sent again when the place
      // leaves it once more, or when another row is started.
      if (column === null) {
        const cells = now.layoutColumns.filter(isDataColumn);
        setSaveError(readSaveError(reason, item.key, cells, now.labels.saveFailed).message);
        return;
      }
      const failure = readSaveError(reason, item.key, [column], now.labels.saveFailed);
      setSaveError(failure.message);
      if (current.current !== null) return;
      const table = now.tableRef.current;
      const next: Started = {
        key: item.key,
        focus: column.id,
        column: column.id,
        take: table !== null && table.contains(document.activeElement),
        typed: null,
      };
      current.current = next;
      draft.set(item.data);
      setTarget(next);
      setErrors(
        new Map([
          [item.key, new Map([[column.id, failure.fields.get(column.id) ?? failure.message]])],
        ]),
      );
    },
    [latest, current, draft, hold, setSaveError, setTarget, setErrors],
  );

  const pump = useCallback(
    function run(): void {
      if (pending.current) return;
      const item = queue.current[0];
      if (!item) {
        sent.current = new Map();
        setSaving(false);
        const ok = !refusedSince.current;
        refusedSince.current = false;
        for (const waiter of waiters.current.splice(0)) waiter(ok);
        return;
      }
      const now = latest.current;
      // The row as the grid shows it now, but for this change: the saved row with the commits sent before it.
      const before = sent.current.get(item.key);
      const change: PendingChange<TRow> = item.insert
        ? { type: 'insert', key: String(item.key), data: item.data }
        : { type: 'update', key: item.key, data: item.data, row: before ?? item.row };
      const sending = savingChanges(new Map([[item.key, change]]), now.resolved);
      if (sending.length > 0 && change.type === 'update') {
        sent.current.set(item.key, { ...change.row, ...change.data } as TRow);
      }
      // A refused commit is not in the row of the next one.
      const unsend = (): void => {
        if (before === undefined) sent.current.delete(item.key);
        else sent.current.set(item.key, before);
      };
      const answered = (): void => {
        queue.current.shift();
        // A new row that was sent is no new row any more: the app brings it in `data`.
        if (item.insert) inserts.current.delete(item.key);
        hold();
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
    [latest, session, pending, inserts, hold, refuse, setSaving, setSaveError],
  );

  return useMemo(
    () => ({
      push: (item) => void queue.current.push(item),
      pump,
      hold,
      holdsInsert: (key) =>
        queue.current.some((item) => item.insert === true && Object.is(item.key, key)),
      size: () => queue.current.length,
      wait: (resolve) => void waiters.current.push(resolve),
      startWaiting: () => {
        refusedSince.current = false;
      },
      drop: () => {
        queue.current = [];
        for (const waiter of waiters.current.splice(0)) waiter(false);
        sent.current = new Map();
      },
    }),
    [pump, hold],
  );
}
