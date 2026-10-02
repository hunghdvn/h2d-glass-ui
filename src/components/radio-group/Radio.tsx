'use client';

import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { hasContent } from '../../internal/has-content';
import { devWarn } from '../../internal/warn';
import { useRadioGroupContext } from './RadioGroupContext';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'name'> {
  value: string;
}

/** One option of a RadioGroup. `className` and `style` go on the `<label>`. */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    value,
    checked,
    defaultChecked,
    required,
    disabled,
    onChange,
    className,
    style,
    children,
    ...props
  },
  ref,
) {
  const group = useRadioGroupContext();
  if (!group) devWarn('Radio must be inside a RadioGroup, which gives it its name.');
  const controlled = group?.value !== undefined;

  const handleChange = composeEventHandlers(onChange, () => group?.onValueChange?.(value));

  return (
    <label className={clsx('flg-radio', className)} style={style}>
      <input
        ref={ref}
        type="radio"
        className="flg-radio-input"
        {...props}
        name={group?.name}
        value={value}
        checked={controlled ? group.value === value : checked}
        defaultChecked={
          controlled
            ? undefined
            : group?.defaultValue === undefined
              ? defaultChecked
              : group.defaultValue === value
        }
        required={required ?? group?.required}
        disabled={disabled ?? group?.disabled}
        onChange={handleChange}
      />
      <span className="flg-radio-dot" aria-hidden="true" />
      {hasContent(children) ? <span className="flg-radio-label">{children}</span> : null}
    </label>
  );
});
