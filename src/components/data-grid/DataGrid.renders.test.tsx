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
