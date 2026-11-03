import { expectTypeOf, test } from 'vitest';
import type { TagInputProps } from './TagInput';

test('a TagInput holds a list of strings, and reports the whole list', () => {
  expectTypeOf<TagInputProps['value']>().toEqualTypeOf<string[] | undefined>();
  expectTypeOf<TagInputProps['defaultValue']>().toEqualTypeOf<string[] | undefined>();
  expectTypeOf<TagInputProps['onValueChange']>().toEqualTypeOf<
    ((value: string[]) => void) | undefined
  >();
  // @ts-expect-error a tag list is not a string
  const text: TagInputProps = { value: 'a,b' };
  expectTypeOf(text).toBeObject();
});

test('the text typed has its own value, default and callback', () => {
  expectTypeOf<TagInputProps['inputValue']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<TagInputProps['defaultInputValue']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<TagInputProps['onInputValueChange']>().toEqualTypeOf<
    ((text: string) => void) | undefined
  >();
});

test('a TagInput accepts only the sizes of Input', () => {
  expectTypeOf<TagInputProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
  // @ts-expect-error 'xl' is not a size
  const unknownSize: TagInputProps = { size: 'xl' };
  expectTypeOf(unknownSize).toBeObject();
});

test('the labels are optional functions of the tag', () => {
  type Labels = NonNullable<TagInputProps['labels']>;
  expectTypeOf<Labels['remove']>().toEqualTypeOf<((tag: string) => string) | undefined>();
  expectTypeOf<Labels['added']>().toEqualTypeOf<((tag: string) => string) | undefined>();
  expectTypeOf<Labels['removed']>().toEqualTypeOf<((tag: string) => string) | undefined>();
  // @ts-expect-error a label that takes a tag is a function, not a string
  const wrong: Labels = { added: 'added' };
  expectTypeOf(wrong).toBeObject();
});

test('validate judges a tag, and the labels have the words of the three messages', () => {
  expectTypeOf<TagInputProps['validate']>().toEqualTypeOf<
    ((tag: string, tags: string[]) => boolean | string) | undefined
  >();
  expectTypeOf<TagInputProps['maxTags']>().toEqualTypeOf<number | undefined>();
  expectTypeOf<TagInputProps['allowDuplicates']>().toEqualTypeOf<boolean | undefined>();
  type Labels = NonNullable<TagInputProps['labels']>;
  expectTypeOf<Labels['invalid']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<Labels['duplicate']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<Labels['tooMany']>().toEqualTypeOf<((max: number) => string) | undefined>();
});
