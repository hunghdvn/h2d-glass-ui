import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getFocusables,
  getTabbableKinds,
  giveBackControl,
  isFocusableKind,
  isReleased,
  registerPopoverReturn,
  releaseControl,
  returnFocus,
} from './focus';

// jsdom shows no popover: every `[popover]` here counts as closed. Unlike a browser, it still focuses
// an element inside one. `unfocusable` stands in for the browser where a test needs that.
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

/** Makes `el` refuse focus, as a browser does with an element inside a closed popover. */
function unfocusable<T extends HTMLElement>(el: T): T {
  const element: HTMLElement = el;
  vi.spyOn(element, 'focus').mockImplementation(() => undefined);
  return el;
}

describe('returnFocus', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('focuses a target that no closed popover hides', () => {
    const target = button('Target');
    returnFocus(target, null);
    expect(document.activeElement).toBe(target);
  });

  it('focuses a target inside a popover directly when it takes focus', () => {
    // jsdom counts the popover as closed, yet the item takes focus: consumers' tests see focus come
    // back to it, not to the trigger of the popover around it.
    const trigger = button('Menu');
    const menu = popover();
    const item = button('Delete', menu);
    const unregister = registerPopoverReturn(menu, () => trigger);
    returnFocus(item, null);
    expect(document.activeElement).toBe(item);
    unregister();
  });

  it('hands a target hidden in a closed popover on to where that popover returns focus', () => {
    const trigger = button('Menu');
    const menu = popover();
    const item = unfocusable(button('Delete', menu));
    const unregister = registerPopoverReturn(menu, () => trigger);
    returnFocus(item, null);
    expect(document.activeElement).toBe(trigger);
    unregister();
  });

  it('follows nested popovers outwards', () => {
    const trigger = button('Menu');
    const menu = popover();
    const subTrigger = unfocusable(button('More', menu));
    const sub = popover(menu);
    const item = unfocusable(button('Delete forever', sub));
    const unregisterMenu = registerPopoverReturn(menu, () => trigger);
    const unregisterSub = registerPopoverReturn(sub, () => subTrigger);
    returnFocus(item, null);
    expect(document.activeElement).toBe(trigger);
    unregisterSub();
    unregisterMenu();
  });

  it('stops at the first element on the way that takes focus', () => {
    // A closed submenu inside a menu that is still open: focus goes to the submenu's trigger.
    const trigger = button('Menu');
    const menu = popover();
    const subTrigger = button('More', menu);
    const sub = popover(menu);
    const item = unfocusable(button('Delete forever', sub));
    const unregisterMenu = registerPopoverReturn(menu, () => trigger);
    const unregisterSub = registerPopoverReturn(sub, () => subTrigger);
    returnFocus(item, null);
    expect(document.activeElement).toBe(subTrigger);
    unregisterSub();
    unregisterMenu();
  });

  it('leaves focus where it is when nothing resolves a hidden target', () => {
    const menu = popover();
    const item = unfocusable(button('Delete', menu));
    // Not registered, or registered with nowhere to go.
    returnFocus(item, null);
    expect(document.activeElement).toBe(document.body);
    const unregister = registerPopoverReturn(menu, () => null);
    returnFocus(item, null);
    expect(document.activeElement).toBe(document.body);
    unregister();
  });

  it('gives up after 16 steps when two popovers send focus to each other', () => {
    const first = popover();
    const second = popover();
    const inFirst = unfocusable(button('One', first));
    const inSecond = unfocusable(button('Two', second));
    const unregisterFirst = registerPopoverReturn(first, () => inSecond);
    const unregisterSecond = registerPopoverReturn(second, () => inFirst);
    returnFocus(inFirst, null);
    expect(document.activeElement).toBe(document.body);
    expect(inFirst.focus).toHaveBeenCalledTimes(8);
    expect(inSecond.focus).toHaveBeenCalledTimes(8);
    unregisterSecond();
    unregisterFirst();
  });

  it('hands the fallback on the same way when the target has left the document', () => {
    const trigger = button('Menu');
    const menu = popover();
    const unregister = registerPopoverReturn(menu, () => trigger);
    const gone = button('Gone');
    gone.remove();
    returnFocus(gone, null, unfocusable(button('Rename', menu)));
    expect(document.activeElement).toBe(trigger);
    // A fallback that takes focus gets it, popover around it or not.
    trigger.blur();
    const item = button('Duplicate', menu);
    returnFocus(gone, null, item);
    expect(document.activeElement).toBe(item);
    unregister();
  });

  it('leaves focus that the user moved elsewhere alone', () => {
    const trigger = button('Menu');
    const menu = popover();
    const item = unfocusable(button('Delete', menu));
    const elsewhere = button('Elsewhere');
    const unregister = registerPopoverReturn(menu, () => trigger);
    elsewhere.focus();
    returnFocus(item, null);
    expect(document.activeElement).toBe(elsewhere);
    unregister();
  });
});

// A container that keeps its controls out of the Tab order (a grid has one Tab stop) sets their
// `tabindex` to -1 and marks them as released (`releaseControl`). `getFocusables` counts them
// when asked to, so that what the container's own widget mode looks for is found whatever the
// `tabindex` says now; asked nothing, it says the Tab order as it is.
describe('getFocusables', () => {
  afterEach(() => {
    for (const element of document.body.querySelectorAll('*')) giveBackControl(element);
    document.body.replaceChildren();
    Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  });

  function cellWith(html: string): HTMLElement {
    // jsdom has no layout, so every element would count as not shown.
    HTMLElement.prototype.checkVisibility = () => true;
    const cell = document.createElement('div');
    cell.innerHTML = html;
    document.body.append(cell);
    return cell;
  }

  it('finds what Tab reaches, in order, and leaves out what has a negative tabindex', () => {
    const cell = cellWith(
      '<a href="#a" id="a">a</a><button id="b" tabindex="-1">b</button><button id="c">c</button>',
    );
    expect(getFocusables(cell).map((el) => el.id)).toEqual(['a', 'c']);
  });

  it('finds the elements that were released when asked, though their tabindex is negative now', () => {
    const cell = cellWith(
      '<a href="#a" id="a" tabindex="-1">a</a><button id="b" tabindex="-1">b</button>' +
        '<div id="c" tabindex="-1">c</div>',
    );
    releaseControl(cell.querySelector('#a')!);
    releaseControl(cell.querySelector('#c')!);
    expect(getFocusables(cell, { released: true }).map((el) => el.id)).toEqual(['a', 'c']);
    // The one that was not released keeps what it says: it is not a Tab stop.
    expect(getFocusables(cell).map((el) => el.id)).toEqual([]);
  });

  it('still leaves out a released element that is disabled, hidden or inert', () => {
    const cell = cellWith(
      '<button id="a" tabindex="-1" disabled>a</button><div inert><button id="b" tabindex="-1">b</button></div>' +
        '<button id="c" tabindex="-1">c</button>',
    );
    for (const button of cell.querySelectorAll('button')) releaseControl(button);
    expect(getFocusables(cell, { released: true }).map((el) => el.id)).toEqual(['c']);
    HTMLElement.prototype.checkVisibility = function (this: HTMLElement) {
      return this.id !== 'c';
    };
    expect(getFocusables(cell, { released: true })).toEqual([]);
  });

  it('says the Tab order as it is when asked nothing: a control one grid released is no stop', () => {
    const cell = cellWith('<button id="a" tabindex="-1">a</button><button id="b">b</button>');
    const control = cell.querySelector('#a')!;
    releaseControl(control);
    expect(isReleased(control)).toBe(true);
    // What a dialog or a menu looks for, which knows nothing of the grid.
    expect(getFocusables(cell).map((el) => el.id)).toEqual(['b']);
    expect(getFocusables(cell, { released: true }).map((el) => el.id)).toEqual(['a', 'b']);
    giveBackControl(control);
    expect(isReleased(control)).toBe(false);
    expect(getFocusables(cell, { released: true }).map((el) => el.id)).toEqual(['b']);
  });
});

describe('getTabbableKinds', () => {
  afterEach(() => document.body.replaceChildren());

  it('finds every kind of element Tab stops at, shown or not, and not those taken out of the order', () => {
    const cell = document.createElement('div');
    cell.innerHTML =
      '<a href="#a" id="a">a</a><button id="b" disabled>b</button><button id="c" hidden>c</button>' +
      '<input id="d" /><span id="e" tabindex="0"></span><span id="f" tabindex="-1"></span>' +
      '<a id="g">no href</a>';
    document.body.append(cell);
    expect(getTabbableKinds(cell).map((el) => el.id)).toEqual(['a', 'c', 'd', 'e']);
  });
});

describe('isFocusableKind', () => {
  afterEach(() => document.body.replaceChildren());

  const make = (html: string): HTMLElement => {
    document.body.innerHTML = html;
    return document.body.firstElementChild as HTMLElement;
  };

  it('accepts the control kinds whatever their tabindex: a container reaches them with its own keys', () => {
    for (const html of [
      '<button>b</button>',
      '<button tabindex="-1">b</button>',
      '<input tabindex="-1" />',
      '<select tabindex="-1"></select>',
      '<textarea tabindex="-1"></textarea>',
      '<a href="#a" tabindex="-1">a</a>',
      '<div contenteditable tabindex="-1">e</div>',
      '<summary tabindex="-1">s</summary>',
    ]) {
      expect(isFocusableKind(make(html)), html).toBe(true);
    }
  });

  it('refuses a control with the disabled attribute, and an element that is no control kind', () => {
    for (const html of [
      '<button disabled>b</button>',
      '<input type="hidden" />',
      '<a>no href</a>',
      '<span>text</span>',
      '<div contenteditable="false" tabindex="-1">e</div>',
    ]) {
      expect(isFocusableKind(make(html)), html).toBe(false);
    }
  });

  it('accepts an element of no kind only when its tabindex puts it in the Tab order', () => {
    expect(isFocusableKind(make('<span tabindex="0">a stop</span>'))).toBe(true);
    expect(isFocusableKind(make('<span tabindex="2">a stop</span>'))).toBe(true);
    // Nobody can reach it: a `tabindex` of -1 on an element that is no control kind.
    expect(isFocusableKind(make('<span tabindex="-1">skipped</span>'))).toBe(false);
  });
});
