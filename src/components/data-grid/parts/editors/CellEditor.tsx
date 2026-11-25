import { useRef, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { getFocusables } from '../../../../internal/focus';
import { useIsoLayoutEffect } from '../../../../internal/use-iso-layout-effect';
import { Checkbox } from '../../../checkbox/Checkbox';
import { Combobox, ComboboxItem } from '../../../combobox/Combobox';
import { DatePicker } from '../../../date-picker/DatePicker';
import { Input } from '../../../input/Input';
import { NumberInput } from '../../../number-input/NumberInput';
import { Select, SelectItem } from '../../../select/Select';
import type { ResolvedColumn } from '../../engine/columns';
import { editorKind, toEditorValue } from '../../engine/editor-values';
import type { FlatDataRow } from '../../engine/flatten';
import { useEditContext } from '../../edit-context';
import type { EditContextValue } from '../../edit-context';
import { focusInto } from '../../grid-dom';
import { useGridContext } from '../../grid-context';
import type { ExternalStore } from '../../hooks/use-external-store';
import type { DataGridEditorContext } from '../../types';

/**
 * What one editor reads of the draft: its own field, as `read` makes it of the row with the draft over it.
 * The snapshot is remembered by the draft and the row it was made from, and is the earlier value while the new
 * one is the same, so a key typed in another editor draws this one for nothing, and a value made anew in each
 * read (a computed column's) never loops.
 */
function useDraftValue<TRow, T>(
  store: ExternalStore<Partial<TRow>>,
  row: TRow,
  read: (held: TRow) => T,
): T {
  const kept = useRef<{ draft: Partial<TRow> | null; row: TRow; value: T } | null>(null);
  const snapshot = (): T => {
    const draft = store.get();
    const last = kept.current;
    if (last && last.draft === draft && last.row === row) return last.value;
    const value = read(draft === null ? row : { ...row, ...draft });
    const same = last !== null && Object.is(last.value, value);
    kept.current = { draft, row, value: same ? last.value : value };
    return kept.current.value;
  };
  return useSyncExternalStore(store.subscribe, snapshot, snapshot);
}

interface EditorProps<TRow> {
  column: ResolvedColumn<TRow>;
  flat: FlatDataRow<TRow>;
  edit: EditContextValue<TRow>;
  /** Whether a save is pending: the editors cannot change. */
  saving: boolean;
}

// `String` options an Intl format of the column gives a NumberInput.
function numberOptions<TRow>(column: ResolvedColumn<TRow>): Intl.NumberFormatOptions | undefined {
  const { format } = column.column;
  return typeof format === 'object' && format !== null && !column.choices
    ? (format as Intl.NumberFormatOptions)
    : undefined;
}

/** The editor the grid makes for the type of a column (`editorKind`): the cell edits the value as the cell shows it. */
function DefaultEditor<TRow>({ column, flat, edit, saving }: EditorProps<TRow>) {
  const { locale } = useGridContext<TRow>();
  const kind = editorKind(column);
  const value = useDraftValue(edit.draft, flat.row, (held) => toEditorValue(column, held));
  const set = (next: unknown): void => edit.setValue(column.id, next);
  const common = { size: edit.size, 'aria-label': column.caption } as const;
  switch (kind) {
    case 'string':
      return (
        <Input
          {...common}
          autoComplete="off"
          value={value as string}
          readOnly={saving}
          onChange={(event) => set(event.target.value)}
        />
      );
    case 'number':
      return (
        <NumberInput
          {...common}
          locale={locale}
          formatOptions={numberOptions(column)}
          value={value as number | null}
          readOnly={saving}
          onValueChange={set}
        />
      );
    case 'date':
      return (
        <DatePicker
          {...common}
          locale={locale}
          value={value as string | null}
          readOnly={saving}
          onValueChange={set}
        />
      );
    case 'boolean':
      return (
        <span className="flg-data-grid-editor-box">
          <Checkbox
            aria-label={column.caption}
            checked={value === true}
            onCheckedChange={(checked) => set(checked)}
          />
        </span>
      );
    case 'select':
      return (
        <Select {...common} value={value as string | null} onValueChange={(next) => set(next)}>
          {column.choices!.map((choice) => (
            <SelectItem key={String(choice.value)} value={String(choice.value)}>
              {choice.text}
            </SelectItem>
          ))}
        </Select>
      );
    case 'combobox':
      return (
        <Combobox {...common} value={value as string | null} onValueChange={(next) => set(next)}>
          {column.choices!.map((choice) => (
            <ComboboxItem key={String(choice.value)} value={String(choice.value)}>
              {choice.text}
            </ComboboxItem>
          ))}
        </Combobox>
      );
    default:
      return null;
  }
}

/** The editor a column's own `editor` makes: it is given the value as the row holds it. */
function OwnEditor<TRow>({
  column,
  flat,
  edit,
  takeFocus,
}: EditorProps<TRow> & { takeFocus: boolean }) {
  // A column's `editor` was typed for the value of its own field, and the grid calls it with the value it read
  // from that field, so `any` is the one honest type for a list of columns (as `ResolvedCell` is).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const own = column.column.editor as (ctx: DataGridEditorContext<TRow, any>) => ReactNode;
  const held = useDraftValue(edit.draft, flat.row, (now) => ({
    row: now as Partial<TRow>,
    value: column.value(now) ?? null,
  }));
  // The grid's own editors keep the draft apart for each field; this one reads the value and the row as one
  // object, which is the same while the draft and the row are.
  return own({
    row: held.row,
    value: held.value,
    setValue: (next: unknown) => edit.setRaw(column.id, next),
    commit: () => {},
    cancel: edit.cancel,
    invalid: false,
    errorId: undefined,
    mode: edit.mode,
    size: edit.size,
    autoFocus: takeFocus,
    label: column.caption,
  });
}

/**
 * The editor of a cell of the row being edited (spec phase 6 §6.3): the column's own `editor` when it has one,
 * else the one its type has. It takes the focus when it appears, if it is the one the edit was started on (a
 * layout effect, so the focus is there before the browser paints): the first control of the cell, scrolled
 * into view the least it takes, never by the browser's own scroll.
 */
export function CellEditor<TRow>({
  column,
  flat,
  takeFocus,
  saving,
}: {
  column: ResolvedColumn<TRow>;
  flat: FlatDataRow<TRow>;
  /** Whether the editor takes the focus when it appears. */
  takeFocus: boolean;
  saving: boolean;
}) {
  const edit = useEditContext<TRow>()!;
  const box = useRef<HTMLDivElement>(null);
  useIsoLayoutEffect(() => {
    const root = box.current;
    const cell = root?.closest<HTMLElement>('td, th');
    if (!takeFocus || !root || !cell) return;
    const control = getFocusables(root)[0];
    if (control) focusInto(control, cell);
    // Once, when the editor appears: a press on a later render never takes the focus back.
  }, []);
  const props = { column, flat, edit, saving };
  return (
    <div ref={box} className="flg-data-grid-editor">
      {typeof column.column.editor === 'function' ? (
        <OwnEditor {...props} takeFocus={takeFocus} />
      ) : (
        <DefaultEditor {...props} />
      )}
    </div>
  );
}
