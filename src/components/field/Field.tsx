'use client';

import { clsx } from 'clsx';
import { forwardRef, useId, useMemo, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { dataAttr } from '../../internal/data-attr';
import {
  FieldContext,
  fieldChildren,
  isFieldControl,
  isFieldGroup,
} from '../../internal/field-context';
import type { FieldContextValue } from '../../internal/field-context';
import { hasContent } from '../../internal/has-content';
import { devWarn } from '../../internal/warn';

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
   * Content at the right of the label row, such as a character counter or a slider's value. It sits
   * outside the label, so it is not part of the control's name, and it is not hidden from screen
   * readers: add `aria-hidden` yourself when they already get the content another way.
   */
  aside?: ReactNode;
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
    aside,
    id,
    className,
    children,
    ...props
  },
  ref,
) {
  const baseId = useId();
  const [controlError, setControlError] = useState<string | null>(null);
  // The error prop wins: a control's own message only shows when the Field was given none.
  const shownError = error || controlError;
  const invalid = Boolean(shownError);
  const direct = fieldChildren(children);
  // <label for> can only name a labelable element; a group is named through aria-labelledby.
  const labelMode = direct.some(isFieldGroup) ? 'group' : 'for';
  const controls = direct.filter(isFieldControl);
  if (controls.length > 1) {
    devWarn(
      'A Field labels one control, but it has several directly inside. Give each control its ' +
        'own Field.',
    );
  }
  // A control given its own id keeps it; the label follows it so it still names the control.
  const childId = controls
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
      setControlError,
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
  const labelElement = !label ? null : context.labelMode === 'group' ? (
    <span id={context.labelId} className="flg-field-label">
      {labelContent}
    </span>
  ) : (
    <label id={context.labelId} htmlFor={context.controlId} className="flg-field-label">
      {labelContent}
    </label>
  );

  return (
    <div
      ref={ref}
      className={clsx('flg-field', className)}
      data-invalid={dataAttr(invalid)}
      data-disabled={dataAttr(disabled)}
      {...props}
    >
      {hasContent(aside) ? (
        <div className="flg-field-head">
          {labelElement}
          <span className="flg-field-aside">{aside}</span>
        </div>
      ) : (
        labelElement
      )}
      <FieldContext.Provider value={context}>{children}</FieldContext.Provider>
      {description ? (
        <p id={context.descriptionId} className="flg-field-description">
          {description}
        </p>
      ) : null}
      {invalid ? (
        <p id={context.errorId} className="flg-field-error">
          {shownError}
        </p>
      ) : null}
    </div>
  );
});
