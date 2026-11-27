import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridGroupItem, DataGridProps, DataGridSummary } from './index';

// The totals (spec phase 6 §3.5 steps 6-7, §3.6 "Hàng tổng là một hàng của grid", §4.3 R1 "Hàng nhóm" and
// "Tổng cuối bảng", §5, §6.3 "Tổng"): the totals on the group rows, the footer, what it adds up (every
// row after the filter, of every page, the closed groups' too), how each total is written, server mode, the
// warnings, and the footer as a row of the keyboard. What needs a layout engine (a footer that sticks, the
// rows kept clear of it, pinned cells over scrolled ones) is proven in the stories.

beforeEach(() => {
  resetDevWarnings();
  HTMLElement.prototype.checkVisibility = () => true;
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  vi.restoreAllMocks();
});

interface Order {
  id: string;
  status: string;
  assignee: string | null;
  qty: number;
  price: number;
}

const ORDERS: Order[] = [
  { id: 'DH-1', status: 'Delivered', assignee: 'An', qty: 5, price: 10 },
  { id: 'DH-2', status: 'Delivered', assignee: 'Bình', qty: 3, price: 20.5 },
  { id: 'DH-3', status: 'Processing', assignee: 'An', qty: 2, price: 5 },
  { id: 'DH-4', status: 'Processing', assignee: null, qty: 4, price: 8.25 },
  { id: 'DH-5', status: 'Processing', assignee: 'Bình', qty: 1, price: 2 },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
  { field: 'status', caption: 'Status', width: 120 },
  { field: 'assignee', caption: 'Assignee', width: 120 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
  {
    field: 'price',
    caption: 'Price',
    dataType: 'number',
    width: 100,
    format: { style: 'currency', currency: 'USD' },
  },
];

const BY_STATUS: DataGridGroupItem[] = [{ field: 'status', direction: 'asc' }];

// What R1 asks for: a count under the first column, the sum under Qty, the sum of the prices.
const FOOTER: DataGridSummary<Order> = {
  total: [
    { column: 'id', type: 'count', label: 'Orders' },
    { column: 'qty', type: 'sum' },
    { column: 'price', type: 'sum' },
  ],
};
const GROUPS: DataGridSummary<Order> = {
  group: [
    { column: 'qty', type: 'sum' },
    { column: 'price', type: 'sum' },
  ],
};

function Orders(props: Partial<DataGridProps<Order>>) {
  return (
    <DataGrid
      data={ORDERS}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      {...props}
    />
  );
}

const table = () => document.querySelector<HTMLTableElement>('table[role]')!;
const footer = () => table().tFoot;
const footRow = () => footer()?.rows[0] ?? null;
const footCells = () =>
  Array.from(footRow()?.querySelectorAll<HTMLElement>('.flg-data-grid-foot-cell') ?? []);
const footText = () => footCells().map((cell) => cell.textContent);
const groupRows = () =>
  Array.from(table().querySelectorAll<HTMLTableRowElement>('tbody > tr.flg-data-grid-group-row'));
const dataRows = () =>
  Array.from(table().querySelectorAll<HTMLTableRowElement>('tbody > tr.flg-data-grid-row'));
const group = (text: string) => groupRows().find((row) => row.textContent?.includes(text))!;
const cellsText = (row: HTMLTableRowElement) => Array.from(row.cells, (cell) => cell.textContent);
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

describe('the totals of a group row', () => {
  it('writes each total under its column: the label muted, the value, and nothing in the other cells', () => {
    render(<Orders grouping={BY_STATUS} summary={GROUPS} />);
    const row = group('Delivered');
    // The chevron; the caption over Order and Assignee, up to the first total; Qty; Price; the filler.
    expect(cellsText(row)).toEqual(['', 'Status: Delivered (2)', 'Total: 8', 'Total: $30.50', '']);
    expect(row.cells[1]).toHaveAttribute('colspan', '2');
    const [qty] = row.querySelectorAll('.flg-data-grid-summary-cell');
    expect(qty!.querySelector('.flg-data-grid-summary-label')).toHaveTextContent('Total:');
    expect(qty!.querySelector('.flg-data-grid-summary-value')).toHaveTextContent('8');
    expect(qty).toHaveAttribute('data-align', 'end');
    expect(cellsText(group('Processing'))).toEqual([
      '',
      'Status: Processing (3)',
      'Total: 7',
      'Total: $15.25',
      '',
    ]);
  });

  it('says the word of each type, or the label of the item, and writes the value as the item says', () => {
    render(
      <Orders
        grouping={BY_STATUS}
        summary={{
          group: [
            { column: 'qty', type: 'avg' },
            { column: 'price', type: 'max' },
            { column: 'assignee', field: 'qty', type: 'count', label: 'Rows' },
            {
              column: 'qty',
              type: 'min',
              label: 'Least',
              format: (value) => `${String(value)} pcs`,
            },
          ],
        }}
      />,
    );
    // The first total is under Assignee, which is where the caption stops; Qty has two, in the order given.
    expect(cellsText(group('Delivered'))).toEqual([
      '',
      'Status: Delivered (2)',
      'Rows: 2',
      'Average: 4 Least: 3 pcs',
      'Max: $20.50',
      '',
    ]);
  });

  it('writes a total of the first data column in the caption, after the count', () => {
    render(<Orders grouping={BY_STATUS} summary={{ group: [{ column: 'id', type: 'count' }] }} />);
    expect(cellsText(group('Delivered'))).toEqual(['', 'Status: Delivered (2) Count: 2', '']);
    expect(group('Delivered').cells[1]).toHaveAttribute('colspan', '1');
  });

  it('is the total of the rows of each group, nested ones included, and of a blank group too', () => {
    const levels: DataGridGroupItem[] = [
      { field: 'status', direction: 'asc' },
      { field: 'assignee', direction: 'asc' },
    ];
    render(<Orders grouping={levels} summary={GROUPS} />);
    const rows = groupRows().map((row) => row.textContent);
    expect(rows).toEqual([
      expect.stringContaining('Status: Delivered (2)Total: 8Total: $30.50'),
      expect.stringContaining('Assignee: An (1)Total: 5Total: $10.00'),
      expect.stringContaining('Assignee: Bình (1)Total: 3Total: $20.50'),
      expect.stringContaining('Status: Processing (3)Total: 7Total: $15.25'),
      expect.stringContaining('Assignee: An (1)Total: 2Total: $5.00'),
      expect.stringContaining('Assignee: Bình (1)Total: 1Total: $2.00'),
      expect.stringContaining('Assignee: (Blanks) (1)Total: 4Total: $8.25'),
    ]);
  });

  it('stops the caption at the end of the left zone and pins it there, the band going on in a cell', () => {
    render(
      <Orders
        grouping={BY_STATUS}
        summary={GROUPS}
        columns={COLUMNS.map((column) =>
          column.field === 'id' ? { ...column, pinned: 'left' } : column,
        )}
      />,
    );
    const row = group('Delivered');
    expect(cellsText(row)).toEqual([
      '',
      'Status: Delivered (2)',
      '',
      'Total: 8',
      'Total: $30.50',
      '',
    ]);
    expect(row.cells[1]).toHaveAttribute('data-pinned', 'left');
    // The empty cell across the Assignee column is one band cell, not pinned.
    expect(row.cells[2]).not.toHaveAttribute('data-pinned');
    expect(row.cells[2]).toHaveAttribute('aria-hidden', 'true');
  });

  it('leaves out the total of a column that is grouped by or hidden: it has no cell', () => {
    render(
      <Orders grouping={BY_STATUS} summary={{ group: [{ column: 'status', type: 'count' }] }} />,
    );
    expect(cellsText(group('Delivered'))).toEqual(['', 'Status: Delivered (2)']);
  });

  it('follows the filter and the search: the totals are those of the rows that are kept', () => {
    const { rerender } = render(<Orders grouping={BY_STATUS} summary={GROUPS} />);
    rerender(
      <Orders
        grouping={BY_STATUS}
        summary={GROUPS}
        filter={{ columns: { assignee: { operator: '=', value: 'An' } } }}
      />,
    );
    expect(cellsText(group('Delivered'))).toContain('Total: 5');
    expect(cellsText(group('Processing'))).toContain('Total: 2');
  });

  it('is drawn when the group is closed, and its row of totals is the same as open', () => {
    render(<Orders grouping={BY_STATUS} summary={GROUPS} autoExpandAll={false} />);
    expect(dataRows()).toHaveLength(0);
    expect(cellsText(group('Delivered'))).toContain('Total: 8');
  });
});

describe('the footer', () => {
  it("is Table's footer with one row of the totals, each under its column", () => {
    render(<Orders summary={FOOTER} />);
    expect(footer()).toHaveClass('flg-table-footer');
    expect(footRow()).toHaveClass('flg-table-row', 'flg-data-grid-summary-row');
    // R1: "Orders: 12" under Order, the sum under Qty (no label), the sum under Price.
    expect(footText()).toEqual(['Orders: 5', '', '', 'Total of Qty 15', 'Total of Price $45.75']);
    expect(footCells()[0]!.querySelector('.flg-data-grid-summary-label')).toHaveTextContent(
      'Orders:',
    );
    expect(footCells()[3]!.querySelector('.flg-data-grid-summary-label')).toBeNull();
    expect(footCells()[3]!.querySelector('.flg-visually-hidden')).toHaveTextContent('Total of Qty');
    expect(footCells()[3]!.querySelector('.flg-data-grid-summary-value')).toHaveTextContent('15');
    expect(footCells()[3]).toHaveAttribute('data-align', 'end');
  });

  it('labels a total whose type is not a sum, and a function type has only its column as hidden words', () => {
    render(
      <Orders
        summary={{
          total: [
            { column: 'qty', type: 'avg' },
            { column: 'price', type: 'max' },
            { column: 'id', type: (rows) => `${rows.length} rows` },
          ],
        }}
      />,
    );
    expect(footText()).toEqual(['Order 5 rows', '', '', 'Average: 3', 'Max: $20.50']);
    expect(footCells()[0]!.querySelector('.flg-visually-hidden')).toHaveTextContent('Order');
    expect(footCells()[0]!.querySelector('.flg-data-grid-summary-label')).toBeNull();
  });

  it('adds up every row after the filter, of every page', () => {
    const { rerender } = render(<Orders summary={FOOTER} paging={{ pageSize: 2 }} />);
    // Two rows are on the page; the footer is about all five.
    expect(dataRows()).toHaveLength(2);
    expect(footText()[0]).toBe('Orders: 5');
    expect(footText()[3]).toContain('15');
    rerender(
      <Orders
        summary={FOOTER}
        filter={{ columns: { status: { operator: '=', value: 'Delivered' } } }}
        paging={{ pageSize: 2 }}
      />,
    );
    expect(footText()).toEqual(['Orders: 2', '', '', 'Total of Qty 8', 'Total of Price $30.50']);
  });

  it('adds up the rows of closed groups, which are not on the page', () => {
    render(
      <Orders
        summary={FOOTER}
        grouping={BY_STATUS}
        autoExpandAll={false}
        paging={{ pageSize: 2 }}
      />,
    );
    expect(dataRows()).toHaveLength(0);
    expect(groupRows()).toHaveLength(2);
    expect(footText()[0]).toBe('Orders: 5');
    expect(footText()[2]).toContain('15');
  });

  it('adds up the search too, and the rows of a grid with a grouping the same as without one', () => {
    render(<Orders summary={FOOTER} grouping={BY_STATUS} filter={{ search: 'Bình' }} />);
    // Status is grouped by, so it has no column: Qty is the third.
    expect(footText()[0]).toBe('Orders: 2');
    expect(footText()[2]).toContain('4');
  });

  it('stays when the filter keeps no row, and goes only while the first rows load', () => {
    const { rerender } = render(
      <Orders
        summary={FOOTER}
        filter={{ columns: { status: { operator: '=', value: 'Nothing' } } }}
      />,
    );
    expect(dataRows()).toHaveLength(0);
    expect(footText()).toEqual(['Orders: 0', '', '', 'Total of Qty 0', 'Total of Price $0.00']);
    rerender(<Orders summary={FOOTER} data={[]} loading />);
    expect(table().tFoot).toBeNull();
    rerender(<Orders summary={FOOTER} data={[]} loading={false} />);
    expect(footer()).not.toBeNull();
    // With rows the footer stays while they reload.
    rerender(<Orders summary={FOOTER} loading />);
    expect(footer()).not.toBeNull();
  });

  it("is not drawn without items of the footer, and is the group totals' alone with items of the groups", () => {
    const { rerender } = render(<Orders />);
    expect(footer()).toBeNull();
    rerender(<Orders summary={GROUPS} />);
    expect(footer()).toBeNull();
    rerender(<Orders summary={{ total: [] }} />);
    expect(footer()).toBeNull();
  });

  it('spans the group indents with one empty cell, and has a cell for the box column', () => {
    render(<Orders summary={FOOTER} grouping={BY_STATUS} selectionMode="multiple" />);
    const indent = footRow()!.querySelector('.flg-data-grid-indent')!;
    expect(indent).toHaveAttribute('colspan', '1');
    expect(indent).not.toHaveAttribute('tabindex');
    // The box column's cell is a place of the keyboard, and empty.
    expect(footCells()).toHaveLength(5);
    expect(footCells()[0]).toHaveTextContent('');
    expect(footCells()[1]).toHaveTextContent('Orders: 5');
  });

  it('writes a total in the locale of the grid', () => {
    render(<Orders summary={FOOTER} locale="vi-VN" />);
    expect(footText()[3]).toContain('15');
    render(
      <Orders
        summary={{
          total: [{ column: 'price', type: 'sum', format: { minimumFractionDigits: 3 } }],
        }}
        locale="vi-VN"
      />,
    );
    expect(
      Array.from(document.querySelectorAll('.flg-data-grid-summary-value')).at(-1),
    ).toHaveTextContent('45,750');
  });

  it('writes a total of a column whose format is a function by the format of the item, else the locale', () => {
    const columns: DataGridColumn<Order>[] = COLUMNS.map((column) =>
      column.field === 'price'
        ? { ...column, format: (value: unknown) => `<${String(value)}>` }
        : column,
    );
    const { rerender } = render(
      <Orders columns={columns} summary={{ total: [{ column: 'price', type: 'sum' }] }} />,
    );
    expect(footCells()[4]).toHaveTextContent('45.75');
    rerender(
      <Orders
        columns={columns}
        summary={{
          total: [{ column: 'price', type: 'sum', format: (value) => `= ${String(value)}` }],
        }}
      />,
    );
    expect(footCells()[4]).toHaveTextContent('= 45.75');
    // The least or greatest is the text of the row that holds it, which the column's function writes.
    rerender(<Orders columns={columns} summary={{ total: [{ column: 'price', type: 'max' }] }} />);
    expect(footCells()[4]).toHaveTextContent('Max: <20.5>');
  });

  it('has the words of the labels the caller gives, merged by type', () => {
    render(
      <Orders
        summary={{
          total: [
            { column: 'qty', type: 'avg' },
            { column: 'price', type: 'sum', label: 'Sum' },
          ],
        }}
        labels={{
          summary: { avg: 'Mean' },
          summaryLabel: (label) => `${label} =`,
          summaryOf: (type, caption) => `${caption} (${type})`,
        }}
      />,
    );
    expect(footText().slice(3)).toEqual(['Mean = 3', 'Sum = $45.75']);
  });

  it('says the hidden words of a sum from labels.summaryOf and labels.summary', () => {
    render(
      <Orders
        summary={{ total: [{ column: 'qty', type: 'sum' }] }}
        labels={{ summary: { sum: 'Sum' }, summaryOf: (type, caption) => `${type} for ${caption}` }}
      />,
    );
    expect(footCells()[3]!.querySelector('.flg-visually-hidden')).toHaveTextContent('Sum for Qty');
  });

  it('names in its hidden words the column an item reads, and the column a function type stands under', () => {
    render(
      <Orders
        summary={{
          total: [
            { column: 'price', field: 'qty', type: 'sum', id: 'read' },
            { column: 'price', type: () => 1, id: 'own' },
          ],
        }}
      />,
    );
    const hidden = Array.from(footCells()[4]!.querySelectorAll('.flg-visually-hidden'), (node) =>
      node.textContent?.trim(),
    );
    // It sums Qty, though it stands under Price; a function type is no sum of anything the grid knows.
    expect(hidden).toEqual(['Total of Qty', 'Price']);
  });

  it('draws the sum of a summary that changes, and not a total of the rows that were', () => {
    const { rerender } = render(<Orders summary={FOOTER} />);
    expect(footText()[3]).toContain('15');
    rerender(<Orders summary={{ total: [{ column: 'qty', type: 'max' }] }} />);
    expect(footText()[3]).toBe('Max: 5');
    expect(footText()[0]).toBe('');
  });

  it('writes the total of a locale that changed, with the words of the new one', () => {
    const { rerender } = render(<Orders summary={FOOTER} locale="en-US" />);
    expect(footText()[4]).toContain('$45.75');
    rerender(<Orders summary={FOOTER} locale="de-DE" />);
    expect(footText()[4]).toContain('45,75');
  });
});

describe('the items', () => {
  it('keeps the first of two items with one id and warns once, for the footer and for the groups', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Orders
        grouping={BY_STATUS}
        summary={{
          total: [
            { id: 'a', column: 'qty', type: 'sum' },
            { id: 'a', column: 'price', type: 'sum' },
          ],
          group: [
            { column: 'qty', type: 'sum' },
            { column: 'qty', type: 'sum', label: 'Again' },
          ],
        }}
      />,
    );
    expect(footText()).toEqual(['', '', 'Total of Qty 15', '']);
    expect(cellsText(group('Delivered'))).toContain('Total: 8');
    expect(group('Delivered').textContent).not.toContain('Again');
    const said = warn.mock.calls.filter(([text]) => String(text).includes('same id'));
    expect(said).toHaveLength(1);
    expect(String(said[0]![0])).toContain(
      '<DataGrid> two summary items have the same id (the id they have, else type and field); the second is left out: give the item an id.',
    );
  });

  it('says in its own words why an item is left out: no column, no type', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Orders
        summary={{
          total: [
            { column: 'nothing', type: 'sum' },
            { column: 'qty', type: 'median' as unknown as 'sum' },
          ],
        }}
      />,
    );
    const texts = warn.mock.calls.map(([text]) => String(text));
    const about = (part: string) => texts.filter((text) => text.includes(part));
    expect(about('names a column the grid does not have')).toHaveLength(1);
    expect(about('has no usable type')).toHaveLength(1);
    expect(about('has no usable type')[0]).toContain("'count', 'sum', 'avg', 'min', 'max'");
  });

  it('draws nothing for an item that names no column, and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(
      <Orders
        summary={{
          total: [
            { column: 'nothing', type: 'sum' },
            { column: 'qty', type: 'sum', field: 'nothing' },
            { column: 'qty', type: 'count' },
          ],
        }}
      />,
    );
    expect(footText()[3]).toContain('5');
    rerender(<Orders summary={{ total: [{ column: 'nothing', type: 'sum' }] }} />);
    const said = warn.mock.calls.filter(([text]) => String(text).includes('names a column'));
    expect(said).toHaveLength(1);
    expect(String(said[0]![0])).toContain(
      '<DataGrid> a summary item names a column the grid does not have (its column or its field); it is left out.',
    );
  });

  it('says nothing while the columns have not come, and draws the totals when they do', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const total = { total: [{ column: 'qty', type: 'sum' as const }] };
    const { rerender } = render(<Orders columns={[]} summary={total} />);
    const left = () =>
      warn.mock.calls.filter(([text]) => String(text).includes('names a column')).length;
    expect(left()).toBe(0);
    rerender(<Orders summary={total} />);
    expect(left()).toBe(0);
    expect(footText()[3]).toContain('15');
  });

  it('warns once for a summary and a totalSummary of the wrong shape, and draws what it can', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Orders
        summary={
          {
            total: [{ column: 'qty', type: 'sum' }, 'oops', { type: 'sum' }],
            group: 'no',
          } as unknown as DataGridSummary<Order>
        }
        totalSummary={7 as unknown as Record<string, unknown>}
        remote
        totalCount={5}
      />,
    );
    const texts = warn.mock.calls.map(([text]) => String(text));
    expect(texts.filter((text) => text.includes('summary is not an object'))).toHaveLength(1);
    expect(texts.filter((text) => text.includes('totalSummary is not an object'))).toHaveLength(1);
    // The one item of its kind stays, and has no value from the server.
    expect(footCells()).toHaveLength(5);
    expect(footCells()[3]).toHaveTextContent('');
  });

  it('warns once when the summary is made anew with new functions on every render', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const written = () => (
      <Orders
        summary={{ total: [{ column: 'qty', type: 'sum', format: (value) => String(value) }] }}
      />
    );
    const { rerender } = render(written());
    for (let at = 0; at < 4; at++) rerender(written());
    const said = warn.mock.calls.filter(([text]) => String(text).includes('summary has new'));
    expect(said).toHaveLength(1);
    expect(String(said[0]![0])).toContain('pass a stable summary');
  });

  it('does not warn for a summary of the same words written in the JSX on every render', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const written = () => <Orders summary={{ total: [{ column: 'qty', type: 'sum' }] }} />;
    const { rerender } = render(written());
    for (let at = 0; at < 5; at++) rerender(written());
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('server mode', () => {
  const remote = { remote: true, totalCount: 40 } as const;

  it('writes the totals the server gave, by id, and leaves an id with no value blank', () => {
    render(
      <Orders
        {...remote}
        summary={{
          total: [
            { column: 'id', type: 'count', label: 'Orders' },
            { column: 'qty', type: 'sum' },
            { id: 'cheapest', column: 'price', type: 'min' },
            { column: 'assignee', type: 'max', field: 'price' },
          ],
        }}
        totalSummary={{ 'count:id': 40, 'sum:qty': 1234, cheapest: 2 }}
      />,
    );
    expect(footText()).toEqual(['Orders: 40', '', '', 'Total of Qty 1,234', 'Min: $2.00']);
    // The one with no value says nothing, not even its label.
    expect(footCells()).toHaveLength(5);
  });

  it('reads only the ids the object has itself: an id "constructor" holds nothing inherited', () => {
    render(
      <Orders
        {...remote}
        summary={{ total: [{ id: 'constructor', column: 'qty', type: 'sum' }] }}
        totalSummary={{}}
      />,
    );
    expect(footCells()[3]).toHaveTextContent('');
    expect(table().textContent).not.toContain('function');
  });

  it('draws the footer with no totalSummary as blank cells, and the footer of a page of no rows', () => {
    render(<Orders {...remote} data={[]} summary={FOOTER} totalSummary={{ 'sum:qty': 3 }} />);
    expect(footCells()).toHaveLength(5);
    expect(footText()[3]).toContain('3');
  });

  it("draws no group total and warns once; the footer is the server's", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(
      <Orders {...remote} summary={{ ...GROUPS, ...FOOTER }} totalSummary={{ 'sum:qty': 3 }} />,
    );
    rerender(
      <Orders {...remote} summary={{ ...GROUPS, ...FOOTER }} totalSummary={{ 'sum:qty': 4 }} />,
    );
    expect(groupRows()).toHaveLength(0);
    const said = warn.mock.calls.filter(([text]) => String(text).includes('group totals'));
    expect(said).toHaveLength(1);
    expect(String(said[0]![0])).toContain(
      '<DataGrid> remote has no group totals; they are not shown.',
    );
    expect(footText()[3]).toContain('4');
  });

  it('does not total the page itself', () => {
    render(<Orders {...remote} summary={FOOTER} totalSummary={undefined} />);
    expect(footText()).toEqual(['', '', '', '', '']);
  });
});

describe('the footer as a row of the keyboard', () => {
  const lastRow = () => dataRows().at(-1)!;

  it('has one Tab stop in the grid, which stays in a cell of a row and not in the footer', () => {
    render(<Orders summary={FOOTER} />);
    expect(stops()).toHaveLength(1);
    expect(footCells().filter((cell) => cell.tabIndex === 0)).toHaveLength(0);
    expect(footCells().every((cell) => cell.tabIndex === -1)).toBe(true);
  });

  it('is reached by ArrowDown from the last row, in the column the place was in, and left by ArrowUp', () => {
    render(<Orders summary={FOOTER} />);
    focusOn(lastRow().cells[3]!);
    expect(press(lastRow().cells[3]!, 'ArrowDown')).toBe(true);
    expect(document.activeElement).toBe(footCells()[3]);
    expect(stops()).toEqual([footCells()[3]]);
    // Nowhere further down.
    press(footCells()[3]!, 'ArrowDown');
    expect(document.activeElement).toBe(footCells()[3]);
    expect(press(footCells()[3]!, 'ArrowUp')).toBe(true);
    expect(document.activeElement).toBe(lastRow().cells[3]);
    expect(stops()).toEqual([lastRow().cells[3]]);
  });

  it('goes along it with the arrows, Home and End, and stops at its ends', () => {
    render(<Orders summary={FOOTER} />);
    focusOn(lastRow().cells[0]!);
    press(lastRow().cells[0]!, 'ArrowDown');
    press(footCells()[0]!, 'ArrowRight');
    expect(document.activeElement).toBe(footCells()[1]);
    press(footCells()[1]!, 'End');
    expect(document.activeElement).toBe(footCells()[4]);
    press(footCells()[4]!, 'ArrowRight');
    expect(document.activeElement).toBe(footCells()[4]);
    press(footCells()[4]!, 'Home');
    expect(document.activeElement).toBe(footCells()[0]);
    press(footCells()[0]!, 'ArrowLeft');
    expect(document.activeElement).toBe(footCells()[0]);
  });

  it('is left by mod+End and PageDown at the last row of the body, and mod+Home goes to the first', () => {
    render(<Orders summary={FOOTER} />);
    focusOn(dataRows()[0]!.cells[1]!);
    press(dataRows()[0]!.cells[1]!, 'End', { ctrlKey: true });
    expect(document.activeElement).toBe(lastRow().cells[4]);
    press(lastRow().cells[4]!, 'ArrowDown');
    expect(document.activeElement).toBe(footCells()[4]);
    // Nothing of these two takes the place off the footer or on to it.
    press(footCells()[4]!, 'PageDown');
    expect(document.activeElement).toBe(footCells()[4]);
    press(footCells()[4]!, 'Home', { ctrlKey: true });
    expect(document.activeElement).toBe(dataRows()[0]!.cells[0]);
    focusOn(dataRows()[1]!.cells[2]!);
    // A page key at the last row of the body goes nowhere, and not to the footer.
    focusOn(lastRow().cells[2]!);
    press(lastRow().cells[2]!, 'PageDown');
    expect(document.activeElement).toBe(lastRow().cells[2]);
  });

  it('does nothing on Enter and F2, and cancels Space', () => {
    const onRowActivate = vi.fn();
    render(<Orders summary={FOOTER} onRowActivate={onRowActivate} selectionMode="multiple" />);
    focusOn(lastRow().cells[2]!);
    press(lastRow().cells[2]!, 'ArrowDown');
    const cell = footCells()[2]!;
    expect(document.activeElement).toBe(cell);
    expect(press(cell, 'Enter')).toBe(false);
    expect(press(cell, 'F2')).toBe(false);
    expect(press(cell, ' ')).toBe(true);
    expect(onRowActivate).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(cell);
    expect(screen.queryAllByRole('checkbox', { checked: true })).toHaveLength(0);
  });

  it('is a place of the pointer too: a press on a cell of it makes it the active one', () => {
    render(<Orders summary={FOOTER} />);
    focusOn(footCells()[3]!);
    expect(stops()).toEqual([footCells()[3]]);
    fireEvent.mouseDown(footCells()[1]!);
    expect(stops()).toEqual([footCells()[1]]);
  });

  it('is no place when the grid has no row: the empty cell stays the one place of the body', () => {
    render(
      <Orders
        summary={FOOTER}
        filter={{ columns: { status: { operator: '=', value: 'Nothing' } } }}
      />,
    );
    expect(footCells().every((cell) => cell.tabIndex === -1)).toBe(true);
    const title = table().querySelector<HTMLElement>('thead th[tabindex]')!;
    focusOn(title);
    press(title, 'ArrowDown');
    expect(document.activeElement?.closest('tfoot')).toBeNull();
  });

  it('gives the place back to the last row when the footer goes, and keeps it in the footer across a filter', () => {
    const { rerender } = render(<Orders summary={FOOTER} />);
    focusOn(lastRow().cells[3]!);
    press(lastRow().cells[3]!, 'ArrowDown');
    rerender(
      <Orders
        summary={FOOTER}
        filter={{ columns: { status: { operator: '=', value: 'Delivered' } } }}
      />,
    );
    expect(stops()).toEqual([footCells()[3]]);
    rerender(<Orders summary={undefined} />);
    expect(footer()).toBeNull();
    expect(stops()).toHaveLength(1);
    expect(stops()[0]!.closest('tbody')).not.toBeNull();
  });

  it('is reached from a group row by ArrowDown from the last row of the list', () => {
    render(<Orders summary={FOOTER} grouping={BY_STATUS} autoExpandAll={false} />);
    const last = groupRows().at(-1)!;
    focusOn(last);
    press(last, 'ArrowDown');
    expect(document.activeElement).toBe(footCells()[0]);
    press(footCells()[0]!, 'ArrowUp');
    expect(document.activeElement).toBe(last);
  });
});

describe('the rows of a virtual grid', () => {
  it('counts the footer in aria-rowcount and gives it the last aria-rowindex', () => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('flg-table-frame') ? 300 : 0;
    });
    const { rerender } = render(
      <Orders summary={FOOTER} scrolling="virtual" height={300} paging={false} />,
    );
    // The heading's row and five of data, and the footer: seven.
    expect(table()).toHaveAttribute('aria-rowcount', '7');
    expect(footRow()).toHaveAttribute('aria-rowindex', '7');
    rerender(<Orders scrolling="virtual" height={300} />);
    expect(table()).toHaveAttribute('aria-rowcount', '6');
  });

  it('has no aria-rowcount or aria-rowindex in a grid that draws every row', () => {
    render(<Orders summary={FOOTER} />);
    expect(table()).not.toHaveAttribute('aria-rowcount');
    expect(footRow()).not.toHaveAttribute('aria-rowindex');
  });
});
