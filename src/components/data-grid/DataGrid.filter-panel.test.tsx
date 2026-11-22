import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridColumnLayout, DataGridFilter, DataGridProps } from './index';

// The filter panel (spec phase 6 §4.3 F1 "Thanh bộ lọc", §6.3 "Lọc"): the conditions in words, the button
// that clears them and the switch that turns them off. What needs a layout engine (the size of its parts,
// the wrap of its words, the pager under it) is proven in the stories (`DataGridFiltering.stories.tsx`).

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
  status: string;
  placed: string;
  paid: boolean;
}

const STATUSES = ['new', 'processing', 'delivered', 'cancelled'];
const ORDERS: Order[] = Array.from({ length: 12 }, (_, index) => ({
  id: `DH-${1000 + index}`,
  customer: index % 3 === 0 ? `Công ty ${index + 1}` : `Minh ${index + 1}`,
  qty: index + 1,
  status: STATUSES[index % 4]!,
  placed: `2026-11-${String(index + 1).padStart(2, '0')}`,
  paid: index % 2 === 0,
}));

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
  { field: 'customer', caption: 'Customer', width: 200 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
  {
    field: 'status',
    caption: 'Status',
    width: 140,
    lookup: {
      items: STATUSES.map((value) => ({ value, text: value[0]!.toUpperCase() + value.slice(1) })),
      valueField: 'value',
      displayField: 'text',
    },
  },
  { field: 'placed', caption: 'Placed', dataType: 'date', width: 140 },
  { field: 'paid', caption: 'Paid', dataType: 'boolean', width: 80 },
];

// F1's sentence: Customer contains ‘công ty’ and Qty > 5 and Status is any of (Processing).
const F1: DataGridFilter = {
  columns: {
    customer: { operator: 'contains', value: 'công ty' },
    qty: { operator: '>', value: 5 },
    status: { values: ['processing'] },
  },
};

function Orders(props: Partial<DataGridProps<Order>>) {
  return (
    <DataGrid
      data={ORDERS}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      filterPanel
      {...props}
    />
  );
}

const grid = () => screen.getByRole('grid') as HTMLTableElement;
const panel = () => document.querySelector<HTMLElement>('.flg-data-grid-filter-panel');
const dataRows = () => grid().querySelectorAll('tbody > tr.flg-data-grid-row');
// The panel's own button: a grid with no row left holds another "Clear filter", in its empty cell.
const clear = () => within(panel()!).getByRole('button', { name: 'Clear filter' });
const apply = () => screen.getByRole('switch', { name: 'Apply filter' }) as HTMLInputElement;
const sentence = () => panel()!.querySelector('.flg-data-grid-filter-text')!.textContent;
// The words of the sentence as a list: a caption, its words, "and", and so on.
const parts = () =>
  Array.from(panel()!.querySelector('.flg-data-grid-filter-text')!.childNodes, (node) =>
    node.textContent?.trim(),
  ).filter(Boolean);

describe('the filter panel', () => {
  describe('when it is there', () => {
    it('is drawn only with filterPanel, and only for another value than true it is not', () => {
      const { rerender } = render(<Orders filterPanel={false} defaultFilter={F1} />);
      expect(panel()).toBeNull();
      rerender(<Orders filterPanel={'yes' as never} defaultFilter={F1} />);
      expect(panel()).toBeNull();
      rerender(<Orders filterPanel defaultFilter={F1} />);
      expect(panel()).not.toBeNull();
    });

    it('is not drawn while no column has a condition that filters, a search alone included', () => {
      const { rerender } = render(<Orders />);
      expect(panel()).toBeNull();
      rerender(<Orders defaultFilter={{ search: 'minh' }} />);
      expect(panel()).toBeNull();
      // A condition held and ignored: no value, an operator the column does not offer, a column that is not there.
      rerender(
        <Orders
          filter={{
            columns: {
              customer: { operator: 'contains', value: '' },
              qty: { operator: 'contains' as never, value: 'x' },
              nobody: { operator: '=', value: 'x' },
            },
          }}
        />,
      );
      expect(panel()).toBeNull();
    });

    it('appears with the first condition and goes with the last, the grid kept', () => {
      const { rerender } = render(<Orders filter={{}} onFilterChange={() => {}} />);
      expect(panel()).toBeNull();
      rerender(<Orders filter={F1} onFilterChange={() => {}} />);
      expect(panel()).not.toBeNull();
      rerender(<Orders filter={{}} onFilterChange={() => {}} />);
      expect(panel()).toBeNull();
    });

    it('is drawn while the conditions are off, and for a server grid too', () => {
      const { rerender } = render(<Orders defaultFilter={{ ...F1, enabled: false }} />);
      expect(panel()).not.toBeNull();
      expect(apply().checked).toBe(false);
      rerender(
        <Orders
          key="server"
          remote
          totalCount={40}
          defaultFilter={{ columns: { qty: { operator: '>', value: 5 } } }}
        />,
      );
      expect(sentence()).toBe('Qty > 5');
    });

    it('stands between the frame and the pager, outside the table', () => {
      render(<Orders defaultFilter={F1} paging={{ pageSize: 5 }} />);
      const root = grid().closest('.flg-data-grid')!;
      const classes = Array.from(root.children, (child) => child.className);
      const at = (name: string) => classes.findIndex((value) => value.includes(name));
      expect(at('flg-data-grid-main')).toBeLessThan(at('flg-data-grid-filter-panel'));
      expect(at('flg-data-grid-filter-panel')).toBeLessThan(at('flg-data-grid-pager'));
      expect(grid().contains(panel())).toBe(false);
    });
  });

  describe('the words', () => {
    it("says F1's sentence: captions in bold, the words between, and in muted", () => {
      render(<Orders defaultFilter={F1} />);
      expect(sentence()).toBe(
        'Customer contains ‘công ty’ and Qty > 5 and Status is any of (Processing)',
      );
      expect(parts()).toEqual([
        'Customer',
        'contains ‘công ty’',
        'and',
        'Qty',
        '> 5',
        'and',
        'Status',
        'is any of (Processing)',
      ]);
      const text = panel()!.querySelector('.flg-data-grid-filter-text')!;
      expect(Array.from(text.querySelectorAll('b'), (bold) => bold.textContent)).toEqual([
        'Customer',
        'Qty',
        'Status',
      ]);
      expect(
        Array.from(text.querySelectorAll('.flg-data-grid-filter-and'), (and) => and.textContent),
      ).toEqual(['and', 'and']);
    });

    it('says the row conditions before the header conditions, each in the order of the columns', () => {
      render(
        <Orders
          defaultFilter={{
            columns: {
              status: { values: ['new'] },
              qty: { operator: '<=', value: 4 },
              customer: { operator: 'startsWith', value: 'Minh', values: ['Minh 2'] },
            },
          }}
        />,
      );
      expect(sentence()).toBe(
        'Customer starts with ‘Minh’ and Qty ≤ 4 and Customer is any of (Minh 2) and Status is any of (New)',
      );
    });

    it('says a hidden column after the shown ones, and a pinned one in its zone', () => {
      const hidden: Partial<DataGridColumnLayout> = { hidden: ['id', 'customer'] };
      const { unmount } = render(<Orders defaultFilter={F1} defaultColumnLayout={hidden} />);
      // Customer is hidden and its condition stays in the sentence, after the conditions of the shown columns.
      expect(sentence()).toBe(
        'Qty > 5 and Customer contains ‘công ty’ and Status is any of (Processing)',
      );
      unmount();
      render(<Orders defaultFilter={F1} defaultColumnLayout={{ pinned: { qty: 'left' } }} />);
      // Qty is pinned to the left: its zone comes first, as its column does.
      expect(sentence()).toBe(
        'Qty > 5 and Customer contains ‘công ty’ and Status is any of (Processing)',
      );
    });

    it('says the values of a lookup, a boolean and a day as the column writes them', () => {
      render(
        <Orders
          defaultFilter={{
            columns: {
              status: { operator: '=', value: 'delivered' },
              paid: { operator: '=', value: true },
              placed: { operator: '>=', value: '2026-11-05' },
            },
          }}
        />,
      );
      expect(sentence()).toBe('Status = Delivered and Placed ≥ 11/05/2026 and Paid = Yes');
    });

    it('says a range: both ends once, an open end as ≥ or ≤, and the blank of a header filter', () => {
      const { rerender } = render(
        <Orders defaultFilter={{ columns: { qty: { operator: 'between', value: [5, 9] } } }} />,
      );
      expect(sentence()).toBe('Qty 5 – 9');
      rerender(
        <Orders
          key="from"
          defaultFilter={{ columns: { qty: { operator: 'between', value: [5, null] } } }}
        />,
      );
      expect(sentence()).toBe('Qty ≥ 5');
      rerender(
        <Orders
          key="to"
          defaultFilter={{
            columns: { placed: { operator: 'between', value: [null, '2026-10-31'] } },
          }}
        />,
      );
      expect(sentence()).toBe('Placed ≤ 10/31/2026');
      rerender(
        <Orders
          key="blank"
          defaultFilter={{ columns: { status: { values: ['new', null], exclude: true } } }}
        />,
      );
      expect(sentence()).toBe('Status is none of (New, (Blanks))');
    });

    it('follows the filter when it changes, and says nothing of the search', () => {
      const { rerender } = render(<Orders filter={F1} onFilterChange={() => {}} />);
      rerender(
        <Orders
          filter={{ search: 'minh', columns: { qty: { operator: '=', value: 3 } } }}
          onFilterChange={() => {}}
        />,
      );
      expect(sentence()).toBe('Qty = 3');
    });

    it('writes a header value as the cells write it: the text of its first row for a format function', () => {
      const shouted: DataGridColumn<Order>[] = COLUMNS.map((column) =>
        column.field === 'status'
          ? {
              field: 'status',
              caption: 'Status',
              format: (value: unknown) => String(value).toUpperCase(),
            }
          : column,
      );
      render(
        <Orders
          columns={shouted}
          defaultFilter={{ columns: { status: { values: ['new', 'unheard', null] } } }}
        />,
      );
      // A row holds 'new', so its cell says NEW; no row holds 'unheard', so the key is its own text.
      expect(sentence()).toBe('Status is any of (NEW, unheard, (Blanks))');
    });

    it('draws the panel again for other data, and not for a search', () => {
      const shouted: DataGridColumn<Order>[] = COLUMNS.map((column) =>
        column.field === 'status'
          ? {
              field: 'status',
              caption: 'Status',
              format: (value: unknown) => String(value).toUpperCase(),
            }
          : column,
      );
      const filter = { columns: { status: { values: ['processing'] } } };
      const { rerender } = render(
        <Orders columns={shouted} filter={filter} onFilterChange={() => {}} />,
      );
      expect(sentence()).toBe('Status is any of (PROCESSING)');
      rerender(
        <Orders
          columns={shouted}
          filter={{ ...filter, search: 'minh' }}
          onFilterChange={() => {}}
        />,
      );
      expect(sentence()).toBe('Status is any of (PROCESSING)');
      // The rows that hold the value are gone: the key is written as it is.
      rerender(
        <Orders
          columns={shouted}
          data={ORDERS.filter((order) => order.status !== 'processing')}
          filter={filter}
          onFilterChange={() => {}}
        />,
      );
      expect(sentence()).toBe('Status is any of (processing)');
    });

    it('is written with the labels, a record of panelOperators kept apart from the rest', () => {
      render(
        <Orders
          defaultFilter={F1}
          labels={{
            and: 'và',
            isAnyOf: 'thuộc',
            quoted: (text) => `“${text}”`,
            panelOperators: { contains: 'chứa' },
          }}
        />,
      );
      // `>` keeps its default word: a partial record keeps what it leaves out.
      expect(sentence()).toBe('Customer chứa “công ty” và Qty > 5 và Status thuộc (Processing)');
    });
  });

  describe('Clear filter', () => {
    it('clears the search and every condition with one change, and the panel goes', () => {
      const onFilterChange = vi.fn();
      render(
        <Orders
          paging={{ pageSize: 5 }}
          defaultFilter={{ ...F1, search: 'minh' }}
          onFilterChange={onFilterChange}
        />,
      );
      fireEvent.click(clear());
      expect(onFilterChange).toHaveBeenCalledTimes(1);
      expect(onFilterChange).toHaveBeenCalledWith({});
      expect(panel()).toBeNull();
      expect(dataRows()).toHaveLength(5);
    });

    it('also takes away a switched-off filter, so the next condition is not hidden behind it', () => {
      const onFilterChange = vi.fn();
      render(<Orders defaultFilter={{ ...F1, enabled: false }} onFilterChange={onFilterChange} />);
      fireEvent.click(clear());
      expect(onFilterChange).toHaveBeenLastCalledWith({});
    });

    it('is a stop of Tab of its own, outside the table, and the table keeps its one stop', () => {
      render(<Orders defaultFilter={F1} />);
      expect(grid().querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(clear()).not.toHaveAttribute('tabindex', '-1');
      expect(apply()).not.toHaveAttribute('tabindex', '-1');
      expect(panel()!.querySelectorAll('[tabindex="-1"]')).toHaveLength(0);
    });

    it('gives the focus to the active cell of the grid when the panel goes under it', async () => {
      render(<Orders defaultFilter={F1} />);
      act(() => clear().focus());
      expect(clear()).toHaveFocus();
      fireEvent.click(clear());
      await act(async () => {});
      expect(panel()).toBeNull();
      const active = grid().querySelector<HTMLElement>('[tabindex="0"]')!;
      expect(active).toBe(document.activeElement);
      expect(grid().contains(document.activeElement)).toBe(true);
    });

    it('does not take the focus from where it is when it was not on the panel', async () => {
      render(
        <>
          <button type="button">elsewhere</button>
          <Orders defaultFilter={F1} />
        </>,
      );
      act(() => screen.getByRole('button', { name: 'elsewhere' }).focus());
      fireEvent.click(clear());
      await act(async () => {});
      expect(screen.getByRole('button', { name: 'elsewhere' })).toHaveFocus();
    });

    it('keeps the focus on the button when a parent keeps its filter and the panel stays', async () => {
      render(<Orders filter={F1} onFilterChange={() => {}} />);
      act(() => clear().focus());
      fireEvent.click(clear());
      await act(async () => {});
      expect(panel()).not.toBeNull();
      expect(clear()).toHaveFocus();
    });
  });

  describe('Apply filter', () => {
    it('is a switch named by labels.applyFilter, on while the conditions are enabled', () => {
      render(<Orders defaultFilter={F1} labels={{ applyFilter: 'Bật bộ lọc' }} />);
      const toggle = screen.getByRole('switch', { name: 'Bật bộ lọc' }) as HTMLInputElement;
      expect(toggle.checked).toBe(true);
    });

    it('turns the conditions off with one change, and the rows are those the search keeps', () => {
      const onFilterChange = vi.fn();
      render(
        <Orders
          defaultFilter={{ ...F1, search: 'minh' }}
          onFilterChange={onFilterChange}
          filterRow
          headerFilter
        />,
      );
      // Customer contains "công ty" and Qty > 5 and Status processing, and the search "minh": no row.
      expect(dataRows()).toHaveLength(0);
      fireEvent.click(apply());
      expect(onFilterChange).toHaveBeenCalledTimes(1);
      expect(onFilterChange).toHaveBeenLastCalledWith({ ...F1, search: 'minh', enabled: false });
      // The search alone: every "Minh" row of the 12 (the 8 that are not "Công ty").
      expect(dataRows()).toHaveLength(8);
      expect(apply().checked).toBe(false);
      // The conditions are still there to see: the panel, the operator buttons and the funnel of Status.
      expect(sentence()).toBe(
        'Customer contains ‘công ty’ and Qty > 5 and Status is any of (Processing)',
      );
      expect(
        screen.getByRole('button', { name: 'Operator: Greater than' }).hasAttribute('data-active'),
      ).toBe(true);
      expect(
        screen
          .getByRole('button', { name: 'Filter Status (filtered)' })
          .hasAttribute('data-active'),
      ).toBe(true);
      expect(screen.getByRole('textbox', { name: 'Filter Customer' })).toHaveValue('công ty');
    });

    it('turns them back on, and the key goes away rather than enabled: true', () => {
      const onFilterChange = vi.fn();
      render(<Orders defaultFilter={{ ...F1, enabled: false }} onFilterChange={onFilterChange} />);
      expect(dataRows()).toHaveLength(12);
      fireEvent.click(apply());
      expect(onFilterChange).toHaveBeenCalledTimes(1);
      expect(onFilterChange).toHaveBeenLastCalledWith(F1);
      expect('enabled' in onFilterChange.mock.calls[0]![0]).toBe(false);
      // Only DH-1009 is a "Công ty" order of more than 5 that is processing.
      expect(dataRows()).toHaveLength(1);
    });

    it('is a change like any other: the first page, and a controlled parent hears it', () => {
      const onPageChange = vi.fn();
      function Controlled() {
        const [filter, setFilter] = useState<DataGridFilter>({
          columns: { qty: { operator: '>', value: 2 } },
        });
        return (
          <Orders
            filter={filter}
            onFilterChange={setFilter}
            paging={{ pageSize: 4 }}
            defaultPage={{ index: 1, size: 4 }}
            onPageChange={onPageChange}
          />
        );
      }
      render(<Controlled />);
      fireEvent.click(apply());
      expect(onPageChange).toHaveBeenLastCalledWith({ index: 0, size: 4 });
      expect(apply().checked).toBe(false);
      expect(dataRows()).toHaveLength(4);
    });

    it('keeps the focus on the switch', () => {
      render(<Orders defaultFilter={F1} />);
      act(() => apply().focus());
      fireEvent.click(apply());
      expect(apply()).toHaveFocus();
      expect(panel()).not.toBeNull();
    });
  });

  describe('what it asks of the grid', () => {
    it('is no new label warning: labels with records written in the JSX say what they said', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { rerender } = render(
        <Orders defaultFilter={F1} labels={{ panelOperators: { contains: 'has' } }} />,
      );
      for (let index = 0; index < 4; index += 1) {
        rerender(<Orders defaultFilter={F1} labels={{ panelOperators: { contains: 'has' } }} />);
      }
      expect(warn).not.toHaveBeenCalled();
      expect(sentence()).toContain('Customer has ‘công ty’');
    });

    it('has the filter funnel icon, aria-hidden, before the words', () => {
      render(<Orders defaultFilter={F1} />);
      const icon = panel()!.firstElementChild!;
      expect(icon).toHaveClass('flg-data-grid-filter-icon');
      expect(icon.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      expect(within(panel()!).getAllByRole('button')).toHaveLength(1);
    });
  });
});
