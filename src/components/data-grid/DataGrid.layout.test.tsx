import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type {
  DataGridColumn,
  DataGridColumnLayout,
  DataGridHandle,
  DataGridProps,
  DataGridSortItem,
} from './index';

// The layout of the columns (spec phase 6 §6.3 "Cột (Plan C)"): where it starts, what a controlled
// layout shows, what is dropped without a word, and what a hidden column does to the sort and to the
// keyboard.

beforeEach(() => {
  resetDevWarnings();
  // jsdom has no layout, so every element would count as hidden to the code that looks for the
  // controls of a cell.
  HTMLElement.prototype.checkVisibility = () => true;
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
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
  { field: 'total', caption: 'Total', dataType: 'number', width: 120 },
];
const IDS = ['id', 'customer', 'qty', 'total'];

const layout = (parts: Partial<DataGridColumnLayout> = {}): DataGridColumnLayout => ({
  order: IDS,
  widths: { id: 104, customer: 200, qty: 80, total: 120 },
  hidden: [],
  pinned: {},
  ...parts,
});

function Orders(props: Partial<DataGridProps<Order>> & { gridRef?: React.Ref<DataGridHandle> }) {
  const { gridRef, ...rest } = props;
  return (
    <DataGrid
      ref={gridRef}
      data={ORDERS}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      {...rest}
    />
  );
}

const grid = () => screen.getByRole('grid');
const captions = () =>
  Array.from(grid().querySelectorAll('thead th.flg-data-grid-head'), (th) => th.textContent);
const bodyRows = () => Array.from(grid().querySelectorAll<HTMLElement>('tbody > tr'));
const ids = () => bodyRows().map((row) => row.children[0]!.textContent);
const head = (caption: string) =>
  Array.from(grid().querySelectorAll<HTMLElement>('thead th')).find((th) =>
    th.textContent?.startsWith(caption),
  )!;
const widths = () =>
  Array.from(grid().querySelectorAll<HTMLElement>('colgroup > col'), (col) => col.style.width);
const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
const warnings = (warn: Mock) => warn.mock.calls.map(([message]) => String(message));

describe('where the layout starts', () => {
  it('is the columns as given: their order, widths, pins and the ones that are hidden', () => {
    const ref = createRef<DataGridHandle>();
    render(
      <Orders
        gridRef={ref}
        columns={[
          COLUMNS[0]!,
          { ...COLUMNS[1]!, visible: false },
          { ...COLUMNS[2]!, pinned: 'right' },
          { ...COLUMNS[3]!, pinned: 'left' },
        ]}
      />,
    );
    expect(captions()).toEqual(['Total', 'Order', 'Qty']);
    expect(ref.current!.getState().columnLayout).toEqual({
      order: IDS,
      widths: { id: 104, customer: 200, qty: 80, total: 120 },
      hidden: ['customer'],
      pinned: { qty: 'right', total: 'left' },
    });
  });

  it('is the state a grid with no layout says, JSON only', () => {
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} />);
    const state = ref.current!.getState();
    expect(state.columnLayout).toEqual(layout());
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  // Qty says `visible: false` here: the part a default layout gives replaces the columns' own, whole.
  const HIDES_QTY = [COLUMNS[0]!, COLUMNS[1]!, { ...COLUMNS[2]!, visible: false }, COLUMNS[3]!];

  it('lets a defaultColumnLayout order replace the order of the columns', () => {
    render(<Orders defaultColumnLayout={{ order: ['total', 'id', 'qty', 'customer'] }} />);
    expect(captions()).toEqual(['Total', 'Order', 'Qty', 'Customer']);
  });

  it('lets a defaultColumnLayout hidden replace the columns own visible, in both directions', () => {
    const { unmount } = render(<Orders columns={HIDES_QTY} />);
    expect(captions()).toEqual(['Order', 'Customer', 'Total']);
    unmount();
    render(<Orders columns={HIDES_QTY} defaultColumnLayout={{ hidden: ['total'] }} />);
    expect(captions()).toEqual(['Order', 'Customer', 'Qty']);
  });

  it('lets a defaultColumnLayout pinned replace the columns own pins', () => {
    render(
      <Orders
        columns={[{ ...COLUMNS[0]!, pinned: 'right' }, ...COLUMNS.slice(1)]}
        defaultColumnLayout={{ pinned: { total: 'left' } }}
      />,
    );
    expect(captions()).toEqual(['Total', 'Order', 'Customer', 'Qty']);
  });

  it('lets a defaultColumnLayout of widths replace the widths of the columns', () => {
    render(<Orders defaultColumnLayout={{ widths: { customer: 260, qty: 90 } }} />);
    // An entry of the layout wins over the own width of its column; a column with no entry keeps it.
    expect(widths().slice(0, 4)).toEqual(['104px', '260px', '90px', '120px']);
  });

  it('does not start again from a later defaultColumnLayout, nor from a later change of a column', () => {
    const { rerender } = render(<Orders defaultColumnLayout={{ hidden: ['qty'] }} />);
    expect(captions()).toEqual(['Order', 'Customer', 'Total']);
    rerender(
      <Orders
        defaultColumnLayout={{ hidden: [] }}
        columns={[
          { ...COLUMNS[0]!, visible: false, pinned: 'right' },
          ...COLUMNS.slice(1, 3),
          { ...COLUMNS[3]!, width: 300 },
        ]}
      />,
    );
    // The layout knows every column: their own `visible`, `pinned` and `width` no longer count.
    expect(captions()).toEqual(['Order', 'Customer', 'Total']);
    expect(widths().slice(0, 3)).toEqual(['104px', '200px', '120px']);
  });

  it('lays out by defaultColumnLayout the columns that come after mount', () => {
    // The column config comes from a request: the first render has none.
    const ref = createRef<DataGridHandle>();
    const start = {
      hidden: ['qty'],
      pinned: { total: 'left' as const },
      widths: { customer: 260 },
    };
    const { rerender } = render(<Orders gridRef={ref} columns={[]} defaultColumnLayout={start} />);
    rerender(<Orders gridRef={ref} columns={COLUMNS} defaultColumnLayout={start} />);
    expect(captions()).toEqual(['Total', 'Order', 'Customer']);
    expect(widths().slice(0, 3)).toEqual(['120px', '104px', '260px']);
    expect(ref.current!.getState().columnLayout).toEqual({
      order: IDS,
      widths: { id: 104, customer: 260, qty: 80, total: 120 },
      hidden: ['qty'],
      pinned: { total: 'left' },
    });
  });

  it('puts a column the layout does not know at the end of its zone, with its own values', () => {
    const extra: DataGridColumn<Order> = {
      field: 'customer',
      id: 'who',
      caption: 'Who',
      width: 90,
    };
    const ref = createRef<DataGridHandle>();
    const { rerender } = render(<Orders gridRef={ref} />);
    rerender(<Orders gridRef={ref} columns={[...COLUMNS, extra]} />);
    expect(captions()).toEqual(['Order', 'Customer', 'Qty', 'Total', 'Who']);
    expect(ref.current!.getState().columnLayout.order).toEqual([...IDS, 'who']);
    expect(ref.current!.getState().columnLayout.widths.who).toBe(90);
    rerender(<Orders gridRef={ref} columns={[...COLUMNS, { ...extra, pinned: 'left' }]} />);
    expect(captions()).toEqual(['Who', 'Order', 'Customer', 'Qty', 'Total']);
    rerender(<Orders gridRef={ref} columns={[...COLUMNS, { ...extra, visible: false }]} />);
    expect(captions()).toEqual(['Order', 'Customer', 'Qty', 'Total']);
  });
});

describe('a controlled layout', () => {
  it('shows the layout it is given: the order, the widths, the hidden and the pinned', () => {
    render(
      <Orders
        columnLayout={layout({
          order: ['total', 'qty', 'customer', 'id'],
          widths: { total: 150, qty: 70 },
          hidden: ['customer'],
          pinned: { id: 'left' },
        })}
      />,
    );
    expect(captions()).toEqual(['Order', 'Total', 'Qty']);
    // Order is pinned and has no entry: it keeps its own width.
    expect(widths().slice(0, 3)).toEqual(['104px', '150px', '70px']);
  });

  it('follows the layout when the parent gives another, and calls nothing for it', () => {
    const onColumnLayoutChange = vi.fn();
    const onStateChange = vi.fn();
    const handlers = { onColumnLayoutChange, onStateChange };
    const { rerender } = render(<Orders {...handlers} columnLayout={layout()} />);
    rerender(
      <Orders
        {...handlers}
        columnLayout={layout({ order: ['qty', ...IDS.filter((i) => i !== 'qty')] })}
      />,
    );
    expect(captions()).toEqual(['Qty', 'Order', 'Customer', 'Total']);
    rerender(<Orders {...handlers} columnLayout={layout({ hidden: ['id'] })} />);
    expect(captions()).toEqual(['Customer', 'Qty', 'Total']);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it('follows a hidden list that repeated an id to another list of the same length', () => {
    // A layout read back from storage may repeat an id: the next one is not the same for that.
    const { rerender } = render(<Orders columnLayout={layout({ hidden: ['qty', 'qty'] })} />);
    expect(captions()).toEqual(['Order', 'Customer', 'Total']);
    rerender(<Orders columnLayout={layout({ hidden: ['qty', 'customer'] })} />);
    expect(captions()).toEqual(['Order', 'Total']);
  });

  it('gives getState the layout as shown: new columns appended, gone ids dropped, widths held', () => {
    const ref = createRef<DataGridHandle>();
    render(
      <Orders
        gridRef={ref}
        columnLayout={{
          order: ['total', 'gone', 'id', 'qty'],
          widths: { total: 9000, qty: 10, gone: 50 },
          hidden: ['gone'],
          pinned: { gone: 'left', id: 'right' },
        }}
      />,
    );
    expect(ref.current!.getState().columnLayout).toEqual({
      order: ['total', 'id', 'qty', 'customer'],
      widths: { id: 104, total: 2000, qty: 60, customer: 200 },
      hidden: [],
      pinned: { id: 'right' },
    });
    expect(captions()).toEqual(['Total', 'Qty', 'Customer', 'Order']);
  });

  it('says nothing about what a saved layout may hold: ids of no column, repeats, bad pins and widths', () => {
    const warn = spyWarn();
    render(
      <Orders
        columnLayout={{
          order: ['id', 'id', 'flg:select', 'nope', 'customer', 'qty', 'total'],
          widths: { nope: 50, id: 5, customer: 99999 },
          hidden: ['nope', 'nope'],
          pinned: { nope: 'left', id: 'top', qty: 7 } as never,
        }}
      />,
    );
    expect(captions()).toEqual(['Order', 'Customer', 'Qty', 'Total']);
    expect(warn).not.toHaveBeenCalled();
  });

  it('shows the first column in the order when every column is hidden', () => {
    const warn = spyWarn();
    render(<Orders columnLayout={layout({ order: ['qty', ...IDS], hidden: IDS })} />);
    expect(captions()).toEqual(['Qty']);
    expect(warn).not.toHaveBeenCalled();
  });

  it('shows no column for no column, and does not throw', () => {
    render(<Orders columns={[]} columnLayout={layout({ hidden: ['id'] })} />);
    expect(captions()).toEqual([]);
  });
});

describe('props of a shape the types forbid', () => {
  const bad = (value: unknown) => value as never;

  it.each(['columnLayout', 'defaultColumnLayout'])(
    'uses a %s that is not an object as none, and warns once',
    (prop) => {
      const warn = spyWarn();
      const { rerender } = render(<Orders {...{ [prop]: bad('wide') }} />);
      rerender(<Orders {...{ [prop]: bad(7) }} />);
      expect(captions()).toEqual(['Order', 'Customer', 'Qty', 'Total']);
      expect(warnings(warn)).toEqual([expect.stringContaining(`${prop} is not an object`)]);
    },
  );

  it.each(['columnLayout', 'defaultColumnLayout'] as const)(
    'uses the safe part for each part of %s of the wrong kind, and warns once for the prop',
    (prop) => {
      const warn = spyWarn();
      render(
        <Orders
          {...{
            [prop]: bad({
              order: 'id,customer',
              widths: [100, 200],
              hidden: [3, 'qty', null],
              pinned: 'left',
            }),
          }}
        />,
      );
      // `order` is empty, so every column is new and goes in array order; the strings of `hidden` still
      // say which of them are hidden, for a controlled layout as for a default one.
      expect(captions()).toEqual(['Order', 'Customer', 'Total']);
      expect(warnings(warn)).toEqual([expect.stringContaining(`${prop} is not an object`)]);
    },
  );

  it('warns for a width that is not a number, and drops that entry', () => {
    const warn = spyWarn();
    render(<Orders columnLayout={bad({ ...layout(), widths: { id: '104', customer: 150 } })} />);
    expect(widths().slice(0, 2)).toEqual(['104px', '150px']);
    expect(warnings(warn)).toEqual([expect.stringContaining('columnLayout is not an object')]);
  });

  it('keeps a layout of its shape as it came, so nothing is done again for it', () => {
    const given = layout();
    const ref = createRef<DataGridHandle>();
    const { rerender } = render(<Orders gridRef={ref} columnLayout={given} />);
    const shown = ref.current!.getState().columnLayout;
    rerender(<Orders gridRef={ref} columnLayout={given} />);
    expect(ref.current!.getState().columnLayout).toBe(shown);
  });

  it('keeps the shown layout while an inline layout says the same', () => {
    const ref = createRef<DataGridHandle>();
    const { rerender } = render(<Orders gridRef={ref} columnLayout={layout()} />);
    const shown = ref.current!.getState().columnLayout;
    rerender(<Orders gridRef={ref} columnLayout={layout()} />);
    expect(ref.current!.getState().columnLayout).toBe(shown);
  });
});

describe('a column that is hidden', () => {
  const SORT: DataGridSortItem[] = [
    { field: 'qty', direction: 'desc' },
    { field: 'customer', direction: 'asc' },
  ];
  const buttonName = (caption: string) => head(caption).querySelector('button')!;

  it('sorts nothing: the rows follow the next level, and the state keeps its item', () => {
    const ref = createRef<DataGridHandle>();
    const { rerender } = render(
      <Orders gridRef={ref} defaultSort={SORT} columnLayout={layout()} />,
    );
    // Quantities 12, 4, 1.
    expect(ids()).toEqual(['DH-1028', 'DH-1030', 'DH-1029']);
    expect(buttonName('Customer')).toHaveAccessibleName('Customer, sorted ascending, 2 of 2');

    rerender(
      <Orders gridRef={ref} defaultSort={SORT} columnLayout={layout({ hidden: ['qty'] })} />,
    );
    // The customers are Lê An, Nguyễn Minh, Trần Hải.
    expect(ids()).toEqual(['DH-1028', 'DH-1030', 'DH-1029']);
    expect(head('Customer')).toHaveAttribute('aria-sort', 'ascending');
    // One level is shown, so there is nothing to number: no "2" without a "1".
    expect(buttonName('Customer')).toHaveAccessibleName('Customer');
    expect(ref.current!.getState().sort).toEqual(SORT);

    rerender(<Orders gridRef={ref} defaultSort={SORT} columnLayout={layout()} />);
    expect(ids()).toEqual(['DH-1028', 'DH-1030', 'DH-1029']);
    expect(head('Qty')).toHaveAttribute('aria-sort', 'descending');
    expect(buttonName('Customer')).toHaveAccessibleName('Customer, sorted ascending, 2 of 2');
  });

  it('gives the rows the order of the level that is shown', () => {
    const { rerender } = render(
      <Orders
        defaultSort={[
          { field: 'qty', direction: 'asc' },
          { field: 'total', direction: 'desc' },
        ]}
        columnLayout={layout()}
      />,
    );
    expect(ids()).toEqual(['DH-1029', 'DH-1030', 'DH-1028']);
    rerender(
      <Orders
        defaultSort={[
          { field: 'qty', direction: 'asc' },
          { field: 'total', direction: 'desc' },
        ]}
        columnLayout={layout({ hidden: ['qty'] })}
      />,
    );
    // By total, descending: 15.4M, 1.25M, 0.89M.
    expect(ids()).toEqual(['DH-1028', 'DH-1030', 'DH-1029']);
    expect(head('Total')).toHaveAttribute('aria-sort', 'descending');
  });

  it('does not sort again when only the order of the columns changes', () => {
    const sortValue = vi.fn((row: Order) => row.qty);
    const columns: DataGridColumn<Order>[] = [
      COLUMNS[0]!,
      { ...COLUMNS[2]!, sortValue },
      COLUMNS[1]!,
    ];
    const defaultSort: DataGridSortItem[] = [{ field: 'qty', direction: 'asc' }];
    const { rerender } = render(
      <Orders
        columns={columns}
        defaultSort={defaultSort}
        columnLayout={layout({ order: ['id', 'qty', 'customer'] })}
      />,
    );
    const calls = sortValue.mock.calls.length;
    expect(calls).toBeGreaterThan(0);
    rerender(
      <Orders
        columns={columns}
        defaultSort={defaultSort}
        columnLayout={layout({ order: ['qty', 'id', 'customer'] })}
      />,
    );
    expect(captions()).toEqual(['Qty', 'Order', 'Customer']);
    expect(sortValue.mock.calls.length).toBe(calls);
  });
});

describe('the keyboard when the columns change', () => {
  const stops = () => Array.from(grid().querySelectorAll<HTMLElement>('[tabindex="0"]'));
  const focusOn = (element: HTMLElement) => act(() => element.focus());

  it('keeps the place on its column when the column moves', () => {
    const { rerender } = render(<Orders columnLayout={layout()} />);
    const qty = bodyRows()[1]!.children[2] as HTMLElement;
    focusOn(qty);
    expect(stops()).toEqual([qty]);
    rerender(<Orders columnLayout={layout({ order: ['qty', 'id', 'customer', 'total'] })} />);
    expect(stops()).toEqual([bodyRows()[1]!.children[0]]);
    expect(stops()[0]!.textContent).toBe('1');
  });

  it('moves the place of a column that is hidden to the column now at its index', () => {
    const { rerender } = render(<Orders columnLayout={layout()} />);
    focusOn(bodyRows()[1]!.children[1] as HTMLElement);
    rerender(<Orders columnLayout={layout({ hidden: ['customer'] })} />);
    // Customer was the second column; Qty is now the second.
    expect(stops()).toEqual([bodyRows()[1]!.children[1]]);
    expect(stops()[0]!.textContent).toBe('1');
    // And again, from the last column: the place goes to the new last one.
    focusOn(bodyRows()[1]!.children[2] as HTMLElement);
    rerender(<Orders columnLayout={layout({ hidden: ['customer', 'total'] })} />);
    expect(stops()).toEqual([bodyRows()[1]!.children[1]]);
    expect(stops()[0]!.textContent).toBe('1');
  });

  it('moves the place of a title that is hidden the same way', () => {
    const { rerender } = render(<Orders columnLayout={layout()} />);
    focusOn(head('Customer'));
    expect(stops()).toEqual([head('Customer')]);
    rerender(<Orders columnLayout={layout({ hidden: ['customer'] })} />);
    expect(stops()).toEqual([head('Qty')]);
    rerender(<Orders columnLayout={layout({ hidden: ['customer', 'qty', 'total'] })} />);
    expect(stops()).toEqual([head('Order')]);
  });

  it('keeps the focus on the cell when a new layout moves its column', () => {
    const { rerender } = render(<Orders columnLayout={layout()} />);
    const qty = bodyRows()[0]!.children[2] as HTMLElement;
    focusOn(qty);
    expect(document.activeElement).toBe(qty);
    rerender(<Orders columnLayout={layout({ order: ['qty', 'id', 'customer', 'total'] })} />);
    const now = document.activeElement as HTMLElement;
    expect(grid().contains(now)).toBe(true);
    expect(now).toBe(bodyRows()[0]!.children[0]);
    expect(now.textContent).toBe('4');
    expect(now).toHaveAttribute('tabindex', '0');
  });

  it('keeps the focus in the grid when the column it is on is hidden', () => {
    const { rerender } = render(<Orders columnLayout={layout()} />);
    focusOn(bodyRows()[0]!.children[1] as HTMLElement);
    rerender(<Orders columnLayout={layout({ hidden: ['customer'] })} />);
    expect(grid().contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(bodyRows()[0]!.children[1]);
  });

  it('keeps the focus on a title when its column moves', () => {
    const { rerender } = render(<Orders columnLayout={layout()} />);
    focusOn(head('Total'));
    rerender(<Orders columnLayout={layout({ order: ['total', 'id', 'customer', 'qty'] })} />);
    expect(document.activeElement).toBe(head('Total'));
  });

  it('goes on from the column the place is on, wherever it is now: ArrowRight is the next on the screen', () => {
    const { rerender } = render(<Orders columnLayout={layout()} />);
    const first = bodyRows()[0]!.children[0] as HTMLElement;
    focusOn(first);
    rerender(<Orders columnLayout={layout({ order: ['qty', 'id', 'customer', 'total'] })} />);
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      document.activeElement!.dispatchEvent(event);
    });
    // The place is on Order, which is the second column now, so the next one is Customer.
    expect(document.activeElement).toBe(bodyRows()[0]!.children[2]);
  });
});

describe('a column whose own values change after the layout started', () => {
  const MESSAGE = 'only start the column layout';
  const withColumn = (index: number, extra: Partial<DataGridColumn<Order>>) =>
    COLUMNS.map((column, at) =>
      at === index ? ({ ...column, ...extra } as typeof column) : column,
    );

  it.each([
    ['visible', { visible: false }],
    ['width', { width: 150 }],
    ['pinned', { pinned: 'left' as const }],
  ])('warns once for a changed %s, whether the layout is held or given', (_name, extra) => {
    const warn = spyWarn();
    const { rerender } = render(<Orders />);
    rerender(<Orders columns={withColumn(1, extra)} />);
    rerender(<Orders columns={withColumn(1, { ...extra, caption: 'Again' })} />);
    expect(warnings(warn)).toEqual([expect.stringContaining(MESSAGE)]);
    expect(warnings(warn)[0]).not.toContain('customer');
    warn.mockClear();
    resetDevWarnings();
    const controlled = render(<Orders columnLayout={layout()} />);
    controlled.rerender(<Orders columnLayout={layout()} columns={withColumn(1, extra)} />);
    expect(warnings(warn)).toEqual([expect.stringContaining(MESSAGE)]);
  });

  it('says nothing for a columns array written inline with the same values', () => {
    const warn = spyWarn();
    const { rerender } = render(<Orders columns={withColumn(1, { visible: true })} />);
    rerender(<Orders columns={withColumn(1, { visible: true })} />);
    rerender(<Orders columns={COLUMNS.map((column) => ({ ...column }))} />);
    expect(warn).not.toHaveBeenCalled();
  });

  it('says nothing when the new value is what the shown layout already has', () => {
    const warn = spyWarn();
    const { rerender } = render(<Orders columnLayout={layout({ hidden: ['customer'] })} />);
    rerender(
      <Orders
        columnLayout={layout({ hidden: ['customer'] })}
        columns={withColumn(1, { visible: false, width: 200 })}
      />,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('says nothing for a column that is new', () => {
    const warn = spyWarn();
    const extra: DataGridColumn<Order> = { field: 'customer', id: 'who', width: 90 };
    const { rerender } = render(<Orders />);
    rerender(<Orders columns={[...COLUMNS, extra]} />);
    rerender(<Orders columns={[...COLUMNS, { ...extra, visible: false }]} />);
    // The layout does not know it yet, so its own values still apply: nothing is ignored.
    expect(warn).not.toHaveBeenCalled();
  });

  it('does no work in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    try {
      const warn = spyWarn();
      const { rerender } = render(<Orders />);
      rerender(<Orders columns={withColumn(1, { visible: false })} />);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
