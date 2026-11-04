'use client';

import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { markAsFieldControl, useFieldProps } from '../../internal/field-context';
import { focusInput } from '../../internal/focus-input';
import { hasContent } from '../../internal/has-content';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  /** Marks the value as wrong. Inside a Field with an error this is already true. */
  invalid?: boolean;
  /** Shown before the text, for example an icon. Decorative unless it is interactive. */
  startContent?: ReactNode;
  /** Shown after the text, for example a unit. */
  endContent?: ReactNode;
}

/** A single-line text input. `className` and `style` go on the frame, every other prop on `<input>`. */
export const Input = markAsFieldControl(
  forwardRef<HTMLInputElement, InputProps>(function Input(
    { size = 'md', startContent, endContent, className, style, ...props },
    ref,
  ) {
    const { invalid, ...inputProps } = useFieldProps(props);
    return (
      // The frame only forwards mouse presses to the input; keyboard users reach the input directly.
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div
        className={clsx('flg-input', className)}
        style={style}
        data-size={size}
        data-invalid={dataAttr(invalid)}
        data-disabled={dataAttr(inputProps.disabled)}
        onMouseDown={focusInput}
      >
        {hasContent(startContent) ? (
          <span className="flg-input-adornment">{startContent}</span>
        ) : null}
        <input ref={ref} {...inputProps} />
        {hasContent(endContent) ? <span className="flg-input-adornment">{endContent}</span> : null}
      </div>
    );
  }),
);
