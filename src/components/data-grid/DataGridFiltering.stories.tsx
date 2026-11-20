import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, waitFor } from 'storybook/test';
import {
  ASSIGNEES,
  bodyCell,
  SALES,
  SALE_COLUMNS,
  noTitleIsCut,
} from '../../../.storybook/data-grid-orders';
import type { Sale } from '../../../.storybook/data-grid-orders';
import { realUserEvent } from '../../../.storybook/real-input';
import { foldText } from '../../internal/text-fold';
import { Avatar } from '../avatar/Avatar';
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
