/** The `Intl` formatters of the library, each built once per locale and options. */

import { devWarn } from './warn';

const FALLBACK_LOCALE = 'en-US';

function readable(locale: unknown): boolean {
  try {
    Intl.getCanonicalLocales(locale as string);
    return true;
  } catch {
    return false;
  }
}

/**
 * The locale, or `'en-US'` with a warning when it is no language tag: every `Intl` constructor
 * throws a RangeError on one (`'vi_VN'`, a common typo, or `''`), which would unmount the page,
 * and the library never throws on misuse. A tag it has no data for is fine: `Intl` picks another.
 */
function usableLocale(locale: string): string {
  if (readable(locale)) return locale;
  const fixed = typeof locale === 'string' ? locale.replace(/_/g, '-') : '';
  const hint = fixed !== locale && readable(fixed) ? ` (write "${fixed}")` : '';
  devWarn(
    `locale "${String(locale)}" is not a language tag Intl can read${hint}; "${FALLBACK_LOCALE}" is used.`,
  );
  return FALLBACK_LOCALE;
}

const cache = new Map<string, Intl.DateTimeFormat | Intl.NumberFormat>();

function cached<T extends Intl.DateTimeFormat | Intl.NumberFormat>(
  kind: 'date' | 'number',
  locale: string,
  options: object | undefined,
  make: (locale: string) => T,
): T {
  const key = `${kind}\u0001${String(locale)}\u0001${JSON.stringify(options ?? null)}`;
  let formatter = cache.get(key) as T | undefined;
  if (!formatter) {
    formatter = make(usableLocale(locale));
    cache.set(key, formatter);
  }
  return formatter;
}

/** An `Intl.DateTimeFormat` for the locale and options, the same object for the same pair. */
export function dateTimeFormat(
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  return cached('date', locale, options, (usable) => new Intl.DateTimeFormat(usable, options));
}

/** An `Intl.NumberFormat` for the locale and options, the same object for the same pair. */
export function numberFormat(
  locale: string,
  options?: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  return cached('number', locale, options, (usable) => new Intl.NumberFormat(usable, options));
}
