import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridColumnLayout, DataGridHandle } from './index';

// What a frame of a scroll draws (review of PR #42): the window of a virtual grid is the body's, so a
// scroll that changes it draws the body and the rows that come, and nothing above them. The parts are
// wrapped to count their renders; each wrapper calls the real part, so the grid is the same.

const renders = vi.hoisted(() => ({ headerCell: 0, toolbar: 0, body: 0, cell: 0 }));
// The parts of the filter row, counted apart: the tests of the rest compare `renders` as a whole.
const filterRenders = vi.hoisted(() => ({ filterCell: 0, operatorButton: 0, panelSwitch: 0 }));
// The group rows, counted apart for the same reason.
const groupRenders = vi.hoisted(() => ({ groupRow: 0 }));
// The footer of totals, counted apart too.
const footerRenders = vi.hoisted(() => ({ footer: 0 }));
// And the detail rows.
const detailRenders = vi.hoisted(() => ({ detailRow: 0 }));
// The editors of a row being edited: the field of a string column is an Input, drawn by its editor alone.
const editorRenders = vi.hoisted(() => ({ input: 0 }));

// Counting the Inputs tells which editors draw for a key typed.
vi.mock('../input/Input', async (importOriginal) => {
  const real = await importOriginal<typeof import('../input/Input')>();
  const { createElement, forwardRef } = await import('react');
  return {
    ...real,
    Input: forwardRef<HTMLInputElement, Parameters<typeof real.Input>[0]>((props, ref) => {
      editorRenders.input += 1;
      return createElement(real.Input, { ...props, ref });
    }),
  };
});

// The detail row is a memo component too: a memo of its own that counts.
vi.mock('./parts/DetailRow', async (importOriginal) => {
  const real = await importOriginal<typeof import('./parts/DetailRow')>();
  const { createElement, memo } = await import('react');
  return {
    ...real,
    DetailRow: memo((props: Parameters<typeof real.DetailRow>[0]) => {
      detailRenders.detailRow += 1;
      return createElement(real.DetailRow, props as never);
    }),
  };
});

// The footer is a memo component as well: a memo of its own that counts, drawing again exactly when the
// real one would.
vi.mock('./parts/SummaryFooter', async (importOriginal) => {
  const real = await importOriginal<typeof import('./parts/SummaryFooter')>();
  const { createElement, memo } = await import('react');
  return {
    ...real,
    SummaryFooter: memo((props: Parameters<typeof real.SummaryFooter>[0]) => {
      footerRenders.footer += 1;
      return createElement(real.SummaryFooter, props as never);
    }),
  };
});

// The group row is a memo component, which a wrapper cannot call: this one is a memo of its own that
// counts, so it draws again exactly when the real one would (the same props, the same comparison).
vi.mock('./parts/GroupRow', async (importOriginal) => {
  const real = await importOriginal<typeof import('./parts/GroupRow')>();
  const { createElement, memo } = await import('react');
  return {
    ...real,
    GroupRow: memo((props: Parameters<typeof real.GroupRow>[0]) => {
      groupRenders.groupRow += 1;
      return createElement(real.GroupRow, props as never);
    }),
  };
});

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
vi.mock('./parts/FilterCell', async (importOriginal) => {
  const real = await importOriginal<typeof import('./parts/FilterCell')>();
  return {
    ...real,
    FilterCell: (props: Parameters<typeof real.FilterCell>[0]) => {
      filterRenders.filterCell += 1;
      return real.FilterCell(props);
    },
  };
});
// One operator button is drawn by each text cell, in its own render: counting them tells which cells drew.
vi.mock('./parts/OperatorButton', async (importOriginal) => {
  const real = await importOriginal<typeof import('./parts/OperatorButton')>();
  return {
    ...real,
    OperatorButton: (props: Parameters<typeof real.OperatorButton>[0]) => {
      filterRenders.operatorButton += 1;
      return real.OperatorButton(props);
    },
  };
});
// The switch is drawn by the filter panel alone: counting it tells when the panel draws.
vi.mock('../switch/Switch', async (importOriginal) => {
  const real = await importOriginal<typeof import('../switch/Switch')>();
  const { createElement, forwardRef } = await import('react');
  return {
    ...real,
    Switch: forwardRef<HTMLInputElement, Parameters<typeof real.Switch>[0]>((props, ref) => {
      filterRenders.panelSwitch += 1;
      return createElement(real.Switch, { ...props, ref });
    }),
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
  vi.useRealTimers();
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

  it('draws no more rows for a grid with a search than without one', () => {
    const { start, moves, release } = dragQty({
      columnLayout: LAYOUT,
      onColumnLayoutChange: vi.fn(),
      defaultFilter: { search: 'DH' },
    });
    expect(moves).toEqual({ headerCell: 0, toolbar: 0, body: 0, cell: 0 });
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

// The search (phase 6 Plan D): the field keeps its own text, so a keystroke draws the field alone; the
// search itself is read by the cells through a context of its own, so a change of it draws the cells that
// are drawn (they mark it) and no title.
describe('the search', () => {
  const rows = ORDERS.slice(0, 12);
  const searching = (props: Partial<React.ComponentProps<typeof DataGrid<Order>>> = {}) => (
    <DataGrid
      data={rows}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      searchPanel
      {...props}
    />
  );
  const reset = () => {
    renders.cell = 0;
    renders.headerCell = 0;
    renders.toolbar = 0;
    renders.body = 0;
  };
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  const field = () => screen.getByRole('searchbox') as HTMLInputElement;

  it('draws no row, title, toolbar or body for the keystrokes before the delay, only the field', () => {
    render(searching());
    reset();
    for (const text of ['C', 'Cu', 'Cus']) fireEvent.change(field(), { target: { value: text } });
    expect(field()).toHaveValue('Cus');
    expect(renders).toEqual({ headerCell: 0, toolbar: 0, body: 0, cell: 0 });
  });

  it('draws the cells that are drawn and no title for a search that changes no row', () => {
    render(searching());
    reset();
    // Every order number holds "DH", so every row stays; the cells draw to mark what matches.
    fireEvent.change(field(), { target: { value: 'DH' } });
    act(() => void vi.advanceTimersByTime(300));
    expect(grid().querySelectorAll('mark').length).toBeGreaterThan(0);
    expect(renders.cell).toBe(12 * 3);
    expect(renders.headerCell).toBe(0);
  });

  it('draws no cell and no title for a search written in the JSX that says what it said before', () => {
    const { rerender } = render(
      searching({
        filter: { search: 'DH' },
        searchPanel: { placeholder: 'Find' },
        onFilterChange: () => {},
      }),
    );
    reset();
    rerender(
      searching({
        filter: { search: 'DH' },
        searchPanel: { placeholder: 'Find' },
        onFilterChange: () => {},
      }),
    );
    expect(renders.cell).toBe(0);
    expect(renders.headerCell).toBe(0);
  });
});

describe('the filter row', () => {
  const rows = ORDERS.slice(0, 12);
  const small = (props: Partial<React.ComponentProps<typeof DataGrid<Order>>> = {}) => (
    <DataGrid
      data={rows}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      filterRow
      {...props}
    />
  );
  const reset = () => {
    for (const key of Object.keys(renders) as (keyof typeof renders)[]) renders[key] = 0;
    filterRenders.filterCell = 0;
    filterRenders.operatorButton = 0;
  };
  const input = () => screen.getByRole('textbox', { name: 'Filter Customer' });

  it('draws only its own cell for a keystroke before the delay: no title, no row, no other cell', () => {
    vi.useFakeTimers();
    try {
      render(small());
      reset();
      fireEvent.change(input(), { target: { value: 'c' } });
      fireEvent.change(input(), { target: { value: 'cu' } });
      // One of the two text cells (Order and Customer) draws its operator button, once for each key.
      expect(filterRenders.operatorButton).toBe(2);
      expect(filterRenders.filterCell).toBe(0);
      expect(renders).toMatchObject({ headerCell: 0, cell: 0, body: 0, toolbar: 0 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('draws no title for a change of the condition, and no cell of the filter row but those that read it', () => {
    vi.useFakeTimers();
    try {
      render(small());
      reset();
      fireEvent.change(input(), { target: { value: 'Customer 1' } });
      act(() => void vi.advanceTimersByTime(400));
      expect(screen.getAllByRole('row').length).toBeLessThan(1 + 1 + 12);
      expect(renders.headerCell).toBe(0);
      expect(filterRenders.filterCell).toBe(0);
      // The two text cells read the filter, and draw their buttons; no other cell of the heading draws.
      expect(filterRenders.operatorButton).toBeGreaterThan(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('draws nothing of the grid again for labels with a record and a handler written inline', () => {
    const { rerender } = render(
      small({ labels: { operators: { contains: 'Chứa' } }, onFilterChange: () => {} }),
    );
    reset();
    rerender(small({ labels: { operators: { contains: 'Chứa' } }, onFilterChange: () => {} }));
    expect(renders).toMatchObject({ headerCell: 0, cell: 0 });
    expect(filterRenders.filterCell).toBe(0);
  });

  it('draws no title, no row and no cell of the filter row when the menu of operators opens', () => {
    // jsdom has no Popover API.
    HTMLElement.prototype.showPopover = () => {};
    HTMLElement.prototype.hidePopover = () => {};
    try {
      render(small());
      reset();
      fireEvent.click(screen.getAllByRole('button', { name: 'Operator: Contains' })[1]!, {
        detail: 1,
      });
      expect(renders.headerCell).toBe(0);
      expect(filterRenders.filterCell).toBe(0);
      expect(renders.cell).toBe(0);
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
      Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
    }
  });
  it('draws only the cell of a number for a keystroke before the delay', () => {
    vi.useFakeTimers();
    try {
      render(small());
      reset();
      const qty = screen.getByRole('textbox', { name: 'Filter Qty' });
      fireEvent.change(qty, { target: { value: '1' } });
      fireEvent.change(qty, { target: { value: '12' } });
      expect(filterRenders.operatorButton).toBe(2);
      expect(filterRenders.filterCell).toBe(0);
      expect(renders).toMatchObject({ headerCell: 0, cell: 0, body: 0, toolbar: 0 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('draws nothing of the grid when the popover of a range opens and is typed in, and keeps every row when it applies', () => {
    // jsdom has no Popover API.
    HTMLElement.prototype.showPopover = () => {};
    HTMLElement.prototype.hidePopover = () => {};
    try {
      render(small({ defaultFilter: { columns: { qty: { operator: 'between' } } } }));
      const field = screen.getByRole('combobox', { name: 'Filter Qty' });
      reset();
      fireEvent.click(field, { detail: 1 });
      const popover = document.querySelector<HTMLElement>('.flg-data-grid-filter-popover')!;
      const from = within(popover).getByRole('textbox', { name: 'From', hidden: true });
      fireEvent.change(from, { target: { value: '1' } });
      fireEvent.change(within(popover).getByRole('textbox', { name: 'To', hidden: true }), {
        target: { value: '200' },
      });
      // Opening it and typing in it draw nothing of the grid.
      expect(renders).toMatchObject({ headerCell: 0, cell: 0, body: 0, toolbar: 0 });
      expect(filterRenders.filterCell).toBe(0);
      // Every row is in that range, so applying it keeps them all, the same elements. The focus goes back to
      // the field, which makes its cell the active one: the titles and the cell that was active draw for that.
      const rowsBefore = Array.from(grid().tBodies[0]!.rows);
      fireEvent.click(within(popover).getByRole('button', { name: 'OK', hidden: true }));
      expect(field).toHaveValue('1 – 200');
      expect(Array.from(grid().tBodies[0]!.rows)).toEqual(rowsBefore);
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
      Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
    }
  });
});

describe('the header filter', () => {
  const rows = ORDERS.slice(0, 12);
  const small = (props: Partial<React.ComponentProps<typeof DataGrid<Order>>> = {}) => (
    <DataGrid
      data={rows}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      headerFilter
      {...props}
    />
  );
  const reset = () => {
    for (const key of Object.keys(renders) as (keyof typeof renders)[]) renders[key] = 0;
  };
  const press = (element: HTMLElement) => {
    fireEvent.pointerDown(element, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 });
    fireEvent.mouseDown(element);
    fireEvent.pointerUp(element, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 });
    fireEvent.click(element, { detail: 1 });
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

  // The first title is the active cell at first and has the focus, so pressing its funnel moves nothing but
  // the popover (the first focus into the grid is a render of its own, as in the menu's test).
  it('draws no title, row, body or toolbar for opening it, typing in it and checking a box', () => {
    render(small());
    act(() => grid().tHead!.rows[0]!.cells[0]!.focus());
    reset();
    press(screen.getByRole('button', { name: 'Filter Order' }));
    const popover = document.querySelector<HTMLElement>('.flg-data-grid-filter-popover')!;
    expect(within(popover).getAllByRole('checkbox', { hidden: true })).toHaveLength(13);
    fireEvent.change(within(popover).getByRole('searchbox', { hidden: true }), {
      target: { value: 'dh-1' },
    });
    fireEvent.click(within(popover).getByRole('checkbox', { name: 'DH-10', hidden: true }));
    expect(renders).toMatchObject({ headerCell: 0, cell: 0, body: 0, toolbar: 0 });
  });

  it('draws the body once for an OK that filters, and no row that stays', () => {
    render(small());
    act(() => grid().tHead!.rows[0]!.cells[0]!.focus());
    press(screen.getByRole('button', { name: 'Filter Order' }));
    const popover = document.querySelector<HTMLElement>('.flg-data-grid-filter-popover')!;
    fireEvent.click(within(popover).getByRole('checkbox', { name: 'DH-12', hidden: true }));
    const kept = Array.from(grid().tBodies[0]!.rows).slice(0, 11);
    reset();
    fireEvent.click(within(popover).getByRole('button', { name: 'OK', hidden: true }));
    expect(grid().tBodies[0]!.rows).toHaveLength(11);
    expect(Array.from(grid().tBodies[0]!.rows)).toEqual(kept);
    // The grid draws its body once, and the rows in their places, which are the same elements, not again;
    // the title the focus goes back to was the active one already, so no title draws either.
    expect(renders).toMatchObject({ headerCell: 0, cell: 0, body: 1 });
  });

  it('draws nothing of the grid again for labels and a filter written inline that say what they said', () => {
    const { rerender } = render(
      small({ labels: { operators: { contains: 'Chứa' } }, filter: { columns: {} } }),
    );
    reset();
    rerender(small({ labels: { operators: { contains: 'Chứa' } }, filter: { columns: {} } }));
    expect(renders).toMatchObject({ headerCell: 0, cell: 0 });
  });
});

// The filter panel (phase 6 Plan D): a part of its own that reads the filter through the filter view, so
// what it asks of the grid is a filter change like any other, and a record of words written in the JSX is
// the same labels.
describe('the filter panel', () => {
  const rows = ORDERS.slice(0, 12);
  const SOME = { columns: { qty: { operator: '<' as const, value: 5 } } };
  const small = (props: Partial<React.ComponentProps<typeof DataGrid<Order>>> = {}) => (
    <DataGrid
      data={rows}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      filterPanel
      {...props}
    />
  );
  const reset = () => {
    for (const key of Object.keys(renders) as (keyof typeof renders)[]) renders[key] = 0;
  };

  it('draws no title and no row that stays when the switch turns the conditions off, only the rows that come', () => {
    render(small({ defaultFilter: SOME }));
    expect(screen.getAllByRole('row')).toHaveLength(1 + 4);
    reset();
    fireEvent.click(screen.getByRole('switch', { name: 'Apply filter' }));
    expect(screen.getAllByRole('row')).toHaveLength(1 + 12);
    // The 8 rows that come draw their 3 cells; the 4 that stay and the 3 titles do not.
    expect(renders.cell).toBe(8 * 3);
    expect(renders.headerCell).toBe(0);
    reset();
    fireEvent.click(screen.getByRole('switch', { name: 'Apply filter' }));
    expect(screen.getAllByRole('row')).toHaveLength(1 + 4);
    expect(renders.cell).toBe(0);
    expect(renders.headerCell).toBe(0);
  });

  it('draws no title and no row that stays when Clear filter takes the panel away', () => {
    render(small({ defaultFilter: SOME }));
    reset();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filter' }));
    expect(document.querySelector('.flg-data-grid-filter-panel')).toBeNull();
    expect(renders.cell).toBe(8 * 3);
    expect(renders.headerCell).toBe(0);
  });

  it('is not drawn again for a search, which says nothing of the conditions, but is for a condition', () => {
    vi.useFakeTimers();
    render(small({ defaultFilter: SOME, searchPanel: true }));
    filterRenders.panelSwitch = 0;
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'customer 1' },
    });
    act(() => void vi.advanceTimersByTime(400));
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
    expect(filterRenders.panelSwitch).toBe(0);
    // The switch is a condition of the panel: it is drawn again, so the count means something.
    fireEvent.click(screen.getByRole('switch', { name: 'Apply filter' }));
    expect(filterRenders.panelSwitch).toBeGreaterThan(0);
  });

  it('draws no row again for labels with a record and a filter written inline that say what they said', () => {
    const { rerender } = render(
      small({
        labels: { panelOperators: { '<': 'below' } },
        filter: { ...SOME },
        onFilterChange: () => {},
      }),
    );
    reset();
    rerender(
      small({
        labels: { panelOperators: { '<': 'below' } },
        filter: { ...SOME },
        onFilterChange: () => {},
      }),
    );
    expect(renders).toMatchObject({ headerCell: 0, cell: 0 });
    expect(document.querySelector('.flg-data-grid-filter-text')!.textContent).toBe('Qty below 5');
  });
});

// Grouping (phase 6 Plan E): a toggle of a group draws that group's row and the rows that come or go,
// never a title; a grouping, the open groups and a filter written inline draw no row; a choice draws no
// group row (a group row has no box and reads no choice).
describe('the groups', () => {
  interface Task extends Order {
    team: string;
  }
  const TASKS: Task[] = ORDERS.slice(0, 12).map((order, index) => ({
    ...order,
    team: ['A', 'B', 'C'][index % 3]!,
  }));
  const TASK_COLUMNS: DataGridColumn<Task>[] = [
    ...(COLUMNS as DataGridColumn<Task>[]),
    { field: 'team', caption: 'Team', width: 80 },
  ];
  const BY_TEAM = [{ field: 'team', direction: 'asc' as const }];
  const teamKey = (team: string) => JSON.stringify([['team', team]]);
  const grouped = (props: Partial<React.ComponentProps<typeof DataGrid<Task>>> = {}) => (
    <DataGrid
      data={TASKS}
      rowKey="id"
      columns={TASK_COLUMNS}
      caption="Tasks"
      paging={false}
      grouping={BY_TEAM}
      {...props}
    />
  );
  const reset = () => {
    renders.cell = 0;
    renders.headerCell = 0;
    renders.toolbar = 0;
    renders.body = 0;
    groupRenders.groupRow = 0;
  };
  const header = (team: string) =>
    Array.from(document.querySelectorAll('tr.flg-data-grid-group-row')).find((row) =>
      row.textContent?.includes(`Team: ${team}`),
    )!;

  it('draws the group row that is toggled and the rows that come, and no title and no other row', () => {
    render(grouped());
    expect(document.querySelectorAll('tr.flg-data-grid-group-row')).toHaveLength(3);
    reset();
    fireEvent.click(header('B'));
    // The four rows of the group go: nothing is drawn for them, and the group row says it is closed.
    expect(groupRenders.groupRow).toBe(1);
    expect(renders.cell).toBe(0);
    expect(renders.headerCell).toBe(0);
    reset();
    fireEvent.click(header('B'));
    // The four that come draw their 3 cells (Team is grouped, so it is no column of the rows).
    expect(groupRenders.groupRow).toBe(1);
    expect(renders.cell).toBe(4 * 3);
    expect(renders.headerCell).toBe(0);
  });

  it('draws no row for a grouping, open groups and a filter written inline that say what they said', () => {
    const props = () => ({
      grouping: [...BY_TEAM],
      expandedGroups: { allExpanded: true, except: [teamKey('Z')] },
      filter: { search: '' },
      onFilterChange: () => {},
      onExpandedGroupsChange: () => {},
    });
    const { rerender } = render(grouped(props()));
    reset();
    rerender(grouped(props()));
    expect(renders).toMatchObject({ headerCell: 0, cell: 0 });
    expect(groupRenders.groupRow).toBe(0);
  });

  it('draws no group row for a choice: only the row that is chosen', () => {
    render(grouped({ selectionMode: 'multiple' }));
    reset();
    fireEvent.click(screen.getAllByRole('checkbox', { name: /^Select DH-/ })[0]!);
    expect(groupRenders.groupRow).toBe(0);
    expect(renders.headerCell).toBe(0);
  });
});

describe('the totals', () => {
  const FEW = ORDERS.slice(0, 12);
  const FOOTER = { total: [{ column: 'qty', type: 'sum' as const }] };
  const GROUPED = { ...FOOTER, group: [{ column: 'qty', type: 'sum' as const }] };
  const BY_NAME = [{ field: 'customer', direction: 'asc' as const }];
  const reset = () => {
    renders.cell = 0;
    renders.headerCell = 0;
    renders.toolbar = 0;
    renders.body = 0;
    groupRenders.groupRow = 0;
    footerRenders.footer = 0;
  };
  const totals = (props: Partial<React.ComponentProps<typeof DataGrid<Order>>> = {}) => (
    <DataGrid
      data={FEW}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      summary={FOOTER}
      paging={{ pageSize: 5 }}
      {...props}
    />
  );

  it('draws no footer and no group row for a change of page: the totals are those of every page', () => {
    render(totals());
    expect(footerRenders.footer).toBeGreaterThan(0);
    reset();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(footerRenders.footer).toBe(0);
    expect(groupRenders.groupRow).toBe(0);
    expect(renders.headerCell).toBe(0);
  });

  it('draws the footer once for a filter that changes what it adds up, and no title', () => {
    const { rerender } = render(totals());
    reset();
    rerender(totals({ filter: { columns: { qty: { operator: '>', value: 6 } } } }));
    expect(footerRenders.footer).toBe(1);
    expect(renders.headerCell).toBe(0);
  });

  it('draws nothing again for a summary written inline that says what it said before', () => {
    const { rerender } = render(
      totals({ grouping: BY_NAME, summary: { ...GROUPED, group: [...GROUPED.group] } }),
    );
    reset();
    rerender(
      totals({
        grouping: [...BY_NAME],
        summary: { total: [{ ...FOOTER.total[0]! }], group: [{ ...GROUPED.group[0]! }] },
      }),
    );
    expect(footerRenders.footer).toBe(0);
    expect(groupRenders.groupRow).toBe(0);
    expect(renders).toMatchObject({ headerCell: 0, cell: 0 });
  });

  it('draws no footer for a choice: only the row that is chosen', () => {
    render(totals({ selectionMode: 'multiple' }));
    reset();
    fireEvent.click(screen.getAllByRole('checkbox', { name: /^Select DH-/ })[0]!);
    expect(footerRenders.footer).toBe(0);
    expect(renders.headerCell).toBe(0);
  });

  it('draws the group row that is toggled, with its totals, and not the footer', () => {
    render(totals({ grouping: BY_NAME, summary: GROUPED, paging: false }));
    const first = document.querySelector('tr.flg-data-grid-group-row')!;
    reset();
    fireEvent.click(first);
    expect(groupRenders.groupRow).toBe(1);
    expect(footerRenders.footer).toBe(0);
  });
});

describe('the group panel', () => {
  interface Task extends Order {
    team: string;
  }
  const TASKS: Task[] = ORDERS.slice(0, 6).map((order, index) => ({
    ...order,
    team: ['A', 'B', 'C'][index % 3]!,
  }));
  const TASK_COLUMNS: DataGridColumn<Task>[] = [
    ...(COLUMNS as DataGridColumn<Task>[]),
    { field: 'team', caption: 'Team', width: 80 },
  ];
  const POINTER = { pointerId: 1, isPrimary: true, pointerType: 'mouse', button: 0 };
  const reset = () => {
    renders.cell = 0;
    renders.headerCell = 0;
    renders.toolbar = 0;
    renders.body = 0;
    groupRenders.groupRow = 0;
  };
  const runFrames = () =>
    act(() => {
      for (const run of frames.splice(0)) run();
    });

  /** The tray is above the heading (y -44 to -10); each title is 100px wide, the heading 40px tall. */
  function stubBoxes() {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const cell = this.matches('th.flg-data-grid-head')
        ? Array.from((this.parentElement as HTMLTableRowElement).cells).indexOf(
            this as HTMLTableCellElement,
          )
        : -1;
      if (this.matches('.flg-data-grid-group-panel')) {
        return { left: 0, top: -44, right: 400, bottom: -10, width: 400, height: 34 } as DOMRect;
      }
      const left = Math.max(cell * 100, 0);
      const bottom = this.matches('.flg-data-grid-frame') ? 400 : 40;
      const right = cell >= 0 ? left + 100 : 400;
      return { left, top: 0, right, bottom, width: right - left, height: bottom } as DOMRect;
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
  }

  function dragTeam(props: Partial<React.ComponentProps<typeof DataGrid<Task>>>) {
    stubBoxes();
    render(
      <DataGrid
        data={TASKS}
        rowKey="id"
        columns={TASK_COLUMNS}
        caption="Tasks"
        paging={false}
        groupPanel
        {...props}
      />,
    );
    const team = grid().tHead!.rows[0]!.cells[3]!;
    reset();
    fireEvent.pointerDown(team, { ...POINTER, buttons: 1, clientX: 350, clientY: 10 });
    // The first move crosses the threshold: the drag starts, and the rows are told which column it is.
    fireEvent.pointerMove(document, { ...POINTER, buttons: 1, clientX: 300, clientY: -27 });
    const start = { ...renders };
    reset();
    for (const x of [290, 250, 200, 120, 60]) {
      fireEvent.pointerMove(document, { ...POINTER, buttons: 1, clientX: x, clientY: -27 });
      runFrames();
    }
    // It did something: the tray is marked.
    expect(document.querySelector('.flg-data-grid-group-panel[data-drop-target]')).not.toBeNull();
    const moves = { ...renders, groupRow: groupRenders.groupRow };
    reset();
    fireEvent.pointerUp(document, { ...POINTER, buttons: 0, clientX: 60, clientY: -27 });
    return { start, moves, release: { ...renders, groupRow: groupRenders.groupRow } };
  }

  it('draws no row, title, body or toolbar for a move of a title over the tray', () => {
    const { moves } = dragTeam({});
    expect(moves).toEqual({ headerCell: 0, toolbar: 0, body: 0, cell: 0, groupRow: 0 });
  });

  it('draws the rows once at the start of the drag and once at the drop, and the toolbar at most once', () => {
    const onGroupingChange = vi.fn();
    const { start, release } = dragTeam({ onGroupingChange });
    expect(onGroupingChange).toHaveBeenCalledTimes(1);
    // The start tells the rows which column is dragged, as the drag of a title in the heading does, and
    // the drop draws the groups that come, the three of them once.
    expect(start.toolbar).toBeLessThanOrEqual(1);
    expect(start.body).toBeLessThanOrEqual(1);
    expect(release.toolbar).toBeLessThanOrEqual(1);
    expect(release.groupRow).toBe(3);
  });

  it('draws no row and no title for the buttons of a chip that turns a direction', () => {
    render(
      <DataGrid
        data={TASKS}
        rowKey="id"
        columns={TASK_COLUMNS}
        caption="Tasks"
        paging={false}
        groupPanel
        grouping={[{ field: 'team', direction: 'asc' }]}
      />,
    );
    reset();
    fireEvent.click(screen.getByRole('button', { name: 'Sort Team groups descending' }));
    // The parent holds the grouping, so nothing changed: no row is drawn.
    expect(renders).toMatchObject({ headerCell: 0, cell: 0 });
  });
});

describe('the details', () => {
  const FEW = ORDERS.slice(0, 12);
  const reset = () => {
    renders.cell = 0;
    renders.headerCell = 0;
    renders.toolbar = 0;
    renders.body = 0;
    detailRenders.detailRow = 0;
  };
  const showDetail = (row: Order) => <span>{row.id}</span>;
  const details = (props: Partial<React.ComponentProps<typeof DataGrid<Order>>> = {}) => (
    <DataGrid
      data={FEW}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      renderDetail={showDetail}
      {...props}
    />
  );
  const open = (key: string) =>
    fireEvent.click(screen.getByRole('button', { name: `Show details of ${key}` }));
  const close = (key: string) =>
    fireEvent.click(screen.getByRole('button', { name: `Hide details of ${key}` }));

  it('draws the master row and the detail row that comes, and no title and no other row, for an opening', () => {
    render(details());
    reset();
    open('DH-3');
    // The master's four cells (the button's, Order, Customer and Qty) and the one detail row.
    expect(renders.cell).toBe(4);
    expect(detailRenders.detailRow).toBe(1);
    expect(renders.headerCell).toBe(0);
  });

  it('draws the master row for a closing, and no detail row', () => {
    render(details({ defaultExpandedRows: ['DH-3', 'DH-5'] }));
    reset();
    close('DH-3');
    expect(renders.cell).toBe(4);
    expect(detailRenders.detailRow).toBe(0);
    expect(renders.headerCell).toBe(0);
  });

  it('draws no detail row that stays when another detail opens', () => {
    render(details({ defaultExpandedRows: ['DH-3'] }));
    reset();
    open('DH-5');
    expect(detailRenders.detailRow).toBe(1);
    expect(renders.cell).toBe(4);
  });

  it('draws nothing again for expandedRows and a handler written inline that say what they said', () => {
    const props = () => ({ expandedRows: ['DH-2', 'DH-4'], onExpandedRowsChange: () => {} });
    const { rerender } = render(details(props()));
    reset();
    rerender(details(props()));
    expect(renders).toMatchObject({ headerCell: 0, cell: 0 });
    expect(detailRenders.detailRow).toBe(0);
  });

  it('draws no row for a choice but the one that is chosen, and no detail row', () => {
    render(details({ selectionMode: 'multiple', defaultExpandedRows: ['DH-2'] }));
    reset();
    fireEvent.click(screen.getAllByRole('checkbox', { name: /^Select DH-/ })[0]!);
    expect(detailRenders.detailRow).toBe(0);
    expect(renders.headerCell).toBe(0);
  });

  it('draws every row again for a renderDetail that is new, which is why it warns after three', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = render(details({ renderDetail: (row) => <span>{row.id}</span> }));
    reset();
    rerender(details({ renderDetail: (row) => <span>{row.id}</span> }));
    expect(renders.cell).toBe(12 * 4);
    for (let i = 0; i < 3; i++) {
      rerender(details({ renderDetail: (row) => <span>{row.id}</span> }));
    }
    expect(
      warn.mock.calls.filter(([message]) => String(message).includes('renderDetail')),
    ).toHaveLength(1);
  });
});

describe('the row handles', () => {
  const FEW = ORDERS.slice(0, 12);
  const reset = () => {
    renders.cell = 0;
    renders.headerCell = 0;
    renders.toolbar = 0;
    renders.body = 0;
  };
  const reorder = (props: Partial<React.ComponentProps<typeof DataGrid<Order>>> = {}) => (
    <DataGrid
      data={FEW}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      rowReorder
      onRowReorder={() => {}}
      {...props}
    />
  );
  const POINTER = { pointerId: 1, isPrimary: true, pointerType: 'mouse', button: 0 };
  const runFrames = () => act(() => frames.splice(0).forEach((frame) => frame()));
  const handle = (key: string) => screen.getByRole('button', { name: `Reorder ${key}` });

  it('draws the source row at the start of a drag and at its end, and no title and no other row', () => {
    render(reorder());
    reset();
    fireEvent.pointerDown(handle('DH-3'), { ...POINTER, buttons: 1, clientX: 10, clientY: 100 });
    fireEvent.pointerMove(document, { ...POINTER, buttons: 1, clientX: 10, clientY: 140 });
    runFrames();
    // The handle, Order, Customer and Qty of one row, and the body that passes the flag.
    expect(renders.cell).toBe(4);
    expect(renders.headerCell).toBe(0);
    expect(renders.toolbar).toBe(0);
    expect(grid().querySelectorAll('tr[data-drag-source]')).toHaveLength(1);
    reset();
    // A move of the pointer draws the chip and the line, and not a row.
    for (const y of [150, 160, 170, 180]) {
      fireEvent.pointerMove(document, { ...POINTER, buttons: 1, clientX: 10, clientY: y });
      runFrames();
    }
    expect(renders.cell).toBe(0);
    expect(renders.body).toBe(0);
    expect(renders.headerCell).toBe(0);
    fireEvent.pointerUp(document, { ...POINTER, buttons: 0, clientX: 10, clientY: 180 });
    expect(renders.cell).toBe(4);
    expect(renders.headerCell).toBe(0);
    expect(grid().querySelectorAll('tr[data-drag-source]')).toHaveLength(0);
  });

  it('draws no row when the menu opens or closes, and only the handle of the row it is about', () => {
    // jsdom has no Popover API: the menu shows and hides by these stand-ins.
    HTMLElement.prototype.showPopover = () => {};
    HTMLElement.prototype.hidePopover = () => {};
    try {
      render(reorder());
      reset();
      fireEvent.click(handle('DH-4'));
      expect(handle('DH-4')).toHaveAttribute('aria-expanded', 'true');
      expect(renders.cell).toBe(0);
      expect(renders.headerCell).toBe(0);
      expect(renders.body).toBe(0);
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
      Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
    }
  });

  it('draws nothing again for a `rowReorder` and a handler written inline that say what they said', () => {
    const { rerender } = render(reorder({ onRowReorder: () => {} }));
    reset();
    rerender(reorder({ onRowReorder: () => {} }));
    expect(renders).toMatchObject({ headerCell: 0, cell: 0 });
  });
});

// Editing (phase 6 Plan F): what a key typed in an editor, the start and the end of an edit and an `editing`
// written in the JSX draw. The draft is in a store that each editor reads its own field of, and the row being
// edited is a prop of its row.
describe('editing a row', () => {
  const COLUMNS_OF_TEXT: DataGridColumn<Order>[] = [
    { field: 'id', caption: 'Order', rowHeader: true, width: 104, allowEditing: false },
    { field: 'customer', caption: 'Customer', width: 200 },
    { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
  ];
  const editable = (props: Partial<React.ComponentProps<typeof DataGrid<Order>>> = {}) => (
    <DataGrid
      data={ORDERS.slice(0, 5)}
      rowKey="id"
      columns={COLUMNS_OF_TEXT}
      caption="Orders"
      paging={false}
      editing={{ mode: 'row' }}
      onSaving={() => {}}
      {...props}
    />
  );
  const reset = () => {
    renders.cell = 0;
    renders.headerCell = 0;
    renders.toolbar = 0;
    renders.body = 0;
    editorRenders.input = 0;
  };
  const edit = (name: string) => screen.getByRole('button', { name: `Edit ${name}` });

  it('draws the row that starts being edited and no other, and the row that ends, and no other', () => {
    render(editable());
    // The active place is on the cell the edit starts from, so the keyboard moves nothing.
    const row = grid().querySelectorAll('tbody > tr')[1]!;
    const customer = row.children[1] as HTMLElement;
    act(() => customer.focus());
    reset();
    act(() => void fireEvent.keyDown(customer, { key: 'Enter' }));
    // The row has the cells of its three columns and the buttons, and is drawn twice: the start, and the editor that took
    // the focus clears the ask (`taken`). No other row is drawn for either: every cell counted is this row's.
    expect(row).toHaveAttribute('data-editing');
    expect(renders.cell).toBe(2 * 4);
    expect(renders.headerCell).toBe(0);
    reset();
    act(() => void fireEvent.keyDown(screen.getByLabelText('Customer'), { key: 'Escape' }));
    expect(row).not.toHaveAttribute('data-editing');
    expect(renders.cell).toBe(4);
    expect(renders.headerCell).toBe(0);
  });

  it('draws the row of a cell that starts being edited in cell mode and no other, and the row that ends', () => {
    render(editable({ editing: { mode: 'cell' } }));
    const row = grid().querySelectorAll('tbody > tr')[1]!;
    const customer = row.children[1] as HTMLElement;
    act(() => customer.focus());
    reset();
    act(() => void fireEvent.click(customer));
    // The row has the cells of its three columns, and no column of buttons; it is drawn twice (the start, and `taken`), and
    // no other row is.
    expect(customer).toHaveAttribute('data-editing');
    expect(renders.cell).toBe(2 * 3);
    expect(renders.headerCell).toBe(0);
    expect(renders.body).toBeLessThanOrEqual(2);
    reset();
    act(() => void fireEvent.keyDown(screen.getByLabelText('Customer'), { key: 'Escape' }));
    expect(customer).not.toHaveAttribute('data-editing');
    expect(renders.cell).toBe(3);
    expect(renders.headerCell).toBe(0);
  });

  it('draws the row of a commit, a mark for deletion and an Undo in batch mode, and no other row', () => {
    render(editable({ editing: { mode: 'batch', allowDeleting: true } }));
    const rows = grid().querySelectorAll('tbody > tr');
    const customer = rows[1]!.children[1] as HTMLElement;
    act(() => customer.focus());
    act(() => void fireEvent.click(customer));
    reset();
    act(() => {
      fireEvent.change(screen.getByLabelText('Customer'), { target: { value: 'Hoa' } });
      fireEvent.keyDown(screen.getByLabelText('Customer'), { key: 'Enter' });
    });
    // The commit made the change, the mark and the bar: the cells of that row (its three and the buttons), the
    // body, and the bar, which is no cell; no title and no other row.
    expect(customer).toHaveAttribute('data-changed');
    expect(document.querySelector('.flg-data-grid-savebar')).not.toBeNull();
    expect(renders.cell).toBe(4);
    expect(renders.headerCell).toBe(0);
    // The toolbar is drawn with the root, once, as the root is for any state of the grid.
    expect(renders.toolbar).toBeLessThanOrEqual(1);
    // A mark and its Undo draw their row only (the place of the keyboard is there already, so it leaves no other
    // row). The focus goes to the cell of the buttons, which the heading follows: no assertion about it here.
    reset();
    act(() => screen.getByRole('button', { name: 'Delete DH-2' }).click());
    expect(rows[1]).toHaveAttribute('data-deleted');
    expect(renders.cell).toBe(4);
    reset();
    act(() => screen.getByRole('button', { name: 'Undo deleting DH-2' }).click());
    expect(rows[1]).not.toHaveAttribute('data-deleted');
    expect(renders.cell).toBe(4);
  });

  it('draws no row of a refused cell again for an unrelated change: its marks are cached as the others are', async () => {
    /** The cells drawn by committing DH-4 after DH-2's save was answered with `answer`. */
    const drawn = async (answer: unknown): Promise<number> => {
      const ref = createRef<DataGridHandle>();
      const view = render(
        editable({
          ref,
          editing: { mode: 'batch' },
          onSaving: () => (answer === undefined ? Promise.resolve() : Promise.reject(answer)),
        } as never),
      );
      const rows = grid().querySelectorAll('tbody > tr');
      const cellOfRow = (row: number) => rows[row]!.children[1] as HTMLElement;
      const commit = (row: number, value: string) => {
        act(() => void fireEvent.click(cellOfRow(row)));
        act(() => {
          fireEvent.change(screen.getByLabelText('Customer'), { target: { value } });
          fireEvent.keyDown(screen.getByLabelText('Customer'), { key: 'Enter' });
        });
      };
      act(() => cellOfRow(1).focus());
      commit(1, 'Hoa');
      await act(async () => void (await ref.current!.saveChanges()));
      act(() => cellOfRow(3).focus());
      reset();
      commit(3, 'Lan');
      expect(cellOfRow(3)).toHaveAttribute('data-changed');
      const count = renders.cell;
      view.unmount();
      return count;
    };
    const refused = {
      message: 'Not saved.',
      fieldErrors: [{ key: 'DH-2', field: 'customer', message: 'Customer is taken' }],
    };
    const clean = await drawn(undefined);
    // The refused row has a fault and the row of the commit has none: only the row of the commit draws, as in a
    // grid that has no fault at all.
    expect(await drawn(refused)).toBe(clean);
  });

  it('draws the editor of the field and no cell, row, title or other editor for a key typed in it', () => {
    render(editable());
    act(() => edit('DH-2').click());
    reset();
    const field = screen.getByLabelText('Customer') as HTMLInputElement;
    act(() => void fireEvent.change(field, { target: { value: 'Hoa' } }));
    expect(field.value).toBe('Hoa');
    // One Input drew, which is the one of the customer; the number is a NumberInput that was not asked.
    expect(editorRenders.input).toBeGreaterThan(0);
    expect(editorRenders.input).toBeLessThanOrEqual(2);
    expect(renders.cell).toBe(0);
    expect(renders.headerCell).toBe(0);
    expect(renders.body).toBe(0);
    expect(renders.toolbar).toBe(0);
  });

  it('draws nothing for an editing written in the JSX that says what it said, and for a handler', () => {
    const { rerender } = render(editable({ editing: { mode: 'row' }, onSaving: () => {} }));
    reset();
    rerender(editable({ editing: { mode: 'row' }, onSaving: () => {} }));
    expect(renders.cell).toBe(0);
    expect(renders.headerCell).toBe(0);
    act(() => edit('DH-2').click());
    reset();
    rerender(editable({ editing: { mode: 'row' }, onSaving: () => {} }));
    expect(renders.cell).toBe(0);
  });

  it('draws the rows when the mode of editing is another allowUpdating function, which is another row rule', () => {
    const { rerender } = render(editable({ editing: { mode: 'row', allowUpdating: () => true } }));
    reset();
    rerender(editable({ editing: { mode: 'row', allowUpdating: () => true } }));
    // A function is compared by identity: a new one is a new rule.
    expect(renders.cell).toBeGreaterThan(0);
  });
});
