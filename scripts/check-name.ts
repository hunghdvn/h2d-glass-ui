// Fails when the package's old name comes back outside the dated specs and plans under
// docs/superpowers. Code fences in the README and the MDX pages are never compiled, so an import of
// the old name there would ship in the docs without any other check noticing.
import { execFileSync } from 'node:child_process';

// Spelled in parts, so this file does not match itself.
const OLD_NAME = ['fl', 'glass', 'ui'].join('-');

let hits = '';
try {
  hits = execFileSync(
    'git',
    ['grep', '-n', '-I', '-i', '-F', OLD_NAME, '--', '.', ':!docs/superpowers'],
    {
      encoding: 'utf8',
    },
  );
} catch (error) {
  // git grep exits with 1 when nothing matches; anything else is a real failure.
  if ((error as { status?: number }).status !== 1) throw error;
}

if (hits.trim()) {
  console.error(`The old package name "${OLD_NAME}" is back. Use "h2d-glass-ui":\n${hits}`);
  process.exit(1);
}
console.log(`check:name: no "${OLD_NAME}" outside docs/superpowers.`);
