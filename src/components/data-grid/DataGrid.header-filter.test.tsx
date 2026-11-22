import { act, createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridFilter, DataGridProps } from './index';

// The header filter (spec phase 6 §4.3 G1 "Nút biểu tượng", F1 "Popover lọc ở header", §6.3 "Lọc ở header"): the
// funnel on a title, the list of distinct values in the one filter popover of the grid, and the rule of its OK.
// What needs a layout engine or the top layer to be true (the popover under its funnel, the focus after it in
// each engine, nothing scrolling) is proven in the stories (`DataGridFiltering.stories.tsx`).

// Which popovers are showing: jsdom has no Popover API.
let showing: Set<Element>;
beforeEach(() => {
  resetDevWarnings();
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
  customer: string;
  status: string;
  channel: string | null;
  qty: number;
}

const ORDERS: Order[] = [
  { id: 'DH-1', customer: 'An', status: 'New', channel: 'Store', qty: 3 },
  { id: 'DH-2', customer: 'Binh', status: 'Processing', channel: 'Website', qty: 12 },
  { id: 'DH-3', customer: 'An', status: 'Processing', channel: 'Store', qty: 21 },
  { id: 'DH-4', customer: 'Cuong', status: 'Delivered', channel: null, qty: 4 },
  { id: 'DH-5', customer: 'Dung', status: 'Cancelled', channel: 'Phone', qty: 8 },
  { id: 'DH-6', customer: 'Binh', status: 'New', channel: 'Website', qty: 30 },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104, allowHeaderFiltering: false },
  { field: 'customer', caption: 'Customer', width: 160 },
  { field: 'status', caption: 'Status', width: 140 },
  { field: 'channel', caption: 'Channel', width: 140 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 100 },
];

function Orders(props: Partial<DataGridProps<Order>>) {
  return (
    <DataGrid
      data={ORDERS}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      headerFilter
      {...props}
    />
  );
}

const grid = () => screen.getByRole('grid') as HTMLTableElement;
const ids = () =>
  Array.from(grid().querySelectorAll<HTMLElement>('tbody > tr')).map(
    (row) => row.children[0]!.textContent,
  );
const funnel = (caption: string, active = false) =>
  screen.getByRole('button', {
    name: active ? `Filter ${caption} (filtered)` : `Filter ${caption}`,
  });
const funnels = () =>
  Array.from(
    grid().querySelectorAll<HTMLElement>('.flg-data-grid-head-button[aria-haspopup="dialog"]'),
  );
const names = (buttons: Iterable<Element>) =>
  Array.from(buttons).map((el) => el.getAttribute('aria-label'));
const titleOf = (caption: string) =>
  within(grid()).getByRole('columnheader', { name: new RegExp(caption) });
const popover = () => document.querySelector<HTMLElement>('.flg-data-grid-filter-popover')!;
const inPopover = (role: string, name: string) =>
  within(popover()).getByRole(role, { name, hidden: true });
const search = () => inPopover('searchbox', 'Search values') as HTMLInputElement;
const box = (name: string) => inPopover('checkbox', name) as HTMLInputElement;
const button = (name: string) => inPopover('button', name);
const inputs = () =>
  Array.from(popover().querySelectorAll<HTMLInputElement>('.flg-data-grid-value-list input'));
// The list as it is drawn: each line's text, and the lines that are checked.
const lines = () =>
  Array.from(
    popover().querySelectorAll<HTMLElement>('.flg-data-grid-value-list .flg-checkbox'),
  ).map((label) => label.textContent);
const checkedLines = () =>
  inputs()
    .filter((input) => input.checked)
    .map((input) => input.closest('label')!.textContent);
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
const aTaskLater = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
const lastFilter = (spy: ReturnType<typeof vi.fn>) => spy.mock.calls.at(-1)?.[0] as DataGridFilter;
// What the browser does when it closes a popover itself (a press elsewhere, Esc): it tells the page with a toggle.
const dismiss = () =>
  act(() => {
    showing.delete(popover());
    fireEvent(popover(), Object.assign(new Event('toggle'), { newState: 'closed' }));
  });

describe('the funnel', () => {
  it('is on each data column that allows it, and only while headerFilter is true', () => {
    const { rerender } = render(<Orders />);
    // The Order column says no itself; the others are on by the grid's default.
    expect(names(funnels())).toEqual([
      'Filter Customer',
      'Filter Status',
      'Filter Channel',
      'Filter Qty',
    ]);
    rerender(<Orders headerFilter={false} />);
    expect(funnels()).toHaveLength(0);
    rerender(<Orders headerFilter={'yes' as unknown as boolean} />);
    expect(funnels()).toHaveLength(0);
  });

  it('follows allowHeaderFiltering of the grid, and of a column over it', () => {
    const columns = COLUMNS.map((column) =>
      'field' in column && column.field === 'status'
        ? { ...column, allowHeaderFiltering: true }
        : column,
    );
    render(<Orders columns={columns} allowHeaderFiltering={false} />);
    expect(names(funnels())).toEqual(['Filter Status']);
  });

  it('is not on the column of boxes, and is drawn before the button of the column menu', () => {
    render(<Orders selectionMode="multiple" />);
    const first = grid().querySelector('thead th')!;
    expect(first.querySelector('.flg-data-grid-head-icons')).toBeNull();
    const title = titleOf('Status');
    expect(names(title.querySelectorAll('button')).slice(-2)).toEqual([
      'Filter Status',
      'Status column menu',
    ]);
    expect(title.querySelector('.flg-data-grid-head-icons')).toContainElement(funnel('Status'));
  });

  it('is in a cluster of its own on a title that has no column menu', () => {
    render(
      <Orders
        allowSorting={false}
        allowResizing={false}
        allowReordering={false}
        allowPinning={false}
        allowHiding={false}
      />,
    );
    const buttons = titleOf('Status').querySelectorAll('.flg-data-grid-head-icons > button');
    expect(names(buttons)).toEqual(['Filter Status']);
  });

  it('says it opens a dialog, and what it opened while it is open', () => {
    render(<Orders />);
    expect(funnel('Status')).toHaveAttribute('aria-haspopup', 'dialog');
    expect(funnel('Status')).toHaveAttribute('aria-expanded', 'false');
    expect(funnel('Status')).not.toHaveAttribute('aria-controls');
    click(funnel('Status'));
    expect(funnel('Status')).toHaveAttribute('aria-expanded', 'true');
    expect(funnel('Status')).toHaveAttribute('aria-controls', popover().id);
    // Another column's funnel is not the open one.
    expect(funnel('Channel')).toHaveAttribute('aria-expanded', 'false');
  });

  it('is filled for a header condition that filters, and for no other', () => {
    const { rerender } = render(<Orders />);
    expect(funnel('Status')).not.toHaveAttribute('data-active');
    // A condition of the filter row is the operator button's sign, and not the funnel's.
    rerender(<Orders filter={{ columns: { status: { operator: '=', value: 'New' } } }} />);
    expect(funnel('Status')).not.toHaveAttribute('data-active');
    rerender(<Orders filter={{ columns: { status: { values: ['New'] } } }} />);
    expect(funnel('Status', true)).toHaveAttribute('data-active');
    expect(funnel('Customer')).not.toHaveAttribute('data-active');
    // `exclude` with no value keeps every row, so it is no filter; with one, it is.
    rerender(<Orders filter={{ columns: { status: { values: [], exclude: true } } }} />);
    expect(funnel('Status')).not.toHaveAttribute('data-active');
    rerender(<Orders filter={{ columns: { status: { values: ['New'], exclude: true } } }} />);
    expect(funnel('Status', true)).toHaveAttribute('data-active');
    // None checked is a condition that keeps no row.
    rerender(<Orders filter={{ columns: { status: { values: [] } } }} />);
    expect(funnel('Status', true)).toHaveAttribute('data-active');
  });

  it('is named by the labels', () => {
    render(
      <Orders
        filter={{ columns: { status: { values: ['New'] } } }}
        labels={{
          filterColumn: (caption, active) => `${caption}: ${active ? 'filtered' : 'filter'}`,
        }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Status: filtered' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Customer: filter' })).toBeInTheDocument();
  });

  it('is released from the Tab order with the other controls of its title: one stop in the grid', () => {
    render(<Orders />);
    expect(grid().querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    for (const control of funnels()) expect(control).toHaveAttribute('tabindex', '-1');
  });

  it('comes after the sort button and before the column menu, which F2 on the title goes through', () => {
    render(<Orders />);
    const title = titleOf('Status');
    expect(
      Array.from(title.querySelectorAll('button')).map(
        (el) => el.getAttribute('aria-label') ?? 'sort',
      ),
    ).toEqual(['sort', 'Filter Status', 'Status column menu']);
    act(() => title.focus());
    press(title, 'F2');
    expect(title.querySelector('.flg-table-sort')).toHaveFocus();
  });
});

describe('the popover and its list', () => {
  it('opens on a press of the funnel as a dialog named after the column, with the focus in the search field', () => {
    render(<Orders />);
    click(funnel('Status'));
    expect(showing.has(popover())).toBe(true);
    expect(popover()).toHaveAttribute('role', 'dialog');
    expect(popover()).toHaveAttribute('aria-label', 'Filter Status');
    expect(popover()).toHaveClass('flg-surface', 'flg-popover', 'flg-data-grid-header-filter');
    expect(popover().querySelector('.flg-popover-arrow')).not.toBeNull();
    expect(search()).toHaveFocus();
    expect(search()).toHaveAttribute('placeholder', 'Search values…');
    expect(popover()).toHaveAttribute('data-align', 'center');
  });

  it('lists "(Select all)", the values in the order of the column, and "(Blanks)" last', () => {
    render(<Orders />);
    click(funnel('Channel'));
    expect(lines()).toEqual(['(Select all)', 'Phone', 'Store', 'Website', '(Blanks)']);
    expect(checkedLines()).toEqual(['(Select all)', 'Phone', 'Store', 'Website', '(Blanks)']);
    expect(box('(Select all)')).toBeChecked();
    expect(popover().querySelector('.flg-data-grid-value-list > .flg-divider')).not.toBeNull();
    expect(popover().querySelector('.flg-data-grid-value-blank')).toHaveTextContent('(Blanks)');
    // Numbers are listed as the column writes them, in numeric order.
    fireEvent.click(button('Cancel'));
    click(funnel('Qty'));
    expect(lines()).toEqual(['(Select all)', '3', '4', '8', '12', '21', '30']);
  });

  it('is narrowed by the search of the grid and by the other columns, not by its own conditions', () => {
    const { rerender } = render(
      <Orders
        filter={{ search: 'binh', columns: { channel: { operator: '=', value: 'Website' } } }}
      />,
    );
    // The search keeps DH-2 and DH-6, Channel = Website keeps both: Processing and New.
    click(funnel('Status'));
    expect(lines()).toEqual(['(Select all)', 'New', 'Processing']);
    fireEvent.click(button('Cancel'));
    // Channel's own row condition does not narrow its own list: the search alone gives Website.
    click(funnel('Channel'));
    expect(lines()).toEqual(['(Select all)', 'Website']);
    fireEvent.click(button('Cancel'));
    // The header condition of another column narrows too, and `enabled: false` puts it aside.
    rerender(<Orders filter={{ columns: { customer: { values: ['An'] } } }} />);
    click(funnel('Status'));
    expect(lines()).toEqual(['(Select all)', 'New', 'Processing']);
    fireEvent.click(button('Cancel'));
    rerender(<Orders filter={{ enabled: false, columns: { customer: { values: ['An'] } } }} />);
    click(funnel('Status'));
    expect(lines()).toEqual(['(Select all)', 'Cancelled', 'Delivered', 'New', 'Processing']);
  });

  it('does not narrow a column by its own header condition either', () => {
    render(<Orders filter={{ columns: { status: { values: ['New'] } } }} />);
    click(funnel('Status', true));
    expect(lines()).toEqual(['(Select all)', 'Cancelled', 'Delivered', 'New', 'Processing']);
  });

  it('adds the values its own condition names, though no row holds them', () => {
    render(<Orders filter={{ columns: { status: { values: ['New', 'Returned'] } } }} />);
    click(funnel('Status', true));
    expect(lines()).toContain('Returned');
    expect(checkedLines()).toEqual(['New', 'Returned']);
  });

  it('starts from the condition: all with none, the kept values, or all but the excluded', () => {
    const { rerender } = render(<Orders filter={{ columns: { status: { values: ['New'] } } }} />);
    click(funnel('Status', true));
    expect(checkedLines()).toEqual(['New']);
    expect(box('(Select all)')).not.toBeChecked();
    expect(box('(Select all)').indeterminate).toBe(true);
    fireEvent.click(button('Cancel'));
    rerender(<Orders filter={{ columns: { status: { values: ['New'], exclude: true } } }} />);
    click(funnel('Status', true));
    expect(checkedLines()).toEqual(['Cancelled', 'Delivered', 'Processing']);
    fireEvent.click(button('Cancel'));
    rerender(<Orders filter={{ columns: { status: { values: [] } } }} />);
    click(funnel('Status', true));
    expect(checkedLines()).toEqual([]);
    expect(box('(Select all)').indeterminate).toBe(false);
  });

  it('reads the list once, when it opens, and not again while the grid changes under it', () => {
    const { rerender } = render(<Orders />);
    click(funnel('Status'));
    expect(lines()).toHaveLength(5);
    rerender(<Orders data={ORDERS.slice(0, 1)} />);
    expect(lines()).toHaveLength(5);
    fireEvent.click(button('Cancel'));
    click(funnel('Status'));
    expect(lines()).toEqual(['(Select all)', 'New']);
  });

  it('draws 500 values and a line that says how many match, and the search narrows them', () => {
    const many = Array.from({ length: 600 }, (_, index) => ({
      id: `R-${index}`,
      customer: `Customer ${String(index).padStart(3, '0')}`,
      status: 'New',
      channel: null,
      qty: index,
    }));
    render(<Orders data={many} paging={false} />);
    click(funnel('Customer'));
    // "(Select all)" and 500 values; the 100 others are not drawn.
    expect(lines()).toHaveLength(501);
    expect(popover().querySelector('.flg-data-grid-value-more')).toHaveTextContent(
      'Showing 500 of 600 values. Search to narrow them.',
    );
    type(search(), 'customer 59');
    expect(lines()).toHaveLength(11);
    expect(popover().querySelector('.flg-data-grid-value-more')).toBeNull();
  });

  it('is narrowed by the search at once, without case or diacritics, "(Blanks)" included', () => {
    render(<Orders />);
    click(funnel('Channel'));
    type(search(), 'STO');
    expect(lines()).toEqual(['(Select all)', 'Store']);
    type(search(), 'blank');
    expect(lines()).toEqual(['(Select all)', '(Blanks)']);
    type(search(), 'zzz');
    expect(lines()).toEqual(['(Select all)']);
    expect(box('(Select all)')).toBeDisabled();
  });

  it('reads the search as the search of the grid does: trimmed, so a space at its end finds the same', () => {
    render(<Orders />);
    click(funnel('Channel'));
    type(search(), 'sto ');
    expect(lines()).toEqual(['(Select all)', 'Store']);
    type(search(), '  WEB  ');
    expect(lines()).toEqual(['(Select all)', 'Website']);
    // A search of nothing but spaces is no search.
    type(search(), '   ');
    expect(lines()).toEqual(['(Select all)', 'Phone', 'Store', 'Website', '(Blanks)']);
  });

  it('names the dialog and not the group of boxes inside it', () => {
    render(<Orders />);
    click(funnel('Customer'));
    expect(popover()).toHaveAttribute('aria-label', 'Filter Customer');
    expect(
      within(popover()).queryAllByRole('group', { name: 'Filter Customer', hidden: true }),
    ).toEqual([]);
    expect(popover().querySelector('.flg-data-grid-value-list')).not.toHaveAttribute('aria-label');
  });

  it('draws "(Select all)" mixed while some shown values are checked, and checks what the search shows', () => {
    render(<Orders />);
    click(funnel('Status'));
    expect(box('(Select all)').indeterminate).toBe(false);
    fireEvent.click(box('New'));
    expect(box('(Select all)').indeterminate).toBe(true);
    expect(box('(Select all)')).not.toBeChecked();
    // Cancelled and Delivered are what "ed" shows, and both are checked.
    type(search(), 'ed');
    expect(lines()).toEqual(['(Select all)', 'Cancelled', 'Delivered']);
    expect(box('(Select all)')).toBeChecked();
    // Clearing the shown ones leaves the others as they were.
    fireEvent.click(box('(Select all)'));
    expect(checkedLines()).toEqual([]);
    type(search(), '');
    expect(checkedLines()).toEqual(['Processing']);
    expect(box('(Select all)').indeterminate).toBe(true);
    // Checking the shown ones when some of them are not.
    type(search(), 'ne');
    expect(lines()).toEqual(['(Select all)', 'New']);
    fireEvent.click(box('(Select all)'));
    type(search(), '');
    expect(checkedLines()).toEqual(['New', 'Processing']);
  });
});

describe('the popover when the feature that opened it goes off', () => {
  const open = () => [...showing].filter((el) => el.isConnected);

  it('closes the list for good when headerFilter goes off with the filter row on', () => {
    const { rerender } = render(<Orders filterRow />);
    click(funnel('Status'));
    expect(open()).toHaveLength(1);
    act(() => search().focus());
    rerender(<Orders filterRow headerFilter={false} />);
    expect(open()).toHaveLength(0);
    expect(document.activeElement, 'the focus is not dropped to the body').not.toBe(document.body);
    // Turning the feature back on opens nothing.
    rerender(<Orders filterRow />);
    expect(open()).toHaveLength(0);
    expect(funnel('Status')).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the list for good when the column stops allowing header filtering', () => {
    const { rerender } = render(<Orders filterRow />);
    click(funnel('Status'));
    expect(open()).toHaveLength(1);
    const columns = COLUMNS.map((column) =>
      'field' in column && column.field === 'status'
        ? { ...column, allowHeaderFiltering: false }
        : column,
    );
    rerender(<Orders filterRow columns={columns} />);
    expect(open()).toHaveLength(0);
    rerender(<Orders filterRow />);
    expect(open()).toHaveLength(0);
  });
});

describe('OK', () => {
  const ok = () => fireEvent.click(button('OK'));

  it('with every value checked is no condition, and takes the header condition away', () => {
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{ columns: { status: { values: ['New'] } } }}
        onFilterChange={onFilterChange}
      />,
    );
    click(funnel('Status', true));
    fireEvent.click(box('(Select all)'));
    ok();
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(lastFilter(onFilterChange)).toEqual({});
    expect(ids()).toHaveLength(6);
    expect(funnel('Status')).not.toHaveAttribute('data-active');
    expect(showing.has(popover())).toBe(false);
  });

  it('with more than half checked stores the others as `exclude`', () => {
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    click(funnel('Status'));
    fireEvent.click(box('Cancelled'));
    ok();
    expect(lastFilter(onFilterChange)).toEqual({
      columns: { status: { values: ['Cancelled'], exclude: true } },
    });
    expect(ids()).toEqual(['DH-1', 'DH-2', 'DH-3', 'DH-4', 'DH-6']);
    expect(funnel('Status', true)).toHaveAttribute('data-active');
  });

  it('with half or fewer checked stores the checked values', () => {
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    click(funnel('Status'));
    fireEvent.click(box('(Select all)'));
    expect(checkedLines()).toEqual([]);
    fireEvent.click(box('New'));
    fireEvent.click(box('Processing'));
    ok();
    // Two of four is not more than half.
    expect(lastFilter(onFilterChange)).toEqual({
      columns: { status: { values: ['New', 'Processing'] } },
    });
    expect(ids()).toEqual(['DH-1', 'DH-2', 'DH-3', 'DH-6']);
  });

  it('with none checked stores a condition that keeps no row, and not "no change"', () => {
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    click(funnel('Status'));
    fireEvent.click(box('(Select all)'));
    expect(checkedLines()).toEqual([]);
    ok();
    expect(lastFilter(onFilterChange)).toEqual({ columns: { status: { values: [] } } });
    expect(grid().querySelectorAll('tbody > tr.flg-data-grid-row')).toHaveLength(0);
    expect(funnel('Status', true)).toHaveAttribute('data-active');
    expect(screen.getByText('No rows match the filter')).toBeInTheDocument();
  });

  it('keeps the row condition of the column, and the search and the conditions of the others', () => {
    const onFilterChange = vi.fn();
    render(
      <Orders
        defaultFilter={{
          search: 'a',
          columns: {
            status: { operator: '=', value: 'New' },
            customer: { values: ['An'] },
          },
        }}
        onFilterChange={onFilterChange}
      />,
    );
    click(funnel('Status'));
    expect(lines()).toEqual(['(Select all)', 'New', 'Processing']);
    fireEvent.click(box('New'));
    ok();
    // The list is narrowed (by the search and by Customer), so the unchecked box is an exclude: what the
    // list does not show stays in.
    expect(lastFilter(onFilterChange)).toEqual({
      search: 'a',
      columns: {
        status: { operator: '=', value: 'New', values: ['New'], exclude: true },
        customer: { values: ['An'] },
      },
    });
  });

  it('stores numbers as numbers and the blank as null', () => {
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    click(funnel('Channel'));
    fireEvent.click(box('(Blanks)'));
    ok();
    expect(lastFilter(onFilterChange)).toEqual({
      columns: { channel: { values: [null], exclude: true } },
    });
    expect(ids()).toEqual(['DH-1', 'DH-2', 'DH-3', 'DH-5', 'DH-6']);
    // The list of Qty is narrowed by the other columns: the blank channel's row (Qty 4) is not in it.
    click(funnel('Qty'));
    fireEvent.click(box('3'));
    fireEvent.click(box('8'));
    ok();
    expect(lastFilter(onFilterChange).columns?.qty).toEqual({ values: [3, 8], exclude: true });
  });

  it('is called once, and goes to the first page when the page was not the first', () => {
    const onFilterChange = vi.fn();
    const onPageChange = vi.fn();
    render(
      <Orders
        paging={{ pageSize: 2, pageSizes: [2] }}
        defaultPage={{ index: 2, size: 2 }}
        onFilterChange={onFilterChange}
        onPageChange={onPageChange}
      />,
    );
    click(funnel('Status'));
    fireEvent.click(box('Cancelled'));
    ok();
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith({ index: 0, size: 2 });
  });

  it('calls nothing for an OK that changes nothing', () => {
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    click(funnel('Status'));
    ok();
    expect(onFilterChange).not.toHaveBeenCalled();
    expect(showing.has(popover())).toBe(false);
  });

  describe('in a list that the search and the other columns narrow', () => {
    // The Status list holds the values of the rows that are left; a value the list does not show is not the
    // person's to change.
    const lastValues = (spy: ReturnType<typeof vi.fn>) =>
      (lastFilter(spy).columns?.status ?? {}) as { values?: unknown[]; exclude?: boolean };

    it('applies nothing for an OK with the boxes as they started, a values condition under a search', () => {
      const onFilterChange = vi.fn();
      render(
        <Orders
          onFilterChange={onFilterChange}
          defaultFilter={{ search: 'binh', columns: { status: { values: ['New', 'Processing'] } } }}
        />,
      );
      click(funnel('Status', true));
      expect(checkedLines()).toEqual(['(Select all)', 'New', 'Processing']);
      ok();
      expect(onFilterChange).not.toHaveBeenCalled();
      expect(showing.has(popover())).toBe(false);
    });

    it('applies nothing for an OK with the boxes as they started, so a values condition does not flip', () => {
      const onFilterChange = vi.fn();
      render(
        <Orders
          onFilterChange={onFilterChange}
          defaultFilter={{ search: 'an', columns: { status: { values: ['New', 'Processing'] } } }}
        />,
      );
      click(funnel('Status', true));
      ok();
      expect(onFilterChange).not.toHaveBeenCalled();
    });

    it('applies nothing for an OK that changes nothing from an exclude condition or none either', () => {
      const onFilterChange = vi.fn();
      const { rerender } = render(
        <Orders
          onFilterChange={onFilterChange}
          defaultFilter={{
            search: 'an',
            columns: { status: { values: ['Cancelled'], exclude: true } },
          }}
        />,
      );
      click(funnel('Status', true));
      ok();
      rerender(
        <Orders onFilterChange={onFilterChange} key="none" defaultFilter={{ search: 'an' }} />,
      );
      click(funnel('Status'));
      ok();
      expect(onFilterChange).not.toHaveBeenCalled();
    });

    it('keeps a values condition values with the checked keys when a box is changed', () => {
      const onFilterChange = vi.fn();
      render(
        <Orders
          onFilterChange={onFilterChange}
          defaultFilter={{ search: 'an', columns: { status: { values: ['New', 'Processing'] } } }}
        />,
      );
      click(funnel('Status', true));
      fireEvent.click(box('Processing'));
      ok();
      expect(lastValues(onFilterChange)).toEqual({ values: ['New'] });
      // All the boxes checked is still a list of values, not no condition, nor an exclude.
      click(funnel('Status', true));
      fireEvent.click(box('(Select all)'));
      ok();
      expect(lastValues(onFilterChange)).toEqual({ values: ['Cancelled', 'New', 'Processing'] });
    });

    it('makes an exclude condition, or none, an exclude of the unchecked boxes when one is changed', () => {
      const onFilterChange = vi.fn();
      const { rerender } = render(
        <Orders
          onFilterChange={onFilterChange}
          defaultFilter={{
            search: 'an',
            columns: { status: { values: ['Cancelled'], exclude: true } },
          }}
        />,
      );
      click(funnel('Status', true));
      fireEvent.click(box('New'));
      ok();
      expect(lastValues(onFilterChange)).toEqual({
        values: ['Cancelled', 'New'],
        exclude: true,
      });
      rerender(
        <Orders onFilterChange={onFilterChange} key="none" defaultFilter={{ search: 'an' }} />,
      );
      click(funnel('Status'));
      fireEvent.click(box('Cancelled'));
      ok();
      expect(lastValues(onFilterChange)).toEqual({ values: ['Cancelled'], exclude: true });
      // None unchecked again is no condition for that column.
      click(funnel('Status', true));
      fireEvent.click(box('Cancelled'));
      ok();
      expect(lastFilter(onFilterChange)).toEqual({ search: 'an' });
    });

    it('keeps the spec rule in a list that is not narrowed: more than half checked is an exclude', () => {
      const onFilterChange = vi.fn();
      render(<Orders onFilterChange={onFilterChange} />);
      click(funnel('Status'));
      fireEvent.click(box('Cancelled'));
      ok();
      expect(lastValues(onFilterChange)).toEqual({ values: ['Cancelled'], exclude: true });
    });
  });

  it('is what Enter does, in the search field and in a box, and not on a button', async () => {
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    click(funnel('Status'));
    fireEvent.click(box('New'));
    expect(press(search(), 'Enter')).toBe(true);
    await aTaskLater();
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(lastFilter(onFilterChange)).toEqual({
      columns: { status: { values: ['New'], exclude: true } },
    });
    expect(showing.has(popover())).toBe(false);
    // Enter on a button is that button's own press, which the popover leaves alone.
    click(funnel('Status', true));
    expect(press(button('Cancel'), 'Enter')).toBe(false);
    click(funnel('Status', true));
  });
});

describe('Cancel, Esc and a light dismiss', () => {
  it('change nothing, call nothing, and give the focus back to the funnel', () => {
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    click(funnel('Status'));
    fireEvent.click(box('New'));
    fireEvent.click(button('Cancel'));
    expect(showing.has(popover())).toBe(false);
    expect(funnel('Status')).toHaveFocus();
    click(funnel('Status'));
    // Each opening starts from the filter as it is.
    expect(inputs().every((input) => input.checked)).toBe(true);
    fireEvent.click(box('New'));
    dismiss();
    expect(funnel('Status')).toHaveAttribute('aria-expanded', 'false');
    expect(onFilterChange).not.toHaveBeenCalled();
    expect(ids()).toHaveLength(6);
  });

  it('are what Tab past OK and Shift+Tab before the search field do, with the focus on the funnel', () => {
    const onFilterChange = vi.fn();
    render(<Orders onFilterChange={onFilterChange} />);
    click(funnel('Status'));
    fireEvent.click(box('New'));
    // Tab in the middle of the popover is the browser's.
    expect(press(search(), 'Tab')).toBe(false);
    const ok = button('OK');
    act(() => ok.focus());
    expect(press(ok, 'Tab')).toBe(true);
    expect(showing.has(popover())).toBe(false);
    expect(funnel('Status')).toHaveFocus();
    click(funnel('Status'));
    expect(press(search(), 'Tab', { shiftKey: true })).toBe(true);
    expect(showing.has(popover())).toBe(false);
    expect(funnel('Status')).toHaveFocus();
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it('a second press on the funnel of the open popover closes it, and the third opens it', () => {
    render(<Orders />);
    click(funnel('Status'));
    expect(showing.has(popover())).toBe(true);
    click(funnel('Status'));
    expect(showing.has(popover())).toBe(false);
    expect(funnel('Status')).toHaveAttribute('aria-expanded', 'false');
    click(funnel('Status'));
    expect(showing.has(popover())).toBe(true);
  });

  it('a press on the funnel of another column moves the one popover there, after a task', async () => {
    render(<Orders />);
    click(funnel('Status'));
    expect(popover()).toHaveAttribute('aria-label', 'Filter Status');
    click(funnel('Channel'));
    await aTaskLater();
    expect(document.querySelectorAll('.flg-data-grid-filter-popover')).toHaveLength(1);
    expect(popover()).toHaveAttribute('aria-label', 'Filter Channel');
    expect(lines()).toContain('Phone');
    expect(funnel('Channel')).toHaveAttribute('aria-expanded', 'true');
    expect(funnel('Status')).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('the keys in the list', () => {
  it('is one stop of Tab, and its boxes rove with the arrows, Home and End', () => {
    render(<Orders />);
    click(funnel('Status'));
    // "(Select all)" is the stop at first; the rest are not in the Tab order.
    expect(inputs().map((input) => input.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    act(() => inputs()[0]!.focus());
    expect(press(inputs()[0]!, 'ArrowDown')).toBe(true);
    expect(inputs()[1]).toHaveFocus();
    // The stop goes with the focus.
    expect(inputs().map((input) => input.tabIndex)).toEqual([-1, 0, -1, -1, -1]);
    press(inputs()[1]!, 'ArrowDown');
    expect(inputs()[2]).toHaveFocus();
    press(inputs()[2]!, 'ArrowUp');
    expect(inputs()[1]).toHaveFocus();
    press(inputs()[1]!, 'End');
    expect(inputs()[4]).toHaveFocus();
    press(inputs()[4]!, 'ArrowDown');
    expect(inputs()[4]).toHaveFocus();
    press(inputs()[4]!, 'Home');
    expect(inputs()[0]).toHaveFocus();
    press(inputs()[0]!, 'ArrowUp');
    expect(inputs()[0]).toHaveFocus();
  });

  it('goes down from the search field into the list, to its one stop, and only on ↓', () => {
    render(<Orders />);
    click(funnel('Status'));
    expect(press(search(), 'ArrowUp')).toBe(false);
    expect(press(search(), 'ArrowDown', { altKey: true })).toBe(false);
    expect(search()).toHaveFocus();
    expect(press(search(), 'ArrowDown')).toBe(true);
    expect(inputs()[0]).toHaveFocus();
    // The stop is where the focus was last in the list, and a search that leaves no box has none to go to.
    act(() => inputs()[2]!.focus());
    act(() => search().focus());
    press(search(), 'ArrowDown');
    expect(inputs()[2]).toHaveFocus();
    act(() => search().focus());
    type(search(), 'zzz');
    expect(press(search(), 'ArrowDown')).toBe(true);
    expect(search()).toHaveFocus();
  });

  it('keeps one stop when the search takes the box that had it away', () => {
    render(<Orders />);
    click(funnel('Status'));
    act(() => inputs()[4]!.focus());
    type(search(), 'new');
    expect(inputs().map((input) => input.tabIndex)).toEqual([-1, 0]);
  });
});

describe('server mode', () => {
  const remoteColumns: DataGridColumn<Order>[] = COLUMNS.map((column) =>
    'field' in column && column.field === 'status'
      ? {
          ...column,
          headerFilter: {
            values: [
              { value: 'New', text: 'New' },
              { value: 'Returned', text: 'Returned' },
            ],
          },
        }
      : column,
  );
  const needsValues = (warn: { mock: { calls: unknown[][] } }) =>
    warn.mock.calls
      .map((call) => String(call[0]))
      .filter((text) => text.includes('headerFilter.values'));

  it("lists the column's headerFilter.values, in its order, and asks no row", () => {
    const onFilterChange = vi.fn();
    render(
      <Orders
        remote
        totalCount={40}
        columns={remoteColumns}
        data={ORDERS.slice(0, 3)}
        onFilterChange={onFilterChange}
      />,
    );
    click(funnel('Status'));
    expect(lines()).toEqual(['(Select all)', 'New', 'Returned']);
    fireEvent.click(box('Returned'));
    ok();
    // The server filters: the grid only says what was asked, and keeps the page it was given.
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(lastFilter(onFilterChange)).toEqual({ columns: { status: { values: ['New'] } } });
    expect(ids()).toEqual(['DH-1', 'DH-2', 'DH-3']);

    function ok() {
      fireEvent.click(button('OK'));
    }
  });

  it('draws one box for a value its list names twice, with the text of the first', () => {
    const twice: DataGridColumn<Order>[] = COLUMNS.map((column) =>
      'field' in column && column.field === 'status'
        ? {
            ...column,
            headerFilter: {
              values: [
                { value: 'New', text: 'New' },
                { value: 'Returned', text: 'Returned' },
                { value: 'New', text: 'New again' },
              ],
            },
          }
        : column,
    );
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Orders remote totalCount={40} columns={twice} data={ORDERS.slice(0, 3)} />);
    click(funnel('Status'));
    expect(lines()).toEqual(['(Select all)', 'New', 'Returned']);
    // No two boxes of one key: React says so on the console.
    expect(error).not.toHaveBeenCalled();
  });

  it("warns once for a column with no values, and lists the page's values", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(
      <Orders remote totalCount={40} columns={remoteColumns} data={ORDERS.slice(0, 3)} />,
    );
    expect(needsValues(warn)).toHaveLength(1);
    expect(needsValues(warn)[0]).toContain(
      "in server mode a column's header filter needs headerFilter.values",
    );
    click(funnel('Customer'));
    expect(lines()).toEqual(['(Select all)', 'An', 'Binh']);
    rerender(<Orders remote totalCount={40} columns={remoteColumns} data={ORDERS.slice(0, 4)} />);
    expect(needsValues(warn)).toHaveLength(1);
  });

  it('does not warn when every funnel has its values, when none is asked for, or for a client grid', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onlyStatus = remoteColumns.map((column) => ({
      ...column,
      allowHeaderFiltering: 'field' in column && column.field === 'status',
    }));
    render(<Orders remote totalCount={40} columns={onlyStatus} />);
    render(<Orders remote totalCount={40} headerFilter={false} />);
    render(<Orders />);
    expect(needsValues(warn)).toEqual([]);
  });
});
