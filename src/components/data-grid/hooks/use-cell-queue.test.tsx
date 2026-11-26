import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../../internal/warn';
import { resolveColumns } from '../engine/columns';
import { DEFAULT_LABELS } from '../labels';
import type { DataGridChange } from '../types';
import { useCellQueue } from './use-cell-queue';
import type { Commit } from './use-cell-queue';
import { createExternalStore } from './use-external-store';
import type { Started } from './use-editing';

// The send queue of `cell` mode on its own (spec phase 6 §6.3 "Chế độ `cell` khi Promise đang chờ"): the grid's
// refs and writers are spies, so each state of the queue is read from what it called.

interface Order {
  id: string;
  name: string;
  qty: number;
}

const COLUMNS = resolveColumns<Order>(
  [{ field: 'id' }, { field: 'name' }, { field: 'qty', dataType: 'number' }],
  {
    locale: 'en-US',
    timeZone: 'UTC',
    yes: 'Yes',
    no: 'No',
    allowSorting: true,
    allowResizing: true,
    allowReordering: true,
    allowPinning: true,
    allowHiding: true,
    allowFiltering: true,
    allowHeaderFiltering: true,
    allowGrouping: true,
  },
);
const NAME = COLUMNS[1]!;
const ONE: Order = { id: 'a', name: 'An', qty: 1 };
const TWO: Order = { id: 'b', name: 'Bình', qty: 2 };

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

const commit = (row: Order, name: string): Commit<Order> => ({
  key: row.id,
  column: NAME,
  data: { name },
  row,
});

function setup(onSaving: (changes: DataGridChange<Order>[]) => unknown) {
  const spies = {
    publish: vi.fn(),
    setSaving: vi.fn(),
    setSaveError: vi.fn(),
    setTarget: vi.fn(),
    setErrors: vi.fn(),
    markFault: vi.fn(),
    announce: vi.fn(),
  };
  const session = { current: 0 };
  const pending = { current: false };
  const current: { current: Started | null } = { current: null };
  const draft = createExternalStore<Partial<Order>>();
  const latest = {
    current: {
      onSaving: onSaving as never,
      resolved: COLUMNS,
      layoutColumns: COLUMNS,
      labels: DEFAULT_LABELS,
      announce: spies.announce,
      tableRef: { current: null },
      data: [ONE, TWO],
      getKey: (row: Order) => row.id,
    },
  };
  const hook = renderHook(() =>
    useCellQueue<Order>({
      latest,
      session,
      pending,
      current,
      inserts: { current: new Map() },
      draft,
      ...spies,
    }),
  );
  return { queue: hook.result.current, spies, session, pending, current, draft, latest };
}

describe('the cell queue', () => {
  it('sends one commit at once, with the row it was made on, and is busy until the answer', async () => {
    const answer = deferred();
    const onSaving = vi.fn<(changes: DataGridChange<Order>[]) => Promise<void>>(
      () => answer.promise,
    );
    const { queue, pending, spies } = setup(onSaving);
    queue.push(commit(ONE, 'Hoa'));
    queue.pump();
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(onSaving.mock.calls[0]![0]).toEqual([
      { type: 'update', key: 'a', data: { name: 'Hoa' }, row: ONE },
    ]);
    expect(pending.current).toBe(true);
    expect(spies.setSaving).toHaveBeenLastCalledWith(true);
    await act(async () => answer.resolve());
    expect(pending.current).toBe(false);
    expect(queue.size()).toBe(0);
    expect(spies.announce).toHaveBeenCalledWith(DEFAULT_LABELS.announceSaved);
    expect(spies.setSaving).toHaveBeenLastCalledWith(false);
  });

  it('queues a second commit behind the first and sends it when the first resolves', async () => {
    const first = deferred();
    const second = deferred();
    const onSaving = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { queue } = setup(onSaving);
    queue.push(commit(ONE, 'Hoa'));
    queue.pump();
    queue.push(commit(TWO, 'Lan'));
    queue.pump();
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(queue.size()).toBe(2);
    await act(async () => first.resolve());
    expect(onSaving).toHaveBeenCalledTimes(2);
    expect(onSaving.mock.calls[1]![0]).toMatchObject([{ key: 'b', data: { name: 'Lan' } }]);
    await act(async () => second.resolve());
    expect(queue.size()).toBe(0);
  });

  it('on a reject says why, takes the commit out, goes on with the next and tells a waiter `false`', async () => {
    const first = deferred();
    const onSaving = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(undefined);
    const { queue, spies } = setup(onSaving);
    queue.push(commit(ONE, 'Hoa'));
    queue.pump();
    queue.push(commit(TWO, 'Lan'));
    queue.pump();
    const waiter = vi.fn();
    queue.wait(waiter);
    await act(async () => first.reject({ message: 'Refused' }));
    expect(spies.setSaveError).toHaveBeenCalledWith('Refused');
    expect(onSaving).toHaveBeenCalledTimes(2);
    expect(queue.size()).toBe(0);
    expect(waiter).toHaveBeenCalledWith(false);
  });

  it('takes a throw of onSaving for a refusal, and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    resetDevWarnings();
    const onSaving = vi.fn(() => {
      throw new Error('boom');
    });
    const { queue, spies, pending } = setup(onSaving);
    queue.push(commit(ONE, 'Hoa'));
    queue.pump();
    expect(pending.current).toBe(false);
    expect(queue.size()).toBe(0);
    expect(spies.setSaveError).toHaveBeenLastCalledWith(DEFAULT_LABELS.saveFailed);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('takes an answer that is no Promise for a save that went through, at once', () => {
    const onSaving = vi.fn();
    const { queue, spies, pending } = setup(onSaving);
    queue.push(commit(ONE, 'Hoa'));
    queue.pump();
    expect(pending.current).toBe(false);
    expect(queue.size()).toBe(0);
    expect(spies.announce).toHaveBeenCalledWith(DEFAULT_LABELS.announceSaved);
  });

  it('ignores the answer of a session that is over, and drop() tells the waiters `false`', async () => {
    const answer = deferred();
    const onSaving = vi.fn(() => answer.promise);
    const { queue, session, spies } = setup(onSaving);
    queue.push(commit(ONE, 'Hoa'));
    queue.pump();
    const waiter = vi.fn();
    queue.wait(waiter);
    session.current += 1;
    queue.drop();
    expect(waiter).toHaveBeenCalledWith(false);
    spies.announce.mockClear();
    await act(async () => answer.resolve());
    expect(spies.announce).not.toHaveBeenCalled();
    expect(queue.size()).toBe(0);
  });

  it('tells a waiter `true` when the queue empties with no refusal', async () => {
    const answer = deferred();
    const { queue } = setup(() => answer.promise);
    queue.push(commit(ONE, 'Hoa'));
    queue.pump();
    const waiter = vi.fn();
    queue.startWaiting();
    queue.wait(waiter);
    await act(async () => answer.resolve());
    expect(waiter).toHaveBeenCalledWith(true);
  });

  it('puts a refused value back in the editor of its cell when no other cell is edited', async () => {
    const answer = deferred();
    const { queue, spies, current, draft } = setup(() => answer.promise);
    queue.push(commit(ONE, 'Hoa'));
    queue.pump();
    await act(async () => answer.reject({ message: 'Refused' }));
    expect(current.current).toMatchObject({ key: 'a', column: 'name' });
    expect(draft.get()).toEqual({ name: 'Hoa' });
    expect(spies.markFault).not.toHaveBeenCalled();
    expect(queue.isRefused('a', 'name')).toBe(true);
    expect(queue.claim('a', 'name')).toBeNull();
  });

  it('holds it over its row, with the fault mark, when another cell is being edited', async () => {
    const answer = deferred();
    const { queue, spies, current } = setup(() => answer.promise);
    current.current = { key: 'b', focus: 'name', column: 'name', take: true, typed: null };
    queue.push(commit(ONE, 'Hoa'));
    queue.pump();
    await act(async () => answer.reject({ message: 'Refused' }));
    expect(current.current).toMatchObject({ key: 'b' });
    expect(spies.markFault).toHaveBeenCalledWith('a', 'name', 'Refused');
    expect(spies.setSaveError).toHaveBeenLastCalledWith('Refused');
    // The held change is over its row until the cell takes it back, and then it is no more.
    const held = spies.publish.mock.lastCall![0] as Map<string, { data: object }>;
    expect(held.get('a')!.data).toEqual({ name: 'Hoa' });
    expect(queue.claim('a', 'name')).toMatchObject({ message: 'Refused', item: { key: 'a' } });
    expect((spies.publish.mock.lastCall![0] as Map<string, unknown>).size).toBe(0);
    expect(queue.claim('a', 'name')).toBeNull();
  });

  it('leaves the alert alone when the queue goes on by itself', async () => {
    const first = deferred();
    const onSaving = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(undefined);
    const { queue, spies } = setup(onSaving);
    queue.push(commit(ONE, 'Hoa'));
    queue.pump();
    queue.push(commit(TWO, 'Lan'));
    await act(async () => first.reject({ message: 'Refused' }));
    expect(onSaving).toHaveBeenCalledTimes(2);
    expect(spies.setSaveError).toHaveBeenCalledTimes(1);
    expect(spies.setSaveError).toHaveBeenCalledWith('Refused');
  });
});
