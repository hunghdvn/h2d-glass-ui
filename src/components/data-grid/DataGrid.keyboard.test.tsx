import { act, createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, createRef, useState } from 'react';
import type { Ref } from 'react';
import { createPortal } from 'react-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridHandle, DataGridProps } from './index';

// The keyboard of the grid (spec phase 6 §3.6): one Tab stop, the keys of the APG grid, the cells
// that hold controls, and what the grid leaves alone.

beforeEach(() => {
  resetDevWarnings();
  // jsdom has no layout, so every element would count as hidden to the code that looks for the
  // controls of a cell.
  HTMLElement.prototype.checkVisibility = () => true;
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  vi.restoreAllMocks();
});

interface Order {
  id: string;
  customer: string;
  qty: number;
  total: number;
}

const makeOrders = (count: number): Order[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `DH-${1100 - index}`,
    customer: `Customer ${index + 1}`,
    qty: index + 1,
    total: 1000 * (index + 1),
  }));

const ORDERS = makeOrders(12);

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
  { field: 'customer', caption: 'Customer', width: 200 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
  { field: 'total', caption: 'Total', dataType: 'number', width: 120 },
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
      {...props}
    />
  );
}

const grid = () => screen.getByRole('grid');
const bodyRows = () => Array.from(grid().querySelectorAll<HTMLElement>('tbody > tr'));
const cell = (row: number, column: number) => bodyRows()[row]?.children[column] as HTMLElement;
const head = (caption: string) =>
  Array.from(grid().querySelectorAll<HTMLElement>('thead th')).find((th) =>
    th.textContent?.startsWith(caption),
  )!;
const stops = () => Array.from(grid().querySelectorAll<HTMLElement>('[tabindex="0"]'));
const focusOn = (element: HTMLElement) => act(() => element.focus());
/** A key pressed on `element`; true when the grid handled it, which is when it cancelled it. */
const press = (element: HTMLElement, key: string, init: KeyboardEventInit = {}): boolean => {
  const event = createEvent.keyDown(element, { key, bubbles: true, cancelable: true, ...init });
  act(() => {
    fireEvent(element, event);
  });
  return event.defaultPrevented;
};
const ids = () => bodyRows().map((row) => row.children[0]!.textContent);

const apple = () => vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
const windows = () => vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');

describe('the one Tab stop', () => {
  it('is the first cell of the first row, and every other cell and title is out of the order', () => {
    render(<Orders />);
    expect(bodyRows()).toHaveLength(12);
    expect(stops()).toEqual([cell(0, 0)]);
    const cells = grid().querySelectorAll(
      ':is(thead th, tbody td, tbody th):not(.flg-data-grid-filler)',
    );
    expect(cells).toHaveLength(4 + 12 * 4);
    for (const one of cells) {
      expect(one.getAttribute('tabindex')).toBe(one === cell(0, 0) ? '0' : '-1');
    }
    // The cells of the filler column, which every column having a width adds while the frame is not
    // measured (jsdom), are no stop at all.
    const fillers = grid().querySelectorAll('.flg-data-grid-filler');
    expect(fillers).toHaveLength(1 + 12);
    for (const one of fillers) expect(one).not.toHaveAttribute('tabindex');
  });

  it('takes the sort buttons out of the order too', () => {
    render(<Orders />);
    const buttons = grid().querySelectorAll('thead button');
    expect(buttons).toHaveLength(4);
    for (const button of buttons) expect(button).toHaveAttribute('tabindex', '-1');
  });

  it('is the first title when there is no row, and moves to the first row when one comes', () => {
    const { rerender } = render(<Orders data={[]} />);
    expect(stops()).toEqual([head('Order')]);
    rerender(<Orders data={ORDERS} />);
    expect(stops()).toEqual([cell(0, 0)]);
  });

  it('keeps the frame that scrolls out of the Tab order, with a tabindex it never loses', () => {
    const { rerender } = render(<Orders height={200} />);
    const frame = grid().parentElement!;
    expect(frame).toHaveAttribute('tabindex', '-1');
    expect(frame).not.toHaveAttribute('role');
    rerender(<Orders />);
    expect(frame).toHaveAttribute('tabindex', '-1');
    expect(stops()).toEqual([cell(0, 0)]);
  });

  it('stays one stop after each move, and is the cell that has the focus', async () => {
    const user = userEvent.setup();
    render(<Orders />);
    focusOn(cell(0, 0));
    await user.keyboard('{ArrowRight}');
    expect(stops()).toEqual([cell(0, 1)]);
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(stops()).toEqual([cell(2, 1)]);
    await user.keyboard('{End}');
    expect(stops()).toEqual([cell(2, 3)]);
    expect(document.activeElement).toBe(cell(2, 3));
  });

  it('is reached by Tab from before the grid, and the next Tab leaves it', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button>Before</button>
        <Orders />
        <button>After</button>
      </>,
    );
    await user.tab();
    expect(screen.getByText('Before')).toHaveFocus();
    await user.tab();
    expect(cell(0, 0)).toHaveFocus();
    await user.tab();
    expect(screen.getByText('After')).toHaveFocus();
    await user.tab({ shift: true });
    expect(cell(0, 0)).toHaveFocus();
  });

  it('is the cell that was moved to when Tab comes back', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button>Before</button>
        <Orders />
        <button>After</button>
      </>,
    );
    focusOn(cell(0, 0));
    await user.keyboard('{ArrowDown}{ArrowRight}');
    await user.tab();
    expect(screen.getByText('After')).toHaveFocus();
    await user.tab({ shift: true });
    expect(cell(1, 1)).toHaveFocus();
  });

  it('is the same on the server and in the browser, so a hydration says nothing', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <StrictMode>
        <Orders />
      </StrictMode>,
    );
    expect(stops()).toEqual([cell(0, 0)]);
    expect(error).not.toHaveBeenCalled();
  });
});

describe('the keys of a cell', () => {
  it.each([
    ['ArrowRight', [0, 1]],
    ['ArrowDown', [1, 0]],
    ['End', [0, 3]],
    ['PageDown', [1, 0]],
  ] as const)('%s goes from the first cell to %j and cancels the key', (key, [row, column]) => {
    render(<Orders />);
    focusOn(cell(0, 0));
    expect(press(cell(0, 0), key)).toBe(true);
    expect(document.activeElement).toBe(cell(row, column));
  });

  it('moves right and left along a row, and does not wrap to another row', () => {
    render(<Orders />);
    focusOn(cell(1, 2));
    press(cell(1, 2), 'ArrowRight');
    expect(document.activeElement).toBe(cell(1, 3));
    // At the end of the row the key is still the grid's: a scroll frame would otherwise scroll.
    expect(press(cell(1, 3), 'ArrowRight')).toBe(true);
    expect(document.activeElement).toBe(cell(1, 3));
    press(cell(1, 3), 'ArrowLeft');
    press(cell(1, 2), 'ArrowLeft');
    press(cell(1, 1), 'ArrowLeft');
    expect(document.activeElement).toBe(cell(1, 0));
    expect(press(cell(1, 0), 'ArrowLeft')).toBe(true);
    expect(document.activeElement).toBe(cell(1, 0));
  });

  it('moves down and up a column, from the last row to nowhere and from the first row to the title', () => {
    render(<Orders />);
    focusOn(cell(10, 2));
    press(cell(10, 2), 'ArrowDown');
    expect(document.activeElement).toBe(cell(11, 2));
    expect(press(cell(11, 2), 'ArrowDown')).toBe(true);
    expect(document.activeElement).toBe(cell(11, 2));
    focusOn(cell(0, 2));
    press(cell(0, 2), 'ArrowUp');
    expect(document.activeElement).toBe(head('Qty'));
    expect(stops()).toEqual([head('Qty')]);
    // The title is in a column too: down goes back to the first row, in the same column.
    press(head('Qty'), 'ArrowDown');
    expect(document.activeElement).toBe(cell(0, 2));
    // Up from the title has nowhere to go.
    focusOn(head('Qty'));
    expect(press(head('Qty'), 'ArrowUp')).toBe(true);
    expect(document.activeElement).toBe(head('Qty'));
  });

  it('goes to the first and the last cell of a row with Home and End, in a title row too', () => {
    render(<Orders />);
    focusOn(cell(4, 1));
    press(cell(4, 1), 'End');
    expect(document.activeElement).toBe(cell(4, 3));
    press(cell(4, 3), 'Home');
    expect(document.activeElement).toBe(cell(4, 0));
    focusOn(head('Customer'));
    press(head('Customer'), 'End');
    expect(document.activeElement).toBe(head('Total'));
    press(head('Total'), 'Home');
    expect(document.activeElement).toBe(head('Order'));
  });

  it.each([
    ['Cmd on Apple', apple, { metaKey: true }],
    ['Ctrl elsewhere', windows, { ctrlKey: true }],
  ])(
    'goes to the first cell of the first row and the last cell of the last with %s+Home and +End',
    (_name, platform, mod) => {
      platform();
      render(<Orders />);
      focusOn(cell(5, 2));
      expect(press(cell(5, 2), 'Home', mod)).toBe(true);
      expect(document.activeElement).toBe(cell(0, 0));
      expect(press(cell(0, 0), 'End', mod)).toBe(true);
      expect(document.activeElement).toBe(cell(11, 3));
      // From a title the first row is where the key goes as well.
      focusOn(head('Qty'));
      press(head('Qty'), 'Home', mod);
      expect(document.activeElement).toBe(cell(0, 0));
    },
  );

  it.each([
    ['Ctrl on Apple', apple, { ctrlKey: true }],
    ['Cmd elsewhere', windows, { metaKey: true }],
  ])('leaves %s+Home to the browser', (_name, platform, other) => {
    platform();
    render(<Orders />);
    focusOn(cell(5, 2));
    expect(press(cell(5, 2), 'Home', other)).toBe(false);
    expect(document.activeElement).toBe(cell(5, 2));
  });

  it('goes to the first cell of the first row, not the title, with mod+Home, and is empty-safe', () => {
    windows();
    render(<Orders data={[]} />);
    focusOn(head('Qty'));
    press(head('Qty'), 'End', { ctrlKey: true });
    // There is no row: the key finds nothing, and the focus stays where it is.
    expect(document.activeElement).toBe(head('Qty'));
  });

  it('goes a page of rows with PageDown and PageUp, the rows the frame shows, and keeps the column', () => {
    // A frame of 200px with a title of 40px shows four rows of 40px.
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('flg-table-frame') ? 200 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.tagName === 'THEAD' ? 40 : this.tagName === 'TR' ? 40 : 0;
    });
    const onPageChange = vi.fn();
    render(<Orders paging={{ pageSize: 12 }} onPageChange={onPageChange} height={200} />);
    focusOn(cell(0, 2));
    expect(press(cell(0, 2), 'PageDown')).toBe(true);
    expect(document.activeElement).toBe(cell(4, 2));
    press(cell(4, 2), 'PageDown');
    expect(document.activeElement).toBe(cell(8, 2));
    press(cell(8, 2), 'PageDown');
    expect(document.activeElement).toBe(cell(11, 2));
    expect(press(cell(11, 2), 'PageDown')).toBe(true);
    expect(document.activeElement).toBe(cell(11, 2));
    press(cell(11, 2), 'PageUp');
    expect(document.activeElement).toBe(cell(7, 2));
    press(cell(7, 2), 'PageUp');
    press(cell(3, 2), 'PageUp');
    expect(document.activeElement).toBe(cell(0, 2));
    // The page of the grid is never changed by a key.
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('goes at least one row with PageDown where the frame shows less than one', () => {
    render(<Orders />);
    focusOn(cell(0, 1));
    press(cell(0, 1), 'PageDown');
    expect(document.activeElement).toBe(cell(1, 1));
    press(cell(1, 1), 'PageUp');
    expect(document.activeElement).toBe(cell(0, 1));
  });

  it('goes from a title to a row with PageDown, and stays on the title with PageUp', () => {
    render(<Orders />);
    focusOn(head('Qty'));
    expect(press(head('Qty'), 'PageUp')).toBe(true);
    expect(document.activeElement).toBe(head('Qty'));
    press(head('Qty'), 'PageDown');
    expect(document.activeElement).toBe(cell(0, 2));
  });

  it('does not take a key with Alt, Ctrl or Meta that it has no meaning for', () => {
    render(<Orders />);
    focusOn(cell(2, 1));
    for (const init of [{ altKey: true }, { ctrlKey: true }, { metaKey: true }]) {
      expect(press(cell(2, 1), 'ArrowRight', init)).toBe(false);
      expect(press(cell(2, 1), 'ArrowDown', init)).toBe(false);
    }
    expect(document.activeElement).toBe(cell(2, 1));
  });

  it('does not take a letter', () => {
    render(<Orders />);
    focusOn(cell(2, 1));
    expect(press(cell(2, 1), 'a')).toBe(false);
    expect(press(cell(2, 1), ' ')).toBe(false);
    expect(press(cell(2, 1), 'Tab')).toBe(false);
  });

  it('keeps the place of the row through a sort, since the place is the row and not its index', () => {
    const { rerender } = render(<Orders />);
    focusOn(cell(1, 1));
    // Descending by quantity turns the rows over: the second row is now the eleventh.
    rerender(<Orders sort={[{ field: 'qty', direction: 'desc' }]} />);
    expect(ids()[10]).toBe('DH-1099');
    expect(stops()).toEqual([cell(10, 1)]);
  });

  it('calls a handler of the caller on the root, since a key the grid takes still bubbles', () => {
    const onKeyDown = vi.fn();
    render(<Orders onKeyDown={onKeyDown} />);
    focusOn(cell(0, 0));
    press(cell(0, 0), 'ArrowRight');
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('does what it says on a grid under StrictMode too', () => {
    render(
      <StrictMode>
        <Orders />
      </StrictMode>,
    );
    focusOn(cell(0, 0));
    press(cell(0, 0), 'ArrowDown');
    expect(stops()).toEqual([cell(1, 0)]);
  });
});

describe('the keys of a title', () => {
  it('sorts with Enter: ascending, descending, then back, replacing the sort of other columns', () => {
    render(<Orders />);
    focusOn(head('Qty'));
    expect(press(head('Qty'), 'Enter')).toBe(true);
    expect(head('Qty')).toHaveAttribute('aria-sort', 'ascending');
    press(head('Qty'), 'Enter');
    expect(head('Qty')).toHaveAttribute('aria-sort', 'descending');
    expect(ids()[0]).toBe('DH-1089');
    press(head('Qty'), 'Enter');
    expect(head('Qty')).not.toHaveAttribute('aria-sort');
    press(head('Qty'), 'Enter');
    focusOn(head('Customer'));
    press(head('Customer'), 'Enter');
    expect(head('Qty')).not.toHaveAttribute('aria-sort');
    expect(head('Customer')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('keeps the focus on the title through a sort', () => {
    render(<Orders />);
    focusOn(head('Qty'));
    press(head('Qty'), 'Enter');
    expect(document.activeElement).toBe(head('Qty'));
    expect(stops()).toEqual([head('Qty')]);
  });

  it('adds a level with Shift+Enter, and keeps the others', () => {
    render(<Orders />);
    focusOn(head('Customer'));
    press(head('Customer'), 'Enter');
    focusOn(head('Qty'));
    expect(press(head('Qty'), 'Enter', { shiftKey: true })).toBe(true);
    expect(head('Customer')).toHaveAttribute('aria-sort', 'ascending');
    expect(grid().querySelectorAll('.flg-data-grid-sort-index')).toHaveLength(2);
    // The third press turns the level and the fourth takes it off, as the mouse does.
    press(head('Qty'), 'Enter', { shiftKey: true });
    press(head('Qty'), 'Enter', { shiftKey: true });
    expect(grid().querySelectorAll('.flg-data-grid-sort-index')).toHaveLength(0);
    expect(head('Customer')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('does not sort a column that cannot be sorted, and does not cancel the key', () => {
    render(
      <Orders
        columns={[{ field: 'id', caption: 'Order', allowSorting: false }, ...COLUMNS.slice(1)]}
      />,
    );
    focusOn(head('Order'));
    expect(press(head('Order'), 'Enter')).toBe(false);
    expect(head('Order')).not.toHaveAttribute('aria-sort');
  });

  it('says what a sort by the keyboard did, as the mouse does', async () => {
    render(<Orders />);
    focusOn(head('Qty'));
    press(head('Qty'), 'Enter');
    expect(await screen.findByText('Sorted by Qty, ascending')).toBeInTheDocument();
  });

  it('goes into its button with F2, and back to the title with Esc or F2', () => {
    render(<Orders />);
    focusOn(head('Qty'));
    expect(press(head('Qty'), 'F2')).toBe(true);
    const button = head('Qty').querySelector('button')!;
    expect(document.activeElement).toBe(button);
    // The title is still the cell that is active: its button is what is in it.
    expect(stops()).toEqual([head('Qty')]);
    expect(press(button, 'Escape')).toBe(true);
    expect(document.activeElement).toBe(head('Qty'));
    press(head('Qty'), 'F2');
    expect(press(button, 'F2')).toBe(true);
    expect(document.activeElement).toBe(head('Qty'));
  });

  it('sorts with the button once it has the focus, as any button does', async () => {
    const user = userEvent.setup();
    render(<Orders />);
    focusOn(head('Qty'));
    press(head('Qty'), 'F2');
    await user.keyboard('{Enter}');
    expect(head('Qty')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('does nothing with F2 on a title that has no button', () => {
    render(
      <Orders
        columns={[{ field: 'id', caption: 'Order', allowSorting: false }, ...COLUMNS.slice(1)]}
      />,
    );
    focusOn(head('Order'));
    expect(press(head('Order'), 'F2')).toBe(false);
    expect(document.activeElement).toBe(head('Order'));
  });
});

describe('Enter on a cell', () => {
  it('calls onRowActivate with the row and its key', () => {
    const onRowActivate = vi.fn();
    render(<Orders onRowActivate={onRowActivate} />);
    focusOn(cell(2, 1));
    expect(press(cell(2, 1), 'Enter')).toBe(true);
    expect(onRowActivate).toHaveBeenCalledTimes(1);
    expect(onRowActivate).toHaveBeenCalledWith(ORDERS[2], 'DH-1098');
  });

  it('calls it from the row header cell too', () => {
    const onRowActivate = vi.fn();
    render(<Orders onRowActivate={onRowActivate} />);
    focusOn(cell(0, 0));
    press(cell(0, 0), 'Enter');
    expect(onRowActivate).toHaveBeenCalledWith(ORDERS[0], 'DH-1100');
  });

  it('does nothing, and does not cancel the key, when there is no handler', () => {
    render(<Orders />);
    focusOn(cell(2, 1));
    expect(press(cell(2, 1), 'Enter')).toBe(false);
  });

  it('is not Shift+Enter, which is the sort of a title and nothing on a cell', () => {
    const onRowActivate = vi.fn();
    render(<Orders onRowActivate={onRowActivate} />);
    focusOn(cell(2, 1));
    expect(press(cell(2, 1), 'Enter', { shiftKey: true })).toBe(false);
    expect(onRowActivate).not.toHaveBeenCalled();
  });

  it('is not an activation of the row when a title has it', () => {
    const onRowActivate = vi.fn();
    render(<Orders onRowActivate={onRowActivate} />);
    focusOn(head('Qty'));
    press(head('Qty'), 'Enter');
    expect(onRowActivate).not.toHaveBeenCalled();
  });
});

// A cell with a link and a button in it, one that is only text, and one with a field. A custom
// `cell` is the one place a caller puts controls in the grid.
const WITH_CONTROLS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
  {
    field: 'customer',
    caption: 'Customer',
    width: 200,
    cell: ({ row }) => (
      <>
        <a href={`#${row.id}`}>Open</a>
        <button type="button">Edit</button>
      </>
    ),
  },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
  {
    field: 'total',
    caption: 'Total',
    width: 120,
    cell: ({ row }) => <input aria-label={`Total of ${row.id}`} defaultValue="1" />,
  },
];

describe('cells with controls', () => {
  it('takes the controls out of the Tab order, so Tab stops once in the grid', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button>Before</button>
        <Orders columns={WITH_CONTROLS} />
        <button>After</button>
      </>,
    );
    const links = grid().querySelectorAll('a');
    expect(links).toHaveLength(12);
    for (const link of links) expect(link).toHaveAttribute('tabindex', '-1');
    for (const input of grid().querySelectorAll('input')) {
      expect(input).toHaveAttribute('tabindex', '-1');
    }
    expect(stops()).toEqual([cell(0, 0)]);
    await user.tab();
    await user.tab();
    expect(cell(0, 0)).toHaveFocus();
    await user.tab();
    expect(screen.getByText('After')).toHaveFocus();
  });

  it('does the same under StrictMode, which sets up, tears down and sets up again', () => {
    const { unmount } = render(
      <StrictMode>
        <Orders columns={WITH_CONTROLS} data={ORDERS.slice(0, 2)} />
      </StrictMode>,
    );
    const links = Array.from(grid().querySelectorAll('a'));
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toHaveAttribute('tabindex', '-1');
    unmount();
    for (const link of links) expect(link.hasAttribute('tabindex')).toBe(false);
  });

  it('takes the controls of rows that come later out of the order too', () => {
    const { rerender } = render(<Orders columns={WITH_CONTROLS} data={ORDERS.slice(0, 2)} />);
    expect(grid().querySelectorAll('a')).toHaveLength(2);
    rerender(<Orders columns={WITH_CONTROLS} data={ORDERS} />);
    expect(grid().querySelectorAll('a')).toHaveLength(12);
    for (const link of grid().querySelectorAll('a')) expect(link).toHaveAttribute('tabindex', '-1');
  });

  it('puts the tabindex back on an element it took it from when the grid goes', () => {
    const { unmount } = render(
      <Orders
        data={ORDERS.slice(0, 1)}
        columns={[
          COLUMNS[0]!,
          {
            field: 'customer',
            caption: 'Customer',
            cell: () => (
              <>
                <a href="#a">None</a>
                <button type="button" tabIndex={0}>
                  Zero
                </button>
                {/* A caller's own tabindex, of a kind the grid must give back as it was. */}
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex, jsx-a11y/tabindex-no-positive */}
                <span tabIndex={2}>Two</span>
              </>
            ),
          },
        ]}
      />,
    );
    const link = screen.getByText('None');
    const zero = screen.getByText('Zero');
    const two = screen.getByText('Two');
    expect([link, zero, two].map((el) => el.getAttribute('tabindex'))).toEqual(['-1', '-1', '-1']);
    unmount();
    expect(link.hasAttribute('tabindex')).toBe(false);
    expect(zero.getAttribute('tabindex')).toBe('0');
    expect(two.getAttribute('tabindex')).toBe('2');
  });

  it('keeps a tabindex that the caller changes, and takes it out of the order again', () => {
    function Changing({ index }: { index: number }) {
      return (
        <Orders
          data={ORDERS.slice(0, 1)}
          columns={[
            COLUMNS[0]!,
            {
              field: 'customer',
              caption: 'Customer',
              cell: () => (
                <button type="button" tabIndex={index}>
                  Edit
                </button>
              ),
            },
          ]}
        />
      );
    }
    const { rerender, unmount } = render(<Changing index={0} />);
    const button = screen.getByText('Edit');
    expect(button).toHaveAttribute('tabindex', '-1');
    rerender(<Changing index={3} />);
    expect(button).toHaveAttribute('tabindex', '-1');
    unmount();
    expect(button).toHaveAttribute('tabindex', '3');
  });

  it('does no work for a grid with no custom cell, and does it for one that has', () => {
    const { rerender } = render(<Orders data={ORDERS.slice(0, 2)} />);
    // A control that came into a cell by another way than the grid's own markup.
    const stray = document.createElement('button');
    cell(0, 1).append(stray);
    rerender(<Orders data={ORDERS.slice(0, 3)} />);
    expect(stray).not.toHaveAttribute('tabindex');
    rerender(<Orders data={ORDERS.slice(0, 3)} columns={WITH_CONTROLS} />);
    expect(stray.isConnected).toBe(false);
    const another = document.createElement('button');
    cell(0, 2).append(another);
    rerender(<Orders data={ORDERS.slice(0, 2)} columns={WITH_CONTROLS} />);
    expect(another).toHaveAttribute('tabindex', '-1');
  });

  it.each([
    [
      'a popover',
      <div popover="manual" key="p">
        <input aria-label="Note" />
        <button type="button">Save</button>
      </div>,
    ],
    [
      'a dialog',
      <dialog open key="p">
        <input aria-label="Note" />
        <button type="button">Save</button>
      </dialog>,
    ],
  ])(
    'leaves the controls of %s in a cell in the Tab order: it is a place of its own',
    (_n, popup) => {
      const columns: DataGridColumn<Order>[] = [
        COLUMNS[0]!,
        {
          field: 'customer',
          caption: 'Customer',
          cell: ({ row }) => (row.id === 'DH-1099' ? popup : row.customer),
        },
      ];
      const { rerender } = render(<Orders data={ORDERS.slice(0, 3)} columns={columns} />);
      // A commit of the grid while the popup is there: a parent that draws again, new data.
      rerender(<Orders data={ORDERS.slice(0, 3)} columns={columns} caption="Again" />);
      const note = grid().querySelector('input')!;
      const save = grid().querySelector('[popover] button, dialog button')!;
      expect(note).not.toHaveAttribute('tabindex');
      expect(save).not.toHaveAttribute('tabindex');
    },
  );

  it('takes a control that a cell adds by its own render, with no commit of the grid, out of the order', async () => {
    function Later() {
      const [shown, setShown] = useState(false);
      return shown ? (
        <a href="#later">Track</a>
      ) : (
        <button type="button" onClick={() => setShown(true)}>
          Load
        </button>
      );
    }
    const columns: DataGridColumn<Order>[] = [
      COLUMNS[0]!,
      {
        field: 'customer',
        caption: 'Customer',
        cell: ({ row }) => (row.id === 'DH-1100' ? <Later /> : row.customer),
      },
    ];
    render(<Orders data={ORDERS.slice(0, 2)} columns={columns} />);
    fireEvent.click(screen.getByText('Load'));
    const link = screen.getByText('Track');
    await waitFor(() => expect(link).toHaveAttribute('tabindex', '-1'));
    expect(stops()).toEqual([cell(0, 0)]);
  });

  it('watches the rows for what a cell adds only while a column draws its cells, until the grid goes', () => {
    const watchers: { observe: Mock; disconnect: Mock }[] = [];
    class Watcher {
      observe = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
      constructor() {
        watchers.push(this);
      }
    }
    vi.stubGlobal('MutationObserver', Watcher);
    try {
      const { rerender, unmount } = render(<Orders />);
      expect(watchers).toHaveLength(0);
      rerender(<Orders columns={WITH_CONTROLS} />);
      expect(watchers).toHaveLength(1);
      expect(watchers[0]!.observe).toHaveBeenCalledWith((grid() as HTMLTableElement).tBodies[0], {
        childList: true,
        subtree: true,
      });
      rerender(<Orders />);
      expect(watchers[0]!.disconnect).toHaveBeenCalledTimes(1);
      expect(watchers).toHaveLength(1);
      rerender(<Orders columns={WITH_CONTROLS} />);
      expect(watchers).toHaveLength(2);
      unmount();
      expect(watchers[1]!.disconnect).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('goes into the cell with Enter or F2, to its first control', () => {
    render(<Orders columns={WITH_CONTROLS} />);
    focusOn(cell(1, 1));
    expect(press(cell(1, 1), 'Enter')).toBe(true);
    expect(document.activeElement).toBe(cell(1, 1).querySelector('a'));
    focusOn(cell(2, 3));
    expect(press(cell(2, 3), 'F2')).toBe(true);
    expect(document.activeElement).toBe(cell(2, 3).querySelector('input'));
  });

  it('does not call onRowActivate for a cell that has controls, and does for one that has none', () => {
    const onRowActivate = vi.fn();
    render(<Orders columns={WITH_CONTROLS} onRowActivate={onRowActivate} />);
    focusOn(cell(1, 1));
    press(cell(1, 1), 'Enter');
    expect(onRowActivate).not.toHaveBeenCalled();
    focusOn(cell(1, 2));
    press(cell(1, 2), 'Enter');
    expect(onRowActivate).toHaveBeenCalledTimes(1);
  });

  it('does nothing with F2 on a cell that has none', () => {
    render(<Orders columns={WITH_CONTROLS} />);
    focusOn(cell(1, 2));
    expect(press(cell(1, 2), 'F2')).toBe(false);
    expect(document.activeElement).toBe(cell(1, 2));
  });

  it('cycles with Tab and Shift+Tab inside the cell, and does not leave it', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button>Before</button>
        <Orders columns={WITH_CONTROLS} />
        <button>After</button>
      </>,
    );
    const link = cell(1, 1).querySelector('a')!;
    const edit = cell(1, 1).querySelector('button')!;
    focusOn(cell(1, 1));
    await user.keyboard('{Enter}');
    expect(link).toHaveFocus();
    await user.tab();
    expect(edit).toHaveFocus();
    await user.tab();
    expect(link).toHaveFocus();
    await user.tab({ shift: true });
    expect(edit).toHaveFocus();
    await user.tab({ shift: true });
    expect(link).toHaveFocus();
    // The next one back is the cell's own control, never the cell before it or the button before the grid.
    expect(stops()).toEqual([cell(1, 1)]);
  });

  it('goes back to the cell with Esc or F2, and the cell is a stop again', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button>Before</button>
        <Orders columns={WITH_CONTROLS} />
        <button>After</button>
      </>,
    );
    focusOn(cell(1, 1));
    await user.keyboard('{Enter}{Tab}');
    expect(cell(1, 1).querySelector('button')).toHaveFocus();
    expect(press(document.activeElement as HTMLElement, 'Escape')).toBe(true);
    expect(cell(1, 1)).toHaveFocus();
    await user.keyboard('{F2}');
    expect(cell(1, 1).querySelector('a')).toHaveFocus();
    await user.keyboard('{F2}');
    expect(cell(1, 1)).toHaveFocus();
    await user.tab();
    expect(screen.getByText('After')).toHaveFocus();
  });

  it('leaves Esc to a control whose popup is open, which closes it, and takes the next one', () => {
    function Expanding({ open }: { open: boolean }) {
      return (
        <Orders
          data={ORDERS.slice(0, 2)}
          columns={[
            COLUMNS[0]!,
            {
              field: 'customer',
              caption: 'Customer',
              cell: () => (
                <button type="button" aria-haspopup="listbox" aria-expanded={open}>
                  Pick
                </button>
              ),
            },
          ]}
        />
      );
    }
    const { rerender } = render(<Expanding open />);
    const button = cell(0, 1).querySelector('button')!;
    focusOn(cell(0, 1));
    press(cell(0, 1), 'F2');
    expect(button).toHaveFocus();
    expect(press(button, 'Escape')).toBe(false);
    expect(button).toHaveFocus();
    // The popup is closed now: Esc is the grid's again, and F2 was its own all along.
    rerender(<Expanding open={false} />);
    expect(press(button, 'Escape')).toBe(true);
    expect(cell(0, 1)).toHaveFocus();
    press(cell(0, 1), 'F2');
    rerender(<Expanding open />);
    expect(press(button, 'F2')).toBe(true);
    expect(cell(0, 1)).toHaveFocus();
  });

  it('leaves every other key to the control, which is what a field in a cell needs', async () => {
    const user = userEvent.setup();
    render(<Orders columns={WITH_CONTROLS} />);
    const input = cell(1, 3).querySelector('input')!;
    focusOn(cell(1, 3));
    await user.keyboard('{Enter}');
    expect(input).toHaveFocus();
    for (const key of [
      'ArrowRight',
      'ArrowLeft',
      'ArrowDown',
      'ArrowUp',
      'Home',
      'End',
      'PageDown',
    ]) {
      expect(press(input, key)).toBe(false);
    }
    expect(press(input, 'Enter')).toBe(false);
    await user.keyboard('{End}23');
    expect(input).toHaveValue('123');
    expect(stops()).toEqual([cell(1, 3)]);
  });

  it('runs the own handlers of a control, and Enter on a button in widget mode is the button’s', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Orders
        data={ORDERS.slice(0, 2)}
        columns={[
          COLUMNS[0]!,
          {
            field: 'customer',
            caption: 'Customer',
            cell: () => (
              <button type="button" onClick={onClick}>
                Edit
              </button>
            ),
          },
        ]}
      />,
    );
    focusOn(cell(0, 1));
    await user.keyboard('{Enter}{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    await user.click(screen.getAllByText('Edit')[1]!);
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('makes the cell of a control the active one when the control is pressed', async () => {
    const user = userEvent.setup();
    render(<Orders columns={WITH_CONTROLS} />);
    expect(stops()).toEqual([cell(0, 0)]);
    await user.click(cell(2, 1).querySelector('button')!);
    expect(stops()).toEqual([cell(2, 1)]);
    // Keys on the button are the button's now; Esc brings the focus to the cell.
    expect(press(document.activeElement as HTMLElement, 'ArrowRight')).toBe(false);
    press(document.activeElement as HTMLElement, 'Escape');
    expect(cell(2, 1)).toHaveFocus();
    press(cell(2, 1), 'ArrowRight');
    expect(cell(2, 2)).toHaveFocus();
  });
});

describe('what the grid leaves alone', () => {
  it('ignores a key that something already took', () => {
    render(
      <Orders
        onKeyDownCapture={(event) => {
          if (event.key === 'ArrowRight') event.preventDefault();
        }}
      />,
    );
    focusOn(cell(0, 0));
    press(cell(0, 0), 'ArrowRight');
    expect(document.activeElement).toBe(cell(0, 0));
    press(cell(0, 0), 'ArrowDown');
    expect(document.activeElement).toBe(cell(1, 0));
  });

  it('ignores a key while an input method composes', () => {
    render(<Orders />);
    focusOn(cell(0, 0));
    expect(press(cell(0, 0), 'ArrowRight', { isComposing: true })).toBe(false);
    expect(press(cell(0, 0), 'ArrowRight', { keyCode: 229 })).toBe(false);
    expect(document.activeElement).toBe(cell(0, 0));
  });

  it.each([
    [
      'a popover',
      <div popover="manual" key="p">
        <button id="inside">Pick</button>
      </div>,
    ],
    [
      'a dialog',
      <dialog open key="p">
        <button id="inside">Pick</button>
      </dialog>,
    ],
  ])('ignores every key from %s inside a cell, Esc, F2 and Tab included', (_name, popup) => {
    render(
      <Orders
        data={ORDERS.slice(0, 3)}
        columns={[
          COLUMNS[0]!,
          {
            field: 'customer',
            caption: 'Customer',
            cell: ({ row }) => (row.id === 'DH-1099' ? popup : row.customer),
          },
          ...COLUMNS.slice(2),
        ]}
      />,
    );
    const inside = grid().querySelector<HTMLElement>('#inside')!;
    focusOn(inside);
    for (const key of ['ArrowRight', 'ArrowDown', 'Home', 'Enter', 'F2', 'Escape', 'Tab']) {
      expect(press(inside, key)).toBe(false);
    }
    expect(document.activeElement).toBe(inside);
    // And the press that put the focus there did not make the cell the active one.
    expect(stops()).toEqual([cell(0, 0)]);
  });

  it('does not make a cell active for a press in a popup in it', async () => {
    const user = userEvent.setup();
    render(
      <Orders
        data={ORDERS.slice(0, 3)}
        columns={[
          COLUMNS[0]!,
          {
            field: 'customer',
            caption: 'Customer',
            cell: () => (
              <span>
                <button type="button">Menu</button>
                <div popover="manual">
                  <button type="button">Item</button>
                </div>
              </span>
            ),
          },
        ]}
      />,
    );
    await user.click(screen.getAllByText('Menu')[1]!);
    expect(stops()).toEqual([cell(1, 1)]);
    // `getAllByText` sees through a closed popover in jsdom, which shows none.
    await user.click(screen.getAllByText('Item')[2]!);
    expect(stops()).toEqual([cell(1, 1)]);
  });

  it('leaves the keys of a grid in a cell to that grid', () => {
    render(
      <Orders
        data={ORDERS.slice(0, 2)}
        columns={[
          COLUMNS[0]!,
          {
            field: 'customer',
            caption: 'Customer',
            cell: ({ row }) =>
              row.id === 'DH-1100' ? (
                <DataGrid
                  data={ORDERS.slice(5, 8)}
                  rowKey="id"
                  columns={COLUMNS}
                  aria-label="Inner"
                  paging={false}
                />
              ) : (
                row.customer
              ),
          },
        ]}
      />,
    );
    const inner = screen.getByRole('grid', { name: 'Inner' });
    const innerCell = inner.querySelector<HTMLElement>(':scope > tbody td')!;
    focusOn(innerCell);
    press(innerCell, 'ArrowDown');
    // The inner grid moved; the outer grid's cell is still its stop, and no key of the inner one moved it.
    expect(document.activeElement).toBe(
      inner.querySelectorAll<HTMLElement>(':scope > tbody > tr')[1]!.children[1],
    );
    const outer = screen.getByRole('grid', { name: 'Orders' });
    expect(outer.querySelectorAll(':scope > tbody > tr > [tabindex="0"]')).toHaveLength(1);
    expect(outer.querySelector(':scope > tbody > tr:first-child > th')).toHaveAttribute(
      'tabindex',
      '0',
    );
  });
});

describe('where the active cell goes when its row does', () => {
  const without = (...omit: string[]) => ORDERS.filter((order) => !omit.includes(order.id));

  it('moves to the row at the same place, and the focus follows it', () => {
    const { rerender } = render(<Orders />);
    focusOn(cell(3, 2));
    expect(ids()[3]).toBe('DH-1097');
    rerender(<Orders data={without('DH-1097')} />);
    expect(ids()[3]).toBe('DH-1096');
    expect(stops()).toEqual([cell(3, 2)]);
    expect(document.activeElement).toBe(cell(3, 2));
  });

  it('moves to the last row when the last row was the one', () => {
    const { rerender } = render(<Orders />);
    focusOn(cell(11, 1));
    rerender(<Orders data={ORDERS.slice(0, 11)} />);
    expect(stops()).toEqual([cell(10, 1)]);
    expect(document.activeElement).toBe(cell(10, 1));
  });

  it('moves to the title when no row is left, with the focus', () => {
    const { rerender } = render(<Orders />);
    focusOn(cell(2, 3));
    rerender(<Orders data={[]} />);
    expect(stops()).toEqual([head('Total')]);
    expect(document.activeElement).toBe(head('Total'));
  });

  it('stays on the title when the focus came to it, and goes back to the row if it did not', () => {
    const { rerender } = render(
      <>
        <button>Outside</button>
        <Orders />
      </>,
    );
    focusOn(cell(2, 3));
    rerender(
      <>
        <button>Outside</button>
        <Orders data={[]} />
      </>,
    );
    expect(stops()).toEqual([head('Total')]);
    rerender(
      <>
        <button>Outside</button>
        <Orders />
      </>,
    );
    expect(stops()).toEqual([head('Total')]);
    // With the focus elsewhere, the place waits for its row.
    focusOn(cell(0, 0));
    focusOn(cell(2, 3));
    focusOn(screen.getByText('Outside'));
    rerender(
      <>
        <button>Outside</button>
        <Orders data={[]} />
      </>,
    );
    rerender(
      <>
        <button>Outside</button>
        <Orders />
      </>,
    );
    expect(stops()).toEqual([cell(2, 3)]);
  });

  it('does not take the focus from where it is when it was not in the grid', () => {
    const { rerender } = render(
      <>
        <button>Outside</button>
        <Orders />
      </>,
    );
    focusOn(cell(3, 2));
    focusOn(screen.getByText('Outside'));
    rerender(
      <>
        <button>Outside</button>
        <Orders data={without('DH-1097')} />
      </>,
    );
    expect(document.activeElement).toBe(screen.getByText('Outside'));
    expect(stops()).toEqual([cell(3, 2)]);
  });

  it('does not pull the focus in when it never was in the grid', () => {
    const page = (data: Order[]) => (
      <>
        <button>Outside</button>
        <Orders data={data} />
      </>
    );
    const { rerender } = render(page(ORDERS));
    focusOn(screen.getByText('Outside'));
    rerender(page(without('DH-1100')));
    expect(document.activeElement).toBe(screen.getByText('Outside'));
    rerender(page([]));
    expect(document.activeElement).toBe(screen.getByText('Outside'));
  });

  // A cell that opens a field in a React portal, outside the table: a third-party popover, say.
  function Portalled() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open
        </button>
        {open ? createPortal(<input aria-label="In a portal" />, document.body) : null}
      </>
    );
  }
  const PORTALLED: DataGridColumn<Order>[] = [
    COLUMNS[0]!,
    {
      field: 'customer',
      caption: 'Customer',
      cell: ({ row }) => (row.id === 'DH-1099' ? <Portalled /> : row.customer),
    },
    ...COLUMNS.slice(2),
  ];

  it('leaves the focus in a portal a cell opened when the grid draws again', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Orders columns={PORTALLED} />);
    await user.click(screen.getByText('Open'));
    const field = screen.getByLabelText('In a portal');
    await user.click(field);
    expect(field).toHaveFocus();
    // The page draws the grid again, as a field whose value is lifted to the page does on each key.
    rerender(<Orders columns={PORTALLED} caption="Orders again" />);
    expect(field).toHaveFocus();
    await user.keyboard('ab');
    expect(field).toHaveValue('ab');
  });

  it('follows its row with the focus again once the focus came back from a portal into the grid', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Orders columns={PORTALLED} />);
    await user.click(screen.getByText('Open'));
    await user.click(screen.getByLabelText('In a portal'));
    // Back into the grid, from the portal: its blur is no leaving of the grid.
    focusOn(cell(3, 2));
    rerender(<Orders columns={PORTALLED} data={without('DH-1097')} />);
    expect(cell(3, 2)).toHaveFocus();
    expect(ids()[3]).toBe('DH-1096');
  });

  it('keeps the place at the same index when a page comes in which the row is not', () => {
    const { rerender } = render(<Orders paging={{ pageSize: 5 }} page={{ index: 0, size: 5 }} />);
    focusOn(cell(3, 1));
    rerender(<Orders paging={{ pageSize: 5 }} page={{ index: 1, size: 5 }} />);
    expect(ids()).toEqual(['DH-1095', 'DH-1094', 'DH-1093', 'DH-1092', 'DH-1091']);
    expect(stops()).toEqual([cell(3, 1)]);
  });

  it('is on the first cell of the first row at first, and when the column goes, on the first column', () => {
    const { rerender } = render(<Orders />);
    focusOn(cell(2, 3));
    rerender(<Orders columns={COLUMNS.slice(0, 2)} />);
    expect(stops()).toEqual([cell(2, 0)]);
  });
});

describe('the pointer', () => {
  it('makes a cell the active one when it is pressed', async () => {
    const user = userEvent.setup();
    render(<Orders />);
    await user.click(cell(4, 2));
    expect(stops()).toEqual([cell(4, 2)]);
    expect(cell(4, 2)).toHaveFocus();
    await user.click(head('Total'));
    expect(stops()).toEqual([head('Total')]);
  });

  it('calls onRowActivate on a double press on a row, and not on a control of a cell', async () => {
    const user = userEvent.setup();
    const onRowActivate = vi.fn();
    render(<Orders columns={WITH_CONTROLS} onRowActivate={onRowActivate} />);
    await user.dblClick(cell(2, 2));
    expect(onRowActivate).toHaveBeenCalledTimes(1);
    expect(onRowActivate).toHaveBeenCalledWith(ORDERS[2], 'DH-1098');
    await user.dblClick(cell(3, 1).querySelector('button')!);
    await user.dblClick(cell(3, 1).querySelector('a')!);
    await user.dblClick(cell(3, 3).querySelector('input')!);
    expect(onRowActivate).toHaveBeenCalledTimes(1);
  });

  it('does not call onRowActivate for a double press on a title', async () => {
    const user = userEvent.setup();
    const onRowActivate = vi.fn();
    render(<Orders onRowActivate={onRowActivate} />);
    await user.dblClick(head('Qty'));
    expect(onRowActivate).not.toHaveBeenCalled();
  });

  it('calls it for a double press on the cell that is active, which is a stop and not a control', async () => {
    const user = userEvent.setup();
    const onRowActivate = vi.fn();
    render(<Orders onRowActivate={onRowActivate} />);
    expect(stops()).toEqual([cell(0, 0)]);
    await user.dblClick(cell(0, 0));
    expect(onRowActivate).toHaveBeenCalledWith(ORDERS[0], 'DH-1100');
  });

  it('leaves the focus on the title after a press on its sort button: the arrows move, Tab leaves', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Orders />
        <button>After</button>
      </>,
    );
    await user.click(head('Qty').querySelector('button')!);
    expect(head('Qty')).toHaveAttribute('aria-sort', 'ascending');
    expect(head('Qty')).toHaveFocus();
    expect(stops()).toEqual([head('Qty')]);
    await user.keyboard('{ArrowDown}');
    expect(cell(0, 2)).toHaveFocus();
    await user.click(head('Total').querySelector('button')!);
    expect(head('Total')).toHaveFocus();
    await user.tab();
    expect(screen.getByText('After')).toHaveFocus();
  });

  it('leaves the focus on the title after a press with Shift or the modifier outside its button', () => {
    windows();
    render(<Orders />);
    focusOn(cell(2, 1));
    // A press on the cell of a title, not on its button: the browser would start a text selection
    // with Shift, so its `mousedown` is cancelled and the title is focused by hand. It does not sort.
    for (const [init, caption] of [
      [{ shiftKey: true }, 'Qty'],
      [{ ctrlKey: true }, 'Total'],
    ] as const) {
      expect(fireEvent.mouseDown(head(caption), init)).toBe(false);
      expect(head(caption)).toHaveFocus();
      expect(stops()).toEqual([head(caption)]);
      fireEvent.click(head(caption), init);
      expect(head(caption)).not.toHaveAttribute('aria-sort');
    }
    // A plain press is left to the browser, which focuses the title, its own home.
    expect(fireEvent.mouseDown(head('Order'))).toBe(true);
    // Another mouse button is not a press.
    expect(fireEvent.mouseDown(head('Order'), { shiftKey: true, button: 2 })).toBe(true);
  });

  it('leaves the focus on the title after a press with Shift or the modifier on its sort button', async () => {
    windows();
    const user = userEvent.setup();
    render(<Orders />);
    await user.click(head('Qty').querySelector('button')!);
    for (const [key, caption] of [
      ['Shift', 'Total'],
      ['Control', 'Order'],
    ] as const) {
      await user.keyboard(`{${key}>}`);
      await user.click(head(caption).querySelector('button')!);
      await user.keyboard(`{/${key}}`);
      expect(head(caption)).toHaveFocus();
      expect(stops()).toEqual([head(caption)]);
    }
    expect(grid().querySelectorAll('.flg-data-grid-sort-index')).toHaveLength(3);
    expect(press(head('Order'), 'ArrowRight')).toBe(true);
    expect(head('Customer')).toHaveFocus();
  });
});

// Every column here has a width and jsdom measures no frame, so the rows end in a cell of the
// filler column (spec phase 6 §3.7): it is no column of the grid, and nothing the keyboard or a
// press does reaches it.
describe('the filler column', () => {
  const filler = (row: number) => bodyRows()[row]!.lastElementChild as HTMLElement;

  it('is past the last cell for the arrows, End and mod+End, in the rows and in the titles', () => {
    windows();
    render(<Orders />);
    expect(filler(0)).toHaveClass('flg-data-grid-filler');
    focusOn(cell(2, 0));
    expect(press(cell(2, 0), 'End')).toBe(true);
    expect(cell(2, 3)).toHaveFocus();
    press(cell(2, 3), 'ArrowRight');
    expect(cell(2, 3)).toHaveFocus();
    press(cell(2, 3), 'End', { ctrlKey: true });
    expect(cell(11, 3)).toHaveFocus();
    press(cell(11, 3), 'Home', { ctrlKey: true });
    press(cell(0, 0), 'ArrowUp');
    press(head('Order'), 'End');
    expect(head('Total')).toHaveFocus();
    press(head('Total'), 'ArrowRight');
    expect(head('Total')).toHaveFocus();
    expect(stops()).toEqual([head('Total')]);
  });

  it('takes a press that does nothing: no focus, no active cell, no choice, no activation', async () => {
    const user = userEvent.setup();
    const onSelectedKeysChange = vi.fn();
    const onRowActivate = vi.fn();
    render(
      <Orders
        selectionMode="single"
        onSelectedKeysChange={onSelectedKeysChange}
        onRowActivate={onRowActivate}
      />,
    );
    focusOn(cell(2, 1));
    // Its `mousedown` is cancelled, so the browser moves no focus: not to the frame either, whose
    // `tabindex="-1"` would take it.
    expect(fireEvent.mouseDown(filler(5))).toBe(false);
    await user.click(filler(5));
    await user.dblClick(filler(6));
    await user.click(grid().querySelector<HTMLElement>('thead .flg-data-grid-filler')!);
    fireEvent.mouseDown(filler(7), { shiftKey: true });
    expect(stops()).toEqual([cell(2, 1)]);
    expect(cell(2, 1)).toHaveFocus();
    expect(onSelectedKeysChange).not.toHaveBeenCalled();
    expect(onRowActivate).not.toHaveBeenCalled();
  });
});

describe('moving the focus', () => {
  it('focuses without the browser scrolling, then scrolls the cell into view the least it takes', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    render(<Orders />);
    focusOn(cell(0, 0));
    focus.mockClear();
    scrollIntoView.mockClear();
    press(cell(0, 0), 'ArrowDown');
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(focus.mock.contexts[0]).toBe(cell(1, 0));
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
    expect(scrollIntoView.mock.contexts[0]).toBe(cell(1, 0));
  });

  it('works where the browser has no scrollIntoView', () => {
    render(<Orders />);
    focusOn(cell(0, 0));
    expect(() => press(cell(0, 0), 'ArrowDown')).not.toThrow();
    expect(document.activeElement).toBe(cell(1, 0));
  });
});

describe('the handle', () => {
  it('focuses the active cell with focus(), and scrolls it into view', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} />);
    expect(document.body).toHaveFocus();
    act(() => ref.current!.focus());
    expect(cell(0, 0)).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
    focusOn(cell(0, 0));
    press(cell(0, 0), 'ArrowDown');
    press(cell(1, 0), 'ArrowRight');
    act(() => (document.activeElement as HTMLElement).blur());
    act(() => ref.current!.focus());
    expect(cell(1, 1)).toHaveFocus();
  });

  it('focuses the first title when there is no row', () => {
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} data={[]} />);
    act(() => ref.current!.focus());
    expect(head('Order')).toHaveFocus();
  });

  it('is the same object for as long as the grid lives', () => {
    const ref = createRef<DataGridHandle>();
    const { rerender } = render(<Orders gridRef={ref} />);
    const first = ref.current;
    rerender(<Orders gridRef={ref} data={ORDERS.slice(0, 3)} />);
    expect(ref.current).toBe(first);
    act(() => ref.current!.focus());
    expect(cell(0, 0)).toHaveFocus();
  });
});
