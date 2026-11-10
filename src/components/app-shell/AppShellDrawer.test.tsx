import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { registerModal } from '../../internal/modal-stack';
import { resetDevWarnings } from '../../internal/warn';
import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
  AppShellSidebar,
  AppShellSidebarTrigger,
} from './AppShell';
import type { AppShellProps } from './AppShell';
import { AppShellBrand } from './AppShellBrand';
import { AppShellContext } from './app-shell-context';
import { resize, stubWindow } from '../../../tests/app-shell-window';

// jsdom lays nothing out, so nothing counts as visible and nothing can be focused by `focusFirst`.
beforeEach(() => {
  resetDevWarnings();
  stubWindow(false);
  HTMLElement.prototype.checkVisibility = () => true;
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute('style');
});

const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
const warnings = (warn: ReturnType<typeof spyWarn>) => warn.mock.calls.map((call) => call[0]);

const trigger = () => screen.getByRole('button', { name: 'Open navigation' });
const closeButton = () => screen.getByRole('button', { name: 'Close navigation' });
const sidebar = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('.flg-app-shell-sidebar')!;
const scrim = (container: HTMLElement) => container.querySelector('.flg-app-shell-scrim');
const inertParts = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('.flg-app-shell > *')).filter(
    (child) => child.inert,
  );

function Shell({
  children,
  main,
  ...props
}: { children?: ReactNode; main?: ReactNode } & AppShellProps) {
  return (
    <AppShell {...props}>
      <AppShellHeader>Header</AppShellHeader>
      <AppShellSidebar>
        <a href="#one">One</a>
      </AppShellSidebar>
      <AppShellMain>{main ?? 'Main'}</AppShellMain>
      <AppShellFooter>Footer</AppShellFooter>
      {children}
    </AppShell>
  );
}

/**
 * An open sheet with a popover in the sidebar, open until `close` is called. jsdom shows no popover,
 * so nothing matches `:popover-open`: the sidebar's lookups read an attribute in its place; the rest
 * of the selector is the library's own.
 */
function withPopover(kind: 'auto' | 'manual') {
  const onOpenChange = vi.fn();
  const { container } = render(
    <AppShell defaultOpen onOpenChange={onOpenChange}>
      <AppShellSidebar>
        <div popover={kind} data-shown="">
          A {kind} popover
        </div>
      </AppShellSidebar>
      <AppShellMain>Main</AppShellMain>
    </AppShell>,
  );
  const querySelector = Element.prototype.querySelector;
  vi.spyOn(sidebar(container), 'querySelector').mockImplementation(function (
    this: Element,
    selector: string,
  ) {
    return querySelector.call(this, selector.replaceAll(':popover-open', '[data-shown]'));
  } as typeof Element.prototype.querySelector);
  const close = () => container.querySelector('[popover]')!.removeAttribute('data-shown');
  return { onOpenChange, container, close };
}

describe('the sidebar as a sheet: what it says and what it shuts out', () => {
  it('is a dialog with a name only while it is open on a narrow screen, and has no `aria-modal`', () => {
    const { container, rerender } = render(<Shell open={false} />);
    expect(sidebar(container)).not.toHaveAttribute('role');
    expect(sidebar(container)).not.toHaveAttribute('aria-label');
    rerender(<Shell open />);
    expect(screen.getByRole('dialog', { name: 'Navigation' })).toBe(sidebar(container));
    expect(sidebar(container)).not.toHaveAttribute('aria-modal');
    rerender(<Shell open={false} />);
    expect(sidebar(container)).not.toHaveAttribute('role');
  });

  it('takes the name from `labels`, and keeps a role and a name the caller gave it', () => {
    const { container } = render(
      <AppShell open labels={{ navigation: 'Menu' }}>
        <AppShellSidebar>x</AppShellSidebar>
      </AppShell>,
    );
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBe(sidebar(container));
    const mine = render(
      <AppShell open>
        <AppShellSidebar aria-label="Sections" role="navigation">
          x
        </AppShellSidebar>
      </AppShell>,
    );
    expect(sidebar(mine.container)).toHaveAttribute('aria-label', 'Sections');
    expect(sidebar(mine.container)).toHaveAttribute('role', 'navigation');
  });

  it('makes the skip link, the header, the main and the footer inert, and nothing else', () => {
    const { container } = render(
      <Shell open>
        <div className="mine">Outside</div>
      </Shell>,
    );
    expect(inertParts(container).map((part) => part.tagName)).toEqual([
      'A',
      'HEADER',
      'MAIN',
      'FOOTER',
    ]);
    expect(inertParts(container)[0]).toHaveClass('flg-app-shell-skip');
    expect(sidebar(container).inert).toBeFalsy();
    expect(container.querySelector<HTMLElement>('.mine')!.inert).toBeFalsy();
  });

  it('releases them when it closes, and when the shell goes away', () => {
    const { container, rerender, unmount } = render(<Shell open />);
    const header = container.querySelector<HTMLElement>('header')!;
    rerender(<Shell open={false} />);
    expect(inertParts(container)).toEqual([]);
    rerender(<Shell open />);
    expect(header.inert).toBe(true);
    unmount();
    expect(header.inert).toBeFalsy();
  });

  it('leaves what the caller made inert as it was', () => {
    const { container, rerender } = render(<Shell open={false} />);
    container.querySelector<HTMLElement>('footer')!.inert = true;
    rerender(<Shell open />);
    rerender(<Shell open={false} />);
    expect(container.querySelector<HTMLElement>('footer')!.inert).toBe(true);
    expect(container.querySelector<HTMLElement>('header')!.inert).toBeFalsy();
  });

  it('makes a part that mounts while the sheet is open inert too', () => {
    function Late() {
      const [shown, setShown] = useState(false);
      return (
        <AppShell open>
          <AppShellSidebar>x</AppShellSidebar>
          <AppShellMain>
            <button type="button" onClick={() => setShown(true)}>
              show
            </button>
          </AppShellMain>
          {shown ? <AppShellFooter>Late</AppShellFooter> : null}
        </AppShell>
      );
    }
    const { container } = render(<Late />);
    expect(container.querySelector('footer')).toBeNull();
    fireEvent.click(screen.getByText('show'));
    expect(container.querySelector<HTMLElement>('footer')!.inert).toBe(true);
  });

  it('releases a part whose registration ran again while the sheet was open', () => {
    // StrictMode runs the effects of a part that mounts while the sheet is open twice: registered,
    // released, registered again, on the same element. The release must give the element back as it
    // found it, or the second registration finds it inert and leaves it to nobody.
    const shell = (open: boolean, footer: boolean) => (
      <StrictMode>
        <AppShell open={open}>
          <AppShellSidebar>x</AppShellSidebar>
          <AppShellMain>Main</AppShellMain>
          {footer ? <AppShellFooter>Late</AppShellFooter> : null}
        </AppShell>
      </StrictMode>
    );
    const { container, rerender } = render(shell(true, false));
    rerender(shell(true, true));
    const footer = container.querySelector<HTMLElement>('footer')!;
    expect(footer.inert).toBe(true);
    rerender(shell(false, true));
    expect(footer.inert).toBeFalsy();
    expect(inertParts(container)).toEqual([]);
  });

  it('does none of it while the window is wide, whatever `open` says', () => {
    stubWindow(true);
    const { container } = render(<Shell open />);
    expect(inertParts(container)).toEqual([]);
    expect(sidebar(container)).not.toHaveAttribute('role');
    expect(scrim(container)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Close navigation' })).toBeNull();
    expect(document.documentElement.style.overflow).toBe('');
  });
});

describe('the scrim and the button that close the sheet', () => {
  it('draws a scrim only while the sheet is open, hidden from assistive technology', () => {
    const { container, rerender } = render(<Shell open={false} />);
    expect(scrim(container)).toBeNull();
    rerender(<Shell open />);
    expect(scrim(container)).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstElementChild!.lastElementChild).toBe(scrim(container));
  });

  it('closes on a click on the scrim, and not on a click that only ends on it', () => {
    const onOpenChange = vi.fn();
    const { container } = render(<Shell defaultOpen onOpenChange={onOpenChange} />);
    // A selection that starts in the sidebar and ends over the scrim makes a `click` whose target
    // is the element that holds both, which is not the scrim.
    fireEvent.click(container.firstElementChild!);
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.click(scrim(container)!);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(scrim(container)).toBeNull();
  });

  it('only puts away a popover open in the sidebar on the press that closes it, and closes on the next', () => {
    const { onOpenChange, container, close } = withPopover('auto');
    fireEvent.pointerDown(scrim(container)!);
    // The browser closes the popover by light dismiss as the press ends, before the click.
    close();
    fireEvent.click(scrim(container)!);
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.pointerDown(scrim(container)!);
    fireEvent.click(scrim(container)!);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('closes on a press over a manual popover, which a press does not put away', () => {
    const { onOpenChange, container } = withPopover('manual');
    fireEvent.pointerDown(scrim(container)!);
    fireEvent.click(scrim(container)!);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('draws a close button in the head, only while it is a sheet, named from `labels`', () => {
    const { container, rerender } = render(<Shell open={false} />);
    expect(screen.queryByRole('button', { name: 'Close navigation' })).toBeNull();
    rerender(<Shell open labels={{ closeNavigation: 'Fermer' }} />);
    const button = screen.getByRole('button', { name: 'Fermer' });
    expect(button).toHaveClass('flg-button', 'flg-app-shell-sidebar-close');
    expect(sidebar(container).querySelector('.flg-app-shell-sidebar-head')).toContainElement(
      button,
    );
  });

  it('puts the button after the brand in S1 and before it in S2, the way it is drawn', () => {
    const brand = <AppShellBrand name="Lumen" href="/" />;
    const order = (layout: 'sidebar' | 'header') => {
      const { container, unmount } = render(<Shell open layout={layout} brand={brand} />);
      const head = container.querySelector('.flg-app-shell-sidebar-head')!;
      const names = Array.from(head.children).map((child) =>
        child.matches('button') ? 'close' : 'brand',
      );
      unmount();
      return names;
    };
    expect(order('sidebar')).toEqual(['brand', 'close']);
    expect(order('header')).toEqual(['close', 'brand']);
  });

  it('closes on the button, and says so', () => {
    const onOpenChange = vi.fn();
    const { container } = render(<Shell defaultOpen onOpenChange={onOpenChange} />);
    fireEvent.click(closeButton());
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(container.firstElementChild).not.toHaveAttribute('data-open');
  });
});

describe('focus', () => {
  it('goes to the first thing in the sidebar when it opens: the brand link in S1, the button in S2', () => {
    const brand = <AppShellBrand name="Lumen" href="/" />;
    const { rerender } = render(<Shell open={false} brand={brand} />);
    rerender(<Shell open brand={brand} />);
    const link = document.activeElement as HTMLElement;
    expect(link).toHaveAttribute('href', '/');
    expect(link.closest('.flg-app-shell-sidebar-head')).not.toBeNull();
    rerender(<Shell open={false} layout="header" brand={brand} />);
    rerender(<Shell open layout="header" brand={brand} />);
    expect(closeButton()).toHaveFocus();
  });

  it('goes to the first thing from `defaultOpen` on the first render too', () => {
    render(<Shell defaultOpen layout="header" />);
    expect(closeButton()).toHaveFocus();
  });

  it('goes back to the trigger that opened the sheet when it closes by Esc, the scrim or the button', () => {
    const { container } = render(<Shell layout="header" />);
    for (const close of [
      () => fireEvent.keyDown(document, { key: 'Escape' }),
      () => fireEvent.click(scrim(container)!),
      () => fireEvent.click(closeButton()),
    ]) {
      fireEvent.click(trigger());
      expect(closeButton()).toHaveFocus();
      close();
      expect(container.firstElementChild).not.toHaveAttribute('data-open');
      expect(trigger()).toHaveFocus();
    }
  });

  it('goes back to the trigger that opened it when there are two', () => {
    const { container } = render(
      <AppShell layout="header">
        <AppShellHeader>
          <span>first</span>
        </AppShellHeader>
        <AppShellSidebar>x</AppShellSidebar>
        <AppShellMain>
          <AppShellSidebarTrigger />
        </AppShellMain>
      </AppShell>,
    );
    const [first, second] = screen.getAllByRole('button', { name: 'Open navigation' });
    fireEvent.click(second!);
    fireEvent.click(scrim(container)!);
    expect(second).toHaveFocus();
    expect(first).not.toHaveFocus();
  });

  it('stays where it is when the window grows wide, which closes the sheet', () => {
    const { container } = render(<Shell defaultOpen layout="header" />);
    const link = screen.getByRole('link', { name: 'One' });
    link.focus();
    resize(true);
    expect(container.firstElementChild).not.toHaveAttribute('data-open');
    expect(link).toHaveFocus();
  });

  it('is left alone by a close that asks `returnFocus: false`', () => {
    function Link() {
      const context = useContext(AppShellContext)!;
      return (
        <button type="button" onClick={() => context.setOpen(false, { returnFocus: false })}>
          go
        </button>
      );
    }
    const { container } = render(
      <Shell>
        <Link />
      </Shell>,
    );
    fireEvent.click(trigger());
    const go = screen.getByText('go');
    go.focus();
    fireEvent.click(go);
    expect(container.firstElementChild).not.toHaveAttribute('data-open');
    expect(trigger()).not.toHaveFocus();
    expect(go).toHaveFocus();
  });

  it('returns by default when a part closes the sheet with `setOpen(false)`', () => {
    function Link() {
      const context = useContext(AppShellContext)!;
      return (
        <button type="button" onClick={() => context.setOpen(false)}>
          go
        </button>
      );
    }
    render(
      <Shell>
        <Link />
      </Shell>,
    );
    fireEvent.click(trigger());
    fireEvent.click(screen.getByText('go'));
    expect(trigger()).toHaveFocus();
  });
});

// The return runs while React commits, and React then gives the focus back to the element that had
// it before the commit if that element is still in the document. In a browser that element is in a
// sidebar that is `display: none` by then, so nothing happens; jsdom has no `display`, and focuses it
// again. So where focus starts on a link of the sidebar, these tests check which element the shell
// focused, and the stories check where focus ends in the real engines.
describe('focus when the sheet closes, whoever closes it', () => {
  const focusCalls = () => vi.spyOn(HTMLElement.prototype, 'focus');
  const link = () => screen.getByRole('link', { name: 'One' });

  it('goes back to the trigger when a parent that owns `open` closes the sheet itself', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Shell layout="header" open={false} onOpenChange={onOpenChange} />);
    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    rerender(<Shell layout="header" open onOpenChange={onOpenChange} />);
    expect(closeButton()).toHaveFocus();
    rerender(<Shell layout="header" open={false} onOpenChange={onOpenChange} />);
    expect(trigger()).toHaveFocus();
  });

  it('is sent to the trigger when a parent closes the sheet with the focus on a link in it', () => {
    const { rerender } = render(<Shell open />);
    link().focus();
    const focus = focusCalls();
    rerender(<Shell open={false} />);
    expect(focus.mock.contexts).toContain(trigger());
  });

  it('goes to the trigger when the window grows wide with the focus on the close button, which goes', () => {
    render(<Shell defaultOpen layout="header" />);
    expect(closeButton()).toHaveFocus();
    resize(true);
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toHaveFocus();
  });

  it('is sent to the trigger when the window grows wide with the focus on what the wide frame hides', () => {
    const { container } = render(
      <Shell defaultOpen layout="header" brand={<AppShellBrand name="Lumen" href="/" />} />,
    );
    const brandLink = container.querySelector<HTMLElement>('.flg-app-shell-sidebar-head a')!;
    brandLink.focus();
    // The head of an S2 sidebar is `display: none` on a wide screen, the brand link with it.
    HTMLElement.prototype.checkVisibility = function (this: HTMLElement) {
      return !this.closest('.flg-app-shell-sidebar-head');
    };
    const focus = focusCalls();
    resize(true);
    expect(focus.mock.contexts).toContain(container.querySelector('.flg-app-shell-trigger'));
  });

  it('is not moved by a window that grows wide with the focus on a link, after an Esc the parent refused', () => {
    const onOpenChange = vi.fn();
    render(<Shell open onOpenChange={onOpenChange} />);
    link().focus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const focus = focusCalls();
    resize(true);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(focus).not.toHaveBeenCalled();
    expect(link()).toHaveFocus();
  });

  it('forgets the trigger that opened the sheet once it is closed', () => {
    const shell = (open: boolean) => (
      <AppShell layout="header" open={open} onOpenChange={() => {}}>
        <AppShellHeader>Header</AppShellHeader>
        <AppShellSidebar>x</AppShellSidebar>
        <AppShellMain>
          <AppShellSidebarTrigger />
        </AppShellMain>
      </AppShell>
    );
    const { rerender } = render(shell(false));
    const [first, second] = screen.getAllByRole('button', { name: 'Open navigation' });
    fireEvent.click(second!);
    rerender(shell(true));
    rerender(shell(false));
    expect(second).toHaveFocus();
    // Opened by the parent this time: focus comes back to the first trigger, not the old one.
    rerender(shell(true));
    rerender(shell(false));
    expect(first).toHaveFocus();
  });

  it('returns again on the close after one that asked `returnFocus: false`', () => {
    function Quiet() {
      const context = useContext(AppShellContext)!;
      return (
        <button type="button" onClick={() => context.setOpen(false, { returnFocus: false })}>
          quiet
        </button>
      );
    }
    render(
      <Shell>
        <Quiet />
      </Shell>,
    );
    fireEvent.click(trigger());
    fireEvent.click(screen.getByText('quiet'));
    expect(trigger()).not.toHaveFocus();
    fireEvent.click(trigger());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger()).toHaveFocus();
  });

  describe('after a `returnFocus: false` that closed nothing', () => {
    function Quiet() {
      const context = useContext(AppShellContext)!;
      return (
        <button type="button" onClick={() => context.setOpen(false, { returnFocus: false })}>
          quiet
        </button>
      );
    }
    const shell = (open: boolean) => (
      <Shell layout="header" open={open} onOpenChange={() => {}}>
        <Quiet />
      </Shell>
    );

    it('returns when a parent opens the sheet itself and then closes it', () => {
      // A handler that runs on every click (a NavItem's) asks it with the sheet closed.
      const { rerender } = render(shell(false));
      fireEvent.click(screen.getByText('quiet'));
      rerender(shell(true));
      expect(closeButton()).toHaveFocus();
      rerender(shell(false));
      expect(trigger()).toHaveFocus();
    });

    it('returns when the sheet shows after a close that the parent refused while it was wide', () => {
      // On a wide screen `open` shows no sheet, and the parent keeps it through the close.
      stubWindow(true);
      const { rerender } = render(shell(true));
      fireEvent.click(screen.getByText('quiet'));
      resize(false);
      expect(closeButton()).toHaveFocus();
      rerender(shell(false));
      expect(trigger()).toHaveFocus();
    });
  });

  it('moves nothing when the shell goes away with the sheet open', () => {
    const { unmount } = render(<Shell defaultOpen layout="header" />);
    const focus = focusCalls();
    unmount();
    expect(focus).not.toHaveBeenCalled();
  });
});

describe('Esc', () => {
  it('closes the sheet', () => {
    const onOpenChange = vi.fn();
    render(<Shell defaultOpen onOpenChange={onOpenChange} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('ignores other keys', () => {
    const onOpenChange = vi.fn();
    render(<Shell defaultOpen onOpenChange={onOpenChange} />);
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('leaves the key to an input method that is composing text', () => {
    const onOpenChange = vi.fn();
    render(<Shell defaultOpen onOpenChange={onOpenChange} />);
    // Esc cancels the candidate window; Safari sends the keydown that ends a composition with
    // `isComposing` false and `keyCode` 229.
    fireEvent.keyDown(document, { key: 'Escape', isComposing: true });
    fireEvent.keyDown(document, { key: 'Escape', keyCode: 229 });
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('leaves it to whoever already took the key (the Toaster does)', () => {
    const onOpenChange = vi.fn();
    render(<Shell defaultOpen onOpenChange={onOpenChange} />);
    const handled = (event: KeyboardEvent) => event.preventDefault();
    // Before the shell's own listener, which is on the same node.
    document.addEventListener('keydown', handled, true);
    fireEvent.keyDown(document, { key: 'Escape' });
    document.removeEventListener('keydown', handled, true);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('leaves it to a dialog that is open on top of the sheet', () => {
    const onOpenChange = vi.fn();
    render(<Shell defaultOpen onOpenChange={onOpenChange} />);
    const unregister = registerModal({
      dialog: document.createElement('dialog'),
      host: document.createElement('div'),
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
    unregister();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  describe('with a popover open in the sidebar', () => {
    it('leaves the key to an auto popover, which the browser closes on this very press', () => {
      const { onOpenChange } = withPopover('auto');
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('closes the sheet over a manual popover, which Esc never closes', () => {
      const { onOpenChange } = withPopover('manual');
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    });
  });

  it('is not listened to while the sheet is closed', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Shell open={false} onOpenChange={onOpenChange} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    rerender(<Shell open onOpenChange={onOpenChange} />);
    rerender(<Shell open={false} onOpenChange={onOpenChange} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe('the page behind the sheet', () => {
  it('does not scroll while the sheet is open, and does again once it is closed or gone', () => {
    const { rerender, unmount } = render(<Shell open={false} />);
    expect(document.documentElement.style.overflow).toBe('');
    rerender(<Shell open />);
    expect(document.documentElement.style.overflow).toBe('hidden');
    rerender(<Shell open={false} />);
    expect(document.documentElement.style.overflow).toBe('');
    rerender(<Shell open />);
    unmount();
    expect(document.documentElement.style.overflow).toBe('');
  });
});

describe('a page that hydrates on a wide screen with the sheet open', () => {
  // The server and the first render on the client are the narrow frame (`useMediaQuery` is false
  // while hydrating), so for one commit the shell renders the sheet open on a wide screen.
  function hydrate(element: ReactNode) {
    const container = document.createElement('div');
    container.innerHTML = renderToString(element);
    document.body.append(container);
    let root: ReturnType<typeof hydrateRoot> | undefined;
    onTestFinished(() => {
      act(() => root?.unmount());
      container.remove();
    });
    act(() => {
      root = hydrateRoot(container, element);
    });
    return container;
  }
  const brand = <AppShellBrand name="Lumen" href="/" />;

  it('is a wide shell: no close is reported, focus is not moved, nothing is inert or locked', () => {
    stubWindow(true);
    for (const props of [{ defaultOpen: true }, { open: true }]) {
      const onOpenChange = vi.fn();
      const focus = vi.spyOn(HTMLElement.prototype, 'focus');
      const container = hydrate(<Shell {...props} brand={brand} onOpenChange={onOpenChange} />);
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(focus).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(document.body);
      expect(inertParts(container)).toEqual([]);
      expect(document.documentElement.style.overflow).toBe('');
      expect(screen.queryByRole('dialog')).toBeNull();
      focus.mockRestore();
    }
  });

  it('still closes the sheet when the window has been narrow and grows wide again', () => {
    stubWindow(true);
    const onOpenChange = vi.fn();
    const container = hydrate(<Shell defaultOpen brand={brand} onOpenChange={onOpenChange} />);
    resize(false);
    expect(screen.getByRole('dialog')).toBe(sidebar(container));
    resize(true);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('opens the sheet as the server sent it on a narrow screen', () => {
    stubWindow(false);
    const container = hydrate(<Shell defaultOpen layout="header" brand={brand} />);
    expect(screen.getByRole('dialog')).toBe(sidebar(container));
    expect(closeButton()).toHaveFocus();
    expect(document.documentElement.style.overflow).toBe('hidden');
  });
});

describe('a window that crosses the breakpoint while the sheet is open', () => {
  it('closes it: `onOpenChange(false)`, and the page is free again', () => {
    const onOpenChange = vi.fn();
    const { container } = render(<Shell defaultOpen onOpenChange={onOpenChange} />);
    expect(document.documentElement.style.overflow).toBe('hidden');
    resize(true);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(container.firstElementChild).not.toHaveAttribute('data-open');
    expect(inertParts(container)).toEqual([]);
    expect(document.documentElement.style.overflow).toBe('');
    // It stays closed when the window narrows again.
    resize(false);
    expect(container.firstElementChild).not.toHaveAttribute('data-open');
  });

  it('reports nothing when the sheet was closed', () => {
    const onOpenChange = vi.fn();
    render(<Shell onOpenChange={onOpenChange} />);
    resize(true);
    resize(false);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('asks a parent that owns `open` to close it, and does nothing at the wide size if it keeps it open', () => {
    const onOpenChange = vi.fn();
    const { container } = render(<Shell open onOpenChange={onOpenChange} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    resize(true);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    // The parent ignores it: `open` is still true, and the shell is an ordinary wide one.
    expect(container.firstElementChild).toHaveAttribute('data-open');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(inertParts(container)).toEqual([]);
    expect(scrim(container)).toBeNull();
    expect(document.documentElement.style.overflow).toBe('');
    // And the sheet is back when the window narrows.
    resize(false);
    expect(screen.getByRole('dialog', { name: 'Navigation' })).toBe(sidebar(container));
    expect(inertParts(container)).toHaveLength(4);
    expect(document.documentElement.style.overflow).toBe('hidden');
  });
});

describe('a Toaster inside a part that goes inert', () => {
  const toaster = <section className="flg-toaster" />;
  const message =
    '[h2d-glass-ui] <Toaster> is inside a part of <AppShell> that goes inert while the navigation is open, so its toasts cannot be reached. Render it outside <AppShell> or as its direct child.';

  it('warns, without a value in the text', () => {
    const warn = spyWarn();
    render(<Shell open main={toaster} />);
    expect(warnings(warn)).toContain(message);
  });

  it('is quiet with the Toaster outside of the shell', () => {
    const warn = spyWarn();
    render(
      <div>
        <Shell open />
        {toaster}
      </div>,
    );
    expect(warnings(warn)).not.toContain(message);
  });

  it('is quiet with the Toaster as a direct child of the shell', () => {
    const warn = spyWarn();
    render(<Shell open>{toaster}</Shell>);
    expect(warnings(warn)).not.toContain(message);
  });

  it('is quiet while the sheet is closed', () => {
    const warn = spyWarn();
    render(<Shell open={false} main={toaster} />);
    expect(warnings(warn)).not.toContain(message);
  });
});

describe('`setOpen` of the context', () => {
  it('opens the sheet with a plain `setOpen(true)`, as a link of Plan B will not need but a caller may', () => {
    function Opener() {
      const context = useContext(AppShellContext)!;
      return (
        <button type="button" onClick={() => context.setOpen(true)}>
          open
        </button>
      );
    }
    const { container } = render(
      <Shell>
        <Opener />
      </Shell>,
    );
    act(() => screen.getByText('open').click());
    expect(container.firstElementChild).toHaveAttribute('data-open');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('says `modal` while the sheet is open on a narrow screen, and only then', () => {
    const seen: boolean[] = [];
    function Reader() {
      seen.push(useContext(AppShellContext)!.modal);
      return null;
    }
    const { rerender } = render(
      <Shell open={false}>
        <Reader />
      </Shell>,
    );
    rerender(
      <Shell open>
        <Reader />
      </Shell>,
    );
    expect(seen.at(-1)).toBe(true);
    resize(true);
    expect(seen.at(-1)).toBe(false);
    expect(seen[0]).toBe(false);
  });
});
