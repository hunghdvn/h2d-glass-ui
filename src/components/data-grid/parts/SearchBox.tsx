import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { isComposing } from '../../../internal/roving';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import { SearchField } from '../../search-field/SearchField';
import { useFilterView } from '../filter-context';
import { useComposition } from '../hooks/use-composition';
import type { DataGridFilter } from '../types';

/** How long after the last key of the search field what was typed is applied, in milliseconds. */
export const SEARCH_DELAY = 300;

/** The filter with this search, and no `search` at all for an empty one. */
function withSearch(filter: DataGridFilter, search: string): DataGridFilter {
  const next = { ...filter };
  if (search === '') delete next.search;
  else next.search = search;
  return next;
}

export interface SearchBoxProps {
  /** The name of the field. */
  label: string;
  placeholder: string;
}

/**
 * The search field of the toolbar (spec phase 6 §3.6, §6.3). It keeps the text it shows, so a
 * keystroke draws this field and nothing else; what was typed goes to the filter `SEARCH_DELAY`
 * after the last key, or at once for Enter, for Esc and the clear button (the field's own) and when
 * the field is left. The text is sent as it is (the engine trims it). While an input method
 * composes nothing is armed: the text goes `SEARCH_DELAY` after the composition ends. A search that
 * the filter takes from outside (a controlled parent, `clearFilter()`) replaces the text and drops
 * a pending one; a search the field sent itself, which a parent may give back later than a newer
 * keystroke, does not.
 */
export function SearchBox({ label, placeholder }: SearchBoxProps) {
  const { filter, apply } = useFilterView();
  const held = filter.search ?? '';
  const [text, setText] = useState(held);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // The text that waits for the timer, `null` when none does.
  const pending = useRef<string | null>(null);
  // The last search this field sent or took from the filter: what tells a change from outside from the echo
  // of one of its own.
  const known = useRef(held);
  // The text of the last change event of the input. It tells typing, which waits, from the clear button
  // and Esc, which change the text with no change event of the input.
  const typed = useRef<string | null>(null);
  const latest = useRef(filter);
  useWriteOnCommit(() => {
    latest.current = filter;
  });

  const drop = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    pending.current = null;
  }, []);
  const send = useCallback(
    (search: string) => {
      drop();
      known.current = search;
      apply(withSearch(latest.current, search));
    },
    [apply, drop],
  );
  const flush = () => {
    if (pending.current !== null) send(pending.current);
  };

  useEffect(() => {
    if (held === known.current) return;
    known.current = held;
    drop();
    setText(held);
  }, [held, drop]);
  useEffect(() => drop, [drop]);

  // Typed text waits for the timer, and while an input method composes it waits for the end of the
  // composition, which arms it.
  const arm = (next: string) => {
    drop();
    pending.current = next;
    timer.current = setTimeout(() => send(next), SEARCH_DELAY);
  };
  const composition = useComposition(arm);
  const change = (next: string) => {
    setText(next);
    const isTyping = typed.current === next;
    typed.current = null;
    if (!isTyping) {
      send(next);
      return;
    }
    if (composition.composing.current) {
      drop();
      pending.current = next;
    } else {
      arm(next);
    }
  };

  return (
    <SearchField
      className="flg-data-grid-search"
      size="md"
      aria-label={label}
      placeholder={placeholder}
      value={text}
      {...composition.props}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        typed.current = event.target.value;
      }}
      onValueChange={change}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        // Enter that confirms a candidate of an input method is the method's.
        if (event.key === 'Enter' && !isComposing(event)) flush();
      }}
      onBlur={flush}
    />
  );
}
