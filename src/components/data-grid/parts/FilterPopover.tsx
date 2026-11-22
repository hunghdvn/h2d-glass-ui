import { clsx } from 'clsx';
import { useEffect, useRef } from 'react';
import type { KeyboardEvent, MutableRefObject } from 'react';
import { POPUP_SELECTOR } from '../../../internal/controls';
import { focusFirst, getFocusables } from '../../../internal/focus';
import { hasModifier, isComposing } from '../../../internal/roving';
import { useFloating } from '../../../internal/use-floating';
import { usePopover } from '../../../internal/use-popover';
import { usePopoverState } from '../../../internal/use-popover-trigger';
import { Button } from '../../button/Button';
import { conditionOf, shownOperator } from '../engine/filter';
import { useFilterView } from '../filter-context';
import { useGridContext } from '../grid-context';
import { useFilterPopoverView } from '../hooks/use-filter-popover';
import { BetweenEditor } from './BetweenEditor';
import { HeaderFilter } from './HeaderFilter';

/**
 * What the content of the popover does when the user means OK: it applies what it holds to the filter and
 * answers whether the popover may close (`false` for what it cannot apply, such as text in a range's end that
 * is no number). The content writes it, the popover's keys and its OK button call it.
 */
export type ApplyRef = MutableRefObject<(() => boolean) | undefined>;

/**
 * The distance from what opened the popover to the top of its panel, in px: F1 draws its Status popover 12.2px
 * under the funnel (measured in the approved page), which is closer than the library Popover's own 18px. Both
 * of the grid's popovers (the header filter and the range of `between`) sit there, so they agree.
 */
const PANEL_GAP = 12.2;

/**
 * The one filter popover of the grid (spec phase 6 §3.6, §6.3): the glass `Popover` of the library, with its
 * arrow, `role="dialog"`, opened under the element a part asks (the range of `between`, the funnel of the
 * header filter, whose list of values it holds), which it gives the
 * focus back to. It is after the table and outside it, so keys and presses in it are not the grid's. The
 * focus goes to its first control when it opens. Enter (not on a button) is OK and Esc is Cancel, which is
 * the browser's own close; Tab past the last control and Shift+Tab before the first close it as Cancel does
 * and give the focus back to what opened it; a light dismiss is a Cancel too. It draws its content only while
 * it is open, so each opening starts from the filter as it is.
 */
export function FilterPopover<TRow>() {
  const { columns, labels } = useGridContext<TRow>();
  const { popover, filter, popupHome } = useFilterView();
  const view = useFilterPopoverView(popover.store);
  const column = view ? columns.find((candidate) => candidate.id === view.columnId) : undefined;
  // A range is edited while its column's operator is `between`: an outside change of it (`clearFilter()`, a
  // controlled parent) takes the range away, and the popover with it.
  const ranged =
    view?.kind !== 'between' ||
    (column !== undefined && shownOperator(column, conditionOf(filter, column.id)) === 'between');
  const open = view?.open === true && column !== undefined && ranged;
  // The header filter's list of values opens under the funnel, centred on it; the range under its field.
  const values = view?.kind === 'values';
  // What cannot show closes the store too, for good: a column that is shown again, or an operator that
  // goes back to `between`, opens nothing; and so does the popover leaving the page.
  const gone = view?.open === true && !open;
  const { close } = popover;
  useEffect(() => {
    if (gone) close();
  }, [gone, close]);
  useEffect(() => close, [close]);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const applyRef: ApplyRef = useRef(undefined);

  const state = usePopoverState<HTMLDivElement>({
    open,
    defaultOpen: false,
    onOpenChange: (next) => {
      if (!next) popover.close();
    },
    name: 'DataGrid filter popover',
  });
  const { contentRef } = state;
  usePopover(contentRef, {
    open,
    onOpenChange: state.report,
    pendingToggle: state.pendingToggle,
    restoreFocusTo: () => {
      const now = popover.store.get();
      return now
        ? popupHome(now.kind === 'values' ? 'funnel' : 'range', now.columnId, now.from)
        : null;
    },
    onShown: () => {
      if (contentRef.current) focusFirst(contentRef.current);
    },
  });
  useFloating({
    open,
    // Under the funnel, or under the field, whose frame is wider than its input.
    reference: () =>
      view ? (values ? view.from : (view.from.closest('.flg-input') ?? view.from)) : null,
    floating: contentRef,
    side: 'bottom',
    align: values ? 'center' : 'start',
    offset: PANEL_GAP,
    arrow: arrowRef,
  });

  // OK applies and closes, unless the content cannot apply what it holds. Cancel closes and changes nothing.
  const ok = () => {
    if (applyRef.current?.() !== false) popover.close();
  };
  const cancel = () => popover.close();

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const dialog = contentRef.current;
    const target = event.target as HTMLElement;
    // Keys of a popup inside it (a calendar) are its own, and so are those of an input method.
    if (!dialog || target.closest(POPUP_SELECTOR) !== dialog || isComposing(event)) return;
    if (event.key === 'Enter' && !hasModifier(event)) {
      // A button presses itself, and a control that has refused the key (a date that cannot be read) keeps it.
      if (event.defaultPrevented || target.closest('button')) return;
      event.preventDefault();
      // A control that took this very key (a DatePicker that reads its text) has told the editor in this event,
      // whose render is flushed when the event ends: OK reads what the editor holds then, not before.
      queueMicrotask(ok);
    } else if (event.key === 'Tab' && !event.ctrlKey && !event.altKey && !event.metaKey) {
      const stops = getFocusables(dialog).filter((el) => el.closest(POPUP_SELECTOR) === dialog);
      const edge = event.shiftKey ? stops[0] : stops.at(-1);
      if (edge !== target) return;
      // The popover is after the table: Tab would leave from the end of the grid's own controls. It closes
      // as Cancel does, and the focus goes back to what opened it.
      event.preventDefault();
      cancel();
    }
  };

  return (
    // The keys are those of the controls inside it, which have their own; the popover only reads Enter and Tab.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={contentRef}
      popover="auto"
      role="dialog"
      tabIndex={-1}
      id={popover.contentId}
      aria-label={
        column
          ? values
            ? labels.filterColumn(column.caption, false)
            : labels.filterCell(column.caption)
          : undefined
      }
      data-side="bottom"
      data-align={values ? 'center' : 'start'}
      className={clsx(
        'flg-surface flg-popover flg-data-grid-filter-popover',
        values && 'flg-data-grid-header-filter',
      )}
      onKeyDown={onKeyDown}
    >
      {open && column ? (
        <>
          <span ref={arrowRef} className="flg-popover-arrow" aria-hidden="true" />
          {values ? (
            <HeaderFilter key={column.id} column={column} applyRef={applyRef} />
          ) : (
            <BetweenEditor column={column} applyRef={applyRef} />
          )}
          <div className="flg-data-grid-filter-popover-footer">
            <Button variant="secondary" size="sm" onClick={cancel}>
              {labels.cancel}
            </Button>
            <Button variant="primary" size="sm" onClick={ok}>
              {labels.ok}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
