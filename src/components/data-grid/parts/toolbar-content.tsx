import { ColumnChooser } from './ColumnChooser';
import { ToolbarSpacer } from './Toolbar';
import type { ResolvedColumn } from '../engine/columns';
import type { DataGridColumnLayout, DataGridLabels, DataGridProps } from '../types';

export interface ToolbarContentOptions<TRow> {
  /** The `toolbar` prop. */
  toolbar: DataGridProps<TRow>['toolbar'];
  /** The `columnChooser` prop. */
  columnChooser: boolean | undefined;
  resolved: readonly ResolvedColumn<TRow>[];
  /** The layout as shown. */
  layout: DataGridColumnLayout;
  labels: DataGridLabels;
  showColumn: (columnId: string, show: boolean) => void;
}

/**
 * The items of the toolbar after the caption (spec phase 6 §3.6, §6.3 "Thanh công cụ"): the grid's
 * buttons, which a `toolbar` function may place as it likes. `false` takes the items away and keeps the
 * caption, and any other value is no `toolbar`. The keys let a function return the items in a list.
 * Plain function, not a hook: it keeps no state, so it is called where the content is wanted.
 */
export function toolbarContent<TRow>({
  toolbar,
  columnChooser,
  resolved,
  layout,
  labels,
  showColumn,
}: ToolbarContentOptions<TRow>) {
  const items = {
    spacer: <ToolbarSpacer key="spacer" />,
    columnChooser:
      columnChooser === true ? (
        <ColumnChooser
          key="columnChooser"
          columns={resolved}
          layout={layout}
          labels={labels}
          onToggle={showColumn}
        />
      ) : null,
  };
  if (toolbar === false) return null;
  if (typeof toolbar === 'function') return toolbar(items);
  return (
    items.columnChooser && (
      <>
        {items.spacer}
        {items.columnChooser}
      </>
    )
  );
}
