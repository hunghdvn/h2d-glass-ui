import { act, createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import type { Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type {
  DataGridChange,
  DataGridColumn,
  DataGridEditing,
  DataGridHandle,
  DataGridProps,
} from './index';

// Form mode (spec phase 6 §3.5 step 8, §3.6, §4.3 EF1, §6.3): Edit, `Enter` and `F2` open a form in the place of the row,
// with a field for every data column; Save and `Enter` in a field send it, Cancel and `Esc` give it up. What needs a
// layout engine (the card sticking left, the container query, the focus of a real browser) is in the stories.

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
  placed: string | null;
  paid: boolean;
  price: number;
  secret: string;
  note: string;
}

const STATUSES = [
  { id: 1, name: 'New' },
  { id: 2, name: 'Processing' },
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
    secret: 's1',
    note: 'first',
  },
  {
    id: 'DH-2',
    customer: 'Bình',
    status: 2,
    qty: 5,
    placed: '2026-11-06',
    paid: true,
    price: 20,
    secret: 's2',
    note: 'second',
  },
  {
    id: 'DH-3',
    customer: 'Chi',
    status: 1,
    qty: 1,
    placed: null,
    paid: false,
    price: 30,
    secret: 's3',
    note: '',
  },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, allowEditing: false, width: 100 },
  {
    field: 'customer',
    caption: 'Customer',
    width: 140,
    validationRules: [{ type: 'required' }],
  },
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
  { field: 'secret', caption: 'Secret', width: 100, form: { visible: false } },
  { field: 'note', caption: 'Note', width: 120, multiline: true },
];
const FORM: DataGridEditing<Order> = { mode: 'form' };

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
      editing={FORM}
      onSaving={() => {}}
      {...props}
    />
  );
}

const table = () => document.querySelector<HTMLTableElement>('table[role]')!;
const dataRows = () =>
  Array.from(table().querySelectorAll<HTMLTableRowElement>('tbody > tr.flg-data-grid-row'));
const rowOf = (name: string) => dataRows().find((row) => row.textContent?.includes(name))!;
const formRow = () =>
  table().querySelector<HTMLTableRowElement>('tbody > tr.flg-data-grid-form-row');
const form = () => table().querySelector<HTMLFormElement>('form.flg-data-grid-form');
const field = (label: string) => within(form()!).getByLabelText(label) as HTMLInputElement;
const fieldLabels = () =>
  Array.from(
    form()!.querySelectorAll('.flg-data-grid-form-fields > .flg-field > .flg-field-label'),
    (label) => label.textContent,
  );
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
const type = (label: string, text: string) =>
  act(() => void fireEvent.change(field(label), { target: { value: text } }));
const tick = () => act(async () => void (await new Promise((done) => setTimeout(done, 0))));
const live = () =>
  Array.from(
    document.querySelectorAll('[aria-live="polite"]'),
    (region) => region.textContent,
  ).join(' ');
const sent = (spy: ReturnType<typeof vi.fn>, call = 0): DataGridChange<Order>[] =>
  spy.mock.calls[call]![0] as DataGridChange<Order>[];
const saveButton = () => within(form()!).getByRole('button', { name: 'Save' });
const cancelButton = () => within(form()!).getByRole('button', { name: 'Cancel' });
function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe('opening the form', () => {
  it('opens in the place of the row with Edit: one form row, one cell across every column, no data row for it', () => {
    render(<Orders />);
    expect(formRow()).toBeNull();
    click(edit('DH-2'));
    expect(formRow()).not.toBeNull();
    const row = formRow()!;
    expect(row).toHaveAttribute('data-editing');
    expect(row.cells).toHaveLength(1);
    const cell = row.cells[0]!;
    expect(cell).toHaveClass('flg-data-grid-form-cell');
    expect(cell).toHaveAttribute('data-editor');
    expect(cell.colSpan).toBe(table().tHead!.rows[0]!.cells.length);
    expect(dataRows().map((one) => one.textContent?.slice(0, 4))).toEqual(['DH-1', 'DH-3']);
    // The form is a card in the cell, a form with no native validation, and the order of the rows is kept.
    expect(form()).toHaveClass('flg-surface', 'flg-card');
    expect(form()).toHaveAttribute('novalidate');
    expect(Array.from(table().tBodies[0]!.rows).indexOf(row)).toBe(1);
  });

  it('opens with Enter and with F2 on a cell of the row', () => {
    render(<Orders />);
    const cell = within(rowOf('DH-1')).getByText('An').closest('td')!;
    focusOn(cell);
    expect(press(cell, 'Enter')).toBe(true);
    expect(form()).not.toBeNull();
    press(field('Customer'), 'Escape');
    expect(form()).toBeNull();
    const again = within(rowOf('DH-3')).getByText('Chi').closest('td')!;
    focusOn(again);
    press(again, 'F2');
    expect(within(form()!).getByText('Edit DH-3')).toBeInTheDocument();
  });

  it('names the form by the row header, and says what is required', () => {
    render(<Orders />);
    click(edit('DH-2'));
    expect(within(form()!).getByText('Edit DH-2')).toBeInTheDocument();
    expect(within(form()!).getByText('Fields marked * are required.')).toBeInTheDocument();
  });

  it('says no hint when no field is required', () => {
    render(
      <Orders columns={COLUMNS.map((column) => ({ ...column, validationRules: undefined }))} />,
    );
    click(edit('DH-2'));
    expect(within(form()!).queryByText('Fields marked * are required.')).toBeNull();
  });

  it('names the row by the row header even when that column is hidden', () => {
    render(<Orders defaultColumnLayout={{ hidden: ['id'] }} />);
    click(screen.getByRole('button', { name: 'Edit DH-2' }));
    expect(within(form()!).getByText('Edit DH-2')).toBeInTheDocument();
  });

  it('has one form at a time: the one open is saved first', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    click(edit('DH-1'));
    type('Customer', 'Zed');
    click(edit('DH-3'));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sent(onSaving)).toMatchObject([
      { type: 'update', key: 'DH-1', data: { customer: 'Zed' } },
    ]);
    expect(table().querySelectorAll('form.flg-data-grid-form')).toHaveLength(1);
    expect(within(form()!).getByText('Edit DH-3')).toBeInTheDocument();
  });

  it('keeps a form that fails its rules, and opens no other', () => {
    render(<Orders />);
    click(edit('DH-1'));
    type('Customer', '');
    click(edit('DH-3'));
    expect(within(form()!).getByText('Edit DH-1')).toBeInTheDocument();
  });

  it('opens nothing for a row allowUpdating says no to', () => {
    render(<Orders editing={{ mode: 'form', allowUpdating: (row) => row.id !== 'DH-2' }} />);
    expect(screen.queryByRole('button', { name: 'Edit DH-2' })).toBeNull();
    const cell = within(rowOf('DH-2')).getByText('Bình').closest('td')!;
    focusOn(cell);
    press(cell, 'Enter');
    expect(form()).toBeNull();
  });

  it('is turned off with the mode: no form stays when editing changes to another mode', () => {
    const { rerender } = render(<Orders />);
    click(edit('DH-2'));
    rerender(<Orders editing={{ mode: 'row' }} />);
    expect(formRow()).toBeNull();
    expect(dataRows()).toHaveLength(3);
  });
});

describe('the fields', () => {
  it('are every data column in the order of the columns, but the one that says form.visible false', () => {
    render(<Orders />);
    click(edit('DH-2'));
    expect(fieldLabels()).toEqual([
      'Order',
      'Customer*',
      'Status',
      'Qty',
      'Order date',
      'Paid',
      'Total',
      'Note',
    ]);
  });

  it('include a column the layout hides and a column the grouping takes out', () => {
    render(
      <Orders
        defaultColumnLayout={{ hidden: ['qty'] }}
        grouping={[{ field: 'paid', direction: 'asc' }]}
      />,
    );
    click(edit('DH-1'));
    expect(fieldLabels()).toContain('Qty');
    expect(fieldLabels()).toContain('Paid');
  });

  it('follow a layout that moves a column', () => {
    render(<Orders defaultColumnLayout={{ order: ['customer', 'id', 'note'] }} />);
    click(edit('DH-2'));
    expect(fieldLabels().slice(0, 3)).toEqual(['Customer*', 'Order', 'Note']);
  });

  it('show a column no one can edit as a label and a text, written as the cell writes it', () => {
    render(<Orders />);
    click(edit('DH-2'));
    const statics = Array.from(
      form()!.querySelectorAll('.flg-data-grid-form-fields .flg-data-grid-form-static'),
      (item) => item.textContent,
    );
    expect(statics).toEqual(['DH-2', '100']);
    // The label of a text is a span, not a <label>: no control for it to name.
    const order = form()!.querySelector('.flg-data-grid-form-static')!.parentElement!;
    expect(order.querySelector('span.flg-field-label')).toHaveTextContent('Order');
    expect(order.querySelector('label')).toBeNull();
  });

  it('have an editor for every kind: text, lookup, number, date, boolean, and a Textarea for a multiline column', () => {
    render(<Orders />);
    click(edit('DH-2'));
    expect(field('Customer')).toHaveValue('Bình');
    expect(within(form()!).getByRole('combobox', { name: 'Status' })).toHaveTextContent(
      'Processing',
    );
    expect(field('Qty')).toHaveValue('5');
    expect(field('Order date')).toHaveValue('11/06/2026');
    expect(within(form()!).getByRole('checkbox', { name: 'Paid' })).toBeChecked();
    const note = within(form()!).getByLabelText('Note');
    expect(note.tagName).toBe('TEXTAREA');
    expect(note).toHaveValue('second');
  });

  it('span both columns for a multiline column and for form.span 2, as a data attribute the stylesheet reads', () => {
    render(
      <Orders
        columns={COLUMNS.map((column) =>
          'field' in column && column.field === 'qty' ? { ...column, form: { span: 2 } } : column,
        )}
      />,
    );
    click(edit('DH-2'));
    const spans = Array.from(
      form()!.querySelectorAll('.flg-data-grid-form-fields > [data-span="2"]'),
      (item) => item.querySelector('.flg-field-label')?.textContent,
    );
    expect(spans).toEqual(['Qty', 'Note']);
  });

  it('mark a required field with a star and required, and put its error in the Field', () => {
    render(<Orders />);
    click(edit('DH-2'));
    expect(field('Customer')).toBeRequired();
    type('Customer', '');
    click(saveButton());
    expect(within(form()!).getByText('Customer is required')).toHaveClass('flg-field-error');
    expect(field('Customer')).toHaveAttribute('aria-invalid', 'true');
  });

  it('check a field when it is left, and take the error away once it holds a good value', () => {
    render(<Orders />);
    click(edit('DH-2'));
    focusOn(field('Customer'));
    type('Customer', '');
    focusOn(field('Qty'));
    expect(within(form()!).getByText('Customer is required')).toBeInTheDocument();
    focusOn(field('Customer'));
    type('Customer', 'Zed');
    focusOn(field('Qty'));
    expect(within(form()!).queryByText('Customer is required')).toBeNull();
  });

  it('put the focus on the first editable field when the form opens', () => {
    render(<Orders />);
    click(edit('DH-2'));
    expect(field('Customer')).toHaveFocus();
  });

  it('keep the editor a column brings, and write what it sets', () => {
    const onSaving = vi.fn();
    render(
      <Orders
        onSaving={onSaving}
        columns={COLUMNS.map((column) =>
          'field' in column && column.field === 'customer'
            ? {
                ...column,
                editor: ({ value, setValue, label }) => (
                  <input
                    aria-label={label}
                    data-own=""
                    value={value ?? ''}
                    onChange={(event) => setValue(event.target.value)}
                  />
                ),
              }
            : column,
        )}
      />,
    );
    click(edit('DH-2'));
    expect(field('Customer')).toHaveAttribute('data-own');
    type('Customer', 'Zed');
    click(saveButton());
    expect(sent(onSaving)).toMatchObject([{ data: { customer: 'Zed' } }]);
  });
});

describe('saving and giving up', () => {
  it('sends one update of the changed fields with Save, closes the form and says Changes saved', async () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    click(edit('DH-2'));
    type('Customer', 'Zed');
    type('Qty', '9');
    // The number settles its text when the focus leaves it, as a press on Save makes it.
    act(() => void fireEvent.blur(field('Qty')));
    click(saveButton());
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sent(onSaving)).toEqual([
      { type: 'update', key: 'DH-2', data: { customer: 'Zed', qty: 9 }, row: ORDERS[1] },
    ]);
    expect(form()).toBeNull();
    expect(dataRows()).toHaveLength(3);
    await tick();
    expect(live()).toContain('Changes saved');
  });

  it('sends with a submit of the form, which is what Enter in a field does', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    click(edit('DH-2'));
    type('Customer', 'Zed');
    act(() => {
      fireEvent.submit(form()!);
    });
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(form()).toBeNull();
  });

  it('closes with no call when nothing changed', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    click(edit('DH-2'));
    click(saveButton());
    expect(onSaving).not.toHaveBeenCalled();
    expect(form()).toBeNull();
  });

  it('does not send a form that fails its rules: it stays, the first field has the focus, the count is said', async () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    click(edit('DH-2'));
    focusOn(field('Qty'));
    type('Customer', '');
    click(saveButton());
    expect(onSaving).not.toHaveBeenCalled();
    expect(form()).not.toBeNull();
    expect(field('Customer')).toHaveFocus();
    await tick();
    expect(live()).toContain('1 field needs attention');
  });

  it('saves the open form with saveChanges() as Save does, and resolves true when the row went through', async () => {
    const onSaving = vi.fn();
    const gridRef = createRef<DataGridHandle>();
    render(<Orders onSaving={onSaving} gridRef={gridRef} />);
    click(edit('DH-2'));
    type('Customer', 'Zed');
    let result!: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result).resolves.toBe(true);
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sent(onSaving)).toMatchObject([
      { type: 'update', key: 'DH-2', data: { customer: 'Zed' } },
    ]);
    expect(form()).toBeNull();
  });

  it('resolves false from saveChanges() and keeps the form with its error when a rule fails', async () => {
    const onSaving = vi.fn();
    const gridRef = createRef<DataGridHandle>();
    render(<Orders onSaving={onSaving} gridRef={gridRef} />);
    click(edit('DH-2'));
    focusOn(field('Qty'));
    type('Customer', '');
    let result!: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result).resolves.toBe(false);
    expect(onSaving).not.toHaveBeenCalled();
    expect(form()).not.toBeNull();
    expect(field('Customer')).toHaveFocus();
  });

  it('resolves true from saveChanges() with no form open or no change, false when the app refuses', async () => {
    const gridRef = createRef<DataGridHandle>();
    const onSaving = vi.fn(() => Promise.reject(new Error('no')));
    render(<Orders onSaving={onSaving} gridRef={gridRef} />);
    await expect(gridRef.current!.saveChanges()).resolves.toBe(true);
    click(edit('DH-2'));
    let result!: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result).resolves.toBe(true);
    expect(onSaving).not.toHaveBeenCalled();
    expect(form()).toBeNull();
    click(edit('DH-2'));
    type('Customer', 'Zed');
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result).resolves.toBe(false);
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(form()).not.toBeNull();
  });

  it('gives up with Cancel and with Esc, and sends nothing', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    click(edit('DH-2'));
    type('Customer', 'Zed');
    click(cancelButton());
    expect(form()).toBeNull();
    expect(within(rowOf('DH-2')).getByText('Bình')).toBeInTheDocument();
    click(edit('DH-2'));
    type('Customer', 'Zed');
    press(field('Customer'), 'Escape');
    expect(form()).toBeNull();
    expect(onSaving).not.toHaveBeenCalled();
  });

  it('lets the open list of a field take the first Esc', () => {
    render(<Orders />);
    click(edit('DH-2'));
    const status = within(form()!).getByRole('combobox', { name: 'Status' });
    focusOn(status);
    act(() => {
      status.setAttribute('aria-expanded', 'true');
    });
    press(status, 'Escape');
    expect(form()).not.toBeNull();
    act(() => {
      status.setAttribute('aria-expanded', 'false');
    });
    press(status, 'Escape');
    expect(form()).toBeNull();
  });

  it('keeps the form while the answer is awaited: Save loads and keeps its focus, the fields cannot change', async () => {
    const pending = deferred();
    const onSaving = vi.fn(() => pending.promise);
    render(<Orders onSaving={onSaving} />);
    click(edit('DH-2'));
    type('Customer', 'Zed');
    focusOn(saveButton());
    click(saveButton());
    expect(saveButton()).toHaveAttribute('aria-busy', 'true');
    expect(saveButton()).toHaveFocus();
    expect(field('Customer')).toHaveAttribute('readonly');
    click(saveButton());
    expect(onSaving).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve());
    expect(form()).toBeNull();
  });

  it('keeps the form and shows the alert when the save is refused, and sends again from it', async () => {
    const onSaving = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error('Server is busy')))
      .mockImplementation(() => {});
    render(<Orders onSaving={onSaving} />);
    click(edit('DH-2'));
    type('Customer', 'Zed');
    click(saveButton());
    await tick();
    expect(form()).not.toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('Server is busy');
    expect(field('Customer')).toHaveValue('Zed');
    click(saveButton());
    await tick();
    expect(onSaving).toHaveBeenCalledTimes(2);
    expect(form()).toBeNull();
  });

  it('puts the words a server gives for a field in that field', async () => {
    const reason = {
      message: 'Not saved.',
      fieldErrors: [{ key: 'DH-2', field: 'customer', message: 'Customer is taken' }],
    };
    render(<Orders onSaving={() => Promise.reject(reason)} />);
    click(edit('DH-2'));
    type('Customer', 'Zed');
    click(saveButton());
    await tick();
    expect(within(form()!).getByText('Customer is taken')).toHaveClass('flg-field-error');
    expect(screen.getByRole('alert')).not.toHaveTextContent('Customer is taken');
  });

  it('checks the fields of a column the grid hides too', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} defaultColumnLayout={{ hidden: ['customer'] }} />);
    click(edit('DH-2'));
    type('Customer', '');
    click(saveButton());
    expect(onSaving).not.toHaveBeenCalled();
    expect(within(form()!).getByText('Customer is required')).toBeInTheDocument();
  });

  it('gives the focus to the grid, never to the page, when the form goes', async () => {
    render(<Orders />);
    click(edit('DH-2'));
    click(saveButton());
    await tick();
    expect(document.activeElement).not.toBe(document.body);
    expect(table().contains(document.activeElement)).toBe(true);
    click(edit('DH-2'));
    press(field('Customer'), 'Escape');
    await tick();
    expect(table().contains(document.activeElement)).toBe(true);
  });
});

describe('the keys', () => {
  it('leave a key typed in a field to the field: no key of the grid runs inside the form', () => {
    render(<Orders />);
    click(edit('DH-2'));
    const input = field('Customer');
    expect(press(input, 'ArrowDown')).toBe(false);
    expect(press(input, ' ')).toBe(false);
    expect(press(input, 'a')).toBe(false);
    expect(form()).not.toBeNull();
  });

  it('make the form row a place: the arrows land on its cell and Enter goes into the form', () => {
    render(<Orders />);
    click(edit('DH-2'));
    const cell = formRow()!.cells[0]!;
    const above = within(rowOf('DH-1')).getByText('An').closest('td')!;
    focusOn(above);
    press(above, 'ArrowDown');
    expect(cell).toHaveFocus();
    expect(cell.getAttribute('tabindex')).toBe('0');
    press(cell, 'ArrowRight');
    expect(cell).toHaveFocus();
    press(cell, 'Enter');
    expect(form()!.contains(document.activeElement)).toBe(true);
    press(field('Customer'), 'Escape');
    expect(form()).toBeNull();
  });

  it('makes the form cell a tab stop only while it is the place', () => {
    render(<Orders />);
    click(edit('DH-2'));
    const cell = formRow()!.cells[0]!;
    const places = table().querySelectorAll('[tabindex="0"]');
    expect(places).toHaveLength(1);
    expect([cell.getAttribute('tabindex')]).toEqual([places[0] === cell ? '0' : '-1']);
  });

  it('cancels with Esc on the form cell too', () => {
    render(<Orders />);
    click(edit('DH-2'));
    const cell = formRow()!.cells[0]!;
    focusOn(cell);
    press(cell, 'Escape');
    expect(form()).toBeNull();
  });
});

describe('new rows and details', () => {
  it('opens the form of a new row first, titled New row, and sends an insert with Save', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} editing={{ mode: 'form', allowAdding: true }} />);
    click(screen.getByRole('button', { name: 'Add row' }));
    expect(Array.from(table().tBodies[0]!.rows)[0]).toBe(formRow());
    expect(within(form()!).getByText('New row')).toBeInTheDocument();
    type('Customer', 'Hoa');
    click(saveButton());
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sent(onSaving)).toMatchObject([
      { type: 'insert', key: 'flg-new-1', data: { customer: 'Hoa' } },
    ]);
    expect(form()).toBeNull();
  });

  it('checks every field of a new row, and drops it with Cancel', () => {
    const gridRef = createRef<DataGridHandle>();
    const onSaving = vi.fn();
    render(
      <Orders
        gridRef={gridRef}
        onSaving={onSaving}
        editing={{ mode: 'form', allowAdding: true }}
      />,
    );
    act(() => gridRef.current!.addRow());
    click(saveButton());
    expect(onSaving).not.toHaveBeenCalled();
    expect(within(form()!).getByText('Customer is required')).toBeInTheDocument();
    click(cancelButton());
    expect(form()).toBeNull();
    expect(dataRows()).toHaveLength(3);
  });

  it('puts the form of a new row after the rows with newRowPosition last', () => {
    render(<Orders editing={{ mode: 'form', allowAdding: true, newRowPosition: 'last' }} />);
    click(screen.getByRole('button', { name: 'Add row' }));
    expect(Array.from(table().tBodies[0]!.rows).at(-1)).toBe(formRow());
  });

  it('keeps the open detail of a row as state while its form is open, and gives it back after', () => {
    render(<Orders renderDetail={(row) => <span>{`Lines of ${row.id}`}</span>} />);
    click(screen.getByRole('button', { name: 'Show details of DH-2' }));
    expect(screen.getByText('Lines of DH-2')).toBeInTheDocument();
    click(edit('DH-2'));
    expect(screen.queryByText('Lines of DH-2')).toBeNull();
    press(field('Customer'), 'Escape');
    expect(screen.getByText('Lines of DH-2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide details of DH-2' })).toBeInTheDocument();
  });
});

describe('the buttons of the rows', () => {
  it('show Edit and Delete always in this mode, and Edit opens the form', () => {
    render(<Orders editing={{ mode: 'form', allowDeleting: true }} />);
    const buttons = rowOf('DH-1').querySelector('.flg-data-grid-action-buttons')!;
    expect(buttons).toHaveAttribute('data-always');
    expect(edit('DH-1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete DH-1' })).toBeInTheDocument();
  });

  it('draw no column of buttons when no row can be updated or deleted', () => {
    render(<Orders editing={{ mode: 'form', allowUpdating: false }} />);
    expect(table().querySelector('.flg-data-grid-actions')).toBeNull();
  });
});

describe('what typing draws', () => {
  it('is the field that is typed in: neither the form, nor its other fields, nor the rows are made again', () => {
    const title = vi.fn((name: string) => `Edit ${name}`);
    const total = vi.fn((row: Order) => row.price * (row.qty ?? 0));
    render(
      <Orders
        labels={{ editRowTitle: title }}
        columns={[
          ...COLUMNS.filter((column) => !('id' in column)),
          { id: 'total', caption: 'Total', dataType: 'number', width: 100, value: total },
        ]}
      />,
    );
    click(edit('DH-2'));
    const titles = title.mock.calls.length;
    const totals = total.mock.calls.length;
    expect(titles).toBeGreaterThan(0);
    type('Customer', 'Z');
    type('Customer', 'Ze');
    type('Customer', 'Zed');
    expect(field('Customer')).toHaveValue('Zed');
    // The title is made by the form, the static Total by its fields: neither is drawn by a key.
    expect(title.mock.calls.length).toBe(titles);
    expect(total.mock.calls.length).toBe(totals);
  });
});
