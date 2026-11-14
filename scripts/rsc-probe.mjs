// Renders server-safe modules from dist/ with React's `react-server` build, the build React Server
// Components use. A module that touches hooks or context there fails here.
// Run with: node --conditions=react-server scripts/rsc-probe.mjs
import { register } from 'node:module';
import { createElement } from 'react';

// The modules of dist/ that are client components are not loaded, as a framework's bundler does not
// load them for a Server Component; each export is a client reference instead.
register('./rsc-client-boundary.mjs', import.meta.url);

const FORWARD_REF = Symbol.for('react.forward_ref');
const FRAGMENT = Symbol.for('react.fragment');

/**
 * `clients` are the client references a server component may return (see rsc-client-boundary.mjs).
 * A Server Component does not run them: it hands React the reference, and the client renders it. The
 * probe does the same, and stops at them.
 */
function renderTree(node, clients = new Set()) {
  if (node === null || node === undefined || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map((child) => renderTree(child, clients));
  const { type, props } = node;
  if (clients.has(type)) return node;
  if (typeof type === 'string') {
    return { type, props: { ...props, children: renderTree(props.children, clients) } };
  }
  if (type === FRAGMENT) return renderTree(props.children, clients);
  if (typeof type === 'function') return renderTree(type(props), clients);
  if (type && type.$$typeof === FORWARD_REF) return renderTree(type.render(props, null), clients);
  throw new Error(`Unsupported element type: ${String(type)}`);
}

/**
 * Plan 2 appends the other server-safe components of spec §6.2. A case that returns a client component
 * lists it in `clients` and expects `type: { client: <export name> }`.
 */
const CASES = [
  {
    label: 'Surface',
    file: '../dist/components/surface/Surface.js',
    exportName: 'Surface',
    element: (C) => createElement(C, null, 'x'),
    expect: { type: 'div', className: 'flg-surface' },
  },
  {
    label: 'Surface asChild',
    file: '../dist/components/surface/Surface.js',
    exportName: 'Surface',
    element: (C) =>
      createElement(C, { asChild: true }, createElement('section', { className: 'own' }, 'x')),
    expect: { type: 'section', className: 'flg-surface own' },
  },
  {
    label: 'Spinner',
    file: '../dist/components/spinner/Spinner.js',
    exportName: 'Spinner',
    element: (C) => createElement(C, null),
    expect: { type: 'span', className: 'flg-spinner' },
  },
  {
    label: 'Badge',
    file: '../dist/components/badge/Badge.js',
    exportName: 'Badge',
    element: (C) => createElement(C, null, 'x'),
    expect: { type: 'span', className: 'flg-badge' },
  },
  // An Indicator in each form it can take. The mark is rendered by the probe as React would, so a hook
  // in it fails here; the probe checks the wrapper, and the unit tests the mark.
  ...[
    ['with a count', { count: 3 }],
    ['past max', { count: 120, max: 99 }],
    ['as a dot', { dot: true, status: 'danger' }],
    ['with show false', { count: 3, show: false }],
  ].map(([what, props]) => ({
    label: `Indicator ${what}`,
    file: '../dist/components/indicator/Indicator.js',
    exportName: 'Indicator',
    element: (C) => createElement(C, props, createElement('button', { type: 'button' }, 'Bell')),
    expect: { type: 'span', className: 'flg-indicator' },
  })),
  // A Kbd with children is markup. With `keys` it hands the combination to `KbdKeys`, which knows the
  // platform and is a client component: the probe checks that the reference is there, with the props,
  // and does not run it.
  {
    label: 'Kbd with children',
    file: '../dist/components/kbd/Kbd.js',
    exportName: 'Kbd',
    element: (C) => createElement(C, null, 'Esc'),
    expect: { type: 'kbd', className: 'flg-kbd' },
    check: (tree) => {
      if (tree.props.children !== 'Esc') throw new Error('the children are not the text');
    },
  },
  {
    label: 'Kbd with keys hands them to the client component KbdKeys',
    file: '../dist/components/kbd/Kbd.js',
    exportName: 'Kbd',
    clients: [{ file: '../dist/components/kbd/kbd-keys.js', exportName: 'KbdKeys' }],
    element: (C) =>
      createElement(C, { keys: 'mod+k', className: 'mine', labels: { command: 'C' } }),
    expect: { type: { client: 'KbdKeys' }, className: 'mine' },
    check: (tree) => {
      if (tree.props.keys !== 'mod+k') throw new Error(`keys is ${tree.props.keys}`);
      if (tree.props.labels?.command !== 'C') throw new Error('labels did not pass through');
    },
  },
  {
    label: 'Divider',
    file: '../dist/components/divider/Divider.js',
    exportName: 'Divider',
    element: (C) => createElement(C, null),
    expect: { type: 'hr', className: 'flg-divider' },
  },
  {
    label: 'Divider vertical',
    file: '../dist/components/divider/Divider.js',
    exportName: 'Divider',
    element: (C) => createElement(C, { orientation: 'vertical' }),
    expect: { type: 'div', className: 'flg-divider' },
  },
  {
    label: 'Card',
    file: '../dist/components/card/Card.js',
    exportName: 'Card',
    element: (C) => createElement(C, null, 'x'),
    expect: { type: 'div', className: 'flg-surface flg-card' },
  },
  {
    label: 'CardHeader',
    file: '../dist/components/card/Card.js',
    exportName: 'CardHeader',
    element: (C) => createElement(C, null, 'x'),
    expect: { type: 'div', className: 'flg-card-header' },
  },
  {
    label: 'CardTitle asChild',
    file: '../dist/components/card/Card.js',
    exportName: 'CardTitle',
    element: (C) => createElement(C, { asChild: true }, createElement('h2', null, 'x')),
    expect: { type: 'h2', className: 'flg-card-title' },
  },
  {
    label: 'CardDescription',
    file: '../dist/components/card/Card.js',
    exportName: 'CardDescription',
    element: (C) => createElement(C, null, 'x'),
    expect: { type: 'p', className: 'flg-card-description' },
  },
  {
    label: 'CardContent',
    file: '../dist/components/card/Card.js',
    exportName: 'CardContent',
    element: (C) => createElement(C, null, 'x'),
    expect: { type: 'div', className: 'flg-card-content' },
  },
  {
    label: 'CardFooter',
    file: '../dist/components/card/Card.js',
    exportName: 'CardFooter',
    element: (C) => createElement(C, null, 'x'),
    expect: { type: 'div', className: 'flg-card-footer' },
  },
  {
    label: 'Breadcrumb with a link, a link asChild and the page',
    file: '../dist/components/breadcrumb/Breadcrumb.js',
    exportName: 'Breadcrumb',
    element: async (C) => {
      const { BreadcrumbLink, BreadcrumbPage } = await import(
        new URL('../dist/components/breadcrumb/Breadcrumb.js', import.meta.url)
      );
      return createElement(
        C,
        null,
        createElement(BreadcrumbLink, { href: '/' }, 'Home'),
        createElement(BreadcrumbLink, { asChild: true }, createElement('a', { href: '/p' }, 'P')),
        createElement(BreadcrumbPage, null, 'Here'),
      );
    },
    expect: { type: 'nav', className: 'flg-breadcrumb' },
  },
  {
    label: 'BreadcrumbLink',
    file: '../dist/components/breadcrumb/Breadcrumb.js',
    exportName: 'BreadcrumbLink',
    element: (C) => createElement(C, { href: '/' }, 'x'),
    expect: { type: 'a', className: 'flg-breadcrumb-link' },
  },
  {
    label: 'BreadcrumbPage',
    file: '../dist/components/breadcrumb/Breadcrumb.js',
    exportName: 'BreadcrumbPage',
    element: (C) => createElement(C, null, 'x'),
    expect: { type: 'span', className: 'flg-breadcrumb-page' },
  },
  {
    label: 'Alert without onDismiss',
    file: '../dist/components/alert/Alert.js',
    exportName: 'Alert',
    element: (C) => createElement(C, { status: 'warning', variant: 'tinted' }, 'x'),
    expect: { type: 'div', className: 'flg-alert' },
  },
  {
    label: 'AlertTitle asChild',
    file: '../dist/components/alert/Alert.js',
    exportName: 'AlertTitle',
    element: (C) => createElement(C, { asChild: true }, createElement('h2', null, 'x')),
    expect: { type: 'h2', className: 'flg-alert-title' },
  },
  {
    label: 'AlertDescription',
    file: '../dist/components/alert/Alert.js',
    exportName: 'AlertDescription',
    element: (C) => createElement(C, null, 'x'),
    expect: { type: 'div', className: 'flg-alert-description' },
  },
  {
    label: 'AlertActions',
    file: '../dist/components/alert/Alert.js',
    exportName: 'AlertActions',
    element: (C) => createElement(C, null, 'x'),
    expect: { type: 'div', className: 'flg-alert-actions' },
  },
  // The brand goes into a layout that is a Server Component, so it must render without a hook.
  {
    label: 'AppShellBrand with href',
    file: '../dist/components/app-shell/AppShellBrand.js',
    exportName: 'AppShellBrand',
    element: (C) => createElement(C, { name: 'Lumen', logo: 'L', href: '/' }),
    expect: { type: 'a', className: 'flg-app-shell-brand' },
  },
  {
    label: 'AppShellBrand without href',
    file: '../dist/components/app-shell/AppShellBrand.js',
    exportName: 'AppShellBrand',
    element: (C) => createElement(C, { name: 'Lumen' }),
    expect: { type: 'span', className: 'flg-app-shell-brand' },
  },
  {
    label: 'AppShellBrand asChild',
    file: '../dist/components/app-shell/AppShellBrand.js',
    exportName: 'AppShellBrand',
    element: (C) =>
      createElement(C, { name: 'Lumen', asChild: true }, createElement('a', { href: '/home' })),
    expect: { type: 'a', className: 'flg-app-shell-brand' },
  },
  // The script of the theme goes into the <head> of a layout that is a Server Component. It has no class:
  // the check looks at the tag, the nonce and the source it renders.
  ...[
    ['with the default key', {}, undefined, '("flg-theme")'],
    [
      'with a storageKey and a nonce',
      { storageKey: 'my-key', nonce: 'n0nce' },
      'n0nce',
      '("my-key")',
    ],
  ].map(([what, props, nonce, call]) => ({
    label: `ThemeScript ${what}`,
    file: '../dist/components/theme-switch/ThemeScript.js',
    exportName: 'ThemeScript',
    element: (C) => createElement(C, props),
    expect: { type: 'script', className: undefined },
    check: (tree) => {
      const source = tree.props.dangerouslySetInnerHTML?.__html;
      if (tree.props.nonce !== nonce) throw new Error(`nonce is ${tree.props.nonce}`);
      if (typeof source !== 'string' || !source.endsWith(call)) {
        throw new Error(`the source does not end with ${call}`);
      }
    },
  })),
  ...['rect', 'circle', 'text'].map((shape) => ({
    label: `Skeleton ${shape}`,
    file: '../dist/components/skeleton/Skeleton.js',
    exportName: 'Skeleton',
    element: (C) => createElement(C, { shape, variant: 'shimmer' }),
    expect: { type: 'span', className: 'flg-skeleton' },
  })),
  {
    label: 'SkeletonText',
    file: '../dist/components/skeleton/Skeleton.js',
    exportName: 'SkeletonText',
    element: (C) => createElement(C, { lines: 2 }),
    expect: { type: 'span', className: 'flg-skeleton-text' },
  },
  // A Stepper that only shows (no onValueChange): the Steps are read from its children without being
  // rendered, which is what lets it run in a Server Component.
  ...['circles', 'compact', 'bars'].map((variant) => ({
    label: `Stepper ${variant}, display only`,
    file: '../dist/components/stepper/Stepper.js',
    exportName: 'Stepper',
    element: async (C) => {
      const { Step } = await import(
        new URL('../dist/components/stepper/Stepper.js', import.meta.url)
      );
      return createElement(
        C,
        { value: 1, variant },
        createElement(Step, { title: 'Cart', description: '3 items' }),
        createElement(Step, { title: 'Delivery', status: 'error' }),
        createElement(Step, { title: 'Payment' }),
      );
    },
    expect: { type: 'ol', className: 'flg-stepper' },
  })),
  // A List with a link row and a static row. The rows are rendered by the probe as React would, so a
  // hook or a context in either part fails here; `renderLink` runs on the server too.
  {
    label: 'List with a link row and a static row',
    file: '../dist/components/list/List.js',
    exportName: 'List',
    element: async (C) => {
      const { ListItem } = await import(
        new URL('../dist/components/list/List.js', import.meta.url)
      );
      return createElement(
        C,
        null,
        createElement(ListItem, { title: 'Profile', href: '/profile', current: true }),
        createElement(ListItem, { title: 'Ada', description: 'ada@example.com', end: 'Admin' }),
      );
    },
    expect: { type: 'ul', className: 'flg-list flg-surface' },
  },
  {
    label: 'List cards with renderLink',
    file: '../dist/components/list/List.js',
    exportName: 'List',
    element: async (C) => {
      const { ListItem } = await import(
        new URL('../dist/components/list/List.js', import.meta.url)
      );
      return createElement(
        C,
        { variant: 'cards', size: 'sm' },
        createElement(ListItem, {
          title: 'Profile',
          href: '/profile',
          renderLink: (props) => createElement('a', { ...props, 'data-router': '' }),
        }),
      );
    },
    expect: { type: 'ul', className: 'flg-list' },
  },
  // The parts of a table that take no hook. The Table itself is a client component, so a table built
  // in a Server Component puts these inside it; they are rendered here as React would, so a hook or
  // a context in any of them fails. A sort without `onSort` is the form a server can write.
  ...[
    ['TableHeader', 'thead', 'flg-table-header'],
    ['TableBody', 'tbody', 'flg-table-body'],
    ['TableFooter', 'tfoot', 'flg-table-footer'],
  ].map(([exportName, type, className]) => ({
    label: exportName,
    file: '../dist/components/table/table-parts.js',
    exportName,
    element: async (C) => {
      const { TableRow } = await import(
        new URL('../dist/components/table/table-parts.js', import.meta.url)
      );
      return createElement(C, null, createElement(TableRow, null));
    },
    expect: { type, className },
  })),
  {
    label: 'TableRow selected',
    file: '../dist/components/table/table-parts.js',
    exportName: 'TableRow',
    element: (C) => createElement(C, { selected: true }),
    expect: { type: 'tr', className: 'flg-table-row' },
  },
  {
    label: 'TableHead with a sort and no onSort',
    file: '../dist/components/table/table-parts.js',
    exportName: 'TableHead',
    element: (C) => createElement(C, { sort: 'descending', align: 'end' }, 'Total'),
    expect: { type: 'th', className: 'flg-table-head' },
  },
  {
    label: 'TableCell',
    file: '../dist/components/table/table-parts.js',
    exportName: 'TableCell',
    element: (C) => createElement(C, { align: 'end' }, 'x'),
    expect: { type: 'td', className: 'flg-table-cell' },
  },
];

let failed = 0;
for (const c of CASES) {
  try {
    const mod = await import(new URL(c.file, import.meta.url));
    const clients = new Map();
    for (const { file, exportName } of c.clients ?? []) {
      clients.set(exportName, (await import(new URL(file, import.meta.url)))[exportName]);
    }
    const tree = renderTree(await c.element(mod[c.exportName]), new Set(clients.values()));
    const expectedType =
      typeof c.expect.type === 'object' ? clients.get(c.expect.type.client) : c.expect.type;
    if (tree.type !== expectedType || tree.props.className !== c.expect.className) {
      throw new Error(
        `expected <${c.expect.type?.client ?? c.expect.type} class="${c.expect.className}">, got <${typeof tree.type === 'string' ? tree.type : 'another component'} class="${tree.props.className}">`,
      );
    }
    c.check?.(tree);
    console.log(`ok   ${c.label}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${c.label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
if (failed > 0) process.exit(1);
