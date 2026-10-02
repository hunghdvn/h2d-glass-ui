'use client';

import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { useFieldProps } from '../../internal/field-context';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Called after `onChange` with the new on/off state. */
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * An on/off switch: a native checkbox with `role="switch"`. `className` and `style` go on the
 * `<label>`.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { onCheckedChange, onChange, className, style, children, ...props },
  ref,
) {
  const { invalid, ...inputProps } = useFieldProps(props);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    onCheckedChange?.(event.target.checked);
  };

  return (
    <label className={clsx('flg-switch', className)} style={style} data-invalid={dataAttr(invalid)}>
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        className="flg-switch-input"
        {...inputProps}
        onChange={handleChange}
      />
      <span className="flg-switch-track" aria-hidden="true">
        <span className="flg-switch-thumb" />
      </span>
      {children ? <span className="flg-switch-label">{children}</span> : null}
    </label>
  );
});
