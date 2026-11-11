import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { isNumber } from '../../internal/number';
import { devWarn } from '../../internal/warn';

export type IndicatorStatus = 'accent' | 'danger' | 'success' | 'warning';

export type IndicatorProps = HTMLAttributes<HTMLSpanElement> & {
  /** The number to show, such as the unread count. Nothing shows for 0, unless `showZero`. */
  count?: number;
  /** The largest number written out; a bigger count shows as `99+`. Default 99. */
  max?: number;
  /** Shows a small dot with no number (and no `count` is read). Default false. */
  dot?: boolean;
  /** Shows the mark for a count of 0. Default false. */
  showZero?: boolean;
  /** `false` hides the mark whatever the other props say. The children stay. Default true. */
  show?: boolean;
  /**
   * The colour of the mark. `accent` is the default: the Indicator is not only for the bell (the
   * count of a navigation rail, a dot on an avatar), and the neutral colour of the library is the
   * accent. Pass `danger` where the unread count is urgent, as on a bell.
   */
  status?: IndicatorStatus;
  /** The one element the mark sits on, such as an icon button or an avatar. */
  children: ReactNode;
};

const STATUSES: readonly IndicatorStatus[] = ['accent', 'danger', 'success', 'warning'];
// A value outside the union (from JavaScript) is the default one. Searching the list returns the
// member itself, so there is no cast to hide what the caller passed.
const toStatus = (status: string): IndicatorStatus =>
  STATUSES.find((known) => known === status) ?? 'accent';

/**
 * A mark on the corner of an element: a number, "99+" or a dot. It is only for the eyes, so it is
 * always `aria-hidden`: the number must be in the name of the element it sits on (an icon button
 * that says "Notifications, 3 unread"). Safe to render in React Server Components.
 *
 * The wrapper is there whatever shows, so the element inside keeps its place in the tree, and so
 * its focus, when the mark comes and goes.
 */
export const Indicator = forwardRef<HTMLSpanElement, IndicatorProps>(function Indicator(
  {
    count,
    max: maxProp = 99,
    dot = false,
    showZero = false,
    show = true,
    status = 'accent',
    children,
    className,
    ...props
  },
  ref,
) {
  // The warnings are about what is shown: a count nobody reads, because of `dot` or `show`, is no
  // mistake. `devWarn` prints each text once, so a render that repeats it is not a flood.
  const reading = show && !dot;
  const maxValid = Number.isInteger(maxProp) && maxProp > 0;
  const max = maxValid ? maxProp : 99;
  if (reading && !maxValid) {
    devWarn('Indicator: max must be a positive integer; using 99.');
  }

  let text: string | null = null;
  if (reading && count !== undefined) {
    if (!isNumber(count) || count < 0) {
      devWarn('Indicator: count must be a finite number, 0 or more; no number is shown.');
    } else {
      if (!Number.isInteger(count))
        devWarn('Indicator: count is not an integer; it is rounded down.');
      const whole = Math.floor(count);
      if (whole > 0 || (whole === 0 && showZero)) text = whole > max ? `${max}+` : String(whole);
    }
  }

  const mark =
    show && (dot || text !== null) ? (
      // After the props of the caller, which go on the wrapper: nothing can make the mark readable.
      <span
        className="flg-indicator-mark"
        data-status={toStatus(status)}
        data-dot={dataAttr(dot)}
        aria-hidden="true"
      >
        {dot ? null : text}
      </span>
    ) : null;

  return (
    <span {...props} ref={ref} className={clsx('flg-indicator', className)}>
      {children}
      {mark}
    </span>
  );
});
