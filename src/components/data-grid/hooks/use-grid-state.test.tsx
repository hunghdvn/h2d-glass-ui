import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DataGridColumnLayout, DataGridFilter, DataGridState } from '../types';
import { useGridState } from './use-grid-state';
import type { GridStateOptions } from './use-grid-state';

// The layout of the columns is a controllable triple like the others: the setter calls
// `onColumnLayoutChange` and then `onStateChange` with the shown state (spec phase 6 §6.1). Nothing
// of the grid asks for a layout yet, so it is the hook that is tested.

const layout = (parts: Partial<DataGridColumnLayout> = {}): DataGridColumnLayout => ({
  order: ['a', 'b', 'c'],
  widths: {},
  hidden: [],
  pinned: {},
  ...parts,
});

const SHOWN: DataGridState = {
  sort: [],
  filter: {},
  page: { index: 0, size: 20 },
  selectedKeys: [],
  columnLayout: layout(),
};

function options(extra: Partial<GridStateOptions> = {}): GridStateOptions {
  return {
    sort: undefined,
    defaultSort: undefined,
    onSortChange: undefined,
    filter: undefined,
    defaultFilter: undefined,
    onFilterChange: undefined,
    page: undefined,
    defaultPage: { index: 0, size: 20 },
    onPageChange: undefined,
    selectedKeys: undefined,
    defaultSelectedKeys: undefined,
    onSelectedKeysChange: undefined,
    columnLayout: undefined,
    defaultColumnLayout: layout(),
    onColumnLayoutChange: undefined,
    onStateChange: undefined,
    shown: { current: SHOWN },
    ...extra,
  };
}

describe('the layout of the columns in useGridState', () => {
  it('starts from the default layout, and holds the one that is asked for while uncontrolled', () => {
    const { result } = renderHook(() => useGridState(options()));
    expect(result.current.state.columnLayout).toEqual(layout());
    const next = layout({ order: ['c', 'b', 'a'] });
    act(() => result.current.setColumnLayout(next));
    expect(result.current.state.columnLayout).toBe(next);
  });

  it('reports a layout to onColumnLayoutChange and then to onStateChange, with the shown state', () => {
    const calls: string[] = [];
    const onColumnLayoutChange = vi.fn(() => void calls.push('layout'));
    const onStateChange = vi.fn(() => void calls.push('state'));
    const { result } = renderHook(() =>
      useGridState(options({ onColumnLayoutChange, onStateChange })),
    );
    const next = layout({ hidden: ['b'] });
    act(() => result.current.setColumnLayout(next));
    expect(calls).toEqual(['layout', 'state']);
    expect(onColumnLayoutChange).toHaveBeenCalledExactlyOnceWith(next);
    expect(onStateChange).toHaveBeenCalledExactlyOnceWith(
      { ...SHOWN, columnLayout: next },
      'columnLayout',
    );
  });

  it('sends the state the grid shows, with the layout asked for on top', () => {
    const onStateChange = vi.fn();
    const shown = {
      current: {
        ...SHOWN,
        sort: [{ field: 'a', direction: 'asc' as const }],
        page: { index: 3, size: 5 },
      },
    };
    const { result } = renderHook(() => useGridState(options({ onStateChange, shown })));
    act(() => result.current.setColumnLayout(layout({ order: ['b', 'a', 'c'] })));
    const [state] = onStateChange.mock.calls[0] as [DataGridState];
    expect(state.sort).toEqual([{ field: 'a', direction: 'asc' }]);
    expect(state.page).toEqual({ index: 3, size: 5 });
    expect(state.columnLayout.order).toEqual(['b', 'a', 'c']);
  });

  it('reports nothing for a layout that says what the grid shows already, though it is a new object', () => {
    const onColumnLayoutChange = vi.fn();
    const onStateChange = vi.fn();
    const { result } = renderHook(() =>
      useGridState(options({ onColumnLayoutChange, onStateChange })),
    );
    act(() => result.current.setColumnLayout(layout()));
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it('reports each of two requests made before a render, the second against the first', () => {
    const onColumnLayoutChange = vi.fn();
    const onStateChange = vi.fn();
    const { result } = renderHook(() =>
      useGridState(options({ onColumnLayoutChange, onStateChange })),
    );
    const first = layout({ hidden: ['a'] });
    const second = layout({ hidden: ['a', 'b'] });
    act(() => {
      result.current.setColumnLayout(first);
      result.current.setColumnLayout(first);
      result.current.setColumnLayout(second);
    });
    expect(onColumnLayoutChange.mock.calls).toEqual([[first], [second]]);
    expect(onStateChange).toHaveBeenCalledTimes(2);
    expect(result.current.state.columnLayout).toBe(second);
  });

  it('keeps a controlled layout the parent does not take, and still reports the request', () => {
    const onColumnLayoutChange = vi.fn();
    const onStateChange = vi.fn();
    const held = layout();
    const { result } = renderHook(() =>
      useGridState(options({ columnLayout: held, onColumnLayoutChange, onStateChange })),
    );
    const next = layout({ order: ['b', 'a', 'c'] });
    act(() => result.current.setColumnLayout(next));
    expect(onColumnLayoutChange).toHaveBeenCalledExactlyOnceWith(next);
    expect(onStateChange).toHaveBeenCalledExactlyOnceWith(
      { ...SHOWN, columnLayout: next },
      'columnLayout',
    );
    expect(result.current.state.columnLayout).toBe(held);
    // The parent that keeps its layout is asked again for the same request.
    act(() => result.current.setColumnLayout(next));
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(2);
  });

  it('follows a controlled layout the parent takes, and calls nothing for it', () => {
    const onColumnLayoutChange = vi.fn();
    const onStateChange = vi.fn();
    const { result, rerender } = renderHook(
      (columnLayout: DataGridColumnLayout) =>
        useGridState(options({ columnLayout, onColumnLayoutChange, onStateChange })),
      { initialProps: layout() },
    );
    const next = layout({ order: ['c', 'a', 'b'] });
    rerender(next);
    expect(result.current.state.columnLayout).toBe(next);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it('leaves the other parts of the state as they are', () => {
    const { result } = renderHook(() =>
      useGridState(options({ defaultSort: [{ field: 'b', direction: 'desc' }] })),
    );
    act(() => result.current.setColumnLayout(layout({ order: ['c', 'b', 'a'] })));
    expect(result.current.state.sort).toEqual([{ field: 'b', direction: 'desc' }]);
    expect(result.current.state.page).toEqual({ index: 0, size: 20 });
  });
});

// The filter is a controllable triple too. The grid decides what a change of it brings along (the first
// page, the count said); the hook is the callbacks and the shown state.
describe('the filter in useGridState', () => {
  const search = (text: string): DataGridFilter => ({ search: text });

  it('starts from the default filter, or from none, and holds the one that is asked for', () => {
    const none = renderHook(() => useGridState(options()));
    expect(none.result.current.state.filter).toEqual({});
    const given = search('minh');
    const { result } = renderHook(() => useGridState(options({ defaultFilter: given })));
    expect(result.current.state.filter).toBe(given);
    const next = search('anh');
    act(() => {
      result.current.setFilter(next);
    });
    expect(result.current.state.filter).toBe(next);
  });

  it('reports a filter to onFilterChange and then to onStateChange, with the shown state', () => {
    const calls: string[] = [];
    const onFilterChange = vi.fn(() => void calls.push('filter'));
    const onStateChange = vi.fn(() => void calls.push('state'));
    const { result } = renderHook(() => useGridState(options({ onFilterChange, onStateChange })));
    const next = search('minh');
    let asked: boolean | undefined;
    act(() => {
      asked = result.current.setFilter(next);
    });
    expect(asked).toBe(true);
    expect(calls).toEqual(['filter', 'state']);
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith(next);
    expect(onStateChange).toHaveBeenCalledExactlyOnceWith({ ...SHOWN, filter: next }, 'filter');
  });

  it('reports nothing for a filter that says what is held, though it is a new object', () => {
    const onFilterChange = vi.fn();
    const onStateChange = vi.fn();
    const { result } = renderHook(() =>
      useGridState(
        options({
          defaultFilter: { search: 'minh', columns: { qty: { operator: '>', value: 5 } } },
          onFilterChange,
          onStateChange,
        }),
      ),
    );
    let asked: boolean | undefined;
    act(() => {
      asked = result.current.setFilter({
        columns: { qty: { operator: '>', value: 5 } },
        search: 'minh',
        enabled: true,
      });
    });
    expect(asked).toBe(false);
    expect(onFilterChange).not.toHaveBeenCalled();
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it('reports each of two requests made before a render, the second against the first', () => {
    const onFilterChange = vi.fn();
    const { result } = renderHook(() => useGridState(options({ onFilterChange })));
    const first = search('a');
    const second = search('ab');
    act(() => {
      result.current.setFilter(first);
      result.current.setFilter(first);
      result.current.setFilter(second);
    });
    expect(onFilterChange.mock.calls).toEqual([[first], [second]]);
  });

  it('keeps a controlled filter the parent does not take, and reports each different request', () => {
    const onFilterChange = vi.fn();
    const onStateChange = vi.fn();
    const held = search('held');
    const { result } = renderHook(() =>
      useGridState(options({ filter: held, onFilterChange, onStateChange })),
    );
    act(() => {
      result.current.setFilter(search('other'));
      result.current.setFilter(search('another'));
    });
    expect(result.current.state.filter).toBe(held);
    expect(onFilterChange).toHaveBeenCalledTimes(2);
    expect(onStateChange).toHaveBeenCalledTimes(2);
  });

  it('compares a request with the one asked earlier in the same event, a controlled filter too', () => {
    const onFilterChange = vi.fn();
    const held = { columns: { qty: { operator: '>' as const, value: 5 } } };
    const { result } = renderHook(() => useGridState(options({ filter: held, onFilterChange })));
    // The same clear twice is one change, though the parent has not taken the first.
    act(() => {
      result.current.setFilter({});
      result.current.setFilter({});
    });
    expect(onFilterChange.mock.calls).toEqual([[{}]]);
    onFilterChange.mockClear();
    // Another filter and then back to the one the grid shows are two changes, the last the original.
    const other = search('other');
    const original = { columns: { qty: { operator: '>' as const, value: 5 } } };
    act(() => {
      result.current.setFilter(other);
      result.current.setFilter(original);
    });
    expect(onFilterChange.mock.calls).toEqual([[other], [original]]);
  });

  it('puts the filter on top of the shown state and of what an uncontrolled part asked before it', () => {
    const onStateChange = vi.fn();
    const { result } = renderHook(() => useGridState(options({ onStateChange })));
    const sort = [{ field: 'a', direction: 'asc' as const }];
    const filter = search('minh');
    act(() => {
      result.current.setSort(sort);
      result.current.setFilter(filter);
    });
    const [state, changed] = onStateChange.mock.calls[1] as [DataGridState, string];
    expect(changed).toBe('filter');
    expect(state.sort).toBe(sort);
    expect(state.filter).toBe(filter);
  });

  it('lets a request of the same event see a controlled filter that was asked, and forgets it after', async () => {
    const onStateChange = vi.fn();
    const held = search('held');
    const { result } = renderHook(() => useGridState(options({ filter: held, onStateChange })));
    const asked = search('asked');
    act(() => {
      result.current.setFilter(asked);
      result.current.setPage({ index: 0, size: 10 });
    });
    const [state, changed] = onStateChange.mock.calls[1] as [DataGridState, string];
    expect(changed).toBe('page');
    expect(state.filter).toBe(asked);
    // The parent kept its filter: a later request is sent over what the grid shows.
    await Promise.resolve();
    act(() => result.current.setPage({ index: 0, size: 20 }));
    expect(onStateChange.mock.calls[2]![0].filter).toBe(SHOWN.filter);
  });
});
