import { createRef } from 'react';
import type { ComponentProps } from 'react';
import { expectTypeOf, test } from 'vitest';
import type { TableCaptionProps, TableProps } from './Table';
import { Table, TableCaption } from './Table';
import type {
  TableAlign,
  TableCellProps,
  TableHeadProps,
  TableRowProps,
  TableSort,
} from './table-parts';
import { TableCell, TableHead, TableRow } from './table-parts';

test('a Table takes only the documented variants and sizes', () => {
  expectTypeOf<TableProps['variant']>().toEqualTypeOf<
    'lined' | 'striped' | 'minimal' | undefined
  >();
  expectTypeOf<TableProps['size']>().toEqualTypeOf<'sm' | 'md' | undefined>();
  // @ts-expect-error an unknown variant
  const unknownVariant: TableProps = { variant: 'grid' };
  // @ts-expect-error the variant of another component
  const otherVariant: TableProps = { variant: 'inset' };
  expectTypeOf(unknownVariant).toBeObject();
  expectTypeOf(otherVariant).toBeObject();
});

test('a Table takes a ref to its <table>, and the HTML attributes of one', () => {
  expectTypeOf(createRef<HTMLTableElement>()).toExtend<ComponentProps<typeof Table>['ref']>();
  expectTypeOf<TableProps['aria-label']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<TableProps['stickyHeader']>().toEqualTypeOf<boolean | undefined>();
});

test('a TableCaption takes no id: the Table makes it', () => {
  expectTypeOf<TableCaptionProps>().not.toHaveProperty('id');
  // @ts-expect-error the id is the Table's
  const withId: TableCaptionProps = { id: 'mine' };
  expectTypeOf(withId).toBeObject();
  expectTypeOf(createRef<HTMLTableCaptionElement>()).toExtend<
    ComponentProps<typeof TableCaption>['ref']
  >();
});

test('a TableHead aligns to start, center or end and sorts in the documented ways', () => {
  expectTypeOf<TableAlign>().toEqualTypeOf<'start' | 'center' | 'end'>();
  expectTypeOf<TableHeadProps['align']>().toEqualTypeOf<TableAlign | undefined>();
  // @ts-expect-error `left` is not an alignment: it would not follow the writing direction
  const left: TableHeadProps = { align: 'left' };
  expectTypeOf(left).toBeObject();
  expectTypeOf<TableSort>().toEqualTypeOf<'ascending' | 'descending' | 'none'>();
  expectTypeOf<TableHeadProps['sort']>().toEqualTypeOf<TableSort | undefined>();
  // The next direction is never `none`: a press asks for one of the two.
  expectTypeOf<NonNullable<TableHeadProps['onSort']>>().parameters.toEqualTypeOf<
    ['ascending' | 'descending']
  >();
  expectTypeOf(createRef<HTMLTableCellElement>()).toExtend<
    ComponentProps<typeof TableHead>['ref']
  >();
});

test('a TableCell aligns the same way, and a TableRow can be selected', () => {
  expectTypeOf<TableCellProps['align']>().toEqualTypeOf<TableAlign | undefined>();
  expectTypeOf<TableRowProps['selected']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf(createRef<HTMLTableCellElement>()).toExtend<
    ComponentProps<typeof TableCell>['ref']
  >();
  expectTypeOf(createRef<HTMLTableRowElement>()).toExtend<ComponentProps<typeof TableRow>['ref']>();
});
