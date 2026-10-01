import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TokenTable } from './TokenTable';

describe('TokenTable', () => {
  it('renders one row per token name and a column per map', () => {
    render(<TokenTable columns={{ light: { a: '1', b: '2' }, dark: { a: '3' } }} />);
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(
      within(rows[0]!)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Token', 'light', 'dark']);
    expect(within(rows[2]!).getByRole('rowheader')).toHaveTextContent('--flg-b');
    expect(rows[2]).toHaveTextContent('—');
  });

  it('shortens very long values but keeps the full value in a title', () => {
    const long = `url("${'x'.repeat(120)}")`;
    render(<TokenTable columns={{ value: { noise: long } }} />);
    const cell = screen.getByTitle(long);
    expect(cell.textContent?.length).toBeLessThanOrEqual(80);
  });
});
