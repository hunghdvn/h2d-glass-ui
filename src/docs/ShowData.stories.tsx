import { useState } from 'react';
import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { Button } from '../components/button/Button';
import { Checkbox } from '../components/checkbox/Checkbox';
import { List, ListItem } from '../components/list/List';
import { Pagination } from '../components/pagination/Pagination';
import { Step, Stepper } from '../components/stepper/Stepper';
import { Table, TableCaption } from '../components/table/Table';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/table/table-parts';
import type { TableSort } from '../components/table/table-parts';

// These examples are the code of "Show data" in Getting started. They are `no-visual`: they prove
// that the pieces fit together, and the looks of the parts have their own stories.
const meta = {
  title: 'Examples/Show data',
  tags: ['no-visual'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

interface Order {
  id: string;
  customer: string;
  total: number;
}

const ORDERS: Order[] = [
  { id: 'DH-1042', customer: 'Lê Minh Anh', total: 1250000 },
  { id: 'DH-1041', customer: 'Trần Quốc Bảo', total: 480000 },
  { id: 'DH-1040', customer: 'Phạm Thu Hà', total: 2190000 },
  { id: 'DH-1039', customer: 'Nguyễn Văn Dũng', total: 95000 },
  { id: 'DH-1038', customer: 'Đỗ Mai Chi', total: 760000 },
];

const PAGE_SIZE = 3;

/**
 * The library draws the table, the boxes and the pages. Sorting, choosing and cutting the data into
 * pages are done here, in plain code: the library never sorts, filters or pages.
 */
function OrdersTable({ orders }: { orders: Order[] }) {
  const [sort, setSort] = useState<TableSort>('none');
  const [page, setPage] = useState(1);
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());

  const sorted =
    sort === 'none'
      ? orders
      : [...orders].sort((a, b) => (sort === 'ascending' ? a.total - b.total : b.total - a.total));
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const rows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const onPage = rows.filter((order) => chosen.has(order.id)).length;
  const toggle = (id: string, on: boolean) =>
    setChosen((before) => {
      const next = new Set(before);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <div style={{ width: 520, display: 'grid', gap: 12 }}>
      <Table>
        <TableCaption>Recent orders</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>
              {/* The box in the heading selects the rows of this page, and is mixed when only some are. */}
              <Checkbox
                aria-label="Select all"
                checked={rows.length > 0 && onPage === rows.length}
                indeterminate={onPage > 0 && onPage < rows.length}
                onCheckedChange={(on) => rows.forEach((order) => toggle(order.id, on))}
              />
            </TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead
              align="end"
              sort={sort}
              onSort={(next) => {
                setSort(next);
                setPage(1);
              }}
            >
              Total
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              {/* One cell across every column, which may wrap. */}
              <TableCell colSpan={4} align="center" style={{ whiteSpace: 'normal' }}>
                <strong>No orders yet</strong>
                <br />
                New orders will show up here.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((order) => (
              <TableRow key={order.id} selected={chosen.has(order.id)}>
                <TableCell>
                  <Checkbox
                    aria-label={`Select ${order.id}`}
                    checked={chosen.has(order.id)}
                    onCheckedChange={(on) => toggle(order.id, on)}
                  />
                </TableCell>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell align="end">{order.total.toLocaleString('vi-VN')} ₫</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination count={pageCount} page={page} onPageChange={setPage} aria-label="Orders pages" />
    </div>
  );
}

export const Orders: Story = {
  render: () => <OrdersTable orders={ORDERS} />,
  play: async ({ canvas }) => {
    const column = (name: string) => canvas.getByRole('columnheader', { name });
    const first = () => canvas.getAllByRole('row')[1];
    await expect(first()).toHaveTextContent('DH-1042');
    await expect(column('Total')).not.toHaveAttribute('aria-sort');

    // The app sorts: the library only says which column is sorted.
    await userEvent.click(canvas.getByRole('button', { name: 'Total' }));
    await expect(column('Total')).toHaveAttribute('aria-sort', 'ascending');
    await expect(first()).toHaveTextContent('DH-1039');

    // Choosing one row of three makes the box in the heading mixed.
    const all = canvas.getByRole('checkbox', { name: 'Select all' }) as HTMLInputElement;
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select DH-1039' }));
    await expect(all.indeterminate).toBe(true);
    await expect(all.checked).toBe(false);
    await userEvent.click(all);
    await expect(all.indeterminate).toBe(false);
    await expect(all.checked).toBe(true);

    // The second page is cut by the app; the choice made on the first one is kept.
    await userEvent.click(canvas.getByRole('button', { name: 'Page 2' }));
    await expect(canvas.getAllByRole('row')).toHaveLength(3);
    await expect(all.checked).toBe(false);
    await userEvent.click(canvas.getByRole('button', { name: 'Page 1' }));
    await expect(all.checked).toBe(true);
  },
};

export const Empty: Story = {
  render: () => <OrdersTable orders={[]} />,
  play: async ({ canvas }) => {
    const cell = canvas.getByRole('cell', { name: /No orders yet/ });
    await expect(cell).toHaveAttribute('colspan', '4');
    await expect(canvas.getAllByRole('row')).toHaveLength(2);
  },
};

function Link({ href, ...props }: ComponentProps<'a'>) {
  // Stands for the `Link` of your router. The content comes in `props.children`.
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  return <a href={href} {...props} />;
}

function Sidebar({ path }: { path: string }) {
  const item = (title: string, href: string) => (
    <ListItem
      title={title}
      href={href}
      current={path === href}
      renderLink={(props) => <Link {...props} />}
    />
  );
  return (
    <nav aria-label="Settings" style={{ width: 260 }}>
      <List size="sm">
        {item('Profile', '/settings/profile')}
        {item('Billing', '/settings/billing')}
        {item('Team', '/settings/team')}
      </List>
    </nav>
  );
}

export const Navigation: Story = {
  render: () => <Sidebar path="/settings/billing" />,
  play: async ({ canvas }) => {
    // The current row says so on its link, which is the one the router rendered.
    await expect(canvas.getByRole('link', { name: 'Billing' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(canvas.getByRole('link', { name: 'Profile' })).not.toHaveAttribute('aria-current');
    await expect(canvas.getByRole('link', { name: 'Team' })).toHaveAttribute(
      'href',
      '/settings/team',
    );
  },
};

/** The component that renders the Stepper writes the Steps, and shows what the current one holds. */
function Checkout() {
  const [value, setValue] = useState(0);
  return (
    <div style={{ width: 480, display: 'grid', gap: 16 }}>
      <Stepper value={value} onValueChange={setValue}>
        <Step title="Cart" />
        <Step title="Delivery" />
        <Step title="Payment" />
      </Stepper>
      {value === 0 ? <Button onClick={() => setValue(1)}>Continue to delivery</Button> : null}
      {value === 1 ? <p>Where should we send it?</p> : null}
      {value === 2 ? <p>How would you like to pay?</p> : null}
    </div>
  );
}

export const Steps: Story = {
  render: () => <Checkout />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Continue to delivery' }));
    await expect(canvas.getByText('Where should we send it?')).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Continue to delivery' })).toBeNull();
    // Going back is the Stepper's `onValueChange`: the step that was done is a button.
    await userEvent.click(canvas.getByRole('button', { name: /Cart/ }));
    await expect(canvas.getByRole('button', { name: 'Continue to delivery' })).toBeVisible();
  },
};
