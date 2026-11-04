'use client';

import { clsx } from 'clsx';
import { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react';
import type {
  ChangeEvent,
  CSSProperties,
  FocusEvent,
  InputHTMLAttributes,
  KeyboardEvent,
  MouseEvent,
} from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { dataAttr } from '../../internal/data-attr';
import {
  compareIso,
  datePattern,
  formatDate,
  isIsoDate,
  parseDate,
  todayIso,
} from '../../internal/date';
import { markAsFieldControl, useControlError, useFieldProps } from '../../internal/field-context';
import { focusInput } from '../../internal/focus-input';
import { CalendarIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';
import { hasModifier, isComposing } from '../../internal/roving';
import { useAnnounce } from '../../internal/use-announce';
import { useControllableState } from '../../internal/use-controllable-state';
import { useFloating } from '../../internal/use-floating';
import { useFormReset } from '../../internal/use-form-reset';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { usePopover } from '../../internal/use-popover';
import { usePopoverState, useTriggerPress } from '../../internal/use-popover-trigger';
import { useWriteOnCommit } from '../../internal/use-write-on-commit';
import { devWarn } from '../../internal/warn';
import { Calendar } from '../calendar/Calendar';
import type { CalendarLabels } from '../calendar/Calendar';

/** The words the DatePicker says itself, and the ones of its calendar; translate them with the page. */
export interface DatePickerLabels extends CalendarLabels {
  /** The name of the calendar button. Default `"Choose date"`. */
  openCalendar?: string;
  /** The name of the calendar's dialog. Default `"Choose date"`. */
  dialog?: string;
  /** What is said of text that is no date. Default `"Invalid date"`. */
  invalidDate?: string;
  /** What is said of a date outside `min` and `max`, or one `isDateUnavailable` marks. Default `"This date is not available"`. */
  unavailableDate?: string;
}

export interface DatePickerProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'size' | 'min' | 'max'
> {
  /** The chosen date, `'YYYY-MM-DD'`; `null` is no date. Pass it with `onValueChange` to control it. */
  value?: string | null;
  /** The chosen date at first, when `value` is not controlled. */
  defaultValue?: string;
  /**
   * Called with the date the user chooses, typed or picked, or `null` when they empty the text. Not
   * called when the parent changes `value`.
   */
  onValueChange?: (value: string | null) => void;
  /** Whether the calendar is open. Pass it with `onOpenChange` to control it. */
  open?: boolean;
  /** Whether the calendar starts open, when `open` is not controlled. */
  defaultOpen?: boolean;
  /** Called with the new state whenever the calendar opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The first date that can be chosen, `'YYYY-MM-DD'`. */
  min?: string;
  /** The last date that can be chosen, `'YYYY-MM-DD'`. */
  max?: string;
  /** Marks a date that cannot be chosen, for example a day that is fully booked. */
  isDateUnavailable?: (date: string) => boolean;
  /** The day the week starts on, 0 (Sunday) to 6 (Saturday). Default 0, for every locale. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * BCP 47 locale of the text (its order of day, month and year, and its placeholder) and of the
   * calendar. Default `"en-US"`.
   */
  locale?: string;
  /**
   * The date to call today, `'YYYY-MM-DD'`. Without it today is read from the clock when the calendar
   * opens. Pass it in tests and demos so that nothing changes with the day they run.
   */
  today?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Marks the value as wrong. Inside a Field with an error this is already true. */
  invalid?: boolean;
  /** The words of the button, the dialog and the calendar. */
  labels?: DatePickerLabels;
  /** On the element around the input. */
  className?: string;
  /** On the element around the input. */
  style?: CSSProperties;
}

const CALENDAR = <CalendarIcon />;

/** `value` as it is, or undefined with a warning that names the prop when it is not a date. */
function checked(name: string, value: string | null | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (isIsoDate(value)) return value;
  devWarn(
    `DatePicker: ${name} "${String(value)}" is not a date written YYYY-MM-DD; it is ignored.`,
  );
  return undefined;
}

/**
 * A text input that reads a date typed in the order of its locale, with a calendar button that opens a
 * calendar under it, and a hidden input that takes the ISO date to a form. Dates are ISO strings
 * (`'2026-11-14'`), never `Date`s. `ref` is the text input; `className` and `style` go on the element
 * around it.
 */
export const DatePicker = markAsFieldControl(
  forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(props, ref) {
    const {
      value: valueProp,
      defaultValue,
      onValueChange,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      min: minProp,
      max: maxProp,
      isDateUnavailable,
      weekStartsOn,
      locale = 'en-US',
      today: todayProp,
      size = 'md',
      invalid: invalidProp,
      labels,
      name,
      placeholder,
      className,
      style,
      id,
      required,
      disabled: disabledProp,
      readOnly = false,
      'aria-describedby': describedBy,
      'aria-invalid': ariaInvalid,
      onBlur,
      onChange,
      onKeyDown,
      ...rest
    } = props;
    // What is wrong with the text that stays in the input, if anything. The message is made from the
    // labels when it is shown, so a translation that arrives later is used.
    const [fault, setFault] = useState<'invalid' | 'unavailable' | null>(null);
    const messageOf = (why: 'invalid' | 'unavailable') =>
      why === 'invalid'
        ? (labels?.invalidDate ?? 'Invalid date')
        : (labels?.unavailableDate ?? 'This date is not available');
    const message = fault === null ? null : messageOf(fault);
    // The message goes to the Field, which shows it unless it has an `error` of its own, or comes back
    // here to be shown under the frame.
    const ownError = useControlError(message);
    const { announce, region } = useAnnounce();
    const fieldProps = useFieldProps({
      id,
      invalid: invalidProp ?? (message === null ? undefined : true),
      required,
      disabled: disabledProp,
      'aria-describedby': [describedBy, ownError?.id].filter(Boolean).join(' ') || undefined,
      'aria-invalid': ariaInvalid,
    });
    const { invalid, disabled = false } = fieldProps;

    // A date that cannot be read is left out, so a typo shows a picker without it, not none.
    let min = checked('min', minProp);
    let max = checked('max', maxProp);
    if (min !== undefined && max !== undefined && compareIso(min, max) > 0) {
      devWarn(`DatePicker: min (${min}) is after max (${max}); both are ignored.`);
      min = undefined;
      max = undefined;
    }
    const todayGiven = checked('today', todayProp);
    const defaultDate = checked('defaultValue', defaultValue) ?? null;

    // --- The value, and the text that stands for it.
    const [value, setValue, resetValue] = useControllableState<string | null>({
      // `null` is a controlled picker without a date; `undefined` leaves the value to the picker.
      value: valueProp === undefined ? undefined : (checked('value', valueProp) ?? null),
      defaultValue: defaultDate,
      onChange: onValueChange,
      name: 'DatePicker value',
    });
    const textOf = (date: string | null) => (date === null ? '' : formatDate(date, locale));
    const [text, setText] = useState(() => textOf(value));
    // A value that changes brings its text with it, and so does a locale. What the user types does
    // not: the text only follows the value when the value is what moved.
    const syncKey = `${value ?? ''}|${locale}`;
    const syncedKey = useRef(syncKey);
    useIsoLayoutEffect(() => {
      if (syncedKey.current === syncKey) return;
      syncedKey.current = syncKey;
      setText(textOf(value));
      // The text is the value's again, so whatever was wrong with the typed text is gone.
      lastFaulty.current = null;
      setFault(null);
      // `value` and `locale` are the key; only a change of the key matters.
    }, [syncKey]);
    const latestValue = useRef(value);
    useWriteOnCommit(() => {
      latestValue.current = value;
    });

    const unavailable = (date: string) =>
      (min !== undefined && compareIso(date, min) < 0) ||
      (max !== undefined && compareIso(date, max) > 0) ||
      isDateUnavailable?.(date) === true;
    type Reading = { date: string | null } | { fault: 'invalid' | 'unavailable' };
    /**
     * What the text says: a date that can be chosen, or `null` for no date (empty text); else why it
     * stays as typed: it cannot be read, or it is a date that cannot be chosen.
     */
    const read = (): Reading => {
      if (text.trim() === '') return { date: null };
      const date = parseDate(text, locale);
      if (date === null) return { fault: 'invalid' };
      return unavailable(date) ? { fault: 'unavailable' } : { date };
    };
    // The text as it stood when its fault was last said. Leaving with that very text is not a new
    // request: judging it again would say the same message again. Any edit forgets it; Enter, being
    // the user's explicit act, says it again.
    const lastFaulty = useRef<string | null>(null);
    const clearFault = () => {
      lastFaulty.current = null;
      setFault(null);
      // The browser's check is what stops a submit, and a submit can follow before React renders.
      inputRef.current?.setCustomValidity('');
    };
    /** Says why the text stays, once for each text unless `again`. */
    const refuse = (reading: { fault: 'invalid' | 'unavailable' }, again: boolean) => {
      setFault(reading.fault);
      if (!again && lastFaulty.current === text) return;
      lastFaulty.current = text;
      announce(messageOf(reading.fault));
    };
    // A parent that refuses a date never renders it, so the text would stay as typed beside the value
    // the form submits (and `required` would count it as met). A task later, when the parent has had
    // its say, the text goes back to the value's, as Combobox resyncs its hidden select after Enter.
    // Not when the user has typed since: that text is theirs.
    const edits = useRef(0);
    const resyncTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(resyncTimer.current), []);
    const resyncText = () => {
      const seen = edits.current;
      clearTimeout(resyncTimer.current);
      resyncTimer.current = setTimeout(() => {
        if (edits.current === seen) setText(textOf(latestValue.current));
      }, 0);
    };
    /** Makes what the text says the value, and writes the text in the format of the locale. */
    const commit = (reading: { date: string | null }) => {
      clearFault();
      // A value that changes brings its text (see `syncKey`); the one already chosen only has its
      // text put back in the format, as typed another way ("11/14/26").
      if (reading.date === value) setText(textOf(value));
      else {
        setValue(reading.date);
        resyncText();
      }
    };

    // A fault is a verdict on the text under the limits of that moment. When `min`, `max` or
    // `isDateUnavailable` change, the text that was judged (not one the user has edited since) is
    // judged again: a date that has become available is the user's own typed date becoming valid, so it
    // is committed (and reported, as a typed date is); one that is still not is kept, with the message
    // it now earns. It acts only when the verdict differs from the stored one, so an inline
    // `isDateUnavailable`, new on every render, settles at once and cannot loop.
    useEffect(() => {
      if (fault === null || lastFaulty.current !== text || readOnly) return;
      const reading = read();
      if ('date' in reading) commit(reading);
      else if (reading.fault !== fault) setFault(reading.fault);
    });

    // --- Open state.
    const { open, request, report, contentRef, pendingToggle } = usePopoverState<HTMLDivElement>({
      open: openProp,
      defaultOpen,
      onOpenChange,
      name: 'DatePicker open',
    });
    // A DatePicker that becomes disabled while open closes, as a native control does.
    useIsoLayoutEffect(() => {
      if (disabled && open) request(false);
    }, [disabled, open, request]);

    const frameRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, inputRef), [ref]);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const hiddenRef = useRef<HTMLInputElement>(null);
    const popupId = useId();

    // The calendar reads the clock for today only after it mounts, which is after the focus should
    // have gone into its grid. An open DatePicker reads the clock first and hands the day down, so
    // that the grid has today on it when the focus goes in.
    const [clock, setClock] = useState<string | null>(null);
    useIsoLayoutEffect(() => {
      if (open && todayGiven === undefined) setClock(todayIso());
    }, [open, todayGiven]);
    // The day that has the tab stop, which is where the focus goes: the chosen day, else today.
    const focusGrid = () => {
      const target = contentRef.current?.querySelector<HTMLElement>(
        'button[data-date][tabindex="0"]',
      );
      target?.focus({ preventScroll: true });
      return target != null;
    };
    // Set when the popup showed before its grid was drawn (opened by the parent, with no date and no
    // `today` yet): the render that brings the clock finishes the job.
    const focusWanted = useRef(false);
    useIsoLayoutEffect(() => {
      if (!open) focusWanted.current = false;
      else if (focusWanted.current && focusGrid()) focusWanted.current = false;
      // The grid appears with the clock; the open state resets the flag.
    }, [open, clock]);

    // --- Opening: the button, or Alt+ArrowDown. The text that waits is read first, so the calendar
    // opens on its month (text that cannot be read leaves the month of the value, or today's).
    const openCalendar = () => {
      if (disabled || readOnly) return;
      // Text that cannot be read is not judged here: the user has not left it, and the calendar
      // opens on the month of the value.
      const reading = read();
      if ('date' in reading) commit(reading);
      request(true);
    };
    // A press on the button light-dismisses an open popup before the click arrives: it closes it.
    const press = useTriggerPress(open, (wasOpen) => {
      if (wasOpen) request(false);
      else openCalendar();
    });

    // A press on the input while the popup is open light-dismisses it too, and focus goes back to
    // the input, which is `restoreFocusTo`: nothing else to do for it here.
    usePopover(contentRef, {
      open,
      onOpenChange: report,
      pendingToggle,
      restoreFocusTo: () => inputRef.current,
      onShown: () => {
        focusWanted.current = !focusGrid();
      },
    });
    useFloating({
      open,
      reference: () => frameRef.current,
      floating: contentRef,
      side: 'bottom',
      align: 'start',
      offset: 6,
    });

    // --- The text.
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      lastFaulty.current = null;
      edits.current += 1;
      setText(event.target.value);
    };
    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      // Keys that pick or move through a composition belong to the input method.
      if (isComposing(event)) return;
      if (event.key === 'ArrowDown' && event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (!open) openCalendar();
      } else if (event.key === 'Enter' && !hasModifier(event) && !readOnly) {
        const reading = read();
        if ('fault' in reading) {
          // Text that stays must not submit the form with the old date beside it.
          event.preventDefault();
          refuse(reading, true);
          return;
        }
        // Spaces are no date, and the browser's `required` check counts them as a value. The commit
        // below clears them, but only when React renders, which can be after the browser has checked,
        // so they go from the input now (as leaving them does, a render before the check).
        if (reading.date === null && event.currentTarget.value !== '') {
          event.currentTarget.value = '';
        }
        commit(reading);
        // The form submits right after this keydown, perhaps before React has rendered the new date
        // into the hidden input, so it goes there now (as NumberInput does for its hidden input). It
        // is put back in step a task later, when the submit has read it: a parent that refuses the
        // date never renders a new one, and the hidden input must not keep what was written here.
        const hiddenInput = hiddenRef.current;
        if (hiddenInput) {
          hiddenInput.value = reading.date ?? '';
          setTimeout(() => {
            if (hiddenRef.current) hiddenRef.current.value = latestValue.current ?? '';
          }, 0);
        }
      }
    };
    // Leaving the DatePicker reads the text: from the input, or from the button after it (a user who
    // types and tabs past the button has left it too). Focus that stays among the input, the button
    // and the popup is no leaving; opening reads the text itself. Another window taking the focus is
    // no leaving of the text either: the user comes back to what they were typing.
    const judge = () => {
      if (readOnly) return;
      const reading = read();
      if ('date' in reading) commit(reading);
      else refuse(reading, false);
    };
    const handleLeave = (event: FocusEvent<HTMLElement>) => {
      const to = event.relatedTarget as Node | null;
      if (
        inputRef.current?.contains(to) ||
        buttonRef.current?.contains(to) ||
        contentRef.current?.contains(to)
      ) {
        return;
      }
      if (!to && !document.hasFocus()) return;
      judge();
    };

    // --- The popup.
    // A day pressed is chosen, the one already chosen too: the Calendar reports only a change of
    // value, and a popup that stays open on the chosen day would be no way out for the pointer. A
    // day that cannot be chosen is `aria-disabled`, and a press on it does nothing.
    const handlePopupClick = (event: MouseEvent<HTMLDivElement>) => {
      const target = (event.target as Element).closest<HTMLElement>('button[data-date]');
      const date = target?.dataset.date;
      if (!date || target.getAttribute('aria-disabled') === 'true') return;
      // A popup opened by `open` or `defaultOpen` can show while read-only; a day pressed in it
      // changes nothing, as typing does not.
      if (readOnly) return;
      clearFault();
      if (date === value) setText(textOf(value));
      else {
        setValue(date);
        resyncText();
      }
      inputRef.current?.focus({ preventScroll: true });
      request(false);
    };
    // Focus that moves on from the popup to anything but the input or the button closes it, and the
    // focus stays where the user sent it (Tab out of the grid). A press that leaves focus nowhere
    // (Safari does not focus a pressed button) is no leaving.
    // It closes a task later, when the focus has arrived: while the `focusout` is dispatched the
    // document has no focused element, and a popup that closes then would send the focus to the input.
    const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(leaveTimer.current), []);
    const handlePopupBlur = (event: FocusEvent<HTMLDivElement>) => {
      const to = event.relatedTarget as Node | null;
      if (!to || contentRef.current?.contains(to)) return;
      if (to === inputRef.current || buttonRef.current?.contains(to)) return;
      clearTimeout(leaveTimer.current);
      // Leaving from the popup is leaving the DatePicker too: text that waited (opening does not judge
      // it) must not close the popup unseen and leave the form with a date beside "11/2".
      leaveTimer.current = setTimeout(() => {
        judge();
        request(false);
      }, 0);
    };

    // --- Form. The hidden input is what is submitted, and the browser does not reset it: a hidden
    // input has no value of its own to go back to. An uncontrolled picker goes back to its default, a
    // controlled one keeps its value, and either way the text is put back to the value's.
    useFormReset(inputRef, () => {
      clearFault();
      resetValue(defaultDate);
      setText(textOf(valueProp === undefined ? defaultDate : latestValue.current));
    });

    // The input says it is not valid, which is what stops a submit and what its bubble reads.
    useIsoLayoutEffect(() => {
      inputRef.current?.setCustomValidity(message ?? '');
    }, [message]);

    return (
      <div
        className={clsx('flg-date-picker', className)}
        style={style}
        data-size={size}
        data-invalid={dataAttr(invalid)}
        data-disabled={dataAttr(disabled)}
      >
        {/* The frame only forwards presses to the input; keyboard users reach the input directly. */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          ref={frameRef}
          className="flg-input"
          data-size={size}
          data-invalid={dataAttr(invalid)}
          data-disabled={dataAttr(disabled)}
          onMouseDown={focusInput}
        >
          <input
            {...rest}
            ref={mergedRef}
            type="text"
            id={fieldProps.id}
            autoComplete="off"
            placeholder={placeholder ?? datePattern(locale)}
            value={text}
            required={fieldProps.required}
            disabled={disabled}
            readOnly={readOnly}
            aria-describedby={fieldProps['aria-describedby']}
            aria-invalid={fieldProps['aria-invalid']}
            onChange={composeEventHandlers(onChange, handleChange)}
            onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
            onBlur={composeEventHandlers(onBlur, handleLeave)}
          />
          <button
            ref={buttonRef}
            type="button"
            className="flg-date-picker-button"
            aria-label={labels?.openCalendar ?? 'Choose date'}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={popupId}
            aria-disabled={readOnly || undefined}
            disabled={disabled}
            onBlur={handleLeave}
            onPointerDown={press.onPointerDown}
            onPointerCancel={press.onPointerCancel}
            onClick={press.onClick}
          >
            {CALENDAR}
          </button>
        </div>
        <input ref={hiddenRef} type="hidden" name={name} value={value ?? ''} disabled={disabled} />
        {/* The click is a day's, a button of the Calendar inside; its keys are the Calendar's. */}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
        <div
          ref={contentRef}
          popover="auto"
          role="dialog"
          id={popupId}
          aria-label={labels?.dialog ?? 'Choose date'}
          className="flg-surface flg-date-picker-popup"
          onClick={handlePopupClick}
          onBlur={handlePopupBlur}
        >
          {open ? (
            <Calendar
              value={value}
              min={min}
              max={max}
              isDateUnavailable={isDateUnavailable}
              weekStartsOn={weekStartsOn}
              locale={locale}
              today={todayGiven ?? clock ?? undefined}
              labels={labels}
            />
          ) : null}
        </div>
        {ownError ? (
          <p id={ownError.id} className="flg-field-error">
            {ownError.message}
          </p>
        ) : null}
        {region}
      </div>
    );
  }),
);
