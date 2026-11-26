import { act, createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import type { Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridEditing, DataGridHandle, DataGridProps } from './index';

// The edited row, its focus and the app's own functions (fix wave of Plan F, Part B): the row being edited stays put
// and a stale edit never comes back, a mode that goes never drops the focus to <body>, a row no field of which can be
// edited has no Edit, `allowEditing` and `allowUpdating` are asked of one row and a throw of them or of a column's
// editor is caught, and a new row that holds only some fields never crashes a cell.

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
  channel: string;
  status: string;
}

const ORDERS: Order[] = [
  { id: 'DH-1', customer: 'An', qty: 3, channel: 'Store', status: 'open' },
  { id: 'DH-2', customer: 'Bình', qty: 5, channel: 'Web', status: 'open' },
  { id: 'DH-3', customer: 'Chi', qty: 1, channel: 'Store', status: 'open' },
  { id: 'DH-4', customer: 'Dũng', qty: 2, channel: 'Web', status: 'closed' },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, allowEditing: false, width: 100 },
  { field: 'customer', caption: 'Customer', width: 140 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 100 },
  { field: 'channel', caption: 'Channel', width: 120 },
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
const shown = (name: string) => dataRows().some((row) => row.textContent?.includes(name));
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

const FORM: DataGridEditing<Order> = { mode: 'form' };
const formRow = () =>
  table().querySelector<HTMLTableRowElement>('tbody > tr.flg-data-grid-form-row');
const field = (label: string) =>
  within(formRow()!.querySelector('form')!).getByLabelText(label) as HTMLInputElement;

describe('the row being edited stays put (B1)', () => {
  it('is not taken by a search or a filter while it is edited', () => {
    const { rerender } = render(<Orders filter={{ search: '' }} />);
    clickOn(edit('DH-1'));
    type('Customer', 'Hoa');
    rerender(<Orders filter={{ search: 'Chi' }} />);
    expect(shown('DH-1')).toBe(true);
    expect(shown('DH-3')).toBe(true);
    expect(shown('DH-2')).toBe(false);
    expect(input('Customer').value).toBe('Hoa');
  });

  it('is not taken by a search either in cell mode', () => {
    const { rerender } = render(<Orders editing={{ mode: 'cell' }} filter={{ search: '' }} />);
    focusOn(cell('DH-1', 'Customer'));
    clickOn(cell('DH-1', 'Customer'));
    rerender(<Orders editing={{ mode: 'cell' }} filter={{ search: 'Chi' }} />);
    expect(shown('DH-1')).toBe(true);
  });

  it('ends the edit, without a word, when the app takes its row away, and never brings it back', () => {
    const onSaving = vi.fn();
    const outside = document.createElement('button');
    document.body.append(outside);
    const { rerender } = render(<Orders onSaving={onSaving} />);
    clickOn(edit('DH-2'));
    type('Customer', 'Lan');
    const without = ORDERS.filter((order) => order.id !== 'DH-2');
    rerender(<Orders onSaving={onSaving} data={without} />);
    expect(shown('DH-2')).toBe(false);
    expect(editors()).toHaveLength(0);
    focusOn(outside);
    rerender(<Orders onSaving={onSaving} data={ORDERS} />);
    // The row is back, at rest: no editor, the draft is gone, and the focus is where the user put it.
    expect(shown('DH-2')).toBe(true);
    expect(table().querySelector('tr[data-editing]')).toBeNull();
    expect(outside).toHaveFocus();
    expect(onSaving).not.toHaveBeenCalled();
    outside.remove();
  });

  it('lets another row start after its row was taken away', () => {
    const { rerender } = render(<Orders />);
    clickOn(edit('DH-2'));
    rerender(<Orders data={ORDERS.filter((order) => order.id !== 'DH-2')} />);
    clickOn(edit('DH-1'));
    expect(table().querySelector('tr[data-editing]')).toBe(rowOf('DH-1'));
  });

  it.each([
    ['row', { mode: 'row' } as const],
    ['form', FORM],
  ])('keeps the draft and the focus when %s mode comes back from another page', (_name, config) => {
    // One row to a page, the edited row on page 2: the buttons the user presses are enabled on every page they visit.
    render(<Orders editing={config} paging={{ pageSize: 1 }} />);
    clickOn(screen.getByRole('button', { name: 'Next page' }));
    clickOn(edit('DH-2'));
    if (config.mode === 'row') type('Customer', 'Hoa');
    else fireEvent.change(field('Customer'), { target: { value: 'Hoa' } });
    const next = screen.getByRole('button', { name: 'Next page' });
    focusOn(next);
    clickOn(next);
    expect(shown('DH-2')).toBe(false);
    expect(next).toHaveFocus();
    const back = screen.getByRole('button', { name: 'Previous page' });
    focusOn(back);
    clickOn(back);
    // The editors are back with what was typed, and the focus stays on the button the user pressed.
    if (config.mode === 'row') {
      expect(table().querySelector('tr[data-editing]')).toBe(rowOf('DH-2'));
      expect(input('Customer').value).toBe('Hoa');
    } else {
      expect(field('Customer').value).toBe('Hoa');
    }
    expect(back).toHaveFocus();
  });

  it.each([
    ['row', { mode: 'row' } as const],
    ['form', FORM],
  ])('keeps the draft and the focus when a group of %s mode is closed and opened', (_n, config) => {
    render(
      <Orders
        editing={config}
        grouping={[{ field: 'channel', direction: 'asc' }]}
        defaultExpandedGroups={{ allExpanded: true, except: [] }}
      />,
    );
    clickOn(edit('DH-1'));
    if (config.mode === 'row') type('Customer', 'Hoa');
    else fireEvent.change(field('Customer'), { target: { value: 'Hoa' } });
    const groups = () =>
      Array.from(table().querySelectorAll<HTMLElement>('.flg-data-grid-group-row'));
    const store = () => groups().find((row) => row.textContent?.includes('Store'))!;
    const outside = document.createElement('button');
    document.body.append(outside);
    act(() => store().click());
    expect(shown('DH-1')).toBe(false);
    focusOn(outside);
    act(() => store().click());
    if (config.mode === 'row') {
      expect(table().querySelector('tr[data-editing]')).toBe(rowOf('DH-1'));
      expect(input('Customer').value).toBe('Hoa');
    } else {
      expect(field('Customer').value).toBe('Hoa');
    }
    expect(outside).toHaveFocus();
    outside.remove();
  });
});

describe('a new row that is deleted while its editor is open (B2)', () => {
  it('ends its edit, and the place that leaves a later new row sends it', () => {
    const onSaving = vi.fn();
    const ref = createRef<DataGridHandle>();
    render(
      <Orders
        gridRef={ref}
        onSaving={onSaving}
        editing={{ mode: 'cell', allowAdding: true, allowDeleting: true }}
      />,
    );
    act(() => ref.current!.addRow());
    expect(editors()).toHaveLength(1);
    clickOn(screen.getByRole('button', { name: 'Delete (new)' }));
    expect(editors()).toHaveLength(0);
    expect(document.activeElement).not.toBe(document.body);
    expect(onSaving).not.toHaveBeenCalled();
    // Another new row: filled, and sent when the place moves off it, which a stale edit would have blocked.
    act(() => ref.current!.addRow());
    type('Customer', 'Yến');
    press(input('Customer'), 'Enter');
    press(document.activeElement as HTMLElement, 'ArrowDown');
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sentAt(onSaving)[0]).toMatchObject({ type: 'insert', data: { customer: 'Yến' } });
  });
});
