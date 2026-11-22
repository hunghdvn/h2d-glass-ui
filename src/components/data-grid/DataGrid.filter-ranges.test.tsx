import { act, createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import type { Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridFilter, DataGridHandle, DataGridProps } from './index';
import { FILTER_DELAY } from './parts/FilterCell';

// The cells of numbers and days of the filter row, the operator `between` and the one filter popover of the
// grid (spec phase 6 §4.3 F1 "Hàng lọc", §6.3 "Lọc"). What needs a layout engine or the top layer to be true
// (the popover under its field, the calendar inside a sticky pinned cell, Esc and the focus after it in each
// engine) is proven in the stories (`DataGridFiltering.stories.tsx`).

// Which popovers are showing: jsdom has no Popover API.
let showing: Set<Element>;
beforeEach(() => {
  resetDevWarnings();
  // jsdom's document has no focus once an input is blurred, which a DatePicker would read as a window switch.
  vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  showing = new Set();
  HTMLElement.prototype.checkVisibility = () => true;
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
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
  Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  vi.restoreAllMocks();
  vi.useRealTimers();
});

interface Order {
  id: string;
  qty: number;
  placed: string;
  at: number;
}

// `at` of DH-3 is 6 November 03:30 in Ho Chi Minh City, and 5 November 20:30 in UTC.
const ORDERS: Order[] = [
  { id: 'DH-1', qty: 3, placed: '2026-11-04', at: Date.UTC(2026, 10, 4, 9, 0) },
  { id: 'DH-2', qty: 12, placed: '2026-11-05', at: Date.UTC(2026, 10, 5, 9, 0) },
  { id: 'DH-3', qty: 21, placed: '2026-11-06', at: Date.UTC(2026, 10, 5, 20, 30) },
  { id: 'DH-4', qty: 1000.5, placed: '2026-11-07', at: Date.UTC(2026, 10, 7, 9, 0) },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104, allowFiltering: false },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 100 },
  { field: 'placed', caption: 'Placed', dataType: 'date', width: 150 },
  { field: 'at', caption: 'At', dataType: 'datetime', width: 170 },
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
      filterRow
      {...props}
    />
  );
}

/** A grid whose parent holds the filter, as the parent of a controlled grid does. */
function Held({
  start = {},
  ...props
}: Partial<DataGridProps<Order>> & { start?: DataGridFilter }) {
  const [filter, setFilter] = useState(start);
  return (
    <>
      <button type="button" onClick={() => setFilter({ columns: { qty: { value: 21 } } })}>
        set outside
      </button>
      <Orders filter={filter} onFilterChange={setFilter} {...props} />
    </>
  );
}

const grid = () => screen.getByRole('grid') as HTMLTableElement;
const bodyRows = () => Array.from(grid().querySelectorAll<HTMLElement>('tbody > tr'));
const ids = () => bodyRows().map((row) => row.children[0]!.textContent);
const qty = () => screen.getByRole('textbox', { name: 'Filter Qty' }) as HTMLInputElement;
const placed = () => screen.getByRole('textbox', { name: 'Filter Placed' }) as HTMLInputElement;
const at = () => screen.getByRole('textbox', { name: 'Filter At' }) as HTMLInputElement;
const range = () => screen.getByRole('combobox', { name: 'Filter Qty' }) as HTMLInputElement;
// Three columns have an operator button and the same default operator: a test names the cell it means when it matters.
const operatorButton = (name: string, cell: HTMLElement = document.body) =>
  within(cell).getByRole('button', { name: `Operator: ${name}` }) as HTMLButtonElement;
const menu = () => document.querySelector<HTMLElement>('.flg-data-grid-operator-menu');
const radio = (name: string) =>
  Array.from(menu()?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? []).find(
    (item) => item.textContent === name,
  )!;
const popovers = () => document.querySelectorAll<HTMLElement>('.flg-data-grid-filter-popover');
const popover = () => popovers()[0]!;
// jsdom takes a popover for hidden, as it does a Select's listbox: its parts are found by role all the same.
const inPopover = (role: string, name: string) =>
  within(popover()).getByRole(role, { name, hidden: true });
const editor = (name: string) => inPopover('textbox', name) as HTMLInputElement;
const button = (name: string) => inPopover('button', name);
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const lastFilter = (spy: ReturnType<typeof vi.fn>) => spy.mock.calls.at(-1)?.[0];
const type = (element: HTMLElement, text: string) =>
  fireEvent.change(element, { target: { value: text } });
const press = (element: HTMLElement, key: string, init: KeyboardEventInit = {}): boolean => {
  const event = createEvent.keyDown(element, { key, bubbles: true, cancelable: true, ...init });
  act(() => {
    fireEvent(element, event);
  });
  return event.defaultPrevented;
};
/** A press and a click on an element, as a mouse makes them. */
function click(element: HTMLElement) {
  fireEvent.pointerDown(element, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 });
  fireEvent.mouseDown(element);
  fireEvent.pointerUp(element, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 });
  fireEvent.click(element, { detail: 1 });
}
const leave = (element: HTMLElement) =>
  act(() => {
    element.focus();
    element.blur();
  });
const aTaskLater = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
const chooseOperator = (from: string, to: string, cell: HTMLElement = document.body) => {
  click(operatorButton(from, cell));
  act(() => radio(to).click());
};

describe('a number cell', () => {
  it('is an input named after its column, inputmode decimal, with the operator button before it', () => {
    render(<Orders />);
    expect(qty()).toHaveAttribute('inputmode', 'decimal');
    const frame = qty().closest('.flg-input')!;
    expect(frame).toHaveAttribute('data-size', 'sm');
    expect(frame).toHaveClass('flg-data-grid-filter-number');
    expect(frame.firstElementChild).toHaveClass('flg-input-adornment');
    // A number column offers `=` first.
    expect(
      within(frame as HTMLElement).getByRole('button', { name: 'Operator: Equals' }),
    ).toBeTruthy();
  });

  it('reads the number as the locale writes it: 1,000.5 in en-US and 1.000,5 in vi-VN', () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    const { rerender } = render(<Orders onFilterChange={onFilterChange} />);
    type(qty(), '1,000.5');
    advance(FILTER_DELAY);
    expect(lastFilter(onFilterChange)).toEqual({ columns: { qty: { value: 1000.5 } } });
    expect(ids()).toEqual(['DH-4']);
    rerender(<Orders locale="vi-VN" filter={{}} onFilterChange={onFilterChange} />);
    type(qty(), '1.000,5');
    advance(FILTER_DELAY);
    expect(lastFilter(onFilterChange)).toEqual({ columns: { qty: { value: 1000.5 } } });
    expect(onFilterChange).toHaveBeenCalledTimes(2);
  });

  it('sends nothing while an input method composes, and sends once FILTER_DELAY after it ends', () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    fireEvent.compositionStart(qty());
    type(qty(), '1');
    type(qty(), '12');
    advance(FILTER_DELAY * 3);
    expect(onFilterChange).not.toHaveBeenCalled();
    fireEvent.compositionEnd(qty());
    advance(FILTER_DELAY - 1);
    expect(onFilterChange).not.toHaveBeenCalled();
    advance(1);
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({ columns: { qty: { value: 12 } } });
  });

  it('drops the number that waits for the button that clears the filter, and sends nothing more', () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { placed: { value: '2030-01-01' } } }}
        onFilterChange={onFilterChange}
      />,
    );
    type(qty(), '5');
    advance(FILTER_DELAY - 100);
    fireEvent.click(screen.getByRole('button', { name: 'Clear filter' }));
    expect(qty()).toHaveValue('');
    advance(FILTER_DELAY * 3);
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({});
  });

  it('shows a held number the way the locale types it, and not grouped', () => {
    const { rerender } = render(<Orders defaultFilter={{ columns: { qty: { value: 1000.5 } } }} />);
    expect(qty()).toHaveValue('1000.5');
    rerender(<Orders defaultFilter={{ columns: { qty: { value: 1000.5 } } }} locale="vi-VN" />);
    // A locale that changes leaves the text the user may have typed: only a change of the value replaces it.
    expect(qty()).toHaveValue('1000.5');
  });

  it('shows a held number in vi-VN with its comma', () => {
    render(<Orders locale="vi-VN" defaultFilter={{ columns: { qty: { value: 1000.5 } } }} />);
    expect(qty()).toHaveValue('1000,5');
  });

  it('filters with the operator the user chose, and applies at once on Enter', () => {
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { qty: { operator: '>' } } }}
        onFilterChange={onFilterChange}
      />,
    );
    type(qty(), '12');
    press(qty(), 'Enter');
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(lastFilter(onFilterChange)).toEqual({ columns: { qty: { operator: '>', value: 12 } } });
    expect(ids()).toEqual(['DH-3', 'DH-4']);
  });

  it('marks text that is no number invalid, keeps it, and takes the condition it had away, once', () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { qty: { value: 12 } } }}
        onFilterChange={onFilterChange}
      />,
    );
    expect(ids()).toEqual(['DH-2']);
    expect(qty()).not.toBeInvalid();
    type(qty(), 'abc');
    // Invalid at once, with the text kept as typed.
    expect(qty()).toBeInvalid();
    advance(FILTER_DELAY);
    expect(qty()).toHaveValue('abc');
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(lastFilter(onFilterChange)).toEqual({});
    expect(ids()).toHaveLength(4);
    // More text that is no number: the condition is not there, so nothing is applied again.
    type(qty(), 'abcd');
    advance(FILTER_DELAY);
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(qty()).toBeInvalid();
    // A number again.
    type(qty(), '21');
    advance(FILTER_DELAY);
    expect(qty()).not.toBeInvalid();
    expect(lastFilter(onFilterChange)).toEqual({ columns: { qty: { value: 21 } } });
    expect(onFilterChange).toHaveBeenCalledTimes(2);
  });

  it('applies nothing for text that is no number when the column had no condition', () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    type(qty(), 'abc');
    advance(FILTER_DELAY);
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it('takes a number held from outside, and Esc with text clears it and applies at once', () => {
    render(<Held />);
    fireEvent.click(screen.getByRole('button', { name: 'set outside' }));
    expect(qty()).toHaveValue('21');
    expect(ids()).toEqual(['DH-3']);
    act(() => qty().focus());
    expect(press(qty(), 'Escape')).toBe(true);
    expect(qty()).toHaveValue('');
    expect(ids()).toHaveLength(4);
  });
});

describe('a date cell', () => {
  it('is a DatePicker named after its column, with the operator button first and the calendar button last', () => {
    render(<Orders defaultFilter={{ columns: { placed: { value: '2026-11-05' } } }} />);
    expect(placed()).toHaveValue('11/05/2026');
    const frame = placed().closest('.flg-input')!;
    expect(frame.closest('.flg-date-picker')).toHaveAttribute('data-size', 'sm');
    expect(Array.from(frame.children).map((child) => child.tagName)).toEqual([
      'SPAN',
      'INPUT',
      'BUTTON',
    ]);
    expect(within(frame.firstElementChild as HTMLElement).getByRole('button')).toHaveAccessibleName(
      'Operator: Equals',
    );
    expect(frame.lastElementChild).toHaveAccessibleName('Choose date');
  });

  it('writes the day in the grid locale, and reads a typed day in it', () => {
    const onFilterChange = vi.fn();
    render(<Orders locale="vi-VN" onFilterChange={onFilterChange} />);
    expect(placed()).toHaveAttribute('placeholder', 'dd/mm/yyyy');
    type(placed(), '06/11/2026');
    leave(placed());
    expect(lastFilter(onFilterChange)).toEqual({ columns: { placed: { value: '2026-11-06' } } });
    expect(ids()).toEqual(['DH-3']);
    expect(placed()).toHaveValue('06/11/2026');
  });

  it('applies a day that is typed when the text is left, or Enter is pressed, and not while it is typed', () => {
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    type(placed(), '11/0');
    type(placed(), '11/06/2026');
    expect(onFilterChange).not.toHaveBeenCalled();
    press(placed(), 'Enter');
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(lastFilter(onFilterChange)).toEqual({ columns: { placed: { value: '2026-11-06' } } });
  });

  it('applies a day picked in the calendar at once, with the operator the user chose', () => {
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { placed: { operator: '>=', value: '2026-11-05' } } }}
        onFilterChange={onFilterChange}
      />,
    );
    expect(ids()).toEqual(['DH-2', 'DH-3', 'DH-4']);
    fireEvent.click(
      within(placed().closest('.flg-input') as HTMLElement).getByRole('button', {
        name: 'Choose date',
      }),
    );
    fireEvent.click(document.querySelector('button[data-date="2026-11-07"]')!);
    expect(lastFilter(onFilterChange)).toEqual({
      columns: { placed: { operator: '>=', value: '2026-11-07' } },
    });
    expect(ids()).toEqual(['DH-4']);
  });

  it('takes the value away when the text is emptied', () => {
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { placed: { value: '2026-11-05' } } }}
        onFilterChange={onFilterChange}
      />,
    );
    type(placed(), '');
    leave(placed());
    expect(lastFilter(onFilterChange)).toEqual({});
    expect(ids()).toHaveLength(4);
  });

  it('filters a datetime by its day in the time zone of the grid', () => {
    const filter = { columns: { at: { value: '2026-11-06' } } };
    const { rerender } = render(<Orders defaultFilter={filter} timeZone="Asia/Ho_Chi_Minh" />);
    // 5 November 20:30 in UTC is already the 6th in Ho Chi Minh City.
    expect(at()).toHaveValue('11/06/2026');
    expect(ids()).toEqual(['DH-3']);
    rerender(<Orders defaultFilter={filter} timeZone="UTC" key="utc" />);
    expect(screen.getByText('No rows match the filter')).toBeInTheDocument();
  });

  it('shows a day held from outside', () => {
    const { rerender } = render(<Orders filter={{}} />);
    expect(placed()).toHaveValue('');
    rerender(<Orders filter={{ columns: { placed: { value: '2026-11-06' } } }} />);
    expect(placed()).toHaveValue('11/06/2026');
  });
});

describe('the range of between', () => {
  const between: DataGridFilter = { columns: { qty: { operator: 'between' } } };

  it('is a read-only field with a placeholder, which opens the one popover of the grid', () => {
    render(<Orders defaultFilter={between} />);
    expect(range()).toHaveAttribute('readonly');
    expect(range()).toHaveAttribute('placeholder', 'From – to');
    expect(range()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(range()).toHaveAttribute('aria-expanded', 'false');
    expect(popovers()).toHaveLength(1);
    expect(popover().querySelector('input')).toBeNull();
    click(range());
    expect(popovers()).toHaveLength(1);
    expect(showing.has(popover())).toBe(true);
    expect(popover()).toHaveAttribute('role', 'dialog');
    expect(popover()).toHaveAttribute('aria-label', 'Filter Qty');
    expect(popover()).toHaveClass('flg-surface', 'flg-popover');
    expect(popover().querySelector('.flg-popover-arrow')).not.toBeNull();
    expect(range()).toHaveAttribute('aria-expanded', 'true');
    expect(range()).toHaveAttribute('aria-controls', popover().id);
    // The focus goes to the first field.
    expect(editor('From')).toHaveFocus();
    expect(editor('To')).toBeInTheDocument();
  });

  it('opens on Enter, and a second press on the field closes it', () => {
    render(<Orders defaultFilter={between} />);
    act(() => range().focus());
    expect(press(range(), 'Enter')).toBe(true);
    expect(showing.has(popover())).toBe(true);
    click(range());
    expect(showing.has(popover())).toBe(false);
    expect(range()).toHaveAttribute('aria-expanded', 'false');
  });

  it('applies [from, to] on OK, says the range in its cell, and filters inclusively', () => {
    const onFilterChange = vi.fn();
    render(<Orders defaultFilter={between} onFilterChange={onFilterChange} />);
    click(range());
    type(editor('From'), '12');
    type(editor('To'), '21');
    fireEvent.click(button('OK'));
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(lastFilter(onFilterChange)).toEqual({
      columns: { qty: { operator: 'between', value: [12, 21] } },
    });
    expect(ids()).toEqual(['DH-2', 'DH-3']);
    expect(range()).toHaveValue('12 – 21');
    expect(showing.has(popover())).toBe(false);
    // The focus is back where the popover came from.
    expect(range()).toHaveFocus();
  });

  it('applies on Enter in a field, once', async () => {
    const onFilterChange = vi.fn();
    render(<Orders defaultFilter={between} onFilterChange={onFilterChange} />);
    click(range());
    type(editor('From'), '12');
    expect(press(editor('From'), 'Enter')).toBe(true);
    await aTaskLater();
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(lastFilter(onFilterChange)).toEqual({
      columns: { qty: { operator: 'between', value: [12, null] } },
    });
    expect(showing.has(popover())).toBe(false);
  });

  it('keeps an open end open: from only, to only, and none is no value', () => {
    const { rerender } = render(<Orders defaultFilter={between} />);
    click(range());
    type(editor('From'), '21');
    fireEvent.click(button('OK'));
    expect(ids()).toEqual(['DH-3', 'DH-4']);
    expect(range()).toHaveValue('≥ 21');
    click(range());
    expect(editor('From')).toHaveValue('21');
    type(editor('From'), '');
    type(editor('To'), '12');
    fireEvent.click(button('OK'));
    expect(ids()).toEqual(['DH-1', 'DH-2']);
    expect(range()).toHaveValue('≤ 12');
    click(range());
    type(editor('To'), '');
    fireEvent.click(button('OK'));
    expect(ids()).toHaveLength(4);
    expect(range()).toHaveValue('');
    // A range with no ends keeps the operator the user chose.
    rerender(<Orders defaultFilter={between} />);
    expect(range()).toBeInTheDocument();
  });

  it('changes nothing for Cancel and for a light dismiss, and no callback', () => {
    const onFilterChange = vi.fn();
    render(<Orders defaultFilter={between} onFilterChange={onFilterChange} />);
    click(range());
    type(editor('From'), '12');
    fireEvent.click(button('Cancel'));
    expect(showing.has(popover())).toBe(false);
    expect(range()).toHaveFocus();
    click(range());
    expect(editor('From')).toHaveValue('');
    type(editor('From'), '12');
    // The browser closes it (a press elsewhere, Esc) and tells the page with a toggle event.
    act(() => {
      showing.delete(popover());
      fireEvent(popover(), Object.assign(new Event('toggle'), { newState: 'closed' }));
    });
    expect(range()).toHaveAttribute('aria-expanded', 'false');
    expect(onFilterChange).not.toHaveBeenCalled();
    expect(ids()).toHaveLength(4);
  });

  it('keeps the popover open on a number that is no number, with the focus on it', () => {
    const onFilterChange = vi.fn();
    render(<Orders defaultFilter={between} onFilterChange={onFilterChange} />);
    click(range());
    type(editor('From'), '1');
    type(editor('To'), 'x');
    expect(editor('To')).toBeInvalid();
    expect(editor('From')).not.toBeInvalid();
    fireEvent.click(button('OK'));
    expect(showing.has(popover())).toBe(true);
    expect(editor('To')).toHaveFocus();
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it('closes as Cancel on Tab past the last control and on Shift+Tab before the first, to the field', () => {
    const onFilterChange = vi.fn();
    render(<Orders defaultFilter={between} onFilterChange={onFilterChange} />);
    click(range());
    const ok = button('OK');
    // Tab in the middle of the popover is the browser's.
    expect(press(editor('From'), 'Tab')).toBe(false);
    act(() => ok.focus());
    expect(press(ok, 'Tab')).toBe(true);
    expect(showing.has(popover())).toBe(false);
    expect(range()).toHaveFocus();
    click(range());
    expect(press(editor('From'), 'Tab', { shiftKey: true })).toBe(true);
    expect(showing.has(popover())).toBe(false);
    expect(range()).toHaveFocus();
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it('starts each opening from the filter as it is, and one popover serves every column', () => {
    render(
      <Orders
        defaultFilter={{
          columns: {
            qty: { operator: 'between', value: [12, 21] },
            placed: { operator: 'between', value: ['2026-11-05', '2026-11-06'] },
          },
        }}
      />,
    );
    expect(range()).toHaveValue('12 – 21');
    click(range());
    expect(editor('From')).toHaveValue('12');
    expect(editor('To')).toHaveValue('21');
    fireEvent.click(button('Cancel'));
    const dates = screen.getByRole('combobox', { name: 'Filter Placed' });
    expect(dates).toHaveValue('11/05/2026 – 11/06/2026');
    click(dates);
    expect(popovers()).toHaveLength(1);
    expect(popover()).toHaveAttribute('aria-label', 'Filter Placed');
    // The ends of a date are pickers.
    expect(within(popover()).getAllByRole('textbox', { hidden: true })).toHaveLength(2);
    expect(
      within(popover()).getAllByRole('button', { name: 'Choose date', hidden: true }),
    ).toHaveLength(2);
  });

  it('applies the days of a range of dates', () => {
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { placed: { operator: 'between' } } }}
        onFilterChange={onFilterChange}
      />,
    );
    click(screen.getByRole('combobox', { name: 'Filter Placed' }));
    type(editor('From'), '11/05/2026');
    press(editor('From'), 'Enter');
    leave(editor('From'));
    fireEvent.click(button('OK'));
    expect(lastFilter(onFilterChange)).toEqual({
      columns: { placed: { operator: 'between', value: ['2026-11-05', null] } },
    });
    expect(ids()).toEqual(['DH-2', 'DH-3', 'DH-4']);
  });

  it('is named by the labels', () => {
    render(
      <Orders
        defaultFilter={{ columns: { qty: { operator: 'between', value: [1, 2] } } }}
        labels={{
          between: 'Từ – đến',
          from: 'Từ',
          to: 'Đến',
          range: (from, to) => `${from} đến ${to}`,
          ok: 'Đồng ý',
          cancel: 'Huỷ',
        }}
      />,
    );
    expect(range()).toHaveValue('1 đến 2');
    click(range());
    expect(editor('Từ')).toBeInTheDocument();
    expect(editor('Đến')).toBeInTheDocument();
    expect(button('Đồng ý')).toBeInTheDocument();
    expect(button('Huỷ')).toBeInTheDocument();
  });

  it('writes the ends as the column writes them', () => {
    render(
      <Orders
        locale="vi-VN"
        defaultFilter={{ columns: { qty: { operator: 'between', value: [1000.5, 2000] } } }}
        columns={COLUMNS.map((column) =>
          column.field === 'qty' ? { ...column, format: { minimumFractionDigits: 2 } } : column,
        )}
      />,
    );
    expect(range()).toHaveValue('1.000,50 – 2.000,00');
  });
});

describe('switching to and from between', () => {
  it('clears the value, which is of another kind, and keeps it between the other operators', () => {
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { qty: { operator: '>', value: 12 } } }}
        onFilterChange={onFilterChange}
      />,
    );
    chooseOperator('Greater than', 'Less than');
    expect(lastFilter(onFilterChange)).toEqual({ columns: { qty: { operator: '<', value: 12 } } });
    chooseOperator('Less than', 'Between');
    expect(lastFilter(onFilterChange)).toEqual({ columns: { qty: { operator: 'between' } } });
    expect(range()).toHaveValue('');
    expect(ids()).toHaveLength(4);
    // A range the user set is not read as a number when the operator goes back.
    click(range());
    type(editor('From'), '12');
    fireEvent.click(button('OK'));
    chooseOperator('Between', 'Equals');
    expect(lastFilter(onFilterChange)).toEqual({ columns: { qty: { operator: '=' } } });
    expect(qty()).toHaveValue('');
    expect(ids()).toHaveLength(4);
  });

  it('works for a date too', () => {
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { placed: { value: '2026-11-05' } } }}
        onFilterChange={onFilterChange}
      />,
    );
    chooseOperator('Equals', 'Between', placed().closest('td')!);
    expect(lastFilter(onFilterChange)).toEqual({ columns: { placed: { operator: 'between' } } });
    expect(screen.getByRole('combobox', { name: 'Filter Placed' })).toHaveValue('');
  });
});

describe('userEvent in the number cell', () => {
  it('types a number and the grid filters once the delay is out', async () => {
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    const user = userEvent.setup();
    await user.click(qty());
    await user.keyboard('21{Enter}');
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(lastFilter(onFilterChange)).toEqual({ columns: { qty: { value: 21 } } });
    expect(ids()).toEqual(['DH-3']);
  });
});

// Where the focus goes when a popup of the filter row closes (the operator menu, the range popover): back to
// what opened it while that stands in the document, else to what stands for it in the same column.
describe('the focus after a popup of the filter row closes', () => {
  const noPopup = () => expect([...showing].filter((el) => el.isConnected)).toHaveLength(0);
  const columnLayout = (hidden: string[]) => ({
    order: ['id', 'qty', 'placed', 'at'],
    widths: {},
    hidden,
    pinned: {},
  });

  it.each([
    ['by a press', (item: HTMLElement): void => act(() => item.click())],
    ['by the keys', (item: HTMLElement): void => void press(item, 'Enter')],
  ] as const)(
    'stays on the operator button of a number cell that a choice of between remounts, %s',
    (_, choose) => {
      render(<Orders defaultFilter={{ columns: { qty: { operator: '>', value: 12 } } }} />);
      click(operatorButton('Greater than'));
      act(() => radio('Between').focus());
      choose(radio('Between'));
      expect(document.activeElement).not.toBe(document.body);
      expect(operatorButton('Between')).toHaveFocus();
      // And back to a typed cell.
      click(operatorButton('Between'));
      act(() => radio('Less than').focus());
      choose(radio('Less than'));
      expect(operatorButton('Less than', qty().closest('td')!)).toHaveFocus();
    },
  );

  it('stays on the operator button of a date cell that a choice of between remounts', () => {
    render(<Orders defaultFilter={{ columns: { placed: { value: '2026-11-05' } } }} />);
    const cell = () => placed().closest('td')!;
    click(operatorButton('Equals', cell()));
    act(() => radio('Between').focus());
    act(() => radio('Between').click());
    const between = within(document.body).getAllByRole('button', { name: 'Operator: Between' });
    expect(between).toHaveLength(1);
    expect(between[0]).toHaveFocus();
    click(between[0]!);
    act(() => radio('Equals').focus());
    act(() => radio('Equals').click());
    expect(
      operatorButton(
        'Equals',
        screen.getByRole('textbox', { name: 'Filter Placed' }).closest('td')!,
      ),
    ).toHaveFocus();
  });

  it('gives the focus back to the button after Esc and after a close the browser makes', () => {
    render(<Orders />);
    const button = () => operatorButton('Equals', qty().closest('td')!);
    click(button());
    expect(radio('Equals')).toHaveFocus();
    press(radio('Equals'), 'Escape');
    // The browser's own close on Esc: `beforetoggle`, then `toggle`.
    act(() => {
      menu()!.dispatchEvent(Object.assign(new Event('beforetoggle'), { newState: 'closed' }));
      showing.delete(menu()!);
      menu()!.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'closed' }));
    });
    expect(button()).toHaveFocus();
    noPopup();
    click(button());
    act(() => {
      menu()!.dispatchEvent(Object.assign(new Event('beforetoggle'), { newState: 'closed' }));
      showing.delete(menu()!);
      menu()!.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'closed' }));
    });
    expect(button()).toHaveFocus();
  });

  it('closes the operator menu of a column that is hidden, and does not open it again when it is shown', () => {
    const { rerender } = render(
      <Orders columnLayout={columnLayout([])} onColumnLayoutChange={() => {}} />,
    );
    click(operatorButton('Equals', qty().closest('td')!));
    expect(showing.size).toBe(1);
    rerender(<Orders columnLayout={columnLayout(['qty'])} onColumnLayoutChange={() => {}} />);
    noPopup();
    expect(document.activeElement).not.toBe(document.body);
    rerender(<Orders columnLayout={columnLayout([])} onColumnLayoutChange={() => {}} />);
    noPopup();
  });

  it('does not open the operator menu again when filterRow is turned off and on with it open', () => {
    const { rerender } = render(<Orders />);
    click(operatorButton('Equals', qty().closest('td')!));
    expect(showing.size).toBe(1);
    rerender(<Orders filterRow={false} />);
    rerender(<Orders filterRow />);
    noPopup();
  });

  it('does not open the filter popover again when both features are turned off and on with it open', () => {
    const { rerender } = render(
      <Orders defaultFilter={{ columns: { qty: { operator: 'between' } } }} />,
    );
    click(range());
    expect(showing.size).toBe(1);
    rerender(
      <Orders filterRow={false} defaultFilter={{ columns: { qty: { operator: 'between' } } }} />,
    );
    rerender(<Orders defaultFilter={{ columns: { qty: { operator: 'between' } } }} />);
    noPopup();
  });

  it('closes the range popover when the operator stops being between from outside, focus to the button', () => {
    const ref = createRef<DataGridHandle>();
    render(
      <Orders
        gridRef={ref}
        defaultFilter={{ columns: { qty: { operator: 'between', value: [5, 9] } } }}
      />,
    );
    click(range());
    expect(showing.size).toBe(1);
    expect(editor('From')).toHaveFocus();
    act(() => ref.current!.clearFilter());
    noPopup();
    expect(operatorButton('Equals', qty().closest('td')!)).toHaveFocus();
  });
});

// One rule for a field whose text cannot be read: the range editor refuses it (as it does for a number), and
// the date cell drops its condition for it, as the number cell does.
describe('a date whose text is no date', () => {
  const placedRange = () => screen.getByRole('combobox', { name: 'Filter Placed' });
  const between = { columns: { placed: { operator: 'between' as const } } };

  it('is refused by OK in a range: the popover stays open, the focus is on that end, nothing applies', async () => {
    const onFilterChange = vi.fn();
    render(<Orders defaultFilter={between} onFilterChange={onFilterChange} />);
    click(placedRange());
    type(editor('From'), '11/05/2026');
    leave(editor('From'));
    type(editor('To'), 'not a day');
    leave(editor('To'));
    await aTaskLater();
    fireEvent.click(button('OK'));
    await aTaskLater();
    expect(showing.has(popover())).toBe(true);
    expect(editor('To')).toHaveFocus();
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it('is refused by Enter in that end, which keeps the popover open and the focus on it', async () => {
    const onFilterChange = vi.fn();
    render(<Orders defaultFilter={between} onFilterChange={onFilterChange} />);
    click(placedRange());
    act(() => editor('From').focus());
    type(editor('From'), 'not a day');
    press(editor('From'), 'Enter');
    await aTaskLater();
    expect(showing.has(popover())).toBe(true);
    expect(editor('From')).toHaveFocus();
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it('takes the condition of the cell away, once, and leaves the text and its fault in the field', async () => {
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { placed: { value: '2026-11-05' } } }}
        onFilterChange={onFilterChange}
      />,
    );
    expect(ids()).toEqual(['DH-2']);
    type(placed(), 'not a day');
    leave(placed());
    await aTaskLater();
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({});
    expect(ids()).toHaveLength(4);
    expect(placed()).toHaveValue('not a day');
    expect(placed()).toHaveAttribute('aria-invalid', 'true');
    // Leaving it again, or Enter, drops nothing more.
    leave(placed());
    press(placed(), 'Enter');
    await aTaskLater();
    expect(onFilterChange).toHaveBeenCalledTimes(1);
  });

  it('touches nothing when the cell had no condition, and a day typed after it applies', async () => {
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    type(placed(), 'not a day');
    leave(placed());
    await aTaskLater();
    expect(onFilterChange).not.toHaveBeenCalled();
    type(placed(), '11/06/2026');
    leave(placed());
    await aTaskLater();
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({
      columns: { placed: { value: '2026-11-06' } },
    });
  });

  it('applies the day it had again when that very day is typed after the text that was no day', async () => {
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { placed: { operator: '>=', value: '2026-11-05' } } }}
        onFilterChange={onFilterChange}
      />,
    );
    type(placed(), 'not a day');
    leave(placed());
    await aTaskLater();
    expect(ids()).toHaveLength(4);
    type(placed(), '11/05/2026');
    leave(placed());
    await aTaskLater();
    expect(lastFilter(onFilterChange)).toEqual({
      columns: { placed: { operator: '>=', value: '2026-11-05' } },
    });
    expect(ids()).toEqual(['DH-2', 'DH-3', 'DH-4']);
  });
});

describe('a clear while a date cell holds text that is no day', () => {
  const held = {
    columns: { placed: { value: '2026-11-05' }, qty: { operator: '>' as const, value: 1 } },
  };

  async function dropped(
    onFilterChange: ReturnType<typeof vi.fn>,
    props: Partial<DataGridProps<Order>>,
  ) {
    render(<Orders defaultFilter={held} onFilterChange={onFilterChange} {...props} />);
    type(placed(), 'zz');
    leave(placed());
    await aTaskLater();
    // The condition of the day is dropped, the text and its fault stay.
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({
      columns: { qty: { operator: '>', value: 1 } },
    });
    expect(placed()).toHaveAttribute('aria-invalid', 'true');
  }

  async function cleared(onFilterChange: ReturnType<typeof vi.fn>) {
    await aTaskLater();
    expect(placed()).toHaveValue('');
    expect(placed()).not.toHaveAttribute('aria-invalid', 'true');
    expect(onFilterChange).toHaveBeenCalledTimes(2);
    expect(lastFilter(onFilterChange)).toEqual({});
    // No condition comes back from the day that was dropped.
    expect(ids()).toHaveLength(4);
  }

  it('is taken by the panel’s Clear filter: the field is empty and not invalid', async () => {
    const onFilterChange = vi.fn();
    await dropped(onFilterChange, { filterPanel: true });
    fireEvent.click(screen.getByRole('button', { name: 'Clear filter' }));
    await cleared(onFilterChange);
  });

  it('is taken by clearFilter() of the handle too', async () => {
    const onFilterChange = vi.fn();
    const ref = createRef<DataGridHandle>();
    await dropped(onFilterChange, { gridRef: ref });
    act(() => ref.current!.clearFilter());
    await cleared(onFilterChange);
  });
});

describe('Esc in a date cell', () => {
  it('clears the text and applies, and the next Esc, with no text, is the grid’s', () => {
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { placed: { value: '2026-11-05' } } }}
        onFilterChange={onFilterChange}
      />,
    );
    act(() => placed().focus());
    expect(press(placed(), 'Escape')).toBe(true);
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({});
    expect(placed()).toHaveValue('');
    expect(placed()).toHaveFocus();
    expect(ids()).toHaveLength(4);
    // The grid takes it: the focus goes from the input to its cell.
    const cell = placed().closest('td')!;
    press(placed(), 'Escape');
    expect(cell).toHaveFocus();
    expect(onFilterChange).toHaveBeenCalledTimes(1);
  });

  it('clears text that is no day too, with nothing to apply', () => {
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    act(() => placed().focus());
    type(placed(), 'not a day');
    expect(press(placed(), 'Escape')).toBe(true);
    expect(placed()).toHaveValue('');
    expect(onFilterChange).not.toHaveBeenCalled();
  });
});

describe('a range whose ends are read but inverted', () => {
  it('is applied as typed: the cell says it, and the grid says no row matches', () => {
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { qty: { operator: 'between' } } }}
        onFilterChange={onFilterChange}
      />,
    );
    click(range());
    type(editor('From'), '21');
    type(editor('To'), '12');
    fireEvent.click(button('OK'));
    expect(lastFilter(onFilterChange)).toEqual({
      columns: { qty: { operator: 'between', value: [21, 12] } },
    });
    expect(range()).toHaveValue('21 – 12');
    expect(screen.getByText('No rows match the filter')).toBeInTheDocument();
  });
});
