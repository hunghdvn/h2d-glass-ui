import type { ReactNode } from 'react';
import { findMatchesFolded, foldWithMap } from '../../internal/text-fold';

/**
 * The text of a cell with a `<mark>` around every match of a search (spec phase 6 §4.3 F1, §6.3):
 * `folded` is the folded, trimmed query (`foldedSearch`), and the marks are in the characters the text
 * has, so "duong" marks the whole of "Đường". With nothing to look for, or no match, the very text comes
 * back, so a cell that holds no match draws the string it always drew; with a match it is one `<span>`
 * that holds the text and the marks.
 */
export function highlightText(text: string, folded: string): ReactNode {
  if (folded === '' || text === '') return text;
  const ranges = findMatchesFolded(text, foldWithMap(text), folded);
  if (ranges.length === 0) return text;
  const parts: ReactNode[] = [];
  let from = 0;
  for (const { start, end } of ranges) {
    if (start > from) parts.push(text.slice(from, start));
    parts.push(
      <mark key={start} className="flg-data-grid-match">
        {text.slice(start, end)}
      </mark>,
    );
    from = end;
  }
  if (from < text.length) parts.push(text.slice(from));
  // One element, so that a parent that is a flex or grid box (a custom cell's own) takes the text as one
  // item: as separate parts they would be spaced by its gap and lose the spaces at their ends.
  return <span>{parts}</span>;
}
