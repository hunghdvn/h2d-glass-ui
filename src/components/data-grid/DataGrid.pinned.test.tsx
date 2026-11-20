import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridColumnLayout, DataGridProps } from './index';

// The pinned columns (spec phase 6 §3.7, §4.3 G1): what each cell says about where it sticks, the
// offsets the table writes, the attributes the frame gets from its scroll, and the filler column,
// which goes before the right zone. What needs a layout engine to be true (a cell that stays where it
// is, a shadow that is drawn) is proven in the stories (`DataGridColumns.stories.tsx`).

beforeEach(() => {
  resetDevWarnings();
  // jsdom has no layout, so every element would count as hidden to the code that looks for the
  // controls of a cell.
  HTMLElement.prototype.checkVisibility = () => true;
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  vi.restoreAllMocks();
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

const pinned = (parts: Record<string, 'left' | 'right'>): Partial<DataGridColumnLayout> => ({
  pinned: parts,
});

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

const grid = () => screen.getByRole('grid') as HTMLTableElement;
const frame = () => grid().parentElement as HTMLElement;
const headRow = () => grid().tHead!.rows[0]!;
const bodyRows = () => Array.from(grid().tBodies[0]!.rows);
const cellsIn = (row: HTMLTableRowElement) => Array.from(row.cells);
/** The cells of a row as the words in them, with the filler column as `·`. */
const kinds = (row: HTMLTableRowElement) =>
  cellsIn(row).map((one) =>
    one.classList.contains('flg-data-grid-filler') ? '·' : (one.textContent ?? ''),
  );
const prop = (name: string) => grid().style.getPropertyValue(name);

const LEFT_AND_RIGHT = { id: 'left', customer: 'left', total: 'right' } as const;

describe('what a cell of a pinned column says', () => {
  it('has the side, the edge and the place it sticks to, in the title and in every row', () => {
    render(<Orders defaultColumnLayout={pinned(LEFT_AND_RIGHT)} />);
    const rows = [headRow(), ...bodyRows()];
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      const [order, customer, qty, , total] = cellsIn(row);
      expect(order).toHaveAttribute('data-pinned', 'left');
      expect(order).not.toHaveAttribute('data-pin-edge');
      expect(order).toHaveStyle({ left: 'var(--flg-data-grid-pin-0)' });
      expect(customer).toHaveAttribute('data-pinned', 'left');
      expect(customer).toHaveAttribute('data-pin-edge');
      expect(customer).toHaveStyle({ left: 'var(--flg-data-grid-pin-1)' });
      expect(qty).not.toHaveAttribute('data-pinned');
      expect(qty).not.toHaveAttribute('style');
      expect(total).toHaveAttribute('data-pinned', 'right');
      expect(total).toHaveAttribute('data-pin-edge');
      expect(total).toHaveStyle({ right: 'var(--flg-data-grid-pin-3)' });
    }
  });

  it('is on the row header, which is a th of the body', () => {
    render(<Orders defaultColumnLayout={pinned({ id: 'left' })} />);
    const header = bodyRows()[0]!.cells[0]!;
    expect(header.tagName).toBe('TH');
    expect(header).toHaveAttribute('scope', 'row');
    expect(header).toHaveAttribute('data-pinned', 'left');
    expect(header).toHaveAttribute('data-pin-edge');
  });

  it('is on the cells of the skeleton rows', () => {
    render(<Orders data={[]} loading defaultColumnLayout={pinned(LEFT_AND_RIGHT)} />);
    const skeleton = grid().querySelector<HTMLTableRowElement>('.flg-data-grid-skeleton-row')!;
    expect(cellsIn(skeleton).map((one) => one.getAttribute('data-pinned'))).toEqual([
      'left',
      'left',
      null,
      null,
      'right',
    ]);
    expect(cellsIn(skeleton)[1]).toHaveAttribute('data-pin-edge');
    expect(cellsIn(skeleton)[1]).toHaveStyle({ left: 'var(--flg-data-grid-pin-1)' });
  });

  it('is on no cell of a grid with no pinned column, and no style is added', () => {
    render(<Orders />);
    expect(grid().querySelector('[data-pinned], [data-pin-edge]')).toBeNull();
    expect(prop('--flg-data-grid-pin-0')).toBe('');
    expect(prop('--flg-data-grid-pinned-left')).toBe('');
    expect(prop('--flg-data-grid-pinned-right')).toBe('');
  });

  it('follows a column that is pinned or unpinned after the grid is drawn', () => {
    const { rerender } = render(<Orders columnLayout={layout({})} />);
    expect(grid().querySelector('[data-pinned]')).toBeNull();
    rerender(<Orders columnLayout={layout({ qty: 'right' })} />);
    // Qty goes to the right zone, after Total, and the filler column goes before it.
    expect(headRow().cells[4]).toHaveAttribute('data-pinned', 'right');
    expect(bodyRows()[1]!.cells[4]).toHaveAttribute('data-pin-edge');
    rerender(<Orders columnLayout={layout({})} />);
    expect(grid().querySelector('[data-pinned]')).toBeNull();
  });
});

describe('the column of boxes', () => {
  it('is in the left zone when a data column is pinned to the left', () => {
    render(<Orders selectionMode="multiple" defaultColumnLayout={pinned({ id: 'left' })} />);
    for (const row of [headRow(), ...bodyRows()]) {
      const [box, order, customer] = cellsIn(row);
      expect(box).toHaveAttribute('data-service', 'select');
      expect(box).toHaveAttribute('data-pinned', 'left');
      expect(box).not.toHaveAttribute('data-pin-edge');
      expect(box).toHaveStyle({ left: 'var(--flg-data-grid-pin-0)' });
      expect(order).toHaveAttribute('data-pin-edge');
      expect(order).toHaveStyle({ left: 'var(--flg-data-grid-pin-1)' });
      expect(customer).not.toHaveAttribute('data-pinned');
    }
    // The box is 40px wide and Order 104px: the zone is 144px, and Order sticks after the box.
    expect(prop('--flg-data-grid-pin-1')).toContain('40px');
    expect(prop('--flg-data-grid-pinned-left')).toBe('144px');
  });

  it('is not pinned when only a column to the right is, nor when none is', () => {
    const { rerender } = render(
      <Orders selectionMode="multiple" defaultColumnLayout={pinned({ total: 'right' })} />,
    );
    expect(headRow().cells[0]).not.toHaveAttribute('data-pinned');
    expect(grid().querySelectorAll('[data-pinned="left"]')).toHaveLength(0);
    rerender(<Orders selectionMode="multiple" columnLayout={layout({})} />);
    expect(grid().querySelector('[data-pinned]')).toBeNull();
  });
});

describe('where the table says the columns stick', () => {
  it('writes the offset of each pinned column and the width of each zone', () => {
    render(<Orders defaultColumnLayout={pinned(LEFT_AND_RIGHT)} />);
    // The inset is taken back in the property, so a cell only reads it (6px in `striped`).
    expect(prop('--flg-data-grid-pin-0')).toBe('calc(0px - var(--flg-data-grid-pin-inset))');
    expect(prop('--flg-data-grid-pin-1')).toBe('calc(104px - var(--flg-data-grid-pin-inset))');
    expect(prop('--flg-data-grid-pin-3')).toBe('calc(0px - var(--flg-data-grid-pin-inset))');
    expect(prop('--flg-data-grid-pin-2')).toBe('');
    expect(prop('--flg-data-grid-pinned-left')).toBe('304px');
    expect(prop('--flg-data-grid-pinned-right')).toBe('120px');
  });

  const FLEXIBLE: DataGridColumn<Order>[] = [
    { field: 'id', caption: 'Order', rowHeader: true, minWidth: 90 },
    { ...COLUMNS[1]! },
    { ...COLUMNS[2]! },
    { ...COLUMNS[3]! },
  ];

  it('counts the least width of a flexible pinned column before the frame is measured', () => {
    render(
      <Orders columns={FLEXIBLE} defaultColumnLayout={pinned({ id: 'left', customer: 'left' })} />,
    );
    // The table has no room to share out yet, so Order rests at its least, and Customer sticks no
    // further right than where it rests.
    expect(prop('--flg-data-grid-pin-1')).toBe('calc(90px - var(--flg-data-grid-pin-inset))');
    expect(prop('--flg-data-grid-pinned-left')).toBe('290px');
  });

  it('counts the width it was given once the frame is measured', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('flg-table-frame') ? 1000 : 0;
    });
    render(
      <Orders columns={FLEXIBLE} defaultColumnLayout={pinned({ id: 'left', customer: 'left' })} />,
    );
    // 1000 less the 400 of the other three is the 600 that Order takes.
    expect(grid().querySelectorAll('col')[0]).toHaveStyle({ width: '600px' });
    expect(prop('--flg-data-grid-pin-1')).toBe('calc(600px - var(--flg-data-grid-pin-inset))');
    expect(prop('--flg-data-grid-pinned-left')).toBe('800px');
  });

  it('is written by the table alone: a width that changes draws no cell', () => {
    const { rerender } = render(<Orders columnLayout={layout({ id: 'left', customer: 'left' })} />);
    const before = bodyRows()[0]!.cells[1]!;
    rerender(
      <Orders
        columnLayout={layout({ id: 'left', customer: 'left' }, { id: 150, customer: 200 })}
      />,
    );
    expect(prop('--flg-data-grid-pin-1')).toBe('calc(150px - var(--flg-data-grid-pin-inset))');
    expect(prop('--flg-data-grid-pinned-left')).toBe('350px');
    expect(bodyRows()[0]!.cells[1]).toBe(before);
  });
});

describe('the scroll of a frame with a pinned column', () => {
  // jsdom has no layout: the frame says what the test tells it to.
  function scrollBox(box: {
    scrollLeft?: number;
    clientWidth?: number;
    scrollWidth?: number;
    scrollTop?: number;
    clientHeight?: number;
    offsetTop?: number;
    offsetHeight?: number;
  }) {
    const element = frame();
    const table = grid();
    const define = (target: HTMLElement, name: string, value: number | undefined) => {
      if (value === undefined) return;
      Object.defineProperty(target, name, { configurable: true, value });
    };
    define(element, 'scrollLeft', box.scrollLeft);
    define(element, 'clientWidth', box.clientWidth);
    define(element, 'scrollWidth', box.scrollWidth);
    define(element, 'scrollTop', box.scrollTop);
    define(element, 'clientHeight', box.clientHeight);
    define(table, 'offsetTop', box.offsetTop);
    define(table, 'offsetHeight', box.offsetHeight);
  }
  const scroll = () => act(() => void fireEvent.scroll(frame()));
  const scrolledLeft = () => frame().hasAttribute('data-scrolled-left');
  const scrolledRight = () => frame().hasAttribute('data-scrolled-right');

  it('says which sides are scrolled, from what the frame has beyond what it shows', () => {
    render(<Orders defaultColumnLayout={pinned(LEFT_AND_RIGHT)} />);
    scrollBox({ scrollLeft: 0, clientWidth: 500, scrollWidth: 900 });
    scroll();
    // At rest the columns to the right are under the right zone, the ones to the left are not.
    expect(scrolledLeft()).toBe(false);
    expect(scrolledRight()).toBe(true);
    scrollBox({ scrollLeft: 120 });
    scroll();
    expect(scrolledLeft()).toBe(true);
    expect(scrolledRight()).toBe(true);
    scrollBox({ scrollLeft: 400 });
    scroll();
    expect(scrolledLeft()).toBe(true);
    expect(scrolledRight()).toBe(false);
    scrollBox({ scrollLeft: 399.5 });
    scroll();
    // A pixel short of the end is the end: a fraction is no scroll.
    expect(scrolledRight()).toBe(false);
  });

  it('says nothing for a frame that holds all its columns', () => {
    render(<Orders defaultColumnLayout={pinned(LEFT_AND_RIGHT)} />);
    scrollBox({ scrollLeft: 0, clientWidth: 900, scrollWidth: 900 });
    scroll();
    expect(scrolledLeft()).toBe(false);
    expect(scrolledRight()).toBe(false);
    expect(frame().style.getPropertyValue('--flg-data-grid-view-height')).toBe('');
  });

  it('writes an attribute only when its value changes', () => {
    render(<Orders defaultColumnLayout={pinned(LEFT_AND_RIGHT)} />);
    scrollBox({ scrollLeft: 0, clientWidth: 500, scrollWidth: 900 });
    scroll();
    const set = vi.spyOn(frame(), 'setAttribute');
    const remove = vi.spyOn(frame(), 'removeAttribute');
    scrollBox({ scrollLeft: 10 });
    scroll();
    expect(set).toHaveBeenCalledTimes(1);
    scrollBox({ scrollLeft: 20 });
    scroll();
    scrollBox({ scrollLeft: 30 });
    scroll();
    expect(set).toHaveBeenCalledTimes(1);
    expect(remove).not.toHaveBeenCalled();
  });

  it('gives the shadow the height of what the body shows, never more than the last row', () => {
    render(<Orders defaultColumnLayout={pinned(LEFT_AND_RIGHT)} />);
    const view = () => frame().style.getPropertyValue('--flg-data-grid-view-height');
    // A table of 120px in a frame of 300px: the shadow ends with the last row.
    scrollBox({ scrollLeft: 50, clientWidth: 500, scrollWidth: 900, clientHeight: 300 });
    scrollBox({ scrollTop: 0, offsetTop: 0, offsetHeight: 120 });
    scroll();
    expect(view()).toBe('120px');
    // A table taller than the frame: the frame.
    scrollBox({ offsetHeight: 500 });
    scroll();
    expect(view()).toBe('300px');
    // Scrolled so that the end of the table is in sight: what shows of it.
    scrollBox({ scrollTop: 400 });
    scroll();
    expect(view()).toBe('100px');
    // A `striped` frame has padding: the table starts below the top, and the heading with it.
    scrollBox({ scrollTop: 0, offsetTop: 6, offsetHeight: 120 });
    scroll();
    expect(view()).toBe('120px');
  });

  it('takes the height off when nothing is scrolled any more', () => {
    render(<Orders defaultColumnLayout={pinned(LEFT_AND_RIGHT)} />);
    scrollBox({ scrollLeft: 50, clientWidth: 500, scrollWidth: 900, clientHeight: 300 });
    scrollBox({ scrollTop: 0, offsetTop: 0, offsetHeight: 120 });
    scroll();
    expect(frame().style.getPropertyValue('--flg-data-grid-view-height')).toBe('120px');
    scrollBox({ scrollWidth: 500, scrollLeft: 0 });
    scroll();
    expect(frame().style.getPropertyValue('--flg-data-grid-view-height')).toBe('');
  });

  it('listens to the frame once, passively, and only while a column is pinned', () => {
    const add = vi.spyOn(EventTarget.prototype, 'addEventListener');
    const remove = vi.spyOn(EventTarget.prototype, 'removeEventListener');
    const onFrame = (spy: typeof add) =>
      spy.mock.calls.filter(
        ([type], index) => type === 'scroll' && spy.mock.contexts[index] === frame(),
      );
    const { rerender, unmount } = render(<Orders columnLayout={layout({})} />);
    expect(onFrame(add)).toHaveLength(0);
    rerender(<Orders columnLayout={layout({ qty: 'right' })} />);
    expect(onFrame(add)).toHaveLength(1);
    expect(onFrame(add)[0]![2]).toEqual({ passive: true });
    // More pins, and the same listener.
    rerender(<Orders columnLayout={layout({ qty: 'right', id: 'left' })} />);
    expect(onFrame(add)).toHaveLength(1);
    expect(onFrame(remove)).toHaveLength(0);
    // The last pin goes: the listener and what it wrote go.
    scrollFrameBy(500, 900);
    scroll();
    expect(scrolledRight()).toBe(true);
    rerender(<Orders columnLayout={layout({})} />);
    expect(onFrame(remove)).toHaveLength(1);
    expect(scrolledLeft()).toBe(false);
    expect(scrolledRight()).toBe(false);
    unmount();
  });

  function scrollFrameBy(clientWidth: number, scrollWidth: number) {
    scrollBox({ scrollLeft: 0, clientWidth, scrollWidth });
  }

  it('lets go of the listener and of the observer when the grid goes', () => {
    const remove = vi.spyOn(EventTarget.prototype, 'removeEventListener');
    const disconnect = vi.fn();
    class Observer {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = disconnect;
    }
    vi.stubGlobal('ResizeObserver', Observer);
    try {
      const { unmount } = render(<Orders defaultColumnLayout={pinned(LEFT_AND_RIGHT)} />);
      const element = frame();
      scrollFrameBy(500, 900);
      scroll();
      expect(scrolledRight()).toBe(true);
      unmount();
      expect(
        remove.mock.calls.filter(
          ([type], index) => type === 'scroll' && remove.mock.contexts[index] === element,
        ),
      ).toHaveLength(1);
      expect(disconnect).toHaveBeenCalled();
      expect(element.hasAttribute('data-scrolled-right')).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('watches the frame and the table, and only while a column is pinned', () => {
    const observed: Element[] = [];
    class Observer {
      constructor(public callback: () => void) {}
      observe = (element: Element) => void observed.push(element);
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    vi.stubGlobal('ResizeObserver', Observer);
    try {
      const { rerender } = render(<Orders columnLayout={layout({})} />);
      // Every column has a width, so the grid watches its frame for the filler column.
      const before = observed.length;
      rerender(<Orders columnLayout={layout({ qty: 'right' })} />);
      expect(observed.slice(before)).toEqual([frame(), grid()]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

/** A layout of the four columns with the pins given, and the widths of the columns. */
function layout(
  pins: Record<string, 'left' | 'right'>,
  widths: Record<string, number> = { id: 104, customer: 200, qty: 80, total: 120 },
): DataGridColumnLayout {
  return { order: ['id', 'customer', 'qty', 'total'], widths, hidden: [], pinned: pins };
}

describe('the filler column', () => {
  it('is at the end of the row when no column is pinned to the right', () => {
    render(<Orders defaultColumnLayout={pinned({ id: 'left' })} />);
    expect(kinds(headRow())).toEqual(['Order', 'Customer', 'Qty', 'Total', '·']);
    for (const row of bodyRows()) {
      expect(cellsIn(row)).toHaveLength(5);
      expect(kinds(row).indexOf('·')).toBe(4);
    }
    expect(grid().querySelectorAll('col')[4]).not.toHaveAttribute('style');
  });

  it('is before the right zone in the colgroup, the title, the rows and the skeleton rows', () => {
    const { rerender } = render(
      <Orders defaultColumnLayout={pinned({ qty: 'right', total: 'right' })} />,
    );
    const cols = Array.from(grid().querySelectorAll('col'));
    expect(cols).toHaveLength(5);
    // The columns in order: Order, Customer, the filler (no width), then the zone, Qty and Total.
    expect(cols.map((col) => col.style.width)).toEqual(['104px', '200px', '', '80px', '120px']);
    expect(kinds(headRow())).toEqual(['Order', 'Customer', '·', 'Qty', 'Total']);
    for (const row of bodyRows()) {
      expect(kinds(row).indexOf('·')).toBe(2);
      expect(cellsIn(row)).toHaveLength(5);
    }
    rerender(
      <Orders data={[]} loading defaultColumnLayout={pinned({ qty: 'right', total: 'right' })} />,
    );
    for (const row of grid().querySelectorAll<HTMLTableRowElement>('.flg-data-grid-skeleton-row')) {
      expect(kinds(row).indexOf('·')).toBe(2);
    }
  });

  it('is before the right zone when the zone is the whole row but one', () => {
    render(
      <Orders defaultColumnLayout={pinned({ customer: 'right', qty: 'right', total: 'right' })} />,
    );
    expect(kinds(headRow())).toEqual(['Order', '·', 'Customer', 'Qty', 'Total']);
  });

  it('is in no keyboard path: End, Left and Right go across it', () => {
    render(<Orders defaultColumnLayout={pinned({ qty: 'right', total: 'right' })} />);
    const row = () => bodyRows()[0]!;
    const press = (element: HTMLElement, key: string) => {
      const event = createEvent.keyDown(element, { key, bubbles: true, cancelable: true });
      act(() => void fireEvent(element, event));
    };
    // Order, Customer, filler, Qty, Total.
    act(() => row().cells[1]!.focus());
    press(row().cells[1]!, 'ArrowRight');
    expect(document.activeElement).toBe(row().cells[3]);
    press(row().cells[3]!, 'ArrowLeft');
    expect(document.activeElement).toBe(row().cells[1]);
    press(row().cells[1]!, 'End');
    expect(document.activeElement).toBe(row().cells[4]);
    press(row().cells[4]!, 'Home');
    expect(document.activeElement).toBe(row().cells[0]);
    // The cell of the right zone is the third column to the keyboard, not the fourth.
    act(() => row().cells[4]!.focus());
    press(row().cells[4]!, 'ArrowDown');
    expect(document.activeElement).toBe(bodyRows()[1]!.cells[4]);
    press(bodyRows()[1]!.cells[4]!, 'ArrowUp');
    press(row().cells[4]!, 'ArrowUp');
    expect(document.activeElement).toBe(headRow().cells[4]);
    press(headRow().cells[4]!, 'ArrowLeft');
    expect(document.activeElement).toBe(headRow().cells[3]);
    press(headRow().cells[3]!, 'ArrowLeft');
    expect(document.activeElement).toBe(headRow().cells[1]);
  });

  it('is no place of the keyboard: the active cell keeps its place across a press on it', () => {
    render(<Orders defaultColumnLayout={pinned({ qty: 'right', total: 'right' })} />);
    const row = bodyRows()[1]!;
    act(() => row.cells[3]!.focus());
    const filler = row.cells[2]!;
    expect(filler).toHaveClass('flg-data-grid-filler');
    const event = createEvent.mouseDown(filler, { bubbles: true, cancelable: true });
    act(() => void fireEvent(filler, event));
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(row.cells[3]);
    expect(Array.from(grid().querySelectorAll('[tabindex="0"]'))).toEqual([row.cells[3]]);
  });

  it('does not activate a row from a double press on it', () => {
    const onRowActivate = vi.fn();
    render(
      <Orders
        onRowActivate={onRowActivate}
        defaultColumnLayout={pinned({ qty: 'right', total: 'right' })}
      />,
    );
    act(() => void fireEvent.doubleClick(bodyRows()[0]!.cells[2]!));
    expect(onRowActivate).not.toHaveBeenCalled();
    act(() => void fireEvent.doubleClick(bodyRows()[0]!.cells[4]!));
    expect(onRowActivate).toHaveBeenCalledTimes(1);
  });
});

describe('the HTML of the server', () => {
  const headOf = (html: string) => {
    const holder = document.createElement('div');
    holder.innerHTML = html;
    return Array.from(holder.querySelector('thead tr')!.children, (one) =>
      one.classList.contains('flg-data-grid-filler') ? '·' : one.textContent,
    );
  };

  it('has the offsets from the least widths of the columns that have none', () => {
    const html = renderToString(
      <Orders
        columns={[{ ...COLUMNS[0]!, width: undefined, minWidth: 90 }, ...COLUMNS.slice(1)]}
        defaultColumnLayout={pinned({ id: 'left', total: 'right' })}
      />,
    );
    expect(html).toContain('data-pinned="left"');
    expect(html).toContain('data-pinned="right"');
    // Nothing is measured on the server: a flexible column counts its least width.
    expect(html).toContain('--flg-data-grid-pinned-left:90px');
    expect(html).toContain('--flg-data-grid-pinned-right:120px');
    // The scroll is a client matter: the server draws the grid at rest.
    expect(html).not.toContain('data-scrolled');
  });

  it('has the filler column before the right zone', () => {
    const html = renderToString(
      <Orders defaultColumnLayout={pinned({ id: 'left', total: 'right' })} />,
    );
    expect(headOf(html)).toEqual(['Order', 'Customer', 'Qty', '·', 'Total']);
  });
});
