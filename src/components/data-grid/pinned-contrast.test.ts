import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The runner of the stories cannot turn `prefers-contrast: more` on, so the rule is proven where it is
// written: in the stylesheet of the preferences, as the height of a group row is proven against its CSS.
const css = readFileSync('src/styles/preferences.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** The text of the `@media` block that opens at `start`, braces balanced. */
function blockFrom(start: number): string {
  let depth = 0;
  for (let at = css.indexOf('{', start); at < css.length; at++) {
    if (css[at] === '{') depth++;
    if (css[at] === '}' && --depth === 0) return css.slice(start, at + 1);
  }
  return css.slice(start);
}

describe('the pinned cells of a striped grid in prefers-contrast: more', () => {
  // Table draws no stripe here and clears the background of every cell of a `striped` body, in a layer
  // that comes after the grid's: the pinned cells of a scrolled side must be given their solid colour
  // again, or the scrolled cells' text shows through them (Plan C; fixed in Plan E).
  const start = css.indexOf('@media (prefers-contrast: more) and (not (forced-colors: active))');

  it('has a block of its own that forced colours do not enter', () => {
    expect(start).toBeGreaterThanOrEqual(0);
  });

  it('paints the pinned cell of each scrolled side with the solid colour', () => {
    const block = blockFrom(start);
    for (const side of ['left', 'right']) {
      const open = block.indexOf(`[data-variant='striped'][data-scrolled-${side}]`);
      expect(open).toBeGreaterThanOrEqual(0);
      // The first pinned cell the selector names after it is the one of that side, in a body row.
      const rest = block.slice(open);
      expect(rest.slice(0, rest.indexOf('[data-pinned')).includes('.flg-table-body')).toBe(true);
      expect(rest.startsWith(`[data-variant='striped'][data-scrolled-${side}]`)).toBe(true);
      expect(rest.indexOf(`[data-pinned='${side}']`)).toBe(rest.indexOf('[data-pinned'));
    }
    expect(block).toContain('background: var(--flg-data-grid-pin-bg)');
  });
});
