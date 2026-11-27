// The data grid on the client with React 18.3: the same grid as the Next.js fixture's /grid page,
// with its orders built here since this app has no server to hand them over.
import { Badge, DataGrid } from 'h2d-glass-ui';
import type { DataGridColumn, DataGridSummary } from 'h2d-glass-ui';
import { useEffect, useState } from 'react';

interface Order {
  id: string;
  customer: string;
  /** The ISO day of the order. */
  date: string;
  status: 'new' | 'processing' | 'delivered' | 'cancelled';
  channel: 'Store' | 'Website' | 'Phone';
  qty: number;
  total: number;
}

const CUSTOMERS = [
  'Tạp hóa Hoa Mai',
  'Nhà hàng Sen Vàng',
  'Công ty An Phát',
  'Studio Ánh Dương',
  'Đỗ Khánh Linh',
  'Công ty Thịnh Vượng',
  'Hoàng Đức Long',
  'Cà phê Sương Sớm',
];
const STATUSES = ['delivered', 'processing', 'new', 'delivered', 'cancelled'] as const;
const CHANNELS = ['Store', 'Website', 'Phone'] as const;

/** Thirty orders, DH-1001 to DH-1030, over the first ten days of November 2026. */
const orders: Order[] = Array.from({ length: 30 }, (_, index) => ({
  id: `DH-${1001 + index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length]!,
  date: `2026-11-${String(1 + Math.floor(index / 3)).padStart(2, '0')}`,
  status: STATUSES[index % STATUSES.length]!,
  channel: CHANNELS[(index + 1) % CHANNELS.length]!,
  qty: 1 + ((index * 7) % 12),
  total: (1 + ((index * 5) % 9)) * 185000,
}));

const STATUS_ITEMS = [
  { value: 'new', text: 'New', variant: 'accent' },
  { value: 'processing', text: 'Processing', variant: 'warning' },
  { value: 'delivered', text: 'Delivered', variant: 'success' },
  { value: 'cancelled', text: 'Cancelled', variant: 'danger' },
] as const;

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 110, allowEditing: false },
  {
    field: 'customer',
    caption: 'Customer',
    width: 200,
    validationRules: [{ type: 'required' }],
  },
  { field: 'date', caption: 'Order date', dataType: 'date', width: 140 },
  {
    field: 'status',
    caption: 'Status',
    width: 140,
    lookup: { items: STATUS_ITEMS, valueField: 'value', displayField: 'text' },
    cell: ({ value, text }) => (
      <Badge variant={STATUS_ITEMS.find((item) => item.value === value)?.variant}>{text}</Badge>
    ),
  },
  {
    field: 'channel',
    caption: 'Channel',
    width: 120,
    lookup: {
      items: ['Store', 'Website', 'Phone'].map((value) => ({ value, text: value })),
      valueField: 'value',
      displayField: 'text',
    },
  },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80, allowEditing: false },
  {
    field: 'total',
    caption: 'Total',
    dataType: 'number',
    format: { style: 'currency', currency: 'VND' },
    width: 140,
    allowEditing: false,
  },
];

const SUMMARY: DataGridSummary<Order> = {
  total: [
    { column: 'id', type: 'count', label: 'Orders' },
    { column: 'total', type: 'sum' },
  ],
  group: [{ column: 'total', type: 'sum' }],
};

// `data-hydrated` tells the check that React has attached its event handlers.
export function GridPage() {
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState(orders);
  useEffect(() => setHydrated(true), []);
  return (
    <main
      style={{ margin: '32px auto', maxWidth: 1100, padding: '0 16px' }}
      data-hydrated={hydrated ? '' : undefined}
    >
      <DataGrid
        data={data}
        rowKey="id"
        columns={COLUMNS}
        caption="Orders"
        locale="vi-VN"
        height={520}
        paging={{ pageSize: 10 }}
        filterRow
        headerFilter
        groupPanel
        defaultSort={[{ field: 'id', direction: 'asc' }]}
        defaultGrouping={[{ field: 'status', direction: 'asc' }]}
        summary={SUMMARY}
        editing={{ mode: 'row' }}
        csvExport={{ fileName: 'orders.csv' }}
        onSaving={(changes) =>
          setData((current) =>
            current.map((order) => {
              const change = changes.find((one) => one.type === 'update' && one.key === order.id);
              return change && change.type === 'update' ? { ...order, ...change.data } : order;
            }),
          )
        }
      />
    </main>
  );
}
