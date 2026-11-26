import { expectTypeOf, test } from 'vitest';
import { dataGridColumn } from './data-grid-column';
import type { DialogSize } from '../dialog/Dialog';
import type {
  DataGridChange,
  DataGridColumn,
  DataGridEditMode,
  DataGridEditing,
  DataGridEditorContext,
  DataGridProps,
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

test('the modes of editing are the ones built so far, and no other', () => {
  expectTypeOf<DataGridEditMode>().toEqualTypeOf<'row' | 'cell' | 'batch' | 'form' | 'popup'>();
  const ok: DataGridEditing<Order> = { mode: 'row', allowUpdating: (row) => row.qty > 0 };
  void ok;
  const cell: DataGridEditing<Order> = { mode: 'cell', startEditAction: 'dblClick' };
  void cell;
  const batch: DataGridEditing<Order> = { mode: 'batch', allowDeleting: true };
  void batch;
  const form: DataGridEditing<Order> = { mode: 'form', allowDeleting: true };
  void form;
  // @ts-expect-error a mode that is not built
  const bad: DataGridEditing<Order> = { mode: 'inline' };
  void bad;
});

test('the editor of a column is given the value of its field, and a context that can set it', () => {
  const columns: DataGridColumn<Order>[] = [
    {
      field: 'qty',
      editor(ctx) {
        expectTypeOf(ctx.value).toEqualTypeOf<number | null>();
        expectTypeOf(ctx.row).toEqualTypeOf<Partial<Order>>();
        expectTypeOf(ctx.setValue).toEqualTypeOf<(value: number | null) => void>();
        expectTypeOf(ctx.mode).toEqualTypeOf<DataGridEditMode>();
        expectTypeOf(ctx.size).toEqualTypeOf<'sm' | 'md'>();
        expectTypeOf(ctx.errorId).toEqualTypeOf<string | undefined>();
        return null;
      },
    },
    {
      field: 'placed',
      dataType: 'date',
      multiline: true,
      lookup: { items: [], valueField: 'a', displayField: 'b', searchable: true },
    },
  ];
  expectTypeOf(columns).toBeArray();
  expectTypeOf<DataGridEditorContext<Order, string>['value']>().toEqualTypeOf<string | null>();
});

test('onSaving is given the changes of its rows, and may return a Promise', () => {
  const props: Pick<DataGridProps<Order>, 'onSaving' | 'editing'> = {
    editing: { mode: 'row' },
    onSaving(changes) {
      expectTypeOf(changes).toEqualTypeOf<readonly DataGridChange<Order>[]>();
      return Promise.resolve();
    },
  };
  void props;
  const sync: DataGridProps<Order>['onSaving'] = () => {};
  void sync;
});

test('the labels of editing are the words of the buttons, by the name of the row', () => {
  expectTypeOf<DataGridLabels['edit']>().toEqualTypeOf<(name: string) => string>();
  expectTypeOf<DataGridLabels['save']>().toEqualTypeOf<(name: string) => string>();
  expectTypeOf<DataGridLabels['cancelEdit']>().toEqualTypeOf<(name: string) => string>();
  expectTypeOf<DataGridLabels['actions']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['announceSaved']>().toEqualTypeOf<string>();
});

test('adding rows is a flag, a position and a function of the fields a new row starts with', () => {
  expectTypeOf<DataGridEditing<Order>['allowAdding']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<DataGridEditing<Order>['newRowPosition']>().toEqualTypeOf<
    'first' | 'last' | undefined
  >();
  expectTypeOf<DataGridProps<Order>['initNewRow']>().toEqualTypeOf<
    (() => Partial<Order>) | undefined
  >();
  // @ts-expect-error a position is first or last
  const bad: DataGridEditing<Order> = { mode: 'row', newRowPosition: 'middle' };
  void bad;
  expectTypeOf<DataGridLabels['addRow']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['newRow']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['announceRowAdded']>().toEqualTypeOf<string>();
});

test('the form is a column field with a visibility and a span, and its words are labels', () => {
  expectTypeOf<DataGridLabels['editRowTitle']>().toEqualTypeOf<(name: string) => string>();
  expectTypeOf<DataGridLabels['newRowTitle']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['requiredHint']>().toEqualTypeOf<string>();
  expectTypeOf<DataGridLabels['saveButton']>().toEqualTypeOf<string>();
  const column: DataGridColumn<Order> = { field: 'id', form: { visible: false, span: 2 } };
  void column;
  // @ts-expect-error a field is one column wide or two
  const bad: DataGridColumn<Order> = { field: 'id', form: { span: 3 } };
  void bad;
});

test('the popup of editing takes a Dialog size and two flags, and no other option', () => {
  const popup: DataGridEditing<Order> = {
    mode: 'popup',
    popup: { size: 'sm', movable: true, fullScreenOnPhone: false },
  };
  void popup;
  expectTypeOf<NonNullable<DataGridEditing<Order>['popup']>['size']>().toEqualTypeOf<
    DialogSize | undefined
  >();
  expectTypeOf<NonNullable<DataGridEditing<Order>['popup']>['movable']>().toEqualTypeOf<
    boolean | undefined
  >();
  expectTypeOf<NonNullable<DataGridEditing<Order>['popup']>['fullScreenOnPhone']>().toEqualTypeOf<
    boolean | undefined
  >();
  // @ts-expect-error a size the Dialog does not have
  const bad: DataGridEditing<Order> = { mode: 'popup', popup: { size: 'xl' } };
  void bad;
});

test('the context of an editor says whether the save of its row is pending', () => {
  expectTypeOf<DataGridEditorContext<Order, string>['saving']>().toEqualTypeOf<boolean>();
});
