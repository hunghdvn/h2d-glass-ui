import { transform } from 'lightningcss';
import { describe, expect, it } from 'vitest';
import * as values from '../../src/styles/theme/values';
import { buildAaOverrideSnippet, buildSimulateCss, buildThemeCss, SEL } from './theme-css';

/** Declarations inside the first `selector {` block found after `after`. Blocks hold no nested braces. */
function blockBody(css: string, selector: string, after: string): string {
  const from = css.indexOf(after);
  if (from < 0) throw new Error(`Anchor not found: ${after}`);
  const open = css.indexOf(`${selector} {`, from);
  if (open < 0) throw new Error(`Block not found: ${selector} after ${after}`);
  const start = css.indexOf('{', open) + 1;
  return css
    .slice(start, css.indexOf('}', start))
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

const parses = (css: string) =>
  transform({ filename: 'test.css', code: Buffer.from(css), errorRecovery: false });

// Spec §4.3, copied verbatim from the approved mockups. Changing these needs the owner's approval.
const MOCKUP: Record<values.ThemeName, Record<string, string>> = {
  light: {
    'glass-tint': 'rgba(250,251,255,.70)',
    'glass-blur': '30px',
    'glass-saturate': '120%',
    'glass-border':
      'linear-gradient(135deg, rgba(68,102,242,.55), rgba(60,180,235,.35) 50%, rgba(255,255,255,.95))',
    'glass-noise':
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E\")",
    'glass-shadow': '0 2px 4px rgba(0,0,0,.04), 0 12px 34px rgba(60,95,210,.18)',
    text: '#1f2433',
    'text-muted': '#4a5164',
    'accent-start': '#4466f2',
    'accent-end': '#1676b0',
    'accent-solid': '#4466f2',
    'accent-text': '#2f55d8',
    'accent-subtle': 'linear-gradient(135deg, rgba(68,102,242,.14), rgba(22,118,176,.14))',
    'on-accent': '#ffffff',
    glow: '0 4px 14px rgba(68,102,242,.35)',
    'focus-ring': '0 0 0 3px rgba(68,102,242,.18), 0 0 12px rgba(60,180,235,.28)',
    'control-bg': 'rgba(255,255,255,.85)',
    'control-bg-secondary': 'rgba(255,255,255,.70)',
    'control-border': 'rgba(31,36,51,.14)',
    'control-track': 'rgba(31,36,51,.12)',
    'control-thumb': '#ffffff',
  },
  dark: {
    'glass-tint': 'rgba(22,26,44,.62)',
    'glass-blur': '24px',
    'glass-saturate': '130%',
    'glass-border':
      'linear-gradient(135deg, rgba(120,140,255,.45), rgba(80,200,255,.25), rgba(255,255,255,.06))',
    'glass-noise': 'none',
    'glass-shadow': '0 12px 40px rgba(0,0,0,.45)',
    text: '#e6e9f5',
    'text-muted': 'rgba(230,233,245,.68)',
    'accent-start': '#5b7cff',
    'accent-end': '#46b8f0',
    'accent-solid': 'rgba(110,150,255,.75)',
    'accent-text': '#a9bcff',
    'accent-subtle': 'rgba(110,140,255,.16)',
    'on-accent': '#ffffff',
    glow: '0 0 12px rgba(80,150,255,.28)',
    'focus-ring': '0 0 0 3px rgba(110,150,255,.18), 0 0 10px rgba(110,150,255,.18)',
    'control-bg': 'rgba(255,255,255,.05)',
    'control-bg-secondary': 'rgba(255,255,255,.06)',
    'control-border': 'rgba(255,255,255,.11)',
    'control-track': 'rgba(255,255,255,.10)',
    'control-thumb': '#ffffff',
  },
};

describe('theme values', () => {
  it.each(['light', 'dark'] as const)(
    'keeps every %s mockup token exactly as approved',
    (theme) => {
      for (const [name, value] of Object.entries(MOCKUP[theme])) {
        expect(values.themes[theme][name], name).toBe(value);
      }
    },
  );

  it('defines the same token names for light and dark', () => {
    expect(Object.keys(values.themes.dark).sort()).toEqual(Object.keys(values.themes.light).sort());
  });

  it('overrides for dark every token that contrast-more overrides for light', () => {
    for (const name of Object.keys(values.contrastMore.light)) {
      expect(values.contrastMore.dark, name).toHaveProperty(name);
    }
  });
});

describe('buildThemeCss', () => {
  const css = buildThemeCss();

  it('produces valid CSS', () => {
    expect(() => parses(css)).not.toThrow();
  });

  it('wraps tokens, themes and preferences in the flg layers', () => {
    expect(css).toContain('@layer flg.tokens {');
    expect(css).toContain('@layer flg.theme {');
    expect(css).toContain('@layer flg.preferences {');
  });

  it('declares derived tokens on every theme root, not only :root', () => {
    const body = blockBody(css, SEL.everyThemeRoot, '@layer flg.theme');
    expect(body).toContain(
      '--flg-glass-filter: blur(var(--flg-glass-blur)) saturate(var(--flg-glass-saturate));',
    );
    expect(body).toContain('--flg-focus-outline-color: transparent;');
  });

  it('gives OS dark mode exactly the explicit dark tokens', () => {
    expect(blockBody(css, SEL.autoDark, '@media (prefers-color-scheme: dark)')).toBe(
      blockBody(css, SEL.dark, '@layer flg.theme'),
    );
  });

  it.each(['@supports not (', '@media (prefers-reduced-transparency: reduce)'])(
    'applies the solid fallback to nested theme roots under %s',
    (anchor) => {
      const body = blockBody(css, SEL.everyThemeRoot, anchor);
      expect(body).toContain('--flg-glass-tint: var(--flg-glass-tint-solid);');
      expect(body).toContain('--flg-glass-filter: none;');
    },
  );

  it('gives OS dark mode the dark contrast-more overrides', () => {
    expect(
      blockBody(
        css,
        SEL.autoDark,
        '@media (prefers-contrast: more) and (prefers-color-scheme: dark)',
      ),
    ).toBe(blockBody(css, SEL.dark, '@media (prefers-contrast: more) {'));
  });

  it('removes motion under prefers-reduced-motion but keeps the spinner turning', () => {
    const body = blockBody(css, ':root', '@media (prefers-reduced-motion: reduce)');
    expect(body).toContain('--flg-duration-normal: 0ms;');
    expect(body).toContain('--flg-spinner-duration: 2400ms;');
  });
});

describe('buildSimulateCss', () => {
  const css = buildSimulateCss();

  it('produces valid CSS in the preferences layer', () => {
    expect(() => parses(css)).not.toThrow();
    expect(css).toContain('@layer flg.preferences {');
  });

  it('targets the simulation attribute only', () => {
    expect(css).toContain(
      '[data-flg-simulate~="solid"], [data-flg-simulate~="solid"] [data-flg-theme] {',
    );
    expect(css).toContain('[data-flg-simulate~="contrast-more"][data-flg-theme="dark"]');
    expect(css).not.toContain('@media');
  });
});

describe('buildAaOverrideSnippet', () => {
  const css = buildAaOverrideSnippet();

  it('produces valid, unlayered CSS that also covers OS dark mode', () => {
    expect(() => parses(css)).not.toThrow();
    expect(css).not.toContain('@layer');
    expect(css).toContain(`${SEL.autoDark} {`);
    expect(css).toContain('--flg-on-accent: #0b1020;');
  });
});
