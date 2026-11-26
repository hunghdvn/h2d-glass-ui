import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The audit of `forced-color-adjust: none` (the final review of Plan E). The property is inherited: an element that opts
// out of the system's colours keeps the page's colours for everything inside it, which in forced colours can be text
// the colour of the canvas. So a rule that opts out is safe only where nothing is drawn inside (a pseudo-element, a
// line, a fill) or where the colours of the subtree are the system's: the element sets a system `color` (text and
// `currentColor` follow it), or its children are given back to the browser, or each child that has colours of its own
// has a rule that names system colours. The checks are on the stylesheet, as `row-heights.test.ts` reads heights from
// it: the runner cannot emulate the mode.

const SYSTEM =
  /\b(Canvas|CanvasText|Highlight|HighlightText|ButtonText|ButtonFace|GrayText|LinkText|Mark|MarkText)\b/;

/** Elements with no element inside them, which the markup of their component says (text only, or nothing). */
const LEAVES: Record<string, string> = {
  '.flg-slider-fill': 'a bar',
  '.flg-slider-ticks > i': 'a tick',
  '.flg-progress[data-variant] .flg-progress-fill': 'a bar',
  '.flg-skeleton': 'a block',
  '.flg-stepper[data-variant] .flg-step .flg-step-bar': 'a bar',
  '.flg-data-grid-match': 'a `mark` with text',
  '.flg-data-grid-drop-line': 'a line',
};

/**
 * The elements that opt out and hold an element that is not given back, with the rule that names its system colours.
 * The thumb of a Slider holds the bubble, a `.flg-surface` whose forced-colours rule sets `Canvas` and `CanvasText`
 * (the layer of preferences is later than the bubble's own colour); the guide of a column's width holds its label,
 * which has the system colours of its own.
 */
const SUBTREE: Record<string, string> = {
  '.flg-slider-thumb': '.flg-surface',
  '.flg-data-grid-resize-guide': '.flg-data-grid-width-pill',
};

interface Rule {
  selector: string;
  body: string;
}

/** The rules of a stylesheet, flat: the rules of an at-rule are listed as its own, which is what the audit needs. */
export function rulesOf(css: string): Rule[] {
  const rules: Rule[] = [];
  const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of plain.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    rules.push({ selector: match[1]!.replace(/\s+/g, ' ').trim(), body: match[2]! });
  }
  return rules;
}

/**
 * Whether a selector reaches the `inner` element of an `outer` one and nothing else: the selector is `inner` itself
 * (its rule covers it wherever it stands, inside `outer` too) or ends in `inner` below `outer` (`outer inner`,
 * `outer > inner`). A pseudo-element or a state, a longer class that merely starts with `inner`, and a rule for
 * something else that holds `inner` do not count.
 */
const reaches = (selector: string, outer: string, inner: string): boolean =>
  selector === inner || (selector.startsWith(`${outer} `) && selector.endsWith(` ${inner}`));

const parts = (selector: string): string[] =>
  selector.split(/,(?![^(]*\))/).map((part) => part.trim());

/** The rules of `css` that opt out of the system's colours where something inside may be drawn in the page's own. */
export function findUnsafe(css: string): string[] {
  const rules = rulesOf(css);
  const sets = (selector: string, test: (body: string) => boolean): boolean =>
    rules.some((rule) => parts(rule.selector).includes(selector) && test(rule.body));
  const unsafe: string[] = [];
  for (const rule of rules) {
    if (!/forced-color-adjust:\s*none/.test(rule.body)) continue;
    for (const part of parts(rule.selector)) {
      if (/::(before|after)$/.test(part)) continue;
      if (part in LEAVES) continue;
      // A part that ends in a state is the owner's own colours too: the rule for the same part without a `:not()`.
      const owner = part.replace(/:not\([^)]*\)$/, '');
      const colours = (body: string) =>
        new RegExp(`(^|;|\\s)color:\\s*${SYSTEM.source}`).test(body);
      if (colours(rule.body)) continue;
      if (sets(part, colours) || sets(owner, colours)) continue;
      if (sets(`${part} > *`, (body) => /forced-color-adjust:\s*auto/.test(body))) continue;
      const inner = SUBTREE[part];
      if (
        inner !== undefined &&
        rules.some((one) =>
          parts(one.selector).some((p) => reaches(p, part, inner) && SYSTEM.test(one.body)),
        )
      ) {
        continue;
      }
      unsafe.push(part);
    }
  }
  return unsafe;
}

describe('the audit of forced-color-adjust: none', () => {
  it('finds a rule that opts out an element with children and names no system colour for them', () => {
    const css = `
      @media (forced-colors: active) {
        .a-leaf::after { forced-color-adjust: none; background: Highlight; }
        .a-card { forced-color-adjust: none; background: Highlight; }
        .b-card { forced-color-adjust: none; background: Highlight; color: HighlightText; }
        .c-card { forced-color-adjust: none; }
        .c-card > * { forced-color-adjust: auto; }
        .d-card { forced-color-adjust: none; background: Canvas; }
        .d-card { color: CanvasText; }
        .e-card { forced-color-adjust: none; color: red; }
      }`;
    expect(findUnsafe(css)).toEqual(['.a-card', '.e-card']);
  });

  it('finds none in the stylesheet of preferences', () => {
    const css = readFileSync('src/styles/preferences.css', 'utf8');
    expect(rulesOf(css).some((rule) => /forced-color-adjust:\s*none/.test(rule.body))).toBe(true);
    expect(findUnsafe(css)).toEqual([]);
  });

  it('takes a subtree as safe only by a rule that reaches its inner element, not a look-alike', () => {
    const opt = '.flg-slider-thumb { forced-color-adjust: none; background: Highlight; }';
    const surface = (selector: string) => `${opt} ${selector} { background: Canvas; }`;
    expect(findUnsafe(surface('.flg-surface'))).toEqual([]);
    expect(findUnsafe(surface('.flg-slider-thumb > .flg-surface'))).toEqual([]);
    expect(findUnsafe(surface('.flg-surface::before'))).toEqual(['.flg-slider-thumb']);
    expect(findUnsafe(surface('.flg-surface-note'))).toEqual(['.flg-slider-thumb']);
    expect(findUnsafe(surface('.card .flg-surface'))).toEqual(['.flg-slider-thumb']);
  });

  it('gives the icons of editing that the theme colours a system colour', () => {
    // An <svg> keeps a colour set on it in forced colours (Chromium gives it `forced-color-adjust:
    // preserve-parent-color`), so the save bar's pencil and the icon of a refused field would stay the accent and the
    // danger on the system's canvas. Each takes its parent's system colour, in the block of forced colours.
    const grid = rulesOf(readFileSync('src/styles/components/data-grid.css', 'utf8'));
    const css = readFileSync('src/styles/preferences.css', 'utf8');
    const start = css.indexOf('@media (forced-colors: active)');
    let depth = 0;
    let end = css.indexOf('{', start);
    for (let at = end; at < css.length; at += 1) {
      if (css[at] === '{') depth += 1;
      if (css[at] === '}') depth -= 1;
      if (depth === 0) {
        end = at;
        break;
      }
    }
    const forced = rulesOf(css.slice(start, end));
    for (const icon of [
      '.flg-data-grid-savebar > svg',
      '.flg-data-grid-editor-alert',
      '.flg-data-grid-error-text > svg',
    ]) {
      const themed = grid.some(
        (rule) =>
          parts(rule.selector).some((part) => part.endsWith(icon)) &&
          /(^|;|\s)color:\s*var\(--flg-/.test(rule.body),
      );
      expect(themed, `${icon} is coloured by the theme`).toBe(true);
      const inherits = forced.some(
        (rule) => parts(rule.selector).includes(icon) && /(^|;|\s)color:\s*inherit/.test(rule.body),
      );
      expect(inherits, `${icon} takes its parent's colour in forced colours`).toBe(true);
    }
  });

  it('keeps the leaves it names in the stylesheet, so a renamed class is not left behind', () => {
    const css = readFileSync('src/styles/preferences.css', 'utf8');
    const named = rulesOf(css).flatMap((rule) => parts(rule.selector));
    for (const leaf of [...Object.keys(LEAVES), ...Object.keys(SUBTREE)]) {
      expect(named, leaf).toContain(leaf);
    }
  });
});
