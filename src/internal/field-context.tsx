import { Children, Fragment, createContext, isValidElement, useContext } from 'react';
import type { AriaAttributes, ReactElement, ReactNode } from 'react';
import { devWarn } from './warn';

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

/**
 * The props a control shares with its Field. Every one of them, passed directly, wins, except
 * `aria-describedby`, which is added after the Field's description and error.
 */
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
 * Merges a control's props with its Field: `id`, `aria-describedby` (description first, then error,
 * then the ids passed directly), `aria-invalid`, `required` and `disabled`. Returns the remaining
 * props untouched, plus `invalid` resolved to a boolean for the control's `data-invalid`.
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
  // A direct child's own id becomes the Field's control id; one deeper inside cannot be followed.
  if (
    field &&
    id !== undefined &&
    id !== field.controlId &&
    field.labelMode === 'for' &&
    field.labelId !== undefined
  ) {
    devWarn(
      'A control inside a Field has its own `id` but is not a direct child of the Field, so the ' +
        'Field label cannot point at it. Pass the `id` to the Field instead.',
    );
  }
  const resolvedInvalid =
    invalid ??
    (ariaInvalid === undefined ? (field?.invalid ?? false) : isInvalidValue(ariaInvalid));
  return {
    ...rest,
    id: id ?? field?.controlId,
    invalid: resolvedInvalid,
    required: required ?? field?.required,
    disabled: disabled ?? field?.disabled,
    'aria-describedby':
      [field?.descriptionId, field?.errorId, describedBy].filter(Boolean).join(' ') || undefined,
    'aria-invalid': ariaInvalid ?? (resolvedInvalid || undefined),
  };
}

const FIELD_GROUP = Symbol.for('fl-glass-ui.field-group');
const FIELD_CONTROL = Symbol.for('fl-glass-ui.field-control');
const REACT_LAZY = Symbol.for('react.lazy');

interface LazyComponent {
  $$typeof: symbol;
  _payload: unknown;
  _init: (payload: unknown) => unknown;
}

/** Marks a component that renders a control, so a Field takes the `id` passed to it as its own. */
export function markAsFieldControl<T extends object>(component: T): T {
  Object.defineProperty(component, FIELD_CONTROL, { value: true });
  return component;
}

/**
 * Marks a component that renders a group of controls, so a Field names it with aria-labelledby.
 * A group is a control too.
 */
export function markAsFieldGroup<T extends object>(component: T): T {
  Object.defineProperty(component, FIELD_GROUP, { value: true });
  return markAsFieldControl(component);
}

/** The elements a Field renders directly, looking through Fragments (they render no element). */
export function fieldChildren(children: ReactNode): ReactElement[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return [];
    return child.type === Fragment ? fieldChildren(child.props.children) : [child];
  });
}

function resolveType(node: ReactNode): unknown {
  if (!isValidElement(node)) return undefined;
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
  return type;
}

function hasMarker(type: unknown, marker: symbol): boolean {
  return (
    (typeof type === 'function' || (typeof type === 'object' && type !== null)) && marker in type
  );
}

/** Whether a Field's direct child is a marked group, such as RadioGroup. */
export function isFieldGroup(node: ReactNode): boolean {
  return hasMarker(resolveType(node), FIELD_GROUP);
}

/** Whether a Field's direct child is a marked control, such as Input. */
export function isFieldControl(node: ReactNode): boolean {
  return hasMarker(resolveType(node), FIELD_CONTROL);
}
