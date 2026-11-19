import { describe, expect, it } from 'vitest';
import {
  APP_SHELL_BREAKPOINTS,
  buildAppShellCss,
  railForcedColorsRules,
  sheetRules,
  wideRules,
} from './app-shell-css';

const flat = (text: string) => text.replace(/\s+/g, ' ').trim();

/** The first row of the grid: the height variable, or the measured header when it is taller. */
const ROW = 'max(var(--flg-app-shell-header-height), var(--flg-app-shell-header-offset, 0px))';

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
    // The rail in forced colours has a block per breakpoint too, in the preferences layer, bounded by
    // that one width and no other.
    expect(
      all.filter(([query]) => query.startsWith('(forced-colors')).map(([query]) => query),
    ).toEqual([
      '(forced-colors: active) and (min-width: 768px)',
      '(forced-colors: active) and (min-width: 1024px)',
      '(forced-colors: active) and (min-width: 1280px)',
    ]);
    expect(all).toHaveLength(9);
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
    // S2: the panel sticks below the row of the header, which a taller header makes taller.
    expect(rule(`${headerCell} > .flg-app-shell-sidebar-panel`)).toContain(`top: ${ROW}`);
    expect(rule(`${headerCell} > .flg-app-shell-sidebar-panel`)).toContain(
      `max-height: calc(100dvh - ${ROW})`,
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

    it('scrolls the body of the rail without a scrollbar, so that the column keeps its width', () => {
      // A scrollbar that takes room (Windows, Linux) would narrow the column, move the squares off
      // its middle and the bar of N2 off the glass's edge. The body still scrolls. Safari before
      // 18.2 knows only the pseudo-element. The story TallRail measures it.
      const railBody = `${shell}[data-collapsed] > .flg-app-shell-sidebar > .flg-app-shell-sidebar-panel > .flg-app-shell-sidebar-body`;
      expect(rule(railBody)).toContain('scrollbar-width: none');
      expect(rule(`${railBody}::-webkit-scrollbar`)).toContain('display: none');
      expect(rule(railBody)).not.toContain('overflow');
      // Only at the rail: the expanded sidebar keeps the scrollbar the platform draws.
      expect(body.match(/scrollbar-width/g)).toHaveLength(1);
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

    it('makes the brand cell of S2 W - 38px behind a trigger that is shown, W + 4px otherwise', () => {
      // 226px and 268px at the default W of 264px: what follows the cell starts at W + 32, the edge
      // of the content of main, whatever width the caller gives the sidebar.
      const cell = `${shell}[data-layout='header']:has(> .flg-app-shell-sidebar) > .flg-app-shell-header > .flg-app-shell-header-brand`;
      const behind = `${shell}[data-layout='header']:has(> .flg-app-shell-sidebar)[data-collapsible] > .flg-app-shell-header > .flg-app-shell-trigger + .flg-app-shell-header-brand`;
      expect(rule(behind)).toContain('width: calc(var(--flg-app-shell-sidebar-width) - 38px)');
      expect(rule(cell)).toContain('width: calc(var(--flg-app-shell-sidebar-width) + 4px)');
      expect(body).not.toMatch(/width: (226|268)px/);
      // Without the attribute the trigger is not shown on a wide screen, so W - 38 would leave a gap.
      expect(body.indexOf(behind)).toBeGreaterThan(body.indexOf(`${cell} {`));
    });

    it('makes the head of an S1 sidebar as tall as the row of the header, and 60px with no header', () => {
      const head = `${shell}[data-layout='sidebar'] > .flg-app-shell-sidebar > .flg-app-shell-sidebar-panel > .flg-app-shell-sidebar-head`;
      expect(rule(head)).toContain(`height: ${ROW}`);
      // With no header the variable is 0px, and there is no line to meet: the head keeps the height
      // a header would have, for the brand.
      expect(
        rule(
          `${shell}[data-layout='sidebar']:not(:has(> .flg-app-shell-header)) > .flg-app-shell-sidebar > .flg-app-shell-sidebar-panel > .flg-app-shell-sidebar-head`,
        ),
      ).toContain('height: 60px');
      expect(body).not.toMatch(/\bheight: 60px;\s*padding: 0 20px/);
    });

    it('leaves the brand of the header alone in a shell without a sidebar', () => {
      // S1 hides the brand of the header because the head of the sidebar shows it, and the S2 cell
      // is as wide as the column it lines up with: with no sidebar there is neither, so each rule
      // that hides the cell or fixes its width is for a shell that has one.
      const brandRules = body
        .split('}')
        .map((block) => block.slice(block.lastIndexOf('*/') + 1).trim())
        .filter((block) => block.includes('.flg-app-shell-header-brand {'));
      const fixing = brandRules.filter((block) => /display: none|width: /.test(block));
      expect(fixing).toHaveLength(3);
      for (const block of fixing) {
        const selector = block.slice(0, block.indexOf('{'));
        expect(selector, selector).toContain(':has(> .flg-app-shell-sidebar)');
      }
      expect(
        rule(
          `${shell}[data-layout='sidebar']:has(> .flg-app-shell-sidebar) > .flg-app-shell-header > .flg-app-shell-header-brand`,
        ),
      ).toContain('display: none');
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

  describe('the Nav as a rail', () => {
    const body = wideRules('lg');
    const shell = ".flg-app-shell[data-breakpoint='lg']";
    // Every selector of the rail goes through the sidebar of the collapsed shell: a Nav elsewhere in
    // the page is never a rail.
    const rail = `${shell}[data-collapsed] > .flg-app-shell-sidebar .flg-nav`;
    const item = `${rail} .flg-nav-item:not(.flg-nav-sub .flg-nav-item)`;
    const rule = (selector: string) => {
      const start = body.indexOf(`${selector} {`);
      expect(start, `${selector} has a rule`).toBeGreaterThanOrEqual(0);
      return body.slice(start, body.indexOf('}', start));
    };
    /** The selectors of every rule that mentions the Nav. */
    const navSelectors = [...body.matchAll(/^([^\n{}/]*\.flg-nav[^\n{}]*)[{,]/gm)].map((match) =>
      match[1]!.trim(),
    );

    it('starts every selector at the sidebar of the shell that is collapsed, at its own breakpoint', () => {
      expect(navSelectors.length).toBeGreaterThan(10);
      for (const selector of navSelectors) {
        expect(selector, selector).toMatch(
          /^\.flg-app-shell\[data-breakpoint='lg'\]\[data-collapsed\] > \.flg-app-shell-sidebar \.flg-nav/,
        );
      }
    });

    it('makes an item a 40px square with no padding and 20px icons, a group button too', () => {
      const square = rule(item);
      expect(square).toContain('width: 40px');
      expect(square).toContain('height: 40px');
      expect(square).toContain('padding: 0');
      expect(square).toContain('justify-content: center');
      expect(square).toContain('border-radius: var(--flg-radius-md)');
      expect(rule(`${item} > .flg-nav-item-icon`)).toContain('width: 20px');
      expect(rule(`${item} > .flg-nav-item-icon > svg`)).toContain('height: 20px');
    });

    it('never touches the links of a flyout, which are drawn with their labels', () => {
      // The item selector leaves out whatever is inside `.flg-nav-sub`, and no rule of the rail
      // reaches `.flg-nav-item` without it.
      for (const selector of navSelectors.filter((selector) =>
        /\.flg-nav-item(?![-\w])/.test(selector),
      )) {
        expect(selector, selector).toMatch(
          /:not\(\.flg-nav-sub \.flg-nav-item\)|\.flg-nav-group\[data-has-active\] > \.flg-nav-item/,
        );
      }
    });

    it('hides the label and the count from the eye only, and the chevron altogether', () => {
      const hidden = rule(
        `${item} > :not(.flg-nav-item-icon, .flg-nav-item-letter, .flg-indicator-mark)`,
      );
      // The technique of `flg-visually-hidden`: they stay in the page, as the name of the link.
      expect(hidden).toContain('position: absolute');
      expect(hidden).toContain('clip-path: inset(50%)');
      expect(hidden).not.toContain('display: none');
      expect(rule(`${item} > .flg-nav-group-chevron`)).toContain('display: none');
      // The chevron's rule comes after, so that it wins over the one above at equal specificity.
      expect(body.indexOf(`${item} > .flg-nav-group-chevron {`)).toBeGreaterThan(
        body.indexOf(`${item} > :not(`),
      );
    });

    it('shows the dot and the first letter, which the expanded form hides', () => {
      expect(rule(`${item} > .flg-indicator-mark`)).toContain('display: block');
      expect(rule(`${item} > .flg-nav-item-letter`)).toContain('display: block');
      expect(rule(`${item} > .flg-nav-item-letter`)).toContain(
        'font: var(--flg-weight-semibold) var(--flg-text-sm)',
      );
    });

    it('draws the title of a section out of sight, and a rule of 28px in its place', () => {
      expect(rule(`${rail} .flg-nav-section-title`)).toContain('clip-path: inset(50%)');
      const line = rule(`${rail} > .flg-nav-section:not([data-bottom])::before`);
      expect(line).toContain('width: 28px');
      expect(line).toContain('height: 1px');
      expect(line).toContain('margin: 4px 0');
      expect(line).toContain('background: var(--flg-control-border)');
      // Nothing above the first block to be set off from.
      expect(rule(`${rail} > .flg-nav-section:first-child::before`)).toContain('display: none');
    });

    it('sets a run of items after a section off by the same rule, with the gap of the rail only', () => {
      const run = `${rail} > .flg-nav-section + .flg-nav-list`;
      // The rule of a section and the one of a run are one rule.
      const line = rule(`${run}::before,\n${rail} > .flg-nav-section:not([data-bottom])::before`);
      expect(line).toContain('width: 28px');
      // The 14px of the expanded form is not the rail's, which has the gap of its column.
      expect(rule(run)).toContain('margin-top: 0');
    });

    it('keeps the section at the foot at the foot, with its divider at the width of the rule', () => {
      const foot = rule(`${rail} > .flg-nav-section[data-bottom]`);
      expect(foot).toContain('margin-top: auto');
      expect(foot).toContain('padding-top: 12px');
      expect(foot).toContain('gap: 8px');
      expect(rule(`${rail} > .flg-nav-section[data-bottom] > .flg-divider`)).toContain(
        'width: 28px',
      );
      // After the rule for every section, which sets the gap and the margin the foot changes.
      expect(body.indexOf(`${rail} > .flg-nav-section[data-bottom] {`)).toBeGreaterThan(
        body.indexOf(`${rail} > .flg-nav-section {`),
      );
    });

    it('draws the list of links of a group only while it is the open flyout', () => {
      expect(rule(`${rail} .flg-nav-sub:not(:popover-open)`)).toContain('display: none');
    });

    it('makes the group that holds the current page look as the current page does', () => {
      const pill = `${rail}[data-variant='pill'] .flg-nav-group[data-has-active] > .flg-nav-item`;
      const bar = `${rail}[data-variant='bar'] .flg-nav-group[data-has-active] > .flg-nav-item`;
      expect(rule(pill)).toContain('background: var(--flg-selected-bg)');
      expect(rule(`${pill} > :is(.flg-nav-item-icon, .flg-nav-item-letter)`)).toContain(
        'color: var(--flg-selected-text)',
      );
      expect(rule(bar)).toContain('background: var(--flg-nav-tint)');
    });

    it('puts the bar of N2 on the edge of the rail, 8px from the top and the bottom, and takes no pointer', () => {
      const group = `${rail}[data-variant='bar'] .flg-nav-group[data-has-active] > .flg-nav-item::after`;
      const bar = rule(
        `${group},\n${rail}[data-variant='bar'] .flg-nav-item[aria-current='page']:not(.flg-nav-sub .flg-nav-item)::after`,
      );
      // From the rail width R, which a caller may set: the 40px item is centred in R less the 1px of
      // the panel's right border, so it stands (R - 41px) / 2 from the glass's left edge, and the bar
      // 0.5px inside that edge: -13px at the default 68px, as the mockup. The story RailWidths
      // measures it at 56, 68 and 80px.
      expect(bar).toContain('left: calc(21px - var(--flg-app-shell-rail-width) / 2)');
      expect(bar).not.toContain('-13px');
      expect(bar).toContain('top: 8px');
      expect(bar).toContain('bottom: 8px');
      expect(bar).toContain('width: 3px');
      expect(bar).toContain('border-radius: 0 3px 3px 0');
      expect(bar).toContain('background: var(--flg-accent-solid)');
      expect(bar).toContain('pointer-events: none');
    });

    it('is the same rules at each breakpoint, picked by the data-breakpoint of the root', () => {
      const strip = (name: 'md' | 'lg' | 'xl') => wideRules(name).replaceAll(`'${name}'`, "'BP'");
      expect(strip('md')).toBe(strip('xl'));
      expect(wideRules('md')).toContain(
        ".flg-app-shell[data-breakpoint='md'][data-collapsed] > .flg-app-shell-sidebar .flg-nav {",
      );
    });

    describe('in forced colours', () => {
      const css = buildAppShellCss();
      const layer = css.slice(css.indexOf('@layer flg.preferences'));
      const block = mediaBlocks(layer)[1]![1];

      it('is in the preferences layer, once per breakpoint, bounded by the width of its own', () => {
        expect(css.indexOf('@layer flg.preferences')).toBeGreaterThan(
          css.indexOf('@layer flg.components'),
        );
        expect(mediaBlocks(layer)).toHaveLength(3);
        for (const [index, name] of (['md', 'lg', 'xl'] as const).entries()) {
          const [, text] = mediaBlocks(layer)[index]!;
          expect([...new Set(text.match(/data-breakpoint='[a-z]+'/g))]).toEqual([
            `data-breakpoint='${name}'`,
          ]);
          expect(flat(text)).toBe(flat(railForcedColorsRules(name)));
        }
      });

      it('outlines a group that holds the current page in N1, unless it has the focus', () => {
        expect(block).toMatch(
          /\[data-variant='pill'\] \.flg-nav-group\[data-has-active\] > \.flg-nav-item:not\(:focus-visible\) \{\s*outline: 2px solid Highlight;\s*outline-offset: -2px;/,
        );
      });

      it('drops the tint of N2 and draws its bar in the selection colour', () => {
        expect(block).toMatch(
          /\[data-variant='bar'\] \.flg-nav-group\[data-has-active\] > \.flg-nav-item \{\s*background-image: none;/,
        );
        expect(block).toMatch(
          /\[data-variant='bar'\] \.flg-nav-group\[data-has-active\] > \.flg-nav-item::after \{\s*forced-color-adjust: none;\s*background: Highlight;/,
        );
      });

      it('draws the rule between two blocks in the text colour, before a section or a run', () => {
        expect(block).toMatch(
          /\.flg-nav-section \+ \.flg-nav-list::before,\s*[^{]*\.flg-nav-section:not\(\[data-bottom\]\)::before \{\s*forced-color-adjust: none;\s*background: CanvasText;/,
        );
      });
    });
  });
});
