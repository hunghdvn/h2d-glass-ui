import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { FlatDataRow } from '../engine/flatten';
import type { DataGridKey, DataGridLabels } from '../types';
import { useSelection } from './use-selection';

// The rows a choice is about are the saved ones: a new row has no box, is nobody's anchor and is in no range, nor in the
// scope of "select all" (spec phase 6 §6.3 "Thêm dòng"). The grid puts a new row at an end of its list, where no range
// can cross it, so a list with one in the middle is made here to hold the rule where it is kept.

interface Item {
  id: string;
}

const flat = (id: string, added = false): FlatDataRow<Item> => ({
  kind: 'data',
  key: id,
  row: { id },
  level: 1,
  groups: [],
  setsize: 0,
  posinset: 0,
  ...(added ? { added: true } : {}),
});

const ROWS = [flat('A'), flat('B'), flat('flg-new-1', true), flat('C'), flat('D')];
const LABELS = {
  announceSelected: (count: number) => `${count} chosen`,
} as unknown as DataGridLabels;

function selecting() {
  let keys: readonly DataGridKey[] = [];
  const view = renderHook(() =>
    useSelection<Item>({
      mode: 'multiple',
      allMode: 'page',
      keys,
      setKeys: (change) => {
        keys = change(keys) ?? keys;
        return keys;
      },
      pageRows: ROWS,
      orderedRows: ROWS,
      listRows: ROWS,
      labels: LABELS,
      announce: () => {},
    }),
  );
  return { actions: () => view.result.current.actions, keys: () => keys };
}

describe('useSelection and a new row', () => {
  it('leaves a new row out of the range between two saved rows that stand on either side of it', () => {
    const { actions, keys } = selecting();
    act(() => actions().press('A', false));
    act(() => actions().press('D', true));
    expect([...keys()].sort()).toEqual(['A', 'B', 'C', 'D']);
  });

  it('leaves a new row out of the rows that mod+A chooses and of the box in the title', () => {
    const { actions, keys } = selecting();
    act(() => actions().chooseAll());
    expect([...keys()].sort()).toEqual(['A', 'B', 'C', 'D']);
    act(() => actions().setAll(false));
    expect(keys()).toEqual([]);
  });
});
