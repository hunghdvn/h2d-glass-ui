import type { ReactNode } from 'react';

/**
 * The first letter of a label that is text, as a person sees it: the rail of the Nav shows it for a
 * part with no icon, and a UserMenu makes its initials of it. It is the first code point of the
 * label in NFC, after the spaces around it, so a letter written with its mark apart from it ("e" and
 * a combining accent) is the one letter "é", and an emoji is never cut in half. An emoji joined from
 * several (a person at a laptop) gives the first of them. The same rule runs everywhere, with no
 * `Intl.Segmenter`, which a server may have and a browser not (Firefox before 125): the letter the
 * server writes is the one the browser hydrates.
 */
export function firstLetter(label: ReactNode): string | undefined {
  if (typeof label !== 'string') return undefined;
  return Array.from(label.trim().normalize('NFC'))[0];
}
