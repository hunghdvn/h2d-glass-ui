import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { realUserEvent } from '../../../.storybook/real-input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './Accordion';
import type { AccordionProps } from './Accordion';

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  args: { onValueChange: fn() },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

const width = { width: 380 } as const;

/** The questions of the approved mockup (accordion A1). */
function Faq(props: AccordionProps) {
  return (
    <Accordion style={width} {...props}>
      <AccordionItem value="trial">
        <AccordionTrigger>Is there a free trial?</AccordionTrigger>
        <AccordionContent>
          Yes. 14 days, no card needed. When it ends, the account moves to the Free plan.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="plans">
        <AccordionTrigger>Can I change plans midway?</AccordionTrigger>
        <AccordionContent>
          Yes, at any time. The new price applies from the next invoice.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="data">
        <AccordionTrigger>Where is my data stored?</AccordionTrigger>
        <AccordionContent>In the region you chose when you signed up.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="legacy" disabled>
        <AccordionTrigger>Legacy plans</AccordionTrigger>
        <AccordionContent>No longer sold.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

const itemOf = (trigger: HTMLElement) => trigger.closest('details') as HTMLDetailsElement;

export const Default: Story = {
  render: () => (
    <Accordion defaultValue="trial" style={width}>
      <AccordionItem value="trial">
        <AccordionTrigger>Is there a free trial?</AccordionTrigger>
        <AccordionContent>
          Yes. 14 days, no card needed. When it ends, the account moves to the Free plan.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="plans">
        <AccordionTrigger>Can I change plans midway?</AccordionTrigger>
        <AccordionContent>Yes, at any time.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="data">
        <AccordionTrigger>Where is my data stored?</AccordionTrigger>
        <AccordionContent>In the region you chose when you signed up.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Single: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <Faq
      defaultValue="trial"
      onValueChange={args.onValueChange as (value: string | null) => void}
    />
  ),
  play: async ({ canvas, args }) => {
    const trial = canvas.getByText('Is there a free trial?');
    const plans = canvas.getByText('Can I change plans midway?');
    // Opening one closes the other: the items share a name.
    await userEvent.click(plans);
    await waitFor(() => expect(args.onValueChange).toHaveBeenLastCalledWith('plans'));
    await expect(itemOf(plans).open).toBe(true);
    await expect(itemOf(trial).open).toBe(false);
    // The open one closes again.
    await userEvent.click(plans);
    await waitFor(() => expect(args.onValueChange).toHaveBeenLastCalledWith(null));
    await expect(itemOf(plans).open).toBe(false);
    // Enter and Space work the trigger.
    const real = await realUserEvent();
    if (!real) return;
    trial.focus();
    await real.keyboard('{Enter}');
    await waitFor(() => expect(args.onValueChange).toHaveBeenLastCalledWith('trial'));
    await real.keyboard(' ');
    await waitFor(() => expect(args.onValueChange).toHaveBeenLastCalledWith(null));
  },
};

export const Multiple: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <Faq
      type="multiple"
      defaultValue={['trial']}
      onValueChange={args.onValueChange as (value: string[]) => void}
    />
  ),
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByText('Where is my data stored?'));
    await waitFor(() => expect(args.onValueChange).toHaveBeenLastCalledWith(['trial', 'data']));
    await expect(itemOf(canvas.getByText('Is there a free trial?')).open).toBe(true);
    await userEvent.click(canvas.getByText('Is there a free trial?'));
    await waitFor(() => expect(args.onValueChange).toHaveBeenLastCalledWith(['data']));
  },
};

export const Disabled: Story = {
  tags: ['no-visual'],
  render: (args) => <Faq onValueChange={args.onValueChange as (value: string | null) => void} />,
  play: async ({ canvas, args }) => {
    const legacy = canvas.getByText('Legacy plans');
    await expect(legacy).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(legacy);
    const real = await realUserEvent();
    if (real) {
      legacy.focus();
      await real.keyboard('{Enter}');
      await real.keyboard(' ');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(itemOf(legacy).open).toBe(false);
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

function ControlledFaq({ onValueChange }: { onValueChange: (value: string | null) => void }) {
  const [value, setValue] = useState<string | null>('trial');
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Faq
        value={value}
        onValueChange={(next) => {
          onValueChange(next);
          // This parent keeps "Where is my data stored?" closed.
          if (next !== 'data') setValue(next);
        }}
      />
      <button type="button" onClick={() => setValue('plans')}>
        Show plans
      </button>
    </div>
  );
}

export const Controlled: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <ControlledFaq onValueChange={args.onValueChange as (value: string | null) => void} />
  ),
  play: async ({ canvas, args }) => {
    const trial = canvas.getByText('Is there a free trial?');
    const data = canvas.getByText('Where is my data stored?');
    // A refused item closes again, and the open one stays open.
    await userEvent.click(data);
    await waitFor(() => expect(args.onValueChange).toHaveBeenLastCalledWith('data'));
    await waitFor(() => expect(itemOf(data).open).toBe(false));
    await expect(itemOf(trial).open).toBe(true);
    // The parent can open any item itself.
    await userEvent.click(canvas.getByRole('button', { name: 'Show plans' }));
    await expect(itemOf(canvas.getByText('Can I change plans midway?')).open).toBe(true);
    await waitFor(() => expect(itemOf(trial).open).toBe(false));
  },
};
