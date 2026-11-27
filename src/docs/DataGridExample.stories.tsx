import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { noTitleIsCut } from '../../.storybook/data-grid-orders';
import { realUserEvent } from '../../.storybook/real-input';
import { withViewport } from '../../.storybook/viewport';
import { ASSIGNEE_ITEMS, ORDERS } from './data-grid-example/orders';
import { OrdersGrid } from './data-grid-example/OrdersGrid';

// The page "Examples/Data grid": the orders of "Lumen" in a DataGrid with what the grid offers turned
// on, wide and on a phone. The code is in `data-grid-example/`, and `DataGridExample.mdx` shows that very
// code, so what a reader copies is what the stories run.

const KEYS = ['lumen-orders-grid-v1-wide', 'lumen-orders-grid-v1-phone'];
const clearStorage = () => {
  for (const key of KEYS) localStorage.removeItem(key);
};

const meta = {
  title: 'Examples/Data grid',
  // The stage keeps 32px around the card; a phone has 16px, as an app has (the owner chose the phone look
  // from a shot with that gutter). Only this page changes the stage, and only below the phone width.
  decorators: [
    (Story) => (
      <>
        <style>{`@media (max-width: 639px) { .flg-stage { padding: 16px; } }`}</style>
        <Story />
      </>
    ),
  ],
  parameters: {
    // The example fills the window, as a page does (the stage is as big as the window); the grid is
    // not a page, so the rule about landmarks is off, as in the grid's own stories.
    stage: 'viewport',
    a11y: { config: { rules: [{ id: 'region', enabled: false }] } },
  },
  // The example keeps its state in `localStorage`, one key for each layout: no story reads what
  // another left. Only under Vitest: on the docs page the frames load these stories, and what a visitor
  // arranged there is the state the page advertises. A shot opens each story in a fresh browser
  // context, so it starts empty without this.
  beforeEach: () => {
    if ((globalThis as { __vitest_browser__?: boolean }).__vitest_browser__) clearStorage();
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * How long a story waits for the grid to show what a press or a key asked of it: the state changes in
 * the press, and the commit and the focus it gives come in the engine's next rendering update, which
 * Linux WebKit on x86 (CI) delivers late. Each message says what was missing, so a late update can be
 * told from one that never came.
 */
const RENDER_UPDATE = { timeout: 5000 };

const tableOf = (root: HTMLElement) =>
  root.querySelector<HTMLTableElement>('table[role="grid"], table[role="treegrid"]')!;
const rowOf = (root: HTMLElement, order: string) =>
  Array.from(tableOf(root).tBodies[0]!.rows).find((row) => row.textContent?.includes(order))!;
/** The cell of a row under the title of a column. */
const cellOf = (root: HTMLElement, order: string, caption: string): HTMLElement => {
  const heads = Array.from(tableOf(root).tHead!.rows[0]!.cells).filter(
    (cell) => !cell.classList.contains('flg-data-grid-filler'),
  );
  const at = heads.findIndex((head) => head.textContent?.trim() === caption);
  return Array.from(rowOf(root, order).cells).filter(
    (cell) => !cell.classList.contains('flg-data-grid-filler'),
  )[at] as HTMLElement;
};
const headOf = (root: HTMLElement, caption: string) =>
  Array.from(root.querySelectorAll<HTMLElement>('thead th')).find((th) =>
    th.textContent?.startsWith(caption),
  )!;
const captionsOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('.flg-data-grid-head-title')).map((title) => title.textContent);
const gridOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
const frameOf = (root: HTMLElement) => root.querySelector<HTMLElement>('.flg-table-frame')!;
const editedRow = (root: HTMLElement) =>
  tableOf(root).querySelector<HTMLTableRowElement>('tr[data-editing]');
const editedCell = (root: HTMLElement) =>
  tableOf(root).querySelector<HTMLElement>('td[data-editing], th[data-editing]');
/** The text of a cell with the no-break spaces of the locale made plain. */
const plain = (text: string | null | undefined) => (text ?? '').replace(/\s/g, ' ');
const vnd = (amount: number) =>
  plain(new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount));

/** The radio of a segment of the switch, found through the switch's own name. */
const segmentOf = (canvasElement: HTMLElement, name: string) =>
  within(within(canvasElement).getByRole('radiogroup', { name: 'Edit mode' })).getByRole('radio', {
    name,
  });

/** The totals of the footer, written as the cells write them: the count of the orders and the sum of Total. */
const footerOf = (root: HTMLElement) =>
  plain(root.querySelector('tfoot')?.textContent).replace(/\s+/g, ' ').trim();

/**
 * What both looks have at rest, the ruling's "calm default" (spec phase 6 §8): the pointer is off the
 * grid and no cell has the focus; the orders are sorted by date, newest first; two rows are chosen;
 * nothing is grouped and no detail is open, so the tray shows its hint; the filter row, the funnels and
 * the footer of totals are there; no title is cut; and the whole card is inside the stage.
 */
async function atRest(canvasElement: HTMLElement) {
  const root = gridOf(canvasElement);
  const real = await realUserEvent();
  await real?.unhover(root);
  await expect(root.contains(document.activeElement), 'no cell has the focus').toBe(false);
  await noTitleIsCut(canvasElement);

  const rows = Array.from(tableOf(root).tBodies[0]!.rows);
  await expect(rows[0]).toHaveTextContent('DH-1040');
  await expect(rows.filter((row) => row.getAttribute('aria-selected') === 'true')).toHaveLength(2);
  await expect(rowOf(root, 'DH-1038')).toHaveAttribute('aria-selected', 'true');
  await expect(rowOf(root, 'DH-1033')).toHaveAttribute('aria-selected', 'true');
  await expect(root.querySelector('.flg-data-grid-group-row')).toBeNull();
  await expect(root.querySelector('.flg-data-grid-detail-row')).toBeNull();
  await expect(root.querySelector('.flg-data-grid-chip-button')).toBeNull();
  await expect(root.querySelector('.flg-data-grid-group-hint')).not.toBeNull();
  await expect(root.querySelector('input[type="search"]')).toHaveValue('');
  await expect(root.querySelector('.flg-data-grid-filter-row')).not.toBeNull();

  // The footer adds up all the orders, not the page.
  const sum = ORDERS.reduce((all, order) => all + order.total, 0);
  await expect(footerOf(root)).toContain(`Orders: ${ORDERS.length}`);
  await expect(footerOf(root)).toContain(vnd(sum));

  // The whole card is inside the stage: the stage is the window, and nothing of the card is below
  // the room that its padding leaves.
  const stage = canvasElement.querySelector<HTMLElement>('.flg-stage')!;
  const card = canvasElement.querySelector<HTMLElement>('.flg-card')!;
  const padding = parseFloat(getComputedStyle(stage).paddingBottom);
  // A stage that grew is taller than the window: the shot would be longer than the page.
  await expect(stage.getBoundingClientRect().height, 'the stage grew').toBe(window.innerHeight);
  await expect(
    card.getBoundingClientRect().bottom,
    `the card ends at ${card.getBoundingClientRect().bottom}, the stage at ${stage.getBoundingClientRect().bottom}`,
  ).toBeLessThanOrEqual(stage.getBoundingClientRect().bottom - padding);
  await expect(card.getBoundingClientRect().right).toBeLessThanOrEqual(
    stage.getBoundingClientRect().right - padding,
  );
}

const render = () => <OrdersGrid />;

/**
 * The orders of "Lumen" on a wide screen: G1's card and toolbar (the caption, the tray with its hint, the
 * search, the column chooser, the export and the add button), the filter row and the funnels, the footer of
 * totals, sorted by date, newest first, with two rows chosen and Order pinned to the left. The eight
 * columns do not fit the frame without a sideways scroll, so Channel is hidden at first; it is in the
 * column chooser.
 */
export const DataGridExample: Story = {
  tags: ['viewport-1280x720'],
  render,
  play: async ({ canvasElement }) => {
    await withViewport(async (viewport) => {
      await viewport.set(1280, 720);
      const root = gridOf(canvasElement);
      await waitFor(
        () => expect(captionsOf(root), 'the wide layout').toContain('Assignee'),
        RENDER_UPDATE,
      );
      await atRest(canvasElement);
      await expect(captionsOf(root)).toEqual([
        'Order',
        'Customer',
        'Assignee',
        'Order date',
        'Status',
        'Qty',
        'Total',
      ]);
      await expect(headOf(root, 'Order date')).toHaveAttribute('aria-sort', 'descending');
      await expect(headOf(root, 'Order')).toHaveAttribute('data-pinned', 'left');
      // The columns fit the frame: nothing scrolls sideways.
      const frame = frameOf(root);
      await expect(
        frame.scrollWidth,
        `the frame scrolls: ${frame.scrollWidth} in ${frame.clientWidth}`,
      ).toBeLessThanOrEqual(frame.clientWidth);
      // The toolbar is one row.
      const toolbar = root.querySelector<HTMLElement>('.flg-data-grid-toolbar')!;
      await expect(toolbar.getBoundingClientRect().height).toBeLessThan(60);
    });
  },
};

/**
 * The same example on a phone: Order, Customer, Status and Total, the other columns in the column
 * chooser, and nothing pinned, since a pinned zone would leave next to no room to scroll. The frame scrolls
 * sideways; the toolbar and the pager wrap, as the grid is built.
 */
export const DataGridExamplePhone: Story = {
  tags: ['viewport-390x844'],
  render,
  play: async ({ canvasElement }) => {
    await withViewport(async (viewport) => {
      await viewport.set(390, 844);
      const root = gridOf(canvasElement);
      await waitFor(
        () => expect(captionsOf(root), 'the phone layout').not.toContain('Assignee'),
        RENDER_UPDATE,
      );
      await atRest(canvasElement);
      await expect(captionsOf(root)).toEqual(['Order', 'Customer', 'Status', 'Total']);
      // Order date is in the chooser, and a hidden column is not sorted by: Order stands in.
      await expect(headOf(root, 'Order')).toHaveAttribute('aria-sort', 'descending');
      await expect(root.querySelector('[data-pinned]'), 'nothing is pinned').toBeNull();
      const frame = frameOf(root);
      await expect(
        frame.scrollWidth,
        `the frame does not scroll: ${frame.scrollWidth} in ${frame.clientWidth}`,
      ).toBeGreaterThan(frame.clientWidth);
      // The phone's gutter is 16px: the card is the width of the stage less two of them, and ends above
      // the stage's bottom with the room that the gutter leaves.
      const stage = canvasElement.querySelector<HTMLElement>('.flg-stage')!.getBoundingClientRect();
      const card = canvasElement.querySelector<HTMLElement>('.flg-card')!.getBoundingClientRect();
      await expect([card.left, card.right], 'the gutter is 16px').toEqual([16, stage.right - 16]);
      await expect(card.bottom, 'the card ends in the stage').toBeLessThanOrEqual(
        stage.bottom - 16,
      );
      await expect(frame.clientWidth, 'the frame is the card less its padding').toBeLessThan(
        card.width,
      );
    });
  },
};

// ---------------------------------------------------------------------------------------------------
// Behaviour, in the real engines. Nothing here is a look: a screenshot cannot say it. The tags are
// written on each story, not in a helper: the Storybook indexer reads them without running the file.

/** A story of the wide layout: the window is set to it, whatever size the runner opened. */
const wide = (run: (root: HTMLElement, canvasElement: HTMLElement) => Promise<void>) =>
  (async ({ canvasElement }) => {
    await withViewport(async (viewport) => {
      await viewport.set(1280, 720);
      const root = gridOf(canvasElement);
      await waitFor(
        () => expect(captionsOf(root), 'the wide layout').toContain('Assignee'),
        RENDER_UPDATE,
      );
      await run(root, canvasElement);
    });
  }) satisfies Story['play'];

/**
 * The switch above the grid changes `editing.mode`: row mode has the Edit buttons, cell mode edits a
 * cell on a press, batch mode holds a change and shows the save bar, form mode opens a form in the place
 * of the row and popup mode a Dialog. A switch drops what was not saved: the bar goes and the value is the
 * saved one.
 */
export const ExampleEditModes: Story = {
  tags: ['no-visual'],
  render,
  play: wide(async (root, canvasElement) => {
    const real = await realUserEvent();
    if (!real) return;
    await real.unhover(root);
    const edit = (order: string) =>
      root.querySelector<HTMLElement>(`button[aria-label="Edit ${order}"]`);
    const bar = () => root.querySelector<HTMLElement>('.flg-data-grid-savebar');
    const form = () => tableOf(root).querySelector('form.flg-data-grid-form');
    const choose = async (name: string) => {
      await real.click(segmentOf(canvasElement, name));
      await waitFor(
        () =>
          expect(
            segmentOf(canvasElement, name),
            `the ${name} mode is not chosen within 5 s: late if the segment has focus, lost if the press never reached it`,
          ).toBeChecked(),
        RENDER_UPDATE,
      );
    };

    // Row: the action column has an Edit button on every row.
    await expect(segmentOf(canvasElement, 'Row')).toBeChecked();
    await expect(edit('DH-1040'), 'row mode has Edit').not.toBeNull();

    // Cell: no Edit button, and a press on a Customer cell opens its editor.
    await choose('Cell');
    await waitFor(() => expect(edit('DH-1040'), 'cell mode has no Edit').toBeNull(), RENDER_UPDATE);
    await real.click(cellOf(root, 'DH-1040', 'Customer'));
    await waitFor(
      () => expect(editedCell(root)?.querySelector('input'), 'a cell editor opened').toBeTruthy(),
      RENDER_UPDATE,
    );
    await real.keyboard('{Escape}');
    await waitFor(
      () =>
        expect(
          editedCell(root),
          'the cell editor is still open 5 s after Esc: late if it closes later, lost if the key never reached it',
        ).toBeNull(),
      RENDER_UPDATE,
    );

    // Batch: a change is held, and the bar says so.
    await choose('Batch');
    await real.click(cellOf(root, 'DH-1040', 'Customer'));
    await waitFor(
      () => expect(editedCell(root)?.querySelector('input'), 'a cell editor opened').toBeTruthy(),
      RENDER_UPDATE,
    );
    await real.fill(editedCell(root)!.querySelector('input')!, 'Nguyễn Văn Hoa');
    await real.keyboard('{Enter}');
    await waitFor(() => expect(bar(), 'the save bar shows').not.toBeNull(), RENDER_UPDATE);
    await expect(bar()).toHaveTextContent('1 unsaved change');

    // Back to row: what was not saved is dropped, the bar is gone, and the cell holds the saved value.
    await choose('Row');
    await waitFor(() => expect(bar(), 'the bar went').toBeNull(), RENDER_UPDATE);
    await expect(cellOf(root, 'DH-1040', 'Customer')).toHaveTextContent(ORDERS[39]!.customer);
    await expect(cellOf(root, 'DH-1040', 'Customer')).not.toHaveTextContent('Nguyễn Văn Hoa');

    // Form: Edit opens a form in the place of the row.
    await choose('Form');
    await real.hover(rowOf(root, 'DH-1039'));
    await real.click(edit('DH-1039')!);
    await waitFor(() => expect(form(), 'the form opened').not.toBeNull(), RENDER_UPDATE);
    await real.keyboard('{Escape}');
    await waitFor(() => expect(form(), 'the form closed').toBeNull(), RENDER_UPDATE);

    // Popup: Edit opens a Dialog over the grid.
    await choose('Popup');
    await real.hover(rowOf(root, 'DH-1039'));
    await real.click(edit('DH-1039')!);
    await waitFor(
      () => expect(document.querySelector('dialog[open]'), 'the dialog opened').not.toBeNull(),
      RENDER_UPDATE,
    );
    await real.keyboard('{Escape}');
    await waitFor(
      () => expect(document.querySelector('dialog[open]'), 'the dialog closed').toBeNull(),
      RENDER_UPDATE,
    );
  }),
};

/**
 * Row mode: Edit, type a customer, Enter. The cell shows what was typed once the save has gone through
 * `onSaving` to the example's own list, and the footer's count is what it was.
 */
export const ExampleSaves: Story = {
  tags: ['no-visual'],
  render,
  play: wide(async (root) => {
    const real = await realUserEvent();
    if (!real) return;
    await real.unhover(root);
    const before = footerOf(root);
    await real.hover(rowOf(root, 'DH-1039'));
    await real.click(root.querySelector<HTMLElement>('button[aria-label="Edit DH-1039"]')!);
    await waitFor(
      () => expect(editedRow(root), 'the row is being edited').not.toBeNull(),
      RENDER_UPDATE,
    );
    const editor = editedRow(root)!.querySelector<HTMLInputElement>(
      'input[aria-label="Customer"]',
    )!;
    await real.fill(editor, 'Nguyễn Văn Hoa');
    await real.keyboard('{Enter}');
    await waitFor(() => expect(editedRow(root), 'the edit ended').toBeNull(), RENDER_UPDATE);
    await waitFor(
      () =>
        expect(
          cellOf(root, 'DH-1039', 'Customer'),
          'the cell shows what was saved',
        ).toHaveTextContent('Nguyễn Văn Hoa'),
      RENDER_UPDATE,
    );
    await expect(footerOf(root)).toBe(before);
  }),
};

/** Two visits to the page: the second mounts the example anew, which reads the storage again. */
const Visits = () => {
  const [visit, setVisit] = useState(1);
  return (
    <div data-testid="visits" style={{ width: '100%' }}>
      <button type="button" onClick={() => setVisit((count) => count + 1)}>
        Reload
      </button>
      <OrdersGrid key={visit} />
    </div>
  );
};

/**
 * What a person arranges stays: a press on Customer sorts by it, the sort is in the storage under the
 * key of the wide layout (the phone layout has none), and a new visit has it back.
 */
export const ExampleSavedState: Story = {
  tags: ['no-visual'],
  render: () => <Visits />,
  play: wide(async (root, canvasElement) => {
    try {
      const visits = within(canvasElement.querySelector<HTMLElement>('[data-testid="visits"]')!);
      const sortOf = () => headOf(gridOf(canvasElement), 'Customer');
      await expect(sortOf()).not.toHaveAttribute('aria-sort');
      sortOf().querySelector<HTMLElement>('.flg-table-sort')!.click();
      await waitFor(
        () => expect(sortOf(), 'the press sorted').toHaveAttribute('aria-sort', 'ascending'),
        RENDER_UPDATE,
      );
      await expect(JSON.parse(localStorage.getItem(KEYS[0]!)!).sort).toEqual([
        { field: 'customer', direction: 'asc' },
      ]);
      await expect(localStorage.getItem(KEYS[1]!)).toBeNull();

      visits.getByRole('button', { name: 'Reload' }).click();
      await waitFor(
        () => expect(root.isConnected, 'the grid mounted anew').toBe(false),
        RENDER_UPDATE,
      );
      // The new visit draws the default state first, then reads the storage after it mounts.
      await waitFor(
        () => expect(sortOf(), 'the sort is back').toHaveAttribute('aria-sort', 'ascending'),
        RENDER_UPDATE,
      );
    } finally {
      clearStorage();
    }
  }),
};

/**
 * The export button: one press downloads `lumen-orders.csv`, whose second line holds the fields of the
 * first row the grid shows. The download is never real: `URL.createObjectURL` and the click of the anchor
 * are stubbed, and put back in `finally`.
 */
export const ExampleExport: Story = {
  tags: ['no-visual'],
  render,
  play: wide(async (root) => {
    const blobs: Blob[] = [];
    const named: string[] = [];
    const { createObjectURL, revokeObjectURL } = URL;
    const { click } = HTMLAnchorElement.prototype;
    URL.createObjectURL = (blob: Blob | MediaSource) => {
      blobs.push(blob as Blob);
      return 'blob:story';
    };
    URL.revokeObjectURL = () => {};
    HTMLAnchorElement.prototype.click = function stubbed(this: HTMLAnchorElement) {
      named.push(this.download);
    };
    try {
      within(root).getByRole('button', { name: 'Export CSV' }).click();
      await waitFor(() => expect(blobs, 'one blob').toHaveLength(1), RENDER_UPDATE);
      await expect(named).toEqual(['lumen-orders.csv']);
      const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(
        await blobs[0]!.arrayBuffer(),
      );
      const lines = text.slice(1).split('\r\n');
      const heading = lines[0]!.split(',');
      // The first row is the newest order; its fields are what its cells write, in the columns' order.
      await expect(rowOf(root, 'DH-1040')).toBe(tableOf(root).tBodies[0]!.rows[0]);
      const assignee = ASSIGNEE_ITEMS.find((item) => item.value === ORDERS[39]!.assignee)!.text;
      await expect(lines[1]!.split(',').map(plain)).toEqual(
        heading.map((caption) =>
          caption === 'Assignee' ? assignee : plain(cellOf(root, 'DH-1040', caption)?.textContent),
        ),
      );
      // A record for each of the 40 orders, and the CRLF that ends the last.
      await expect(lines).toHaveLength(1 + ORDERS.length + 1);
    } finally {
      URL.createObjectURL = createObjectURL;
      URL.revokeObjectURL = revokeObjectURL;
      HTMLAnchorElement.prototype.click = click;
    }
  }),
};

/**
 * Batch mode: two rows are added before one save, each with a customer. The app gives each its own
 * order number when it saves (`DH-1041`, then `DH-1042`), so the list has 42 orders and no two share a
 * key.
 */
export const ExampleAddsOrders: Story = {
  tags: ['no-visual'],
  render,
  play: wide(async (root, canvasElement) => {
    const real = await realUserEvent();
    if (!real) return;
    try {
      await real.unhover(root);
      await real.click(segmentOf(canvasElement, 'Batch'));
      await waitFor(
        () =>
          expect(
            segmentOf(canvasElement, 'Batch'),
            'the Batch mode is not chosen within 5 s: late if the segment has focus, lost if the press never reached it',
          ).toBeChecked(),
        RENDER_UPDATE,
      );
      for (const customer of ['Khách mới A', 'Khách mới B']) {
        await real.click(within(root).getByRole('button', { name: 'Add row' }));
        await waitFor(
          () =>
            expect(
              editedCell(root)?.querySelector('input'),
              `the editor of the new row for ${customer} did not open within 5 s`,
            ).toBeTruthy(),
          RENDER_UPDATE,
        );
        await real.fill(editedCell(root)!.querySelector('input')!, customer);
        await real.keyboard('{Enter}');
        await waitFor(
          () => expect(editedCell(root), `${customer} was not committed within 5 s`).toBeNull(),
          RENDER_UPDATE,
        );
      }
      await real.click(within(root).getByRole('button', { name: 'Save changes' }));
      await waitFor(
        () =>
          expect(footerOf(root), 'the save did not add two orders within 5 s').toContain(
            'Orders: 42',
          ),
        RENDER_UPDATE,
      );
      // Only the two new orders are left to read: they are on any page, so the search finds them.
      await real.fill(root.querySelector<HTMLInputElement>('input[type="search"]')!, 'Khách mới');
      await waitFor(
        () =>
          expect(
            tableOf(root).tBodies[0]!.rows,
            'the search did not find the two new orders within 5 s',
          ).toHaveLength(2),
        RENDER_UPDATE,
      );
      const ids = Array.from(tableOf(root).tBodies[0]!.rows)
        .map((row) => /DH-\d+/.exec(row.textContent ?? '')?.[0])
        .sort();
      await expect(ids, 'two different order numbers').toEqual(['DH-1041', 'DH-1042']);
    } finally {
      clearStorage();
    }
  }),
};
