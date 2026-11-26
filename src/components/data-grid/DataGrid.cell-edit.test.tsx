import { createRef } from 'react';
import type { Ref } from 'react';
import { act, createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridChange, DataGridColumn, DataGridHandle, DataGridProps } from './index';

// Cell mode (spec phase 6 §6.3 "Năm chế độ", "Chế độ `cell` khi Promise đang chờ", §3.6): the cell that is the one
// editor, the ways to start, `Tab` across the rows, one `onSaving` for each commit, and the queue while a save is
// pending. What needs a real engine (focus in a browser, the look) is proven in the stories.

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
  status: number | null;
  qty: number | null;
  paid: boolean;
  price: number;
}

const STATUSES = [
  { id: 1, name: 'New' },
  { id: 2, name: 'Processing' },
];

const ORDERS: Order[] = [
  { id: 'DH-1', customer: 'An', status: 1, qty: 3, paid: false, price: 10 },
  { id: 'DH-2', customer: 'Bình', status: 2, qty: 5, paid: true, price: 20 },
  { id: 'DH-3', customer: 'Chi', status: 1, qty: 1, paid: false, price: 30 },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, allowEditing: false, width: 100 },
  { field: 'customer', caption: 'Customer', width: 140 },
  {
    field: 'status',
    caption: 'Status',
    width: 140,
    lookup: { items: STATUSES, valueField: 'id', displayField: 'name' },
  },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 100 },
  { field: 'paid', caption: 'Paid', dataType: 'boolean', width: 80 },
  {
    id: 'total',
    caption: 'Total',
    dataType: 'number',
    width: 100,
    value: (row) => row.price * (row.qty ?? 0),
  },
];

const REQUIRED: DataGridColumn<Order>[] = COLUMNS.map((column) =>
  column.field === 'customer'
    ? { ...column, validationRules: [{ type: 'required' as const }] }
    : column,
);

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
      editing={{ mode: 'cell' }}
      onSaving={() => {}}
      {...props}
    />
  );
}

const table = () => document.querySelector<HTMLTableElement>('table[role]')!;
const dataRows = () =>
  Array.from(table().querySelectorAll<HTMLTableRowElement>('tbody > tr.flg-data-grid-row'));
const rowOf = (name: string) => dataRows().find((row) => row.textContent?.includes(name))!;
const cellOf = (row: HTMLElement, caption: string): HTMLElement => {
  const heads = Array.from(table().querySelectorAll('thead th')).map((head) => head.textContent);
  return Array.from(row.querySelectorAll<HTMLElement>(':scope > td, :scope > th')).filter(
    (cell) => !cell.classList.contains('flg-data-grid-filler'),
  )[heads.filter((head) => head !== '').indexOf(caption)]!;
};
const cell = (name: string, caption: string) => cellOf(rowOf(name), caption);
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
const focusOn = (element: HTMLElement) => act(() => element.focus());
const clickOn = (element: HTMLElement) => act(() => void fireEvent.click(element));
const editors = () => Array.from(table().querySelectorAll<HTMLElement>('td[data-editor]'));
const input = (label: string) => within(table()).getByLabelText(label) as HTMLInputElement;
const type = (label: string, text: string) =>
  act(() => void fireEvent.change(input(label), { target: { value: text } }));
const sentAt = (spy: ReturnType<typeof vi.fn>, call = 0): DataGridChange<Order>[] =>
  spy.mock.calls[call]![0] as DataGridChange<Order>[];
/** A promise the test settles. */
function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const flush = () => act(async () => {});

describe('the cell that is edited', () => {
  it('is the one editor: a cell with data-editing, no editing row, no side lines, no buttons of a row', () => {
    render(<Orders />);
    focusOn(cell('DH-2', 'Customer'));
    clickOn(cell('DH-2', 'Customer'));
    expect(editors()).toEqual([cell('DH-2', 'Customer')]);
    expect(cell('DH-2', 'Customer')).toHaveAttribute('data-editing');
    expect(table().querySelector('tr[data-editing]')).toBeNull();
    expect(input('Customer')).toHaveFocus();
    expect(input('Customer').value).toBe('Bình');
    expect(screen.queryByRole('button', { name: /^(Edit|Save|Cancel editing)/ })).toBeNull();
  });

  it('draws no column of buttons without allowDeleting, and Delete alone with it', () => {
    const { rerender } = render(<Orders />);
    expect(table().querySelector('.flg-data-grid-actions')).toBeNull();
    rerender(<Orders editing={{ mode: 'cell', allowDeleting: true }} />);
    const buttons = Array.from(
      cellOf(rowOf('DH-1'), 'Actions').querySelectorAll('button'),
      (button) => button.getAttribute('aria-label'),
    );
    expect(buttons).toEqual(['Delete DH-1']);
  });

  it('is not a cell that cannot be edited: a read-only cell, a value column with no setValue, the buttons', () => {
    render(<Orders editing={{ mode: 'cell', allowDeleting: true }} />);
    clickOn(cell('DH-1', 'Order'));
    clickOn(cell('DH-1', 'Total'));
    clickOn(cellOf(rowOf('DH-1'), 'Actions'));
    expect(editors()).toEqual([]);
  });

  it('is not a cell of a row that allowUpdating refuses', () => {
    render(<Orders editing={{ mode: 'cell', allowUpdating: (row) => row.id !== 'DH-2' }} />);
    clickOn(cell('DH-2', 'Customer'));
    expect(editors()).toEqual([]);
    clickOn(cell('DH-1', 'Customer'));
    expect(editors()).toEqual([cell('DH-1', 'Customer')]);
  });
});

describe('starting', () => {
  it('a press does it, chooses no row and activates nothing', () => {
    const onRowActivate = vi.fn();
    const onSelectedKeysChange = vi.fn();
    render(
      <Orders
        selectionMode="single"
        onSelectedKeysChange={onSelectedKeysChange}
        onRowActivate={onRowActivate}
      />,
    );
    const customer = cell('DH-1', 'Customer');
    clickOn(customer);
    act(() => void fireEvent.doubleClick(customer));
    expect(editors()).toEqual([customer]);
    expect(onSelectedKeysChange).not.toHaveBeenCalled();
    expect(onRowActivate).not.toHaveBeenCalled();
    // A press on a cell that cannot be edited is the row's, as before.
    clickOn(cell('DH-2', 'Order'));
    expect(onSelectedKeysChange).toHaveBeenCalledTimes(1);
  });

  it('with startEditAction dblClick the first press only places, and the double press opens one editor', () => {
    render(<Orders editing={{ mode: 'cell', startEditAction: 'dblClick' }} />);
    const customer = cell('DH-1', 'Customer');
    clickOn(customer);
    expect(editors()).toEqual([]);
    act(() => void fireEvent.doubleClick(customer));
    expect(editors()).toEqual([customer]);
    expect(table().querySelectorAll('input[aria-label="Customer"]')).toHaveLength(1);
  });

  it('Enter and F2 keep the value, with the caret at its end', () => {
    render(<Orders />);
    focusOn(cell('DH-1', 'Customer'));
    expect(press(cell('DH-1', 'Customer'), 'Enter')).toBe(true);
    expect(input('Customer')).toHaveFocus();
    expect(input('Customer').value).toBe('An');
    expect(input('Customer').selectionStart).toBe(2);
    press(input('Customer'), 'Escape');
    focusOn(cell('DH-2', 'Qty'));
    press(cell('DH-2', 'Qty'), 'F2');
    expect(input('Qty')).toHaveFocus();
    expect(editors()).toEqual([cell('DH-2', 'Qty')]);
  });

  it('a character replaces the value, and is typed once', () => {
    render(<Orders />);
    focusOn(cell('DH-1', 'Customer'));
    expect(press(cell('DH-1', 'Customer'), 'x')).toBe(true);
    expect(input('Customer')).toHaveFocus();
    expect(input('Customer').value).toBe('x');
  });

  it('a character does nothing on a Select cell, with a modifier, or as an arrow, and Space on text is not one', () => {
    render(<Orders />);
    focusOn(cell('DH-1', 'Status'));
    press(cell('DH-1', 'Status'), 'p');
    expect(editors()).toEqual([]);
    focusOn(cell('DH-1', 'Customer'));
    press(cell('DH-1', 'Customer'), 'x', { ctrlKey: true });
    press(cell('DH-1', 'Customer'), 'x', { metaKey: true });
    press(cell('DH-1', 'Customer'), 'ArrowDown');
    press(cell('DH-1', 'Customer'), ' ');
    expect(editors()).toEqual([]);
  });

  it('a press on a boolean cell toggles and commits it, as Space does: one call, no editor, no row chosen', () => {
    const onSaving = vi.fn();
    const onSelectedKeysChange = vi.fn();
    render(
      <Orders
        onSaving={onSaving}
        selectionMode="single"
        onSelectedKeysChange={onSelectedKeysChange}
      />,
    );
    clickOn(cell('DH-1', 'Paid'));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sentAt(onSaving)).toMatchObject([{ type: 'update', key: 'DH-1', data: { paid: true } }]);
    expect(editors()).toEqual([]);
    expect(onSelectedKeysChange).not.toHaveBeenCalled();
  });

  it('with startEditAction dblClick a boolean cell is toggled by the double press, once', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} editing={{ mode: 'cell', startEditAction: 'dblClick' }} />);
    clickOn(cell('DH-1', 'Paid'));
    expect(onSaving).not.toHaveBeenCalled();
    act(() => void fireEvent.doubleClick(cell('DH-1', 'Paid')));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(editors()).toEqual([]);
  });

  it('Space on a boolean cell toggles and commits it, and chooses no row; on any other cell it chooses', () => {
    const onSaving = vi.fn();
    const onSelectedKeysChange = vi.fn();
    render(
      <Orders
        onSaving={onSaving}
        selectionMode="single"
        onSelectedKeysChange={onSelectedKeysChange}
      />,
    );
    focusOn(cell('DH-1', 'Paid'));
    expect(press(cell('DH-1', 'Paid'), ' ')).toBe(true);
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sentAt(onSaving)).toMatchObject([{ type: 'update', key: 'DH-1', data: { paid: true } }]);
    expect(editors()).toEqual([]);
    expect(onSelectedKeysChange).not.toHaveBeenCalled();
    focusOn(cell('DH-1', 'Customer'));
    press(cell('DH-1', 'Customer'), ' ');
    expect(onSelectedKeysChange).toHaveBeenCalledTimes(1);
  });
});

describe('committing', () => {
  it('Enter sends one update with the changed field, closes the editor and keeps the focus on the cell', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', 'Hoa');
    expect(press(input('Customer'), 'Enter')).toBe(true);
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sentAt(onSaving)).toEqual([
      { type: 'update', key: 'DH-1', data: { customer: 'Hoa' }, row: ORDERS[0] },
    ]);
    expect(editors()).toEqual([]);
    expect(cell('DH-1', 'Customer')).toHaveFocus();
  });

  it('leaving the cell commits it, once, and a value equal to the saved one sends nothing', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', 'Hoa');
    focusOn(cell('DH-3', 'Order'));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(editors()).toEqual([]);
    clickOn(cell('DH-2', 'Customer'));
    type('Customer', 'Khác');
    type('Customer', 'Bình');
    focusOn(cell('DH-3', 'Order'));
    expect(onSaving).toHaveBeenCalledTimes(1);
    clickOn(cell('DH-2', 'Qty'));
    press(input('Qty'), 'Enter');
    expect(onSaving).toHaveBeenCalledTimes(1);
  });

  it('pressing another cell commits the first and opens the second', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', 'Hoa');
    focusOn(cell('DH-2', 'Qty'));
    clickOn(cell('DH-2', 'Qty'));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(editors()).toEqual([cell('DH-2', 'Qty')]);
  });

  it('Esc gives the value back, sends nothing, and keeps the focus on the cell', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', 'Hoa');
    expect(press(input('Customer'), 'Escape')).toBe(true);
    expect(onSaving).not.toHaveBeenCalled();
    expect(editors()).toEqual([]);
    expect(cell('DH-1', 'Customer')).toHaveFocus();
    expect(cell('DH-1', 'Customer')).toHaveTextContent('An');
  });

  it('does not send a commit that fails its rules: the editor stays, with its error', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} columns={REQUIRED} />);
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', '');
    press(input('Customer'), 'Enter');
    expect(onSaving).not.toHaveBeenCalled();
    expect(editors()).toEqual([cell('DH-1', 'Customer')]);
    expect(cell('DH-1', 'Customer')).toHaveAttribute('data-invalid');
    expect(input('Customer')).toHaveFocus();
    expect(input('Customer')).toHaveAccessibleDescription('Customer is required');
  });
});

describe('Tab', () => {
  it('commits the cell and opens the next editable one, across the rows, skipping what cannot be edited', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    clickOn(cell('DH-1', 'Qty'));
    type('Qty', '7');
    expect(press(input('Qty'), 'Tab')).toBe(true);
    expect(onSaving).toHaveBeenCalledTimes(1);
    // Paid is next, then the row below: Order and Total are not editable.
    expect(editors()).toEqual([cell('DH-1', 'Paid')]);
    const box = within(editors()[0]!).getByRole('checkbox');
    expect(box).toHaveFocus();
    press(box, 'Tab');
    expect(editors()).toEqual([cell('DH-2', 'Customer')]);
    expect(input('Customer')).toHaveFocus();
    // Shift+Tab goes back across the row boundary.
    expect(press(input('Customer'), 'Tab', { shiftKey: true })).toBe(true);
    expect(editors()).toEqual([cell('DH-1', 'Paid')]);
  });

  it('at the last editable cell commits, puts the focus on the cell and does not cancel the key', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    focusOn(cell('DH-3', 'Paid'));
    press(cell('DH-3', 'Paid'), 'Enter');
    const box = within(editors()[0]!).getByRole('checkbox');
    act(() => void fireEvent.click(box));
    expect(press(box, 'Tab')).toBe(false);
    expect(editors()).toEqual([]);
    expect(cell('DH-3', 'Paid')).toHaveFocus();
    expect(onSaving).toHaveBeenCalledTimes(1);
  });

  it('before the first editable cell does the same with Shift+Tab', () => {
    render(<Orders />);
    clickOn(cell('DH-1', 'Customer'));
    expect(press(input('Customer'), 'Tab', { shiftKey: true })).toBe(false);
    expect(editors()).toEqual([]);
    expect(cell('DH-1', 'Customer')).toHaveFocus();
  });

  it('stays on the cell, with its error, when the commit fails its rules', () => {
    render(<Orders columns={REQUIRED} />);
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', '');
    expect(press(input('Customer'), 'Tab')).toBe(true);
    expect(editors()).toEqual([cell('DH-1', 'Customer')]);
    expect(cell('DH-1', 'Customer')).toHaveAttribute('data-invalid');
  });
});

describe('while a save is pending', () => {
  it('shows the value in its cell and sends the next commit after the answer, in order', async () => {
    const first = deferred();
    const second = deferred();
    const onSaving = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    render(<Orders onSaving={onSaving} />);
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    expect(onSaving).toHaveBeenCalledTimes(1);
    // The value is shown while the answer is awaited, and the grid can be edited on.
    expect(cell('DH-1', 'Customer')).toHaveTextContent('Hoa');
    clickOn(cell('DH-2', 'Customer'));
    expect(editors()).toEqual([cell('DH-2', 'Customer')]);
    type('Customer', 'Lan');
    press(input('Customer'), 'Enter');
    // Queued: nothing is sent yet, and the row shows its value.
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(cell('DH-2', 'Customer')).toHaveTextContent('Lan');
    await act(async () => first.resolve());
    expect(onSaving).toHaveBeenCalledTimes(2);
    expect(sentAt(onSaving, 0)).toMatchObject([{ key: 'DH-1', data: { customer: 'Hoa' } }]);
    expect(sentAt(onSaving, 1)).toMatchObject([{ key: 'DH-2', data: { customer: 'Lan' } }]);
    await act(async () => second.resolve());
    expect(onSaving).toHaveBeenCalledTimes(2);
  });

  it('sends each queued commit of one row with its own field', async () => {
    const first = deferred();
    const onSaving = vi.fn().mockReturnValueOnce(first.promise);
    render(<Orders onSaving={onSaving} />);
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', 'Hoa');
    press(input('Customer'), 'Tab');
    // Status is a Select: leave it as it is, then the quantity.
    press(within(editors()[0]!).getByRole('combobox'), 'Tab');
    type('Qty', '9');
    press(input('Qty'), 'Enter');
    await act(async () => first.resolve());
    expect(onSaving).toHaveBeenCalledTimes(2);
    expect(sentAt(onSaving, 1)).toMatchObject([{ key: 'DH-1', data: { qty: 9 } }]);
    expect(Object.keys((sentAt(onSaving, 1)[0] as { data: object }).data)).toEqual(['qty']);
  });

  it('sends each commit with the row as it is shown then: the commits before it are in its row', async () => {
    const first = deferred();
    const second = deferred();
    const onSaving = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    render(<Orders onSaving={onSaving} />);
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', 'Hoa');
    press(input('Customer'), 'Tab');
    press(within(editors()[0]!).getByRole('combobox'), 'Tab');
    type('Qty', '9');
    press(input('Qty'), 'Enter');
    // Two commits of one row, the first still pending: the second is sent after the answer, over the first.
    await act(async () => first.resolve());
    const [change] = sentAt(onSaving, 1) as unknown as [{ data: Partial<Order>; row: Order }];
    expect(change.row).toMatchObject({ customer: 'Hoa', qty: 3 });
    expect({ ...change.row, ...change.data }).toMatchObject({ customer: 'Hoa', qty: 9 });
    await act(async () => second.resolve());
    // Once the queue is empty a new commit is over the row the app holds.
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', 'Mai');
    press(input('Customer'), 'Enter');
    expect(sentAt(onSaving, 2)).toMatchObject([{ row: { customer: 'An', qty: 3 } }]);
  });

  it('puts a refused value back in its cell with the words of the error and the alert', async () => {
    const onSaving = vi.fn(() => Promise.reject({ message: 'Server is busy' }));
    render(<Orders onSaving={onSaving} />);
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    await flush();
    expect(editors()).toEqual([cell('DH-1', 'Customer')]);
    expect(input('Customer').value).toBe('Hoa');
    expect(cell('DH-1', 'Customer')).toHaveAttribute('data-invalid');
    expect(input('Customer')).toHaveAccessibleDescription('Server is busy');
    expect(document.querySelector('.flg-data-grid [role="alert"]')).toHaveTextContent(
      'Server is busy',
    );
  });

  it('sends the refused value again on Enter, and drops it on Esc', async () => {
    const onSaving = vi.fn(() => Promise.reject({ message: 'No' }));
    render(<Orders onSaving={onSaving} />);
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    await flush();
    press(input('Customer'), 'Enter');
    expect(onSaving).toHaveBeenCalledTimes(2);
    expect(sentAt(onSaving, 1)).toMatchObject([{ key: 'DH-1', data: { customer: 'Hoa' } }]);
    await flush();
    expect(editors()).toEqual([cell('DH-1', 'Customer')]);
    // The first Esc closes the tooltip of the error, which the Tooltip takes; the second drops the value.
    press(input('Customer'), 'Escape');
    expect(editors()).toEqual([cell('DH-1', 'Customer')]);
    press(input('Customer'), 'Escape');
    expect(editors()).toEqual([]);
    expect(cell('DH-1', 'Customer')).toHaveTextContent('An');
    expect(document.querySelector('.flg-data-grid [role="alert"]')).toBeNull();
    expect(onSaving).toHaveBeenCalledTimes(2);
  });

  it('goes on with the queue after a refusal', async () => {
    const first = deferred();
    const onSaving = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(Promise.resolve());
    render(<Orders onSaving={onSaving} />);
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    clickOn(cell('DH-2', 'Customer'));
    type('Customer', 'Lan');
    press(input('Customer'), 'Enter');
    await act(async () => first.reject({ message: 'No' }));
    expect(onSaving).toHaveBeenCalledTimes(2);
    expect(sentAt(onSaving, 1)).toMatchObject([{ key: 'DH-2' }]);
  });

  it('is dropped with the feature: nothing is sent after editing turns off', async () => {
    const first = deferred();
    const onSaving = vi.fn().mockReturnValue(first.promise);
    const { rerender } = render(<Orders onSaving={onSaving} />);
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    clickOn(cell('DH-2', 'Customer'));
    type('Customer', 'Lan');
    press(input('Customer'), 'Enter');
    rerender(<Orders onSaving={onSaving} editing={undefined} />);
    await act(async () => first.resolve());
    expect(onSaving).toHaveBeenCalledTimes(1);
  });
});

describe('the warnings', () => {
  it('cell is a mode the grid has: it does not warn of an unknown mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Orders />);
    expect(warn.mock.calls.filter(([text]) => String(text).includes(WARN_PREFIX))).toEqual([]);
  });
});

const alertText = (): string | null =>
  document.querySelector('.flg-data-grid [role="alert"]')?.textContent ?? null;
const alerts = () => document.querySelectorAll('.flg-data-grid [role="alert"]');
const describedBy = (element: HTMLElement): string =>
  (element.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');
/** Presses Esc in the editor until the cell is no editor any more (the first one may close the error's tooltip). */
const giveUp = (label: string) => {
  for (let index = 0; index < 3 && editors().length > 0; index += 1) {
    press(input(label), 'Escape');
  }
};

describe('a refused commit is never lost (final review C1)', () => {
  /** DH-1 is refused while DH-2 is queued behind it and `open` says whether DH-3's editor is open. */
  async function refusedBehindAQueue(open: boolean) {
    const first = deferred();
    const second = deferred();
    const onSaving = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    render(<Orders onSaving={onSaving} />);
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    clickOn(cell('DH-2', 'Customer'));
    type('Customer', 'Lan');
    press(input('Customer'), 'Enter');
    if (open) clickOn(cell('DH-3', 'Customer'));
    await act(async () => first.reject({ message: 'Refused A' }));
    return { onSaving, second };
  }

  it('keeps the alert when the queue goes on by itself and DH-3 is being edited', async () => {
    const { onSaving } = await refusedBehindAQueue(true);
    expect(onSaving).toHaveBeenCalledTimes(2);
    expect(alertText()).toEqual(expect.stringContaining('Refused A'));
    expect(alerts()).toHaveLength(1);
  });

  it('holds the value over its row, with the fault look and its words, while another cell is edited', async () => {
    await refusedBehindAQueue(true);
    const held = cell('DH-1', 'Customer');
    expect(held).toHaveTextContent('Hoa');
    expect(held).toHaveAttribute('data-invalid');
    expect(describedBy(held)).toContain('Refused A');
    expect(editors()).toEqual([cell('DH-3', 'Customer')]);
  });

  it('keeps the alert and gives the editor back when no other cell is edited', async () => {
    await refusedBehindAQueue(false);
    expect(alertText()).toEqual(expect.stringContaining('Refused A'));
    expect(editors()).toEqual([cell('DH-1', 'Customer')]);
    expect(input('Customer').value).toBe('Hoa');
    expect(cell('DH-1', 'Customer')).toHaveAttribute('data-invalid');
  });

  it('does not clear the alert when the next commit of the queue resolves', async () => {
    const { second } = await refusedBehindAQueue(true);
    await act(async () => second.resolve());
    expect(alertText()).toEqual(expect.stringContaining('Refused A'));
  });

  it('opens the editor of the held cell with the refused value on Enter, and Esc there drops it', async () => {
    const { onSaving } = await refusedBehindAQueue(true);
    focusOn(cell('DH-1', 'Customer'));
    press(cell('DH-1', 'Customer'), 'Enter');
    expect(editors()).toEqual([cell('DH-1', 'Customer')]);
    expect(input('Customer').value).toBe('Hoa');
    expect(cell('DH-1', 'Customer')).toHaveAttribute('data-invalid');
    giveUp('Customer');
    expect(editors()).toEqual([]);
    expect(cell('DH-1', 'Customer')).toHaveTextContent('An');
    expect(cell('DH-1', 'Customer')).not.toHaveAttribute('data-invalid');
    expect(alertText()).toBeNull();
    expect(onSaving).toHaveBeenCalledTimes(2);
  });

  it('opens the editor of the held cell on a press, and Enter there sends the value again', async () => {
    const { onSaving, second } = await refusedBehindAQueue(true);
    await act(async () => second.resolve());
    clickOn(cell('DH-1', 'Customer'));
    expect(editors()).toEqual([cell('DH-1', 'Customer')]);
    expect(input('Customer').value).toBe('Hoa');
    press(input('Customer'), 'Enter');
    expect(onSaving).toHaveBeenCalledTimes(3);
    expect(onSaving.mock.calls[2]![0]).toMatchObject([{ key: 'DH-1', data: { customer: 'Hoa' } }]);
    expect(cell('DH-1', 'Customer')).not.toHaveAttribute('data-invalid');
    expect(alertText()).toBeNull();
  });

  it('keeps the alert when Esc gives up another cell (DH-3), and drops it with the refused cell (DH-1)', async () => {
    await refusedBehindAQueue(true);
    // DH-3's editor is open: its Esc is not the refused cell's.
    type('Customer', 'Mai');
    press(input('Customer'), 'Escape');
    expect(editors()).toEqual([]);
    expect(alertText()).toEqual(expect.stringContaining('Refused A'));
    expect(cell('DH-1', 'Customer')).toHaveAttribute('data-invalid');
    // The refused cell's own Esc settles it.
    focusOn(cell('DH-1', 'Customer'));
    press(cell('DH-1', 'Customer'), 'Enter');
    giveUp('Customer');
    expect(alertText()).toBeNull();
  });

  it('sends a queued commit with the row the app holds when it is sent, not when it was queued (F3)', async () => {
    const first = deferred();
    const onSaving = vi.fn().mockReturnValueOnce(first.promise).mockReturnValue(undefined);
    const { rerender } = render(<Orders onSaving={onSaving} />);
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    clickOn(cell('DH-2', 'Customer'));
    type('Customer', 'Lan');
    press(input('Customer'), 'Enter');
    // The app replaces the data of DH-2 (and of DH-3) while DH-1 is still pending.
    const replaced = ORDERS.map((order) =>
      order.id === 'DH-1' ? order : { ...order, qty: 99, status: 2 },
    );
    rerender(<Orders onSaving={onSaving} data={replaced} />);
    await act(async () => first.resolve());
    expect(onSaving).toHaveBeenCalledTimes(2);
    const [change] = sentAt(onSaving, 1) as unknown as [{ data: Partial<Order>; row: Order }];
    expect(change.data).toEqual({ customer: 'Lan' });
    expect(change.row).toBe(replaced[1]);
  });

  describe('saveChanges() that waits (final review I3)', () => {
    /** Commits DH-1 (pending), calls saveChanges() and says what it resolved with, `'pending'` until it does. */
    function waiting(props: Partial<DataGridProps<Order>> = {}) {
      const first = deferred();
      const ref = createRef<DataGridHandle>();
      const onSaving = vi.fn().mockReturnValueOnce(first.promise);
      const view = render(<Orders gridRef={ref} onSaving={onSaving} {...props} />);
      clickOn(cell('DH-1', 'Customer'));
      type('Customer', 'Hoa');
      press(input('Customer'), 'Enter');
      const outcome: { value: boolean | 'pending' } = { value: 'pending' };
      act(() => void ref.current!.saveChanges().then((ok) => (outcome.value = ok)));
      return { first, outcome, view, onSaving };
    }

    it('resolves true when every commit was answered', async () => {
      const { first, outcome } = waiting();
      expect(outcome.value).toBe('pending');
      await act(async () => first.resolve());
      expect(outcome.value).toBe(true);
    });

    it('resolves false when the grid unmounts while it waits', async () => {
      const { first, outcome, view } = waiting();
      view.unmount();
      await act(async () => first.resolve());
      await flush();
      expect(outcome.value).toBe(false);
    });

    it('resolves false when editing is turned off while it waits', async () => {
      const { first, outcome, view } = waiting();
      view.rerender(<Orders editing={undefined} />);
      await act(async () => first.resolve());
      expect(outcome.value).toBe(false);
    });

    it('resolves false when the mode changes while it waits', async () => {
      const { first, outcome, view } = waiting();
      view.rerender(<Orders editing={{ mode: 'row' }} />);
      await act(async () => first.resolve());
      expect(outcome.value).toBe(false);
    });
  });
});

/** A thenable whose `then` throws: the answer that cannot even be waited for. */
const badThenable = () => ({
  then() {
    throw new Error('then threw');
  },
});

describe('a thenable whose then throws (final review, Task 4 m4)', () => {
  it('is a refusal in cell mode: the value is kept over its row, the alert shows, nothing is pending', () => {
    const onSaving = vi.fn().mockImplementationOnce(badThenable).mockReturnValue(undefined);
    render(<Orders onSaving={onSaving} />);
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    // The refusal came while the commit was still closing its editor: the value is held, with the fault look.
    expect(cell('DH-1', 'Customer')).toHaveTextContent('Hoa');
    expect(cell('DH-1', 'Customer')).toHaveAttribute('data-invalid');
    expect(alertText()).toEqual(expect.stringContaining('then threw'));
    // Nothing is pending: the value is sent again at once.
    press(cell('DH-1', 'Customer'), 'Enter');
    expect(input('Customer').value).toBe('Hoa');
    press(input('Customer'), 'Enter');
    expect(onSaving).toHaveBeenCalledTimes(2);
    expect(sentAt(onSaving, 1)).toMatchObject([{ key: 'DH-1', data: { customer: 'Hoa' } }]);
  });
});

describe('saveChanges() sends the refused values that are held (review of PR #46, R3)', () => {
  /** DH-1 is refused while DH-3's editor is open, so its value is held over its row; then `saveChanges()` is called. */
  async function savingWithAHeldRefusal(onSaving: ReturnType<typeof vi.fn>) {
    const gridRef = createRef<DataGridHandle>();
    render(<Orders gridRef={gridRef} onSaving={onSaving as never} />);
    clickOn(cell('DH-1', 'Customer'));
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    clickOn(cell('DH-3', 'Customer'));
    return gridRef;
  }

  it('sends it again, and resolves true with no fault and no alert left when it goes through', async () => {
    const first = deferred();
    const again = deferred();
    const onSaving = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(again.promise);
    const gridRef = await savingWithAHeldRefusal(onSaving);
    await act(async () => first.reject({ message: 'Refused A' }));
    expect(cell('DH-1', 'Customer')).toHaveAttribute('data-invalid');
    let result: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    expect(onSaving).toHaveBeenCalledTimes(2);
    expect(onSaving.mock.calls[1]![0]).toMatchObject([{ key: 'DH-1', data: { customer: 'Hoa' } }]);
    expect(cell('DH-1', 'Customer')).not.toHaveAttribute('data-invalid');
    await act(async () => again.resolve());
    await expect(result!).resolves.toBe(true);
    expect(table().querySelector('[data-invalid]')).toBeNull();
    expect(alertText()).toBeNull();
  });

  it('resolves false when it is refused again, and the alert says why', async () => {
    const first = deferred();
    const again = deferred();
    const onSaving = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(again.promise);
    const gridRef = await savingWithAHeldRefusal(onSaving);
    await act(async () => first.reject({ message: 'Refused A' }));
    let result: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await act(async () => again.reject({ message: 'Refused B' }));
    await expect(result!).resolves.toBe(false);
    expect(alertText()).toEqual(expect.stringContaining('Refused B'));
  });
});

describe('a row whose delete is pending cannot be edited (review of PR #46, R6)', () => {
  it('opens no editor on a press or Enter, queues no update, and sends nothing after the answer', async () => {
    const deleting = deferred();
    const onSaving = vi.fn(() => deleting.promise);
    render(
      <Orders
        onSaving={onSaving}
        editing={{ mode: 'cell', allowDeleting: true, confirmDelete: false }}
      />,
    );
    clickOn(screen.getByRole('button', { name: 'Delete DH-2' }));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Delete DH-2' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    clickOn(cell('DH-2', 'Customer'));
    expect(editors()).toEqual([]);
    focusOn(cell('DH-2', 'Customer'));
    press(cell('DH-2', 'Customer'), 'Enter');
    expect(editors()).toEqual([]);
    // Another row is another request.
    clickOn(cell('DH-3', 'Customer'));
    expect(editors()).toEqual([cell('DH-3', 'Customer')]);
    await act(async () => deleting.resolve());
    expect(onSaving).toHaveBeenCalledTimes(1);
  });
});
