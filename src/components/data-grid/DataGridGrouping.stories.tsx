import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { onPlatform } from '../../../.storybook/platform';
import { noTitleIsCut, SALE_COLUMNS, SalesGrid } from '../../../.storybook/data-grid-orders';
import { realUserEvent } from '../../../.storybook/real-input';
import { Card } from '../card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table';
import { DataGrid } from './DataGrid';
import type {
  DataGridColumn,
  DataGridGroupItem,
  DataGridKey,
  DataGridProps,
  DataGridRowDrop,
} from './index';

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
// The rows of the grid's own body: a table in a detail has rows of its own, which are no rows of the grid.
const bodyRowsOf = (root: HTMLElement) => Array.from(tableOf(root).tBodies[0]?.rows ?? []);
const groupRowsOf = (root: HTMLElement) =>
  bodyRowsOf(root).filter((row) => row.classList.contains('flg-data-grid-group-row'));

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

// ---- The group panel (spec phase 6 §3.8, §4.3 R1 "Thanh nhóm", Task 5) ------------------------------

/**
 * R1's grid in R1's card, 1332px wide as in the mockup, with the G1 toolbar (the panel, then the search
 * field and the column chooser) and no total and no detail yet, so later tasks do not move these shots.
 * The rows are text rows of 33px (Claude's ruling on OQ 1).
 */
const R1Card = (props: Partial<DataGridProps<R1Order>>) => (
  <div style={{ width: 1332 }}>
    <Card>
      <DataGrid
        data={R1_ORDERS}
        rowKey="id"
        columns={R1_COLUMNS}
        caption="Orders"
        locale="vi-VN"
        rowHeight={33}
        paging={false}
        searchPanel
        columnChooser
        groupPanel
        {...props}
      />
    </Card>
  </div>
);

const panelOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('.flg-data-grid-group-panel')!;
const chipsOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>('.flg-data-grid-group-chip'));
/** The caption of each chip, in order. */
const chipCaptions = (root: HTMLElement) =>
  chipsOf(root).map((chip) => chip.firstChild?.textContent);
const chipButtons = (chip: HTMLElement) =>
  Array.from(chip.querySelectorAll<HTMLButtonElement>('button'));
const titleOf = (root: HTMLElement, caption: string) =>
  Array.from(root.querySelectorAll<HTMLElement>('th.flg-data-grid-head')).find((cell) =>
    cell.textContent?.includes(caption),
  )!;
const middleOf = (element: Element) => {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};
const near = (actual: number, expected: number, within: number, what: string) =>
  expect(Math.abs(actual - expected), `${what}: ${actual} against ${expected}`).toBeLessThanOrEqual(
    within,
  );

/**
 * R1 crop 2, "Thanh nhóm khi trống" (spec phase 6 §4.3 R1 "Rỗng"): the tray of an empty grouping in R1's
 * card, after the caption, with the group icon and the hint. Expected differences from the crop, all
 * listed in the rulings of the draft: the tray is as wide as its content and not 520px (OQ 6), the toolbar
 * is G1's (the search field is 260px and the column chooser stands beside it), and under the tray stand
 * the frame and its rows, which the crop does not draw.
 */
export const GroupPanelEmpty: Story = {
  tags: ['viewport-1440x720'],
  render: () => <R1Card />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const tray = panelOf(root);
    await expect(tray).toHaveAttribute('data-empty');
    await expect(tray).toHaveTextContent('Drag a column header here to group by that column');
    await expect(chipsOf(root)).toHaveLength(0);
    const style = getComputedStyle(tray);
    await expect([style.paddingLeft, style.paddingRight]).toEqual(['14px', '14px']);
    await expect(Math.round(tray.getBoundingClientRect().height)).toBe(34);
    const icon = tray.querySelector('svg')!;
    await expect([icon.clientWidth, icon.clientHeight]).toEqual([15, 15]);
    // As wide as its content, and not stretched to the room of the row.
    await expect(tray.getBoundingClientRect().width).toBeLessThan(520);
    await noTitleIsCut(root);
  },
};

/**
 * Holds the title of Channel over the end of the tray with a pointer the browser does not know (the same
 * as `GroupByDrag` does), measures the bar of the end slot, and cancels the drag. The tray grows its
 * end padding while it takes a drop, so the bar of 3px stands clear of the border and of the last chip,
 * at least 3px from each (it once stood 0.5px from both).
 */
async function barClearOfBoth(
  root: HTMLElement,
  title: HTMLElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const tray = panelOf(root);
  const send = pointer('mouse', 73, from);
  send(title, 'pointerdown');
  send(document, 'pointermove', to);
  await waitFor(
    () => expect(tray, 'the bar is at the end').toHaveAttribute('data-drop-end'),
    RENDER_UPDATE,
  );
  const bar = getComputedStyle(tray, '::after');
  const box = tray.getBoundingClientRect();
  const borderRight = parseFloat(getComputedStyle(tray).borderRightWidth);
  // Where the bar stands, from the right edge of the tray's padding box (the inner edge of the border).
  const barRight = box.right - borderRight - parseFloat(bar.right);
  const barLeft = barRight - parseFloat(bar.width);
  const lastChip = chipsOf(root).at(-1)!.getBoundingClientRect();
  await expect(parseFloat(bar.width)).toBe(3);
  await expect(
    box.right - borderRight - barRight,
    'the bar is at least 3px from the border',
  ).toBeGreaterThanOrEqual(3);
  await expect(
    barLeft - lastChip.right,
    'and at least 3px from the last chip',
  ).toBeGreaterThanOrEqual(3);
  send(document, 'pointercancel');
  await waitFor(
    () => expect(tray, 'the drag ended').not.toHaveAttribute('data-drop-target'),
    RENDER_UPDATE,
  );
}

/**
 * Outside the mockups (spec phase 6 §4.3 R1 "Đang có tiêu đề hay chip kéo qua"): the grid is grouped by
 * Status, and the title of Channel is held over the end of the tray (the harness drags what has
 * `data-visual-drag` by the distance it says, and shoots with the button down): the tray has the accent
 * border, a bar of 3px by 26px stands after the chip, the chip "Channel" follows the pointer, and the
 * heading has no drop line.
 */
export const GroupPanelDropTarget: Story = {
  tags: ['viewport-1440x720'],
  render: () => <R1Card defaultGrouping={[{ field: 'status', direction: 'asc' }]} />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    await expect(chipCaptions(root)).toEqual(['Status']);
    await expect(groupRowsOf(root)).toHaveLength(4);
    await noTitleIsCut(root);
    const channel = titleOf(root, 'Channel');
    const from = middleOf(channel);
    const chip = chipsOf(root)[0]!.getBoundingClientRect();
    const tray = panelOf(root).getBoundingClientRect();
    // Just right of the middle of the only chip, over the tray: the slot after it.
    const to = { x: chip.right + 2, y: tray.top + tray.height / 2 };
    await expect(to.x).toBeLessThan(tray.right);
    await barClearOfBoth(root, channel, from, to);
    channel.setAttribute(
      'data-visual-drag',
      `${Math.round(to.x - from.x)},${Math.round(to.y - from.y)}`,
    );
    // The chip of the drag is 16px below the pointer, and ends inside the stage (the card).
    const card = root.closest('.flg-card')!.getBoundingClientRect();
    await expect(to.y + 16 + 30).toBeLessThan(card.bottom);
  },
};

/**
 * Outside the mockups: a tray of four levels in a grid 360px wide. The chips wrap onto a second line and
 * every one stays inside the border of the tray, which grows to hold them; no title is cut.
 */
export const GroupPanelNarrow: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 360 }}>
      <DataGrid
        data={R1_ORDERS}
        rowKey="id"
        columns={R1_COLUMNS}
        caption="Orders"
        locale="vi-VN"
        paging={false}
        groupPanel
        defaultGrouping={[
          { field: 'status', direction: 'asc' },
          { field: 'assignee', direction: 'asc' },
          { field: 'channel', direction: 'asc' },
          { field: 'customer', direction: 'asc' },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    await expect(chipCaptions(root)).toEqual(['Status', 'Assignee', 'Channel', 'Customer']);
    const tray = panelOf(root).getBoundingClientRect();
    const border = 1;
    for (const chip of chipsOf(root)) {
      const box = chip.getBoundingClientRect();
      const name = chip.firstChild?.textContent;
      await expect(box.left, `${name}: inside on the left`).toBeGreaterThanOrEqual(
        tray.left + border,
      );
      await expect(box.right, `${name}: inside on the right`).toBeLessThanOrEqual(
        tray.right - border,
      );
      await expect(box.top, `${name}: inside at the top`).toBeGreaterThanOrEqual(tray.top + border);
      await expect(box.bottom, `${name}: inside at the bottom`).toBeLessThanOrEqual(
        tray.bottom - border,
      );
    }
    // It wrapped: the tray is taller than the single line of R1's two chips.
    await expect(tray.height).toBeGreaterThan(34);
    await noTitleIsCut(root);
  },
};

/** A grid grouped by three levels whose parent keeps the grouping, as a caller that saves it does. */
const GroupingGrid = (props: Partial<DataGridProps<R1Order>>) => {
  const [grouping, setGrouping] = useState<DataGridGroupItem[]>([
    { field: 'status', direction: 'asc' },
    { field: 'assignee', direction: 'asc' },
    { field: 'channel', direction: 'asc' },
  ]);
  return (
    <div style={{ width: 1100 }}>
      <DataGrid
        aria-label="Orders"
        caption="Orders"
        data={R1_ORDERS}
        rowKey="id"
        columns={R1_COLUMNS}
        paging={false}
        groupPanel
        {...props}
        grouping={grouping}
        onGroupingChange={(next) => {
          props.onGroupingChange?.(next);
          setGrouping([...next]);
        }}
      />
    </div>
  );
};

/**
 * The play of the keys of the chips, on the platform the story says: Tab lands on the first button of
 * the first chip (the panel comes first in the toolbar and nothing else of it is a stop); mod+Shift+→
 * moves the level one place and the focus stays on the same button of the same chip; at an edge it does
 * nothing; the direction button turns the level and its name says the next direction; the remove button
 * takes the level out and the focus goes to the same button of the chip that is now in its place, then to
 * the one before, and with no chip left to the grid's active cell. Every step waits for the grid's next
 * rendering update, never for a number of calls.
 */
const panelKeysPlay =
  (mod: 'Control' | 'Meta'): NonNullable<Story['play']> =>
  async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const real = await realUserEvent();
    const names = (chip: HTMLElement) =>
      chipButtons(chip).map((button) => button.getAttribute('aria-label'));
    await expect(chipCaptions(root)).toEqual(['Status', 'Assignee', 'Channel']);
    await expect(names(chipsOf(root)[0]!)).toEqual([
      'Sort Status groups descending',
      'Ungroup Status',
    ]);
    if (!real) return;
    const chipOf = (caption: string) =>
      chipsOf(root).find((chip) => chip.firstChild?.textContent === caption)!;
    const keys = (arrow: 'ArrowLeft' | 'ArrowRight') =>
      real.keyboard(`{${mod}>}{Shift>}{${arrow}}{/Shift}{/${mod}}`);

    await real.tab();
    await expect(document.activeElement).toBe(chipButtons(chipOf('Status'))[0]);
    await keys('ArrowRight');
    await waitFor(
      () =>
        expect(chipCaptions(root), 'Status moved one place right').toEqual([
          'Assignee',
          'Status',
          'Channel',
        ]),
      RENDER_UPDATE,
    );
    await expect(document.activeElement, 'the focus stays on its button').toBe(
      chipButtons(chipOf('Status'))[0],
    );
    // On the remove button, the same key moves the level, and the focus stays on that button.
    await real.tab();
    await expect(document.activeElement).toBe(chipButtons(chipOf('Status'))[1]);
    await keys('ArrowRight');
    await waitFor(
      () => expect(chipCaptions(root)).toEqual(['Assignee', 'Channel', 'Status']),
      RENDER_UPDATE,
    );
    await expect(document.activeElement).toBe(chipButtons(chipOf('Status'))[1]);
    // At the end, the key does nothing.
    await keys('ArrowRight');
    await nextFrame();
    await expect(chipCaptions(root)).toEqual(['Assignee', 'Channel', 'Status']);
    await expect(document.activeElement).toBe(chipButtons(chipOf('Status'))[1]);
    await keys('ArrowLeft');
    await waitFor(
      () => expect(chipCaptions(root)).toEqual(['Assignee', 'Status', 'Channel']),
      RENDER_UPDATE,
    );

    // The direction button turns the level, and its name says the next direction.
    const turn = chipButtons(chipOf('Status'))[0]!;
    turn.focus();
    await real.keyboard('{Enter}');
    await waitFor(
      () =>
        expect(turn, 'the name says the next direction').toHaveAttribute(
          'aria-label',
          'Sort Status groups ascending',
        ),
      RENDER_UPDATE,
    );
    await expect(document.activeElement).toBe(turn);
    await expect(chipCaptions(root)).toEqual(['Assignee', 'Status', 'Channel']);

    // Removing: the focus goes to the same button of the chip now in its place, else the one before.
    chipButtons(chipOf('Status'))[1]!.focus();
    await real.keyboard('{Enter}');
    await waitFor(() => expect(chipCaptions(root)).toEqual(['Assignee', 'Channel']), RENDER_UPDATE);
    await expect(document.activeElement, 'the chip now in its place').toBe(
      chipButtons(chipOf('Channel'))[1],
    );
    await real.keyboard('{Enter}');
    await waitFor(() => expect(chipCaptions(root)).toEqual(['Assignee']), RENDER_UPDATE);
    await expect(document.activeElement, 'the chip before').toBe(
      chipButtons(chipOf('Assignee'))[1],
    );
    await real.keyboard('{Enter}');
    await waitFor(() => expect(chipsOf(root)).toHaveLength(0), RENDER_UPDATE);
    await expect(
      root.querySelector('table')!.contains(document.activeElement),
      'the grid has the focus when no chip is left',
    ).toBe(true);
    await expect(document.activeElement).toHaveAttribute('tabindex', '0');
  };

/** The keys of the chips (see `panelKeysPlay`), with Ctrl as the key of the platform. */
export const GroupPanelKeys: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  render: () => <GroupingGrid />,
  play: panelKeysPlay('Control'),
};

/** The keys of the chips on a Mac, where the key is ⌘. */
export const GroupPanelKeysOnAMac: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('apple'),
  render: () => <GroupingGrid />,
  play: panelKeysPlay('Meta'),
};

/**
 * A pointer the browser does not know, for the states of a drag that need the button held (a real button
 * cannot be left down from a play function) and for a finger, which the runner does not emulate: the
 * listeners of the page follow a pointer of any id and type. The layout and the stylesheet are the
 * browser's.
 */
function pointer(type: 'mouse' | 'touch', id: number, from: { x: number; y: number }) {
  return (target: EventTarget, name: string, to: { x: number; y: number } = from) =>
    target.dispatchEvent(
      new PointerEvent(name, {
        bubbles: true,
        cancelable: true,
        pointerId: id,
        isPrimary: true,
        pointerType: type,
        button: 0,
        buttons: name === 'pointerup' ? 0 : 1,
        clientX: to.x,
        clientY: to.y,
      }),
    );
}

/** Where a pointer just inside the left edge of the chip `at` is: over the slot before it. */
const beforeChip = (root: HTMLElement, at: number) => {
  const box = chipsOf(root)[at]!.getBoundingClientRect();
  const tray = panelOf(root).getBoundingClientRect();
  return { x: box.left + 6, y: tray.top + tray.height / 2 };
};
/** Where a pointer just after the last chip, still inside the tray, is: over the slot at the end. */
const afterChips = (root: HTMLElement) => {
  const box = chipsOf(root).at(-1)!.getBoundingClientRect();
  const tray = panelOf(root).getBoundingClientRect();
  return { x: box.right + 2, y: tray.top + tray.height / 2 };
};

/**
 * Grouping by the mouse, in each engine (spec phase 6 §3.8): a title dragged into the tray groups by its
 * column at the place of the drop; chips are reordered; a chip dragged onto the headings ungroups; and
 * after each drag the cursor mark is gone. The states that need the button held are made with pointer
 * events the browser does not know: over the tray it has the accent border, a bar of 3px by 26px before
 * the chip the level would go before (drawn by the stylesheet from `data-drop-before`), the chip of the
 * grid 16px from the pointer in the top layer, the heading without a drop line, and the source chip at
 * 35% while a chip is dragged. The drops are made with the real mouse.
 */
export const GroupByDrag: Story = {
  tags: ['no-visual'],
  args: { onGroupingChange: fn() },
  render: (args) => <GroupingGrid onGroupingChange={args.onGroupingChange} />,
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const html = document.documentElement;
    const frame = root.querySelector<HTMLElement>('.flg-data-grid-frame')!;
    const calls = args.onGroupingChange as ReturnType<typeof fn>;
    const tray = panelOf(root);
    const settled = async (what: string) => {
      await nextFrame();
      await expect(html, `${what}: the cursor mark is gone`).not.toHaveAttribute(
        'data-flg-grid-cursor',
      );
      await expect(
        document.querySelector('.flg-data-grid-drag-chip'),
        `${what}: the chip is gone`,
      ).toBeNull();
      await expect(tray, `${what}: the tray is not marked`).not.toHaveAttribute('data-drop-target');
    };
    await expect(chipCaptions(root)).toEqual(['Status', 'Assignee', 'Channel']);

    // A held drag of the title of Qty over the tray, before the second chip.
    const qty = titleOf(root, 'Qty');
    const start = middleOf(qty);
    const send = pointer('mouse', 71, start);
    const slot = beforeChip(root, 1);
    send(qty, 'pointerdown');
    send(document, 'pointermove', slot);
    await waitFor(
      () => expect(tray, 'the tray is marked').toHaveAttribute('data-drop-target'),
      RENDER_UPDATE,
    );
    await waitFor(
      () =>
        expect(chipsOf(root)[1], 'the bar is before the second chip').toHaveAttribute(
          'data-drop-before',
        ),
      RENDER_UPDATE,
    );
    const border = getComputedStyle(tray).borderTopColor;
    const bar = getComputedStyle(chipsOf(root)[1]!, '::before');
    await expect([bar.width, bar.height, bar.position]).toEqual(['3px', '26px', 'absolute']);
    await expect(bar.backgroundColor, 'the bar and the border are the accent').toBe(border);
    await expect(
      root.querySelector('.flg-data-grid-drop-line'),
      'no line in the heading',
    ).toBeNull();
    const dragged = document.querySelector<HTMLElement>('.flg-data-grid-drag-chip')!;
    await expect(dragged).toHaveTextContent('Qty');
    near(
      dragged.getBoundingClientRect().left,
      slot.x + 16,
      1.5,
      'the chip is 16px right of the pointer',
    );
    near(dragged.getBoundingClientRect().top, slot.y + 16, 1.5, 'and 16px below it');
    await expect(html).toHaveAttribute('data-flg-grid-cursor', 'grabbing');
    // The pointer goes after the last chip: the bar is at the end of the tray.
    send(document, 'pointermove', afterChips(root));
    await waitFor(
      () => expect(tray, 'the bar is at the end').toHaveAttribute('data-drop-end'),
      RENDER_UPDATE,
    );
    await expect(root.querySelector('[data-drop-before]')).toBeNull();
    const end = getComputedStyle(tray, '::after');
    await expect([end.width, end.height]).toEqual(['3px', '26px']);
    // Back over the heading the tray is not marked.
    send(document, 'pointermove', { x: start.x - 40, y: start.y });
    await waitFor(() => expect(tray).not.toHaveAttribute('data-drop-target'), RENDER_UPDATE);
    // Escape puts everything back.
    send(document, 'pointermove', slot);
    await waitFor(() => expect(tray).toHaveAttribute('data-drop-target'), RENDER_UPDATE);
    await real.keyboard('{Escape}');
    await settled('Escape');
    send(document, 'pointerup', slot);
    await nextFrame();
    await expect(calls).not.toHaveBeenCalled();

    // The real mouse: the title of Qty into the tray, after the last chip.
    const trayBox = tray.getBoundingClientRect();
    const last = afterChips(root);
    await real.dragAndDrop(titleOf(root, 'Qty'), tray, {
      targetPosition: {
        x: last.x - trayBox.left - tray.clientLeft,
        y: trayBox.height / 2 - tray.clientTop,
      },
    });
    await waitFor(
      () =>
        expect(chipCaptions(root), 'Qty is the last level').toEqual([
          'Status',
          'Assignee',
          'Channel',
          'Qty',
        ]),
      RENDER_UPDATE,
    );
    await expect(calls).toHaveBeenCalledTimes(1);
    await settled('the drop of a title');
    await expect(
      Array.from(root.querySelectorAll('th.flg-data-grid-head')).some(
        (cell) => cell.textContent === 'Qty',
      ),
      'the column left the heading',
    ).toBe(false);

    // A chip dragged: Qty before Status. The source is at 35% while it is held.
    const source = chipsOf(root).at(-1)!;
    const from = source.getBoundingClientRect();
    const grip = { x: from.left + 5, y: from.top + from.height / 2 };
    const hold = pointer('mouse', 72, grip);
    hold(source, 'pointerdown');
    hold(document, 'pointermove', beforeChip(root, 0));
    await waitFor(
      () => expect(source, 'the source chip is dimmed').toHaveAttribute('data-drag-source'),
      RENDER_UPDATE,
    );
    await expect(getComputedStyle(source).opacity).toBe('0.35');
    await expect(chipsOf(root)[0]).toHaveAttribute('data-drop-before');
    hold(document, 'pointermove', grip);
    await waitFor(
      () => expect(root.querySelector('[data-drop-before]'), 'no bar beside itself').toBeNull(),
      RENDER_UPDATE,
    );
    hold(document, 'pointerup', grip);
    await settled('a drop beside itself');
    await expect(chipCaptions(root)).toEqual(['Status', 'Assignee', 'Channel', 'Qty']);
    await expect(calls).toHaveBeenCalledTimes(1);
    const before = beforeChip(root, 0);
    await real.dragAndDrop(chipsOf(root).at(-1)!, tray, {
      sourcePosition: { x: 5, y: from.height / 2 },
      targetPosition: {
        x: before.x - trayBox.left - tray.clientLeft,
        y: trayBox.height / 2 - tray.clientTop,
      },
    });
    await waitFor(
      () =>
        expect(chipCaptions(root), 'Qty is the first level').toEqual([
          'Qty',
          'Status',
          'Assignee',
          'Channel',
        ]),
      RENDER_UPDATE,
    );
    await expect(calls).toHaveBeenCalledTimes(2);
    await settled('the drop of a chip');

    // A chip onto the heading: Qty is ungrouped, and its title is back.
    await real.dragAndDrop(chipsOf(root)[0]!, titleOf(root, 'Customer'), {
      sourcePosition: { x: 5, y: from.height / 2 },
    });
    await waitFor(
      () =>
        expect(chipCaptions(root), 'Qty is ungrouped').toEqual(['Status', 'Assignee', 'Channel']),
      RENDER_UPDATE,
    );
    await expect(calls).toHaveBeenCalledTimes(3);
    await expect(titleOf(root, 'Qty')).toBeTruthy();
    await settled('the drop on the heading');

    // A chip dropped anywhere else does nothing.
    const away = frame.getBoundingClientRect();
    await real.dragAndDrop(chipsOf(root)[0]!, frame, {
      sourcePosition: { x: 5, y: from.height / 2 },
      targetPosition: { x: 50, y: away.height - 20 },
    });
    await nextFrame();
    await expect(chipCaptions(root)).toEqual(['Status', 'Assignee', 'Channel']);
    await expect(calls).toHaveBeenCalledTimes(3);
    await settled('a drop elsewhere');
  },
};

/**
 * A finger moves a chip (spec phase 6 §3.8, Claude's ruling on the touch drags). The story runner cannot
 * make a touch drag (Playwright's touchscreen only taps), so the finger is a pointer of type `touch` that
 * the page dispatches, which the grid follows as it follows the real one; the unit tests of the panel
 * do the same with touch and pen pointers. The chips take every pointer type and have `touch-action:
 * none`, so the browser's own scroll does not take the finger; a title takes no touch drag.
 */
export const ChipDragTouch: Story = {
  tags: ['no-visual'],
  render: () => <GroupingGrid />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    await expect(chipCaptions(root)).toEqual(['Status', 'Assignee', 'Channel']);
    const chip = chipsOf(root)[0]!;
    await expect(getComputedStyle(chip).touchAction).toBe('none');
    const box = chip.getBoundingClientRect();
    const finger = pointer('touch', 81, { x: box.left + 5, y: box.top + box.height / 2 });
    finger(chip, 'pointerdown');
    finger(document, 'pointermove', afterChips(root));
    await waitFor(
      () => expect(panelOf(root), 'the tray is marked').toHaveAttribute('data-drop-target'),
      RENDER_UPDATE,
    );
    await expect(panelOf(root)).toHaveAttribute('data-drop-end');
    await expect(chip).toHaveAttribute('data-drag-source');
    finger(document, 'pointerup', afterChips(root));
    await waitFor(
      () =>
        expect(chipCaptions(root), 'Status is the last level').toEqual([
          'Assignee',
          'Channel',
          'Status',
        ]),
      RENDER_UPDATE,
    );
    await expect(document.documentElement).not.toHaveAttribute('data-flg-grid-cursor');
    await expect(document.querySelector('.flg-data-grid-drag-chip')).toBeNull();

    // A finger on a title starts no drag: the title scrolls the frame.
    const qty = titleOf(root, 'Qty');
    const at = middleOf(qty);
    const touch = pointer('touch', 82, at);
    touch(qty, 'pointerdown');
    touch(document, 'pointermove', { x: at.x, y: panelOf(root).getBoundingClientRect().top + 10 });
    await nextFrame();
    await nextFrame();
    await expect(document.querySelector('.flg-data-grid-drag-chip')).toBeNull();
    touch(document, 'pointerup');
  },
};

/** The totals of R1's footer: a count under Order, the sum of the quantities and of the totals. */
const FOOTER_TOTALS: NonNullable<DataGridProps<R1Order>['summary']> = {
  total: [
    { column: 'id', type: 'count', label: 'Orders' },
    { column: 'qty', type: 'sum' },
    { column: 'total', type: 'sum' },
  ],
};

/** R1's columns with Order pinned to the left and Total to the right, so a frame scrolled sideways has both zones. */
const PINNED_COLUMNS: DataGridColumn<R1Order>[] = R1_COLUMNS.map((column) =>
  column.field === 'id'
    ? { ...column, pinned: 'left' as const }
    : column.field === 'total'
      ? { ...column, pinned: 'right' as const }
      : column,
);

const TotalsGrid = (props: Partial<DataGridProps<R1Order>>) => (
  <div style={{ width: 640, marginBottom: 24 }}>
    <DataGrid
      aria-label="Orders"
      data={R1_ORDERS}
      rowKey="id"
      columns={PINNED_COLUMNS}
      paging={false}
      height={240}
      summary={FOOTER_TOTALS}
      {...props}
    />
  </div>
);

/** The bottom of what a frame shows: its box without the border and the scrollbar. */
const frameBottom = (frame: HTMLElement) => {
  const box = frame.getBoundingClientRect();
  return box.top + frame.clientTop + frame.clientHeight;
};

/** The alpha of a computed colour: `rgb()` has none (opaque), `rgba()` and `color()` say it. */
const alphaOf = (color: string) => {
  const match = /(?:rgba|color)\(.*\/\s*([\d.]+)\)|rgba\([^)]*,\s*([\d.]+)\)/.exec(color);
  return match ? Number(match[1] ?? match[2]) : 1;
};

/**
 * The sticky footer of totals (spec phase 6 §3.6, §3.7 "Dính", §4.3 R1 "Tổng cuối bảng"), in a grid with a
 * height in each variant, with Order pinned left and Total pinned right: the footer's bottom is the bottom
 * of the frame at rest and while the rows are scrolled (it is at `bottom: 0`, `-6px` where the frame has
 * padding); its cells are solid, and the pinned ones stay at their edges when the frame is scrolled
 * sideways; the grid measures the footer (`--flg-data-grid-foot-height`). With real keys: a cell scrolled
 * into view by the keys stops above the footer, and ↓ from the last row lands on the footer and ↑ goes
 * back. A scroll is made by setting the frame's `scrollTop` and `scrollLeft`.
 */
export const StickyTotals: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  render: () => (
    <>
      <TotalsGrid aria-label="Lined" variant="lined" />
      <TotalsGrid aria-label="Striped" variant="striped" />
      <TotalsGrid aria-label="Minimal" variant="minimal" />
    </>
  ),
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    const roots = Array.from(canvasElement.querySelectorAll<HTMLElement>('.flg-data-grid'));
    await expect(roots).toHaveLength(3);
    for (const root of roots) {
      const variant = root.dataset.variant!;
      const frame = root.querySelector<HTMLElement>('.flg-data-grid-frame')!;
      const foot = tableOf(root).tFoot!;
      await expect(foot, `${variant}: the footer is drawn`).not.toBeNull();
      await waitFor(
        () =>
          expect(
            Number.parseFloat(frame.style.getPropertyValue('--flg-data-grid-foot-height')),
            `${variant}: the footer is measured`,
          ).toBeGreaterThan(20),
        RENDER_UPDATE,
      );
      await expect(frame.scrollHeight).toBeGreaterThan(frame.clientHeight + 40);
      const place = () => Math.abs(foot.getBoundingClientRect().bottom - frameBottom(frame));
      await expect(place(), `${variant}: at rest the footer is at the bottom`).toBeLessThanOrEqual(
        1,
      );
      frame.scrollTop = 60;
      await waitFor(() => expect(frame.scrollTop).toBeGreaterThan(0), SCROLL_EVENT);
      await nextFrame();
      await expect(place(), `${variant}: scrolled, it stays at the bottom`).toBeLessThanOrEqual(1);
      // No row is seen through it: its cells are painted over a solid colour.
      for (const cell of foot.querySelectorAll<HTMLElement>('.flg-data-grid-foot-cell')) {
        await expect(
          alphaOf(getComputedStyle(cell).backgroundColor),
          `${variant}: the footer cell is solid`,
        ).toBe(1);
      }
      // Scrolled sideways, the pinned cells stay where they stick.
      frame.scrollLeft = 200;
      await waitFor(() => expect(frame.scrollLeft).toBeGreaterThan(100), SCROLL_EVENT);
      await nextFrame();
      const left = foot.querySelector<HTMLElement>('[data-pinned="left"]')!;
      const right = foot.querySelector<HTMLElement>('[data-pinned="right"]')!;
      const area = frame.getBoundingClientRect();
      near(
        left.getBoundingClientRect().left,
        area.left + frame.clientLeft,
        1.5,
        `${variant}: the left cell`,
      );
      near(
        right.getBoundingClientRect().right,
        area.left + frame.clientLeft + frame.clientWidth,
        1.5,
        `${variant}: the right cell`,
      );
      await expect(alphaOf(getComputedStyle(left).backgroundColor)).toBe(1);
      await expect(alphaOf(getComputedStyle(right).backgroundColor)).toBe(1);
      await expect(place(), `${variant}: sideways it is at the bottom`).toBeLessThanOrEqual(1);
      frame.scrollLeft = 0;
      frame.scrollTop = 0;
      await nextFrame();
    }

    if (!real) return;
    // The keys of the first grid: the last cell of the last row is scrolled into view above the footer.
    const frame = roots[0]!.querySelector<HTMLElement>('.flg-data-grid-frame')!;
    const table = tableOf(roots[0]!);
    const foot = table.tFoot!;
    const first = table.tBodies[0]!.rows[0]!.cells[0]!;
    first.focus();
    await waitFor(() => expect(first).toHaveFocus(), RENDER_UPDATE);
    await real.keyboard('{Control>}{End}{/Control}');
    const lastRow = table.tBodies[0]!.rows[table.tBodies[0]!.rows.length - 1]!;
    await waitFor(
      () =>
        expect(document.activeElement!.closest('tr'), 'the last row has the focus').toBe(lastRow),
      RENDER_UPDATE,
    );
    await waitFor(
      () =>
        expect(
          document.activeElement!.getBoundingClientRect().bottom,
          'the cell stops above the footer',
        ).toBeLessThanOrEqual(foot.getBoundingClientRect().top + 1),
      SCROLL_EVENT,
    );
    const last = document.activeElement as HTMLTableCellElement;
    const index = Array.from(lastRow.cells).indexOf(last);
    // ArrowDown lands on the footer in the same column, ArrowDown again stays, ArrowUp goes back.
    await real.keyboard('{ArrowDown}');
    await waitFor(
      () =>
        expect(document.activeElement, 'the footer has the focus').toBe(foot.rows[0]!.cells[index]),
      RENDER_UPDATE,
    );
    await real.keyboard('{ArrowDown}');
    await nextFrame();
    await expect(document.activeElement).toBe(foot.rows[0]!.cells[index]);
    await expect(frame.scrollTop).toBeGreaterThan(0);
    await real.keyboard('{ArrowUp}');
    await waitFor(
      () => expect(document.activeElement, 'back on the last row').toBe(last),
      RENDER_UPDATE,
    );
  },
};

/**
 * The footer in a virtual grid (spec phase 6 §3.6 "aria-rowcount"): ten thousand orders, so `aria-rowcount`
 * is the heading, every row and the footer (10002), the footer says the last `aria-rowindex`, and mod+End
 * scrolls to the last row, which is drawn above the footer and not under it; the footer is reached by ↓ and
 * ↑ goes back to a row that is drawn.
 */
export const StickyTotalsVirtual: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  render: () => (
    <TotalsGrid data={BIG_ORDERS} scrolling="virtual" height={300} columns={R1_COLUMNS} />
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const table = tableOf(root);
    const frame = table.parentElement!;
    const foot = table.tFoot!;
    await expect(table).toHaveAttribute('aria-rowcount', '10002');
    await expect(foot.rows[0]).toHaveAttribute('aria-rowindex', '10002');
    const real = await realUserEvent();
    if (!real) return;
    const first = table.tBodies[0]!.querySelector<HTMLElement>('tr.flg-data-grid-row > *')!;
    first.focus();
    await waitFor(() => expect(first).toHaveFocus(), RENDER_UPDATE);
    await real.keyboard('{Control>}{End}{/Control}');
    await waitFor(
      () =>
        expect(document.activeElement!.closest('tr'), 'the last row').toHaveAttribute(
          'aria-rowindex',
          '10001',
        ),
      SCROLL_EVENT,
    );
    const last = document.activeElement as HTMLElement;
    await waitFor(() => {
      const box = last.getBoundingClientRect();
      expect(box.bottom, 'the last row is above the footer').toBeLessThanOrEqual(
        foot.getBoundingClientRect().top + 1,
      );
      expect(box.top, 'and under the heading').toBeGreaterThanOrEqual(
        table.tHead!.getBoundingClientRect().bottom - 1,
      );
    }, SCROLL_EVENT);
    await expect(
      Math.abs(foot.getBoundingClientRect().bottom - frameBottom(frame)),
    ).toBeLessThanOrEqual(1);
    await real.keyboard('{ArrowDown}');
    await waitFor(
      () =>
        expect(document.activeElement?.closest('tfoot'), 'the footer has the focus').not.toBeNull(),
      RENDER_UPDATE,
    );
    await real.keyboard('{ArrowUp}');
    await waitFor(
      () =>
        expect(document.activeElement!.closest('tr'), 'back on the last row').toHaveAttribute(
          'aria-rowindex',
          '10001',
        ),
      SCROLL_EVENT,
    );
  },
};

// ---- Master-detail and R1 in full (spec phase 6 §3.6, §4.3 R1 "Dòng chi tiết", Task 7) -------------

/** A line of the order a detail lists. */
interface OrderLine {
  product: string;
  qty: number;
  price: number;
}

/** The lines of DH-1024, which R1 draws (Sổ tay bìa da A5, Bút ký kim loại, Hộp quà doanh nghiệp). */
const R1_LINES: Readonly<Record<string, readonly OrderLine[]>> = {
  'DH-1024': [
    { product: 'Sổ tay bìa da A5', qty: 6, price: 1200000 },
    { product: 'Bút ký kim loại', qty: 4, price: 1650000 },
    { product: 'Hộp quà doanh nghiệp', qty: 2, price: 2400000 },
  ],
};

/** The phone and the address R1 draws for the customer of DH-1024. */
const R1_CONTACT: Readonly<Record<string, { phone: string; address: string }>> = {
  'DH-1024': {
    phone: '028 3822 1024',
    address: '12 Lê Lợi, phường Bến Nghé, quận 1, TP. Hồ Chí Minh',
  },
};

const VND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

// The icons are the story's own (spec phase 6 §6.7): a phone and a map pin, drawn as the library's icons are.
const strokeIcon = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;
const detailHeading = {
  color: 'var(--flg-text-muted)',
  fontSize: 'var(--flg-text-xs)',
  fontWeight: 'var(--flg-weight-semibold)',
} as const;
const detailLine = { display: 'flex', alignItems: 'center', gap: 8 } as const;
const detailIcon = { flex: 'none', width: 14, height: 14, color: 'var(--flg-text-muted)' } as const;

/**
 * What R1 draws under DH-1024: two blocks 36px apart, the order lines in a small `lined` Table 400px wide
 * and the customer. An order that R1 does not draw has one line made of its totals and no contact. A
 * module function, so the grid keeps it: it is read by every row.
 */
function renderOrderDetail(row: R1Order, wraps = false) {
  const lines = R1_LINES[row.id] ?? [
    { product: 'Mixed items', qty: row.qty, price: Math.round(row.total / row.qty) },
  ];
  const contact = R1_CONTACT[row.id];
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: wraps ? 'wrap' : 'nowrap',
        alignItems: 'flex-start',
        gap: wraps ? '12px 36px' : 36,
      }}
    >
      <div style={{ display: 'flex', flex: 'none', flexDirection: 'column', gap: 6, width: 400 }}>
        <span style={detailHeading}>{`Order lines of ${row.id}`}</span>
        <Table variant="lined" size="sm" aria-label={`Order lines of ${row.id}`}>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead align="end">Qty</TableHead>
              <TableHead align="end">Unit price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.product}>
                <TableCell>{line.product}</TableCell>
                <TableCell align="end">{line.qty}</TableCell>
                <TableCell align="end">{VND.format(line.price)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          fontSize: 'var(--flg-text-sm)',
          // Wrapped under the lines, the block is never narrower than its text.
          ...(wraps ? { minWidth: 'max-content' } : null),
        }}
      >
        <span style={detailHeading}>Customer</span>
        <span style={{ fontWeight: 'var(--flg-weight-semibold)' }}>{row.customer}</span>
        {contact ? (
          <>
            <span style={detailLine}>
              <svg {...strokeIcon} style={detailIcon}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {contact.phone}
            </span>
            <span style={detailLine}>
              <svg {...strokeIcon} style={detailIcon}>
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {contact.address}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

/** What a group is called in the state: the JSON of its `[field, value]` steps (Claude's ruling on OQ 3). */
/**
 * Grouping with pinned zones (spec phase 6 §3.5, OQ 5): R1's data grouped by Status, Order pinned to the
 * left and Total to the right, 640px wide, the frame scrolled sideways. A group row that has the focus
 * keeps the caption in the left zone: its cell stands where that zone ends, next to the chevron, as the
 * cells of the data rows do, however far the frame is scrolled; the frame of the focus is drawn on its
 * first and its last cell; and a focus that lands on it scrolls the frame vertically only.
 */
export const GroupRowPinnedZones: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 640, marginBottom: 24 }}>
      <DataGrid
        aria-label="Orders"
        data={R1_ORDERS}
        rowKey="id"
        columns={PINNED_COLUMNS}
        paging={false}
        defaultGrouping={[{ field: 'status', direction: 'asc' }]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const frame = root.querySelector<HTMLElement>('.flg-data-grid-frame')!;
    const real = await realUserEvent();
    const table = tableOf(root);
    await expect(table).toHaveAttribute('role', 'treegrid');
    await waitFor(
      () =>
        expect(frame.scrollWidth, 'the frame scrolls sideways').toBeGreaterThan(
          frame.clientWidth + 100,
        ),
      RENDER_UPDATE,
    );
    if (!real) return;

    const active = () => document.activeElement as HTMLElement;
    const first = groupRowsOf(root)[0]!;
    for (let tabs = 0; tabs < 4 && !table.contains(document.activeElement); tabs += 1) {
      await real.tab();
    }
    await expect(active()).toBe(first);
    // Down to the first data row, scrolled sideways, and back up to the group row: its focus scrolls
    // nothing sideways.
    await real.keyboard('{ArrowDown}');
    await waitFor(
      () =>
        expect(active().closest('tr'), 'the focus is on the first data row').toBe(
          bodyRowsOf(root)[1],
        ),
      RENDER_UPDATE,
    );
    frame.scrollLeft = 240;
    await waitFor(
      () => expect(frame.scrollLeft, 'the frame is scrolled').toBeGreaterThan(100),
      SCROLL_EVENT,
    );
    const left = frame.scrollLeft;
    await real.keyboard('{ArrowUp}');
    await waitFor(
      () => expect(active(), 'the focus is on the group row').toBe(first),
      RENDER_UPDATE,
    );
    await expect(frame.scrollLeft).toBe(left);

    // The frame of the focus: top and bottom on every cell, the left side on the first, the right side on
    // the last.
    const cells = Array.from(first.children) as HTMLElement[];
    await expect(cells.length).toBeGreaterThanOrEqual(3);
    for (const [at, cell] of cells.entries()) {
      await expect(hasInset(cell, 0, 2), `cell ${at} has the top side`).toBe(true);
      await expect(hasInset(cell, 0, -2), `cell ${at} has the bottom side`).toBe(true);
    }
    await expect(hasInset(cells[0]!, 2, 0), 'the first cell has the left side').toBe(true);
    await expect(hasInset(cells.at(-1)!, -2, 0), 'the last cell has the right side').toBe(true);

    // The caption is pinned with the left zone: next to the chevron, which sticks at the frame's edge, and
    // ending where the pinned cells of a data row end.
    const edge = frame.getBoundingClientRect().left + frame.clientLeft;
    const chevron = first.querySelector<HTMLElement>('.flg-data-grid-group-toggle')!;
    const caption = first.querySelector<HTMLElement>('.flg-data-grid-group-caption')!;
    await expect(caption).toHaveAttribute('data-pinned', 'left');
    near(chevron.getBoundingClientRect().left, edge, 1.5, 'the chevron cell sticks at the edge');
    near(
      caption.getBoundingClientRect().left,
      chevron.getBoundingClientRect().right,
      1.5,
      'the caption is next to the chevron',
    );
    const dataRow = bodyRowsOf(root).find((row) => row.classList.contains('flg-data-grid-row'))!;
    const zone = Array.from(dataRow.querySelectorAll<HTMLElement>('[data-pinned="left"]')).at(-1)!;
    near(
      caption.getBoundingClientRect().right,
      zone.getBoundingClientRect().right,
      1.5,
      'the caption ends where the left zone does',
    );
    await expect(frame.scrollLeft).toBe(left);
  },
};

const statusKey = (status: R1Order['status']) => JSON.stringify([['status', status]]);
const assigneeKey = (status: R1Order['status'], assignee: string) =>
  JSON.stringify([
    ['status', status],
    ['assignee', assignee],
  ]);

/** R1's open groups: Processing, and in it Lê Quang Huy and Nguyễn Minh Anh; every other group is closed. */
const R1_OPEN: NonNullable<DataGridProps<R1Order>['defaultExpandedGroups']> = {
  allExpanded: false,
  except: [
    statusKey('Processing'),
    assigneeKey('Processing', 'Lê Quang Huy'),
    assigneeKey('Processing', 'Nguyễn Minh Anh'),
  ],
};

/** R1's totals: the sum of the totals on each group, and under the rows a count, the quantities and the sum. */
const R1_SUMMARY: NonNullable<DataGridProps<R1Order>['summary']> = {
  group: [{ column: 'total', type: 'sum' }],
  total: [
    { column: 'id', type: 'count', label: 'Orders' },
    { column: 'qty', type: 'sum' },
    { column: 'total', type: 'sum' },
  ],
};

/** A text with the no-break spaces the locale writes made plain (any space is one), so a story reads it as it is said. */
const plain = (text: string | null | undefined) => (text ?? '').replace(/\s/g, ' ');

/**
 * R1, crop 1, in full (spec phase 6 §4.3 R1): the toolbar with the tray and its two chips, two levels of
 * groups with their totals, DH-1028 and DH-1024 with the buttons of their details (DH-1024's open, with the
 * track), DH-1024's detail row, and the total footer. The differences from the crop, all listed in the
 * rulings of the draft: the toolbar has no "add" and no "export" button and G1's order (the search field,
 * then the column chooser; the field is 260px); the titles have the room of the menu and no sort icon;
 * the words are English; the data rows are 33px (OQ 1) and the footer adds up what the rows add up to,
 * 162.010.000 ₫ where the crop says 161.910.000 ₫ (OQ 2).
 */
export const GridGroups: Story = {
  tags: ['viewport-1440x720'],
  render: () => (
    <R1Card
      defaultGrouping={BY_STATUS_THEN_ASSIGNEE}
      defaultExpandedGroups={R1_OPEN}
      renderDetail={renderOrderDetail}
      defaultExpandedRows={['DH-1024']}
      summary={R1_SUMMARY}
    />
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const table = tableOf(root);
    await expect(table).toHaveAttribute('role', 'treegrid');
    await expect(chipCaptions(root)).toEqual(['Status', 'Assignee']);
    // The ten rows of the list, in R1's order: the nine rows of R1 and the detail of DH-1024 after its row.
    const rows = bodyRowsOf(root);
    const kindOf = (row: HTMLElement) =>
      row.classList.contains('flg-data-grid-group-row')
        ? `group ${row.getAttribute('data-level')}`
        : row.classList.contains('flg-data-grid-detail-row')
          ? 'detail'
          : 'data';
    await expect(rows.map(kindOf)).toEqual([
      'group 1',
      'group 1',
      'group 1',
      'group 2',
      'data',
      'group 2',
      'data',
      'detail',
      'group 2',
      'group 1',
    ]);
    const groups = groupRowsOf(root);
    await expect(groups.map((row) => row.getAttribute('aria-expanded'))).toEqual([
      'false',
      'false',
      'true',
      'true',
      'true',
      'false',
      'false',
    ]);
    await expect(
      groups.map((row) => plain(row.querySelector('.flg-data-grid-group-caption')?.textContent)),
    ).toEqual([
      'Status: Delivered (4)',
      'Status: Cancelled (1)',
      'Status: Processing (4)',
      'Assignee: Lê Quang Huy (1)',
      'Assignee: Nguyễn Minh Anh (1)',
      'Assignee: Võ Thị Lan (2)',
      'Status: New (3)',
    ]);
    // The group totals, under Total (R1's own figures).
    await expect(
      groups.map((row) => plain(row.querySelector('.flg-data-grid-summary-cell')?.textContent)),
    ).toEqual([
      'Total: 65.720.000 ₫',
      'Total: 890.000 ₫',
      'Total: 39.700.000 ₫',
      'Total: 9.750.000 ₫',
      'Total: 18.600.000 ₫',
      'Total: 11.350.000 ₫',
      'Total: 55.700.000 ₫',
    ]);
    // The rows of data, and the two buttons: DH-1024's is open, DH-1028's is not.
    await expect(rows[4]).toHaveTextContent('DH-1028');
    await expect(rows[6]).toHaveTextContent('DH-1024');
    const open = within(rows[6]!).getByRole('button', { name: 'Hide details of DH-1024' });
    const closed = within(rows[4]!).getByRole('button', { name: 'Show details of DH-1028' });
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    await expect(open).toHaveAttribute('aria-controls', rows[7]!.id);
    await expect(closed).toHaveAttribute('aria-expanded', 'false');
    for (const toggle of [open, closed]) {
      const box = toggle.getBoundingClientRect();
      await expect([Math.round(box.width), Math.round(box.height)]).toEqual([24, 24]);
    }
    await expect(getComputedStyle(open).backgroundColor).not.toBe(
      getComputedStyle(closed).backgroundColor,
    );
    // The detail: its two blocks, the lines of DH-1024 in a small Table and the customer.
    const detail = rows[7]!;
    await expect(detail.querySelector('.flg-data-grid-detail-content')).toHaveTextContent(
      'Order lines of DH-1024',
    );
    await expect(
      Array.from(detail.querySelectorAll('table tbody > tr'), (tr) =>
        Array.from(tr.children, (cell) => plain(cell.textContent)),
      ),
    ).toEqual([
      ['Sổ tay bìa da A5', '6', '1.200.000 ₫'],
      ['Bút ký kim loại', '4', '1.650.000 ₫'],
      ['Hộp quà doanh nghiệp', '2', '2.400.000 ₫'],
    ]);
    await expect(detail).toHaveTextContent('Công ty Minh Phát');
    await expect(detail).toHaveTextContent('028 3822 1024');
    await expect(detail).toHaveTextContent('12 Lê Lợi, phường Bến Nghé, quận 1, TP. Hồ Chí Minh');
    // The rows are 33px: the group rows by their density, the data rows by `rowHeight`.
    for (const row of [...groups, rows[4]!, rows[6]!]) {
      await expect(Math.round(row.getBoundingClientRect().height), row.textContent!).toBe(33);
    }
    // The footer: the count under Order, the quantities, and what the rows add up to (OQ 2).
    const foot = Array.from(
      table.tFoot!.querySelectorAll<HTMLElement>('.flg-data-grid-foot-cell'),
      (cell) => {
        // What is seen: the words that are hidden ("Total of Qty") are for a screen reader.
        const seen = cell.cloneNode(true) as HTMLElement;
        for (const hidden of seen.querySelectorAll('.flg-visually-hidden')) hidden.remove();
        return plain(seen.textContent);
      },
    );
    await expect(foot.filter((text) => text !== '')).toEqual([
      'Orders: 12',
      '135',
      '162.010.000 ₫',
    ]);
    await noTitleIsCut(root);
    // Nothing of the grid has the focus: the story is a look.
    await expect(root.contains(document.activeElement)).toBe(false);
  },
};

/** The detail of the orders of the keys story: a link and a button. */
const detailWithControls = (row: R1Order) => (
  <p style={{ margin: 0 }}>
    <a href="#orders">{`Open ${row.id}`}</a> <button type="button">{`Print ${row.id}`}</button>
  </p>
);

/**
 * The keys of the detail (spec phase 6 §3.6 "Ô có nhiều control"), with real input: the detail row is a
 * place of the grid reached by ↓ from its master; Enter goes into its first control, Tab goes round the
 * two controls (the grid has one Tab stop all the while), Esc comes back to the cell, and ↓ goes on to the
 * next row at the column the place remembered. Enter opens a detail from its button, which keeps the focus,
 * and Space closes it again.
 */
export const DetailRowKeys: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  render: () => (
    <div style={{ width: 900 }}>
      <DataGrid
        aria-label="Orders"
        data={R1_ORDERS}
        rowKey="id"
        columns={R1_COLUMNS}
        paging={false}
        renderDetail={detailWithControls}
        defaultExpandedRows={['DH-1034']}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const table = tableOf(root);
    const real = await realUserEvent();
    if (!real) return;
    const stops = () => table.querySelectorAll('[tabindex="0"]');
    const active = () => document.activeElement as HTMLElement;
    const rows = () => bodyRowsOf(root);
    const detail = () => root.querySelector<HTMLElement>('td.flg-data-grid-detail-cell')!;
    for (let tabs = 0; tabs < 4 && !table.contains(active()); tabs += 1) await real.tab();
    // The grid's first stop is the button of the first row, which is open.
    await expect(active()).toBe(within(rows()[0]!).getByRole('button', { name: /^Hide details/ }));
    await expect(stops()).toHaveLength(1);
    // ↓ goes to the detail row, a place of one cell.
    await real.keyboard('{ArrowDown}');
    await waitFor(
      () => expect(active(), 'the detail cell has the focus').toBe(detail()),
      RENDER_UPDATE,
    );
    await expect(stops()).toHaveLength(1);
    // Enter goes into the first control; Tab goes round; Esc comes back.
    await real.keyboard('{Enter}');
    const link = within(detail()).getByRole('link');
    const print = within(detail()).getByRole('button');
    await waitFor(() => expect(active(), 'the link has the focus').toBe(link), RENDER_UPDATE);
    await real.tab();
    await waitFor(() => expect(active(), 'the button has the focus').toBe(print), RENDER_UPDATE);
    await real.tab();
    await waitFor(() => expect(active(), 'round to the link').toBe(link), RENDER_UPDATE);
    await expect(stops()).toHaveLength(1);
    await real.keyboard('{Escape}');
    await waitFor(() => expect(active(), 'back in the cell').toBe(detail()), RENDER_UPDATE);
    // ↓ goes to the next row, in the column the place was in: the button's, the first.
    await real.keyboard('{ArrowDown}');
    await waitFor(
      () =>
        expect(active(), 'the button of the second row').toBe(
          within(rows()[2]!).getByRole('button', { name: /^Show details of DH-1031/ }),
        ),
      RENDER_UPDATE,
    );
    // Enter opens its detail and keeps the focus on the button; Space closes it.
    const second = active();
    await real.keyboard('{Enter}');
    await waitFor(
      () =>
        expect(second, 'the detail of the second row is open').toHaveAttribute(
          'aria-expanded',
          'true',
        ),
      RENDER_UPDATE,
    );
    await expect(active()).toBe(second);
    await expect(root.querySelectorAll('tr.flg-data-grid-detail-row')).toHaveLength(2);
    await real.keyboard(' ');
    await waitFor(
      () => expect(second, 'and Space closes it').toHaveAttribute('aria-expanded', 'false'),
      RENDER_UPDATE,
    );
    await expect(active()).toBe(second);
    await expect(root.querySelectorAll('tr.flg-data-grid-detail-row')).toHaveLength(1);
    await expect(stops()).toHaveLength(1);
  },
};

/** The detail of R1 as `DetailScrolled` draws it: its content wraps in the 640px the grid has. */
const renderScrolledDetail = (row: R1Order) => renderOrderDetail(row, true);

/**
 * A detail in a frame scrolled sideways (spec phase 6 §3.7 "Nội dung trải cả hàng"): the columns are wider
 * than the frame and Order is pinned to the left and Total to the right. The detail's content sticks to
 * what the frame shows between the two zones, at the right of the left one and as wide as what is left,
 * wherever the frame is scrolled, and its cell does not scroll the frame when it takes the focus.
 */
export const DetailScrolled: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 640, marginBottom: 24 }}>
      <DataGrid
        aria-label="Orders"
        data={R1_ORDERS}
        rowKey="id"
        columns={PINNED_COLUMNS}
        paging={false}
        renderDetail={renderScrolledDetail}
        defaultExpandedRows={['DH-1024']}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const table = tableOf(root);
    const frame = table.parentElement!;
    const content = root.querySelector<HTMLElement>('.flg-data-grid-detail-content')!;
    await waitFor(() => expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth + 200));
    const zone = (side: 'left' | 'right') =>
      parseFloat(getComputedStyle(table).getPropertyValue(`--flg-data-grid-pinned-${side}`)) || 0;
    const inSight = async (what: string) => {
      const box = frame.getBoundingClientRect();
      const left = box.left + frame.clientLeft + zone('left');
      const right = box.left + frame.clientLeft + frame.clientWidth - zone('right');
      const seen = content.getBoundingClientRect();
      await expect(zone('left'), `${what}: the left zone is drawn`).toBeGreaterThan(0);
      await expect(zone('right'), `${what}: the right zone is drawn`).toBeGreaterThan(0);
      await expect(
        seen.left,
        `${what}: its left edge is clear of the left zone`,
      ).toBeGreaterThanOrEqual(left - 1);
      await expect(
        seen.right,
        `${what}: its right edge is clear of the right zone`,
      ).toBeLessThanOrEqual(right + 1);
    };
    await inSight('at rest');
    // The content wraps in the room it has: the customer block is as wide as its text, never narrower.
    const customer = content.firstElementChild!.lastElementChild as HTMLElement;
    await expect(customer.scrollWidth, 'the customer block holds its text').toBeLessThanOrEqual(
      customer.clientWidth + 1,
    );
    for (const scrollLeft of [150, frame.scrollWidth]) {
      frame.scrollLeft = scrollLeft;
      await waitFor(() => expect(frame.scrollLeft).toBeGreaterThan(0), SCROLL_EVENT);
      await inSight(`scrolled to ${frame.scrollLeft}`);
    }
    // The cell takes the focus without moving the frame sideways.
    const kept = frame.scrollLeft;
    const cell = root.querySelector<HTMLElement>('td.flg-data-grid-detail-cell')!;
    cell.focus();
    await waitFor(() => expect(cell).toHaveFocus(), RENDER_UPDATE);
    await expect(frame.scrollLeft).toBe(kept);
  },
};

// ---- Moving rows (spec phase 6 §3.6, §3.8, §4.3 R1 "Kéo dòng", §6.3 "Kéo dòng") -------------------------

/** The orders with the row `from` moved before or after the row `to`, as an app that does what it is told. */
const movedRows = (
  rows: readonly R1Order[],
  from: DataGridKey,
  to: DataGridKey,
  position: DataGridRowDrop,
): readonly R1Order[] => {
  const moved = rows.find((one) => one.id === from)!;
  const others = rows.filter((one) => one.id !== from);
  const at = others.findIndex((one) => one.id === to) + (position === 'after' ? 1 : 0);
  return [...others.slice(0, at), moved, ...others.slice(at)];
};

/** Four of R1's columns, for the grids that move rows: the keys and the drags need no more. */
const MOVE_COLUMNS = R1_COLUMNS.filter((column) =>
  ['id', 'customer', 'status', 'qty'].includes(String('field' in column ? column.field : '')),
);

/**
 * A grid whose app does what `onRowReorder` says, as the app of the docs does: it moves the row in its own
 * `data`. Unsorted and not grouped, since the handles do nothing while it is.
 */
const MovableGrid = ({
  onMove,
  ...props
}: Partial<DataGridProps<R1Order>> & {
  onMove?: (from: DataGridKey, to: DataGridKey, position: DataGridRowDrop) => void;
}) => {
  const [rows, setRows] = useState<readonly R1Order[]>(R1_ORDERS);
  return (
    <div style={{ width: 760, marginBottom: 24 }}>
      <DataGrid
        aria-label="Orders"
        data={rows}
        rowKey="id"
        columns={MOVE_COLUMNS}
        paging={false}
        rowReorder
        onRowReorder={(from, to, position) => {
          onMove?.(from, to, position);
          setRows((now) => movedRows(now, from, to, position));
        }}
        {...props}
      />
    </div>
  );
};

/** The data rows of the grid's own body, in order. */
const dataRowsOf = (root: HTMLElement) =>
  bodyRowsOf(root).filter((row) => row.classList.contains('flg-data-grid-row'));
/** The keys of the data rows, in order: the text of the row header. */
const orderOf = (root: HTMLElement) =>
  dataRowsOf(root).map((row) => row.querySelector('th')?.textContent);
const handleOf = (root: HTMLElement, key: string) =>
  root.querySelector<HTMLButtonElement>(`button[aria-label="Reorder ${key}"]`)!;
/** The line a drag of a row draws, `null` when it draws none. */
const rowLineOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('.flg-data-grid-drop-line[data-axis="y"]');

/** The ids of R1's orders, in the order the stories start from. */
const START_ORDER = R1_ORDERS.map((one) => one.id);

/**
 * How long a story waits for the menu of a row, which fades in from `opacity: 0` and which Linux WebKit on
 * x86 (CI) takes up to ten seconds over (`KeysInPopup` of `DataGrid.stories.tsx`).
 */
const MENU_SHOWN = { timeout: 10000 };

/**
 * `mod+Shift+↑` and `mod+Shift+↓` on a cell of a row, with real keys (spec phase 6 §3.6): Tab lands on the
 * first handle (the active place of a grid is its first cell), the arrows go down to the third row, and
 * the key moves it up one place and then to the top, where it does nothing more; two presses down move it
 * two places; on a cell of data the same key moves the row, and the cell keeps the focus. After each move
 * the focus is on the same row at the same column, wherever the row went, and the grid has its one Tab
 * stop. The story asserts what each burst of keys ends in, never how many calls it made.
 */
function rowReorderKeys(mod: 'Control' | 'Meta'): NonNullable<Story['play']> {
  return async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const table = tableOf(root);
    const calls = args.onRowReorder as ReturnType<typeof fn>;
    const press = (key: string) => real.keyboard(`{${mod}>}{Shift>}{${key}}{/Shift}{/${mod}}`);
    const active = () => document.activeElement as HTMLElement;
    const inRow = (key: string, column: number) =>
      dataRowsOf(root).find((row) => row.querySelector('th')?.textContent === key)!.cells[column]!;
    await expect(orderOf(root)).toEqual(START_ORDER);
    for (let tabs = 0; tabs < 4 && !table.contains(document.activeElement); tabs += 1) {
      await real.tab();
    }
    await expect(active()).toBe(handleOf(root, 'DH-1034'));
    await real.keyboard('{ArrowDown}{ArrowDown}');
    await expect(active()).toBe(handleOf(root, 'DH-1030'));

    await press('ArrowUp');
    await waitFor(
      () =>
        expect(orderOf(root).slice(0, 3), 'DH-1030 is the second').toEqual([
          'DH-1034',
          'DH-1030',
          'DH-1031',
        ]),
      RENDER_UPDATE,
    );
    await waitFor(
      () => expect(active(), 'the focus stays on its handle').toBe(handleOf(root, 'DH-1030')),
      RENDER_UPDATE,
    );
    await expect(calls).toHaveBeenLastCalledWith('DH-1030', 'DH-1031', 'before');
    await press('ArrowUp');
    await waitFor(
      () =>
        expect(orderOf(root).slice(0, 2), 'DH-1030 is the first').toEqual(['DH-1030', 'DH-1034']),
      RENDER_UPDATE,
    );
    // At the top the key moves nothing and asks for nothing.
    const atTop = calls.mock.calls.length;
    await press('ArrowUp');
    await nextFrame();
    await expect(orderOf(root).slice(0, 2)).toEqual(['DH-1030', 'DH-1034']);
    await expect(calls.mock.calls.length, 'nothing was asked at the edge').toBe(atTop);
    await expect(active()).toBe(handleOf(root, 'DH-1030'));

    // Two presses down end two places lower.
    await press('ArrowDown');
    await press('ArrowDown');
    await waitFor(
      () =>
        expect(orderOf(root).slice(0, 3), 'DH-1030 is the third').toEqual([
          'DH-1034',
          'DH-1031',
          'DH-1030',
        ]),
      RENDER_UPDATE,
    );

    // On a cell of data: the Customer cell of the row moves it, and keeps the focus.
    await real.keyboard('{ArrowRight}{ArrowRight}');
    await expect(active()).toBe(inRow('DH-1030', 2));
    await press('ArrowUp');
    await waitFor(
      () =>
        expect(orderOf(root).slice(0, 3), 'DH-1030 is the second again').toEqual([
          'DH-1034',
          'DH-1030',
          'DH-1031',
        ]),
      RENDER_UPDATE,
    );
    await waitFor(
      () => expect(active(), 'the focus is on its Customer cell').toBe(inRow('DH-1030', 2)),
      RENDER_UPDATE,
    );
    await expect(table.querySelectorAll('[tabindex="0"]'), 'one Tab stop').toHaveLength(1);
    await expect(table.contains(active())).toBe(true);
  };
}

export const RowReorderKeys: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  args: { onRowReorder: fn() },
  render: (args) => <MovableGrid onMove={args.onRowReorder} />,
  play: rowReorderKeys('Control'),
};

export const RowReorderKeysOnAMac: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('apple'),
  args: { onRowReorder: fn() },
  render: (args) => <MovableGrid onMove={args.onRowReorder} />,
  play: rowReorderKeys('Meta'),
};

/**
 * The menu of a row, with real keys (spec phase 6 §3.6): Enter on a handle opens it, on its first item;
 * the arrows go down it, and Enter on "Move to bottom" moves the row and closes the menu, and the focus is
 * on the handle of the row, which is now the last; "Move down" and "Move to bottom" are off for it. Space
 * opens it too, and Escape closes it and gives the focus back to the handle.
 */
export const RowMenuKeys: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  args: { onRowReorder: fn() },
  render: (args) => <MovableGrid onMove={args.onRowReorder} />,
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const table = tableOf(root);
    const calls = args.onRowReorder as ReturnType<typeof fn>;
    const active = () => document.activeElement as HTMLElement;
    const menu = () => document.querySelector<HTMLElement>('.flg-data-grid-row-menu')!;
    const opened = () => menu().matches(':popover-open');
    const items = () => Array.from(menu().querySelectorAll<HTMLElement>('[role="menuitem"]'));
    for (let tabs = 0; tabs < 4 && !table.contains(document.activeElement); tabs += 1) {
      await real.tab();
    }
    await real.keyboard('{ArrowDown}{ArrowDown}');
    await expect(active()).toBe(handleOf(root, 'DH-1030'));

    await real.keyboard('{Enter}');
    await waitFor(() => expect(opened(), 'the menu is open').toBe(true), MENU_SHOWN);
    await expect(handleOf(root, 'DH-1030')).toHaveAttribute('aria-expanded', 'true');
    await expect(items().map((item) => item.textContent)).toEqual([
      'Move up',
      'Move down',
      'Move to top',
      'Move to bottom',
    ]);
    await waitFor(
      () => expect(active().textContent, 'the first item has the focus').toBe('Move up'),
      MENU_SHOWN,
    );
    await real.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    await expect(active().textContent).toBe('Move to bottom');
    await real.keyboard('{Enter}');
    await waitFor(
      () => expect(orderOf(root).at(-1), 'DH-1030 is the last row').toBe('DH-1030'),
      RENDER_UPDATE,
    );
    await expect(calls).toHaveBeenLastCalledWith('DH-1030', 'DH-1037', 'after');
    await waitFor(() => expect(opened(), 'the menu is closed').toBe(false), MENU_SHOWN);
    await waitFor(
      () => expect(active(), 'the focus is on its handle').toBe(handleOf(root, 'DH-1030')),
      MENU_SHOWN,
    );

    // The last row cannot go down: its two items are off. Space opens the menu, Escape closes it.
    await real.keyboard(' ');
    await waitFor(() => expect(opened(), 'Space opens the menu').toBe(true), MENU_SHOWN);
    const off = items()
      .filter((item) => item.getAttribute('aria-disabled') === 'true')
      .map((item) => item.textContent);
    await expect(off).toEqual(['Move down', 'Move to bottom']);
    await real.keyboard('{Escape}');
    await waitFor(() => expect(opened(), 'Escape closes the menu').toBe(false), MENU_SHOWN);
    await waitFor(
      () => expect(active(), 'the focus is on its handle').toBe(handleOf(root, 'DH-1030')),
      MENU_SHOWN,
    );
    await expect(orderOf(root).at(-1)).toBe('DH-1030');
  },
};

/** The grid and the page have none of what a drag sets on them. */
async function dragIsOver(root: HTMLElement, what: string) {
  await nextFrame();
  await expect(document.documentElement, `${what}: the cursor mark is gone`).not.toHaveAttribute(
    'data-flg-grid-cursor',
  );
  await expect(
    document.querySelector('.flg-data-grid-drag-chip'),
    `${what}: the chip is gone`,
  ).toBeNull();
  await expect(rowLineOf(root), `${what}: the line is gone`).toBeNull();
  await expect(root.querySelector('[data-drag-source]'), `${what}: no row is dimmed`).toBeNull();
}

/**
 * Moving a row by the mouse, in each engine (spec phase 6 §3.8, §4.3 R1 "Kéo dòng"). The states that need
 * the button held are made with pointer events the browser does not know: the row at 35%, the chip with its
 * name 16px from the pointer, the line 3px across what the frame shows with its dot, at the boundary a drop
 * would use and nowhere beside the row itself, the cursor mark, and a frame that scrolls under a pointer
 * at its edge. Escape puts everything back. The drops are made with the real mouse: after the lower half of
 * a row, and before the upper half of another.
 */
export const RowReorderMouse: Story = {
  tags: ['no-visual'],
  args: { onRowReorder: fn() },
  render: (args) => <MovableGrid onMove={args.onRowReorder} height={300} />,
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const frame = root.querySelector<HTMLElement>('.flg-data-grid-frame')!;
    const calls = args.onRowReorder as ReturnType<typeof fn>;
    await expect(orderOf(root)).toEqual(START_ORDER);

    // A held drag of the first row, to the lower half of the third.
    const handle = handleOf(root, 'DH-1034');
    const start = middleOf(handle);
    const send = pointer('mouse', 91, start);
    const third = dataRowsOf(root)[2]!.getBoundingClientRect();
    const target = { x: start.x + 100, y: third.top + third.height * 0.75 };
    send(handle, 'pointerdown');
    send(document, 'pointermove', target);
    await waitFor(() => expect(rowLineOf(root), 'the line is drawn').not.toBeNull(), RENDER_UPDATE);
    const line = rowLineOf(root)!;
    const box = line.getBoundingClientRect();
    const inner = frame.getBoundingClientRect();
    near(box.height, 3, 0.5, 'the line is 3px high');
    near(box.top + box.height / 2, third.bottom, 1.5, 'its middle is on the boundary under row 3');
    near(
      box.left,
      inner.left + frame.clientLeft,
      1,
      'it starts at the left of what the frame shows',
    );
    near(box.width, frame.clientWidth, 1.5, 'and runs across what it shows');
    const dot = getComputedStyle(line, '::before');
    await expect([dot.width, dot.height, dot.left]).toEqual(['7px', '7px', '-2px']);
    await expect(dot.backgroundColor, 'the dot and the line are the accent').toBe(
      getComputedStyle(line).backgroundColor,
    );
    await expect(getComputedStyle(line).pointerEvents).toBe('none');
    const chip = document.querySelector<HTMLElement>('.flg-data-grid-drag-chip')!;
    await expect(chip).toHaveTextContent('DH-1034');
    near(
      chip.getBoundingClientRect().left,
      target.x + 16,
      1.5,
      'the chip is 16px right of the pointer',
    );
    near(chip.getBoundingClientRect().top, target.y + 16, 1.5, 'and 16px below it');
    await expect(getComputedStyle(dataRowsOf(root)[0]!).opacity, 'the source row is at 35%').toBe(
      '0.35',
    );
    await expect(dataRowsOf(root)[1]!).not.toHaveAttribute('data-drag-source');
    await expect(document.documentElement).toHaveAttribute('data-flg-grid-cursor', 'grabbing');
    // Over the row itself there is no line: a drop there would move nothing.
    send(document, 'pointermove', middleOf(dataRowsOf(root)[0]!));
    await waitFor(
      () => expect(rowLineOf(root), 'no line over the row itself').toBeNull(),
      RENDER_UPDATE,
    );
    // Over the heading there is none either.
    send(document, 'pointermove', middleOf(titleOf(root, 'Customer')));
    await nextFrame();
    await expect(rowLineOf(root), 'no line over the heading').toBeNull();
    // Escape puts everything back, and the release after it moves nothing.
    send(document, 'pointermove', target);
    await waitFor(() => expect(rowLineOf(root)).not.toBeNull(), RENDER_UPDATE);
    await real.keyboard('{Escape}');
    await dragIsOver(root, 'Escape');
    send(document, 'pointerup', target);
    await nextFrame();
    await expect(calls).not.toHaveBeenCalled();
    await expect(orderOf(root)).toEqual(START_ORDER);

    // The frame scrolls under a pointer at its bottom edge, and the cancel ends it.
    send(handle, 'pointerdown');
    send(document, 'pointermove', { x: start.x + 100, y: inner.bottom - 6 });
    await waitFor(
      () => expect(frame.scrollTop, 'the frame scrolled').toBeGreaterThan(0),
      SCROLL_EVENT,
    );
    send(document, 'pointermove', target);
    send(document, 'pointercancel');
    await dragIsOver(root, 'a cancel');
    await expect(calls).not.toHaveBeenCalled();
    frame.scrollTop = 0;
    await waitFor(() => expect(frame.scrollTop).toBe(0), SCROLL_EVENT);

    // The real mouse: the first row dropped on the lower half of the fourth.
    const rows = () => dataRowsOf(root);
    const fourth = rows()[3]!.getBoundingClientRect();
    const grip = handle.getBoundingClientRect();
    await real.dragAndDrop(handle, rows()[3]!, {
      sourcePosition: { x: grip.width / 2, y: grip.height / 2 },
      targetPosition: { x: 100, y: fourth.height * 0.75 },
    });
    await waitFor(
      () =>
        expect(orderOf(root).slice(0, 4), 'DH-1034 is after DH-1027').toEqual([
          'DH-1031',
          'DH-1030',
          'DH-1027',
          'DH-1034',
        ]),
      RENDER_UPDATE,
    );
    await expect(calls).toHaveBeenLastCalledWith('DH-1034', 'DH-1027', 'after');
    await dragIsOver(root, 'the first drop');

    // And the fifth row before the upper half of the first.
    const first = rows()[0]!.getBoundingClientRect();
    const fifth = handleOf(root, 'DH-1022').getBoundingClientRect();
    await real.dragAndDrop(handleOf(root, 'DH-1022'), rows()[0]!, {
      sourcePosition: { x: fifth.width / 2, y: fifth.height / 2 },
      targetPosition: { x: 100, y: first.height * 0.25 },
    });
    await waitFor(
      () => expect(orderOf(root)[0], 'DH-1022 is the first').toBe('DH-1022'),
      RENDER_UPDATE,
    );
    await expect(calls).toHaveBeenLastCalledWith('DH-1022', 'DH-1031', 'before');
    await dragIsOver(root, 'the second drop');
  },
};

/**
 * A finger moves a row (spec phase 6 §3.8, Claude's ruling on the touch drags). The story runner cannot make a
 * touch drag (Playwright's touchscreen only taps), so the finger is a pointer of type `touch` that the page
 * dispatches, which the grid follows as it follows the real one; the unit tests of the grid do the same with
 * a touch pointer. The handle takes every pointer type and has `touch-action: none`, so the browser's own
 * scroll does not take the finger.
 */
export const RowReorderTouch: Story = {
  tags: ['no-visual'],
  args: { onRowReorder: fn() },
  render: (args) => <MovableGrid onMove={args.onRowReorder} />,
  play: async ({ canvasElement, args }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const calls = args.onRowReorder as ReturnType<typeof fn>;
    const handle = handleOf(root, 'DH-1031');
    await expect(getComputedStyle(handle).touchAction).toBe('none');
    const finger = pointer('touch', 95, middleOf(handle));
    const fourth = dataRowsOf(root)[3]!.getBoundingClientRect();
    const to = { x: middleOf(handle).x + 60, y: fourth.top + fourth.height * 0.25 };
    finger(handle, 'pointerdown');
    finger(document, 'pointermove', to);
    await waitFor(() => expect(rowLineOf(root), 'the line is drawn').not.toBeNull(), RENDER_UPDATE);
    await expect(dataRowsOf(root)[1]!).toHaveAttribute('data-drag-source');
    finger(document, 'pointerup', to);
    await waitFor(
      () =>
        expect(orderOf(root).slice(0, 4), 'DH-1031 is before DH-1027').toEqual([
          'DH-1034',
          'DH-1030',
          'DH-1031',
          'DH-1027',
        ]),
      RENDER_UPDATE,
    );
    await expect(calls).toHaveBeenLastCalledWith('DH-1031', 'DH-1027', 'before');
    await dragIsOver(root, 'the finger');
  },
};

/** G1's columns with Customer 28px narrower, the width of the column of handles, so they fit the frame. */
const REORDER_COLUMNS = SALE_COLUMNS.map((column) =>
  'field' in column && column.field === 'customer' ? { ...column, width: 220 } : column,
);

/**
 * Outside the mockup (spec phase 6 §4.3 R1 "Kéo dòng", after D2 and C1): G1's grid with the column of
 * handles after the boxes, unsorted, and the handle of the third row held down and dragged to between the
 * fifth and the sixth rows (the harness drags what has `data-visual-drag` by the distance it says, and
 * shoots with the button down): the handle column, the third row at 35% with its handle in the accent, the
 * chip with its name 16px from the pointer, and the 3px line across the frame with its dot at its left end,
 * on the boundary under the fifth row. The pointer ends in the lower half of the fifth row, so the stage
 * holds the chip.
 */
export const RowReorderDragging: Story = {
  tags: ['viewport-1440x720'],
  render: () => (
    <SalesGrid
      variant="lined"
      height={459}
      columns={REORDER_COLUMNS}
      defaultSort={[]}
      rowReorder
      onRowReorder={() => {}}
    />
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const rows = Array.from(
      root.querySelectorAll<HTMLTableRowElement>('tbody > tr.flg-data-grid-row'),
    );
    await expect(rows).toHaveLength(12);
    // The column of handles is 28px, after the boxes and before the data.
    const head = root.querySelector<HTMLElement>('th[data-service="drag"]')!;
    await expect(Math.round(head.offsetWidth)).toBe(28);
    await expect(
      Array.from(rows[0]!.cells)
        .slice(0, 3)
        .map((cell) => cell.getAttribute('data-service')),
    ).toEqual(['select', 'drag', null]);
    const handle = rows[2]!.querySelector<HTMLElement>('button.flg-data-grid-row-handle')!;
    await expect(handle).toHaveAttribute('aria-label', 'Reorder DH-1033');
    for (const row of rows) {
      await expect(
        row.querySelector('button.flg-data-grid-row-handle'),
        'every row has its handle, none of them off',
      ).not.toHaveAttribute('aria-disabled');
    }
    const box = handle.getBoundingClientRect();
    await expect([Math.round(box.width), Math.round(box.height)], 'the handle is 20 by 24').toEqual(
      [20, 24],
    );
    // The pointer ends in the lower half of the fifth row: the boundary under it is where the line stands.
    const fifth = rows[4]!.getBoundingClientRect();
    const end = fifth.bottom - fifth.height / 4;
    const dy = Math.round(end - (box.top + box.height / 2));
    handle.setAttribute('data-visual-drag', `0,${dy}`);
    // The chip is 16px below the pointer and about 28px tall: the stage has the room.
    const stage = canvasElement.closest<HTMLElement>('[data-testid="flg-stage"]');
    if (stage) {
      await expect(stage.getBoundingClientRect().bottom - end).toBeGreaterThan(16 + 28);
    }
    await noTitleIsCut(root);
    // The handle column's 28px come out of Customer, so the columns still fit the frame: no column, Total
    // included, is cut by the frame's edge (`noTitleIsCut` reads a title inside its cell only).
    const frame = root.querySelector<HTMLElement>('.flg-table-frame')!;
    await expect(frame.scrollWidth, 'the columns fit the frame').toBeLessThanOrEqual(
      frame.clientWidth,
    );
  },
};

/**
 * A row with no detail button (spec phase 6 §3.6 "Ô có nhiều control"; review comment 4662947037 on PR
 * #45): the first row has none, so its detail cell is the active place at the start, and it must be the
 * grid's Tab stop. Tab from before the grid lands on that cell, and the grid has one stop all the while.
 */
export const DetailCellWithoutButtonIsTheStop: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 900 }}>
      <DataGrid
        aria-label="Orders"
        data={R1_ORDERS}
        rowKey="id"
        columns={R1_COLUMNS}
        paging={false}
        renderDetail={detailWithControls}
        rowHasDetail={(row) => row.id !== R1_ORDERS[0]!.id}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const table = tableOf(root);
    const real = await realUserEvent();
    if (!real) return;
    const stops = () => table.querySelectorAll('[tabindex="0"]');
    const active = () => document.activeElement as HTMLElement;
    const first = bodyRowsOf(root)[0]!.querySelector<HTMLElement>('[data-service="detail"]')!;
    await expect(stops()).toHaveLength(1);
    for (let tabs = 0; tabs < 4 && !table.contains(active()); tabs += 1) await real.tab();
    await waitFor(
      () => expect(active(), 'Tab lands on the cell with no button').toBe(first),
      RENDER_UPDATE,
    );
    await expect(stops()).toHaveLength(1);
  },
};
