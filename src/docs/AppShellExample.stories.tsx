import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { ComponentType } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { DemoContent, DemoStyles, PAGE_RULES } from '../../.storybook/app-shell-demo';
import { App, End, Strip, strips } from '../../.storybook/header-strip';
import { realUserEvent, settled } from '../../.storybook/real-input';
import { withViewport } from '../../.storybook/viewport';
import { CalendarIcon, CheckCircleIcon } from './app-shell-example/icons';
import { ListNotifications, TabbedNotifications } from './app-shell-example/notifications';
import type { NotificationItem, NotificationsProps } from './app-shell-example/notifications';
import { Shell } from './app-shell-example/Shell';

// The page "Examples/App shell": the application of the mockup, whole, and the recipe of its
// notifications panel (B1, a list with rules; B3, tabs). The code is in `app-shell-example/`, and
// `AppShellExample.mdx` shows that very code, so what a reader copies is what the stories run.
const meta = {
  title: 'Examples/App shell',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The notifications of the mockup: two unread, two read, a person and an icon in each pair. */
const SAMPLE: NotificationItem[] = [
  {
    id: 'mention',
    title: 'Hoàng Tùng mentioned you in “Tokens”',
    time: '5 minutes ago',
    href: '#mention',
    unread: true,
    from: 'HT',
  },
  {
    id: 'report',
    title: 'The report for October is ready',
    time: '32 minutes ago',
    href: '#report',
    unread: true,
    icon: <CheckCircleIcon />,
    tone: 'success',
  },
  {
    id: 'task',
    title: 'Lê Phương assigned you “Fix the primary button”',
    time: '2 hours ago',
    href: '#task',
    unread: false,
    from: 'LP',
  },
  {
    id: 'meeting',
    title: 'Design team meeting at 14:00 tomorrow',
    time: 'Yesterday',
    href: '#meeting',
    unread: false,
    icon: <CalendarIcon />,
  },
];

type Recipe = ComponentType<NotificationsProps>;

/**
 * A recipe that keeps its own list: "Mark all as read" changes it, as the application's store would.
 * `open` opens the panel at the start, for the stories that are about the panel.
 */
function Notifications({
  recipe: Panel,
  items: first = SAMPLE,
  open = false,
}: {
  recipe: Recipe;
  items?: NotificationItem[];
  open?: boolean;
}) {
  const [items, setItems] = useState(first);
  return (
    <Panel
      items={items}
      onMarkAllRead={() => setItems((all) => all.map((item) => ({ ...item, unread: false })))}
      popover={open ? { defaultOpen: true } : undefined}
    />
  );
}

// ---------------------------------------------------------------------------------------------------
// The whole application, wide and narrow (S1, N1, H2, T1, U1, B1).

// The stories with a header or a whole application are pages (stage `page`: a sticky header sticks to the
// document); the strips of the bell at rest are not. The two whole applications ask axe for the rules
// about pages (spec phase 5 §7, layer 3); a bell in a header is not a page.
const IN_A_PAGE = { stage: 'page' };
const A_PAGE = { ...IN_A_PAGE, a11y: { config: { rules: PAGE_RULES } } };

const application = (
  <>
    <DemoStyles />
    <Shell notifications={SAMPLE}>
      <DemoContent />
    </Shell>
  </>
);

/** The application of the mockup on a wide screen: S1, N1, H2, T1, U1 and B1 together. */
export const AppShellExample: Story = {
  tags: ['viewport-1280x720'],
  parameters: A_PAGE,
  render: () => application,
};

/** The same application on a phone: the sidebar is a sheet, the search keeps what room is left. */
export const AppShellExamplePhone: Story = {
  tags: ['viewport-390x844'],
  parameters: A_PAGE,
  render: () => application,
};

// ---------------------------------------------------------------------------------------------------
// The recipe. The bell at rest sits in a strip; an open panel needs the real header, since the fill that
// a ghost button keeps while its popup is open is a rule of the header of an AppShell.

const BELL_STATES = (recipe: Recipe) => (
  <div style={strips}>
    <Strip caption="At rest, 2 unread" bell={<Notifications recipe={recipe} />} />
    <Strip
      caption="Nothing unread: no count, and the name says so"
      bell={<Notifications recipe={recipe} items={SAMPLE.map((n) => ({ ...n, unread: false }))} />}
    />
  </div>
);

const bellOf = (root: HTMLElement) => within(root).getByRole('button', { name: /^Notifications/ });

// The panel is in the page before it is opened, with nothing in it: the role query skips a popover
// that is closed, so it is found by its class.
const panelOf = (root: HTMLElement) => {
  const panel = root.querySelector<HTMLElement>('.flg-popover');
  if (!panel) throw new Error('The panel is not in the story.');
  return panel;
};
const isOpen = (panel: HTMLElement) => panel.matches(':popover-open');

/**
 * The panel open, as the mockup draws it: it takes the focus when it opens, which draws the ring of the
 * keyboard on "Mark all as read" when nothing was pressed, so the focus is let go once the panel is in
 * place. The panel stays open: only a press outside, or Esc, closes it.
 */
const openPanel: Story['play'] = async ({ canvasElement }) => {
  const panel = panelOf(canvasElement);
  await waitFor(() => expect(isOpen(panel)).toBe(true));
  await settled(panel);
  (document.activeElement as HTMLElement | null)?.blur();
  await expect(isOpen(panel)).toBe(true);
};

/** B1 at rest: a red count on the bell, which is named with the number. */
export const NotificationsList: Story = {
  render: () => BELL_STATES(ListNotifications),
};

/**
 * B1 open, in a real header: the bell keeps the fill of an open button, and the panel hangs 17px under
 * it, lined up with its end. A heading on a rule with "Mark all as read", and flat rows: the two unread
 * ones with a bolder title and a dot.
 */
export const NotificationsListOpen: Story = {
  tags: ['viewport-1280x720'],
  parameters: IN_A_PAGE,
  render: () => <App header={<End bell={<Notifications recipe={ListNotifications} open />} />} />,
  play: openPanel,
};

/** B1 with nothing in it: no count on the bell, and the panel says so, with no button. */
export const NotificationsListEmpty: Story = {
  tags: ['viewport-1280x720'],
  parameters: IN_A_PAGE,
  render: () => (
    <App header={<End bell={<Notifications recipe={ListNotifications} items={[]} open />} />} />
  ),
  play: openPanel,
};

/** B3 at rest: the same bell with an accent count. */
export const NotificationsTabs: Story = {
  render: () => BELL_STATES(TabbedNotifications),
};

/** B3 open: the tabs "All" and "Unread 2" under the heading, over plain rows. */
export const NotificationsTabsOpen: Story = {
  tags: ['viewport-1280x720'],
  parameters: IN_A_PAGE,
  render: () => <App header={<End bell={<Notifications recipe={TabbedNotifications} open />} />} />,
  play: openPanel,
};

/** B3 with nothing in it. */
export const NotificationsTabsEmpty: Story = {
  tags: ['viewport-1280x720'],
  parameters: IN_A_PAGE,
  render: () => (
    <App header={<End bell={<Notifications recipe={TabbedNotifications} items={[]} open />} />} />
  ),
  play: openPanel,
};

// ---------------------------------------------------------------------------------------------------
// Behaviour, in the real engines. Nothing here is a look: a screenshot cannot say it. The tags are
// written on each story, not in a helper: the Storybook indexer reads them without running the file.

const MARK_ALL = { name: 'Mark all as read' };

/** The header with the bell of `recipe` in it, the panel closed (`open`: open from the start). */
const inHeader = (recipe: Recipe, open = false) => (
  <App header={<End bell={<Notifications recipe={recipe} open={open} />} />} />
);

/**
 * A row that is unread says so in more than its colour. Its name starts with "Unread: ", which a screen
 * reader reads, its title is bolder, and its end has a dot, which is hidden from a screen reader since
 * the words are there. A row that was read has none of the three.
 */
const checkUnreadIsMoreThanColour: Story['play'] = async ({ canvasElement }) => {
  const panel = panelOf(canvasElement);
  await waitFor(() => expect(isOpen(panel)).toBe(true));
  // Both tabs keep their rows in the page, and the one that is not selected is hidden.
  const rows = Array.from(panel.querySelectorAll<HTMLElement>('.flg-list-item')).filter((row) =>
    row.checkVisibility(),
  );
  await expect(rows).toHaveLength(4);
  const weights = rows.map(
    (row) => getComputedStyle(row.querySelector('.flg-list-item-title')!).fontWeight,
  );
  const dots = rows.map((row) => row.querySelector('.notif-dot'));
  await expect(rows.map((row) => row.hasAttribute('data-unread'))).toEqual([
    true,
    true,
    false,
    false,
  ]);
  // The bolder title: an unread row is above a read one.
  await expect(Number(weights[0])).toBeGreaterThan(Number(weights[2]));
  await expect(weights[0]).toBe(weights[1]);
  await expect(weights[2]).toBe(weights[3]);
  await expect(dots.map(Boolean)).toEqual([true, true, false, false]);
  for (const dot of dots) if (dot) await expect(dot).toHaveAttribute('aria-hidden', 'true');
  // The words: the name of the link, which is what a screen reader reads.
  const links = within(panel).getAllByRole('link');
  await expect(links).toHaveLength(4);
  await expect(links[0]).toHaveAccessibleName(/^Unread: Hoàng Tùng mentioned you/);
  await expect(links[1]).toHaveAccessibleName(/^Unread: /);
  await expect(links[2]).toHaveAccessibleName(/^Lê Phương assigned you/);
  await expect(links[3]).toHaveAccessibleName(/^Design team meeting/);
};

export const UnreadIsMoreThanColourList: Story = {
  tags: ['no-visual'],
  parameters: IN_A_PAGE,
  render: () => inHeader(ListNotifications, true),
  play: checkUnreadIsMoreThanColour,
};
export const UnreadIsMoreThanColourTabs: Story = {
  tags: ['no-visual'],
  parameters: IN_A_PAGE,
  render: () => inHeader(TabbedNotifications, true),
  play: checkUnreadIsMoreThanColour,
};

/**
 * The name of the bell carries the count, because the number on its corner is hidden from a screen
 * reader; with nothing unread there is no number and the name is only "Notifications". "Mark all as
 * read" changes both, and leaves the focus on the button that was pressed: the button stays where it
 * is, so the focus does not fall to the page. Esc then closes the panel and the focus goes back to the
 * bell. Trusted input: a press on the button, and Esc, need it.
 */
const checkMarkAllAsRead: Story['play'] = async ({ canvasElement }) => {
  const real = await realUserEvent();
  if (!real) return;
  const bell = bellOf(canvasElement);
  const panel = panelOf(canvasElement);
  await expect(bell).toHaveAccessibleName('Notifications, 2 unread');
  const mark = () => canvasElement.querySelector('.flg-indicator-mark');
  await expect(mark()).toHaveTextContent('2');
  await expect(mark()).toHaveAttribute('aria-hidden', 'true');

  await real.click(bell);
  await waitFor(() => expect(isOpen(panel)).toBe(true));
  const button = within(panel).getByRole('button', MARK_ALL);
  await real.click(button);
  await waitFor(() => expect(bell).toHaveAccessibleName('Notifications'));
  await expect(mark()).toBeNull();
  await expect(panel.querySelectorAll('[data-unread]')).toHaveLength(0);
  await expect(panel.querySelectorAll('.notif-sr')).toHaveLength(0);
  // The button is still there, and the focus did not fall to the page. A press does not give a button
  // the focus in every engine (Safari gives it to the panel, which has a tabindex), so what is asked
  // of the press is that the focus is inside the panel; the key, which needs the focus on the button,
  // is the proof that the button keeps it.
  await expect(within(panel).getByRole('button', MARK_ALL)).toBe(button);
  await expect(panel.contains(document.activeElement)).toBe(true);
  button.focus();
  await real.keyboard('{Enter}');
  await expect(within(panel).getByRole('button', MARK_ALL)).toBe(button);
  await expect(button).toHaveFocus();

  await real.keyboard('{Escape}');
  await waitFor(() => expect(isOpen(panel)).toBe(false));
  await expect(bell).toHaveFocus();
};

export const MarkAllAsReadList: Story = {
  tags: ['no-visual'],
  parameters: IN_A_PAGE,
  render: () => inHeader(ListNotifications),
  play: checkMarkAllAsRead,
};
export const MarkAllAsReadTabs: Story = {
  tags: ['no-visual'],
  parameters: IN_A_PAGE,
  render: () => inHeader(TabbedNotifications),
  play: checkMarkAllAsRead,
};

/**
 * B3: "Unread" shows the unread rows only, and its badge has their number. "Mark all as read" on that
 * tab empties it, and the panel says there is nothing new, with the focus still on the button; "All"
 * still has the four rows, now read.
 */
export const TabsFilterTheRows: Story = {
  tags: ['no-visual'],
  parameters: IN_A_PAGE,
  render: () => inHeader(TabbedNotifications, true),
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const panel = panelOf(canvasElement);
    await waitFor(() => expect(isOpen(panel)).toBe(true));
    const inPanel = within(panel);
    const rowsShown = () => inPanel.queryAllByRole('link').length;

    await expect(rowsShown()).toBe(4);
    const unreadTab = inPanel.getByRole('tab', { name: /^Unread/ });
    await expect(unreadTab.querySelector('.flg-badge')).toHaveTextContent('2');
    await real.click(unreadTab);
    await waitFor(() => expect(rowsShown()).toBe(2));
    for (const link of inPanel.getAllByRole('link')) {
      await expect(link).toHaveAccessibleName(/^Unread: /);
    }

    const button = inPanel.getByRole('button', MARK_ALL);
    await real.click(button);
    await waitFor(() => expect(rowsShown()).toBe(0));
    await expect(inPanel.getByText('No new notifications')).toBeVisible();
    await expect(unreadTab.querySelector('.flg-badge')).toBeNull();
    await expect(inPanel.getByRole('button', MARK_ALL)).toBe(button);
    await expect(panel.contains(document.activeElement)).toBe(true);

    await real.click(inPanel.getByRole('tab', { name: 'All' }));
    await waitFor(() => expect(rowsShown()).toBe(4));
    await expect(panel.querySelectorAll('[data-unread]')).toHaveLength(0);
  },
};

/**
 * Where the panel is: 360px wide, 17px under the bell and lined up with its end, so its right edge is
 * the bell's, and inside the window.
 */
const checkPanelPlace: Story['play'] = async ({ canvasElement }) => {
  const panel = panelOf(canvasElement);
  await waitFor(() => expect(isOpen(panel)).toBe(true));
  await settled(panel);
  const bell = bellOf(canvasElement).getBoundingClientRect();
  const box = panel.getBoundingClientRect();
  await expect(box.width).toBe(360);
  await expect(Math.abs(box.top - (bell.bottom + 17))).toBeLessThan(1);
  await expect(Math.abs(box.right - bell.right)).toBeLessThan(1);
  await expect(box.left).toBeGreaterThanOrEqual(0);
  await expect(box.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
};

export const PanelPlaceList: Story = {
  tags: ['no-visual'],
  parameters: IN_A_PAGE,
  render: () => inHeader(ListNotifications, true),
  play: checkPanelPlace,
};
export const PanelPlaceTabs: Story = {
  tags: ['no-visual'],
  parameters: IN_A_PAGE,
  render: () => inHeader(TabbedNotifications, true),
  play: checkPanelPlace,
};

/**
 * On a phone the panel is no wider than its own 360px and stays inside the window (a popover is never
 * wider than the window less 32px, and is shifted back into it), and the page does not scroll
 * sideways.
 */
export const PanelOnAPhone: Story = {
  tags: ['no-visual'],
  parameters: IN_A_PAGE,
  render: () => inHeader(ListNotifications, true),
  play: async ({ canvasElement }) => {
    await withViewport(async (viewport) => {
      await viewport.set(390, 844);
      const panel = panelOf(canvasElement);
      await waitFor(() => expect(isOpen(panel)).toBe(true));
      await settled(panel);
      const box = panel.getBoundingClientRect();
      await expect(box.left).toBeGreaterThanOrEqual(0);
      await expect(box.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
      await expect(box.width).toBeLessThanOrEqual(360);
      await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
        document.documentElement.clientWidth,
      );
    });
  },
};
