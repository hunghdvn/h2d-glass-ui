import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { OperatorIcon } from '../../../internal/icons';
import { MenuTreeContext } from '../../menu/menu-context';
import type { FocusOnOpen } from '../../menu/menu-context';
import { MenuRadioGroup, MenuRadioItem } from '../../menu/Menu';
import { MenuPanel } from '../../menu/MenuPanel';
import { conditionOf, shownOperator, withRowCondition } from '../engine/filter';
import { useFilterView } from '../filter-context';
import { useGridContext } from '../grid-context';
import { useOperatorMenuView } from '../hooks/use-operator-menu';
import type { DataGridFilterOperator } from '../types';

// The focus is put on the checked item here, after the menu shows, and not by the panel, which knows the
// first and the last item only.
const NO_FOCUS: MutableRefObject<FocusOnOpen> = { current: 'none' };

/**
 * The one menu of operators of the grid (spec phase 6 §3.6, §4.3 F1 "Menu toán tử"): the menu of the library
 * (`MenuPanel`), after the table and outside it so that the name of a cell stays short, under the button of
 * the filter cell it was opened from. Its items are the operators of that column, each with its glyph before
 * its words, the one the filter holds checked; it opens on the checked item. A choice is a change of the
 * filter at once, with the text the cell has applied, and the focus goes back to the button, or to the
 * one that stands for it when the choice swapped the cell's control (`popupHome`).
 */
export function OperatorMenu<TRow>() {
  const { columns, labels } = useGridContext<TRow>();
  const { filter, apply, operatorMenu, popupHome } = useFilterView();
  const view = useOperatorMenuView(operatorMenu.store);
  const tree = useMemo(() => ({ closeAll: operatorMenu.close }), [operatorMenu.close]);
  const column = view ? columns.find((candidate) => candidate.id === view.columnId) : undefined;
  const condition = column ? conditionOf(filter, column.id) : undefined;
  const current = column ? shownOperator(column, condition) : undefined;
  const panel = useRef<HTMLDivElement>(null);

  // The menu shows while its column is shown. A column that goes (hidden, or no longer there) closes it for
  // good, so that showing the column again opens nothing; so does the menu leaving the page (`filterRow`
  // turned off), whose store would otherwise open it again, on a detached button, when it comes back.
  const open = view?.open === true && column !== undefined;
  const gone = view?.open === true && column === undefined;
  const { close } = operatorMenu;
  useEffect(() => {
    if (gone) close();
  }, [gone, close]);
  useEffect(() => close, [close]);

  // Opening: the menu is showing after the commit that opens it (the panel shows it in its own effect, which
  // runs first), so the checked item can have the focus.
  useEffect(() => {
    if (!open) return;
    panel.current
      ?.querySelector<HTMLElement>('[role="menuitemradio"][aria-checked="true"]')
      ?.focus({
        preventScroll: true,
      });
  }, [open]);

  const choose = (operator: string): void => {
    if (!column || operator === current) return;
    // The held value stays, or none: the cell applied its text when its input was left, which pressing the
    // button does. A range is a value of another kind than the one of the other operators (two ends, not one),
    // so going to `between` or from it leaves none.
    const crosses = (operator === 'between') !== (current === 'between');
    apply(
      withRowCondition(
        filter,
        column.id,
        operator as DataGridFilterOperator,
        crosses ? undefined : condition?.value,
      ),
    );
  };

  return (
    <MenuTreeContext.Provider value={tree}>
      <MenuPanel
        ref={panel}
        className="flg-data-grid-operator-menu"
        aria-label={column ? labels.filterCell(column.caption) : undefined}
        open={open}
        report={(next) => {
          if (!next) operatorMenu.close();
        }}
        contentId={operatorMenu.contentId}
        reference={() => view?.from ?? null}
        restoreFocusTo={() => {
          const now = operatorMenu.store.get();
          return now ? popupHome('operator', now.columnId, now.from) : null;
        }}
        focusOnOpen={NO_FOCUS}
        side="bottom"
        align="start"
        offset={4}
      >
        {column ? (
          <MenuRadioGroup value={current} onValueChange={choose}>
            {column.operators.map((operator) => (
              <MenuRadioItem key={operator} value={operator} textValue={labels.operators[operator]}>
                <span className="flg-menu-item-icon flg-data-grid-operator-icon" aria-hidden="true">
                  <OperatorIcon operator={operator} />
                </span>
                {labels.operators[operator]}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        ) : null}
      </MenuPanel>
    </MenuTreeContext.Provider>
  );
}
