import { act, createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import type { Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type {
  DataGridChange,
  DataGridColumn,
  DataGridEditing,
  DataGridHandle,
  DataGridProps,
} from './index';

// Batch mode (spec phase 6 §6.3 "Chế độ batch", §4.3 E2 (c)): a commit is a change that is marked and sent to nothing,
// a row is marked for deletion and Undo gives it back, the save bar counts the rows that have a change, and one
// `onSaving` sends them all. What needs a layout engine (the look, the focus in a real browser) is in the stories.

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
  price: number;
  paid: boolean;
}

const STATUSES = [
  { id: 1, name: 'New' },
  { id: 2, name: 'Processing' },
];

const ORDERS: Order[] = [
  { id: 'DH-1', customer: 'An', status: 1, qty: 3, price: 10, paid: false },
  { id: 'DH-2', customer: 'Bình', status: 2, qty: 5, price: 20, paid: false },
  { id: 'DH-3', customer: 'Chi', status: 1, qty: 1, price: 30, paid: true },
  { id: 'DH-4', customer: 'Dung', status: 2, qty: 7, price: 40, paid: false },
];

const REQUIRED_RULE = [{ type: 'required' as const }];
const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, allowEditing: false, width: 100 },
  { field: 'customer', caption: 'Customer', width: 140, validationRules: REQUIRED_RULE },
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
const BATCH: DataGridEditing<Order> = { mode: 'batch', allowDeleting: true, allowAdding: true };

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
      editing={BATCH}
      onSaving={() => {}}
      {...props}
    />
  );
}

const table = () => document.querySelector<HTMLTableElement>('table[role]')!;
const dataRows = () =>
  Array.from(table().querySelectorAll<HTMLTableRowElement>('tbody > tr.flg-data-grid-row'));
const rowOf = (id: string) => dataRows().find((row) => row.children[0]!.textContent?.includes(id))!;
const newRows = () => dataRows().filter((row) => row.hasAttribute('data-new'));
const bar = () => document.querySelector<HTMLElement>('.flg-data-grid-savebar');
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
const click = (element: HTMLElement) => act(() => element.click());
const focusOn = (element: HTMLElement) => act(() => element.focus());
const input = (label: string) => within(table()).getByLabelText(label) as HTMLInputElement;
const type = (label: string, text: string) =>
  act(() => void fireEvent.change(input(label), { target: { value: text } }));
const cellOf = (row: HTMLElement, caption: string): HTMLElement => {
  const heads = Array.from(table().querySelectorAll('thead th')).map((head) => head.textContent);
  return Array.from(row.querySelectorAll<HTMLElement>(':scope > td, :scope > th')).filter(
    (cell) => !cell.classList.contains('flg-data-grid-filler'),
  )[heads.filter((head) => head !== '').indexOf(caption)]!;
};
const live = () =>
  Array.from(
    document.querySelectorAll('[aria-live="polite"]'),
    (region) => region.textContent,
  ).join(' ');
const sentAt = (spy: ReturnType<typeof vi.fn>, call = 0): DataGridChange<Order>[] =>
  spy.mock.calls[call]![0] as DataGridChange<Order>[];
const tick = () => act(async () => void (await new Promise((done) => setTimeout(done, 0))));
function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
/** Starts the edit of a cell, types a value and commits it with Enter. */
const change = (order: string, caption: string, value: string) => {
  click(cellOf(rowOf(order), caption));
  type(caption, value);
  press(input(caption), 'Enter');
};
const deleteButton = (order: string) =>
  screen.getByRole('button', { name: `Delete ${order}` }) as HTMLElement;
const undoButton = (order: string) =>
  screen.queryByRole('button', { name: `Undo deleting ${order}` });
const addRow = () => click(screen.getByRole('button', { name: 'Add row' }));

describe('the marks of a change', () => {
  it('marks the cell that changed, says it in hidden words after the value, and sends nothing', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    change('DH-1', 'Customer', 'Hoa');
    const cell = cellOf(rowOf('DH-1'), 'Customer');
    expect(cell).toHaveAttribute('data-changed');
    expect(cell).toHaveTextContent('Hoa');
    expect(within(cell).getByText('changed')).toHaveClass('flg-visually-hidden');
    expect(cell.textContent).toBe('Hoachanged');
    expect(onSaving).not.toHaveBeenCalled();
  });

  it('marks no other cell of the row, and not the column that is computed from the one that changed', () => {
    render(<Orders />);
    change('DH-1', 'Qty', '4');
    const row = rowOf('DH-1');
    const marked = Array.from(row.querySelectorAll('[data-changed]'));
    expect(marked).toEqual([cellOf(row, 'Qty')]);
    expect(cellOf(row, 'Total')).toHaveTextContent('40');
    expect(rowOf('DH-2').querySelector('[data-changed]')).toBeNull();
  });

  it('marks the cells of a change that a Space on a boolean makes, and calls nothing', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    focusOn(cellOf(rowOf('DH-1'), 'Paid'));
    press(cellOf(rowOf('DH-1'), 'Paid'), ' ');
    expect(cellOf(rowOf('DH-1'), 'Paid')).toHaveAttribute('data-changed');
    expect(onSaving).not.toHaveBeenCalled();
    expect(bar()).toHaveTextContent('1 unsaved change');
  });

  it('marks the cell of a press on a boolean as well: one press, one change, no editor, no row chosen', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    click(cellOf(rowOf('DH-3'), 'Paid'));
    expect(cellOf(rowOf('DH-3'), 'Paid')).toHaveAttribute('data-changed');
    expect(table().querySelector('[data-editor]')).toBeNull();
    expect(onSaving).not.toHaveBeenCalled();
  });

  it('leaves no mark and no count for a value put back to the saved one', () => {
    render(<Orders />);
    change('DH-1', 'Customer', 'Hoa');
    expect(bar()).not.toBeNull();
    change('DH-1', 'Customer', 'An');
    expect(cellOf(rowOf('DH-1'), 'Customer')).not.toHaveAttribute('data-changed');
    expect(bar()).toBeNull();
  });

  it('keeps the other field of the row marked when only one of two is put back', () => {
    render(<Orders />);
    change('DH-1', 'Customer', 'Hoa');
    change('DH-1', 'Qty', '9');
    change('DH-1', 'Customer', 'An');
    expect(cellOf(rowOf('DH-1'), 'Customer')).not.toHaveAttribute('data-changed');
    expect(cellOf(rowOf('DH-1'), 'Qty')).toHaveAttribute('data-changed');
    expect(bar()).toHaveTextContent('1 unsaved change');
  });

  it('is no change when the value typed is the one the cell has', () => {
    render(<Orders />);
    change('DH-1', 'Customer', 'An');
    expect(bar()).toBeNull();
  });

  it('refuses a value that fails the rules of its column, with no change, as cell mode does', () => {
    render(<Orders />);
    click(cellOf(rowOf('DH-1'), 'Customer'));
    type('Customer', '');
    press(input('Customer'), 'Enter');
    expect(bar()).toBeNull();
    expect(cellOf(rowOf('DH-1'), 'Customer')).toHaveAttribute('data-invalid');
  });

  it('lets Esc give up the cell being edited and nothing else', () => {
    render(<Orders />);
    change('DH-1', 'Customer', 'Hoa');
    click(cellOf(rowOf('DH-2'), 'Customer'));
    type('Customer', 'Zed');
    press(input('Customer'), 'Escape');
    expect(table().querySelector('[data-editor]')).toBeNull();
    expect(cellOf(rowOf('DH-2'), 'Customer')).toHaveTextContent('Bình');
    expect(cellOf(rowOf('DH-2'), 'Customer')).not.toHaveAttribute('data-changed');
    expect(cellOf(rowOf('DH-1'), 'Customer')).toHaveAttribute('data-changed');
    expect(bar()).toHaveTextContent('1 unsaved change');
  });

  it('commits a cell and opens the next when Tab is pressed, with no call', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    click(cellOf(rowOf('DH-1'), 'Customer'));
    type('Customer', 'Hoa');
    press(input('Customer'), 'Tab');
    expect(cellOf(rowOf('DH-1'), 'Customer')).toHaveAttribute('data-changed');
    expect(table().querySelectorAll('td[data-editor]')).toHaveLength(1);
    expect(onSaving).not.toHaveBeenCalled();
  });

  it('shows the change over the saved row to the editor that opens again', () => {
    render(<Orders />);
    change('DH-1', 'Customer', 'Hoa');
    click(cellOf(rowOf('DH-1'), 'Customer'));
    expect(input('Customer').value).toBe('Hoa');
  });

  it('is only this mode: another mode has no mark, no bar and no Undo', () => {
    render(<Orders editing={{ mode: 'cell', allowDeleting: true }} />);
    change('DH-1', 'Customer', 'Hoa');
    expect(table().querySelector('[data-changed]')).toBeNull();
    expect(bar()).toBeNull();
  });
});

describe('a row marked for deletion', () => {
  it('is marked with no question, struck by its own attribute, and has Undo in the place of Delete', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    click(deleteButton('DH-2'));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(rowOf('DH-2')).toHaveAttribute('data-deleted');
    expect(screen.queryByRole('button', { name: 'Delete DH-2' })).toBeNull();
    expect(undoButton('DH-2')).not.toBeNull();
    expect(rowOf('DH-1')).not.toHaveAttribute('data-deleted');
    expect(onSaving).not.toHaveBeenCalled();
  });

  it('says it in hidden words in its first cell, and announces it', async () => {
    render(<Orders />);
    click(deleteButton('DH-2'));
    await tick();
    const first = rowOf('DH-2').children[0] as HTMLElement;
    expect(within(first).getByText('marked for deletion')).toHaveClass('flg-visually-hidden');
    expect(live()).toContain('Row marked for deletion');
  });

  it('says it in the first data cell when the row header is hidden', () => {
    render(
      <Orders
        columns={COLUMNS.map((column) =>
          'field' in column && column.field === 'id' ? { ...column, visible: false } : column,
        )}
      />,
    );
    click(deleteButton('DH-2'));
    const row = dataRows().find((one) => one.hasAttribute('data-deleted'))!;
    expect(row.children[0]).toHaveTextContent('marked for deletion');
    expect(within(row as HTMLElement).getAllByText('marked for deletion')).toHaveLength(1);
  });

  it('keeps Undo drawn at all times, and the cell of the buttons is not the one that is struck', () => {
    render(<Orders />);
    click(deleteButton('DH-2'));
    const span = undoButton('DH-2')!.closest('.flg-data-grid-action-buttons')!;
    expect(span).toHaveAttribute('data-marked');
    expect(span.closest('td')).toHaveAttribute('data-actions');
  });

  it('counts as one row with the changed cells it had, never twice', () => {
    render(<Orders />);
    change('DH-2', 'Customer', 'Hoa');
    expect(bar()).toHaveTextContent('1 unsaved change');
    click(deleteButton('DH-2'));
    expect(bar()).toHaveTextContent('1 unsaved change');
    expect(rowOf('DH-2').querySelector('[data-changed]')).toBeNull();
  });

  it('is given back by Undo with the edits it had', () => {
    render(<Orders />);
    change('DH-2', 'Customer', 'Hoa');
    click(deleteButton('DH-2'));
    click(undoButton('DH-2')!);
    expect(rowOf('DH-2')).not.toHaveAttribute('data-deleted');
    expect(cellOf(rowOf('DH-2'), 'Customer')).toHaveTextContent('Hoa');
    expect(cellOf(rowOf('DH-2'), 'Customer')).toHaveAttribute('data-changed');
    expect(bar()).toHaveTextContent('1 unsaved change');
    expect(screen.getByRole('button', { name: 'Delete DH-2' })).toBeInTheDocument();
  });

  it('leaves no change when Undo is for a row that had none', () => {
    render(<Orders />);
    click(deleteButton('DH-2'));
    click(undoButton('DH-2')!);
    expect(bar()).toBeNull();
  });

  it('keeps the focus in the grid when Delete and Undo replace each other under it', () => {
    render(<Orders />);
    focusOn(cellOf(rowOf('DH-2'), 'Customer'));
    click(deleteButton('DH-2'));
    expect(table().contains(document.activeElement)).toBe(true);
    click(undoButton('DH-2')!);
    expect(table().contains(document.activeElement)).toBe(true);
  });

  it('cannot be edited: a press on its cells starts nothing', () => {
    render(<Orders />);
    click(deleteButton('DH-2'));
    click(cellOf(rowOf('DH-2'), 'Customer'));
    expect(table().querySelector('[data-editor]')).toBeNull();
    focusOn(cellOf(rowOf('DH-2'), 'Paid'));
    press(cellOf(rowOf('DH-2'), 'Paid'), ' ');
    expect(bar()).toHaveTextContent('1 unsaved change');
  });

  it('gives a new row up when it is deleted: nothing is marked, nothing is counted', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    addRow();
    expect(newRows()).toHaveLength(1);
    click(screen.getByRole('button', { name: 'Delete (new)' }));
    expect(newRows()).toHaveLength(0);
    expect(bar()).toBeNull();
    expect(onSaving).not.toHaveBeenCalled();
  });

  it('is drawn by a grid that cannot delete with no button and no mark', () => {
    render(<Orders editing={{ mode: 'batch' }} />);
    expect(screen.queryByRole('button', { name: 'Delete DH-1' })).toBeNull();
    expect(table().querySelector('.flg-data-grid-actions')).toBeNull();
  });

  it('is left out of the totals, which read what the cells show', () => {
    render(
      <Orders
        columns={COLUMNS.map((column) =>
          'id' in column && column.id === 'total'
            ? { ...column, summary: undefined }
            : 'field' in column && column.field === 'qty'
              ? { ...column }
              : column,
        )}
        summary={{ total: [{ column: 'qty', type: 'sum' }] }}
      />,
    );
    const total = () => table().querySelector('tfoot')!.textContent;
    expect(total()).toContain('16');
    click(deleteButton('DH-2'));
    expect(total()).toContain('11');
    change('DH-1', 'Qty', '10');
    expect(total()).toContain('18');
    click(undoButton('DH-2')!);
    expect(total()).toContain('23');
  });
});

describe('the save bar', () => {
  it('is the first child of the main part while a row has a change, and says how many rows', () => {
    render(<Orders />);
    expect(bar()).toBeNull();
    change('DH-1', 'Customer', 'Hoa');
    const main = document.querySelector('.flg-data-grid-main')!;
    expect(main.firstElementChild).toBe(bar());
    expect(bar()).toHaveTextContent('1 unsaved change');
    change('DH-1', 'Qty', '8');
    expect(bar()).toHaveTextContent('1 unsaved change');
    change('DH-3', 'Customer', 'Zed');
    click(deleteButton('DH-2'));
    expect(bar()).toHaveTextContent('3 unsaved changes');
  });

  it('counts a new row, and counts a row of two changed cells once', () => {
    render(<Orders />);
    addRow();
    expect(bar()).toHaveTextContent('1 unsaved change');
    change('DH-1', 'Customer', 'Hoa');
    change('DH-1', 'Qty', '9');
    expect(bar()).toHaveTextContent('2 unsaved changes');
  });

  it('has the pencil, the words, Discard changes (ghost, sm) and Save changes (primary, sm), in that order', () => {
    render(<Orders />);
    change('DH-1', 'Customer', 'Hoa');
    const buttons = Array.from(bar()!.querySelectorAll('button'));
    expect(buttons.map((button) => button.textContent)).toEqual([
      'Discard changes',
      'Save changes',
    ]);
    expect(buttons.map((button) => button.getAttribute('data-variant'))).toEqual([
      'ghost',
      'primary',
    ]);
    expect(buttons.map((button) => button.getAttribute('data-size'))).toEqual(['sm', 'sm']);
    expect(bar()!.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(bar()).toHaveAccessibleName('1 unsaved change');
  });

  it('makes the add button secondary while it shows, and primary again when it goes', () => {
    render(<Orders />);
    const add = () => screen.getByRole('button', { name: 'Add row' });
    expect(add()).toHaveAttribute('data-variant', 'primary');
    change('DH-1', 'Customer', 'Hoa');
    expect(add()).toHaveAttribute('data-variant', 'secondary');
    click(screen.getByRole('button', { name: 'Discard changes' }));
    expect(add()).toHaveAttribute('data-variant', 'primary');
  });

  it('says the first change once, and the next ones not', async () => {
    render(<Orders />);
    change('DH-1', 'Customer', 'Hoa');
    await tick();
    expect(live()).toContain('1 unsaved change');
    change('DH-3', 'Customer', 'Zed');
    await tick();
    expect(live()).not.toContain('2 unsaved changes');
  });

  it('keeps the focus where it is when its words are pressed', () => {
    render(<Orders />);
    change('DH-1', 'Customer', 'Hoa');
    const words = bar()!.querySelector<HTMLElement>('.flg-data-grid-savebar-text')!;
    const event = createEvent.mouseDown(words, { bubbles: true, cancelable: true });
    act(() => {
      fireEvent(words, event);
    });
    expect(event.defaultPrevented).toBe(true);
    const button = bar()!.querySelector('button')!;
    const onButton = createEvent.mouseDown(button, { bubbles: true, cancelable: true });
    act(() => {
      fireEvent(button, onButton);
    });
    expect(onButton.defaultPrevented).toBe(false);
  });

  it('is a stop of Tab before the table, as the toolbar is', () => {
    render(<Orders />);
    change('DH-1', 'Customer', 'Hoa');
    const order = Array.from(document.querySelectorAll('button, [tabindex="0"]'));
    const first = bar()!.querySelector('button')!;
    expect(order.indexOf(first)).toBeLessThan(
      order.indexOf(table().querySelector('[tabindex="0"]')!),
    );
  });
});

describe('Discard changes and cancelChanges()', () => {
  it('drop every change, mark and new row, call nothing and say nothing', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    change('DH-1', 'Customer', 'Hoa');
    click(deleteButton('DH-2'));
    addRow();
    press(input('Customer'), 'Escape');
    const before = live();
    click(screen.getByRole('button', { name: 'Discard changes' }));
    expect(bar()).toBeNull();
    expect(table().querySelector('[data-changed], [data-deleted], [data-new]')).toBeNull();
    expect(cellOf(rowOf('DH-1'), 'Customer')).toHaveTextContent('An');
    expect(onSaving).not.toHaveBeenCalled();
    expect(live()).toBe(before);
  });

  it('gives the focus to the place of the grid when the bar goes with the focus in it, never to the page', () => {
    render(<Orders />);
    change('DH-1', 'Customer', 'Hoa');
    focusOn(screen.getByRole('button', { name: 'Discard changes' }));
    click(screen.getByRole('button', { name: 'Discard changes' }));
    expect(bar()).toBeNull();
    expect(document.activeElement).not.toBe(document.body);
    expect(table().contains(document.activeElement)).toBe(true);
  });

  it('close the editor that is open, and keep the focus in the grid', () => {
    const gridRef = createRef<DataGridHandle>();
    render(<Orders gridRef={gridRef} />);
    change('DH-1', 'Customer', 'Hoa');
    click(cellOf(rowOf('DH-2'), 'Customer'));
    type('Customer', 'Zed');
    act(() => gridRef.current!.cancelChanges());
    expect(table().querySelector('[data-editor]')).toBeNull();
    expect(bar()).toBeNull();
    expect(table().contains(document.activeElement)).toBe(true);
  });

  it('keep the focus in the grid when a new row that had it goes', () => {
    const gridRef = createRef<DataGridHandle>();
    render(<Orders gridRef={gridRef} />);
    addRow();
    expect(input('Customer')).toHaveFocus();
    act(() => gridRef.current!.cancelChanges());
    expect(newRows()).toHaveLength(0);
    expect(table().contains(document.activeElement)).toBe(true);
  });

  it('are the handle of every mode: a row being edited, the cell being edited and the new rows', () => {
    const gridRef = createRef<DataGridHandle>();
    const { rerender } = render(<Orders gridRef={gridRef} editing={{ mode: 'row' }} />);
    click(screen.getByRole('button', { name: 'Edit DH-1' }));
    expect(table().querySelector('tr[data-editing]')).not.toBeNull();
    act(() => gridRef.current!.cancelChanges());
    expect(table().querySelector('tr[data-editing]')).toBeNull();
    rerender(<Orders gridRef={gridRef} editing={{ mode: 'cell', allowAdding: true }} />);
    addRow();
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    act(() => gridRef.current!.cancelChanges());
    expect(newRows()).toHaveLength(0);
    expect(table().querySelector('[data-editor]')).toBeNull();
  });
});

describe('Save changes and saveChanges()', () => {
  it('send every change in one onSaving: an insert, an update with the changed fields, a remove', async () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    addRow();
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    click(cellOf(newRows()[0]!, 'Qty'));
    type('Qty', '2');
    press(input('Qty'), 'Enter');
    click(deleteButton('DH-3'));
    change('DH-1', 'Customer', 'Zed');
    change('DH-1', 'Qty', '9');
    click(screen.getByRole('button', { name: 'Save changes' }));
    await tick();
    expect(onSaving).toHaveBeenCalledTimes(1);
    const sent = sentAt(onSaving);
    expect(sent).toHaveLength(3);
    expect(sent[0]).toMatchObject({ type: 'insert', key: 'flg-new-1', data: { customer: 'Hoa' } });
    expect(sent[1]).toMatchObject({ type: 'remove', key: 'DH-3' });
    expect(sent[2]).toMatchObject({
      type: 'update',
      key: 'DH-1',
      data: { customer: 'Zed', qty: 9 },
      row: ORDERS[0],
    });
  });

  it('clear the changes when onSaving answers, the marks and the bar with them, and say Changes saved', async () => {
    render(<Orders />);
    change('DH-1', 'Customer', 'Hoa');
    click(deleteButton('DH-2'));
    click(screen.getByRole('button', { name: 'Save changes' }));
    await tick();
    expect(bar()).toBeNull();
    expect(table().querySelector('[data-changed], [data-deleted]')).toBeNull();
    expect(live()).toContain('Changes saved');
  });

  it('resolve the handle with true, and at once with true when there is nothing to save', async () => {
    const gridRef = createRef<DataGridHandle>();
    const onSaving = vi.fn();
    render(<Orders gridRef={gridRef} onSaving={onSaving} />);
    await expect(gridRef.current!.saveChanges()).resolves.toBe(true);
    expect(onSaving).not.toHaveBeenCalled();
    change('DH-1', 'Customer', 'Hoa');
    let result: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result!).resolves.toBe(true);
    expect(onSaving).toHaveBeenCalledTimes(1);
  });

  it('commit the cell that is being edited first, with what was typed in it', async () => {
    const gridRef = createRef<DataGridHandle>();
    const onSaving = vi.fn();
    render(<Orders gridRef={gridRef} onSaving={onSaving} />);
    click(cellOf(rowOf('DH-1'), 'Customer'));
    type('Customer', 'Hoa');
    act(() => void gridRef.current!.saveChanges());
    await tick();
    expect(sentAt(onSaving)).toMatchObject([{ type: 'update', data: { customer: 'Hoa' } }]);
  });

  it('send nothing and keep the editor when the cell being edited fails its rules', async () => {
    const gridRef = createRef<DataGridHandle>();
    const onSaving = vi.fn();
    render(<Orders gridRef={gridRef} onSaving={onSaving} />);
    click(cellOf(rowOf('DH-1'), 'Customer'));
    type('Customer', '');
    let result: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result!).resolves.toBe(false);
    expect(onSaving).not.toHaveBeenCalled();
    expect(input('Customer')).toHaveFocus();
  });

  it('check every field of a new row, announce how many fields need attention and take the focus to the first', async () => {
    const gridRef = createRef<DataGridHandle>();
    const onSaving = vi.fn();
    render(<Orders gridRef={gridRef} onSaving={onSaving} />);
    addRow();
    press(input('Customer'), 'Escape');
    change('DH-1', 'Qty', '4');
    let result: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result!).resolves.toBe(false);
    expect(onSaving).not.toHaveBeenCalled();
    await tick();
    expect(live()).toContain('1 field needs attention');
    expect(cellOf(newRows()[0]!, 'Customer')).toHaveAttribute('data-invalid');
    expect(input('Customer')).toHaveFocus();
    // Every change is still there.
    expect(bar()).toHaveTextContent('2 unsaved changes');
  });

  it('check the fields of a changed row that nobody touched, and count the fields of every row', async () => {
    const gridRef = createRef<DataGridHandle>();
    const onSaving = vi.fn();
    const data = [{ ...ORDERS[0]!, customer: '' }, ...ORDERS.slice(1)];
    render(<Orders gridRef={gridRef} data={data} onSaving={onSaving} />);
    change('DH-1', 'Qty', '4');
    addRow();
    press(input('Customer'), 'Escape');
    let result: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result!).resolves.toBe(false);
    await tick();
    expect(live()).toContain('2 fields need attention');
    expect(onSaving).not.toHaveBeenCalled();
  });

  it('do not check a row that is marked for deletion', async () => {
    const gridRef = createRef<DataGridHandle>();
    const onSaving = vi.fn();
    const data = [{ ...ORDERS[0]!, customer: '' }, ...ORDERS.slice(1)];
    render(<Orders gridRef={gridRef} data={data} onSaving={onSaving} />);
    click(deleteButton('DH-1'));
    let result: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result!).resolves.toBe(true);
    expect(sentAt(onSaving)).toMatchObject([{ type: 'remove', key: 'DH-1' }]);
  });

  it('keep every change, show the alert and resolve false when onSaving is refused', async () => {
    const gridRef = createRef<DataGridHandle>();
    const onSaving = vi.fn(() => Promise.reject(new Error('The server said no')));
    render(<Orders gridRef={gridRef} onSaving={onSaving} />);
    change('DH-1', 'Customer', 'Hoa');
    click(deleteButton('DH-2'));
    let result: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result!).resolves.toBe(false);
    await tick();
    expect(screen.getByRole('alert')).toHaveTextContent('The server said no');
    expect(bar()).toHaveTextContent('2 unsaved changes');
    expect(cellOf(rowOf('DH-1'), 'Customer')).toHaveAttribute('data-changed');
    expect(rowOf('DH-2')).toHaveAttribute('data-deleted');
    // The next save sends them again.
    onSaving.mockImplementationOnce(() => Promise.resolve() as never);
    click(screen.getByRole('button', { name: 'Save changes' }));
    await tick();
    expect(onSaving).toHaveBeenCalledTimes(2);
    expect(bar()).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('put the words of a field that no row draws in the alert', async () => {
    const gridRef = createRef<DataGridHandle>();
    const reason = {
      message: 'Not saved.',
      fieldErrors: [{ key: 'DH-1', field: 'price', message: 'Price is locked' }],
    };
    render(<Orders gridRef={gridRef} onSaving={() => Promise.reject(reason)} />);
    change('DH-1', 'Customer', 'Hoa');
    act(() => void gridRef.current!.saveChanges());
    await tick();
    expect(screen.getByRole('alert')).toHaveTextContent('Not saved. Price is locked');
  });

  it('treat a throw as a refusal, warn once and keep the changes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const gridRef = createRef<DataGridHandle>();
    render(
      <Orders
        gridRef={gridRef}
        onSaving={() => {
          throw new Error('boom');
        }}
      />,
    );
    change('DH-1', 'Customer', 'Hoa');
    let result: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result!).resolves.toBe(false);
    expect(warn.mock.calls.some((call) => String(call[0]).startsWith(WARN_PREFIX))).toBe(true);
    expect(bar()).toHaveTextContent('1 unsaved change');
  });

  it('load the button while the answer is awaited, keep its focus, and send nothing for a second press', async () => {
    const pending = deferred();
    const onSaving = vi.fn(() => pending.promise);
    render(<Orders onSaving={onSaving} />);
    change('DH-1', 'Customer', 'Hoa');
    const save = screen.getByRole('button', { name: 'Save changes' });
    focusOn(save);
    click(save);
    expect(screen.getByRole('button', { name: 'Save changes' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Save changes' })).toHaveFocus();
    click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSaving).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve());
    expect(bar()).toBeNull();
  });

  it('keep what was changed while the save was pending, and send only that the next time', async () => {
    const pending = deferred();
    const onSaving = vi
      .fn()
      .mockImplementationOnce(() => pending.promise)
      .mockImplementation(() => {});
    render(<Orders onSaving={onSaving} />);
    change('DH-1', 'Customer', 'Hoa');
    click(screen.getByRole('button', { name: 'Save changes' }));
    // While the answer is awaited: another field of the same row, and another row.
    change('DH-1', 'Qty', '9');
    change('DH-3', 'Customer', 'Zed');
    await act(async () => pending.resolve());
    expect(bar()).toHaveTextContent('2 unsaved changes');
    expect(cellOf(rowOf('DH-1'), 'Customer')).not.toHaveAttribute('data-changed');
    expect(cellOf(rowOf('DH-1'), 'Qty')).toHaveAttribute('data-changed');
    expect(cellOf(rowOf('DH-3'), 'Customer')).toHaveAttribute('data-changed');
    click(screen.getByRole('button', { name: 'Save changes' }));
    await tick();
    expect(onSaving).toHaveBeenCalledTimes(2);
    expect(sentAt(onSaving, 1)).toMatchObject([
      { type: 'update', key: 'DH-1', data: { qty: 9 } },
      { type: 'update', key: 'DH-3', data: { customer: 'Zed' } },
    ]);
    // The second save is over the row as the first left it: the customer is the one that was sent.
    const second = sentAt(onSaving, 1)[0] as Extract<DataGridChange<Order>, { type: 'update' }>;
    expect(second.row).toMatchObject({ customer: 'Hoa' });
  });

  it('give the focus to the place of the grid when the bar goes with Save changes focused', async () => {
    render(<Orders />);
    change('DH-1', 'Customer', 'Hoa');
    focusOn(screen.getByRole('button', { name: 'Save changes' }));
    click(screen.getByRole('button', { name: 'Save changes' }));
    await tick();
    expect(bar()).toBeNull();
    expect(table().contains(document.activeElement)).toBe(true);
  });

  it('stop waiting when the mode changes: the answer is ignored and the handle says false', async () => {
    const pending = deferred();
    const gridRef = createRef<DataGridHandle>();
    const { rerender } = render(<Orders gridRef={gridRef} onSaving={() => pending.promise} />);
    change('DH-1', 'Customer', 'Hoa');
    let result: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    rerender(
      <Orders gridRef={gridRef} editing={{ mode: 'row' }} onSaving={() => pending.promise} />,
    );
    pending.resolve();
    await expect(result!).resolves.toBe(false);
    expect(bar()).toBeNull();
  });

  it('drop the changes when the mode changes, and send nothing', () => {
    const onSaving = vi.fn();
    const { rerender } = render(<Orders onSaving={onSaving} />);
    change('DH-1', 'Customer', 'Hoa');
    rerender(<Orders editing={{ mode: 'cell' }} onSaving={onSaving} />);
    expect(bar()).toBeNull();
    expect(table().querySelector('[data-changed]')).toBeNull();
    expect(onSaving).not.toHaveBeenCalled();
  });
});

describe('saveChanges() in the other modes', () => {
  it('saves the row being edited in row mode, and resolves with how the save went', async () => {
    const gridRef = createRef<DataGridHandle>();
    const onSaving = vi.fn();
    render(<Orders gridRef={gridRef} editing={{ mode: 'row' }} onSaving={onSaving} />);
    await expect(gridRef.current!.saveChanges()).resolves.toBe(true);
    expect(onSaving).not.toHaveBeenCalled();
    click(screen.getByRole('button', { name: 'Edit DH-1' }));
    type('Customer', 'Hoa');
    let result: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result!).resolves.toBe(true);
    expect(sentAt(onSaving)).toMatchObject([{ type: 'update', data: { customer: 'Hoa' } }]);
    expect(table().querySelector('tr[data-editing]')).toBeNull();
  });

  it('resolves false in row mode when the row fails its rules, or the save is refused', async () => {
    const gridRef = createRef<DataGridHandle>();
    const { rerender } = render(
      <Orders
        gridRef={gridRef}
        editing={{ mode: 'row' }}
        onSaving={() => Promise.reject(new Error('no'))}
      />,
    );
    click(screen.getByRole('button', { name: 'Edit DH-1' }));
    type('Customer', '');
    let result: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result!).resolves.toBe(false);
    type('Customer', 'Hoa');
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result!).resolves.toBe(false);
    rerender(<Orders gridRef={gridRef} editing={{ mode: 'row' }} onSaving={() => {}} />);
  });

  it('commits the cell being edited in cell mode, and sends the new row', async () => {
    const gridRef = createRef<DataGridHandle>();
    const onSaving = vi.fn();
    render(
      <Orders
        gridRef={gridRef}
        editing={{ mode: 'cell', allowAdding: true }}
        onSaving={onSaving}
      />,
    );
    addRow();
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    click(cellOf(rowOf('DH-2'), 'Customer'));
    type('Customer', 'Zed');
    let result: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result!).resolves.toBe(true);
    expect(onSaving).toHaveBeenCalledTimes(2);
    expect(sentAt(onSaving, 0)).toMatchObject([{ type: 'insert', data: { customer: 'Hoa' } }]);
    expect(sentAt(onSaving, 1)).toMatchObject([
      { type: 'update', key: 'DH-2', data: { customer: 'Zed' } },
    ]);
  });

  it('resolves true at once when a grid that does not edit has nothing to save', async () => {
    const gridRef = createRef<DataGridHandle>();
    render(<Orders gridRef={gridRef} editing={undefined} />);
    await expect(gridRef.current!.saveChanges()).resolves.toBe(true);
    act(() => gridRef.current!.cancelChanges());
  });
});

describe('a new row whose insert is pending', () => {
  /** A batch grid with one new row, Customer typed, and the save started: its answer is `pending`. */
  const savingANewRow = () => {
    const pending = deferred();
    const onSaving = vi.fn(() => pending.promise);
    const view = render(<Orders onSaving={onSaving} />);
    addRow();
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSaving).toHaveBeenCalledTimes(1);
    return { pending, onSaving, view };
  };

  it('opens no editor: not by Enter, F2, a character, a press or Space on a boolean', async () => {
    const { pending } = savingANewRow();
    const row = newRows()[0]!;
    const customer = cellOf(row, 'Customer');
    const paid = cellOf(row, 'Paid');
    const opens = (): number => table().querySelectorAll('[data-editor]').length;
    focusOn(customer);
    press(customer, 'Enter');
    expect(opens()).toBe(0);
    press(customer, 'F2');
    expect(opens()).toBe(0);
    press(customer, 'x');
    expect(opens()).toBe(0);
    click(customer);
    expect(opens()).toBe(0);
    focusOn(paid);
    press(paid, ' ');
    expect(opens()).toBe(0);
    expect(paid).not.toHaveAttribute('data-changed');
    await act(async () => pending.resolve());
  });

  it('shows the row the app brings when the answer comes, with no edit lost on the way', async () => {
    const { pending, view } = savingANewRow();
    const customer = cellOf(newRows()[0]!, 'Customer');
    focusOn(customer);
    press(customer, 'Enter');
    expect(table().querySelector('[data-editor]')).toBeNull();
    await act(async () => pending.resolve());
    expect(newRows()).toHaveLength(0);
    const brought = { id: 'DH-5', customer: 'Hoa', status: 1, qty: null, price: 0, paid: false };
    view.rerender(<Orders data={[...ORDERS, brought]} onSaving={() => {}} />);
    expect(cellOf(rowOf('DH-5'), 'Customer')).toHaveTextContent('Hoa');
    expect(table().querySelector('[data-editor]')).toBeNull();
  });

  it('is editable again when the save is refused', async () => {
    const { pending } = savingANewRow();
    await act(async () => pending.reject(new Error('No')));
    click(cellOf(newRows()[0]!, 'Customer'));
    expect(input('Customer')).toHaveValue('Hoa');
  });

  it('is read-only in cell mode while its insert is sent, and editable once it is refused', async () => {
    const pending = deferred();
    const gridRef = createRef<DataGridHandle>();
    render(
      <Orders
        gridRef={gridRef}
        editing={{ mode: 'cell', allowAdding: true }}
        onSaving={() => pending.promise}
      />,
    );
    addRow();
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    act(() => void gridRef.current!.saveChanges());
    const customer = cellOf(newRows()[0]!, 'Customer');
    click(customer);
    focusOn(customer);
    press(customer, 'Enter');
    expect(table().querySelector('[data-editor]')).toBeNull();
    await act(async () => pending.reject(new Error('No')));
    click(cellOf(newRows()[0]!, 'Customer'));
    expect(input('Customer')).toHaveValue('Hoa');
  });
});

describe('a refused batch save with fieldErrors', () => {
  const reason = (fieldErrors: unknown[]) => ({ message: 'Not saved.', fieldErrors });

  it('marks the cells it names in the rows the grid draws, with the words, and keeps every change', async () => {
    const gridRef = createRef<DataGridHandle>();
    render(
      <Orders
        gridRef={gridRef}
        onSaving={() =>
          Promise.reject(
            reason([
              { key: 'DH-1', field: 'customer', message: 'Customer is taken' },
              { key: 'DH-3', field: 'qty', message: 'Too many' },
              { key: 'DH-1', field: 'price', message: 'Price is locked' },
            ]),
          )
        }
      />,
    );
    change('DH-1', 'Customer', 'Hoa');
    change('DH-3', 'Qty', '9');
    act(() => void gridRef.current!.saveChanges());
    await tick();
    const customer = cellOf(rowOf('DH-1'), 'Customer');
    expect(customer).toHaveAttribute('data-invalid');
    expect(customer.querySelector('.flg-visually-hidden[id]')).toHaveTextContent(
      'Customer is taken',
    );
    expect(customer).toHaveAttribute(
      'aria-describedby',
      customer.querySelector('.flg-visually-hidden[id]')!.id,
    );
    expect(cellOf(rowOf('DH-3'), 'Qty')).toHaveAttribute('data-invalid');
    expect(cellOf(rowOf('DH-3'), 'Qty')).toHaveTextContent('Too many');
    // A cell no message names is not marked, and the alert holds only the field no row draws.
    expect(cellOf(rowOf('DH-1'), 'Qty')).not.toHaveAttribute('data-invalid');
    expect(screen.getByRole('alert')).toHaveTextContent('Not saved. Price is locked');
    expect(screen.getByRole('alert')).not.toHaveTextContent('Customer is taken');
    expect(bar()).toHaveTextContent('2 unsaved changes');
    expect(cellOf(rowOf('DH-1'), 'Customer')).toHaveAttribute('data-changed');
  });

  it('marks a new row the grid draws', async () => {
    const gridRef = createRef<DataGridHandle>();
    render(
      <Orders
        gridRef={gridRef}
        onSaving={() =>
          Promise.reject(reason([{ key: 'flg-new-1', field: 'customer', message: 'Taken' }]))
        }
      />,
    );
    addRow();
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    act(() => void gridRef.current!.saveChanges());
    await tick();
    expect(cellOf(newRows()[0]!, 'Customer')).toHaveAttribute('data-invalid');
    expect(screen.getByRole('alert')).toHaveTextContent('Not saved.');
    expect(screen.getByRole('alert')).not.toHaveTextContent('Taken');
  });

  it('takes the mark off a cell when it is edited again, and all of them with the next save', async () => {
    const gridRef = createRef<DataGridHandle>();
    const onSaving = vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.reject(
          reason([
            { key: 'DH-1', field: 'customer', message: 'Customer is taken' },
            { key: 'DH-3', field: 'qty', message: 'Too many' },
          ]),
        ),
      )
      .mockImplementation(() => Promise.reject(new Error('Again')));
    render(<Orders gridRef={gridRef} onSaving={onSaving} />);
    change('DH-1', 'Customer', 'Hoa');
    change('DH-3', 'Qty', '9');
    act(() => void gridRef.current!.saveChanges());
    await tick();
    click(cellOf(rowOf('DH-1'), 'Customer'));
    expect(cellOf(rowOf('DH-1'), 'Customer')).not.toHaveAttribute('data-invalid');
    press(input('Customer'), 'Escape');
    expect(cellOf(rowOf('DH-3'), 'Qty')).toHaveAttribute('data-invalid');
    act(() => void gridRef.current!.saveChanges());
    await tick();
    expect(table().querySelector('[data-invalid]')).toBeNull();
  });

  it('marks nothing when the reason names no field', async () => {
    const gridRef = createRef<DataGridHandle>();
    render(<Orders gridRef={gridRef} onSaving={() => Promise.reject(new Error('Offline'))} />);
    change('DH-1', 'Customer', 'Hoa');
    act(() => void gridRef.current!.saveChanges());
    await tick();
    expect(table().querySelector('[data-invalid]')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('Offline');
  });
});

/** A thenable whose `then` throws: the answer that cannot even be waited for. */
const badThenable = () => ({
  then() {
    throw new Error('then threw');
  },
});

describe('a thenable whose then throws (final review, Task 4 m4)', () => {
  it('is a refusal in batch mode: every change stays, the alert shows, and the save has ended', async () => {
    const gridRef = createRef<DataGridHandle>();
    const onSaving = vi.fn(badThenable);
    render(<Orders gridRef={gridRef} onSaving={onSaving as never} />);
    change('DH-1', 'Customer', 'Hoa');
    let result: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result!).resolves.toBe(false);
    expect(bar()).toHaveTextContent('1 unsaved change');
    expect(document.querySelector('.flg-data-grid [role="alert"]')).toHaveTextContent('then threw');
    // Not pending any more: the next save sends again.
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result!).resolves.toBe(false);
    expect(onSaving).toHaveBeenCalledTimes(2);
  });
});
