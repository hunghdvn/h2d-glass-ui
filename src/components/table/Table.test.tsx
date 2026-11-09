import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Checkbox } from '../checkbox/Checkbox';
import { Table, TableCaption } from './Table';
import type { TableProps } from './Table';
import { TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table-parts';

beforeEach(() => {
  resetDevWarnings();
  vi.restoreAllMocks();
});
afterEach(() => vi.unstubAllGlobals());

const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
const ARROW_UP = 'M12 19V5';
const ARROW_DOWN = 'M12 5v14';
const CHEVRONS = 'm7 15 5 5 5-5';
const pathsOf = (element: Element) =>
  Array.from(element.querySelectorAll('path')).map((path) => path.getAttribute('d'));

/** The orders table of the mockup, a few columns of it. */
function Orders(props: Partial<TableProps>) {
  return (
    <Table {...props}>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead align="end">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>DH-1042</TableCell>
          <TableCell align="end">1.250.000</TableCell>
        </TableRow>
        <TableRow selected>
          <TableCell>DH-1041</TableCell>
          <TableCell align="end">890.000</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell align="center">2.140.000</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

/** One header row of columns, for the tests of sorting. */
function Columns({ children }: { children: ReactNode }) {
  return (
    <Table aria-label="x">
      <TableHeader>
        <TableRow>{children}</TableRow>
      </TableHeader>
    </Table>
  );
}

/**
 * Stands in for ResizeObserver, which jsdom lacks, and for the layout it has none of: the frame
 * is `room` wide and the table needs `need`. `resize()` reports a change the way a browser would.
 */
function fakeLayout(initial: { room: number; need: number }) {
  const sizes = { ...initial };
  const observers: Array<{ callback: ResizeObserverCallback }> = [];
  class FakeResizeObserver {
    constructor(readonly callback: ResizeObserverCallback) {
      observers.push(this);
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  const ofFrame = (value: () => number) =>
    function (this: HTMLElement) {
      return this.classList.contains('flg-table-frame') ? value() : 0;
    };
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
    ofFrame(() => sizes.room),
  );
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(
    ofFrame(() => Math.max(sizes.room, sizes.need)),
  );
  return {
    resize(patch: Partial<typeof sizes>) {
      Object.assign(sizes, patch);
      act(() => {
        for (const observer of observers) observer.callback([], {} as ResizeObserver);
      });
    },
  };
}

describe('Table', () => {
  it('renders a scroll frame holding a table, lined and md by default', () => {
    const { container } = render(<Orders />);
    const frame = container.firstElementChild!;
    expect(frame.tagName).toBe('DIV');
    expect(frame).toHaveClass('flg-table-frame');
    expect(frame).toHaveAttribute('data-variant', 'lined');
    expect(frame).toHaveAttribute('data-size', 'md');
    expect(frame).not.toHaveAttribute('data-sticky-header');
    expect(frame.firstElementChild).toBe(screen.getByRole('table'));
    expect(screen.getByRole('table')).toHaveClass('flg-table');
  });

  it.each(['lined', 'striped', 'minimal'] as const)('reflects variant %s', (variant) => {
    const { container } = render(<Orders variant={variant} size="sm" stickyHeader />);
    const frame = container.firstElementChild!;
    expect(frame).toHaveAttribute('data-variant', variant);
    expect(frame).toHaveAttribute('data-size', 'sm');
    expect(frame).toHaveAttribute('data-sticky-header', '');
  });

  it('forwards the ref to the <table>, puts className and style on the frame and the rest on the table', () => {
    const ref = createRef<HTMLTableElement>();
    const { container } = render(
      <Table ref={ref} className="mine" style={{ maxHeight: 120 }} id="orders" data-x="1" />,
    );
    const frame = container.firstElementChild!;
    expect(ref.current).toBe(screen.getByRole('table'));
    expect(frame).toHaveClass('flg-table-frame', 'mine');
    expect(frame).toHaveStyle({ maxHeight: '120px' });
    expect(frame).not.toHaveAttribute('id');
    expect(ref.current).toHaveAttribute('id', 'orders');
    expect(ref.current).toHaveAttribute('data-x', '1');
    expect(ref.current).not.toHaveClass('mine');
  });

  it('puts hidden, dir and lang on the frame, the visible box, and not on the table', () => {
    const { container } = render(
      <Table hidden dir="rtl" lang="ar" aria-label="Orders" data-testid="orders" />,
    );
    const frame = container.firstElementChild!;
    const table = screen.getByRole('table', { hidden: true });
    expect(frame).toHaveAttribute('hidden');
    expect(frame).toHaveAttribute('dir', 'rtl');
    expect(frame).toHaveAttribute('lang', 'ar');
    for (const name of ['hidden', 'dir', 'lang']) expect(table).not.toHaveAttribute(name);
    // Everything else stays on the table.
    expect(table).toHaveAttribute('aria-label', 'Orders');
    expect(table).toHaveAttribute('data-testid', 'orders');
    expect(frame).not.toHaveAttribute('data-testid');
  });

  it('sets none of them when none is given', () => {
    const { container } = render(<Table />);
    const frame = container.firstElementChild!;
    for (const name of ['hidden', 'dir', 'lang']) expect(frame).not.toHaveAttribute(name);
  });

  it('does not give a callback ref null and the table again when it renders again', () => {
    const ref = vi.fn();
    const { rerender } = render(<Table ref={ref} />);
    rerender(<Table ref={ref} data-x="1" />);
    rerender(<Table ref={ref} data-x="2" />);
    expect(ref).toHaveBeenCalledTimes(1);
    expect(ref).toHaveBeenCalledWith(screen.getByRole('table'));
  });

  it('gives each part its class and a selected row its mark', () => {
    const { container } = render(<Orders />);
    expect(container.querySelector('thead')).toHaveClass('flg-table-header');
    expect(container.querySelector('tbody')).toHaveClass('flg-table-body');
    expect(container.querySelector('tfoot')).toHaveClass('flg-table-footer');
    expect(container.querySelectorAll('tr.flg-table-row')).toHaveLength(4);
    expect(screen.getByRole('columnheader', { name: 'Order' })).toHaveClass('flg-table-head');
    expect(screen.getAllByRole('cell')[0]).toHaveClass('flg-table-cell');
    const rows = container.querySelectorAll('tbody tr');
    expect(rows[0]).not.toHaveAttribute('data-selected');
    expect(rows[1]).toHaveAttribute('data-selected', '');
  });

  it('puts the alignment on header and body cells, and nothing when there is none', () => {
    render(<Orders />);
    expect(screen.getByRole('columnheader', { name: 'Total' })).toHaveAttribute(
      'data-align',
      'end',
    );
    expect(screen.getByRole('columnheader', { name: 'Order' })).not.toHaveAttribute('data-align');
    expect(screen.getByRole('cell', { name: '1.250.000' })).toHaveAttribute('data-align', 'end');
    expect(screen.getByRole('cell', { name: '2.140.000' })).toHaveAttribute('data-align', 'center');
    expect(screen.getByRole('cell', { name: 'DH-1042' })).not.toHaveAttribute('data-align');
  });

  it('sets no scope unless it is given: the browser decides from where the cell sits', () => {
    render(
      <Table aria-label="x">
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead>DH-1042</TableHead>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableFooter>
      </Table>,
    );
    for (const cell of document.querySelectorAll('th')) expect(cell).not.toHaveAttribute('scope');
  });

  it('lets a header cell take another scope, such as a row header', () => {
    render(
      <Table aria-label="x">
        <TableBody>
          <TableRow>
            <TableHead scope="row">DH-1042</TableHead>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('rowheader', { name: 'DH-1042' })).toHaveAttribute('scope', 'row');
  });

  it('forwards the ref and the props of every part to its own element', () => {
    const refs = {
      header: createRef<HTMLTableSectionElement>(),
      body: createRef<HTMLTableSectionElement>(),
      footer: createRef<HTMLTableSectionElement>(),
      row: createRef<HTMLTableRowElement>(),
      head: createRef<HTMLTableCellElement>(),
      cell: createRef<HTMLTableCellElement>(),
      caption: createRef<HTMLTableCaptionElement>(),
    };
    render(
      <Table>
        <TableCaption ref={refs.caption} className="c">
          Orders
        </TableCaption>
        <TableHeader ref={refs.header} className="h">
          <TableRow ref={refs.row} className="r" data-testid="row">
            <TableHead ref={refs.head} className="th" colSpan={2}>
              Order
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody ref={refs.body}>
          <TableRow>
            <TableCell ref={refs.cell} className="td" colSpan={2}>
              x
            </TableCell>
          </TableRow>
        </TableBody>
        <TableFooter ref={refs.footer} />
      </Table>,
    );
    expect(refs.header.current?.tagName).toBe('THEAD');
    expect(refs.body.current?.tagName).toBe('TBODY');
    expect(refs.footer.current?.tagName).toBe('TFOOT');
    expect(refs.row.current).toBe(screen.getByTestId('row'));
    expect(refs.row.current).toHaveClass('flg-table-row', 'r');
    expect(refs.head.current).toHaveClass('flg-table-head', 'th');
    expect(refs.head.current).toHaveAttribute('colspan', '2');
    expect(refs.cell.current).toHaveClass('flg-table-cell', 'td');
    expect(refs.caption.current).toHaveClass('flg-table-caption', 'c');
    expect(refs.header.current).toHaveClass('flg-table-header', 'h');
  });
});

describe('sorting', () => {
  it('sets aria-sort only on the column that is sorted', () => {
    render(
      <Columns>
        <TableHead sort="ascending">A</TableHead>
        <TableHead sort="descending">D</TableHead>
        <TableHead sort="none" onSort={() => {}}>
          N
        </TableHead>
        <TableHead onSort={() => {}}>U</TableHead>
      </Columns>,
    );
    const head = (name: string) => screen.getByRole('columnheader', { name });
    expect(head('A')).toHaveAttribute('aria-sort', 'ascending');
    expect(head('D')).toHaveAttribute('aria-sort', 'descending');
    expect(head('N')).not.toHaveAttribute('aria-sort');
    expect(head('U')).not.toHaveAttribute('aria-sort');
  });

  it('draws the arrow of the direction, and the two chevrons while it is not sorted', () => {
    render(
      <Columns>
        <TableHead sort="ascending" onSort={() => {}}>
          A
        </TableHead>
        <TableHead sort="descending" onSort={() => {}}>
          D
        </TableHead>
        <TableHead sort="none" onSort={() => {}}>
          N
        </TableHead>
        <TableHead onSort={() => {}}>U</TableHead>
      </Columns>,
    );
    const icon = (name: string) =>
      screen.getByRole('columnheader', { name }).querySelector('.flg-table-sort-icon')!;
    expect(pathsOf(icon('A'))).toEqual([ARROW_UP, 'm5 12 7-7 7 7']);
    expect(pathsOf(icon('D'))).toEqual([ARROW_DOWN, 'm19 12-7 7-7-7']);
    expect(pathsOf(icon('N'))).toEqual([CHEVRONS, 'm7 9 5-5 5 5']);
    expect(pathsOf(icon('U'))).toEqual([CHEVRONS, 'm7 9 5-5 5 5']);
    expect(icon('A')).toHaveAttribute('aria-hidden', 'true');
    expect(icon('A').querySelector('svg')).toHaveAttribute('width', '14');
  });

  it('wraps the title in a button only when there is an onSort, and the name is the title', () => {
    render(
      <Columns>
        <TableHead>Plain</TableHead>
        <TableHead onSort={() => {}}>Sortable</TableHead>
      </Columns>,
    );
    expect(screen.getAllByRole('button')).toHaveLength(1);
    const button = screen.getByRole('button', { name: 'Sortable' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('flg-table-sort');
    expect(screen.getByRole('columnheader', { name: 'Plain' }).querySelector('svg')).toBeNull();
  });

  it.each([
    ['ascending', 'descending'],
    ['descending', 'ascending'],
    ['none', 'ascending'],
    [undefined, 'ascending'],
  ] as const)('with sort %s, a press calls onSort with %s', async (sort, next) => {
    const onSort = vi.fn();
    render(
      <Columns>
        <TableHead sort={sort} onSort={onSort}>
          Total
        </TableHead>
      </Columns>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Total' }));
    expect(onSort).toHaveBeenCalledTimes(1);
    expect(onSort).toHaveBeenCalledWith(next);
  });

  it('keeps aria-sort and the icon of a sort without onSort, with no button', () => {
    render(
      <Columns>
        <TableHead sort="descending">Date</TableHead>
      </Columns>,
    );
    const head = screen.getByRole('columnheader', { name: 'Date' });
    expect(head).toHaveAttribute('aria-sort', 'descending');
    expect(screen.queryByRole('button')).toBeNull();
    expect(pathsOf(head)).toEqual([ARROW_DOWN, 'm19 12-7 7-7-7']);
  });

  it('renders the plain title for sort="none" without onSort: no chevrons, no span, no aria-sort', () => {
    render(
      <Columns>
        <TableHead sort="none">Date</TableHead>
      </Columns>,
    );
    const head = screen.getByRole('columnheader', { name: 'Date' });
    expect(head).not.toHaveAttribute('aria-sort');
    expect(head.querySelector('svg')).toBeNull();
    expect(head.querySelector('.flg-table-sort-static, .flg-table-sort-icon')).toBeNull();
    expect(head.innerHTML).toBe('Date');
  });
});

describe('the scroll frame', () => {
  it('has no role, tabindex or name while the table fits, nor in the HTML from a server', () => {
    fakeLayout({ room: 400, need: 300 });
    const { container } = render(<Orders aria-label="Orders" />);
    const frame = container.firstElementChild!;
    for (const name of ['role', 'tabindex', 'aria-label', 'aria-labelledby']) {
      expect(frame).not.toHaveAttribute(name);
    }
    // Wider than the room, but a server has no layout to say so.
    fakeLayout({ room: 200, need: 600 });
    expect(renderToString(<Orders aria-label="Orders" />)).not.toMatch(/role=|tabindex=/);
  });

  it('becomes a named region a keyboard can reach when the table is wider, and drops it when it fits', () => {
    const layout = fakeLayout({ room: 200, need: 600 });
    const { container } = render(<Orders aria-label="Orders" />);
    const frame = container.firstElementChild!;
    expect(frame).toHaveAttribute('role', 'region');
    expect(frame).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('region', { name: 'Orders' })).toBe(frame);
    layout.resize({ room: 800 });
    for (const name of ['role', 'tabindex', 'aria-label']) expect(frame).not.toHaveAttribute(name);
    layout.resize({ room: 100 });
    expect(frame).toHaveAttribute('role', 'region');
  });

  it('keeps its role, tabindex and name while it has the focus, and drops them when it loses it', () => {
    const layout = fakeLayout({ room: 200, need: 600 });
    const { container } = render(
      <>
        <Orders aria-label="Orders" />
        <button type="button">after</button>
      </>,
    );
    const frame = container.firstElementChild as HTMLElement;
    act(() => frame.focus());
    expect(frame).toHaveFocus();
    // The table now fits, and the frame is the focused element: it must stay one.
    layout.resize({ room: 800 });
    expect(frame).toHaveFocus();
    expect(frame).toHaveAttribute('role', 'region');
    expect(frame).toHaveAttribute('tabindex', '0');
    expect(frame).toHaveAttribute('aria-label', 'Orders');
    act(() => screen.getByRole('button', { name: 'after' }).focus());
    for (const name of ['role', 'tabindex', 'aria-label']) expect(frame).not.toHaveAttribute(name);
  });

  it('keeps them when it loses the focus and the table is wider again', () => {
    const layout = fakeLayout({ room: 200, need: 600 });
    const { container } = render(<Orders aria-label="Orders" />);
    const frame = container.firstElementChild as HTMLElement;
    act(() => frame.focus());
    layout.resize({ room: 800 });
    layout.resize({ room: 100 });
    act(() => frame.blur());
    expect(frame).toHaveAttribute('role', 'region');
    expect(frame).toHaveAttribute('tabindex', '0');
  });

  it('is named by the caption, whose id the Table makes, and the caption wins over aria-label', () => {
    fakeLayout({ room: 200, need: 600 });
    const { container } = render(
      <Table aria-label="for the table only">
        <TableCaption>Recent orders</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const frame = container.firstElementChild!;
    const caption = screen.getByText('Recent orders');
    expect(caption.id).not.toBe('');
    expect(frame).toHaveAttribute('aria-labelledby', caption.id);
    expect(frame).not.toHaveAttribute('aria-label');
    expect(screen.getByRole('region', { name: 'Recent orders' })).toBe(frame);
    // The table keeps the name it was given.
    expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'for the table only');
  });

  it('takes the aria-labelledby given to the Table, which stays on the table as well', () => {
    fakeLayout({ room: 200, need: 600 });
    const { container } = render(
      <>
        <h2 id="orders-title">Recent orders</h2>
        <Orders aria-labelledby="orders-title" />
      </>,
    );
    expect(screen.getByRole('region', { name: 'Recent orders' })).toBe(
      container.querySelector('.flg-table-frame'),
    );
    expect(screen.getByRole('table')).toHaveAttribute('aria-labelledby', 'orders-title');
  });

  it('overrules an id forced on the caption: the frame points at the one the Table made', () => {
    fakeLayout({ room: 200, need: 600 });
    const { container } = render(
      <Table>
        {/* @ts-expect-error the type has no `id`; a caller that forces one is overruled */}
        <TableCaption id="mine">Orders</TableCaption>
      </Table>,
    );
    expect(screen.getByText('Orders').id).not.toBe('mine');
    expect(container.firstElementChild).toHaveAttribute(
      'aria-labelledby',
      screen.getByText('Orders').id,
    );
  });

  it('is not taken over by the caption of a table nested in a cell', () => {
    fakeLayout({ room: 200, need: 600 });
    const Nested = ({ shown }: { shown: boolean }) => (
      <Table>
        <TableCaption>Orders</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell>
              {shown && (
                <table>
                  <TableCaption>Details</TableCaption>
                  <tbody>
                    <tr>
                      <td>x</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const { container, rerender } = render(<Nested shown />);
    const frame = container.firstElementChild!;
    const outer = screen.getByText('Orders');
    // The nested caption gets no id from the outer Table: no duplicate id, no claim on the name.
    expect(outer.id).not.toBe('');
    expect(screen.getByText('Details')).not.toHaveAttribute('id');
    expect(frame).toHaveAttribute('aria-labelledby', outer.id);
    expect(container.querySelectorAll(`[id="${CSS.escape(outer.id)}"]`)).toHaveLength(1);
    // And when it goes, the outer name stays.
    rerender(<Nested shown={false} />);
    expect(frame).toHaveAttribute('aria-labelledby', outer.id);
    expect(screen.getByRole('region', { name: 'Orders' })).toBe(frame);
  });

  it('renders a caption outside a Table as a plain caption, without failing', () => {
    render(
      <table>
        <TableCaption>Alone</TableCaption>
      </table>,
    );
    expect(screen.getByText('Alone')).toHaveClass('flg-table-caption');
    expect(screen.getByText('Alone')).not.toHaveAttribute('id');
  });
});

describe('the height of a sticky heading', () => {
  const HEIGHT = '--flg-table-head-height';
  /** Makes every <thead> as tall as `height.value`, which jsdom has no layout to say. */
  const headingOf = (height: { value: number }) =>
    vi
      .spyOn(HTMLTableSectionElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() => ({ height: height.value }) as DOMRect);

  it('hands the measured height of the <thead> to the frame, and follows it when it changes', () => {
    const layout = fakeLayout({ room: 400, need: 300 });
    const height = { value: 45 };
    headingOf(height);
    const { container } = render(<Orders stickyHeader />);
    const frame = container.firstElementChild as HTMLElement;
    expect(frame.style.getPropertyValue(HEIGHT)).toBe('45px');
    height.value = 61.5;
    layout.resize({});
    expect(frame.style.getPropertyValue(HEIGHT)).toBe('61.5px');
  });

  it('keeps the property the caller put in style, and measures nothing without stickyHeader', () => {
    fakeLayout({ room: 400, need: 300 });
    const measure = headingOf({ value: 45 });
    const { container, rerender } = render(<Orders style={{ maxHeight: 180 }} />);
    const frame = container.firstElementChild as HTMLElement;
    expect(frame.style.getPropertyValue(HEIGHT)).toBe('');
    expect(measure).not.toHaveBeenCalled();
    rerender(<Orders style={{ maxHeight: 180 }} stickyHeader />);
    expect(frame.style.getPropertyValue(HEIGHT)).toBe('45px');
    expect(frame.style.maxHeight).toBe('180px');
    rerender(<Orders style={{ maxHeight: 180 }} />);
    expect(frame.style.getPropertyValue(HEIGHT)).toBe('');
  });
});

describe('the name warning', () => {
  it('warns once, in words with no changing value, when a scrollable table has no name', () => {
    const warn = spyWarn();
    const layout = fakeLayout({ room: 200, need: 600 });
    render(<Orders />);
    layout.resize({ room: 150 });
    layout.resize({ room: 120 });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toBe(
      '[h2d-glass-ui] <Table> needs a name: pass aria-label or aria-labelledby.',
    );
  });

  it('does not warn while the table fits', () => {
    const warn = spyWarn();
    fakeLayout({ room: 400, need: 300 });
    render(<Orders />);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    ['a caption', <TableCaption key="c">Orders</TableCaption>, {}],
    ['an aria-label', null, { 'aria-label': 'Orders' }],
    ['an aria-labelledby', null, { 'aria-labelledby': 'somewhere' }],
  ])('does not warn when it has %s', (_name, caption, props) => {
    const warn = spyWarn();
    fakeLayout({ room: 200, need: 600 });
    render(<Table {...props}>{caption}</Table>);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('a table built from the parts, as a Server Component would', () => {
  it('renders the parts to HTML with nothing but React, no hook and no context', () => {
    const html = renderToString(
      <table>
        <TableHeader>
          <TableRow>
            <TableHead>A</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow selected>
            <TableCell align="end">1</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter />
      </table>,
    );
    expect(html).toContain('<th class="flg-table-head">A</th>');
    expect(html).toContain('<tr class="flg-table-row" data-selected="">');
    expect(html).toContain('<td class="flg-table-cell" data-align="end">1</td>');
  });
});

describe('cells that hold a control', () => {
  it('lets a Checkbox sit alone in a cell, with its own name', () => {
    render(
      <Table aria-label="x">
        <TableBody>
          <TableRow>
            <TableCell>
              <Checkbox aria-label="Select DH-1042" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const cell = within(screen.getByRole('table')).getAllByRole('cell')[0]!;
    expect(cell.firstElementChild).toHaveClass('flg-checkbox');
    expect(within(cell).getByRole('checkbox', { name: 'Select DH-1042' })).toBeInTheDocument();
  });
});
