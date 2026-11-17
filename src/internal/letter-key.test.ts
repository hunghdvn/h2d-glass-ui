import { describe, expect, it } from 'vitest';
import { isLetterKey } from './letter-key';

describe('isLetterKey', () => {
  it('is the letter the key types, in either case', () => {
    expect(isLetterKey({ key: 'a', code: 'KeyA' }, 'a')).toBe(true);
    expect(isLetterKey({ key: 'A', code: 'KeyA' }, 'a')).toBe(true);
    expect(isLetterKey({ key: 'b', code: 'KeyB' }, 'a')).toBe(false);
  });

  it('follows a Latin layout that moves the letter, and not the place of the key', () => {
    // AZERTY has A where QWERTY has Q, and Q where it has A; Dvorak has K where QWERTY has V.
    expect(isLetterKey({ key: 'a', code: 'KeyQ' }, 'a')).toBe(true);
    expect(isLetterKey({ key: 'q', code: 'KeyA' }, 'a')).toBe(false);
    expect(isLetterKey({ key: 'k', code: 'KeyV' }, 'k')).toBe(true);
  });

  it('is the place of the key where the layout types no Latin letter there', () => {
    // Russian ф and л, Greek α, Hebrew ש, Arabic ش: QWERTY's A, K, A, A, A.
    expect(isLetterKey({ key: 'ф', code: 'KeyA' }, 'a')).toBe(true);
    expect(isLetterKey({ key: 'л', code: 'KeyK' }, 'k')).toBe(true);
    expect(isLetterKey({ key: 'α', code: 'KeyA' }, 'a')).toBe(true);
    expect(isLetterKey({ key: 'ש', code: 'KeyA' }, 'a')).toBe(true);
    expect(isLetterKey({ key: 'ش', code: 'KeyA' }, 'a')).toBe(true);
    expect(isLetterKey({ key: 'ф', code: 'KeyS' }, 'a')).toBe(false);
  });

  it('is no letter for a key that is not one: a digit, a name, nothing', () => {
    expect(isLetterKey({ key: '1', code: 'Digit1' }, 'a')).toBe(false);
    expect(isLetterKey({ key: 'Enter', code: 'Enter' }, 'a')).toBe(false);
    expect(isLetterKey({ key: '', code: '' }, 'a')).toBe(false);
  });
});
