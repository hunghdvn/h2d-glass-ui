// Plain data: the Server Component hands it to the client grid, so nothing in it is a function.
export interface Order {
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
export const orders: Order[] = Array.from({ length: 30 }, (_, index) => ({
  id: `DH-${1001 + index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length]!,
  date: `2026-11-${String(1 + Math.floor(index / 3)).padStart(2, '0')}`,
  status: STATUSES[index % STATUSES.length]!,
  channel: CHANNELS[(index + 1) % CHANNELS.length]!,
  qty: 1 + ((index * 7) % 12),
  total: (1 + ((index * 5) % 9)) * 185000,
}));
