import { describe, expect, it } from 'vitest';
import { sameLabels } from './hooks/use-renewal-warning';
import { DEFAULT_LABELS, LABEL_RECORDS, controlLabelsOf, mergeLabels } from './labels';

describe('LABEL_RECORDS', () => {
  it('names every label that is a record of words, read from the defaults and not from a list', () => {
    const records = Object.entries(DEFAULT_LABELS)
      .filter(([, value]) => typeof value === 'object')
      .map(([key]) => key);
    expect([...LABEL_RECORDS].sort()).toEqual(records.sort());
    expect(LABEL_RECORDS).toContain('validation');
    expect(LABEL_RECORDS).toContain('controls');
  });
});

describe('the controls record', () => {
  it('keeps the other nine words when the caller gives one', () => {
    const { controls } = mergeLabels({ controls: { increase: 'Tăng' } });
    expect(controls.increase).toBe('Tăng');
    expect(Object.keys(controls)).toHaveLength(10);
    expect({ ...controls, increase: 'Increase' }).toEqual(DEFAULT_LABELS.controls);
  });

  it('says what the controls say by themselves, so nothing changes until an app passes words', () => {
    const { controls } = DEFAULT_LABELS;
    expect(controls.results(1)).toBe('1 result');
    expect(controls.results(7)).toBe('7 results');
    expect(controls.chooseDate).toBe('Choose date');
    expect(controls.clearSearch).toBe('Clear search');
  });

  it('is handed to each control in the shape that control takes, whole', () => {
    const controls = mergeLabels({
      controls: { chooseDate: 'Chọn ngày', decrease: 'Giảm' },
    }).controls;
    const made = controlLabelsOf(controls);
    expect(made.date).toMatchObject({ openCalendar: 'Chọn ngày', dialog: 'Chọn ngày' });
    expect(made.date.invalidDate).toBe('Invalid date');
    expect(made.number).toEqual({ increment: 'Increase', decrement: 'Giảm' });
    expect(made.combobox.noResults).toBe('No results');
    expect(made.combobox.results).toBe(controls.results);
    expect(made.search).toEqual({ clear: 'Clear search' });
  });
});

describe('the Cancel button', () => {
  it('has one word for the filter popover, the delete dialog, the form and the popup', () => {
    expect(DEFAULT_LABELS.cancel).toBe('Cancel');
    expect(Object.keys(DEFAULT_LABELS)).not.toContain('cancelButton');
    expect(mergeLabels({ cancel: 'Huỷ' }).cancel).toBe('Huỷ');
  });
});

describe('mergeLabels', () => {
  it('merges validation one level deep, so a partial record keeps the words it leaves out', () => {
    const labels = mergeLabels({ validation: { required: (caption) => `${caption}?` } });
    expect(labels.validation.required('Customer')).toBe('Customer?');
    expect(labels.validation.email('Email')).toBe('Email must be an email address');
    expect(labels.validation.range('Qty', '1', '9')).toBe('Qty must be between 1 and 9');
  });

  it('keeps the defaults of validation when the caller gives none, or gives undefined words', () => {
    expect(mergeLabels(undefined).validation).toEqual(DEFAULT_LABELS.validation);
    const labels = mergeLabels({ validation: { required: undefined } });
    expect(labels.validation.required('Customer')).toBe('Customer is required');
  });

  it('says one end of a range or a length as "at least" or "at most"', () => {
    const { validation } = mergeLabels(undefined);
    expect(validation.range('Qty', '1', undefined)).toBe('Qty must be at least 1');
    expect(validation.range('Qty', undefined, '9')).toBe('Qty must be at most 9');
    expect(validation.stringLength('Note', 2, 5)).toBe('Note must be between 2 and 5 characters');
    expect(validation.stringLength('Note', 2, undefined)).toBe(
      'Note must be at least 2 characters',
    );
    expect(validation.stringLength('Note', undefined, 5)).toBe('Note must be at most 5 characters');
    expect(validation.pattern('Code')).toBe('Code is not valid');
  });
});

describe('sameLabels', () => {
  it('compares the controls record by its words', () => {
    const results = (count: number) => `${count}`;
    expect(sameLabels({ controls: { results } }, { controls: { results } })).toBe(true);
    expect(sameLabels({ controls: { increase: 'Tăng' } }, { controls: { increase: 'Tăng' } })).toBe(
      true,
    );
    expect(sameLabels({ controls: { increase: 'Tăng' } }, { controls: { increase: 'Up' } })).toBe(
      false,
    );
  });

  it('compares the validation record by its words, as every other record of labels', () => {
    const required = (caption: string) => `${caption}?`;
    expect(sameLabels({ validation: { required } }, { validation: { required } })).toBe(true);
    expect(
      sameLabels({ validation: { required } }, { validation: { required: (c) => `${c}?` } }),
    ).toBe(false);
  });
});
