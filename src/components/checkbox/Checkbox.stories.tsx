import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { Field } from '../field/Field';
import { Checkbox } from './Checkbox';

const row = { display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' } as const;
const column = { display: 'grid', gap: 8 } as const;

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  args: { children: 'Email me product updates', onCheckedChange: fn() },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Email me product updates' });
    // The invisible native input, not its visual, must be what a click or a hit test reaches.
    const box = checkbox.getBoundingClientRect();
    await expect(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)).toBe(
      checkbox,
    );
    await userEvent.tab();
    await expect(checkbox).toHaveFocus();
    await expect(checkbox.matches(':focus-visible')).toBe(true);
    await userEvent.keyboard(' ');
    await expect(checkbox).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
  },
};

export const States: Story = {
  render: () => (
    <div style={row}>
      <Checkbox>Email</Checkbox>
      <Checkbox defaultChecked>SMS</Checkbox>
      <Checkbox indeterminate>All</Checkbox>
      <Checkbox aria-invalid>Required</Checkbox>
      <Checkbox defaultChecked disabled>
        Disabled
      </Checkbox>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox', { name: 'All' })).toBePartiallyChecked();
  },
};

function SelectAll() {
  const [selected, setSelected] = useState(['email']);
  const options = ['email', 'sms', 'push'];
  const toggle = (option: string, checked: boolean) =>
    setSelected((current) =>
      checked ? [...current, option] : current.filter((item) => item !== option),
    );
  return (
    <div style={column}>
      <Checkbox
        checked={selected.length === options.length}
        indeterminate={selected.length > 0 && selected.length < options.length}
        onCheckedChange={(checked) => setSelected(checked ? options : [])}
      >
        All channels
      </Checkbox>
      {options.map((option) => (
        <Checkbox
          key={option}
          checked={selected.includes(option)}
          onCheckedChange={(checked) => toggle(option, checked)}
          style={{ marginLeft: 24 }}
        >
          {option.toUpperCase()}
        </Checkbox>
      ))}
    </div>
  );
}

export const Indeterminate: Story = {
  render: () => <SelectAll />,
  play: async ({ canvas }) => {
    const all = canvas.getByRole('checkbox', { name: 'All channels' });
    await expect(all).toBePartiallyChecked();
    await userEvent.click(all);
    await expect(all).toBeChecked();
    await expect(canvas.getByRole('checkbox', { name: 'PUSH' })).toBeChecked();
  },
};

export const InAField: Story = {
  render: () => (
    <Field error="Accept the terms to continue.">
      <Checkbox required>I accept the terms of service</Checkbox>
    </Field>
  ),
  play: async ({ canvas }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'I accept the terms of service' });
    await expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    await expect(checkbox).toHaveAccessibleDescription('Accept the terms to continue.');
  },
};
