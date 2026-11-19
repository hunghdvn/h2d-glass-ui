import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasOpenPopover, OPEN_POPOVER_CLOSES_ON_ESC } from './popover';

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

/** A root with one popover of each kind; `data-shown` marks the open ones. */
function popovers(shown: Array<'auto' | 'hint' | 'manual'>) {
  const root = document.createElement('div');
  for (const kind of ['auto', 'hint', 'manual'] as const) {
    const popover = document.createElement('div');
    popover.setAttribute('popover', kind);
    if (shown.includes(kind)) popover.setAttribute('data-shown', '');
    root.append(popover);
  }
  document.body.append(root);
  // jsdom shows no popover, so nothing matches `:popover-open`: the lookup reads the attribute in its
  // place; the rest of the selector is the library's own.
  const querySelector = Element.prototype.querySelector;
  vi.spyOn(root, 'querySelector').mockImplementation(function (this: Element, selector: string) {
    return querySelector.call(this, selector.replaceAll(':popover-open', '[data-shown]'));
  } as typeof Element.prototype.querySelector);
  return root;
}

describe('hasOpenPopover', () => {
  it('finds an open auto or hint popover, which Esc and a press outside close', () => {
    expect(hasOpenPopover(popovers(['auto']))).toBe(true);
    expect(hasOpenPopover(popovers(['hint']))).toBe(true);
  });

  it('leaves out a manual popover, and a closed one', () => {
    expect(hasOpenPopover(popovers(['manual']))).toBe(false);
    expect(hasOpenPopover(popovers([]))).toBe(false);
  });

  it('is false where the engine does not know `:popover-open` and throws on it', () => {
    const root = document.createElement('div');
    vi.spyOn(root, 'querySelector').mockImplementation((selector: string) => {
      throw new DOMException(`'${selector}' is not a valid selector`, 'SyntaxError');
    });
    expect(hasOpenPopover(root)).toBe(false);
    expect(root.querySelector).toHaveBeenCalledWith(OPEN_POPOVER_CLOSES_ON_ESC);
  });
});
