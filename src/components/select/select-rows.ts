import { Children, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { collectChildren } from '../../internal/collect-children';
import type { CollectedPart } from '../../internal/collect-children';
import { devWarn } from '../../internal/warn';
import type { SelectItemProps } from './Select';

const PARTS = ['select-item', 'select-group', 'select-separator'] as const;

const UNKNOWN_CHILD =
  '<Select> reads only SelectItem, SelectGroup and SelectSeparator, directly or inside Fragments, ' +
  'arrays and SelectGroup. It skips anything else, including a component of your own that wraps ' +
  'a SelectItem.';
const EMPTY_VALUE =
  '<SelectItem> needs a value that is not empty: the empty value is how the native select says ' +
  'nothing is chosen. The item is skipped.';
const NOT_A_STRING = '<SelectItem> needs a value that is a string. The item is skipped.';

/** One option of the Select, in the order the listbox shows it. */
export interface Option {
  index: number;
  value: string;
  disabled: boolean;
  /** For typeahead, the native `<option>` and a chip. */
  text: string;
  children: ReactNode;
}

export type Row =
  | { kind: 'option'; option: Option }
  | { kind: 'group'; key: string; label: ReactNode; rows: Row[] }
  | { kind: 'separator'; key: string };

/** The text inside `node`, as a screen reader would read it. */
export function textOf(node: ReactNode): string {
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
        devWarn(typeof props.value === 'string' ? EMPTY_VALUE : NOT_A_STRING);
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

/**
 * The Select's rows (options, groups, separators) and its options in list order, read from
 * `children` without rendering them. Rows are keyed by position, never by the caller's keys.
 */
export function readRows(children: ReactNode): { rows: Row[]; options: Option[] } {
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
  return { rows, options };
}
