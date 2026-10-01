const warned = new Set<string>();

/** Development-only warning, printed once per distinct message. Never throws. */
export function devWarn(message: string): void {
  if (process.env.NODE_ENV === 'production') return;
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[fl-glass-ui] ${message}`);
}

/** Test helper: forget which messages were already printed. */
export function resetDevWarnings(): void {
  warned.clear();
}
