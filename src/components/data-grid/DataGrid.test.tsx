import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode, createRef, useState } from 'react';
import type { Ref } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import type { Mock } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridHandle, DataGridProps, DataGridSortItem } from './index';

beforeEach(() => {
  resetDevWarnings();
  vi.restoreAllMocks();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
const spyError = () => vi.spyOn(console, 'error').mockImplementation(() => {});

interface Order {
  id: string;
  customer: string;
  date: string;
  qty: number;
  total: number;
  paid: boolean;
  note?: string | null;
}

const ORDERS: Order[] = [
  {
    id: 'DH-1030',
    customer: 'Nguyễn Minh',
    date: '2026-11-05',
    qty: 4,
    total: 1250000,
    paid: true,
  },
  { id: 'DH-1029', customer: 'Trần Hải', date: '2026-11-04', qty: 1, total: 890000, paid: false },
  { id: 'DH-1028', customer: 'Lê An', date: '2026-11-03', qty: 12, total: 15400000, paid: true },
];

const VND = { style: 'currency', currency: 'VND' } as const;
const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
  { field: 'customer', caption: 'Customer', width: 200 },
  { field: 'date', caption: 'Order date', dataType: 'date', width: 140 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
  { field: 'total', caption: 'Total', dataType: 'number', format: VND, width: 160 },
  { field: 'paid', caption: 'Paid', dataType: 'boolean', width: 80 },
];

function Orders(props: Partial<DataGridProps<Order>>) {
  return <DataGrid data={ORDERS} rowKey="id" columns={COLUMNS} caption="Orders" {...props} />;
}

const grid = () => screen.getByRole('grid');
const root = () => grid().closest('.flg-data-grid') as HTMLElement;
const frame = () => grid().parentElement as HTMLElement;
const bodyRows = () => Array.from(grid().querySelectorAll<HTMLElement>('tbody > tr'));
const cell = (row: number, column: number) => bodyRows()[row]?.children[column] as HTMLElement;
const text = (row: number, column: number) => cell(row, column).textContent;
const currency = (locale: string, value: number) =>
  new Intl.NumberFormat(locale, VND).format(value);

describe('roles and name', () => {
  it('is a grid, with a column heading for each column and a row for each row', () => {
    render(<Orders />);
    expect(grid().tagName).toBe('TABLE');
    expect(grid().querySelectorAll('thead th')).toHaveLength(6);
    expect(bodyRows()).toHaveLength(3);
  });

  it('is named by its caption, which is a heading of the level captionAs says', () => {
    render(<Orders />);
    const heading = screen.getByRole('heading', { level: 3, name: 'Orders' });
    expect(heading).toHaveClass('flg-card-title');
    expect(grid()).toHaveAttribute('aria-labelledby', heading.id);
    expect(screen.getByRole('grid', { name: 'Orders' })).toBe(grid());
  });

  it('puts the caption in the element captionAs names', () => {
    render(<Orders captionAs="h2" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Orders' })).toBeInTheDocument();
  });

  it('can have the caption in a div, which is still the name', () => {
    render(<Orders captionAs="div" />);
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByRole('grid', { name: 'Orders' })).toBeInTheDocument();
  });

  it("is named by the caller's aria-labelledby when it gives one", () => {
    render(
      <>
        <span id="outside">Outside name</span>
        <Orders aria-labelledby="outside" />
      </>,
    );
    expect(grid()).toHaveAttribute('aria-labelledby', 'outside');
    expect(screen.getByRole('grid', { name: 'Outside name' })).toBe(grid());
  });

  it('is named by aria-label when there is no caption', () => {
    render(<Orders caption={undefined} aria-label="All orders" />);
    expect(screen.getByRole('grid', { name: 'All orders' })).toBe(grid());
    expect(grid()).not.toHaveAttribute('aria-labelledby');
  });

  it("joins the description's id to the caller's aria-describedby, and does not replace it", () => {
    render(<Orders description="Last week" aria-describedby="mine" />);
    const description = screen.getByText('Last week');
    expect(description).toHaveClass('flg-card-description');
    expect(grid()).toHaveAttribute('aria-describedby', `mine ${description.id}`);
  });

  it('describes the grid by its description alone when the caller gives no id', () => {
    render(<Orders description="Last week" />);
    expect(grid()).toHaveAttribute('aria-describedby', screen.getByText('Last week').id);
    expect(screen.getByRole('grid', { description: 'Last week' })).toBe(grid());
  });

  it('leaves aria-describedby as it is when there is no description', () => {
    render(<Orders aria-describedby="mine" />);
    expect(grid()).toHaveAttribute('aria-describedby', 'mine');
  });
});

describe('props', () => {
  it('sends className, style, id, data-*, lang and handlers to the root, and the name to the table', () => {
    const onClick = vi.fn();
    render(
      <Orders
        id="orders"
        className="mine"
        style={{ marginTop: 3 }}
        lang="vi"
        data-testid="root"
        aria-label="Mine"
        aria-describedby="elsewhere"
        onClick={onClick}
      />,
    );
    const element = screen.getByTestId('root');
    expect(element).toBe(root());
    expect(element).toHaveAttribute('id', 'orders');
    expect(element).toHaveAttribute('lang', 'vi');
    expect(element).toHaveClass('flg-data-grid', 'mine');
    expect(element.style.marginTop).toBe('3px');
    expect(element).not.toHaveAttribute('aria-label');
    expect(grid()).toHaveAttribute('aria-label', 'Mine');
    expect(grid()).toHaveAttribute('aria-describedby', 'elsewhere');
    expect(grid()).not.toHaveAttribute('id');
    fireEvent.click(cell(0, 1));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('hides the whole grid with hidden, and shows the variant and density on the root', () => {
    render(<Orders hidden data-testid="root" variant="minimal" density="comfortable" />);
    const element = screen.getByTestId('root');
    expect(element).toHaveAttribute('hidden');
    expect(element).toHaveAttribute('data-variant', 'minimal');
    expect(element).toHaveAttribute('data-density', 'comfortable');
  });

  it('gives the frame no role and no tab stop: the cells take the focus', () => {
    render(<Orders />);
    expect(frame()).toHaveClass('flg-table-frame', 'flg-data-grid-frame');
    expect(frame()).not.toHaveAttribute('role');
    // Out of the Tab order for good, and never changed: Firefox puts a scroll frame in the order
    // unless it has a tabindex, and a tabindex that came and went would drop a focus it held.
    expect(frame()).toHaveAttribute('tabindex', '-1');
    expect(frame()).toHaveAttribute('data-sticky-header');
    expect(frame()).toHaveAttribute('data-variant', 'lined');
    expect(frame()).toHaveAttribute('data-size', 'md');
  });

  it('uses the sm size of a Table for compact', () => {
    render(<Orders density="compact" />);
    expect(frame()).toHaveAttribute('data-size', 'sm');
  });

  it('puts a number of pixels, or any CSS length, in the height of the root', () => {
    const { rerender } = render(<Orders data-testid="root" height={320} />);
    expect(screen.getByTestId('root').style.height).toBe('320px');
    rerender(<Orders data-testid="root" height="60vh" />);
    expect(screen.getByTestId('root').style.height).toBe('60vh');
    rerender(<Orders data-testid="root" />);
    expect(screen.getByTestId('root').style.height).toBe('');
  });

  it('keeps a height the caller wrote in style when there is no height prop', () => {
    render(<Orders data-testid="root" style={{ height: 200 }} />);
    expect(screen.getByTestId('root').style.height).toBe('200px');
  });

  it('shows the caption block only when there is something in it', () => {
    const { rerender, container } = render(<Orders caption={undefined} aria-label="x" />);
    expect(container.querySelector('.flg-data-grid-toolbar')).toBeNull();
    rerender(<Orders caption="Orders" />);
    const toolbar = container.querySelector('.flg-data-grid-toolbar') as HTMLElement;
    expect(toolbar.querySelector('.flg-card-header.flg-data-grid-caption')).not.toBeNull();
    expect(toolbar.querySelector('.flg-card-description')).toBeNull();
    rerender(<Orders caption={undefined} description="Only a description" aria-label="x" />);
    expect(container.querySelector('.flg-card-title')).toBeNull();
    expect(container.querySelector('.flg-card-description')).not.toBeNull();
  });

  it('has the live region of the grid last in the root, empty', () => {
    render(<Orders />);
    const region = root().lastElementChild as HTMLElement;
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toBeEmptyDOMElement();
  });

  it('gives the ref a handle whose element is the root, and keeps it across renders', () => {
    const ref = createRef<DataGridHandle>();
    // Not through `Orders`: a function component takes no ref in React 18.
    const grid_ = (caption: string) => (
      <DataGrid ref={ref} data={ORDERS} rowKey="id" columns={COLUMNS} caption={caption} />
    );
    const { rerender } = render(grid_('Orders'));
    const handle = ref.current;
    expect(handle?.element).toBe(root());
    rerender(grid_('Again'));
    expect(ref.current).toBe(handle);
    expect(ref.current?.element).toBe(root());
  });
});

describe('cells', () => {
  it('draws the column title in a th with scope col, and the row header as a th with scope row', () => {
    render(<Orders />);
    const heads = Array.from(grid().querySelectorAll('thead th'));
    expect(heads.map((head) => head.getAttribute('scope'))).toEqual(Array(6).fill('col'));
    expect(heads.map((head) => head.textContent)).toEqual([
      'Order',
      'Customer',
      'Order date',
      'Qty',
      'Total',
      'Paid',
    ]);
    const rowHeaders = grid().querySelectorAll('tbody th');
    expect(rowHeaders).toHaveLength(3);
    for (const header of rowHeaders) expect(header).toHaveAttribute('scope', 'row');
    expect(rowHeaders[0]).toHaveTextContent('DH-1030');
    expect(grid().querySelectorAll('tbody td')).toHaveLength(15);
    expect(screen.getByRole('rowheader', { name: 'DH-1030' })).toBe(rowHeaders[0]);
  });

  it('uses the Table classes, so the grid has the look of a Table', () => {
    render(<Orders />);
    expect(grid()).toHaveClass('flg-table', 'flg-data-grid-table');
    expect(grid().querySelector('thead')).toHaveClass('flg-table-header');
    expect(grid().querySelector('tbody')).toHaveClass('flg-table-body');
    expect(bodyRows()[0]).toHaveClass('flg-table-row', 'flg-data-grid-row');
    expect(cell(0, 1)).toHaveClass('flg-table-cell', 'flg-data-grid-cell');
    expect(cell(0, 0)).toHaveClass('flg-table-head', 'flg-data-grid-cell');
    expect(grid().querySelector('thead th')).toHaveClass('flg-table-head', 'flg-data-grid-head');
  });

  it('puts the title in a content wrapper', () => {
    render(<Orders />);
    const wrapper = grid().querySelector('thead th > .flg-data-grid-head-content');
    expect(wrapper).toHaveTextContent('Order');
  });

  it('aligns by type: numbers to the end, booleans to the centre, the rest to the start', () => {
    render(<Orders />);
    const aligns = (selector: string) =>
      Array.from(grid().querySelectorAll(selector)).map((node) => node.getAttribute('data-align'));
    expect(aligns('thead th')).toEqual(['start', 'start', 'start', 'end', 'end', 'center']);
    expect(aligns('tbody tr:first-child > *')).toEqual([
      'start',
      'start',
      'start',
      'end',
      'end',
      'center',
    ]);
  });

  it('shows dates, numbers and currency in en-US', () => {
    render(<Orders />);
    expect(text(0, 2)).toBe('11/05/2026');
    expect(text(0, 3)).toBe('4');
    expect(text(0, 4)).toBe(currency('en-US', 1250000));
    expect(text(2, 4)).toBe(currency('en-US', 15400000));
  });

  it('shows the same cells in vi-VN, in its order of day and month', () => {
    render(<Orders locale="vi-VN" />);
    expect(text(0, 2)).toBe('05/11/2026');
    expect(text(0, 4)).toBe(currency('vi-VN', 1250000));
  });

  it('draws a true as a check with a hidden Yes, and a false as a hidden No alone', () => {
    render(<Orders />);
    const yes = cell(0, 5);
    expect(yes.querySelector('svg')).not.toBeNull();
    expect(yes.querySelector('.flg-visually-hidden')).toHaveTextContent('Yes');
    const no = cell(1, 5);
    expect(no.querySelector('svg')).toBeNull();
    expect(no.querySelector('.flg-visually-hidden')).toHaveTextContent('No');
    expect(no.textContent).toBe('No');
  });

  it('takes the words of a boolean from labels, keeping the default of the one left out', () => {
    render(<Orders labels={{ yes: 'Có', no: undefined }} />);
    expect(text(0, 5)).toBe('Có');
    expect(text(1, 5)).toBe('No');
  });

  it('draws a blank value as nothing', () => {
    render(
      <Orders
        columns={[{ field: 'id' }, { field: 'note', caption: 'Note' }]}
        data={[
          { ...ORDERS[0]!, note: null },
          { ...ORDERS[1]!, note: 'Fragile' },
        ]}
      />,
    );
    expect(cell(0, 1).childNodes).toHaveLength(0);
    expect(text(1, 1)).toBe('Fragile');
  });

  it('gives a cell function the row, its key, the value, the text and the column', () => {
    const custom = vi.fn(() => <b>custom</b>);
    render(
      <Orders
        columns={[
          { field: 'id', width: 100 },
          { field: 'total', caption: 'Total', dataType: 'number', format: VND, cell: custom },
        ]}
      />,
    );
    expect(custom).toHaveBeenCalledTimes(3);
    expect(custom).toHaveBeenNthCalledWith(1, {
      row: ORDERS[0],
      rowKey: 'DH-1030',
      value: 1250000,
      text: currency('en-US', 1250000),
      column: { id: 'total', caption: 'Total', dataType: 'number', align: 'end' },
      selected: false,
    });
    expect(cell(0, 1).querySelector('b')).toHaveTextContent('custom');
    expect(cell(0, 1)).not.toHaveTextContent(currency('en-US', 1250000));
  });

  it('puts the class rowClassName gives on the row', () => {
    render(<Orders rowClassName={(row) => (row.paid ? 'paid' : undefined)} />);
    expect(bodyRows().map((row) => row.classList.contains('paid'))).toEqual([true, false, true]);
    expect(bodyRows()[0]).toHaveClass('flg-table-row');
  });

  it('marks the stripes of a striped grid on its even rows of what is shown', () => {
    const { rerender } = render(<Orders variant="striped" />);
    expect(bodyRows().map((row) => row.hasAttribute('data-stripe'))).toEqual([true, false, true]);
    rerender(<Orders variant="lined" />);
    expect(bodyRows().some((row) => row.hasAttribute('data-stripe'))).toBe(false);
  });
});

describe('row heights', () => {
  const heightOf = () =>
    screen.getByTestId('root').style.getPropertyValue('--flg-data-grid-row-height');

  it.each([
    ['compact', 'lined', '31px'],
    ['compact', 'striped', '30px'],
    ['compact', 'minimal', '36px'],
    ['standard', 'lined', '41px'],
    ['standard', 'striped', '40px'],
    ['standard', 'minimal', '52px'],
    ['comfortable', 'lined', '49px'],
    ['comfortable', 'striped', '48px'],
    ['comfortable', 'minimal', '60px'],
  ] as const)('is %s %s: %s', (density, variant, expected) => {
    render(<Orders data-testid="root" density={density} variant={variant} />);
    expect(heightOf()).toBe(expected);
  });

  it('is the standard lined row, 41px, by default', () => {
    render(<Orders data-testid="root" />);
    expect(heightOf()).toBe('41px');
  });

  it('takes rowHeight over the table', () => {
    render(<Orders data-testid="root" rowHeight={56} />);
    expect(heightOf()).toBe('56px');
  });

  it.each([0, -4, Number.NaN, Infinity])(
    'uses the table and warns once for rowHeight %s',
    (bad) => {
      const warn = spyWarn();
      const { rerender } = render(<Orders data-testid="root" rowHeight={bad} />);
      rerender(<Orders data-testid="root" rowHeight={bad} />);
      expect(heightOf()).toBe('41px');
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toContain('rowHeight');
    },
  );

  it('follows a change of density on a grid that is already there', () => {
    const { rerender } = render(<Orders data-testid="root" />);
    rerender(<Orders data-testid="root" density="compact" />);
    expect(heightOf()).toBe('31px');
  });
});

describe('values outside a union', () => {
  it('fall back to the default', () => {
    render(
      <Orders
        data-testid="root"
        // @ts-expect-error not a variant
        variant="grid"
        // @ts-expect-error not a density
        density="tight"
        // @ts-expect-error not a heading
        captionAs="h9"
      />,
    );
    expect(screen.getByTestId('root')).toHaveAttribute('data-variant', 'lined');
    expect(screen.getByTestId('root')).toHaveAttribute('data-density', 'standard');
    expect(screen.getByRole('heading', { level: 3, name: 'Orders' })).toBeInTheDocument();
  });
});

describe('rows and keys', () => {
  it('shows the new rows when data changes, not only on a fresh mount', () => {
    const { rerender } = render(<Orders />);
    rerender(<Orders data={[ORDERS[2]!, { ...ORDERS[0]!, customer: 'Đổi Tên' }]} />);
    expect(bodyRows()).toHaveLength(2);
    expect(text(0, 0)).toBe('DH-1028');
    expect(text(1, 1)).toBe('Đổi Tên');
  });

  it('shows no row of data for no data, only the row that says so, and keeps the header', () => {
    render(<Orders data={[]} />);
    // What was a body with no row is one row of words (DataGrid.loading.test.tsx has the rest).
    expect(bodyRows()).toHaveLength(1);
    expect(bodyRows()[0]).toHaveClass('flg-data-grid-empty');
    expect(grid().querySelectorAll('tbody > tr.flg-data-grid-row')).toHaveLength(0);
    expect(grid().querySelectorAll('thead th')).toHaveLength(6);
  });

  it('takes the key from a function as well as from a property', () => {
    const custom = vi.fn(() => null);
    render(
      <Orders rowKey={(row) => `order-${row.id}`} columns={[{ field: 'id', cell: custom }]} />,
    );
    const keys = (custom.mock.calls as unknown as [{ rowKey: string }][]).map(
      ([ctx]) => ctx.rowKey,
    );
    expect(keys).toEqual(['order-DH-1030', 'order-DH-1029', 'order-DH-1028']);
  });

  it('reads the keys of a new rowKey function once, and draws no row again when they are the same', () => {
    // Production, so that the check of the keys, which reads them too, is not counted.
    vi.stubEnv('NODE_ENV', 'production');
    const key = vi.fn((row: Order) => row.id);
    const drawId = vi.fn(({ text: id }: { text: string }) => id);
    const columns: DataGridColumn<Order>[] = [{ field: 'id', cell: drawId }, ...COLUMNS.slice(1)];
    const { rerender } = render(<Orders rowKey={(row) => key(row)} columns={columns} />);
    const drawn = drawId.mock.calls.length;
    expect(drawn).toBeGreaterThanOrEqual(ORDERS.length);
    key.mockClear();
    rerender(<Orders rowKey={(row) => key(row)} columns={columns} />);
    expect(key).toHaveBeenCalledTimes(ORDERS.length);
    expect(drawId).toHaveBeenCalledTimes(drawn);
  });

  it('uses the keys of a rowKey function that comes with new data, in the same render', () => {
    interface Customer {
      code: string;
      name: string;
    }
    const customers: Customer[] = [
      { code: 'K1', name: 'Lê An' },
      { code: 'K2', name: 'Trần Hải' },
    ];
    const onSelectedKeysChange = vi.fn();
    const { rerender } = render(
      <DataGrid
        data={ORDERS}
        rowKey={(row) => row.id}
        columns={COLUMNS}
        caption="Orders"
        selectionMode="multiple"
        onSelectedKeysChange={onSelectedKeysChange}
      />,
    );
    rerender(
      <DataGrid
        data={customers}
        rowKey={(row) => row.code}
        columns={[{ field: 'name', caption: 'Name' }]}
        caption="Customers"
        selectionMode="multiple"
        onSelectedKeysChange={onSelectedKeysChange}
      />,
    );
    fireEvent.click(cell(0, 0).querySelector('input')!);
    expect(onSelectedKeysChange).toHaveBeenLastCalledWith(['K1']);
  });

  it('uses the keys of a rowKey function that reads another field at once, with the same data', () => {
    const onSelectedKeysChange = vi.fn();
    const { rerender } = render(
      <Orders
        rowKey={(row) => row.id}
        selectionMode="multiple"
        onSelectedKeysChange={onSelectedKeysChange}
      />,
    );
    rerender(
      <Orders
        rowKey={(row) => row.customer}
        selectionMode="multiple"
        onSelectedKeysChange={onSelectedKeysChange}
      />,
    );
    fireEvent.click(cell(0, 0).querySelector('input')!);
    expect(onSelectedKeysChange).toHaveBeenLastCalledWith([ORDERS[0]!.customer]);
  });

  it('checks the keys of a new rowKey function, with the same data', () => {
    const warn = spyWarn();
    const { rerender } = render(<Orders rowKey={(row) => row.id} />);
    expect(warn).not.toHaveBeenCalled();
    rerender(<Orders rowKey={() => 'same'} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('same key');
  });

  it('draws every row of two that have the same key, and warns once', () => {
    const warn = spyWarn();
    const error = spyError();
    render(<Orders data={[ORDERS[0]!, ORDERS[0]!, ORDERS[1]!]} />);
    expect(bodyRows()).toHaveLength(3);
    expect(error).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('same key');
  });

  it('uses the place of a row that has no key, and warns once', () => {
    const warn = spyWarn();
    const error = spyError();
    const data = [ORDERS[0]!, { ...ORDERS[1]!, id: undefined as unknown as string }, ORDERS[2]!];
    render(<Orders data={data} />);
    expect(bodyRows()).toHaveLength(3);
    expect(error).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('no usable key');
  });

  it('does not check the keys in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = spyWarn();
    render(<Orders data={[ORDERS[0]!, ORDERS[0]!]} />);
    expect(warn).not.toHaveBeenCalled();
    expect(bodyRows()).toHaveLength(2);
  });

  it('checks the keys again when data changes, and says nothing for a clean list', () => {
    const warn = spyWarn();
    const { rerender } = render(<Orders />);
    expect(warn).not.toHaveBeenCalled();
    rerender(<Orders data={[ORDERS[0]!, ORDERS[0]!]} />);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('warnings', () => {
  it('warns after mount, once, for a grid without a name', () => {
    const warn = spyWarn();
    const { rerender } = render(<Orders caption={undefined} />);
    rerender(<Orders caption={undefined} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('<DataGrid> needs a name');
  });

  it('does not warn for a caption, aria-label or aria-labelledby', () => {
    const warn = spyWarn();
    render(<Orders />);
    render(<Orders caption={undefined} aria-label="Orders" />);
    render(<Orders caption={undefined} aria-labelledby="somewhere" />);
    expect(warn).not.toHaveBeenCalled();
  });

  it('counts a caption of nothing as no name, and a description as no name', () => {
    const warn = spyWarn();
    render(<Orders caption="" description="Only a description" />);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  function Churning({ ids }: { ids: readonly (keyof Order)[] }) {
    // A new array on every render, as an inline `columns` is.
    return <Orders columns={ids.map((field) => ({ field }))} />;
  }

  it('warns when columns is a new array on three commits in a row with the same ids', () => {
    const warn = spyWarn();
    const ids = ['id', 'customer'] as const;
    const { rerender } = render(<Churning ids={ids} />);
    rerender(<Churning ids={ids} />);
    rerender(<Churning ids={ids} />);
    expect(warn).not.toHaveBeenCalled();
    rerender(<Churning ids={ids} />);
    rerender(<Churning ids={ids} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('columns');
  });

  it('does not warn when the ids change, or when a commit keeps the same columns', () => {
    const warn = spyWarn();
    const { rerender } = render(<Churning ids={['id']} />);
    rerender(<Churning ids={['id', 'customer']} />);
    rerender(<Churning ids={['id']} />);
    rerender(<Churning ids={['id', 'customer']} />);
    rerender(<Churning ids={['id']} />);
    expect(warn).not.toHaveBeenCalled();
    const { rerender: again } = render(<Orders />);
    for (let i = 0; i < 6; i++) again(<Orders caption={`Orders ${i}`} />);
    expect(warn).not.toHaveBeenCalled();
  });

  it('is silent in StrictMode with a stable columns array, through many renders', () => {
    const warn = spyWarn();
    const { rerender } = render(
      <StrictMode>
        <Orders />
      </StrictMode>,
    );
    for (let i = 0; i < 6; i++) {
      rerender(
        <StrictMode>
          <Orders caption={`Orders ${i}`} />
        </StrictMode>,
      );
    }
    expect(warn).not.toHaveBeenCalled();
  });

  it('is silent in production for the columns that change', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = spyWarn();
    const ids = ['id'] as const;
    const { rerender } = render(<Churning ids={ids} />);
    for (let i = 0; i < 5; i++) rerender(<Churning ids={ids} />);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns when no row has the field a column names', () => {
    const warn = spyWarn();
    // @ts-expect-error a field the row does not have, as in JavaScript
    render(<Orders columns={[{ field: 'idd' }]} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('spelling');
  });
});

describe('the server and the client', () => {
  it('renders every row, the name and the roles on the server', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Orders description="Last week" />);
    const table = container.querySelector('table') as HTMLTableElement;
    expect(table).toHaveAttribute('role', 'grid');
    expect(table.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(table.querySelectorAll('thead th[scope="col"]')).toHaveLength(6);
    expect(table.querySelectorAll('tbody th[scope="row"]')).toHaveLength(3);
    const heading = container.querySelector('.flg-card-title') as HTMLElement;
    expect(table.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(container.querySelector('.flg-data-grid')).toHaveAttribute('data-variant', 'lined');
  });

  it('writes the same widths before it has measured: flexible columns have none, the table a least width', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(
      <Orders
        columns={[
          { field: 'id', width: 100 },
          { field: 'customer', minWidth: 90 },
          { field: 'total', dataType: 'number', minWidth: 200 },
        ]}
      />,
    );
    const cols = Array.from(container.querySelectorAll('col'));
    expect(cols.map((col) => col.style.width)).toEqual(['100px', '', '']);
    expect(container.querySelector('table')?.style.minWidth).toBe('390px');
  });

  it.each(['fixed', 'flexible'])(
    'hydrates a grid with %s columns with nothing logged',
    async (kind) => {
      const columns: DataGridColumn<Order>[] =
        kind === 'fixed' ? COLUMNS : [{ field: 'id', width: 100 }, { field: 'customer' }];
      const container = document.createElement('div');
      container.innerHTML = renderToString(<Orders columns={columns} height={300} />);
      document.body.append(container);
      const error = spyError();
      const warn = spyWarn();
      let hydrated: ReturnType<typeof hydrateRoot> | undefined;
      onTestFinished(() => {
        act(() => hydrated?.unmount());
        container.remove();
      });
      await act(async () => {
        hydrated = hydrateRoot(container, <Orders columns={columns} height={300} />);
      });
      expect(error).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
      expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
    },
  );
});

describe('what runs, and when', () => {
  interface Observer {
    callback: ResizeObserverCallback;
    targets: Element[];
    disconnect: Mock<() => void>;
  }

  function stubObserver(): Observer[] {
    const instances: Observer[] = [];
    class FakeObserver {
      private readonly instance: Observer;
      constructor(callback: ResizeObserverCallback) {
        this.instance = { callback, targets: [], disconnect: vi.fn() };
        instances.push(this.instance);
      }
      observe(target: Element) {
        this.instance.targets.push(target);
      }
      unobserve() {}
      disconnect() {
        this.instance.disconnect();
      }
    }
    vi.stubGlobal('ResizeObserver', FakeObserver);
    return instances;
  }

  const FLEXIBLE: DataGridColumn<Order>[] = [
    { field: 'id', width: 100 },
    { field: 'customer', minWidth: 60 },
    { field: 'total', dataType: 'number', minWidth: 200 },
  ];
  const widthsOf = () => Array.from(grid().querySelectorAll('col')).map((col) => col.style.width);

  it('watches nothing when every column has a width and there is no height', () => {
    const instances = stubObserver();
    render(<Orders />);
    expect(instances).toHaveLength(0);
  });

  it('measures the heading, and only the heading, when there is a height', () => {
    const instances = stubObserver();
    render(<Orders height={300} />);
    expect(instances).toHaveLength(1);
    expect(instances[0]?.targets).toContain(grid().querySelector('thead'));
    expect(instances[0]?.targets).not.toContain(frame());
  });

  it('watches the frame when a column is flexible, and shares the room between those', () => {
    const instances = stubObserver();
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(700);
    render(<Orders columns={FLEXIBLE} />);
    expect(instances).toHaveLength(1);
    expect(instances[0]?.targets).toEqual([frame()]);
    expect(widthsOf()).toEqual(['100px', '300px', '300px']);
    expect(frame().style.getPropertyValue('--flg-data-grid-frame-width')).toBe('700px');
  });

  it('keeps every flexible column at its least width in a narrow frame, and follows a resize', () => {
    const instances = stubObserver();
    const clientWidth = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(700);
    render(<Orders columns={FLEXIBLE} />);
    clientWidth.mockReturnValue(400);
    act(() => instances[0]?.callback([], {} as ResizeObserver));
    expect(widthsOf()).toEqual(['100px', '100px', '200px']);
    expect(frame().style.getPropertyValue('--flg-data-grid-frame-width')).toBe('400px');
    clientWidth.mockReturnValue(300);
    act(() => instances[0]?.callback([], {} as ResizeObserver));
    // 100 + 60 + 200 is the least the table can be; the frame scrolls.
    expect(widthsOf()).toEqual(['100px', '60px', '200px']);
    expect(grid().style.minWidth).toBe('360px');
  });

  it('lets go of the observer and the property when the last flexible column goes', () => {
    const instances = stubObserver();
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(700);
    const { rerender } = render(<Orders columns={FLEXIBLE} />);
    const owner = instances[0];
    rerender(<Orders columns={COLUMNS} />);
    expect(owner?.disconnect).toHaveBeenCalled();
    expect(frame().style.getPropertyValue('--flg-data-grid-frame-width')).toBe('');
    expect(widthsOf()).toEqual(COLUMNS.map((column) => `${column.width}px`));
  });

  it('declares the width of a fixed column as pixels, and of the table at least their sum', () => {
    render(<Orders />);
    expect(widthsOf()).toEqual(['104px', '200px', '140px', '80px', '160px', '80px']);
    expect(grid().style.minWidth).toBe('764px');
  });

  it('makes the table as wide as its columns when none is flexible, and as wide as its frame when one is', () => {
    const { rerender } = render(<Orders />);
    // Spread over a wider frame the widths would be proportions, and not the widths.
    expect(grid().style.width).toBe('764px');
    rerender(<Orders columns={FLEXIBLE} />);
    expect(grid().style.width).toBe('');
  });
});

// Sorting, paging and the server mode (spec phase 6 §6.3). The three orders have quantities 4, 1 and
// 12, so each sort has its own order of ids.
const ids = () => bodyRows().map((row) => row.children[0]!.textContent);
const head = (caption: string) =>
  Array.from(grid().querySelectorAll<HTMLElement>('thead th')).find((th) =>
    th.textContent?.startsWith(caption),
  )!;
const sortButton = (caption: string) => head(caption).querySelector('button')!;
const press = (caption: string, init?: Parameters<typeof fireEvent.click>[1]) =>
  fireEvent.click(sortButton(caption), init);
const BY_QTY_ASC = ['DH-1029', 'DH-1030', 'DH-1028'];
const BY_QTY_DESC = ['DH-1028', 'DH-1030', 'DH-1029'];
const NEWEST_FIRST = ['DH-1030', 'DH-1029', 'DH-1028'];

describe('sorting', () => {
  it('sorts by a title: ascending, descending, then back to the order of the data', () => {
    render(<Orders />);
    expect(ids()).toEqual(NEWEST_FIRST);
    expect(head('Qty')).not.toHaveAttribute('aria-sort');
    press('Qty');
    expect(ids()).toEqual(BY_QTY_ASC);
    expect(head('Qty')).toHaveAttribute('aria-sort', 'ascending');
    press('Qty');
    expect(ids()).toEqual(BY_QTY_DESC);
    expect(head('Qty')).toHaveAttribute('aria-sort', 'descending');
    press('Qty');
    expect(ids()).toEqual(NEWEST_FIRST);
    expect(head('Qty')).not.toHaveAttribute('aria-sort');
  });

  it('makes a plain press on another column the only sort', () => {
    render(<Orders />);
    press('Qty');
    press('Customer');
    expect(head('Qty')).not.toHaveAttribute('aria-sort');
    expect(head('Customer')).toHaveAttribute('aria-sort', 'ascending');
    expect(ids()).toEqual(['DH-1028', 'DH-1030', 'DH-1029']);
  });

  it('draws the title in a button with the arrow of its direction, and the chevrons before', () => {
    render(<Orders />);
    expect(sortButton('Qty')).toHaveClass('flg-table-sort');
    const icon = () => sortButton('Qty').querySelector('.flg-table-sort-icon')!;
    expect(icon().querySelector('svg')).toBeInTheDocument();
    const chevrons = icon().innerHTML;
    press('Qty');
    expect(icon().innerHTML).not.toBe(chevrons);
  });

  it('adds a second level with Shift, turns it with Shift, and removes it after descending', () => {
    render(<Orders />);
    press('Paid');
    press('Qty', { shiftKey: true });
    expect(head('Paid')).toHaveAttribute('aria-sort', 'ascending');
    // Only the first level has aria-sort: a table has one sorted column at a time.
    expect(head('Qty')).not.toHaveAttribute('aria-sort');
    // The unpaid order first, then by quantity inside each group.
    expect(ids()).toEqual(['DH-1029', 'DH-1030', 'DH-1028']);
    press('Qty', { shiftKey: true });
    expect(ids()).toEqual(['DH-1029', 'DH-1028', 'DH-1030']);
    press('Qty', { shiftKey: true });
    expect(head('Paid')).toHaveAttribute('aria-sort', 'ascending');
    expect(grid().querySelector('.flg-data-grid-sort-index')).toBeNull();
  });

  it.each([
    ['Cmd on Apple', 'MacIntel', { metaKey: true }, true],
    ['Ctrl elsewhere', 'Win32', { ctrlKey: true }, true],
    ['Ctrl on Apple', 'MacIntel', { ctrlKey: true }, false],
    ['Cmd elsewhere', 'Win32', { metaKey: true }, false],
  ])('%s adds a level only where it is the modifier (%s)', (_name, platform, init, adds) => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);
    render(<Orders />);
    press('Paid');
    press('Qty', init);
    expect(sortButton('Qty').querySelector('.flg-data-grid-sort-index') !== null).toBe(adds);
    expect(head('Paid').hasAttribute('aria-sort')).toBe(adds);
  });

  it('says the level and the count in hidden words, and draws the number, only with two or more', () => {
    render(<Orders />);
    press('Qty');
    // One column: aria-sort says it all, so there are no more words and no number.
    expect(sortButton('Qty')).toHaveAccessibleName('Qty');
    expect(sortButton('Qty').querySelector('.flg-data-grid-sort-index')).toBeNull();
    press('Total', { shiftKey: true });
    press('Total', { shiftKey: true });
    expect(sortButton('Qty')).toHaveAccessibleName('Qty, sorted ascending, 1 of 2');
    expect(sortButton('Total')).toHaveAccessibleName('Total, sorted descending, 2 of 2');
    const index = sortButton('Total').querySelector('.flg-data-grid-sort-index')!;
    expect(index).toHaveTextContent('2');
    expect(index).toHaveAttribute('aria-hidden', 'true');
    expect(sortButton('Qty').querySelector('.flg-data-grid-sort-index')).toHaveTextContent('1');
  });

  it('leaves a column that cannot be sorted a plain title, with no button and no chevrons', () => {
    render(
      <Orders
        columns={[
          { field: 'id', caption: 'Order', rowHeader: true },
          { field: 'customer', caption: 'Customer', allowSorting: false },
        ]}
      />,
    );
    expect(head('Customer').querySelector('button')).toBeNull();
    expect(head('Customer').querySelector('.flg-table-sort-icon')).toBeNull();
    expect(head('Customer')).toHaveTextContent('Customer');
    expect(head('Order').querySelector('button')).not.toBeNull();
  });

  it('turns sorting off for every column with allowSorting, and a column may say otherwise', () => {
    render(
      <Orders
        allowSorting={false}
        columns={[
          { field: 'id', caption: 'Order', rowHeader: true },
          { field: 'customer', caption: 'Customer', allowSorting: true },
        ]}
      />,
    );
    expect(head('Order').querySelector('button')).toBeNull();
    expect(head('Customer').querySelector('button')).not.toBeNull();
  });

  it('ignores a modifier in single mode, and draws no number', () => {
    render(<Orders sortMode="single" />);
    press('Paid');
    press('Qty', { shiftKey: true });
    expect(head('Paid')).not.toHaveAttribute('aria-sort');
    expect(head('Qty')).toHaveAttribute('aria-sort', 'ascending');
    expect(grid().querySelector('.flg-data-grid-sort-index')).toBeNull();
  });

  it('shows a sort it was given and drops, without a word, an item that sorts nothing', () => {
    const warn = spyWarn();
    render(
      <Orders
        defaultSort={[
          { field: 'nope', direction: 'asc' },
          { field: 'qty', direction: 'desc' },
          { field: 'customer', direction: 'sideways' as 'asc' },
        ]}
      />,
    );
    expect(ids()).toEqual(BY_QTY_DESC);
    expect(head('Qty')).toHaveAttribute('aria-sort', 'descending');
    expect(grid().querySelector('.flg-data-grid-sort-index')).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('cancels the mousedown of a press, not its pointerdown, so no text is selected and the title has the focus', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
    render(<Orders />);
    const button = sortButton('Qty');
    expect(fireEvent.pointerDown(button, { shiftKey: true })).toBe(true);
    expect(fireEvent.mouseDown(button, { shiftKey: true })).toBe(false);
    expect(fireEvent.mouseDown(button)).toBe(false);
    expect(fireEvent.mouseDown(button, { ctrlKey: true })).toBe(false);
    expect(fireEvent.mouseDown(button, { metaKey: true })).toBe(false);
    expect(head('Qty')).toHaveFocus();
    // Another mouse button is not a press.
    expect(fireEvent.mouseDown(button, { shiftKey: true, button: 2 })).toBe(true);
  });

  it('cancels the mousedown in single mode too, where the modifier does nothing', () => {
    render(<Orders sortMode="single" />);
    expect(fireEvent.mouseDown(sortButton('Qty'), { shiftKey: true })).toBe(false);
    expect(head('Qty')).toHaveFocus();
  });

  it('sorts again with the new rows when the data changes, and keeps the sort', () => {
    const { rerender } = render(<Orders />);
    press('Qty');
    rerender(<Orders data={[...ORDERS, { ...ORDERS[0]!, id: 'DH-1099', qty: 2 }]} />);
    expect(ids()).toEqual(['DH-1029', 'DH-1099', 'DH-1030', 'DH-1028']);
  });

  it('merges labels.sortState over the default', () => {
    render(
      <Orders
        labels={{ sortState: (direction, level, count) => `, ${direction}, ${level}/${count}` }}
      />,
    );
    press('Qty');
    expect(sortButton('Qty')).toHaveAccessibleName('Qty, asc, 1/1');
  });
});

describe('announcing a sort', () => {
  const said = () => (root().lastElementChild as HTMLElement).textContent;
  const flush = () => act(() => void vi.advanceTimersByTime(10));
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('says nothing on mount', () => {
    render(<Orders defaultSort={[{ field: 'qty', direction: 'asc' }]} />);
    flush();
    expect(said()).toBe('');
  });

  it('says the whole sort after a press, then, and says when it is cleared', () => {
    render(<Orders />);
    press('Qty');
    flush();
    expect(said()).toBe('Sorted by Qty, ascending');
    press('Total', { shiftKey: true });
    press('Total', { shiftKey: true });
    flush();
    expect(said()).toBe('Sorted by Qty, ascending, then Total, descending');
    // A plain press leaves the one column, and the next takes it off.
    press('Qty');
    press('Qty');
    flush();
    expect(said()).toBe('Sorting cleared');
  });

  it('is not said when a controlled sort changes from the outside', () => {
    const { rerender } = render(<Orders sort={[]} />);
    rerender(<Orders sort={[{ field: 'qty', direction: 'desc' }]} />);
    flush();
    expect(said()).toBe('');
    expect(ids()).toEqual(BY_QTY_DESC);
  });

  it('uses the labels the caller gives', () => {
    render(
      <Orders
        labels={{
          announceSort: (sorted) =>
            sorted.map((item) => `${item.caption}:${item.direction}`).join('+'),
          announceSortCleared: 'No sorting',
        }}
      />,
    );
    press('Qty');
    flush();
    expect(said()).toBe('Qty:asc');
    press('Qty');
    press('Qty');
    flush();
    expect(said()).toBe('No sorting');
  });
});

describe('the state of the sort and the page', () => {
  it('reports a press to onSortChange and then to onStateChange, with the whole state', () => {
    const calls: string[] = [];
    const onSortChange = vi.fn(() => void calls.push('sort'));
    const onStateChange = vi.fn(() => void calls.push('state'));
    render(<Orders onSortChange={onSortChange} onStateChange={onStateChange} />);
    press('Qty');
    expect(calls).toEqual(['sort', 'state']);
    expect(onSortChange).toHaveBeenCalledWith([{ field: 'qty', direction: 'asc' }]);
    expect(onStateChange).toHaveBeenCalledWith(
      {
        sort: [{ field: 'qty', direction: 'asc' }],
        page: { index: 0, size: 20 },
        selectedKeys: [],
      },
      'sort',
    );
  });

  it('keeps a controlled sort the parent does not take, and still reports the press', () => {
    const onSortChange = vi.fn();
    const onStateChange = vi.fn();
    render(
      <Orders
        sort={[{ field: 'qty', direction: 'asc' }]}
        onSortChange={onSortChange}
        onStateChange={onStateChange}
      />,
    );
    press('Qty');
    expect(onSortChange).toHaveBeenCalledWith([{ field: 'qty', direction: 'desc' }]);
    expect(onStateChange.mock.calls[0]?.[0].sort).toEqual([{ field: 'qty', direction: 'desc' }]);
    expect(ids()).toEqual(BY_QTY_ASC);
    expect(head('Qty')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('follows a controlled sort the parent takes', () => {
    function Parent() {
      const [sort, setSort] = useState<readonly DataGridSortItem[]>([]);
      return <Orders sort={sort} onSortChange={setSort} />;
    }
    render(<Parent />);
    press('Qty');
    expect(ids()).toEqual(BY_QTY_ASC);
    press('Qty');
    expect(ids()).toEqual(BY_QTY_DESC);
  });

  it('calls no callback for what it renders, nor for a controlled value that changes', () => {
    const onSortChange = vi.fn();
    const onPageChange = vi.fn();
    const onStateChange = vi.fn();
    const handlers = { onSortChange, onPageChange, onStateChange };
    const { rerender } = render(<Orders {...handlers} />);
    rerender(<Orders {...handlers} sort={[{ field: 'qty', direction: 'asc' }]} />);
    rerender(<Orders {...handlers} sort={[]} page={{ index: 7, size: 2 }} />);
    rerender(<Orders {...handlers} sort={[]} page={{ index: 0, size: 2 }} />);
    expect(onSortChange).not.toHaveBeenCalled();
    expect(onPageChange).not.toHaveBeenCalled();
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it('gives the state the grid shows to getState, JSON only, with the page clamped', () => {
    const ref = createRef<DataGridHandle>();
    render(
      <DataGrid
        ref={ref}
        data={ORDERS}
        rowKey="id"
        columns={COLUMNS}
        caption="Orders"
        defaultSort={[{ field: 'qty', direction: 'desc' }]}
        defaultPage={{ index: 9, size: 2 }}
      />,
    );
    const state = ref.current!.getState();
    expect(state).toEqual({
      sort: [{ field: 'qty', direction: 'desc' }],
      page: { index: 1, size: 2 },
      selectedKeys: [],
    });
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
    press('Qty');
    expect(ref.current!.getState().sort).toEqual([]);
  });
});

function manyOrders(count: number): Order[] {
  return Array.from({ length: count }, (_, index) => ({
    ...ORDERS[0]!,
    id: `DH-${2000 + index}`,
    qty: index,
  }));
}

describe('paging', () => {
  const pager = () => root().querySelector<HTMLElement>('.flg-data-grid-pager');
  const info = () => root().querySelector('.flg-data-grid-page-info')?.textContent;
  const sizeSelect = () => screen.getByRole('combobox', { name: 'Rows per page' });
  const sizeOptions = () =>
    Array.from(pager()!.querySelectorAll<HTMLOptionElement>('select option'))
      .map((option) => option.textContent)
      // The native select has an empty option for "nothing chosen".
      .filter(Boolean);
  const chooseSize = (text: string) =>
    fireEvent.click(
      screen.getAllByRole('option', { name: text, hidden: true }).find((o) => o.id !== '')!,
    );
  const goTo = (page: number) =>
    fireEvent.click(screen.getByRole('button', { name: `Page ${page}` }));

  it('shows 20 rows of 45, the count, the size and the pages', () => {
    render(<Orders data={manyOrders(45)} />);
    expect(bodyRows()).toHaveLength(20);
    expect(ids()[0]).toBe('DH-2000');
    expect(pager()!.previousElementSibling).toBe(root().querySelector('.flg-data-grid-main'));
    expect(info()).toBe('1–20 of 45');
    expect(sizeSelect()).toHaveTextContent('20 / page');
    expect(sizeOptions()).toEqual(['10 / page', '20 / page', '50 / page', '100 / page']);
    const pages = screen.getByRole('navigation', { name: 'Pagination Orders' });
    expect(pages).toContainElement(screen.getByRole('button', { name: 'Page 3' }));
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Previous page' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('goes to a page, and reports it to onPageChange and then onStateChange', () => {
    const onPageChange = vi.fn();
    const onStateChange = vi.fn();
    render(
      <Orders data={manyOrders(45)} onPageChange={onPageChange} onStateChange={onStateChange} />,
    );
    goTo(3);
    expect(ids()[0]).toBe('DH-2040');
    expect(bodyRows()).toHaveLength(5);
    expect(info()).toBe('41–45 of 45');
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith({ index: 2, size: 20 });
    expect(onStateChange).toHaveBeenCalledExactlyOnceWith(
      { sort: [], page: { index: 2, size: 20 }, selectedKeys: [] },
      'page',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(ids()[0]).toBe('DH-2020');
  });

  it.each([
    ['a larger size', 50, 0],
    ['a smaller size', 10, 4],
  ])('keeps the first row of the page on %s, with one onPageChange', (_name, size, index) => {
    const onPageChange = vi.fn();
    render(
      <Orders
        data={manyOrders(135)}
        defaultPage={{ index: 2, size: 20 }}
        onPageChange={onPageChange}
      />,
    );
    expect(ids()[0]).toBe('DH-2040');
    chooseSize(`${size} / page`);
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith({ index, size });
    expect(ids()[0]).toBe(`DH-${2000 + index * size}`);
    expect(bodyRows()).toHaveLength(size);
  });

  it('lists the page sizes it was given and the size in use, ascending, once', () => {
    render(
      <Orders
        data={manyOrders(30)}
        paging={{ pageSize: 15, pageSizes: [50, 10, 50, 0, -4] as number[] }}
      />,
    );
    expect(sizeOptions()).toEqual(['10 / page', '15 / page', '50 / page']);
    expect(bodyRows()).toHaveLength(15);
  });

  it('has no size select without page sizes, and the page size is the one given', () => {
    render(<Orders data={manyOrders(30)} paging={{ pageSize: 12, pageSizes: [] }} />);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(pager()).not.toBeNull();
    expect(info()).toBe('1–12 of 30');
  });

  it('shows the page nearest to one that is out of range, and calls nothing for it', () => {
    const onPageChange = vi.fn();
    const onStateChange = vi.fn();
    render(
      <Orders
        data={manyOrders(45)}
        page={{ index: 99, size: 20 }}
        onPageChange={onPageChange}
        onStateChange={onStateChange}
      />,
    );
    expect(info()).toBe('41–45 of 45');
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
    expect(onPageChange).not.toHaveBeenCalled();
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it('clamps the page when the data shrinks, with no callback', () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<Orders data={manyOrders(45)} onPageChange={onPageChange} />);
    goTo(3);
    onPageChange.mockClear();
    rerender(<Orders data={manyOrders(25)} onPageChange={onPageChange} />);
    expect(info()).toBe('21–25 of 25');
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('keeps the page when the sort changes', () => {
    render(<Orders data={manyOrders(45)} />);
    goTo(2);
    press('Qty');
    press('Qty');
    // Descending by quantity: page 2 holds the rows 21 to 40 of that order.
    expect(info()).toBe('21–40 of 45');
    expect(ids()[0]).toBe('DH-2024');
  });

  it('has no pager when there are no rows, and one page of every row with paging={false}', () => {
    const { rerender } = render(<Orders data={[]} />);
    expect(pager()).toBeNull();
    rerender(<Orders data={manyOrders(45)} paging={false} />);
    expect(bodyRows()).toHaveLength(45);
    expect(pager()).toBeNull();
  });

  it('says its words from labels, and keeps the others in English', () => {
    render(
      <Orders
        data={manyOrders(45)}
        labels={{
          pageInfo: (from, to, total) => `${from} bis ${to} von ${total}`,
          rowsPerPage: 'Zeilen pro Seite',
          pageSize: (n) => `${n} Zeilen`,
          pagination: 'Seiten',
          previousPage: 'Zurück',
          nextPage: 'Weiter',
          page: (n) => `Seite ${n}`,
        }}
      />,
    );
    expect(info()).toBe('1 bis 20 von 45');
    expect(screen.getByRole('combobox', { name: 'Zeilen pro Seite' })).toHaveTextContent(
      '20 Zeilen',
    );
    expect(screen.getByRole('navigation', { name: 'Seiten Orders' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Seite 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zurück' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'Orders' })).toBeInTheDocument();
  });

  it('names the pages with the caption, so two grids on a page have two landmarks that differ', () => {
    render(
      <>
        <Orders data={manyOrders(45)} caption="Orders" />
        <Orders data={manyOrders(45)} caption="Refunds" />
      </>,
    );
    expect(screen.getAllByRole('navigation')).toHaveLength(2);
    expect(screen.getByRole('navigation', { name: 'Pagination Orders' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Pagination Refunds' })).toBeInTheDocument();
  });

  it('names the pages with labels.pagination alone when there is no caption', () => {
    render(<Orders data={manyOrders(45)} caption={undefined} aria-label="Orders" />);
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(nav).toHaveAttribute('aria-label', 'Pagination');
    expect(nav).not.toHaveAttribute('aria-labelledby');
  });

  it('leaves the page as it is held with paging off, and does not change it with the data', () => {
    const ref = createRef<DataGridHandle>();
    const grid_ = (data: Order[], page?: { index: number; size: number }) => (
      <DataGrid
        ref={ref}
        data={data}
        rowKey="id"
        columns={COLUMNS}
        caption="Orders"
        paging={false}
        page={page}
      />
    );
    const { rerender } = render(grid_(manyOrders(45)));
    expect(ref.current!.getState().page).toEqual({ index: 0, size: 20 });
    rerender(grid_(manyOrders(5)));
    expect(ref.current!.getState().page).toEqual({ index: 0, size: 20 });
    rerender(grid_(manyOrders(5), { index: 7, size: 12 }));
    expect(ref.current!.getState().page).toEqual({ index: 7, size: 12 });
    expect(bodyRows()).toHaveLength(5);
  });

  it('keeps a controlled page the parent does not take', () => {
    const onPageChange = vi.fn();
    render(
      <Orders data={manyOrders(45)} page={{ index: 0, size: 20 }} onPageChange={onPageChange} />,
    );
    goTo(2);
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith({ index: 1, size: 20 });
    expect(ids()[0]).toBe('DH-2000');
  });
});

describe('server mode', () => {
  const pageInfo = () => root().querySelector('.flg-data-grid-page-info')?.textContent;

  it('shows the data in the order it came, whatever the sort, and says the sort in the header', () => {
    const onSortChange = vi.fn();
    render(<Orders remote totalCount={135} onSortChange={onSortChange} />);
    press('Qty');
    expect(ids()).toEqual(NEWEST_FIRST);
    expect(head('Qty')).toHaveAttribute('aria-sort', 'ascending');
    expect(onSortChange).toHaveBeenCalledExactlyOnceWith([{ field: 'qty', direction: 'asc' }]);
    press('Qty');
    expect(head('Qty')).toHaveAttribute('aria-sort', 'descending');
  });

  it('counts totalCount, and shows every row it was given, not a page of them', () => {
    const onPageChange = vi.fn();
    render(
      <Orders
        remote
        totalCount={135}
        paging={{ pageSize: 2, pageSizes: [2, 5] }}
        onPageChange={onPageChange}
      />,
    );
    expect(bodyRows()).toHaveLength(3);
    expect(pageInfo()).toBe('1–2 of 135');
    expect(screen.getByRole('button', { name: 'Page 68' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith({ index: 1, size: 2 });
    expect(ids()).toEqual(NEWEST_FIRST);
    expect(pageInfo()).toBe('3–4 of 135');
  });

  it('warns once, after mount, for a count that is missing, and counts the rows it has', () => {
    const warn = spyWarn();
    const { rerender } = render(<Orders remote />);
    rerender(<Orders remote />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('totalCount');
    expect(pageInfo()).toBe('1–3 of 3');
    warn.mockClear();
    resetDevWarnings();
    rerender(<Orders remote totalCount={9} />);
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn for a grid that is not remote and has no count', () => {
    const warn = spyWarn();
    render(<Orders />);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('the title of a sorted column', () => {
  it('has data-sorted on every level, and aria-sort on the first only', () => {
    render(
      <Orders
        defaultSort={[
          { field: 'date', direction: 'desc' },
          { field: 'total', direction: 'asc' },
        ]}
      />,
    );
    const titles = Array.from(grid().querySelectorAll<HTMLElement>('thead th'));
    const by = (caption: string) => titles.find((th) => th.textContent?.startsWith(caption))!;
    // The look of a sorted title (the text colour, the accent of its arrow) is for every level; ARIA
    // allows `aria-sort` on one title only, so the look cannot hang on it.
    expect(by('Order date')).toHaveAttribute('data-sorted');
    expect(by('Order date')).toHaveAttribute('aria-sort', 'descending');
    expect(by('Total')).toHaveAttribute('data-sorted');
    expect(by('Total')).not.toHaveAttribute('aria-sort');
    expect(by('Qty')).not.toHaveAttribute('data-sorted');
  });
});

// Props of a shape the types forbid may still come: from JavaScript, or from a state a person saved
// (spec phase 6 §5). The grid never throws on them; it uses the safe part, and says so once in
// development, with no value in the words. What §5 says to ignore (an unknown column, a direction it
// does not know, a key that names no row, a page out of range) is ignored without a word.
describe('props of a shape the types forbid', () => {
  const bad = (value: unknown) => value as never;
  const warnings = (warn: Mock) => warn.mock.calls.map(([message]) => String(message));
  const pageInfo = () => root().querySelector('.flg-data-grid-page-info')?.textContent;
  const sizes = () =>
    Array.from(root().querySelectorAll<HTMLOptionElement>('.flg-data-grid-pager select option'))
      .map((option) => option.textContent)
      .filter(Boolean);
  // Not through `Orders` when there is a ref: a function component takes no ref in React 18.
  const Handled = ({
    gridRef,
    ...props
  }: Partial<DataGridProps<Order>> & { gridRef: Ref<DataGridHandle> }) => (
    <DataGrid
      ref={gridRef}
      data={ORDERS}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      {...props}
    />
  );

  it.each([null, { length: 2 }, 'DH-1030'])('shows no row for data %j, and warns once', (data) => {
    const warn = spyWarn();
    const error = spyError();
    render(<Orders data={bad(data)} />);
    expect(grid().querySelectorAll('tbody > tr.flg-data-grid-row')).toHaveLength(0);
    expect(bodyRows()[0]).toHaveClass('flg-data-grid-empty');
    expect(warnings(warn)).toEqual([expect.stringContaining('data is not an array')]);
    expect(error).not.toHaveBeenCalled();
  });

  it.each([null, { id: 'id' }])('has no column for columns %j, and warns once', (columns) => {
    const warn = spyWarn();
    render(<Orders columns={bad(columns)} />);
    expect(grid().querySelectorAll('thead th')).toHaveLength(0);
    expect(warnings(warn)).toEqual([expect.stringContaining('columns is not an array')]);
  });

  it('leaves out a column that is not an object, as it does one with no field', () => {
    const warn = spyWarn();
    render(<Orders columns={bad([null, ...COLUMNS, 'paid'])} />);
    expect(grid().querySelectorAll('thead th')).toHaveLength(COLUMNS.length);
    expect(warnings(warn)).toEqual([expect.stringContaining('neither a field nor an id')]);
  });

  it.each([true, 'yes', 0, null])(
    'uses the default paging for paging %j, and warns once',
    (paging) => {
      const warn = spyWarn();
      render(<Orders data={manyOrders(45)} paging={bad(paging)} />);
      expect(bodyRows()).toHaveLength(20);
      expect(pageInfo()).toBe('1–20 of 45');
      expect(warnings(warn)).toEqual([
        expect.stringContaining('paging is neither false nor an object'),
      ]);
    },
  );

  it.each([null, 'all', { 0: 10 }])(
    'offers the default sizes for pageSizes %j, and warns once',
    (given) => {
      const warn = spyWarn();
      render(<Orders data={manyOrders(45)} paging={{ pageSize: 12, pageSizes: bad(given) }} />);
      expect(bodyRows()).toHaveLength(12);
      expect(sizes()).toEqual(['10 / page', '12 / page', '20 / page', '50 / page', '100 / page']);
      expect(warnings(warn)).toEqual([expect.stringContaining('pageSizes is not an array')]);
    },
  );

  it('uses the default size for a pageSize that is not a number, and warns once', () => {
    const warn = spyWarn();
    render(<Orders data={manyOrders(45)} paging={{ pageSize: bad('12') }} />);
    expect(bodyRows()).toHaveLength(20);
    expect(warnings(warn)).toEqual([expect.stringContaining('pageSize is not a number')]);
  });

  it('uses the default size for a pageSize that is a number but not whole, without a word', () => {
    const warn = spyWarn();
    render(<Orders data={manyOrders(45)} paging={{ pageSize: 0 }} />);
    expect(bodyRows()).toHaveLength(20);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each(['sort', 'defaultSort'] as const)(
    'has no sort for a %s that is not an array, and warns once',
    (prop) => {
      const warn = spyWarn();
      render(<Orders {...{ [prop]: bad({ field: 'qty', direction: 'asc' }) }} />);
      expect(ids()).toEqual(NEWEST_FIRST);
      expect(warnings(warn)).toEqual([expect.stringContaining(`${prop} is not an array of`)]);
    },
  );

  it.each(['sort', 'defaultSort'] as const)(
    'sorts by the items of a %s and leaves out what is not one, with one warning',
    (prop) => {
      const warn = spyWarn();
      const onSortChange = vi.fn();
      render(
        <Orders
          onSortChange={onSortChange}
          {...{ [prop]: bad([null, 'qty', { field: 'qty', direction: 'asc' }]) }}
        />,
      );
      expect(ids()).toEqual(BY_QTY_ASC);
      expect(warnings(warn)).toEqual([expect.stringContaining(`${prop} is not an array of`)]);
      // A press builds on the sort that is shown.
      press('Qty');
      expect(onSortChange).toHaveBeenLastCalledWith([{ field: 'qty', direction: 'desc' }]);
    },
  );

  it('ignores an item of sort it does not know, without a word, as a saved state may hold one', () => {
    const warn = spyWarn();
    render(
      <Orders
        sort={[
          { field: 'gone', direction: 'asc' },
          { field: 'qty', direction: bad('sideways') },
          { field: 'qty', direction: 'asc' },
        ]}
      />,
    );
    expect(ids()).toEqual(BY_QTY_ASC);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each(['page', 'defaultPage'] as const)(
    'shows the first page for a %s that is not an object, and warns once',
    (prop) => {
      const warn = spyWarn();
      const ref = createRef<DataGridHandle>();
      render(<Handled gridRef={ref} data={manyOrders(45)} {...{ [prop]: bad(null) }} />);
      expect(pageInfo()).toBe('1–20 of 45');
      expect(ref.current!.getState().page).toEqual({ index: 0, size: 20 });
      expect(warnings(warn)).toEqual([expect.stringContaining(`${prop} is not an object`)]);
    },
  );

  it('takes the part of a page that is a number, and warns once for the other', () => {
    const warn = spyWarn();
    const ref = createRef<DataGridHandle>();
    render(
      <Handled
        gridRef={ref}
        data={manyOrders(45)}
        paging={{ pageSize: 10 }}
        page={bad({ index: 2, size: '5' })}
      />,
    );
    expect(pageInfo()).toBe('21–30 of 45');
    expect(ref.current!.getState().page).toEqual({ index: 2, size: 10 });
    expect(warnings(warn)).toEqual([expect.stringContaining('page is not an object')]);
  });

  it('clamps a page out of range, or not whole, without a word', () => {
    const warn = spyWarn();
    render(<Orders data={manyOrders(45)} page={{ index: Number.NaN, size: 2.5 }} />);
    expect(pageInfo()).toBe('1–20 of 45');
    expect(warn).not.toHaveBeenCalled();
  });

  it.each(['selectedKeys', 'defaultSelectedKeys'] as const)(
    'chooses nothing for a %s that is not an array, and warns once',
    (prop) => {
      const warn = spyWarn();
      render(<Orders selectionMode="multiple" {...{ [prop]: bad({ 'DH-1030': true }) }} />);
      expect(grid().querySelectorAll('tbody > tr[aria-selected="true"]')).toHaveLength(0);
      expect(warnings(warn)).toEqual([expect.stringContaining(`${prop} is not an array of`)]);
    },
  );

  it.each(['selectedKeys', 'defaultSelectedKeys'] as const)(
    'reads %s as keys, not as the letters of a string, and leaves out what is not a key',
    (prop) => {
      const warn = spyWarn();
      const onSelectedKeysChange = vi.fn();
      const { unmount } = render(
        <Orders selectionMode="multiple" {...{ [prop]: bad('DH-1030') }} />,
      );
      expect(grid().querySelectorAll('tbody > tr[aria-selected="true"]')).toHaveLength(0);
      unmount();
      render(
        <Orders
          selectionMode="multiple"
          onSelectedKeysChange={onSelectedKeysChange}
          {...{ [prop]: bad([null, { id: 'DH-1029' }, 'DH-1030']) }}
        />,
      );
      expect(bodyRows().map((row) => row.getAttribute('aria-selected'))).toEqual([
        'true',
        'false',
        'false',
      ]);
      expect(warnings(warn)).toEqual([expect.stringContaining(`${prop} is not an array of`)]);
      fireEvent.click(cell(1, 0).querySelector('input')!);
      expect(onSelectedKeysChange).toHaveBeenLastCalledWith(['DH-1030', 'DH-1029']);
    },
  );

  it('keeps keys that name no row, without a word, as a saved state may hold them', () => {
    const warn = spyWarn();
    render(<Orders selectionMode="multiple" selectedKeys={['DH-1', 7, 'DH-1030']} />);
    expect(grid().querySelectorAll('tbody > tr[aria-selected="true"]')).toHaveLength(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it('keeps the identity of props that are of their shape, so nothing is done again for them', () => {
    const sort: DataGridSortItem[] = [{ field: 'qty', direction: 'asc' }];
    const ref = createRef<DataGridHandle>();
    render(<Handled gridRef={ref} sort={sort} />);
    expect(ref.current!.getState().sort).toBe(sort);
  });
});
