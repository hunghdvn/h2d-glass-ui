import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode, createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import { LOADING_ANNOUNCE_DELAY } from './hooks/use-loading-announce';
import { skeletonWidth } from './parts/SkeletonRows';
import type { DataGridColumn, DataGridHandle, DataGridProps } from './index';

beforeEach(() => {
  resetDevWarnings();
  vi.restoreAllMocks();
});
afterEach(() => {
  vi.unstubAllGlobals();
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
  { field: 'total', caption: 'Total', dataType: 'number', width: 160 },
];

function Orders(props: Partial<DataGridProps<Order>>) {
  return <DataGrid data={ORDERS} rowKey="id" columns={COLUMNS} caption="Orders" {...props} />;
}

const grid = () => screen.getByRole('grid') as HTMLTableElement;
const root = () => grid().closest('.flg-data-grid') as HTMLElement;
const main = () => root().querySelector('.flg-data-grid-main') as HTMLElement;
const frame = () => grid().parentElement as HTMLElement;
const skeletonRows = () =>
  Array.from(grid().querySelectorAll<HTMLElement>('tbody > tr.flg-data-grid-skeleton-row'));
const dataRows = () =>
  Array.from(grid().querySelectorAll<HTMLElement>('tbody > tr.flg-data-grid-row'));
const overlay = () => root().querySelector<HTMLElement>('.flg-data-grid-overlay');
const emptyRows = () => Array.from(grid().querySelectorAll('tbody > tr.flg-data-grid-empty'));
const said = () => (root().lastElementChild as HTMLElement).textContent;

describe('the first load: no rows and loading', () => {
  it.each([
    [undefined, 20],
    [{ pageSize: 12 }, 12],
    [{ pageSize: 50, pageSizes: [50] }, 20],
    [{ pageSize: 4 }, 4],
    [false, 20],
  ] as const)(
    'draws as many skeleton rows as a page holds, and no more than 20: %j gives %i',
    (paging, count) => {
      render(<Orders data={[]} loading paging={paging} />);
      expect(skeletonRows()).toHaveLength(count);
    },
  );

  it('follows the size of the page that is asked for, and is 20 when the grid has no pages', () => {
    const { unmount } = render(<Orders data={[]} loading defaultPage={{ index: 0, size: 7 }} />);
    expect(skeletonRows()).toHaveLength(7);
    unmount();
    render(<Orders data={[]} loading paging={false} defaultPage={{ index: 0, size: 7 }} />);
    expect(skeletonRows()).toHaveLength(20);
  });

  it('draws a cell for each column, and in each a text skeleton whose width is fixed by its column', () => {
    render(<Orders data={[]} loading paging={{ pageSize: 3 }} />);
    const rows = skeletonRows();
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.children).toHaveLength(COLUMNS.length);
      const blocks = Array.from(row.querySelectorAll<HTMLElement>('.flg-skeleton'));
      expect(blocks).toHaveLength(COLUMNS.length);
      expect(blocks.map((block) => block.style.width)).toEqual(['40%', '57%', '74%', '50%']);
      for (const block of blocks) {
        expect(block).toHaveAttribute('data-shape', 'text');
        expect(block).toHaveAttribute('data-variant', 'pulse');
      }
    }
  });

  it('keeps the width of a column the same when the column of boxes is added in front of it', () => {
    render(<Orders data={[]} loading selectionMode="multiple" paging={{ pageSize: 2 }} />);
    const row = skeletonRows()[0] as HTMLElement;
    // The column of boxes has nothing in it; the others count from the first column of the caller's.
    expect(row.children).toHaveLength(COLUMNS.length + 1);
    expect(row.children[0]?.querySelector('.flg-skeleton')).toBeNull();
    const widths = Array.from(row.querySelectorAll<HTMLElement>('.flg-skeleton')).map(
      (block) => block.style.width,
    );
    expect(widths).toEqual(['40%', '57%', '74%', '50%']);
  });

  it('is always between 40% and 80%, and only a function of the index of the column', () => {
    for (let index = 0; index < 200; index++) {
      const width = skeletonWidth(index);
      expect(width).toBeGreaterThanOrEqual(40);
      expect(width).toBeLessThanOrEqual(80);
      expect(Number.isInteger(width)).toBe(true);
    }
    expect(skeletonWidth(0)).toBe(40);
    expect(skeletonWidth(3)).toBe(50);
  });

  it('is the same on every render and on the server: nothing random', () => {
    const random = vi.spyOn(Math, 'random');
    const first = render(<Orders data={[]} loading paging={{ pageSize: 5 }} />);
    const body = () => grid().querySelector('tbody')?.innerHTML;
    const before = body();
    first.rerender(<Orders data={[]} loading paging={{ pageSize: 5 }} />);
    expect(body()).toBe(before);
    first.unmount();
    render(<Orders data={[]} loading paging={{ pageSize: 5 }} />);
    expect(body()).toBe(before);
    // The server writes the same rows each time, with the widths the client draws (the two spell a
    // `style` differently, so the widths are read out of it).
    const html = () => renderToString(<Orders data={[]} loading paging={{ pageSize: 5 }} />);
    const server = html();
    expect(html()).toBe(server);
    const widths = (markup: string) => Array.from(markup.matchAll(/width: ?(\d+)%/g), (m) => m[1]);
    expect(widths(server)).toHaveLength(5 * COLUMNS.length);
    expect(widths(server)).toEqual(widths(before ?? ''));
    expect(random).not.toHaveBeenCalled();
  });

  it('hides the rows from what reads the page, and they are not rows of data', () => {
    render(<Orders data={[]} loading selectionMode="multiple" />);
    const rows = skeletonRows();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row).toHaveAttribute('aria-hidden', 'true');
      expect(row).not.toHaveAttribute('aria-selected');
      expect(row).not.toHaveAttribute('aria-rowindex');
    }
    expect(dataRows()).toHaveLength(0);
    // Nothing in them can be reached by the keyboard, and the grid's one stop is the heading.
    expect(grid().querySelectorAll('tbody [tabindex], tbody input, tbody button')).toHaveLength(0);
    const stops = grid().querySelectorAll('[tabindex="0"]');
    expect(stops).toHaveLength(1);
    expect(stops[0]?.closest('thead')).not.toBeNull();
  });

  it('has no pager and no empty row while it waits', () => {
    render(<Orders data={[]} loading />);
    expect(root().querySelector('.flg-data-grid-pager')).toBeNull();
    expect(emptyRows()).toHaveLength(0);
    expect(overlay()).toBeNull();
  });

  it('gives way to the rows when they arrive, and comes back when the rows go, on a mounted grid', () => {
    const { rerender } = render(<Orders data={[]} loading />);
    expect(skeletonRows().length).toBeGreaterThan(0);
    rerender(<Orders data={ORDERS} />);
    expect(skeletonRows()).toHaveLength(0);
    expect(dataRows()).toHaveLength(3);
    rerender(<Orders data={[]} loading />);
    expect(dataRows()).toHaveLength(0);
    expect(skeletonRows().length).toBeGreaterThan(0);
  });

  it('draws a stripe on the skeleton rows of a striped grid as on its rows, by the odd child', () => {
    render(<Orders data={[]} loading variant="striped" paging={{ pageSize: 3 }} />);
    // They are rows of Table's own classes, so Table's stripe is on the odd children.
    for (const row of skeletonRows()) expect(row).toHaveClass('flg-table-row');
  });
});

describe('loading with rows: the overlay', () => {
  it('has no overlay while the grid is not loading, and one over the rows when it is', () => {
    const { rerender } = render(<Orders />);
    expect(overlay()).toBeNull();
    rerender(<Orders loading />);
    const layer = overlay() as HTMLElement;
    expect(layer).not.toBeNull();
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    // The old rows stay; there are no skeleton rows.
    expect(dataRows()).toHaveLength(3);
    expect(skeletonRows()).toHaveLength(0);
    rerender(<Orders />);
    expect(overlay()).toBeNull();
  });

  it('sits in the main part, after the frame, so it does not scroll with the rows', () => {
    render(<Orders loading />);
    const layer = overlay() as HTMLElement;
    expect(layer.parentElement).toBe(main());
    expect(layer.previousElementSibling).toBe(frame());
    expect(frame().contains(layer)).toBe(false);
  });

  it('covers neither the caption nor the bar of the pages: it is not in them', () => {
    render(<Orders loading />);
    const layer = overlay() as HTMLElement;
    const toolbar = root().querySelector('.flg-data-grid-toolbar') as HTMLElement;
    const pager = root().querySelector('.flg-data-grid-pager') as HTMLElement;
    expect(pager).not.toBeNull();
    for (const part of [toolbar, pager]) {
      expect(part.contains(layer)).toBe(false);
      expect(main().contains(part)).toBe(false);
    }
    // And it is not something that takes the focus.
    expect(layer.querySelectorAll('a, button, input, [tabindex]')).toHaveLength(0);
  });

  it("holds a Spinner that says the loading label, and the label is the caller's to give", () => {
    const { rerender } = render(<Orders loading />);
    const spinner = (overlay() as HTMLElement).querySelector('.flg-spinner') as HTMLElement;
    expect(spinner).toHaveAttribute('data-size', 'md');
    expect(spinner).toHaveTextContent('Loading…');
    rerender(<Orders loading labels={{ loading: 'Đang tải' }} />);
    expect(overlay()?.querySelector('.flg-spinner')).toHaveTextContent('Đang tải');
  });

  it('is the overlay in a server grid too, the same as on the client', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Orders loading />);
    const layer = container.querySelector('.flg-data-grid-main > .flg-data-grid-overlay');
    expect(layer).not.toBeNull();
    expect(container.querySelectorAll('tbody > tr.flg-data-grid-row')).toHaveLength(3);
  });

  it('is loading in server mode too: the page that is shown stays under it', () => {
    render(<Orders remote totalCount={90} loading />);
    expect(overlay()).not.toBeNull();
    expect(dataRows()).toHaveLength(3);
  });

  const place = (element: Element, property: string, value: number) =>
    Object.defineProperty(element, property, { configurable: true, value });

  // Sizes as an engine reports them: the stylesheet of the library is not loaded in these tests.
  const sizes = (head: number, body: number) => {
    place(grid().tHead as HTMLElement, 'offsetHeight', head);
    place(grid().tBodies[0] as HTMLElement, 'offsetTop', body);
  };

  it('is below the heading: its top is the bottom of the measured heading', () => {
    const { rerender } = render(<Orders />);
    // A lined table has no spacing: the body starts where the heading ends.
    sizes(33, 33);
    rerender(<Orders loading />);
    expect(overlay()?.style.top).toBe('33px');
  });

  it('adds what is above the table in the frame', () => {
    const { rerender } = render(<Orders />);
    // A `striped` frame is pulled up by its margin over its padding (the table starts 6px down in it); a
    // `lined` one has its edge.
    place(frame(), 'offsetTop', -6);
    place(frame(), 'clientTop', 1);
    place(grid(), 'offsetTop', 6);
    sizes(31, 31);
    rerender(<Orders loading />);
    expect(overlay()?.style.top).toBe(`${-6 + 1 + 6 + 31}px`);
  });

  it('counts the spacing above the heading where the engine draws it, and not where it does not', () => {
    const { rerender } = render(<Orders />);
    // 2px of spacing above the heading and 2px under it: the heading ends 2px after its own height.
    sizes(26, 30);
    rerender(<Orders loading />);
    expect(overlay()?.style.top).toBe('28px');
    rerender(<Orders />);
    // The same table in an engine that draws none: the body starts where the heading ends.
    sizes(26, 26);
    rerender(<Orders loading />);
    expect(overlay()?.style.top).toBe('26px');
  });

  it('leaves the top to the stylesheet where the heading has no size to measure', () => {
    render(<Orders loading />);
    expect(overlay()?.style.top).toBe('');
  });

  it('follows the heading when it changes size, and is measured only while it is there', () => {
    const observers: { callback: ResizeObserverCallback; disconnect: () => void }[] = [];
    class FakeObserver {
      constructor(callback: ResizeObserverCallback) {
        observers.push({ callback, disconnect: vi.fn() });
        this.index = observers.length - 1;
      }
      private readonly index: number;
      observe() {}
      unobserve() {}
      disconnect() {
        observers[this.index]?.disconnect();
      }
    }
    vi.stubGlobal('ResizeObserver', FakeObserver);
    const { rerender } = render(<Orders />);
    // Nothing is watched for a grid that does not load, with a width on every column and no height.
    expect(observers).toHaveLength(0);
    const head = vi.spyOn(grid().tHead as HTMLElement, 'offsetHeight', 'get').mockReturnValue(33);
    const body = vi.spyOn(grid().tBodies[0] as HTMLElement, 'offsetTop', 'get').mockReturnValue(33);
    rerender(<Orders loading />);
    expect(observers).toHaveLength(1);
    expect(overlay()?.style.top).toBe('33px');
    head.mockReturnValue(41);
    body.mockReturnValue(41);
    act(() => observers[0]?.callback([], {} as ResizeObserver));
    expect(overlay()?.style.top).toBe('41px');
    rerender(<Orders />);
    expect(observers[0]?.disconnect).toHaveBeenCalled();
    expect(overlay()).toBeNull();
  });

  it('takes the data rows into no account: they keep their keys, their roles and their keyboard', () => {
    render(<Orders loading selectionMode="single" />);
    expect(dataRows()).toHaveLength(3);
    expect(dataRows()[0]).toHaveAttribute('aria-selected', 'false');
    const stops = grid().querySelectorAll('[tabindex="0"]');
    expect(stops).toHaveLength(1);
    expect(stops[0]?.closest('tbody')).not.toBeNull();
  });
});

describe('aria-busy', () => {
  it('is on the table while the grid loads, with rows or without, and not before or after', () => {
    const { rerender } = render(<Orders />);
    expect(grid()).not.toHaveAttribute('aria-busy');
    rerender(<Orders loading />);
    expect(grid()).toHaveAttribute('aria-busy', 'true');
    rerender(<Orders />);
    expect(grid()).not.toHaveAttribute('aria-busy');
    rerender(<Orders data={[]} loading />);
    expect(grid()).toHaveAttribute('aria-busy', 'true');
    rerender(<Orders data={[]} />);
    expect(grid()).not.toHaveAttribute('aria-busy');
  });

  it('is only a true loading: a value that is not a boolean is not loading', () => {
    // @ts-expect-error a string is not a `loading`
    render(<Orders loading="yes" />);
    expect(grid()).not.toHaveAttribute('aria-busy');
    expect(overlay()).toBeNull();
  });

  it('leaves the aria attributes of the caller on the table', () => {
    render(<Orders loading aria-describedby="note" />);
    expect(grid()).toHaveAttribute('aria-describedby', expect.stringContaining('note'));
    expect(grid()).toHaveAttribute('aria-busy', 'true');
  });
});

describe('announcing the loading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  // Async, so that what a MutationObserver saw is delivered before the next step.
  const wait = (ms: number) =>
    act(async () => {
      vi.advanceTimersByTime(ms);
    });

  // Every text the region takes, in order, so that a sentence said twice is seen twice.
  function recordRegion(): string[] {
    const texts: string[] = [];
    const observer = new MutationObserver(() => {
      const text = said();
      if (text) texts.push(text);
    });
    observer.observe(root().lastElementChild as HTMLElement, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return texts;
  }

  it('says nothing for a grid that is not loading', async () => {
    render(<Orders />);
    await wait(LOADING_ANNOUNCE_DELAY * 3);
    expect(said()).toBe('');
  });

  it('says the label once, when loading starts', async () => {
    const { rerender } = render(<Orders />);
    const texts = recordRegion();
    rerender(<Orders loading />);
    await wait(LOADING_ANNOUNCE_DELAY - 1);
    expect(said()).toBe('');
    await wait(2);
    expect(said()).toBe('Loading…');
    // Still loading, and the grid draws again: it does not say it again.
    rerender(<Orders loading caption="Orders" />);
    await wait(LOADING_ANNOUNCE_DELAY * 3);
    expect(texts).toEqual(['Loading…']);
  });

  it('says it for a grid that mounts loading, with rows or without', async () => {
    const { unmount } = render(<Orders data={[]} loading />);
    await wait(LOADING_ANNOUNCE_DELAY + 1);
    expect(said()).toBe('Loading…');
    unmount();
    render(<Orders loading />);
    await wait(LOADING_ANNOUNCE_DELAY + 1);
    expect(said()).toBe('Loading…');
  });

  it('says it once when the loading flips and flips back quickly', async () => {
    const { rerender } = render(<Orders />);
    const texts = recordRegion();
    rerender(<Orders loading />);
    await wait(100);
    rerender(<Orders />);
    await wait(50);
    rerender(<Orders loading />);
    await wait(LOADING_ANNOUNCE_DELAY * 4);
    expect(said()).toBe('Loading…');
    expect(texts).toEqual(['Loading…']);
  });

  it('says nothing for a load of half a second, and says it once for one of 1.2 s', async () => {
    const { rerender } = render(<Orders />);
    const texts = recordRegion();
    rerender(<Orders loading />);
    await wait(500);
    rerender(<Orders />);
    await wait(LOADING_ANNOUNCE_DELAY * 3);
    expect(said()).toBe('');
    expect(texts).toEqual([]);
    rerender(<Orders loading />);
    await wait(1200);
    expect(said()).toBe('Loading…');
    rerender(<Orders />);
    await wait(LOADING_ANNOUNCE_DELAY * 3);
    expect(texts).toEqual(['Loading…']);
  });

  it('waits a full second', async () => {
    expect(LOADING_ANNOUNCE_DELAY).toBe(1000);
    const { rerender } = render(<Orders />);
    rerender(<Orders loading />);
    await wait(999);
    expect(said()).toBe('');
    await wait(2);
    expect(said()).toBe('Loading…');
  });

  it('keeps the sentence of a sort that the same press started a load with', async () => {
    const { rerender } = render(<Orders remote totalCount={3} />);
    fireEvent.click(screen.getByRole('button', { name: /Qty/ }));
    // The app answers the press by loading.
    rerender(<Orders remote totalCount={3} loading />);
    await wait(50);
    expect(said()).toBe('Sorted by Qty, ascending');
    await wait(LOADING_ANNOUNCE_DELAY + 100);
    // Only when the load has gone on for a second does the grid say that it is loading.
    expect(said()).toBe('Loading…');
  });

  it('says it again for the next load, which is a new one', async () => {
    const { rerender } = render(<Orders />);
    const texts = recordRegion();
    rerender(<Orders loading />);
    await wait(LOADING_ANNOUNCE_DELAY + 1);
    rerender(<Orders />);
    await wait(10);
    rerender(<Orders loading />);
    // The region is emptied a task before it has the words again, so the same sentence is read again.
    await wait(LOADING_ANNOUNCE_DELAY);
    await wait(1);
    expect(texts).toEqual(['Loading…', 'Loading…']);
  });

  it('says the label the caller gives, and not a change of the label as a new loading', async () => {
    const { rerender } = render(<Orders loading labels={{ loading: 'Đang tải' }} />);
    const texts = recordRegion();
    await wait(LOADING_ANNOUNCE_DELAY + 1);
    expect(said()).toBe('Đang tải');
    rerender(<Orders loading labels={{ loading: 'Chờ chút' }} />);
    await wait(LOADING_ANNOUNCE_DELAY * 3);
    expect(texts).toEqual(['Đang tải']);
  });

  it('says it once in StrictMode, which runs the effects twice', async () => {
    render(
      <StrictMode>
        <Orders loading />
      </StrictMode>,
    );
    const texts = recordRegion();
    await wait(LOADING_ANNOUNCE_DELAY * 3);
    expect(said()).toBe('Loading…');
    expect(texts).toEqual(['Loading…']);
  });

  it('leaves no wait behind when the grid is gone before it is said', () => {
    const { unmount } = render(<Orders loading />);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('empty: no rows and not loading', () => {
  it('draws one row with one cell across every column, and the words', () => {
    render(<Orders data={[]} />);
    const rows = emptyRows();
    expect(rows).toHaveLength(1);
    const row = rows[0] as HTMLElement;
    expect(row.children).toHaveLength(1);
    expect(row.children[0]).toHaveAttribute('colspan', String(COLUMNS.length));
    expect(row).toHaveTextContent('No data');
    expect(grid().querySelectorAll('tbody > tr')).toHaveLength(1);
  });

  it("spans the column of boxes too, and says the caller's words", () => {
    render(<Orders data={[]} selectionMode="multiple" labels={{ noData: 'Chưa có đơn' }} />);
    const cell = emptyRows()[0]?.children[0] as HTMLElement;
    expect(cell).toHaveAttribute('colspan', String(COLUMNS.length + 1));
    expect(cell).toHaveTextContent('Chưa có đơn');
  });

  it('is not a row of data: no role of its own, no selection, nothing that takes the focus', () => {
    render(<Orders data={[]} selectionMode="single" />);
    const row = emptyRows()[0] as HTMLElement;
    expect(row).not.toHaveClass('flg-data-grid-row');
    expect(row).not.toHaveAttribute('aria-selected');
    expect(row.querySelectorAll('[tabindex], button, input, a')).toHaveLength(0);
    expect(dataRows()).toHaveLength(0);
  });

  it('has the heading for its one stop of Tab, and a key does not take it anywhere else', () => {
    render(<Orders data={[]} />);
    const stops = grid().querySelectorAll('[tabindex="0"]');
    expect(stops).toHaveLength(1);
    const title = stops[0] as HTMLElement;
    expect(title.closest('thead')).not.toBeNull();
    title.focus();
    for (const key of ['ArrowDown', 'End', 'PageDown', 'ArrowDown']) {
      fireEvent.keyDown(document.activeElement as Element, { key });
    }
    expect(document.activeElement?.closest('thead')).not.toBeNull();
    expect(grid().querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });

  it('has no bar of pages, and a mounted grid goes in and out of it with its rows', () => {
    const { rerender } = render(<Orders />);
    expect(root().querySelector('.flg-data-grid-pager')).not.toBeNull();
    rerender(<Orders data={[]} />);
    expect(emptyRows()).toHaveLength(1);
    expect(root().querySelector('.flg-data-grid-pager')).toBeNull();
    rerender(<Orders />);
    expect(emptyRows()).toHaveLength(0);
    expect(dataRows()).toHaveLength(3);
    expect(root().querySelector('.flg-data-grid-pager')).not.toBeNull();
  });

  it('is what a grid of server mode with no rows shows', () => {
    render(<Orders data={[]} remote totalCount={0} />);
    expect(emptyRows()).toHaveLength(1);
  });

  it('is replaced by the skeleton when it loads, and is not busy when it is empty', () => {
    const { rerender } = render(<Orders data={[]} />);
    expect(grid()).not.toHaveAttribute('aria-busy');
    rerender(<Orders data={[]} loading />);
    expect(emptyRows()).toHaveLength(0);
    expect(skeletonRows().length).toBeGreaterThan(0);
    rerender(<Orders data={[]} />);
    expect(emptyRows()).toHaveLength(1);
    expect(skeletonRows()).toHaveLength(0);
  });

  it('is the same on the server', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Orders data={[]} />);
    const row = container.querySelector('tbody > tr.flg-data-grid-empty');
    expect(row).toHaveTextContent('No data');
    expect(container.querySelectorAll('tbody > tr')).toHaveLength(1);
  });
});

describe('the width of what spans every column', () => {
  interface Watcher {
    callback: ResizeObserverCallback;
    targets: Element[];
    disconnect: Mock<() => void>;
  }
  function stubObserver(): Watcher[] {
    const watchers: Watcher[] = [];
    class FakeObserver {
      private readonly watcher: Watcher;
      constructor(callback: ResizeObserverCallback) {
        this.watcher = { callback, targets: [], disconnect: vi.fn() };
        watchers.push(this.watcher);
      }
      observe(target: Element) {
        this.watcher.targets.push(target);
      }
      unobserve() {}
      disconnect() {
        this.watcher.disconnect();
      }
    }
    vi.stubGlobal('ResizeObserver', FakeObserver);
    return watchers;
  }
  const FRAME_WIDTH = '--flg-data-grid-frame-width';

  it('is measured while the empty row is shown, even when every column has a width', () => {
    const watchers = stubObserver();
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(640);
    render(<Orders data={[]} />);
    expect(watchers).toHaveLength(1);
    expect(watchers[0]?.targets).toEqual([frame()]);
    expect(frame().style.getPropertyValue(FRAME_WIDTH)).toBe('640px');
    // The columns keep the widths they have: only a flexible column is spread over the room.
    expect(Array.from(grid().querySelectorAll('col')).map((col) => col.style.width)).toEqual(
      COLUMNS.map((column) => `${column.width}px`),
    );
  });

  it('follows the frame while it is empty, and lets go when rows come', () => {
    const watchers = stubObserver();
    const clientWidth = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(640);
    const { rerender } = render(<Orders data={[]} />);
    clientWidth.mockReturnValue(500);
    act(() => watchers[0]?.callback([], {} as ResizeObserver));
    expect(frame().style.getPropertyValue(FRAME_WIDTH)).toBe('500px');
    rerender(<Orders />);
    expect(watchers[0]?.disconnect).toHaveBeenCalled();
    expect(frame().style.getPropertyValue(FRAME_WIDTH)).toBe('');
  });

  it('measures nothing for a grid with rows and a width on every column', () => {
    const watchers = stubObserver();
    render(<Orders />);
    expect(watchers).toHaveLength(0);
  });

  it('measures nothing for the skeleton: it is as wide as the columns are', () => {
    const watchers = stubObserver();
    render(<Orders data={[]} loading />);
    expect(watchers).toHaveLength(0);
  });
});

describe('the handle', () => {
  it('has exactly the four members the grid has so far', () => {
    const ref = createRef<DataGridHandle>();
    render(<DataGrid ref={ref} data={ORDERS} rowKey="id" columns={COLUMNS} caption="Orders" />);
    expect(Object.keys(ref.current as object).sort()).toEqual([
      'element',
      'focus',
      'getState',
      'scrollToRow',
    ]);
  });

  it('is the same object whatever the grid shows: loading, empty or with rows', () => {
    const ref = createRef<DataGridHandle>();
    const view = (props: Partial<DataGridProps<Order>>) => (
      <DataGrid ref={ref} data={ORDERS} rowKey="id" columns={COLUMNS} caption="Orders" {...props} />
    );
    const { rerender } = render(view({}));
    const handle = ref.current;
    rerender(view({ loading: true }));
    rerender(view({ data: [], loading: true }));
    rerender(view({ data: [] }));
    expect(ref.current).toBe(handle);
    expect(ref.current?.element).toBe(root());
  });

  it('does not throw when a grid with no rows is asked to do something', () => {
    const ref = createRef<DataGridHandle>();
    render(<DataGrid ref={ref} data={[]} rowKey="id" columns={COLUMNS} caption="Orders" />);
    expect(ref.current?.scrollToRow('DH-1030')).toBe(false);
    expect(() => ref.current?.focus()).not.toThrow();
    expect(document.activeElement?.closest('thead')).not.toBeNull();
    expect(ref.current?.getState().selectedKeys).toEqual([]);
  });
});
