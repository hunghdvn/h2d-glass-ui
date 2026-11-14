/**
 * The grammar of a key combination (spec phase 6 §3.3) and what it is called on each platform: the
 * glyphs and the hidden names of `Kbd`, the flat text of a key hint, and `aria-keyshortcuts`. Pure and
 * free of React and of the browser (`apple` is an argument), so the server runs it and a test can
 * reach every row.
 */

/**
 * The names a screen reader says for a symbol, and the hidden "+" between two keys. They are only
 * needed where a key is drawn as a symbol (⌘ ⇧ ⌥ ⌃ ↩ ⌫ ⌦ ⇥, and the arrows everywhere); a word such as
 * "Ctrl" or "Esc" is read as written.
 */
export interface KeyLabels {
  command: string;
  option: string;
  control: string;
  shift: string;
  return: string;
  tab: string;
  delete: string;
  forwardDelete: string;
  up: string;
  down: string;
  left: string;
  right: string;
  /** Said between two keys, so a name reads "Control plus K" and not "ControlK". */
  separator: string;
}

export const DEFAULT_KEY_LABELS: KeyLabels = {
  command: 'Command',
  option: 'Option',
  control: 'Control',
  shift: 'Shift',
  return: 'Return',
  tab: 'Tab',
  delete: 'Delete',
  forwardDelete: 'Forward Delete',
  up: 'Up Arrow',
  down: 'Down Arrow',
  left: 'Left Arrow',
  right: 'Right Arrow',
  separator: '+',
};

/** What each key of the grammar looks like. A glyph or a name that is `undefined` has none. */
interface KeyInfo {
  /** The glyph on Apple and elsewhere. */
  apple: string;
  other: string;
  /** The label that names the glyph on Apple and elsewhere; `undefined` where the text is the name. */
  appleName?: keyof KeyLabels;
  otherName?: keyof KeyLabels;
  /** The name `aria-keyshortcuts` uses, on Apple and elsewhere. */
  aria: string | { apple: string; other: string };
}

const FUNCTION_KEYS = Object.fromEntries(
  Array.from({ length: 12 }, (_, index) => {
    const name = `F${index + 1}`;
    return [name.toLowerCase(), { apple: name, other: name, aria: name }];
  }),
) as Record<string, KeyInfo>;

const KEYS: Record<string, KeyInfo> = {
  mod: {
    apple: '⌘',
    other: 'Ctrl',
    appleName: 'command',
    aria: { apple: 'Meta', other: 'Control' },
  },
  ctrl: { apple: '⌃', other: 'Ctrl', appleName: 'control', aria: 'Control' },
  alt: { apple: '⌥', other: 'Alt', appleName: 'option', aria: 'Alt' },
  shift: { apple: '⇧', other: 'Shift', appleName: 'shift', aria: 'Shift' },
  enter: { apple: '↩', other: 'Enter', appleName: 'return', aria: 'Enter' },
  esc: { apple: 'Esc', other: 'Esc', aria: 'Escape' },
  tab: { apple: '⇥', other: 'Tab', appleName: 'tab', aria: 'Tab' },
  backspace: { apple: '⌫', other: 'Backspace', appleName: 'delete', aria: 'Backspace' },
  delete: { apple: '⌦', other: 'Del', appleName: 'forwardDelete', aria: 'Delete' },
  up: { apple: '↑', other: '↑', appleName: 'up', otherName: 'up', aria: 'ArrowUp' },
  down: { apple: '↓', other: '↓', appleName: 'down', otherName: 'down', aria: 'ArrowDown' },
  left: { apple: '←', other: '←', appleName: 'left', otherName: 'left', aria: 'ArrowLeft' },
  right: { apple: '→', other: '→', appleName: 'right', otherName: 'right', aria: 'ArrowRight' },
  space: { apple: 'Space', other: 'Space', aria: 'Space' },
  home: { apple: 'Home', other: 'Home', aria: 'Home' },
  end: { apple: 'End', other: 'End', aria: 'End' },
  pageup: { apple: 'Page Up', other: 'Page Up', aria: 'PageUp' },
  pagedown: { apple: 'Page Down', other: 'Page Down', aria: 'PageDown' },
  plus: { apple: '+', other: '+', aria: 'Plus' },
  ...FUNCTION_KEYS,
};

/** The spellings that mean another key. */
const ALIASES: Record<string, string> = { escape: 'esc' };

/** One part of a combination, normalised. */
export type KeyPart =
  | { kind: 'named'; key: string }
  | { kind: 'char'; char: string }
  | { kind: 'unknown'; text: string };

export interface ParsedKeys {
  parts: KeyPart[];
  /** The parts that are not a key of the grammar, as written (an empty part is `''`), for one warning. */
  unknown: string[];
}

/**
 * Reads `keys`: parts are split on "+", trimmed, and matched without regard to case. A part of one
 * character is that character, upper-cased when the upper case is one character too (`k` is K, but
 * `ß` stays: its upper case is "SS"). It is `toUpperCase`, not `toLocaleUpperCase`, so the server and
 * a browser in any language agree. The writer's order is kept. A part the grammar does not know comes
 * back in `parts` as written and in `unknown`; an empty one is only in `unknown`, since there is
 * nothing to draw.
 */
export function parseKeys(keys: string): ParsedKeys {
  const parts: KeyPart[] = [];
  const unknown: string[] = [];
  for (const raw of keys.split('+')) {
    const text = raw.trim();
    if (text === '') {
      unknown.push('');
      continue;
    }
    const name = text.toLowerCase();
    const key = ALIASES[name] ?? name;
    if (Object.hasOwn(KEYS, key)) {
      parts.push({ kind: 'named', key });
    } else if ([...text].length === 1) {
      const upper = text.toUpperCase();
      parts.push({ kind: 'char', char: [...upper].length === 1 ? upper : text });
    } else {
      parts.push({ kind: 'unknown', text });
      unknown.push(text);
    }
  }
  return { parts, unknown };
}

/**
 * Whether a `keys` prop names a combination to draw: a string with at least one key in it. Anything
 * else is no keys, and the component shows its children: a value that is not a string
 * (`keys={cond && 'mod+k'}` from JavaScript), a blank string (`keys={item.shortcut ?? ''}`), or one
 * with no key in it (`'+'`, whose parts are all empty). Of those, only the last is a mistake worth a
 * warning: see `hasNoKey`.
 */
export function hasKeys(keys: unknown): keys is string {
  return typeof keys === 'string' && parseKeys(keys).parts.length > 0;
}

/** Whether `keys` is a string that is not blank and still has no key in it, such as `'+'`. */
export function hasNoKey(keys: unknown): boolean {
  return typeof keys === 'string' && keys.trim() !== '' && !hasKeys(keys);
}

/** What one key shows, and the name a screen reader says when the glyph is a symbol. */
export interface FormattedKey {
  glyph: string;
  name: string | undefined;
}

/** The glyph and the hidden name of each part, for a platform. */
export function formatKeys(parts: KeyPart[], apple: boolean, labels: KeyLabels): FormattedKey[] {
  return parts.map((part) => {
    if (part.kind === 'char') return { glyph: part.char, name: undefined };
    if (part.kind === 'unknown') return { glyph: part.text, name: undefined };
    const info = KEYS[part.key]!;
    const label = apple ? info.appleName : info.otherName;
    return { glyph: apple ? info.apple : info.other, name: label && labels[label] };
  });
}

/**
 * The text of a combination where the keys are not drawn one by one: "⌘K" on Apple, "Ctrl K"
 * elsewhere. Apple symbols run together; a word (`Esc`, `Page Up`) is set apart from its neighbours.
 */
export function shortcutText(parts: KeyPart[], apple: boolean): string {
  const glyphs = formatKeys(parts, apple, DEFAULT_KEY_LABELS).map((key) => key.glyph);
  if (!apple) return glyphs.join(' ');
  return glyphs.reduce((text, glyph, index) => {
    const previous = glyphs[index - 1];
    const apart = previous !== undefined && ([...previous].length > 1 || [...glyph].length > 1);
    return text + (apart ? ' ' : '') + glyph;
  }, '');
}

/** The value of `aria-keyshortcuts` for a combination: "Meta+K" on Apple, "Control+K" elsewhere. */
export function toAriaKeyShortcuts(parts: KeyPart[], apple: boolean): string {
  return parts
    .map((part) => {
      if (part.kind === 'char') return part.char;
      if (part.kind === 'unknown') return part.text;
      const { aria } = KEYS[part.key]!;
      return typeof aria === 'string' ? aria : apple ? aria.apple : aria.other;
    })
    .join('+');
}
