import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { DemoPage, DemoRows } from '../../../.storybook/app-shell-demo';
import { paintedPixels } from '../../../.storybook/painted-pixel';
import type { Rgb } from '../../../.storybook/painted-pixel';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import type { RealUserEvent } from '../../../.storybook/real-input';
import { afterLayout, withViewport } from '../../../.storybook/viewport';
import { Toaster } from '../toast/Toaster';
import { toast } from '../toast/toast';
import { AppShell } from './AppShell';
import { APP_SHELL_BREAKPOINTS } from './breakpoints';

// The stories of the frame draw the application of the mockup (Lumen) on a whole page: stage `page`,
// so a sticky header sticks to the document as it does in an application. The two that look like the
// approved mockups are `Sidebar` (S1) and `Header` (S2). The others check the layout in the real
// engines, which jsdom has no layout for: they are `no-visual`, since a screenshot cannot say them.
// An application is a page, so these stories ask axe for the rules about pages that the preview turns
// off for the stories of single components (spec phase 5 §7, layer 3).
const PAGE_RULES = [
  // Two places are left out of `region`. The skip link: the page that Storybook renders a story in has
  // links of its own before it, so axe does not take it for the first link of the page, which an
  // application's skip link is. The head of the sidebar, where S1 draws the brand on a wide screen:
  // the sidebar is not a landmark (spec §6.3), so a brand there is outside every landmark, where on a narrow screen it is
  // in the banner.
  {
    id: 'region',
    enabled: true,
    selector:
      ':not(.flg-app-shell-skip, .flg-app-shell-sidebar-head, .flg-app-shell-sidebar-head *)',
  },
  { id: 'landmark-one-main', enabled: true },
  { id: 'landmark-unique', enabled: true },
  { id: 'bypass', enabled: true },
];

const meta = {
  title: 'Components/AppShell',
  component: AppShell,
  parameters: { stage: 'page', a11y: { config: { rules: PAGE_RULES } } },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** S1 (spec §3.2): the sidebar runs from the top to the bottom of the screen; the header and the footer sit over the content column. */
export const Sidebar: Story = {
  render: () => <DemoPage layout="sidebar" />,
};

/** S2: the header runs across the whole width, and so does the footer, under the sidebar. */
export const Header: Story = {
  render: () => <DemoPage layout="header" />,
};

// ---------------------------------------------------------------------------------------------------
// Layout, in the real engines.

const WIDE = { width: 1280, height: 720 };
const HEADER_WIDE = 60;
const SIDEBAR_WIDE = 264;

/** The element of the shell, or a failure that says which one is missing. */
function part<T extends HTMLElement = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`${selector} is not in the story.`);
  return element;
}

const rect = (selector: string) => part(selector).getBoundingClientRect();
const clientWidth = () => document.documentElement.clientWidth;
const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

async function scrollTo(y: number) {
  window.scrollTo(0, y);
  await afterLayout();
}

/** A pixel is not worth arguing about; a fraction of one is the engines' rounding. */
const near = (actual: number, expected: number) => expect(actual).toBeCloseTo(expected, 0);

/**
 * The header and the sidebar stay where they are while the page scrolls under them, in both layouts
 * and with and without a footer, and the sidebar stops at what the layout says at the end of the
 * page. The ground is the grid: a sticky element does not leave its grid area, so a header that sat
 * in the first row alone would scroll away with the page.
 */
function checkSticky(layout: 'sidebar' | 'header', footer: boolean) {
  return async () => {
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      await expect(document.documentElement.scrollHeight).toBeGreaterThan(WIDE.height * 2);
      const header = '.flg-app-shell-header';
      // The panel is what is seen and what sticks; the sidebar itself is the cell of the grid.
      const sidebar = '.flg-app-shell-sidebar-panel';
      // In the middle of the page.
      await scrollTo(800);
      await expect(window.scrollY).toBeGreaterThan(700);
      near(rect(header).top, 0);
      near(rect(header).height, HEADER_WIDE);
      near(rect(sidebar).top, layout === 'sidebar' ? 0 : HEADER_WIDE);
      near(rect(sidebar).height, layout === 'sidebar' ? WIDE.height : WIDE.height - HEADER_WIDE);
      near(rect(sidebar).left, 0);
      near(rect(sidebar).width, SIDEBAR_WIDE);
      // S1: the header covers the content column only; S2: the whole width.
      near(rect(header).left, layout === 'sidebar' ? SIDEBAR_WIDE : 0);
      near(rect(header).right, clientWidth());
      // They are on top of the page, so a click lands on them and not on the content that scrolls.
      const headerBox = rect(header);
      const atHeader = document.elementFromPoint(
        headerBox.left + headerBox.width / 2,
        headerBox.top + headerBox.height / 2,
      );
      await expect(part(header).contains(atHeader)).toBe(true);
      const sidebarBox = rect(sidebar);
      const atSidebar = document.elementFromPoint(
        sidebarBox.left + sidebarBox.width / 2,
        sidebarBox.top + sidebarBox.height / 2,
      );
      await expect(part(sidebar).contains(atSidebar)).toBe(true);

      // At the end of the page.
      await scrollTo(maxScroll());
      near(rect(header).top, 0);
      if (footer) {
        near(rect('.flg-app-shell-footer').bottom, window.innerHeight);
        near(rect('.flg-app-shell-footer').height, 44);
      }
      if (layout === 'sidebar') {
        // The sidebar owns the left edge to the bottom of the screen, whatever the footer does.
        near(rect(sidebar).top, 0);
        near(rect(sidebar).bottom, window.innerHeight);
        if (footer) near(rect('.flg-app-shell-footer').left, SIDEBAR_WIDE);
      } else if (footer) {
        // The footer runs under the sidebar and pushes it up: it ends where the footer begins.
        near(rect(sidebar).bottom, rect('.flg-app-shell-footer').top);
        near(rect('.flg-app-shell-footer').left, 0);
        near(rect('.flg-app-shell-footer').right, clientWidth());
        // It is moved, not squeezed: its top slides under the header as the footer comes in, as the
        // sidebar of a documentation site does.
        near(rect(sidebar).height, WIDE.height - HEADER_WIDE);
        const footerBox = rect('.flg-app-shell-footer');
        const atFooter = document.elementFromPoint(footerBox.left + 40, footerBox.top + 20);
        await expect(part('.flg-app-shell-footer').contains(atFooter)).toBe(true);
      } else {
        near(rect(sidebar).bottom, window.innerHeight);
      }
      await scrollTo(0);
    });
  };
}

const long = { rows: 40 };

export const StickySidebarLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="sidebar" {...long} />,
  play: checkSticky('sidebar', true),
};
export const StickySidebarLayoutWithoutFooter: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="sidebar" footer={false} {...long} />,
  play: checkSticky('sidebar', false),
};
export const StickyHeaderLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="header" {...long} />,
  play: checkSticky('header', true),
};
export const StickyHeaderLayoutWithoutFooter: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="header" footer={false} {...long} />,
  play: checkSticky('header', false),
};

const BREAKPOINTS = { md: 768, lg: 1024, xl: 1280 } as const;
const WIDTHS = [1280, 1024, 768, 390];

/**
 * One boundary per breakpoint, no sideways scroll at any width, and no width where neither layout
 * applies: for each value of `breakpoint` the page is looked at at the usual widths and on both
 * sides of the boundary itself. The attribute is set on the root straight away, as the CSS is the
 * subject here and a re-render would add nothing.
 */
function checkWidths(layout: 'sidebar' | 'header') {
  return async () => {
    await withViewport(async (viewport) => {
      const shell = part('.flg-app-shell');
      for (const [name, boundary] of Object.entries(BREAKPOINTS)) {
        shell.setAttribute('data-breakpoint', name);
        for (const width of [...WIDTHS, boundary - 1, boundary]) {
          await viewport.set(width);
          const label = `${layout}, breakpoint ${name}, ${width}px`;
          await expect(
            document.documentElement.scrollWidth,
            `${label}: no sideways scroll`,
          ).toBeLessThanOrEqual(clientWidth());
          const wide = width >= boundary;
          const sidebar = getComputedStyle(part('.flg-app-shell-sidebar')).display;
          await expect(sidebar, `${label}: the sidebar is in the grid only from the boundary`).toBe(
            wide ? 'block' : 'none',
          );
          const column = wide && layout === 'sidebar' ? SIDEBAR_WIDE : 0;
          near(rect('.flg-app-shell-header').left, column);
          near(rect('.flg-app-shell-header').right, clientWidth());
          near(rect('.flg-app-shell-main').left, wide ? SIDEBAR_WIDE : 0);
          near(rect('.flg-app-shell-main').right, clientWidth());
          near(rect('.flg-app-shell-header').height, wide ? HEADER_WIDE : 56);
        }
      }
    });
  };
}

export const NoSidewaysScrollSidebarLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="sidebar" rows={6} />,
  play: checkWidths('sidebar'),
};
export const NoSidewaysScrollHeaderLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="header" rows={6} />,
  play: checkWidths('header'),
};

/** Whether the element has a box on the page: `display: none` on it or above it leaves none. */
const shown = (element: Element) => element.getClientRects().length > 0;

/**
 * A shell without a sidebar (a settings page, a sign-in page) keeps its brand in the header at every
 * width, in both layouts: nothing else draws it. The cell is as wide as the brand, since there is no
 * column for it to line up with, and the brand stands at the padding of the header, since the trigger
 * it would be set off from is hidden.
 */
function checkBrandWithoutSidebar() {
  return async () => {
    await withViewport(async (viewport) => {
      for (const [width, padding] of [
        [1280, 16],
        [390, 10],
      ] as const) {
        await viewport.set(width);
        const brands = Array.from(document.querySelectorAll('.flg-app-shell-brand'));
        await expect(brands, `${width}px: one brand is visible`).toHaveLength(1);
        await expect(shown(brands[0]!), `${width}px: one brand is visible`).toBe(true);
        await expect(getComputedStyle(trigger()).display).toBe('none');
        const cell = rect('.flg-app-shell-header-brand');
        near(cell.left, padding);
        near(cell.width, rectOf(brands[0]!).width);
      }
    });
  };
}

export const BrandWithoutSidebarSidebarLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="sidebar" sidebar={false} rows={6} />,
  play: checkBrandWithoutSidebar(),
};
export const BrandWithoutSidebarHeaderLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="header" sidebar={false} rows={6} />,
  play: checkBrandWithoutSidebar(),
};

// ---------------------------------------------------------------------------------------------------
// The document under a sticky header (spec §3.3).

/**
 * The shell measures its header and writes the height on `<html>`, and the page's own rule takes its
 * `scroll-padding-top` from it, so a control focused from below, an `#anchor` and a find-in-page hit
 * land under the header and not behind it. The margin of `<body>` is gone, so the frame touches the
 * edges. A header that grows, because its height variable is changed, is followed.
 */
export const DocumentRules: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="header" rows={6} />,
  play: async () => {
    await withViewport(async (viewport) => {
      const root = document.documentElement;
      const header = part('.flg-app-shell-header');
      const offset = () => root.style.getPropertyValue('--flg-app-shell-header-offset');
      for (const [width, height] of [
        [1280, 60],
        [390, 56],
      ] as const) {
        await viewport.set(width);
        await waitFor(() => expect(offset()).toBe(`${height}px`));
        await expect(getComputedStyle(root).scrollPaddingTop).toBe(`${height}px`);
        near(header.getBoundingClientRect().height, height);
        const body = getComputedStyle(document.body);
        await expect([
          body.marginTop,
          body.marginRight,
          body.marginBottom,
          body.marginLeft,
        ]).toEqual(['0px', '0px', '0px', '0px']);
        // The frame touches the edge of the window.
        near(part('.flg-app-shell').getBoundingClientRect().left, 0);
        near(header.getBoundingClientRect().top, 0);
      }
      await viewport.set(1280);
      // The caller gives the header more room: the padding follows the measure, not a guess.
      part('.flg-app-shell').style.setProperty('--flg-app-shell-header-height', '88px');
      await waitFor(() => expect(offset()).toBe('88px'));
      await expect(getComputedStyle(root).scrollPaddingTop).toBe('88px');
    });
  },
};

// Where the row the keyboard goes back to is put: inside the window, so a browser sees nothing to
// scroll to, but under the header, so it is hidden. Only a `scroll-padding-top` that matches the
// header tells it otherwise; a row that was out of the window altogether would be centred.
const ROW_UNDER_HEADER = 10;

/**
 * A control that the keyboard goes back to is not left under the sticky header: Shift+Tab onto a row
 * that is in the window but behind the header brings it out below the header (WCAG 2.4.11), in both
 * layouts, on a wide and on a narrow screen. Skipped without trusted input.
 */
function checkFocusClear() {
  return async () => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      for (const width of [1280, 390]) {
        await viewport.set(width);
        const header = part('.flg-app-shell-header');
        await waitFor(() =>
          expect(
            document.documentElement.style.getPropertyValue('--flg-app-shell-header-offset'),
          ).not.toBe(''),
        );
        const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-row]'));
        await expect(rows).toHaveLength(40);
        // Row 20 has the focus; row 19, above it, is behind the header.
        const below = rows[19]!;
        const above = rows[18]!;
        below.focus();
        await scrollTo(above.getBoundingClientRect().top + window.scrollY - ROW_UNDER_HEADER);
        await expect(above.getBoundingClientRect().top).toBeLessThan(
          header.getBoundingClientRect().bottom,
        );
        await real.keyboard('{Shift>}{Tab}{/Shift}');
        await expect(above).toHaveFocus();
        await waitFor(() => {
          const headerBottom = header.getBoundingClientRect().bottom;
          expect(
            above.getBoundingClientRect().top,
            `${width}px: the focused row is below the header`,
          ).toBeGreaterThanOrEqual(headerBottom - 0.5);
        });
        await scrollTo(0);
      }
    });
  };
}

export const FocusStaysBelowTheHeaderSidebarLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="sidebar" rows={40} />,
  play: checkFocusClear(),
};
export const FocusStaysBelowTheHeaderHeaderLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="header" rows={40} />,
  play: checkFocusClear(),
};

// ---------------------------------------------------------------------------------------------------
// The skip link.

/**
 * The first Tab shows the skip link, in view and readable; Enter takes the focus to the main, which is
 * not under the header. Skipped without trusted input.
 *
 * Two things the engines do differently from a user's browser. Safari does not put links in the Tab
 * order unless a setting is on, so WebKit gets the focus by script and the link is checked from there.
 * And a navigation to a fragment closes the page the Vitest browser runs the story in, whatever the
 * fragment, so Enter is caught before it navigates and the story does what the browser does for a
 * fragment: scrolls to the target, which honours the `scroll-padding-top` of the page, and focuses it.
 */
function checkSkipLink() {
  return async () => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      const link = part<HTMLAnchorElement>('.flg-app-shell-skip');
      const main = part('.flg-app-shell-main');
      // Nothing of the page has the focus yet; the link is out of sight.
      (document.activeElement as HTMLElement | null)?.blur();
      await expect(link.getBoundingClientRect().width).toBeLessThanOrEqual(1);
      const safari =
        navigator.userAgent.includes('AppleWebKit') && !navigator.userAgent.includes('Chrome');
      if (safari) link.focus();
      else await real.keyboard('{Tab}');
      await expect(link).toHaveFocus();
      const box = link.getBoundingClientRect();
      await expect(getComputedStyle(link).position).toBe('fixed');
      await expect(box.width).toBeGreaterThan(40);
      await expect(box.top).toBeGreaterThanOrEqual(0);
      await expect(box.left).toBeGreaterThanOrEqual(0);
      await expect(box.right).toBeLessThanOrEqual(clientWidth());
      // It is the first thing under the pointer at its own centre: nothing covers it.
      const at = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      await expect(at).toBe(link);
      const followFragment = (event: MouseEvent) => {
        if (event.target !== link) return;
        event.preventDefault();
        expect(link.getAttribute('href')).toBe(`#${main.id}`);
        main.scrollIntoView();
        main.focus({ preventScroll: true });
      };
      window.addEventListener('click', followFragment, true);
      try {
        await real.keyboard('{Enter}');
      } finally {
        window.removeEventListener('click', followFragment, true);
      }
      await waitFor(() => expect(main).toHaveFocus());
      await afterLayout();
      await expect(main.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        part('.flg-app-shell-header').getBoundingClientRect().bottom - 0.5,
      );
      // The link is out of sight again once the focus is gone.
      await expect(link.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    });
  };
}

export const SkipLinkSidebarLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="sidebar" rows={20} />,
  play: checkSkipLink(),
};
export const SkipLinkHeaderLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="header" rows={20} />,
  play: checkSkipLink(),
};

// ---------------------------------------------------------------------------------------------------
// The trigger, the rail and the phone (spec §3.3, §6.3).

/**
 * S1 at the rail (spec §4.3): the sidebar column is 68px, the head keeps the mark of the brand in the
 * middle, the navigation is icons. The pointer is on "Settings", with the tooltip the mockup draws.
 * The mockup draws the rail without a footer, and so do these.
 */
export const SidebarRail: Story = {
  render: () => <DemoPage layout="sidebar" defaultCollapsed footer={false} hoverSettings />,
};

/** S2 at the rail: only the column under the header narrows, the brand and what follows stay put. */
export const HeaderRail: Story = {
  render: () => <DemoPage layout="header" defaultCollapsed footer={false} hoverSettings />,
};

/**
 * S1 on a phone, the sidebar closed: the header has the button and the brand. The harness shoots a
 * story with this tag at that size (spec §7).
 */
export const SidebarPhone: Story = {
  tags: ['viewport-390x844'],
  render: () => <DemoPage layout="sidebar" />,
};

/** S2 on a phone, the sidebar closed. */
export const HeaderPhone: Story = {
  tags: ['viewport-390x844'],
  render: () => <DemoPage layout="header" />,
};

const RAIL = 68;
const trigger = () => part<HTMLButtonElement>('.flg-app-shell-trigger');
const rectOf = (element: Element) => element.getBoundingClientRect();

/**
 * "Settings" is the foot of the navigation: it is pinned to the bottom of the sidebar and not left
 * under the last link, as the mockup draws it, in both layouts, with a footer beside the sidebar (S1)
 * or under it (S2).
 */
function checkNavEnd(layout: 'sidebar' | 'header') {
  return async () => {
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      const panel = rect('.flg-app-shell-sidebar-panel');
      const settings = rectOf(part('.demo-nav-end a'));
      // The padding below the navigation is 12px.
      near(settings.bottom, panel.bottom - 12);
      near(panel.bottom, layout === 'sidebar' ? WIDE.height : WIDE.height - 44);
    });
  };
}

export const NavEndAtTheBottomSidebarLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="sidebar" />,
  play: checkNavEnd('sidebar'),
};
export const NavEndAtTheBottomHeaderLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="header" />,
  play: checkNavEnd('header'),
};

/**
 * The trigger switches the column at a wide width, in both layouts, with the keyboard: the sidebar is
 * 264px, then 68px, then 264px again; the button is the same element and keeps the focus, and its
 * name and `aria-expanded` follow. At the rail the mark of the brand is in the middle of the column
 * (S1), or the brand cell and what follows it have not moved (S2: "the logo and the search stay
 * put"). Skipped without trusted input.
 */
function checkRail(layout: 'sidebar' | 'header') {
  return async () => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      const root = part('.flg-app-shell');
      const button = trigger();
      const mark = () =>
        part(
          layout === 'sidebar'
            ? '.flg-app-shell-sidebar-head .demo-mark'
            : '.flg-app-shell-header-brand .demo-mark',
        );
      const searchLeft = () => rectOf(part('.demo-search')).left;
      const before = { search: searchLeft(), mark: rectOf(mark()).left };
      const press = async (expected: 'rail' | 'expanded') => {
        await real.keyboard('{Enter}');
        await waitFor(() => expect(root.hasAttribute('data-collapsed')).toBe(expected === 'rail'));
        await afterLayout();
      };
      button.focus();
      await expect(button).toHaveAccessibleName('Collapse sidebar');
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      near(rect('.flg-app-shell-sidebar-panel').width, SIDEBAR_WIDE);
      near(rect('.flg-app-shell-main').left, SIDEBAR_WIDE);

      await press('rail');
      near(rect('.flg-app-shell-sidebar-panel').width, RAIL);
      near(rect('.flg-app-shell-main').left, RAIL);
      near(rect('.flg-app-shell-main').right, clientWidth());
      near(rect('.flg-app-shell-header').left, layout === 'sidebar' ? RAIL : 0);
      // The same button, with the focus still on it, now offering the way back.
      await expect(trigger()).toBe(button);
      await expect(button).toHaveFocus();
      await expect(button).toHaveAccessibleName('Expand sidebar');
      await expect(button).toHaveAttribute('aria-expanded', 'false');
      if (layout === 'sidebar') {
        // The mark is in the middle of the column; the name has gone out of sight, not out of the page.
        const panel = rect('.flg-app-shell-sidebar-panel');
        const box = rectOf(mark());
        // The panel has a 1px edge on the right, so its content is 67px wide.
        near(box.left + box.width / 2, (panel.left + panel.right - 1) / 2);
        await expect(
          rectOf(part('.flg-app-shell-sidebar-head .flg-app-shell-brand-name')).width,
        ).toBeLessThanOrEqual(1);
        await expect(
          part('.flg-app-shell-sidebar-head a.flg-app-shell-brand').textContent,
        ).toContain('Lumen');
      } else {
        near(searchLeft(), before.search);
        near(rectOf(mark()).left, before.mark);
      }

      await press('expanded');
      near(rect('.flg-app-shell-sidebar-panel').width, SIDEBAR_WIDE);
      near(rect('.flg-app-shell-main').left, SIDEBAR_WIDE);
      await expect(trigger()).toBe(button);
      await expect(button).toHaveFocus();
      await expect(button).toHaveAccessibleName('Collapse sidebar');
      near(searchLeft(), before.search);
    });
  };
}

export const TriggerFoldsTheSidebarSidebarLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="sidebar" rows={6} />,
  play: checkRail('sidebar'),
};
export const TriggerFoldsTheSidebarHeaderLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="header" rows={6} />,
  play: checkRail('header'),
};

/**
 * With `collapsible={false}` there is no rail, so on a wide screen the button is not shown and the
 * brand cell of S2 is as wide as the button and the cell together: what follows it starts where it
 * does with the button (16 + 34 + 8 + 226 + 8 + 4 = 16 + 268 + 8 + 4 = 296). On a narrow screen the
 * button is back, for it opens the sheet, and the brand stands 8px from it.
 */
function checkNotCollapsible(layout: 'sidebar' | 'header') {
  return async () => {
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      await expect(getComputedStyle(trigger()).display).toBe('none');
      near(rect('.flg-app-shell-sidebar-panel').width, SIDEBAR_WIDE);
      if (layout === 'header') {
        near(rect('.flg-app-shell-header-brand').width, 268);
        near(rectOf(part('.demo-search')).left, 296);
      }
      await viewport.set(390);
      await expect(getComputedStyle(trigger()).display).not.toBe('none');
      near(rectOf(trigger()).width, 34);
      await expect(trigger()).toHaveAccessibleName('Open navigation');
      // 10px of padding, the button, the gap of 4px and 4px more: at 52px, where the sheet puts its
      // own brand (S2).
      near(rect('.flg-app-shell-header-brand').left, 52);
    });
  };
}

export const NotCollapsibleSidebarLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="sidebar" collapsible={false} />,
  play: checkNotCollapsible('sidebar'),
};
export const NotCollapsibleHeaderLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="header" collapsible={false} />,
  play: checkNotCollapsible('header'),
};

/**
 * With the trigger, S2's brand cell is 226px and what follows it starts at 296px, the edge of the
 * content of main; and the narrow header is 56px tall with the brand at 52px.
 */
export const TriggerKeepsTheHeaderInPlace: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="header" />,
  play: async () => {
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      near(rect('.flg-app-shell-header-brand').width, 226);
      near(rectOf(part('.demo-search')).left, 296);
      near(rectOf(trigger()).left, 16);
      near(rectOf(trigger()).width, 34);
      near(rect('.flg-app-shell-main').left + 32, 296);
      await viewport.set(390);
      near(rectOf(trigger()).left, 10);
      near(rect('.flg-app-shell-header-brand').left, 52);
      near(rect('.flg-app-shell-header').height, 56);
    });
  },
};

/**
 * The name of the trigger follows the window across the breakpoint, on a mounted shell and not only
 * on a fresh one (spec §3.5): wide, it folds the sidebar; narrow, it opens the navigation.
 */
export const TriggerNameFollowsTheWindow: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="sidebar" />,
  play: async () => {
    await withViewport(async (viewport) => {
      for (const [width, name, expanded] of [
        [1280, 'Collapse sidebar', 'true'],
        [390, 'Open navigation', 'false'],
        [1024, 'Collapse sidebar', 'true'],
        [1023, 'Open navigation', 'false'],
      ] as const) {
        await viewport.set(width);
        await waitFor(() => expect(trigger()).toHaveAccessibleName(name));
        await expect(trigger()).toHaveAttribute('aria-expanded', expanded);
        await expect(trigger()).toHaveAttribute('aria-controls', part('.flg-app-shell-sidebar').id);
      }
    });
  },
};

// ---------------------------------------------------------------------------------------------------
// The sidebar as a sheet on a narrow screen (spec §3.4, §4.3).

const PHONE = { width: 390, height: 844 };
const root = () => part('.flg-app-shell');
const cell = () => part('.flg-app-shell-sidebar');
const scrim = () => part('.flg-app-shell-scrim');
const isOpen = () => root().hasAttribute('data-open');
const at = (x: number, y: number) => document.elementFromPoint(x, y);
const SHUT_OUT = [
  '.flg-app-shell-skip',
  '.flg-app-shell-header',
  '.flg-app-shell-main',
  '.flg-app-shell-footer',
];

/** Opens the sheet with the trigger, by a click the browser trusts, and waits until it has slid in. */
async function openSheet(real: RealUserEvent) {
  await real.click(trigger());
  await waitFor(() => expect(cell()).toHaveAttribute('role', 'dialog'));
  await settled(cell());
}

/** Waits until the sheet is gone: the root is no longer open and the page is free again. */
async function expectClosed() {
  await waitFor(() => expect(isOpen()).toBe(false));
  await expect(document.querySelector('.flg-app-shell-scrim')).toBeNull();
  await expect(cell()).not.toHaveAttribute('role');
  for (const selector of SHUT_OUT) await expect(part(selector).inert).toBe(false);
  await expect(getComputedStyle(document.documentElement).overflow).not.toBe('hidden');
}

/**
 * The sheet as the mockup draws it, and what it shuts out: 300px wide (the screen less 48px when that
 * is less), from the top to the bottom of the screen, above the scrim, which is above the header; a
 * dialog with a name and no `aria-modal`; the rest of the frame is inert, so a pointer press at the
 * header goes to the scrim and Tab never leaves the sidebar; focus goes in; the page does not scroll.
 */
function checkSheet(layout: 'sidebar' | 'header') {
  return async () => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(PHONE.width, PHONE.height);
      // Closed: out of the layout, and no dialog.
      await expect(getComputedStyle(cell()).display).toBe('none');
      await expect(cell()).not.toHaveAttribute('role');
      await expect(document.querySelector('.flg-app-shell-scrim')).toBeNull();

      await openSheet(real);
      const box = cell().getBoundingClientRect();
      await expect(getComputedStyle(cell()).position).toBe('fixed');
      near(box.left, 0);
      near(box.top, 0);
      near(box.width, 300);
      near(box.height, window.innerHeight);
      await expect(cell()).toHaveAttribute('aria-label', 'Navigation');
      await expect(cell()).not.toHaveAttribute('aria-modal');
      // The head is 56px, with the brand and the button that closes the sheet.
      const head = part('.flg-app-shell-sidebar-head');
      near(head.getBoundingClientRect().height, 56);
      const closeButton = part('.flg-app-shell-sidebar-close');
      await expect(closeButton).toHaveAccessibleName('Close navigation');
      near(closeButton.getBoundingClientRect().width, 34);
      const brand = part('.flg-app-shell-sidebar-head .flg-app-shell-brand');
      if (layout === 'sidebar') {
        // S1: the brand stands at 18px, the button at the end of the head.
        near(brand.getBoundingClientRect().left, 18);
        near(closeButton.getBoundingClientRect().right, 300 - 10 - 1);
      } else {
        // S2: the button where the trigger is, the brand where the header's brand is.
        near(closeButton.getBoundingClientRect().left, 10);
        near(brand.getBoundingClientRect().left, 52);
      }
      // The glass is round where the page shows past it.
      const panel = part('.flg-app-shell-sidebar-panel');
      await expect(getComputedStyle(panel).borderTopRightRadius).not.toBe('0px');
      await expect(getComputedStyle(panel).borderTopLeftRadius).toBe('0px');

      // The scrim covers the screen, under the sheet and over the header.
      const veil = scrim().getBoundingClientRect();
      near(veil.width, PHONE.width);
      near(veil.height, window.innerHeight);
      await expect(at(350, 400)).toBe(scrim());
      await expect(at(350, 28)).toBe(scrim());
      await expect(cell().contains(at(150, 300))).toBe(true);

      // The rest of the frame is inert, in the engine's own reckoning.
      for (const selector of SHUT_OUT) await expect(part(selector).inert).toBe(true);
      await expect(cell().inert).toBe(false);

      // Focus went in: the first thing in the sidebar.
      const first = cell().querySelector<HTMLElement>('a[href], button')!;
      await expect(first).toHaveFocus();

      // Tab, and Shift+Tab, stay in the sidebar, or leave the page; never reach what is inert.
      const seen = new Set<Element>();
      const stays = async () => {
        const active = document.activeElement;
        await expect(active === document.body || cell().contains(active)).toBe(true);
        if (active && active !== document.body) seen.add(active);
      };
      for (let press = 0; press < 14; press += 1) {
        await real.keyboard('{Tab}');
        await stays();
      }
      for (let press = 0; press < 14; press += 1) {
        await real.keyboard('{Shift>}{Tab}{/Shift}');
        await stays();
      }
      await expect(seen.size).toBeGreaterThan(2);
    });
  };
}

export const SheetSidebarLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="sidebar" rows={20} />,
  play: checkSheet('sidebar'),
};
export const SheetHeaderLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="header" rows={20} />,
  play: checkSheet('header'),
};

/** A narrow screen has no room for 300px and a strip of the scrim: the sheet is the screen less 48px. */
export const SheetOnTheNarrowestPhone: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="sidebar" />,
  play: async () => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(320, PHONE.height);
      await openSheet(real);
      near(cell().getBoundingClientRect().width, 320 - 48);
      await expect(at(310, 400)).toBe(scrim());
    });
  },
};

/**
 * Esc, a press on the scrim and the button each close the sheet and give the focus back to the
 * trigger that opened it; the page does not scroll while the sheet is open (PageDown pressed in it
 * moves nothing, and does move the page once it is closed); a drag that starts on the text of the
 * sidebar and ends on the scrim closes nothing.
 */
function checkSheetCloses() {
  return async () => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(PHONE.width, PHONE.height);
      const pageScrolls = () => document.documentElement.scrollHeight > window.innerHeight;
      await expect(pageScrolls()).toBe(true);

      const ways: Array<[string, () => Promise<void>]> = [
        ['Esc', () => real.keyboard('{Escape}')],
        [
          'the scrim',
          () => real.click(scrim(), { position: { x: 350, y: 400 } } as Record<string, unknown>),
        ],
        ['the button', () => real.click(part('.flg-app-shell-sidebar-close'))],
      ];
      for (const [name, close] of ways) {
        await openSheet(real);
        await expect(getComputedStyle(document.documentElement).overflow, name).toBe('hidden');
        await close();
        await expectClosed();
        await waitFor(() => expect(trigger(), name).toHaveFocus());
      }

      // A page that is locked does not scroll; one that is not does (so the first proves something).
      await openSheet(real);
      await real.keyboard('{PageDown}');
      // A key scrolls smoothly, so give it the time it would take before saying nothing moved.
      await new Promise((resolve) => setTimeout(resolve, 400));
      await expect(window.scrollY).toBe(0);
      await real.keyboard('{Escape}');
      await expectClosed();
      await real.keyboard('{PageDown}');
      await waitFor(() => expect(window.scrollY).toBeGreaterThan(0));
      window.scrollTo(0, 0);
      await afterLayout();

      // A selection that begins in the sidebar and ends on the scrim is not a press on the scrim.
      await openSheet(real);
      const text = part('.flg-app-shell-sidebar .demo-section');
      await real.dragAndDrop(text, scrim(), {
        targetPosition: { x: 350, y: 400 },
      } as Record<string, unknown>);
      await afterLayout();
      await expect(isOpen()).toBe(true);
      await expect(cell()).toHaveAttribute('role', 'dialog');
      await real.keyboard('{Escape}');
      await expectClosed();
    });
  };
}

export const SheetClosesSidebarLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="sidebar" rows={20} />,
  play: checkSheetCloses(),
};
export const SheetClosesHeaderLayout: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="header" rows={20} />,
  play: checkSheetCloses(),
};

/**
 * A window that grows wide closes an open sheet (`onOpenChange(false)`): the scrim, the dialog and
 * the lock are gone, the frame is in the grid again, and the trigger folds the sidebar. A parent that
 * owns `open` and keeps it true at that size has the ordinary wide frame, and the sheet is back when
 * the window narrows.
 */
export const SheetFollowsTheWindow: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="sidebar" />,
  play: async () => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(PHONE.width, PHONE.height);
      await openSheet(real);
      await viewport.set(WIDE.width, WIDE.height);
      await expectClosed();
      await waitFor(() => expect(trigger()).toHaveAccessibleName('Collapse sidebar'));
      near(cell().getBoundingClientRect().width, SIDEBAR_WIDE);
      await expect(getComputedStyle(part('.flg-app-shell-sidebar-panel')).position).toBe('sticky');
      // Narrow again: closed, as it was left.
      await viewport.set(PHONE.width, PHONE.height);
      await expect(isOpen()).toBe(false);
      await expect(getComputedStyle(cell()).display).toBe('none');
    });
  },
};

/** A parent that keeps `open` true. */
function KeepsOpen() {
  return <DemoPage layout="sidebar" open onOpenChange={() => {}} />;
}

export const ControlledSheetAtWide: Story = {
  tags: ['no-visual'],
  render: () => <KeepsOpen />,
  play: async () => {
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      // Open, and nothing of it: the ordinary wide frame.
      await expect(isOpen()).toBe(true);
      await expect(document.querySelector('.flg-app-shell-scrim')).toBeNull();
      await expect(cell()).not.toHaveAttribute('role');
      for (const selector of SHUT_OUT) await expect(part(selector).inert).toBe(false);
      await expect(getComputedStyle(document.documentElement).overflow).not.toBe('hidden');
      near(cell().getBoundingClientRect().width, SIDEBAR_WIDE);
      await expect(getComputedStyle(cell()).position).not.toBe('fixed');
      await expect(at(600, 300)).not.toBe(null);
      // Narrow: the sheet is there, since the parent still says open.
      await viewport.set(PHONE.width, PHONE.height);
      await waitFor(() => expect(cell()).toHaveAttribute('role', 'dialog'));
      await settled(cell());
      await expect(getComputedStyle(cell()).position).toBe('fixed');
      await expect(part('.flg-app-shell-scrim')).toBeVisible();
      for (const selector of SHUT_OUT) await expect(part(selector).inert).toBe(true);
    });
  },
};

// ---------------------------------------------------------------------------------------------------
// Focus when the sheet closes (spec §3.4). The shell moves it while React commits, and React then
// focuses the element that had it before the commit again if it is still in the document: in a real
// engine that element is in a sidebar that is `display: none` by then, and cannot take it. jsdom has
// no `display`, so where the focus ends is proven here.

const firstLink = () => part<HTMLAnchorElement>('.flg-app-shell-sidebar .demo-nav a');

/** The elements that take the focus from now on, until the returned function is called. */
function watchFocus() {
  const focused: Element[] = [];
  const record = (event: FocusEvent) => focused.push(event.target as Element);
  document.addEventListener('focusin', record);
  return () => {
    document.removeEventListener('focusin', record);
    return focused;
  };
}

// The event a story sends to the parent that owns `open`, as a router would on a change of page.
const CLOSE = 'demo-close-navigation';

/** A parent that owns `open` and closes the sheet itself, not through the shell. */
function ClosesItself() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener(CLOSE, close);
    return () => window.removeEventListener(CLOSE, close);
  }, []);
  return <DemoPage layout="sidebar" open={open} onOpenChange={setOpen} />;
}

/**
 * A parent closes the sheet by its own state, with the focus on a link of the sidebar: the focus goes
 * back to the trigger, as it does for Esc, the scrim and the close button. Skipped without trusted
 * input.
 */
export const FocusReturnsWhenTheParentCloses: Story = {
  tags: ['no-visual'],
  render: () => <ClosesItself />,
  play: async () => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(PHONE.width, PHONE.height);
      await openSheet(real);
      firstLink().focus();
      await expect(firstLink()).toHaveFocus();
      window.dispatchEvent(new Event(CLOSE));
      await expectClosed();
      await waitFor(() => expect(trigger()).toHaveFocus());
    });
  },
};

/**
 * The window grows wide with the focus on the close button, which goes with the sheet: the focus goes
 * to the trigger and not to the body. Skipped without trusted input.
 */
export const FocusLeavesTheCloseButtonWhenWide: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="header" />,
  play: async () => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(PHONE.width, PHONE.height);
      await openSheet(real);
      await expect(part('.flg-app-shell-sidebar-close')).toHaveFocus();
      await viewport.set(WIDE.width, WIDE.height);
      await expectClosed();
      await waitFor(() => expect(trigger()).toHaveFocus());
      await expect(trigger()).toHaveAccessibleName('Collapse sidebar');
    });
  },
};

/**
 * The window grows wide with the focus on a link of the sidebar, which is a column of the grid again:
 * the focus stays on the link, and nothing else takes it on the way. Skipped without trusted input.
 */
export const FocusStaysOnALinkWhenWide: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="sidebar" />,
  play: async () => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(PHONE.width, PHONE.height);
      await openSheet(real);
      firstLink().focus();
      const stop = watchFocus();
      await viewport.set(WIDE.width, WIDE.height);
      await expectClosed();
      await expect(firstLink()).toHaveFocus();
      await expect(stop()).toEqual([]);
    });
  },
};

/**
 * A parent that keeps `open` refuses an Esc, then the window grows wide: the Esc left nothing behind,
 * so the focus on a link of the sidebar is not moved, not even for a moment. Skipped without trusted
 * input.
 */
export const FocusStaysAfterARefusedEsc: Story = {
  tags: ['no-visual'],
  render: () => <KeepsOpen />,
  play: async () => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(PHONE.width, PHONE.height);
      await waitFor(() => expect(cell()).toHaveAttribute('role', 'dialog'));
      await settled(cell());
      firstLink().focus();
      await real.keyboard('{Escape}');
      await afterLayout();
      await expect(cell()).toHaveAttribute('role', 'dialog');
      await expect(firstLink()).toHaveFocus();
      const stop = watchFocus();
      await viewport.set(WIDE.width, WIDE.height);
      await waitFor(() => expect(cell()).not.toHaveAttribute('role'));
      await expect(firstLink()).toHaveFocus();
      await expect(stop()).toEqual([]);
    });
  },
};

/**
 * Toasts are over the sheet, and in reach: the Toaster stands outside the shell, so it is neither
 * covered nor inert while the sheet is open. The toast is in the top layer, it is the thing under
 * the pointer at its own centre, a press on its button works, and it is in the accessibility tree.
 */
export const ToastsOverTheSheet: Story = {
  tags: ['no-visual'],
  beforeEach: () => {
    toast.dismiss();
    return () => toast.dismiss();
  },
  render: () => (
    <>
      <DemoPage layout="sidebar" />
      <Toaster />
    </>
  ),
  play: async () => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(PHONE.width, PHONE.height);
      await openSheet(real);
      toast.success({ id: 'saved', title: 'Changes saved', duration: Infinity });
      const item = await waitFor(() => {
        const found = document.querySelector<HTMLElement>('.flg-toast');
        if (!found) throw new Error('no toast yet');
        return found;
      });
      await settled(item);
      const toaster = part('.flg-toaster');
      await expect(toaster.matches(':popover-open')).toBe(true);
      await expect(item).toBeVisible();
      // Not inert, not hidden, and not inside the frame that went inert.
      await expect(item.closest('[inert]')).toBeNull();
      await expect(item.closest('[aria-hidden="true"]')).toBeNull();
      await expect(item.closest('.flg-app-shell')).toBeNull();
      // In the accessibility tree: named, and in a live region.
      await expect(item).toHaveTextContent('Changes saved');
      await expect(part('.flg-toaster-list')).toHaveAttribute('aria-live', 'polite');
      // Over the sheet: the thing under the pointer at its centre is the toast.
      const box = item.getBoundingClientRect();
      await expect(item.contains(at(box.left + box.width / 2, box.top + box.height / 2))).toBe(
        true,
      );
      // And a press on its button works, with the sheet still open behind it.
      await real.click(part('.flg-toast-close'));
      await waitFor(() => expect(document.querySelector('.flg-toast')).toBeNull());
      await expect(isOpen()).toBe(true);
      await real.keyboard('{Escape}');
      await expectClosed();
    });
  },
};

// ---------------------------------------------------------------------------------------------------
// What the page puts in main, against the layers of the frame (spec §3.4).

// A colour no glass, scrim or text of the theme paints: a pixel of exactly it is the box itself.
const BOX: Rgb = [0, 200, 0];
const isBox = (pixel: Rgb) => pixel.every((value, index) => Math.abs(value - BOX[index]!) <= 24);

/** A box of the page's own above every layer of the frame, as a map pane or a carousel arrow is. */
function RaisedBox() {
  return (
    <div
      data-raised-box=""
      style={{
        position: 'relative',
        zIndex: 10,
        height: 240,
        background: `rgb(${BOX.join(', ')})`,
      }}
    />
  );
}

/**
 * Main is a stacking context, so what is in it stays under the header, the scrim and the sheet,
 * whatever its own `z-index`: scrolled under the header, the box is not what is at the header's
 * place, on a wide screen and on a narrow one; with the sheet open, the sheet is painted over it.
 * Hit testing cannot show the second, as main is inert then and is skipped, so the pixels of the
 * sheet are read.
 */
export const MainStaysUnderTheFrame: Story = {
  tags: ['no-visual'],
  render: () => (
    <DemoPage layout="sidebar">
      <RaisedBox />
      <DemoRows count={12} />
    </DemoPage>
  ),
  play: async () => {
    await withViewport(async (viewport) => {
      const box = part('[data-raised-box]');
      const header = part('.flg-app-shell-header');
      for (const width of [WIDE.width, PHONE.width]) {
        await viewport.set(width, width === WIDE.width ? WIDE.height : PHONE.height);
        await scrollTo(box.getBoundingClientRect().top + window.scrollY - 10);
        const place = header.getBoundingClientRect();
        const middle = place.top + place.height / 2;
        // The box is under the middle of the header, so either of them can be what is found there.
        await expect(box.getBoundingClientRect().top).toBeLessThan(middle);
        await expect(box.getBoundingClientRect().bottom).toBeGreaterThan(middle);
        const found = at(place.left + place.width / 2, middle);
        await expect(header.contains(found), `${width}px: the header is on top`).toBe(true);
      }
      // The box in the middle of the screen, the sheet open over it. The click is a script's: a
      // trusted one scrolls the page first, to where the sticky trigger would be without sticking.
      await scrollTo(box.getBoundingClientRect().top + window.scrollY - 300);
      trigger().click();
      await waitFor(() => expect(cell()).toHaveAttribute('role', 'dialog'));
      await settled(cell());
      const sheet = cell().getBoundingClientRect();
      const under = box.getBoundingClientRect();
      await expect(under.top).toBeGreaterThan(sheet.top);
      await expect(under.bottom).toBeLessThan(sheet.bottom);
      const points = [40, 150, 260].map((x) => [x, under.top + under.height / 2] as const);
      const pixels = await paintedPixels(cell(), points);
      if (pixels) {
        for (const pixel of pixels) {
          await expect(isBox(pixel), `the sheet is painted over the box: ${pixel}`).toBe(false);
        }
      }
      part('.flg-app-shell-sidebar-close').click();
      await expectClosed();
      await scrollTo(0);
    });
  },
};

/** The stripes behind the glass: four pixels black, four white, from the left edge of the shell. */
const STRIPES = 'repeating-linear-gradient(90deg, #000 0 4px, #fff 4px 8px)';

/** How far apart two pixels are, in the channel where they differ most. */
const spread = (a: Rgb, b: Rgb) =>
  Math.max(...a.map((value, index) => Math.abs(value - b[index]!)));

/** The centre of a black stripe at or after `x`, in the coordinates of the page; white is 4px on. */
const blackStripe = (x: number) => Math.ceil((x - 2) / 8) * 8 + 2;

// What makes an element the backdrop root of the glass inside it (Filter Effects 2): such a main
// would let a card in it blur only what main paints, and not the page. A stacking context is not one.
const BACKDROP_ROOT_FREE: Array<[string, string]> = [
  ['filter', 'none'],
  ['opacity', '1'],
  ['mix-blend-mode', 'normal'],
  ['clip-path', 'none'],
  ['mask-image', 'none'],
  ['backdrop-filter', 'none'],
  ['will-change', 'auto'],
];

/**
 * A glass card in main still blurs the page behind it, though main is a stacking context. Main is
 * checked by its computed style: `isolation: isolate` and nothing that makes a backdrop root. And the
 * pixels are read where the engine paints a backdrop blur at all: the shell is drawn on black and
 * white stripes, and in the glass of the header, which is outside main, a black and a white stripe
 * come out the same; then they must in the card too, where in the gap beside it they are far apart.
 * Firefox and WebKit as Vitest runs them on Windows paint no backdrop blur even for a lone element,
 * so there the computed check is the one that holds.
 */
export const GlassInMainBlursThePage: Story = {
  tags: ['no-visual'],
  render: () => <DemoPage layout="sidebar" style={{ background: STRIPES }} />,
  play: async () => {
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      const main = getComputedStyle(part('.flg-app-shell-main'));
      await expect(main.isolation, 'main is a stacking context').toBe('isolate');
      for (const [property, value] of BACKDROP_ROOT_FREE) {
        await expect(main.getPropertyValue(property), property).toBe(value);
      }
      const cards = part('.demo-cards');
      const card = cards.firstElementChild!;
      const glass = getComputedStyle(card);
      await expect(
        glass.getPropertyValue('backdrop-filter') ||
          glass.getPropertyValue('-webkit-backdrop-filter'),
      ).toMatch(/blur/);

      // The control: the glass of the header, over the stripes, in its padding above the controls.
      const header = part('.flg-app-shell-header');
      const bar = rectOf(header);
      const inBar = blackStripe(bar.left + bar.width / 2) - bar.left;
      const control = await paintedPixels(header, [
        [inBar, 4],
        [inBar + 4, 4],
      ]);
      if (!control || spread(control[0]!, control[1]!) >= 24) return;

      const [first, second] = Array.from(cards.children).map((child) => rectOf(child));
      const frame = rectOf(cards);
      // In the padding of the card, above its text, and in the gap between it and the next.
      const y = first!.top + 8 - frame.top;
      const inCard = blackStripe(first!.left + 24) - frame.left;
      const inGap = blackStripe(first!.right + 1) - frame.left;
      await expect(inGap + frame.left + 4).toBeLessThan(second!.left - 1);
      const pixels = await paintedPixels(cards, [
        [inCard, y],
        [inCard + 4, y],
        [inGap, y],
        [inGap + 4, y],
      ]);
      const [cardBlack, cardWhite, gapBlack, gapWhite] = pixels as [Rgb, Rgb, Rgb, Rgb];
      await expect(spread(gapBlack, gapWhite), 'the stripes beside the card').toBeGreaterThan(100);
      await expect(spread(cardBlack, cardWhite), 'the stripes under the card').toBeLessThan(24);
    });
  },
};

/**
 * S1 on a phone with the sheet open (spec §4.3, mockup S1 phone): opened by the trigger in the play
 * function, as a person opens it. The harness shoots a story with this tag at that size; elsewhere
 * (the runner has a wide window, where the trigger folds the sidebar) the story stays closed.
 */
async function openInPlay(canvasElement: HTMLElement) {
  if (window.innerWidth >= APP_SHELL_BREAKPOINTS.lg) return;
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open navigation' }));
  await waitFor(() => expect(cell()).toHaveAttribute('role', 'dialog'));
  await settled(cell());
  // The focus ring that goes to the first thing is not part of the mockup's drawing.
  (document.activeElement as HTMLElement | null)?.blur();
}

export const SidebarPhoneOpen: Story = {
  tags: ['viewport-390x844'],
  render: () => <DemoPage layout="sidebar" />,
  play: ({ canvasElement }) => openInPlay(canvasElement),
};

export const HeaderPhoneOpen: Story = {
  tags: ['viewport-390x844'],
  render: () => <DemoPage layout="header" />,
  play: ({ canvasElement }) => openInPlay(canvasElement),
};
