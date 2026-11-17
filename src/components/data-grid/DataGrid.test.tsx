import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode, createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import type { Mock } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridHandle, DataGridProps } from './index';

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
    expect(frame()).not.toHaveAttribute('tabindex');
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

  it('shows no row for no data, and keeps the header', () => {
    render(<Orders data={[]} />);
    expect(bodyRows()).toHaveLength(0);
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

  it('does not read every key again when only the rowKey function is new', () => {
    const key = vi.fn((row: Order) => row.id);
    const { rerender } = render(<Orders rowKey={(row) => key(row)} />);
    const reads = key.mock.calls.length;
    expect(reads).toBeGreaterThanOrEqual(3);
    rerender(<Orders rowKey={(row) => key(row)} caption="Again" />);
    rerender(<Orders rowKey={(row) => key(row)} caption="Once more" />);
    expect(key).toHaveBeenCalledTimes(reads);
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
