'use client';

import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes, MouseEvent, ReactNode } from 'react';
import { strokeIcon } from '../../internal/icons';
import { useControllableState } from '../../internal/use-controllable-state';
import { IconButton } from '../icon-button/IconButton';
import { getPaginationRange, wholeNumber } from './pagination-range';

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** How many pages there are; below 1, or not a finite number, counts as 1. */
  count: number;
  /** The current page; not a finite number counts as 1. Pass it with `onPageChange` to control it. */
  page?: number;
  /** The page at first, when uncontrolled. Default 1. */
  defaultPage?: number;
  /** Called with the page the user goes to. */
  onPageChange?: (page: number) => void;
  /** Pages shown on each side of the current one. Default 1. */
  siblingCount?: number;
  /** Pages always shown at each end. Default 1. */
  boundaryCount?: number;
  /** Makes every page a link to this address; the browser follows it as usual. */
  getHref?: (page: number) => string;
  /** Default `"Previous page"`. */
  previousLabel?: string;
  /** Default `"Next page"`. */
  nextLabel?: string;
  /** The accessible name of a page. Default `` (page) => `Page ${page}` ``. */
  getPageLabel?: (page: number) => string;
}

const icon = (path: string) => (
  <svg {...strokeIcon}>
    <path d={path} />
  </svg>
);
const PREVIOUS = icon('m15 18-6-6 6-6');
const NEXT = icon('m9 18 6-6-6-6');

const defaultPageLabel = (page: number) => `Page ${page}`;

/**
 * A link click that the browser does not follow in this tab: with Ctrl, Cmd, Shift or Alt (a new tab
 * or window, a download), with another button, or cancelled by a handler. The page stays.
 */
const leftToBrowser = (event: MouseEvent) =>
  event.defaultPrevented ||
  event.button !== 0 ||
  event.ctrlKey ||
  event.metaKey ||
  event.shiftKey ||
  event.altKey;

/**
 * Moves between the pages of a list: previous and next, the pages at the ends and around the
 * current one, and an ellipsis for the rest. Buttons by default; links with `getHref`.
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    count,
    page: pageProp,
    defaultPage = 1,
    onPageChange,
    siblingCount = 1,
    boundaryCount = 1,
    getHref,
    previousLabel = 'Previous page',
    nextLabel = 'Next page',
    getPageLabel = defaultPageLabel,
    className,
    'aria-label': ariaLabel,
    ...props
  },
  ref,
) {
  const [value, setValue] = useControllableState({
    value: pageProp,
    defaultValue: defaultPage,
    onChange: onPageChange,
    name: 'Pagination',
  });
  const total = Math.max(1, wholeNumber(count));
  const current = Math.min(Math.max(wholeNumber(value), 1), total);
  const follow = (page: number) => (event: MouseEvent) => {
    if (!leftToBrowser(event)) setValue(page);
  };
  const items = getPaginationRange({ count: total, page: current, siblingCount, boundaryCount });

  const step = (target: number, label: string, glyph: ReactNode) => {
    const atEnd = target < 1 || target > total;
    const shared = { variant: 'ghost', size: 'sm', 'aria-label': label } as const;
    if (!getHref) {
      return (
        <IconButton {...shared} disabled={atEnd} onClick={() => setValue(target)}>
          {glyph}
        </IconButton>
      );
    }
    // A link at an end leads nowhere: no href, and `aria-disabled` (from the disabled Button).
    return (
      <IconButton {...shared} asChild disabled={atEnd}>
        {atEnd ? (
          // Spec §6.3: at an end the link has no href, so it is neither followed nor focused.
          // eslint-disable-next-line jsx-a11y/anchor-is-valid
          <a>{glyph}</a>
        ) : (
          <a href={getHref(target)} onClick={follow(target)}>
            {glyph}
          </a>
        )}
      </IconButton>
    );
  };

  return (
    <nav
      ref={ref}
      aria-label={ariaLabel ?? 'Pagination'}
      className={clsx('flg-pagination', className)}
      {...props}
    >
      {step(current - 1, previousLabel, PREVIOUS)}
      {items.map((item) => {
        if (typeof item !== 'number') {
          return (
            <span key={item} className="flg-pagination-ellipsis" aria-hidden="true">
              …
            </span>
          );
        }
        const shared = {
          className: 'flg-pagination-page',
          'aria-label': getPageLabel(item),
          'aria-current': item === current ? ('page' as const) : undefined,
        };
        return getHref ? (
          <a key={item} href={getHref(item)} onClick={follow(item)} {...shared}>
            {item}
          </a>
        ) : (
          <button key={item} type="button" onClick={() => setValue(item)} {...shared}>
            {item}
          </button>
        );
      })}
      {step(current + 1, nextLabel, NEXT)}
    </nav>
  );
});
