/** A library `<dialog>` that is open as a modal, and the element the Toaster renders into. */
export interface ModalEntry {
  readonly dialog: HTMLDialogElement;
  readonly host: HTMLElement;
}

let stack: readonly ModalEntry[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Adds an open modal on top of the stack. Returns the function that removes it again. */
export function registerModal(entry: ModalEntry): () => void {
  stack = [...stack, entry];
  emit();
  return () => {
    if (!stack.includes(entry)) return;
    stack = stack.filter((item) => item !== entry);
    emit();
  };
}

/** The modal opened last, if any. The same object is returned until the stack changes. */
export function getTopModal(): ModalEntry | undefined {
  return stack[stack.length - 1];
}

/** Calls `listener` after every change to the stack. Returns the unsubscribe function. */
export function subscribeModals(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * True when the top modal is one that does not hold `element`, so the element sits under it, out of
 * the user's reach: a tooltip trigger under a Dialog, a SearchField in the header under a Drawer.
 */
export function isCoveredByModal(element: Element | null): boolean {
  const top = getTopModal();
  return top !== undefined && element !== null && !top.dialog.contains(element);
}
