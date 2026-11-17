import { describe, expect, it, vi } from 'vitest';
import { flattenRows } from './flatten';

describe('flattenRows', () => {
  const rows = [{ id: 'DH-1' }, { id: 'DH-2' }, { id: 'DH-3' }];

  it('makes one data row for each row, in order, with its place in the list', () => {
    const flat = flattenRows(rows, (row) => row.id);
    expect(flat).toEqual([
      { kind: 'data', key: 'DH-1', row: rows[0], index: 0 },
      { kind: 'data', key: 'DH-2', row: rows[1], index: 1 },
      { kind: 'data', key: 'DH-3', row: rows[2], index: 2 },
    ]);
    expect(flat[1]!.row).toBe(rows[1]);
  });

  it('gives getKey the row and its index, once each', () => {
    const getKey = vi.fn((_row: { id: string }, index: number) => index * 10);
    expect(flattenRows(rows, getKey).map((entry) => entry.key)).toEqual([0, 10, 20]);
    expect(getKey).toHaveBeenCalledTimes(3);
    expect(getKey).toHaveBeenNthCalledWith(2, rows[1], 1);
  });

  it('gives an empty list for no rows, and does not change its input', () => {
    expect(flattenRows([], () => 0)).toEqual([]);
    const copy = [...rows];
    flattenRows(rows, (row) => row.id);
    expect(rows).toEqual(copy);
  });
});
