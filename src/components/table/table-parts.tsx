import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { ArrowIcon, ChevronsUpDownIcon } from '../../internal/icons';

export type TableSort = 'ascending' | 'descending' | 'none';
export type TableAlign = 'start' | 'center' | 'end';

export type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;
export type TableBodyProps = TableHeaderProps;
export type TableFooterProps = TableHeaderProps;

export type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  /**
   * Draws the row as chosen. It is only a look: `aria-selected` is not allowed on the row of a
   * table, so the state is said by the Checkbox in the row, which has a name of its own.
   */
  selected?: boolean;
};

export type TableHeadProps = Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align'> & {
  align?: TableAlign;
  /**
   * How the column is sorted. `'ascending'` and `'descending'` set `aria-sort` and draw their
   * arrow; `'none'` draws the two chevrons of a column that can be sorted and sets nothing.
   */
  sort?: TableSort;
  /**
   * Makes the title a button. It is called with the direction the press asks for: `'descending'`
   * when the column is sorted ascending, and `'ascending'` otherwise. Sorting the rows is the
   * caller's work. A `sort` without `onSort` is only shown, for a table that came sorted.
   */
  onSort?: (next: 'ascending' | 'descending') => void;
};

export type TableCellProps = Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> & {
  align?: TableAlign;
};

// The parts of a table that need no hook are in this file and not in Table.tsx, so a Server
// Component can render a table without a client boundary for every cell.

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  function TableHeader({ className, ...props }, ref) {
    return <thead ref={ref} className={clsx('flg-table-header', className)} {...props} />;
  },
);

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(function TableBody(
  { className, ...props },
  ref,
) {
  return <tbody ref={ref} className={clsx('flg-table-body', className)} {...props} />;
});

export const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
  function TableFooter({ className, ...props }, ref) {
    return <tfoot ref={ref} className={clsx('flg-table-footer', className)} {...props} />;
  },
);

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { selected = false, className, ...props },
  ref,
) {
  return (
    <tr
      ref={ref}
      className={clsx('flg-table-row', className)}
      data-selected={dataAttr(selected)}
      {...props}
    />
  );
});

/** The icon of a column that can be sorted: the arrow of its direction, or the two chevrons. */
function SortIcon({ sort }: { sort: TableSort | undefined }) {
  const icon =
    sort === 'ascending' || sort === 'descending' ? (
      <ArrowIcon direction={sort === 'ascending' ? 'up' : 'down'} width={14} height={14} />
    ) : (
      <ChevronsUpDownIcon width={14} height={14} />
    );
  // The colour is set on the wrapper, not on the <svg>, which keeps a colour set on it in forced
  // colours and would stay the theme's grey on a canvas of the same lightness.
  return (
    <span className="flg-table-sort-icon" aria-hidden="true">
      {icon}
    </span>
  );
}

/**
 * A heading cell, a `<th>`. It sets no `scope` of its own, since it cannot know where it is used
 * (it is a server-safe part and does not read its section): the browser decides from where the cell
 * sits, so one in the header is a column heading, and one at the start of a body or footer row is
 * the heading of that row, such as an order number or "Total". Pass `scope` to say otherwise.
 * `aria-sort` goes only on the column that is sorted, as in the sortable table pattern, and the
 * title becomes a button when there is an `onSort`.
 */
export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(function TableHead(
  { align, sort, onSort, className, children, ...props },
  ref,
) {
  const sorted = sort === 'ascending' || sort === 'descending';
  let content: ReactNode = children;
  if (onSort) {
    content = (
      <button
        type="button"
        className="flg-table-sort"
        onClick={() => onSort(sort === 'ascending' ? 'descending' : 'ascending')}
      >
        {children}
        <SortIcon sort={sort} />
      </button>
    );
  } else if (sort !== undefined) {
    content = (
      <span className="flg-table-sort-static">
        {children}
        <SortIcon sort={sort} />
      </span>
    );
  }
  return (
    <th
      ref={ref}
      className={clsx('flg-table-head', className)}
      data-align={align}
      aria-sort={sorted ? sort : undefined}
      {...props}
    >
      {content}
    </th>
  );
});

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { align, className, ...props },
  ref,
) {
  return (
    <td ref={ref} className={clsx('flg-table-cell', className)} data-align={align} {...props} />
  );
});
