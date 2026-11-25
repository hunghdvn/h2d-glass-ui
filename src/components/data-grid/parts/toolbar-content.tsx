import { PlusIcon } from '../../../internal/icons';
import { Button } from '../../button/Button';
import { ColumnChooser } from './ColumnChooser';
import { SearchBox } from './SearchBox';
import { ToolbarSpacer } from './Toolbar';
import type { ResolvedColumn } from '../engine/columns';
import type { ReactNode } from 'react';
import type { DataGridColumnLayout, DataGridLabels, DataGridProps } from '../types';

export interface ToolbarContentOptions<TRow> {
  /** The `toolbar` prop. */
  toolbar: DataGridProps<TRow>['toolbar'];
  /** The `searchPanel` prop. */
  searchPanel: DataGridProps<TRow>['searchPanel'];
  /** The `columnChooser` prop. */
  columnChooser: boolean | undefined;
  /** The group panel, drawn by the grid; `null` without `groupPanel` and in server mode. */
  groupPanel: ReactNode;
  resolved: readonly ResolvedColumn<TRow>[];
  /** The layout as shown. */
  layout: DataGridColumnLayout;
  labels: DataGridLabels;
  showColumn: (columnId: string, show: boolean) => void;
  /** Adds a row: the button of the toolbar calls it; `null` when the grid cannot add rows, and the button is none. */
  addRow: (() => void) | null;
}

/**
 * What `searchPanel` asks for: `true` and an object are on, with the placeholder of an object that has
 * one, and anything else is off. The grid never throws for a value it does not know.
 */
function searchOptions(searchPanel: unknown): { placeholder?: string } | undefined {
  if (searchPanel === true) return {};
  if (typeof searchPanel !== 'object' || searchPanel === null || Array.isArray(searchPanel)) {
    return undefined;
  }
  const { placeholder } = searchPanel as { placeholder?: unknown };
  return typeof placeholder === 'string' ? { placeholder } : {};
}

/**
 * The items of the toolbar after the caption (spec phase 6 §3.6, §6.3 "Thanh công cụ"): the grid's
 * group panel, search field and buttons, which a `toolbar` function may place as it likes. `false` takes the items
 * away and keeps the caption, and any other value is no `toolbar`. The keys let a function return the
 * items in a list.
 * Plain function, not a hook: it keeps no state, so it is called where the content is wanted.
 */
export function toolbarContent<TRow>({
  toolbar,
  searchPanel,
  columnChooser,
  groupPanel,
  resolved,
  layout,
  labels,
  showColumn,
  addRow,
}: ToolbarContentOptions<TRow>) {
  const search = searchOptions(searchPanel);
  const items = {
    groupPanel,
    spacer: <ToolbarSpacer key="spacer" />,
    search: search ? (
      <SearchBox
        key="search"
        label={labels.search}
        placeholder={search.placeholder ?? labels.searchPlaceholder}
      />
    ) : null,
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
    addButton:
      addRow === null ? null : (
        <Button key="addButton" variant="primary" size="md" onClick={addRow}>
          <PlusIcon width={16} height={16} aria-hidden="true" />
          {labels.addRow}
        </Button>
      ),
  };
  if (toolbar === false) return null;
  if (typeof toolbar === 'function') return toolbar(items);
  if (!items.groupPanel && !items.search && !items.columnChooser && !items.addButton) return null;
  return (
    <>
      {items.groupPanel}
      {items.spacer}
      {items.search}
      {items.columnChooser}
      {items.addButton}
    </>
  );
}
