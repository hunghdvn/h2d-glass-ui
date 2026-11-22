import { Fragment, memo, useCallback, useMemo, useRef } from 'react';
import type { FocusEvent } from 'react';
import { FunnelIcon } from '../../../internal/icons';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import { Button } from '../../button/Button';
import { Switch } from '../../switch/Switch';
import type { ResolvedColumn } from '../engine/columns';
import { conditionTexts, withEnabled } from '../engine/filter';
import type { ConditionRows } from '../engine/filter';
import { useFilterView } from '../filter-context';
import type { DataGridFilter, DataGridLabels } from '../types';

interface FilterPanelProps<TRow> {
  /**
   * The columns in the order the sentence says them: the shown ones in the order of their zones, then the
   * hidden ones. The grid keeps the list by its members, so a width or a sort draws nothing here.
   */
  columns: readonly ResolvedColumn<TRow>[];
  labels: DataGridLabels;
  /**
   * The rows the grid has and the cache of their texts: a value of a column whose text is its own (a
   * `format` function) is written as its first row writes it. They are the grid's data and its cache, so
   * they change with the data and not with a search.
   */
  source: ConditionRows<TRow>;
  /** Gives the focus to the active cell of the grid, for when the panel goes with the focus on it. */
  restoreFocus: () => void;
}

interface PanelBodyProps<TRow> extends FilterPanelProps<TRow> {
  /** The conditions of the columns (`filter.columns`): the only part of the filter the sentence reads. */
  conditions: DataGridFilter['columns'];
  /** Whether the conditions are turned on (`filter.enabled`). */
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onClear: () => void;
}

/**
 * The bar between the grid and its pager that says what the filter is (spec phase 6 §4.3 F1 "Thanh bộ
 * lọc", §6.3 "Lọc"): a funnel, the conditions of the columns in words (`conditionTexts`: the caption in
 * semibold, the operator, the value, `labels.and` muted between), the button that clears the search and
 * every condition, and the switch that turns the conditions off without losing them (`filter.enabled`).
 * The grid draws it while some column has a condition that filters, and a search alone does not give one.
 * It is outside the table, a stop of Tab of its own after the grid; what it asks goes through the same
 * `apply` of the grid as a cell of the filter row does.
 *
 * Clearing takes the panel away with the focus on its button, which a browser would drop to the page: the
 * focus goes to the active cell of the grid after the commit that removed it (the browser fires no blur for
 * a focused element that is removed, so the panel keeps its own count of whether the focus is in it).
 */
function FilterPanelBody<TRow>({
  columns,
  labels,
  source,
  restoreFocus,
  conditions,
  enabled,
  onEnabledChange,
  onClear,
}: PanelBodyProps<TRow>) {
  const texts = useMemo(
    () => conditionTexts({ columns: conditions }, columns, labels, source),
    [conditions, columns, labels, source],
  );
  const focused = useRef(false);
  const restore = useRef(restoreFocus);
  useWriteOnCommit(() => {
    restore.current = restoreFocus;
  });
  // After the commit that removes the panel the grid shows its rows again, and the place it has is the
  // one to give the focus to, so it is asked a moment after the commit and not in it.
  useIsoLayoutEffect(
    () => () => {
      if (focused.current) queueMicrotask(() => restore.current());
    },
    [],
  );
  return (
    <div
      className="flg-data-grid-filter-panel"
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={(event: FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) focused.current = false;
      }}
    >
      <span className="flg-data-grid-filter-icon" aria-hidden="true">
        <FunnelIcon width={14} height={14} />
      </span>
      <span className="flg-data-grid-filter-text">
        {texts.map((item, index) => (
          <Fragment key={`${item.id}:${item.part}`}>
            {index > 0 ? (
              <>
                <span className="flg-data-grid-filter-and">{labels.and}</span>{' '}
              </>
            ) : null}
            <b>{item.caption}</b> {item.words}
            {index < texts.length - 1 ? ' ' : null}
          </Fragment>
        ))}
      </span>
      <Button variant="ghost" size="sm" className="flg-data-grid-filter-clear" onClick={onClear}>
        {labels.clearFilter}
      </Button>
      <span className="flg-data-grid-filter-spacer" />
      <Switch checked={enabled} onCheckedChange={onEnabledChange}>
        {labels.applyFilter}
      </Switch>
    </div>
  );
}

const PanelBody = memo(FilterPanelBody) as typeof FilterPanelBody;

/**
 * What the panel reads of the filter is its conditions and `enabled`, so it asks the filter view for them
 * and passes only those on to a body kept by them: a search, which the context also carries, draws the
 * panel's reader and not the bar. The switch writes over the filter as the grid holds it at that moment.
 */
function FilterPanelView<TRow>(props: FilterPanelProps<TRow>) {
  const { filter, apply, clear } = useFilterView();
  const latest = useRef(filter);
  useWriteOnCommit(() => {
    latest.current = filter;
  });
  const onEnabledChange = useCallback(
    (enabled: boolean) => apply(withEnabled(latest.current, enabled)),
    [apply],
  );
  return (
    <PanelBody
      {...props}
      conditions={filter.columns}
      enabled={filter.enabled !== false}
      onEnabledChange={onEnabledChange}
      onClear={clear}
    />
  );
}

/** The panel, kept while its columns, labels and focus function are the same, and the filter says the same. */
export const FilterPanel = memo(FilterPanelView) as typeof FilterPanelView;
