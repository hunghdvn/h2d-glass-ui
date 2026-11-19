import ts from 'typescript';

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

/**
 * Modules tsdown must emit: everything reachable from src/index.ts lives under these paths.
 * Re-export-only `index.ts` barrels are inlined by tsdown, so they have no build output of their own.
 */
const isShipped = (file: string) =>
  file === 'src/index.ts' ||
  ((file.startsWith('src/components/') || file.startsWith('src/internal/')) &&
    !file.endsWith('/index.ts'));

/**
 * Whether a module emits no JavaScript: TypeScript, which only erases the types, writes nothing for
 * it but `export {}` (or `"use strict"` for a file that is no module). Such a module has its
 * declarations in the build and no `.js`; any other module must have its `.js`. Decided from the
 * source, and not from what the build wrote, so a module of code that the build stopped emitting
 * is still caught.
 */
export function emitsNoJavaScript(code: string, fileName: string): boolean {
  const { outputText } = ts.transpileModule(code, {
    fileName,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      isolatedModules: true,
      removeComments: true,
    },
  });
  const nothing = /^\s*(?:export\s*\{\s*\}|(['"])use strict\1)\s*;?\s*$/gm;
  return outputText.replace(nothing, '').trim() === '';
}

/** What the check reads of the sources and of the build: the file system, or a fixture. */
export interface UseClientFiles {
  read(file: string): string;
  exists(file: string): boolean;
}

/**
 * The problems of the client boundary (spec §6.2): a module whose `"use client"` is not what
 * `clientModules` says, in the source or in the build, a shipped module with no build output, and
 * a listed module that is not there. An empty list is a pass.
 */
export function clientBoundaryProblems(
  files: readonly string[],
  clientModules: readonly string[],
  { read, exists }: UseClientFiles,
): string[] {
  const problems: string[] = [];
  for (const file of files) {
    const expected = clientModules.includes(file);
    if (hasUseClient(read(file)) !== expected) {
      problems.push(
        `${file}: "use client" must be ${expected ? 'present' : 'absent'} (spec §6.2).`,
      );
    }
    const out = distPathFor(file);
    if (exists(out)) {
      if (hasUseClient(read(out)) !== expected) {
        problems.push(
          `${out}: "use client" must be ${expected ? 'present' : 'absent'} in the build.`,
        );
      }
    } else if (expected || (isShipped(file) && !emitsNoJavaScript(read(file), file))) {
      problems.push(`${out}: missing build output${expected ? ' for a client module' : ''}.`);
    } else if (isShipped(file)) {
      // A module of types only has no JavaScript, and its declarations are what it ships.
      const declarations = out.replace(/\.js$/, '.d.ts');
      if (!exists(declarations)) {
        problems.push(`${declarations}: missing declarations for a module of types only.`);
      }
    }
  }
  for (const listed of clientModules) {
    if (!files.includes(listed))
      problems.push(`${listed}: listed in CLIENT_MODULES but not found.`);
  }
  return problems;
}
