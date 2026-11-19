import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Button } from '../button/Button';
import { Card, CardHeader, CardTitle } from '../card/Card';
import { Alert, AlertActions, AlertDescription, AlertTitle } from './Alert';
import type { AlertProps } from './Alert';

const meta = {
  title: 'Components/Alert',
  component: Alert,
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

const column = { display: 'grid', gap: 12, width: 400 } as const;

/**
 * The states of the approved mockup (alert A1-A3), in a card as there: the four statuses with a
 * title and a description, one with two actions, one that closes, and the compact form, a title alone.
 */
function Billing({ variant }: Pick<AlertProps, 'variant'>) {
  return (
    <Card style={{ gap: 12, width: 400 }}>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
      </CardHeader>
      <Alert variant={variant} status="info">
        <AlertTitle>The next billing period starts on 1 December</AlertTitle>
        <AlertDescription>
          November&apos;s invoice will be emailed to you within 3 days.
        </AlertDescription>
      </Alert>
      <Alert variant={variant} status="success">
        <AlertTitle>Payment method saved</AlertTitle>
        <AlertDescription>The Visa ending 4242 will be used from now on.</AlertDescription>
      </Alert>
      <Alert variant={variant} status="warning">
        <AlertTitle>Close to your spending limit</AlertTitle>
        <AlertDescription>You have used 90% of this month&apos;s $500 limit.</AlertDescription>
      </Alert>
      <Alert variant={variant} status="error">
        <AlertTitle>The payment did not go through</AlertTitle>
        <AlertDescription>
          The bank declined the charge. Check the balance or use another card.
        </AlertDescription>
      </Alert>
      <Alert variant={variant} status="warning">
        <AlertTitle>Your card is about to expire</AlertTitle>
        <AlertDescription>
          The Visa ending 4242 expires in 12/2026. Update it to avoid an interruption.
        </AlertDescription>
        <AlertActions>
          <Button variant="secondary" size="sm">
            Update card
          </Button>
          <Button variant="ghost" size="sm">
            Later
          </Button>
        </AlertActions>
      </Alert>
      <Alert variant={variant} status="info" onDismiss={() => {}}>
        <AlertTitle>Your e-invoice is ready</AlertTitle>
        <AlertDescription>Download the VAT invoice from the payment history.</AlertDescription>
      </Alert>
      <Alert variant={variant} status="success">
        <AlertTitle>Auto-renewal is on</AlertTitle>
      </Alert>
    </Card>
  );
}

export const Stripe: Story = { render: () => <Billing variant="stripe" /> };
export const Tinted: Story = { render: () => <Billing variant="tinted" /> };
export const Plain: Story = { render: () => <Billing variant="plain" /> };

/** A closing Alert: the parent drops it, and sends focus where the page goes on. */
function Dismissible() {
  const [open, setOpen] = useState(true);
  const heading = useRef<HTMLHeadingElement>(null);
  return (
    <div style={column}>
      <h2 ref={heading} tabIndex={-1} style={{ margin: 0, font: 'inherit' }}>
        Notifications
      </h2>
      {open ? (
        <Alert
          onDismiss={() => {
            setOpen(false);
            // The button that had focus is gone with the Alert; without this, focus falls to the body.
            heading.current?.focus();
          }}
        >
          <AlertTitle>Your e-invoice is ready</AlertTitle>
        </Alert>
      ) : null}
    </div>
  );
}

export const Dismiss: Story = {
  tags: ['no-visual'],
  render: () => <Dismissible />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
    await expect(canvas.queryByText('Your e-invoice is ready')).toBeNull();
    await expect(canvas.getByRole('heading', { name: 'Notifications' })).toHaveFocus();
  },
};

/** The polite recipe: the live region is in the page from the start, empty; the Alert goes into it. */
function Polite() {
  const [saved, setSaved] = useState(false);
  return (
    <div style={column}>
      <Button variant="secondary" onClick={() => setSaved(true)}>
        Save
      </Button>
      <div role="status">
        {saved ? (
          <Alert status="success">
            <AlertTitle>Changes saved</AlertTitle>
          </Alert>
        ) : null}
      </div>
    </div>
  );
}

export const PoliteRecipe: Story = {
  tags: ['no-visual'],
  render: () => <Polite />,
  play: async ({ canvas }) => {
    const region = canvas.getByRole('status');
    await expect(region).toBeEmptyDOMElement();
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(region).toHaveTextContent('Changes saved'));
  },
};

/** The urgent recipe: the Alert carries `role="alert"` and is put into the tree after the action. */
function Urgent() {
  const [failed, setFailed] = useState(false);
  return (
    <div style={column}>
      <Button variant="secondary" onClick={() => setFailed(true)}>
        Pay
      </Button>
      {failed ? (
        <Alert role="alert" status="error">
          <AlertTitle>The payment did not go through</AlertTitle>
        </Alert>
      ) : null}
    </div>
  );
}

export const UrgentRecipe: Story = {
  tags: ['no-visual'],
  render: () => <Urgent />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('alert')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Pay' }));
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'The payment did not go through',
    );
  },
};

export const Icons: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <Alert status="warning" icon={<span aria-hidden>!</span>}>
        <AlertTitle asChild>
          <h3>Own icon</h3>
        </AlertTitle>
      </Alert>
      <Alert status="error" icon={false} labels={{ error: 'Failed' }}>
        <AlertTitle>No icon</AlertTitle>
      </Alert>
    </div>
  ),
  play: async ({ canvas }) => {
    // The status is not lost with the icon: it is read out as text, before the title.
    await expect(canvas.getByRole('heading', { level: 3 }).parentElement).toHaveTextContent(
      'Warning: Own icon',
    );
    await expect(canvas.getByText('No icon').parentElement).toHaveTextContent('Failed: No icon');
    await expect(canvas.queryByRole('img')).toBeNull();
  },
};

/**
 * A title that is a heading keeps no margins of its own: the browser's margins of an `h2` would grow
 * the Alert and put the title off the middle of the icon. Both forms are as tall as each other.
 */
export const TitleAsHeading: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      {(['stripe', 'tinted', 'plain'] as const).map((variant) => (
        <div key={variant} style={column}>
          <Alert variant={variant} data-case="div">
            <AlertTitle>Saved</AlertTitle>
          </Alert>
          <Alert variant={variant} data-case="heading">
            <AlertTitle asChild>
              <h2>Saved</h2>
            </AlertTitle>
          </Alert>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const heading of canvasElement.querySelectorAll('h2')) {
      const margins = getComputedStyle(heading);
      await expect(margins.marginTop).toBe('0px');
      await expect(margins.marginBottom).toBe('0px');
    }
    for (const alert of canvasElement.querySelectorAll<HTMLElement>('[data-case="heading"]')) {
      const plain = alert.previousElementSibling!;
      await expect(
        Math.abs(alert.getBoundingClientRect().height - plain.getBoundingClientRect().height),
      ).toBeLessThanOrEqual(0.5);
    }
  },
};
