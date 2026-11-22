import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type {
  DataGridColumn,
  DataGridGroupItem,
  DataGridProps,
  DataGridState,
  DataGridToolbarItems,
} from './index';

// The group panel (spec phase 6 §3.6, §3.8, §4.3 R1, §6.3 "Nhóm"): the tray and its chips, the keys that
// move a level, the item of the column menu, the drag of a title into the tray and of a chip in it and
// out of it, and what each of them says. What needs a layout engine to be true (the boxes of the tray,
// the bar and the dimmed chip, a real mouse, a real touch, the focus in each engine) is proven in the
// stories (`DataGridGrouping.stories.tsx`).

// The animation frames the drags ask for (the coalesced moves), run by hand.
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
const runFrames = () => {
  const due = [...frames.values()];
  frames.clear();
  act(() => due.forEach((callback) => callback(0)));
};

const HEAD_HEIGHT = 32;
const TRAY = { left: 0, top: -44, right: 420, bottom: -10 };

beforeEach(() => {
  resetDevWarnings();
  frames = new Map();
  nextFrame = 1;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(nextFrame, callback);
    return nextFrame++;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  HTMLElement.prototype.checkVisibility = () => true;
  // jsdom has no layout. The titles are laid out from the widths of their captions, from x 0, the heading
  // 32px tall under a tray that is above the grid (y -44 to -10) with its chips 100px wide, 140px apart
  // from x 60: their middles are at 110, 250 and 390.
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
    if (this.matches('.flg-data-grid-group-chip')) {
      const at = Array.from(
        this.parentElement!.querySelectorAll('.flg-data-grid-group-chip'),
      ).indexOf(this);
      return box(60 + at * 140, -40, 160 + at * 140, -14);
    }
    if (this.matches('.flg-data-grid-group-panel')) {
      return box(TRAY.left, TRAY.top, TRAY.right, TRAY.bottom);
    }
    if (this.matches('thead, thead > tr')) return box(0, 0, 584, HEAD_HEIGHT);
    if (this.matches('.flg-data-grid-frame, .flg-data-grid-main')) return box(0, 0, 584, 200);
    return box(0, 0, 0, 0);
  });
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.matches('.flg-data-grid-main') ? 584 : 0;
  });
  for (const [name, value] of [
    ['clientWidth', 584],
    ['clientHeight', 200],
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
  status: string;
  team: string;
  channel: string;
  qty: number;
}

const ORDERS: Order[] = [
  { id: 'DH-1', customer: 'An', status: 'New', team: 'A', channel: 'Web', qty: 4 },
  { id: 'DH-2', customer: 'Bình', status: 'Done', team: 'B', channel: 'Store', qty: 1 },
  { id: 'DH-3', customer: 'Chi', status: 'New', team: 'B', channel: 'Web', qty: 12 },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104, allowGrouping: false },
  { field: 'customer', caption: 'Customer', width: 100 },
  { field: 'status', caption: 'Status', width: 100 },
  { field: 'team', caption: 'Team', width: 100 },
  { field: 'channel', caption: 'Channel', width: 100 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
];
const WIDTH_OF: Record<string, number> = {
  Order: 104,
  Customer: 100,
  Status: 100,
  Team: 100,
  Channel: 100,
  Qty: 80,
};

const asc = (field: string): DataGridGroupItem => ({ field, direction: 'asc' });
const BY_STATUS = [asc('status')];
const BY_STATUS_TEAM = [asc('status'), asc('team')];
const BY_THREE = [asc('status'), asc('team'), asc('channel')];

function Orders(props: Partial<DataGridProps<Order>>) {
  return (
    <DataGrid
      data={ORDERS}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      groupPanel
      {...props}
    />
  );
}

/** A grid whose parent keeps the grouping, as a caller that saves it does. */
function Controlled({
  start = BY_STATUS_TEAM,
  keep = true,
  onChange,
  ...props
}: Partial<DataGridProps<Order>> & {
  start?: DataGridGroupItem[];
  keep?: boolean;
  onChange?: (grouping: readonly DataGridGroupItem[]) => void;
}) {
  const [grouping, setGrouping] = useState(start);
  return (
    <Orders
      grouping={grouping}
      onGroupingChange={(next) => {
        onChange?.(next);
        if (keep) setGrouping([...next]);
      }}
      {...props}
    />
  );
}

const table = () => document.querySelector<HTMLTableElement>('table.flg-data-grid-table')!;
const titles = () =>
  Array.from(table().tHead!.rows[0]!.cells).filter(
    (cell) =>
      !cell.classList.contains('flg-data-grid-filler') &&
      !cell.classList.contains('flg-data-grid-indent'),
  );
const captions = () => titles().map((cell) => cell.textContent);
const title = (name: string) => titles().find((cell) => cell.textContent?.includes(name))!;
const panel = () => screen.queryByRole('group', { name: 'Grouping' });
const chips = () => Array.from(document.querySelectorAll<HTMLElement>('.flg-data-grid-group-chip'));
const chipNames = () => chips().map((chip) => chip.firstChild?.textContent);
const chipOf = (name: string) => chips().find((chip) => chip.firstChild?.textContent === name)!;
const buttonsOf = (name: string) =>
  within(chipOf(name)).getAllByRole('button') as [HTMLButtonElement, HTMLButtonElement];
const dragChip = () => document.querySelector<HTMLElement>('.flg-data-grid-drag-chip');
const line = () => document.querySelector<HTMLElement>('.flg-data-grid-drop-line');
const region = () => document.querySelector('[aria-live="polite"]')!;
const fakeTimers = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
const tick = () => act(() => void vi.advanceTimersByTime(0));
const html = () => document.documentElement;

const POINTER = { pointerId: 1, isPrimary: true, pointerType: 'mouse', button: 0 };
const press = (element: Element, x: number, y = 10, init: PointerEventInit = {}) =>
  fireEvent.pointerDown(element, { ...POINTER, buttons: 1, clientX: x, clientY: y, ...init });
const move = (x: number, y = 10, init: PointerEventInit = {}) =>
  fireEvent.pointerMove(document, { ...POINTER, buttons: 1, clientX: x, clientY: y, ...init });
const release = (x: number, y = 10) =>
  fireEvent.pointerUp(document, { ...POINTER, buttons: 0, clientX: x, clientY: y });

/** The place over the tray, y of its middle. */
const OVER_TRAY = -27;

/** A drag of the title `name` to the pointer at `x`, `y`, released there. */
function dragTitle(name: string, x: number, y = OVER_TRAY) {
  press(title(name), 400);
  move(x, y);
  runFrames();
  release(x, y);
}
/** A drag of the chip `name` to the pointer at `x`, `y`, released there. */
function dragChipTo(name: string, x: number, y: number, init: PointerEventInit = {}) {
  const from = chipOf(name);
  press(from, 100, OVER_TRAY, init);
  move(x, y, init);
  runFrames();
  release(x, y);
}

const apple = () => vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
const windows = () => vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
const lastGrouping = (onGroupingChange: ReturnType<typeof vi.fn>) =>
  onGroupingChange.mock.lastCall![0] as DataGridGroupItem[];

describe('the item of the toolbar', () => {
  it('is a tray named by labels.groupPanel, in the toolbar before the search field', () => {
    render(<Orders searchPanel />);
    const tray = panel()!;
    expect(tray).not.toBeNull();
    expect(tray.parentElement).toHaveClass('flg-data-grid-toolbar');
    const search = document.querySelector('.flg-data-grid-search')!;
    expect(tray.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('is not drawn without groupPanel, or for a value that is not true', () => {
    const { rerender } = render(<Orders groupPanel={false} />);
    expect(panel()).toBeNull();
    rerender(<Orders groupPanel={'yes' as unknown as boolean} />);
    expect(panel()).toBeNull();
    rerender(<Orders groupPanel />);
    expect(panel()).not.toBeNull();
  });

  it('is given to a toolbar function as items.groupPanel, null when the panel is off', () => {
    const seen: Array<DataGridToolbarItems['groupPanel']> = [];
    const toolbar = (items: DataGridToolbarItems) => {
      seen.push(items.groupPanel);
      return [items.search, items.groupPanel];
    };
    const { rerender } = render(<Orders toolbar={toolbar} searchPanel />);
    expect(seen.at(-1)).not.toBeNull();
    const tray = panel()!;
    const search = document.querySelector('.flg-data-grid-search')!;
    // The function put it after the search field.
    expect(search.compareDocumentPosition(tray) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    rerender(<Orders toolbar={toolbar} searchPanel groupPanel={false} />);
    expect(seen.at(-1)).toBeNull();
    expect(panel()).toBeNull();
  });

  it('is gone with toolbar={false}, which takes the items away', () => {
    render(<Orders toolbar={false} />);
    expect(panel()).toBeNull();
  });

  it('makes a toolbar of its own for a grid that has no caption', () => {
    render(<Orders caption={undefined} aria-label="Orders" />);
    expect(panel()).not.toBeNull();
    expect(document.querySelector('.flg-data-grid-toolbar')).not.toBeNull();
  });

  it('is drawn in server mode as nothing, and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<Orders remote totalCount={3} />);
    expect(panel()).toBeNull();
    rerender(<Orders remote totalCount={3} />);
    expect(warn.mock.calls.filter(([text]) => String(text).includes('group panel'))).toHaveLength(
      1,
    );
    expect(String(warn.mock.calls.at(-1)![0])).toContain(
      '<DataGrid> remote does not group: the group panel is not shown.',
    );
  });
});

describe('the tray', () => {
  it('says the hint, with an icon and no chip, when nothing is grouped', () => {
    render(<Orders />);
    const tray = panel()!;
    expect(tray).toHaveAttribute('data-empty');
    expect(tray).toHaveTextContent('Drag a column header here to group by that column');
    expect(tray.querySelector('svg')).not.toBeNull();
    expect(chips()).toHaveLength(0);
    expect(within(tray).queryAllByRole('button')).toHaveLength(0);
  });

  it('has a chip for each level in order, with "Group by" and a chevron between two', () => {
    render(<Orders defaultGrouping={BY_STATUS_TEAM} />);
    const tray = panel()!;
    expect(tray).not.toHaveAttribute('data-empty');
    expect(tray).toHaveTextContent('Group by');
    expect(chipNames()).toEqual(['Status', 'Team']);
    const separators = tray.querySelectorAll('.flg-data-grid-group-separator');
    expect(separators).toHaveLength(1);
    expect(separators[0]).toHaveAttribute('aria-hidden', 'true');
    // The separator is between the two chips.
    expect(
      chips()[0]!.compareDocumentPosition(separators[0]!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      separators[0]!.compareDocumentPosition(chips()[1]!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('names the two buttons of a chip for what they do', () => {
    render(<Orders defaultGrouping={[asc('status'), { field: 'team', direction: 'desc' }]} />);
    expect(buttonsOf('Status').map((button) => button.getAttribute('aria-label'))).toEqual([
      'Sort Status groups descending',
      'Ungroup Status',
    ]);
    expect(buttonsOf('Team').map((button) => button.getAttribute('aria-label'))).toEqual([
      'Sort Team groups ascending',
      'Ungroup Team',
    ]);
  });

  it('says its words from labels', () => {
    render(
      <Orders
        defaultGrouping={BY_STATUS}
        labels={{
          groupPanel: 'Nhóm',
          groupBy: 'Nhóm theo',
          ungroup: (caption) => `Bỏ nhóm ${caption}`,
        }}
      />,
    );
    expect(screen.getByRole('group', { name: 'Nhóm' })).toHaveTextContent('Nhóm theo');
    expect(screen.getByRole('button', { name: 'Bỏ nhóm Status' })).toBeInTheDocument();
  });

  it('follows the grouping when it comes from the parent: a chip for the new level, none for an old one', () => {
    const { rerender } = render(<Orders grouping={BY_STATUS} />);
    expect(chipNames()).toEqual(['Status']);
    rerender(<Orders grouping={BY_THREE} />);
    expect(chipNames()).toEqual(['Status', 'Team', 'Channel']);
    rerender(<Orders grouping={[]} />);
    expect(chipNames()).toEqual([]);
    expect(panel()).toHaveAttribute('data-empty');
  });

  it('draws no chip for an item that does not group', () => {
    render(<Orders grouping={[asc('status'), asc('nothing'), asc('id'), asc('status')]} />);
    expect(chipNames()).toEqual(['Status']);
  });

  it('keeps its buttons in the order of Tab: two for each chip, after the caption', () => {
    render(<Orders defaultGrouping={BY_STATUS_TEAM} searchPanel />);
    const buttons = within(panel()!).getAllByRole('button');
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Sort Status groups descending',
      'Ungroup Status',
      'Sort Team groups descending',
      'Ungroup Team',
    ]);
    for (const button of buttons) expect(button).not.toHaveAttribute('tabindex', '-1');
  });
});

describe('the buttons of a chip', () => {
  it('turns the direction of its level, with one callback, and the name says the next', () => {
    fakeTimers();
    const onGroupingChange = vi.fn();
    const onStateChange = vi.fn();
    render(
      <Controlled
        start={BY_STATUS_TEAM}
        onChange={onGroupingChange}
        onStateChange={onStateChange}
      />,
    );
    fireEvent.click(buttonsOf('Team')[0]);
    expect(onGroupingChange).toHaveBeenCalledTimes(1);
    expect(lastGrouping(onGroupingChange)).toEqual([
      asc('status'),
      { field: 'team', direction: 'desc' },
    ]);
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange.mock.lastCall![1]).toBe('grouping');
    expect(buttonsOf('Team')[0]).toHaveAccessibleName('Sort Team groups ascending');
    // The name changes, and nothing is said: a screen reader reads the name of the button it is on.
    tick();
    expect(region()).toBeEmptyDOMElement();
    fireEvent.click(buttonsOf('Team')[0]);
    expect(lastGrouping(onGroupingChange)).toEqual([asc('status'), asc('team')]);
  });

  it('orders the groups the way the direction says', () => {
    render(<Orders defaultGrouping={BY_STATUS} />);
    const order = () =>
      Array.from(document.querySelectorAll('tr.flg-data-grid-group-row')).map((row) =>
        row.textContent?.replace(/\(\d+\)/, '').trim(),
      );
    expect(order()).toEqual(['Status: Done', 'Status: New']);
    fireEvent.click(buttonsOf('Status')[0]);
    expect(order()).toEqual(['Status: New', 'Status: Done']);
  });

  it('takes its level out, says it, and brings the column back to the heading', () => {
    fakeTimers();
    const onGroupingChange = vi.fn();
    render(<Controlled start={BY_STATUS_TEAM} onChange={onGroupingChange} />);
    expect(captions()).toEqual(['Order', 'Customer', 'Channel', 'Qty']);
    fireEvent.click(buttonsOf('Status')[1]);
    expect(onGroupingChange).toHaveBeenCalledTimes(1);
    expect(lastGrouping(onGroupingChange)).toEqual([asc('team')]);
    expect(chipNames()).toEqual(['Team']);
    expect(captions()).toEqual(['Order', 'Customer', 'Status', 'Channel', 'Qty']);
    tick();
    expect(region()).toHaveTextContent('Status ungrouped');
  });

  it('says it in the words of labels.announceUngrouped', () => {
    fakeTimers();
    render(
      <Controlled
        start={BY_STATUS}
        labels={{ announceUngrouped: (caption) => `${caption} removed` }}
      />,
    );
    fireEvent.click(buttonsOf('Status')[1]);
    tick();
    expect(region()).toHaveTextContent('Status removed');
  });

  it('goes to page 0 as its own change when the page was another', () => {
    const onPageChange = vi.fn();
    const onGroupingChange = vi.fn();
    render(
      <Orders
        grouping={BY_STATUS}
        onGroupingChange={onGroupingChange}
        paging={{ pageSize: 2 }}
        defaultPage={{ index: 1, size: 2 }}
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(buttonsOf('Status')[1]);
    expect(onGroupingChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith({ index: 0, size: 2 });
  });

  it('calls nothing for a parent that keeps its value, and keeps the chip', () => {
    const onGroupingChange = vi.fn();
    render(<Controlled start={BY_STATUS} keep={false} onChange={onGroupingChange} />);
    fireEvent.click(buttonsOf('Status')[1]);
    expect(onGroupingChange).toHaveBeenCalledTimes(1);
    expect(chipNames()).toEqual(['Status']);
  });
});

describe('the focus after a removal', () => {
  it('goes to the same button of the chip that is now in its place', () => {
    render(<Controlled start={BY_THREE} />);
    const remove = buttonsOf('Team')[1];
    remove.focus();
    fireEvent.click(remove);
    expect(chipNames()).toEqual(['Status', 'Channel']);
    expect(document.activeElement).toBe(buttonsOf('Channel')[1]);
  });

  it('goes to the chip before when the last one is removed', () => {
    render(<Controlled start={BY_THREE} />);
    const remove = buttonsOf('Channel')[1];
    remove.focus();
    fireEvent.click(remove);
    expect(document.activeElement).toBe(buttonsOf('Team')[1]);
  });

  it('goes to the active place of the grid when no chip is left', () => {
    render(<Controlled start={BY_STATUS} />);
    const remove = buttonsOf('Status')[1];
    remove.focus();
    fireEvent.click(remove);
    expect(chipNames()).toEqual([]);
    expect(document.activeElement).not.toBe(document.body);
    expect(table().contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toHaveAttribute('tabindex', '0');
  });

  it('stays where it is when the parent keeps the chip', () => {
    render(<Controlled start={BY_THREE} keep={false} />);
    const remove = buttonsOf('Team')[1];
    remove.focus();
    fireEvent.click(remove);
    expect(document.activeElement).toBe(remove);
  });
});

describe.each([
  ['Windows', windows, { ctrlKey: true, shiftKey: true }],
  ['Apple', apple, { metaKey: true, shiftKey: true }],
] as const)('the keys of a chip, on %s', (_name, onPlatform, mod) => {
  beforeEach(() => void onPlatform());

  it.each([0, 1])('moves the level one place right with mod+Shift+→ on button %i', (button) => {
    fakeTimers();
    const onGroupingChange = vi.fn();
    render(<Controlled start={BY_THREE} onChange={onGroupingChange} />);
    fireEvent.keyDown(buttonsOf('Status')[button]!, { key: 'ArrowRight', ...mod });
    expect(onGroupingChange).toHaveBeenCalledTimes(1);
    expect(lastGrouping(onGroupingChange).map((item) => item.field)).toEqual([
      'team',
      'status',
      'channel',
    ]);
    expect(chipNames()).toEqual(['Team', 'Status', 'Channel']);
    tick();
    expect(region()).toHaveTextContent('Status moved to grouping level 2 of 3');
  });

  it('moves it left with mod+Shift+←', () => {
    fakeTimers();
    const onGroupingChange = vi.fn();
    render(<Controlled start={BY_THREE} onChange={onGroupingChange} />);
    fireEvent.keyDown(buttonsOf('Channel')[0], { key: 'ArrowLeft', ...mod });
    expect(chipNames()).toEqual(['Status', 'Channel', 'Team']);
    tick();
    expect(region()).toHaveTextContent('Channel moved to grouping level 2 of 3');
  });

  it('keeps the focus on the same button of the moved chip', () => {
    render(<Controlled start={BY_THREE} />);
    for (const button of [0, 1]) {
      buttonsOf('Status')[button]!.focus();
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight', ...mod });
      expect(document.activeElement).toBe(buttonsOf('Status')[button]);
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft', ...mod });
      expect(document.activeElement).toBe(buttonsOf('Status')[button]);
    }
    expect(chipNames()).toEqual(['Status', 'Team', 'Channel']);
  });

  it('is cancelled and does nothing at an edge', () => {
    fakeTimers();
    const onGroupingChange = vi.fn();
    render(<Controlled start={BY_THREE} onChange={onGroupingChange} />);
    expect(fireEvent.keyDown(buttonsOf('Status')[0], { key: 'ArrowLeft', ...mod })).toBe(false);
    expect(fireEvent.keyDown(buttonsOf('Channel')[1], { key: 'ArrowRight', ...mod })).toBe(false);
    tick();
    expect(onGroupingChange).not.toHaveBeenCalled();
    expect(region()).toBeEmptyDOMElement();
  });

  it('is no key of the chip without Shift, or with Alt, or with the other platform modifier', () => {
    const onGroupingChange = vi.fn();
    render(<Controlled start={BY_THREE} onChange={onGroupingChange} />);
    const other = 'metaKey' in mod ? { ctrlKey: true } : { metaKey: true };
    const button = buttonsOf('Status')[0];
    expect(fireEvent.keyDown(button, { key: 'ArrowRight', ...mod, shiftKey: false })).toBe(true);
    expect(fireEvent.keyDown(button, { key: 'ArrowRight', ...mod, altKey: true })).toBe(true);
    expect(fireEvent.keyDown(button, { key: 'ArrowRight', ...other, shiftKey: true })).toBe(true);
    expect(onGroupingChange).not.toHaveBeenCalled();
  });
});

describe('"Group by this column" in the column menu', () => {
  // jsdom has no Popover API: the menu shows and hides by these stand-ins (as DataGrid.menu.test.tsx does).
  let showing: Set<Element>;
  beforeEach(() => {
    showing = new Set();
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
  /** A press and a click on the button of a title, as a mouse makes them, and the menu that opens. */
  const openMenu = (name: string) => {
    const button = within(title(name)).getByRole('button', { name: `${name} column menu` });
    fireEvent.pointerDown(button, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 });
    fireEvent.mouseDown(button);
    fireEvent.pointerUp(button, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 });
    fireEvent.click(button, { detail: 1 });
    return document.querySelector<HTMLElement>('.flg-data-grid-column-menu')!;
  };
  const itemsOf = (menu: HTMLElement) =>
    Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  const items = (menu: HTMLElement) => itemsOf(menu).map((item) => item.textContent);
  const itemOf = (menu: HTMLElement, name: string) =>
    itemsOf(menu).find((item) => item.textContent === name)!;

  it('is in the menu of a grid that has the panel, after the sort', () => {
    render(<Orders />);
    const menu = openMenu('Team');
    expect(items(menu).slice(0, 5)).toEqual([
      'Sort ascending',
      'Sort descending',
      'Clear sorting',
      'Group by this column',
      'Pin to the left',
    ]);
  });

  it('is not in the menu of a grid that draws no tray: with no chip to ungroup by, it never groups', () => {
    const { rerender } = render(<Orders groupPanel={false} grouping={BY_STATUS} />);
    expect(items(openMenu('Team'))).not.toContain('Group by this column');
    rerender(<Orders toolbar={false} grouping={BY_STATUS} />);
    expect(items(openMenu('Team'))).not.toContain('Group by this column');
    // A toolbar function that leaves the tray out draws none.
    rerender(
      <Orders
        grouping={BY_STATUS}
        toolbar={(toolbarItems: DataGridToolbarItems) => [toolbarItems.search]}
      />,
    );
    expect(panel()).toBeNull();
    expect(items(openMenu('Team'))).not.toContain('Group by this column');
  });

  it('is in the menu of a grid whose toolbar function places the tray, and goes when it does not', () => {
    const { rerender } = render(
      <Orders toolbar={(toolbarItems: DataGridToolbarItems) => [toolbarItems.groupPanel]} />,
    );
    expect(panel()).not.toBeNull();
    expect(items(openMenu('Team'))).toContain('Group by this column');
    rerender(<Orders toolbar={() => null} />);
    expect(panel()).toBeNull();
    expect(items(openMenu('Team'))).not.toContain('Group by this column');
  });

  it('is not in the menu of a column that does not allow grouping, nor in server mode', () => {
    const { unmount } = render(<Orders />);
    expect(items(openMenu('Order'))).not.toContain('Group by this column');
    unmount();
    render(<Orders remote totalCount={3} />);
    expect(items(openMenu('Team'))).not.toContain('Group by this column');
  });

  it('is not in the menu of the last data column that is shown, as Hide column is not', () => {
    render(
      <Orders defaultColumnLayout={{ hidden: ['id', 'customer', 'status', 'team', 'channel'] }} />,
    );
    expect(captions()).toEqual(['Qty']);
    const menu = openMenu('Qty');
    expect(items(menu)).not.toContain('Group by this column');
    expect(items(menu)).not.toContain('Hide column');
  });

  it('is turned off for a column that is grouped and still shown', () => {
    render(
      <Orders
        grouping={BY_STATUS}
        columns={COLUMNS.map((column) =>
          column.field === 'status' ? { ...column, showWhenGrouped: true } : column,
        )}
      />,
    );
    const menu = openMenu('Status');
    expect(itemOf(menu, 'Group by this column')).toHaveAttribute('aria-disabled', 'true');
  });

  it('groups by the column as a new last level, ascending, and says it', () => {
    fakeTimers();
    const onGroupingChange = vi.fn();
    render(<Controlled start={BY_STATUS} onChange={onGroupingChange} />);
    const menu = openMenu('Channel');
    act(() => itemOf(menu, 'Group by this column').click());
    expect(onGroupingChange).toHaveBeenCalledTimes(1);
    expect(lastGrouping(onGroupingChange)).toEqual([asc('status'), asc('channel')]);
    expect(chipNames()).toEqual(['Status', 'Channel']);
    expect(captions()).toEqual(['Order', 'Customer', 'Team', 'Qty']);
    tick();
    expect(region()).toHaveTextContent('Grouped by Channel');
  });

  it('gives the focus back to the grid, to the title now at the place of the column', async () => {
    render(<Controlled start={BY_STATUS} />);
    const menu = openMenu('Team');
    act(() => itemOf(menu, 'Group by this column').click());
    expect(captions()).toEqual(['Order', 'Customer', 'Channel', 'Qty']);
    await waitFor(() => expect(table().contains(document.activeElement)).toBe(true));
    expect(document.activeElement).not.toBe(document.body);
  });

  it('gives a column that only groups a button for its menu', () => {
    render(
      <Orders
        columns={COLUMNS.map((column) => ({
          ...column,
          allowSorting: false,
          allowPinning: false,
          allowReordering: false,
          allowResizing: false,
          allowHiding: false,
        }))}
      />,
    );
    expect(within(title('Team')).getByRole('button', { name: 'Team column menu' })).toBeVisible();
    // The column that does not group has no menu to open.
    expect(within(title('Order')).queryByRole('button', { name: 'Order column menu' })).toBeNull();
  });
});

describe('a title dragged into the tray', () => {
  it('puts the level in each slot: before the first chip, between, after the last', () => {
    const onGroupingChange = vi.fn();
    render(
      <Orders
        grouping={BY_STATUS_TEAM}
        onGroupingChange={onGroupingChange}
        columns={COLUMNS.map((column) => ({ ...column, allowReordering: false }))}
      />,
    );
    // The columns cannot be reordered: the tray is the only target of their titles.
    dragTitle('Channel', 100);
    expect(lastGrouping(onGroupingChange)).toEqual([asc('channel'), asc('status'), asc('team')]);
    dragTitle('Channel', 200);
    expect(lastGrouping(onGroupingChange)).toEqual([asc('status'), asc('channel'), asc('team')]);
    dragTitle('Channel', 300);
    expect(lastGrouping(onGroupingChange)).toEqual([asc('status'), asc('team'), asc('channel')]);
  });

  it('groups into an empty tray, and says it', () => {
    fakeTimers();
    const onGroupingChange = vi.fn();
    render(<Controlled start={[]} onChange={onGroupingChange} />);
    dragTitle('Team', 50);
    expect(lastGrouping(onGroupingChange)).toEqual([asc('team')]);
    expect(chipNames()).toEqual(['Team']);
    tick();
    expect(region()).toHaveTextContent('Grouped by Team');
  });

  it('marks the tray while it is over, draws the bar from attributes, and no line in the heading', () => {
    render(<Orders defaultGrouping={BY_STATUS_TEAM} />);
    press(title('Channel'), 400);
    move(200, OVER_TRAY);
    runFrames();
    expect(panel()).toHaveAttribute('data-drop-target');
    // 200 is between the middles 110 and 250: the level goes before the second chip.
    expect(chipOf('Team')).toHaveAttribute('data-drop-before');
    expect(chipOf('Status')).not.toHaveAttribute('data-drop-before');
    expect(panel()).not.toHaveAttribute('data-drop-end');
    expect(line()).toBeNull();
    expect(dragChip()).toHaveTextContent('Channel');
    move(300, OVER_TRAY);
    runFrames();
    expect(panel()).toHaveAttribute('data-drop-end');
    expect(document.querySelector('[data-drop-before]')).toBeNull();
    // Back in the heading the tray is not marked, and the line is there.
    move(110, 10);
    runFrames();
    expect(panel()).not.toHaveAttribute('data-drop-target');
    expect(panel()).not.toHaveAttribute('data-drop-end');
    expect(line()).not.toBeNull();
    release(110, 10);
  });

  it('marks an empty tray and puts the bar at its start', () => {
    render(<Orders />);
    press(title('Team'), 400);
    move(50, OVER_TRAY);
    runFrames();
    expect(panel()).toHaveAttribute('data-drop-target');
    expect(panel()).toHaveAttribute('data-drop-end');
    release(50, OVER_TRAY);
  });

  it('takes everything it set off the page at the release', () => {
    render(<Orders defaultGrouping={BY_STATUS} />);
    press(title('Team'), 400);
    move(200, OVER_TRAY);
    runFrames();
    expect(html()).toHaveAttribute('data-flg-grid-cursor', 'grabbing');
    release(200, OVER_TRAY);
    expect(dragChip()).toBeNull();
    expect(panel()).not.toHaveAttribute('data-drop-target');
    expect(document.querySelector('[data-drop-before], [data-drop-end]')).toBeNull();
    expect(html()).not.toHaveAttribute('data-flg-grid-cursor');
  });

  it('starts for the tray alone from a column that cannot be reordered, and not without a panel', () => {
    const onGroupingChange = vi.fn();
    const columns = COLUMNS.map((column) => ({ ...column, allowReordering: false }));
    const { rerender } = render(<Orders columns={columns} onGroupingChange={onGroupingChange} />);
    press(title('Team'), 400);
    move(200, OVER_TRAY);
    runFrames();
    expect(dragChip()).not.toBeNull();
    // Over the heading it has no line: it cannot be dropped there.
    move(110, 10);
    runFrames();
    expect(line()).toBeNull();
    release(110, 10);
    expect(onGroupingChange).not.toHaveBeenCalled();
    rerender(<Orders columns={columns} groupPanel={false} onGroupingChange={onGroupingChange} />);
    press(title('Team'), 400);
    move(200, 10);
    runFrames();
    expect(dragChip()).toBeNull();
    release(200, 10);
  });

  it('does not start from a column that does not allow grouping and cannot be moved', () => {
    render(
      <Orders
        columns={COLUMNS.map((column) =>
          column.field === 'id' ? { ...column, allowReordering: false } : column,
        )}
      />,
    );
    press(title('Order'), 50);
    move(50, OVER_TRAY);
    runFrames();
    expect(dragChip()).toBeNull();
    release(50, OVER_TRAY);
  });

  it('does nothing for a column that is grouped and still shown: no mark, no bar', () => {
    const onGroupingChange = vi.fn();
    render(
      <Orders
        grouping={BY_STATUS}
        onGroupingChange={onGroupingChange}
        columns={COLUMNS.map((column) =>
          column.field === 'status' ? { ...column, showWhenGrouped: true } : column,
        )}
      />,
    );
    press(title('Status'), 400);
    move(200, OVER_TRAY);
    runFrames();
    expect(panel()).not.toHaveAttribute('data-drop-target');
    expect(document.querySelector('[data-drop-before], [data-drop-end]')).toBeNull();
    release(200, OVER_TRAY);
    expect(onGroupingChange).not.toHaveBeenCalled();
  });

  it('does nothing for the last data column that is shown', () => {
    const onGroupingChange = vi.fn();
    render(
      <Orders
        onGroupingChange={onGroupingChange}
        defaultColumnLayout={{ hidden: ['id', 'customer', 'status', 'team', 'channel'] }}
      />,
    );
    press(title('Qty'), 400);
    move(50, OVER_TRAY);
    runFrames();
    expect(panel()).not.toHaveAttribute('data-drop-target');
    release(50, OVER_TRAY);
    expect(onGroupingChange).not.toHaveBeenCalled();
  });

  it('is a cancel on Escape and on pointercancel, with nothing left of the drag', () => {
    const onGroupingChange = vi.fn();
    render(<Orders defaultGrouping={BY_STATUS} onGroupingChange={onGroupingChange} />);
    press(title('Team'), 400);
    move(200, OVER_TRAY);
    runFrames();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(dragChip()).toBeNull();
    expect(panel()).not.toHaveAttribute('data-drop-target');
    expect(html()).not.toHaveAttribute('data-flg-grid-cursor');
    release(200, OVER_TRAY);
    press(title('Team'), 400);
    move(200, OVER_TRAY);
    runFrames();
    fireEvent.pointerCancel(document, POINTER);
    expect(dragChip()).toBeNull();
    expect(onGroupingChange).not.toHaveBeenCalled();
  });

  it('keeps the drag of a title in the heading as it was: a line, and a move of the column', () => {
    const onColumnLayoutChange = vi.fn();
    render(<Orders onColumnLayoutChange={onColumnLayoutChange} />);
    press(title('Team'), 400);
    move(110, 10);
    runFrames();
    expect(line()).not.toBeNull();
    expect(panel()).not.toHaveAttribute('data-drop-target');
    release(110, 10);
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
  });

  it('takes the drop off the tray when the parent turns the panel off in the middle of it', () => {
    const onGroupingChange = vi.fn();
    const { rerender } = render(<Orders onGroupingChange={onGroupingChange} />);
    press(title('Team'), 400);
    move(200, OVER_TRAY);
    runFrames();
    rerender(<Orders groupPanel={false} onGroupingChange={onGroupingChange} />);
    release(200, OVER_TRAY);
    expect(onGroupingChange).not.toHaveBeenCalled();
    expect(dragChip()).toBeNull();
    expect(html()).not.toHaveAttribute('data-flg-grid-cursor');
  });
});

describe('a chip dragged', () => {
  const FIRST = 90; // before the middle of the first chip (110)
  const BETWEEN_TWO_AND_THREE = 300; // between the middles 250 and 390

  it('moves its level to the slot of the drop', () => {
    fakeTimers();
    const onGroupingChange = vi.fn();
    render(<Controlled start={BY_THREE} onChange={onGroupingChange} />);
    dragChipTo('Status', 420, OVER_TRAY);
    expect(onGroupingChange).toHaveBeenCalledTimes(1);
    expect(lastGrouping(onGroupingChange).map((item) => item.field)).toEqual([
      'team',
      'channel',
      'status',
    ]);
    expect(chipNames()).toEqual(['Team', 'Channel', 'Status']);
    tick();
    expect(region()).toHaveTextContent('Status moved to grouping level 3 of 3');
    dragChipTo('Status', FIRST, OVER_TRAY);
    expect(chipNames()).toEqual(['Status', 'Team', 'Channel']);
    dragChipTo('Status', BETWEEN_TWO_AND_THREE, OVER_TRAY);
    expect(chipNames()).toEqual(['Team', 'Status', 'Channel']);
  });

  it('keeps the direction of the level it moves', () => {
    const onGroupingChange = vi.fn();
    render(
      <Controlled
        start={[{ field: 'status', direction: 'desc' }, asc('team')]}
        onChange={onGroupingChange}
      />,
    );
    dragChipTo('Status', 420, OVER_TRAY);
    expect(lastGrouping(onGroupingChange)).toEqual([
      asc('team'),
      { field: 'status', direction: 'desc' },
    ]);
  });

  it('does nothing for a drop beside itself, and shows no bar there', () => {
    const onGroupingChange = vi.fn();
    render(<Controlled start={BY_THREE} onChange={onGroupingChange} />);
    press(chipOf('Team'), 250, OVER_TRAY);
    move(200, OVER_TRAY);
    runFrames();
    expect(panel()).toHaveAttribute('data-drop-target');
    expect(document.querySelector('[data-drop-before], [data-drop-end]')).toBeNull();
    release(200, OVER_TRAY);
    expect(onGroupingChange).not.toHaveBeenCalled();
  });

  it('dims the chip that is dragged, shows the chip of the grid, and takes both away at the end', () => {
    render(<Controlled start={BY_THREE} />);
    press(chipOf('Team'), 250, OVER_TRAY);
    move(420, OVER_TRAY);
    runFrames();
    expect(chipOf('Team')).toHaveAttribute('data-drag-source');
    expect(chipOf('Status')).not.toHaveAttribute('data-drag-source');
    expect(dragChip()).toHaveTextContent('Team');
    expect(document.querySelectorAll('.flg-data-grid-drag-chip')).toHaveLength(1);
    expect(chipOf('Channel').nextElementSibling).toBeNull();
    expect(panel()).toHaveAttribute('data-drop-end');
    expect(html()).toHaveAttribute('data-flg-grid-cursor', 'grabbing');
    release(420, OVER_TRAY);
    expect(dragChip()).toBeNull();
    expect(document.querySelector('[data-drag-source]')).toBeNull();
    expect(html()).not.toHaveAttribute('data-flg-grid-cursor');
  });

  it('ungroups when it is dropped on the heading, and says it', () => {
    fakeTimers();
    const onGroupingChange = vi.fn();
    render(<Controlled start={BY_STATUS_TEAM} onChange={onGroupingChange} />);
    dragChipTo('Status', 200, 10);
    expect(lastGrouping(onGroupingChange)).toEqual([asc('team')]);
    expect(chipNames()).toEqual(['Team']);
    // The column is back in the heading.
    expect(captions()).toContain('Status');
    tick();
    expect(region()).toHaveTextContent('Status ungrouped');
  });

  it('does nothing when it is dropped anywhere else', () => {
    const onGroupingChange = vi.fn();
    render(<Controlled start={BY_STATUS_TEAM} onChange={onGroupingChange} />);
    // Below the frame, and left of the tray.
    dragChipTo('Status', 200, 400);
    dragChipTo('Status', -50, OVER_TRAY);
    expect(onGroupingChange).not.toHaveBeenCalled();
    expect(chipNames()).toEqual(['Status', 'Team']);
  });

  it('is a cancel on Escape, pointercancel and a lost capture', () => {
    const onGroupingChange = vi.fn();
    render(<Controlled start={BY_THREE} onChange={onGroupingChange} />);
    const settled = () => {
      expect(dragChip()).toBeNull();
      expect(document.querySelector('[data-drag-source], [data-drop-target]')).toBeNull();
      expect(html()).not.toHaveAttribute('data-flg-grid-cursor');
    };
    const start = () => {
      press(chipOf('Status'), 110, OVER_TRAY);
      move(420, OVER_TRAY);
      runFrames();
      expect(dragChip()).not.toBeNull();
    };
    start();
    fireEvent.keyDown(document, { key: 'Escape' });
    settled();
    release(420, OVER_TRAY);
    start();
    fireEvent.pointerCancel(document, POINTER);
    settled();
    start();
    fireEvent(chipOf('Status'), Object.assign(new Event('lostpointercapture'), { pointerId: 1 }));
    settled();
    expect(onGroupingChange).not.toHaveBeenCalled();
  });

  it('is a drag for a touch pointer too, and a pen', () => {
    const onGroupingChange = vi.fn();
    render(<Controlled start={BY_THREE} onChange={onGroupingChange} />);
    dragChipTo('Status', 420, OVER_TRAY, { pointerType: 'touch' });
    expect(chipNames()).toEqual(['Team', 'Channel', 'Status']);
    dragChipTo('Status', FIRST, OVER_TRAY, { pointerType: 'pen' });
    expect(chipNames()).toEqual(['Status', 'Team', 'Channel']);
    expect(onGroupingChange).toHaveBeenCalledTimes(2);
  });

  it('does not start from a button of the chip: that press is the button', () => {
    const onGroupingChange = vi.fn();
    render(<Controlled start={BY_THREE} onChange={onGroupingChange} />);
    press(buttonsOf('Status')[0], 110, OVER_TRAY);
    move(420, OVER_TRAY);
    runFrames();
    expect(dragChip()).toBeNull();
    release(420, OVER_TRAY);
    expect(onGroupingChange).not.toHaveBeenCalled();
  });

  it('is a click, not a drag, under the threshold', () => {
    const onGroupingChange = vi.fn();
    render(<Controlled start={BY_STATUS} onChange={onGroupingChange} />);
    press(chipOf('Status'), 110, OVER_TRAY);
    move(112, OVER_TRAY);
    expect(dragChip()).toBeNull();
    release(112, OVER_TRAY);
    expect(onGroupingChange).not.toHaveBeenCalled();
  });

  it('cancels the mousedown of a press on the chip, and leaves the one on a button', () => {
    render(<Controlled start={BY_STATUS} />);
    expect(fireEvent.mouseDown(chipOf('Status'), { button: 0 })).toBe(false);
    expect(fireEvent.mouseDown(buttonsOf('Status')[0], { button: 0 })).toBe(true);
    expect(fireEvent.mouseDown(chipOf('Status'), { button: 2 })).toBe(true);
  });

  it('works out the drop from the chips as they are at the release', () => {
    const onGroupingChange = vi.fn();
    const { rerender } = render(<Orders grouping={BY_THREE} onGroupingChange={onGroupingChange} />);
    press(chipOf('Status'), 110, OVER_TRAY);
    move(420, OVER_TRAY);
    runFrames();
    // The parent ungroups the chip that is dragged while the button is held.
    rerender(
      <Orders grouping={[asc('team'), asc('channel')]} onGroupingChange={onGroupingChange} />,
    );
    release(420, OVER_TRAY);
    expect(onGroupingChange).not.toHaveBeenCalled();
    expect(dragChip()).toBeNull();
  });

  it('takes the drag away with the panel when the panel is turned off in the middle of it', () => {
    const onGroupingChange = vi.fn();
    const { rerender } = render(<Orders grouping={BY_THREE} onGroupingChange={onGroupingChange} />);
    press(chipOf('Status'), 110, OVER_TRAY);
    move(420, OVER_TRAY);
    runFrames();
    expect(dragChip()).not.toBeNull();
    rerender(<Orders groupPanel={false} grouping={BY_THREE} onGroupingChange={onGroupingChange} />);
    expect(dragChip()).toBeNull();
    expect(html()).not.toHaveAttribute('data-flg-grid-cursor');
    release(420, OVER_TRAY);
    expect(onGroupingChange).not.toHaveBeenCalled();
  });

  it('takes everything off when the grid goes in the middle of a drag', () => {
    const { unmount } = render(<Orders grouping={BY_THREE} />);
    press(chipOf('Status'), 110, OVER_TRAY);
    move(420, OVER_TRAY);
    runFrames();
    expect(html()).toHaveAttribute('data-flg-grid-cursor', 'grabbing');
    unmount();
    expect(html()).not.toHaveAttribute('data-flg-grid-cursor');
    expect(document.querySelector('.flg-data-grid-drag-chip')).toBeNull();
  });
});

describe('the state', () => {
  it('sends the grouping with its part to onStateChange once for each change of the panel', () => {
    const onStateChange = vi.fn<(state: DataGridState, part: string) => void>();
    render(<Controlled start={BY_STATUS} onStateChange={onStateChange} />);
    fireEvent.click(buttonsOf('Status')[0]);
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange.mock.lastCall![0].grouping).toEqual([
      { field: 'status', direction: 'desc' },
    ]);
    expect(onStateChange.mock.lastCall![1]).toBe('grouping');
  });
});
