import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { onPlatform } from '../../../.storybook/platform';
import { noTitleIsCut } from '../../../.storybook/data-grid-orders';
import { realUserEvent } from '../../../.storybook/real-input';
import { Card } from '../card/Card';
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
