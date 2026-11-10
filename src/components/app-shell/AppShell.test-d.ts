import { expectTypeOf, test } from 'vitest';
import type { ReactNode } from 'react';
import type {
  AppShellBrandProps,
  AppShellFooterProps,
  AppShellHeaderProps,
  AppShellLabels,
  AppShellMainProps,
  AppShellProps,
  AppShellSidebarProps,
  AppShellSidebarTriggerProps,
} from '../../index';

test('an AppShell takes only the documented layouts and breakpoints', () => {
  expectTypeOf<AppShellProps['layout']>().toEqualTypeOf<'sidebar' | 'header' | undefined>();
  expectTypeOf<AppShellProps['breakpoint']>().toEqualTypeOf<'md' | 'lg' | 'xl' | undefined>();
  // @ts-expect-error an unknown layout
  const unknownLayout: AppShellProps = { layout: 'floating' };
  // @ts-expect-error the layout of a design that was not built
  const notBuilt: AppShellProps = { layout: 'panes' };
  // @ts-expect-error an unknown breakpoint
  const unknownBreakpoint: AppShellProps = { breakpoint: 'sm' };
  // @ts-expect-error a width is not a breakpoint
  const width: AppShellProps = { breakpoint: 1024 };
  expectTypeOf(unknownLayout).toBeObject();
  expectTypeOf(notBuilt).toBeObject();
  expectTypeOf(unknownBreakpoint).toBeObject();
  expectTypeOf(width).toBeObject();
});

test('the brand is any node, and the words may be given in part', () => {
  expectTypeOf<AppShellProps['brand']>().toEqualTypeOf<ReactNode>();
  expectTypeOf<NonNullable<AppShellProps['labels']>>().toEqualTypeOf<Partial<AppShellLabels>>();
  expectTypeOf<keyof AppShellLabels>().toEqualTypeOf<
    | 'skipToContent'
    | 'navigation'
    | 'openNavigation'
    | 'closeNavigation'
    | 'collapseSidebar'
    | 'expandSidebar'
  >();
});

test('the main and the sidebar take no id, which the library sets for the skip link', () => {
  // @ts-expect-error the id is the library's
  const main: AppShellMainProps = { id: 'main' };
  // @ts-expect-error the id is the library's
  const sidebar: AppShellSidebarProps = { id: 'side' };
  expectTypeOf(main).toBeObject();
  expectTypeOf(sidebar).toBeObject();
  // The header and the footer are not pointed at, so they keep theirs.
  expectTypeOf<AppShellHeaderProps['id']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<AppShellFooterProps['id']>().toEqualTypeOf<string | undefined>();
});

test('a brand needs a name, and takes a child only with asChild', () => {
  expectTypeOf<AppShellBrandProps['name']>().toEqualTypeOf<ReactNode>();
  // @ts-expect-error the name is the text of the link
  const nameless: AppShellBrandProps = { logo: 'L' };
  // @ts-expect-error a child without asChild would be dropped
  const lostChild: AppShellBrandProps = { name: 'Lumen', children: 'x' };
  // @ts-expect-error asChild needs the element
  const noChild: AppShellBrandProps = { name: 'Lumen', asChild: true };
  // @ts-expect-error the element brings its own href
  const both: AppShellBrandProps = { name: 'Lumen', asChild: true, href: '/', children: 'x' };
  const ok: AppShellBrandProps[] = [
    { name: 'Lumen' },
    { name: 'Lumen', logo: 'L', href: '/' },
    { name: 'Lumen', asChild: true, children: 'x' },
  ];
  expectTypeOf(nameless).toBeObject();
  expectTypeOf(lostChild).toBeObject();
  expectTypeOf(noChild).toBeObject();
  expectTypeOf(both).toBeObject();
  expectTypeOf(ok).toBeArray();
});

test('the trigger takes its name from the shell, and the header may leave it out', () => {
  expectTypeOf<AppShellHeaderProps['sidebarTrigger']>().toEqualTypeOf<boolean | undefined>();
  // @ts-expect-error the name changes with the mode: it is `labels` of the AppShell
  const named: AppShellSidebarTriggerProps = { 'aria-label': 'Menu' };
  // @ts-expect-error the icon is the library's
  const withChild: AppShellSidebarTriggerProps = { children: 'x' };
  expectTypeOf(named).toBeObject();
  expectTypeOf(withChild).toBeObject();
  expectTypeOf<AppShellSidebarTriggerProps['onClick']>().not.toBeNever();
});

test('the shell takes its two states as controlled or uncontrolled', () => {
  expectTypeOf<AppShellProps['collapsed']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<AppShellProps['open']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<AppShellProps['onCollapsedChange']>().toEqualTypeOf<
    ((collapsed: boolean) => void) | undefined
  >();
  expectTypeOf<AppShellProps['onOpenChange']>().toEqualTypeOf<
    ((open: boolean) => void) | undefined
  >();
});
