import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { SearchIcon } from '../../../.storybook/icons';
import { Input } from './Input';

const grid = { display: 'grid', gap: 12, width: 300 } as const;

const meta = {
  title: 'Components/Input',
  component: Input,
  decorators: [
    (Story) => (
      <div style={grid}>
        <Story />
      </div>
    ),
  ],
  args: { 'aria-label': 'Full name', placeholder: 'Nguyễn Văn A' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Full name' });
    await userEvent.tab();
    await expect(input).toHaveFocus();
    await userEvent.keyboard('Ann');
    await expect(input).toHaveValue('Ann');
  },
};

export const Sizes: Story = {
  render: (args) => (
    <>
      <Input {...args} size="sm" aria-label="Small" placeholder="Small" />
      <Input {...args} size="md" aria-label="Medium" placeholder="Medium" />
      <Input {...args} size="lg" aria-label="Large" placeholder="Large" />
    </>
  ),
};

export const WithContent: Story = {
  render: (args) => (
    <>
      <Input {...args} aria-label="Search" placeholder="Search" startContent={<SearchIcon />} />
      <Input
        {...args}
        aria-label="Weight"
        placeholder={undefined}
        defaultValue="72"
        endContent="kg"
      />
    </>
  ),
  play: async ({ canvas }) => {
    const weight = canvas.getByRole('textbox', { name: 'Weight' });
    await userEvent.click(canvas.getByText('kg'));
    await expect(weight).toHaveFocus();
  },
};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: 'not-an-email', 'aria-label': 'Email' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Read only' },
};
