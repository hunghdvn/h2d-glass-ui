// An input that takes no text is no place for typing: a letter pressed on one is a hotkey.
const TEXT_INPUT = [
  'checkbox',
  'radio',
  'button',
  'range',
  'color',
  'file',
  'submit',
  'reset',
  'image',
]
  .map((type) => `:not([type="${type}" i])`)
  .join('');
const EDITABLE = `input${TEXT_INPUT}, textarea, select, [contenteditable]:not([contenteditable="false"])`;

/**
 * True for a target the user types into, or a descendant of one. A key that is a letter or a symbol
 * (the Toaster's hotkey, the shortcut of a SearchField) must not take what the user types.
 */
export function isEditable(target: EventTarget | undefined): boolean {
  return target instanceof Element && target.closest(EDITABLE) !== null;
}
