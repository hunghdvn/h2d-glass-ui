import { Fragment, memo, useRef } from 'react';
import type { KeyboardEvent, PointerEvent, MouseEvent, RefObject } from 'react';
import { takesOwnPress } from '../../../internal/controls';
import { dataAttr } from '../../../internal/data-attr';
import { ArrowIcon, ChevronIcon, CloseIcon, GroupIcon } from '../../../internal/icons';
import { isApplePlatform } from '../../../internal/platform';
import { isComposing } from '../../../internal/roving';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { GROUP_CHIP_SELECTOR } from '../grid-dom';
import { useDragMember } from '../hooks/use-drag-view';
import type { DragViewStore } from '../hooks/use-drag-view';
import type { GroupChip, GroupPanelControl } from '../hooks/use-group-panel';
import type { DataGridLabels } from '../types';

export interface GroupPanelProps {
  /** The element of the tray, which a drag of a title or of a chip measures. */
  panelRef: RefObject<HTMLDivElement | null>;
  /** Told `true` when the tray is mounted and `false` when it goes: a toolbar may leave it out. */
  onMounted: (mounted: boolean) => void;
  chips: readonly GroupChip[];
  labels: DataGridLabels;
  /** What the buttons of the chips do: the same functions for as long as the grid lives. */
  actions: Pick<GroupPanelControl, 'turn' | 'ungroup' | 'step'>;
  /** The press on a chip that may become a drag (`useChipDrag`). */
  onChipPointerDown: (event: PointerEvent<HTMLElement>, field: string) => void;
  /** Where a drag of a title or a chip is over the tray, apart from what the rows read. */
  view: DragViewStore;
  /** Gives the focus to the active place of the grid, when no chip is left to take it. */
  focusGrid: () => void;
}

type ButtonKind = 'direction' | 'remove';

/** The focus a button of a chip is owed after the commit of what it did. */
type Owed =
  | { kind: 'stay'; field: string; button: ButtonKind }
  | { kind: 'removed'; field: string; index: number };

/**
 * The group panel (spec phase 6 §3.8, §4.3 R1 "Thanh nhóm"): a tray in the toolbar, `role="group"` named
 * by `labels.groupPanel`, with a chip for each level of the grouping in order and a chevron between two
 * of them. A chip is its caption and two buttons, one that turns the direction of its level and one that
 * takes it out; `mod+Shift+←` and `mod+Shift+→` on either moves the level. Empty, the tray has the icon
 * and the hint. The buttons are stops of Tab of the toolbar, two for each chip.
 *
 * A title or a chip that is over it marks it: `data-drop-target` on the tray and `data-drop-before` on
 * the chip the level would go before (`data-drop-end` for after the last), which the stylesheet draws
 * the bar from. They come from the store of the drag, one value at a time, so a move of the pointer
 * draws this only when it changes the slot. The chip that is dragged is dimmed from the same store.
 *
 * The focus is where the button was: after a move by the keys the same button of the same chip, which
 * an engine may drop when React moves the chip's node; after a removal the same button of the chip that
 * is now in its place, else of the one before, else the grid's active place. Written in the commit of
 * what the button did, and only when it did it.
 */
export const GroupPanel = memo(function GroupPanel({
  panelRef,
  onMounted,
  chips,
  labels,
  actions,
  onChipPointerDown,
  view,
  focusGrid,
}: GroupPanelProps) {
  const over = useDragMember(view, 'target') === 'tray';
  const slot = useDragMember(view, 'slot');
  const dragged = useDragMember(view, 'chip');
  const owed = useRef<Owed | null>(null);

  useIsoLayoutEffect(() => {
    onMounted(true);
    return () => onMounted(false);
  }, [onMounted]);

  useIsoLayoutEffect(() => {
    const due = owed.current;
    owed.current = null;
    const panel = panelRef.current;
    if (!due || !panel) return;
    const buttons = (field: string) =>
      Array.from(panel.querySelectorAll<HTMLElement>(GROUP_CHIP_SELECTOR))
        .find((chip) => chip.dataset.field === field)
        ?.querySelectorAll<HTMLButtonElement>('button');
    if (due.kind === 'stay') {
      const [direction, remove] = buttons(due.field) ?? [];
      const button = due.button === 'direction' ? direction : remove;
      if (button && document.activeElement !== button) button.focus();
      return;
    }
    // A removal that the parent did not keep leaves the chip, and the focus where it is.
    if (chips.some((chip) => chip.field === due.field)) return;
    const next = chips[due.index] ?? chips[due.index - 1];
    const [, remove] = (next ? buttons(next.field) : undefined) ?? [];
    if (remove) remove.focus();
    else focusGrid();
  });

  const onKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    chip: GroupChip,
    button: ButtonKind,
  ) => {
    if (event.defaultPrevented || isComposing(event)) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const apple = isApplePlatform();
    const mod = apple ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
    if (!mod || !event.shiftKey || event.altKey) return;
    // Cancelled at an edge too, where it moves nothing: the browser does not scroll or select with it.
    event.preventDefault();
    if (actions.step(chip.field, event.key === 'ArrowLeft' ? -1 : 1)) {
      owed.current = { kind: 'stay', field: chip.field, button };
    }
  };

  // The `mousedown` of a press that may become a drag is cancelled, so that no text is selected as the
  // pointer goes; a press on a button is the button's.
  const onMouseDown = (event: MouseEvent<HTMLElement>) => {
    if (event.button === 0 && !takesOwnPress(event)) event.preventDefault();
  };

  const empty = chips.length === 0;
  return (
    <div
      ref={panelRef}
      role="group"
      aria-label={labels.groupPanel}
      className="flg-data-grid-group-panel"
      data-empty={dataAttr(empty)}
      data-drop-target={dataAttr(over)}
      data-drop-end={dataAttr(over && slot !== null && slot >= chips.length)}
    >
      {empty ? (
        <>
          <GroupIcon width={15} height={15} />
          <span className="flg-data-grid-group-hint">{labels.groupPanelHint}</span>
        </>
      ) : (
        <>
          <span className="flg-data-grid-group-label">{labels.groupBy}</span>
          {chips.map((chip, at) => {
            const next = chip.direction === 'asc' ? 'desc' : 'asc';
            return (
              <Fragment key={chip.field}>
                {at > 0 ? (
                  <span className="flg-data-grid-group-separator" aria-hidden="true">
                    <ChevronIcon direction="right" />
                  </span>
                ) : null}
                {/* The press handlers only drag the chip, a pointer gesture with a keyboard counterpart
                    in its two buttons (`mod+Shift+←` and `mod+Shift+→`); the chip is no control. */}
                {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                <span
                  className="flg-data-grid-group-chip"
                  data-field={chip.field}
                  data-drag-source={dataAttr(dragged === chip.field)}
                  data-drop-before={dataAttr(over && slot === at)}
                  onPointerDown={(event) => onChipPointerDown(event, chip.field)}
                  onMouseDown={onMouseDown}
                >
                  {chip.caption}
                  <button
                    type="button"
                    className="flg-data-grid-chip-button"
                    aria-label={labels.groupDirection(chip.caption, next)}
                    onClick={() => actions.turn(chip.field)}
                    onKeyDown={(event) => onKeyDown(event, chip, 'direction')}
                  >
                    <ArrowIcon direction={chip.direction === 'asc' ? 'up' : 'down'} />
                  </button>
                  <button
                    type="button"
                    className="flg-data-grid-chip-button"
                    aria-label={labels.ungroup(chip.caption)}
                    onClick={() => {
                      owed.current = { kind: 'removed', field: chip.field, index: at };
                      actions.ungroup(chip.field);
                    }}
                    onKeyDown={(event) => onKeyDown(event, chip, 'remove')}
                  >
                    <CloseIcon />
                  </button>
                </span>
              </Fragment>
            );
          })}
        </>
      )}
    </div>
  );
});
