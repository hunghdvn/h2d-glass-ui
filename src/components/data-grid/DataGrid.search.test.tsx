import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import type { Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type {
  DataGridColumn,
  DataGridFilter,
  DataGridHandle,
  DataGridProps,
  DataGridState,
} from './index';
import { FILTER_ANNOUNCE_DELAY } from './hooks/use-rows-found';
import { SEARCH_DELAY } from './parts/SearchBox';

// The search field and the marks of a search (spec phase 6 §3.5 step 3, §3.6, §4.3 F1, §6.3 "Ô tìm
// kiếm"): the field in the toolbar, how it applies what is typed, and the `mark` around each match in the
// cells the grid draws.

beforeEach(() => {
  resetDevWarnings();
  HTMLElement.prototype.checkVisibility = () => true;
  // jsdom has no Popover API (the column chooser).
  HTMLElement.prototype.showPopover = () => {};
  HTMLElement.prototype.hidePopover = () => {};
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
  Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
  vi.useRealTimers();
  vi.restoreAllMocks();
});

interface Order {
  id: string;
  customer: string;
  note: string;
  qty: number;
  paid: boolean;
}

const ORDERS: Order[] = [
  { id: 'DH-1', customer: 'Minh Minh', note: 'Minh', qty: 3, paid: true },
  { id: 'DH-2', customer: 'Nguyễn Minh Anh', note: 'none', qty: 12, paid: false },
  { id: 'DH-3', customer: 'Lê Quang Huy', note: 'none', qty: 21, paid: true },
  { id: 'DH-4', customer: 'Đường Sắt', note: 'none', qty: 4, paid: false },
  { id: 'DH-5', customer: 'Đường Sắt'.normalize('NFD'), note: 'none', qty: 5, paid: false },
];

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

/** A grid whose parent holds the filter, as the parent of a controlled grid does. */
function Held({
  onChange,
  start = {},
  ...props
}: Partial<DataGridProps<Order>> & {
  onChange?: (filter: DataGridFilter) => void;
  start?: DataGridFilter;
}) {
  const [filter, setFilter] = useState(start);
  return (
    <>
      <button type="button" onClick={() => setFilter({ search: 'outside' })}>
        set outside
      </button>
      <Orders
        filter={filter}
        onFilterChange={(next) => {
          onChange?.(next);
          setFilter(next);
        }}
        {...props}
      />
    </>
  );
}

const grid = () => screen.getByRole('grid') as HTMLTableElement;
const dataRows = () => grid().querySelectorAll('tbody > tr.flg-data-grid-row');
const field = () => screen.getByRole('searchbox', { name: 'Search' }) as HTMLInputElement;
const toolbar = () => document.querySelector<HTMLElement>('.flg-data-grid-toolbar');
const live = () => document.querySelector('[aria-live]')!.textContent;
const type = (text: string) => fireEvent.change(field(), { target: { value: text } });
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const marks = () => Array.from(grid().querySelectorAll('mark'), (mark) => mark.textContent);
const marksIn = (row: number) =>
  Array.from(dataRows()[row]!.querySelectorAll('mark'), (mark) => mark.textContent);

describe('the search field', () => {
  it('is not drawn without searchPanel, and a toolbar function gets null for it', () => {
    const search = vi.fn();
    render(
      <Orders
        toolbar={(items) => {
          search(items.search);
          return items.spacer;
        }}
      />,
    );
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(search).toHaveBeenCalledWith(null);
  });

  it('is drawn after the caption, before the chooser, with the spacer first', () => {
    render(<Orders searchPanel columnChooser />);
    // The popover of the chooser is in the top layer, not a part of the row.
    const children = Array.from(toolbar()!.children).filter(
      (child) => !child.hasAttribute('popover'),
    );
    expect(children.map((child) => child.className.split(' ')[0])).toEqual([
      'flg-card-header',
      'flg-data-grid-toolbar-spacer',
      'flg-search-field',
      'flg-button',
    ]);
    expect(children[2]).toHaveClass('flg-data-grid-search');
  });

  it('is a search field of size md named "Search", with the placeholder "Search…"', () => {
    render(<Orders searchPanel />);
    expect(field()).toHaveAttribute('placeholder', 'Search…');
    expect(field().closest('.flg-input')).toHaveAttribute('data-size', 'md');
    expect(field()).toHaveValue('');
  });

  it('takes the placeholder of searchPanel over the label, and the words from labels', () => {
    const { rerender } = render(<Orders searchPanel={{ placeholder: 'Find an order' }} />);
    expect(field()).toHaveAttribute('placeholder', 'Find an order');
    rerender(
      <Orders
        searchPanel={{}}
        labels={{ search: 'Look up', searchPlaceholder: 'Look up an order…' }}
      />,
    );
    expect(screen.getByRole('searchbox', { name: 'Look up' })).toHaveAttribute(
      'placeholder',
      'Look up an order…',
    );
  });

  it('is on for `true` and for an object, and off for anything else', () => {
    const { rerender } = render(<Orders searchPanel={{}} />);
    expect(screen.queryByRole('searchbox')).not.toBeNull();
    for (const value of [false, undefined, 0, 'yes', null, []]) {
      rerender(<Orders searchPanel={value as never} />);
      expect(screen.queryByRole('searchbox'), String(value)).toBeNull();
    }
    rerender(<Orders searchPanel />);
    expect(screen.queryByRole('searchbox')).not.toBeNull();
  });

  it('is drawn in a toolbar of its own when the grid has no caption', () => {
    render(<Orders searchPanel caption={undefined} aria-label="Orders" />);
    expect(toolbar()).not.toBeNull();
    expect(toolbar()!.querySelector('.flg-data-grid-caption')).toBeNull();
    expect(screen.queryByRole('searchbox')).not.toBeNull();
  });

  it('is placed where a toolbar function puts it, and `toolbar={false}` takes it away', () => {
    const { rerender } = render(
      <Orders
        searchPanel
        columnChooser
        toolbar={(items) => (
          <>
            {items.search}
            {items.spacer}
            {items.columnChooser}
          </>
        )}
      />,
    );
    expect(toolbar()!.children[1]).toHaveClass('flg-search-field');
    rerender(<Orders searchPanel toolbar={false} />);
    expect(screen.queryByRole('searchbox')).toBeNull();
    rerender(<Orders searchPanel toolbar={(items) => items.spacer} />);
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  it('shows the search the grid holds, at first and in a controlled grid', () => {
    render(<Orders searchPanel defaultFilter={{ search: 'minh' }} />);
    expect(field()).toHaveValue('minh');
    expect(dataRows()).toHaveLength(2);
  });
});

describe('typing in the search field', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('applies the search once, SEARCH_DELAY after the last of three keystrokes, and not before', () => {
    expect(SEARCH_DELAY).toBe(300);
    const onFilterChange = vi.fn();
    const onStateChange = vi.fn();
    render(<Orders searchPanel onFilterChange={onFilterChange} onStateChange={onStateChange} />);
    type('m');
    advance(200);
    type('mi');
    advance(200);
    type('min');
    advance(SEARCH_DELAY - 1);
    expect(onFilterChange).not.toHaveBeenCalled();
    expect(dataRows()).toHaveLength(ORDERS.length);
    advance(1);
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith({ search: 'min' });
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange.mock.calls[0]![1]).toBe('filter');
    expect(dataRows()).toHaveLength(2);
    // Nothing is pending afterwards.
    advance(5000);
    expect(onFilterChange).toHaveBeenCalledTimes(1);
  });

  it('keeps the conditions of the filter, and the text as the user typed it, spaces and all', () => {
    const onFilterChange = vi.fn();
    const columns = { qty: { operator: '>' as const, value: 3 } };
    render(<Orders searchPanel defaultFilter={{ columns }} onFilterChange={onFilterChange} />);
    type('  minh ');
    advance(SEARCH_DELAY);
    expect(onFilterChange).toHaveBeenCalledWith({ search: '  minh ', columns });
    expect(field()).toHaveValue('  minh ');
    // The engine trims it: Minh Minh (qty 3) is out by the condition, Nguyễn Minh Anh stays.
    expect(dataRows()).toHaveLength(1);
  });

  it('applies a pending text at once for Enter, and the timer does not apply it again', () => {
    const onFilterChange = vi.fn();
    render(<Orders searchPanel onFilterChange={onFilterChange} />);
    type('minh');
    fireEvent.keyDown(field(), { key: 'Enter' });
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith({ search: 'minh' });
    advance(5000);
    expect(onFilterChange).toHaveBeenCalledTimes(1);
  });

  it('does not let the Enter that applies the search submit a form around the grid', async () => {
    // The keys are typed by a user that waits on real timers, and Enter applies at once.
    vi.useRealTimers();
    const onSubmit = vi.fn((event: { preventDefault(): void }) => event.preventDefault());
    const onFilterChange = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <Orders searchPanel onFilterChange={onFilterChange} />
        <button type="submit">Send</button>
      </form>,
    );
    await userEvent.setup().type(field(), 'minh{Enter}');
    expect(onFilterChange).toHaveBeenCalledWith({ search: 'minh' });
    expect(onSubmit).not.toHaveBeenCalled();
    // The Enter of an input method that confirms a candidate is the method's.
    expect(fireEvent.keyDown(field(), { key: 'Enter', isComposing: true })).toBe(true);
    expect(fireEvent.keyDown(field(), { key: 'Enter' })).toBe(false);
  });

  it('leaves Enter to the input method while a composition is going on', () => {
    const onFilterChange = vi.fn();
    render(<Orders searchPanel onFilterChange={onFilterChange} />);
    type('minh');
    fireEvent.keyDown(field(), { key: 'Enter', isComposing: true });
    fireEvent.keyDown(field(), { key: 'Enter', keyCode: 229 });
    expect(onFilterChange).not.toHaveBeenCalled();
    advance(SEARCH_DELAY);
    expect(onFilterChange).toHaveBeenCalledTimes(1);
  });

  it('clears the search at once for Esc, with the text', () => {
    const onFilterChange = vi.fn();
    render(
      <Orders searchPanel defaultFilter={{ search: 'minh' }} onFilterChange={onFilterChange} />,
    );
    field().focus();
    fireEvent.keyDown(field(), { key: 'Escape' });
    expect(field()).toHaveValue('');
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith({});
    expect(dataRows()).toHaveLength(ORDERS.length);
  });

  it('clears the search at once for the clear button, and gives the focus back to the field', () => {
    const onFilterChange = vi.fn();
    render(
      <Orders searchPanel defaultFilter={{ search: 'minh' }} onFilterChange={onFilterChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(field()).toHaveValue('');
    expect(field()).toHaveFocus();
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith({});
  });

  it('applies a pending text at once when the field is left, and nothing when none is pending', () => {
    const onFilterChange = vi.fn();
    render(<Orders searchPanel onFilterChange={onFilterChange} />);
    field().focus();
    fireEvent.blur(field());
    expect(onFilterChange).not.toHaveBeenCalled();
    type('minh');
    fireEvent.blur(field());
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith({ search: 'minh' });
    advance(5000);
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    fireEvent.blur(field());
    expect(onFilterChange).toHaveBeenCalledTimes(1);
  });

  it('calls nothing for a text that is typed and put back before the delay', () => {
    const onFilterChange = vi.fn();
    render(<Orders searchPanel onFilterChange={onFilterChange} />);
    type('m');
    advance(100);
    type('');
    advance(5000);
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it('says the rows found once, after the last of the changes', () => {
    render(<Orders searchPanel />);
    type('m');
    advance(SEARCH_DELAY);
    type('mi');
    advance(SEARCH_DELAY);
    type('minh');
    advance(SEARCH_DELAY);
    expect(live()).toBe('');
    advance(FILTER_ANNOUNCE_DELAY);
    expect(live()).toBe('2 rows');
  });

  it('says the data rows found for a grouped grid, not the group rows', () => {
    // Review comment 4662947043 on PR #45: the pager counts the group rows too, and the sentence said 7.
    const rows = [
      { id: 'G-1', customer: 'ab one', note: 'x', qty: 1, paid: true },
      { id: 'G-2', customer: 'ab two', note: 'x', qty: 1, paid: true },
      { id: 'G-3', customer: 'ab three', note: 'x', qty: 1, paid: true },
      { id: 'G-4', customer: 'ab four', note: 'y', qty: 1, paid: true },
      { id: 'G-5', customer: 'ab five', note: 'y', qty: 1, paid: true },
      { id: 'G-6', customer: 'other', note: 'z', qty: 1, paid: true },
    ];
    for (const open of [true, false]) {
      const { unmount } = render(
        <Orders
          data={rows}
          columns={[...COLUMNS, { field: 'note', caption: 'Note', width: 80 }]}
          searchPanel
          defaultGrouping={[{ field: 'note', direction: 'asc' }]}
          autoExpandAll={open}
        />,
      );
      type('ab');
      advance(SEARCH_DELAY);
      advance(FILTER_ANNOUNCE_DELAY);
      expect(live(), `autoExpandAll ${open}`).toBe('5 rows');
      unmount();
    }
  });

  it('keeps the page and says nothing for a change of the spaces around the search', () => {
    const rows = [1, 2, 3, 4, 5, 6].map((n) => ({
      ...ORDERS[0]!,
      id: `X-${n}`,
      customer: `abc d${n}`,
    }));
    const onFilterChange = vi.fn();
    const onPageChange = vi.fn();
    render(
      <Orders
        data={rows}
        paging={{ pageSize: 2 }}
        defaultPage={{ index: 2, size: 2 }}
        searchPanel
        defaultFilter={{ search: 'abc' }}
        onFilterChange={onFilterChange}
        onPageChange={onPageChange}
      />,
    );
    type('abc ');
    advance(SEARCH_DELAY);
    advance(FILTER_ANNOUNCE_DELAY);
    // The change is stored and reported as typed, but it keeps the same rows.
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({ search: 'abc ' });
    expect(onPageChange).not.toHaveBeenCalled();
    expect(grid().querySelector('tbody > tr.flg-data-grid-row')!.textContent).toContain('abc d5');
    expect(live()).toBe('');
    // A change of what is looked for goes to the first page and says the count.
    type('abc d');
    advance(SEARCH_DELAY);
    advance(FILTER_ANNOUNCE_DELAY);
    expect(onFilterChange).toHaveBeenLastCalledWith({ search: 'abc d' });
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith({ index: 0, size: 2 });
    expect(live()).toBe('6 rows');
  });

  it('replaces the text, and drops what was pending, when the search changes from outside', () => {
    const onChange = vi.fn();
    render(<Held searchPanel onChange={onChange} />);
    type('typed and not applied');
    fireEvent.click(screen.getByRole('button', { name: 'set outside' }));
    expect(field()).toHaveValue('outside');
    advance(5000);
    expect(onChange).not.toHaveBeenCalled();
    expect(field()).toHaveValue('outside');
  });

  it('replaces the text for clearFilter() and drops what was pending', () => {
    const onFilterChange = vi.fn();
    const gridRef = createRef<DataGridHandle>();
    render(
      <Orders
        searchPanel
        gridRef={gridRef}
        defaultFilter={{ search: 'minh' }}
        onFilterChange={onFilterChange}
      />,
    );
    type('minhx');
    act(() => gridRef.current!.clearFilter());
    expect(field()).toHaveValue('');
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    advance(5000);
    expect(onFilterChange).toHaveBeenCalledTimes(1);
  });

  it('keeps what the user typed when a parent keeps its own filter', () => {
    const onFilterChange = vi.fn();
    render(<Orders searchPanel filter={{}} onFilterChange={onFilterChange} />);
    type('minh');
    advance(SEARCH_DELAY);
    expect(onFilterChange).toHaveBeenCalledWith({ search: 'minh' });
    expect(field()).toHaveValue('minh');
    expect(dataRows()).toHaveLength(ORDERS.length);
  });

  it('does not snap back to a search a controlled parent held, once it has taken the new one', () => {
    render(<Held searchPanel />);
    type('minh');
    advance(SEARCH_DELAY);
    type('minh a');
    expect(field()).toHaveValue('minh a');
    advance(SEARCH_DELAY);
    expect(field()).toHaveValue('minh a');
    expect(dataRows()).toHaveLength(1);
  });

  it('drops the timer with the grid', () => {
    const onFilterChange = vi.fn();
    const { unmount } = render(<Orders searchPanel onFilterChange={onFilterChange} />);
    type('minh');
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    advance(5000);
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it('sends the state as it is shown with the search on top', () => {
    const states: DataGridState[] = [];
    render(<Orders searchPanel onStateChange={(state) => states.push(state)} />);
    type('minh');
    advance(SEARCH_DELAY);
    expect(states).toHaveLength(1);
    expect(states[0]!.filter).toEqual({ search: 'minh' });
  });
});

describe('the marks of a search', () => {
  it('marks every match of "minh" in the text of a cell, in the letters it has', () => {
    render(<Orders defaultFilter={{ search: 'minh' }} />);
    expect(dataRows()).toHaveLength(2);
    expect(marksIn(0)).toEqual(['Minh', 'Minh']);
    expect(marksIn(1)).toEqual(['Minh']);
    expect(dataRows()[1]!.textContent).toContain('Nguyễn Minh Anh');
  });

  it('draws the mark with its class, inside the cell', () => {
    render(<Orders defaultFilter={{ search: 'minh' }} />);
    const mark = grid().querySelector('mark')!;
    expect(mark).toHaveClass('flg-data-grid-match');
    expect(mark.closest('.flg-data-grid-cell')).not.toBeNull();
  });

  it('marks "duong" in "Đường", whether the data has its marks together or apart', () => {
    render(<Orders defaultFilter={{ search: 'duong' }} />);
    expect(dataRows()).toHaveLength(2);
    expect(marksIn(0)).toEqual(['Đường']);
    expect(marksIn(1)).toEqual(['Đường'.normalize('NFD')]);
  });

  it('is case-insensitive and ignores the spaces around the search', () => {
    render(<Orders defaultFilter={{ search: '  MINH  ' }} />);
    expect(marksIn(0)).toEqual(['Minh', 'Minh']);
  });

  it('marks numbers by the text they are shown as', () => {
    render(<Orders defaultFilter={{ search: '12' }} />);
    expect(dataRows()).toHaveLength(1);
    expect(marksIn(0)).toEqual(['12']);
  });

  it('marks nothing for a search of spaces, and takes the marks away when the search goes', () => {
    const { rerender } = render(<Orders filter={{ search: '   ' }} onFilterChange={() => {}} />);
    expect(marks()).toEqual([]);
    rerender(<Orders filter={{ search: 'minh' }} onFilterChange={() => {}} />);
    expect(marks().length).toBeGreaterThan(0);
    rerender(<Orders filter={{}} onFilterChange={() => {}} />);
    expect(marks()).toEqual([]);
    expect(dataRows()).toHaveLength(ORDERS.length);
  });

  it('gives a custom cell the same marks through ctx.highlight', () => {
    const columns: DataGridColumn<Order>[] = [
      ...COLUMNS.slice(0, 1),
      {
        field: 'customer',
        caption: 'Customer',
        cell: ({ text, highlight }) => <b data-custom>{highlight(text)}</b>,
      },
    ];
    render(<Orders columns={columns} defaultFilter={{ search: 'minh' }} />);
    const mark = dataRows()[1]!.querySelector('b[data-custom] mark')!;
    expect(mark.textContent).toBe('Minh');
    expect(dataRows()[1]!.querySelector('b[data-custom]')!.textContent).toBe('Nguyễn Minh Anh');
  });

  it('gives a custom cell the text as it is when there is no search', () => {
    const seen: unknown[] = [];
    const columns: DataGridColumn<Order>[] = [
      {
        field: 'customer',
        caption: 'Customer',
        cell: ({ text, highlight }) => {
          seen.push(highlight(text));
          return text;
        },
      },
    ];
    render(<Orders columns={columns} />);
    expect(seen).toContain('Minh Minh');
  });

  it('marks nothing in a column with allowSearch false, whose text no search reads', () => {
    const columns: DataGridColumn<Order>[] = [
      ...COLUMNS,
      { id: 'note', field: 'note', caption: 'Note', allowSearch: false },
      {
        id: 'again',
        field: 'note',
        caption: 'Again',
        allowSearch: false,
        cell: ({ text, highlight }) => <i data-note>{highlight(text)}</i>,
      },
    ];
    render(<Orders columns={columns} defaultFilter={{ search: 'minh' }} />);
    // The note "Minh" of the first row is in a column nobody searches: the rows are the two of the
    // customer, and in the first of them the note is not marked, whichever way it is drawn.
    expect(dataRows()).toHaveLength(2);
    const first = dataRows()[0]!;
    expect(first.textContent).toContain('Minh');
    expect(Array.from(first.querySelectorAll('mark'), (mark) => mark.textContent)).toEqual([
      'Minh',
      'Minh',
    ]);
    expect(first.querySelector('i[data-note] > mark')).toBeNull();
  });

  it('marks nothing in a column that is hidden', () => {
    const columns: DataGridColumn<Order>[] = [
      ...COLUMNS,
      { id: 'note', field: 'note', caption: 'Note', visible: false },
    ];
    render(<Orders columns={columns} defaultFilter={{ search: 'minh' }} />);
    // The hidden column is not searched either: only the rows of the customer.
    expect(dataRows()).toHaveLength(2);
    expect(marksIn(0)).toEqual(['Minh', 'Minh']);
    expect(grid().textContent).not.toContain('none');
  });

  it('marks nothing of the words hidden in the check of a boolean', () => {
    const plain: DataGridColumn<Order>[] = [
      ...COLUMNS,
      { field: 'paid', caption: 'Paid', dataType: 'boolean' },
    ];
    render(<Orders columns={plain} defaultFilter={{ search: 'yes' }} />);
    expect(dataRows()).toHaveLength(2);
    expect(grid().querySelectorAll('.flg-visually-hidden')).toHaveLength(2);
    expect(grid().querySelector('.flg-visually-hidden mark')).toBeNull();
    expect(marks()).toEqual([]);
  });

  it('marks the words of a boolean that a format writes', () => {
    const worded: DataGridColumn<Order>[] = [
      ...COLUMNS,
      {
        field: 'paid',
        caption: 'Paid',
        dataType: 'boolean',
        format: (value) => (value ? 'Paid in full' : 'Open'),
      },
    ];
    render(<Orders columns={worded} defaultFilter={{ search: 'paid' }} />);
    expect(marks()).toEqual(['Paid', 'Paid']);
  });

  it('marks the rows the server sent without filtering them', () => {
    render(
      <Orders
        remote
        totalCount={40}
        paging={false}
        filter={{ search: 'minh' }}
        onFilterChange={() => {}}
      />,
    );
    expect(dataRows()).toHaveLength(ORDERS.length);
    expect(marksIn(0)).toEqual(['Minh', 'Minh']);
    expect(marksIn(2)).toEqual([]);
  });

  it('marks the rows of the page it shows', () => {
    render(<Orders paging={{ pageSize: 2 }} defaultFilter={{ search: 'e' }} />);
    expect(dataRows()).toHaveLength(2);
    expect(marks().length).toBeGreaterThan(0);
  });
});

describe('the search field while an input method composes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('sends nothing between compositionstart and compositionend, and sends once after the delay that follows', () => {
    const onFilterChange = vi.fn();
    render(<Orders searchPanel onFilterChange={onFilterChange} />);
    fireEvent.compositionStart(field());
    type('m');
    type('mi');
    type('min');
    advance(SEARCH_DELAY * 3);
    expect(onFilterChange).not.toHaveBeenCalled();
    expect(field()).toHaveValue('min');
    fireEvent.compositionEnd(field());
    advance(SEARCH_DELAY - 1);
    expect(onFilterChange).not.toHaveBeenCalled();
    advance(1);
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({ search: 'min' });
    advance(5000);
    expect(onFilterChange).toHaveBeenCalledTimes(1);
  });

  it('arms nothing for a keystroke typed before the composition either: the text goes once, after it', () => {
    const onFilterChange = vi.fn();
    render(<Orders searchPanel onFilterChange={onFilterChange} />);
    type('m');
    fireEvent.compositionStart(field());
    type('mi');
    advance(SEARCH_DELAY * 3);
    expect(onFilterChange).not.toHaveBeenCalled();
    fireEvent.compositionEnd(field());
    advance(SEARCH_DELAY);
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({ search: 'mi' });
  });
});

describe('a change from outside inside the delay of the search field', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  // Conditions only: no row passes, so the grid says so and offers its button.
  const NOTHING = { columns: { qty: { operator: '>' as const, value: 99 } } };

  it('drops the pending text for clearFilter(), which then sends nothing more', () => {
    const onFilterChange = vi.fn();
    const ref = createRef<DataGridHandle>();
    render(
      <Orders gridRef={ref} searchPanel defaultFilter={NOTHING} onFilterChange={onFilterChange} />,
    );
    type('minh');
    advance(SEARCH_DELAY - 100);
    act(() => ref.current!.clearFilter());
    expect(field()).toHaveValue('');
    advance(SEARCH_DELAY * 3);
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({});
    expect(dataRows()).toHaveLength(ORDERS.length);
  });

  it('drops it for the button of the empty grid', () => {
    const onFilterChange = vi.fn();
    render(<Orders searchPanel defaultFilter={NOTHING} onFilterChange={onFilterChange} />);
    type('minh');
    fireEvent.click(screen.getByRole('button', { name: 'Clear filter' }));
    expect(field()).toHaveValue('');
    advance(SEARCH_DELAY * 3);
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith({});
  });

  it('drops it for a search the parent sets, and shows that search', () => {
    const onFilterChange = vi.fn();
    render(<Held searchPanel onChange={onFilterChange} />);
    type('minh');
    advance(SEARCH_DELAY - 100);
    fireEvent.click(screen.getByRole('button', { name: 'set outside' }));
    expect(field()).toHaveValue('outside');
    advance(SEARCH_DELAY * 3);
    expect(onFilterChange).not.toHaveBeenCalled();
  });
});
