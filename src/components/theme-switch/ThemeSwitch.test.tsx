import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
import { ThemeSwitch } from './ThemeSwitch';

// jsdom has no Popover API: which popovers show is kept here, for the tooltip.
const showing = new Set<Element>();
const original = {
  showPopover: HTMLElement.prototype.showPopover,
  hidePopover: HTMLElement.prototype.hidePopover,
  matches: Element.prototype.matches,
};
beforeEach(() => {
  resetDevWarnings();
  showing.clear();
  HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
    showing.add(this);
  };
  HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
    showing.delete(this);
  };
  Element.prototype.matches = function matches(this: Element, selector: string) {
    return selector === ':popover-open' ? showing.has(this) : original.matches.call(this, selector);
  } as typeof Element.prototype.matches;
});
afterEach(() => {
  Object.assign(HTMLElement.prototype, {
    showPopover: original.showPopover,
    hidePopover: original.hidePopover,
  });
  Element.prototype.matches = original.matches;
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
  document.documentElement.removeAttribute('data-flg-theme');
  document.body.replaceChildren();
});

const button = () => screen.getByRole('button');
const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]')!;
const html = () => document.documentElement.getAttribute('data-flg-theme');

describe('ThemeSwitch', () => {
  describe('the button', () => {
    it('is a ghost icon button of the library, named "Theme: <value>", with System as the default', () => {
      render(<ThemeSwitch />);
      expect(button()).toHaveClass('flg-button', 'flg-theme-switch');
      expect(button()).toHaveAttribute('data-variant', 'ghost');
      expect(button()).toHaveAttribute('data-size', 'md');
      expect(button()).toHaveAttribute('data-icon-only');
      expect(button()).toHaveAttribute('type', 'button');
      expect(button()).toHaveAccessibleName('Theme: System');
      expect(button()).toHaveAttribute('data-value', 'system');
    });

    it('has the three icons in the DOM, all hidden, for the CSS to choose from', () => {
      render(<ThemeSwitch />);
      const icons = [...button().querySelectorAll<SVGElement>('svg.flg-theme-switch-icon')];
      expect(icons.map((icon) => icon.getAttribute('data-for'))).toEqual([
        'light',
        'dark',
        'system',
      ]);
      for (const icon of icons) expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('goes round light, dark, system, light, and says the value it has each time', async () => {
      const user = userEvent.setup();
      render(<ThemeSwitch defaultValue="light" />);
      const seen: Array<[string | null, string | null]> = [];
      for (let i = 0; i < 4; i++) {
        seen.push([button().getAttribute('aria-label'), html()]);
        await user.click(button());
      }
      expect(seen).toEqual([
        // Nothing is stored, so the default value is what the page gets, as the value of a first visit.
        ['Theme: Light', 'light'],
        ['Theme: Dark', 'dark'],
        ['Theme: System', null],
        ['Theme: Light', 'light'],
      ]);
    });

    it('takes its words from labels, and keeps the default for one given as undefined', () => {
      const { rerender } = render(
        <ThemeSwitch
          value="dark"
          labels={{
            dark: 'Tối',
            trigger: (current) => `Giao diện: ${current}`,
            hint: (next) => `Bấm để đổi sang ${next}`,
          }}
        />,
      );
      expect(button()).toHaveAccessibleName('Giao diện: Tối');
      // The next value is said with the word for it, which here is the default.
      expect(button()).toHaveAccessibleDescription('Bấm để đổi sang System');
      rerender(<ThemeSwitch value="dark" labels={{ trigger: undefined, dark: undefined }} />);
      expect(button()).toHaveAccessibleName('Theme: Dark');
    });

    it('is described by a hidden hint that names the next value, and by that only', () => {
      render(<ThemeSwitch value="light" />);
      expect(button()).toHaveAccessibleDescription('Click to switch to Dark');
      const hint = document.getElementById(button().getAttribute('aria-describedby')!)!;
      expect(hint).toHaveAttribute('hidden');
      expect(hint).toHaveTextContent('Click to switch to Dark');
      // The tooltip says the same and more: it must not be read as a second description.
      expect(button().getAttribute('aria-describedby')).not.toContain(tooltip().id);
    });

    it('keeps the aria-describedby of the caller after the hint', () => {
      render(
        <>
          <p id="own">Mine</p>
          <ThemeSwitch value="light" aria-describedby="own" />
        </>,
      );
      expect(button()).toHaveAccessibleDescription('Click to switch to Dark Mine');
    });

    it('passes className, style, disabled and data attributes to the button, and ref points to it', () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <ThemeSwitch ref={ref} className="mine" style={{ color: 'red' }} data-x="1" disabled />,
      );
      expect(ref.current).toBe(button());
      expect(button()).toHaveClass('flg-theme-switch', 'mine');
      expect(button()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
      expect(button()).toHaveAttribute('data-x', '1');
      expect(button()).toBeDisabled();
    });

    it('runs the onClick of the caller first, and does not switch when it prevents the default', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn((event: { preventDefault(): void }) => event.preventDefault());
      render(<ThemeSwitch defaultValue="light" onClick={onClick} />);
      await user.click(button());
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(button()).toHaveAccessibleName('Theme: Light');
      expect(localStorage.getItem('flg-theme')).toBeNull();
    });
  });

  describe('the tooltip', () => {
    it('says the value and the next one, below the button and lined up with its end', () => {
      render(<ThemeSwitch value="light" />);
      expect(tooltip()).toHaveTextContent('Theme: Light · click to switch to Dark');
      expect(tooltip()).toHaveAttribute('data-side', 'bottom');
      expect(tooltip()).toHaveAttribute('data-align', 'end');
    });

    it('follows labels.tooltip', () => {
      render(<ThemeSwitch value="dark" labels={{ tooltip: (c, n) => `${c} -> ${n}` }} />);
      expect(tooltip()).toHaveTextContent('Dark -> System');
    });

    it('opens when the pointer rests on the button, and closes when it leaves', () => {
      vi.useFakeTimers();
      render(<ThemeSwitch value="light" />);
      fireEvent.pointerEnter(button(), { pointerType: 'mouse' });
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(showing.has(tooltip())).toBe(true);
      fireEvent.pointerLeave(button(), { pointerType: 'mouse' });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(showing.has(tooltip())).toBe(false);
    });
  });

  describe('uncontrolled', () => {
    it('reads the stored value after mount', () => {
      localStorage.setItem('flg-theme', 'dark');
      render(<ThemeSwitch />);
      expect(button()).toHaveAccessibleName('Theme: Dark');
      expect(button()).toHaveAttribute('data-value', 'dark');
      expect(html()).toBe('dark');
    });

    it('writes a choice under its storageKey and under no other', async () => {
      const user = userEvent.setup();
      render(<ThemeSwitch storageKey="my-theme" defaultValue="light" />);
      await user.click(button());
      expect(localStorage.getItem('my-theme')).toBe('dark');
      expect(localStorage.getItem('flg-theme')).toBeNull();
      expect(html()).toBe('dark');
    });

    it('calls onValueChange with the value it switched to', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<ThemeSwitch defaultValue="light" onValueChange={onValueChange} />);
      await user.click(button());
      await user.click(button());
      expect(onValueChange.mock.calls).toEqual([['dark'], ['system']]);
    });

    it('goes on working when localStorage throws', async () => {
      const user = userEvent.setup();
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError');
      });
      render(<ThemeSwitch defaultValue="light" />);
      await user.click(button());
      expect(button()).toHaveAccessibleName('Theme: Dark');
      expect(html()).toBe('dark');
    });

    it('keeps two switches of one key in step, and tells them from a switch of another key', async () => {
      const user = userEvent.setup();
      render(
        <>
          <ThemeSwitch data-testid="a" defaultValue="light" />
          <ThemeSwitch data-testid="b" defaultValue="light" />
          <ThemeSwitch data-testid="c" storageKey="other" defaultValue="light" />
        </>,
      );
      await user.click(screen.getByTestId('a'));
      expect(screen.getByTestId('a')).toHaveAccessibleName('Theme: Dark');
      expect(screen.getByTestId('b')).toHaveAccessibleName('Theme: Dark');
      expect(screen.getByTestId('c')).toHaveAccessibleName('Theme: Light');
    });

    it('follows a change that another tab makes', () => {
      render(<ThemeSwitch />);
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'flg-theme',
            newValue: 'dark',
            storageArea: localStorage,
          }),
        );
      });
      expect(button()).toHaveAccessibleName('Theme: Dark');
      expect(html()).toBe('dark');
    });
  });

  describe('controlled', () => {
    it('shows the value it is given and reports a click, and never touches <html> or localStorage', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const set = vi.spyOn(Storage.prototype, 'setItem');
      const { rerender } = render(<ThemeSwitch value="dark" onValueChange={onValueChange} />);
      expect(button()).toHaveAccessibleName('Theme: Dark');
      await user.click(button());
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('system');
      expect(button()).toHaveAccessibleName('Theme: Dark');
      expect(set).not.toHaveBeenCalled();
      expect(html()).toBeNull();
      rerender(<ThemeSwitch value="system" onValueChange={onValueChange} />);
      expect(button()).toHaveAccessibleName('Theme: System');
    });

    it('has no data-pending, and renders defaultValue on the server as an uncontrolled one does', () => {
      const markup = renderToString(<ThemeSwitch value="dark" />);
      expect(markup).not.toContain('data-pending');
      expect(markup).toContain('data-value="system"');
      expect(markup).toContain('aria-label="Theme: System"');
      // An application that knows the theme on the server passes it as defaultValue too.
      expect(renderToString(<ThemeSwitch value="dark" defaultValue="dark" />)).toContain(
        'data-value="dark"',
      );
    });
  });

  describe('before hydration', () => {
    it('is rendered with the default value and data-pending, which the CSS reads the icon from <html> by', () => {
      localStorage.setItem('flg-theme', 'dark');
      const markup = renderToString(<ThemeSwitch />);
      expect(markup).toContain('data-value="system"');
      expect(markup).toContain('data-pending=""');
      expect(markup).toContain('aria-label="Theme: System"');
    });

    it('drops data-pending at the first effect, with the stored value shown, and warns of no mismatch', async () => {
      const markup = renderToString(<ThemeSwitch />);
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const recoverable = vi.fn();
      localStorage.setItem('flg-theme', 'dark');
      const container = document.createElement('div');
      container.innerHTML = markup;
      document.body.append(container);
      const server = container.querySelector('button')!;
      expect(server).toHaveAttribute('data-pending');
      let root!: ReturnType<typeof hydrateRoot>;
      await act(async () => {
        root = hydrateRoot(container, <ThemeSwitch />, { onRecoverableError: recoverable });
      });
      expect(error).not.toHaveBeenCalled();
      expect(recoverable).not.toHaveBeenCalled();
      // The same element: hydration kept it.
      expect(container.querySelector('button')).toBe(server);
      expect(server).not.toHaveAttribute('data-pending');
      expect(server).toHaveAttribute('data-value', 'dark');
      expect(server).toHaveAttribute('aria-label', 'Theme: Dark');
      act(() => root.unmount());
      container.remove();
    });

    it('has no data-pending in a page that is not hydrating', () => {
      render(<ThemeSwitch />);
      expect(button()).not.toHaveAttribute('data-pending');
    });
  });

  it('warns of nothing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<ThemeSwitch />);
    expect(warn.mock.calls.filter(([text]) => String(text).startsWith(WARN_PREFIX))).toEqual([]);
  });
});
