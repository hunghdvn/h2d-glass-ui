/** The date props of Calendar and DatePicker, read the same way, with warnings that name them. */

import { compareIso, isIsoDate, isIsoMonth } from './date';
import { devWarn } from './warn';

/**
 * `value` as it is, or undefined with a warning that names the component and the prop when it is not
 * a date written 'YYYY-MM-DD' (or, for `kind: 'month'`, a month written 'YYYY-MM').
 */
export function checkedIso(
  component: string,
  name: string,
  value: string | null | undefined,
  kind: 'date' | 'month' = 'date',
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (kind === 'date' ? isIsoDate(value) : isIsoMonth(value)) return value;
  devWarn(
    `${component}: ${name} "${String(value)}" is not ${
      kind === 'date' ? 'a date written YYYY-MM-DD' : 'a month written YYYY-MM'
    }; it is ignored.`,
  );
  return undefined;
}

/**
 * `min` and `max` as they can be used. A date that cannot be read is left out, so a typo shows a
 * control without that limit, not none; `min` after `max` is a mistake, and both are left out.
 */
export function checkedLimits(
  component: string,
  minProp: string | undefined,
  maxProp: string | undefined,
): { min: string | undefined; max: string | undefined } {
  const min = checkedIso(component, 'min', minProp);
  const max = checkedIso(component, 'max', maxProp);
  if (min !== undefined && max !== undefined && compareIso(min, max) > 0) {
    devWarn(`${component}: min (${min}) is after max (${max}); both are ignored.`);
    return { min: undefined, max: undefined };
  }
  return { min, max };
}
