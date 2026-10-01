import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { distPathFor, hasUseClient, librarySources } from './lib/use-client';

/** Spec §6.2: the modules that must be client components. Plan 2 adds entries as components land. */
const CLIENT_MODULES: readonly string[] = [
  'src/components/button/Button.tsx',
  'src/components/icon-button/IconButton.tsx',
];

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
  } else if (expected) {
    problems.push(`${out}: missing build output for a client module.`);
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
