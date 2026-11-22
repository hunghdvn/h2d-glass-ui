import { expectTypeOf, test } from 'vitest';
import type {
  DataGridColumn,
  DataGridColumnFilter,
  DataGridFilter,
  DataGridFilterOperator,
} from './index';

interface Order {
  id: string;
  customer: string;
  total: number;
}

test('the operators are the eleven of the spec, and no other', () => {
  expectTypeOf<DataGridFilterOperator>().toEqualTypeOf<
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
  const ok: DataGridColumnFilter = { operator: 'between', value: [1, 5] };
  expectTypeOf(ok).toBeObject();
  // @ts-expect-error `like` is no operator
  const like: DataGridColumnFilter = { operator: 'like', value: 'a' };
  expectTypeOf(like).toBeObject();
});

test('the filter holds only what JSON can carry: strings, booleans, arrays and plain objects', () => {
  expectTypeOf<DataGridFilter>().toEqualTypeOf<{
    search?: string;
    columns?: Readonly<Record<string, DataGridColumnFilter>>;
    enabled?: boolean;
  }>();
  expectTypeOf<DataGridColumnFilter>().toEqualTypeOf<{
    operator?: DataGridFilterOperator;
    value?: unknown;
    values?: readonly unknown[];
    exclude?: boolean;
  }>();
  // The parts a type can pin down are no function, symbol or Date.
  expectTypeOf<DataGridFilter['search']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<DataGridFilter['enabled']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<DataGridColumnFilter['exclude']>().toEqualTypeOf<boolean | undefined>();
  const ok: DataGridFilter = {
    search: 'minh',
    enabled: true,
    columns: { customer: { operator: 'contains', value: 'a' }, total: { values: [1, null] } },
  };
  expectTypeOf(ok).toBeObject();
  // @ts-expect-error the search is a string
  const numberSearch: DataGridFilter = { search: 5 };
  expectTypeOf(numberSearch).toBeObject();
  // @ts-expect-error a column's condition is an object
  const loose: DataGridFilter = { columns: { customer: 'a' } };
  expectTypeOf(loose).toBeObject();
  // @ts-expect-error `values` is a list
  const notAList: DataGridColumnFilter = { values: 'a' };
  expectTypeOf(notAList).toBeObject();
});

test('a column says what it filters by with booleans, operators and a list of values with text', () => {
  const ok: DataGridColumn<Order>[] = [
    { field: 'customer', allowFiltering: false, allowHeaderFiltering: false, allowSearch: false },
    { field: 'total', filterOperators: ['>', 'between'] },
    {
      id: 'status',
      value: () => 1,
      headerFilter: {
        values: [
          { value: 1, text: 'New' },
          { value: null, text: '(none)' },
        ],
      },
    },
  ];
  expectTypeOf(ok).toBeArray();
  // @ts-expect-error allowSearch is a boolean
  const word: DataGridColumn<Order> = { field: 'customer', allowSearch: 'no' };
  expectTypeOf(word).toBeObject();
  // @ts-expect-error allowFiltering is a boolean
  const number: DataGridColumn<Order> = { field: 'customer', allowFiltering: 1 };
  expectTypeOf(number).toBeObject();
  // @ts-expect-error `like` is no operator
  const operators: DataGridColumn<Order> = { field: 'customer', filterOperators: ['like'] };
  expectTypeOf(operators).toBeObject();
  const noText: DataGridColumn<Order> = {
    field: 'customer',
    // @ts-expect-error a header value has a text
    headerFilter: { values: [{ value: 1 }] },
  };
  expectTypeOf(noText).toBeObject();
});
