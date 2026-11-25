import { expectTypeOf, test } from 'vitest';
import { dataGridColumn } from './data-grid-column';
import type {
  DataGridChange,
  DataGridColumn,
  DataGridKey,
  DataGridLabels,
  DataGridLabelsInput,
  DataGridValidationRule,
} from './types';

interface Order {
  id: string;
  qty: number;
  price: number;
  placed: string;
}

test('a change is told by its type, and only an insert has a key the app does not know', () => {
  expectTypeOf<Extract<DataGridChange<Order>, { type: 'insert' }>['key']>().toEqualTypeOf<string>();
  expectTypeOf<Extract<DataGridChange<Order>, { type: 'update' }>>().toEqualTypeOf<{
    type: 'update';
    key: DataGridKey;
    data: Partial<Order>;
    row: Order;
  }>();
  expectTypeOf<Extract<DataGridChange<Order>, { type: 'remove' }>['row']>().toEqualTypeOf<Order>();
});

test('a rule takes the value of its column and the row being edited', () => {
  const rules: DataGridValidationRule<Order, number>[] = [
    { type: 'required' },
    { type: 'range', min: 1, max: 9, message: 'Out of range' },
    { type: 'stringLength', min: 1 },
    { type: 'pattern', pattern: /^\d+$/ },
    { type: 'email' },
    {
      type: 'custom',
      validate(value, row) {
        expectTypeOf(value).toEqualTypeOf<number | null>();
        expectTypeOf(row).toEqualTypeOf<Partial<Order>>();
        return row.price === undefined ? 'no price' : true;
      },
    },
  ];
  expectTypeOf(rules).toBeArray();
  // @ts-expect-error a rule of another type does not exist
  const bad: DataGridValidationRule<Order, number> = { type: 'unique' };
  void bad;
});

test('a column may allow editing by row, name its rules, and a computed one turns a value into fields', () => {
  const columns: DataGridColumn<Order>[] = [
    { field: 'qty', allowEditing: false, validationRules: [{ type: 'required' }] },
    { field: 'price', allowEditing: (row) => row.qty > 0 },
    dataGridColumn<Order>()({
      id: 'total',
      value: (row) => row.qty * row.price,
      setValue: (row, value) => ({ ...row, price: (value ?? 0) / (row.qty ?? 1) }),
    }),
  ];
  expectTypeOf(columns).toBeArray();
});

test('the validation labels are functions of the caption, and a partial record is enough', () => {
  expectTypeOf<DataGridLabels['validation']['required']>().toEqualTypeOf<
    (caption: string) => string
  >();
  expectTypeOf<DataGridLabels['validation']['range']>().toEqualTypeOf<
    (caption: string, min: string | undefined, max: string | undefined) => string
  >();
  expectTypeOf<DataGridLabels['validation']['stringLength']>().toEqualTypeOf<
    (caption: string, min: number | undefined, max: number | undefined) => string
  >();
  const input: DataGridLabelsInput = { validation: { required: (caption) => `${caption}?` } };
  void input;
});
