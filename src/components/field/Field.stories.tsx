import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { MailIcon } from '../../../.storybook/icons';
import { Input } from '../input/Input';
import { Textarea } from '../textarea/Textarea';
import { Field } from './Field';

const meta = {
  title: 'Components/Field',
  component: Field,
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Email',
    description: 'We only use it to send sign-in links.',
    children: <Input type="email" placeholder="you@company.com" startContent={<MailIcon />} />,
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Email' });
    await expect(input).toHaveAccessibleDescription('We only use it to send sign-in links.');
    await userEvent.tab();
    await expect(input).toHaveFocus();
  },
};

export const Required: Story = {
  args: { required: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Email' })).toBeRequired();
  },
};

export const WithError: Story = {
  args: {
    label: 'Password',
    description: undefined,
    required: true,
    error: 'Use at least 8 characters.',
    children: <Input type="password" defaultValue="12345" />,
  },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('input') as HTMLInputElement;
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Use at least 8 characters.');
  },
};

export const Disabled: Story = {
  args: {
    label: 'Workspace URL',
    description: 'Ask an owner to change it.',
    disabled: true,
    children: <Input defaultValue="acme.example.com" />,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Workspace URL' })).toBeDisabled();
  },
};

export const WithAside: Story = {
  args: {
    label: 'Bio',
    description: undefined,
    aside: '12/200',
    children: <Textarea rows={3} defaultValue="Designer in Hanoi" />,
  },
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Bio' });
    const aside = canvas.getByText('12/200');
    // The aside sits outside the label, so the name stays "Bio", and it shares the label's row.
    await expect(textarea).toHaveAccessibleName('Bio');
    await expect(aside.getBoundingClientRect().right).toBeGreaterThan(
      canvas.getByText('Bio').getBoundingClientRect().right,
    );
    await expect(aside.getBoundingClientRect().top).toBeLessThan(
      textarea.getBoundingClientRect().top,
    );
  },
};
