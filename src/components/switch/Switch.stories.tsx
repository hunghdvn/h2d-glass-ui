import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Field } from '../field/Field';
import { Switch } from './Switch';

const row = { display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' } as const;

const meta = {
  title: 'Components/Switch',
  component: Switch,
  args: { children: 'Push notifications', onCheckedChange: fn() },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args }) => {
    const toggle = canvas.getByRole('switch', { name: 'Push notifications' });
    // The invisible native input, not its visual, must be what a click or a hit test reaches.
    const box = toggle.getBoundingClientRect();
    await expect(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)).toBe(
      toggle,
    );
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    await expect(toggle.matches(':focus-visible')).toBe(true);
    await userEvent.keyboard(' ');
    await expect(toggle).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
  },
};

export const States: Story = {
  render: () => (
    <div style={row}>
      <Switch>Quiet hours</Switch>
      <Switch defaultChecked>Push notifications</Switch>
      <Switch defaultChecked disabled>
        Disabled
      </Switch>
    </div>
  ),
};

export const InAField: Story = {
  render: () => (
    <Field description="Sent to this device only.">
      <Switch defaultChecked>Push notifications</Switch>
    </Field>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('switch', { name: 'Push notifications' }),
    ).toHaveAccessibleDescription('Sent to this device only.');
  },
};
