import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { AppShellBrand } from './AppShellBrand';

beforeEach(() => {
  resetDevWarnings();
  vi.restoreAllMocks();
});

describe('AppShellBrand', () => {
  it('is a link to its home with an href: the logo hidden, the name as the text', () => {
    render(<AppShellBrand name="Lumen" logo={<i data-testid="mark" />} href="/home" />);
    const link = screen.getByRole('link', { name: 'Lumen' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/home');
    expect(link).toHaveClass('flg-app-shell-brand');
    const logo = link.querySelector('.flg-app-shell-brand-logo')!;
    expect(logo).toHaveAttribute('aria-hidden', 'true');
    expect(logo).toContainElement(screen.getByTestId('mark'));
    expect(link.querySelector('.flg-app-shell-brand-name')).toHaveTextContent('Lumen');
    // The logo comes first.
    expect(link.firstElementChild).toBe(logo);
  });

  it('is a span without an href, and then it is not a link', () => {
    const { container } = render(<AppShellBrand name="Lumen" />);
    expect(container.firstElementChild!.tagName).toBe('SPAN');
    expect(screen.queryByRole('link')).toBeNull();
    expect(container.firstElementChild).toHaveClass('flg-app-shell-brand');
  });

  it.each([undefined, null, false, '', []])('leaves out the logo for %j', (logo) => {
    const { container } = render(<AppShellBrand name="Lumen" logo={logo} />);
    expect(container.querySelector('.flg-app-shell-brand-logo')).toBeNull();
    expect(container.querySelector('.flg-app-shell-brand-name')).toHaveTextContent('Lumen');
  });

  it('keeps the class name, the props and the ref of the caller', () => {
    const ref = createRef<HTMLElement>();
    render(<AppShellBrand ref={ref} name="Lumen" href="/" className="mine" data-x="1" />);
    const link = screen.getByRole('link');
    expect(ref.current).toBe(link);
    expect(link).toHaveClass('flg-app-shell-brand', 'mine');
    expect(link).toHaveAttribute('data-x', '1');
  });

  describe('asChild', () => {
    it('renders the child with the class and with the logo and the name in it', () => {
      render(
        <AppShellBrand asChild logo="L" name="Lumen" className="mine">
          <a href="/router" data-router="">
            replaced
          </a>
        </AppShellBrand>,
      );
      const link = screen.getByRole('link', { name: 'Lumen' });
      // The child keeps its own props; the content is the library's.
      expect(link).toHaveAttribute('href', '/router');
      expect(link).toHaveAttribute('data-router');
      expect(link).toHaveClass('flg-app-shell-brand', 'mine');
      expect(link).not.toHaveTextContent('replaced');
      expect(link.querySelector('.flg-app-shell-brand-logo')).toHaveTextContent('L');
    });

    it('forwards the ref to the child', () => {
      const ref = createRef<HTMLElement>();
      render(
        <AppShellBrand ref={ref} asChild name="Lumen">
          <a href="/">x</a>
        </AppShellBrand>,
      );
      expect(ref.current).toBe(screen.getByRole('link'));
    });

    it('warns, and renders nothing, when the child is not a single element', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { container } = render(
        <AppShellBrand asChild name="Lumen">
          just text
        </AppShellBrand>,
      );
      expect(container).toBeEmptyDOMElement();
      expect(warn).toHaveBeenCalledWith(
        '[h2d-glass-ui] `asChild` expects exactly one React element as its child.',
      );
    });
  });
});
