import type { ThemeName } from '../src/styles/theme/values';
import type { CheckId } from './lib/contrast';

/** What one row of spec §4.9 is about. Shared by every exception in that row. */
export interface ExceptionRowInfo {
  readonly description: string;
  /** WCAG 2.2 success criteria the row falls short of. */
  readonly criterion: string;
  /** The AA minimum in words, when it is more than the check's single threshold. */
  readonly minimum?: string;
}

export interface KnownException extends ExceptionRowInfo {
  /** Row number in spec §4.9 and in the docs Accessibility table. */
  readonly row: number;
  readonly theme: ThemeName;
  readonly check: CheckId;
  /** Contrast measured with the approved mockup values, rounded down. Getting worse fails CI. */
  readonly recorded: number;
}

const D = {
  1: {
    description: 'Control borders (input, checkbox, radio, switch when off) against the surface',
    criterion: '1.4.11',
  },
  2: {
    description:
      'Focus ring on Button, IconButton, Checkbox, Radio and Switch, and on an invalid Input or ' +
      'Textarea, whose border stays red while focused',
    criterion: '1.4.11',
  },
  3: {
    description: 'Input and Textarea border while focused (when not invalid)',
    criterion: '1.4.11',
  },
  4: {
    description: 'White text and check marks on the accent gradient',
    criterion: '1.4.3, 1.4.11',
    minimum: '4.5:1 text, 3:1 check marks',
  },
  5: {
    description:
      'Accent fill of checked states (checkbox, radio dot, switch on) and the bar under the ' +
      'selected underline tab, against the surface',
    criterion: '1.4.11',
  },
  6: { description: 'Muted text on the brightest reference backdrop', criterion: '1.4.3' },
  7: { description: 'Accent badge text on the accent badge background', criterion: '1.4.3' },
  8: {
    description: 'Highlighted menu item or Select option: the accent wash against the panel',
    criterion: '1.4.11',
  },
  9: {
    description: 'Muted icon, shortcut and submenu chevron on a highlighted menu item or option',
    criterion: '1.4.3, 1.4.11',
    minimum: '4.5:1 shortcut text, 3:1 icons',
  },
  10: { description: 'Danger text on a highlighted danger menu item', criterion: '1.4.3' },
  11: {
    description:
      'Accent fill of a chosen checkbox on a highlighted option of a multiple Select, against the ' +
      'accent wash of the row',
    criterion: '1.4.11',
  },
} as const satisfies Record<number, ExceptionRowInfo>;

/** Spec §4.9. The default theme keeps the approved mockup values, so these gaps are accepted. */
export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
  { row: 1, theme: 'light', check: 'control-border', recorded: 1.28, ...D[1] },
  { row: 1, theme: 'dark', check: 'control-border', recorded: 1.31, ...D[1] },
  { row: 2, theme: 'light', check: 'focus-indicator', recorded: 1.2, ...D[2] },
  { row: 2, theme: 'dark', check: 'focus-indicator', recorded: 1.23, ...D[2] },
  { row: 3, theme: 'dark', check: 'input-focus-border', recorded: 2.06, ...D[3] },
  { row: 4, theme: 'dark', check: 'on-accent-start', recorded: 3.63, ...D[4] },
  { row: 4, theme: 'dark', check: 'on-accent-end', recorded: 2.24, ...D[4] },
  { row: 5, theme: 'dark', check: 'checked-fill', recorded: 2.26, ...D[5] },
  { row: 5, theme: 'dark', check: 'tab-indicator', recorded: 2.26, ...D[5] },
  { row: 6, theme: 'dark', check: 'text-muted', recorded: 4.1, ...D[6] },
  { row: 7, theme: 'light', check: 'badge-accent', recorded: 3.4, ...D[7] },
  { row: 7, theme: 'dark', check: 'badge-accent', recorded: 3.76, ...D[7] },
  { row: 8, theme: 'light', check: 'highlight-indicator', recorded: 1.15, ...D[8] },
  { row: 8, theme: 'dark', check: 'highlight-indicator', recorded: 1.18, ...D[8] },
  { row: 9, theme: 'light', check: 'highlight-icon', recorded: 4.37, ...D[9] },
  { row: 9, theme: 'dark', check: 'highlight-icon', recorded: 3.6, ...D[9] },
  { row: 10, theme: 'light', check: 'highlight-danger-text', recorded: 4.24, ...D[10] },
  { row: 11, theme: 'light', check: 'highlight-chosen-box', recorded: 2.61, ...D[11] },
  { row: 11, theme: 'dark', check: 'highlight-chosen-box', recorded: 1.91, ...D[11] },
];
