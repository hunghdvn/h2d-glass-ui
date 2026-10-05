import { readFileSync } from 'node:fs';

const css = readFileSync('dist/styles.css', 'utf8');

// Lightning CSS may rewrite `@layer a, b, c;` into blocks emitted in that order, so check the order in
// which each layer name first appears, whether in a statement list or as a block.
const LAYERS = ['tokens', 'theme', 'base', 'components', 'preferences'];
const positions = LAYERS.map((name) =>
  css.search(new RegExp(`(?:@layer\\s*|,\\s*)flg\\.${name}\\b`)),
);
const inOrder = positions.every(
  (pos, i) => pos >= 0 && (i === 0 || pos > (positions[i - 1] ?? -1)),
);

/** Every component class whose CSS must reach dist/styles.css. Add one entry per component. */
const SHIPPED_CLASSES = [
  'flg-surface',
  'flg-spinner',
  'flg-button',
  'flg-badge',
  'flg-avatar',
  'flg-divider',
  'flg-card',
  'flg-field',
  'flg-input',
  'flg-textarea',
  'flg-checkbox',
  'flg-radio-group',
  'flg-radio',
  'flg-switch',
  'flg-dialog',
  'flg-dialog-panel',
  'flg-drawer-panel',
  'flg-popover',
  'flg-popover-arrow',
];

const requirements: Array<[string, boolean]> = [
  ['no unresolved @import', !css.includes('@import')],
  ['declares the flg layers in order', inOrder],
  ['prefixes backdrop-filter for Safari', css.includes('-webkit-backdrop-filter')],
  ['ships the automatic dark theme', /prefers-color-scheme:\s*dark/.test(css)],
  ['ships the contrast-more mode', /prefers-contrast:\s*more/.test(css)],
  ...SHIPPED_CLASSES.map((name): [string, boolean] => [
    `ships .${name}`,
    new RegExp(`\\.${name}(?![\\w-])`).test(css),
  ]),
  ['does not ship the Storybook simulation', !css.includes('data-flg-simulate')],
];
const failed = requirements.filter(([, ok]) => !ok);
for (const [label, ok] of requirements) console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
if (failed.length > 0) process.exit(1);
