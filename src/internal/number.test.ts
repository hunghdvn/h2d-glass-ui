import { describe, expect, it } from 'vitest';
import {
  clamp,
  cssPercent,
  decimalsOf,
  fitToGrid,
  formatNumber,
  isNumber,
  parseNumber,
  px,
  snapToStep,
  stepFrom,
  toPercent,
} from './number';

describe('clamp', () => {
  it('clamps a value below min up to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps a value above max down to max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('leaves an in-range value unchanged', () => {
    expect(clamp(4, 0, 10)).toBe(4);
  });
});

describe('decimalsOf', () => {
  it('counts decimal places', () => {
    expect(decimalsOf(0.1)).toBe(1);
    expect(decimalsOf(0.05)).toBe(2);
    expect(decimalsOf(5)).toBe(0);
    expect(decimalsOf(1.234)).toBe(3);
  });
});

describe('snapToStep', () => {
  it('never returns -0', () => {
    expect(Object.is(snapToStep(-0.1, 1, 0), 0)).toBe(true);
    expect(Object.is(snapToStep(-0.01, 0.3, -0.9), -0.9)).toBe(false);
    expect(Object.is(snapToStep(-0.9 + 0.3 * 3 - 1e-12, 0.3, -0.9), 0)).toBe(true);
  });

  it('rounds 0.1 + 0.2 to 0.3 on a step of 0.1 from min 0', () => {
    expect(snapToStep(0.1 + 0.2, 0.1, 0)).toBe(0.3);
  });

  it('snaps to the grid min + k*step using the larger decimal count', () => {
    expect(snapToStep(0.3, 0.1, 0.05)).toBe(0.35);
  });

  it('snaps an arbitrary value to the nearest step', () => {
    expect(snapToStep(7, 5, 0)).toBe(5);
  });
});

describe('stepFrom', () => {
  it('never returns -0', () => {
    expect(Object.is(stepFrom(0.3, 0.3, -0.9, 'down'), 0)).toBe(true);
    expect(Object.is(stepFrom(1, 1, 0, 'down'), 0)).toBe(true);
  });

  it('steps up from 7 with step 5 to 10, not 12', () => {
    expect(stepFrom(7, 5, 0, 'up')).toBe(10);
  });

  it('steps down from 7 with step 5 to 5', () => {
    expect(stepFrom(7, 5, 0, 'down')).toBe(5);
  });

  it('steps up from an on-grid value to the next grid value', () => {
    expect(stepFrom(5, 5, 0, 'up')).toBe(10);
  });

  it('steps down from an on-grid value to the previous grid value', () => {
    expect(stepFrom(5, 5, 0, 'down')).toBe(0);
  });

  it('steps up from 10 with step 5 to 15', () => {
    expect(stepFrom(10, 5, 0, 'up')).toBe(15);
  });

  it('steps up with decimals', () => {
    expect(stepFrom(0.25, 0.1, 0, 'up')).toBe(0.3);
  });

  // value = min + k*step carries float error in (value - min) / step (0.3 / 0.1 is 2.9999999999999996),
  // so a value on the grid must still move to its neighbour, not stay where it is.
  it.each([
    [0.1, 0],
    [0.05, 0],
    [0.01, 0],
    [0.1, 0.05],
  ])('moves every on-grid value of step %s from min %s to its neighbours', (step, min) => {
    const decimals = Math.max(decimalsOf(step), decimalsOf(min));
    const onGrid = (k: number) => Number((min + k * step).toFixed(decimals));
    for (let k = 1; k < 1000; k += 1) {
      expect(stepFrom(onGrid(k), step, min, 'up')).toBe(onGrid(k + 1));
      expect(stepFrom(onGrid(k), step, min, 'down')).toBe(onGrid(k - 1));
    }
  });
});

describe('formatNumber', () => {
  it('formats en-US with group and decimal separators', () => {
    expect(formatNumber(1234.5, 'en-US')).toContain('1,234.5');
  });

  it('formats vi-VN with swapped separators', () => {
    const out = formatNumber(1234.5, 'vi-VN');
    expect(out).toContain('1.234,5');
  });

  it('formats de-DE with swapped separators', () => {
    const out = formatNumber(1234.5, 'de-DE');
    expect(out).toContain('1.234,5');
  });

  it('formats percent', () => {
    expect(formatNumber(0.5, 'en-US', { style: 'percent' })).toContain('50');
  });

  it('formats currency', () => {
    const out = formatNumber(1234.5, 'en-US', { style: 'currency', currency: 'USD' });
    expect(out).toContain('1,234.50');
  });
});

describe('parseNumber', () => {
  it('parses en-US formatted text', () => {
    expect(parseNumber('1,234.5', 'en-US')).toBe(1234.5);
  });

  it('parses vi-VN formatted text with swapped separators', () => {
    expect(parseNumber('1.234,5', 'vi-VN')).toBe(1234.5);
  });

  it('parses de-DE formatted text with swapped separators', () => {
    expect(parseNumber('1.234,5', 'de-DE')).toBe(1234.5);
  });

  it('parses percent text back through format options', () => {
    const text = formatNumber(0.5, 'en-US', { style: 'percent' });
    expect(parseNumber(text, 'en-US', { style: 'percent' })).toBe(0.5);
  });

  it('parses currency text back through format options', () => {
    const text = formatNumber(1234.5, 'en-US', { style: 'currency', currency: 'USD' });
    expect(parseNumber(text, 'en-US', { style: 'currency', currency: 'USD' })).toBe(1234.5);
  });

  it('returns NaN for garbage', () => {
    expect(parseNumber('not a number', 'en-US')).toBeNaN();
  });

  it('returns NaN for embedded letters', () => {
    expect(parseNumber('1a2', 'en-US')).toBeNaN();
  });

  it('returns NaN for trailing letters', () => {
    expect(parseNumber('12abc', 'en-US')).toBeNaN();
  });

  it('returns NaN for multiple decimal separators', () => {
    expect(parseNumber('1.2.3', 'en-US')).toBeNaN();
  });

  it('handles NBSP and NNBSP whitespace', () => {
    expect(parseNumber('1\u00A0234,5'.replace(',', '.'), 'en-US')).not.toBeNaN();
  });

  it('parses NNBSP-separated vi-VN text', () => {
    expect(parseNumber('1\u202F234,5', 'vi-VN')).toBe(1234.5);
  });

  it('parses de-DE percent text with a space', () => {
    expect(parseNumber('12,5 %', 'de-DE', { style: 'percent' })).toBe(0.125);
  });

  it('parses en-US currency text', () => {
    expect(parseNumber('$1,234.50', 'en-US', { style: 'currency', currency: 'USD' })).toBe(1234.5);
  });
});

describe('round trip', () => {
  it('parseNumber(formatNumber(x)) === x for decimals', () => {
    const x = 1234.567;
    expect(parseNumber(formatNumber(x, 'en-US'), 'en-US')).toBe(x);
  });
});

describe('isNumber', () => {
  it('accepts finite numbers only', () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(NaN)).toBe(false);
    expect(isNumber(Infinity)).toBe(false);
    expect(isNumber('1')).toBe(false);
    expect(isNumber(undefined)).toBe(false);
  });
});

describe('px', () => {
  it('reads a computed length in pixels, and 0 when there is none', () => {
    expect(px('16px')).toBe(16);
    expect(px('10.5px')).toBe(10.5);
    expect(px('')).toBe(0);
    expect(px('auto')).toBe(0);
  });
});

describe('fitToGrid', () => {
  it('snaps onto the grid inside the range', () => {
    expect(fitToGrid(7, 0, 100, 5, 0)).toBe(5);
    expect(fitToGrid(8, 0, 100, 5, 0)).toBe(10);
  });

  it('steps back inside a high end that is off the grid', () => {
    expect(fitToGrid(10, 0, 10, 3, 0)).toBe(9);
    expect(fitToGrid(99, 0, 10, 3, 0)).toBe(9);
  });

  it('steps forward inside a low end that is off the grid', () => {
    // The grid is 0, 3, 6, 9: with a low end of 4 the first value in range is 6.
    expect(fitToGrid(0, 4, 10, 3, 0)).toBe(6);
  });

  it('leaves an open range alone', () => {
    expect(fitToGrid(7, -Infinity, Infinity, 5, 0)).toBe(5);
  });
});

describe('toPercent and cssPercent', () => {
  it('gives the percentage without floating-point noise', () => {
    expect(toPercent(0.57)).toBe(57);
    expect(toPercent(1 / 3)).toBe(33.3333);
  });

  it('writes the percentage for CSS', () => {
    expect(cssPercent(0.5)).toBe('50%');
    expect(cssPercent(0.57)).toBe('57%');
  });
});
