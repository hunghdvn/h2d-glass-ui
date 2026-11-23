import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import type { Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type {
  DataGridColumn,
  DataGridExpandedGroups,
  DataGridGroupItem,
  DataGridHandle,
  DataGridProps,
  DataGridState,
} from './index';

// Grouping (spec phase 6 §3.5 step 6, §3.6 "Treegrid", §4.3 R1 "Hàng nhóm", §6.3 "Nhóm", "Mở/đóng"): the
// grouping and the open groups as state, the group rows and the indent columns, the columns a grouping
// takes out, the keys of a group row, and what choosing and paging do with rows of three kinds.

let showing: Set<Element>;
beforeEach(() => {
  resetDevWarnings();
  showing = new Set();
  // jsdom has no layout, so every element would count as hidden to the code that looks for the
  // controls of a cell, and no Popover API: a popover (the chooser's) shows and hides by these stand-ins.
  HTMLElement.prototype.checkVisibility = () => true;
  HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
    showing.add(this);
  };
  HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
    showing.delete(this);
  };
  const matches = Element.prototype.matches;
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
    this: Element,
    selector: string,
  ) {
    return selector === ':popover-open' ? showing.has(this) : matches.call(this, selector);
  });
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
  Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  vi.restoreAllMocks();
});

interface Order {
  id: string;
  status: string;
  assignee: string | null;
  qty: number;
}

const ORDERS: Order[] = [
  { id: 'DH-1', status: 'Delivered', assignee: 'An', qty: 5 },
  { id: 'DH-2', status: 'Delivered', assignee: 'Bình', qty: 3 },
  { id: 'DH-3', status: 'Processing', assignee: 'An', qty: 2 },
  { id: 'DH-4', status: 'Processing', assignee: null, qty: 4 },
  { id: 'DH-5', status: 'Processing', assignee: 'Bình', qty: 1 },
  { id: 'DH-6', status: 'New', assignee: 'An', qty: 6 },
  { id: 'DH-7', status: 'New', assignee: 'An', qty: 7 },
  { id: 'DH-8', status: 'Cancelled', assignee: 'Bình', qty: 8 },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
  { field: 'status', caption: 'Status', width: 140 },
  { field: 'assignee', caption: 'Assignee', width: 140 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
];

const BY_STATUS: DataGridGroupItem[] = [{ field: 'status', direction: 'asc' }];
const BY_STATUS_THEN_ASSIGNEE: DataGridGroupItem[] = [
  { field: 'status', direction: 'asc' },
  { field: 'assignee', direction: 'asc' },
];
// What the state calls a group (OQ 3 (b)): the JSON of the `[field, value]` steps down to it.
const key = (...steps: [string, unknown][]) => JSON.stringify(steps);
const CLOSED: DataGridExpandedGroups = { allExpanded: false, except: [] };

function Orders({
  gridRef,
  ...props
}: Partial<DataGridProps<Order>> & { gridRef?: Ref<DataGridHandle> }) {
  return (
    <DataGrid
      ref={gridRef}
      data={ORDERS}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      {...props}
    />
  );
}

// The table, whatever its role is: a grid, or a treegrid while the rows are grouped.
const table = () => document.querySelector<HTMLTableElement>('table[role]')!;
const bodyRows = () => Array.from(table().querySelectorAll<HTMLElement>('tbody > tr'));
const groupRows = () =>
  Array.from(table().querySelectorAll<HTMLElement>('tbody > tr.flg-data-grid-group-row'));
const dataRows = () =>
  Array.from(table().querySelectorAll<HTMLElement>('tbody > tr.flg-data-grid-row'));

const titles = () =>
  Array.from(
    table().querySelectorAll('thead th:not(.flg-data-grid-filler):not(.flg-data-grid-indent)'),
    (th) => th.textContent,
  );
const stops = () => Array.from(table().querySelectorAll<HTMLElement>('[tabindex="0"]'));
const focusOn = (element: HTMLElement) => act(() => element.focus());
const press = (element: HTMLElement, pressed: string, init: KeyboardEventInit = {}): boolean => {
  const event = createEvent.keyDown(element, {
    key: pressed,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  act(() => {
    fireEvent(element, event);
  });
  return event.defaultPrevented;
};
const group = (text: string) => groupRows().find((row) => row.textContent?.includes(text))!;

describe('the role and the rows of a grouped grid', () => {
  it('is a treegrid while the rows are grouped, and a grid otherwise, keeping the focus across', () => {
    const { rerender } = render(<Orders />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.queryByRole('treegrid')).toBeNull();
    const first = screen.getByRole('grid').querySelector<HTMLElement>('tbody td')!;
    focusOn(first);
    rerender(<Orders grouping={BY_STATUS} />);
    expect(screen.getByRole('treegrid')).toBeInTheDocument();
    expect(screen.queryByRole('grid')).toBeNull();
    // The role changed under the focus: the focus is in the grid still, on a place of it.
    expect(table().contains(document.activeElement)).toBe(true);
    rerender(<Orders grouping={[]} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('draws a group row for each group, in order, each saying its level, size, place and state', () => {
    render(<Orders grouping={BY_STATUS} />);
    expect(groupRows().map((row) => row.textContent)).toEqual([
      'Status: Cancelled (1)',
      'Status: Delivered (2)',
      'Status: New (2)',
      'Status: Processing (3)',
    ]);
    expect(bodyRows()).toHaveLength(4 + 8);
    const second = group('Delivered');
    expect(second).toHaveAttribute('aria-level', '1');
    expect(second).toHaveAttribute('aria-expanded', 'true');
    expect(second).toHaveAttribute('aria-setsize', '4');
    expect(second).toHaveAttribute('aria-posinset', '2');
    expect(second).toHaveAttribute('data-level', '1');
    expect(second).not.toHaveAttribute('aria-selected');
    // A data row under a group says its level (the levels above it, and one) and its place in the group.
    const delivered = dataRows().filter((row) => row.textContent?.startsWith('DH-'));
    const row = delivered.find((candidate) => candidate.textContent?.startsWith('DH-2'))!;
    expect(row).toHaveAttribute('aria-level', '2');
    expect(row).toHaveAttribute('aria-setsize', '2');
    expect(row).toHaveAttribute('aria-posinset', '2');
  });

  it('draws the levels of a grouping on two columns, one indent column for each', () => {
    render(<Orders grouping={BY_STATUS_THEN_ASSIGNEE} />);
    const level2 = groupRows().filter((row) => row.getAttribute('aria-level') === '2');
    expect(level2.length).toBeGreaterThan(0);
    expect(level2[0]!.textContent).toBe('Assignee: Bình (1)');
    // A level 2 row has one empty cell before its chevron, which has no band; a data row two indents.
    expect(level2[0]!.querySelectorAll('.flg-data-grid-indent')).toHaveLength(1);
    const data = dataRows()[0]!;
    expect(data.querySelectorAll('.flg-data-grid-indent')).toHaveLength(2);
    expect(data).toHaveAttribute('aria-level', '3');
    // The heading has one cell over the indents, with hidden words, and not hidden itself.
    const over = table().querySelector<HTMLElement>('thead th.flg-data-grid-indent')!;
    expect(over).toHaveAttribute('colspan', '2');
    expect(over).not.toHaveAttribute('aria-hidden');
    expect(over.textContent).toBe('Groups and details');
    // Two indents, the two columns left (Order and Qty) and the filler column of an unmeasured frame.
    expect(table().querySelectorAll('col')).toHaveLength(2 + 2 + 1);
  });

  it('writes a value as the cells do, and the blank group with labels.blank, last', () => {
    render(
      <Orders grouping={[{ field: 'assignee', direction: 'desc' }]} labels={{ blank: '(none)' }} />,
    );
    const names = groupRows().map((row) => row.textContent);
    expect(names).toEqual(['Assignee: Bình (3)', 'Assignee: An (4)', 'Assignee: (none) (1)']);
  });

  it('writes the group row with the words of labels', () => {
    render(
      <Orders
        grouping={BY_STATUS}
        labels={{ groupCount: (n) => `[${n} rows]`, groupColumn: (caption) => `${caption} =` }}
      />,
    );
    expect(groupRows()[0]!.textContent).toBe('Status = Cancelled [1 rows]');
  });

  it('marks the search in the value of a group row only', () => {
    render(<Orders grouping={BY_STATUS} defaultFilter={{ search: 'New' }} />);
    const row = groupRows()[0]!;
    expect(row.textContent).toBe('Status: New (2)');
    expect(row.querySelector('.flg-data-grid-group-value mark')?.textContent).toBe('New');
    expect(row.querySelector('.flg-data-grid-group-column mark')).toBeNull();
    expect(row.querySelector('.flg-data-grid-group-count mark')).toBeNull();
  });

  it('stripes the data rows alone: a group row never shifts the stripe', () => {
    render(<Orders grouping={BY_STATUS} variant="striped" />);
    const striped = bodyRows().map((row) => row.hasAttribute('data-stripe'));
    const kinds = bodyRows().map((row) => row.classList.contains('flg-data-grid-group-row'));
    // Cancelled: 1 row; Delivered: 2; New: 2; Processing: 3 — data rows count 0, 1, 2, ... in the list.
    const dataOnly = striped.filter((_, at) => !kinds[at]);
    expect(dataOnly).toEqual([true, false, true, false, true, false, true, false]);
    expect(striped.filter((_, at) => kinds[at]).some(Boolean)).toBe(false);
  });
});

describe('the columns a grouping takes out', () => {
  it('leaves the grouped column out of the heading, the rows and the filter row, and brings it back', () => {
    const { rerender } = render(<Orders grouping={BY_STATUS} filterRow />);
    expect(titles()).toEqual(['Order', 'Assignee', 'Qty']);
    expect(dataRows()[0]!.querySelectorAll('.flg-data-grid-cell')).toHaveLength(3);
    expect(table().querySelectorAll('.flg-data-grid-filter-cell')).toHaveLength(3);
    rerender(<Orders grouping={[]} filterRow />);
    expect(titles()).toEqual(['Order', 'Status', 'Assignee', 'Qty']);
    expect(table().querySelectorAll('.flg-data-grid-filter-cell')).toHaveLength(4);
  });

  it('keeps the column with showWhenGrouped, and still filters by a grouped column', () => {
    const columns = COLUMNS.map((column) =>
      'field' in column && column.field === 'status'
        ? { ...column, showWhenGrouped: true }
        : column,
    );
    const { rerender } = render(<Orders grouping={BY_STATUS} columns={columns} />);
    expect(titles()).toEqual(['Order', 'Status', 'Assignee', 'Qty']);
    rerender(
      <Orders
        grouping={BY_STATUS}
        filter={{ columns: { status: { operator: '=', value: 'New' } } }}
      />,
    );
    // The column is gone from the rows, and its condition filters all the same.
    expect(titles()).toEqual(['Order', 'Assignee', 'Qty']);
    expect(groupRows().map((row) => row.textContent)).toEqual(['Status: New (2)']);
  });

  it('keeps the first grouped column shown when the grouping would leave no column', () => {
    const only: DataGridColumn<Order>[] = [{ field: 'status', caption: 'Status', width: 140 }];
    render(<Orders columns={only} grouping={BY_STATUS} />);
    expect(titles()).toEqual(['Status']);
    expect(groupRows()).toHaveLength(4);
  });

  it('leaves a grouped column out of the chooser, which counts the shown columns only for its last-shown rule', () => {
    render(
      <Orders
        grouping={BY_STATUS}
        columnChooser
        columnLayout={{ order: [], widths: {}, hidden: ['assignee', 'qty'], pinned: {} }}
      />,
    );
    const trigger = document.querySelector<HTMLButtonElement>('.flg-data-grid-chooser-button')!;
    fireEvent.pointerDown(trigger, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 });
    fireEvent.mouseDown(trigger);
    fireEvent.pointerUp(trigger, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 });
    fireEvent.click(trigger, { detail: 1 });
    const boxes = Array.from(
      document.querySelectorAll<HTMLInputElement>('.flg-data-grid-chooser input'),
    );
    expect(boxes.map((box) => box.closest('label')?.textContent)).toEqual([
      'Order',
      'Assignee',
      'Qty',
    ]);
    // Status is grouped, so Order is the only column shown: its box cannot be cleared.
    expect(boxes.map((box) => box.checked)).toEqual([true, false, false]);
    expect(boxes[0]).toBeDisabled();
  });

  const chooserLabels = (layout: DataGridProps<Order>['columnLayout']) => {
    render(<Orders grouping={BY_STATUS} columnChooser columnLayout={layout} />);
    const trigger = document.querySelector<HTMLButtonElement>('.flg-data-grid-chooser-button')!;
    fireEvent.pointerDown(trigger, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 });
    fireEvent.mouseDown(trigger);
    fireEvent.pointerUp(trigger, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 });
    fireEvent.click(trigger, { detail: 1 });
    return Array.from(
      document.querySelectorAll<HTMLInputElement>('.flg-data-grid-chooser input'),
      (box) => box.closest('label')?.textContent,
    );
  };

  it('does not list a column that is both hidden and grouped by', () => {
    // Checking it would show the column in the layout, and the grouping would take it out again: the box
    // the user just pressed would leave the list under the focus.
    expect(chooserLabels({ order: [], widths: {}, hidden: ['status', 'qty'], pinned: {} })).toEqual(
      ['Order', 'Assignee', 'Qty'],
    );
  });

  it('lists the grouped column that stays shown because it is the last one', () => {
    expect(
      chooserLabels({
        order: [],
        widths: {},
        hidden: ['id', 'assignee', 'qty'],
        pinned: {},
      }),
    ).toEqual(['Order', 'Status', 'Assignee', 'Qty']);
  });

  it('leaves a grouped column out of a column that is hidden or shown by the layout', () => {
    render(
      <Orders
        grouping={BY_STATUS}
        columnLayout={{ order: [], widths: {}, hidden: ['assignee'], pinned: {} }}
      />,
    );
    expect(titles()).toEqual(['Order', 'Qty']);
  });

  it('groups by a column that arrives after the mount, when it arrives', () => {
    const late = COLUMNS.filter((column) => !('field' in column && column.field === 'status'));
    const { rerender } = render(<Orders columns={late} defaultGrouping={BY_STATUS} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
    rerender(<Orders columns={COLUMNS} defaultGrouping={BY_STATUS} />);
    expect(groupRows()).toHaveLength(4);
  });
});

describe('the open groups', () => {
  it('starts every group open, closed with autoExpandAll false, and defaultExpandedGroups wins', () => {
    const { rerender } = render(<Orders grouping={BY_STATUS} />);
    expect(dataRows()).toHaveLength(8);
    rerender(<Orders key="closed" grouping={BY_STATUS} autoExpandAll={false} />);
    expect(dataRows()).toHaveLength(0);
    expect(groupRows().every((row) => row.getAttribute('aria-expanded') === 'false')).toBe(true);
    rerender(
      <Orders
        key="default"
        grouping={BY_STATUS}
        autoExpandAll={false}
        defaultExpandedGroups={{ allExpanded: true, except: [key(['status', 'New'])] }}
      />,
    );
    expect(dataRows()).toHaveLength(6);
  });

  it('toggles on a press: onExpandedGroupsChange, then onStateChange, with the groups that are open', async () => {
    const calls: string[] = [];
    const onChange = vi.fn<(expanded: DataGridExpandedGroups) => void>(
      () => void calls.push('groups'),
    );
    const onState = vi.fn<(state: DataGridState, part: string) => void>(
      (_state, part) => void calls.push(part),
    );
    render(
      <Orders grouping={BY_STATUS} onExpandedGroupsChange={onChange} onStateChange={onState} />,
    );
    await userEvent.click(group('Delivered'));
    expect(calls).toEqual(['groups', 'expandedGroups']);
    const delivered = key(['status', 'Delivered']);
    expect(onChange).toHaveBeenCalledWith({ allExpanded: true, except: [delivered] });
    expect(onState.mock.calls[0]![0].expandedGroups).toEqual({
      allExpanded: true,
      except: [delivered],
    });
    expect(group('Delivered')).toHaveAttribute('aria-expanded', 'false');
    expect(dataRows()).toHaveLength(6);
    await userEvent.click(group('Delivered'));
    expect(onChange).toHaveBeenLastCalledWith({ allExpanded: true, except: [] });
    expect(dataRows()).toHaveLength(8);
  });

  it('toggles once on a double press: the second click of the pair toggles nothing', async () => {
    const onChange = vi.fn();
    render(<Orders grouping={BY_STATUS} onExpandedGroupsChange={onChange} />);
    await userEvent.dblClick(group('Delivered'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(group('Delivered')).toHaveAttribute('aria-expanded', 'false');
  });

  it('asks a parent that keeps its value, and draws what it holds', async () => {
    const onChange = vi.fn();
    render(
      <Orders grouping={BY_STATUS} expandedGroups={CLOSED} onExpandedGroupsChange={onChange} />,
    );
    expect(dataRows()).toHaveLength(0);
    await userEvent.click(group('Delivered'));
    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      allExpanded: false,
      except: [key(['status', 'Delivered'])],
    });
    expect(dataRows()).toHaveLength(0);
  });

  it('opens and closes every group from the handle, and calls nothing when that is what is held', () => {
    const ref = createRef<DataGridHandle>();
    const onChange = vi.fn();
    render(<Orders gridRef={ref} grouping={BY_STATUS} onExpandedGroupsChange={onChange} />);
    act(() => ref.current!.expandAllGroups());
    expect(onChange).not.toHaveBeenCalled();
    act(() => ref.current!.collapseAllGroups());
    expect(onChange).toHaveBeenCalledExactlyOnceWith(CLOSED);
    expect(dataRows()).toHaveLength(0);
    act(() => ref.current!.collapseAllGroups());
    expect(onChange).toHaveBeenCalledTimes(1);
    act(() => ref.current!.expandAllGroups());
    expect(onChange).toHaveBeenLastCalledWith({ allExpanded: true, except: [] });
    expect(dataRows()).toHaveLength(8);
  });

  it('holds the state as given and says it in getState', () => {
    const ref = createRef<DataGridHandle>();
    const stale = { allExpanded: true, except: ['[["gone","x"]]'] };
    render(
      <Orders
        gridRef={ref}
        grouping={[...BY_STATUS, { field: 'nothing', direction: 'asc' }]}
        expandedGroups={stale}
      />,
    );
    expect(ref.current!.getState().grouping).toEqual([
      ...BY_STATUS,
      { field: 'nothing', direction: 'asc' },
    ]);
    expect(ref.current!.getState().expandedGroups).toBe(stale);
    expect(groupRows()).toHaveLength(4);
  });
});

describe('what is said of a shape the type forbids', () => {
  it('warns once for a grouping that is no array, and keeps the rows ungrouped', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Orders grouping={'status' as unknown as DataGridGroupItem[]} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toContain('grouping is not an array of group items');
  });

  it('warns once for an item that is no object and for expandedGroups that is no object', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Orders
        grouping={[...BY_STATUS, 'assignee' as unknown as DataGridGroupItem]}
        expandedGroups={3 as unknown as DataGridExpandedGroups}
      />,
    );
    expect(groupRows()).toHaveLength(4);
    const said = warn.mock.calls.map((call) => String(call[0]));
    expect(said).toHaveLength(2);
    expect(said.some((text) => text.includes('grouping is not an array'))).toBe(true);
    expect(said.some((text) => text.includes('expandedGroups is not an object'))).toBe(true);
  });

  it('says nothing of an unknown field, a bad direction, a repeat or a stale key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Orders
        grouping={[
          { field: 'nothing', direction: 'asc' },
          { field: 'status', direction: 'up' as 'asc' },
          { field: 'qty', direction: 'asc' },
          { field: 'qty', direction: 'desc' },
        ]}
        expandedGroups={{ allExpanded: true, except: ['stale'] }}
      />,
    );
    expect(warn).not.toHaveBeenCalled();
    // Only the first `qty` groups; the unknown field and the bad direction group nothing.
    expect(groupRows().length).toBeGreaterThan(0);
    expect(groupRows()[0]!.textContent).toMatch(/^Qty: 1 /);
  });

  it('holds a grouping in server mode, warns once and groups nothing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Orders remote totalCount={8} grouping={BY_STATUS} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.queryByRole('treegrid')).toBeNull();
    expect(screen.getByRole('grid').querySelectorAll('.flg-data-grid-group-row')).toHaveLength(0);
    expect(titles()).toEqual(['Order', 'Status', 'Assignee', 'Qty']);
    const said = warn.mock.calls.map((call) => String(call[0]));
    expect(said.filter((text) => text.includes('remote does not group'))).toHaveLength(1);
  });
});

describe('choosing rows and paging with group rows', () => {
  it('has no box in a group row, and chooses the data rows of the page with select all', async () => {
    render(<Orders grouping={BY_STATUS} selectionMode="multiple" />);
    expect(table().querySelectorAll('tbody tr.flg-data-grid-group-row input')).toHaveLength(0);
    expect(table().querySelectorAll('tbody tr.flg-data-grid-row input')).toHaveLength(8);
    expect(table().querySelectorAll('tbody tr.flg-data-grid-group-row')).toHaveLength(4);
    // Every row of a grid with a column of boxes has the box's cell, an empty indent in a group row.
    expect(groupRows()[0]!.querySelectorAll('.flg-data-grid-indent')).toHaveLength(1);
    const onChange = vi.fn();
    render(
      <Orders grouping={BY_STATUS} selectionMode="multiple" onSelectedKeysChange={onChange} />,
    );
    const heading = screen.getAllByRole('checkbox', { name: 'Select all rows on this page' })[1]!;
    await userEvent.click(heading);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]![0]).toEqual([
      'DH-8',
      'DH-1',
      'DH-2',
      'DH-6',
      'DH-7',
      'DH-3',
      'DH-4',
      'DH-5',
    ]);
  });

  it('chooses the rows of closed groups too with selectAllMode all, and never a group key', async () => {
    const onChange = vi.fn();
    render(
      <Orders
        grouping={BY_STATUS}
        selectionMode="multiple"
        selectAllMode="all"
        autoExpandAll={false}
        onSelectedKeysChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    expect(onChange.mock.calls[0]![0]).toHaveLength(8);
    expect(onChange.mock.calls[0]![0].every((one: string) => one.startsWith('DH-'))).toBe(true);
  });

  it('takes a range over the data rows in the order shown, the rows of a closed group left out', async () => {
    const onChange = vi.fn();
    render(
      <Orders
        grouping={BY_STATUS}
        selectionMode="multiple"
        defaultExpandedGroups={{ allExpanded: true, except: [key(['status', 'Delivered'])] }}
        onSelectedKeysChange={onChange}
      />,
    );
    const box = (id: string) => screen.getByRole('checkbox', { name: `Select ${id}` });
    await userEvent.click(box('DH-8'));
    await userEvent.keyboard('{Shift>}');
    await userEvent.click(box('DH-6'));
    await userEvent.keyboard('{/Shift}');
    // Cancelled (DH-8), then Delivered closed, then New (DH-6): the range is these two.
    expect(onChange).toHaveBeenLastCalledWith(['DH-8', 'DH-6']);
  });

  it('counts group rows and data rows in a page, and says so in the pager', () => {
    render(<Orders grouping={BY_STATUS} paging={{ pageSize: 5, pageSizes: [5] }} />);
    // 4 groups and 8 rows are 12 rows to count: the first page holds five of them.
    expect(screen.getByText('1–5 of 12')).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(5);
  });

  it('repeats the group a page starts inside as a group row of its own, with (continued)', () => {
    render(
      <Orders
        grouping={BY_STATUS}
        paging={{ pageSize: 4, pageSizes: [4] }}
        page={{ index: 1, size: 4 }}
      />,
    );
    // The first page holds Cancelled, DH-8, Delivered, DH-1: the second starts inside Delivered.
    expect(screen.getByText('5–8 of 12')).toBeInTheDocument();
    const first = bodyRows()[0]!;
    expect(first.classList.contains('flg-data-grid-group-row')).toBe(true);
    expect(first.textContent).toBe('Status: Delivered (2) (continued)');
    // It is the group's own row: it toggles the group, and says its place among the groups.
    expect(first).toHaveAttribute('aria-posinset', '2');
    expect(first).toHaveAttribute('aria-setsize', '4');
  });

  it('calls nothing when the grouping prop changes from outside, the page included', () => {
    // No part of the grid changes the grouping yet (the panel and the menu come later): the one
    // function that does, `applyGrouping`, is tested in use-grid-grouping.test.tsx.
    const onPage = vi.fn();
    const onState = vi.fn();
    const onGrouping = vi.fn();
    const paging = { pageSize: 5, pageSizes: [5] };
    const props = { onPageChange: onPage, onStateChange: onState, onGroupingChange: onGrouping };
    const { rerender } = render(
      <Orders paging={paging} defaultPage={{ index: 1, size: 5 }} {...props} />,
    );
    expect(screen.getByText('6–8 of 8')).toBeInTheDocument();
    rerender(
      <Orders
        grouping={BY_STATUS}
        paging={paging}
        defaultPage={{ index: 1, size: 5 }}
        {...props}
      />,
    );
    expect(onPage).not.toHaveBeenCalled();
    expect(onState).not.toHaveBeenCalled();
    expect(onGrouping).not.toHaveBeenCalled();
  });
});

describe('the keys of a group row', () => {
  it('is the one Tab stop when it is the first row, and the rows are out of the order', () => {
    render(<Orders grouping={BY_STATUS} />);
    expect(stops()).toEqual([groupRows()[0]]);
    expect(groupRows()[1]).toHaveAttribute('tabindex', '-1');
    // A group row is a stop and never a control: it is not released by the grid's own watcher.
    expect(groupRows()[0]).toHaveAttribute('tabindex', '0');
  });

  it('opens a closed group with → and goes to its first row when it is open; ← closes it, and goes up', () => {
    render(<Orders grouping={BY_STATUS_THEN_ASSIGNEE} autoExpandAll={false} />);
    const first = groupRows()[0]!;
    focusOn(first);
    expect(press(first, 'ArrowRight')).toBe(true);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    // Open: → goes to the first row inside, which is a group of the next level.
    expect(press(first, 'ArrowRight')).toBe(true);
    const inner = groupRows().find((row) => row.getAttribute('aria-level') === '2')!;
    expect(document.activeElement).toBe(inner);
    // A closed group of level 2: ← goes to the group above, and an open one closes first.
    expect(press(inner, 'ArrowLeft')).toBe(true);
    expect(document.activeElement).toBe(first);
    expect(press(first, 'ArrowLeft')).toBe(true);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    // A closed group of level 1 has nothing above it: ← does nothing, and is cancelled.
    expect(press(first, 'ArrowLeft')).toBe(true);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(first);
  });

  it('toggles on Enter, and cancels Space, which chooses nothing', () => {
    const onChange = vi.fn();
    render(
      <Orders grouping={BY_STATUS} selectionMode="multiple" onSelectedKeysChange={onChange} />,
    );
    const first = groupRows()[0]!;
    focusOn(first);
    expect(press(first, 'Enter')).toBe(true);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(press(first, ' ')).toBe(true);
    expect(press(first, ' ', { shiftKey: true })).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('toggles once for a press of Enter, and not again for the repeats of a held key', () => {
    render(<Orders grouping={BY_STATUS} />);
    const first = groupRows()[0]!;
    focusOn(first);
    expect(press(first, 'Enter')).toBe(true);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    // The key stays down: the repeats are the grid's (they do not scroll the page) and toggle nothing.
    expect(press(first, 'Enter', { repeat: true })).toBe(true);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(press(first, 'Enter')).toBe(true);
    expect(first).toHaveAttribute('aria-expanded', 'true');
  });

  it('moves a row at a time with ↑ and ↓ over group rows and data rows, and keeps the column', () => {
    render(<Orders grouping={BY_STATUS} />);
    const first = groupRows()[0]!;
    focusOn(first);
    press(first, 'ArrowDown');
    const row = bodyRows()[1]!;
    expect(row.classList.contains('flg-data-grid-row')).toBe(true);
    expect(document.activeElement).toBe(row.querySelector('[tabindex="0"]'));
    // The cell has the place of the first column: the grid moves nowhere sideways.
    press(document.activeElement as HTMLElement, 'ArrowRight');
    const cell = document.activeElement as HTMLElement;
    press(cell, 'ArrowDown');
    expect(document.activeElement).toBe(groupRows()[1]);
    press(groupRows()[1]!, 'ArrowDown');
    // Back on a data row, the column is the one it was left at.
    const again = document.activeElement as HTMLElement;
    expect(again.closest('tr')!.classList.contains('flg-data-grid-row')).toBe(true);
    expect(Array.from(again.closest('tr')!.children).indexOf(again)).toBe(
      Array.from(cell.closest('tr')!.children).indexOf(cell),
    );
  });

  it('goes to the first and the last row of the list with Home and End', () => {
    render(<Orders grouping={BY_STATUS} />);
    const first = groupRows()[0]!;
    focusOn(first);
    press(first, 'End');
    const last = bodyRows().at(-1)!;
    expect(document.activeElement).toBe(last.querySelector('[tabindex="0"]'));
    // mod+Home goes to the first row, a group row included.
    press(document.activeElement as HTMLElement, 'Home', { ctrlKey: true });
    expect(document.activeElement).toBe(first);
    // Home on a group row goes to the first row of the list, End to the last, whatever it is.
    const fourth = groupRows()[3]!;
    focusOn(fourth);
    press(fourth, 'Home');
    expect(document.activeElement).toBe(first);
  });

  it('gives the focus to the group row when the group under the focus closes', () => {
    render(<Orders grouping={BY_STATUS} />);
    const inside = dataRows().find((row) => row.textContent?.startsWith('DH-1'))!;
    const cell = inside.querySelector<HTMLElement>('[tabindex]')!;
    focusOn(cell);
    expect(document.activeElement).toBe(cell);
    fireEvent.click(group('Delivered'));
    expect(document.activeElement).toBe(group('Delivered'));
    expect(stops()).toEqual([group('Delivered')]);
  });

  it('makes a pressed group row the place, and the focus is on the row', async () => {
    render(<Orders grouping={BY_STATUS} />);
    await userEvent.click(group('New'));
    expect(stops()).toEqual([group('New')]);
    expect(document.activeElement).toBe(group('New'));
  });

  it('keeps the keys of a plain row: Space chooses it, Enter activates it', () => {
    const onActivate = vi.fn();
    const onChange = vi.fn();
    render(
      <Orders
        grouping={BY_STATUS}
        selectionMode="multiple"
        onSelectedKeysChange={onChange}
        onRowActivate={onActivate}
      />,
    );
    // The place nothing chose yet is the first row, a group row: go down once, to the box of DH-8.
    press(groupRows()[0]!, 'ArrowDown');
    const box = document.activeElement as HTMLElement;
    press(box, ' ');
    expect(onChange).toHaveBeenCalledWith(['DH-8']);
    press(box, 'ArrowRight');
    press(document.activeElement as HTMLElement, 'Enter');
    expect(onActivate).toHaveBeenCalledWith(ORDERS[7], 'DH-8');
  });
});

describe('a state change on a mounted grid', () => {
  it('groups when the grouping prop comes, and ungroups when it goes, with the filter kept', () => {
    function Host() {
      const [grouping, setGrouping] = useState<DataGridGroupItem[]>([]);
      return (
        <>
          <button onClick={() => setGrouping(BY_STATUS)}>group</button>
          <button onClick={() => setGrouping([])}>ungroup</button>
          <Orders grouping={grouping} defaultFilter={{ search: 'DH' }} />
        </>
      );
    }
    render(<Host />);
    expect(screen.getByRole('grid').querySelectorAll('tbody tr')).toHaveLength(8);
    fireEvent.click(screen.getByText('group'));
    expect(groupRows()).toHaveLength(4);
    fireEvent.click(screen.getByText('ungroup'));
    expect(
      screen.getByRole('grid').querySelectorAll('tbody tr.flg-data-grid-group-row'),
    ).toHaveLength(0);
  });
});

describe('a group that closes while its own row is on another page', () => {
  // Four counted rows to a page: the first page holds Cancelled, DH-8, Delivered, DH-1, the second starts
  // inside Delivered (its row is repeated as "(continued)"), then DH-2, New and DH-6.
  const PAGING = { pageSize: 4, pageSizes: [4] };
  const SECOND = { index: 1, size: 4 };
  const cellOf = (row: HTMLElement) =>
    row.querySelector<HTMLElement>('td:not(.flg-data-grid-indent)')!;
  const pageCalls = (onPage: ReturnType<typeof vi.fn>) => onPage.mock.calls.map(([page]) => page);

  function Paged(props: Partial<DataGridProps<Order>> & { gridRef?: Ref<DataGridHandle> }) {
    return <Orders grouping={BY_STATUS} paging={PAGING} defaultPage={SECOND} {...props} />;
  }

  it('goes to the page of the group row, and focuses it, on ← from its "(continued)" row', () => {
    const onPage = vi.fn();
    const onState = vi.fn();
    render(<Paged onPageChange={onPage} onStateChange={onState} />);
    const continued = bodyRows()[0]!;
    expect(continued.textContent).toBe('Status: Delivered (2) (continued)');
    focusOn(continued);
    expect(press(continued, 'ArrowLeft')).toBe(true);
    expect(screen.getByText('1–4 of 10')).toBeInTheDocument();
    expect(document.activeElement).toBe(group('Delivered'));
    expect(group('Delivered')).toHaveAttribute('aria-expanded', 'false');
    expect(pageCalls(onPage)).toEqual([{ index: 0, size: 4 }]);
    expect(onState.mock.calls.filter(([, part]) => part === 'page')).toHaveLength(1);
  });

  it('does the same on a press of the "(continued)" row with the place on one of its rows', () => {
    const onPage = vi.fn();
    render(<Paged onPageChange={onPage} />);
    focusOn(cellOf(dataRows()[0]!));
    expect(dataRows()[0]!.textContent).toContain('DH-2');
    fireEvent.click(bodyRows()[0]!);
    expect(screen.getByText('1–4 of 10')).toBeInTheDocument();
    expect(document.activeElement).toBe(group('Delivered'));
    expect(pageCalls(onPage)).toEqual([{ index: 0, size: 4 }]);
  });

  it('does the same on collapseAllGroups() with the place on a row of a later page', () => {
    const onPage = vi.fn();
    const gridRef = createRef<DataGridHandle>();
    render(<Paged gridRef={gridRef} onPageChange={onPage} />);
    focusOn(cellOf(dataRows()[0]!));
    act(() => gridRef.current!.collapseAllGroups());
    // Four groups are four rows: one page, with the group the place was inside.
    expect(screen.getByText('1–4 of 4')).toBeInTheDocument();
    expect(document.activeElement).toBe(group('Delivered'));
    expect(pageCalls(onPage)).toEqual([{ index: 0, size: 4 }]);
  });

  it('keeps the page when the place is not in the group that closes', () => {
    const onPage = vi.fn();
    render(<Paged onPageChange={onPage} />);
    focusOn(cellOf(dataRows()[1]!));
    expect(dataRows()[1]!.textContent).toContain('DH-6');
    fireEvent.click(group('New'));
    expect(onPage).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(group('New'));
  });

  it('keeps the page when a group opens, whatever page its row is on', () => {
    const onPage = vi.fn();
    render(
      <Orders
        grouping={BY_STATUS}
        paging={{ pageSize: 2, pageSizes: [2] }}
        defaultPage={{ index: 1, size: 2 }}
        defaultExpandedGroups={CLOSED}
        onPageChange={onPage}
      />,
    );
    // Closed, the four groups are two pages: New and Processing are the second.
    const closed = group('New');
    focusOn(closed);
    expect(press(closed, 'ArrowRight')).toBe(true);
    expect(group('New')).toHaveAttribute('aria-expanded', 'true');
    expect(onPage).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(group('New'));
  });
});
