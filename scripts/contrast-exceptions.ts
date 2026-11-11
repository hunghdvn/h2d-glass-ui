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
      'Focus ring on Button, IconButton, Checkbox, Radio and Switch, on the button of a Stepper ' +
      'step, on a row of a List, on the sort button and the scroll frame of a Table, on the link of ' +
      'an AppShellBrand and the skip link of an AppShell, on an item and the button of a group of ' +
      'a Nav, and on an invalid Input or Textarea, whose border stays red while focused',
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
      'Accent fill of checked states (checkbox, radio dot, switch on), the bar under the ' +
      'selected underline tab and the bar of a done step in a Stepper `bars`, against the surface',
    criterion: '1.4.11',
  },
  6: {
    description:
      'Muted text on the brightest reference backdrop, the muted text of a Combobox option ' +
      'while filtering and of its status row, the weekday row of a Calendar, the value of a ' +
      'Progress `thin`, in a Stepper the number, title and description of a step not reached, the ' +
      'description of every step and the "Step N" line of a step not reached, in a List the ' +
      'description and the end cell of a row, and in a Table `striped` and `minimal` the column ' +
      'headings and the icon of a column that is not sorted, the text of an AppShell footer, and in ' +
      'a Nav the title of a section and the count of `bar`',
    criterion: '1.4.3',
  },
  7: {
    description:
      'Accent text on the accent wash: an accent Badge, a selected pill tab, the current page, the ' +
      'title of the current step of a Stepper `compact`, the title of the current row of a List, the ' +
      'text and icon of the current item of a Nav `pill`',
    criterion: '1.4.3',
  },
  8: {
    description:
      'The accent wash against the panel or surface: a highlighted menu item or Select option, a ' +
      'selected pill tab, the current page, the pill of the current step of a Stepper `compact`, ' +
      'the background of the current row of a List, the background of the current item of a Nav ' +
      '`pill`',
    criterion: '1.4.11',
  },
  9: {
    description:
      'Muted icon, shortcut and submenu chevron on a highlighted menu item or option, the hint ' +
      'of a FileUpload zone while files are over it, the description of the current step of a ' +
      'Stepper `compact`, the description and end cell of the current row of a List, and the muted ' +
      'text on a chosen row of a Table',
    criterion: '1.4.3, 1.4.11',
    minimum: '4.5:1 shortcut text, 3:1 icons',
  },
  10: {
    description:
      'Danger text on a highlighted danger menu item, and the title and description of a failed ' +
      'step in a Stepper `compact`',
    criterion: '1.4.3',
  },
  11: {
    description:
      'Accent fill of a chosen checkbox on a highlighted option of a multiple Select, against the ' +
      'accent wash of the row',
    criterion: '1.4.11',
  },
  12: {
    description:
      'Muted text of a segmented tab on its track, the description of a row of a List that can ' +
      'be pressed, the description of a pressable Stepper step, and the muted text on a row of a ' +
      'Table, under the pointer (`inset` and `plain`; `cards` in dark), and the count of a Nav ' +
      '`bar` under the pointer',
    criterion: '1.4.3',
  },
  13: { description: 'Selected segmented tab against its track', criterion: '1.4.11' },
  14: {
    description:
      'The icon and bar of an info toast, the 2px border of the dot of the current step in a ' +
      'Stepper `circles`, and the 1.5px outline of the current row of a List `cards`, against the ' +
      'surface',
    criterion: '1.4.11',
  },
  15: { description: 'Tick dots under a Slider track, against the surface', criterion: '1.4.11' },
  16: {
    description:
      'Slider and Progress track, and the bar of a step not reached in a Stepper `bars`, against ' +
      'the surface',
    criterion: '1.4.11',
  },
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
    description:
      'The size of a file in a FileUpload list, muted text on the row background, and the ' +
      'description of an Alert `plain`',
    criterion: '1.4.3',
  },
  22: {
    description:
      'The hint of a FileUpload zone, muted text on the zone background, the description of an ' +
      'Alert `stripe`, and the column headings of a Table `lined`',
    criterion: '1.4.3',
  },
  23: {
    description:
      'The icon of an info Alert (accent colour) against its background: the bar and icon of ' +
      '`stripe`, the icon on the tint of `tinted`, the icon on its circle in `plain`',
    criterion: '1.4.11',
  },
  24: {
    description: 'The title of an Alert `tinted`, in its status colour, on the tinted background',
    criterion: '1.4.3',
  },
  25: {
    description: 'The description of an Alert `tinted`, text on the tinted background',
    criterion: '1.4.3',
  },
  26: {
    description:
      'Accent text on the control background: the title of an info Alert `plain`, and the number ' +
      'of the current step in a Stepper `circles` and `compact`',
    criterion: '1.4.3',
  },
  27: {
    description:
      'The filled part of a Progress `thin` or `inline` (accent gradient, success and danger ' +
      'colours) against its track, and the filled half of the bar of the current step in a Stepper ' +
      '`bars`',
    criterion: '1.4.11',
  },
  28: {
    description:
      'The filled part of a Progress `glow`, with the light on its upper half, against its track',
    criterion: '1.4.11',
  },
  29: {
    description:
      'Accent text on the surface: the value of a Progress `glow`, the "Step N" line of a ' +
      'done or current step in a Stepper `bars`, and the label of the group of a Nav `pill` that ' +
      'holds the current page',
    criterion: '1.4.3',
  },
  30: {
    description:
      'The ring of a step not reached yet (the muted text colour at 65%) against the surface, in a ' +
      'Stepper `circles` and `compact`',
    criterion: '1.4.11',
  },
  31: {
    description:
      'The accent line on the accent wash of the current step or row: the border of the dot of the ' +
      'current step in a Stepper `compact`, and the bar of the current row of a List `inset`',
    criterion: '1.4.11',
  },
  32: {
    description:
      'The text of a Badge on a row of a Table under the pointer (the control track), of a ' +
      'Badge in the end cell of a List row that can be pressed, under the pointer, and of the ' +
      'count Badge of an item of a Nav `pill` under the pointer',
    criterion: '1.4.3',
  },
  33: {
    description:
      'The text on the odd row of a Table `striped` (the control track at 50%): the muted text ' +
      'in dark, and the text of a Badge',
    criterion: '1.4.3',
  },
  34: {
    description: 'The text of a Badge on a chosen row of a Table (the accent wash)',
    criterion: '1.4.3',
  },
  35: {
    description:
      'The 3px bar of the current item of a Nav `bar` (the solid accent) against the 18% tint of ' +
      'the accent that the item has behind it',
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
  { row: 23, theme: 'dark', check: 'alert-stripe-icon', recorded: 2.02, ...D[23] },
  { row: 23, theme: 'dark', check: 'alert-tinted-icon', recorded: 1.84, ...D[23] },
  { row: 23, theme: 'dark', check: 'alert-plain-icon', recorded: 1.88, ...D[23] },
  { row: 24, theme: 'dark', check: 'alert-tinted-title', recorded: 3.37, ...D[24] },
  { row: 25, theme: 'dark', check: 'alert-tinted-text', recorded: 4.16, ...D[25] },
  { row: 26, theme: 'dark', check: 'alert-plain-title', recorded: 3.9, ...D[26] },
  { row: 26, theme: 'dark', check: 'stepper-current-number', recorded: 3.33, ...D[26] },
  { row: 27, theme: 'light', check: 'progress-fill', recorded: 2.45, ...D[27] },
  { row: 27, theme: 'dark', check: 'progress-fill', recorded: 1.74, ...D[27] },
  { row: 28, theme: 'light', check: 'progress-glow-fill', recorded: 1.62, ...D[28] },
  { row: 28, theme: 'dark', check: 'progress-glow-fill', recorded: 1.74, ...D[28] },
  { row: 29, theme: 'light', check: 'accent-text-on-surface', recorded: 3.95, ...D[29] },
  { row: 29, theme: 'dark', check: 'accent-text-on-surface', recorded: 4.44, ...D[29] },
  { row: 30, theme: 'light', check: 'stepper-ring', recorded: 2.63, ...D[30] },
  { row: 30, theme: 'dark', check: 'stepper-ring', recorded: 2.63, ...D[30] },
  { row: 31, theme: 'light', check: 'current-edge', recorded: 2.61, ...D[31] },
  { row: 31, theme: 'dark', check: 'current-edge', recorded: 2.01, ...D[31] },
  { row: 32, theme: 'light', check: 'table-hover-badge', recorded: 2.8, ...D[32] },
  { row: 32, theme: 'dark', check: 'table-hover-badge', recorded: 3.03, ...D[32] },
  { row: 33, theme: 'dark', check: 'table-stripe-text-muted', recorded: 3.71, ...D[33] },
  { row: 33, theme: 'light', check: 'table-stripe-badge', recorded: 3.09, ...D[33] },
  { row: 33, theme: 'dark', check: 'table-stripe-badge', recorded: 3.37, ...D[33] },
  { row: 34, theme: 'light', check: 'table-selected-badge', recorded: 2.97, ...D[34] },
  { row: 34, theme: 'dark', check: 'table-selected-badge', recorded: 3.27, ...D[34] },
  { row: 35, theme: 'light', check: 'nav-bar-indicator', recorded: 2.52, ...D[35] },
  { row: 35, theme: 'dark', check: 'nav-bar-indicator', recorded: 2.03, ...D[35] },
];
