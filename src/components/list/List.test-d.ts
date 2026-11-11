import { createRef } from 'react';
import type { MouseEvent, ReactElement, ReactNode } from 'react';
import { expectTypeOf, test } from 'vitest';
import type { ListItemLinkProps, ListItemProps, ListProps } from './List';
import { List, ListItem } from './List';

test('a List takes only the documented variants and sizes', () => {
  expectTypeOf<ListProps['variant']>().toEqualTypeOf<'inset' | 'cards' | 'plain' | undefined>();
  expectTypeOf<ListProps['size']>().toEqualTypeOf<'sm' | 'md' | undefined>();
  // @ts-expect-error an unknown variant
  const unknownVariant: ListProps = { variant: 'grouped' };
  // @ts-expect-error the variant of another component
  const otherVariant: ListProps = { variant: 'lined' };
  // @ts-expect-error an unknown size
  const unknownSize: ListProps = { size: 'lg' };
  expectTypeOf(unknownVariant).toBeObject();
  expectTypeOf(otherVariant).toBeObject();
  expectTypeOf(unknownSize).toBeObject();
});

test('the ref of a List is the <ul> and the ref of a ListItem is the <li>', () => {
  expectTypeOf(List).toBeCallableWith({ ref: createRef<HTMLUListElement>() });
  expectTypeOf(ListItem).toBeCallableWith({ ref: createRef<HTMLLIElement>() });
  // @ts-expect-error a List is a <ul>, not a <div>
  expectTypeOf(List).toBeCallableWith({ ref: createRef<HTMLDivElement>() });
});

test('title is a node, not the string attribute of an <li>', () => {
  expectTypeOf<ListItemProps['title']>().toEqualTypeOf<ReactNode>();
  expectTypeOf<ListItemProps>().not.toHaveProperty('value');
});

test('onSelect reports the click on the button of the title', () => {
  expectTypeOf<NonNullable<ListItemProps['onSelect']>>().parameters.toEqualTypeOf<
    [MouseEvent<HTMLButtonElement>]
  >();
});

test('renderLink gets the props of the <a>, with href, className and children given', () => {
  expectTypeOf<ListItemLinkProps['href']>().toEqualTypeOf<string>();
  expectTypeOf<ListItemLinkProps['className']>().toEqualTypeOf<string>();
  expectTypeOf<ListItemLinkProps['children']>().toEqualTypeOf<ReactNode>();
  expectTypeOf<NonNullable<ListItemProps['renderLink']>>().toEqualTypeOf<
    (props: ListItemLinkProps) => ReactElement
  >();
});

test('surface is a boolean', () => {
  expectTypeOf<ListProps['surface']>().toEqualTypeOf<boolean | undefined>();
  // @ts-expect-error a string is not a boolean
  const text: ListProps = { surface: 'false' };
  expectTypeOf(text).toBeObject();
});
