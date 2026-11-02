'use client';

import { clsx } from 'clsx';
import { forwardRef, useCallback, useId, useMemo, useRef } from 'react';
import type { HTMLAttributes } from 'react';
import { dataAttr } from '../../internal/data-attr';
import {
  FieldContext,
  markAsFieldGroup,
  useFieldContext,
  useFieldProps,
} from '../../internal/field-context';
import { mergeRefs } from '../../internal/merge-refs';
import { useFormReset } from '../../internal/use-form-reset';
import { useRequireName } from '../../internal/use-require-name';
import { devWarn } from '../../internal/warn';
import { SegmentedControlContext } from './SegmentedControlContext';
import type { SegmentedControlContextValue } from './SegmentedControlContext';

export interface SegmentedControlProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> {
  /** The selected value, for a controlled control. `null` selects nothing; leave it `undefined` for an uncontrolled one. */
  value?: string | null;
  /** The value selected at first, for an uncontrolled control. */
  defaultValue?: string;
  /** Called with the value of the item the user selects. */
  onValueChange?: (value: string) => void;
  /** The form field name shared by every item. Generated when omitted. */
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  /** Default `"md"`. There is no large size. */
  size?: 'sm' | 'md';
  /** Fills the width of its container, and shares it equally between the segments. */
  fullWidth?: boolean;
}

/**
 * A row of segments of which the user picks one: native radios, so the arrow keys, Tab and the form
 * work as they do for a RadioGroup. It looks like Tabs `segmented`, but chooses a value and does
 * not switch panels.
 */
export const SegmentedControl = markAsFieldGroup(
  forwardRef<HTMLDivElement, SegmentedControlProps>(function SegmentedControl(
    {
      value,
      defaultValue,
      onValueChange,
      name,
      size = 'md',
      fullWidth,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const field = useFieldContext();
    // Only a control that is the Field's direct child is the one the Field labels.
    const labelled = field?.labelMode === 'group';
    // An unlabelled control keeps its own id below, so the Field never sees it (and does not warn
    // about it on top of the warning that follows).
    const { invalid, required, disabled, id, ...groupProps } = useFieldProps(
      labelled ? props : { ...props, id: undefined },
    );
    const generatedName = useId();
    if (field?.labelMode === 'for' && field.labelId !== undefined) {
      devWarn(
        'SegmentedControl is inside a Field but is not its direct child, so the Field cannot ' +
          'label it. Make SegmentedControl the direct child of Field.',
      );
    }
    useRequireName(
      {
        'aria-label': props['aria-label'],
        'aria-labelledby': props['aria-labelledby'] ?? (labelled ? field.labelId : undefined),
      },
      'SegmentedControl',
    );
    const groupName = name ?? generatedName;

    // The browser puts each radio back to the `checked` attribute React wrote at mount. A controlled
    // group holds a value the attribute may not know any more, so it is written back to the radios.
    const rootRef = useRef<HTMLDivElement>(null);
    useFormReset(rootRef, () => {
      if (value === undefined) return;
      rootRef.current
        ?.querySelectorAll<HTMLInputElement>('input.flg-segmented-input')
        .forEach((input) => {
          input.checked = input.value === value;
        });
    });

    // How many mounted items have each value, to warn about a second one.
    const counts = useRef(new Map<string, number>());
    const register = useCallback((itemValue: string) => {
      const count = (counts.current.get(itemValue) ?? 0) + 1;
      counts.current.set(itemValue, count);
      if (count > 1) {
        devWarn(
          `Two SegmentedControlItem parts have the value "${itemValue}", so the user cannot tell ` +
            'them apart.',
        );
      }
      return () => {
        counts.current.set(itemValue, (counts.current.get(itemValue) ?? 1) - 1);
      };
    }, []);

    const context = useMemo<SegmentedControlContextValue>(
      () => ({
        name: groupName,
        value,
        defaultValue,
        onValueChange,
        required,
        disabled,
        register,
      }),
      [groupName, value, defaultValue, onValueChange, required, disabled, register],
    );
    return (
      <div
        ref={mergeRefs(rootRef, ref)}
        role="radiogroup"
        className={clsx('flg-segmented', className)}
        data-size={size}
        data-full-width={dataAttr(fullWidth)}
        data-invalid={dataAttr(invalid)}
        aria-labelledby={labelled ? field.labelId : undefined}
        aria-required={required || undefined}
        {...groupProps}
        id={labelled ? id : props.id}
      >
        {/* The Field belongs to the control, not to something placed inside one of its segments. */}
        <FieldContext.Provider value={null}>
          <SegmentedControlContext.Provider value={context}>
            {children}
          </SegmentedControlContext.Provider>
        </FieldContext.Provider>
      </div>
    );
  }),
);
