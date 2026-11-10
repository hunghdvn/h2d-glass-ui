import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
  AppShellSidebar,
} from './AppShell';
import { AppShellBrand } from './AppShellBrand';

beforeEach(() => {
  resetDevWarnings();
  vi.restoreAllMocks();
});

const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
const warnings = (warn: ReturnType<typeof spyWarn>) => warn.mock.calls.map((call) => call[0]);

/** A shell with the four parts, in the order the docs recommend. */
function Shell({
  children,
  ...props
}: { children?: ReactNode } & Partial<Parameters<typeof AppShell>[0]>) {
  return (
    <AppShell {...props}>
      <AppShellHeader>Header</AppShellHeader>
      <AppShellSidebar>Sidebar</AppShellSidebar>
      <AppShellMain>{children ?? 'Main'}</AppShellMain>
      <AppShellFooter>Footer</AppShellFooter>
    </AppShell>
  );
}

describe('AppShell', () => {
  it('renders the root with the sidebar layout and the lg breakpoint by default', () => {
    const { container } = render(<Shell />);
    const root = container.firstElementChild!;
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveClass('flg-app-shell');
    expect(root).toHaveAttribute('data-layout', 'sidebar');
    expect(root).toHaveAttribute('data-breakpoint', 'lg');
  });

  it.each(['sidebar', 'header'] as const)('reflects layout %s', (layout) => {
    const { container } = render(<Shell layout={layout} />);
    expect(container.firstElementChild).toHaveAttribute('data-layout', layout);
  });

  it.each(['md', 'lg', 'xl'] as const)('reflects breakpoint %s', (breakpoint) => {
    const { container } = render(<Shell breakpoint={breakpoint} />);
    expect(container.firstElementChild).toHaveAttribute('data-breakpoint', breakpoint);
  });

  it('takes a value outside the unions as the default, and says so in the attributes', () => {
    const { container } = render(
      // @ts-expect-error a layout of plain JavaScript or of a cookie
      <Shell layout="floating" breakpoint="sm" />,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('data-layout', 'sidebar');
    expect(root).toHaveAttribute('data-breakpoint', 'lg');
  });

  it('keeps className, style and other props, and forwards the ref to the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <AppShell ref={ref} className="mine" style={{ color: 'red' }} data-testid="root">
        <AppShellMain>M</AppShellMain>
      </AppShell>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(ref.current).toBe(root);
    expect(root).toHaveClass('flg-app-shell', 'mine');
    expect(root.style.color).toBe('red');
    expect(root).toHaveAttribute('data-testid', 'root');
  });

  it('keeps its own state attributes over the same ones from the caller', () => {
    // A wrapper that forwards `data-*` must not make the CSS draw one state while the shell keeps
    // another: a sheet the CSS shows, say, with nothing made inert.
    const attributes = {
      'data-layout': 'header',
      'data-breakpoint': 'xl',
      'data-collapsible': '',
      'data-collapsed': '',
      'data-rail': '',
      'data-open': '',
    } as Record<string, string>;
    const { container } = render(<Shell collapsible={false} {...attributes} />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('data-layout', 'sidebar');
    expect(root).toHaveAttribute('data-breakpoint', 'lg');
    expect(root).not.toHaveAttribute('data-collapsible');
    expect(root).not.toHaveAttribute('data-collapsed');
    expect(root).not.toHaveAttribute('data-rail');
    expect(root).not.toHaveAttribute('data-open');
  });

  describe('landmarks', () => {
    it('is a banner, a main and a contentinfo, and the sidebar is not a landmark', () => {
      const { container } = render(<Shell />);
      expect(screen.getByRole('banner')).toHaveTextContent('Header');
      expect(screen.getByRole('main')).toHaveTextContent('Main');
      expect(screen.getByRole('contentinfo')).toHaveTextContent('Footer');
      const sidebar = container.querySelector('.flg-app-shell-sidebar')!;
      expect(sidebar.tagName).toBe('DIV');
      expect(sidebar).not.toHaveAttribute('role');
    });
  });

  describe('the skip link', () => {
    it('is the first child of the root and points at the main', () => {
      const { container } = render(<Shell />);
      const link = container.firstElementChild!.firstElementChild as HTMLAnchorElement;
      expect(link.tagName).toBe('A');
      expect(link).toHaveClass('flg-app-shell-skip', 'flg-visually-hidden');
      expect(link).toHaveTextContent('Skip to content');
      const main = screen.getByRole('main');
      expect(main.id).not.toBe('');
      expect(link.getAttribute('href')).toBe(`#${main.id}`);
    });

    it('lets the main take the focus, which is where the browser puts it for the fragment', () => {
      render(<Shell />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('tabindex', '-1');
      main.focus();
      expect(main).toHaveFocus();
    });

    it('takes the focus to the main itself, scrolled to the top, and does not follow the fragment', () => {
      // jsdom does not lay out, so it has no scrollIntoView either.
      const scrolled: Element[] = [];
      Element.prototype.scrollIntoView = function (this: Element) {
        scrolled.push(this);
      };
      onTestFinished(() => {
        delete (Element.prototype as Partial<Element>).scrollIntoView;
      });
      render(<Shell />);
      const main = screen.getByRole('main');
      // `fireEvent` returns false when a handler prevented the default: the fragment.
      expect(fireEvent.click(screen.getByRole('link', { name: 'Skip to content' }))).toBe(false);
      expect(main).toHaveFocus();
      expect(scrolled).toEqual([main]);
    });

    it('says its words from `labels`, and keeps the default for a key left out', () => {
      const { rerender } = render(<Shell labels={{ skipToContent: 'Đến nội dung' }} />);
      expect(screen.getByRole('link', { name: 'Đến nội dung' })).toBeInTheDocument();
      // A translation that was not found is `undefined`: the English word stays.
      rerender(<Shell labels={{ skipToContent: undefined }} />);
      expect(screen.getByRole('link', { name: 'Skip to content' })).toBeInTheDocument();
    });

    it('is a link to the main of its own shell when there are two', () => {
      render(
        <>
          <Shell />
          <Shell />
        </>,
      );
      const mains = screen.getAllByRole('main');
      const links = screen.getAllByRole('link', { name: 'Skip to content' });
      expect(links.map((link) => link.getAttribute('href'))).toEqual(
        mains.map((main) => `#${main.id}`),
      );
      expect(mains[0]!.id).not.toBe(mains[1]!.id);
    });
  });

  describe('the parts', () => {
    it('are the elements of the spec, with their own class names, props and refs', () => {
      const header = createRef<HTMLElement>();
      const sidebar = createRef<HTMLDivElement>();
      const main = createRef<HTMLElement>();
      const footer = createRef<HTMLElement>();
      render(
        <AppShell>
          <AppShellHeader ref={header} className="a" aria-label="Top">
            H
          </AppShellHeader>
          <AppShellSidebar ref={sidebar} className="b" data-x="1">
            S
          </AppShellSidebar>
          <AppShellMain ref={main} className="c" aria-label="Content">
            M
          </AppShellMain>
          <AppShellFooter ref={footer} className="d" title="Foot">
            F
          </AppShellFooter>
        </AppShell>,
      );
      expect(header.current).toBe(screen.getByRole('banner'));
      expect(header.current).toHaveClass('flg-surface', 'flg-app-shell-header', 'a');
      expect(header.current).toHaveAttribute('aria-label', 'Top');
      // The cell has no look of its own: the glass is the panel in it.
      expect(sidebar.current).toHaveClass('flg-app-shell-sidebar', 'b');
      expect(sidebar.current).not.toHaveClass('flg-surface');
      expect(sidebar.current!.firstElementChild).toHaveClass(
        'flg-surface',
        'flg-app-shell-sidebar-panel',
      );
      expect(sidebar.current).toHaveAttribute('data-x', '1');
      expect(main.current).toBe(screen.getByRole('main', { name: 'Content' }));
      expect(main.current).toHaveClass('flg-app-shell-main', 'c');
      expect(footer.current).toBe(screen.getByRole('contentinfo'));
      expect(footer.current).toHaveClass('flg-surface', 'flg-app-shell-footer', 'd');
      expect(footer.current).toHaveAttribute('title', 'Foot');
    });

    it('puts the children of the sidebar in the body of its panel, after the head', () => {
      const { container } = render(<Shell />);
      const sidebar = container.querySelector('.flg-app-shell-sidebar')!;
      expect(Array.from(sidebar.children).map((child) => child.className)).toEqual([
        'flg-surface flg-app-shell-sidebar-panel',
      ]);
      const panel = sidebar.firstElementChild!;
      expect(Array.from(panel.children).map((child) => child.className)).toEqual([
        'flg-app-shell-sidebar-head',
        'flg-app-shell-sidebar-body',
      ]);
      expect(sidebar.querySelector('.flg-app-shell-sidebar-body')).toHaveTextContent('Sidebar');
    });

    it('give the main and the sidebar an id of the library, which a caller cannot replace', () => {
      const own = { id: 'mine' } as object;
      const { container } = render(
        <AppShell>
          <AppShellSidebar {...own}>S</AppShellSidebar>
          <AppShellMain {...own}>M</AppShellMain>
        </AppShell>,
      );
      const main = screen.getByRole('main');
      const sidebar = container.querySelector('.flg-app-shell-sidebar')!;
      expect(main.id).not.toBe('mine');
      expect(sidebar.id).not.toBe('mine');
      expect(main.id).not.toBe(sidebar.id);
      expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
        'href',
        `#${main.id}`,
      );
    });
  });

  describe('the brand', () => {
    const brand = <AppShellBrand name="Lumen" logo="L" href="/" />;

    it('is drawn at the head of the header and at the head of the sidebar', () => {
      const { container } = render(<Shell brand={brand} />);
      const inHeader = container.querySelector(
        '.flg-app-shell-header > .flg-app-shell-header-brand',
      );
      const inSidebar = container.querySelector(
        '.flg-app-shell-sidebar > .flg-app-shell-sidebar-panel > .flg-app-shell-sidebar-head',
      );
      expect(inHeader?.querySelector('a.flg-app-shell-brand')).toHaveTextContent('Lumen');
      expect(inSidebar?.querySelector('a.flg-app-shell-brand')).toHaveTextContent('Lumen');
      // The brand cell comes after the trigger and before what the caller puts in the header.
      const header = container.querySelector('.flg-app-shell-header')!;
      expect(header.children[1]).toBe(inHeader);
    });

    it('leaves out the cell of the header, but not the head of the sidebar, without a brand', () => {
      const { container } = render(<Shell />);
      expect(container.querySelector('.flg-app-shell-header-brand')).toBeNull();
      // The head stays so the navigation always starts below the line of the header.
      expect(container.querySelector('.flg-app-shell-sidebar-head')).toBeEmptyDOMElement();
    });

    it.each([false, null, '', []])('leaves out the cell of the header for brand %j', (empty) => {
      const { container } = render(<Shell brand={empty} />);
      expect(container.querySelector('.flg-app-shell-header-brand')).toBeNull();
    });

    it('keeps a brand of 0, which is something to draw', () => {
      const { container } = render(<Shell brand={0} />);
      expect(container.querySelector('.flg-app-shell-header-brand')).toHaveTextContent('0');
    });

    it('follows a brand that changes while the shell is mounted', () => {
      const { container, rerender } = render(<Shell />);
      expect(container.querySelector('.flg-app-shell-header-brand')).toBeNull();
      rerender(<Shell brand={brand} />);
      expect(container.querySelector('.flg-app-shell-header-brand')).toHaveTextContent('Lumen');
      rerender(<Shell />);
      expect(container.querySelector('.flg-app-shell-header-brand')).toBeNull();
    });
  });

  describe('dev warnings', () => {
    it('are silent for a shell that is used as documented', () => {
      const warn = spyWarn();
      render(<Shell />);
      expect(warn).not.toHaveBeenCalled();
    });

    it('are silent for a part inside a component that adds no element', () => {
      const warn = spyWarn();
      const Parts = () => (
        <>
          <AppShellHeader>H</AppShellHeader>
          <AppShellMain>M</AppShellMain>
        </>
      );
      render(
        <AppShell>
          <Parts />
        </AppShell>,
      );
      expect(warn).not.toHaveBeenCalled();
    });

    it('say that there is no main to skip to', () => {
      const warn = spyWarn();
      render(
        <AppShell>
          <AppShellHeader>H</AppShellHeader>
        </AppShell>,
      );
      expect(warnings(warn)).toEqual([
        '[h2d-glass-ui] <AppShell> has no <AppShellMain>: the skip link has nowhere to go.',
      ]);
    });

    it.each([
      ['AppShellHeader', AppShellHeader],
      ['AppShellSidebar', AppShellSidebar],
      ['AppShellMain', AppShellMain],
      ['AppShellFooter', AppShellFooter],
    ] as Array<[string, ComponentType<{ children?: ReactNode }>]>)(
      'say that there is more than one %s',
      (name, Part) => {
        const warn = spyWarn();
        render(
          <AppShell>
            <AppShellMain>M</AppShellMain>
            <Part>one</Part>
            <Part>two</Part>
          </AppShell>,
        );
        expect(warnings(warn)).toContain(`[h2d-glass-ui] <AppShell> has more than one <${name}>.`);
      },
    );

    it('say that a part is outside an AppShell, one message for each part', () => {
      const warn = spyWarn();
      render(
        <>
          <AppShellHeader sidebarTrigger={false}>H</AppShellHeader>
          <AppShellSidebar>S</AppShellSidebar>
          <AppShellMain>M</AppShellMain>
          <AppShellFooter>F</AppShellFooter>
        </>,
      );
      expect(warnings(warn)).toEqual([
        '[h2d-glass-ui] <AppShellHeader> must be rendered inside <AppShell>.',
        '[h2d-glass-ui] <AppShellSidebar> must be rendered inside <AppShell>.',
        '[h2d-glass-ui] <AppShellMain> must be rendered inside <AppShell>.',
        '[h2d-glass-ui] <AppShellFooter> must be rendered inside <AppShell>.',
      ]);
      // They still render, with an id of their own: the library does not throw on misuse.
      expect(screen.getByRole('main')).toHaveAttribute('id');
    });

    it('say that a part is not a direct child, and name the part', () => {
      const warn = spyWarn();
      render(
        <AppShell>
          <AppShellHeader>H</AppShellHeader>
          <div>
            <AppShellSidebar>S</AppShellSidebar>
          </div>
          <AppShellMain>M</AppShellMain>
        </AppShell>,
      );
      expect(warnings(warn)).toEqual([
        '[h2d-glass-ui] <AppShellSidebar> must be a direct child of <AppShell>: a component around it is fine, an element around it is not.',
      ]);
    });

    it('count a main that is mounted later, and warn for a second one at that point', () => {
      const warn = spyWarn();
      const { rerender } = render(
        <AppShell>
          <AppShellMain>M</AppShellMain>
        </AppShell>,
      );
      expect(warn).not.toHaveBeenCalled();
      rerender(
        <AppShell>
          <AppShellMain>M</AppShellMain>
          <AppShellFooter>F</AppShellFooter>
          <AppShellMain key="second">M2</AppShellMain>
        </AppShell>,
      );
      expect(warnings(warn)).toEqual([
        '[h2d-glass-ui] <AppShell> has more than one <AppShellMain>.',
      ]);
    });

    it('do not carry a value, so a changing one cannot make a new message', () => {
      const warn = spyWarn();
      for (const layout of ['sidebar', 'header'] as const) {
        render(
          <AppShell layout={layout} brand={<AppShellBrand name={layout} />}>
            <div>
              <AppShellFooter>F</AppShellFooter>
            </div>
            <AppShellMain>M</AppShellMain>
          </AppShell>,
        );
      }
      // Two shells, one mistake each: the text is the same, so it is printed once.
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });
});
