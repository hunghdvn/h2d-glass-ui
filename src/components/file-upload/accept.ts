import { numberFormat } from '../../internal/intl';

/**
 * Whether a file passes an `accept` string, by the rules of the native attribute: a comma-separated
 * list of extensions (`.pdf`), MIME types (`application/pdf`) and MIME wildcards (`image/*`), all
 * compared without regard to case. The library checks every added file itself: the browser uses
 * `accept` only as the file dialog's filter, which the user can switch to all files, and not on a drop.
 *
 * A token that is none of the three (`pdf`, `*`, `image`, an empty one) is ignored, as browsers
 * ignore it; when no valid token is left, every file matches. So does the wildcard of all types, star
 * slash star. A file with no `type` (dropped files often have none) can otherwise match only an
 * extension token.
 */
export function matchesAccept(
  file: { name: string; type: string },
  accept: string | undefined,
): boolean {
  if (!accept) return true;

  const name = file.name.toLowerCase();
  // Parameters such as `;charset=utf-8` are no part of the type that a token names.
  const type = file.type.split(';')[0]!.trim().toLowerCase();

  let valid = false;
  for (const raw of accept.split(',')) {
    const token = raw.split(';')[0]!.trim().toLowerCase();
    if (token.length > 1 && token.startsWith('.')) {
      valid = true;
      if (name.endsWith(token)) return true;
      continue;
    }
    const slash = token.indexOf('/');
    if (slash <= 0 || slash === token.length - 1) continue;
    valid = true;
    if (token === '*/*') return true;
    if (type === '') continue;
    if (token.endsWith('/*') ? type.startsWith(token.slice(0, -1)) : type === token) return true;
  }
  return !valid;
}

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const;

/**
 * A file size for the locale: `1.5 kB`, `2.5 GB`. 1 kB is 1000 bytes, as the unit names of `Intl`
 * say. The unit is picked on the value after rounding to one decimal, so 999 960 bytes reads
 * `1 MB` and not `1,000 kB`. A negative or non-finite size is no File size; it reads as 0.
 */
export function formatFileSize(bytes: number, locale: string): string {
  let value = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  let unit = 0;
  while (unit < UNITS.length - 1 && Math.round(value * 10) / 10 >= 1000) {
    value /= 1000;
    unit += 1;
  }
  return numberFormat(locale, {
    style: 'unit',
    unit: UNITS[unit],
    unitDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
}
