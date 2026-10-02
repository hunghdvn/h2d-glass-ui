import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { distPathFor, hasUseClient, librarySources } from './lib/use-client';

/** Spec §6.2: the modules that must be client components. */
const CLIENT_MODULES: readonly string[] = [
  'src/components/button/Button.tsx',
  'src/components/icon-button/IconButton.tsx',
  'src/components/avatar/Avatar.tsx',
  'src/components/field/Field.tsx',
  'src/components/input/Input.tsx',
  'src/components/textarea/Textarea.tsx',
  'src/components/checkbox/Checkbox.tsx',
  'src/components/radio-group/RadioGroup.tsx',
  'src/components/radio-group/Radio.tsx',
];

/**
 * Modules tsdown must emit: everything reachable from src/index.ts lives under these paths.
 * Re-export-only `index.ts` barrels are inlined by tsdown, so they have no build output of their own.
 */
const isShipped = (file: string) =>
  file === 'src/index.ts' ||
  ((file.startsWith('src/components/') || file.startsWith('src/internal/')) &&
    !file.endsWith('/index.ts'));

const files = librarySources(readdirSync('src', { recursive: true, encoding: 'utf8' }));
const problems: string[] = [];
for (const file of files) {
  const expected = CLIENT_MODULES.includes(file);
  if (hasUseClient(readFileSync(file, 'utf8')) !== expected) {
    problems.push(`${file}: "use client" must be ${expected ? 'present' : 'absent'} (spec §6.2).`);
  }
  const out = distPathFor(file);
  if (existsSync(out)) {
    if (hasUseClient(readFileSync(out, 'utf8')) !== expected) {
      problems.push(
        `${out}: "use client" must be ${expected ? 'present' : 'absent'} in the build.`,
      );
    }
  } else if (expected || isShipped(file)) {
    problems.push(`${out}: missing build output${expected ? ' for a client module' : ''}.`);
  }
}
for (const listed of CLIENT_MODULES) {
  if (!files.includes(listed)) problems.push(`${listed}: listed in CLIENT_MODULES but not found.`);
}
if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`use client: ${files.length} module(s) checked, ${CLIENT_MODULES.length} client.`);
