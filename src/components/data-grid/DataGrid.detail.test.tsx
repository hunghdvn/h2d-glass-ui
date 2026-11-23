import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import type { ReactNode, Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import type {
  DataGridColumn,
  DataGridGroupItem,
  DataGridHandle,
  DataGridKey,
  DataGridProps,
  DataGridState,
} from './index';

// Master-detail (spec phase 6 §3.6 "Master-detail" and "Ô có nhiều control", §3.7, §4.3 R1 "Nút mở chi
// tiết" and "Dòng chi tiết", §5, §6.3): the column of the buttons and the rows that have none, the open
// details as state, the detail row and what the button points at, the keys of the button and of the detail
// cell, the place when a detail closes, a control a detail draws on its own, the warnings, and a detail with
// groups, pages and server mode. What needs a layout engine (the content that sticks, a frame scrolled
// sideways) is proven in the stories.

beforeEach(() => {
  resetDevWarnings();
  // jsdom has no layout, so every element would count as hidden to the code that looks for the controls
  // of a cell.
  HTMLElement.prototype.checkVisibility = () => true;
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  vi.restoreAllMocks();
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
  { id: 'DH 4 "x"', status: 'Processing', qty: 4 },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 120 },
  { field: 'status', caption: 'Status', width: 120 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
];

const BY_STATUS: DataGridGroupItem[] = [{ field: 'status', direction: 'asc' }];

const renderDetail = (row: Order): ReactNode => <span>{`Lines of ${row.id}`}</span>;

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
      renderDetail={renderDetail}
      {...props}
    />
  );
}

const table = () => document.querySelector<HTMLTableElement>('table[role]')!;
const detailRows = () =>
  Array.from(table().querySelectorAll<HTMLTableRowElement>('tbody > tr.flg-data-grid-detail-row'));
const dataRows = () =>
  Array.from(table().querySelectorAll<HTMLTableRowElement>('tbody > tr.flg-data-grid-row'));
const toggle = (name: string) =>
  screen.getByRole('button', { name: new RegExp(`^(Show|Hide) details of ${name}$`) });
const stops = () => Array.from(table().querySelectorAll<HTMLElement>('[tabindex="0"]'));
const focusOn = (element: HTMLElement) => act(() => element.focus());
const press = (element: HTMLElement, pressed: string, init: KeyboardEventInit = {}): boolean => {
  const event = createEvent.keyDown(element, {
    key: pressed,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  act(() => {
    fireEvent(element, event);
  });
  return event.defaultPrevented;
};
const click = (element: HTMLElement) => act(() => element.click());

describe('the column of the buttons and the rows that have a detail', () => {
  it('has no column and no button without renderDetail', () => {
    render(<Orders renderDetail={undefined} />);
    expect(screen.queryByRole('button', { name: /details of/ })).toBeNull();
    expect(table().querySelectorAll('[data-service="detail"]')).toHaveLength(0);
    expect(table().querySelector('col')?.parentElement?.children).toHaveLength(3 + 1);
  });

  it('adds a column of 40px, first, with one button for each row, closed', () => {
    render(<Orders />);
    const cols = Array.from(table().querySelectorAll('col'));
    expect(cols[0]).toHaveStyle({ width: '40px' });
    const buttons = screen.getAllByRole('button', { name: /^Show details of / });
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Show details of DH-1',
      'Show details of DH-2',
      'Show details of DH-3',
      'Show details of DH 4 "x"',
    ]);
    for (const button of buttons) {
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).not.toHaveAttribute('aria-controls');
      expect(button.closest('td')).toHaveAttribute('data-service', 'detail');
    }
    expect(detailRows()).toHaveLength(0);
  });

  it('leaves the cell empty for a row that has no detail, and a key of such a row stays in the state', () => {
    const ref = createRef<DataGridHandle>();
    render(
      <Orders
        gridRef={ref}
        rowHasDetail={(row) => row.id !== 'DH-2'}
        defaultExpandedRows={['DH-2', 'DH-1']}
      />,
    );
    expect(screen.queryByRole('button', { name: /DH-2/ })).toBeNull();
    // The cell is there (the place stays), with nothing in it, and the detail of DH-2 is not drawn.
    expect(dataRows()[1]!.querySelector('[data-service="detail"]')?.children).toHaveLength(0);
    expect(detailRows().map((row) => row.textContent)).toEqual(['Lines of DH-1']);
    expect(ref.current?.getState().expandedRows).toEqual(['DH-2', 'DH-1']);
  });

  it('names a button after the row header, and after the key when it has no text', () => {
    render(<Orders columns={COLUMNS.map((column) => ({ ...column, rowHeader: false }))} />);
    expect(screen.getByRole('button', { name: 'Show details of DH-1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show details of DH 4 "x"' })).toBeInTheDocument();
  });

  it('looks for no detail row while the grid has no renderDetail', () => {
    // `rows.some` with a test for a detail row is the one scan of the list for one: it runs with details.
    const some = vi.spyOn(Array.prototype, 'some');
    const scans = () =>
      some.mock.calls.filter(([test]) => /['"]detail['"]/.test(String(test))).length;
    const { unmount } = render(<Orders renderDetail={undefined} />);
    expect(scans()).toBe(0);
    unmount();
    render(<Orders defaultExpandedRows={['DH-1']} />);
    expect(scans()).toBeGreaterThan(0);
  });

  it('takes any value but a function for no detail', () => {
    render(<Orders renderDetail={'detail' as never} />);
    expect(screen.queryByRole('button', { name: /details of/ })).toBeNull();
  });
});

describe('opening and closing a detail', () => {
  it('draws the detail row right after its master, and the button says so and points at it', () => {
    render(<Orders />);
    click(toggle('DH-2'));
    const rows = Array.from(table().tBodies[0]!.rows);
    expect(rows.map((row) => row.classList.contains('flg-data-grid-detail-row'))).toEqual([
      false,
      false,
      true,
      false,
      false,
    ]);
    const detail = detailRows()[0]!;
    expect(detail.textContent).toBe('Lines of DH-2');
    expect(rows[1]).toBe(dataRows()[1]);
    const button = toggle('DH-2');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-label', 'Hide details of DH-2');
    expect(button).toHaveAttribute('aria-controls', detail.id);
    expect(detail.id).not.toBe('');
    // The master row says nothing of being open: the button does.
    expect(rows[1]).not.toHaveAttribute('aria-expanded');
    click(button);
    expect(detailRows()).toHaveLength(0);
    expect(toggle('DH-2')).not.toHaveAttribute('aria-controls');
  });

  it('gives each detail an id that is one token, a key that holds spaces and quotes included', () => {
    render(<Orders defaultExpandedRows={['DH-1', 'DH 4 "x"']} />);
    const ids = detailRows().map((row) => row.id);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(id).not.toMatch(/\s|"/);
    expect(toggle('DH 4 "x"')).toHaveAttribute('aria-controls', ids[1]);
  });

  it('keeps the id of a detail across a render and a new order of the rows', () => {
    const { rerender } = render(<Orders defaultExpandedRows={['DH-1', 'DH-3']} />);
    const byRow = () =>
      Object.fromEntries(detailRows().map((row) => [row.textContent, row.id] as const));
    const before = byRow();
    rerender(<Orders defaultExpandedRows={['DH-1', 'DH-3']} />);
    expect(byRow()).toEqual(before);
    rerender(<Orders data={[...ORDERS].reverse()} defaultExpandedRows={['DH-1', 'DH-3']} />);
    expect(dataRows()[0]!.textContent).toContain('DH 4');
    expect(byRow()).toEqual(before);
  });

  it('keeps the id of a detail while another one opens and closes', () => {
    render(<Orders defaultExpandedRows={['DH-3']} />);
    const before = detailRows()[0]!.id;
    click(toggle('DH-1'));
    expect(detailRows().map((row) => row.textContent)).toEqual(['Lines of DH-1', 'Lines of DH-3']);
    expect(detailRows()[1]!.id).toBe(before);
    click(toggle('DH-1'));
    expect(detailRows()[0]!.id).toBe(before);
  });

  it('has a detail row of one cell that spans every column from the button on, with the content in it', () => {
    render(<Orders selectionMode="multiple" defaultExpandedRows={['DH-1']} />);
    const row = detailRows()[0]!;
    // The empty cell of the column of boxes, then one cell over the columns of the button, Order, Status and
    // Qty (and the filler column, when the grid has one).
    expect(row.cells[0]).toHaveClass('flg-data-grid-indent');
    expect(row.cells[0]).toHaveAttribute('aria-hidden', 'true');
    const cell = row.cells[1]!;
    expect(cell).toHaveClass('flg-data-grid-detail-cell');
    expect(Number(cell.getAttribute('colspan'))).toBeGreaterThanOrEqual(4);
    expect(cell.querySelector('.flg-data-grid-detail-content')?.textContent).toBe('Lines of DH-1');
    expect(cell).toHaveAttribute('tabindex');
  });

  it('draws the detail under a group, with an empty cell for each indent, and the level of its master', () => {
    render(<Orders grouping={BY_STATUS} defaultExpandedRows={['DH-3']} />);
    const row = detailRows()[0]!;
    // The one indent column of the grouping, then the cell over the rest.
    expect(row.cells).toHaveLength(2);
    expect(row.cells[0]).toHaveClass('flg-data-grid-indent');
    expect(row).toHaveAttribute('aria-level', '2');
    const rows = Array.from(table().tBodies[0]!.rows).map((tr) => tr.textContent);
    expect(rows.indexOf('Lines of DH-3')).toBe(
      rows.findIndex((text) => text?.startsWith('DH-3')) + 1,
    );
  });

  it('is one callback with the keys now, then onStateChange, for each press', () => {
    const calls: string[] = [];
    render(
      <Orders
        onExpandedRowsChange={(keys) => calls.push(`rows ${keys.join(',')}`)}
        onStateChange={(state, part) => calls.push(`state ${part} ${state.expandedRows.join(',')}`)}
      />,
    );
    click(toggle('DH-1'));
    click(toggle('DH-3'));
    click(toggle('DH-1'));
    expect(calls).toEqual([
      'rows DH-1',
      'state expandedRows DH-1',
      'rows DH-1,DH-3',
      'state expandedRows DH-1,DH-3',
      'rows DH-3',
      'state expandedRows DH-3',
    ]);
  });

  it('calls nothing from a render, nor for a value that comes from outside', () => {
    const onChange = vi.fn();
    const onState = vi.fn();
    const { rerender } = render(
      <Orders expandedRows={['DH-1']} onExpandedRowsChange={onChange} onStateChange={onState} />,
    );
    rerender(
      <Orders
        expandedRows={['DH-1', 'DH-2']}
        onExpandedRowsChange={onChange}
        onStateChange={onState}
      />,
    );
    expect(detailRows()).toHaveLength(2);
    expect(onChange).not.toHaveBeenCalled();
    expect(onState).not.toHaveBeenCalled();
  });

  it('leaves a controlled grid as the parent holds it, and sends the state it shows with the change on top', () => {
    const onChange = vi.fn();
    const onState = vi.fn();
    render(
      <Orders expandedRows={['DH-1']} onExpandedRowsChange={onChange} onStateChange={onState} />,
    );
    click(toggle('DH-2'));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['DH-1', 'DH-2']);
    const [state, part] = onState.mock.calls[0] as [DataGridState, string];
    expect(part).toBe('expandedRows');
    expect(state.expandedRows).toEqual(['DH-1', 'DH-2']);
    // The parent kept its value: nothing changed on the screen.
    expect(detailRows().map((row) => row.textContent)).toEqual(['Lines of DH-1']);
  });

  it('asks a controlled grid once for two presses of one event, the second against the first', () => {
    const onChange = vi.fn();
    render(<Orders expandedRows={[]} onExpandedRowsChange={onChange} />);
    const one = toggle('DH-1');
    act(() => {
      one.click();
      one.click();
    });
    // The second press closes what the first asked for: the parent hears both, each against the one before.
    expect(onChange.mock.calls).toEqual([[['DH-1']], [[]]]);
  });

  it('holds and returns the state as given: the keys of no row stay, in the order they were opened', () => {
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} defaultExpandedRows={['nobody', 'DH-3']} />);
    click(toggle('DH-1'));
    expect(ref.current?.getState().expandedRows).toEqual(['nobody', 'DH-3', 'DH-1']);
    expect(detailRows().map((row) => row.textContent)).toEqual(['Lines of DH-1', 'Lines of DH-3']);
  });

  it('opens the detail of a row that comes later, for a key held by defaultExpandedRows', () => {
    const { rerender } = render(
      <Orders data={ORDERS.slice(0, 1)} defaultExpandedRows={['DH-3']} />,
    );
    expect(detailRows()).toHaveLength(0);
    rerender(<Orders data={ORDERS} defaultExpandedRows={['DH-3']} />);
    expect(detailRows().map((row) => row.textContent)).toEqual(['Lines of DH-3']);
  });

  it('is a state change on a mounted grid: expandedRows from outside opens and closes', () => {
    function Controlled() {
      const [keys, setKeys] = useState<readonly DataGridKey[]>([]);
      return (
        <>
          <button type="button" onClick={() => setKeys(['DH-2'])}>
            open
          </button>
          <Orders expandedRows={keys} onExpandedRowsChange={setKeys} />
        </>
      );
    }
    render(<Controlled />);
    click(screen.getByRole('button', { name: 'open' }));
    expect(detailRows().map((row) => row.textContent)).toEqual(['Lines of DH-2']);
    click(toggle('DH-2'));
    expect(detailRows()).toHaveLength(0);
  });

  it('says what a state that is no list of keys is, once, and shows none open', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<Orders expandedRows={'DH-1' as never} />);
    expect(detailRows()).toHaveLength(0);
    expect(warn.mock.calls.some(([message]) => String(message).includes('expandedRows'))).toBe(
      true,
    );
  });
});

describe('the heading, the filter row and the footer of a grid with details', () => {
  it('has one title over the indents and the button, which is a place and holds the hidden words', () => {
    render(<Orders grouping={BY_STATUS} />);
    const head = table().tHead!.rows[0]!;
    expect(head.cells).toHaveLength(4);
    const merged = head.cells[0]!;
    expect(merged).toHaveAttribute('colspan', '2');
    expect(merged).toHaveTextContent('Groups and details');
    expect(merged).toHaveAttribute('scope', 'col');
    // A place of the keyboard: it is not an indent cell, which the keyboard skips.
    expect(merged).not.toHaveClass('flg-data-grid-indent');
    expect(merged).toHaveAttribute('tabindex');
  });

  it('has a title of its own for the button without a grouping', () => {
    render(<Orders />);
    const head = table().tHead!.rows[0]!;
    expect(head.cells[0]).toHaveTextContent('Groups and details');
    expect(head.cells[0]).not.toHaveAttribute('colspan', '2');
  });

  it('gives the filter row and the footer an empty cell for the button, a place of the keyboard', () => {
    render(
      <Orders
        filterRow
        summary={{ total: [{ column: 'qty', type: 'sum' }] }}
        grouping={BY_STATUS}
      />,
    );
    const filter = table().tHead!.rows[1]!;
    // One indent cell, then the cell of the button, Order, Status and Qty.
    expect(filter.cells[0]).toHaveClass('flg-data-grid-indent');
    expect(filter.cells[1]).toHaveAttribute('data-service', 'detail');
    const foot = table().tFoot!.rows[0]!;
    expect(foot.cells[0]).toHaveClass('flg-data-grid-indent');
    expect(foot.cells[1]).toHaveClass('flg-data-grid-foot-cell');
    expect(foot.cells[1]!.textContent).toBe('');
  });
});

describe('the keys of the button', () => {
  it("is the cell's one control: the Tab stop while its cell is the active one, and the cell never is", () => {
    render(<Orders />);
    // The first cell of the first row is the active one at the start: the button of the first column.
    const button = toggle('DH-1');
    expect(button).toHaveAttribute('tabindex', '0');
    expect(toggle('DH-2')).toHaveAttribute('tabindex', '-1');
    expect(button.closest('td')).toHaveAttribute('tabindex', '-1');
    expect(stops()).toEqual([button]);
    focusOn(toggle('DH-2'));
    expect(toggle('DH-2')).toHaveAttribute('tabindex', '0');
    expect(button).toHaveAttribute('tabindex', '-1');
    expect(stops()).toEqual([toggle('DH-2')]);
  });

  it("Enter presses it, and Space is the button's: it chooses no row", () => {
    render(<Orders selectionMode="multiple" />);
    const button = toggle('DH-1');
    focusOn(button);
    expect(press(button, 'Enter')).toBe(true);
    expect(detailRows()).toHaveLength(1);
    // Space is not cancelled on the button (the browser presses it on keyup), and no row is chosen.
    expect(press(button, ' ')).toBe(false);
    expect(dataRows()[0]).not.toHaveAttribute('data-selected');
    // On another cell of the row Space chooses the row, as it did.
    const cell = dataRows()[0]!.querySelectorAll('td, th');
    const order = Array.from(cell).find((c) => c.textContent === 'DH-1') as HTMLElement;
    focusOn(order);
    expect(press(order, ' ')).toBe(true);
    expect(dataRows()[0]).toHaveAttribute('data-selected');
  });

  it('is pressed once by a click, and the press chooses nothing and activates nothing', () => {
    const onActivate = vi.fn();
    render(<Orders selectionMode="single" onRowActivate={onActivate} />);
    click(toggle('DH-2'));
    expect(detailRows()).toHaveLength(1);
    expect(dataRows()[1]).not.toHaveAttribute('data-selected');
    fireEvent.doubleClick(toggle('DH-2'));
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('keeps the focus on the button while it opens and closes the detail', () => {
    render(<Orders />);
    const button = toggle('DH-1');
    focusOn(button);
    click(button);
    expect(document.activeElement).toBe(toggle('DH-1'));
    expect(toggle('DH-1')).toBe(button);
    click(button);
    expect(document.activeElement).toBe(button);
  });
});

describe('the detail row as a place of the keyboard', () => {
  const link = (row: Order) => (
    <p>
      <a href="#x">{`Open ${row.id}`}</a> <button type="button">{`Print ${row.id}`}</button>
    </p>
  );
  const detailCell = () =>
    detailRows()[0]!.querySelector<HTMLElement>('.flg-data-grid-detail-cell')!;

  it('is reached by ↓ from its master, at the column the place remembers, and ↑ goes back to it', () => {
    render(<Orders renderDetail={link} defaultExpandedRows={['DH-1']} />);
    const status = dataRows()[0]!.cells[2]!;
    focusOn(status);
    expect(press(status, 'ArrowDown')).toBe(true);
    expect(document.activeElement).toBe(detailCell());
    expect(detailCell()).toHaveAttribute('tabindex', '0');
    expect(stops()).toEqual([detailCell()]);
    expect(press(detailCell(), 'ArrowDown')).toBe(true);
    // The next row, in the column that was remembered through the detail.
    expect(document.activeElement).toBe(dataRows()[1]!.cells[2]);
    press(document.activeElement as HTMLElement, 'ArrowUp');
    expect(document.activeElement).toBe(detailCell());
    press(detailCell(), 'ArrowUp');
    expect(document.activeElement).toBe(dataRows()[0]!.cells[2]);
  });

  it('cancels the keys that move along a row, and leaves the place where it is', () => {
    render(<Orders renderDetail={link} defaultExpandedRows={['DH-1']} />);
    const status = dataRows()[0]!.cells[2]!;
    focusOn(status);
    press(status, 'ArrowDown');
    for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End', ' ']) {
      expect(press(detailCell(), key), key).toBe(true);
      expect(document.activeElement, key).toBe(detailCell());
    }
  });

  it('goes into its first control on Enter and F2, cycles its controls on Tab, and comes back on Esc and F2', () => {
    render(<Orders renderDetail={link} defaultExpandedRows={['DH-1']} />);
    focusOn(detailCell());
    const anchor = screen.getByRole('link', { name: 'Open DH-1' });
    const print = screen.getByRole('button', { name: 'Print DH-1' });
    expect(press(detailCell(), 'Enter')).toBe(true);
    expect(document.activeElement).toBe(anchor);
    press(anchor, 'Tab');
    expect(document.activeElement).toBe(print);
    press(print, 'Tab');
    expect(document.activeElement).toBe(anchor);
    press(anchor, 'Tab', { shiftKey: true });
    expect(document.activeElement).toBe(print);
    press(print, 'Escape');
    expect(document.activeElement).toBe(detailCell());
    press(detailCell(), 'F2');
    expect(document.activeElement).toBe(anchor);
    press(anchor, 'F2');
    expect(document.activeElement).toBe(detailCell());
  });

  it('does nothing on Enter when it holds no control, and activates no row', () => {
    const onActivate = vi.fn();
    render(<Orders onRowActivate={onActivate} defaultExpandedRows={['DH-1']} />);
    focusOn(detailCell());
    expect(press(detailCell(), 'Enter')).toBe(false);
    expect(document.activeElement).toBe(detailCell());
    expect(onActivate).not.toHaveBeenCalled();
  });

  it("keeps the grid's one Tab stop: the controls of a detail are out of the Tab order", () => {
    render(<Orders renderDetail={link} defaultExpandedRows={['DH-1']} />);
    expect(screen.getByRole('link', { name: 'Open DH-1' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('button', { name: 'Print DH-1' })).toHaveAttribute('tabindex', '-1');
    expect(stops()).toHaveLength(1);
  });

  it('lets go of a control the detail draws on its own, after the grid has committed', async () => {
    function Late(): ReactNode {
      const [loaded, setLoaded] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setLoaded(true)}>
            Load
          </button>
          {loaded ? <a href="#late">Late link</a> : null}
        </div>
      );
    }
    render(<Orders renderDetail={() => <Late />} defaultExpandedRows={['DH-1']} />);
    click(screen.getByRole('button', { name: 'Load' }));
    const late = await screen.findByRole('link', { name: 'Late link' });
    // The observer of the bodies is on, as it is for a column that draws its own cells.
    await vi.waitFor(() => expect(late).toHaveAttribute('tabindex', '-1'));
    expect(stops()).toHaveLength(1);
  });

  it('gives the place to its master, at the same column, when its detail closes under the focus', () => {
    function Holder() {
      const [keys, setKeys] = useState<readonly DataGridKey[]>(['DH-1']);
      return (
        <>
          <button type="button" onClick={() => setKeys([])}>
            close
          </button>
          <Orders expandedRows={keys} onExpandedRowsChange={setKeys} />
        </>
      );
    }
    render(<Holder />);
    const status = dataRows()[0]!.cells[2]!;
    focusOn(status);
    press(status, 'ArrowDown');
    expect(document.activeElement).toBe(detailCell());
    click(screen.getByRole('button', { name: 'close' }));
    expect(detailRows()).toHaveLength(0);
    expect(stops()).toEqual([dataRows()[0]!.cells[2]]);
  });

  it('is a press that makes it the place, with the column kept', () => {
    render(<Orders defaultExpandedRows={['DH-2']} />);
    const qty = dataRows()[0]!.cells[3]!;
    focusOn(qty);
    fireEvent.mouseDown(detailCell());
    act(() => detailCell().focus());
    expect(stops()).toEqual([detailCell()]);
    press(detailCell(), 'ArrowUp');
    expect(document.activeElement).toBe(dataRows()[1]!.cells[3]);
  });
});

describe('scrolling, pages and server mode with details', () => {
  it('scrolls as usual with scrolling="virtual", and says so once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<Orders scrolling="virtual" height={300} defaultExpandedRows={['DH-1']} />);
    expect(table().closest('[data-virtual]')).toBeNull();
    expect(table().tBodies[0]!.querySelectorAll('.flg-data-grid-spacer')).toHaveLength(0);
    expect(detailRows()).toHaveLength(1);
    const said = warn.mock.calls.filter(([message]) => String(message).includes('renderDetail'));
    expect(said).toHaveLength(1);
    expect(said[0]![0]).toContain('scrolling="virtual" with renderDetail');
    expect(table()).not.toHaveAttribute('aria-rowcount');
  });

  it('keeps a detail with its master on a page, and counts it as no row', () => {
    render(
      <Orders paging={{ pageSize: 2, pageSizes: [2] }} defaultExpandedRows={['DH-2', 'DH-3']} />,
    );
    expect(dataRows().map((row) => row.cells[1]!.textContent)).toEqual(['DH-1', 'DH-2']);
    expect(detailRows().map((row) => row.textContent)).toEqual(['Lines of DH-2']);
    expect(screen.getByText(/1.2 of 4|1–2 of 4/)).toBeInTheDocument();
  });

  it('works on the page in server mode, with the keys the server rows have', () => {
    render(
      <Orders
        remote
        totalCount={40}
        paging={{ pageSize: 4, pageSizes: [4] }}
        defaultExpandedRows={['DH-2']}
      />,
    );
    expect(detailRows().map((row) => row.textContent)).toEqual(['Lines of DH-2']);
    click(toggle('DH-1'));
    expect(detailRows()).toHaveLength(2);
  });
});

describe('what is said of the functions the grid reads for every row', () => {
  const warnings = (warn: { mock: { calls: unknown[][] } }, word: string) =>
    warn.mock.calls.filter(([message]) => String(message).includes(word)).length;

  it('warns once when renderDetail is a new function on three commits running, and not for a stable one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = render(<Orders renderDetail={(row) => <i>{row.id}</i>} />);
    for (let i = 0; i < 4; i++) rerender(<Orders renderDetail={(row) => <i>{row.id}</i>} />);
    expect(warnings(warn, 'renderDetail is a new function')).toBe(1);
    warn.mockClear();
    resetDevWarnings();
    const stable = (row: Order) => <i>{row.id}</i>;
    for (let i = 0; i < 5; i++) rerender(<Orders renderDetail={stable} />);
    expect(warnings(warn, 'renderDetail is a new function')).toBe(0);
  });

  it('renders and warns once for a rowHasDetail that is false, as `cond && fn` gives, with a detail open', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<Orders rowHasDetail={false as never} defaultExpandedRows={['DH-1']} />);
    // No function: every row has a detail, as with none given.
    expect(detailRows()).toHaveLength(1);
    expect(toggle('DH-2')).toBeInTheDocument();
    expect(warnings(warn, 'rowHasDetail is not a function')).toBe(1);
  });

  it('renders and warns once for a rowHasDetail that is truthy but no function', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = render(<Orders rowHasDetail={'yes' as never} />);
    rerender(<Orders rowHasDetail={'yes' as never} />);
    expect(toggle('DH-1')).toBeInTheDocument();
    expect(warnings(warn, 'rowHasDetail is not a function')).toBe(1);
  });

  it('warns once for a renderDetail that is defined and no function, and draws no detail', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<Orders renderDetail={false as never} defaultExpandedRows={['DH-1']} />);
    expect(screen.queryByRole('button', { name: /details of/ })).toBeNull();
    expect(detailRows()).toHaveLength(0);
    expect(warnings(warn, 'renderDetail is not a function')).toBe(1);
  });

  it('says nothing for a renderDetail or a rowHasDetail that is not given', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<Orders renderDetail={undefined} rowHasDetail={undefined} />);
    expect(warnings(warn, 'is not a function')).toBe(0);
  });

  it('warns the same for rowHasDetail', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = render(<Orders rowHasDetail={() => true} />);
    for (let i = 0; i < 4; i++) rerender(<Orders rowHasDetail={() => true} />);
    expect(warnings(warn, 'rowHasDetail is a new function')).toBe(1);
  });
});
