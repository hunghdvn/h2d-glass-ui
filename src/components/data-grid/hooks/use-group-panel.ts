import { useCallback, useMemo, useRef } from 'react';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import type { ResolvedColumn } from '../engine/columns';
import { insertLevel, regroupLevels } from '../engine/group-panel';
import type { DataGridGroupItem, DataGridLabels, DataGridSortDirection } from '../types';
import { captionOf } from './use-column-actions';
import { useKept } from './use-kept';

/** A chip of the group panel: one level of the grouping, as the panel draws it. */
export interface GroupChip {
  field: string;
  caption: string;
  direction: DataGridSortDirection;
}

const sameChips = (a: readonly GroupChip[], b: readonly GroupChip[]) =>
  a.length === b.length &&
  a.every(
    (chip, at) =>
      chip.field === b[at]!.field &&
      chip.caption === b[at]!.caption &&
      chip.direction === b[at]!.direction,
  );

export interface GroupPanelOptions<TRow> {
  /**
   * Whether the grid draws the panel: `groupPanel`, not server mode, and the toolbar places the tray. The
   * grid groups from the menu and the titles only then.
   */
  panel: boolean;
  /** The grouping as the grid holds it, and the items of it that group, in order. */
  held: readonly DataGridGroupItem[];
  levels: readonly DataGridGroupItem[];
  /** The one way the grouping changes (`useGridGrouping`): callbacks, the first page, the sentence. */
  applyGrouping: (next: readonly DataGridGroupItem[], said?: string) => void;
  /** The caller's columns, shown or not: a chip says the caption of its column. */
  resolved: readonly ResolvedColumn<TRow>[];
  /** Whether more than one data column is shown: a grouping must leave one shown. */
  hideable: boolean;
  labels: DataGridLabels;
}

export interface GroupPanelControl {
  /** The chips, in the order of the levels, kept by value. */
  chips: readonly GroupChip[];
  /** Whether the grid would group by the column now: it allows it, it is not grouped by, a column stays shown. */
  canGroup: (columnId: string) => boolean;
  /** Whether a title may be dropped on the panel: the panel is drawn and `canGroup`. */
  accepts: (columnId: string) => boolean;
  /** Adds the column as a level, ascending, at `slot` of the levels (the end without one). */
  group: (columnId: string, slot?: number) => void;
  /** Takes the level of the field out of the grouping. */
  ungroup: (field: string) => void;
  /** Turns the direction of the level of the field. */
  turn: (field: string) => void;
  /** Moves the level of the field one place; `false` at the edge, where nothing changed. */
  step: (field: string, step: -1 | 1) => boolean;
  /** Moves the level of the field to the place `to` (from 0) among the levels. */
  moveTo: (field: string, to: number) => void;
}

/**
 * What the user does to the grouping from the group panel and the column menu (spec phase 6 §3.8, §6.3
 * "Nhóm"): each is one change through `applyGrouping`, with the sentence it says. They build the new
 * grouping from the one the grid holds, and keep the items that do not group where they are. The
 * functions read what they need when they are called and are the same for as long as the grid lives, so
 * the chips, which are keyed by their field, draw only when a level changes.
 */
export function useGroupPanel<TRow>(options: GroupPanelOptions<TRow>): GroupPanelControl {
  const { levels, resolved } = options;
  const latest = useRef(options);
  useWriteOnCommit(() => {
    latest.current = options;
  });

  const list = useMemo(
    () =>
      levels.map((item) => ({
        field: item.field,
        caption: captionOf(resolved, item.field),
        direction: item.direction,
      })),
    [levels, resolved],
  );
  const chips = useKept(list, sameChips);

  const canGroup = useCallback((columnId: string) => {
    const { panel, levels: now, resolved: columns, hideable } = latest.current;
    const column = columns.find((other) => other.id === columnId);
    return (
      panel &&
      hideable &&
      column?.allowGrouping === true &&
      !now.some((item) => item.field === columnId)
    );
  }, []);
  // `canGroup` already needs the panel drawn, so what the panel accepts is what can be grouped.
  const accepts = canGroup;

  const group = useCallback(
    (columnId: string, slot?: number) => {
      if (!canGroup(columnId)) return;
      const { held, levels: now, applyGrouping, resolved: columns, labels } = latest.current;
      const item: DataGridGroupItem = { field: columnId, direction: 'asc' };
      const next =
        slot === undefined || slot >= now.length
          ? [...held, item]
          : insertLevel(held, now, item, Math.max(0, slot));
      applyGrouping(next, labels.announceGrouped(captionOf(columns, columnId)));
    },
    [canGroup],
  );

  const ungroup = useCallback((field: string) => {
    const { held, levels: now, applyGrouping, resolved: columns, labels } = latest.current;
    if (!now.some((item) => item.field === field)) return;
    applyGrouping(
      held.filter((item) => item.field !== field),
      labels.announceUngrouped(captionOf(columns, field)),
    );
  }, []);

  const turn = useCallback((field: string) => {
    const { held, levels: now, applyGrouping } = latest.current;
    const level = now.find((item) => item.field === field);
    if (!level) return;
    const next: DataGridSortDirection = level.direction === 'asc' ? 'desc' : 'asc';
    const at = held.findIndex((item) => item.field === field);
    // The name of the button says the direction it turns to, so the change says nothing more.
    applyGrouping(held.map((item, place) => (place === at ? { ...item, direction: next } : item)));
  }, []);

  const moveTo = useCallback((field: string, to: number) => {
    const { held, levels: now, applyGrouping, resolved: columns, labels } = latest.current;
    const from = now.findIndex((item) => item.field === field);
    if (from < 0 || to < 0 || to >= now.length || to === from) return;
    applyGrouping(
      regroupLevels(held, now, from, to),
      labels.announceGroupMoved(captionOf(columns, field), to + 1, now.length),
    );
  }, []);

  const step = useCallback(
    (field: string, by: -1 | 1) => {
      const from = latest.current.levels.findIndex((item) => item.field === field);
      const to = from + by;
      if (from < 0 || to < 0 || to >= latest.current.levels.length) return false;
      moveTo(field, to);
      return true;
    },
    [moveTo],
  );

  return useMemo(
    () => ({ chips, canGroup, accepts, group, ungroup, turn, step, moveTo }),
    [chips, canGroup, accepts, group, ungroup, turn, step, moveTo],
  );
}
