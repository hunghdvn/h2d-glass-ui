// The orders of mockup G1 (spec phase 6 §4.1) and the grid and the play function the look stories of
// the DataGrid share: Plan B's look stories and the column stories of Plan C draw the same data. It is
// here, and not in a story file, so that two story files read one copy.
import type { StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Avatar } from '../src/components/avatar/Avatar';
import { Badge } from '../src/components/badge/Badge';
import { Card } from '../src/components/card/Card';
import { DataGrid } from '../src/components/data-grid/DataGrid';
import type {
  DataGridColumn,
  DataGridDensity,
  DataGridProps,
} from '../src/components/data-grid/index';
import { ROW_HEIGHT, rowPitch } from '../src/components/data-grid/row-heights';
import type { TableVariant } from '../src/components/table/Table';
import { realUserEvent } from './real-input';

/** The cell of a row and a column of the body, by their places in the DOM. */
export const bodyCell = (root: HTMLElement, row: number, column: number) =>
  root.querySelectorAll<HTMLElement>('tbody > tr')[row]!.children[column] as HTMLElement;

type Story = StoryObj;

/** No title is cut: a later part of a heading that takes room cannot cut one without a story failing. */
export const noTitleIsCut = async (root: HTMLElement) => {
  const titles = Array.from(root.querySelectorAll<HTMLElement>('.flg-data-grid-head-title'));
  await expect(titles.length).toBeGreaterThan(0);
  for (const title of titles)
    await expect(
      title.scrollWidth,
      `the title "${title.textContent}" is cut: ${title.scrollWidth} against ${title.clientWidth}`,
    ).toBeLessThanOrEqual(title.clientWidth);
};

export interface Sale {
  id: string;
  customer: string;
  assignee: string;
  date: string;
  status: 'processing' | 'delivered' | 'new';
  channel: 'Store' | 'Website' | 'Phone';
  qty: number;
  total: number;
}

function sale(
  id: string,
  customer: string,
  assignee: string,
  date: string,
  status: Sale['status'],
  channel: Sale['channel'],
  qty: number,
  total: number,
): Sale {
  return { id, customer, assignee, date, status, channel, qty, total };
}

export const ASSIGNEES: Record<string, string> = {
  'Võ Thị Lan': 'VL',
  'Lê Quang Huy': 'QH',
  'Nguyễn Minh Anh': 'MA',
};

// The mockup's page of twelve rows: three orders newer than the eight it shows, then the eight, then
// one more. The sort is the date, newest first, and then the total, smallest first.
export const PAGE_ONE: readonly Sale[] = [
  sale('DH-1035', 'Tạp hóa Hoa Mai', 'Võ Thị Lan', '2026-11-11', 'new', 'Website', 5, 4500000),
  sale(
    'DH-1034',
    'Nhà hàng Sen Vàng',
    'Lê Quang Huy',
    '2026-11-10',
    'delivered',
    'Store',
    9,
    2200000,
  ),
  sale(
    'DH-1033',
    'Công ty An Phát',
    'Nguyễn Minh Anh',
    '2026-11-10',
    'processing',
    'Phone',
    14,
    6800000,
  ),
  sale(
    'DH-1032',
    'Studio Ánh Dương',
    'Võ Thị Lan',
    '2026-11-09',
    'processing',
    'Store',
    8,
    7200000,
  ),
  sale(
    'DH-1031',
    'Đỗ Khánh Linh',
    'Lê Quang Huy',
    '2026-11-08',
    'delivered',
    'Website',
    4,
    3320000,
  ),
  sale(
    'DH-1030',
    'Công ty Thịnh Vượng',
    'Nguyễn Minh Anh',
    '2026-11-07',
    'new',
    'Phone',
    60,
    54000000,
  ),
  sale('DH-1029', 'Hoàng Đức Long', 'Võ Thị Lan', '2026-11-06', 'delivered', 'Store', 3, 2100000),
  sale(
    'DH-1028',
    'Cà phê Sương Sớm',
    'Lê Quang Huy',
    '2026-11-05',
    'processing',
    'Website',
    25,
    9750000,
  ),
  sale(
    'DH-1026',
    'Nhà sách Đông A',
    'Nguyễn Minh Anh',
    '2026-11-04',
    'delivered',
    'Store',
    40,
    32400000,
  ),
  sale('DH-1025', 'Trần Thu Hà', 'Lê Quang Huy', '2026-11-03', 'new', 'Phone', 2, 1250000),
  sale(
    'DH-1024',
    'Công ty Minh Phát',
    'Nguyễn Minh Anh',
    '2026-11-03',
    'processing',
    'Website',
    12,
    18600000,
  ),
  sale(
    'DH-1023',
    'Xưởng gỗ Tân Lập',
    'Võ Thị Lan',
    '2026-11-03',
    'delivered',
    'Store',
    30,
    25500000,
  ),
];

const REST_CUSTOMERS = [
  'Siêu thị Việt Hưng',
  'Quán Trà Chiều',
  'Công ty Hải Âu',
  'Cửa hàng Bình An',
];
const STATUSES = ['delivered', 'processing', 'new'] as const;
const CHANNELS = ['Store', 'Website', 'Phone'] as const;

/** 135 orders in all: the twelve of page one, and 123 older ones made from a formula. */
export const SALES: readonly Sale[] = [
  ...PAGE_ONE,
  ...Array.from({ length: 123 }, (_, index) => {
    const day = new Date(Date.UTC(2026, 10, 2 - Math.floor(index / 3)));
    return sale(
      `DH-${1022 - index}`,
      REST_CUSTOMERS[index % REST_CUSTOMERS.length]!,
      Object.keys(ASSIGNEES)[index % 3]!,
      day.toISOString().slice(0, 10),
      STATUSES[index % 3]!,
      CHANNELS[(index + 1) % 3]!,
      1 + ((index * 7) % 30),
      250000 + ((index * 987650) % 40000000),
    );
  }),
];

export const BADGES = {
  processing: { variant: 'warning', text: 'Processing' },
  delivered: { variant: 'success', text: 'Delivered' },
  new: { variant: 'accent', text: 'New' },
} as const;

export const SALE_COLUMNS: DataGridColumn<Sale>[] = [
  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
  { field: 'customer', caption: 'Customer', width: 248 },
  {
    field: 'assignee',
    caption: 'Assignee',
    width: 220,
    cell: ({ text }) => (
      <span
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, verticalAlign: 'middle' }}
      >
        <Avatar size="sm" alt="" fallback={ASSIGNEES[text]} />
        {text}
      </span>
    ),
  },
  { field: 'date', caption: 'Order date', dataType: 'date', width: 140 },
  {
    field: 'status',
    caption: 'Status',
    width: 160,
    cell: ({ value }) => <Badge variant={BADGES[value].variant}>{BADGES[value].text}</Badge>,
  },
  { field: 'channel', caption: 'Channel', width: 120 },
  // 88px: at 80 the title "Qty" is cut once the heading carries the resize line and the room of the
  // button of the column menu (measured in three engines). Total gives the 8px back, so the nine
  // columns still sum to 1292.
  { field: 'qty', caption: 'Qty', dataType: 'number', width: 88 },
  {
    field: 'total',
    caption: 'Total',
    dataType: 'number',
    format: { style: 'currency', currency: 'VND' },
    width: 172,
  },
];

/**
 * The first grid of mockup G1: a Card around it, the caption, a frame that shows the header and eight
 * rows, the column of boxes with two rows chosen, the sort (date, newest first, then the total), and
 * the pager. The frame is as wide as the nine columns, 1292px, as it is in the mockup (the card is 1332px with its edge and padding). The mockup draws a scroll without a scrollbar, so the look stories hide the frame's: a classic one would narrow the frame and make it scroll sideways.
 */
export const SalesGrid = ({
  variant,
  density,
  height,
  ...more
}: {
  variant: TableVariant;
  density?: DataGridDensity;
  height?: number;
} & Partial<DataGridProps<Sale>>) => (
  <div className="g1-look" style={{ width: 1332 }}>
    <style>{'.g1-look .flg-table-frame { scrollbar-width: none; }'}</style>
    <Card>
      <DataGrid
        data={SALES}
        rowKey="id"
        columns={SALE_COLUMNS}
        caption="Orders"
        description="135 orders · Lumen, November 2026"
        variant={variant}
        density={density}
        height={height}
        locale="vi-VN"
        selectionMode="multiple"
        defaultSort={[
          { field: 'date', direction: 'desc' },
          { field: 'total', direction: 'asc' },
        ]}
        defaultSelectedKeys={['DH-1028', 'DH-1025']}
        paging={{ pageSize: 12, pageSizes: [12, 24, 48] }}
        {...more}
      />
    </Card>
  </div>
);

/**
 * The state of G1: the keyboard focus on DH-1026 · Customer, the row of DH-1030 under the pointer (the
 * harness hovers what has `data-visual-hover`), and the frame scrolled to the rows 4 to 11 of the
 * page. With real input it is reached by keys: Tab into the grid, down to the eleventh row, which
 * scrolls the frame, then up and along. Without it (the visual harness, the Storybook page) the focus
 * and the scroll are set directly.
 */
export const lookPlay =
  (
    variant: TableVariant,
    density: DataGridDensity,
    /** What the harness hovers: the row of DH-1030, unless a story hovers something else (one pointer). */
    hovered: (root: HTMLElement, rows: HTMLElement[]) => HTMLElement = (_root, rows) => rows[5]!,
  ): NonNullable<Story['play']> =>
  async ({ canvasElement }) => {
    const table = canvasElement.querySelector('table')!;
    const frame = table.parentElement as HTMLElement;
    const rows = Array.from(table.querySelectorAll<HTMLElement>('tbody > tr'));
    await expect(rows).toHaveLength(12);
    const real = await realUserEvent();
    if (real) {
      await real.tab();
      // A toolbar with a button (the column chooser) takes the first Tab: the next one is the grid's.
      if (!table.contains(document.activeElement)) await real.tab();
      await real.keyboard('{ArrowDown}'.repeat(10));
      await real.keyboard('{ArrowUp}{ArrowUp}{ArrowRight}{ArrowRight}');
      await expect(bodyCell(canvasElement, 8, 2)).toHaveFocus();
      await expect(bodyCell(canvasElement, 8, 2).matches(':focus-visible')).toBe(true);
    } else {
      bodyCell(canvasElement, 8, 2).focus();
      frame.scrollTop = 3 * rowPitch(ROW_HEIGHT[density][variant], variant);
    }
    await expect(rows[8]).toHaveTextContent('DH-1026');
    await expect(bodyCell(canvasElement, 8, 2)).toHaveTextContent('Nhà sách Đông A');
    hovered(canvasElement, rows).setAttribute('data-visual-hover', '');
    await expect(rows[5]).toHaveTextContent('DH-1030');
    // The frame shows the header and the rows 4 to 11: the row above is under the header, the row
    // below the last is out of sight. A few pixels are allowed: a header is a pixel taller in some
    // engines, and the heights of the stories are those of the pinned Chromium of the baselines.
    const headBottom = table.tHead!.getBoundingClientRect().bottom;
    const frameBottom = frame.getBoundingClientRect().bottom;
    const visible = rows.filter((row) => {
      const box = row.getBoundingClientRect();
      return box.top >= headBottom - 3 && box.bottom <= frameBottom + 3;
    });
    await expect(visible).toEqual(rows.slice(3, 11));
    await noTitleIsCut(canvasElement);
  };
