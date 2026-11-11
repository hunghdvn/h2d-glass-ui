import { describe, expect, it, vi } from 'vitest';
import { blockActivation, isPlainClick } from './click';

const click = (init: Partial<Parameters<typeof isPlainClick>[0]> = {}) => ({
  button: 0,
  shiftKey: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  defaultPrevented: false,
  currentTarget: null,
  ...init,
});

/** A link with the attributes given, as the element whose handler hears the click. */
const link = (attributes: Record<string, string>) => {
  const element = document.createElement('a');
  element.href = '/page';
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
};

describe('isPlainClick', () => {
  it('is a click of the main button, with no key held, that no handler has taken', () => {
    expect(isPlainClick(click())).toBe(true);
  });

  it.each([['ctrlKey'], ['metaKey'], ['shiftKey'], ['altKey']] as const)(
    'is not one with %s: the browser opens the link elsewhere, or downloads it',
    (key) => {
      expect(isPlainClick(click({ [key]: true }))).toBe(false);
    },
  );

  it('is not one of another button, nor one that a handler cancelled', () => {
    expect(isPlainClick(click({ button: 1 }))).toBe(false);
    expect(isPlainClick(click({ defaultPrevented: true }))).toBe(false);
  });

  it.each([['_blank'], ['_parent'], ['_top'], ['docs']])(
    'is not one on a link with target="%s", which opens the page outside this tab',
    (target) => {
      expect(isPlainClick(click({ currentTarget: link({ target }) }))).toBe(false);
    },
  );

  it('is not one on a link with download, which saves the page', () => {
    expect(isPlainClick(click({ currentTarget: link({ download: '' }) }))).toBe(false);
    expect(isPlainClick(click({ currentTarget: link({ download: 'report.pdf' }) }))).toBe(false);
  });

  it('is one on a link that opens the page in this tab: no target, an empty one, or _self', () => {
    const links: Array<Record<string, string>> = [
      {},
      { target: '' },
      { target: '_self' },
      { target: '_SELF' },
    ];
    for (const attributes of links) {
      expect(
        isPlainClick(click({ currentTarget: link(attributes) })),
        JSON.stringify(attributes),
      ).toBe(true);
    }
  });
});

describe('blockActivation', () => {
  it('cancels the event and stops it where it is', () => {
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() };
    blockActivation(event);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
  });
});
