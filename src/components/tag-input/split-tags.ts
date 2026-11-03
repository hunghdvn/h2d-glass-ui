/**
 * Splits pasted text into tags: at every one-character entry of `separators`, and at line breaks
 * when `separators` has "Enter". Each part is trimmed; empty parts are dropped; order and
 * duplicates are kept (the TagInput decides about duplicates).
 */
export function splitTags(text: string, separators: readonly string[]): string[] {
  const sepSet = new Set<string>();
  let hasEnter = false;
  for (const s of separators) {
    if (s === 'Enter') hasEnter = true;
    else if ([...s].length === 1) sepSet.add(s);
  }

  const parts: string[] = [];
  let current = '';
  for (const ch of [...text]) {
    if (hasEnter && (ch === '\n' || ch === '\r')) {
      parts.push(current);
      current = '';
      continue;
    }
    if (sepSet.has(ch)) {
      parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  parts.push(current);

  return parts.map((part) => part.trim()).filter((part) => part !== '');
}
