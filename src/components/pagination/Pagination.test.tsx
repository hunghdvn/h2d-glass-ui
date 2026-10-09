import { fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

const pages = (nav: HTMLElement) =>
  Array.from(nav.querySelectorAll('.flg-pagination-page, .flg-pagination-ellipsis'), (el) =>
    el.classList.contains('flg-pagination-ellipsis') ? '…' : el.textContent,
  ).join(' ');

describe('Pagination', () => {
  afterEach(() => vi.restoreAllMocks());

  it('names the pages and marks the current one', () => {
    render(<Pagination count={12} defaultPage={5} />);
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(pages(nav)).toBe('1 … 4 5 6 … 12');
    expect(within(nav).getByRole('button', { name: 'Page 5' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('button', { name: 'Page 4' })).not.toHaveAttribute('aria-current');
    for (const ellipsis of nav.querySelectorAll('.flg-pagination-ellipsis')) {
      expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
    }
    expect(within(nav).getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(within(nav).getByRole('button', { name: 'Next page' })).toBeEnabled();
  });

  it('goes to a page, and to the previous and next ones, which do nothing at the ends', () => {
    const onPageChange = vi.fn();
    render(<Pagination count={3} onPageChange={onPageChange} />);
    const previous = screen.getByRole('button', { name: 'Previous page' });
    const next = screen.getByRole('button', { name: 'Next page' });
    // `aria-disabled`, not `disabled`: the button keeps the focus of whoever pressed it to get here.
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    expect(previous).toBeEnabled();
    fireEvent.click(previous);
    expect(onPageChange).not.toHaveBeenCalled();
    fireEvent.click(next);
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    expect(previous).not.toHaveAttribute('aria-disabled');
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    expect(next).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(next);
    // The current page again changes nothing.
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).toHaveBeenCalledTimes(2);
  });

  it('shows as many pages at the ends and around the current one as asked', () => {
    render(<Pagination count={20} defaultPage={10} siblingCount={2} boundaryCount={2} />);
    expect(pages(screen.getByRole('navigation'))).toBe('1 2 … 8 9 10 11 12 … 19 20');
  });

  it('reports a page to a controlled parent and shows the page it gives', () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination count={10} page={2} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    rerender(<Pagination count={10} page={10} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: 'Page 10' })).toHaveAttribute('aria-current', 'page');
  });

  it('keeps the page and the count within range', () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination count={0} page={7} onPageChange={onPageChange} />);
    const nav = screen.getByRole('navigation');
    expect(pages(nav)).toBe('1');
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Next page' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    // A number that is not finite counts as 1: `Number()` of a missing `?page=` is NaN.
    const getHref = (page: number) => `#page-${page}`;
    rerender(<Pagination count={10} page={NaN} getHref={getHref} onPageChange={onPageChange} />);
    expect(pages(nav)).toBe('1 2 3 4 5 … 10');
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Previous page' })).not.toHaveAttribute('href');
    const next = screen.getByRole('link', { name: 'Next page' });
    expect(next).toHaveAttribute('href', '#page-2');
    fireEvent.click(next);
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    rerender(
      <Pagination count={NaN} page={Infinity} getHref={getHref} onPageChange={onPageChange} />,
    );
    expect(pages(nav)).toBe('1');
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Next page' })).not.toHaveAttribute('href');
    rerender(
      <Pagination
        count={12}
        page={5}
        siblingCount={NaN}
        boundaryCount={Infinity}
        onPageChange={onPageChange}
      />,
    );
    expect(pages(nav)).toBe('1 … 4 5 6 … 12');
    expect(screen.getByRole('button', { name: 'Page 5' })).toHaveAttribute('aria-current', 'page');
  });

  it('renders links with getHref, and links at the ends that lead nowhere', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination count={5} getHref={(page) => `#page-${page}`} onPageChange={onPageChange} />,
    );
    const page2 = screen.getByRole('link', { name: 'Page 2' });
    expect(page2).toHaveAttribute('href', '#page-2');
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    const next = screen.getByRole('link', { name: 'Next page' });
    expect(next).toHaveAttribute('href', '#page-2');
    // With no href an <a> has no role of its own: the link at an end says it is one.
    const previous = screen.getByRole('link', { name: 'Previous page' });
    expect(previous.tagName).toBe('A');
    expect(previous).not.toHaveAttribute('href');
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    // At the first page, the previous link goes nowhere.
    fireEvent.click(previous);
    expect(onPageChange).not.toHaveBeenCalled();
    fireEvent.click(page2);
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    expect(previous).toHaveAttribute('href', '#page-1');
  });

  it('leaves a link click with a modifier key, or another button, to the browser', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination count={5} getHref={(page) => `#page-${page}`} onPageChange={onPageChange} />,
    );
    const page2 = screen.getByRole('link', { name: 'Page 2' });
    const next = screen.getByRole('link', { name: 'Next page' });
    // These open the page in a new tab or window, or save it: this one stays where it is.
    for (const init of [
      { ctrlKey: true },
      { metaKey: true },
      { shiftKey: true },
      { altKey: true },
      { button: 1 },
    ]) {
      fireEvent.click(page2, init);
      fireEvent.click(next, init);
    }
    // Nor does a click that a handler has cancelled.
    const nav = screen.getByRole('navigation');
    const cancel = (event: Event) => event.preventDefault();
    nav.addEventListener('click', cancel, true);
    fireEvent.click(page2);
    nav.removeEventListener('click', cancel, true);
    expect(onPageChange).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(page2);
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    expect(page2).toHaveAttribute('aria-current', 'page');
  });

  it('goes to the page on any click of a button, which has no new tab', () => {
    const onPageChange = vi.fn();
    render(<Pagination count={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }), { ctrlKey: true });
    expect(onPageChange).toHaveBeenLastCalledWith(2);
  });

  it('takes its own labels', () => {
    render(
      <Pagination
        count={3}
        aria-label="Results pages"
        previousLabel="Back"
        nextLabel="Forward"
        getPageLabel={(page) => `Results page ${page}`}
      />,
    );
    const nav = screen.getByRole('navigation', { name: 'Results pages' });
    expect(within(nav).getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Forward' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Results page 2' })).toBeInTheDocument();
  });

  it('renders on the server', () => {
    const html = renderToString(<Pagination count={12} defaultPage={5} />);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-label="Pagination"');
  });
});
