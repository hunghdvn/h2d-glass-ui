import type { ThemeName } from '../src/styles/theme/values';
import type { CheckId } from './lib/contrast';

export interface KnownException {
  /** Row number in spec §4.9 and in the docs Accessibility table. */
  readonly row: number;
  readonly theme: ThemeName;
  readonly check: CheckId;
  /** Contrast measured with the approved mockup values, rounded down. Getting worse fails CI. */
  readonly recorded: number;
  readonly description: string;
}

const D = {
  1: 'Control borders (input, checkbox, radio, switch when off) against the surface',
  2: 'Focus ring on Button, IconButton, Checkbox, Radio and Switch',
  3: 'Input and Textarea border while focused',
  4: 'White text and check marks on the accent gradient',
  5: 'Accent fill of checked states (checkbox, radio dot, switch on) against the surface',
  6: 'Muted text on the brightest reference backdrop',
  7: 'Accent badge text on the accent badge background',
} as const;

/** Spec §4.9. The default theme keeps the approved mockup values, so these gaps are accepted. */
export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
  { row: 1, theme: 'light', check: 'control-border', recorded: 1.28, description: D[1] },
  { row: 1, theme: 'dark', check: 'control-border', recorded: 1.31, description: D[1] },
  { row: 2, theme: 'light', check: 'focus-indicator', recorded: 1.21, description: D[2] },
  { row: 2, theme: 'dark', check: 'focus-indicator', recorded: 1.23, description: D[2] },
  { row: 3, theme: 'dark', check: 'input-focus-border', recorded: 2.06, description: D[3] },
  { row: 4, theme: 'dark', check: 'on-accent-start', recorded: 3.63, description: D[4] },
  { row: 4, theme: 'dark', check: 'on-accent-end', recorded: 2.24, description: D[4] },
  { row: 5, theme: 'dark', check: 'checked-fill', recorded: 2.26, description: D[5] },
  { row: 6, theme: 'dark', check: 'text-muted', recorded: 4.1, description: D[6] },
  { row: 7, theme: 'light', check: 'badge-accent', recorded: 3.53, description: D[7] },
  { row: 7, theme: 'dark', check: 'badge-accent', recorded: 3.76, description: D[7] },
];
