import { createRef } from 'react';
import type { ComponentProps, ReactElement } from 'react';
import { expectTypeOf, test } from 'vitest';
import { DataGrid } from './DataGrid';
import { dataGridColumn } from './data-grid-column';
import type { DataGridHandle, DataGridKey, DataGridProps } from './index';

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
  expectTypeOf<DataGridProps<Order>['labels']>().toEqualTypeOf<
    Partial<{ yes: string; no: string }> | undefined
  >();
});
