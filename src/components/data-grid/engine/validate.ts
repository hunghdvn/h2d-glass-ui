import { isNumber } from '../../../internal/number';
import { devWarn } from '../../../internal/warn';
import type { DataGridLabels, DataGridValidationRule } from '../types';
import type { ResolvedColumn } from './columns';
import { isBlank, toFilterKey } from './values';

type Rule<TRow> = DataGridValidationRule<TRow, unknown>;

// One `@`, something before it, and after it a dot with something on both sides; no space anywhere. Loose on
// purpose: the address is confirmed by sending to it, not by a pattern.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The ends of a range as the cells write a value: by the column's own format, and as they came when the
// column cannot write them.
function end(
  column: Pick<ResolvedColumn<unknown>, 'valueText'>,
  value: number | string | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  return column.valueText(value) || String(value);
}

// The rules of a column as the caller gave them; anything but an array has none.
function rulesOf<TRow>(column: ResolvedColumn<TRow>): readonly Rule<TRow>[] {
  const { validationRules } = column.column;
  return Array.isArray(validationRules) ? (validationRules as readonly Rule<TRow>[]) : [];
}

// Whether `value` is outside the ends of the rule. Numbers are compared by value and days by their
// ISO day (a `Date` or a string alike); a value of another type, or an end of another type, is not
// compared, so the editor of that type shows its own fault.
function outsideRange<TRow>(
  rule: Extract<Rule<TRow>, { type: 'range' }>,
  value: unknown,
  column: ResolvedColumn<TRow>,
): boolean {
  if (column.dataType === 'number' && isNumber(value)) {
    return (isNumber(rule.min) && value < rule.min) || (isNumber(rule.max) && value > rule.max);
  }
  if (column.dataType === 'date') {
    const day = toFilterKey(value, 'date', 'UTC');
    if (typeof day !== 'string') return false;
    return (
      (typeof rule.min === 'string' && day < rule.min) ||
      (typeof rule.max === 'string' && day > rule.max)
    );
  }
  return false;
}

// What a rule says of a value that is not blank (or is, for `required` and `custom`): the message, or
// `null` when the value passes.
function failure<TRow>(
  rule: Rule<TRow>,
  value: unknown,
  column: ResolvedColumn<TRow>,
  row: Partial<TRow>,
  labels: DataGridLabels,
): string | null {
  const words = labels.validation;
  const own = typeof rule.message === 'string' ? rule.message : undefined;
  const { caption } = column;
  switch (rule.type) {
    case 'required':
      return isBlank(value) ? (own ?? words.required(caption)) : null;
    case 'custom': {
      let result: string | boolean | null | undefined;
      try {
        result = rule.validate(value, row);
      } catch {
        devWarn('<DataGrid> a custom validation rule threw; the value passes it.');
        return null;
      }
      if (result === false) return own ?? words.pattern(caption);
      return typeof result === 'string' && result !== '' ? result : null;
    }
  }
  if (isBlank(value)) return null;
  switch (rule.type) {
    case 'range':
      return outsideRange(rule, value, column)
        ? (own ?? words.range(caption, end(column, rule.min), end(column, rule.max)))
        : null;
    case 'stringLength': {
      const length = [...String(value)].length;
      const short = rule.min !== undefined && length < rule.min;
      const long = rule.max !== undefined && length > rule.max;
      return short || long ? (own ?? words.stringLength(caption, rule.min, rule.max)) : null;
    }
    case 'pattern': {
      if (!(rule.pattern instanceof RegExp)) return null;
      // A global or sticky expression remembers where its last match ended.
      rule.pattern.lastIndex = 0;
      return rule.pattern.test(String(value)) ? null : (own ?? words.pattern(caption));
    }
    case 'email':
      return EMAIL.test(String(value)) ? null : (own ?? words.email(caption));
    default:
      return null;
  }
}

/** Whether a column has a rule to check a value by: a commit of a column with none changes none of its messages. */
export function hasRules<TRow>(column: ResolvedColumn<TRow>): boolean {
  return rulesOf(column).length > 0;
}

/**
 * The message of the first rule that fails for a value, or `null` when it passes them all; the rules
 * after the one that fails are not run. Every rule but `required` (and `custom`, which is the app's own)
 * passes a blank value. A rule's own `message` wins over the words of `labels.validation`, which name the
 * column's caption and write the ends of a range as the cells write a value. A rule that throws passes,
 * with a warning, and a rule of a type the grid does not know is ignored.
 */
export function validateValue<TRow>(
  value: unknown,
  rules: readonly Rule<TRow>[],
  column: ResolvedColumn<TRow>,
  row: Partial<TRow>,
  labels: DataGridLabels,
): string | null {
  for (const rule of rules) {
    const message = failure(rule, value, column, row, labels);
    if (message !== null) return message;
  }
  return null;
}

/**
 * The messages of a row, by column id, in the order of the columns, for the columns it is given (the
 * caller decides which: the cells a row draws, or every column of a form). A field the row does not hold
 * is a blank.
 */
export function validateRow<TRow>(
  row: Partial<TRow>,
  columns: readonly ResolvedColumn<TRow>[],
  labels: DataGridLabels,
): ReadonlyMap<string, string> {
  const errors = new Map<string, string>();
  for (const column of columns) {
    const rules = rulesOf(column);
    if (rules.length === 0) continue;
    const message = validateValue(column.value(row as TRow), rules, column, row, labels);
    if (message !== null) errors.set(column.id, message);
  }
  return errors;
}
