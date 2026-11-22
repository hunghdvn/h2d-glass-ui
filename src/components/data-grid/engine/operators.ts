import type { DataGridDataType, DataGridFilterOperator } from '../types';

const TEXT: readonly DataGridFilterOperator[] = [
  'contains',
  'notContains',
  'startsWith',
  'endsWith',
  '=',
  '<>',
];
const ORDERED: readonly DataGridFilterOperator[] = ['=', '<>', '<', '>', '<=', '>=', 'between'];
const EQUALS: readonly DataGridFilterOperator[] = ['='];

/**
 * The operators the filter row can offer a column of this type, the default first (spec phase 6 §6.3):
 * text `contains`, numbers and days `=`, and only `=` for a boolean or a column with a lookup, which
 * the filter row draws as a `Select`. The lists are shared and not to be changed.
 */
export function operatorsFor(
  dataType: DataGridDataType,
  hasLookup: boolean,
): readonly DataGridFilterOperator[] {
  if (hasLookup) return EQUALS;
  switch (dataType) {
    case 'string':
      return TEXT;
    case 'boolean':
      return EQUALS;
    case 'number':
    case 'date':
    case 'datetime':
      return ORDERED;
  }
}
