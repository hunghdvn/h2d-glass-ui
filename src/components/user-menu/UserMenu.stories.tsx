import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { GearIcon, LogOutIcon, PersonIcon } from '../../../.storybook/icons';
import { App, End, Strip, strips } from '../../../.storybook/header-strip';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import { withViewport } from '../../../.storybook/viewport';
import { MenuItem, MenuSeparator } from '../menu/Menu';
// Named for what it is in the stories: the story called `UserMenu` is the look of the button.
import { UserMenu as Component } from './UserMenu';

const icon = { width: 15, height: 15 };

/** The items of the menu of the mockup: Profile, Settings, a rule, Log out. */
const ITEMS = (
  <>
    <MenuItem icon={<PersonIcon {...icon} />}>Profile</MenuItem>
    <MenuItem icon={<GearIcon {...icon} />}>Settings</MenuItem>
    <MenuSeparator />
    <MenuItem icon={<LogOutIcon {...icon} />}>Log out</MenuItem>
  </>
);

const meta = {
  title: 'Components/UserMenu',
  component: Component,
  // "MA" is what the mockup draws for this name: the initials of its first and last word would be "MN".
  args: {
    name: 'Minh Anh Nguyen',
    description: 'minhanh@lumen.vn',
    avatar: { fallback: 'MA' },
    children: ITEMS,
  },
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The name of the button of every story: made from the name above. */
const ACCOUNT = { name: 'Account: Minh Anh Nguyen' };

/**
 * The states of the button in the header strip of the mockup, one strip each: at rest, under the pointer
 * (the harness hovers the button marked `data-visual-hover`) and with the focus of the keyboard, which
 * the play function sets. The open state is the next story.
 */
const buttonStates: Story['render'] = (args) => (
  <div style={strips}>
    <Strip caption="At rest" account={<Component {...args} />} />
    <Strip
      caption={
        args.showName
          ? 'Under the pointer: the fill of a ghost button'
          : 'Under the pointer: a gray ring of 3px around the avatar'
      }
      account={<Component {...args} data-visual-hover="" />}
    />
    <Strip caption="Keyboard focus" account={<Component {...args} />} />
  </div>
);

const focusTheLast: Story['play'] = async ({ canvasElement }) => {
  const buttons = within(canvasElement).getAllByRole('button', ACCOUNT);
  buttons[2]!.focus();
  await expect(buttons[2]).toHaveFocus();
};

/**
 * U1: the avatar alone, in a round button of 34px. Under the pointer it has no fill but a gray ring;
 * with the keyboard focus, the ring of the focus.
 */
export const UserMenu: Story = {
  render: buttonStates,
  play: focusTheLast,
};

/**
 * U1 with the menu open: the accent ring on the button, and the menu 17px below it, lined up with its end.
 * Drawn in a real AppShell header: the fill of an open ghost button is a rule of the header, which the ring
 * of U1 has to win over, and a strip would not show that.
 */
export const UserMenuOpen: Story = {
  tags: ['viewport-1280x720'],
  parameters: { stage: 'page' },
  render: (args) => <App header={<End account={<Component {...args} defaultOpen />} />} />,
  play: async ({ canvasElement }) => {
    await settled(within(canvasElement).getByRole('menu'));
  },
};

/**
 * U2: the avatar, the name and a chevron, in a round ghost button. Under the pointer and open it has the
 * fill of a ghost button, and the chevron turns while it is open.
 */
export const UserMenuShowName: Story = {
  args: { showName: true },
  render: buttonStates,
  play: focusTheLast,
};

/** U2 with the menu open, in a real header: the fill stays, the chevron points up, and the menu is narrower. */
export const UserMenuShowNameOpen: Story = {
  args: { showName: true },
  tags: ['viewport-1280x720'],
  parameters: { stage: 'page' },
  render: UserMenuOpen.render,
  play: UserMenuOpen.play,
};

// ---------------------------------------------------------------------------------------------------
// Behaviour, in the real engines. Nothing here is a look: a screenshot cannot say it.

const isOpen = (menu: HTMLElement) => menu.matches(':popover-open');

/**
 * The keys of the menu, with trusted input (Esc closes a popover only for a key the browser trusts): Enter,
 * Space and ↓ open it on the first item, ↑ on the last, and Esc closes it and puts the focus back on the
 * button. The header is not an item: ↓ goes past it and ↑ from the first item goes round to the last.
 */
export const MenuKeys: Story = {
  tags: ['no-visual'],
  parameters: { stage: 'viewport' },
  render: (args) => (
    <div style={strips}>
      <Strip caption="Keys" account={<Component {...args} />} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', ACCOUNT);
    const menu = canvas.getByRole('menu', { hidden: true });
    const item = (label: string) => canvas.getByRole('menuitem', { name: label });
    const closed = () => waitFor(() => expect(isOpen(menu)).toBe(false));
    const opened = () => waitFor(() => expect(isOpen(menu)).toBe(true));

    for (const key of ['{Enter}', ' ', '{ArrowDown}']) {
      button.focus();
      await real.keyboard(key);
      await opened();
      await waitFor(() => expect(item('Profile')).toHaveFocus());
      await real.keyboard('{Escape}');
      await closed();
      await expect(button).toHaveFocus();
    }

    button.focus();
    await real.keyboard('{ArrowUp}');
    await opened();
    await waitFor(() => expect(item('Log out')).toHaveFocus());
    await real.keyboard('{ArrowUp}');
    await expect(item('Settings')).toHaveFocus();
    await real.keyboard('{ArrowUp}');
    await expect(item('Profile')).toHaveFocus();
    // The header is in the menu but not among the items: the keys go round past it.
    await real.keyboard('{ArrowUp}');
    await expect(item('Log out')).toHaveFocus();
    await real.keyboard('{ArrowDown}');
    await expect(item('Profile')).toHaveFocus();
    await real.keyboard('{Escape}');
    await closed();
    await expect(button).toHaveFocus();
  },
};

/**
 * The header is not a menu item: it has no role of one, takes no focus (a click on it leaves the menu
 * open, with the focus on the menu), and it is the description of the menu, so a screen reader reads the
 * name and the line under it when the menu opens. A `contentProps` description is read after it.
 */
export const HeaderIsTheDescription: Story = {
  tags: ['no-visual'],
  parameters: { stage: 'viewport' },
  render: (args) => (
    <div style={strips}>
      <p id="signed-in">Signed in with SSO</p>
      <Strip
        caption="Header"
        account={<Component {...args} contentProps={{ 'aria-describedby': 'signed-in' }} />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const canvas = within(canvasElement);
    const menu = canvas.getByRole('menu', { hidden: true });
    await real.click(canvas.getByRole('button', ACCOUNT));
    await waitFor(() => expect(isOpen(menu)).toBe(true));
    await expect(menu).toHaveAccessibleDescription(
      'Minh Anh Nguyen minhanh@lumen.vn Signed in with SSO',
    );

    const header = menu.querySelector<HTMLElement>('.flg-user-menu-header')!;
    await expect(canvas.getAllByRole('menuitem').map((el) => el.textContent)).toEqual([
      'Profile',
      'Settings',
      'Log out',
    ]);
    header.focus();
    await expect(header).not.toHaveFocus();
    await real.click(header);
    await expect(isOpen(menu)).toBe(true);
    await expect(header).not.toHaveFocus();
    await expect(menu.contains(document.activeElement)).toBe(true);
  },
};

/**
 * Where the menu is, in px: 17px below the button (6px below a header of 56px) and lined up with the
 * button's end; 244px wide for U1 and 230px for U2, whatever the width of its lines; and in the window.
 */
export const MenuPlace: Story = {
  tags: ['no-visual'],
  parameters: { stage: 'viewport' },
  render: (args) => (
    <div style={strips}>
      <Strip caption="U1" account={<Component {...args} />} />
      <Strip
        caption="U2"
        account={
          <Component
            {...args}
            showName
            name="A name that is much longer than the room the menu gives it"
            description="and a line under it that is longer still, an address@that-goes-on-and-on.example"
          />
        }
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole('button', { name: /^Account: / });
    const menus = canvas.getAllByRole('menu', { hidden: true });
    for (const [index, width] of [244, 230].entries()) {
      const button = buttons[index]!;
      const menu = menus[index]!;
      await real.click(button);
      await waitFor(() => expect(isOpen(menu)).toBe(true));
      await settled(menu);
      const b = button.getBoundingClientRect();
      const m = menu.getBoundingClientRect();
      await expect(Math.round(m.top - b.bottom)).toBe(17);
      await expect(Math.round(m.right)).toBe(Math.round(b.right));
      await expect(Math.round(m.width)).toBe(width);
      await expect(m.left).toBeGreaterThanOrEqual(0);
      await expect(m.bottom).toBeLessThanOrEqual(window.innerHeight);
      // A line that is too long is cut with an ellipsis, and does not widen the menu.
      if (index === 1) {
        for (const line of ['.flg-user-menu-title', '.flg-user-menu-description']) {
          const el = menu.querySelector<HTMLElement>(line)!;
          await expect(el.scrollWidth).toBeGreaterThan(el.clientWidth);
          await expect(el.getBoundingClientRect().right).toBeLessThanOrEqual(m.right);
        }
      }
      await real.keyboard('{Escape}');
      await waitFor(() => expect(isOpen(menu)).toBe(false));
    }
  },
};

/**
 * The name of U2 is cut at 160px with an ellipsis, and gives way to the room there is: in a header of
 * 360px the button is inside the window and the page does not scroll sideways. The chevron points down,
 * and up while the menu is open.
 */
export const LongNameAndChevron: Story = {
  tags: ['no-visual'],
  parameters: { stage: 'page' },
  render: (args) => (
    <App
      header={
        <End
          account={
            <Component {...args} showName name="Bartholomew Maximilian Montgomery-Fitzgerald" />
          }
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /^Account: / });
    const name = button.querySelector<HTMLElement>('.flg-user-menu-name')!;
    const chevron = button.querySelector<HTMLElement>('.flg-user-menu-chevron')!;
    await expect(name.getBoundingClientRect().width).toBeLessThanOrEqual(160);
    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
    await expect(getComputedStyle(chevron).rotate).toBe('none');

    await withViewport(async (viewport) => {
      await viewport.set(360, 640);
      const box = button.getBoundingClientRect();
      await expect(box.right).toBeLessThanOrEqual(window.innerWidth);
      await expect(name.getBoundingClientRect().width).toBeLessThan(160);
      await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
      await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
        document.documentElement.clientWidth,
      );
      // Nothing is on top of it: a press at its centre reaches the button.
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      await expect(button.contains(hit)).toBe(true);
    });

    const real = await realUserEvent();
    if (!real) return;
    await real.click(button);
    await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(getComputedStyle(chevron).rotate).toBe('180deg'));
  },
};

/**
 * What the button draws in a real header, where the fill of an open ghost button is a rule of the
 * header that U1 must win over: under the pointer U1 has a ring of 3px and no fill, open a ring of 2px
 * and no fill, with the keyboard focus the ring of the focus, as the bell beside it has; and U2, open,
 * keeps the fill of a ghost button. Real pointer and keys.
 */
export const RingsInTheHeader: Story = {
  tags: ['no-visual'],
  parameters: { stage: 'page' },
  render: (args) => (
    <App
      header={
        <End account={<Component {...args} />}>
          <Component {...args} showName name="Second" />
        </End>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const canvas = within(canvasElement);
    const u1 = canvasElement.querySelector<HTMLElement>('.flg-user-menu:not([data-show-name])')!;
    const u2 = canvasElement.querySelector<HTMLElement>('.flg-user-menu[data-show-name]')!;
    const bell = canvas.getByRole('button', { name: 'Notifications' });
    const theme = canvas.getByRole('button', { name: 'Theme' });
    const shadow = (el: Element) => getComputedStyle(el).boxShadow;
    const noFill = (el: Element) => getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)';
    /** What a custom property computes to on a probe beside the button, in the theme of the story. */
    const computed = (property: 'background' | 'boxShadow', value: string) => {
      const probe = document.createElement('span');
      probe.style[property] = value;
      u2.after(probe);
      const result =
        getComputedStyle(probe)[property === 'background' ? 'backgroundColor' : 'boxShadow'];
      probe.remove();
      return result;
    };

    // The ring is a `(hover: hover)` rule under the pointer, so both come first: a page left with
    // no pointer that hovers (touch emulation that a story in Chromium did not turn off) says so.
    await expect(matchMedia('(hover: hover)').matches, 'the page has a pointer that hovers').toBe(
      true,
    );
    await real.hover(u1);
    await waitFor(() => expect(u1.matches(':hover'), 'the pointer is on U1').toBe(true));
    await waitFor(() => expect(shadow(u1)).toMatch(/ 0px 0px 0px 3px/));
    await expect(noFill(u1)).toBe(true);

    // Open, and still under the pointer: the ring of the accent, and no fill.
    await real.click(u1);
    await waitFor(() => expect(u1).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(shadow(u1)).toMatch(/ 0px 0px 0px 2px/));
    await expect(noFill(u1)).toBe(true);
    await real.keyboard('{Escape}');
    await waitFor(() => expect(u1).toHaveAttribute('aria-expanded', 'false'));

    await real.click(u2);
    await waitFor(() => expect(u2).toHaveAttribute('aria-expanded', 'true'));
    // Read once: `waitFor` watches the DOM, and a probe added to it on every look would wake it again.
    const fill = computed('background', 'var(--flg-control-track)');
    await waitFor(() => expect(getComputedStyle(u2).backgroundColor).toBe(fill));
    await real.keyboard('{Escape}');
    await waitFor(() => expect(u2).toHaveAttribute('aria-expanded', 'false'));

    // The keyboard: the ring of the focus, which the bell beside it has as well. It comes in with a
    // transition, so it is waited for.
    const ring = computed('boxShadow', 'var(--flg-focus-ring)');
    await expect(ring).not.toBe('none');
    u2.focus();
    await real.keyboard('{Tab}');
    await expect(bell).toHaveFocus();
    await waitFor(() => expect(shadow(bell)).toBe(ring));
    await real.keyboard('{Tab}');
    await expect(theme).toHaveFocus();
    await real.keyboard('{Tab}');
    await expect(u1).toHaveFocus();
    await expect(u1.matches(':focus-visible')).toBe(true);
    await waitFor(() => expect(shadow(u1)).toBe(ring));
  },
};
