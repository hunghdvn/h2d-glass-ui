import { describe, expect, it } from 'vitest';
import { csvField, toCsv } from './csv';
import type { CsvColumn, CsvOptions } from './csv';

interface Row {
  a: string;
  n: string;
}

const OPTIONS: CsvOptions = { separator: ',', bom: false, escapeFormulas: true };
const BOM = String.fromCharCode(0xfeff);

// Two columns that read the fields of a row: `a` is guarded (a string column), `n` is not (a number).
const COLUMNS: CsvColumn<Row>[] = [
  { caption: 'A', text: (row) => row.a, guard: true },
  { caption: 'N', text: (row) => row.n, guard: false },
];
const csv = (rows: Row[], options: Partial<CsvOptions> = {}, columns = COLUMNS) =>
  toCsv(rows, columns, { ...OPTIONS, ...options });

describe('csvField', () => {
  it('writes a plain field as it is', () => {
    expect(csvField('Nguyễn Văn An', ',', false)).toBe('Nguyễn Văn An');
    expect(csvField('', ',', true)).toBe('');
  });

  it('quotes a field that holds the separator, a quote, a CR or a LF', () => {
    expect(csvField('a,b', ',', false)).toBe('"a,b"');
    expect(csvField('a"b', ',', false)).toBe('"a""b"');
    expect(csvField('a\rb', ',', false)).toBe('"a\rb"');
    expect(csvField('a\nb', ',', false)).toBe('"a\nb"');
  });

  it('quotes a field with a space at its start or at its end, and not one with a space inside', () => {
    expect(csvField(' a', ',', false)).toBe('" a"');
    expect(csvField('a ', ',', false)).toBe('"a "');
    expect(csvField('a b', ',', false)).toBe('a b');
  });

  it('doubles every quote inside a quoted field', () => {
    expect(csvField('say "hi" "now"', ',', false)).toBe('"say ""hi"" ""now"""');
  });

  it('quotes by the separator it is given: a comma needs no quotes with ; or a tab', () => {
    expect(csvField('1,5', ';', false)).toBe('1,5');
    expect(csvField('1;5', ';', false)).toBe('"1;5"');
    expect(csvField('1,5', '\t', false)).toBe('1,5');
    expect(csvField('a\tb', '\t', false)).toBe('"a\tb"');
    expect(csvField('a;b', ',', false)).toBe('a;b');
  });

  it('puts a quote before a guarded field that starts with = + - @ tab or CR', () => {
    expect(csvField('=1+1', ',', true)).toBe("'=1+1");
    expect(csvField('+1', ',', true)).toBe("'+1");
    expect(csvField('-1', ',', true)).toBe("'-1");
    expect(csvField('@sum', ',', true)).toBe("'@sum");
    expect(csvField('\tx', ',', true)).toBe("'\tx");
    // A CR is a reason to quote as well.
    expect(csvField('\rx', ',', true)).toBe('"\'\rx"');
  });

  it('leaves an unguarded field that starts with them as it is: a negative number stays one', () => {
    expect(csvField('-12', ',', false)).toBe('-12');
    expect(csvField('=1', ',', false)).toBe('=1');
  });

  it('does not touch a guarded field that only holds them inside', () => {
    expect(csvField('a=1', ',', true)).toBe('a=1');
  });

  it('quotes a guarded field that needs both: the quote first, then the quotes around it', () => {
    expect(csvField('=a,b', ',', true)).toBe('"\'=a,b"');
    expect(csvField('-"x"', ',', true)).toBe('"\'-""x"""');
  });
});

describe('toCsv', () => {
  it('writes the heading row and a record for each row, every record ended with CRLF', () => {
    expect(
      csv([
        { a: 'x', n: '1' },
        { a: 'y', n: '2' },
      ]),
    ).toBe('A,N\r\nx,1\r\ny,2\r\n');
  });

  it('ends the last record with CRLF too, and gives the heading alone for no row', () => {
    expect(csv([{ a: 'x', n: '1' }])).toMatch(/\r\n$/);
    expect(csv([])).toBe('A,N\r\n');
  });

  it('puts the BOM first when it is asked for, and not otherwise', () => {
    expect(csv([], { bom: true })).toBe(`${BOM}A,N\r\n`);
    expect(csv([], { bom: false })).toBe('A,N\r\n');
  });

  it('joins the fields with the separator it is given', () => {
    expect(csv([{ a: 'x', n: '1,5' }], { separator: ';' })).toBe('A;N\r\nx;1,5\r\n');
    expect(csv([{ a: 'x', n: '1' }], { separator: '\t' })).toBe('A\tN\r\nx\t1\r\n');
  });

  it('guards a guarded column and leaves an unguarded one, when escapeFormulas is on', () => {
    expect(csv([{ a: '=1+1', n: '-12' }])).toBe("A,N\r\n'=1+1,-12\r\n");
  });

  it('guards nothing when escapeFormulas is off', () => {
    expect(csv([{ a: '=1+1', n: '-12' }], { escapeFormulas: false })).toBe('A,N\r\n=1+1,-12\r\n');
  });

  it('writes and guards the headings as it does a field', () => {
    const columns: CsvColumn<Row>[] = [
      { caption: '=HYPERLINK("x")', text: (row) => row.a, guard: false },
      { caption: 'Total, VND', text: (row) => row.n, guard: false },
    ];
    expect(csv([], {}, columns)).toBe('"\'=HYPERLINK(""x"")","Total, VND"\r\n');
    expect(csv([], { escapeFormulas: false }, columns)).toBe(
      '"=HYPERLINK(""x"")","Total, VND"\r\n',
    );
  });

  it('writes a CSV of no column as the BOM alone, or as nothing', () => {
    expect(csv([{ a: 'x', n: '1' }], { bom: true }, [])).toBe(BOM);
    expect(csv([{ a: 'x', n: '1' }], { bom: false }, [])).toBe('');
  });

  it('reads each field once, row by row, in the order of the columns', () => {
    const seen: string[] = [];
    const columns: CsvColumn<Row>[] = [
      { caption: 'N', text: (row) => (seen.push(`n${row.n}`), row.n), guard: false },
      { caption: 'A', text: (row) => (seen.push(`a${row.a}`), row.a), guard: true },
    ];
    csv(
      [
        { a: 'x', n: '1' },
        { a: 'y', n: '2' },
      ],
      {},
      columns,
    );
    expect(seen).toEqual(['n1', 'ax', 'n2', 'ay']);
  });
});
