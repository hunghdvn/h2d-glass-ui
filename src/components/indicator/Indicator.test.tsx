import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Indicator } from './Indicator';

const mark = (container: HTMLElement) => container.querySelector('.flg-indicator-mark');

describe('Indicator', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  describe('structure', () => {
    it('wraps its child and puts an aria-hidden mark after it, as the spec draws it', () => {
      const ref = createRef<HTMLSpanElement>();
      const { container } = render(
        <Indicator ref={ref} count={3} className="mine" style={{ margin: 4 }} data-testid="root">
          <button type="button">Bell</button>
        </Indicator>,
      );
      const root = container.firstElementChild as HTMLElement;
      expect(ref.current).toBe(root);
      expect(root.tagName).toBe('SPAN');
      expect(root).toHaveClass('flg-indicator', 'mine');
      expect(root).toHaveStyle({ margin: '4px' });
      expect(root).toHaveAttribute('data-testid', 'root');
      expect([...root.children].map((child) => child.tagName)).toEqual(['BUTTON', 'SPAN']);
      const badge = root.lastElementChild as HTMLElement;
      expect(badge).toHaveClass('flg-indicator-mark');
      expect(badge).toHaveAttribute('aria-hidden', 'true');
      expect(badge).toHaveAttribute('data-status', 'accent');
      expect(badge).toHaveTextContent('3');
    });

    it('is only seen: the button keeps the name its caller gave it, without the number', () => {
      render(
        <Indicator count={3}>
          <button type="button" aria-label="Notifications, 3 unread">
            Bell
          </button>
        </Indicator>,
      );
      expect(screen.getByRole('button', { name: 'Notifications, 3 unread' })).toBeInTheDocument();
      expect(screen.getByText('3')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('what shows', () => {
    it('shows the count, and nothing for none, for 0 and for a negative or lost number', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const shows = (count: number | undefined) => {
        const { container, unmount } = render(
          <Indicator count={count}>
            <i />
          </Indicator>,
        );
        const text = mark(container)?.textContent ?? null;
        unmount();
        return text;
      };
      expect(shows(1)).toBe('1');
      expect(shows(42)).toBe('42');
      expect(shows(undefined)).toBeNull();
      expect(shows(0)).toBeNull();
      expect(shows(-3)).toBeNull();
      expect(shows(Number.NaN)).toBeNull();
      expect(shows(Number.POSITIVE_INFINITY)).toBeNull();
      expect(warn).toHaveBeenCalled();
    });

    it('shows 0 with showZero', () => {
      const { container } = render(
        <Indicator count={0} showZero>
          <i />
        </Indicator>,
      );
      expect(mark(container)).toHaveTextContent('0');
    });

    it('writes a count past max as max+, and a count at max in full', () => {
      const { container, rerender } = render(
        <Indicator count={99}>
          <i />
        </Indicator>,
      );
      expect(mark(container)?.textContent).toBe('99');
      rerender(
        <Indicator count={100}>
          <i />
        </Indicator>,
      );
      expect(mark(container)?.textContent).toBe('99+');
      rerender(
        <Indicator count={10} max={9}>
          <i />
        </Indicator>,
      );
      expect(mark(container)?.textContent).toBe('9+');
      rerender(
        <Indicator count={1500} max={999}>
          <i />
        </Indicator>,
      );
      expect(mark(container)?.textContent).toBe('999+');
    });

    it('writes plain digits, whatever the language of the page', () => {
      const { container } = render(
        <Indicator count={1234} max={9999} lang="ar">
          <i />
        </Indicator>,
      );
      expect(mark(container)?.textContent).toBe('1234');
    });

    it('shows a dot with no text, and reads no count then', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { container } = render(
        <Indicator dot count={Number.NaN} max={-1}>
          <i />
        </Indicator>,
      );
      const dot = mark(container);
      expect(dot).toHaveAttribute('data-dot');
      expect(dot).toBeEmptyDOMElement();
      expect(dot).toHaveAttribute('aria-hidden', 'true');
      expect(warn).not.toHaveBeenCalled();
    });

    it('shows a dot for a count of 0, which a number would not', () => {
      const { container } = render(
        <Indicator dot count={0}>
          <i />
        </Indicator>,
      );
      expect(mark(container)).toHaveAttribute('data-dot');
    });

    it('hides the mark with show={false}, dot or number, and keeps the child and the wrapper', () => {
      const ref = createRef<HTMLSpanElement>();
      const { container } = render(
        <Indicator ref={ref} show={false} count={5} dot>
          <button type="button">Bell</button>
        </Indicator>,
      );
      expect(mark(container)).toBeNull();
      expect(screen.getByRole('button', { name: 'Bell' })).toBeInTheDocument();
      expect(ref.current).toHaveClass('flg-indicator');
    });

    it('keeps the child mounted, with its focus, while the mark comes and goes', () => {
      const { rerender } = render(
        <Indicator count={0}>
          <button type="button">Bell</button>
        </Indicator>,
      );
      const button = screen.getByRole('button');
      button.focus();
      rerender(
        <Indicator count={3}>
          <button type="button">Bell</button>
        </Indicator>,
      );
      expect(screen.getByRole('button')).toBe(button);
      expect(button).toHaveFocus();
      rerender(
        <Indicator count={3} show={false}>
          <button type="button">Bell</button>
        </Indicator>,
      );
      expect(screen.getByRole('button')).toBe(button);
      expect(button).toHaveFocus();
    });

    it('rounds a count that is not whole down', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { container, rerender } = render(
        <Indicator count={3.9}>
          <i />
        </Indicator>,
      );
      expect(mark(container)?.textContent).toBe('3');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('rounded down'));
      rerender(
        <Indicator count={0.5}>
          <i />
        </Indicator>,
      );
      expect(mark(container)).toBeNull();
    });

    it('follows a change of count on a mounted Indicator', () => {
      const { container, rerender } = render(
        <Indicator count={2}>
          <i />
        </Indicator>,
      );
      const root = container.firstElementChild;
      expect(mark(container)).toHaveTextContent('2');
      rerender(
        <Indicator count={120}>
          <i />
        </Indicator>,
      );
      expect(mark(container)).toHaveTextContent('99+');
      rerender(
        <Indicator count={0}>
          <i />
        </Indicator>,
      );
      expect(mark(container)).toBeNull();
      expect(container.firstElementChild).toBe(root);
    });
  });

  describe('status', () => {
    it.each(['accent', 'danger', 'success', 'warning'] as const)('reflects status %s', (status) => {
      const { container } = render(
        <Indicator count={1} status={status}>
          <i />
        </Indicator>,
      );
      expect(mark(container)).toHaveAttribute('data-status', status);
    });

    it('is accent by default, as the mockup of the rail draws it', () => {
      const { container } = render(
        <Indicator dot>
          <i />
        </Indicator>,
      );
      expect(mark(container)).toHaveAttribute('data-status', 'accent');
    });

    it('takes a status outside the union as the default, with no stray value in the DOM', () => {
      const { container } = render(
        <Indicator count={1} status={'info' as never}>
          <i />
        </Indicator>,
      );
      expect(mark(container)).toHaveAttribute('data-status', 'accent');
    });
  });

  describe('accessibility', () => {
    it('keeps the mark aria-hidden whatever the caller passes', () => {
      const { container } = render(
        <Indicator count={3} aria-hidden={false} role="status" aria-label="3 unread">
          <i />
        </Indicator>,
      );
      expect(mark(container)).toHaveAttribute('aria-hidden', 'true');
      // The caller's own props go on the wrapper, as on any component.
      expect(container.firstElementChild).toHaveAttribute('aria-label', '3 unread');
    });
  });

  describe('warnings', () => {
    it('warns about a max that is not a positive integer, and uses 99', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      for (const bad of [0, -5, 2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
        resetDevWarnings();
        warn.mockClear();
        const { container, unmount } = render(
          <Indicator count={120} max={bad}>
            <i />
          </Indicator>,
        );
        expect(mark(container)).toHaveTextContent('99+');
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(
          expect.stringContaining('max must be a positive integer'),
        );
        unmount();
      }
    });

    it('warns about a count that is not a finite number of 0 or more', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Indicator count={-2}>
          <i />
        </Indicator>,
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('count must be a finite number'));
    });

    it('prints the same text for every value, so a changing count is not a new warning', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { rerender } = render(
        <Indicator count={-1}>
          <i />
        </Indicator>,
      );
      for (const count of [-2, -3, Number.NaN]) {
        rerender(
          <Indicator count={count}>
            <i />
          </Indicator>,
        );
      }
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('does not warn about a count or a max that is not read, because of `show`', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Indicator count={-1} max={0} show={false}>
          <i />
        </Indicator>,
      );
      expect(warn).not.toHaveBeenCalled();
    });

    it('does not warn for valid props', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Indicator count={7} max={9} status="danger">
          <i />
        </Indicator>,
      );
      expect(warn).not.toHaveBeenCalled();
    });
  });
});
