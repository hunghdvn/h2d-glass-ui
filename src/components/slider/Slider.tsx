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
import { clamp, decimalsOf, fitToGrid, isNumber, stepFrom } from '../../internal/number';
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
  /**
   * The id of the `<form>` the slider belongs to, for a slider outside it. Every hidden input that
   * carries a value has it, and the form's reset reaches the slider.
   */
  form?: string;
  /** Forces the tick dots on or off. By default they show when the range has at most 10 steps. */
  ticks?: boolean;
  /** The words for a value, in the bubble and in `aria-valuetext` (`"60%"`, `"3 of 5"`). */
  getValueText?: (value: number) => string;
  /** The names of the two thumbs of a range. Default `"Minimum"` and `"Maximum"`. */
  labels?: { minimum?: string; maximum?: string };
};

/** One of the numbers a slider holds; the index is always one that it has. */
const nth = (values: readonly number[], index: number) => values[index] ?? 0;

const sameValues = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((n, i) => n === b[i]);

/** A fraction as a percentage for CSS, without the noise of floating point. */
const percent = (fraction: number) => `${Number((fraction * 100).toFixed(4))}%`;

/**
 * The slider of the mockup (S3): a thin track with the accent fill, a white thumb and a bubble above
 * it that always shows the value, and tick dots under the track when the range has few steps. The
 * thumb has the `slider` role and takes the arrow keys, the Page keys, Home, End and the pointer. A
 * hidden input with `name` carries the value to the form. `ref`, `className` and `style` belong to
 * the root; `id` and the `aria-*` props that name the slider go on the thumb.
 *
 * A pair as `value` or `defaultValue` makes it a range with two thumbs, which cannot pass each other.
 * The root is then a `group` that has the name and the `id`, each thumb has a hidden input with the
 * `name`, and `labels` names the thumbs.
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
      form,
      ticks,
      getValueText,
      labels,
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
    // As Select: the developer's labelledby, else none when there is an aria-label, else the Field's label.
    const labelledBy = ariaLabelledBy ?? (ariaLabel || !labelled ? undefined : field.labelId);
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
    const fit = (n: number) => fitToGrid(n, min, max, step, min);

    // A pair is a range, a number is one thumb.
    const isRange = Array.isArray(value ?? defaultValue);
    const wasRange = useRef(isRange);
    useEffect(() => {
      if (wasRange.current === isRange) return;
      devWarn(
        'Slider is changing between a number and a pair (one thumb and a range). ' +
          'Pick one for the lifetime of the component.',
      );
      wasRange.current = isRange;
    }, [isRange]);

    const [current, setValue, resetValue] = useControllableState<SliderValue>({
      value,
      defaultValue: defaultValue ?? min,
      onChange: onValueChange as ((value: SliderValue) => void) | undefined,
      name: 'Slider value',
    });
    const malformed =
      isRange && !(Array.isArray(current) && current.length === 2 && current.every(isNumber));
    const unordered =
      Array.isArray(current) &&
      isNumber(current[0]) &&
      isNumber(current[1]) &&
      current[0] > current[1];
    useEffect(() => {
      if (malformed) {
        devWarn('Slider: the value of a range must be a pair of two numbers, [lower, higher].');
      }
    }, [malformed]);
    useEffect(() => {
      if (unordered) {
        devWarn('Slider: a range is [lower, higher], lower first; the pair was put in order.');
      }
    }, [unordered]);

    // What is shown for a value the parent gave that is not a number or is outside the range: the
    // nearest position, and for a missing end of a pair the end of the range. The parent is not told;
    // it still has what it passed. A pair out of order is drawn the right way round.
    const toValues = (raw: SliderValue): number[] => {
      const at = (n: unknown, missing: number) => (isNumber(n) ? clamp(n, min, max) : missing);
      if (!isRange) return [at(Array.isArray(raw) ? raw[0] : raw, min)];
      const pair: unknown[] = Array.isArray(raw) ? raw : [];
      const [lower, higher] = [at(pair[0], min), at(pair[1], max)];
      return lower <= higher ? [lower, higher] : [higher, lower];
    };
    const shown = toValues(current);
    const report = (values: number[]): SliderValue =>
      isRange ? [nth(values, 0), nth(values, 1)] : nth(values, 0);
    const positionOf = (n: number) => percent(range > 0 ? (n - min) / range : 0);

    // What the slider holds right now. A drag moves faster than React renders, and each move must
    // start from the one before, so the handlers read this ref, which the commit writes and which a
    // change updates itself.
    const live = useRef(shown);
    useWriteOnCommit(() => {
      live.current = shown;
    });
    // The value the user last asked for, which a parent that refuses it does not show.
    const requested = useRef<number[] | null>(null);
    // Moves one thumb to `n`, which is inside its limits, and returns the value that was asked for.
    const apply = (index: number, n: number) => {
      const next = [...live.current];
      next[index] = n;
      requested.current = next;
      if (!sameValues(next, live.current)) {
        if (value === undefined) live.current = next;
        setValue(report(next));
      }
      return next;
    };
    // A thumb of a range stops at the other one: the first has `min` below it, the second `max` above.
    const limitsOf = (index: number, values: number[]): [number, number] => [
      index === 1 ? nth(values, 0) : min,
      index === 0 && isRange ? nth(values, 1) : max,
    ];
    // Puts a number onto the grid, inside the limits of the thumb.
    const place = (index: number, n: number) => {
      const [lower, upper] = limitsOf(index, live.current);
      return clamp(fit(n), lower, upper);
    };

    const controlRef = useRef<HTMLDivElement>(null);
    const thumbRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const defaultRef = useRef(defaultValue);
    useWriteOnCommit(() => {
      defaultRef.current = defaultValue;
    });
    // The form resets the native inputs behind React's back; put the value back with it. The control
    // is the element to watch, so a slider with no `name` is reset too.
    useFormReset(controlRef, () => resetValue(defaultRef.current ?? min), form);

    const commitRef = useRef(onValueCommit as ((value: SliderValue) => void) | undefined);
    useWriteOnCommit(() => {
      commitRef.current = onValueCommit as ((value: SliderValue) => void) | undefined;
    });
    // Whether a thumb has the focus because of a press, not because of the keyboard. Browsers
    // disagree on whether a `focus()` from a press matches :focus-visible, so the ring is decided here.
    const [pointerFocus, setPointerFocus] = useState(false);
    // The press focuses the thumb so the keys go on from there. It is not keyboard focus, so the
    // ring does not show. The flag is set after the focus moves: the thumb that loses it clears the flag.
    const focusThumb = (index: number) => {
      thumbRefs.current[index]?.focus({ preventScroll: true });
      setPointerFocus(true);
    };
    // Where the value stood when the press began, to tell whether the drag changed it.
    const startedAt = useRef(shown);
    // The thumb that the drag moves, or -1 while that is not known: with both thumbs on one value,
    // the first move away from it says which of them the pointer takes.
    const dragged = useRef(0);
    const moveTo = (fraction: number) => {
      const target = min + fraction * range;
      if (dragged.current < 0) {
        const shared = nth(live.current, 0);
        const fitted = fit(target);
        if (fitted === shared) return;
        dragged.current = fitted < shared ? 0 : 1;
        focusThumb(dragged.current);
      }
      apply(dragged.current, place(dragged.current, target));
    };
    const dragHandlers = usePointerDrag({
      trackRef: controlRef,
      disabled,
      onStart: ({ fraction, thumb }) => {
        startedAt.current = live.current;
        requested.current = null;
        const pressed = thumb ? thumbRefs.current.indexOf(thumb) : -1;
        const lower = nth(live.current, 0);
        const higher = nth(live.current, 1);
        if (!isRange) {
          dragged.current = 0;
        } else if (lower === higher) {
          dragged.current = -1;
        } else if (pressed >= 0) {
          dragged.current = pressed;
        } else {
          // A press on the track takes the thumb nearest to it.
          const at = min + fraction * range;
          dragged.current = Math.abs(at - lower) <= Math.abs(at - higher) ? 0 : 1;
        }
        moveTo(fraction);
        focusThumb(dragged.current >= 0 ? dragged.current : Math.max(pressed, 0));
      },
      onMove: moveTo,
      onEnd: (cancelled) => {
        if (cancelled) {
          // A press that did not complete, such as a touch that became a scroll, leaves the value as
          // it was before the press and commits nothing.
          // The last value asked for, not what is shown: a parent's render of it may be pending.
          const before = startedAt.current;
          const asked = requested.current ?? live.current;
          requested.current = null;
          if (!sameValues(before, asked)) {
            if (value === undefined) {
              live.current = before;
              setValue(report(before));
            } else {
              // The setter skips a value equal to the one committed, which is what the pending
              // render is about to change: the parent is told directly.
              onValueChange?.(report(before));
            }
          }
          return;
        }
        const settled = requested.current;
        if (settled !== null && !sameValues(settled, startedAt.current)) {
          commitRef.current?.(report(settled));
        }
      },
    });

    const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLSpanElement>) => {
      setPointerFocus(false);
      if (disabled || hasModifier(event)) return;
      const from = nth(live.current, index);
      const [lower, upper] = limitsOf(index, live.current);
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
          next = lower;
          break;
        case 'End':
          next = upper;
          break;
        default:
          return;
      }
      event.preventDefault();
      next = place(index, next);
      // A value past the last grid value (an end that is off the grid) would be fitted back against
      // the direction of the key: it stays.
      const against =
        event.key === 'ArrowLeft' || event.key === 'ArrowDown' || event.key === 'PageDown'
          ? next > from
          : next < from;
      if (next === from || (event.key !== 'Home' && event.key !== 'End' && against)) return;
      const asked = apply(index, next);
      commitRef.current?.(report(asked));
    };

    // The dots are at the steps of the grid, the ends included. A range of at most ten steps shows
    // them by itself.
    const intervals = range > 0 ? Math.floor(range / step + 1e-9) : 0;
    const showTicks = (ticks ?? range / step <= 10 + 1e-9) && intervals > 0;
    const textOf = (n: number) => (getValueText ? getValueText(n) : String(n));
    // One thumb is named by the name of the slider. In a range the group has that name (and the id),
    // and its thumbs are told apart by `labels`.
    const groupProps = isRange
      ? {
          role: 'group',
          id: labelled ? id : props.id,
          'aria-label': ariaLabel,
          'aria-labelledby': labelledBy,
        }
      : undefined;
    const thumbName = (index: number) =>
      isRange
        ? (labels?.[index === 0 ? 'minimum' : 'maximum'] ?? ['Minimum', 'Maximum'][index])
        : ariaLabel;

    return (
      <div
        ref={ref}
        className={clsx('flg-slider', className)}
        data-range={dataAttr(isRange)}
        data-ticks={dataAttr(showTicks)}
        data-disabled={dataAttr(disabled)}
        data-invalid={dataAttr(invalid)}
        data-pointer-focus={dataAttr(pointerFocus)}
        {...groupProps}
        {...rootProps}
      >
        <div
          ref={controlRef}
          className="flg-slider-control"
          style={
            {
              '--flg-slider-start': isRange ? positionOf(nth(shown, 0)) : '0%',
              '--flg-slider-end': positionOf(nth(shown, shown.length - 1)),
            } as CSSProperties
          }
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
          {shown.map((n, index) => {
            const [lower, upper] = limitsOf(index, shown);
            return (
              // A disabled slider is not focusable, as a native control that is disabled.
              // eslint-disable-next-line jsx-a11y/interactive-supports-focus
              <span
                key={index}
                ref={(el) => {
                  thumbRefs.current[index] = el;
                }}
                role="slider"
                tabIndex={disabled ? undefined : 0}
                className="flg-slider-thumb"
                style={{ '--flg-slider-pos': positionOf(n) } as CSSProperties}
                id={isRange ? undefined : labelled ? id : props.id}
                aria-valuemin={lower}
                aria-valuemax={upper}
                aria-valuenow={n}
                aria-valuetext={getValueText ? textOf(n) : undefined}
                aria-orientation="horizontal"
                aria-label={thumbName(index)}
                aria-labelledby={isRange ? undefined : labelledBy}
                aria-describedby={ariaDescribedBy}
                aria-invalid={ariaInvalid}
                aria-disabled={disabled ? true : undefined}
                onKeyDown={handleKeyDown(index)}
                onBlur={() => setPointerFocus(false)}
              >
                {disabled ? null : (
                  <span className="flg-surface flg-slider-bubble" aria-hidden="true">
                    {textOf(n)}
                  </span>
                )}
              </span>
            );
          })}
        </div>
        {name === undefined
          ? null
          : shown.map((n, index) => (
              <input
                key={index}
                type="hidden"
                name={name}
                form={form}
                value={String(n)}
                disabled={disabled}
              />
            ))}
      </div>
    );
  }) as <V extends SliderValue = number>(
    props: SliderProps<V> & RefAttributes<HTMLDivElement>,
  ) => ReactElement | null,
);
