'use client';

import { clsx } from 'clsx';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { markAsFieldControl, useFieldProps } from '../../internal/field-context';
import { hasContent } from '../../internal/has-content';
import { BoxCheckIcon } from '../../internal/icons';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Shows a dash instead of a check, for "some of these are selected". */
  indeterminate?: boolean;
  /** Marks the choice as wrong. Inside a Field with an error this is already true. */
  invalid?: boolean;
  /** Called after `onChange` with the new checked state. */
  onCheckedChange?: (checked: boolean) => void;
}

/** A native checkbox with the glass look. `className` and `style` go on the `<label>`. */
export const Checkbox = markAsFieldControl(
  forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
    { indeterminate = false, onCheckedChange, onChange, className, style, children, ...props },
    ref,
  ) {
    const { invalid, ...inputProps } = useFieldProps(props);
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, []);

    // `indeterminate` exists only as a DOM property. A click clears it, so it is set again after every
    // render (and at the end of `handleChange`): the prop stays the source of truth.
    useEffect(() => {
      if (inputRef.current) inputRef.current.indeterminate = indeterminate;
    });

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      composeEventHandlers(onChange, (changed) => onCheckedChange?.(changed.target.checked))(event);
      // The click cleared it. When the parent did not re-render, no effect restores it.
      event.currentTarget.indeterminate = indeterminate;
    };

    return (
      <label
        className={clsx('flg-checkbox', className)}
        style={style}
        data-invalid={dataAttr(invalid)}
        data-indeterminate={dataAttr(indeterminate)}
      >
        <input
          ref={inputRef}
          type="checkbox"
          className="flg-checkbox-input"
          {...inputProps}
          onChange={handleChange}
        />
        <span className="flg-checkbox-box" aria-hidden="true">
          <BoxCheckIcon className="flg-checkbox-check" />
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
        {hasContent(children) ? <span className="flg-checkbox-label">{children}</span> : null}
      </label>
    );
  }),
);
