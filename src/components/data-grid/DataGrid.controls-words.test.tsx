import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Combobox, ComboboxItem } from '../combobox';
import { DatePicker } from '../date-picker';
import { NumberInput } from '../number-input';
import { SearchField } from '../search-field';
import { DEFAULT_LABELS } from './labels';
import { DataGrid } from './DataGrid';
import type { DataGridColumn, DataGridLabels, DataGridProps } from './index';

// The words of the controls the grid draws (spec phase 6 §6.3 "Nhãn", the record `controls`): the DatePickers
// of the cell editor, of the filter cell and of the `between` editor, the NumberInput and the Combobox of the
// editor, and the SearchFields of the toolbar and of the header filter. Each says the grid's words, and the
// component's own when the grid is given none. What a layout engine decides is in the stories.

// Which popovers are showing: jsdom has no Popover API.
let showing: Set<Element>;
beforeEach(() => {
  resetDevWarnings();
  // jsdom's document has no focus once an input is blurred, which a DatePicker would read as a window switch.
  vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  showing = new Set();
  HTMLElement.prototype.checkVisibility = () => true;
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
  placed: string | null;
}

const STATUSES = [
  { id: 1, name: 'New' },
  { id: 2, name: 'Processing' },
  { id: 3, name: 'Delivered' },
];

const ORDERS: Order[] = [
  { id: 'DH-1', customer: 'An', status: 1, qty: 3, placed: '2026-11-05' },
  { id: 'DH-2', customer: 'Bình', status: 2, qty: 5, placed: '2026-11-06' },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, allowEditing: false, width: 100 },
  { field: 'customer', caption: 'Customer', width: 140 },
  {
    field: 'status',
    caption: 'Status',
    width: 140,
    // `searchable` makes it a Combobox whatever the number of items.
    lookup: { items: STATUSES, valueField: 'id', displayField: 'name', searchable: true },
  },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 100 },
  { field: 'placed', caption: 'Placed', dataType: 'date', width: 150 },
];

function Orders(props: Partial<DataGridProps<Order>>) {
  return (
    <DataGrid
      data={ORDERS}
      rowKey="id"
      columns={COLUMNS}
      caption="Orders"
      paging={false}
      onSaving={() => {}}
      {...props}
    />
  );
}

const DEFAULTS = {
  chooseDate: 'Choose date',
  invalidDate: 'Invalid date',
  unavailableDate: 'This date is not available',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  increase: 'Increase',
  decrease: 'Decrease',
  noResults: 'No results',
  results: (count: number) => (count === 1 ? '1 result' : `${count} results`),
  clearSearch: 'Clear search',
};

const VIETNAMESE: DataGridLabels['controls'] = {
  chooseDate: 'Chọn ngày',
  invalidDate: 'Ngày không hợp lệ',
  unavailableDate: 'Không chọn được ngày này',
  previousMonth: 'Tháng trước',
  nextMonth: 'Tháng sau',
  increase: 'Tăng',
  decrease: 'Giảm',
  noResults: 'Không có kết quả',
  results: (count) => `${count} kết quả`,
  clearSearch: 'Xoá tìm kiếm',
};

const click = (element: HTMLElement) => act(() => element.click());
/** The animation frame and the timers a control uses to say something. */
const aTaskLater = (ms = 0) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));
const editedRow = () => document.querySelector<HTMLTableRowElement>('tr[data-editing]')!;
const startEdit = (name: string) => click(screen.getByRole('button', { name: `Edit ${name}` }));
const popover = () => document.querySelector<HTMLElement>('.flg-data-grid-filter-popover')!;

describe.each([
  ['the defaults of the controls', undefined, DEFAULTS],
  ['the words of the labels', VIETNAMESE, VIETNAMESE],
] as const)('controls named by %s', (_name, given, words) => {
  const labels = given === undefined ? undefined : { controls: given };

  it('names the calendar button of a date editor, its dialog and its month buttons', () => {
    render(<Orders editing={{ mode: 'row' }} labels={labels} />);
    startEdit('DH-1');
    const button = within(editedRow()).getByRole('button', { name: words.chooseDate });
    click(button);
    const dialog = editedRow().querySelector<HTMLElement>('.flg-date-picker-popup')!;
    expect(dialog).toHaveAttribute('aria-label', words.chooseDate);
    expect(
      within(dialog).getByRole('button', { name: words.previousMonth, hidden: true }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: words.nextMonth, hidden: true }),
    ).toBeInTheDocument();
  });

  it('says the date editor faults in its words', () => {
    render(<Orders editing={{ mode: 'row' }} labels={labels} />);
    startEdit('DH-1');
    const input = within(editedRow()).getByLabelText('Placed') as HTMLInputElement;
    act(() => void fireEvent.change(input, { target: { value: 'abc' } }));
    act(() => void fireEvent.blur(input));
    expect(editedRow().querySelector('.flg-field-error')).toHaveTextContent(words.invalidDate);
  });

  it('names the calendar button of the date filter cell', () => {
    render(<Orders filterRow labels={labels} />);
    const root = screen.getByLabelText('Filter Placed').closest<HTMLElement>('.flg-date-picker')!;
    expect(within(root).getByRole('button', { name: words.chooseDate })).toBeInTheDocument();
    expect(root.querySelector('.flg-date-picker-popup')).toHaveAttribute(
      'aria-label',
      words.chooseDate,
    );
  });

  it('names the calendar buttons of the two ends of a between editor', () => {
    render(
      <Orders
        filterRow
        defaultFilter={{ columns: { placed: { operator: 'between' } } }}
        labels={labels}
      />,
    );
    click(screen.getByRole('combobox', { name: 'Filter Placed' }));
    const buttons = within(popover()).getAllByRole('button', {
      name: words.chooseDate,
      hidden: true,
    });
    expect(buttons).toHaveLength(2);
  });

  it('names the steppers of a number editor', () => {
    render(<Orders editing={{ mode: 'row' }} labels={labels} />);
    startEdit('DH-1');
    const row = within(editedRow());
    expect(row.getByRole('button', { name: words.increase, hidden: true })).toBeInTheDocument();
    expect(row.getByRole('button', { name: words.decrease, hidden: true })).toBeInTheDocument();
  });

  it('says "no results" and the count of a Combobox editor in its words', async () => {
    render(<Orders editing={{ mode: 'row' }} labels={labels} />);
    startEdit('DH-1');
    const status = within(editedRow()).getByRole('combobox', { name: 'Status' });
    act(() => status.focus());
    act(() => void fireEvent.change(status, { target: { value: 'zzz' } }));
    expect(screen.getByText(words.noResults)).toBeInTheDocument();
    act(() => void fireEvent.change(status, { target: { value: 'Proc' } }));
    await aTaskLater(600);
    const live = Array.from(document.querySelectorAll('[aria-live]')).map((el) => el.textContent);
    expect(live).toContain(words.results(1));
  });

  it('names the clear button of the toolbar search', () => {
    render(<Orders searchPanel defaultFilter={{ search: 'An' }} labels={labels} />);
    expect(screen.getByRole('button', { name: words.clearSearch })).toBeInTheDocument();
  });

  it('names the clear button of the search of a header filter', () => {
    render(<Orders headerFilter labels={labels} />);
    click(screen.getByRole('button', { name: 'Filter Customer' }));
    const search = within(popover()).getByRole('searchbox', {
      name: 'Search values',
      hidden: true,
    });
    act(() => void fireEvent.change(search, { target: { value: 'A' } }));
    expect(
      within(popover()).getByRole('button', { name: words.clearSearch, hidden: true }),
    ).toBeInTheDocument();
  });
});

// The grid writes the defaults of `controls` out (NumberInput and SearchField's are read from those controls), and
// the controls keep their own. Each control is drawn here with no `labels` at all, so a word that drifts on either
// side fails.
describe('the words of the controls with no labels are the grid defaults', () => {
  const words = DEFAULT_LABELS.controls;

  it('DatePicker says the button, the dialog, the month buttons and both faults', () => {
    render(<DatePicker aria-label="Day" min="2026-11-10" today="2026-11-12" />);
    const root = screen.getByLabelText('Day').closest<HTMLElement>('.flg-date-picker')!;
    const button = within(root).getByRole('button', { name: words.chooseDate });
    click(button);
    const dialog = root.querySelector<HTMLElement>('.flg-date-picker-popup')!;
    expect(dialog).toHaveAttribute('aria-label', words.chooseDate);
    within(dialog).getByRole('button', { name: words.previousMonth, hidden: true });
    within(dialog).getByRole('button', { name: words.nextMonth, hidden: true });
    const input = screen.getByLabelText('Day') as HTMLInputElement;
    act(() => void fireEvent.change(input, { target: { value: 'abc' } }));
    act(() => void fireEvent.blur(input));
    expect(root).toHaveTextContent(words.invalidDate);
    act(() => void fireEvent.change(input, { target: { value: '11/01/2026' } }));
    act(() => void fireEvent.blur(input));
    expect(root).toHaveTextContent(words.unavailableDate);
  });

  it('NumberInput names its two buttons', () => {
    render(<NumberInput aria-label="Qty" />);
    screen.getByRole('button', { name: words.increase, hidden: true });
    screen.getByRole('button', { name: words.decrease, hidden: true });
  });

  it('SearchField names its clear button', () => {
    render(<SearchField aria-label="Find" defaultValue="a" />);
    screen.getByRole('button', { name: words.clearSearch });
  });

  it('Combobox says no results and the count of results', async () => {
    render(
      <Combobox aria-label="City">
        <ComboboxItem value="hn">Hanoi</ComboboxItem>
      </Combobox>,
    );
    const input = screen.getByRole('combobox');
    act(() => input.focus());
    act(() => void fireEvent.change(input, { target: { value: 'zzz' } }));
    expect(screen.getByText(words.noResults)).toBeInTheDocument();
    act(() => void fireEvent.change(input, { target: { value: 'Han' } }));
    await aTaskLater(600);
    const live = Array.from(document.querySelectorAll('[aria-live]')).map((el) => el.textContent);
    expect(live).toContain(words.results(1));
  });
});
