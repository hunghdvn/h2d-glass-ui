'use client';

import { clsx } from 'clsx';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { useFieldProps } from '../../internal/field-context';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Shows a dash instead of a check, for "some of these are selected". */
  indeterminate?: boolean;
  /** Called after `onChange` with the new checked state. */
  onCheckedChange?: (checked: boolean) => void;
}

/** A native checkbox with the glass look. `className` and `style` go on the `<label>`. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { indeterminate = false, onCheckedChange, onChange, className, style, children, ...props },
  ref,
) {
  const { invalid, ...inputProps } = useFieldProps(props);
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, []);

  // `indeterminate` exists only as a DOM property. A click clears it, so it is set again after every
  // render: the prop stays the source of truth.
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    onCheckedChange?.(event.target.checked);
  };

  return (
    <label
      className={clsx('flg-checkbox', className)}
      style={style}
      data-invalid={dataAttr(invalid)}
    >
      <input
        ref={inputRef}
        type="checkbox"
        className="flg-checkbox-input"
        {...inputProps}
        onChange={handleChange}
      />
      <span className="flg-checkbox-box" aria-hidden="true">
        <svg
          className="flg-checkbox-check"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          focusable="false"
        >
          <path d="M2.5 6.2 5 8.5l4.5-5" />
        </svg>
        <svg
          className="flg-checkbox-dash"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          focusable="false"
        >
          <path d="M3 6h6" />
        </svg>
      </span>
      {children ? <span className="flg-checkbox-label">{children}</span> : null}
    </label>
  );
});
