'use client';

import { clsx } from 'clsx';
import { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react';
import type {
  ChangeEvent,
  CSSProperties,
  FocusEvent,
  KeyboardEvent,
  ReactElement,
  ReactNode,
} from 'react';
import { markPart } from '../../internal/collect-children';
import { dataAttr } from '../../internal/data-attr';
import { focusInput } from '../../internal/focus-input';
import { markAsFieldControl, useFieldContext, useFieldProps } from '../../internal/field-context';
import { CheckIcon, ChevronIcon } from '../../internal/icons';
import { readRows } from '../../internal/list-rows';
import type { ListParts, Option, Row } from '../../internal/list-rows';
import { mergeRefs } from '../../internal/merge-refs';
import { getNextIndex, isComposing } from '../../internal/roving';
import { useControllableState } from '../../internal/use-controllable-state';
import { useFloating } from '../../internal/use-floating';
import { useAnnounce } from '../../internal/use-announce';
import { useFormReset } from '../../internal/use-form-reset';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { usePopover } from '../../internal/use-popover';
import { usePopoverState, useTriggerPress } from '../../internal/use-popover-trigger';
import { useWriteOnCommit } from '../../internal/use-write-on-commit';
import { devWarn, isProduction } from '../../internal/warn';
import { containsFolded, findMatchFolded, foldText, foldWithMap } from './match';
import type { FoldedText } from './match';

const COMBOBOX_PARTS: ListParts = {
  item: 'combobox-item',
  group: 'combobox-group',
  separator: 'combobox-separator',
  owner: 'Combobox',
};

/** What a `filter` function is given: the item, by its value and its text. */
export interface ComboboxFilterItem {
  value: string;
  textValue: string;
}

export interface ComboboxProps {
  /** The chosen item's value; `null` chooses nothing. Pass it with `onValueChange` to control it. */
  value?: string | null;
  /** The chosen item's value at first, when uncontrolled. */
  defaultValue?: string;
  /** Called with the value the user chooses, or `null` when they clear the text and leave. */
  onValueChange?: (value: string | null) => void;
  /** The text in the input. Pass it with `onInputValueChange` to control it. */
  inputValue?: string;
  /** The text at first, when uncontrolled. Default: the text of the chosen item. */
  defaultInputValue?: string;
  /** Called with the text whenever it changes: typed by the user, or changed by the Combobox. */
  onInputValueChange?: (text: string) => void;
  /** Whether the listbox is open. Pass it with `onOpenChange` to control it. */
  open?: boolean;
  /** Whether the listbox starts open, when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the new state whenever the listbox opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Which items match the text typed. Default: the item's text contains it, ignoring case and
   * diacritics. `false` shows every item, for a list the app filters itself.
   */
  filter?: ((item: ComboboxFilterItem, inputValue: string) => boolean) | false;
  /**
   * Lets the user commit text that is no item: Enter, or leaving the input, makes the text the value
   * (the item's value when the text folds to an item's text). Esc on a closed list clears both.
   */
  allowCustomValue?: boolean;
  /**
   * Shows `labels.loading` below the options (instead of "No results"), for a list the app is
   * fetching. Pair it with `filter={false}`.
   */
  loading?: boolean;
  /** Shown, muted, while the input is empty. */
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Marks the value as wrong. Inside a Field with an error this is already true. */
  invalid?: boolean;
  /** The name the value is submitted under, through a hidden native `<select>`. */
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  /** The input's id. */
  id?: string;
  /** On the element around the input. */
  className?: string;
  /** On the element around the input. */
  style?: CSSProperties;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /**
   * The words the Combobox shows and announces. Default `{ noResults: "No results", loading:
   * "Loading…", results: (n) => "1 result" | "n results" }`.
   */
  labels?: { noResults?: string; loading?: string; results?: (count: number) => string };
  /** `ComboboxItem`, `ComboboxGroup` and `ComboboxSeparator`, read without rendering them. */
  children: ReactNode;
}

export interface ComboboxItemProps {
  /** Not empty: an empty value is how the native `<select>` says nothing is chosen. */
  value: string;
  disabled?: boolean;
  /** The text the filter matches and the input shows once chosen. Default: the item's text. */
  textValue?: string;
  children?: ReactNode;
}

export interface ComboboxGroupProps {
  /** Names the group. */
  label: ReactNode;
  children?: ReactNode;
}

/** Takes no props. */
export type ComboboxSeparatorProps = Record<string, never>;

const OUTSIDE = (part: string) => `<${part}> must be rendered inside a <Combobox>.`;

const CHEVRON = <ChevronIcon className="flg-select-chevron" direction="down" />;
// Only forced colours show it (combobox.css): the chosen option has no other mark there.
const CHECK = (
  <span className="flg-combobox-check" aria-hidden="true">
    <CheckIcon />
  </span>
);

/** The options of `rows`, in list order. */
function optionsOf(rows: Row[]): Option[] {
  return rows.flatMap((row) =>
    row.kind === 'option' ? [row.option] : row.kind === 'group' ? optionsOf(row.rows) : [],
  );
}

/**
 * The rows whose options `keep` accepts. A group with none left goes, and so does every separator
 * that would lead, trail or follow another.
 */
function filterRows(rows: Row[], keep: (option: Option) => boolean): Row[] {
  const out: Row[] = [];
  const add = (row: Row) => {
    const last = out[out.length - 1];
    if (row.kind === 'separator' && (last === undefined || last.kind === 'separator')) return;
    out.push(row);
  };
  for (const row of rows) {
    if (row.kind === 'option') {
      if (keep(row.option)) add(row);
    } else if (row.kind === 'group') {
      const inner = filterRows(row.rows, keep);
      if (inner.length > 0) add({ ...row, rows: inner });
    } else {
      add(row);
    }
  }
  if (out[out.length - 1]?.kind === 'separator') out.pop();
  return out;
}

/**
 * The text of an option with the first match of the typed text in bold. `folded` is the option's text
 * and `foldedQuery` the typed text, both folded already.
 */
function withMatch(option: Option, folded: FoldedText, foldedQuery: string): ReactNode {
  const text = option.children;
  // Only plain text can be cut: an element would need to be looked into. And only text that is the
  // item's own (no other `textValue`), or the positions found would not be the shown text's.
  if (typeof text !== 'string' || text !== option.text) return text;
  const match = findMatchFolded(text, folded, foldedQuery);
  if (!match) return text;
  return (
    <>
      {text.slice(0, match.start)}
      <span className="flg-combobox-match">{text.slice(match.start, match.end)}</span>
      {text.slice(match.end)}
    </>
  );
}

/**
 * A text input with a listbox that filters as you type, and a hidden native `<select>` that takes
 * part in forms (FormData, `required`, reset). The user chooses an item: text that matches none is
 * put back when they leave, unless `allowCustomValue` makes it the value. `ref` is the input;
 * `className` and `style` go on the element around it.
 */
export const Combobox = markAsFieldControl(
  forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(props, ref) {
    const {
      name,
      placeholder,
      size = 'md',
      filter,
      className,
      style,
      children,
      labels,
      allowCustomValue = false,
      loading = false,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
    } = props;
    const field = useFieldContext();
    const fieldProps = useFieldProps({
      id: props.id,
      invalid: props.invalid,
      required: props.required,
      disabled: props.disabled,
      'aria-describedby': props['aria-describedby'],
    });
    const { invalid, required = false, disabled = false } = fieldProps;
    const noResults = labels?.noResults ?? 'No results';
    const loadingLabel = labels?.loading ?? 'Loading…';
    const resultsLabel =
      labels?.results ?? ((count: number) => (count === 1 ? '1 result' : `${count} results`));
    const { announce, region } = useAnnounce();

    // --- Items, read from children without rendering them; again only when the children change.
    const { rows, options } = useMemo(() => readRows(children, COMBOBOX_PARTS), [children]);

    // --- Value, and the text that stands for it.
    const [value, setValue, resetValue] = useControllableState<string | null>({
      value: props.value,
      defaultValue: props.defaultValue ?? null,
      onChange: props.onValueChange,
      name: 'Combobox value',
    });
    const chosen = options.find((option) => option.value === value);
    // The last item seen for the value. An app that filters on the server may hand back a list
    // without the chosen item while the user types; the value is still chosen, and the text that
    // stands for it and the option the form submits must not go with the item.
    const lastChosen = useRef<{ value: string; text: string } | null>(null);
    useWriteOnCommit(() => {
      if (chosen) lastChosen.current = { value: chosen.value, text: chosen.text };
    });
    const kept = chosen
      ? undefined
      : lastChosen.current?.value === value
        ? lastChosen.current
        : null;
    /**
     * The text that stands for a value: its item's, the item's last known text when it has left the
     * list, or for a custom value, the value itself.
     */
    const textFor = (of: string | null) =>
      options.find((option) => option.value === of)?.text ??
      (of !== null && lastChosen.current?.value === of ? lastChosen.current.text : undefined) ??
      (allowCustomValue && of ? of : '');
    const chosenText = textFor(value);
    if (
      !isProduction() &&
      !allowCustomValue &&
      value !== null &&
      value !== '' &&
      !chosen &&
      !kept
    ) {
      devWarn(`<Combobox> has a value that matches no ComboboxItem: "${value}".`);
    }
    const [text, setText] = useControllableState<string>({
      value: props.inputValue,
      defaultValue: props.defaultInputValue ?? chosenText,
      onChange: props.onInputValueChange,
      name: 'Combobox inputValue',
    });

    // --- Announcements. The count of results is said 500ms after the last keystroke (`announce` joins
    // the calls made in a row), and again when it changes after that while the listbox stays open,
    // as when results arrive from a server. `typed` counts keystrokes: a keystroke that leaves the
    // count as it was still says it. While loading the count is stale, so only the loading label is
    // said (once per loading), and the count follows when loading ends.
    const resultsDue = useRef(false);
    const [typed, setTyped] = useState(0);
    const loadingSaid = useRef(false);

    // --- Open state, the typed text that filters, and the highlighted option (its index in the whole
    // list, not in what is left of it).
    const { open, request, report, contentRef, pendingToggle } = usePopoverState<HTMLDivElement>({
      open: props.open,
      defaultOpen: props.defaultOpen ?? false,
      onOpenChange: props.onOpenChange,
      name: 'Combobox open',
    });
    // The text typed since the listbox opened or since the last choice, or null: then every item
    // shows (opened by a key or a press, or just chosen).
    const [query, setQuery] = useState<string | null>(null);
    const [highlighted, setHighlighted] = useState<number | null>(null);
    // A value that changes, or whose item arrives later, brings its text with it. What the user
    // types does not: the text only follows the value when the value (or its item) is what moved.
    // The same goes for the item's text alone changing while the user is filtering (the query is
    // set): the words typed are theirs, and leaving the field puts the item's text back.
    const syncKey = `${value ?? ''}\u0000${chosenText}`;
    const syncedKey = useRef(syncKey);
    useIsoLayoutEffect(() => {
      if (syncedKey.current === syncKey) return;
      const valueMoved = syncedKey.current.split('\u0000')[0] !== (value ?? '');
      syncedKey.current = syncKey;
      if (!valueMoved && query !== null) return;
      setText(chosenText);
      // `chosenText` is part of the key; only a change of the key matters.
    }, [syncKey]);
    // The default filter and the bold match compare folded text. Each item's is folded once per
    // change of the list (by option index), and the query once per keystroke, not once per item.
    const foldedItems = useMemo(() => options.map((option) => foldWithMap(option.text)), [options]);
    const foldedQuery = useMemo(() => (query === null ? '' : foldText(query)), [query]);
    const shown = useMemo(() => {
      if (query === null || filter === false) return rows;
      if (filter !== undefined) {
        return filterRows(rows, (option) =>
          filter({ value: option.value, textValue: option.text }, query),
        );
      }
      return filterRows(rows, (option) =>
        containsFolded(foldedItems[option.index]!.folded, foldedQuery),
      );
    }, [rows, query, filter, foldedItems, foldedQuery]);
    const visible = useMemo(() => optionsOf(shown), [shown]);
    // The highlight can outlive its option (the filter or the list changed while open): only an
    // enabled one that is still shown counts.
    const active =
      highlighted !== null &&
      visible.some((option) => option.index === highlighted && !option.disabled)
        ? highlighted
        : null;
    // The listbox is there to point at only while it holds an option; the status row is not one.
    const expanded = open && visible.length > 0;
    // Open with nothing left but the status row, the panel is no listbox: one must hold options.
    const isListbox = !open || visible.length > 0;
    const resultsText = visible.length === 0 ? noResults : resultsLabel(visible.length);
    useEffect(() => {
      if (!loading) loadingSaid.current = false;
      else if (open && !loadingSaid.current) {
        loadingSaid.current = true;
        announce(loadingLabel);
      }
    }, [loading, open, loadingLabel, announce]);
    useEffect(() => {
      if (!open) {
        // Closing drops an announcement still waiting: its count is no longer on screen.
        if (resultsDue.current) announce('');
        resultsDue.current = false;
      } else if (resultsDue.current && !loading) announce(resultsText, { delay: 500 });
      // `typed` is there to say the text again after a keystroke that changed nothing in it.
    }, [typed, open, loading, resultsText, announce]);
    const highlightsMatch = filter === undefined && query !== null && query !== '';

    const frameRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, inputRef), [ref]);
    const nativeRef = useRef<HTMLSelectElement>(null);
    const baseId = useId();
    const listboxId = `${baseId}-listbox`;
    const optionId = (index: number) => `${baseId}-option-${index}`;

    const flags = visible.map((option) => ({ disabled: option.disabled }));
    /** The option a key moves to from `from` (an option index, or null for none). */
    const move = (from: number | null, key: string) => {
      const at = from === null ? -1 : visible.findIndex((option) => option.index === from);
      const next = getNextIndex(flags, at, key, { orientation: 'vertical', loop: false });
      return next === null ? null : visible[next]!.index;
    };
    /** Where an opening points: the chosen option, or the first or last that can be chosen. */
    const startAt = (edge: 'Home' | 'End') =>
      chosen && !chosen.disabled
        ? chosen.index
        : getNextIndex(
            options.map((option) => ({ disabled: option.disabled })),
            -1,
            edge,
            { orientation: 'vertical', loop: false },
          );

    // Whether the last change of the highlight came from the keyboard. Only that scrolls the list: a
    // pointer over an option at the edge must not move what it is pointing at.
    const keyed = useRef(false);
    const highlight = (index: number | null, fromKeys: boolean) => {
      keyed.current = fromKeys;
      setHighlighted(index);
    };
    // Set by an opening the Combobox asks for, read by the effect below, which tells it from one the
    // parent made (`defaultOpen`, a controlled `open`).
    const openedByUs = useRef(false);
    // `typed` filters; null shows every item. An opening scrolls once the listbox is placed
    // (`onPlaced`), not when it commits.
    const openAt = (index: number | null, typed: string | null) => {
      openedByUs.current = true;
      setQuery(typed);
      highlight(index, false);
      request(true);
    };
    useIsoLayoutEffect(() => {
      if (!open) {
        openedByUs.current = false;
        setQuery(null);
        setHighlighted(null);
        return;
      }
      const byUs = openedByUs.current;
      openedByUs.current = false;
      // Opened by the parent: text that is not the chosen item's was typed (or given), so it filters.
      if (!byUs) {
        setQuery(text !== chosenText ? text : null);
        highlight(null, false);
      }
      // Only an opening or a closing decides this; the query and the highlight change it after that.
    }, [open]);
    // A controlled parent may refuse the opening that was asked for (it keeps `open` unchanged), and
    // then the effect above never runs. Left set, the query would keep the text that follows the
    // chosen item from changing, and the flag would make a later opening by the parent look like ours.
    // Runs after every commit: an opening that is granted has already changed `open` by then.
    useIsoLayoutEffect(() => {
      if (open || !openedByUs.current) return;
      openedByUs.current = false;
      setQuery(null);
      setHighlighted(null);
    });

    // A Combobox that becomes disabled while open closes, as a native control does.
    useEffect(() => {
      if (disabled && open) request(false);
    }, [disabled, open, request]);

    // Makes the text the value, for `allowCustomValue`: empty clears it, text that folds to an item
    // is that item (a disabled one cannot be chosen), anything else is a custom value.
    // Returns the value it settles on, for the caller that must hand it to a form at once.
    // An empty text clears the value only when the user emptied it: it was not empty before, or the
    // user typed. It is also empty while the value's item has not arrived (or never will), and then
    // leaving the field must not take a saved value away.
    const userEmptied = chosenText !== '' || query !== null;
    const commitText = (): string | null => {
      if (text === '') {
        if (!userEmptied) return value;
        setValue(null);
        return null;
      }
      if (text === chosenText) return value;
      const folded = foldText(text);
      const match = options.find(
        (one) => !one.disabled && foldedItems[one.index]!.folded === folded,
      );
      const next = match ? match.value : text;
      // The value stays, but the text may be another spelling of it: put its own back.
      if (next === value) setText(textFor(next));
      else setValue(next);
      return next;
    };
    const choose = (option: Option | undefined) => {
      if (disabled || !option || option.disabled) return;
      // A new value brings its text (see `syncKey`); the one already chosen only puts it back.
      if (option.value === value) setText(option.text);
      else setValue(option.value);
      setQuery(null);
      request(false);
    };

    // --- Pointer: a press on the input, the chevron or the frame toggles the listbox, as the
    // trigger of a Select does. The browser light-dismisses an open listbox on any press outside it,
    // the input included, so a press on the open input closes it; typing opens it again.
    const press = useTriggerPress(open, (wasOpen) => {
      if (disabled) return;
      inputRef.current?.focus({ preventScroll: true });
      if (wasOpen) request(false);
      else openAt(startAt('Home'), null);
    });

    // --- Keyboard (APG combobox, list autocomplete, manual selection): focus stays on the input,
    // which points at the highlighted option with aria-activedescendant.
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setText(next);
      resultsDue.current = true;
      setTyped((count) => count + 1);
      if (open) {
        setQuery(next);
        highlight(null, false);
      } else {
        openAt(null, next);
      }
    };
    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      // Keys that pick or move through a composition belong to the input method.
      if (isComposing(event)) return;
      const { key } = event;
      // The caret moves: the highlight no longer says where the user is.
      if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End') {
        if (active !== null) highlight(null, false);
        return;
      }
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        if (event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        if (event.altKey) {
          // Alt+↓ opens without pointing at anything; Alt+↑ closes and keeps the text.
          if (key === 'ArrowDown' && !open) openAt(null, null);
          else if (key === 'ArrowUp' && open) request(false);
        } else if (!open) {
          openAt(startAt(key === 'ArrowUp' ? 'End' : 'Home'), null);
        } else if (expanded) {
          const next = move(active, key);
          if (next !== null) highlight(next, true);
        }
      } else if (key === 'Enter') {
        // Enter in an open listbox is for the listbox, never for the form. A closed one is left to
        // the browser, which submits the form.
        if (!open) {
          if (!allowCustomValue) return;
          // The form submits right after this keydown, perhaps before React has rendered the new
          // value into the hidden <select>, so it goes there now (as NumberInput does for its
          // hidden input). The option stands in until the render replaces it (`data-pending`), or
          // until a task after this keydown, when the submit has read it: a controlled parent that
          // refuses the value never renders a new one, and the stand-in must not outlive it.
          const settled = commitText();
          const native = nativeRef.current;
          if (native) {
            native.querySelector('option[data-pending]')?.remove();
            if (settled !== null && !Array.from(native.options).some((o) => o.value === settled)) {
              const pending = document.createElement('option');
              pending.value = settled;
              pending.text = textFor(settled) || settled;
              pending.setAttribute('data-pending', '');
              native.append(pending);
            }
            native.value = settled ?? '';
            setTimeout(() => {
              if (!nativeRef.current?.querySelector('option[data-pending]')) return;
              nativeRef.current.querySelector('option[data-pending]')?.remove();
              resync((count) => count + 1);
            }, 0);
          }
          return;
        }
        event.preventDefault();
        const option = active === null ? undefined : options.find((one) => one.index === active);
        if (option) {
          choose(option);
        } else {
          if (allowCustomValue) commitText();
          request(false);
        }
      } else if (key === 'Escape') {
        // An open listbox is closed by the browser. Closed, Esc puts the chosen item's text back (with
        // `allowCustomValue`, it clears the text and the value), and is left alone when there is
        // nothing to do, so that a Dialog around it closes.
        if (open) return;
        if (allowCustomValue ? text === '' : text === chosenText) return;
        event.preventDefault();
        if (allowCustomValue) {
          setValue(null);
          setText('');
        } else {
          setText(chosenText);
        }
      } else if (key === 'Tab') {
        // Focus moves on as usual, and nothing is chosen. Leaving settles the text (handleBlur).
        if (open) request(false);
      }
    };
    // All of the listbox's keyboard is on the input, so focus that leaves it any other way (app
    // code, a screen reader moving on, another window) closes the listbox. A press in the listbox
    // keeps focus here (see its onMouseDown). Leaving an empty input clears the value, which is how
    // it is cleared (there is no clear button); any other text that is not the chosen item's goes, or
    // with `allowCustomValue` becomes the value. Another window taking the focus is no leaving of the
    // text: the listbox closes, but the user comes back to what they were typing, so it is neither
    // committed nor put back.
    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
      if (contentRef.current?.contains(event.relatedTarget as Node | null)) return;
      if (open) request(false);
      if (!event.relatedTarget && !document.hasFocus()) return;
      if (allowCustomValue) commitText();
      else if (text === '') {
        if (userEmptied) setValue(null);
      } else if (text !== chosenText) setText(chosenText);
    };

    // --- The listbox: a native popover placed under the frame, as wide as it at least.
    usePopover(contentRef, {
      open,
      onOpenChange: report,
      pendingToggle,
      restoreFocusTo: () => inputRef.current,
    });
    const latest = useRef(active);
    useWriteOnCommit(() => {
      latest.current = active;
    });
    const scrollToHighlighted = () => {
      const index = latest.current;
      if (index === null) return;
      contentRef.current
        ?.querySelector<HTMLElement>(`[data-index="${index}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    };
    useFloating({
      open,
      reference: () => frameRef.current,
      floating: contentRef,
      side: 'bottom',
      align: 'start',
      offset: 6,
      // Also in select.css, so that the first placement measures the capped height.
      maxHeight: 320,
      matchWidth: true,
      onPlaced: scrollToHighlighted,
    });
    useIsoLayoutEffect(() => {
      if (open && keyed.current) scrollToHighlighted();
      // Only the highlight decides this: an opening scrolls in `onPlaced`, and the flag says whether
      // the keyboard moved it.
    }, [highlighted]);

    // --- The hidden native <select>: an empty option and one for the chosen item, kept in step with
    // the value for forms. Synced again on `resync`: after a form reset, which changes the native
    // <select> behind React's back (and a controlled parent may keep its value).
    // The chosen item's value, or a custom value, which is its own option.
    // An item that left the list keeps its option (with its last text): the value is still chosen.
    const nativeValue = chosen ? chosen.value : (allowCustomValue || kept) && value ? value : null;
    const [synced, resync] = useState(0);
    useIsoLayoutEffect(() => {
      const native = nativeRef.current;
      if (!native) return;
      native.querySelector('option[data-pending]')?.remove();
      for (const one of Array.from(native.options)) {
        one.selected = one.value === '' ? nativeValue === null : one.value === nativeValue;
      }
      // `nativeValue` and `chosenText` stand for the value and the items, which are new objects on
      // every read of children.
    }, [nativeValue, chosenText, synced]);
    // The browser resets the native <select> after the form's reset event: put an uncontrolled
    // Combobox back to its default value and that value's text, and the native one back in step with
    // a controlled value. Read at that moment, so it is the state of the last commit.
    useFormReset(nativeRef, () => {
      const defaultValue = props.defaultValue ?? null;
      resetValue(defaultValue);
      // The text it started with: `defaultInputValue` when given, else the default value's. What was
      // typed since is no query any more.
      setText(props.defaultInputValue ?? textFor(props.value !== undefined ? value : defaultValue));
      setQuery(null);
      resync((count) => count + 1);
    });

    // --- Names: the listbox has the input's name.
    const labelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : field?.labelId);
    const label = labelledBy ? undefined : ariaLabel;

    const renderRows = (list: Row[]): ReactElement[] =>
      list.map((row) => {
        if (row.kind === 'separator') {
          return <div key={row.key} role="none" className="flg-menu-separator" />;
        }
        if (row.kind === 'group') {
          const labelId = `${baseId}-group-${row.key}`;
          return (
            <div key={row.key} role="group" aria-labelledby={labelId}>
              <div id={labelId} role="presentation" className="flg-menu-label">
                {row.label}
              </div>
              {renderRows(row.rows)}
            </div>
          );
        }
        const { option } = row;
        const selected = option.value === value;
        return (
          // The options take no focus: the input keeps it and points at the highlighted option with
          // aria-activedescendant, and its keyboard handles them.
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
          <div
            key={`${option.index}-${option.value}`}
            id={optionId(option.index)}
            role="option"
            aria-selected={selected}
            aria-disabled={option.disabled || undefined}
            data-highlighted={dataAttr(active === option.index)}
            data-index={option.index}
            className="flg-menu-item flg-select-option"
            onPointerMove={(event) => {
              if (event.pointerType !== 'touch' && !option.disabled) highlight(option.index, false);
            }}
            onClick={() => choose(option)}
          >
            <span>
              {highlightsMatch
                ? withMatch(option, foldedItems[option.index]!, foldedQuery)
                : option.children}
            </span>
            {selected ? CHECK : null}
          </div>
        );
      });

    return (
      <div
        className={clsx('flg-combobox', className)}
        style={style}
        data-size={size}
        data-invalid={dataAttr(invalid)}
        data-disabled={dataAttr(disabled)}
      >
        {/* The frame only forwards presses to the input; keyboard users reach the input directly. */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
        <div
          ref={frameRef}
          className="flg-input"
          data-size={size}
          data-invalid={dataAttr(invalid)}
          data-disabled={dataAttr(disabled)}
          // A press on the chevron or the padding keeps focus on the input, as on Input's frame.
          onMouseDown={focusInput}
          onPointerDown={press.onPointerDown}
          onPointerCancel={press.onPointerCancel}
          onClick={press.onClick}
        >
          <input
            ref={mergedRef}
            type="text"
            role="combobox"
            id={fieldProps.id}
            autoComplete="off"
            placeholder={placeholder}
            value={text}
            disabled={disabled}
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={expanded ? listboxId : undefined}
            aria-activedescendant={expanded && active !== null ? optionId(active) : undefined}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={fieldProps['aria-describedby']}
            aria-invalid={fieldProps['aria-invalid']}
            aria-required={required || undefined}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
          <span className="flg-input-adornment flg-combobox-chevron" aria-hidden="true">
            {CHEVRON}
          </span>
        </div>
        <select
          ref={nativeRef}
          className="flg-select-native"
          aria-hidden="true"
          tabIndex={-1}
          name={name}
          required={required}
          disabled={disabled}
          defaultValue={nativeValue ?? ''}
          // The browser focuses an invalid native control to show its message: the input stands for
          // it.
          onFocus={() => inputRef.current?.focus()}
        >
          <option value="" />
          {nativeValue !== null ? (
            <option key={nativeValue} value={nativeValue}>
              {chosen ? chosen.text : kept ? kept.text : nativeValue}
            </option>
          ) : null}
        </select>
        {/* No focus here either: the input keeps it (see the options). */}
        <div
          ref={contentRef}
          popover="auto"
          role={isListbox ? 'listbox' : undefined}
          id={listboxId}
          className="flg-surface flg-menu flg-select-listbox"
          data-filtering={dataAttr(highlightsMatch)}
          aria-label={isListbox ? label : undefined}
          aria-labelledby={isListbox ? labelledBy : undefined}
          // Focus stays on the input: a press in the listbox must not take it.
          onMouseDown={(event) => event.preventDefault()}
        >
          {open ? renderRows(shown) : null}
          {open && (loading || visible.length === 0) ? (
            <div role="presentation" className="flg-combobox-status">
              {loading ? loadingLabel : noResults}
            </div>
          ) : null}
        </div>
        {region}
      </div>
    );
  }),
);

/** One item of a Combobox. Read by the Combobox, never rendered on its own. */
export const ComboboxItem = markPart(function ComboboxItem(props: ComboboxItemProps): null {
  void props;
  devWarn(OUTSIDE('ComboboxItem'));
  return null;
}, 'combobox-item');

/** Items under a label. Read by the Combobox, never rendered on its own. */
export const ComboboxGroup = markPart(function ComboboxGroup(props: ComboboxGroupProps): null {
  void props;
  devWarn(OUTSIDE('ComboboxGroup'));
  return null;
}, 'combobox-group');

/** A line between items. Read by the Combobox, never rendered on its own. */
export const ComboboxSeparator = markPart(function ComboboxSeparator(
  props: ComboboxSeparatorProps,
): null {
  void props;
  devWarn(OUTSIDE('ComboboxSeparator'));
  return null;
}, 'combobox-separator');
