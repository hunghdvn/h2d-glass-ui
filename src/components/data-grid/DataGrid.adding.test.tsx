import { act, createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import type { Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
import { FILTER_ANNOUNCE_DELAY } from './hooks/use-rows-found';
import { SEARCH_DELAY } from './parts/SearchBox';
import { DataGrid } from './DataGrid';
import type {
  DataGridChange,
  DataGridColumn,
  DataGridEditing,
  DataGridHandle,
  DataGridProps,
} from './index';

// Adding rows (spec phase 6 §6.3 "Thêm dòng", §4.3 E2 "Dòng mới", §3.5 step 2): the button and `addRow()`, the key
// of a new row, where it stands, what it is not counted by and not chosen by, the marks, and what each mode does
// with it. What needs a layout engine (the focus in a real browser, the look) is proven in the stories.

let showing: Set<Element>;
beforeEach(() => {
  resetDevWarnings();
  showing = new Set();
  HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
    showing.add(this);
  };
  HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
    showing.delete(this);
  };
  Element.prototype.scrollIntoView = () => {};
  const matches = Element.prototype.matches;
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
    this: Element,
    selector: string,
  ) {
    return selector === ':popover-open' ? showing.has(this) : matches.call(this, selector);
  });
  HTMLElement.prototype.checkVisibility = () => true;
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
  Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  vi.restoreAllMocks();
});

interface Order {
  id: string;
  customer: string;
  status: number | null;
  qty: number | null;
  price: number;
  note: string;
}

const STATUSES = [
  { id: 1, name: 'New' },
  { id: 2, name: 'Processing' },
];

const ORDERS: Order[] = [
  { id: 'DH-1', customer: 'An', status: 1, qty: 3, price: 10, note: 'x' },
  { id: 'DH-2', customer: 'Bình', status: 2, qty: 5, price: 20, note: 'x' },
  { id: 'DH-3', customer: 'Chi', status: 1, qty: 1, price: 30, note: 'y' },
  { id: 'DH-4', customer: 'Dung', status: 2, qty: 7, price: 40, note: 'y' },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, allowEditing: false, width: 100 },
  { field: 'customer', caption: 'Customer', width: 140 },
  {
    field: 'status',
    caption: 'Status',
    width: 140,
    lookup: { items: STATUSES, valueField: 'id', displayField: 'name' },
  },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 100 },
  {
    id: 'total',
    caption: 'Total',
    dataType: 'number',
    width: 100,
    value: (row) => row.price * (row.qty ?? 0),
  },
];

const REQUIRED: DataGridColumn<Order>[] = COLUMNS.map((column) =>
  'field' in column && column.field === 'customer'
    ? { ...column, validationRules: [{ type: 'required' as const }] }
    : column,
);

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
      editing={{ mode: 'row', allowAdding: true }}
      onSaving={() => {}}
      {...props}
    />
  );
}
const ROW_MODE: DataGridEditing<Order> = { mode: 'row', allowAdding: true };
const CELL_MODE: DataGridEditing<Order> = { mode: 'cell', allowAdding: true };

const table = () => document.querySelector<HTMLTableElement>('table[role]')!;
const dataRows = () =>
  Array.from(table().querySelectorAll<HTMLTableRowElement>('tbody > tr.flg-data-grid-row'));
const newRows = () => dataRows().filter((row) => row.hasAttribute('data-new'));
const idsShown = () => dataRows().map((row) => row.children[0]!.textContent);
const addButton = () => screen.queryByRole('button', { name: 'Add row' });
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
const focusOn = (element: HTMLElement) => act(() => element.focus());
const editedRow = () => table().querySelector<HTMLTableRowElement>('tr[data-editing]');
const input = (label: string) => within(table()).getByLabelText(label) as HTMLInputElement;
const type = (label: string, text: string) =>
  act(() => void fireEvent.change(input(label), { target: { value: text } }));
const cellOf = (row: HTMLElement, caption: string): HTMLElement => {
  const heads = Array.from(table().querySelectorAll('thead th')).map((head) => head.textContent);
  return Array.from(row.querySelectorAll<HTMLElement>(':scope > td, :scope > th')).filter(
    (cell) => !cell.classList.contains('flg-data-grid-filler'),
  )[heads.filter((head) => head !== '').indexOf(caption)]!;
};
const live = () =>
  Array.from(
    document.querySelectorAll('[aria-live="polite"]'),
    (region) => region.textContent,
  ).join(' ');
const sentAt = (spy: ReturnType<typeof vi.fn>, call = 0): DataGridChange<Order>[] =>
  spy.mock.calls[call]![0] as DataGridChange<Order>[];
const tick = () => act(async () => void (await new Promise((done) => setTimeout(done, 0))));
/** A promise the test settles. */
function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
/** Adds a row through the button. */
const add = () => click(addButton()!);

describe('the button', () => {
  it('is in the toolbar, last, after the search and the column chooser, and says "Add row"', () => {
    render(<Orders searchPanel columnChooser />);
    const buttons = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.flg-data-grid-toolbar button, .flg-data-grid-toolbar input',
      ),
    );
    expect(buttons.at(-1)).toBe(addButton());
    expect(addButton()).toHaveAttribute('data-variant', 'primary');
    expect(addButton()).toHaveAttribute('data-size', 'md');
    expect(addButton()!.querySelector('svg')).not.toBeNull();
  });

  it('is not there without allowAdding, or without editing, and a toolbar function gets null', () => {
    const items = vi.fn(() => null);
    const { rerender } = render(<Orders editing={{ mode: 'row' }} toolbar={items} />);
    expect(addButton()).toBeNull();
    expect(items).toHaveBeenLastCalledWith(expect.objectContaining({ addButton: null }));
    rerender(<Orders editing={undefined} />);
    expect(addButton()).toBeNull();
    rerender(<Orders editing={{ mode: 'row', allowAdding: 'yes' as unknown as boolean }} />);
    expect(addButton()).toBeNull();
  });

  it('is an item a toolbar function places as it likes', () => {
    render(
      <Orders
        toolbar={(items) => (
          <>
            {items.addButton}
            {items.spacer}
          </>
        )}
      />,
    );
    expect(addButton()).not.toBeNull();
    expect(addButton()!.closest('.flg-data-grid-toolbar')).not.toBeNull();
  });

  it('can be named by the labels', () => {
    render(<Orders labels={{ addRow: 'New order' }} />);
    expect(screen.getByRole('button', { name: 'New order' })).toBeInTheDocument();
  });
});

describe('a new row in row mode', () => {
  it('opens in edit mode with the focus in its first editor, marked new, and is announced', async () => {
    render(<Orders />);
    add();
    expect(newRows()).toHaveLength(1);
    expect(editedRow()).toBe(newRows()[0]);
    expect(input('Customer')).toHaveFocus();
    expect(newRows()[0]!.hasAttribute('data-new')).toBe(true);
    await tick();
    expect(live()).toContain('Row added');
  });

  it('is sent by ✓ as one insert with the fields initNewRow gave and the ones that were set', () => {
    const onSaving = vi.fn();
    const initNewRow = vi.fn(() => ({ status: 2, note: 'first' }));
    render(<Orders onSaving={onSaving} initNewRow={initNewRow} />);
    add();
    type('Customer', 'Hoa');
    click(screen.getByRole('button', { name: 'Save (new)' }));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sentAt(onSaving)).toEqual([
      { type: 'insert', key: 'flg-new-1', data: { status: 2, note: 'first', customer: 'Hoa' } },
    ]);
    expect(newRows()).toHaveLength(0);
    expect(editedRow()).toBeNull();
  });

  it('is sent by Enter, and an untouched one is sent too: the user asked to add it', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    add();
    press(input('Customer'), 'Enter');
    expect(sentAt(onSaving)).toEqual([{ type: 'insert', key: 'flg-new-1', data: {} }]);
  });

  it('is given up by ✕ and by Esc: nothing is sent and the row is gone', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    add();
    click(screen.getByRole('button', { name: 'Cancel editing (new)' }));
    expect(newRows()).toHaveLength(0);
    add();
    expect(newRows()).toHaveLength(1);
    press(input('Customer'), 'Escape');
    expect(newRows()).toHaveLength(0);
    expect(onSaving).not.toHaveBeenCalled();
  });

  it('puts the focus on the place of the grid when it goes, never on the body', () => {
    render(<Orders />);
    focusOn(cellOf(dataRows()[1]!, 'Customer'));
    add();
    press(input('Customer'), 'Escape');
    expect(document.activeElement).not.toBe(document.body);
    expect(table().contains(document.activeElement)).toBe(true);
  });

  it('does not send a new row whose fields fail their rules: the first is focused and marked', () => {
    const onSaving = vi.fn();
    render(<Orders columns={REQUIRED} onSaving={onSaving} />);
    add();
    click(screen.getByRole('button', { name: 'Save (new)' }));
    expect(onSaving).not.toHaveBeenCalled();
    expect(editedRow()).toBe(newRows()[0]);
    expect(cellOf(newRows()[0]!, 'Customer')).toHaveAttribute('data-invalid');
    expect(input('Customer')).toHaveFocus();
  });

  it('keeps the row, with the alert, when the save is refused, and goes when it is answered', async () => {
    const first = deferred();
    const onSaving = vi.fn().mockReturnValueOnce(first.promise);
    render(<Orders onSaving={onSaving} />);
    add();
    type('Customer', 'Hoa');
    click(screen.getByRole('button', { name: 'Save (new)' }));
    expect(newRows()).toHaveLength(1);
    expect(table()).toHaveAttribute('aria-busy', 'true');
    await act(async () => first.reject(new Error('no')));
    expect(newRows()).toHaveLength(1);
    expect(editedRow()).toBe(newRows()[0]);
    expect(document.querySelector('.flg-data-grid [role="alert"]')).not.toBeNull();
    // It can be sent again, and the fields typed are still there.
    expect(input('Customer').value).toBe('Hoa');
    const second = deferred();
    onSaving.mockReturnValueOnce(second.promise);
    click(screen.getByRole('button', { name: 'Save (new)' }));
    expect(sentAt(onSaving, 1)).toEqual([
      { type: 'insert', key: 'flg-new-1', data: { customer: 'Hoa' } },
    ]);
    await act(async () => second.resolve());
    expect(newRows()).toHaveLength(0);
  });

  it('draws the column of buttons for a grid that only adds, with ✓ and ✕ in it', () => {
    render(<Orders editing={{ mode: 'row', allowAdding: true, allowUpdating: false }} />);
    expect(table().querySelector('.flg-data-grid-actions')).not.toBeNull();
    add();
    expect(screen.getByRole('button', { name: 'Save (new)' })).toBeInTheDocument();
  });

  it('saves the row being edited first, and adds none when that save does not go through', () => {
    const onSaving = vi.fn();
    render(<Orders columns={REQUIRED} onSaving={onSaving} />);
    click(screen.getByRole('button', { name: 'Edit DH-1' }));
    type('Customer', 'Hoa');
    add();
    expect(sentAt(onSaving)).toMatchObject([{ type: 'update', key: 'DH-1' }]);
    expect(newRows()).toHaveLength(1);
    // The row being edited has a change that fails: it is not saved, and no row is added.
    press(input('Customer'), 'Escape');
    click(screen.getByRole('button', { name: 'Edit DH-2' }));
    type('Customer', '');
    add();
    expect(newRows()).toHaveLength(0);
    expect(editedRow()).toBe(dataRows()[1]);
  });

  it('does nothing while a save is pending', async () => {
    const first = deferred();
    render(<Orders onSaving={() => first.promise} />);
    add();
    type('Customer', 'Hoa');
    click(screen.getByRole('button', { name: 'Save (new)' }));
    add();
    expect(newRows()).toHaveLength(1);
    await act(async () => first.resolve());
  });
});

describe('addRow()', () => {
  it('is the handle method the button calls, and does nothing without allowAdding', () => {
    const ref = createRef<DataGridHandle>();
    const { rerender } = render(<Orders gridRef={ref} />);
    act(() => ref.current!.addRow());
    expect(newRows()).toHaveLength(1);
    press(input('Customer'), 'Escape');
    rerender(<Orders gridRef={ref} editing={{ mode: 'row' }} />);
    expect(newRows()).toHaveLength(0);
    act(() => ref.current!.addRow());
    expect(newRows()).toHaveLength(0);
    expect(editedRow()).toBeNull();
  });

  it('keeps the handle the same object', () => {
    const ref = createRef<DataGridHandle>();
    const { rerender } = render(<Orders gridRef={ref} />);
    const handle = ref.current;
    rerender(<Orders gridRef={ref} editing={{ mode: 'row', allowAdding: true }} />);
    expect(ref.current).toBe(handle);
  });
});

describe('initNewRow', () => {
  it('is read when a row is added, once for each row, and never at mount', () => {
    const initNewRow = vi.fn(() => ({ note: 'n' }));
    const { rerender } = render(<Orders initNewRow={initNewRow} />);
    expect(initNewRow).not.toHaveBeenCalled();
    add();
    expect(initNewRow).toHaveBeenCalledTimes(1);
    type('Customer', 'x');
    expect(initNewRow).toHaveBeenCalledTimes(1);
    press(input('Customer'), 'Escape');
    // A function written anew is the one read at the next add, with what the app knows by then.
    const later = vi.fn(() => ({ note: 'later' }));
    rerender(<Orders initNewRow={later} />);
    expect(initNewRow).toHaveBeenCalledTimes(1);
    expect(later).not.toHaveBeenCalled();
    add();
    expect(later).toHaveBeenCalledTimes(1);
    expect(initNewRow).toHaveBeenCalledTimes(1);
  });

  it('starts the row empty and warns once when it throws, and when it gives no object', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onSaving = vi.fn();
    render(
      <Orders
        onSaving={onSaving}
        initNewRow={() => {
          throw new Error('boom');
        }}
      />,
    );
    add();
    press(input('Customer'), 'Escape');
    add();
    press(input('Customer'), 'Enter');
    expect(sentAt(onSaving)).toEqual([{ type: 'insert', key: 'flg-new-2', data: {} }]);
    const said = warn.mock.calls.filter((call) => String(call[0]).includes('initNewRow'));
    expect(said).toHaveLength(1);
    expect(said[0]![0]).toContain(WARN_PREFIX);
  });

  it('shows what it gave in the cells of the new row', () => {
    render(<Orders initNewRow={() => ({ customer: 'Preset', qty: 4, price: 5 })} />);
    add();
    expect(input('Customer').value).toBe('Preset');
    expect(cellOf(newRows()[0]!, 'Total')).toHaveTextContent('20');
  });
});

describe('the key of a new row', () => {
  it('is flg-new-N from a counter of the grid, and never given twice', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    add();
    press(input('Customer'), 'Escape');
    add();
    press(input('Customer'), 'Enter');
    add();
    press(input('Customer'), 'Enter');
    expect(sentAt(onSaving, 0)[0]!.key).toBe('flg-new-2');
    expect(sentAt(onSaving, 1)[0]!.key).toBe('flg-new-3');
  });

  it('takes the next free number, and warns once, when a row of the data has the key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onSaving = vi.fn();
    const data = [...ORDERS, { ...ORDERS[0]!, id: 'flg-new-1' }];
    render(<Orders data={data} onSaving={onSaving} />);
    add();
    press(input('Customer'), 'Enter');
    expect(sentAt(onSaving)[0]!.key).toBe('flg-new-2');
    add();
    press(input('Customer'), 'Enter');
    expect(sentAt(onSaving, 1)[0]!.key).toBe('flg-new-3');
    expect(warn.mock.calls.filter((call) => String(call[0]).includes('flg-new'))).toHaveLength(1);
  });

  it('is never in the chosen keys', () => {
    const onSelectedKeysChange = vi.fn();
    render(<Orders selectionMode="multiple" onSelectedKeysChange={onSelectedKeysChange} />);
    add();
    // Choosing every row takes the rows of the data, and none that is new.
    click(screen.getByRole('checkbox', { name: 'Select all rows on this page' }));
    expect(onSelectedKeysChange).toHaveBeenLastCalledWith(['DH-1', 'DH-2', 'DH-3', 'DH-4']);
  });
});

describe('where a new row stands', () => {
  it('is first by default, and last with newRowPosition', () => {
    const { rerender } = render(<Orders />);
    add();
    expect(idsShown()[0]).toContain('(new)');
    expect(idsShown()).toHaveLength(5);
    rerender(<Orders editing={{ mode: 'row', allowAdding: true, newRowPosition: 'last' }} />);
    expect(idsShown().at(-1)).toContain('(new)');
    expect(idsShown()[0]).toBe('DH-1');
  });

  it('stays through a sort, a search and a filter, outside every group', () => {
    render(
      <Orders
        searchPanel
        defaultSort={[{ field: 'customer', direction: 'desc' }]}
        defaultFilter={{ search: 'zzz' }}
      />,
    );
    add();
    expect(newRows()).toHaveLength(1);
    expect(dataRows()).toHaveLength(1);
  });

  it('stays first in a sorted grid, and the rows keep their order under it', () => {
    render(<Orders defaultSort={[{ field: 'customer', direction: 'desc' }]} />);
    add();
    expect(idsShown()[0]).toContain('(new)');
    expect(idsShown().slice(1)).toEqual(['DH-4', 'DH-3', 'DH-2', 'DH-1']);
  });

  it('is outside the groups at the top of a grouped grid', () => {
    render(
      <Orders
        columns={[...COLUMNS, { field: 'note', caption: 'Note', width: 80 }]}
        defaultGrouping={[{ field: 'note', direction: 'asc' }]}
        autoExpandAll
      />,
    );
    add();
    const rows = Array.from(table().querySelectorAll('tbody > tr'));
    expect(rows[0]).toBe(newRows()[0]);
    expect(rows[1]!.classList.contains('flg-data-grid-group-row')).toBe(true);
  });

  it('is on every page, before its rows or after them, and no page counts it', () => {
    const many = Array.from({ length: 12 }, (_, index) => ({
      ...ORDERS[0]!,
      id: `DH-${100 + index}`,
    }));
    const { rerender } = render(<Orders data={many} paging={{ pageSize: 5, pageSizes: [5] }} />);
    const info = () => document.querySelector('.flg-data-grid-page-info')?.textContent;
    expect(info()).toBe('1–5 of 12');
    add();
    expect(info()).toBe('1–5 of 12');
    expect(dataRows()).toHaveLength(6);
    expect(newRows()[0]).toBe(dataRows()[0]);
    click(screen.getByRole('button', { name: 'Page 2' }));
    expect(newRows()).toHaveLength(1);
    expect(info()).toBe('6–10 of 12');
    rerender(
      <Orders
        data={many}
        paging={{ pageSize: 5, pageSizes: [5] }}
        editing={{ mode: 'row', allowAdding: true, newRowPosition: 'last' }}
      />,
    );
    expect(dataRows().at(-1)).toBe(newRows()[0]);
  });
});

describe('what a new row is left out of (isSavedRow)', () => {
  it('is not counted by "rows found"', async () => {
    vi.useFakeTimers();
    try {
      render(<Orders searchPanel />);
      add();
      act(() => {
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'chi' } });
      });
      act(() => void vi.advanceTimersByTime(SEARCH_DELAY));
      act(() => void vi.advanceTimersByTime(FILTER_ANNOUNCE_DELAY));
      // The sentence counts the rows of the data that the search found, and not the new row that is shown.
      expect(live()).toBe('1 row');
      expect(dataRows()).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('has no box, no handle and no toggle: their cells are empty, and places of the keyboard', () => {
    render(
      <Orders
        selectionMode="multiple"
        rowReorder
        onRowReorder={() => {}}
        renderDetail={() => <span>detail</span>}
      />,
    );
    add();
    const row = newRows()[0]!;
    const services = Array.from(row.querySelectorAll<HTMLElement>('td[data-service]'));
    expect(services.map((cell) => cell.getAttribute('data-service'))).toEqual([
      'select',
      'drag',
      'detail',
    ]);
    for (const cell of services) {
      expect(cell.querySelector('input, button')).toBeNull();
      expect(cell.textContent).toBe('');
    }
    // The saved rows keep theirs.
    expect(
      dataRows()[1]!.querySelectorAll('td[data-service] input, td[data-service] button').length,
    ).toBe(3);
  });

  it('cannot be chosen: not by a press, not by Space, not by select all, not by a range', () => {
    const onSelectedKeysChange = vi.fn();
    render(
      <Orders
        selectionMode="multiple"
        onSelectedKeysChange={onSelectedKeysChange}
        columns={COLUMNS.map((column) => ({ ...column, allowEditing: false }))}
        editing={{ mode: 'row', allowAdding: true }}
      />,
    );
    add();
    const row = newRows()[0]!;
    expect(row).not.toHaveAttribute('aria-selected', 'true');
    // The press on a cell of the row is the row's press: it chooses a saved row, never a new one.
    fireEvent.click(cellOf(row, 'Customer'), { shiftKey: true, detail: 1 });
    focusOn(cellOf(row, 'Customer'));
    press(cellOf(row, 'Customer'), ' ');
    expect(onSelectedKeysChange).not.toHaveBeenCalled();
    click(screen.getByRole('checkbox', { name: 'Select all rows on this page' }));
    expect(onSelectedKeysChange).toHaveBeenCalledTimes(1);
    expect(onSelectedKeysChange.mock.calls[0]![0]).not.toContain('flg-new-1');
  });

  it('is not in a range of a selection by Shift, though it stands between the rows of two pages', () => {
    // A new row stands at the top of the page that is shown, which in the whole list of rows is between the rows of
    // the page before and the rows of this one: the range from a row of page 1 to a row of page 2 crosses it.
    const onSelectedKeysChange = vi.fn();
    render(
      <Orders
        selectionMode="multiple"
        onSelectedKeysChange={onSelectedKeysChange}
        paging={{ pageSize: 2, pageSizes: [2] }}
        editing={{ mode: 'row', allowAdding: true }}
      />,
    );
    click(screen.getByRole('checkbox', { name: 'Select DH-1' }));
    click(screen.getByRole('button', { name: 'Next page' }));
    add();
    expect(newRows()).toHaveLength(1);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select DH-4' }), { shiftKey: true });
    const chosen = onSelectedKeysChange.mock.calls.at(-1)![0] as string[];
    expect([...chosen].sort()).toEqual(['DH-1', 'DH-2', 'DH-3', 'DH-4']);
  });

  it('is not chosen by mod+A, which chooses the saved rows of the page', () => {
    const onSelectedKeysChange = vi.fn();
    render(
      <Orders
        selectionMode="multiple"
        onSelectedKeysChange={onSelectedKeysChange}
        columns={COLUMNS.map((column) => ({ ...column, allowEditing: false }))}
        editing={{ mode: 'row', allowAdding: true }}
      />,
    );
    add();
    const [row] = newRows();
    focusOn(cellOf(row!, 'Customer'));
    expect(press(cellOf(row!, 'Customer'), 'a', { ctrlKey: true })).toBe(true);
    expect(onSelectedKeysChange).toHaveBeenCalledTimes(1);
    expect(onSelectedKeysChange.mock.calls[0]![0]).toEqual(ORDERS.map((order) => order.id));
    expect(row).not.toHaveAttribute('aria-selected', 'true');
  });

  it('is not activated: not by Enter, not by a double press', () => {
    const onRowActivate = vi.fn();
    render(
      <Orders
        onRowActivate={onRowActivate}
        editing={{ mode: 'cell', allowAdding: true, allowUpdating: false }}
        columns={COLUMNS.map((column) => ({ ...column, allowEditing: false }))}
      />,
    );
    add();
    const row = newRows()[0]!;
    focusOn(cellOf(row, 'Customer'));
    press(cellOf(row, 'Customer'), 'Enter');
    act(() => void fireEvent.doubleClick(cellOf(row, 'Customer')));
    expect(onRowActivate).not.toHaveBeenCalled();
    // A saved row still is: the place leaving the new row, which was given nothing, drops it.
    const saved = () => dataRows().filter((one) => !one.hasAttribute('data-new'));
    focusOn(cellOf(saved()[0]!, 'Customer'));
    press(cellOf(saved()[0]!, 'Customer'), 'Enter');
    expect(onRowActivate).toHaveBeenCalledTimes(1);
    expect(onRowActivate).toHaveBeenCalledWith(ORDERS[0], 'DH-1');
  });

  it('cannot be moved by a key, and has no handle to drag by', () => {
    const onRowReorder = vi.fn();
    render(<Orders rowReorder onRowReorder={onRowReorder} />);
    add();
    const row = newRows()[0]!;
    focusOn(cellOf(row, 'Customer'));
    press(cellOf(row, 'Customer'), 'ArrowDown', { ctrlKey: true, shiftKey: true });
    expect(onRowReorder).not.toHaveBeenCalled();
    expect(row.querySelector('.flg-data-grid-row-handle')).toBeNull();
  });

  it('is not in the list of values of a header filter', () => {
    render(<Orders headerFilter />);
    add();
    type('Customer', 'Zed');
    const funnel = screen.getByRole('button', { name: 'Filter Customer' });
    act(() => {
      fireEvent.pointerDown(funnel, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 });
      fireEvent.mouseDown(funnel);
      fireEvent.pointerUp(funnel, { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 });
      fireEvent.click(funnel, { detail: 1 });
    });
    const popover = document.querySelector<HTMLElement>('.flg-data-grid-filter-popover')!;
    const lines = Array.from(
      popover.querySelectorAll<HTMLElement>('.flg-data-grid-value-list .flg-checkbox'),
      (label) => label.textContent,
    );
    expect(lines).toEqual(['(Select all)', 'An', 'Bình', 'Chi', 'Dung']);
  });
});

describe('the marks of a new row', () => {
  it('has data-new, and "+ (new)" in the cell of the row header, which no editor holds', () => {
    render(<Orders />);
    add();
    const name = cellOf(newRows()[0]!, 'Order');
    const key = name.querySelector('.flg-data-grid-new-key');
    expect(key).not.toBeNull();
    expect(key).toHaveTextContent('(new)');
    expect(key!.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(name.querySelector('.flg-data-grid-new-text')).toHaveTextContent('(new)');
  });

  it('puts the name on the first data cell when the row header is hidden, while it has nothing to say', () => {
    render(
      <Orders
        editing={CELL_MODE}
        columns={COLUMNS.map((column) =>
          'field' in column && column.field === 'id' ? { ...column, visible: false } : column,
        )}
      />,
    );
    add();
    press(input('Customer'), 'Escape');
    const names = newRows()[0]!.querySelectorAll('.flg-data-grid-new-key');
    expect(names).toHaveLength(1);
    expect(names[0]!.closest('td')).toBe(cellOf(newRows()[0]!, 'Customer'));
  });

  it('leaves what a first data cell holds when the row header is hidden: it is no place for a name', () => {
    render(
      <Orders
        editing={CELL_MODE}
        initNewRow={() => ({ customer: 'Preset' })}
        columns={COLUMNS.map((column) =>
          'field' in column && column.field === 'id' ? { ...column, visible: false } : column,
        )}
      />,
    );
    add();
    press(input('Customer'), 'Escape');
    expect(newRows()[0]!.querySelectorAll('.flg-data-grid-new-key')).toHaveLength(0);
    expect(cellOf(newRows()[0]!, 'Customer')).toHaveTextContent('Preset');
  });

  it('draws a dash, hidden from a screen reader, in a read-only cell with nothing to say', () => {
    render(
      <Orders
        columns={COLUMNS.map((column) =>
          'field' in column && column.field === 'qty' ? { ...column, allowEditing: false } : column,
        )}
      />,
    );
    add();
    const blank = cellOf(newRows()[0]!, 'Qty').querySelector('.flg-data-grid-new-blank');
    expect(blank).toHaveTextContent('—');
    expect(blank).toHaveAttribute('aria-hidden', 'true');
    // A computed cell whose value is NaN on a partial row is blank too.
    expect(cellOf(newRows()[0]!, 'Total').querySelector('.flg-data-grid-new-blank')).not.toBeNull();
  });

  it('draws no dash in a cell that holds an editor, nor in a saved row', () => {
    render(<Orders />);
    add();
    expect(cellOf(newRows()[0]!, 'Customer').querySelector('.flg-data-grid-new-blank')).toBeNull();
    expect(table().querySelectorAll('tr:not([data-new]) .flg-data-grid-new-blank')).toHaveLength(0);
    expect(table().querySelectorAll('tr:not([data-new]) .flg-data-grid-new-key')).toHaveLength(0);
  });

  it('names its buttons by the word for a new row', () => {
    render(<Orders labels={{ newRow: '(mới)' }} />);
    add();
    expect(screen.getByRole('button', { name: 'Save (mới)' })).toBeInTheDocument();
  });
});

describe('a new row in cell mode', () => {
  const cellGrid = (props: Partial<DataGridProps<Order>> = {}) =>
    render(<Orders editing={CELL_MODE} {...props} />);

  it('opens the editor of its first cell that can be edited, with the focus', () => {
    cellGrid();
    add();
    expect(newRows()).toHaveLength(1);
    const editors = Array.from(table().querySelectorAll('td[data-editor]'));
    expect(editors).toEqual([cellOf(newRows()[0]!, 'Customer')]);
    expect(input('Customer')).toHaveFocus();
  });

  it('is only filled by a commit, and sent as one insert when the place leaves the row', () => {
    const onSaving = vi.fn();
    cellGrid({ onSaving });
    add();
    type('Customer', 'Hoa');
    press(input('Customer'), 'Tab');
    expect(onSaving).not.toHaveBeenCalled();
    // The Status Select is left as it is; the next cell is Qty.
    press(
      within(table().querySelector('td[data-editor]') as HTMLElement).getByRole('combobox'),
      'Tab',
    );
    type('Qty', '6');
    press(input('Qty'), 'Enter');
    expect(onSaving).not.toHaveBeenCalled();
    expect(cellOf(newRows()[0]!, 'Customer')).toHaveTextContent('Hoa');
    // The place leaves the row: it is sent, once, with every field that was set.
    focusOn(cellOf(dataRows()[1]!, 'Customer'));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sentAt(onSaving)).toEqual([
      { type: 'insert', key: 'flg-new-1', data: { customer: 'Hoa', qty: 6 } },
    ]);
    expect(newRows()).toHaveLength(0);
  });

  it('is sent when another cell is pressed, once, before that cell opens', () => {
    const onSaving = vi.fn();
    cellGrid({ onSaving });
    add();
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    click(cellOf(dataRows()[2]!, 'Customer'));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sentAt(onSaving)[0]).toMatchObject({ type: 'insert', data: { customer: 'Hoa' } });
    expect(input('Customer')).toHaveFocus();
    expect(table().querySelectorAll('td[data-editor]')).toHaveLength(1);
  });

  it('is sent when Tab leaves the grid after its last cell', () => {
    const onSaving = vi.fn();
    cellGrid({
      onSaving,
      columns: COLUMNS.slice(0, 2),
      editing: { mode: 'cell', allowAdding: true, newRowPosition: 'last' },
    });
    add();
    type('Customer', 'Hoa');
    expect(press(input('Customer'), 'Tab')).toBe(false);
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sentAt(onSaving)[0]).toMatchObject({ type: 'insert', data: { customer: 'Hoa' } });
  });

  it('is sent when Tab goes on to the next row, which then opens', () => {
    const onSaving = vi.fn();
    cellGrid({ onSaving, columns: COLUMNS.slice(0, 2) });
    add();
    type('Customer', 'Hoa');
    expect(press(input('Customer'), 'Tab')).toBe(true);
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(input('Customer').value).toBe('An');
  });

  it('refuses the commit of a cell that fails its rules, as it does in a saved row', () => {
    const onSaving = vi.fn();
    cellGrid({ onSaving, columns: REQUIRED, initNewRow: () => ({ customer: 'Seed' }) });
    add();
    type('Customer', '');
    press(input('Customer'), 'Enter');
    expect(onSaving).not.toHaveBeenCalled();
    expect(cellOf(newRows()[0]!, 'Customer')).toHaveAttribute('data-invalid');
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    focusOn(cellOf(dataRows()[1]!, 'Customer'));
    expect(onSaving).toHaveBeenCalledTimes(1);
  });

  it('keeps a row that fails its rules when the place leaves it, and takes the place back', () => {
    const onSaving = vi.fn();
    const columns: DataGridColumn<Order>[] = [
      COLUMNS[0]!,
      { field: 'customer', caption: 'Customer', width: 140 },
      {
        field: 'note',
        caption: 'Note',
        width: 140,
        validationRules: [{ type: 'required' }],
        allowEditing: true,
      },
    ];
    cellGrid({ onSaving, columns });
    add();
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    // Another cell is pressed: the new row is not valid, so the press does not go through.
    click(cellOf(dataRows()[2]!, 'Customer'));
    expect(onSaving).not.toHaveBeenCalled();
    expect(newRows()).toHaveLength(1);
    expect(cellOf(newRows()[0]!, 'Note')).toHaveAttribute('data-invalid');
    expect(table().querySelectorAll('td[data-editor]')).toHaveLength(1);
  });

  it('is sent when the focus leaves the grid for something outside it', () => {
    const onSaving = vi.fn();
    render(
      <>
        <Orders editing={CELL_MODE} onSaving={onSaving} />
        <button type="button">Elsewhere</button>
      </>,
    );
    add();
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    focusOn(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sentAt(onSaving)[0]).toMatchObject({ type: 'insert', data: { customer: 'Hoa' } });
    expect(newRows()).toHaveLength(0);
  });

  it('is sent when the focus leaves while its editor is open, with what was typed in it', () => {
    const onSaving = vi.fn();
    render(
      <>
        <Orders editing={CELL_MODE} onSaving={onSaving} />
        <button type="button">Elsewhere</button>
      </>,
    );
    add();
    type('Customer', 'Hoa');
    focusOn(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sentAt(onSaving)[0]).toMatchObject({ type: 'insert', data: { customer: 'Hoa' } });
  });

  it('is not sent when the focus goes to a popup outside the table, as the confirm or a list is', () => {
    const onSaving = vi.fn();
    render(<Orders editing={CELL_MODE} onSaving={onSaving} />);
    add();
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    const popup = document.createElement('div');
    popup.setAttribute('popover', 'manual');
    const inside = document.createElement('button');
    popup.append(inside);
    document.body.append(popup);
    try {
      focusOn(inside);
      expect(onSaving).not.toHaveBeenCalled();
      expect(newRows()).toHaveLength(1);
    } finally {
      popup.remove();
    }
  });

  it('is not sent while the calendar of its date editor has the focus', () => {
    const onSaving = vi.fn();
    const columns: DataGridColumn<Order>[] = [
      ...COLUMNS.slice(0, 2),
      {
        field: 'shipped',
        caption: 'Shipped',
        dataType: 'date',
        width: 140,
      } as unknown as DataGridColumn<Order>,
    ];
    const data = ORDERS.map((order) => ({ ...order, shipped: '2026-11-01' }));
    render(<Orders editing={CELL_MODE} columns={columns} data={data} onSaving={onSaving} />);
    add();
    type('Customer', 'Hoa');
    press(input('Customer'), 'Tab');
    const calendar = within(table().querySelector('td[data-editor]') as HTMLElement).getByRole(
      'button',
      { name: /choose date/i },
    );
    click(calendar);
    expect(onSaving).not.toHaveBeenCalled();
    expect(newRows()).toHaveLength(1);
  });

  it('is not sent when the focus leaves with nothing held: a row given nothing stays dropped', () => {
    const onSaving = vi.fn();
    render(
      <>
        <Orders editing={CELL_MODE} onSaving={onSaving} />
        <button type="button">Elsewhere</button>
      </>,
    );
    add();
    focusOn(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(onSaving).not.toHaveBeenCalled();
    expect(newRows()).toHaveLength(0);
  });

  it('does not take the focus back from what it went to when the row fails its rules', () => {
    const onSaving = vi.fn();
    const columns = COLUMNS.map((column) =>
      'field' in column && column.field === 'qty'
        ? { ...column, validationRules: [{ type: 'required' as const }] }
        : column,
    );
    render(
      <>
        <Orders
          editing={CELL_MODE}
          columns={columns}
          initNewRow={() => ({ qty: null })}
          onSaving={onSaving}
        />
        <button type="button">Elsewhere</button>
      </>,
    );
    add();
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    const away = screen.getByRole('button', { name: 'Elsewhere' });
    focusOn(away);
    expect(onSaving).not.toHaveBeenCalled();
    expect(away).toHaveFocus();
    expect(newRows()).toHaveLength(1);
  });

  it('drops a row that was given nothing when the place leaves it, and sends nothing', () => {
    const onSaving = vi.fn();
    cellGrid({ onSaving });
    add();
    press(input('Customer'), 'Escape');
    expect(newRows()).toHaveLength(1);
    focusOn(cellOf(dataRows()[1]!, 'Customer'));
    expect(newRows()).toHaveLength(0);
    expect(onSaving).not.toHaveBeenCalled();
  });

  it('sends the earlier new row when another is added', () => {
    const onSaving = vi.fn();
    cellGrid({ onSaving });
    add();
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    add();
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sentAt(onSaving)[0]).toMatchObject({ key: 'flg-new-1' });
    expect(newRows()).toHaveLength(1);
    expect(input('Customer')).toHaveFocus();
  });

  it('keeps the row, with the alert, when the insert is refused, and sends it again later', async () => {
    const onSaving = vi.fn(() => Promise.reject(new Error('no')));
    cellGrid({ onSaving });
    add();
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    focusOn(cellOf(dataRows()[1]!, 'Customer'));
    await tick();
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(newRows()).toHaveLength(1);
    expect(document.querySelector('.flg-data-grid [role="alert"]')).not.toBeNull();
    click(cellOf(dataRows()[2]!, 'Customer'));
    await tick();
    expect(onSaving).toHaveBeenCalledTimes(2);
  });

  it('is given up by Delete, with no question and nothing sent', () => {
    const onSaving = vi.fn();
    cellGrid({ onSaving, editing: { mode: 'cell', allowAdding: true, allowDeleting: true } });
    add();
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    click(screen.getByRole('button', { name: 'Delete (new)' }));
    expect(newRows()).toHaveLength(0);
    expect(onSaving).not.toHaveBeenCalled();
    expect(screen.queryByText('Delete this row?')).toBeNull();
    expect(table().contains(document.activeElement)).toBe(true);
  });
});

describe('a virtual grid', () => {
  it('draws the new row at the top, in the window, and puts the focus in it', () => {
    const many = Array.from({ length: 200 }, (_, index) => ({
      ...ORDERS[0]!,
      id: `DH-${1000 + index}`,
    }));
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('flg-table-frame') ? 400 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.tagName === 'THEAD' ? 41 : this.tagName === 'TR' ? 41 : 0;
    });
    render(<Orders data={many} scrolling="virtual" height={400} />);
    const frame = table().parentElement as HTMLElement;
    act(() => {
      frame.scrollTop = 41 * 100;
      fireEvent.scroll(frame);
    });
    act(() => {
      add();
    });
    expect(newRows()).toHaveLength(1);
    expect(frame.scrollTop).toBe(0);
    expect(input('Customer')).toHaveFocus();
  });
});

describe('the warnings', () => {
  it('say nothing of adding to a grid that is set up for it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Orders editing={ROW_MODE} initNewRow={() => ({})} />);
    add();
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('a new row whose computed column throws on it (review of PR #46, R1)', () => {
  interface Placed extends Order {
    address: { city: string };
  }
  const placed = ORDERS.map((order) => ({
    ...order,
    address: { city: 'Hue' },
  })) as unknown as Order[];
  const columns = [
    COLUMNS[0]!,
    { field: 'customer', caption: 'Customer', width: 140 },
    {
      id: 'city',
      caption: 'City',
      width: 140,
      value: (row: Placed) => row.address.city,
      setValue: (_row: Placed, value: unknown) => ({ address: { city: String(value) } }),
      validationRules: [{ type: 'required' as const }],
    },
  ] as unknown as DataGridColumn<Order>[];

  it('does not crash when the place leaves the row: the row is not sent, and the grid warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onSaving = vi.fn();
    render(<Orders editing={CELL_MODE} columns={columns} data={placed} onSaving={onSaving} />);
    add();
    type('Customer', 'Hoa');
    press(input('Customer'), 'Enter');
    expect(() => press(cellOf(newRows()[0]!, 'Customer'), 'ArrowDown')).not.toThrow();
    expect(onSaving).not.toHaveBeenCalled();
    expect(newRows()).toHaveLength(1);
    expect(
      warn.mock.calls.filter((call) => String(call[0]).includes('was validated')),
    ).toHaveLength(1);
  });
});

describe('a new row that fails a rule no field of it can show (review of PR #46, R4)', () => {
  const columns: DataGridColumn<Order>[] = [
    COLUMNS[0]!,
    { field: 'qty', caption: 'Qty', dataType: 'number', width: 100 },
    {
      id: 'total',
      caption: 'Total',
      dataType: 'number',
      width: 100,
      value: (row) => row.price * (row.qty ?? 0),
      validationRules: [
        { type: 'custom', validate: (value) => Number(value) > 0 || 'Total must be positive' },
      ],
    },
  ];

  it('is a failure for saveChanges(): it resolves false and nothing is sent', async () => {
    const gridRef = createRef<DataGridHandle>();
    const onSaving = vi.fn();
    render(<Orders gridRef={gridRef} editing={CELL_MODE} columns={columns} onSaving={onSaving} />);
    add();
    type('Qty', '2');
    press(input('Qty'), 'Enter');
    let result: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await tick();
    expect(live()).toContain('1 field needs attention');
    await expect(result!).resolves.toBe(false);
    expect(onSaving).not.toHaveBeenCalled();
    expect(newRows()).toHaveLength(1);
  });

  it('does not trap Tab: from its last cell the focus still leaves the grid', () => {
    const onSaving = vi.fn();
    render(
      <Orders
        editing={{ mode: 'cell', allowAdding: true, newRowPosition: 'last' }}
        columns={columns}
        onSaving={onSaving}
      />,
    );
    add();
    type('Qty', '2');
    expect(press(input('Qty'), 'Tab')).toBe(false);
    expect(onSaving).not.toHaveBeenCalled();
    expect(newRows()).toHaveLength(1);
  });
});
