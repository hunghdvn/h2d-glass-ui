// The data display of phase 4: Alert, Skeleton, Stepper, List, Progress and Table, rendered on the
// client. The Next.js fixture renders the same markup with the server-safe parts in a Server
// Component. The Steps are written in the component that renders the Stepper.
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  List,
  ListItem,
  Progress,
  Skeleton,
  SkeletonText,
  Step,
  Stepper,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'h2d-glass-ui';
import type { TableSort } from 'h2d-glass-ui';
import { useState } from 'react';

const ORDERS = [
  { id: '#2001', total: 300, city: 'Da Nang' },
  { id: '#2002', total: 120, city: '12 Hang Bong Street, Hoan Kiem' },
  { id: '#2003', total: 210, city: 'Hue' },
];

export function DataDisplay() {
  const [alertOpen, setAlertOpen] = useState(true);
  const [step, setStep] = useState(2);
  const [chosen, setChosen] = useState('none');
  const [sort, setSort] = useState<TableSort>('none');
  const rows =
    sort === 'none'
      ? ORDERS
      : [...ORDERS].sort((a, b) => (sort === 'ascending' ? a.total - b.total : b.total - a.total));
  // The width follows the window, not the widest part of the page: the tables must see it narrow.
  return (
    <section aria-label="Data display" style={{ display: 'grid', gap: 12, maxWidth: '100vw' }}>
      <Alert status="success">
        <AlertTitle>Backup finished</AlertTitle>
        <AlertDescription>The last copy is from this morning.</AlertDescription>
      </Alert>
      <div aria-busy="true" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Skeleton shape="circle" size={40} />
        <SkeletonText lines={2} />
      </div>
      <Stepper value={1} aria-label="Server progress">
        <Step title="Account" />
        <Step title="Plan" description="Pick one" />
        <Step title="Payment" />
      </Stepper>
      <List aria-label="Server links">
        <ListItem title="Plain link" href="#plain-link" end={<Badge>New</Badge>} />
        <ListItem
          title="Router link"
          description="Through renderLink"
          href="#router-link"
          renderLink={({ children, ...props }) => <a {...props}>{children}</a>}
        />
      </List>
      <Table>
        <TableCaption>Server orders</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead align="end">Amount</TableHead>
            <TableHead>Ship to</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>#1042</TableCell>
            <TableCell align="end">$120</TableCell>
            <TableCell style={{ whiteSpace: 'nowrap' }}>12 Hang Bong Street, Hoan Kiem</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>#1043</TableCell>
            <TableCell align="end">$75</TableCell>
            <TableCell style={{ whiteSpace: 'nowrap' }}>3 Le Loi, Hue</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      {alertOpen ? (
        <Alert status="warning" onDismiss={() => setAlertOpen(false)}>
          <AlertTitle>Storage is almost full</AlertTitle>
        </Alert>
      ) : null}
      <Progress label="Uploading report" value={45} showValue />
      <Stepper value={step} onValueChange={setStep} aria-label="Client progress">
        <Step title="Details" />
        <Step title="Review" />
        <Step title="Confirm" />
        <Step title="Finish" />
      </Stepper>
      <List aria-label="Client choices">
        <ListItem title="Open settings" onSelect={() => setChosen('settings')} />
        <ListItem title="Open profile" onSelect={() => setChosen('profile')} />
      </List>
      <p data-testid="chosen">{chosen}</p>
      <Table>
        <TableCaption>Client orders</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead align="end" sort={sort} onSort={setSort}>
              Total
            </TableHead>
            <TableHead>Ship to</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.id}</TableCell>
              <TableCell align="end">${order.total}</TableCell>
              <TableCell style={{ whiteSpace: 'nowrap' }}>{order.city}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
