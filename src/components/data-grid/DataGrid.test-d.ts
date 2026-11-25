import { createRef } from 'react';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { expectTypeOf, test } from 'vitest';
import { DataGrid } from './DataGrid';
import { dataGridColumn } from './data-grid-column';
import type {
  DataGridColumnLayout,
  DataGridFilter,
  DataGridHandle,
  DataGridKey,
  DataGridLabels,
  DataGridLabelsInput,
  DataGridPin,
  DataGridProps,
  DataGridRowDrop,
  DataGridState,
  DataGridToolbarItems,
} from './index';

interface Order {
  id: string;
  customer: string;
  total: number;
  paid: boolean;
}

const rows: Order[] = [];

test('the row type is read from data, and a column list fits it', () => {
  // Called as a function, only to let the compiler infer `TRow` from `data`.
  const grid = DataGrid({
    data: rows,
    rowKey: 'id',
    caption: 'Orders',
    columns: [
      { field: 'customer' },
      // The value of the field reaches `cell` and `format`.
      {
        field: 'total',
        cell: (ctx) => {
          expectTypeOf(ctx.value).toEqualTypeOf<number>();
          expectTypeOf(ctx.row).toEqualTypeOf<Order>();
          return ctx.text;
        },
        format: (value, row) => {
          expectTypeOf(value).toEqualTypeOf<number>();
          expectTypeOf(row).toEqualTypeOf<Order>();
          return String(value);
        },
      },
      dataGridColumn<Order>()({ id: 'tax', value: (row) => row.total / 5 }),
    ],
  });
  expectTypeOf(grid).toExtend<ReactElement>();
});

test('rowKey is a key of the row or a function that gives a key', () => {
  expectTypeOf<DataGridProps<Order>['rowKey']>().toEqualTypeOf<
    'id' | 'customer' | 'total' | 'paid' | ((row: Order) => DataGridKey)
  >();
  const byFunction: DataGridProps<Order>['rowKey'] = (row) => row.id;
  expectTypeOf(byFunction).toBeFunction();
  // @ts-expect-error a property the row does not have
  const unknownKey: DataGridProps<Order>['rowKey'] = 'missing';
  void unknownKey;
});

test('a field is a string key of the row', () => {
  // @ts-expect-error a field the row does not have
  const column: DataGridProps<Order>['columns'] = [{ field: 'missing' }];
  void column;
});

test('an interface can extend the props, so an app can add to them', () => {
  interface OrderGridProps extends DataGridProps<Order> {
    onOpen?: (id: string) => void;
  }
  expectTypeOf<OrderGridProps['data']>().toEqualTypeOf<readonly Order[]>();
});

test('the children and dangerouslySetInnerHTML of the root are not props', () => {
  // The root always has children of its own; both would be forwarded to an element that also gets
  // them.
  expectTypeOf<DataGridProps<Order>>().not.toHaveProperty('children');
  expectTypeOf<DataGridProps<Order>>().not.toHaveProperty('dangerouslySetInnerHTML');
  expectTypeOf<DataGridProps<Order>>().not.toHaveProperty('onChange');
});

test('density, variant and captionAs take only their own values', () => {
  expectTypeOf<DataGridProps<Order>['density']>().toEqualTypeOf<
    'compact' | 'standard' | 'comfortable' | undefined
  >();
  expectTypeOf<DataGridProps<Order>['variant']>().toEqualTypeOf<
    'lined' | 'striped' | 'minimal' | undefined
  >();
  expectTypeOf<DataGridProps<Order>['captionAs']>().toEqualTypeOf<
    'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | undefined
  >();
  // @ts-expect-error not a density
  const density: DataGridProps<Order>['density'] = 'tight';
  // @ts-expect-error not a heading
  const captionAs: DataGridProps<Order>['captionAs'] = 'h1';
  void density;
  void captionAs;
});

test('the ref is a handle, not an element, and the labels are partial', () => {
  expectTypeOf(createRef<DataGridHandle>()).toExtend<
    ComponentProps<typeof DataGrid<Order>>['ref']
  >();
  expectTypeOf<DataGridHandle['element']>().toEqualTypeOf<HTMLDivElement | null>();
  expectTypeOf<DataGridProps<Order>['labels']>().toEqualTypeOf<DataGridLabelsInput | undefined>();
  // The words of the operators are a record that a caller may give in part.
  expectTypeOf<DataGridLabelsInput['operators']>().toEqualTypeOf<
    Partial<DataGridLabels['operators']> | undefined
  >();
  expectTypeOf<DataGridLabelsInput['loading']>().toEqualTypeOf<string | undefined>();
});

test('the header filter: its props, the list of a column in server mode, and its labels', () => {
  expectTypeOf<DataGridProps<Order>['headerFilter']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<DataGridProps<Order>['allowHeaderFiltering']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<DataGridLabels['filterColumn']>().toEqualTypeOf<
    (caption: string, active: boolean) => string
  >();
  expectTypeOf<DataGridLabels['moreValues']>().toEqualTypeOf<
    (shown: number, total: number) => string
  >();
  expectTypeOf<DataGridLabels['searchValues']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['searchValuesName']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['selectAllValues']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['blank']>().toEqualTypeOf<string>();
  // @ts-expect-error the funnel is on or off: a string is no value of headerFilter
  const wrong: DataGridProps<Order> = { data: [], rowKey: 'id', columns: [], headerFilter: 'yes' };
  void wrong;
});

test('the filter row: its prop, the default of allowFiltering, and its labels', () => {
  expectTypeOf<DataGridProps<Order>['filterRow']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<DataGridProps<Order>['allowFiltering']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<DataGridLabels['filterCell']>().toEqualTypeOf<(caption: string) => string>();
  expectTypeOf<DataGridLabels['operator']>().toEqualTypeOf<(name: string) => string>();
  expectTypeOf<DataGridLabels['all']>().toEqualTypeOf<string>();
  expectTypeOf<keyof DataGridLabels['operators']>().toEqualTypeOf<
    | '='
    | '<>'
    | '<'
    | '>'
    | '<='
    | '>='
    | 'between'
    | 'contains'
    | 'notContains'
    | 'startsWith'
    | 'endsWith'
  >();
  // @ts-expect-error an operator the grid does not know is not a word to give
  const unknown: DataGridLabelsInput = { operators: { matches: 'Matches' } };
  void unknown;
});

// What JSON can carry, so an app can keep the state in `localStorage` or send it to a server.
type IsJson<T> = T extends string | number | boolean | null
  ? true
  : T extends readonly (infer Item)[]
    ? IsJson<Item>
    : T extends object
      ? { [K in keyof T]: IsJson<T[K]> }[keyof T] extends true
        ? true
        : false
      : false;

test('the state of the grid is JSON only, and onStateChange names the part that changed', () => {
  // The filter's values are `unknown`, which a type cannot call JSON: its own test (filter.test-d.ts) pins
  // the parts it can, and the grid reads only the JSON kinds of a value.
  expectTypeOf<IsJson<Omit<DataGridState, 'filter'>>>().toEqualTypeOf<true>();
  expectTypeOf<keyof DataGridState>().toEqualTypeOf<
    | 'sort'
    | 'filter'
    | 'page'
    | 'selectedKeys'
    | 'columnLayout'
    | 'grouping'
    | 'expandedGroups'
    | 'expandedRows'
  >();
  expectTypeOf<DataGridProps<Order>['onStateChange']>().toEqualTypeOf<
    ((state: DataGridState, changed: keyof DataGridState) => void) | undefined
  >();
  expectTypeOf<DataGridHandle['getState']>().toEqualTypeOf<() => DataGridState>();
});

test('the props of choosing rows take only their own values', () => {
  expectTypeOf<DataGridProps<Order>['selectionMode']>().toEqualTypeOf<
    'none' | 'single' | 'multiple' | undefined
  >();
  expectTypeOf<DataGridProps<Order>['selectAllMode']>().toEqualTypeOf<'page' | 'all' | undefined>();
  expectTypeOf<DataGridProps<Order>['selectOnRowClick']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<DataGridProps<Order>['selectedKeys']>().toEqualTypeOf<
    readonly DataGridKey[] | undefined
  >();
  expectTypeOf<DataGridProps<Order>['onSelectedKeysChange']>().toEqualTypeOf<
    ((keys: readonly DataGridKey[]) => void) | undefined
  >();
  expectTypeOf<DataGridLabels['selectRow']>().toEqualTypeOf<(name: string) => string>();
  expectTypeOf<DataGridLabels['announceSelected']>().toEqualTypeOf<(count: number) => string>();
});

test('sorting, paging and server mode props take only their own values', () => {
  expectTypeOf<DataGridProps<Order>['sortMode']>().toEqualTypeOf<
    'single' | 'multiple' | undefined
  >();
  expectTypeOf<DataGridProps<Order>['paging']>().toEqualTypeOf<
    false | { pageSize?: number; pageSizes?: readonly number[] } | undefined
  >();
  // @ts-expect-error not a sort mode
  const mode: DataGridProps<Order>['sortMode'] = 'some';
  void mode;
});

test('onRowActivate gets the row of the grid and its key, and the handle can focus', () => {
  expectTypeOf<DataGridProps<Order>['onRowActivate']>().toEqualTypeOf<
    ((row: Order, key: DataGridKey) => void) | undefined
  >();
  expectTypeOf<DataGridHandle['focus']>().toEqualTypeOf<() => void>();
  // The row type is read from `data`, so a handler written in the JSX has it too.
  const grid = DataGrid({
    data: rows,
    rowKey: 'id',
    caption: 'Orders',
    columns: [{ field: 'customer' }],
    onRowActivate: (row, key) => {
      expectTypeOf(row).toEqualTypeOf<Order>();
      expectTypeOf(key).toEqualTypeOf<DataGridKey>();
    },
  });
  expectTypeOf(grid).toExtend<ReactElement>();
});

test('rowReorder is a boolean, and onRowReorder gets the two keys and which side', () => {
  expectTypeOf<DataGridProps<Order>['rowReorder']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<DataGridProps<Order>['onRowReorder']>().toEqualTypeOf<
    ((from: DataGridKey, to: DataGridKey, position: DataGridRowDrop) => void) | undefined
  >();
  expectTypeOf<DataGridRowDrop>().toEqualTypeOf<'before' | 'after'>();
  expectTypeOf<DataGridLabels['reorderRow']>().toEqualTypeOf<(name: string) => string>();
  expectTypeOf<DataGridLabels['announceRowMoved']>().toEqualTypeOf<
    (name: string, position: number, count: number) => string
  >();
  expectTypeOf<DataGridLabels['reorderDisabled']>().toEqualTypeOf<string>();
});

test('scrolling is a union, and the handle scrolls to a row by its key', () => {
  expectTypeOf<DataGridProps<Order>['scrolling']>().toEqualTypeOf<
    'standard' | 'virtual' | undefined
  >();
  // @ts-expect-error not a way of scrolling
  const scrolling: DataGridProps<Order>['scrolling'] = 'infinite';
  void scrolling;
  expectTypeOf<DataGridHandle['scrollToRow']>().toEqualTypeOf<(key: DataGridKey) => boolean>();
});

test('loading is a boolean, its two words are strings, and the handle has eight members', () => {
  expectTypeOf<DataGridProps<Order>['loading']>().toEqualTypeOf<boolean | undefined>();
  // @ts-expect-error a loading is true or false
  const loading: DataGridProps<Order>['loading'] = 'yes';
  void loading;
  expectTypeOf<DataGridLabels['loading']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['noData']>().toEqualTypeOf<string>();
  expectTypeOf<keyof DataGridHandle>().toEqualTypeOf<
    | 'element'
    | 'focus'
    | 'getState'
    | 'scrollToRow'
    | 'clearFilter'
    | 'expandAllGroups'
    | 'collapseAllGroups'
    | 'addRow'
  >();
});

test('the layout of the columns is JSON only, and its props take a layout, or a part of one', () => {
  expectTypeOf<IsJson<DataGridColumnLayout>>().toEqualTypeOf<true>();
  expectTypeOf<DataGridState['columnLayout']>().toEqualTypeOf<DataGridColumnLayout>();
  expectTypeOf<DataGridColumnLayout>().toEqualTypeOf<{
    order: readonly string[];
    widths: Readonly<Record<string, number>>;
    hidden: readonly string[];
    pinned: Readonly<Record<string, DataGridPin>>;
  }>();
  expectTypeOf<DataGridProps<Order>['columnLayout']>().toEqualTypeOf<
    DataGridColumnLayout | undefined
  >();
  expectTypeOf<DataGridProps<Order>['defaultColumnLayout']>().toEqualTypeOf<
    Partial<DataGridColumnLayout> | undefined
  >();
  expectTypeOf<DataGridProps<Order>['onColumnLayoutChange']>().toEqualTypeOf<
    ((layout: DataGridColumnLayout) => void) | undefined
  >();
  // A default layout may give one part.
  const part: DataGridProps<Order>['defaultColumnLayout'] = { hidden: ['paid'] };
  void part;
  // @ts-expect-error a pin is on the left or on the right
  const pin: DataGridColumnLayout['pinned'] = { id: 'top' };
  void pin;
  // @ts-expect-error a width is a number
  const widths: DataGridColumnLayout['widths'] = { id: '100px' };
  void widths;
});

test('a column says where it is pinned and whether it is shown', () => {
  expectTypeOf<DataGridPin>().toEqualTypeOf<'left' | 'right'>();
  const pinned: DataGridProps<Order>['columns'] = [
    { field: 'id', pinned: 'left' },
    { field: 'total', pinned: 'right', visible: false },
  ];
  void pinned;
  // @ts-expect-error a column is pinned to the left or to the right
  const top: DataGridProps<Order>['columns'] = [{ field: 'id', pinned: 'top' }];
  void top;
  // @ts-expect-error visible is a boolean
  const no: DataGridProps<Order>['columns'] = [{ field: 'id', visible: 'no' }];
  void no;
});

test('resizing is a boolean of the grid and of a column, and its two words are labels', () => {
  expectTypeOf<DataGridProps<Order>['allowResizing']>().toEqualTypeOf<boolean | undefined>();
  const columns: DataGridProps<Order>['columns'] = [
    { field: 'id', allowResizing: false },
    { field: 'total', allowResizing: true },
  ];
  void columns;
  // @ts-expect-error resizing is a boolean
  const no: DataGridProps<Order>['columns'] = [{ field: 'id', allowResizing: 'no' }];
  void no;
  expectTypeOf<DataGridLabels['columnWidth']>().toEqualTypeOf<(px: number) => string>();
  expectTypeOf<DataGridLabels['announceResized']>().toEqualTypeOf<
    (caption: string, px: number) => string
  >();
  // The state is the layout: a resize adds nothing of its own to it.
  expectTypeOf<keyof DataGridState>().toEqualTypeOf<
    | 'sort'
    | 'filter'
    | 'page'
    | 'selectedKeys'
    | 'columnLayout'
    | 'grouping'
    | 'expandedGroups'
    | 'expandedRows'
  >();
});

test('reordering is a boolean of the grid and of a column, and its words are a label', () => {
  expectTypeOf<DataGridProps<Order>['allowReordering']>().toEqualTypeOf<boolean | undefined>();
  const columns: DataGridProps<Order>['columns'] = [
    { field: 'id', allowReordering: false },
    { field: 'total', allowReordering: true },
  ];
  void columns;
  // @ts-expect-error reordering is a boolean
  const no: DataGridProps<Order>['columns'] = [{ field: 'id', allowReordering: 'no' }];
  void no;
  expectTypeOf<DataGridLabels['announceMoved']>().toEqualTypeOf<
    (caption: string, position: number, count: number) => string
  >();
});

test('pinning and hiding are booleans of the grid and of a column, and their words are labels', () => {
  expectTypeOf<DataGridProps<Order>['allowPinning']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<DataGridProps<Order>['allowHiding']>().toEqualTypeOf<boolean | undefined>();
  const columns: DataGridProps<Order>['columns'] = [
    { field: 'id', allowPinning: false, allowHiding: false },
    { field: 'total', allowPinning: true, allowHiding: true },
  ];
  void columns;
  // @ts-expect-error pinning is a boolean
  const noPin: DataGridProps<Order>['columns'] = [{ field: 'id', allowPinning: 'no' }];
  void noPin;
  // @ts-expect-error hiding is a boolean
  const noHide: DataGridProps<Order>['columns'] = [{ field: 'id', allowHiding: 'no' }];
  void noHide;
  expectTypeOf<DataGridLabels['columnMenu']>().toEqualTypeOf<(caption: string) => string>();
  expectTypeOf<
    Pick<
      DataGridLabels,
      | 'sortAscending'
      | 'sortDescending'
      | 'clearSorting'
      | 'pinLeft'
      | 'pinRight'
      | 'unpin'
      | 'moveLeft'
      | 'moveRight'
      | 'autoFit'
      | 'hideColumn'
    >
  >().toEqualTypeOf<
    Record<
      | 'sortAscending'
      | 'sortDescending'
      | 'clearSorting'
      | 'pinLeft'
      | 'pinRight'
      | 'unpin'
      | 'moveLeft'
      | 'moveRight'
      | 'autoFit'
      | 'hideColumn',
      string
    >
  >();
  expectTypeOf<DataGridLabels['announcePinned']>().toEqualTypeOf<
    (caption: string, side: 'left' | 'right') => string
  >();
  expectTypeOf<DataGridLabels['announceUnpinned']>().toEqualTypeOf<(caption: string) => string>();
  expectTypeOf<DataGridLabels['announceHidden']>().toEqualTypeOf<(caption: string) => string>();
});

test('the column chooser is a boolean, and the toolbar is `false` or a function of its items', () => {
  expectTypeOf<DataGridProps<Order>['columnChooser']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<DataGridProps<Order>['toolbar']>().toEqualTypeOf<
    false | ((items: DataGridToolbarItems) => ReactNode) | undefined
  >();
  expectTypeOf<DataGridToolbarItems>().toEqualTypeOf<{
    spacer: ReactNode;
    search: ReactNode;
    columnChooser: ReactNode;
    groupPanel: ReactNode;
    addButton: ReactNode;
  }>();
  const own: DataGridProps<Order>['toolbar'] = (items) => [
    items.spacer,
    items.search,
    items.columnChooser,
  ];
  void own;
  // @ts-expect-error `true` is not a toolbar
  const yes: DataGridProps<Order>['toolbar'] = true;
  void yes;
  // @ts-expect-error an item of a later plan is not there to place yet
  const exportCsv: DataGridProps<Order>['toolbar'] = (items) => items.exportCsv;
  void exportCsv;
  expectTypeOf<DataGridLabels['announceShown']>().toEqualTypeOf<(caption: string) => string>();
  expectTypeOf<DataGridLabels['columnChooser']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['lockedColumn']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['lastShownColumn']>().toEqualTypeOf<string>();
});

test('the search field is a boolean or an object with a placeholder, and its two words are labels', () => {
  expectTypeOf<DataGridProps<Order>['searchPanel']>().toEqualTypeOf<
    boolean | { placeholder?: string } | undefined
  >();
  const placeholder: DataGridProps<Order>['searchPanel'] = { placeholder: 'Find an order' };
  void placeholder;
  // @ts-expect-error a placeholder is text
  const wrong: DataGridProps<Order>['searchPanel'] = { placeholder: 3 };
  void wrong;
  // @ts-expect-error a string is not a search panel
  const text: DataGridProps<Order>['searchPanel'] = 'yes';
  void text;
  expectTypeOf<DataGridLabels['search']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['searchPlaceholder']>().toEqualTypeOf<string>();
});

test('the filter is a controlled value of the filter type, and clearFilter and its words are typed', () => {
  expectTypeOf<DataGridProps<Order>['filter']>().toEqualTypeOf<DataGridFilter | undefined>();
  expectTypeOf<DataGridProps<Order>['defaultFilter']>().toEqualTypeOf<DataGridFilter | undefined>();
  expectTypeOf<DataGridProps<Order>['onFilterChange']>().toEqualTypeOf<
    ((filter: DataGridFilter) => void) | undefined
  >();
  expectTypeOf<DataGridState['filter']>().toEqualTypeOf<DataGridFilter>();
  expectTypeOf<DataGridHandle['clearFilter']>().toEqualTypeOf<() => void>();
  expectTypeOf<DataGridLabels['noMatches']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['clearFilter']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['announceRowsFound']>().toEqualTypeOf<(count: number) => string>();
  // @ts-expect-error a filter is an object, not a search text
  const text: DataGridProps<Order>['filter'] = 'minh';
  void text;
});

test('the filter panel: its prop, and the labels of its sentence', () => {
  expectTypeOf<DataGridProps<Order>['filterPanel']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<DataGridLabels['and']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['isAnyOf']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['isNoneOf']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['applyFilter']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['quoted']>().toEqualTypeOf<(text: string) => string>();
  // A range with one open end is said with `>=` or `<=`, so `between` has no word of its own here.
  expectTypeOf<keyof DataGridLabels['panelOperators']>().toEqualTypeOf<
    '=' | '<>' | '<' | '>' | '<=' | '>=' | 'contains' | 'notContains' | 'startsWith' | 'endsWith'
  >();
  // The record is given in part, as `operators` is.
  expectTypeOf<DataGridLabelsInput['panelOperators']>().toEqualTypeOf<
    Partial<DataGridLabels['panelOperators']> | undefined
  >();
  // @ts-expect-error the panel is on or off: a string is no value of filterPanel
  const wrong: DataGridProps<Order> = { data: [], rowKey: 'id', columns: [], filterPanel: 'yes' };
  void wrong;
});
