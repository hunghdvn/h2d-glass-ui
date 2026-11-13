import { expectTypeOf, test } from 'vitest';
import type { KbdLabels, KbdProps } from './Kbd';

test('Kbd takes keys or children, not both, and not neither', () => {
  const withKeys: KbdProps = { keys: 'mod+k' };
  const withChildren: KbdProps = { children: 'Esc' };
  // @ts-expect-error keys and children together
  const both: KbdProps = { keys: 'mod+k', children: 'Esc' };
  // @ts-expect-error neither
  const neither: KbdProps = {};
  // @ts-expect-error labels belong to keys
  const labelsAlone: KbdProps = { children: 'Esc', labels: { command: 'Befehl' } };
  expectTypeOf(withKeys).toBeObject();
  expectTypeOf(withChildren).toBeObject();
  expectTypeOf(both).toBeObject();
  expectTypeOf(neither).toBeObject();
  expectTypeOf(labelsAlone).toBeObject();
});

test('keys is a string and labels is a partial of the names of the symbols', () => {
  const labels: KbdProps = { keys: 'mod+k', labels: { command: 'Befehl', separator: ' plus ' } };
  // @ts-expect-error the key of a label must exist
  const unknown: KbdProps = { keys: 'mod+k', labels: { meta: 'Befehl' } };
  expectTypeOf(labels).toBeObject();
  expectTypeOf(unknown).toBeObject();
  expectTypeOf<KbdLabels['command']>().toBeString();
  expectTypeOf<KbdLabels['separator']>().toBeString();
});

test('the other props are those of an HTML element', () => {
  const props: KbdProps = { keys: 'mod+k', className: 'mine', title: 'Search', onClick: () => {} };
  expectTypeOf(props).toBeObject();
});
