import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

// Spec §7: limits are the first green build's sizes plus 10%. Re-run only to accept a growth on purpose.
interface Entry {
  name: string;
  path: string;
  import?: string;
  limit?: string;
}
const configPath = '.size-limit.json';
const unlimited = (JSON.parse(readFileSync(configPath, 'utf8')) as Entry[]).map((entry) => {
  const copy = { ...entry };
  delete copy.limit;
  return copy;
});
writeFileSync(configPath, `${JSON.stringify(unlimited, null, 2)}\n`);
const results = JSON.parse(execSync('pnpm exec size-limit --json', { encoding: 'utf8' })) as Array<{
  name: string;
  size: number;
}>;
const limited = unlimited.map((entry) => {
  const measured = results.find((result) => result.name === entry.name);
  if (!measured) throw new Error(`size-limit did not report "${entry.name}"`);
  return { ...entry, limit: `${Math.ceil(measured.size * 1.1)} B` };
});
writeFileSync(configPath, `${JSON.stringify(limited, null, 2)}\n`);
for (const entry of limited) console.log(`${entry.name}: limit ${entry.limit}`);
