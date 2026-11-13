import { describe, expect, it } from 'vitest';
import {
  DEFAULT_KEY_LABELS,
  formatKeys,
  parseKeys,
  shortcutText,
  toAriaKeyShortcuts,
} from './shortcut-format';
import type { KeyLabels } from './shortcut-format';

/** One part, formatted for a platform: its glyph and its hidden name. */
const one = (key: string, apple: boolean) =>
  formatKeys(parseKeys(key).parts, apple, DEFAULT_KEY_LABELS)[0]!;

describe('parseKeys', () => {
  it('splits on "+", trims each part and ignores case', () => {
    const { parts, unknown } = parseKeys(' Mod + SHIFT+f ');
    expect(parts).toEqual([
      { kind: 'named', key: 'mod' },
      { kind: 'named', key: 'shift' },
      { kind: 'char', char: 'F' },
    ]);
    expect(unknown).toEqual([]);
  });

  it('keeps the order the writer gave', () => {
    const order = (keys: string) => shortcutText(parseKeys(keys).parts, true);
    expect(order('mod+shift+f')).toBe('⌘⇧F');
    expect(order('shift+mod+f')).toBe('⇧⌘F');
  });

  it('upper-cases a one-character part only when that gives one character back', () => {
    const chars = (keys: string) =>
      parseKeys(keys).parts.map((part) => (part.kind === 'char' ? part.char : part.kind));
    expect(chars('k')).toEqual(['K']);
    expect(chars('/')).toEqual(['/']);
    expect(chars(',')).toEqual([',']);
    expect(chars('[')).toEqual(['[']);
    // 'ß'.toUpperCase() is 'SS': the part stays as it was.
    expect(chars('ß')).toEqual(['ß']);
    // One code point is one character, even where it is two UTF-16 units.
    expect(chars('𝑥')).toEqual(['𝑥']);
    expect(parseKeys('ß').unknown).toEqual([]);
  });

  it('does not depend on the locale of the page', () => {
    // A Turkish locale would turn "i" into "İ"; the key is "I" everywhere.
    const original = String.prototype.toLocaleUpperCase;
    String.prototype.toLocaleUpperCase = () => 'İ';
    try {
      expect(shortcutText(parseKeys('mod+i').parts, false)).toBe('Ctrl I');
    } finally {
      String.prototype.toLocaleUpperCase = original;
    }
  });

  it('returns a part it does not know as written, and says so', () => {
    const { parts, unknown } = parseKeys('mod+Foo');
    expect(parts).toEqual([
      { kind: 'named', key: 'mod' },
      { kind: 'unknown', text: 'Foo' },
    ]);
    expect(unknown).toEqual(['Foo']);
  });

  it('reports an empty part and draws nothing for it', () => {
    const { parts, unknown } = parseKeys('mod++');
    expect(parts).toEqual([{ kind: 'named', key: 'mod' }]);
    expect(unknown).toEqual(['', '']);
    expect(parseKeys('').parts).toEqual([]);
    expect(parseKeys('').unknown).toEqual(['']);
    expect(parseKeys(' + ').unknown).toEqual(['', '']);
  });

  it('writes "+" as plus', () => {
    expect(parseKeys('mod+plus').parts).toEqual([
      { kind: 'named', key: 'mod' },
      { kind: 'named', key: 'plus' },
    ]);
  });

  it('knows escape as esc, and a function key from f1 to f12 only', () => {
    expect(one('escape', false).glyph).toBe('Esc');
    expect(one('f1', false).glyph).toBe('F1');
    expect(one('f12', false).glyph).toBe('F12');
    expect(parseKeys('f13').unknown).toEqual(['f13']);
    expect(parseKeys('f0').unknown).toEqual(['f0']);
  });
});

describe('formatKeys: every row of the table of spec §3.3', () => {
  // [key, apple glyph, apple name, other glyph, other name, aria-keyshortcuts (apple / other)]
  const rows: Array<[string, string, string?, string?, string?, string?, string?]> = [
    ['mod', '⌘', 'Command', 'Ctrl', undefined, 'Meta', 'Control'],
    ['ctrl', '⌃', 'Control', 'Ctrl', undefined, 'Control', 'Control'],
    ['alt', '⌥', 'Option', 'Alt', undefined, 'Alt', 'Alt'],
    ['shift', '⇧', 'Shift', 'Shift', undefined, 'Shift', 'Shift'],
    ['enter', '↩', 'Return', 'Enter', undefined, 'Enter', 'Enter'],
    ['esc', 'Esc', undefined, 'Esc', undefined, 'Escape', 'Escape'],
    ['escape', 'Esc', undefined, 'Esc', undefined, 'Escape', 'Escape'],
    ['tab', '⇥', 'Tab', 'Tab', undefined, 'Tab', 'Tab'],
    ['backspace', '⌫', 'Delete', 'Backspace', undefined, 'Backspace', 'Backspace'],
    ['delete', '⌦', 'Forward Delete', 'Del', undefined, 'Delete', 'Delete'],
    ['up', '↑', 'Up Arrow', '↑', 'Up Arrow', 'ArrowUp', 'ArrowUp'],
    ['down', '↓', 'Down Arrow', '↓', 'Down Arrow', 'ArrowDown', 'ArrowDown'],
    ['left', '←', 'Left Arrow', '←', 'Left Arrow', 'ArrowLeft', 'ArrowLeft'],
    ['right', '→', 'Right Arrow', '→', 'Right Arrow', 'ArrowRight', 'ArrowRight'],
    ['space', 'Space', undefined, 'Space', undefined, 'Space', 'Space'],
    ['home', 'Home', undefined, 'Home', undefined, 'Home', 'Home'],
    ['end', 'End', undefined, 'End', undefined, 'End', 'End'],
    ['pageup', 'Page Up', undefined, 'Page Up', undefined, 'PageUp', 'PageUp'],
    ['pagedown', 'Page Down', undefined, 'Page Down', undefined, 'PageDown', 'PageDown'],
    ['f1', 'F1', undefined, 'F1', undefined, 'F1', 'F1'],
    ['f12', 'F12', undefined, 'F12', undefined, 'F12', 'F12'],
    ['plus', '+', undefined, '+', undefined, 'Plus', 'Plus'],
    ['k', 'K', undefined, 'K', undefined, 'K', 'K'],
    ['/', '/', undefined, '/', undefined, '/', '/'],
  ];

  it.each(rows)('%s', (key, appleGlyph, appleName, otherGlyph, otherName, ariaApple, ariaOther) => {
    expect(one(key, true)).toEqual({ glyph: appleGlyph, name: appleName });
    expect(one(key, false)).toEqual({ glyph: otherGlyph, name: otherName });
    const { parts } = parseKeys(key);
    expect(toAriaKeyShortcuts(parts, true)).toBe(ariaApple);
    expect(toAriaKeyShortcuts(parts, false)).toBe(ariaOther);
  });

  it('draws an unknown part as written, with no name', () => {
    expect(one('foo', true)).toEqual({ glyph: 'foo', name: undefined });
    expect(one('Foo', false)).toEqual({ glyph: 'Foo', name: undefined });
  });

  it('takes the names of the symbols from the labels, and only those', () => {
    const labels: KeyLabels = {
      ...DEFAULT_KEY_LABELS,
      command: 'Befehl',
      option: 'Wahl',
      up: 'Pfeil nach oben',
    };
    const format = (keys: string, apple: boolean) =>
      formatKeys(parseKeys(keys).parts, apple, labels).map((key) => key.name);
    expect(format('mod+alt+up', true)).toEqual(['Befehl', 'Wahl', 'Pfeil nach oben']);
    // Elsewhere "Ctrl" and "Alt" are words and are read as written; the arrow keeps its name.
    expect(format('mod+alt+up', false)).toEqual([undefined, undefined, 'Pfeil nach oben']);
  });
});

describe('shortcutText', () => {
  it('is the flat text of the hint: "⌘K" on Apple, "Ctrl K" elsewhere', () => {
    const { parts } = parseKeys('mod+k');
    expect(shortcutText(parts, true)).toBe('⌘K');
    expect(shortcutText(parts, false)).toBe('Ctrl K');
  });

  it('joins several keys', () => {
    const { parts } = parseKeys('mod+shift+f');
    expect(shortcutText(parts, true)).toBe('⌘⇧F');
    expect(shortcutText(parts, false)).toBe('Ctrl Shift F');
  });

  it('puts a space around a word on Apple, so "Page Up" does not run into the symbol', () => {
    expect(shortcutText(parseKeys('mod+pageup').parts, true)).toBe('⌘ Page Up');
    expect(shortcutText(parseKeys('esc').parts, true)).toBe('Esc');
  });

  it('reads "/" as it is', () => {
    expect(shortcutText(parseKeys('/').parts, true)).toBe('/');
    expect(shortcutText(parseKeys('/').parts, false)).toBe('/');
  });

  it('is empty without parts', () => {
    expect(shortcutText([], true)).toBe('');
  });
});

describe('toAriaKeyShortcuts', () => {
  it('joins the names with "+", in the order given', () => {
    const { parts } = parseKeys('mod+shift+f');
    expect(toAriaKeyShortcuts(parts, true)).toBe('Meta+Shift+F');
    expect(toAriaKeyShortcuts(parts, false)).toBe('Control+Shift+F');
  });

  it('keeps an unknown part as written', () => {
    expect(toAriaKeyShortcuts(parseKeys('mod+foo').parts, false)).toBe('Control+foo');
  });
});

describe('DEFAULT_KEY_LABELS', () => {
  it('has the English names of spec §6.3', () => {
    expect(DEFAULT_KEY_LABELS).toEqual({
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
    });
  });
});
