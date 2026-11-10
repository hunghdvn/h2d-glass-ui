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
