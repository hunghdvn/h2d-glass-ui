import { Skeleton } from '../../skeleton/Skeleton';
import { useGridContext } from '../grid-context';
import { placeFiller } from './FillerCell';
import { pinAttributes } from './pin-attributes';

/**
 * The width of the block in the cells of a column, in percent: between 40 and 80, and only a function
 * of the index of the column among the caller's, so that nothing differs between the server and the
 * client or between two renders, and the blocks do not line up.
 */
export function skeletonWidth(index: number): number {
  return 40 + ((index * 17) % 41);
}

/**
 * The rows of a grid that loads and has nothing to show yet: as many as the page holds. They are
 * rows of Table's classes, so a variant stripes and rules them as it does the rows of data, and
 * they are as tall as a row of data. They hold nothing and are hidden from what reads the page, and
 * they are not rows of data: nothing in them is chosen or can have the keyboard.
 */
export function SkeletonRows() {
  const { columns, filler, fillerAt, pins, skeletonRows } = useGridContext();
  return Array.from({ length: skeletonRows }, (_, row) => {
    let dataIndex = 0;
    return (
      <tr key={row} className="flg-table-row flg-data-grid-skeleton-row" aria-hidden="true">
        {placeFiller(
          columns.map((column, index) => (
            <td
              key={column.id}
              className="flg-table-cell flg-data-grid-skeleton-cell"
              data-align={column.align}
              {...pinAttributes(pins[index])}
            >
              {column.service ? null : (
                <Skeleton shape="text" variant="pulse" width={`${skeletonWidth(dataIndex++)}%`} />
              )}
            </td>
          )),
          fillerAt,
          filler,
        )}
      </tr>
    );
  });
}
