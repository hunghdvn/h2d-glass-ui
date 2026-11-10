import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

// jsdom has no `matchMedia`, so a test says what the window is: wide when the query of the
// breakpoint matches, and a call to `resize` is the user dragging the window across it.
let wide = false;
const listeners = new Set<() => void>();

function stubWindow(initiallyWide: boolean) {
  wide = initiallyWide;
  listeners.clear();
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      get matches() {
        return wide && query.startsWith('(min-width:');
      },
      media: query,
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    })),
  );
}

function resize(toWide: boolean) {
  wide = toWide;
  act(() => {
    for (const listener of [...listeners]) listener();
  });
}

beforeEach(() => {
  resetDevWarnings();
  vi.restoreAllMocks();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
const warnings = (warn: ReturnType<typeof spyWarn>) => warn.mock.calls.map((call) => call[0]);

// The only button of these shells.
const trigger = () => screen.getByRole('button');

function Shell({ children, ...props }: { children?: ReactNode } & AppShellProps) {
  return (
    <AppShell {...props}>
      <AppShellHeader>Header</AppShellHeader>
      <AppShellSidebar>Sidebar</AppShellSidebar>
      <AppShellMain>{children ?? 'Main'}</AppShellMain>
      <AppShellFooter>Footer</AppShellFooter>
    </AppShell>
  );
}

describe('AppShellHeader renders the trigger', () => {
  it('first, then the brand cell, then what the caller put in the header', () => {
    const { container } = render(
      <Shell brand={<AppShellBrand name="Lumen" />}>
        <span>x</span>
      </Shell>,
    );
    const header = container.querySelector('.flg-app-shell-header')!;
    expect(
      Array.from(header.children).map((child) => child.className.replace('flg-button ', '')),
    ).toEqual(['flg-app-shell-trigger', 'flg-app-shell-header-brand']);
    expect(header.firstElementChild!.tagName).toBe('BUTTON');
    // The caller's children come after both, in the order the Tab key goes.
    expect(header.lastChild).toHaveTextContent('Header');
  });

  it('is an icon-only ghost button with a menu icon, as the mockup draws it', () => {
    render(<Shell />);
    expect(trigger()).toHaveClass('flg-button', 'flg-app-shell-trigger');
    expect(trigger()).toHaveAttribute('data-variant', 'ghost');
    expect(trigger()).toHaveAttribute('data-size', 'md');
    expect(trigger()).toHaveAttribute('data-icon-only');
    expect(trigger().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('leaves it out with sidebarTrigger={false}, and the caller can place one', () => {
    const { container } = render(
      <AppShell>
        <AppShellHeader sidebarTrigger={false}>H</AppShellHeader>
        <AppShellSidebar>S</AppShellSidebar>
        <AppShellMain>
          <AppShellSidebarTrigger />
        </AppShellMain>
      </AppShell>,
    );
    expect(container.querySelectorAll('.flg-app-shell-trigger')).toHaveLength(1);
    expect(container.querySelector('.flg-app-shell-header .flg-app-shell-trigger')).toBeNull();
  });

  it('does not hand `sidebarTrigger` to the DOM', () => {
    const { container } = render(
      <AppShell>
        <AppShellHeader sidebarTrigger={false} data-x="1">
          H
        </AppShellHeader>
        <AppShellMain>M</AppShellMain>
      </AppShell>,
    );
    const header = container.querySelector('header')!;
    expect(header).toHaveAttribute('data-x', '1');
    expect(header).not.toHaveAttribute('sidebartrigger');
    expect(header).not.toHaveAttribute('sidebarTrigger');
  });
});

describe('AppShellSidebarTrigger on a narrow screen', () => {
  beforeEach(() => stubWindow(false));

  it('points at the sidebar and offers to open the navigation, which is closed', () => {
    const { container } = render(<Shell />);
    const sidebar = container.querySelector('.flg-app-shell-sidebar')!;
    expect(trigger()).toHaveAccessibleName('Open navigation');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).toHaveAttribute('aria-controls', sidebar.id);
    expect(container.firstElementChild).not.toHaveAttribute('data-open');
  });

  it('toggles `open` on the root and in aria-expanded, uncontrolled', () => {
    const onOpenChange = vi.fn();
    const { container } = render(<Shell onOpenChange={onOpenChange} />);
    const root = container.firstElementChild!;
    fireEvent.click(trigger());
    expect(root).toHaveAttribute('data-open');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(trigger());
    expect(root).not.toHaveAttribute('data-open');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it('starts open from `defaultOpen`, in the very first render', () => {
    const { container } = render(<Shell defaultOpen />);
    expect(container.firstElementChild).toHaveAttribute('data-open');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
  });

  it('reports a request and leaves the state to the parent when `open` is controlled', () => {
    const onOpenChange = vi.fn();
    const { container, rerender } = render(<Shell open={false} onOpenChange={onOpenChange} />);
    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(container.firstElementChild).not.toHaveAttribute('data-open');
    rerender(<Shell open onOpenChange={onOpenChange} />);
    expect(container.firstElementChild).toHaveAttribute('data-open');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
  });

  it('leaves `collapsed` alone', () => {
    const onCollapsedChange = vi.fn();
    const { container } = render(<Shell onCollapsedChange={onCollapsedChange} />);
    fireEvent.click(trigger());
    expect(onCollapsedChange).not.toHaveBeenCalled();
    expect(container.firstElementChild).not.toHaveAttribute('data-collapsed');
  });
});

describe('AppShellSidebarTrigger on a wide screen', () => {
  beforeEach(() => stubWindow(true));

  it('offers to collapse the sidebar, which is expanded', () => {
    const { container } = render(<Shell />);
    expect(trigger()).toHaveAccessibleName('Collapse sidebar');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(container.firstElementChild).not.toHaveAttribute('data-collapsed');
  });

  it('toggles `collapsed` on the root, in the name and in aria-expanded, uncontrolled', () => {
    const onCollapsedChange = vi.fn();
    const { container } = render(<Shell onCollapsedChange={onCollapsedChange} />);
    const root = container.firstElementChild!;
    fireEvent.click(trigger());
    expect(root).toHaveAttribute('data-collapsed');
    expect(trigger()).toHaveAccessibleName('Expand sidebar');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(trigger());
    expect(root).not.toHaveAttribute('data-collapsed');
    expect(trigger()).toHaveAccessibleName('Collapse sidebar');
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
  });

  it('starts as a rail from `defaultCollapsed`, in the very first render', () => {
    const { container } = render(<Shell defaultCollapsed />);
    expect(container.firstElementChild).toHaveAttribute('data-collapsed');
    expect(trigger()).toHaveAccessibleName('Expand sidebar');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('reports a request and leaves the state to the parent when `collapsed` is controlled', () => {
    const onCollapsedChange = vi.fn();
    const { container, rerender } = render(
      <Shell collapsed={false} onCollapsedChange={onCollapsedChange} />,
    );
    fireEvent.click(trigger());
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    expect(container.firstElementChild).not.toHaveAttribute('data-collapsed');
    rerender(<Shell collapsed onCollapsedChange={onCollapsedChange} />);
    expect(container.firstElementChild).toHaveAttribute('data-collapsed');
    expect(trigger()).toHaveAccessibleName('Expand sidebar');
  });

  it('leaves `open` alone', () => {
    const onOpenChange = vi.fn();
    const { container } = render(<Shell onOpenChange={onOpenChange} />);
    fireEvent.click(trigger());
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(container.firstElementChild).not.toHaveAttribute('data-open');
  });

  it('marks the root `data-collapsible`, which tells the CSS whether there is a rail', () => {
    const { container, rerender } = render(<Shell />);
    expect(container.firstElementChild).toHaveAttribute('data-collapsible');
    rerender(<Shell collapsible={false} />);
    expect(container.firstElementChild).not.toHaveAttribute('data-collapsible');
  });

  it('does nothing with `collapsible={false}`, and ignores `collapsed` with a warning', () => {
    const warn = spyWarn();
    const onCollapsedChange = vi.fn();
    const { container } = render(
      <Shell collapsible={false} collapsed onCollapsedChange={onCollapsedChange} />,
    );
    // The button is hidden by CSS at this width; a script that clicks it still changes nothing.
    fireEvent.click(trigger());
    expect(onCollapsedChange).not.toHaveBeenCalled();
    expect(container.firstElementChild).not.toHaveAttribute('data-collapsed');
    expect(warnings(warn)).toEqual([
      '[h2d-glass-ui] <AppShell> has `collapsed` or `defaultCollapsed` but `collapsible` is false: the sidebar cannot collapse, so they are ignored.',
    ]);
  });

  it('warns for `defaultCollapsed` with `collapsible={false}` too, and only then', () => {
    const warn = spyWarn();
    render(<Shell collapsible={false} />);
    expect(warn).not.toHaveBeenCalled();
    render(<Shell collapsible={false} defaultCollapsed />);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('the mode follows the window', () => {
  it('renames the trigger when the window crosses the breakpoint, on a mounted shell', () => {
    stubWindow(false);
    render(<Shell />);
    expect(trigger()).toHaveAccessibleName('Open navigation');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    resize(true);
    expect(trigger()).toHaveAccessibleName('Collapse sidebar');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    resize(false);
    expect(trigger()).toHaveAccessibleName('Open navigation');
  });

  it('keeps each state when the mode changes: a rail stays a rail, an open sheet stays open', () => {
    stubWindow(true);
    const { container } = render(<Shell defaultCollapsed defaultOpen />);
    const root = container.firstElementChild!;
    resize(false);
    expect(root).toHaveAttribute('data-collapsed');
    expect(root).toHaveAttribute('data-open');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    resize(true);
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('listens to the query of its own breakpoint', () => {
    stubWindow(true);
    const matchMedia = window.matchMedia as unknown as ReturnType<typeof vi.fn>;
    render(<Shell breakpoint="md" />);
    expect(matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
    render(<Shell breakpoint="xl" />);
    expect(matchMedia).toHaveBeenCalledWith('(min-width: 1280px)');
    render(<Shell />);
    expect(matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
  });

  it('is the narrow trigger without `matchMedia`, which is what the server renders', () => {
    render(<Shell />);
    expect(trigger()).toHaveAccessibleName('Open navigation');
  });
});

describe('the words', () => {
  beforeEach(() => stubWindow(false));

  it('come from `labels`, one key at a time, and a key left out keeps its default', () => {
    const { rerender } = render(<Shell labels={{ openNavigation: 'Mở điều hướng' }} />);
    expect(trigger()).toHaveAccessibleName('Mở điều hướng');
    rerender(<Shell labels={{ openNavigation: undefined }} />);
    expect(trigger()).toHaveAccessibleName('Open navigation');
    resize(true);
    rerender(<Shell labels={{ collapseSidebar: 'Thu gọn', expandSidebar: 'Mở rộng' }} />);
    expect(trigger()).toHaveAccessibleName('Thu gọn');
    fireEvent.click(trigger());
    expect(trigger()).toHaveAccessibleName('Mở rộng');
  });
});

describe('the caller keeps what is theirs', () => {
  beforeEach(() => stubWindow(false));

  it('has its ref, class, style and attributes, and its own click handler runs first', () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    const { container } = render(
      <AppShell>
        <AppShellHeader sidebarTrigger={false}>H</AppShellHeader>
        <AppShellSidebar>S</AppShellSidebar>
        <AppShellMain>
          <AppShellSidebarTrigger
            ref={ref}
            className="mine"
            style={{ color: 'red' }}
            data-testid="t"
            aria-describedby="hint"
            onClick={onClick}
          />
        </AppShellMain>
      </AppShell>,
    );
    const button = screen.getByTestId('t');
    expect(ref.current).toBe(button);
    expect(button).toHaveClass('flg-app-shell-trigger', 'mine');
    expect((button as HTMLElement).style.color).toBe('red');
    expect(button).toHaveAttribute('aria-describedby', 'hint');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(container.firstElementChild).toHaveAttribute('data-open');
  });

  it('does not toggle when the caller prevents the click', () => {
    const { container } = render(
      <AppShell>
        <AppShellHeader sidebarTrigger={false}>H</AppShellHeader>
        <AppShellSidebar>S</AppShellSidebar>
        <AppShellMain>
          <AppShellSidebarTrigger onClick={(event) => event.preventDefault()} />
        </AppShellMain>
      </AppShell>,
    );
    fireEvent.click(trigger());
    expect(container.firstElementChild).not.toHaveAttribute('data-open');
  });
});

describe('dev warnings for the trigger', () => {
  beforeEach(() => stubWindow(false));

  it('say that a sidebar has no trigger, once the shell is mounted', () => {
    const warn = spyWarn();
    render(
      <AppShell>
        <AppShellHeader sidebarTrigger={false}>H</AppShellHeader>
        <AppShellSidebar>S</AppShellSidebar>
        <AppShellMain>M</AppShellMain>
      </AppShell>,
    );
    expect(warnings(warn)).toEqual([
      '[h2d-glass-ui] <AppShell> has a sidebar but no <AppShellSidebarTrigger>: on narrow screens the navigation cannot be opened.',
    ]);
  });

  it("are silent when the trigger is the header's, or one the caller placed elsewhere", () => {
    const warn = spyWarn();
    render(<Shell />);
    render(
      <AppShell>
        <AppShellHeader sidebarTrigger={false}>H</AppShellHeader>
        <AppShellSidebar>S</AppShellSidebar>
        <AppShellMain>
          <AppShellSidebarTrigger />
        </AppShellMain>
      </AppShell>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('are silent for a shell with no sidebar: there is nothing to open', () => {
    const warn = spyWarn();
    render(
      <AppShell>
        <AppShellHeader>H</AppShellHeader>
        <AppShellMain>M</AppShellMain>
      </AppShell>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('say that a trigger is outside an AppShell, and still render it', () => {
    const warn = spyWarn();
    render(<AppShellSidebarTrigger />);
    expect(warnings(warn)).toEqual([
      '[h2d-glass-ui] <AppShellSidebarTrigger> must be rendered inside <AppShell>.',
    ]);
    expect(trigger()).toBeInTheDocument();
    // With nothing to open it does nothing, and does not throw.
    expect(() => fireEvent.click(trigger())).not.toThrow();
  });
});
