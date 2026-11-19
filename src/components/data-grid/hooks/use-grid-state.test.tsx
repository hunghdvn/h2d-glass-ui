import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DataGridColumnLayout, DataGridState } from '../types';
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
  page: { index: 0, size: 20 },
  selectedKeys: [],
  columnLayout: layout(),
};

function options(extra: Partial<GridStateOptions> = {}): GridStateOptions {
  return {
    sort: undefined,
    defaultSort: undefined,
    onSortChange: undefined,
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
