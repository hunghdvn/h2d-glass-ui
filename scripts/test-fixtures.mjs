// Installs the packed library into each fixture app, builds the app, then loads it in Chromium in
// production and in development mode. Fails on any console error or warning, any library warning
// in the server output, a missing component, or a broken interaction (spec §7, "Fixtures").
// Run `pnpm build` first. Usage: node scripts/test-fixtures.mjs [vite] [next]
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(import.meta.dirname, '..');
const FIXTURES = join(ROOT, 'fixtures');
const IS_WINDOWS = process.platform === 'win32';

const APPS = {
  vite: {
    dir: 'vite-app',
    steps: [['typecheck'], ['build']],
    servers: [
      {
        mode: 'production',
        bin: 'node_modules/vite/bin/vite.js',
        args: ['preview', '--port', '4173', '--strictPort'],
        url: 'http://localhost:4173/',
      },
      {
        mode: 'development',
        bin: 'node_modules/vite/bin/vite.js',
        args: ['--port', '5173', '--strictPort'],
        url: 'http://localhost:5173/',
      },
    ],
  },
  next: {
    dir: 'next-app',
    steps: [['build']],
    // The page is a Server Component: its HTML must already name the RadioGroup with a span label.
    serverRendered: true,
    servers: [
      {
        mode: 'production',
        bin: 'node_modules/next/dist/bin/next',
        args: ['start', '-p', '3100'],
        url: 'http://localhost:3100/',
      },
      {
        mode: 'development',
        bin: 'node_modules/next/dist/bin/next',
        args: ['dev', '-p', '3101'],
        url: 'http://localhost:3101/',
      },
    ],
  },
};

/** One element per phase 1 component (spec §6.3), as the page renders it. */
const COMPONENTS = [
  '.flg-surface',
  '.flg-card',
  '.flg-button:not([data-icon-only])',
  '.flg-button[data-icon-only]',
  '.flg-badge',
  '.flg-avatar',
  '.flg-divider',
  '.flg-spinner',
  '.flg-field',
  '.flg-input',
  '.flg-textarea',
  '.flg-checkbox',
  '.flg-radio-group',
  '.flg-switch',
];

function run(command, args, cwd) {
  console.log(`$ ${command} ${args.join(' ')}   (${cwd})`);
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: IS_WINDOWS });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with ${result.status}`);
  }
}

function packLibrary() {
  if (!existsSync(join(ROOT, 'dist', 'index.js'))) {
    throw new Error('dist/ is missing: run `pnpm build` first.');
  }
  const isTarball = (name) => /^fl-glass-ui-.+\.tgz$/.test(name);
  for (const name of readdirSync(FIXTURES).filter(isTarball)) rmSync(join(FIXTURES, name));
  run('pnpm', ['pack', '--pack-destination', 'fixtures'], ROOT);
  const tarball = readdirSync(FIXTURES).find(isTarball);
  if (!tarball) throw new Error('pnpm pack wrote no tarball.');
  renameSync(join(FIXTURES, tarball), join(FIXTURES, 'fl-glass-ui.tgz'));
}

function startServer(cwd, server) {
  const child = spawn(process.execPath, [server.bin, ...server.args], {
    cwd,
    detached: !IS_WINDOWS,
    env: { ...process.env, NODE_ENV: undefined, BROWSER: 'none', NEXT_TELEMETRY_DISABLED: '1' },
  });
  let output = '';
  child.stdout.on('data', (chunk) => (output += chunk));
  child.stderr.on('data', (chunk) => (output += chunk));
  return {
    output: () => output,
    stop() {
      if (IS_WINDOWS) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F']);
      else process.kill(-child.pid, 'SIGTERM');
    },
  };
}

async function isAnswering(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

async function fetchWhenReady(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.text();
    } catch {
      // Not listening yet.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error(`${url} did not answer within ${timeoutMs / 1000}s.`);
}

async function checkPage(browser, url) {
  const problems = [];
  const page = await browser.newPage();
  page.on('console', (message) => {
    if (message.type() !== 'error' && message.type() !== 'warning') return;
    // The broken-avatar case requests a file that does not exist on purpose.
    if (message.location().url.endsWith('/missing.png')) return;
    // Chromium's GPU driver notes about rendering the glass, not the page's own output.
    if (message.text().includes('GL Driver Message')) return;
    problems.push(`console.${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
  try {
    await inspect(page, url, problems);
  } catch (error) {
    // Keep what the console said: it usually explains why the page never got ready.
    problems.push(error instanceof Error ? error.message.split('\n')[0] : String(error));
  }
  await page.close();
  return problems;
}

async function inspect(page, url, problems) {
  await page.goto(url);
  await page.locator('[data-hydrated]').waitFor({ timeout: 60_000 });
  await page.waitForLoadState('networkidle');

  for (const selector of COMPONENTS) {
    if ((await page.locator(selector).count()) === 0) problems.push(`missing ${selector}`);
  }
  for (const name of ['Plan', 'Billing period']) {
    if ((await page.getByRole('radiogroup', { name }).count()) !== 1) {
      problems.push(`the "${name}" RadioGroup did not get its name from the Field`);
    }
  }
  const statuses = await page
    .locator('.flg-avatar')
    .evaluateAll((avatars) => avatars.map((avatar) => avatar.getAttribute('data-status')));
  if (statuses.join() !== 'loaded,error,loaded') {
    problems.push(`avatar states are ${statuses.join()}, expected loaded,error,loaded`);
  }

  const all = page.getByRole('checkbox', { name: 'All channels' });
  if (!(await all.evaluate((input) => input.indeterminate))) {
    problems.push('"All channels" is not indeterminate');
  }
  await all.click();
  if (!(await all.isChecked())) problems.push('"All channels" did not check');
  const yearly = page.getByRole('radio', { name: 'Yearly' });
  await yearly.click();
  if (!(await yearly.isChecked())) problems.push('"Yearly" did not get selected');
}

async function testApp(name, browser) {
  const app = APPS[name];
  const cwd = join(FIXTURES, app.dir);
  rmSync(join(cwd, 'node_modules', 'fl-glass-ui'), { recursive: true, force: true });
  run('npm', ['install', '--no-package-lock', '--no-audit', '--no-fund'], cwd);
  for (const step of app.steps) run('npm', ['run', ...step], cwd);

  const problems = [];
  for (const server of app.servers) {
    const label = `${name} (${server.mode})`;
    console.log(`\n▶ ${label}: ${server.url}`);
    // Another server on the port would answer in place of the fixture and fail the check obscurely.
    if (await isAnswering(server.url)) throw new Error(`${server.url} is already in use.`);
    const running = startServer(cwd, server);
    try {
      const html = await fetchWhenReady(server.url);
      if (app.serverRendered && !/<span[^>]*class="flg-field-label"[^>]*>Plan</.test(html)) {
        problems.push(`${label}: the server HTML labels the Plan RadioGroup with <label for>`);
      }
      for (const problem of await checkPage(browser, server.url)) {
        problems.push(`${label}: ${problem}`);
      }
    } finally {
      running.stop();
    }
    for (const line of running.output().split('\n')) {
      if (/\[fl-glass-ui\]|Warning:|Error:/.test(line)) {
        problems.push(`${label} server: ${line.trim()}`);
      }
    }
  }
  return problems;
}

const names = process.argv.slice(2).length > 0 ? process.argv.slice(2) : Object.keys(APPS);
for (const name of names) if (!(name in APPS)) throw new Error(`Unknown fixture "${name}".`);

packLibrary();
const browser = await chromium.launch();
const problems = [];
try {
  for (const name of names) problems.push(...(await testApp(name, browser)));
} finally {
  await browser.close();
}
if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  process.exit(1);
}
console.log(`\nFixtures OK: ${names.join(', ')}.`);
