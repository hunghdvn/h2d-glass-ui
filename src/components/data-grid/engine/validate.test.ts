import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../../internal/warn';
import { mergeLabels } from '../labels';
import type { DataGridColumn, DataGridValidationRule } from '../types';
import { resolveColumns } from './columns';
import { hasRules, isRequired, validateRow, validateValue } from './validate';

interface Order {
  id: string;
  customer: string;
  email: string;
  qty: number;
  placed: string;
  paid: boolean;
  code: string;
}

const OPTIONS = {
  locale: 'en-US',
  timeZone: 'UTC',
  yes: 'Yes',
  no: 'No',
  allowSorting: true,
  allowResizing: true,
  allowReordering: true,
  allowPinning: true,
  allowHiding: true,
  allowFiltering: true,
  allowHeaderFiltering: true,
  allowGrouping: true,
};
const labels = mergeLabels(undefined);

function column(definition: DataGridColumn<Order>) {
  return resolveColumns([definition], OPTIONS)[0]!;
}

const customer = column({ field: 'customer', caption: 'Customer' });
const qty = column({ field: 'qty', caption: 'Qty', dataType: 'number' });
const placed = column({
  field: 'placed',
  caption: 'Order date',
  dataType: 'date',
  format: { year: 'numeric', month: 'short', day: 'numeric' },
});

type Rule = DataGridValidationRule<Order, unknown>;
const check = (value: unknown, rules: Rule[], on = customer, row: Partial<Order> = {}) =>
  validateValue(value, rules, on, row, labels);

describe('validateValue', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    resetDevWarnings();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  describe('what it gives', () => {
    it('is null for no rules, and for a value that passes every rule', () => {
      expect(check('', [])).toBeNull();
      expect(check('An', [{ type: 'required' }, { type: 'stringLength', min: 2 }])).toBeNull();
    });

    it('gives the message of the first rule that fails and runs none after it', () => {
      const custom = vi.fn(() => 'never');
      const message = check('', [{ type: 'required' }, { type: 'custom', validate: custom }]);
      expect(message).toBe('Customer is required');
      expect(custom).not.toHaveBeenCalled();
      expect(
        check('A', [
          { type: 'stringLength', min: 2 },
          { type: 'required', message: 'second' },
        ]),
      ).toBe('Customer must be at least 2 characters');
    });

    it("lets a rule's own message win over the words of the labels", () => {
      expect(check(null, [{ type: 'required', message: 'Tell us who' }])).toBe('Tell us who');
      expect(check('abc', [{ type: 'email', message: 'Not mail' }])).toBe('Not mail');
      expect(check('abc', [{ type: 'pattern', pattern: /^\d+$/, message: 'Digits' }])).toBe(
        'Digits',
      );
      expect(check('abcdef', [{ type: 'stringLength', max: 3, message: 'Short' }])).toBe('Short');
      expect(check(0, [{ type: 'range', min: 1, message: 'Positive' }], qty)).toBe('Positive');
    });

    it('writes the default messages with the caption the heading shows and the labels of the grid', () => {
      expect(check('', [{ type: 'required' }])).toBe('Customer is required');
      expect(check('x', [{ type: 'pattern', pattern: /^\d+$/ }])).toBe('Customer is not valid');
      expect(check('x', [{ type: 'email' }])).toBe('Customer must be an email address');
      const custom = mergeLabels({ validation: { required: (caption) => `Thiếu ${caption}` } });
      expect(validateValue('', [{ type: 'required' }], customer, {}, custom)).toBe(
        'Thiếu Customer',
      );
    });
  });

  describe('required', () => {
    it('fails every blank value of the column', () => {
      for (const blank of ['', null, undefined, Number.NaN, new Date(Number.NaN)]) {
        expect(check(blank, [{ type: 'required' }])).toBe('Customer is required');
      }
    });

    it('passes a zero, a false and a text of spaces: only isBlank is blank', () => {
      expect(check(0, [{ type: 'required' }], qty)).toBeNull();
      expect(check(false, [{ type: 'required' }])).toBeNull();
      expect(check('  ', [{ type: 'required' }])).toBeNull();
    });
  });

  describe('every rule but required passes a blank value', () => {
    it('passes a blank for range, stringLength, pattern and email, and leaves custom to the app', () => {
      const custom = vi.fn(() => 'fails');
      const rules: Rule[] = [
        { type: 'range', min: 1 },
        { type: 'stringLength', min: 3 },
        { type: 'pattern', pattern: /^\d+$/ },
        { type: 'email' },
      ];
      for (const blank of ['', null, undefined]) expect(check(blank, rules)).toBeNull();
      expect(check(null, [{ type: 'custom', validate: custom }])).toBe('fails');
      expect(custom).toHaveBeenCalledWith(null, {});
    });
  });

  describe('range', () => {
    it('compares numbers by value, with either end alone', () => {
      const both: Rule = { type: 'range', min: 1, max: 9 };
      expect(check(5, [both], qty)).toBeNull();
      expect(check(1, [both], qty)).toBeNull();
      expect(check(9, [both], qty)).toBeNull();
      expect(check(0, [both], qty)).toBe('Qty must be between 1 and 9');
      expect(check(10, [both], qty)).toBe('Qty must be between 1 and 9');
      expect(check(0, [{ type: 'range', min: 1 }], qty)).toBe('Qty must be at least 1');
      expect(check(10, [{ type: 'range', max: 9 }], qty)).toBe('Qty must be at most 9');
      expect(check(10, [{ type: 'range' }], qty)).toBeNull();
    });

    it('writes the ends as the column writes a value', () => {
      const money = column({
        field: 'qty',
        caption: 'Total',
        dataType: 'number',
        format: { style: 'currency', currency: 'USD' },
      });
      expect(check(5, [{ type: 'range', min: 10, max: 2500 }], money)).toBe(
        'Total must be between $10.00 and $2,500.00',
      );
    });

    it('compares days by their ISO day, a Date or a string alike', () => {
      const rule: Rule = { type: 'range', min: '2026-11-01', max: '2026-11-30' };
      const message = 'Order date must be between Nov 1, 2026 and Nov 30, 2026';
      expect(check('2026-11-15', [rule], placed)).toBeNull();
      expect(check(new Date(Date.UTC(2026, 10, 15)), [rule], placed)).toBeNull();
      expect(check('2026-10-31', [rule], placed)).toBe(message);
      expect(check(new Date(Date.UTC(2026, 11, 1)), [rule], placed)).toBe(message);
      expect(check('2026-12-01', [{ type: 'range', max: '2026-11-30' }], placed)).toBe(
        'Order date must be at most Nov 30, 2026',
      );
    });

    it('passes a value of another type, whose own editor shows its fault', () => {
      expect(check('abc', [{ type: 'range', min: 1, max: 9 }], qty)).toBeNull();
      expect(check(5, [{ type: 'range', min: 1, max: 9 }], customer)).toBeNull();
      expect(check('not a day', [{ type: 'range', min: '2026-11-01' }], placed)).toBeNull();
    });
  });

  describe('stringLength', () => {
    it('counts the characters of the text, with either end alone', () => {
      const rule: Rule = { type: 'stringLength', min: 2, max: 4 };
      expect(check('ab', [rule])).toBeNull();
      expect(check('abcd', [rule])).toBeNull();
      expect(check('a', [rule])).toBe('Customer must be between 2 and 4 characters');
      expect(check('abcde', [rule])).toBe('Customer must be between 2 and 4 characters');
      expect(check('a', [{ type: 'stringLength', min: 2 }])).toBe(
        'Customer must be at least 2 characters',
      );
      expect(check('abcde', [{ type: 'stringLength', max: 4 }])).toBe(
        'Customer must be at most 4 characters',
      );
    });

    it('counts a character that takes two code units once, and reads a number as its text', () => {
      expect(check('😀', [{ type: 'stringLength', max: 1 }])).toBeNull();
      expect(check(12345, [{ type: 'stringLength', max: 4 }], qty)).toBe(
        'Qty must be at most 4 characters',
      );
    });
  });

  describe('pattern', () => {
    it('tests the text with the expression', () => {
      const rule: Rule = { type: 'pattern', pattern: /^DH-\d+$/ };
      expect(check('DH-12', [rule])).toBeNull();
      expect(check('XX-12', [rule])).toBe('Customer is not valid');
    });

    it('is not fooled by a global or sticky expression, which remembers where it stopped', () => {
      const global: Rule = { type: 'pattern', pattern: /^DH-\d+$/g };
      const sticky: Rule = { type: 'pattern', pattern: /DH/y };
      for (let time = 0; time < 3; time++) {
        expect(check('DH-12', [global])).toBeNull();
        expect(check('DH-12', [sticky])).toBeNull();
      }
    });
  });

  describe('email', () => {
    it('wants one @, a dot after it and no space, and is loose beyond that', () => {
      for (const good of ['a@b.co', 'first.last@mail.example.vn', 'a+b@c.d']) {
        expect(check(good, [{ type: 'email' }])).toBeNull();
      }
      for (const bad of ['plain', 'a@b', 'a@@b.c', 'a b@c.d', 'a@b .c', '@b.c', 'a@.c', 'a@b.']) {
        expect(check(bad, [{ type: 'email' }])).toBe('Customer must be an email address');
      }
    });
  });

  describe('custom', () => {
    it("reads a string as the message, and false as an error with the rule's message or the pattern words", () => {
      expect(check('x', [{ type: 'custom', validate: () => 'Taken' }])).toBe('Taken');
      expect(check('x', [{ type: 'custom', validate: () => false, message: 'No' }])).toBe('No');
      expect(check('x', [{ type: 'custom', validate: () => false }])).toBe('Customer is not valid');
    });

    it('passes true, null, undefined and an empty string', () => {
      for (const result of [true, null, undefined, '']) {
        expect(check('x', [{ type: 'custom', validate: () => result }])).toBeNull();
      }
    });

    it('is given the value and the row being edited', () => {
      const validate = vi.fn(() => true);
      check('x', [{ type: 'custom', validate }], customer, { id: 'DH-1', qty: 2 });
      expect(validate).toHaveBeenCalledWith('x', { id: 'DH-1', qty: 2 });
    });

    it('passes, with one warning, when the rule throws', () => {
      const validate = () => {
        throw new Error('boom');
      };
      expect(check('x', [{ type: 'custom', validate }])).toBeNull();
      expect(check('x', [{ type: 'custom', validate }])).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]![0])).not.toContain('boom');
    });

    it('ignores a rule of a type it does not know, and a pattern that is no expression', () => {
      const unknown = { type: 'unique' } as unknown as Rule;
      const loose = { type: 'pattern', pattern: 'abc' } as unknown as Rule;
      expect(check('x', [unknown, loose])).toBeNull();
    });
  });
});

describe('hasRules', () => {
  it('is yes for a column with a rule, and no for one with none or with a value that is no list', () => {
    const [none, one, odd] = resolveColumns<Order>(
      [
        { field: 'id' },
        { field: 'customer', validationRules: [{ type: 'required' }] },
        { field: 'email', validationRules: 'required' as never },
      ],
      OPTIONS,
    );
    expect([none!, one!, odd!].map(hasRules)).toEqual([false, true, false]);
  });
});

describe('isRequired', () => {
  it('is yes only for a column with a required rule: the star of a form field', () => {
    const [none, other, required, odd] = resolveColumns<Order>(
      [
        { field: 'id' },
        { field: 'email', validationRules: [{ type: 'email' }] },
        { field: 'customer', validationRules: [{ type: 'email' }, { type: 'required' }] },
        { field: 'code', validationRules: 'required' as never },
      ],
      OPTIONS,
    );
    expect([none!, other!, required!, odd!].map(isRequired)).toEqual([false, false, true, false]);
  });
});

describe('validateRow', () => {
  const columns = resolveColumns<Order>(
    [
      { field: 'id' },
      { field: 'customer', caption: 'Customer', validationRules: [{ type: 'required' }] },
      {
        field: 'email',
        caption: 'Email',
        validationRules: [{ type: 'required' }, { type: 'email' }],
      },
      {
        field: 'qty',
        caption: 'Qty',
        dataType: 'number',
        validationRules: [{ type: 'range', min: 1 }],
      },
    ],
    OPTIONS,
  );

  it('gives the message of each column that fails, by column id, in the order of the columns', () => {
    const errors = validateRow(
      { id: 'DH-1', customer: '', email: 'nope', qty: 0 },
      columns,
      labels,
    );
    expect([...errors]).toEqual([
      ['customer', 'Customer is required'],
      ['email', 'Email must be an email address'],
      ['qty', 'Qty must be at least 1'],
    ]);
  });

  it('is empty for a row that passes, and checks only the columns it is given', () => {
    expect(validateRow({ customer: 'An', email: 'a@b.co', qty: 3 }, columns, labels).size).toBe(0);
    const bad = { customer: '', email: '', qty: 0 };
    const some = validateRow(bad, [columns[1]!], labels);
    expect([...some.keys()]).toEqual(['customer']);
  });

  it('reads the value of a field the row does not have as blank', () => {
    const errors = validateRow({}, columns, labels);
    expect([...errors.keys()]).toEqual(['customer', 'email']);
  });

  it('treats a column whose rules are not an array as having none', () => {
    const odd = resolveColumns<Order>(
      [{ field: 'customer', validationRules: 'required' as never }],
      OPTIONS,
    );
    expect(validateRow({}, odd, labels).size).toBe(0);
  });
});
