import { useRef } from 'react';
import { dataAttr } from '../../../internal/data-attr';
import { FunnelIcon } from '../../../internal/icons';
import { useTriggerPress } from '../../../internal/use-popover-trigger';
import { conditionOf, headerConditionFilters } from '../engine/filter';
import { useFilterView } from '../filter-context';
import { useGridContext } from '../grid-context';
import { pressTitle } from '../grid-dom';
import { useFilterPopoverView } from '../hooks/use-filter-popover';

/**
 * The funnel on a title that opens the header filter of its column (spec phase 6 §4.3 G1, F1): the
 * column's distinct values, in the one filter popover of the grid. It is filled (`data-active`) while the
 * column has a header condition that filters (`headerConditionFilters`, the one answer the filter bar gives
 * too); a condition of the filter row is the operator button's sign and not this one's. It reads the
 * popover's state apart from what the rows read, so opening it draws this button and no title, row or
 * toolbar.
 *
 * A press on it is a press on the title, which is where the focus goes: the `mousedown` is cancelled and
 * the title focused, as the sort button does; the click opens the popover. A second press on the funnel of
 * the open popover closes it and does not open it again, which the click cannot tell by the state alone: the
 * press has light-dismissed the popover before the click arrives (`useTriggerPress`).
 */
export function FunnelButton({ columnId, caption }: { columnId: string; caption: string }) {
  const { labels } = useGridContext();
  const { filter, popover } = useFilterView();
  const view = useFilterPopoverView(popover.store);
  const open = view?.open === true && view.kind === 'values' && view.columnId === columnId;
  const active = headerConditionFilters(conditionOf(filter, columnId));
  const buttonRef = useRef<HTMLButtonElement>(null);
  const press = useTriggerPress(open, (wasOpen) => {
    if (wasOpen) popover.close();
    else if (buttonRef.current) popover.open('values', columnId, buttonRef.current);
  });
  return (
    <button
      ref={buttonRef}
      type="button"
      className="flg-data-grid-head-button"
      data-active={dataAttr(active)}
      aria-label={labels.filterColumn(caption, active)}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? popover.contentId : undefined}
      onPointerDown={press.onPointerDown}
      onPointerCancel={press.onPointerCancel}
      onMouseDown={pressTitle}
      onClick={press.onClick}
    >
      <FunnelIcon />
    </button>
  );
}
