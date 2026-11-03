import { expectTypeOf, test } from 'vitest';
import { Slider } from './Slider';
import type { SliderProps } from './Slider';

test('Slider reports a pair when it is given a pair, and a number when it is given a number', () => {
  Slider({
    defaultValue: [20, 75],
    onValueChange: (value) => expectTypeOf(value).toEqualTypeOf<[number, number]>(),
    onValueCommit: (value) => expectTypeOf(value).toEqualTypeOf<[number, number]>(),
  });
  Slider({
    value: [20, 75],
    onValueChange: (value) => expectTypeOf(value).toEqualTypeOf<[number, number]>(),
  });
  Slider({
    defaultValue: 60,
    onValueChange: (value) => expectTypeOf(value).toEqualTypeOf<number>(),
  });
  Slider({
    value: 60,
    onValueCommit: (value) => expectTypeOf(value).toEqualTypeOf<number>(),
  });
});

test('Slider is one thumb when it has neither a value nor a default value', () => {
  Slider({ onValueChange: (value) => expectTypeOf(value).toEqualTypeOf<number>() });
  expectTypeOf<SliderProps['value']>().toEqualTypeOf<number | undefined>();
});

test('Slider takes only a number or a pair of numbers as a value', () => {
  // @ts-expect-error a string is not a value
  Slider({ value: '60' });
  // @ts-expect-error a range has exactly two numbers
  Slider({ value: [1, 2, 3] });
});

test('Slider takes numbers for min, max and step, and a function for the words of a value', () => {
  expectTypeOf<SliderProps['min']>().toEqualTypeOf<number | undefined>();
  expectTypeOf<SliderProps['getValueText']>().toEqualTypeOf<
    ((value: number) => string) | undefined
  >();
  // @ts-expect-error the slider has no size
  Slider({ size: 'md' });
});

test('Slider takes the words for the two thumbs of a range, each one optional', () => {
  expectTypeOf<SliderProps<[number, number]>['labels']>().toEqualTypeOf<
    { minimum?: string; maximum?: string } | undefined
  >();
  Slider({ defaultValue: [1, 2], labels: { maximum: 'Up to' } });
  // @ts-expect-error only minimum and maximum are labelled
  Slider({ defaultValue: [1, 2], labels: { middle: 'x' } });
});
