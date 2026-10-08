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

/** One element per component, as the page renders it (closed overlays are in the DOM too). */
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
  'dialog.flg-dialog',
  '.flg-popover',
  '.flg-tooltip',
  '.flg-menu',
  '.flg-context-menu-trigger',
  '.flg-select',
  '.flg-tabs',
  '.flg-accordion',
  '.flg-breadcrumb',
  '.flg-pagination',
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
      try {
        if (IS_WINDOWS) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F']);
        else process.kill(-child.pid, 'SIGTERM');
      } catch {
        // The server already exited.
      }
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

  await checkOverlays(page, problems);
  await checkMenus(page, problems);
  await checkSelects(page, problems);
  await checkNavigation(page, problems);
}

const hasFocus = (locator) => locator.evaluate((el) => el === document.activeElement);

/** Phase 2: a native modal Dialog, a Drawer, a Popover and a Tooltip open, close and move focus. */
async function checkOverlays(page, problems) {
  const editProfile = page.getByRole('button', { name: 'Edit profile' });
  await editProfile.click();
  const dialog = page.getByRole('dialog', { name: 'Edit profile' });
  await dialog.waitFor();
  if (!(await dialog.evaluate((el) => el.matches(':modal')))) {
    problems.push('the Dialog did not open as a modal');
  }
  if (!(await hasFocus(page.getByRole('textbox', { name: 'Name' })))) {
    problems.push('focus did not move into the Dialog');
  }
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  if (!(await hasFocus(editProfile))) problems.push('focus did not return to the Dialog trigger');

  await page.getByRole('button', { name: 'Invoice' }).click();
  const drawer = page.getByRole('dialog', { name: 'Invoice details' });
  await drawer.waitFor();
  await drawer.getByRole('button', { name: 'Close' }).click();
  await drawer.waitFor({ state: 'hidden' });

  await page.getByRole('button', { name: 'Filters' }).click();
  const filters = page.getByRole('dialog', { name: 'Filters' });
  await filters.waitFor();
  if (!(await hasFocus(page.getByRole('switch', { name: 'Only mine' })))) {
    problems.push('focus did not move into the Popover');
  }
  await page.mouse.click(4, 4);
  await filters.waitFor({ state: 'hidden' });

  await page.getByRole('button', { name: 'Help' }).hover();
  await page.getByRole('tooltip', { name: 'Opens the help center' }).waitFor();
}

/** Phase 2, plan B: a DropdownMenu with a submenu, and a ContextMenu, open and move focus. */
async function checkMenus(page, problems) {
  const actions = page.getByRole('button', { name: 'Actions' });
  await actions.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu', { name: 'Actions' });
  await menu.waitFor();
  if (!(await hasFocus(page.getByRole('menuitem', { name: 'Rename F2' })))) {
    problems.push('focus did not move to the first item of the DropdownMenu');
  }
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  const sub = page.getByRole('menu', { name: 'Move to' });
  await sub.waitFor();
  if (!(await hasFocus(sub.getByRole('menuitem', { name: 'Design' })))) {
    problems.push('focus did not move into the submenu');
  }
  await page.keyboard.press('Escape');
  await sub.waitFor({ state: 'hidden' });
  await page.keyboard.press('Escape');
  await menu.waitFor({ state: 'hidden' });
  if (!(await hasFocus(actions))) problems.push('focus did not return to the DropdownMenu trigger');

  await page.getByText('Right-click report.pdf').click({ button: 'right' });
  const context = page.getByRole('menu', { name: 'report.pdf' });
  await context.waitFor();
  if (!(await hasFocus(context.getByRole('menuitem', { name: 'Open' })))) {
    problems.push('focus did not move to the first item of the ContextMenu');
  }
  await page.keyboard.press('Escape');
  await context.waitFor({ state: 'hidden' });
}

/** Phase 2, plan C: a Select opens from the keyboard, chooses, and is in the form's FormData. */
async function checkSelects(page, problems) {
  const frequency = page.getByRole('combobox', { name: 'Frequency' });
  if (!(await frequency.textContent())?.includes('Weekly')) {
    problems.push('the Select does not show its default value');
  }
  await frequency.focus();
  await page.keyboard.press('ArrowDown');
  const listbox = page.locator('.flg-select-listbox').first();
  await listbox.waitFor();
  if (!(await hasFocus(frequency))) problems.push('focus left the Select trigger when it opened');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await listbox.waitFor({ state: 'hidden' });
  if (!(await frequency.textContent())?.includes('Monthly')) {
    problems.push('choosing an option did not change the Select');
  }
  const data = await page.getByRole('form', { name: 'Schedule' }).evaluate((form) => {
    const formData = new FormData(form);
    return { frequency: formData.get('frequency'), departments: formData.getAll('departments') };
  });
  if (data.frequency !== 'monthly' || data.departments.join() !== 'design') {
    problems.push(`the form data is wrong: ${JSON.stringify(data)}`);
  }
}

/** Phase 2, plan D: Tabs from the keyboard, a single Accordion, Breadcrumb and Pagination. */
async function checkNavigation(page, problems) {
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  if ((await crumbs.locator('[aria-current="page"]').textContent()) !== 'Attachments') {
    problems.push('the Breadcrumb does not mark the current page');
  }

  await page.getByRole('tab', { name: 'Overview' }).focus();
  await page.keyboard.press('ArrowRight');
  const members = page.getByRole('tab', { name: 'Members' });
  if (!(await hasFocus(members)) || (await members.getAttribute('aria-selected')) !== 'true') {
    problems.push('the arrow key did not move to and select the next tab');
  }
  if (!(await page.getByRole('tabpanel', { name: 'Members' }).isVisible())) {
    problems.push('the selected tab did not show its panel');
  }

  // A single Accordion: its items share a name, so the browser closes one as another opens.
  const isOpen = (title) =>
    page.getByText(title).evaluate((summary) => summary.closest('details').open);
  await page.getByText('Can I change plans?').click();
  await page.waitForFunction(
    () => document.querySelectorAll('.flg-accordion details[open]').length === 1,
  );
  if (!(await isOpen('Can I change plans?')) || (await isOpen('Is there a free trial?'))) {
    problems.push('opening an Accordion item did not close the other one');
  }

  const page6 = page.getByRole('button', { name: 'Page 6' });
  await page6.click();
  if ((await page6.getAttribute('aria-current')) !== 'page') {
    problems.push('Pagination did not move to the page clicked');
  }
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
      // The Select reads its items without rendering them: the server HTML already shows the chosen
      // option on the trigger and has the native <option>s.
      if (
        app.serverRendered &&
        !(
          /role="combobox"(?:(?!<\/button>)[\s\S])*Weekly/.test(html) &&
          /<option value="weekly" selected/.test(html)
        )
      ) {
        problems.push(
          `${label}: the server HTML lacks the Select's chosen option or native options`,
        );
      }
      // Breadcrumb renders in the Server Component, and the open Accordion item is open in the HTML.
      if (
        app.serverRendered &&
        !(
          /<nav aria-label="Breadcrumb" class="flg-breadcrumb"/.test(html) &&
          /<details(?=[^>]*\bclass="flg-accordion-item")(?=[^>]*\bopen="")/.test(html)
        )
      ) {
        problems.push(`${label}: the server HTML lacks the Breadcrumb or the open Accordion item`);
      }
      for (const problem of await checkPage(browser, server.url)) {
        problems.push(`${label}: ${problem}`);
      }
    } catch (error) {
      // Keep the server's own output: it usually explains why it never got ready.
      const tail = running.output().split('\n').slice(-30).join('\n');
      problems.push(`${label}: ${error instanceof Error ? error.message : String(error)}\n${tail}`);
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
// A server that ignored SIGTERM must not keep the process alive.
process.exit(0);
