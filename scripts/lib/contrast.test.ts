import { describe, expect, it } from 'vitest';
import * as values from '../../src/styles/theme/values';
import type { ThemeName, TokenMap } from '../../src/styles/theme/values';
import { KNOWN_EXCEPTIONS } from '../contrast-exceptions';
import {
  colorsIn,
  composite,
  contrastRatio,
  evaluate,
  measure,
  parseColor,
  resolveToken,
} from './contrast';

describe('color math', () => {
  it('parses hex, rgb and rgba', () => {
    expect(parseColor('#1f2433')).toEqual([31, 36, 51, 1]);
    expect(parseColor('rgba(250,251,255,.70)')).toEqual([250, 251, 255, 0.7]);
    expect(parseColor('rgb(1, 2, 3)')).toEqual([1, 2, 3, 1]);
  });

  it('rejects colors it cannot measure', () => {
    expect(() => parseColor('hsl(0 0% 0%)')).toThrow(/Unsupported color/);
  });

  it('extracts every color stop from a gradient', () => {
    expect(colorsIn('linear-gradient(135deg, rgba(68,102,242,.14), #ffffff)')).toEqual([
      [68, 102, 242, 0.14],
      [255, 255, 255, 1],
    ]);
  });

  it('gives 21:1 for black on white', () => {
    expect(contrastRatio([0, 0, 0, 1], [255, 255, 255, 1])).toBeCloseTo(21, 5);
  });

  it('matches the known ratio of #777777 on white', () => {
    expect(contrastRatio(parseColor('#777777'), parseColor('#ffffff'))).toBeCloseTo(4.48, 2);
  });

  it('composites a translucent color over an opaque one', () => {
    expect(composite([255, 255, 255, 0.5], [0, 0, 0, 1])).toEqual([127.5, 127.5, 127.5, 1]);
  });

  it('resolves nested var() references and reports missing tokens', () => {
    expect(resolveToken({ a: 'var(--flg-b)', b: 'var(--flg-c)', c: '#000000' }, 'a')).toBe(
      '#000000',
    );
    expect(() => resolveToken({}, 'nope')).toThrow(/nope/);
  });
});

describe('evaluate with the shipped values', () => {
  it('passes with only the known exceptions of spec §4.9', () => {
    expect(evaluate(values, KNOWN_EXCEPTIONS).findings).toEqual([]);
  });

  it('records exactly the measured value of every known exception', () => {
    for (const exception of KNOWN_EXCEPTIONS) {
      expect(measure(values, exception.theme, 'default')[exception.check], exception.check).toBe(
        exception.recorded,
      );
    }
  });

  it('has no exception at all in contrast-more mode', () => {
    const rows = evaluate(values, KNOWN_EXCEPTIONS).rows.filter(
      (row) => row.mode === 'contrast-more',
    );
    expect(rows.filter((row) => row.status !== 'pass')).toEqual([]);
  });
});

describe('evaluate catches regressions', () => {
  const withTheme = (theme: ThemeName, patch: TokenMap) => ({
    ...values,
    themes: { ...values.themes, [theme]: { ...values.themes[theme], ...patch } },
  });

  it('flags a token outside the exception list that drops below its threshold', () => {
    const { findings } = evaluate(
      withTheme('light', { 'text-muted': '#9aa0b0' }),
      KNOWN_EXCEPTIONS,
    );
    expect(findings).toContainEqual(
      expect.objectContaining({ theme: 'light', check: 'text-muted', kind: 'below-threshold' }),
    );
  });

  it('flags a known exception that gets worse', () => {
    const { findings } = evaluate(withTheme('dark', { 'accent-end': '#7fd0ff' }), KNOWN_EXCEPTIONS);
    expect(findings).toContainEqual(
      expect.objectContaining({ theme: 'dark', check: 'on-accent-end', kind: 'exception-worse' }),
    );
  });

  it('flags a known exception that no longer fails, so the public table stays true', () => {
    const { findings } = evaluate(withTheme('dark', { 'accent-end': '#1673ad' }), KNOWN_EXCEPTIONS);
    expect(findings).toContainEqual(
      expect.objectContaining({ theme: 'dark', check: 'on-accent-end', kind: 'exception-stale' }),
    );
  });

  it('measures the surface over the border gradient painted under the tint', () => {
    // A see-through tint over an opaque black border layer: the surface is black, whatever the backdrop.
    const patched = {
      ...withTheme('light', {
        'glass-border': 'linear-gradient(135deg, #000000, #000000)',
        'glass-tint': 'rgba(250,251,255,0)',
      }),
      referenceBackgrounds: { ...values.referenceBackgrounds, light: ['#ffffff'] },
    };
    const onBlack = contrastRatio(parseColor(values.themes.light.text ?? ''), [0, 0, 0, 1]);
    expect(measure(patched, 'light', 'default').text).toBe(Math.floor(onBlack * 100) / 100);
    expect(evaluate(patched, KNOWN_EXCEPTIONS).findings).toContainEqual(
      expect.objectContaining({ theme: 'light', check: 'text', kind: 'below-threshold' }),
    );
  });

  it('flags any failure in contrast-more mode', () => {
    const patched = {
      ...values,
      contrastMore: {
        ...values.contrastMore,
        light: { ...values.contrastMore.light, 'control-border': 'rgba(31,36,51,.20)' },
      },
    };
    expect(evaluate(patched, KNOWN_EXCEPTIONS).findings).toContainEqual(
      expect.objectContaining({
        theme: 'light',
        mode: 'contrast-more',
        check: 'control-border',
        kind: 'below-threshold',
      }),
    );
  });
});
