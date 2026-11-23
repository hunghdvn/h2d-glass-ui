import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/components/data-grid.css', 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

describe('the stylesheet of the row handle', () => {
  it('has no hover on a handle that is off', () => {
    const hovers = css.match(/[^{}]*\.flg-data-grid-row-handle:hover[^{]*\{/g) ?? [];
    expect(hovers).toHaveLength(1);
    // An off handle (`aria-disabled`) takes no press and shows no menu: it does not light up.
    expect(hovers[0]).toContain(":not([aria-disabled='true'])");
  });
});
