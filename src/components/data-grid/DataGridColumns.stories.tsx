import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';
import { expect, fn, waitFor } from 'storybook/test';
import { PAGE_ONE, SALES, SALE_COLUMNS } from '../../../.storybook/data-grid-orders';
import type { Sale } from '../../../.storybook/data-grid-orders';
import { onPlatform } from '../../../.storybook/platform';
import { realUserEvent } from '../../../.storybook/real-input';
import type { RealUserEvent } from '../../../.storybook/real-input';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridHandle, DataGridProps } from './index';

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

/** No title is cut: a later part of a heading that takes room cannot cut one without a story failing. */
const noTitleIsCut = async (root: HTMLElement) => {
  const titles = Array.from(root.querySelectorAll<HTMLElement>('.flg-data-grid-head-title'));
  await expect(titles.length).toBeGreaterThan(0);
  for (const title of titles)
    await expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth);
};

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
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
];
const ResizeGrid = (props: Partial<DataGridProps<Sale>>) => (
  <div style={{ width: 640 }}>
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
 * The keys, which are the same on both platforms: <kbd>Alt+Shift+→</kbd> three times on a title makes
 * its column 30px wider, one change of the layout for each press, and the new width is said once, after
 * the last of them. A held key does not scroll the frame.
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
  // Said once, a moment after the last press.
  await waitFor(() => expect(said).toEqual(['Customer, 220 pixels wide']), { timeout: 3000 });
  await new Promise((resolve) => setTimeout(resolve, 700));
  await expect(said).toEqual(['Customer, 220 pixels wide']);
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

/** The columns of the crops a and b of C1: Order 100, Customer 160, Assignee 190, Order date 130, Status 140. */
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
const CropGrid = ({ label }: { label: string }) => (
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
      data={CROP_ROWS}
      rowKey="id"
      columns={CROP_COLUMNS}
      allowSorting={false}
      paging={false}
      locale="vi-VN"
    />
  </div>
);

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
