import type * as ValuesModule from '../../src/styles/theme/values';
import type { ThemeName, TokenMap } from '../../src/styles/theme/values';
import type { KnownException } from '../contrast-exceptions';

export type Rgba = readonly [number, number, number, number];
export type Mode = 'default' | 'contrast-more';
export type ContrastValues = Pick<
  typeof ValuesModule,
  'themes' | 'derivedTokens' | 'contrastMore' | 'referenceBackgrounds'
>;

/**
 * Spec §7, layer 4: 4.5:1 for text, 3:1 for borders, focus and checked-state fills.
 *
 * `stepper-icon` is the − and + of NumberInput, not the Stepper; the Stepper's checks are
 * `stepper-ring`, `stepper-current-number` and `stepper-done-mark`.
 */
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
  'tab-indicator': 3,
  'segmented-text': 4.5,
  'segmented-indicator': 3,
  'selected-text': 4.5,
  'selected-indicator': 3,
  'tooltip-text': 4.5,
  'highlight-text': 4.5,
  'highlight-danger-text': 4.5,
  'highlight-icon': 4.5,
  'highlight-indicator': 3,
  'highlight-chosen-box': 3,
  'toast-info-icon': 3,
  'slider-bubble-text': 4.5,
  'slider-tick': 3,
  'slider-track': 3,
  'slider-thumb': 3,
  'stepper-icon': 3,
  'combobox-unmatched-text': 4.5,
  'tag-chip-text': 4.5,
  'tag-remove-icon': 3,
  'calendar-weekday-text': 4.5,
  'calendar-outside-day': 4.5,
  'date-picker-icon': 3,
  'dropzone-border': 3,
  'dropzone-link': 4.5,
  'dropzone-hint-text': 4.5,
  'dropzone-hint-drag': 4.5,
  'file-meta-text': 4.5,
  'file-error-text': 4.5,
  'alert-stripe-text': 4.5,
  'alert-stripe-icon': 3,
  'alert-tinted-title': 4.5,
  'alert-tinted-text': 4.5,
  'alert-tinted-icon': 3,
  'alert-plain-title': 4.5,
  'alert-plain-icon': 3,
  'progress-fill': 3,
  'progress-glow-fill': 3,
  'accent-text-on-surface': 4.5,
  'stepper-ring': 3,
  'stepper-current-number': 4.5,
  'stepper-done-mark': 3,
  'current-edge': 3,
  'table-row-text': 4.5,
  'table-hover-badge': 4.5,
  'table-stripe-text-muted': 4.5,
  'table-stripe-badge': 4.5,
  'table-selected-badge': 4.5,
  'indicator-count-text': 4.5,
  'indicator-dot': 3,
  'nav-bar-indicator': 3,
  'nav-bar-text': 4.5,
  'nav-bar-icon': 3,
  'nav-rail-current-dot': 3,
} as const;
export type CheckId = keyof typeof CHECKS;
const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
/** Measured over their own surfaces rather than the plain glass. */
type OverlayCheck = 'tooltip-text';
const OVERLAY_CHECKS: readonly CheckId[] = ['tooltip-text'];
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

/** What a gradient or a shadow list holds besides its colours and numbers. */
const NOT_COLORS = new Set([
  'linear-gradient',
  'radial-gradient',
  'conic-gradient',
  'repeating-linear-gradient',
  'repeating-radial-gradient',
  'repeating-conic-gradient',
  'to',
  'top',
  'bottom',
  'left',
  'right',
  'center',
  'at',
  'from',
  'in',
  'circle',
  'ellipse',
  'closest-side',
  'closest-corner',
  'farthest-side',
  'farthest-corner',
  'inset',
  'none',
]);

/**
 * Every colour in `input`, in order: one colour, the stops of a gradient, the colours of a shadow
 * list. Anything else that may be a colour (`#rgb`, `#rrggbbaa`, `hsl()`, `oklch()`, a named colour,
 * `transparent`, an unresolved `var()`) throws: a check measured on only the stops it understood
 * could pass without measuring the rest.
 */
export function colorsIn(input: string): Rgba[] {
  const colors: Rgba[] = [];
  const rest = input.replace(/#[0-9a-f]{6}(?![\w-])|rgba?\([^)]*\)/gi, (match) => {
    colors.push(parseColor(match));
    return ' ';
  });
  // What is left: numbers with their units, words (function names among them) and `#…`.
  for (const token of rest.match(/-?[\d.]+[a-z%]*|#[\w-]*|[a-z-]+/gi) ?? []) {
    if (/^-?[\d.]/.test(token) || NOT_COLORS.has(token.toLowerCase())) continue;
    throw new Error(`Unsupported color "${token}" in: ${input}`);
  }
  return colors;
}

/** The second colour of a `color-mix`: any colour, `transparent`, or a `#rgb` the mockup writes. */
function mixOperand(input: string): Rgba {
  const value = input.trim();
  if (value.toLowerCase() === 'transparent') return [0, 0, 0, 0];
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  if (short)
    return parseColor(`#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`);
  return parseColor(value);
}

/**
 * The colours a background paints: one colour, the stops of a gradient, or a colour mixed in sRGB
 * by `color-mix(in srgb, <colour> N%, <other colour>)`, where the other colour is `transparent` or
 * an opaque colour. The mix is weighted by alpha, as CSS does it (premultiplied), so a mix with
 * `transparent` keeps the colour and scales its alpha. Anything else throws: a check that measured
 * no colour would pass without measuring anything.
 */
export function paintStops(input: string): Rgba[] {
  const value = input.trim();
  const mix = /^color-mix\(\s*in srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*(.+?)\s*\)$/i.exec(value);
  if (mix?.[1] && mix[2] && mix[3]) {
    const share = Number(mix[2]) / 100;
    const first = parseColor(mix[1]);
    const second = mixOperand(mix[3]);
    const alpha = first[3] * share + second[3] * (1 - share);
    const weigh = (i: 0 | 1 | 2) =>
      alpha === 0 ? 0 : (first[i] * first[3] * share + second[i] * second[3] * (1 - share)) / alpha;
    return [[weigh(0), weigh(1), weigh(2), alpha]];
  }
  if (/color-mix\(/i.test(value)) {
    throw new Error(
      `Unsupported color-mix: ${input}. Only "color-mix(in srgb, <color> N%, <color or transparent>)" is measured.`,
    );
  }
  const stops = colorsIn(value);
  if (stops.length === 0) throw new Error(`No color to measure in: ${input}`);
  return stops;
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
  // Every surface check runs on the plain glass and on a Dialog or Drawer panel, which sits over
  // the page darkened by the scrim (spec §4.4: every pair on the panel).
  const scrimmed = backdrops.map((backdrop) => composite(color('scrim'), backdrop));
  const surfaces = [...backdrops, ...scrimmed].flatMap(surfaceOver);
  // Tooltip: the tint straight over the page, with no border gradient under it.
  const tooltips = backdrops.map((backdrop) => composite(color('glass-tint'), backdrop));
  const textOn = (name: string, under: Rgba) => contrastRatio(composite(color(name), under), under);
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
      ...paintStops(resolveToken(t, 'accent-subtle')).map((stop) => {
        const bg = composite(stop, surface);
        return contrastRatio(composite(color('accent-text'), bg), bg);
      }),
    );
    // The track of a neutral Badge and of a segmented tab list.
    const neutralBg = composite(color('control-track'), surface);
    // The accent gradient on the surface: a checked control's fill, and the bar under the selected
    // underline tab.
    const accentFill = Math.min(
      contrastRatio(color('accent-start'), surface),
      contrastRatio(color('accent-end'), surface),
    );
    // A menu or listbox item under the pointer or the keyboard, a selected pill tab, the current
    // page: the worst stop of its background, for its text and against the surface.
    const onPaint = (fg: string, bg: string) =>
      Math.min(
        ...paintStops(resolveToken(t, bg)).map((stop) => {
          const under = composite(stop, surface);
          return contrastRatio(composite(color(fg), under), under);
        }),
      );
    const paintOnSurface = (bg: string) =>
      Math.min(
        ...paintStops(resolveToken(t, bg)).map((stop) =>
          contrastRatio(composite(stop, surface), surface),
        ),
      );
    // A TagInput chip: the neutral Badge track over the frame, which is control-bg over the surface.
    const chipBg = composite(color('control-track'), control);
    const withOpacity = (name: string, opacity: number): Rgba => {
      const [r, g, b, a] = color(name);
      return [r, g, b, a * opacity];
    };
    // An Alert (alert.css). Its status colour is `accent-solid` for info and the status token
    // otherwise; its title is `accent-text` for info, which is darker in light. The `stripe` panel is
    // control-bg-secondary on the surface; `tinted` lays the status colour over that panel at the status
    // alpha of the Badges; `plain` is control-bg with the icon in a circle of 16% of its colour. The
    // lowest of the four statuses counts for each check.
    const alertPanel = composite(color('control-bg-secondary'), surface);
    const alertStatuses = [
      { icon: 'accent-solid', title: 'accent-text' },
      { icon: 'success', title: 'success' },
      { icon: 'warning', title: 'warning' },
      { icon: 'danger', title: 'danger' },
    ] as const;
    const alertWorst = (
      fg: (status: (typeof alertStatuses)[number]) => string,
      bg: (status: (typeof alertStatuses)[number]) => Rgba,
    ) =>
      Math.min(
        ...alertStatuses.map((status) => {
          const under = bg(status);
          return contrastRatio(composite(color(fg(status)), under), under);
        }),
      );
    // `color-mix(<colour> N%, transparent)` keeps the colour's own alpha, which the dark accent has.
    const alertWash = (status: (typeof alertStatuses)[number], share: number, under: Rgba) => {
      const [r, g, b, a] = color(status.icon);
      return composite([r, g, b, a * share], under);
    };
    const alertTint = (status: (typeof alertStatuses)[number]) =>
      alertWash(status, statusAlpha, alertPanel);
    const alertCircle = (status: (typeof alertStatuses)[number]) =>
      alertWash(status, 0.16, control);
    // A Progress (progress.css). The track is control-track on the surface. The fill is the accent
    // gradient, or the success or danger colour; the lowest of those counts. `glow` lays a white
    // light of 24% over the top half of the fill, which contrast-more takes away (preferences.css).
    const progressTrack = composite(color('control-track'), surface);
    const progressFills = [
      ...paintStops(resolveToken(t, 'accent-gradient')),
      color('success'),
      color('danger'),
    ].map((stop) => composite(stop, progressTrack));
    const progressWorst = (lit: boolean) =>
      Math.min(
        ...progressFills.flatMap((fill) => [
          contrastRatio(fill, progressTrack),
          ...(lit ? [contrastRatio(composite([255, 255, 255, 0.24], fill), progressTrack)] : []),
        ]),
      );
    // A Stepper (stepper.css). The dot of the current step is control-bg in the `circles` look, and in
    // the `compact` look it sits in a pill of selected-bg; contrast-more fills that pill with the solid
    // accent and swaps the colours of the dot (preferences.css). The dot of a done step is the solid
    // accent with the on-accent check (`circles`) or the accent wash with an accent check (`compact`).
    const dotsInPill =
      mode === 'contrast-more'
        ? []
        : paintStops(resolveToken(t, 'selected-bg')).map((stop) =>
            composite(color('control-bg'), composite(stop, surface)),
          );
    const stepperNumber = Math.min(
      contrastRatio(composite(color('accent-text'), control), control),
      ...dotsInPill.map((dot) => contrastRatio(composite(color('accent-text'), dot), dot)),
      ...(mode === 'contrast-more' ? [onPaint('selected-bg', 'selected-text')] : []),
    );
    const accentSolid = composite(color('accent-solid'), surface);
    const stepperDone = Math.min(
      contrastRatio(composite(color('on-accent'), accentSolid), accentSolid),
      ...paintStops(resolveToken(t, 'accent-subtle')).map((stop) => {
        const dot = composite(stop, surface);
        return contrastRatio(composite(color('accent-text'), dot), dot);
      }),
    );
    // A Table (table.css). Its rows have three backgrounds that text can sit on: the one under the
    // pointer (control-track), the odd row of `striped` (control-track at 50%) and a chosen row
    // (accent-subtle, a wash that may be a gradient: each stop counts). Contrast-more takes all three
    // away (preferences.css), so everything in a row is on the surface itself.
    const tableRows =
      mode === 'contrast-more'
        ? { hover: [surface], stripe: [surface], selected: [surface] }
        : {
            hover: [composite(color('control-track'), surface)],
            stripe: [composite(withOpacity('control-track', 0.5), surface)],
            selected: paintStops(resolveToken(t, 'accent-subtle')).map((stop) =>
              composite(stop, surface),
            ),
          };
    const textOnRows = (name: string, rows: Rgba[]) =>
      Math.min(...rows.map((row) => contrastRatio(composite(color(name), row), row)));
    // The five Badge variants, each on its own background laid over the row.
    const badgeBackgrounds: Array<{ fg: string; bgs: Rgba[] }> = [
      { fg: 'text', bgs: [color('control-track')] },
      { fg: 'accent-text', bgs: paintStops(resolveToken(t, 'accent-subtle')) },
      ...(['success', 'warning', 'danger'] as const).map((name) => {
        const [r, g, b] = color(name);
        return { fg: name, bgs: [[r, g, b, statusAlpha]] as Rgba[] };
      }),
    ];
    const badgesOnRows = (rows: Rgba[]) =>
      Math.min(
        ...rows.flatMap((row) =>
          badgeBackgrounds.flatMap(({ fg, bgs }) =>
            bgs.map((bg) => {
              const under = composite(bg, row);
              return contrastRatio(composite(color(fg), under), under);
            }),
          ),
        ),
      );
    // An Indicator (indicator.css). The number is the colour made for each status on that status's
    // fill; the lowest of the four counts. The fill of `accent` is a `color-mix` in the dark theme.
    // The dot is drawn in the fill colour of its status over what is behind it, and the ring of
    // `glass-tint-solid` around it is what it must stand out from; the ring is painted over the same
    // surface.
    const indicatorFills = [
      { fg: 'on-accent', bg: paintStops(resolveToken(t, 'indicator-accent'))[0]! },
      { fg: 'on-danger', bg: color('danger-fill') },
      { fg: 'on-status', bg: color('success') },
      { fg: 'on-status', bg: color('warning') },
    ];
    const indicatorRing = composite(color('glass-tint-solid'), surface);
    const indicatorDots = [
      color('accent-solid'),
      color('danger-fill'),
      color('success'),
      color('warning'),
    ];
    // The current item of a Nav `bar` (nav.css): a tint of the solid accent that fades from 18% to 3%
    // over the surface, `color-mix(<accent-solid> N%, transparent)`, which keeps the alpha the dark
    // accent has. What sits on it is measured on both ends, and the lowest counts.
    const navTints = [0.18, 0.03].map((share) => {
      const [r, g, b, a] = color('accent-solid');
      return composite([r, g, b, a * share], surface);
    });
    const onNavTint = (name: string, tints: Rgba[]) =>
      Math.min(...tints.map((tint) => contrastRatio(composite(color(name), tint), tint)));
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
      'checked-fill': accentFill,
      'tab-indicator': accentFill,
      'segmented-text': contrastRatio(composite(color('text-muted'), neutralBg), neutralBg),
      // The selected segmented tab against its track: raised on control-bg, or under contrast-more
      // edged with a line of the text colour (preferences.css).
      'segmented-indicator':
        mode === 'contrast-more'
          ? contrastRatio(composite(color('text'), neutralBg), neutralBg)
          : contrastRatio(composite(color('control-bg'), neutralBg), neutralBg),
      'selected-text': onPaint('selected-text', 'selected-bg'),
      'selected-indicator': paintOnSurface('selected-bg'),
      'highlight-text': onPaint('highlight-text', 'highlight-bg'),
      'highlight-danger-text': onPaint('highlight-danger-text', 'highlight-danger-bg'),
      'highlight-icon': onPaint('highlight-icon', 'highlight-bg'),
      'highlight-indicator': paintOnSurface('highlight-bg'),
      // The box of a chosen option of a multiple Select, on a highlighted row: filled with the accent
      // (select.css), or under contrast-more with the row's text colour (preferences.css).
      'highlight-chosen-box': Math.min(
        ...paintStops(resolveToken(t, 'highlight-bg')).flatMap((stop) => {
          const row = composite(stop, surface);
          const boxes =
            mode === 'contrast-more'
              ? [color('highlight-text')]
              : [color('accent-start'), color('accent-end')];
          return boxes.map((box) => contrastRatio(composite(box, row), row));
        }),
      ),
      // The icon and bar of an info toast (toast.css). The success, warning and error ones are the
      // status colours, measured as text above, at 4.5:1.
      'toast-info-icon': onSurface('accent-solid'),
      // The text of a Slider bubble, which is a Surface of its own over the page or a panel.
      'slider-bubble-text': onSurface('text'),
      // The tick dots under the track: the dot colour is semi-transparent in the default theme.
      'slider-tick': paintOnSurface('slider-tick'),
      // Under contrast-more the track has a 1px edge of the control border (preferences.css).
      'slider-track':
        mode === 'contrast-more'
          ? contrastRatio(composite(color('control-border'), surface), surface)
          : contrastRatio(composite(color('control-track'), surface), surface),
      // The thumb against the bare track and the filled part (the accent stops). Under
      // contrast-more the fill is the text colour, the thumb is the surface colour with a 2px edge
      // of the text colour: the edge is measured against the surface and the track, the face
      // against the fill (preferences.css).
      'slider-thumb':
        mode === 'contrast-more'
          ? Math.min(
              contrastRatio(color('text'), surface),
              contrastRatio(color('text'), composite(color('control-track'), surface)),
              contrastRatio(surface, color('text')),
            )
          : Math.min(
              contrastRatio(color('control-thumb'), composite(color('control-track'), surface)),
              contrastRatio(color('control-thumb'), color('accent-start')),
              contrastRatio(color('control-thumb'), color('accent-end')),
            ),
      // The − and + of a NumberInput, muted text on the background of the frame.
      'stepper-icon': contrastRatio(composite(color('text-muted'), control), control),
      // The muted text of a Combobox option while text filters the list, and of its status row, both
      // on the listbox panel, which is a Surface (combobox.css). The highlighted option has its own
      // text colour, measured as highlight-text.
      'combobox-unmatched-text': onSurface('text-muted'),
      // The chip of a TagInput is a neutral Badge on the frame's own background (tag-input.css).
      'tag-chip-text': contrastRatio(composite(color('text'), chipBg), chipBg),
      // Its × is the chip's text at 75% opacity; under contrast-more the button drops the opacity
      // (preferences.css).
      'tag-remove-icon': contrastRatio(
        composite(withOpacity('text', mode === 'contrast-more' ? 1 : 0.75), chipBg),
        chipBg,
      ),
      // The weekday row of a Calendar is muted text on the surface it sits on: the page for a bare
      // Calendar, the popup (a Surface) for a DatePicker, which the scrim case covers.
      'calendar-weekday-text': onSurface('text-muted'),
      // A day of the month before or after is muted text at half opacity; under contrast-more it
      // drops the opacity (preferences.css).
      'calendar-outside-day': contrastRatio(
        composite(withOpacity('text-muted', mode === 'contrast-more' ? 1 : 0.5), surface),
        surface,
      ),
      // The calendar icon of a DatePicker, muted text on the background of the frame.
      'date-picker-icon': contrastRatio(composite(color('text-muted'), control), control),
      // The dashed edge of a FileUpload zone: its colour is semi-transparent in the default theme.
      'dropzone-border': paintOnSurface('dropzone-border'),
      // The browse word, in the accent text colour on the zone's background.
      'dropzone-link': contrastRatio(
        composite(color('accent-text'), composite(color('control-bg-secondary'), surface)),
        composite(color('control-bg-secondary'), surface),
      ),
      // The hint under the prompt, muted text on the zone's background.
      'dropzone-hint-text': contrastRatio(
        composite(color('text-muted'), composite(color('control-bg-secondary'), surface)),
        composite(color('control-bg-secondary'), surface),
      ),
      // The same hint while files are over the zone: muted text on the accent wash, or under
      // contrast-more the wash's own text colour (preferences.css).
      'dropzone-hint-drag': onPaint(
        mode === 'contrast-more' ? 'selected-text' : 'text-muted',
        'selected-bg',
      ),
      // The size of a file, muted text on the background of its row.
      'file-meta-text': contrastRatio(composite(color('text-muted'), control), control),
      // The reason a file was turned down, the danger colour on the background of its row.
      'file-error-text': contrastRatio(composite(color('danger'), control), control),
      // The title of an Alert `stripe` is the text colour on its panel; its icon and bar are the
      // status colour on it.
      'alert-stripe-text': contrastRatio(composite(color('text'), alertPanel), alertPanel),
      'alert-stripe-icon': alertWorst(
        (status) => status.icon,
        () => alertPanel,
      ),
      // `tinted`: the title in the status colour, the description in the text colour, the icon in
      // the status colour, all on the tinted panel.
      'alert-tinted-title': alertWorst((status) => status.title, alertTint),
      'alert-tinted-text': alertWorst(() => 'text', alertTint),
      'alert-tinted-icon': alertWorst((status) => status.icon, alertTint),
      // `plain`: the title in the status colour on control-bg, the icon on its circle.
      'alert-plain-title': alertWorst(
        (status) => status.title,
        () => control,
      ),
      'alert-plain-icon': alertWorst((status) => status.icon, alertCircle),
      // The fill of a Progress against its track, for `thin` and `inline`; `glow` adds the light.
      'progress-fill': progressWorst(false),
      'progress-glow-fill': progressWorst(mode !== 'contrast-more'),
      // The value of a `glow` Progress, in the accent text colour on the surface it sits on.
      'accent-text-on-surface': onSurface('accent-text'),
      // The ring of a step not reached yet, against the surface.
      'stepper-ring': paintOnSurface('stepper-ring'),
      'stepper-current-number': stepperNumber,
      'stepper-done-mark': stepperDone,
      // The accent line on the accent wash: the edge of the current dot of a `compact` Stepper (and
      // the bar of the current row of an `inset` List). Contrast-more draws it in the text colour of
      // the wash, which is the solid accent there (preferences.css).
      'current-edge':
        mode === 'contrast-more'
          ? onPaint('selected-text', 'selected-bg')
          : Math.min(
              ...paintStops(resolveToken(t, 'selected-bg')).map((stop) => {
                const wash = composite(stop, surface);
                return contrastRatio(composite(color('accent-solid'), wash), wash);
              }),
            ),
      // The text colour on the three row backgrounds of a Table; the muted text on those is already
      // measured by rows 9 and 12 of §4.9, except on the stripe.
      'table-row-text': Math.min(
        textOnRows('text', tableRows.hover),
        textOnRows('text', tableRows.stripe),
        textOnRows('text', tableRows.selected),
      ),
      'table-hover-badge': badgesOnRows(tableRows.hover),
      'table-stripe-text-muted': textOnRows('text-muted', tableRows.stripe),
      'table-stripe-badge': badgesOnRows(tableRows.stripe),
      'table-selected-badge': badgesOnRows(tableRows.selected),
      'indicator-count-text': Math.min(
        ...indicatorFills.map(({ fg, bg }) => contrastRatio(color(fg), bg)),
      ),
      'indicator-dot': Math.min(
        ...indicatorDots.map((dot) => contrastRatio(composite(dot, surface), indicatorRing)),
      ),
      // The 3px bar on the tint, where it is strongest (18%, at the left edge, where the bar is). The
      // text of the item, and its count, are `text`; the icon is `accent-text`.
      'nav-bar-indicator': onNavTint('accent-solid', navTints.slice(0, 1)),
      'nav-bar-text': onNavTint('text', navTints),
      'nav-bar-icon': onNavTint('accent-text', navTints),
      // The dot of a count on the current item of N1 at the rail (nav-rail.tsx). By default it is the
      // solid accent on the soft pill, and its ring of glass-tint-solid sets it apart from the pill:
      // the dot is measured against its ring, both laid over the pill. Under contrast-more the pill is
      // the solid accent itself, so the dot is filled with the text colour of the pill
      // (preferences.css) and measured against the pill.
      'nav-rail-current-dot':
        mode === 'contrast-more'
          ? onPaint('selected-text', 'selected-bg')
          : Math.min(
              ...paintStops(resolveToken(t, 'selected-bg')).map((stop) => {
                const pill = composite(stop, surface);
                return contrastRatio(
                  composite(color('accent-solid'), pill),
                  composite(color('glass-tint-solid'), pill),
                );
              }),
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
