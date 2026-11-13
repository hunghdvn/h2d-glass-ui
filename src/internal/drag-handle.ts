/**
 * What a press on a drag handle leaves to itself (spec phase 6 §3.4): a control inside the handle is
 * used, not dragged by. The handle is not an `inert` region, so each of these keeps its own press,
 * focus and double click. One list for every handle: the header of a movable Dialog, and the
 * DataGrid's column header, group chip and row grip.
 *
 * `dialog.css` gives the controls of a movable Dialog's header their own pointer with the same list,
 * in its `:where(...)`; a test (Dialog.test.tsx) keeps the two equal, so change both together.
 */
export const HANDLE_CONTROLS: readonly string[] = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'label',
  'summary',
  '[contenteditable]',
  "[role='button']",
  "[role='link']",
  "[tabindex]:not([tabindex='-1'])",
];

const SELECTOR = HANDLE_CONTROLS.join(', ');

/**
 * Whether a press or a click landed on one of the `HANDLE_CONTROLS` inside the handle that hears it
 * (`currentTarget`). A control around the handle does not count: the handle is its content.
 */
export function onHandleControl(event: { target: EventTarget; currentTarget: Element }): boolean {
  const { target, currentTarget } = event;
  if (!(target instanceof Element)) return false;
  const control = target.closest(SELECTOR);
  return control !== null && currentTarget.contains(control);
}
