import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { DataGrid } from './DataGrid';
import { FORM_ESTIMATE_ROWS } from './hooks/use-virtual-rows';
import type { DataGridColumn } from './index';

// The form row of a virtual grid (spec phase 6 §3.7 "Dòng có chiều cao thay đổi"): the one row of the list that is not
// as tall as the others, so its height is measured and the window is made with it. Before the first measure it counts
// as eight rows. jsdom has no layout, so the heights are given by the test.

const FRAME = 400;
const HEAD = 41;
const ROW = 45;
let formHeight = 0;
let watchers: Array<() => void> = [];

beforeEach(() => {
  resetDevWarnings();
  formHeight = 0;
  watchers = [];
  HTMLElement.prototype.checkVisibility = () => true;
  Element.prototype.scrollIntoView = () => {};
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.classList.contains('flg-table-frame') ? FRAME : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    // A row that is no longer in the document has no box, as in a browser.
    if (this.classList.contains('flg-data-grid-form-row')) return this.isConnected ? formHeight : 0;
    return this.tagName === 'THEAD' ? HEAD : this.tagName === 'TR' ? ROW : 0;
  });
  // A ResizeObserver that the test runs, as the frames of a scroll are.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      private readonly callback: () => void;
      constructor(callback: () => void) {
        this.callback = callback;
      }
      observe() {
        watchers.push(this.callback);
      }
      disconnect() {
        watchers = watchers.filter((one) => one !== this.callback);
      }
      unobserve() {}
    },
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  vi.restoreAllMocks();
});

interface Order {
  id: string;
  customer: string;
}

const ORDERS: Order[] = Array.from({ length: 200 }, (_, index) => ({
  id: `DH-${index + 1}`,
  customer: `Customer ${index + 1}`,
}));
const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, allowEditing: false, width: 104 },
  { field: 'customer', caption: 'Customer', width: 200 },
];

const grid = () => screen.getByRole('grid');
const dataRows = () =>
  Array.from(grid().querySelectorAll<HTMLElement>('tbody > .flg-data-grid-row'));
const formRow = () => grid().querySelector<HTMLElement>('tbody > .flg-data-grid-form-row');
const spacerBelow = () => {
  const spacers = Array.from(grid().querySelectorAll<HTMLElement>('tbody > .flg-data-grid-spacer'));
  return Number.parseFloat((spacers.at(-1)!.firstElementChild as HTMLElement).style.height);
};

function Orders() {
  return (
    <DataGrid
      data={ORDERS}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      height={FRAME}
      scrolling="virtual"
      editing={{ mode: 'form' }}
      onSaving={() => {}}
    />
  );
}

describe('the form row of a virtual grid', () => {
  it('is kept in the window, drawn as the one form, with the rows after it', () => {
    render(<Orders />);
    act(() => screen.getByRole('button', { name: 'Edit DH-1' }).click());
    expect(formRow()).not.toBeNull();
    expect(dataRows().length).toBeGreaterThan(0);
    expect(dataRows()[0]!.textContent).toContain('DH-2');
  });

  it('counts as eight rows until it is measured, then as tall as it measures', () => {
    render(<Orders />);
    const closed = dataRows().length;
    act(() => screen.getByRole('button', { name: 'Edit DH-1' }).click());
    // Eight rows are 360px of the 400px frame: the window ends sooner than it did with rows of one height alone.
    const estimated = dataRows().length;
    expect(FORM_ESTIMATE_ROWS * ROW).toBe(360);
    const total = spacerBelow();
    expect(estimated).toBeLessThan(closed);
    // The form is measured at 120px: the rows after it that are in the frame are more, and the spacer less.
    formHeight = 120;
    act(() => watchers.forEach((watch) => watch()));
    expect(dataRows().length).toBeGreaterThan(estimated);
    expect(spacerBelow()).toBeLessThan(total);
    // It grows (a field got an error): the window follows.
    const measured = dataRows().length;
    formHeight = 360;
    act(() => watchers.forEach((watch) => watch()));
    expect(dataRows().length).toBeLessThan(measured);
  });

  it('follows a form row that is made again under the same key: it measures the one in the table', () => {
    render(<Orders />);
    act(() => screen.getByRole('button', { name: 'Edit DH-1' }).click());
    const estimated = dataRows().length;
    // Something draws the row anew (a changed React key of it): the old <tr> goes and a new one stands there.
    const old = formRow()!;
    const again = old.cloneNode(true) as HTMLElement;
    old.replaceWith(again);
    formHeight = 120;
    act(() => watchers.forEach((watch) => watch()));
    expect(dataRows().length).toBeGreaterThan(estimated);
  });

  it('counts as eight rows again when the form closes and another opens', () => {
    render(<Orders />);
    act(() => screen.getByRole('button', { name: 'Edit DH-1' }).click());
    const estimated = dataRows().length;
    formHeight = 120;
    act(() => watchers.forEach((watch) => watch()));
    expect(dataRows().length).toBeGreaterThan(estimated);
    act(() => screen.getByRole('button', { name: 'Cancel' }).click());
    formHeight = 0;
    act(() => screen.getByRole('button', { name: 'Edit DH-2' }).click());
    // Not measured yet: the estimate again, not the 120px of the form that closed.
    expect(dataRows().length).toBe(estimated);
  });

  it('keeps no machinery of its own while no form is open: nothing observes a row', () => {
    render(<Orders />);
    const before = watchers.length;
    act(() => screen.getByRole('button', { name: 'Edit DH-1' }).click());
    expect(watchers.length).toBe(before + 1);
    act(() => screen.getByRole('button', { name: 'Cancel' }).click());
    expect(watchers.length).toBe(before);
  });
});
