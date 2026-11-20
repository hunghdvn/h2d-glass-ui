import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type {
  DataGridColumn,
  DataGridColumnLayout,
  DataGridHandle,
  DataGridProps,
  DataGridState,
} from './index';

// Resizing the columns (spec phase 6 §3.7, §3.8, §6.3 "Đổi độ rộng"): the handle, the drag, the live
// widths, the freeze of the flexible columns, the release, the keys, the double press that fits, and
// what the grid sets and takes off while a drag is in flight. What needs a layout engine to be true
// (the guide's box, a fit against real text, no text selected, a real mouse) is proven in the stories
// (`DataGridColumns.stories.tsx`).

// The animation frames the drag asks for (the coalesced moves, the auto-scroll), run by hand.
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
const runFrames = () => {
  const due = [...frames.values()];
  frames.clear();
  act(() => due.forEach((callback) => callback(0)));
};

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
  // jsdom has no layout: every box is where the pointer of a test is, wide, with no size of its own, so
  // the frame does not scroll under it (a test of the auto-scroll gives the frame its own box).
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: 10000,
    bottom: 10000,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
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
const FLEXIBLE: DataGridColumn<Order>[] = COLUMNS.map((column) => ({
  ...column,
  width: undefined,
}));

const WIDTHS = { id: 104, customer: 200, qty: 80, total: 120 };

function Orders({
  handleRef,
  ...props
}: Partial<DataGridProps<Order>> & { handleRef?: Ref<DataGridHandle> }) {
  return (
    <DataGrid
      ref={handleRef}
      data={ORDERS}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      {...props}
    />
  );
}

const grid = () => screen.getByRole('grid') as HTMLTableElement;
const frame = () => grid().parentElement as HTMLElement;
// The titles of the columns: the filler column's is none.
const titles = () =>
  Array.from(grid().tHead!.rows[0]!.cells).filter(
    (cell) => !cell.classList.contains('flg-data-grid-filler'),
  );
const title = (name: string) => titles().find((cell) => cell.textContent?.includes(name))!;
const handleOf = (name: string) =>
  title(name).querySelector<HTMLElement>('.flg-data-grid-resizer') as HTMLElement;
const cols = () => Array.from(grid().querySelectorAll<HTMLElement>('col'));
const widthOf = (index: number) => cols()[index]!.style.width;
const html = () => document.documentElement;

const POINTER = { pointerId: 1, isPrimary: true, pointerType: 'mouse', button: 0 };
const press = (element: Element, x: number, init: PointerEventInit = {}) =>
  fireEvent.pointerDown(element, { ...POINTER, buttons: 1, clientX: x, clientY: 10, ...init });
// A move with the main button down, as every move of a press is.
const move = (x: number, init: PointerEventInit = {}) =>
  fireEvent.pointerMove(document, { ...POINTER, buttons: 1, clientX: x, clientY: 10, ...init });
const release = (x: number) =>
  fireEvent.pointerUp(document, { ...POINTER, buttons: 0, clientX: x, clientY: 10 });

/** A drag of a handle by `dx` from where it is pressed, released there. */
function drag(handle: Element, dx: number, startX = 300) {
  press(handle, startX);
  move(startX + dx);
  runFrames();
  release(startX + dx);
}

describe('the handle', () => {
  it('is the last child of the title of each column that can be resized', () => {
    render(<Orders />);
    const handles = titles().map((cell) => cell.querySelector('.flg-data-grid-resizer'));
    expect(handles).toHaveLength(4);
    for (const [index, handle] of handles.entries()) {
      expect(handle, `title ${index}`).not.toBeNull();
      expect(handle).toBe(titles()[index]!.lastElementChild);
      expect(handle).toHaveAttribute('aria-hidden', 'true');
      expect(handle).not.toHaveAttribute('tabindex');
    }
  });

  it('is on no title of a grid that turns resizing off, and on those columns that turn it on', () => {
    const { rerender } = render(<Orders allowResizing={false} />);
    expect(grid().querySelectorAll('.flg-data-grid-resizer')).toHaveLength(0);
    rerender(
      <Orders
        allowResizing={false}
        columns={COLUMNS.map((column, index) => ({ ...column, allowResizing: index === 1 }))}
      />,
    );
    expect(grid().querySelectorAll('.flg-data-grid-resizer')).toHaveLength(1);
    expect(handleOf('Customer')).not.toBeNull();
  });

  it('is on no title of a column that turns resizing off', () => {
    render(
      <Orders
        columns={COLUMNS.map((column) => ({ ...column, allowResizing: column.field !== 'qty' }))}
      />,
    );
    expect(title('Qty').querySelector('.flg-data-grid-resizer')).toBeNull();
    expect(grid().querySelectorAll('.flg-data-grid-resizer')).toHaveLength(3);
  });

  it('is not on the title of the column of boxes', () => {
    render(<Orders selectionMode="multiple" />);
    expect(titles()[0]!.querySelector('.flg-data-grid-resizer')).toBeNull();
    expect(grid().querySelectorAll('.flg-data-grid-resizer')).toHaveLength(4);
  });

  it('cancels the mousedown of a press and focuses the title, and sorts nothing', () => {
    const onSortChange = vi.fn();
    render(<Orders onSortChange={onSortChange} />);
    const customer = title('Customer');
    expect(document.activeElement).not.toBe(customer);
    const proceeded = fireEvent.mouseDown(handleOf('Customer'), { button: 0 });
    expect(proceeded).toBe(false);
    expect(document.activeElement).toBe(customer);
    fireEvent.click(handleOf('Customer'));
    expect(onSortChange).not.toHaveBeenCalled();
  });

  it('leaves the mousedown of the other buttons alone', () => {
    render(<Orders />);
    expect(fireEvent.mouseDown(handleOf('Customer'), { button: 2 })).toBe(true);
  });
});

describe('dragging a handle', () => {
  it('writes the width of the column on its <col> as the pointer moves, held to its least width', () => {
    render(<Orders />);
    expect(widthOf(1)).toBe('200px');
    press(handleOf('Customer'), 300);
    move(340);
    expect(widthOf(1)).toBe('240px');
    move(250);
    runFrames();
    expect(widthOf(1)).toBe('150px');
    move(-500);
    runFrames();
    expect(widthOf(1)).toBe('60px');
    move(9000);
    runFrames();
    expect(widthOf(1)).toBe('2000px');
    release(9000);
  });

  it('holds the width to the minWidth of the column, and the table is as wide as the columns', () => {
    render(<Orders columns={COLUMNS.map((column) => ({ ...column, minWidth: 90 }))} />);
    press(handleOf('Customer'), 300);
    move(100);
    expect(widthOf(1)).toBe('90px');
    expect(grid().style.width).toBe('394px');
    release(100);
  });

  it('never moves a width the other way from the pointer, for a column under its minimum', () => {
    const onColumnLayoutChange = vi.fn();
    render(
      <Orders
        onColumnLayoutChange={onColumnLayoutChange}
        columns={[COLUMNS[0]!, { ...COLUMNS[1]!, width: 40 }, ...COLUMNS.slice(2)]}
      />,
    );
    press(handleOf('Customer'), 300);
    // Narrower than its own 40px is under the least width: it stays.
    move(290);
    runFrames();
    expect(widthOf(1)).toBe('40px');
    // Wider goes to the least width at once, and back where it began is where it began.
    move(305);
    runFrames();
    expect(widthOf(1)).toBe('60px');
    move(290);
    runFrames();
    expect(widthOf(1)).toBe('40px');
    release(290);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('never moves a width over 2000 wider, and narrows it to 2000', () => {
    render(<Orders columns={[...COLUMNS.slice(0, 3), { ...COLUMNS[3]!, width: 2500 }]} />);
    press(handleOf('Total'), 300);
    move(320);
    runFrames();
    expect(widthOf(3)).toBe('2500px');
    move(290);
    runFrames();
    expect(widthOf(3)).toBe('2000px');
    release(290);
  });

  it('does not start under the threshold of 4px, and is then a click', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    press(handleOf('Customer'), 300);
    move(302);
    expect(widthOf(1)).toBe('200px');
    release(302);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('calls onColumnLayoutChange once, at the release, with the layout as shown', () => {
    const onColumnLayoutChange = vi.fn();
    const onStateChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} onStateChange={onStateChange} />);
    press(handleOf('Customer'), 300);
    move(330);
    move(340);
    runFrames();
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    release(340);
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
    const layout: DataGridColumnLayout = {
      order: ['id', 'customer', 'qty', 'total'],
      widths: { ...WIDTHS, customer: 240 },
      hidden: [],
      pinned: {},
    };
    expect(onColumnLayoutChange).toHaveBeenCalledWith(layout);
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({ columnLayout: layout }),
      'columnLayout',
    );
    expect(widthOf(1)).toBe('240px');
  });

  it('puts the width in what getState() gives', () => {
    const handle = createRef<DataGridHandle>();
    render(<Orders handleRef={handle} />);
    drag(handleOf('Total'), -30);
    expect(handle.current!.getState().columnLayout.widths.total).toBe(90);
  });

  it('calls nothing for a drag that ends where it began, and the layout stays', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    press(handleOf('Customer'), 300);
    move(340);
    move(300);
    runFrames();
    release(300);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    expect(widthOf(1)).toBe('200px');
  });

  it('takes the live width away at the release, so a parent that keeps its layout sees the column go back', () => {
    const onColumnLayoutChange = vi.fn();
    const layout: DataGridColumnLayout = {
      order: ['id', 'customer', 'qty', 'total'],
      widths: WIDTHS,
      hidden: [],
      pinned: {},
    };
    render(<Orders columnLayout={layout} onColumnLayoutChange={onColumnLayoutChange} />);
    drag(handleOf('Customer'), 60);
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
    expect(widthOf(1)).toBe('200px');
  });

  it('follows a parent that takes the new layout', () => {
    function Parent() {
      return <Orders defaultColumnLayout={{ widths: WIDTHS }} />;
    }
    render(<Parent />);
    drag(handleOf('Customer'), 60);
    expect(widthOf(1)).toBe('260px');
  });

  it('is cancelled by Escape: the live width goes and nothing is called', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    press(handleOf('Customer'), 300);
    move(360);
    expect(widthOf(1)).toBe('260px');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(widthOf(1)).toBe('200px');
    release(360);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('is cancelled by pointercancel: the live width goes and nothing is called', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    press(handleOf('Customer'), 300);
    move(360);
    fireEvent.pointerCancel(document, { ...POINTER });
    expect(widthOf(1)).toBe('200px');
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('is cancelled by a lost capture', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    press(handleOf('Customer'), 300);
    move(360);
    fireEvent(handleOf('Customer'), new Event('lostpointercapture'));
    expect(widthOf(1)).toBe('260px');
    fireEvent(
      handleOf('Customer'),
      Object.assign(new Event('lostpointercapture'), { pointerId: 1 }),
    );
    expect(widthOf(1)).toBe('200px');
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('ends quietly at a move with no button down before the threshold, which is a release that was lost', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    press(handleOf('Customer'), 300);
    move(360, { buttons: 0 });
    move(380);
    expect(widthOf(1)).toBe('200px');
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('ends at a move with no button down after it started, with the width the pointer had', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    press(handleOf('Customer'), 300);
    move(340);
    move(500, { buttons: 0 });
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
    expect(onColumnLayoutChange.mock.calls[0]![0].widths.customer).toBe(240);
  });

  it('does not start from the right button, nor from a pointer that is not the primary', () => {
    render(<Orders />);
    press(handleOf('Customer'), 300, { button: 2, buttons: 2 });
    move(360);
    expect(widthOf(1)).toBe('200px');
    release(360);
    press(handleOf('Customer'), 300, { isPrimary: false });
    move(360);
    expect(widthOf(1)).toBe('200px');
  });

  it('works with a finger as it does with a mouse', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    press(handleOf('Customer'), 300, { pointerType: 'touch' });
    fireEvent.pointerMove(document, {
      ...POINTER,
      pointerType: 'touch',
      buttons: 1,
      clientX: 330,
      clientY: 10,
    });
    expect(widthOf(1)).toBe('230px');
    fireEvent.pointerUp(document, {
      ...POINTER,
      pointerType: 'touch',
      buttons: 0,
      clientX: 330,
      clientY: 10,
    });
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
  });

  it('never sorts: the click that the release makes is not delivered', () => {
    const onSortChange = vi.fn();
    render(<Orders onSortChange={onSortChange} />);
    drag(handleOf('Customer'), 40);
    const sort = title('Customer').querySelector('button')!;
    fireEvent.click(sort);
    fireEvent.click(handleOf('Customer'));
    expect(onSortChange).not.toHaveBeenCalled();
  });

  it('writes the width of a column that is pinned, and moves what sticks after it', () => {
    render(<Orders defaultColumnLayout={{ pinned: { id: 'left', customer: 'left' } }} />);
    press(handleOf('Order'), 300);
    move(320);
    expect(widthOf(0)).toBe('124px');
    // The second pinned column sticks after the first, wherever it is wide.
    expect(grid().style.getPropertyValue('--flg-data-grid-pin-1')).toBe(
      'calc(124px - var(--flg-data-grid-pin-inset))',
    );
    release(320);
  });
});

describe('what a drag sets and takes off', () => {
  const cursor = () => html().getAttribute('data-flg-grid-cursor');

  it('marks the page with the resize cursor while it is dragged, and takes it off at the release', () => {
    render(<Orders />);
    expect(cursor()).toBeNull();
    press(handleOf('Customer'), 300);
    expect(cursor()).toBeNull();
    move(340);
    expect(cursor()).toBe('col-resize');
    expect(handleOf('Customer')).toHaveAttribute('data-dragging');
    release(340);
    expect(cursor()).toBeNull();
    expect(handleOf('Customer')).not.toHaveAttribute('data-dragging');
  });

  it('takes the mark off on Escape, on pointercancel and on a lost capture', () => {
    render(<Orders />);
    press(handleOf('Customer'), 300);
    move(340);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(cursor()).toBeNull();
    expect(handleOf('Customer')).not.toHaveAttribute('data-dragging');
    release(340);

    press(handleOf('Customer'), 300);
    move(340);
    fireEvent.pointerCancel(document, { ...POINTER });
    expect(cursor()).toBeNull();

    press(handleOf('Customer'), 300);
    move(340);
    fireEvent(
      handleOf('Customer'),
      Object.assign(new Event('lostpointercapture'), { pointerId: 1 }),
    );
    expect(cursor()).toBeNull();
  });

  it('takes the mark off when the grid goes in the middle of a drag, and runs no frame after', () => {
    const { unmount } = render(<Orders />);
    press(handleOf('Customer'), 300);
    move(340);
    expect(cursor()).toBe('col-resize');
    unmount();
    expect(cursor()).toBeNull();
    runFrames();
    expect(frames.size).toBe(0);
  });

  it('shows the guide with the width, and takes both away at the end', () => {
    render(<Orders />);
    expect(document.querySelector('.flg-data-grid-resize-guide')).toBeNull();
    press(handleOf('Customer'), 300);
    expect(document.querySelector('.flg-data-grid-resize-guide')).toBeNull();
    move(340);
    const guide = document.querySelector('.flg-data-grid-resize-guide')!;
    expect(guide).toHaveAttribute('aria-hidden', 'true');
    const pill = guide.querySelector('.flg-data-grid-width-pill')!;
    expect(pill).toHaveTextContent('240 px');
    move(350);
    runFrames();
    expect(pill).toHaveTextContent('250 px');
    release(350);
    expect(document.querySelector('.flg-data-grid-resize-guide')).toBeNull();
  });

  it('says the width in the words of labels.columnWidth', () => {
    render(<Orders labels={{ columnWidth: (px) => `${px} điểm ảnh` }} />);
    press(handleOf('Customer'), 300);
    move(340);
    expect(document.querySelector('.flg-data-grid-width-pill')).toHaveTextContent('240 điểm ảnh');
    release(340);
  });

  it('has the guide and the pill in the grid, outside the table, and nowhere without a drag', () => {
    render(<Orders />);
    press(handleOf('Customer'), 300);
    move(340);
    const guide = document.querySelector('.flg-data-grid-resize-guide')!;
    expect(guide.closest('table')).toBeNull();
    expect(guide.closest('.flg-data-grid')).not.toBeNull();
    release(340);
  });

  it('listens to the document only while a drag is in flight, and to the frame never', () => {
    const added = vi.spyOn(document, 'addEventListener');
    const addedToFrame = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    const removed = vi.spyOn(HTMLElement.prototype, 'removeEventListener');
    const count = (spy: typeof added, type: string) =>
      spy.mock.calls.filter(([name]) => name === type).length;
    render(<Orders />);
    expect(count(added, 'pointermove')).toBe(0);
    const before = count(addedToFrame, 'scroll');
    press(handleOf('Customer'), 300);
    expect(count(added, 'pointermove')).toBe(1);
    move(340);
    // A scroll of the frame is not read: the width counts the scroll the auto-scroll reported.
    expect(count(addedToFrame, 'scroll')).toBe(before);
    release(340);
    expect(count(removed, 'scroll')).toBe(0);
    expect(count(added, 'pointermove')).toBe(1);
  });
});

describe('scrolling the frame under a drag', () => {
  function stubFrame(box: { left: number; right: number }) {
    const element = frame();
    element.getBoundingClientRect = () =>
      ({ ...box, top: 0, bottom: 200, width: box.right - box.left, height: 200 }) as DOMRect;
    return element;
  }

  it('scrolls the frame while the pointer is at its edge, and the width follows what it scrolled', () => {
    render(<Orders />);
    const element = stubFrame({ left: 0, right: 400 });
    press(handleOf('Customer'), 300);
    // Within 40px of the right edge, at the edge: 20px a frame.
    move(400);
    expect(widthOf(1)).toBe('300px');
    runFrames();
    expect(element.scrollLeft).toBe(20);
    // The frame reported the 20px it scrolled: the width is the pointer's and that scroll.
    expect(widthOf(1)).toBe('320px');
    runFrames();
    expect(element.scrollLeft).toBe(40);
    release(400);
  });

  it('stops scrolling at the end, and at a cancel', () => {
    render(<Orders />);
    stubFrame({ left: 0, right: 400 });
    press(handleOf('Customer'), 300);
    move(400);
    expect(frames.size).toBeGreaterThan(0);
    release(400);
    expect(frames.size).toBe(0);

    press(handleOf('Customer'), 300);
    move(400);
    expect(frames.size).toBeGreaterThan(0);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(frames.size).toBe(0);
  });

  // An element whose scrollLeft is clamped to 0..max, as an engine clamps it.
  function clampScroll(element: HTMLElement, max: number) {
    let at = 0;
    Object.defineProperty(element, 'scrollLeft', {
      get: () => at,
      set: (value: number) => {
        at = Math.min(Math.max(value, 0), max);
      },
    });
    return {
      set: (value: number) => {
        at = value;
      },
    };
  }

  it('counts a clamp of the frame for nothing: a column narrowed at the end keeps its width', () => {
    render(<Orders />);
    const element = stubFrame({ left: 0, right: 1000 });
    const scroll = clampScroll(element, 100);
    scroll.set(100);
    press(handleOf('Customer'), 300);
    move(280);
    // The table is narrower and the engine pulls the frame back: a scroll event no drag asked for.
    scroll.set(80);
    fireEvent.scroll(element);
    runFrames();
    expect(widthOf(1)).toBe('180px');
    release(280);
    expect(widthOf(1)).toBe('180px');
  });

  it('adds only the scroll the auto-scroll made, up to the end of the frame', () => {
    render(<Orders />);
    const element = stubFrame({ left: 0, right: 400 });
    clampScroll(element, 30);
    press(handleOf('Customer'), 300);
    move(400);
    runFrames();
    expect(widthOf(1)).toBe('320px');
    runFrames();
    // 10px were left: the width gains 10, not 20, and the loop rests.
    expect(widthOf(1)).toBe('330px');
    expect(frames.size).toBe(1);
    runFrames();
    expect(widthOf(1)).toBe('330px');
    expect(frames.size).toBe(0);
    release(400);
  });

  it('does not scroll the frame for a pinned column, whose handle stays where it is', () => {
    render(<Orders defaultColumnLayout={{ pinned: { total: 'right' } }} />);
    const element = stubFrame({ left: 0, right: 400 });
    press(handleOf('Total'), 395);
    move(385);
    runFrames();
    runFrames();
    fireEvent.scroll(element);
    expect(element.scrollLeft).toBe(0);
    expect(frames.size).toBe(0);
    // The right zone follows the filler column, so Total is the fifth col.
    expect(widthOf(4)).toBe('110px');
    release(385);
    expect(widthOf(4)).toBe('110px');
  });

  it('scrolls nothing for a pointer far from the edges', () => {
    render(<Orders />);
    const element = stubFrame({ left: 0, right: 1000 });
    press(handleOf('Customer'), 300);
    move(400);
    runFrames();
    expect(element.scrollLeft).toBe(0);
    release(400);
  });
});

describe('the widths of columns that have none', () => {
  function stubRoom(width: number) {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('flg-table-frame') ? width : 0;
    });
  }

  it('are written, with the width of the dragged column, when the first column is resized', () => {
    stubRoom(1000);
    const onColumnLayoutChange = vi.fn();
    render(<Orders columns={FLEXIBLE} onColumnLayoutChange={onColumnLayoutChange} />);
    expect(cols().map((col) => col.style.width)).toEqual(['250px', '250px', '250px', '250px']);
    drag(handleOf('Customer'), 50);
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
    expect(onColumnLayoutChange.mock.calls[0]![0].widths).toEqual({
      id: 250,
      customer: 300,
      qty: 250,
      total: 250,
    });
  });

  it('are frozen for the whole drag: the others keep their widths and the table grows', () => {
    stubRoom(1000);
    render(<Orders columns={FLEXIBLE} />);
    press(handleOf('Customer'), 300);
    move(340);
    expect(cols().map((col) => col.style.width)).toEqual(['250px', '290px', '250px', '250px']);
    expect(grid().style.width).toBe('1040px');
    release(340);
  });

  it('stay as they are after the release: the table does not take the room of a neighbour', () => {
    stubRoom(1000);
    render(<Orders columns={FLEXIBLE} />);
    drag(handleOf('Customer'), -100);
    expect(cols().map((col) => col.style.width)).toEqual(['250px', '150px', '250px', '250px', '']);
    // Every column has a width now, so the frame is wider than they are and a filler takes the rest.
    expect(grid().querySelector('col:last-child')).not.toHaveStyle({ width: '1px' });
    expect(grid().style.width).toBe('900px');
    expect(grid().querySelectorAll('.flg-data-grid-filler').length).toBeGreaterThan(0);
  });

  it('are not written by a drag that ends at the width it began with', () => {
    stubRoom(1000);
    const onColumnLayoutChange = vi.fn();
    const handle = createRef<DataGridHandle>();
    render(
      <Orders handleRef={handle} columns={FLEXIBLE} onColumnLayoutChange={onColumnLayoutChange} />,
    );
    press(handleOf('Customer'), 300);
    move(340);
    move(300);
    runFrames();
    release(300);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    expect(handle.current!.getState().columnLayout.widths).toEqual({});
  });

  it('are not written by a drag that is cancelled', () => {
    stubRoom(1000);
    const onColumnLayoutChange = vi.fn();
    const handle = createRef<DataGridHandle>();
    render(
      <Orders handleRef={handle} columns={FLEXIBLE} onColumnLayoutChange={onColumnLayoutChange} />,
    );
    press(handleOf('Customer'), 300);
    move(340);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handle.current!.getState().columnLayout.widths).toEqual({});
    expect(cols().map((col) => col.style.width)).toEqual(['250px', '250px', '250px', '250px']);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('become flexible again only when the layout clears the widths', () => {
    stubRoom(1000);
    const { rerender } = render(<Orders columns={FLEXIBLE} />);
    drag(handleOf('Customer'), 50);
    expect(cols()[1]!.style.width).toBe('300px');
    rerender(
      <Orders
        columns={FLEXIBLE}
        columnLayout={{
          order: ['id', 'customer', 'qty', 'total'],
          widths: {},
          hidden: [],
          pinned: {},
        }}
      />,
    );
    expect(cols().map((col) => col.style.width)).toEqual(['250px', '250px', '250px', '250px']);
  });
});

describe('the keys', () => {
  const key = (name: string, init: KeyboardEventInit = {}) => {
    const target = document.activeElement as Element;
    return fireEvent.keyDown(target, { key: name, altKey: true, shiftKey: true, ...init });
  };
  const focusTitle = (name: string) => {
    act(() => title(name).focus());
  };

  it('Alt+Shift+Right and Left change the width of the column of the title by 10px', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    focusTitle('Customer');
    expect(key('ArrowRight')).toBe(false);
    expect(widthOf(1)).toBe('210px');
    key('ArrowRight');
    key('ArrowRight');
    expect(widthOf(1)).toBe('230px');
    key('ArrowLeft');
    expect(widthOf(1)).toBe('220px');
    // One change of the layout for each press, each the layout as shown.
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(4);
    expect(onColumnLayoutChange.mock.calls.map(([layout]) => layout.widths.customer)).toEqual([
      210, 220, 230, 220,
    ]);
  });

  it('calls onStateChange once for a press, and moves the title no further', () => {
    const onStateChange = vi.fn<(state: DataGridState, change: string) => void>();
    render(<Orders onStateChange={onStateChange} />);
    focusTitle('Customer');
    key('ArrowRight');
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange.mock.calls[0]![1]).toBe('columnLayout');
    expect(document.activeElement).toBe(title('Customer'));
  });

  it('holds the width to the minimum, and calls nothing where it does not change', () => {
    const onColumnLayoutChange = vi.fn();
    render(
      <Orders
        onColumnLayoutChange={onColumnLayoutChange}
        columns={COLUMNS.map((column) => ({ ...column, minWidth: 195 }))}
      />,
    );
    focusTitle('Customer');
    key('ArrowLeft');
    expect(widthOf(1)).toBe('195px');
    key('ArrowLeft');
    expect(widthOf(1)).toBe('195px');
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
  });

  it('never moves a width the other way from the key, for a column under its minimum or over 2000', () => {
    const onColumnLayoutChange = vi.fn();
    render(
      <Orders
        onColumnLayoutChange={onColumnLayoutChange}
        columns={[
          COLUMNS[0]!,
          { ...COLUMNS[1]!, width: 40 },
          COLUMNS[2]!,
          { ...COLUMNS[3]!, width: 2500 },
        ]}
      />,
    );
    // Its own width is allowed; the key that would take it further out leaves it as it is.
    focusTitle('Customer');
    key('ArrowLeft');
    expect(widthOf(1)).toBe('40px');
    focusTitle('Total');
    key('ArrowRight');
    expect(widthOf(3)).toBe('2500px');
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
    // The key towards the limits brings it to them.
    focusTitle('Customer');
    key('ArrowRight');
    expect(widthOf(1)).toBe('60px');
    focusTitle('Total');
    key('ArrowLeft');
    expect(widthOf(3)).toBe('2000px');
  });

  it('is cancelled where it changes nothing, so the browser does nothing with it either', () => {
    render(
      <Orders
        columns={COLUMNS.map((column) => ({ ...column, minWidth: 195, allowResizing: false }))}
      />,
    );
    focusTitle('Customer');
    expect(key('ArrowRight')).toBe(false);
    expect(key('ArrowLeft')).toBe(false);
    expect(widthOf(1)).toBe('200px');
  });

  it('writes the widths of the flexible columns first, as a drag does', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('flg-table-frame') ? 1000 : 0;
    });
    const onColumnLayoutChange = vi.fn();
    render(<Orders columns={FLEXIBLE} onColumnLayoutChange={onColumnLayoutChange} />);
    focusTitle('Qty');
    key('ArrowLeft');
    expect(onColumnLayoutChange.mock.calls[0]![0].widths).toEqual({
      id: 250,
      customer: 250,
      qty: 240,
      total: 250,
    });
  });

  it('does not take the keys of the other modifiers, nor a key without both', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    focusTitle('Customer');
    expect(key('ArrowRight', { ctrlKey: true })).toBe(true);
    expect(key('ArrowRight', { metaKey: true })).toBe(true);
    expect(key('ArrowRight', { shiftKey: false })).toBe(true);
    expect(key('ArrowRight', { altKey: false })).toBe(true);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('is of the title of a data column and of no cell of a row', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    const cell = grid().tBodies[0]!.rows[0]!.cells[1]!;
    act(() => cell.focus());
    expect(key('ArrowRight')).toBe(true);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('is not the key of the title of the column of boxes', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders selectionMode="multiple" onColumnLayoutChange={onColumnLayoutChange} />);
    act(() => titles()[0]!.querySelector('input')!.focus());
    expect(key('ArrowRight')).toBe(true);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('is not the key of a control inside the title (widget mode)', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    focusTitle('Customer');
    const button = title('Customer').querySelector('button')!;
    act(() => button.focus());
    expect(key('ArrowRight')).toBe(true);
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });

  it('says the new width once, 500 ms after the last press', () => {
    vi.useFakeTimers();
    render(<Orders />);
    focusTitle('Customer');
    const region = () => document.querySelector('[aria-live="polite"]')!;
    const wait = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
    key('ArrowRight');
    wait(300);
    key('ArrowRight');
    key('ArrowRight');
    wait(499);
    expect(region()).toHaveTextContent('');
    wait(1);
    expect(region()).toHaveTextContent('Customer, 230 pixels wide');
  });

  it('says nothing for a press that changes nothing, and nothing after the grid has gone', () => {
    vi.useFakeTimers();
    const { unmount } = render(<Orders />);
    focusTitle('Customer');
    key('ArrowRight');
    unmount();
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('says it in the words of labels.announceResized', () => {
    vi.useFakeTimers();
    render(<Orders labels={{ announceResized: (caption, px) => `${caption} => ${px}` }} />);
    focusTitle('Total');
    key('ArrowLeft');
    act(() => void vi.advanceTimersByTime(500));
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Total => 110');
  });
});

describe('the double press on a handle', () => {
  // jsdom has no layout: the stand-ins say what each title and each cell would need. A text needs 8px
  // for each letter, a cell 24px of padding, and a title 24px of padding, 20px for its sort arrow and
  // 20px for the button of its menu.
  beforeEach(() => {
    Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
      configurable: true,
      value(this: Range) {
        return { width: (this.startContainer.textContent ?? '').length * 8 };
      },
    });
    const sizes = (element: HTMLElement) => {
      if (element.classList.contains('flg-data-grid-head')) return { offset: 200, client: 200 };
      if (element.classList.contains('flg-data-grid-head-content'))
        return { offset: 176, client: 176 };
      if (element.classList.contains('flg-table-sort')) return { offset: 80, client: 80 };
      // The cluster with the button of the column menu: 20px, which a title keeps room for.
      if (element.classList.contains('flg-data-grid-head-icons')) return { offset: 20, client: 20 };
      if (element.classList.contains('flg-data-grid-head-title')) return { offset: 60, client: 60 };
      return { offset: 200, client: 176 };
    };
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return sizes(this).offset;
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('flg-table-frame') ? 1000 : sizes(this).client;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('flg-data-grid-head-title')
        ? (this.textContent ?? '').length * 8
        : 0;
    });
  });
  afterEach(() => {
    Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect');
  });

  it('fits the column to the widest of its title and its cells, once', () => {
    const onColumnLayoutChange = vi.fn();
    const long = [{ ...ORDERS[0]!, customer: 'Nguyễn Minh Hoàng' }];
    render(<Orders data={long} onColumnLayoutChange={onColumnLayoutChange} />);
    fireEvent.doubleClick(handleOf('Customer'));
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
    // "Nguyễn Minh Hoàng" is 17 letters: 136px of text, 24px beyond the cell's content (the stand-ins say
    // so) and the 2px of padding that jsdom's own stylesheet gives a cell. The title needs 128px.
    const widths = onColumnLayoutChange.mock.calls[0]![0].widths;
    expect(widths.customer).toBe(162);
    expect(widthOf(1)).toBe('162px');
  });

  it('counts the title too: it needs more than a short column of cells does', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    fireEvent.doubleClick(handleOf('Qty'));
    // The cells are "4", "1" and "12": 40px at most. The title is an 80px button, the 20px button of
    // its menu and 24px of padding.
    expect(onColumnLayoutChange.mock.calls[0]![0].widths.qty).toBe(124);
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
  });

  it('is held to the minimum width of the column and to 600', () => {
    const onColumnLayoutChange = vi.fn();
    const long = [{ ...ORDERS[0]!, customer: 'x'.repeat(200) }];
    render(<Orders data={long} onColumnLayoutChange={onColumnLayoutChange} />);
    fireEvent.doubleClick(handleOf('Customer'));
    expect(onColumnLayoutChange.mock.calls[0]![0].widths.customer).toBe(600);
  });

  it('fits a column with no row drawn to its title', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders data={[]} onColumnLayoutChange={onColumnLayoutChange} />);
    fireEvent.doubleClick(handleOf('Customer'));
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
    // The title: 24px of padding, the 80px button, the 20px button of the menu and the 4px of its text
    // that is cut.
    expect(onColumnLayoutChange.mock.calls[0]![0].widths.customer).toBe(128);
  });

  it('is not a sort, and does not start a drag', () => {
    const onSortChange = vi.fn();
    render(<Orders onSortChange={onSortChange} />);
    const handle = handleOf('Customer');
    press(handle, 300);
    release(300);
    press(handle, 300);
    release(300);
    fireEvent.doubleClick(handle);
    expect(onSortChange).not.toHaveBeenCalled();
    expect(html().getAttribute('data-flg-grid-cursor')).toBeNull();
  });

  it('measures what it needs without changing a width of the layout it does not set', () => {
    const handle = createRef<DataGridHandle>();
    render(<Orders handleRef={handle} />);
    fireEvent.doubleClick(handleOf('Customer'));
    expect(handle.current!.getState().columnLayout.widths).toEqual({ ...WIDTHS, customer: 128 });
  });

  it('writes the widths of the flexible columns, and keeps them', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders columns={FLEXIBLE} onColumnLayoutChange={onColumnLayoutChange} />);
    fireEvent.doubleClick(handleOf('Customer'));
    expect(onColumnLayoutChange.mock.calls[0]![0].widths).toEqual({
      id: 250,
      customer: 128,
      qty: 250,
      total: 250,
    });
  });
});
