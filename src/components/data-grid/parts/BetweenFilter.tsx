import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { hasModifier, isComposing } from '../../../internal/roving';
import { useTriggerPress } from '../../../internal/use-popover-trigger';
import { Input } from '../../input/Input';
import type { ResolvedColumn } from '../engine/columns';
import { conditionOf, rangeText, rowConditionFilters } from '../engine/filter';
import { useFilterView } from '../filter-context';
import { useGridContext } from '../grid-context';
import { useFilterPopoverView } from '../hooks/use-filter-popover';
import { OperatorButton } from './OperatorButton';

/**
 * The cell of a number or a day whose operator is `between` (spec phase 6 §4.3 F1 "Trong khoảng", outside
 * the mockup): a read-only field that says the range (`rangeText`: `labels.range` for two ends, "≥ 5" or
 * "≤ 31/10/2026" for one, each end written as the column writes it), or the placeholder `labels.between`
 * while there is none. A press, or Enter, opens the one filter popover of the grid, where the two ends are
 * edited; a second press on the field of the open popover closes it and does not open it again
 * (`useTriggerPress`). The field is the popover's opener, the element it gives the focus back to, so it is a
 * combobox with a dialog for a popup.
 */
export function BetweenFilter<TRow>({ column }: { column: ResolvedColumn<TRow> }) {
  const { labels } = useGridContext<TRow>();
  const { filter, popover } = useFilterView();
  const view = useFilterPopoverView(popover.store);
  const fieldRef = useRef<HTMLInputElement>(null);
  const condition = conditionOf(filter, column.id);
  const open = view?.open === true && view.columnId === column.id && view.kind === 'between';
  const show = () => {
    if (fieldRef.current) popover.open('between', column.id, fieldRef.current);
  };
  const press = useTriggerPress(open, (wasOpen) => {
    if (wasOpen) popover.close();
    else show();
  });
  const text = rowConditionFilters(column, condition)
    ? rangeText(column, condition?.value, labels)
    : '';
  return (
    <Input
      ref={fieldRef}
      size="sm"
      readOnly
      role="combobox"
      className={column.dataType === 'number' ? 'flg-data-grid-filter-number' : undefined}
      aria-label={labels.filterCell(column.caption)}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? popover.contentId : undefined}
      placeholder={labels.between}
      startContent={<OperatorButton column={column} />}
      value={text}
      onPointerDown={press.onPointerDown}
      onPointerCancel={press.onPointerCancel}
      onClick={press.onClick}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter' || hasModifier(event) || isComposing(event)) return;
        event.preventDefault();
        show();
      }}
    />
  );
}
