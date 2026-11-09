import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Button } from '../components/button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/card/Card';
import { Progress } from '../components/progress/Progress';
import { Skeleton, SkeletonText } from '../components/skeleton/Skeleton';
import { Spinner } from '../components/spinner/Spinner';
import { Table, TableCaption } from '../components/table/Table';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/table/table-parts';

// These examples are the code of "Loading states" in Getting started. They are `no-visual`: they
// prove the recipe works (the container stays, the announcement is already in the page), and the
// looks of the parts have their own stories.
const meta = {
  title: 'Examples/Loading states',
  tags: ['no-visual'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Stands for a visually hidden class of your own (`sr-only`), which the page has to provide. */
const srOnly: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};

/** Turns `loading` true when asked and back to false after `delay` ms, as a request would. */
function useFakeRequest(delay: number) {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(timer);
  }, [loading, delay]);
  return [loading, () => setLoading(true)] as const;
}

function WeeklyReport({ delay = 200 }: { delay?: number }) {
  const [loading, refresh] = useFakeRequest(delay);
  return (
    <Card style={{ width: 360 }}>
      {/* Always in the page, so a screen reader already watches it when its text changes. */}
      <div role="status" style={srOnly}>
        {loading ? 'Loading the weekly report' : ''}
      </div>
      {/* Always mounted: only what is inside it changes. */}
      <section aria-busy={loading} aria-label="Weekly report">
        {loading ? (
          <>
            <Skeleton shape="text" width="40%" />
            <SkeletonText lines={2} />
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Weekly report</CardTitle>
            </CardHeader>
            <CardContent>1,240 visits, up 8% on last week.</CardContent>
          </>
        )}
      </section>
      <Button variant="ghost" onClick={refresh} disabled={loading}>
        Refresh
      </Button>
    </Card>
  );
}

export const Container: Story = {
  render: () => <WeeklyReport />,
  play: async ({ canvas, canvasElement }) => {
    const section = canvas.getByRole('region', { name: 'Weekly report' });
    const status = canvas.getByRole('status');
    // Before the work starts the region is already there, and empty.
    await expect(status).toHaveTextContent('');
    await expect(section).toHaveAttribute('aria-busy', 'false');

    await userEvent.click(canvas.getByRole('button', { name: 'Refresh' }));
    // The same two elements, not new ones: the region keeps watching, the container stays.
    await expect(canvas.getByRole('status')).toBe(status);
    await expect(canvas.getByRole('region', { name: 'Weekly report' })).toBe(section);
    await expect(status).toHaveTextContent('Loading the weekly report');
    await expect(section).toHaveAttribute('aria-busy', 'true');
    // The Skeletons are hidden from screen readers; the container says "loading".
    await expect(section.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
    await expect(canvasElement.querySelector('[aria-busy="true"] [role="status"]')).toBeNull();

    await waitFor(() => expect(section).toHaveAttribute('aria-busy', 'false'));
    await expect(status).toHaveTextContent('');
    await expect(canvas.getByText(/1,240 visits/)).toBeVisible();
  },
};

/** A known amount of work gets a `Progress`; a short wait of unknown length gets a `Spinner`. */
function Uploads({ done, total }: { done: number; total: number }) {
  return (
    <div style={{ display: 'grid', gap: 16, width: 320 }}>
      <Progress
        label="Uploading photos"
        value={done}
        max={total}
        getValueText={(value, max) => `${value} of ${max} photos`}
        showValue
      />
      <Spinner label="Saving your changes" />
    </div>
  );
}

export const KnownAndUnknown: Story = {
  render: () => <Uploads done={3} total={8} />,
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar', { name: 'Uploading photos' });
    await expect(bar).toHaveAttribute('aria-valuenow', '3');
    await expect(bar).toHaveAttribute('aria-valuemax', '8');
    await expect(canvas.getByRole('status')).toHaveTextContent('Saving your changes');
  },
};

const ORDERS = [
  { id: 'DH-1042', customer: 'Lê Minh Anh', total: '1.250.000 ₫' },
  { id: 'DH-1041', customer: 'Trần Quốc Bảo', total: '480.000 ₫' },
];

function OrdersLoading({ delay = 200 }: { delay?: number }) {
  const [loading, reload] = useFakeRequest(delay);
  return (
    <div style={{ width: 480 }}>
      <div role="status" style={srOnly}>
        {loading ? 'Loading the orders' : ''}
      </div>
      <Table aria-busy={loading}>
        <TableCaption>Recent orders</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead align="end">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? [0, 1].map((row) => (
                <TableRow key={row}>
                  {/* The same three cells as a real row, so the columns do not move. */}
                  {[0, 1, 2].map((cell) => (
                    <TableCell key={cell}>
                      <Skeleton shape="text" width={cell === 0 ? 72 : 120} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : ORDERS.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell align="end">{order.total}</TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
      <Button variant="ghost" onClick={reload} disabled={loading}>
        Reload
      </Button>
    </div>
  );
}

export const TableRows: Story = {
  render: () => <OrdersLoading />,
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Recent orders' });
    await expect(canvas.getAllByRole('row')).toHaveLength(3);
    await userEvent.click(canvas.getByRole('button', { name: 'Reload' }));
    await expect(canvas.getByRole('table', { name: 'Recent orders' })).toBe(table);
    await expect(table).toHaveAttribute('aria-busy', 'true');
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading the orders');
    await waitFor(() => expect(table).toHaveAttribute('aria-busy', 'false'));
    await expect(canvas.getByRole('cell', { name: 'DH-1042' })).toBeVisible();
  },
};
