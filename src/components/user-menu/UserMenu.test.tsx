import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
import { MenuItem, MenuSeparator } from '../menu/Menu';
import { UserMenu } from './UserMenu';
import type { UserMenuProps } from './UserMenu';

// jsdom has no Popover API; the menu needs a stand-in to be in the page.
const original = {
  showPopover: HTMLElement.prototype.showPopover,
  hidePopover: HTMLElement.prototype.hidePopover,
};
beforeAll(() => {
  HTMLElement.prototype.showPopover = () => {};
  HTMLElement.prototype.hidePopover = () => {};
});
afterAll(() => Object.assign(HTMLElement.prototype, original));

const NO_NAME =
  WARN_PREFIX +
  ' <UserMenu> needs a name: it is the name of the button and the first line of the menu.';

const trigger = () => screen.getByRole('button', { name: /^Account/ });
const menu = () => screen.getByRole('menu', { hidden: true });
const header = () => menu().querySelector<HTMLElement>('.flg-user-menu-header')!;

function Menu(props: Partial<UserMenuProps>) {
  return (
    <UserMenu name="Ada Lovelace" {...props}>
      <MenuItem>Profile</MenuItem>
      <MenuSeparator />
      <MenuItem>Log out</MenuItem>
    </UserMenu>
  );
}

describe('UserMenu', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('the button', () => {
    it('is named by labels.trigger, with the default "Account: <name>"', () => {
      render(<Menu />);
      expect(trigger()).toHaveAccessibleName('Account: Ada Lovelace');
      expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('takes a name from labels.trigger, and keeps the default for a key given as undefined', () => {
      const { rerender } = render(<Menu labels={{ trigger: (name) => `Tài khoản: ${name}` }} />);
      expect(screen.getByRole('button')).toHaveAccessibleName('Tài khoản: Ada Lovelace');
      rerender(<Menu labels={{ trigger: undefined }} />);
      expect(trigger()).toHaveAccessibleName('Account: Ada Lovelace');
    });

    it('is a ghost button of the library, round, with the avatar only (U1)', () => {
      render(<Menu />);
      expect(trigger()).toHaveClass('flg-button', 'flg-user-menu');
      expect(trigger()).toHaveAttribute('data-variant', 'ghost');
      expect(trigger()).toHaveAttribute('data-size', 'md');
      expect(trigger()).toHaveAttribute('data-icon-only');
      expect(trigger()).not.toHaveAttribute('data-show-name');
      expect(trigger().textContent).toBe('AL');
      expect(trigger().querySelector('.flg-user-menu-name, .flg-user-menu-chevron')).toBeNull();
      expect(trigger().querySelector('.flg-avatar')).toHaveAttribute('data-size', 'md');
    });

    it('shows the name and a chevron with showName, and the avatar at sm (U2)', () => {
      render(<Menu showName />);
      expect(trigger()).toHaveAttribute('data-show-name');
      expect(trigger()).not.toHaveAttribute('data-icon-only');
      expect(trigger().querySelector('.flg-user-menu-name')).toHaveTextContent('Ada Lovelace');
      expect(trigger().querySelector('.flg-user-menu-chevron')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
      expect(trigger().querySelector('.flg-avatar')).toHaveAttribute('data-size', 'sm');
      // The name that is seen is part of the name that is spoken (WCAG 2.5.3).
      expect(trigger()).toHaveAccessibleName('Account: Ada Lovelace');
    });

    it('follows showName and name on a mounted button', () => {
      const { rerender } = render(<Menu />);
      rerender(<Menu showName name="Grace Hopper" />);
      expect(trigger()).toHaveAttribute('data-show-name');
      expect(trigger()).not.toHaveAttribute('data-icon-only');
      expect(trigger()).toHaveAccessibleName('Account: Grace Hopper');
      expect(trigger().querySelector('.flg-user-menu-name')).toHaveTextContent('Grace Hopper');
      expect(trigger().querySelector('.flg-avatar')).toHaveTextContent('GH');
      rerender(<Menu name="Grace Hopper" />);
      expect(trigger()).not.toHaveAttribute('data-show-name');
      expect(trigger()).toHaveAttribute('data-icon-only');
      expect(trigger().querySelector('.flg-user-menu-name')).toBeNull();
    });

    it('gives className, style, disabled, ref and other props to the button', () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <UserMenu
          ref={ref}
          name="Ada Lovelace"
          className="mine"
          style={{ marginLeft: 3 }}
          disabled
          data-x="y"
        >
          <MenuItem>Profile</MenuItem>
        </UserMenu>,
      );
      expect(ref.current).toBe(trigger());
      expect(trigger()).toHaveClass('mine', 'flg-user-menu');
      expect(trigger()).toHaveStyle({ marginLeft: '3px' });
      expect(trigger()).toBeDisabled();
      expect(trigger()).toHaveAttribute('data-x', 'y');
    });

    it('keeps the name it makes, whatever a caller sends from JavaScript', () => {
      render(<Menu {...({ 'aria-label': 'Mine' } as object)} />);
      expect(trigger()).toHaveAccessibleName('Account: Ada Lovelace');
    });
  });

  describe('the initials', () => {
    it.each([
      ['Ada Lovelace', 'AL'],
      ['ada lovelace', 'AL'],
      ['Nguyễn Minh Anh', 'NA'],
      ['Plato', 'P'],
      ['  Mary   Jane  Watson ', 'MW'],
      ['😀 Bob', '😀B'],
    ])('are taken from the first and the last word of %j: %j', (name, initials) => {
      render(<Menu name={name} />);
      expect(trigger().querySelector('.flg-avatar')).toHaveTextContent(initials);
    });

    it.each([
      // ß has no capital of one letter in `toUpperCase()`: it is "SS", and the initial is its first.
      ['ßtefan Weiß', 'SW'],
      ['ßtefan', 'S'],
      // An accent written apart from its letter is one letter with it.
      ['émile zola', 'ÉZ'],
    ])('are one capital each, of one code point: %j is %j', (name, initials) => {
      render(<Menu name={name} />);
      expect(trigger().querySelector('.flg-avatar')!.textContent).toBe(initials);
      expect(header().querySelector('.flg-avatar')!.textContent).toBe(initials);
    });

    it('are replaced by avatar.fallback, which is how a Vietnamese name gets "MA"', () => {
      render(<Menu name="Nguyễn Minh Anh" avatar={{ fallback: 'MA' }} />);
      expect(trigger().querySelector('.flg-avatar')).toHaveTextContent('MA');
      expect(header().querySelector('.flg-avatar')).toHaveTextContent('MA');
    });

    it('give way to the person icon when the name has no letters to take', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Menu name=" " />);
      const avatar = trigger().querySelector('.flg-avatar')!;
      expect(avatar.textContent).toBe('');
      expect(avatar.querySelector('svg')).not.toBeNull();
    });
  });

  describe('the avatar', () => {
    it('is decorative in the button and in the header, whatever alt says', () => {
      render(<Menu avatar={{ src: 'https://example.test/a.png', alt: 'A photo' }} />);
      const avatars = [
        trigger().querySelector('.flg-avatar'),
        header().querySelector('.flg-avatar'),
      ];
      expect(avatars).toHaveLength(2);
      for (const avatar of avatars) {
        expect(avatar).toHaveAttribute('aria-hidden', 'true');
        expect(avatar!.querySelector('img')).toHaveAttribute('alt', '');
      }
      expect(screen.queryByRole('img')).toBeNull();
    });

    it('is not told its size by the caller', () => {
      render(<Menu avatar={{ ...({ size: 'sm' } as object) }} />);
      expect(trigger().querySelector('.flg-avatar')).toHaveAttribute('data-size', 'md');
    });
  });

  describe('the menu', () => {
    it('is named by the button, below it and lined up with its end', () => {
      render(<Menu />);
      expect(menu()).toHaveAttribute('aria-labelledby', trigger().id);
      expect(menu()).toHaveClass('flg-user-menu-content');
      expect(menu()).toHaveAttribute('data-side', 'bottom');
      expect(menu()).toHaveAttribute('data-align', 'end');
      expect(menu()).not.toHaveAttribute('data-show-name');
    });

    it('is the narrower one with showName', () => {
      render(<Menu showName />);
      expect(menu()).toHaveAttribute('data-show-name');
    });

    it('takes contentProps over its defaults, and keeps a default that is given as undefined', () => {
      const { rerender } = render(
        <Menu contentProps={{ align: 'start', side: 'top', className: 'mine' }} />,
      );
      expect(menu()).toHaveAttribute('data-align', 'start');
      expect(menu()).toHaveAttribute('data-side', 'top');
      expect(menu()).toHaveClass('flg-user-menu-content', 'mine');
      rerender(<Menu contentProps={{ align: undefined, side: undefined }} />);
      expect(menu()).toHaveAttribute('data-align', 'end');
      expect(menu()).toHaveAttribute('data-side', 'bottom');
    });

    it('has the items it is given after the header and a separator', () => {
      render(<Menu />);
      const items = within(menu()).getAllByRole('menuitem', { hidden: true });
      expect(items.map((item) => item.textContent)).toEqual(['Profile', 'Log out']);
      const children = Array.from(menu().children);
      expect(children[0]).toBe(header());
      // The one the component draws, then the one the caller wrote.
      expect(children[1]).toHaveAttribute('role', 'separator');
      expect(children[2]).toBe(items[0]);
    });

    it('opens when the button is pressed, and tells onOpenChange', async () => {
      const onOpenChange = vi.fn();
      render(<Menu onOpenChange={onOpenChange} />);
      await userEvent.setup().click(trigger());
      expect(trigger()).toHaveAttribute('aria-expanded', 'true');
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('can start open, and be controlled', () => {
      const { rerender } = render(<Menu defaultOpen />);
      expect(trigger()).toHaveAttribute('aria-expanded', 'true');
      rerender(<Menu open={false} />);
      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
      rerender(<Menu open />);
      expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('the header of the menu', () => {
    it('has the avatar, the name and the description, and is not an item of the menu', () => {
      render(<Menu description="ada@example.com" />);
      expect(header()).toHaveAttribute('role', 'presentation');
      expect(header().querySelector('.flg-avatar')).toHaveAttribute('data-size', 'lg');
      expect(header().querySelector('.flg-user-menu-title')).toHaveTextContent('Ada Lovelace');
      expect(header().querySelector('.flg-user-menu-description')).toHaveTextContent(
        'ada@example.com',
      );
      expect(header().closest('[role^="menuitem"]')).toBeNull();
      expect(header()).not.toHaveAttribute('tabindex');
      expect(header().querySelector('[tabindex], button, a')).toBeNull();
    });

    it('has a smaller avatar with showName', () => {
      render(<Menu showName />);
      expect(header().querySelector('.flg-avatar')).toHaveAttribute('data-size', 'md');
    });

    it('is the description of the menu, so the name and the line under it are read when it opens', () => {
      render(<Menu description="ada@example.com" />);
      expect(header().id).not.toBe('');
      expect(menu()).toHaveAttribute('aria-describedby', header().id);
      expect(menu()).toHaveAccessibleDescription('Ada Lovelace ada@example.com');
    });

    it('comes before the description of contentProps in aria-describedby, which is kept', () => {
      render(
        <>
          <p id="hint">Signed in</p>
          <Menu description="ada@example.com" contentProps={{ 'aria-describedby': 'hint' }} />
        </>,
      );
      expect(menu()).toHaveAttribute('aria-describedby', `${header().id} hint`);
      expect(menu()).toHaveAccessibleDescription('Ada Lovelace ada@example.com Signed in');
    });

    it.each([[undefined], [null], [false], ['']])('has no line for the description %j', (value) => {
      render(<Menu description={value} />);
      expect(header().querySelector('.flg-user-menu-description')).toBeNull();
    });

    it('has a line for the description 0, which is something to say', () => {
      render(<Menu description={0} />);
      expect(header().querySelector('.flg-user-menu-description')).toHaveTextContent('0');
    });
  });

  describe('a name that is missing', () => {
    it.each([[''], ['   ']])('warns once for %j, and still renders', (name) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { rerender } = render(<Menu name={name} />);
      rerender(<Menu name={name} showName />);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(NO_NAME);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('does not warn for a name', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Menu />);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('on the server', () => {
    it('renders in the browser what the server sent', async () => {
      const html = renderToString(<Menu showName description="ada@example.com" />);
      expect(html).toContain('aria-label="Account: Ada Lovelace"');
      expect(html).toContain('aria-haspopup="menu"');
      const host = document.createElement('div');
      host.innerHTML = html;
      document.body.append(host);
      const recoverable = vi.fn();
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      await act(async () => {
        hydrateRoot(host, <Menu showName description="ada@example.com" />, {
          onRecoverableError: recoverable,
        });
      });
      expect(recoverable).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(within(host).getByRole('button')).toHaveAccessibleName('Account: Ada Lovelace');
    });
  });
});
