'use client';

import { clsx } from 'clsx';
import { Children, forwardRef, useId } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { FieldContext, isFieldGroup } from '../../internal/field-context';
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
  /** The id of the control inside, which the label points at. Generated when omitted. */
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
  const context: FieldContextValue = {
    controlId: id ?? `${baseId}-control`,
    labelId: label ? `${baseId}-label` : undefined,
    descriptionId: description ? `${baseId}-description` : undefined,
    errorId: invalid ? `${baseId}-error` : undefined,
    invalid,
    required,
    disabled,
    // <label for> can only name a labelable element; a group is named through aria-labelledby.
    labelMode: Children.toArray(children).some(isFieldGroup) ? 'group' : 'for',
  };
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
