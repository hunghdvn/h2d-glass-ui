import { describe, expect, it } from 'vitest';
import { APP_SHELL_BREAKPOINTS, buildAppShellCss, wideRules } from './app-shell-css';

const flat = (text: string) => text.replace(/\s+/g, ' ').trim();

/** The `@media` blocks of the generated file, as `[query, body]`, and what is outside them. */
function mediaBlocks(css: string): Array<[string, string]> {
  const blocks: Array<[string, string]> = [];
  const open = /@media ([^{]+)\{/g;
  for (let match = open.exec(css); match; match = open.exec(css)) {
    let depth = 1;
    let end = open.lastIndex;
    while (depth > 0 && end < css.length) {
      const char = css[end];
      if (char === '{') depth += 1;
      if (char === '}') depth -= 1;
      end += 1;
    }
    blocks.push([match[1]!.trim(), css.slice(open.lastIndex, end - 1)]);
    open.lastIndex = end;
  }
  return blocks;
}

describe('buildAppShellCss', () => {
  const css = buildAppShellCss();
  const blocks = mediaBlocks(css);

  it('writes one min-width block per breakpoint, narrowest first, inside the components layer', () => {
    expect(APP_SHELL_BREAKPOINTS).toEqual({ md: 768, lg: 1024, xl: 1280 });
    expect(blocks.map(([query]) => query)).toEqual([
      '(min-width: 768px)',
      '(min-width: 1024px)',
      '(min-width: 1280px)',
    ]);
    expect(css).toMatch(/^\/\*[\s\S]*?\*\/\s*@layer flg\.components \{/);
  });

  it('has one boundary per breakpoint: no max-width, no second bound', () => {
    expect(css).not.toContain('max-width');
    for (const [query] of blocks) expect(query).not.toMatch(/\band\b|,/);
    expect(css).not.toMatch(/1023|767|1279/);
  });

  it('says each rule once per breakpoint, picked by the data-breakpoint of the root', () => {
    expect(blocks).toHaveLength(3);
    for (const [index, name] of (['md', 'lg', 'xl'] as const).entries()) {
      const body = blocks[index]![1];
      // Every selector of the block starts at the root of its own breakpoint, and no other.
      const roots = new Set(body.match(/data-breakpoint='[a-z]+'/g));
      expect([...roots]).toEqual([`data-breakpoint='${name}'`]);
      expect(flat(body)).toBe(flat(wideRules(name)));
    }
    const strip = (name: 'md' | 'lg' | 'xl') => wideRules(name).replaceAll(`'${name}'`, "'BP'");
    expect(strip('md')).toBe(strip('lg'));
    expect(strip('lg')).toBe(strip('xl'));
  });

  it('puts the sidebar in a column of the grid and makes its panel, and the header, sticky', () => {
    const body = wideRules('lg');
    // The rule that starts with `selector` and ends at its closing brace.
    const rule = (selector: string) => {
      const start = body.indexOf(`${selector} {`);
      expect(start, `${selector} has a rule`).toBeGreaterThanOrEqual(0);
      return body.slice(start, body.indexOf('}', start));
    };
    const shell = ".flg-app-shell[data-breakpoint='lg']";
    const cell = `${shell}[data-layout='sidebar'] > .flg-app-shell-sidebar`;
    const headerCell = `${shell}[data-layout='header'] > .flg-app-shell-sidebar`;
    expect(body).toContain(
      'grid-template-columns: var(--flg-app-shell-sidebar-width) minmax(0, 1fr)',
    );
    expect(rule(cell)).toContain('grid-row: 1 / -1');
    expect(rule(headerCell)).toContain('grid-row: 2');
    // The panel sticks, not the cell: a sticky box is held by its parent, not by its grid area, so a
    // cell that stuck could not be stopped by the footer at the end of the page.
    expect(rule(`${shell} > .flg-app-shell-sidebar > .flg-app-shell-sidebar-panel`)).toContain(
      'position: sticky',
    );
    expect(rule(`${cell} > .flg-app-shell-sidebar-panel`)).toContain('top: 0');
    expect(rule(`${headerCell} > .flg-app-shell-sidebar-panel`)).toContain(
      'top: var(--flg-app-shell-header-height)',
    );
    expect(rule(`${shell} > .flg-app-shell-sidebar`)).not.toContain('position: sticky');
  });

  it('keeps the header out from under the scroll with the wide fallback of 60px', () => {
    for (const [, body] of blocks) {
      expect(body).toMatch(
        /:root:has\(\.flg-app-shell\[data-breakpoint='[a-z]+'\] > \.flg-app-shell-header\) \{\s*scroll-padding-top: var\(--flg-app-shell-header-offset, 60px\)/,
      );
    }
  });

  it('gives a shell without a sidebar one column, and without a header no first row', () => {
    const body = wideRules('xl');
    expect(body).toMatch(
      /\[data-layout\]:not\(:has\(> \.flg-app-shell-sidebar\)\) \{\s*grid-template-columns: minmax\(0, 1fr\)/,
    );
    expect(body).toMatch(
      /:not\(:has\(> \.flg-app-shell-header\)\) \{\s*--flg-app-shell-header-height: 0px/,
    );
  });
});
