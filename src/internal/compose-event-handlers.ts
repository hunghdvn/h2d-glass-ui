/**
 * Runs the consumer's handler first, then the library's own handler unless the consumer
 * called `event.preventDefault()`.
 */
export function composeEventHandlers<E extends { defaultPrevented: boolean }>(
  userHandler: ((event: E) => void) | undefined,
  internalHandler: ((event: E) => void) | undefined,
): (event: E) => void {
  return (event) => {
    userHandler?.(event);
    if (!event.defaultPrevented) internalHandler?.(event);
  };
}
