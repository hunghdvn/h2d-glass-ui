import { render, screen } from '@testing-library/react';
import { createElement, forwardRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { FieldContext, isFieldGroup, markAsFieldGroup, useFieldProps } from './field-context';
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

  it('lets props passed to the control win over the Field', () => {
    renderInField(
      <Probe id="mine" aria-describedby="hint" invalid={false} required={false} disabled />,
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'mine');
    expect(input).toHaveAttribute('aria-describedby', 'hint');
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

describe('isFieldGroup', () => {
  const Group = markAsFieldGroup(
    forwardRef<HTMLDivElement>(function Group(_props, ref) {
      return <div ref={ref} />;
    }),
  );
  function Plain() {
    return <div />;
  }

  it('recognises a marked component and nothing else', () => {
    expect(isFieldGroup(<Group />)).toBe(true);
    expect(isFieldGroup(<Plain />)).toBe(false);
    expect(isFieldGroup(<div />)).toBe(false);
    expect(isFieldGroup('text')).toBe(false);
    expect(isFieldGroup(null)).toBe(false);
  });

  it('sees through the lazy reference a Server Component passes down', () => {
    // The shape React's Flight client gives a client component an RSC payload refers to.
    const reference = {
      $$typeof: Symbol.for('react.lazy'),
      _payload: Group,
      _init: (payload: unknown) => payload,
    };
    expect(isFieldGroup(createElement(reference as unknown as ElementType))).toBe(true);
  });
});
