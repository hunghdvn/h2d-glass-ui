'use client';

import { clsx } from 'clsx';
import { forwardRef, useEffect, useId } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { hasContent } from '../../internal/has-content';
import { STATUS_WORDS, StatusIcon } from '../../internal/icons';
import { numberFormat } from '../../internal/intl';
import { clamp, cssPercent, isNumber, toPercent } from '../../internal/number';
import { useRequireName } from '../../internal/use-require-name';
import { devWarn } from '../../internal/warn';
import { withDefaults } from '../../internal/with-defaults';

export type ProgressVariant = 'thin' | 'glow' | 'inline';
export type ProgressStatus = 'default' | 'success' | 'error';

/** The words a Progress says; translate them here. */
export interface ProgressLabels {
  success: string;
  error: string;
}

export type ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'children'> & {
  /**
   * How far the work is, from 0 to `max`. `null` or no value means the progress is indeterminate:
   * the amount is not known.
   */
  value?: number | null;
  /** The value that is all of it. Default 100. */
  max?: number;
  /** The visible name of the progress. It names the bar unless `aria-label` or `aria-labelledby` does. */
  label?: ReactNode;
  /** Shows the value as text, by default a percent. Default false. */
  showValue?: boolean;
  /** Writes the value, for the text shown and for screen readers, such as "3 of 8 files". */
  getValueText?: (value: number, max: number) => string;
  /** The language of the percent. Default `'en-US'`. */
  locale?: string;
  /** `success` and `error` change the colour, show an icon and add the status to the value text. */
  status?: ProgressStatus;
  size?: 'sm' | 'md';
  variant?: ProgressVariant;
  /** Default English words; any of them can be replaced. */
  labels?: Partial<ProgressLabels>;
};

const DEFAULT_LABELS: ProgressLabels = {
  success: STATUS_WORDS.success,
  error: STATUS_WORDS.error,
};

/**
 * A bar that shows how far some work is, in one of three looks. The root is the `progressbar`, so
 * the whole component is one thing to assistive technology: the name, the value and the status
 * are attributes on it, and the visible value is hidden from it. Not the native `<progress>`: the
 * fill needs the glow, the stripes and the slide that the engines do not let a native one have.
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  {
    value = null,
    max: maxProp = 100,
    label,
    showValue = false,
    getValueText,
    locale = 'en-US',
    status = 'default',
    size = 'md',
    variant = 'thin',
    labels,
    className,
    ...props
  },
  ref,
) {
  const labelId = useId();
  const words = withDefaults(DEFAULT_LABELS, labels);

  const maxValid = Number.isFinite(maxProp) && maxProp > 0;
  const max = maxValid ? maxProp : 100;
  // A value that is not a finite number is the same as none: the amount is not known.
  const valueFinite = isNumber(value);
  const determinate = valueFinite;
  const clamped = valueFinite ? clamp(value, 0, max) : 0;

  // The deps are primitives, so the effect runs when a problem appears or changes, not on every
  // render. The clamp message leaves the value out: a value that keeps going past `max` (a low
  // estimate of the total) would otherwise be a new message, and a new warning, on every render.
  const notFinite = typeof value === 'number' && !valueFinite ? String(value) : null;
  const clampedValue = valueFinite && clamped !== value;
  useEffect(() => {
    if (!maxValid) {
      devWarn(`Progress: max must be a positive finite number, not ${String(maxProp)}; using 100.`);
    }
    if (notFinite !== null) {
      devWarn(
        `Progress: value ${notFinite} is not a finite number; the progress is shown as indeterminate.`,
      );
    }
    if (clampedValue) devWarn('Progress: a value outside 0 to `max` is clamped.');
  }, [maxValid, maxProp, notFinite, clampedValue]);

  const named = hasContent(label);
  // The attribute of the caller wins. `aria-label` is not set beside `aria-labelledby`, which would
  // win over it: a caller who gives the former means it to be the name.
  const labelledBy =
    props['aria-labelledby'] ?? (named && props['aria-label'] === undefined ? labelId : undefined);
  useRequireName({ 'aria-label': props['aria-label'], 'aria-labelledby': labelledBy }, 'Progress');

  const percent = determinate
    ? numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(
        // Rounded down, so the text never says 100% before the bar is full. `toPercent` first, so a
        // value such as 0.57 of 1 is not floored to 56 by floating-point noise.
        Math.floor(toPercent(clamped / max)) / 100,
      )
    : '';
  const customText = determinate ? getValueText?.(clamped, max) : undefined;
  const valueText = determinate ? (customText ?? percent) : '';
  // With a known value the text is always given: the percent that is shown is rounded down, so it
  // differs from `aria-valuenow` even when `max` is 100. A progressbar has no ARIA for an error, so
  // the status goes in the text of the value.
  const ariaValueText = determinate
    ? status === 'default'
      ? valueText
      : `${valueText}, ${words[status]}`
    : undefined;

  // The icon is there without `showValue`, so the status is not told by colour alone.
  const icon =
    status === 'default' ? null : (
      <span className="flg-progress-icon">
        <StatusIcon status={status} />
      </span>
    );
  const inline = variant === 'inline';
  // `inline` keeps the column of the value while the progress is indeterminate, so its bar is as
  // long as the others; `thin` and `glow` have nothing to show then.
  const showText = determinate && showValue;
  const hasCell = showText || icon !== null || (inline && showValue);
  const cell = hasCell ? (
    <span className="flg-progress-value" aria-hidden="true">
      {icon}
      {showText ? valueText : null}
    </span>
  ) : null;

  const fillStyle = determinate
    ? ({
        '--flg-progress-value': cssPercent(clamped / max),
      } as CSSProperties)
    : undefined;

  return (
    <div
      {...props}
      ref={ref}
      className={clsx('flg-progress', className)}
      data-variant={variant}
      data-size={size}
      data-status={status}
      data-indeterminate={dataAttr(!determinate)}
      role="progressbar"
      aria-labelledby={labelledBy}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={determinate ? clamped : undefined}
      aria-valuetext={ariaValueText}
    >
      {named || (!inline && cell) ? (
        <div className="flg-progress-head">
          {named ? (
            <span className="flg-progress-label" id={labelId}>
              {label}
            </span>
          ) : null}
          {inline ? null : cell}
        </div>
      ) : null}
      <div className="flg-progress-line">
        <div className="flg-progress-track">
          <div className="flg-progress-fill" style={fillStyle} />
        </div>
        {inline ? cell : null}
      </div>
    </div>
  );
});
