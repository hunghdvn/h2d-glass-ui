import { act, createEvent, fireEvent, render } from '@testing-library/react';
import { createRef, useState } from 'react';
import type { Ref } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type {
  DataGridColumn,
  DataGridExpandedGroups,
  DataGridGroupItem,
  DataGridHandle,
  DataGridProps,
} from './index';

// Virtual scrolling over group rows (spec phase 6 §3.7 "Cuộn ảo", §3.6 "aria-rowcount", "Treegrid") and
// `scrollToRow` that opens the groups holding its row (§6.3): the window counts a group row at its own
// height, the rows say their place in their group, a page of keys moves by the rows it shows, and a
// request to scroll lives to the next commit and no longer.

const DATA = 41;
const GROUP = 33;
const FRAME = 400;
const HEAD = 41;

const frames: Array<() => void> = [];

beforeEach(() => {
  resetDevWarnings();
  HTMLElement.prototype.checkVisibility = () => true;
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.classList.contains('flg-table-frame') ? FRAME : 0;
  });
  // A group row is lower than a data row, as the stylesheet draws it; jsdom has no layout.
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.tagName === 'THEAD') return HEAD;
    if (this.tagName !== 'TR') return 0;
    return this.classList.contains('flg-data-grid-group-row') ? GROUP : DATA;
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
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  vi.restoreAllMocks();
});

interface Order {
  id: string;
  batch: string;
  line: string;
}

/** `count` orders, `per` to a batch: `DH-1` is in `B01`; the lines alternate `L1`, `L2`. */
const makeOrders = (count: number, per: number): Order[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `DH-${index + 1}`,
    batch: `B${String(Math.floor(index / per) + 1).padStart(2, '0')}`,
    line: index % 2 === 0 ? 'L1' : 'L2',
  }));

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
  { field: 'batch', caption: 'Batch', width: 100 },
  { field: 'line', caption: 'Line', width: 100 },
];
const BY_BATCH: DataGridGroupItem[] = [{ field: 'batch', direction: 'asc' }];
const BY_BATCH_THEN_LINE: DataGridGroupItem[] = [
  { field: 'batch', direction: 'asc' },
  { field: 'line', direction: 'asc' },
];
const CLOSED: DataGridExpandedGroups = { allExpanded: false, except: [] };
const key = (...steps: [string, unknown][]) => JSON.stringify(steps);

const FIVE_BY_TWENTY = makeOrders(100, 20);
const TWENTY_BY_THREE = makeOrders(60, 3);

function Orders({
  gridRef,
  data = FIVE_BY_TWENTY,
  ...props
}: Partial<DataGridProps<Order>> & { gridRef?: Ref<DataGridHandle> }) {
  return (
    <DataGrid
      ref={gridRef}
      data={data}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      height={FRAME}
      scrolling="virtual"
      grouping={BY_BATCH}
      {...props}
    />
  );
}

const table = () => document.querySelector<HTMLTableElement>('table[role]')!;
const frame = () => table().parentElement as HTMLElement;
const groupRows = () =>
  Array.from(table().querySelectorAll<HTMLElement>('tbody > tr.flg-data-grid-group-row'));
const dataRows = () =>
  Array.from(table().querySelectorAll<HTMLElement>('tbody > tr.flg-data-grid-row'));
const spacers = () =>
  Array.from(table().querySelectorAll<HTMLElement>('tbody > .flg-data-grid-spacer'));
const heightOf = (spacer: HTMLElement) => (spacer.firstElementChild as HTMLElement).style.height;
const rowAtIndex = (rowindex: number) =>
  table().querySelector<HTMLElement>(`tbody > [aria-rowindex="${rowindex}"]`)!;
const dataRowOf = (id: string) => dataRows().find((row) => row.textContent?.includes(id));
const focusOn = (element: HTMLElement) => act(() => element.focus());
const press = (element: HTMLElement, pressed: string): boolean => {
  const event = createEvent.keyDown(element, { key: pressed, bubbles: true, cancelable: true });
  act(() => {
    fireEvent(element, event);
  });
  return event.defaultPrevented;
};
const flushFrames = () => {
  act(() => {
    for (const run of frames.splice(0)) run();
  });
};
const scrollTo = (top: number) => {
  act(() => {
    frame().scrollTop = top;
    fireEvent.scroll(frame());
  });
  flushFrames();
};

describe('the offsets with group rows', () => {
  it('count a group row at its own height: the spacer is the sum of both kinds', () => {
    render(<Orders />);
    // The list is 5 group rows (33px) and 100 data rows (41px). The window is the group row and the 9
    // rows that start above 400px, then 6 more: the first 16 rows.
    expect(groupRows()).toHaveLength(1);
    expect(dataRows()).toHaveLength(15);
    expect(spacers()).toHaveLength(1);
    expect(heightOf(spacers()[0]!)).toBe(`${5 * GROUP + 100 * DATA - (GROUP + 15 * DATA)}px`);
  });

  it('are of two pitches once the distance of two data rows is measured, one measure for both', () => {
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('flg-data-grid-row')
        ? (Number(this.getAttribute('aria-rowindex')) - 2) * 50
        : 0;
    });
    render(<Orders />);
    // A data row is 50px from the next, so a group row is 8px less, the difference of the two heights:
    // 42. The window is then the first 15 rows, 42 + 14 * 50px.
    expect(groupRows()).toHaveLength(1);
    expect(dataRows()).toHaveLength(14);
    expect(heightOf(spacers()[0]!)).toBe(`${5 * 42 + 100 * 50 - (42 + 14 * 50)}px`);
  });

  it('leave a `striped` spacer less the 2px that its table adds around it', () => {
    render(<Orders variant="striped" />);
    // Rows of 40px and 32px with 2px between them: pitches of 42 and 34, the first 16 rows drawn.
    const total = 5 * 34 + 100 * 42;
    const drawn = 34 + 15 * 42;
    expect(heightOf(spacers()[0]!)).toBe(`${total - drawn - 2}px`);
  });

  it("follow the caller's `rowHeight` for data rows only: a group row keeps its density's height", () => {
    render(<Orders rowHeight={33} />);
    // Data rows of 33px beside group rows of 33px, as R1 draws them: every row has one pitch, and the
    // window is the 13 rows that start above 400px and 6 more.
    expect(heightOf(spacers()[0]!)).toBe(`${(105 - 19) * 33}px`);
  });

  it('make a closed group one row of the list', () => {
    render(<Orders defaultExpandedGroups={CLOSED} />);
    expect(groupRows()).toHaveLength(5);
    expect(dataRows()).toHaveLength(0);
    expect(spacers()).toHaveLength(0);
    expect(table()).toHaveAttribute('aria-rowcount', '6');
  });
});

describe('the window with group rows', () => {
  it('keeps the group row that has the focus drawn when the frame scrolls far away', () => {
    render(<Orders />);
    const first = groupRows()[0]!;
    focusOn(first);
    scrollTo(3000);
    expect(first.isConnected).toBe(true);
    expect(document.activeElement).toBe(first);
    expect(groupRows()[0]).toBe(first);
    // It is drawn at its own place, with a spacer on each side of it.
    expect(spacers().length).toBeGreaterThanOrEqual(2);
  });
});

describe('aria with group rows in a virtual grid', () => {
  it('counts the heading and every row of the list, group rows included', () => {
    render(<Orders />);
    expect(table()).toHaveAttribute('aria-rowcount', '106');
    scrollTo(2000);
    expect(table()).toHaveAttribute('aria-rowcount', '106');
  });

  it('numbers a group row in the list as it numbers a data row', () => {
    render(<Orders />);
    // The heading is row 1, the first group row row 2 and its first data row row 3; the second group row
    // follows the 20 rows of the first, at 21 in the list, so it is row 23.
    expect(groupRows()[0]).toHaveAttribute('aria-rowindex', '2');
    expect(rowAtIndex(3)).toHaveClass('flg-data-grid-row');
    scrollTo(900);
    const second = groupRows().find((row) => row.getAttribute('aria-rowindex') === '23');
    expect(second).toBeDefined();
    expect(second).toHaveAttribute('aria-level', '1');
    expect(second).toHaveAttribute('aria-posinset', '2');
    expect(second).toHaveAttribute('aria-setsize', '5');
  });

  it('says the place of a data row in its whole group, not in the window', () => {
    render(<Orders />);
    scrollTo(900);
    const row = dataRowOf('DH-35')!;
    expect(row).toHaveAttribute('aria-level', '2');
    expect(row).toHaveAttribute('aria-setsize', '20');
    expect(row).toHaveAttribute('aria-posinset', '15');
  });

  it('counts the group rows of two levels in the list', () => {
    render(<Orders grouping={BY_BATCH_THEN_LINE} />);
    // 5 batches of 2 lines: 5 group rows of the first level, 10 of the second, 100 data rows, the heading.
    expect(table()).toHaveAttribute('aria-rowcount', '116');
    expect(dataRows()[0]).toHaveAttribute('aria-level', '3');
  });

  it('is the same on the server', () => {
    const html = renderToString(<Orders />);
    expect(html).toContain('aria-rowcount="106"');
    expect(html).toContain('role="treegrid"');
  });
});

describe('PageUp and PageDown over rows of two heights', () => {
  const rowsOfThree = <Orders data={TWENTY_BY_THREE} />;

  it('moves down by the rows that fit under the heading, counted over their own heights', () => {
    render(rowsOfThree);
    // Under the heading there are 359px. From the first group row: a group row (33), three data rows
    // (123), a group row, three data rows and a group row make 345px: nine rows. Counted at the height
    // of a data row it would be eight.
    focusOn(groupRows()[0]!);
    expect(press(groupRows()[0]!, 'PageDown')).toBe(true);
    const target = rowAtIndex(2 + 9);
    expect(target).toHaveClass('flg-data-grid-row');
    expect(target.contains(document.activeElement)).toBe(true);
  });

  it('moves up by the rows above it that fit, and stops at the first row', () => {
    render(rowsOfThree);
    focusOn(groupRows()[0]!);
    press(groupRows()[0]!, 'PageDown');
    press(document.activeElement as HTMLElement, 'PageUp');
    // Rows 8 down to 0 make 345px, so the nine of them are one page, and the move ends at the first.
    expect(document.activeElement).toBe(rowAtIndex(2));
  });

  it('is one row at least, in a frame too low for any', () => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('flg-table-frame') ? 20 : 0;
    });
    render(rowsOfThree);
    focusOn(groupRows()[0]!);
    press(groupRows()[0]!, 'PageDown');
    expect(rowAtIndex(3).contains(document.activeElement)).toBe(true);
  });
});

describe('scrollToRow with groups', () => {
  const callbacks = () => {
    const calls: string[] = [];
    return {
      calls,
      onExpandedGroupsChange: vi.fn(() => void calls.push('groups')),
      onStateChange: vi.fn((_state: unknown, part: string) => void calls.push(part)),
      onPageChange: vi.fn(() => void calls.push('page')),
    };
  };

  it('opens the groups that hold the row in one request, then draws the row', () => {
    const ref = createRef<DataGridHandle>();
    const { calls, onExpandedGroupsChange, onStateChange } = callbacks();
    render(
      <Orders
        gridRef={ref}
        defaultExpandedGroups={CLOSED}
        onExpandedGroupsChange={onExpandedGroupsChange}
        onStateChange={onStateChange}
      />,
    );
    let found = false;
    act(() => {
      found = ref.current!.scrollToRow('DH-45');
    });
    expect(found).toBe(true);
    expect(calls).toEqual(['groups', 'expandedGroups']);
    expect(onExpandedGroupsChange).toHaveBeenCalledExactlyOnceWith({
      allExpanded: false,
      except: [key(['batch', 'B03'])],
    });
    // The list is 3 group rows, DH-41 to DH-60 and 2 group rows: DH-45 is the 8th row, row 9.
    expect(dataRowOf('DH-45')).toHaveAttribute('aria-rowindex', '9');
  });

  it('opens both levels of a row in one request', () => {
    const ref = createRef<DataGridHandle>();
    const { onExpandedGroupsChange } = callbacks();
    render(
      <Orders
        gridRef={ref}
        grouping={BY_BATCH_THEN_LINE}
        defaultExpandedGroups={CLOSED}
        onExpandedGroupsChange={onExpandedGroupsChange}
      />,
    );
    act(() => {
      ref.current!.scrollToRow('DH-45');
    });
    expect(onExpandedGroupsChange).toHaveBeenCalledExactlyOnceWith({
      allExpanded: false,
      except: [key(['batch', 'B03']), key(['batch', 'B03'], ['line', 'L1'])],
    });
    expect(dataRowOf('DH-45')).toBeDefined();
  });

  it('asks for nothing when the groups are open, and scrolls', () => {
    const ref = createRef<DataGridHandle>();
    const { onExpandedGroupsChange } = callbacks();
    render(<Orders gridRef={ref} onExpandedGroupsChange={onExpandedGroupsChange} />);
    act(() => {
      ref.current!.scrollToRow('DH-90');
    });
    expect(onExpandedGroupsChange).not.toHaveBeenCalled();
    expect(frame().scrollTop).toBeGreaterThan(0);
  });

  it('asks for the groups that are closed and no other', () => {
    const ref = createRef<DataGridHandle>();
    const { onExpandedGroupsChange } = callbacks();
    render(
      <Orders
        gridRef={ref}
        defaultExpandedGroups={{ allExpanded: true, except: [key(['batch', 'B05'])] }}
        onExpandedGroupsChange={onExpandedGroupsChange}
      />,
    );
    act(() => {
      ref.current!.scrollToRow('DH-70');
    });
    expect(onExpandedGroupsChange).not.toHaveBeenCalled();
    act(() => {
      ref.current!.scrollToRow('DH-90');
    });
    expect(onExpandedGroupsChange).toHaveBeenCalledExactlyOnceWith({
      allExpanded: true,
      except: [],
    });
  });

  it('goes to the page of the row once the groups are open, then scrolls it into view', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const ref = createRef<DataGridHandle>();
    const { calls, onExpandedGroupsChange, onPageChange } = callbacks();
    render(
      <Orders
        gridRef={ref}
        scrolling="standard"
        height={undefined}
        paging={{ pageSize: 5 }}
        defaultExpandedGroups={CLOSED}
        onExpandedGroupsChange={onExpandedGroupsChange}
        onPageChange={onPageChange}
      />,
    );
    act(() => {
      ref.current!.scrollToRow('DH-45');
    });
    // Open, the rows the pager counts before DH-45 are 3 group rows and DH-41 to DH-44: seven, so the
    // second page of five.
    expect(calls).toEqual(['groups', 'page']);
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith({ index: 1, size: 5 });
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(dataRowOf('DH-45'));
  });

  it('is false for a key no row has and for a row the filter takes out, and asks for nothing', () => {
    const ref = createRef<DataGridHandle>();
    const { onExpandedGroupsChange } = callbacks();
    render(
      <Orders
        gridRef={ref}
        defaultExpandedGroups={CLOSED}
        defaultFilter={{ search: 'DH-1' }}
        onExpandedGroupsChange={onExpandedGroupsChange}
      />,
    );
    expect(ref.current!.scrollToRow('nope')).toBe(false);
    expect(ref.current!.scrollToRow('DH-45')).toBe(false);
    expect(onExpandedGroupsChange).not.toHaveBeenCalled();
  });

  it('drops the request at the next commit when a parent keeps the groups closed', () => {
    const ref = createRef<DataGridHandle>();
    const { onExpandedGroupsChange } = callbacks();
    let open: (value: DataGridExpandedGroups) => void = () => {};
    function Parent() {
      const [expanded, setExpanded] = useState<DataGridExpandedGroups>(CLOSED);
      // The parent hears the request and draws, but keeps the groups closed.
      const [, draw] = useState(0);
      open = setExpanded;
      return (
        <Orders
          gridRef={ref}
          expandedGroups={expanded}
          onExpandedGroupsChange={() => {
            onExpandedGroupsChange();
            draw((count) => count + 1);
          }}
        />
      );
    }
    render(<Parent />);
    act(() => {
      ref.current!.scrollToRow('DH-90');
    });
    expect(onExpandedGroupsChange).toHaveBeenCalledTimes(1);
    expect(frame().scrollTop).toBe(0);
    // The groups open later for the parent's own reasons: nothing scrolls, and nothing asks again.
    act(() => open({ allExpanded: true, except: [] }));
    expect(frame().scrollTop).toBe(0);
    expect(onExpandedGroupsChange).toHaveBeenCalledTimes(1);
  });

  it('drops the request at the commit after it asked for a page that a parent keeps away', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const ref = createRef<DataGridHandle>();
    const onPageChange = vi.fn();
    let goTo: (index: number) => void = () => {};
    function Parent() {
      const [index, setIndex] = useState(0);
      goTo = setIndex;
      // The parent hears the page that was asked for and draws, but keeps the first page.
      const [, draw] = useState(0);
      return (
        <Orders
          gridRef={ref}
          scrolling="standard"
          height={undefined}
          page={{ index, size: 5 }}
          onPageChange={() => {
            onPageChange();
            draw((count) => count + 1);
          }}
          defaultExpandedGroups={CLOSED}
        />
      );
    }
    render(<Parent />);
    act(() => {
      ref.current!.scrollToRow('DH-45');
    });
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).not.toHaveBeenCalled();
    // The parent goes to that page later, of its own: the request is over, and nothing scrolls.
    act(() => goTo(1));
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(onPageChange).toHaveBeenCalledTimes(1);
  });

  it('scrolls a virtual grid to a row of a group that was closed, at the offsets of the rows then', () => {
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} defaultExpandedGroups={CLOSED} />);
    act(() => {
      ref.current!.scrollToRow('DH-58');
    });
    // The list is 3 group rows, DH-41 to DH-60 and 2 group rows. DH-58 is the 21st row, which ends at
    // 3 * 33 + 18 * 41 = 837px; under the heading and at the bottom of a frame of 400px that is
    // 837 + 41 - 400.
    expect(frame().scrollTop).toBe(478);
    expect(dataRowOf('DH-58')).toBeDefined();
  });
});
