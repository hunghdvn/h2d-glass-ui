import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { paintedPixels } from '../../../.storybook/painted-pixel';
import { realUserEvent } from '../../../.storybook/real-input';
import { afterLayout, withViewport } from '../../../.storybook/viewport';
import { strokeIcon } from '../../internal/icons';
import { AppShell, AppShellHeader, AppShellMain, AppShellSidebar } from '../app-shell/AppShell';
import { Surface } from '../surface/Surface';
import { Nav, NavGroup, NavItem, NavSection } from './Nav';
import type { NavVariant } from './Nav';

const meta = {
  title: 'Components/Nav',
  component: Nav,
  // The stories hand each Nav its items, so the controls have nothing to drive.
  args: { children: null },
} satisfies Meta<typeof Nav>;

export default meta;
type Story = StoryObj<typeof meta>;

// The icons of the application "Lumen" of the mockup. They are the user's, not the library's (spec
// phase 5 §4.6): the paths are those of the mockup page.
const Icon = ({ children }: { children: ReactNode }) => <svg {...strokeIcon}>{children}</svg>;
const ICONS = {
  home: (
    <Icon>
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </Icon>
  ),
  inbox: (
    <Icon>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </Icon>
  ),
  calendar: (
    <Icon>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Icon>
  ),
  folder: (
    <Icon>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </Icon>
  ),
  archive: (
    <Icon>
      <rect x="2" y="3" width="20" height="5" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </Icon>
  ),
  users: (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  ),
  chart: (
    <Icon>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </Icon>
  ),
  gear: (
    <Icon>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  ),
};

/**
 * The navigation of the mockup (phase-5-nav), item for item. The page of the app is the top-level
 * "Overview" and, to compare on one picture as the mockup does, the child "Design system" too: in an
 * application only one item is current. "Members" is the item the harness hovers
 * (`data-visual-hover`).
 */
function Menu({ variant }: { variant: NavVariant }) {
  return (
    <Nav variant={variant} aria-label="Main">
      <NavItem href="#overview" icon={ICONS.home} active>
        Overview
      </NavItem>
      <NavItem href="#inbox" icon={ICONS.inbox} badge={12}>
        Inbox
      </NavItem>
      <NavItem href="#calendar" icon={ICONS.calendar}>
        Calendar
      </NavItem>
      <NavSection title="Projects">
        <NavGroup label="Design" icon={ICONS.folder}>
          <NavItem href="#design-system" active>
            Design system
          </NavItem>
          <NavItem href="#mobile">Mobile app</NavItem>
        </NavGroup>
        <NavGroup label="Engineering" icon={ICONS.folder}>
          <NavItem href="#platform">Platform</NavItem>
        </NavGroup>
        <NavItem href="#archive" icon={ICONS.archive} disabled>
          Archive
        </NavItem>
      </NavSection>
      <NavSection title="Team">
        <NavItem href="#members" icon={ICONS.users} data-visual-hover="">
          Members
        </NavItem>
        <NavItem href="#reports" icon={ICONS.chart} badge={3}>
          Reports
        </NavItem>
      </NavSection>
      <NavSection bottom>
        <NavItem href="#settings" icon={ICONS.gear}>
          Settings
        </NavItem>
      </NavSection>
    </Nav>
  );
}

/** The sidebar of the mockup: a 264px pane of glass, tall enough for the item at the foot to be pushed down. */
function Panel({ children }: { children: ReactNode }) {
  return (
    <Surface
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        width: 264,
        minHeight: 600,
      }}
    >
      {children}
    </Surface>
  );
}

/** Tabs to Calendar, so the keyboard ring is drawn on the row the mockup draws it on. */
async function focusCalendar() {
  for (let stop = 0; stop < 3; stop += 1) await userEvent.tab();
}

/**
 * N1 (mockup phase-5-nav, the expanded column of option n1): the current page is a soft pill of the
 * accent; the count of "Inbox" and "Reports" is a neutral Badge; the keyboard ring is on "Calendar", a
 * row is under the pointer ("Members", which the harness hovers), "Design" is open and holds the
 * current page, "Engineering" is closed, "Archive" is disabled, and "Settings" is the item at the foot.
 */
export const Pill: Story = {
  render: () => (
    <Panel>
      <Menu variant="pill" />
    </Panel>
  ),
  play: focusCalendar,
};

/** N2 (option n2): an accent bar on the left edge with a tint that fades out; the count is a bare number. */
export const Bar: Story = {
  render: () => (
    <Panel>
      <Menu variant="bar" />
    </Panel>
  ),
  play: focusCalendar,
};

// The behaviour stories below are about what a screenshot cannot say: they are `no-visual`.

const isShown = (element: Element) => element.getBoundingClientRect().height > 0;

/**
 * A group opens and closes by a click, by Enter and by Space; its links are laid out only while it is
 * open (a hidden list has no box), and the state is on the button and on the item of the list.
 */
export const GroupToggles: Story = {
  tags: ['no-visual'],
  render: () => (
    <Panel>
      <Menu variant="pill" />
    </Panel>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvasElement.querySelector<HTMLElement>('.flg-nav-group:not([data-open])')!;
    const button = within(group).getByRole('button', { name: 'Engineering' });
    const link = () => group.querySelector<HTMLElement>('.flg-nav-sub a')!;
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(isShown(link())).toBe(false);
    // The group that holds the current page is open from the start.
    await expect(canvas.getByRole('button', { name: 'Design' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(isShown(canvas.getByRole('link', { name: 'Design system' }))).toBe(true);

    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(group).toHaveAttribute('data-open');
    await expect(isShown(link())).toBe(true);
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(isShown(link())).toBe(false);

    for (const key of ['{Enter}', ' ']) {
      button.focus();
      await userEvent.keyboard(key);
      await expect(button, `${JSON.stringify(key)} opens it`).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      await expect(isShown(link())).toBe(true);
      await userEvent.keyboard(key);
      await expect(button, `${JSON.stringify(key)} closes it`).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      await expect(isShown(link())).toBe(false);
    }
  },
};

/**
 * Tab goes through the links and the buttons of the groups in the order they are drawn: a disabled
 * item is skipped, and the links of a closed group are not reached until it is open.
 */
export const TabOrder: Story = {
  tags: ['no-visual'],
  render: () => (
    <Panel>
      <Menu variant="bar" />
    </Panel>
  ),
  play: async ({ canvasElement }) => {
    const names = async () => {
      const seen: string[] = [];
      for (let stop = 0; stop < 12; stop += 1) {
        await userEvent.tab();
        const active = document.activeElement as HTMLElement;
        if (!canvasElement.contains(active)) break;
        seen.push(active.textContent ?? '');
      }
      return seen;
    };
    await expect(await names()).toEqual([
      'Overview',
      'Inbox12',
      'Calendar',
      'Design',
      'Design system',
      'Mobile app',
      'Engineering',
      'Members',
      'Reports3',
      'Settings',
    ]);
  },
};

/** The count is part of the name of the link, as the engine reads it: "Inbox 12". */
export const Names: Story = {
  tags: ['no-visual'],
  render: () => (
    <Panel>
      <Menu variant="pill" />
    </Panel>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ['Inbox 12', 'Reports 3', 'Overview', 'Archive']) {
      await expect(canvas.getByRole('link', { name })).toBeInTheDocument();
    }
    await expect(canvas.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // The group of links is named by the button, and the section by its title.
    await expect(canvas.getByRole('list', { name: 'Design' })).toBeInTheDocument();
    await expect(canvas.getByRole('group', { name: 'Projects' })).toBeInTheDocument();
  },
};

const WIDE = { width: 1280, height: 720 };

/** A sidebar of a whole shell, so the ring is drawn where the body of the sidebar scrolls and clips. */
function InAShell({ variant, narrow = false }: { variant: NavVariant; narrow?: boolean }) {
  return (
    <AppShell>
      <AppShellHeader>Lumen</AppShellHeader>
      <AppShellSidebar>
        <Nav variant={variant} aria-label="Main">
          <NavItem href="#overview" icon={ICONS.home} active>
            Overview
          </NavItem>
          <NavItem href="#inbox" icon={ICONS.inbox} badge={12}>
            Inbox
          </NavItem>
          <NavItem href="#calendar" icon={ICONS.calendar}>
            Calendar
          </NavItem>
          <NavSection bottom>
            <NavItem href="#settings" icon={ICONS.gear}>
              Settings
            </NavItem>
          </NavSection>
        </Nav>
      </AppShellSidebar>
      <AppShellMain>{narrow ? 'Narrow' : 'Main'}</AppShellMain>
    </AppShell>
  );
}

/**
 * How far a channel must move for a ring to be seen. By default the ring is a translucent shadow
 * around the row (the outline is transparent), a few levels over the glass; with more contrast and in
 * forced colours it is a 2px outline of a solid colour.
 */
const SHADOW_SHOWN = 4;
const OUTLINE_SHOWN = 60;
const ACROSS = [0.5, 1.5, 2.5] as const;

/**
 * The ring of a row at the edge of the sidebar. By default it is drawn outside the row, and the body
 * of the sidebar, which scrolls, must not clip it above the first row, under the last and to the
 * right; the row of `bar` runs to the left edge of the glass, where the ring is beyond the screen.
 * With `prefers-contrast: more` and in forced colours, the two modes where the outline is the sign of
 * focus, a row of `bar` draws it inside. Read from the painted pixels (and the offset), as in a `lined`
 * Table. The preferences are emulated through the protocol, which only Chromium has.
 */
export const FocusRings: Story = {
  tags: ['no-visual'],
  parameters: { stage: 'page' },
  render: () => <InAShell variant="bar" />,
  play: async ({ canvasElement }) => {
    const { cdp, server } = await import('vitest/browser');
    if (server.browser !== 'chromium') return;
    const real = await realUserEvent();
    if (!real) return;
    const session = cdp();
    const panel = canvasElement.querySelector<HTMLElement>('.flg-app-shell-sidebar-panel')!;
    const nav = panel.querySelector<HTMLElement>('.flg-nav')!;
    const links = () => [...nav.querySelectorAll<HTMLElement>('.flg-nav-item')];
    const pixelsAround = async (
      link: HTMLElement,
      at: (box: DOMRect) => Array<[number, number]>,
    ) => {
      const outer = panel.getBoundingClientRect();
      return (await paintedPixels(
        panel,
        at(link.getBoundingClientRect()).map(([x, y]) => [x - outer.x, y - outer.y] as const),
      ))!;
    };
    const differs = (after: number[][], before: number[][], shown: number) =>
      after.some((pixel, point) =>
        pixel.some((channel, index) => Math.abs(channel - before[point]![index]!) > shown),
      );

    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      await waitFor(() => expect(panel.getBoundingClientRect().width).toBeGreaterThan(200));
      const first = links()[0]!;
      const last = links().at(-1)!;
      // By default: the ring is outside, above the first row and under the last one.
      for (const [name, link, at] of [
        [
          'first row, above',
          first,
          (box: DOMRect): Array<[number, number]> =>
            [2.5, 3, 3.5].map((depth) => [box.x + box.width / 2, box.y - depth]),
        ],
        [
          'last row, under',
          last,
          (box: DOMRect): Array<[number, number]> =>
            [2.5, 3, 3.5].map((depth) => [box.x + box.width / 2, box.bottom + depth]),
        ],
      ] as const) {
        (document.activeElement as HTMLElement | null)?.blur();
        const before = await pixelsAround(link, at);
        link.focus({ focusVisible: true });
        await expect(link, `${name}: it has the focus`).toHaveFocus();
        const after = await pixelsAround(link, at);
        await expect(differs(after, before, SHADOW_SHOWN), `${name}: the ring is not clipped`).toBe(
          true,
        );
        link.blur();
      }

      // More contrast and forced colours: a row of `bar` draws the ring inside.
      for (const feature of [
        { name: 'prefers-contrast', value: 'more' },
        { name: 'forced-colors', value: 'active' },
      ]) {
        await session.send('Emulation.setEmulatedMedia', { features: [feature] });
        try {
          await waitFor(() =>
            expect(matchMedia(`(${feature.name}: ${feature.value})`).matches).toBe(true),
          );
          // The current row is not one of them: its 3px bar is the colour of the ring, at the same edge.
          for (const link of [links()[1]!, last]) {
            const label = `${feature.name}, ${link.textContent}`;
            (document.activeElement as HTMLElement | null)?.blur();
            const inside = (box: DOMRect): Array<[number, number]> =>
              ACROSS.map((depth) => [box.x + depth, box.y + box.height / 2]);
            const before = await pixelsAround(link, inside);
            link.focus({ focusVisible: true });
            await expect(link, `${label}: it has the focus`).toHaveFocus();
            await expect(getComputedStyle(link).outlineOffset, `${label}: drawn inside`).toBe(
              '-2px',
            );
            const after = await pixelsAround(link, inside);
            await expect(
              differs(after, before, OUTLINE_SHOWN),
              `${label}: the ring is painted inside the edge (${JSON.stringify(before)} before, ${JSON.stringify(after)} after)`,
            ).toBe(true);
            link.blur();
          }
        } finally {
          await session.send('Emulation.setEmulatedMedia', { features: [] });
        }
      }
    });
  },
};

/**
 * In forced colours the current item of a `pill` Nav has an outline of its own, drawn inside; with
 * the keyboard focus it keeps the focus, whose ring is outside, in the text colour. Looked up in the
 * computed style, since the colours are the system's.
 */
export const PillCurrentItemKeepsItsFocusRing: Story = {
  tags: ['no-visual'],
  render: () => (
    <Panel>
      <Menu variant="pill" />
    </Panel>
  ),
  play: async ({ canvasElement }) => {
    const { cdp, server } = await import('vitest/browser');
    if (server.browser !== 'chromium') return;
    const real = await realUserEvent();
    if (!real) return;
    const session = cdp();
    const current = within(canvasElement).getByRole('link', { name: 'Overview' });
    const colorOf = (name: string) => {
      const probe = document.createElement('div');
      probe.style.outline = `2px solid ${name}`;
      document.body.append(probe);
      const color = getComputedStyle(probe).outlineColor;
      probe.remove();
      return color;
    };
    await session.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: 'active' }],
    });
    try {
      await waitFor(() => expect(matchMedia('(forced-colors: active)').matches).toBe(true));
      const resting = getComputedStyle(current);
      await expect(resting.outlineOffset).toBe('-2px');
      await expect(resting.outlineColor).toBe(colorOf('Highlight'));
      current.focus({ focusVisible: true });
      await expect(current).toHaveFocus();
      const focused = getComputedStyle(current);
      await expect(focused.outlineOffset).toBe('2px');
      await expect(focused.outlineColor).toBe(colorOf('CanvasText'));
    } finally {
      await session.send('Emulation.setEmulatedMedia', { features: [] });
    }
  },
};

/**
 * On a phone the sidebar is a sheet, and a plain click on a link closes it and puts the focus back on
 * the button that opened it. A click with a modifier key, which opens the link elsewhere, leaves it
 * open. The click does not leave the story: the page, as an application's router would, takes it.
 */
export const ClosesTheSheet: Story = {
  tags: ['no-visual'],
  parameters: { stage: 'page' },
  render: () => <InAShell variant="pill" narrow />,
  play: async ({ canvasElement }) => {
    await withViewport(async (viewport) => {
      await viewport.set(390, 844);
      const canvas = within(canvasElement);
      const trigger = canvas.getByRole('button', { name: 'Open navigation' });
      // The page takes the click after the library's handler has seen it, as a router does.
      const keepHere = (event: Event) => event.preventDefault();
      canvasElement.ownerDocument.addEventListener('click', keepHere);
      try {
        await userEvent.click(trigger);
        const sheet = await canvas.findByRole('dialog', { name: 'Navigation' });
        await expect(canvasElement.querySelector('.flg-app-shell')).toHaveAttribute('data-open');

        // A click with a modifier key is the browser's, to open the link in another tab.
        const inbox = within(sheet).getByRole('link', { name: 'Inbox 12' });
        for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'] as const) {
          inbox.dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true, [modifier]: true }),
          );
          await afterLayout();
          await expect(canvasElement.querySelector('.flg-app-shell'), modifier).toHaveAttribute(
            'data-open',
          );
        }

        inbox.focus();
        await userEvent.click(inbox);
        await waitFor(() =>
          expect(canvasElement.querySelector('.flg-app-shell')).not.toHaveAttribute('data-open'),
        );
        await expect(canvas.queryByRole('dialog')).toBeNull();
        await waitFor(() =>
          expect(canvas.getByRole('button', { name: 'Open navigation' })).toHaveFocus(),
        );
      } finally {
        canvasElement.ownerDocument.removeEventListener('click', keepHere);
      }
    });
  },
};
