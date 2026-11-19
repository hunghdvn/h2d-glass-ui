import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import type { Ref } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../dropdown-menu/DropdownMenu';
import { ThemeMenuGroup, ThemeSwitch } from './ThemeSwitch';
import type { ThemeMenuGroupProps } from './ThemeSwitch';

// jsdom has no Popover API; the menu needs a stand-in to be in the page.
// Nor does it scroll an item into view.
const original = {
  showPopover: HTMLElement.prototype.showPopover,
  hidePopover: HTMLElement.prototype.hidePopover,
  scrollIntoView: Element.prototype.scrollIntoView,
};
beforeAll(() => {
  HTMLElement.prototype.showPopover = () => {};
  HTMLElement.prototype.hidePopover = () => {};
  Element.prototype.scrollIntoView = () => {};
});
afterAll(() => Object.assign(HTMLElement.prototype, original));

function Menu(props: ThemeMenuGroupProps & { groupRef?: Ref<HTMLDivElement> }) {
  const { groupRef, ...rest } = props;
  return (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Account</DropdownMenuTrigger>
      <DropdownMenuContent>
        <ThemeMenuGroup ref={groupRef} {...rest} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const group = () => screen.getByRole('group', { hidden: true });
const items = () => within(group()).getAllByRole('menuitemradio', { hidden: true });
const item = (name: string) => within(group()).getByRole('menuitemradio', { name, hidden: true });
const html = () => document.documentElement.getAttribute('data-flg-theme');

describe('ThemeMenuGroup', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute('data-flg-theme');
    document.body.replaceChildren();
  });

  describe('the group', () => {
    it('is named "Theme" by its title, and has Light, Dark and System, in that order', () => {
      render(<Menu />);
      expect(group()).toHaveAccessibleName('Theme');
      expect(items().map((element) => element.textContent)).toEqual(['Light', 'Dark', 'System']);
    });

    it('has the stored value chosen, and System when nothing is stored', () => {
      localStorage.setItem('flg-theme', 'dark');
      const { unmount } = render(<Menu />);
      expect(items().map((element) => element.getAttribute('aria-checked'))).toEqual([
        'false',
        'true',
        'false',
      ]);
      unmount();
      localStorage.clear();
      document.documentElement.removeAttribute('data-flg-theme');
      render(<Menu />);
      expect(item('System')).toHaveAttribute('aria-checked', 'true');
    });

    it('has an icon at the end of each item, hidden, and the name of an item is its word alone', () => {
      render(<Menu />);
      for (const [index, name] of ['Light', 'Dark', 'System'].entries()) {
        const icon = items()[index]!.querySelector<HTMLElement>('.flg-theme-menu-icon')!;
        expect(icon).toHaveAttribute('aria-hidden', 'true');
        expect(icon.querySelector('svg')).not.toBeNull();
        expect(item(name)).toBeDefined();
      }
      // The sun, the moon and the screen.
      expect(
        items().map((element) => element.querySelector('.flg-theme-menu-icon svg')?.innerHTML),
      ).toEqual([
        expect.stringContaining('<circle'),
        expect.stringMatching(/^<path d="M12 3a6/),
        expect.stringContaining('<rect'),
      ]);
    });

    it('takes its words from labels, and keeps the default for one given as undefined', () => {
      render(
        <Menu labels={{ group: 'Giao diện', light: 'Sáng', dark: 'Tối', system: undefined }} />,
      );
      expect(group()).toHaveAccessibleName('Giao diện');
      expect(items().map((element) => element.textContent)).toEqual(['Sáng', 'Tối', 'System']);
    });

    it('passes className and data attributes to the group, and ref points to it', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Menu groupRef={ref} className="mine" data-x="1" />);
      expect(ref.current).toBe(group());
      expect(group()).toHaveClass('mine');
      expect(group()).toHaveAttribute('data-x', '1');
    });
  });

  describe('choosing', () => {
    it('stores the choice, puts it on <html>, closes the menu and reports it', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Menu onValueChange={onValueChange} />);
      expect(screen.getByRole('button', { name: 'Account' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      await user.click(item('Dark'));
      expect(localStorage.getItem('flg-theme')).toBe('dark');
      expect(html()).toBe('dark');
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('dark');
      expect(screen.getByRole('button', { name: 'Account' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    it('chooses with the keyboard, Enter on the item that has the focus', async () => {
      const user = userEvent.setup();
      render(<Menu />);
      act(() => item('Light').focus());
      await user.keyboard('{Enter}');
      expect(html()).toBe('light');
      expect(localStorage.getItem('flg-theme')).toBe('light');
    });

    it('goes under its storageKey', async () => {
      const user = userEvent.setup();
      render(<Menu storageKey="my-theme" />);
      await user.click(item('Dark'));
      expect(localStorage.getItem('my-theme')).toBe('dark');
      expect(localStorage.getItem('flg-theme')).toBeNull();
    });

    it('keeps its choice when the menu is opened again', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Account</DropdownMenuTrigger>
          <DropdownMenuContent>
            <ThemeMenuGroup />
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      await user.click(screen.getByRole('button', { name: 'Account' }));
      await user.click(item('Dark'));
      await user.click(screen.getByRole('button', { name: 'Account' }));
      expect(item('Dark')).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('controlled', () => {
    it('shows the value it is given and reports a choice, and never touches <html> or localStorage', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const set = vi.spyOn(Storage.prototype, 'setItem');
      render(<Menu value="light" onValueChange={onValueChange} />);
      expect(item('Light')).toHaveAttribute('aria-checked', 'true');
      await user.click(item('System'));
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('system');
      expect(set).not.toHaveBeenCalled();
      expect(html()).toBeNull();
    });
  });

  describe('with a ThemeSwitch of the same key', () => {
    it('agrees with it, whichever of the two is used', async () => {
      const user = userEvent.setup();
      render(
        <>
          <ThemeSwitch defaultValue="light" />
          <Menu defaultValue="light" />
        </>,
      );
      const switcher = screen.getByRole('button', { name: /^Theme:/ });
      expect(switcher).toHaveAccessibleName('Theme: Light');
      await user.click(switcher);
      expect(switcher).toHaveAccessibleName('Theme: Dark');
      expect(item('Dark')).toHaveAttribute('aria-checked', 'true');
      await user.click(item('System'));
      expect(switcher).toHaveAccessibleName('Theme: System');
    });
  });
});
