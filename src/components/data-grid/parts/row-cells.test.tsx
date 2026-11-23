import { describe, expect, it } from 'vitest';
import type { ResolvedColumn } from '../engine/columns';
import { rowCells } from './row-cells';

type Row = Record<string, never>;

const column = (id: string, service?: 'indent' | 'select' | 'detail'): ResolvedColumn<Row> =>
  ({ id, service }) as unknown as ResolvedColumn<Row>;

const indent = (id: string) => column(id, 'indent');
const keyOf = (cell: { key: unknown }) => String(cell.key);

/** The cells of a row as their keys, and what the callback saw for each column. */
function run(columns: ResolvedColumn<Row>[], fillerAt: number, filler: boolean, head = false) {
  const seen: { id: string; index: number; place: number; indent: boolean }[] = [];
  const cells = rowCells(
    columns,
    fillerAt,
    filler,
    head,
    ({ column: one, index, place, indent }) => {
      seen.push({ id: one.id, index, place, indent });
      return <td key={one.id} />;
    },
  );
  return { cells: cells.map(keyOf), seen, raw: cells };
}

describe('rowCells', () => {
  it('draws a cell for each column, and the filler by its layout index', () => {
    const columns = [column('a'), column('b'), column('c')];
    expect(run(columns, 3, true).cells).toEqual(['a', 'b', 'c', 'flg:filler']);
    expect(run(columns, 2, true).cells).toEqual(['a', 'b', 'flg:filler', 'c']);
    expect(run(columns, 0, true).cells).toEqual(['flg:filler', 'a', 'b', 'c']);
  });

  it('draws no filler when the row has none', () => {
    expect(run([column('a'), column('b')], 2, false).cells).toEqual(['a', 'b']);
    expect(run([column('a'), column('b')], 1, false).cells).toEqual(['a', 'b']);
  });

  it('counts the places of the keyboard over the columns that are one, not the indents', () => {
    const columns = [indent('i1'), indent('i2'), column('flg:select', 'select'), column('a')];
    expect(run(columns, 4, true).seen).toEqual([
      { id: 'i1', index: 0, place: -1, indent: true },
      { id: 'i2', index: 1, place: -1, indent: true },
      { id: 'flg:select', index: 2, place: 0, indent: false },
      { id: 'a', index: 3, place: 1, indent: false },
    ]);
  });

  it('places the filler before the first column of the right zone with indents before it', () => {
    const columns = [indent('i1'), indent('i2'), column('a'), column('b'), column('c')];
    expect(run(columns, 4, true).cells).toEqual(['i1', 'i2', 'a', 'b', 'flg:filler', 'c']);
  });

  it('places the filler by layout index when a row merges the indents into one cell', () => {
    const columns = [indent('i1'), indent('i2'), column('a'), column('b'), column('c')];
    const merged = rowCells(columns, 4, true, false, ({ column: one, indent: isIndent, index }) => {
      if (isIndent) return index === 0 ? <td key="flg:indents" colSpan={2} /> : null;
      return <td key={one.id} />;
    });
    // The filler stays between b and c, with no offset worked out by the row.
    expect(merged.map(keyOf)).toEqual(['flg:indents', 'a', 'b', 'flg:filler', 'c']);
  });

  it('lets a cell stand for several columns, and a column have no cell', () => {
    const columns = [indent('i1'), column('flg:detail', 'detail'), column('a')];
    const cells = rowCells(columns, 3, true, true, ({ column: one }) =>
      one.id === 'i1' ? null : one.id === 'a' ? [<td key="a1" />, <td key="a2" />] : <td key="d" />,
    );
    expect(cells.map(keyOf)).toEqual(['d', 'a1', 'a2', 'flg:filler']);
  });

  it('draws the filler as a title in a heading and as a cell in a body', () => {
    const columns = [column('a')];
    const head = run(columns, 1, true, true).raw.at(-1)!;
    const body = run(columns, 1, true, false).raw.at(-1)!;
    expect((head.props as { head: boolean }).head).toBe(true);
    expect((body.props as { head: boolean }).head).toBe(false);
  });

  it('draws the filler of a row with no column', () => {
    expect(run([], 0, true).cells).toEqual(['flg:filler']);
  });
});
