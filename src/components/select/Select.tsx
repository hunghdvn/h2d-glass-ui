'use client';

import { clsx } from 'clsx';
import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  ChangeEvent,
  CSSProperties,
  FocusEvent,
  KeyboardEvent,
  ReactElement,
  ReactNode,
} from 'react';
import { collectChildren, markPart } from '../../internal/collect-children';
import type { CollectedPart } from '../../internal/collect-children';
import { dataAttr } from '../../internal/data-attr';
import { markAsFieldControl, useFieldContext, useFieldProps } from '../../internal/field-context';
import { mergeRefs } from '../../internal/merge-refs';
import { getNextIndex } from '../../internal/roving';
import { useControllableState } from '../../internal/use-controllable-state';
import { useFloating } from '../../internal/use-floating';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { usePopover } from '../../internal/use-popover';
import { usePopoverState, useTriggerPress } from '../../internal/use-popover-trigger';
import { useTypeahead } from '../../internal/use-typeahead';
import { devWarn } from '../../internal/warn';
import { Badge } from '../badge/Badge';

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

const PARTS = ['select-item', 'select-group', 'select-separator'] as const;

const UNKNOWN_CHILD =
  '<Select> reads only SelectItem, SelectGroup and SelectSeparator, directly or inside Fragments, ' +
  'arrays and SelectGroup. It skips anything else, including a component of your own that wraps ' +
  'a SelectItem.';
const EMPTY_VALUE =
  '<SelectItem> needs a value that is not empty: the empty value is how the native select says ' +
  'nothing is chosen. The item is skipped.';
const OUTSIDE = (part: string) => `<${part}> must be rendered inside a <Select>.`;

/** One option of the Select, in the order the listbox shows it. */
interface Option {
  index: number;
  value: string;
  disabled: boolean;
  /** For typeahead, the native `<option>` and a chip. */
  text: string;
  children: ReactNode;
}

type Row =
  | { kind: 'option'; option: Option }
  | { kind: 'group'; key: string; label: ReactNode; rows: Row[] }
  | { kind: 'separator'; key: string };

/** The text inside `node`, as a screen reader would read it. */
function textOf(node: ReactNode): string {
  let text = '';
  Children.forEach(node, (child) => {
    if (typeof child === 'string' || typeof child === 'number') text += String(child);
    else if (isValidElement<{ children?: ReactNode }>(child)) text += textOf(child.props.children);
  });
  return text.replace(/\s+/g, ' ').trim();
}

function toRows(parts: CollectedPart[], options: Option[], path: string): Row[] {
  const rows: Row[] = [];
  parts.forEach((part, position) => {
    const key = `${path}${position}`;
    if (part.part === 'select-group') {
      rows.push({
        kind: 'group',
        key,
        label: part.props.label as ReactNode,
        rows: toRows(part.parts ?? [], options, `${key}.`),
      });
    } else if (part.part === 'select-separator') {
      rows.push({ kind: 'separator', key });
    } else {
      const props = part.props as unknown as SelectItemProps;
      if (typeof props.value !== 'string' || props.value === '') {
        devWarn(EMPTY_VALUE);
        return;
      }
      const option: Option = {
        index: options.length,
        value: props.value,
        disabled: props.disabled === true,
        text: props.textValue ?? textOf(props.children),
        children: props.children,
      };
      options.push(option);
      rows.push({ kind: 'option', option });
    }
  });
  return rows;
}

const CHEVRON = (
  <svg
    className="flg-select-chevron"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const CHECK = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const BOX_CHECK = (
  <svg
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M2.5 6.2 5 8.5l4.5-5" />
  </svg>
);

/** Gap between chips, in px; matches `.flg-select-chips`. */
const CHIP_GAP = 4;

/**
 * The chosen values of a multiple Select as chips, as many as fit, and the rest as one "+N" chip.
 * A hidden ruler holds every chip, so what fits is measured without rendering twice.
 */
function Chips({ chosen }: { chosen: Option[] }) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const rulerRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(chosen.length);
  const key = chosen.map((option) => option.value).join('\u0000');
  useIsoLayoutEffect(() => {
    const box = boxRef.current;
    const ruler = rulerRef.current;
    if (!box || !ruler) return;
    const measure = () => {
      const widths = Array.from(ruler.children, (chip) => chip.getBoundingClientRect().width);
      const plus = widths.pop() ?? 0;
      const room = box.clientWidth;
      let used = 0;
      let count = 0;
      for (const [index, width] of widths.entries()) {
        const next = used + (index > 0 ? CHIP_GAP : 0) + width;
        const rest = widths.length - index - 1;
        if (next + (rest > 0 ? CHIP_GAP + plus : 0) > room) break;
        used = next;
        count = index + 1;
      }
      setVisible(count);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    // The room changes with the trigger; the chips' widths change when a web font arrives.
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(ruler);
    return () => observer.disconnect();
  }, [key]);
  const hidden = chosen.length - visible;
  return (
    <span ref={boxRef} className="flg-select-chips" aria-hidden="true">
      {chosen.slice(0, visible).map((option) => (
        <Badge key={option.value} variant="neutral">
          {option.text}
        </Badge>
      ))}
      {hidden > 0 ? <Badge variant="accent">+{hidden}</Badge> : null}
      <span ref={rulerRef} className="flg-select-ruler">
        {chosen.map((option) => (
          <Badge key={option.value} variant="neutral">
            {option.text}
          </Badge>
        ))}
        <Badge variant="accent">+{chosen.length}</Badge>
      </span>
    </span>
  );
}

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

    // --- Items, read from children without rendering them.
    const options: Option[] = [];
    const rows = toRows(
      collectChildren(children, {
        parts: PARTS,
        groups: ['select-group'],
        onUnknown: () => devWarn(UNKNOWN_CHILD),
      }),
      options,
      '',
    );

    // --- Value.
    const defaultValue = multiple
      ? ((props as SelectMultipleProps).defaultValue ?? [])
      : ((props as SelectSingleProps).defaultValue ?? null);
    const [value, setValue, resetValue] = useControllableState<string | null | string[]>({
      value: props.value,
      defaultValue,
      onChange: props.onValueChange as ((value: string | null | string[]) => void) | undefined,
      name: 'Select',
    });
    const chosen: string[] = Array.isArray(value)
      ? value
      : value === null || value === ''
        ? []
        : [value];
    for (const one of chosen) {
      if (!options.some((option) => option.value === one)) {
        devWarn(`<Select> has a value that matches no SelectItem: "${one}".`);
      }
    }
    const chosenOptions = options.filter((option) => chosen.includes(option.value));
    const first = chosenOptions[0];

    // --- Open state and the highlighted option.
    const { open, request, report, contentRef, pendingToggle } = usePopoverState<HTMLDivElement>({
      open: props.open,
      defaultOpen: props.defaultOpen ?? false,
      onOpenChange: props.onOpenChange,
      name: 'Select',
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
    const openAt = (index: number | null) => {
      setHighlighted(index);
      request(true);
    };
    // Opened without a highlight (`defaultOpen`, a controlled `open`): the chosen option, or the first.
    useIsoLayoutEffect(() => {
      if (open && highlighted === null) setHighlighted(startAt('Home'));
      if (!open) setHighlighted(null);
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
      const next = chosen.includes(option.value)
        ? chosen.filter((one) => one !== option.value)
        : [...chosen, option.value];
      // In the order of the list, so the chips do not reorder as options are toggled.
      setValue(options.filter((one) => next.includes(one.value)).map((one) => one.value));
    };

    // --- Typeahead: open, it moves the highlight; closed (choose one), it changes the value.
    const latest = useRef({ open, highlighted: active, first });
    latest.current = { open, highlighted: active, first };
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
    chooseRef.current = (index) => choose(options[index]);
    const onTypeaheadMatch = useCallback((el: HTMLElement) => {
      const index = Number(el.dataset.index);
      if (latest.current.open) setHighlighted(index);
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
        if (next !== null) setHighlighted(next);
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
      maxHeight: 320,
      matchWidth: true,
      onPlaced: scrollToHighlighted,
    });
    useIsoLayoutEffect(() => {
      if (open) scrollToHighlighted();
    }, [open, highlighted]);

    // --- The hidden native <select>: kept in step with the value for forms.
    useIsoLayoutEffect(() => {
      const native = nativeRef.current;
      if (!native) return;
      for (const option of Array.from(native.options)) {
        option.selected = option.value === '' ? chosen.length === 0 : chosen.includes(option.value);
      }
    });
    const [, resync] = useState(0);
    const defaultRef = useRef(defaultValue);
    defaultRef.current = defaultValue;
    useEffect(() => {
      const form = nativeRef.current?.form;
      if (!form) return;
      // The browser resets the native <select> after this event: put an uncontrolled Select back to
      // its default, and the native one back in step with a controlled value, a task later. This
      // listener runs before React's `onReset`, so whether the reset was cancelled is only known
      // then.
      const onReset = (event: Event) => {
        setTimeout(() => {
          if (event.defaultPrevented) return;
          resetValue(defaultRef.current);
          resync((count) => count + 1);
        }, 0);
      };
      form.addEventListener('reset', onReset);
      return () => form.removeEventListener('reset', onReset);
    }, [resetValue]);
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
              if (event.pointerType !== 'touch' && !option.disabled) setHighlighted(option.index);
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
