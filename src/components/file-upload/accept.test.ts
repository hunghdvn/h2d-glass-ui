import { describe, expect, it } from 'vitest';
import { formatFileSize, matchesAccept } from './accept';

const file = (name: string, type = '') => ({ name, type });

describe('matchesAccept', () => {
  it('matches an extension token against the end of the name, ignoring case', () => {
    expect(matchesAccept(file('A.PDF', 'application/pdf'), '.pdf')).toBe(true);
    expect(matchesAccept(file('a.png', 'image/png'), '.pdf')).toBe(false);
    expect(matchesAccept(file('a.pdf.png', 'image/png'), '.pdf')).toBe(false);
  });

  it('matches a multi-dot extension token', () => {
    expect(matchesAccept(file('x.tar.gz'), '.tar.gz')).toBe(true);
    expect(matchesAccept(file('x.gz'), '.tar.gz')).toBe(false);
  });

  it('matches a type/* token against the type of the file', () => {
    expect(matchesAccept(file('a.png', 'image/png'), 'image/*')).toBe(true);
    expect(matchesAccept(file('a.pdf', 'application/pdf'), 'image/*')).toBe(false);
  });

  it('matches a type/subtype token exactly, ignoring parameters after ";"', () => {
    expect(matchesAccept(file('a.pdf', 'application/pdf'), 'application/pdf')).toBe(true);
    expect(matchesAccept(file('a.txt', 'text/plain;charset=utf-8'), 'text/plain')).toBe(true);
    expect(matchesAccept(file('a.txt', 'text/plain'), 'text/plain;charset=utf-8')).toBe(true);
    expect(matchesAccept(file('a.png', 'image/png'), 'image/jpeg')).toBe(false);
  });

  it('compares MIME tokens case-insensitively', () => {
    expect(matchesAccept(file('a.png', 'image/png'), 'IMAGE/*')).toBe(true);
    expect(matchesAccept(file('a.png', 'IMAGE/PNG'), 'image/png')).toBe(true);
  });

  it('lets a file with an empty type match only extension tokens', () => {
    expect(matchesAccept(file('a.png'), 'image/*')).toBe(false);
    expect(matchesAccept(file('a.png'), 'image/png')).toBe(false);
    expect(matchesAccept(file('a.png'), '.png')).toBe(true);
  });

  it('matches when any token of the list matches, trimming each token', () => {
    expect(matchesAccept(file('a.pdf', 'application/pdf'), 'image/*,  .pdf ')).toBe(true);
    expect(matchesAccept(file('a.txt', 'text/plain'), 'image/*, .pdf')).toBe(false);
  });

  it('ignores tokens that are no extension and no MIME type', () => {
    expect(matchesAccept(file('a.png', 'image/png'), 'pdf, image, .jpg')).toBe(false);
    expect(matchesAccept(file('a.png', 'image/png'), 'pdf, *, , image/png')).toBe(true);
  });

  it('matches every file when no valid token is left', () => {
    expect(matchesAccept(file('a.png', 'image/png'), 'pdf, *, image, ,')).toBe(true);
  });

  it('matches every file when accept is undefined or empty', () => {
    expect(matchesAccept(file('a.png', 'image/png'), undefined)).toBe(true);
    expect(matchesAccept(file('a.png', 'image/png'), '')).toBe(true);
  });
});

describe('formatFileSize', () => {
  it.each([
    [0, '0 byte'],
    [999, '999 byte'],
    [1000, '1 kB'],
    [1500, '1.5 kB'],
    [999_960, '1 MB'],
    [1_200_000, '1.2 MB'],
    [2_500_000_000, '2.5 GB'],
  ])('writes %i bytes as "%s" in en-US', (bytes, text) => {
    expect(formatFileSize(bytes, 'en-US')).toBe(text);
  });

  it('keeps 999 940 bytes in kilobytes, since it rounds to 999.9 kB', () => {
    expect(formatFileSize(999_940, 'en-US')).toBe('999.9 kB');
  });

  it('uses the decimal separator of the locale', () => {
    expect(formatFileSize(1_200_000, 'vi-VN')).toMatch(/^1,2\s+MB$/);
    expect(formatFileSize(1_200_000, 'de-DE')).toMatch(/^1,2\s+MB$/);
  });

  it('treats negative and non-finite sizes as 0', () => {
    expect(formatFileSize(-5, 'en-US')).toBe('0 byte');
    expect(formatFileSize(Number.NaN, 'en-US')).toBe('0 byte');
    expect(formatFileSize(Number.POSITIVE_INFINITY, 'en-US')).toBe('0 byte');
  });
});
