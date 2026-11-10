import { describe, expect, it } from 'vitest';
import { APP_SHELL_BREAKPOINTS, buildAppShellCss, sheetRules, wideRules } from './app-shell-css';

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
  const all = mediaBlocks(css);
  // The wide screens come first, then the narrow ones, where the sidebar is a sheet.
  const blocks = all.filter(([query]) => query.startsWith('(min-width'));
  const sheets = all.filter(([query]) => query.startsWith('not all'));

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
    // The sheet is "not this width or more", with the same number, never the width below it.
    expect(sheets.map(([query]) => query)).toEqual([
      'not all and (min-width: 768px)',
      'not all and (min-width: 1024px)',
      'not all and (min-width: 1280px)',
    ]);
    expect(all).toHaveLength(6);
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

  describe('the sheet', () => {
    const body = sheetRules('lg');
    const shell = ".flg-app-shell[data-breakpoint='lg'][data-open]";
    const rule = (selector: string) => {
      const start = body.indexOf(`${selector} {`);
      expect(start, `${selector} has a rule`).toBeGreaterThanOrEqual(0);
      return body.slice(start, body.indexOf('}', start));
    };

    it('is written once per breakpoint, for an open root only', () => {
      expect(sheets).toHaveLength(3);
      for (const [index, name] of (['md', 'lg', 'xl'] as const).entries()) {
        expect(flat(sheets[index]![1])).toBe(flat(sheetRules(name)));
        const roots = new Set(sheets[index]![1].match(/data-breakpoint='[a-z]+'\]\[data-open\]/g));
        expect([...roots]).toEqual([`data-breakpoint='${name}'][data-open]`]);
      }
    });

    it('turns the cell into a fixed layer above the scrim, as wide as the drawer or the screen less 48px', () => {
      const cell = rule(`${shell} > .flg-app-shell-sidebar`);
      expect(cell).toContain('position: fixed');
      expect(cell).toContain('z-index: 5');
      expect(cell).toContain('width: min(var(--flg-app-shell-drawer-width), calc(100vw - 48px))');
      expect(cell).toContain('transition: translate var(--flg-duration-normal) var(--flg-ease)');
      expect(rule(`${shell} > .flg-app-shell-scrim`)).toContain('z-index: 4');
    });

    it('rounds the edge of the panel that the page can be seen past, and no other', () => {
      expect(rule(`${shell} > .flg-app-shell-sidebar > .flg-app-shell-sidebar-panel`)).toContain(
        'border-radius: 0 var(--flg-radius-lg) var(--flg-radius-lg) 0',
      );
    });

    it('moves the brand of an S1 head in by 8px, and has no such rule for S2', () => {
      expect(
        rule(
          `${shell}[data-layout='sidebar'] > .flg-app-shell-sidebar > .flg-app-shell-sidebar-panel > .flg-app-shell-sidebar-head`,
        ),
      ).toContain('padding-left: 18px');
      expect(body).not.toContain("[data-layout='header']");
    });

    it('slides the sheet in and fades the scrim in, through @starting-style, and has no exit', () => {
      const start = body.slice(body.indexOf('@starting-style'));
      expect(start).toContain('translate: -100% 0');
      expect(start).toContain('opacity: 0');
      expect(body).not.toMatch(/@keyframes|animation:/);
    });
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

  describe('the rail and the trigger', () => {
    const body = wideRules('lg');
    const shell = ".flg-app-shell[data-breakpoint='lg']";
    const rule = (selector: string) => {
      const start = body.indexOf(`${selector} {`);
      expect(start, `${selector} has a rule`).toBeGreaterThanOrEqual(0);
      return body.slice(start, body.indexOf('}', start));
    };

    it('narrows the sidebar column to the rail width when the root is collapsed', () => {
      expect(rule(`${shell}[data-collapsed]`)).toContain(
        'grid-template-columns: var(--flg-app-shell-rail-width) minmax(0, 1fr)',
      );
      // A shell without a sidebar has one column however it is marked, so that rule must be the
      // more specific: it comes later and carries a [data-layout] the rail rule does not.
      expect(body.indexOf(`${shell}[data-collapsed] {`)).toBeLessThan(
        body.indexOf(`${shell}[data-layout]:not(:has(> .flg-app-shell-sidebar)) {`),
      );
    });

    it('centres the mark in the head of an S1 rail and hides the name from the eye only', () => {
      const head = `${shell}[data-layout='sidebar'][data-collapsed] > .flg-app-shell-sidebar > .flg-app-shell-sidebar-panel > .flg-app-shell-sidebar-head`;
      expect(rule(head)).toContain('justify-content: center');
      expect(rule(head)).toContain('padding: 0');
      const name = rule(
        `${shell}[data-collapsed] .flg-app-shell-sidebar-head .flg-app-shell-brand-name`,
      );
      // The technique of `flg-visually-hidden`: the name stays the name of the link.
      expect(name).toContain('position: absolute');
      expect(name).toContain('clip-path: inset(50%)');
      expect(name).not.toContain('display: none');
    });

    it('is 226px for the brand cell of S2 behind a trigger that is shown, 268px otherwise', () => {
      const behind = `${shell}[data-layout='header'][data-collapsible] > .flg-app-shell-header > .flg-app-shell-trigger + .flg-app-shell-header-brand`;
      expect(rule(behind)).toContain('width: 226px');
      expect(
        rule(
          `${shell}[data-layout='header'] > .flg-app-shell-header > .flg-app-shell-header-brand`,
        ),
      ).toContain('width: 268px');
      // Without the attribute the trigger is not shown on a wide screen, so 226 would leave a gap.
      expect(body.indexOf(behind)).toBeGreaterThan(
        body.indexOf(
          `${shell}[data-layout='header'] > .flg-app-shell-header > .flg-app-shell-header-brand {`,
        ),
      );
    });

    it('takes the narrow gap of the brand away on a wide screen, and hides a trigger with no rail', () => {
      expect(
        rule(
          `${shell} > .flg-app-shell-header > .flg-app-shell-trigger + .flg-app-shell-header-brand`,
        ),
      ).toContain('margin-left: 0');
      expect(rule(`${shell}:not([data-collapsible]) .flg-app-shell-trigger`)).toContain(
        'display: none',
      );
    });
  });
});
