import { expectTypeOf, test } from 'vitest';
import { dataGridColumn } from './data-grid-column';
import type {
  DataGridCellContext,
  DataGridColumn,
  DataGridDataType,
  DataGridFieldColumn,
  DataGridKey,
  DataGridPage,
  DataGridSortDirection,
  DataGridSortItem,
  DataGridValueColumn,
} from './types';

interface Order {
  id: string;
  total: number;
  placed: string;
  paid: boolean;
  qty: number;
}

// A state type is JSON-only when every property is a JSON value: no function, symbol or Date.
type IsJson<T> = T extends string | number | boolean | null
  ? true
  : T extends readonly (infer U)[]
    ? IsJson<U>
    : T extends (...args: never[]) => unknown
      ? false
      : T extends object
        ? { [K in keyof T]: IsJson<T[K]> }[keyof T] extends true
          ? true
          : false
        : false;

test('field takes only the string keys of the row', () => {
  expectTypeOf<DataGridFieldColumn<Order>['field']>().toEqualTypeOf<keyof Order & string>();
  const ok: DataGridColumn<Order>[] = [{ field: 'total' }, { field: 'placed', caption: 'Placed' }];
  expectTypeOf(ok).toBeArray();
  // @ts-expect-error a key the row does not have
  const unknownField: DataGridColumn<Order> = { field: 'price' };
  expectTypeOf(unknownField).toBeObject();
  interface Keyed {
    1: string;
    name: string;
  }
  // @ts-expect-error a number key is not a string key
  const numberKey: DataGridColumn<Keyed> = { field: 1 };
  expectTypeOf(numberKey).toBeObject();
});

test('the cell and format of a field column take the type of that field', () => {
  const total: DataGridColumn<Order> = {
    field: 'total',
    cell(ctx) {
      expectTypeOf(ctx.value).toEqualTypeOf<number>();
      expectTypeOf(ctx.row).toEqualTypeOf<Order>();
      return ctx.text;
    },
    format: (value, row) => {
      expectTypeOf(value).toEqualTypeOf<number>();
      expectTypeOf(row).toEqualTypeOf<Order>();
      return String(value);
    },
  };
  const paid: DataGridColumn<Order> = {
    field: 'paid',
    cell: (ctx) => {
      expectTypeOf(ctx.value).toEqualTypeOf<boolean>();
      return null;
    },
  };
  expectTypeOf(total).toBeObject();
  expectTypeOf(paid).toBeObject();
});

test('a value column needs an id and a value function, and has no field', () => {
  const ok: DataGridColumn<Order> = { id: 'amount', value: (row) => row.qty * row.total };
  expectTypeOf(ok).toBeObject();
  // @ts-expect-error a value column without an id
  const noId: DataGridColumn<Order> = { value: (row) => row.qty };
  // @ts-expect-error neither a field nor a value
  const neither: DataGridColumn<Order> = { id: 'x' };
  // @ts-expect-error a field and a value together
  const both: DataGridColumn<Order> = { field: 'qty', id: 'x', value: (row) => row.qty };
  expectTypeOf(noId).toBeObject();
  expectTypeOf(neither).toBeObject();
  expectTypeOf(both).toBeObject();
});

test('dataGridColumn keeps the value type of a computed column', () => {
  const amount = dataGridColumn<Order>()({
    id: 'amount',
    value: (row) => row.qty * row.total,
    cell: (ctx) => {
      expectTypeOf(ctx.value).toEqualTypeOf<number>();
      return null;
    },
    format: (value) => value.toFixed(2),
  });
  expectTypeOf(amount).toEqualTypeOf<DataGridValueColumn<Order, number>>();
  const label = dataGridColumn<Order>()({
    id: 'label',
    value: (row) => (row.paid ? 'Paid' : null),
  });
  expectTypeOf(label).toEqualTypeOf<DataGridValueColumn<Order, 'Paid' | null>>();
  // Columns of different value types sit in one list.
  const columns: DataGridColumn<Order>[] = [amount, label, { field: 'placed' }];
  expectTypeOf(columns).toBeArray();
});

test('dataType accepts the five types and rejects anything else', () => {
  expectTypeOf<DataGridDataType>().toEqualTypeOf<
    'string' | 'number' | 'date' | 'datetime' | 'boolean'
  >();
  // @ts-expect-error not a type of the grid
  const money: DataGridColumn<Order> = { field: 'total', dataType: 'money' };
  expectTypeOf(money).toBeObject();
});

test('the cell context carries what a custom cell needs', () => {
  expectTypeOf<DataGridCellContext<Order, number>>().toEqualTypeOf<{
    row: Order;
    rowKey: DataGridKey;
    value: number;
    text: string;
    column: {
      readonly id: string;
      readonly caption: string;
      readonly dataType: DataGridDataType;
      readonly align: 'start' | 'center' | 'end';
    };
    selected: boolean;
  }>();
});

test('the sort item and the page hold JSON only', () => {
  expectTypeOf<DataGridSortItem>().toEqualTypeOf<{
    field: string;
    direction: DataGridSortDirection;
  }>();
  expectTypeOf<DataGridPage>().toEqualTypeOf<{ index: number; size: number }>();
  expectTypeOf<IsJson<DataGridSortItem>>().toEqualTypeOf<true>();
  expectTypeOf<IsJson<readonly DataGridSortItem[]>>().toEqualTypeOf<true>();
  expectTypeOf<IsJson<DataGridPage>>().toEqualTypeOf<true>();
  // The check itself can fail: a Date is not JSON.
  expectTypeOf<IsJson<{ at: Date }>>().toEqualTypeOf<false>();
  expectTypeOf<IsJson<{ run(): void }>>().toEqualTypeOf<false>();
});
