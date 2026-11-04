/** The package's name, written once: dev warnings and the shared part markers carry it. */
export const LIB_NAME = 'h2d-glass-ui';

/**
 * A symbol from the global registry, named under the package. `Symbol.for` gives every copy of the
 * library on a page the same symbol (a bundler can load two), so a part marked by one copy is still
 * recognised by another; keeping the name here means a rename cannot split the keys.
 */
export function libSymbol(key: string): symbol {
  return Symbol.for(`${LIB_NAME}.${key}`);
}
