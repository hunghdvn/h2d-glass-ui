/**
 * One code point in the form both sides are compared in: lower case, without diacritics, with đ/Đ as
 * d and the final sigma ς as σ. It may come out empty (a lone combining mark) or longer. Both
 * `foldText` and `foldWithMap` fold through it, one code point at a time: lowering a whole string
 * applies context rules (the Greek final sigma) that the other would not, and the two must agree on
 * every character or a match is found in one and not shown in the other.
 */
function foldChar(ch: string): string {
  const base = ch.normalize('NFD').replace(/\p{M}/gu, '');
  return (base === 'đ' || base === 'Đ' ? 'd' : base.toLowerCase()).replace(/ς/g, 'σ');
}

/** Lower case, without diacritics, with đ/Đ as d: the form both sides are compared in. */
export function foldText(text: string): string {
  let folded = '';
  for (const ch of text) folded += foldChar(ch);
  return folded;
}

/** The default rule on text already folded: an empty query matches everything, else it is contained. */
export function containsFolded(foldedText: string, foldedQuery: string): boolean {
  return foldedQuery === '' || foldedText.includes(foldedQuery);
}

/** The default filter: true when the folded input is empty or the folded textValue contains it. */
export function defaultFilter(
  item: { value: string; textValue: string },
  inputValue: string,
): boolean {
  return containsFolded(foldText(item.textValue), foldText(inputValue));
}

/**
 * Where the folded query first occurs in the folded text, as UTF-16 indices into the ORIGINAL text.
 */
export function findMatch(text: string, query: string): { start: number; end: number } | null {
  return findMatchFolded(text, foldWithMap(text), foldText(query));
}

/**
 * `findMatch` for a text and a query that are already folded (`foldWithMap`, `foldText`), so that a
 * list folds each text once and the query once, not again for every keystroke and every item.
 */
export function findMatchFolded(
  text: string,
  { folded, map }: FoldedText,
  foldedQuery: string,
): { start: number; end: number } | null {
  if (foldedQuery === '') return null;

  const queryChars = [...foldedQuery];
  const textChars = [...folded];

  let found = -1;
  for (let i = 0; i <= textChars.length - queryChars.length; i++) {
    let ok = true;
    for (let j = 0; j < queryChars.length; j++) {
      if (textChars[i + j] !== queryChars[j]) {
        ok = false;
        break;
      }
    }
    if (ok) {
      found = i;
      break;
    }
  }
  if (found === -1) return null;

  const codePoints = [...text];
  const startCodePoint = map[found];
  const lastCodePoint = map[found + queryChars.length - 1];
  if (startCodePoint === undefined || lastCodePoint === undefined) return null;
  const start = utf16StartOf(codePoints, startCodePoint);
  let end = utf16StartOf(codePoints, lastCodePoint) + codePoints[lastCodePoint]!.length;
  for (let k = lastCodePoint + 1; k < codePoints.length; k++) {
    const ch = codePoints[k];
    if (ch === undefined || !/\p{M}/u.test(ch)) break;
    end += ch.length;
  }
  return { start, end };
}

/** The UTF-16 start index of the i-th code point in `codePoints`. */
function utf16StartOf(codePoints: string[], codePointIndex: number): number {
  let u16 = 0;
  for (let i = 0; i < codePointIndex; i++) u16 += codePoints[i]!.length;
  return u16;
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
