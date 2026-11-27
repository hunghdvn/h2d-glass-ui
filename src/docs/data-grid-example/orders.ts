/** One line of an order: what was bought, how many, and the price of one. */
export interface OrderLine {
  product: string;
  qty: number;
  price: number;
}

/** An order of "Lumen". `qty` and `total` are what the lines add up to. */
export interface Order {
  id: string;
  customer: string;
  assignee: 'lan' | 'huy' | 'anh';
  /** The ISO day of the order. */
  date: string;
  status: 'new' | 'processing' | 'delivered' | 'cancelled';
  channel: 'Store' | 'Website' | 'Phone';
  qty: number;
  total: number;
  lines: OrderLine[];
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
  'Nhà sách Đông A',
  'Trần Thu Hà',
  'Công ty Minh Phát',
  'Xưởng gỗ Tân Lập',
  'Siêu thị Việt Hưng',
  'Quán Trà Chiều',
];

const PRODUCTS = [
  { product: 'Desk lamp', price: 450000 },
  { product: 'Notebook, set of 10', price: 180000 },
  { product: 'Ceramic mug', price: 95000 },
  { product: 'Standing desk', price: 4800000 },
  { product: 'Monitor arm', price: 1250000 },
  { product: 'Wireless keyboard', price: 890000 },
  { product: 'Desk mat', price: 320000 },
  { product: 'Cable organiser', price: 75000 },
];

const ASSIGNEES = ['lan', 'huy', 'anh'] as const;
const STATUSES = [
  'delivered',
  'processing',
  'new',
  'delivered',
  'delivered',
  'processing',
  'cancelled',
] as const;
const CHANNELS = ['Store', 'Website', 'Phone'] as const;

/**
 * The assignees, as a lookup: the rows hold the id, the grid shows the name, and the editor is a
 * Select of the names.
 */
export const ASSIGNEE_ITEMS = [
  { value: 'lan', text: 'Võ Thị Lan', initials: 'VL' },
  { value: 'huy', text: 'Lê Quang Huy', initials: 'QH' },
  { value: 'anh', text: 'Nguyễn Minh Anh', initials: 'MA' },
];

/** The day of the example, a constant so the server and the browser draw the same page. */
export const TODAY = '2026-11-27';

/** Forty orders, DH-1001 to DH-1040, over the first twelve days of November 2026. */
export const ORDERS: Order[] = Array.from({ length: 40 }, (_, index) => {
  const lines: OrderLine[] = Array.from({ length: 1 + (index % 3) }, (_, line) => ({
    ...PRODUCTS[(index * 3 + line * 5) % PRODUCTS.length]!,
    qty: 1 + ((index * 7 + line * 3) % 12),
  }));
  const day = 1 + Math.floor(index / 3.5);
  return {
    id: `DH-${1001 + index}`,
    customer: CUSTOMERS[index % CUSTOMERS.length]!,
    assignee: ASSIGNEES[index % ASSIGNEES.length]!,
    date: `2026-11-${String(day).padStart(2, '0')}`,
    status: STATUSES[index % STATUSES.length]!,
    channel: CHANNELS[(index + 1) % CHANNELS.length]!,
    qty: lines.reduce((sum, { qty }) => sum + qty, 0),
    total: lines.reduce((sum, { qty, price }) => sum + qty * price, 0),
    lines,
  };
});

/** The id the next new order gets: one more than the greatest number in the list. */
export const nextOrderId = (orders: readonly Order[]) =>
  `DH-${1 + Math.max(1000, ...orders.map((order) => Number(order.id.slice(3))))}`;
