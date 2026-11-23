import { expectTypeOf, test } from 'vitest';
import type {
  DataGridColumn,
  DataGridExpandedGroups,
  DataGridGroupItem,
  DataGridLabelsInput,
  DataGridProps,
  DataGridSortDirection,
  DataGridSummaryItem,
} from './index';

interface Order {
  id: string;
  customer: string;
  total: number;
}

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

test('a grouping item names a column and a direction of the sort, and no other', () => {
  expectTypeOf<DataGridGroupItem>().toEqualTypeOf<{
    field: string;
    direction: DataGridSortDirection;
  }>();
  const ok: DataGridGroupItem = { field: 'customer', direction: 'desc' };
  expectTypeOf(ok).toBeObject();
  // @ts-expect-error `up` is no direction
  const up: DataGridGroupItem = { field: 'customer', direction: 'up' };
  expectTypeOf(up).toBeObject();
});

test('the groups that are open are JSON: a switch and the keys of the exceptions', () => {
  expectTypeOf<DataGridExpandedGroups>().toEqualTypeOf<{
    allExpanded: boolean;
    except: readonly string[];
  }>();
  expectTypeOf<IsJson<DataGridExpandedGroups>>().toEqualTypeOf<true>();
  expectTypeOf<IsJson<DataGridGroupItem>>().toEqualTypeOf<true>();
});

test('a summary item takes the five types, or a function of the rows, and no other word', () => {
  const named: DataGridSummaryItem<Order>[] = [
    { column: 'total', type: 'count' },
    { column: 'total', type: 'sum', label: 'Sum', format: { style: 'currency', currency: 'VND' } },
    { id: 'mean', column: 'total', field: 'total', type: 'avg' },
    { column: 'total', type: 'min' },
    { column: 'total', type: 'max', format: (value) => String(value) },
  ];
  expectTypeOf(named).toBeArray();
  // A function reads the rows and gives any value.
  const own: DataGridSummaryItem<Order> = {
    column: 'id',
    type: (rows) => {
      expectTypeOf(rows).toEqualTypeOf<readonly Order[]>();
      return rows.length;
    },
  };
  expectTypeOf(own).toBeObject();
  // @ts-expect-error `median` is no type
  const median: DataGridSummaryItem<Order> = { column: 'total', type: 'median' };
  expectTypeOf(median).toBeObject();
});

test('a column says whether it groups and whether it stays shown while it does', () => {
  const columns: DataGridColumn<Order>[] = [
    { field: 'customer', allowGrouping: false },
    { field: 'total', dataType: 'number', showWhenGrouped: true },
  ];
  expectTypeOf(columns).toBeArray();
  // @ts-expect-error a switch is a boolean
  const wrong: DataGridColumn<Order> = { field: 'customer', allowGrouping: 'yes' };
  expectTypeOf(wrong).toBeObject();
});

test('the summary prop has a list of items for the footer and one for the group rows', () => {
  const summary: NonNullable<DataGridProps<Order>['summary']> = {
    total: [{ column: 'total', type: 'sum' }],
    group: [{ column: 'total', type: 'avg' }],
  };
  expectTypeOf(summary).toBeObject();
  // @ts-expect-error `footer` is no list of totals
  const wrong: DataGridProps<Order>['summary'] = { footer: [] };
  expectTypeOf(wrong).toEqualTypeOf<DataGridProps<Order>['summary']>();
  // The server's totals are values by id; the labels of the types are a partial record, by type.
  expectTypeOf<DataGridProps<Order>['totalSummary']>().toEqualTypeOf<
    Readonly<Record<string, unknown>> | undefined
  >();
  const labels: DataGridLabelsInput = { summary: { sum: 'Sum' } };
  expectTypeOf(labels).toBeObject();
  // @ts-expect-error `median` is no type of total
  const median: DataGridLabelsInput = { summary: { median: 'Median' } };
  expectTypeOf(median).toBeObject();
});
