import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { FillFrames, checkFillFrames } from '../../../.storybook/fill-frames';
import { paintedPixels } from '../../../.storybook/painted-pixel';
import { realUserEvent } from '../../../.storybook/real-input';
import { strokeIcon } from '../../internal/icons';
import type { BadgeProps } from '../badge/Badge';
import { Badge } from '../badge/Badge';
import { Card, CardTitle } from '../card/Card';
import { Checkbox } from '../checkbox/Checkbox';
import { IconButton } from '../icon-button/IconButton';
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
  ...props
}: OrdersProps) {
  return (
    <Table {...props}>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Checkbox aria-label="Select all" indeterminate />
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

/** Twelve rows in a frame that is 180px tall: the heading stays at the top while the rows scroll. */
const MANY_ROWS = Array.from({ length: 12 }, (_, index) => ({
  ...ORDERS[index % ORDERS.length]!,
  id: `DH-${1042 - index}`,
}));

/**
 * `stickyHeader` keeps the column headings at the top of the frame, over the rows that scroll under
 * them: the heading of the scrolled table is at the frame's top edge, and the rows do not show
 * through it, so a press at the middle of a heading is a press of the heading. The look is that of the
 * heading over rows, which is a little more opaque than the glass of the card.
 */
export const StickyHeader: Story = {
  render: () => (
    <Card style={{ width: 760 }}>
      <Orders
        variant="lined"
        rows={MANY_ROWS}
        footer={false}
        selected=""
        hovered=""
        stickyHeader
        style={{ maxHeight: 180 }}
        aria-label="Recent orders"
      />
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('.flg-table-frame')!;
    frame.scrollTop = 90;
    await waitFor(() => expect(frame.scrollTop).toBeGreaterThan(60));
    const heading = frame.querySelector<HTMLElement>('thead th:nth-child(2)')!;
    const outer = frame.getBoundingClientRect();
    const box = heading.getBoundingClientRect();
    // At the top edge of what the frame shows, inside its border.
    await expect(Math.abs(box.top - (outer.top + frame.clientTop))).toBeLessThanOrEqual(0.5);
    // Nothing of a row is above it.
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    await expect(heading.contains(hit)).toBe(true);
  },
};

/** A table wider than the frame it is given, named by its caption. */
function CaptionedWide({ width }: { width: number }) {
  return (
    <div style={{ width: 900 }}>
      <Table style={{ width }}>
        <TableCaption>Recent orders</TableCaption>
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
 * colour. Three, since a screenshot starts at a whole device pixel and the frame may not. The
 * preferences are emulated through the protocol, which only Chromium has.
 */
export const FocusRingsInsideLinedFrame: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 760 }}>
      <Orders
        variant="lined"
        size="sm"
        rows={ORDERS.slice(0, 2)}
        footer={false}
        selected=""
        hovered=""
        aria-label="Orders"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { cdp, server } = await import('vitest/browser');
    if (server.browser !== 'chromium') return;
    const real = await realUserEvent();
    if (!real) return;
    const session = cdp();
    const frame = canvasElement.querySelector<HTMLElement>('.flg-table-frame')!;
    const lastRow = frame.querySelector<HTMLElement>('tbody tr:last-child')!;
    // The control that takes the focus, the element that draws its ring, and where the ring is: the
    // side of the ring's element that is nearest the edge of the frame.
    const sortButton = frame.querySelector<HTMLElement>('thead .flg-table-sort')!;
    const iconButton = lastRow.querySelector<HTMLElement>('.flg-button')!;
    const checkbox = lastRow.querySelector<HTMLElement>('.flg-checkbox')!;
    const targets: Array<{
      name: string;
      focus: HTMLElement;
      ring: HTMLElement;
      at: (box: DOMRect) => Array<[number, number]>;
    }> = [
      {
        name: 'sort button',
        focus: sortButton,
        ring: sortButton,
        at: (box) => ACROSS.map((depth) => [box.x + box.width / 2, box.y + depth]),
      },
      {
        name: 'icon button',
        focus: iconButton,
        ring: iconButton,
        at: (box) => ACROSS.map((depth) => [box.x + box.width / 2, box.bottom - depth]),
      },
      {
        name: 'checkbox',
        focus: checkbox.querySelector<HTMLElement>('input')!,
        ring: checkbox.querySelector<HTMLElement>('.flg-checkbox-box')!,
        at: (box) => ACROSS.map((depth) => [box.x + depth, box.y + box.height / 2]),
      },
    ];
    const outer = () => frame.getBoundingClientRect();
    const pixelsAt = async (box: DOMRect, at: (box: DOMRect) => Array<[number, number]>) =>
      (await paintedPixels(
        frame,
        at(box).map(([x, y]) => [x - outer().x, y - outer().y] as const),
      ))!;
    for (const feature of [
      { name: 'prefers-contrast', value: 'more' },
      { name: 'forced-colors', value: 'active' },
    ]) {
      await session.send('Emulation.setEmulatedMedia', { features: [feature] });
      try {
        await waitFor(() =>
          expect(matchMedia(`(${feature.name}: ${feature.value})`).matches).toBe(true),
        );
        for (const { name, focus, ring, at } of targets) {
          const label = `${feature.name}, ${name}`;
          await real.keyboard('{Escape}');
          (document.activeElement as HTMLElement | null)?.blur();
          const before = await pixelsAt(ring.getBoundingClientRect(), at);
          // The ring is drawn for a focus given by script after a key press (Chromium, WebKit).
          focus.focus({ focusVisible: true });
          await expect(focus, `${label}: it has the focus`).toHaveFocus();
          await expect(focus.matches(':focus-visible'), `${label}: the ring is drawn`).toBe(true);
          await expect(getComputedStyle(ring).outlineOffset, `${label}: drawn inside`).toBe('-2px');
          const after = await pixelsAt(ring.getBoundingClientRect(), at);
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
