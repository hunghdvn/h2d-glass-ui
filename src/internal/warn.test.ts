import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WARN_PREFIX, devWarn, resetDevWarnings } from './warn';

describe('devWarn', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => resetDevWarnings());
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  it('prefixes the message with the library name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    devWarn('something is off');
    expect(warn).toHaveBeenCalledWith(WARN_PREFIX + ' something is off');
  });

  it('prints each distinct message only once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    devWarn('a');
    devWarn('a');
    devWarn('b');
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('is silent in production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.NODE_ENV = 'production';
    devWarn('hidden');
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not throw where `process` does not exist, and keeps warning there', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('process', undefined);
    try {
      expect(() => devWarn('no bundler')).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
    expect(warn).toHaveBeenCalledWith(WARN_PREFIX + ' no bundler');
  });
});
