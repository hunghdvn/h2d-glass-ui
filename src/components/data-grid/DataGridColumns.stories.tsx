import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';
import { expect, waitFor } from 'storybook/test';
import { SALES, SALE_COLUMNS } from '../../../.storybook/data-grid-orders';
import type { Sale } from '../../../.storybook/data-grid-orders';
import { realUserEvent } from '../../../.storybook/real-input';
import { DataGrid } from './DataGrid';
import type { DataGridHandle, DataGridProps } from './index';

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
    for (const label of ['Lined', 'Striped', 'Minimal']) {
      const grid = canvasElement.querySelector<HTMLElement>(`[data-testid="${label}"]`)!;
      const wrapper = grid.closest<HTMLElement>('.flg-data-grid')!;
      wrapper.scrollIntoView({ block: 'center' });
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
      for (const [left, top] of [
        [200, 0],
        [200, 90],
        [500, 90],
      ] as const) {
        frame.scrollLeft = left;
        frame.scrollTop = top;
        await waitFor(() => expect(frame).toHaveAttribute('data-scrolled-left'));
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
      await waitFor(() => expect(frame).not.toHaveAttribute('data-scrolled-right'));
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
    await expect(zones()).toEqual({ left: 104, right: 180 });
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
    await real.keyboard('{End}');
    await expect(cell(2, 7)).toHaveFocus();
    await frames();
    const atTotal = frame.scrollLeft;
    await real.keyboard('{ArrowLeft}');
    await expect(cell(2, 6)).toHaveFocus();
    await frames();
    await clearOfZones(cell(2, 6));
    const atQty = frame.scrollLeft;
    await real.keyboard('{ArrowRight}');
    await expect(cell(2, 7)).toHaveFocus();
    await frames();
    await expect(frame.scrollLeft).toBe(atQty);
    await expect(atTotal).toBeGreaterThanOrEqual(0);

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
