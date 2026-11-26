import { useId, useRef, useState, useSyncExternalStore } from 'react';
import type { FocusEvent, ReactNode } from 'react';
import { devWarn } from '../../../../internal/warn';
import { getFocusables } from '../../../../internal/focus';
import { useIsoLayoutEffect } from '../../../../internal/use-iso-layout-effect';
import { Checkbox } from '../../../checkbox/Checkbox';
import { Combobox, ComboboxItem } from '../../../combobox/Combobox';
import { DatePicker } from '../../../date-picker/DatePicker';
import { Input } from '../../../input/Input';
import { NumberInput } from '../../../number-input/NumberInput';
import { Select, SelectItem } from '../../../select/Select';
import { Textarea } from '../../../textarea/Textarea';
import type { ResolvedColumn } from '../../engine/columns';
import { blankEditorValue, editorKind, toEditorValue } from '../../engine/editor-values';
import { readOfRow } from '../../engine/edit';
import type { FlatDataRow } from '../../engine/flatten';
import { useEditContext } from '../../edit-context';
import type { EditContextValue } from '../../edit-context';
import { focusInto, leavesField } from '../../grid-dom';
import { useGridContext } from '../../grid-context';
import type { ExternalStore } from '../../hooks/use-external-store';
import type { DataGridEditorContext } from '../../types';
import { EditorBox } from '../EditError';

/**
 * What one editor reads of the draft: its own field, as `read` makes it of the row with the draft over it.
 * The snapshot is remembered by the draft and the row it was made from, and is the earlier value while the new
 * one is the same, so a key typed in another editor draws this one for nothing, and a value made anew in each
 * read (a computed column's) never loops.
 */
export function useDraftValue<TRow, T>(
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
  /** The row the draft is over: the saved row, or the fields of a new one. */
  row: TRow;
  edit: EditContextValue<TRow>;
  /** The size the editor is drawn at. */
  size: 'sm' | 'md';
  /** Whether a save is pending: the editors cannot change. */
  saving: boolean;
  /** The id of the words that say why the field is refused, while it is; `undefined` while it is not. */
  errorId: string | undefined;
  /**
   * Whether a `Field` names the editor with its own `<label for>` (the form and the popup): it then has that one name
   * and no `aria-label` beside it. A cell has no label, so its editor is named by the caption of its column.
   */
  labelled?: boolean;
}

// `String` options an Intl format of the column gives a NumberInput.
function numberOptions<TRow>(column: ResolvedColumn<TRow>): Intl.NumberFormatOptions | undefined {
  const { format } = column.column;
  return typeof format === 'object' && format !== null && !column.choices
    ? (format as Intl.NumberFormatOptions)
    : undefined;
}

/** The editor the grid makes for the type of a column (`editorKind`): the cell edits the value as the cell shows it. */
function DefaultEditor<TRow>({
  column,
  row,
  edit,
  size,
  saving,
  errorId,
  labelled = false,
}: EditorProps<TRow>) {
  const { locale } = useGridContext<TRow>();
  const kind = editorKind(column);
  const value = useDraftValue(edit.draft, row, (held) =>
    readOfRow(row, () => toEditorValue(column, held), blankEditorValue(column)),
  );
  const set = (next: unknown): void => edit.setValue(column.id, next);
  // A field that is refused says so to the editor, and is described by the words hidden in its cell.
  const common = {
    size,
    'aria-label': labelled ? undefined : column.caption,
    invalid: errorId === undefined ? undefined : true,
    'aria-describedby': errorId,
  } as const;
  switch (kind) {
    case 'string':
      // A long text is a Textarea: the form and the popup edit it, the cells do not (`canEdit`).
      if (column.column.multiline === true) {
        return (
          <Textarea
            aria-label={common['aria-label']}
            invalid={common.invalid}
            aria-describedby={errorId}
            value={value as string}
            readOnly={saving}
            onChange={(event) => set(event.target.value)}
          />
        );
      }
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
            aria-label={common['aria-label']}
            invalid={common.invalid}
            aria-describedby={errorId}
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
  row,
  edit,
  size,
  saving,
  errorId,
  takeFocus,
  labelled,
}: EditorProps<TRow> & { takeFocus: boolean }) {
  // A column's `editor` was typed for the value of its own field, and the grid calls it with the value it read
  // from that field, so `any` is the one honest type for a list of columns (as `ResolvedCell` is).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const own = column.column.editor as (ctx: DataGridEditorContext<TRow, any>) => ReactNode;
  const held = useDraftValue(edit.draft, row, (now) => ({
    row: now as Partial<TRow>,
    value: readOfRow(row, () => column.value(now), null) ?? null,
  }));
  // The grid's own editors keep the draft apart for each field; this one reads the value and the row as one
  // object, which is the same while the draft and the row are.
  try {
    return own({
      row: held.row,
      value: held.value,
      setValue: (next: unknown) => edit.setRaw(column.id, next),
      commit: () => edit.commit(column.id),
      cancel: edit.cancel,
      invalid: errorId !== undefined,
      errorId,
      mode: edit.mode,
      size,
      autoFocus: takeFocus,
      label: column.caption,
    });
  } catch {
    // The app's `editor` runs in a render, so a throw would take the grid down: the editor of the type is drawn.
    devWarn('<DataGrid> a column editor threw: the default editor of its type is used.');
    return (
      <DefaultEditor
        column={column}
        row={row}
        edit={edit}
        size={size}
        saving={saving}
        errorId={errorId}
        labelled={labelled}
      />
    );
  }
}

/**
 * The editor of a column in a row: the column's own `editor` when it has one, else the one its type has. It reads and
 * writes its own field of the draft and holds no place of its own, so the cell, the form and the popup use it alike.
 */
export function FieldEditor<TRow>({
  takeFocus,
  ...props
}: EditorProps<TRow> & { takeFocus: boolean }) {
  return typeof props.column.column.editor === 'function' ? (
    <OwnEditor {...props} takeFocus={takeFocus} />
  ) : (
    <DefaultEditor {...props} />
  );
}

/** Puts the caret at the end of the text of a field; a field of a kind that has no caret (a date input) is left. */
function caretToEnd(field: HTMLInputElement | HTMLTextAreaElement): void {
  try {
    field.setSelectionRange(field.value.length, field.value.length);
  } catch {
    // Not a field of text.
  }
}

/**
 * Replaces the text of a field with `text`, as a key typed in it would: the value is written the way a user's
 * input writes it (the native setter, which React's own tracking does not see) and `input` is sent, so the
 * editor's own handler reads it and the character is typed once.
 */
function typeInto(field: HTMLInputElement | HTMLTextAreaElement, text: string): void {
  const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
  Object.getOwnPropertyDescriptor(prototype.prototype, 'value')?.set?.call(field, text);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  caretToEnd(field);
}

/**
 * The editor of a cell of the row being edited (spec phase 6 §6.3): the column's own `editor` when it has one,
 * else the one its type has. It takes the focus when it appears, if it is the one the edit was started on (a
 * layout effect, so the focus is there before the browser paints): the first control of the cell, scrolled
 * into view the least it takes, never by the browser's own scroll. It also takes it when a save found its field
 * wrong and asks (`refocus` counts the asks), and lets its field be checked when the focus leaves it for another
 * cell (`commit`). In `cell` mode it opens with the caret at the end of its text, or with the character that
 * started the edit as its text. While its field is refused it is marked and described by the words of the message.
 */
export function CellEditor<TRow>({
  column,
  flat,
  takeFocus: asked,
  saving,
  message,
  refocus,
  typed,
  caretAtEnd,
}: {
  column: ResolvedColumn<TRow>;
  flat: FlatDataRow<TRow>;
  /** Whether the editor takes the focus when it appears. */
  takeFocus: boolean;
  /** The character that started the edit, which the editor opens with as its text; `null` for none. */
  typed: string | null;
  /** Whether the caret goes to the end of the text when the editor takes the focus (`cell` mode). */
  caretAtEnd: boolean;
  saving: boolean;
  /** Why the field is refused; `undefined` while it is not. */
  message: string | undefined;
  /** How many times a save has asked this editor for the focus; `0` while none has. */
  refocus: number;
}) {
  const edit = useEditContext<TRow>()!;
  // Asked when the editor appears, and the same for as long as it lives: the grid clears the ask once it was met, which
  // a later draw of this editor must not read as a change.
  const [takeFocus] = useState(asked);
  const box = useRef<HTMLDivElement>(null);
  const messageId = useId();
  const errorId = message === undefined ? undefined : messageId;
  const take = (): HTMLElement | undefined => {
    const root = box.current;
    const cell = root?.closest<HTMLElement>('td, th');
    const control = root ? getFocusables(root)[0] : undefined;
    if (control && cell) focusInto(control, cell);
    return control;
  };
  useIsoLayoutEffect(() => {
    // Once, when the editor appears: a press on a later render never takes the focus back.
    if (!takeFocus) return;
    const control = take();
    edit.taken();
    if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
      if (typed !== null) typeInto(control, typed);
      else if (caretAtEnd) caretToEnd(control);
    }
  }, []);
  useIsoLayoutEffect(() => {
    if (refocus > 0) take();
  }, [refocus]);
  // The field is settled when the focus goes out of the editor, to another place (a popup of the editor is
  // part of it: its focus comes and goes inside).
  const settle = (event: FocusEvent<HTMLElement>): void => {
    if (leavesField(event)) edit.commit(column.id);
  };
  return (
    <EditorBox
      message={message}
      errorId={messageId}
      boxRef={box}
      onSettle={settle}
      refocus={refocus}
    >
      <FieldEditor
        column={column}
        row={flat.row}
        edit={edit}
        size={edit.size}
        saving={saving}
        errorId={errorId}
        takeFocus={takeFocus}
      />
    </EditorBox>
  );
}
