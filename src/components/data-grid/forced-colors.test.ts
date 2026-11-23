import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Forced colours of the grouping parts (spec phase 6 §4.5). The runner cannot emulate the mode in a
// story, so the rules are proven from the stylesheet, as the height of a group row is
// (`row-heights.test.ts`): a rule that opts a part out of the system's colours is inherited by all of
// its children, so it sits on a leaf or it recolours the whole subtree.

interface Rule {
  selector: string;
  body: string;
}

const css = readFileSync('src/styles/preferences.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const rules: Rule[] = [];
for (const match of css
  .slice(css.indexOf('@media (forced-colors: active)'))
  .matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  rules.push({ selector: match[1]!.replace(/\s+/g, ' ').trim(), body: match[2]! });
}
const ruleOf = (selector: string): Rule | undefined =>
  rules.find((rule) => rule.selector === selector);

/** Parts with no child element: a line, a guide and a match of the search (text only). */
const LEAVES = ['.flg-data-grid-resize-guide', '.flg-data-grid-drop-line', '.flg-data-grid-match'];

describe('forced colours of the group panel', () => {
  it('keeps the colours of the system inside the tray that is a drop target', () => {
    const tray = ruleOf('.flg-data-grid-group-panel[data-drop-target]');
    expect(tray).toBeDefined();
    expect(tray!.body).toContain('border-color: Highlight');
    expect(tray!.body).not.toMatch(/forced-color-adjust/);
  });

  it('opts out of the system colours only where nothing is drawn inside', () => {
    const bar = ruleOf(
      '.flg-data-grid-group-chip[data-drop-before]::before, .flg-data-grid-group-panel[data-drop-end]::after',
    );
    expect(bar?.body).toMatch(/forced-color-adjust: none/);
  });
});

describe('forced colours of a focused group row', () => {
  const FOCUSED = '.flg-data-grid-table > .flg-table-body > .flg-data-grid-group-row:focus-visible';

  it('draws its frame on cells that opt out, so it recolours everything inside them', () => {
    expect(ruleOf(`${FOCUSED} > *`)?.body).toMatch(/forced-color-adjust: none/);
    expect(ruleOf(`${FOCUSED} > * *`)?.body).toMatch(/color: CanvasText/);
    const mark = ruleOf(`${FOCUSED} > * .flg-data-grid-match`);
    expect(mark?.body).toMatch(/background: Mark;/);
    expect(mark?.body).toMatch(/color: MarkText/);
  });
});

describe('every `forced-color-adjust: none` of a DataGrid part', () => {
  it('is on a leaf, or recolours its subtree', () => {
    const optedOut = rules.filter(
      (rule) => /forced-color-adjust: none/.test(rule.body) && /flg-data-grid/.test(rule.selector),
    );
    expect(optedOut.length).toBeGreaterThan(0);
    for (const rule of optedOut) {
      const leaf = rule.selector
        .split(',')
        .every((part) => /::(before|after)$/.test(part.trim()) || LEAVES.includes(part.trim()));
      const owner = rule.selector.replace(/ > \*$/, '');
      const recoloured = rules.some((other) => other.selector.startsWith(`${owner} > * *`));
      expect(leaf || recoloured, rule.selector).toBe(true);
    }
  });
});
