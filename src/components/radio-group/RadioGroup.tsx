'use client';

import { clsx } from 'clsx';
import { forwardRef, useId, useMemo } from 'react';
import type { HTMLAttributes } from 'react';
import { dataAttr } from '../../internal/data-attr';
import {
  FieldContext,
  markAsFieldGroup,
  useFieldContext,
  useFieldProps,
} from '../../internal/field-context';
import { devWarn } from '../../internal/warn';
import { RadioGroupContext } from './RadioGroupContext';
import type { RadioGroupContextValue } from './RadioGroupContext';

export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  /** The form field name shared by every Radio. Generated when omitted. */
  name?: string;
  /** The selected value, for a controlled group. `null` selects nothing; leave it `undefined` for an uncontrolled group. */
  value?: string | null;
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
    // Only a group that is the Field's direct child is the control the Field labels.
    const labelled = field?.labelMode === 'group';
    // An unlabelled group keeps its own id below, so the Field never sees it (and does not warn
    // about it on top of the warning that follows).
    const { invalid, required, disabled, id, ...groupProps } = useFieldProps(
      labelled ? props : { ...props, id: undefined },
    );
    const generatedName = useId();
    if (field?.labelMode === 'for' && field.labelId !== undefined) {
      devWarn(
        'RadioGroup is inside a Field but is not its direct child, so the Field cannot label it. ' +
          'Make RadioGroup the direct child of Field.',
      );
    }
    const groupName = name ?? generatedName;
    const context = useMemo<RadioGroupContextValue>(
      () => ({ name: groupName, value, defaultValue, onValueChange, required, disabled }),
      [groupName, value, defaultValue, onValueChange, required, disabled],
    );
    return (
      <div
        ref={ref}
        role="radiogroup"
        className={clsx('flg-radio-group', className)}
        data-orientation={orientation}
        data-invalid={dataAttr(invalid)}
        aria-labelledby={labelled ? field.labelId : undefined}
        aria-required={required || undefined}
        {...groupProps}
        id={labelled ? id : props.id}
      >
        {/* The Field belongs to the group, not to a control placed inside one of its options. */}
        <FieldContext.Provider value={null}>
          <RadioGroupContext.Provider value={context}>{children}</RadioGroupContext.Provider>
        </FieldContext.Provider>
      </div>
    );
  }),
);
