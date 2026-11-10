import { mkdirSync, writeFileSync } from 'node:fs';
import { buildAppShellCss } from './lib/app-shell-css';
import { buildSimulateCss, buildThemeCss } from './lib/theme-css';

const outDir = 'src/styles/generated';
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/theme.css`, buildThemeCss());
writeFileSync(`${outDir}/simulate.css`, buildSimulateCss());
writeFileSync(`${outDir}/app-shell.css`, buildAppShellCss());
console.log(`Wrote ${outDir}/theme.css, ${outDir}/simulate.css and ${outDir}/app-shell.css`);
