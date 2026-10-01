const DIRECTIVE = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*(['"])use client\1/;

export function hasUseClient(code: string): boolean {
  return DIRECTIVE.test(code);
}

export function ensureUseClient(code: string): string {
  return hasUseClient(code) ? code : `"use client";\n${code}`;
}

export function distPathFor(srcFile: string): string {
  return srcFile
    .replace(/\\/g, '/')
    .replace(/^src\//, 'dist/')
    .replace(/\.tsx?$/, '.js');
}

/** Library modules that end up in dist/ (no tests, stories, type tests or docs). */
export function isLibrarySource(file: string): boolean {
  const path = file.replace(/\\/g, '/');
  return (
    /\.tsx?$/.test(path) &&
    !/\.(test|test-d|stories)\.tsx?$/.test(path) &&
    !path.endsWith('.d.ts') &&
    !path.startsWith('src/docs/')
  );
}

export function librarySources(listing: readonly string[]): string[] {
  return listing.map((file) => `src/${file.replace(/\\/g, '/')}`).filter(isLibrarySource);
}
