import { act, createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import type { Ref } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DIALOG_WIDE_QUERY } from '../dialog/use-movable';
import { DataGrid } from './DataGrid';
import type {
  DataGridChange,
  DataGridColumn,
  DataGridEditing,
  DataGridHandle,
  DataGridProps,
} from './index';

// Popup mode (spec phase 6 §4.3 EF1 "Popup", §6.3 "Popup"): Edit, `Enter` and `F2` open one Dialog with a field for every
// data column; Save and `Enter` in a field send it, Cancel and `Esc` give it up, and a press outside does not. What a
// layout engine decides (the full-screen Dialog, the drag, the focus of a real browser) is in the stories.

let showing: Set<Element>;
const original = {
  showModal: HTMLDialogElement.prototype.showModal,
  close: HTMLDialogElement.prototype.close,
};
// jsdom has no showModal(): a stand-in that toggles `open` and fires `close`, as a browser does.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});
afterAll(() => Object.assign(HTMLDialogElement.prototype, original));
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
  qty: number | null;
  price: number;
  secret: string;
  note: string;
}

const ORDERS: Order[] = [
  { id: 'DH-1', customer: 'An', qty: 3, price: 10, secret: 's1', note: 'first' },
  { id: 'DH-2', customer: 'Bình', qty: 5, price: 20, secret: 's2', note: 'second' },
  { id: 'DH-3', customer: 'Chi', qty: 1, price: 30, secret: 's3', note: '' },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, allowEditing: false, width: 100 },
  { field: 'customer', caption: 'Customer', width: 140, validationRules: [{ type: 'required' }] },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 100 },
  {
    id: 'total',
    caption: 'Total',
    dataType: 'number',
    width: 100,
    value: (row) => row.price * (row.qty ?? 0),
  },
  { field: 'secret', caption: 'Secret', width: 100, form: { visible: false } },
  { field: 'note', caption: 'Note', width: 120, multiline: true },
];
const POPUP: DataGridEditing<Order> = { mode: 'popup' };

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
      editing={POPUP}
      onSaving={() => {}}
      {...props}
    />
  );
}

const table = () => document.querySelector<HTMLTableElement>('table[role]')!;
const dataRows = () =>
  Array.from(table().querySelectorAll<HTMLTableRowElement>('tbody > tr.flg-data-grid-row'));
const rowOf = (name: string) => dataRows().find((row) => row.textContent?.includes(name))!;
const dialog = () => document.querySelector<HTMLDialogElement>('dialog.flg-dialog[data-kind]')!;
const opened = () => dialog()?.hasAttribute('open') === true;
const popup = () => within(dialog());
// A required field's label ends with its star, which no screen reader reads (`aria-hidden`).
const named = (label: string) => (content: string) => content.replace(/\s*\*$/, '') === label;
const field = (label: string) => popup().getByLabelText(named(label)) as HTMLInputElement;
const edit = (name: string) => screen.getByRole('button', { name: `Edit ${name}` });
const click = (element: HTMLElement) => act(() => element.click());
const press = (element: HTMLElement, pressed: string): boolean => {
  const event = createEvent.keyDown(element, { key: pressed, bubbles: true, cancelable: true });
  act(() => {
    fireEvent(element, event);
  });
  return event.defaultPrevented;
};
const focusOn = (element: HTMLElement) => act(() => element.focus());
const type = (label: string, text: string) =>
  act(() => void fireEvent.change(field(label), { target: { value: text } }));
const tick = () => act(async () => void (await new Promise((done) => setTimeout(done, 0))));
const save = () => click(popup().getByRole('button', { name: 'Save' }));
const cancel = () => click(popup().getByRole('button', { name: 'Cancel' }));
const sent = (spy: ReturnType<typeof vi.fn>, call = 0): DataGridChange<Order>[] =>
  spy.mock.calls[call]![0] as DataGridChange<Order>[];
function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe('opening the popup', () => {
  it('opens a Dialog named by the row, and leaves the row in the table as it was', () => {
    render(<Orders />);
    expect(opened()).toBe(false);
    click(edit('DH-2'));
    expect(opened()).toBe(true);
    expect(screen.getByRole('dialog', { name: 'Edit DH-2' })).toBe(dialog());
    expect(dataRows()).toHaveLength(3);
    expect(table().querySelector('[data-editor], tr[data-editing]')).toBeNull();
  });

  it('opens with Enter and with F2 on a cell of the row', () => {
    render(<Orders />);
    const cell = within(rowOf('DH-1')).getByText('An').closest('td')!;
    focusOn(cell);
    expect(press(cell, 'Enter')).toBe(true);
    expect(opened()).toBe(true);
    cancel();
    expect(opened()).toBe(false);
    const again = within(rowOf('DH-3')).getByText('Chi').closest('td')!;
    focusOn(again);
    press(again, 'F2');
    expect(popup().getByText('Edit DH-3')).toBeInTheDocument();
  });

  it('draws Edit and Delete always, as the form does, and no save or cancel button in the rows', () => {
    render(<Orders editing={{ mode: 'popup', allowDeleting: true }} />);
    click(edit('DH-1'));
    const boxes = Array.from(table().querySelectorAll('.flg-data-grid-action-buttons'));
    expect(boxes).toHaveLength(3);
    for (const box of boxes) expect(box).toHaveAttribute('data-always');
    expect(table().querySelector('[data-editing]')).toBeNull();
  });

  it('says what is required in the description, and only when something is', () => {
    const { rerender } = render(<Orders />);
    click(edit('DH-2'));
    expect(popup().getByText('Fields marked * are required.')).toBeInTheDocument();
    expect(dialog()).toHaveAccessibleDescription('Fields marked * are required.');
    cancel();
    rerender(
      <Orders columns={COLUMNS.map((column) => ({ ...column, validationRules: undefined }))} />,
    );
    click(edit('DH-2'));
    expect(popup().queryByText('Fields marked * are required.')).toBeNull();
  });

  it('has a field for every data column in order, but the one left out, and shows the others as text', () => {
    render(<Orders />);
    click(edit('DH-2'));
    const labels = Array.from(
      dialog().querySelectorAll('.flg-data-grid-form-fields > .flg-field > .flg-field-label'),
      (label) => label.textContent,
    );
    expect(labels).toEqual(['Order', 'Customer*', 'Qty', 'Total', 'Note']);
    expect(field('Customer').value).toBe('Bình');
    expect(dialog().querySelector('.flg-data-grid-form-static')?.textContent).toBe('DH-2');
    expect(popup().getByLabelText('Note').tagName).toBe('TEXTAREA');
  });

  it('gives the Dialog its size, movable and fullScreenOnPhone, by default and as given', () => {
    const { rerender } = render(<Orders />);
    click(edit('DH-2'));
    const panel = () => dialog().querySelector<HTMLElement>('.flg-dialog-panel')!;
    expect(panel()).toHaveAttribute('data-size', 'lg');
    expect(panel()).not.toHaveAttribute('data-movable');
    expect(dialog()).toHaveAttribute('data-full-screen', 'phone');
    cancel();
    rerender(
      <Orders
        editing={{
          mode: 'popup',
          popup: { size: 'sm', movable: true, fullScreenOnPhone: false },
        }}
      />,
    );
    click(edit('DH-2'));
    expect(panel()).toHaveAttribute('data-size', 'sm');
    expect(panel()).toHaveAttribute('data-movable');
    expect(dialog()).not.toHaveAttribute('data-full-screen');
  });

  it('falls back to the default for a size the Dialog does not have', () => {
    render(
      <Orders editing={{ mode: 'popup', popup: { size: 'xl' } as unknown as { size: 'lg' } }} />,
    );
    click(edit('DH-2'));
    expect(dialog().querySelector('.flg-dialog-panel')).toHaveAttribute('data-size', 'lg');
  });

  it('is kept by value: a popup object written in the JSX is no change, and a new value is', () => {
    const { rerender } = render(<Orders editing={{ mode: 'popup', popup: { size: 'md' } }} />);
    click(edit('DH-2'));
    rerender(<Orders editing={{ mode: 'popup', popup: { size: 'md' } }} />);
    expect(opened()).toBe(true);
    rerender(<Orders editing={{ mode: 'popup', popup: { size: 'sm' } }} />);
    expect(dialog().querySelector('.flg-dialog-panel')).toHaveAttribute('data-size', 'sm');
  });
  describe('on a phone', () => {
    // jsdom has no matchMedia: the Dialog's own query for a wide screen answers as the test says.
    const screenIs = (wide: boolean) =>
      vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
          matches: query === DIALOG_WIDE_QUERY ? wide : false,
          addEventListener: () => {},
          removeEventListener: () => {},
        })),
      );
    afterEach(() => vi.unstubAllGlobals());
    const title = () => screen.getByRole('dialog').querySelector<HTMLElement>('.flg-card-title')!;

    it('gives the focus to the title when the popup opens full screen, and Tab then reaches the first field', () => {
      screenIs(false);
      render(<Orders />);
      click(edit('DH-2'));
      expect(document.activeElement).toBe(title());
      expect(title()).toHaveAttribute('tabindex', '-1');
      expect(field('Customer')).not.toHaveFocus();
    });

    it('gives the focus to the title of a new row too', () => {
      screenIs(false);
      const gridRef = createRef<DataGridHandle>();
      render(<Orders gridRef={gridRef} editing={{ mode: 'popup', allowAdding: true }} />);
      act(() => gridRef.current!.addRow());
      expect(document.activeElement).toBe(title());
    });

    it('keeps the field on a wide screen, and on a phone with fullScreenOnPhone off', () => {
      screenIs(true);
      const { rerender } = render(<Orders />);
      click(edit('DH-2'));
      expect(document.activeElement).toBe(field('Customer'));
      cancel();
      screenIs(false);
      rerender(<Orders editing={{ mode: 'popup', popup: { fullScreenOnPhone: false } }} />);
      click(edit('DH-2'));
      expect(document.activeElement).toBe(field('Customer'));
    });
  });

  it('gives the focus to the first field that can be edited', () => {
    render(<Orders />);
    click(edit('DH-2'));
    expect(document.activeElement).toBe(field('Customer'));
  });

  it('gives the focus to the field of the cell that Enter was pressed on, when it can be edited', () => {
    render(<Orders />);
    const cell = within(rowOf('DH-2')).getByText('5').closest('td')!;
    focusOn(cell);
    press(cell, 'Enter');
    expect(document.activeElement).toBe(field('Qty'));
    cancel();
    // A cell that cannot be edited (the order's number, the computed total) gives the first field.
    const id = within(rowOf('DH-2')).getByText('DH-2').closest('td, th') as HTMLElement;
    focusOn(id);
    press(id, 'Enter');
    expect(document.activeElement).toBe(field('Customer'));
  });

  it('has one Dialog for the grid, however many rows are opened', () => {
    render(<Orders />);
    click(edit('DH-1'));
    cancel();
    click(edit('DH-2'));
    expect(document.querySelectorAll('dialog.flg-dialog[data-kind]')).toHaveLength(1);
  });
});

describe('closing the popup', () => {
  it('gives the edit up with Cancel and with Esc, and sends nothing', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    click(edit('DH-2'));
    type('Customer', 'Zed');
    cancel();
    expect(opened()).toBe(false);
    click(edit('DH-2'));
    expect(field('Customer').value).toBe('Bình');
    act(() => {
      dialog().dispatchEvent(new Event('cancel', { cancelable: true }));
    });
    expect(opened()).toBe(false);
    expect(onSaving).not.toHaveBeenCalled();
  });

  it('is not closed by a press outside the panel', () => {
    render(<Orders />);
    click(edit('DH-2'));
    const frame = dialog();
    act(() => {
      fireEvent.pointerDown(frame);
      fireEvent.pointerUp(frame);
      fireEvent.click(frame);
    });
    expect(opened()).toBe(true);
  });

  it('closes for good when its row leaves the rows, and when editing goes or changes mode', () => {
    const onSaving = vi.fn();
    const { rerender } = render(<Orders onSaving={onSaving} />);
    click(edit('DH-2'));
    rerender(<Orders onSaving={onSaving} data={ORDERS.filter((row) => row.id !== 'DH-2')} />);
    expect(opened()).toBe(false);
    rerender(<Orders onSaving={onSaving} />);
    expect(opened()).toBe(false);
    click(edit('DH-2'));
    rerender(<Orders onSaving={onSaving} editing={undefined} />);
    expect(opened()).toBe(false);
    rerender(<Orders onSaving={onSaving} />);
    click(edit('DH-2'));
    rerender(<Orders onSaving={onSaving} editing={{ mode: 'form' }} />);
    expect(opened()).toBe(false);
    expect(onSaving).not.toHaveBeenCalled();
  });

  it('goes with the grid', () => {
    const { unmount } = render(<Orders />);
    click(edit('DH-2'));
    unmount();
    expect(document.querySelector('dialog.flg-dialog')).toBeNull();
  });
});

describe('saving from the popup', () => {
  it('sends one update with what changed, and closes', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    click(edit('DH-2'));
    type('Customer', 'Zed');
    save();
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sent(onSaving)).toMatchObject([
      { type: 'update', key: 'DH-2', data: { customer: 'Zed' } },
    ]);
    expect(opened()).toBe(false);
  });

  it('saves with Enter in a field, as the form does, by submitting it', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    click(edit('DH-2'));
    type('Customer', 'Zed');
    act(() => void fireEvent.submit(field('Customer').closest('form')!));
    expect(onSaving).toHaveBeenCalledTimes(1);
  });

  it('closes with no call when nothing changed', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    click(edit('DH-2'));
    save();
    expect(onSaving).not.toHaveBeenCalled();
    expect(opened()).toBe(false);
  });

  it('saves with saveChanges() as Save does, resolves true and closes the Dialog', async () => {
    const onSaving = vi.fn();
    const gridRef = createRef<DataGridHandle>();
    render(<Orders onSaving={onSaving} gridRef={gridRef} />);
    click(edit('DH-2'));
    type('Customer', 'Zed');
    let result!: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result).resolves.toBe(true);
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(sent(onSaving)).toMatchObject([
      { type: 'update', key: 'DH-2', data: { customer: 'Zed' } },
    ]);
    expect(opened()).toBe(false);
  });

  it('resolves false from saveChanges() and keeps the Dialog with the error when a rule fails', async () => {
    const onSaving = vi.fn();
    const gridRef = createRef<DataGridHandle>();
    render(<Orders onSaving={onSaving} gridRef={gridRef} />);
    click(edit('DH-2'));
    type('Customer', '');
    focusOn(field('Qty'));
    let result!: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result).resolves.toBe(false);
    expect(onSaving).not.toHaveBeenCalled();
    expect(opened()).toBe(true);
    expect(document.activeElement).toBe(field('Customer'));
  });

  it('resolves true from saveChanges() with no Dialog open or no change, false when the app refuses', async () => {
    const gridRef = createRef<DataGridHandle>();
    const onSaving = vi.fn(() => Promise.reject(new Error('no')));
    render(<Orders onSaving={onSaving} gridRef={gridRef} />);
    await expect(gridRef.current!.saveChanges()).resolves.toBe(true);
    click(edit('DH-2'));
    let result!: Promise<boolean>;
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result).resolves.toBe(true);
    expect(onSaving).not.toHaveBeenCalled();
    expect(opened()).toBe(false);
    click(edit('DH-2'));
    type('Customer', 'Zed');
    act(() => {
      result = gridRef.current!.saveChanges();
    });
    await expect(result).resolves.toBe(false);
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(opened()).toBe(true);
  });

  it('keeps the popup, shows the errors in the Fields and gives the focus to the first, when a rule fails', () => {
    const onSaving = vi.fn();
    render(<Orders onSaving={onSaving} />);
    click(edit('DH-2'));
    type('Customer', '');
    focusOn(field('Qty'));
    save();
    expect(onSaving).not.toHaveBeenCalled();
    expect(opened()).toBe(true);
    expect(popup().getByText('Customer is required')).toBeInTheDocument();
    expect(document.activeElement).toBe(field('Customer'));
  });

  it('keeps the popup open while the save is pending, with Save loading, and closes at the resolve', async () => {
    const wait = deferred();
    const onSaving = vi.fn(() => wait.promise);
    render(<Orders onSaving={onSaving} />);
    click(edit('DH-2'));
    type('Customer', 'Zed');
    save();
    expect(opened()).toBe(true);
    expect(popup().getByRole('button', { name: 'Save' })).toHaveAttribute('data-loading');
    save();
    expect(onSaving).toHaveBeenCalledTimes(1);
    await act(async () => wait.resolve());
    await tick();
    expect(opened()).toBe(false);
  });

  it('stays open and says why when the save is refused', async () => {
    const wait = deferred();
    render(<Orders onSaving={() => wait.promise} />);
    click(edit('DH-2'));
    type('Customer', 'Zed');
    save();
    await act(async () => wait.reject(new Error('Server said no')));
    await tick();
    expect(opened()).toBe(true);
    expect(screen.getByRole('alert')).toHaveTextContent('Server said no');
    expect(field('Customer').value).toBe('Zed');
  });

  it('puts the words of a field the server named under that field', async () => {
    const reason = {
      message: 'Not saved.',
      fieldErrors: [{ key: 'DH-2', field: 'customer', message: 'Customer is taken' }],
    };
    render(<Orders onSaving={() => Promise.reject(reason)} />);
    click(edit('DH-2'));
    type('Customer', 'Zed');
    save();
    await tick();
    expect(popup().getByText('Customer is taken')).toHaveClass('flg-field-error');
    expect(opened()).toBe(true);
  });
});

describe('a new row in the popup', () => {
  it('opens a Dialog named "New row" with addRow() and sends an insert', () => {
    const ref = createRef<DataGridHandle>();
    const onSaving = vi.fn();
    render(
      <Orders
        gridRef={ref}
        onSaving={onSaving}
        editing={{ mode: 'popup', allowAdding: true }}
        initNewRow={() => ({ qty: 2 })}
      />,
    );
    act(() => ref.current!.addRow());
    expect(screen.getByRole('dialog', { name: 'New row' })).toBe(dialog());
    expect(field('Qty').value).toBe('2');
    type('Customer', 'Neo');
    save();
    expect(sent(onSaving)).toMatchObject([{ type: 'insert', data: { customer: 'Neo', qty: 2 } }]);
  });

  it('gives a new row up with Cancel', () => {
    const ref = createRef<DataGridHandle>();
    const onSaving = vi.fn();
    render(
      <Orders gridRef={ref} onSaving={onSaving} editing={{ mode: 'popup', allowAdding: true }} />,
    );
    act(() => ref.current!.addRow());
    cancel();
    expect(opened()).toBe(false);
    expect(onSaving).not.toHaveBeenCalled();
    expect(dataRows()).toHaveLength(3);
  });
});

describe('the focus when the popup goes', () => {
  it('goes back to what opened it: the cell', () => {
    render(<Orders />);
    const cell = within(rowOf('DH-1')).getByText('An').closest('td')!;
    focusOn(cell);
    press(cell, 'Enter');
    cancel();
    expect(document.activeElement).toBe(cell);
  });

  it('goes to the place of the grid when what opened it is gone: never <body>', async () => {
    const ref = createRef<DataGridHandle>();
    render(<Orders gridRef={ref} editing={{ mode: 'popup', allowAdding: true }} />);
    (document.activeElement as HTMLElement | null)?.blur();
    act(() => ref.current!.addRow());
    type('Customer', 'Neo');
    save();
    await tick();
    expect(opened()).toBe(false);
    expect(document.activeElement).not.toBe(document.body);
    expect(table().contains(document.activeElement)).toBe(true);
  });
});
