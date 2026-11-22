import { useRef } from 'react';
import { dataAttr } from '../../../internal/data-attr';
import { OperatorIcon } from '../../../internal/icons';
import { useTriggerPress } from '../../../internal/use-popover-trigger';
import type { ResolvedColumn } from '../engine/columns';
import { conditionOf, rowConditionFilters, shownOperator } from '../engine/filter';
import { useFilterView } from '../filter-context';
import { useGridContext } from '../grid-context';
import { useOperatorMenuView } from '../hooks/use-operator-menu';

/**
 * The button at the start of a filter cell that opens the one menu of operators (spec phase 6 §4.3 F1):
 * the glyph of the operator the column filters by, accented while the column's row condition filters
 * (`rowConditionFilters`, the one answer the funnel and the panel give too). It is a control of its cell,
 * in the frame of the input: a press on it takes nothing from the input but its focus, which applies what
 * was typed. A second press on the button of the open menu closes it and does not open it again, which the
 * click cannot tell by the state alone: the press has light-dismissed the menu before the click arrives
 * (`useTriggerPress`).
 */
export function OperatorButton<TRow>({ column }: { column: ResolvedColumn<TRow> }) {
  const { labels } = useGridContext<TRow>();
  const { filter, operatorMenu } = useFilterView();
  const view = useOperatorMenuView(operatorMenu.store);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const condition = conditionOf(filter, column.id);
  const operator = shownOperator(column, condition);
  const open = view?.open === true && view.columnId === column.id;
  const press = useTriggerPress(open, (wasOpen) => {
    if (wasOpen) operatorMenu.close();
    else if (buttonRef.current) operatorMenu.open(column.id, buttonRef.current);
  });
  if (operator === undefined) return null;
  return (
    <button
      ref={buttonRef}
      type="button"
      className="flg-data-grid-operator"
      data-active={dataAttr(rowConditionFilters(column, condition))}
      aria-label={labels.operator(labels.operators[operator])}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? operatorMenu.contentId : undefined}
      onPointerDown={press.onPointerDown}
      onPointerCancel={press.onPointerCancel}
      onClick={press.onClick}
    >
      <OperatorIcon operator={operator} />
    </button>
  );
}
