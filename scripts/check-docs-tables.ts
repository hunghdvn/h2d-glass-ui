// Fails when a Markdown table of an MDX page was built as plain text. MDX does not read the tables of
// GitHub-flavoured Markdown on its own: without remark-gfm the pipes of a props table end up in a
// paragraph, and nothing else in the build notices. A table that is read leaves no delimiter row
// (`| --- |`) in the output, so one found in the built docs is a table shown as text.
// Run after `pnpm build-storybook`.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ASSETS = join('storybook-static', 'assets');
// The row under a table's heading: pipes around cells of three or more dashes, with optional colons.
const DELIMITER_ROW = /\|\s*:?-{3,}:?\s*\|/;

let files: string[];
try {
  files = readdirSync(ASSETS).filter((name) => name.endsWith('.js'));
} catch {
  console.error(`No ${ASSETS}: run \`pnpm build-storybook\` first.`);
  process.exit(1);
}

const broken: string[] = [];
for (const name of files) {
  const text = readFileSync(join(ASSETS, name), 'utf8');
  const match = DELIMITER_ROW.exec(text);
  if (!match) continue;
  // The page's own words near the row, so the message says which page it is.
  const start = Math.max(0, match.index - 120);
  const near = text.slice(start, match.index).replace(/\s+/g, ' ').slice(-80);
  broken.push(`${name}: …${near}${match[0]}`);
}

if (broken.length > 0) {
  console.error(
    `Markdown tables built as text in ${broken.length} file(s) of the docs (is remark-gfm set up in .storybook/main.ts?):\n${broken.join('\n')}`,
  );
  process.exit(1);
}
console.log(`Docs tables: no table built as text in ${files.length} files.`);
