import { useId } from 'react';
import { Pagination } from '../../pagination/Pagination';
import { Select, SelectItem } from '../../select/Select';
import type { DataGridLabels } from '../types';

interface PagerProps {
  labels: DataGridLabels;
  /** The id of the grid's caption, when it has one: it is part of the name of the pages. */
  captionId: string | undefined;
  /** The page shown, counted from 0, and how many pages there are. */
  pageIndex: number;
  pageCount: number;
  /** How many rows a page holds, and how many rows there are in all. */
  size: number;
  total: number;
  /** The sizes the user may choose, ascending; none means no choice. */
  sizes: readonly number[];
  onPage: (index: number) => void;
  onSize: (size: number) => void;
}

/**
 * The bar under the grid: the count, the choice of how many rows a page holds, and the pages. The
 * parts are the library's own, so their look and their keys are theirs.
 */
export function Pager({
  labels,
  captionId,
  pageIndex,
  pageCount,
  size,
  total,
  sizes,
  onPage,
  onSize,
}: PagerProps) {
  const nameId = useId();
  const from = pageIndex * size + 1;
  const to = Math.min(total, from + size - 1);
  return (
    <div className="flg-data-grid-pager">
      <span className="flg-data-grid-page-info">{labels.pageInfo(from, to, total)}</span>
      {sizes.length > 0 ? (
        <Select
          size="sm"
          className="flg-data-grid-page-size"
          aria-label={labels.rowsPerPage}
          value={String(size)}
          onValueChange={(value) => onSize(Number(value))}
        >
          {sizes.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {labels.pageSize(option)}
            </SelectItem>
          ))}
        </Select>
      ) : null}
      {/* With a caption the name is the two read together ("Pagination Orders"), so two grids on a
          page have two landmarks that differ; without one it is `labels.pagination` alone. */}
      {captionId ? (
        <span id={nameId} hidden>
          {labels.pagination}
        </span>
      ) : null}
      <Pagination
        count={pageCount}
        page={pageIndex + 1}
        onPageChange={(page) => onPage(page - 1)}
        aria-label={captionId ? undefined : labels.pagination}
        aria-labelledby={captionId ? `${nameId} ${captionId}` : undefined}
        previousLabel={labels.previousPage}
        nextLabel={labels.nextPage}
        getPageLabel={labels.page}
      />
    </div>
  );
}
