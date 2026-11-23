import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  GROUP_ROW_HEIGHT_PROPERTY,
  ROW_HEIGHT,
  groupRowHeight,
  resolveDensity,
  resolveVariant,
  rowPitch,
} from './row-heights';

describe('ROW_HEIGHT', () => {
  it('holds the table of spec 4.3: density by variant', () => {
    expect(ROW_HEIGHT).toEqual({
      compact: { lined: 31, striped: 30, minimal: 36 },
      standard: { lined: 41, striped: 40, minimal: 52 },
      comfortable: { lined: 49, striped: 48, minimal: 60 },
    });
  });
});

describe('groupRowHeight', () => {
  it('is the height of a data row less 8px, for every density and variant', () => {
    expect(groupRowHeight('standard', 'lined')).toBe(33);
    expect(groupRowHeight('compact', 'striped')).toBe(22);
    expect(groupRowHeight('comfortable', 'minimal')).toBe(52);
  });

  it('is the default the stylesheet declares on the root, which the grid writes over for its own', () => {
    const css = readFileSync('src/styles/components/data-grid.css', 'utf8');
    const declared = new RegExp(`${GROUP_ROW_HEIGHT_PROPERTY}:\\s*(\\d+)px`).exec(css);
    expect(declared?.[1]).toBe(String(groupRowHeight('standard', 'lined')));
  });
});

describe('rowPitch', () => {
  it('is the height of the row, and 2px more when the rows are apart (striped)', () => {
    expect(rowPitch(41, 'lined')).toBe(41);
    expect(rowPitch(52, 'minimal')).toBe(52);
    expect(rowPitch(40, 'striped')).toBe(42);
  });
});

describe('resolveDensity and resolveVariant', () => {
  it('keep a known value', () => {
    expect(resolveDensity('compact')).toBe('compact');
    expect(resolveVariant('minimal')).toBe('minimal');
  });

  it('give the default for anything else, without a cast in the caller', () => {
    expect(resolveDensity('tight')).toBe('standard');
    expect(resolveDensity(undefined)).toBe('standard');
    expect(resolveVariant('grid')).toBe('lined');
    expect(resolveVariant(undefined)).toBe('lined');
  });
});
