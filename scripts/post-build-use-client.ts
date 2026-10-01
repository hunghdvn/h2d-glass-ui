import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { distPathFor, ensureUseClient, hasUseClient, librarySources } from './lib/use-client';

// tsdown may drop module directives; make sure every client module keeps "use client".
let patched = 0;
for (const file of librarySources(readdirSync('src', { recursive: true, encoding: 'utf8' }))) {
  if (!hasUseClient(readFileSync(file, 'utf8'))) continue;
  const out = distPathFor(file);
  if (!existsSync(out)) throw new Error(`Missing build output for client module ${file}: ${out}`);
  const code = readFileSync(out, 'utf8');
  const next = ensureUseClient(code);
  if (next !== code) {
    writeFileSync(out, next);
    patched += 1;
  }
}
console.log(`use client: ${patched} file(s) patched.`);
