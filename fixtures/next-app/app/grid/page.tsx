// A Server Component: it imports the orders and hands them to the grid, which is a Client Component.
// The grid's HTML is rendered here, on the server, with the first page of the first group in it.
import { OrdersGrid } from './orders-grid';
import { orders } from './orders';

export default function GridPage() {
  return (
    <main style={{ margin: '32px auto', maxWidth: 1100, padding: '0 16px' }}>
      <OrdersGrid orders={orders} />
    </main>
  );
}
