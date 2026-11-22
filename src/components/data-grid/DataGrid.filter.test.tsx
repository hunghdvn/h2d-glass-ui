import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import type { Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type {
  DataGridColumn,
  DataGridFilter,
  DataGridHandle,
  DataGridPage,
  DataGridProps,
  DataGridState,
} from './index';
import { FILTER_ANNOUNCE_DELAY } from './hooks/use-rows-found';
import { DEFAULT_LABELS } from './labels';

// The filter state of the grid (spec phase 6 §6.1, §6.3 "Lọc"): a controllable value like the sort, the
// first page after a change, the rows found, `clearFilter()` and the grid that is empty because of its
// filter. The search field and the cells of the filter row come in later tasks; until then the filter
// is given as a prop and cleared by the handle and by the button of the empty grid.

const warn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});

beforeEach(() => {
  resetDevWarnings();
  HTMLElement.prototype.checkVisibility = () => true;
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  vi.useRealTimers();
  vi.restoreAllMocks();
});

interface Order {
  id: string;
  customer: string;
  qty: number;
}

const makeOrders = (count: number): Order[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `DH-${1000 + index}`,
    customer: `Customer ${index + 1}`,
    qty: index + 1,
  }));

const ORDERS = makeOrders(12);

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
  { field: 'customer', caption: 'Customer', width: 200 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
];

/** Keeps the rows whose customer holds "Customer 1": Customer 1, 10, 11 and 12. */
const SOME: DataGridFilter = { search: 'Customer 1' };
/** Keeps no row. */
const NONE: DataGridFilter = { search: 'nobody at all' };

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

const grid = () => screen.getByRole('grid') as HTMLTableElement;
const bodyRows = () => Array.from(grid().querySelectorAll<HTMLElement>('tbody > tr'));
const dataRows = () => grid().querySelectorAll('tbody > tr.flg-data-grid-row');
const stops = () => Array.from(grid().querySelectorAll<HTMLElement>('[tabindex="0"]'));
const live = () => document.querySelector('[aria-live]')!.textContent;
const clearButton = () => screen.getByRole('button', { name: 'Clear filter' });
const head = (caption: string) =>
  Array.from(grid().querySelectorAll<HTMLElement>('thead th')).find((th) =>
    th.textContent?.startsWith(caption),
  )!;
const press = (element: HTMLElement, key: string, init: KeyboardEventInit = {}): boolean => {
  const event = createEvent.keyDown(element, { key, bubbles: true, cancelable: true, ...init });
  act(() => {
    fireEvent(element, event);
  });
  return event.defaultPrevented;
};
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe('the filter state', () => {
  it('filters the rows of an uncontrolled grid by defaultFilter, and shows it in getState()', () => {
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} defaultFilter={SOME} />);
    expect(dataRows()).toHaveLength(4);
    expect(ref.current!.getState().filter).toEqual(SOME);
  });

  it('is empty by default: no condition, nothing filtered', () => {
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} />);
    expect(dataRows()).toHaveLength(12);
    expect(ref.current!.getState().filter).toEqual({});
  });

  it('follows a controlled filter, and a change from outside calls no callback', () => {
    const onFilterChange = vi.fn();
    const onStateChange = vi.fn();
    const { rerender } = render(
      <Orders filter={{}} onFilterChange={onFilterChange} onStateChange={onStateChange} />,
    );
    expect(dataRows()).toHaveLength(12);
    rerender(
      <Orders filter={SOME} onFilterChange={onFilterChange} onStateChange={onStateChange} />,
    );
    expect(dataRows()).toHaveLength(4);
    rerender(
      <Orders filter={NONE} onFilterChange={onFilterChange} onStateChange={onStateChange} />,
    );
    expect(dataRows()).toHaveLength(0);
    expect(onFilterChange).not.toHaveBeenCalled();
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it('filters by a condition of a column, the hidden one too', () => {
    const filter: DataGridFilter = { columns: { qty: { operator: '>', value: 10 } } };
    render(<Orders defaultFilter={filter} defaultColumnLayout={{ hidden: ['qty'] }} />);
    expect(dataRows()).toHaveLength(2);
  });

  it('holds a condition of a column that comes after mount, and filters when it arrives', () => {
    const filter: DataGridFilter = { columns: { qty: { operator: '>', value: 10 } } };
    const ref = createRef<DataGridHandle>();
    const { rerender } = render(<Orders gridRef={ref} columns={[]} defaultFilter={filter} />);
    expect(ref.current!.getState().filter).toEqual(filter);
    rerender(<Orders gridRef={ref} columns={COLUMNS} defaultFilter={filter} />);
    expect(dataRows()).toHaveLength(2);
    expect(ref.current!.getState().filter).toEqual(filter);
  });

  it('ignores a condition of an unknown column, an operator the column lacks and a value it cannot read, with no word', () => {
    const spy = warn();
    const filter: DataGridFilter = {
      columns: {
        nobody: { operator: '=', value: 1 },
        qty: { operator: 'contains', value: 'a' },
        customer: { operator: 'contains', value: 5 },
        ['constructor']: { operator: '=' as const, value: 'x' },
      },
    };
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} defaultFilter={filter} />);
    expect(dataRows()).toHaveLength(12);
    expect(ref.current!.getState().filter).toEqual(filter);
    expect(spy).not.toHaveBeenCalled();
  });

  it('warns once for each malformed filter prop, and leaves out the parts that are not of their kind', () => {
    const spy = warn();
    const bad = {
      search: 5,
      enabled: 'yes',
      columns: { qty: { operator: 3, value: 10, values: 'a', exclude: 1 }, customer: 'x' },
    } as unknown as DataGridFilter;
    const ref = createRef<DataGridHandle>();
    const { rerender } = render(<Orders gridRef={ref} defaultFilter={bad} />);
    // What is of its kind stays: the value of qty with no operator and no values, which filters nothing
    // in the type's first operator of a number ("=") for the value 10: one row.
    expect(ref.current!.getState().filter).toEqual({ columns: { qty: { value: 10 } } });
    expect(dataRows()).toHaveLength(1);
    rerender(<Orders gridRef={ref} defaultFilter={bad} filter={bad} />);
    const words = spy.mock.calls.map((call) => String(call[0]));
    expect(words.filter((word) => word.includes('defaultFilter'))).toHaveLength(1);
    expect(words.filter((word) => word.includes(' filter is not an object'))).toHaveLength(1);
    // A filter that is no object is the empty one.
    rerender(
      <Orders gridRef={ref} defaultFilter={bad} filter={'minh' as unknown as DataGridFilter} />,
    );
    expect(dataRows()).toHaveLength(12);
  });

  it('warns for nothing when the filter is of its shape', () => {
    const spy = warn();
    render(
      <Orders defaultFilter={{ search: 'a', enabled: false, columns: { qty: { values: [1] } } }} />,
    );
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('clearFilter() and what a change of the filter brings along', () => {
  it('clears an uncontrolled filter: onFilterChange, then onStateChange with the shown state', () => {
    const calls: string[] = [];
    const onFilterChange = vi.fn(() => void calls.push('filter'));
    const onStateChange = vi.fn((_: DataGridState, changed: string) => void calls.push(changed));
    const ref = createRef<DataGridHandle>();
    render(
      <Orders
        gridRef={ref}
        defaultFilter={SOME}
        defaultSort={[{ field: 'qty', direction: 'desc' }]}
        onFilterChange={onFilterChange}
        onStateChange={onStateChange}
      />,
    );
    act(() => ref.current!.clearFilter());
    expect(calls).toEqual(['filter', 'filter']);
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({});
    const [state, changed] = onStateChange.mock.calls[0]!;
    expect(changed).toBe('filter');
    expect(state.filter).toEqual({});
    expect(state.sort).toEqual([{ field: 'qty', direction: 'desc' }]);
    expect(dataRows()).toHaveLength(12);
    expect(ref.current!.getState().filter).toEqual({});
  });

  it('does nothing when there is no filter, and goes back to the default of `enabled`', () => {
    const onFilterChange = vi.fn();
    const onStateChange = vi.fn();
    const ref = createRef<DataGridHandle>();
    render(
      <Orders
        gridRef={ref}
        onFilterChange={onFilterChange}
        onStateChange={onStateChange}
        defaultFilter={{ enabled: false }}
      />,
    );
    // A stale `enabled: false` would hide the next condition behind a switch nobody can see.
    act(() => ref.current!.clearFilter());
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({});
    act(() => ref.current!.clearFilter());
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledTimes(1);
  });

  it('tells a controlled parent, which keeps its own filter or takes the request', () => {
    const onFilterChange = vi.fn();
    const ref = createRef<DataGridHandle>();
    const { rerender } = render(
      <Orders gridRef={ref} filter={SOME} onFilterChange={onFilterChange} />,
    );
    act(() => ref.current!.clearFilter());
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({});
    // The parent keeps its filter: the grid goes on showing it.
    expect(dataRows()).toHaveLength(4);
    rerender(<Orders gridRef={ref} filter={{}} onFilterChange={onFilterChange} />);
    expect(dataRows()).toHaveLength(12);
  });

  it('goes to the first page when the page was not the first: two changes, each with its callbacks', () => {
    const calls: string[] = [];
    const onFilterChange = vi.fn(() => void calls.push('filter'));
    const onPageChange = vi.fn((page: DataGridPage) => void calls.push(`page:${page.index}`));
    const onStateChange = vi.fn((...args: [DataGridState, keyof DataGridState]) => {
      calls.push(`state:${args[1]}`);
    });
    const ref = createRef<DataGridHandle>();
    render(
      <Orders
        gridRef={ref}
        data={makeOrders(40)}
        paging={{ pageSize: 5, pageSizes: [5] }}
        defaultPage={{ index: 3, size: 5 }}
        defaultFilter={{ search: 'Customer' }}
        onFilterChange={onFilterChange}
        onPageChange={onPageChange}
        onStateChange={onStateChange}
      />,
    );
    expect(ref.current!.getState().page.index).toBe(3);
    act(() => ref.current!.clearFilter());
    expect(calls).toEqual(['filter', 'state:filter', 'page:0', 'state:page']);
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith({ index: 0, size: 5 });
    expect(ref.current!.getState().page.index).toBe(0);
  });

  it('asks for no page when the page is the first one, or there are no pages', () => {
    const onPageChange = vi.fn();
    const ref = createRef<DataGridHandle>();
    const { rerender } = render(
      <Orders
        gridRef={ref}
        data={makeOrders(40)}
        paging={{ pageSize: 5, pageSizes: [5] }}
        defaultFilter={{ search: 'Customer' }}
        onPageChange={onPageChange}
      />,
    );
    act(() => ref.current!.clearFilter());
    expect(onPageChange).not.toHaveBeenCalled();
    rerender(
      <Orders
        gridRef={ref}
        data={makeOrders(40)}
        paging={false}
        defaultPage={{ index: 3, size: 5 }}
        defaultFilter={{ search: 'Customer 1' }}
        onPageChange={onPageChange}
      />,
    );
    act(() => ref.current!.clearFilter());
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('gives a controlled parent both changes, the page after the filter', () => {
    const onFilterChange = vi.fn();
    const onPageChange = vi.fn();
    const ref = createRef<DataGridHandle>();
    render(
      <Orders
        gridRef={ref}
        data={makeOrders(40)}
        paging={{ pageSize: 5, pageSizes: [5] }}
        page={{ index: 2, size: 5 }}
        filter={{ search: 'Customer' }}
        onFilterChange={onFilterChange}
        onPageChange={onPageChange}
      />,
    );
    act(() => ref.current!.clearFilter());
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({});
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith({ index: 0, size: 5 });
    expect(onFilterChange.mock.invocationCallOrder[0]).toBeLessThan(
      onPageChange.mock.invocationCallOrder[0]!,
    );
  });

  describe.each([
    ['an uncontrolled page', { defaultPage: { index: 3, size: 5 } }],
    ['a controlled page', { page: { index: 2, size: 5 } }],
  ] as const)('with a controlled filter and %s', (_, pageProps) => {
    it('sends the page reset with the filter that was asked, not the one the parent holds', () => {
      const onStateChange = vi.fn<(state: DataGridState, changed: keyof DataGridState) => void>();
      const ref = createRef<DataGridHandle>();
      render(
        <Orders
          gridRef={ref}
          data={makeOrders(40)}
          paging={{ pageSize: 5, pageSizes: [5] }}
          filter={{ search: 'Customer' }}
          onFilterChange={() => {}}
          onPageChange={() => {}}
          onStateChange={onStateChange}
          {...pageProps}
        />,
      );
      act(() => ref.current!.clearFilter());
      const calls = onStateChange.mock.calls.map(([state, part]) => [part, state.filter]);
      expect(calls).toEqual([
        ['filter', {}],
        ['page', {}],
      ]);
    });
  });

  it('asks a controlled page once for two filter changes of one event', () => {
    const onPageChange = vi.fn();
    const ref = createRef<DataGridHandle>();
    render(
      <Orders
        gridRef={ref}
        data={makeOrders(40)}
        paging={{ pageSize: 5, pageSizes: [5] }}
        page={{ index: 2, size: 5 }}
        filter={{ search: 'Customer' }}
        onFilterChange={() => {}}
        onPageChange={onPageChange}
      />,
    );
    act(() => {
      ref.current!.clearFilter();
      ref.current!.clearFilter();
    });
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith({ index: 0, size: 5 });
  });

  it('filters nothing in server mode: the rows are the page, and the app learns of the filter by the callback', () => {
    const onFilterChange = vi.fn();
    const ref = createRef<DataGridHandle>();
    render(
      <Orders
        gridRef={ref}
        remote
        totalCount={40}
        defaultFilter={{ search: 'nobody', columns: { qty: { operator: '>', value: 100 } } }}
        onFilterChange={onFilterChange}
      />,
    );
    expect(dataRows()).toHaveLength(12);
    act(() => ref.current!.clearFilter());
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({});
    expect(dataRows()).toHaveLength(12);
  });
});

describe('the rows found', () => {
  it('says nothing on mount', () => {
    vi.useFakeTimers();
    render(<Orders defaultFilter={SOME} />);
    advance(2000);
    expect(live()).toBe('');
  });

  it('says how many rows the filter keeps once, 500 ms after the change', () => {
    vi.useFakeTimers();
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} defaultFilter={SOME} />);
    act(() => ref.current!.clearFilter());
    advance(FILTER_ANNOUNCE_DELAY - 1);
    expect(live()).toBe('');
    advance(1);
    expect(live()).toBe('12 rows');
  });

  it('counts the rows of every page and not the page', () => {
    vi.useFakeTimers();
    const ref = createRef<DataGridHandle>();
    render(
      <Orders
        gridRef={ref}
        data={makeOrders(40)}
        paging={{ pageSize: 5, pageSizes: [5] }}
        defaultFilter={{ search: 'Customer 1' }}
      />,
    );
    act(() => ref.current!.clearFilter());
    advance(FILTER_ANNOUNCE_DELAY);
    expect(live()).toBe('40 rows');
  });

  it('says it once, 500 ms after the last of three changes made 100 ms apart', () => {
    vi.useFakeTimers();
    const ref = createRef<DataGridHandle>();
    let outside: (filter: DataGridFilter) => void = () => {};
    function Parent() {
      const [filter, setFilter] = useState<DataGridFilter>(SOME);
      outside = setFilter;
      return <Orders gridRef={ref} filter={filter} onFilterChange={setFilter} />;
    }
    render(<Parent />);
    for (let change = 0; change < 3; change++) {
      act(() => ref.current!.clearFilter());
      advance(100);
      // A change from outside is no change of the user's: it makes the next clear possible, and says nothing.
      act(() => outside(SOME));
      advance(100);
    }
    expect(live()).toBe('');
    advance(FILTER_ANNOUNCE_DELAY);
    // The count is the one of the filter the last clear showed, as it was shown.
    expect(live()).toBe('12 rows');
  });

  it('says "No rows", "1 row" and "n rows" by default', () => {
    const say = DEFAULT_LABELS.announceRowsFound;
    expect([say(0), say(1), say(2), say(1000)]).toEqual([
      'No rows',
      '1 row',
      '2 rows',
      '1000 rows',
    ]);
  });

  it('says nothing for a parent that keeps its own filter, and nothing for a later change from outside', () => {
    vi.useFakeTimers();
    const ref = createRef<DataGridHandle>();
    const { rerender } = render(<Orders gridRef={ref} filter={SOME} onFilterChange={() => {}} />);
    act(() => ref.current!.clearFilter());
    advance(2000);
    expect(live()).toBe('');
    // The parent now shows what was asked, long after: not a change of the user's, so not said.
    rerender(<Orders gridRef={ref} filter={{}} onFilterChange={() => {}} />);
    advance(2000);
    expect(live()).toBe('');
  });

  it('uses the words of labels.announceRowsFound', () => {
    vi.useFakeTimers();
    const ref = createRef<DataGridHandle>();
    render(
      <Orders
        gridRef={ref}
        defaultFilter={SOME}
        labels={{ announceRowsFound: (count) => `${count} found` }}
      />,
    );
    act(() => ref.current!.clearFilter());
    advance(FILTER_ANNOUNCE_DELAY);
    expect(live()).toBe('12 found');
  });

  it('is said in server mode when the rows the filter asked for have come, once for the change', () => {
    vi.useFakeTimers();
    const ref = createRef<DataGridHandle>();
    const first = makeOrders(5);
    const next = makeOrders(8);
    const props = { gridRef: ref, remote: true, totalCount: 40, defaultFilter: SOME } as const;
    const { rerender } = render(<Orders {...props} data={first} />);
    act(() => ref.current!.clearFilter());
    // Nothing yet: the rows are the old ones, and the grid is loading them.
    advance(2000);
    expect(live()).toBe('');
    rerender(<Orders {...props} data={first} loading totalCount={40} />);
    rerender(<Orders {...props} data={next} loading totalCount={40} />);
    // Short of the second the grid waits to say it loads.
    advance(900);
    expect(live()).toBe('');
    rerender(<Orders {...props} data={next} totalCount={33} />);
    advance(FILTER_ANNOUNCE_DELAY - 1);
    expect(live()).toBe('');
    advance(1);
    expect(live()).toBe('33 rows');
    // Once: another array of rows (a sort, a page) says nothing more.
    rerender(<Orders {...props} data={first} totalCount={33} />);
    advance(2000);
    expect(live()).toBe('33 rows');
  });
});

describe('the grid that is empty because of its filter', () => {
  it('says what the filter did, and holds the button that clears it', () => {
    render(<Orders defaultFilter={NONE} />);
    const row = grid().querySelector('tbody > tr.flg-data-grid-empty')!;
    expect(row.textContent).toBe('No rows match the filterClear filter');
    expect(row.querySelector('.flg-data-grid-empty-title')!.textContent).toBe(
      'No rows match the filter',
    );
    expect(row.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    const button = clearButton();
    expect(button.closest('td')).toHaveAttribute('data-home', 'control');
    expect(button.closest('td')).toHaveAttribute('colspan');
  });

  it('is "No data" with no button when the grid has no data and no filter', () => {
    render(<Orders data={[]} />);
    const row = grid().querySelector('tbody > tr.flg-data-grid-empty')!;
    expect(row.textContent).toBe('No data');
    expect(screen.queryByRole('button', { name: 'Clear filter' })).toBeNull();
    expect(row.querySelector('td')).not.toHaveAttribute('data-home');
    expect(row.querySelector('.flg-data-grid-empty-content')).not.toHaveAttribute('data-filtered');
    expect(row.querySelector('td')!.innerHTML).toBe(
      '<div class="flg-data-grid-empty-content">No data</div>',
    );
  });

  it('is "No data" when the data is empty and a condition of a column the grid has not filters nothing', () => {
    render(
      <Orders data={[]} defaultFilter={{ columns: { nobody: { operator: '=', value: 1 } } }} />,
    );
    expect(grid().querySelector('tbody > tr.flg-data-grid-empty')!.textContent).toBe('No data');
  });

  it('is "No data" when the conditions are put aside with enabled: false', () => {
    render(
      <Orders
        data={[]}
        defaultFilter={{ enabled: false, columns: { qty: { operator: '>', value: 1 } } }}
      />,
    );
    expect(grid().querySelector('tbody > tr.flg-data-grid-empty')!.textContent).toBe('No data');
  });

  it('is filtered by a search alone, and by one condition alone', () => {
    const { rerender } = render(<Orders defaultFilter={{ search: 'zzz' }} />);
    expect(screen.getByRole('button', { name: 'Clear filter' })).toBeInTheDocument();
    rerender(<Orders defaultFilter={{ search: 'zzz' }} />);
    expect(clearButton()).toBeInTheDocument();
  });

  it('is filtered by a condition alone', () => {
    render(<Orders defaultFilter={{ columns: { qty: { operator: '>', value: 500 } } }} />);
    expect(clearButton()).toBeInTheDocument();
  });

  it('uses the words of the labels', () => {
    render(
      <Orders
        defaultFilter={NONE}
        labels={{ noMatches: 'Nothing found', clearFilter: 'Show all' }}
      />,
    );
    expect(grid().textContent).toContain('Nothing found');
    expect(screen.getByRole('button', { name: 'Show all' })).toBeInTheDocument();
  });

  it('is cleared by the button: the rows come back and the callbacks are called as for any change', () => {
    const onFilterChange = vi.fn();
    render(<Orders defaultFilter={NONE} onFilterChange={onFilterChange} />);
    act(() => clearButton().click());
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({});
    expect(dataRows()).toHaveLength(12);
    expect(screen.queryByRole('button', { name: 'Clear filter' })).toBeNull();
  });

  it('draws skeleton rows and no button while the grid loads', () => {
    render(<Orders defaultFilter={NONE} loading />);
    expect(screen.queryByRole('button', { name: 'Clear filter' })).toBeNull();
    expect(grid().querySelector('.flg-data-grid-skeleton-row')).not.toBeNull();
  });
});

describe('the keyboard in the grid that is empty because of its filter', () => {
  it('has one Tab stop, which is the button: the one place of the body', () => {
    render(<Orders defaultFilter={NONE} />);
    expect(stops()).toEqual([clearButton()]);
    // The titles are no stop, the cell of the button is not either.
    expect(head('Order')).toHaveAttribute('tabindex', '-1');
    expect(clearButton().closest('td')).toHaveAttribute('tabindex', '-1');
  });

  it('keeps the button the stop of its cell in a grid whose cells hold controls, which the grid releases', () => {
    const withCells: DataGridColumn<Order>[] = [
      ...COLUMNS.slice(0, 1),
      {
        field: 'customer',
        caption: 'Customer',
        cell: ({ text }) => <a href={`#${text}`}>{text}</a>,
      },
    ];
    render(<Orders columns={withCells} defaultFilter={NONE} />);
    expect(stops()).toEqual([clearButton()]);
    expect(clearButton()).toHaveAttribute('tabindex', '0');
  });

  it('is reached by ↓ from a title, which keeps the column, and leaves by ↑ for the title of that column', () => {
    render(<Orders defaultFilter={NONE} />);
    const title = head('Customer');
    act(() => title.focus());
    // The place starts at the body, so the title is made the place by the focus.
    expect(stops()).toEqual([title]);
    expect(press(title, 'ArrowDown')).toBe(true);
    expect(document.activeElement).toBe(clearButton());
    expect(stops()).toEqual([clearButton()]);
    expect(press(clearButton(), 'ArrowUp')).toBe(true);
    expect(document.activeElement).toBe(title);
    expect(stops()).toEqual([title]);
  });

  it('moves nowhere by ← → Home End and ↓, which the one cell has no neighbour for, and cancels them', () => {
    render(<Orders defaultFilter={NONE} />);
    const button = clearButton();
    act(() => button.focus());
    for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'Home', 'End', 'PageDown']) {
      expect(press(button, key), key).toBe(true);
      expect(document.activeElement, key).toBe(button);
    }
    expect(stops()).toEqual([button]);
  });

  it('is pressed by Enter, and the place is then the first cell of the first row, with the focus', () => {
    const onFilterChange = vi.fn();
    render(<Orders defaultFilter={NONE} onFilterChange={onFilterChange} />);
    const button = clearButton();
    act(() => button.focus());
    expect(press(button, 'Enter')).toBe(true);
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({});
    const first = bodyRows()[0]!.children[0] as HTMLElement;
    expect(document.activeElement).toBe(first);
    expect(stops()).toEqual([first]);
  });

  it('starts at the first cell of the first row when the rows are back, from the button reached from another column', () => {
    render(<Orders defaultFilter={NONE} />);
    const title = head('Qty');
    act(() => title.focus());
    press(title, 'ArrowDown');
    expect(document.activeElement).toBe(clearButton());
    press(clearButton(), 'Enter');
    const first = bodyRows()[0]!.children[0] as HTMLElement;
    expect(document.activeElement).toBe(first);
    expect(stops()).toEqual([first]);
  });

  it('keeps Space for the button, which presses it as it does anywhere', () => {
    render(<Orders defaultFilter={NONE} />);
    const button = clearButton();
    act(() => button.focus());
    // The grid leaves Space to the button: nothing cancels it.
    expect(press(button, ' ')).toBe(false);
  });

  it('makes the empty cell the place when it is pressed', () => {
    render(<Orders defaultFilter={NONE} />);
    const title = head('Qty');
    act(() => title.focus());
    expect(stops()).toEqual([title]);
    const cell = clearButton().closest('td')!;
    act(() => {
      fireEvent.mouseDown(cell);
    });
    expect(stops()).toEqual([clearButton()]);
    expect(document.activeElement).toBe(clearButton());
  });

  it('gives the focus to the first title when a grid with no data is told by a clear that there is none', () => {
    // The filter keeps no row and so does the data: the button clears the filter, and the grid is then
    // empty with no filter, which has no button and a title for its place.
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} data={[]} defaultFilter={NONE} />);
    const button = clearButton();
    act(() => button.focus());
    act(() => button.click());
    expect(screen.queryByRole('button', { name: 'Clear filter' })).toBeNull();
    expect(stops()).toEqual([head('Order')]);
    expect(document.activeElement).toBe(head('Order'));
  });

  it('has no place of the body in a grid with no data, whose place is the first title', () => {
    render(<Orders data={[]} />);
    expect(stops()).toEqual([head('Order')]);
    const title = head('Order');
    act(() => title.focus());
    expect(press(title, 'ArrowDown')).toBe(true);
    expect(document.activeElement).toBe(title);
  });

  it('takes the place back to the row it was on when the filter keeps rows again', () => {
    const { rerender } = render(<Orders filter={SOME} onFilterChange={() => {}} />);
    const first = bodyRows()[0]!.children[0] as HTMLElement;
    act(() => first.focus());
    rerender(<Orders filter={NONE} onFilterChange={() => {}} />);
    // The row the focus was on is gone with the filter: the one place is the button, and the focus follows.
    expect(stops()).toEqual([clearButton()]);
    expect(document.activeElement).toBe(clearButton());
    rerender(<Orders filter={SOME} onFilterChange={() => {}} />);
    expect(stops()).toEqual([bodyRows()[0]!.children[0]]);
  });
});
