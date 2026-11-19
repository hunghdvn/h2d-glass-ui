import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import type { Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type {
  DataGridColumn,
  DataGridHandle,
  DataGridKey,
  DataGridProps,
  DataGridState,
} from './index';

// Choosing rows (spec phase 6 §3.6 and §6.3, "Chọn dòng"): the two modes, the box in each row and in
// the title, the ranges, the keys, what a press on a control in a cell does, and what is kept.

beforeEach(() => {
  resetDevWarnings();
  // jsdom has no layout, so every element would count as hidden to the code that looks for the
  // controls of a cell.
  HTMLElement.prototype.checkVisibility = () => true;
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  vi.restoreAllMocks();
  vi.useRealTimers();
});

interface Order {
  id: string;
  customer: string;
  qty: number;
}

const makeOrders = (count: number): Order[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `DH-${1100 - index}`,
    customer: `Customer ${index + 1}`,
    qty: (index * 7) % 10,
  }));

const ORDERS = makeOrders(12);
const key = (index: number) => `DH-${1100 - index}`;

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
  { field: 'customer', caption: 'Customer', width: 200 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
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
const boxes = () => Array.from(grid().querySelectorAll<HTMLInputElement>('tbody input'));
const box = (row: number) => bodyRows()[row]!.querySelector<HTMLInputElement>('input')!;
const headBox = () => grid().querySelector<HTMLInputElement>('thead input')!;
// The titles of the columns: every column here has a width and jsdom measures no frame, so the
// filler column ends the heading.
const titles = () => grid().querySelectorAll('thead th:not(.flg-data-grid-filler)');
const chosen = () =>
  bodyRows().flatMap((row, index) => (row.getAttribute('aria-selected') === 'true' ? [index] : []));
const stops = () => Array.from(grid().querySelectorAll<HTMLElement>('[tabindex="0"]'));
const live = () => (grid().closest('.flg-data-grid')!.lastElementChild as HTMLElement).textContent;
const flush = () => act(() => void vi.advanceTimersByTime(10));

/** A key pressed on `element`; true when the grid handled it, which is when it cancelled it. */
const press = (element: HTMLElement, name: string, init: KeyboardEventInit = {}): boolean => {
  const event = createEvent.keyDown(element, {
    key: name,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  act(() => {
    fireEvent(element, event);
  });
  return event.defaultPrevented;
};
const apple = () => vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');

const shiftClick = async (user: ReturnType<typeof userEvent.setup>, element: HTMLElement) => {
  await user.keyboard('{Shift>}');
  await user.click(element);
  await user.keyboard('{/Shift}');
};

describe('no selection', () => {
  it('has no sign of one: no aria-selected, no boxes, no aria-multiselectable', () => {
    render(<Orders />);
    expect(grid()).not.toHaveAttribute('aria-multiselectable');
    for (const row of bodyRows()) {
      expect(row).not.toHaveAttribute('aria-selected');
      expect(row).not.toHaveAttribute('data-selected');
    }
    expect(grid().querySelectorAll('input')).toHaveLength(0);
  });

  it('chooses nothing and cancels nothing on a press or a Space', async () => {
    const onChange = vi.fn();
    render(<Orders onSelectedKeysChange={onChange} />);
    await userEvent.setup().click(cell(1, 1));
    expect(press(cell(1, 1), ' ')).toBe(false);
    expect(press(cell(1, 1), 'a', { ctrlKey: true })).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('draws the same columns it always did', () => {
    render(<Orders />);
    expect(titles()).toHaveLength(3);
    // The three columns, and the filler column.
    expect(grid().querySelectorAll('col')).toHaveLength(4);
  });
});

describe('single', () => {
  it('has no column of boxes, and marks every row, chosen or not, with aria-selected', () => {
    render(<Orders selectionMode="single" defaultSelectedKeys={[key(2)]} />);
    expect(grid().querySelectorAll('input')).toHaveLength(0);
    expect(grid()).not.toHaveAttribute('aria-multiselectable');
    expect(titles()).toHaveLength(3);
    expect(bodyRows().map((row) => row.getAttribute('aria-selected'))).toEqual(
      ORDERS.map((_, index) => (index === 2 ? 'true' : 'false')),
    );
    expect(bodyRows()[2]).toHaveAttribute('data-selected');
    expect(bodyRows()[1]).not.toHaveAttribute('data-selected');
  });

  it('chooses the row that is pressed, and takes the choice off the one that had it', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Orders selectionMode="single" onSelectedKeysChange={onChange} />);
    await user.click(cell(1, 1));
    expect(chosen()).toEqual([1]);
    expect(onChange).toHaveBeenLastCalledWith([key(1)]);
    await user.click(cell(3, 2));
    expect(chosen()).toEqual([3]);
    expect(onChange).toHaveBeenLastCalledWith([key(3)]);
  });

  it('leaves a chosen row chosen when it is pressed again, and says nothing', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Orders
        selectionMode="single"
        defaultSelectedKeys={[key(1)]}
        onSelectedKeysChange={onChange}
      />,
    );
    await user.click(cell(1, 1));
    expect(chosen()).toEqual([1]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('chooses with Space on a cell, and cancels the key', () => {
    render(<Orders selectionMode="single" />);
    act(() => cell(2, 1).focus());
    expect(press(cell(2, 1), ' ')).toBe(true);
    expect(chosen()).toEqual([2]);
  });

  it('does not choose by a press when selectOnRowClick is false, but still by Space', async () => {
    render(<Orders selectionMode="single" selectOnRowClick={false} />);
    await userEvent.setup().click(cell(1, 1));
    expect(chosen()).toEqual([]);
    act(() => cell(1, 1).focus());
    press(cell(1, 1), ' ');
    expect(chosen()).toEqual([1]);
  });

  it('does not take a Shift press for a range', async () => {
    render(<Orders selectionMode="single" defaultSelectedKeys={[key(1)]} />);
    await shiftClick(userEvent.setup(), cell(4, 1));
    expect(chosen()).toEqual([4]);
  });
});

describe('multiple: the column of boxes', () => {
  it('has a column of 40px first, with a box in each row and one in the title', () => {
    render(<Orders selectionMode="multiple" />);
    expect(grid()).toHaveAttribute('aria-multiselectable', 'true');
    expect(titles()).toHaveLength(4);
    const cols = grid().querySelectorAll('col');
    expect(cols).toHaveLength(5);
    expect(cols[0]).toHaveStyle({ width: '40px' });
    expect(boxes()).toHaveLength(12);
    expect(headBox()).toBeInTheDocument();
    expect(bodyRows()[0]!.children).toHaveLength(5);
  });

  it('names each box after the row header of its row, or after its key when there is none', () => {
    const { unmount } = render(<Orders selectionMode="multiple" />);
    expect(box(0)).toHaveAccessibleName('Select DH-1100');
    expect(box(11)).toHaveAccessibleName('Select DH-1089');
    unmount();
    render(<Orders selectionMode="multiple" columns={COLUMNS.slice(1)} />);
    expect(box(0)).toHaveAccessibleName('Select DH-1100');
  });

  it('names the boxes with the labels, which are merged over the defaults', () => {
    render(
      <Orders
        selectionMode="multiple"
        labels={{ selectRow: (name) => `Chọn ${name}`, selectAllOnPage: 'Chọn cả trang' }}
      />,
    );
    expect(box(0)).toHaveAccessibleName('Chọn DH-1100');
    expect(headBox()).toHaveAccessibleName('Chọn cả trang');
  });

  it('names the box of the title by what it chooses: the page, or every row', () => {
    const { rerender } = render(<Orders selectionMode="multiple" />);
    expect(headBox()).toHaveAccessibleName('Select all rows on this page');
    rerender(<Orders selectionMode="multiple" selectAllMode="all" />);
    expect(headBox()).toHaveAccessibleName('Select all rows');
  });

  it('gives the title of the column words a screen reader reads, and no title a sighted user sees', () => {
    render(<Orders selectionMode="multiple" />);
    const title = grid().querySelector('thead th')!;
    expect(title).toHaveAttribute('scope', 'col');
    expect(title.textContent).toBe('Select all rows on this page');
    expect(title.querySelector('.flg-visually-hidden')).not.toBeNull();
  });

  it('puts the box in each row at the checked state of the row', () => {
    render(<Orders selectionMode="multiple" defaultSelectedKeys={[key(1), key(5)]} />);
    expect(boxes().flatMap((one, index) => (one.checked ? [index] : []))).toEqual([1, 5]);
    expect(chosen()).toEqual([1, 5]);
  });

  it('is not sortable and has no sort button', () => {
    render(<Orders selectionMode="multiple" />);
    expect(titles()[0]!.querySelector('button')).toBeNull();
  });

  it('adds and takes away the column as the mode changes', () => {
    const { rerender } = render(<Orders selectionMode="multiple" />);
    expect(boxes()).toHaveLength(12);
    rerender(<Orders selectionMode="single" />);
    expect(grid().querySelectorAll('input')).toHaveLength(0);
    expect(titles()).toHaveLength(3);
    rerender(<Orders selectionMode="multiple" />);
    expect(boxes()).toHaveLength(12);
  });

  it('takes a value outside the union for none', () => {
    // @ts-expect-error a value outside the union
    render(<Orders selectionMode="all" />);
    expect(grid().querySelectorAll('input')).toHaveLength(0);
    expect(grid()).not.toHaveAttribute('aria-selected');
  });

  it('gives a custom cell the chosen state of its row', () => {
    const seen: boolean[] = [];
    render(
      <Orders
        selectionMode="multiple"
        defaultSelectedKeys={[key(0)]}
        columns={[
          { field: 'id', caption: 'Order', rowHeader: true },
          {
            field: 'customer',
            caption: 'Customer',
            cell: (ctx) => {
              seen.push(ctx.selected);
              return ctx.text;
            },
          },
        ]}
      />,
    );
    expect(seen.filter(Boolean)).toHaveLength(1);
    expect(seen).toHaveLength(12);
  });
});

describe('multiple: choosing by the box and by a press', () => {
  it('chooses a row by its box, and takes it off by the box again', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Orders selectionMode="multiple" onSelectedKeysChange={onChange} />);
    await user.click(box(2));
    await user.click(box(5));
    expect(chosen()).toEqual([2, 5]);
    expect(onChange).toHaveBeenLastCalledWith([key(2), key(5)]);
    await user.click(box(2));
    expect(chosen()).toEqual([5]);
    expect(onChange).toHaveBeenLastCalledWith([key(5)]);
  });

  it('chooses nothing by a press on the row, by default', async () => {
    render(<Orders selectionMode="multiple" />);
    await userEvent.setup().click(cell(2, 2));
    expect(chosen()).toEqual([]);
  });

  it('toggles by a press on the row when selectOnRowClick is true, as its box would', async () => {
    const user = userEvent.setup();
    render(<Orders selectionMode="multiple" selectOnRowClick />);
    await user.click(cell(2, 2));
    await user.click(cell(4, 1));
    expect(chosen()).toEqual([2, 4]);
    await user.click(cell(2, 2));
    expect(chosen()).toEqual([4]);
  });

  it('chooses once by a double press that activates the row: its second click is not a press', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onRowActivate = vi.fn();
    render(
      <Orders
        selectionMode="multiple"
        selectOnRowClick
        onSelectedKeysChange={onChange}
        onRowActivate={onRowActivate}
      />,
    );
    await user.dblClick(cell(2, 2));
    expect(chosen()).toEqual([2]);
    expect(onChange).toHaveBeenCalledExactlyOnceWith([key(2)]);
    expect(onRowActivate).toHaveBeenCalledExactlyOnceWith(ORDERS[2], key(2));
    // A click of the keyboard (Enter on a link, a screen reader's) has no count, and is a press.
    fireEvent.click(cell(2, 2), { detail: 0 });
    expect(chosen()).toEqual([]);
  });

  it('chooses once by a double press in single mode too, with onRowActivate', async () => {
    const onChange = vi.fn();
    render(
      <Orders selectionMode="single" onSelectedKeysChange={onChange} onRowActivate={() => {}} />,
    );
    await userEvent.setup().dblClick(cell(4, 1));
    expect(chosen()).toEqual([4]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('takes a quick second press as a press of its own without onRowActivate', async () => {
    const onChange = vi.fn();
    render(<Orders selectionMode="multiple" selectOnRowClick onSelectedKeysChange={onChange} />);
    await userEvent.setup().dblClick(cell(2, 2));
    expect(chosen()).toEqual([]);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('does one thing by a press on the box, even with selectOnRowClick: it does not toggle twice', async () => {
    const onChange = vi.fn();
    render(<Orders selectionMode="multiple" selectOnRowClick onSelectedKeysChange={onChange} />);
    await userEvent.setup().click(box(3));
    expect(chosen()).toEqual([3]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('chooses by a press on the label of the box too, once', async () => {
    const onChange = vi.fn();
    render(<Orders selectionMode="multiple" selectOnRowClick onSelectedKeysChange={onChange} />);
    await userEvent.setup().click(box(3).closest('label')!);
    expect(chosen()).toEqual([3]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('chooses nothing by a press on a link or a button in a cell, in either mode', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const columns: DataGridColumn<Order>[] = [
      { field: 'id', caption: 'Order', rowHeader: true },
      {
        field: 'customer',
        caption: 'Customer',
        cell: ({ text }) => (
          <span>
            <a href="#order">{text}</a> <button type="button">Open</button>
          </span>
        ),
      },
    ];
    const { rerender } = render(
      <Orders
        selectionMode="multiple"
        selectOnRowClick
        columns={columns}
        onSelectedKeysChange={onChange}
      />,
    );
    await user.click(screen.getAllByRole('link')[1]!);
    await user.click(screen.getAllByRole('button', { name: 'Open' })[2]!);
    await shiftClick(user, screen.getAllByRole('link')[4]!);
    expect(chosen()).toEqual([]);
    rerender(<Orders selectionMode="single" columns={columns} onSelectedKeysChange={onChange} />);
    await user.click(screen.getAllByRole('link')[1]!);
    expect(chosen()).toEqual([]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('chooses by a press on the cell that is the active one (which has a tabindex of its own)', async () => {
    render(<Orders selectionMode="single" />);
    const active = stops()[0]!;
    expect(active.closest('tr')).toBe(bodyRows()[0]);
    await userEvent.setup().click(active);
    expect(chosen()).toEqual([0]);
  });

  it('does not take a press in a grid inside a cell for a press on the cell of the outer one', async () => {
    const onChange = vi.fn();
    const inner: DataGridColumn<Order>[] = [
      {
        field: 'customer',
        caption: 'Customer',
        cell: () => (
          <DataGrid
            data={[{ id: 'in', customer: 'Inner' }]}
            rowKey="id"
            columns={[{ field: 'customer', caption: 'Inner customer' }]}
            aria-label="Inner"
            paging={false}
          />
        ),
      },
    ];
    render(
      <Orders
        selectionMode="single"
        columns={inner}
        data={ORDERS.slice(0, 2)}
        onSelectedKeysChange={onChange}
      />,
    );
    await userEvent.setup().click(screen.getAllByText('Inner')[0]!);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('multiple: ranges', () => {
  it('adds the rows from the anchor to the row of a Shift press, the anchor being the last plain choice', async () => {
    const user = userEvent.setup();
    render(<Orders selectionMode="multiple" />);
    await user.click(box(2));
    await shiftClick(user, box(5));
    expect(chosen()).toEqual([2, 3, 4, 5]);
  });

  it('adds the range backwards, and keeps what was chosen elsewhere', async () => {
    const user = userEvent.setup();
    render(<Orders selectionMode="multiple" defaultSelectedKeys={[key(11)]} />);
    await user.click(box(6));
    await shiftClick(user, box(3));
    expect(chosen()).toEqual([3, 4, 5, 6, 11]);
  });

  it('keeps the anchor where it was, so a second Shift press spans from the same row', async () => {
    const user = userEvent.setup();
    render(<Orders selectionMode="multiple" />);
    await user.click(box(4));
    await shiftClick(user, box(6));
    await shiftClick(user, box(1));
    expect(chosen()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('takes the row alone when there is no anchor', async () => {
    render(<Orders selectionMode="multiple" />);
    await shiftClick(userEvent.setup(), box(5));
    expect(chosen()).toEqual([5]);
  });

  it('adds with a Shift press on the row, not only on the box, even without selectOnRowClick', async () => {
    const user = userEvent.setup();
    render(<Orders selectionMode="multiple" />);
    await user.click(box(1));
    await shiftClick(user, cell(3, 2));
    expect(chosen()).toEqual([1, 2, 3]);
  });

  it('spans a page boundary in the order of the sort, not of the data', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Orders
        selectionMode="multiple"
        paging={{ pageSize: 5, pageSizes: [5] }}
        defaultSort={[{ field: 'qty', direction: 'desc' }]}
        onSelectedKeysChange={onChange}
      />,
    );
    // Sorted by qty, descending, the order is rows 7, 4, 1, 11, 8 | 5, 2, 9, 6, 3 | 0, 10 of the data.
    await user.click(box(3));
    expect(onChange).toHaveBeenLastCalledWith([key(11)]);
    await user.click(screen.getByRole('button', { name: 'Page 2' }));
    await shiftClick(user, box(1));
    expect(onChange).toHaveBeenLastCalledWith([key(11), key(8), key(5), key(2)]);
  });

  it('spans the boundary from a row on page 1 to a row on page 2 in one range', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Orders
        selectionMode="multiple"
        paging={{ pageSize: 5, pageSizes: [5] }}
        onSelectedKeysChange={onChange}
      />,
    );
    await user.click(box(3));
    await user.click(screen.getByRole('button', { name: 'Page 2' }));
    await shiftClick(user, box(1));
    // Rows 3 and 4 of page 1, then rows 0 and 1 of page 2: the anchor, the end of the page, and on.
    expect(onChange).toHaveBeenLastCalledWith([key(3), key(4), key(5), key(6)]);
    await user.click(screen.getByRole('button', { name: 'Page 1' }));
    expect(chosen()).toEqual([3, 4]);
  });

  it('spans a page boundary backwards', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Orders
        selectionMode="multiple"
        paging={{ pageSize: 5, pageSizes: [5] }}
        onSelectedKeysChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Page 2' }));
    await user.click(box(1));
    await user.click(screen.getByRole('button', { name: 'Page 1' }));
    await shiftClick(user, box(3));
    expect(onChange).toHaveBeenLastCalledWith([key(6), key(3), key(4), key(5)]);
  });

  it('cancels the mousedown of a Shift press on a row or a box, and not the pointerdown', () => {
    render(<Orders selectionMode="multiple" />);
    for (const target of [cell(2, 2), box(2)]) {
      const down = createEvent.mouseDown(target, {
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      const pointer = createEvent.pointerDown(target, {
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      fireEvent(target, pointer);
      fireEvent(target, down);
      expect(pointer.defaultPrevented).toBe(false);
      expect(down.defaultPrevented).toBe(true);
    }
  });

  it('leaves a plain mousedown, and a Shift mousedown on a control of a cell, alone', () => {
    const columns: DataGridColumn<Order>[] = [
      { field: 'id', caption: 'Order', rowHeader: true },
      { field: 'customer', caption: 'Customer', cell: () => <input aria-label="note" /> },
    ];
    render(<Orders selectionMode="multiple" columns={columns} />);
    const text = screen.getAllByLabelText('note')[0]!;
    const plain = createEvent.mouseDown(cell(2, 1), { bubbles: true, cancelable: true });
    fireEvent(cell(2, 1), plain);
    expect(plain.defaultPrevented).toBe(false);
    const shifted = createEvent.mouseDown(text, {
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    fireEvent(text, shifted);
    expect(shifted.defaultPrevented).toBe(false);
  });

  it('does not cancel a Shift mousedown in single mode, which has no range to protect', () => {
    render(<Orders selectionMode="single" />);
    const down = createEvent.mouseDown(cell(2, 2), {
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    fireEvent(cell(2, 2), down);
    expect(down.defaultPrevented).toBe(false);
  });

  it('moves the focus to the cell of a Shift press, so Shift+Space and the arrows go on from it', async () => {
    const user = userEvent.setup();
    render(<Orders selectionMode="multiple" />);
    await user.click(box(1));
    await shiftClick(user, cell(3, 2));
    expect(chosen()).toEqual([1, 2, 3]);
    expect(cell(3, 2)).toHaveFocus();
    expect(stops()).toEqual([cell(3, 2)]);
    await user.keyboard('{ArrowDown}');
    expect(cell(4, 2)).toHaveFocus();
    await user.keyboard('{Shift>} {/Shift}');
    expect(chosen()).toEqual([1, 2, 3, 4]);
  });

  it('moves the focus to the box of a Shift press on a box, its cell being the active one', async () => {
    const user = userEvent.setup();
    render(<Orders selectionMode="multiple" />);
    await user.click(box(1));
    await shiftClick(user, box(4));
    expect(chosen()).toEqual([1, 2, 3, 4]);
    expect(box(4)).toHaveFocus();
    expect(stops()).toEqual([box(4)]);
    await user.keyboard('{ArrowRight}');
    expect(cell(4, 1)).toHaveFocus();
  });
});

describe('the keys', () => {
  it('Space on a cell of a row chooses it in multiple mode, and again takes it off', () => {
    render(<Orders selectionMode="multiple" />);
    act(() => cell(3, 1).focus());
    expect(press(cell(3, 1), ' ')).toBe(true);
    expect(chosen()).toEqual([3]);
    expect(press(cell(3, 1), ' ')).toBe(true);
    expect(chosen()).toEqual([]);
  });

  it('Shift+Space chooses the range from the row of the last Space', () => {
    render(<Orders selectionMode="multiple" />);
    act(() => cell(2, 1).focus());
    press(cell(2, 1), ' ');
    act(() => cell(5, 1).focus());
    expect(press(cell(5, 1), ' ', { shiftKey: true })).toBe(true);
    expect(chosen()).toEqual([2, 3, 4, 5]);
  });

  it('Space on the box of a row, which has the focus, does what Space on a cell does', () => {
    render(<Orders selectionMode="multiple" />);
    act(() => box(2).focus());
    expect(press(box(2), ' ')).toBe(true);
    expect(chosen()).toEqual([2]);
    act(() => box(4).focus());
    expect(press(box(4), ' ', { shiftKey: true })).toBe(true);
    expect(chosen()).toEqual([2, 3, 4]);
  });

  it('Enter on the box of a row clicks it', () => {
    render(<Orders selectionMode="multiple" />);
    act(() => box(1).focus());
    expect(press(box(1), 'Enter')).toBe(true);
    expect(chosen()).toEqual([1]);
  });

  it('leaves Space on a title alone: the box in it is a control of its own', () => {
    render(<Orders selectionMode="multiple" />);
    act(() => headBox().focus());
    expect(press(headBox(), ' ')).toBe(false);
  });

  it('presses the box in the title with Enter, as it does the box of a row', () => {
    const onChange = vi.fn();
    render(
      <Orders
        selectionMode="multiple"
        paging={{ pageSize: 5, pageSizes: [5] }}
        onSelectedKeysChange={onChange}
      />,
    );
    act(() => headBox().focus());
    expect(press(headBox(), 'Enter')).toBe(true);
    expect(chosen()).toEqual([0, 1, 2, 3, 4]);
    expect(press(headBox(), 'Enter')).toBe(true);
    expect(chosen()).toEqual([]);
    expect(onChange).toHaveBeenCalledTimes(2);
    // Shift+Enter is not a press of it, and does not sort the column of boxes either.
    expect(press(headBox(), 'Enter', { shiftKey: true })).toBe(false);
    expect(chosen()).toEqual([]);
  });

  it('mod+A chooses every row of the page, and cancels the key', () => {
    render(<Orders selectionMode="multiple" paging={{ pageSize: 5, pageSizes: [5] }} />);
    act(() => cell(1, 1).focus());
    expect(press(cell(1, 1), 'a', { ctrlKey: true })).toBe(true);
    expect(chosen()).toEqual([0, 1, 2, 3, 4]);
  });

  it('mod+A is found by the place of the key on a layout that types no Latin letter there', () => {
    render(<Orders selectionMode="multiple" paging={{ pageSize: 5, pageSizes: [5] }} />);
    act(() => cell(1, 1).focus());
    // Russian: the key where QWERTY has A types ф.
    expect(press(cell(1, 1), 'ф', { ctrlKey: true, code: 'KeyA' })).toBe(true);
    expect(chosen()).toEqual([0, 1, 2, 3, 4]);
  });

  it('mod+A follows the letter on a Latin layout that moves it, and not the place', () => {
    render(<Orders selectionMode="multiple" paging={{ pageSize: 5, pageSizes: [5] }} />);
    act(() => cell(1, 1).focus());
    // AZERTY: Q is where QWERTY has A, and A where it has Q.
    expect(press(cell(1, 1), 'q', { ctrlKey: true, code: 'KeyA' })).toBe(false);
    expect(chosen()).toEqual([]);
    expect(press(cell(1, 1), 'a', { ctrlKey: true, code: 'KeyQ' })).toBe(true);
    expect(chosen()).toEqual([0, 1, 2, 3, 4]);
  });

  it('mod+A is ⌘+A on Apple, and Ctrl+A there is left alone', () => {
    apple();
    render(<Orders selectionMode="multiple" />);
    act(() => cell(1, 1).focus());
    expect(press(cell(1, 1), 'a', { ctrlKey: true })).toBe(false);
    expect(chosen()).toEqual([]);
    expect(press(cell(1, 1), 'a', { metaKey: true })).toBe(true);
    expect(chosen()).toHaveLength(12);
  });

  it('mod+A chooses every row after the sort, not only the page, when selectAllMode is "all"', () => {
    const onChange = vi.fn();
    render(
      <Orders
        selectionMode="multiple"
        selectAllMode="all"
        paging={{ pageSize: 5, pageSizes: [5] }}
        onSelectedKeysChange={onChange}
      />,
    );
    act(() => cell(1, 1).focus());
    press(cell(1, 1), 'a', { ctrlKey: true });
    expect(onChange.mock.lastCall![0]).toHaveLength(12);
    expect(chosen()).toEqual([0, 1, 2, 3, 4]);
  });

  it('mod+A adds to what was chosen outside the scope, and does not take it away', () => {
    const onChange = vi.fn();
    render(
      <Orders
        selectionMode="multiple"
        paging={{ pageSize: 5, pageSizes: [5] }}
        defaultSelectedKeys={[key(9)]}
        onSelectedKeysChange={onChange}
      />,
    );
    act(() => cell(1, 1).focus());
    press(cell(1, 1), 'a', { ctrlKey: true });
    expect(onChange).toHaveBeenLastCalledWith([key(9), key(0), key(1), key(2), key(3), key(4)]);
    expect(chosen()).toEqual([0, 1, 2, 3, 4]);
  });

  it('mod+A does nothing in single mode, nor with Shift, and is not cancelled', () => {
    const { rerender } = render(<Orders selectionMode="single" />);
    act(() => cell(1, 1).focus());
    expect(press(cell(1, 1), 'a', { ctrlKey: true })).toBe(false);
    act(() => (titles()[1] as HTMLElement).focus());
    expect(press(titles()[1] as HTMLElement, 'a', { ctrlKey: true })).toBe(false);
    rerender(<Orders selectionMode="multiple" />);
    act(() => cell(1, 1).focus());
    expect(press(cell(1, 1), 'a', { ctrlKey: true, shiftKey: true })).toBe(false);
    expect(chosen()).toEqual([]);
  });

  it('mod+A chooses every row of the scope from a title too, and from the box in the title', () => {
    render(<Orders selectionMode="multiple" paging={{ pageSize: 5, pageSizes: [5] }} />);
    const customer = titles()[2] as HTMLElement;
    act(() => customer.focus());
    expect(press(customer, 'a', { ctrlKey: true })).toBe(true);
    expect(chosen()).toEqual([0, 1, 2, 3, 4]);
    expect(customer).toHaveFocus();
    fireEvent.click(box(0));
    act(() => headBox().focus());
    expect(press(headBox(), 'a', { ctrlKey: true })).toBe(true);
    expect(chosen()).toEqual([0, 1, 2, 3, 4]);
  });

  it('leaves mod+A on a title to the browser without selection', () => {
    render(<Orders />);
    const customer = titles()[1] as HTMLElement;
    act(() => customer.focus());
    expect(press(customer, 'a', { ctrlKey: true })).toBe(false);
  });

  it('does not take Space or mod+A from a control in a cell that has the focus', () => {
    const columns: DataGridColumn<Order>[] = [
      { field: 'id', caption: 'Order', rowHeader: true },
      { field: 'customer', caption: 'Customer', cell: () => <input aria-label="note" /> },
    ];
    render(<Orders selectionMode="multiple" columns={columns} />);
    const input = screen.getAllByLabelText('note')[1]!;
    act(() => input.focus());
    expect(press(input, ' ')).toBe(false);
    expect(press(input, 'a', { ctrlKey: true })).toBe(false);
    expect(chosen()).toEqual([]);
  });
});

describe('the keyboard and the column of boxes', () => {
  it('moves between the boxes and the cells with the arrow keys, the box taking the focus', () => {
    render(<Orders selectionMode="multiple" />);
    act(() => box(0).focus());
    expect(press(box(0), 'ArrowRight')).toBe(true);
    expect(document.activeElement).toBe(cell(0, 1));
    expect(stops()).toEqual([cell(0, 1)]);
    press(cell(0, 1), 'ArrowLeft');
    expect(document.activeElement).toBe(box(0));
    expect(stops()).toEqual([box(0)]);
    press(box(0), 'ArrowDown');
    expect(document.activeElement).toBe(box(1));
    press(box(1), 'ArrowUp');
    press(box(0), 'ArrowUp');
    expect(document.activeElement).toBe(headBox());
    expect(stops()).toEqual([headBox()]);
  });

  it('gives the focus to the cell of a title whose box is disabled, and takes the stop back', () => {
    render(<Orders selectionMode="multiple" data={[]} />);
    const title = grid().querySelector<HTMLElement>('thead th')!;
    act(() => title.focus());
    press(title, 'ArrowRight');
    expect(document.activeElement).toBe(titles()[1]);
    press(document.activeElement as HTMLElement, 'ArrowLeft');
    expect(document.activeElement).toBe(title);
  });

  it('gives the focus to the box of the title when it turns enabled under the focus, and the keys go on', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <>
        <button type="button">Before</button>
        <Orders selectionMode="multiple" data={[]} />
      </>,
    );
    const title = grid().querySelector<HTMLElement>('thead th')!;
    await user.tab();
    await user.tab();
    expect(title).toHaveFocus();
    // The rows come: the box can have the focus now, and is the home of the title.
    rerender(
      <>
        <button type="button">Before</button>
        <Orders selectionMode="multiple" data={ORDERS} />
      </>,
    );
    expect(headBox()).toBeEnabled();
    expect(headBox()).toHaveFocus();
    expect(stops()).toEqual([headBox()]);
    await user.keyboard('{ArrowRight}');
    expect(titles()[1]).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(headBox()).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(box(0)).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(headBox()).toHaveFocus();
    // Space is the box's own, which chooses the page.
    await user.keyboard(' ');
    expect(chosen()).toHaveLength(12);
  });

  it('gives the focus to the title when its box turns disabled under the focus, and the keys go on', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Orders selectionMode="multiple" />);
    act(() => box(0).focus());
    await user.keyboard('{ArrowUp}');
    expect(headBox()).toHaveFocus();
    // The rows go: the box cannot have the focus, and the title is its own home again.
    rerender(<Orders selectionMode="multiple" data={[]} />);
    const title = grid().querySelector<HTMLElement>('thead th')!;
    expect(headBox()).toBeDisabled();
    expect(title).toHaveFocus();
    expect(stops()).toEqual([title]);
    await user.keyboard('{ArrowRight}');
    expect(titles()[1]).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(title).toHaveFocus();
  });

  it('scrolls the cell into view when its box has the focus, and not the box, which is smaller', () => {
    const scrolled: Element[] = [];
    Element.prototype.scrollIntoView = function scrollIntoView(this: Element) {
      scrolled.push(this);
    };
    try {
      render(<Orders selectionMode="multiple" />);
      act(() => box(0).focus());
      press(box(0), 'ArrowDown');
      expect(document.activeElement).toBe(box(1));
      // The box is 16px in a row of 41: the row is what must be in sight, or a row at the edge of the
      // frame would be left cut.
      expect(scrolled.at(-1)).toBe(cell(1, 0));
    } finally {
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
    }
  });

  it('keeps the box the stop when the active cell is pressed with a pointer', async () => {
    render(<Orders selectionMode="multiple" />);
    await userEvent.setup().click(cell(3, 2));
    expect(stops()).toEqual([cell(3, 2)]);
    await userEvent.setup().click(box(4));
    expect(stops()).toEqual([box(4)]);
  });

  it('gives the focus to the box after a press on its cell around it, so the keys go on', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Orders selectionMode="multiple" onSelectedKeysChange={onChange} />);
    // The cell of a box is 40px and the box 16px: a press beside the box is on the cell.
    await user.click(cell(3, 0));
    expect(box(3)).toHaveFocus();
    expect(stops()).toEqual([box(3)]);
    await user.keyboard('{ArrowDown}');
    expect(box(4)).toHaveFocus();
    // The same for the box in the title.
    await user.click(headBox().closest('th')!);
    expect(headBox()).toHaveFocus();
    // The press chose nothing: only the box chooses.
    expect(onChange).not.toHaveBeenCalled();
  });

  it('leaves Tab to the browser: nothing else in the table is a stop', () => {
    render(<Orders selectionMode="multiple" />);
    act(() => box(0).focus());
    expect(press(box(0), 'Tab')).toBe(false);
    expect(stops()).toHaveLength(1);
  });
});

describe('the box in the title', () => {
  it('is neither checked nor mixed when nothing is chosen, and chooses the page when it is pressed', async () => {
    render(<Orders selectionMode="multiple" paging={{ pageSize: 5, pageSizes: [5] }} />);
    expect(headBox().checked).toBe(false);
    expect(headBox().indeterminate).toBe(false);
    await userEvent.setup().click(headBox());
    expect(chosen()).toEqual([0, 1, 2, 3, 4]);
    expect(headBox().checked).toBe(true);
  });

  it('is mixed when part of the page is chosen, and a press chooses the rest', async () => {
    render(<Orders selectionMode="multiple" defaultSelectedKeys={[key(1)]} />);
    expect(headBox().indeterminate).toBe(true);
    expect(headBox().checked).toBe(false);
    expect(headBox().closest('label')).toHaveAttribute('data-indeterminate');
    await userEvent.setup().click(headBox());
    expect(chosen()).toHaveLength(12);
    expect(headBox().indeterminate).toBe(false);
    expect(headBox().checked).toBe(true);
  });

  it('is checked when every row of the page is chosen, and a press takes the page off', async () => {
    const onChange = vi.fn();
    render(
      <Orders
        selectionMode="multiple"
        paging={{ pageSize: 5, pageSizes: [5] }}
        defaultSelectedKeys={[key(0), key(1), key(2), key(3), key(4), key(9)]}
        onSelectedKeysChange={onChange}
      />,
    );
    expect(headBox().checked).toBe(true);
    await userEvent.setup().click(headBox());
    expect(chosen()).toEqual([]);
    // What is chosen off the page stays chosen.
    expect(onChange).toHaveBeenLastCalledWith([key(9)]);
  });

  it('is about the page that is shown: another page has its own state', async () => {
    const user = userEvent.setup();
    render(<Orders selectionMode="multiple" paging={{ pageSize: 5, pageSizes: [5] }} />);
    await user.click(headBox());
    await user.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(headBox().checked).toBe(false);
    expect(headBox().indeterminate).toBe(false);
  });

  it('is about every row when selectAllMode is "all": checked only when all of them are chosen', async () => {
    const user = userEvent.setup();
    render(
      <Orders
        selectionMode="multiple"
        selectAllMode="all"
        paging={{ pageSize: 5, pageSizes: [5] }}
      />,
    );
    await user.click(headBox());
    expect(chosen()).toEqual([0, 1, 2, 3, 4]);
    expect(headBox().checked).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(chosen()).toEqual([0, 1]);
    await user.click(box(0));
    expect(headBox().indeterminate).toBe(true);
  });

  it('is disabled, and not a Tab stop, when there are no rows in its scope', () => {
    render(<Orders selectionMode="multiple" data={[]} />);
    expect(headBox()).toBeDisabled();
    expect(headBox().checked).toBe(false);
    // The title cell takes the stop for itself, so the keyboard is never stuck on a box that cannot
    // have the focus.
    expect(stops()).toEqual([grid().querySelector('thead th')]);
  });

  it('is the one Tab stop when it is the active cell, and its cell is not', () => {
    render(<Orders selectionMode="multiple" />);
    expect(stops()).toEqual([box(0)]);
    expect(cell(0, 0)).toHaveAttribute('tabindex', '-1');
    expect(grid().querySelector('thead th')).toHaveAttribute('tabindex', '-1');
    expect(headBox()).toHaveAttribute('tabindex', '-1');
  });
});

describe('what is kept', () => {
  it('keeps the chosen keys across a sort', async () => {
    const user = userEvent.setup();
    render(<Orders selectionMode="multiple" defaultSelectedKeys={[key(0), key(3)]} />);
    await user.click(screen.getByRole('button', { name: 'Qty' }));
    const names = bodyRows().map((row) => row.querySelector('th')!.textContent);
    expect(chosen().map((index) => names[index])).toEqual(
      [key(0), key(3)].sort((a, b) => names.indexOf(a) - names.indexOf(b)),
    );
  });

  it('keeps them across pages, and shows the row again chosen when its page comes back', async () => {
    const user = userEvent.setup();
    render(<Orders selectionMode="multiple" paging={{ pageSize: 5, pageSizes: [5] }} />);
    await user.click(box(1));
    await user.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(chosen()).toEqual([]);
    await user.click(box(0));
    await user.click(screen.getByRole('button', { name: 'Page 1' }));
    expect(chosen()).toEqual([1]);
  });

  it('keeps the key of a row that leaves data, and chooses it again if it comes back', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Orders
        selectionMode="multiple"
        defaultSelectedKeys={[key(1)]}
        onSelectedKeysChange={onChange}
      />,
    );
    rerender(<Orders selectionMode="multiple" data={ORDERS.filter((_, index) => index !== 1)} />);
    expect(chosen()).toEqual([]);
    expect(onChange).not.toHaveBeenCalled();
    rerender(<Orders selectionMode="multiple" data={ORDERS} />);
    expect(chosen()).toEqual([1]);
  });

  it('counts only the keys of the rows of its scope for the box in the title', () => {
    render(<Orders selectionMode="multiple" defaultSelectedKeys={['gone', 'never']} />);
    expect(headBox().indeterminate).toBe(false);
    expect(headBox().checked).toBe(false);
  });
});

describe('the state', () => {
  it('is uncontrolled with defaultSelectedKeys, and reports each change with the whole state', async () => {
    const onChange = vi.fn();
    const onState = vi.fn();
    const user = userEvent.setup();
    render(
      <Orders
        selectionMode="multiple"
        defaultSelectedKeys={[key(0)]}
        onSelectedKeysChange={onChange}
        onStateChange={onState}
      />,
    );
    await user.click(box(2));
    expect(onChange).toHaveBeenCalledWith([key(0), key(2)]);
    expect(onState).toHaveBeenCalledTimes(1);
    const [state, changed] = onState.mock.calls[0] as [DataGridState, string];
    expect(changed).toBe('selectedKeys');
    expect(state.selectedKeys).toEqual([key(0), key(2)]);
    expect(state.sort).toEqual([]);
  });

  it('is controlled with selectedKeys: a parent that does not take the change keeps the choice', async () => {
    const onChange = vi.fn();
    render(
      <Orders selectionMode="multiple" selectedKeys={[key(0)]} onSelectedKeysChange={onChange} />,
    );
    await userEvent.setup().click(box(2));
    expect(onChange).toHaveBeenCalledWith([key(0), key(2)]);
    expect(chosen()).toEqual([0]);
  });

  it('follows a controlled value that the parent changes, and calls nobody for it', () => {
    const onChange = vi.fn();
    const onState = vi.fn();
    const { rerender } = render(
      <Orders
        selectionMode="multiple"
        selectedKeys={[key(0)]}
        onSelectedKeysChange={onChange}
        onStateChange={onState}
      />,
    );
    rerender(
      <Orders
        selectionMode="multiple"
        selectedKeys={[key(4), key(5)]}
        onSelectedKeysChange={onChange}
        onStateChange={onState}
      />,
    );
    expect(chosen()).toEqual([4, 5]);
    expect(onChange).not.toHaveBeenCalled();
    expect(onState).not.toHaveBeenCalled();
  });

  it('works through a parent that keeps the state', async () => {
    function Parent() {
      const [keys, setKeys] = useState<readonly DataGridKey[]>([]);
      return <Orders selectionMode="multiple" selectedKeys={keys} onSelectedKeysChange={setKeys} />;
    }
    const user = userEvent.setup();
    render(<Parent />);
    await user.click(box(1));
    await shiftClick(user, box(3));
    expect(chosen()).toEqual([1, 2, 3]);
  });

  it('is in getState, with the sort and the page, and nothing outside JSON', () => {
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} selectionMode="multiple" defaultSelectedKeys={[key(2), 7]} />);
    expect(ref.current!.getState().selectedKeys).toEqual([key(2), 7]);
    expect(JSON.parse(JSON.stringify(ref.current!.getState()))).toEqual(ref.current!.getState());
  });

  it('is empty by default, and keeps what it was given in getState after a choice', async () => {
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} selectionMode="multiple" />);
    expect(ref.current!.getState().selectedKeys).toEqual([]);
    await userEvent.setup().click(box(0));
    expect(ref.current!.getState().selectedKeys).toEqual([key(0)]);
  });

  it('ignores a key that names no row, silently, as a saved state may hold one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Orders selectionMode="multiple" defaultSelectedKeys={['nothing', key(1)]} />);
    expect(chosen()).toEqual([1]);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('is not changed by a render: nothing is called for a mount, a re-render or a new mode', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Orders selectionMode="multiple" onSelectedKeysChange={onChange} />,
    );
    rerender(<Orders selectionMode="single" onSelectedKeysChange={onChange} />);
    rerender(
      <Orders selectionMode="multiple" selectAllMode="all" onSelectedKeysChange={onChange} />,
    );
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('server mode', () => {
  it('warns once, after mount, for selectAllMode "all", and chooses the page', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(
      <Orders selectionMode="multiple" selectAllMode="all" remote totalCount={135} />,
    );
    rerender(<Orders selectionMode="multiple" selectAllMode="all" remote totalCount={135} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('selectAllMode');
    expect(headBox()).toHaveAccessibleName('Select all rows on this page');
    await userEvent.setup().click(headBox());
    expect(chosen()).toHaveLength(12);
  });

  it('does not warn for the page scope, or for a grid that is not remote', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Orders selectionMode="multiple" selectAllMode="all" />);
    render(<Orders selectionMode="multiple" remote totalCount={135} />);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('announcing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('says how many rows are chosen after a select all, and nothing before', () => {
    render(<Orders selectionMode="multiple" />);
    flush();
    expect(live()).toBe('');
    act(() => headBox().click());
    flush();
    expect(live()).toBe('12 rows selected');
  });

  it('says nothing for a plain choice by Space', () => {
    render(<Orders selectionMode="multiple" />);
    act(() => cell(2, 1).focus());
    press(cell(2, 1), ' ');
    flush();
    expect(live()).toBe('');
  });

  it('says the count of the chosen keys, the range included, with the ones off the page', () => {
    render(
      <Orders
        selectionMode="multiple"
        paging={{ pageSize: 5, pageSizes: [5] }}
        defaultSelectedKeys={[key(9)]}
      />,
    );
    act(() => cell(1, 1).focus());
    press(cell(1, 1), ' ');
    act(() => cell(3, 1).focus());
    press(cell(3, 1), ' ', { shiftKey: true });
    flush();
    expect(live()).toBe('4 rows selected');
  });

  it('says it for mod+A, and in the words of the labels', () => {
    render(
      <Orders
        selectionMode="multiple"
        labels={{ announceSelected: (count) => `${count} chosen` }}
      />,
    );
    act(() => cell(1, 1).focus());
    press(cell(1, 1), 'a', { ctrlKey: true });
    flush();
    expect(live()).toBe('12 chosen');
  });

  it('cancels mod+A on a title of an empty grid and does nothing else: no word, no change', () => {
    const onChange = vi.fn();
    const onStateChange = vi.fn();
    render(
      <Orders
        selectionMode="multiple"
        data={[]}
        onSelectedKeysChange={onChange}
        onStateChange={onStateChange}
      />,
    );
    const title = titles()[1] as HTMLElement;
    act(() => title.focus());
    expect(press(title, 'a', { ctrlKey: true })).toBe(true);
    flush();
    expect(live()).toBe('');
    expect(onChange).not.toHaveBeenCalled();
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it('says "1 row selected" for one', () => {
    render(<Orders selectionMode="multiple" data={ORDERS.slice(0, 1)} />);
    act(() => headBox().click());
    flush();
    expect(live()).toBe('1 row selected');
  });

  it('says nothing for a controlled change, or for taking the page off', () => {
    const every = ORDERS.map((order) => order.id);
    const { rerender } = render(<Orders selectionMode="multiple" selectedKeys={[]} />);
    rerender(<Orders selectionMode="multiple" selectedKeys={every} />);
    flush();
    expect(live()).toBe('');
    act(() => headBox().click());
    flush();
    expect(live()).toBe('');
  });
});

describe('what a change costs', () => {
  it('draws again only the rows whose chosen state changed', () => {
    const drawn: DataGridKey[] = [];
    const columns: DataGridColumn<Order>[] = [
      { field: 'id', caption: 'Order', rowHeader: true },
      {
        field: 'customer',
        caption: 'Customer',
        cell: (ctx) => {
          drawn.push(ctx.rowKey);
          return ctx.text;
        },
      },
    ];
    const { rerender } = render(
      <Orders selectionMode="multiple" columns={columns} selectedKeys={[key(1)]} />,
    );
    expect(drawn).toHaveLength(12);
    drawn.length = 0;
    rerender(<Orders selectionMode="multiple" columns={columns} selectedKeys={[key(1), key(4)]} />);
    expect(drawn).toEqual([key(4)]);
    drawn.length = 0;
    rerender(<Orders selectionMode="multiple" columns={columns} selectedKeys={[key(4)]} />);
    expect(drawn).toEqual([key(1)]);
  });

  it('draws again only the row that an immutable edit changed, in a new data array', () => {
    const drawn: DataGridKey[] = [];
    const columns: DataGridColumn<Order>[] = [
      { field: 'id', caption: 'Order', rowHeader: true },
      {
        field: 'customer',
        caption: 'Customer',
        cell: (ctx) => {
          drawn.push(ctx.rowKey);
          return ctx.text;
        },
      },
      { field: 'qty', caption: 'Qty', dataType: 'number' },
    ];
    const { rerender } = render(<Orders columns={columns} data={ORDERS} />);
    drawn.length = 0;
    const edited = ORDERS.map((row) => (row.id === key(5) ? { ...row, qty: row.qty + 1 } : row));
    rerender(<Orders columns={columns} data={edited} />);
    expect(drawn).toEqual([key(5)]);
    expect(cell(5, 2)).toHaveTextContent(String(ORDERS[5]!.qty + 1));
  });

  it('draws only the row of a Space, which moves nothing else', () => {
    const drawn: DataGridKey[] = [];
    const columns: DataGridColumn<Order>[] = [
      { field: 'id', caption: 'Order', rowHeader: true },
      {
        field: 'customer',
        caption: 'Customer',
        cell: (ctx) => {
          drawn.push(ctx.rowKey);
          return ctx.text;
        },
      },
    ];
    render(<Orders selectionMode="single" columns={columns} />);
    const first = stops()[0]!;
    act(() => first.focus());
    drawn.length = 0;
    press(first, ' ');
    expect(drawn).toEqual([key(0)]);
  });

  describe('props written inline, with a choice the parent keeps', () => {
    const drawn: DataGridKey[] = [];
    const counting: DataGridColumn<Order>[] = [
      { field: 'id', caption: 'Order', rowHeader: true },
      {
        field: 'customer',
        caption: 'Customer',
        cell: (ctx) => {
          drawn.push(ctx.rowKey);
          return ctx.text;
        },
      },
    ];
    /**
     * A parent that keeps the choice and writes the rest of the props in its JSX: `inline` is
     * called on each of its renders, so what it returns is new each time, as an inline prop is.
     */
    function Parent({ inline }: { inline: () => Partial<DataGridProps<Order>> }) {
      const [keys, setKeys] = useState<readonly DataGridKey[]>([]);
      return (
        <Orders
          selectionMode="multiple"
          columns={counting}
          selectedKeys={keys}
          onSelectedKeysChange={setKeys}
          {...inline()}
        />
      );
    }
    const spyWarnings = () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      return (word: string) => warn.mock.calls.filter(([text]) => String(text).includes(word));
    };
    /** Three presses, each a commit of the parent with its inline props made anew. */
    const threePresses = () => {
      drawn.length = 0;
      fireEvent.click(box(3));
      fireEvent.click(box(4));
      fireEvent.click(box(5));
    };

    it('draws again only the rows a press changes, with labels of strings, and says nothing', () => {
      const warnings = spyWarnings();
      render(<Parent inline={() => ({ labels: { noData: 'Nothing here', selectAll: 'All' } })} />);
      threePresses();
      expect(drawn).toEqual([key(3), key(4), key(5)]);
      expect(warnings('labels')).toHaveLength(0);
    });

    it('warns once when the functions of labels are new on every render', () => {
      const warnings = spyWarnings();
      render(<Parent inline={() => ({ labels: { selectRow: (name) => `Choose ${name}` } })} />);
      threePresses();
      expect(warnings('labels')).toHaveLength(1);
      threePresses();
      expect(warnings('labels')).toHaveLength(1);
    });

    it('warns once when rowClassName is new on every render', () => {
      const warnings = spyWarnings();
      render(
        <Parent inline={() => ({ rowClassName: (row) => (row.qty > 5 ? 'big' : undefined) })} />,
      );
      threePresses();
      expect(warnings('rowClassName')).toHaveLength(1);
      threePresses();
      expect(warnings('rowClassName')).toHaveLength(1);
    });

    it('says nothing for a rowClassName and labels made once', () => {
      const warnings = spyWarnings();
      const rowClassName = (row: Order) => (row.qty > 5 ? 'big' : undefined);
      const labels = { selectRow: (name: string) => `Choose ${name}` };
      render(<Parent inline={() => ({ rowClassName, labels })} />);
      threePresses();
      expect(drawn).toEqual([key(3), key(4), key(5)]);
      expect(warnings('rowClassName')).toHaveLength(0);
      expect(warnings('labels')).toHaveLength(0);
    });
  });
});
