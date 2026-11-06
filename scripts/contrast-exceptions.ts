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
  6: {
    description:
      'Muted text on the brightest reference backdrop, the muted text of a Combobox option ' +
      'while filtering and of its status row, and the weekday row of a Calendar',
    criterion: '1.4.3',
  },
  7: {
    description:
      'Accent text on the accent wash: an accent Badge, a selected pill tab, the current page',
    criterion: '1.4.3',
  },
  8: {
    description:
      'The accent wash against the panel or surface: a highlighted menu item or Select option, a ' +
      'selected pill tab, the current page',
    criterion: '1.4.11',
  },
  9: {
    description:
      'Muted icon, shortcut and submenu chevron on a highlighted menu item or option, and the hint ' +
      'of a FileUpload zone while files are over it',
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
  12: { description: 'Muted text of a segmented tab on its track', criterion: '1.4.3' },
  13: { description: 'Selected segmented tab against its track', criterion: '1.4.11' },
  14: {
    description: 'The icon and bar of an info toast against the surface',
    criterion: '1.4.11',
  },
  15: { description: 'Tick dots under a Slider track, against the surface', criterion: '1.4.11' },
  16: { description: 'Slider track against the surface', criterion: '1.4.11' },
  17: {
    description: 'Slider thumb against its track and against the filled part',
    criterion: '1.4.11',
  },
  18: {
    description: 'A day of the month before or after in a Calendar, muted text at half opacity',
    criterion: '1.4.3',
  },
  19: { description: 'Dashed edge of a FileUpload zone against the surface', criterion: '1.4.11' },
  20: {
    description: 'The browse word of a FileUpload zone, accent text on the zone background',
    criterion: '1.4.3',
  },
  21: {
    description: 'The size of a file in a FileUpload list, muted text on the row background',
    criterion: '1.4.3',
  },
  22: {
    description: 'The hint of a FileUpload zone, muted text on the zone background',
    criterion: '1.4.3',
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
  { row: 6, theme: 'dark', check: 'combobox-unmatched-text', recorded: 4.1, ...D[6] },
  { row: 6, theme: 'dark', check: 'calendar-weekday-text', recorded: 4.1, ...D[6] },
  { row: 7, theme: 'light', check: 'badge-accent', recorded: 3.4, ...D[7] },
  { row: 7, theme: 'dark', check: 'badge-accent', recorded: 3.76, ...D[7] },
  { row: 7, theme: 'light', check: 'selected-text', recorded: 3.4, ...D[7] },
  { row: 7, theme: 'dark', check: 'selected-text', recorded: 3.76, ...D[7] },
  { row: 8, theme: 'light', check: 'highlight-indicator', recorded: 1.15, ...D[8] },
  { row: 8, theme: 'dark', check: 'highlight-indicator', recorded: 1.18, ...D[8] },
  { row: 8, theme: 'light', check: 'selected-indicator', recorded: 1.15, ...D[8] },
  { row: 8, theme: 'dark', check: 'selected-indicator', recorded: 1.18, ...D[8] },
  { row: 9, theme: 'light', check: 'highlight-icon', recorded: 4.37, ...D[9] },
  { row: 9, theme: 'dark', check: 'highlight-icon', recorded: 3.6, ...D[9] },
  { row: 9, theme: 'light', check: 'dropzone-hint-drag', recorded: 4.37, ...D[9] },
  { row: 9, theme: 'dark', check: 'dropzone-hint-drag', recorded: 3.6, ...D[9] },
  { row: 10, theme: 'light', check: 'highlight-danger-text', recorded: 4.24, ...D[10] },
  { row: 11, theme: 'light', check: 'highlight-chosen-box', recorded: 2.61, ...D[11] },
  { row: 11, theme: 'dark', check: 'highlight-chosen-box', recorded: 1.91, ...D[11] },
  { row: 12, theme: 'light', check: 'segmented-text', recorded: 4.1, ...D[12] },
  { row: 12, theme: 'dark', check: 'segmented-text', recorded: 3.36, ...D[12] },
  { row: 13, theme: 'light', check: 'segmented-indicator', recorded: 1.24, ...D[13] },
  { row: 13, theme: 'dark', check: 'segmented-indicator', recorded: 1.12, ...D[13] },
  { row: 14, theme: 'dark', check: 'toast-info-icon', recorded: 2.29, ...D[14] },
  { row: 15, theme: 'light', check: 'slider-tick', recorded: 2.88, ...D[15] },
  { row: 15, theme: 'dark', check: 'slider-tick', recorded: 2.82, ...D[15] },
  { row: 16, theme: 'light', check: 'slider-track', recorded: 1.23, ...D[16] },
  { row: 16, theme: 'dark', check: 'slider-track', recorded: 1.3, ...D[16] },
  { row: 17, theme: 'light', check: 'slider-thumb', recorded: 1.29, ...D[17] },
  { row: 17, theme: 'dark', check: 'slider-thumb', recorded: 2.24, ...D[17] },
  { row: 18, theme: 'light', check: 'calendar-outside-day', recorded: 2.04, ...D[18] },
  { row: 18, theme: 'dark', check: 'calendar-outside-day', recorded: 2.14, ...D[18] },
  { row: 19, theme: 'light', check: 'dropzone-border', recorded: 1.89, ...D[19] },
  { row: 19, theme: 'dark', check: 'dropzone-border', recorded: 1.99, ...D[19] },
  { row: 20, theme: 'dark', check: 'dropzone-link', recorded: 3.79, ...D[20] },
  { row: 21, theme: 'dark', check: 'file-meta-text', recorded: 3.71, ...D[21] },
  { row: 22, theme: 'dark', check: 'dropzone-hint-text', recorded: 3.64, ...D[22] },
];
