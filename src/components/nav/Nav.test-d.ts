import type { ReactNode, Ref } from 'react';
import { expectTypeOf, test } from 'vitest';
import type {
  NavGroupProps,
  NavItemProps,
  NavLabels,
  NavProps,
  NavSectionProps,
  NavVariant,
} from './Nav';
import { Nav, NavGroup, NavItem, NavSection } from './Nav';

test('a Nav takes only the two looks of the mockup', () => {
  expectTypeOf<NavVariant>().toEqualTypeOf<'pill' | 'bar'>();
  expectTypeOf<NavProps['variant']>().toEqualTypeOf<NavVariant | undefined>();
  // @ts-expect-error a look that was not chosen
  const gradient: NavProps = { variant: 'gradient' };
  // @ts-expect-error the look of another component
  const inset: NavProps = { variant: 'inset' };
  expectTypeOf(gradient).toBeObject();
  expectTypeOf(inset).toBeObject();
});

test('the words of a Nav may be given in part', () => {
  expectTypeOf<NonNullable<NavProps['labels']>>().toEqualTypeOf<Partial<NavLabels>>();
  expectTypeOf<keyof NavLabels>().toEqualTypeOf<'nav'>();
});

test('a NavGroup needs a label, and takes its open state as the other components do', () => {
  expectTypeOf<NavGroupProps['label']>().toEqualTypeOf<ReactNode>();
  // @ts-expect-error a group without a name has no button to read
  const missing: NavGroupProps = { children: null };
  expectTypeOf(missing).toBeObject();
  expectTypeOf<NavGroupProps['open']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<NavGroupProps['defaultOpen']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<NonNullable<NavGroupProps['onOpenChange']>>().parameters.toEqualTypeOf<[boolean]>();
});

test('a NavItem is an anchor with an icon, a badge and the state of the page', () => {
  expectTypeOf<NavItemProps['href']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<NavItemProps['active']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<NavItemProps['disabled']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<NavItemProps['asChild']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<NavItemProps['badge']>().toEqualTypeOf<ReactNode>();
  // @ts-expect-error a link without a label has no name
  const missing: NavItemProps = { href: '/' };
  expectTypeOf(missing).toBeObject();
});

test('the title of a section is any content, and a group or a section has no HTML title', () => {
  expectTypeOf<NavSectionProps['title']>().toEqualTypeOf<ReactNode>();
  expectTypeOf<NavSectionProps['bottom']>().toEqualTypeOf<boolean | undefined>();
});

test('each part forwards its ref to the element that carries its meaning', () => {
  expectTypeOf<Parameters<typeof Nav>[0]['ref']>().toEqualTypeOf<Ref<HTMLElement> | undefined>();
  expectTypeOf<Parameters<typeof NavSection>[0]['ref']>().toEqualTypeOf<
    Ref<HTMLDivElement> | undefined
  >();
  expectTypeOf<Parameters<typeof NavItem>[0]['ref']>().toEqualTypeOf<
    Ref<HTMLAnchorElement> | undefined
  >();
  expectTypeOf<Parameters<typeof NavGroup>[0]['ref']>().toEqualTypeOf<
    Ref<HTMLLIElement> | undefined
  >();
});
