'use client';

import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { InputHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { markAsFieldControl, useFieldProps } from '../../internal/field-context';
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

const INTERACTIVE = 'a[href], button, input, select, textarea, [tabindex]';

// A press on the frame, the padding or a decorative adornment focuses the input, as if the whole
// frame were the input. Presses on the input itself, or on an interactive adornment such as a clear
// button, behave normally.
function focusInput(event: MouseEvent<HTMLDivElement>) {
  if (event.button !== 0) return;
  const frame = event.currentTarget;
  const input = frame.querySelector<HTMLInputElement>(':scope > input');
  const target = event.target as Element;
  if (!input || input.disabled || target === input) return;
  const interactive = target.closest(INTERACTIVE);
  if (interactive && frame.contains(interactive)) return;
  event.preventDefault();
  input.focus();
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
