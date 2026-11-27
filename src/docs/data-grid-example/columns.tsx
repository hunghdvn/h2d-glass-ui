import { Avatar, Badge } from '../../index';
import type { DataGridColumn } from '../../index';
import { ASSIGNEE_ITEMS } from './orders';
import type { Order } from './orders';

const STATUS_ITEMS = [
  { value: 'new', text: 'New', variant: 'accent' },
  { value: 'processing', text: 'Processing', variant: 'warning' },
  { value: 'delivered', text: 'Delivered', variant: 'success' },
  { value: 'cancelled', text: 'Cancelled', variant: 'danger' },
] as const;

/**
 * The columns of the orders. `qty` and `total` are what the lines add up to, so no editor changes
 * them, and `id` is given by the app when it saves a new row (a new row shows no number until then).
 * The widths add up to the room of the wide layout; Channel is hidden there and stays in the column
 * chooser.
 */
export const COLUMNS: DataGridColumn<Order>[] = [
  {
    field: 'id',
    caption: 'Order',
    rowHeader: true,
    width: 112,
    allowEditing: false,
    allowHeaderFiltering: false,
  },
  {
    field: 'customer',
    caption: 'Customer',
    width: 186,
    validationRules: [{ type: 'required' }],
  },
  {
    field: 'assignee',
    caption: 'Assignee',
    width: 180,
    lookup: { items: ASSIGNEE_ITEMS, valueField: 'value', displayField: 'text' },
    cell: ({ value, text }) => (
      <span
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, verticalAlign: 'middle' }}
      >
        <Avatar
          size="sm"
          alt=""
          fallback={ASSIGNEE_ITEMS.find((item) => item.value === value)?.initials}
        />
        {text}
      </span>
    ),
  },
  { field: 'date', caption: 'Order date', dataType: 'date', width: 150 },
  {
    field: 'status',
    caption: 'Status',
    width: 150,
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
  {
    field: 'qty',
    caption: 'Qty',
    dataType: 'number',
    width: 88,
    allowEditing: false,
    allowHeaderFiltering: false,
  },
  {
    field: 'total',
    caption: 'Total',
    dataType: 'number',
    format: { style: 'currency', currency: 'VND' },
    width: 142,
    allowHeaderFiltering: false,
    allowEditing: false,
  },
];
