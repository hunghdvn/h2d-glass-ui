import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { FillFrames, checkFillFrames } from '../../../.storybook/fill-frames';
import { paintedPixels } from '../../../.storybook/painted-pixel';
import type { Rgb } from '../../../.storybook/painted-pixel';
import { realUserEvent } from '../../../.storybook/real-input';
import { strokeIcon } from '../../internal/icons';
import type { BadgeProps } from '../badge/Badge';
import { Badge } from '../badge/Badge';
import { Card, CardTitle } from '../card/Card';
import { Checkbox } from '../checkbox/Checkbox';
import { IconButton } from '../icon-button/IconButton';
import { Radio } from '../radio-group/Radio';
import { RadioGroup } from '../radio-group/RadioGroup';
import { Switch } from '../switch/Switch';
import { Table, TableCaption } from './Table';
import type { TableProps } from './Table';
import { TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table-parts';
import type { TableSort } from './table-parts';

const meta = {
  title: 'Components/Table',
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The orders of the mockup. Their texts are English; the names and the figures are the mockup's. */
const ORDERS: ReadonlyArray<{
  id: string;
  customer: string;
  status: BadgeProps['variant'];
  statusText: string;
  date: string;
  total: string;
}> = [
  {
    id: 'DH-1042',
    customer: 'Lê Minh Anh',
    status: 'success',
    statusText: 'Delivered',
    date: '05/11/2026',
    total: '1.250.000 ₫',
  },
  {
    id: 'DH-1041',
    customer: 'Trần Thu Hà',
    status: 'accent',
    statusText: 'Shipping',
    date: '04/11/2026',
    total: '890.000 ₫',
  },
  {
    id: 'DH-1040',
    customer: 'Phạm Quốc Bảo',
    status: 'warning',
    statusText: 'Pending',
    date: '03/11/2026',
    total: '2.430.000 ₫',
  },
  {
    id: 'DH-1039',
    customer: 'Đỗ Hải Yến',
    status: 'danger',
    statusText: 'Cancelled',
    date: '02/11/2026',
    total: '320.000 ₫',
  },
  {
    id: 'DH-1038',
    customer: 'Vũ Ngọc Lan',
    status: 'success',
    statusText: 'Delivered',
    date: '01/11/2026',
    total: '1.075.000 ₫',
  },
];

/** The "…" of the row menu: the icon is the page's, not the library's. */
const MoreIcon = () => (
  <svg {...strokeIcon} width={16} height={16}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const noop = () => {};

type OrdersProps = Omit<TableProps, 'children'> & {
  rows?: typeof ORDERS;
  /** Draws the footer row. Default true. */
  footer?: boolean;
  /** The row that is chosen and the one the harness hovers. */
  selected?: string;
  hovered?: string;
  /** The box that selects all is in its mixed state. Default true; the `sm` tables of the mockup have none chosen. */
  mixed?: boolean;
};

/**
 * The orders table of the mockup: the box that selects all in its mixed state, the date sorted
 * descending, two columns that can be sorted and are not, a row that is chosen with a Badge `accent`,
 * a row that is hovered (the harness hovers it, through `data-visual-hover`), and a footer.
 */
function Orders({
  rows = ORDERS,
  footer = true,
  selected = 'DH-1041',
  hovered = 'DH-1040',
  mixed = true,
  ...props
}: OrdersProps) {
  return (
    <Table {...props}>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Checkbox aria-label="Select all" indeterminate={mixed} />
          </TableHead>
          <TableHead>Order</TableHead>
          <TableHead sort="none" onSort={noop}>
            Customer
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead sort="descending" onSort={noop}>
            Date
          </TableHead>
          <TableHead align="end" sort="none" onSort={noop}>
            Total
          </TableHead>
          <TableHead>
            <span className="flg-visually-hidden">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((order) => (
          <TableRow
            key={order.id}
            selected={order.id === selected}
            {...(order.id === hovered ? { 'data-visual-hover': '' } : undefined)}
          >
            <TableCell>
              <Checkbox aria-label={`Select ${order.id}`} defaultChecked={order.id === selected} />
            </TableCell>
            <TableCell style={{ fontWeight: 'var(--flg-weight-medium)' }}>{order.id}</TableCell>
            <TableCell>{order.customer}</TableCell>
            <TableCell>
              <Badge variant={order.status}>{order.statusText}</Badge>
            </TableCell>
            <TableCell>{order.date}</TableCell>
            <TableCell align="end">{order.total}</TableCell>
            <TableCell>
              <IconButton variant="ghost" size="sm" aria-label={`Actions for ${order.id}`}>
                <MoreIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      {footer ? (
        <TableFooter>
          <TableRow>
            <TableCell />
            <TableCell colSpan={4}>Total · {rows.length} orders</TableCell>
            <TableCell align="end">5.965.000 ₫</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      ) : null}
    </Table>
  );
}

/** The empty state is a recipe of the docs, written here as a page writes it: one cell across all the columns. */
function EmptyOrders(props: Omit<TableProps, 'children'>) {
  return (
    <Table {...props}>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Checkbox aria-label="Select all" disabled />
          </TableHead>
          <TableHead>Order</TableHead>
          <TableHead sort="none" onSort={noop}>
            Customer
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead sort="descending" onSort={noop}>
            Date
          </TableHead>
          <TableHead align="end" sort="none" onSort={noop}>
            Total
          </TableHead>
          <TableHead>
            <span className="flg-visually-hidden">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={7} align="center" style={{ whiteSpace: 'normal' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '14px 0',
              }}
            >
              <svg
                {...strokeIcon}
                width={24}
                height={24}
                style={{ color: 'var(--flg-text-muted)', marginBottom: 4 }}
              >
                <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
              </svg>
              <span style={{ fontWeight: 'var(--flg-weight-semibold)' }}>No orders yet</span>
              <span style={{ fontSize: 'var(--flg-text-xs)', color: 'var(--flg-text-muted)' }}>
                New orders will show up here.
              </span>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

/** The small label of a section of the mockup page. */
function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <span
        style={{
          font: '600 10px system-ui',
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: 'var(--flg-text-muted)',
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * The states of the approved mockup (table T1-T3): the orders table, a card's heading naming it
 * through `aria-labelledby` (the recipe of the docs when a heading is already on the page), the `sm`
 * table, and the empty state.
 */
function Looks({ variant }: Pick<TableProps, 'variant'>) {
  return (
    <Card style={{ gap: 14, width: 760 }}>
      <CardTitle id="orders-title">Recent orders</CardTitle>
      <Orders variant={variant} aria-labelledby="orders-title" />
      <Section label="Density sm">
        <Orders
          variant={variant}
          size="sm"
          mixed={false}
          rows={ORDERS.slice(0, 3)}
          footer={false}
          selected=""
          hovered=""
          aria-label="Recent orders, small"
        />
      </Section>
      <Section label="Empty (one row spanning all the columns)">
        <EmptyOrders variant={variant} aria-label="Recent orders, empty" />
      </Section>
    </Card>
  );
}

// Tab twice: the box that selects all, then the sort button of the Customer column, where the
// mockup draws the focus.
const focusCustomerSort: Story['play'] = async ({ canvas }) => {
  await userEvent.tab();
  await userEvent.tab();
  const focused = canvas.getAllByRole('button', { name: 'Customer' })[0]!;
  await expect(focused).toHaveFocus();
  await expect(focused.matches(':focus-visible')).toBe(true);
};

export const Lined: Story = { render: () => <Looks variant="lined" />, play: focusCustomerSort };

/**
 * The `sm` table with keyboard focus on a sort button, which the mockup draws in both densities. Only
 * one element has the focus, so the density has a story of its own. In `sm` the controls in the last
 * row are 3px from the edge of the frame, which is why a `lined` frame draws its rings inside under
 * `prefers-contrast: more` and forced colours.
 */
export const LinedSmallFocus: Story = {
  render: () => (
    <Card style={{ width: 760 }}>
      <Orders
        variant="lined"
        size="sm"
        mixed={false}
        rows={ORDERS.slice(0, 3)}
        footer={false}
        selected=""
        hovered=""
        aria-label="Recent orders"
      />
    </Card>
  ),
  play: focusCustomerSort,
};

export const Striped: Story = {
  render: () => <Looks variant="striped" />,
  play: focusCustomerSort,
};

export const Minimal: Story = {
  render: () => <Looks variant="minimal" />,
  play: focusCustomerSort,
};

/** The `sm` table of a look with keyboard focus on a sort button: see `LinedSmallFocus`. */
const smallFocus = (variant: NonNullable<TableProps['variant']>): Story => ({
  render: () => (
    <Card style={{ width: 760 }}>
      <Orders
        variant={variant}
        size="sm"
        mixed={false}
        rows={ORDERS.slice(0, 3)}
        footer={false}
        selected=""
        hovered=""
        aria-label="Recent orders"
      />
    </Card>
  ),
  play: focusCustomerSort,
});

export const StripedSmallFocus: Story = smallFocus('striped');

export const MinimalSmallFocus: Story = smallFocus('minimal');

/** Twelve rows in a frame that is 180px tall: the heading stays at the top while the rows scroll. */
const MANY_ROWS = Array.from({ length: 12 }, (_, index) => ({
  ...ORDERS[index % ORDERS.length]!,
  id: `DH-${1042 - index}`,
}));

/**
 * `stickyHeader` keeps the column headings at the top of the frame, over the rows that scroll under
 * them, in each look: the heading of the scrolled table is at the top edge of what the frame shows
 * (inside its border, and inside no padding: `striped` and `minimal` have 6px of it, which the rows
 * must not show through), and a press at the middle of a heading, and one in the first pixels of the
 * frame, are presses of the heading. The look is that of the heading over rows, which is a little more
 * opaque than the glass of the card.
 */
export const StickyHeader: Story = {
  render: () => (
    <Card style={{ gap: 14, width: 760 }}>
      {(['lined', 'striped', 'minimal'] as const).map((variant) => (
        <Orders
          key={variant}
          variant={variant}
          rows={MANY_ROWS}
          footer={false}
          selected=""
          hovered=""
          stickyHeader
          style={{ maxHeight: 180 }}
          aria-label={`Recent orders, ${variant}`}
        />
      ))}
    </Card>
  ),
  play: async ({ canvasElement }) => {
    for (const frame of canvasElement.querySelectorAll<HTMLElement>('.flg-table-frame')) {
      const variant = frame.dataset.variant;
      frame.scrollTop = 90;
      await waitFor(() => expect(frame.scrollTop, variant).toBeGreaterThan(60));
      const heading = frame.querySelector<HTMLElement>('thead th:nth-child(2)')!;
      const outer = frame.getBoundingClientRect();
      const box = heading.getBoundingClientRect();
      const top = outer.top + frame.clientTop;
      // At the top edge of what the frame shows, inside its border and not below its padding.
      await expect(Math.abs(box.top - top), `${variant}: flush with the top`).toBeLessThanOrEqual(
        0.5,
      );
      // Nothing of a row is above it: at the middle of the heading, and in the first pixels of the
      // frame, where the padding of `striped` and `minimal` is.
      const middle = box.x + box.width / 2;
      for (const y of [box.y + box.height / 2, top + 2]) {
        const hit = document.elementFromPoint(middle, y);
        await expect(heading.contains(hit), `${variant}: the heading is at ${y}`).toBe(true);
      }
    }
  },
};

/**
 * A page header that sticks to the top of the page, with a low `z-index`, is common. The sticky
 * headings of a Table have a `z-index` of their own, which must stay inside the frame: when the
 * frame passes under the page header, a press at the middle of the page header is a press of the
 * page header, and not of a heading that is painted over it.
 */
export const StickyHeaderUnderPageHeader: Story = {
  tags: ['no-visual'],
  render: () => (
    // The stage clips and does not scroll, so the page is a scroll box of its own.
    <div data-testid="page" style={{ width: 760, height: 320, overflow: 'auto' }}>
      <div
        data-testid="page-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          height: 40,
          background: 'var(--flg-glass-tint-solid)',
        }}
      >
        Page header
      </div>
      <div style={{ height: 200 }} />
      <Orders
        rows={MANY_ROWS}
        footer={false}
        selected=""
        hovered=""
        stickyHeader
        style={{ maxHeight: 180 }}
        aria-label="Recent orders"
      />
      <div style={{ height: 600 }} />
    </div>
  ),
  play: async ({ canvasElement, canvas }) => {
    const page = canvas.getByTestId('page');
    const header = canvas.getByTestId('page-header');
    const frame = canvasElement.querySelector<HTMLElement>('.flg-table-frame')!;
    // Scroll the page until the top of the frame is 8px under the top of the page header, so the
    // sticky headings of the table lie under it.
    page.scrollTop += frame.getBoundingClientRect().top - header.getBoundingClientRect().top - 8;
    await waitFor(() =>
      expect(
        Math.abs(frame.getBoundingClientRect().top - header.getBoundingClientRect().top - 8),
      ).toBeLessThan(1),
    );
    const box = header.getBoundingClientRect();
    const x = frame.getBoundingClientRect().left + 60;
    const hit = document.elementFromPoint(x, box.top + box.height / 2);
    await expect(header.contains(hit), 'the page header is on top of the headings').toBe(true);
  },
};

/**
 * A browser scrolls a control that gets the focus only until it touches the edge of the frame, and
 * does not know that a sticky heading covers the top of it: a control focused from below (Shift+Tab
 * to the row above the first one in view) would be under the heading, with no sign of the focus
 * (WCAG 2.2, 2.4.11). `scroll-padding-top` on the frame tells it. WebKit does not scroll a frame to
 * a focused control at all, whatever the frame says, so there is nothing to see there.
 */
export const StickyHeaderKeepsFocusInView: Story = {
  tags: ['no-visual'],
  render: () => (
    <Table stickyHeader style={{ maxHeight: 180 }} aria-label="Boxes">
      <TableHeader>
        <TableRow>
          <TableHead>Chosen</TableHead>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {MANY_ROWS.map((order) => (
          <TableRow key={order.id}>
            <TableCell>
              <Checkbox aria-label={`Select ${order.id}`} />
            </TableCell>
            <TableCell>{order.customer}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  play: async ({ canvas, canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    if (navigator.userAgent.includes('AppleWebKit') && !navigator.userAgent.includes('Chrome')) {
      return;
    }
    const frame = canvasElement.querySelector<HTMLElement>('.flg-table-frame')!;
    const header = frame.querySelector<HTMLElement>('thead th')!;
    const rows = canvas.getAllByRole('checkbox');
    // Put the sixth box at the top of what the frame shows, under the heading, then go one back.
    rows[5]!.focus();
    frame.scrollTop = rows[5]!.closest('tr')!.offsetTop - header.offsetHeight;
    await real.keyboard('{Shift>}{Tab}{/Shift}');
    const focused = rows[4]!;
    await expect(focused).toHaveFocus();
    await waitFor(() => {
      const box = focused.closest<HTMLElement>('.flg-checkbox')!.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      expect(
        focused.closest('.flg-checkbox')!.contains(hit),
        'the focused box is not covered by the heading',
      ).toBe(true);
    });
  },
};

/**
 * A `TableCell` in the `TableHeader`, such as an empty corner cell, is part of the heading: it gets
 * the band, the rule under it, the text style of a heading, and it sticks with the others.
 */
export const HeaderCornerCell: Story = {
  tags: ['no-visual'],
  render: () => (
    <Table stickyHeader style={{ maxHeight: 180 }} aria-label="Corner">
      <TableHeader>
        <TableRow>
          <TableCell>Corner</TableCell>
          <TableHead>Heading</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>A</TableCell>
          <TableCell>B</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  play: async ({ canvasElement }) => {
    const corner = canvasElement.querySelector<HTMLElement>('thead td')!;
    const heading = canvasElement.querySelector<HTMLElement>('thead th')!;
    const cornerStyle = getComputedStyle(corner);
    const headingStyle = getComputedStyle(heading);
    for (const property of [
      'position',
      'top',
      'backgroundImage',
      'borderBottomWidth',
      'color',
      'fontSize',
      'fontWeight',
      'paddingTop',
    ] as const) {
      await expect(cornerStyle[property], property).toBe(headingStyle[property]);
    }
    await expect(cornerStyle.position).toBe('sticky');
    await expect(cornerStyle.borderBottomWidth).toBe('1px');
  },
};

/** A table wider than the frame it is given, named by its caption. */
function CaptionedWide({ width, variant }: { width: number; variant?: TableProps['variant'] }) {
  return (
    <div style={{ width: 900 }}>
      <Table variant={variant} style={{ width }}>
        <TableCaption>{variant ? `Recent orders, ${variant}` : 'Recent orders'}</TableCaption>
        <TableHeader>
          <TableRow>
            {['Order', 'Customer', 'Status', 'Date', 'Total'].map((name) => (
              <TableHead key={name}>{name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ORDERS.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.id}</TableCell>
              <TableCell>{order.customer}</TableCell>
              <TableCell>{order.statusText}</TableCell>
              <TableCell>{order.date}</TableCell>
              <TableCell>{order.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * A table wider than its frame makes the frame a named region that a keyboard reaches, and a table
 * that fits does not: the role, `tabindex` and name come and go as the frame is resized, which only a
 * browser can do (ResizeObserver, layout). The name is the caption's, or the one the Table was given
 * when it has no caption.
 */
export const ScrollRegion: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <CaptionedWide width={320} />
      <div style={{ width: 900 }}>
        <Orders style={{ width: 320 }} footer={false} aria-label="Orders by name" />
      </div>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const [frame, labelled] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('.flg-table-frame'),
    ) as [HTMLElement, HTMLElement];
    await waitFor(() => expect(labelled).toHaveAttribute('role', 'region'));
    await expect(canvas.getByRole('region', { name: 'Orders by name' })).toBe(labelled);
    await expect(labelled.tabIndex).toBe(0);
    await expect(labelled).toHaveAttribute('aria-label', 'Orders by name');
    await expect(labelled).not.toHaveAttribute('aria-labelledby');

    await waitFor(() => expect(frame).toHaveAttribute('role', 'region'));
    await expect(frame.tabIndex).toBe(0);
    await expect(canvas.getByRole('region', { name: 'Recent orders' })).toBe(frame);
    await expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth);
    await expect(frame.getAttribute('aria-labelledby')).toBe(frame.querySelector('caption')!.id);

    // The frame grows until the table fits: it is a plain frame again.
    frame.style.width = '1400px';
    await waitFor(() => expect(frame).not.toHaveAttribute('role'));
    await expect(frame).not.toHaveAttribute('tabindex');
    await expect(frame).not.toHaveAttribute('aria-labelledby');
    await expect(canvas.queryByRole('region', { name: 'Recent orders' })).toBeNull();

    // And shrinks again: the region comes back, named.
    frame.style.width = '320px';
    await waitFor(() => expect(frame).toHaveAttribute('role', 'region'));
    await expect(canvas.getByRole('region', { name: 'Recent orders' })).toBe(frame);
  },
};

/** Real arrow keys scroll a frame that has the focus: that is what the tab stop is for. */
export const ArrowKeysScroll: Story = {
  tags: ['no-visual'],
  render: () => <CaptionedWide width={320} />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const frame = canvasElement.querySelector<HTMLElement>('.flg-table-frame')!;
    await waitFor(() => expect(frame).toHaveAttribute('role', 'region'));
    // A Tab from outside reaches it: nothing in this table can be focused before it.
    frame.focus();
    await expect(frame).toHaveFocus();
    await expect(frame.scrollLeft).toBe(0);
    await real.keyboard('{ArrowRight}');
    await waitFor(() => expect(frame.scrollLeft).toBeGreaterThan(0));
    const after = frame.scrollLeft;
    await real.keyboard('{ArrowLeft}');
    await waitFor(() => expect(frame.scrollLeft).toBeLessThan(after));
  },
};

/** The columns of a table the way a person sorts them: one is sorted at a time. */
function Sortable({ onSort }: { onSort: (key: string, next: 'ascending' | 'descending') => void }) {
  const [sorted, setSorted] = useState<{ key: string; direction: TableSort }>({
    key: 'date',
    direction: 'descending',
  });
  const head = (key: string, name: string) => (
    <TableHead
      sort={sorted.key === key ? sorted.direction : 'none'}
      onSort={(next) => {
        onSort(key, next);
        setSorted({ key, direction: next });
      }}
    >
      {name}
    </TableHead>
  );
  return (
    <Table aria-label="Orders">
      <TableHeader>
        <TableRow>
          {head('customer', 'Customer')}
          {head('date', 'Date')}
          {head('total', 'Total')}
        </TableRow>
      </TableHeader>
    </Table>
  );
}

/**
 * A press on a sort button calls `onSort` with the direction to go to and the `aria-sort` follows it:
 * only the sorted column has one. A column that is not sorted starts ascending; the sorted one turns
 * over.
 */
const onSort = fn();

export const Sorting: Story = {
  tags: ['no-visual'],
  render: () => <Sortable onSort={onSort} />,
  play: async ({ canvas }) => {
    onSort.mockClear();
    const column = (name: string) => canvas.getByRole('columnheader', { name });
    await expect(column('Date')).toHaveAttribute('aria-sort', 'descending');
    await expect(column('Customer')).not.toHaveAttribute('aria-sort');

    await userEvent.click(canvas.getByRole('button', { name: 'Customer' }));
    await expect(onSort.mock.calls).toEqual([['customer', 'ascending']]);
    await expect(column('Customer')).toHaveAttribute('aria-sort', 'ascending');
    await expect(column('Date')).not.toHaveAttribute('aria-sort');

    await userEvent.click(canvas.getByRole('button', { name: 'Customer' }));
    await expect(onSort.mock.calls.at(-1)).toEqual(['customer', 'descending']);
    await expect(column('Customer')).toHaveAttribute('aria-sort', 'descending');

    // The keyboard presses it too, since it is a real button.
    canvas.getByRole('button', { name: 'Total' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(onSort.mock.calls.at(-1)).toEqual(['total', 'ascending']);
    await expect(column('Total')).toHaveAttribute('aria-sort', 'ascending');
    await expect(column('Customer')).not.toHaveAttribute('aria-sort');
  },
};

/**
 * A Table fills the row it is in, also as an item of a flex row beside a box: it takes the rest of the
 * row, and a table wider than that scrolls inside its frame, which becomes a named region, instead of
 * pushing the row, and the page, wider. Only a real layout can show it.
 */
export const InAFlexRow: Story = {
  tags: ['no-visual'],
  render: () => (
    <div data-row style={{ display: 'flex', alignItems: 'start', gap: 12, width: 700 }}>
      <span data-box style={{ flex: 'none', width: 200, height: 60 }} />
      <Table aria-label="Orders">
        <TableHeader>
          <TableRow>
            {['Order', 'Customer', 'Status', 'Date', 'Total'].map((name) => (
              <TableHead key={name} style={{ minWidth: 200 }}>
                {name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      </Table>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const row = canvasElement.querySelector<HTMLElement>('[data-row]')!;
    const frame = canvasElement.querySelector<HTMLElement>('.flg-table-frame')!;
    const rest = row.getBoundingClientRect().width - 200 - 12;
    await expect(Math.abs(frame.getBoundingClientRect().width - rest)).toBeLessThanOrEqual(1);
    await expect(frame.getBoundingClientRect().right).toBeLessThanOrEqual(
      row.getBoundingClientRect().right + 0.5,
    );
    // The table is 1000px wide and scrolls in the frame: the row did not grow.
    await expect(frame.scrollWidth).toBeGreaterThanOrEqual(1000);
    await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
    await waitFor(() => expect(frame).toHaveAttribute('role', 'region'));
    await expect(canvas.getByRole('region', { name: 'Orders' })).toBe(frame);
  },
};

/**
 * The margin, padding and border of a frame come out of its width: with `margin: 0 16px` or
 * `padding: 8px`, in a 400px block and in a flex row beside a box, it stays inside its parent and
 * fills what the parent leaves it.
 */
export const MarginAndPadding: Story = {
  tags: ['no-visual'],
  render: () => (
    <FillFrames
      name="table"
      render={(style: CSSProperties) => (
        <Table aria-label="Orders" style={style}>
          <TableBody>
            <TableRow>
              <TableCell>DH-1042</TableCell>
              <TableCell>Lê Minh Anh</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    />
  ),
  play: async ({ canvasElement }) => checkFillFrames(canvasElement, 'table'),
};

/**
 * A cell that holds only a Checkbox is the narrow column of the boxes (16px of content, 4px of
 * padding after it), and one that holds only an icon button is the narrow column of the actions
 * (28px of content, padding of 4px and 8px): in a heading and in a body cell alike, whatever else is
 * in the column.
 */
export const NarrowColumns: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 760 }}>
      <Orders variant="lined" aria-label="Orders" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cells = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('tbody tr:first-child td'),
    );
    const boxes = cells[0]!;
    const actions = cells[6]!;
    const head = canvasElement.querySelector<HTMLElement>('thead th')!;
    // The content-box width plus the padding of each side: 12 before and 4 after, and 4 and 8.
    await expect(Math.round(boxes.getBoundingClientRect().width)).toBe(16 + 12 + 4);
    await expect(Math.round(head.getBoundingClientRect().width)).toBe(16 + 12 + 4);
    await expect(Math.round(actions.getBoundingClientRect().width)).toBe(28 + 4 + 8);
    await expect(getComputedStyle(boxes).paddingRight).toBe('4px');
    await expect(getComputedStyle(actions).paddingLeft).toBe('4px');
    await expect(getComputedStyle(actions).paddingRight).toBe('8px');
  },
};

/** What differs between a ring that is drawn and one that is not, at a point: any channel by this much. */
const RING_DIFFERENCE = 60;

/** How far inside the edge of a control the points are looked at, in CSS pixels. */
const ACROSS = [0.5, 1.5, 2.5] as const;

/**
 * In a `lined` frame the rings of the library's controls are drawn inside them under
 * `prefers-contrast: more` and forced colours, the two modes where the outline is the sign of focus:
 * the frame clips what it paints outside its padding edge, and in `sm` the controls of the last row
 * are 3px from it. Read from the painted pixels at three points across the first 3px inside the edge
 * of the control nearest the edge of the frame: with `outline-offset: -2px` the 2px ring fills the
 * two pixels there, and a ring drawn outside the control would leave all three the control's own
 * colour. The Switch track and the Radio dot are read in a frame of their own, whose only row is the
 * one they are in. Three, since a screenshot starts at a whole device pixel and the frame may not. The
 * preferences are emulated through the protocol, which only Chromium has.
 */
export const FocusRingsInsideLinedFrame: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 760 }}>
      <Orders
        variant="lined"
        size="sm"
        mixed={false}
        rows={ORDERS.slice(0, 2)}
        footer={false}
        selected=""
        hovered=""
        aria-label="Orders"
      />
      <Table variant="lined" size="sm" aria-label="Preferences" style={{ marginTop: 16 }}>
        <TableBody>
          <TableRow>
            <TableCell>
              <Switch aria-label="Notifications" />
            </TableCell>
            <TableCell>
              <RadioGroup aria-label="Size" defaultValue="a">
                <Radio value="a" aria-label="Small" />
              </RadioGroup>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { cdp, server } = await import('vitest/browser');
    if (server.browser !== 'chromium') return;
    const real = await realUserEvent();
    if (!real) return;
    const session = cdp();
    const [frame, preferences] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('.flg-table-frame'),
    ) as [HTMLElement, HTMLElement];
    const lastRow = frame.querySelector<HTMLElement>('tbody tr:last-child')!;
    // The control that takes the focus, the element that draws its ring, and where the ring is: the
    // side of the ring's element that is nearest the edge of the frame.
    const sortButton = frame.querySelector<HTMLElement>('thead .flg-table-sort')!;
    const iconButton = lastRow.querySelector<HTMLElement>('.flg-button')!;
    const checkbox = lastRow.querySelector<HTMLElement>('.flg-checkbox')!;
    const targets: Array<{
      name: string;
      frame: HTMLElement;
      focus: HTMLElement;
      ring: HTMLElement;
      at: (box: DOMRect) => Array<[number, number]>;
    }> = [
      {
        name: 'sort button',
        frame,
        focus: sortButton,
        ring: sortButton,
        at: (box) => ACROSS.map((depth) => [box.x + box.width / 2, box.y + depth]),
      },
      {
        name: 'icon button',
        frame,
        focus: iconButton,
        ring: iconButton,
        at: (box) => ACROSS.map((depth) => [box.x + box.width / 2, box.bottom - depth]),
      },
      {
        name: 'checkbox',
        frame,
        focus: checkbox.querySelector<HTMLElement>('input')!,
        ring: checkbox.querySelector<HTMLElement>('.flg-checkbox-box')!,
        at: (box) => ACROSS.map((depth) => [box.x + depth, box.y + box.height / 2]),
      },
      {
        name: 'switch',
        frame: preferences,
        focus: preferences.querySelector<HTMLElement>('.flg-switch input')!,
        ring: preferences.querySelector<HTMLElement>('.flg-switch-track')!,
        at: (box) => ACROSS.map((depth) => [box.x + depth, box.y + box.height / 2]),
      },
      {
        name: 'radio',
        frame: preferences,
        focus: preferences.querySelector<HTMLElement>('.flg-radio input')!,
        ring: preferences.querySelector<HTMLElement>('.flg-radio-dot')!,
        at: (box) => ACROSS.map((depth) => [box.x + depth, box.y + box.height / 2]),
      },
    ];
    const pixelsAt = async (
      from: HTMLElement,
      box: DOMRect,
      at: (box: DOMRect) => Array<[number, number]>,
    ) => {
      const outer = from.getBoundingClientRect();
      return (await paintedPixels(
        from,
        at(box).map(([x, y]) => [x - outer.x, y - outer.y] as const),
      ))!;
    };
    for (const feature of [
      { name: 'prefers-contrast', value: 'more' },
      { name: 'forced-colors', value: 'active' },
    ]) {
      await session.send('Emulation.setEmulatedMedia', { features: [feature] });
      try {
        await waitFor(() =>
          expect(matchMedia(`(${feature.name}: ${feature.value})`).matches).toBe(true),
        );
        for (const { name, frame: from, focus, ring, at } of targets) {
          const label = `${feature.name}, ${name}`;
          await real.keyboard('{Escape}');
          (document.activeElement as HTMLElement | null)?.blur();
          const before = await pixelsAt(from, ring.getBoundingClientRect(), at);
          // The ring is drawn for a focus given by script after a key press (Chromium, WebKit).
          focus.focus({ focusVisible: true });
          await expect(focus, `${label}: it has the focus`).toHaveFocus();
          await expect(focus.matches(':focus-visible'), `${label}: the ring is drawn`).toBe(true);
          await expect(getComputedStyle(ring).outlineOffset, `${label}: drawn inside`).toBe('-2px');
          const after = await pixelsAt(from, ring.getBoundingClientRect(), at);
          const differs = after.some((pixel, point) =>
            pixel.some(
              (channel, index) => Math.abs(channel - before[point]![index]!) > RING_DIFFERENCE,
            ),
          );
          await expect(
            differs,
            `${label}: the ring is painted inside the edge (${JSON.stringify(before)} before, ${JSON.stringify(after)} after)`,
          ).toBe(true);
          focus.blur();
        }
      } finally {
        await session.send('Emulation.setEmulatedMedia', { features: [] });
      }
    }
  },
};

/**
 * The frame of `striped` and `minimal` is a named region that a keyboard reaches when the table is
 * wider than it, as the frame of `lined` is, and the padding that makes room for the rings does not
 * make a table that fits look wider than its room: that one is not a region.
 */
export const PaddedScrollRegion: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      {(['striped', 'minimal'] as const).map((variant) => (
        <div key={variant} data-case={variant} style={{ display: 'flow-root', width: 900 }}>
          <CaptionedWide width={320} variant={variant} />
        </div>
      ))}
      <div data-case="fits" style={{ display: 'flow-root', width: 900 }}>
        <Orders variant="striped" aria-label="Orders that fit" />
      </div>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    for (const variant of ['striped', 'minimal']) {
      const frame = canvasElement.querySelector<HTMLElement>(
        `[data-case="${variant}"] .flg-table-frame`,
      )!;
      await waitFor(() => expect(frame, variant).toHaveAttribute('role', 'region'));
      await expect(frame.tabIndex).toBe(0);
      await expect(canvas.getByRole('region', { name: `Recent orders, ${variant}` })).toBe(frame);
    }
    const fits = canvasElement.querySelector<HTMLElement>('[data-case="fits"] .flg-table-frame')!;
    await expect(fits.scrollWidth).toBeLessThanOrEqual(fits.clientWidth);
    await expect(fits).not.toHaveAttribute('role');
  },
};

/** How far outside the edge of a button the points are looked at, in CSS pixels. */
const OUTSIDE = [2.5, 3, 3.5] as const;

/** What differs between a ring that is drawn and one that is not: any channel by this much. */
const RING_SHOWN = 25;

/** The looks that have a padded frame, in both densities. */
const PADDED = [
  { variant: 'striped', size: 'md' },
  { variant: 'striped', size: 'sm' },
  { variant: 'minimal', size: 'md' },
  { variant: 'minimal', size: 'sm' },
] as const;

/** The modes a ring is looked for in: the default, more contrast and forced colours. */
const RING_MODES = [
  { label: 'default', feature: null },
  { label: 'prefers-contrast', feature: { name: 'prefers-contrast', value: 'more' } },
  { label: 'forced-colors', feature: { name: 'forced-colors', value: 'active' } },
] as const;

/**
 * The frame of `striped` and `minimal` has 6px of padding and the same margin out, so that its
 * scroll box does not clip a ring. In both densities the table sits where it would without the
 * padding (its left and top edges are those of the box it is in, and it is as wide), and the box of
 * a sort button, a button and a Checkbox of the last row, grown by 4px for the outline, is inside the
 * padding edge of the frame. Then the ring of the sort button is looked for in the painted pixels,
 * 3px outside its top and left sides, where a frame without the padding would cut it: by default, with
 * more contrast and in forced colours (the last two are emulated through the protocol, which only
 * Chromium has).
 */
export const FocusRingsInPaddedFrame: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 24, width: 760 }}>
      {PADDED.map(({ variant, size }) => (
        <div
          key={`${variant}-${size}`}
          data-case={`${variant}-${size}`}
          style={{ display: 'flow-root' }}
        >
          <Orders
            variant={variant}
            size={size}
            rows={ORDERS.slice(0, 2)}
            footer={false}
            selected=""
            hovered=""
            aria-label={`Orders, ${variant} ${size}`}
          />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { cdp, server } = await import('vitest/browser');
    const real = await realUserEvent();
    const session = server.browser === 'chromium' ? cdp() : null;
    for (const { variant, size } of PADDED) {
      const name = `${variant} ${size}`;
      const box = canvasElement.querySelector<HTMLElement>(`[data-case="${variant}-${size}"]`)!;
      const frame = box.querySelector<HTMLElement>('.flg-table-frame')!;
      const table = box.querySelector<HTMLElement>('table')!;
      const room = box.getBoundingClientRect();
      const at = table.getBoundingClientRect();
      await expect(at.left, `${name}: the table has not moved sideways`).toBeCloseTo(room.left, 1);
      await expect(at.top, `${name}: the table has not moved down`).toBeCloseTo(room.top, 1);
      await expect(at.width, `${name}: the table is as wide`).toBeCloseTo(room.width, 1);
      const outer = frame.getBoundingClientRect();
      await expect(room.left - outer.left, `${name}: 6px of frame beside it`).toBeCloseTo(6, 1);
      await expect(room.top - outer.top, `${name}: 6px of frame above it`).toBeCloseTo(6, 1);

      const lastRow = frame.querySelector<HTMLElement>('tbody tr:last-child')!;
      const sortButton = frame.querySelector<HTMLElement>('thead .flg-table-sort')!;
      const iconButton = lastRow.querySelector<HTMLElement>('.flg-button')!;
      const checkBox = lastRow.querySelector<HTMLElement>('.flg-checkbox-box')!;
      // The padding edge of the frame: inside its border, of which it has none.
      const edge = {
        left: outer.left + frame.clientLeft,
        top: outer.top + frame.clientTop,
        right: outer.left + frame.clientLeft + frame.clientWidth,
        bottom: outer.top + frame.clientTop + frame.clientHeight,
      };
      for (const [what, ring] of [
        ['sort button', sortButton],
        ['icon button', iconButton],
        ['checkbox', checkBox],
      ] as const) {
        const r = ring.getBoundingClientRect();
        const label = `${name}, ${what}: the ring is inside the padding edge`;
        await expect(r.left - 4, label).toBeGreaterThanOrEqual(edge.left);
        await expect(r.top - 4, label).toBeGreaterThanOrEqual(edge.top);
        await expect(r.right + 4, label).toBeLessThanOrEqual(edge.right);
        await expect(r.bottom + 4, label).toBeLessThanOrEqual(edge.bottom);
      }

      if (!real) continue;
      for (const mode of RING_MODES) {
        if (mode.feature && !session) continue;
        await session?.send('Emulation.setEmulatedMedia', {
          features: mode.feature ? [mode.feature] : [],
        });
        try {
          if (mode.feature) {
            const { name: feature, value } = mode.feature;
            await waitFor(() => expect(matchMedia(`(${feature}: ${value})`).matches).toBe(true));
          }
          // Three points across the outline (2px wide, 2px away) on each side: a screenshot starts
          // at a whole device pixel and the frame may not.
          const look = () => {
            const button = sortButton.getBoundingClientRect();
            const x = button.x - outer.x;
            const y = button.y - outer.y;
            return OUTSIDE.flatMap((depth) => [
              [x + button.width / 2, y - depth],
              [x - depth, y + button.height / 2],
            ]) as Array<[number, number]>;
          };
          (document.activeElement as HTMLElement | null)?.blur();
          const before = await paintedPixels(frame, look());
          if (!before) continue;
          sortButton.focus({ focusVisible: true });
          await expect(sortButton.matches(':focus-visible'), `${name}: focus is visible`).toBe(
            true,
          );
          const after = (await paintedPixels(frame, look()))!;
          for (const [side, label] of [
            [0, 'above'],
            [1, 'beside'],
          ] as const) {
            const moved = [0, 2, 4].some((step) =>
              after[side + step]!.some(
                (channel, index) => Math.abs(channel - before[side + step]![index]!) > RING_SHOWN,
              ),
            );
            await expect(
              moved,
              `${name}, ${mode.label}: the ring shows ${label} the button (${JSON.stringify(before)} to ${JSON.stringify(after)})`,
            ).toBe(true);
          }
          sortButton.blur();
        } finally {
          await session?.send('Emulation.setEmulatedMedia', { features: [] });
        }
      }
    }
  },
};

/**
 * A Table of `striped` or `minimal` in a Card in a column 375px wide, a phone: its frame is 6px
 * wider than the Card's content on each side, inside the Card's own padding, so nothing scrolls
 * sideways, and the Table, wider than the room, scrolls in its frame.
 */
export const PaddedFrameInACard: Story = {
  tags: ['no-visual'],
  render: () => (
    <div
      data-column
      style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12, width: 375 }}
    >
      {(['striped', 'minimal'] as const).map((variant) => (
        <Card key={variant}>
          <CardTitle id={`title-${variant}`}>Recent orders, {variant}</CardTitle>
          <Orders variant={variant} aria-labelledby={`title-${variant}`} />
        </Card>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector<HTMLElement>('[data-column]')!;
    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
    for (const card of column.querySelectorAll<HTMLElement>('.flg-card')) {
      const frame = card.querySelector<HTMLElement>('.flg-table-frame')!;
      await waitFor(() => expect(frame).toHaveAttribute('role', 'region'));
      const inner = card.getBoundingClientRect();
      const outer = frame.getBoundingClientRect();
      await expect(outer.left).toBeGreaterThanOrEqual(inner.left);
      await expect(outer.right).toBeLessThanOrEqual(inner.right);
      await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    }
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};

/** How far apart two painted pixels may be and still be one colour, in a channel. */
const SAME = 8;

/**
 * The chosen row of `striped` is painted once, on the row, and rounded with `clip-path` on the row
 * (spec phase 4 §10: each engine is asked). From the painted pixels: the pixel one step inside the
 * corner of the row is the card's and not the band's (the row is cut with rounded ends); the band is
 * painted at the middle of its left end; and it is one colour across the boundary of two cells,
 * where a wash on each cell would show a seam.
 */
export const StripedSelectedRow: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 760 }}>
      <Card>
        <Orders variant="striped" selected="DH-1041" hovered="" aria-label="Orders" />
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('.flg-table-frame')!;
    const row = frame.querySelector<HTMLElement>('tr[data-selected]')!;
    await expect(getComputedStyle(row).clipPath).not.toBe('none');
    const cells = Array.from(row.querySelectorAll<HTMLElement>('td'));
    const origin = frame.getBoundingClientRect();
    const box = row.getBoundingClientRect();
    const x = box.left - origin.left;
    const y = box.top - origin.top;
    // The boundary of the second and the third cell, near the top of the row, away from any text.
    const seam = cells[2]!.getBoundingClientRect().left - origin.left;
    const pixels = await paintedPixels(frame, [
      [x + 1, y + 1],
      [x - 4, y + 1],
      [x + 2, y + box.height / 2],
      [seam - 3, y + 2],
      [seam - 0.5, y + 2],
      [seam + 0.5, y + 2],
      [seam + 3, y + 2],
    ]);
    if (!pixels) return;
    const [corner, outside, band, ...across] = pixels as [Rgb, Rgb, Rgb, Rgb, Rgb, Rgb, Rgb];
    const apart = (a: Rgb, b: Rgb) =>
      Math.max(...a.map((channel, index) => Math.abs(channel - b[index]!)));
    const seen = JSON.stringify({ corner, outside, band, across });
    await expect(apart(band, outside), `the band is painted: ${seen}`).toBeGreaterThan(2);
    await expect(apart(corner, outside), `the corner is cut: ${seen}`).toBeLessThanOrEqual(SAME);
    await expect(apart(corner, band), `the corner is not the band: ${seen}`).toBeGreaterThan(
      apart(corner, outside),
    );
    for (const pixel of across) {
      await expect(apart(pixel, band), `one colour across a boundary: ${seen}`).toBeLessThanOrEqual(
        SAME,
      );
    }
  },
};

/** The part of a ring beyond a row is faint (3 to 13 in the channel that moves most); a cut leaves nothing. */
const PART_OF_RING = 1;

/**
 * The chosen row of `striped` is cut with `clip-path`, and a ring drawn by a control in it reaches
 * beyond the row in `sm`, where a row is hardly taller than a button: the cut must not take that
 * part of the ring. The icon button of the chosen row is given the focus, and a point at the top edge
 * of the row, where its 2px outline is half outside, is read before and after.
 */
export const StripedSelectedRowFocus: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 760 }}>
      <Card>
        <Orders
          variant="striped"
          size="sm"
          rows={ORDERS.slice(0, 3)}
          footer={false}
          selected="DH-1041"
          hovered=""
          aria-label="Orders"
        />
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const frame = canvasElement.querySelector<HTMLElement>('.flg-table-frame')!;
    const row = frame.querySelector<HTMLElement>('tr[data-selected]')!;
    const button = row.querySelector<HTMLElement>('.flg-button')!;
    const origin = frame.getBoundingClientRect();
    const look = () => {
      const edge = row.getBoundingClientRect();
      const box = button.getBoundingClientRect();
      return [
        [box.x - origin.x + box.width / 2, edge.top - origin.y - 0.5],
        [box.x - origin.x + box.width / 2, edge.bottom - origin.y + 0.5],
      ] as Array<[number, number]>;
    };
    const before = await paintedPixels(frame, look());
    if (!before) return;
    button.focus({ focusVisible: true });
    await expect(button.matches(':focus-visible')).toBe(true);
    const after = (await paintedPixels(frame, look()))!;
    for (const [side, label] of [
      [0, 'top'],
      [1, 'bottom'],
    ] as const) {
      const moved = after[side]!.some(
        (channel, index) => Math.abs(channel - before[side]![index]!) > PART_OF_RING,
      );
      await expect(
        moved,
        `the ring is painted beyond the ${label} edge of the chosen row (${JSON.stringify(before[side])} to ${JSON.stringify(after[side])})`,
      ).toBe(true);
    }
  },
};

/**
 * The preferences of `striped`, read from computed styles (Chromium emulates the two through the
 * protocol): with more contrast it has no stripes and a rule of 1px on the top of each row but the
 * first, and a chosen row is not cut; in forced colours the edge of the footer row is a border of
 * 1px on every cell, since the inner shadows that make it are dropped.
 */
export const StripedPreferences: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 760 }}>
      <Orders variant="striped" selected="DH-1041" hovered="" aria-label="Orders" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { cdp, server } = await import('vitest/browser');
    if (server.browser !== 'chromium') return;
    const session = cdp();
    const cell = (selector: string) =>
      getComputedStyle(canvasElement.querySelector<HTMLElement>(selector)!);
    // The first body row is odd, so it has a stripe; the second is the chosen one; the third is odd.
    const stripe = 'tbody tr:nth-child(1) td:nth-child(2)';
    const rule = 'tbody tr:nth-child(3) td:nth-child(2)';
    const first = 'tbody tr:nth-child(1) td:nth-child(2)';
    const footer = 'tfoot tr td:nth-child(2)';
    await expect(cell(stripe).backgroundColor, 'default: a stripe').not.toBe('rgba(0, 0, 0, 0)');
    await expect(cell(rule).boxShadow, 'default: no rule').toBe('none');
    await expect(
      getComputedStyle(canvasElement.querySelector('tr[data-selected]')!).clipPath,
    ).not.toBe('none');
    try {
      await session.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-contrast', value: 'more' }],
      });
      await waitFor(() => expect(matchMedia('(prefers-contrast: more)').matches).toBe(true));
      await expect(cell(stripe).backgroundColor, 'more contrast: no stripe').toBe(
        'rgba(0, 0, 0, 0)',
      );
      await expect(cell(rule).boxShadow, 'more contrast: a rule on the top').toContain('inset');
      await expect(cell(first).boxShadow, 'more contrast: none above the first').toBe('none');
      await expect(
        getComputedStyle(canvasElement.querySelector('tr[data-selected]')!).clipPath,
        'more contrast: the chosen row is not cut',
      ).toBe('none');
      await session.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'forced-colors', value: 'active' }],
      });
      await waitFor(() => expect(matchMedia('(forced-colors: active)').matches).toBe(true));
      await expect(cell(rule).boxShadow, 'forced colours: no shadow').toBe('none');
      await expect(cell(footer).borderTopWidth, 'forced colours: the footer has an edge').toBe(
        '1px',
      );
      await expect(cell(footer).borderBottomWidth).toBe('1px');
    } finally {
      await session.send('Emulation.setEmulatedMedia', { features: [] });
    }
  },
};
