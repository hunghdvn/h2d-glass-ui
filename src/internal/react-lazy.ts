const REACT_LAZY = Symbol.for('react.lazy');

interface Lazy {
  $$typeof: symbol;
  _payload: unknown;
  _init: (payload: unknown) => unknown;
}

const isLazy = (value: unknown): value is Lazy =>
  typeof value === 'object' && value !== null && (value as Lazy).$$typeof === REACT_LAZY;

/**
 * What a React lazy reference stands for. A Server Component passes client components down as lazy
 * references, and in development it can pass a child element as one too. Reading one returns the
 * value once its code or data has loaded, and suspends until then, just as rendering it would.
 * Anything else is returned unchanged.
 */
export function resolveLazy<T>(value: T): T {
  let current: unknown = value;
  while (isLazy(current)) current = current._init(current._payload);
  return current as T;
}
