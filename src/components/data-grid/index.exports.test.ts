import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// This file checks the grid's types file against the grid's index; `src/index.test.ts` checks the grid's index
// against the package root.
//
// The types of the public API are all exported (spec phase 6 §6.3): an app can name the type of every prop, of
// every column field, of the handle and of the two contexts. Decided from the sources, never from a list kept by
// hand, so a type added later without an export fails here. `DataGridColumnBase` is the one deliberate exception:
// it is the shared part of the two column types and an app writes `DataGridColumn`.

const types = readFileSync('src/components/data-grid/types.ts', 'utf8');
const index = readFileSync('src/components/data-grid/index.ts', 'utf8');

const NOT_EXPORTED = ['DataGridColumnBase'];

/** Every `export interface X` and `export type X` of `types.ts`, with the text of its declaration. */
const declarations = new Map<string, string>();
const heads = [...types.matchAll(/^export (?:interface|type) (\w+)/gm)];
heads.forEach((head, at) => {
  const end = heads[at + 1]?.index ?? types.length;
  declarations.set(head[1]!, types.slice(head.index, end));
});

/** The names `index.ts` exports from `./types`. */
const exported = new Set(
  [...index.matchAll(/export type \{([^}]*)\} from '\.\/types'/g)].flatMap((block) =>
    block[1]!
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean),
  ),
);

/** The `DataGrid…` names a declaration mentions, comments out (a comment names things it does not use). */
function mentions(name: string): string[] {
  const code = declarations
    .get(name)!
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  return [...new Set(code.match(/\bDataGrid\w*/g))].filter(
    (other) => other !== name && declarations.has(other),
  );
}

describe('the types of the data grid', () => {
  it('reads the declarations it is about (a sanity check of the parse)', () => {
    expect(declarations.size).toBeGreaterThan(30);
    expect(declarations.has('DataGridProps')).toBe(true);
    expect(exported.has('DataGridProps')).toBe(true);
  });

  it('exports every type that types.ts exports, but the deliberate ones', () => {
    const missing = [...declarations.keys()].filter(
      (name) => !exported.has(name) && !NOT_EXPORTED.includes(name),
    );
    expect(missing).toEqual([]);
    for (const name of NOT_EXPORTED) expect(exported.has(name)).toBe(false);
  });

  it('exports every type that the props, the handle, the columns and the contexts name', () => {
    const roots = [
      'DataGridProps',
      'DataGridHandle',
      'DataGridColumn',
      'DataGridCellContext',
      'DataGridEditorContext',
    ];
    const reached = new Set<string>();
    const walk = (name: string) => {
      if (reached.has(name)) return;
      reached.add(name);
      mentions(name).forEach(walk);
    };
    roots.forEach(walk);
    // The walk must really have walked: the column types and the labels are behind the props.
    expect(reached.has('DataGridFieldColumn')).toBe(true);
    expect(reached.has('DataGridLabelsInput')).toBe(true);
    const unreachable = [...reached].filter(
      (name) => !exported.has(name) && !NOT_EXPORTED.includes(name),
    );
    expect(unreachable).toEqual([]);
  });
});
