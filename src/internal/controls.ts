// What takes its own press (spec phase 6 §3.4, §5): the elements that a press on a larger element
// holding them leaves alone, because the user pressed them and not the larger element. One list for
// every such place: a drag handle (the header of a movable Dialog; the DataGrid's column header,
// group chip and row grip) and the frame of a field (`focusInput`).
//
// It is not the list of what Tab stops at (`TABBABLE` in focus.ts): a label, a roving item or
// anything in an open menu takes its own press without being a tab stop, and a press does not care
// whether a control is disabled.

/** The interactive ARIA roles: a roving item (`tabindex="-1"`) is found by its role. */
const ROLES = [
  'button',
  'link',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'tab',
  'checkbox',
  'radio',
  'switch',
  'slider',
  'spinbutton',
  'textbox',
  'combobox',
  'treeitem',
];

/**
 * One selector per kind of element that takes its own press. `dialog.css` gives these, inside the
 * header of a movable Dialog, their own pointer with the same list in its `:where(...)`; a test
 * (Dialog.test.tsx) keeps the two equal, so change both together.
 */
const CONTROLS: readonly string[] = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'label',
  'summary',
  'iframe',
  'audio[controls]',
  'video[controls]',
  "[contenteditable]:not([contenteditable='false'])",
  // `-1` is left out: a heading that a dialog focuses on opening is no control, and it is where a
  // dialog is dragged by. The roving items that have it are found by their roles.
  "[tabindex]:not([tabindex='-1'])",
  ...ROLES.map((role) => `[role='${role}']`),
  // A popup that sits inside the larger element (a menu, a listbox, a popover, a nested dialog) is a
  // place of its own: everything in it takes its own press.
  '[popover]',
  'dialog',
];

/** The elements that take their own press, as one selector (see `CONTROLS`). */
export const CONTROL_SELECTOR = CONTROLS.join(', ');

/**
 * Whether a press or a click that `currentTarget` hears is not its own, but its target's: the
 * target is, or sits in, an element of `CONTROL_SELECTOR` inside `currentTarget`, or it is not inside
 * `currentTarget` in the DOM at all (a React portal rendered under it bubbles through the React tree,
 * not through the DOM). `currentTarget` itself, and an element around it, do not count, even when
 * they are controls: a roving cell can be a drag handle, and what it holds is its content.
 */
export function takesOwnPress(event: {
  target: EventTarget | null;
  currentTarget: Element;
}): boolean {
  const { target, currentTarget } = event;
  if (!(target instanceof Element) || !currentTarget.contains(target)) return true;
  const control = target.closest(CONTROL_SELECTOR);
  return control !== null && control !== currentTarget && currentTarget.contains(control);
}
