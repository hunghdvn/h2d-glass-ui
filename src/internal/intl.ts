/** The `Intl` formatters of the library, each built once per locale and options. */

const cache = new Map<string, Intl.DateTimeFormat | Intl.NumberFormat>();

function cached<T extends Intl.DateTimeFormat | Intl.NumberFormat>(
  kind: 'date' | 'number',
  locale: string,
  options: object | undefined,
  make: () => T,
): T {
  const key = `${kind}\u0001${locale}\u0001${JSON.stringify(options ?? null)}`;
  let formatter = cache.get(key) as T | undefined;
  if (!formatter) {
    formatter = make();
    cache.set(key, formatter);
  }
  return formatter;
}

/** An `Intl.DateTimeFormat` for the locale and options, the same object for the same pair. */
export function dateTimeFormat(
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  return cached('date', locale, options, () => new Intl.DateTimeFormat(locale, options));
}

/** An `Intl.NumberFormat` for the locale and options, the same object for the same pair. */
export function numberFormat(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  return cached('number', locale, options, () => new Intl.NumberFormat(locale, options));
}
