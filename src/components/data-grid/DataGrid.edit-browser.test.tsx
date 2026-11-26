import { act, createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import type { Ref } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type {
  DataGridChange,
  DataGridColumn,
  DataGridEditing,
  DataGridHandle,
  DataGridProps,
} from './index';

// What a real browser does around the edit (fix wave of Plan F, Part C): a window that loses the focus settles
// nothing, a held key starts and saves nothing, the first `Esc` of a field's popup closes only that popup, the words of
// an error come back, and the accessible names of the form. What needs a layout engine or the browser's own order of
// events is in `DataGridEditing.stories.tsx`.

let showing: Set<Element>;
let hasFocus = true;
const original = {
  showModal: HTMLDialogElement.prototype.showModal,
  close: HTMLDialogElement.prototype.close,
};
// jsdom has no showModal(): a stand-in that toggles `open` and fires `close`, as a browser does.
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
beforeEach(() => {
  resetDevWarnings();
  showing = new Set();
  // jsdom's document has no focus once an input is blurred; a test says whether the window has it.
  hasFocus = true;
  vi.spyOn(document, 'hasFocus').mockImplementation(() => hasFocus);
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
  placed: string;
}

const ORDERS: Order[] = [
  { id: 'DH-1', customer: 'An', qty: 3, placed: '2026-11-05' },
  { id: 'DH-2', customer: 'Bình', qty: 5, placed: '2026-11-06' },
  { id: 'DH-3', customer: 'Chi', qty: 1, placed: '2026-11-07' },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, allowEditing: false, width: 100 },
  {
    field: 'customer',
    caption: 'Customer',
    width: 140,
    validationRules: [{ type: 'required' }],
  },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 100 },
  { field: 'placed', caption: 'Order date', dataType: 'date', width: 150 },
];

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
const sentAt = (spy: ReturnType<typeof vi.fn>, call = 0): DataGridChange<Order>[] =>
  spy.mock.calls[call]![0] as DataGridChange<Order>[];
const focusOn = (element: HTMLElement) => act(() => element.focus());
const clickOn = (element: HTMLElement) => act(() => void fireEvent.click(element));
const edit = (name: string) => screen.getByRole('button', { name: `Edit ${name}` });
const editors = () => Array.from(table().querySelectorAll<HTMLElement>('td[data-editor]'));
const input = (label: string) => within(table()).getByLabelText(label) as HTMLInputElement;
const type = (label: string, text: string) =>
  act(() => void fireEvent.change(input(label), { target: { value: text } }));

const CELL: DataGridEditing<Order> = { mode: 'cell', allowAdding: true };
const FORM: DataGridEditing<Order> = { mode: 'form' };
const formRow = () =>
  table().querySelector<HTMLTableRowElement>('tbody > tr.flg-data-grid-form-row');
const field = (label: string) =>
  within(formRow()!.querySelector('form')!).getByLabelText(label) as HTMLInputElement;

describe('a blur while the window has no focus settles nothing (C1)', () => {
  it('keeps the editor of a cell open, and commits nothing, while the window is away', () => {
    const onSaving = vi.fn();
    render(<Orders editing={CELL} onSaving={onSaving} />);
    focusOn(cell('DH-1', 'Customer'));
    press(cell('DH-1', 'Customer'), 'Enter');
    type('Customer', 'Zed');
    hasFocus = false;
    act(() => void fireEvent.blur(input('Customer')));
    expect(editors()).toHaveLength(1);
    expect(onSaving).not.toHaveBeenCalled();
    // The window comes back and the browser gives the focus back to the editor; leaving it now commits.
    hasFocus = true;
    act(() => void fireEvent.blur(input('Customer')));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sentAt(onSaving)[0]).toMatchObject({ type: 'update', data: { customer: 'Zed' } });
  });

  it('does not check a field of the form while the window is away', () => {
    render(<Orders editing={FORM} />);
    clickOn(edit('DH-1'));
    type('Customer', '');
    hasFocus = false;
    act(() => void fireEvent.blur(field('Customer')));
    expect(within(formRow()!).queryByText('Customer is required')).toBeNull();
    hasFocus = true;
    act(() => void fireEvent.blur(field('Customer')));
    expect(within(formRow()!).getByText('Customer is required')).toBeInTheDocument();
  });

  it('does not check a field of the row being edited while the window is away', () => {
    render(<Orders editing={{ mode: 'row' }} />);
    clickOn(edit('DH-1'));
    type('Customer', '');
    hasFocus = false;
    act(() => void fireEvent.blur(input('Customer')));
    expect(cell('DH-1', 'Customer')).not.toHaveAttribute('data-invalid');
    hasFocus = true;
    act(() => void fireEvent.blur(input('Customer')));
    expect(cell('DH-1', 'Customer')).toHaveAttribute('data-invalid');
  });

  it('does not send a new row of cell mode while the window is away', () => {
    const onSaving = vi.fn();
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} editing={CELL} onSaving={onSaving} />);
    act(() => ref.current!.addRow());
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    const first = document.activeElement as HTMLElement;
    hasFocus = false;
    act(() => void fireEvent.blur(first));
    expect(onSaving).not.toHaveBeenCalled();
    hasFocus = true;
    act(() => void fireEvent.blur(first));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sentAt(onSaving)[0]).toMatchObject({ type: 'insert', data: { customer: 'Hoa' } });
  });
});

describe('a repeated key starts and saves nothing (C2)', () => {
  it.each(['Enter', 'F2'])(
    'does not start an edit by a held %s, in row, cell and batch mode',
    (key) => {
      for (const mode of ['row', 'cell', 'batch'] as const) {
        const { unmount } = render(<Orders editing={{ mode }} />);
        focusOn(cell('DH-1', 'Customer'));
        press(cell('DH-1', 'Customer'), key, { repeat: true });
        expect(editors()).toHaveLength(0);
        expect(table().querySelectorAll('[data-editing]')).toHaveLength(0);
        press(cell('DH-1', 'Customer'), key);
        expect(table().querySelectorAll('[data-editing]').length).toBeGreaterThan(0);
        unmount();
      }
    },
  );

  it.each(['row', 'cell', 'batch'] as const)(
    'does not save from a held Enter in %s mode',
    (mode) => {
      const onSaving = vi.fn();
      render(<Orders editing={{ mode }} onSaving={onSaving} />);
      focusOn(cell('DH-1', 'Customer'));
      press(cell('DH-1', 'Customer'), 'Enter');
      type('Customer', 'Zed');
      const before = table().querySelectorAll('td[data-editor]').length;
      press(input('Customer'), 'Enter', { repeat: true });
      expect(table().querySelectorAll('td[data-editor]')).toHaveLength(before);
      expect(input('Customer').value).toBe('Zed');
      expect(onSaving).not.toHaveBeenCalled();
      press(input('Customer'), 'Enter');
      expect(table().querySelectorAll('td[data-editor]').length).toBeLessThan(before);
    },
  );

  it('ignores a repeated Enter of a field of the form: no implicit submit', () => {
    render(<Orders editing={FORM} />);
    clickOn(edit('DH-1'));
    expect(press(field('Customer'), 'Enter', { repeat: true })).toBe(true);
    expect(press(field('Customer'), 'Enter')).toBe(false);
  });

  it('ignores a repeated Enter of a field of the popup: no implicit submit', () => {
    render(<Orders editing={{ mode: 'popup' }} />);
    clickOn(edit('DH-1'));
    const customer = screen.getByRole('dialog').querySelector<HTMLInputElement>('input')!;
    expect(press(customer, 'Enter', { repeat: true })).toBe(true);
    expect(press(customer, 'Enter')).toBe(false);
  });
});

describe('the first Esc in the popup of a field closes only that popup (C3)', () => {
  it('keeps the form open when Esc is pressed inside the calendar of its date field, then gives it up', () => {
    render(<Orders editing={FORM} />);
    clickOn(edit('DH-1'));
    const fieldBox = formRow()!.querySelector<HTMLElement>('[data-column="placed"]')!;
    clickOn(within(fieldBox).getByRole('button', { name: /choose date/i }));
    const calendar = fieldBox.querySelector<HTMLElement>('[popover]')!;
    expect(showing.has(calendar)).toBe(true);
    const inside = calendar.querySelector<HTMLElement>('button')!;
    // The calendar's own Esc closes it; the form must not take the same key.
    press(inside, 'Escape');
    expect(formRow()).not.toBeNull();
    // A second Esc, from a field, gives the form up.
    press(field('Customer'), 'Escape');
    expect(formRow()).toBeNull();
  });

  it('keeps the form open for an Esc inside a popover of a custom editor', () => {
    const columns: DataGridColumn<Order>[] = [
      ...COLUMNS.slice(0, 2),
      {
        field: 'qty',
        caption: 'Qty',
        editor: () => (
          <div>
            <input aria-label="Qty" />
            <div popover="manual">
              <button type="button">Inside</button>
            </div>
          </div>
        ),
      },
    ];
    render(<Orders editing={FORM} columns={columns} />);
    clickOn(edit('DH-1'));
    press(screen.getByRole('button', { name: 'Inside', hidden: true }), 'Escape');
    expect(formRow()).not.toBeNull();
    press(field('Qty'), 'Escape');
    expect(formRow()).toBeNull();
  });
});

describe('the words of an error open again (C4, C5)', () => {
  const tip = (container: HTMLElement, text: string) =>
    within(container)
      .getAllByRole('tooltip', { hidden: true })
      .find((one) => one.textContent === text)!;

  it('opens the error tooltip again when a save finds the focused field wrong after an Esc closed it', () => {
    render(<Orders editing={{ mode: 'row' }} />);
    clickOn(edit('DH-1'));
    type('Customer', '');
    focusOn(input('Customer'));
    press(input('Customer'), 'Enter');
    const row = () => table().querySelector<HTMLElement>('tr[data-editing]')!;
    expect(showing.has(tip(row(), 'Customer is required'))).toBe(true);
    press(input('Customer'), 'Escape');
    expect(showing.has(tip(row(), 'Customer is required'))).toBe(false);
    expect(row()).not.toBeNull();
    // The field keeps the focus, so no focus event opens the tooltip: the save that asks for the focus does.
    press(input('Customer'), 'Enter');
    expect(document.activeElement).toBe(input('Customer'));
    expect(showing.has(tip(row(), 'Customer is required'))).toBe(true);
  });

  it('opens the words of a refused batch cell while the cell has the focus, and closes them after', async () => {
    const ref = createRef<DataGridHandle>();
    const refuse = () =>
      Promise.reject({
        message: 'Not saved.',
        fieldErrors: [{ key: 'DH-1', field: 'customer', message: 'Customer is taken' }],
      });
    render(<Orders gridRef={ref} editing={{ mode: 'batch' }} onSaving={refuse} />);
    focusOn(cell('DH-1', 'Customer'));
    press(cell('DH-1', 'Customer'), 'Enter');
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    act(() => void ref.current!.saveChanges());
    await act(async () => void (await new Promise((done) => setTimeout(done, 0))));
    const refused = () => cell('DH-1', 'Customer');
    expect(refused()).toHaveAttribute('data-invalid');
    // The commit left the focus on the cell, so its words are open as the refusal comes.
    expect(showing.has(tip(refused(), 'Customer is taken'))).toBe(true);
    // The first Esc of a tooltip closes it, as it does for an editor's.
    press(refused(), 'Escape');
    expect(showing.has(tip(refused(), 'Customer is taken'))).toBe(false);
    focusOn(cell('DH-2', 'Customer'));
    expect(showing.has(tip(refused(), 'Customer is taken'))).toBe(false);
    focusOn(refused());
    expect(showing.has(tip(refused(), 'Customer is taken'))).toBe(true);
  });
});
