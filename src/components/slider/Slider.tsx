'use client';

import { clsx } from 'clsx';
import { forwardRef, useEffect, useRef, useState } from 'react';
import type {
  CSSProperties,
  ForwardedRef,
  HTMLAttributes,
  KeyboardEvent,
  ReactElement,
  RefAttributes,
} from 'react';
import { dataAttr } from '../../internal/data-attr';
import { markAsFieldGroup, useFieldContext, useFieldProps } from '../../internal/field-context';
import { clamp, decimalsOf, snapToStep, stepFrom } from '../../internal/number';
import { hasModifier } from '../../internal/roving';
import { useControllableState } from '../../internal/use-controllable-state';
import { useFormReset } from '../../internal/use-form-reset';
import { useRequireName } from '../../internal/use-require-name';
import { useWriteOnCommit } from '../../internal/use-write-on-commit';
import { devWarn } from '../../internal/warn';
import { usePointerDrag } from './use-pointer-drag';

/** A number for a slider with one thumb, a pair for one with two (a range). */
export type SliderValue = number | [number, number];

/** What the callbacks of a slider receive: a number or a pair, never a literal type like `60`. */
type Reported<V extends SliderValue> = V extends number ? number : V;

export type SliderProps<V extends SliderValue = number> = Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> & {
  /** The value, for a controlled slider. A number is one thumb, a pair is two. */
  value?: V;
  /** The value at first, for an uncontrolled slider. Default `min`. */
  defaultValue?: V;
  /** Called on every change, so for each step while the thumb is dragged. */
  onValueChange?: (value: Reported<V>) => void;
  /** Called once when a drag ends (if the value changed) and after each key that changed the value. */
  onValueCommit?: (value: Reported<V>) => void;
  /** Default 0. */
  min?: number;
  /** Default 100. */
  max?: number;
  /** The grid of values, which starts at `min`. Default 1. */
  step?: number;
  /** What PageUp and PageDown move by. Default: the multiple of `step` nearest to a tenth of the range. */
  largeStep?: number;
  disabled?: boolean;
  /** Sets `aria-invalid` on the thumb. Inside a Field with an error this is already true. */
  invalid?: boolean;
  /** The form field name; the hidden input that carries the value has it. */
  name?: string;
  /** Forces the tick dots on or off. By default they show when the range has at most 10 steps. */
  ticks?: boolean;
  /** The words for a value, in the bubble and in `aria-valuetext` (`"60%"`, `"3 of 5"`). */
  getValueText?: (value: number) => string;
};

const isNumber = (n: number | undefined): n is number =>
  typeof n === 'number' && Number.isFinite(n);

/** A fraction as a percentage for CSS, without the noise of floating point. */
const percent = (fraction: number) => `${Number((fraction * 100).toFixed(4))}%`;

/**
 * The slider of the mockup (S3): a thin track with the accent fill, a white thumb and a bubble above
 * it that always shows the value, and tick dots under the track when the range has few steps. The
 * thumb has the `slider` role and takes the arrow keys, the Page keys, Home, End and the pointer. A
 * hidden input with `name` carries the value to the form. `ref`, `className` and `style` belong to
 * the root; `id` and the `aria-*` props that name the slider go on the thumb.
 *
 * The value shown beside the label is not drawn here: pass it to the `aside` of the Field.
 */
export const Slider = markAsFieldGroup(
  forwardRef(function Slider(
    {
      value,
      defaultValue,
      onValueChange,
      onValueCommit,
      min: minProp,
      max: maxProp,
      step: stepProp,
      largeStep: largeStepProp,
      name,
      ticks,
      getValueText,
      className,
      ...props
    }: SliderProps<SliderValue>,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    const field = useFieldContext();
    // Only a slider that is the Field's direct child is the one the Field labels.
    const labelled = field?.labelMode === 'group';
    // An unlabelled slider keeps its own id below, so the Field never sees it (and does not warn
    // about it on top of the warning that follows).
    const {
      invalid,
      disabled,
      // A slider always has a value, so there is nothing for `required` to check.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      required: _required,
      id,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      ...rootProps
    } = useFieldProps(labelled ? props : { ...props, id: undefined });
    if (field?.labelMode === 'for' && field.labelId !== undefined) {
      devWarn(
        'Slider is inside a Field but is not its direct child, so the Field cannot label it. ' +
          'Make Slider the direct child of Field.',
      );
    }
    const labelledBy = ariaLabelledBy ?? (labelled ? field.labelId : undefined);
    useRequireName({ 'aria-label': ariaLabel, 'aria-labelledby': labelledBy }, 'Slider');

    const min = isNumber(minProp) ? minProp : 0;
    const maxGiven = isNumber(maxProp) ? maxProp : 100;
    // With no room between the ends the slider has one position, the minimum.
    const max = Math.max(maxGiven, min);
    const step = isNumber(stepProp) && stepProp > 0 ? stepProp : 1;
    const range = max - min;
    useEffect(() => {
      if (maxGiven <= min) devWarn(`Slider: min (${min}) must be less than max (${maxGiven}).`);
    }, [min, maxGiven]);
    useEffect(() => {
      if (stepProp !== undefined && step !== stepProp) {
        devWarn(`Slider: step must be a positive finite number, not ${stepProp}; using 1.`);
      }
    }, [stepProp, step]);

    // A multiple of step near a tenth of the range, and never less than one step.
    const largeStep =
      isNumber(largeStepProp) && largeStepProp > 0
        ? largeStepProp
        : Number((Math.max(1, Math.round(range / 10 / step)) * step).toFixed(decimalsOf(step)));

    // Puts a number onto the grid, inside the range.
    const fit = (n: number) => {
      let fitted = snapToStep(clamp(n, min, max), step, min);
      // Rounding may land one step past an end that is not on the grid.
      if (fitted > max) fitted = stepFrom(fitted, step, min, 'down');
      if (fitted < min) fitted = stepFrom(fitted, step, min, 'up');
      return clamp(fitted, min, max);
    };

    const first = (v: SliderValue | undefined) => (Array.isArray(v) ? v[0] : v);
    const [current, setValue, resetValue] = useControllableState<number>({
      value: first(value),
      defaultValue: first(defaultValue) ?? min,
      onChange: onValueChange as ((value: number) => void) | undefined,
      name: 'Slider value',
    });
    // What is shown for a value the parent gave that is not a number or is outside the range: the
    // nearest position. The parent is not told; it still has what it passed.
    const shown = isNumber(current) ? clamp(current, min, max) : min;
    const position = percent(range > 0 ? (shown - min) / range : 0);

    // What the slider holds right now. A drag moves faster than React renders, and each move must
    // start from the one before, so the handlers read this ref, which the commit writes and which a
    // change updates itself.
    const live = useRef(shown);
    useWriteOnCommit(() => {
      live.current = shown;
    });
    // The value the user last asked for, which a parent that refuses it does not show.
    const requested = useRef<number | null>(null);
    const apply = (next: number) => {
      requested.current = next;
      if (value === undefined) live.current = next;
      setValue(next);
    };

    const controlRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLSpanElement>(null);
    const hiddenRef = useRef<HTMLInputElement>(null);
    const defaultRef = useRef(first(defaultValue));
    useWriteOnCommit(() => {
      defaultRef.current = first(defaultValue);
    });
    // The form resets the hidden input behind React's back; put the value back with it.
    useFormReset(hiddenRef, () => resetValue(defaultRef.current ?? min));

    const commitRef = useRef(onValueCommit as ((value: number) => void) | undefined);
    useWriteOnCommit(() => {
      commitRef.current = onValueCommit as ((value: number) => void) | undefined;
    });
    // Whether the thumb has the focus because of a press, not because of the keyboard. Browsers
    // disagree on whether a `focus()` from a press matches :focus-visible, so the ring is decided here.
    const [pointerFocus, setPointerFocus] = useState(false);
    // Where the value stood when the press began, to tell whether the drag changed it.
    const startedAt = useRef(shown);
    const moveTo = (fraction: number) => apply(fit(min + fraction * range));
    const dragHandlers = usePointerDrag({
      trackRef: controlRef,
      disabled,
      onStart: ({ fraction }) => {
        startedAt.current = live.current;
        requested.current = null;
        moveTo(fraction);
        // The press focuses the thumb so the keys go on from there. It is not keyboard focus, so
        // the ring does not show.
        setPointerFocus(true);
        thumbRef.current?.focus({ preventScroll: true });
      },
      onMove: moveTo,
      onEnd: () => {
        const settled = requested.current;
        if (settled !== null && settled !== startedAt.current) commitRef.current?.(settled);
      },
    });

    const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
      setPointerFocus(false);
      if (disabled || hasModifier(event)) return;
      const from = live.current;
      let next: number;
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          next = stepFrom(from, step, min, 'down');
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          next = stepFrom(from, step, min, 'up');
          break;
        case 'PageDown':
          next = from - largeStep;
          break;
        case 'PageUp':
          next = from + largeStep;
          break;
        case 'Home':
          next = min;
          break;
        case 'End':
          next = max;
          break;
        default:
          return;
      }
      event.preventDefault();
      next = fit(next);
      if (next === live.current) return;
      apply(next);
      commitRef.current?.(next);
    };

    // The dots are at the steps of the grid, the ends included. A range of at most ten steps shows
    // them by itself.
    const intervals = range > 0 ? Math.floor(range / step + 1e-9) : 0;
    const showTicks = (ticks ?? range / step <= 10 + 1e-9) && intervals > 0;
    const text = getValueText ? getValueText(shown) : String(shown);

    return (
      <div
        ref={ref}
        className={clsx('flg-slider', className)}
        data-ticks={dataAttr(showTicks)}
        data-disabled={dataAttr(disabled)}
        data-invalid={dataAttr(invalid)}
        data-pointer-focus={dataAttr(pointerFocus)}
        {...rootProps}
      >
        <div
          ref={controlRef}
          className="flg-slider-control"
          style={{ '--flg-slider-start': '0%', '--flg-slider-end': position } as CSSProperties}
          {...dragHandlers}
        >
          <span className="flg-slider-track" aria-hidden="true" />
          <span className="flg-slider-fill" aria-hidden="true" />
          {showTicks ? (
            <span className="flg-slider-ticks" aria-hidden="true">
              {Array.from({ length: intervals + 1 }, (_, k) => (
                <i key={k} style={{ left: percent((k * step) / range) }} />
              ))}
            </span>
          ) : null}
          {/* A disabled slider is not focusable, as a native control that is disabled. */}
          {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
          <span
            ref={thumbRef}
            role="slider"
            tabIndex={disabled ? undefined : 0}
            className="flg-slider-thumb"
            style={{ '--flg-slider-pos': position } as CSSProperties}
            id={labelled ? id : props.id}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={shown}
            aria-valuetext={getValueText ? text : undefined}
            aria-orientation="horizontal"
            aria-label={ariaLabel}
            aria-labelledby={labelledBy}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
            aria-disabled={disabled ? true : undefined}
            onKeyDown={handleKeyDown}
            onBlur={() => setPointerFocus(false)}
          >
            {disabled ? null : (
              <span className="flg-surface flg-slider-bubble" aria-hidden="true">
                {text}
              </span>
            )}
          </span>
        </div>
        {name === undefined ? null : (
          <input
            ref={hiddenRef}
            type="hidden"
            name={name}
            value={String(shown)}
            disabled={disabled}
          />
        )}
      </div>
    );
  }) as <V extends SliderValue = number>(
    props: SliderProps<V> & RefAttributes<HTMLDivElement>,
  ) => ReactElement | null,
);
