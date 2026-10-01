import { describe, expect, it } from 'vitest';
import { distPathFor, ensureUseClient, hasUseClient, isLibrarySource } from './use-client';

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
