import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { createRef, useEffect, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridHandle, DataGridState } from './index';

// The saved-state recipe of `DataGrid.mdx` ("Saving the state", spec phase 6 §6.3 "Lưu trạng thái"), written here
// exactly as the page writes it, and what it does through the grid. The grid has no `stateStoring`: an app keeps
// the state in `onStateChange` and gives it back as the `default*` props. Most cases are characterizations of what
// the grid already does, so they pass on the first run.

interface Order {
  id: string;
  customer: string;
  status: string;
  qty: number;
}

const STATUSES = ['new', 'processing', 'delivered'];
const ORDERS: Order[] = Array.from({ length: 12 }, (_, index) => ({
  id: `DH-${1000 + index}`,
  customer: `Customer ${index + 1}`,
  status: STATUSES[index % 3]!,
  qty: ((index * 5) % 9) + 1,
}));

const columns: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
  { field: 'customer', caption: 'Customer', width: 160 },
  { field: 'status', caption: 'Status', width: 120 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
];

// --- The recipe, as `DataGrid.mdx` writes it (its imports come from 'h2d-glass-ui' there). ---
const KEY = 'orders-grid-v1';

function OrdersGrid({ data }: { data: Order[] }) {
  const [saved, setSaved] = useState<Partial<DataGridState> | null>(null);
  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
    } catch {
      // Private mode or text that is no JSON: the default state stays.
    }
  }, []);
  return (
    <DataGrid
      key={saved ? 'saved' : 'default'}
      data={data}
      rowKey="id"
      columns={columns}
      caption="Orders"
      defaultSort={saved?.sort}
      defaultFilter={saved?.filter}
      defaultGrouping={saved?.grouping}
      defaultColumnLayout={saved?.columnLayout}
      defaultPage={saved?.page}
      onStateChange={({ sort, filter, grouping, columnLayout, page }) => {
        try {
          localStorage.setItem(KEY, JSON.stringify({ sort, filter, grouping, columnLayout, page }));
        } catch {
          // Private mode or a full storage: the state is not kept, the grid goes on.
        }
      }}
    />
  );
}
// --- End of the recipe. ---

beforeEach(() => {
  resetDevWarnings();
  localStorage.removeItem(KEY);
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.removeItem(KEY);
});

const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
const head = (caption: string) =>
  Array.from(document.querySelectorAll<HTMLElement>('thead th')).find((th) =>
    th.textContent?.startsWith(caption),
  );
const sortButton = (caption: string) => head(caption)!.querySelector('button')!;
const pageInfo = () => document.querySelector('.flg-data-grid-page-info')?.textContent;
const ids = () =>
  Array.from(document.querySelectorAll('tbody > tr.flg-data-grid-row'), (row) =>
    row.children[0]!.textContent?.trim(),
  );

describe('the saved-state recipe', () => {
  it('shows the default state when nothing is stored', () => {
    render(<OrdersGrid data={ORDERS} />);
    expect(head('Qty')).not.toHaveAttribute('aria-sort');
    expect(head('Customer')).toBeInTheDocument();
    expect(ids()).toHaveLength(12);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('stores the five parts, and nothing else, when a press sorts', () => {
    render(<OrdersGrid data={ORDERS} />);
    fireEvent.click(sortButton('Qty'));
    const stored = JSON.parse(localStorage.getItem(KEY)!);
    expect(Object.keys(stored).sort()).toEqual([
      'columnLayout',
      'filter',
      'grouping',
      'page',
      'sort',
    ]);
    expect(stored.sort).toEqual([{ field: 'qty', direction: 'asc' }]);
    expect(head('Qty')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('shows a stored state after the effect: the sort, a hidden column, the grouping and the page', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        sort: [{ field: 'qty', direction: 'desc' }],
        grouping: [{ field: 'status', direction: 'asc' }],
        columnLayout: { hidden: ['customer'] },
        page: { index: 1, size: 5 },
      }),
    );
    render(<OrdersGrid data={ORDERS} />);
    expect(head('Qty')).toHaveAttribute('aria-sort', 'descending');
    expect(head('Customer')).toBeUndefined();
    expect(screen.getByRole('treegrid')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    expect(pageInfo()).toMatch(/^6–10 of/);
  });

  it('takes a column that is gone, and one that is new, without a word', () => {
    const warn = spyWarn();
    localStorage.setItem(
      KEY,
      JSON.stringify({
        sort: [
          { field: 'gone', direction: 'asc' },
          { field: 'qty', direction: 'desc' },
        ],
        grouping: [{ field: 'gone', direction: 'asc' }],
        filter: { columns: { gone: { operator: '=', value: 1 } } },
        columnLayout: { order: ['gone', 'qty', 'id'], hidden: ['gone'] },
        page: { index: 40, size: 5 },
      }),
    );
    render(<OrdersGrid data={ORDERS} />);
    expect(warn).not.toHaveBeenCalled();
    expect(head('Qty')).toHaveAttribute('aria-sort', 'descending');
    // The ids it names come first, the one it does not name is appended, the one that is gone is dropped.
    const captions = Array.from(document.querySelectorAll('thead th'), (th) =>
      th.textContent?.trim(),
    );
    expect(captions.filter(Boolean)).toEqual(['Qty', 'Order', 'Customer', 'Status']);
    // A page past the end is the last one.
    expect(pageInfo()).toMatch(/^11–12 of 12/);
  });

  it('is the default for text that is no JSON, and throws nothing', () => {
    const warn = spyWarn();
    localStorage.setItem(KEY, '{');
    expect(() => render(<OrdersGrid data={ORDERS} />)).not.toThrow();
    expect(head('Qty')).not.toHaveAttribute('aria-sort');
    expect(ids()).toHaveLength(12);
    expect(warn).not.toHaveBeenCalled();
  });

  it('is the default sort, with one shape warning, for a state of the wrong shape', () => {
    const warn = spyWarn();
    localStorage.setItem(KEY, JSON.stringify({ sort: 5 }));
    render(<OrdersGrid data={ORDERS} />);
    expect(head('Qty')).not.toHaveAttribute('aria-sort');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('defaultSort is not an array of sort items');
  });

  it('goes on when the storage throws, on a read and on a write', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(() => render(<OrdersGrid data={ORDERS} />)).not.toThrow();
    expect(() => fireEvent.click(sortButton('Qty'))).not.toThrow();
    expect(set).toHaveBeenCalledOnce();
    expect(head('Qty')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('writes what it reads back: a sorted grid, reloaded, is sorted again', () => {
    const first = render(<OrdersGrid data={ORDERS} />);
    fireEvent.click(sortButton('Qty'));
    fireEvent.click(sortButton('Qty'));
    const sorted = ids();
    first.unmount();
    render(<OrdersGrid data={ORDERS} />);
    expect(head('Qty')).toHaveAttribute('aria-sort', 'descending');
    expect(ids()).toEqual(sorted);
  });

  it('keeps the sort, grouping and filter of a field the grid lacks in the state it gives back', () => {
    const ref = createRef<DataGridHandle>();
    const sort = [
      { field: 'gone', direction: 'asc' as const },
      { field: 'qty', direction: 'desc' as const },
    ];
    const grouping = [{ field: 'gone', direction: 'asc' as const }];
    const filter = { columns: { gone: { operator: '=' as const, value: 1 } } };
    render(
      <DataGrid
        ref={ref}
        data={ORDERS}
        rowKey="id"
        columns={columns}
        caption="Orders"
        defaultSort={sort}
        defaultGrouping={grouping}
        defaultFilter={filter}
      />,
    );
    const state = ref.current!.getState();
    expect(state.sort).toEqual(sort);
    expect(state.grouping).toEqual(grouping);
    expect(state.filter.columns).toEqual(filter.columns);
  });

  it('calls no onStateChange for an edit, and the state has exactly the eight parts', () => {
    const onStateChange = vi.fn();
    // jsdom has no checkVisibility, which the grid asks before it moves the focus into an editor.
    HTMLElement.prototype.checkVisibility = () => true;
    onTestFinished(() => void Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility'));
    const ref = createRef<DataGridHandle>();
    render(
      <DataGrid
        ref={ref}
        data={ORDERS}
        rowKey="id"
        columns={columns}
        caption="Orders"
        editing={{ mode: 'batch' }}
        onSaving={() => {}}
        onStateChange={onStateChange}
      />,
    );
    const cell = Array.from(document.querySelectorAll<HTMLElement>('tbody > tr > td')).find(
      (td) => td.textContent === 'Customer 1',
    )!;
    act(() => cell.click());
    const field = screen.getByLabelText('Customer') as HTMLInputElement;
    act(() => void fireEvent.change(field, { target: { value: 'Hoa' } }));
    act(() => {
      fireEvent(
        field,
        createEvent.keyDown(field, { key: 'Enter', bubbles: true, cancelable: true }),
      );
    });
    expect(document.querySelector('.flg-data-grid-savebar')).not.toBeNull();
    expect(onStateChange).not.toHaveBeenCalled();
    expect(Object.keys(ref.current!.getState()).sort()).toEqual([
      'columnLayout',
      'expandedGroups',
      'expandedRows',
      'filter',
      'grouping',
      'page',
      'selectedKeys',
      'sort',
    ]);
  });

  it('renders on the server the HTML of the default grid', () => {
    localStorage.setItem(KEY, JSON.stringify({ sort: [{ field: 'qty', direction: 'asc' }] }));
    const defaults = renderToString(
      <DataGrid data={ORDERS} rowKey="id" columns={columns} caption="Orders" />,
    );
    // Effects do not run on the server and the recipe never reads `localStorage` in a render: the stored
    // sort is not in the HTML.
    expect(renderToString(<OrdersGrid data={ORDERS} />)).toBe(defaults);
  });
});
