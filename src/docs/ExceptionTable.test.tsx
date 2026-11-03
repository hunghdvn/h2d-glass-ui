import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { measure } from '../../scripts/lib/contrast';
import * as values from '../styles/theme/values';
import { ExceptionTable } from './ExceptionTable';

describe('ExceptionTable', () => {
  const bodyRows = () => {
    render(<ExceptionTable />);
    return screen.getAllByRole('row').slice(1);
  };
  const cells = (row: HTMLElement) =>
    within(row)
      .getAllByRole('cell')
      .map((cell) => cell.textContent);

  it('lists the seventeen rows of spec §4.9 with light and dark measurements', () => {
    const rows = bodyRows();
    expect(rows).toHaveLength(17);
    expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
    ]);
    expect(rows[3]).toHaveTextContent('meets AA (4.74:1)');
    expect(rows[3]).toHaveTextContent('3.63:1 / 2.24:1');
    expect(rows[6]).toHaveTextContent('3.40:1');
    expect(rows[8]).toHaveTextContent('4.37:1');
    expect(rows[8]).toHaveTextContent('3.60:1');
    expect(cells(rows[9]!)[1]).toBe('4.24:1');
    expect(cells(rows[9]!)[2]).toMatch(/^meets AA \(4\.\d\d:1\)$/);
    expect(cells(rows[10]!).slice(1, 3)).toEqual(['2.61:1', '1.91:1']);
    expect(cells(rows[11]!).slice(1, 3)).toEqual(['4.10:1', '3.36:1']);
    expect(cells(rows[12]!).slice(1, 3)).toEqual(['1.24:1', '1.12:1']);
    expect(cells(rows[13]!)[1]).toMatch(/^meets AA \(3\.\d\d:1\)$/);
    expect(cells(rows[13]!)[2]).toBe('2.29:1');
    expect(cells(rows[13]!).at(-2)).toBe('3:1');
    // The Slider rows (spec phase 3 §4.4): tick dots, track, thumb.
    expect(cells(rows[14]!).slice(1, 3)).toEqual(['2.88:1', '2.82:1']);
    expect(cells(rows[15]!).slice(1, 3)).toEqual(['1.23:1', '1.30:1']);
    expect(cells(rows[16]!).slice(1, 3)).toEqual(['1.29:1', '2.24:1']);
  });

  it('shows the live measurement for a theme with no exception in a row', () => {
    const light = measure(values, 'light', 'default');
    const [, lightCell] = cells(bodyRows()[2]!);
    expect(lightCell).toBe(`meets AA (${light['input-focus-border'].toFixed(2)}:1)`);
  });

  it('names the WCAG criterion and minimum of every row', () => {
    const rows = bodyRows();
    const criteria = rows.map((row) => cells(row).at(-1));
    expect(criteria).toEqual([
      '1.4.11',
      '1.4.11',
      '1.4.11',
      '1.4.3, 1.4.11',
      '1.4.11',
      '1.4.3',
      '1.4.3',
      '1.4.11',
      '1.4.3, 1.4.11',
      '1.4.3',
      '1.4.11',
      '1.4.3',
      '1.4.11',
      '1.4.11',
      '1.4.11',
      '1.4.11',
      '1.4.11',
    ]);
    expect(cells(rows[3]!).at(-2)).toBe('4.5:1 text, 3:1 check marks');
    expect(cells(rows[0]!).at(-2)).toBe('3:1');
    expect(cells(rows[5]!).at(-2)).toBe('4.5:1');
  });

  it('gives one number for a row whose checks measure the same pair', () => {
    const [, light, dark] = cells(bodyRows()[4]!);
    expect(light).toMatch(/^meets AA \(3\.\d\d:1\)$/);
    expect(dark).toBe('2.26:1');
  });
});
