import { act, fireEvent, render, screen } from '@testing-library/react';
import { useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('is left alone by a close that asks `returnFocus: false` (the close when the window grows wide)', () => {
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

  it('leaves it to a popover that is open in the sidebar, which the browser closes on this key', () => {
    const onOpenChange = vi.fn();
    const { container } = render(<Shell defaultOpen onOpenChange={onOpenChange} />);
    const popover = document.createElement('div');
    const query = vi
      .spyOn(sidebar(container), 'querySelector')
      .mockImplementation(((selector: string) =>
        selector === ':popover-open' ? popover : null) as typeof Element.prototype.querySelector);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledWith(':popover-open');
    query.mockImplementation(() => null);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
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
});
