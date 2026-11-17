import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor, within } from 'storybook/test';
import { onPlatform } from '../../../.storybook/platform';
import { realUserEvent } from '../../../.storybook/real-input';
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
    paging={false}
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
          paging={false}
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
      paging={false}
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
              paging={false}
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

// What a press on a title does is read from the grid: the ids in the order of the rows, the order of a
// column as numbers, and the sort the headings say.
const idsIn = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('tbody > tr > th')).map((cell) => cell.textContent);
const columnIn = (root: HTMLElement, index: number) =>
  Array.from(root.querySelectorAll('tbody > tr')).map((row) =>
    Number((row.children[index] as HTMLElement).textContent!.replace(/\D/g, '')),
  );
const headOf = (root: HTMLElement, caption: string) =>
  Array.from(root.querySelectorAll<HTMLElement>('thead th')).find((th) =>
    th.textContent?.startsWith(caption),
  )!;
const titleOf = (root: HTMLElement, caption: string) =>
  within(headOf(root, caption)).getByRole('button');
type Real = NonNullable<Awaited<ReturnType<typeof realUserEvent>>>;

/**
 * Runs a press and says whether the `mousedown` of it was cancelled. The listener is on the document,
 * after React's, so it sees what the grid's handler did. A cancelled `mousedown` is what keeps the
 * browser from starting a text selection (and from moving the focus) with a Shift press.
 */
async function cancelledMouseDown(press: () => Promise<void>): Promise<boolean> {
  const seen: boolean[] = [];
  const watch = (event: MouseEvent) => seen.push(event.defaultPrevented);
  document.addEventListener('mousedown', watch);
  try {
    await press();
  } finally {
    document.removeEventListener('mousedown', watch);
  }
  await expect(seen).toHaveLength(1);
  return seen[0]!;
}

/** A press with a modifier held, as the browser sees it: the key goes down, the press, the key up. */
async function pressWith(real: Real, key: 'Shift' | 'Meta' | 'Control', element: HTMLElement) {
  await real.keyboard(`{${key}>}`);
  try {
    return await cancelledMouseDown(() => real.click(element));
  } finally {
    await real.keyboard(`{/${key}}`);
  }
}

/**
 * A press on a title sorts: ascending, then descending, then back to the order of the data. A press
 * with Shift adds a level, and that press does not select text. To prove the last, a caret is put in
 * a cell first: Shift with a press on something else is what extends a selection from the caret to it,
 * unless the `mousedown` is cancelled.
 */
export const Sorting: Story = {
  tags: ['no-visual'],
  render: () => (
    <DataGrid data={ORDERS.slice(0, 8)} rowKey="id" columns={COLUMNS} caption="Orders" />
  ),
  play: async ({ canvasElement, canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const original = idsIn(canvasElement);
    await real.click(titleOf(canvasElement, 'Qty'));
    await expect(headOf(canvasElement, 'Qty')).toHaveAttribute('aria-sort', 'ascending');
    const ascending = columnIn(canvasElement, 3);
    await expect(ascending).toEqual([...ascending].sort((a, b) => a - b));
    await expect(ascending[0]).toBeLessThan(ascending.at(-1)!);
    await real.click(titleOf(canvasElement, 'Qty'));
    await expect(headOf(canvasElement, 'Qty')).toHaveAttribute('aria-sort', 'descending');
    const descending = columnIn(canvasElement, 3);
    await expect(descending).toEqual([...descending].sort((a, b) => b - a));
    await real.click(titleOf(canvasElement, 'Qty'));
    await expect(headOf(canvasElement, 'Qty')).not.toHaveAttribute('aria-sort');
    await expect(idsIn(canvasElement)).toEqual(original);

    // Two levels: Qty, then Total inside equal quantities.
    // A plain press leaves its `mousedown` alone; one that adds a level cancels it.
    await expect(cancelledMouseDown(() => real.click(titleOf(canvasElement, 'Qty')))).resolves.toBe(
      false,
    );
    await real.click(canvas.getAllByRole('rowheader')[0]!);
    await expect(pressWith(real, 'Shift', titleOf(canvasElement, 'Total'))).resolves.toBe(true);
    await expect(window.getSelection()?.toString()).toBe('');
    await expect(canvasElement.querySelectorAll('.flg-data-grid-sort-index')).toHaveLength(2);
    await expect(titleOf(canvasElement, 'Total')).toHaveAccessibleName(
      // A browser may put a space before the comma, where the hidden words begin.
      /^Total\s*, sorted ascending, 2 of 2$/,
    );
    // Only the first level has aria-sort.
    await expect(headOf(canvasElement, 'Total')).not.toHaveAttribute('aria-sort');
    await expect(headOf(canvasElement, 'Qty')).toHaveAttribute('aria-sort', 'ascending');
  },
};

// The stories below are written out, not made by a function: the tags and the play function of a
// story are read from the file without running it.
const modifierPlay =
  (key: 'Meta' | 'Control'): NonNullable<Story['play']> =>
  async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await real.click(titleOf(canvasElement, 'Qty'));
    await expect(pressWith(real, key, titleOf(canvasElement, 'Total'))).resolves.toBe(true);
    // The key that is the modifier of this platform adds a level, and the press leaves no selection.
    await expect(canvasElement.querySelectorAll('.flg-data-grid-sort-index')).toHaveLength(2);
    await expect(window.getSelection()?.toString()).toBe('');
    // The same press turns the level, then takes it off.
    await expect(pressWith(real, key, titleOf(canvasElement, 'Total'))).resolves.toBe(true);
    await expect(titleOf(canvasElement, 'Total')).toHaveAccessibleName(
      /^Total\s*, sorted descending, 2 of 2$/,
    );
    await expect(pressWith(real, key, titleOf(canvasElement, 'Total'))).resolves.toBe(true);
    await expect(canvasElement.querySelectorAll('.flg-data-grid-sort-index')).toHaveLength(0);
    await expect(headOf(canvasElement, 'Qty')).toHaveAttribute('aria-sort', 'ascending');
  };

const ModifierGrid = () => (
  <DataGrid data={ORDERS.slice(0, 8)} rowKey="id" columns={COLUMNS} caption="Orders" />
);

/** The modifier that adds a level is ⌘ on an Apple system. */
export const SortingModifierApple: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('apple'),
  render: () => <ModifierGrid />,
  play: modifierPlay('Meta'),
};

/** And Ctrl on any other. */
export const SortingModifierOther: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  render: () => <ModifierGrid />,
  play: modifierPlay('Control'),
};

/**
 * The pager moves between pages, and a choice of size keeps the first row that is shown: the second
 * page of 10 starts at the eleventh row, which is the first of the page of 20.
 */
export const Paging: Story = {
  tags: ['no-visual'],
  render: () => (
    <DataGrid
      data={ORDERS}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={{ pageSize: 10, pageSizes: [10, 20] }}
    />
  ),
  play: async ({ canvasElement, canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const info = () => canvasElement.querySelector('.flg-data-grid-page-info')!.textContent;
    await expect(info()).toBe('1–10 of 40');
    await expect(canvasElement.querySelectorAll('tbody > tr')).toHaveLength(10);
    await real.click(canvas.getByRole('button', { name: 'Page 2' }));
    await expect(info()).toBe('11–20 of 40');
    await expect(idsIn(canvasElement)[0]).toBe(ORDERS[10]!.id);
    await real.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(info()).toBe('21–30 of 40');
    await real.click(canvas.getByRole('button', { name: 'Page 2' }));
    const trigger = canvas.getByRole('combobox', { name: 'Rows per page' });
    await expect(trigger).toHaveTextContent('10 / page');
    await real.click(trigger);
    const listbox = canvasElement.querySelector<HTMLElement>('.flg-select-listbox')!;
    await real.click(within(listbox).getByRole('option', { name: '20 / page' }));
    await waitFor(() => expect(trigger).toHaveTextContent('20 / page'));
    await expect(canvasElement.querySelectorAll('tbody > tr')).toHaveLength(20);
    await expect(info()).toBe('1–20 of 40');
    await expect(idsIn(canvasElement)[0]).toBe(ORDERS[0]!.id);
  },
};

/**
 * In server mode the data is the page and is already in order: a press on a title shows the sort in
 * the heading and calls `onSortChange`, and the rows stay where they are; the pager counts
 * `totalCount` and calls `onPageChange`.
 */
export const ServerMode: Story = {
  tags: ['no-visual'],
  args: {
    data: ORDERS.slice(0, 10),
    columns: COLUMNS,
    remote: true,
    totalCount: 135,
    paging: { pageSize: 10, pageSizes: [10, 20] },
    caption: 'Orders',
    onSortChange: fn(),
    onPageChange: fn(),
    onStateChange: fn(),
  },
  play: async ({ canvasElement, canvas, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const original = idsIn(canvasElement);
    const info = () => canvasElement.querySelector('.flg-data-grid-page-info')!.textContent;
    await real.click(titleOf(canvasElement, 'Qty'));
    await expect(args.onSortChange).toHaveBeenCalledTimes(1);
    await expect(args.onSortChange).toHaveBeenCalledWith([{ field: 'qty', direction: 'asc' }]);
    await expect(headOf(canvasElement, 'Qty')).toHaveAttribute('aria-sort', 'ascending');
    await expect(idsIn(canvasElement)).toEqual(original);
    await expect(info()).toBe('1–10 of 135');
    await real.click(canvas.getByRole('button', { name: 'Page 2' }));
    await expect(args.onPageChange).toHaveBeenCalledTimes(1);
    await expect(args.onPageChange).toHaveBeenCalledWith({ index: 1, size: 10 });
    await expect(args.onStateChange).toHaveBeenLastCalledWith(
      { sort: [{ field: 'qty', direction: 'asc' }], page: { index: 1, size: 10 } },
      'page',
    );
    await expect(idsIn(canvasElement)).toEqual(original);
    await expect(info()).toBe('11–20 of 135');
  },
};
