'use client';

import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { markAsFieldControl, useFieldProps } from '../../internal/field-context';
import { hasContent } from '../../internal/has-content';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Marks the choice as wrong. Inside a Field with an error this is already true. */
  invalid?: boolean;
  /** Called after `onChange` with the new on/off state. */
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * An on/off switch: a native checkbox with `role="switch"`. `className` and `style` go on the
 * `<label>`.
 */
export const Switch = markAsFieldControl(
  forwardRef<HTMLInputElement, SwitchProps>(function Switch(
    { onCheckedChange, onChange, className, style, children, ...props },
    ref,
  ) {
    const { invalid, ...inputProps } = useFieldProps(props);

    const handleChange = composeEventHandlers(onChange, (event: ChangeEvent<HTMLInputElement>) =>
      onCheckedChange?.(event.target.checked),
    );

    return (
      <label
        className={clsx('flg-switch', className)}
        style={style}
        data-invalid={dataAttr(invalid)}
      >
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
        {hasContent(children) ? <span className="flg-switch-label">{children}</span> : null}
      </label>
    );
  }),
);
