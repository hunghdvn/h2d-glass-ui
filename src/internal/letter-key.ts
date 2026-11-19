/** What a key event says of its key: what it types, and where it is. */
export interface LetterKeyEvent {
  key: string;
  code: string;
}

/**
 * Whether a key event is the key of `letter`, a lowercase Latin letter, for a shortcut such as mod+K
 * or mod+A. The letter is the one the key types, so a Latin layout that moves it (AZERTY, Dvorak) is
 * followed; a layout that types no Latin letter there (Russian, Greek, Hebrew, Arabic) is matched by
 * the place of the key, where QWERTY has the letter (`code`), as the browser's own shortcuts are.
 */
export function isLetterKey(event: LetterKeyEvent, letter: string): boolean {
  return /^[a-z]$/i.test(event.key)
    ? event.key.toLowerCase() === letter
    : event.code === `Key${letter.toUpperCase()}`;
}
