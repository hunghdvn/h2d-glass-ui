import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Field } from '../field/Field';
import { Input } from './Input';

const frameOf = (input: HTMLElement) => input.parentElement as HTMLElement;

describe('Input', () => {
  it('renders a medium input inside a frame, with className and style on the frame', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Input
        ref={ref}
        className="mine"
        style={{ width: 200 }}
        name="email"
        placeholder="you@company.com"
        aria-label="Email"
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    const frame = frameOf(input);
    expect(ref.current).toBe(input);
    expect(frame).toHaveClass('flg-input', 'mine');
    expect(frame).toHaveAttribute('data-size', 'md');
    expect(frame).toHaveStyle({ width: '200px' });
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('placeholder', 'you@company.com');
    expect(input).not.toHaveAttribute('class');
  });

  it('reflects size and renders start and end content as adornments', () => {
    render(<Input size="lg" aria-label="Weight" startContent="≈" endContent="kg" />);
    const frame = frameOf(screen.getByRole('textbox', { name: 'Weight' }));
    expect(frame).toHaveAttribute('data-size', 'lg');
    const adornments = frame.querySelectorAll('.flg-input-adornment');
    expect(Array.from(adornments, (node) => node.textContent)).toEqual(['≈', 'kg']);
  });

  it('ignores presses with buttons other than the main one', () => {
    render(<Input aria-label="Weight" endContent="kg" />);
    const input = screen.getByRole('textbox', { name: 'Weight' });
    expect(fireEvent.mouseDown(frameOf(input), { button: 2 })).toBe(true);
    expect(input).not.toHaveFocus();
  });

  it('focuses the input when the frame or a decorative adornment is pressed', () => {
    render(<Input aria-label="Weight" endContent="kg" />);
    const input = screen.getByRole('textbox', { name: 'Weight' });
    expect(fireEvent.mouseDown(frameOf(input))).toBe(false);
    expect(input).toHaveFocus();
    input.blur();
    fireEvent.mouseDown(screen.getByText('kg'));
    expect(input).toHaveFocus();
  });

  it('leaves presses on an interactive adornment alone', () => {
    render(
      <Input
        aria-label="Search"
        endContent={
          <button type="button" aria-label="Clear">
            ×
          </button>
        }
      />,
    );
    expect(fireEvent.mouseDown(screen.getByRole('button', { name: 'Clear' }))).toBe(true);
    expect(screen.getByRole('textbox', { name: 'Search' })).not.toHaveFocus();
  });

  it('does not focus a disabled input, and marks the frame disabled', () => {
    render(<Input aria-label="Email" disabled />);
    const input = screen.getByRole('textbox', { name: 'Email' });
    fireEvent.mouseDown(frameOf(input));
    expect(input).not.toHaveFocus();
    expect(frameOf(input)).toHaveAttribute('data-disabled');
  });

  it('takes its label, description and invalid state from a Field', () => {
    render(
      <Field label="Email" description="Work address." error="Enter a valid email.">
        <Input />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAccessibleDescription('Work address. Enter a valid email.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(frameOf(input)).toHaveAttribute('data-invalid');
  });

  it('lets invalid passed directly win over the Field', () => {
    render(
      <Field label="Email" error="Enter a valid email.">
        <Input invalid={false} />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(frameOf(input)).not.toHaveAttribute('data-invalid');
  });
});
