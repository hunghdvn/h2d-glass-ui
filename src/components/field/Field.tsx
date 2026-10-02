'use client';

import { clsx } from 'clsx';
import { forwardRef, useId, useMemo } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { dataAttr } from '../../internal/data-attr';
import {
  FieldContext,
  fieldChildren,
  isFieldControl,
  isFieldGroup,
} from '../../internal/field-context';
import type { FieldContextValue } from '../../internal/field-context';

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id' | 'children'> {
  label?: ReactNode;
  /** Help text under the control, announced with it. */
  description?: ReactNode;
  /** Error text under the control. Any error marks the field invalid. */
  error?: ReactNode;
  /** Shows an asterisk and makes the control required. */
  required?: boolean;
  disabled?: boolean;
  /**
   * The id of the control inside, which the label points at. A control's own `id` takes precedence.
   * Generated when omitted.
   */
  id?: string;
  children: ReactNode;
}

/** Label, description and error for the control inside, wired up for assistive technology. */
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  {
    label,
    description,
    error,
    required = false,
    disabled = false,
    id,
    className,
    children,
    ...props
  },
  ref,
) {
  const baseId = useId();
  const invalid = Boolean(error);
  const direct = fieldChildren(children);
  // <label for> can only name a labelable element; a group is named through aria-labelledby.
  const labelMode = direct.some(isFieldGroup) ? 'group' : 'for';
  // A control given its own id keeps it; the label follows it so it still names the control.
  const childId = direct
    .filter(isFieldControl)
    .map((child) => (child.props as { id?: unknown }).id)
    .find((value): value is string => typeof value === 'string');
  const controlId = childId ?? id ?? `${baseId}-control`;
  const labelId = label ? `${baseId}-label` : undefined;
  const descriptionId = description ? `${baseId}-description` : undefined;
  const errorId = invalid ? `${baseId}-error` : undefined;
  const context = useMemo<FieldContextValue>(
    () => ({
      controlId,
      labelId,
      descriptionId,
      errorId,
      invalid,
      required,
      disabled,
      labelMode,
    }),
    [controlId, labelId, descriptionId, errorId, invalid, required, disabled, labelMode],
  );
  const labelContent = (
    <>
      {label}
      {required ? (
        <span className="flg-field-required" aria-hidden="true">
          *
        </span>
      ) : null}
    </>
  );

  return (
    <div
      ref={ref}
      className={clsx('flg-field', className)}
      data-invalid={dataAttr(invalid)}
      data-disabled={dataAttr(disabled)}
      {...props}
    >
      {!label ? null : context.labelMode === 'group' ? (
        <span id={context.labelId} className="flg-field-label">
          {labelContent}
        </span>
      ) : (
        <label id={context.labelId} htmlFor={context.controlId} className="flg-field-label">
          {labelContent}
        </label>
      )}
      <FieldContext.Provider value={context}>{children}</FieldContext.Provider>
      {description ? (
        <p id={context.descriptionId} className="flg-field-description">
          {description}
        </p>
      ) : null}
      {invalid ? (
        <p id={context.errorId} className="flg-field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
});
