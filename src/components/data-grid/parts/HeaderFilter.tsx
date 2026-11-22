import { useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { focusNext, hasModifier, isComposing } from '../../../internal/roving';
import { includesFolded } from '../../../internal/text-fold';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import { Checkbox } from '../../checkbox/Checkbox';
import { Divider } from '../../divider/Divider';
import { SearchField } from '../../search-field/SearchField';
import type { ResolvedColumn } from '../engine/columns';
import {
  DISTINCT_LIMIT,
  conditionOf,
  headerConditionFilters,
  headerSelection,
  narrowedSelection,
  withHeaderCondition,
} from '../engine/filter';
import type { DistinctItem } from '../engine/filter';
import { useFilterView } from '../filter-context';
import { useGridContext } from '../grid-context';
import type { ApplyRef } from './FilterPopover';

// What a value is told apart by in a list: its type and its text, so the number 1 and the text "1" differ and
// the blank (`null`) has a key of its own.
const keyOf = (value: unknown): string => `${typeof value}:${String(value)}`;

// The keys that start out checked: all of them when the column has no header condition, else the ones the
// condition keeps (`exclude` keeps every value but its own).
function startChecked(
  items: readonly DistinctItem[],
  values: readonly unknown[] | undefined,
  exclude: boolean,
) {
  if (values === undefined) return new Set(items.map((item) => item.value));
  const named = new Set<unknown>(values.map((value) => value ?? null));
  return new Set(
    items.filter((item) => named.has(item.value) !== exclude).map((item) => item.value),
  );
}

/**
 * The content of the filter popover for the header filter of a column (spec phase 6 §4.3 F1 "Popover lọc ở
 * header", §6.3 "Lọc ở header"): a search field and the column's distinct values, each with a box, "(Select
 * all)" first and "(Blanks)" last. The list is read once, when the popover opens (`listValues`: the rows after
 * the search and the conditions of the other columns, with the values the condition names), and the boxes
 * start from the column's header condition, all checked when there is none. The search narrows what is drawn
 * as it is typed, by `includesFolded`, and "(Select all)" checks, or clears, the values it shows. At most
 * `DISTINCT_LIMIT` are drawn; a line says how many more match. The list is one stop of Tab and its boxes
 * rove with the arrow keys, Home and End; ↓ in the search field goes into it.
 *
 * It gives its OK to the popover through `applyRef`: what is checked goes to the column's header condition
 * (`headerSelection`: all is no condition, more than half is `exclude`, none keeps no row), and the column's
 * row condition stays, joined to it by "and". An OK with the boxes as they started changes nothing, as Cancel
 * does. In a narrowed list (`narrowedSelection`) the values the list does not show are left as they were,
 * so the rule is the one that keeps them: a `values` condition stays `values`, any other becomes `exclude`.
 */
export function HeaderFilter<TRow>({
  column,
  applyRef,
}: {
  column: ResolvedColumn<TRow>;
  applyRef: ApplyRef;
}) {
  const { labels } = useGridContext<TRow>();
  const { filter, apply, listValues } = useFilterView();
  const [{ items, narrowed }] = useState(() => listValues(column.id));
  // The boxes as they were when the popover opened: an OK that leaves them so is a Cancel.
  const [started] = useState<ReadonlySet<unknown>>(() => {
    const condition = conditionOf(filter, column.id);
    return headerConditionFilters(condition)
      ? startChecked(items, condition?.values, condition?.exclude === true)
      : startChecked(items, undefined, false);
  });
  const [checked, setChecked] = useState<ReadonlySet<unknown>>(started);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const textOf = (item: DistinctItem) => (item.value === null ? labels.blank : item.text);
  const shown =
    search === '' ? items : items.filter((item) => includesFolded(textOf(item), search));
  const drawn = shown.slice(0, DISTINCT_LIMIT);
  const checkedShown = shown.filter((item) => checked.has(item.value)).length;
  // One stop of Tab: the box that has it, which is "(Select all)" at first; a search may take it away.
  const stop = Math.min(active, drawn.length);

  useWriteOnCommit(() => {
    applyRef.current = () => {
      if (checked.size === started.size && [...checked].every((value) => started.has(value))) {
        return true;
      }
      const all = items.map((item) => item.value);
      const selection = narrowed
        ? narrowedSelection(all, [...checked], conditionOf(filter, column.id))
        : headerSelection(all, [...checked]);
      apply(withHeaderCondition(filter, column.id, selection?.values, selection?.exclude ?? false));
      return true;
    };
  });

  const toggle = (value: unknown, on: boolean) =>
    setChecked((now) => {
      const next = new Set(now);
      if (on) next.add(value);
      else next.delete(value);
      return next;
    });
  const toggleShown = (on: boolean) =>
    setChecked((now) => {
      const next = new Set(now);
      for (const item of shown) {
        if (on) next.add(item.value);
        else next.delete(item.value);
      }
      return next;
    });

  const boxes = () => Array.from(listRef.current?.querySelectorAll('input') ?? []);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    focusNext(event, boxes(), { orientation: 'vertical', loop: false });
  };
  // ↓ in the search field goes down into the list, to its one stop.
  const intoList = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowDown' || hasModifier(event) || isComposing(event)) return;
    event.preventDefault();
    const stops = boxes().filter((input) => !input.disabled);
    (stops.find((input) => input.tabIndex === 0) ?? stops[0])?.focus();
  };
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const index = boxes().indexOf(event.target as HTMLInputElement);
    if (index >= 0) setActive(index);
  };

  return (
    <>
      <SearchField
        size="sm"
        aria-label={labels.searchValuesName}
        placeholder={labels.searchValues}
        value={search}
        onValueChange={setSearch}
        onKeyDown={intoList}
      />
      {/* The keys are those of the boxes inside it; the group only moves the focus among them. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={listRef}
        role="group"
        aria-label={labels.filterColumn(column.caption, false)}
        className="flg-data-grid-value-list"
        onKeyDown={onKeyDown}
        onFocus={onFocus}
      >
        <Checkbox
          tabIndex={stop === 0 ? 0 : -1}
          disabled={shown.length === 0}
          checked={shown.length > 0 && checkedShown === shown.length}
          indeterminate={checkedShown > 0 && checkedShown < shown.length}
          onCheckedChange={toggleShown}
        >
          {labels.selectAllValues}
        </Checkbox>
        <Divider decorative />
        {drawn.map((item, index) => (
          <Checkbox
            key={keyOf(item.value)}
            className={item.value === null ? 'flg-data-grid-value-blank' : undefined}
            tabIndex={stop === index + 1 ? 0 : -1}
            checked={checked.has(item.value)}
            onCheckedChange={(on) => toggle(item.value, on)}
          >
            {textOf(item)}
          </Checkbox>
        ))}
      </div>
      {shown.length > drawn.length ? (
        <p className="flg-data-grid-value-more">{labels.moreValues(drawn.length, shown.length)}</p>
      ) : null}
    </>
  );
}
