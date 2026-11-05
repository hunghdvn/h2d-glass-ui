'use client';

import { clsx } from 'clsx';
import { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FocusEvent, HTMLAttributes, KeyboardEvent } from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import {
  addDays,
  addMonths,
  addYears,
  clampIso,
  compareIso,
  endOfWeek,
  formatDate,
  formatMonthYear,
  isIsoDate,
  isIsoMonth,
  isoMonthOf,
  isSameMonth,
  isUnavailable,
  monthGrid,
  startOfWeek,
  todayIso,
  weekdayNames,
} from '../../internal/date';
import { checkedIso, checkedLimits } from '../../internal/date-props';
import { ChevronIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';
import { hasModifier } from '../../internal/roving';
import { useControllableState } from '../../internal/use-controllable-state';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { devWarn } from '../../internal/warn';
import { IconButton } from '../icon-button/IconButton';

/** The words the calendar says itself; translate them with the rest of the page. */
export interface CalendarLabels {
  /** Default `"Previous month"`. */
  previousMonth?: string;
  /** Default `"Next month"`. */
  nextMonth?: string;
}

type CalendarBaseProps = Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> & {
  /** The month shown, `'YYYY-MM'`. Pass it with `onMonthChange` to control it. */
  month?: string;
  /** The month shown at first, when `month` is not controlled. */
  defaultMonth?: string;
  /** Called with the month the user goes to, by the buttons or by the keys. */
  onMonthChange?: (month: string) => void;
  /** The first date that can be chosen, `'YYYY-MM-DD'`. Earlier dates are shown but cannot be chosen. */
  min?: string;
  /** The last date that can be chosen, `'YYYY-MM-DD'`. */
  max?: string;
  /** Marks a date that cannot be chosen, for example a day that is fully booked. */
  isDateUnavailable?: (date: string) => boolean;
  /** The day the week starts on, 0 (Sunday) to 6 (Saturday). Default 0, for every locale. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** BCP 47 locale of the month, the weekdays and the day names. Default `"en-US"`. */
  locale?: string;
  /**
   * The date to call today, `'YYYY-MM-DD'`. Without it today is read from the clock after the first
   * render, so the server cannot mark it. Pass it in tests and demos so that nothing changes with the
   * day they run.
   */
  today?: string;
  /** The words of the buttons. */
  labels?: CalendarLabels;
};

/** The two ends of a range, `['2026-11-12', '2026-11-16']`, the first not after the second. */
export type CalendarRange = [string, string];

export type CalendarProps =
  | (CalendarBaseProps & {
      /** One date (the default) or a range of dates. */
      mode?: 'single';
      /** The chosen date, `'YYYY-MM-DD'`; `null` is no date. Pass it with `onValueChange` to control it. */
      value?: string | null;
      /** The chosen date at first, when `value` is not controlled. */
      defaultValue?: string;
      /** Called with the date the user chooses; not called when the parent changes `value`. */
      onValueChange?: (value: string) => void;
    })
  | (CalendarBaseProps & {
      mode: 'range';
      /** The chosen range, `[start, end]`; `null` is no range. Pass it with `onValueChange` to control it. */
      value?: CalendarRange | null;
      /** The chosen range at first, when `value` is not controlled. */
      defaultValue?: CalendarRange;
      /**
       * Called with `[start, end]` when the user picks the end, the earlier day first. Picking the start
       * calls nothing; not called when the parent changes `value`.
       */
      onValueChange?: (value: CalendarRange) => void;
    });

/** What the calendar holds: a date in single mode, a pair of dates in range mode, or nothing. */
type CalendarValue = string | CalendarRange | null;

/** `value` as it is, or undefined with a warning that names the prop when it is not a date or month. */
const checked = (name: string, value: string | null | undefined, kind: 'date' | 'month') =>
  checkedIso('Calendar', name, value, kind);

/** The value as the warning shows it. The library never throws on misuse, and JSON cannot write a circular object or a BigInt. */
function describe(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    try {
      return String(value);
    } catch {
      return 'it';
    }
  }
}

/**
 * `value` as a range with its ends in order, or undefined with a warning that names the prop when it
 * is not a pair of dates. A start after the end has an obvious meaning, so the two change places.
 */
function checkedRange(name: string, value: unknown): CalendarRange | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value) && value.length === 2) {
    const [start, end] = value as unknown[];
    if (
      typeof start === 'string' &&
      typeof end === 'string' &&
      isIsoDate(start) &&
      isIsoDate(end)
    ) {
      if (compareIso(start, end) <= 0) return [start, end];
      devWarn(
        `Calendar: ${name} starts on ${start}, which is after its end ${end}; the two are swapped.`,
      );
      return [end, start];
    }
  }
  devWarn(
    `Calendar: ${name} ${describe(value)} is not a range written [YYYY-MM-DD, YYYY-MM-DD]; it is ignored.`,
  );
  return undefined;
}

const FIRST_DATE = '0001-01-01';
const LAST_DATE = '9999-12-31';

const FULL_DATE: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

const PREVIOUS = <ChevronIcon direction="left" />;
const NEXT = <ChevronIcon direction="right" />;

/**
 * A month of days to choose one from, with the keys of the ARIA "date picker dialog" grid. Dates are
 * ISO strings (`'2026-11-14'`), never `Date`s, so no time zone moves a day.
 */
export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
  {
    mode = 'single',
    value: valueProp,
    defaultValue,
    onValueChange,
    month: monthProp,
    defaultMonth,
    onMonthChange,
    min: minProp,
    max: maxProp,
    isDateUnavailable,
    weekStartsOn = 0,
    locale = 'en-US',
    today: todayProp,
    labels,
    className,
    onFocus,
    onKeyDown,
    ...props
  },
  forwardedRef,
) {
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const ref = useMemo(() => mergeRefs(forwardedRef, rootRef), [forwardedRef]);

  // A date or month that cannot be read is left out, so a typo shows a calendar without it, not none.
  const { min, max } = checkedLimits('Calendar', minProp, maxProp);
  const todayGiven = checked('today', todayProp, 'date');

  const isRange = mode === 'range';
  // The union of the props types `onValueChange` by `mode`. Here the mode is a value, so the handler
  // is taken as one that gets whatever the calendar holds: it is given the shape of its own mode.
  const notify = onValueChange as ((value: CalendarValue) => void) | undefined;
  const readValue = (name: string, raw: unknown): CalendarValue | undefined =>
    isRange ? checkedRange(name, raw) : checked(name, raw as string | null | undefined, 'date');
  const [value, setValue] = useControllableState<CalendarValue>({
    // `null` is a controlled calendar without a date; `undefined` leaves the value to the calendar.
    value: valueProp === undefined ? undefined : (readValue('value', valueProp) ?? null),
    defaultValue: readValue('defaultValue', defaultValue) ?? null,
    onChange: (next) => {
      if (next !== null) notify?.(next);
    },
    name: 'Calendar value',
  });
  // The shape that the other mode left in the state (a `mode` that changes) is not read.
  const committed: CalendarRange | null = isRange && Array.isArray(value) ? value : null;
  const single: string | null = !isRange && typeof value === 'string' ? value : null;
  // The date that sets the month and the tab stop: the chosen date, or the start of the range.
  const anchor = committed?.[0] ?? single;

  // The first pick of a range, until the second one finishes it (or Esc drops it). It belongs to range
  // mode: a parent that switches to single drops it, so no band is drawn and Esc is not taken from a
  // Dialog around the calendar, and it does not come back with range mode.
  const [pendingState, setPending] = useState<string | null>(null);
  const pending = isRange ? pendingState : null;
  useIsoLayoutEffect(() => {
    if (!isRange) setPending(null);
  }, [isRange]);
  // The day under the pointer or with the focus, for the preview band.
  const [pointed, setPointed] = useState<string | null>(null);
  const [monthState, setMonth, resetMonth] = useControllableState<string | null>({
    // A month that cannot be read is ignored whole, so the month stays the calendar's to move.
    value: checked('month', monthProp, 'month'),
    defaultValue: checked('defaultMonth', defaultMonth, 'month') ?? null,
    onChange: (next) => {
      if (next !== null) onMonthChange?.(next);
    },
    name: 'Calendar month',
  });

  // Today comes from the clock only after mount, so the server and the first client render agree.
  const [clock, setClock] = useState<string | null>(null);
  const today = todayGiven ?? clock;
  const hasTodayProp = todayGiven !== undefined;
  useEffect(() => {
    if (hasTodayProp) return undefined;
    setClock(todayIso());
    // A page left open past midnight reads the clock again when it is shown.
    const onVisible = () => {
      if (document.visibilityState === 'visible') setClock(todayIso());
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [hasTodayProp]);

  // `null` until it is known: with no month, value or today the month is the machine's, read above.
  // Today's month is moved into [min, max]: a birthdate calendar (`max` years ago) opens on the
  // last month a day can be chosen in, not on one where every day is struck through.
  const shown: string | null =
    monthState ??
    (anchor !== null ? isoMonthOf(anchor) : null) ??
    (today !== null
      ? clampIso(
          isoMonthOf(today),
          min === undefined ? undefined : isoMonthOf(min),
          max === undefined ? undefined : isoMonthOf(max),
        )
      : null);

  // An uncontrolled month follows a value that the parent moves to another month, so a calendar
  // whose value is set from outside (a "Today" button) shows it. Not on the first render, and not on
  // later renders: a user who has gone to another month is not pulled back.
  // A range counts by its start, a string: a parent that passes the same dates in a new array on
  // every render has not moved the value.
  // Not for the value of the user's own pick, which `choose` notes here before it sets it: an end
  // chosen after paging to a later month would throw the view back to the start and unmount the
  // focused day. The note is the start the pick makes, and a controlled parent that takes the pick
  // renders that start; it is read once, by the next change of the value.
  const lastAnchor = useRef(anchor);
  const picked = useRef<string | null>(null);
  useIsoLayoutEffect(() => {
    if (lastAnchor.current === anchor) return;
    lastAnchor.current = anchor;
    const own = picked.current !== null && picked.current === anchor;
    picked.current = null;
    if (own || anchor === null || shown === null || isSameMonth(anchor, shown)) return;
    resetMonth(isoMonthOf(anchor));
  }, [anchor, shown, resetMonth]);

  const unavailable = (date: string) => isUnavailable(date, { min, max, isDateUnavailable });

  // The grid and its words change with the month, the week start and the locale only, not with the
  // pointer, which renders the calendar again on every day it crosses while a range start waits.
  const rows = useMemo(
    () => (shown === null ? [] : monthGrid(shown, weekStartsOn)),
    [shown, weekStartsOn],
  );
  const words = useMemo(
    () =>
      shown === null
        ? null
        : {
            title: formatMonthYear(shown, locale),
            short: weekdayNames(locale, weekStartsOn, 'short'),
            long: weekdayNames(locale, weekStartsOn, 'long'),
            // The full date that names each day button.
            days: new Map(
              rows
                .flat()
                .filter((cell) => cell.inMonth)
                .map((cell) => [cell.date, formatDate(cell.date, locale, FULL_DATE)]),
            ),
          },
    [shown, locale, weekStartsOn, rows],
  );

  // The day with the tab stop: the one the user last moved to, while it is in the month shown;
  // otherwise the chosen day, today, or the first day that can be chosen.
  const [focusIso, setFocusIso] = useState<string | null>(null);
  let focusDate: string | null = null;
  if (shown !== null) {
    if (focusIso !== null && isSameMonth(focusIso, shown)) focusDate = focusIso;
    else if (anchor !== null && isSameMonth(anchor, shown)) focusDate = anchor;
    else if (today !== null && isSameMonth(today, shown)) focusDate = today;
    else {
      const days = rows.flat().filter((cell) => cell.inMonth);
      focusDate = (days.find((cell) => !unavailable(cell.date)) ?? days[0])?.date ?? null;
    }
  }

  // A key that crosses into another month asks for focus on a button that exists only after the
  // render that shows that month.
  const pendingFocus = useRef<string | null>(null);
  const focusButton = (date: string) =>
    rootRef.current?.querySelector<HTMLElement>(`button[data-date="${date}"]`)?.focus();
  useIsoLayoutEffect(() => {
    const date = pendingFocus.current;
    if (date === null) return;
    pendingFocus.current = null;
    focusButton(date);
  });

  const target = (from: string, key: string, shift: boolean): string | null => {
    switch (key) {
      case 'ArrowLeft':
        return addDays(from, -1);
      case 'ArrowRight':
        return addDays(from, 1);
      case 'ArrowUp':
        return addDays(from, -7);
      case 'ArrowDown':
        return addDays(from, 7);
      case 'Home':
        return startOfWeek(from, weekStartsOn);
      case 'End':
        return endOfWeek(from, weekStartsOn);
      case 'PageUp':
        return shift ? addYears(from, -1) : addMonths(from, -1);
      case 'PageDown':
        return shift ? addYears(from, 1) : addMonths(from, 1);
      default:
        return null;
    }
  };

  const onDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: string) => {
    if (hasModifier(event)) return;
    const raw = target(date, event.key, event.shiftKey);
    if (raw === null) return;
    event.preventDefault();
    // A key past year 0001 or 9999 gives text that is no date ('10000-01-01'), which would compare
    // wrongly as a string: it is the end of the calendar in the direction the key goes.
    const next = isIsoDate(raw)
      ? raw
      : ['ArrowLeft', 'ArrowUp', 'Home', 'PageUp'].includes(event.key)
        ? FIRST_DATE
        : LAST_DATE;
    // The focus stops at the edge of [min, max] instead of going where no date can be chosen, and
    // with no min or max at the first and last date there is.
    const clamped = clampIso(next, min ?? FIRST_DATE, max ?? LAST_DATE);
    setFocusIso(clamped);
    if (shown !== null && !isSameMonth(clamped, shown)) {
      pendingFocus.current = clamped;
      setMonth(isoMonthOf(clamped));
    } else {
      focusButton(clamped);
    }
  };

  const choose = (date: string) => {
    setFocusIso(date);
    if (unavailable(date)) return;
    if (!isRange) {
      picked.current = date;
      setValue(date);
    } else if (pending === null) {
      setPending(date);
    } else {
      const range: CalendarRange =
        compareIso(date, pending) < 0 ? [date, pending] : [pending, date];
      setPending(null);
      // The range that is already chosen is not a change, as the date that is already chosen is not.
      if (committed?.[0] !== range[0] || committed[1] !== range[1]) {
        picked.current = range[0];
        setValue(range);
      }
    }
  };

  // What is drawn as the range: while a start waits, the band from it to the day pointed at (or just
  // the start); otherwise the chosen range. The range that a new start replaces is not drawn.
  const reaching =
    pending !== null && pointed !== null && !unavailable(pointed) ? pointed : pending;
  let band: CalendarRange | null = committed;
  if (pending !== null && reaching !== null) {
    band = compareIso(reaching, pending) < 0 ? [reaching, pending] : [pending, reaching];
  }
  const pointAt = (date: string | null) => {
    if (isRange) setPointed(date);
  };
  // The pointer leaving a day hands the preview back to the day of this calendar that has the focus,
  // if there is one: not a day of another calendar on the page, which this one does not draw.
  const focusedDate = () => {
    const root = rootRef.current;
    const active = root?.ownerDocument.activeElement;
    return active && root.contains(active) && active.matches('button[data-date]')
      ? ((active as HTMLElement).dataset.date ?? null)
      : null;
  };

  // The month a button leads to, or null where it stops. Each button stops only at its own end: the
  // previous one before the month of `min`, the next one after the month of `max` (whole months
  // compare as months, so a month with one day inside can be visited). From a month outside the
  // range, a controlled `month` or the month of a value, the other button still leads back toward it.
  // Past 0001-01 or 9999-12 there is no month ('10000-0', which compares as a string before '9999').
  const stepTo = (delta: -1 | 1): string | null => {
    if (shown === null) return null;
    const month = isoMonthOf(addMonths(`${shown}-01`, delta));
    if (!isIsoMonth(month)) return null;
    const end = delta < 0 ? min : max;
    if (end !== undefined && compareIso(month, isoMonthOf(end)) === delta) return null;
    return month;
  };
  const step = (delta: -1 | 1) => {
    const month = stepTo(delta);
    if (month === null) return;
    // The focus stays on the button; the tab stop goes to where the rule puts it in the new month.
    setFocusIso(null);
    setMonth(month);
  };
  const stepDisabled = (delta: -1 | 1) => stepTo(delta) === null;

  return (
    // The root only catches the Esc of the keys that go through the grid and the month buttons, which
    // are the controls; it is not a control itself.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={ref}
      className={clsx('flg-calendar', className)}
      data-mode={mode}
      onFocus={composeEventHandlers<FocusEvent<HTMLDivElement>>(onFocus, () => {
        // Focus entering a page that was left open past midnight reads the date again.
        if (!hasTodayProp) setClock(todayIso());
      })}
      onKeyDown={composeEventHandlers<KeyboardEvent<HTMLDivElement>>(onKeyDown, (event) => {
        // Esc between the two picks drops the start. It is stopped here so that a Dialog around the
        // calendar, which closes on Esc, stays open: the first Esc is the calendar's, the next is the
        // Dialog's. With no start to drop it is left alone.
        if (event.key !== 'Escape' || hasModifier(event) || pending === null) return;
        event.preventDefault();
        setPending(null);
      })}
      {...props}
    >
      <div className="flg-calendar-header">
        <div id={titleId} className="flg-calendar-title" aria-live="polite">
          {words?.title ?? ''}
        </div>
        {/* At an end a month button does nothing but keeps `aria-disabled` and its place in the Tab
            order: a native `disabled` would drop the focus of a keyboard user who pressed it to get
            there (as in Pagination). */}
        <IconButton
          variant="ghost"
          size="sm"
          aria-label={labels?.previousMonth ?? 'Previous month'}
          aria-disabled={stepDisabled(-1) || undefined}
          onClick={() => step(-1)}
        >
          {PREVIOUS}
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          aria-label={labels?.nextMonth ?? 'Next month'}
          aria-disabled={stepDisabled(1) || undefined}
          onClick={() => step(1)}
        >
          {NEXT}
        </IconButton>
      </div>
      <table
        role="grid"
        aria-labelledby={titleId}
        aria-multiselectable={isRange || undefined}
        className="flg-calendar-grid"
      >
        <thead>
          <tr>
            {words?.short.map((name, index) => (
              <th key={index} scope="col" className="flg-calendar-weekday">
                <span aria-hidden="true">{name}</span>
                <span className="flg-visually-hidden">{words.long[index]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]?.date}>
              {row.map(({ date, inMonth }) => {
                const number = String(Number(date.slice(8)));
                if (!inMonth) {
                  return (
                    <td key={date} role="gridcell" className="flg-calendar-cell">
                      <span
                        className="flg-calendar-day"
                        data-date={date}
                        data-outside=""
                        aria-hidden="true"
                      >
                        {number}
                      </span>
                    </td>
                  );
                }
                const off = unavailable(date);
                // Where the day is in the range that is drawn: an end, between the ends, or the
                // only day (a start with no end yet, or a range of one day).
                let place: 'start' | 'middle' | 'end' | 'single' | undefined;
                if (
                  band !== null &&
                  compareIso(date, band[0]) >= 0 &&
                  compareIso(date, band[1]) <= 0
                ) {
                  if (band[0] === band[1]) place = 'single';
                  else place = date === band[0] ? 'start' : date === band[1] ? 'end' : 'middle';
                }
                // The round day: the date, or an end of the range. A day of the preview is not chosen
                // yet, so only the start that waits is announced as selected.
                const round = isRange ? place !== undefined && place !== 'middle' : single === date;
                const selected = isRange
                  ? pending === null
                    ? place !== undefined
                    : date === pending
                  : round;
                return (
                  <td
                    key={date}
                    role="gridcell"
                    className="flg-calendar-cell"
                    aria-selected={selected || undefined}
                    data-chosen={round ? '' : undefined}
                    data-range={place}
                    data-preview={pending !== null && place !== undefined ? '' : undefined}
                  >
                    <button
                      type="button"
                      className="flg-calendar-day"
                      data-date={date}
                      data-today={date === today ? '' : undefined}
                      tabIndex={date === focusDate ? 0 : -1}
                      aria-label={words?.days.get(date)}
                      aria-current={date === today ? 'date' : undefined}
                      aria-disabled={off || undefined}
                      onFocus={() => {
                        setFocusIso(date);
                        pointAt(date);
                      }}
                      onBlur={() => pointAt(null)}
                      onMouseEnter={() => pointAt(date)}
                      onMouseLeave={() => pointAt(focusedDate())}
                      onClick={() => choose(date)}
                      onKeyDown={(event) => onDayKeyDown(event, date)}
                    >
                      {number}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
