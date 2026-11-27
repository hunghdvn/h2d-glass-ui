'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  Card,
  DataGrid,
  SegmentedControl,
  SegmentedControlItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../index';
import type {
  DataGridChange,
  DataGridColumnLayout,
  DataGridEditMode,
  DataGridState,
  DataGridSortItem,
  DataGridSummary,
} from '../../index';
import { COLUMNS } from './columns';
import { ORDERS, TODAY, nextOrderId } from './orders';
import type { Order } from './orders';

const MODES: { value: DataGridEditMode; label: string }[] = [
  { value: 'row', label: 'Row' },
  { value: 'cell', label: 'Cell' },
  { value: 'batch', label: 'Batch' },
  { value: 'form', label: 'Form' },
  { value: 'popup', label: 'Popup' },
];

/** The totals of the footer and of the group rows: how many orders, and what they add up to. */
const SUMMARY: DataGridSummary<Order> = {
  total: [
    { column: 'id', type: 'count', label: 'Orders' },
    { column: 'total', type: 'sum' },
  ],
  group: [{ column: 'total', type: 'sum' }],
};

type LayoutClass = 'wide' | 'phone';

/**
 * Where each layout starts. The wide one pins Order to the left and keeps Channel in the column
 * chooser, which is what fits the room; the phone one shows four columns and pins nothing, since a
 * pinned zone would leave next to no room to scroll.
 */
const LAYOUTS: Record<LayoutClass, Partial<DataGridColumnLayout>> = {
  wide: { pinned: { id: 'left' }, hidden: ['channel'] },
  phone: { hidden: ['assignee', 'date', 'channel', 'qty'], pinned: {} },
};

/**
 * The newest orders first. A sort of a column that is hidden is not applied, and the phone layout hides
 * Order date, so there the order numbers, which count up with the dates, stand in.
 */
const SORTS: Record<LayoutClass, DataGridSortItem[]> = {
  wide: [{ field: 'date', direction: 'desc' }],
  phone: [{ field: 'id', direction: 'desc' }],
};

/** Below 640px, the width the Dialog calls a phone (`fullScreenOnPhone`). */
const PHONE_QUERY = '(max-width: 639px)';

const subscribe = (onChange: () => void) => {
  const list = window.matchMedia(PHONE_QUERY);
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
};

/**
 * Whether the window is a phone. The server and the first render of a hydration say no, so the
 * HTML is the wide layout; a phone then renders once more.
 */
function usePhone() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}

/** What each layout keeps, under a key of its own: the columns of one are not those of the other. */
const keyOf = (layout: LayoutClass) => `lumen-orders-grid-v1-${layout}`;

const readState = (layout: LayoutClass): Partial<DataGridState> | null => {
  try {
    return JSON.parse(localStorage.getItem(keyOf(layout)) ?? 'null');
  } catch {
    // Private mode or text that is no JSON: the default state stays.
    return null;
  }
};

/** Applies what `onSaving` is told to the list; the grid never changes `data` itself. */
function applyChanges(orders: Order[], changes: readonly DataGridChange<Order>[]): Order[] {
  let next = orders;
  for (const change of changes) {
    if (change.type === 'update')
      next = next.map((order) => (order.id === change.key ? { ...order, ...change.data } : order));
    else if (change.type === 'remove') next = next.filter((order) => order.id !== change.key);
    else
      next = [
        {
          customer: '',
          assignee: 'lan',
          date: TODAY,
          status: 'new',
          channel: 'Website',
          qty: 0,
          total: 0,
          lines: [],
          ...change.data,
          // The app gives the number when it saves, after the fields of the grid, so two rows added
          // before one save get two numbers.
          id: nextOrderId(next),
        },
        ...next,
      ];
  }
  return next;
}

const VND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

/** What a row opens to: the lines of the order. */
function renderDetail(order: Order) {
  if (order.lines.length === 0)
    return <span style={{ fontSize: 'var(--flg-text-sm)' }}>No lines yet.</span>;
  return (
    <Table variant="lined" size="sm" aria-label={`Lines of ${order.id}`} style={{ maxWidth: 480 }}>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead align="end">Qty</TableHead>
          <TableHead align="end">Unit price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {order.lines.map((line) => (
          <TableRow key={line.product}>
            <TableCell>{line.product}</TableCell>
            <TableCell align="end">{line.qty}</TableCell>
            <TableCell align="end">{VND.format(line.price)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** The grid of one layout. It keeps the saved state, so a layout that is mounted again reads it again. */
function Grid({
  layout,
  mode,
  orders,
  onOrders,
}: {
  layout: LayoutClass;
  mode: DataGridEditMode;
  orders: Order[];
  onOrders: (next: (orders: Order[]) => Order[]) => void;
}) {
  const [saved, setSaved] = useState<Partial<DataGridState> | null>(null);
  useEffect(() => setSaved(readState(layout)), [layout]);
  return (
    <DataGrid
      key={saved ? 'saved' : 'default'}
      data={orders}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      description={`${orders.length} orders · Lumen, November 2026`}
      variant="lined"
      height={layout === 'phone' ? 600 : 520}
      locale="vi-VN"
      selectionMode="multiple"
      defaultSelectedKeys={['DH-1038', 'DH-1033']}
      paging={{ pageSize: 12, pageSizes: [12, 24, 48] }}
      searchPanel
      columnChooser
      filterRow
      headerFilter
      filterPanel
      groupPanel
      // `vi-VN` writes a comma as the decimal mark, so Excel reads `;` as the separator.
      csvExport={{ fileName: 'lumen-orders.csv', separator: ';' }}
      summary={SUMMARY}
      renderDetail={renderDetail}
      editing={{ mode, allowAdding: true, allowDeleting: true }}
      onSaving={(changes) => onOrders((current) => applyChanges(current, changes))}
      initNewRow={(): Partial<Order> => ({
        date: TODAY,
        status: 'new',
        channel: 'Website',
        qty: 0,
        total: 0,
      })}
      defaultSort={saved?.sort ?? SORTS[layout]}
      defaultFilter={saved?.filter}
      defaultGrouping={saved?.grouping}
      defaultColumnLayout={saved?.columnLayout ?? LAYOUTS[layout]}
      defaultPage={saved?.page}
      onStateChange={({ sort, filter, grouping, columnLayout, page }) => {
        try {
          localStorage.setItem(
            keyOf(layout),
            JSON.stringify({ sort, filter, grouping, columnLayout, page }),
          );
        } catch {
          // Private mode or a full storage: the state is not kept, the grid goes on.
        }
      }}
    />
  );
}

/**
 * The orders of "Lumen" in a grid: the example of the page "Examples/Data grid". The orders and the
 * edit mode are the example's own state; what a person arranges (sort, filter, grouping, columns,
 * page) is kept in `localStorage`, one record for each layout.
 */
export function OrdersGrid() {
  const [orders, setOrders] = useState(ORDERS);
  const [mode, setMode] = useState<DataGridEditMode>('row');
  const layout: LayoutClass = usePhone() ? 'phone' : 'wide';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', width: '100%', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px' }}>
        <SegmentedControl
          aria-label="Edit mode"
          size="sm"
          value={mode}
          onValueChange={(value) => setMode(value as DataGridEditMode)}
        >
          {MODES.map(({ value, label }) => (
            <SegmentedControlItem key={value} value={value}>
              {label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        <span style={{ fontSize: 'var(--flg-text-sm)', color: 'var(--flg-text-muted)' }}>
          Changing the mode drops the changes that are not saved.
        </span>
      </div>
      <Card>
        {/* The layout is the grid's key: a window that crosses 640px mounts the grid of the other one, so
            the changes that are not saved, an open form or popup and the chosen rows go. */}
        <Grid key={layout} layout={layout} mode={mode} orders={orders} onOrders={setOrders} />
      </Card>
    </div>
  );
}
