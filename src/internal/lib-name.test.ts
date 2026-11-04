import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LIB_NAME, libSymbol } from './lib-name';
import { WARN_PREFIX } from './warn';

describe('LIB_NAME', () => {
  it('is the name in package.json, so a rename cannot leave the warnings or markers behind', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
      name: string;
    };
    expect(LIB_NAME).toBe(pkg.name);
    expect(WARN_PREFIX).toBe(`[${pkg.name}]`);
  });

  it('keys shared symbols under the name, the same symbol on every call', () => {
    expect(libSymbol('part')).toBe(Symbol.for(`${LIB_NAME}.part`));
    expect(libSymbol('part')).toBe(libSymbol('part'));
    expect(libSymbol('part')).not.toBe(libSymbol('field-group'));
  });
});
