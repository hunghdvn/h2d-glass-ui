import { expectTypeOf, test } from 'vitest';
import type { ReactNode } from 'react';
import type { KbdLabels, KbdProps } from './Kbd';

test('Kbd takes keys, children, or both, as a plain object type', () => {
  expectTypeOf<KbdProps['keys']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<KbdProps['labels']>().toEqualTypeOf<Partial<KbdLabels> | undefined>();
  expectTypeOf<KbdProps['children']>().toEqualTypeOf<ReactNode>();
  const withKeys: KbdProps = { keys: 'mod+k' };
  const withChildren: KbdProps = { children: 'Esc' };
  // Both together compile: at run time `keys` wins, and development warns (Kbd.test.tsx).
  const both: KbdProps = { keys: 'mod+k', children: 'Esc' };
  expectTypeOf(withKeys).toBeObject();
  expectTypeOf(withChildren).toBeObject();
  expectTypeOf(both).toBeObject();
});

test('an optional string can be passed on as keys, and an interface can extend the props', () => {
  interface Command {
    label: string;
    shortcut?: string;
  }
  const command: Command = { label: 'Search' };
  const props: KbdProps = { keys: command.shortcut };
  interface ShortcutProps extends KbdProps {
    command: Command;
  }
  const extended: ShortcutProps = { command, keys: 'mod+k' };
  expectTypeOf(props).toBeObject();
  expectTypeOf(extended).toMatchTypeOf<KbdProps>();
});

test('keys is a string and labels is a partial of the names of the symbols', () => {
  const labels: KbdProps = { keys: 'mod+k', labels: { command: 'Befehl', separator: ' plus ' } };
  // @ts-expect-error the key of a label must exist
  const unknown: KbdProps = { keys: 'mod+k', labels: { meta: 'Befehl' } };
  // @ts-expect-error keys is a string
  const notAString: KbdProps = { keys: ['mod', 'k'] };
  expectTypeOf(labels).toBeObject();
  expectTypeOf(unknown).toBeObject();
  expectTypeOf(notAString).toBeObject();
  expectTypeOf<KbdLabels['command']>().toBeString();
  expectTypeOf<KbdLabels['separator']>().toBeString();
});

test('the other props are those of an HTML element', () => {
  const props: KbdProps = { keys: 'mod+k', className: 'mine', title: 'Search', onClick: () => {} };
  expectTypeOf(props).toBeObject();
});
