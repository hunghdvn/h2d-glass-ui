import { act, fireEvent, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import {
  Fragment,
  Profiler,
  StrictMode,
  Suspense,
  lazy,
  memo,
  useState,
  useTransition,
} from 'react';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTROL_SELECTOR } from '../../internal/controls';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
import { getTopModal } from '../../internal/modal-stack';
import { Drawer, DrawerContent } from '../drawer/Drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './Dialog';

// jsdom has no showModal(). This stand-in is just enough for the state logic: it toggles `open` and,
// like a browser, fires `close` in a later task rather than at once.
const original = {
  showModal: HTMLDialogElement.prototype.showModal,
  close: HTMLDialogElement.prototype.close,
};
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    setTimeout(() => this.dispatchEvent(new Event('close')), 0);
  };
});
afterAll(() => Object.assign(HTMLDialogElement.prototype, original));

describe('Dialog', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('stays open when StrictMode mounts it twice', async () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <StrictMode>
        <Dialog defaultOpen onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogContent>
        </Dialog>
      </StrictMode>,
    );
    // The late `close` event of StrictMode's first, simulated unmount must not close it again.
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(container.querySelector('dialog')).toHaveAttribute('open');
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('warns when it has no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Dialog defaultOpen>
        <DialogContent>Unnamed</DialogContent>
      </Dialog>,
    );
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      WARN_PREFIX +
        ' <DialogContent> needs a name: render a DialogTitle inside it, or pass ' +
        'aria-label or aria-labelledby.',
    );
  });

  it('does not warn when a title or aria-label names it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getByRole } = render(
      <>
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogContent>
        </Dialog>
        <Dialog defaultOpen>
          <DialogContent aria-label="Share">Link</DialogContent>
        </Dialog>
      </>,
    );
    expect(warn).not.toHaveBeenCalled();
    expect(getByRole('dialog', { name: 'Edit profile' })).toBeInTheDocument();
  });

  it('closes for good when it closes natively and React renders before the close event', async () => {
    let renderAgain: () => void = () => {};
    function Page() {
      const [count, setCount] = useState(0);
      renderAgain = () => setCount((n) => n + 1);
      return (
        <Dialog defaultOpen>
          <DialogContent data-count={count}>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogContent>
        </Dialog>
      );
    }
    const { container } = render(<Page />);
    const dialog = container.querySelector('dialog') as HTMLDialogElement;
    // A `<form method="dialog">` closed it, and a re-render lands before its `close` event.
    act(() => {
      dialog.close();
      renderAgain();
    });
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(dialog).not.toHaveAttribute('open');
    expect(document.documentElement.style.overflow).toBe('');
    expect(getTopModal()).toBeUndefined();
  });

  it("stays open on Esc when the consumer's onCancel prevents it", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <DialogContent onCancel={(event) => event.preventDefault()}>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const dialog = container.querySelector('dialog') as HTMLDialogElement;
    // What the browser fires on Esc, before it closes the dialog.
    act(() => {
      dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    });
    expect(dialog).toHaveAttribute('open');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('opens again, once, when a controlled parent refuses a native close', async () => {
    const onOpenChange = vi.fn();
    let renderAgain: () => void = () => {};
    function Page() {
      const [count, setCount] = useState(0);
      renderAgain = () => setCount((n) => n + 1);
      return (
        <Dialog open onOpenChange={onOpenChange}>
          <DialogContent data-count={count}>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogContent>
        </Dialog>
      );
    }
    const { container, unmount } = render(<Page />);
    const dialog = container.querySelector('dialog') as HTMLDialogElement;
    act(() => {
      dialog.close();
      renderAgain();
    });
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(dialog).toHaveAttribute('open');
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    unmount();
    expect(document.documentElement.style.overflow).toBe('');
    expect(getTopModal()).toBeUndefined();
  });

  it('renders a header with dangerouslySetInnerHTML as it is given, as before', () => {
    const { getByTestId } = render(
      <Dialog defaultOpen>
        <DialogContent aria-label="Notice">
          <DialogHeader
            data-testid="header"
            dangerouslySetInnerHTML={{ __html: '<h2>Notice</h2>' }}
          />
        </DialogContent>
      </Dialog>,
    );
    expect(getByTestId('header').innerHTML).toBe('<h2>Notice</h2>');
  });
});

// The movable dialog (spec phase 6 §3.4). jsdom has no layout, no ResizeObserver and no matchMedia,
// so each is stood in for. The frame is 1000x800 and the panel 400x300, centred, which puts the panel
// at 300,250 when it has not been moved and gives these limits for its offset, with the 16px of the
// frame's padding (dialog.css, set on the style here) left: x from -284 to 284, y from -234 to 234.
describe('DialogContent movable', () => {
  const FRAME = { width: 1000, height: 800 };
  const PANEL = { width: 400, height: 300 };
  const LIMIT = { x: 284, y: 234 };
  const base = { pointerId: 1, isPrimary: true, pointerType: 'mouse', button: 0 };

  /** What `ResizeObserver` does in a browser, driven by hand: `resize()` reports to every observer. */
  const observers: Array<{ observed: Set<Element>; callback: ResizeObserverCallback }> = [];
  const resize = () =>
    act(() => {
      for (const { callback, observed } of observers) {
        callback(
          Array.from(observed, (target) => ({ target }) as ResizeObserverEntry),
          {} as ResizeObserver,
        );
      }
    });
  let wide: { matches: boolean; listeners: Set<() => void> };
  const setWide = (matches: boolean) =>
    act(() => {
      wide.matches = matches;
      wide.listeners.forEach((listener) => listener());
    });

  // The animation frames the primitive coalesces moves into, run by hand so a test decides when one
  // passes.
  let frames: Map<number, FrameRequestCallback>;
  let nextFrame: number;
  const runFrames = () => {
    const due = [...frames.values()];
    frames.clear();
    act(() => due.forEach((callback) => callback(0)));
  };

  beforeEach(() => {
    resetDevWarnings();
    observers.length = 0;
    frames = new Map();
    nextFrame = 1;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(nextFrame, callback);
      return nextFrame++;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    wide = { matches: true, listeners: new Set() };
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        get matches() {
          return wide.matches;
        },
        addEventListener: (_type: string, listener: () => void) => wide.listeners.add(listener),
        removeEventListener: (_type: string, listener: () => void) =>
          wide.listeners.delete(listener),
      })),
    );
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observed = new Set<Element>();
        constructor(readonly callback: ResizeObserverCallback) {
          observers.push(this);
        }
        observe(target: Element) {
          this.observed.add(target);
        }
        disconnect() {
          this.observed.clear();
        }
      },
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    FRAME.width = 1000;
    FRAME.height = 800;
    PANEL.height = 300;
  });

  /** Gives the frame and the panel the sizes a browser would, and moves the panel with its variables. */
  function layout(dialog: HTMLElement, panel: HTMLElement) {
    const define = (element: HTMLElement, name: string, get: () => number) =>
      Object.defineProperty(element, name, { configurable: true, get });
    // The padding of `.flg-dialog`, which jsdom does not read from the style sheet.
    dialog.style.padding = '16px';
    define(dialog, 'clientWidth', () => FRAME.width);
    define(dialog, 'clientHeight', () => FRAME.height);
    define(panel, 'offsetWidth', () => PANEL.width);
    define(panel, 'offsetHeight', () => PANEL.height);
    panel.getBoundingClientRect = () => {
      const x = Number.parseFloat(panel.style.getPropertyValue('--flg-dialog-x') || '0');
      const y = Number.parseFloat(panel.style.getPropertyValue('--flg-dialog-y') || '0');
      const left = (FRAME.width - PANEL.width) / 2 + x;
      const top = (FRAME.height - PANEL.height) / 2 + y;
      return {
        left,
        top,
        right: left + PANEL.width,
        bottom: top + PANEL.height,
        width: PANEL.width,
        height: PANEL.height,
        x: left,
        y: top,
        toJSON: () => ({}),
      };
    };
  }

  /** A dialog with a header that holds a title and the interactive things a press must leave alone. */
  function setup(movable = true) {
    const view = render(
      <Dialog defaultOpen>
        <DialogContent movable={movable}>
          <DialogHeader data-testid="header">
            <DialogTitle>Edit order</DialogTitle>
            <button type="button">Help</button>
            <span role="button" tabIndex={0}>
              Focusable
            </span>
            <label>
              Label <input />
            </label>
            {/* A menu that renders in place, and a part that a portal renders elsewhere. */}
            <div popover="auto">
              <div role="menuitem" tabIndex={-1}>
                Copy
              </div>
            </div>
            {createPortal(<span>Elsewhere</span>, document.body)}
          </DialogHeader>
          <p>Body</p>
        </DialogContent>
      </Dialog>,
    );
    const dialog = view.container.querySelector('dialog') as HTMLDialogElement;
    const panel = dialog.querySelector('.flg-dialog-panel') as HTMLElement;
    layout(dialog, panel);
    const offset = () => [
      panel.style.getPropertyValue('--flg-dialog-x'),
      panel.style.getPropertyValue('--flg-dialog-y'),
    ];
    return {
      ...view,
      dialog,
      panel,
      offset,
      header: view.getByTestId('header'),
      title: view.getByText('Edit order'),
    };
  }
  type Setup = ReturnType<typeof setup>;

  /** A dialog with nothing in its header but the title, for the tests that need no more. */
  function setupPlain(props: { onOpenChange?: () => void; style?: object } = {}) {
    const view = render(
      <Dialog defaultOpen onOpenChange={props.onOpenChange}>
        <DialogContent movable style={props.style}>
          <DialogHeader>
            <DialogTitle>Edit order</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    const dialog = view.container.querySelector('dialog') as HTMLDialogElement;
    const panel = dialog.querySelector('.flg-dialog-panel') as HTMLElement;
    layout(dialog, panel);
    return { ...view, dialog, panel, title: view.getByText('Edit order') };
  }

  const press = (el: Element, x = 500, y = 260, init: PointerEventInit = {}) =>
    fireEvent.pointerDown(el, { ...base, buttons: 1, clientX: x, clientY: y, ...init });
  // The main button is down for every move of a press: the primitive takes a move with none for a
  // release that it did not hear.
  const move = (x: number, y: number) =>
    fireEvent.pointerMove(document, { ...base, buttons: 1, clientX: x, clientY: y });
  const release = (x: number, y: number) =>
    fireEvent.pointerUp(document, { ...base, clientX: x, clientY: y });

  it('puts data-movable on the panel and the grip first in the header', () => {
    const { panel, header } = setup();
    expect(panel).toHaveAttribute('data-movable');
    expect(header).toHaveClass('flg-card-header', 'flg-dialog-header');
    expect(header).toHaveAttribute('data-movable');
    const grip = header.firstElementChild as SVGElement;
    expect(grip.tagName.toLowerCase()).toBe('svg');
    expect(grip).toHaveClass('flg-dialog-grip');
    expect(grip).toHaveAttribute('aria-hidden', 'true');
  });

  it('leaves a dialog that is not movable as it was, bar the class of its header', () => {
    const { panel, header, title, offset } = setup(false);
    expect(panel).not.toHaveAttribute('data-movable');
    expect(header).toHaveClass('flg-card-header', 'flg-dialog-header');
    expect(header).not.toHaveAttribute('data-movable');
    expect(header.querySelector('.flg-dialog-grip')).toBeNull();
    expect(header.firstElementChild).toBe(title);
    expect(press(title)).toBe(true);
    move(560, 320);
    expect(offset()).toEqual(['', '']);
  });

  it('a press on the header becomes a drag only when the pointer is 3px away', () => {
    const { dialog, title, offset } = setup();
    press(title);
    move(502, 260);
    // 2px and 2px is 2.8px away, still under; 3px along one axis is the threshold.
    move(502, 262);
    expect(dialog).not.toHaveAttribute('data-dragging');
    expect(offset()).toEqual(['', '']);
    move(503, 260);
    expect(dialog).toHaveAttribute('data-dragging');
    release(503, 260);
    expect(dialog).not.toHaveAttribute('data-dragging');
  });

  it('moves the panel with the pointer through two properties, and keeps it where it is let go', () => {
    const { dialog, title, offset } = setup();
    press(title, 500, 260);
    move(540, 300);
    // The event that crosses the threshold moves the panel at once; the next ones wait for a frame.
    expect(dialog).toHaveAttribute('data-dragging');
    expect(offset()).toEqual(['40px', '40px']);
    move(520, 250);
    runFrames();
    expect(offset()).toEqual(['20px', '-10px']);
    release(520, 250);
    expect(dialog).not.toHaveAttribute('data-dragging');
    expect(offset()).toEqual(['20px', '-10px']);
  });

  it('continues from where the last drag left the panel', () => {
    const { title, offset } = setup();
    press(title, 500, 260);
    move(540, 300);
    release(540, 300);
    press(title, 500, 260);
    move(510, 270);
    expect(offset()).toEqual(['50px', '50px']);
    release(510, 270);
  });

  it('stops the panel 16px from each edge of the frame', () => {
    const { title, offset, panel } = setup();
    press(title, 500, 260);
    move(5000, 5000);
    expect(offset()).toEqual([`${LIMIT.x}px`, `${LIMIT.y}px`]);
    expect(panel.getBoundingClientRect().right).toBe(FRAME.width - 16);
    expect(panel.getBoundingClientRect().bottom).toBe(FRAME.height - 16);
    move(-5000, -5000);
    runFrames();
    expect(offset()).toEqual([`${-LIMIT.x}px`, `${-LIMIT.y}px`]);
    expect(panel.getBoundingClientRect().left).toBe(16);
    expect(panel.getBoundingClientRect().top).toBe(16);
    release(-5000, -5000);
  });

  it('keeps the margin that the padding of the frame gives, side by side', () => {
    const { title, panel, dialog } = setup();
    // A theme that pads the frame otherwise: top, right, bottom, left.
    dialog.style.padding = '10px 20px 30px 40px';
    press(title, 500, 260);
    move(5000, 5000);
    expect(panel.getBoundingClientRect().right).toBe(FRAME.width - 20);
    expect(panel.getBoundingClientRect().bottom).toBe(FRAME.height - 30);
    release(5000, 5000);
    press(title, 500, 260);
    move(-5000, -5000);
    expect(panel.getBoundingClientRect().left).toBe(40);
    expect(panel.getBoundingClientRect().top).toBe(10);
    release(-5000, -5000);
  });

  it('clamps again when the window or the panel changes size', () => {
    const { title, offset } = setup();
    const observed = observers.flatMap(({ observed }) => [...observed]);
    expect(observed.map((element) => element.tagName).sort()).toEqual(['DIALOG', 'DIV']);
    press(title, 500, 260);
    move(5000, 5000);
    release(5000, 5000);
    expect(offset()).toEqual([`${LIMIT.x}px`, `${LIMIT.y}px`]);
    // A window 200px narrower and 100px shorter: the room to the right shrinks by 100px, below by 50px.
    FRAME.width = 800;
    FRAME.height = 700;
    resize();
    expect(offset()).toEqual(['184px', '184px']);
    // A panel 100px taller has 50px less room below.
    PANEL.height = 400;
    resize();
    expect(offset()).toEqual(['184px', '134px']);
  });

  it('leaves a panel that has not been moved alone when it is measured', () => {
    const { offset } = setup();
    resize();
    expect(offset()).toEqual(['', '']);
  });

  it('goes back to the middle on a double click on the header, and removes what it set', () => {
    const { title, offset, panel } = setup();
    press(title, 500, 260);
    move(540, 300);
    release(540, 300);
    fireEvent.doubleClick(title);
    expect(offset()).toEqual(['', '']);
    expect(panel.getAttribute('style') ?? '').not.toContain('--flg-dialog');
  });

  it('keeps what the caller put in the style of the panel', () => {
    const { title, panel } = setupPlain({ style: { width: 333 } });
    press(title, 500, 260);
    move(540, 300);
    release(540, 300);
    expect(panel.style.width).toBe('333px');
    fireEvent.doubleClick(title);
    expect(panel.style.width).toBe('333px');
    expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('');
  });

  it.each([
    ['a button', (view: Setup) => view.getByRole('button', { name: 'Help' })],
    ['a focusable element', (view: Setup) => view.getByText('Focusable')],
    ['a label', (view: Setup) => view.getByText('Label')],
    ['an input', (view: Setup) => view.container.querySelector('input') as HTMLElement],
    ['an item of a menu', (view: Setup) => view.getByText('Copy')],
    ['a part in a portal', (view: Setup) => view.getByText('Elsewhere')],
  ])('does not drag from %s in the header, nor centre on its double click', (_name, find) => {
    const view = setup();
    const target = find(view);
    // The mousedown of a press that the drag takes is cancelled; this one is left to the browser.
    expect(press(target)).toBe(true);
    expect(fireEvent.mouseDown(target)).toBe(true);
    move(560, 320);
    expect(view.dialog).not.toHaveAttribute('data-dragging');
    expect(view.offset()).toEqual(['', '']);
    release(560, 320);
    press(view.title, 500, 260);
    move(540, 300);
    release(540, 300);
    fireEvent.doubleClick(target);
    expect(view.offset()).toEqual(['40px', '40px']);
  });

  it('cancels the mousedown of a press, not its pointerdown, so focus and the selection stay', () => {
    const { title } = setup();
    // The pointerdown goes on to every handler above, the dialog's own among them; the mousedown
    // after it is where the browser moves the focus and starts a selection.
    expect(press(title)).toBe(true);
    expect(fireEvent.mouseDown(title)).toBe(false);
    // Another button is not a press of the header.
    expect(fireEvent.mouseDown(title, { button: 2 })).toBe(true);
  });

  it.each([
    ['is a right click on Apple', 'MacIntel', true],
    ['is a plain press elsewhere', 'Win32', false],
  ])('leaves the mousedown alone with Ctrl, which %s', (_name, platform, kept) => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);
    const { title } = setup();
    expect(fireEvent.mouseDown(title, { ctrlKey: true })).toBe(kept);
  });

  it("runs the dialog's own press handler for a press on the header", () => {
    const onOpenChange = vi.fn();
    const { title, dialog } = setupPlain({ onOpenChange });
    // A press on the frame whose click never came (let go outside the window, say)...
    fireEvent.pointerDown(dialog, { ...base, buttons: 1 });
    // ...then a press on the header, let go on the frame: the browser sends the click to the frame,
    // which holds both. That press was not on the frame, so this is not a click outside the panel.
    press(title, 500, 260);
    fireEvent.pointerUp(dialog, { ...base });
    fireEvent.click(dialog);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it.each([
    ['a secondary button', { button: 2 }],
    ['a second pointer', { isPrimary: false }],
  ])('ignores %s', (_name, init) => {
    const { title, offset, dialog } = setup();
    expect(press(title, 500, 260, init)).toBe(true);
    move(560, 320);
    expect(offset()).toEqual(['', '']);
    expect(dialog).not.toHaveAttribute('data-dragging');
  });

  it.each(['touch', 'pen'])('drags with a %s as with a mouse', (pointerType) => {
    const { title, offset } = setup();
    const pressed = { ...base, buttons: 1, pointerType };
    fireEvent.pointerDown(title, { ...pressed, clientX: 500, clientY: 260 });
    fireEvent.pointerMove(document, { ...pressed, clientX: 540, clientY: 300 });
    expect(offset()).toEqual(['40px', '40px']);
    fireEvent.pointerUp(document, { ...base, pointerType, clientX: 540, clientY: 300 });
  });

  it('keeps the position when the browser takes the pointer (pointercancel)', () => {
    const { title, offset, dialog } = setup();
    press(title, 500, 260);
    move(540, 300);
    fireEvent.pointerCancel(document, { ...base, clientX: 540, clientY: 300 });
    expect(dialog).not.toHaveAttribute('data-dragging');
    expect(offset()).toEqual(['40px', '40px']);
  });

  it('leaves Esc to close the dialog, and the drag ends with the panel', async () => {
    const onOpenChange = vi.fn();
    const { title, dialog } = setupPlain({ onOpenChange });
    press(title, 500, 260);
    move(540, 300);
    // The key is not taken by the drag.
    expect(fireEvent.keyDown(document, { key: 'Escape' })).toBe(true);
    expect(dialog).toHaveAttribute('data-dragging');
    // What the browser does with it next.
    act(() => {
      dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    });
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(dialog).not.toHaveAttribute('open');
    expect(dialog).not.toHaveAttribute('data-dragging');
    release(540, 300);
    expect(dialog).not.toHaveAttribute('data-dragging');
  });

  it('is not an outside click when the drag is let go on the frame', () => {
    const onOpenChange = vi.fn();
    const { title, dialog } = setupPlain({ onOpenChange });
    press(title, 500, 260);
    move(540, 300);
    fireEvent.pointerUp(dialog, { ...base, clientX: 900, clientY: 700 });
    fireEvent.click(dialog);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('does not drag below 640px, and the panel goes to the middle when the window narrows', () => {
    const { title, offset, panel, dialog } = setup();
    press(title, 500, 260);
    move(540, 300);
    expect(offset()).toEqual(['40px', '40px']);
    setWide(false);
    // The drag in flight stops, and what it set is gone.
    expect(offset()).toEqual(['', '']);
    expect(panel.getAttribute('style') ?? '').not.toContain('--flg-dialog');
    expect(dialog).not.toHaveAttribute('data-dragging');
    move(600, 360);
    expect(offset()).toEqual(['', '']);
    release(600, 360);
    // A press now does nothing, and is not cancelled: the browser keeps its own behaviour.
    expect(press(title)).toBe(true);
    expect(fireEvent.mouseDown(title)).toBe(true);
    move(560, 320);
    expect(offset()).toEqual(['', '']);
    release(560, 320);
    // Wide again: still in the middle, and it drags.
    setWide(true);
    expect(offset()).toEqual(['', '']);
    press(title, 500, 260);
    move(540, 300);
    expect(offset()).toEqual(['40px', '40px']);
    release(540, 300);
  });

  it('does not drag where there is no matchMedia, as on the server', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { title, offset } = setup();
    expect(press(title)).toBe(true);
    expect(fireEvent.mouseDown(title)).toBe(true);
    move(560, 320);
    expect(offset()).toEqual(['', '']);
  });

  it('drags on when the pointer cannot be captured', () => {
    const { title, offset, header } = setup();
    header.setPointerCapture = () => {
      throw new DOMException('no such pointer', 'NotFoundError');
    };
    press(title, 500, 260);
    move(540, 300);
    expect(offset()).toEqual(['40px', '40px']);
    release(540, 300);
  });

  it('starts in the middle each time it opens', () => {
    function Page() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setOpen((value) => !value)}>
            Toggle
          </button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent movable>
              <DialogHeader>
                <DialogTitle>Edit order</DialogTitle>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </>
      );
    }
    const view = render(<Page />);
    const dialog = view.container.querySelector('dialog') as HTMLDialogElement;
    layout(dialog, dialog.querySelector('.flg-dialog-panel') as HTMLElement);
    press(view.getByText('Edit order'), 500, 260);
    move(540, 300);
    release(540, 300);
    // A click right after the release would be the drag's own, and is not delivered; the user's
    // next click starts with a press of its own.
    const toggle = view.getByText('Toggle');
    const click = () => {
      press(toggle, 20, 20);
      release(20, 20);
      fireEvent.click(toggle);
    };
    // Closed, then open again.
    click();
    click();
    const panel = dialog.querySelector('.flg-dialog-panel') as HTMLElement;
    expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('');
    layout(dialog, panel);
    press(view.getByText('Edit order'), 500, 260);
    move(510, 270);
    // From the middle, not from where the last opening left it.
    expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('10px');
    release(510, 270);
  });

  it('asks for the 640px query only while a movable dialog is open, never without movable', () => {
    const matchMedia = window.matchMedia as unknown as ReturnType<typeof vi.fn>;
    const plain = (open: boolean) => (
      <>
        <Dialog open={open}>
          <DialogContent aria-label="Share">Link</DialogContent>
        </Dialog>
        <Drawer open={open}>
          <DrawerContent aria-label="Filters">Status</DrawerContent>
        </Drawer>
      </>
    );
    const view = render(plain(true));
    view.rerender(plain(false));
    view.rerender(plain(true));
    view.unmount();
    expect(matchMedia).not.toHaveBeenCalled();
    const movable = (open: boolean) => (
      <Dialog open={open}>
        <DialogContent movable aria-label="Edit order">
          <DialogHeader>Edit order</DialogHeader>
        </DialogContent>
      </Dialog>
    );
    const closed = render(movable(false));
    expect(matchMedia).not.toHaveBeenCalled();
    closed.rerender(movable(true));
    expect(matchMedia).toHaveBeenCalledExactlyOnceWith('(min-width: 640px)');
  });

  it('does not render React for each move', () => {
    let commits = 0;
    const view = render(
      <Profiler id="dialog" onRender={() => (commits += 1)}>
        <Dialog defaultOpen>
          <DialogContent movable>
            <DialogHeader>
              <DialogTitle>Edit order</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </Profiler>,
    );
    const dialog = view.container.querySelector('dialog') as HTMLDialogElement;
    layout(dialog, dialog.querySelector('.flg-dialog-panel') as HTMLElement);
    const before = commits;
    press(view.getByText('Edit order'), 500, 260);
    for (let step = 1; step <= 10; step += 1) move(500 + step * 10, 260 + step * 5);
    runFrames();
    release(600, 310);
    expect(commits).toBe(before);
  });

  it('gives its own pointer in the CSS to the very controls that a press leaves alone', () => {
    const css = readFileSync('src/styles/components/dialog.css', 'utf8');
    const list = /:where\(\.flg-dialog-header\[data-movable\]\)\s*:where\(([^{]*)\)\s*\{/.exec(css);
    expect(list).not.toBeNull();
    const names = (selectors: string) => selectors.split(',').map((selector) => selector.trim());
    expect(names(list![1]!)).toEqual(names(CONTROL_SELECTOR));
  });

  it('hands the header the same handlers on each render, so a header set apart renders once', () => {
    let headerCommits = 0;
    // A header that its parent does not render again: only the context can.
    const Header = memo(function Header() {
      return (
        <Profiler id="header" onRender={() => (headerCommits += 1)}>
          <DialogHeader>
            <DialogTitle>Edit order</DialogTitle>
          </DialogHeader>
        </Profiler>
      );
    });
    const page = () => (
      <Dialog defaultOpen>
        <DialogContent movable>
          <Header />
        </DialogContent>
      </Dialog>
    );
    const view = render(page());
    const mounted = headerCommits;
    view.rerender(page());
    view.rerender(page());
    expect(headerCommits).toBe(mounted);
  });

  it('goes by what was committed, not by a render that React set aside', async () => {
    // A transition that would close the dialog renders it closed, then suspends on a part that never
    // loads: React keeps the open dialog on the screen and drops that render.
    const Never = lazy(() => new Promise<never>(() => {}));
    let close = () => {};
    function Page() {
      const [open, setOpen] = useState(true);
      const [, startTransition] = useTransition();
      close = () => startTransition(() => setOpen(false));
      return (
        <>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent movable>
              <DialogHeader>
                <DialogTitle>Edit order</DialogTitle>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          {open ? null : <Never />}
        </>
      );
    }
    const view = render(<Page />);
    const dialog = view.container.querySelector('dialog') as HTMLDialogElement;
    const panel = dialog.querySelector('.flg-dialog-panel') as HTMLElement;
    layout(dialog, panel);
    await act(async () => close());
    expect(dialog).toHaveAttribute('open');
    press(view.getByText('Edit order'), 500, 260);
    move(540, 300);
    expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('40px');
    release(540, 300);
  });

  it("keeps the caller's own onPointerDown and onDoubleClick, and lets them refuse", () => {
    const onPointerDown = vi.fn();
    const onDoubleClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const view = render(
      <Dialog defaultOpen>
        <DialogContent movable>
          <DialogHeader onPointerDown={onPointerDown} onDoubleClick={onDoubleClick}>
            <DialogTitle>Edit order</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    const dialog = view.container.querySelector('dialog') as HTMLDialogElement;
    const panel = dialog.querySelector('.flg-dialog-panel') as HTMLElement;
    layout(dialog, panel);
    const title = view.getByText('Edit order');
    press(title, 500, 260);
    move(540, 300);
    release(540, 300);
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    fireEvent.doubleClick(title);
    expect(onDoubleClick).toHaveBeenCalledTimes(1);
    // The caller refused the double click, so the panel stays where it is.
    expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('40px');
  });

  describe('the warning for a missing DialogHeader', () => {
    const NO_HEADER =
      WARN_PREFIX + ' <DialogContent movable> needs a <DialogHeader> to drag it by.';

    it.each([
      [
        'it closes',
        (view: ReturnType<typeof render>, page: (open: boolean) => ReactElement) =>
          view.rerender(page(false)),
      ],
      ['it unmounts', (view: ReturnType<typeof render>) => view.unmount()],
    ])('is given once, when an opening with no header ends: %s', (_name, end) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const page = (open: boolean) => (
        <Dialog open={open}>
          <DialogContent movable>
            <DialogTitle>Edit order</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      const view = render(page(true));
      // Not on opening: a header may still come.
      expect(warn).not.toHaveBeenCalled();
      end(view, page);
      expect(warn).toHaveBeenCalledExactlyOnceWith(NO_HEADER);
    });

    it.each([
      ['', Fragment],
      // Its simulated unmount, right after the opening, does not end the opening.
      [' under StrictMode', StrictMode],
    ])('is not given for a header that comes after the opening%s', async (_name, Wrapper) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      let load: (module: { default: () => ReactElement }) => void = () => {};
      // A header behind a part that loads later, as with Suspense or a loading state.
      const LateHeader = lazy(
        () => new Promise<{ default: () => ReactElement }>((resolve) => (load = resolve)),
      );
      const view = render(
        <Wrapper>
          <Dialog defaultOpen>
            <DialogContent movable aria-label="Edit order">
              <Suspense fallback={<p>Loading</p>}>
                <LateHeader />
              </Suspense>
            </DialogContent>
          </Dialog>
        </Wrapper>,
      );
      await act(async () =>
        load({
          default: () => (
            <DialogHeader>
              <DialogTitle>Edit order</DialogTitle>
            </DialogHeader>
          ),
        }),
      );
      expect(view.getByText('Edit order')).toBeInTheDocument();
      view.unmount();
      expect(warn).not.toHaveBeenCalledWith(NO_HEADER);
    });

    it("is given for a movable dialog whose only header is a nested dialog's", () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const view = render(
        <Dialog defaultOpen>
          <DialogContent movable aria-label="Edit order">
            <Dialog defaultOpen>
              <DialogContent aria-label="Delete it?">
                <DialogHeader>
                  <DialogTitle>Delete it?</DialogTitle>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </DialogContent>
        </Dialog>,
      );
      view.unmount();
      expect(warn).toHaveBeenCalledExactlyOnceWith(NO_HEADER);
    });

    it('is not given for a movable dialog with a header, nor for one that never opened', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const view = setup();
      const closed = render(
        <Dialog>
          <DialogContent movable>
            <DialogTitle>Closed</DialogTitle>
          </DialogContent>
        </Dialog>,
      );
      view.unmount();
      closed.unmount();
      expect(warn).not.toHaveBeenCalled();
    });
  });

  it('lets go of what it took when the dialog unmounts in the middle of a drag', () => {
    const { title, unmount, dialog } = setup();
    const remove = vi.spyOn(document, 'removeEventListener');
    press(title, 500, 260);
    move(540, 300);
    unmount();
    expect(remove).toHaveBeenCalledWith('pointermove', expect.any(Function), true);
    expect(remove).toHaveBeenCalledWith('pointerup', expect.any(Function), true);
    expect(dialog).not.toHaveAttribute('data-dragging');
    // Nothing is left to answer a pointer that is still moving.
    expect(() => move(600, 360)).not.toThrow();
    remove.mockRestore();
  });

  it('drags by a header with dangerouslySetInnerHTML, which draws no grip, and says so once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const page = () => (
      <Dialog defaultOpen>
        <DialogContent movable aria-label="Edit order">
          <DialogHeader
            data-testid="header"
            dangerouslySetInnerHTML={{ __html: '<h2>Edit</h2>' }}
          />
        </DialogContent>
      </Dialog>
    );
    const view = render(page());
    const dialog = view.container.querySelector('dialog') as HTMLDialogElement;
    const panel = dialog.querySelector('.flg-dialog-panel') as HTMLElement;
    layout(dialog, panel);
    const header = view.getByTestId('header');
    expect(header).toHaveAttribute('data-movable');
    expect(header.innerHTML).toBe('<h2>Edit</h2>');
    press(header.firstElementChild as Element, 500, 260);
    move(540, 300);
    expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('40px');
    release(540, 300);
    view.rerender(page());
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      WARN_PREFIX +
        ' <DialogHeader> with dangerouslySetInnerHTML draws no grip in a movable dialog; it still' +
        ' drags.',
    );
  });
});
