import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { resolveColumns } from '../engine/columns';
import type { DataGridColumn, DataGridExpandedGroups, DataGridState } from '../types';
import { useGridGrouping } from './use-grid-grouping';
import { useGridState } from './use-grid-state';

// The grouping, with the state it writes to (`useGridState`) and no grid: the one way the user changes
// the grouping (`applyGrouping`), the toggle of a group and "open every group" and "close every group".

interface Row {
  status: string;
  name: string;
  locked: string;
}

const COLUMNS: DataGridColumn<Row>[] = [
  { field: 'status', caption: 'Status' },
  { field: 'name', caption: 'Name' },
  { field: 'locked', caption: 'Locked', allowGrouping: false },
];
const RESOLVED = resolveColumns(COLUMNS as DataGridColumn<unknown>[], {
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
});
const BY_STATUS = [{ field: 'status', direction: 'asc' as const }];
const BY_NAME = [{ field: 'name', direction: 'asc' as const }];
const OPEN: DataGridExpandedGroups = { allExpanded: true, except: [] };

function setup({
  page = 0,
  remote = false,
  grouping,
  onStateChange,
}: {
  page?: number;
  remote?: boolean;
  grouping?: typeof BY_STATUS;
  onStateChange?: (state: DataGridState, part: keyof DataGridState) => void;
} = {}) {
  const calls: string[] = [];
  const announce = vi.fn();
  const shown = {
    current: {
      sort: [],
      filter: {},
      page: { index: page, size: 5 },
      selectedKeys: [],
      columnLayout: { order: [], widths: {}, hidden: [], pinned: {} },
      grouping: grouping ?? [],
      expandedGroups: OPEN,
    } satisfies DataGridState,
  };
  const hook = renderHook(() => {
    const held = useGridState({
      sort: undefined,
      defaultSort: undefined,
      onSortChange: undefined,
      filter: undefined,
      defaultFilter: undefined,
      onFilterChange: undefined,
      page: undefined,
      defaultPage: { index: page, size: 5 },
      onPageChange: (next) => calls.push(`page ${next.index}`),
      selectedKeys: undefined,
      defaultSelectedKeys: undefined,
      onSelectedKeysChange: undefined,
      columnLayout: undefined,
      defaultColumnLayout: shown.current.columnLayout,
      onColumnLayoutChange: undefined,
      grouping: undefined,
      defaultGrouping: grouping,
      onGroupingChange: (next) => calls.push(`grouping ${next.map((item) => item.field)}`),
      expandedGroups: undefined,
      defaultExpandedGroups: OPEN,
      onExpandedGroupsChange: (next) =>
        calls.push(`expanded ${next.allExpanded} ${next.except.length}`),
      onStateChange: (state, part) => {
        calls.push(`state ${part}`);
        onStateChange?.(state, part);
      },
      shown,
    });
    const view = useGridGrouping({
      grouping: held.state.grouping,
      resolved: RESOLVED,
      remote,
      setGrouping: held.setGrouping,
      setExpandedGroups: held.setExpandedGroups,
      expandedNow: held.expandedNow,
      setPage: held.setPage,
      pageIndex: held.state.page.index,
      size: 5,
      paged: true,
      announce,
    });
    return { held, view };
  });
  return { ...hook, calls, announce };
}

describe('which items group', () => {
  it('are the ones of columns that allow it, in order, and none in server mode', () => {
    const { result } = setup({
      grouping: [
        { field: 'locked', direction: 'asc' },
        { field: 'nothing', direction: 'asc' },
        ...BY_STATUS,
      ],
    });
    expect(result.current.view.levels).toEqual(BY_STATUS);
    expect(result.current.view.fields).toEqual(['status']);
    expect(setup({ grouping: BY_STATUS, remote: true }).result.current.view.levels).toEqual([]);
  });
});

describe('applyGrouping', () => {
  it('calls onGroupingChange and then onStateChange with the grouping asked, and says what it was given', () => {
    const onStateChange = vi.fn();
    const { result, calls, announce } = setup({ onStateChange });
    act(() => result.current.view.applyGrouping(BY_STATUS, 'Grouped by Status'));
    expect(calls).toEqual(['grouping status', 'state grouping']);
    expect(onStateChange.mock.calls[0]![0].grouping).toEqual(BY_STATUS);
    expect(result.current.held.state.grouping).toEqual(BY_STATUS);
    expect(announce).toHaveBeenCalledExactlyOnceWith('Grouped by Status');
  });

  it('goes to the first page as a second change with its own pair, before it says anything', () => {
    const { result, calls, announce } = setup({ page: 2 });
    act(() => result.current.view.applyGrouping(BY_STATUS, 'Grouped'));
    expect(calls).toEqual(['grouping status', 'state grouping', 'page 0', 'state page']);
    expect(result.current.held.state.page).toEqual({ index: 0, size: 5 });
    expect(announce).toHaveBeenCalledTimes(1);
  });

  it('does nothing at all for a grouping that says what is held, or what the same event asked', () => {
    const { result, calls, announce } = setup({ page: 2, grouping: BY_STATUS });
    act(() => result.current.view.applyGrouping([{ field: 'status', direction: 'asc' }], 'Same'));
    expect(calls).toEqual([]);
    expect(announce).not.toHaveBeenCalled();
    act(() => {
      result.current.view.applyGrouping(BY_NAME, 'First');
      result.current.view.applyGrouping(BY_NAME, 'Second');
    });
    expect(calls.filter((call) => call === 'grouping name')).toHaveLength(1);
    expect(announce).toHaveBeenCalledExactlyOnceWith('First');
  });

  it('keeps the page when it is the first, and says nothing without a sentence', () => {
    const { result, calls, announce } = setup();
    act(() => result.current.view.applyGrouping(BY_NAME));
    expect(calls).toEqual(['grouping name', 'state grouping']);
    expect(announce).not.toHaveBeenCalled();
  });
});

describe('toggleGroup, expandAll and collapseAll', () => {
  it('closes an open group by listing it, and opens it again by taking it off', () => {
    const { result, calls } = setup({ grouping: BY_STATUS });
    act(() => result.current.view.toggleGroup('a'));
    expect(result.current.held.state.expandedGroups).toEqual({ allExpanded: true, except: ['a'] });
    act(() => result.current.view.toggleGroup('a'));
    expect(result.current.held.state.expandedGroups).toEqual(OPEN);
    expect(calls).toEqual([
      'expanded true 1',
      'state expandedGroups',
      'expanded true 0',
      'state expandedGroups',
    ]);
  });

  it('sees the toggle of an earlier request of the same event', () => {
    const { result } = setup({ grouping: BY_STATUS });
    act(() => {
      result.current.view.toggleGroup('a');
      result.current.view.toggleGroup('b');
    });
    expect(result.current.held.state.expandedGroups).toEqual({
      allExpanded: true,
      except: ['a', 'b'],
    });
  });

  it('opens and closes every group, and calls nothing when that is what is held', () => {
    const { result, calls } = setup({ grouping: BY_STATUS });
    act(() => result.current.view.expandAll());
    expect(calls).toEqual([]);
    act(() => result.current.view.collapseAll());
    expect(calls).toEqual(['expanded false 0', 'state expandedGroups']);
    act(() => result.current.view.collapseAll());
    expect(calls).toHaveLength(2);
    act(() => result.current.view.expandAll());
    expect(result.current.held.state.expandedGroups).toEqual(OPEN);
  });
});
