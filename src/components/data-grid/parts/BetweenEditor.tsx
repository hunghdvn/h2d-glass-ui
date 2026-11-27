import { useEffect, useRef, useState } from 'react';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import { DatePicker } from '../../date-picker/DatePicker';
import { Field } from '../../field/Field';
import { Input } from '../../input/Input';
import type { ResolvedColumn } from '../engine/columns';
import {
  conditionOf,
  formatFilterNumber,
  parseFilterNumber,
  rangeEnds,
  withRowCondition,
} from '../engine/filter';
import { useFilterView } from '../filter-context';
import { useGridContext } from '../grid-context';
import type { ApplyRef } from './FilterPopover';

// An end as the editor holds it: the text of a number, as the user types it, or the ISO day of a date; `''`
// for an open end.
type End = string;

// An end of the range as it goes to the filter: a number or a day, `undefined` for an open end, `null` for
// text that is no number (which the editor cannot apply).
const endOf = (text: End, numeric: boolean, locale: string): number | string | null | undefined => {
  if (text.trim() === '') return undefined;
  return numeric ? parseFilterNumber(text, locale) : text;
};

/**
 * The content of the filter popover for a range (`between`) of numbers or days (spec phase 6 §6.3, outside
 * the mockup): two fields, "From" and "To", each with the editor of the column's type, a number `Input` or a
 * `DatePicker`; they start from the ends the condition holds. It gives its OK to the popover through
 * `applyRef`: both ends go to the condition as `[from, to]`, an empty end is `null` and open, both empty is no
 * value (the operator stays). An end whose text cannot be read, a number that is no number or text that is
 * no day (the picker says so itself, by `aria-invalid` on its input), cannot be applied: OK answers
 * `false`, so the popover stays open with the focus on that field. Ends that are read are applied as typed,
 * an inverted range too (`[21, 12]`): the cell says it and the grid shows that no row matches.
 */
export function BetweenEditor<TRow>({
  column,
  applyRef,
}: {
  column: ResolvedColumn<TRow>;
  applyRef: ApplyRef;
}) {
  const { labels, controlLabels, locale } = useGridContext<TRow>();
  const { filter, apply } = useFilterView();
  const numeric = column.dataType === 'number';
  const [start, finish] = rangeEnds(column, conditionOf(filter, column.id)?.value);
  const shown = (end: number | string | undefined): End =>
    typeof end === 'number' ? formatFilterNumber(end, locale) : (end ?? '');
  const [from, setFrom] = useState<End>(() => shown(start));
  const [to, setTo] = useState<End>(() => shown(finish));
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  useWriteOnCommit(() => {
    applyRef.current = () => {
      const ends = [endOf(from, numeric, locale), endOf(to, numeric, locale)];
      // A picker keeps the day it had for text that is no day, so its own verdict is what says so.
      const bad = ends.findIndex(
        (end, index) =>
          end === null ||
          (!numeric &&
            (index === 0 ? fromRef : toRef).current?.getAttribute('aria-invalid') === 'true'),
      );
      if (bad >= 0) {
        (bad === 0 ? fromRef : toRef).current?.focus({ preventScroll: true });
        return false;
      }
      const open = ends.every((end) => end === undefined);
      apply(
        withRowCondition(
          filter,
          column.id,
          'between',
          open ? undefined : ends.map((end) => end ?? null),
        ),
      );
      return true;
    };
  });
  // The popover draws its content only while it is open: what it may ask of this editor goes with it.
  useEffect(
    () => () => {
      applyRef.current = undefined;
    },
    [applyRef],
  );

  // Keyed by their place: a translation may give both ends the same text, or none.
  const fields: [string, string, End, (next: End) => void, typeof fromRef][] = [
    ['from', labels.from, from, setFrom, fromRef],
    ['to', labels.to, to, setTo, toRef],
  ];
  return (
    <>
      {fields.map(([key, label, text, set, ref]) => (
        <Field key={key} label={label}>
          {numeric ? (
            <Input
              ref={ref}
              size="sm"
              autoComplete="off"
              inputMode="decimal"
              className="flg-data-grid-filter-number"
              invalid={text.trim() !== '' && endOf(text, true, locale) === null ? true : undefined}
              value={text}
              onChange={(event) => set(event.target.value)}
            />
          ) : (
            <DatePicker
              ref={ref}
              size="sm"
              locale={locale}
              labels={controlLabels.date}
              value={text === '' ? null : text}
              onValueChange={(next) => set(next ?? '')}
            />
          )}
        </Field>
      ))}
    </>
  );
}
