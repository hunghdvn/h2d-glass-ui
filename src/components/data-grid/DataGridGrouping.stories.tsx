import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { onPlatform } from '../../../.storybook/platform';
import { realUserEvent } from '../../../.storybook/real-input';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridGroupItem, DataGridProps } from './index';

/**
 * The orders of R1 (spec phase 6 §4.3 R1, mockup question R): twelve orders in four statuses, whose
 * group totals are the mockup's. Delivered: four orders, 65.720.000 ₫. Cancelled: one, 890.000 ₫.
 * Processing: four (DH-1028 and DH-1024 are the mockup's own two, and two of Võ Thị Lan's, 11.350.000 ₫
 * together). New: three, 55.700.000 ₫. The quantities add to 135, as the mockup's footer says; the
 * totals add to 162.010.000 ₫, which the mockup's own footer does not (Claude's ruling on OQ 2).
 */
interface R1Order {
  id: string;
  customer: string;
  date: string;
  channel: 'Store' | 'Website' | 'Phone';
  qty: number;
  total: number;
  status: 'Delivered' | 'Cancelled' | 'Processing' | 'New';
  assignee: string;
}

const order = (
  id: string,
  customer: string,
  date: string,
  channel: R1Order['channel'],
  qty: number,
  total: number,
  status: R1Order['status'],
  assignee: string,
): R1Order => ({ id, customer, date, channel, qty, total, status, assignee });

const R1_ORDERS: readonly R1Order[] = [
  order(
    'DH-1034',
    'Nhà hàng Sen Vàng',
    '2026-11-10',
    'Store',
    12,
    21600000,
    'Delivered',
    'Lê Quang Huy',
  ),
  order(
    'DH-1031',
    'Đỗ Khánh Linh',
    '2026-11-08',
    'Website',
    8,
    14320000,
    'Delivered',
    'Lê Quang Huy',
  ),
  order(
    'DH-1030',
    'Quán Cà phê Mộc',
    '2026-11-07',
    'Phone',
    15,
    17800000,
    'Delivered',
    'Võ Thị Lan',
  ),
  order('DH-1027', 'Tiệm Hoa Sen', '2026-11-04', 'Store', 10, 12000000, 'Delivered', 'Võ Thị Lan'),
  order(
    'DH-1022',
    'Công ty Bình Minh',
    '2026-11-02',
    'Website',
    3,
    890000,
    'Cancelled',
    'Nguyễn Minh Anh',
  ),
  order(
    'DH-1028',
    'Cà phê Sương Sớm',
    '2026-11-05',
    'Website',
    25,
    9750000,
    'Processing',
    'Lê Quang Huy',
  ),
  order(
    'DH-1024',
    'Công ty Minh Phát',
    '2026-11-03',
    'Website',
    12,
    18600000,
    'Processing',
    'Nguyễn Minh Anh',
  ),
  order(
    'DH-1032',
    'Studio Ánh Dương',
    '2026-11-09',
    'Store',
    10,
    6100000,
    'Processing',
    'Võ Thị Lan',
  ),
  order(
    'DH-1033',
    'Công ty An Phát',
    '2026-11-10',
    'Phone',
    8,
    5250000,
    'Processing',
    'Võ Thị Lan',
  ),
  order('DH-1035', 'Tạp hóa Hoa Mai', '2026-11-11', 'Website', 14, 22500000, 'New', 'Võ Thị Lan'),
  order(
    'DH-1036',
    'Nhà sách Kim Đồng',
    '2026-11-11',
    'Store',
    9,
    18200000,
    'New',
    'Nguyễn Minh Anh',
  ),
  order('DH-1037', 'Cửa hàng Mai Linh', '2026-11-12', 'Phone', 9, 15000000, 'New', 'Lê Quang Huy'),
];

/** The order R1 lists its statuses in; a column's `sortValue` makes the groups come so. */
const STATUS_ORDER: readonly R1Order['status'][] = ['Delivered', 'Cancelled', 'Processing', 'New'];

/** E's columns for R1: Order, Customer, Order date, Channel, Qty, Total, then Status and Assignee. */
const R1_COLUMNS: DataGridColumn<R1Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 120 },
  { field: 'customer', caption: 'Customer' },
  { field: 'date', caption: 'Order date', dataType: 'date', width: 150 },
  { field: 'channel', caption: 'Channel', width: 150 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 110 },
  {
    field: 'total',
    caption: 'Total',
    dataType: 'number',
    format: { style: 'currency', currency: 'VND' },
    width: 200,
  },
  {
    field: 'status',
    caption: 'Status',
    width: 140,
    sortValue: (row) => STATUS_ORDER.indexOf(row.status),
  },
  { field: 'assignee', caption: 'Assignee', width: 160 },
];

const meta = {
  title: 'Components/DataGrid/Grouping',
  component: DataGrid,
  // Built but not released until the grid is exported (spec phase 6 §2): hidden from the sidebar of
  // the built docs, still run by the story tests and shot by the visual harness.
  tags: ['unreleased'],
  args: { data: R1_ORDERS, rowKey: 'id', columns: R1_COLUMNS, 'aria-label': 'Orders' },
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'region', enabled: false }],
      },
    },
  },
} satisfies Meta<DataGridProps<R1Order>>;

export default meta;
type Story = StoryObj<DataGridProps<R1Order>>;

/**
 * How long a story waits for the grid to show what a press asked of it: the state changes in the
 * press, and the commit and the focus it gives come in the engine's next rendering update, which
 * Linux WebKit on x86 (CI) delivers late. `waitFor` waits one second by default; a late update came
 * within five. Each message says what was missing, so a late update can be told from one that never
 * came.
 */
const RENDER_UPDATE = { timeout: 5000 };

const BY_STATUS_THEN_ASSIGNEE: DataGridGroupItem[] = [
  { field: 'status', direction: 'asc' },
  { field: 'assignee', direction: 'asc' },
];

const tableOf = (root: HTMLElement) =>
  root.querySelector<HTMLTableElement>('table[role="grid"], table[role="treegrid"]')!;
const bodyRowsOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>('tbody > tr'));
const groupRowsOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>('tbody > tr.flg-data-grid-group-row'));

/**
 * The inner shadows of an element as `[x, y]` offsets: the computed `box-shadow` writes each as four
 * lengths (x, y, blur, spread) next to its colour, whatever the engine's order of the parts.
 */
const insetOffsets = (element: HTMLElement): Array<[number, number]> => {
  const shadow = getComputedStyle(element).boxShadow;
  if (shadow === 'none') return [];
  const lengths = /(-?[\d.]+)px (-?[\d.]+)px (-?[\d.]+)px (-?[\d.]+)px/g;
  return Array.from(shadow.matchAll(lengths), (match) => [Number(match[1]), Number(match[2])]);
};
const hasInset = (element: HTMLElement, x: number, y: number) =>
  insetOffsets(element).some(([dx, dy]) => dx === x && dy === y);

/** A grid that a key of the story ungroups and groups again, with the focus staying in the grid. */
const RoleGrid = (props: Partial<DataGridProps<R1Order>>) => {
  const [grouping, setGrouping] = useState<DataGridGroupItem[]>(BY_STATUS_THEN_ASSIGNEE);
  const box = useRef<HTMLDivElement>(null);
  // The `g` key is no key of the grid: it comes to this listener from the cell that has the focus.
  useEffect(() => {
    const element = box.current!;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'g') setGrouping((now) => (now.length > 0 ? [] : BY_STATUS_THEN_ASSIGNEE));
    };
    element.addEventListener('keydown', onKeyDown);
    return () => element.removeEventListener('keydown', onKeyDown);
  }, []);
  return (
    <div ref={box} style={{ width: 560 }}>
      <DataGrid
        aria-label="Orders"
        data={R1_ORDERS}
        rowKey="id"
        columns={R1_COLUMNS}
        paging={false}
        grouping={grouping}
        {...props}
      />
    </div>
  );
};

/**
 * The keys of a group row (spec phase 6 §3.6, the tree grid pattern), with real input: Tab lands on
 * the first group row, the one stop of the grid; → opens a group, or goes to its first row; ← closes
 * an open group, or goes to the group above; Enter opens it again; Home and End go to the first and
 * the last row. The row with the focus has a frame of 2px around the whole row, drawn from the inner
 * shadows of its cells: top and bottom on each cell, the left side on the first, the right side on
 * the last. A group row that takes the focus scrolls the frame vertically only: a frame scrolled
 * sideways keeps its `scrollLeft`. Ungrouping a grid, which changes its role, keeps the focus in it.
 */
export const GroupRowKeys: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  render: () => <RoleGrid />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const frame = root.querySelector<HTMLElement>('.flg-data-grid-frame')!;
    const real = await realUserEvent();
    const table = tableOf(root);
    await expect(table).toHaveAttribute('role', 'treegrid');
    await waitFor(() => expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth + 100));
    if (!real) return;

    const stops = () => table.querySelectorAll('[tabindex="0"]');
    const active = () => document.activeElement as HTMLElement;
    const level = (row: HTMLElement) => row.getAttribute('aria-level');
    const first = groupRowsOf(root)[0]!;
    // Tab lands on the first group row, the one stop of the grid.
    for (let tabs = 0; tabs < 4 && !table.contains(document.activeElement); tabs += 1) {
      await real.tab();
    }
    await expect(active()).toBe(first);
    await expect(stops()).toHaveLength(1);

    // The frame around the whole row, measured from the shadows of its cells.
    const cells = Array.from(first.children) as HTMLElement[];
    await expect(cells.length).toBeGreaterThanOrEqual(2);
    for (const [at, cell] of cells.entries()) {
      await expect(hasInset(cell, 0, 2), `cell ${at} has the top side`).toBe(true);
      await expect(hasInset(cell, 0, -2), `cell ${at} has the bottom side`).toBe(true);
    }
    await expect(hasInset(cells[0]!, 2, 0), 'the first cell has the left side').toBe(true);
    await expect(hasInset(cells.at(-1)!, -2, 0), 'the last cell has the right side').toBe(true);

    // → on an open group goes to its first row, a group of the next level.
    await real.keyboard('{ArrowRight}');
    await waitFor(
      () => expect(level(active()), 'the focus is on a row of level 2').toBe('2'),
      RENDER_UPDATE,
    );
    const inner = active();
    await expect(inner.classList.contains('flg-data-grid-group-row')).toBe(true);
    // ← closes it (it is open), and then goes up to the group above (it is closed).
    await real.keyboard('{ArrowLeft}');
    await waitFor(() => expect(inner).toHaveAttribute('aria-expanded', 'false'), RENDER_UPDATE);
    await expect(active()).toBe(inner);
    await real.keyboard('{ArrowLeft}');
    await waitFor(
      () => expect(active(), 'the focus is on the group above').toBe(first),
      RENDER_UPDATE,
    );
    // ← closes the open first level, and has nothing above it once closed.
    await real.keyboard('{ArrowLeft}');
    await waitFor(() => expect(first).toHaveAttribute('aria-expanded', 'false'), RENDER_UPDATE);
    await real.keyboard('{ArrowLeft}');
    await expect(active()).toBe(first);
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    // Enter opens it again.
    await real.keyboard('{Enter}');
    await waitFor(() => expect(first).toHaveAttribute('aria-expanded', 'true'), RENDER_UPDATE);

    // End on a group row goes to the last row of the list; Home on a data row goes to its first cell, and
    // mod+Home to the first row, a group row.
    await real.keyboard('{End}');
    await waitFor(() => {
      const rows = bodyRowsOf(root);
      expect(active().closest('tr'), 'the focus is on the last row').toBe(rows.at(-1));
    }, RENDER_UPDATE);
    await real.keyboard('{Control>}{Home}{/Control}');
    await waitFor(
      () => expect(active(), 'the focus is back on the first row').toBe(first),
      RENDER_UPDATE,
    );
    await expect(stops()).toHaveLength(1);
  },
};

/**
 * A group row that takes the focus, in a frame scrolled sideways, scrolls the frame vertically only
 * (spec phase 6 §3.6): the cell with the focus is far to the right, ↑ goes to the row above, which is
 * as wide as the table, and `scrollLeft` is what it was.
 */
export const GroupRowKeepsScrollLeft: Story = {
  tags: ['no-visual'],
  render: () => <RoleGrid />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const frame = root.querySelector<HTMLElement>('.flg-data-grid-frame')!;
    const real = await realUserEvent();
    await waitFor(() => expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth + 100));
    if (!real) return;
    // A press on a cell of the first data row makes it the place; then the frame is scrolled sideways.
    const cell = root.querySelector<HTMLElement>('tbody > tr.flg-data-grid-row [tabindex]')!;
    await real.click(cell);
    await waitFor(() => expect(document.activeElement).toBe(cell), RENDER_UPDATE);
    frame.scrollLeft = 200;
    await waitFor(
      () => expect(frame.scrollLeft, 'the frame is scrolled').toBeGreaterThan(100),
      RENDER_UPDATE,
    );
    const left = frame.scrollLeft;
    await real.keyboard('{ArrowUp}');
    await waitFor(
      () =>
        expect(
          (document.activeElement as HTMLElement).classList.contains('flg-data-grid-group-row'),
          'the focus is on a group row',
        ).toBe(true),
      RENDER_UPDATE,
    );
    await expect(frame.scrollLeft).toBe(left);
  },
};

/**
 * The table is a `grid` and becomes a `treegrid` as the rows are grouped, and back; the focus stays in
 * the grid across both changes, on a place of it, never on the page.
 */
export const RoleChangeKeepsFocus: Story = {
  tags: ['no-visual'],
  render: () => <RoleGrid />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const real = await realUserEvent();
    if (!real) return;
    const cell = root.querySelector<HTMLElement>('tbody > tr.flg-data-grid-row [tabindex]')!;
    await real.click(cell);
    await waitFor(() => expect(document.activeElement).toBe(cell), RENDER_UPDATE);
    await real.keyboard('g');
    await waitFor(
      () => expect(tableOf(root), 'the table is a grid').toHaveAttribute('role', 'grid'),
      RENDER_UPDATE,
    );
    await expect(tableOf(root).contains(document.activeElement)).toBe(true);
    await real.keyboard('g');
    await waitFor(
      () => expect(tableOf(root), 'the table is a treegrid').toHaveAttribute('role', 'treegrid'),
      RENDER_UPDATE,
    );
    await expect(tableOf(root).contains(document.activeElement)).toBe(true);
  },
};

/**
 * Pages count the group rows and the data rows of the list: sixteen rows here, six to a page. The
 * second page starts inside Cancelled, so it begins with that group's row again, "(continued)",
 * before its own rows; the pager says the rows it counts.
 */
export const GroupedPaging: Story = {
  tags: ['no-visual'],
  args: {
    grouping: [{ field: 'status', direction: 'asc' }],
    paging: { pageSize: 6, pageSizes: [6] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    await expect(canvas.getByText('1–6 of 16')).toBeVisible();
    await expect(bodyRowsOf(root)).toHaveLength(6);
    await expect(groupRowsOf(root).map((row) => row.textContent)).toEqual([
      'Status: Delivered (4)',
      'Status: Cancelled (1)',
    ]);
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(canvas.getByText('7–12 of 16')).toBeVisible(), RENDER_UPDATE);
    const rows = bodyRowsOf(root);
    // The repeat is not a counted row: six counted rows and the repeat make seven.
    await expect(rows).toHaveLength(7);
    await expect(rows[0]).toHaveTextContent('Status: Cancelled (1) (continued)');
    await expect(rows[0]!.classList.contains('flg-data-grid-group-row')).toBe(true);
    await expect(rows[0]).toHaveAttribute('aria-posinset', '2');
    await expect(rows[1]).toHaveTextContent('DH-1022');
    await expect(rows[2]).toHaveTextContent('Status: Processing (4)');
  },
};

/** How long a story waits for a scroll event and the rendering update that applies it (as the Columns file). */
const SCROLL_EVENT = { timeout: 5000 };

const ASSIGNEES: readonly string[] = ['Lê Quang Huy', 'Võ Thị Lan', 'Nguyễn Minh Anh'];

/** Ten thousand orders in four statuses and three assignees: two levels of 4 + 12 group rows. */
const BIG_ORDERS: readonly R1Order[] = Array.from({ length: 10000 }, (_, index) =>
  order(
    `DH-${index + 1}`,
    `Customer ${index + 1}`,
    '2026-11-10',
    'Store',
    1,
    1000,
    STATUS_ORDER[index % STATUS_ORDER.length]!,
    ASSIGNEES[index % ASSIGNEES.length]!,
  ),
);

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const rowIndexOf = (row: Element) => Number(row.getAttribute('aria-rowindex'));
/** The `aria-rowindex` of every row of the list that is drawn, group rows and data rows. */
const drawnIndexes = (root: HTMLElement) =>
  bodyRowsOf(root)
    .filter((row) => row.hasAttribute('aria-rowindex'))
    .map(rowIndexOf);

/**
 * Ten thousand orders in two levels in a frame of 360px (spec phase 6 §3.7). The list is the heading, 16
 * group rows and 10 000 data rows, `aria-rowcount` 10017; the DOM holds what is seen, 6 rows more on each
 * side and the row with the keyboard, wherever the frame is scrolled; a group row that has the focus is
 * drawn and focused when the frame is scrolled far from it; mod+End reaches the last row, 10017. A
 * scroll is made by setting the frame's `scrollTop`, which gives the scroll event a wheel does (the
 * runner has no wheel), and every wait for its effect has the long timeout.
 */
export const GroupedVirtual: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  args: {
    data: BIG_ORDERS,
    grouping: BY_STATUS_THEN_ASSIGNEE,
    height: 360,
    scrolling: 'virtual',
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const table = tableOf(root);
    const frame = table.parentElement!;
    await expect(table).toHaveAttribute('aria-rowcount', '10017');
    await expect(table).toHaveAttribute('role', 'treegrid');
    const rowHeight = root.querySelector<HTMLElement>('tbody > tr.flg-data-grid-row')!.offsetHeight;
    // The most the DOM holds: the rows that are seen (a group row is lower than a data row, which
    // may fit one more), the overscan on each side, and the row of the keyboard.
    const most = Math.ceil(frame.clientHeight / rowHeight) + 1 + 2 * 6 + 1;
    const scrollTo = (top: number) => {
      frame.scrollTop = top;
    };
    await expect(bodyRowsOf(root).length).toBeLessThanOrEqual(most);

    scrollTo(frame.scrollHeight / 2);
    await waitFor(
      () =>
        expect(Math.max(...drawnIndexes(root)), 'the window is in the middle').toBeGreaterThan(
          4000,
        ),
      SCROLL_EVENT,
    );
    await expect(
      bodyRowsOf(root).filter((row) => row.hasAttribute('aria-rowindex')),
    ).not.toHaveLength(0);
    await expect(root.querySelectorAll('tbody > tr[aria-rowindex]').length).toBeLessThanOrEqual(
      most,
    );
    scrollTo(frame.scrollHeight);
    await waitFor(
      () =>
        expect(
          table.querySelector('tbody > [aria-rowindex="10017"]'),
          'the last row',
        ).not.toBeNull(),
      SCROLL_EVENT,
    );
    await expect(root.querySelectorAll('tbody > tr[aria-rowindex]').length).toBeLessThanOrEqual(
      most,
    );
    scrollTo(0);
    await waitFor(
      () => expect(Math.max(...drawnIndexes(root)), 'back at the top').toBeLessThan(40),
      SCROLL_EVENT,
    );

    const real = await realUserEvent();
    if (!real) return;
    // The first group row has the focus (a press would toggle it), and the frame goes far from it.
    const first = groupRowsOf(root)[0]!;
    first.focus();
    await waitFor(() => expect(first).toHaveFocus(), RENDER_UPDATE);
    scrollTo(frame.scrollHeight / 2);
    await waitFor(
      () => expect(Math.max(...drawnIndexes(root)), 'the window is far away').toBeGreaterThan(4000),
      SCROLL_EVENT,
    );
    await nextFrame();
    await expect(first.isConnected, 'the group row with the focus is kept').toBe(true);
    await expect(first).toHaveFocus();
    await expect(first).toHaveAttribute('aria-rowindex', '2');
    await expect(root.querySelectorAll('tbody > tr[aria-rowindex]').length).toBeLessThanOrEqual(
      most,
    );

    // mod+End: the last row is drawn, has the focus and is seen.
    await real.keyboard('{Control>}{End}{/Control}');
    await waitFor(
      () =>
        expect(document.activeElement!.closest('tr'), 'the last row').toHaveAttribute(
          'aria-rowindex',
          '10017',
        ),
      SCROLL_EVENT,
    );
    const last = document.activeElement!.closest('tr')!;
    await waitFor(() => {
      const head = table.tHead!.getBoundingClientRect().bottom;
      const box = last.getBoundingClientRect();
      expect(box.top, 'the last row is under the heading').toBeGreaterThanOrEqual(head - 0.5);
      expect(box.bottom).toBeLessThanOrEqual(frame.getBoundingClientRect().bottom + 0.5);
    }, SCROLL_EVENT);
    await real.keyboard('{Control>}{Home}{/Control}');
    await waitFor(
      () =>
        expect(document.activeElement!.closest('tr'), 'the first row').toHaveAttribute(
          'aria-rowindex',
          '2',
        ),
      SCROLL_EVENT,
    );
  },
};
