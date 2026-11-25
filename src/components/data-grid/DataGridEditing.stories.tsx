import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { noTitleIsCut } from '../../../.storybook/data-grid-orders';
import { realUserEvent } from '../../../.storybook/real-input';
import { Badge } from '../badge/Badge';
import { Card } from '../card/Card';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridHandle, DataGridProps } from './index';

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

/** A rule that every story of an error uses: the customer is required. */
const REQUIRED_COLUMNS: DataGridColumn<EditOrder>[] = EDIT_COLUMNS.map((column) =>
  column.field === 'customer'
    ? { ...column, validationRules: [{ type: 'required' as const }] }
    : column,
);

/**
 * The words of an error in a cell (spec phase 6 §4.3 E2 "Ô có lỗi"): the cell is marked when the editor lets
 * go of an empty required field, the editor is described by hidden words, and the tooltip opens below the cell
 * while it holds the focus and while the pointer is on it, inside the stage, and closes when neither is.
 */
export const EditErrorTooltip: Story = {
  tags: ['no-visual'],
  args: { columns: REQUIRED_COLUMNS, onSaving: fn() },
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const tip = () =>
      Array.from(editedRow(root)!.querySelectorAll<HTMLElement>('[role="tooltip"]')).find(
        (one) => one.textContent === 'Customer is required',
      );
    await real.click(editButton(root, 'DH-1029'));
    await waitFor(() => expect(editorOf(root, 'Customer')).toHaveFocus(), RENDER_UPDATE);
    await real.fill(editorOf(root, 'Customer'), '');
    await expect(cellOf(root, 'DH-1029', 'Customer').hasAttribute('data-invalid')).toBe(false);
    await real.tab();
    const cell = cellOf(root, 'DH-1029', 'Customer');
    await waitFor(
      () => expect(cell.hasAttribute('data-invalid'), 'the cell is marked').toBe(true),
      RENDER_UPDATE,
    );
    const customer = editorOf(root, 'Customer');
    await expect(customer.getAttribute('aria-invalid')).toBe('true');
    await expect(
      document.getElementById(customer.getAttribute('aria-describedby')!)?.textContent,
    ).toBe('Customer is required');
    // The focus is on the next editor and the pointer is off the grid: no tooltip.
    await real.unhover(root);
    await expect(tip()?.matches(':popover-open')).toBe(false);
    // The frame is the danger colour, whether or not the cell has the focus.
    await expect(getComputedStyle(cell).boxShadow).toContain('inset');

    // The focus comes back: the tooltip opens below the cell, lined up with its start, inside the stage.
    customer.focus();
    await waitFor(
      () => expect(tip()?.matches(':popover-open'), 'the tooltip opens on the focus').toBe(true),
      POPUP_SHOWN,
    );
    const below = () => {
      const box = tip()!.getBoundingClientRect();
      const at = cell.getBoundingClientRect();
      return { box, at };
    };
    // The floating layer places it a frame after it opens.
    await waitFor(
      () =>
        expect(below().box.top, 'the tooltip is below the cell').toBeGreaterThanOrEqual(
          below().at.bottom,
        ),
      RENDER_UPDATE,
    );
    await expect(Math.abs(below().box.left - below().at.left)).toBeLessThanOrEqual(4);
    const stage = canvasElement.closest('.flg-stage') ?? canvasElement;
    await expect(below().box.bottom).toBeLessThanOrEqual(stage.getBoundingClientRect().bottom + 1);

    // The focus goes: it closes. The pointer on the cell opens it again.
    editorOf(root, 'Status').focus();
    await waitFor(
      () => expect(tip()?.matches(':popover-open'), 'the tooltip closes').toBe(false),
      POPUP_SHOWN,
    );
    await real.hover(cell);
    await waitFor(
      () => expect(tip()?.matches(':popover-open'), 'the tooltip opens on the pointer').toBe(true),
      POPUP_SHOWN,
    );
    await real.unhover(cell);
    await waitFor(
      () => expect(tip()?.matches(':popover-open'), 'the tooltip closes').toBe(false),
      POPUP_SHOWN,
    );
    // A save with the field still empty sends nothing and puts the focus on the editor.
    await real.click(root.querySelector<HTMLElement>('button[aria-label="Save DH-1029"]')!);
    await waitFor(
      () => expect(customer, 'the focus is on the refused field').toHaveFocus(),
      RENDER_UPDATE,
    );
    await expect(args.onSaving).not.toHaveBeenCalled();
  },
};

/** The grid of the stories of Delete: the rows are dropped from `data` when the app is told to remove them. */
function DeletableGrid(props: DataGridProps<EditOrder>) {
  const [data, setData] = useState<readonly EditOrder[]>(EDIT_ORDERS);
  return (
    <DataGrid
      {...props}
      data={data}
      onSaving={(changes) => {
        props.onSaving?.(changes);
        const gone = new Set(changes.flatMap((one) => (one.type === 'remove' ? [one.key] : [])));
        setData((now) => now.filter((order) => !gone.has(order.id)));
      }}
    />
  );
}

/**
 * Delete with real keys (spec phase 6 §6.3 "Xoá"): `Enter` on the cell of the buttons goes into them, `Tab` goes
 * from Edit to Delete, `Enter` opens the confirm with Cancel focused, `Esc` closes it and the focus is on the cell
 * of the row, never on the page; Delete in the dialog sends one remove and the focus goes to the row now at that
 * place.
 */
export const DeleteKeys: Story = {
  tags: ['no-visual'],
  args: { editing: { mode: 'row', allowDeleting: true }, onSaving: fn() },
  render: (args) => <DeletableGrid {...args} />,
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const saved = args.onSaving as ReturnType<typeof fn>;
    const dialog = () => document.querySelector<HTMLDialogElement>('dialog.flg-dialog[open]');
    const remove = (order: string) =>
      root.querySelector<HTMLElement>(`button[aria-label="Delete ${order}"]`)!;
    await real.unhover(root);
    cellOf(root, 'DH-1029', 'Actions').focus();
    await expect(active()).toBe(cellOf(root, 'DH-1029', 'Actions'));
    await real.keyboard('{Enter}');
    await waitFor(() => expect(editButton(root, 'DH-1029')).toHaveFocus(), RENDER_UPDATE);
    await real.tab();
    await expect(remove('DH-1029')).toHaveFocus();
    await real.keyboard('{Enter}');
    await waitFor(() => expect(dialog(), 'the confirm is open').not.toBeNull(), POPUP_SHOWN);
    await expect(dialog()!.textContent).toContain('DH-1029 will be deleted.');
    await waitFor(
      () => expect(active().textContent, 'Cancel has the focus').toBe('Cancel'),
      RENDER_UPDATE,
    );
    // Esc closes it, and the focus is on the cell of the row.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(dialog(), 'the confirm closed').toBeNull(), POPUP_SHOWN);
    await waitFor(
      () =>
        expect(active(), 'the focus is on the cell of the buttons').toBe(
          cellOf(root, 'DH-1029', 'Actions'),
        ),
      RENDER_UPDATE,
    );
    await expect(saved).not.toHaveBeenCalled();

    // Delete in the dialog: Tab from Cancel to Delete, Enter.
    await real.keyboard('{Enter}');
    await waitFor(() => expect(editButton(root, 'DH-1029')).toHaveFocus(), RENDER_UPDATE);
    await real.tab();
    await real.keyboard('{Enter}');
    await waitFor(() => expect(dialog()).not.toBeNull(), POPUP_SHOWN);
    await waitFor(() => expect(active().textContent).toBe('Cancel'), RENDER_UPDATE);
    await real.tab();
    await expect(active().textContent).toBe('Delete');
    await real.keyboard('{Enter}');
    await waitFor(() => expect(dialog(), 'the confirm closed').toBeNull(), POPUP_SHOWN);
    await expect(saved).toHaveBeenCalledTimes(1);
    const [changes] = saved.mock.calls[0] as [{ type: string; key: string }[]];
    await expect(changes).toMatchObject([{ type: 'remove', key: 'DH-1029' }]);
    // The row is gone and the focus is in the grid, on the row now at its place.
    await waitFor(
      () => expect(root.textContent, 'the row left').not.toContain('DH-1029'),
      RENDER_UPDATE,
    );
    await waitFor(
      () => expect(tableOf(root).contains(active()), 'the focus is in the grid').toBe(true),
      RENDER_UPDATE,
    );
    await expect(active().closest('tr')).toBe(rowOf(root, 'DH-1028'));
  },
};

/** The rows of E2 as the mockup draws them (names, dates and figures are the mockup's). */
const E2_ORDERS: readonly EditOrder[] = [
  ['DH-1026', 'Nhà sách Đông A', '2026-11-04', 'delivered', 40, 32400000],
  ['DH-1027', 'Phạm Gia Bảo', '2026-11-05', 'cancelled', 1, 890000],
  ['DH-1028', 'Cà phê Sương Sớm', '2026-11-05', 'processing', 25, 9750000],
  ['DH-1029', 'Hoàng Đức Long', '2026-11-06', 'delivered', 3, 2100000],
  ['DH-1030', 'Công ty Thịnh Vượng', '2026-11-07', 'new', 60, 54000000],
].map(([id, customer, date, status, qty, total]) => ({
  id: id as string,
  customer: customer as string,
  assignee: 'lan',
  date: date as string,
  status: status as EditOrder['status'],
  channel: 'Store',
  qty: qty as number,
  total: total as number,
  paid: false,
  note: '',
}));

const E2_BADGES = {
  new: { variant: 'accent', text: 'New' },
  processing: { variant: 'warning', text: 'Processing' },
  delivered: { variant: 'success', text: 'Delivered' },
  cancelled: { variant: 'danger', text: 'Cancelled' },
} as const;

/** E2's columns: the six of the crop, the status as a Badge with a lookup, the total read-only. */
const E2_COLUMNS: DataGridColumn<EditOrder>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 110, allowEditing: false },
  { field: 'customer', caption: 'Customer', width: 260 },
  { field: 'date', caption: 'Order date', dataType: 'date', width: 190 },
  {
    field: 'status',
    caption: 'Status',
    width: 190,
    lookup: { items: STATUS_ITEMS, valueField: 'value', displayField: 'text' },
    cell: ({ value }) => <Badge variant={E2_BADGES[value].variant}>{E2_BADGES[value].text}</Badge>,
  },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 150 },
  {
    field: 'total',
    caption: 'Total',
    dataType: 'number',
    width: 190,
    allowEditing: false,
    format: { style: 'currency', currency: 'VND', maximumFractionDigits: 0 },
  },
];

/** The grid of E2 (a): in a card as wide as the mockup's, 1317px, with the 10px of padding the mockup gives it. */
const E2Grid = (props: Partial<DataGridProps<EditOrder>>) => (
  <div style={{ width: 1317 }}>
    <style>{'.e2-look .flg-table-frame { scrollbar-width: none; }'}</style>
    <Card className="e2-look" style={{ padding: 10 }}>
      <DataGrid
        data={E2_ORDERS}
        rowKey="id"
        columns={E2_COLUMNS}
        aria-label="Orders"
        locale="vi-VN"
        paging={false}
        editing={{ mode: 'row', allowDeleting: true }}
        onSaving={() => {}}
        {...props}
      />
    </Card>
  </div>
);

/**
 * E2, crop a (spec phase 6 §4.3 E2): DH-1028 in row mode, its editable cells as editors (Customer focused with
 * the frame of 2px and the halo, a DatePicker, a Select, a NumberInput; Order and Total as text; ✓ and ✕ 4px
 * apart), DH-1029 hovered with Edit and Delete 2px apart (the harness hovers what has `data-visual-hover`). Not
 * as in the mockup: every row is 45px (the owner's choice, OQ 1: the mockup's resting rows are 35.6px), the
 * action column is 72px and last, the words are English, and the caret is not drawn.
 */
export const EditRow: Story = {
  tags: ['viewport-1440x720'],
  render: () => <E2Grid />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const real = await realUserEvent();
    if (real) await real.unhover(root);
    editButton(root, 'DH-1028').click();
    await waitFor(
      () => expect(editorOf(root, 'Customer'), 'the customer editor has the focus').toHaveFocus(),
      RENDER_UPDATE,
    );
    await expect((editorOf(root, 'Customer') as HTMLInputElement).value).toBe('Cà phê Sương Sớm');
    await expect((editorOf(root, 'Order date') as HTMLInputElement).value).toBe('05/11/2026');
    await expect(editorOf(root, 'Status').textContent).toContain('Processing');
    await expect((editorOf(root, 'Qty') as HTMLInputElement).value).toBe('25');
    // Order and Total are text, not editors.
    for (const caption of ['Order', 'Total'])
      await expect(cellOf(root, 'DH-1028', caption).hasAttribute('data-editor')).toBe(false);
    await expect(cellOf(root, 'DH-1028', 'Total').textContent).toContain('9.750.000');
    const save = root.querySelector<HTMLElement>('button[aria-label="Save DH-1028"]')!;
    const cancel = root.querySelector<HTMLElement>('button[aria-label="Cancel editing DH-1028"]')!;
    await expect(
      Math.round(cancel.getBoundingClientRect().left - save.getBoundingClientRect().right),
    ).toBe(4);
    // DH-1029 shows Edit and Delete, 2px apart, as the row under the pointer does.
    const hovered = rowOf(root, 'DH-1029');
    hovered.setAttribute('data-visual-hover', '');
    const pair = [
      editButton(root, 'DH-1029'),
      root.querySelector<HTMLElement>('button[aria-label="Delete DH-1029"]')!,
    ];
    await expect(
      Math.round(pair[1]!.getBoundingClientRect().left - pair[0]!.getBoundingClientRect().right),
    ).toBe(2);
    await expect(rowOf(root, 'DH-1028').offsetHeight).toBe(45);
    // The columns and the buttons fit the frame.
    const frame = tableOf(root).parentElement!;
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
    await noTitleIsCut(canvasElement);
  },
};

/**
 * The confirm before a delete (outside the mockups: the Dialog's own look): the grid of E2 with the dialog open for
 * DH-1027 and Cancel focused. The stage is the viewport, as the Dialog's stories have it.
 */
export const ConfirmDelete: Story = {
  parameters: { stage: 'viewport' },
  render: () => <E2Grid />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    root.querySelector<HTMLElement>('button[aria-label="Delete DH-1027"]')!.click();
    const dialog = () => document.querySelector<HTMLDialogElement>('dialog.flg-dialog[open]');
    await waitFor(() => expect(dialog(), 'the confirm is open').not.toBeNull(), POPUP_SHOWN);
    await expect(dialog()!.textContent).toContain('Delete this row?');
    await expect(dialog()!.textContent).toContain('DH-1027 will be deleted.');
    await waitFor(
      () => expect(document.activeElement?.textContent, 'Cancel has the focus').toBe('Cancel'),
      RENDER_UPDATE,
    );
    await noTitleIsCut(canvasElement);
  },
};

/** The cell that is being edited in cell mode: the one `td` with `data-editing`. */
const editedCell = (root: HTMLElement) =>
  tableOf(root).querySelector<HTMLElement>('td[data-editing], th[data-editing]');
/** The editor of the cell being edited, by its label. */
const cellEditorOf = (root: HTMLElement, caption: string) =>
  editedCell(root)!.querySelector<HTMLElement>(`[aria-label="${caption}"]`)!;
/** Gives the focus to a cell, as a user's arrow keys would leave it there. */
const focusCell = (root: HTMLElement, order: string, caption: string) =>
  cellOf(root, order, caption).focus();

/** A grid with a button before it and one after it, so the page's own Tab stops are there to be reached. */
function Between(props: DataGridProps<EditOrder>) {
  return (
    <>
      <button type="button">Before</button>
      <DataGrid {...props} />
      <button type="button">After</button>
    </>
  );
}

/**
 * Cell mode with real keys (spec phase 6 §3.6, §6.3 "Năm chế độ"): a press starts the edit in the cell with the caret
 * at the end; `Enter` on a cell starts it and a character opens it with that character as its text, typed once;
 * `Tab` commits the cell and opens the next one that can be edited, across the rows, and each commit is one
 * `onSaving`; `Tab` at the last editable cell and `Shift+Tab` at the first leave the grid. What a burst of keys
 * does is not counted: the story asserts what it ends in.
 */
export const CellEditKeys: Story = {
  tags: ['no-visual'],
  args: { editing: { mode: 'cell' }, onSaving: fn() },
  render: (args) => <Between {...args} />,
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const saved = args.onSaving as ReturnType<typeof fn>;
    const table = tableOf(root);
    const [before, after] = Array.from(canvasElement.querySelectorAll('button')).filter(
      (button) => !table.contains(button),
    );

    // A press starts the edit of that cell and no other, with the caret at the end of its text.
    await real.click(cellOf(root, 'DH-1028', 'Customer'));
    await waitFor(
      () => expect(cellEditorOf(root, 'Customer'), 'the editor has the focus').toHaveFocus(),
      RENDER_UPDATE,
    );
    await expect(editedCell(root)).toBe(cellOf(root, 'DH-1028', 'Customer'));
    await expect(table.querySelectorAll('[data-editor]')).toHaveLength(1);
    await expect(table.querySelector('tr[data-editing]')).toBeNull();
    const customer = cellEditorOf(root, 'Customer') as HTMLInputElement;
    await expect(customer.value).toBe('Công ty Bình Minh');
    await expect(customer.selectionStart).toBe(customer.value.length);

    // `Tab` commits it (one call, the changed field only) and opens the next cell: Status.
    await real.fill(customer, 'Nguyễn Văn Hoa');
    await real.tab();
    await waitFor(
      () =>
        expect(editedCell(root), 'the next cell is being edited').toBe(
          cellOf(root, 'DH-1028', 'Status'),
        ),
      RENDER_UPDATE,
    );
    await expect(saved).toHaveBeenCalledTimes(1);
    const [changes] = saved.mock.calls[0] as [{ type: string; key: string; data: object }[]];
    await expect(changes).toMatchObject([
      { type: 'update', key: 'DH-1028', data: { customer: 'Nguyễn Văn Hoa' } },
    ]);
    await expect(Object.keys(changes[0]!.data)).toEqual(['customer']);
    await expect(active()).toBe(cellEditorOf(root, 'Status'));

    // Qty, Order date, Paid, then the next row's Customer: Total and Order cannot be edited.
    const visited: string[] = [];
    for (let tabs = 0; tabs < 4; tabs += 1) {
      await real.tab();
      await waitFor(
        () => expect(editedCell(root), 'a cell is being edited').not.toBeNull(),
        RENDER_UPDATE,
      );
      visited.push(
        `${editedCell(root)!.closest('tr')!.textContent!.slice(0, 7)} ${nameOf(active())}`,
      );
    }
    await expect(visited).toEqual([
      'DH-1028 Qty',
      'DH-1028 Order date',
      'DH-1028 Paid',
      'DH-1027 Customer',
    ]);
    // Nothing was changed in them: no other call. `Shift+Tab` goes back across the row boundary.
    await expect(saved).toHaveBeenCalledTimes(1);
    await real.tab({ shift: true });
    await waitFor(
      () => expect(editedCell(root)).toBe(cellOf(root, 'DH-1028', 'Paid')),
      RENDER_UPDATE,
    );

    // `Esc` gives the value up and the focus stays on the cell.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(editedCell(root), 'the edit ended').toBeNull(), RENDER_UPDATE);
    await expect(active()).toBe(cellOf(root, 'DH-1028', 'Paid'));
    // `Enter` on a cell starts the edit with the value kept.
    focusCell(root, 'DH-1029', 'Customer');
    await real.keyboard('{Enter}');
    await waitFor(() => expect(cellEditorOf(root, 'Customer')).toHaveFocus(), RENDER_UPDATE);
    await expect((cellEditorOf(root, 'Customer') as HTMLInputElement).value).toBe('Trần Minh Anh');
    await real.keyboard('{Escape}');
    await waitFor(() => expect(editedCell(root)).toBeNull(), RENDER_UPDATE);
    await expect(active()).toBe(cellOf(root, 'DH-1029', 'Customer'));

    // A character opens the editor with that character as its text, typed once.
    await real.keyboard('z');
    await waitFor(() => expect(cellEditorOf(root, 'Customer')).toHaveFocus(), RENDER_UPDATE);
    await expect((cellEditorOf(root, 'Customer') as HTMLInputElement).value).toBe('z');
    await real.keyboard('{Escape}');
    await waitFor(() => expect(editedCell(root)).toBeNull(), RENDER_UPDATE);
    await expect(cellOf(root, 'DH-1029', 'Customer').textContent).toBe('Trần Minh Anh');

    // `Enter` in an editor commits, and the focus stays on the cell; nothing was changed, so nothing is sent.
    await real.keyboard('{Enter}');
    await waitFor(() => expect(cellEditorOf(root, 'Customer')).toHaveFocus(), RENDER_UPDATE);
    await real.keyboard('{Enter}');
    await waitFor(() => expect(editedCell(root)).toBeNull(), RENDER_UPDATE);
    await expect(active()).toBe(cellOf(root, 'DH-1029', 'Customer'));
    await expect(saved).toHaveBeenCalledTimes(1);

    // At the last editable cell `Tab` commits and leaves the grid: the key is not cancelled.
    // (A press on a boolean cell flips it, so the editor of its Checkbox is opened by the key.)
    focusCell(root, 'DH-1026', 'Paid');
    await real.keyboard('{Enter}');
    await waitFor(
      () => expect(editedCell(root)).toBe(cellOf(root, 'DH-1026', 'Paid')),
      RENDER_UPDATE,
    );
    await real.tab();
    await waitFor(
      () => expect(after, 'the focus left the grid for what follows it').toHaveFocus(),
      RENDER_UPDATE,
    );
    await expect(editedCell(root)).toBeNull();
    // `Shift+Tab` at the first one leaves the grid backwards.
    await real.click(cellOf(root, 'DH-1030', 'Customer'));
    await waitFor(
      () => expect(editedCell(root)).toBe(cellOf(root, 'DH-1030', 'Customer')),
      RENDER_UPDATE,
    );
    await real.tab({ shift: true });
    await waitFor(
      () => expect(before, 'the focus left the grid backwards').toHaveFocus(),
      RENDER_UPDATE,
    );
    await expect(editedCell(root)).toBeNull();
  },
};

/**
 * The keys of an editor's popups stay its own in cell mode (spec phase 6 §6.3): in a Combobox the arrows move in
 * the list and `Enter` chooses (it commits nothing), the next `Enter` commits; in the calendar of a DatePicker
 * the arrows move the day and `Enter` picks it, `Esc` closes the calendar and the edit goes on, the next `Esc` gives
 * it up.
 */
export const CellEditPopupKeys: Story = {
  tags: ['no-visual'],
  args: {
    editing: { mode: 'cell' },
    onSaving: fn(),
    columns: [
      EDIT_COLUMNS[0]!,
      {
        field: 'assignee',
        caption: 'Assignee',
        width: 180,
        lookup: {
          items: [
            { value: 'lan', text: 'Lan' },
            { value: 'huy', text: 'Huy' },
            { value: 'mai', text: 'Mai' },
          ],
          valueField: 'value',
          displayField: 'text',
          searchable: true,
        },
      },
      EDIT_COLUMNS[4]!,
    ],
  },
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const saved = args.onSaving as ReturnType<typeof fn>;
    await real.unhover(root);

    // The Combobox: the arrow opens the list and moves in it, Enter chooses; the edit is still open.
    await real.click(cellOf(root, 'DH-1028', 'Assignee'));
    const box = () => cellEditorOf(root, 'Assignee') as HTMLInputElement;
    await waitFor(() => expect(box(), 'the Combobox has the focus').toHaveFocus(), RENDER_UPDATE);
    await real.keyboard('{ArrowDown}');
    await waitFor(
      () => expect(box().getAttribute('aria-expanded'), 'the list is open').toBe('true'),
      POPUP_SHOWN,
    );
    await real.keyboard('{ArrowDown}');
    await real.keyboard('{Enter}');
    await waitFor(
      () => expect(box().getAttribute('aria-expanded'), 'the list is closed').toBe('false'),
      POPUP_SHOWN,
    );
    await expect(saved, 'Enter chose in the list and committed nothing').not.toHaveBeenCalled();
    await expect(editedCell(root)).toBe(cellOf(root, 'DH-1028', 'Assignee'));
    await expect(box().value).not.toBe('Lan');
    // The next Enter commits it, and the focus stays on the cell.
    await real.keyboard('{Enter}');
    await waitFor(() => expect(editedCell(root), 'the edit ended').toBeNull(), RENDER_UPDATE);
    await expect(saved).toHaveBeenCalledTimes(1);
    await expect(active()).toBe(cellOf(root, 'DH-1028', 'Assignee'));

    // The DatePicker: the calendar takes its keys, Esc closes it first, the edit goes on.
    await real.click(cellOf(root, 'DH-1028', 'Order date'));
    const field = () => cellEditorOf(root, 'Order date') as HTMLInputElement;
    await waitFor(() => expect(field()).toHaveFocus(), RENDER_UPDATE);
    const calendar = editedCell(root)!.querySelector<HTMLElement>('[aria-label="Choose date"]')!;
    await real.click(calendar);
    await waitFor(
      () => expect(calendar.getAttribute('aria-expanded'), 'the calendar is open').toBe('true'),
      POPUP_SHOWN,
    );
    await real.keyboard('{ArrowRight}');
    await real.keyboard('{Enter}');
    await waitFor(
      () =>
        expect(calendar.getAttribute('aria-expanded'), 'the calendar closed on the pick').toBe(
          'false',
        ),
      POPUP_SHOWN,
    );
    await expect(field().value).toBe('11/06/2026');
    await expect(saved, 'picking a day committed nothing').toHaveBeenCalledTimes(1);
    await expect(editedCell(root)).toBe(cellOf(root, 'DH-1028', 'Order date'));
    await real.click(calendar);
    await waitFor(() => expect(calendar.getAttribute('aria-expanded')).toBe('true'), POPUP_SHOWN);
    await real.keyboard('{Escape}');
    await waitFor(
      () => expect(calendar.getAttribute('aria-expanded'), 'the calendar is closed').toBe('false'),
      POPUP_SHOWN,
    );
    await expect(editedCell(root), 'the first Esc only closed the calendar').not.toBeNull();
    await real.keyboard('{Escape}');
    await waitFor(() => expect(editedCell(root), 'the edit ended').toBeNull(), RENDER_UPDATE);
    await expect(saved, 'giving up commits nothing').toHaveBeenCalledTimes(1);
    await expect(active()).toBe(cellOf(root, 'DH-1028', 'Order date'));
  },
};

/** E2 (b)'s columns: the four of the crop, in a table of 631px with the 72px of buttons. */
const E2_CELL_COLUMNS: DataGridColumn<EditOrder>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 100, allowEditing: false },
  { field: 'customer', caption: 'Customer', width: 217, validationRules: [{ type: 'required' }] },
  { field: 'date', caption: 'Order date', dataType: 'date', width: 130 },
  {
    field: 'status',
    caption: 'Status',
    width: 110,
    allowEditing: false,
    lookup: { items: STATUS_ITEMS, valueField: 'value', displayField: 'text' },
    cell: ({ value }) => <Badge variant={E2_BADGES[value].variant}>{E2_BADGES[value].text}</Badge>,
  },
];

/** The grid of E2 (b): in a card whose table is 631px, as the mockup's two are, with the 10px of padding. */
const E2CellGrid = ({ from, ...props }: Partial<DataGridProps<EditOrder>> & { from: number }) => (
  <div style={{ width: 653 }}>
    <style>{'.e2-look .flg-table-frame { scrollbar-width: none; }'}</style>
    <Card className="e2-look" style={{ padding: 10 }}>
      <DataGrid
        data={E2_ORDERS.slice(from, from + 4)}
        rowKey="id"
        columns={E2_CELL_COLUMNS}
        aria-label="Orders"
        locale="vi-VN"
        paging={false}
        editing={{ mode: 'cell', allowDeleting: true }}
        onSaving={() => {}}
        {...props}
      />
    </Card>
  </div>
);

/**
 * E2, crop b on the left (spec phase 6 §4.3 E2): cell mode, DH-1029 · Customer is the one editor, with its text and
 * the caret at its end and the frame of the focus, no side lines; Delete is shown on that row (it holds the focus).
 * Not as in the mockup: every row is 45px (OQ 1; the mockup's resting rows are 35.6px), the action column is 72px and
 * last, the words are English, the caret is not drawn, and the column widths are the ones that fit 631px.
 */
export const EditCell: Story = {
  render: () => <E2CellGrid from={1} />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const real = await realUserEvent();
    if (real) await real.unhover(root);
    cellOf(root, 'DH-1029', 'Customer').click();
    await waitFor(
      () => expect(cellEditorOf(root, 'Customer'), 'the editor has the focus').toHaveFocus(),
      RENDER_UPDATE,
    );
    const field = cellEditorOf(root, 'Customer') as HTMLInputElement;
    await expect(field.value).toBe('Hoàng Đức Long');
    await expect(field.selectionStart).toBe(field.value.length);
    await expect(editedCell(root)).toBe(cellOf(root, 'DH-1029', 'Customer'));
    // The one editor, and the row has no lines at the sides: only the cell has the frame of the focus.
    await expect(tableOf(root).querySelectorAll('[data-editor]')).toHaveLength(1);
    await expect(tableOf(root).querySelector('tr[data-editing]')).toBeNull();
    await expect(getComputedStyle(editedCell(root)!).boxShadow.split('inset').length - 1).toBe(2);
    // Delete shows on the row that holds the focus, and not on the others.
    const shown = (order: string) =>
      Number(
        getComputedStyle(
          rowOf(root, order).querySelector<HTMLElement>('.flg-data-grid-action-buttons')!,
        ).opacity,
      );
    await expect(shown('DH-1029')).toBe(1);
    await expect(shown('DH-1028')).toBe(0);
    await expect(rowOf(root, 'DH-1029').offsetHeight).toBe(45);
    // The columns and the buttons fit the frame, which is as wide as the mockup's table.
    const frame = tableOf(root).parentElement!;
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
    await expect(frame.offsetWidth).toBe(631);
    await noTitleIsCut(canvasElement);
  },
};

/**
 * E2, crop b on the right (spec phase 6 §4.3 E2 "Ô có lỗi"): DH-1026 · Customer emptied and `Enter` pressed: the editor
 * stays with the frame in danger, the icon at its end and the tooltip below it, open while the cell holds the focus.
 * The tooltip is in the top layer and adds no height, so the story asserts it ends inside the stage (it stands over
 * the rows below the cell). Not as in the mockup: the rows are 45px, the words are English and the action column is
 * 72px.
 */
export const EditCellError: Story = {
  render: () => <E2CellGrid from={0} />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const real = await realUserEvent();
    if (real) await real.unhover(root);
    cellOf(root, 'DH-1026', 'Customer').click();
    await waitFor(() => expect(cellEditorOf(root, 'Customer')).toHaveFocus(), RENDER_UPDATE);
    await userEvent.clear(cellEditorOf(root, 'Customer'));
    await userEvent.keyboard('{Enter}');
    const cell = cellOf(root, 'DH-1026', 'Customer');
    await waitFor(
      () => expect(cell.hasAttribute('data-invalid'), 'the cell is refused').toBe(true),
      RENDER_UPDATE,
    );
    // The commit failed its rule: the editor stays, with the focus.
    await expect(editedCell(root)).toBe(cell);
    await expect(cellEditorOf(root, 'Customer')).toHaveFocus();
    await expect(cell.querySelector('.flg-data-grid-editor-alert')).not.toBeNull();
    const tip = () =>
      Array.from(root.querySelectorAll<HTMLElement>('[role="tooltip"]')).find(
        (one) => one.textContent === 'Customer is required',
      );
    await waitFor(
      () => expect(tip()?.matches(':popover-open'), 'the tooltip is open').toBe(true),
      POPUP_SHOWN,
    );
    // It stands below the cell (the floating layer places it a frame after it opens), lined up with its start.
    await waitFor(
      () =>
        expect(
          tip()!.getBoundingClientRect().top,
          'the tooltip is below the cell',
        ).toBeGreaterThanOrEqual(cell.getBoundingClientRect().bottom),
      RENDER_UPDATE,
    );
    await expect(
      Math.abs(tip()!.getBoundingClientRect().left - cell.getBoundingClientRect().left),
    ).toBeLessThanOrEqual(4);
    const stage = canvasElement.closest('.flg-stage') ?? canvasElement;
    await expect(tip()!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      stage.getBoundingClientRect().bottom + 1,
    );
    await expect(rowOf(root, 'DH-1026').offsetHeight).toBe(45);
    await noTitleIsCut(canvasElement);
  },
};

/**
 * Adding a row with real keys (spec phase 6 §6.3 "Thêm dòng"): the toolbar's button is reached by `Tab`, `Enter` on
 * it adds a row that is edited at once with the focus in its first editor, `Esc` drops a new row that was given
 * nothing and the focus is in the grid, never on the page; a row that was given a name is sent as one insert.
 */
export const AddRowKeys: Story = {
  tags: ['no-visual'],
  args: {
    editing: { mode: 'row', allowAdding: true },
    searchPanel: true,
    onSaving: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const saved = args.onSaving as ReturnType<typeof fn>;
    const newRow = () => tableOf(root).querySelector<HTMLTableRowElement>('tr[data-new]');
    await real.unhover(root);
    root.querySelector<HTMLElement>('input[type="search"], [role="searchbox"]')!.focus();
    await real.tab();
    await expect(active()).toBe(root.querySelector('.flg-data-grid-toolbar button'));
    await expect(active().textContent).toBe('Add row');
    await real.keyboard('{Enter}');
    await waitFor(() => expect(newRow(), 'a new row is drawn').not.toBeNull(), RENDER_UPDATE);
    await waitFor(
      () => expect(editorOf(root, 'Customer'), 'the first editor has the focus').toHaveFocus(),
      RENDER_UPDATE,
    );
    await expect(editedRow(root)).toBe(newRow());
    // The row was given nothing: Esc drops it, and the focus is in the grid.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(newRow(), 'the new row went').toBeNull(), RENDER_UPDATE);
    await waitFor(
      () => expect(tableOf(root).contains(active()), 'the focus is in the grid').toBe(true),
      RENDER_UPDATE,
    );
    await expect(saved).not.toHaveBeenCalled();

    // A second row, given a name, is sent as one insert whose key is not the first one's.
    root.querySelector<HTMLElement>('.flg-data-grid-toolbar button')!.focus();
    await real.keyboard('{Enter}');
    await waitFor(() => expect(editorOf(root, 'Customer')).toHaveFocus(), RENDER_UPDATE);
    await real.keyboard('Hoa Mai');
    await real.keyboard('{Enter}');
    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1), RENDER_UPDATE);
    const [changes] = saved.mock.calls[0] as [{ type: string; key: string; data: object }[]];
    await expect(changes).toMatchObject([
      { type: 'insert', key: 'flg-new-2', data: { customer: 'Hoa Mai' } },
    ]);
  },
};

const LONG_ORDERS: readonly EditOrder[] = Array.from({ length: 200 }, (_, index) => ({
  id: `DH-${index + 1}`,
  customer: `Customer ${index + 1}`,
  assignee: 'Ngô Quang Huy',
  date: '2026-11-13',
  status: 'new',
  channel: 'Web',
  qty: index + 1,
  total: (index + 1) * 1000,
  paid: false,
  note: '',
}));
const LONG_COLUMNS: DataGridColumn<EditOrder>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 110, allowEditing: false },
  { field: 'customer', caption: 'Customer', width: 200 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 130 },
];

/** A virtual grid with a button that adds a row through the handle. */
function VirtualAdder(props: DataGridProps<EditOrder>) {
  const handle = useRef<DataGridHandle>(null);
  return (
    <>
      <button type="button" onClick={() => handle.current?.addRow()}>
        Add through the handle
      </button>
      <DataGrid ref={handle} {...props} />
    </>
  );
}

/**
 * Cell mode in a virtual grid of 200 rows, which jsdom cannot scroll, in a real engine (spec phase 6 §6.3): `Tab`
 * from the last cell of the last drawn row reveals the next row, which the window has not drawn, and opens its
 * editor there; `addRow()` with the new row at the end reveals it and focuses its first editor. Each row ends
 * inside the frame, under the heading, with the focus in its editor.
 */
export const VirtualCellKeys: Story = {
  tags: ['no-visual'],
  args: {
    data: LONG_ORDERS,
    columns: LONG_COLUMNS,
    scrolling: 'virtual',
    height: 360,
    editing: { mode: 'cell', allowAdding: true, newRowPosition: 'last' },
    onSaving: fn(),
  },
  render: (args) => <VirtualAdder {...args} />,
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const saved = args.onSaving as ReturnType<typeof fn>;
    const table = tableOf(root);
    const frame = table.parentElement!;
    const drawn = () =>
      Array.from(table.tBodies[0]!.rows).filter((row) =>
        row.classList.contains('flg-data-grid-row'),
      );
    const nameOfRow = (row: HTMLTableRowElement) => row.cells[0]!.textContent!.trim();
    /** Whether a row stands in the frame, under the heading. */
    const inFrame = (row: HTMLElement) => {
      const box = row.getBoundingClientRect();
      const view = frame.getBoundingClientRect();
      const head = table.tHead!.getBoundingClientRect();
      return box.top >= head.bottom - 1 && box.bottom <= view.bottom + 1;
    };
    await real.unhover(root);

    // A row far down is drawn; the last row the window draws has the editor of its last cell opened with `Enter`.
    frame.scrollTop = 40 * 45;
    await waitFor(
      () =>
        expect(
          drawn().some((row) => nameOfRow(row) === 'DH-50'),
          'the window moved',
        ).toBe(true),
      RENDER_UPDATE,
    );
    const last = drawn().at(-1)!;
    const lastName = nameOfRow(last);
    const number = Number(lastName.slice(3));
    cellOf(root, lastName, 'Qty').focus({ preventScroll: true });
    await real.keyboard('{Enter}');
    await waitFor(
      () =>
        expect(
          cellEditorOf(root, 'Qty'),
          'the editor of the last drawn row has the focus',
        ).toHaveFocus(),
      RENDER_UPDATE,
    );

    // `Tab` goes to the next row, which the window had not drawn: it is revealed, and its editor has the focus.
    await real.keyboard('{Tab}');
    const next = `DH-${number + 1}`;
    await waitFor(
      () =>
        expect(cellEditorOf(root, 'Customer'), `the editor of ${next} has the focus`).toHaveFocus(),
      RENDER_UPDATE,
    );
    await expect(editedCell(root)).toBe(cellOf(root, next, 'Customer'));
    await waitFor(
      () => expect(inFrame(rowOf(root, next)), `${next} is in the frame`).toBe(true),
      RENDER_UPDATE,
    );
    await real.keyboard('{Escape}');

    // `addRow()` with the new row at the end: it is revealed, and its first editor has the focus.
    await real.click(canvasElement.querySelector<HTMLElement>('button')!);
    await waitFor(
      () => expect(table.querySelector('tr[data-new]'), 'the new row is drawn').not.toBeNull(),
      RENDER_UPDATE,
    );
    await waitFor(
      () => expect(cellEditorOf(root, 'Customer'), 'its first editor has the focus').toHaveFocus(),
      RENDER_UPDATE,
    );
    const fresh = table.querySelector<HTMLElement>('tr[data-new]')!;
    await expect(editedCell(root)).toBe(fresh.querySelector('td[data-editor]'));
    await waitFor(
      () => expect(inFrame(fresh), 'the new row is in the frame').toBe(true),
      RENDER_UPDATE,
    );
    await expect(saved).not.toHaveBeenCalled();
  },
};
