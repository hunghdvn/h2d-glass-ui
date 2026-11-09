// Installs the packed library into each fixture app, builds the app, then loads it in Chromium in
// production and in development mode. Fails on any console error or warning, any library warning
// in the server output, a missing component, or a broken interaction (spec §7, "Fixtures").
// Run `pnpm build` first. Usage: node scripts/test-fixtures.mjs [vite] [next]
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(import.meta.dirname, '..');
const FIXTURES = join(ROOT, 'fixtures');
// The package name, from package.json: the tarball, its install path and the warning prefix follow it.
const NAME = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).name;
const IS_WINDOWS = process.platform === 'win32';

const APPS = {
  vite: {
    dir: 'vite-app',
    steps: [['typecheck'], ['build']],
    // Vite listens on one address of the host it is given. Inside the Playwright container CI uses,
    // `localhost` also names ::1, and Vite listened there while the check below never reached it,
    // so the host is an address. Next.js listens on every interface, so `localhost` is fine there.
    servers: [
      {
        mode: 'production',
        bin: 'node_modules/vite/bin/vite.js',
        args: ['preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'],
        url: 'http://127.0.0.1:4173/',
      },
      {
        mode: 'development',
        bin: 'node_modules/vite/bin/vite.js',
        args: ['--host', '127.0.0.1', '--port', '5173', '--strictPort'],
        url: 'http://127.0.0.1:5173/',
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
  '.flg-toaster',
  '.flg-slider',
  '.flg-number-input',
  '.flg-segmented',
  '.flg-combobox',
  '.flg-tag-input',
  '.flg-file-upload',
  '.flg-calendar',
  '.flg-date-picker',
  '.flg-alert',
  '.flg-progress',
  '.flg-skeleton',
  '.flg-stepper',
  '.flg-list',
  '.flg-table-frame',
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
  const isTarball = (file) => file.startsWith(`${NAME}-`) && file.endsWith('.tgz');
  for (const name of readdirSync(FIXTURES).filter(isTarball)) rmSync(join(FIXTURES, name));
  run('pnpm', ['pack', '--pack-destination', 'fixtures'], ROOT);
  const tarball = readdirSync(FIXTURES).find(isTarball);
  if (!tarball) throw new Error('pnpm pack wrote no tarball.');
  renameSync(join(FIXTURES, tarball), join(FIXTURES, `${NAME}.tgz`));
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
  await checkInputs(page, problems);
  await checkDataDisplay(page, problems);
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
  // Plan E1: a toast shown while the Dialog is open moves into it, can be clicked, and leaves the
  // Dialog and what was typed in it as they were.
  const name = dialog.getByRole('textbox', { name: 'Name' });
  await name.fill('Minh Anh');
  await dialog.getByRole('button', { name: 'Notify' }).click();
  const toasts = dialog.getByRole('region', { name: 'Notifications (F8)' });
  await toasts.getByText('Profile saved').waitFor({ timeout: 60_000 });
  await toasts.getByRole('button', { name: 'Dismiss notification' }).click();
  await toasts.getByText('Profile saved').waitFor({ state: 'detached', timeout: 60_000 });
  if (!(await dialog.evaluate((el) => el.open))) problems.push('closing a toast closed the Dialog');
  if ((await name.inputValue()) !== 'Minh Anh') problems.push('the Dialog lost what was typed');
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

  // The Next fixture gives Pagination links through next/link (Plan E2): a click moves the page and
  // the address without loading the document again, which a value kept on `window` shows.
  const page6 = page.locator('.flg-pagination [aria-label="Page 6"]');
  const isLink = (await page6.evaluate((el) => el.tagName)) === 'A';
  await page.evaluate(() => (window.keptAcrossPageClick = true));
  await page6.click();
  if ((await page6.getAttribute('aria-current')) !== 'page') {
    problems.push('Pagination did not move to the page clicked');
  }
  if (isLink) {
    await page.waitForURL(/[?&]page=6$/);
    if (!(await page.evaluate(() => window.keptAcrossPageClick))) {
      problems.push('a Pagination link click loaded the document again instead of the router');
    }
  }
}

/** Phase 3: the eight inputs take real input, and the form delivers what was set. */
async function checkInputs(page, problems) {
  const form = page.getByRole('form', { name: 'Booking' });
  // Slider: arrow keys move each thumb of the range from 20 to 25 and from 80 to 75.
  const minimum = form.getByRole('slider', { name: 'Minimum' });
  await minimum.focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  const maximum = form.getByRole('slider', { name: 'Maximum' });
  await maximum.focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft');
  // NumberInput: arrow keys step from 2 to 4.
  await form.getByRole('spinbutton', { name: 'Guests' }).focus();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await form.getByRole('radio', { name: 'List' }).click();
  // Combobox: typing filters the list; typing never highlights, so ArrowDown does, and Enter picks it.
  const city = form.getByRole('combobox', { name: 'City' });
  await city.click();
  await page.keyboard.type('Hu');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  // TagInput: Enter turns the typed text into a tag.
  await form.getByRole('textbox', { name: 'Tags' }).click();
  await page.keyboard.type('alpha');
  await page.keyboard.press('Enter');
  await page.keyboard.type('beta');
  await page.keyboard.press('Enter');
  await form.locator('.flg-file-upload input[type="file"]').setInputFiles([
    { name: 'one.txt', mimeType: 'text/plain', buffer: Buffer.from('one') },
    { name: 'two.txt', mimeType: 'text/plain', buffer: Buffer.from('two') },
  ]);
  // DatePicker: the date is typed in the order of its locale (en-US) and committed with Tab (Enter would also submit the form).
  await form.getByRole('textbox', { name: 'Check-in' }).click();
  await page.keyboard.type('11/14/2026');
  await page.keyboard.press('Tab');
  const output = page.getByTestId('submitted');
  if ((await output.textContent()) !== '') problems.push('the form was submitted too early');

  await form.getByRole('button', { name: 'Book' }).click();
  await page.waitForFunction(
    () => document.querySelector('[data-testid="submitted"]')?.textContent,
    undefined,
    { timeout: 30_000 },
  );
  const received = JSON.parse((await output.textContent()) ?? '{}');
  const expected = {
    budget: ['25', '75'],
    guests: ['4'],
    view: ['list'],
    city: ['hue'],
    tags: ['alpha', 'beta'],
    files: ['one.txt', 'two.txt'],
    checkIn: ['2026-11-14'],
  };
  // The Server Action answers a string for the single values, the browser one array for each.
  for (const [key, value] of Object.entries(expected)) {
    const got = [received[key]].flat();
    if (got.join('|') !== value.join('|')) {
      problems.push(
        `the form delivered ${key} = ${JSON.stringify(received[key])}, expected ${JSON.stringify(value)}`,
      );
    }
  }
}

/** Phase 4: the data display. Its parts take real input, and the Table frame follows the page's width. */
async function checkDataDisplay(page, problems) {
  const section = page.getByRole('region', { name: 'Data display' });
  // Every step of the clickable Stepper is there after hydration.
  const stepper = section.getByRole('list', { name: 'Client progress' });
  if ((await stepper.getByRole('listitem').count()) !== 4) {
    problems.push('the clickable Stepper does not have its four steps after hydration');
  }

  // Pressing a done step makes it the current one.
  const details = stepper.getByRole('button', { name: /Details/ });
  await details.click();
  if ((await details.getAttribute('aria-current')) !== 'step') {
    problems.push('pressing a done step did not make it the current step');
  }

  // Pressing a sort button sorts the column: `aria-sort` appears on it and flips on the next press.
  const total = section.getByRole('columnheader', { name: 'Total' });
  await total.getByRole('button').click();
  if ((await total.getAttribute('aria-sort')) !== 'ascending') {
    problems.push('pressing the sort button did not set aria-sort="ascending"');
  }
  await total.getByRole('button').click();
  if ((await total.getAttribute('aria-sort')) !== 'descending') {
    problems.push('pressing the sort button again did not set aria-sort="descending"');
  }

  // A row of a List with onSelect reports its press.
  await section.getByRole('button', { name: 'Open profile' }).click();
  if ((await page.getByTestId('chosen').textContent()) !== 'profile') {
    problems.push('pressing a List row with onSelect did not call it');
  }

  // The frame of a table is a plain box while the table fits and a named region once it does not,
  // and it is judged again when the page changes width.
  const frames = section.locator('.flg-table-frame');
  const regions = () => section.locator('.flg-table-frame[role="region"]').count();
  const frameCount = await frames.count();
  if ((await regions()) !== 0) problems.push('a table frame is a region while its table fits');
  await page.setViewportSize({ width: 200, height: 800 });
  await section
    .locator('.flg-table-frame[role="region"]')
    .first()
    .waitFor({ timeout: 10_000 })
    .catch(() => undefined);
  if ((await regions()) !== frameCount) {
    problems.push('the table frames did not become regions when the page got narrow');
  }
  await page.setViewportSize({ width: 1280, height: 720 });

  // The close button removes the Alert. It goes last: the Alert is above the rest of the client
  // part, and its removal moves them.
  const alert = section.locator('.flg-alert[data-status="warning"]');
  await alert.getByRole('button', { name: 'Dismiss', exact: true }).click();
  if ((await alert.count()) !== 0) problems.push('the close button did not remove the Alert');
}

async function testApp(name, browser) {
  const app = APPS[name];
  const cwd = join(FIXTURES, app.dir);
  rmSync(join(cwd, 'node_modules', NAME), { recursive: true, force: true });
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
      // Phase 4: the Server Components of the page render the data display into the HTML, and the
      // Stepper written in a Client Component has every step in it, since it is rendered there too.
      if (app.serverRendered) {
        const client =
          /<ol(?=[^>]*aria-label="Client progress")[\s\S]*?<\/ol>/.exec(html)?.[0] ?? '';
        const found = {
          'role="progressbar"': html.includes('role="progressbar"'),
          '<ol class="flg-stepper"': /<ol[^>]*class="flg-stepper"/.test(html),
          '<table class="flg-table"': html.includes('<table class="flg-table"'),
          'every step of the clickable Stepper': ['Details', 'Review', 'Confirm', 'Finish'].every(
            (title) => client.includes(title),
          ),
        };
        for (const [what, present] of Object.entries(found)) {
          if (!present) problems.push(`${label}: the server HTML lacks ${what}`);
        }
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
      if (line.includes(`[${NAME}]`) || /Warning:|Error:/.test(line)) {
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
