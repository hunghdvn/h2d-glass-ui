// Renders server-safe modules from dist/ with React's `react-server` build, the build React Server
// Components use. A module that touches hooks or context there fails here.
// Run with: node --conditions=react-server scripts/rsc-probe.mjs
import { createElement } from 'react';

const FORWARD_REF = Symbol.for('react.forward_ref');

function renderTree(node) {
  if (node === null || node === undefined || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(renderTree);
  const { type, props } = node;
  if (typeof type === 'string') {
    return { type, props: { ...props, children: renderTree(props.children) } };
  }
  if (typeof type === 'function') return renderTree(type(props));
  if (type && type.$$typeof === FORWARD_REF) return renderTree(type.render(props, null));
  throw new Error(`Unsupported element type: ${String(type)}`);
}

/** Plan 2 appends the other server-safe components of spec §6.2. */
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
];

let failed = 0;
for (const c of CASES) {
  try {
    const mod = await import(new URL(c.file, import.meta.url));
    const tree = renderTree(c.element(mod[c.exportName]));
    if (tree.type !== c.expect.type || tree.props.className !== c.expect.className) {
      throw new Error(
        `expected <${c.expect.type} class="${c.expect.className}">, got <${tree.type} class="${tree.props.className}">`,
      );
    }
    console.log(`ok   ${c.label}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${c.label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
if (failed > 0) process.exit(1);
