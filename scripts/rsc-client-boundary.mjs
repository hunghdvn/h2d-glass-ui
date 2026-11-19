// A module loader for scripts/rsc-probe.mjs. A framework's bundler does not load the client modules a
// Server Component imports: it puts a reference to each in their place, and the browser loads the real
// ones. Node has no bundler, so the probe would load them, and a client module that imports a hook
// (`useSyncExternalStore`, `useEffect`) fails to load in the `react-server` build of React, which has
// none. This stands in for the bundler: a module of `dist/` that starts with "use client" is replaced
// by a client reference for each of its exports. The server-safe module that imports it still loads, and
// what it returns for a client component is the reference, which is what React would send.
//
// Registered by the probe: `register('./rsc-client-boundary.mjs', import.meta.url)`.

const USE_CLIENT = /^\s*(["'])use client\1/;

/** The names a module exports, from the forms tsdown writes: `export { A, B as C }` and `export const`. */
function exportedNames(source) {
  const names = new Set();
  for (const [, list] of source.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    for (const part of list.split(',')) {
      const name = part
        .trim()
        .split(/\s+as\s+/)
        .pop();
      if (name) names.add(name);
    }
  }
  for (const [, name] of source.matchAll(
    /^export\s+(?:const|let|var|function|class)\s+([\w$]+)/gm,
  )) {
    names.add(name);
  }
  return names;
}

export async function load(url, context, nextLoad) {
  const loaded = await nextLoad(url, context);
  if (loaded.format !== 'module' || !url.includes('/dist/')) return loaded;
  const source = String(loaded.source);
  if (!USE_CLIENT.test(source)) return loaded;
  const stubs = [...exportedNames(source)].map((name) => {
    const reference = `{ $$typeof: Symbol.for('react.client.reference'), $$id: ${JSON.stringify(`${url}#${name}`)}, $$async: false, name: ${JSON.stringify(name)} }`;
    return name === 'default'
      ? `export default ${reference};`
      : `export const ${name} = ${reference};`;
  });
  return { format: 'module', shortCircuit: true, source: stubs.join('\n') };
}
