import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { isIsoDate } from '../../../internal/date';
import { isNumber } from '../../../internal/number';
import { isComposing } from '../../../internal/roving';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import { DatePicker } from '../../date-picker/DatePicker';
import { Input } from '../../input/Input';
import { Select, SelectItem } from '../../select/Select';
import type { ResolvedColumn } from '../engine/columns';
import type { PinPlace } from '../engine/layout';
import {
  conditionOf,
  formatFilterNumber,
  parseFilterNumber,
  shownOperator,
  withRowCondition,
} from '../engine/filter';
import { useFilterView } from '../filter-context';
import { useGridContext } from '../grid-context';
import { BetweenFilter } from './BetweenFilter';
import { OperatorButton } from './OperatorButton';
import { pinAttributes } from './pin-attributes';

/** How long after the last key of a filter cell what was typed is applied, in milliseconds. */
export const FILTER_DELAY = 400;

/**
 * What a typed cell holds as the cell reads it: the text of a string column, `''` for none; the number of a
 * number column, `undefined` for none. What the cell compares with what it last sent or took.
 */
type Held = string | number | undefined;

const heldOf = (value: unknown, numeric: boolean): Held => {
  if (numeric) return isNumber(value) ? value : undefined;
  return typeof value === 'string' ? value : '';
};
const showHeld = (held: Held, locale: string): string =>
  typeof held === 'number' ? formatFilterNumber(held, locale) : (held ?? '');
const readText = (text: string, numeric: boolean, locale: string): Held =>
  numeric ? (parseFilterNumber(text, locale) ?? undefined) : text;

/**
 * The input of a string column and of a number column (spec phase 6 §3.6, §4.3 F1, §6.3): the operator's
 * button is its start content. It keeps the text it shows, so a keystroke draws this cell and nothing else;
 * the text goes to the column's condition `FILTER_DELAY` after the last key, or at once for Enter and when
 * the input is left (pressing the operator button is leaving it). Esc with text in the input clears it, and
 * that is applied at once; the key is cancelled, so the grid does not take it, and the next Esc, with no text,
 * is the grid's. A condition that the filter takes from outside (a controlled parent, `clearFilter()`)
 * replaces the text and drops a pending one; one the cell sent itself, which a parent may give back later
 * than a newer keystroke, does not. The operator the user chose stays.
 *
 * A number is read by `parseFilterNumber` in the grid's locale and held as a number (the state holds numbers
 * only). Text that is no number is marked `invalid` and stays as typed; it is applied as no value, so the
 * condition it replaces goes (once: a condition that was not there is not touched).
 */
function TypedFilter<TRow>({
  column,
  numeric,
}: {
  column: ResolvedColumn<TRow>;
  numeric: boolean;
}) {
  const { labels, locale } = useGridContext<TRow>();
  const { filter, apply } = useFilterView();
  const held = heldOf(conditionOf(filter, column.id)?.value, numeric);
  const [text, setText] = useState(() => showHeld(held, locale));
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // The text that waits for the timer, `null` when none does.
  const pending = useRef<string | null>(null);
  // The value this cell last sent or took from the filter: what tells a change from outside from the echo
  // of one of its own.
  const known = useRef(held);
  const latest = useRef({ filter, locale });
  useWriteOnCommit(() => {
    latest.current = { filter, locale };
  });

  const drop = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    pending.current = null;
  }, []);
  const id = column.id;
  const send = useCallback(
    (next: string) => {
      drop();
      const { filter: now, locale: where } = latest.current;
      const sent = readText(next, numeric, where);
      known.current = sent;
      apply(withRowCondition(now, id, conditionOf(now, id)?.operator, sent));
    },
    [apply, drop, id, numeric],
  );
  const flush = () => {
    if (pending.current !== null) send(pending.current);
  };

  useEffect(() => {
    if (Object.is(held, known.current)) return;
    known.current = held;
    drop();
    setText(showHeld(held, locale));
  }, [held, locale, drop]);
  useEffect(() => drop, [drop]);

  const change = (next: string) => {
    setText(next);
    drop();
    pending.current = next;
    timer.current = setTimeout(() => send(next), FILTER_DELAY);
  };

  return (
    <Input
      size="sm"
      autoComplete="off"
      inputMode={numeric ? 'decimal' : undefined}
      className={numeric ? 'flg-data-grid-filter-number' : undefined}
      invalid={numeric && text.trim() !== '' && readText(text, true, locale) === undefined}
      aria-label={labels.filterCell(column.caption)}
      startContent={<OperatorButton column={column} />}
      value={text}
      onChange={(event: ChangeEvent<HTMLInputElement>) => change(event.target.value)}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        // Enter that confirms a candidate of an input method is the method's.
        if (event.key === 'Enter' && !isComposing(event)) flush();
        // Esc that clears: not while a method composes, and not with no text, which is the grid's Esc.
        if (event.key === 'Escape' && !isComposing(event) && text !== '') {
          event.preventDefault();
          setText('');
          send('');
        }
      }}
      onBlur={flush}
    />
  );
}

/**
 * The DatePicker of a date column and of a datetime column (spec phase 6 §4.3 F1, §6.3): its calendar button
 * is the picker's own, the operator's button its start content. A day typed (when the text is left or Enter
 * is pressed) or picked applies at once, with the operator the user chose; emptying the text takes the value
 * away. A datetime is filtered by its day in the grid's time zone (`filterKey`), so the picker holds a day
 * for both. The picker is controlled by the filter, so a condition that changes from outside is shown.
 */
function DateFilter<TRow>({ column }: { column: ResolvedColumn<TRow> }) {
  const { labels, locale } = useGridContext<TRow>();
  const { filter, apply } = useFilterView();
  const condition = conditionOf(filter, column.id);
  const day = condition?.value;
  return (
    <DatePicker
      size="sm"
      locale={locale}
      aria-label={labels.filterCell(column.caption)}
      startContent={<OperatorButton column={column} />}
      value={isIsoDate(day) ? day : null}
      onValueChange={(next) =>
        apply(withRowCondition(filter, column.id, condition?.operator, next ?? undefined))
      }
    />
  );
}

// The value of the "(All)" item: a choice that takes the condition away. The other items' are their indexes.
const ALL = 'all';

/**
 * The Select of a boolean and of a lookup (spec phase 6 §4.3 F1, §6.3): no operator, its first item is the
 * way back to no condition ("(All)", which the placeholder alone does not give). The values of a Select are
 * strings, so an item's is its index, and the condition holds the item's own value (a lookup's may be a
 * number). A choice applies at once, with `=`. A held value that no item has shows the placeholder.
 */
function ChoiceFilter<TRow>({ column }: { column: ResolvedColumn<TRow> }) {
  const { labels } = useGridContext<TRow>();
  const { filter, apply } = useFilterView();
  const choices = column.choices ?? [
    { value: true, text: column.keyText(true) },
    { value: false, text: column.keyText(false) },
  ];
  const value = conditionOf(filter, column.id)?.value;
  const at = choices.findIndex((choice) => Object.is(choice.value, value));
  return (
    <Select
      size="sm"
      aria-label={labels.filterCell(column.caption)}
      placeholder={labels.all}
      value={at >= 0 ? String(at) : null}
      onValueChange={(chosen) => {
        const choice = chosen === ALL ? undefined : choices[Number(chosen)];
        apply(
          choice
            ? withRowCondition(filter, column.id, '=', choice.value)
            : withRowCondition(filter, column.id, undefined, undefined),
        );
      }}
    >
      <SelectItem value={ALL}>{labels.all}</SelectItem>
      {choices.map((choice, index) => (
        <SelectItem key={index} value={String(index)}>
          {choice.text}
        </SelectItem>
      ))}
    </Select>
  );
}

// What a column draws in its cell: the control of its kind. A range (`between`) of numbers or days is a cell
// of its own, which opens the filter popover.
function ControlOf<TRow>({ column }: { column: ResolvedColumn<TRow> }) {
  const { filter } = useFilterView();
  if (column.choices || column.dataType === 'boolean') return <ChoiceFilter column={column} />;
  if (column.dataType === 'string') return <TypedFilter column={column} numeric={false} />;
  if (shownOperator(column, conditionOf(filter, column.id)) === 'between') {
    return <BetweenFilter column={column} />;
  }
  return column.dataType === 'number' ? (
    <TypedFilter column={column} numeric />
  ) : (
    <DateFilter column={column} />
  );
}

/**
 * A cell of the filter row. It is a cell of the grid, the Tab stop when it is the active one, and it holds
 * its control, which has the focus only after Enter or F2 (the data grid pattern of the APG). A column that
 * does not filter (`allowFiltering`) and the column of boxes have an empty cell, so the row has as many
 * cells as the titles.
 */
export function FilterCell<TRow>({
  column,
  isActive,
  pin,
}: {
  column: ResolvedColumn<TRow>;
  /** Whether this cell is the active cell, the one Tab stop of the grid. */
  isActive: boolean;
  /** Where the cell sticks, if its column is pinned. */
  pin: PinPlace | undefined;
}) {
  const filters = column.service === undefined && column.allowFiltering;
  return (
    <td
      className="flg-table-cell flg-data-grid-filter-cell"
      tabIndex={isActive ? 0 : -1}
      data-align={column.align}
      data-service={column.service}
      {...pinAttributes(pin)}
    >
      {filters ? <ControlOf column={column} /> : null}
    </td>
  );
}
