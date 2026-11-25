import { createContext, useContext } from 'react';
import type { RowMarks } from './engine/edit';
import type { ExternalStore } from './hooks/use-external-store';
import type { DataGridEditMode, DataGridEditing, DataGridKey } from './types';

/** The row being edited, as the rows read it: apart from the rest, so only that row draws for a change of it. */
export interface EditTarget {
  readonly key: DataGridKey;
  /** The id of the column whose editor takes the focus when the edit starts; `null` is the first one. */
  readonly focus: string | null;
  /** The one column that has an editor in `cell` mode; `null` in the modes that edit the whole row. */
  readonly column: string | null;
  /** Whether the editor of `focus` takes the focus when it appears: not when a refused value comes back to its cell. */
  readonly take: boolean;
  /** The character that started the edit in `cell` mode, which the editor opens with as its text. */
  readonly typed: string | null;
  /** Whether a save is pending: the editors cannot change and the save button loads. */
  readonly saving: boolean;
  /** The messages of the row's fields, by column id: the same map while none changes. */
  readonly errors: ReadonlyMap<string, string>;
  /** Asks the editor of a column to take the focus (a save found it wrong); each ask has its own `n`. */
  readonly refocus: { readonly column: string; readonly n: number } | null;
}

/**
 * What the parts that edit share while `editing` is on: the mode, the actions (the same functions for as long
 * as the grid lives, so a row that reads them never draws for their sake) and the draft of the row being
 * edited, which each editor reads its own field of. The row being edited is not here, but in
 * `EditViewContext`, which the body reads and hands to each row as a prop.
 */
export interface EditContextValue<TRow = unknown> {
  config: DataGridEditing<TRow>;
  mode: DataGridEditMode;
  /** The size the editors are drawn at: `sm` in a `compact` grid. */
  size: 'sm' | 'md';
  /** The fields typed in the row being edited; `null` while none is. */
  draft: ExternalStore<Partial<TRow>>;
  /**
   * Starts editing the row with this key; `columnId` is the column that takes the focus. In `cell` mode it starts
   * the edit of that cell (the one being edited is committed first), with `text` typed in it when a character did it.
   */
  start(key: DataGridKey, columnId?: string, text?: string): void;
  /**
   * A press on a cell in `cell` mode: a plain boolean is flipped and committed (as `Space` does, with no editor
   * opened first), any other cell starts its edit.
   */
  press(key: DataGridKey, columnId: string): void;
  /** Sets the value of a column of the row being edited, from what a default editor holds. */
  setValue(columnId: string, value: unknown): void;
  /** Sets it from a value as the row holds it, which is what a column's own `editor` gives. */
  setRaw(columnId: string, value: unknown): void;
  /** Settles a field of the row being edited, as its editor lets go of it: the rules of its column run. */
  commit(columnId: string): void;
  /** Saves the row being edited. */
  save(): void;
  /** Gives the edit up. */
  cancel(): void;
  /**
   * Asks to delete a row: the dialog opens, or the delete is sent when `confirmDelete` is off. In `batch` mode
   * the row is only marked, and a new row is given up.
   */
  remove(key: DataGridKey): void;
  /** Takes the mark of a deletion off a row (`batch` mode): the row has the edits it had. */
  undo(key: DataGridKey): void;
}

export const EditContext = createContext<EditContextValue | null>(null);

/** The row being edited, for the body; `null` when no row is. */
export const EditViewContext = createContext<EditTarget | null>(null);

/**
 * The marks of the rows that have a change in `batch` mode, by key: read by the body, which hands each row its own,
 * the same object while that row's change is, so a change draws that row and no other.
 */
export const EditMarksContext = createContext<ReadonlyMap<DataGridKey, RowMarks>>(new Map());

/** The edit context of the grid the part is in; `null` when the grid does not edit. */
export function useEditContext<TRow>(): EditContextValue<TRow> | null {
  return useContext(EditContext) as EditContextValue<TRow> | null;
}
