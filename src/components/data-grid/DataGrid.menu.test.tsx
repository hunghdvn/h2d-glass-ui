import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridColumnLayout, DataGridProps, DataGridState } from './index';

// The column menu (spec phase 6 §3.6, §3.8, §4.3 C1, §6.3 "Menu cột"): the button on a title, the ways
// to open the one menu of the grid, its items, what each does and the callbacks it makes, and where the
// focus goes. What needs a layout engine or the top layer to be true (the menu at the pointer, the
// focus after it closes in each engine, the button shown on hover and on focus, no scroll) is proven in
// the stories (`DataGridColumns.stories.tsx`).

// How many times a popover was shown: a menu that is showing is not shown again by a render.
let shown: number;
let showing: Set<Element>;
beforeEach(() => {
  resetDevWarnings();
  shown = 0;
  showing = new Set();
  // jsdom has no layout, so every element would count as hidden to the code that looks for the
  // controls of a cell, and no Popover API: the menu shows and hides by these stand-ins.
  HTMLElement.prototype.checkVisibility = () => true;
  HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
    shown += 1;
    showing.add(this);
  };
  HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
    showing.delete(this);
  };
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
  vi.restoreAllMocks();
  vi.useRealTimers();
});

interface Order {
  id: string;
  customer: string;
  qty: number;
  total: number;
}

const ORDERS: Order[] = [
  { id: 'DH-1030', customer: 'Nguyễn Minh', qty: 4, total: 1250000 },
  { id: 'DH-1029', customer: 'Trần Hải', qty: 1, total: 890000 },
  { id: 'DH-1028', customer: 'Lê An', qty: 12, total: 15400000 },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
  { field: 'customer', caption: 'Customer', width: 200 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
  { field: 'total', caption: 'Total', dataType: 'number', width: 120 },
];
const ORDER = ['id', 'customer', 'qty', 'total'];

function Orders(props: Partial<DataGridProps<Order>>) {
  return (
    <DataGrid
      data={ORDERS}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      {...props}
    />
  );
}

/** A grid whose parent keeps the layout, as a caller that saves it does. */
function Controlled({
  onChange,
  ...props
}: Partial<DataGridProps<Order>> & { onChange: (layout: DataGridColumnLayout) => void }) {
  const [layout, setLayout] = useState<DataGridColumnLayout>({
    order: ORDER,
    widths: {},
    hidden: [],
    pinned: {},
  });
  return (
    <Orders
      columnLayout={layout}
      onColumnLayoutChange={(next) => {
        onChange(next);
        setLayout(next);
      }}
      {...props}
    />
  );
}

const grid = () => screen.getByRole('grid') as HTMLTableElement;
// The titles of the columns: the filler column's is none.
const titles = () =>
  Array.from(grid().tHead!.rows[0]!.cells).filter(
    (cell) => !cell.classList.contains('flg-data-grid-filler'),
  );
const captions = () => titles().map((cell) => cell.textContent);
const title = (name: string) => titles().find((cell) => cell.textContent?.includes(name))!;
const more = (name: string) =>
  title(name).querySelector<HTMLButtonElement>('.flg-data-grid-head-button');
const menu = () => document.querySelector<HTMLElement>('.flg-data-grid-column-menu');
const items = () => Array.from(menu()?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
const labelsOf = () => items().map((item) => item.textContent);
const item = (name: string) => items().find((candidate) => candidate.textContent === name)!;
const region = () => document.querySelector('[aria-live="polite"]')!;
const focusTitle = (name: string) => act(() => title(name).focus());
const tick = () => act(() => void vi.advanceTimersByTime(0));

/** A press and a click on a button, as a mouse makes them. */
function click(button: HTMLElement) {
  fireEvent.pointerDown(button, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 });
  fireEvent.mouseDown(button);
  fireEvent.pointerUp(button, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 });
  fireEvent.click(button, { detail: 1 });
}
/** Opens the menu of a column by its button, and picks an item. */
function choose(column: string, name: string) {
  click(more(column)!);
  act(() => item(name).click());
}

describe('the button on a title', () => {
  it('is on the title of every data column, named after it and closed', () => {
    render(<Orders />);
    for (const name of ['Order', 'Customer', 'Qty', 'Total']) {
      const button = more(name)!;
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
      expect(button.getAttribute('aria-label')).toBe(`${name} column menu`);
      expect(button.getAttribute('aria-haspopup')).toBe('menu');
      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(button.hasAttribute('aria-controls')).toBe(false);
    }
  });

  it('sits in the cluster after the sort button, or after the plain title of a column that does not sort', () => {
    render(<Orders columns={[...COLUMNS.slice(0, 1), { ...COLUMNS[1]!, allowSorting: false }]} />);
    const sorting = title('Order').querySelector('.flg-data-grid-head-content')!;
    expect(Array.from(sorting.children, (part) => part.className)).toEqual([
      'flg-table-sort',
      'flg-data-grid-head-icons',
    ]);
    const plain = title('Customer').querySelector('.flg-data-grid-head-content')!;
    expect(Array.from(plain.children, (part) => part.className)).toEqual([
      'flg-data-grid-head-title',
      'flg-data-grid-head-icons',
    ]);
    expect(plain.querySelector('.flg-data-grid-head-icons > .flg-data-grid-head-button')).not.toBe(
      null,
    );
  });

  it('is not on the title of the column of boxes', () => {
    render(<Orders selectionMode="multiple" />);
    expect(titles()[0]!.querySelector('.flg-data-grid-head-button')).toBeNull();
    expect(grid().querySelectorAll('.flg-data-grid-head-button')).toHaveLength(4);
  });

  it('is not on a column whose menu would be empty, and the grid has no menu when no column has one', () => {
    render(
      <Orders
        columns={COLUMNS.map((column) => ({
          ...column,
          allowSorting: false,
          allowPinning: false,
          allowReordering: false,
          allowResizing: false,
          allowHiding: false,
        }))}
      />,
    );
    expect(grid().querySelectorAll('.flg-data-grid-head-button')).toHaveLength(0);
    expect(menu()).toBeNull();
  });

  it('is on a column that can only be hidden, and not on the last one shown', () => {
    const only = { allowSorting: false, allowPinning: false, allowReordering: false };
    const { rerender } = render(
      <Orders
        allowResizing={false}
        columns={COLUMNS.slice(0, 2).map((column) => ({ ...column, ...only }))}
      />,
    );
    expect(grid().querySelectorAll('.flg-data-grid-head-button')).toHaveLength(2);
    rerender(
      <Orders
        allowResizing={false}
        columns={COLUMNS.slice(0, 1).map((column) => ({ ...column, ...only }))}
      />,
    );
    expect(grid().querySelectorAll('.flg-data-grid-head-button')).toHaveLength(0);
  });

  it('takes its name from labels.columnMenu', () => {
    render(<Orders labels={{ columnMenu: (caption) => `Options of ${caption}` }} />);
    expect(more('Total')!.getAttribute('aria-label')).toBe('Options of Total');
  });

  it('is the one stop of Tab of the grid together with the other buttons of the heading', () => {
    render(<Orders />);
    const stops = Array.from(grid().querySelectorAll('[tabindex="0"]'));
    expect(stops).toHaveLength(1);
    expect(stops[0]!.tagName).toBe('TH');
    for (const button of grid().querySelectorAll('.flg-data-grid-head-button')) {
      expect(button.getAttribute('tabindex')).toBe('-1');
    }
  });

  it('is reached by F2 on the title: the sort button, then Tab to the button, then Tab round', () => {
    render(<Orders />);
    focusTitle('Customer');
    fireEvent.keyDown(document.activeElement!, { key: 'F2' });
    expect(document.activeElement).toBe(title('Customer').querySelector('.flg-table-sort'));
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    expect(document.activeElement).toBe(more('Customer'));
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    expect(document.activeElement).toBe(title('Customer').querySelector('.flg-table-sort'));
  });

  it('is not turned back into a stop of Tab by a render of the grid', () => {
    const { rerender } = render(<Orders />);
    rerender(<Orders caption="Orders again" />);
    expect(more('Customer')!.getAttribute('tabindex')).toBe('-1');
    expect(grid().querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });
});

describe('opening the menu', () => {
  it('opens under the button on a press, with the title that the press focused', () => {
    render(<Orders />);
    const button = more('Customer')!;
    fireEvent.pointerDown(button, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 });
    // The press is cancelled, so the browser focuses nothing, and the title has the focus.
    expect(fireEvent.mouseDown(button)).toBe(false);
    expect(document.activeElement).toBe(title('Customer'));
    fireEvent.click(button, { detail: 1 });
    expect(shown).toBe(1);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-controls')).toBe(menu()!.id);
    expect(menu()!.getAttribute('aria-label')).toBe('Customer column menu');
    expect(more('Total')!.getAttribute('aria-expanded')).toBe('false');
    expect(more('Total')!.hasAttribute('aria-controls')).toBe(false);
    // The first item has the focus.
    expect(document.activeElement).toBe(items()[0]);
  });

  it('opens from the keyboard on Enter or Space on the focused button, with no press', () => {
    render(<Orders />);
    act(() => more('Customer')!.focus());
    act(() => more('Customer')!.click());
    expect(more('Customer')!.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(items()[0]);
  });

  it.each([
    ['Alt+ArrowDown', { key: 'ArrowDown', altKey: true }],
    ['Shift+F10', { key: 'F10', shiftKey: true }],
    ['the ContextMenu key', { key: 'ContextMenu' }],
  ])('opens on %s on the title, cancels the key, and opens once for a held key', (_name, init) => {
    render(<Orders />);
    focusTitle('Customer');
    expect(fireEvent.keyDown(document.activeElement!, init)).toBe(false);
    expect(shown).toBe(1);
    expect(more('Customer')!.getAttribute('aria-expanded')).toBe('true');
    // The menu has the focus now; a repeat of the key on the title is not a second opening.
    act(() => title('Customer').focus());
    expect(fireEvent.keyDown(title('Customer'), { ...init, repeat: true })).toBe(false);
    expect(shown).toBe(1);
  });

  it('does not open on a key that is held with other modifiers, and does not take the key', () => {
    render(<Orders />);
    focusTitle('Customer');
    expect(
      fireEvent.keyDown(document.activeElement!, {
        key: 'ArrowDown',
        altKey: true,
        shiftKey: true,
      }),
    ).toBe(true);
    expect(fireEvent.keyDown(document.activeElement!, { key: 'F10' })).toBe(true);
    expect(shown).toBe(0);
  });

  it('cancels the menu key of a column whose menu is empty, and opens nothing', () => {
    render(
      <Orders
        columns={COLUMNS.map((column) => ({
          ...column,
          allowSorting: false,
          allowPinning: false,
          allowReordering: false,
          allowResizing: false,
          allowHiding: false,
        }))}
      />,
    );
    focusTitle('Customer');
    expect(fireEvent.keyDown(document.activeElement!, { key: 'F10', shiftKey: true })).toBe(false);
    expect(shown).toBe(0);
  });

  it('opens on the key only from the title itself, not from a control in it', () => {
    render(<Orders />);
    act(() => title('Customer').querySelector<HTMLElement>('.flg-table-sort')!.focus());
    fireEvent.keyDown(document.activeElement!, { key: 'F10', shiftKey: true });
    expect(shown).toBe(0);
  });

  it('opens at the pointer on a right press on a title, and the browser has no menu there', () => {
    render(<Orders />);
    expect(fireEvent.contextMenu(title('Customer'), { clientX: 140, clientY: 30 })).toBe(false);
    expect(shown).toBe(1);
    expect(more('Customer')!.getAttribute('aria-expanded')).toBe('true');
  });

  it('leaves the right press on the title of the column of boxes to the browser', () => {
    render(<Orders selectionMode="multiple" />);
    expect(fireEvent.contextMenu(titles()[0]!, { clientX: 10, clientY: 10 })).toBe(true);
    expect(shown).toBe(0);
  });

  it('leaves the right press to the browser on a column whose menu is empty', () => {
    render(
      <Orders
        columns={COLUMNS.map((column) => ({
          ...column,
          allowSorting: false,
          allowPinning: false,
          allowReordering: false,
          allowResizing: false,
          allowHiding: false,
        }))}
      />,
    );
    expect(fireEvent.contextMenu(title('Customer'), { clientX: 10, clientY: 10 })).toBe(true);
  });

  it('waits for the end of a press whose contextmenu comes before the button is released', () => {
    render(<Orders />);
    fireEvent.pointerDown(title('Customer'), {
      pointerId: 2,
      pointerType: 'mouse',
      button: 2,
      buttons: 2,
    });
    fireEvent.contextMenu(title('Customer'), { clientX: 140, clientY: 30 });
    expect(shown).toBe(0);
    fireEvent.pointerUp(document, { pointerId: 2, pointerType: 'mouse', button: 2, buttons: 0 });
    expect(shown).toBe(1);
  });

  it('listens for the end of a press on the document the grid is in, not on the global one', () => {
    // A grid rendered into a frame: its press ends in the frame's document, which the global one never sees.
    const frame = document.body.appendChild(document.createElement('iframe'));
    const other = frame.contentDocument!;
    const container = other.body.appendChild(other.createElement('div'));
    const added = vi.spyOn(other, 'addEventListener');
    const global = vi.spyOn(document, 'addEventListener');
    render(<Orders />, { container });
    const customer = Array.from(container.querySelectorAll<HTMLElement>('th')).find((cell) =>
      cell.textContent?.includes('Customer'),
    )!;
    fireEvent.pointerDown(customer, { pointerId: 2, pointerType: 'mouse', button: 2, buttons: 2 });
    expect(added.mock.calls.map((call) => call[0])).toEqual(
      expect.arrayContaining(['pointerup', 'pointercancel']),
    );
    expect(global.mock.calls.map((call) => call[0])).not.toContain('pointerup');
    expect(global.mock.calls.map((call) => call[0])).not.toContain('pointercancel');
    frame.remove();
  });

  it('does not open for a press that was cancelled, and lets go of what it listened to', () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    render(<Orders />);
    fireEvent.pointerDown(title('Customer'), { pointerId: 2, pointerType: 'touch', buttons: 1 });
    fireEvent.pointerCancel(document, { pointerId: 2, pointerType: 'touch' });
    expect(shown).toBe(0);
    expect(remove.mock.calls.map((call) => call[0])).toEqual(
      expect.arrayContaining(['pointerup', 'pointercancel']),
    );
  });

  it('is closed by a second press on the button of the open menu, and does not open again', () => {
    vi.useFakeTimers();
    render(<Orders />);
    click(more('Customer')!);
    expect(more('Customer')!.getAttribute('aria-expanded')).toBe('true');
    click(more('Customer')!);
    expect(more('Customer')!.getAttribute('aria-expanded')).toBe('false');
    act(() => void vi.advanceTimersByTime(50));
    expect(more('Customer')!.getAttribute('aria-expanded')).toBe('false');
    expect(shown).toBe(1);
  });

  it('closes the menu and opens it afresh, a task later, for the button of another column', () => {
    vi.useFakeTimers();
    render(<Orders />);
    click(more('Customer')!);
    click(more('Total')!);
    expect(more('Customer')!.getAttribute('aria-expanded')).toBe('false');
    expect(more('Total')!.getAttribute('aria-expanded')).toBe('false');
    tick();
    expect(more('Customer')!.getAttribute('aria-expanded')).toBe('false');
    expect(more('Total')!.getAttribute('aria-expanded')).toBe('true');
    expect(menu()!.getAttribute('aria-label')).toBe('Total column menu');
    expect(shown).toBe(2);
  });

  it('opens nothing for a grid that is gone before the task of a reopening', () => {
    vi.useFakeTimers();
    const { unmount } = render(<Orders />);
    click(more('Customer')!);
    click(more('Total')!);
    // The second press closes the menu and waits in a timer to reopen it for Total.
    const waiting = vi.getTimerCount();
    unmount();
    // The grid takes that timer away with it (the others that jsdom and React keep are not its).
    expect(vi.getTimerCount()).toBeLessThan(waiting);
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
    expect(shown).toBe(1);
  });

  it('makes no callback by being opened and closed', () => {
    const onColumnLayoutChange = vi.fn();
    const onSortChange = vi.fn();
    const onStateChange = vi.fn();
    render(
      <Orders
        onColumnLayoutChange={onColumnLayoutChange}
        onSortChange={onSortChange}
        onStateChange={onStateChange}
      />,
    );
    click(more('Customer')!);
    click(more('Customer')!);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    expect(onSortChange).not.toHaveBeenCalled();
    expect(onStateChange).not.toHaveBeenCalled();
  });
});

describe('the menu', () => {
  it('is one for the grid, after the frame and outside the table, with the width of the menu of the library', () => {
    render(<Orders />);
    click(more('Customer')!);
    expect(document.querySelectorAll('.flg-data-grid-column-menu')).toHaveLength(1);
    expect(grid().contains(menu())).toBe(false);
    expect(menu()!.getAttribute('role')).toBe('menu');
    expect(menu()!.classList.contains('flg-menu')).toBe(true);
    expect(menu()!.closest('.flg-data-grid')).not.toBeNull();
  });

  it('has the items of crop d for a column that does everything, in groups split by separators', () => {
    render(<Orders />);
    click(more('Customer')!);
    expect(labelsOf()).toEqual([
      'Sort ascending',
      'Sort descending',
      'Clear sorting',
      'Pin to the left',
      'Pin to the right',
      'Move left',
      'Move right',
      'Fit width to content',
      'Hide column',
    ]);
    const parts = Array.from(menu()!.children, (part) => part.getAttribute('role'));
    expect(parts).toEqual([
      'menuitem',
      'menuitem',
      'menuitem',
      'separator',
      'menuitem',
      'menuitem',
      'separator',
      'menuitem',
      'menuitem',
      'menuitem',
      'separator',
      'menuitem',
    ]);
    // Every item has its icon.
    for (const each of items())
      expect(each.querySelector('.flg-menu-item-icon svg')).not.toBeNull();
  });

  it('leaves out a group, and its separator, for what the column does not allow', () => {
    render(
      <Orders
        columns={[{ ...COLUMNS[1]!, allowSorting: false, allowPinning: false, allowHiding: false }]}
      />,
    );
    click(more('Customer')!);
    expect(labelsOf()).toEqual(['Move left', 'Move right', 'Fit width to content']);
    expect(menu()!.querySelectorAll('[role="separator"]')).toHaveLength(0);
  });

  it('says its words in labels', () => {
    render(
      <Orders labels={{ sortAscending: 'A to Z', pinLeft: 'Stick left', hideColumn: 'Remove' }} />,
    );
    click(more('Customer')!);
    expect(labelsOf()).toEqual(
      expect.arrayContaining(['A to Z', 'Stick left', 'Remove', 'Sort descending']),
    );
  });

  it('turns off Clear sorting for a column that is not sorted, and on for one that is', () => {
    vi.useFakeTimers();
    render(<Orders defaultSort={[{ field: 'customer', direction: 'asc' }]} />);
    click(more('Qty')!);
    expect(item('Clear sorting').getAttribute('aria-disabled')).toBe('true');
    tickClosed();
    click(more('Customer')!);
    expect(item('Clear sorting').hasAttribute('aria-disabled')).toBe(false);
  });

  it('turns off the move at the edge of the zone and the side a column is pinned on, and offers Unpin', () => {
    render(<Orders defaultColumnLayout={{ pinned: { id: 'left', customer: 'left' } }} />);
    click(more('Order')!);
    expect(item('Move left').getAttribute('aria-disabled')).toBe('true');
    expect(item('Move right').hasAttribute('aria-disabled')).toBe(false);
    expect(item('Pin to the left').getAttribute('aria-disabled')).toBe('true');
    expect(item('Pin to the right').hasAttribute('aria-disabled')).toBe(false);
    expect(labelsOf()).toContain('Unpin');
  });

  it('has no Unpin for a column that is not pinned, and no Hide for the last column shown', () => {
    render(<Orders defaultColumnLayout={{ hidden: ['id', 'qty', 'total'] }} />);
    click(more('Customer')!);
    expect(labelsOf()).not.toContain('Unpin');
    expect(labelsOf()).not.toContain('Hide column');
  });

  it('is told apart by column: a button of another title opens the menu of that column', () => {
    render(<Orders defaultColumnLayout={{ pinned: { total: 'right' } }} />);
    click(more('Total')!);
    expect(labelsOf()).toContain('Unpin');
    expect(item('Pin to the right').getAttribute('aria-disabled')).toBe('true');
  });

  it('is not reached by the keys of the grid: a key in the menu does not move the active cell', () => {
    render(<Orders />);
    focusTitle('Customer');
    click(more('Customer')!);
    fireEvent.keyDown(items()[0]!, { key: 'ArrowRight' });
    fireEvent.keyDown(items()[0]!, { key: 'End' });
    expect(title('Customer').getAttribute('tabindex')).toBe('0');
    expect(grid().querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });
});

// The browser closes a popover on its own for a press elsewhere and Escape (jsdom does not): the
// stand-in of that is the same as the library's own tests use, a toggle event.
function tickClosed() {
  const panel = menu();
  if (!panel) return;
  fireEvent(panel, Object.assign(new Event('toggle'), { newState: 'closed' }));
}

describe('choosing an item', () => {
  it('Sort ascending sorts by the column alone, once, says it, and closes the menu', () => {
    vi.useFakeTimers();
    const onSortChange = vi.fn();
    const onStateChange = vi.fn();
    render(
      <Orders
        defaultSort={[{ field: 'total', direction: 'desc' }]}
        onSortChange={onSortChange}
        onStateChange={onStateChange}
      />,
    );
    choose('Customer', 'Sort ascending');
    expect(onSortChange).toHaveBeenCalledExactlyOnceWith([{ field: 'customer', direction: 'asc' }]);
    expect(onStateChange).toHaveBeenCalledOnce();
    expect(onStateChange.mock.calls[0]![1]).toBe('sort');
    tick();
    expect(region()).toHaveTextContent('Sorted by Customer, ascending');
    expect(more('Customer')!.getAttribute('aria-expanded')).toBe('false');
    expect(title('Customer').getAttribute('aria-sort')).toBe('ascending');
  });

  it('Sort descending sorts by the column alone', () => {
    const onSortChange = vi.fn();
    render(<Orders onSortChange={onSortChange} />);
    choose('Qty', 'Sort descending');
    expect(onSortChange).toHaveBeenCalledExactlyOnceWith([{ field: 'qty', direction: 'desc' }]);
  });

  it('calls nothing for a sort that is the sort already', () => {
    const onSortChange = vi.fn();
    render(
      <Orders defaultSort={[{ field: 'qty', direction: 'desc' }]} onSortChange={onSortChange} />,
    );
    choose('Qty', 'Sort descending');
    expect(onSortChange).not.toHaveBeenCalled();
  });

  it('Clear sorting takes the level of the column out and keeps the others', () => {
    vi.useFakeTimers();
    const onSortChange = vi.fn();
    render(
      <Orders
        defaultSort={[
          { field: 'customer', direction: 'asc' },
          { field: 'qty', direction: 'desc' },
        ]}
        onSortChange={onSortChange}
      />,
    );
    choose('Customer', 'Clear sorting');
    expect(onSortChange).toHaveBeenCalledExactlyOnceWith([{ field: 'qty', direction: 'desc' }]);
    tick();
    expect(region()).toHaveTextContent('Sorted by Qty, descending');
  });

  it('Clear sorting of the only level says that the sorting is cleared', () => {
    vi.useFakeTimers();
    render(<Orders defaultSort={[{ field: 'customer', direction: 'asc' }]} />);
    choose('Customer', 'Clear sorting');
    tick();
    expect(region()).toHaveTextContent('Sorting cleared');
  });

  it('does nothing for an item that is off', () => {
    const onSortChange = vi.fn();
    render(<Orders onSortChange={onSortChange} />);
    click(more('Customer')!);
    act(() => item('Clear sorting').click());
    expect(onSortChange).not.toHaveBeenCalled();
    expect(more('Customer')!.getAttribute('aria-expanded')).toBe('true');
  });

  it('Pin to the left pins the column to the left zone: one layout change, with the state and the words', () => {
    vi.useFakeTimers();
    const onColumnLayoutChange = vi.fn();
    const onStateChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} onStateChange={onStateChange} />);
    choose('Qty', 'Pin to the left');
    expect(onColumnLayoutChange).toHaveBeenCalledExactlyOnceWith({
      order: ['qty', 'id', 'customer', 'total'],
      widths: { id: 104, customer: 200, qty: 80, total: 120 },
      hidden: [],
      pinned: { qty: 'left' },
    });
    expect(onStateChange).toHaveBeenCalledOnce();
    expect(onStateChange.mock.calls[0]![1]).toBe('columnLayout');
    expect((onStateChange.mock.calls[0]![0] as DataGridState).columnLayout.pinned).toEqual({
      qty: 'left',
    });
    tick();
    expect(region()).toHaveTextContent('Qty pinned to the left');
    expect(captions()[0]).toBe('Qty');
    expect(title('Qty').getAttribute('data-pinned')).toBe('left');
  });

  it('Pin to the right, then Unpin', () => {
    vi.useFakeTimers();
    const onColumnLayoutChange = vi.fn();
    render(<Controlled onChange={onColumnLayoutChange} />);
    choose('Customer', 'Pin to the right');
    expect(onColumnLayoutChange.mock.calls[0]![0].pinned).toEqual({ customer: 'right' });
    expect(onColumnLayoutChange.mock.calls[0]![0].order).toEqual([
      'id',
      'qty',
      'total',
      'customer',
    ]);
    tick();
    expect(region()).toHaveTextContent('Customer pinned to the right');
    choose('Customer', 'Unpin');
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(2);
    expect(onColumnLayoutChange.mock.calls[1]![0].pinned).toEqual({});
    tick();
    expect(region()).toHaveTextContent('Customer unpinned');
  });

  it('Move left and Move right move the column one place, with the words of a move', () => {
    vi.useFakeTimers();
    const onColumnLayoutChange = vi.fn();
    render(<Controlled onChange={onColumnLayoutChange} />);
    choose('Customer', 'Move left');
    expect(onColumnLayoutChange.mock.calls[0]![0].order).toEqual([
      'customer',
      'id',
      'qty',
      'total',
    ]);
    tick();
    expect(region()).toHaveTextContent('Customer moved to column 1 of 4');
    choose('Customer', 'Move right');
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(2);
    expect(onColumnLayoutChange.mock.calls[1]![0].order).toEqual(ORDER);
  });

  it('Fit width to content fits the column: one layout change with a width', () => {
    // jsdom has no layout: a text is 8px a letter, and nothing else is measured.
    Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
      configurable: true,
      value(this: Range) {
        return { width: (this.startContainer.textContent ?? '').length * 8 };
      },
    });
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    choose('Customer', 'Fit width to content');
    expect(onColumnLayoutChange).toHaveBeenCalledOnce();
    expect(onColumnLayoutChange.mock.calls[0]![0].widths.customer).not.toBe(200);
  });

  it('Hide column hides the column: one layout change, the words, and the column is gone', () => {
    vi.useFakeTimers();
    const onColumnLayoutChange = vi.fn();
    render(<Controlled onChange={onColumnLayoutChange} />);
    choose('Customer', 'Hide column');
    expect(onColumnLayoutChange).toHaveBeenCalledOnce();
    expect(onColumnLayoutChange.mock.calls[0]![0].hidden).toEqual(['customer']);
    tick();
    expect(region()).toHaveTextContent('Customer hidden');
    expect(captions()).toEqual(['Order', 'Qty', 'Total']);
  });

  it('says the words of the labels for what it did', () => {
    vi.useFakeTimers();
    render(
      <Orders
        labels={{
          announcePinned: (caption, side) => `${caption} => ${side}`,
          announceHidden: (caption) => `${caption} => hidden`,
        }}
      />,
    );
    choose('Qty', 'Pin to the right');
    tick();
    expect(region()).toHaveTextContent('Qty => right');
    choose('Total', 'Hide column');
    tick();
    expect(region()).toHaveTextContent('Total => hidden');
  });
});

describe('where the focus goes when the menu closes', () => {
  it('goes back to the title the menu was opened for, after an item', () => {
    render(<Orders />);
    focusTitle('Customer');
    choose('Customer', 'Sort descending');
    expect(document.activeElement).toBe(title('Customer'));
  });

  it('goes back to the title after Escape, which the browser answers by closing the popover', () => {
    render(<Orders />);
    focusTitle('Customer');
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown', altKey: true });
    expect(document.activeElement).toBe(items()[0]);
    tickClosed();
    expect(more('Customer')!.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(title('Customer'));
  });

  it('goes to the title of the column that took the place of a column that was hidden', () => {
    render(<Orders />);
    focusTitle('Customer');
    choose('Customer', 'Hide column');
    expect(captions()).toEqual(['Order', 'Qty', 'Total']);
    expect(document.activeElement).toBe(title('Qty'));
    expect(title('Qty').getAttribute('tabindex')).toBe('0');
  });

  it('does not drop to the body when the hide leaves a grid whose menus would be empty', () => {
    // Only hiding is allowed, so the menu of the last column shown has no item: no button, no menu.
    const hideOnly = COLUMNS.slice(0, 2).map((column) => ({
      ...column,
      allowSorting: false,
      allowPinning: false,
      allowReordering: false,
      allowResizing: false,
    }));
    render(<Orders columns={hideOnly} />);
    focusTitle('Customer');
    choose('Customer', 'Hide column');
    expect(captions()).toEqual(['Order']);
    expect(more('Order')).toBeNull();
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(title('Order'));
  });

  it('goes to the title of the column that was pinned, in its new place', () => {
    render(<Orders />);
    focusTitle('Total');
    choose('Total', 'Pin to the left');
    expect(captions()[0]).toBe('Total');
    expect(document.activeElement).toBe(title('Total'));
  });

  it('stays on the title after a press on the button and Escape', () => {
    render(<Orders />);
    click(more('Qty')!);
    tickClosed();
    expect(document.activeElement).toBe(title('Qty'));
  });
});

describe('the lifetime of the menu', () => {
  it('leaves no element of the menu behind when the grid goes, and nothing runs after it', () => {
    vi.useFakeTimers();
    const { unmount } = render(<Orders />);
    click(more('Customer')!);
    unmount();
    expect(menu()).toBeNull();
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
  });

  it('draws no menu items before it is first opened', () => {
    render(<Orders />);
    expect(menu()).not.toBeNull();
    expect(items()).toHaveLength(0);
  });

  it('is not drawn when no column can have one, and appears when a column can', () => {
    const none = COLUMNS.map((column) => ({
      ...column,
      allowSorting: false,
      allowPinning: false,
      allowReordering: false,
      allowResizing: false,
      allowHiding: false,
    }));
    const { rerender } = render(<Orders columns={none} />);
    expect(menu()).toBeNull();
    rerender(<Orders columns={COLUMNS} />);
    expect(menu()).not.toBeNull();
  });
});
