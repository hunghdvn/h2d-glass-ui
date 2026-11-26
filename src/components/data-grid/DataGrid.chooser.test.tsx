import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridColumnLayout, DataGridProps, DataGridState } from './index';

// The column chooser and the toolbar (spec phase 6 §3.6, §4.3 G1 and C1, §6.3 "Thanh công cụ"): the
// button, the popover with a box for each column, what a box does and says, and what `toolbar` lays
// out. What needs a layout engine, the top layer or the focus of a real engine to be true (the popover
// under its button, Tab and Space, the focus after Escape) is proven in the stories
// (`DataGridColumns.stories.tsx`).

let showing: Set<Element>;
beforeEach(() => {
  resetDevWarnings();
  showing = new Set();
  // jsdom has no layout and no Popover API: a popover shows and hides by these stand-ins.
  HTMLElement.prototype.checkVisibility = () => true;
  HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
    showing.add(this);
  };
  HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
    showing.delete(this);
  };
  const matches = Element.prototype.matches;
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
    this: Element,
    selector: string,
  ) {
    return selector === ':popover-open' ? showing.has(this) : matches.call(this, selector);
  });
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
  Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
  vi.restoreAllMocks();
  vi.useRealTimers();
});

interface Order {
  id: string;
  customer: string;
  qty: number;
  total: number;
}

const ORDERS: Order[] = [
  { id: 'DH-1030', customer: 'Nguyễn Minh', qty: 4, total: 1250000 },
  { id: 'DH-1029', customer: 'Trần Hải', qty: 1, total: 890000 },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104, allowHiding: false },
  { field: 'customer', caption: 'Customer', width: 200 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
  { field: 'total', caption: 'Total', dataType: 'number', width: 120 },
];
const ORDER = ['id', 'customer', 'qty', 'total'];

function Orders(props: Partial<DataGridProps<Order>>) {
  return (
    <DataGrid
      data={ORDERS}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      columnChooser
      paging={false}
      {...props}
    />
  );
}

/** A grid whose parent keeps the layout, as a caller that saves it does. */
function Controlled({
  onChange,
  ...props
}: Partial<DataGridProps<Order>> & { onChange: (layout: DataGridColumnLayout) => void }) {
  const [layout, setLayout] = useState<DataGridColumnLayout>({
    order: ORDER,
    widths: {},
    hidden: [],
    pinned: {},
  });
  return (
    <Orders
      columnLayout={layout}
      onColumnLayoutChange={(next) => {
        onChange(next);
        setLayout(next);
      }}
      {...props}
    />
  );
}

const grid = () => screen.getByRole('grid') as HTMLTableElement;
const titles = () =>
  Array.from(grid().tHead!.rows[0]!.cells).filter(
    (cell) => !cell.classList.contains('flg-data-grid-filler'),
  );
const captions = () => titles().map((cell) => cell.textContent);
const title = (name: string) => titles().find((cell) => cell.textContent?.includes(name))!;
const toolbar = () => document.querySelector<HTMLElement>('.flg-data-grid-toolbar');
const button = () => document.querySelector<HTMLButtonElement>('.flg-data-grid-chooser-button');
const popover = () => document.querySelector<HTMLElement>('.flg-data-grid-chooser');
const boxes = () => Array.from(popover()?.querySelectorAll<HTMLInputElement>('input') ?? []);
const box = (name: string) =>
  boxes().find((input) => input.closest('label')?.textContent === name)!;
const names = () => boxes().map((input) => input.closest('label')!.textContent);
const region = () => document.querySelector('[aria-live="polite"]')!;
const tick = () => act(() => void vi.advanceTimersByTime(0));
// The popovers of the toolbar are in the top layer, not part of the row.
const classesOfToolbar = () =>
  Array.from(toolbar()!.children)
    .filter((child) => !child.hasAttribute('popover'))
    .map((child) => child.className);
const toolbarPopovers = () => document.querySelectorAll('.flg-data-grid-toolbar [popover]');

/** A press and a click on a button, as a mouse makes them. */
function click(element: HTMLElement) {
  fireEvent.pointerDown(element, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 });
  fireEvent.mouseDown(element);
  fireEvent.pointerUp(element, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 });
  fireEvent.click(element, { detail: 1 });
}
const open = () => click(button()!);

const CAPTION = 'flg-card-header flg-data-grid-caption';
const SPACER = 'flg-data-grid-toolbar-spacer';
const CHOOSER = 'flg-button flg-data-grid-chooser-button';

describe('the button', () => {
  it('is an icon button named "Columns" that opens a dialog', () => {
    render(<Orders />);
    const trigger = button()!;
    expect(trigger).toHaveAccessibleName('Columns');
    expect(trigger).toHaveAttribute('data-variant', 'secondary');
    expect(trigger).toHaveAttribute('data-size', 'md');
    expect(trigger).toHaveAttribute('data-icon-only');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.querySelector('svg')).toBeInTheDocument();
  });

  it('comes after the caption and a spacer that takes the room between them', () => {
    render(<Orders />);
    expect(classesOfToolbar()).toEqual([CAPTION, SPACER, CHOOSER]);
    expect(toolbar()!.children[1]).toHaveAttribute('aria-hidden', 'true');
  });

  it('has the words of the label', () => {
    render(<Orders labels={{ columnChooser: 'Spalten' }} />);
    expect(button()).toHaveAccessibleName('Spalten');
  });

  it('is not described by its tooltip: the tooltip says the name it already has', () => {
    render(<Orders />);
    expect(button()).not.toHaveAttribute('aria-describedby');
    fireEvent.pointerEnter(button()!, { pointerType: 'mouse' });
    expect(button()).not.toHaveAttribute('aria-describedby');
  });

  it('is not there without `columnChooser`, and mounts no popover for it', () => {
    render(<Orders columnChooser={false} />);
    expect(button()).toBeNull();
    expect(popover()).toBeNull();
    expect(toolbarPopovers()).toHaveLength(0);
  });

  it('is not there when `columnChooser` is left out', () => {
    render(<Orders columnChooser={undefined} />);
    expect(button()).toBeNull();
  });

  it('opens the popover, which is a dialog named by its title', () => {
    render(<Orders />);
    open();
    const content = popover()!;
    expect(content).toHaveAttribute('role', 'dialog');
    const heading = content.querySelector('.flg-data-grid-chooser-title')!;
    expect(heading).toHaveTextContent('Columns');
    expect(content).toHaveAttribute('aria-labelledby', heading.id);
    expect(button()).toHaveAttribute('aria-expanded', 'true');
    expect(content).toHaveAttribute('data-side', 'bottom');
    expect(content).toHaveAttribute('data-align', 'end');
    expect(content.querySelector('.flg-popover-arrow')).toBeInTheDocument();
  });
});

describe('the boxes', () => {
  it('are one for each data column, in the order shown, all checked', () => {
    render(<Orders />);
    open();
    expect(names()).toEqual(['Order', 'Customer', 'Qty', 'Total']);
    expect(boxes().every((input) => input.checked)).toBe(true);
  });

  it('follow the zones: the left zone, the middle, then the right zone, a hidden column at its place', () => {
    render(
      <Orders
        defaultColumnLayout={{
          order: ORDER,
          pinned: { qty: 'left', id: 'right' },
          hidden: ['customer'],
        }}
      />,
    );
    open();
    expect(names()).toEqual(['Qty', 'Customer', 'Total', 'Order']);
    expect(box('Customer').checked).toBe(false);
    expect(box('Qty').checked).toBe(true);
  });

  it('draw none for the column of boxes of a grid that chooses rows', () => {
    render(<Orders selectionMode="multiple" />);
    open();
    expect(names()).toEqual(['Order', 'Customer', 'Qty', 'Total']);
  });

  it('hide the column of a box that is cleared: one change, with its callbacks and the words', () => {
    vi.useFakeTimers();
    const onColumnLayoutChange = vi.fn();
    const onStateChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} onStateChange={onStateChange} />);
    open();
    fireEvent.click(box('Customer'));
    expect(onColumnLayoutChange).toHaveBeenCalledOnce();
    expect(onColumnLayoutChange.mock.calls[0]![0].hidden).toEqual(['customer']);
    expect(onStateChange).toHaveBeenCalledOnce();
    expect(onStateChange.mock.calls[0]![1]).toBe<keyof DataGridState>('columnLayout');
    tick();
    expect(region()).toHaveTextContent('Customer hidden');
    expect(captions()).toEqual(['Order', 'Qty', 'Total']);
    expect(box('Customer').checked).toBe(false);
  });

  it('show the column of a box that is checked again', () => {
    vi.useFakeTimers();
    const onColumnLayoutChange = vi.fn();
    render(
      <Orders
        defaultColumnLayout={{ hidden: ['qty'] }}
        onColumnLayoutChange={onColumnLayoutChange}
      />,
    );
    expect(captions()).toEqual(['Order', 'Customer', 'Total']);
    open();
    expect(box('Qty').checked).toBe(false);
    fireEvent.click(box('Qty'));
    expect(onColumnLayoutChange).toHaveBeenCalledOnce();
    expect(onColumnLayoutChange.mock.calls[0]![0].hidden).toEqual([]);
    tick();
    expect(region()).toHaveTextContent('Qty shown');
    expect(captions()).toEqual(['Order', 'Customer', 'Qty', 'Total']);
  });

  it('keep the popover open, so that the next box is one press away', () => {
    render(<Orders />);
    open();
    fireEvent.click(box('Customer'));
    fireEvent.click(box('Qty'));
    expect(showing.has(popover()!)).toBe(true);
    expect(captions()).toEqual(['Order', 'Total']);
  });

  it('say the words of the labels', () => {
    vi.useFakeTimers();
    render(
      <Orders
        labels={{
          announceHidden: (caption) => `${caption} => hidden`,
          announceShown: (caption) => `${caption} => shown`,
        }}
      />,
    );
    open();
    fireEvent.click(box('Qty'));
    tick();
    expect(region()).toHaveTextContent('Qty => hidden');
    fireEvent.click(box('Qty'));
    tick();
    expect(region()).toHaveTextContent('Qty => shown');
  });

  it('change a layout that the parent keeps, once for each box, and show what the parent says', () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    open();
    fireEvent.click(box('Total'));
    expect(onChange).toHaveBeenCalledOnce();
    expect(captions()).toEqual(['Order', 'Customer', 'Qty']);
    expect(box('Total').checked).toBe(false);
  });

  it('follow a layout that changes under them', () => {
    const layout = (hidden: string[]): DataGridColumnLayout => ({
      order: ORDER,
      widths: {},
      hidden,
      pinned: {},
    });
    const { rerender } = render(
      <Orders columnLayout={layout([])} onColumnLayoutChange={() => {}} />,
    );
    open();
    expect(box('Qty').checked).toBe(true);
    rerender(<Orders columnLayout={layout(['qty'])} onColumnLayoutChange={() => {}} />);
    expect(box('Qty').checked).toBe(false);
    expect(captions()).toEqual(['Order', 'Customer', 'Total']);
  });

  it('stay checked when the parent keeps the layout as it was', () => {
    render(
      <Orders
        columnLayout={{ order: ORDER, widths: {}, hidden: [], pinned: {} }}
        onColumnLayoutChange={() => {}}
      />,
    );
    open();
    fireEvent.click(box('Qty'));
    expect(box('Qty').checked).toBe(true);
    expect(captions()).toEqual(['Order', 'Customer', 'Qty', 'Total']);
  });
});

describe('a column that cannot be hidden', () => {
  it('has its box checked and disabled, in a row with a lock, and is said to be always shown', () => {
    render(<Orders />);
    open();
    const locked = box('Order');
    expect(locked.checked).toBe(true);
    expect(locked).toBeDisabled();
    const row = locked.closest('.flg-data-grid-chooser-row')!;
    expect(row).toBeInTheDocument();
    const lock = row.querySelector('.flg-data-grid-chooser-lock')!;
    expect(lock).toHaveAttribute('aria-hidden', 'true');
    expect(lock.querySelector('svg')).toBeInTheDocument();
    expect(locked).toHaveAccessibleDescription('Always shown');
    expect(box('Customer').closest('.flg-data-grid-chooser-row')).toBeNull();
    expect(box('Customer')).not.toHaveAttribute('aria-describedby');
  });

  it('says it in the words of the label', () => {
    render(<Orders labels={{ lockedColumn: 'Pflicht' }} />);
    open();
    expect(box('Order')).toHaveAccessibleDescription('Pflicht');
  });

  it('is not hidden by a press on its box', async () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    open();
    await userEvent.click(box('Order'));
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    expect(captions()).toContain('Order');
  });

  it('can be shown when a layout hides it, and has its lock back when it is shown', () => {
    render(<Orders defaultColumnLayout={{ hidden: ['id'] }} />);
    open();
    const locked = box('Order');
    expect(locked.checked).toBe(false);
    expect(locked).not.toBeDisabled();
    // Hidden, it is a plain box: not said to be always shown, and no lock drawn.
    expect(locked).not.toHaveAccessibleDescription('Always shown');
    expect(locked).not.toHaveAttribute('aria-describedby');
    expect(locked.closest('.flg-data-grid-chooser-row')).toBeNull();
    fireEvent.click(locked);
    expect(captions()).toContain('Order');
    // Shown again, it is locked again.
    expect(box('Order')).toBeDisabled();
    expect(box('Order')).toHaveAccessibleDescription('Always shown');
    expect(box('Order').closest('.flg-data-grid-chooser-row')).toBeInTheDocument();
  });
});

describe('the last column shown', () => {
  const LAST = { hidden: ['id', 'customer', 'qty'] };

  it('has its box disabled, without a lock, while it is the only one shown', () => {
    render(<Orders defaultColumnLayout={LAST} />);
    open();
    expect(captions()).toEqual(['Total']);
    const last = box('Total');
    expect(last.checked).toBe(true);
    expect(last).toBeDisabled();
    expect(last.closest('.flg-data-grid-chooser-row')).toBeNull();
    expect(box('Customer')).not.toBeDisabled();
  });

  it('is disabled when the box before it is cleared, and free again when another is checked', () => {
    render(<Orders defaultColumnLayout={{ hidden: ['id', 'customer'] }} />);
    open();
    expect(box('Total')).not.toBeDisabled();
    fireEvent.click(box('Qty'));
    expect(box('Total')).toBeDisabled();
    fireEvent.click(box('Customer'));
    expect(box('Total')).not.toBeDisabled();
  });

  it('is described by the words of lastShownColumn, and the description goes with the reason', () => {
    render(<Orders defaultColumnLayout={{ hidden: ['id', 'customer'] }} />);
    open();
    expect(box('Total')).not.toHaveAccessibleDescription();
    fireEvent.click(box('Qty'));
    expect(box('Total')).toHaveAccessibleDescription('At least one column stays shown');
    expect(box('Qty')).not.toHaveAccessibleDescription();
    fireEvent.click(box('Customer'));
    expect(box('Total')).not.toHaveAccessibleDescription();
    expect(box('Total')).not.toHaveAttribute('aria-describedby');
  });

  it('moves the description to the next last column, in the words of the label', () => {
    render(
      <Orders
        labels={{ lastShownColumn: 'Mindestens eine' }}
        defaultColumnLayout={{ hidden: ['id', 'customer', 'qty'] }}
      />,
    );
    open();
    expect(box('Total')).toHaveAccessibleDescription('Mindestens eine');
    fireEvent.click(box('Qty'));
    fireEvent.click(box('Total'));
    expect(box('Qty')).toHaveAccessibleDescription('Mindestens eine');
    expect(box('Total')).not.toHaveAccessibleDescription();
  });

  it('says only the lock for a column that is locked and the last one shown', () => {
    render(<Orders defaultColumnLayout={{ hidden: ['customer', 'qty', 'total'] }} />);
    open();
    expect(box('Order')).toBeDisabled();
    expect(box('Order')).toHaveAccessibleDescription('Always shown');
  });

  it('is not hidden by a press on its box', async () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders defaultColumnLayout={LAST} onColumnLayoutChange={onColumnLayoutChange} />);
    open();
    await userEvent.click(box('Total'));
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    expect(captions()).toEqual(['Total']);
  });
});

describe('the active cell', () => {
  it('goes to the column now at its index when its column is hidden, and the focus stays in the popover', () => {
    render(<Orders />);
    act(() => title('Customer').focus());
    expect(title('Customer')).toHaveAttribute('tabindex', '0');
    open();
    act(() => box('Customer').focus());
    fireEvent.click(box('Customer'));
    expect(captions()).toEqual(['Order', 'Qty', 'Total']);
    expect(title('Qty')).toHaveAttribute('tabindex', '0');
    expect(document.activeElement).toBe(box('Customer'));
  });
});

describe('the toolbar', () => {
  it('holds the caption alone for a grid with no chooser', () => {
    render(<Orders columnChooser={false} />);
    expect(classesOfToolbar()).toEqual([CAPTION]);
    expect(screen.getByRole('heading', { name: 'Orders' })).toBeInTheDocument();
  });

  it('is not drawn without a caption, a description or an item', () => {
    render(<Orders caption={undefined} columnChooser={false} aria-label="Orders" />);
    expect(toolbar()).toBeNull();
  });

  it('is drawn for a chooser alone: the spacer pushes the button to the end', () => {
    render(<Orders caption={undefined} aria-label="Orders" />);
    expect(classesOfToolbar()).toEqual([SPACER, CHOOSER]);
  });

  it('with `toolbar={false}` drops the items and keeps the caption', () => {
    render(<Orders toolbar={false} description="Last week" />);
    expect(button()).toBeNull();
    expect(popover()).toBeNull();
    expect(screen.getByRole('heading', { name: 'Orders' })).toBeInTheDocument();
    expect(screen.getByText('Last week')).toBeInTheDocument();
    expect(grid()).toHaveAccessibleName('Orders');
    expect(classesOfToolbar()).toEqual([CAPTION]);
  });

  it('with `toolbar={false}` and no caption is not drawn', () => {
    render(<Orders toolbar={false} caption={undefined} aria-label="Orders" />);
    expect(toolbar()).toBeNull();
  });

  it('with a function gets the five items, and draws what it returns after the caption', () => {
    const received = vi.fn();
    render(
      <Orders
        toolbar={(items) => {
          received(items);
          return (
            <>
              <button type="button">Mine</button>
              {items.spacer}
              {items.columnChooser}
            </>
          );
        }}
      />,
    );
    const items = received.mock.calls[0]![0];
    expect(Object.keys(items).sort()).toEqual([
      'addButton',
      'columnChooser',
      'groupPanel',
      'search',
      'spacer',
    ]);
    expect(items.addButton).toBeNull();
    // Without `searchPanel` the field is `null`, as the chooser is without `columnChooser` and the panel without `groupPanel`.
    expect(items.search).toBeNull();
    expect(items.groupPanel).toBeNull();
    expect(items.spacer).not.toBeNull();
    expect(items.columnChooser).not.toBeNull();
    expect(classesOfToolbar()).toEqual([CAPTION, '', SPACER, CHOOSER]);
    expect(toolbar()!.children[1]).toHaveTextContent('Mine');
  });

  it('gives a function `null` for the chooser when it is off', () => {
    const received = vi.fn();
    render(
      <Orders
        columnChooser={false}
        toolbar={(items) => {
          received(items);
          return <button type="button">Mine</button>;
        }}
      />,
    );
    expect(received.mock.calls[0]![0].columnChooser).toBeNull();
    expect(button()).toBeNull();
    expect(screen.getByRole('button', { name: 'Mine' })).toBeInTheDocument();
  });

  it('with a function that returns nothing is the caption alone, or no toolbar without one', () => {
    const { unmount } = render(<Orders toolbar={() => null} />);
    expect(button()).toBeNull();
    expect(classesOfToolbar()).toEqual([CAPTION]);
    unmount();
    render(<Orders toolbar={() => null} caption={undefined} aria-label="Orders" />);
    expect(toolbar()).toBeNull();
  });

  it('does not count the spacer as an item: a function that returns only it draws no toolbar', () => {
    const { unmount } = render(
      <Orders toolbar={(items) => items.spacer} caption={undefined} aria-label="Orders" />,
    );
    expect(toolbar()).toBeNull();
    unmount();
    // The spacer with an item that is off (the chooser, left out of the grid's props) is no item either.
    render(
      <Orders
        columnChooser={false}
        toolbar={(items) => [items.spacer, items.columnChooser]}
        caption={undefined}
        aria-label="Orders"
      />,
    );
    expect(toolbar()).toBeNull();
  });

  it('takes a value that is neither `false` nor a function as no `toolbar`', () => {
    // @ts-expect-error `true` is not a toolbar
    render(<Orders toolbar={true} />);
    expect(button()).toBeInTheDocument();
  });

  it('with a function that leaves the chooser out mounts no popover', () => {
    render(<Orders toolbar={() => <span>Own</span>} />);
    expect(button()).toBeNull();
    expect(toolbarPopovers()).toHaveLength(0);
  });
});
