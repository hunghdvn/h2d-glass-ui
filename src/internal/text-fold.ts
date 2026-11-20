/**
 * Text folded to be compared: lower case, without diacritics, with đ/Đ as d. One rule for every
 * place a grid or a list matches text (the Combobox filter and its bold match, the DataGrid search,
 * filter row and header filter), with no locale: the text on the server and in the browser must
 * fold the same way, and a Turkish `İ` or `I` would not match what the user types on another
 * keyboard.
 */

/**
 * One code point in the form both sides are compared in: lower case, without diacritics, with đ/Đ as
 * d and the final sigma ς as σ. It may come out empty (a lone combining mark) or longer.
 * `foldWithMap` folds through it, one code point at a time, so that each folded character knows the
 * code point it came from. `foldText` folds the whole string in one pass instead and gives the very
 * text this gives code point by code point (the tests hold the two equal): lowering a whole string
 * applies a context rule, the Greek final sigma, which the last replace of both undoes, and the two
 * must agree on every character or a match is found in one and not shown in the other.
 */
function foldChar(ch: string): string {
  const base = ch.normalize('NFD').replace(/\p{M}/gu, '');
  return (base === 'đ' || base === 'Đ' ? 'd' : base.toLowerCase()).replace(/ς/g, 'σ');
}

/**
 * Lower case, without diacritics, with đ/Đ as d: the form both sides are compared in. The whole string
 * is folded in one pass (a search folds every cell once, and a code point at a time is five times
 * slower); it gives the very text `foldChar` gives code point by code point, which the tests hold
 * for every BMP code point and for a corpus (a Greek final sigma is the one context rule, and the
 * last replace makes it σ as `foldChar` does).
 */
export function foldText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/ς/g, 'σ');
}

/** The rule on text already folded: an empty query matches everything, else it is contained. */
export function containsFolded(foldedText: string, foldedQuery: string): boolean {
  return foldedQuery === '' || foldedText.includes(foldedQuery);
}

/** The rule on raw text: `containsFolded` of both folded. An empty query matches everything. */
export function includesFolded(text: string, query: string): boolean {
  return containsFolded(foldText(text), foldText(query));
}

/** A range of UTF-16 indices in a text, `end` exclusive. */
export interface TextRange {
  start: number;
  end: number;
}

/** A text folded, with for each folded character the index of the code point it came from. */
export interface FoldedText {
  folded: string;
  map: number[];
}

/**
 * Folds `text` code point by code point (a surrogate pair stays whole), keeping for each folded
 * character the index of the original code point it came from.
 */
export function foldWithMap(text: string): FoldedText {
  const codePoints = [...text];
  const map: number[] = [];
  let folded = '';
  for (let i = 0; i < codePoints.length; i++) {
    const ch = codePoints[i]!;
    const foldedCh = foldChar(ch);
    if (foldedCh === '') continue;
    for (const fc of [...foldedCh]) {
      map.push(i);
      folded += fc;
    }
  }
  return { folded, map };
}

/** The UTF-16 start index of the i-th code point in `codePoints`. */
function utf16StartOf(codePoints: string[], codePointIndex: number): number {
  let u16 = 0;
  for (let i = 0; i < codePointIndex; i++) u16 += codePoints[i]!.length;
  return u16;
}

/**
 * The occurrences of the folded query in a folded text, left to right and without overlap, as UTF-16
 * ranges of the ORIGINAL text; at most `limit`. A range takes the combining marks that follow its
 * last character, which the fold dropped. Empty when the query is empty.
 */
function scan(
  text: string,
  { folded, map }: FoldedText,
  foldedQuery: string,
  limit: number,
): TextRange[] {
  if (foldedQuery === '') return [];
  const queryChars = [...foldedQuery];
  const textChars = [...folded];
  const codePoints = [...text];
  const ranges: TextRange[] = [];

  let i = 0;
  while (i <= textChars.length - queryChars.length && ranges.length < limit) {
    let ok = true;
    for (let j = 0; j < queryChars.length; j++) {
      if (textChars[i + j] !== queryChars[j]) {
        ok = false;
        break;
      }
    }
    if (!ok) {
      i++;
      continue;
    }
    const startCodePoint = map[i];
    const lastCodePoint = map[i + queryChars.length - 1];
    if (startCodePoint === undefined || lastCodePoint === undefined) break;
    const start = utf16StartOf(codePoints, startCodePoint);
    let end = utf16StartOf(codePoints, lastCodePoint) + codePoints[lastCodePoint]!.length;
    for (let k = lastCodePoint + 1; k < codePoints.length; k++) {
      const ch = codePoints[k];
      if (ch === undefined || !/\p{M}/u.test(ch)) break;
      end += ch.length;
    }
    ranges.push({ start, end });
    i += queryChars.length;
  }
  return ranges;
}

/**
 * Where the folded query first occurs in a folded text, as UTF-16 indices into the ORIGINAL text.
 * The text and the query are already folded (`foldWithMap`, `foldText`), so that a list folds each
 * text once and the query once, not again for every keystroke and every item.
 */
export function findMatchFolded(
  text: string,
  folded: FoldedText,
  foldedQuery: string,
): TextRange | null {
  return scan(text, folded, foldedQuery, 1)[0] ?? null;
}

/**
 * Every occurrence of the folded query in a folded text, left to right and without overlap, as UTF-16
 * ranges of the original text: what a search marks in a cell.
 */
export function findMatchesFolded(
  text: string,
  folded: FoldedText,
  foldedQuery: string,
): TextRange[] {
  return scan(text, folded, foldedQuery, Infinity);
}

/** `findMatchesFolded` for a raw text and a raw query, which it folds. */
export function findMatches(text: string, query: string): TextRange[] {
  return findMatchesFolded(text, foldWithMap(text), foldText(query));
}
