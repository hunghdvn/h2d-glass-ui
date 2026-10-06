import type * as ValuesModule from '../../src/styles/theme/values';
import type { ThemeName, TokenMap } from '../../src/styles/theme/values';
import type { KnownException } from '../contrast-exceptions';

export type Rgba = readonly [number, number, number, number];
export type Mode = 'default' | 'contrast-more';
export type ContrastValues = Pick<
  typeof ValuesModule,
  'themes' | 'derivedTokens' | 'contrastMore' | 'referenceBackgrounds'
>;

/** Spec §7, layer 4: 4.5:1 for text, 3:1 for borders, focus and checked-state fills. */
export const CHECKS = {
  text: 4.5,
  'text-muted': 4.5,
  success: 4.5,
  warning: 4.5,
  danger: 4.5,
  'badge-success': 4.5,
  'badge-warning': 4.5,
  'badge-danger': 4.5,
  'badge-accent': 4.5,
  'badge-neutral': 4.5,
  'on-accent-start': 4.5,
  'on-accent-end': 4.5,
  'on-danger': 4.5,
  'control-border': 3,
  'focus-indicator': 3,
  'input-focus-border': 3,
  'checked-fill': 3,
  'scrim-text': 4.5,
  'scrim-text-muted': 4.5,
  'tooltip-text': 4.5,
} as const;
export type CheckId = keyof typeof CHECKS;
const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
/** Measured over their own surfaces rather than the plain glass. */
type OverlayCheck = 'scrim-text' | 'scrim-text-muted' | 'tooltip-text';
const OVERLAY_CHECKS: readonly CheckId[] = ['scrim-text', 'scrim-text-muted', 'tooltip-text'];
const SURFACE_CHECK_IDS = CHECK_IDS.filter((id) => !OVERLAY_CHECKS.includes(id)) as Array<
  Exclude<CheckId, OverlayCheck>
>;

export function parseColor(input: string): Rgba {
  const value = input.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex?.[1]) {
    const h = hex[1];
    return [
      Number.parseInt(h.slice(0, 2), 16),
      Number.parseInt(h.slice(2, 4), 16),
      Number.parseInt(h.slice(4, 6), 16),
      1,
    ];
  }
  const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(
    value,
  );
  if (rgb)
    return [
      Number(rgb[1]),
      Number(rgb[2]),
      Number(rgb[3]),
      rgb[4] === undefined ? 1 : Number(rgb[4]),
    ];
  throw new Error(`Unsupported color: ${input}`);
}

export function colorsIn(input: string): Rgba[] {
  return (input.match(/#[0-9a-f]{6}\b|rgba?\([^)]*\)/gi) ?? []).map(parseColor);
}

/** Paints `top` over an opaque `bottom`. */
export function composite(top: Rgba, bottom: Rgba): Rgba {
  const a = top[3];
  return [
    top[0] * a + bottom[0] * (1 - a),
    top[1] * a + bottom[1] * (1 - a),
    top[2] * a + bottom[2] * (1 - a),
    1,
  ];
}

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (c: Rgba) =>
  0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2]);

export function contrastRatio(a: Rgba, b: Rgba): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function resolveToken(tokens: TokenMap, name: string): string {
  const raw = tokens[name];
  if (raw === undefined) throw new Error(`Unknown token --flg-${name}`);
  return raw.replace(/var\(--flg-([a-z0-9-]+)\)/g, (_match, ref: string) =>
    resolveToken(tokens, ref),
  );
}

export function tokensFor(values: ContrastValues, theme: ThemeName, mode: Mode): TokenMap {
  const base = { ...values.derivedTokens, ...values.themes[theme] };
  return mode === 'default'
    ? base
    : { ...base, ...values.contrastMore.shared, ...values.contrastMore[theme] };
}

const floor2 = (x: number) => Math.floor(x * 100) / 100;

/**
 * Lowest ratio of every check across the theme's reference backdrops, rounded down. The surface is
 * painted like `.flg-surface`: the border gradient under the whole box, the tint over it. Each
 * colour stop of the gradient is tried in turn, so the worst stop counts. Blur and noise are ignored.
 */
export function measure(
  values: ContrastValues,
  theme: ThemeName,
  mode: Mode,
): Record<CheckId, number> {
  const t = tokensFor(values, theme, mode);
  const color = (name: string) => parseColor(resolveToken(t, name));
  const statusAlpha = Number.parseFloat(resolveToken(t, 'status-bg-alpha')) / 100;
  const outline = resolveToken(t, 'focus-outline-color');
  const focusColor =
    outline === 'transparent' ? colorsIn(resolveToken(t, 'focus-ring'))[0] : parseColor(outline);
  if (!focusColor) throw new Error(`${theme}/${mode}: no visible focus indicator color`);

  const borderStops = colorsIn(resolveToken(t, 'glass-border'));
  if (borderStops.length === 0) throw new Error(`${theme}/${mode}: no color in --flg-glass-border`);

  const lowest = Object.fromEntries(
    CHECK_IDS.map((id) => [id, Number.POSITIVE_INFINITY]),
  ) as Record<CheckId, number>;
  const backdrops = values.referenceBackgrounds[theme].map(parseColor);
  const surfaceOver = (backdrop: Rgba) =>
    borderStops.map((stop) => composite(color('glass-tint'), composite(stop, backdrop)));
  const surfaces = backdrops.flatMap(surfaceOver);
  // Dialog and Drawer: the panel over the page darkened by the scrim (spec §4.4).
  const scrimmed = backdrops.flatMap((backdrop) =>
    surfaceOver(composite(color('scrim'), backdrop)),
  );
  // Tooltip: the tint straight over the page, with no border gradient under it.
  const tooltips = backdrops.map((backdrop) => composite(color('glass-tint'), backdrop));
  const textOn = (name: string, under: Rgba) => contrastRatio(composite(color(name), under), under);
  for (const under of scrimmed) {
    lowest['scrim-text'] = Math.min(lowest['scrim-text'], textOn('text', under));
    lowest['scrim-text-muted'] = Math.min(lowest['scrim-text-muted'], textOn('text-muted', under));
  }
  for (const under of tooltips) {
    lowest['tooltip-text'] = Math.min(lowest['tooltip-text'], textOn('text', under));
  }
  for (const surface of surfaces) {
    const control = composite(color('control-bg'), surface);
    const onSurface = (name: string) => contrastRatio(composite(color(name), surface), surface);
    const statusBadge = (name: string) => {
      const [r, g, b] = color(name);
      return contrastRatio(color(name), composite([r, g, b, statusAlpha], surface));
    };
    const accentBadge = Math.min(
      ...colorsIn(resolveToken(t, 'accent-subtle')).map((stop) => {
        const bg = composite(stop, surface);
        return contrastRatio(composite(color('accent-text'), bg), bg);
      }),
    );
    const neutralBg = composite(color('control-track'), surface);
    const measured: Omit<Record<CheckId, number>, OverlayCheck> = {
      text: onSurface('text'),
      'text-muted': onSurface('text-muted'),
      success: onSurface('success'),
      warning: onSurface('warning'),
      danger: onSurface('danger'),
      'badge-success': statusBadge('success'),
      'badge-warning': statusBadge('warning'),
      'badge-danger': statusBadge('danger'),
      'badge-accent': accentBadge,
      'badge-neutral': contrastRatio(composite(color('text'), neutralBg), neutralBg),
      'on-accent-start': contrastRatio(color('on-accent'), color('accent-start')),
      'on-accent-end': contrastRatio(color('on-accent'), color('accent-end')),
      'on-danger': contrastRatio(color('on-danger'), color('danger-fill')),
      'control-border': Math.min(
        contrastRatio(composite(color('control-border'), control), control),
        contrastRatio(composite(color('control-border'), surface), surface),
      ),
      'focus-indicator': contrastRatio(composite(focusColor, surface), surface),
      'input-focus-border': contrastRatio(composite(color('accent-solid'), control), control),
      'checked-fill': Math.min(
        contrastRatio(color('accent-start'), surface),
        contrastRatio(color('accent-end'), surface),
      ),
    };
    for (const id of SURFACE_CHECK_IDS) lowest[id] = Math.min(lowest[id], measured[id]);
  }
  return Object.fromEntries(CHECK_IDS.map((id) => [id, floor2(lowest[id])])) as Record<
    CheckId,
    number
  >;
}

export interface ContrastRow {
  theme: ThemeName;
  mode: Mode;
  check: CheckId;
  measured: number;
  threshold: number;
  status: 'pass' | 'known-exception' | 'fail';
}

export interface Finding {
  theme: ThemeName;
  mode: Mode;
  check: CheckId;
  measured: number;
  threshold: number;
  kind: 'below-threshold' | 'exception-worse' | 'exception-stale';
  exception?: KnownException;
}

export function evaluate(
  values: ContrastValues,
  exceptions: readonly KnownException[],
): { rows: ContrastRow[]; findings: Finding[] } {
  const rows: ContrastRow[] = [];
  const findings: Finding[] = [];
  for (const theme of ['light', 'dark'] as const) {
    for (const mode of ['default', 'contrast-more'] as const) {
      const results = measure(values, theme, mode);
      for (const check of CHECK_IDS) {
        const measured = results[check];
        const threshold = CHECKS[check];
        const base = { theme, mode, check, measured, threshold };
        const exception =
          mode === 'default'
            ? exceptions.find((e) => e.theme === theme && e.check === check)
            : undefined;
        let kind: Finding['kind'] | undefined;
        if (exception) {
          if (measured >= threshold) kind = 'exception-stale';
          else if (measured < exception.recorded) kind = 'exception-worse';
        } else if (measured < threshold) {
          kind = 'below-threshold';
        }
        if (kind) findings.push({ ...base, kind, ...(exception ? { exception } : {}) });
        rows.push({ ...base, status: kind ? 'fail' : exception ? 'known-exception' : 'pass' });
      }
    }
  }
  return { rows, findings };
}
