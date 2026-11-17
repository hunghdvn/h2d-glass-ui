import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Avatar } from '../avatar/Avatar';
import type { TableVariant } from '../table/Table';
import { DataGrid } from './DataGrid';
import { ROW_HEIGHT, rowPitch } from './row-heights';
import type { DataGridColumn, DataGridDensity, DataGridProps } from './index';

interface Order {
  id: string;
  customer: string;
  note: string;
  date: string;
  qty: number;
  total: number;
  paid: boolean;
}

const CUSTOMERS = [
  'Nguyễn Minh Anh',
  'Trần Quốc Bảo',
  'Lê Thị Hạnh',
  'Phạm Đức Long',
  'Hoàng Mai Linh',
  'Vũ Thanh Tùng',
];

/** Orders from a formula, so a story is the same on every run and in every engine. */
function makeOrders(count: number): Order[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `DH-${1100 - index}`,
    customer: CUSTOMERS[index % CUSTOMERS.length]!,
    note: index % 4 === 0 ? 'Fragile, leave with the neighbour if nobody is at home' : '',
    date: `2026-11-${String(1 + (index % 28)).padStart(2, '0')}`,
    qty: 1 + ((index * 7) % 12),
    total: 150000 + ((index * 98765) % 9000000),
    paid: index % 3 !== 0,
  }));
}

const ORDERS = makeOrders(40);

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
  {
    field: 'customer',
    caption: 'Customer',
    width: 220,
    // A custom cell with the tallest thing a row usually holds, an Avatar `sm` of 24px.
    cell: ({ text }) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <Avatar size="sm" alt="" fallback={text.slice(0, 1)} />
        {text}
      </span>
    ),
  },
  { field: 'date', caption: 'Order date', dataType: 'date', width: 130 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 70 },
  {
    field: 'total',
    caption: 'Total',
    dataType: 'number',
    format: { style: 'currency', currency: 'VND' },
    width: 150,
  },
  {
    field: 'paid',
    caption: 'Paid',
    dataType: 'boolean',
    width: 80,
  },
];

const meta = {
  title: 'Components/DataGrid',
  component: DataGrid,
  // Built but not released until the grid is exported (spec phase 6 §2): hidden from the sidebar of
  // the built docs, still run by the story tests and shot by the visual harness.
  tags: ['unreleased'],
  // The props every story needs; a story gives its own where it differs.
  args: { data: ORDERS, rowKey: 'id', columns: COLUMNS, 'aria-label': 'Orders' },
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'region', enabled: false },
          // The one tab stop of a grid, its active cell, comes with the keyboard plan. Until then a grid
          // that scrolls has nothing to focus, and axe counts only tab stops as keyboard access. This
          // rule is turned back on there.
          { id: 'scrollable-region-focusable', enabled: false },
        ],
      },
    },
  },
} satisfies Meta<DataGridProps<Order>>;

export default meta;
type Story = StoryObj<DataGridProps<Order>>;

const DENSITIES: readonly DataGridDensity[] = ['compact', 'standard', 'comfortable'];
const VARIANTS: readonly TableVariant[] = ['lined', 'striped', 'minimal'];

/** A grid of three rows, for the stories that measure it. */
const Small = ({ id, ...props }: { id: string } & Partial<DataGridProps<Order>>) => (
  <DataGrid
    data={ORDERS.slice(0, 3)}
    rowKey="id"
    columns={COLUMNS}
    aria-label={id}
    data-testid={id}
    {...props}
  />
);

/** The default grid: a caption, a description, and the columns of the mockup's orders. */
export const Default: Story = {
  tags: ['no-visual'],
  args: {
    data: ORDERS.slice(0, 8),
    rowKey: 'id',
    columns: COLUMNS,
    caption: 'Orders',
    description: 'Orders of the last month, newest first.',
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('tbody > tr')).toHaveLength(8);
    await expect(canvasElement.querySelectorAll('thead th')).toHaveLength(COLUMNS.length);
  },
};

/**
 * The height of a row is the one of the table of spec 4.3, in every density and variant, and the
 * distance between two neighbours is that and, for `striped`, the 2px between the rows. A virtual
 * window multiplies by it, so it is measured here in each engine and not assumed. Each grid has a
 * cell with an Avatar `sm`, the tallest thing a row usually holds: it must not make a row taller.
 */
export const RowPitch: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      {DENSITIES.flatMap((density) =>
        VARIANTS.map((variant) => (
          <Small
            key={`${density}-${variant}`}
            id={`${density}-${variant}`}
            density={density}
            variant={variant}
          />
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement, canvas }) => {
    await expect(canvasElement.querySelectorAll('.flg-data-grid')).toHaveLength(9);
    for (const density of DENSITIES) {
      for (const variant of VARIANTS) {
        const grid = canvas.getByTestId(`${density}-${variant}`);
        const rows = grid.querySelectorAll<HTMLElement>('tbody > tr');
        await expect(rows, `${density} ${variant}`).toHaveLength(3);
        const height = ROW_HEIGHT[density][variant];
        await expect(rows[0]!.offsetHeight, `${density} ${variant} row`).toBe(height);
        await expect(rows[1]!.offsetTop - rows[0]!.offsetTop, `${density} ${variant} pitch`).toBe(
          rowPitch(height, variant),
        );
      }
    }
  },
};

/**
 * With a `height` the rows scroll under a heading that stays at the top of the frame, in each look.
 * The heading is flush with the top of what the frame shows, and a press across it is a press of the
 * heading and not of a row that scrolled under it (`z-index`).
 */
export const StickyHeader: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 24, width: 720 }}>
      {VARIANTS.map((variant) => (
        <DataGrid
          key={variant}
          data={ORDERS}
          rowKey="id"
          columns={COLUMNS}
          variant={variant}
          height={220}
          aria-label={variant}
          data-testid={variant}
        />
      ))}
    </div>
  ),
  play: async ({ canvasElement, canvas }) => {
    await expect(canvasElement.querySelectorAll('.flg-data-grid')).toHaveLength(3);
    for (const variant of VARIANTS) {
      const grid = canvas.getByTestId(variant);
      const frame = grid.querySelector<HTMLElement>('.flg-data-grid-frame')!;
      const head = grid.querySelector<HTMLElement>('thead')!;
      // The frame has a scroll to do: more rows than it shows.
      await expect(frame.scrollHeight, variant).toBeGreaterThan(frame.clientHeight + 100);
      frame.scrollTop = 150;
      await waitFor(() => expect(frame.scrollTop, variant).toBeGreaterThan(100));
      const top = frame.getBoundingClientRect().top + frame.clientTop;
      await expect(
        Math.abs(head.getBoundingClientRect().top - top),
        `${variant}: the heading is flush with the frame`,
      ).toBeLessThan(1);
      const box = head.getBoundingClientRect();
      const heads = head.querySelectorAll('th');
      await expect(heads).toHaveLength(COLUMNS.length);
      for (const cell of heads) {
        const cellBox = cell.getBoundingClientRect();
        // The frame may be narrower than the table; only the cells that are in view are pressed.
        if (cellBox.right > frame.getBoundingClientRect().right) continue;
        const hit = document.elementFromPoint(
          cellBox.left + cellBox.width / 2,
          box.top + box.height / 2,
        );
        await expect(head.contains(hit), `${variant}: ${cell.textContent} is on top`).toBe(true);
      }
    }
  },
};

const FLEXIBLE: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', width: 100 },
  { field: 'customer', caption: 'Customer', minWidth: 60 },
  { field: 'note', caption: 'Note', minWidth: 200 },
];

/**
 * Columns with no `width` share the room of the frame, none under its `minWidth`, and the table is
 * as wide as the frame or as its columns need. Narrow: the frame scrolls and each column keeps its
 * minimum. Wide: the columns fill the frame.
 */
export const FlexibleColumns: Story = {
  tags: ['no-visual'],
  render: () => (
    <div data-testid="room" style={{ width: 280 }}>
      <DataGrid data={ORDERS.slice(0, 4)} rowKey="id" columns={FLEXIBLE} aria-label="Flexible" />
    </div>
  ),
  play: async ({ canvas }) => {
    const room = canvas.getByTestId('room');
    const frame = room.querySelector<HTMLElement>('.flg-data-grid-frame')!;
    const table = room.querySelector<HTMLElement>('table')!;
    const widths = () =>
      Array.from(room.querySelectorAll<HTMLElement>('thead th')).map((cell) => cell.offsetWidth);
    await expect(widths()).toHaveLength(3);
    // 100 + 60 + 200 is what the columns need, and the frame has 280.
    await waitFor(() => expect(widths()[1]).toBeGreaterThanOrEqual(60));
    await expect(widths()[0]).toBe(100);
    await expect(widths()[2]).toBeGreaterThanOrEqual(200);
    await expect(table.offsetWidth).toBeGreaterThanOrEqual(360);
    await expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth);
    room.style.width = '900px';
    // The grid measures the frame again after the resize; until it has, the columns are the old ones.
    await waitFor(() => expect(widths()[0]).toBe(100));
    await expect(Math.abs(table.offsetWidth - frame.clientWidth)).toBeLessThan(1);
    const wide = widths();
    await expect(wide[0]).toBe(100);
    await expect(wide[1]).toBeGreaterThanOrEqual(60);
    await expect(wide[2]).toBeGreaterThanOrEqual(200);
    await expect(wide[0]! + wide[1]! + wide[2]!).toBe(table.offsetWidth);
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};

/** A text longer than its column ends in an ellipsis and does not make its row taller. */
export const Ellipsis: Story = {
  tags: ['no-visual'],
  render: () => (
    <DataGrid
      data={ORDERS.slice(0, 4)}
      rowKey="id"
      columns={[
        { field: 'id', caption: 'Order', width: 100 },
        { field: 'note', caption: 'Note', width: 120 },
      ]}
      aria-label="Notes"
    />
  ),
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector<HTMLElement>('tbody > tr')!;
    const note = row.children[1] as HTMLElement;
    const text = ORDERS[0]!.note;
    await expect(note.textContent).toBe(text);
    // The text is longer than the cell, which shows it cut.
    await expect(note.scrollWidth).toBeGreaterThan(note.clientWidth);
    await expect(getComputedStyle(note).textOverflow).toBe('ellipsis');
    await expect(row.offsetHeight).toBe(ROW_HEIGHT.standard.lined);
  },
};

/**
 * A grid in a cell of another takes its own row height and its own heading height, not the outer
 * one's: the custom properties it reads are declared on its own elements, so they do not inherit
 * (the inner grid has no `height`, so it measures no heading of its own).
 */
export const NestedGrid: Story = {
  tags: ['no-visual'],
  render: () => (
    <DataGrid
      data={ORDERS.slice(0, 2)}
      rowKey="id"
      height={400}
      aria-label="Outer"
      data-testid="outer"
      columns={[
        { field: 'id', caption: 'Order', width: 104 },
        {
          id: 'lines',
          caption: 'Lines',
          width: 420,
          value: (row) => row.id,
          cell: () => (
            <DataGrid
              data={ORDERS.slice(0, 3)}
              rowKey="id"
              density="compact"
              aria-label="Lines"
              data-testid="inner"
              columns={[
                { field: 'id', caption: 'Line', width: 100 },
                { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
              ]}
            />
          ),
        },
      ]}
    />
  ),
  play: async ({ canvas }) => {
    const outer = canvas.getByTestId('outer');
    // Each of the two outer rows has its own inner grid.
    const inner = canvas.getAllByTestId('inner')[0]!;
    const innerRow = inner.querySelector<HTMLElement>('tbody > tr')!;
    await expect(innerRow.offsetHeight).toBe(ROW_HEIGHT.compact.lined);
    const outerFrame = outer.querySelector<HTMLElement>(
      ':scope > .flg-data-grid-main > .flg-data-grid-frame',
    )!;
    const innerFrame = inner.querySelector<HTMLElement>('.flg-data-grid-frame')!;
    // The outer grid has a height, so its frame holds the measured height of its heading. The inner
    // grid has none and measures nothing: it must read its own estimate, not the one it would
    // inherit from the frame around it.
    await waitFor(() =>
      expect(outerFrame.style.getPropertyValue('--flg-table-head-height')).toMatch(/px$/),
    );
    await expect(innerFrame.style.getPropertyValue('--flg-table-head-height')).toBe('');
    await expect(getComputedStyle(innerFrame).getPropertyValue('--flg-table-head-height')).not.toBe(
      outerFrame.style.getPropertyValue('--flg-table-head-height'),
    );
    await expect(outer.style.getPropertyValue('--flg-data-grid-row-height')).toBe('41px');
    await expect(inner.style.getPropertyValue('--flg-data-grid-row-height')).toBe('31px');
  },
};
