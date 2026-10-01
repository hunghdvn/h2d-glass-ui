import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExceptionTable } from './ExceptionTable';

describe('ExceptionTable', () => {
  it('lists the seven rows of spec §4.9 with light and dark measurements', () => {
    render(<ExceptionTable />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(7);
    expect(rows[3]).toHaveTextContent('meets AA');
    expect(rows[3]).toHaveTextContent('3.63:1 / 2.24:1');
    expect(rows[6]).toHaveTextContent('3.53:1');
  });
});
