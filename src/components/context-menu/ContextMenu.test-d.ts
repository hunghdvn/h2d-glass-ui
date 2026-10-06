import { expectTypeOf, test } from 'vitest';
import type { ContextMenuContentProps, ContextMenuProps } from './ContextMenu';

test('ContextMenu opens only where the user asks: it has no open or defaultOpen', () => {
  expectTypeOf<ContextMenuProps>().not.toHaveProperty('open');
  expectTypeOf<ContextMenuProps>().not.toHaveProperty('defaultOpen');
  expectTypeOf<ContextMenuProps['onOpenChange']>().toEqualTypeOf<
    ((open: boolean) => void) | undefined
  >();
});

test('ContextMenuContent opens at a point: no side or align', () => {
  expectTypeOf<ContextMenuContentProps>().not.toHaveProperty('side');
  expectTypeOf<ContextMenuContentProps>().not.toHaveProperty('align');
  expectTypeOf<ContextMenuContentProps['sideOffset']>().toEqualTypeOf<number | undefined>();
});
