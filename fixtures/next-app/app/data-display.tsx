// A Server Component: the data display of phase 4. Alert (without onDismiss), Skeleton, a Stepper
// that only shows where a process is, a List whose links are plain and next/link, and a Table whose
// parts all render on the server. The Stepper's Steps are written here, in the component that
// renders the Stepper, so that it can read them. The Vite fixture renders the same markup on the
// client.
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  List,
  ListItem,
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
import Link from 'next/link';
import { DataControls } from './data-controls';

export function DataDisplay() {
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
          description="Through next/link"
          href="#router-link"
          renderLink={(props) => <Link {...props} />}
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
      <DataControls />
    </section>
  );
}
