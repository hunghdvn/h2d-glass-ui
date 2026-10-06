import { afterEach, describe, expect, it } from 'vitest';
import { registerPopoverReturn, returnFocus } from './focus';

// jsdom shows no popover: every `[popover]` here counts as closed, which is the case under test.
function button(name: string, parent: HTMLElement = document.body): HTMLButtonElement {
  const el = document.createElement('button');
  el.textContent = name;
  parent.append(el);
  return el;
}

function popover(parent: HTMLElement = document.body): HTMLDivElement {
  const el = document.createElement('div');
  el.setAttribute('popover', 'auto');
  parent.append(el);
  return el;
}

describe('returnFocus', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('focuses a target that no closed popover hides', () => {
    const target = button('Target');
    returnFocus(target, null);
    expect(document.activeElement).toBe(target);
  });

  it('hands a target hidden in a closed popover on to where that popover returns focus', () => {
    const trigger = button('Menu');
    const menu = popover();
    const item = button('Delete', menu);
    const unregister = registerPopoverReturn(menu, () => trigger);
    returnFocus(item, null);
    expect(document.activeElement).toBe(trigger);
    unregister();
  });

  it('follows nested popovers outwards', () => {
    const trigger = button('Menu');
    const menu = popover();
    const subTrigger = button('More', menu);
    const sub = popover(menu);
    const item = button('Delete forever', sub);
    const unregisterMenu = registerPopoverReturn(menu, () => trigger);
    const unregisterSub = registerPopoverReturn(sub, () => subTrigger);
    returnFocus(item, null);
    expect(document.activeElement).toBe(trigger);
    unregisterSub();
    unregisterMenu();
  });

  it('keeps the target when nothing resolves it', () => {
    const menu = popover();
    const item = button('Delete', menu);
    // Not registered, or registered with nowhere to go: the target, as before.
    returnFocus(item, null);
    expect(document.activeElement).toBe(item);
    item.blur();
    const unregister = registerPopoverReturn(menu, () => null);
    returnFocus(item, null);
    expect(document.activeElement).toBe(item);
    unregister();
  });

  it('leaves focus that the user moved elsewhere alone', () => {
    const trigger = button('Menu');
    const menu = popover();
    const item = button('Delete', menu);
    const elsewhere = button('Elsewhere');
    const unregister = registerPopoverReturn(menu, () => trigger);
    elsewhere.focus();
    returnFocus(item, null);
    expect(document.activeElement).toBe(elsewhere);
    unregister();
  });
});
