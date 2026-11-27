'use client';

import { Badge, DataGrid } from 'h2d-glass-ui';
import type { DataGridColumn, DataGridSummary } from 'h2d-glass-ui';
import { useEffect, useState } from 'react';
import type { Order } from './orders';

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
export function OrdersGrid({ orders }: { orders: Order[] }) {
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState(orders);
  useEffect(() => setHydrated(true), []);
  return (
    <section data-hydrated={hydrated ? '' : undefined}>
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
    </section>
  );
}
