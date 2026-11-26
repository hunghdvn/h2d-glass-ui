import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { createRef, useEffect, useState } from 'react';
import type { Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type {
  DataGridColumn,
  DataGridGroupItem,
  DataGridHandle,
  DataGridKey,
  DataGridProps,
  DataGridRowDrop,
} from './index';

// Moving rows (spec phase 6 §3.6, §3.8, §4.3 R1 "Kéo dòng", §6.3 "Kéo dòng"): the column of handles, what turns
// it off, the keys, the row menu, the drag and the drop, the sentence, and the way the focus and the page
// follow a row. What needs a layout engine or a real pointer to be true (the box of the line and of the chip,
// the cursor, a touch, the focus after a move in each engine) is proven in the stories
// (`DataGridGrouping.stories.tsx`).

// The animation frames the drag asks for (the coalesced moves, the auto-scroll), run by hand.
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
const runFrames = () => {
  const due = [...frames.values()];
  frames.clear();
  act(() => due.forEach((callback) => callback(0)));
};

// How many times a popover was shown, and which are showing: the menu shows and hides by these stand-ins.
let showing: Set<Element>;

const ROW_HEIGHT = 33;
const HEAD_HEIGHT = 32;
const DETAIL_HEIGHT = 100;
const FRAME_HEIGHT = 300;

beforeEach(() => {
  resetDevWarnings();
  frames = new Map();
  nextFrame = 1;
  showing = new Set();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(nextFrame, callback);
    return nextFrame++;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  // jsdom has no layout, so every element would count as hidden to the code that looks for the controls of
  // a cell, and no Popover API.
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
  // jsdom has no layout. The rows of the body are laid out here one under the other in the order the DOM
  // has them (a data row 33px, a detail row 100px, so a move shows), under a heading 32px tall, in a frame
  // 300px tall and 504px wide.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.matches('.flg-data-grid-frame, .flg-data-grid-main'))
      return box(0, 0, 504, FRAME_HEIGHT);
    if (this.matches('thead')) return box(0, 0, 504, HEAD_HEIGHT);
    if (this.matches('tbody > tr')) {
      let top = HEAD_HEIGHT;
      for (const row of Array.from((this.parentElement as HTMLElement).children)) {
        const height = row.classList.contains('flg-data-grid-detail-row')
          ? DETAIL_HEIGHT
          : ROW_HEIGHT;
        if (row === this) return box(0, top, 504, top + height);
        top += height;
      }
    }
    return box(0, 0, 0, 0);
  });
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.matches('.flg-data-grid-main') ? 504 : 0;
  });
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
  status: string;
  qty: number;
}

const ORDERS: Order[] = [
  { id: 'DH-1', status: 'Delivered', qty: 5 },
  { id: 'DH-2', status: 'Delivered', qty: 3 },
  { id: 'DH-3', status: 'Processing', qty: 2 },
  { id: 'DH-4', status: 'Processing', qty: 4 },
  { id: 'DH-5', status: 'New', qty: 1 },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 120 },
  { field: 'status', caption: 'Status', width: 120 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
];

const BY_STATUS: DataGridGroupItem[] = [{ field: 'status', direction: 'asc' }];

function Orders({
  gridRef,
  ...props
}: Partial<DataGridProps<Order>> & { gridRef?: Ref<DataGridHandle> }) {
  return (
    <DataGrid
      ref={gridRef}
      data={ORDERS}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      rowReorder
      onRowReorder={() => {}}
      {...props}
    />
  );
}

/**
 * A grid whose parent does what the callback asks: it moves the row in its own `data`. `keep: false`
 * is a parent that never changes it.
 */
function Moving({
  onMove,
  keep = true,
  start = ORDERS,
  gridRef,
  ...props
}: Partial<DataGridProps<Order>> & {
  onMove?: (from: DataGridKey, to: DataGridKey, position: DataGridRowDrop) => void;
  keep?: boolean;
  start?: Order[];
  gridRef?: Ref<DataGridHandle>;
}) {
  const [data, setData] = useState(start);
  return (
    <Orders
      gridRef={gridRef}
      data={data}
      onRowReorder={(from, to, position) => {
        onMove?.(from, to, position);
        if (!keep) return;
        setData((rows) => {
          const moved = rows.find((row) => row.id === from)!;
          const others = rows.filter((row) => row.id !== from);
          const at = others.findIndex((row) => row.id === to) + (position === 'after' ? 1 : 0);
          return [...others.slice(0, at), moved, ...others.slice(at)];
        });
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
const dataRows = () =>
  Array.from(grid().querySelectorAll<HTMLTableRowElement>('tbody > tr.flg-data-grid-row'));
const ids = () => dataRows().map((row) => row.cells[1]!.textContent);
const handle = (name: string) => screen.getByRole('button', { name: `Reorder ${name}` });
const handles = () => screen.getAllByRole('button', { name: /^Reorder DH-/ });
const stops = () => Array.from(grid().querySelectorAll<HTMLElement>('[tabindex="0"]'));
const menu = () => document.querySelector<HTMLElement>('.flg-data-grid-row-menu');
const items = () => Array.from(menu()?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
const item = (name: string) => items().find((candidate) => candidate.textContent === name)!;
const isOff = (element: HTMLElement) => element.getAttribute('aria-disabled') === 'true';
const region = () => document.querySelector('[aria-live="polite"]')!;
const chip = () => document.querySelector<HTMLElement>('.flg-data-grid-drag-chip');
const line = () => document.querySelector<HTMLElement>('.flg-data-grid-drop-line');
const html = () => document.documentElement;
// The live region says it a tick after: the timers are the test's, and the frames stay the stub's.
const fakeTimers = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
const tick = () => act(() => void vi.advanceTimersByTime(0));
const focusOn = (element: HTMLElement) => act(() => element.focus());

const keyDown = (element: HTMLElement, key: string, init: KeyboardEventInit = {}): boolean => {
  const event = createEvent.keyDown(element, { key, bubbles: true, cancelable: true, ...init });
  act(() => {
    fireEvent(element, event);
  });
  return event.defaultPrevented;
};
const modShift = { ctrlKey: true, shiftKey: true };

// The keys of the platform: ⌘ on Apple and Ctrl elsewhere.
const apple = () => vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
const windows = () => vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');

const POINTER = { pointerId: 1, isPrimary: true, pointerType: 'mouse', button: 0 };
const press = (element: Element, y: number, init: PointerEventInit = {}) =>
  fireEvent.pointerDown(element, { ...POINTER, buttons: 1, clientX: 10, clientY: y, ...init });
const move = (y: number, init: PointerEventInit = {}) =>
  fireEvent.pointerMove(document, { ...POINTER, buttons: 1, clientX: 10, clientY: y, ...init });
const release = (y: number, init: PointerEventInit = {}) =>
  fireEvent.pointerUp(document, { ...POINTER, buttons: 0, clientX: 10, clientY: y, ...init });

/** The y of the row `at` (from 0) among rows that are all closed: its top, its middle and its bottom. */
const top = (at: number) => HEAD_HEIGHT + at * ROW_HEIGHT;
const middle = (at: number) => top(at) + ROW_HEIGHT / 2;

/** A drag of the handle of `name` to the pointer at `y`, released there. */
function drag(name: string, y: number) {
  press(handle(name), middle(0));
  move(y);
  runFrames();
  release(y);
}

/** A press and a click on a button, as a mouse makes them. */
function click(button: HTMLElement) {
  fireEvent.pointerDown(button, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 });
  fireEvent.mouseDown(button);
  fireEvent.pointerUp(button, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 });
  fireEvent.click(button, { detail: 1 });
}

describe('the column of handles', () => {
  it('has no column and no handle without rowReorder, or with a value that is not true', () => {
    const { rerender } = render(<Orders rowReorder={false} />);
    expect(screen.queryByRole('button', { name: /^Reorder / })).toBeNull();
    expect(grid().querySelectorAll('[data-service="drag"]')).toHaveLength(0);
    rerender(<Orders rowReorder={'yes' as never} />);
    expect(screen.queryByRole('button', { name: /^Reorder / })).toBeNull();
  });

  it('adds a column of 28px with one handle for each row, named after the row header', () => {
    render(<Orders />);
    expect(grid().querySelectorAll('col')[0]).toHaveStyle({ width: '28px' });
    expect(handles().map((button) => button.getAttribute('aria-label'))).toEqual(
      ORDERS.map((order) => `Reorder ${order.id}`),
    );
    for (const button of handles()) {
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).not.toHaveAttribute('aria-disabled');
      expect(button.closest('td')).toHaveAttribute('data-service', 'drag');
    }
    // The title has the words, hidden, and no control: it is a place of the keyboard.
    const head = titles()[0]!;
    expect(head).toHaveTextContent('Reorder');
    expect(head.querySelector('button')).toBeNull();
  });

  it('comes after the column of boxes and before the data, and is one place of the keyboard', () => {
    render(<Orders selectionMode="multiple" />);
    const cells = Array.from(dataRows()[0]!.cells);
    expect(cells[0]).toHaveAttribute('data-service', 'select');
    expect(cells[1]).toHaveAttribute('data-service', 'drag');
    expect(cells[2]).toHaveTextContent('DH-1');
    // One Tab stop in all, and it is not the handle of a row until the keyboard is there.
    expect(stops()).toHaveLength(1);
  });

  it('names a handle after the key when the row has no header text', () => {
    render(<Orders columns={COLUMNS.map((column) => ({ ...column, rowHeader: false }))} />);
    expect(handle('DH-3')).toBeInTheDocument();
  });

  it('warns once, after the commit, when there is no onRowReorder, and a move calls nothing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<Orders onRowReorder={undefined} />);
    rerender(<Orders onRowReorder={undefined} />);
    expect(
      warn.mock.calls.filter(([message]) => String(message).includes('rowReorder has no')),
    ).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('rowReorder has no onRowReorder'));
    // The handles are drawn, enabled, and a key says and calls nothing.
    expect(isOff(handle('DH-2'))).toBe(false);
    const cell = dataRows()[1]!.cells[2]!;
    focusOn(cell);
    expect(keyDown(cell, 'ArrowUp', modShift)).toBe(true);
    expect(region()).toHaveTextContent('');
    expect(ids()).toEqual(ORDERS.map((order) => order.id));
  });
});

describe('a grid that sorts or groups', () => {
  it('turns the handles off while it sorts, and on again when the sort goes', () => {
    const { rerender } = render(<Orders defaultSort={[{ field: 'qty', direction: 'asc' }]} />);
    for (const button of handles()) expect(isOff(button)).toBe(true);
    rerender(<Orders sort={[]} />);
    for (const button of handles()) expect(isOff(button)).toBe(false);
  });

  it('keeps the focus on the very handle when a sort, or a grouping, starts and ends', () => {
    const { rerender } = render(<Orders sort={[]} grouping={[]} />);
    const first = handle('DH-1');
    focusOn(first);
    expect(document.activeElement).toBe(first);
    rerender(<Orders sort={[{ field: 'qty', direction: 'asc' }]} grouping={[]} />);
    expect(isOff(first)).toBe(true);
    expect(handle('DH-1')).toBe(first);
    expect(document.activeElement).toBe(first);
    rerender(<Orders sort={[]} grouping={[]} />);
    expect(isOff(first)).toBe(false);
    expect(handle('DH-1')).toBe(first);
    expect(document.activeElement).toBe(first);
  });

  it('turns the handles off while it groups', () => {
    render(<Orders defaultGrouping={BY_STATUS} />);
    expect(handles()).toHaveLength(5);
    for (const button of handles()) expect(isOff(button)).toBe(true);
  });

  it('keeps the handles on for a filter, which moves rows among the ones it keeps', () => {
    const onMove = vi.fn();
    render(
      <Moving
        onMove={onMove}
        defaultFilter={{ columns: { status: { operator: '=', value: 'Processing' } } }}
      />,
    );
    expect(handles()).toHaveLength(2);
    for (const button of handles()) expect(isOff(button)).toBe(false);
    // DH-3 is the first of the two: it cannot go up, and DH-4 goes up before it, not before DH-2.
    const first = dataRows()[0]!.cells[2]!;
    focusOn(first);
    expect(keyDown(first, 'ArrowUp', modShift)).toBe(true);
    expect(onMove).not.toHaveBeenCalled();
    const second = dataRows()[1]!.cells[2]!;
    focusOn(second);
    keyDown(second, 'ArrowUp', modShift);
    expect(onMove).toHaveBeenCalledWith('DH-4', 'DH-3', 'before');
  });

  it('shows why in a tooltip on focus, and stays focusable', () => {
    vi.useFakeTimers();
    render(<Orders defaultSort={[{ field: 'qty', direction: 'asc' }]} />);
    const button = handle('DH-2');
    expect(button).not.toHaveAttribute('disabled');
    fireEvent.keyDown(document, { key: 'Tab' });
    vi.spyOn(button, 'matches').mockImplementation((selector) => selector === ':focus-visible');
    fireEvent.focus(button);
    act(() => void vi.advanceTimersByTime(600));
    // The text is always in the DOM, for the description (a handle's own, for each row); it is open when
    // the browser shows it, and only the focused handle's is.
    const tips = screen.getAllByRole('tooltip', { hidden: true });
    expect(tips).toHaveLength(5);
    const tip = document.getElementById(button.getAttribute('aria-describedby')!)!;
    expect(tips.filter((one) => showing.has(one))).toEqual([tip]);
    expect(tip).toHaveTextContent('Clear sorting and grouping to reorder rows');
    expect(button).toHaveAccessibleDescription('Clear sorting and grouping to reorder rows');
  });

  it('does not open the menu, and starts no drag, from a handle that is off', () => {
    const onMove = vi.fn();
    render(<Moving onMove={onMove} defaultSort={[{ field: 'qty', direction: 'asc' }]} />);
    click(handle('DH-2'));
    expect(menu()?.matches(':popover-open') ?? false).toBe(false);
    expect(handle('DH-2')).toHaveAttribute('aria-expanded', 'false');
    press(handle('DH-2'), middle(1));
    move(middle(4));
    runFrames();
    expect(chip()).toBeNull();
    release(middle(4));
    expect(onMove).not.toHaveBeenCalled();
  });
});

describe('the keys on a cell of a row', () => {
  it.each([
    [
      'Windows and Linux',
      windows,
      { ctrlKey: true, shiftKey: true },
      { metaKey: true, shiftKey: true },
    ],
    ['Apple', apple, { metaKey: true, shiftKey: true }, { ctrlKey: true, shiftKey: true }],
  ])(
    'move the row up and down one place, with the arguments of the move, on %s',
    (_name, platform, mod, other) => {
      platform();
      const onMove = vi.fn();
      render(<Orders onRowReorder={onMove} />);
      const cell = dataRows()[2]!.cells[2]!;
      focusOn(cell);
      expect(keyDown(cell, 'ArrowUp', mod)).toBe(true);
      expect(onMove).toHaveBeenLastCalledWith('DH-3', 'DH-2', 'before');
      expect(keyDown(cell, 'ArrowDown', mod)).toBe(true);
      expect(onMove).toHaveBeenLastCalledWith('DH-3', 'DH-4', 'after');
      expect(onMove).toHaveBeenCalledTimes(2);
      // The modifier of the other platform is no modifier here.
      expect(keyDown(cell, 'ArrowUp', other)).toBe(false);
      expect(onMove).toHaveBeenCalledTimes(2);
    },
  );

  it('are cancelled at an edge and call nothing', () => {
    const onMove = vi.fn();
    render(<Orders onRowReorder={onMove} />);
    const first = dataRows()[0]!.cells[1]!;
    focusOn(first);
    expect(keyDown(first, 'ArrowUp', modShift)).toBe(true);
    const last = dataRows()[4]!.cells[1]!;
    focusOn(last);
    expect(keyDown(last, 'ArrowDown', modShift)).toBe(true);
    expect(onMove).not.toHaveBeenCalled();
    expect(region()).toHaveTextContent('');
  });

  it('are the keys of the handle too', () => {
    const onMove = vi.fn();
    render(<Orders onRowReorder={onMove} />);
    const button = handle('DH-2');
    focusOn(button);
    expect(keyDown(button, 'ArrowDown', modShift)).toBe(true);
    expect(onMove).toHaveBeenCalledWith('DH-2', 'DH-3', 'after');
  });

  it('are not taken without the modifier, with Alt, or on a title', () => {
    const onMove = vi.fn();
    render(<Orders onRowReorder={onMove} />);
    const cell = dataRows()[2]!.cells[2]!;
    focusOn(cell);
    expect(keyDown(cell, 'ArrowUp', { shiftKey: true })).toBe(false);
    expect(keyDown(cell, 'ArrowUp', { ctrlKey: true, shiftKey: true, altKey: true })).toBe(false);
    const title = titles()[2]!;
    focusOn(title);
    keyDown(title, 'ArrowDown', modShift);
    expect(onMove).not.toHaveBeenCalled();
  });

  it("are not the grid's when it does not reorder rows", () => {
    render(<Orders rowReorder={false} />);
    const cell = dataRows()[2]!.cells[1]!;
    focusOn(cell);
    expect(keyDown(cell, 'ArrowUp', modShift)).toBe(false);
  });

  it('are cancelled while the grid sorts, call nothing and say why once for a press', () => {
    fakeTimers();
    const onMove = vi.fn();
    render(<Orders onRowReorder={onMove} defaultSort={[{ field: 'qty', direction: 'asc' }]} />);
    const cell = dataRows()[2]!.cells[1]!;
    focusOn(cell);
    expect(keyDown(cell, 'ArrowUp', modShift)).toBe(true);
    tick();
    expect(region()).toHaveTextContent('Clear sorting and grouping to reorder rows');
    expect(keyDown(cell, 'ArrowUp', { ...modShift, repeat: true })).toBe(true);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('say where the row went, among the rows after the filter, before the app answers', () => {
    fakeTimers();
    render(<Moving keep={false} />);
    const cell = dataRows()[3]!.cells[1]!;
    focusOn(cell);
    keyDown(cell, 'ArrowUp', modShift);
    tick();
    expect(region()).toHaveTextContent('DH-4 moved to row 3 of 5');
  });
});

describe('the row menu', () => {
  it('opens under the handle by a press, by Enter and by Space, with the four items', () => {
    render(<Orders />);
    click(handle('DH-3'));
    expect(handle('DH-3')).toHaveAttribute('aria-expanded', 'true');
    expect(menu()).toHaveAttribute('aria-label', 'Reorder DH-3');
    expect(items().map((entry) => entry.textContent)).toEqual([
      'Move up',
      'Move down',
      'Move to top',
      'Move to bottom',
    ]);
    act(() => item('Move up').click());
    expect(handle('DH-3')).toHaveAttribute('aria-expanded', 'false');

    focusOn(handle('DH-2'));
    expect(keyDown(handle('DH-2'), 'Enter')).toBe(true);
    expect(handle('DH-2')).toHaveAttribute('aria-expanded', 'true');
    act(() => item('Move down').click());

    // Space is the button's: the browser clicks it at the key up, so the key down is left alone, and the
    // grid chooses nothing.
    expect(keyDown(handle('DH-4'), ' ')).toBe(false);
    expect(handle('DH-4')).toHaveAttribute('aria-expanded', 'false');
    act(() => handle('DH-4').click());
    expect(handle('DH-4')).toHaveAttribute('aria-expanded', 'true');
  });

  it('turns the items that would not move the row off, at the edges', () => {
    render(<Orders />);
    click(handle('DH-1'));
    expect(items().map((entry) => isOff(entry) || entry.hasAttribute('data-disabled'))).toEqual([
      true,
      false,
      true,
      false,
    ]);
    act(() => item('Move down').click());
    click(handle('DH-5'));
    expect(items().map((entry) => isOff(entry) || entry.hasAttribute('data-disabled'))).toEqual([
      false,
      true,
      false,
      true,
    ]);
  });

  it('makes each move with its arguments, and closes', () => {
    const onMove = vi.fn();
    render(<Orders onRowReorder={onMove} />);
    const choose = (row: string, name: string) => {
      click(handle(row));
      act(() => item(name).click());
    };
    choose('DH-3', 'Move up');
    expect(onMove).toHaveBeenLastCalledWith('DH-3', 'DH-2', 'before');
    choose('DH-3', 'Move down');
    expect(onMove).toHaveBeenLastCalledWith('DH-3', 'DH-4', 'after');
    choose('DH-3', 'Move to top');
    expect(onMove).toHaveBeenLastCalledWith('DH-3', 'DH-1', 'before');
    choose('DH-3', 'Move to bottom');
    expect(onMove).toHaveBeenLastCalledWith('DH-3', 'DH-5', 'after');
    expect(onMove).toHaveBeenCalledTimes(4);
  });

  it('says the move once it is made', () => {
    fakeTimers();
    render(<Moving keep={false} />);
    click(handle('DH-2'));
    act(() => item('Move to bottom').click());
    tick();
    expect(region()).toHaveTextContent('DH-2 moved to row 5 of 5');
  });

  it('gives the focus back to the handle of the row, which the active place follows', () => {
    fakeTimers();
    render(<Moving />);
    focusOn(handle('DH-2'));
    keyDown(handle('DH-2'), 'Enter');
    act(() => item('Move to bottom').click());
    act(() => void vi.advanceTimersByTime(50));
    expect(ids()).toEqual(['DH-1', 'DH-3', 'DH-4', 'DH-5', 'DH-2']);
    expect(document.activeElement).toBe(handle('DH-2'));
    expect(stops()).toEqual([handle('DH-2')]);
  });

  it('closes when rowReorder turns off, when the grid starts to sort, and when its row goes', () => {
    const { rerender } = render(<Orders />);
    click(handle('DH-2'));
    expect(handle('DH-2')).toHaveAttribute('aria-expanded', 'true');
    rerender(<Orders sort={[{ field: 'qty', direction: 'asc' }]} />);
    expect(handle('DH-2')).toHaveAttribute('aria-expanded', 'false');
    expect(menu()?.matches(':popover-open')).toBe(false);

    rerender(<Orders sort={[]} />);
    click(handle('DH-2'));
    expect(menu()?.matches(':popover-open')).toBe(true);
    rerender(<Orders sort={[]} data={ORDERS.filter((order) => order.id !== 'DH-2')} />);
    expect(menu()?.matches(':popover-open')).toBe(false);
    expect(screen.queryByRole('button', { name: 'Reorder DH-2' })).toBeNull();

    rerender(<Orders sort={[]} rowReorder={false} />);
    expect(menu()).toBeNull();
  });
});

describe('dragging a handle', () => {
  it('drops before the row whose upper half the pointer is in, and after the one whose lower half', () => {
    const onMove = vi.fn();
    render(<Orders onRowReorder={onMove} />);
    // DH-1 dragged to the upper half of the fourth row (index 3), then to the lower half of the fifth.
    drag('DH-1', top(3) + 5);
    expect(onMove).toHaveBeenLastCalledWith('DH-1', 'DH-4', 'before');
    drag('DH-1', top(4) + ROW_HEIGHT - 5);
    expect(onMove).toHaveBeenLastCalledWith('DH-1', 'DH-5', 'after');
    expect(onMove).toHaveBeenCalledTimes(2);
  });

  it('moves a row up, and calls onRowReorder once for the drop and onStateChange for nothing', () => {
    const onMove = vi.fn();
    const onStateChange = vi.fn();
    render(<Orders onRowReorder={onMove} onStateChange={onStateChange} />);
    press(handle('DH-4'), middle(3));
    move(top(1) + 5);
    runFrames();
    release(top(1) + 5);
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith('DH-4', 'DH-2', 'before');
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it('draws no line and drops nowhere beside the row itself, or outside the rows', () => {
    const onMove = vi.fn();
    render(<Orders onRowReorder={onMove} />);
    press(handle('DH-3'), middle(2));
    move(top(2) + 3);
    runFrames();
    // Its own upper half, its own lower half, the lower half of the row above and the upper half of the
    // row below are all its own place.
    expect(line()).toBeNull();
    move(top(2) + ROW_HEIGHT - 3);
    runFrames();
    expect(line()).toBeNull();
    move(top(1) + ROW_HEIGHT - 3);
    runFrames();
    expect(line()).toBeNull();
    move(top(3) + 3);
    runFrames();
    expect(line()).toBeNull();
    // Over the heading, and below the last row.
    move(HEAD_HEIGHT - 5);
    runFrames();
    expect(line()).toBeNull();
    move(top(5) + 20);
    runFrames();
    expect(line()).toBeNull();
    release(top(5) + 20);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('draws the line at the boundary the drop goes to, 3px, and the chip with the name of the row', () => {
    render(<Orders />);
    press(handle('DH-1'), middle(0));
    move(top(3) + 5);
    runFrames();
    expect(chip()).toHaveTextContent('DH-1');
    const drawn = line()!;
    expect(drawn).toHaveAttribute('data-axis', 'y');
    // The boundary before the fourth row, and the line's middle on it.
    expect(drawn.style.top).toBe(`${top(3) - 1.5}px`);
    expect(drawn.style.left).toBe('0px');
    expect(drawn.style.width).toBe('504px');
    move(top(3) + ROW_HEIGHT - 5);
    runFrames();
    expect(line()!.style.top).toBe(`${top(4) - 1.5}px`);
    release(top(3) + ROW_HEIGHT - 5);
  });

  it('dims the source row and no other, and the cursor mark is set while the drag is in flight', () => {
    render(<Orders />);
    expect(grid().querySelectorAll('[data-drag-source]')).toHaveLength(0);
    press(handle('DH-2'), middle(1));
    move(top(3) + 5);
    runFrames();
    expect(dataRows().filter((row) => row.hasAttribute('data-drag-source'))).toEqual([
      dataRows()[1],
    ]);
    expect(html()).toHaveAttribute('data-flg-grid-cursor', 'grabbing');
    release(top(3) + 5);
    expect(grid().querySelectorAll('[data-drag-source]')).toHaveLength(0);
  });

  it('takes off everything it set, for a drop, Escape, pointercancel and the grid going', () => {
    const onMove = vi.fn();
    const { unmount, container } = render(<Orders onRowReorder={onMove} />);
    const settled = () => {
      expect(chip()).toBeNull();
      expect(line()).toBeNull();
      expect(container.querySelectorAll('[data-drag-source]')).toHaveLength(0);
      expect(html()).not.toHaveAttribute('data-flg-grid-cursor');
      expect(frames.size).toBe(0);
    };
    const start = () => {
      press(handle('DH-1'), middle(0));
      move(top(3) + 5);
      runFrames();
      expect(line()).not.toBeNull();
    };
    start();
    release(top(3) + 5);
    settled();
    expect(onMove).toHaveBeenCalledTimes(1);

    start();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    settled();
    release(top(3) + 5);
    expect(onMove).toHaveBeenCalledTimes(1);

    start();
    fireEvent.pointerCancel(document, { ...POINTER });
    settled();
    expect(onMove).toHaveBeenCalledTimes(1);

    start();
    unmount();
    settled();
    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it('ends, and tells nobody, when the grid starts to sort in the middle of it', () => {
    const onMove = vi.fn();
    const { rerender } = render(<Orders onRowReorder={onMove} />);
    press(handle('DH-1'), middle(0));
    move(top(3) + 5);
    runFrames();
    rerender(<Orders onRowReorder={onMove} sort={[{ field: 'qty', direction: 'asc' }]} />);
    expect(chip()).toBeNull();
    expect(line()).toBeNull();
    expect(html()).not.toHaveAttribute('data-flg-grid-cursor');
    release(top(3) + 5);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('cancels the mousedown of the press and focuses the handle, never the pointerdown', () => {
    render(<Orders />);
    const button = handle('DH-2');
    const pointer = createEvent.pointerDown(button, { ...POINTER, buttons: 1 });
    fireEvent(button, pointer);
    expect(pointer.defaultPrevented).toBe(false);
    const mouse = createEvent.mouseDown(button, { button: 0 });
    fireEvent(button, mouse);
    expect(mouse.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(button);
  });

  it('is a drag of a touch pointer as it is of a mouse', () => {
    const onMove = vi.fn();
    render(<Orders onRowReorder={onMove} />);
    press(handle('DH-1'), middle(0), { pointerType: 'touch' });
    move(top(3) + 5, { pointerType: 'touch' });
    runFrames();
    release(top(3) + 5, { pointerType: 'touch' });
    expect(onMove).toHaveBeenCalledWith('DH-1', 'DH-4', 'before');
  });

  it('puts the line under the detail of a row that is open, for a drop after it', () => {
    const onMove = vi.fn();
    render(
      <Orders
        onRowReorder={onMove}
        renderDetail={(row) => <span>{row.id}</span>}
        defaultExpandedRows={['DH-2']}
      />,
    );
    press(handle('DH-1'), middle(0));
    // DH-2 is at 65..98 and its detail 98..198: the lower half of DH-2 is the boundary after the detail.
    move(top(1) + ROW_HEIGHT - 3);
    runFrames();
    expect(line()!.style.top).toBe(`${top(1) + ROW_HEIGHT + DETAIL_HEIGHT - 1.5}px`);
    release(top(1) + ROW_HEIGHT - 3);
    expect(onMove).toHaveBeenCalledWith('DH-1', 'DH-2', 'after');
  });

  it('says where the row went, and not for a drop that moves nothing', () => {
    fakeTimers();
    render(<Moving keep={false} />);
    press(handle('DH-1'), middle(0));
    move(top(3) + ROW_HEIGHT - 5);
    runFrames();
    release(top(3) + ROW_HEIGHT - 5);
    tick();
    expect(region()).toHaveTextContent('DH-1 moved to row 4 of 5');
  });
});

describe('the row that moves', () => {
  it('keeps the focus on its handle, which follows its key to the new place', () => {
    render(<Moving />);
    const cell = dataRows()[2]!.cells[2]!;
    focusOn(cell);
    keyDown(cell, 'ArrowUp', modShift);
    expect(ids()).toEqual(['DH-1', 'DH-3', 'DH-2', 'DH-4', 'DH-5']);
    expect(document.activeElement).toBe(dataRows()[1]!.cells[2]);
    keyDown(document.activeElement as HTMLElement, 'ArrowUp', modShift);
    expect(ids()).toEqual(['DH-3', 'DH-1', 'DH-2', 'DH-4', 'DH-5']);
    expect(document.activeElement).toBe(dataRows()[0]!.cells[2]);
  });

  it('goes to the page the row is on once the app has moved it, and then stays', () => {
    const ref = createRef<DataGridHandle>();
    const { rerender } = render(
      <Moving gridRef={ref} paging={{ pageSize: 2 }} defaultPage={{ index: 1, size: 2 }} />,
    );
    expect(ids()).toEqual(['DH-3', 'DH-4']);
    const cell = dataRows()[0]!.cells[2]!;
    focusOn(cell);
    // DH-3 goes above DH-2, which is on the first page: the move is counted over every page.
    keyDown(cell, 'ArrowUp', modShift);
    expect(ref.current!.getState().page.index).toBe(0);
    expect(ids()).toEqual(['DH-1', 'DH-3']);
    expect(document.activeElement).toBe(dataRows()[1]!.cells[2]);
    rerender(<Moving gridRef={ref} paging={{ pageSize: 2 }} defaultPage={{ index: 1, size: 2 }} />);
    expect(ref.current!.getState().page.index).toBe(0);
  });

  it('goes to the page once only: a later change of data does not take the grid back', () => {
    const ref = createRef<DataGridHandle>();
    const onPageChange = vi.fn();
    function Pages() {
      const [data, setData] = useState(ORDERS);
      return (
        <Orders
          gridRef={ref}
          data={data}
          paging={{ pageSize: 2 }}
          defaultPage={{ index: 1, size: 2 }}
          onPageChange={onPageChange}
          onRowReorder={(from, to) => {
            if (from === 'DH-3' && to === 'DH-2') {
              setData([ORDERS[0]!, ORDERS[2]!, ORDERS[1]!, ORDERS[3]!, ORDERS[4]!]);
            }
          }}
        />
      );
    }
    const { rerender } = render(<Pages />);
    const cell = dataRows()[0]!.cells[2]!;
    focusOn(cell);
    keyDown(cell, 'ArrowUp', modShift);
    expect(onPageChange).toHaveBeenCalledTimes(1);
    // The user goes to the second page, and the app loads other rows: the request has ended.
    act(() => screen.getByRole('button', { name: 'Next page' }).click());
    expect(ref.current!.getState().page.index).toBe(1);
    rerender(<Pages />);
    expect(onPageChange).toHaveBeenCalledTimes(2);
  });

  it('does not go to a page for a data that is not the order that was asked for', () => {
    const ref = createRef<DataGridHandle>();
    function Elsewhere({ data }: { data: Order[] }) {
      return (
        <Orders
          gridRef={ref}
          data={data}
          paging={{ pageSize: 2 }}
          defaultPage={{ index: 1, size: 2 }}
        />
      );
    }
    const { rerender } = render(<Elsewhere data={ORDERS} />);
    const cell = dataRows()[0]!.cells[2]!;
    focusOn(cell);
    keyDown(cell, 'ArrowUp', modShift);
    // The app ignores the move, and later shows rows of its own order: DH-3 is not before DH-2 in them.
    rerender(<Elsewhere data={[...ORDERS].reverse()} />);
    expect(ref.current!.getState().page.index).toBe(1);
  });

  it('shows the page of a controlled page that the parent applies a commit late, without the follow step', () => {
    const ref = createRef<DataGridHandle>();
    type Page = Parameters<NonNullable<DataGridProps<Order>['onPageChange']>>[0];
    const onPageChange = vi.fn();
    function Late() {
      const [data, setData] = useState(ORDERS);
      const [page, setPage] = useState<Page>({ index: 1, size: 2 });
      const [asked, setAsked] = useState<Page | null>(null);
      // The parent answers a request for a page in an effect: one commit after it was asked.
      useEffect(() => {
        if (asked) setPage(asked);
      }, [asked]);
      return (
        <Orders
          gridRef={ref}
          data={data}
          paging={{ pageSize: 2 }}
          page={page}
          onPageChange={(next) => {
            onPageChange(next);
            setAsked(next);
          }}
          onRowReorder={(from, to) => {
            if (from === 'DH-3' && to === 'DH-2') {
              setData([ORDERS[0]!, ORDERS[2]!, ORDERS[1]!, ORDERS[3]!, ORDERS[4]!]);
            }
          }}
        />
      );
    }
    render(<Late />);
    expect(ids()).toEqual(['DH-3', 'DH-4']);
    const cell = dataRows()[0]!.cells[2]!;
    focusOn(cell);
    keyDown(cell, 'ArrowUp', modShift);
    // The page is asked for once and the parent answers it, so the row is on its page. The next commit
    // was one where it was not shown yet, which ended the request (DataGrid.mdx, "The focus follows the row"):
    // the place is not given back to it, and the grid still has its one Tab stop, in the grid.
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith({ index: 0, size: 2 });
    expect(ref.current!.getState().page.index).toBe(0);
    expect(ids()).toEqual(['DH-1', 'DH-3']);
    expect(stops()).toHaveLength(1);
    expect(grid().contains(document.activeElement)).toBe(true);
    expect(stops()).not.toEqual([dataRows()[1]!.cells[2]]);
  });

  it('is not followed to its page for a drop, which has the pointer on the row already', () => {
    const ref = createRef<DataGridHandle>();
    render(<Moving gridRef={ref} paging={{ pageSize: 3 }} />);
    press(handle('DH-1'), middle(0));
    move(top(2) + ROW_HEIGHT - 5);
    runFrames();
    release(top(2) + ROW_HEIGHT - 5);
    expect(ids()).toEqual(['DH-2', 'DH-3', 'DH-1']);
    expect(ref.current!.getState().page.index).toBe(0);
  });
});

describe('a drop with no handler', () => {
  it('calls nothing, throws nothing and says nothing when there is no onRowReorder', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Orders onRowReorder={undefined} />);
    drag('DH-1', top(2) + ROW_HEIGHT - 5);
    expect(ids()).toEqual(ORDERS.map((order) => order.id));
    expect(region()).toHaveTextContent('');
    expect(line()).toBeNull();
    expect(chip()).toBeNull();
    expect(html()).not.toHaveAttribute('data-flg-grid-cursor');
  });
});

describe('server mode', () => {
  it("moves rows within the page: the edges are the page's", () => {
    const onMove = vi.fn();
    render(
      <Orders
        remote
        totalCount={50}
        data={ORDERS.slice(0, 3)}
        paging={{ pageSize: 3 }}
        onRowReorder={onMove}
      />,
    );
    const first = dataRows()[0]!.cells[2]!;
    focusOn(first);
    expect(keyDown(first, 'ArrowUp', modShift)).toBe(true);
    expect(onMove).not.toHaveBeenCalled();
    const last = dataRows()[2]!.cells[2]!;
    focusOn(last);
    keyDown(last, 'ArrowUp', modShift);
    expect(onMove).toHaveBeenCalledWith('DH-3', 'DH-2', 'before');
  });
});
