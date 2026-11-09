'use client';

// The data display that needs the client: an Alert that can be dismissed, a Progress, a List with
// onSelect, a Table with onSort and a Stepper whose steps can be pressed. The Steps are written in
// this component and not handed in by a Server Component: a Step that arrives already rendered
// cannot be read by the Stepper.
import {
  Alert,
  AlertTitle,
  List,
  ListItem,
  Progress,
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

export function DataControls() {
  const [alertOpen, setAlertOpen] = useState(true);
  const [step, setStep] = useState(2);
  const [chosen, setChosen] = useState('none');
  const [sort, setSort] = useState<TableSort>('none');
  const rows =
    sort === 'none'
      ? ORDERS
      : [...ORDERS].sort((a, b) => (sort === 'ascending' ? a.total - b.total : b.total - a.total));
  return (
    <div style={{ display: 'grid', gap: 12 }}>
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
    </div>
  );
}
