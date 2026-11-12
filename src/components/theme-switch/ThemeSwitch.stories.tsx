import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { GearIcon, LogOutIcon, PersonIcon } from '../../../.storybook/icons';
import { App, End, Strip, strips } from '../../../.storybook/header-strip';
import { settled } from '../../../.storybook/real-input';
import { Avatar } from '../avatar/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../dropdown-menu/DropdownMenu';
import { MenuItem, MenuSeparator } from '../menu/Menu';
import { UserMenu } from '../user-menu/UserMenu';
import { ThemeScript } from './ThemeScript';
// Named for what they are in the stories: the stories called `ThemeSwitch` and `ThemeMenuGroup` are the looks.
import { ThemeMenuGroup as Group, ThemeSwitch as Switch } from './ThemeSwitch';

const meta = {
  title: 'Components/ThemeSwitch',
  component: Switch,
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------------------------------
// Looks. Every one of them is controlled (`value`): the page is not changed, and each state is drawn
// whatever the theme of the story is ("the chosen value is drawn independently of the theme of the
// cell", as the mockup says). The header of the T3 ones has no theme button: the theme is in the menu.

/**
 * T1: the button that goes round the themes, with the icon of the value it has (the sun, the moon, the
 * screen), and under the pointer the fill of a ghost button and the tooltip, which says the value and
 * the one a click goes to. The tooltip below it is 6px under the header. The state with the focus of the
 * keyboard is the next story: only one tooltip shows at a time, and the pointer has it here.
 */
export const ThemeSwitch: Story = {
  render: () => (
    <div style={{ ...strips, paddingBottom: 40 }}>
      <Strip caption="Light: the sun" theme={<Switch value="light" />} />
      <Strip caption="Dark: the moon" theme={<Switch value="dark" />} />
      <Strip caption="System: the screen" theme={<Switch value="system" />} />
      <Strip
        caption="Under the pointer: the fill of the button and the tooltip"
        theme={<Switch value="light" data-visual-hover="tooltip" />}
      />
    </div>
  ),
};

/** T1 with the focus of the keyboard: the ring of the focus, and the tooltip, which a focus shows too. */
export const ThemeSwitchFocus: Story = {
  render: () => (
    <div style={{ ...strips, paddingBottom: 40 }}>
      <Strip caption="Keyboard focus: the ring and the tooltip" theme={<Switch value="light" />} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Theme: Light' });
    button.focus();
    await expect(button).toHaveFocus();
    // The tooltip opens a task after the focus, so the shot waits for it.
    const tooltip = canvasElement.ownerDocument.querySelector<HTMLElement>('[role="tooltip"]')!;
    await waitFor(() => expect(tooltip.matches(':popover-open')).toBe(true));
    await settled(tooltip);
  },
};

const ITEMS = [
  <MenuItem key="profile" icon={<PersonIcon width={15} height={15} />}>
    Profile
  </MenuItem>,
  <MenuItem key="settings" icon={<GearIcon width={15} height={15} />}>
    Settings
  </MenuItem>,
];

/**
 * T3: the group in the menu of a UserMenu, which is open: Light chosen, with its dot, and Dark under the
 * keyboard, which has the fill of a menu item. The icon at the end of each item is muted, and takes the
 * colour of the item that is lit. Drawn in a real header, as the menu is a popover of the page.
 */
export const ThemeMenuGroup: Story = {
  tags: ['viewport-1280x720'],
  parameters: { stage: 'page' },
  render: () => (
    <App
      header={
        <End
          theme={null}
          account={
            <UserMenu
              name="Minh Anh Nguyen"
              description="minhanh@lumen.vn"
              avatar={{ fallback: 'MA' }}
              defaultOpen
            >
              {ITEMS}
              <MenuSeparator />
              <Group value="light" />
              <MenuSeparator />
              <MenuItem icon={<LogOutIcon width={15} height={15} />}>Log out</MenuItem>
            </UserMenu>
          }
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const menu = within(canvasElement).getByRole('menu');
    await settled(menu);
    const dark = within(menu).getByRole('menuitemradio', { name: 'Dark' });
    dark.focus();
    await expect(dark).toHaveFocus();
  },
};

/** A menu that holds only the Theme group, open under a button of the header, with `value` chosen. */
const themeOnly =
  (value: 'dark' | 'system'): Story['render'] =>
  () => (
    <App
      header={
        <End
          theme={null}
          account={
            <DropdownMenu defaultOpen>
              <DropdownMenuTrigger
                variant="ghost"
                data-icon-only=""
                aria-label="Appearance"
                style={{ borderRadius: 'var(--flg-radius-full)' }}
              >
                <Avatar alt="" fallback="MA" size="sm" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={17}>
                <Group value={value} />
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      }
    />
  );

/** T3 with Dark chosen: the menu holds only the Theme part. */
export const ThemeMenuGroupDark: Story = {
  tags: ['viewport-1280x720'],
  parameters: { stage: 'page' },
  render: themeOnly('dark'),
  play: async ({ canvasElement }) => {
    await settled(within(canvasElement).getByRole('menu'));
  },
};

/** T3 with System chosen. */
export const ThemeMenuGroupSystem: Story = {
  tags: ['viewport-1280x720'],
  parameters: { stage: 'page' },
  render: themeOnly('system'),
  play: async ({ canvasElement }) => {
    await settled(within(canvasElement).getByRole('menu'));
  },
};

// ---------------------------------------------------------------------------------------------------
// Behaviour, in the real engines. Nothing here is a look: a screenshot cannot say it. They leave the
// page as they found it: `<html>` and the keys of `localStorage` that they used.

const ATTRIBUTE = 'data-flg-theme';

/** Runs `run` and puts `<html>` back as it was, with the keys it used gone from `localStorage`. */
async function leavingThePageAsItWas(keys: string[], run: () => Promise<void>): Promise<void> {
  const root = document.documentElement;
  const before = root.getAttribute(ATTRIBUTE);
  for (const key of keys) localStorage.removeItem(key);
  try {
    await run();
  } finally {
    for (const key of keys) localStorage.removeItem(key);
    if (before === null) root.removeAttribute(ATTRIBUTE);
    else root.setAttribute(ATTRIBUTE, before);
  }
}

const html = () => document.documentElement.getAttribute(ATTRIBUTE);

/** The icons of a button that the CSS shows, by the value they stand for. */
const visibleIcons = (button: HTMLElement) =>
  [...button.querySelectorAll<SVGElement>('.flg-theme-switch-icon')]
    .filter((icon) => getComputedStyle(icon).display !== 'none')
    .map((icon) => icon.getAttribute('data-for'));

const CHANGES_KEY = 'flg-story-theme-changes';

/**
 * A click of the switch puts the theme on `<html>` and in `localStorage`, round light, dark, system; a
 * choice in the menu group does the same, and the switch follows it.
 */
export const ChangesTheHtml: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={strips}>
      <Strip
        caption="Strip"
        theme={<Switch storageKey={CHANGES_KEY} defaultValue="light" />}
        account={
          <DropdownMenu>
            <DropdownMenuTrigger variant="ghost">Menu</DropdownMenuTrigger>
            <DropdownMenuContent>
              <Group storageKey={CHANGES_KEY} defaultValue="light" />
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await leavingThePageAsItWas([CHANGES_KEY], async () => {
      const canvas = within(canvasElement);
      const button = canvas.getByRole('button', { name: /^Theme:/ });
      // Nothing is stored: the default value is what the page has, and it is on `<html>` after mount.
      await waitFor(() => expect(html()).toBe('light'));
      await expect(button).toHaveAccessibleName('Theme: Light');
      await expect(button).not.toHaveAttribute('data-pending');

      await userEvent.click(button);
      await expect(html()).toBe('dark');
      await expect(localStorage.getItem(CHANGES_KEY)).toBe('dark');
      await expect(button).toHaveAccessibleName('Theme: Dark');
      await userEvent.click(button);
      await expect(html()).toBeNull();
      await expect(localStorage.getItem(CHANGES_KEY)).toBe('system');
      await userEvent.click(button);
      await expect(html()).toBe('light');

      // The group is the same store: its choice moves the switch. The press on the switch closed the
      // menu, which was open: it is opened again.
      await userEvent.click(canvas.getByRole('button', { name: 'Menu' }));
      const menu = await canvas.findByRole('menu');
      await userEvent.click(within(menu).getByRole('menuitemradio', { name: 'Dark' }));
      await expect(html()).toBe('dark');
      await expect(button).toHaveAccessibleName('Theme: Dark');
    });
  },
};

const SYNC_KEY = 'flg-story-theme-sync';

/**
 * Two shells on one page agree: two switches and a menu group of one key follow one another. A page of
 * the same origin that changes the key (a `storage` event, which a document does not hear of its own
 * writes) moves all of them, and <html>; so does removing the key, which is the system's choice.
 */
export const TwoShellsStayInSync: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={strips}>
      <Strip caption="First shell" theme={<Switch storageKey={SYNC_KEY} defaultValue="light" />} />
      <Strip
        caption="Second shell"
        theme={<Switch storageKey={SYNC_KEY} defaultValue="light" />}
        account={
          <DropdownMenu>
            <DropdownMenuTrigger variant="ghost">Menu</DropdownMenuTrigger>
            <DropdownMenuContent>
              <Group storageKey={SYNC_KEY} defaultValue="light" />
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await leavingThePageAsItWas([SYNC_KEY], async () => {
      const canvas = within(canvasElement);
      const [first, second] = canvas.getAllByRole('button', { name: /^Theme:/ }) as [
        HTMLElement,
        HTMLElement,
      ];
      const checked = () =>
        within(canvasElement)
          .getAllByRole('menuitemradio', { hidden: true })
          .find((item) => item.getAttribute('aria-checked') === 'true')?.textContent;
      await waitFor(() => expect(checked()).toBe('Light'));

      await userEvent.click(first);
      await expect(second).toHaveAccessibleName('Theme: Dark');
      await expect(checked()).toBe('Dark');

      // Another document of the same origin: a frame with no page of its own.
      const frame = document.createElement('iframe');
      frame.hidden = true;
      document.body.append(frame);
      try {
        const other = frame.contentWindow!.localStorage;
        other.setItem(SYNC_KEY, 'light');
        await waitFor(() => expect(second).toHaveAccessibleName('Theme: Light'));
        await expect(first).toHaveAccessibleName('Theme: Light');
        await expect(checked()).toBe('Light');
        await expect(html()).toBe('light');
        other.removeItem(SYNC_KEY);
        await waitFor(() => expect(second).toHaveAccessibleName('Theme: System'));
        await expect(checked()).toBe('System');
        await expect(html()).toBeNull();
      } finally {
        frame.remove();
      }
    });
  },
};

const HYDRATION_KEY = 'flg-story-theme-hydration';

/**
 * The icon is right before hydration. The server's HTML (`ThemeScript` and a `ThemeSwitch`, rendered to a
 * string) shows the default value, with `data-pending`; the script puts the stored theme on `<html>`
 * first, and the CSS picks the icon from there, so the right one is already drawn when React takes over,
 * and it stays when the button learns its value and drops `data-pending`.
 */
export const IconBeforeHydration: Story = {
  tags: ['no-visual'],
  render: () => <div />,
  play: async ({ canvasElement }) => {
    await leavingThePageAsItWas([HYDRATION_KEY], async () => {
      const cases: Array<[stored: string | null, icon: string, name: string]> = [
        ['dark', 'dark', 'Theme: Dark'],
        ['light', 'light', 'Theme: Light'],
        ['system', 'system', 'Theme: System'],
        [null, 'system', 'Theme: System'],
      ];
      for (const [stored, icon, name] of cases) {
        if (stored === null) localStorage.removeItem(HYDRATION_KEY);
        else localStorage.setItem(HYDRATION_KEY, stored);
        // A page that has not been touched yet, as the browser parses it.
        document.documentElement.removeAttribute(ATTRIBUTE);
        const app = (
          <>
            <ThemeScript storageKey={HYDRATION_KEY} />
            <Switch storageKey={HYDRATION_KEY} />
          </>
        );
        const container = document.createElement('div');
        canvasElement.append(container);
        container.innerHTML = renderToString(app);
        const button = within(container).getByRole('button');
        try {
          // The server knows nothing of the stored theme.
          await expect(button).toHaveAttribute('data-pending');
          await expect(button).toHaveAccessibleName('Theme: System');
          await expect(visibleIcons(button)).toEqual(['system']);

          // The browser runs the script as it parses it, before the first paint.
          const script = document.createElement('script');
          script.textContent = container.querySelector('script')!.textContent;
          document.head.append(script);
          script.remove();
          await expect(visibleIcons(button)).toEqual([icon]);

          const root = hydrateRoot(container, app);
          try {
            await waitFor(() => expect(button).not.toHaveAttribute('data-pending'));
            await expect(button).toHaveAccessibleName(name);
            await expect(button).toHaveAttribute('data-value', icon);
            await expect(visibleIcons(button)).toEqual([icon]);
          } finally {
            root.unmount();
          }
        } finally {
          container.remove();
        }
      }
    });
  },
};

const BLOCKED_KEY = 'flg-story-theme-blocked';

/** Makes every read and write of `localStorage` throw, as it does where site data is blocked. */
function blockStorage(): () => void {
  const { getItem, setItem } = Storage.prototype;
  const refuse = () => {
    throw new DOMException('Blocked', 'SecurityError');
  };
  Storage.prototype.getItem = refuse;
  Storage.prototype.setItem = refuse;
  return () => {
    Storage.prototype.getItem = getItem;
    Storage.prototype.setItem = setItem;
  };
}

/** `localStorage` that throws: the switch still works, and the theme lives in the page. */
export const WorksWhenLocalStorageThrows: Story = {
  tags: ['no-visual'],
  render: () => <div />,
  play: async ({ canvasElement }) => {
    await leavingThePageAsItWas([BLOCKED_KEY], async () => {
      const container = document.createElement('div');
      canvasElement.append(container);
      const root = createRoot(container);
      const restore = blockStorage();
      try {
        // `<html>` is the only thing there is to read.
        document.documentElement.setAttribute(ATTRIBUTE, 'dark');
        root.render(<Switch storageKey={BLOCKED_KEY} />);
        const button = await within(container).findByRole('button', { name: 'Theme: Dark' });

        await userEvent.click(button);
        await expect(button).toHaveAccessibleName('Theme: System');
        await expect(html()).toBeNull();
        await userEvent.click(button);
        await expect(button).toHaveAccessibleName('Theme: Light');
        await expect(html()).toBe('light');
      } finally {
        restore();
        root.unmount();
        container.remove();
      }
    });
  },
};

/**
 * The tooltip opens under the button, 17px from it (6px under a header of 56px), lined up with its end,
 * and is not what describes the button: the hint is, so that a screen reader does not say it twice.
 */
export const TooltipUnderTheButton: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ ...strips, paddingBottom: 60 }}>
      <Strip caption="Strip" theme={<Switch value="light" />} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Theme: Light' });
    button.focus();
    const tooltip = canvasElement.ownerDocument.querySelector<HTMLElement>('[role="tooltip"]')!;
    await waitFor(() => expect(tooltip.matches(':popover-open')).toBe(true));
    await settled(tooltip);
    await expect(tooltip).toHaveTextContent('Theme: Light · click to switch to Dark');

    const trigger = button.getBoundingClientRect();
    const box = tooltip.getBoundingClientRect();
    await expect(Math.abs(box.top - trigger.bottom - 17)).toBeLessThan(1.5);
    await expect(Math.abs(box.right - trigger.right)).toBeLessThan(1.5);

    await expect(button.getAttribute('aria-describedby')).not.toContain(tooltip.id);
    await expect(button).toHaveAccessibleDescription('Click to switch to Dark');
  },
};

/**
 * A ThemeSwitch that is `loading` shows the spinner of a Button in place of its icon, as every
 * icon-only button does: none of the three icons is drawn, for any value, controlled or not, and
 * also while the button is pending (before its first effect, when the icon comes from `<html>`).
 */
export const LoadingShowsOnlyTheSpinner: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Switch loading value="light" />
      <Switch loading value="dark" />
      <Switch loading value="system" />
      <Switch loading storageKey="flg-theme-story-loading" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const buttons = Array.from(canvasElement.querySelectorAll<HTMLElement>('.flg-theme-switch'));
    await expect(buttons).toHaveLength(4);
    const drawn = (el: Element) => getComputedStyle(el).display !== 'none';
    const onlyTheSpinner = async (button: HTMLElement, state: string) => {
      const spinner = button.querySelector('.flg-spinner');
      await expect(spinner, state).not.toBeNull();
      await expect(drawn(spinner!), state).toBe(true);
      const icons = Array.from(button.querySelectorAll('.flg-theme-switch-icon'));
      await expect(icons, state).toHaveLength(3);
      await expect(icons.filter(drawn), state).toEqual([]);
    };
    for (const button of buttons) {
      await onlyTheSpinner(button, button.dataset.value!);
      // Pending, the icon is picked by `<html>`: the attribute is set by hand, as the server's HTML
      // has it, since the button leaves it at its first effect.
      button.setAttribute('data-pending', '');
      try {
        await onlyTheSpinner(button, `${button.dataset.value} pending`);
      } finally {
        button.removeAttribute('data-pending');
      }
    }
  },
};
