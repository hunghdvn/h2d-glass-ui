import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import {
  bodyCell,
  lookPlay,
  noTitleIsCut,
  PAGE_ONE,
  SalesGrid,
  SALES,
  SALE_COLUMNS,
} from '../../../.storybook/data-grid-orders';
import type { Sale } from '../../../.storybook/data-grid-orders';
import { onPlatform } from '../../../.storybook/platform';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import type { RealUserEvent } from '../../../.storybook/real-input';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridColumnLayout, DataGridHandle, DataGridProps } from './index';

const meta = {
  title: 'Components/DataGrid/Columns',
  component: DataGrid,
  // Built but not released until the grid is exported (spec phase 6 §2): hidden from the sidebar of
  // the built docs, still run by the story tests and shot by the visual harness.
  tags: ['unreleased'],
  args: { data: SALES, rowKey: 'id', columns: SALE_COLUMNS, 'aria-label': 'Orders' },
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'region', enabled: false }],
      },
    },
  },
} satisfies Meta<DataGridProps<Sale>>;

export default meta;
type Story = StoryObj<DataGridProps<Sale>>;

/** Two animation frames: a scroll event is delivered, and what listens to it has written, by then. */
const frames = async () => {
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

/**
 * How long a story waits for the grid to hear a scroll it made. The engine delivers the event in its
 * next rendering update, and Linux WebKit on x86 paints the three pinned grids slowly (12 s for the
 * story in CI): the first scroll of a grid had moved the frame but brought no scroll event within the
 * second that `waitFor` waits by default (CI on PR #43, and a 1-CPU x86 machine), and it came within
 * five. The message says where the frame was and how many scroll events came, so a late event can be
 * told from a missing one.
 */
const SCROLL_EVENT = { timeout: 5000 };

const frameOf = (grid: HTMLElement) =>
  grid.closest('.flg-data-grid')!.querySelector<HTMLElement>('.flg-data-grid-frame')!;
const tableOf = (grid: HTMLElement) => grid.querySelector<HTMLTableElement>('table[role="grid"]')!;

/** The sides of a box as distances from the inside of the frame (its border is not part of what scrolls). */
function boxIn(frame: HTMLElement, element: Element) {
  const outer = frame.getBoundingClientRect();
  const box = element.getBoundingClientRect();
  const left = outer.left + frame.clientLeft;
  const top = outer.top + frame.clientTop;
  return {
    left: box.left - left,
    right: box.right - left,
    top: box.top - top,
    bottom: box.bottom - top,
  };
}

/** The colour that the grid says is solid, as the browser computes it. */
const solid = (frame: HTMLElement) => {
  const probe = document.createElement('div');
  probe.style.backgroundColor = 'var(--flg-data-grid-pin-bg)';
  frame.append(probe);
  const colour = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return colour;
};

/** Whether the element at the middle of `cell` is the cell, or something in it. */
const hitsItself = (cell: Element) => {
  const box = cell.getBoundingClientRect();
  const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
  return hit !== null && (hit === cell || cell.contains(hit));
};

/** The grids of the pinned stories: the frame is narrower than the columns, and has a height. */
const PinnedGrid = ({
  variant,
  label,
  rows = 30,
  height = 260,
}: {
  variant: 'lined' | 'striped' | 'minimal';
  label: string;
  rows?: number;
  height?: number;
}) => (
  <div style={{ width: 640, marginBottom: 12 }}>
    <DataGrid
      aria-label={label}
      data-testid={label}
      data={SALES.slice(0, rows)}
      rowKey="id"
      columns={SALE_COLUMNS}
      variant={variant}
      height={height}
      paging={false}
      selectionMode="multiple"
      defaultColumnLayout={{ pinned: { id: 'left', total: 'right' } }}
    />
  </div>
);

/**
 * Pinned columns in each look: the box column and Order stick to the left and Total to the right while
 * the frame scrolls both ways. Layout, sticking and what is under the pointer are facts of a layout
 * engine, so they are measured in each engine and not read from the stylesheet: a pinned cell stays
 * where it is, is the one under the pointer (not the cell that scrolled beneath), is solid only on a side
 * that has been scrolled, and the titles stay over it. The 6px of padding a `striped` or `minimal`
 * frame has shows no strip of scrolled cells beside a zone.
 */
export const PinnedColumns: Story = {
  tags: ['no-visual'],
  render: () => (
    <>
      <PinnedGrid variant="lined" label="Lined" />
      <PinnedGrid variant="striped" label="Striped" />
      <PinnedGrid variant="minimal" label="Minimal" />
    </>
  ),
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    for (const label of ['Lined', 'Striped', 'Minimal']) {
      const grid = canvasElement.querySelector<HTMLElement>(`[data-testid="${label}"]`)!;
      const wrapper = grid.closest<HTMLElement>('.flg-data-grid')!;
      wrapper.scrollIntoView({ block: 'center' });
      // The rows are read at rest: the pointer a story before this one left where the scroll brings a
      // row would give that row its hover wash, so it is taken off the grid first.
      await real?.unhover(wrapper);
      const frame = frameOf(wrapper);
      const table = tableOf(wrapper);
      await waitFor(() => expect(frame.clientHeight).toBeGreaterThan(100));
      const inset = Number.parseFloat(
        getComputedStyle(frame).getPropertyValue('--flg-data-grid-pin-inset'),
      );
      await expect(inset).toBe(label === 'Lined' ? 0 : 6);
      // The table is wider than the frame, so there is something to scroll both ways.
      await expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth + 400);
      await expect(frame.scrollHeight).toBeGreaterThan(frame.clientHeight + 200);

      const heading = table.tHead!.rows[0]!;
      // A row with no stripe, so a cell of it has no background of its own at rest.
      const row = table.tBodies[0]!.rows[1]!;
      // The cells: the box column, Order and Customer... and Total, with the filler before the right zone
      // (there is none: the columns do not fit, so the table is as wide as they are).
      const cells = (from: HTMLTableRowElement) => Array.from(from.cells);
      const box = cells(row)[0]!;
      const order = cells(row)[1]!;
      const customer = cells(row)[2]!;
      const total = cells(row).at(-1)!;
      await expect(box).toHaveAttribute('data-pinned', 'left');
      await expect(order).toHaveAttribute('data-pin-edge');
      await expect(total).toHaveAttribute('data-pinned', 'right');
      const pinnedTitles = cells(heading).filter((cell) => cell.hasAttribute('data-pinned'));
      await expect(pinnedTitles).toHaveLength(3);

      // At rest: nothing is scrolled to the left, the right zone has the columns under it.
      frame.scrollLeft = 0;
      frame.scrollTop = 0;
      await frames();
      const rest = {
        box: boxIn(frame, box),
        order: boxIn(frame, order),
        total: boxIn(frame, total),
      };
      await expect(frame).not.toHaveAttribute('data-scrolled-left');
      await expect(frame).toHaveAttribute('data-scrolled-right');
      await expect(getComputedStyle(box).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      await expect(getComputedStyle(order).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      await expect(getComputedStyle(total).backgroundColor).toBe(solid(frame));
      // The right zone ends at the edge of what the frame shows, whatever the padding.
      await expect(rest.total.right).toBeCloseTo(frame.clientWidth, 0);

      // Scrolled sideways and down: each pinned cell is where it was (the left zone has moved the
      // inset of a padded frame, which the offsets take back), and is the one under the pointer.
      let scrolls = 0;
      frame.addEventListener('scroll', () => (scrolls += 1), { passive: true });
      for (const [left, top] of [
        [200, 0],
        [200, 90],
        [500, 90],
      ] as const) {
        frame.scrollLeft = left;
        frame.scrollTop = top;
        // A plain matcher, which prints its message (jest-dom's `toHaveAttribute` drops it).
        await waitFor(
          () =>
            expect(
              frame.hasAttribute('data-scrolled-left'),
              `${label} at ${left},${top}: data-scrolled-left (scrollLeft ${frame.scrollLeft} of ${frame.scrollWidth - frame.clientWidth}, ${scrolls} scroll events)`,
            ).toBe(true),
          SCROLL_EVENT,
        );
        await frames();
        await expect(Math.abs(frame.scrollLeft - left)).toBeLessThan(1);
        const at = (cell: HTMLElement) => boxIn(frame, cell);
        await expect(at(box).left).toBeCloseTo(rest.box.left - inset, 0);
        await expect(at(order).left).toBeCloseTo(rest.order.left - inset, 0);
        await expect(at(total).right).toBeCloseTo(rest.total.right, 0);
        // The cell of the middle has gone under the zone.
        await expect(at(customer).left).toBeLessThan(at(order).right);
        // A pinned cell is the one under the pointer, in the part of the frame it is in view.
        for (const cell of [box, order, total]) {
          const where = at(cell);
          if (where.top >= 0 && where.bottom <= frame.clientHeight) {
            await expect(hitsItself(cell)).toBe(true);
          }
        }
        // Solid, and the same colour as the heading's solid, on the side that is scrolled.
        await expect(getComputedStyle(box).backgroundColor).toBe(solid(frame));
        await expect(getComputedStyle(order).backgroundColor).toBe(solid(frame));
        await expect(getComputedStyle(total).backgroundColor).toBe(solid(frame));
        // The titles stay where they were, and over the pinned cells that scrolled up under them.
        // They are in the row of the other titles, which stick to the top of the frame under the heading.
        const plain = boxIn(frame, cells(heading)[3]!);
        for (const title of pinnedTitles) {
          await expect(boxIn(frame, title).top).toBeCloseTo(plain.top, 0);
          await expect(hitsItself(title)).toBe(true);
        }
        // A heading that has been scrolled past sticks at the top of what the frame shows.
        if (top > 0) await expect(plain.top).toBeLessThan(3);
        const titleBox = boxIn(frame, pinnedTitles[1]!);
        await expect(titleBox.left).toBeCloseTo(rest.order.left - inset, 0);
        // No strip of the cells that scrolled beside a zone: at the left edge of what the frame shows
        // and at the right edge, below the heading, the pinned cell is the one hit.
        const outer = frame.getBoundingClientRect();
        const midY = outer.top + frame.clientTop + frame.clientHeight - 20;
        const hitLeft = document.elementFromPoint(outer.left + frame.clientLeft + 1, midY);
        await expect(hitLeft?.closest('[data-pinned="left"]')).not.toBeNull();
        const hitRight = document.elementFromPoint(
          outer.left + frame.clientLeft + frame.clientWidth - 2,
          midY,
        );
        await expect(hitRight?.closest('[data-pinned="right"]')).not.toBeNull();
      }

      // At the right end the right zone has nothing under it any more, and is transparent again.
      frame.scrollLeft = frame.scrollWidth;
      await waitFor(() => expect(frame).not.toHaveAttribute('data-scrolled-right'), SCROLL_EVENT);
      await expect(getComputedStyle(total).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      await expect(getComputedStyle(order).backgroundColor).toBe(solid(frame));
      await expect(frame).toHaveAttribute('data-scrolled-left');
    }
  },
};

/**
 * The shadow beside the edge of a zone: it is as tall as the part of the table the frame shows, and
 * never reaches below the last row into the empty part of a frame with a height. It is drawn only on a
 * side that is scrolled, and takes no press.
 */
export const PinnedShadow: Story = {
  tags: ['no-visual'],
  render: () => (
    <>
      <PinnedGrid variant="lined" label="Tall" />
      <PinnedGrid variant="lined" label="Short" rows={3} height={360} />
    </>
  ),
  play: async ({ canvasElement }) => {
    const shadow = (frame: HTMLElement, side: 'left' | 'right') => {
      const title = frame.querySelector<HTMLElement>(
        `thead [data-pinned="${side}"][data-pin-edge]`,
      )!;
      return { title, style: getComputedStyle(title, '::after') };
    };
    for (const label of ['Tall', 'Short']) {
      const wrapper = canvasElement
        .querySelector<HTMLElement>(`[data-testid="${label}"]`)!
        .closest<HTMLElement>('.flg-data-grid')!;
      wrapper.scrollIntoView({ block: 'center' });
      const frame = frameOf(wrapper);
      const table = tableOf(wrapper);
      await waitFor(() => expect(frame.clientHeight).toBeGreaterThan(100));
      frame.scrollLeft = 0;
      await frames();
      // At rest only the right side is scrolled: no shadow on the left.
      await expect(shadow(frame, 'left').style.content).toBe('none');
      await expect(shadow(frame, 'right').style.content).not.toBe('none');
      frame.scrollLeft = 200;
      await waitFor(() => expect(frame).toHaveAttribute('data-scrolled-left'));
      await frames();
      const left = shadow(frame, 'left');
      await expect(left.style.content).not.toBe('none');
      await expect(left.style.width).toBe('14px');
      await expect(left.style.pointerEvents).toBe('none');
      await expect(left.style.backgroundImage).toContain('linear-gradient');
      const height = Number.parseFloat(left.style.height);
      // What the frame shows of the table: from the top of the heading to the end of the last row or the
      // bottom of the frame.
      const shown = Math.min(frame.clientHeight, table.offsetHeight);
      await expect(height).toBeCloseTo(shown, 0);
      await expect(height).toBeLessThanOrEqual(table.offsetHeight + 0.5);
      // It is drawn to the right of the edge cell, and in that much space: the rows it is over are
      // the ones of the middle.
      const edge = boxIn(frame, left.title);
      await expect(edge.right).toBeGreaterThan(0);
    }
    // The short grid is the one that shows the difference: its frame is taller than its table.
    const short = frameOf(
      canvasElement
        .querySelector<HTMLElement>('[data-testid="Short"]')!
        .closest<HTMLElement>('.flg-data-grid')!,
    );
    await expect(short.clientHeight).toBeGreaterThan(tableOf(short).offsetHeight + 40);
  },
};

/**
 * A grid in the cell of a grid whose row is chosen: the wash of the outer row is the outer row's, and
 * the solid pinned cells of the inner grid, scrolled, draw none of it (custom properties inherit, so
 * the inner rows name their own wash: transparent, until a state of their own says another).
 */
export const PinnedGridInAChosenRow: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 900 }}>
      <DataGrid
        aria-label="Outer"
        data-testid="Outer"
        data={SALES.slice(0, 2)}
        rowKey="id"
        columns={[
          {
            field: 'id',
            caption: 'Nested',
            width: 700,
            cell: () => (
              <div style={{ width: 640 }}>
                <DataGrid
                  aria-label="Inner"
                  data-testid="Inner"
                  data={SALES.slice(0, 3)}
                  rowKey="id"
                  columns={SALE_COLUMNS}
                  paging={false}
                  defaultColumnLayout={{ pinned: { id: 'left' } }}
                />
              </div>
            ),
          },
        ]}
        paging={false}
        selectionMode="single"
        defaultSelectedKeys={[SALES[0]!.id]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const outer = canvasElement
      .querySelector<HTMLElement>('[data-testid="Outer"]')!
      .closest<HTMLElement>('.flg-data-grid')!;
    const inner = canvasElement
      .querySelector<HTMLElement>('[data-testid="Inner"]')!
      .closest<HTMLElement>('.flg-data-grid')!;
    const frame = frameOf(inner);
    frame.scrollLeft = 200;
    await waitFor(() => expect(frame).toHaveAttribute('data-scrolled-left'));
    await frames();
    // The outer row is chosen, and says so in its wash.
    // The rows of a grid are the children of its own body: `tbody tr` would match the heading of the
    // inner grid, which stands in a body of the outer one.
    const body = (grid: HTMLElement) =>
      grid.querySelector<HTMLElement>(
        '.flg-data-grid-frame > .flg-data-grid-table > .flg-table-body',
      )!;
    const chosen = body(outer).querySelector<HTMLElement>(':scope > tr[data-selected]')!;
    await expect(chosen).not.toBeNull();
    await expect(getComputedStyle(chosen).getPropertyValue('--flg-data-grid-wash')).not.toBe(
      'transparent',
    );
    const inRow = body(inner).querySelector<HTMLElement>(':scope > tr')!;
    await expect(getComputedStyle(inRow).getPropertyValue('--flg-data-grid-wash')).toBe(
      'transparent',
    );
    const cell = inRow.querySelector<HTMLElement>('[data-pinned="left"]')!;
    await expect(getComputedStyle(cell).backgroundColor).toBe(solid(frame));
    // The wash is a gradient in the accent: drawn, it is an image; transparent, it is none.
    await expect(
      getComputedStyle(cell, '::before').backgroundImage,
      'the inner cell draws the outer wash',
    ).toBe('none');
  },
};

/** A grid with the buttons around it for the focus to leave and come back by, and its handle. */
function FocusGrid({ onHandle }: { onHandle: (handle: DataGridHandle | null) => void }) {
  const ref = useRef<DataGridHandle | null>(null);
  return (
    <div style={{ width: 640 }}>
      <button type="button">Before</button>
      <DataGrid
        ref={(handle) => {
          ref.current = handle;
          onHandle(handle);
        }}
        aria-label="Focus"
        data-testid="Focus"
        data={SALES.slice(0, 30)}
        rowKey="id"
        columns={SALE_COLUMNS}
        height={260}
        paging={false}
        defaultColumnLayout={{ pinned: { id: 'left', total: 'right' } }}
      />
      <button type="button">After</button>
    </div>
  );
}

let handle: DataGridHandle | null = null;

/**
 * What takes the focus never scrolls the frame by a pinned column: moving by the keys onto a pinned
 * cell, Tab out of the grid and back in, and the handle's `focus()` leave `scrollLeft` where it was
 * (the browser's own focus scroll takes the sticky zone for a part that hides the cell in WebKit and
 * Chromium); moving onto a cell of the middle stops it clear of both zones.
 */
export const PinnedFocus: Story = {
  tags: ['no-visual'],
  render: () => <FocusGrid onHandle={(next) => void (handle = next)} />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const wrapper = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    wrapper.scrollIntoView({ block: 'center' });
    const frame = frameOf(wrapper);
    const table = tableOf(wrapper);
    await waitFor(() => expect(frame.clientHeight).toBeGreaterThan(100));
    const cell = (row: number, column: number) => table.tBodies[0]!.rows[row]!.cells[column]!;
    const zones = () => ({
      left: Number.parseFloat(
        getComputedStyle(table).getPropertyValue('--flg-data-grid-pinned-left'),
      ),
      right: Number.parseFloat(
        getComputedStyle(table).getPropertyValue('--flg-data-grid-pinned-right'),
      ),
    });
    await expect(zones()).toEqual({ left: 104, right: 172 });
    const clearOfZones = async (element: HTMLElement) => {
      const where = boxIn(frame, element);
      await expect(where.left).toBeGreaterThanOrEqual(zones().left - 0.5);
      await expect(where.right).toBeLessThanOrEqual(frame.clientWidth - zones().right + 0.5);
    };
    // The cells: Order (pinned), Customer, Assignee, Order date, Status, Channel, Qty, Total (pinned).
    // Start on Customer in the middle of the frame, scrolled so that it is at the edge of the zone.
    frame.scrollLeft = 120;
    await frames();
    cell(2, 1).focus({ preventScroll: true });
    await expect(cell(2, 1)).toHaveFocus();
    const kept = frame.scrollLeft;

    // Left onto Order: pinned, so nothing scrolls.
    await real.keyboard('{ArrowLeft}');
    await expect(cell(2, 0)).toHaveFocus();
    await frames();
    await expect(frame.scrollLeft).toBe(kept);
    await expect(frame.scrollTop).toBe(0);
    // Right onto Customer: it is under the zone, so the frame scrolls it clear, and not more.
    await real.keyboard('{ArrowRight}');
    await expect(cell(2, 1)).toHaveFocus();
    await frames();
    await clearOfZones(cell(2, 1));
    await expect(frame.scrollLeft).toBeLessThanOrEqual(kept);
    // Across to the right zone and back: onto Total nothing scrolls, onto Qty it stops clear of it.
    const beforeEnd = frame.scrollLeft;
    await real.keyboard('{End}');
    await expect(cell(2, 7)).toHaveFocus();
    await frames();
    await expect(frame.scrollLeft).toBe(beforeEnd);
    await real.keyboard('{ArrowLeft}');
    await expect(cell(2, 6)).toHaveFocus();
    await frames();
    await clearOfZones(cell(2, 6));
    const atQty = frame.scrollLeft;
    await real.keyboard('{ArrowRight}');
    await expect(cell(2, 7)).toHaveFocus();
    await frames();
    await expect(frame.scrollLeft).toBe(atQty);

    // The title of a pinned column, from its cell: no scroll either.
    await real.keyboard('{Home}');
    await expect(cell(2, 0)).toHaveFocus();
    await frames();
    const withOrder = frame.scrollLeft;
    await real.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    await frames();
    await expect(table.tHead!.rows[0]!.cells[0]).toHaveFocus();
    await expect(frame.scrollLeft).toBe(withOrder);
    await expect(frame.scrollTop).toBe(0);

    // Tab out of the grid and back in: the focus returns to the pinned cell, and the frame stays put.
    frame.scrollLeft = 300;
    await frames();
    const scrolled = frame.scrollLeft;
    await real.tab();
    await expect(document.activeElement?.textContent).toBe('After');
    await real.tab({ shift: true });
    await expect(table.tHead!.rows[0]!.cells[0]).toHaveFocus();
    await frames();
    await expect(frame.scrollLeft).toBe(scrolled);
    await expect(frame.scrollTop).toBe(0);

    // The handle's `focus()`, to a pinned cell, and with the frame scrolled both ways.
    frame.scrollTop = 120;
    await frames();
    const down = frame.scrollTop;
    (document.activeElement as HTMLElement).blur();
    handle!.focus();
    await frames();
    await expect(document.activeElement).toBe(table.tHead!.rows[0]!.cells[0]);
    await expect(frame.scrollLeft).toBe(scrolled);
    await expect(frame.scrollTop).toBe(down);
  },
};

// ---- Resizing the columns (spec phase 6 §3.7, §3.8, §4.3 C1) -------------------------------------------

/** A distance in layout pixels: engines round a box, and a pointer may be a fraction away. */
const near = (actual: number, expected: number, within = 1.5, what = 'distance') =>
  expect(Math.abs(actual - expected), `${what}: ${actual} against ${expected}`).toBeLessThanOrEqual(
    within,
  );

const titleCell = (root: HTMLElement, caption: string) =>
  Array.from(root.querySelectorAll<HTMLElement>('th.flg-data-grid-head')).find((cell) =>
    cell.textContent?.includes(caption),
  )!;
const handleOf = (root: HTMLElement, caption: string) =>
  titleCell(root, caption).querySelector<HTMLElement>('.flg-data-grid-resizer')!;

/** A drag with the real mouse: down on the handle, to `dx` away from where it is, up. */
async function dragBy(real: RealUserEvent, root: HTMLElement, caption: string, dx: number) {
  const handle = handleOf(root, caption);
  const frame = frameOf(root);
  const at = handle.getBoundingClientRect();
  const box = frame.getBoundingClientRect();
  await real.dragAndDrop(handle, frame, {
    targetPosition: {
      // Relative to the padding box of the frame, which is inside its border.
      x: at.left + at.width / 2 + dx - (box.left + frame.clientLeft),
      y: at.top + at.height / 2 - (box.top + frame.clientTop),
    },
  });
  await frames();
}

/**
 * A pointer the browser does not know, for the states of a drag that need the button held: a real
 * button cannot be left down from a play function, and the listeners of the page follow a pointer of
 * any id all the same (as the Dialog's stories do). The layout and the stylesheet are the browser's.
 */
function pointer(type: 'mouse' | 'touch', id: number, from: { x: number; y: number }) {
  return (target: EventTarget, name: string, dx: number) =>
    target.dispatchEvent(
      new PointerEvent(name, {
        bubbles: true,
        cancelable: true,
        pointerId: id,
        isPrimary: true,
        pointerType: type,
        button: 0,
        buttons: name === 'pointerup' ? 0 : 1,
        clientX: from.x + dx,
        clientY: from.y,
      }),
    );
}
const middleOf = (element: Element) => {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};

/** A grid narrower than its columns, with a height, for the drags: five columns that have a width. */
const RESIZE_COLUMNS: DataGridColumn<Sale>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
  { field: 'customer', caption: 'Customer', width: 200 },
  { field: 'assignee', caption: 'Assignee', width: 160 },
  { field: 'date', caption: 'Order date', dataType: 'date', width: 130 },
  // 88px: the button of the menu keeps its room in a title, and with the sort arrow "Qty" is cut at 80px.
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 88 },
];
const ResizeGrid = ({
  width = 640,
  ...props
}: Partial<DataGridProps<Sale>> & { width?: number }) => (
  <div style={{ width }}>
    <DataGrid
      aria-label="Orders"
      data={SALES.slice(0, 8)}
      rowKey="id"
      columns={RESIZE_COLUMNS}
      height={300}
      paging={false}
      locale="vi-VN"
      {...props}
    />
  </div>
);

/**
 * Resizing with a real mouse, in each engine: a drag of the handle makes the column as wide as the
 * pointer says and calls `onColumnLayoutChange` once, at the drop; the drop is not a click, so no sort,
 * and the press selects no text. While a drag is held (pointer events the browser does not know, since
 * a button cannot be left down), the guide runs from the bottom of the handle to the bottom of what the
 * frame shows, at the middle of the handle, and the label that says the width is 10px under the handle
 * and 6px left of the middle of the guide; the page has the cursor of the drag. Escape, which is real,
 * puts the column back. A finger, which is emulated, drags too.
 */
export const ResizingColumns: Story = {
  tags: ['no-visual'],
  args: { onColumnLayoutChange: fn(), onSortChange: fn() },
  render: (args) => (
    <ResizeGrid onColumnLayoutChange={args.onColumnLayoutChange} onSortChange={args.onSortChange} />
  ),
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const table = tableOf(root);
    const frame = frameOf(root);
    const html = document.documentElement;
    const customer = () => titleCell(root, 'Customer');
    await expect(customer().offsetWidth).toBe(200);
    await noTitleIsCut(root);

    // The real mouse: wider, then narrower. Each drop is one change, and no press sorted or selected.
    await dragBy(real, root, 'Customer', 40);
    near(customer().offsetWidth, 240, 1, 'wider');
    await expect(args.onColumnLayoutChange).toHaveBeenCalledTimes(1);
    await dragBy(real, root, 'Customer', -30);
    near(customer().offsetWidth, 210, 1, 'narrower');
    await expect(args.onColumnLayoutChange).toHaveBeenCalledTimes(2);
    await expect(args.onSortChange).not.toHaveBeenCalled();
    await expect(table.querySelector('[aria-sort]')).toBeNull();
    await expect(getSelection()?.toString()).toBe('');
    await expect(html).not.toHaveAttribute('data-flg-grid-cursor');
    await expect(handleOf(root, 'Customer')).not.toHaveAttribute('data-dragging');
    await expect(root.querySelector('.flg-data-grid-resize-guide')).toBeNull();

    // A drag that is held: the guide and the label stand where the spec says, the page has the cursor.
    const assignee = handleOf(root, 'Assignee');
    const start = middleOf(assignee);
    const send = pointer('mouse', 31, start);
    const wasWide = titleCell(root, 'Assignee').offsetWidth;
    send(assignee, 'pointerdown', 0);
    send(document, 'pointermove', 30);
    await waitFor(() => expect(root.querySelector('.flg-data-grid-resize-guide')).not.toBeNull());
    await frames();
    near(titleCell(root, 'Assignee').offsetWidth, wasWide + 30, 1, 'live width');
    const guide = root.querySelector<HTMLElement>('.flg-data-grid-resize-guide')!;
    const pill = guide.querySelector<HTMLElement>('.flg-data-grid-width-pill')!;
    const at = guide.getBoundingClientRect();
    const handle = assignee.getBoundingClientRect();
    const shown = frame.getBoundingClientRect();
    const centre = at.left + at.width / 2;
    near(centre, handle.left + handle.width / 2, 1.5, 'the guide is at the middle of the handle');
    near(at.width, 2, 0.5, 'the guide is 2px wide');
    near(at.top, handle.bottom, 1.5, 'the guide starts at the bottom of the handle');
    near(
      at.bottom,
      shown.top + frame.clientTop + frame.clientHeight,
      1.5,
      'the guide ends at the bottom of what the frame shows',
    );
    const label = pill.getBoundingClientRect();
    near(label.top, handle.bottom + 10, 1.5, 'the label is 10px under the handle');
    near(label.right, centre - 6, 1.5, 'the label is 6px left of the middle of the guide');
    await expect(pill).toHaveTextContent(`${titleCell(root, 'Assignee').offsetWidth} px`);
    await expect(getComputedStyle(guide).pointerEvents).toBe('none');
    await expect(getComputedStyle(pill).pointerEvents).toBe('none');
    await expect(html).toHaveAttribute('data-flg-grid-cursor', 'col-resize');
    await expect(getComputedStyle(table.tBodies[0]!.rows[0]!.cells[1]!).cursor).toBe('col-resize');
    await expect(assignee).toHaveAttribute('data-dragging');
    // The handle's bar is the accent, 3px wide, all the height of the title, while it is dragged.
    const bar = getComputedStyle(assignee, '::before');
    await expect(bar.width).toBe('3px');
    near(Number.parseFloat(bar.height), titleCell(root, 'Assignee').clientHeight, 1, 'the bar');

    // Escape, a real key, cancels: the column is as it was, nothing was called, the page is let go.
    const calls = (args.onColumnLayoutChange as ReturnType<typeof fn>).mock.calls.length;
    await real.keyboard('{Escape}');
    await frames();
    near(titleCell(root, 'Assignee').offsetWidth, wasWide, 1, 'after Escape');
    await expect(args.onColumnLayoutChange).toHaveBeenCalledTimes(calls);
    await expect(root.querySelector('.flg-data-grid-resize-guide')).toBeNull();
    await expect(html).not.toHaveAttribute('data-flg-grid-cursor');
    await expect(assignee).not.toHaveAttribute('data-dragging');
    send(document, 'pointerup', 30);
    await frames();
    near(titleCell(root, 'Assignee').offsetWidth, wasWide, 1, 'the release after Escape');

    // A finger: the same drag, with a pointer of type `touch`, which the runner does not emulate.
    const finger = pointer('touch', 32, middleOf(handleOf(root, 'Order date')));
    const wasDate = titleCell(root, 'Order date').offsetWidth;
    finger(handleOf(root, 'Order date'), 'pointerdown', 0);
    finger(document, 'pointermove', 25);
    finger(document, 'pointerup', 25);
    await frames();
    near(titleCell(root, 'Order date').offsetWidth, wasDate + 25, 1, 'by touch');
    await expect(args.onColumnLayoutChange).toHaveBeenCalledTimes(calls + 1);
    await noTitleIsCut(root);
  },
};

/**
 * What the scroll of the frame does to a resize, which only a layout engine can show (phase 6 Plan C
 * final review, C1 and C2). A drag counts the scroll its own auto-scroll made, and nothing else:
 * - a frame scrolled to its end, a column narrowed by 20px with the pointer held still: the engine
 *   clamps `scrollLeft` as the table shrinks, and the column is 20px narrower, not at its minimum;
 * - a column pinned to the right, its handle 5px from the edge of the frame, dragged 20px left and then
 *   20px right and held: its width is what the pointer says each time and the frame has not scrolled;
 * - a column in the middle dragged into the right zone and held: it is wider by what the frame
 *   scrolled, which is the intended behaviour.
 * Pointer events the browser does not know hold the drag (a real button cannot be left down); the
 * layout, the clamp and the sticking are the browser's.
 */
export const ResizingWithAScrolledFrame: Story = {
  tags: ['no-visual'],
  args: { onColumnLayoutChange: fn() },
  render: (args) => (
    <>
      {/* 682px of columns in 672px: 10px of room, less than a narrowing of 20px takes. */}
      <ResizeGrid
        width={672}
        aria-label="Scrolled"
        data-testid="Scrolled"
        onColumnLayoutChange={args.onColumnLayoutChange}
      />
      <ResizeGrid
        aria-label="Pinned"
        data-testid="Pinned"
        defaultColumnLayout={{ pinned: { qty: 'right' } }}
      />
    </>
  ),
  play: async ({ canvasElement, args }) => {
    const at = (label: string) =>
      canvasElement
        .querySelector<HTMLElement>(`[data-testid="${label}"]`)!
        .closest<HTMLElement>('.flg-data-grid')!;

    // At the end of the frame: the clamp that follows the narrowing is not a scroll under the pointer.
    const scrolled = at('Scrolled');
    const frame = frameOf(scrolled);
    frame.scrollLeft = frame.scrollWidth;
    await frames();
    await expect(frame.scrollLeft).toBeGreaterThan(0);
    const date = () => titleCell(scrolled, 'Order date');
    const wasDate = date().offsetWidth;
    const handle = handleOf(scrolled, 'Order date');
    const send = pointer('mouse', 41, middleOf(handle));
    send(handle, 'pointerdown', 0);
    send(document, 'pointermove', -20);
    await frames();
    await frames();
    near(date().offsetWidth, wasDate - 20, 1, 'narrowed at the end of the frame');
    send(document, 'pointerup', -20);
    await frames();
    near(date().offsetWidth, wasDate - 20, 1, 'after the release');
    await expect(args.onColumnLayoutChange).toHaveBeenCalledTimes(1);

    // A pinned column: its handle stays where it is, so the frame never scrolls for it.
    const pinned = at('Pinned');
    const pinnedFrame = frameOf(pinned);
    await expect(pinnedFrame.scrollLeft).toBe(0);
    const qty = () => titleCell(pinned, 'Qty');
    const wasQty = qty().offsetWidth;
    const grip = handleOf(pinned, 'Qty');
    const edge = pinnedFrame.getBoundingClientRect().right;
    // The handle of the last title is inside the zone that scrolls a frame: the case of the review.
    await expect(edge - grip.getBoundingClientRect().right).toBeLessThan(40);
    const hold = pointer('mouse', 42, middleOf(grip));
    hold(grip, 'pointerdown', 0);
    for (const dx of [-20, 20]) {
      hold(document, 'pointermove', dx);
      // Long enough for a runaway: an auto-scroll of 20px a frame would scroll the middle at once.
      for (let frame = 0; frame < 6; frame++) await frames();
      near(qty().offsetWidth, wasQty + dx, 1, `pinned width at ${dx}`);
      await expect(pinnedFrame.scrollLeft).toBe(0);
    }
    hold(document, 'pointerup', 20);
    await frames();
    near(qty().offsetWidth, wasQty + 20, 1, 'pinned width after the release');

    // A column in the middle dragged into the right zone: the frame scrolls, and the width follows.
    const middle = () => titleCell(pinned, 'Order date');
    const wasMiddle = middle().offsetWidth;
    const bar = handleOf(pinned, 'Order date');
    const from = middleOf(bar);
    const toEdge = pinnedFrame.getBoundingClientRect().right - 8 - from.x;
    const drag = pointer('mouse', 43, from);
    drag(bar, 'pointerdown', 0);
    drag(document, 'pointermove', toEdge);
    await waitFor(() => expect(pinnedFrame.scrollLeft).toBeGreaterThan(0));
    for (let frame = 0; frame < 4; frame++) await frames();
    near(
      middle().offsetWidth,
      wasMiddle + toEdge + pinnedFrame.scrollLeft,
      1.5,
      'the middle column follows the scroll',
    );
    drag(document, 'pointerup', toEdge);
    await frames();
  },
};

/**
 * The keys, which are the same on both platforms: <kbd>Alt+Shift+→</kbd> three times on a title makes
 * its column 30px wider, one change of the layout for each press, and the new width is said after the
 * last of them. A held key does not scroll the frame.
 */
const resizeKeys: NonNullable<Story['play']> = async ({ canvasElement, args }) => {
  const real = await realUserEvent();
  if (!real) return;
  const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
  const frame = frameOf(root);
  const customer = () => titleCell(root, 'Customer');
  // Tab lands on the first cell of the first row; the title of Customer is up and along.
  await real.tab();
  await real.keyboard('{ArrowUp}{ArrowRight}');
  await expect(customer()).toHaveFocus();
  const said: string[] = [];
  const region = root.querySelector('[aria-live="polite"]')!;
  const watcher = new MutationObserver(() => {
    if (region.textContent) said.push(region.textContent);
  });
  watcher.observe(region, { childList: true, characterData: true, subtree: true });
  const scroll = { left: frame.scrollLeft, top: frame.scrollTop };
  for (const width of [210, 220, 230]) {
    await real.keyboard('{Alt>}{Shift>}{ArrowRight}{/Shift}{/Alt}');
    await expect(customer().offsetWidth).toBe(width);
  }
  await expect(args.onColumnLayoutChange).toHaveBeenCalledTimes(3);
  await expect(customer()).toHaveFocus();
  await expect({ left: frame.scrollLeft, top: frame.scrollTop }).toEqual(scroll);
  await real.keyboard('{Alt>}{Shift>}{ArrowLeft}{/Shift}{/Alt}');
  await expect(customer().offsetWidth).toBe(220);
  // What is said follows the last press: the new width, a moment after it. How many sentences a
  // burst makes depends on how fast the browser delivers the keys (a press later than the
  // announcement delay after the one before says its own), so what is held here is that the last
  // sentence is the final width, that nothing is said after it, and that every sentence names the
  // column and a width it passed through. That one sentence is said per burst is the unit test's
  // ("says the new width once, 500 ms after the last press", DataGrid.resize.test.tsx).
  await waitFor(() => expect(said.at(-1)).toBe('Customer, 220 pixels wide'), { timeout: 3000 });
  const count = said.length;
  await new Promise((resolve) => setTimeout(resolve, 700));
  await expect(said, 'nothing is said after the final width').toHaveLength(count);
  for (const sentence of said) {
    await expect(
      [210, 220, 230].map((width) => `Customer, ${width} pixels wide`),
      `"${sentence}" is a width the column passed through`,
    ).toContain(sentence);
  }
  watcher.disconnect();
  await noTitleIsCut(root);
};

export const ResizeKeys: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  args: { onColumnLayoutChange: fn() },
  render: (args) => <ResizeGrid onColumnLayoutChange={args.onColumnLayoutChange} />,
  play: resizeKeys,
};

export const ResizeKeysOnAMac: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('apple'),
  args: { onColumnLayoutChange: fn() },
  render: (args) => <ResizeGrid onColumnLayoutChange={args.onColumnLayoutChange} />,
  play: resizeKeys,
};

/**
 * A double press on a handle fits the column to what its title and its drawn cells need, in each
 * engine: a column that is too wide shrinks to the longest text, a column that cuts its text grows to
 * it, and no cell is cut after. The width is the text, the padding of the cell, and nothing more than a
 * pixel. It is one change of the layout each, and the press sorts nothing.
 */
export const FittingColumns: Story = {
  tags: ['no-visual'],
  args: { onColumnLayoutChange: fn(), onSortChange: fn() },
  render: (args) => (
    <div style={{ width: 760 }}>
      <DataGrid
        aria-label="Orders"
        data={PAGE_ONE}
        rowKey="id"
        columns={[
          { field: 'id', caption: 'Order', rowHeader: true, width: 100 },
          { field: 'customer', caption: 'Customer', width: 420 },
          { field: 'assignee', caption: 'Assignee', width: 60 },
        ]}
        allowSorting={false}
        paging={false}
        onColumnLayoutChange={args.onColumnLayoutChange}
        onSortChange={args.onSortChange}
      />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const table = tableOf(root);
    const cellsOfColumn = (index: number) =>
      Array.from(table.tBodies[0]!.rows, (row) => row.cells[index] as HTMLTableCellElement);

    /** The width of the longest text of a column, measured by a probe that has the cell's own font. */
    const longestText = (index: number) => {
      const cells = cellsOfColumn(index);
      const style = getComputedStyle(cells[0]!);
      const probe = document.createElement('span');
      probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-family:${style.fontFamily};font-size:${style.fontSize};font-weight:${style.fontWeight};font-style:${style.fontStyle};font-variant-numeric:${style.fontVariantNumeric};letter-spacing:${style.letterSpacing}`;
      document.body.append(probe);
      const widest = Math.max(
        ...cells.map((cell) => {
          probe.textContent = cell.textContent;
          return probe.getBoundingClientRect().width;
        }),
      );
      probe.remove();
      return {
        text: widest,
        padding: Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight),
      };
    };

    await expect(cellsOfColumn(1).some((cell) => cell.scrollWidth > cell.clientWidth)).toBe(false);
    await expect(cellsOfColumn(2).some((cell) => cell.scrollWidth > cell.clientWidth)).toBe(true);

    for (const [index, caption] of [
      [1, 'Customer'],
      [2, 'Assignee'],
    ] as const) {
      const was = args.onColumnLayoutChange as ReturnType<typeof fn>;
      const before = was.mock.calls.length;
      await real.dblClick(handleOf(root, caption));
      await frames();
      await expect(was).toHaveBeenCalledTimes(before + 1);
      const { text, padding } = longestText(index);
      const column = titleCell(root, caption).offsetWidth;
      near(column, Math.ceil(text) + padding, 1.5, `${caption} fits its longest text`);
      for (const cell of cellsOfColumn(index)) {
        await expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth + 1);
      }
    }
    await expect(args.onSortChange).not.toHaveBeenCalled();
    await expect(table.querySelector('[aria-sort]')).toBeNull();
    await noTitleIsCut(root);
  },
};

// ---- Look stories: the column parts of C1 (spec phase 6 §4.3 C1, mockup phase-6-grid.html) -----------

/** A column of G1 at the width of the crops of C1. */
const cropColumn = (field: keyof Sale & string, width: number): DataGridColumn<Sale> => ({
  ...SALE_COLUMNS.find((column) => 'field' in column && column.field === field)!,
  width,
});

/**
 * The columns of the crops a and b of C1: Order 100, Customer 160, Assignee 190, Order date 130,
 * Status 140.
 */
const CROP_COLUMNS = [
  cropColumn('id', 100),
  cropColumn('customer', 160),
  cropColumn('assignee', 190),
  cropColumn('date', 130),
  cropColumn('status', 140),
];
/** DH-1024, DH-1025 and DH-1026, in that order, as the crops show them. */
const CROP_ROWS = ['DH-1024', 'DH-1025', 'DH-1026'].map((id) =>
  SALES.find((order) => order.id === id)!,
);

/**
 * A crop of C1: a surface of 634px with 10px of padding around a grid whose titles are plain (the crops
 * draw no sort), cut at the right edge of the frame as the crop is. The frame's scrollbar is hidden, as
 * the mockup draws a scroll without one: a classic scrollbar would narrow the frame and make it scroll.
 */
const CropGrid = ({
  label,
  columns = CROP_COLUMNS,
  rows = CROP_ROWS,
  sortable = false,
  ...props
}: Partial<DataGridProps<Sale>> & {
  label: string;
  columns?: DataGridColumn<Sale>[];
  /** The rows the crop draws: three, or the two of crop e. */
  rows?: Sale[];
  /** Whether the titles sort: the crops draw none, and the menu of crop d has its sort group only then. */
  sortable?: boolean;
}) => (
  <div
    className="flg-surface c1-crop"
    style={{
      width: 634,
      boxSizing: 'border-box',
      padding: 10,
      borderRadius: 'var(--flg-radius-lg)',
    }}
  >
    <style>{'.c1-crop .flg-table-frame { scrollbar-width: none; }'}</style>
    <DataGrid
      aria-label={label}
      data={rows}
      rowKey="id"
      columns={columns}
      allowSorting={sortable}
      paging={false}
      locale="vi-VN"
      {...props}
    />
  </div>
);

/**
 * A popup of crop d or e hangs below the crop's surface, which is as tall as its rows, as in the mockup,
 * and ends inside the stage, out of its padding. The harness shoots the stage alone: a popup in the top
 * layer adds nothing to the stage's height, so one that ran past it would be cut in the baseline.
 */
async function hangsFromTheCrop(canvasElement: HTMLElement, popup: HTMLElement) {
  const stage = canvasElement.querySelector<HTMLElement>('[data-testid="flg-stage"]');
  const surface = canvasElement.querySelector<HTMLElement>('.c1-crop');
  if (!stage || !surface) throw new Error('The stage and the surface of the crop must exist.');
  const end = popup.getBoundingClientRect().bottom;
  const room =
    stage.getBoundingClientRect().bottom - parseFloat(getComputedStyle(stage).paddingBottom);
  await expect(end, 'the popup hangs below the surface').toBeGreaterThan(
    surface.getBoundingClientRect().bottom,
  );
  await expect(end, 'the popup ends inside the stage').toBeLessThanOrEqual(room);
}

/** What both crops are measured against in the mockup: the boxes of the titles and of the handle. */
async function cropBoxes(root: HTMLElement) {
  const widths = Array.from(root.querySelectorAll<HTMLElement>('th.flg-data-grid-head'), (cell) =>
    Math.round(cell.offsetWidth),
  );
  await expect(widths).toEqual([100, 160, 190, 130, 140]);
  const handles = root.querySelectorAll<HTMLElement>('.flg-data-grid-resizer');
  await expect(handles).toHaveLength(5);
  for (const handle of handles) {
    const box = handle.getBoundingClientRect();
    const title = handle.closest('th')!.getBoundingClientRect();
    near(box.width, 10, 0.5, 'the handle is 10px wide');
    near(box.height, title.height - 1, 1, 'the handle is the height of the title, less its border');
  }
  await noTitleIsCut(root);
}

/**
 * C1, crop a: the thin line between the titles at rest (left), and the bar of 3px in the accent on the
 * handle between Customer and Assignee when the pointer is over it (right; the harness hovers what has
 * `data-visual-hover`). Not drawn here, as in the other crops of C: nothing, the crops hold the column
 * parts only. The last title of the crop is cut by the frame, as in the mockup.
 */
export const ColumnResizeHandle: Story = {
  tags: ['viewport-1440x720'],
  render: () => (
    <div style={{ display: 'flex', gap: 16, width: 1284 }}>
      <CropGrid label="At rest" />
      <CropGrid label="Hovered" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const roots = canvasElement.querySelectorAll<HTMLElement>('.flg-data-grid');
    await expect(roots).toHaveLength(2);
    for (const root of roots) await cropBoxes(root);
    // The thin line at rest: 1px by 14px.
    const line = getComputedStyle(handleOf(roots[0]!, 'Customer'), '::before');
    await expect([line.width, line.height]).toEqual(['1px', '14px']);
    handleOf(roots[1]!, 'Customer').setAttribute('data-visual-hover', '');
  },
};

/**
 * C1, crop b: Customer dragged from 160 to 180px (the harness drags what has `data-visual-drag` by
 * the distance it says, and shoots with the button down): the bar of 3px, the guide down the frame
 * and the label "180 px".
 */
export const ColumnResizing: Story = {
  tags: ['viewport-1440x720'],
  render: () => (
    <div style={{ width: 634 }}>
      <CropGrid label="Resizing" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    await cropBoxes(root);
    handleOf(root, 'Customer').setAttribute('data-visual-drag', '20,0');
  },
};

// ---- Reordering the columns (spec phase 6 §3.6, §3.8, §4.3 C1 crop c) -------------------------------

/** Six columns that have a width, wider than the 640px frame they stand in, for the drags and the keys. */
const REORDER_COLUMNS = [
  cropColumn('id', 104),
  cropColumn('customer', 200),
  cropColumn('status', 160),
  cropColumn('channel', 120),
  // Qty is 88px and Total 172: the button of the menu keeps its room in a title, and with the sort arrow a
  // title of "Qty" is cut at 80px.
  cropColumn('qty', 88),
  cropColumn('total', 172),
];

const ReorderGrid = ({
  label,
  width = 900,
  ...props
}: Partial<DataGridProps<Sale>> & { label: string; width?: number }) => (
  <div style={{ width, marginBottom: 16 }}>
    <DataGrid
      aria-label={label}
      data-testid={label}
      data={SALES.slice(0, 8)}
      rowKey="id"
      columns={REORDER_COLUMNS}
      height={300}
      paging={false}
      locale="vi-VN"
      {...props}
    />
  </div>
);

const captionsOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('th.flg-data-grid-head'), (cell) =>
    cell.querySelector('.flg-data-grid-head-title')?.textContent?.trim(),
  );
const rootOf = (canvasElement: HTMLElement, label: string) =>
  canvasElement
    .querySelector<HTMLElement>(`[data-testid="${label}"]`)!
    .closest<HTMLElement>('.flg-data-grid')!;
const dragLine = (root: HTMLElement) => root.querySelector<HTMLElement>('.flg-data-grid-drop-line');
const dragChip = (root: HTMLElement) => root.querySelector<HTMLElement>('.flg-data-grid-drag-chip');
/** The cells of a column: its title and a cell of each row that is drawn. */
const columnCells = (root: HTMLElement, caption: string) => {
  const index = captionsOf(root).indexOf(caption);
  return Array.from(root.querySelectorAll<HTMLTableRowElement>('tr.flg-table-row'))
    .map(
      (row) =>
        Array.from(row.cells).filter((cell) => !cell.classList.contains('flg-data-grid-filler'))[
          index
        ],
    )
    .filter((cell): cell is HTMLTableCellElement => cell !== undefined);
};

/**
 * A column of the middle scrolls the frame from the inner edge of a pinned zone (spec phase 6 §3.8,
 * chosen in the review of PR #43): Qty, pinned right, covers the right end of the frame, and a pointer
 * 20px left of it, far from the frame's own edge, scrolls the frame, for a resize that widens Customer
 * and for a drag of the title of Order, whose drop line still shows there.
 */
export const ScrollingBesideAPinnedZone: Story = {
  tags: ['no-visual'],
  render: () => (
    <ResizeGrid
      aria-label="Pinned"
      data-testid="Pinned"
      defaultColumnLayout={{ pinned: { qty: 'right' } }}
    />
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement
      .querySelector<HTMLElement>('[data-testid="Pinned"]')!
      .closest<HTMLElement>('.flg-data-grid')!;
    const frame = frameOf(root);
    await waitFor(() => expect(frame.clientHeight).toBeGreaterThan(100));
    const zone = () => titleCell(root, 'Qty').getBoundingClientRect().left;
    const target = () => zone() - 20;
    await expect(frame.getBoundingClientRect().right - target()).toBeGreaterThan(40);

    // Customer widened, its handle taken to 20px left of the zone.
    frame.scrollLeft = 0;
    await frames();
    const bar = handleOf(root, 'Customer');
    const from = middleOf(bar);
    const resize = pointer('mouse', 44, from);
    resize(bar, 'pointerdown', 0);
    resize(document, 'pointermove', target() - from.x);
    await waitFor(() => expect(frame.scrollLeft).toBeGreaterThan(0), SCROLL_EVENT);
    resize(document, 'pointerup', target() - from.x);
    await frames();

    // The title of Order dragged to the same place: the frame scrolls, and the line shows (Customer
    // now ends there, a boundary that is not beside Order).
    frame.scrollLeft = 0;
    await frames();
    const title = titleCell(root, 'Order');
    const start = middleOf(title);
    const move = pointer('mouse', 45, start);
    move(title, 'pointerdown', 0);
    move(document, 'pointermove', target() - start.x);
    await waitFor(() => expect(frame.scrollLeft).toBeGreaterThan(0), SCROLL_EVENT);
    await expect(dragLine(root)).not.toBeNull();
    move(document, 'pointerup', target() - start.x);
    await frames();
  },
};

/**
 * Reordering with a real mouse, in each engine. A drag of the title of Channel to the middle of Status
 * makes it the column before Status, with one change of the layout and no sort (the drop is not a click,
 * the sort button under the pointer included), no selected text, and the focus still on the title. While
 * a drag is held (pointer events the browser does not know, since a button cannot be left down) the
 * drop line stands 2px left of the boundary, 3px wide, from the top of the heading to the bottom of what
 * the frame shows, with a dot of 7px at its top; the chip is 16px right of and 16px below the pointer,
 * in the top layer; the column is at 35% in the title and in every row; the page has the cursor. Below
 * the heading there is no line and a drop changes nothing; over a pinned zone there is no line; Escape
 * puts everything back.
 */
export const ReorderingColumns: Story = {
  tags: ['no-visual'],
  args: { onColumnLayoutChange: fn(), onSortChange: fn() },
  render: (args) => (
    <>
      <ReorderGrid
        label="Free"
        onColumnLayoutChange={args.onColumnLayoutChange}
        onSortChange={args.onSortChange}
      />
      <ReorderGrid
        label="Pinned"
        defaultColumnLayout={{ pinned: { id: 'left' } }}
        onColumnLayoutChange={args.onColumnLayoutChange}
      />
    </>
  ),
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = rootOf(canvasElement, 'Free');
    const frame = frameOf(root);
    const table = tableOf(root);
    const html = document.documentElement;
    const calls = args.onColumnLayoutChange as ReturnType<typeof fn>;
    await waitFor(() => expect(frame.clientHeight).toBeGreaterThan(100));
    const original = ['Order', 'Customer', 'Status', 'Channel', 'Qty', 'Total'];
    await expect(captionsOf(root)).toEqual(original);
    await noTitleIsCut(root);

    // A held drag of Qty over the boundary between Customer and Status.
    const qty = titleCell(root, 'Qty');
    const start = middleOf(qty);
    const send = pointer('mouse', 41, start);
    const status = titleCell(root, 'Status').getBoundingClientRect();
    const toStatus = status.left + 20 - start.x;
    send(qty, 'pointerdown', 0);
    send(document, 'pointermove', toStatus);
    await waitFor(() => expect(dragLine(root)).not.toBeNull());
    await frames();
    const line = dragLine(root)!;
    const at = line.getBoundingClientRect();
    const head = table.tHead!.getBoundingClientRect();
    const shown = frame.getBoundingClientRect();
    near(at.left, status.left - 2, 1, 'the line is 2px left of the boundary');
    near(at.width, 3, 0.5, 'the line is 3px wide');
    near(at.top, head.top, 1.5, 'the line starts at the top of the heading');
    near(
      at.bottom,
      shown.top + frame.clientTop + frame.clientHeight,
      1.5,
      'and ends at the bottom of the frame',
    );
    const dot = getComputedStyle(line, '::before');
    await expect([dot.width, dot.height, dot.left, dot.top]).toEqual(['7px', '7px', '-2px', '0px']);
    await expect(getComputedStyle(line).pointerEvents).toBe('none');
    const chip = dragChip(root) ?? document.querySelector<HTMLElement>('.flg-data-grid-drag-chip')!;
    await expect(chip).not.toBeNull();
    const pointerAt = { x: start.x + toStatus, y: start.y };
    const box = chip.getBoundingClientRect();
    near(box.left, pointerAt.x + 16, 1.5, 'the chip is 16px right of the pointer');
    near(box.top, pointerAt.y + 16, 1.5, 'and 16px below it');
    await expect(chip).toHaveTextContent('Qty');
    await expect(getComputedStyle(chip).pointerEvents).toBe('none');
    if (typeof chip.showPopover === 'function')
      await expect(chip.matches(':popover-open')).toBe(true);
    for (const cell of columnCells(root, 'Qty'))
      await expect(getComputedStyle(cell).opacity).toBe('0.35');
    for (const cell of columnCells(root, 'Status'))
      await expect(getComputedStyle(cell).opacity).toBe('1');
    await expect(html).toHaveAttribute('data-flg-grid-cursor', 'grabbing');
    await expect(getComputedStyle(table.tBodies[0]!.rows[0]!.cells[1]!).cursor).toBe('grabbing');

    // Below the heading there is no line, and the chip goes on.
    const below = pointer('mouse', 41, { x: start.x, y: head.bottom + 60 });
    below(document, 'pointermove', toStatus);
    await waitFor(() => expect(dragLine(root)).toBeNull());
    await expect(document.querySelector('.flg-data-grid-drag-chip')).not.toBeNull();
    // A release there changes nothing.
    below(document, 'pointerup', toStatus);
    await frames();
    await expect(captionsOf(root)).toEqual(original);
    await expect(calls).not.toHaveBeenCalled();
    await expect(document.querySelector('.flg-data-grid-drag-chip')).toBeNull();
    await expect(html).not.toHaveAttribute('data-flg-grid-cursor');
    for (const cell of columnCells(root, 'Qty'))
      await expect(getComputedStyle(cell).opacity).toBe('1');

    // Escape, a real key, puts it all back.
    send(qty, 'pointerdown', 0);
    send(document, 'pointermove', toStatus);
    await waitFor(() => expect(dragLine(root)).not.toBeNull());
    await real.keyboard('{Escape}');
    await frames();
    await expect(dragLine(root)).toBeNull();
    await expect(document.querySelector('.flg-data-grid-drag-chip')).toBeNull();
    await expect(html).not.toHaveAttribute('data-flg-grid-cursor');
    await expect(captionsOf(root)).toEqual(original);
    send(document, 'pointerup', toStatus);
    await frames();
    await expect(calls).not.toHaveBeenCalled();

    // Over a pinned zone, the column of another zone has no line and a drop cancels.
    const other = rootOf(canvasElement, 'Pinned');
    const customer = titleCell(other, 'Customer');
    const from = middleOf(customer);
    const order = titleCell(other, 'Order').getBoundingClientRect();
    const fly = pointer('mouse', 42, from);
    fly(customer, 'pointerdown', 0);
    fly(document, 'pointermove', order.left + 30 - from.x);
    await waitFor(() => expect(document.querySelector('.flg-data-grid-drag-chip')).not.toBeNull());
    await frames();
    await expect(dragLine(other)).toBeNull();
    fly(document, 'pointerup', order.left + 30 - from.x);
    await frames();
    await expect(captionsOf(other)).toEqual(original);
    await expect(calls).not.toHaveBeenCalled();

    // The real mouse: Channel to the middle of Status. One change, no sort, no selected text, and the
    // title keeps the focus.
    const channel = () => titleCell(root, 'Channel');
    const target = titleCell(root, 'Status').getBoundingClientRect();
    const frameBox = frame.getBoundingClientRect();
    const here = channel().getBoundingClientRect();
    await real.dragAndDrop(channel(), frame, {
      targetPosition: {
        x: target.left + 20 - (frameBox.left + frame.clientLeft),
        y: here.top + here.height / 2 - (frameBox.top + frame.clientTop),
      },
    });
    await frames();
    await expect(captionsOf(root)).toEqual([
      'Order',
      'Customer',
      'Channel',
      'Status',
      'Qty',
      'Total',
    ]);
    await expect(calls).toHaveBeenCalledTimes(1);
    await expect((calls.mock.calls[0]![0] as DataGridColumnLayout).order).toEqual([
      'id',
      'customer',
      'channel',
      'status',
      'qty',
      'total',
    ]);
    await expect(args.onSortChange).not.toHaveBeenCalled();
    await expect(table.querySelector('[aria-sort]')).toBeNull();
    await expect(getSelection()?.toString()).toBe('');
    await expect(channel()).toHaveFocus();
    await expect(dragLine(root)).toBeNull();
    await expect(html).not.toHaveAttribute('data-flg-grid-cursor');
    await noTitleIsCut(root);
  },
};

/**
 * The keys, in each engine: <kbd>mod+Shift+→</kbd> on a title moves its column one place, the title
 * keeps the focus after each move (React moves the node of a keyed cell, and an engine may drop the
 * focus of a node that is moved), it is the one that shows `:focus-visible`, the frame is not scrolled
 * up or down, and a column that is moved out of sight is scrolled to, sideways. Both platforms.
 */
const reorderKeys =
  (modifier: 'Control' | 'Meta'): NonNullable<Story['play']> =>
  async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = rootOf(canvasElement, 'Keys');
    const frame = frameOf(root);
    await waitFor(() => expect(frame.clientHeight).toBeGreaterThan(100));
    const customer = () => titleCell(root, 'Customer');
    await real.tab();
    await real.keyboard('{ArrowUp}{ArrowRight}');
    await expect(customer()).toHaveFocus();
    frame.scrollTop = 60;
    const scrolledTop = frame.scrollTop;
    await expect(scrolledTop).toBeGreaterThan(0);
    for (const [step, order] of [
      ['Order', 'Status', 'Customer', 'Channel', 'Qty', 'Total'],
      ['Order', 'Status', 'Channel', 'Customer', 'Qty', 'Total'],
      ['Order', 'Status', 'Channel', 'Qty', 'Customer', 'Total'],
    ].entries()) {
      await real.keyboard(`{${modifier}>}{Shift>}{ArrowRight}{/Shift}{/${modifier}}`);
      await frames();
      await expect(captionsOf(root), `after press ${step + 1}`).toEqual(order);
      await expect(customer(), `the focus after press ${step + 1}`).toHaveFocus();
      await expect(customer().matches(':focus-visible')).toBe(true);
      await expect(frame.scrollTop).toBe(scrolledTop);
    }
    await expect(args.onColumnLayoutChange).toHaveBeenCalledTimes(3);
    // The wide columns put Customer where the frame does not show it until it is scrolled to.
    await real.keyboard(`{${modifier}>}{Shift>}{ArrowRight}{/Shift}{/${modifier}}`);
    await frames();
    await expect(captionsOf(root)).toEqual([
      'Order',
      'Status',
      'Channel',
      'Qty',
      'Total',
      'Customer',
    ]);
    await expect(customer()).toHaveFocus();
    const inside = boxIn(frame, customer());
    await expect(inside.left).toBeGreaterThanOrEqual(-1);
    await expect(inside.right).toBeLessThanOrEqual(frame.clientWidth + 1);
    await expect(frame.scrollTop).toBe(scrolledTop);
    // At the edge of the zone the key does nothing (and calls nothing).
    await real.keyboard(`{${modifier}>}{Shift>}{ArrowRight}{/Shift}{/${modifier}}`);
    await expect(args.onColumnLayoutChange).toHaveBeenCalledTimes(4);
    // The arrows go on from where the title is now.
    await real.keyboard('{ArrowLeft}');
    await expect(titleCell(root, 'Total')).toHaveFocus();
    await noTitleIsCut(root);
  };

const KeysGrid = (props: Partial<DataGridProps<Sale>>) => (
  <ReorderGrid label="Keys" width={640} {...props} />
);

export const ColumnKeysKeepFocus: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  args: { onColumnLayoutChange: fn() },
  render: (args) => <KeysGrid onColumnLayoutChange={args.onColumnLayoutChange} />,
  play: reorderKeys('Control'),
};

export const ColumnKeysKeepFocusOnAMac: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('apple'),
  args: { onColumnLayoutChange: fn() },
  render: (args) => <KeysGrid onColumnLayoutChange={args.onColumnLayoutChange} />,
  play: reorderKeys('Meta'),
};

/** A grid whose parent keeps the layout, and moves a column on <kbd>F9</kbd> from anywhere on the page. */
function MovedByTheParent() {
  const [layout, setLayout] = useState<DataGridColumnLayout>({
    order: ['id', 'customer', 'status', 'channel', 'qty', 'total'],
    widths: {},
    hidden: [],
    pinned: {},
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'F9') return;
      setLayout((current) => ({
        ...current,
        order: [...current.order.slice(1, 3), current.order[0]!, ...current.order.slice(3)],
      }));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  return <ReorderGrid label="Moved" columnLayout={layout} onColumnLayoutChange={setLayout} />;
}

/**
 * A commit that reorders the cells of a row while a cell has the focus: the focus stays on that cell, in
 * each engine, and the arrows go on from it in the new order. The parent moves the first of three columns
 * past the other two on <kbd>F9</kbd>, a key that is pressed with the focus inside the grid. React moves
 * the node of that first column (the others keep their places), so the focus is on the node that moves
 * both times: Order the first time, Customer the second.
 */
export const ColumnMoveKeepsCellFocus: Story = {
  tags: ['no-visual'],
  render: () => <MovedByTheParent />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = rootOf(canvasElement, 'Moved');
    await waitFor(() => expect(frameOf(root).clientHeight).toBeGreaterThan(100));
    // Tab lands on the first cell of the first row: Order. Down to the second row, still on Order.
    await real.tab();
    await real.keyboard('{ArrowDown}');
    const row = () => root.querySelectorAll<HTMLTableRowElement>('tbody > tr')[1]!;
    const cellOf = (caption: string) => row().cells[captionsOf(root).indexOf(caption)]!;
    await expect(cellOf('Order')).toHaveFocus();
    const held = cellOf('Order');
    // Order, Customer, Status become Customer, Status, Order: React keeps the nodes of Customer and
    // Status where they are and moves the node of Order, the one that holds the focus, to the end.
    await real.keyboard('{F9}');
    await frames();
    await expect(captionsOf(root)).toEqual([
      'Customer',
      'Status',
      'Order',
      'Channel',
      'Qty',
      'Total',
    ]);
    await expect(cellOf('Order')).toBe(held);
    await expect(cellOf('Order')).toHaveFocus();
    // The arrows go on from there, in the new order: right is Channel, and left three times from it is
    // Customer.
    await real.keyboard('{ArrowRight}');
    await expect(cellOf('Channel')).toHaveFocus();
    await real.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');
    await expect(cellOf('Customer')).toHaveFocus();
    const moved = cellOf('Customer');
    // Customer, Status, Order become Status, Order, Customer: now it is the node of Customer, the first
    // of the three and the one that holds the focus, that React moves to the end.
    await real.keyboard('{F9}');
    await frames();
    await expect(captionsOf(root).slice(0, 4)).toEqual(['Status', 'Order', 'Customer', 'Channel']);
    await expect(cellOf('Customer')).toBe(moved);
    await expect(cellOf('Customer')).toHaveFocus();
    await real.keyboard('{ArrowRight}');
    await expect(cellOf('Channel')).toHaveFocus();
    await expect(document.activeElement?.closest('table')).toBe(tableOf(root));
  },
};

/** The columns of C1 crop c: Order date 120, Status 140, Channel 120, Qty 80, Total 174. */
const DRAG_COLUMNS = [
  cropColumn('date', 120),
  cropColumn('status', 140),
  cropColumn('channel', 120),
  cropColumn('qty', 80),
  cropColumn('total', 174),
];

/**
 * C1, crop c: Channel dragged to between Order date and Status (the harness drags what has
 * `data-visual-drag` by the distance it says, and shoots with the button down): the column at 35%, the
 * chip with the grip 16px from the pointer, and the 3px drop line with its dot. The pointer ends where the
 * crop's cursor is, 154px right of and 12px below the corner of the crop, which is 178px left of and 16px
 * above the middle of Channel's title, measured on the approved page.
 */
export const ColumnDragging: Story = {
  tags: ['viewport-1440x720'],
  render: () => (
    <div style={{ width: 634 }}>
      <CropGrid label="Dragging" columns={DRAG_COLUMNS} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const widths = Array.from(root.querySelectorAll<HTMLElement>('th.flg-data-grid-head'), (cell) =>
      Math.round(cell.offsetWidth),
    );
    await expect(widths).toEqual([120, 140, 120, 80, 174]);
    await noTitleIsCut(root);
    titleCell(root, 'Channel').setAttribute('data-visual-drag', '-178,-16');
  },
};

// ---- The column menu (spec phase 6 §3.6, §3.8, §4.3 C1 crop d) ----------------------------------------

const moreOf = (root: HTMLElement, caption: string) =>
  titleCell(root, caption).querySelector<HTMLButtonElement>('.flg-data-grid-head-button')!;
const menuOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('.flg-data-grid-column-menu')!;
const itemsOf = (menu: HTMLElement) =>
  Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
const isOpen = (menu: HTMLElement) => menu.matches(':popover-open');
/** What the page and the frame are scrolled to: nothing that opens a menu may change it. */
const scrolls = (root: HTMLElement) => {
  const frame = frameOf(root);
  return [
    document.scrollingElement?.scrollTop,
    document.scrollingElement?.scrollLeft,
    frame.scrollTop,
    frame.scrollLeft,
  ];
};

/**
 * The column menu from the keyboard, in each engine and on both platforms. <kbd>Alt</kbd>+<kbd>↓</kbd> on
 * the title of Customer opens the menu under its button with the first item focused, and nothing is
 * scrolled; ↓ goes past "Clear sorting", which is off, to "Pin to the left", and Enter pins the column:
 * one change of the layout, the menu closed, and the focus on the title, which is in the left zone now.
 * <kbd>Shift</kbd>+<kbd>F10</kbd> opens it again and Escape gives the focus back to the title. A real
 * right press opens it at the pointer, and Escape again gives the focus back. "Hide column" removes
 * Qty and the focus goes to the title that took its place.
 */
const columnMenuKeys: NonNullable<Story['play']> = async ({ canvasElement, args }) => {
  const real = await realUserEvent();
  if (!real) return;
  const root = rootOf(canvasElement, 'Menu');
  const frame = frameOf(root);
  await waitFor(() => expect(frame.clientHeight).toBeGreaterThan(100));
  const changed = args.onColumnLayoutChange as ReturnType<typeof fn>;
  const menu = menuOf(root);
  // Tab lands on the first cell of the first row; up is the title of Order, and right is Customer's.
  await real.tab();
  await real.keyboard('{ArrowUp}{ArrowRight}');
  await expect(titleCell(root, 'Customer')).toHaveFocus();
  const before = scrolls(root);

  await real.keyboard('{Alt>}{ArrowDown}{/Alt}');
  await waitFor(() => expect(isOpen(menu)).toBe(true));
  await expect(itemsOf(menu)[0]).toHaveFocus();
  // The menu enters with a transform: it is measured where it has come to rest.
  await settled(menu);
  await expect(itemsOf(menu).map((item) => item.textContent)).toEqual([
    'Sort ascending',
    'Sort descending',
    'Clear sorting',
    'Pin to the left',
    'Pin to the right',
    'Move left',
    'Move right',
    'Fit width to content',
    'Hide column',
  ]);
  // Under the button, 4px below it and lined up with its left edge; the menu is 236px wide.
  const button = moreOf(root, 'Customer').getBoundingClientRect();
  const placed = menu.getBoundingClientRect();
  near(placed.top, button.bottom + 4, 1.5, 'the menu is 4px under the button');
  near(placed.left, button.left, 1.5, 'the menu starts at the button');
  near(placed.width, 236, 0.5, 'the menu is 236px wide');
  await expect(moreOf(root, 'Customer')).toHaveAttribute('aria-expanded', 'true');
  await expect(moreOf(root, 'Customer')).toHaveAttribute('aria-controls', menu.id);
  await expect(scrolls(root)).toEqual(before);

  await real.keyboard('{ArrowDown}{ArrowDown}');
  await expect(document.activeElement).toHaveTextContent('Pin to the left');
  await real.keyboard('{Enter}');
  await expect(changed).toHaveBeenCalledTimes(1);
  await expect((changed.mock.calls[0]![0] as DataGridColumnLayout).pinned).toEqual({
    customer: 'left',
  });
  await waitFor(() => expect(isOpen(menu)).toBe(false));
  await frames();
  await expect(titleCell(root, 'Customer')).toHaveAttribute('data-pinned', 'left');
  await expect(titleCell(root, 'Customer')).toHaveFocus();
  await expect(moreOf(root, 'Customer')).toHaveAttribute('aria-expanded', 'false');

  await real.keyboard('{Shift>}{F10}{/Shift}');
  await waitFor(() => expect(isOpen(menu)).toBe(true));
  await expect(itemsOf(menu).map((item) => item.textContent)).toContain('Unpin');
  await real.keyboard('{Escape}');
  await waitFor(() => expect(isOpen(menu)).toBe(false));
  await expect(titleCell(root, 'Customer')).toHaveFocus();
  await expect(changed).toHaveBeenCalledTimes(1);

  // A real right press, on the title of Status, opens the menu at the pointer.
  const status = titleCell(root, 'Status');
  const box = status.getBoundingClientRect();
  await real.click(status, { button: 'right', position: { x: 30, y: 10 } });
  await waitFor(() => expect(isOpen(menu)).toBe(true));
  await settled(menu);
  const at = menu.getBoundingClientRect();
  near(at.left, box.left + 30 + 2, 3, 'the menu is at the pointer');
  near(at.top, box.top + 10, 3, 'the menu starts at the pointer');
  await expect(moreOf(root, 'Status')).toHaveAttribute('aria-expanded', 'true');
  await real.keyboard('{Escape}');
  await waitFor(() => expect(isOpen(menu)).toBe(false));
  await expect(status).toHaveFocus();

  // Hide: Qty goes, and the focus is on the title that took its place.
  await real.keyboard('{ArrowRight}{ArrowRight}');
  await expect(titleCell(root, 'Qty')).toHaveFocus();
  await real.keyboard('{Alt>}{ArrowDown}{/Alt}');
  await waitFor(() => expect(isOpen(menu)).toBe(true));
  await real.keyboard('{End}');
  await expect(document.activeElement).toHaveTextContent('Hide column');
  await real.keyboard('{Enter}');
  await waitFor(() => expect(isOpen(menu)).toBe(false));
  await frames();
  await expect(changed).toHaveBeenCalledTimes(2);
  await expect(captionsOf(root)).not.toContain('Qty');
  await expect(titleCell(root, 'Total')).toHaveFocus();
  await expect(document.activeElement).not.toBe(document.body);
  await expect(scrolls(root).slice(0, 2)).toEqual(before.slice(0, 2));
  await noTitleIsCut(root);
};

const MenuGrid = (props: Partial<DataGridProps<Sale>>) => (
  <ReorderGrid label="Menu" width={640} {...props} />
);

export const ColumnMenuKeys: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  args: { onColumnLayoutChange: fn() },
  render: (args) => <MenuGrid onColumnLayoutChange={args.onColumnLayoutChange} />,
  play: columnMenuKeys,
};

export const ColumnMenuKeysOnAMac: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('apple'),
  args: { onColumnLayoutChange: fn() },
  render: (args) => <MenuGrid onColumnLayoutChange={args.onColumnLayoutChange} />,
  play: columnMenuKeys,
};

/**
 * The button of the menu in a title, with a real mouse: it is not drawn at rest (it keeps its room and is
 * still there), is drawn while its title is hovered, and while the title has the focus; a press on it
 * opens the menu and leaves the focus on the title, so Escape ends there; a second press on it closes the
 * menu and does not open it again; a press on the button of another title opens that column's menu; and
 * no press on it sorts.
 */
export const ColumnMenuFromTheButton: Story = {
  tags: ['no-visual'],
  args: { onColumnLayoutChange: fn(), onSortChange: fn() },
  render: (args) => (
    <MenuGrid onColumnLayoutChange={args.onColumnLayoutChange} onSortChange={args.onSortChange} />
  ),
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = rootOf(canvasElement, 'Menu');
    await waitFor(() => expect(frameOf(root).clientHeight).toBeGreaterThan(100));
    const menu = menuOf(root);
    // The pointer of the real mouse stays where an earlier story left it: it is put over a cell first, so
    // that no title is hovered.
    await real.hover(root.querySelector('tbody td')!);
    const opacity = (caption: string) => getComputedStyle(moreOf(root, caption)).opacity;
    const textWidth = (caption: string) =>
      titleCell(root, caption).querySelector('.flg-data-grid-head-title')!.getBoundingClientRect()
        .width;
    // At rest: drawn nowhere, and the room is kept (20px, and the title's text is not cut).
    await expect(opacity('Customer')).toBe('0');
    near(
      moreOf(root, 'Customer').getBoundingClientRect().width,
      20,
      0.5,
      'the button is 20px wide',
    );
    await noTitleIsCut(root);
    const room = textWidth('Customer');
    // Hover.
    await real.hover(titleCell(root, 'Customer'));
    await expect(opacity('Customer')).toBe('1');
    await expect(opacity('Status')).toBe('0');
    await real.unhover(titleCell(root, 'Customer'));
    await waitFor(() => expect(opacity('Customer')).toBe('0'));
    near(textWidth('Customer'), room, 0.5, 'the text keeps its room');
    // Press on it: opens, and the title has the focus.
    await real.click(moreOf(root, 'Customer'));
    await waitFor(() => expect(isOpen(menu)).toBe(true));
    await expect(moreOf(root, 'Customer')).toHaveAttribute('aria-expanded', 'true');
    await expect(opacity('Customer')).toBe('1');
    await expect(itemsOf(menu)[0]).toHaveFocus();
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isOpen(menu)).toBe(false));
    await expect(titleCell(root, 'Customer')).toHaveFocus();
    // Open, then press again: closed, and not opened again.
    await real.click(moreOf(root, 'Customer'));
    await waitFor(() => expect(isOpen(menu)).toBe(true));
    await real.click(moreOf(root, 'Customer'));
    await waitFor(() => expect(isOpen(menu)).toBe(false));
    await new Promise((resolve) => setTimeout(resolve, 150));
    await expect(isOpen(menu)).toBe(false);
    await expect(moreOf(root, 'Customer')).toHaveAttribute('aria-expanded', 'false');
    await expect(titleCell(root, 'Customer')).toHaveFocus();
    // The button of another title while one is open: the menu of that column.
    await real.click(moreOf(root, 'Customer'));
    await waitFor(() => expect(isOpen(menu)).toBe(true));
    await real.click(moreOf(root, 'Total'));
    await waitFor(() => expect(moreOf(root, 'Total')).toHaveAttribute('aria-expanded', 'true'));
    await expect(isOpen(menu)).toBe(true);
    await expect(menu).toHaveAttribute('aria-label', 'Total column menu');
    await expect(moreOf(root, 'Customer')).toHaveAttribute('aria-expanded', 'false');
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isOpen(menu)).toBe(false));
    await expect(titleCell(root, 'Total')).toHaveFocus();
    // Focus on a title shows its button, and no press on a button sorted or changed a layout.
    await real.keyboard('{ArrowLeft}');
    await expect(opacity('Qty')).toBe('1');
    await expect(args.onSortChange).not.toHaveBeenCalled();
    await expect(args.onColumnLayoutChange).not.toHaveBeenCalled();
  },
};

/**
 * C1, crop d: the menu of Customer, opened from its button, with "Pin to the left" highlighted. The crop
 * is 634px wide and stands in a box 430px tall, as in the mockup: the surface is as tall as its rows, and
 * the menu hangs below it, inside the box and so inside the shot. Its titles sort (the first group of the
 * menu needs it), which the crop does not draw, and the button stands after the sort button as G1 places
 * it and not at the end of the cell, so the menu is where the button is; the crop's "Group by this
 * column" (E) is not drawn. The play opens the menu with the keyboard and moves to "Pin to the left".
 */
export const ColumnMenu: Story = {
  tags: ['viewport-1440x720'],
  render: () => (
    <div style={{ width: 634, minHeight: 430 }}>
      <CropGrid label="Menu" sortable />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    await cropBoxes(root);
    titleCell(root, 'Customer').focus();
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    const menu = menuOf(root);
    await waitFor(() => expect(isOpen(menu)).toBe(true));
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expect(document.activeElement).toHaveTextContent('Pin to the left');
    await settled(menu);
    // The menu of the crop: 236px, 4px of padding, items of 30px, and a line between the groups.
    const placed = menu.getBoundingClientRect();
    near(placed.width, 236, 0.5, 'the menu is 236px wide');
    for (const item of itemsOf(menu)) near(item.getBoundingClientRect().height, 30, 0.5, 'an item');
    await expect(menu.querySelectorAll('[role="separator"]')).toHaveLength(3);
    const first = itemsOf(menu)[0]!.getBoundingClientRect();
    near(first.top - placed.top, 5, 1, 'the first item is under the padding and the border');
    await noTitleIsCut(root);
    await hangsFromTheCrop(canvasElement, menu);
  },
};

// ---- The column chooser (spec phase 6 §3.6, §3.8, §4.3 C1 crop e) --------------------------------------

/** The columns of the stories of the menu, with Order that cannot be hidden. */
const CHOOSER_COLUMNS = REORDER_COLUMNS.map((column) =>
  'field' in column && column.field === 'id' ? { ...column, allowHiding: false } : column,
);
const ChooserGrid = (props: Partial<DataGridProps<Sale>>) => (
  <ReorderGrid
    label="Chooser"
    caption="Orders"
    columns={CHOOSER_COLUMNS}
    columnChooser
    {...props}
  />
);

const chooserButton = (root: HTMLElement) =>
  root.querySelector<HTMLButtonElement>('.flg-data-grid-chooser-button')!;
const chooserOf = (root: HTMLElement) => root.querySelector<HTMLElement>('.flg-data-grid-chooser')!;
const boxOf = (root: HTMLElement, caption: string) =>
  Array.from(chooserOf(root).querySelectorAll<HTMLInputElement>('input')).find(
    (input) => input.closest('label')?.textContent === caption,
  )!;
const regionOf = (root: HTMLElement) => root.querySelector<HTMLElement>('[aria-live="polite"]')!;

/**
 * The column chooser with the keyboard, in each engine. Tab reaches the button (a stop of its own,
 * before the table) and Enter opens the popover with the focus on its first box that can change (the
 * box of Order is disabled: it is always shown, and is not a stop of Tab). Two Tabs reach the box of
 * Channel, and Space hides the column at once: one change of the layout, the words said, the column
 * gone from the title and the rows, the popover still open and the focus still on the box. Space again
 * shows it where it was. The lock row's box is checked and disabled, and described by "Always shown".
 * Nothing is scrolled. Escape closes the popover and gives the focus back to the button.
 */
export const ColumnChooserToggles: Story = {
  tags: ['no-visual'],
  args: { onColumnLayoutChange: fn() },
  render: (args) => <ChooserGrid onColumnLayoutChange={args.onColumnLayoutChange} />,
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = rootOf(canvasElement, 'Chooser');
    await waitFor(() => expect(frameOf(root).clientHeight).toBeGreaterThan(100));
    const changed = args.onColumnLayoutChange as ReturnType<typeof fn>;
    const popover = chooserOf(root);
    const before = scrolls(root);
    const all = ['Order', 'Customer', 'Status', 'Channel', 'Qty', 'Total'];
    await expect(captionsOf(root)).toEqual(all);
    await expect(popover.matches(':popover-open')).toBe(false);
    // Tab: the button is the first stop, then Enter.
    await real.tab();
    await expect(chooserButton(root)).toHaveFocus();
    await expect(chooserButton(root)).toHaveAccessibleName('Columns');
    await real.keyboard('{Enter}');
    await waitFor(() => expect(popover.matches(':popover-open')).toBe(true));
    await expect(chooserButton(root)).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(boxOf(root, 'Customer')).toHaveFocus());
    // The lock row: the box is checked and cannot change, and says why.
    const order = boxOf(root, 'Order');
    await expect(order).toBeChecked();
    await expect(order).toBeDisabled();
    await expect(order).toHaveAccessibleDescription('Always shown');
    const row = order.closest<HTMLElement>('.flg-data-grid-chooser-row')!;
    const lock = row.querySelector<HTMLElement>('.flg-data-grid-chooser-lock')!;
    near(lock.getBoundingClientRect().width, 13, 0.5, 'the lock is 13px wide');
    near(
      lock.getBoundingClientRect().right,
      row.getBoundingClientRect().right,
      1,
      'the lock is at the end of its row',
    );
    // Channel: hidden by Space, and the popover and the focus stay.
    await real.tab();
    await expect(boxOf(root, 'Status')).toHaveFocus();
    await real.tab();
    await expect(boxOf(root, 'Channel')).toHaveFocus();
    await real.keyboard(' ');
    await waitFor(() =>
      expect(captionsOf(root)).toEqual(['Order', 'Customer', 'Status', 'Qty', 'Total']),
    );
    await expect(changed).toHaveBeenCalledTimes(1);
    await expect(changed.mock.calls[0]![0].hidden).toEqual(['channel']);
    await expect(boxOf(root, 'Channel')).not.toBeChecked();
    await expect(boxOf(root, 'Channel')).toHaveFocus();
    await expect(popover.matches(':popover-open')).toBe(true);
    await waitFor(() => expect(regionOf(root)).toHaveTextContent('Channel hidden'));
    await expect(columnCells(root, 'Channel')).toHaveLength(0);
    // Space again: shown where it was.
    await real.keyboard(' ');
    await waitFor(() => expect(captionsOf(root)).toEqual(all));
    await expect(changed).toHaveBeenCalledTimes(2);
    await expect(changed.mock.calls[1]![0].hidden).toEqual([]);
    await waitFor(() => expect(regionOf(root)).toHaveTextContent('Channel shown'));
    await expect(boxOf(root, 'Channel')).toHaveFocus();
    // Escape: closed, and the focus is on the button.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(popover.matches(':popover-open')).toBe(false));
    await expect(chooserButton(root)).toHaveFocus();
    await expect(changed).toHaveBeenCalledTimes(2);
    await expect(scrolls(root)).toEqual(before);
    await noTitleIsCut(root);
  },
};

/**
 * The column that has the active cell is hidden from the chooser, in each engine: a body cell of
 * Channel is pressed, Shift+Tab reaches the button, and the popover hides Channel with Space. The
 * focus stays on the box (the grid does not take it back), and the active cell, the grid's one stop of
 * Tab, is the cell of the same row in the column that is now at Channel's place, Qty. Escape gives the
 * focus back to the button, and Tab goes into the grid, to that cell.
 */
export const ColumnChooserHidesActiveColumn: Story = {
  tags: ['no-visual'],
  render: () => <ChooserGrid />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = rootOf(canvasElement, 'Chooser');
    await waitFor(() => expect(frameOf(root).clientHeight).toBeGreaterThan(100));
    await real.click(columnCells(root, 'Channel')[1]!);
    await expect(columnCells(root, 'Channel')[1]).toHaveFocus();
    await real.keyboard('{Shift>}{Tab}{/Shift}');
    await expect(chooserButton(root)).toHaveFocus();
    await real.keyboard('{Enter}');
    await waitFor(() => expect(boxOf(root, 'Customer')).toHaveFocus());
    await real.tab();
    await real.tab();
    await expect(boxOf(root, 'Channel')).toHaveFocus();
    await real.keyboard(' ');
    await waitFor(() => expect(captionsOf(root)).not.toContain('Channel'));
    await expect(boxOf(root, 'Channel')).toHaveFocus();
    const active = columnCells(root, 'Qty')[1]!;
    await expect(active).toHaveAttribute('tabindex', '0');
    await real.keyboard('{Escape}');
    await expect(chooserButton(root)).toHaveFocus();
    await real.tab();
    await expect(active).toHaveFocus();
  },
};

/** The columns of C1 crop e: the five of the other crops, then Channel (hidden), Qty and Total. */
const CHOOSER_CROP_COLUMNS = [
  ...CROP_COLUMNS.map((column) =>
    'field' in column && column.field === 'id' ? { ...column, allowHiding: false } : column,
  ),
  cropColumn('channel', 120),
  cropColumn('qty', 88),
  cropColumn('total', 172),
];

/**
 * C1, crop e: the chooser opened from the button at the end of the toolbar, with Channel hidden and
 * Order that cannot be hidden (the lock). The crop is 634px wide with 10px of padding, and its popover
 * hangs below it, as the mockup's does; the rows are DH-1024 and DH-1025, and the table is cut by the
 * frame after Status as the crop is. Not drawn here, as in the other looks of C: the search field (D) and
 * the export button (G), so the button is at the end of the toolbar and the popover, which follows it, is
 * lined up with its end, and its arrow points at the button; the table stands 4px lower (the grid keeps
 * 14px between the toolbar and the frame, the crop 10px). The play opens the popover with a press and
 * lets go of the focus the popover took, as the crop shows no ring.
 */
export const ColumnChooser: Story = {
  tags: ['viewport-1440x720'],
  render: () => (
    // The popover ends 307px under the top of the crop; a box of 390px leaves it the room that the
    // menu of crop d has under it, and keeps it inside the shot.
    <div style={{ width: 634, minHeight: 390 }}>
      <CropGrid
        label="Chooser"
        columns={CHOOSER_CROP_COLUMNS}
        rows={CROP_ROWS.slice(0, 2)}
        columnChooser
        defaultColumnLayout={{ hidden: ['channel'] }}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const widths = Array.from(root.querySelectorAll<HTMLElement>('th.flg-data-grid-head'), (cell) =>
      Math.round(cell.offsetWidth),
    );
    await expect(widths.slice(0, 5)).toEqual([100, 160, 190, 130, 140]);
    await noTitleIsCut(root);
    const button = chooserButton(root);
    near(button.getBoundingClientRect().width, 34, 0.5, 'the button is 34px wide');
    near(button.getBoundingClientRect().height, 34, 0.5, 'the button is 34px tall');
    await userEvent.click(button);
    const popover = chooserOf(root);
    await waitFor(() => expect(popover.matches(':popover-open')).toBe(true));
    await settled(popover);
    // The crop has no box with the focus: the popover took it to its first box, and it is let go.
    (document.activeElement as HTMLElement).blur();
    const placed = popover.getBoundingClientRect();
    const at = button.getBoundingClientRect();
    // The popover: 220px wide, lined up with the end of the button, 18px under it (8 and the arrow's 10).
    near(placed.width, 220, 0.5, 'the popover is 220px wide');
    near(placed.right, at.right, 1, 'the popover ends where the button ends');
    near(placed.top - at.bottom, 18, 1, 'the popover is 18px under the button');
    // The boxes in the order of the layout, Channel unchecked, Order checked and disabled.
    const labels = Array.from(popover.querySelectorAll('label'), (label) => label.textContent);
    await expect(labels).toEqual([
      'Order',
      'Customer',
      'Assignee',
      'Order date',
      'Status',
      'Channel',
      'Qty',
      'Total',
    ]);
    await expect(boxOf(root, 'Channel')).not.toBeChecked();
    await expect(boxOf(root, 'Order')).toBeChecked();
    await expect(boxOf(root, 'Order')).toBeDisabled();
    // The boxes are 16px, the lines are 9px apart, and the lock is 13px at the end of its row.
    const lines = Array.from(popover.querySelectorAll<HTMLElement>('.flg-checkbox'));
    for (const [at, line] of lines.entries()) {
      const next = lines[at + 1];
      if (!next) continue;
      near(
        next.getBoundingClientRect().top - line.getBoundingClientRect().bottom,
        9,
        0.5,
        'the lines of the list are 9px apart',
      );
    }
    for (const box of popover.querySelectorAll('.flg-checkbox-box'))
      near(box.getBoundingClientRect().width, 16, 0.5, 'a box is 16px');
    const lock = popover.querySelector<HTMLElement>('.flg-data-grid-chooser-lock')!;
    near(lock.getBoundingClientRect().width, 13, 0.5, 'the lock is 13px');
    near(lock.getBoundingClientRect().height, 13, 0.5, 'the lock is 13px tall');
    await expect(popover.querySelector('.flg-popover-arrow')).not.toBeNull();
    await hangsFromTheCrop(canvasElement, popover);
  },
};

// ---- Look stories: the column parts of G1 (spec phase 6 §4.1, §4.3 G1, mockup phase-6-grid.html) ------

/**
 * G1's top grid with the parts of C: the select box and Order pinned to the left (transparent at rest,
 * with the line at the edge of Order), the button of the column chooser at the end of the toolbar, and
 * the ⋮ of Customer's title under the pointer (the track background, 20px). The state is Plan B's
 * (`lookPlay`): the sort, DH-1028 and DH-1025 chosen, the focus on DH-1026 · Customer, the frame at the
 * rows 4 to 11. The harness has one pointer, so it hovers the ⋮ and not the row of DH-1030 as `GridCore`
 * does. Not drawn here: the search field and the funnels (D), the export button (G) and the add button
 * (F); and the thin lines between the titles are C1's, which G1 was drawn without (spec phase 6 §10).
 */
export const GridColumns: Story = {
  tags: ['viewport-1440x720'],
  render: () => (
    <SalesGrid
      variant="lined"
      height={459}
      columnChooser
      defaultColumnLayout={{ pinned: { id: 'left' } }}
    />
  ),
  play: async (context) => {
    const { canvasElement } = context;
    await lookPlay('lined', 'standard', (root) => moreOf(root, 'Customer'))(context);
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    // Select and Order are pinned: at rest their cells are transparent (the heading is solid, as the
    // sticky heading of every grid is) and Order has the line of its edge.
    const order = titleCell(root, 'Order');
    await expect(order).toHaveAttribute('data-pinned', 'left');
    await expect(order).toHaveAttribute('data-pin-edge');
    for (const cell of [bodyCell(canvasElement, 0, 0), bodyCell(canvasElement, 0, 1)])
      await expect(getComputedStyle(cell).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    // The ⋮ of the hovered title: 20px square.
    const more = moreOf(root, 'Customer');
    near(more.getBoundingClientRect().width, 20, 0.5, 'the ⋮ is 20px wide');
    near(more.getBoundingClientRect().height, 20, 0.5, 'the ⋮ is 20px tall');
    await expect(chooserButton(root)).toBeInTheDocument();
  },
};

/** The four rows of the crop: DH-1030, DH-1029, DH-1028 and DH-1026. */
const SCROLLED_ROWS = ['DH-1030', 'DH-1029', 'DH-1028', 'DH-1026'].map((id) =>
  SALES.find((order) => order.id === id)!,
);

/**
 * G1's second grid: the same columns in a surface of 726px with 12px of padding (a frame of 700px),
 * scrolled 274px sideways, so Customer is cut at the zone and Assignee slides under the two pinned
 * columns: solid pinned cells, the 14px shadow at the edge of Order, the hover of DH-1030 and the wash
 * and the 3px bar of DH-1028 drawn through the pinned cells. Not drawn here: the funnels (D) and the
 * mockup's scrollbar thumb of 4px (the stories hide the frame's scrollbar, as Plan B's do), and the
 * thin lines between the titles are C1's (spec phase 6 §10).
 */
export const GridColumnsScrolled: Story = {
  tags: ['viewport-1440x720'],
  render: () => (
    <div
      className="flg-surface g1-scrolled"
      style={{
        width: 726,
        boxSizing: 'border-box',
        padding: 12,
        borderRadius: 'var(--flg-radius-lg)',
      }}
    >
      <style>{'.g1-scrolled .flg-table-frame { scrollbar-width: none; }'}</style>
      <DataGrid
        aria-label="Orders"
        data={SCROLLED_ROWS}
        rowKey="id"
        columns={SALE_COLUMNS}
        locale="vi-VN"
        selectionMode="multiple"
        defaultSort={[
          { field: 'date', direction: 'desc' },
          { field: 'total', direction: 'asc' },
        ]}
        defaultSelectedKeys={['DH-1028']}
        defaultColumnLayout={{ pinned: { id: 'left' } }}
        paging={false}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const frame = frameOf(root);
    const rows = Array.from(root.querySelectorAll<HTMLElement>('tbody > tr'));
    await expect(rows.map((row) => row.textContent?.slice(0, 7))).toEqual([
      'DH-1030',
      'DH-1029',
      'DH-1028',
      'DH-1026',
    ]);
    // The frame is 700px with its border: 726, less the border of the surface and 12px of padding each side.
    near(frame.offsetWidth, 700, 0.5, 'the frame is 700px wide');
    frame.scrollLeft = 274;
    await frames();
    await expect(frame.scrollLeft).toBe(274);
    await expect(frame).toHaveAttribute('data-scrolled-left');
    // Solid pinned cells (the select box, Order) in the heading and in the rows; the shadow is 14px.
    const colour = solid(frame);
    for (const cell of [bodyCell(canvasElement, 3, 0), bodyCell(canvasElement, 3, 1)])
      await expect(getComputedStyle(cell).backgroundColor).toBe(colour);
    const shadow = getComputedStyle(titleCell(root, 'Order'), '::after');
    await expect(shadow.width).toBe('14px');
    // DH-1028 is chosen: its wash and its bar are drawn through the pinned cells.
    await expect(rows[2]).toHaveAttribute('data-selected');
    // The hover of DH-1030, drawn through the pinned cells by the harness's hover.
    rows[0]!.setAttribute('data-visual-hover', '');
    await noTitleIsCut(root);
  },
};
