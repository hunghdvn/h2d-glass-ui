import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { realUserEvent } from '../../../.storybook/real-input';
import { Button } from '../button';
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
    // Opening one closes the other: the items share a name. One click, one report.
    await userEvent.click(plans);
    await waitFor(() => expect(args.onValueChange).toHaveBeenLastCalledWith('plans'));
    await expect(itemOf(plans).open).toBe(true);
    await expect(itemOf(trial).open).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(args.onValueChange).toHaveBeenCalledOnce();
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

// A control inside a trigger is nested interactive content, which axe reports: the docs advise
// against it. The story is about the click.
export const ControlInTrigger: Story = {
  tags: ['no-visual'],
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'region', enabled: false },
          { id: 'nested-interactive', enabled: false },
        ],
      },
    },
  },
  render: (args) => (
    <Accordion style={width} onValueChange={args.onValueChange as (value: string | null) => void}>
      <AccordionItem value="plans">
        <AccordionTrigger>
          Can I change plans midway? <input type="checkbox" aria-label="Pin" />
        </AccordionTrigger>
        <AccordionContent>Yes, at any time.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvas, args }) => {
    // A control inside the trigger keeps its click, and the item stays, as with <details>.
    const pin = canvas.getByRole('checkbox', { name: 'Pin' });
    await userEvent.click(pin);
    await expect(pin).toBeChecked();
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(itemOf(pin).open).toBe(false);
    await expect(args.onValueChange).not.toHaveBeenCalled();
    // The rest of the trigger still works it.
    await userEvent.click(canvas.getByText(/Can I change plans/));
    await waitFor(() => expect(itemOf(pin).open).toBe(true));
  },
};

/** A parent that commits the open item later, as a router does after a navigation. */
function LateFaq({ onValueChange }: { onValueChange: (value: string | null) => void }) {
  const [value, setValue] = useState<string | null>('trial');
  const [asked, setAsked] = useState<string | null>('trial');
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Faq
        value={value}
        onValueChange={(next) => {
          onValueChange(next);
          setAsked(next);
        }}
      />
      <button type="button" onClick={() => setValue(asked)}>
        Navigate
      </button>
    </div>
  );
}

export const LateParent: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <LateFaq onValueChange={args.onValueChange as (value: string | null) => void} />
  ),
  play: async ({ canvas, args }) => {
    const trial = canvas.getByText('Is there a free trial?');
    const plans = canvas.getByText('Can I change plans midway?');
    const toggles: string[] = [];
    for (const el of [trial, plans]) {
      itemOf(el).addEventListener('toggle', (event) =>
        toggles.push(`${el.textContent} ${(event as ToggleEvent).newState}`),
      );
    }
    // A click only asks: nothing moves until the parent commits, even when it re-renders first.
    await userEvent.click(plans);
    await waitFor(() => expect(args.onValueChange).toHaveBeenLastCalledWith('plans'));
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(toggles).toEqual([]);
    await expect(itemOf(plans).open).toBe(false);
    await expect(itemOf(trial).open).toBe(true);
    await userEvent.click(canvas.getByRole('button', { name: 'Navigate' }));
    await waitFor(() => expect(itemOf(plans).open).toBe(true));
    await expect(itemOf(trial).open).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(args.onValueChange).toHaveBeenCalledOnce();
  },
};

function GrowingFaq({ onValueChange }: { onValueChange: (value: string | null) => void }) {
  const [value, setValue] = useState<string | null>('trial');
  const [added, setAdded] = useState(false);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Accordion
        style={width}
        value={value}
        onValueChange={(next) => {
          onValueChange(next);
          setValue(next);
        }}
      >
        {added && (
          <AccordionItem value="refunds">
            <AccordionTrigger>Can I get a refund?</AccordionTrigger>
            <AccordionContent>Yes, within 30 days of a payment.</AccordionContent>
          </AccordionItem>
        )}
        <AccordionItem value="trial">
          <AccordionTrigger>Is there a free trial?</AccordionTrigger>
          <AccordionContent>Yes. 14 days, no card needed.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="plans">
          <AccordionTrigger>Can I change plans midway?</AccordionTrigger>
          <AccordionContent>Yes, at any time.</AccordionContent>
        </AccordionItem>
      </Accordion>
      <button
        type="button"
        onClick={() => {
          setAdded(true);
          setValue('refunds');
        }}
      >
        Add a question
      </button>
    </div>
  );
}

export const AddedItem: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <GrowingFaq onValueChange={args.onValueChange as (value: string | null) => void} />
  ),
  play: async ({ canvas, args }) => {
    // In one update the parent adds an item above the open one and opens it. The browser closes an
    // open <details> inserted into a name group that already has an open one; the item opens again.
    await userEvent.click(canvas.getByRole('button', { name: 'Add a question' }));
    const refunds = await canvas.findByText('Can I get a refund?');
    // The browser's toggle events come in a task after the commit.
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect(itemOf(refunds).open).toBe(true);
    await expect(itemOf(canvas.getByText('Is there a free trial?')).open).toBe(false);
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

/** How far the focus outline reaches from the control. The 3px ring is inside it, the glow is not measured. */
function ringReach(control: HTMLElement) {
  const style = getComputedStyle(control);
  return parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
}

export const FocusRingInContent: Story = {
  tags: ['no-visual'],
  render: () => (
    <Accordion defaultValue="filter" style={width}>
      <AccordionItem value="filter">
        <AccordionTrigger>Filter the invoices</AccordionTrigger>
        <AccordionContent>
          <Button>Download</Button>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const download = canvas.getByRole('button', { name: 'Download' });
    await real.tab();
    await real.tab();
    await expect(download).toHaveFocus();
    // The browsers without `::details-content` do not clip: there is nothing to measure.
    if (!CSS.supports('selector(::details-content)')) return;
    const item = itemOf(download);
    const clip = getComputedStyle(item, '::details-content');
    await expect(clip.overflowY).toBe('clip');
    // The clip box starts above the content by its padding (and its clip margin, where the browser
    // has one). The ring is whole when that reaches as far above the control as the ring does.
    const content = download.closest('.flg-accordion-content') as HTMLElement;
    const room =
      parseFloat(clip.paddingBlockStart) +
      (parseFloat(clip.overflowClipMargin) || 0) -
      (download.getBoundingClientRect().top - content.getBoundingClientRect().top);
    await expect(room).toBeGreaterThanOrEqual(ringReach(download));
  },
};

const applied = fn();

export const CustomChild: Story = {
  tags: ['no-visual'],
  render: () => (
    // Anything may sit in an item, not only AccordionContent. The clip box of the open content must
    // not take its clicks.
    <Accordion defaultValue="filter" style={width}>
      <AccordionItem value="filter">
        <AccordionTrigger>Filter the invoices</AccordionTrigger>
        <div style={{ padding: '0 0 12px' }}>
          <button type="button" onClick={applied}>
            Apply
          </button>
        </div>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    applied.mockClear();
    await real.click(canvas.getByRole('button', { name: 'Apply' }));
    await expect(applied).toHaveBeenCalledOnce();
  },
};
