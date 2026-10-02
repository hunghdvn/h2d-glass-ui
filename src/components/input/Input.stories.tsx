import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { SearchIcon } from '../../../.storybook/icons';
import { resolveColor } from '../../../.storybook/resolve-color';
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
    const input = canvas.getByRole('textbox', { name: 'Email' });
    const frame = input.parentElement as HTMLElement;
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    // The error stays visible while the user fixes it: focus keeps the danger border.
    const danger = resolveColor(frame.parentElement as HTMLElement, 'var(--flg-danger)');
    // Without the transition the computed colour is the final one, not the first frame of a fade.
    frame.style.transition = 'none';
    await userEvent.click(input);
    await expect(input.matches(':focus-visible')).toBe(true);
    await expect(getComputedStyle(frame).borderTopColor).toBe(danger);
    input.blur();
    frame.style.transition = '';
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Read only' },
  render: (args) => (
    <>
      <Input {...args} />
      <fieldset disabled style={{ margin: 0, padding: 0, border: 0, minWidth: 0 }}>
        <Input aria-label="In a disabled fieldset" defaultValue="Read only" />
      </fieldset>
    </>
  ),
  play: async ({ canvas }) => {
    // A prop and a disabled fieldset dim the frame alike.
    for (const name of ['Full name', 'In a disabled fieldset']) {
      const frame = canvas.getByRole('textbox', { name }).parentElement as HTMLElement;
      await expect(getComputedStyle(frame).opacity).toBe('0.5');
    }
  },
};
