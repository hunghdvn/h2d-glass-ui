import { describe, expect, it } from 'vitest';
import * as values from '../../src/styles/theme/values';
import type { ThemeName, TokenMap } from '../../src/styles/theme/values';
import { KNOWN_EXCEPTIONS } from '../contrast-exceptions';
import {
  CHECKS,
  colorsIn,
  composite,
  contrastRatio,
  evaluate,
  measure,
  paintStops,
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

  it('reads every colour of a shadow list, and nothing from a keyword without colour', () => {
    expect(colorsIn('0 0 0 3px rgba(1,2,3,.18), inset 0 0 12px #ffffff')).toEqual([
      [1, 2, 3, 0.18],
      [255, 255, 255, 1],
    ]);
    expect(colorsIn('none')).toEqual([]);
  });

  it('refuses any colour it cannot measure, even next to one it can', () => {
    const unmeasurable = [
      'oklch(70% .1 260 / .14)',
      'hsl(0 0% 0%)',
      '#abc',
      '#11223344',
      'red',
      'transparent',
      'var(--flg-accent)',
    ];
    for (const color of unmeasurable) {
      expect(() => colorsIn(`linear-gradient(135deg, ${color}, rgba(22,118,176,.14))`)).toThrow(
        /Unsupported color/,
      );
      expect(() => colorsIn(color)).toThrow(/Unsupported color/);
    }
  });

  it('reads a colour mixed with transparent as that colour at the mixed alpha', () => {
    expect(paintStops('color-mix(in srgb, #92222b 16%, transparent)')).toEqual([
      [146, 34, 43, 0.16],
    ]);
    expect(paintStops('color-mix(in srgb, rgba(0,0,0,.5) 50%, transparent)')).toEqual([
      [0, 0, 0, 0.25],
    ]);
    expect(paintStops('linear-gradient(#000000, #ffffff)')).toHaveLength(2);
  });

  it('reads a colour mixed with an opaque colour, as CSS mixes in sRGB', () => {
    expect(paintStops('color-mix(in srgb, #5b7cff 78%, #000)')).toEqual([
      [expect.closeTo(70.98), expect.closeTo(96.72), expect.closeTo(198.9), 1],
    ]);
    expect(paintStops('color-mix(in srgb, #ffffff 25%, rgb(0, 0, 100))')).toEqual([
      [63.75, 63.75, 138.75, 1],
    ]);
    // Two translucent colours are weighted by their alpha (CSS mixes premultiplied), so the result
    // is not a mix of the channels alone.
    const [red, , , alpha] = paintStops('color-mix(in srgb, rgba(255,0,0,.5) 50%, #000000)')[0]!;
    expect(red).toBeCloseTo(85);
    expect(alpha).toBeCloseTo(0.75);
  });

  it('resolves the dark token of the Indicator through its var() to a colour', () => {
    const tokens = { ...values.derivedTokens, ...values.themes.dark };
    const [stop] = paintStops(resolveToken(tokens, 'indicator-accent'));
    expect(stop?.[3]).toBe(1);
    expect(stop?.[0]).toBeCloseTo(70.98);
  });

  it('refuses a paint it cannot measure, so a check never passes on nothing', () => {
    expect(() => paintStops('color-mix(in oklch, #92222b 16%, transparent)')).toThrow(
      /Unsupported color-mix/,
    );
    expect(() => paintStops('color-mix(in srgb, transparent, #92222b 16%)')).toThrow(
      /Unsupported color-mix/,
    );
    expect(() => paintStops('none')).toThrow(/No color to measure/);
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

  it('measures white danger-button text against the danger fill', () => {
    const { findings } = evaluate(
      withTheme('dark', { 'danger-fill': '#ffb3b8' }),
      KNOWN_EXCEPTIONS,
    );
    expect(findings).toContainEqual(
      expect.objectContaining({ theme: 'dark', check: 'on-danger', kind: 'below-threshold' }),
    );
  });
});

describe('the Indicator checks (spec phase 5 §4.4)', () => {
  const INDICATOR_CHECKS = ['indicator-count-text', 'indicator-dot'] as const;

  it('are the text of the number at 4.5:1 and the dot against its ring at 3:1', () => {
    expect(CHECKS['indicator-count-text']).toBe(4.5);
    expect(CHECKS['indicator-dot']).toBe(3);
  });

  // The numbers are the spec's, measured over every reference backdrop and border stop.
  it.each([
    ['light', 'default', [4.74, 4.48]],
    ['dark', 'default', [5.44, 3.06]],
    ['light', 'contrast-more', [6.28, 6.07]],
    ['dark', 'contrast-more', [5.44, 3.16]],
  ] as const)('measure %s, %s mode: %j', (theme, mode, expected) => {
    const measured = measure(values, theme, mode);
    expect(INDICATOR_CHECKS.map((id) => measured[id])).toEqual(expected);
  });

  it('measures every status, so a weak one cannot hide behind the others', () => {
    const patched = {
      ...values,
      themes: { ...values.themes, light: { ...values.themes.light, warning: '#ffd37a' } },
    };
    const measured = measure(patched, 'light', 'default');
    expect(measured['indicator-count-text']).toBeLessThan(2);
    expect(measured['indicator-dot']).toBeLessThan(1.5);
  });
});

describe('the Nav `bar` checks (spec phase 5 §4.4)', () => {
  const NAV_CHECKS = ['nav-bar-indicator', 'nav-bar-text', 'nav-bar-icon'] as const;

  it('are the bar and the icon at 3:1 and the text at 4.5:1', () => {
    expect(CHECKS['nav-bar-indicator']).toBe(3);
    expect(CHECKS['nav-bar-text']).toBe(4.5);
    expect(CHECKS['nav-bar-icon']).toBe(3);
  });

  // The numbers are the spec's, measured over every reference backdrop and border stop, with the tint
  // of the current item laid over the surface.
  it.each([
    ['light', 'default', [2.52, 8.24, 3.28]],
    ['dark', 'default', [2.03, 5.82, 3.8]],
    ['light', 'contrast-more', [4.65, 11.44, 4.55]],
    ['dark', 'contrast-more', [5.3, 10.17, 6.64]],
  ] as const)('measure %s, %s mode: %j', (theme, mode, expected) => {
    const measured = measure(values, theme, mode);
    expect(NAV_CHECKS.map((id) => measured[id])).toEqual(expected);
  });

  it('records the bar as the two exceptions of row 35, and nothing else of the Nav', () => {
    const { findings } = evaluate(values, KNOWN_EXCEPTIONS);
    expect(findings.filter((finding) => finding.check.startsWith('nav-'))).toEqual([]);
    expect(
      KNOWN_EXCEPTIONS.filter((exception) => exception.check.startsWith('nav-')).map(
        ({ row, theme, check }) => [row, theme, check],
      ),
    ).toEqual([
      [35, 'light', 'nav-bar-indicator'],
      [35, 'dark', 'nav-bar-indicator'],
    ]);
  });

  it('measures the tint at both ends, so a weak text colour cannot hide at the 3% end', () => {
    const patched = {
      ...values,
      themes: { ...values.themes, light: { ...values.themes.light, text: '#c9d6ff' } },
    };
    expect(measure(patched, 'light', 'default')['nav-bar-text']).toBeLessThan(2);
  });
});

describe('the key hint of a SearchField (spec phase 5 §4.4)', () => {
  const CHECK = 'kbd-text';

  it('is a check at 4.5:1', () => {
    expect(CHECKS[CHECK]).toBe(4.5);
  });

  // The numbers are the spec's: the lowest of the hint in the field (on the background of the frame)
  // and in the tooltip of a collapsed field (on its glass).
  it.each([
    ['light', 'default', 7.15],
    ['dark', 'default', 3.31],
    ['light', 'contrast-more', 7.83],
    ['dark', 'contrast-more', 7.63],
  ] as const)('measures %s, %s mode: %s', (theme, mode, expected) => {
    expect(measure(values, theme, mode)[CHECK]).toBe(expected);
  });

  it('records the dark hint as row 36, and passes in light and in contrast-more', () => {
    const { rows } = evaluate(values, KNOWN_EXCEPTIONS);
    expect(
      rows
        .filter((row) => row.check === CHECK)
        .map(({ theme, mode, status }) => [theme, mode, status]),
    ).toEqual([
      ['light', 'default', 'pass'],
      ['light', 'contrast-more', 'pass'],
      ['dark', 'default', 'known-exception'],
      ['dark', 'contrast-more', 'pass'],
    ]);
    expect(
      KNOWN_EXCEPTIONS.filter((exception) => exception.check === CHECK).map(
        ({ row, theme, recorded }) => [row, theme, recorded],
      ),
    ).toEqual([[36, 'dark', 3.31]]);
  });

  it('measures the hint in the tooltip too, so a weak glass cannot hide behind the frame', () => {
    // In dark the frame is the lower of the two (3.31 against 3.76); a pale glass makes the tooltip lower.
    const patched = {
      ...values,
      themes: {
        ...values.themes,
        dark: { ...values.themes.dark, 'glass-tint': 'rgba(255,255,255,1)' },
      },
    };
    expect(measure(patched, 'dark', 'default')[CHECK]).toBeLessThan(3.31);
  });
});

describe('the dot of a count on the current item of a `pill` rail (spec phase 5 §4.4)', () => {
  const CHECK = 'nav-rail-current-dot';

  it('is a check at 3:1', () => {
    expect(CHECKS[CHECK]).toBe(3);
  });

  // Under contrast-more the pill is the solid accent, the fill of the dot of the Indicator: the dot is
  // filled with the text colour of the pill instead (preferences.css), measured against the pill.
  it.each([
    ['light', 6.28],
    ['dark', 8.15],
  ] as const)(
    'is the text colour of the pill on the pill under %s contrast-more: %s',
    (theme, ratio) => {
      const measured = measure(values, theme, 'contrast-more');
      expect(measured[CHECK]).toBe(ratio);
      expect(measured[CHECK]).toBe(measured['selected-text']);
    },
  );

  // By default the dot is the solid accent on the soft pill, set apart by its ring of the glass tint,
  // both laid over the pill.
  it.each([
    ['light', 4.44],
    ['dark', 4.2],
  ] as const)(
    'is the accent against its ring, on the pill, in %s by default: %s',
    (theme, ratio) => {
      expect(measure(values, theme, 'default')[CHECK]).toBe(ratio);
    },
  );

  it('passes in every theme and mode, with no exception', () => {
    const { rows } = evaluate(values, KNOWN_EXCEPTIONS);
    const dots = rows.filter((row) => row.check === CHECK);
    expect(dots).toHaveLength(4);
    expect(dots.every((row) => row.status === 'pass')).toBe(true);
  });

  it('follows the text colour of the pill under contrast-more', () => {
    const patched = {
      ...values,
      contrastMore: {
        ...values.contrastMore,
        light: { ...values.contrastMore.light, 'highlight-text': '#3554d1' },
      },
    };
    expect(measure(patched, 'light', 'contrast-more')[CHECK]).toBeLessThan(1.5);
  });
});

describe('the Table checks (spec phase 4 §4.4)', () => {
  const TABLE_CHECKS = [
    'table-row-text',
    'table-hover-badge',
    'table-stripe-text-muted',
    'table-stripe-badge',
    'table-selected-badge',
  ] as const;

  it('are all text at 4.5:1', () => {
    for (const id of TABLE_CHECKS) expect(CHECKS[id], id).toBe(4.5);
  });

  // The numbers are those of the spec, measured over every reference backdrop and border stop.
  it.each([
    ['light', 'default', [8.01, 2.8, 4.57, 3.09, 2.97]],
    ['dark', 'default', [5.23, 3.03, 3.71, 3.37, 3.27]],
    // With contrast-more the row backgrounds are gone, so the text is on the surface itself: the
    // Badge numbers are those of the Badges on the surface and the muted text is its own number.
    ['light', 'contrast-more', [14.94, 4.94, 7.65, 4.94, 4.94]],
    ['dark', 'contrast-more', [14.23, 7.31, 10.43, 7.31, 7.31]],
  ] as const)('measure %s, %s mode: %j', (theme, mode, expected) => {
    const measured = measure(values, theme, mode);
    expect(TABLE_CHECKS.map((id) => measured[id])).toEqual(expected);
  });

  it('measures the Badge on the row under the pointer, not on the surface', () => {
    // A hover background of the same colour as the Badge's own makes the neutral Badge unreadable.
    const patched = {
      ...values,
      themes: {
        ...values.themes,
        light: { ...values.themes.light, 'control-track': 'rgb(31,36,51)' },
      },
    };
    expect(measure(patched, 'light', 'default')['table-hover-badge']).toBeLessThan(1.5);
  });
});

describe('the key of a Kbd (spec phase 6 §4.4)', () => {
  const CHECK = 'kbd-key-text';

  it('is a check at 4.5:1', () => {
    expect(CHECKS[CHECK]).toBe(4.5);
  });

  // The numbers are the spec's: the lowest of the key on the glass (in a sentence, in a menu), on the
  // background of a control (a `secondary` Button), on the highlighted item of a menu and in a tooltip.
  // Under contrast-more a highlighted item has the solid accent and the key takes its text colour.
  it.each([
    ['light', 'default', 6.71],
    ['dark', 'default', 3.23],
    ['light', 'contrast-more', 6.28],
    ['dark', 'contrast-more', 7.63],
  ] as const)('measures %s, %s mode: %s', (theme, mode, expected) => {
    expect(measure(values, theme, mode)[CHECK]).toBe(expected);
  });

  it('records the dark key as row 37, and passes in light and in contrast-more', () => {
    const { rows } = evaluate(values, KNOWN_EXCEPTIONS);
    expect(
      rows
        .filter((row) => row.check === CHECK)
        .map(({ theme, mode, status }) => [theme, mode, status]),
    ).toEqual([
      ['light', 'default', 'pass'],
      ['light', 'contrast-more', 'pass'],
      ['dark', 'default', 'known-exception'],
      ['dark', 'contrast-more', 'pass'],
    ]);
    expect(
      KNOWN_EXCEPTIONS.filter((exception) => exception.check === CHECK).map(
        ({ row, theme, recorded }) => [row, theme, recorded],
      ),
    ).toEqual([[37, 'dark', 3.23]]);
  });

  // In dark the key on the highlighted item (3.23) is the lowest of the five, and it is the wash of
  // that item that decides it: a paler wash lowers the number only if the item is measured.
  it('measures the key on the highlighted item of a menu too', () => {
    const patched = {
      ...values,
      themes: {
        ...values.themes,
        dark: { ...values.themes.dark, 'accent-subtle': 'rgba(255,255,255,1)' },
      },
    };
    expect(measure(patched, 'dark', 'default')[CHECK]).toBeLessThan(3.23);
  });

  it('measures the key in the tooltip too', () => {
    const patched = {
      ...values,
      themes: {
        ...values.themes,
        dark: { ...values.themes.dark, 'glass-tint': 'rgba(255,255,255,1)' },
      },
    };
    expect(measure(patched, 'dark', 'default')[CHECK]).toBeLessThan(3.23);
  });

  it('is not the key hint of a SearchField, which is measured on its own (row 36)', () => {
    expect(measure(values, 'dark', 'default')['kbd-text']).toBe(3.31);
  });
});
