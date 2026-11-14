'use client';

import { clsx } from 'clsx';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent, InputHTMLAttributes, KeyboardEvent } from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { dataAttr } from '../../internal/data-attr';
import { markAsFieldControl, useFieldContext } from '../../internal/field-context';
import { ArrowIcon, CloseIcon, SearchIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';
import { useApplePlatform } from '../../internal/platform';
import { isComposing } from '../../internal/roving';
import { parseKeys, shortcutText, toAriaKeyShortcuts } from '../../internal/shortcut-format';
import { useControllableState } from '../../internal/use-controllable-state';
import { useFormReset } from '../../internal/use-form-reset';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { useRequireName } from '../../internal/use-require-name';
import { useWriteOnCommit } from '../../internal/use-write-on-commit';
import { devWarn } from '../../internal/warn';
import { withDefaults } from '../../internal/with-defaults';
import { IconButton } from '../icon-button/IconButton';
import { Input } from '../input/Input';
import { TooltipContent, TooltipRoot, TooltipTrigger } from '../tooltip/Tooltip';
import { useShortcut } from './shortcut';
import type { Shortcut } from './shortcut';

export interface SearchFieldLabels {
  /** The name of the button that clears the text. */
  clear: string;
  /** The name of the button that opens a `collapsible` field. */
  open: string;
  /** The name of the button that closes it again on a narrow screen. */
  close: string;
  /** The text of the key hint. `apple` is true where the shortcut key is ⌘. */
  shortcut: (shortcut: Shortcut, apple: boolean) => string;
}

export interface SearchFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type' | 'value' | 'defaultValue'
> {
  /** The text. Pass it with `onValueChange` to control it. */
  value?: string;
  /** The text at first, when uncontrolled. Also what a form reset puts back. */
  defaultValue?: string;
  /** Called with the text whenever it changes: typed, cleared with the button or with Esc. */
  onValueChange?: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  /** Marks the value as wrong. Inside a Field with an error this is already true. */
  invalid?: boolean;
  /** A key that focuses the field from anywhere on the page: `"/"`, or `"mod+k"` (⌘K, Ctrl K). */
  shortcut?: Shortcut;
  /** Rests as a button with a tooltip, and opens as the field. */
  collapsible?: boolean;
  /** Default English words; any of them can be replaced. */
  labels?: Partial<SearchFieldLabels>;
}

const DEFAULT_LABELS: SearchFieldLabels = {
  clear: 'Clear search',
  open: 'Search',
  close: 'Close search',
  shortcut: (shortcut, apple) => shortcutText(parseKeys(shortcut).parts, apple),
};

const isShortcut = (value: unknown): value is Shortcut => value === '/' || value === 'mod+k';

interface KeyHintProps {
  shortcut: Shortcut;
  labels: SearchFieldLabels;
  apple: boolean | undefined;
}

/**
 * The hint of the key. `⌘K` or `Ctrl K` is known only once the platform is: until then the key is
 * there but empty and hidden, so the HTML from the server and the first render in the browser agree.
 */
function KeyHint({ shortcut, labels, apple }: KeyHintProps) {
  const text =
    apple === undefined && shortcut === 'mod+k' ? '' : labels.shortcut(shortcut, !!apple);
  return (
    <kbd className="flg-search-field-kbd" aria-hidden="true" hidden={text === ''}>
      {text}
    </kbd>
  );
}

/** The value of `aria-keyshortcuts`, or `undefined` while the platform is not known. */
function keyShortcuts(shortcut: Shortcut | undefined, apple: boolean | undefined) {
  if (shortcut === undefined || (shortcut === 'mod+k' && apple === undefined)) return undefined;
  return toAriaKeyShortcuts(parseKeys(shortcut).parts, !!apple);
}

/**
 * A search field: a text input of type `search` with a magnifier, a button that clears it, and, with
 * `shortcut`, a key that focuses it from anywhere on the page. With `collapsible` it rests as a
 * button that opens it. It is a form control like `Input`: `className` and `style` go on the root,
 * every other prop on `<input>`, which is what `ref` points to.
 */
export const SearchField = markAsFieldControl(
  forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
    {
      value,
      defaultValue,
      onValueChange,
      size,
      shortcut: shortcutProp,
      collapsible = false,
      labels: labelsProp,
      className,
      style,
      onChange,
      onKeyDown,
      ...props
    },
    ref,
  ) {
    const field = useFieldContext();
    const disabled = Boolean(props.disabled ?? field?.disabled);
    const inactive = disabled || Boolean(props.readOnly);
    const labels = withDefaults(DEFAULT_LABELS, labelsProp);
    const shortcut = isShortcut(shortcutProp) ? shortcutProp : undefined;
    useEffect(() => {
      if (shortcutProp !== undefined && shortcut === undefined) {
        devWarn('<SearchField> shortcut must be "/" or "mod+k"; it is ignored.');
      }
    }, [shortcutProp, shortcut]);
    const apple = useApplePlatform();

    const [current, setValue, resetValue] = useControllableState<string>({
      value,
      defaultValue: defaultValue ?? '',
      onChange: onValueChange,
      name: 'SearchField value',
    });
    const empty = current === '';

    const inputRef = useRef<HTMLInputElement>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, inputRef), [ref]);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const defaultRef = useRef(defaultValue);
    useWriteOnCommit(() => {
      defaultRef.current = defaultValue;
    });
    // The form resets the input behind React's back; put the text back, so the clear button follows.
    useFormReset(inputRef, () => resetValue(defaultRef.current ?? ''), props.form);

    // A label that points at the field names it too, and only the DOM knows that (a Field's label
    // is its own element), so it is asked once the field is there. A placeholder is not a name.
    useRequireName(props, 'SearchField', {
      otherName: {
        description: 'give it a Field label or a <label> (a placeholder is not a name)',
        given: () => (inputRef.current?.labels?.length ?? 0) > 0,
      },
    });

    // H3: whether the field is open. Not controlled (spec phase 5 §6.3). Where focus goes when the
    // state changes is decided by whoever changed it, and done once the element is there.
    const [open, setOpen] = useState(false);
    const isOpen = collapsible && open;
    const focusAfter = useRef<'input' | 'select' | 'button' | null>(null);
    useIsoLayoutEffect(() => {
      const target = focusAfter.current;
      focusAfter.current = null;
      if (target === 'button') {
        buttonRef.current?.focus();
      } else if (target !== null) {
        inputRef.current?.focus();
        if (target === 'select') inputRef.current?.select();
      }
    }, [isOpen]);

    const clear = () => {
      setValue('');
      inputRef.current?.focus();
    };
    const close = (focusButton: boolean) => {
      if (focusButton) focusAfter.current = 'button';
      setOpen(false);
    };

    // The shortcut opens a collapsed field, then focuses it and selects the text, which the next key
    // replaces. A field that cannot be typed into does not take the key, and neither does one the
    // user cannot reach. Whether the focus can get there is the browser's to say, so the element
    // that is there now (the input, or the button of a collapsed field) is focused, and the field
    // takes the key only if it has the focus then: out of sight (`display: none`, `visibility:
    // hidden`), under the `inert` of a sheet or under any modal (the library's Dialog and Drawer, or
    // a `<dialog>` the app opened with `showModal()`) it does not. Then the key goes on to the page,
    // and a collapsed field stays shut. `[inert]` is also asked first: jsdom has no inert.
    useShortcut(
      shortcut,
      () => {
        const root = rootRef.current;
        if (root === null || root.closest('[inert]') !== null) return false;
        const collapsed = collapsible && !open;
        const target = collapsed ? buttonRef.current : inputRef.current;
        target?.focus();
        // `:focus`, not `document.activeElement`, which is the host of a shadow tree around it.
        if (target === null || !target.matches(':focus')) return false;
        if (collapsed) {
          focusAfter.current = 'select';
          setOpen(true);
        } else {
          inputRef.current?.select();
        }
        return true;
      },
      !inactive,
    );

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      // Esc during an input method's composition cancels the candidate, not the text.
      if (event.key !== 'Escape' || isComposing(event)) return;
      // The text first, then the field: and a Dialog around it stays open for both. A field that is
      // not collapsible, and empty or one that cannot be changed, leaves Esc to whoever is around it;
      // a collapsible one closes with its text kept.
      if (!empty && !inactive) {
        event.preventDefault();
        clear();
      } else if (collapsible) {
        event.preventDefault();
        close(true);
      }
    };

    // An empty field that has lost the focus closes. `relatedTarget` is where the focus went; it is
    // null for a click on the page and for a window that lost the focus, and only in the second the
    // field keeps being the active element.
    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
      if (!isOpen || !empty) return;
      const root = event.currentTarget;
      if (root.contains(event.relatedTarget) || root.contains(document.activeElement)) return;
      close(false);
    };

    // A field that cannot take its key (`disabled`, `readOnly`) does not show it or say it: it would
    // promise a key that does nothing. An `aria-keyshortcuts` of the caller is theirs, and kept.
    const hint = shortcut !== undefined && empty && !inactive;
    const keyshortcuts =
      props['aria-keyshortcuts'] ?? (inactive ? undefined : keyShortcuts(shortcut, apple));

    return (
      <div
        ref={rootRef}
        className={clsx('flg-search-field', className)}
        style={style}
        data-collapsible={dataAttr(collapsible)}
        data-open={dataAttr(isOpen)}
        onBlur={handleBlur}
      >
        {collapsible && !isOpen ? (
          <TooltipRoot describe={false}>
            <TooltipTrigger>
              <IconButton
                ref={buttonRef}
                variant="ghost"
                aria-label={labels.open}
                aria-keyshortcuts={keyshortcuts}
                disabled={disabled}
                onClick={() => {
                  focusAfter.current = 'input';
                  setOpen(true);
                }}
              >
                <SearchIcon />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center" sideOffset={8}>
              {labels.open}
              {shortcut !== undefined && !inactive ? (
                <KeyHint shortcut={shortcut} labels={labels} apple={apple} />
              ) : null}
            </TooltipContent>
          </TooltipRoot>
        ) : null}
        {isOpen ? (
          <IconButton
            variant="ghost"
            className="flg-search-field-back"
            aria-label={labels.close}
            onClick={() => close(true)}
          >
            <ArrowIcon direction="left" />
          </IconButton>
        ) : null}
        <Input
          {...props}
          ref={mergedRef}
          type="search"
          size={size === 'sm' || size === 'lg' ? size : 'md'}
          value={current}
          aria-keyshortcuts={keyshortcuts}
          onChange={composeEventHandlers(onChange, (event: ChangeEvent<HTMLInputElement>) =>
            setValue(event.target.value),
          )}
          onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
          startContent={<SearchIcon />}
          endContent={
            !empty && !inactive ? (
              <button
                type="button"
                className="flg-search-field-clear"
                aria-label={labels.clear}
                onClick={clear}
              >
                <CloseIcon />
              </button>
            ) : hint ? (
              <KeyHint shortcut={shortcut} labels={labels} apple={apple} />
            ) : null
          }
        />
      </div>
    );
  }),
);
