import browserslist from 'browserslist';
import { browserslistToTargets, bundle } from 'lightningcss';
import { mkdirSync, writeFileSync } from 'node:fs';

const { code, warnings } = bundle({
  filename: 'src/styles/index.css',
  minify: true,
  targets: browserslistToTargets(browserslist()),
});
for (const warning of warnings) console.warn(`lightningcss: ${warning.message}`);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/styles.css', code);
console.log(`Wrote dist/styles.css (${code.length} bytes)`);
