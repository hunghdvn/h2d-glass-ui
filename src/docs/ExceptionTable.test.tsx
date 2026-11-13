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

  it('lists the thirty-seven rows of spec §4.9 with light and dark measurements', () => {
    const rows = bodyRows();
    expect(rows).toHaveLength(37);
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
      '18',
      '19',
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
      '30',
      '31',
      '32',
      '33',
      '34',
      '35',
      '36',
      '37',
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
    // The days of the months around in a Calendar (spec phase 3 §4.4).
    expect(cells(rows[17]!).slice(1, 3)).toEqual(['2.04:1', '2.14:1']);
    // The zone edge, the browse word and the file size of a FileUpload (spec phase 3 §4.4).
    expect(cells(rows[18]!).slice(1, 3)).toEqual(['1.89:1', '1.99:1']);
    expect(cells(rows[19]!).slice(1, 3)).toEqual(['meets AA (5.42:1)', '3.79:1']);
    expect(cells(rows[20]!).slice(1, 3)).toEqual(['meets AA (7.44:1)', '3.71:1']);
    // The hint under the prompt of the zone, muted text on the zone (found in the final review).
    expect(cells(rows[21]!).slice(1, 3)).toEqual(['meets AA (6.98:1)', '3.64:1']);
    // The Alert rows (spec phase 4 §4.4): three icons share row 23, each with its own number.
    expect(cells(rows[22]!).slice(1, 3)).toEqual(['meets AA (3.60:1)', '2.02:1 / 1.84:1 / 1.88:1']);
    expect(cells(rows[23]!).slice(1, 3)).toEqual(['meets AA (4.68:1)', '3.37:1']);
    expect(cells(rows[24]!).slice(1, 3)).toEqual(['meets AA (11.14:1)', '4.16:1']);
    // Row 26 also holds the number of the current step of a Stepper, which is the lower of the two in
    // light and has its own number in dark.
    expect(cells(rows[25]!).slice(1, 3)).toEqual(['meets AA (5.67:1)', '3.90:1 / 3.33:1']);
    // The Progress rows (spec phase 4 §4.4): the fill is under the threshold in both themes.
    expect(cells(rows[26]!).slice(1, 3)).toEqual(['2.45:1', '1.74:1']);
    expect(cells(rows[27]!).slice(1, 3)).toEqual(['1.62:1', '1.74:1']);
    expect(cells(rows[28]!).slice(1, 3)).toEqual(['3.95:1', '4.44:1']);
    // The Stepper rows (spec phase 4 §4.4): the ring of a step not reached yet, and the edge of the
    // current step of a `compact` Stepper on its pill.
    expect(cells(rows[29]!).slice(1, 3)).toEqual(['2.63:1', '2.63:1']);
    expect(cells(rows[30]!).slice(1, 3)).toEqual(['2.61:1', '2.01:1']);
    // The Table rows (spec phase 4 §4.4): a Badge on the row under the pointer, the text on the odd
    // row of `striped` (only the muted text passes in light) and a Badge on a chosen row.
    expect(cells(rows[31]!).slice(1, 3)).toEqual(['2.80:1', '3.03:1']);
    expect(cells(rows[32]!).slice(1, 3)).toEqual(['3.09:1', '3.71:1 / 3.37:1']);
    expect(cells(rows[33]!).slice(1, 3)).toEqual(['2.97:1', '3.27:1']);
    // The bar of the current item of a Nav `bar` on its tint (spec phase 5 §4.4): under 3:1 in both.
    expect(cells(rows[34]!).slice(1, 3)).toEqual(['2.52:1', '2.03:1']);
    // The key hint of a SearchField (spec phase 5 §4.4): enough in light, 3.31:1 in dark.
    expect(cells(rows[35]!).slice(1, 3)).toEqual(['meets AA (7.15:1)', '3.31:1']);
    // The key of a Kbd (spec phase 6 §4.4): five places, and the highlighted item of a menu is the lowest.
    expect(cells(rows[36]!).slice(1, 3)).toEqual(['meets AA (6.71:1)', '3.23:1']);
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
      '1.4.3',
      '1.4.11',
      '1.4.3',
      '1.4.3',
      '1.4.3',
      '1.4.11',
      '1.4.3',
      '1.4.3',
      '1.4.3',
      '1.4.11',
      '1.4.11',
      '1.4.3',
      '1.4.11',
      '1.4.11',
      '1.4.3',
      '1.4.3',
      '1.4.3',
      '1.4.11',
      '1.4.3',
      '1.4.3',
    ]);
    expect(cells(rows[3]!).at(-2)).toBe('4.5:1 text, 3:1 check marks');
    expect(cells(rows[0]!).at(-2)).toBe('3:1');
    expect(cells(rows[5]!).at(-2)).toBe('4.5:1');
    expect(cells(rows[21]!).at(-2)).toBe('4.5:1');
  });

  it('gives one number for a row whose checks measure the same pair', () => {
    const [, light, dark] = cells(bodyRows()[4]!);
    expect(light).toMatch(/^meets AA \(3\.\d\d:1\)$/);
    expect(dark).toBe('2.26:1');
  });
});
