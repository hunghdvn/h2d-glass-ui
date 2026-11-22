import type { PinPlace } from '../engine/layout';
import { useGridContext } from '../grid-context';
import { pinAttributes } from './pin-attributes';

/**
 * A cell of an indent column in a row of the body or in the filter row: the room a level of the
 * grouping takes on the left. It holds nothing, is hidden from what reads the page, has no `tabindex`
 * and is no place of the keyboard (`isPlaceColumn`, `cellsOf`). It is a cell of Table's classes, so its
 * row's rule runs across it.
 */
export function IndentCell({ pin }: { pin: PinPlace | undefined }) {
  return (
    <td
      className="flg-table-cell flg-data-grid-indent"
      aria-hidden="true"
      {...pinAttributes(pin)}
    />
  );
}

/**
 * The one cell of the heading of a grid with details: it stands over the indent columns and the column of
 * the detail buttons (`colSpan` their number), and is the title of that column, a place of the keyboard
 * (it is no indent cell: `cellsOf` counts it). The words `labels.groupsAndDetails` are hidden in it, as in
 * `IndentHead`, which a table header with no name would fail an accessibility check without.
 */
export function DetailHead({
  span,
  isActive,
  pin,
}: {
  span: number;
  /** Whether this is the active cell, the one Tab stop of the grid. */
  isActive: boolean;
  pin: PinPlace | undefined;
}) {
  const { labels } = useGridContext();
  return (
    <th
      scope="col"
      colSpan={span}
      className="flg-table-head flg-data-grid-head"
      tabIndex={isActive ? 0 : -1}
      {...pinAttributes(pin)}
    >
      <span className="flg-visually-hidden">{labels.groupsAndDetails}</span>
    </th>
  );
}

/**
 * The one cell of the heading that stands over the indent columns (`colSpan` their number), with the
 * words `labels.groupsAndDetails` hidden in it: a table header with no name fails an accessibility
 * check, so it is not `aria-hidden`. It is no place of the keyboard.
 */
export function IndentHead({ span, pin }: { span: number; pin: PinPlace | undefined }) {
  const { labels } = useGridContext();
  return (
    <th
      scope="col"
      colSpan={span}
      className="flg-table-head flg-data-grid-indent"
      {...pinAttributes(pin)}
    >
      <span className="flg-visually-hidden">{labels.groupsAndDetails}</span>
    </th>
  );
}
