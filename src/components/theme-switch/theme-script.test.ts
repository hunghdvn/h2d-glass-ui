import { afterEach, describe, expect, it } from 'vitest';
import { themeScriptSource } from './theme-script';

describe('themeScriptSource', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-flg-theme');
  });

  it('is, character for character, the script of the spec (spec phase 5 §6.3), for the default key', () => {
    expect(themeScriptSource()).toBe(
      '(function(k){try{var v=localStorage.getItem(k),d=document.documentElement;' +
        'if(v==="light"||v==="dark")d.setAttribute("data-flg-theme",v);' +
        'else d.removeAttribute("data-flg-theme")}catch(e){}})("flg-theme")',
    );
  });

  it('puts the key in as a string literal, and nothing else changes', () => {
    expect(themeScriptSource('my-app:theme')).toBe(
      themeScriptSource().replace('("flg-theme")', '("my-app:theme")'),
    );
  });

  it('escapes every < of the key, so that a key cannot close the tag or open a comment', () => {
    const source = themeScriptSource('</script><script>alert(1)</script><!--');
    expect(source).not.toContain('<');
    expect(
      source.endsWith('("\\u003c/script>\\u003cscript>alert(1)\\u003c/script>\\u003c!--")'),
    ).toBe(true);
  });

  describe('when it runs', () => {
    const run = (key?: string) => new Function(themeScriptSource(key))();
    const attribute = () => document.documentElement.getAttribute('data-flg-theme');

    it.each(['light', 'dark'])('puts a stored %s on <html>', (stored) => {
      localStorage.setItem('flg-theme', stored);
      run();
      expect(attribute()).toBe(stored);
    });

    it.each(['system', 'sepia', ''])(
      'takes the attribute off <html> for a stored "%s"',
      (stored) => {
        document.documentElement.setAttribute('data-flg-theme', 'dark');
        localStorage.setItem('flg-theme', stored);
        run();
        expect(attribute()).toBeNull();
      },
    );

    it('takes the attribute off <html> when nothing is stored', () => {
      document.documentElement.setAttribute('data-flg-theme', 'dark');
      run();
      expect(attribute()).toBeNull();
    });

    it('reads the key it was given, whatever characters it has', () => {
      const key = 'a"b\\c</script>';
      localStorage.setItem(key, 'dark');
      localStorage.setItem('flg-theme', 'light');
      run(key);
      expect(attribute()).toBe('dark');
    });

    it('does not throw when localStorage cannot be read, and leaves <html> as it is', () => {
      document.documentElement.setAttribute('data-flg-theme', 'dark');
      const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!;
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('denied', 'SecurityError');
        },
      });
      try {
        expect(() => run()).not.toThrow();
      } finally {
        Object.defineProperty(window, 'localStorage', original);
      }
      expect(attribute()).toBe('dark');
    });
  });
});
