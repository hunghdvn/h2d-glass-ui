import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Field } from '../field/Field';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';
import type { RadioGroupProps } from './RadioGroup';

function Sizes(props: RadioGroupProps) {
  return (
    <RadioGroup aria-label="Size" {...props}>
      <Radio value="s">Small</Radio>
      <Radio value="m">Medium</Radio>
      <Radio value="l">Large</Radio>
    </RadioGroup>
  );
}

const radio = (name: string) => screen.getByRole('radio', { name });

describe('RadioGroup', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('renders a vertical radiogroup of native radios that share a generated name', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <RadioGroup ref={ref} aria-label="Size" className="mine">
        <Radio value="s">Small</Radio>
        <Radio value="m">Medium</Radio>
      </RadioGroup>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Size' });
    expect(ref.current).toBe(group);
    expect(group).toHaveClass('flg-radio-group', 'mine');
    expect(group).toHaveAttribute('data-orientation', 'vertical');
    expect(group).not.toHaveAttribute('aria-orientation');
    const names = screen.getAllByRole('radio').map((input) => input.getAttribute('name'));
    expect(names[0]).toBeTruthy();
    expect(new Set(names).size).toBe(1);
  });

  it('uses the name and orientation passed in', () => {
    render(<Sizes name="size" orientation="horizontal" />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('data-orientation', 'horizontal');
    expect(radio('Small')).toHaveAttribute('name', 'size');
  });

  it('starts at defaultValue and reports the value the user picks', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Sizes defaultValue="m" onValueChange={onValueChange} />);
    expect(radio('Medium')).toBeChecked();
    await user.click(radio('Large'));
    expect(onValueChange).toHaveBeenCalledWith('l');
    expect(radio('Large')).toBeChecked();
  });

  it('follows value when controlled', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Sizes value="m" onValueChange={onValueChange} />);
    await user.click(radio('Small'));
    expect(onValueChange).toHaveBeenCalledWith('s');
    expect(radio('Medium')).toBeChecked();
    rerender(<Sizes value="s" onValueChange={onValueChange} />);
    expect(radio('Small')).toBeChecked();
  });

  it('moves the selection with the arrow keys', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Sizes defaultValue="s" onValueChange={onValueChange} />);
    await user.tab();
    expect(radio('Small')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(radio('Medium')).toHaveFocus();
    expect(radio('Medium')).toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith('m');
  });

  it('calls a Radio onChange before onValueChange', async () => {
    const calls: string[] = [];
    const user = userEvent.setup();
    render(
      <RadioGroup aria-label="Size" onValueChange={(value) => calls.push(`value:${value}`)}>
        <Radio value="s" onChange={() => calls.push('change')}>
          Small
        </Radio>
      </RadioGroup>,
    );
    await user.click(radio('Small'));
    expect(calls).toEqual(['change', 'value:s']);
  });

  it('puts required and disabled on every radio, and a Radio can override them', () => {
    render(
      <RadioGroup aria-label="Size" required disabled>
        <Radio value="s">Small</Radio>
        <Radio value="m" disabled={false}>
          Medium
        </Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
    expect(radio('Small')).toBeRequired();
    expect(radio('Small')).toBeDisabled();
    expect(radio('Medium')).toBeEnabled();
  });

  it('is named by a Field label and described by the Field', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <Field label="Size" description="Pick the closest fit." error="Choose a size." required>
        <RadioGroup>
          <Radio value="s">Small</Radio>
        </RadioGroup>
      </Field>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Size' });
    expect(container.querySelector('label.flg-field-label')).toBeNull();
    expect(group).toHaveAccessibleDescription('Pick the closest fit. Choose a size.');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAttribute('aria-required', 'true');
    expect(group).toHaveAttribute('data-invalid');
    expect(group.id).not.toBe('');
    expect(radio('Small')).toBeRequired();
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns when it sits inside a Field without being its direct child', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Field label="Size">
        <div>
          <Sizes />
        </div>
      </Field>,
    );
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] RadioGroup is inside a Field but is not its direct child, so the Field ' +
        'cannot label it. Make RadioGroup the direct child of Field.',
    );
  });

  it('does not warn when it sits deeper inside a Field that has no label', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Field description="Pick the closest fit.">
        <div>
          <Sizes />
        </div>
      </Field>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns about a Radio outside a RadioGroup', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Radio value="s">Small</Radio>);
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] Radio must be inside a RadioGroup, which gives it its name.',
    );
  });

  it('forwards a Radio ref, and puts className and style on its label', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <RadioGroup aria-label="Size">
        <Radio ref={ref} value="s" className="mine" style={{ marginTop: 4 }}>
          Small
        </Radio>
      </RadioGroup>,
    );
    expect(ref.current).toBe(radio('Small'));
    const label = container.querySelector('label.flg-radio') as HTMLLabelElement;
    expect(label).toHaveClass('mine');
    expect(label).toHaveStyle({ marginTop: '4px' });
    expect(container.querySelector('.flg-radio-dot')).toHaveAttribute('aria-hidden', 'true');
  });
});
