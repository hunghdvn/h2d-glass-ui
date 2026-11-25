import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor } from 'storybook/test';
import { realUserEvent } from '../../../.storybook/real-input';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridProps } from './index';

/**
 * The orders of E2 (spec phase 6 §4.3 E2, mockup question E): the rows DH-1026 to DH-1030 that the mockup draws,
 * with a status, an assignee, a channel and a note. The names, dates and figures are the mockup's; the words of
 * the grid and the captions are English.
 */
interface EditOrder {
  id: string;
  customer: string;
  assignee: string;
  date: string;
  status: 'new' | 'processing' | 'delivered' | 'cancelled';
  channel: string;
  qty: number;
  total: number;
  paid: boolean;
  note: string;
}

const EDIT_ORDERS: readonly EditOrder[] = [
  {
    id: 'DH-1030',
    customer: 'Quán Cà phê Mộc',
    assignee: 'lan',
    date: '2026-11-07',
    status: 'delivered',
    channel: 'Phone',
    qty: 15,
    total: 17800000,
    paid: true,
    note: 'Giao buổi sáng',
  },
  {
    id: 'DH-1029',
    customer: 'Trần Minh Anh',
    assignee: 'huy',
    date: '2026-11-06',
    status: 'processing',
    channel: 'Website',
    qty: 4,
    total: 5200000,
    paid: false,
    note: '',
  },
  {
    id: 'DH-1028',
    customer: 'Công ty Bình Minh',
    assignee: 'lan',
    date: '2026-11-05',
    status: 'processing',
    channel: 'Store',
    qty: 9,
    total: 8750000,
    paid: false,
    note: 'Xuất hoá đơn VAT',
  },
  {
    id: 'DH-1027',
    customer: 'Tiệm Hoa Sen',
    assignee: 'huy',
    date: '2026-11-04',
    status: 'delivered',
    channel: 'Store',
    qty: 10,
    total: 12000000,
    paid: true,
    note: '',
  },
  {
    id: 'DH-1026',
    customer: 'Nguyễn Thị Hà',
    assignee: 'lan',
    date: '2026-11-03',
    status: 'cancelled',
    channel: 'Website',
    qty: 1,
    total: 890000,
    paid: false,
    note: 'Khách huỷ',
  },
];

const STATUS_ITEMS = [
  { value: 'new', text: 'New' },
  { value: 'processing', text: 'Processing' },
  { value: 'delivered', text: 'Delivered' },
  { value: 'cancelled', text: 'Cancelled' },
];

const EDIT_COLUMNS: DataGridColumn<EditOrder>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 110, allowEditing: false },
  { field: 'customer', caption: 'Customer', width: 200 },
  {
    field: 'status',
    caption: 'Status',
    width: 150,
    lookup: { items: STATUS_ITEMS, valueField: 'value', displayField: 'text' },
  },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 130 },
  { field: 'date', caption: 'Order date', dataType: 'date', width: 170 },
  { field: 'paid', caption: 'Paid', dataType: 'boolean', width: 80 },
  {
    field: 'total',
    caption: 'Total',
    dataType: 'number',
    width: 140,
    allowEditing: false,
    format: { style: 'currency', currency: 'VND', maximumFractionDigits: 0 },
  },
];

const meta = {
  title: 'Components/DataGrid/Editing',
  component: DataGrid,
  // Built but not released until the grid is exported (spec phase 6 §2): hidden from the sidebar of the built
  // docs, still run by the story tests and shot by the visual harness.
  tags: ['unreleased'],
  args: {
    data: EDIT_ORDERS,
    rowKey: 'id',
    columns: EDIT_COLUMNS,
    'aria-label': 'Orders',
    locale: 'en-US',
    paging: false,
    editing: { mode: 'row' },
  },
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'region', enabled: false }],
      },
    },
  },
} satisfies Meta<DataGridProps<EditOrder>>;

export default meta;
type Story = StoryObj<DataGridProps<EditOrder>>;

/**
 * How long a story waits for the grid to show what a key or a press asked of it: the state changes in the
 * press, and the commit and the focus it gives come in the engine's next rendering update, which Linux WebKit on
 * x86 (CI) delivers late. `waitFor` waits one second by default; a late update came within five. Each message
 * says what was missing, so a late update can be told from one that never came.
 */
const RENDER_UPDATE = { timeout: 5000 };
/** And the listbox of a Select and the calendar of a DatePicker, which fade in (up to ten seconds on that WebKit). */
const POPUP_SHOWN = { timeout: 10000 };

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
const editButton = (root: HTMLElement, order: string) =>
  root.querySelector<HTMLElement>(`button[aria-label="Edit ${order}"]`)!;
const editedRow = (root: HTMLElement) =>
  tableOf(root).querySelector<HTMLTableRowElement>('tr[data-editing]');
const editorOf = (root: HTMLElement, caption: string) =>
  editedRow(root)!.querySelector<HTMLElement>(`[aria-label="${caption}"]`)!;
const active = () => document.activeElement as HTMLElement;
const nameOf = (element: Element) => element.getAttribute('aria-label') ?? element.tagName;

/**
 * Editing a row with real keys (spec phase 6 §3.6, §6.3 "Năm chế độ"): `Enter` on a cell starts the edit in the
 * editor of that column; `Tab` goes through the editors, then ✓ and ✕, then out of the grid; `Shift+Tab` comes
 * back; `Enter` in an editor saves and the focus is on that cell; `Esc` gives the edit up and the focus is on the
 * cell, never on the page. What a key burst does is not counted: the story asserts what it ends in.
 */
export const RowEditKeys: Story = {
  tags: ['no-visual'],
  args: { onSaving: fn() },
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const saved = args.onSaving as ReturnType<typeof fn>;
    const table = tableOf(root);
    // The row height of the grid with its buttons: 45px, the height of E2's rows that hold a button.
    await expect(rowOf(root, 'DH-1028').offsetHeight).toBe(45);

    // `Enter` on the Customer cell starts the edit, in the editor of that column.
    await real.click(cellOf(root, 'DH-1028', 'Customer'));
    await real.keyboard('{Enter}');
    await waitFor(
      () => expect(editorOf(root, 'Customer'), 'the customer editor has the focus').toHaveFocus(),
      RENDER_UPDATE,
    );
    await expect(editedRow(root)).toBe(rowOf(root, 'DH-1028'));
    await expect(rowOf(root, 'DH-1030').hasAttribute('data-editing')).toBe(false);
    await real.fill(editorOf(root, 'Customer'), 'Nguyễn Văn Hoa');
    await expect((editorOf(root, 'Customer') as HTMLInputElement).value).toBe('Nguyễn Văn Hoa');

    // `Tab` visits the editors in order, then ✓ and ✕, then leaves the grid.
    const seen: string[] = [];
    for (let tabs = 0; tabs < 7 && table.contains(active()); tabs += 1) {
      await real.tab();
      if (table.contains(active())) seen.push(nameOf(active()));
    }
    await expect(seen).toEqual([
      'Status',
      'Qty',
      'Order date',
      'Choose date',
      'Paid',
      'Save DH-1028',
      'Cancel editing DH-1028',
    ]);
    await real.tab();
    await waitFor(
      () => expect(table.contains(active()), 'the focus left the grid').toBe(false),
      RENDER_UPDATE,
    );
    // The row stays being edited.
    await expect(editedRow(root)).toBe(rowOf(root, 'DH-1028'));
    // The focus goes back to ✕ (where the page puts it again is the engine's), and `Shift+Tab` goes on to ✓ and the
    // editors in the opposite order.
    editedRow(root)!.querySelector<HTMLElement>('[aria-label="Cancel editing DH-1028"]')!.focus();
    const back: string[] = [];
    for (let tabs = 0; tabs < 7; tabs += 1) {
      await real.tab({ shift: true });
      back.push(nameOf(active()));
    }
    await expect(back).toEqual([
      'Save DH-1028',
      'Paid',
      'Choose date',
      'Order date',
      'Qty',
      'Status',
      'Customer',
    ]);

    // `Enter` in an editor saves: one call, the changed field only, and the focus is on the cell.
    await real.keyboard('{Enter}');
    await waitFor(() => expect(editedRow(root), 'the edit ended').toBeNull(), RENDER_UPDATE);
    await expect(saved).toHaveBeenCalledTimes(1);
    const [changes] = saved.mock.calls[0] as [{ type: string; key: string; data: object }[]];
    await expect(changes).toHaveLength(1);
    await expect(changes[0]).toMatchObject({
      type: 'update',
      key: 'DH-1028',
      data: { customer: 'Nguyễn Văn Hoa' },
    });
    await expect(Object.keys(changes[0]!.data)).toEqual(['customer']);
    await expect(active()).toBe(cellOf(root, 'DH-1028', 'Customer'));

    // `Esc` gives the edit up: the value goes back and the focus is on the cell.
    await real.keyboard('{Enter}');
    await waitFor(() => expect(editorOf(root, 'Customer')).toHaveFocus(), RENDER_UPDATE);
    await real.fill(editorOf(root, 'Customer'), 'Khác');
    await real.keyboard('{Escape}');
    await waitFor(() => expect(editedRow(root), 'the edit ended').toBeNull(), RENDER_UPDATE);
    await expect(active()).toBe(cellOf(root, 'DH-1028', 'Customer'));
    await expect(saved).toHaveBeenCalledTimes(1);
    await expect(cellOf(root, 'DH-1028', 'Customer').textContent).toBe('Công ty Bình Minh');

    // The button starts an edit too, on the first editor; ✕ gives it up and the focus is on its cell.
    await real.click(editButton(root, 'DH-1029'));
    await waitFor(() => expect(editorOf(root, 'Customer')).toHaveFocus(), RENDER_UPDATE);
    await real.click(
      root.querySelector<HTMLElement>('button[aria-label="Cancel editing DH-1029"]')!,
    );
    await waitFor(() => expect(editedRow(root)).toBeNull(), RENDER_UPDATE);
    await expect(table.contains(active()) && active() !== document.body).toBe(true);
  },
};

/**
 * The popups of the editors take the first `Esc` (spec phase 6 §6.3): with the listbox of the Select open `Esc`
 * closes it and the row is still being edited; the second `Esc` gives the edit up. The same with the calendar of
 * the DatePicker.
 */
export const RowEditPopups: Story = {
  tags: ['no-visual'],
  args: { onSaving: fn() },
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const saved = args.onSaving as ReturnType<typeof fn>;
    const open = (trigger: HTMLElement) =>
      document.querySelector<HTMLElement>(`#${trigger.getAttribute('aria-controls')}`);

    await real.click(editButton(root, 'DH-1028'));
    await waitFor(() => expect(editorOf(root, 'Customer')).toHaveFocus(), RENDER_UPDATE);
    // The pointer rests on the button of the press, where ✓ and ✕ are now: a tooltip that it opens takes the first
    // `Esc` (it is dismissed first), so the pointer is taken off the grid.
    await real.unhover(root);

    // The Select: opened with a key (Enter would save, as it does in any editor), closed by the first Esc.
    await real.tab();
    const status = editorOf(root, 'Status');
    await expect(status).toHaveFocus();
    await real.keyboard('{ArrowDown}');
    await waitFor(
      () => expect(status.getAttribute('aria-expanded'), 'the listbox is open').toBe('true'),
      POPUP_SHOWN,
    );
    await expect(open(status)?.matches(':popover-open')).toBe(true);
    await real.keyboard('{Escape}');
    await waitFor(
      () => expect(status.getAttribute('aria-expanded'), 'the listbox is closed').toBe('false'),
      POPUP_SHOWN,
    );
    await expect(editedRow(root), 'the first Esc only closed the listbox').not.toBeNull();
    await expect(status).toHaveFocus();

    // The DatePicker: its calendar is opened by its button, and closed by the first Esc.
    const calendar = editedRow(root)!.querySelector<HTMLElement>('[aria-label="Choose date"]')!;
    await real.click(calendar);
    await waitFor(
      () => expect(calendar.getAttribute('aria-expanded'), 'the calendar is open').toBe('true'),
      POPUP_SHOWN,
    );
    await real.keyboard('{Escape}');
    await waitFor(
      () => expect(calendar.getAttribute('aria-expanded'), 'the calendar is closed').toBe('false'),
      POPUP_SHOWN,
    );
    await expect(editedRow(root), 'the first Esc only closed the calendar').not.toBeNull();

    // The second Esc gives the edit up, and nothing was saved.
    await real.keyboard('{Escape}');
    await waitFor(
      () =>
        expect(editedRow(root), `the edit ended (${active().outerHTML.slice(0, 160)})`).toBeNull(),
      RENDER_UPDATE,
    );
    await expect(saved).not.toHaveBeenCalled();
    await expect(document.activeElement).not.toBe(document.body);
  },
};

/**
 * Edit is there for a screen reader at all times, and drawn by the pointer, the focus and the active place
 * (spec phase 6 §4.3 E2): `opacity: 0` at rest, 1 under the pointer and while it holds the focus, and the buttons
 * of the row being edited are always drawn. The rows are read at rest, with the pointer off the grid.
 */
export const RowEditHover: Story = {
  tags: ['no-visual'],
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const opacityOf = (order: string) =>
      Number(
        getComputedStyle(
          rowOf(root, order).querySelector<HTMLElement>('.flg-data-grid-action-buttons')!,
        ).opacity,
      );
    // The pointer a story before this one left may be over a row: it is taken off the grid first.
    await real.unhover(root);
    await waitFor(
      () => expect(opacityOf('DH-1029'), 'Edit is hidden at rest').toBe(0),
      RENDER_UPDATE,
    );
    await expect(opacityOf('DH-1030')).toBe(0);
    const button = editButton(root, 'DH-1029');
    // Hidden by `opacity`, never `visibility` or `display`: a screen reader still browses it.
    await expect(getComputedStyle(button).visibility).toBe('visible');
    await expect(getComputedStyle(button).display).not.toBe('none');
    await expect(button.getAttribute('tabindex')).toBe('-1');

    await real.hover(rowOf(root, 'DH-1029'));
    await waitFor(
      () => expect(opacityOf('DH-1029'), 'Edit shows under the pointer').toBe(1),
      RENDER_UPDATE,
    );
    await expect(opacityOf('DH-1030')).toBe(0);
    await real.unhover(rowOf(root, 'DH-1029'));
    await waitFor(() => expect(opacityOf('DH-1029'), 'Edit hides again').toBe(0), RENDER_UPDATE);

    // The focus shows it too: a row that holds the focus.
    await real.click(cellOf(root, 'DH-1030', 'Customer'));
    await real.unhover(rowOf(root, 'DH-1030'));
    await waitFor(
      () => expect(opacityOf('DH-1030'), 'Edit shows in the row that has the focus').toBe(1),
      RENDER_UPDATE,
    );
    await expect(opacityOf('DH-1029')).toBe(0);

    // The buttons of the row being edited are always drawn.
    await real.click(button);
    await waitFor(() => expect(editedRow(root)).not.toBeNull(), RENDER_UPDATE);
    await real.unhover(rowOf(root, 'DH-1029'));
    await expect(opacityOf('DH-1029')).toBe(1);
  },
};

/**
 * What the stylesheet makes of an editor in a real engine (spec phase 6 §4.3 E2): the cell has no padding and
 * the colour of a control, the field is flush with it (no border, no radius, no shadow, the height of a control),
 * the cell that holds the focus draws the frame of the accent with its halo, and the row keeps its 45px.
 */
export const RowEditLook: Story = {
  tags: ['no-visual'],
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    await real.unhover(root);
    await real.click(editButton(root, 'DH-1028'));
    await waitFor(() => expect(editorOf(root, 'Customer')).toHaveFocus(), RENDER_UPDATE);
    const cell = cellOf(root, 'DH-1028', 'Customer');
    const style = getComputedStyle(cell);
    await expect(cell.hasAttribute('data-editor')).toBe(true);
    await expect(style.paddingTop).toBe('0px');
    await expect(style.paddingLeft).toBe('0px');
    await expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    const field = cell.querySelector<HTMLElement>('.flg-input')!;
    const fieldStyle = getComputedStyle(field);
    await expect(fieldStyle.borderTopLeftRadius).toBe('0px');
    await expect(fieldStyle.boxShadow).toBe('none');
    await expect(fieldStyle.borderTopColor).toBe('rgba(0, 0, 0, 0)');
    await expect(field.offsetHeight).toBe(34);
    // The row keeps its height, and the field is as wide as its cell.
    await expect(rowOf(root, 'DH-1028').offsetHeight).toBe(45);
    await expect(Math.abs(field.offsetWidth - cell.clientWidth)).toBeLessThanOrEqual(1);
    // The cell with the focus: the outline and the frame of the accent with its halo (an inner shadow of two layers).
    await expect(style.outlineStyle).toBe('solid');
    await expect(style.outlineWidth).toBe('2px');
    await expect(style.boxShadow.split('inset').length - 1).toBe(2);
    // The cell that has no focus has the lines of the sides only.
    const other = cellOf(root, 'DH-1028', 'Qty');
    await expect(getComputedStyle(other).boxShadow.split('inset').length - 1).toBe(2);
    await expect(getComputedStyle(other).outlineStyle).toBe('none');
    // A cell that is no editor is as it was.
    const order = cellOf(root, 'DH-1028', 'Order');
    await expect(order.hasAttribute('data-editor')).toBe(false);
    await expect(getComputedStyle(order).boxShadow).toBe('none');
  },
};
