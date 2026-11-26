import { act, createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import { StrictMode, useState } from 'react';
import { renderToString } from 'react-dom/server';
import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
import { dataGridColumn } from './data-grid-column';
import { DataGrid } from './DataGrid';
import type { DataGridChange, DataGridColumn, DataGridEditing, DataGridProps } from './index';

// Editing in the rows (spec phase 6 §3.6, §6.3, §4.3 E2): the column of buttons and its height, the editors of
// the row being edited, the keys that start, save and give up, `onSaving` with a Promise, the focus when the
// editors go and the warnings. What needs a layout engine (the look of an editor in a cell, Edit shown by the
// pointer, the focus of a real browser) is proven in the stories.

// Which popovers are showing: jsdom has no Popover API.
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
  // jsdom has no layout, so every element would count as hidden to the code that looks for the controls
  // of a cell.
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
  placed: string | Date | null;
  paid: boolean;
  price: number;
  channel: string;
  note: string;
}

const STATUSES = [
  { id: 1, name: 'New' },
  { id: 2, name: 'Processing' },
  { id: 3, name: 'Delivered' },
];

const ORDERS: Order[] = [
  {
    id: 'DH-1',
    customer: 'An',
    status: 1,
    qty: 3,
    placed: '2026-11-05',
    paid: false,
    price: 10,
    channel: 'Store',
    note: 'a',
  },
  {
    id: 'DH-2',
    customer: 'Bình',
    status: 2,
    qty: 5,
    placed: new Date(Date.UTC(2026, 10, 6)),
    paid: true,
    price: 20,
    channel: 'Web',
    note: 'b',
  },
  {
    id: 'DH-3',
    customer: 'Chi',
    status: 3,
    qty: 1,
    placed: null,
    paid: false,
    price: 30,
    channel: 'Phone',
    note: 'c',
  },
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
  { field: 'placed', caption: 'Order date', dataType: 'date', width: 150 },
  { field: 'paid', caption: 'Paid', dataType: 'boolean', width: 80 },
  {
    id: 'total',
    caption: 'Total',
    dataType: 'number',
    width: 100,
    value: (row) => row.price * (row.qty ?? 0),
  },
];

function Orders(props: Partial<DataGridProps<Order>>) {
  return (
    <DataGrid
      data={ORDERS}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      editing={{ mode: 'row' }}
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
const edit = (name: string) => screen.getByRole('button', { name: `Edit ${name}` });
const click = (element: HTMLElement) => act(() => element.click());
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
const startEdit = (name: string) => click(edit(name));
/** The announcement is set a task after it is said. */
const tick = () => act(async () => void (await new Promise((done) => setTimeout(done, 0))));
const editedRow = () => table().querySelector<HTMLTableRowElement>('tr[data-editing]');
const input = (label: string) => within(editedRow()!).getByLabelText(label) as HTMLInputElement;
const type = (label: string, text: string) =>
  act(() => void fireEvent.change(input(label), { target: { value: text } }));
const saveButton = (name: string) => screen.getByRole('button', { name: `Save ${name}` });
/** The first call of a spy, which is what `onSaving` was given. */
const sent = (spy: ReturnType<typeof vi.fn>): DataGridChange<Order>[] =>
  spy.mock.calls[0]![0] as DataGridChange<Order>[];
const tabbables = () =>
  Array.from(
    table().querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]), button, [role="combobox"], [tabindex="0"]',
    ),
  ).filter((element) => element.getAttribute('tabindex') !== '-1');

describe('the column of buttons', () => {
  it('is the last column, with a title that says Actions in hidden words', () => {
    render(<Orders />);
    const heads = Array.from(table().querySelectorAll<HTMLElement>('thead th'));
    const last = heads.filter((head) => !head.classList.contains('flg-data-grid-filler')).at(-1)!;
    expect(last).toHaveTextContent('Actions');
    expect(last.querySelector('.flg-visually-hidden')).not.toBeNull();
    const cell = dataRows()[0]!.querySelector('td.flg-data-grid-actions');
    expect(cell).not.toBeNull();
    expect(cell!.hasAttribute('data-actions')).toBe(true);
    // It is a place of the keyboard with several controls, not a cell of one: no `data-service`.
    expect(cell!.hasAttribute('data-service')).toBe(false);
    expect(cell!.parentElement!.lastElementChild).toBe(cell);
  });

  it('is drawn only while a button can stand in it', () => {
    const { rerender } = render(<Orders editing={undefined} />);
    expect(table().querySelector('.flg-data-grid-actions')).toBeNull();
    rerender(<Orders editing={{ mode: 'row', allowUpdating: false }} />);
    expect(table().querySelector('.flg-data-grid-actions')).toBeNull();
    rerender(<Orders editing={{ mode: 'row', allowUpdating: () => false }} />);
    expect(table().querySelector('.flg-data-grid-actions')).not.toBeNull();
    rerender(<Orders />);
    expect(table().querySelector('.flg-data-grid-actions')).not.toBeNull();
  });

  it('makes every data row 4px taller, and only while it is drawn', () => {
    const { rerender } = render(<Orders editing={undefined} />);
    const height = () =>
      document
        .querySelector<HTMLElement>('.flg-data-grid')!
        .style.getPropertyValue('--flg-data-grid-row-height');
    expect(height()).toBe('41px');
    rerender(<Orders />);
    expect(height()).toBe('45px');
    rerender(<Orders density="compact" variant="striped" />);
    expect(height()).toBe('34px');
    // A caller's height is used as given, and a group row keeps its own.
    rerender(<Orders rowHeight={50} />);
    expect(height()).toBe('50px');
    rerender(<Orders grouping={[{ field: 'paid', direction: 'asc' }]} />);
    expect(
      document
        .querySelector<HTMLElement>('.flg-data-grid')!
        .style.getPropertyValue('--flg-data-grid-group-row-height'),
    ).toBe('33px');
  });

  it('gives Edit a name from the row header, out of the Tab order, and none to a row that cannot be edited', () => {
    render(<Orders editing={{ mode: 'row', allowUpdating: (row) => row.id !== 'DH-2' }} />);
    expect(edit('DH-1')).toHaveAttribute('tabindex', '-1');
    expect(screen.queryByRole('button', { name: 'Edit DH-2' })).toBeNull();
    // The empty cell of that row is still a place of the keyboard.
    const empty = cellOf(rowOf('DH-2'), 'Actions');
    expect(empty).toHaveAttribute('tabindex');
    expect(empty.querySelector('button')).toBeNull();
  });

  it('names a row by the row header even while that column is hidden, and by its key without one', () => {
    const { rerender } = render(<Orders defaultColumnLayout={{ hidden: ['id'] }} />);
    expect(screen.getByRole('button', { name: 'Edit DH-1' })).toBeInTheDocument();
    rerender(
      <Orders
        columns={
          COLUMNS.map((column) => ({ ...column, rowHeader: false })) as DataGridColumn<Order>[]
        }
        defaultColumnLayout={{ hidden: ['id'] }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Edit DH-1' })).toBeInTheDocument();
  });

  it('says its buttons in the words of the labels', () => {
    render(
      <Orders
        labels={{
          actions: 'Thao tác',
          edit: (name) => `Sửa ${name}`,
          save: (name) => `Lưu ${name}`,
          cancelEdit: (name) => `Huỷ sửa ${name}`,
        }}
      />,
    );
    expect(table().querySelector('thead')).toHaveTextContent('Thao tác');
    click(screen.getByRole('button', { name: 'Sửa DH-1' }));
    expect(screen.getByRole('button', { name: 'Lưu DH-1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Huỷ sửa DH-1' })).toBeInTheDocument();
  });
});

describe('the editors of a row', () => {
  it('turns every editable cell of the row into an editor, and shows the others as text', () => {
    render(<Orders />);
    startEdit('DH-1');
    const row = editedRow()!;
    expect(row).toBe(rowOf('DH-1'));
    const editors = Array.from(row.querySelectorAll('[data-editor]'));
    expect(editors).toHaveLength(5);
    // The order (read-only) and the total (computed, no setValue) stay text.
    expect(row.querySelector('th')).toHaveTextContent('DH-1');
    expect(row.querySelector('th')!.hasAttribute('data-editor')).toBe(false);
    expect(row).toHaveTextContent('30');
    expect(editors.every((cell) => cell.classList.contains('flg-data-grid-cell'))).toBe(true);
    // The other rows are as they were.
    expect(rowOf('DH-2').hasAttribute('data-editing')).toBe(false);
    expect(rowOf('DH-2').querySelector('[data-editor]')).toBeNull();
  });

  it('names each editor by the caption of its column and gives it the value the cell showed', () => {
    render(<Orders locale="en-US" />);
    startEdit('DH-2');
    expect(input('Customer').value).toBe('Bình');
    expect(input('Qty').value).toBe('5');
    expect(input('Order date').value).toBe('11/06/2026');
    expect(screen.getByRole('checkbox', { name: 'Paid' })).toBeChecked();
    expect(within(editedRow()!).getByRole('combobox', { name: 'Status' })).toHaveTextContent(
      'Processing',
    );
  });

  it('takes the sizes of the density: md, and sm in a compact grid', () => {
    const { rerender } = render(<Orders />);
    startEdit('DH-1');
    expect(input('Customer').closest('.flg-input')).toHaveAttribute('data-size', 'md');
    rerender(<Orders density="compact" />);
    expect(input('Customer').closest('.flg-input')).toHaveAttribute('data-size', 'sm');
  });

  it('puts the focus in the editor of the first column that can be edited when Edit is pressed', () => {
    render(<Orders />);
    startEdit('DH-1');
    expect(input('Customer')).toHaveFocus();
  });

  it('reads a number by the locale of the grid and writes it back by the column format', () => {
    render(
      <Orders
        locale="vi-VN"
        columns={[
          COLUMNS[0]!,
          {
            field: 'price',
            caption: 'Price',
            dataType: 'number',
            format: { style: 'currency', currency: 'VND', maximumFractionDigits: 0 },
          },
        ]}
      />,
    );
    startEdit('DH-1');
    expect(input('Price').value).toMatch(/10/);
  });

  it('lets a column with no editor type of its own, a datetime, show its text', () => {
    render(
      <Orders
        data={[{ ...ORDERS[0]!, at: 0 } as Order]}
        columns={[
          COLUMNS[0]!,
          COLUMNS[1]!,
          { field: 'at' as keyof Order & string, caption: 'At', dataType: 'datetime' },
        ]}
      />,
    );
    startEdit('DH-1');
    expect(editedRow()!.querySelectorAll('[data-editor]')).toHaveLength(1);
  });

  it('shows a cell as text for each reason it cannot be edited', () => {
    const noSetValue = dataGridColumn<Order>()({
      id: 'half',
      caption: 'Half',
      value: (row) => (row.qty ?? 0) / 2,
    });
    const columns: DataGridColumn<Order>[] = [
      COLUMNS[0]!,
      { field: 'customer', caption: 'Customer', allowEditing: false },
      { field: 'channel', caption: 'Channel', allowEditing: (row) => row.channel === 'Web' },
      { field: 'note', caption: 'Note', multiline: true },
      noSetValue,
      { field: 'qty', caption: 'Qty', dataType: 'number' },
    ];
    render(<Orders columns={columns} />);
    startEdit('DH-1');
    const row = editedRow()!;
    // Only Qty and (as the cell mode shows a multiline column as text) not Note, Channel of a Store row, Half.
    expect(row.querySelectorAll('[data-editor]')).toHaveLength(1);
    expect(input('Qty')).toBeInTheDocument();
    expect(row).toHaveTextContent('Store');
  });

  it('edits the column that says it can edit for this row, in the row that allows it', () => {
    const columns: DataGridColumn<Order>[] = [
      COLUMNS[0]!,
      { field: 'channel', caption: 'Channel', allowEditing: (row) => row.channel === 'Web' },
    ];
    render(<Orders columns={columns} />);
    startEdit('DH-2');
    expect(input('Channel').value).toBe('Web');
  });

  it('uses a Select up to 20 items and a Combobox above; searchable forces one or the other', () => {
    const items = Array.from({ length: 21 }, (_, index) => ({ id: index, name: `Item ${index}` }));
    const lookupColumn = (lookup: object): DataGridColumn<Order> => ({
      field: 'status',
      caption: 'Status',
      lookup: { items, valueField: 'id', displayField: 'name', ...lookup },
    });
    const { rerender } = render(<Orders columns={[COLUMNS[0]!, lookupColumn({})]} />);
    startEdit('DH-1');
    expect(within(editedRow()!).getByRole('combobox', { name: 'Status' }).tagName).toBe('INPUT');
    rerender(<Orders columns={[COLUMNS[0]!, lookupColumn({ searchable: false })]} />);
    expect(within(editedRow()!).getByRole('combobox', { name: 'Status' }).tagName).toBe('BUTTON');
    rerender(
      <Orders
        columns={[COLUMNS[0]!, lookupColumn({ items: items.slice(0, 3), searchable: true })]}
      />,
    );
    expect(within(editedRow()!).getByRole('combobox', { name: 'Status' }).tagName).toBe('INPUT');
  });
});

describe('a custom editor', () => {
  it('replaces the default one and is given every member of its context', () => {
    const seen: unknown[] = [];
    const columns: DataGridColumn<Order>[] = [
      COLUMNS[0]!,
      {
        field: 'customer',
        caption: 'Customer',
        editor: (ctx) => {
          seen.push(ctx);
          return (
            <button type="button" onClick={() => ctx.setValue(`${ctx.value}!`)}>
              Shout
            </button>
          );
        },
      },
    ];
    const onSaving = vi.fn();
    render(<Orders columns={columns} onSaving={onSaving} />);
    startEdit('DH-1');
    expect(within(editedRow()!).getByRole('button', { name: 'Shout' })).toBeInTheDocument();
    const ctx = seen.at(-1) as Record<string, unknown>;
    expect(Object.keys(ctx).sort()).toEqual(
      [
        'autoFocus',
        'cancel',
        'commit',
        'errorId',
        'invalid',
        'label',
        'mode',
        'row',
        'saving',
        'setValue',
        'size',
        'value',
      ].sort(),
    );
    expect(ctx).toMatchObject({
      value: 'An',
      mode: 'row',
      size: 'md',
      label: 'Customer',
      autoFocus: true,
      invalid: false,
      errorId: undefined,
    });
    expect((ctx.row as Order).id).toBe('DH-1');
    click(within(editedRow()!).getByRole('button', { name: 'Shout' }));
    expect((seen.at(-1) as { value: unknown }).value).toBe('An!');
    click(saveButton('DH-1'));
    expect(sent(onSaving)).toEqual([
      { type: 'update', key: 'DH-1', data: { customer: 'An!' }, row: ORDERS[0] },
    ]);
  });

  it('keeps the handlers of the element it returns, and gives its own control the focus first', () => {
    const onKeyDown = vi.fn();
    const columns: DataGridColumn<Order>[] = [
      COLUMNS[0]!,
      {
        field: 'customer',
        caption: 'Customer',
        editor: () => <input aria-label="Mine" onKeyDown={onKeyDown} />,
      },
    ];
    render(<Orders columns={columns} />);
    startEdit('DH-1');
    expect(screen.getByLabelText('Mine')).toHaveFocus();
    press(screen.getByLabelText('Mine'), 'a');
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('gives a datetime column an editor, and writes the value the editor sets as it is', () => {
    const onSaving = vi.fn();
    const columns: DataGridColumn<Order & { at: number }>[] = [
      { field: 'id', caption: 'Order', rowHeader: true, allowEditing: false },
      {
        field: 'at',
        caption: 'At',
        dataType: 'datetime',
        editor: (ctx) => (
          <button type="button" onClick={() => ctx.setValue(86_400_000)}>
            Next day
          </button>
        ),
      },
    ];
    render(
      <DataGrid
        data={[{ ...ORDERS[0]!, at: 0 }]}
        rowKey="id"
        columns={columns}
        caption="Orders"
        editing={{ mode: 'row' }}
        onSaving={onSaving}
      />,
    );
    startEdit('DH-1');
    click(screen.getByRole('button', { name: 'Next day' }));
    click(saveButton('DH-1'));
    expect(sent(onSaving)[0]).toMatchObject({ type: 'update', data: { at: 86_400_000 } });
  });
});

describe('onSaving', () => {
  it('is called once with one update that holds the changed fields only, and the saved row', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    click(saveButton('DH-1'));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sent(onSaving)).toEqual([
      { type: 'update', key: 'DH-1', data: { customer: 'Hoa' }, row: ORDERS[0] },
    ]);
  });

  it('is not called when nothing changed or a value is typed back, and the edit ends', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    startEdit('DH-1');
    click(saveButton('DH-1'));
    expect(onSaving).not.toHaveBeenCalled();
    expect(editedRow()).toBeNull();
    startEdit('DH-1');
    type('Customer', 'Hoa');
    type('Customer', 'An');
    click(saveButton('DH-1'));
    expect(onSaving).not.toHaveBeenCalled();
    expect(editedRow()).toBeNull();
  });

  it('turns the editor value back into what the row holds: a Date stays a Date, a lookup its own value', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    startEdit('DH-2');
    // A day typed and settled with Enter in the date field... which saves: the other fields go first.
    act(() => void fireEvent.change(input('Order date'), { target: { value: '12/01/2026' } }));
    act(() => void fireEvent.blur(input('Order date')));
    fireEvent.click(
      within(editedRow()!)
        .getAllByRole('option', { name: 'Delivered', hidden: true })
        .find((candidate) => candidate.id !== '')!,
    );
    click(saveButton('DH-2'));
    const [update] = sent(onSaving) as Extract<DataGridChange<Order>, { type: 'update' }>[];
    expect(update!.data.placed).toBeInstanceOf(Date);
    expect((update!.data.placed as Date).getTime()).toBe(Date.UTC(2026, 11, 1));
    expect(update!.data.status).toBe(3);
  });

  it('sets a value column through its setValue, and a number and a box as they are', () => {
    const onSaving = vi.fn();
    const columns: DataGridColumn<Order>[] = [
      COLUMNS[0]!,
      { field: 'qty', caption: 'Qty', dataType: 'number' },
      { field: 'paid', caption: 'Paid', dataType: 'boolean' },
      dataGridColumn<Order>()({
        id: 'total',
        caption: 'Total',
        dataType: 'number',
        value: (row) => row.price * (row.qty ?? 0),
        setValue: (row, value) => ({ ...row, price: (value ?? 0) / (row.qty ?? 1) }),
      }),
    ];
    render(<Orders columns={columns} onSaving={onSaving} />);
    startEdit('DH-1');
    type('Qty', '4');
    act(() => void fireEvent.blur(input('Qty')));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Paid' }));
    type('Total', '80');
    act(() => void fireEvent.blur(input('Total')));
    click(saveButton('DH-1'));
    // Qty 4 and total 80 make a price of 20; the row's other fields are not sent.
    expect(sent(onSaving)[0]).toMatchObject({
      type: 'update',
      key: 'DH-1',
      data: { qty: 4, paid: true, price: 20 },
    });
    expect(Object.keys((sent(onSaving)[0] as { data: object }).data).sort()).toEqual([
      'paid',
      'price',
      'qty',
    ]);
  });

  it('reads the draft when the button is pressed, and not the one of a render before', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    // The number typed and not yet settled is settled by the press itself (the button takes the focus).
    focusOn(input('Qty'));
    act(() => void fireEvent.change(input('Qty'), { target: { value: '9' } }));
    const button = saveButton('DH-1');
    act(() => button.click());
    expect(sent(onSaving)[0]).toMatchObject({ data: { customer: 'Hoa', qty: 9 } });
  });

  it('treats what is not a thenable as a success at once, and says it was saved', async () => {
    render(<Orders />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    click(saveButton('DH-1'));
    expect(editedRow()).toBeNull();
    await tick();
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Changes saved');
  });

  it('waits for a Promise: the table is busy, Save loads, the editors cannot change, and resolve ends the edit', async () => {
    let resolve!: () => void;
    const onSaving = vi.fn(() => new Promise<void>((done) => (resolve = done)));
    render(<Orders onSaving={onSaving} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    click(saveButton('DH-1'));
    expect(table()).toHaveAttribute('aria-busy', 'true');
    const save = saveButton('DH-1');
    expect(save).toHaveAttribute('data-loading');
    expect(save).toHaveAttribute('aria-busy', 'true');
    // Never `disabled`: the focus stays where it is.
    expect(save).not.toBeDisabled();
    expect(input('Customer')).toHaveAttribute('readonly');
    expect(input('Customer')).not.toBeDisabled();
    // A second press is ignored.
    click(save);
    expect(onSaving).toHaveBeenCalledTimes(1);
    await act(async () => resolve());
    expect(editedRow()).toBeNull();
    expect(table()).not.toHaveAttribute('aria-busy');
    await tick();
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Changes saved');
  });

  it('keeps the edit and what was typed when the Promise rejects, and the editors take the keys again', async () => {
    let reject!: () => void;
    const onSaving = vi.fn(() => new Promise<void>((_, fail) => (reject = fail)));
    render(<Orders onSaving={onSaving} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    click(saveButton('DH-1'));
    await act(async () => reject());
    expect(editedRow()).not.toBeNull();
    expect(table()).not.toHaveAttribute('aria-busy');
    expect(input('Customer').value).toBe('Hoa');
    expect(input('Customer')).not.toHaveAttribute('readonly');
    expect(saveButton('DH-1')).not.toHaveAttribute('data-loading');
    // It can be saved again.
    click(saveButton('DH-1'));
    expect(onSaving).toHaveBeenCalledTimes(2);
  });

  it('keeps the edit and warns once when onSaving throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onSaving = vi.fn(() => {
      throw new Error('no');
    });
    render(<Orders onSaving={onSaving} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    click(saveButton('DH-1'));
    expect(editedRow()).not.toBeNull();
    click(saveButton('DH-1'));
    expect(
      warn.mock.calls.filter((call) => String(call[0]).includes('onSaving threw')),
    ).toHaveLength(1);
  });

  it('drops the change and ends the edit without onSaving, and warns once, after the commit', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Orders onSaving={undefined} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toContain(WARN_PREFIX);
    expect(String(warn.mock.calls[0]![0])).toContain('<DataGrid editing> has no onSaving');
    startEdit('DH-1');
    type('Customer', 'Hoa');
    click(saveButton('DH-1'));
    expect(editedRow()).toBeNull();
    expect(rowOf('DH-1')).toHaveTextContent('An');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('stops waiting when the edit is given up, and ignores the answer that comes after', async () => {
    let resolve!: () => void;
    const onSaving = vi.fn(() => new Promise<void>((done) => (resolve = done)));
    render(<Orders onSaving={onSaving} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    click(saveButton('DH-1'));
    click(screen.getByRole('button', { name: 'Cancel editing DH-1' }));
    expect(editedRow()).toBeNull();
    expect(table()).not.toHaveAttribute('aria-busy');
    startEdit('DH-2');
    await act(async () => resolve());
    // The answer of the first save does not end the second edit.
    expect(editedRow()).toBe(rowOf('DH-2'));
    await tick();
    expect(document.querySelector('[aria-live="polite"]')).not.toHaveTextContent('Changes saved');
  });

  it('ends the edit, and nothing is sent, when editing turns off, the mode changes or the grid goes', async () => {
    const onSaving = vi.fn(() => new Promise<void>(() => {}));
    const { rerender, unmount } = render(<Orders onSaving={onSaving} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    click(saveButton('DH-1'));
    expect(table()).toHaveAttribute('aria-busy', 'true');
    rerender(<Orders onSaving={onSaving} editing={undefined} />);
    expect(editedRow()).toBeNull();
    expect(table()).not.toHaveAttribute('aria-busy');
    expect(table().querySelector('.flg-data-grid-actions')).toBeNull();
    rerender(<Orders onSaving={onSaving} />);
    expect(editedRow()).toBeNull();
    startEdit('DH-2');
    unmount();
    expect(onSaving).toHaveBeenCalledTimes(1);
  });
});

describe('one row at a time', () => {
  it('starts the other row at once when the row being edited has no change', () => {
    render(<Orders />);
    startEdit('DH-1');
    startEdit('DH-2');
    expect(editedRow()).toBe(rowOf('DH-2'));
    expect(dataRows().filter((row) => row.hasAttribute('data-editing'))).toHaveLength(1);
  });

  it('saves the row being edited first when it has a change, and goes on when that goes through', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    startEdit('DH-2');
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sent(onSaving)[0]).toMatchObject({ key: 'DH-1', data: { customer: 'Hoa' } });
    expect(editedRow()).toBe(rowOf('DH-2'));
  });

  it('stays on the row when that save is rejected', async () => {
    const onSaving = vi.fn(() => Promise.reject(new Error('no')));
    render(<Orders onSaving={onSaving} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    await act(async () => {
      startEdit('DH-2');
    });
    expect(editedRow()).toBe(rowOf('DH-1'));
    expect(input('Customer').value).toBe('Hoa');
  });
});

describe('the keys', () => {
  const cell = (name: string, caption: string) => cellOf(rowOf(name), caption);

  it('start the edit with Enter and F2 on a cell of a row that can be edited, in the editor of that column', () => {
    const onRowActivate = vi.fn();
    render(<Orders onRowActivate={onRowActivate} />);
    focusOn(cell('DH-1', 'Qty'));
    expect(press(cell('DH-1', 'Qty'), 'Enter')).toBe(true);
    expect(editedRow()).toBe(rowOf('DH-1'));
    expect(input('Qty')).toHaveFocus();
    press(input('Qty'), 'Escape');
    focusOn(cell('DH-2', 'Customer'));
    press(cell('DH-2', 'Customer'), 'F2');
    expect(editedRow()).toBe(rowOf('DH-2'));
    expect(input('Customer')).toHaveFocus();
    // The activation of a row is for the rows that cannot be edited.
    expect(onRowActivate).not.toHaveBeenCalled();
  });

  it('start in the first editor from a cell that holds none, and leave the cell of the buttons to its widget mode', () => {
    render(<Orders />);
    focusOn(cell('DH-1', 'Order'));
    press(cell('DH-1', 'Order'), 'Enter');
    expect(editedRow()).toBe(rowOf('DH-1'));
    expect(input('Customer')).toHaveFocus();
    press(input('Customer'), 'Escape');
    focusOn(cell('DH-2', 'Actions'));
    press(cell('DH-2', 'Actions'), 'Enter');
    expect(editedRow()).toBeNull();
    expect(edit('DH-2')).toHaveFocus();
  });

  it('go to onRowActivate for a row that cannot be edited', () => {
    const onRowActivate = vi.fn();
    render(
      <Orders
        onRowActivate={onRowActivate}
        editing={{ mode: 'row', allowUpdating: (row) => row.id !== 'DH-2' }}
      />,
    );
    focusOn(cell('DH-2', 'Qty'));
    press(cell('DH-2', 'Qty'), 'Enter');
    expect(editedRow()).toBeNull();
    expect(onRowActivate).toHaveBeenCalledTimes(1);
  });

  it('take a modifier as no start', () => {
    render(<Orders />);
    focusOn(cell('DH-1', 'Qty'));
    press(cell('DH-1', 'Qty'), 'Enter', { shiftKey: true });
    press(cell('DH-1', 'Qty'), 'Enter', { ctrlKey: true });
    expect(editedRow()).toBeNull();
  });

  it('put the editors, ✓ and ✕ in the Tab order in that order, and nothing of the grid but its one stop', () => {
    render(<Orders />);
    focusOn(cell('DH-1', 'Qty'));
    startEdit('DH-1');
    const stops = tabbables().filter((element) => editedRow()!.contains(element));
    const names = stops.map(
      (element) =>
        element.getAttribute('aria-label') ?? element.getAttribute('name') ?? element.tagName,
    );
    expect(names).toEqual([
      'Customer',
      'Status',
      'Qty',
      'Order date',
      'Choose date',
      'Paid',
      'Save DH-1',
      'Cancel editing DH-1',
    ]);
    // Edit of the other rows is out of the order.
    expect(edit('DH-2')).toHaveAttribute('tabindex', '-1');
  });

  it('save with Enter in an editor, and keep the focus on the cell of that column', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    expect(press(input('Customer'), 'Enter')).toBe(true);
    expect(sent(onSaving)[0]).toMatchObject({ data: { customer: 'Hoa' } });
    expect(editedRow()).toBeNull();
    expect(cell('DH-1', 'Customer')).toHaveFocus();
  });

  it('do not save with Enter from a button, from a control whose popup is open or while composing', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    // The buttons of an editor press themselves.
    const calendar = within(editedRow()!).getByRole('button', { name: 'Choose date' });
    focusOn(calendar);
    press(calendar, 'Enter');
    expect(onSaving).not.toHaveBeenCalled();
    // A control whose popup is open takes the key to choose in it.
    const status = within(editedRow()!).getByRole('combobox', { name: 'Status' });
    focusOn(status);
    status.setAttribute('aria-expanded', 'true');
    press(status, 'Enter');
    status.setAttribute('aria-expanded', 'false');
    expect(onSaving).not.toHaveBeenCalled();
    // An input method that confirms a candidate with Enter owns the key.
    focusOn(input('Customer'));
    press(input('Customer'), 'Enter', { isComposing: true });
    press(input('Customer'), 'Enter', { keyCode: 229 });
    expect(onSaving).not.toHaveBeenCalled();
    expect(editedRow()).not.toBeNull();
    press(input('Customer'), 'Enter');
    expect(onSaving).toHaveBeenCalledTimes(1);
  });

  it('do not save with Enter from a Textarea', () => {
    const onSaving = vi.fn();
    const columns: DataGridColumn<Order>[] = [
      COLUMNS[0]!,
      {
        field: 'note',
        caption: 'Note',
        editor: () => <textarea aria-label="Note" defaultValue="a" />,
      },
    ];
    render(<Orders columns={columns} onSaving={onSaving} />);
    startEdit('DH-1');
    press(screen.getByLabelText('Note'), 'Enter');
    expect(onSaving).not.toHaveBeenCalled();
    expect(editedRow()).not.toBeNull();
  });

  it('give the edit up with Esc, put the focus on the cell, and drop what was typed', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    expect(press(input('Customer'), 'Escape')).toBe(true);
    expect(editedRow()).toBeNull();
    expect(cell('DH-1', 'Customer')).toHaveFocus();
    expect(rowOf('DH-1')).toHaveTextContent('An');
    startEdit('DH-1');
    expect(input('Customer').value).toBe('An');
    expect(onSaving).not.toHaveBeenCalled();
  });

  it('leave the first Esc to a control whose popup is open, and give the edit up with the second', () => {
    render(<Orders />);
    startEdit('DH-1');
    const status = within(editedRow()!).getByRole('combobox', { name: 'Status' });
    focusOn(status);
    status.setAttribute('aria-expanded', 'true');
    expect(press(status, 'Escape')).toBe(false);
    expect(editedRow()).not.toBeNull();
    status.setAttribute('aria-expanded', 'false');
    press(status, 'Escape');
    expect(editedRow()).toBeNull();
  });

  it('leave every other key of an editor, ✓ and ✕ to them: Tab, the arrows and F2 are not cancelled or moved', () => {
    render(<Orders />);
    startEdit('DH-1');
    for (const key of ['Tab', 'ArrowLeft', 'ArrowDown', 'Home', 'F2', 'a']) {
      expect(press(input('Customer'), key)).toBe(false);
    }
    for (const key of ['Tab', 'ArrowLeft', 'F2']) {
      expect(press(screen.getByRole('button', { name: 'Save DH-1' }), key)).toBe(false);
    }
    expect(editedRow()).not.toBeNull();
  });

  it('keep the arrows of the grid on a cell of the row being edited that holds no control', () => {
    render(<Orders />);
    startEdit('DH-1');
    focusOn(cell('DH-1', 'Order'));
    expect(press(cell('DH-1', 'Order'), 'ArrowRight')).toBe(true);
    expect(editedRow()).not.toBeNull();
  });

  it('save from a cell of the row being edited that holds no control', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    focusOn(cell('DH-1', 'Order'));
    press(cell('DH-1', 'Order'), 'Enter');
    expect(onSaving).toHaveBeenCalledTimes(1);
  });

  it('take no key when the grid does not edit', () => {
    const onRowActivate = vi.fn();
    render(<Orders editing={undefined} onRowActivate={onRowActivate} />);
    focusOn(cell('DH-1', 'Qty'));
    press(cell('DH-1', 'Qty'), 'Enter');
    expect(onRowActivate).toHaveBeenCalledTimes(1);
    expect(editedRow()).toBeNull();
  });
});

describe('the focus when the editors go', () => {
  it('goes to the cell of the editor that had it after a save, never to the body', () => {
    render(<Orders />);
    startEdit('DH-1');
    focusOn(input('Qty'));
    click(saveButton('DH-1'));
    // The press on ✓ gave it the button, whose cell is the cell of the buttons.
    expect(document.activeElement).not.toBe(document.body);
    expect(table().contains(document.activeElement)).toBe(true);
  });

  it('goes to the cell of the buttons after ✕, and to the cell of the editor after Esc', () => {
    render(<Orders />);
    startEdit('DH-1');
    focusOn(screen.getByRole('button', { name: 'Cancel editing DH-1' }));
    click(screen.getByRole('button', { name: 'Cancel editing DH-1' }));
    expect(document.activeElement).toBe(cellOf(rowOf('DH-1'), 'Actions'));
    startEdit('DH-1');
    focusOn(input('Qty'));
    press(input('Qty'), 'Escape');
    expect(document.activeElement).toBe(cellOf(rowOf('DH-1'), 'Qty'));
  });

  it('follows the row to where the new data puts it, and never drops to the body', () => {
    function Sorted() {
      const [data, setData] = useState(ORDERS);
      return (
        <Orders
          data={data}
          defaultSort={[{ field: 'qty', direction: 'asc' }]}
          onSaving={(changes) =>
            setData(
              data.map((row) => {
                const change = changes.find((one) => one.key === row.id);
                return change && change.type === 'update' ? { ...row, ...change.data } : row;
              }),
            )
          }
        />
      );
    }
    render(<Sorted />);
    // Qty ascending: DH-3 (1), DH-1 (3), DH-2 (5).
    expect(dataRows().map((row) => row.querySelector('th')!.textContent)).toEqual([
      'DH-3',
      'DH-1',
      'DH-2',
    ]);
    startEdit('DH-1');
    focusOn(input('Qty'));
    type('Qty', '9');
    press(input('Qty'), 'Enter');
    expect(dataRows().map((row) => row.querySelector('th')!.textContent)).toEqual([
      'DH-3',
      'DH-2',
      'DH-1',
    ]);
    expect(table().contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(cellOf(rowOf('DH-1'), 'Qty'));
  });
});

describe('the place after a save that moves the row (grouped and paged grids)', () => {
  const MORE: Order[] = [
    ...ORDERS,
    { ...ORDERS[0]!, id: 'DH-4', customer: 'Dung', channel: 'Store', qty: 2 },
    { ...ORDERS[1]!, id: 'DH-5', customer: 'Em', channel: 'Web', qty: 4 },
    { ...ORDERS[2]!, id: 'DH-6', customer: 'Giang', channel: 'Phone', qty: 6 },
  ];
  // The app saves by writing the change over its data, as the docs say.
  function Saved(props: Partial<DataGridProps<Order>>) {
    const [data, setData] = useState(MORE);
    return (
      <Orders
        data={data}
        onSaving={(changes) =>
          setData(
            data.map((row) => {
              const change = changes.find((one) => one.key === row.id);
              return change && change.type === 'update' ? { ...row, ...change.data } : row;
            }),
          )
        }
        {...props}
      />
    );
  }
  const channelColumns: DataGridColumn<Order>[] = [
    COLUMNS[0]!,
    COLUMNS[1]!,
    { field: 'channel', caption: 'Channel' },
  ];
  // The grouping is by a column that is not drawn; a computed one writes it.
  const groupedColumns: DataGridColumn<Order>[] = [
    COLUMNS[0]!,
    COLUMNS[1]!,
    { field: 'channel', caption: 'Group', visible: false },
    dataGridColumn<Order>()({
      id: 'where',
      caption: 'Where',
      value: (row) => row.channel,
      setValue: (row, value) => ({ ...row, channel: String(value) }),
    }),
  ];
  const groupedProps = {
    columns: groupedColumns,
    grouping: [{ field: 'channel', direction: 'asc' }] as const,
    defaultExpandedGroups: { allExpanded: true, except: [] },
  };
  const move = (name: string, to: string) => {
    startEdit(name);
    type('Where', to);
    focusOn(input('Where'));
    press(input('Where'), 'Enter');
  };

  it('keeps the place on the row when it goes to another group of the page', () => {
    render(<Saved {...groupedProps} grouping={[...groupedProps.grouping]} />);
    move('DH-1', 'Web');
    expect(editedRow()).toBeNull();
    expect(document.activeElement).not.toBe(document.body);
    // DH-1 is now among the rows of the Web group, and the cell that has the focus is one of its cells.
    expect(rowOf('DH-1').contains(document.activeElement)).toBe(true);
  });

  it('falls to the row at the same place when the row goes to another page', () => {
    render(
      <Saved
        columns={channelColumns}
        paging={{ pageSize: 2 }}
        defaultSort={[{ field: 'channel', direction: 'asc' }]}
      />,
    );
    // Page 1 by channel: DH-3 and DH-6 (Phone). Moving DH-3 to Web takes it off the page.
    startEdit('DH-3');
    type('Channel', 'Web');
    focusOn(input('Channel'));
    press(input('Channel'), 'Enter');
    expect(editedRow()).toBeNull();
    expect(document.activeElement).not.toBe(document.body);
    expect(table().contains(document.activeElement)).toBe(true);
  });

  it('keeps the focus in the grid when the row goes into a group that is closed', () => {
    render(
      <Saved
        {...groupedProps}
        grouping={[...groupedProps.grouping]}
        defaultExpandedGroups={{ allExpanded: false, except: [] }}
      />,
    );
    // Every group is closed: open the group of DH-1 (Store) and move the row into the Web group, closed.
    const groups = Array.from(table().querySelectorAll<HTMLElement>('.flg-data-grid-group-row'));
    act(() => groups.find((row) => row.textContent?.includes('Store'))!.click());
    move('DH-1', 'Web');
    expect(document.activeElement).not.toBe(document.body);
    expect(table().contains(document.activeElement)).toBe(true);
  });
});

describe('a press in the row being edited', () => {
  it('in an editor, or beside it, chooses no row and activates nothing', () => {
    const onSelectedKeysChange = vi.fn();
    const onRowActivate = vi.fn();
    render(
      <Orders
        selectionMode="single"
        onSelectedKeysChange={onSelectedKeysChange}
        onRowActivate={onRowActivate}
      />,
    );
    startEdit('DH-1');
    const editor = within(editedRow()!)
      .getAllByRole('textbox')
      .find((one) => one.getAttribute('aria-label') === 'Customer')!;
    click(editor);
    const padding = cellOf(rowOf('DH-1'), 'Customer');
    click(padding);
    fireEvent.doubleClick(padding);
    fireEvent.doubleClick(cellOf(rowOf('DH-1'), 'Actions'));
    expect(onSelectedKeysChange).not.toHaveBeenCalled();
    expect(onRowActivate).not.toHaveBeenCalled();
  });

  it('on a button of the cell of the buttons, chooses no row', () => {
    const onSelectedKeysChange = vi.fn();
    render(<Orders selectionMode="single" onSelectedKeysChange={onSelectedKeysChange} />);
    startEdit('DH-1');
    expect(onSelectedKeysChange).not.toHaveBeenCalled();
    click(screen.getByRole('button', { name: 'Cancel editing DH-1' }));
    click(edit('DH-2'));
    expect(onSelectedKeysChange).not.toHaveBeenCalled();
  });

  it('on the padding of an editor cell, cancels the mousedown so that the focus stays', () => {
    render(<Orders />);
    startEdit('DH-1');
    focusOn(input('Customer'));
    const padding = cellOf(rowOf('DH-1'), 'Qty');
    const event = createEvent.mouseDown(padding, { bubbles: true, cancelable: true, button: 0 });
    act(() => void fireEvent(padding, event));
    expect(event.defaultPrevented).toBe(true);
    expect(input('Customer')).toHaveFocus();
  });
});

describe('the release of the controls', () => {
  it('leaves the controls of an editor and of ✓ and ✕ where the grid puts them, and releases the rest of a custom cell', () => {
    const columns: DataGridColumn<Order>[] = [
      COLUMNS[0]!,
      {
        field: 'customer',
        caption: 'Customer',
        cell: (ctx) => <a href="#x">{ctx.text}</a>,
      },
      {
        field: 'note',
        caption: 'Note',
        allowEditing: false,
        cell: (ctx) => <a href="#y">{ctx.text}</a>,
      },
    ];
    render(<Orders columns={columns} />);
    // One stop for the grid: the links of the cells are out of the Tab order.
    expect(
      Array.from(table().querySelectorAll<HTMLAnchorElement>('tbody a')).every(
        (link) => link.getAttribute('tabindex') === '-1',
      ),
    ).toBe(true);
    startEdit('DH-1');
    // The editor of the customer is an input, which the grid does not release; ✓ and ✕ are in the order.
    expect(input('Customer').getAttribute('tabindex')).toBeNull();
    expect(saveButton('DH-1')).not.toHaveAttribute('tabindex', '-1');
    // The read-only custom cell of the edited row keeps its one stop.
    expect(
      editedRow()!.querySelector<HTMLAnchorElement>('a[href="#y"]')!.getAttribute('tabindex'),
    ).toBe('-1');
  });
});

describe('the Tab order of the buttons before any effect runs', () => {
  it('server-renders no Edit button of a row, and no handle of a row that is not the active place, as a Tab stop', () => {
    const host = document.createElement('div');
    host.innerHTML = renderToString(
      <Orders rowReorder onRowReorder={() => {}} editing={{ mode: 'row' }} />,
    );
    const buttons = Array.from(host.querySelectorAll<HTMLButtonElement>('tbody button')).filter(
      (button) => /^(Edit|Reorder) DH-/.test(button.getAttribute('aria-label') ?? ''),
    );
    expect(buttons).toHaveLength(6);
    // The active place is the first row's handle cell: its handle is the one stop, no Edit button is.
    expect(
      buttons
        .filter((button) => button.getAttribute('tabindex') !== '-1')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Reorder DH-1']);
  });

  it('warns of nothing at mount for a grid with row handles and the buttons of editing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Orders rowReorder onRowReorder={() => {}} editing={{ mode: 'row' }} />);
    expect(warn).not.toHaveBeenCalled();
  });
});

// What validation, a rejected save and Delete add (spec phase 6 §6.3 "Kiểm tra dữ liệu", "Xoá", §4.3 E2).
const RULED: DataGridColumn<Order>[] = [
  COLUMNS[0]!,
  { field: 'customer', caption: 'Customer', width: 140, validationRules: [{ type: 'required' }] },
  {
    field: 'qty',
    caption: 'Qty',
    dataType: 'number',
    width: 100,
    validationRules: [{ type: 'range', min: 1, max: 9 }],
  },
  {
    field: 'placed',
    caption: 'Order date',
    dataType: 'date',
    width: 150,
    validationRules: [{ type: 'required' }],
  },
];
// The cells only: an Input says data-invalid of itself too.
const invalidCells = () =>
  Array.from(editedRow()!.querySelectorAll<HTMLElement>(':scope > [data-invalid]'));
// What the live regions of the page say (an editor may have a region of its own).
const said = () =>
  Array.from(
    document.querySelectorAll('[aria-live="polite"]'),
    (region) => region.textContent,
  ).join(' ');
const leave = (from: string, to: string) => {
  focusOn(input(from));
  focusOn(input(to));
};
/** The words that an invalid editor is described by: the hidden copy of the message, in its cell. */
const describedBy = (label: string): string | undefined => {
  const id = input(label).getAttribute('aria-describedby');
  return id ? (document.getElementById(id)?.textContent ?? undefined) : undefined;
};

describe('validation in the cells', () => {
  it('marks a field when its editor lets go of the focus: the cell, the editor and the hidden words', () => {
    render(<Orders columns={RULED} />);
    startEdit('DH-1');
    type('Customer', '');
    // Nothing is said while the field is being typed in.
    expect(invalidCells()).toHaveLength(0);
    leave('Customer', 'Qty');
    expect(invalidCells()).toEqual([cellOf(editedRow()!, 'Customer')]);
    expect(input('Customer')).toHaveAttribute('aria-invalid', 'true');
    expect(describedBy('Customer')).toBe('Customer is required');
    expect(input('Qty')).not.toHaveAttribute('aria-invalid');
  });

  it('describes the editor of every type by the words of its message: text, number, date, list and box', () => {
    const bad = [{ type: 'custom', validate: () => 'Bad', message: 'Bad' } as const];
    render(
      <Orders
        columns={[
          COLUMNS[0]!,
          { ...COLUMNS[1]!, validationRules: bad },
          { ...COLUMNS[2]!, validationRules: bad },
          { ...COLUMNS[3]!, validationRules: bad },
          { ...COLUMNS[4]!, validationRules: bad },
          { ...COLUMNS[5]!, validationRules: bad },
        ]}
      />,
    );
    startEdit('DH-1');
    type('Customer', 'Hoa');
    click(saveButton('DH-1'));
    const row = editedRow()!;
    for (const label of ['Customer', 'Status', 'Qty', 'Order date', 'Paid']) {
      // A Select names its button and its list alike: the button is the one that is refused.
      const control = within(row)
        .getAllByLabelText(label)
        .find((one) => one.getAttribute('aria-invalid') === 'true');
      expect(control, label).toBeDefined();
      const id = control!.getAttribute('aria-describedby');
      expect(document.getElementById(id!), label).toHaveTextContent('Bad');
    }
  });

  it('keeps the words of the first rule that fails, from labels.validation or the rule', () => {
    render(
      <Orders
        columns={[
          RULED[0]!,
          RULED[1]!,
          {
            ...RULED[2]!,
            validationRules: [{ type: 'range', min: 1, max: 9, message: 'Too many' }],
          },
        ]}
        labels={{ validation: { required: (caption) => `${caption} đang trống` } }}
      />,
    );
    startEdit('DH-1');
    type('Customer', '');
    type('Qty', '12');
    leave('Customer', 'Qty');
    leave('Qty', 'Customer');
    expect(describedBy('Customer')).toBe('Customer đang trống');
    expect(describedBy('Qty')).toBe('Too many');
  });

  it('clears the mark at the next commit of the field, once it passes', () => {
    render(<Orders columns={RULED} />);
    startEdit('DH-1');
    type('Customer', '');
    leave('Customer', 'Qty');
    expect(invalidCells()).toHaveLength(1);
    type('Customer', 'Hoa');
    // Still marked until the commit: the words do not flicker while the user types.
    expect(invalidCells()).toHaveLength(1);
    leave('Customer', 'Qty');
    expect(invalidCells()).toHaveLength(0);
    expect(input('Customer')).not.toHaveAttribute('aria-invalid');
    expect(input('Customer')).not.toHaveAttribute('aria-describedby');
  });

  it('sends nothing on a save with errors, focuses the first of them and says how many fields', async () => {
    const onSaving = vi.fn();
    render(<Orders columns={RULED} onSaving={onSaving} />);
    startEdit('DH-3');
    type('Customer', '');
    type('Qty', '30');
    act(() => void fireEvent.blur(input('Qty')));
    click(saveButton('DH-3'));
    expect(onSaving).not.toHaveBeenCalled();
    expect(editedRow()).not.toBeNull();
    // Customer, Qty and the Order date nobody touched (it is empty and required): three fields.
    expect(invalidCells()).toHaveLength(3);
    expect(input('Customer')).toHaveFocus();
    await tick();
    expect(said()).toContain('3 fields need attention');
  });

  it('says one field in the singular, and focuses the first error in the order of the cells', async () => {
    render(<Orders columns={RULED} />);
    startEdit('DH-3');
    type('Customer', 'Chi!');
    click(saveButton('DH-3'));
    expect(invalidCells()).toHaveLength(1);
    expect(input('Order date')).toHaveFocus();
    await tick();
    expect(said()).toContain('1 field needs attention');
  });

  it('focuses the error again at each save that finds one, though it is the same field', () => {
    render(<Orders columns={RULED} />);
    startEdit('DH-1');
    type('Customer', '');
    click(saveButton('DH-1'));
    expect(input('Customer')).toHaveFocus();
    focusOn(input('Qty'));
    click(saveButton('DH-1'));
    expect(input('Customer')).toHaveFocus();
  });

  it('saves once the fields pass, with the changed fields only', () => {
    const onSaving = vi.fn();
    render(<Orders columns={RULED} onSaving={onSaving} />);
    startEdit('DH-1');
    type('Customer', '');
    click(saveButton('DH-1'));
    expect(onSaving).not.toHaveBeenCalled();
    type('Customer', 'Hoa');
    click(saveButton('DH-1'));
    expect(sent(onSaving)).toEqual([
      { type: 'update', key: 'DH-1', data: { customer: 'Hoa' }, row: ORDERS[0] },
    ]);
    expect(editedRow()).toBeNull();
    expect(table().querySelector('[data-invalid]')).toBeNull();
  });

  it('checks no field of a row that changed nothing, and none of a column the row does not draw', () => {
    const onSaving = vi.fn();
    const { unmount } = render(<Orders columns={RULED} onSaving={onSaving} />);
    startEdit('DH-3');
    click(saveButton('DH-3'));
    expect(editedRow()).toBeNull();
    expect(onSaving).not.toHaveBeenCalled();
    unmount();
    render(
      <Orders columns={RULED} onSaving={onSaving} defaultColumnLayout={{ hidden: ['placed'] }} />,
    );
    startEdit('DH-3');
    type('Customer', 'Chi!');
    click(saveButton('DH-3'));
    expect(sent(onSaving)).toHaveLength(1);
  });

  it('checks the cells that can be edited, not a read-only one', () => {
    const columns: DataGridColumn<Order>[] = [
      COLUMNS[0]!,
      RULED[1]!,
      { ...RULED[3]!, allowEditing: false },
    ];
    const onSaving = vi.fn();
    render(<Orders columns={columns} onSaving={onSaving} />);
    startEdit('DH-3');
    type('Customer', 'Chi!');
    click(saveButton('DH-3'));
    expect(onSaving).toHaveBeenCalledTimes(1);
  });

  it('gives a custom editor invalid and the id of the words, and commit() settles its field', () => {
    const seen: { invalid: boolean; errorId: string | undefined }[] = [];
    let commit!: () => void;
    const columns: DataGridColumn<Order>[] = [
      COLUMNS[0]!,
      {
        field: 'customer',
        caption: 'Customer',
        validationRules: [{ type: 'required' }],
        editor: (ctx) => {
          seen.push({ invalid: ctx.invalid, errorId: ctx.errorId });
          commit = ctx.commit;
          return (
            <button type="button" aria-describedby={ctx.errorId} onClick={() => ctx.setValue('')}>
              Clear
            </button>
          );
        },
      },
    ];
    render(<Orders columns={columns} />);
    startEdit('DH-1');
    expect(seen.at(-1)).toEqual({ invalid: false, errorId: undefined });
    click(within(editedRow()!).getByRole('button', { name: 'Clear' }));
    act(() => commit());
    const last = seen.at(-1)!;
    expect(last.invalid).toBe(true);
    expect(document.getElementById(last.errorId!)).toHaveTextContent('Customer is required');
    expect(within(editedRow()!).getByRole('button', { name: 'Clear' })).toHaveAttribute(
      'aria-describedby',
      last.errorId,
    );
  });

  it('opens the message in a tooltip while the cell has the focus within, and closes it after', () => {
    render(<Orders columns={RULED} />);
    startEdit('DH-1');
    type('Customer', '');
    leave('Customer', 'Qty');
    const tip = () =>
      within(editedRow()!)
        .getAllByRole('tooltip', { hidden: true })
        .find((one) => one.textContent === 'Customer is required');
    expect(tip()).toHaveTextContent('Customer is required');
    expect(showing.has(tip()!)).toBe(false);
    focusOn(input('Customer'));
    expect(showing.has(tip()!)).toBe(true);
    focusOn(input('Qty'));
    expect(showing.has(tip()!)).toBe(false);
  });

  it('closes the tooltip with the first Esc and keeps the edit; the next Esc gives the edit up', () => {
    render(<Orders columns={RULED} />);
    startEdit('DH-1');
    type('Customer', '');
    leave('Customer', 'Qty');
    focusOn(input('Customer'));
    const tip = () =>
      within(editedRow()!)
        .getAllByRole('tooltip', { hidden: true })
        .find((one) => one.textContent === 'Customer is required')!;
    expect(showing.has(tip())).toBe(true);
    press(input('Customer'), 'Escape');
    expect(showing.has(tip())).toBe(false);
    expect(editedRow()).not.toBeNull();
    press(input('Customer'), 'Escape');
    expect(editedRow()).toBeNull();
  });

  it('draws no mark and no tooltip once the edit ends', () => {
    render(<Orders columns={RULED} />);
    startEdit('DH-1');
    type('Customer', '');
    click(saveButton('DH-1'));
    expect(invalidCells()).toHaveLength(1);
    click(screen.getByRole('button', { name: 'Cancel editing DH-1' }));
    expect(table().querySelector('[data-invalid]')).toBeNull();
    expect(table()).not.toHaveTextContent('Customer is required');
  });
});

describe('a save that is refused', () => {
  const alert = () => document.querySelector<HTMLElement>('.flg-data-grid [role="alert"]');
  const refuse = (reason: unknown) => vi.fn(() => Promise.reject(reason));
  const failedEdit = async (reason: unknown, props: Partial<DataGridProps<Order>> = {}) => {
    const onSaving = refuse(reason);
    render(<Orders onSaving={onSaving} {...props} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    click(saveButton('DH-1'));
    await act(async () => {});
    return onSaving;
  };

  it('keeps the edit and shows one error alert with the words of the error', async () => {
    await failedEdit({ message: 'Server is busy' });
    expect(editedRow()).not.toBeNull();
    expect(input('Customer').value).toBe('Hoa');
    expect(alert()).toHaveTextContent('Server is busy');
    expect(alert()).toHaveAttribute('data-status', 'error');
    expect(document.querySelectorAll('.flg-data-grid [role="alert"]')).toHaveLength(1);
    // Between the toolbar and the main part, outside the frame.
    expect(alert()!.nextElementSibling).toHaveClass('flg-data-grid-main');
  });

  it('says labels.saveFailed for an error with no words', async () => {
    await failedEdit(new Error(''));
    expect(alert()).toHaveTextContent('The changes could not be saved.');
  });

  it('says its own words when labels give them', async () => {
    await failedEdit(undefined, { labels: { saveFailed: 'Không lưu được' } });
    expect(alert()).toHaveTextContent('Không lưu được');
  });

  it('names its dismiss button by labels.dismissError', async () => {
    await failedEdit({ message: 'Server is busy' }, { labels: { dismissError: 'Đóng lỗi' } });
    expect(within(alert()!).getByRole('button', { name: 'Đóng lỗi' })).toBeInTheDocument();
    expect(within(alert()!).queryByRole('button', { name: 'Dismiss' })).toBeNull();
  });

  it('is dismissed by its button, and the focus goes to the place and not to the page', async () => {
    await failedEdit({ message: 'Server is busy' });
    const dismiss = within(alert()!).getByRole('button', { name: 'Dismiss' });
    focusOn(dismiss);
    click(dismiss);
    expect(alert()).toBeNull();
    expect(editedRow()).not.toBeNull();
    expect(document.activeElement).not.toBe(document.body);
    expect(table().contains(document.activeElement)).toBe(true);
  });

  it('goes at the next save, and the next refusal shows its own words', async () => {
    const onSaving = await failedEdit({ message: 'First' });
    expect(alert()).toHaveTextContent('First');
    onSaving.mockImplementationOnce(() => Promise.reject({ message: 'Second' }));
    click(saveButton('DH-1'));
    // Gone while the save is pending.
    expect(alert()).toBeNull();
    await act(async () => {});
    expect(alert()).toHaveTextContent('Second');
  });

  it('goes when the edit is given up, or editing turns off', async () => {
    const onSaving = refuse({ message: 'No' });
    const { rerender } = render(<Orders onSaving={onSaving} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    click(saveButton('DH-1'));
    await act(async () => {});
    expect(alert()).not.toBeNull();
    rerender(<Orders editing={undefined} onSaving={onSaving} />);
    expect(alert()).toBeNull();
    rerender(<Orders onSaving={onSaving} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    click(saveButton('DH-1'));
    await act(async () => {});
    expect(alert()).not.toBeNull();
    click(screen.getByRole('button', { name: 'Cancel editing DH-1' }));
    expect(alert()).toBeNull();
  });

  it('leaves the focus where it was, and the save button ready again', async () => {
    const onSaving = refuse({ message: 'No' });
    render(<Orders onSaving={onSaving} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    focusOn(saveButton('DH-1'));
    click(saveButton('DH-1'));
    await act(async () => {});
    expect(saveButton('DH-1')).toHaveFocus();
    expect(saveButton('DH-1')).not.toHaveAttribute('data-loading');
  });

  it('is told of a save that throws, as a refusal', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Orders
        onSaving={() => {
          throw new Error('no');
        }}
      />,
    );
    startEdit('DH-1');
    type('Customer', 'Hoa');
    click(saveButton('DH-1'));
    expect(editedRow()).not.toBeNull();
    expect(alert()).toHaveTextContent('The changes could not be saved.');
  });

  it('marks the cell that a field error names, by id or by field, and the alert takes the rest', async () => {
    await failedEdit({
      message: 'Check the form.',
      fieldErrors: [
        { key: 'DH-1', field: 'customer', message: 'Already taken' },
        { key: 'DH-1', field: 'total', message: 'Too big' },
      ],
    });
    expect(invalidCells()).toEqual([cellOf(editedRow()!, 'Customer')]);
    expect(describedBy('Customer')).toBe('Already taken');
    expect(alert()!.textContent).toContain('Check the form.');
    // A computed column is read-only here: its message goes to the alert, not to a cell.
    expect(alert()!.textContent).toContain('Too big');
    expect(alert()!.textContent).not.toContain('Already taken');
    // The focus stays where it was.
    expect(saveButton('DH-1')).toHaveFocus();
  });

  it('adds the message of a field the row does not draw to the alert', async () => {
    await failedEdit(
      { fieldErrors: [{ key: 'DH-1', field: 'qty', message: 'Qty is odd' }] },
      { defaultColumnLayout: { hidden: ['qty'] } },
    );
    expect(invalidCells()).toHaveLength(0);
    expect(alert()).toHaveTextContent('The changes could not be saved. Qty is odd');
  });

  it('keeps the mark of a server error through a field that has no rule', async () => {
    await failedEdit(
      { fieldErrors: [{ key: 'DH-1', field: 'status', message: 'Closed' }] },
      { columns: RULED.concat([{ field: 'status', caption: 'Status', dataType: 'number' }]) },
    );
    expect(invalidCells()).toHaveLength(1);
    // Passing through a field that has no rule to check settles nothing: the server's word stays.
    leave('Status', 'Qty');
    expect(invalidCells()).toHaveLength(1);
  });

  it('clears the mark of a server error at the next commit of a field whose rules pass', async () => {
    await failedEdit(
      { fieldErrors: [{ key: 'DH-1', field: 'customer', message: 'Already taken' }] },
      { columns: RULED },
    );
    expect(invalidCells()).toHaveLength(1);
    leave('Customer', 'Qty');
    expect(invalidCells()).toHaveLength(0);
  });
});

describe('Delete', () => {
  // jsdom has no showModal(): a stand-in that toggles `open` and fires `close`, as a browser does.
  const original = {
    showModal: HTMLDialogElement.prototype.showModal,
    close: HTMLDialogElement.prototype.close,
  };
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      if (!this.hasAttribute('open')) return;
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  });
  afterAll(() => Object.assign(HTMLDialogElement.prototype, original));
  const deleting = (more: Partial<DataGridProps<Order>> = {}) => (
    <Orders editing={{ mode: 'row', allowDeleting: true }} {...more} />
  );
  const noConfirm = { mode: 'row', allowDeleting: true, confirmDelete: false } as const;
  const del = (name: string) => screen.getByRole('button', { name: `Delete ${name}` });
  const confirm = () => document.querySelector<HTMLDialogElement>('dialog.flg-dialog');
  const confirmOpen = () => confirm()?.hasAttribute('open') === true;

  it('draws no button without allowDeleting, one after Edit with it, and none where the function says no', () => {
    const { rerender } = render(<Orders />);
    expect(screen.queryByRole('button', { name: /^Delete/ })).toBeNull();
    rerender(deleting());
    expect(screen.getAllByRole('button', { name: /^Delete/ })).toHaveLength(3);
    const cell = cellOf(rowOf('DH-1'), 'Actions');
    expect(
      Array.from(cell.querySelectorAll('button'), (button) => button.getAttribute('aria-label')),
    ).toEqual(['Edit DH-1', 'Delete DH-1']);
    expect(del('DH-1')).toHaveAttribute('tabindex', '-1');
    rerender(<Orders editing={{ mode: 'row', allowDeleting: (row) => row.id !== 'DH-2' }} />);
    expect(screen.queryByRole('button', { name: 'Delete DH-2' })).toBeNull();
    expect(edit('DH-2')).toBeInTheDocument();
  });

  it('draws the column for a grid that can delete and not update, with no Edit', () => {
    render(<Orders editing={{ mode: 'row', allowUpdating: false, allowDeleting: true }} />);
    expect(table().querySelector('.flg-data-grid-actions')).not.toBeNull();
    expect(screen.queryByRole('button', { name: /^Edit/ })).toBeNull();
    expect(del('DH-1')).toBeInTheDocument();
  });

  it('draws none on the row being edited, which has Save and Cancel', () => {
    render(deleting());
    startEdit('DH-1');
    expect(screen.queryByRole('button', { name: 'Delete DH-1' })).toBeNull();
    expect(del('DH-2')).toBeInTheDocument();
  });

  it('opens one dialog with the title, the name of the row and Cancel focused', () => {
    render(deleting());
    click(del('DH-2'));
    expect(confirmOpen()).toBe(true);
    expect(document.querySelectorAll('dialog.flg-dialog')).toHaveLength(1);
    expect(confirm()).toHaveAttribute('role', 'alertdialog');
    expect(confirm()).toHaveAccessibleName('Delete this row?');
    expect(confirm()).toHaveAccessibleDescription('DH-2 will be deleted.');
    const buttons = within(confirm()!).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['Cancel', 'Delete']);
    expect(buttons[0]).toHaveFocus();
  });

  it('sends one remove when Delete is chosen in the dialog, and the dialog is closed first', async () => {
    let resolve!: () => void;
    const onSaving = vi.fn(() => new Promise<void>((done) => (resolve = done)));
    render(deleting({ onSaving }));
    click(del('DH-2'));
    expect(onSaving).not.toHaveBeenCalled();
    click(within(confirm()!).getByRole('button', { name: 'Delete' }));
    expect(sent(onSaving)).toEqual([{ type: 'remove', key: 'DH-2', row: ORDERS[1] }]);
    expect(onSaving).toHaveBeenCalledTimes(1);
    // The dialog does not wait for the answer; the table does.
    expect(confirmOpen()).toBe(false);
    expect(table()).toHaveAttribute('aria-busy', 'true');
    await act(async () => resolve());
    expect(table()).not.toHaveAttribute('aria-busy');
    await tick();
    expect(said()).toContain('Row deleted');
  });

  it('says labels.announceRowDeleted when a delete that was sent at once resolves, and not before', async () => {
    let resolve!: () => void;
    const onSaving = vi.fn(() => new Promise<void>((done) => (resolve = done)));
    render(deleting({ onSaving, editing: noConfirm }));
    click(del('DH-2'));
    await tick();
    expect(said()).not.toContain('Row deleted');
    await act(async () => resolve());
    await tick();
    expect(said()).toContain('Row deleted');
  });

  it('says it for an answer that is no Promise too', async () => {
    render(deleting({ onSaving: vi.fn(), editing: noConfirm }));
    click(del('DH-2'));
    await tick();
    expect(said()).toContain('Row deleted');
  });

  it('shows the alert, keeps the row and ends the wait when onSaving throws on a remove', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onSaving = vi.fn(() => {
      throw new Error('no');
    });
    render(deleting({ onSaving, editing: noConfirm }));
    click(del('DH-2'));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(rowOf('DH-2')).toBeTruthy();
    expect(document.querySelector('.flg-data-grid [role="alert"]')).toHaveTextContent('no');
    expect(said()).not.toContain('Row deleted');
    expect(table()).not.toHaveAttribute('aria-busy');
    expect(
      warn.mock.calls.filter((call) => String(call[0]).includes('onSaving threw')),
    ).toHaveLength(1);
    // Nothing waits: the next press sends again.
    click(del('DH-2'));
    expect(onSaving).toHaveBeenCalledTimes(2);
  });

  it('sends nothing on Cancel or Esc, and gives the focus back to the cell of the row', () => {
    const onSaving = vi.fn();
    render(deleting({ onSaving }));
    focusOn(del('DH-2'));
    click(del('DH-2'));
    click(within(confirm()!).getByRole('button', { name: 'Cancel' }));
    expect(confirmOpen()).toBe(false);
    expect(onSaving).not.toHaveBeenCalled();
    expect(cellOf(rowOf('DH-2'), 'Actions')).toHaveFocus();
    click(del('DH-2'));
    act(() => void fireEvent(confirm()!, new Event('cancel', { cancelable: true })));
    expect(confirmOpen()).toBe(false);
    expect(onSaving).not.toHaveBeenCalled();
  });

  it('sends the remove at once without the confirm, and the focus goes to the cell of the row', () => {
    const onSaving = vi.fn();
    render(deleting({ onSaving, editing: noConfirm }));
    focusOn(del('DH-2'));
    click(del('DH-2'));
    expect(confirm()).toBeNull();
    expect(sent(onSaving)).toEqual([{ type: 'remove', key: 'DH-2', row: ORDERS[1] }]);
    expect(cellOf(rowOf('DH-2'), 'Actions')).toHaveFocus();
  });

  it('shows the alert when the delete is refused, and the rows stay', async () => {
    render(deleting({ onSaving: () => Promise.reject({ message: 'In use' }) }));
    click(del('DH-2'));
    click(within(confirm()!).getByRole('button', { name: 'Delete' }));
    await act(async () => {});
    expect(document.querySelector('.flg-data-grid [role="alert"]')).toHaveTextContent('In use');
    expect(screen.getAllByRole('button', { name: /^Delete/ })).toHaveLength(3);
  });

  it('ignores a second press while the first delete is pending', () => {
    const onSaving = vi.fn(() => new Promise<void>(() => {}));
    render(deleting({ onSaving, editing: noConfirm }));
    click(del('DH-2'));
    click(del('DH-3'));
    expect(onSaving).toHaveBeenCalledTimes(1);
  });

  it('closes the dialog for good when its row leaves the rows, when editing turns off or its mode changes', () => {
    const { rerender } = render(deleting());
    click(del('DH-2'));
    expect(confirmOpen()).toBe(true);
    rerender(deleting({ data: ORDERS.filter((order) => order.id !== 'DH-2') }));
    expect(confirmOpen()).toBe(false);
    rerender(deleting());
    expect(confirmOpen()).toBe(false);
    click(del('DH-2'));
    rerender(<Orders editing={undefined} />);
    expect(document.querySelector('dialog')).toBeNull();
  });

  it('reaches Delete by keys: Enter into the cell of the buttons, then Tab', () => {
    render(deleting());
    const cell = cellOf(rowOf('DH-2'), 'Actions');
    focusOn(cell);
    press(cell, 'Enter');
    expect(document.activeElement).toBe(edit('DH-2'));
    press(document.activeElement as HTMLElement, 'Tab');
    expect(document.activeElement).toBe(del('DH-2'));
  });

  it('draws no dialog and no alert for a grid that does not edit', () => {
    render(<Orders editing={undefined} />);
    expect(document.querySelector('dialog')).toBeNull();
    expect(document.querySelector('.flg-alert')).toBeNull();
  });
});

describe('the warnings', () => {
  it('say so once when a value column with no setValue is editable, and when multiline is not for the type', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const columns: DataGridColumn<Order>[] = [
      COLUMNS[0]!,
      dataGridColumn<Order>()({
        id: 'half',
        allowEditing: true,
        value: (row) => (row.qty ?? 0) / 2,
      }),
      { field: 'qty', dataType: 'number', multiline: true },
    ];
    const { rerender } = render(<Orders columns={columns} />);
    rerender(<Orders columns={columns} />);
    const words = warn.mock.calls.map((call) => String(call[0]));
    expect(words.filter((one) => one.includes('with value and no setValue'))).toHaveLength(1);
    expect(words.filter((one) => one.includes('multiline is for string columns'))).toHaveLength(1);
  });

  it('say nothing of a value column that says it cannot be edited, or when the grid does not edit', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const columns: DataGridColumn<Order>[] = [
      COLUMNS[0]!,
      dataGridColumn<Order>()({ id: 'half', allowEditing: false, value: (row) => row.price }),
    ];
    render(<Orders columns={columns} />);
    render(
      <Orders
        editing={undefined}
        columns={[...columns, dataGridColumn<Order>()({ id: 'x', value: () => 1 })]}
      />,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('turn editing off with a warning for a value that is no object or a mode the grid does not have', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<Orders editing={'row' as unknown as DataGridEditing<Order>} />);
    expect(table().querySelector('.flg-data-grid-actions')).toBeNull();
    rerender(<Orders editing={{ mode: 'inline' } as unknown as DataGridEditing<Order>} />);
    expect(table().querySelector('.flg-data-grid-actions')).toBeNull();
    const words = warn.mock.calls.map((call) => String(call[0]));
    expect(words.some((one) => one.includes('editing is not an object'))).toBe(true);
    expect(words.some((one) => one.includes('editing has an unknown mode: editing is off.'))).toBe(
      true,
    );
  });
});

describe('strict mode and a grid in a cell of its own', () => {
  it('edits and saves the same in StrictMode, with one call for one press', () => {
    const onSaving = vi.fn();
    render(
      <StrictMode>
        <Orders onSaving={onSaving} />
      </StrictMode>,
    );
    startEdit('DH-1');
    type('Customer', 'Hoa');
    click(saveButton('DH-1'));
    expect(onSaving).toHaveBeenCalledTimes(1);
  });

  it('does not read a value an editor of a column draws as a node it cannot draw', () => {
    const columns: DataGridColumn<Order>[] = [
      COLUMNS[0]!,
      { field: 'customer', caption: 'Customer', editor: (): ReactNode => null },
    ];
    render(<Orders columns={columns} />);
    startEdit('DH-1');
    expect(editedRow()).not.toBeNull();
  });
});

/** A thenable whose `then` throws: the answer that cannot even be waited for. */
const badThenable = () => ({
  then() {
    throw new Error('then threw');
  },
});

describe('a thenable whose then throws (final review, Task 4 m4)', () => {
  it('is a refusal in row mode: the edit stays, the alert shows, and the save has ended', () => {
    const onSaving = vi.fn(badThenable);
    render(<Orders onSaving={onSaving as never} />);
    startEdit('DH-1');
    type('Customer', 'Hoa');
    click(saveButton('DH-1'));
    expect(editedRow()).not.toBeNull();
    expect(input('Customer').value).toBe('Hoa');
    expect(document.querySelector('.flg-data-grid [role="alert"]')).toHaveTextContent('then threw');
    // The save is over, so the next press sends again instead of being ignored as pending.
    expect(saveButton('DH-1')).not.toHaveAttribute('aria-busy', 'true');
    click(saveButton('DH-1'));
    expect(onSaving).toHaveBeenCalledTimes(2);
  });

  it('is a refusal of a delete too: the row stays and the alert shows', () => {
    const onSaving = vi.fn(badThenable);
    render(
      <Orders
        onSaving={onSaving as never}
        editing={{ mode: 'row', allowDeleting: true, confirmDelete: false }}
      />,
    );
    click(screen.getByRole('button', { name: 'Delete DH-1' }));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(rowOf('DH-1')).toBeTruthy();
    expect(document.querySelector('.flg-data-grid [role="alert"]')).toHaveTextContent('then threw');
    click(screen.getByRole('button', { name: 'Delete DH-1' }));
    expect(onSaving).toHaveBeenCalledTimes(2);
  });
});

describe('a pending delete of another row (final review Minor 6)', () => {
  /** A promise the test settles. */
  const later = () => {
    let resolve!: () => void;
    const promise = new Promise<void>((yes) => (resolve = yes));
    return { promise, resolve };
  };

  it('does not lock the open edit of a row: the editors stay editable and ✓ saves, while the delete waits', async () => {
    const deleting = later();
    const saving = later();
    const onSaving = vi
      .fn()
      .mockImplementationOnce(() => deleting.promise)
      .mockImplementationOnce(() => saving.promise);
    render(
      <Orders
        onSaving={onSaving}
        editing={{ mode: 'row', allowDeleting: true, confirmDelete: false }}
      />,
    );
    startEdit('DH-1');
    type('Customer', 'Hoa');
    click(screen.getByRole('button', { name: 'Delete DH-2' }));
    expect(onSaving).toHaveBeenCalledTimes(1);
    // The edit of DH-1 goes on: its editors take keys, and ✓ is not loading.
    expect(input('Customer')).not.toHaveAttribute('readonly');
    type('Customer', 'Hoang');
    expect(input('Customer').value).toBe('Hoang');
    expect(saveButton('DH-1')).not.toHaveAttribute('aria-busy', 'true');
    click(saveButton('DH-1'));
    expect(onSaving).toHaveBeenCalledTimes(2);
    expect(sent(onSaving)).toMatchObject([{ type: 'remove', key: 'DH-2' }]);
    expect(onSaving.mock.calls[1]![0]).toMatchObject([
      { type: 'update', key: 'DH-1', data: { customer: 'Hoang' } },
    ]);
    // The answer of the delete is still waited for after the edit ended, and says so.
    await act(async () => saving.resolve());
    expect(editedRow()).toBeNull();
    await act(async () => deleting.resolve());
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Row deleted');
  });

  it('still waits for the delete before another delete: the table is busy while it is pending', async () => {
    const deleting = later();
    const onSaving = vi.fn(() => deleting.promise);
    render(
      <Orders
        onSaving={onSaving}
        editing={{ mode: 'row', allowDeleting: true, confirmDelete: false }}
      />,
    );
    click(screen.getByRole('button', { name: 'Delete DH-2' }));
    click(screen.getByRole('button', { name: 'Delete DH-3' }));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(table()).toHaveAttribute('aria-busy', 'true');
    await act(async () => deleting.resolve());
    expect(table()).not.toHaveAttribute('aria-busy', 'true');
    click(screen.getByRole('button', { name: 'Delete DH-3' }));
    expect(onSaving).toHaveBeenCalledTimes(2);
  });
});

describe('a row whose delete is pending cannot be edited (review of PR #46, R6)', () => {
  const noConfirm = { mode: 'row', allowDeleting: true, confirmDelete: false } as const;
  const later = () => {
    let resolve!: () => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<void>((yes, no) => {
      resolve = yes;
      reject = no;
    });
    return { promise, resolve, reject };
  };

  it('does nothing on Edit, whose button waits with Delete, while other rows stay editable', async () => {
    const deleting = later();
    const onSaving = vi.fn(() => deleting.promise);
    render(<Orders onSaving={onSaving} editing={noConfirm} />);
    click(screen.getByRole('button', { name: 'Delete DH-1' }));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(edit('DH-1')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Delete DH-1' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    click(edit('DH-1'));
    expect(editedRow()).toBeNull();
    // Another row is another request: it can be edited.
    expect(edit('DH-2')).not.toHaveAttribute('aria-disabled');
    startEdit('DH-2');
    expect(editedRow()).toBe(rowOf('DH-2'));
    await act(async () => deleting.reject(new Error('No')));
    expect(edit('DH-1')).not.toHaveAttribute('aria-disabled');
  });

  it('gives the row back when the delete is refused, and to the app when it goes through', async () => {
    const deleting = later();
    render(<Orders onSaving={() => deleting.promise} editing={noConfirm} />);
    click(screen.getByRole('button', { name: 'Delete DH-1' }));
    await act(async () => deleting.reject(new Error('No')));
    startEdit('DH-1');
    expect(editedRow()).toBe(rowOf('DH-1'));
  });
});
