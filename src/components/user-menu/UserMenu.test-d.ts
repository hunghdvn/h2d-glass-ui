import { expectTypeOf, test } from 'vitest';
import type { UserMenuLabels, UserMenuProps } from './UserMenu';

test('UserMenu needs a name and the items of the menu', () => {
  expectTypeOf<UserMenuProps['name']>().toEqualTypeOf<string>();
  // @ts-expect-error a UserMenu is told who the user is
  const noName: UserMenuProps = { children: null };
  // @ts-expect-error and has the items of its menu
  const noChildren: UserMenuProps = { name: 'Ada Lovelace' };
  expectTypeOf(noName).toBeObject();
  expectTypeOf(noChildren).toBeObject();
});

test('the name of the button is made by labels.trigger, never passed in', () => {
  expectTypeOf<UserMenuLabels['trigger']>().toEqualTypeOf<(name: string) => string>();
  expectTypeOf<UserMenuProps['labels']>().toEqualTypeOf<Partial<UserMenuLabels> | undefined>();
  // @ts-expect-error the name of the button comes from labels.trigger
  const label: UserMenuProps = { name: 'Ada', children: null, 'aria-label': 'Account' };
  // @ts-expect-error nor from another element
  const labelledby: UserMenuProps = { name: 'Ada', children: null, 'aria-labelledby': 'x' };
  expectTypeOf(label).toBeObject();
  expectTypeOf(labelledby).toBeObject();
});

test("the button is not a slot, and its id is the menu's", () => {
  // @ts-expect-error the content of the button is the avatar and the name
  const asChild: UserMenuProps = { name: 'Ada', children: null, asChild: true };
  // @ts-expect-error the menu is named by the button, whose id it owns
  const id: UserMenuProps = { name: 'Ada', children: null, id: 'mine' };
  expectTypeOf(asChild).toBeObject();
  expectTypeOf(id).toBeObject();
});

test('the avatar is told everything but its size', () => {
  expectTypeOf<NonNullable<UserMenuProps['avatar']>>().not.toHaveProperty('size');
  expectTypeOf<UserMenuProps['showName']>().toEqualTypeOf<boolean | undefined>();
});
