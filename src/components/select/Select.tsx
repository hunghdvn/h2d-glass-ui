'use client';

import { clsx } from 'clsx';
import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
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
import { markAsFieldControl, useFieldContext, useFieldProps } from '../../internal/field-context';
import { BoxCheckIcon, CheckIcon, ChevronIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';
import { getNextIndex } from '../../internal/roving';
import { useControllableState } from '../../internal/use-controllable-state';
import { useFloating } from '../../internal/use-floating';
import { useFormReset } from '../../internal/use-form-reset';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { useWriteOnCommit } from '../../internal/use-write-on-commit';
import { usePopover } from '../../internal/use-popover';
import { usePopoverState, useTriggerPress } from '../../internal/use-popover-trigger';
import { useTypeahead } from '../../internal/use-typeahead';
import { devWarn, isProduction } from '../../internal/warn';
import { Chips } from './Chips';
import { readRows } from './select-rows';
import type { Option, Row } from './select-rows';

interface SelectBaseProps {
  /** The name the value is submitted under, through a hidden native `<select>`. */
  name?: string;
  /** Shown, muted, while nothing is chosen. */
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Marks the value as wrong. Inside a Field with an error this is already true. */
  invalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Passed to the hidden native `<select>`, so the browser can autofill it. */
  autoComplete?: string;
  /** The trigger's id. */
  id?: string;
  /** On the element around the trigger. */
  className?: string;
  /** On the element around the trigger. */
  style?: CSSProperties;
  /** `SelectItem`, `SelectGroup` and `SelectSeparator`, read without rendering them. */
  children: ReactNode;
  /** Whether the listbox is open. Pass it with `onOpenChange` to control it. */
  open?: boolean;
  /** Whether the listbox starts open, when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the new state whenever the listbox opens or closes. */
  onOpenChange?: (open: boolean) => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export interface SelectSingleProps extends SelectBaseProps {
  multiple?: false;
  /** The chosen value; `null` chooses nothing. Pass it with `onValueChange` to control it. */
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export interface SelectMultipleProps extends SelectBaseProps {
  multiple: true;
  /** The chosen values. Pass it with `onValueChange` to control it. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type SelectProps = SelectSingleProps | SelectMultipleProps;

export interface SelectItemProps {
  /** Not empty: an empty value is how the native `<select>` says nothing is chosen. */
  value: string;
  disabled?: boolean;
  /** The text typeahead matches and a chip of a multiple Select shows. Default: the item's text. */
  textValue?: string;
  children?: ReactNode;
}

export interface SelectGroupProps {
  /** Names the group. */
  label: ReactNode;
  children?: ReactNode;
}

/** Takes no props. */
export type SelectSeparatorProps = Record<string, never>;

const OUTSIDE = (part: string) => `<${part}> must be rendered inside a <Select>.`;

const CHEVRON = <ChevronIcon className="flg-select-chevron" direction="down" />;
const CHECK = <CheckIcon />;
const BOX_CHECK = <BoxCheckIcon />;

/**
 * A select-only combobox: a trigger that opens a listbox of options, with a hidden native `<select>`
 * that takes part in forms (FormData, `required`, reset, autofill). Choose one value, or several with
 * `multiple`. `ref` is the trigger; `className` and `style` go on the element around it.
 */
export const Select = markAsFieldControl(
  forwardRef<HTMLButtonElement, SelectProps>(function Select(props, ref) {
    const {
      name,
      placeholder,
      size = 'md',
      autoComplete,
      className,
      style,
      children,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
    } = props;
    const multiple = props.multiple === true;
    const field = useFieldContext();
    const fieldProps = useFieldProps({
      id: props.id,
      invalid: props.invalid,
      required: props.required,
      disabled: props.disabled,
      'aria-describedby': props['aria-describedby'],
    });
    const { invalid, required = false, disabled = false } = fieldProps;

    // --- Items, read from children without rendering them; again only when the children change, not
    // on every move of the highlight.
    const { rows, options } = useMemo(() => readRows(children), [children]);

    // --- Value.
    const defaultValue = multiple
      ? ((props as SelectMultipleProps).defaultValue ?? [])
      : ((props as SelectSingleProps).defaultValue ?? null);
    const [value, setValue, resetValue] = useControllableState<string | null | string[]>({
      value: props.value,
      defaultValue,
      onChange: props.onValueChange as ((value: string | null | string[]) => void) | undefined,
      name: 'Select value',
    });
    const chosen: string[] = Array.isArray(value)
      ? value
      : value === null || value === ''
        ? []
        : [value];
    if (!isProduction()) {
      for (const one of chosen) {
        if (!options.some((option) => option.value === one)) {
          devWarn(`<Select> has a value that matches no SelectItem: "${one}".`);
        }
      }
    }
    const chosenOptions = options.filter((option) => chosen.includes(option.value));
    const first = chosenOptions[0];

    // --- Open state and the highlighted option.
    const { open, request, report, contentRef, pendingToggle } = usePopoverState<HTMLDivElement>({
      open: props.open,
      defaultOpen: props.defaultOpen ?? false,
      onOpenChange: props.onOpenChange,
      name: 'Select open',
    });
    const [highlighted, setHighlighted] = useState<number | null>(null);
    // The highlight can outlive its option (the list changed while open): only an enabled one counts.
    const active =
      highlighted !== null && options[highlighted] && !options[highlighted].disabled
        ? highlighted
        : null;
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, triggerRef), [ref]);
    const nativeRef = useRef<HTMLSelectElement>(null);
    const baseId = useId();
    const listboxId = `${baseId}-listbox`;
    const optionId = (index: number) => `${baseId}-option-${index}`;

    const flags = options.map((option) => ({ disabled: option.disabled }));
    const move = (current: number, key: string) =>
      getNextIndex(flags, current, key, { orientation: 'vertical', loop: false });
    /** The chosen option, or the first (`"Home"`) or last (`"End"`) one that can be chosen. */
    const startAt = (edge: 'Home' | 'End') =>
      first && !first.disabled ? first.index : move(-1, edge);
    // Whether the last change of the highlight came from the keyboard or typeahead. Only those scroll
    // the list: a pointer over an option at the edge must not move what it is pointing at. Written
    // in the event that changes the highlight, read in the layout effect that follows it.
    const keyed = useRef(false);
    const highlight = (index: number | null, fromKeys: boolean) => {
      keyed.current = fromKeys;
      setHighlighted(index);
    };
    // An opening scrolls once the listbox is placed (`onPlaced`), not when it commits.
    const openAt = (index: number | null) => {
      highlight(index, false);
      request(true);
    };
    // Opened without a highlight (`defaultOpen`, a controlled `open`): the chosen option, or the first.
    useIsoLayoutEffect(() => {
      if (open && highlighted === null) highlight(startAt('Home'), false);
      if (!open) highlight(null, false);
      // Only an opening or a closing decides this; the highlight itself changes it after that.
    }, [open]);

    // A Select that becomes disabled while open closes, as a native one does.
    useEffect(() => {
      if (disabled && open) request(false);
    }, [disabled, open, request]);

    const choose = (option: Option | undefined) => {
      if (disabled || !option || option.disabled) return;
      if (!multiple) {
        setValue(option.value);
        request(false);
        return;
      }
      // Repeated values (a value array with a duplicate, two items with one value) count once, so
      // the emitted array never repeats a value and a click always toggles the clicked option.
      const next = [
        ...new Set(
          chosen.includes(option.value)
            ? chosen.filter((one) => one !== option.value)
            : [...chosen, option.value],
        ),
      ];
      // The values that match an item go in the order of the list, so the chips do not reorder as
      // options are toggled. One that matches no item (an item that loads later) stays where it was.
      const itemValues = new Set(options.map((one) => one.value));
      const inListOrder = [...itemValues].filter((one) => next.includes(one));
      let matched = 0;
      setValue(next.map((one) => (itemValues.has(one) ? inListOrder[matched++]! : one)));
    };

    // --- Typeahead: open, it moves the highlight; closed (choose one), it changes the value.
    // The state of the last commit. Written after it, not during a render that React may throw away.
    const latest = useRef({ open, highlighted: active, first });
    useWriteOnCommit(() => {
      latest.current = { open, highlighted: active, first };
    });
    const optionElements = useCallback(
      () => Array.from(contentRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []),
      [contentRef],
    );
    const currentOption = useCallback(() => {
      const { open: isOpen, highlighted: index, first: chosenFirst } = latest.current;
      const at = isOpen ? index : (chosenFirst?.index ?? null);
      return at === null
        ? null
        : (contentRef.current?.querySelector(`[data-index="${at}"]`) ?? null);
    }, [contentRef]);
    const chooseRef = useRef<(index: number) => void>(() => {});
    useWriteOnCommit(() => {
      chooseRef.current = (index) => choose(options[index]);
    });
    const onTypeaheadMatch = useCallback((el: HTMLElement) => {
      const index = Number(el.dataset.index);
      if (latest.current.open) highlight(index, true);
      else chooseRef.current(index);
    }, []);
    const typeahead = useTypeahead(optionElements, onTypeaheadMatch, currentOption);

    const press = useTriggerPress(open, (wasOpen) => {
      // Focus stays on the trigger while the listbox is open, and the keyboard works from there; Safari
      // does not focus a clicked button, so the click does.
      triggerRef.current?.focus({ preventScroll: true });
      if (wasOpen) request(false);
      else openAt(startAt('Home'));
    });

    // Set by Tab, which closes the listbox itself before focus moves on.
    const leaving = useRef(false);
    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      const { key } = event;
      leaving.current = false;
      if (!open) {
        // A Space inside a typed search is part of it, so typeahead goes first here too.
        if (!multiple && typeahead(event)) return;
        if (key === 'Enter' || key === ' ' || key === 'ArrowDown' || key === 'ArrowUp') {
          event.preventDefault();
          // A held key opens it once: the repeats are not presses of their own.
          if (event.repeat) return;
          openAt(startAt(key === 'ArrowUp' ? 'End' : 'Home'));
        } else if (key === 'Home' || key === 'End') {
          event.preventDefault();
          openAt(move(-1, key));
        }
        return;
      }
      // A Space inside a typed search is part of it, so typeahead goes before Enter and Space.
      if (typeahead(event)) return;
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
        event.preventDefault();
        const next = move(active ?? -1, key);
        if (next !== null) highlight(next, true);
      } else if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        if (event.repeat) return;
        choose(active === null ? undefined : options[active]);
      } else if (key === 'Tab') {
        // Focus moves on as usual. Choose one: Tab takes the highlighted option, like Enter.
        const option = active === null ? undefined : options[active];
        if (!multiple && option) setValue(option.value);
        leaving.current = true;
        request(false);
      }
    };
    // All of the listbox's keyboard is on the trigger, so focus that leaves it any other way (app
    // code, a screen reader moving on, another window) closes the listbox. A press in the listbox
    // keeps focus here (see its onMouseDown).
    const handleBlur = (event: FocusEvent<HTMLButtonElement>) => {
      const byTab = leaving.current;
      leaving.current = false;
      if (!open || byTab || contentRef.current?.contains(event.relatedTarget as Node | null)) {
        return;
      }
      request(false);
    };

    // --- The listbox: a native popover placed under the trigger, as wide as it at least.
    usePopover(contentRef, {
      open,
      onOpenChange: report,
      pendingToggle,
      restoreFocusTo: () => triggerRef.current,
    });
    const scrollToHighlighted = () => {
      const index = latest.current.highlighted;
      if (index === null) return;
      contentRef.current
        ?.querySelector<HTMLElement>(`[data-index="${index}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    };
    useFloating({
      open,
      reference: () => triggerRef.current,
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

    // --- The hidden native <select>: kept in step with the value for forms. Synced again when the
    // value or the options change, and on `resync`: after a form reset or an autofill, which change
    // the native <select> behind React's back (and a controlled parent may refuse the autofill).
    const [synced, resync] = useState(0);
    const chosenKey = chosen.join('\u0000');
    useIsoLayoutEffect(() => {
      const native = nativeRef.current;
      if (!native) return;
      for (const option of Array.from(native.options)) {
        option.selected = option.value === '' ? chosen.length === 0 : chosen.includes(option.value);
      }
      // `chosen` is a new array on every render; `chosenKey` stands for it.
    }, [chosenKey, options, synced]);
    const defaultRef = useRef(defaultValue);
    useWriteOnCommit(() => {
      defaultRef.current = defaultValue;
    });
    // The browser resets the native <select> after the form's reset event: put an uncontrolled Select
    // back to its default, and the native one back in step with a controlled value.
    useFormReset(nativeRef, () => {
      resetValue(defaultRef.current);
      resync((count) => count + 1);
    });
    const handleNativeChange = (event: ChangeEvent<HTMLSelectElement>) => {
      // Autofill, or anything else that changes the native <select> directly.
      if (multiple) {
        setValue(Array.from(event.target.selectedOptions, (option) => option.value));
      } else if (event.target.value !== '') {
        setValue(event.target.value);
      }
      resync((count) => count + 1);
    };

    // --- Names: the listbox has the trigger's name.
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
        const selected = chosen.includes(option.value);
        return (
          // The options take no focus: the trigger keeps it and points at the highlighted option with
          // aria-activedescendant (APG select-only combobox), and its keyboard handles them.
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
          <div
            key={`${option.index}-${option.value}`}
            id={optionId(option.index)}
            role="option"
            aria-selected={selected}
            aria-disabled={option.disabled || undefined}
            data-highlighted={dataAttr(open && active === option.index)}
            data-index={option.index}
            data-text-value={option.text}
            className="flg-menu-item flg-select-option"
            onPointerMove={(event) => {
              if (event.pointerType !== 'touch' && !option.disabled) highlight(option.index, false);
            }}
            onClick={() => choose(option)}
          >
            <span className="flg-menu-item-icon" aria-hidden="true">
              {multiple ? (
                <span className="flg-select-box">{BOX_CHECK}</span>
              ) : selected ? (
                CHECK
              ) : null}
            </span>
            {option.children}
          </div>
        );
      });

    const nativeDefault = multiple ? chosen : (chosen[0] ?? '');
    return (
      <div
        className={clsx('flg-select', className)}
        style={style}
        data-size={size}
        data-invalid={dataAttr(invalid)}
        data-disabled={dataAttr(disabled)}
        data-multiple={dataAttr(multiple)}
      >
        <button
          ref={mergedRef}
          type="button"
          role="combobox"
          id={fieldProps.id}
          className="flg-input flg-select-trigger"
          data-size={size}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={open && active !== null ? optionId(active) : undefined}
          aria-label={label}
          aria-labelledby={labelledBy}
          aria-describedby={fieldProps['aria-describedby']}
          aria-invalid={fieldProps['aria-invalid']}
          aria-required={required || undefined}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPointerDown={press.onPointerDown}
          onPointerCancel={press.onPointerCancel}
          onClick={press.onClick}
        >
          {chosenOptions.length === 0 ? (
            <span className="flg-select-value flg-select-placeholder">{placeholder}</span>
          ) : multiple ? (
            <>
              <Chips chosen={chosenOptions} />
              <span className="flg-visually-hidden">
                {chosenOptions.map((option) => option.text).join(', ')}
              </span>
            </>
          ) : (
            <span className="flg-select-value">{first?.children}</span>
          )}
          {CHEVRON}
        </button>
        <select
          ref={nativeRef}
          className="flg-select-native"
          aria-hidden="true"
          tabIndex={-1}
          name={name}
          multiple={multiple}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          defaultValue={nativeDefault}
          onChange={handleNativeChange}
          // The browser focuses an invalid native control to show its message: the trigger stands
          // for it.
          onFocus={() => triggerRef.current?.focus()}
        >
          {multiple ? null : <option value="" />}
          {options.map((option) => (
            <option
              key={`${option.index}-${option.value}`}
              value={option.value}
              // The browser leaves a disabled option out of FormData. A chosen one (an item retired
              // after it was chosen) is shown on the trigger, so it is submitted too; the listbox
              // already keeps anyone from choosing it.
              disabled={option.disabled && !chosen.includes(option.value)}
            >
              {option.text}
            </option>
          ))}
        </select>
        {/* No focus here either: the trigger keeps it (see the options). */}
        {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
        <div
          ref={contentRef}
          popover="auto"
          role="listbox"
          id={listboxId}
          className="flg-surface flg-menu flg-select-listbox"
          aria-multiselectable={multiple || undefined}
          aria-label={label}
          aria-labelledby={labelledBy}
          // Focus stays on the trigger: a press in the listbox must not take it.
          onMouseDown={(event) => event.preventDefault()}
        >
          {renderRows(rows)}
        </div>
      </div>
    );
  }),
);

/** One option of a Select. Read by the Select, never rendered on its own. */
export const SelectItem = markPart(function SelectItem(props: SelectItemProps): null {
  void props;
  devWarn(OUTSIDE('SelectItem'));
  return null;
}, 'select-item');

/** Options under a label. Read by the Select, never rendered on its own. */
export const SelectGroup = markPart(function SelectGroup(props: SelectGroupProps): null {
  void props;
  devWarn(OUTSIDE('SelectGroup'));
  return null;
}, 'select-group');

/** A line between options. Read by the Select, never rendered on its own. */
export const SelectSeparator = markPart(function SelectSeparator(
  props: SelectSeparatorProps,
): null {
  void props;
  devWarn(OUTSIDE('SelectSeparator'));
  return null;
}, 'select-separator');
