'use client';

import { clsx } from 'clsx';
import { forwardRef, useEffect } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { devWarn } from '../../internal/warn';
import { useSegmentedControlContext } from './SegmentedControlContext';

export interface SegmentedControlItemProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'name' | 'value' | 'checked' | 'defaultChecked'
> {
  value: string;
  children: ReactNode;
}

/** One segment of a SegmentedControl. `className` and `style` go on the `<label>`. */
export const SegmentedControlItem = forwardRef<HTMLInputElement, SegmentedControlItemProps>(
  function SegmentedControlItem(
    { value, required, disabled, onChange, className, style, children, ...props },
    ref,
  ) {
    const group = useSegmentedControlContext();
    if (!group) {
      devWarn('SegmentedControlItem must be inside a SegmentedControl, which gives it its name.');
    }
    const register = group?.register;
    useEffect(() => register?.(value), [register, value]);
    const controlled = group?.value !== undefined;

    const handleChange = composeEventHandlers(onChange, () => group?.onValueChange?.(value));

    return (
      <label className={clsx('flg-segmented-item', className)} style={style}>
        <input
          ref={ref}
          type="radio"
          className="flg-segmented-input"
          {...props}
          name={group?.name}
          form={props.form ?? group?.form}
          value={value}
          checked={controlled ? group.value === value : undefined}
          defaultChecked={controlled ? undefined : group?.defaultValue === value}
          required={required ?? group?.required}
          disabled={disabled ?? group?.disabled}
          onChange={handleChange}
        />
        <span className="flg-segmented-label">{children}</span>
      </label>
    );
  },
);
