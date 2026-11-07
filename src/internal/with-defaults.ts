/**
 * Fills in the keys a caller left out. A plain spread (`{ ...defaults, ...given }`) lets a key
 * given as `undefined`, such as a translation that was not found, replace its default and leave
 * a button without a name or a status word that reads "undefined". Here `undefined` and `null`
 * keep the default, the `??` rule the other components follow; `''` is a value and is kept. Keys
 * that `defaults` does not have are ignored. Returns a new object.
 */
export function withDefaults<T extends object>(defaults: T, given: Partial<T> | undefined): T {
  const result = { ...defaults };
  if (!given) return result;
  for (const key of Object.keys(defaults) as Array<keyof T>) {
    const value = given[key];
    if (value !== undefined && value !== null) result[key] = value as T[keyof T];
  }
  return result;
}
