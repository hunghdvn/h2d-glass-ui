import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridColumnLayout, DataGridProps, DataGridState } from './index';

// Reordering the columns (spec phase 6 §3.6, §3.8, §6.3 "Kéo đổi thứ tự"): the drag of a title, the
// drop line and the chip, the source column that is dimmed, the keys, the announcement, and what the
// grid sets and takes off while a drag is in flight. What needs a layout engine to be true (the boxes
// of the line and of the chip, a real mouse, the focus after a move in each engine, no text selected)
// is proven in the stories (`DataGridColumns.stories.tsx`).

// The animation frames the drag asks for (the coalesced moves, the auto-scroll), run by hand.
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
const runFrames = () => {
  const due = [...frames.values()];
  frames.clear();
  act(() => due.forEach((callback) => callback(0)));
};

const HEAD_HEIGHT = 32;
const FRAME_HEIGHT = 200;

beforeEach(() => {
  resetDevWarnings();
  frames = new Map();
  nextFrame = 1;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(nextFrame, callback);
    return nextFrame++;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  // jsdom has no layout, so every element would count as hidden to the code that looks for the
  // controls of a cell.
  HTMLElement.prototype.checkVisibility = () => true;
  // jsdom has no layout. The titles are laid out here from the widths of their captions, in the order
  // the DOM has them (so a move shows), from x 0; the heading is 32px tall and the frame 200px.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const box = (left: number, top: number, right: number, bottom: number) =>
      ({
        left,
        top,
        right,
        bottom,
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
        toJSON: () => ({}),
      }) as DOMRect;
    if (this.matches('th.flg-data-grid-head')) {
      const cells = Array.from((this.parentElement as HTMLTableRowElement).cells);
      let left = 0;
      for (const cell of cells) {
        const width = WIDTH_OF[cell.textContent ?? ''] ?? 0;
        if (cell === this) return box(left, 0, left + width, HEAD_HEIGHT);
        left += width;
      }
    }
    if (this.matches('thead, thead > tr')) return box(0, 0, 504, HEAD_HEIGHT);
    if (this.matches('.flg-data-grid-frame')) return box(0, 0, 504, FRAME_HEIGHT);
    if (this.matches('.flg-data-grid-main')) return box(0, 0, 504, FRAME_HEIGHT);
    return box(0, 0, 0, 0);
  });
  // The box the line is placed in is drawn at its own size.
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.matches('.flg-data-grid-main') ? 504 : 0;
  });
  // The frame shows what its rectangle says.
  for (const [name, value] of [
    ['clientWidth', 504],
    ['clientHeight', FRAME_HEIGHT],
  ] as const) {
    vi.spyOn(HTMLElement.prototype, name, 'get').mockReturnValue(value);
  }
});
afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
  Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.documentElement.removeAttribute('data-flg-grid-cursor');
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
  { id: 'DH-1028', customer: 'Lê An', qty: 12, total: 15400000 },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
  { field: 'customer', caption: 'Customer', width: 200 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
  { field: 'total', caption: 'Total', dataType: 'number', width: 120 },
];
const WIDTH_OF: Record<string, number> = { Order: 104, Customer: 200, Qty: 80, Total: 120 };
const ORDER = ['id', 'customer', 'qty', 'total'];

function Orders(props: Partial<DataGridProps<Order>>) {
  return (
    <DataGrid
      data={ORDERS}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      {...props}
    />
  );
}

/** A grid whose parent keeps the layout, as a caller that saves it does. */
function Controlled({
  onChange,
  keep = true,
  ...props
}: Partial<DataGridProps<Order>> & {
  onChange: (layout: DataGridColumnLayout) => void;
  keep?: boolean;
}) {
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
        if (keep) setLayout(next);
      }}
      {...props}
    />
  );
}

const grid = () => screen.getByRole('grid') as HTMLTableElement;
// The titles of the columns: the filler column's is none.
const titles = () =>
  Array.from(grid().tHead!.rows[0]!.cells).filter(
    (cell) => !cell.classList.contains('flg-data-grid-filler'),
  );
const captions = () => titles().map((cell) => cell.textContent);
const title = (name: string) => titles().find((cell) => cell.textContent?.includes(name))!;
const chip = () => document.querySelector<HTMLElement>('.flg-data-grid-drag-chip');
const line = () => document.querySelector<HTMLElement>('.flg-data-grid-drop-line');
const html = () => document.documentElement;
const region = () => document.querySelector('[aria-live="polite"]')!;
const dimmed = () => grid().querySelectorAll('[data-drag-source]');
// The live region says it a tick after: the timers are the test's, and the frames stay the stub's.
const fakeTimers = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
const tick = () => act(() => void vi.advanceTimersByTime(0));

const POINTER = { pointerId: 1, isPrimary: true, pointerType: 'mouse', button: 0 };
const press = (element: Element, x: number, y = 10, init: PointerEventInit = {}) =>
  fireEvent.pointerDown(element, { ...POINTER, buttons: 1, clientX: x, clientY: y, ...init });
// A move with the main button down, as every move of a press is.
const move = (x: number, y = 10, init: PointerEventInit = {}) =>
  fireEvent.pointerMove(document, { ...POINTER, buttons: 1, clientX: x, clientY: y, ...init });
const release = (x: number, y = 10) =>
  fireEvent.pointerUp(document, { ...POINTER, buttons: 0, clientX: x, clientY: y });

/** A drag of the title `name` to the pointer at `x`, `y`, released there. */
function drag(name: string, x: number, y = 10) {
  const from = title(name);
  press(from, 400);
  move(x, y);
  runFrames();
  release(x, y);
}

// The keys of the platform: ⌘ on Apple and Ctrl elsewhere.
const apple = () => vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
const windows = () => vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
const modShift = { ctrlKey: true, shiftKey: true };

describe('dragging a title', () => {
  it('moves the column to the boundary the pointer is nearest to, with one onColumnLayoutChange', () => {
    const onColumnLayoutChange = vi.fn();
    const onStateChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} onStateChange={onStateChange} />);
    // Total is 384..504; the boundary between Order and Customer is at 104.
    drag('Total', 110);
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
    const layout: DataGridColumnLayout = {
      order: ['id', 'total', 'customer', 'qty'],
      widths: { id: 104, customer: 200, qty: 80, total: 120 },
      hidden: [],
      pinned: {},
    };
    expect(onColumnLayoutChange).toHaveBeenCalledWith(layout);
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({ columnLayout: layout }),
      'columnLayout',
    );
    expect(captions()).toEqual(['Order', 'Total', 'Customer', 'Qty']);
  });

  it('moves a column to the start and to the end', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    drag('Qty', 5);
    expect(onColumnLayoutChange.mock.lastCall![0].order).toEqual([
      'qty',
      'id',
      'customer',
      'total',
    ]);
    drag('Order', 500);
    expect(onColumnLayoutChange.mock.lastCall![0].order).toEqual([
      'qty',
      'customer',
      'total',
      'id',
    ]);
  });

  it('does not start under the threshold of 4px, and is then a click', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    press(title('Total'), 400);
    move(402);
    expect(chip()).toBeNull();
    release(402);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('shows the chip, the line and the dimmed column while it lasts, and nothing before or after', () => {
    render(<Orders />);
    expect(chip()).toBeNull();
    expect(line()).toBeNull();
    expect(dimmed()).toHaveLength(0);
    press(title('Total'), 400);
    move(110);
    runFrames();
    expect(chip()).not.toBeNull();
    expect(chip()).toHaveClass('flg-surface');
    expect(chip()).toHaveAttribute('aria-hidden', 'true');
    expect(chip()).toHaveTextContent('Total');
    expect(chip()!.querySelector('svg')).not.toBeNull();
    expect(line()).not.toBeNull();
    expect(line()).toHaveAttribute('aria-hidden', 'true');
    // The title and each of the three cells of the column, and no other cell.
    expect(dimmed()).toHaveLength(4);
    for (const cell of dimmed()) expect(cell.textContent).toMatch(/Total|[0-9]/);
    release(110);
    expect(chip()).toBeNull();
    expect(line()).toBeNull();
    expect(dimmed()).toHaveLength(0);
  });

  it('puts the chip 16px right of and 16px below the pointer', () => {
    render(<Orders />);
    press(title('Total'), 400);
    move(130, 12);
    runFrames();
    expect(chip()!.style.left).toBe('146px');
    expect(chip()!.style.top).toBe('28px');
    move(200, 20);
    runFrames();
    expect(chip()!.style.left).toBe('216px');
    expect(chip()!.style.top).toBe('36px');
    release(200, 20);
  });

  it('puts the drop line at the boundary, 2px to its left', () => {
    render(<Orders />);
    press(title('Total'), 400);
    move(110);
    runFrames();
    // The boundary between Order and Customer is at 104; the main box is at 0, so the line is at 102.
    expect(line()!.style.left).toBe('102px');
    move(300);
    runFrames();
    // Now the boundary between Customer and Qty, at 304.
    expect(line()!.style.left).toBe('302px');
    release(300);
  });

  it('has no line, and a drop does nothing, beside the column that is dragged', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    press(title('Customer'), 200);
    move(150);
    runFrames();
    expect(line()).toBeNull();
    expect(chip()).not.toBeNull();
    move(250);
    runFrames();
    expect(line()).toBeNull();
    release(250);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('has no line, and a drop cancels, below the heading', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    press(title('Total'), 400);
    move(110, 100);
    runFrames();
    expect(line()).toBeNull();
    release(110, 100);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    expect(captions()).toEqual(['Order', 'Customer', 'Qty', 'Total']);
  });

  it('has no line above the frame either', () => {
    render(<Orders />);
    press(title('Total'), 400);
    move(110, -5);
    runFrames();
    expect(line()).toBeNull();
    release(110, -5);
  });

  it('has no line left or right of the columns', () => {
    render(<Orders />);
    press(title('Customer'), 200);
    move(560);
    runFrames();
    expect(line()).toBeNull();
    move(-30);
    runFrames();
    expect(line()).toBeNull();
    release(-30);
  });

  it('shows no more than the last move of a frame, and writes none per move to the chip but the last', () => {
    render(<Orders />);
    press(title('Total'), 400);
    move(120);
    move(121);
    move(122);
    runFrames();
    expect(chip()!.style.left).toBe('138px');
    release(122);
  });

  it('does not sort: the click of a drag is not delivered', () => {
    const onSortChange = vi.fn();
    render(<Orders onSortChange={onSortChange} />);
    const button = title('Total').querySelector('button')!;
    press(button, 400);
    move(110);
    runFrames();
    release(110);
    fireEvent.click(button);
    expect(onSortChange).not.toHaveBeenCalled();
  });

  it('is a press on the sort button when it does not move: the click sorts', () => {
    const onSortChange = vi.fn();
    render(<Orders onSortChange={onSortChange} />);
    const button = title('Total').querySelector('button')!;
    press(button, 400);
    move(402);
    release(402);
    fireEvent.click(button);
    expect(onSortChange).toHaveBeenCalledTimes(1);
  });

  it('starts from the sort button of a title as from the rest of it', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    press(title('Total').querySelector('button')!, 400);
    move(110);
    runFrames();
    release(110);
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
  });

  it('cancels the mousedown of a press, and focuses the title', () => {
    render(<Orders allowSorting={false} />);
    const total = title('Total');
    expect(document.activeElement).not.toBe(total);
    expect(fireEvent.mouseDown(total, { button: 0 })).toBe(false);
    expect(document.activeElement).toBe(total);
  });

  it('leaves the mousedown of the other buttons alone', () => {
    render(<Orders allowSorting={false} />);
    expect(fireEvent.mouseDown(title('Total'), { button: 2 })).toBe(true);
  });

  it('does not start from the handle that resizes: that press is the resize', () => {
    render(<Orders />);
    press(title('Total').querySelector('.flg-data-grid-resizer')!, 400);
    move(110);
    runFrames();
    expect(chip()).toBeNull();
    expect(line()).toBeNull();
    release(110);
  });

  it('does not start from a popup inside a title', () => {
    render(<Orders />);
    const popup = document.createElement('dialog');
    popup.textContent = 'menu';
    title('Total').appendChild(popup);
    press(popup, 400);
    move(110);
    runFrames();
    expect(chip()).toBeNull();
    release(110);
  });

  it('does not start from the title of the column of boxes', () => {
    render(<Orders selectionMode="multiple" />);
    press(titles()[0]!, 20);
    move(300);
    runFrames();
    expect(chip()).toBeNull();
    release(300);
  });

  it('is for a mouse and a pen: a finger scrolls', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    press(title('Total'), 400, 10, { pointerType: 'touch' });
    move(110, 10, { pointerType: 'touch' });
    runFrames();
    expect(chip()).toBeNull();
    release(110);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    press(title('Total'), 400, 10, { pointerType: 'pen' });
    move(110, 10, { pointerType: 'pen' });
    runFrames();
    expect(chip()).not.toBeNull();
    release(110);
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
  });

  it('is not for a press with another button', () => {
    render(<Orders />);
    press(title('Total'), 400, 10, { button: 2, buttons: 2 });
    move(110, 10, { buttons: 2 });
    runFrames();
    expect(chip()).toBeNull();
    release(110);
  });

  it('cannot start from a column that turns reordering off, and the others pass over it', () => {
    const onColumnLayoutChange = vi.fn();
    render(
      <Orders
        onColumnLayoutChange={onColumnLayoutChange}
        columns={COLUMNS.map((column) => ({ ...column, allowReordering: column.field !== 'qty' }))}
      />,
    );
    press(title('Qty'), 340);
    move(110);
    runFrames();
    expect(chip()).toBeNull();
    release(110);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    // Total goes to the other side of Qty, which cannot move itself.
    drag('Total', 305);
    expect(onColumnLayoutChange.mock.lastCall![0].order).toEqual([
      'id',
      'customer',
      'total',
      'qty',
    ]);
  });

  it('is off for every column when the grid turns it off, and on for the ones that turn it on', () => {
    const onColumnLayoutChange = vi.fn();
    render(
      <Orders
        allowReordering={false}
        onColumnLayoutChange={onColumnLayoutChange}
        columns={COLUMNS.map((column) => ({
          ...column,
          allowReordering: column.field === 'total',
        }))}
      />,
    );
    drag('Qty', 110);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    drag('Total', 110);
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
  });

  it('keeps a drag inside the zone of the column: no line over another zone, and a drop there cancels', () => {
    const onColumnLayoutChange = vi.fn();
    render(
      <Orders
        onColumnLayoutChange={onColumnLayoutChange}
        defaultColumnLayout={{ pinned: { id: 'left' } }}
      />,
    );
    // Order is pinned left and is 0..104: Customer is dragged over it.
    press(title('Customer'), 200);
    move(50);
    runFrames();
    expect(line()).toBeNull();
    release(50);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    // Over its own zone the line shows.
    press(title('Customer'), 200);
    move(400);
    runFrames();
    expect(line()).not.toBeNull();
    release(400);
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
  });

  it('moves a column around the hidden ones, which keep their places', () => {
    const onColumnLayoutChange = vi.fn();
    render(
      <Orders
        onColumnLayoutChange={onColumnLayoutChange}
        defaultColumnLayout={{ hidden: ['customer'] }}
      />,
    );
    // Order 0..104, Qty 104..184, Total 184..304.
    press(title('Total'), 250);
    move(100);
    runFrames();
    release(100);
    expect(onColumnLayoutChange.mock.lastCall![0].order).toEqual([
      'id',
      'customer',
      'total',
      'qty',
    ]);
    expect(captions()).toEqual(['Order', 'Total', 'Qty']);
  });

  it('says where the column went: its place among the shown columns', () => {
    fakeTimers();
    render(<Orders />);
    drag('Total', 110);
    tick();
    expect(region()).toHaveTextContent('Total moved to column 2 of 4');
  });

  it('says it in the words of labels.announceMoved', () => {
    fakeTimers();
    render(
      <Orders
        labels={{
          announceMoved: (caption, position, count) => `${caption} > ${position}/${count}`,
        }}
      />,
    );
    drag('Total', 110);
    tick();
    expect(region()).toHaveTextContent('Total > 2/4');
  });

  it('says nothing, and calls nothing, for a drop that moves nothing', () => {
    fakeTimers();
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    drag('Total', 350);
    tick();
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    expect(region()).toBeEmptyDOMElement();
  });

  it('gives a controlled parent its change at the release, and shows what the parent keeps', () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    press(title('Total'), 400);
    move(110);
    runFrames();
    expect(onChange).not.toHaveBeenCalled();
    expect(captions()).toEqual(['Order', 'Customer', 'Qty', 'Total']);
    release(110);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(captions()).toEqual(['Order', 'Total', 'Customer', 'Qty']);
  });

  it('leaves the column where it was when a controlled parent keeps its layout', () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} keep={false} />);
    drag('Total', 110);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(captions()).toEqual(['Order', 'Customer', 'Qty', 'Total']);
    expect(dimmed()).toHaveLength(0);
  });
});

describe('ending a drag', () => {
  const start = () => {
    press(title('Total'), 400);
    move(110);
    runFrames();
    expect(chip()).not.toBeNull();
  };
  const settled = () => {
    expect(chip()).toBeNull();
    expect(line()).toBeNull();
    expect(dimmed()).toHaveLength(0);
    expect(html()).not.toHaveAttribute('data-flg-grid-cursor');
    expect(captions()).toEqual(['Order', 'Customer', 'Qty', 'Total']);
  };

  it('moves and calls nothing on Escape, and then has nothing left of the drag', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    start();
    fireEvent.keyDown(document, { key: 'Escape' });
    settled();
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    release(110);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('moves and calls nothing on pointercancel', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    start();
    fireEvent.pointerCancel(document, POINTER);
    settled();
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('is a cancel when the pointer capture is lost before the release', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    start();
    fireEvent(title('Total'), Object.assign(new Event('lostpointercapture'), { pointerId: 1 }));
    settled();
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('is over at the first move that has no button down, a release nobody heard', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    start();
    move(110, 10, { buttons: 0 });
    expect(chip()).toBeNull();
    expect(html()).not.toHaveAttribute('data-flg-grid-cursor');
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
  });

  it('takes the cursor off <html> on the release, a cancel and when the grid goes mid-drag', () => {
    const { unmount } = render(<Orders />);
    expect(html()).not.toHaveAttribute('data-flg-grid-cursor');
    start();
    expect(html()).toHaveAttribute('data-flg-grid-cursor', 'grabbing');
    release(110);
    expect(html()).not.toHaveAttribute('data-flg-grid-cursor');
    start();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(html()).not.toHaveAttribute('data-flg-grid-cursor');
    press(title('Total'), 400);
    move(110);
    runFrames();
    expect(html()).toHaveAttribute('data-flg-grid-cursor', 'grabbing');
    unmount();
    expect(html()).not.toHaveAttribute('data-flg-grid-cursor');
    expect(chip()).toBeNull();
    // No frame is left to run, and the pointer going on does nothing.
    expect(frames.size).toBe(0);
    release(110);
  });

  it('leaves the cursor mark of a resize that is in flight alone, and a resize takes none of this one', () => {
    render(<Orders />);
    start();
    release(110);
    expect(html()).not.toHaveAttribute('data-flg-grid-cursor');
  });
});

describe('the chip', () => {
  it('is shown as a popover where the browser has them, and hidden at the end', () => {
    const show = vi.fn();
    const hide = vi.fn();
    HTMLElement.prototype.showPopover = show;
    HTMLElement.prototype.hidePopover = hide;
    render(<Orders />);
    press(title('Total'), 400);
    move(110);
    runFrames();
    expect(chip()).toHaveAttribute('popover', 'manual');
    expect(show).toHaveBeenCalledTimes(1);
    expect(show.mock.contexts[0]).toBe(chip());
    release(110);
    // The element is taken out of the DOM: nothing is left in the top layer.
    expect(chip()).toBeNull();
  });

  it('is drawn without the popover where it is not there, and nothing throws', () => {
    expect('showPopover' in HTMLElement.prototype).toBe(false);
    render(<Orders />);
    press(title('Total'), 400);
    move(110);
    runFrames();
    expect(chip()).not.toBeNull();
    release(110);
  });

  it('is not in the DOM without a drag', () => {
    render(<Orders />);
    expect(chip()).toBeNull();
    // The one popover of a grid that has not been dragged is the menu of its columns.
    expect(
      Array.from(document.querySelectorAll('[popover]'), (popover) => popover.className),
    ).toEqual([expect.stringContaining('flg-data-grid-column-menu')]);
  });

  it('is one for the grid, with the caption of the column that is dragged', () => {
    render(<Orders />);
    press(title('Customer'), 200);
    move(400);
    runFrames();
    expect(document.querySelectorAll('.flg-data-grid-drag-chip')).toHaveLength(1);
    expect(chip()).toHaveTextContent('Customer');
    release(400);
  });
});

describe('the frame that scrolls under the pointer', () => {
  it('is scrolled sideways only, while the pointer is near its edge, and no more once the drag is over', () => {
    render(<Orders />);
    const frame = grid().parentElement as HTMLElement;
    frame.scrollLeft = 0;
    press(title('Customer'), 200);
    move(500);
    runFrames();
    expect(frame.scrollLeft).toBeGreaterThan(0);
    const scrolled = frame.scrollLeft;
    release(500);
    runFrames();
    expect(frame.scrollLeft).toBe(scrolled);
    expect(frames.size).toBe(0);
  });

  it('is not scrolled by a drag of a pinned title, whose zone does not scroll', () => {
    render(<Orders defaultColumnLayout={{ pinned: { id: 'left', customer: 'left' } }} />);
    const frame = grid().parentElement as HTMLElement;
    frame.scrollLeft = 0;
    press(title('Customer'), 200);
    move(500);
    runFrames();
    expect(frame.scrollLeft).toBe(0);
    expect(frames.size).toBe(0);
    release(500);
  });

  it('works out the line again when the frame scrolls under a pointer that rests', () => {
    render(<Orders />);
    const frame = grid().parentElement as HTMLElement;
    press(title('Total'), 400);
    move(110);
    runFrames();
    expect(line()!.style.left).toBe('102px');
    // The columns move 50px left under the pointer: the boundary at 104 is now at 54, the next at 254.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const base = {
        top: 0,
        bottom: HEAD_HEIGHT,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        toJSON: () => ({}),
      };
      if (this.matches('th.flg-data-grid-head')) {
        const cells = Array.from((this.parentElement as HTMLTableRowElement).cells);
        let left = -50;
        for (const cell of cells) {
          const width = WIDTH_OF[cell.textContent ?? ''] ?? 0;
          if (cell === this) return { ...base, left, right: left + width } as DOMRect;
          left += width;
        }
      }
      if (this.matches('.flg-data-grid-frame, .flg-data-grid-main')) {
        return { ...base, left: 0, right: 504, bottom: FRAME_HEIGHT } as DOMRect;
      }
      if (this.matches('thead, thead > tr')) return { ...base, left: 0, right: 504 } as DOMRect;
      return { ...base, left: 0, right: 504 } as DOMRect;
    });
    act(() => {
      frame.dispatchEvent(new Event('scroll'));
    });
    expect(line()!.style.left).toBe('52px');
    release(110);
  });
});

describe('the keys', () => {
  const focusTitle = (name: string) => {
    act(() => title(name).focus());
  };
  // The key goes to the element that has the focus, as a key does.
  const press = (name: string, init: KeyboardEventInit = modShift) =>
    fireEvent.keyDown(document.activeElement as Element, { key: name, ...init });

  it('mod+Shift+Right moves the title one place within its zone, with one change', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    focusTitle('Customer');
    press('ArrowRight');
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
    expect(onColumnLayoutChange.mock.lastCall![0].order).toEqual([
      'id',
      'qty',
      'customer',
      'total',
    ]);
    expect(captions()).toEqual(['Order', 'Qty', 'Customer', 'Total']);
    press('ArrowLeft');
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(2);
    expect(captions()).toEqual(['Order', 'Customer', 'Qty', 'Total']);
  });

  it('calls onStateChange once for a press, with the layout as shown', () => {
    const onStateChange = vi.fn<(state: DataGridState, change: string) => void>();
    render(<Orders onStateChange={onStateChange} />);
    focusTitle('Customer');
    press('ArrowRight');
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange.mock.calls[0]![1]).toBe('columnLayout');
    expect(onStateChange.mock.calls[0]![0].columnLayout.order).toEqual([
      'id',
      'qty',
      'customer',
      'total',
    ]);
  });

  it('prevents the key, also where the column cannot move', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    // The edges of the zone.
    focusTitle('Order');
    expect(press('ArrowLeft')).toBe(false);
    focusTitle('Total');
    expect(press('ArrowRight')).toBe(false);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    expect(region()).toBeEmptyDOMElement();
  });

  it('prevents the key on a column that cannot be moved, and moves nothing', () => {
    const onColumnLayoutChange = vi.fn();
    render(
      <Orders
        onColumnLayoutChange={onColumnLayoutChange}
        columns={COLUMNS.map((column) => ({ ...column, allowReordering: column.field !== 'qty' }))}
      />,
    );
    focusTitle('Qty');
    expect(press('ArrowRight')).toBe(false);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    // The columns beside it still go past it.
    focusTitle('Customer');
    press('ArrowRight');
    expect(onColumnLayoutChange.mock.lastCall![0].order).toEqual([
      'id',
      'qty',
      'customer',
      'total',
    ]);
  });

  it('stays within the zone: a pinned column does not leave its zone', () => {
    const onColumnLayoutChange = vi.fn();
    render(
      <Orders
        onColumnLayoutChange={onColumnLayoutChange}
        defaultColumnLayout={{ pinned: { id: 'left', customer: 'left' } }}
      />,
    );
    // Order and Customer are the left zone, Qty and Total the middle.
    focusTitle('Customer');
    expect(press('ArrowRight')).toBe(false);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    press('ArrowLeft');
    expect(onColumnLayoutChange.mock.lastCall![0].order).toEqual([
      'customer',
      'id',
      'qty',
      'total',
    ]);
    focusTitle('Qty');
    expect(press('ArrowLeft')).toBe(false);
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
  });

  it('goes past the next shown column and leaves a hidden one where it is', () => {
    const onColumnLayoutChange = vi.fn();
    render(
      <Orders
        onColumnLayoutChange={onColumnLayoutChange}
        defaultColumnLayout={{ hidden: ['qty'] }}
      />,
    );
    focusTitle('Customer');
    press('ArrowRight');
    expect(onColumnLayoutChange.mock.lastCall![0].order).toEqual([
      'id',
      'qty',
      'total',
      'customer',
    ]);
    expect(onColumnLayoutChange.mock.lastCall![0].hidden).toEqual(['qty']);
  });

  it('says where the column went', () => {
    fakeTimers();
    render(<Orders />);
    focusTitle('Customer');
    press('ArrowRight');
    tick();
    expect(region()).toHaveTextContent('Customer moved to column 3 of 4');
  });

  it('uses Ctrl on a PC and ⌘ on a Mac, and not the other', () => {
    const onColumnLayoutChange = vi.fn();
    windows();
    const { unmount } = render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    focusTitle('Customer');
    press('ArrowRight', { metaKey: true, shiftKey: true });
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    press('ArrowRight');
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
    unmount();
    vi.restoreAllMocks();
    apple();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    focusTitle('Customer');
    press('ArrowRight');
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
    press('ArrowRight', { metaKey: true, shiftKey: true });
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(2);
  });

  it('wants exactly those modifiers: no Alt, and Shift', () => {
    const onColumnLayoutChange = vi.fn();
    windows();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    focusTitle('Customer');
    press('ArrowRight', { ctrlKey: true });
    press('ArrowRight', { shiftKey: true });
    press('ArrowRight', { ctrlKey: true, shiftKey: true, altKey: true });
    press('ArrowRight', { ctrlKey: true, shiftKey: true, metaKey: true });
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('is not for the cell of a row or the title of the column of boxes', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders selectionMode="multiple" onColumnLayoutChange={onColumnLayoutChange} />);
    act(() => titles()[0]!.focus());
    press('ArrowRight');
    const cell = grid().tBodies[0]!.rows[0]!.cells[2]!;
    act(() => cell.focus());
    press('ArrowRight');
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('is not the key of the grid when a control of the title has the focus', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    const button = title('Customer').querySelector('button')!;
    act(() => button.focus());
    press('ArrowRight');
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('keeps the focus on the moved title', () => {
    render(<Orders />);
    focusTitle('Customer');
    press('ArrowRight');
    expect(document.activeElement).toBe(title('Customer'));
    expect(titles().indexOf(title('Customer'))).toBe(2);
    press('ArrowRight');
    expect(document.activeElement).toBe(title('Customer'));
    expect(titles().indexOf(title('Customer'))).toBe(3);
  });

  it('scrolls the moved title into view, the least it takes', () => {
    render(<Orders />);
    focusTitle('Customer');
    // jsdom has no scrollIntoView.
    const scrolled = vi.fn();
    Element.prototype.scrollIntoView = scrolled;
    try {
      press('ArrowRight');
      expect(scrolled).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
      expect(scrolled.mock.contexts.at(-1)).toBe(title('Customer'));
    } finally {
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
    }
  });

  it('gives the focus back to the moved title when the move took it', () => {
    render(<Orders />);
    focusTitle('Customer');
    // An engine may drop the focus of a node that React moves: it is on the body after the move.
    const drop = vi.spyOn(Node.prototype, 'insertBefore').mockImplementation(function (
      this: Node,
      node: Node,
      child: Node | null,
    ) {
      drop.mockRestore();
      const result = this.insertBefore(node, child);
      (document.activeElement as HTMLElement | null)?.blur();
      return result;
    });
    press('ArrowRight');
    expect(titles().indexOf(title('Customer'))).toBe(2);
    expect(document.activeElement).toBe(title('Customer'));
  });

  it('does not take a focus that is in another place of the page', () => {
    // A menu that the key opened, say, has the focus by the time the commit of the move is done.
    render(
      <>
        <Orders onColumnLayoutChange={() => elsewhere.focus()} />
        <button type="button">elsewhere</button>
      </>,
    );
    const elsewhere = screen.getByRole('button', { name: 'elsewhere' });
    focusTitle('Customer');
    press('ArrowRight');
    expect(titles().indexOf(title('Customer'))).toBe(2);
    expect(document.activeElement).toBe(elsewhere);
  });

  it('keeps the arrows going on from the moved title', () => {
    render(<Orders />);
    focusTitle('Customer');
    press('ArrowRight');
    press('ArrowRight', {});
    expect(document.activeElement).toBe(title('Total'));
  });
});
