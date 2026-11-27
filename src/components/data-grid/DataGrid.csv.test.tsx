import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import type { Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridCsvOptions, DataGridHandle, DataGridProps } from './index';

// The CSV export (spec phase 6 §6.3 "Xuất CSV", Plan G): one case for each line of what it meets, through the
// handle's `exportCsv`, which the toolbar's button calls too (`DataGrid.chooser.test.tsx` proves that). What needs a
// real download (the `Blob` and the anchor) is stubbed here and read in the stories of the three engines.

beforeEach(() => {
  resetDevWarnings();
  Element.prototype.scrollIntoView = () => {};
  HTMLElement.prototype.checkVisibility = () => true;
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

interface Order {
  id: string;
  customer: string;
  status: number;
  placed: string;
  at: string;
  qty: number | null;
  price: number;
  total: number;
  paid: boolean;
}

const STATUSES = [
  { id: 1, name: 'New' },
  { id: 2, name: 'Processing' },
  { id: 3, name: 'Delivered' },
];

const ORDERS: Order[] = [
  {
    id: 'DH-1',
    customer: 'An',
    status: 1,
    placed: '2026-11-05',
    at: '2026-11-05T17:30:00Z',
    qty: 3,
    price: 10,
    total: 1250000.5,
    paid: true,
  },
  {
    id: 'DH-2',
    customer: 'Bình',
    status: 2,
    placed: '2026-11-04',
    at: '2026-11-04T01:00:00Z',
    qty: 5,
    price: 20,
    total: 890000,
    paid: false,
  },
  {
    id: 'DH-3',
    customer: 'Chi',
    status: 1,
    placed: '2026-11-03',
    at: '2026-11-03T10:00:00Z',
    qty: 1,
    price: 30,
    total: 15400000,
    paid: true,
  },
  {
    id: 'DH-4',
    customer: 'Dung, Khang',
    status: 3,
    placed: '2026-11-02',
    at: '2026-11-02T23:59:59Z',
    qty: 7,
    price: 40,
    total: -120,
    paid: false,
  },
  {
    id: 'DH-5',
    customer: '=Hà',
    status: 2,
    placed: '2026-11-01',
    at: '2026-11-01T00:00:00Z',
    qty: null,
    price: 50,
    total: 5,
    paid: true,
  },
  {
    id: 'DH-6',
    customer: 'Em "E"',
    status: 1,
    placed: '2026-10-31',
    at: '2026-10-31T12:00:00Z',
    qty: 2,
    price: 60,
    total: 0,
    paid: false,
  },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 100 },
  { field: 'customer', caption: 'Customer', width: 140 },
  {
    field: 'status',
    caption: 'Status',
    width: 120,
    dataType: 'number',
    lookup: { items: STATUSES, valueField: 'id', displayField: 'name' },
  },
  { field: 'placed', caption: 'Placed', dataType: 'date', width: 110 },
  { field: 'at', caption: 'At', dataType: 'datetime', width: 140 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 70 },
  { field: 'total', caption: 'Total', dataType: 'number', width: 110 },
  { field: 'paid', caption: 'Paid', dataType: 'boolean', width: 70 },
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

const BOM = String.fromCharCode(0xfeff);
/** The text of a blob with its byte order mark: `Blob.text()` decodes as UTF-8 and drops it. */
const blobText = async (blob: Blob) =>
  new TextDecoder('utf-8', { ignoreBOM: true }).decode(await blob.arrayBuffer());

const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});

/** Renders the grid and gives the handle's `exportCsv`, called in an `act` as an app's press would be. */
function setup(props: Partial<DataGridProps<Order>> = {}) {
  const gridRef = createRef<DataGridHandle>();
  const view = render(<Orders gridRef={gridRef} {...props} />);
  const exportCsv = (options?: Parameters<DataGridHandle['exportCsv']>[0]) => {
    let text = '';
    act(() => {
      text = gridRef.current!.exportCsv(options);
    });
    return text;
  };
  return { ...view, exportCsv, gridRef };
}

/** The records of a CSV: it must end with a CRLF, and its BOM is taken off. */
function records(csv: string): string[] {
  const text = csv.startsWith(BOM) ? csv.slice(1) : csv;
  expect(text.endsWith('\r\n')).toBe(true);
  return text.slice(0, -2).split('\r\n');
}
/** The first field of each record but the heading: the order ids, which hold no comma. */
const ids = (csv: string) =>
  records(csv)
    .slice(1)
    .map((record) => record.split(',')[0]);
const heading = (csv: string) => records(csv)[0];

describe('the rows', () => {
  it('writes every row, in the order of the data, with a heading row, a CRLF after every record and the BOM first', () => {
    const { exportCsv } = setup();
    const csv = exportCsv();
    expect(csv.startsWith(`${BOM}Order,Customer,Status,Placed,At,Qty,Total,Paid\r\n`)).toBe(true);
    expect(ids(csv)).toEqual(['DH-1', 'DH-2', 'DH-3', 'DH-4', 'DH-5', 'DH-6']);
  });

  it('writes only the rows the search keeps', () => {
    const { exportCsv } = setup({ defaultFilter: { search: 'khang' } });
    expect(ids(exportCsv())).toEqual(['DH-4']);
  });

  it('writes only the rows the conditions of a column keep', () => {
    const { exportCsv } = setup({
      defaultFilter: { columns: { qty: { operator: '>', value: 4 } } },
    });
    expect(ids(exportCsv())).toEqual(['DH-2', 'DH-4']);
  });

  it('writes the rows in the order of the sort', () => {
    const { exportCsv } = setup({ defaultSort: [{ field: 'qty', direction: 'desc' }] });
    // A blank sorts last in both directions.
    expect(ids(exportCsv())).toEqual(['DH-4', 'DH-2', 'DH-1', 'DH-6', 'DH-3', 'DH-5']);
  });

  it('writes the rows of every page, not the ones of the page shown', () => {
    const { exportCsv } = setup({ paging: { pageSize: 2 } });
    expect(screen.getAllByRole('row')).toHaveLength(1 + 2);
    expect(ids(exportCsv())).toHaveLength(6);
  });

  it('writes the rows of a grid that scrolls its rows (virtual) too, all of them', () => {
    const { exportCsv } = setup({ scrolling: 'virtual', height: 200, paging: undefined });
    expect(ids(exportCsv())).toHaveLength(6);
  });

  it('writes a grouped grid flat, in the order of its groups, with no group row and the rows of a closed group', () => {
    const { exportCsv } = setup({
      defaultGrouping: [{ field: 'status', direction: 'asc' }],
      defaultExpandedGroups: { allExpanded: false, except: [] },
    });
    // Every group is closed: three group rows and no data row on the screen.
    expect(document.querySelectorAll('tbody > tr')).toHaveLength(3);
    // The status is the third field; a semicolon keeps the comma of a customer's name out of the way.
    const csv = exportCsv({ separator: ';' });
    const statuses = records(csv)
      .slice(1)
      .map((record) => record.split(';')[2]);
    expect(statuses).toHaveLength(6);
    // Each status is in one run: the rows come group by group.
    const runs = statuses.filter((status, at) => status !== statuses[at - 1]);
    expect(runs).toHaveLength(3);
    expect(new Set(runs).size).toBe(3);
    expect(records(csv).some((record) => record.includes('(2)') || record.includes('(3)'))).toBe(
      false,
    );
  });

  it('writes the chosen rows only with selectedOnly, among the rows the search and the filter keep', () => {
    const { exportCsv } = setup({
      selectionMode: 'multiple',
      defaultSelectedKeys: ['DH-2', 'DH-4'],
    });
    expect(ids(exportCsv({ selectedOnly: true }))).toEqual(['DH-2', 'DH-4']);
    expect(ids(exportCsv())).toHaveLength(6);
  });

  it('leaves out a chosen row the filter hides, and writes the heading alone when nothing is chosen', () => {
    const { exportCsv } = setup({
      selectionMode: 'multiple',
      defaultSelectedKeys: ['DH-2', 'DH-4'],
      defaultFilter: { search: 'khang' },
    });
    expect(ids(exportCsv({ selectedOnly: true }))).toEqual(['DH-4']);
    const none = setup({ selectionMode: 'multiple' });
    expect(ids(none.exportCsv({ selectedOnly: true }))).toEqual([]);
    expect(heading(none.exportCsv({ selectedOnly: true }))).toBe(
      'Order,Customer,Status,Placed,At,Qty,Total,Paid',
    );
  });

  it('writes the heading alone for selectedOnly in a grid that cannot choose, whatever keys it was given', () => {
    const { exportCsv } = setup({ selectionMode: 'none', defaultSelectedKeys: ['DH-2'] });
    expect(ids(exportCsv({ selectedOnly: true }))).toEqual([]);
  });

  it('writes the rows of the page it was given in server mode, and warns once that it is the page', () => {
    const warn = spyWarn();
    const { exportCsv } = setup({ remote: true, totalCount: 50, data: ORDERS.slice(0, 3) });
    expect(ids(exportCsv())).toEqual(['DH-1', 'DH-2', 'DH-3']);
    exportCsv();
    const said = warn.mock.calls.filter(([message]) => String(message).includes('exportCsv()'));
    expect(said).toHaveLength(1);
    expect(String(said[0]![0])).toBe(
      `${WARN_PREFIX} <DataGrid> exportCsv() in server mode writes only the rows of the current page; export the whole data on the server.`,
    );
  });

  it('writes the rows of a grid with no data as the heading alone', () => {
    const { exportCsv } = setup({ data: [] });
    expect(ids(exportCsv())).toEqual([]);
    expect(heading(exportCsv())).toBe('Order,Customer,Status,Placed,At,Qty,Total,Paid');
  });

  it('writes a row that is loading as held: the rows the grid holds now', () => {
    const { exportCsv } = setup({ loading: true });
    expect(ids(exportCsv())).toHaveLength(6);
  });
});

describe('the columns', () => {
  it('writes the shown columns in the order drawn, and leaves a hidden one out', () => {
    const { exportCsv } = setup({
      defaultColumnLayout: { order: ['id', 'total', 'customer'], hidden: ['paid', 'at'] },
    });
    expect(heading(exportCsv())).toBe('Order,Total,Customer,Status,Placed,Qty');
  });

  it('writes a column at its place in the layout when it is grouped, as if it were shown', () => {
    const { exportCsv } = setup({
      defaultGrouping: [{ field: 'customer', direction: 'asc' }],
    });
    // The grouped column is not drawn; the CSV keeps it where the layout puts it.
    expect(heading(exportCsv())).toBe('Order,Customer,Status,Placed,At,Qty,Total,Paid');
  });

  it('puts a column pinned to the right last and a column pinned to the left first', () => {
    const { exportCsv } = setup({
      defaultColumnLayout: { pinned: { customer: 'right', qty: 'left' } },
    });
    expect(heading(exportCsv())).toBe('Qty,Order,Status,Placed,At,Total,Paid,Customer');
  });

  it('writes no column the grid adds for itself: the boxes, the handles, the buttons of rows', () => {
    const { exportCsv } = setup({
      selectionMode: 'multiple',
      rowReorder: true,
      renderDetail: () => 'detail',
      editing: { mode: 'row', allowDeleting: true },
      onSaving: () => {},
    });
    expect(heading(exportCsv())).toBe('Order,Customer,Status,Placed,At,Qty,Total,Paid');
  });

  it('leaves out a column that says exportable false, and keeps one whose value is not a boolean', () => {
    const columns: DataGridColumn<Order>[] = COLUMNS.map((column) =>
      'field' in column && column.field === 'customer'
        ? { ...column, exportable: false }
        : 'field' in column && column.field === 'at'
          ? { ...column, exportable: 'no' as unknown as boolean }
          : column,
    );
    const { exportCsv } = setup({ columns });
    expect(heading(exportCsv())).toBe('Order,Status,Placed,At,Qty,Total,Paid');
  });

  it('writes the heading row alone with no column, as the BOM and nothing else without it', () => {
    const columns: DataGridColumn<Order>[] = [{ field: 'id', caption: 'Order', exportable: false }];
    const { exportCsv } = setup({ columns });
    expect(exportCsv()).toBe(BOM);
    expect(exportCsv({ bom: false })).toBe('');
  });

  it('writes the caption of a column, and the id of a column that has none', () => {
    const columns: DataGridColumn<Order>[] = [
      { field: 'id' },
      { id: 'twice', caption: 'Twice', value: (row) => (row.qty ?? 0) * 2, dataType: 'number' },
    ];
    const { exportCsv } = setup({ columns });
    expect(heading(exportCsv())).toBe('id,Twice');
  });

  it('quotes and guards a caption as it does a field', () => {
    const columns: DataGridColumn<Order>[] = [
      { field: 'id', caption: '=SUM(A1)' },
      { field: 'customer', caption: 'Name, full' },
    ];
    const { exportCsv } = setup({ columns });
    expect(heading(exportCsv())).toBe(`'=SUM(A1),"Name, full"`);
    expect(heading(exportCsv({ escapeFormulas: false }))).toBe(`=SUM(A1),"Name, full"`);
  });
});

describe('the values', () => {
  it('writes the text of the cells by default: a lookup by its words, a date and a number by the grid locale', () => {
    const { exportCsv } = setup({ locale: 'vi-VN', defaultFilter: { search: 'DH-1' } });
    const [, record] = records(exportCsv());
    const total = new Intl.NumberFormat('vi-VN').format(1250000.5);
    const placed = new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    }).format(Date.UTC(2026, 10, 5));
    expect(record).toContain(`New,${placed},`);
    // A number of the locale with a decimal comma is quoted when the separator is a comma.
    expect(record).toContain(`"${total}"`);
    expect(record!.endsWith(',Yes')).toBe(true);
  });

  it('writes a datetime in the time zone of the grid', () => {
    const utc = setup({ timeZone: 'UTC', defaultFilter: { search: 'DH-1' } });
    const hanoi = setup({ timeZone: 'Asia/Ho_Chi_Minh', defaultFilter: { search: 'DH-1' } });
    const written = (zone: string) =>
      new Intl.DateTimeFormat('en-US', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: zone,
      }).format(Date.UTC(2026, 10, 5, 17, 30));
    // 17:30 UTC is 00:30 of the next day in Ha Noi: the two texts are not the same.
    expect(written('UTC')).not.toBe(written('Asia/Ho_Chi_Minh'));
    expect(utc.exportCsv()).toContain(`"${written('UTC')}"`);
    expect(hanoi.exportCsv()).toContain(`"${written('Asia/Ho_Chi_Minh')}"`);
  });

  it('writes a lookup by its words, and by its value in raw', () => {
    const { exportCsv } = setup({ defaultFilter: { search: 'DH-2' } });
    expect(records(exportCsv())[1]!.split(',')[2]).toBe('Processing');
    expect(records(exportCsv({ values: 'raw' }))[1]!.split(',')[2]).toBe('2');
  });

  // A characterization: it passes at once, because exportCsv() reads a saved row through the app's own `format` as the
  // cell does (`readOfRow` only catches a new row's throw).
  it('throws the format of the app that throws for a saved row on a page that is not drawn', () => {
    const columns = COLUMNS.map((column) =>
      column.field === 'qty'
        ? {
            ...column,
            format: (value: unknown) => {
              if (value === 5) throw new Error('format of DH-2');
              return String(value);
            },
          }
        : column,
    ) as DataGridColumn<Order>[];
    // DH-2 (qty 5) is on page 2: nothing draws it and nothing else reads its text.
    const { exportCsv } = setup({ columns, paging: { pageSize: 1 } });
    expect(screen.getByText('DH-1')).toBeTruthy();
    expect(screen.queryByText('DH-2')).toBeNull();
    expect(() => exportCsv()).toThrow('format of DH-2');
  });

  it('writes the raw values: a number with a dot, a day as ISO, an instant in UTC, a boolean as true or false', () => {
    const { exportCsv } = setup({ locale: 'vi-VN', timeZone: 'Asia/Ho_Chi_Minh' });
    const [, first, second] = records(exportCsv({ values: 'raw' }));
    expect(first).toBe('DH-1,An,1,2026-11-05,2026-11-05T17:30:00.000Z,3,1250000.5,true');
    expect(second).toBe('DH-2,Bình,2,2026-11-04,2026-11-04T01:00:00.000Z,5,890000,false');
  });

  it('writes a blank value as nothing in both', () => {
    const { exportCsv } = setup({ defaultFilter: { search: 'DH-5' } });
    expect(records(exportCsv())[1]!.split(',')).toContain('');
    expect(records(exportCsv({ values: 'raw' }))[1]).toBe(
      `DH-5,'=Hà,2,2026-11-01,2026-11-01T00:00:00.000Z,,5,true`,
    );
  });

  it('writes a column that is computed, by its value or its text', () => {
    const columns: DataGridColumn<Order>[] = [
      { field: 'id' },
      {
        id: 'amount',
        caption: 'Amount',
        dataType: 'number',
        value: (row) => (row.qty ?? 0) * row.price,
      },
      {
        id: 'label',
        caption: 'Label',
        value: (row) => `${row.id}!`,
        format: (value) => `[${value}]`,
      },
    ];
    const { exportCsv } = setup({ columns, defaultFilter: { search: 'DH-2' } });
    expect(records(exportCsv())[1]).toBe('DH-2,100,[DH-2!]');
    expect(records(exportCsv({ values: 'raw' }))[1]).toBe('DH-2,100,DH-2!');
  });

  it('writes a boolean by the words of labels, and true or false in raw', () => {
    const { exportCsv } = setup({
      labels: { yes: 'Có', no: 'Không' },
      defaultFilter: { search: 'DH-2' },
    });
    expect(records(exportCsv())[1]!.endsWith(',Không')).toBe(true);
    expect(records(exportCsv({ values: 'raw' }))[1]!.endsWith(',false')).toBe(true);
  });

  it('writes the text of a custom cell, not what it draws', () => {
    const columns: DataGridColumn<Order>[] = [
      { field: 'id', cell: ({ text }) => <b>{`<<${text}>>`}</b> },
      { field: 'customer' },
    ];
    const { exportCsv } = setup({ columns, defaultFilter: { search: 'DH-2' } });
    expect(screen.getByText('<<DH-2>>')).toBeInTheDocument();
    expect(records(exportCsv())[1]).toBe('DH-2,Bình');
  });

  it('writes the text a format function gives in raw too when the type cannot read the value', () => {
    const columns: DataGridColumn<Order>[] = [
      { field: 'id' },
      {
        id: 'parts',
        caption: 'Parts',
        dataType: 'number',
        value: (row) => ({ qty: row.qty }),
        format: (value) => `qty ${(value as { qty: number }).qty}`,
      },
    ];
    spyWarn();
    const { exportCsv } = setup({ columns, defaultFilter: { search: 'DH-2' } });
    expect(records(exportCsv({ values: 'raw' }))[1]).toBe('DH-2,qty 5');
  });

  it('guards a text that starts like a formula in a string column and a lookup, and not a number', () => {
    const { exportCsv } = setup({ defaultFilter: { search: 'DH-5' } });
    expect(records(exportCsv())[1]!.split(',')[1]).toBe("'=Hà");
    expect(records(exportCsv({ escapeFormulas: false }))[1]!.split(',')[1]).toBe('=Hà');
    // -120 is a number: it stays one.
    const negative = setup({ defaultFilter: { search: 'DH-4' } });
    expect(records(negative.exportCsv())[1]).toContain(',-120,');
  });

  it('in raw guards a lookup only when the value written is text; formatted guards its text', () => {
    interface Row {
      id: string;
      n: number;
      s: string;
    }
    const rows: Row[] = [{ id: 'r1', n: -1, s: '=x' }];
    const columns: DataGridColumn<Row>[] = [
      { field: 'id', caption: 'Id' },
      {
        field: 'n',
        caption: 'N',
        dataType: 'number',
        lookup: { items: [{ id: -1, name: '-1' }], valueField: 'id', displayField: 'name' },
      },
      {
        field: 's',
        caption: 'S',
        lookup: { items: [{ id: '=x', name: '=x' }], valueField: 'id', displayField: 'name' },
      },
    ];
    const gridRef = createRef<DataGridHandle>();
    render(
      <DataGrid
        ref={gridRef}
        data={rows}
        rowKey="id"
        columns={columns}
        caption="L"
        paging={false}
      />,
    );
    const csv = (options: DataGridCsvOptions) => {
      let text = '';
      act(() => {
        text = gridRef.current!.exportCsv(options);
      });
      return records(text)[1];
    };
    // A lookup of numbers: raw writes the number as it is, a number that stays one; formatted writes its text, guarded.
    // A lookup of strings is guarded in both.
    expect(csv({ values: 'raw' })).toBe("r1,-1,'=x");
    expect(csv({ values: 'formatted' })).toBe("r1,'-1,'=x");
  });

  it('quotes a field with a comma or a quote, and uses the separator it is asked for', () => {
    const { exportCsv } = setup({ defaultFilter: { search: 'khang' } });
    expect(records(exportCsv())[1]!.startsWith('DH-4,"Dung, Khang",')).toBe(true);
    expect(records(exportCsv({ separator: ';' }))[1]!.startsWith('DH-4;Dung, Khang;')).toBe(true);
    const quote = setup({ defaultFilter: { search: 'DH-6' } });
    expect(records(quote.exportCsv())[1]!.startsWith('DH-6,"Em ""E""",')).toBe(true);
  });

  it('puts the BOM first unless bom is false', () => {
    const { exportCsv } = setup();
    expect(exportCsv().startsWith(BOM)).toBe(true);
    expect(exportCsv({ bom: false }).startsWith(BOM)).toBe(false);
  });
});

describe('what is not saved, and what is not a row', () => {
  const type = (label: string, text: string) =>
    act(
      () =>
        void fireEvent.change(within(screen.getByRole('grid')).getByLabelText(label), {
          target: { value: text },
        }),
    );
  const rowOf = (id: string) =>
    Array.from(document.querySelectorAll<HTMLElement>('tbody > tr.flg-data-grid-row')).find((row) =>
      row.children[0]!.textContent?.includes(id),
    )!;
  const cellOf = (id: string, caption: string) => {
    const heads = Array.from(
      document.querySelectorAll('thead th'),
      (head) => head.textContent,
    ).filter((text) => text !== '');
    return rowOf(id).querySelectorAll<HTMLElement>(':scope > td, :scope > th')[
      heads.indexOf(caption)
    ]!;
  };
  /** Changes a cell in batch mode: opens the editor, types and commits. */
  const change = (id: string, caption: string, text: string) => {
    act(() => cellOf(id, caption).click());
    type(caption, text);
    act(() => {
      fireEvent.keyDown(within(screen.getByRole('grid')).getByLabelText(caption), {
        key: 'Enter',
      });
    });
  };
  const BATCH = { mode: 'batch', allowDeleting: true, allowAdding: true } as const;

  it('writes the saved value of a cell with a change that is not saved', () => {
    const { exportCsv } = setup({ editing: BATCH, onSaving: () => {} });
    change('DH-1', 'Customer', 'Hoa');
    expect(cellOf('DH-1', 'Customer')).toHaveTextContent('Hoa');
    const csv = exportCsv();
    expect(csv).toContain('DH-1,An,');
    expect(csv).not.toContain('Hoa');
  });

  it('writes a row kept by the filter only because it has a change, in the place the grid shows it', () => {
    const { exportCsv, rerender, gridRef } = setup({ editing: BATCH, onSaving: () => {} });
    change('DH-1', 'Customer', 'Hoa');
    rerender(
      <Orders
        gridRef={gridRef}
        editing={BATCH}
        onSaving={() => {}}
        filter={{ search: 'khang' }}
        onFilterChange={() => {}}
      />,
    );
    // DH-1 no longer matches, but it has a change, so the grid keeps it; the CSV holds what the grid shows.
    expect(rowOf('DH-1')).toBeTruthy();
    expect(ids(exportCsv())).toEqual(['DH-1', 'DH-4']);
    expect(exportCsv()).toContain('DH-1,An,');
  });

  it('writes a row marked for deletion, with its saved values', () => {
    const { exportCsv } = setup({ editing: BATCH, onSaving: () => {} });
    act(() => screen.getByRole('button', { name: 'Delete DH-2' }).click());
    expect(rowOf('DH-2')).toHaveAttribute('data-deleted');
    expect(ids(exportCsv())).toContain('DH-2');
  });

  it('writes no new row, even with values typed in it', () => {
    const { exportCsv } = setup({
      editing: BATCH,
      onSaving: () => {},
      initNewRow: () => ({ id: 'X' }),
    });
    act(() => screen.getByRole('button', { name: 'Add row' }).click());
    expect(document.querySelectorAll('tr[data-new]')).toHaveLength(1);
    expect(ids(exportCsv())).toEqual(['DH-1', 'DH-2', 'DH-3', 'DH-4', 'DH-5', 'DH-6']);
  });

  it('writes no detail row and no row of totals, and no group row', () => {
    const { exportCsv } = setup({
      renderDetail: () => <p>the detail</p>,
      defaultExpandedRows: ['DH-1'],
      summary: { total: [{ column: 'qty', type: 'sum' }] },
    });
    expect(screen.getByText('the detail')).toBeInTheDocument();
    const csv = exportCsv();
    expect(csv).not.toContain('detail');
    expect(records(csv)).toHaveLength(1 + 6);
  });

  it('writes the saved row of the row whose form is open, and a row being edited in place', () => {
    const { exportCsv } = setup({ editing: { mode: 'row' }, onSaving: () => {} });
    act(() => screen.getByRole('button', { name: 'Edit DH-2' }).click());
    type('Customer', 'Typed');
    expect(ids(exportCsv())).toHaveLength(6);
    expect(exportCsv()).not.toContain('Typed');
  });
});

describe('the handle and its options', () => {
  it('works without csvExport, which only adds the button', () => {
    const { exportCsv } = setup();
    expect(screen.queryByRole('button', { name: 'Export CSV' })).toBeNull();
    expect(exportCsv().startsWith(BOM)).toBe(true);
  });

  it('lays the options of the call over the ones of csvExport', () => {
    const { exportCsv } = setup({ csvExport: { separator: ';', bom: false } });
    // No option given: the ones of csvExport.
    expect(exportCsv().startsWith('Order;Customer;')).toBe(true);
    // An option given wins, and the others stay.
    expect(exportCsv({ separator: '\t' }).startsWith('Order\tCustomer\t')).toBe(true);
    expect(exportCsv({ bom: true }).startsWith(`${BOM}Order;Customer;`)).toBe(true);
  });

  it('uses the default for an option outside its union, and warns once for each option', () => {
    const warn = spyWarn();
    const { exportCsv } = setup();
    const bad = {
      separator: 'x',
      values: 'json',
      bom: 'yes',
      selectedOnly: 1,
      escapeFormulas: 'no',
      fileName: 5,
    } as unknown as DataGridCsvOptions;
    const csv = exportCsv(bad);
    exportCsv(bad);
    expect(csv.startsWith(`${BOM}Order,Customer,Status,Placed`)).toBe(true);
    expect(ids(csv)).toHaveLength(6);
    const said = warn.mock.calls.map(([message]) => String(message));
    expect(said).toEqual([
      `${WARN_PREFIX} <DataGrid exportCsv> separator must be ',', ';' or '\\t': the option of csvExport, or the default, is used.`,
      `${WARN_PREFIX} <DataGrid exportCsv> values must be 'formatted' or 'raw': the option of csvExport, or the default, is used.`,
      `${WARN_PREFIX} <DataGrid exportCsv> bom must be true or false: the option of csvExport, or the default, is used.`,
      `${WARN_PREFIX} <DataGrid exportCsv> selectedOnly must be true or false: the option of csvExport, or the default, is used.`,
      `${WARN_PREFIX} <DataGrid exportCsv> escapeFormulas must be true or false: the option of csvExport, or the default, is used.`,
      `${WARN_PREFIX} <DataGrid exportCsv> fileName must be a string: the option of csvExport, or the default, is used.`,
    ]);
  });

  it('says the option of csvExport, or the default, is used for a bad option of the call, and the file uses the prop', () => {
    const warn = spyWarn();
    const bad = { separator: 'x', bom: 'yes' } as unknown as DataGridCsvOptions;
    // csvExport sets both: the file follows the prop's value, and the words hold no value that could be false.
    const first = setup({ csvExport: { separator: ';', bom: false } });
    const withProp = first.exportCsv(bad);
    expect(withProp.startsWith('Order;Customer;')).toBe(true);
    expect(withProp.startsWith(BOM)).toBe(false);
    const said = warn.mock.calls.map(([message]) => String(message));
    expect(said).toEqual([
      `${WARN_PREFIX} <DataGrid exportCsv> separator must be ',', ';' or '\\t': the option of csvExport, or the default, is used.`,
      `${WARN_PREFIX} <DataGrid exportCsv> bom must be true or false: the option of csvExport, or the default, is used.`,
    ]);
    // Without the option in csvExport: the default.
    first.unmount();
    resetDevWarnings();
    warn.mockClear();
    const without = setup({ csvExport: true }).exportCsv(bad);
    expect(without.startsWith(`${BOM}Order,Customer,`)).toBe(true);
    expect(warn.mock.calls.map(([message]) => String(message))).toEqual(said);
  });

  it('uses the default for an option of csvExport outside its union, with one warning from the commit', () => {
    const warn = spyWarn();
    const { exportCsv } = setup({
      csvExport: { separator: 'x', values: 'json' } as unknown as DataGridCsvOptions,
    });
    expect(exportCsv().startsWith(`${BOM}Order,Customer`)).toBe(true);
    expect(warn.mock.calls.map(([message]) => String(message))).toEqual([
      `${WARN_PREFIX} <DataGrid csvExport> separator must be ',', ';' or '\\t': ',' is used.`,
      `${WARN_PREFIX} <DataGrid csvExport> values must be 'formatted' or 'raw': 'formatted' is used.`,
    ]);
  });

  it('is off for a csvExport that is neither true nor an object, with one warning', () => {
    const warn = spyWarn();
    setup({ csvExport: 'yes' as unknown as boolean });
    expect(screen.queryByRole('button', { name: 'Export CSV' })).toBeNull();
    expect(warn.mock.calls.map(([message]) => String(message))).toEqual([
      `${WARN_PREFIX} <DataGrid> csvExport is neither a boolean nor an object of options; it is off.`,
    ]);
  });

  describe('the download', () => {
    let blobs: Blob[];
    let clicked: Array<{ name: string | null; href: string | null }>;
    beforeEach(() => {
      vi.useFakeTimers();
      blobs = [];
      clicked = [];
      URL.createObjectURL = (blob: Blob | MediaSource) => {
        blobs.push(blob as Blob);
        return `blob:${blobs.length}`;
      };
      URL.revokeObjectURL = () => {};
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
        this: HTMLAnchorElement,
      ) {
        clicked.push({ name: this.getAttribute('download'), href: this.getAttribute('href') });
      });
    });
    afterEach(() => {
      vi.useRealTimers();
      delete (URL as { createObjectURL?: unknown }).createObjectURL;
      delete (URL as { revokeObjectURL?: unknown }).revokeObjectURL;
    });

    it('downloads nothing for a call with no download and no file name, and still returns the text', () => {
      const { exportCsv } = setup();
      expect(exportCsv().length).toBeGreaterThan(10);
      expect(clicked).toEqual([]);
      expect(blobs).toEqual([]);
    });

    it('downloads data.csv for download true, as text/csv in UTF-8, and returns the same text', async () => {
      const { exportCsv } = setup();
      const csv = exportCsv({ download: true });
      expect(clicked).toEqual([{ name: 'data.csv', href: 'blob:1' }]);
      expect(blobs).toHaveLength(1);
      expect(blobs[0]!.type).toBe('text/csv;charset=utf-8');
      expect(await blobText(blobs[0]!)).toBe(csv);
    });

    it('downloads under a file name that is given, even without download, as it is given', () => {
      const { exportCsv } = setup();
      exportCsv({ fileName: 'orders 2026.csv' });
      expect(clicked).toEqual([{ name: 'orders 2026.csv', href: 'blob:1' }]);
    });

    it('does not download for download false, whatever the file name', () => {
      const { exportCsv } = setup();
      exportCsv({ download: false, fileName: 'x.csv' });
      expect(clicked).toEqual([]);
    });

    it('takes the file name of csvExport, and a file name of the call over it', () => {
      const { exportCsv } = setup({ csvExport: { fileName: 'from-prop.csv' } });
      exportCsv({ download: true });
      exportCsv({ download: true, fileName: 'from-call.csv' });
      expect(clicked.map((one) => one.name)).toEqual(['from-prop.csv', 'from-call.csv']);
    });

    it('does not download for a file name in csvExport alone: it only names the download of a press', () => {
      const { exportCsv } = setup({ csvExport: { fileName: 'from-prop.csv' } });
      exportCsv();
      expect(clicked).toEqual([]);
    });
  });
});
