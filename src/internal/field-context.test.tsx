import { render, renderHook, screen } from '@testing-library/react';
import { createElement, forwardRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import {
  FieldContext,
  isFieldControl,
  isFieldGroup,
  markAsFieldControl,
  markAsFieldGroup,
  useControlError,
  useFieldProps,
} from './field-context';
import type { FieldContextValue, FieldControlProps } from './field-context';

const FIELD: FieldContextValue = {
  controlId: 'email',
  labelId: 'email-label',
  descriptionId: 'email-description',
  errorId: 'email-error',
  invalid: true,
  required: true,
  disabled: false,
  labelMode: 'for',
  setControlError: () => {},
};

// A minimal control: what useFieldProps returns goes straight onto a native input.
function Probe(props: FieldControlProps) {
  const { invalid, ...inputProps } = useFieldProps(props);
  return <input data-invalid={invalid ? '' : undefined} {...inputProps} />;
}

function renderInField(ui: ReactNode, field: FieldContextValue = FIELD) {
  return render(<FieldContext.Provider value={field}>{ui}</FieldContext.Provider>);
}

describe('useFieldProps', () => {
  it('leaves a control outside a Field untouched', () => {
    render(<Probe />);
    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('id');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('data-invalid');
    expect(input).not.toBeRequired();
    expect(input).toBeEnabled();
  });

  it('takes the id, description, error, invalid and required state from its Field', () => {
    renderInField(<Probe />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'email');
    expect(input).toHaveAttribute('aria-describedby', 'email-description email-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('data-invalid');
    expect(input).toBeRequired();
  });

  it('only points at the parts the Field renders', () => {
    renderInField(<Probe />, {
      ...FIELD,
      descriptionId: undefined,
      errorId: undefined,
      invalid: false,
    });
    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('lets props passed to the control win over the Field, and merges aria-describedby', () => {
    renderInField(
      <Probe id="mine" aria-describedby="hint" invalid={false} required={false} disabled />,
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'mine');
    expect(input).toHaveAttribute('aria-describedby', 'email-description email-error hint');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('data-invalid');
    expect(input).not.toBeRequired();
    expect(input).toBeDisabled();
  });

  it('reads aria-invalid passed directly as the invalid state', () => {
    const { unmount } = renderInField(<Probe aria-invalid="false" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByRole('textbox')).not.toHaveAttribute('data-invalid');
    unmount();
    render(<Probe aria-invalid="spelling" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'spelling');
    expect(screen.getByRole('textbox')).toHaveAttribute('data-invalid');
  });
});

describe('field markers', () => {
  const Group = markAsFieldGroup(
    forwardRef<HTMLDivElement>(function Group(_props, ref) {
      return <div ref={ref} />;
    }),
  );
  const Control = markAsFieldControl(
    forwardRef<HTMLInputElement>(function Control(_props, ref) {
      return <input ref={ref} />;
    }),
  );
  function Plain() {
    return <div />;
  }

  // The shape React's Flight client gives a client component an RSC payload refers to.
  const lazy = (component: unknown) =>
    createElement({
      $$typeof: Symbol.for('react.lazy'),
      _payload: component,
      _init: (payload: unknown) => payload,
    } as unknown as ElementType);

  it('recognises a marked group and nothing else', () => {
    expect(isFieldGroup(<Group />)).toBe(true);
    expect(isFieldGroup(<Control />)).toBe(false);
    expect(isFieldGroup(<Plain />)).toBe(false);
    expect(isFieldGroup(<div />)).toBe(false);
    expect(isFieldGroup('text')).toBe(false);
    expect(isFieldGroup(null)).toBe(false);
  });

  it('recognises a marked control, and a group is a control too', () => {
    expect(isFieldControl(<Control />)).toBe(true);
    expect(isFieldControl(<Group />)).toBe(true);
    expect(isFieldControl(<Plain />)).toBe(false);
    expect(isFieldControl(<div />)).toBe(false);
    expect(isFieldControl('text')).toBe(false);
    expect(isFieldControl(null)).toBe(false);
  });

  it('sees through the lazy reference a Server Component passes down', () => {
    expect(isFieldGroup(lazy(Group))).toBe(true);
    expect(isFieldControl(lazy(Control))).toBe(true);
    expect(isFieldGroup(lazy(Control))).toBe(false);
  });
});

describe('useControlError', () => {
  it('returns null inside a Field, where the Field shows the message', () => {
    const { result } = renderHook(() => useControlError('Not a valid tag'), {
      wrapper: ({ children }) => (
        <FieldContext.Provider value={FIELD}>{children}</FieldContext.Provider>
      ),
    });
    expect(result.current).toBeNull();
  });

  it('returns an id and the message outside a Field, and null without a message', () => {
    const { result, rerender } = renderHook(({ message }) => useControlError(message), {
      initialProps: { message: 'Not a valid tag' as string | null },
    });
    expect(result.current).toEqual({ id: expect.any(String), message: 'Not a valid tag' });
    expect(result.current?.id).not.toBe('');
    rerender({ message: null });
    expect(result.current).toBeNull();
  });
});
