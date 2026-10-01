import { mkdirSync, writeFileSync } from 'node:fs';
import { buildSimulateCss, buildThemeCss } from './lib/theme-css';

const outDir = 'src/styles/generated';
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/theme.css`, buildThemeCss());
writeFileSync(`${outDir}/simulate.css`, buildSimulateCss());
console.log(`Wrote ${outDir}/theme.css and ${outDir}/simulate.css`);
