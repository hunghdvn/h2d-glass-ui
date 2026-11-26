import { Component } from 'react';
import type { RefObject } from 'react';
import type { DataGridEditMode } from '../types';

interface ModeFocusProbeProps {
  /** The mode of editing; `null` when the grid does not edit. */
  mode: DataGridEditMode | null;
  tableRef: RefObject<HTMLTableElement | null>;
  /** Told, when the mode has changed, whether the focus was inside the grid before the commit that changed it. */
  onModeChange: (focusWasInside: boolean) => void;
}

/**
 * Says where the focus was before a commit that changes the mode of editing. The editors, the form, the popup, the
 * confirm and the save bar go with the mode, and a focused element that is removed leaves no trace of where the focus
 * was, so it has to be read before the commit changes the DOM. `getSnapshotBeforeUpdate` is the one place React offers
 * for that, and it has no hook: this is a class for no other reason. It draws nothing.
 *
 * A child's `componentDidUpdate` runs before the layout effects of the component that renders it, so the answer is
 * in the edit state when its layout effect on the mode asks for it.
 */
export class ModeFocusProbe extends Component<ModeFocusProbeProps, unknown, boolean | null> {
  getSnapshotBeforeUpdate(previous: ModeFocusProbeProps): boolean | null {
    if (previous.mode === this.props.mode) return null;
    const root = this.props.tableRef.current?.closest('.flg-data-grid');
    return root != null && root.contains(document.activeElement);
  }

  componentDidUpdate(
    _previous: ModeFocusProbeProps,
    _state: unknown,
    inside: boolean | null,
  ): void {
    if (inside !== null) this.props.onModeChange(inside);
  }

  render(): null {
    return null;
  }
}
