/** Lower case, without diacritics, with đ/Đ as d: the form both sides are compared in. */
export function foldText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase();
}

/** The default filter: true when the folded input is empty or the folded textValue contains it. */
export function defaultFilter(
  item: { value: string; textValue: string },
  inputValue: string,
): boolean {
  const foldedInput = foldText(inputValue);
  if (foldedInput === '') return true;
  return foldText(item.textValue).includes(foldedInput);
}

/**
 * Where the folded query first occurs in the folded text, as UTF-16 indices into the ORIGINAL text.
 */
export function findMatch(text: string, query: string): { start: number; end: number } | null {
  const foldedQuery = foldText(query);
  if (foldedQuery === '') return null;

  const { folded, map } = foldWithMap(text);
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

/**
 * Folds `text` code point by code point (a surrogate pair stays whole), keeping for each folded
 * character the index of the original code point it came from.
 */
function foldWithMap(text: string): { folded: string; map: number[] } {
  const codePoints = [...text];
  const map: number[] = [];
  let folded = '';
  for (let i = 0; i < codePoints.length; i++) {
    const ch = codePoints[i]!;
    let foldedCh = ch.normalize('NFD').replace(/\p{M}/gu, '');
    if (foldedCh === 'đ' || foldedCh === 'Đ') foldedCh = 'd';
    foldedCh = foldedCh.toLowerCase();
    if (foldedCh === '') continue;
    for (const fc of [...foldedCh]) {
      map.push(i);
      folded += fc;
    }
  }
  return { folded, map };
}
