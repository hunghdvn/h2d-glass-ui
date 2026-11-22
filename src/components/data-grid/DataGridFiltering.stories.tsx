import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  ASSIGNEES,
  bodyCell,
  lookPlay,
  SALES,
  SALE_COLUMNS,
  noTitleIsCut,
} from '../../../.storybook/data-grid-orders';
import type { Sale } from '../../../.storybook/data-grid-orders';
import { onPlatform } from '../../../.storybook/platform';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import { foldText } from '../../internal/text-fold';
import { Avatar } from '../avatar/Avatar';
import { Badge } from '../badge/Badge';
import { Card } from '../card/Card';
import { DataGrid } from './DataGrid';
import type { DataGridCellContext, DataGridColumn, DataGridFilter, DataGridProps } from './index';

const meta = {
  title: 'Components/DataGrid/Filtering',
  component: DataGrid,
  // Built but not released until the grid is exported (spec phase 6 §2): hidden from the sidebar of
  // the built docs, still run by the story tests and shot by the visual harness.
  tags: ['unreleased'],
  args: { data: SALES, rowKey: 'id', columns: SALE_COLUMNS, 'aria-label': 'Orders' },
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'region', enabled: false }],
      },
    },
  },
} satisfies Meta<DataGridProps<Sale>>;

export default meta;
type Story = StoryObj<DataGridProps<Sale>>;

/**
 * How long a story waits for the grid to show what a press asked of it: the state changes in the
 * press, and the commit and the focus it gives come in the engine's next rendering update, which Linux
 * WebKit on x86 (CI) delivers late. `waitFor` waits one second by default; a late update came within
 * five. Each message says what was missing, so a late update can be told from one that never came.
 */
const RENDER_UPDATE = { timeout: 5000 };

/** A filter that keeps no order: nobody has this name. */
const NO_ORDER: DataGridFilter = { search: 'nobody has this name' };

const titleOf = (root: HTMLElement, caption: string) =>
  Array.from(root.querySelectorAll<HTMLElement>('thead th')).find((th) =>
    th.textContent?.startsWith(caption),
  )!;

/** The grids of `EmptyByFilter`: one empty because of its filter, held by the story, and one with no data. */
const EmptyGrids = ({
  onFilterChange,
}: {
  onFilterChange: DataGridProps<Sale>['onFilterChange'];
}) => {
  const [filter, setFilter] = useState<DataGridFilter>(NO_ORDER);
  return (
    <div style={{ width: 760, display: 'grid', gap: 16 }}>
      <DataGrid
        aria-label="Filtered orders"
        data={SALES}
        rowKey="id"
        columns={SALE_COLUMNS}
        paging={false}
        filter={filter}
        onFilterChange={(next) => {
          setFilter(next);
          onFilterChange?.(next);
        }}
      />
      <DataGrid
        aria-label="No orders"
        data={[]}
        rowKey="id"
        columns={SALE_COLUMNS}
        paging={false}
      />
    </div>
  );
};

/**
 * A grid that is empty because of its filter (spec phase 6 §4.3 "Trống do lọc"): a ring with a funnel
 * crossed out, the words, and the button that clears the filter, in the box a grid with no data
 * draws its words in. The button is the one place of the body: reached by ↓ from the titles (which
 * keeps the column), left by ↑, one Tab stop in the table, pressed by Enter, and then the rows are back
 * and the focus is on the first cell. A grid with no data has no button.
 */
export const EmptyByFilter: Story = {
  tags: ['no-visual'],
  args: { onFilterChange: fn() },
  render: (args) => <EmptyGrids onFilterChange={args.onFilterChange} />,
  play: async ({ canvasElement, args }) => {
    const [root, plain] = Array.from(canvasElement.querySelectorAll<HTMLElement>('.flg-data-grid'));
    const table = root!.querySelector<HTMLTableElement>('table[role="grid"]')!;
    const stops = () => table.querySelectorAll('[tabindex="0"]');
    const button = () =>
      root!.querySelector<HTMLButtonElement>('.flg-data-grid-empty-content button')!;
    await noTitleIsCut(root!);

    // The words and the button of the filtered grid; the other grid has its own words and no button.
    const content = root!.querySelector<HTMLElement>('.flg-data-grid-empty-content')!;
    const plainContent = plain!.querySelector<HTMLElement>('.flg-data-grid-empty-content')!;
    await expect(content.querySelector('.flg-data-grid-empty-title')).toHaveTextContent(
      'No rows match the filter',
    );
    await expect(button()).toHaveTextContent('Clear filter');
    await expect(plainContent).toHaveTextContent('No data');
    await expect(plain!.querySelector('.flg-data-grid-empty button')).toBeNull();

    // The box is the box of the words of a grid with no data: the same padding, width, text and place.
    const same = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'width'] as const;
    const boxOf = getComputedStyle(content);
    const plainBox = getComputedStyle(plainContent);
    for (const property of same) await expect(boxOf[property], property).toBe(plainBox[property]);
    for (const property of ['position', 'left', 'textAlign', 'fontSize', 'fontWeight'] as const) {
      await expect(boxOf[property], property).toBe(plainBox[property]);
    }
    // Its parts: the ring is 38px with a funnel of 18px, 8px apart from the words and the button, all
    // of them on the middle line of the box.
    const ring = content.querySelector<HTMLElement>('.flg-data-grid-empty-icon')!;
    await expect([ring.offsetWidth, ring.offsetHeight]).toEqual([38, 38]);
    await expect(getComputedStyle(ring).borderRadius).toBe('50%');
    const funnel = ring.querySelector('svg')!;
    await expect([funnel.clientWidth, funnel.clientHeight]).toEqual([18, 18]);
    await expect(boxOf.rowGap).toBe('8px');
    const middle = content.getBoundingClientRect().left + content.getBoundingClientRect().width / 2;
    for (const part of [ring, content.querySelector('.flg-data-grid-empty-title')!, button()]) {
      const box = part.getBoundingClientRect();
      await expect(Math.abs(box.left + box.width / 2 - middle), part.className).toBeLessThan(1.5);
    }
    // The only stop of the table is the button.
    await expect(Array.from(stops())).toEqual([button()]);

    const real = await realUserEvent();
    if (!real) return;
    // Pressed on a title, the place is the title of Customer; ↓ reaches the button, ↑ leaves it for that title.
    const customer = titleOf(root!, 'Customer');
    await real.click(customer);
    await expect(customer).toHaveFocus();
    await real.keyboard('{ArrowDown}');
    await expect(button()).toHaveFocus();
    await expect(Array.from(stops())).toEqual([button()]);
    await real.keyboard('{ArrowUp}');
    await expect(customer).toHaveFocus();
    await real.keyboard('{ArrowDown}');
    await expect(button()).toHaveFocus();

    // Keys that move along a row have no neighbour to go to, and nothing scrolls.
    const page = [window.scrollX, window.scrollY];
    await real.keyboard('{ArrowLeft}{ArrowRight}{Home}{End}{ArrowDown}');
    await expect(button()).toHaveFocus();
    await expect([window.scrollX, window.scrollY]).toEqual(page);

    // One Tab leaves the grid (it has one stop), and Shift+Tab comes back to it.
    await real.tab();
    await expect(
      table.contains(document.activeElement),
      `focus is on ${document.activeElement?.outerHTML.slice(0, 160)}`,
    ).toBe(false);
    await real.tab({ shift: true });
    await expect(button()).toHaveFocus();

    // Enter presses the button: one change of the filter, the rows are back, the focus is on the first cell.
    await real.keyboard('{Enter}');
    await expect(args.onFilterChange).toHaveBeenCalledTimes(1);
    await expect(args.onFilterChange).toHaveBeenCalledWith({});
    await waitFor(
      () =>
        expect(
          table.querySelectorAll('tbody > tr.flg-data-grid-row').length,
          'the rows are back',
        ).toBe(SALES.length),
      RENDER_UPDATE,
    );
    await waitFor(
      () => expect(bodyCell(root!, 0, 0), 'the focus is on the first cell').toHaveFocus(),
      RENDER_UPDATE,
    );
    await expect(Array.from(stops())).toEqual([bodyCell(root!, 0, 0)]);
    await expect(root!.querySelector('.flg-data-grid-empty')).toBeNull();
  },
};

/**
 * Assignee's cell is the library's `cell` of the orders, drawn with `ctx.highlight`, so the search marks
 * what it finds in a custom cell as in the grid's own.
 */
const SEARCH_COLUMNS: DataGridColumn<Sale>[] = SALE_COLUMNS.map((column) =>
  column.field === 'assignee'
    ? {
        ...column,
        cell: ({ text, highlight }: DataGridCellContext<Sale, string>) => (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              verticalAlign: 'middle',
            }}
          >
            <Avatar size="sm" alt="" fallback={ASSIGNEES[text]} />
            {highlight(text)}
          </span>
        ),
      }
    : column,
);

/**
 * How long a story waits for the rows to show a search: 300 ms of the delay, then the engine's rendering
 * update, which Linux WebKit on x86 (CI) delivers late. A debounce is waited for, never slept through.
 */
const SEARCH_APPLIED = { timeout: 10000 };
/** The place of Assignee among the cells of a row. */
const ASSIGNEE_CELL = 2;

/**
 * The search field of the toolbar and the marks it leaves in the cells (spec phase 6 §4.3 F1). Typing
 * with real keys narrows the rows 300 ms after the last key, case and diacritics aside ("duong" finds
 * "Studio Ánh Dương"); every match is marked in the characters it has, in the grid's own cells and in a
 * custom cell that calls `ctx.highlight`, and no mark leaves its cell. Esc clears the field at once, and
 * Esc during a composition belongs to the input method.
 */
export const SearchingRows: Story = {
  tags: ['no-visual'],
  args: { searchPanel: true, columns: SEARCH_COLUMNS, caption: 'Orders', paging: false },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const table = root.querySelector<HTMLTableElement>('table[role="grid"]')!;
    const field = root.querySelector<HTMLInputElement>('input[type="search"]')!;
    const dataRows = () =>
      Array.from(table.querySelectorAll<HTMLElement>('tbody > tr.flg-data-grid-row'));
    const marks = () => Array.from(table.querySelectorAll<HTMLElement>('mark'));
    const everyRowHolds = (query: string) =>
      dataRows().every((row) => foldText(row.textContent ?? '').includes(foldText(query)));
    const unfiltered = dataRows().length;
    await expect(unfiltered).toBeGreaterThan(1);
    await expect(marks()).toHaveLength(0);

    // The field is 260px, or fills its row on a narrow screen, where the caption has the row to itself.
    const search = root.querySelector<HTMLElement>('.flg-data-grid-search')!;
    if (window.matchMedia('(max-width: 639.98px)').matches) {
      await expect(getComputedStyle(search).flexGrow).toBe('1');
      const caption = root.querySelector<HTMLElement>('.flg-data-grid-caption')!;
      await expect(caption.offsetWidth).toBeGreaterThanOrEqual(
        root.querySelector<HTMLElement>('.flg-data-grid-toolbar')!.clientWidth - 1,
      );
    } else {
      await expect(search.offsetWidth).toBe(260);
    }

    /** Every mark is the query, in the letters the text has, and inside the box of its own cell. */
    const marksAreInTheirCells = async (query: string) => {
      const found = marks();
      await expect(found.length, `no mark for "${query}"`).toBeGreaterThan(0);
      for (const mark of found) {
        await expect(foldText(mark.textContent ?? '')).toBe(foldText(query));
        const cell = mark.closest<HTMLElement>('td, th')!;
        await expect(cell, 'a mark outside a cell').not.toBeNull();
        const own = mark.getBoundingClientRect();
        const box = cell.getBoundingClientRect();
        await expect(
          own.left,
          `"${mark.textContent}" starts left of its cell`,
        ).toBeGreaterThanOrEqual(box.left - 1);
        await expect(own.right, `"${mark.textContent}" ends right of its cell`).toBeLessThanOrEqual(
          box.right + 1,
        );
        await expect(own.top).toBeGreaterThanOrEqual(box.top - 1);
        await expect(own.bottom).toBeLessThanOrEqual(box.bottom + 1);
      }
    };

    const real = await realUserEvent();
    if (!real) return;

    // "minh" is in the assignee Nguyễn Minh Anh, a custom cell, and in a customer: the rows narrow to those,
    // and both kinds of cell mark it.
    await real.click(field);
    await expect(field).toHaveFocus();
    await real.keyboard('minh');
    await expect(field).toHaveValue('minh');
    await waitFor(() => {
      expect(dataRows().length, 'the rows are narrowed').toBeLessThan(unfiltered);
      expect(everyRowHolds('minh'), 'every row holds "minh"').toBe(true);
    }, SEARCH_APPLIED);
    await marksAreInTheirCells('minh');
    await expect(
      marks().some((mark) => mark.closest('td')?.cellIndex === ASSIGNEE_CELL),
      'the custom cell of Assignee marks the match through ctx.highlight',
    ).toBe(true);

    // The parts of a marked text are one item of a flex parent (the cell's own inline-flex box), so the
    // spaces around the mark are ordinary ones, not a gap of the box: the text before and after it
    // touches the mark, with its space, within 6px.
    const mark = marks().find((m) => m.closest('td')?.cellIndex === ASSIGNEE_CELL)!;
    const markBox = mark.getBoundingClientRect();
    const before = mark.previousSibling as Text;
    const after = mark.nextSibling as Text;
    const edge = (node: Text) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect();
    };
    const gapBefore = markBox.left - edge(before).right;
    const gapAfter = edge(after).left - markBox.right;
    await expect(gapBefore, `${gapBefore}px before the mark`).toBeLessThan(6);
    await expect(gapAfter, `${gapAfter}px after the mark`).toBeLessThan(6);

    // Esc during a composition is the input method's: the text and the rows stay.
    const narrowed = dataRows().length;
    field.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        isComposing: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    await expect(field).toHaveValue('minh');
    await expect(dataRows()).toHaveLength(narrowed);

    // Esc clears the field and the search at once.
    await real.keyboard('{Escape}');
    await expect(field).toHaveValue('');
    await waitFor(() => {
      expect(dataRows().length, 'the rows are back').toBe(unfiltered);
      expect(marks(), 'the marks are gone').toHaveLength(0);
    }, SEARCH_APPLIED);

    // "duong" finds "Dương" in a customer: the diacritics are folded, the mark has the letters of the text.
    await real.keyboard('duong');
    await waitFor(() => {
      expect(dataRows().length, 'the rows are narrowed').toBeLessThan(unfiltered);
      expect(everyRowHolds('duong'), 'every row holds "duong"').toBe(true);
    }, SEARCH_APPLIED);
    await marksAreInTheirCells('duong');
    await expect(marks().map((mark) => mark.textContent)).toContain('Dương');
  },
};

// ---- The filter row (spec phase 6 §3.6, §4.3 F1) ---------------------------------------------------

/**
 * The columns of the stories of the filter row: the orders' own, with Status a lookup, which the filter row
 * draws as a Select ("(All)", New, Processing, Delivered).
 */
const FILTER_COLUMNS: DataGridColumn<Sale>[] = SALE_COLUMNS.map((column) =>
  column.field === 'status'
    ? {
        ...column,
        lookup: {
          items: [
            { id: 'new', name: 'New' },
            { id: 'processing', name: 'Processing' },
            { id: 'delivered', name: 'Delivered' },
          ],
          valueField: 'id',
          displayField: 'name',
        },
      }
    : column,
);

/**
 * How long a story waits for the filter row to apply what it was given: the 400 ms of its delay, then the
 * commit and the rows that follow in the engine's next rendering updates, which Linux WebKit on x86 (CI)
 * delivers late. A debounce is waited for with a timeout, never slept through.
 */
const FILTER_APPLIED = { timeout: 10000 };
/**
 * How long a story waits for a popup of the filter row: the listbox of a Select fades in from `opacity: 0`,
 * which the same engine takes up to ten seconds over (`KeysInPopup` of `DataGrid.stories.tsx`).
 */
const POPUP_SHOWN = { timeout: 10000 };
/** How long a story waits for the grid to hear a scroll it made (`SCROLL_EVENT` of the column stories). */
const SCROLL_EVENT = { timeout: 5000 };
/**
 * How far the panel of a filter popover sits under what opened it, as F1 draws its Status popover: the top of
 * the panel 12.21px under the bottom of the funnel (measured in the approved page, in a real engine).
 */
const F1_GAP = 12.21;

const filterCellOf = (root: HTMLElement, caption: string) => {
  const at = Array.from(root.querySelectorAll('thead > tr:first-child > th')).findIndex((th) =>
    th.textContent?.startsWith(caption),
  );
  return root.querySelectorAll<HTMLElement>('thead > tr.flg-data-grid-filter-row > td')[at]!;
};
const operatorMenuOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('.flg-data-grid-operator-menu')!;
const dataRowsOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>('tbody > tr.flg-data-grid-row'));

/**
 * A press on a title's sort button while the filter popover is open: the browser closes the popover at
 * the press (light dismiss), the click sorts, and the grid draws again before the `toggle` of that close.
 * The popover must stay closed, the column sorted, and the focus on the title.
 */
async function sortWhileThePopoverIsOpen(
  root: HTMLElement,
  real: NonNullable<Awaited<ReturnType<typeof realUserEvent>>>,
  caption: string,
) {
  const popover = root.querySelector<HTMLElement>('.flg-data-grid-filter-popover')!;
  await expect(popover.matches(':popover-open'), 'the popover is open before the press').toBe(true);
  const title = titleOf(root, caption);
  await real.click(title.querySelector<HTMLElement>('.flg-table-sort')!);
  await waitFor(
    () =>
      expect(title, 'the grid is sorted by that title').toHaveAttribute('aria-sort', 'ascending'),
    RENDER_UPDATE,
  );
  await waitFor(
    () => expect(popover.matches(':popover-open'), 'the popover is closed').toBe(false),
    POPUP_SHOWN,
  );
  // The popover of the bug came back a rendering update after the press: give it frames to do so.
  await settled(popover);
  await expect(popover.matches(':popover-open'), 'the popover stays closed').toBe(false);
  await expect(title, 'the focus is on the title that was pressed').toHaveFocus();
}

const filterRowKeys: NonNullable<Story['play']> = async ({ canvasElement, args }) => {
  const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
  const table = root.querySelector<HTMLTableElement>('table[role="grid"]')!;
  const frame = root.querySelector<HTMLElement>('.flg-data-grid-frame')!;
  const stops = () => Array.from(table.querySelectorAll<HTMLElement>('[tabindex="0"]'));
  const customer = filterCellOf(root, 'Customer');
  const status = filterCellOf(root, 'Status');
  const real = await realUserEvent();
  if (!real) return;
  const mod = navigator.platform.startsWith('Mac') ? 'Meta' : 'Control';
  await noTitleIsCut(root);
  const unfiltered = dataRowsOf(root).length;
  await expect(table.tHead!.rows).toHaveLength(2);

  // ↑ from the first row goes into the filter row and then to the titles, keeping the column; ↓ goes back.
  // Nothing scrolls on the way, and the table has the one stop where the keyboard is.
  await real.click(bodyCell(root, 0, 1));
  await expect(bodyCell(root, 0, 1)).toHaveFocus();
  const page = [document.scrollingElement?.scrollTop, frame.scrollTop];
  await real.keyboard('{ArrowUp}');
  await expect(customer).toHaveFocus();
  await expect(stops()).toEqual([customer]);
  await real.keyboard('{ArrowUp}');
  await expect(titleOf(root, 'Customer')).toHaveFocus();
  await expect(stops()).toEqual([titleOf(root, 'Customer')]);
  await real.keyboard('{ArrowDown}{ArrowDown}');
  await expect(bodyCell(root, 0, 1)).toHaveFocus();
  await expect([document.scrollingElement?.scrollTop, frame.scrollTop]).toEqual(page);
  await real.keyboard('{ArrowUp}');
  await expect(customer).toHaveFocus();

  // Enter goes into the input, not the operator button; typing narrows the rows after the delay, once.
  await real.keyboard('{Enter}');
  const input = customer.querySelector<HTMLInputElement>('input')!;
  await expect(input).toHaveFocus();
  await real.keyboard('minh');
  await expect(input).toHaveValue('minh');
  await waitFor(() => {
    expect(
      args.onFilterChange,
      'the filter is applied once the delay is out',
    ).toHaveBeenCalledTimes(1);
    expect(dataRowsOf(root).length, 'the rows are narrowed').toBeLessThan(unfiltered);
  }, FILTER_APPLIED);
  await expect(args.onFilterChange).toHaveBeenLastCalledWith({
    columns: { customer: { value: 'minh' } },
  });
  await expect(
    customer.querySelector('.flg-data-grid-operator'),
    'the operator of a column that filters is accented',
  ).toHaveAttribute('data-active');
  // Esc clears what the input holds and applies that at once; the next Esc goes back to the cell.
  await real.keyboard('{Escape}');
  await expect(input).toHaveValue('');
  await expect(input).toHaveFocus();
  await waitFor(() => {
    expect(dataRowsOf(root).length, 'the rows are back').toBe(unfiltered);
  }, FILTER_APPLIED);
  await real.keyboard('{Escape}');
  await expect(customer).toHaveFocus();
  // Tab goes from the input to the operator button and round; Esc comes back to the cell.
  await real.keyboard('{Enter}{Tab}');
  await expect(customer.querySelector('.flg-data-grid-operator')).toHaveFocus();
  await real.keyboard('{Escape}');
  await expect(customer).toHaveFocus();
  await expect(stops()).toEqual([customer]);

  // Along the row to Status, whose Select is the value control: Enter goes into it, Enter opens it.
  await real.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
  await expect(status).toHaveFocus();
  await real.keyboard('{Enter}');
  const trigger = status.querySelector<HTMLElement>('[role="combobox"]')!;
  await expect(trigger).toHaveFocus();
  await real.keyboard('{Enter}');
  await waitFor(
    () => expect(trigger, 'the listbox is open').toHaveAttribute('aria-expanded', 'true'),
    POPUP_SHOWN,
  );
  const listbox = status.querySelector<HTMLElement>('[role="listbox"]')!;
  await waitFor(
    () => expect(getComputedStyle(listbox).opacity, 'the listbox has faded in').toBe('1'),
    POPUP_SHOWN,
  );
  // The keys stay in the listbox: ↓ moves its highlight, and the grid stays where it was.
  await real.keyboard('{ArrowDown}');
  await expect(stops()).toEqual([status]);
  // Esc closes the listbox and no more: the Select keeps the focus, and the grid does not take the key.
  await real.keyboard('{Escape}');
  await waitFor(
    () => expect(trigger, 'the listbox is closed').toHaveAttribute('aria-expanded', 'false'),
    POPUP_SHOWN,
  );
  await expect(trigger).toHaveFocus();
  await real.keyboard('{Escape}');
  await expect(status).toHaveFocus();
  // A choice applies at once with "=", and the rows are those of the status.
  (args.onFilterChange as ReturnType<typeof fn>).mockClear();
  await real.keyboard('{Enter}{Enter}');
  await waitFor(
    () => expect(trigger, 'the listbox is open').toHaveAttribute('aria-expanded', 'true'),
    POPUP_SHOWN,
  );
  await real.keyboard('{ArrowDown}{Enter}');
  await waitFor(() => {
    expect(args.onFilterChange).toHaveBeenCalledTimes(1);
    expect(dataRowsOf(root).length, 'the rows are those of one status').toBeLessThan(unfiltered);
  }, FILTER_APPLIED);
  await expect(args.onFilterChange).toHaveBeenLastCalledWith({
    columns: { status: { operator: '=', value: 'new' } },
  });
  await expect(trigger).toHaveTextContent('New');

  // The keys of the whole grid still reach the rows from the filter row: mod+End is the last cell of the
  // last row, mod+Home the first cell of the first.
  await real.keyboard('{Escape}');
  await expect(status).toHaveFocus();
  await real.keyboard(`{${mod}>}{End}{/${mod}}`);
  await expect(dataRowsOf(root).at(-1)!.lastElementChild).toHaveFocus();
  await real.keyboard(`{${mod}>}{Home}{/${mod}}`);
  await expect(dataRowsOf(root)[0]!.firstElementChild).toHaveFocus();
  await noTitleIsCut(root);
};

const FilterRowGrid = (props: Partial<DataGridProps<Sale>>) => (
  <div style={{ width: 1100 }}>
    <DataGrid
      aria-label="Orders"
      data={SALES}
      rowKey="id"
      columns={FILTER_COLUMNS}
      locale="vi-VN"
      filterRow
      paging={false}
      height={360}
      {...props}
    />
  </div>
);

/**
 * The keys of the filter row, in each engine and on both platforms: ↑ from the first row goes into the
 * filter row and then to the titles, ↓ comes back, and nothing scrolls; Enter goes into Customer's input
 * (not into its operator), typing narrows the rows once after the delay, Esc clears the text and applies
 * that at once, and the next Esc is the grid's; Tab goes from the input to the operator and Esc comes back.
 * On Status, Enter goes into the Select and opens its listbox, whose keys stay in it, Esc closes it before
 * the grid takes Esc, and a choice applies at once with "="; mod+End and mod+Home still reach the rows. The
 * table has the one stop where the keyboard is.
 */
export const FilterRowKeys: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  args: { onFilterChange: fn() },
  render: (args) => <FilterRowGrid onFilterChange={args.onFilterChange} />,
  play: filterRowKeys,
};

export const FilterRowKeysOnAMac: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('apple'),
  args: { onFilterChange: fn() },
  render: (args) => <FilterRowGrid onFilterChange={args.onFilterChange} />,
  play: filterRowKeys,
};

const PINNED_FILTER_COLUMNS = FILTER_COLUMNS.map((column) =>
  'field' in column && column.field === 'id' ? { ...column, pinned: 'left' as const } : column,
);

/**
 * The filter row beside a pinned column, scrolled sideways: Order's filter cell sticks at the left edge
 * with its title (the same box left, solid, not see-through), the shadow of the edge is drawn once, from the
 * top of the titles, and not a second time from the filter row; the heading is as tall as its two rows and
 * the frame scrolls its rows under it. Opening the operator menu of Assignee scrolls neither the page nor
 * the frame.
 */
export const FilterRowPinned: Story = {
  tags: ['no-visual'],
  render: () => <FilterRowGrid columns={PINNED_FILTER_COLUMNS} style={{ width: 620 }} />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const frame = root.querySelector<HTMLElement>('.flg-data-grid-frame')!;
    const table = root.querySelector<HTMLTableElement>('table[role="grid"]')!;
    await waitFor(() => expect(frame.clientHeight).toBeGreaterThan(100));
    await expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth + 400);
    const order = filterCellOf(root, 'Order');
    const orderTitle = titleOf(root, 'Order');
    await expect(order).toHaveAttribute('data-pinned', 'left');
    await expect(order).toHaveAttribute('data-pin-edge');

    // Scrolled sideways: the pinned cells have not moved, and the frame says so.
    frame.scrollLeft = 200;
    await waitFor(
      () => expect(frame.hasAttribute('data-scrolled-left'), 'the frame is scrolled').toBe(true),
      SCROLL_EVENT,
    );
    const edge = frame.getBoundingClientRect().left + frame.clientLeft;
    await expect(Math.abs(order.getBoundingClientRect().left - edge)).toBeLessThanOrEqual(1);
    await expect(order.getBoundingClientRect().left).toBeCloseTo(
      orderTitle.getBoundingClientRect().left,
      0,
    );
    // Solid: the rows that scroll under it do not show through.
    await expect(getComputedStyle(order).backgroundImage).not.toBe('none');
    // The filter row is under the titles and both stick: the frame scrolled its rows, not the heading.
    frame.scrollTop = 120;
    await waitFor(() => expect(frame.scrollTop).toBeGreaterThan(0), SCROLL_EVENT);
    await expect(
      Math.abs(order.getBoundingClientRect().top - orderTitle.getBoundingClientRect().bottom),
    ).toBeLessThanOrEqual(1);
    await expect(
      Math.abs(table.tHead!.getBoundingClientRect().top - frame.getBoundingClientRect().top),
    ).toBeLessThanOrEqual(frame.clientTop + 1);
    // The shadow beside the zone is the title's alone: the filter cell draws none.
    await expect(getComputedStyle(orderTitle, '::after').content).not.toBe('none');
    await expect(getComputedStyle(order, '::after').content).toBe('none');

    // Opening the operator menu of Assignee, whose button is clear of the pinned zone, scrolls nothing (a
    // button under the zone would be brought into view by the browser: that is no menu's scroll).
    const real = await realUserEvent();
    if (!real) return;
    const scrolls = () => [
      document.scrollingElement?.scrollTop,
      document.scrollingElement?.scrollLeft,
      frame.scrollTop,
      frame.scrollLeft,
    ];
    const before = scrolls();
    await real.click(filterCellOf(root, 'Assignee').querySelector('.flg-data-grid-operator')!);
    await waitFor(
      () => expect(operatorMenuOf(root).matches(':popover-open')).toBe(true),
      POPUP_SHOWN,
    );
    await expect(scrolls()).toEqual(before);
    await real.keyboard('{Escape}');
    await waitFor(
      () => expect(operatorMenuOf(root).matches(':popover-open')).toBe(false),
      POPUP_SHOWN,
    );
  },
};

/**
 * A choice in the operator menu that swaps the cell's control (to `between` and back, which remounts the
 * operator button), in each engine: the menu closes, the filter is applied, and the focus is on the new
 * operator button of the same cell, never on `<body>` or on the menu that has gone; by a press and by keys.
 */
export const FilterOperatorCrossing: Story = {
  tags: ['no-visual'],
  render: () => (
    <FilterRowGrid defaultFilter={{ columns: { qty: { operator: '>', value: 12 } } }} />
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const real = await realUserEvent();
    if (!real) return;
    const operatorOf = () =>
      filterCellOf(root, 'Qty').querySelector<HTMLButtonElement>('.flg-data-grid-operator')!;
    const choose = async (name: string, by: 'press' | 'keys') => {
      await real.click(operatorOf());
      await waitFor(
        () => expect(operatorMenuOf(root).matches(':popover-open'), 'the menu is open').toBe(true),
        POPUP_SHOWN,
      );
      const item = within(operatorMenuOf(root)).getByRole('menuitemradio', { name });
      if (by === 'press') {
        await real.click(item);
      } else {
        item.focus();
        await real.keyboard('{Enter}');
      }
      await waitFor(
        () =>
          expect(operatorMenuOf(root).matches(':popover-open'), 'the menu is closed').toBe(false),
        POPUP_SHOWN,
      );
    };
    await choose('Between', 'press');
    await waitFor(
      () => expect(operatorOf(), 'the new operator button has the focus').toHaveFocus(),
      RENDER_UPDATE,
    );
    await expect(operatorOf()).toHaveAttribute('aria-label', 'Operator: Between');
    await choose('Greater than', 'keys');
    await waitFor(
      () => expect(operatorOf(), 'the new operator button has the focus').toHaveFocus(),
      RENDER_UPDATE,
    );
    await expect(operatorOf()).toHaveAttribute('aria-label', 'Operator: Greater than');
    await choose('Between', 'keys');
    await waitFor(
      () => expect(operatorOf(), 'the new operator button has the focus').toHaveFocus(),
      RENDER_UPDATE,
    );
  },
};

/**
 * The menu of operators of Customer's filter cell, opened with the keyboard (outside the mockup, spec phase
 * 6 §4.3 F1 "Menu toán tử"): the grid has the filter row only, no funnels, Customer holds "công ty" (its
 * operator accented), and the menu hangs under the button with "Contains" checked and highlighted. The
 * wrapper reserves the room of the menu, which the harness (it shoots the stage) would otherwise cut, and
 * the play asserts that the menu ends inside the stage.
 */
export const FilterOperatorMenu: Story = {
  tags: ['viewport-1440x720'],
  render: () => (
    <div className="fo-look" style={{ width: 1332, minHeight: 560 }}>
      <style>{'.fo-look .flg-table-frame { scrollbar-width: none; }'}</style>
      <Card>
        <DataGrid
          aria-label="Orders"
          caption="Orders"
          data={SALES.slice(0, 8)}
          rowKey="id"
          columns={FILTER_COLUMNS}
          locale="vi-VN"
          filterRow
          paging={false}
          defaultFilter={{ columns: { customer: { value: 'công ty' } } }}
        />
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    await noTitleIsCut(root);
    const button = filterCellOf(root, 'Customer').querySelector<HTMLElement>(
      '.flg-data-grid-operator',
    )!;
    await expect(button).toHaveAttribute('data-active');
    // The boxes of the mockup's filter row (F1): a cell of 6px above and below its field (the small field
    // is 28px) and 5px at the sides, 8px at the start of the row and at the end of the last real cell; the
    // field has the button 3px from its edge and 4px from the text; the button is 20px with a glyph of 13px.
    const cell = filterCellOf(root, 'Customer');
    const style = getComputedStyle(cell);
    await expect([
      style.paddingTop,
      style.paddingBottom,
      style.paddingLeft,
      style.paddingRight,
    ]).toEqual(['6px', '6px', '5px', '5px']);
    const cells = Array.from(root.querySelectorAll<HTMLElement>('.flg-data-grid-filter-cell'));
    await expect(getComputedStyle(cells[0]!).paddingLeft).toBe('8px');
    await expect(getComputedStyle(cells.at(-1)!).paddingRight).toBe('8px');
    const field = cell.querySelector<HTMLElement>('.flg-input')!;
    const fieldStyle = getComputedStyle(field);
    await expect([field.offsetHeight, fieldStyle.columnGap, fieldStyle.paddingLeft]).toEqual([
      28,
      '4px',
      '3px',
    ]);
    await expect([button.offsetWidth, button.offsetHeight]).toEqual([20, 20]);
    const sign = button.querySelector('svg')!;
    await expect([sign.clientWidth, sign.clientHeight]).toEqual([13, 13]);
    // Opened with the keyboard: the button has the focus, Enter presses it.
    button.focus();
    await userEvent.keyboard('{Enter}');
    const menu = operatorMenuOf(root);
    await waitFor(
      () => expect(menu.matches(':popover-open'), 'the menu is open').toBe(true),
      POPUP_SHOWN,
    );
    const checked = menu.querySelector<HTMLElement>('[role="menuitemradio"][aria-checked="true"]')!;
    await expect(checked).toHaveTextContent('Contains');
    await waitFor(
      () => expect(checked, 'the checked item has the focus').toHaveFocus(),
      POPUP_SHOWN,
    );
    await settled(menu);
    // Under its button, and inside the stage that the harness shoots.
    await expect(menu.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      button.getBoundingClientRect().bottom,
    );
    const stage = canvasElement.querySelector<HTMLElement>('[data-testid="flg-stage"]')!;
    const room =
      stage.getBoundingClientRect().bottom - parseFloat(getComputedStyle(stage).paddingBottom);
    await expect(
      menu.getBoundingClientRect().bottom,
      'the menu ends inside the stage',
    ).toBeLessThanOrEqual(room);
    await expect(menu.querySelectorAll('[role="menuitemradio"]')).toHaveLength(6);
    // Each item is its dot, a glyph of 15px and its words: the glyph is 15x15, after the dot slot and before
    // the words, one icon gap (the item's own gap) from each, in the colour of the menu's other icons.
    for (const item of menu.querySelectorAll<HTMLElement>('[role="menuitemradio"]')) {
      const [dot, slot] = Array.from(item.querySelectorAll<HTMLElement>('.flg-menu-item-icon'));
      const glyph = slot!.querySelector<SVGElement>('svg')!;
      const box = glyph.getBoundingClientRect();
      await expect(Math.abs(box.width - 15), `glyph width ${box.width}`).toBeLessThanOrEqual(0.5);
      await expect(Math.abs(box.height - 15), `glyph height ${box.height}`).toBeLessThanOrEqual(
        0.5,
      );
      const gap = parseFloat(getComputedStyle(item).columnGap);
      const dotBox = dot!.getBoundingClientRect();
      const words = document.createRange();
      words.selectNodeContents(item.lastChild!);
      await expect(
        Math.abs(slot!.getBoundingClientRect().left - dotBox.right - gap),
      ).toBeLessThanOrEqual(0.5);
      await expect(
        Math.abs(words.getBoundingClientRect().left - slot!.getBoundingClientRect().right - gap),
      ).toBeLessThanOrEqual(0.5);
      await expect(getComputedStyle(slot!).color).toBe(getComputedStyle(dot!).color);
    }
  },
};

/** The orders of one day, as the filter of a date applies them. */
const salesOn = (day: string) => SALES.filter((sale) => sale.date === day).length;

/** What the page and the frame are scrolled to: a popup that opens must change none of them. */
const scrollsOf = (frame: HTMLElement) => [
  document.scrollingElement?.scrollTop,
  document.scrollingElement?.scrollLeft,
  frame.scrollTop,
  frame.scrollLeft,
];

const PINNED_DATE_COLUMNS = FILTER_COLUMNS.map((column) =>
  'field' in column && column.field === 'date' ? { ...column, pinned: 'left' as const } : column,
);

/**
 * Text that is no day in the date cell, in each engine: leaving it takes the condition away once and leaves
 * the text with the picker's own fault (`aria-invalid`); Esc with text clears it, and the focus stays in the
 * field, which is a new one.
 */
export const FilterDateText: Story = {
  tags: ['no-visual'],
  args: { onFilterChange: fn() },
  render: (args) => (
    <FilterRowGrid
      defaultFilter={{ columns: { date: { value: '2026-11-10' } } }}
      onFilterChange={args.onFilterChange}
    />
  ),
  play: async ({ canvasElement, args }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const real = await realUserEvent();
    if (!real) return;
    const cell = filterCellOf(root, 'Order date');
    const input = () => cell.querySelector<HTMLInputElement>('.flg-date-picker input')!;
    await expect(dataRowsOf(root)).toHaveLength(salesOn('2026-11-10'));
    await real.click(input());
    await real.fill(input(), 'not a day');
    // Leaving for another field: a picker that loses the focus to nowhere may be a window switch.
    await real.click(filterCellOf(root, 'Customer').querySelector('input')!);
    await waitFor(() => {
      expect(args.onFilterChange).toHaveBeenCalledTimes(1);
      expect(dataRowsOf(root), 'every row is back').toHaveLength(SALES.length);
    }, FILTER_APPLIED);
    await expect(args.onFilterChange).toHaveBeenLastCalledWith({});
    await expect(input()).toHaveValue('not a day');
    await expect(input()).toHaveAttribute('aria-invalid', 'true');
    await expect(args.onFilterChange).toHaveBeenCalledTimes(1);
    // Esc with text clears it; the field that takes its place has the focus.
    await real.click(input());
    await real.keyboard('{Escape}');
    await waitFor(() => {
      expect(input(), 'the text is cleared').toHaveValue('');
      expect(input(), 'the field has the focus').toHaveFocus();
    }, RENDER_UPDATE);
    await expect(input()).not.toHaveAttribute('aria-invalid', 'true');
    await expect(args.onFilterChange).toHaveBeenCalledTimes(1);
  },
};

/**
 * The date cell of the filter row (spec phase 6 §4.3 F1, §6.3), in a heading that sticks and pins: its boxes
 * (the operator's button 20px at the start of the field, the calendar's button 20px with a glyph of 14px at
 * the end), a typed day that applies on Enter, the calendar that opens under the field of the pinned cell
 * with the frame scrolled sideways and scrolls neither the page nor the frame, its keys that stay in it (the
 * grid keeps its one stop), Esc that closes the calendar before the grid takes Esc, and a day chosen by the
 * keys that applies at once.
 */
export const FilterDates: Story = {
  tags: ['no-visual'],
  args: { onFilterChange: fn() },
  render: (args) => (
    <FilterRowGrid
      columns={PINNED_DATE_COLUMNS}
      style={{ width: 620 }}
      onFilterChange={args.onFilterChange}
    />
  ),
  play: async ({ canvasElement, args }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const frame = root.querySelector<HTMLElement>('.flg-data-grid-frame')!;
    const table = root.querySelector<HTMLTableElement>('table[role="grid"]')!;
    // The one stop of the grid: the calendar's own roving day is a stop of its popup, not of the table.
    const stops = () =>
      Array.from(table.querySelectorAll<HTMLElement>('[tabindex="0"]')).filter(
        (element) => element.closest('[popover]') === null,
      );
    await waitFor(() => expect(frame.clientHeight).toBeGreaterThan(100));
    const cell = filterCellOf(root, 'Order date');
    await expect(cell).toHaveAttribute('data-pinned', 'left');
    const picker = cell.querySelector<HTMLElement>('.flg-date-picker .flg-input')!;
    // The field is made anew when Esc clears its text (see below), so it is read again there.
    let input = picker.querySelector<HTMLInputElement>('input')!;
    const calendarButton = picker.querySelector<HTMLElement>('.flg-date-picker-button')!;
    const operator = picker.querySelector<HTMLElement>('.flg-data-grid-operator')!;

    // The boxes of the approved crop: a field of 28px, the operator's button 20px 3px from the start edge and
    // 4px from the text, the calendar's button 20px with a glyph of 14px, 4px outside the field's padding.
    await expect(picker.offsetHeight).toBe(28);
    await expect([operator.offsetWidth, operator.offsetHeight]).toEqual([20, 20]);
    await expect([calendarButton.offsetWidth, calendarButton.offsetHeight]).toEqual([20, 20]);
    const glyph = calendarButton.querySelector('svg')!;
    await expect([glyph.clientWidth, glyph.clientHeight]).toEqual([14, 14]);
    const frameBox = picker.getBoundingClientRect();
    const toStart = operator.getBoundingClientRect().left - frameBox.left - picker.clientLeft;
    await expect(Math.abs(toStart - 3)).toBeLessThanOrEqual(0.5);
    const gapToText = input.getBoundingClientRect().left - operator.getBoundingClientRect().right;
    await expect(Math.abs(gapToText - 4)).toBeLessThanOrEqual(0.5);
    await noTitleIsCut(root);

    const real = await realUserEvent();
    if (!real) return;
    const unfiltered = dataRowsOf(root).length;
    // A typed day applies when Enter is pressed, with "=".
    await real.click(input);
    await real.keyboard('10/11/2026{Enter}');
    await waitFor(() => {
      expect(args.onFilterChange).toHaveBeenCalledTimes(1);
      expect(dataRowsOf(root).length, 'the rows are those of the day').toBe(salesOn('2026-11-10'));
    }, FILTER_APPLIED);
    await expect(args.onFilterChange).toHaveBeenLastCalledWith({
      columns: { date: { value: '2026-11-10' } },
    });
    await expect(salesOn('2026-11-10')).toBeLessThan(unfiltered);
    await expect(operator).toHaveAttribute('data-active');

    // The calendar opens under the field of the pinned cell, the frame scrolled sideways, and scrolls nothing.
    frame.scrollLeft = 150;
    await waitFor(
      () => expect(frame.hasAttribute('data-scrolled-left'), 'the frame is scrolled').toBe(true),
      SCROLL_EVENT,
    );
    const before = scrollsOf(frame);
    await real.click(calendarButton);
    const popup = cell.querySelector<HTMLElement>('.flg-date-picker-popup')!;
    await waitFor(
      () => expect(popup.matches(':popover-open'), 'the calendar is open').toBe(true),
      POPUP_SHOWN,
    );
    await settled(popup);
    const placed = popup.getBoundingClientRect();
    const under = picker.getBoundingClientRect();
    await expect(placed.top, 'under the field').toBeGreaterThanOrEqual(under.bottom);
    await expect(placed.top - under.bottom, 'close under the field').toBeLessThan(24);
    await expect(Math.abs(placed.left - under.left), 'from the start of the field').toBeLessThan(2);
    await expect(placed.bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect(scrollsOf(frame)).toEqual(before);

    // The focus is on a day of the calendar, and its keys stay in it: → moves to the next day and the grid
    // keeps its one stop, the cell.
    const day = () => document.activeElement as HTMLElement;
    await waitFor(
      () => expect(day().dataset.date, 'the chosen day has the focus').toBe('2026-11-10'),
      POPUP_SHOWN,
    );
    await real.keyboard('{ArrowRight}');
    await expect(day().dataset.date).toBe('2026-11-11');
    await expect(stops()).toEqual([cell]);
    // Esc closes the calendar and no more: the field has the focus again, and the grid did not take the key.
    await real.keyboard('{Escape}');
    await waitFor(
      () => expect(popup.matches(':popover-open'), 'the calendar is closed').toBe(false),
      POPUP_SHOWN,
    );
    await expect(input).toHaveFocus();
    await expect(stops()).toEqual([cell]);
    // The next Esc finds text in the field, so it clears it and applies that, as the other cells do (the
    // field is made anew, and has the focus); the one after, with no text, is the grid's: back to the cell.
    await real.keyboard('{Escape}');
    await waitFor(() => {
      expect(args.onFilterChange, 'the clear is applied').toHaveBeenCalledTimes(2);
      input = cell.querySelector<HTMLInputElement>('.flg-date-picker input')!;
      expect(input, 'the new field has the focus').toHaveFocus();
    }, FILTER_APPLIED);
    await expect(args.onFilterChange).toHaveBeenLastCalledWith({});
    await expect(input).toHaveValue('');
    await real.keyboard('{Escape}');
    await expect(cell).toHaveFocus();

    // A day chosen with the keys applies at once: Enter goes into the field, where the 10th is typed again,
    // Alt+↓ opens the calendar on it, → and Enter choose the 11th.
    await real.keyboard('{Enter}');
    await expect(input).toHaveFocus();
    await real.keyboard('10/11/2026{Enter}');
    await waitFor(
      () => expect(args.onFilterChange, 'the 10th is applied again').toHaveBeenCalledTimes(3),
      FILTER_APPLIED,
    );
    (args.onFilterChange as ReturnType<typeof fn>).mockClear();
    await real.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await waitFor(
      () => expect(day().dataset.date, 'the calendar is open on the held day').toBe('2026-11-10'),
      POPUP_SHOWN,
    );
    await real.keyboard('{ArrowRight}{Enter}');
    await waitFor(() => {
      expect(args.onFilterChange).toHaveBeenCalledTimes(1);
      expect(dataRowsOf(root).length, 'the rows are those of the 11th').toBe(salesOn('2026-11-11'));
    }, FILTER_APPLIED);
    await expect(args.onFilterChange).toHaveBeenLastCalledWith({
      columns: { date: { value: '2026-11-11' } },
    });
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue('11/11/2026');
  },
};

/**
 * The range of `between` (spec phase 6 §6.3), by keys and in each engine: the Qty cell, whose operator is
 * `between`, is a field that Enter goes into and Enter opens the one popover of the grid under; it holds its
 * two ends, the first with the focus, and opening it scrolls neither the page nor the frame. Typing both
 * ends and Enter applies the range (the rows between, ends included) and the focus goes back to the field;
 * Esc closes it and changes nothing; Tab past OK and Shift+Tab before the first end close it as Cancel and
 * give the focus back to the field; a press on a title's sort button closes it, sorts, and it does not come
 * back.
 */
export const FilterBetween: Story = {
  tags: ['no-visual'],
  args: { onFilterChange: fn() },
  render: (args) => (
    <FilterRowGrid
      defaultFilter={{ columns: { qty: { operator: 'between' } } }}
      onFilterChange={args.onFilterChange}
    />
  ),
  play: async ({ canvasElement, args }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const frame = root.querySelector<HTMLElement>('.flg-data-grid-frame')!;
    const table = root.querySelector<HTMLTableElement>('table[role="grid"]')!;
    const stops = () => Array.from(table.querySelectorAll<HTMLElement>('[tabindex="0"]'));
    const cell = filterCellOf(root, 'Qty');
    const field = cell.querySelector<HTMLInputElement>('[role="combobox"]')!;
    const popover = () => root.querySelector<HTMLElement>('.flg-data-grid-filter-popover')!;
    const isOpen = () => popover().matches(':popover-open');
    await expect(field).toHaveAttribute('readonly');
    await expect(field).toHaveAttribute('placeholder', 'From – to');
    await expect(
      getComputedStyle(field).textAlign,
      'a number is written from the end of its field',
    ).toMatch(/^(end|right)$/);
    await noTitleIsCut(root);

    const real = await realUserEvent();
    if (!real) return;
    const unfiltered = dataRowsOf(root).length;
    const mod = navigator.platform.startsWith('Mac') ? 'Meta' : 'Control';
    // From the first row, ↑ goes to the Qty cell of the filter row; Enter goes into the field.
    await real.click(bodyCell(root, 0, 6));
    await real.keyboard('{ArrowUp}');
    await expect(cell).toHaveFocus();
    await real.keyboard('{Enter}');
    await expect(field).toHaveFocus();

    // Enter opens the popover under the field: its first end has the focus, nothing scrolled, and the grid
    // keeps its one stop.
    const before = scrollsOf(frame);
    await real.keyboard('{Enter}');
    await waitFor(() => expect(isOpen(), 'the popover is open').toBe(true), POPUP_SHOWN);
    await settled(popover());
    // The popover draws its content only while it is open: each opening has its own fields.
    const end = (name: 'From' | 'To') => within(popover()).getByRole('textbox', { name });
    await waitFor(
      () => expect(end('From'), 'the first end has the focus').toHaveFocus(),
      POPUP_SHOWN,
    );
    await expect(popover()).toHaveAttribute('aria-label', 'Filter Qty');
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    const under = field.closest('.flg-input')!.getBoundingClientRect();
    const placed = popover().getBoundingClientRect();
    await expect(placed.top, 'under the field').toBeGreaterThanOrEqual(under.bottom);
    await expect(
      Math.abs(placed.top - under.bottom - F1_GAP),
      "F1's distance under the field",
    ).toBeLessThan(0.5);
    await expect(placed.bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect(placed.width).toBe(216);
    await expect(scrollsOf(frame)).toEqual(before);
    await expect(stops()).toEqual([cell]);

    // Esc closes it and changes nothing; the focus is back on the field.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isOpen(), 'the popover is closed').toBe(false), POPUP_SHOWN);
    await expect(field).toHaveFocus();
    await expect(args.onFilterChange).not.toHaveBeenCalled();
    await expect(dataRowsOf(root)).toHaveLength(unfiltered);

    // Tab past the last control closes it as Cancel, and so does Shift+Tab before the first.
    await real.keyboard('{Enter}');
    await waitFor(() => expect(isOpen(), 'the popover is open').toBe(true), POPUP_SHOWN);
    await waitFor(
      () => expect(end('From'), 'the first end has the focus').toHaveFocus(),
      POPUP_SHOWN,
    );
    await real.keyboard('{Tab}');
    await expect(end('To')).toHaveFocus();
    await real.keyboard('{Tab}{Tab}');
    await expect(within(popover()).getByRole('button', { name: 'OK' })).toHaveFocus();
    await real.keyboard('{Tab}');
    await waitFor(() => expect(isOpen(), 'the popover is closed').toBe(false), POPUP_SHOWN);
    await expect(field).toHaveFocus();
    await real.keyboard('{Enter}');
    await waitFor(
      () => expect(end('From'), 'the first end has the focus').toHaveFocus(),
      POPUP_SHOWN,
    );
    await real.keyboard('{Shift>}{Tab}{/Shift}');
    await waitFor(() => expect(isOpen(), 'the popover is closed').toBe(false), POPUP_SHOWN);
    await expect(field).toHaveFocus();
    await expect(args.onFilterChange).not.toHaveBeenCalled();

    // Both ends typed, Enter applies: the rows between them, ends included, and the field says the range.
    await real.keyboard('{Enter}');
    await waitFor(
      () => expect(end('From'), 'the first end has the focus').toHaveFocus(),
      POPUP_SHOWN,
    );
    await real.keyboard('5{Tab}9{Enter}');
    await waitFor(() => {
      expect(args.onFilterChange).toHaveBeenCalledTimes(1);
      expect(isOpen(), 'the popover is closed').toBe(false);
      expect(dataRowsOf(root), 'the rows are those between').toHaveLength(
        SALES.filter((sale) => sale.qty >= 5 && sale.qty <= 9).length,
      );
    }, FILTER_APPLIED);
    await expect(args.onFilterChange).toHaveBeenLastCalledWith({
      columns: { qty: { operator: 'between', value: [5, 9] } },
    });
    await expect(field).toHaveValue('5 – 9');
    await expect(field).toHaveFocus();
    await expect(cell.querySelector('.flg-data-grid-operator')).toHaveAttribute('data-active');
    // The keys of the grid are the grid's again.
    await real.keyboard('{Escape}');
    await expect(cell).toHaveFocus();
    await real.keyboard(`{${mod}>}{Home}{/${mod}}`);
    await expect(dataRowsOf(root)[0]!.firstElementChild).toHaveFocus();

    // A press on a title's sort button while the popover is open closes it for good: the grid draws
    // again at the click, and that must not show the popover the browser has just closed.
    await real.click(bodyCell(root, 0, 6));
    await real.keyboard('{ArrowUp}{Enter}{Enter}');
    await waitFor(() => expect(isOpen(), 'the popover is open').toBe(true), POPUP_SHOWN);
    await sortWhileThePopoverIsOpen(root, real, 'Customer');
  },
};

/**
 * The columns of the header filter's stories: the lookup of Status, and the narrow columns widened for the
 * funnel that sits next to the column menu's button in a title (the grid of G1 has the same funnels, with
 * its own widths, in Task 8).
 */
const HEADER_COLUMNS: DataGridColumn<Sale>[] = FILTER_COLUMNS.map((column) => {
  const field = 'field' in column ? column.field : undefined;
  if (field === 'id') return { ...column, width: 128 };
  if (field === 'qty') return { ...column, width: 112 };
  if (field === 'date') return { ...column, width: 164 };
  if (field === 'channel') return { ...column, width: 136 };
  return column;
});

const HeaderFilterGrid = (props: Partial<DataGridProps<Sale>>) => (
  <div style={{ width: 1100 }}>
    <DataGrid
      aria-label="Orders"
      data={SALES}
      rowKey="id"
      columns={HEADER_COLUMNS}
      locale="vi-VN"
      headerFilter
      paging={false}
      height={360}
      {...props}
    />
  </div>
);

const funnelOf = (root: HTMLElement, caption: string) =>
  titleOf(root, caption).querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')!;

/**
 * The header filter (spec phase 6 §6.3 "Lọc ở header"), by keys and in each engine: F2 on the Status title
 * goes into its first control and Tab on to the funnel, which Enter presses; the one popover opens under
 * the funnel, 216px wide, with the search field focused, and scrolls neither the page nor the frame. A
 * search narrows the list, ↓ goes into it, Space unchecks Processing and Enter is OK: the rows without
 * that status, one `onFilterChange` with `exclude`, the funnel filled and the focus back on it. Esc closes
 * a popover and changes nothing; a press on the funnel of another title moves the one popover there; a press
 * on a title's sort button closes it, sorts, and the popover does not come back.
 */
export const HeaderFilterKeys: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  args: { onFilterChange: fn() },
  render: (args) => <HeaderFilterGrid onFilterChange={args.onFilterChange} />,
  play: async ({ canvasElement, args }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const frame = root.querySelector<HTMLElement>('.flg-data-grid-frame')!;
    const table = root.querySelector<HTMLTableElement>('table[role="grid"]')!;
    const stops = () => Array.from(table.querySelectorAll<HTMLElement>('[tabindex="0"]'));
    const popover = () => root.querySelector<HTMLElement>('.flg-data-grid-filter-popover')!;
    const isOpen = () => popover().matches(':popover-open');
    const status = funnelOf(root, 'Status');
    await expect(status).toHaveAttribute('aria-label', 'Filter Status');
    await expect(status).not.toHaveAttribute('data-active');
    await noTitleIsCut(root);

    const real = await realUserEvent();
    if (!real) return;
    const unfiltered = dataRowsOf(root).length;
    // From the first row, ↑ goes to the title of Status; F2 goes into its first control, the sort button, and
    // Tab goes on to the funnel.
    await real.click(bodyCell(root, 0, 4));
    await real.keyboard('{ArrowUp}');
    const title = titleOf(root, 'Status');
    await expect(title).toHaveFocus();
    await real.keyboard('{F2}');
    await expect(title.querySelector('.flg-table-sort')).toHaveFocus();
    await real.keyboard('{Tab}');
    await expect(status).toHaveFocus();

    // Enter presses it: the popover opens under the funnel, centred on it, with the focus in the search field,
    // and nothing scrolled.
    const before = scrollsOf(frame);
    await real.keyboard('{Enter}');
    await waitFor(() => expect(isOpen(), 'the popover is open').toBe(true), POPUP_SHOWN);
    await settled(popover());
    const search = () => within(popover()).getByRole('searchbox', { name: 'Search values' });
    await waitFor(
      () => expect(search(), 'the search field has the focus').toHaveFocus(),
      POPUP_SHOWN,
    );
    await expect(popover()).toHaveAttribute('aria-label', 'Filter Status');
    await expect(status).toHaveAttribute('aria-expanded', 'true');
    const placed = popover().getBoundingClientRect();
    const funnel = status.getBoundingClientRect();
    await expect(placed.top, 'under the funnel').toBeGreaterThanOrEqual(funnel.bottom);
    await expect(
      Math.abs(placed.top - funnel.bottom - F1_GAP),
      "F1's distance under the funnel",
    ).toBeLessThan(0.5);
    const arrow = popover().querySelector('.flg-popover-arrow')!.getBoundingClientRect();
    await expect(
      Math.abs(arrow.left + arrow.width / 2 - (funnel.left + funnel.width / 2)),
      'the arrow is centred on the funnel',
    ).toBeLessThan(1);
    await expect(
      Math.abs(placed.left + placed.width / 2 - (funnel.left + funnel.width / 2)),
      'centred on the funnel',
    ).toBeLessThan(2);
    await expect(placed.width).toBe(216);
    await expect(placed.bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect(scrollsOf(frame)).toEqual(before);
    await expect(stops()).toEqual([title]);
    const lines = () =>
      Array.from(
        popover().querySelectorAll<HTMLElement>('.flg-data-grid-value-list .flg-checkbox'),
        (label) => label.textContent,
      );
    const checked = () =>
      Array.from(
        popover().querySelectorAll<HTMLInputElement>('.flg-data-grid-value-list input:checked'),
        (input) => input.closest('label')!.textContent,
      );
    await expect(lines()).toEqual(['(Select all)', 'Delivered', 'New', 'Processing']);

    // Typing narrows the list at once; ↓ goes into it, to "(Select all)", and ↓ again to Processing, which
    // Space unchecks.
    await real.keyboard('proc');
    await waitFor(
      () => expect(lines(), 'the list is narrowed').toEqual(['(Select all)', 'Processing']),
      RENDER_UPDATE,
    );
    await real.keyboard('{ArrowDown}');
    await expect(within(popover()).getByRole('checkbox', { name: '(Select all)' })).toHaveFocus();
    await real.keyboard('{ArrowDown}');
    const processing = within(popover()).getByRole('checkbox', { name: 'Processing' });
    await expect(processing).toHaveFocus();
    await expect(processing).toBeChecked();
    await real.keyboard(' ');
    await expect(processing).not.toBeChecked();
    await expect(args.onFilterChange).not.toHaveBeenCalled();
    await real.keyboard('{Enter}');
    await waitFor(() => {
      expect(args.onFilterChange).toHaveBeenCalledTimes(1);
      expect(isOpen(), 'the popover is closed').toBe(false);
      expect(dataRowsOf(root), 'the rows are those of the other statuses').toHaveLength(
        SALES.filter((sale) => sale.status !== 'processing').length,
      );
    }, FILTER_APPLIED);
    await expect(args.onFilterChange).toHaveBeenLastCalledWith({
      columns: { status: { values: ['processing'], exclude: true } },
    });
    await expect(status).toHaveFocus();
    await expect(status).toHaveAttribute('data-active');
    await expect(status).toHaveAttribute('aria-label', 'Filter Status (filtered)');
    await expect(scrollsOf(frame)).toEqual(before);

    // It opens again from the condition (Processing unchecked); Esc closes it and changes nothing.
    (args.onFilterChange as ReturnType<typeof fn>).mockClear();
    await real.keyboard('{Enter}');
    await waitFor(() => expect(isOpen(), 'the popover is open').toBe(true), POPUP_SHOWN);
    await waitFor(
      () => expect(search(), 'the search field has the focus').toHaveFocus(),
      POPUP_SHOWN,
    );
    await expect(checked()).toEqual(['Delivered', 'New']);
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isOpen(), 'the popover is closed').toBe(false), POPUP_SHOWN);
    await expect(status).toHaveFocus();
    await expect(args.onFilterChange).not.toHaveBeenCalled();

    // A press on the funnel of another title moves the one popover there, with that column's values.
    await real.keyboard('{Enter}');
    await waitFor(() => expect(isOpen(), 'the popover is open').toBe(true), POPUP_SHOWN);
    const channel = funnelOf(root, 'Channel');
    await real.click(channel);
    await waitFor(() => {
      expect(isOpen(), 'the popover is open again').toBe(true);
      expect(popover(), "the popover is Channel's").toHaveAttribute('aria-label', 'Filter Channel');
    }, POPUP_SHOWN);
    await expect(channel).toHaveAttribute('aria-expanded', 'true');
    await expect(status).toHaveAttribute('aria-expanded', 'false');
    await expect(lines()).toEqual(['(Select all)', 'Phone', 'Store', 'Website']);
    await expect(scrollsOf(frame)).toEqual(before);
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isOpen(), 'the popover is closed').toBe(false), POPUP_SHOWN);
    await expect(dataRowsOf(root)).not.toHaveLength(unfiltered);

    // A press on a title's sort button while the popover is open closes it for good (see
    // `sortWhileThePopoverIsOpen`).
    await real.click(channel);
    await waitFor(() => expect(isOpen(), 'the popover is open').toBe(true), POPUP_SHOWN);
    await sortWhileThePopoverIsOpen(root, real, 'Customer');
  },
};

/** F1's sentence on the sales: Customer contains "công ty" and Qty > 5 and Status is any of (Processing). */
const PANEL_FILTER: DataGridFilter = {
  columns: {
    customer: { operator: 'contains', value: 'công ty' },
    qty: { operator: '>', value: 5 },
    status: { values: ['processing'] },
  },
};
const PANEL_PAGE = 4;
/** The orders `PANEL_FILTER` keeps. */
const PANEL_KEPT = SALES.filter(
  (sale) =>
    foldText(sale.customer).includes('cong ty') && sale.qty > 5 && sale.status === 'processing',
);

/** The grid of `FilterPanelToggle`, with a button outside it that brings the filter back. */
const PanelGrid = ({
  onFilterChange,
}: {
  onFilterChange: DataGridProps<Sale>['onFilterChange'];
}) => {
  const [filter, setFilter] = useState<DataGridFilter>(PANEL_FILTER);
  return (
    <div style={{ width: 1100, display: 'grid', gap: 14 }}>
      <button type="button" onClick={() => setFilter(PANEL_FILTER)}>
        Restore the filter
      </button>
      <DataGrid
        aria-label="Orders"
        data={SALES}
        rowKey="id"
        columns={HEADER_COLUMNS}
        locale="vi-VN"
        filterRow
        headerFilter
        filterPanel
        paging={{ pageSize: PANEL_PAGE, pageSizes: [PANEL_PAGE, 8] }}
        filter={filter}
        onFilterChange={(next) => {
          setFilter(next);
          onFilterChange?.(next);
        }}
      />
    </div>
  );
};

/**
 * The filter panel (spec phase 6 §4.3 F1 "Thanh bộ lọc"), in each engine: F1's sentence in a 38px bar with a
 * 1px border and an 8px radius, an outline funnel of 14px first, the captions in semibold with "and" muted, the
 * "Clear filter" link after the words and the "Apply filter" switch at the end, between the frame and the
 * pager and cut nowhere. Tab from a cell reaches Clear and the switch; Space on the switch turns the
 * conditions off (the rows are those the search keeps, the cells and the funnel still show the conditions)
 * and on again, with the focus on the switch. Enter on Clear takes the conditions and the panel away, the
 * pager moves up by the panel's height and its gap, and the focus goes to the active cell of the grid, never
 * to the page; the button outside brings the filter back, and the pager down again.
 */
export const FilterPanelToggle: Story = {
  tags: ['no-visual'],
  args: { onFilterChange: fn() },
  render: (args) => <PanelGrid onFilterChange={args.onFilterChange} />,
  play: async ({ canvasElement, args }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const table = root.querySelector<HTMLTableElement>('table[role="grid"]')!;
    const panel = () => root.querySelector<HTMLElement>('.flg-data-grid-filter-panel')!;
    const pager = () => root.querySelector<HTMLElement>('.flg-data-grid-pager')!;
    const clear = () =>
      panel().querySelector<HTMLButtonElement>('button.flg-data-grid-filter-clear')!;
    const toggle = () => within(panel()).getByRole('switch', { name: 'Apply filter' });
    const info = () => root.querySelector('.flg-data-grid-page-info')!.textContent;
    const sentence = 'Customer contains ‘công ty’ and Qty > 5 and Status is any of (Processing)';
    const kept = PANEL_KEPT.length;
    await expect(kept, 'the filter keeps more orders than a page holds').toBeGreaterThan(
      PANEL_PAGE,
    );
    await noTitleIsCut(root);

    // The sentence and the look of the bar, measured: F1's 38px bar, 1px border, 8px radius, padding
    // 3 6 3 12, parts 8px apart.
    const text = panel().querySelector<HTMLElement>('.flg-data-grid-filter-text')!;
    await expect(text).toHaveTextContent(sentence);
    const bar = getComputedStyle(panel());
    await expect(panel().offsetHeight).toBe(38);
    await expect(bar.borderTopWidth).toBe('1px');
    await expect(bar.borderTopLeftRadius).toBe('8px');
    await expect(bar.padding).toBe('3px 6px 3px 12px');
    await expect(bar.columnGap).toBe('8px');
    await expect(bar.alignItems).toBe('center');
    // The parts are in view, none of them empty, and nothing is cut.
    const switchLabel = toggle().closest<HTMLElement>('.flg-switch')!;
    const parts = [
      panel().querySelector<HTMLElement>('.flg-data-grid-filter-icon')!,
      text,
      clear(),
      switchLabel,
    ];
    for (const part of parts) {
      const box = part.getBoundingClientRect();
      await expect(box.width, `${part.className} has a width`).toBeGreaterThan(0);
      await expect(box.height, `${part.className} has a height`).toBeGreaterThan(0);
    }
    await expect(text.scrollWidth, 'the words are not cut').toBeLessThanOrEqual(
      text.clientWidth + 1,
    );
    await expect(panel().scrollWidth).toBeLessThanOrEqual(panel().clientWidth);
    // The funnel is 14px, an outline as F1 draws it, in the accent text, and starts 12px inside the border.
    const funnel = panel().querySelector('svg')!;
    const place = panel().getBoundingClientRect();
    const funnelBox = funnel.getBoundingClientRect();
    await expect([funnelBox.width, funnelBox.height]).toEqual([14, 14]);
    await expect(funnelBox.left - place.left).toBe(13);
    await expect(getComputedStyle(funnel).fill).toBe('none');
    const accent = getComputedStyle(funnel).color;
    // Captions are semibold; "and" is the muted text colour, which the count of the pager has too.
    const bold = Array.from(text.querySelectorAll('b'));
    await expect(bold.map((caption) => caption.textContent)).toEqual(['Customer', 'Qty', 'Status']);
    for (const caption of bold) await expect(getComputedStyle(caption).fontWeight).toBe('600');
    const ands = Array.from(text.querySelectorAll('.flg-data-grid-filter-and'));
    await expect(ands).toHaveLength(2);
    const muted = getComputedStyle(root.querySelector('.flg-data-grid-page-info')!).color;
    for (const and of ands) await expect(getComputedStyle(and).color).toBe(muted);
    // The link follows the words by the gap and is in the accent text; the switch ends the bar, 6px inside
    // the padding and the border, with its words at its end.
    await expect(
      Math.abs(clear().getBoundingClientRect().left - text.getBoundingClientRect().right - 8),
    ).toBeLessThan(1);
    await expect(getComputedStyle(clear()).color).toBe(accent);
    await expect(
      Math.abs(place.right - switchLabel.getBoundingClientRect().right - 7),
    ).toBeLessThan(1);
    await expect(
      switchLabel.lastElementChild,
      'the words are the last part of the switch',
    ).toHaveTextContent('Apply filter');
    // Between the frame and the pager, 14px from each.
    const main = root.querySelector('.flg-data-grid-main')!.getBoundingClientRect();
    await expect(Math.abs(place.top - main.bottom - 14)).toBeLessThan(1);
    await expect(Math.abs(pager().getBoundingClientRect().top - place.bottom - 14)).toBeLessThan(1);
    await expect(info()).toBe(`1–${PANEL_PAGE} of ${kept}`);
    await expect(toggle()).toBeChecked();

    const real = await realUserEvent();
    if (!real) return;
    // Tab from a cell goes to Clear, and on to the switch; Space turns the conditions off.
    await real.click(bodyCell(root, 0, 1));
    await real.keyboard('{Tab}');
    await expect(clear()).toHaveFocus();
    await real.keyboard('{Tab}');
    await expect(toggle()).toHaveFocus();
    await real.keyboard(' ');
    await waitFor(
      () =>
        expect(info(), 'the rows are those the search keeps').toBe(
          `1–${PANEL_PAGE} of ${SALES.length}`,
        ),
      RENDER_UPDATE,
    );
    await expect(args.onFilterChange).toHaveBeenCalledTimes(1);
    await expect(args.onFilterChange).toHaveBeenLastCalledWith({ ...PANEL_FILTER, enabled: false });
    await expect(toggle()).not.toBeChecked();
    await expect(toggle()).toHaveFocus();
    // The panel is still there with its words, and so are the conditions in the cells and the funnel.
    await expect(text).toHaveTextContent(sentence);
    await expect(filterCellOf(root, 'Customer').querySelector('input')).toHaveValue('công ty');
    await expect(
      filterCellOf(root, 'Qty').querySelector('.flg-data-grid-operator'),
    ).toHaveAttribute('data-active');
    await expect(funnelOf(root, 'Status')).toHaveAttribute('data-active');
    // And on again: the key goes away.
    await real.keyboard(' ');
    await waitFor(
      () => expect(info(), 'the conditions filter again').toBe(`1–${PANEL_PAGE} of ${kept}`),
      RENDER_UPDATE,
    );
    await expect(args.onFilterChange).toHaveBeenLastCalledWith(PANEL_FILTER);
    await expect(toggle()).toBeChecked();
    await expect(toggle()).toHaveFocus();

    // Shift+Tab goes back to Clear; Enter clears: one more change, the panel goes, the pager moves up by the
    // panel and its gap, and the focus is in the grid, on its one stop.
    await real.keyboard('{Shift>}{Tab}{/Shift}');
    await expect(clear()).toHaveFocus();
    const pagerAt = pager().getBoundingClientRect().top;
    const panelHeight = panel().getBoundingClientRect().height;
    await real.keyboard('{Enter}');
    await waitFor(
      () =>
        expect(root.querySelector('.flg-data-grid-filter-panel'), 'the panel is gone').toBeNull(),
      RENDER_UPDATE,
    );
    await expect(args.onFilterChange).toHaveBeenCalledTimes(3);
    await expect(args.onFilterChange).toHaveBeenLastCalledWith({});
    await expect(info()).toBe(`1–${PANEL_PAGE} of ${SALES.length}`);
    await waitFor(() => {
      expect(document.activeElement, 'the focus is not on the page').not.toBe(document.body);
      expect(table.contains(document.activeElement), 'the focus is in the grid').toBe(true);
    }, RENDER_UPDATE);
    await expect(document.activeElement).toBe(table.querySelector('[tabindex="0"]'));
    await expect(table.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    await expect(
      Math.abs(pagerAt - pager().getBoundingClientRect().top - (panelHeight + 14)),
      'the pager moved up by the panel and its gap',
    ).toBeLessThan(1);

    // The button outside brings the filter back: the panel, and the pager down again.
    await real.click(canvasElement.querySelector('button')!);
    await waitFor(() => expect(panel(), 'the panel is back').not.toBeNull(), RENDER_UPDATE);
    await expect(panel().querySelector('.flg-data-grid-filter-text')).toHaveTextContent(sentence);
    await expect(Math.abs(pager().getBoundingClientRect().top - pagerAt)).toBeLessThan(1);
    await expect(info()).toBe(`1–${PANEL_PAGE} of ${kept}`);
  },
};

// ---- Look stories: the filter parts of G1 and F1 (spec phase 6 §4.1, §4.3; mockups phase-6-grid.html and ----
// ---- phase-6-grid-data.html) ---------------------------------------------------------------------------

/** The statuses of the lookup, in the order F1 lists them and the order Status sorts by. */
const STATUS_ITEMS = [
  { id: 'new', name: 'New' },
  { id: 'processing', name: 'Processing' },
  { id: 'delivered', name: 'Delivered' },
  { id: 'cancelled', name: 'Cancelled' },
];
const STATUS_LOOKUP = { items: STATUS_ITEMS, valueField: 'id', displayField: 'name' };
/** The place of a status in the lookup, a blank one last. */
const statusRank = (status: string | null | undefined) =>
  status ? STATUS_ITEMS.findIndex((item) => item.id === status) : STATUS_ITEMS.length;

/**
 * G1's eight columns with the filter parts of D: Status a lookup (its funnel lists the four statuses and it
 * sorts in their order), Assignee's cell calling `ctx.highlight`, and no funnel on Order, Qty and Total (G1
 * draws none there). Order date and Channel are 10px wider than G1's 140 and 120: an English caption
 * with its sort level, its funnel and the room of the ⋮ is cut in them (measured: 9px and 8px short). Customer gives the 20px back, so the
 * nine columns still sum to 1292.
 */
const G1_COLUMNS: DataGridColumn<Sale>[] = SEARCH_COLUMNS.map((column) => {
  const field = 'field' in column ? column.field : undefined;
  if (field === 'id' || field === 'qty' || field === 'total')
    return { ...column, allowHeaderFiltering: false };
  if (field === 'customer') return { ...column, width: 228 };
  if (field === 'date') return { ...column, width: 150 };
  if (field === 'channel') return { ...column, width: 130 };
  if (field === 'status')
    return { ...column, lookup: STATUS_LOOKUP, sortValue: (row: Sale) => statusRank(row.status) };
  return column;
});

/** Status filtered without Cancelled: the funnel is filled, and no order is cancelled, so no row changes. */
const G1_FILTER: DataGridFilter = { columns: { status: { values: ['cancelled'], exclude: true } } };

/** The four rows of the second grid: DH-1030, DH-1029, DH-1028 and DH-1026. */
const SCROLLED_ROWS = ['DH-1030', 'DH-1029', 'DH-1028', 'DH-1026'].map((id) =>
  SALES.find((order) => order.id === id)!,
);

/** The ⋮ of a title, which the harness hovers; the funnel stands before it. */
const moreOf = (root: HTMLElement, caption: string) =>
  titleOf(root, caption).querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')!;

const near = (actual: number, expected: number, within = 1.5, what = 'distance') =>
  expect(Math.abs(actual - expected), `${what}: ${actual} against ${expected}`).toBeLessThanOrEqual(
    within,
  );

/**
 * A popup of a look story ends inside the stage, out of its padding: the harness shoots the stage alone, a
 * popup in the top layer adds nothing to the stage's height, and one that ran past it would be cut in the
 * baseline.
 */
async function endsInsideTheStage(canvasElement: HTMLElement, popup: HTMLElement) {
  const stage = canvasElement.querySelector<HTMLElement>('[data-testid="flg-stage"]')!;
  const room =
    stage.getBoundingClientRect().bottom - parseFloat(getComputedStyle(stage).paddingBottom);
  await expect(
    popup.getBoundingClientRect().bottom,
    'the popup ends inside the stage',
  ).toBeLessThanOrEqual(room);
}

/** What G1 draws of D in a heading: the funnels of five columns, 20px each, Status's filled. */
async function g1Funnels(root: HTMLElement) {
  const captions = Array.from(
    root.querySelectorAll<HTMLElement>('thead button[aria-haspopup="dialog"]'),
    (button) => button.closest('th')!.querySelector('.flg-data-grid-head-title')!.textContent,
  );
  await expect(captions).toEqual(['Customer', 'Assignee', 'Order date', 'Status', 'Channel']);
  await expect(funnelOf(root, 'Status')).toHaveAttribute('data-active');
  for (const caption of captions) {
    const funnel = funnelOf(root, caption!);
    near(funnel.getBoundingClientRect().width, 20, 0.5, `the funnel of ${caption} is 20px wide`);
    near(funnel.getBoundingClientRect().height, 20, 0.5, `the funnel of ${caption} is 20px tall`);
    if (caption !== 'Status') await expect(funnel, caption!).not.toHaveAttribute('data-active');
  }
}

/**
 * G1's top grid complete (mockup phase-6-grid.html, `mk-o1`): Plan C's grid with the search field after the
 * caption, the funnels of Customer, Assignee, Order date, Status and Channel, and Status's filled (filtered
 * without Cancelled, which no order is, so every row stays), next to the column chooser and the ⋮ of
 * Customer under the pointer. The state is Plan B's (`lookPlay`: the sort, DH-1028 and DH-1025 chosen, the
 * focus on DH-1026 · Customer, the frame at the rows 4 to 11). Not drawn here: the export button (G), the
 * add button (F) and C1's lines between the titles.
 */
export const G1: Story = {
  tags: ['viewport-1440x720'],
  render: () => (
    <div className="g1-look" style={{ width: 1332 }}>
      <style>{'.g1-look .flg-table-frame { scrollbar-width: none; }'}</style>
      <Card>
        <DataGrid
          data={SALES}
          rowKey="id"
          columns={G1_COLUMNS}
          caption="Orders"
          description="135 orders · Lumen, November 2026"
          variant="lined"
          height={459}
          locale="vi-VN"
          selectionMode="multiple"
          defaultSort={[
            { field: 'date', direction: 'desc' },
            { field: 'total', direction: 'asc' },
          ]}
          defaultSelectedKeys={['DH-1028', 'DH-1025']}
          paging={{ pageSize: 12, pageSizes: [12, 24, 48] }}
          searchPanel
          headerFilter
          columnChooser
          defaultFilter={G1_FILTER}
          defaultColumnLayout={{ pinned: { id: 'left' } }}
        />
      </Card>
    </div>
  ),
  play: async (context) => {
    const { canvasElement } = context;
    await lookPlay('lined', 'standard', (root) => moreOf(root, 'Customer'))(context);
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    // The search field is empty, 260px wide, with its placeholder, after the caption and before the chooser.
    const field = root.querySelector<HTMLInputElement>('input[type="search"]')!;
    await expect(field).toHaveValue('');
    await expect(field).toHaveAttribute('placeholder', 'Search…');
    const search = root.querySelector<HTMLElement>('.flg-data-grid-search')!;
    await expect(search.offsetWidth).toBe(260);
    await expect(
      search.compareDocumentPosition(root.querySelector('.flg-data-grid-chooser-button')!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      'the search field comes before the chooser',
    ).toBeTruthy();
    await g1Funnels(root);
    // The condition filters nothing: the grid still has its 135 orders.
    await expect(root.querySelector('.flg-data-grid-pager')).toHaveTextContent('1–12 of 135');
    const more = moreOf(root, 'Customer');
    near(more.getBoundingClientRect().width, 20, 0.5, 'the ⋮ is 20px wide');
    near(more.getBoundingClientRect().height, 20, 0.5, 'the ⋮ is 20px tall');
  },
};

/**
 * How far G1's second grid is scrolled. G1 scrolls 274px; the funnels widen the columns before Assignee by
 * 44px less (Customer gives them), so the crop is scrolled by as much less and shows what the mockup shows:
 * Customer cut at the zone and Assignee sliding under the two pinned columns.
 */
const G1_SCROLL = 274 - 20;

/**
 * G1's second grid with the funnels (mockup phase-6-grid.html): the same columns in a surface of 726px with
 * 12px of padding, scrolled sideways so that Customer is cut at the zone and Assignee slides under the two
 * pinned columns; the funnels of Assignee, Order date and Status (filled), the hover of DH-1030 and the wash
 * of DH-1028 drawn through the pinned cells. Not drawn here: the mockup's 4px scrollbar thumb, and the thin
 * lines between the titles are C1's (spec phase 6 §10).
 */
export const G1Scrolled: Story = {
  tags: ['viewport-1440x720'],
  render: () => (
    <div
      className="flg-surface g1-scrolled"
      style={{
        width: 726,
        boxSizing: 'border-box',
        padding: 12,
        borderRadius: 'var(--flg-radius-lg)',
      }}
    >
      <style>{'.g1-scrolled .flg-table-frame { scrollbar-width: none; }'}</style>
      <DataGrid
        aria-label="Orders"
        data={SCROLLED_ROWS}
        rowKey="id"
        columns={G1_COLUMNS}
        locale="vi-VN"
        selectionMode="multiple"
        defaultSort={[
          { field: 'date', direction: 'desc' },
          { field: 'total', direction: 'asc' },
        ]}
        defaultSelectedKeys={['DH-1028']}
        headerFilter
        defaultFilter={G1_FILTER}
        defaultColumnLayout={{ pinned: { id: 'left' } }}
        paging={false}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const frame = root.querySelector<HTMLElement>('.flg-data-grid-frame')!;
    const rows = Array.from(root.querySelectorAll<HTMLElement>('tbody > tr'));
    await expect(rows.map((row) => row.textContent?.slice(0, 7))).toEqual(
      SCROLLED_ROWS.map((row) => row.id),
    );
    near(frame.offsetWidth, 700, 0.5, 'the frame is 700px wide');
    frame.scrollLeft = G1_SCROLL;
    await waitFor(
      () => expect(frame, 'the grid heard the scroll').toHaveAttribute('data-scrolled-left'),
      SCROLL_EVENT,
    );
    await expect(frame.scrollLeft).toBe(G1_SCROLL);
    await expect(rows[2]).toHaveAttribute('data-selected');
    // The funnels of the columns the grid has, Status's filled; the ones scrolled out of sight exist too.
    await expect(
      Array.from(
        root.querySelectorAll<HTMLElement>('thead button[aria-haspopup="dialog"]'),
        (button) => button.closest('th')!.querySelector('.flg-data-grid-head-title')!.textContent,
      ),
    ).toEqual(['Customer', 'Assignee', 'Order date', 'Status', 'Channel']);
    await expect(funnelOf(root, 'Status')).toHaveAttribute('data-active');
    rows[0]!.setAttribute('data-visual-hover', '');
    await noTitleIsCut(root);
  },
};

// ---- F1: the orders, the columns and the two crops ----------------------------------------------------

interface FilterOrder extends Omit<Sale, 'status'> {
  status: 'new' | 'processing' | 'delivered' | 'cancelled' | null;
}

function filterOrder(
  id: string,
  customer: string,
  assignee: string,
  date: string,
  status: FilterOrder['status'],
  channel: Sale['channel'],
  qty: number,
  total: number,
): FilterOrder {
  return { id, customer, assignee, date, status, channel, qty, total };
}

const MINH_ANH = 'Nguyễn Minh Anh';
const VO_LAN = 'Võ Thị Lan';
const LE_HUY = 'Lê Quang Huy';

/**
 * F1's orders. The search "minh", Customer containing "công ty" and Qty over 5 keep ten of them: the six
 * Processing orders of the mockup, and one each of New, Delivered, Cancelled and with no status, which are
 * what its Status list shows (the header filter lists the values of the rows the other conditions keep).
 * The rest fail one of the three: no "minh" anywhere, no "công ty", or a Qty of 5 or less.
 */
const F1_ORDERS: readonly FilterOrder[] = [
  // The six rows of the mockup.
  filterOrder(
    'DH-1024',
    'Công ty Minh Phát',
    MINH_ANH,
    '2026-11-03',
    'processing',
    'Website',
    12,
    18600000,
  ),
  filterOrder(
    'DH-1019',
    'Công ty Bình Minh',
    VO_LAN,
    '2026-10-31',
    'processing',
    'Store',
    20,
    15800000,
  ),
  filterOrder(
    'DH-1012',
    'Công ty Sao Việt',
    MINH_ANH,
    '2026-10-28',
    'processing',
    'Phone',
    8,
    6400000,
  ),
  filterOrder(
    'DH-1006',
    'Công ty Minh Khang',
    LE_HUY,
    '2026-10-26',
    'processing',
    'Website',
    30,
    26100000,
  ),
  filterOrder(
    'DH-0997',
    'Công ty Hưng Thịnh',
    MINH_ANH,
    '2026-10-22',
    'processing',
    'Store',
    6,
    5250000,
  ),
  filterOrder(
    'DH-0988',
    'Công ty Quang Minh',
    LE_HUY,
    '2026-10-20',
    'processing',
    'Phone',
    15,
    12300000,
  ),
  // The other statuses that the three conditions keep.
  filterOrder('DH-1015', 'Công ty Minh Tâm', MINH_ANH, '2026-10-30', 'new', 'Website', 9, 4300000),
  filterOrder(
    'DH-1009',
    'Công ty Minh Long',
    VO_LAN,
    '2026-10-27',
    'delivered',
    'Store',
    40,
    33000000,
  ),
  filterOrder(
    'DH-1002',
    'Công ty Phúc Minh',
    LE_HUY,
    '2026-10-24',
    'cancelled',
    'Phone',
    7,
    2800000,
  ),
  filterOrder('DH-0993', 'Công ty Minh Quân', VO_LAN, '2026-10-21', null, 'Website', 11, 6100000),
  // No "minh" in the row.
  filterOrder('DH-1035', 'Tạp hóa Hoa Mai', VO_LAN, '2026-11-11', 'new', 'Website', 5, 4500000),
  filterOrder(
    'DH-1033',
    'Công ty An Phát',
    VO_LAN,
    '2026-11-10',
    'processing',
    'Phone',
    14,
    6800000,
  ),
  filterOrder(
    'DH-1031',
    'Công ty Thịnh Vượng',
    LE_HUY,
    '2026-11-08',
    'delivered',
    'Phone',
    60,
    54000000,
  ),
  filterOrder('DH-1021', 'Công ty Hải Âu', VO_LAN, '2026-11-02', 'cancelled', 'Store', 18, 9900000),
  filterOrder(
    'DH-1014',
    'Công ty Sao Mai',
    LE_HUY,
    '2026-10-29',
    'processing',
    'Website',
    22,
    8800000,
  ),
  // "Minh" but no "công ty".
  filterOrder(
    'DH-1034',
    'Nhà hàng Sen Vàng',
    MINH_ANH,
    '2026-11-10',
    'delivered',
    'Store',
    9,
    2200000,
  ),
  filterOrder('DH-1030', 'Studio Ánh Dương', MINH_ANH, '2026-11-07', 'new', 'Phone', 25, 9750000),
  filterOrder('DH-1017', 'Minh Châu Spa', VO_LAN, '2026-10-30', 'processing', 'Store', 14, 7700000),
  filterOrder('DH-1003', 'Đỗ Khánh Linh', MINH_ANH, '2026-10-25', null, 'Website', 3, 1250000),
  // "Công ty" and "minh", but a Qty of 5 or less.
  filterOrder(
    'DH-1020',
    'Công ty Minh Đức',
    MINH_ANH,
    '2026-11-01',
    'processing',
    'Phone',
    4,
    3320000,
  ),
  filterOrder('DH-1007', 'Công ty Minh Hải', LE_HUY, '2026-10-26', 'new', 'Store', 2, 1100000),
  filterOrder(
    'DH-0999',
    'Công ty Bình Minh',
    MINH_ANH,
    '2026-10-23',
    'delivered',
    'Website',
    5,
    2100000,
  ),
  // Neither.
  filterOrder(
    'DH-1011',
    'Cà phê Sương Sớm',
    LE_HUY,
    '2026-10-28',
    'delivered',
    'Store',
    25,
    9750000,
  ),
  filterOrder('DH-1005', 'Trần Thu Hà', VO_LAN, '2026-10-26', 'new', 'Phone', 2, 1250000),
];

/** The badge of a status, as G1's cell draws it; a blank status draws nothing. */
const F1_BADGES = {
  new: { variant: 'accent', text: 'New' },
  processing: { variant: 'warning', text: 'Processing' },
  delivered: { variant: 'success', text: 'Delivered' },
  cancelled: { variant: 'danger', text: 'Cancelled' },
} as const;

/**
 * F1's eight columns and widths (110, 220, 200, 160, 150, 140, 110, and Total takes the rest of the 1292px),
 * without the column of boxes. G1 decides the funnels: none on Order, Qty and Total, and one on Order date.
 */
const F1_COLUMNS: DataGridColumn<FilterOrder>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 110, allowHeaderFiltering: false },
  { field: 'customer', caption: 'Customer', width: 220 },
  {
    field: 'assignee',
    caption: 'Assignee',
    width: 200,
    cell: ({ text, highlight }: DataGridCellContext<FilterOrder, string>) => (
      <span
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, verticalAlign: 'middle' }}
      >
        <Avatar size="sm" alt="" fallback={ASSIGNEES[text]} />
        {highlight(text)}
      </span>
    ),
  },
  { field: 'date', caption: 'Order date', dataType: 'date', width: 160 },
  {
    field: 'status',
    caption: 'Status',
    width: 150,
    lookup: STATUS_LOOKUP,
    sortValue: (row) => statusRank(row.status),
    cell: ({ value }) =>
      value ? <Badge variant={F1_BADGES[value].variant}>{F1_BADGES[value].text}</Badge> : null,
  },
  { field: 'channel', caption: 'Channel', width: 140 },
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 110, allowHeaderFiltering: false },
  {
    field: 'total',
    caption: 'Total',
    dataType: 'number',
    format: { style: 'currency', currency: 'VND' },
    allowHeaderFiltering: false,
  },
];

/** The first crop's filter: the search, Customer containing "công ty", Qty over 5, Status Processing only. */
const F1_FILTER: DataGridFilter = {
  search: 'minh',
  columns: {
    customer: { operator: 'contains', value: 'công ty' },
    qty: { operator: '>', value: 5 },
    status: { values: ['processing'] },
  },
};

/** The look of both crops: a 1332px card, as G1's, with the frame as wide as the columns, 1292px. */
const F1Card = ({ children }: { children: ReactNode }) => (
  <div className="f1-look" style={{ width: 1332 }}>
    <style>{'.f1-look .flg-table-frame { scrollbar-width: none; }'}</style>
    <Card>{children}</Card>
  </div>
);

/**
 * F1's first crop (mockup phase-6-grid-data.html, `mk-f1`): the grid with every part of the filter: the filter
 * row with its operators (Customer's "contains" and Qty's ">" accented), the funnel of Status with the
 * track background and its popover open (the search field, "(Select all)" mixed, New, Processing checked,
 * Delivered, Cancelled and "(Blanks)"), "minh" searched and marked in Customer and in Assignee's custom
 * cell, the filter panel and the pager "1–6 of 6". The play opens the popover with a click; the stage
 * holds the room of the popover and the play asserts that it ends inside.
 */
export const GridFiltering: Story = {
  tags: ['viewport-1440x720'],
  render: () => (
    <F1Card>
      <DataGrid
        data={F1_ORDERS}
        rowKey="id"
        columns={F1_COLUMNS}
        caption="Orders"
        variant="lined"
        locale="vi-VN"
        defaultSort={[{ field: 'date', direction: 'desc' }]}
        paging={{ pageSize: 12, pageSizes: [12, 24, 48] }}
        searchPanel
        filterRow
        headerFilter
        filterPanel
        columnChooser
        defaultFilter={F1_FILTER}
      />
    </F1Card>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    const rows = () => dataRowsOf(root);
    // The search is applied after its delay: the six rows come, each with its marks.
    await waitFor(() => expect(rows(), 'the six orders').toHaveLength(6), SEARCH_APPLIED);
    await expect(rows().map((row) => row.textContent?.slice(0, 7))).toEqual([
      'DH-1024',
      'DH-1019',
      'DH-1012',
      'DH-1006',
      'DH-0997',
      'DH-0988',
    ]);
    await expect(root.querySelector('.flg-data-grid-pager')).toHaveTextContent('1–6 of 6');
    await expect(root.querySelector<HTMLInputElement>('input[type="search"]')).toHaveValue('minh');
    await expect(
      Array.from(rows()[0]!.querySelectorAll('mark'), (mark) => mark.textContent),
      'Customer and Assignee mark "Minh"',
    ).toEqual(['Minh', 'Minh']);
    await expect(
      Array.from(rows()[1]!.querySelectorAll('mark'), (mark) => mark.textContent),
    ).toEqual(['Minh']);
    // The filter row: Customer and Qty hold their conditions and their accented operators.
    await expect(filterCellOf(root, 'Customer').querySelector('input')).toHaveValue('công ty');
    await expect(filterCellOf(root, 'Qty').querySelector('input')).toHaveValue('5');
    for (const caption of ['Customer', 'Qty'])
      await expect(
        filterCellOf(root, caption).querySelector('.flg-data-grid-operator'),
        caption,
      ).toHaveAttribute('data-active');
    await expect(
      filterCellOf(root, 'Assignee').querySelector('.flg-data-grid-operator'),
    ).not.toHaveAttribute('data-active');
    // The panel says the three conditions.
    await expect(root.querySelector('.flg-data-grid-filter-panel')).toHaveTextContent(
      'Customer contains ‘công ty’ and Qty > 5 and Status is any of (Processing)',
    );
    await noTitleIsCut(root);

    // Status's funnel opens the popover: its search field, the "(Select all)" box mixed, the four statuses and
    // the blanks, Processing alone checked.
    const funnel = funnelOf(root, 'Status');
    await expect(funnel).toHaveAttribute('data-active');
    await userEvent.click(funnel);
    const popover = root.querySelector<HTMLElement>('.flg-data-grid-filter-popover')!;
    await waitFor(
      () => expect(popover.matches(':popover-open'), 'the popover is open').toBe(true),
      POPUP_SHOWN,
    );
    await settled(popover);
    await expect(funnel).toHaveAttribute('aria-expanded', 'true');
    const labels = Array.from(popover.querySelectorAll('label'), (label) => label.textContent);
    await expect(labels).toEqual([
      '(Select all)',
      'New',
      'Processing',
      'Delivered',
      'Cancelled',
      '(Blanks)',
    ]);
    const boxes = Array.from(popover.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    await expect(boxes.map((box) => box.checked)).toEqual([
      false,
      false,
      true,
      false,
      false,
      false,
    ]);
    await expect(boxes[0]).toBePartiallyChecked();
    await endsInsideTheStage(canvasElement, popover);
    near(
      popover.getBoundingClientRect().top - funnel.getBoundingClientRect().bottom,
      F1_GAP,
      1.5,
      'the popover is under the funnel as in F1',
    );
  },
};

/**
 * F1's second crop, "Trống do lọc" (mockup phase-6-grid-data.html, `mk-f1`): no toolbar (it has no caption, so
 * its name is `aria-label`), the filter row with Customer's "công ty" and Qty's "> 500", the empty cell
 * with its ring and the crossed-out funnel, the words and "Clear filter", and the filter panel. No pager:
 * there are no rows to page.
 */
export const GridFilterEmpty: Story = {
  tags: ['viewport-1440x720'],
  render: () => (
    <F1Card>
      <DataGrid
        aria-label="Orders"
        data={F1_ORDERS}
        rowKey="id"
        columns={F1_COLUMNS}
        variant="lined"
        locale="vi-VN"
        defaultSort={[{ field: 'date', direction: 'desc' }]}
        paging={false}
        filterRow
        headerFilter
        filterPanel
        defaultFilter={{
          columns: {
            customer: { operator: 'contains', value: 'công ty' },
            qty: { operator: '>', value: 500 },
          },
        }}
      />
    </F1Card>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
    await expect(dataRowsOf(root)).toHaveLength(0);
    await expect(root.querySelector('.flg-data-grid-toolbar')).toBeNull();
    await expect(root.querySelector('.flg-data-grid-pager')).toBeNull();
    const content = root.querySelector<HTMLElement>('.flg-data-grid-empty-content')!;
    await expect(content.querySelector('.flg-data-grid-empty-title')).toHaveTextContent(
      'No rows match the filter',
    );
    await expect(content.querySelector('button')).toHaveTextContent('Clear filter');
    await expect(filterCellOf(root, 'Qty').querySelector('input')).toHaveValue('500');
    await expect(root.querySelector('.flg-data-grid-filter-panel')).toHaveTextContent(
      'Customer contains ‘công ty’ and Qty > 500',
    );
    await noTitleIsCut(root);
  },
};
