import { expectTypeOf, test } from 'vitest';
import type { DatePickerLabels, DatePickerProps } from './DatePicker';

test('a DatePicker takes null for no date, and reports a string or null', () => {
  expectTypeOf<DatePickerProps['value']>().toEqualTypeOf<string | null | undefined>();
  expectTypeOf<DatePickerProps['defaultValue']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<DatePickerProps['onValueChange']>().toEqualTypeOf<
    ((value: string | null) => void) | undefined
  >();
  const cleared: DatePickerProps = { value: null };
  expectTypeOf(cleared).toBeObject();
});

test('a DatePicker accepts only the sizes of Input', () => {
  expectTypeOf<DatePickerProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
  // @ts-expect-error 'xl' is not a size
  const unknownSize: DatePickerProps = { size: 'xl' };
  expectTypeOf(unknownSize).toBeObject();
});

test('min and max are dates written as strings, never Date objects', () => {
  expectTypeOf<DatePickerProps['min']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<DatePickerProps['max']>().toEqualTypeOf<string | undefined>();
  // @ts-expect-error a Date is no ISO string
  const dated: DatePickerProps = { min: new Date() };
  expectTypeOf(dated).toBeObject();
});

test('the labels hold the calendar button, the dialog and the calendar words', () => {
  expectTypeOf<DatePickerLabels>().toHaveProperty('openCalendar');
  expectTypeOf<DatePickerLabels>().toHaveProperty('dialog');
  expectTypeOf<DatePickerLabels>().toHaveProperty('previousMonth');
  expectTypeOf<DatePickerLabels>().toHaveProperty('nextMonth');
});

test('the text input takes the HTML props of an input, the root takes className', () => {
  const props: DatePickerProps = {
    required: true,
    readOnly: true,
    name: 'checkin',
    placeholder: 'Pick a day',
    'aria-label': 'Check-in',
    onBlur: () => {},
  };
  expectTypeOf(props).toBeObject();
});
