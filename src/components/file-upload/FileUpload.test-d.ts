import { expectTypeOf, test } from 'vitest';
import type { FileRejection, FileUploadProps } from './FileUpload';

test('a FileUpload holds a list of files, and reports the whole list', () => {
  expectTypeOf<FileUploadProps['value']>().toEqualTypeOf<File[] | undefined>();
  expectTypeOf<FileUploadProps['defaultValue']>().toEqualTypeOf<File[] | undefined>();
  expectTypeOf<FileUploadProps['onValueChange']>().toEqualTypeOf<
    ((files: File[]) => void) | undefined
  >();
  // @ts-expect-error a file list is not a single File
  const one: FileUploadProps = { value: new File([], 'a.pdf') };
  expectTypeOf(one).toBeObject();
});

test('the labels that need a value are functions', () => {
  type Labels = NonNullable<FileUploadProps['labels']>;
  expectTypeOf<Labels['remove']>().toEqualTypeOf<((name: string) => string) | undefined>();
  expectTypeOf<Labels['added']>().toEqualTypeOf<((count: number) => string) | undefined>();
  expectTypeOf<Labels['prompt']>().toEqualTypeOf<string | undefined>();
  // @ts-expect-error a label that takes the name is a function, not a string
  const wrong: Labels = { remove: 'Remove' };
  expectTypeOf(wrong).toBeObject();
});

test('the checks and the form props are declared', () => {
  expectTypeOf<FileUploadProps['maxSize']>().toEqualTypeOf<number | undefined>();
  expectTypeOf<FileUploadProps['validate']>().toEqualTypeOf<
    ((file: File) => string | null) | undefined
  >();
  expectTypeOf<FileUploadProps['onReject']>().toEqualTypeOf<
    ((rejections: FileRejection[]) => void) | undefined
  >();
  expectTypeOf<FileUploadProps['form']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<FileRejection['errors'][number]['code']>().toEqualTypeOf<
    'type' | 'size' | 'count' | 'custom'
  >();
});
