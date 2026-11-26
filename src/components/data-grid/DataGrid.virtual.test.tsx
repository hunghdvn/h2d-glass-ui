import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode, createRef, useState } from 'react';
import type { Ref } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridHandle, DataGridProps } from './index';

// Virtual scrolling (spec phase 6 §3.7): only the rows near the viewport are in the DOM, two
// spacers stand for the rest, and the row that has the keyboard is never dropped.

const ROW = 41;
const FRAME = 400;
const HEAD = 41;

const frames: Array<() => void> = [];

beforeEach(() => {
  resetDevWarnings();
  HTMLElement.prototype.checkVisibility = () => true;
  // The frame is 400px tall, a row is 41px and the heading is 41px; jsdom has no layout.
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.classList.contains('flg-table-frame') ? FRAME : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.tagName === 'THEAD' ? HEAD : this.tagName === 'TR' ? ROW : 0;
  });
  // The frames are run by the test, so a scroll and the window that follows it are two steps.
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(() => callback(0));
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frames[id - 1] = () => {};
  });
});
afterEach(() => {
  frames.length = 0;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  vi.restoreAllMocks();
});

interface Order {
  id: string;
  customer: string;
  qty: number;
}

const makeOrders = (count: number): Order[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `DH-${index + 1}`,
    customer: `Customer ${index + 1}`,
    qty: index + 1,
  }));

const ORDERS = makeOrders(200);
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
      height={FRAME}
      scrolling="virtual"
      {...props}
    />
  );
}

const grid = () => screen.getByRole('grid');
const frame = () => grid().parentElement as HTMLElement;
const dataRows = () =>
  Array.from(grid().querySelectorAll<HTMLElement>('tbody > .flg-data-grid-row'));
const spacers = () =>
  Array.from(grid().querySelectorAll<HTMLElement>('tbody > .flg-data-grid-spacer'));
const rowIndexes = () => dataRows().map((row) => Number(row.getAttribute('aria-rowindex')));
const heightOf = (spacer: HTMLElement) => (spacer.firstElementChild as HTMLElement).style.height;
const cellOfRow = (rowindex: number, column = 1) =>
  grid().querySelector<HTMLElement>(`tbody > [aria-rowindex="${rowindex}"]`)!.children[
    column
  ] as HTMLElement;
const focusOn = (element: HTMLElement) => act(() => element.focus());
const press = (element: HTMLElement, key: string, init: KeyboardEventInit = {}): boolean => {
  const event = createEvent.keyDown(element, { key, bubbles: true, cancelable: true, ...init });
  act(() => {
    fireEvent(element, event);
  });
  return event.defaultPrevented;
};
/** Scrolls the frame, then lets the animation frame that applies it run. */
const scrollTo = (top: number) => {
  act(() => {
    frame().scrollTop = top;
    fireEvent.scroll(frame());
  });
  flushFrames();
};
const flushFrames = () => {
  act(() => {
    for (const run of frames.splice(0)) run();
  });
};

describe('the window', () => {
  it('draws the rows that are seen and 6 more on each side, and a spacer for the rest', () => {
    render(<Orders />);
    // 400px of 41px rows is rows 0 to 9; the row that begins at 410 is the first outside.
    expect(rowIndexes()).toEqual(Array.from({ length: 16 }, (_, index) => index + 2));
    expect(spacers()).toHaveLength(1);
    expect(heightOf(spacers()[0]!)).toBe(`${(200 - 16) * ROW}px`);
  });

  it('moves with the scroll, one animation frame after it', () => {
    render(<Orders />);
    act(() => {
      frame().scrollTop = 4100;
      fireEvent.scroll(frame());
    });
    // Nothing has changed until the frame comes.
    expect(rowIndexes()[1]).toBe(3);
    flushFrames();
    // Row 100 is at 4100: the window is 100 to 109, and 6 rows on each side. Row 0 is kept, since
    // it is the active one.
    expect(rowIndexes()).toEqual([2, ...Array.from({ length: 22 }, (_, index) => index + 96)]);
    expect(spacers().map(heightOf)).toEqual([`${93 * ROW}px`, `${(200 - 116) * ROW}px`]);
  });

  it('asks for one frame for any number of scroll events', () => {
    render(<Orders />);
    act(() => {
      for (const top of [100, 200, 300]) {
        frame().scrollTop = top;
        fireEvent.scroll(frame());
      }
    });
    expect(frames).toHaveLength(1);
  });

  it('ends at the last row, with no spacer after it', () => {
    render(<Orders />);
    scrollTo(200 * ROW - FRAME);
    expect(rowIndexes().at(-1)).toBe(201);
    expect(spacers().map(heightOf)).toEqual([expect.stringMatching(/^\d+px$/)]);
    expect(grid().querySelector('tbody')!.lastElementChild).toBe(dataRows().at(-1));
  });

  it('never makes a spacer of no height, and no spacer is a data row', () => {
    render(<Orders />);
    for (const top of [0, 41, 2460, 4100, 7800]) {
      scrollTo(top);
      for (const spacer of spacers()) {
        expect(parseFloat(heightOf(spacer))).toBeGreaterThan(0);
        expect(spacer).toHaveAttribute('aria-hidden', 'true');
        expect(spacer.classList.contains('flg-table-row')).toBe(false);
        expect(spacer.children).toHaveLength(1);
        // The three columns and the filler column, which every column having a width adds while
        // the frame is not measured (jsdom).
        expect(spacer.firstElementChild).toHaveAttribute('colspan', '4');
      }
    }
  });

  it('spans the three columns alone when the frame has no room for the filler column', () => {
    // The columns are 384px, and so is the frame.
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('flg-table-frame') ? 384 : 0;
    });
    render(<Orders />);
    expect(grid().querySelector('.flg-data-grid-filler')).toBeNull();
    scrollTo(4100);
    expect(spacers()).toHaveLength(2);
    for (const spacer of spacers()) {
      expect(spacer.firstElementChild).toHaveAttribute('colspan', '3');
    }
  });

  it('draws all the rows of a list that is shorter than the window', () => {
    render(<Orders data={makeOrders(5)} />);
    expect(dataRows()).toHaveLength(5);
    expect(spacers()).toHaveLength(0);
  });

  it('follows data that grows or shrinks', () => {
    const { rerender } = render(<Orders data={makeOrders(5)} />);
    rerender(<Orders data={ORDERS} />);
    expect(dataRows()).toHaveLength(16);
    expect(heightOf(spacers()[0]!)).toBe(`${(200 - 16) * ROW}px`);
    rerender(<Orders data={makeOrders(3)} />);
    expect(dataRows()).toHaveLength(3);
    expect(spacers()).toHaveLength(0);
  });

  it('follows the size of the frame', () => {
    let height = FRAME;
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('flg-table-frame') ? height : 0;
    });
    const observers: Array<{ callback: ResizeObserverCallback; disconnected: boolean }> = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        entry = { callback: undefined as unknown as ResizeObserverCallback, disconnected: false };
        constructor(callback: ResizeObserverCallback) {
          this.entry.callback = callback;
          observers.push(this.entry);
        }
        observe() {}
        unobserve() {}
        disconnect() {
          this.entry.disconnected = true;
        }
      },
    );
    const { unmount } = render(<Orders />);
    expect(dataRows()).toHaveLength(16);
    height = 820;
    act(() => {
      for (const observer of observers) observer.callback([], {} as ResizeObserver);
    });
    // 820px is rows 0 to 19.
    expect(dataRows()).toHaveLength(26);
    unmount();
    expect(observers.every((observer) => observer.disconnected)).toBe(true);
  });

  it('puts the stripe by the place of the row in the whole list', () => {
    render(<Orders variant="striped" />);
    scrollTo(41 * 99);
    const striped = dataRows().filter((row) => row.hasAttribute('data-stripe'));
    expect(striped.length).toBeGreaterThan(5);
    for (const row of dataRows()) {
      // The row with `aria-rowindex` n is the n - 2nd: the stripe is on the even ones from 0.
      expect(row.hasAttribute('data-stripe')).toBe(
        (Number(row.getAttribute('aria-rowindex')) - 2) % 2 === 0,
      );
    }
  });
});

describe('the pitch', () => {
  it('is the height of the row, and with `striped` the 2px between rows, until it is measured', () => {
    render(<Orders variant="striped" />);
    // The row is 40px and the gap 2: 42px for each row, less the 2px that the spacing adds around a
    // spacer of its own.
    expect(heightOf(spacers()[0]!)).toBe(`${(200 - 16) * 42 - 2}px`);
  });

  it('is the distance of two neighbour rows once they are there, and again when the density changes', () => {
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('flg-data-grid-row')
        ? (Number(this.getAttribute('aria-rowindex')) - 2) * 50
        : 0;
    });
    const { rerender } = render(<Orders />);
    // 400px of 50px rows is 8 rows, and the window is made again from the measure.
    expect(dataRows()).toHaveLength(8 + 6);
    expect(heightOf(spacers()[0]!)).toBe(`${(200 - 14) * 50}px`);
    // The measure is of the DOM and not of the estimate, so it is taken again for a new estimate.
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('flg-data-grid-row')
        ? (Number(this.getAttribute('aria-rowindex')) - 2) * 30
        : 0;
    });
    rerender(<Orders density="compact" />);
    // 400px of 30px rows is 14 rows.
    expect(dataRows()).toHaveLength(14 + 6);
    expect(heightOf(spacers()[0]!)).toBe(`${(200 - 20) * 30}px`);
  });

  it('is not measured where the rows have no place of their own, and the estimate stays', () => {
    // offsetTop is 0 in jsdom: two rows at the same place are not a pitch.
    render(<Orders />);
    expect(heightOf(spacers()[0]!)).toBe(`${(200 - 16) * ROW}px`);
  });
});

describe('aria-rowcount and aria-rowindex', () => {
  it('count the heading as row 1 and the rows after it, in the whole list', () => {
    render(<Orders />);
    expect(grid()).toHaveAttribute('aria-rowcount', '201');
    expect(grid().querySelector('thead > tr')).toHaveAttribute('aria-rowindex', '1');
    expect(rowIndexes()[0]).toBe(2);
    scrollTo(41 * 100);
    expect(dataRows().map((row) => row.getAttribute('aria-rowindex'))).toContain('110');
    expect(grid()).toHaveAttribute('aria-rowcount', '201');
  });

  it('are not set when the rows are all in the DOM', () => {
    render(<Orders scrolling="standard" paging={false} />);
    expect(grid()).not.toHaveAttribute('aria-rowcount');
    expect(grid().querySelector('[aria-rowindex]')).toBeNull();
    expect(dataRows()).toHaveLength(200);
  });

  it('are not set on a grid with pages', () => {
    render(<Orders scrolling="standard" />);
    expect(grid()).not.toHaveAttribute('aria-rowcount');
    expect(grid().querySelector('[aria-rowindex]')).toBeNull();
  });
});

describe('aria-rowcount and aria-rowindex with a filter row', () => {
  it('count the titles as row 1, the filter row as row 2 and the rows of data from 3, in the whole list', () => {
    render(<Orders filterRow />);
    expect(grid()).toHaveAttribute('aria-rowcount', '202');
    const [titles, filters] = Array.from(grid().querySelectorAll('thead > tr'));
    expect(titles).toHaveAttribute('aria-rowindex', '1');
    expect(filters).toHaveAttribute('aria-rowindex', '2');
    expect(rowIndexes()[0]).toBe(3);
    scrollTo(41 * 100);
    expect(dataRows().map((row) => row.getAttribute('aria-rowindex'))).toContain('111');
    expect(grid()).toHaveAttribute('aria-rowcount', '202');
  });

  it('are the old counts when the filter row goes', () => {
    const { rerender } = render(<Orders filterRow />);
    expect(rowIndexes()[0]).toBe(3);
    rerender(<Orders />);
    expect(grid()).toHaveAttribute('aria-rowcount', '201');
    expect(rowIndexes()[0]).toBe(2);
  });

  it('keep mod+End on the last row, and ↑ from a row far from the top reaches the filter row', () => {
    render(<Orders filterRow />);
    focusOn(cellOfRow(3));
    expect(press(cellOfRow(3), 'End', { ctrlKey: true })).toBe(true);
    flushFrames();
    const last = dataRows().at(-1)!;
    expect(last).toHaveAttribute('aria-rowindex', '202');
    expect(last.children[2]).toBe(document.activeElement);
    // The first row of the list is the third row of the table: ↑ from it is the filter row.
    scrollTo(0);
    focusOn(cellOfRow(3));
    press(cellOfRow(3), 'ArrowUp');
    expect(grid().querySelector('thead > tr:nth-child(2) > td')).toBeTruthy();
    expect(document.activeElement?.closest('tr')).toHaveAttribute('aria-rowindex', '2');
  });
});

describe('the row with the keyboard', () => {
  it('stays in the DOM, at its own place, when the frame scrolls away from it', () => {
    render(<Orders />);
    focusOn(cellOfRow(5));
    const focused = document.activeElement;
    scrollTo(41 * 150);
    expect(rowIndexes().slice(0, 2)).toEqual([5, 150 + 2 - 6]);
    expect(document.activeElement).toBe(focused);
    expect(focused).toBe(cellOfRow(5));
    // It is still the Tab stop, and the only one.
    expect(grid().querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect(cellOfRow(5)).toHaveAttribute('tabindex', '0');
    scrollTo(0);
    expect(document.activeElement).toBe(focused);
    expect(rowIndexes()).toEqual(Array.from({ length: 16 }, (_, index) => index + 2));
  });

  it('gets the focus back when a scroll alone takes out the row of a focused popup', () => {
    // A popup in a cell is a place of its own: the focus in it does not make its row the active
    // one, so a scroll may take that row out, and with it the focus.
    const columns: DataGridColumn<Order>[] = [
      ...COLUMNS,
      {
        id: 'note',
        caption: 'Note',
        width: 120,
        value: (row) => row.id,
        cell: ({ row }) =>
          row.id === 'DH-6' ? (
            <div popover="manual">
              <input aria-label="Note of DH-6" />
            </div>
          ) : null,
      },
    ];
    render(<Orders columns={columns} />);
    expect(grid().querySelector('tbody [tabindex="0"]')).toBe(cellOfRow(2, 0));
    const note = screen.getByLabelText('Note of DH-6');
    focusOn(note);
    expect(note).toHaveFocus();
    // The scroll is drawn by the body alone: no commit of the grid.
    scrollTo(41 * 150);
    expect(note.isConnected).toBe(false);
    expect(cellOfRow(2, 0)).toHaveFocus();
  });

  it('is kept when nothing has the focus, so the grid does not lose its Tab stop', () => {
    render(<Orders />);
    scrollTo(41 * 150);
    expect(rowIndexes()[0]).toBe(2);
    expect(grid().querySelectorAll('tbody [tabindex="0"]')).toHaveLength(1);
  });

  it('is not drawn twice where the window meets it', () => {
    render(<Orders />);
    focusOn(cellOfRow(12));
    scrollTo(41 * 3);
    const indexes = rowIndexes();
    expect(new Set(indexes).size).toBe(indexes.length);
    expect(
      spacers()
        .map(heightOf)
        .every((value) => parseFloat(value) > 0),
    ).toBe(true);
  });

  it('is reached by mod+End, which scrolls to the last row, draws it and focuses it', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
    render(<Orders />);
    focusOn(cellOfRow(2));
    expect(press(cellOfRow(2), 'End', { ctrlKey: true })).toBe(true);
    const last = grid().querySelector<HTMLElement>('tbody > [aria-rowindex="201"]')!;
    expect(last).not.toBeNull();
    expect(document.activeElement).toBe(last.children[2]);
    expect(frame().scrollTop).toBe(200 * ROW + HEAD - FRAME);
    // The row it left is still drawn, for the focus came from it, and no more than the window.
    flushFrames();
    expect(dataRows().length).toBeLessThanOrEqual(10 + 2 * 6 + 1 + 1);
  });

  it('is reached by mod+Home from the end, and the first row is drawn again', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
    render(<Orders />);
    focusOn(cellOfRow(2));
    press(cellOfRow(2), 'End', { ctrlKey: true });
    flushFrames();
    const lastCell = document.activeElement as HTMLElement;
    expect(press(lastCell, 'Home', { ctrlKey: true })).toBe(true);
    expect(document.activeElement).toBe(cellOfRow(2, 0));
    expect(frame().scrollTop).toBe(0);
  });

  it('is moved by the arrows past the window, which draws the row first', () => {
    render(<Orders />);
    focusOn(cellOfRow(2));
    scrollTo(41 * 150);
    expect(grid().querySelector('tbody > [aria-rowindex="3"]')).toBeNull();
    expect(press(cellOfRow(2), 'ArrowDown')).toBe(true);
    expect(document.activeElement).toBe(cellOfRow(3));
    // The row is brought to the top of what is under the heading.
    expect(frame().scrollTop).toBe(ROW);
  });

  it('is moved by PageDown past the window the same way', () => {
    render(<Orders />);
    focusOn(cellOfRow(2));
    scrollTo(41 * 150);
    press(cellOfRow(2), 'PageDown');
    // The frame shows (400 - 41) / 41 = 8 rows below the heading.
    expect(document.activeElement).toBe(cellOfRow(10));
  });

  describe('a move to a row that is not drawn', () => {
    // A popover or a sheet that holds a grid may close when the focus leaves it, so no commit may take
    // out the element that has it, not even for the length of a key press. jsdom fires no event for a
    // removed focused element, so the removal itself is watched, as well as every focusout.
    const watch = () => {
      const lost: string[] = [];
      const remove = Node.prototype.removeChild;
      vi.spyOn(Node.prototype, 'removeChild').mockImplementation(function <T extends Node>(
        this: Node,
        child: T,
      ): T {
        if (child.contains(document.activeElement)) lost.push('removed with the focus');
        return remove.call(this, child) as T;
      });
      const rootElement = grid().closest('.flg-data-grid')!;
      rootElement.addEventListener('focusout', (event) => {
        const next = (event as FocusEvent).relatedTarget;
        if (!(next instanceof Node) || !rootElement.contains(next)) lost.push('focusout');
      });
      return lost;
    };

    it('keeps the row that has the focus until the focus is in the new one (mod+End)', () => {
      vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
      render(<Orders />);
      focusOn(cellOfRow(4));
      const lost = watch();
      expect(press(cellOfRow(4), 'End', { ctrlKey: true })).toBe(true);
      expect(lost).toEqual([]);
      expect(document.activeElement?.closest('tr')).toHaveAttribute('aria-rowindex', '201');
      // Once the move has settled the old row is gone: only the window and the new row are drawn.
      expect(grid().querySelector('tbody > [aria-rowindex="4"]')).toBeNull();
      expect(dataRows().length).toBeLessThanOrEqual(10 + 2 * 6 + 1);
      expect(grid().querySelectorAll('tbody [tabindex="0"]')).toHaveLength(1);
    });

    it('keeps it for PageDown past the window too', () => {
      render(<Orders />);
      focusOn(cellOfRow(2));
      scrollTo(41 * 150);
      const lost = watch();
      press(cellOfRow(2), 'PageDown');
      expect(lost).toEqual([]);
      expect(document.activeElement).toBe(cellOfRow(10));
      expect(grid().querySelector('tbody > [aria-rowindex="2"]')).toBeNull();
    });

    it('keeps it for an arrow past the window, and for mod+Home back', () => {
      vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
      render(<Orders />);
      focusOn(cellOfRow(2));
      scrollTo(41 * 150);
      const lost = watch();
      press(cellOfRow(2), 'ArrowDown');
      expect(document.activeElement).toBe(cellOfRow(3));
      press(cellOfRow(3), 'End', { ctrlKey: true });
      press(document.activeElement as HTMLElement, 'Home', { ctrlKey: true });
      expect(lost).toEqual([]);
      expect(document.activeElement).toBe(cellOfRow(2, 0));
    });

    it('keeps only the row of the keyboard once the move has settled', () => {
      vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
      render(<Orders />);
      focusOn(cellOfRow(2));
      press(cellOfRow(2), 'End', { ctrlKey: true });
      flushFrames();
      scrollTo(0);
      expect(rowIndexes()).toEqual([...Array.from({ length: 16 }, (_, index) => index + 2), 201]);
    });
  });

  it('keeps the focus on a cell that scrolls out and back through every step of a long scroll', () => {
    render(<Orders />);
    focusOn(cellOfRow(12));
    const focused = document.activeElement;
    for (const top of [0, 500, 2000, 5000, 7800, 3000, 600, 0]) {
      scrollTo(top);
      expect(document.activeElement).toBe(focused);
    }
  });

  it('finds a cell by the place of its row and not by its place in the DOM', () => {
    render(<Orders />);
    scrollTo(41 * 150);
    const onlyDrawn = cellOfRow(156);
    focusOn(onlyDrawn);
    expect(press(onlyDrawn, 'ArrowUp')).toBe(true);
    expect(document.activeElement).toBe(cellOfRow(155));
    // The kept row (the first) and the window are two runs; a key moves in the list, not the DOM.
    press(cellOfRow(155), 'ArrowRight');
    expect(document.activeElement).toBe(cellOfRow(155, 2));
  });
});

describe('server HTML', () => {
  const rowsOf = (html: string) => html.match(/<tr[^>]*flg-data-grid-row/g)?.length;

  it('has the first window: the rows a number of pixels shows, and 6 more', () => {
    const html = renderToString(<Orders height={400} />);
    expect(rowsOf(html)).toBe(Math.ceil(400 / ROW) + 6);
    expect(html).toContain('aria-rowcount="201"');
    expect(html).toContain('flg-data-grid-spacer');
  });

  it('has 20 rows when the height is a length', () => {
    const html = renderToString(<Orders height="60vh" />);
    expect(rowsOf(html)).toBe(20);
  });

  it('has the rows of a row height that was asked for', () => {
    const html = renderToString(<Orders height={500} rowHeight={25} />);
    expect(rowsOf(html)).toBe(20 + 6);
  });

  it('draws the same window on the client before it has measured', () => {
    // Nothing is measured in the first render: no clientHeight, so the first window is the server's.
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(0);
    render(<Orders height={400} />);
    expect(dataRows()).toHaveLength(Math.ceil(400 / ROW) + 6);
  });
});

describe('what it asks of the props', () => {
  const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});

  it('needs a height, or the grid scrolls as usual, with one warning', () => {
    const warn = spyWarn();
    const { rerender } = render(<Orders height={undefined} paging={false} />);
    expect(dataRows()).toHaveLength(200);
    expect(grid()).not.toHaveAttribute('aria-rowcount');
    expect(spacers()).toHaveLength(0);
    rerender(<Orders height={undefined} paging={false} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain('height');
  });

  it('scrolls as usual in server mode, with one warning', () => {
    const warn = spyWarn();
    render(<Orders remote totalCount={1000} data={makeOrders(20)} />);
    expect(dataRows()).toHaveLength(20);
    expect(grid()).not.toHaveAttribute('aria-rowcount');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain('remote');
  });

  it('ignores an object for paging, with one warning, and has no pager', () => {
    const warn = spyWarn();
    const { container, rerender } = render(<Orders paging={{ pageSize: 10 }} />);
    rerender(<Orders paging={{ pageSize: 10 }} />);
    expect(rowIndexes()).toHaveLength(16);
    expect(container.querySelector('.flg-data-grid-pager')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain('paging');
  });

  it('does not warn when paging is false, nor when it is left out', () => {
    const warn = spyWarn();
    render(<Orders paging={false} />);
    render(<Orders />);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns once under StrictMode too', () => {
    const warn = spyWarn();
    render(
      <StrictMode>
        <Orders height={undefined} />
      </StrictMode>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('does not warn about paging when virtual is not on, which a missing height says', () => {
    const warn = spyWarn();
    render(<Orders height={undefined} paging={{ pageSize: 10 }} />);
    // The grid is paged as usual: the one warning is about the height.
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain('height');
    expect(dataRows()).toHaveLength(10);
  });

  it('takes a value outside the union as standard, with no warning', () => {
    const warn = spyWarn();
    // @ts-expect-error a value that a saved setting may bring
    render(<Orders scrolling="infinite" paging={false} />);
    expect(dataRows()).toHaveLength(200);
    expect(warn).not.toHaveBeenCalled();
  });

  it('can be turned on and off on a mounted grid', () => {
    const { rerender } = render(<Orders scrolling="standard" paging={false} />);
    expect(dataRows()).toHaveLength(200);
    rerender(<Orders paging={false} />);
    expect(dataRows()).toHaveLength(16);
    expect(grid()).toHaveAttribute('aria-rowcount', '201');
    rerender(<Orders scrolling="standard" paging={false} />);
    expect(dataRows()).toHaveLength(200);
    expect(grid()).not.toHaveAttribute('aria-rowcount');
    expect(spacers()).toHaveLength(0);
  });
});

/** How many times a spy was called for a scroll listener on `target` (React has its own, on the root). */
const scrollListeners = (
  spy: { mock: { calls: unknown[][]; contexts: unknown[] } },
  target: Element,
): number =>
  spy.mock.calls.filter(
    (call, index) => call[0] === 'scroll' && spy.mock.contexts[index] === target,
  ).length;

describe('what runs only when it is on', () => {
  it('listens to no scroll in a standard grid, and observes the frame for the filler column alone', () => {
    const add = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    const observed: Element[][] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        private readonly targets: Element[] = [];
        constructor() {
          observed.push(this.targets);
        }
        observe(target: Element) {
          this.targets.push(target);
        }
        unobserve() {}
        disconnect() {}
      },
    );
    render(<Orders scrolling="standard" paging={false} height={undefined} />);
    expect(scrollListeners(add, frame())).toBe(0);
    // Every column has a width: the frame is watched for the room of the filler column, and nothing
    // of the window is.
    expect(observed).toEqual([[frame()]]);
    fireEvent.scroll(frame());
    expect(frames).toHaveLength(0);
  });

  it('reads no row offset in a standard grid', () => {
    const offsetTop = vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get');
    render(<Orders scrolling="standard" paging={false} />);
    expect(offsetTop).not.toHaveBeenCalled();
  });

  it('releases the listener, the frame and the observer on unmount', () => {
    const remove = vi.spyOn(HTMLElement.prototype, 'removeEventListener');
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const { unmount } = render(<Orders />);
    const scrolled = frame();
    act(() => {
      fireEvent.scroll(scrolled);
    });
    unmount();
    expect(scrollListeners(remove, scrolled)).toBe(1);
    expect(cancel).toHaveBeenCalledTimes(1);
    // A frame that was already asked for does nothing after that.
    expect(() => flushFrames()).not.toThrow();
  });

  it('releases the listener when virtual goes off', () => {
    const remove = vi.spyOn(HTMLElement.prototype, 'removeEventListener');
    const add = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    const { rerender } = render(<Orders paging={false} />);
    const scrolled = frame();
    expect(scrollListeners(add, scrolled)).toBe(1);
    rerender(<Orders scrolling="standard" paging={false} />);
    expect(scrollListeners(remove, scrolled)).toBe(1);
  });
});

describe('what draws again', () => {
  const calls: string[] = [];
  const counted: DataGridColumn<Order>[] = [
    { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
    {
      field: 'customer',
      caption: 'Customer',
      width: 200,
      cell: ({ text, rowKey }) => {
        calls.push(String(rowKey));
        return text;
      },
    },
    { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
  ];
  const rowCell = (index: number, column = 1) => dataRows()[index]!.children[column] as HTMLElement;
  beforeEach(() => {
    calls.length = 0;
  });

  it.each([['virtual'], ['standard']])(
    'is, when the active cell moves, only the rows it leaves and enters (%s)',
    (mode) => {
      render(
        <Orders
          columns={counted}
          scrolling={mode === 'virtual' ? 'virtual' : 'standard'}
          paging={false}
          data={makeOrders(mode === 'virtual' ? 200 : 40)}
        />,
      );
      focusOn(rowCell(3));
      calls.length = 0;
      press(rowCell(3), 'ArrowDown');
      expect(calls.sort()).toEqual(['DH-4', 'DH-5']);
      calls.length = 0;
      press(rowCell(4), 'ArrowRight');
      expect(calls).toEqual(['DH-5']);
    },
  );

  it('is nothing for the rows that a scroll keeps', () => {
    render(<Orders columns={counted} />);
    calls.length = 0;
    scrollTo(41 * 3);
    // The window grows by the 3 rows at its end: the rows it already had are not drawn again.
    expect(calls.sort()).toEqual(['DH-17', 'DH-18', 'DH-19']);
  });
});

describe('scrollToRow', () => {
  it('scrolls a virtual grid to the offset of the row, the least it takes', () => {
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} />);
    let found = false;
    act(() => {
      found = ref.current!.scrollToRow('DH-101');
    });
    expect(found).toBe(true);
    // The row is under the window: it ends at the bottom of the frame, past the heading.
    expect(frame().scrollTop).toBe(101 * ROW + HEAD - FRAME);
    expect(grid().querySelector('tbody > [aria-rowindex="102"]')).not.toBeNull();
    // A row above is brought to the top of what is under the heading.
    act(() => {
      ref.current!.scrollToRow('DH-3');
    });
    expect(frame().scrollTop).toBe(2 * ROW);
    // A row that is in sight does not move the frame.
    act(() => {
      ref.current!.scrollToRow('DH-5');
    });
    expect(frame().scrollTop).toBe(2 * ROW);
  });

  it('does not move the keyboard', () => {
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} />);
    focusOn(cellOfRow(4));
    act(() => {
      ref.current!.scrollToRow('DH-150');
    });
    expect(document.activeElement).toBe(cellOfRow(4));
  });

  it('is false for a key that is not a row, and leaves the frame alone', () => {
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} />);
    expect(ref.current!.scrollToRow('nope')).toBe(false);
    expect(frame().scrollTop).toBe(0);
  });

  it('goes to the page of the row in a paged grid, and scrolls the row into view', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const ref = createRef<DataGridHandle>();
    const onPageChange = vi.fn();
    render(
      <Orders
        gridRef={ref}
        scrolling="standard"
        paging={{ pageSize: 20 }}
        onPageChange={onPageChange}
      />,
    );
    let found = false;
    act(() => {
      found = ref.current!.scrollToRow('DH-45');
    });
    expect(found).toBe(true);
    expect(ref.current!.getState().page).toEqual({ index: 2, size: 20 });
    expect(onPageChange).toHaveBeenCalledWith({ index: 2, size: 20 });
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(dataRows()[4]);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
  });

  it('does not change the page when the row is on the page shown', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const ref = createRef<DataGridHandle>();
    const onPageChange = vi.fn();
    render(
      <Orders
        gridRef={ref}
        scrolling="standard"
        paging={{ pageSize: 20 }}
        onPageChange={onPageChange}
      />,
    );
    act(() => {
      ref.current!.scrollToRow('DH-7');
    });
    expect(onPageChange).not.toHaveBeenCalled();
    expect(scrollIntoView.mock.contexts[0]).toBe(dataRows()[6]);
  });

  it('scrolls a grid with no paging and no virtual window to the row', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} scrolling="standard" paging={false} />);
    act(() => {
      ref.current!.scrollToRow('DH-90');
    });
    expect(scrollIntoView.mock.contexts[0]).toBe(dataRows()[89]);
  });

  it('follows a page that the parent holds, once it has changed it', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const ref = createRef<DataGridHandle>();
    function Controlled() {
      const [page, setPage] = useState({ index: 0, size: 20 });
      return (
        <Orders
          gridRef={ref}
          scrolling="standard"
          paging={{ pageSize: 20 }}
          page={page}
          onPageChange={setPage}
        />
      );
    }
    render(<Controlled />);
    act(() => {
      ref.current!.scrollToRow('DH-45');
    });
    expect(ref.current!.getState().page.index).toBe(2);
    expect(scrollIntoView.mock.contexts[0]).toBe(dataRows()[4]);
  });

  it('drops a request for a page the parent refused at the next commit, whatever it is', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const ref = createRef<DataGridHandle>();
    const props = {
      gridRef: ref,
      scrolling: 'standard',
      paging: { pageSize: 20 },
      onPageChange: () => {},
    } as const;
    const { rerender } = render(<Orders {...props} page={{ index: 0, size: 20 }} />);
    act(() => {
      expect(ref.current!.scrollToRow('DH-45')).toBe(true);
    });
    // The parent kept the page, so nothing was drawn again; the next commit, an unrelated one, ends
    // the request without scrolling anywhere.
    rerender(<Orders {...props} page={{ index: 0, size: 20 }} caption="Orders, again" />);
    expect(scrollIntoView).not.toHaveBeenCalled();
    // The page the parent moves to later is not the request's to bring a scroll.
    rerender(<Orders {...props} page={{ index: 2, size: 20 }} caption="Orders, again" />);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('drops it too when the next commit is on another page than the one asked for', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const ref = createRef<DataGridHandle>();
    const props = { gridRef: ref, scrolling: 'standard', onPageChange: () => {} } as const;
    const { rerender } = render(
      <Orders {...props} paging={{ pageSize: 20 }} page={{ index: 0, size: 20 }} />,
    );
    act(() => {
      ref.current!.scrollToRow('DH-45');
    });
    // The parent answers with page 1, not 2: the row is not on it.
    rerender(<Orders {...props} paging={{ pageSize: 20 }} page={{ index: 1, size: 20 }} />);
    expect(scrollIntoView).not.toHaveBeenCalled();
    rerender(<Orders {...props} paging={{ pageSize: 20 }} page={{ index: 2, size: 20 }} />);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('keeps the handle the same object across a scroll', () => {
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} />);
    const handle = ref.current;
    scrollTo(500);
    expect(ref.current).toBe(handle);
  });
});

describe('rows that are chosen', () => {
  it('keeps what is chosen through a scroll, and shows it on the rows that are drawn', () => {
    render(<Orders selectionMode="multiple" defaultSelectedKeys={['DH-120', 'DH-1']} />);
    scrollTo(41 * 118);
    // The first row is kept as the active one, and the other is in the window.
    const chosen = dataRows().filter((row) => row.hasAttribute('data-selected'));
    expect(chosen.map((row) => row.getAttribute('aria-rowindex'))).toEqual(['2', '121']);
  });
});

describe('Tab in cell mode', () => {
  const EDITABLE: DataGridColumn<Order>[] = COLUMNS.map((column) =>
    column.field === 'customer' ? column : { ...column, allowEditing: false },
  );
  const editorOf = (rowindex: number) =>
    grid().querySelector<HTMLInputElement>(
      `tbody > [aria-rowindex="${rowindex}"] td[data-editing] input`,
    );

  it('reveals the row the window has not drawn, as the arrow does, and opens its editor', () => {
    render(<Orders columns={EDITABLE} editing={{ mode: 'cell' }} onSaving={() => {}} />);
    // Rows 0 to 15 are drawn: the last of them is aria-rowindex 17.
    expect(rowIndexes().at(-1)).toBe(17);
    act(() => cellOfRow(17).click());
    expect(editorOf(17)).toHaveFocus();
    press(editorOf(17)!, 'Tab');
    flushFrames();
    // The next row (aria-rowindex 18) is drawn now, and its editor has the focus.
    expect(rowIndexes()).toContain(18);
    expect(editorOf(18)).not.toBeNull();
    expect(editorOf(18)).toHaveFocus();
    // The frame is scrolled as the arrow does it: the row stands above the bottom of the frame, under the heading.
    expect(frame().scrollTop).toBe(17 * ROW + HEAD - FRAME);
  });

  it('does the same upward with Shift+Tab', () => {
    render(<Orders columns={EDITABLE} editing={{ mode: 'cell' }} onSaving={() => {}} />);
    scrollTo(41 * 100);
    const first = rowIndexes()[1]!;
    act(() => cellOfRow(first).click());
    expect(editorOf(first)).toHaveFocus();
    // The row above the first of the window is not drawn.
    const target = first - 1;
    expect(rowIndexes()).not.toContain(target);
    press(editorOf(first)!, 'Tab', { shiftKey: true });
    flushFrames();
    expect(editorOf(target)).toHaveFocus();
    // aria-rowindex counts the heading and its own row: the row of the list is two less.
    expect(frame().scrollTop).toBe(Math.min(4100, (target - 2) * ROW));
  });
});
