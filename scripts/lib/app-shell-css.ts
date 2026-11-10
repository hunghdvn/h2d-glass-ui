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

const HEADER = '.flg-app-shell-header';
const SIDEBAR = '.flg-app-shell-sidebar';
const PANEL = '.flg-app-shell-sidebar-panel';
const MAIN = '.flg-app-shell-main';
const FOOTER = '.flg-app-shell-footer';
const HEAD = '.flg-app-shell-sidebar-head';
const TRIGGER = '.flg-app-shell-trigger';
const HEADER_BRAND = '.flg-app-shell-header-brand';
const SCRIM = '.flg-app-shell-scrim';

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
  height: ${HEADER_HEIGHT};
  padding: 0 20px;
}
/* At the rail the head keeps only the mark, in the middle of the column. The name is the name of the
   link, so it goes out of sight and not out of the page. */
${sidebarLayout}[data-collapsed] > ${SIDEBAR} > ${PANEL} > ${HEAD} {
  justify-content: center;
  padding: 0;
}
${shell}[data-collapsed] ${HEAD} .flg-app-shell-brand-name {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
${sidebarLayout} > ${FOOTER} {
  grid-column: 2;
  padding: 0 32px;
}

/* S2: the header owns the top edge and the footer the bottom edge; the sidebar sits between them,
   and the footer pushes it up at the end of the page. The brand is the header's, in a cell as wide
   as the head of a sidebar and the button that folds it, so what follows starts at the edge of the
   content of main; with no sidebar there is no such edge, and the cell is as wide as the brand. */
${headerLayout} > ${HEADER} {
  grid-column: 1 / -1;
}
${headerLayout}${withSidebar} > ${HEADER} > ${HEADER_BRAND} {
  flex: none;
  width: 268px;
}
/* Behind a trigger that is shown the cell is 34 + 8 narrower, so that what follows it stays put. */
${headerLayout}${withSidebar}[data-collapsible] > ${HEADER} > ${TRIGGER} + ${HEADER_BRAND} {
  width: 226px;
}
${headerLayout} > ${SIDEBAR} {
  grid-row: 2;
}
${headerLayout} > ${SIDEBAR} > ${PANEL} {
  top: var(--flg-app-shell-header-height);
  max-height: calc(100dvh - var(--flg-app-shell-header-height));
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

/* The padding of the page keeps what is scrolled to clear of the header; 60px is what a header is
   before the shell has measured it. */
:root:has(${shell} > ${HEADER}) {
  scroll-padding-top: var(--flg-app-shell-header-offset, ${HEADER_HEIGHT});
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
  return `/* The rules of the AppShell that depend on the width, one block per breakpoint: the wide screens,
   then the narrow ones, where the sidebar is a sheet. Generated by scripts/build-theme.ts
   from scripts/lib/app-shell-css.ts; do not edit. */
@layer flg.components {
${indent(blocks.join('\n'))}
}
`;
}
