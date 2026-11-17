import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { expect, fn, waitFor, within } from 'storybook/test';
import { onPlatform } from '../../../.storybook/platform';
import { realUserEvent } from '../../../.storybook/real-input';
import { Avatar } from '../avatar/Avatar';
import { Badge } from '../badge/Badge';
import { Card } from '../card/Card';
import { Select, SelectItem } from '../select/Select';
import type { TableVariant } from '../table/Table';
import { DataGrid } from './DataGrid';
import { ROW_HEIGHT, rowPitch } from './row-heights';
import type { DataGridColumn, DataGridDensity, DataGridHandle, DataGridProps } from './index';

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
        rules: [{ id: 'region', enabled: false }],
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
    // Every column has a width, so the heading ends in the cell of the filler column.
    await expect(canvasElement.querySelectorAll('thead th')).toHaveLength(COLUMNS.length + 1);
    await expect(canvasElement.querySelector('thead th:last-child')).toHaveClass(
      'flg-data-grid-filler',
    );
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
      const heads = head.querySelectorAll('th:not(.flg-data-grid-filler)');
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

/** The sum of the widths of the six columns of the stories, which all have one. */
const FIXED_SUM = COLUMNS.reduce((sum, column) => sum + column.width!, 0);
const fillerOf = (row: HTMLTableRowElement) => row.cells[row.cells.length - 1]!;

const FillerGrids = () => (
  <div style={{ display: 'grid', gap: 16 }}>
    {VARIANTS.map((variant) => (
      <div key={variant} style={{ width: 1100 }}>
        <Small id={variant} variant={variant} />
      </div>
    ))}
    <div style={{ width: 500 }}>
      <Small id="narrow" />
    </div>
  </div>
);

/**
 * Six columns that all have a width, in a grid of 1100px in each look: every column is as wide as it
 * says, and the filler column at the end takes the rest of the frame, so the band of the heading, the
 * rule between the rows (`lined`) and the stripe with its round end (`striped`) reach the frame's
 * edge. It takes no pointer and no padding. In a frame narrower than the columns it has nothing, and
 * the frame scrolls.
 */
export const FillerColumn: Story = {
  tags: ['no-visual'],
  render: () => <FillerGrids />,
  play: async ({ canvas }) => {
    const padding = (element: HTMLElement) => {
      const style = getComputedStyle(element);
      return parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    };
    const exact = async (table: HTMLTableElement) => {
      for (const row of Array.from(table.rows)) {
        await expect(row.cells).toHaveLength(COLUMNS.length + 1);
        for (const [index, column] of COLUMNS.entries()) {
          await expect(row.cells[index]!.offsetWidth).toBe(column.width);
        }
        await expect(fillerOf(row)).toHaveClass('flg-data-grid-filler');
      }
    };

    for (const variant of VARIANTS) {
      const table = canvas.getByTestId(variant).querySelector('table')!;
      const frame = table.parentElement!;
      const room = frame.clientWidth - padding(frame);
      await expect(room).toBeGreaterThan(FIXED_SUM);
      await expect(table.offsetWidth).toBe(room);
      await exact(table);
      const rows = Array.from(table.rows);
      for (const row of rows) {
        const filler = fillerOf(row);
        await expect(filler.offsetWidth).toBe(room - FIXED_SUM);
        // The cell's offsetParent is the table, so this is its right edge in the table: the frame's.
        await expect(filler.offsetLeft + filler.offsetWidth).toBe(table.offsetWidth);
        await expect(padding(filler)).toBe(0);
        await expect(getComputedStyle(filler).pointerEvents).toBe('none');
      }
      // The band of the heading is painted on it, over the solid of a sticky heading.
      await expect(getComputedStyle(fillerOf(rows[0]!)).backgroundImage).toContain('gradient');
      if (variant === 'lined') {
        // The rule between the rows, on every row but the last, as on the other cells.
        for (const row of rows.slice(0, -1)) {
          await expect(getComputedStyle(fillerOf(row)).borderBottomWidth).toBe('1px');
        }
      }
      if (variant === 'striped') {
        // The first row has a stripe, and the row ends round at the filler, not at its last column.
        const first = rows[1]!;
        await expect(first).toHaveAttribute('data-stripe');
        await expect(getComputedStyle(fillerOf(first)).backgroundColor).toBe(
          getComputedStyle(first.cells[0]!).backgroundColor,
        );
        await expect(getComputedStyle(fillerOf(first)).borderTopRightRadius).not.toBe('0px');
        await expect(getComputedStyle(first.cells[COLUMNS.length - 1]!).borderTopRightRadius).toBe(
          '0px',
        );
      }
    }

    // Narrower than the columns: the filler has nothing, the columns keep their widths, and the
    // frame scrolls to the last of them.
    const table = canvas.getByTestId('narrow').querySelector('table')!;
    const frame = table.parentElement!;
    await expect(table.offsetWidth).toBe(FIXED_SUM);
    await exact(table);
    for (const row of Array.from(table.rows)) await expect(fillerOf(row).offsetWidth).toBe(0);
    await expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth);
    frame.scrollLeft = frame.scrollWidth;
    // The last column ends in sight.
    await expect(frame.scrollLeft).toBeGreaterThan(0);
    await expect(FIXED_SUM - frame.scrollLeft).toBeLessThanOrEqual(frame.clientWidth + 1);
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
    // Every press cancels its `mousedown`, which leaves the focus on the title and not the button
    // (see FocusAfterPress); one that adds a level selects no text for it.
    await expect(cancelledMouseDown(() => real.click(titleOf(canvasElement, 'Qty')))).resolves.toBe(
      true,
    );
    await expect(headOf(canvasElement, 'Qty')).toHaveFocus();
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
      {
        sort: [{ field: 'qty', direction: 'asc' }],
        page: { index: 1, size: 10 },
        selectedKeys: [],
      },
      'page',
    );
    await expect(idsIn(canvasElement)).toEqual(original);
    await expect(info()).toBe('11–20 of 135');
  },
};

// The keyboard (spec phase 6 §3.6). Real keys, in every engine.
const bodyCell = (root: HTMLElement, row: number, column: number) =>
  root.querySelectorAll<HTMLElement>('tbody > tr')[row]!.children[column] as HTMLElement;
const stopsIn = (root: HTMLElement) => root.querySelectorAll('[tabindex="0"]');

/** A grid that scrolls, with a row's worth of keys to press: a height that shows some of its rows. */
const KEYBOARD_ARGS = {
  data: ORDERS.slice(0, 12),
  columns: COLUMNS,
  rowKey: 'id',
  height: 300,
  paging: false,
  caption: 'Orders',
  onRowActivate: fn(),
} as const;

/**
 * Every key of the grid from a cell, on a platform where `mod` is `key`: the arrows keep their column
 * and stop at the edges, Home and End go along the row, mod+Home and mod+End to the first and the
 * last cell, PageDown and PageUp by the rows the frame shows, Enter on a title sorts (Shift+Enter adds
 * a level), Enter on a cell activates its row. The other platform's modifier is not the grid's.
 */
const keyboardMapPlay =
  (mod: 'Meta' | 'Control', other: 'Meta' | 'Control'): NonNullable<Story['play']> =>
  async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const table = canvasElement.querySelector('table')!;
    // Exactly one Tab stop, and Tab reaches it.
    await expect(stopsIn(table)).toHaveLength(1);
    await real.tab();
    await expect(bodyCell(canvasElement, 0, 0)).toHaveFocus();
    await expect(bodyCell(canvasElement, 0, 0)).toHaveAttribute('tabindex', '0');

    await real.keyboard('{ArrowRight}{ArrowRight}');
    await expect(bodyCell(canvasElement, 0, 2)).toHaveFocus();
    await real.keyboard('{ArrowDown}');
    await expect(bodyCell(canvasElement, 1, 2)).toHaveFocus();
    await real.keyboard('{End}');
    await expect(bodyCell(canvasElement, 1, COLUMNS.length - 1)).toHaveFocus();
    // Past the end of a row there is nowhere to go, and the key does not scroll the frame sideways.
    await real.keyboard('{ArrowRight}');
    await expect(bodyCell(canvasElement, 1, COLUMNS.length - 1)).toHaveFocus();
    await real.keyboard('{Home}');
    await expect(bodyCell(canvasElement, 1, 0)).toHaveFocus();
    await expect(stopsIn(table)).toHaveLength(1);
    // Up from the first row is the title, down from it the first row again.
    await real.keyboard('{ArrowUp}{ArrowUp}');
    const orderTitle = table.querySelector<HTMLElement>('thead th')!;
    await expect(orderTitle).toHaveFocus();
    await real.keyboard('{ArrowUp}');
    await expect(orderTitle).toHaveFocus();
    await real.keyboard('{ArrowDown}');
    await expect(bodyCell(canvasElement, 0, 0)).toHaveFocus();

    // The other system's modifier is not this one's: nothing moves.
    await real.keyboard(`{${other}>}{End}{/${other}}`);
    await expect(bodyCell(canvasElement, 0, 0)).toHaveFocus();
    const rows = table.querySelectorAll('tbody > tr').length;
    await real.keyboard(`{${mod}>}{End}{/${mod}}`);
    await expect(bodyCell(canvasElement, rows - 1, COLUMNS.length - 1)).toHaveFocus();
    await real.keyboard(`{${mod}>}{Home}{/${mod}}`);
    await expect(bodyCell(canvasElement, 0, 0)).toHaveFocus();

    // A page is the rows that fit in the frame under the heading, measured here.
    const frame = table.parentElement!;
    const page = Math.floor(
      (frame.clientHeight - table.tHead!.offsetHeight) /
        table.querySelector<HTMLElement>('tbody > tr')!.offsetHeight,
    );
    await expect(page).toBeGreaterThan(2);
    await real.keyboard('{PageDown}');
    await expect(bodyCell(canvasElement, page, 0)).toHaveFocus();
    await real.keyboard('{PageUp}');
    await expect(bodyCell(canvasElement, 0, 0)).toHaveFocus();

    // Enter on a cell activates the row; on a title it sorts.
    await real.keyboard('{ArrowRight}{Enter}');
    await expect(args.onRowActivate).toHaveBeenCalledTimes(1);
    await expect(args.onRowActivate).toHaveBeenCalledWith(ORDERS[0], ORDERS[0]!.id);
    await real.keyboard('{ArrowUp}{ArrowRight}{ArrowRight}{Enter}');
    const qtyTitle = headOf(canvasElement, 'Qty');
    await expect(qtyTitle).toHaveFocus();
    await expect(qtyTitle).toHaveAttribute('aria-sort', 'ascending');
    await real.keyboard('{ArrowRight}{Shift>}{Enter}{/Shift}');
    await expect(canvasElement.querySelectorAll('.flg-data-grid-sort-index')).toHaveLength(2);
    await expect(headOf(canvasElement, 'Total')).toHaveFocus();
    await expect(qtyTitle).toHaveAttribute('aria-sort', 'ascending');
    // The title is still the one Tab stop.
    await expect(stopsIn(table)).toHaveLength(1);
  };

/** The keys of the grid, with ⌘ as the modifier. */
export const KeyboardMapApple: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('apple'),
  args: KEYBOARD_ARGS,
  play: keyboardMapPlay('Meta', 'Control'),
};

/** And with Ctrl. */
export const KeyboardMapOther: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  args: KEYBOARD_ARGS,
  play: keyboardMapPlay('Control', 'Meta'),
};

/** Cells that hold a link and a button: one custom column, and the controls around the grid. */
const CONTROL_COLUMNS: DataGridColumn<Order>[] = [
  COLUMNS[0]!,
  {
    field: 'customer',
    caption: 'Customer',
    width: 220,
    cell: ({ row }) => (
      <span style={{ display: 'inline-flex', gap: 8 }}>
        <a href={`#${row.id}`}>Open</a>
        <button type="button">Edit</button>
      </span>
    ),
  },
  COLUMNS[2]!,
];

const AroundGrid = () => (
  <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
    <button type="button">Before</button>
    <DataGrid
      data={ORDERS.slice(0, 5)}
      rowKey="id"
      columns={CONTROL_COLUMNS}
      paging={false}
      aria-label="Orders"
    />
    <button type="button">After</button>
  </div>
);

/**
 * The links and buttons of the cells are not tab stops, so a Tab from before the grid stops once in it
 * and the next one leaves; the stop is the active cell, which Shift+Tab comes back to.
 */
export const TabStop: Story = {
  tags: ['no-visual'],
  render: () => <AroundGrid />,
  play: async ({ canvasElement, canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const table = canvasElement.querySelector('table')!;
    await expect(stopsIn(table)).toHaveLength(1);
    const controls = table.querySelectorAll('tbody a, tbody button');
    await expect(controls).toHaveLength(5 * 2);
    for (const control of controls) {
      await expect(control).toHaveAttribute('tabindex', '-1');
    }
    await real.tab();
    await expect(canvas.getByRole('button', { name: 'Before' })).toHaveFocus();
    await real.tab();
    await expect(bodyCell(canvasElement, 0, 0)).toHaveFocus();
    await real.keyboard('{ArrowDown}{ArrowRight}');
    await real.tab();
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();
    await real.tab({ shift: true });
    await expect(bodyCell(canvasElement, 1, 1)).toHaveFocus();
  },
};

/**
 * Enter or F2 on a cell that holds controls goes to the first of them, Tab and Shift+Tab go round
 * inside the cell, and Esc or F2 come back to the cell, which is the stop again. A title is entered
 * with F2 alone, since its Enter sorts.
 */
export const WidgetMode: Story = {
  tags: ['no-visual'],
  render: () => <AroundGrid />,
  play: async ({ canvasElement, canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    await real.tab();
    await real.tab();
    await real.keyboard('{ArrowRight}');
    const cell = bodyCell(canvasElement, 0, 1);
    const link = within(cell).getByRole('link', { name: 'Open' });
    const edit = within(cell).getByRole('button', { name: 'Edit' });
    await expect(cell).toHaveFocus();
    await real.keyboard('{Enter}');
    await expect(link).toHaveFocus();
    await real.tab();
    await expect(edit).toHaveFocus();
    await real.tab();
    await expect(link).toHaveFocus();
    await real.tab({ shift: true });
    await expect(edit).toHaveFocus();
    // Arrows are the control's own now: the active cell stays.
    await real.keyboard('{ArrowDown}');
    await expect(edit).toHaveFocus();
    await real.keyboard('{Escape}');
    await expect(cell).toHaveFocus();
    await real.keyboard('{F2}');
    await expect(link).toHaveFocus();
    await real.keyboard('{F2}');
    await expect(cell).toHaveFocus();
    await expect(stopsIn(canvasElement.querySelector('table')!)).toHaveLength(1);
    // A press on a control makes its cell the active one.
    await real.click(within(bodyCell(canvasElement, 2, 1)).getByRole('button', { name: 'Edit' }));
    await expect(bodyCell(canvasElement, 2, 1)).toHaveAttribute('tabindex', '0');
    await expect(cell).toHaveAttribute('tabindex', '-1');
    // A title is entered with F2, and Esc leaves it.
    await real.keyboard('{Escape}');
    await real.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    const title = headOf(canvasElement, 'Customer');
    await expect(title).toHaveFocus();
    await real.keyboard('{F2}');
    await expect(titleOf(canvasElement, 'Customer')).toHaveFocus();
    await real.keyboard('{Escape}');
    await expect(title).toHaveFocus();
    await real.tab();
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();
  },
};

const PressGrid = () => (
  <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
    <DataGrid
      data={ORDERS.slice(0, 8)}
      rowKey="id"
      columns={COLUMNS}
      paging={false}
      selectionMode="multiple"
      aria-label="Orders"
    />
    <button type="button">After</button>
  </div>
);

/**
 * After a press in the grid the focus is on the cell that was pressed, or on its box, so the keys go
 * on from there. A press on a sort button sorts and leaves the focus on its title: the arrows move from
 * it and Tab leaves the grid. A Shift press on a row adds the range and leaves the focus on the cell:
 * the arrows move from it and Shift+Space adds to the range.
 */
export const FocusAfterPress: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  render: () => <PressGrid />,
  play: async ({ canvasElement, canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const table = canvasElement.querySelector('table')!;
    const chosen = () =>
      Array.from(table.querySelectorAll('tbody > tr')).flatMap((row, index) =>
        row.getAttribute('aria-selected') === 'true' ? [index] : [],
      );

    // The column of boxes is first, so Qty is the fifth column.
    await real.click(titleOf(canvasElement, 'Qty'));
    await expect(headOf(canvasElement, 'Qty')).toHaveAttribute('aria-sort', 'ascending');
    await expect(headOf(canvasElement, 'Qty')).toHaveFocus();
    await real.keyboard('{ArrowDown}');
    await expect(bodyCell(canvasElement, 0, 4)).toHaveFocus();
    await real.click(titleOf(canvasElement, 'Total'));
    await expect(headOf(canvasElement, 'Total')).toHaveFocus();
    await expect(stopsIn(table)).toHaveLength(1);
    await real.tab();
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();

    await real.click(bodyCell(canvasElement, 1, 0).querySelector('input')!);
    await expect(pressWith(real, 'Shift', bodyCell(canvasElement, 3, 2))).resolves.toBe(true);
    await expect(chosen()).toEqual([1, 2, 3]);
    await expect(bodyCell(canvasElement, 3, 2)).toHaveFocus();
    await real.keyboard('{ArrowDown}');
    await expect(bodyCell(canvasElement, 4, 2)).toHaveFocus();
    await real.keyboard('{Shift>} {/Shift}');
    await expect(chosen()).toEqual([1, 2, 3, 4]);
    await expect(window.getSelection()?.toString()).toBe('');
    await expect(stopsIn(table)).toHaveLength(1);
  },
};

/**
 * A focused cell is never under the sticky heading: the frame scrolls it into view with the heading's
 * height as padding, whether the focus comes from the arrows or from Shift+Tab out of the page.
 */
export const FocusUnderHeader: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <button type="button">Before</button>
      <DataGrid
        data={ORDERS}
        rowKey="id"
        columns={COLUMNS}
        height={260}
        paging={false}
        aria-label="Orders"
      />
      <button type="button">After</button>
    </div>
  ),
  play: async ({ canvasElement, canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const table = canvasElement.querySelector('table')!;
    const frame = table.parentElement!;
    await waitFor(() =>
      expect(frame.style.getPropertyValue('--flg-table-head-height')).toMatch(/px$/),
    );
    // The whole of a cell is in the part of the frame the heading leaves: below its bottom, above the
    // frame's own.
    const visible = (cell: HTMLElement) => {
      const box = cell.getBoundingClientRect();
      const top = table.tHead!.getBoundingClientRect().bottom;
      const bottom = frame.getBoundingClientRect().bottom;
      return box.top >= top - 0.5 && box.bottom <= bottom + 0.5;
    };
    await real.tab();
    await real.tab();
    // Down through more rows than the frame shows, then back up: each focused cell is clear of the
    // heading, and the way up is where it would go under it.
    for (let row = 1; row <= 20; row += 1) {
      await real.keyboard('{ArrowDown}');
      await expect(visible(bodyCell(canvasElement, row, 0))).toBe(true);
    }
    await expect(frame.scrollTop).toBeGreaterThan(0);
    for (let row = 19; row >= 0; row -= 1) {
      await real.keyboard('{ArrowUp}');
      await expect(visible(bodyCell(canvasElement, row, 0))).toBe(true);
    }
    await expect(frame.scrollTop).toBe(0);
    // Shift+Tab from after the grid lands on the active cell, wherever the frame is scrolled.
    await real.keyboard('{PageDown}{PageDown}');
    const active = canvasElement.querySelector<HTMLElement>('tbody [tabindex="0"]')!;
    await real.tab();
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();
    frame.scrollTop = 0;
    await real.tab({ shift: true });
    await expect(active).toHaveFocus();
    // The browser scrolls the cell it focused; WebKit does it a frame later.
    await waitFor(() => expect(visible(active)).toBe(true));
  },
};

/**
 * A Select in a cell keeps its own keys: Enter on the cell goes to it, its arrows move through its
 * options and not through the grid, and its Esc closes the list and leaves the focus on it. The next
 * Esc is the grid's, and brings the focus back to the cell.
 */
export const KeysInPopup: Story = {
  tags: ['no-visual'],
  render: () => (
    <DataGrid
      data={ORDERS.slice(0, 5)}
      rowKey="id"
      paging={false}
      aria-label="Orders"
      columns={[
        COLUMNS[0]!,
        {
          id: 'assignee',
          caption: 'Assignee',
          width: 220,
          value: () => 'minh',
          cell: ({ row }) => (
            <Select size="sm" aria-label={`Assignee of ${row.id}`} defaultValue="minh">
              <SelectItem value="minh">Minh</SelectItem>
              <SelectItem value="an">An</SelectItem>
              <SelectItem value="hai">Hai</SelectItem>
            </Select>
          ),
        },
        COLUMNS[2]!,
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await real.tab();
    await real.keyboard('{ArrowDown}{ArrowRight}');
    const cell = bodyCell(canvasElement, 1, 1);
    const trigger = within(cell).getByRole('combobox');
    await expect(cell).toHaveFocus();
    await real.keyboard('{Enter}');
    await expect(trigger).toHaveFocus();
    await real.keyboard('{Enter}');
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    const listbox = cell.querySelector<HTMLElement>('.flg-select-listbox')!;
    await waitFor(() => expect(listbox).toBeVisible());
    const highlighted = () => trigger.getAttribute('aria-activedescendant');
    const first = highlighted();
    await real.keyboard('{ArrowDown}');
    await expect(highlighted()).not.toBe(first);
    // The grid did not take the arrow: the cell is still where it was, and so is the focus.
    await expect(cell).toHaveAttribute('tabindex', '0');
    await expect(trigger).toHaveFocus();
    await real.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    await expect(trigger).toHaveFocus();
    await real.keyboard('{Escape}');
    await expect(cell).toHaveFocus();
    await real.keyboard('{ArrowDown}');
    await expect(bodyCell(canvasElement, 2, 1)).toHaveFocus();
  },
};

const RemovingGrid = () => {
  const [rows, setRows] = useState(ORDERS.slice(0, 4));
  return (
    <DataGrid
      data={rows}
      rowKey="id"
      columns={COLUMNS.slice(0, 3)}
      paging={false}
      aria-label="Orders"
      // Enter on a row takes it away, the way a delete in a row does.
      onRowActivate={(row) => setRows((current) => current.filter((order) => order !== row))}
    />
  );
};

/**
 * The row that has the focus goes, as a delete does: the place moves to the row now at its index (the
 * one before when it was the last, the title when none is left) and the focus follows it, in every
 * engine, instead of falling to the page.
 */
export const RowGoes: Story = {
  tags: ['no-visual'],
  render: () => <RemovingGrid />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await real.tab();
    await real.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}{Enter}');
    // The third row is gone and the one that was the fourth is at its place, with the focus.
    await expect(canvasElement.querySelectorAll('tbody > tr')).toHaveLength(3);
    await expect(bodyCell(canvasElement, 2, 1)).toHaveFocus();
    await expect(bodyCell(canvasElement, 2, 1)).toHaveTextContent(ORDERS[3]!.customer);
    await real.keyboard('{Enter}');
    // It was the last row: the one before it has the focus now, in the same column.
    await expect(canvasElement.querySelectorAll('tbody > tr')).toHaveLength(2);
    await expect(bodyCell(canvasElement, 1, 1)).toHaveFocus();
    await real.keyboard('{Enter}{Enter}');
    // No row of data is left, and the body says so with the one row of an empty grid.
    await expect(canvasElement.querySelectorAll('tbody > tr.flg-data-grid-row')).toHaveLength(0);
    await expect(canvasElement.querySelectorAll('tbody > tr.flg-data-grid-empty')).toHaveLength(1);
    // None is left: the title of the column has it.
    await expect(headOf(canvasElement, 'Customer')).toHaveFocus();
    await expect(stopsIn(canvasElement.querySelector('table')!)).toHaveLength(1);
  },
};

// ---- Choosing rows, and the look of G1 (spec phase 6 §4.1, mockup G1) ------------------------------

interface Sale {
  id: string;
  customer: string;
  assignee: string;
  date: string;
  status: 'processing' | 'delivered' | 'new';
  channel: 'Store' | 'Website' | 'Phone';
  qty: number;
  total: number;
}

function sale(
  id: string,
  customer: string,
  assignee: string,
  date: string,
  status: Sale['status'],
  channel: Sale['channel'],
  qty: number,
  total: number,
): Sale {
  return { id, customer, assignee, date, status, channel, qty, total };
}

const ASSIGNEES: Record<string, string> = {
  'Võ Thị Lan': 'VL',
  'Lê Quang Huy': 'QH',
  'Nguyễn Minh Anh': 'MA',
};

// The mockup's page of twelve rows: three orders newer than the eight it shows, then the eight, then
// one more. The sort is the date, newest first, and then the total, smallest first.
const PAGE_ONE: readonly Sale[] = [
  sale('DH-1035', 'Tạp hóa Hoa Mai', 'Võ Thị Lan', '2026-11-11', 'new', 'Website', 5, 4500000),
  sale(
    'DH-1034',
    'Nhà hàng Sen Vàng',
    'Lê Quang Huy',
    '2026-11-10',
    'delivered',
    'Store',
    9,
    2200000,
  ),
  sale(
    'DH-1033',
    'Công ty An Phát',
    'Nguyễn Minh Anh',
    '2026-11-10',
    'processing',
    'Phone',
    14,
    6800000,
  ),
  sale(
    'DH-1032',
    'Studio Ánh Dương',
    'Võ Thị Lan',
    '2026-11-09',
    'processing',
    'Store',
    8,
    7200000,
  ),
  sale(
    'DH-1031',
    'Đỗ Khánh Linh',
    'Lê Quang Huy',
    '2026-11-08',
    'delivered',
    'Website',
    4,
    3320000,
  ),
  sale(
    'DH-1030',
    'Công ty Thịnh Vượng',
    'Nguyễn Minh Anh',
    '2026-11-07',
    'new',
    'Phone',
    60,
    54000000,
  ),
  sale('DH-1029', 'Hoàng Đức Long', 'Võ Thị Lan', '2026-11-06', 'delivered', 'Store', 3, 2100000),
  sale(
    'DH-1028',
    'Cà phê Sương Sớm',
    'Lê Quang Huy',
    '2026-11-05',
    'processing',
    'Website',
    25,
    9750000,
  ),
  sale(
    'DH-1026',
    'Nhà sách Đông A',
    'Nguyễn Minh Anh',
    '2026-11-04',
    'delivered',
    'Store',
    40,
    32400000,
  ),
  sale('DH-1025', 'Trần Thu Hà', 'Lê Quang Huy', '2026-11-03', 'new', 'Phone', 2, 1250000),
  sale(
    'DH-1024',
    'Công ty Minh Phát',
    'Nguyễn Minh Anh',
    '2026-11-03',
    'processing',
    'Website',
    12,
    18600000,
  ),
  sale(
    'DH-1023',
    'Xưởng gỗ Tân Lập',
    'Võ Thị Lan',
    '2026-11-03',
    'delivered',
    'Store',
    30,
    25500000,
  ),
];

const REST_CUSTOMERS = [
  'Siêu thị Việt Hưng',
  'Quán Trà Chiều',
  'Công ty Hải Âu',
  'Cửa hàng Bình An',
];
const STATUSES = ['delivered', 'processing', 'new'] as const;
const CHANNELS = ['Store', 'Website', 'Phone'] as const;

/** 135 orders in all: the twelve of page one, and 123 older ones made from a formula. */
const SALES: readonly Sale[] = [
  ...PAGE_ONE,
  ...Array.from({ length: 123 }, (_, index) => {
    const day = new Date(Date.UTC(2026, 10, 2 - Math.floor(index / 3)));
    return sale(
      `DH-${1022 - index}`,
      REST_CUSTOMERS[index % REST_CUSTOMERS.length]!,
      Object.keys(ASSIGNEES)[index % 3]!,
      day.toISOString().slice(0, 10),
      STATUSES[index % 3]!,
      CHANNELS[(index + 1) % 3]!,
      1 + ((index * 7) % 30),
      250000 + ((index * 987650) % 40000000),
    );
  }),
];

const BADGES = {
  processing: { variant: 'warning', text: 'Processing' },
  delivered: { variant: 'success', text: 'Delivered' },
  new: { variant: 'accent', text: 'New' },
} as const;

const SALE_COLUMNS: DataGridColumn<Sale>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
  { field: 'customer', caption: 'Customer', width: 248 },
  {
    field: 'assignee',
    caption: 'Assignee',
    width: 220,
    cell: ({ text }) => (
      <span
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, verticalAlign: 'middle' }}
      >
        <Avatar size="sm" alt="" fallback={ASSIGNEES[text]} />
        {text}
      </span>
    ),
  },
  { field: 'date', caption: 'Order date', dataType: 'date', width: 140 },
  {
    field: 'status',
    caption: 'Status',
    width: 160,
    cell: ({ value }) => <Badge variant={BADGES[value].variant}>{BADGES[value].text}</Badge>,
  },
  { field: 'channel', caption: 'Channel', width: 120 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
  {
    field: 'total',
    caption: 'Total',
    dataType: 'number',
    format: { style: 'currency', currency: 'VND' },
    width: 180,
  },
];

/**
 * The first grid of mockup G1: a Card around it, the caption, a frame that shows the header and eight
 * rows, the column of boxes with two rows chosen, the sort (date, newest first, then the total), and
 * the pager. The frame is as wide as the nine columns, 1292px, as it is in the mockup (the card is 1332px with its edge and padding). The mockup draws a scroll without a scrollbar, so the look stories hide the frame's: a classic one would narrow the frame and make it scroll sideways.
 */
const SalesGrid = ({
  variant,
  density,
  height,
  ...more
}: {
  variant: TableVariant;
  density?: DataGridDensity;
  height?: number;
} & Partial<DataGridProps<Sale>>) => (
  <div className="g1-look" style={{ width: 1332 }}>
    <style>{'.g1-look .flg-table-frame { scrollbar-width: none; }'}</style>
    <Card>
      <DataGrid
        data={SALES}
        rowKey="id"
        columns={SALE_COLUMNS}
        caption="Orders"
        description="135 orders · Lumen, November 2026"
        variant={variant}
        density={density}
        height={height}
        locale="vi-VN"
        selectionMode="multiple"
        defaultSort={[
          { field: 'date', direction: 'desc' },
          { field: 'total', direction: 'asc' },
        ]}
        defaultSelectedKeys={['DH-1028', 'DH-1025']}
        paging={{ pageSize: 12, pageSizes: [12, 24, 48] }}
        {...more}
      />
    </Card>
  </div>
);

/**
 * The state of G1: the keyboard focus on DH-1026 · Customer, the row of DH-1030 under the pointer (the
 * harness hovers what has `data-visual-hover`), and the frame scrolled to the rows 4 to 11 of the
 * page. With real input it is reached by keys: Tab into the grid, down to the eleventh row, which
 * scrolls the frame, then up and along. Without it (the visual harness, the Storybook page) the focus
 * and the scroll are set directly.
 */
const lookPlay =
  (variant: TableVariant, density: DataGridDensity): NonNullable<Story['play']> =>
  async ({ canvasElement }) => {
    const table = canvasElement.querySelector('table')!;
    const frame = table.parentElement as HTMLElement;
    const rows = Array.from(table.querySelectorAll<HTMLElement>('tbody > tr'));
    await expect(rows).toHaveLength(12);
    const real = await realUserEvent();
    if (real) {
      await real.tab();
      await real.keyboard('{ArrowDown}'.repeat(10));
      await real.keyboard('{ArrowUp}{ArrowUp}{ArrowRight}{ArrowRight}');
      await expect(bodyCell(canvasElement, 8, 2)).toHaveFocus();
      await expect(bodyCell(canvasElement, 8, 2).matches(':focus-visible')).toBe(true);
    } else {
      bodyCell(canvasElement, 8, 2).focus();
      frame.scrollTop = 3 * rowPitch(ROW_HEIGHT[density][variant], variant);
    }
    await expect(rows[8]).toHaveTextContent('DH-1026');
    await expect(bodyCell(canvasElement, 8, 2)).toHaveTextContent('Nhà sách Đông A');
    rows[5]!.setAttribute('data-visual-hover', '');
    await expect(rows[5]).toHaveTextContent('DH-1030');
    // The frame shows the header and the rows 4 to 11: the row above is under the header, the row
    // below the last is out of sight. A few pixels are allowed: a header is a pixel taller in some
    // engines, and the heights of the stories are those of the pinned Chromium of the baselines.
    const headBottom = table.tHead!.getBoundingClientRect().bottom;
    const frameBottom = frame.getBoundingClientRect().bottom;
    const visible = rows.filter((row) => {
      const box = row.getBoundingClientRect();
      return box.top >= headBottom - 3 && box.bottom <= frameBottom + 3;
    });
    await expect(visible).toEqual(rows.slice(3, 11));
  };

/** G1, the default theme: `lined`, `md`. */
export const GridCore: Story = {
  tags: ['viewport-1440x720'],
  render: () => <SalesGrid variant="lined" height={459} />,
  play: lookPlay('lined', 'standard'),
};

/** The same states in `striped` (Table T2). */
export const GridStriped: Story = {
  tags: ['viewport-1440x720'],
  render: () => <SalesGrid variant="striped" height={457} />,
  play: lookPlay('striped', 'standard'),
};

/** The same states in `minimal` (Table T3). */
export const GridMinimal: Story = {
  tags: ['viewport-1440x720'],
  render: () => <SalesGrid variant="minimal" height={542} />,
  play: lookPlay('minimal', 'standard'),
};

/** The same states in `lined` and `compact`, the `sm` size of Table. */
export const GridCompact: Story = {
  tags: ['viewport-1440x720'],
  render: () => <SalesGrid variant="lined" density="compact" height={374} />,
  play: lookPlay('lined', 'compact'),
};

// Loading and empty are outside the mockups (spec phase 6 §4.3): drawn in G1's frame with the values the
// spec gives. Each story says `loading` itself (an arg of the render, no timer), so the shot is the same
// whenever it is taken. The skeleton pulses without end: GridLoading is shot a second time with the
// motion stopped, as Skeleton's own stories are. The spinner of GridReloading turns without end too,
// and like Spinner's stories it is shot as the harness leaves a running animation, at its start (the
// pass for `reduced-motion` shows what a person who asked for less motion sees, and the spinner still
// turns then, only slower, so it has no pass of its own).

/** The first load: the heading of GridCore over a page of 12 skeleton rows of the height of a row. */
export const GridLoading: Story = {
  tags: ['viewport-1440x720', 'reduced-motion'],
  render: () => (
    <SalesGrid
      variant="lined"
      data={[]}
      loading
      defaultSelectedKeys={[]}
      description="Loading orders · Lumen, November 2026"
    />
  ),
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector('table')!;
    const rows = Array.from(table.querySelectorAll<HTMLElement>('tbody > tr'));
    await expect(rows).toHaveLength(12);
    await expect(table).toHaveAttribute('aria-busy', 'true');
    // A row of skeleton is as tall as a row of data: the 41px of the table of spec 4.3 (lined, md).
    for (const row of rows) {
      await expect(row.offsetHeight).toBe(rowPitch(ROW_HEIGHT.standard.lined, 'lined'));
      await expect(row.getAttribute('aria-hidden')).toBe('true');
    }
    await expect(canvasElement.querySelector('.flg-data-grid-pager')).toBeNull();
  },
};

/** Loading again: GridCore as it is, under a wash with a spinner from the bottom of the heading. */
export const GridReloading: Story = {
  tags: ['viewport-1440x720'],
  render: () => <SalesGrid variant="lined" height={459} loading />,
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector('table')!;
    const layer = canvasElement.querySelector<HTMLElement>('.flg-data-grid-overlay')!;
    await expect(table).toHaveAttribute('aria-busy', 'true');
    await expect(table.querySelectorAll('tbody > tr.flg-data-grid-row')).toHaveLength(12);
    // It starts where the heading ends, and ends with the frame.
    const frame = table.parentElement as HTMLElement;
    const head = table.tHead!.getBoundingClientRect();
    await expect(Math.abs(layer.getBoundingClientRect().top - head.bottom)).toBeLessThanOrEqual(1);
    await expect(
      Math.abs(layer.getBoundingClientRect().bottom - frame.getBoundingClientRect().bottom),
    ).toBeLessThanOrEqual(1);
  },
};

/** No rows and not loading: one cell across the nine columns, with the words. */
export const GridEmpty: Story = {
  tags: ['viewport-1440x720'],
  render: () => (
    <SalesGrid
      variant="lined"
      data={[]}
      defaultSelectedKeys={[]}
      description="0 orders · Lumen, November 2026"
    />
  ),
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector('table')!;
    const cells = table.querySelectorAll('tbody > tr.flg-data-grid-empty > td');
    await expect(cells).toHaveLength(1);
    // The nine columns, and the filler column of a grid whose columns all have a width.
    await expect(cells[0]).toHaveAttribute('colspan', '10');
    await expect(cells[0]).toHaveTextContent('No data');
    await expect(canvasElement.querySelector('.flg-data-grid-pager')).toBeNull();
  },
};

const SelectingGrid = () => (
  <DataGrid
    data={ORDERS.slice(0, 12)}
    rowKey="id"
    columns={COLUMNS}
    caption="Orders"
    paging={false}
    selectionMode="multiple"
  />
);

/**
 * Choosing rows with real input, in every engine: the box chooses and a press on the row does not
 * (`selectOnRowClick` is off); a Shift press on a box or on a row adds the range from the last row chosen
 * by a plain press, and leaves no text selected, since the `mousedown` is cancelled; Space on a box
 * chooses once (the key is cancelled, so the browser does not press the box as well); Shift+Space adds a range; Ctrl+A chooses every row and does not select the page.
 */
export const Selecting: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  render: () => <SelectingGrid />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const table = canvasElement.querySelector('table')!;
    const boxAt = (row: number) => bodyCell(canvasElement, row, 0).querySelector('input')!;
    const chosen = () =>
      Array.from(table.querySelectorAll('tbody > tr')).flatMap((row, index) =>
        row.getAttribute('aria-selected') === 'true' ? [index] : [],
      );
    const headBox = table.querySelector<HTMLInputElement>('thead input')!;

    await real.click(bodyCell(canvasElement, 0, 2));
    await expect(chosen()).toEqual([]);
    await real.click(boxAt(1));
    await expect(chosen()).toEqual([1]);
    await expect(headBox.indeterminate).toBe(true);

    // A caret is in the table; Shift with a press on something else would extend a selection from it.
    await expect(pressWith(real, 'Shift', boxAt(4))).resolves.toBe(true);
    await expect(chosen()).toEqual([1, 2, 3, 4]);
    await expect(window.getSelection()?.toString()).toBe('');
    await expect(pressWith(real, 'Shift', bodyCell(canvasElement, 6, 2))).resolves.toBe(true);
    await expect(chosen()).toEqual([1, 2, 3, 4, 5, 6]);
    await expect(window.getSelection()?.toString()).toBe('');

    // A plain press on a box is left alone, and once is once.
    await expect(cancelledMouseDown(() => real.click(boxAt(8)))).resolves.toBe(false);
    await expect(chosen()).toEqual([1, 2, 3, 4, 5, 6, 8]);
    boxAt(8).focus();
    await real.keyboard(' ');
    await expect(chosen()).toEqual([1, 2, 3, 4, 5, 6]);
    await real.keyboard(' ');
    await expect(chosen()).toEqual([1, 2, 3, 4, 5, 6, 8]);

    // Shift+Space from the row of the last Space adds the range to the row that has the focus.
    boxAt(10).focus();
    await real.keyboard('{Shift>} {/Shift}');
    await expect(chosen()).toEqual([1, 2, 3, 4, 5, 6, 8, 9, 10]);

    await real.keyboard('{Control>}a{/Control}');
    await expect(chosen()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    await expect(headBox.checked).toBe(true);
    await expect(window.getSelection()?.toString()).toBe('');
  },
};

// Virtual scrolling (spec phase 6 §3.7): measured here in each engine, since the window multiplies a
// pitch and a layout fact is not for jsdom.

/** Ten thousand orders from the same formula. */
const BIG = makeOrders(10000);

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
/** Two frames: the scroll event, and the animation frame that applies it. */
const afterScroll = async () => {
  await nextFrame();
  await nextFrame();
};
const rowsOfBody = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLTableRowElement>('tbody > .flg-data-grid-row'));
const rowIndex = (row: Element) => Number(row.getAttribute('aria-rowindex'));
/** Whether a row is in the part of its frame that the heading leaves. */
const inView = (row: HTMLElement, table: HTMLElement, frame: HTMLElement): boolean => {
  const box = row.getBoundingClientRect();
  return (
    box.top >= table.querySelector('thead')!.getBoundingClientRect().bottom - 0.5 &&
    box.bottom <= frame.getBoundingClientRect().bottom + 0.5
  );
};

const VirtualGrids = () => (
  <div style={{ display: 'grid', gap: 16 }}>
    {VARIANTS.map((variant) => (
      <DataGrid
        key={variant}
        data={BIG}
        rowKey="id"
        columns={COLUMNS}
        variant={variant}
        height={360}
        scrolling="virtual"
        aria-label={variant}
        data-testid={variant}
      />
    ))}
  </div>
);

/**
 * Ten thousand rows in three looks. The DOM holds the rows that are seen, 6 more on each side and
 * the row of the keyboard, wherever the frame is scrolled; the rows are where the whole list would
 * put them, which is the pitch measured against the stylesheet's, across the spacers; mod+End goes
 * to the last row, `aria-rowindex` 10001; and the focus never leaves the grid while the frame is
 * scrolled far from it and back.
 */
export const Virtual10000: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  render: () => <VirtualGrids />,
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    for (const variant of VARIANTS) {
      const grid = canvas.getByTestId(variant);
      const table = grid.querySelector('table')!;
      const frame = table.parentElement!;
      const pitch = rowPitch(ROW_HEIGHT.standard[variant], variant);
      await expect(table).toHaveAttribute('aria-rowcount', '10001');
      // The most the DOM holds: what is seen, the overscan on each side, and the row of the keyboard.
      const most = Math.ceil(frame.clientHeight / pitch) + 2 * 6 + 1;
      const scrollTo = async (top: number) => {
        frame.scrollTop = top;
        await afterScroll();
      };
      for (const top of [0, 5000 * pitch, frame.scrollHeight]) {
        await scrollTo(top);
        const rows = rowsOfBody(grid);
        await expect(rows.length, `${variant} at ${top}`).toBeLessThanOrEqual(most);
        await expect(rows.length).toBeGreaterThan(5);
      }

      // In the middle, the row of the keyboard (the first, kept) and a row of the window are as far
      // apart as the list puts them: the spacers between are as tall as the rows they stand for.
      await scrollTo(5000 * pitch);
      const rows = rowsOfBody(grid);
      await expect(rowIndex(rows[0]!)).toBe(2);
      const far = rows[rows.length - 1]!;
      await expect(far.offsetTop - rows[0]!.offsetTop, variant).toBe((rowIndex(far) - 2) * pitch);
      await expect(rows[2]!.offsetTop - rows[1]!.offsetTop, `${variant} pitch`).toBe(pitch);
      for (const spacer of grid.querySelectorAll<HTMLElement>('.flg-data-grid-spacer')) {
        await expect(spacer.offsetHeight).toBeGreaterThan(0);
      }
      await scrollTo(0);
    }
    if (!real) return;

    const grid = canvas.getByTestId('lined');
    const table = grid.querySelector('table')!;
    const frame = table.parentElement!;
    const pitch = ROW_HEIGHT.standard.lined;
    await real.click(rowsOfBody(grid)[2]!.children[1]!);
    const focused = document.activeElement as HTMLElement;
    await expect(focused.closest('tr')).toHaveAttribute('aria-rowindex', '4');
    // Far from the row and back: it stays in the DOM and keeps the focus the whole way.
    for (const top of [3000 * pitch, 9000 * pitch, 400 * pitch, 0]) {
      frame.scrollTop = top;
      await afterScroll();
      await expect(focused).toHaveFocus();
      await expect(focused.isConnected).toBe(true);
    }
    // A grid in a popover may close when the focus leaves it, so the focus never goes anywhere but
    // another cell of the grid during a move: no `focusout` to the page, or out of the grid.
    const leaving: string[] = [];
    grid.addEventListener('focusout', (event) => {
      const next = event.relatedTarget;
      if (!(next instanceof Node) || !grid.contains(next)) leaving.push('focusout');
    });
    // mod+End: the last row is drawn and has the focus.
    await real.keyboard('{Control>}{End}{/Control}');
    const last = document.activeElement as HTMLElement;
    await expect(last.closest('tr')).toHaveAttribute('aria-rowindex', '10001');
    await waitFor(() => expect(inView(last.closest('tr')!, table, frame)).toBe(true));
    // The row it left is gone once the move has settled.
    await waitFor(() => expect(table.querySelector('tbody > [aria-rowindex="4"]')).toBeNull());
    await real.keyboard('{Control>}{Home}{/Control}');
    await expect(document.activeElement!.closest('tr')).toHaveAttribute('aria-rowindex', '2');
    await waitFor(() => expect(table.querySelector('tbody > [aria-rowindex="10001"]')).toBeNull());
    // PageDown past what is drawn: scroll far away, then press it.
    frame.scrollTop = 6000 * pitch;
    await afterScroll();
    await real.keyboard('{PageDown}');
    // The frame shows 7 or 8 rows under the heading: the focus went down that many, from row 2.
    const paged = Number(document.activeElement!.closest('tr')!.getAttribute('aria-rowindex'));
    await expect(paged).toBeGreaterThan(6);
    await expect(paged).toBeLessThan(13);
    await waitFor(() => expect(table.querySelector('tbody > [aria-rowindex="2"]')).toBeNull());
    await expect(leaving).toEqual([]);
    await expect(table.querySelectorAll('tbody [tabindex="0"]')).toHaveLength(1);
  },
};

const ScrollingGrids = () => {
  const virtualRef = useRef<DataGridHandle>(null);
  const pagedRef = useRef<DataGridHandle>(null);
  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
      <button type="button" onClick={() => virtualRef.current?.scrollToRow('DH-600')}>
        Virtual to DH-600
      </button>
      <button type="button" onClick={() => virtualRef.current?.scrollToRow('DH-101')}>
        Virtual to DH-101
      </button>
      <DataGrid
        ref={virtualRef}
        data={makeOrders(1000)}
        rowKey="id"
        columns={COLUMNS}
        height={300}
        scrolling="virtual"
        aria-label="Virtual"
        data-testid="virtual"
      />
      <button type="button" onClick={() => pagedRef.current?.scrollToRow('DH-1005')}>
        Paged to DH-1005
      </button>
      <DataGrid
        ref={pagedRef}
        data={makeOrders(100)}
        rowKey="id"
        columns={COLUMNS}
        height={300}
        paging={{ pageSize: 20 }}
        aria-label="Paged"
        data-testid="paged"
      />
    </div>
  );
};

/**
 * `scrollToRow` brings a row into view the least it takes, to the page of the row first when the grid
 * has pages, and leaves the keyboard where it is (the button keeps the focus).
 */
export const ScrollToRow: Story = {
  tags: ['no-visual'],
  render: () => <ScrollingGrids />,
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const virtual = canvas.getByTestId('virtual');
    const virtualTable = virtual.querySelector('table')!;
    const virtualFrame = virtualTable.parentElement!;
    const target = (grid: HTMLElement, id: string) =>
      rowsOfBody(grid).find((row) => row.cells[0]!.textContent === id);

    // DH-600 is the 501st order: the frame goes down to it.
    const toRow = canvas.getByRole('button', { name: 'Virtual to DH-600' });
    // The button is pressed with the keyboard: Safari does not focus a button it is clicked.
    toRow.focus();
    await real.keyboard('{Enter}');
    await waitFor(() => expect(target(virtual, 'DH-600')).toBeDefined());
    await waitFor(() =>
      expect(inView(target(virtual, 'DH-600')!, virtualTable, virtualFrame)).toBe(true),
    );
    await expect(toRow).toHaveFocus();

    // DH-101 is the 1000th: the end of the list, under the heading and above the frame's bottom.
    await real.click(canvas.getByRole('button', { name: 'Virtual to DH-101' }));
    await waitFor(() => expect(target(virtual, 'DH-101')).toBeDefined());
    await waitFor(() =>
      expect(inView(target(virtual, 'DH-101')!, virtualTable, virtualFrame)).toBe(true),
    );

    // DH-1005 is the 96th of 100: the page of rows 81 to 100.
    const paged = canvas.getByTestId('paged');
    await real.click(canvas.getByRole('button', { name: 'Paged to DH-1005' }));
    await waitFor(() => expect(target(paged, 'DH-1005')).toBeDefined());
    await expect(paged.querySelector('.flg-data-grid-page-info')).toHaveTextContent(
      '81–100 of 100',
    );
    await waitFor(() =>
      expect(
        inView(
          target(paged, 'DH-1005')!,
          paged.querySelector('table')!,
          paged.querySelector('table')!.parentElement!,
        ),
      ).toBe(true),
    );
  },
};

const ReloadGrids = () => (
  <div style={{ display: 'grid', gap: 40, width: 720 }}>
    {VARIANTS.map((variant) => (
      <DataGrid
        key={variant}
        data={ORDERS}
        rowKey="id"
        columns={COLUMNS}
        variant={variant}
        height={300}
        loading
        selectionMode="single"
        // Three grids on a page: each names its pages, as the docs say a grid with no caption must.
        labels={{ pagination: `Pagination of ${variant}` }}
        aria-label={variant}
        data-testid={variant}
      />
    ))}
  </div>
);

/**
 * The layer over a grid that loads again, in each look: it starts at the bottom of the heading (the
 * measured one: a `striped` frame is pulled up over its padding and a `lined` one has an edge, so
 * the offsets differ), it stays over the body when the frame scrolls and is not moved by it, it takes
 * no pointer (a wheel and a press go to the frame and the cells under it), and it does not reach the
 * heading or the pager.
 */
export const ReloadOverlay: Story = {
  tags: ['no-visual'],
  render: () => <ReloadGrids />,
  play: async ({ canvasElement, canvas }) => {
    await expect(canvasElement.querySelectorAll('.flg-data-grid')).toHaveLength(3);
    const real = await realUserEvent();
    for (const variant of VARIANTS) {
      const grid = canvas.getByTestId(variant);
      // A point is only found on the page when it is in the window.
      grid.scrollIntoView({ block: 'center' });
      const frame = grid.querySelector<HTMLElement>('.flg-data-grid-frame')!;
      const head = grid.querySelector<HTMLElement>('thead')!;
      const layer = grid.querySelector<HTMLElement>('.flg-data-grid-overlay')!;
      await expect(layer, variant).not.toBeNull();
      // The top is measured by the grid after it mounts.
      await waitFor(() =>
        expect(
          Math.abs(layer.getBoundingClientRect().top - head.getBoundingClientRect().bottom),
          `${variant}: the layer starts at the heading`,
        ).toBeLessThanOrEqual(1),
      );
      const before = layer.getBoundingClientRect();
      await expect(layer.getBoundingClientRect().height, variant).toBeGreaterThan(100);

      // The rows scroll under it, the heading stays, and the layer does not move.
      await expect(frame.scrollHeight, variant).toBeGreaterThan(frame.clientHeight + 100);
      frame.scrollTop = 150;
      await waitFor(() => expect(frame.scrollTop, variant).toBeGreaterThan(100));
      const after = layer.getBoundingClientRect();
      await expect(
        [after.top, after.bottom, after.left, after.right].map(Math.round),
        variant,
      ).toEqual([before.top, before.bottom, before.left, before.right].map(Math.round));
      // The heading of a `striped` or `minimal` frame sticks higher than it rests: Table pulls it up over
      // the frame's padding (6px) so that no row shows above it, and its table has 2px of spacing above
      // the heading. The layer is where it rested, so a strip of that height of the first row seen is
      // under no layer. A `lined` one sticks where it rests.
      const gap = after.top - head.getBoundingClientRect().bottom;
      await expect(gap, variant).toBeGreaterThanOrEqual(-1);
      await expect(gap, variant).toBeLessThanOrEqual(variant === 'lined' ? 1 : 9);

      // The layer is only to look at: it takes no pointer, so what is under it is reached. A point on a
      // row, and the middle of the layer, belong to the frame's content: a wheel there scrolls the
      // frame (the browser scrolls the element under the pointer), and a press is a press on the cell.
      const row = Array.from(grid.querySelectorAll<HTMLTableRowElement>('tbody > tr')).find(
        (candidate) => {
          const box = candidate.getBoundingClientRect();
          return box.top > after.top + 10 && box.bottom < after.bottom - 10;
        },
      )!;
      const box = row.getBoundingClientRect();
      const middle = layer.getBoundingClientRect();
      for (const [x, y] of [
        [box.left + 40, box.top + box.height / 2],
        [middle.left + middle.width / 2, middle.top + middle.height / 2],
      ] as const) {
        const hit = document.elementFromPoint(x, y);
        await expect(frame.contains(hit), `${variant}: the frame is under the pointer`).toBe(true);
        await expect(layer.contains(hit), `${variant}: the layer is not`).toBe(false);
      }
      // A real press on a cell under the layer makes it the active cell (the runner refuses to click
      // an element that something else covers, so this is the proof as well).
      if (real) {
        const cell = row.cells[1]!;
        await real.click(cell);
        await waitFor(() => expect(cell, variant).toHaveFocus());
        await expect(cell, variant).toHaveAttribute('tabindex', '0');
        await expect(grid.querySelectorAll('[tabindex="0"]'), variant).toHaveLength(1);
      }

      // The heading and the pages are not under it.
      const sort = head.querySelector<HTMLElement>('button')!;
      const sortBox = sort.getBoundingClientRect();
      await expect(
        sort.contains(
          document.elementFromPoint(sortBox.left + 4, sortBox.top + sortBox.height / 2),
        ),
        `${variant}: the heading is not covered`,
      ).toBe(true);
      const pager = grid.querySelector<HTMLElement>('.flg-data-grid-pager')!;
      const pagerBox = pager.getBoundingClientRect();
      await expect(
        pager.contains(
          document.elementFromPoint(pagerBox.left + 4, pagerBox.top + pagerBox.height / 2),
        ),
        `${variant}: the pager is not covered`,
      ).toBe(true);
    }
  },
};

const LoadingGrids = () => (
  <div style={{ display: 'grid', gap: 24, width: 760 }}>
    {VARIANTS.map((variant) => (
      <div key={variant} style={{ display: 'grid', gap: 12 }}>
        <DataGrid
          data={ORDERS.slice(0, 3)}
          rowKey="id"
          columns={COLUMNS}
          variant={variant}
          paging={false}
          aria-label={`${variant} rows`}
          data-testid={`${variant}-rows`}
        />
        <DataGrid
          data={[]}
          loading
          rowKey="id"
          columns={COLUMNS}
          variant={variant}
          paging={{ pageSize: 3 }}
          aria-label={`${variant} loading`}
          data-testid={`${variant}-loading`}
        />
        <DataGrid
          data={[]}
          rowKey="id"
          columns={COLUMNS}
          variant={variant}
          aria-label={`${variant} empty`}
          data-testid={`${variant}-empty`}
        />
      </div>
    ))}
  </div>
);

/**
 * The three states of a grid with no row yet, in each look: loading draws a page of skeleton rows
 * that are as far apart as rows of data (a `striped` table has 2px between rows, which the skeleton
 * rows have too), and an empty grid draws its words in one row.
 */
export const LoadingStates: Story = {
  tags: ['no-visual'],
  render: () => <LoadingGrids />,
  play: async ({ canvas }) => {
    for (const variant of VARIANTS) {
      const pitchOf = (rows: Element[]) =>
        (rows[1] as HTMLElement).offsetTop - (rows[0] as HTMLElement).offsetTop;
      const data = Array.from(
        canvas.getByTestId(`${variant}-rows`).querySelectorAll('tbody > tr.flg-data-grid-row'),
      );
      const skeleton = Array.from(
        canvas
          .getByTestId(`${variant}-loading`)
          .querySelectorAll('tbody > tr.flg-data-grid-skeleton-row'),
      );
      await expect(data, variant).toHaveLength(3);
      await expect(skeleton, variant).toHaveLength(3);
      await expect(pitchOf(skeleton), variant).toBe(pitchOf(data));
      await expect(pitchOf(skeleton), variant).toBe(
        rowPitch(ROW_HEIGHT.standard[variant], variant),
      );
      const empty = canvas.getByTestId(`${variant}-empty`);
      await expect(empty.querySelectorAll('tbody > tr'), variant).toHaveLength(1);
      await expect(empty.querySelector('.flg-data-grid-pager'), variant).toBeNull();
    }
  },
};

const EmptyWide = () => (
  <div style={{ width: 480 }}>
    <DataGrid
      data={[]}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      description="Nothing to show"
      data-testid="empty-wide"
    />
  </div>
);

/**
 * An empty grid whose columns are wider than its frame: the words are as wide as what the frame shows
 * and stay at its left edge when the frame is scrolled sideways, so they are never off to one side.
 */
export const EmptyScrolled: Story = {
  tags: ['no-visual'],
  render: () => <EmptyWide />,
  play: async ({ canvas }) => {
    const grid = canvas.getByTestId('empty-wide');
    const frame = grid.querySelector<HTMLElement>('.flg-data-grid-frame')!;
    const words = grid.querySelector<HTMLElement>('.flg-data-grid-empty-content')!;
    await expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth + 100);
    // It is measured after the first render: the words are as wide as the frame shows.
    await waitFor(() => expect(words.offsetWidth).toBe(frame.clientWidth));
    const edge = () => words.getBoundingClientRect().left - frame.getBoundingClientRect().left;
    await expect(Math.abs(edge() - frame.clientLeft)).toBeLessThan(1);
    frame.scrollLeft = 200;
    await waitFor(() => expect(frame.scrollLeft).toBeGreaterThan(150));
    await expect(Math.abs(edge() - frame.clientLeft)).toBeLessThan(1);
    // And they are all in view: the right edge of the words is the right edge of what the frame shows.
    await expect(
      Math.abs(words.getBoundingClientRect().right - frame.getBoundingClientRect().right),
    ).toBeLessThan(frame.offsetWidth - frame.clientWidth + 2);
  },
};
