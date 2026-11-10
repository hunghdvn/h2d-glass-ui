import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { DemoPage } from '../../../.storybook/app-shell-demo';
import { realUserEvent } from '../../../.storybook/real-input';
import { afterLayout, withViewport } from '../../../.storybook/viewport';
import { AppShell } from './AppShell';

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
