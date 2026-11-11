import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Fragment, StrictMode, createElement, createRef } from 'react';
import type { ComponentProps, MouseEvent, ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IS_REACT_19 } from '../../internal/react-version';
import { resetDevWarnings } from '../../internal/warn';
import { AppShell, AppShellHeader, AppShellMain, AppShellSidebar } from '../app-shell/AppShell';
import { Nav, NavGroup, NavItem, NavSection } from './Nav';

beforeEach(() => {
  resetDevWarnings();
  vi.restoreAllMocks();
});

const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
const warnings = (warn: ReturnType<typeof spyWarn>) => warn.mock.calls.map((call) => call[0]);
const ICON = <svg data-testid="icon" />;
// The name of a link with a count. The label and the count are two flex items, and the engines put a
// space between flex items when they read a name; jsdom has no layout and writes them together, so the
// tests allow either, and the stories (Names) check the real name in the three engines.
const withCount = (label: string, count: string) => new RegExp(`^${label}\\s?${count}$`);

/** The three kinds of item of the mockup, with its first and last parts: a plain list, a group, a foot. */
function Sample(props: ComponentProps<typeof Nav>) {
  return (
    <Nav {...props}>
      <NavItem href="/" icon={ICON} active>
        Overview
      </NavItem>
      <NavItem href="/inbox" badge={12}>
        Inbox
      </NavItem>
      <NavSection title="Projects">
        <NavGroup label="Design" icon={ICON}>
          <NavItem href="/design/system" active>
            Design system
          </NavItem>
          <NavItem href="/design/mobile">Mobile</NavItem>
        </NavGroup>
        <NavGroup label="Engineering">
          <NavItem href="/eng">Engineering home</NavItem>
        </NavGroup>
      </NavSection>
      <NavSection bottom>
        <NavItem href="/settings">Settings</NavItem>
      </NavSection>
    </Nav>
  );
}

describe('Nav', () => {
  it('is a navigation landmark named Main, in the pill look, with a list of its links', () => {
    const { container } = render(<Sample />);
    const nav = container.firstElementChild!;
    expect(nav.tagName).toBe('NAV');
    expect(nav).toHaveClass('flg-nav');
    expect(nav).toHaveAttribute('data-variant', 'pill');
    expect(screen.getByRole('navigation', { name: 'Main' })).toBe(nav);
  });

  it.each(['pill', 'bar'] as const)('reflects variant %s', (variant) => {
    const { container } = render(<Sample variant={variant} />);
    expect(container.firstElementChild).toHaveAttribute('data-variant', variant);
  });

  it('takes a variant outside the union for the default look', () => {
    // @ts-expect-error not a variant: what plain JavaScript can pass
    const { container } = render(<Sample variant="gradient" />);
    expect(container.firstElementChild).toHaveAttribute('data-variant', 'pill');
  });

  it('keeps the look when `data-variant` is forwarded by a wrapper', () => {
    const { container } = render(<Sample variant="bar" {...{ 'data-variant': 'pill' }} />);
    expect(container.firstElementChild).toHaveAttribute('data-variant', 'bar');
  });

  it('takes its default name from `labels`, a key at a time, and keeps one given as undefined', () => {
    const { rerender } = render(<Sample labels={{ nav: 'Principal' }} />);
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
    rerender(<Sample labels={{ nav: undefined }} />);
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('keeps the name the caller gives, with aria-label or aria-labelledby, and adds none beside it', () => {
    const { rerender } = render(<Sample aria-label="Docs" />);
    expect(screen.getByRole('navigation', { name: 'Docs' })).toBeInTheDocument();
    rerender(
      <>
        <h2 id="title">Site</h2>
        <Sample aria-labelledby="title" />
      </>,
    );
    const nav = screen.getByRole('navigation', { name: 'Site' });
    expect(nav).not.toHaveAttribute('aria-label');
  });

  it('forwards the ref to the <nav> and puts className, style and other props on it', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <Nav ref={ref} className="mine" style={{ margin: 3 }} id="side">
        <NavItem href="/a">A</NavItem>
      </Nav>,
    );
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current).toHaveClass('flg-nav', 'mine');
    expect(ref.current).toHaveStyle({ margin: '3px' });
    expect(ref.current).toHaveAttribute('id', 'side');
  });

  it('renders nothing when there is nothing to show, and no landmark', () => {
    const { container } = render(
      <Nav>
        {null}
        {false}
        <Fragment>{[]}</Fragment>
      </Nav>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the items that stand together outside a section in one list, and each section in its own', () => {
    render(
      <Nav>
        <NavItem href="/a">A</NavItem>
        <NavItem href="/b">B</NavItem>
        <NavSection title="Group">
          <NavItem href="/c">C</NavItem>
        </NavSection>
        <NavItem href="/d">D</NavItem>
      </Nav>,
    );
    const lists = screen.getAllByRole('list');
    expect(lists).toHaveLength(3);
    expect(within(lists[0]!).getAllByRole('listitem')).toHaveLength(2);
    expect(within(lists[1]!).getAllByRole('link', { name: 'C' })).toHaveLength(1);
    expect(within(lists[2]!).getAllByRole('link', { name: 'D' })).toHaveLength(1);
    // Safari drops the list semantics of a list with no bullets, so each list says it is one.
    for (const list of lists) expect(list).toHaveAttribute('role', 'list');
    expect(lists[1]!.closest('.flg-nav-section')).toHaveAttribute('role', 'group');
  });

  it('reads items and sections through Fragments and arrays, in order', () => {
    render(
      <Nav>
        <Fragment>
          <NavItem href="/a">A</NavItem>
          {[
            <NavItem key="b" href="/b">
              B
            </NavItem>,
            <NavSection key="s" title="S">
              <NavItem href="/c">C</NavItem>
            </NavSection>,
          ]}
        </Fragment>
      </Nav>,
    );
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(['A', 'B', 'C']);
    expect(screen.getAllByRole('list')).toHaveLength(2);
  });

  it('takes a component of the user’s own around an item for an item', () => {
    function Mine() {
      return <NavItem href="/mine">Mine</NavItem>;
    }
    render(
      <Nav>
        <Mine />
        <NavItem href="/b">B</NavItem>
      </Nav>,
    );
    const [list] = screen.getAllByRole('list');
    expect(within(list!).getAllByRole('link')).toHaveLength(2);
  });

  it('keeps the state of an item whose key stays when another is put before it', async () => {
    const user = userEvent.setup();
    function Counted({ extra }: { extra: boolean }) {
      return (
        <Nav>
          {extra ? (
            <NavItem key="x" href="/x">
              X
            </NavItem>
          ) : null}
          <NavGroup key="g" label="G">
            <NavItem href="/g">In G</NavItem>
          </NavGroup>
        </Nav>
      );
    }
    const { rerender } = render(<Counted extra={false} />);
    await user.click(screen.getByRole('button', { name: 'G' }));
    expect(screen.getByRole('button', { name: 'G' })).toHaveAttribute('aria-expanded', 'true');
    rerender(<Counted extra />);
    expect(screen.getByRole('button', { name: 'G' })).toHaveAttribute('aria-expanded', 'true');
  });

  /** Opens the two groups and focuses the first; the check it returns asks that both stay so. */
  async function openBoth(user: ReturnType<typeof userEvent.setup>) {
    const engineering = screen.getByRole('button', { name: 'Engineering' });
    const design = screen.getByRole('button', { name: 'Design' });
    await user.click(engineering);
    await user.click(design);
    engineering.focus();
    return () => {
      expect(screen.getByRole('button', { name: 'Engineering' })).toBe(engineering);
      expect(screen.getByRole('button', { name: 'Design' })).toBe(design);
      expect(engineering).toHaveAttribute('aria-expanded', 'true');
      expect(design).toHaveAttribute('aria-expanded', 'true');
      expect(engineering).toHaveFocus();
    };
  }

  // The ordinary way to write a navigation: an item that shows only sometimes (a permission that
  // loads, a page that exists only now). What comes after it keeps its slot, as in plain React.
  it('keeps the groups after an item without a key that comes and goes: open, the same nodes, the focus', async () => {
    const user = userEvent.setup();
    function Conditional({ extra }: { extra: boolean }) {
      return (
        <Nav>
          <NavItem href="/">Overview</NavItem>
          {extra && <NavItem href="/drafts">Drafts</NavItem>}
          <NavGroup label="Engineering">
            <NavItem href="/eng">Engineering home</NavItem>
          </NavGroup>
          <NavSection title="Projects">
            <NavGroup label="Design">
              <NavItem href="/design">Design home</NavItem>
            </NavGroup>
          </NavSection>
        </Nav>
      );
    }
    const { rerender } = render(<Conditional extra={false} />);
    const unchanged = await openBoth(user);
    rerender(<Conditional extra />);
    expect(screen.getByRole('link', { name: 'Drafts' })).toBeInTheDocument();
    unchanged();
    rerender(<Conditional extra={false} />);
    unchanged();
  });

  it('keeps the run of items after a keyed section that comes and goes before it', async () => {
    const user = userEvent.setup();
    function Pinned({ pinned }: { pinned: boolean }) {
      return (
        <Nav>
          {pinned && (
            <NavSection key="pinned" title="Pinned">
              <NavItem href="/pinned">Pinned page</NavItem>
            </NavSection>
          )}
          <NavItem key="overview" href="/">
            Overview
          </NavItem>
          <NavGroup key="engineering" label="Engineering">
            <NavItem href="/eng">Engineering home</NavItem>
          </NavGroup>
          <NavSection key="projects" title="Projects">
            <NavGroup label="Design">
              <NavItem href="/design">Design home</NavItem>
            </NavGroup>
          </NavSection>
        </Nav>
      );
    }
    const { rerender } = render(<Pinned pinned={false} />);
    const unchanged = await openBoth(user);
    rerender(<Pinned pinned />);
    expect(screen.getByRole('group', { name: 'Pinned' })).toBeInTheDocument();
    unchanged();
    rerender(<Pinned pinned={false} />);
    unchanged();
  });

  it('warns about a part outside a Nav, once each, and still renders it', () => {
    const warn = spyWarn();
    render(
      <>
        <NavItem href="/a">A</NavItem>
        <NavGroup label="G" defaultOpen>
          <NavItem href="/g">G</NavItem>
        </NavGroup>
        <NavSection title="S">
          <NavItem href="/s">S</NavItem>
        </NavSection>
      </>,
    );
    expect(warnings(warn)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          '<NavItem> must be rendered inside <Nav>, <NavSection> or <NavGroup>.',
        ),
        expect.stringContaining(
          '<NavGroup> must be rendered inside <Nav>, <NavSection> or <NavGroup>.',
        ),
        expect.stringContaining('<NavSection> must be a direct child of <Nav>.'),
      ]),
    );
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('warns about a NavSection that is not a direct child of the Nav', () => {
    const warn = spyWarn();
    render(
      <Nav>
        <NavSection title="Outer">
          <NavSection title="Inner">
            <NavItem href="/a">A</NavItem>
          </NavSection>
        </NavSection>
      </Nav>,
    );
    expect(warnings(warn)).toEqual([
      expect.stringContaining('<NavSection> must be a direct child of <Nav>.'),
    ]);
  });

  it('warns about a group in a group, and renders it as a link of the first', () => {
    const warn = spyWarn();
    render(
      <Nav>
        <NavGroup label="Outer" defaultOpen>
          <NavGroup label="Inner" defaultOpen>
            <NavItem href="/a">A</NavItem>
          </NavGroup>
        </NavGroup>
      </Nav>,
    );
    expect(warnings(warn)).toEqual([
      expect.stringContaining('<NavGroup> inside <NavGroup> is not supported'),
    ]);
    expect(screen.getByRole('link', { name: 'A' })).toBeInTheDocument();
  });

  it('does not warn for a Nav that is used as it should be', () => {
    const warn = spyWarn();
    render(<Sample />);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('NavSection', () => {
  it('is a group named by its title, with the title above its list', () => {
    render(
      <Nav>
        <NavSection title="Projects">
          <NavItem href="/a">A</NavItem>
        </NavSection>
      </Nav>,
    );
    const group = screen.getByRole('group', { name: 'Projects' });
    expect(group).toHaveClass('flg-nav-section');
    expect(group.firstElementChild).toHaveClass('flg-nav-section-title');
    expect(group.firstElementChild).toHaveTextContent('Projects');
    expect(group.lastElementChild!.tagName).toBe('UL');
  });

  it('is only a gap without a title: no role, no title', () => {
    const { container } = render(
      <Nav>
        <NavSection>
          <NavItem href="/a">A</NavItem>
        </NavSection>
      </Nav>,
    );
    const section = container.querySelector('.flg-nav-section')!;
    expect(section).not.toHaveAttribute('role');
    expect(section).not.toHaveAttribute('aria-labelledby');
    expect(section.querySelector('.flg-nav-section-title')).toBeNull();
  });

  it('puts a rule above the items of the one at the foot, and marks it', () => {
    const { container } = render(
      <Nav>
        <NavSection bottom>
          <NavItem href="/a">A</NavItem>
        </NavSection>
        <NavSection>
          <NavItem href="/b">B</NavItem>
        </NavSection>
      </Nav>,
    );
    const [bottom, other] = container.querySelectorAll('.flg-nav-section');
    expect(bottom).toHaveAttribute('data-bottom');
    expect(other).not.toHaveAttribute('data-bottom');
    const rule = bottom!.firstElementChild!;
    expect(rule).toHaveClass('flg-divider');
    // A rule that only decorates is not a separator for a screen reader.
    expect(rule).toHaveAttribute('role', 'none');
    expect(other!.querySelector('.flg-divider')).toBeNull();
  });

  it('forwards the ref to its element and puts className and other props on it', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Nav>
        <NavSection ref={ref} title="T" className="mine" data-x="1">
          <NavItem href="/a">A</NavItem>
        </NavSection>
      </Nav>,
    );
    expect(ref.current).toBe(screen.getByRole('group', { name: 'T' }));
    expect(ref.current).toHaveClass('flg-nav-section', 'mine');
    expect(ref.current).toHaveAttribute('data-x', '1');
  });

  it('keeps the role and the name the caller gives', () => {
    render(
      <Nav>
        <NavSection title="T" role="region" aria-label="Mine">
          <NavItem href="/a">A</NavItem>
        </NavSection>
      </Nav>,
    );
    expect(screen.getByRole('region', { name: 'Mine' })).toBeInTheDocument();
  });

  // A name on an element with no role is not allowed, and assistive technology drops it.
  it('is a group without a title too when the caller names it, with aria-label or aria-labelledby', () => {
    render(
      <>
        <span id="team">Team</span>
        <Nav>
          <NavSection aria-label="Projects">
            <NavItem href="/a">A</NavItem>
          </NavSection>
          <NavSection aria-labelledby="team">
            <NavItem href="/b">B</NavItem>
          </NavSection>
        </Nav>
      </>,
    );
    for (const name of ['Projects', 'Team']) {
      const group = screen.getByRole('group', { name });
      expect(group).toHaveClass('flg-nav-section');
      expect(group.querySelector('.flg-nav-section-title')).toBeNull();
    }
  });
});

describe('NavItem', () => {
  it('is a link in a list item: the icon, then the label', () => {
    render(
      <Nav>
        <NavItem href="/inbox" icon={ICON}>
          Inbox
        </NavItem>
      </Nav>,
    );
    const link = screen.getByRole('link', { name: 'Inbox' });
    expect(link.parentElement!.tagName).toBe('LI');
    expect(link).toHaveClass('flg-nav-item');
    expect(link).toHaveAttribute('href', '/inbox');
    expect(Array.from(link.children).map((child) => child.className)).toEqual([
      'flg-nav-item-icon',
      'flg-nav-item-label',
    ]);
    expect(link.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(link.firstElementChild).toContainElement(screen.getByTestId('icon'));
  });

  it('has no icon cell without an icon', () => {
    const { container } = render(
      <Nav>
        <NavItem href="/a">A</NavItem>
      </Nav>,
    );
    expect(container.querySelector('.flg-nav-item-icon')).toBeNull();
  });

  it('sets aria-current="page" for the active page, and for no other', () => {
    render(
      <Nav>
        <NavItem href="/a" active>
          A
        </NavItem>
        <NavItem href="/b">B</NavItem>
      </Nav>,
    );
    expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'B' })).not.toHaveAttribute('aria-current');
  });

  it('follows `active` on a mounted item', () => {
    const { rerender } = render(
      <Nav>
        <NavItem href="/a">A</NavItem>
      </Nav>,
    );
    rerender(
      <Nav>
        <NavItem href="/a" active>
          A
        </NavItem>
      </Nav>,
    );
    expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('aria-current', 'page');
    rerender(
      <Nav>
        <NavItem href="/a">A</NavItem>
      </Nav>,
    );
    expect(screen.getByRole('link', { name: 'A' })).not.toHaveAttribute('aria-current');
  });

  it('keeps an aria-current the caller gives', () => {
    render(
      <Nav>
        <NavItem href="/a" active aria-current="step">
          A
        </NavItem>
      </Nav>,
    );
    expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('aria-current', 'step');
  });

  it('forwards the ref to the link and puts className, style and other props on it', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Nav>
        <NavItem
          ref={ref}
          href="/a"
          className="mine"
          style={{ margin: 3 }}
          target="_blank"
          title="T"
        >
          A
        </NavItem>
      </Nav>,
    );
    const link = screen.getByRole('link', { name: 'A' });
    expect(ref.current).toBe(link);
    expect(link).toHaveClass('flg-nav-item', 'mine');
    expect(link).toHaveStyle({ margin: '3px' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('title', 'T');
  });

  describe('disabled', () => {
    it('is a link that goes nowhere: no href, aria-disabled, out of the tab order', async () => {
      const onClick = vi.fn();
      render(
        <Nav>
          <NavItem href="/a" disabled onClick={onClick}>
            Archive
          </NavItem>
          <NavItem href="/b">B</NavItem>
        </Nav>,
      );
      const link = screen.getByRole('link', { name: 'Archive' });
      expect(link).not.toHaveAttribute('href');
      expect(link).toHaveAttribute('role', 'link');
      expect(link).toHaveAttribute('aria-disabled', 'true');
      await userEvent.setup().tab();
      expect(screen.getByRole('link', { name: 'B' })).toHaveFocus();
      fireEvent.click(link);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('with asChild: the child keeps its href, is marked, leaves the tab order and ignores presses', () => {
      const onClick = vi.fn();
      const onChildClick = vi.fn();
      render(
        <Nav>
          <NavItem asChild disabled onClick={onClick}>
            <a href="/a" onClick={onChildClick}>
              Archive
            </a>
          </NavItem>
        </Nav>,
      );
      const link = screen.getByRole('link', { name: 'Archive' });
      expect(link).toHaveAttribute('href', '/a');
      expect(link).toHaveAttribute('aria-disabled', 'true');
      expect(link).toHaveAttribute('tabindex', '-1');
      const notPrevented = fireEvent.click(link);
      // The press is stopped before it reaches either handler, and the navigation with it.
      expect(notPrevented).toBe(false);
      expect(onClick).not.toHaveBeenCalled();
      expect(onChildClick).not.toHaveBeenCalled();
    });

    it('is a link again when it stops being disabled', () => {
      const { rerender } = render(
        <Nav>
          <NavItem href="/a" disabled>
            A
          </NavItem>
        </Nav>,
      );
      rerender(
        <Nav>
          <NavItem href="/a">A</NavItem>
        </Nav>,
      );
      const link = screen.getByRole('link', { name: 'A' });
      expect(link).toHaveAttribute('href', '/a');
      expect(link).not.toHaveAttribute('aria-disabled');
    });
  });

  describe('asChild', () => {
    it('renders the child as the link: it keeps its props, its content is the label, the cells wrap it', () => {
      const ref = createRef<HTMLAnchorElement>();
      const onClick = vi.fn((event) => event.preventDefault());
      render(
        <Nav>
          <NavItem asChild ref={ref} icon={ICON} badge={3} active className="mine">
            <a href="/inbox" className="router" data-router onClick={onClick}>
              Inbox
            </a>
          </NavItem>
        </Nav>,
      );
      const link = screen.getByRole('link', { name: withCount('Inbox', '3') });
      expect(ref.current).toBe(link);
      expect(link).toHaveAttribute('href', '/inbox');
      expect(link).toHaveAttribute('data-router');
      expect(link).toHaveAttribute('aria-current', 'page');
      expect(link).toHaveClass('flg-nav-item', 'router', 'mine');
      expect(Array.from(link.children).map((child) => child.className)).toEqual([
        'flg-nav-item-icon',
        'flg-nav-item-label',
        'flg-badge flg-nav-item-badge',
      ]);
      expect(link.querySelector('.flg-nav-item-label')).toHaveTextContent('Inbox');
      fireEvent.click(link);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('takes a child that a Server Component handed over as a lazy reference', () => {
      if (!IS_REACT_19) return;
      const lazy = {
        $$typeof: Symbol.for('react.lazy'),
        _payload: <a href="/a">Lazy</a>,
        _init: (value: unknown) => value,
      } as unknown as ReactNode;
      render(
        <Nav>
          <NavItem asChild icon={ICON}>
            {lazy}
          </NavItem>
        </Nav>,
      );
      const link = screen.getByRole('link', { name: 'Lazy' });
      expect(link).toHaveClass('flg-nav-item');
      expect(link.querySelector('.flg-nav-item-icon')).not.toBeNull();
    });

    it('warns, and renders nothing, when the child is not one element', () => {
      const warn = spyWarn();
      render(
        <Nav>
          <NavItem asChild>text</NavItem>
        </Nav>,
      );
      expect(warnings(warn)).toEqual([expect.stringContaining('`asChild` expects exactly one')]);
    });
  });

  describe('badge', () => {
    it('is a neutral Badge in the pill look, and part of the name of the link', () => {
      render(
        <Nav>
          <NavItem href="/inbox" badge={12}>
            Inbox
          </NavItem>
        </Nav>,
      );
      const link = screen.getByRole('link', { name: withCount('Inbox', '12') });
      const badge = link.lastElementChild!;
      expect(badge).toHaveClass('flg-badge', 'flg-nav-item-badge');
      expect(badge).toHaveAttribute('data-variant', 'neutral');
      expect(badge).toHaveTextContent('12');
    });

    it('is a bare count in the bar look, with no Badge', () => {
      const { container } = render(
        <Nav variant="bar">
          <NavItem href="/inbox" badge="12">
            Inbox
          </NavItem>
        </Nav>,
      );
      expect(container.querySelector('.flg-badge')).toBeNull();
      const count = container.querySelector('.flg-nav-item-count')!;
      expect(count).toHaveTextContent('12');
      expect(screen.getByRole('link', { name: withCount('Inbox', '12') })).toContainElement(
        count as HTMLElement,
      );
    });

    it('shows 0 and a short text, and nothing for what renders nothing', () => {
      const { container } = render(
        <Nav>
          <NavItem href="/a" badge={0}>
            A
          </NavItem>
          <NavItem href="/b" badge="new">
            B
          </NavItem>
          <NavItem href="/c" badge="">
            C
          </NavItem>
          <NavItem href="/d" badge={null}>
            D
          </NavItem>
          <NavItem href="/e" badge={false}>
            E
          </NavItem>
        </Nav>,
      );
      expect(screen.getByRole('link', { name: withCount('A', '0') })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: withCount('B', 'new') })).toBeInTheDocument();
      expect(container.querySelectorAll('.flg-badge')).toHaveLength(2);
      for (const name of ['C', 'D', 'E']) {
        expect(screen.getByRole('link', { name })).toBeInTheDocument();
      }
    });

    it('puts an element in the last cell as it is, in either look', () => {
      const badge = <em data-testid="mine">12 unread</em>;
      const { rerender } = render(
        <Nav>
          <NavItem href="/a" badge={badge}>
            A
          </NavItem>
        </Nav>,
      );
      const link = screen.getByRole('link', { name: withCount('A', '12 unread') });
      expect(link.lastElementChild).toBe(screen.getByTestId('mine'));
      rerender(
        <Nav variant="bar">
          <NavItem href="/a" badge={badge}>
            A
          </NavItem>
        </Nav>,
      );
      expect(screen.getByRole('link', { name: withCount('A', '12 unread') }).lastElementChild).toBe(
        screen.getByTestId('mine'),
      );
    });

    it('is drawn again when the look of a mounted Nav changes', () => {
      const { container, rerender } = render(
        <Nav variant="pill">
          <NavItem href="/a" badge={5}>
            A
          </NavItem>
        </Nav>,
      );
      expect(container.querySelector('.flg-badge')).not.toBeNull();
      rerender(
        <Nav variant="bar">
          <NavItem href="/a" badge={5}>
            A
          </NavItem>
        </Nav>,
      );
      expect(container.querySelector('.flg-badge')).toBeNull();
      expect(container.querySelector('.flg-nav-item-count')).toHaveTextContent('5');
    });
  });

  it('does not need an AppShell: a click goes to the handler and nothing else happens', () => {
    const onClick = vi.fn((event) => event.preventDefault());
    render(
      <Nav>
        <NavItem href="/a" onClick={onClick}>
          A
        </NavItem>
      </Nav>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'A' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('NavGroup', () => {
  it('is a list item with a button and a list of links that the button names', () => {
    const { container } = render(
      <Nav>
        <NavGroup label="Design" icon={ICON} defaultOpen>
          <NavItem href="/a">A</NavItem>
        </NavGroup>
      </Nav>,
    );
    const group = container.querySelector('li.flg-nav-group')!;
    const button = screen.getByRole('button', { name: 'Design' });
    expect(button.parentElement).toBe(group);
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('flg-nav-item');
    expect(Array.from(button.children).map((child) => child.getAttribute('class'))).toEqual([
      'flg-nav-item-icon',
      'flg-nav-item-label',
      'flg-nav-group-chevron',
    ]);
    // The chevron only shows the state, which `aria-expanded` says.
    expect(button.lastElementChild).toHaveAttribute('aria-hidden', 'true');
    const sub = group.querySelector('.flg-nav-sub')!;
    expect(button).toHaveAttribute('aria-controls', sub.id);
    expect(sub.id).not.toBe('');
    const list = screen.getByRole('list', { name: 'Design' });
    expect(sub).toContainElement(list);
    expect(list).toHaveAttribute('role', 'list');
    expect(within(list).getByRole('link', { name: 'A' })).toBeInTheDocument();
  });

  it('is closed from the start, with its links hidden, when no link of it is active', () => {
    const { container } = render(
      <Nav>
        <NavGroup label="Design">
          <NavItem href="/a">A</NavItem>
        </NavGroup>
      </Nav>,
    );
    const button = screen.getByRole('button', { name: 'Design' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('.flg-nav-sub')).toHaveAttribute('hidden');
    expect(container.querySelector('.flg-nav-group')).not.toHaveAttribute('data-open');
    expect(screen.queryByRole('link', { name: 'A' })).toBeNull();
  });

  it('is open from the start when a direct link is active, and says it has the page', () => {
    const { container } = render(
      <Nav>
        <NavGroup label="Design">
          <NavItem href="/a">A</NavItem>
          <NavItem href="/b" active>
            B
          </NavItem>
        </NavGroup>
      </Nav>,
    );
    expect(screen.getByRole('button', { name: 'Design' })).toHaveAttribute('aria-expanded', 'true');
    const group = container.querySelector('.flg-nav-group')!;
    expect(group).toHaveAttribute('data-open');
    expect(group).toHaveAttribute('data-has-active');
    expect(container.querySelector('.flg-nav-sub')).not.toHaveAttribute('hidden');
  });

  it('is open in the HTML from the server, where no effect has run', () => {
    const html = renderToString(
      <Nav>
        <NavGroup label="Design">
          <NavItem href="/a" active>
            A
          </NavItem>
        </NavGroup>
        <NavGroup label="Other">
          <NavItem href="/b">B</NavItem>
        </NavGroup>
      </Nav>,
    );
    const root = document.createElement('div');
    root.innerHTML = html;
    const [design, other] = root.querySelectorAll('.flg-nav-group');
    expect(design).toHaveAttribute('data-open');
    expect(design!.querySelector('.flg-nav-sub')).not.toHaveAttribute('hidden');
    expect(design!.querySelector('button')).toHaveAttribute('aria-expanded', 'true');
    expect(other).not.toHaveAttribute('data-open');
    expect(other!.querySelector('.flg-nav-sub')).toHaveAttribute('hidden');
  });

  it('finds an active link through Fragments and arrays', () => {
    render(
      <Nav>
        <NavGroup label="Design">
          <Fragment>
            <NavItem href="/a">A</NavItem>
            {[
              <NavItem key="b" href="/b" active>
                B
              </NavItem>,
            ]}
          </Fragment>
        </NavGroup>
      </Nav>,
    );
    expect(screen.getByRole('button', { name: 'Design' })).toHaveAttribute('aria-expanded', 'true');
  });

  // Only Server Components hand a child over as a lazy reference, and they need React 19.
  it.runIf(IS_REACT_19)('finds an active link that came as a lazy reference', () => {
    const lazy = {
      $$typeof: Symbol.for('react.lazy'),
      _payload: (
        <NavItem href="/b" active>
          B
        </NavItem>
      ),
      _init: (value: unknown) => value,
    } as unknown as ReactNode;
    render(
      <Nav>
        <NavGroup label="Design">{lazy}</NavGroup>
      </Nav>,
    );
    expect(screen.getByRole('button', { name: 'Design' })).toHaveAttribute('aria-expanded', 'true');
  });

  describe('with links from an iterator that can be walked once', () => {
    interface Page {
      id: string;
      active: boolean;
    }
    const PAGES: Page[] = [
      { id: 'a', active: false },
      { id: 'b', active: true },
    ];
    const item = (page: Page) => (
      <NavItem key={page.id} href={`/${page.id}`} active={page.active}>
        {page.id.toUpperCase()}
      </NavItem>
    );
    function* generator() {
      for (const page of PAGES) yield item(page);
    }
    // `pages.values().map(…)`, where the runtime has iterator helpers; a hand-made iterator otherwise.
    function helper(): Iterable<ReactNode> {
      const values = PAGES.values() as ArrayIterator<Page> & {
        map?: (fn: (page: Page) => ReactNode) => Iterable<ReactNode>;
      };
      if (values.map) return values.map(item);
      let index = 0;
      const iterator: IterableIterator<ReactNode> = {
        next: () =>
          index < PAGES.length
            ? { value: item(PAGES[index++]!), done: false }
            : { value: undefined, done: true },
        [Symbol.iterator]: () => iterator,
      };
      return iterator;
    }

    // Handed over as a prop, not as a JSX child: the development build of React 18 walks a JSX child
    // that is an iterator to check its keys, which uses it up before the group sees it (React 19
    // leaves alone an iterator that is its own iterable). The group renders again with the same
    // children when it closes and opens.
    it.each([
      ['a generator', generator],
      ['an iterator helper', helper],
    ])(
      'renders them from %s, sees the active one, and keeps them when it closes and opens',
      async (_, make) => {
        const user = userEvent.setup();
        const { container } = render(
          <Nav>{createElement(NavGroup, { label: 'Design', children: make() })}</Nav>,
        );
        const button = screen.getByRole('button', { name: 'Design' });
        const links = () =>
          within(container.querySelector<HTMLElement>('.flg-nav-sub')!)
            .queryAllByRole('link', { hidden: true })
            .map((link) => link.textContent);
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(container.querySelector('.flg-nav-group')).toHaveAttribute('data-has-active');
        expect(links()).toEqual(['A', 'B']);
        await user.click(button);
        await user.click(button);
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(links()).toEqual(['A', 'B']);
      },
    );

    // StrictMode renders a component twice on its first render. React 19 keeps the list that the
    // first one read; React 18 reads again, from an iterator that is used up by then.
    it.runIf(IS_REACT_19)('renders them under StrictMode, in a Nav and in a group', () => {
      render(
        <StrictMode>
          {createElement(Nav, {
            children: [
              ...generator(),
              createElement(NavGroup, { key: 'g', label: 'Design', children: helper() }),
            ],
          })}
        </StrictMode>,
      );
      render(
        <StrictMode>
          {createElement(Nav, { 'aria-label': 'Other', children: generator() })}
        </StrictMode>,
      );
      const names = (nav: string) =>
        within(screen.getByRole('navigation', { name: nav }))
          .queryAllByRole('link', { hidden: true })
          .map((link) => link.textContent);
      expect(names('Main')).toEqual(['A', 'B', 'A', 'B']);
      expect(names('Other')).toEqual(['A', 'B']);
    });
  });

  it('does not see an active link inside a component of the user’s own; defaultOpen opens it', () => {
    function Mine() {
      return (
        <NavItem href="/b" active>
          B
        </NavItem>
      );
    }
    const { container, unmount } = render(
      <Nav>
        <NavGroup label="Design">
          <Mine />
        </NavGroup>
      </Nav>,
    );
    expect(screen.getByRole('button', { name: 'Design' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(container.querySelector('.flg-nav-group')).not.toHaveAttribute('data-has-active');
    unmount();
    render(
      <Nav>
        <NavGroup label="Design" defaultOpen>
          <Mine />
        </NavGroup>
      </Nav>,
    );
    expect(screen.getByRole('button', { name: 'Design' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens with defaultOpen whatever its links say, and stays closed with defaultOpen={false}', () => {
    render(
      <Nav>
        <NavGroup label="One" defaultOpen>
          <NavItem href="/a">A</NavItem>
        </NavGroup>
        <NavGroup label="Two" defaultOpen={false}>
          <NavItem href="/b" active>
            B
          </NavItem>
        </NavGroup>
      </Nav>,
    );
    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens and closes on a click, and tells onOpenChange', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container } = render(
      <Nav>
        <NavGroup label="Design" onOpenChange={onOpenChange}>
          <NavItem href="/a">A</NavItem>
        </NavGroup>
      </Nav>,
    );
    const button = screen.getByRole('button', { name: 'Design' });
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('.flg-nav-group')).toHaveAttribute('data-open');
    expect(screen.getByRole('link', { name: 'A' })).toBeVisible();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('.flg-nav-sub')).toHaveAttribute('hidden');
    expect(container.querySelector('.flg-nav-group')).not.toHaveAttribute('data-open');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it.each([['{Enter}'], [' ']])('opens and closes from the keyboard with %j', async (key) => {
    const user = userEvent.setup();
    render(
      <Nav>
        <NavGroup label="Design">
          <NavItem href="/a">A</NavItem>
        </NavGroup>
      </Nav>,
    );
    await user.tab();
    const button = screen.getByRole('button', { name: 'Design' });
    expect(button).toHaveFocus();
    await user.keyboard(key);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard(key);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('is the parent’s to open when controlled: a click only asks', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Nav>
        <NavGroup label="Design" open={false} onOpenChange={onOpenChange}>
          <NavItem href="/a">A</NavItem>
        </NavGroup>
      </Nav>,
    );
    const button = screen.getByRole('button', { name: 'Design' });
    await user.click(button);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    rerender(
      <Nav>
        <NavGroup label="Design" open onOpenChange={onOpenChange}>
          <NavItem href="/a">A</NavItem>
        </NavGroup>
      </Nav>,
    );
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('follows a change of the active link on a mounted group: it says it has the page, and keeps its state', () => {
    const Group = ({ active }: { active: boolean }) => (
      <Nav>
        <NavGroup label="Design">
          <NavItem href="/a" active={active}>
            A
          </NavItem>
        </NavGroup>
      </Nav>
    );
    const { container, rerender } = render(<Group active={false} />);
    expect(container.querySelector('.flg-nav-group')).not.toHaveAttribute('data-has-active');
    rerender(<Group active />);
    expect(container.querySelector('.flg-nav-group')).toHaveAttribute('data-has-active');
    // Opening is the start state only: a page reached later does not open a group the person closed.
    expect(screen.getByRole('button', { name: 'Design' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('forwards the ref to the <li> and puts className, style and other props on it', () => {
    const ref = createRef<HTMLLIElement>();
    const { container } = render(
      <Nav>
        <NavGroup ref={ref} label="G" className="mine" style={{ margin: 3 }} data-x="1">
          <NavItem href="/a">A</NavItem>
        </NavGroup>
      </Nav>,
    );
    const group = container.querySelector('li.flg-nav-group');
    expect(ref.current).toBe(group);
    expect(group).toHaveClass('mine');
    expect(group).toHaveStyle({ margin: '3px' });
    expect(group).toHaveAttribute('data-x', '1');
  });

  it('keeps the state it draws from after the props of a wrapper', () => {
    const { container } = render(
      <Nav>
        <NavGroup label="G" {...{ 'data-open': '' }}>
          <NavItem href="/a">A</NavItem>
        </NavGroup>
      </Nav>,
    );
    expect(container.querySelector('.flg-nav-group')).not.toHaveAttribute('data-open');
  });
});

describe('inside an AppShell', () => {
  const trigger = () => document.querySelector<HTMLElement>('.flg-app-shell-trigger')!;
  // The shells and navigations here are written as they should be, so development has nothing to say
  // about them: a warning would be noise in the output, and would hide a real one.
  let warn: ReturnType<typeof spyWarn>;
  beforeEach(() => {
    warn = spyWarn();
  });
  afterEach(() => {
    expect(warnings(warn)).toEqual([]);
  });

  function Shell({ nav, ...props }: { nav?: ReactNode } & ComponentProps<typeof AppShell>) {
    return (
      <AppShell {...props}>
        <AppShellHeader>Header</AppShellHeader>
        <AppShellSidebar>
          {nav ?? (
            <Nav>
              <NavItem href="#one" icon={ICON}>
                One
              </NavItem>
              <NavItem href="#two" icon={ICON}>
                Two
              </NavItem>
            </Nav>
          )}
        </AppShellSidebar>
        <AppShellMain>Main</AppShellMain>
      </AppShell>
    );
  }

  const isOpen = (container: HTMLElement) => container.firstElementChild!.hasAttribute('data-open');

  it('closes the sheet on a plain click and gives the focus back to the trigger', () => {
    const { container } = render(<Shell />);
    fireEvent.click(trigger());
    expect(isOpen(container)).toBe(true);
    const link = screen.getByRole('link', { name: 'One' });
    link.focus();
    // After the commit React gives the focus back to the element that had it, which jsdom still
    // shows (a sidebar that is not displayed is not a thing here), so the test asks what the shell
    // focused; the stories check where the focus ends in the real engines.
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    fireEvent.click(link);
    expect(isOpen(container)).toBe(false);
    expect(focus.mock.contexts).toContain(trigger());
  });

  it.each([['ctrlKey'], ['metaKey'], ['shiftKey'], ['altKey']])(
    'leaves the sheet open for a click with %s',
    (modifier) => {
      const { container } = render(<Shell defaultOpen />);
      fireEvent.click(screen.getByRole('link', { name: 'One' }), { [modifier]: true });
      expect(isOpen(container)).toBe(true);
    },
  );

  // The person stays on this page, and comes back to the sheet as they left it.
  it('leaves the sheet open for a link that opens the page elsewhere or saves it', () => {
    const { container } = render(
      <Shell
        defaultOpen
        nav={
          <Nav>
            <NavItem href="https://docs.example" target="_blank" icon={ICON}>
              Docs
            </NavItem>
            <NavItem href="/report.pdf" download icon={ICON}>
              Report
            </NavItem>
          </Nav>
        }
      />,
    );
    // jsdom does not follow links; the click is what the Nav hears.
    fireEvent.click(screen.getByRole('link', { name: 'Docs' }));
    expect(isOpen(container)).toBe(true);
    fireEvent.click(screen.getByRole('link', { name: 'Report' }));
    expect(isOpen(container)).toBe(true);
  });

  it('leaves the sheet open when the caller’s handler took the click (defaultPrevented)', () => {
    const { container } = render(
      <Shell
        defaultOpen
        nav={
          <Nav>
            <NavItem href="#one" icon={ICON} onClick={(event) => event.preventDefault()}>
              One
            </NavItem>
          </Nav>
        }
      />,
    );
    fireEvent.click(screen.getByRole('link', { name: 'One' }));
    expect(isOpen(container)).toBe(true);
  });

  it('closes the sheet for a router link, which calls the handler it is given before it navigates', () => {
    const navigate = vi.fn();
    function RouterLink({
      onClick,
      ...props
    }: ComponentProps<'a'> & { onClick?: (event: MouseEvent<HTMLAnchorElement>) => void }) {
      return (
        // The content is the `children` that the item hands to the link it clones.
        // eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <a
          {...props}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) {
              event.preventDefault();
              navigate();
            }
          }}
        />
      );
    }
    const { container } = render(
      <Shell
        defaultOpen
        nav={
          <Nav>
            <NavItem asChild icon={ICON}>
              <RouterLink href="/one">One</RouterLink>
            </NavItem>
          </Nav>
        }
      />,
    );
    fireEvent.click(screen.getByRole('link', { name: 'One' }));
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(isOpen(container)).toBe(false);
  });

  it('leaves the sheet open for a disabled item', () => {
    const { container } = render(
      <Shell
        defaultOpen
        nav={
          <Nav>
            <NavItem href="#one" icon={ICON} disabled>
              One
            </NavItem>
          </Nav>
        }
      />,
    );
    fireEvent.click(screen.getByRole('link', { name: 'One' }));
    expect(isOpen(container)).toBe(true);
  });

  it('leaves the sheet open for the button of a group', () => {
    const { container } = render(
      <Shell
        defaultOpen
        nav={
          <Nav>
            <NavGroup label="G" icon={ICON}>
              <NavItem href="#one">One</NavItem>
            </NavGroup>
          </Nav>
        }
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'G' }));
    expect(isOpen(container)).toBe(true);
    fireEvent.click(screen.getByRole('link', { name: 'One' }));
    expect(isOpen(container)).toBe(false);
  });

  it('closes a sheet that the parent owns by asking it, once', () => {
    const onOpenChange = vi.fn();
    render(<Shell open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole('link', { name: 'One' }));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('asks nothing of a shell whose sheet is closed', () => {
    const onOpenChange = vi.fn();
    render(<Shell onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole('link', { name: 'One' }));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  // The links read the part of the shell that does not change with its brand and its words. A shell
  // whose parent passes `brand` and `labels` inline gives both a new identity at every render, and
  // would otherwise render every link of the navigation again. The link below is an element of the
  // test's own that the item clones at each render of its own, so it renders exactly when the item does.
  it('does not render again when the shell renders with a new brand and new labels', () => {
    const renders = vi.fn();
    function CountedLink(props: ComponentProps<'a'>) {
      renders();
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      return <a {...props} />;
    }
    // One element, made once: the parent's render does not make the items again, as for a navigation
    // that comes from another component.
    const navigation = (
      <Nav>
        <NavItem asChild icon={ICON}>
          <CountedLink href="#one">One</CountedLink>
        </NavItem>
      </Nav>
    );
    function Page({ tick }: { tick: number }) {
      return (
        <AppShell brand={<b>Brand {tick}</b>} labels={{ skipToContent: `Skip ${tick}` }}>
          <AppShellHeader>Header</AppShellHeader>
          <AppShellSidebar>{navigation}</AppShellSidebar>
          <AppShellMain>Main</AppShellMain>
        </AppShell>
      );
    }
    const { rerender } = render(<Page tick={0} />);
    const mounted = renders.mock.calls.length;
    expect(mounted).toBeGreaterThan(0);
    rerender(<Page tick={1} />);
    rerender(<Page tick={2} />);
    expect(screen.getAllByText(/Brand 2/).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Skip 2' })).toBeInTheDocument();
    expect(renders).toHaveBeenCalledTimes(mounted);
  });
});
