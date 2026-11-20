import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridColumnLayout } from './index';

// What a frame of a scroll draws (review of PR #42): the window of a virtual grid is the body's, so a
// scroll that changes it draws the body and the rows that come, and nothing above them. The parts are
// wrapped to count their renders; each wrapper calls the real part, so the grid is the same.

const renders = vi.hoisted(() => ({ headerCell: 0, toolbar: 0, body: 0, cell: 0 }));

vi.mock('./parts/HeaderCell', async (importOriginal) => {
  const real = await importOriginal<typeof import('./parts/HeaderCell')>();
  return {
    ...real,
    HeaderCell: (props: Parameters<typeof real.HeaderCell>[0]) => {
      renders.headerCell += 1;
      return real.HeaderCell(props);
    },
  };
});
vi.mock('./parts/Cell', async (importOriginal) => {
  const real = await importOriginal<typeof import('./parts/Cell')>();
  return {
    ...real,
    Cell: (props: Parameters<typeof real.Cell>[0]) => {
      renders.cell += 1;
      return real.Cell(props);
    },
  };
});
vi.mock('./parts/Toolbar', async (importOriginal) => {
  const real = await importOriginal<typeof import('./parts/Toolbar')>();
  return {
    ...real,
    Toolbar: (props: Parameters<typeof real.Toolbar>[0]) => {
      renders.toolbar += 1;
      return real.Toolbar(props);
    },
  };
});
vi.mock('./parts/Body', async (importOriginal) => {
  const real = await importOriginal<typeof import('./parts/Body')>();
  return {
    ...real,
    Body: () => {
      renders.body += 1;
      return real.Body();
    },
  };
});

const FRAME = 400;
const frames: Array<() => void> = [];

beforeEach(() => {
  resetDevWarnings();
  HTMLElement.prototype.checkVisibility = () => true;
  // A frame of 400px, rows and a heading of 41px; jsdom has no layout.
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.classList.contains('flg-table-frame') ? FRAME : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.tagName === 'THEAD' || this.tagName === 'TR' ? 41 : 0;
  });
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
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  vi.restoreAllMocks();
});

interface Order {
  id: string;
  customer: string;
  qty: number;
}

const ORDERS: Order[] = Array.from({ length: 200 }, (_, index) => ({
  id: `DH-${index + 1}`,
  customer: `Customer ${index + 1}`,
  qty: index + 1,
}));
const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
  {
    field: 'customer',
    caption: 'Customer',
    width: 200,
    // A cell of the caller's, so the rows are watched for controls too.
    cell: ({ text }) => <a href={`#${text}`}>{text}</a>,
  },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
];

const grid = () => screen.getByRole('grid') as HTMLTableElement;
// The last row drawn: the first is the row of the active cell, which is drawn wherever the frame is.
const lastDrawn = () =>
  Math.max(
    ...Array.from(grid().querySelectorAll('tbody > .flg-data-grid-row'), (row) =>
      Number(row.getAttribute('aria-rowindex')),
    ),
  );

/** Scrolls the frame, then runs the animation frame that applies it. */
const scrollTo = (top: number) => {
  act(() => {
    const frame = grid().parentElement!;
    frame.scrollTop = top;
    fireEvent.scroll(frame);
  });
  act(() => {
    for (const run of frames.splice(0)) run();
  });
};

describe('a frame of a scroll of a virtual grid', () => {
  it('draws the body and nothing above it: no title, no toolbar, no walk of the heading', () => {
    render(
      <DataGrid
        data={ORDERS}
        rowKey="id"
        columns={COLUMNS}
        caption="Orders"
        height={FRAME}
        scrolling="virtual"
        defaultSort={[{ field: 'qty', direction: 'asc' }]}
      />,
    );
    expect(lastDrawn()).toBe(17);
    const walks = vi.spyOn(grid().tHead!, 'querySelectorAll');
    renders.headerCell = 0;
    renders.toolbar = 0;
    renders.body = 0;
    scrollTo(41 * 100);
    // The window moved, which the body drew.
    expect(lastDrawn()).toBeGreaterThan(100);
    expect(renders.body).toBeGreaterThan(0);
    // The grid itself did not render: the toolbar, which it draws on each of its renders, did not,
    // and so no effect of its ran (the release of the controls walks the heading on each).
    expect(renders.toolbar).toBe(0);
    expect(renders.headerCell).toBe(0);
    expect(walks).not.toHaveBeenCalled();
  });
});

// The layout of the columns (phase 6 Plan C): a layout written in the JSX is a new object in every
// render, and a width is the table's alone.
describe('the layout of the columns', () => {
  const LAYOUT = (parts: Partial<DataGridColumnLayout> = {}): DataGridColumnLayout => ({
    order: ['id', 'customer', 'qty'],
    widths: { id: 104, customer: 200, qty: 80 },
    hidden: [],
    pinned: {},
    ...parts,
  });
  const small = (props: Partial<React.ComponentProps<typeof DataGrid<Order>>> = {}) => (
    <DataGrid
      data={ORDERS.slice(0, 5)}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      {...props}
    />
  );
  const reset = () => {
    renders.cell = 0;
    renders.headerCell = 0;
    renders.toolbar = 0;
    renders.body = 0;
  };

  it('draws no row again for a layout written inline that says what it said before', () => {
    const onColumnLayoutChange = () => {};
    reset();
    const { rerender } = render(
      small({ columnLayout: LAYOUT(), onColumnLayoutChange, defaultColumnLayout: { hidden: [] } }),
    );
    expect(renders.cell).toBe(5 * 3);
    reset();
    // The layout, the default and the handler are all new in this render.
    rerender(
      small({
        columnLayout: LAYOUT(),
        onColumnLayoutChange: () => {},
        defaultColumnLayout: { hidden: [] },
      }),
    );
    expect(renders.cell).toBe(0);
    expect(renders.headerCell).toBe(0);
  });

  it('draws no row and no title for a change of a width: it is the table that reads it', () => {
    reset();
    const { rerender } = render(small({ columnLayout: LAYOUT() }));
    reset();
    rerender(small({ columnLayout: LAYOUT({ widths: { id: 104, customer: 260, qty: 80 } }) }));
    expect(grid().querySelectorAll('col')[1]).toHaveStyle({ width: '260px' });
    expect(renders.cell).toBe(0);
    expect(renders.headerCell).toBe(0);
  });

  it('draws the rows once for a change of the order, which is a change of what they hold', () => {
    reset();
    const { rerender } = render(small({ columnLayout: LAYOUT() }));
    reset();
    rerender(small({ columnLayout: LAYOUT({ order: ['qty', 'id', 'customer'] }) }));
    expect(renders.headerCell).toBe(3);
    expect(renders.cell).toBe(5 * 3);
  });
});

// Pinned columns (phase 6 Plan C): the scroll of the frame is written to its attributes directly, so
// it draws nothing, and a pin is a change of what every cell says, which draws the rows once.
describe('a grid with a pinned column', () => {
  const PINNED = (pinned: DataGridColumnLayout['pinned']): DataGridColumnLayout => ({
    order: ['id', 'customer', 'qty'],
    widths: { id: 104, customer: 200, qty: 80 },
    hidden: [],
    pinned,
  });
  const small = (columnLayout: DataGridColumnLayout) => (
    <DataGrid
      data={ORDERS.slice(0, 5)}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      columnLayout={columnLayout}
    />
  );
  const reset = () => {
    renders.cell = 0;
    renders.headerCell = 0;
    renders.toolbar = 0;
    renders.body = 0;
  };

  it('draws no toolbar, title, row or body for a scroll of its frame', () => {
    render(small(PINNED({ id: 'left', qty: 'right' })));
    const frame = grid().parentElement!;
    reset();
    for (const left of [0, 30, 60, 100]) {
      Object.defineProperty(frame, 'scrollLeft', { configurable: true, value: left });
      Object.defineProperty(frame, 'clientWidth', { configurable: true, value: 200 });
      Object.defineProperty(frame, 'scrollWidth', { configurable: true, value: 400 });
      act(() => void fireEvent.scroll(frame));
    }
    // It did something: the frame says it is scrolled from its left end.
    expect(frame).toHaveAttribute('data-scrolled-left');
    expect(frame).toHaveAttribute('data-scrolled-right');
    expect(renders.toolbar).toBe(0);
    expect(renders.headerCell).toBe(0);
    expect(renders.body).toBe(0);
    expect(renders.cell).toBe(0);
  });

  it('draws the rows once for a column that is pinned, and no more for its width', () => {
    const { rerender } = render(small(PINNED({})));
    reset();
    rerender(small(PINNED({ id: 'left' })));
    expect(renders.headerCell).toBe(3);
    expect(renders.cell).toBe(5 * 3);
    reset();
    rerender(small({ ...PINNED({ id: 'left' }), widths: { id: 150, customer: 200, qty: 80 } }));
    expect(renders.headerCell).toBe(0);
    expect(renders.cell).toBe(0);
    expect(grid().style.getPropertyValue('--flg-data-grid-pin-0')).toContain('0px');
    expect(grid().style.getPropertyValue('--flg-data-grid-pinned-left')).toBe('150px');
  });
});

// Resizing (phase 6 Plan C): a drag writes its widths into a store that only the table and the guide
// read, so no move of the pointer draws a title, a row, the body or the toolbar. The release changes
// the layout's widths, which are the table's too: the rows and the titles do not draw for it either; a
// grid that holds its own layout renders itself once for that, which is its state changing.
describe('a drag of the handle of a column', () => {
  const POINTER = { pointerId: 1, isPrimary: true, pointerType: 'mouse', button: 0 };
  const LAYOUT: DataGridColumnLayout = {
    order: ['id', 'customer', 'qty'],
    widths: { id: 104, customer: 200, qty: 80 },
    hidden: [],
    pinned: {},
  };
  const reset = () => {
    renders.cell = 0;
    renders.headerCell = 0;
    renders.toolbar = 0;
    renders.body = 0;
  };

  /** Drags the handle of Customer by 50px, and says what was drawn by the moves and by the release. */
  function dragCustomer(
    props: Partial<React.ComponentProps<typeof DataGrid<Order>>>,
    width: string,
  ) {
    render(
      <DataGrid
        data={ORDERS.slice(0, 5)}
        rowKey="id"
        columns={COLUMNS}
        caption="Orders"
        paging={false}
        {...props}
      />,
    );
    // jsdom has no layout: the frame is wide, so the pointer is never at its edge.
    const frame = grid().parentElement!;
    frame.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 10000, bottom: 10000, width: 0, height: 0 }) as DOMRect;
    const handle = grid().tHead!.rows[0]!.cells[1]!.querySelector('.flg-data-grid-resizer')!;
    reset();
    fireEvent.pointerDown(handle, { ...POINTER, buttons: 1, clientX: 300, clientY: 10 });
    for (const x of [310, 320, 330, 340, 350]) {
      fireEvent.pointerMove(document, { ...POINTER, buttons: 1, clientX: x, clientY: 10 });
      act(() => {
        for (const run of frames.splice(0)) run();
      });
    }
    // It did something: the table has the width the pointer says.
    expect(grid().querySelectorAll('col')[1]).toHaveStyle({ width });
    const moves = { ...renders };
    fireEvent.pointerUp(document, { ...POINTER, buttons: 0, clientX: 350, clientY: 10 });
    return { moves, release: { ...renders } };
  }

  it('draws no toolbar, title, row or body, from the first move to the release', () => {
    const onColumnLayoutChange = vi.fn();
    const { moves, release } = dragCustomer(
      { columnLayout: LAYOUT, onColumnLayoutChange },
      '250px',
    );
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
    for (const drawn of [moves, release]) {
      expect(drawn).toEqual({ headerCell: 0, toolbar: 0, body: 0, cell: 0 });
    }
  });

  it('draws no title and no cell for the release of a grid that holds its layout', () => {
    const { moves, release } = dragCustomer(
      {
        defaultColumnLayout: { widths: { id: 104, customer: 200, qty: 80 } },
        // The layout and the handler written inline say what they said before.
        onColumnLayoutChange: () => {},
      },
      '250px',
    );
    expect(moves).toEqual({ headerCell: 0, toolbar: 0, body: 0, cell: 0 });
    // The grid's own state changes once, at the release: the grid draws, with its toolbar and the list
    // of its rows, and no title and no cell is drawn again.
    expect(release).toEqual({ headerCell: 0, toolbar: 1, body: 1, cell: 0 });
  });

  it('draws no title and no cell when the drag freezes columns that had no width', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('flg-table-frame') ? 900 : 0;
    });
    const { moves, release } = dragCustomer(
      { columns: COLUMNS.map((column) => ({ ...column, width: undefined })) },
      '350px',
    );
    expect(moves).toEqual({ headerCell: 0, toolbar: 0, body: 0, cell: 0 });
    expect(release).toEqual({ headerCell: 0, toolbar: 1, body: 1, cell: 0 });
  });
});

// Reordering (phase 6 Plan C): the chip and the drop line read a store of their own, so a move of the
// pointer draws no title, row, body or toolbar. The rows read which column is dragged, which changes
// twice: they draw at the start of a drag and at its end, and not in between.
describe('a drag of the title of a column', () => {
  const POINTER = { pointerId: 1, isPrimary: true, pointerType: 'mouse', button: 0 };
  const LAYOUT: DataGridColumnLayout = {
    order: ['id', 'customer', 'qty'],
    widths: {},
    hidden: [],
    pinned: {},
  };
  const reset = () => {
    renders.cell = 0;
    renders.headerCell = 0;
    renders.toolbar = 0;
    renders.body = 0;
  };

  /** The boxes of a 100px column each, in a 400px frame, with a heading of 40px. */
  function stubBoxes() {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const cell = this.matches('th.flg-data-grid-head')
        ? Array.from((this.parentElement as HTMLTableRowElement).cells).indexOf(
            this as HTMLTableCellElement,
          )
        : -1;
      const left = cell * 100;
      const bottom = this.matches('.flg-data-grid-frame') ? 400 : 40;
      const right = cell >= 0 ? left + 100 : 400;
      return {
        left: Math.max(left, 0),
        top: 0,
        right,
        bottom,
        width: right - left,
        height: bottom,
      } as DOMRect;
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
  }

  function dragQty(props: Partial<React.ComponentProps<typeof DataGrid<Order>>>) {
    stubBoxes();
    render(
      <DataGrid
        data={ORDERS.slice(0, 5)}
        rowKey="id"
        columns={COLUMNS}
        caption="Orders"
        paging={false}
        {...props}
      />,
    );
    const qty = grid().tHead!.rows[0]!.cells[2]!;
    reset();
    fireEvent.pointerDown(qty, { ...POINTER, buttons: 1, clientX: 250, clientY: 10 });
    // The first move crosses the threshold: the drag starts, and the rows are told which column it is.
    fireEvent.pointerMove(document, { ...POINTER, buttons: 1, clientX: 140, clientY: 10 });
    const start = { ...renders };
    reset();
    for (const x of [130, 120, 110, 105, 70]) {
      fireEvent.pointerMove(document, { ...POINTER, buttons: 1, clientX: x, clientY: 10 });
      act(() => {
        for (const run of frames.splice(0)) run();
      });
    }
    // It did something: the line is at a boundary.
    expect(document.querySelector('.flg-data-grid-drop-line')).not.toBeNull();
    const moves = { ...renders };
    reset();
    fireEvent.pointerUp(document, { ...POINTER, buttons: 0, clientX: 70, clientY: 10 });
    return { start, moves, release: { ...renders } };
  }

  it('draws the rows at its start and at its end, and no title, row, body or toolbar for a move', () => {
    const onColumnLayoutChange = vi.fn();
    const { start, moves, release } = dragQty({ columnLayout: LAYOUT, onColumnLayoutChange });
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
    expect(moves).toEqual({ headerCell: 0, toolbar: 0, body: 0, cell: 0 });
    // Three columns, five rows: the start draws each title and cell once, and the end of a grid whose
    // parent holds its layout does the same.
    expect(start).toMatchObject({ headerCell: 3, cell: 15 });
    expect(release).toMatchObject({ headerCell: 3, cell: 15 });
  });

  it('draws no more for a grid that holds its own layout, whose state changes once at the release', () => {
    const { start, moves, release } = dragQty({ onColumnLayoutChange: () => {} });
    expect(moves).toEqual({ headerCell: 0, toolbar: 0, body: 0, cell: 0 });
    expect(start.cell).toBeLessThanOrEqual(15);
    expect(release.cell).toBeLessThanOrEqual(15);
    expect(release.toolbar).toBeLessThanOrEqual(1);
  });
});

describe('the menu of a column', () => {
  const reset = () => {
    renders.cell = 0;
    renders.headerCell = 0;
    renders.toolbar = 0;
    renders.body = 0;
  };
  beforeEach(() => {
    // jsdom has no Popover API.
    HTMLElement.prototype.showPopover = () => {};
    HTMLElement.prototype.hidePopover = () => {};
  });
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
    Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
  });

  const mount = () => {
    render(
      <DataGrid
        data={ORDERS.slice(0, 5)}
        rowKey="id"
        columns={COLUMNS}
        caption="Orders"
        paging={false}
      />,
    );
    return grid().querySelectorAll<HTMLElement>('.flg-data-grid-head-button');
  };

  it('draws no toolbar, title, row or body for the button, the right press, the keys and the close', () => {
    const buttons = mount();
    expect(buttons).toHaveLength(3);
    // The title that has the keyboard is the active one already, so the key moves nothing.
    act(() => grid().tHead!.rows[0]!.cells[1]!.focus());
    reset();
    // The press and the click on the button open it, and the toggle that the browser sends closes it.
    fireEvent.pointerDown(buttons[1]!, { pointerId: 1, buttons: 1 });
    fireEvent.pointerUp(buttons[1]!, { pointerId: 1, buttons: 0 });
    fireEvent.click(buttons[1]!, { detail: 1 });
    expect(buttons[1]!.getAttribute('aria-expanded')).toBe('true');
    const menu = document.querySelector('.flg-data-grid-column-menu')!;
    fireEvent(menu, Object.assign(new Event('toggle'), { newState: 'closed' }));
    expect(buttons[1]!.getAttribute('aria-expanded')).toBe('false');
    // A right press on a title, and the key.
    fireEvent.contextMenu(grid().tHead!.rows[0]!.cells[2]!, { clientX: 5, clientY: 5 });
    expect(buttons[2]!.getAttribute('aria-expanded')).toBe('true');
    fireEvent(menu, Object.assign(new Event('toggle'), { newState: 'closed' }));
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown', altKey: true });
    expect(buttons[1]!.getAttribute('aria-expanded')).toBe('true');
    expect(renders).toEqual({ headerCell: 0, toolbar: 0, body: 0, cell: 0 });
  });
});

describe('the column chooser and the toolbar', () => {
  const reset = () => {
    renders.cell = 0;
    renders.headerCell = 0;
    renders.toolbar = 0;
    renders.body = 0;
  };
  beforeEach(() => {
    // jsdom has no Popover API.
    HTMLElement.prototype.showPopover = () => {};
    HTMLElement.prototype.hidePopover = () => {};
  });
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
    Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
  });

  const grid5 = (extra: Partial<Parameters<typeof DataGrid<Order>>[0]> = {}) => (
    <DataGrid
      data={ORDERS.slice(0, 5)}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      columnChooser
      {...extra}
    />
  );

  it('draws no toolbar, title, row or body for opening the chooser and closing it', () => {
    render(grid5());
    reset();
    const trigger = document.querySelector<HTMLButtonElement>('.flg-data-grid-chooser-button')!;
    fireEvent.pointerDown(trigger, { pointerId: 1, buttons: 1 });
    fireEvent.pointerUp(trigger, { pointerId: 1, buttons: 0 });
    fireEvent.click(trigger, { detail: 1 });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelectorAll('.flg-data-grid-chooser input')).toHaveLength(3);
    const content = document.querySelector('.flg-data-grid-chooser')!;
    fireEvent(content, Object.assign(new Event('toggle'), { newState: 'closed' }));
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(renders).toEqual({ headerCell: 0, toolbar: 0, body: 0, cell: 0 });
  });

  it('draws no row and no title for a `toolbar` function written inline, which the grid calls again', () => {
    const items = vi.fn();
    const { rerender } = render(
      grid5({
        toolbar: (given) => {
          items(given);
          return given.columnChooser;
        },
      }),
    );
    reset();
    items.mockClear();
    rerender(
      grid5({
        toolbar: (given) => {
          items(given);
          return given.columnChooser;
        },
      }),
    );
    expect(items).toHaveBeenCalled();
    // The body draws with the grid; the rows and the titles, which are memoized, do not.
    expect(renders).toMatchObject({ headerCell: 0, cell: 0 });
  });
});

// The filter (phase 6 Plan D): the rows that stay are not drawn again when the filter changes, and a
// filter written in the JSX, a new object in every render, says what it said before.
describe('the filter', () => {
  const rows = ORDERS.slice(0, 12);
  // The first four rows: they keep their places in the list when the filter goes, so they are the
  // rows that stay (a row that moves to another place is a row of another place, and draws again).
  const SOME = { columns: { qty: { operator: '<' as const, value: 5 } } };
  const small = (props: Partial<React.ComponentProps<typeof DataGrid<Order>>> = {}) => (
    <DataGrid
      data={rows}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      {...props}
    />
  );
  const reset = () => {
    renders.cell = 0;
    renders.headerCell = 0;
    renders.toolbar = 0;
    renders.body = 0;
  };

  it('draws no title and no row that stays for a filter that keeps more rows, only the rows that come', () => {
    const onFilterChange = () => {};
    const { rerender } = render(small({ filter: SOME, onFilterChange }));
    expect(screen.getAllByRole('row')).toHaveLength(1 + 4);
    reset();
    rerender(small({ filter: {}, onFilterChange }));
    expect(screen.getAllByRole('row')).toHaveLength(1 + 12);
    // The 8 rows that come draw their 3 cells; the 4 that stay and the 3 titles do not.
    expect(renders.cell).toBe(8 * 3);
    expect(renders.headerCell).toBe(0);
  });

  it('draws no cell and no title for a filter that keeps fewer rows', () => {
    const onFilterChange = () => {};
    const { rerender } = render(small({ filter: {}, onFilterChange }));
    reset();
    rerender(small({ filter: SOME, onFilterChange }));
    expect(screen.getAllByRole('row')).toHaveLength(1 + 4);
    expect(renders.cell).toBe(0);
    expect(renders.headerCell).toBe(0);
  });

  it('draws no row again for a filter and a handler written inline that say what they said before', () => {
    const { rerender } = render(
      small({ filter: { ...SOME }, defaultFilter: { search: 'x' }, onFilterChange: () => {} }),
    );
    reset();
    rerender(
      small({ filter: { ...SOME }, defaultFilter: { search: 'x' }, onFilterChange: () => {} }),
    );
    expect(renders.cell).toBe(0);
    expect(renders.headerCell).toBe(0);
  });

  it('draws no title and no row that stays when the grid is cleared', () => {
    const ref = { current: null as import('./index').DataGridHandle | null };
    render(small({ defaultFilter: SOME, ref } as never));
    reset();
    act(() => ref.current!.clearFilter());
    expect(renders.cell).toBe(8 * 3);
    expect(renders.headerCell).toBe(0);
  });
});
