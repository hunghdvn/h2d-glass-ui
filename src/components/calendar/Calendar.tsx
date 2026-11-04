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
  isSameMonth,
  monthGrid,
  startOfWeek,
  todayIso,
  weekdayNames,
} from '../../internal/date';
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

export type CalendarProps = CalendarBaseProps & {
  /** The chosen date, `'YYYY-MM-DD'`; `null` is no date. Pass it with `onValueChange` to control it. */
  value?: string | null;
  /** The chosen date at first, when `value` is not controlled. */
  defaultValue?: string;
  /** Called with the date the user chooses; not called when the parent changes `value`. */
  onValueChange?: (value: string) => void;
};

/** `value` as it is, or undefined with a warning that names the prop when it is not a date or month. */
function checked(
  name: string,
  value: string | null | undefined,
  kind: 'date' | 'month',
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (kind === 'date' ? isIsoDate(value) : isIsoMonth(value)) return value;
  devWarn(
    `Calendar: ${name} "${String(value)}" is not ${
      kind === 'date' ? 'a date written YYYY-MM-DD' : 'a month written YYYY-MM'
    }; it is ignored.`,
  );
  return undefined;
}

/** 'YYYY-MM' of a date (or of a month). */
const monthOf = (iso: string) => iso.slice(0, 7);

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
    ...props
  },
  forwardedRef,
) {
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const ref = useMemo(() => mergeRefs(forwardedRef, rootRef), [forwardedRef]);

  // A date or month that cannot be read is left out, so a typo shows a calendar without it, not none.
  let min = checked('min', minProp, 'date');
  let max = checked('max', maxProp, 'date');
  if (min !== undefined && max !== undefined && compareIso(min, max) > 0) {
    devWarn(`Calendar: min (${min}) is after max (${max}); both are ignored.`);
    min = undefined;
    max = undefined;
  }
  const todayGiven = checked('today', todayProp, 'date');

  const [value, setValue] = useControllableState<string | null>({
    // `null` is a controlled calendar without a date; `undefined` leaves the value to the calendar.
    value: valueProp === undefined ? undefined : (checked('value', valueProp, 'date') ?? null),
    defaultValue: checked('defaultValue', defaultValue, 'date') ?? null,
    onChange: (next) => {
      if (next !== null) onValueChange?.(next);
    },
    name: 'Calendar value',
  });
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
  const shown: string | null =
    monthState ??
    (value !== null ? monthOf(value) : null) ??
    (today !== null ? monthOf(today) : null);

  // An uncontrolled month follows a value that the parent moves to another month, so a calendar
  // whose value is set from outside (a "Today" button) shows it. Not on the first render, and not on
  // later renders: a user who has gone to another month is not pulled back.
  const lastValue = useRef(value);
  useIsoLayoutEffect(() => {
    if (lastValue.current === value) return;
    lastValue.current = value;
    if (value !== null && shown !== null && !isSameMonth(value, shown)) resetMonth(monthOf(value));
  }, [value, shown, resetMonth]);

  const unavailable = (date: string) =>
    (min !== undefined && compareIso(date, min) < 0) ||
    (max !== undefined && compareIso(date, max) > 0) ||
    isDateUnavailable?.(date) === true;

  const rows = shown === null ? [] : monthGrid(shown, weekStartsOn);

  // The day with the tab stop: the one the user last moved to, while it is in the month shown;
  // otherwise the chosen day, today, or the first day that can be chosen.
  const [focusIso, setFocusIso] = useState<string | null>(null);
  let focusDate: string | null = null;
  if (shown !== null) {
    if (focusIso !== null && isSameMonth(focusIso, shown)) focusDate = focusIso;
    else if (value !== null && isSameMonth(value, shown)) focusDate = value;
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
    const next = target(date, event.key, event.shiftKey);
    if (next === null) return;
    event.preventDefault();
    // The focus stops at the edge of [min, max] instead of going where no date can be chosen.
    const clamped = clampIso(next, min, max);
    setFocusIso(clamped);
    if (shown !== null && !isSameMonth(clamped, shown)) {
      pendingFocus.current = clamped;
      setMonth(monthOf(clamped));
    } else {
      focusButton(clamped);
    }
  };

  const choose = (date: string) => {
    setFocusIso(date);
    if (!unavailable(date)) setValue(date);
  };

  // Whole months compare as months: a month with one day inside [min, max] can be visited.
  const monthOutOfRange = (month: string) =>
    (min !== undefined && compareIso(month, monthOf(min)) < 0) ||
    (max !== undefined && compareIso(month, monthOf(max)) > 0);
  const step = (delta: number) => {
    if (shown === null) return;
    const month = monthOf(addMonths(`${shown}-01`, delta));
    if (monthOutOfRange(month)) return;
    // The focus stays on the button; the tab stop goes to where the rule puts it in the new month.
    setFocusIso(null);
    setMonth(month);
  };
  const stepDisabled = (delta: number) =>
    shown === null || monthOutOfRange(monthOf(addMonths(`${shown}-01`, delta)));

  const short = shown === null ? [] : weekdayNames(locale, weekStartsOn, 'short');
  const long = shown === null ? [] : weekdayNames(locale, weekStartsOn, 'long');

  return (
    <div
      ref={ref}
      className={clsx('flg-calendar', className)}
      data-mode="single"
      onFocus={composeEventHandlers<FocusEvent<HTMLDivElement>>(onFocus, () => {
        // Focus entering a page that was left open past midnight reads the date again.
        if (!hasTodayProp) setClock(todayIso());
      })}
      {...props}
    >
      <div className="flg-calendar-header">
        <div id={titleId} className="flg-calendar-title" aria-live="polite">
          {shown === null ? '' : formatMonthYear(shown, locale)}
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
      <table role="grid" aria-labelledby={titleId} className="flg-calendar-grid">
        <thead>
          <tr>
            {short.map((name, index) => (
              <th key={index} scope="col" className="flg-calendar-weekday">
                <span aria-hidden="true">{name}</span>
                <span className="flg-visually-hidden">{long[index]}</span>
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
                const selected = value === date;
                const off = unavailable(date);
                return (
                  <td
                    key={date}
                    role="gridcell"
                    className="flg-calendar-cell"
                    aria-selected={selected || undefined}
                  >
                    <button
                      type="button"
                      className="flg-calendar-day"
                      data-date={date}
                      data-today={date === today ? '' : undefined}
                      tabIndex={date === focusDate ? 0 : -1}
                      aria-label={formatDate(date, locale, FULL_DATE)}
                      aria-current={date === today ? 'date' : undefined}
                      aria-disabled={off || undefined}
                      onFocus={() => setFocusIso(date)}
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
