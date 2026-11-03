'use client';

import { clsx } from 'clsx';
import { forwardRef, useMemo, useRef } from 'react';
import type {
  ChangeEvent,
  ClipboardEvent,
  FocusEvent,
  InputHTMLAttributes,
  KeyboardEvent,
  MouseEvent,
} from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { dataAttr } from '../../internal/data-attr';
import { markAsFieldControl, useFieldProps } from '../../internal/field-context';
import { CloseIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';
import { hasModifier } from '../../internal/roving';
import { useAnnounce } from '../../internal/use-announce';
import { useControllableState } from '../../internal/use-controllable-state';
import { useFormReset } from '../../internal/use-form-reset';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { useWriteOnCommit } from '../../internal/use-write-on-commit';
import { devWarn } from '../../internal/warn';
import { Badge } from '../badge/Badge';
import { splitTags } from './split-tags';

export interface TagInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'size'
> {
  /** The tags. Pass it with `onValueChange` to control them. */
  value?: string[];
  /** The tags at first, when uncontrolled. */
  defaultValue?: string[];
  /** Called with all the tags whenever one is added or removed by the user. */
  onValueChange?: (value: string[]) => void;
  /** The text typed and not yet a tag. Pass it with `onInputValueChange` to control it. */
  inputValue?: string;
  /** The text at first, when uncontrolled. */
  defaultInputValue?: string;
  /** Called with the text whenever it changes: typed by the user, or changed by the TagInput. */
  onInputValueChange?: (text: string) => void;
  /**
   * What ends a tag: one-character strings, and `"Enter"` for the Enter key (and, in pasted text, for
   * line breaks). Default `["Enter", ","]`.
   */
  separators?: string[];
  size?: 'sm' | 'md' | 'lg';
  /** Marks the value as wrong. Inside a Field with an error this is already true. */
  invalid?: boolean;
  /**
   * The words the TagInput announces and labels its buttons with. Default `{ remove: (tag) =>
   * "Remove <tag>", added: (tag) => "<tag> added", removed: (tag) => "<tag> removed" }`.
   */
  labels?: {
    remove?: (tag: string) => string;
    added?: (tag: string) => string;
    removed?: (tag: string) => string;
  };
}

const NO_TAGS: string[] = [];
const DEFAULT_SEPARATORS = ['Enter', ','];

/** Keys the input method owns while text is being composed (keyCode 229 is how Safari says so). */
const composing = (event: KeyboardEvent) => event.nativeEvent.isComposing || event.keyCode === 229;

/**
 * A text input whose tags sit in the same frame as chips with a remove button. A separator, Enter, a
 * paste, or leaving with text typed makes a tag; the tags go into forms as one hidden input each.
 * `ref` is the text input; `className` and `style` go on the element around the frame.
 */
export const TagInput = markAsFieldControl(
  forwardRef<HTMLInputElement, TagInputProps>(function TagInput(props, ref) {
    const {
      value,
      defaultValue,
      onValueChange,
      inputValue,
      defaultInputValue,
      onInputValueChange,
      separators = DEFAULT_SEPARATORS,
      size = 'md',
      invalid: invalidProp,
      labels,
      name,
      form,
      className,
      style,
      onChange,
      onKeyDown,
      onPaste,
      onCompositionStart,
      onCompositionEnd,
      ...rest
    } = props;
    const { invalid, required, disabled, ...inputProps } = useFieldProps({
      ...rest,
      invalid: invalidProp,
    });
    const readOnly = props.readOnly === true;
    const removeLabel = labels?.remove ?? ((tag: string) => `Remove ${tag}`);
    const addedLabel = labels?.added ?? ((tag: string) => `${tag} added`);
    const removedLabel = labels?.removed ?? ((tag: string) => `${tag} removed`);
    const { announce, region } = useAnnounce();

    const longOnes = separators.filter((one) => one !== 'Enter' && [...one].length !== 1);
    if (longOnes.length > 0) {
      devWarn(
        `<TagInput> separators has entries that are longer than one character and not "Enter": ` +
          `${longOnes.map((one) => JSON.stringify(one)).join(', ')}. They never match a typed key.`,
      );
    }
    const hasEnter = separators.includes('Enter');
    const characters = useMemo(
      () => new Set(separators.filter((one) => [...one].length === 1)),
      [separators],
    );

    const [tags, setTags, resetTags] = useControllableState<string[]>({
      value,
      defaultValue: defaultValue ?? NO_TAGS,
      onChange: onValueChange,
      name: 'TagInput value',
    });
    const [text, setText, resetText] = useControllableState<string>({
      value: inputValue,
      defaultValue: defaultInputValue ?? '',
      onChange: onInputValueChange,
      name: 'TagInput inputValue',
    });

    // The tags a handler adds to: those of the last commit, or what an earlier call in the same
    // event made them (a paste, a key that sends a text on, two blurs in a row). A controlled value
    // is the parent's to change, so only the commit writes it then.
    const latestTags = useRef(tags);
    useWriteOnCommit(() => {
      latestTags.current = tags;
    });
    const controlled = value !== undefined;
    const changeTags = (next: string[]) => {
      if (!controlled) latestTags.current = next;
      setTags(next);
    };
    const add = (parts: string[]) => {
      if (parts.length === 0) return;
      changeTags([...latestTags.current, ...parts]);
      announce(parts.map(addedLabel).join('. '));
    };

    const rootRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, inputRef), [ref]);
    const buttons = () =>
      Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);

    // A removal moves focus once the tags are rendered: the button that takes the removed one's
    // place, which is only known then. `from` tells this commit from one that left the tags as they
    // were (a controlled parent that said no).
    const focusAfter = useRef<{ from: string[]; index: number } | null>(null);
    useIsoLayoutEffect(() => {
      const pending = focusAfter.current;
      if (!pending || pending.from === tags) return;
      focusAfter.current = null;
      const target = buttons()[Math.min(pending.index, tags.length - 1)];
      (target ?? inputRef.current)?.focus();
    });
    const removeAt = (index: number, focus: 'keyboard' | 'pointer') => {
      const removed = latestTags.current[index];
      if (removed === undefined) return;
      // A press on the button is a pointer's business: the focus goes to the input, where the next
      // tag is typed. Keys follow the rule of the keyboard: the button that took its place.
      if (focus === 'keyboard') focusAfter.current = { from: tags, index };
      else inputRef.current?.focus();
      changeTags(latestTags.current.filter((_, at) => at !== index));
      announce(removedLabel(removed));
    };

    // --- Text. A separator typed ends the text before it as a tag; the rest stays typed. Text that
    // is being composed is left alone: it is not the user's yet. The same goes for the text of a
    // composition that ends: the input event that follows it, or a leave, takes it.
    const isComposing = useRef(false);
    const setTyped = (next: string, composingNow = isComposing.current) => {
      if (composingNow || readOnly) {
        setText(next);
        return;
      }
      const chars = [...next];
      const cut = chars.findLastIndex((char) => characters.has(char));
      if (cut === -1) {
        setText(next);
        return;
      }
      add(splitTags(chars.slice(0, cut + 1).join(''), separators));
      setText(chars.slice(cut + 1).join(''));
    };
    /** Makes what is typed tags, all of it: the separators it still holds split it. */
    const flush = () => {
      if (readOnly || text.trim() === '') return;
      add(splitTags(text, separators));
      setText('');
    };
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      setTyped(
        event.target.value,
        isComposing.current || (event.nativeEvent as InputEvent).isComposing === true,
      );
    };
    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
      if (readOnly) return;
      const input = event.currentTarget;
      const pasted = event.clipboardData?.getData('text') ?? '';
      // Text with nothing to split at is text: it goes into the input as it does anywhere.
      if (![...pasted].some((char) => characters.has(char) || (hasEnter && /[\r\n]/.test(char)))) {
        return;
      }
      event.preventDefault();
      const before = input.value.slice(0, input.selectionStart ?? input.value.length);
      const after = input.value.slice(input.selectionEnd ?? input.value.length);
      add(splitTags(before + pasted + after, separators));
      setText('');
    };

    // --- Keyboard in the input.
    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (composing(event) || hasModifier(event)) return;
      const input = event.currentTarget;
      if (event.key === 'Enter') {
        // Enter on empty text is left alone: the form submits, with the tags it has.
        if (!hasEnter || readOnly || text.trim() === '') return;
        event.preventDefault();
        flush();
      } else if (
        (event.key === 'Backspace' && text === '') ||
        (event.key === 'ArrowLeft' &&
          !event.shiftKey &&
          input.selectionStart === 0 &&
          input.selectionEnd === 0)
      ) {
        // A held Backspace would run on into the tags, and past them.
        const last = buttons().at(-1);
        if (event.repeat || !last || last.disabled) return;
        event.preventDefault();
        last.focus();
      }
    };

    // --- Keyboard on a remove button. Its Enter and Space are the click of the button.
    const handleButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (composing(event) || hasModifier(event)) return;
      const all = buttons();
      const { key } = event;
      if (key === 'Backspace' || key === 'Delete') {
        event.preventDefault();
        if (!event.repeat) removeAt(index, 'keyboard');
      } else if (key === 'ArrowLeft') {
        event.preventDefault();
        all[Math.max(index - 1, 0)]?.focus();
      } else if (key === 'ArrowRight') {
        event.preventDefault();
        (all[index + 1] ?? inputRef.current)?.focus();
      } else if (key === 'Home' || key === 'End') {
        event.preventDefault();
        all[key === 'Home' ? 0 : all.length - 1]?.focus();
      } else if (key === 'Escape') {
        // The Esc is the TagInput's: a Dialog around it stays open.
        event.preventDefault();
        event.stopPropagation();
        inputRef.current?.focus();
      } else if ([...key].length === 1 && key !== ' ') {
        // A printable key is typing: back to the input, and into it.
        event.preventDefault();
        inputRef.current?.focus();
        setTyped(text + key);
      }
    };

    // --- Leaving. Focus moving to the TagInput's own buttons is not leaving; focus moving out of the
    // window is not either, the user comes back to the text.
    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
      const to = event.relatedTarget as Node | null;
      if (to && rootRef.current?.contains(to)) return;
      if (!to && !document.hasFocus()) return;
      flush();
    };
    // A press on the frame, but not on a chip or a button, focuses the input, as on Input's frame.
    const handleFrameMouseDown = (event: MouseEvent<HTMLDivElement>) => {
      const target = event.target as Element;
      if (event.button !== 0 || disabled || target === inputRef.current) return;
      if (target.closest('.flg-tag')) return;
      event.preventDefault();
      inputRef.current?.focus();
    };

    // The browser resets the text input by itself; the tags and the text are React's to put back.
    useFormReset(inputRef, () => {
      resetTags(defaultValue ?? NO_TAGS);
      resetText(defaultInputValue ?? '');
    });

    const seen = new Map<string, number>();
    const items = tags.map((tag, index) => {
      const times = seen.get(tag) ?? 0;
      seen.set(tag, times + 1);
      return (
        <li key={`${times}:${tag}`} className="flg-tag-input-item">
          <Badge variant="neutral" className="flg-tag">
            {tag}
            <button
              type="button"
              tabIndex={-1}
              aria-label={removeLabel(tag)}
              disabled={disabled || readOnly}
              onKeyDown={(event) => handleButtonKeyDown(event, index)}
              // A click with a detail came from a pointer; Enter and Space click with none.
              onClick={(event) => removeAt(index, event.detail === 0 ? 'keyboard' : 'pointer')}
            >
              <CloseIcon width={10} height={10} aria-hidden="true" />
            </button>
          </Badge>
        </li>
      );
    });

    return (
      // The root only watches where focus goes.
      <div
        ref={rootRef}
        className={clsx('flg-tag-input', className)}
        style={style}
        data-size={size}
        data-invalid={dataAttr(invalid)}
        data-disabled={dataAttr(disabled)}
        data-readonly={dataAttr(readOnly)}
        onBlur={handleBlur}
      >
        {/* The frame only forwards presses to the input; keyboard users reach it directly. */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          className="flg-input flg-tag-input-box"
          data-size={size}
          data-invalid={dataAttr(invalid)}
          data-disabled={dataAttr(disabled)}
          onMouseDown={handleFrameMouseDown}
        >
          {tags.length > 0 ? (
            <ul ref={listRef} className="flg-tag-input-list">
              {items}
            </ul>
          ) : null}
          <input
            {...inputProps}
            ref={mergedRef}
            type="text"
            form={form}
            value={text}
            disabled={disabled}
            // Only the text input is validated (a hidden input is not), and only while there is no
            // tag to show for it; the attribute says it to assistive technology all the time.
            required={required && tags.length === 0}
            aria-required={required || undefined}
            onChange={composeEventHandlers(onChange, handleChange)}
            onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
            onPaste={composeEventHandlers(onPaste, handlePaste)}
            onCompositionStart={composeEventHandlers(onCompositionStart, () => {
              isComposing.current = true;
            })}
            onCompositionEnd={composeEventHandlers(onCompositionEnd, () => {
              isComposing.current = false;
            })}
          />
        </div>
        {name
          ? tags.map((tag, index) => (
              <input
                key={index}
                type="hidden"
                name={name}
                value={tag}
                form={form}
                disabled={disabled}
              />
            ))
          : null}
        {region}
      </div>
    );
  }),
);
