const warned = new Set<string>();

// Bundlers replace `process.env.NODE_ENV` with a string literal, so the check costs nothing in a
// production build. Without a bundler (native ESM in a browser) `process` may not exist at all.
export function isProduction(): boolean {
  try {
    return process.env.NODE_ENV === 'production';
  } catch {
    return false;
  }
}

/** Development-only warning, printed once per distinct message. Never throws. */
export function devWarn(message: string): void {
  if (isProduction()) return;
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[fl-glass-ui] ${message}`);
}

/** Test helper: forget which messages were already printed. */
export function resetDevWarnings(): void {
  warned.clear();
}
