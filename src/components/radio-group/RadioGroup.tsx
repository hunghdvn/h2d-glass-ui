'use client';

import { clsx } from 'clsx';
import { forwardRef, useId } from 'react';
import type { HTMLAttributes } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { markAsFieldGroup, useFieldContext, useFieldProps } from '../../internal/field-context';
import { devWarn } from '../../internal/warn';
import { RadioGroupContext } from './RadioGroupContext';
import type { RadioGroupContextValue } from './RadioGroupContext';

export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  /** The form field name shared by every Radio. Generated when omitted. */
  name?: string;
  /** The selected value, for a controlled group. */
  value?: string;
  /** The value selected at first, for an uncontrolled group. */
  defaultValue?: string;
  /** Called with the value of the Radio the user selects. */
  onValueChange?: (value: string) => void;
  /** Layout only: arrow keys move through the options either way. */
  orientation?: 'vertical' | 'horizontal';
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
}

/** A set of Radio options, of which the user picks one. Arrow keys move the selection. */
export const RadioGroup = markAsFieldGroup(
  forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
    {
      name,
      value,
      defaultValue,
      onValueChange,
      orientation = 'vertical',
      className,
      children,
      ...props
    },
    ref,
  ) {
    const field = useFieldContext();
    const { invalid, required, disabled, ...groupProps } = useFieldProps(props);
    const generatedName = useId();
    if (field?.labelMode === 'for') {
      devWarn(
        'RadioGroup is inside a Field but is not its direct child, so the Field cannot label it. ' +
          'Make RadioGroup the direct child of Field.',
      );
    }
    const context: RadioGroupContextValue = {
      name: name ?? generatedName,
      value,
      defaultValue,
      onValueChange,
      required,
      disabled,
    };
    return (
      <div
        ref={ref}
        role="radiogroup"
        className={clsx('flg-radio-group', className)}
        data-orientation={orientation}
        data-invalid={dataAttr(invalid)}
        aria-labelledby={field?.labelId}
        aria-required={required || undefined}
        {...groupProps}
      >
        <RadioGroupContext.Provider value={context}>{children}</RadioGroupContext.Provider>
      </div>
    );
  }),
);
