import { memo, useId, useMemo } from 'react';
import { ColumnsIcon, LockIcon } from '../../../internal/icons';
import { Checkbox } from '../../checkbox/Checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../../popover/Popover';
import { TooltipContent, TooltipRoot, TooltipTrigger } from '../../tooltip/Tooltip';
import { chooserItems } from '../engine/column-chooser';
import type { ResolvedColumn } from '../engine/columns';
import type { DataGridColumnLayout, DataGridLabels } from '../types';

export interface ColumnChooserProps {
  /** The caller's columns, shown or not. */
  columns: readonly Pick<ResolvedColumn<unknown>, 'id' | 'caption' | 'allowHiding'>[];
  /** The layout as shown. */
  layout: DataGridColumnLayout;
  labels: DataGridLabels;
  /** A box was changed: the column is to be shown, or hidden. */
  onToggle: (columnId: string, show: boolean) => void;
}

/**
 * The column chooser (spec phase 6 §3.6, §4.3 C1 crop e, §6.3 "Chọn cột"): the icon button of the
 * toolbar and the Popover of the library it opens, with a box for each column. A box shows or hides
 * its column at once, and the popover stays open for the next. The Popover is the grid's one, and is
 * mounted only for a grid that asks for the chooser. Its list is drawn only while it is open, as a
 * Popover draws its content, and the grid draws no title and no row for what is done in it.
 */
export const ColumnChooser = memo(function ColumnChooser({
  columns,
  layout,
  labels,
  onToggle,
}: ColumnChooserProps) {
  const titleId = useId();
  const lockedId = useId();
  const lastId = useId();
  const items = useMemo(() => chooserItems(columns, layout), [columns, layout]);
  const anyLocked = items.some((item) => item.locked);
  const anyLast = items.some((item) => item.last);
  return (
    <Popover>
      {/* The tooltip says the name the button has already, so it does not describe it. */}
      <TooltipRoot describe={false}>
        <TooltipTrigger>
          <PopoverTrigger
            variant="secondary"
            size="md"
            className="flg-data-grid-chooser-button"
            data-icon-only=""
            aria-label={labels.columnChooser}
          >
            <ColumnsIcon />
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center" sideOffset={8}>
          {labels.columnChooser}
        </TooltipContent>
      </TooltipRoot>
      <PopoverContent
        side="bottom"
        align="end"
        className="flg-data-grid-chooser"
        aria-labelledby={titleId}
      >
        <div id={titleId} className="flg-data-grid-chooser-title">
          {labels.columnChooser}
        </div>
        <div className="flg-data-grid-chooser-list">
          {items.map((item) => {
            const box = (
              <Checkbox
                key={item.id}
                checked={item.shown}
                disabled={item.disabled}
                aria-describedby={item.locked ? lockedId : item.last ? lastId : undefined}
                onCheckedChange={(checked) => onToggle(item.id, checked)}
              >
                {item.caption}
              </Checkbox>
            );
            // A column that is always shown has its lock at the end of its row.
            return item.locked ? (
              <div key={item.id} className="flg-data-grid-chooser-row">
                {box}
                <span className="flg-data-grid-chooser-lock" aria-hidden="true">
                  <LockIcon />
                </span>
              </div>
            ) : (
              box
            );
          })}
        </div>
        {anyLast ? (
          <span id={lastId} hidden>
            {labels.lastShownColumn}
          </span>
        ) : null}
        {anyLocked ? (
          <span id={lockedId} hidden>
            {labels.lockedColumn}
          </span>
        ) : null}
      </PopoverContent>
    </Popover>
  );
});
