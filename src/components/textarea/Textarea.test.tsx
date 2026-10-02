import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Field } from '../field/Field';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders a native textarea, joins a className and forwards the ref', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} className="mine" aria-label="Bio" rows={4} />);
    const textarea = screen.getByRole('textbox', { name: 'Bio' });
    expect(ref.current).toBe(textarea);
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveClass('flg-textarea', 'mine');
    expect(textarea).toHaveAttribute('rows', '4');
    expect(textarea).not.toHaveAttribute('data-invalid');
  });

  it('marks itself invalid', () => {
    render(<Textarea aria-label="Bio" invalid />);
    const textarea = screen.getByRole('textbox', { name: 'Bio' });
    expect(textarea).toHaveAttribute('data-invalid');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
  });

  it('takes its label, description, required and disabled state from a Field', () => {
    render(
      <Field label="Bio" description="A few lines about you." required disabled>
        <Textarea />
      </Field>,
    );
    const textarea = screen.getByRole('textbox', { name: 'Bio' });
    expect(textarea).toHaveAccessibleDescription('A few lines about you.');
    expect(textarea).toBeRequired();
    expect(textarea).toBeDisabled();
  });
});
