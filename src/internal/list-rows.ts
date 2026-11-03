import { Children, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { collectChildren } from './collect-children';
import type { CollectedPart } from './collect-children';
import { devWarn } from './warn';

const unknownChild = (owner: string) =>
  `<${owner}> reads only ${owner}Item, ${owner}Group and ${owner}Separator, directly or inside ` +
  `Fragments, arrays and ${owner}Group. It skips anything else, including a component of your ` +
  `own that wraps a ${owner}Item.`;
const emptyValue = (owner: string) =>
  `<${owner}Item> needs a value that is not empty: the empty value is how the native select says ` +
  'nothing is chosen. The item is skipped.';
const notAString = (owner: string) =>
  `<${owner}Item> needs a value that is a string. The item is skipped.`;

/** The props `readRows` reads from an item part, such as `SelectItem`. */
export interface ListItemProps {
  value: string;
  textValue?: string;
  disabled?: boolean;
  children?: ReactNode;
}

/**
 * Which parts a listbox reads: the part names given to `markPart` for its item, group and
 * separator, and the component name the dev warnings use.
 */
export interface ListParts {
  item: string;
  group: string;
  separator: string;
  owner: string;
}

/** One option of a listbox, in the order the listbox shows it. */
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

function toRows(
  parts: ListParts,
  collected: CollectedPart[],
  options: Option[],
  path: string,
): Row[] {
  const rows: Row[] = [];
  collected.forEach((part, position) => {
    const key = `${path}${position}`;
    if (part.part === parts.group) {
      rows.push({
        kind: 'group',
        key,
        label: part.props.label as ReactNode,
        rows: toRows(parts, part.parts ?? [], options, `${key}.`),
      });
    } else if (part.part === parts.separator) {
      rows.push({ kind: 'separator', key });
    } else {
      const props = part.props as unknown as ListItemProps;
      if (typeof props.value !== 'string' || props.value === '') {
        devWarn(
          typeof props.value === 'string' ? emptyValue(parts.owner) : notAString(parts.owner),
        );
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
 * The rows (options, groups, separators) and the options in list order, read from `children`
 * without rendering them. Rows are keyed by position, never by the caller's keys. `item`, `group`
 * and `separator` are the part names given to `markPart`; `owner` is the component name used in
 * the dev warnings.
 */
export function readRows(
  children: ReactNode,
  parts: ListParts,
): { rows: Row[]; options: Option[] } {
  const options: Option[] = [];
  const rows = toRows(
    parts,
    collectChildren(children, {
      parts: [parts.item, parts.group, parts.separator],
      groups: [parts.group],
      onUnknown: () => devWarn(unknownChild(parts.owner)),
    }),
    options,
    '',
  );
  return { rows, options };
}
