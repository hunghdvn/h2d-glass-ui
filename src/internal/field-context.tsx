import { createContext, isValidElement, useContext } from 'react';
import type { AriaAttributes, ReactNode } from 'react';

/** What a `Field` tells the control inside it. */
export interface FieldContextValue {
  controlId: string;
  /** Present only when the Field renders a label. */
  labelId: string | undefined;
  /** Present only when the Field renders a description. */
  descriptionId: string | undefined;
  /** Present only when the Field renders an error. */
  errorId: string | undefined;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  /** `"group"` when the label names a group (RadioGroup) through aria-labelledby instead of `for`. */
  labelMode: 'for' | 'group';
}

export const FieldContext = createContext<FieldContextValue | null>(null);

export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext);
}

/** The props a control shares with its Field. Every one of them, passed directly, wins. */
export interface FieldControlProps {
  id?: string;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: AriaAttributes['aria-invalid'];
}

function isInvalidValue(value: AriaAttributes['aria-invalid']): boolean {
  return value !== undefined && value !== false && value !== 'false';
}

/**
 * Merges a control's props with its Field: `id`, `aria-describedby` (description first, then error),
 * `aria-invalid`, `required` and `disabled`. Returns the remaining props untouched, plus `invalid`
 * resolved to a boolean for the control's `data-invalid`.
 */
export function useFieldProps<P extends FieldControlProps>({
  id,
  invalid,
  required,
  disabled,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: P) {
  const field = useFieldContext();
  const resolvedInvalid =
    invalid ??
    (ariaInvalid === undefined ? (field?.invalid ?? false) : isInvalidValue(ariaInvalid));
  const fieldDescribedBy =
    [field?.descriptionId, field?.errorId].filter(Boolean).join(' ') || undefined;
  return {
    ...rest,
    id: id ?? field?.controlId,
    invalid: resolvedInvalid,
    required: required ?? field?.required,
    disabled: disabled ?? field?.disabled,
    'aria-describedby': describedBy ?? fieldDescribedBy,
    'aria-invalid': ariaInvalid ?? (resolvedInvalid || undefined),
  };
}

const FIELD_GROUP = Symbol.for('fl-glass-ui.field-group');
const REACT_LAZY = Symbol.for('react.lazy');

interface LazyComponent {
  $$typeof: symbol;
  _payload: unknown;
  _init: (payload: unknown) => unknown;
}

/** Marks a component that renders a group of controls, so a Field names it with aria-labelledby. */
export function markAsFieldGroup<T extends object>(component: T): T {
  Object.defineProperty(component, FIELD_GROUP, { value: true });
  return component;
}

/** Whether a Field's direct child is a marked group, such as RadioGroup. */
export function isFieldGroup(node: ReactNode): boolean {
  if (!isValidElement(node)) return false;
  let type: unknown = node.type;
  // A Server Component passes client components down as lazy references. Reading one returns the
  // component once its code has loaded, and suspends until then, just as rendering it would.
  if (
    typeof type === 'object' &&
    type !== null &&
    (type as LazyComponent).$$typeof === REACT_LAZY
  ) {
    const lazy = type as LazyComponent;
    type = lazy._init(lazy._payload);
  }
  return (
    (typeof type === 'function' || (typeof type === 'object' && type !== null)) &&
    FIELD_GROUP in type
  );
}
