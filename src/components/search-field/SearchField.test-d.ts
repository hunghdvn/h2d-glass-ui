import { expectTypeOf, test } from 'vitest';
import type { SearchFieldLabels, SearchFieldProps } from './SearchField';

test('SearchField accepts only the documented sizes and shortcuts', () => {
  expectTypeOf<SearchFieldProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
  expectTypeOf<SearchFieldProps['shortcut']>().toEqualTypeOf<'/' | 'mod+k' | undefined>();
  // @ts-expect-error 'xl' is not a size
  const unknownSize: SearchFieldProps = { size: 'xl' };
  // @ts-expect-error only "/" and "mod+k" are shortcuts
  const unknownShortcut: SearchFieldProps = { shortcut: 'ctrl+k' };
  expectTypeOf(unknownSize).toBeObject();
  expectTypeOf(unknownShortcut).toBeObject();
});

test("the text is a string, and the type of the input is not the caller's to change", () => {
  expectTypeOf<SearchFieldProps['value']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<SearchFieldProps['defaultValue']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<SearchFieldProps['onValueChange']>().toEqualTypeOf<
    ((value: string) => void) | undefined
  >();
  // @ts-expect-error the input is always of type search
  const typed: SearchFieldProps = { type: 'text' };
  expectTypeOf(typed).toBeObject();
});

test('labels is partial, and the key hint is told the key and the platform', () => {
  expectTypeOf<SearchFieldLabels['shortcut']>().toEqualTypeOf<
    (shortcut: '/' | 'mod+k', apple: boolean) => string
  >();
  const some: SearchFieldProps['labels'] = { clear: 'Xoá' };
  expectTypeOf(some).not.toBeAny();
});
