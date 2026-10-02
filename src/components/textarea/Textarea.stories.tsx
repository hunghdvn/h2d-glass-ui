import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { Field } from '../field/Field';
import { Textarea } from './Textarea';

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
  args: { 'aria-label': 'Bio', placeholder: 'A few lines about you' },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Bio' });
    await userEvent.tab();
    await expect(textarea).toHaveFocus();
    await userEvent.keyboard('Line one{Enter}Line two');
    await expect(textarea).toHaveValue('Line one\nLine two');
  },
};

export const InAField: Story = {
  render: () => (
    <Field label="Bio" error="Write at least 20 characters.">
      <Textarea defaultValue="Too short" />
    </Field>
  ),
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Bio' });
    await expect(textarea).toHaveAttribute('aria-invalid', 'true');
    await expect(textarea).toHaveAccessibleDescription('Write at least 20 characters.');
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Read only', placeholder: undefined },
};
