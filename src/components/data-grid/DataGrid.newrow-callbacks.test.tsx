import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridProps } from './index';

// The functions of the app that are given a row (spec phase 6 §6.3, PR #46 R1): a new row holds only the fields
// `initNewRow()` gave and the ones typed, so a function typed for a whole row can throw on it. The ones a new row
// reaches (`value`, `format`, `cell`, `rowClassName`, `allowEditing`) are caught: the grid warns once and draws a
// blank; the others are never given a new row.

let showing: Set<Element>;
beforeEach(() => {
  resetDevWarnings();
  showing = new Set();
  HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
    showing.add(this);
  };
  HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
    showing.delete(this);
  };
  Element.prototype.scrollIntoView = () => {};
  const matches = Element.prototype.matches;
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
    this: Element,
    selector: string,
  ) {
    return selector === ':popover-open' ? showing.has(this) : matches.call(this, selector);
  });
  HTMLElement.prototype.checkVisibility = () => true;
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
  customer: string;
  qty: number;
}

const ORDERS: Order[] = [
  { id: 'DH-1', customer: 'An', qty: 3 },
  { id: 'DH-2', customer: 'Bình', qty: 5 },
];

const ID: DataGridColumn<Order> = {
  field: 'id',
  caption: 'Order',
  rowHeader: true,
  allowEditing: false,
  width: 100,
};
const CUSTOMER: DataGridColumn<Order> = { field: 'customer', caption: 'Customer', width: 140 };
const QTY: DataGridColumn<Order> = { field: 'qty', caption: 'Qty', dataType: 'number', width: 100 };

function Orders(props: Partial<DataGridProps<Order>>) {
  return (
    <DataGrid
      data={ORDERS}
      rowKey="id"
      columns={[ID, CUSTOMER, QTY]}
      caption="Orders"
      paging={false}
      editing={{ mode: 'cell', allowAdding: true }}
      onSaving={() => {}}
      {...props}
    />
  );
}

const addRow = () => act(() => screen.getByRole('button', { name: 'Add row' }).click());
const newRow = () => document.querySelector<HTMLTableRowElement>('tr[data-new]');
const warned = (spy: { mock: { calls: unknown[][] } }): string[] =>
  spy.mock.calls.map((call) => String(call[0]));
// A function typed for a whole row that reads a field a new row does not have.
const needsCustomer = (row: Order): string => row.customer.toUpperCase();

describe('a function that throws on a new row is caught', () => {
  const cases: [string, Partial<DataGridProps<Order>>, string][] = [
    [
      'a column value',
      { columns: [ID, CUSTOMER, { id: 'name', caption: 'Name', value: needsCustomer }] },
      'a column value, format or cell, a rowClassName or a custom total threw on a new row',
    ],
    [
      // A format is asked for a value that is there: `initNewRow()` gives the quantity, not the customer.
      'a column format',
      {
        columns: [ID, CUSTOMER, { ...QTY, format: (_value, row) => needsCustomer(row) }],
        initNewRow: () => ({ qty: 2 }),
      },
      'a column value, format or cell, a rowClassName or a custom total threw on a new row',
    ],
    [
      'a column cell',
      {
        columns: [ID, CUSTOMER, { ...QTY, cell: (ctx) => needsCustomer(ctx.row) }],
        initNewRow: () => ({ qty: 2 }),
      },
      'a column value, format or cell, a rowClassName or a custom total threw on a new row',
    ],
    [
      'rowClassName',
      { rowClassName: (row) => (needsCustomer(row) === '' ? 'empty' : undefined) },
      'a column value, format or cell, a rowClassName or a custom total threw on a new row',
    ],
    [
      'a column allowEditing',
      { columns: [ID, { ...CUSTOMER, allowEditing: (row) => needsCustomer(row) !== '' }] },
      'a column allowEditing threw: the cell cannot be edited.',
    ],
  ];

  it.each(cases)('%s: nothing escapes, one warning, and the row is there', (_name, props, text) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Orders {...props} />);
    addRow();
    expect(newRow()).not.toBeNull();
    // Drawn again with the same words: warned once, not once per draw.
    fireEvent.focus(newRow()!);
    expect(warned(warn).filter((message) => message.includes(text))).toHaveLength(1);
  });
});

describe('a function that is never given a new row', () => {
  const noField = (rows: Order[], row: Order) => {
    if (row.id === undefined) rows.push(row);
  };

  it('is not asked for its sort value, its detail, its activation or its permissions', () => {
    const seen: Order[] = [];
    const { rerender } = render(
      <Orders
        columns={[ID, { ...CUSTOMER, sortValue: (row) => (noField(seen, row), row.customer) }, QTY]}
        defaultSort={[{ field: 'customer', direction: 'asc' }]}
        renderDetail={(row) => (noField(seen, row), (<span>detail</span>))}
        rowHasDetail={(row) => (noField(seen, row), true)}
        defaultExpandedRows={['DH-1']}
        onRowActivate={(row) => noField(seen, row)}
        editing={{
          mode: 'cell',
          allowAdding: true,
          allowUpdating: (row) => (noField(seen, row), true),
          allowDeleting: (row) => (noField(seen, row), true),
        }}
      />,
    );
    addRow();
    const added = newRow()!;
    fireEvent.click(added.querySelector('td, th')!);
    fireEvent.keyDown(added.querySelector('td, th')!, { key: 'Enter' });
    act(() => screen.getByRole('button', { name: 'Delete (new)' }).click());
    expect(newRow()).toBeNull();
    addRow();
    rerender(<Orders />);
    expect(seen).toEqual([]);
  });
});
