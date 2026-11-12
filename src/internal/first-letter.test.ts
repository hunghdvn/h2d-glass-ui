import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { firstLetter } from './first-letter';

describe('firstLetter', () => {
  it('is the first code point of a text, after the spaces around it', () => {
    expect(firstLetter('Inbox')).toBe('I');
    expect(firstLetter('  ada')).toBe('a');
  });

  it('is one letter for a letter written with its mark apart, and a whole emoji', () => {
    // "e" and a combining acute accent, which NFC makes the one letter "é".
    expect(firstLetter(String.fromCodePoint(0x65, 0x301, 0x74))).toBe(String.fromCodePoint(0xe9));
    // An emoji outside the first plane is two UTF-16 units: both are kept.
    expect(firstLetter(String.fromCodePoint(0x1f600) + 'abc')).toBe(String.fromCodePoint(0x1f600));
    // An emoji joined from several (a person, a joiner, a laptop) gives the first of them.
    expect(firstLetter(String.fromCodePoint(0x1f9d1, 0x200d, 0x1f4bb))).toBe(
      String.fromCodePoint(0x1f9d1),
    );
  });

  it('is undefined for a text with no letter, and for a label that is not text', () => {
    expect(firstLetter('')).toBeUndefined();
    expect(firstLetter('   ')).toBeUndefined();
    expect(firstLetter(createElement('b', null, 'Inbox'))).toBeUndefined();
    expect(firstLetter(7)).toBeUndefined();
  });
});
