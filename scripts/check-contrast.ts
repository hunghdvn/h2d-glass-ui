import * as values from '../src/styles/theme/values';
import { KNOWN_EXCEPTIONS } from './contrast-exceptions';
import { evaluate } from './lib/contrast';
import type { Finding } from './lib/contrast';

const explain = (f: Finding): string => {
  const where = `${f.theme}/${f.mode} ${f.check} = ${f.measured.toFixed(2)}`;
  if (f.kind === 'exception-worse') {
    return `${where} is worse than the recorded ${f.exception?.recorded} (spec §4.9 row ${f.exception?.row}).`;
  }
  if (f.kind === 'exception-stale') {
    return `${where} now meets ${f.threshold}:1. Remove spec §4.9 row ${f.exception?.row} from scripts/contrast-exceptions.ts and the spec.`;
  }
  return `${where} is below ${f.threshold}:1. Tune a token marked "(outside mockup)" in values.ts; mockup tokens change only with the owner's approval.`;
};

const { rows, findings } = evaluate(values, KNOWN_EXCEPTIONS);
for (const row of rows) {
  console.log(
    `${row.status.padEnd(16)}${row.theme.padEnd(6)}${row.mode.padEnd(14)}${row.check.padEnd(22)}${row.measured.toFixed(2)} (min ${row.threshold})`,
  );
}
if (findings.length > 0) {
  console.error(`\n${findings.length} contrast problem(s):`);
  for (const finding of findings) console.error(`- ${explain(finding)}`);
  process.exit(1);
}
console.log('\nContrast check passed.');
