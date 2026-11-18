import { describe, expect, it } from 'vitest';
import {
  clientBoundaryProblems,
  distPathFor,
  emitsNoJavaScript,
  ensureUseClient,
  hasUseClient,
  isLibrarySource,
} from './use-client';

describe('hasUseClient', () => {
  it.each([
    ['"use client";\nexport {}', true],
    ["'use client'\nexport {}", true],
    ['// leading comment\n/* block */\n"use client";', true],
    ['export {};\n"use client";', false],
    ['"use server";', false],
  ])('detects the directive in %j', (code, expected) => {
    expect(hasUseClient(code)).toBe(expected);
  });
});

describe('ensureUseClient', () => {
  it('prepends the directive once', () => {
    const once = ensureUseClient('export const a = 1;');
    expect(once).toBe('"use client";\nexport const a = 1;');
    expect(ensureUseClient(once)).toBe(once);
  });
});

describe('distPathFor', () => {
  it('maps a source file to its build output', () => {
    expect(distPathFor('src/components/button/Button.tsx')).toBe(
      'dist/components/button/Button.js',
    );
    expect(distPathFor('src\\internal\\slot.tsx')).toBe('dist/internal/slot.js');
  });
});

describe('isLibrarySource', () => {
  it.each([
    ['src/components/surface/Surface.tsx', true],
    ['src/internal/merge-refs.ts', true],
    ['src/components/surface/Surface.test.tsx', false],
    ['src/internal/data-attr.test-d.ts', false],
    ['src/components/surface/Surface.stories.tsx', false],
    ['src/docs/TokenTable.tsx', false],
    ['src/styles/index.css', false],
  ])('classifies %s', (file, expected) => {
    expect(isLibrarySource(file)).toBe(expected);
  });
});

describe('emitsNoJavaScript', () => {
  it.each([
    [
      'interfaces, type aliases and type imports',
      "import type { A } from './a';\nexport type B = A;\ninterface C { b: B }\nexport type { C };",
      true,
    ],
    ['a type re-export', "export type { DataGridKey } from './types';", true],
    ['an import used only as a type', "import { A } from './a';\nexport type B = A[];", true],
    ['nothing', '// a comment\n', true],
    ['a constant', 'export const size = 4;', false],
    [
      'a function next to its types',
      'export type N = number;\nexport function one(): N {\n  return 1;\n}',
      false,
    ],
    ['an enum', 'export enum Side { Left, Right }', false],
    ['a re-export the file cannot tell is a type', "export { A } from './a';", false],
    ['a side-effect import', "import './styles.css';", false],
  ])('%s: %s', (_name, code, expected) => {
    expect(emitsNoJavaScript(code, 'module.ts')).toBe(expected);
  });

  it('reads JSX in a .tsx module as code', () => {
    expect(emitsNoJavaScript('export const A = () => <b />;', 'module.tsx')).toBe(false);
  });
});

describe('clientBoundaryProblems', () => {
  // A build where two modules have their declarations and no JavaScript: one is of types only, and
  // tsdown wrote nothing else for it; the other has code, and tsdown should have written its `.js`.
  const sources: Record<string, string> = {
    'src/components/data-grid/types.ts': [
      "import type { ReactNode } from 'react';",
      'export type Key = string | number;',
      '/** A cell. */',
      'export interface Cell { content: ReactNode; key: Key }',
    ].join('\n'),
    'src/internal/roving.ts':
      'export function next(index: number): number {\n  return index + 1;\n}\n',
    'src/internal/data-attr.ts':
      'export const dataAttr = (on: boolean) => (on ? "" : undefined);\n',
  };
  const built = new Set([
    'dist/components/data-grid/types.d.ts',
    'dist/internal/roving.d.ts',
    'dist/internal/data-attr.d.ts',
    'dist/internal/data-attr.js',
  ]);
  const files = {
    read: (file: string) => sources[file] ?? '',
    exists: (file: string) => file in sources || built.has(file),
  };

  it('fails a module with code whose build has its declarations and no JavaScript', () => {
    const problems = clientBoundaryProblems(Object.keys(sources), [], files);
    expect(problems).toEqual(['dist/internal/roving.js: missing build output.']);
  });

  it('passes a module of types only, which has no JavaScript to emit', () => {
    const problems = clientBoundaryProblems(['src/components/data-grid/types.ts'], [], files);
    expect(problems).toEqual([]);
  });
});
