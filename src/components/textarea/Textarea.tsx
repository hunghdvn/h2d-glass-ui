'use client';

import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { markAsFieldControl, useFieldProps } from '../../internal/field-context';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Marks the value as wrong. Inside a Field with an error this is already true. */
  invalid?: boolean;
}

/** A multi-line text input that the user can resize vertically. */
export const Textarea = markAsFieldControl(
  forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, ...props }, ref) {
    const { invalid, ...textareaProps } = useFieldProps(props);
    return (
      <textarea
        ref={ref}
        className={clsx('flg-textarea', className)}
        data-invalid={dataAttr(invalid)}
        {...textareaProps}
      />
    );
  }),
);
