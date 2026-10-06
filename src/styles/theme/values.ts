/**
 * Single source of truth for every fl-glass-ui design token.
 * Names carry no `--flg-` prefix: `'glass-tint'` becomes `--flg-glass-tint`.
 *
 * MOCKUP LOCK: the per-theme values reproduce the approved mockups in
 * docs/superpowers/specs/mockups/ exactly. Only tokens marked "(outside mockup)" may be tuned
 * without the project owner's approval. scripts/lib/theme-css.test.ts fails if a mockup value drifts.
 */
export type ThemeName = 'light' | 'dark';
export type TokenMap = Readonly<Record<string, string>>;

export const baseTokens: TokenMap = {
  'radius-xs': '4px',
  'radius-md': '8px',
  'radius-lg': '12px',
  'radius-full': '9999px',
  'space-1': '4px',
  'space-2': '8px',
  'space-3': '12px',
  'space-4': '16px',
  'space-5': '20px',
  'space-6': '24px',
  'space-8': '32px',
  'space-10': '40px',
  'font-sans': 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  'text-2xs': '0.65625rem',
  'text-xs': '0.71875rem',
  'text-sm': '0.78125rem',
  'text-md': '0.96875rem',
  'weight-regular': '400',
  'weight-medium': '500',
  'weight-semibold': '600',
  'control-h-sm': '28px',
  'control-h-md': '34px',
  'control-h-lg': '40px',
  'duration-fast': '120ms',
  'duration-normal': '200ms',
  ease: 'cubic-bezier(0.2, 0, 0, 1)',
  'spinner-duration': '800ms',
  'scrim-blur': '6px',
};

export const LIGHT_NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E\")";

export const themes: Readonly<Record<ThemeName, TokenMap>> = {
  light: {
    'glass-tint': 'rgba(250,251,255,.70)',
    'glass-tint-solid': 'rgba(250,251,255,.94)', // (outside mockup)
    'glass-blur': '30px',
    'glass-saturate': '120%',
    'glass-border':
      'linear-gradient(135deg, rgba(68,102,242,.55), rgba(60,180,235,.35) 50%, rgba(255,255,255,.95))',
    'glass-noise': LIGHT_NOISE,
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
    success: '#115934', // (outside mockup) darkened 3% to pass over the Dialog scrim (I1)
    warning: '#734200', // (outside mockup) darkened 3% to pass over the Dialog scrim (I1)
    danger: '#92222b', // (outside mockup) darkened 3% to pass over the Dialog scrim (I1)
    'danger-fill': '#96232c', // (outside mockup) Plan 2 mockup option B: danger button fill
    'on-danger': '#ffffff', // (outside mockup)
    'status-bg-alpha': '12%', // (outside mockup)
    scrim: 'rgba(15,20,40,.28)',
  },
  dark: {
    'glass-tint': 'rgba(22,26,44,.62)',
    'glass-tint-solid': 'rgba(22,26,44,.94)', // (outside mockup)
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
    success: '#bbf1d7', // (outside mockup)
    warning: '#fae0ad', // (outside mockup)
    danger: '#ffdbdd', // (outside mockup)
    'danger-fill': '#c2343f', // (outside mockup) Plan 2 mockup option B: danger button fill
    'on-danger': '#ffffff', // (outside mockup)
    'status-bg-alpha': '16%', // (outside mockup)
    scrim: 'rgba(0,0,0,.45)',
  },
};

/** Recomputed on every theme root so nested `data-flg-theme` subtrees use their own values. */
export const derivedTokens: TokenMap = {
  'glass-filter': 'blur(var(--flg-glass-blur)) saturate(var(--flg-glass-saturate))',
  'accent-gradient': 'linear-gradient(135deg, var(--flg-accent-start), var(--flg-accent-end))',
  'focus-outline-color': 'transparent',
  // The highlighted item of a menu or listbox (mockup A): a light accent wash, the text unchanged.
  'highlight-bg': 'var(--flg-accent-subtle)',
  'highlight-text': 'var(--flg-text)',
  'highlight-danger-bg': 'color-mix(in srgb, var(--flg-danger) 16%, transparent)',
  'highlight-danger-text': 'var(--flg-danger)',
  'highlight-icon': 'var(--flg-text-muted)',
};

/** No backdrop-filter support, or prefers-reduced-transparency: an almost opaque surface. */
export const solidFallback: TokenMap = {
  'glass-tint': 'var(--flg-glass-tint-solid)',
  'glass-filter': 'none',
  'scrim-blur': '0px',
};

/**
 * prefers-contrast: more. Outside the mockup; must meet WCAG AA with no exceptions. The tint is
 * opaque, so the surface colour is exact whatever sits behind it.
 */
export const contrastMore: Readonly<{ shared: TokenMap; light: TokenMap; dark: TokenMap }> = {
  shared: {
    'glass-filter': 'none',
    'glass-noise': 'none',
    'glass-border': 'linear-gradient(var(--flg-text), var(--flg-text))',
    glow: 'none',
    'focus-ring': 'none',
    'highlight-danger-bg': 'var(--flg-danger-fill)',
    'highlight-danger-text': 'var(--flg-on-danger)',
    'highlight-icon': 'var(--flg-highlight-text)',
  },
  light: {
    'glass-tint': 'rgb(250,251,255)',
    'control-border': 'rgba(31,36,51,.50)',
    'focus-outline-color': '#3554d1',
    'accent-start': '#3554d1',
    'accent-end': '#3554d1',
    'accent-solid': '#3554d1',
    'on-accent': '#ffffff',
    'highlight-bg': '#3554d1',
    'highlight-text': '#ffffff',
  },
  dark: {
    'glass-tint': 'rgb(22,26,44)',
    'control-border': 'rgba(255,255,255,.36)',
    'text-muted': '#c4c9da',
    'focus-outline-color': '#8ea6ff',
    'accent-start': '#8ea6ff',
    'accent-end': '#8ea6ff',
    'accent-solid': '#8ea6ff',
    'on-accent': '#0b1020',
    'highlight-bg': '#8ea6ff',
    'highlight-text': '#0b1020',
  },
};

export const reducedMotion: TokenMap = {
  'duration-fast': '0ms',
  'duration-normal': '0ms',
  'spinner-duration': '2400ms',
};

/** Spec §4.8: contrast is guaranteed over these backdrops (blur and noise ignored). */
export const referenceBackgrounds: Readonly<Record<ThemeName, readonly string[]>> = {
  light: ['#ffffff', '#c3cfe2', '#8a8a8a', '#7ea6ff', '#ff5fa2'],
  dark: ['#000000', '#0f1220', '#3a3a3a', '#4a5bdc', '#2fa8d8'],
};
