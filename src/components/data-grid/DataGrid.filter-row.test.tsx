import { act, createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridFilter, DataGridProps, DataGridState } from './index';
import { FILTER_DELAY } from './parts/FilterCell';

// The filter row (spec phase 6 §3.6, §4.3 F1 "Hàng lọc", §6.3 "Lọc"): its structure, the text, boolean and
// lookup cells, the operator button and the one menu of the grid, and the keys that reach it. What needs a
// layout engine or the top layer to be true (the sizes, the menu under its button, a sticky row, the
// focus after a popup closes in each engine) is proven in the stories (`DataGridFiltering.stories.tsx`).

// How many times a popover was shown, and which are showing: jsdom has no Popover API.
let showing: Set<Element>;
beforeEach(() => {
  resetDevWarnings();
  showing = new Set();
  // jsdom has no layout, so every element would count as hidden to the code that looks for the
  // controls of a cell.
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
  customer: string;
  paid: boolean;
  status: number;
  qty: number;
}

const STATUS = {
  items: [
    { id: 1, name: 'New' },
    { id: 2, name: 'Done' },
    { id: 3, name: 'Cancelled' },
  ],
  valueField: 'id',
  displayField: 'name',
};

const ORDERS: Order[] = [
  { id: 'DH-1', customer: 'Công ty Minh Phát', paid: true, status: 1, qty: 3 },
  { id: 'DH-2', customer: 'Nguyễn Minh Anh', paid: false, status: 2, qty: 12 },
  { id: 'DH-3', customer: 'Lê Quang Huy', paid: true, status: 2, qty: 21 },
  { id: 'DH-4', customer: 'Đường Sắt', paid: false, status: 3, qty: 4 },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104, allowFiltering: false },
  { field: 'customer', caption: 'Customer', width: 200 },
  { field: 'paid', caption: 'Paid', dataType: 'boolean', width: 90 },
  { field: 'status', caption: 'Status', width: 120, lookup: STATUS },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
];

function Orders(props: Partial<DataGridProps<Order>>) {
  return (
    <DataGrid
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
  onChange,
  start = {},
  ...props
}: Partial<DataGridProps<Order>> & {
  onChange?: (filter: DataGridFilter) => void;
  start?: DataGridFilter;
}) {
  const [filter, setFilter] = useState(start);
  return (
    <>
      <button type="button" onClick={() => setFilter({ columns: { customer: { value: 'huy' } } })}>
        set outside
      </button>
      <Orders
        filter={filter}
        onFilterChange={(next) => {
          onChange?.(next);
          setFilter(next);
        }}
        {...props}
      />
    </>
  );
}

const grid = () => screen.getByRole('grid') as HTMLTableElement;
const headRows = () => Array.from(grid().tHead!.rows);
const filterRow = () => headRows()[1]!;
// The cells of the filter row, the filler column's not counted.
const filterCells = () =>
  Array.from(filterRow().cells).filter((cell) => !cell.classList.contains('flg-data-grid-filler'));
const filterCell = (index: number) => filterCells()[index]!;
const CUSTOMER = 1;
const PAID = 2;
const STATUS_AT = 3;
const QTY = 4;
const title = (caption: string) =>
  Array.from(grid().querySelectorAll<HTMLElement>('thead > tr:first-child > th')).find((th) =>
    th.textContent?.startsWith(caption),
  )!;
const input = () => screen.getByRole('textbox', { name: 'Filter Customer' }) as HTMLInputElement;
const operatorButton = (name = 'Operator: Contains') =>
  screen.getByRole('button', { name }) as HTMLButtonElement;
const menu = () => document.querySelector<HTMLElement>('.flg-data-grid-operator-menu');
const radios = () =>
  Array.from(menu()?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? []);
const radio = (name: string) => radios().find((item) => item.textContent === name)!;
const bodyRows = () => Array.from(grid().querySelectorAll<HTMLElement>('tbody > tr'));
const customers = () => bodyRows().map((row) => row.children[1]!.textContent);
const stops = () => Array.from(grid().querySelectorAll<HTMLElement>('[tabindex="0"]'));
const focusOn = (element: HTMLElement) => act(() => element.focus());
/** A key pressed on `element`; true when it was cancelled. */
const press = (element: HTMLElement, key: string, init: KeyboardEventInit = {}): boolean => {
  const event = createEvent.keyDown(element, { key, bubbles: true, cancelable: true, ...init });
  act(() => {
    fireEvent(element, event);
  });
  return event.defaultPrevented;
};
const type = (text: string) => fireEvent.change(input(), { target: { value: text } });
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
/** The listbox option of a Select in a cell (the native `<select>` has one of the same name). */
const option = (cell: HTMLElement, name: string) =>
  within(cell)
    .getAllByRole('option', { name, hidden: true })
    .find((candidate) => candidate.id !== '')!;
/** A press and a click on a button, as a mouse makes them. */
function click(button: HTMLElement) {
  fireEvent.pointerDown(button, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 });
  fireEvent.mouseDown(button);
  fireEvent.pointerUp(button, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 });
  fireEvent.click(button, { detail: 1 });
}
const lastFilter = (spy: ReturnType<typeof vi.fn>) => spy.mock.calls.at(-1)?.[0];

describe('the filter row', () => {
  it('is not drawn without filterRow, and a filterRow that is not true is false', () => {
    const { rerender } = render(<Orders filterRow={false} />);
    expect(headRows()).toHaveLength(1);
    rerender(<Orders filterRow={'yes' as unknown as boolean} />);
    expect(headRows()).toHaveLength(1);
    rerender(<Orders filterRow />);
    expect(headRows()).toHaveLength(2);
  });

  it('is the second row of the heading, with the classes of a row and of a cell', () => {
    render(<Orders />);
    expect(filterRow()).toHaveClass('flg-table-row', 'flg-data-grid-filter-row');
    expect(headRows()[0]).not.toHaveClass('flg-data-grid-filter-row');
    expect(filterCells()).toHaveLength(COLUMNS.length);
    for (const cell of filterCells()) {
      expect(cell.tagName).toBe('TD');
      expect(cell).toHaveClass('flg-table-cell', 'flg-data-grid-filter-cell');
    }
    // The title row stays the first row: the titles are its cells.
    expect(title('Customer')).toBeInTheDocument();
  });

  it('has a cell for each shown column in the order of the columns, and follows a hidden one', () => {
    const { rerender } = render(<Orders />);
    expect(
      filterCells().map((cell) => cell.querySelector('input, [role="combobox"]') !== null),
    ).toEqual([false, true, true, true, true]);
    rerender(
      <Orders
        columnLayout={{
          order: ['qty', 'customer', 'paid', 'status', 'id'],
          widths: {},
          hidden: ['paid'],
          pinned: {},
        }}
        onColumnLayoutChange={() => {}}
      />,
    );
    expect(filterCells()).toHaveLength(4);
    // Qty is first now, and a number has its input.
    expect(filterCell(0).querySelector('input')).not.toBeNull();
    expect(filterCell(1).querySelector('input')).not.toBeNull();
  });

  it('carries the alignment and the pin of its column, as its title does', () => {
    render(
      <Orders
        columns={[
          { ...COLUMNS[0]!, pinned: 'left' },
          { ...COLUMNS[1]! },
          { ...COLUMNS[4]!, align: 'end', pinned: 'right' },
        ]}
      />,
    );
    expect(filterCell(0)).toHaveAttribute('data-pinned', 'left');
    expect(filterCell(0)).toHaveAttribute('data-pin-edge');
    expect(filterCell(2)).toHaveAttribute('data-pinned', 'right');
    expect(filterCell(2)).toHaveAttribute('data-align', 'end');
    expect(filterCell(1)).not.toHaveAttribute('data-pinned');
  });

  it('has a service cell with no content for the column of boxes, and the filler column its own cell', () => {
    render(<Orders selectionMode="multiple" />);
    const service = filterCells()[0]!;
    expect(service).toHaveAttribute('data-service');
    expect(service).toBeEmptyDOMElement();
    const filler = filterRow().querySelector('.flg-data-grid-filler')!;
    expect(filler).toBeInTheDocument();
    expect(filler).toHaveAttribute('aria-hidden', 'true');
    expect(filler).not.toHaveAttribute('tabindex');
    // The filler stands where the title row has it.
    const at = (row: HTMLTableRowElement) =>
      Array.from(row.cells).findIndex((cell) => cell.classList.contains('flg-data-grid-filler'));
    expect(at(filterRow())).toBe(at(headRows()[0]!));
  });

  it('has an empty cell for a column that does not filter, and allowFiltering of the grid is the default', () => {
    const { rerender } = render(<Orders />);
    expect(filterCell(0)).toBeEmptyDOMElement();
    expect(filterCell(CUSTOMER)).not.toBeEmptyDOMElement();
    rerender(<Orders allowFiltering={false} />);
    for (const cell of filterCells()) expect(cell).toBeEmptyDOMElement();
    // The column's own `allowFiltering` wins over the grid's.
    rerender(
      <Orders
        allowFiltering={false}
        columns={COLUMNS.map((column) =>
          column.caption === 'Customer' ? { ...column, allowFiltering: true } : column,
        )}
      />,
    );
    expect(filterCell(CUSTOMER).querySelector('input')).not.toBeNull();
    expect(filterCell(PAID)).toBeEmptyDOMElement();
  });

  it('draws a Select for a boolean and for a lookup and an input for a number', () => {
    render(<Orders />);
    expect(
      within(filterCell(PAID)).getByRole('combobox', { name: 'Filter Paid' }),
    ).toBeInTheDocument();
    expect(
      within(filterCell(STATUS_AT)).getByRole('combobox', { name: 'Filter Status' }),
    ).toBeInTheDocument();
    expect(
      within(filterCell(QTY)).getByRole('textbox', { name: 'Filter Qty' }),
    ).toBeInTheDocument();
  });

  it('draws the same markup on the server as on the client', async () => {
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(
      <Orders defaultFilter={{ columns: { customer: { value: 'huy' } } }} />,
    );
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelectorAll('thead > tr')).toHaveLength(2);
    expect(
      doc
        .querySelector<HTMLInputElement>('.flg-data-grid-filter-cell input')!
        .getAttribute('value'),
    ).toBe('huy');
  });

  it('is the second row for a screen reader of a grid whose rows are all drawn, with no row index', () => {
    render(<Orders />);
    expect(grid()).not.toHaveAttribute('aria-rowcount');
    expect(filterRow()).not.toHaveAttribute('aria-rowindex');
  });
});

describe('a text cell', () => {
  it('is an input named after its column, with the operator button before it, and shows the held text', () => {
    render(<Orders defaultFilter={{ columns: { customer: { value: 'công ty' } } }} />);
    expect(input()).toHaveValue('công ty');
    const frame = input().closest('.flg-input')!;
    expect(frame).toHaveAttribute('data-size', 'sm');
    expect(frame.querySelector('.flg-input-adornment')).toContainElement(operatorButton());
    // The input comes after the adornment, which is what the cell's own padding makes room for.
    expect(frame.firstElementChild).toHaveClass('flg-input-adornment');
  });

  it('applies the text 400 ms after the last key, once, and nothing before', () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    type('c');
    advance(FILTER_DELAY - 1);
    type('cô');
    advance(FILTER_DELAY - 1);
    type('công');
    advance(FILTER_DELAY - 1);
    expect(onFilterChange).not.toHaveBeenCalled();
    expect(customers()).toHaveLength(4);
    advance(1);
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(lastFilter(onFilterChange)).toEqual({ columns: { customer: { value: 'công' } } });
    expect(customers()).toEqual(['Công ty Minh Phát']);
    advance(5000);
    expect(onFilterChange).toHaveBeenCalledTimes(1);
  });

  it('sends nothing while an input method composes, and sends once FILTER_DELAY after it ends', () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    fireEvent.compositionStart(input());
    type('c');
    type('cô');
    advance(FILTER_DELAY * 3);
    expect(onFilterChange).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input());
    advance(FILTER_DELAY - 1);
    expect(onFilterChange).not.toHaveBeenCalled();
    advance(1);
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({
      columns: { customer: { value: 'cô' } },
    });
  });

  it('drops the text that waits for the button that clears the filter, and sends nothing more', () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { qty: { operator: '>', value: 99 } } }}
        onFilterChange={onFilterChange}
      />,
    );
    type('minh');
    advance(FILTER_DELAY - 100);
    fireEvent.click(screen.getByRole('button', { name: 'Clear filter' }));
    expect(input()).toHaveValue('');
    advance(FILTER_DELAY * 3);
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({});
  });

  it('keeps the operator the user chose when the text goes on', () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { customer: { operator: 'startsWith' } } }}
        onFilterChange={onFilterChange}
      />,
    );
    type('le');
    advance(FILTER_DELAY);
    expect(lastFilter(onFilterChange)).toEqual({
      columns: { customer: { operator: 'startsWith', value: 'le' } },
    });
  });

  it('applies at once on Enter, and the timer does not apply it a second time', () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    focusOn(input());
    type('huy');
    press(input(), 'Enter');
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(lastFilter(onFilterChange)).toEqual({ columns: { customer: { value: 'huy' } } });
    advance(FILTER_DELAY * 2);
    expect(onFilterChange).toHaveBeenCalledTimes(1);
  });

  it('does not take the Enter of an input method that confirms a candidate', () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    focusOn(input());
    type('huy');
    press(input(), 'Enter', { isComposing: true });
    expect(onFilterChange).not.toHaveBeenCalled();
    advance(FILTER_DELAY);
    expect(onFilterChange).toHaveBeenCalledTimes(1);
  });

  it('does not let the Enter that applies a text, or a number, submit a form around the grid', async () => {
    const onSubmit = vi.fn((event: { preventDefault(): void }) => event.preventDefault());
    const onFilterChange = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <Orders onFilterChange={onFilterChange} />
        <button type="submit">Send</button>
      </form>,
    );
    const user = userEvent.setup();
    await user.click(input());
    await user.keyboard('huy{Enter}');
    const qty = screen.getByRole('textbox', { name: 'Filter Qty' });
    await user.click(qty);
    await user.keyboard('5{Enter}');
    expect(onFilterChange).toHaveBeenCalledTimes(2);
    expect(onSubmit).not.toHaveBeenCalled();
    // The Enter of an input method that confirms a candidate is the method's: it is left alone.
    expect(press(input(), 'Enter', { isComposing: true })).toBe(false);
    expect(press(input(), 'Enter')).toBe(true);
    expect(press(qty, 'Enter')).toBe(true);
  });

  it('applies at once when the input is left', () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    focusOn(input());
    type('huy');
    expect(onFilterChange).not.toHaveBeenCalled();
    focusOn(operatorButton());
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    advance(FILTER_DELAY);
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    // Leaving with nothing pending says nothing.
    focusOn(title('Customer'));
    expect(onFilterChange).toHaveBeenCalledTimes(1);
  });

  it('takes the condition away when the text is emptied', () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { customer: { value: 'huy' } } }}
        onFilterChange={onFilterChange}
      />,
    );
    type('');
    advance(FILTER_DELAY);
    expect(lastFilter(onFilterChange)).toEqual({});
    expect(customers()).toHaveLength(4);
  });

  it("clears its text on Esc and applies that at once, and the next Esc is the grid's", () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    focusOn(input());
    type('huy');
    advance(FILTER_DELAY);
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    // The first Esc: it clears what the input holds, which the grid does not take (it was cancelled).
    expect(press(input(), 'Escape')).toBe(true);
    expect(input()).toHaveValue('');
    expect(onFilterChange).toHaveBeenCalledTimes(2);
    expect(lastFilter(onFilterChange)).toEqual({});
    expect(input()).toHaveFocus();
    // The second has no text to clear: it is the grid's, which goes back to the cell.
    expect(press(input(), 'Escape')).toBe(true);
    expect(filterCell(CUSTOMER)).toHaveFocus();
    expect(onFilterChange).toHaveBeenCalledTimes(2);
  });

  it('clears a text that has not been applied yet on Esc, and applies nothing but the clear', () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    focusOn(input());
    type('huy');
    press(input(), 'Escape');
    expect(input()).toHaveValue('');
    advance(FILTER_DELAY * 2);
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it('replaces its text with a condition that changed from outside, and drops the timer', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<Held onChange={onChange} />);
    type('abc');
    fireEvent.click(screen.getByText('set outside'));
    expect(input()).toHaveValue('huy');
    advance(FILTER_DELAY * 2);
    expect(onChange).not.toHaveBeenCalled();
    expect(customers()).toEqual(['Lê Quang Huy']);
  });

  it('drops its timer when the grid goes away', () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    const { unmount } = render(<Orders onFilterChange={onFilterChange} />);
    type('huy');
    unmount();
    advance(FILTER_DELAY * 2);
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it('says what the user typed to onStateChange once, with the filter', () => {
    vi.useFakeTimers();
    const onStateChange = vi.fn<(state: DataGridState, changed: string) => void>();
    render(<Orders onStateChange={onStateChange} />);
    type('huy');
    advance(FILTER_DELAY);
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange.mock.calls[0]![1]).toBe('filter');
    expect(onStateChange.mock.calls[0]![0].filter).toEqual({
      columns: { customer: { value: 'huy' } },
    });
  });
});

describe('a Select cell', () => {
  it('shows "(All)" for no condition and offers it as the first item, then the two words of a boolean', () => {
    render(<Orders />);
    const trigger = within(filterCell(PAID)).getByRole('combobox', { name: 'Filter Paid' });
    expect(trigger).toHaveTextContent('(All)');
    const names = within(filterCell(PAID))
      .getAllByRole('option', { hidden: true })
      .filter((candidate) => candidate.id !== '')
      .map((candidate) => candidate.textContent);
    expect(names).toEqual(['(All)', 'Yes', 'No']);
  });

  it('applies a boolean at once with "="; and "(All)" takes the condition away', () => {
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    fireEvent.click(option(filterCell(PAID), 'No'));
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(lastFilter(onFilterChange)).toEqual({
      columns: { paid: { operator: '=', value: false } },
    });
    expect(customers()).toEqual(['Nguyễn Minh Anh', 'Đường Sắt']);
    expect(within(filterCell(PAID)).getByRole('combobox')).toHaveTextContent('No');
    fireEvent.click(option(filterCell(PAID), '(All)'));
    expect(onFilterChange).toHaveBeenCalledTimes(2);
    expect(lastFilter(onFilterChange)).toEqual({});
    expect(customers()).toHaveLength(4);
    expect(within(filterCell(PAID)).getByRole('combobox')).toHaveTextContent('(All)');
  });

  it('keeps the value of a lookup as the lookup holds it, a number here', () => {
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    fireEvent.click(option(filterCell(STATUS_AT), 'Done'));
    expect(lastFilter(onFilterChange)).toEqual({
      columns: { status: { operator: '=', value: 2 } },
    });
    expect(customers()).toEqual(['Nguyễn Minh Anh', 'Lê Quang Huy']);
    expect(within(filterCell(STATUS_AT)).getByRole('combobox')).toHaveTextContent('Done');
  });

  it('shows the item of the held value, and "(All)" for a value no item has', () => {
    const { rerender } = render(
      <Orders defaultFilter={{ columns: { paid: { value: true }, status: { value: 99 } } }} />,
    );
    expect(within(filterCell(PAID)).getByRole('combobox')).toHaveTextContent('Yes');
    expect(within(filterCell(STATUS_AT)).getByRole('combobox')).toHaveTextContent('(All)');
    rerender(<Orders filter={{ columns: { status: { value: 3 } } }} />);
    expect(within(filterCell(STATUS_AT)).getByRole('combobox')).toHaveTextContent('Cancelled');
    expect(within(filterCell(PAID)).getByRole('combobox')).toHaveTextContent('(All)');
  });

  it('has no operator button', () => {
    render(<Orders />);
    expect(within(filterCell(PAID)).queryByRole('button', { name: /Operator/ })).toBeNull();
    expect(within(filterCell(STATUS_AT)).queryByRole('button', { name: /Operator/ })).toBeNull();
  });

  it('words its items from the labels', () => {
    render(<Orders labels={{ all: 'Tất cả', yes: 'Có', no: 'Không' }} />);
    expect(within(filterCell(PAID)).getByRole('combobox')).toHaveTextContent('Tất cả');
    expect(option(filterCell(PAID), 'Có')).toBeInTheDocument();
    expect(option(filterCell(PAID), 'Không')).toBeInTheDocument();
  });
});

describe('the operator button', () => {
  it('is named after the operator, closed, and has a menu', () => {
    render(<Orders />);
    const button = operatorButton();
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).not.toHaveAttribute('aria-controls');
    expect(button).toHaveClass('flg-data-grid-operator');
    expect(button).not.toHaveAttribute('data-active');
    expect(button.querySelector('svg')).not.toBeNull();
  });

  it('is accented only while the row condition of the column filters', () => {
    const { rerender } = render(
      <Orders defaultFilter={{ columns: { customer: { value: 'công ty' } } }} />,
    );
    expect(operatorButton()).toHaveAttribute('data-active');
    // An operator with no value filters nothing.
    rerender(<Orders filter={{ columns: { customer: { operator: 'startsWith' } } }} />);
    expect(operatorButton('Operator: Starts with')).not.toHaveAttribute('data-active');
    // A value the column cannot read, and an operator it does not offer, filter nothing.
    rerender(<Orders filter={{ columns: { customer: { value: 5 } } }} />);
    expect(operatorButton()).not.toHaveAttribute('data-active');
    rerender(<Orders filter={{ columns: { customer: { operator: '>', value: 'x' } } }} />);
    expect(operatorButton()).not.toHaveAttribute('data-active');
    // The header condition of the column is another part of it.
    rerender(<Orders filter={{ columns: { customer: { values: ['Đường Sắt'] } } }} />);
    expect(operatorButton()).not.toHaveAttribute('data-active');
  });

  it('opens the menu on a press, names the menu in aria-controls, and a second press closes it', () => {
    render(<Orders />);
    const button = operatorButton();
    click(button);
    expect(menu()).not.toBeNull();
    expect(showing.has(menu()!)).toBe(true);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', menu()!.id);
    // In jsdom there is no light dismiss, so the second press is the one that closes it.
    click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(showing.has(menu()!)).toBe(false);
  });

  it('is the control of its own cell: its press cancels nothing, and the cell becomes the active one', () => {
    render(<Orders />);
    const down = createEvent.mouseDown(operatorButton(), { bubbles: true, cancelable: true });
    fireEvent(operatorButton(), down);
    expect(down.defaultPrevented).toBe(false);
    focusOn(operatorButton());
    expect(stops()).toEqual([filterCell(CUSTOMER)]);
  });

  it('is named by the labels, and the record of operators is merged one level deep', () => {
    render(
      <Orders
        labels={{
          operator: (name) => `Toán tử: ${name}`,
          operators: { contains: 'Chứa' },
        }}
      />,
    );
    const button = screen.getByRole('button', { name: 'Toán tử: Chứa' });
    click(button);
    // The operators the labels leave out keep their defaults.
    expect(radios().map((item) => item.textContent)).toEqual([
      'Chứa',
      'Does not contain',
      'Starts with',
      'Ends with',
      'Equals',
      'Does not equal',
    ]);
  });
});

describe('the operator menu', () => {
  it('is one menu for the grid, and lists the operators of the column of the button, the default first', () => {
    render(<Orders />);
    // The panel is there from the start and holds no item until a button opens it, as the column menu does.
    expect(document.querySelectorAll('.flg-data-grid-operator-menu')).toHaveLength(1);
    expect(radios()).toHaveLength(0);
    expect(showing.size).toBe(0);
    click(operatorButton());
    expect(document.querySelectorAll('.flg-data-grid-operator-menu')).toHaveLength(1);
    expect(menu()).toHaveAttribute('role', 'menu');
    expect(radios().map((item) => item.textContent)).toEqual([
      'Contains',
      'Does not contain',
      'Starts with',
      'Ends with',
      'Equals',
      'Does not equal',
    ]);
    expect(radios().map((item) => item.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
      'false',
      'false',
      'false',
    ]);
    // Each item has its glyph, before the words.
    for (const item of radios()) {
      expect(item.querySelector('.flg-data-grid-operator-icon svg')).not.toBeNull();
      expect(item.querySelector('.flg-data-grid-operator-icon')!.nextSibling).toBe(item.lastChild);
    }
  });

  it('offers only the operators the column narrows to', () => {
    render(
      <Orders
        columns={COLUMNS.map((column) =>
          column.caption === 'Customer'
            ? { ...column, filterOperators: ['=', 'contains'] as const }
            : column,
        )}
      />,
    );
    click(operatorButton());
    expect(radios().map((item) => item.textContent)).toEqual(['Contains', 'Equals']);
  });

  it('checks the operator the filter holds', () => {
    render(<Orders defaultFilter={{ columns: { customer: { operator: 'endsWith' } } }} />);
    click(operatorButton('Operator: Ends with'));
    expect(radio('Ends with')).toHaveAttribute('aria-checked', 'true');
    expect(radio('Contains')).toHaveAttribute('aria-checked', 'false');
  });

  it('is named after the filter of the column', () => {
    render(<Orders />);
    click(operatorButton());
    expect(menu()).toHaveAttribute('aria-label', 'Filter Customer');
  });

  it('opens on the checked item', () => {
    render(<Orders defaultFilter={{ columns: { customer: { operator: 'startsWith' } } }} />);
    click(operatorButton('Operator: Starts with'));
    expect(radio('Starts with')).toHaveFocus();
  });

  it('applies a choice at once, keeps the text, closes, and gives the focus back to the button', () => {
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { customer: { value: 'đường' } } }}
        onFilterChange={onFilterChange}
      />,
    );
    click(operatorButton());
    act(() => radio('Starts with').click());
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(lastFilter(onFilterChange)).toEqual({
      columns: { customer: { operator: 'startsWith', value: 'đường' } },
    });
    expect(customers()).toEqual(['Đường Sắt']);
    expect(operatorButton('Operator: Starts with')).toHaveAttribute('data-active');
    expect(operatorButton('Operator: Starts with')).toHaveAttribute('aria-expanded', 'false');
    expect(operatorButton('Operator: Starts with')).toHaveFocus();
    expect(input()).toHaveValue('đường');
  });

  it('keeps an operator with no value in the state, so the cell shows it, and filters nothing', () => {
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    click(operatorButton());
    act(() => radio('Equals').click());
    expect(lastFilter(onFilterChange)).toEqual({ columns: { customer: { operator: '=' } } });
    // Qty, a number column, has an Equals button of its own, which is not lit.
    for (const button of screen.getAllByRole('button', { name: 'Operator: Equals' })) {
      expect(button).not.toHaveAttribute('data-active');
    }
    expect(
      within(filterCell(CUSTOMER)).getByRole('button', { name: 'Operator: Equals' }),
    ).toBeTruthy();
    expect(customers()).toHaveLength(4);
  });

  it('takes the text that was still waiting for its timer along, since pressing the button leaves the input', () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    focusOn(input());
    type('minh');
    focusOn(operatorButton());
    click(operatorButton());
    act(() => radio('Ends with').click());
    expect(onFilterChange).toHaveBeenCalledTimes(2);
    expect(lastFilter(onFilterChange)).toEqual({
      columns: { customer: { operator: 'endsWith', value: 'minh' } },
    });
  });

  it('says nothing when the chosen operator is the one it already has', () => {
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { customer: { operator: 'endsWith', value: 'x' } } }}
        onFilterChange={onFilterChange}
      />,
    );
    click(operatorButton('Operator: Ends with'));
    act(() => radio('Ends with').click());
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it('is for the column of the button that opened it, and the next button re-points it', () => {
    render(
      <Orders
        columns={[
          { field: 'customer', caption: 'Customer', width: 200 },
          { field: 'id', caption: 'Order', width: 104, filterOperators: ['=', 'startsWith'] },
        ]}
      />,
    );
    const buttons = screen.getAllByRole('button', { name: /^Operator/ });
    click(buttons[0]!);
    expect(radios()).toHaveLength(6);
    act(() => radio('Contains').click());
    click(buttons[1]!);
    expect(menu()).toHaveAttribute('aria-label', 'Filter Order');
    expect(radios().map((item) => item.textContent)).toEqual(['Starts with', 'Equals']);
  });

  it('does not draw a title, and a choice draws no title', () => {
    render(<Orders />);
    const before = title('Customer');
    click(operatorButton());
    act(() => radio('Ends with').click());
    expect(title('Customer')).toBe(before);
  });
});

describe('the keys across the heading and the rows', () => {
  it('goes up from the first row to the filter row, then to the titles, and back down, keeping the column', () => {
    render(<Orders />);
    const first = bodyRows()[0]!.children[CUSTOMER] as HTMLElement;
    focusOn(first);
    expect(press(first, 'ArrowUp')).toBe(true);
    expect(filterCell(CUSTOMER)).toHaveFocus();
    expect(stops()).toEqual([filterCell(CUSTOMER)]);
    press(filterCell(CUSTOMER), 'ArrowUp');
    expect(title('Customer')).toHaveFocus();
    expect(stops()).toEqual([title('Customer')]);
    // Up from the titles goes nowhere.
    press(title('Customer'), 'ArrowUp');
    expect(title('Customer')).toHaveFocus();
    press(title('Customer'), 'ArrowDown');
    expect(filterCell(CUSTOMER)).toHaveFocus();
    press(filterCell(CUSTOMER), 'ArrowDown');
    expect(first).toHaveFocus();
  });

  it('moves along the filter row, and Home and End go to its ends', () => {
    render(<Orders />);
    focusOn(filterCell(CUSTOMER));
    press(filterCell(CUSTOMER), 'ArrowRight');
    expect(filterCell(PAID)).toHaveFocus();
    press(filterCell(PAID), 'End');
    expect(filterCell(QTY)).toHaveFocus();
    press(filterCell(QTY), 'ArrowRight');
    expect(filterCell(QTY)).toHaveFocus();
    press(filterCell(QTY), 'Home');
    expect(filterCell(0)).toHaveFocus();
  });

  it('keeps its rows for PageUp, mod+Home and mod+End', () => {
    render(<Orders />);
    focusOn(filterCell(CUSTOMER));
    press(filterCell(CUSTOMER), 'End', { ctrlKey: true });
    expect(bodyRows().at(-1)!.children[QTY]).toHaveFocus();
    press(bodyRows().at(-1)!.children[QTY] as HTMLElement, 'Home', { ctrlKey: true });
    expect(bodyRows()[0]!.children[0]).toHaveFocus();
    press(bodyRows()[0]!.children[0] as HTMLElement, 'PageUp');
    expect(bodyRows()[0]!.children[0]).toHaveFocus();
  });

  it('has the one Tab stop: no control of the filter row can be tabbed to, and a press on one makes its cell the stop', () => {
    render(<Orders />);
    expect(stops()).toEqual([bodyRows()[0]!.children[0]]);
    const controls = filterRow().querySelectorAll<HTMLElement>('input, button, [role="combobox"]');
    expect(controls.length).toBeGreaterThanOrEqual(4);
    for (const control of controls) expect(control.getAttribute('tabindex')).toBe('-1');
    focusOn(input());
    expect(stops()).toEqual([filterCell(CUSTOMER)]);
    expect(filterCell(CUSTOMER).getAttribute('tabindex')).toBe('0');
  });

  it('has the Tab stop at the first body cell when nothing was chosen, with a filter row too', () => {
    render(<Orders selectionMode="multiple" />);
    expect(stops()).toHaveLength(1);
    expect(stops()[0]!.closest('tbody')).not.toBeNull();
  });

  it('goes into the value control on Enter and on F2, not into the operator', () => {
    render(<Orders />);
    focusOn(filterCell(CUSTOMER));
    expect(press(filterCell(CUSTOMER), 'Enter')).toBe(true);
    expect(input()).toHaveFocus();
    press(input(), 'Escape');
    expect(filterCell(CUSTOMER)).toHaveFocus();
    press(filterCell(CUSTOMER), 'F2');
    expect(input()).toHaveFocus();
    press(input(), 'F2');
    expect(filterCell(CUSTOMER)).toHaveFocus();
    // A Select's trigger is its value control.
    focusOn(filterCell(PAID));
    press(filterCell(PAID), 'Enter');
    expect(within(filterCell(PAID)).getByRole('combobox')).toHaveFocus();
  });

  it('cycles the controls of the cell on Tab, and Esc comes back to the cell', () => {
    render(<Orders />);
    focusOn(input());
    expect(press(input(), 'Tab')).toBe(true);
    expect(operatorButton()).toHaveFocus();
    expect(press(operatorButton(), 'Tab')).toBe(true);
    expect(input()).toHaveFocus();
    press(input(), 'Tab', { shiftKey: true });
    expect(operatorButton()).toHaveFocus();
    press(operatorButton(), 'Escape');
    expect(filterCell(CUSTOMER)).toHaveFocus();
    expect(stops()).toEqual([filterCell(CUSTOMER)]);
  });

  it('does nothing on a printable key or Space of the cell, and Enter of a cell with no control', () => {
    render(<Orders />);
    focusOn(filterCell(CUSTOMER));
    expect(press(filterCell(CUSTOMER), 'a')).toBe(false);
    expect(input()).toHaveValue('');
    // Space would scroll the page a screen down with the focus on a heading cell.
    expect(press(filterCell(CUSTOMER), ' ')).toBe(true);
    focusOn(filterCell(0));
    expect(press(filterCell(0), 'Enter')).toBe(false);
    expect(filterCell(0)).toHaveFocus();
  });

  it('does not sort, resize, move or open the column menu from the filter row', () => {
    const onSortChange = vi.fn();
    const onColumnLayoutChange = vi.fn();
    render(<Orders onSortChange={onSortChange} onColumnLayoutChange={onColumnLayoutChange} />);
    const cell = filterCell(CUSTOMER);
    focusOn(cell);
    press(cell, 'ArrowRight', { altKey: true, shiftKey: true });
    press(cell, 'ArrowLeft', { ctrlKey: true, shiftKey: true });
    press(cell, 'ArrowDown', { altKey: true });
    press(cell, 'F10', { shiftKey: true });
    expect(onSortChange).not.toHaveBeenCalled();
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    expect(
      document.querySelector(
        '.flg-data-grid-column-menu[open], .flg-data-grid-column-menu:popover-open',
      ),
    ).toBeNull();
    // Enter on a title still sorts.
    focusOn(title('Customer'));
    press(title('Customer'), 'Enter');
    expect(onSortChange).toHaveBeenCalledTimes(1);
  });

  it('keeps the keys of the titles on the titles: Enter sorts, and a title is the cell a column menu opens from', () => {
    render(<Orders />);
    focusOn(title('Customer'));
    press(title('Customer'), 'ArrowDown', { altKey: true });
    expect(document.querySelector('.flg-data-grid-column-menu')?.getAttribute('aria-label')).toBe(
      'Customer column menu',
    );
  });

  it('goes to the title of the column when the filter row is turned off under its active cell', () => {
    const { rerender } = render(<Orders />);
    focusOn(filterCell(CUSTOMER));
    rerender(<Orders filterRow={false} />);
    expect(headRows()).toHaveLength(1);
    expect(title('Customer')).toHaveFocus();
    expect(stops()).toEqual([title('Customer')]);
    // And with it back, the keyboard is still on the title, which is the first row of the heading.
    rerender(<Orders filterRow />);
    expect(stops()).toEqual([title('Customer')]);
    press(title('Customer'), 'ArrowDown');
    expect(filterCell(CUSTOMER)).toHaveFocus();
  });

  it('keeps the place in the titles when the filter row is turned on', () => {
    const { rerender } = render(<Orders filterRow={false} />);
    focusOn(title('Customer'));
    rerender(<Orders filterRow />);
    expect(stops()).toEqual([title('Customer')]);
    expect(title('Customer')).toHaveFocus();
  });

  it('does not lose the place in the filter row when a filter takes out the rows', () => {
    vi.useFakeTimers();
    render(<Orders />);
    focusOn(input());
    type('zzz');
    advance(FILTER_DELAY);
    expect(bodyRows().every((row) => row.classList.contains('flg-data-grid-row'))).toBe(false);
    expect(input()).toHaveFocus();
    expect(stops()).toEqual([filterCell(CUSTOMER)]);
  });
});

describe('the labels of the filter row', () => {
  it('words the input and the Select from filterCell', () => {
    render(<Orders labels={{ filterCell: (caption) => `Lọc ${caption}` }} />);
    expect(screen.getByRole('textbox', { name: 'Lọc Customer' })).toBeInTheDocument();
    expect(
      within(filterCell(PAID)).getByRole('combobox', { name: 'Lọc Paid' }),
    ).toBeInTheDocument();
  });

  it('does not warn for labels with a record written in the JSX, and a changed record is merged again', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<Orders labels={{ operators: { contains: 'Chứa' } }} />);
    rerender(<Orders labels={{ operators: { contains: 'Chứa' } }} />);
    expect(warn).not.toHaveBeenCalled();
    rerender(<Orders labels={{ operators: { contains: 'Có' } }} />);
    expect(screen.getByRole('button', { name: 'Operator: Có' })).toBeInTheDocument();
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('what a render of the filter row draws', () => {
  it('does not move the cells when a text is typed before its delay (they are the same elements)', () => {
    vi.useFakeTimers();
    render(<Orders />);
    const before = filterCells();
    const titles = Array.from(headRows()[0]!.cells);
    type('a');
    type('ab');
    expect(filterCells()).toEqual(before);
    expect(Array.from(headRows()[0]!.cells)).toEqual(titles);
  });

  it('keeps every row where it was for a choice that keeps them', () => {
    render(<Orders />);
    const rows = bodyRows();
    click(operatorButton());
    act(() => radio('Equals').click());
    expect(bodyRows()).toEqual(rows);
  });
});

describe('userEvent in the filter row', () => {
  it('types into the input and the grid filters once the delay is out', async () => {
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    const user = userEvent.setup();
    await user.click(input());
    await user.keyboard('huy{Enter}');
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(lastFilter(onFilterChange)).toEqual({ columns: { customer: { value: 'huy' } } });
    expect(customers()).toEqual(['Lê Quang Huy']);
  });
});

describe('the callbacks of a typed condition in a controlled grid', () => {
  it('send the page reset with the typed filter too, from a page other than the first', () => {
    vi.useFakeTimers();
    const onStateChange = vi.fn<(state: DataGridState, changed: keyof DataGridState) => void>();
    render(
      <Orders
        data={Array.from({ length: 12 }, (_, index) => ({ ...ORDERS[0]!, id: `DH-${index}` }))}
        paging={{ pageSize: 5, pageSizes: [5] }}
        filter={{}}
        onFilterChange={() => {}}
        page={{ index: 1, size: 5 }}
        onPageChange={() => {}}
        onStateChange={onStateChange}
      />,
    );
    type('huy');
    advance(FILTER_DELAY);
    const calls = onStateChange.mock.calls.map(([state, part]) => [part, state.filter]);
    const typed = { columns: { customer: { value: 'huy' } } };
    expect(calls).toEqual([
      ['filter', typed],
      ['page', typed],
    ]);
  });
});
