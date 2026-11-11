/**
 * The rules of the AppShell for a wide screen (spec phase 5 §3.3), written once and generated for
 * each breakpoint. A media query cannot read a variable, so `breakpoint="md" | "lg" | "xl"` cannot
 * be one rule: each breakpoint gets its own `@media (min-width: …)` block, picked by the
 * `data-breakpoint` of the root. There is one boundary per breakpoint and the narrow screen is the
 * base (src/styles/components/app-shell.css), so no width falls between two rules.
 */
import { APP_SHELL_BREAKPOINTS } from '../../src/components/app-shell/breakpoints';

export { APP_SHELL_BREAKPOINTS };
export type AppShellBreakpointName = keyof typeof APP_SHELL_BREAKPOINTS;

/** The height of the header and of the first row of the grid on a wide screen. */
const HEADER_HEIGHT = '60px';

/**
 * The first row of the grid, as the base stylesheet writes it: the height variable, or the measured
 * header when that is taller (a second line, a taller control). What must meet the header's bottom
 * edge takes it too.
 */
const HEADER_ROW =
  'max(var(--flg-app-shell-header-height), var(--flg-app-shell-header-offset, 0px))';

const HEADER = '.flg-app-shell-header';
const SIDEBAR = '.flg-app-shell-sidebar';
const PANEL = '.flg-app-shell-sidebar-panel';
const MAIN = '.flg-app-shell-main';
const FOOTER = '.flg-app-shell-footer';
const HEAD = '.flg-app-shell-sidebar-head';
const BODY = '.flg-app-shell-sidebar-body';
const TRIGGER = '.flg-app-shell-trigger';
const HEADER_BRAND = '.flg-app-shell-header-brand';
const SCRIM = '.flg-app-shell-scrim';

/**
 * The technique of `flg-visually-hidden` (utilities.css): what is hidden this way stays in the page,
 * and stays the name of the link or the group that holds it.
 */
const VISUALLY_HIDDEN = [
  'position: absolute;',
  'width: 1px;',
  'height: 1px;',
  'margin: -1px;',
  'padding: 0;',
  'overflow: hidden;',
  'clip-path: inset(50%);',
  'white-space: nowrap;',
  'border: 0;',
].join('\n  ');

/**
 * The rules for one breakpoint, without indentation. They are in the order the cascade needs: each
 * rule that must win over an earlier one is more specific than it, or later.
 */
export function wideRules(breakpoint: AppShellBreakpointName): string {
  const shell = `.flg-app-shell[data-breakpoint='${breakpoint}']`;
  const sidebarLayout = `${shell}[data-layout='sidebar']`;
  const headerLayout = `${shell}[data-layout='header']`;
  // A shell without a sidebar is one column; the `[data-layout]` keeps these above the layout rules.
  const noSidebar = `${shell}[data-layout]:not(:has(> ${SIDEBAR}))`;
  // The brand cell of the header is hidden (S1) or lined up with the sidebar column (S2) only where
  // there is a sidebar: without one the header's brand is the only one, and there is no column.
  const withSidebar = `:has(> ${SIDEBAR})`;
  return `${shell} {
  --flg-app-shell-header-height: ${HEADER_HEIGHT};
  grid-template-columns: var(--flg-app-shell-sidebar-width) minmax(0, 1fr);
}
${shell}:not(:has(> ${HEADER})) {
  --flg-app-shell-header-height: 0px;
}
/* The rail: the sidebar column narrows. It is not animated (spec §3.6): the columns of the grid
   would lay the whole page out again on every frame. */
${shell}[data-collapsed] {
  grid-template-columns: var(--flg-app-shell-rail-width) minmax(0, 1fr);
}
/* The body of the rail scrolls without a scrollbar. One that takes room (Windows, Linux with classic
   scrollbars) would narrow the column, so the squares would leave its middle and the bar of N2 the
   glass's edge, where the body clips it. Safari before 18.2 knows only the pseudo-element. */
${shell}[data-collapsed] > ${SIDEBAR} > ${PANEL} > ${BODY} {
  scrollbar-width: none;
}
${shell}[data-collapsed] > ${SIDEBAR} > ${PANEL} > ${BODY}::-webkit-scrollbar {
  display: none;
}
${shell} > ${HEADER} {
  gap: 8px;
  padding: 0 16px;
}
/* The trigger folds the sidebar, so a sidebar that cannot fold has no use for it here. */
${shell}:not([data-collapsible]) ${TRIGGER} {
  display: none;
}
/* The 4px that sets the brand off the trigger on a narrow screen is the search field's here. */
${shell} > ${HEADER} > ${TRIGGER} + ${HEADER_BRAND} {
  margin-left: 0;
}
${shell} > ${MAIN} {
  grid-column: 2;
  padding: 28px 32px;
}
${shell} > ${SIDEBAR} {
  grid-column: 1;
  display: block;
  align-self: stretch;
  z-index: 2;
}
${shell} > ${SIDEBAR} > ${PANEL} {
  position: sticky;
}

/* S1: the sidebar owns the left edge from top to bottom; the header and the footer sit over the
   content column. The brand is the sidebar's, and its head is as tall as the header; a shell with
   no sidebar keeps the header's. */
${sidebarLayout} > ${HEADER} {
  grid-column: 2;
}
${sidebarLayout}${withSidebar} > ${HEADER} > ${HEADER_BRAND} {
  display: none;
}
${sidebarLayout} > ${SIDEBAR} {
  grid-row: 1 / -1;
}
${sidebarLayout} > ${SIDEBAR} > ${PANEL} {
  top: 0;
  max-height: 100dvh;
}
${sidebarLayout} > ${SIDEBAR} > ${PANEL} > ${HEAD} {
  height: ${HEADER_ROW};
  padding: 0 20px;
}
/* With no header the variable is 0px and there is no line to meet: the head keeps the height a
   header would have, for the brand. */
${sidebarLayout}:not(:has(> ${HEADER})) > ${SIDEBAR} > ${PANEL} > ${HEAD} {
  height: ${HEADER_HEIGHT};
}
/* At the rail the head keeps only the mark, in the middle of the column. The name is the name of the
   link, so it goes out of sight and not out of the page. */
${sidebarLayout}[data-collapsed] > ${SIDEBAR} > ${PANEL} > ${HEAD} {
  justify-content: center;
  padding: 0;
}
${shell}[data-collapsed] ${HEAD} .flg-app-shell-brand-name {
  ${VISUALLY_HIDDEN}
}
${sidebarLayout} > ${FOOTER} {
  grid-column: 2;
  padding: 0 32px;
}

/* S2: the header owns the top edge and the footer the bottom edge; the sidebar sits between them,
   and the footer pushes it up at the end of the page. The brand is the header's, in a cell as wide
   as the head of a sidebar and the button that folds it, so what follows starts at the edge of the
   content of main; with no sidebar there is no such edge, and the cell is as wide as the brand.
   That edge is W + 32 (the padding of main), and what follows the cell (the search of the mockup)
   sets itself off by 4px: 16 (the padding) + W + 4 (the cell) + 8 (the gap) + 4 = W + 32. The cell
   follows the variable, so a sidebar of another width keeps the line; 268px at the default 264px. */
${headerLayout} > ${HEADER} {
  grid-column: 1 / -1;
}
${headerLayout}${withSidebar} > ${HEADER} > ${HEADER_BRAND} {
  flex: none;
  width: calc(var(--flg-app-shell-sidebar-width) + 4px);
}
/* Behind a trigger that is shown the cell is 34 + 8 narrower, so that what follows it stays put:
   226px at the default. */
${headerLayout}${withSidebar}[data-collapsible] > ${HEADER} > ${TRIGGER} + ${HEADER_BRAND} {
  width: calc(var(--flg-app-shell-sidebar-width) - 38px);
}
${headerLayout} > ${SIDEBAR} {
  grid-row: 2;
}
${headerLayout} > ${SIDEBAR} > ${PANEL} {
  top: ${HEADER_ROW};
  max-height: calc(100dvh - ${HEADER_ROW});
}
${headerLayout} > ${SIDEBAR} > ${PANEL} > ${HEAD} {
  display: none;
}
${headerLayout} > ${FOOTER} {
  grid-column: 1 / -1;
  z-index: 3;
  padding: 0 20px;
}

${noSidebar} {
  grid-template-columns: minmax(0, 1fr);
}
${noSidebar} > :is(${HEADER}, ${MAIN}, ${FOOTER}) {
  grid-column: 1;
}

${railRules(shell)}

/* The padding of the page keeps what is scrolled to clear of the header; 60px is what a header is
   before the shell has measured it. */
:root:has(${shell} > ${HEADER}) {
  scroll-padding-top: var(--flg-app-shell-header-offset, ${HEADER_HEIGHT});
}`;
}

/**
 * The Nav as a rail (spec phase 5 §4.3, "Rail"): the rules of the navigation in a sidebar that is
 * collapsed on a wide screen. They are here and not in nav.css because the rail is a state of the
 * shell at a width, which the server already knows from `data-collapsed` and the breakpoint, so its
 * HTML is right before anything runs. Every selector goes through the sidebar of the shell, so a Nav
 * that sits elsewhere in the page is never a rail, and each one names the Nav's own parts and not the
 * links of a flyout, which are drawn with their labels (nav.css). The colours of the states are those
 * of nav.css: the icon and the first letter take the same one, so the rail adds only the geometry, the
 * background of a group that holds the current page, and the bar.
 */
function railRules(shell: string): string {
  const rail = `${shell}[data-collapsed] > ${SIDEBAR} .flg-nav`;
  // A part of the sidebar's own list: not one of the links of a flyout, which come after its button
  // inside `.flg-nav-sub`.
  const item = `${rail} .flg-nav-item:not(.flg-nav-sub .flg-nav-item)`;
  const pillGroup = `${rail}[data-variant='pill'] .flg-nav-group[data-has-active] > .flg-nav-item`;
  const barGroup = `${rail}[data-variant='bar'] .flg-nav-group[data-has-active] > .flg-nav-item`;
  const barCurrent = `${rail}[data-variant='bar'] .flg-nav-item[aria-current='page']:not(.flg-nav-sub .flg-nav-item)`;
  return `/* The rail: the navigation is a column of 40px squares in the middle of the column. */
${rail} {
  align-items: center;
  gap: 4px;
  padding: 12px 0;
}
${rail} > .flg-nav-list,
${rail} > .flg-nav-section > .flg-nav-list {
  align-items: center;
  gap: 4px;
}
${item} {
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: var(--flg-radius-md);
}
${item} > .flg-nav-item-icon {
  width: 20px;
  height: 20px;
}
${item} > .flg-nav-item-icon > svg {
  width: 20px;
  height: 20px;
}
/* An item with no icon shows the first letter of its label. */
${item} > .flg-nav-item-letter {
  display: block;
  font: var(--flg-weight-semibold) var(--flg-text-sm) / 1 var(--flg-font-sans);
}
/* The label and the count go out of sight and stay the name of the link ("Inbox 12"); the count is
   the dot, in the corner, and a button's chevron is not drawn at all. */
${item} > :not(.flg-nav-item-icon, .flg-nav-item-letter, .flg-indicator-mark) {
  ${VISUALLY_HIDDEN}
}
${item} > .flg-nav-group-chevron {
  display: none;
}
${item} > .flg-indicator-mark {
  display: block;
}

/* A section is a rule between the blocks, and its title goes out of sight and stays the name of its
   group; the items after a section, a block of their own, have the same rule above them. The column
   keeps its gap, without the 14px of the expanded form. The first block has nothing above it to be
   set off from. The section at the foot keeps its own rule, the divider that it holds, at the width
   of the rail's. */
${rail} > .flg-nav-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 0;
}
${rail} > .flg-nav-section + .flg-nav-list {
  margin-top: 0;
}
${rail} > .flg-nav-section + .flg-nav-list::before,
${rail} > .flg-nav-section:not([data-bottom])::before {
  content: '';
  flex: none;
  width: 28px;
  height: 1px;
  margin: 4px 0;
  background: var(--flg-control-border);
}
${rail} > .flg-nav-section:first-child::before {
  display: none;
}
${rail} > .flg-nav-section[data-bottom] {
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
}
${rail} > .flg-nav-section[data-bottom] > .flg-divider {
  width: 28px;
  margin-left: 0;
}
${rail} .flg-nav-section-title {
  ${VISUALLY_HIDDEN}
}

/* The list of links of a group is not drawn in the rail, unless it is the open flyout. */
${rail} .flg-nav-sub:not(:popover-open) {
  display: none;
}

/* The group that holds the current page looks as the current page does, since its links are out of
   sight. N1 fills it as it fills the current item; N2 tints it and draws the bar on the left edge of
   the glass, at any width of the rail: the item is centred in the rail less the 1px of the panel's
   right border, so it stands (R - 41px) / 2 from that edge, and the bar half a pixel inside it,
   -13px at the default 68px. */
${pillGroup} {
  background: var(--flg-selected-bg);
}
${pillGroup} > :is(.flg-nav-item-icon, .flg-nav-item-letter) {
  color: var(--flg-selected-text);
}
${barGroup} {
  background: var(--flg-nav-tint);
}
${barGroup}::after,
${barCurrent}::after {
  content: '';
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: calc(21px - var(--flg-app-shell-rail-width) / 2);
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--flg-accent-solid);
  pointer-events: none;
}`;
}

/**
 * The rules of the rail for forced colours, for the screens of one breakpoint. They are in the
 * preferences layer, as the other forced-colour rules are, and are generated because the rail is a
 * state of the shell at a width (see `railRules`).
 */
export function railForcedColorsRules(breakpoint: AppShellBreakpointName): string {
  const rail = `.flg-app-shell[data-breakpoint='${breakpoint}'][data-collapsed] > ${SIDEBAR} .flg-nav`;
  return `/* The group that holds the current page has no background to show it by, so N1 draws an outline
   inside it, as the current item has. One with the focus keeps the ring of the focus. */
${rail}[data-variant='pill'] .flg-nav-group[data-has-active] > .flg-nav-item:not(:focus-visible) {
  outline: 2px solid Highlight;
  outline-offset: -2px;
}
/* N2: the tint is a gradient, which the system drops, and the bar is the selection colour. */
${rail}[data-variant='bar'] .flg-nav-group[data-has-active] > .flg-nav-item {
  background-image: none;
}
${rail}[data-variant='bar'] .flg-nav-group[data-has-active] > .flg-nav-item::after {
  forced-color-adjust: none;
  background: Highlight;
}
/* The rule between two blocks is a background, which is dropped. */
${rail} > .flg-nav-section + .flg-nav-list::before,
${rail} > .flg-nav-section:not([data-bottom])::before {
  forced-color-adjust: none;
  background: CanvasText;
}`;
}

/**
 * The rules of the sidebar as a sheet (spec phase 5 §3.4, §4.3), for the screens narrower than the
 * breakpoint, without indentation. The sidebar is the one element of the grid, and while the root is
 * open it turns into the fixed layer and its panel fills it; the scrim is a sibling under it. They
 * are written for the screens that do not match `min-width`, so there is one boundary per breakpoint
 * and an `open` that a parent keeps true on a wide screen shows nothing.
 */
export function sheetRules(breakpoint: AppShellBreakpointName): string {
  const shell = `.flg-app-shell[data-breakpoint='${breakpoint}'][data-open]`;
  return `${shell} > ${SIDEBAR} {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 5;
  display: block;
  /* A strip of the scrim is left to touch, on the narrowest phones. */
  width: min(var(--flg-app-shell-drawer-width), calc(100vw - 48px));
  transition: translate var(--flg-duration-normal) var(--flg-ease);
}
${shell} > ${SIDEBAR} > ${PANEL} {
  border-radius: 0 var(--flg-radius-lg) var(--flg-radius-lg) 0;
}
/* S1: the brand stands 8px in from where the head starts, as the mockup draws it. */
${shell}[data-layout='sidebar'] > ${SIDEBAR} > ${PANEL} > ${HEAD} {
  padding-left: 18px;
}
${shell} > ${SCRIM} {
  position: fixed;
  inset: 0;
  z-index: 4;
  display: block;
  background: var(--flg-scrim);
  -webkit-backdrop-filter: blur(var(--flg-scrim-blur));
  backdrop-filter: blur(var(--flg-scrim-blur));
  transition: opacity var(--flg-duration-normal) var(--flg-ease);
}
/* The sheet slides in and the scrim fades in; neither is animated out (spec §3.6). */
@starting-style {
  ${shell} > ${SIDEBAR} {
    translate: -100% 0;
  }
  ${shell} > ${SCRIM} {
    opacity: 0;
  }
}`;
}

const indent = (text: string) =>
  text
    .split('\n')
    .map((line) => (line === '' ? line : `  ${line}`))
    .join('\n');

/** The whole of `src/styles/generated/app-shell.css`. */
export function buildAppShellCss(): string {
  const names = Object.keys(APP_SHELL_BREAKPOINTS) as AppShellBreakpointName[];
  const blocks = [
    ...names.map(
      (name) =>
        `@media (min-width: ${APP_SHELL_BREAKPOINTS[name]}px) {\n${indent(wideRules(name))}\n}`,
    ),
    ...names.map(
      (name) =>
        `@media not all and (min-width: ${APP_SHELL_BREAKPOINTS[name]}px) {\n${indent(sheetRules(name))}\n}`,
    ),
  ];
  // The rail in forced colours is a preference, so it is in the preferences layer, with one
  // `min-width` per block like the rest.
  const forced = names.map(
    (name) =>
      `@media (forced-colors: active) and (min-width: ${APP_SHELL_BREAKPOINTS[name]}px) {\n${indent(railForcedColorsRules(name))}\n}`,
  );
  return `/* The rules of the AppShell that depend on the width, one block per breakpoint: the wide screens,
   then the narrow ones, where the sidebar is a sheet. Generated by scripts/build-theme.ts
   from scripts/lib/app-shell-css.ts; do not edit. */
@layer flg.components {
${indent(blocks.join('\n'))}
}
@layer flg.preferences {
${indent(forced.join('\n'))}
}
`;
}
