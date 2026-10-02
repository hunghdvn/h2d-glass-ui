import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { Field } from '../field/Field';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  subcomponents: { Radio },
  args: {
    'aria-label': 'Digest',
    defaultValue: 'daily',
    onValueChange: fn(),
    children: (
      <>
        <Radio value="daily">Daily</Radio>
        <Radio value="weekly">Weekly</Radio>
        <Radio value="monthly">Monthly</Radio>
      </>
    ),
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args }) => {
    const daily = canvas.getByRole('radio', { name: 'Daily' });
    const weekly = canvas.getByRole('radio', { name: 'Weekly' });
    // The invisible native input, not its visual, must be what a click or a hit test reaches.
    const box = weekly.getBoundingClientRect();
    await expect(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)).toBe(
      weekly,
    );
    await expect(daily).toBeChecked();
    await userEvent.tab();
    await expect(daily).toHaveFocus();
    await expect(daily.matches(':focus-visible')).toBe(true);
    await userEvent.keyboard('{ArrowDown}');
    await expect(weekly).toHaveFocus();
    await expect(weekly).toBeChecked();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('weekly');
  },
};

export const Horizontal: Story = {
  args: {
    'aria-label': 'Size',
    orientation: 'horizontal',
    defaultValue: 'm',
    children: (
      <>
        <Radio value="s">S</Radio>
        <Radio value="m">M</Radio>
        <Radio value="l" disabled>
          L (sold out)
        </Radio>
      </>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'L (sold out)' })).toBeDisabled();
  },
};

function ControlledPlan() {
  const [plan, setPlan] = useState('pro');
  return (
    <Field label="Plan" description={`Selected: ${plan}`}>
      <RadioGroup value={plan} onValueChange={setPlan}>
        <Radio value="free">Free</Radio>
        <Radio value="pro">Pro</Radio>
        <Radio value="team">Team</Radio>
      </RadioGroup>
    </Field>
  );
}

export const InAField: Story = {
  render: () => <ControlledPlan />,
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Plan' });
    await expect(group).toHaveAccessibleDescription('Selected: pro');
    await userEvent.click(canvas.getByRole('radio', { name: 'Team' }));
    await expect(group).toHaveAccessibleDescription('Selected: team');
  },
};

export const Invalid: Story = {
  render: () => (
    <Field label="Shipping" error="Choose a shipping speed." required>
      <RadioGroup>
        <Radio value="standard">Standard</Radio>
        <Radio value="express">Express</Radio>
      </RadioGroup>
    </Field>
  ),
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Shipping' });
    await expect(group).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByRole('radio', { name: 'Standard' })).toBeRequired();
  },
};
