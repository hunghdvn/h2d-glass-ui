/** Pure number helpers shared by NumberInput and Slider (and any future numeric control). */

import { numberFormat as getFormatter } from './intl';

/** Clamp `value` to the inclusive range `[min, max]`. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** A fraction as a percentage, without the noise of floating point (0.57 * 100 is 56.99999999999999). */
export const toPercent = (fraction: number): number => Number((fraction * 100).toFixed(4));

/** A fraction as a percentage for CSS, such as `57%`. */
export const cssPercent = (fraction: number): string => `${toPercent(fraction)}%`;

/** Whether `n` is a finite number. */
export const isNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** A length as `getComputedStyle` gives it (`"16px"`), in pixels; 0 when there is none. */
export const px = (value: string): number => Number.parseFloat(value) || 0;

/**
 * Put `n` onto the grid `origin + k*step`, inside `[low, high]`. An end that is not on the grid is
 * not reachable: the result is the nearest grid value inside it.
 */
export function fitToGrid(n: number, low: number, high: number, step: number, origin: number) {
  let fitted = snapToStep(clamp(n, low, high), step, origin);
  // Rounding may land one step past an end that is not on the grid.
  if (fitted > high) fitted = stepFrom(fitted, step, origin, 'down');
  if (fitted < low) fitted = stepFrom(fitted, step, origin, 'up');
  return clamp(fitted, low, high);
}

/** Count the decimal places in the shortest decimal representation of `n`. */
export function decimalsOf(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const text = n.toString();
  if (text.includes('e') || text.includes('E')) {
    // Fall back to a fixed representation for very large/small numbers.
    const fixed = n.toFixed(20);
    const trimmed = fixed.replace(/0+$/, '');
    const dot = trimmed.indexOf('.');
    return dot === -1 ? 0 : trimmed.length - dot - 1;
  }
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}

/** Round `value` onto the grid `min + k*step`, using the larger decimal count of `step` and `min`. */
export function snapToStep(value: number, step: number, min: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step === 0 || !Number.isFinite(min)) {
    return value;
  }
  const decimals = Math.max(decimalsOf(step), decimalsOf(min));
  const k = Math.round((value - min) / step);
  const raw = min + k * step;
  // `+ 0` turns a -0 (a tiny negative float error rounded away) into 0, which Intl would print as "-0".
  return (decimals > 0 ? Number(raw.toFixed(decimals)) : raw) + 0;
}

/** Direction of a step: `'up'` moves to the next grid value, `'down'` to the previous one. */
export type StepDirection = 'up' | 'down';

/** Move one step along the grid `min + k*step` in the given direction. */
export function stepFrom(
  value: number,
  step: number,
  min: number,
  direction: StepDirection,
): number {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step === 0 || !Number.isFinite(min)) {
    return value;
  }
  const up = direction === 'up';
  const decimals = Math.max(decimalsOf(step), decimalsOf(min));
  // `(value - min) / step` of a value on the grid is off by float error (0.3 / 0.1 is
  // 2.9999999999999996), which would floor back onto the same value: round the error away first.
  const ratio = Number(((value - min) / step).toFixed(9));
  const k = up ? Math.floor(ratio) + 1 : Math.ceil(ratio) - 1;
  const raw = min + k * step;
  // `+ 0` turns a -0 (a tiny negative float error rounded away) into 0, which Intl would print as "-0".
  return (decimals > 0 ? Number(raw.toFixed(decimals)) : raw) + 0;
}

/** Format a number with a cached `Intl.NumberFormat`. */
export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  return getFormatter(locale, options).format(value);
}

/** Parts a formatter adds around the digits: currency, percent sign, unit, group, literal text. */
const NUMBER_PARTS = new Set([
  'integer',
  'fraction',
  'decimal',
  'minusSign',
  'plusSign',
  'exponentInteger',
  'exponentMinusSign',
  'exponentSeparator',
]);
function literalParts(parts: Intl.NumberFormatPart[]): string[] {
  return parts
    .filter((part) => !NUMBER_PARTS.has(part.type) && part.value !== '')
    .map((part) => part.value);
}

/** Parse a (possibly formatted) number back to a `number`, or `NaN` when unreadable. */
export function parseNumber(
  text: string,
  locale: string,
  options?: Intl.NumberFormatOptions,
): number {
  const trimmed = text.trim();
  if (trimmed === '') return NaN;

  const formatter = getFormatter(locale, options);
  const parts = formatter.formatToParts(12345.6789);
  let groupSeparator = '';
  let decimalSeparator = '';
  for (const part of parts) {
    if (part.type === 'group' && !groupSeparator) groupSeparator = part.value;
    else if (part.type === 'decimal' && !decimalSeparator) decimalSeparator = part.value;
  }

  // Fall back to the locale's plain formatter when the (possibly styled) one
  // does not emit a decimal separator, e.g. percent with zero fraction digits.
  if (!decimalSeparator) {
    const plainParts = getFormatter(locale).formatToParts(1.5);
    for (const part of plainParts) {
      if (part.type === 'decimal') decimalSeparator = part.value;
      else if (part.type === 'group' && !groupSeparator) groupSeparator = part.value;
    }
  }
  if (!decimalSeparator) decimalSeparator = '.';

  // Collect the literal fragments this formatter emits (currency, percent sign,
  // unit, literal spacing, ...) so they can be stripped. Anything not in this
  // list, not whitespace, and not the group separator survives and makes the
  // result NaN.
  const removable = [
    ...new Set([
      ...literalParts(parts),
      ...literalParts(getFormatter(locale).formatToParts(12345.6789)),
    ]),
  ];

  // Normalise minus signs.
  let working = trimmed.replace(/\u2212/g, '-');

  // Remove whitespace (space, NBSP, NNBSP and other Unicode spaces).
  working = working.replace(/[\s\u00A0\u202F]/g, '');

  // Remove the locale's group separator.
  if (groupSeparator) {
    working = working.split(groupSeparator).join('');
  }

  // Remove the fragments the formatter itself produces.
  for (const fragment of removable.sort((a, b) => b.length - a.length)) {
    working = working.split(fragment).join('');
  }

  if (working === '' || working === '-' || working === '+' || working === decimalSeparator) {
    return NaN;
  }

  // Replace the locale decimal separator with a dot.
  if (decimalSeparator !== '.') {
    const idx = working.indexOf(decimalSeparator);
    if (idx !== -1) {
      working = working.slice(0, idx) + '.' + working.slice(idx + decimalSeparator.length);
    }
  }

  // Validate the remaining token is a plain number. Any leftover character
  // (a letter, a second decimal separator, ...) makes it NaN.
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(working)) {
    return NaN;
  }

  const num = Number(working);
  if (!Number.isFinite(num)) return NaN;

  if (options?.style === 'percent') {
    return num / 100;
  }
  return num;
}
