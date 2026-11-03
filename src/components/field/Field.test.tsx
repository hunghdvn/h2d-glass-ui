import { render, screen } from '@testing-library/react';
import { createRef, forwardRef } from 'react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import {
  markAsFieldControl,
  markAsFieldGroup,
  useFieldContext,
  useFieldProps,
} from '../../internal/field-context';
import type { FieldControlProps } from '../../internal/field-context';
import { Field } from './Field';

// Stand-ins for the real controls, which arrive in later tasks.
const TextControl = markAsFieldControl(function TextControl(props: FieldControlProps) {
  const { invalid, ...inputProps } = useFieldProps(props);
  return <input data-invalid={invalid ? '' : undefined} {...inputProps} />;
});
const GroupControl = markAsFieldGroup(
  forwardRef<HTMLDivElement, { children?: ReactNode }>(function GroupControl({ children }, ref) {
    const field = useFieldContext();
    return (
      <div ref={ref} role="radiogroup" id={field?.controlId} aria-labelledby={field?.labelId}>
        {children}
      </div>
    );
  }),
);

describe('Field', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('labels the control inside it', () => {
    const { container } = render(
      <Field label="Email">
        <TextControl />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    const label = container.querySelector('label') as HTMLLabelElement;
    expect(label).toHaveClass('flg-field-label');
    expect(label).toHaveAttribute('for', input.id);
    expect(input.id).not.toBe('');
  });

  it('gives its id to the control', () => {
    render(
      <Field id="email" label="Email">
        <TextControl />
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('id', 'email');
  });

  it('describes the control with the description first, then the error', () => {
    const { container } = render(
      <Field label="Email" description="We never share it." error="Enter a valid email.">
        <TextControl />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    const description = container.querySelector('.flg-field-description') as HTMLElement;
    const error = container.querySelector('.flg-field-error') as HTMLElement;
    expect(input).toHaveAttribute('aria-describedby', `${description.id} ${error.id}`);
    expect(input).toHaveAccessibleDescription('We never share it. Enter a valid email.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelector('.flg-field')).toHaveAttribute('data-invalid');
  });

  it('marks a required field with a hidden asterisk and a required control', () => {
    const { container } = render(
      <Field label="Email" required>
        <TextControl />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toBeRequired();
    const asterisk = container.querySelector('.flg-field-required');
    expect(asterisk).toHaveTextContent('*');
    expect(asterisk).toHaveAttribute('aria-hidden', 'true');
  });

  it('disables the control and marks the field disabled', () => {
    const { container } = render(
      <Field label="Email" disabled>
        <TextControl />
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeDisabled();
    expect(container.querySelector('.flg-field')).toHaveAttribute('data-disabled');
  });

  it('renders only the parts it is given', () => {
    const { container } = render(
      <Field>
        <TextControl />
      </Field>,
    );
    const field = container.querySelector('.flg-field') as HTMLElement;
    expect(field.querySelector('label, .flg-field-label, p')).toBeNull();
    expect(field).not.toHaveAttribute('data-invalid');
    expect(field).not.toHaveAttribute('data-disabled');
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
  });

  it('names a group through aria-labelledby, with a span instead of a label', () => {
    const { container } = render(
      <Field label="Plan" required>
        <GroupControl />
      </Field>,
    );
    expect(container.querySelector('label')).toBeNull();
    const label = container.querySelector('span.flg-field-label') as HTMLElement;
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toHaveAttribute(
      'aria-labelledby',
      label.id,
    );
  });

  it('joins a className, passes other props to the root and forwards the ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Field ref={ref} className="mine" data-testid="field" label="Email">
        <TextControl />
      </Field>,
    );
    expect(ref.current).toBe(screen.getByTestId('field'));
    expect(ref.current).toHaveClass('flg-field', 'mine');
  });

  it('names a group wrapped in a Fragment', () => {
    const { container } = render(
      <Field label="Plan">
        <>
          <GroupControl />
        </>
      </Field>,
    );
    expect(container.querySelector('label')).toBeNull();
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeInTheDocument();
  });

  it('keeps the id of a control directly inside it, and points the label at it', () => {
    const { container } = render(
      <Field id="field-id" label="Email">
        <>
          <TextControl id="email" />
        </>
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('id', 'email');
    expect(container.querySelector('label')).toHaveAttribute('for', 'email');
  });

  it('ignores the id of an element that is not a library control', () => {
    const { container } = render(
      <Field label="Email">
        <div id="wrapper">
          <TextControl />
        </div>
      </Field>,
    );
    expect(container.querySelector('label')).not.toHaveAttribute('for', 'wrapper');
  });

  it('warns when a control deeper inside has an id the label cannot follow', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Field label="Email">
        <div>
          <TextControl id="email" />
        </div>
      </Field>,
    );
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] A control inside a Field has its own `id` but is not a direct child of the ' +
        'Field, so the Field label cannot point at it. Pass the `id` to the Field instead.',
    );
  });

  it('warns when it holds more than one control directly', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Field label="Phone">
        <TextControl id="country-code" />
        <TextControl />
      </Field>,
    );
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] A Field labels one control, but it has several directly inside. Give each ' +
        'control its own Field.',
    );
  });

  describe('aside', () => {
    it('keeps aside={0}', () => {
      render(
        <Field label="Count" aside={0}>
          <input />
        </Field>,
      );
      expect(screen.getByText('0')).toHaveClass('flg-field-aside');
    });

    it('renders at the right of the label row, outside the label', () => {
      const { container } = render(
        <Field label="Bio" aside="12/200">
          <TextControl />
        </Field>,
      );
      const aside = screen.getByText('12/200');
      const label = container.querySelector('label') as HTMLLabelElement;
      expect(aside).toHaveClass('flg-field-aside');
      expect(label.contains(aside)).toBe(false);
      expect(aside.parentElement).toBe(label.parentElement);
      expect(aside.parentElement).toHaveClass('flg-field-head');
      expect(label.nextElementSibling).toBe(aside);
    });

    it('does not name the control and is not hidden from screen readers', () => {
      render(
        <Field label="Bio" aside="12/200">
          <TextControl />
        </Field>,
      );
      expect(screen.getByRole('textbox', { name: 'Bio' })).toBeInTheDocument();
      expect(screen.getByText('12/200')).not.toHaveAttribute('aria-hidden');
    });

    it('lets the user hide it themselves', () => {
      render(
        <Field label="Bio" aside={<span aria-hidden="true">12/200</span>}>
          <TextControl />
        </Field>,
      );
      expect(screen.getByText('12/200')).toHaveAttribute('aria-hidden', 'true');
    });

    it('sits beside the group label too', () => {
      const { container } = render(
        <Field label="Volume" aside="60%">
          <GroupControl />
        </Field>,
      );
      const label = container.querySelector('span.flg-field-label') as HTMLElement;
      expect(label.nextElementSibling).toHaveTextContent('60%');
    });

    it('is absent, with no row wrapper, when not given', () => {
      const { container } = render(
        <Field label="Bio">
          <TextControl />
        </Field>,
      );
      expect(container.querySelector('.flg-field-aside')).toBeNull();
      expect(container.querySelector('.flg-field-head')).toBeNull();
      expect(container.querySelector('label')?.parentElement).toHaveClass('flg-field');
    });

    it('shows without a label', () => {
      const { container } = render(
        <Field aside="12/200">
          <TextControl />
        </Field>,
      );
      expect(screen.getByText('12/200')).toBeInTheDocument();
      expect(container.querySelector('label')).toBeNull();
    });
  });
});
