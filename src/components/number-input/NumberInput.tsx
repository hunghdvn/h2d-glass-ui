'use client';

import { clsx } from 'clsx';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, InputHTMLAttributes, KeyboardEvent } from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { dataAttr } from '../../internal/data-attr';
import { markAsFieldControl, useFieldProps } from '../../internal/field-context';
import { MinusIcon, PlusIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';
import {
  clamp,
  decimalsOf,
  formatNumber,
  parseNumber,
  snapToStep,
  stepFrom,
} from '../../internal/number';
import { hasModifier } from '../../internal/roving';
import { useControllableState } from '../../internal/use-controllable-state';
import { useFormReset } from '../../internal/use-form-reset';
import { useWriteOnCommit } from '../../internal/use-write-on-commit';
import { devWarn } from '../../internal/warn';
import { usePressRepeat } from './use-press-repeat';

export interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'size' | 'min' | 'max' | 'step'
> {
  /** The value, for a controlled input. `null` is no value; leave it `undefined` for an uncontrolled one. */
  value?: number | null;
  /** The value at first, for an uncontrolled input. */
  defaultValue?: number;
  /** Called with the value the user settles on: after a blur or Enter, a step key, a −/+ press or the wheel. Not for each key typed. */
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  /** The grid of values, which starts at `min` (or 0). Default 1. */
  step?: number;
  /** What PageUp and PageDown move by. Default ten times `step`. */
  largeStep?: number;
  /** BCP 47 locale of the text shown and read. Default `"en-US"`. */
  locale?: string;
  /** Options of `Intl.NumberFormat`, for a percentage, a currency or a unit. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Lets the wheel step the value while the field has focus. Default false. */
  allowWheel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Marks the value as wrong. Inside a Field with an error this is already true. */
  invalid?: boolean;
  /** The names of the buttons. Defaults `{ increment: "Increase", decrement: "Decrease" }`. */
  labels?: { increment?: string; decrement?: string };
}

const DEFAULT_LABELS = { increment: 'Increase', decrement: 'Decrease' };

const isNumber = (n: number | undefined): n is number =>
  typeof n === 'number' && Number.isFinite(n);

/**
 * A number field with a − button at the left end and a + button at the right end. The user types
 * freely and the text is read when the field loses focus or on Enter; the arrow keys, the buttons
 * (which repeat while held) and, if allowed, the wheel step along the grid of `step`. The value the
 * form receives is a hidden input with the plain number. `className` and `style` go on the frame,
 * `name` on the hidden input, every other prop on the visible input.
 */
export const NumberInput = markAsFieldControl(
  forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
    {
      value,
      defaultValue,
      onValueChange,
      min: minProp,
      max: maxProp,
      step: stepProp,
      largeStep: largeStepProp,
      locale = 'en-US',
      formatOptions,
      allowWheel = false,
      size = 'md',
      labels,
      name,
      className,
      style,
      inputMode,
      onChange,
      onKeyDown,
      onBlur,
      ...props
    },
    ref,
  ) {
    const { invalid, disabled, readOnly, ...inputProps } = useFieldProps(props);
    const inactive = Boolean(disabled || readOnly);

    const min = isNumber(minProp) ? minProp : undefined;
    const max = isNumber(maxProp) ? maxProp : undefined;
    const step = isNumber(stepProp) && stepProp > 0 ? stepProp : 1;
    const largeStep = isNumber(largeStepProp) && largeStepProp > 0 ? largeStepProp : 10 * step;
    useEffect(() => {
      if (min !== undefined && max !== undefined && min > max) {
        devWarn(`NumberInput: min (${min}) is greater than max (${max}).`);
      }
    }, [min, max]);
    useEffect(() => {
      if (stepProp !== undefined && step !== stepProp) {
        devWarn(`NumberInput: step must be a positive finite number, not ${stepProp}; using 1.`);
      }
    }, [stepProp, step]);

    const low = min ?? Number.NEGATIVE_INFINITY;
    const high = max ?? Number.POSITIVE_INFINITY;
    // The grid of the steps starts at min, or at 0 when there is none.
    const origin = min ?? 0;
    const options = useMemo<Intl.NumberFormatOptions>(
      () => formatOptions ?? { maximumFractionDigits: Math.max(3, decimalsOf(step)) },
      [formatOptions, step],
    );

    // Puts a number onto the grid, inside the range.
    const fit = (n: number) => {
      let fitted = snapToStep(clamp(n, low, high), step, origin);
      // Rounding may land one step past an end that is not on the grid.
      if (fitted > high) fitted = stepFrom(fitted, step, origin, 'down');
      if (fitted < low) fitted = stepFrom(fitted, step, origin, 'up');
      return clamp(fitted, low, high);
    };

    const [current, setValue, resetValue] = useControllableState<number | null>({
      value,
      defaultValue: defaultValue ?? null,
      onChange: onValueChange,
      name: 'NumberInput value',
    });
    // What is shown for a value the parent gave that is not usable or outside the range: the
    // nearest usable one. The parent is not told; it still has what it passed.
    const shown = current === null || !Number.isFinite(current) ? null : clamp(current, low, high);
    useEffect(() => {
      if (current !== null && shown !== current) {
        devWarn(
          `NumberInput value ${current} is outside the range or not a number; showing ` +
            `${shown === null ? 'nothing' : shown}.`,
        );
      }
    }, [current, shown]);

    // The text the user has typed and not settled yet, or null while the text is the formatted value.
    const [draft, setDraft] = useState<string | null>(null);
    const text = draft ?? (shown === null ? '' : formatNumber(shown, locale, options));

    const inputRef = useRef<HTMLInputElement>(null);
    const hiddenRef = useRef<HTMLInputElement>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, inputRef), [ref]);
    const defaultRef = useRef(defaultValue);
    useWriteOnCommit(() => {
      defaultRef.current = defaultValue;
    });
    // The form resets the visible input behind React's back; put the value and the text back.
    useFormReset(inputRef, () => {
      resetValue(defaultRef.current ?? null);
      setDraft(null);
    });

    // Reads the typed text: a number on the grid, null for an empty field, undefined when the text
    // cannot be read.
    const read = (typed: string): number | null | undefined => {
      if (typed.trim() === '') return null;
      const parsed = parseNumber(typed, locale, options);
      return Number.isNaN(parsed) ? undefined : fit(parsed);
    };

    // What the field holds right now. A held button steps faster than React renders, and a second
    // step must start from the first one's result, so the steps read this ref, which the commit
    // writes and which a step updates itself.
    const live = useRef({ shown, draft });
    useWriteOnCommit(() => {
      live.current = { shown, draft };
    });
    const apply = (next: number | null) => {
      live.current = { shown: value === undefined ? next : live.current.shown, draft: null };
      setDraft(null);
      setValue(next);
    };

    // Settles the typed text, if there is any, and returns the value the field has after that.
    const settle = (): number | null => {
      const { shown: before, draft: typed } = live.current;
      if (typed === null) return before;
      const settled = read(typed);
      if (settled === undefined) {
        live.current = { shown: before, draft: null };
        setDraft(null);
        return before;
      }
      apply(settled);
      return settled;
    };

    // Moves the value one step (or a large one) up or down. Returns whether a further step in the
    // same direction is possible, which the press-and-hold repeat asks.
    const stepBy = (direction: 1 | -1, large = false): boolean => {
      const from = settle();
      let next: number;
      if (from === null) next = direction === 1 ? (min ?? 0) : (max ?? 0);
      else if (large) next = snapToStep(from + direction * largeStep, step, origin);
      else next = stepFrom(from, step, origin, direction === 1 ? 'up' : 'down');
      next = clamp(next, low, high);
      apply(next);
      return direction === 1 ? next < high : next > low;
    };
    const goTo = (target: number) => apply(fit(target));

    const decrement = usePressRepeat(() => stepBy(-1));
    const increment = usePressRepeat(() => stepBy(1));

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (hasModifier(event)) return;
      if (event.key === 'Enter') {
        // The Enter that confirms an IME composition is not a request to commit.
        if (event.nativeEvent.isComposing) return;
        // The form submits right after this keydown, perhaps before React has rendered the new value
        // into the hidden input, so the value goes there now.
        const settled = settle();
        if (hiddenRef.current) hiddenRef.current.value = settled === null ? '' : String(settled);
        return;
      }
      if (inactive) return;
      switch (event.key) {
        case 'ArrowUp':
          stepBy(1);
          break;
        case 'ArrowDown':
          stepBy(-1);
          break;
        case 'PageUp':
          stepBy(1, true);
          break;
        case 'PageDown':
          stepBy(-1, true);
          break;
        case 'Home':
          // Without a min the key moves the caret, as in any text field.
          if (min === undefined) return;
          goTo(min);
          break;
        case 'End':
          if (max === undefined) return;
          goTo(max);
          break;
        default:
          return;
      }
      event.preventDefault();
    };

    // React attaches `wheel` as a passive listener, which cannot stop the page from scrolling.
    const wheelStep = useRef(stepBy);
    useWriteOnCommit(() => {
      wheelStep.current = stepBy;
    });
    useEffect(() => {
      const input = inputRef.current;
      if (!allowWheel || !input) return;
      const onWheel = (event: WheelEvent) => {
        if (document.activeElement !== input || input.disabled || input.readOnly) return;
        if (event.deltaY === 0) return;
        event.preventDefault();
        wheelStep.current(event.deltaY < 0 ? 1 : -1);
      };
      input.addEventListener('wheel', onWheel, { passive: false });
      return () => input.removeEventListener('wheel', onWheel);
    }, [allowWheel]);

    const { increment: incrementLabel, decrement: decrementLabel } = {
      ...DEFAULT_LABELS,
      ...labels,
    };
    const buttonProps = { type: 'button', tabIndex: -1 } as const;
    return (
      <div
        className={clsx('flg-input', 'flg-number-input', className)}
        style={style}
        data-size={size}
        data-invalid={dataAttr(invalid)}
        data-disabled={dataAttr(disabled)}
      >
        <button
          {...buttonProps}
          aria-label={decrementLabel}
          disabled={inactive || (shown !== null && shown <= low)}
          {...decrement}
        >
          <MinusIcon />
        </button>
        <input
          autoComplete="off"
          {...inputProps}
          ref={mergedRef}
          type="text"
          role="spinbutton"
          inputMode={inputMode ?? (min !== undefined && min >= 0 ? 'decimal' : 'text')}
          disabled={disabled}
          readOnly={readOnly}
          value={text}
          aria-valuenow={shown ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={shown === null ? undefined : formatNumber(shown, locale, options)}
          onChange={composeEventHandlers(onChange, (event: ChangeEvent<HTMLInputElement>) =>
            setDraft(event.target.value),
          )}
          onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
          onBlur={composeEventHandlers(onBlur, () => {
            settle();
          })}
        />
        <button
          {...buttonProps}
          aria-label={incrementLabel}
          disabled={inactive || (shown !== null && shown >= high)}
          {...increment}
        >
          <PlusIcon />
        </button>
        {name === undefined ? null : (
          <input
            ref={hiddenRef}
            type="hidden"
            name={name}
            value={shown === null ? '' : String(shown)}
            disabled={disabled}
          />
        )}
      </div>
    );
  }),
);
