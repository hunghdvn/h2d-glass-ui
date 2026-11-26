import { useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { ResolvedColumn } from '../engine/columns';
import type { DataGridGroupItem, DataGridLabels, DataGridProps } from '../types';
import { useChipDrag } from './use-chip-drag';
import type { ChipDrag } from './use-chip-drag';
import type { TrayTarget } from './use-column-drag';
import type { DragViewStore } from './use-drag-view';
import type { GridGrouping } from './use-grid-grouping';
import { useGroupPanel } from './use-group-panel';
import type { GroupPanelControl } from './use-group-panel';

export interface GroupingUiOptions<TRow> {
  /** The `groupPanel` prop as it came: the panel is asked for by `true` and no other value. */
  groupPanel: DataGridProps<TRow>['groupPanel'];
  /** Server mode, which groups nothing and so has no tray. */
  remote: boolean;
  /** The grouping as the grid holds it. */
  held: readonly DataGridGroupItem[];
  groupingView: GridGrouping;
  resolved: readonly ResolvedColumn<TRow>[];
  hideable: boolean;
  labels: DataGridLabels;
  frameRef: RefObject<HTMLElement | null>;
  tableRef: RefObject<HTMLTableElement | null>;
  /** The store the chip and the drop line of every drag are read from. */
  dragView: DragViewStore;
}

export interface GroupingUi {
  /** Whether the grid asks for a tray: `groupPanel`, and not server mode. */
  wantsPanel: boolean;
  /** Whether the tray is drawn: asked for, and mounted by the toolbar. */
  panel: boolean;
  /** Whether the menu and the titles may group: the tray is there to ungroup from. */
  groupable: boolean;
  panelRef: RefObject<HTMLDivElement | null>;
  setTrayMounted: (mounted: boolean) => void;
  groupControl: GroupPanelControl;
  /** The tray as a place a title can be dropped, `null` while it is not drawn. */
  tray: TrayTarget | null;
  chipDrag: ChipDrag;
}

/**
 * The group panel: what the chips and the column menu do to the grouping, and the tray as a place
 * where a title or a chip can be dropped. The tray is asked for by `groupPanel` and not in server
 * mode, which groups nothing, and it is drawn unless the toolbar leaves it out (`toolbar={false}`, or
 * a function that does not place `items.groupPanel`): only the tray's own mount tells, so it reports
 * it from a layout effect, before the first paint. A grid with no tray offers no grouping from the
 * menu or a title, since a user who grouped there could not ungroup: grouping is then the app's
 * (`grouping`, `defaultGrouping`).
 */
export function useGroupingUi<TRow>(options: GroupingUiOptions<TRow>): GroupingUi {
  const { groupPanel, remote, held, groupingView, resolved, hideable, labels } = options;
  const { frameRef, tableRef, dragView } = options;
  const wantsPanel = groupPanel === true && !remote;
  const [trayMounted, setTrayMounted] = useState(false);
  const panel = wantsPanel && trayMounted;
  const groupable = panel;
  const panelRef = useRef<HTMLDivElement>(null);
  const groupControl = useGroupPanel({
    panel,
    held,
    levels: groupingView.levels,
    applyGrouping: groupingView.applyGrouping,
    resolved,
    hideable,
    labels,
  });
  const { accepts, group, moveTo, ungroup } = groupControl;
  const tray = useMemo<TrayTarget | null>(
    () => (panel ? { panelRef, accepts, drop: group } : null),
    [panel, accepts, group],
  );
  const chipDrag = useChipDrag({
    enabled: panel,
    frameRef,
    tableRef,
    panelRef,
    chips: groupControl.chips,
    view: dragView,
    moveTo,
    ungroup,
  });
  return { wantsPanel, panel, groupable, panelRef, setTrayMounted, groupControl, tray, chipDrag };
}
