import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { createPortal } from 'react-dom';
import type { ComponentProps, ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { resize, stubWindow } from '../../../tests/app-shell-window';
import { AppShell, AppShellHeader, AppShellMain, AppShellSidebar } from '../app-shell/AppShell';
import { Nav, NavGroup, NavItem, NavSection } from './Nav';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip/Tooltip';

// The rail is the sidebar of a wide AppShell that is collapsed. jsdom has no `matchMedia` and no
// Popover API, so the window is stubbed (tests/app-shell-window.ts) and so is the part of the Popover
// API the library asks: which popovers show.
const showing = new Set<Element>();
const original = {
  showPopover: HTMLElement.prototype.showPopover,
  hidePopover: HTMLElement.prototype.hidePopover,
  matches: Element.prototype.matches,
};

beforeEach(() => {
  resetDevWarnings();
  showing.clear();
  HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
    showing.add(this);
  };
  HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
    showing.delete(this);
  };
  Element.prototype.matches = function matches(this: Element, selector: string) {
    return selector === ':popover-open' ? showing.has(this) : original.matches.call(this, selector);
  } as typeof Element.prototype.matches;
});
afterEach(() => {
  Object.assign(HTMLElement.prototype, {
    showPopover: original.showPopover,
    hidePopover: original.hidePopover,
  });
  Element.prototype.matches = original.matches;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
const warnings = (warn: ReturnType<typeof spyWarn>) => warn.mock.calls.map((call) => call[0]);
const ICON = <svg data-testid="icon" />;
const NO_ICON_WARNING =
  '<NavItem> at the top level needs an icon when the sidebar can collapse to a rail; the rail shows the first letter of its label instead.';
// The label and the count are two flex items, and jsdom, with no layout, writes them together.
const named = (label: string, count: string) => new RegExp(`^${label}\\s?${count}$`);
const tooltips = () => [...document.querySelectorAll<HTMLElement>('[role="tooltip"]')];
const flyout = () => document.querySelector<HTMLElement>('.flg-nav-sub')!;
// jsdom does not know that a popover that shows is displayed, so its links are looked up as hidden.
const inFlyout = (name: string) => within(flyout()).getByRole('link', { name, hidden: true });
const groupButton = () => screen.getByRole('button', { name: 'Design' });

function Menu(props: ComponentProps<typeof Nav>) {
  return (
    <Nav {...props}>
      <NavItem href="/" icon={ICON} active>
        Overview
      </NavItem>
      <NavItem href="/inbox" icon={ICON} badge={12}>
        Inbox
      </NavItem>
      <NavItem href="/archive" icon={ICON} disabled>
        Archive
      </NavItem>
      <NavSection title="Projects">
        <NavGroup label="Design" icon={ICON}>
          <NavItem href="/design/system" badge={2} active>
            Design system
          </NavItem>
          <NavItem href="/design/mobile">Mobile app</NavItem>
        </NavGroup>
      </NavSection>
    </Nav>
  );
}

function Shell({ nav, ...props }: { nav?: ReactNode } & ComponentProps<typeof AppShell>) {
  return (
    <AppShell {...props}>
      <AppShellHeader>Header</AppShellHeader>
      <AppShellSidebar>{nav ?? <Menu />}</AppShellSidebar>
      <AppShellMain>
        <button type="button">Elsewhere</button>
      </AppShellMain>
    </AppShell>
  );
}

/** Lets the delay of a tooltip pass. */
const hover = (element: Element) => {
  fireEvent.pointerEnter(element, { pointerType: 'mouse' });
  act(() => {
    vi.advanceTimersByTime(600);
  });
};

describe('the Nav as a rail', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stubWindow(true);
  });

  describe('the tooltip of an item', () => {
    it('shows the label, on the right of the item, and does not describe the link by it', () => {
      render(<Shell defaultCollapsed />);
      const link = screen.getByRole('link', { name: named('Inbox', '12') });
      // The label is the name already: a description would be read a second time.
      expect(link).not.toHaveAttribute('aria-describedby');
      const tip = tooltips().find((element) => element.textContent === 'Inbox')!;
      expect(tip).toBeDefined();
      expect(tip).toHaveAttribute('data-side', 'right');
      expect(showing.has(tip)).toBe(false);
      hover(link);
      expect(showing.has(tip)).toBe(true);
      fireEvent.pointerLeave(link);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(showing.has(tip)).toBe(false);
    });

    it('is the label of a group button too', () => {
      render(<Shell defaultCollapsed />);
      expect(groupButton()).not.toHaveAttribute('aria-describedby');
      const tip = tooltips().find((element) => element.textContent === 'Design')!;
      hover(groupButton());
      expect(showing.has(tip)).toBe(true);
    });

    it.each([
      ['expanded', { defaultCollapsed: false }],
      ['collapsed on a narrow screen', { defaultCollapsed: true }],
    ])('is not in the page while the sidebar is %s', (name, props) => {
      stubWindow(name === 'expanded');
      render(<Shell {...props} />);
      expect(tooltips()).toHaveLength(0);
    });

    it('is not for an item that is disabled, which cannot be reached', () => {
      const warn = spyWarn();
      render(<Shell defaultCollapsed />);
      expect(tooltips().map((element) => element.textContent)).not.toContain('Archive');
      expect(warnings(warn)).toEqual([]);
    });

    it('is not for the links in the list of a group: they are drawn with their labels in the flyout', () => {
      render(<Shell defaultCollapsed />);
      expect(tooltips().map((element) => element.textContent)).toEqual([
        'Overview',
        'Inbox',
        'Design',
      ]);
    });

    it('goes away when the sidebar is expanded and comes back with the rail, on a mounted nav', () => {
      render(<Shell defaultCollapsed />);
      expect(tooltips()).toHaveLength(3);
      fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
      expect(tooltips()).toHaveLength(0);
      fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
      expect(tooltips()).toHaveLength(3);
    });

    it('opens on keyboard focus too', () => {
      render(<Shell defaultCollapsed />);
      const link = screen.getByRole('link', { name: named('Inbox', '12') });
      const tip = tooltips().find((element) => element.textContent === 'Inbox')!;
      // jsdom does not know `:focus-visible`: the focus after a key press is a keyboard one.
      const matches = link.matches.bind(link);
      vi.spyOn(link, 'matches').mockImplementation(
        (selector) => selector === ':focus-visible' || matches(selector),
      );
      fireEvent.keyDown(document, { key: 'Tab' });
      fireEvent.focus(link);
      act(() => {
        vi.advanceTimersByTime(10);
      });
      expect(showing.has(tip)).toBe(true);
    });

    // An item that may not show its tooltip starts no timer, and so does not close the tooltip of
    // another part of the page, which only one tooltip at a time may show.
    describe('leaves another open tooltip open', () => {
      function WithHeaderTooltip(props: ComponentProps<typeof AppShell>) {
        return (
          <AppShell {...props}>
            <AppShellHeader>
              <Tooltip defaultOpen>
                <TooltipTrigger>
                  <button type="button">Bell</button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
            </AppShellHeader>
            <AppShellSidebar>
              <Menu />
            </AppShellSidebar>
            <AppShellMain>Main</AppShellMain>
          </AppShell>
        );
      }
      const headerTip = () =>
        tooltips().find((element) => element.textContent === 'Notifications')!;

      it('when the pointer rests on an item of the expanded sidebar, which shows none', () => {
        render(<WithHeaderTooltip />);
        expect(showing.has(headerTip())).toBe(true);
        hover(screen.getByRole('link', { name: named('Inbox', '12') }));
        hover(groupButton());
        expect(showing.has(headerTip())).toBe(true);
      });

      it('when the pointer rests on the button of a group whose flyout is open', () => {
        render(<WithHeaderTooltip defaultCollapsed />);
        fireEvent.click(groupButton());
        expect(showing.has(flyout())).toBe(true);
        expect(showing.has(headerTip())).toBe(true);
        hover(groupButton());
        expect(showing.has(headerTip())).toBe(true);
      });
    });

    // Nothing tells the tooltip that the pointer left an item that went out of the page: the tooltip
    // is turned off with the rail and closes, so the next rail does not open it by itself.
    it('does not open by itself when the window narrows under a hovered item and widens again', () => {
      render(<Shell defaultCollapsed />);
      const shown = () => tooltips().filter((element) => showing.has(element));
      hover(screen.getByRole('link', { name: named('Inbox', '12') }));
      expect(shown().map((element) => element.textContent)).toEqual(['Inbox']);
      resize(false);
      expect(tooltips()).toHaveLength(0);
      // The pointer is elsewhere by now: the link was in the closed sheet.
      resize(true);
      expect(tooltips()).toHaveLength(3);
      expect(shown()).toEqual([]);
    });

    it('keeps the link element, and its focus, when the rail comes and goes', () => {
      render(<Shell />);
      const link = screen.getByRole('link', { name: named('Inbox', '12') });
      link.focus();
      fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
      expect(screen.getByRole('link', { name: named('Inbox', '12') })).toBe(link);
      expect(link).toHaveFocus();
      fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
      expect(screen.getByRole('link', { name: named('Inbox', '12') })).toBe(link);
    });

    it('works for the link of asChild, and the caller’s ref still reaches the element', () => {
      const ref = createRef<HTMLAnchorElement>();
      render(
        <Shell
          defaultCollapsed
          nav={
            <Nav>
              <NavItem asChild icon={ICON}>
                <a href="/inbox" ref={ref}>
                  Inbox
                </a>
              </NavItem>
            </Nav>
          }
        />,
      );
      const link = screen.getByRole('link', { name: 'Inbox' });
      expect(ref.current).toBe(link);
      expect(link).not.toHaveAttribute('aria-describedby');
      hover(link);
      expect(tooltips().some((element) => showing.has(element))).toBe(true);
    });

    it('keeps the description the caller gave the link, and adds none', () => {
      render(
        <Shell
          defaultCollapsed
          nav={
            <Nav>
              <NavItem href="/inbox" icon={ICON} aria-describedby="hint">
                Inbox
              </NavItem>
            </Nav>
          }
        />,
      );
      expect(screen.getByRole('link', { name: 'Inbox' })).toHaveAttribute(
        'aria-describedby',
        'hint',
      );
    });
  });

  describe('the count', () => {
    it('is a dot of the Indicator in the link of an item that has a badge, hidden from screen readers', () => {
      render(<Shell defaultCollapsed />);
      const link = screen.getByRole('link', { name: named('Inbox', '12') });
      const dot = link.querySelector('.flg-indicator-mark')!;
      expect(dot).toHaveAttribute('data-dot');
      expect(dot).toHaveAttribute('data-status', 'accent');
      expect(dot).toHaveAttribute('aria-hidden', 'true');
      expect(dot).toBeEmptyDOMElement();
      // The number stays, for the name of the link and for the expanded form.
      expect(within(link).getByText('12')).toBeInTheDocument();
    });

    it('is only in the item that has a badge, 0 included, and not in the links of a group', () => {
      render(
        <Shell
          nav={
            <Nav>
              <NavItem href="/a" icon={ICON}>
                A
              </NavItem>
              <NavItem href="/b" icon={ICON} badge={0}>
                B
              </NavItem>
              <NavItem href="/c" icon={ICON} badge={<b>new</b>}>
                C
              </NavItem>
              <NavItem href="/d" icon={ICON} badge="">
                D
              </NavItem>
              <NavGroup label="G" icon={ICON}>
                <NavItem href="/e" badge={3}>
                  E
                </NavItem>
              </NavGroup>
            </Nav>
          }
        />,
      );
      const dotted = [...document.querySelectorAll('.flg-nav-item')]
        .filter((item) => item.querySelector('.flg-indicator-mark'))
        .map((item) => item.textContent);
      expect(dotted).toEqual(['B0', 'Cnew']);
    });

    it('is in the HTML from the server, so the rail is right before anything runs', () => {
      const html = renderToString(<Shell defaultCollapsed />);
      expect(html).toContain('data-collapsed');
      expect(html).toContain('flg-indicator-mark');
      // There is no window on the server: it is the narrow form until the page is hydrated.
      expect(html).not.toContain('role="tooltip"');
      expect(html).not.toContain('popover=');
    });
  });

  describe('the first letter', () => {
    const Letters = ({ collapsible = true }: { collapsible?: boolean }) => (
      <Shell
        collapsible={collapsible}
        {...(collapsible ? { defaultCollapsed: true } : {})}
        nav={
          <Nav>
            <NavItem href="/inbox">Inbox</NavItem>
            <NavItem href="/b" icon={ICON}>
              Boards
            </NavItem>
            <NavItem href="/c">
              <i>Calendar</i>
            </NavItem>
            <NavGroup label="Design">
              <NavItem href="/d">Deep dive</NavItem>
            </NavGroup>
            <NavItem asChild>
              <a href="/f">Files</a>
            </NavItem>
          </Nav>
        }
      />
    );

    it('stands where the icon would, hidden from screen readers, for an item and a group with no icon', () => {
      spyWarn();
      render(<Letters />);
      const letter = (name: string | RegExp) =>
        screen.getByRole('link', { name }).querySelector('.flg-nav-item-letter');
      expect(letter('Inbox')).toHaveTextContent('I');
      expect(letter('Inbox')).toHaveAttribute('aria-hidden', 'true');
      expect(letter('Files')).toHaveTextContent('F');
      expect(groupButton().querySelector('.flg-nav-item-letter')).toHaveTextContent('D');
      // The letter is not part of the name.
      expect(screen.getByRole('link', { name: 'Inbox' })).toBeInTheDocument();
    });

    it('is not drawn for an item that has an icon, a label that is not a string, or a link of a group', () => {
      spyWarn();
      render(<Letters />);
      expect(
        screen.getByRole('link', { name: 'Boards' }).querySelector('.flg-nav-item-letter'),
      ).toBeNull();
      expect(
        screen.getByRole('link', { name: 'Calendar' }).querySelector('.flg-nav-item-letter'),
      ).toBeNull();
      expect(
        screen
          .getAllByRole('link', { hidden: true })
          .find((link) => link.textContent === 'Deep dive')!
          .querySelector('.flg-nav-item-letter'),
      ).toBeNull();
    });

    it('takes the first character whole, an emoji or a letter with a mark, not half of it', () => {
      render(
        <Shell
          defaultCollapsed
          nav={
            <Nav>
              <NavItem href="/a" icon={ICON}>
                Alpha
              </NavItem>
              <NavItem href="/e">{'\u{1F680} Launch'}</NavItem>
            </Nav>
          }
        />,
      );
      expect(document.querySelector('.flg-nav-item-letter')).toHaveTextContent('\u{1F680}');
    });

    it('makes one segmenter for the page, not one for each letter at each render', () => {
      spyWarn();
      const made = vi.spyOn(Intl, 'Segmenter');
      const { rerender } = render(<Letters />);
      rerender(<Letters />);
      expect(
        screen.getByRole('link', { name: 'Inbox' }).querySelector('.flg-nav-item-letter'),
      ).toHaveTextContent('I');
      // An earlier test of this file may have made it already.
      expect(made.mock.calls.length).toBeLessThanOrEqual(1);
    });

    it('warns once about a top-level item without an icon in a shell that can collapse', () => {
      const warn = spyWarn();
      render(<Letters />);
      // Three items have none, and the text holds none of their labels, so it is said once.
      expect(warnings(warn).filter((text) => String(text).includes(NO_ICON_WARNING))).toHaveLength(
        1,
      );
    });

    it('warns about a group without an icon, with its own text', () => {
      const warn = spyWarn();
      render(
        <Shell
          nav={
            <Nav>
              <NavGroup label="Design">
                <NavItem href="/d">Deep dive</NavItem>
              </NavGroup>
            </Nav>
          }
        />,
      );
      expect(warnings(warn).join('\n')).toContain(
        '<NavGroup> at the top level needs an icon when the sidebar can collapse to a rail; the rail shows the first letter of its label instead.',
      );
    });

    it('does not warn when the sidebar cannot collapse, outside a shell, with an icon or in a group', () => {
      const warn = spyWarn();
      render(<Letters collapsible={false} />);
      render(
        <Nav>
          <NavItem href="/inbox">Inbox</NavItem>
        </Nav>,
      );
      render(
        <Shell
          nav={
            <Nav>
              <NavItem href="/a" icon={ICON}>
                A
              </NavItem>
              <NavGroup label="G" icon={ICON}>
                <NavItem href="/b">B</NavItem>
              </NavGroup>
            </Nav>
          }
        />,
      );
      expect(warnings(warn)).toEqual([]);
    });
  });

  describe('the flyout of a group', () => {
    it('is the list of links itself, a popover only at the rail, with the glass of the library', () => {
      render(<Shell defaultCollapsed />);
      expect(flyout()).toHaveAttribute('popover', 'auto');
      expect(flyout()).toHaveClass('flg-nav-sub', 'flg-surface', 'flg-popover');
      expect(flyout()).toHaveAttribute('hidden');
      expect(flyout()).toHaveAttribute('data-side', 'right');
      expect(groupButton()).toHaveAttribute('aria-expanded', 'false');
      expect(groupButton()).toHaveAttribute('aria-controls', flyout().id);
    });

    it('is not a popover while the sidebar is expanded, and the group follows its own state', () => {
      render(<Shell />);
      expect(flyout()).not.toHaveAttribute('popover');
      expect(flyout()).not.toHaveClass('flg-popover');
      // Open from the start, as the current page is in it.
      expect(flyout()).not.toHaveAttribute('hidden');
      expect(groupButton()).toHaveAttribute('aria-expanded', 'true');
    });

    it('has the name of the group as a title that screen readers skip, over the list that the button names', () => {
      render(<Shell defaultCollapsed />);
      const title = flyout().querySelector('.flg-nav-flyout-title')!;
      expect(title).toHaveTextContent('Design');
      expect(title).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByRole('list', { name: 'Design', hidden: true })).toBeInTheDocument();
    });

    it('opens on a click of the button, and focus stays on the button', () => {
      render(<Shell defaultCollapsed />);
      groupButton().focus();
      fireEvent.click(groupButton());
      expect(flyout()).not.toHaveAttribute('hidden');
      expect(showing.has(flyout())).toBe(true);
      expect(groupButton()).toHaveAttribute('aria-expanded', 'true');
      expect(groupButton()).toHaveFocus();
      expect(flyout().querySelector('.flg-popover-arrow')).toHaveAttribute('aria-hidden', 'true');
      fireEvent.click(groupButton());
      expect(showing.has(flyout())).toBe(false);
      expect(groupButton()).toHaveAttribute('aria-expanded', 'false');
      expect(flyout().querySelector('.flg-popover-arrow')).toBeNull();
    });

    it('leaves the open state of the group alone: it is the state of the expanded sidebar', () => {
      render(<Shell defaultCollapsed />);
      const group = groupButton().closest('li')!;
      expect(group).toHaveAttribute('data-open');
      fireEvent.click(groupButton());
      fireEvent.click(groupButton());
      expect(group).toHaveAttribute('data-open');
      fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
      expect(groupButton()).toHaveAttribute('aria-expanded', 'true');
    });

    it('is not the open state of the group: the caller’s onOpenChange is not told', () => {
      const onOpenChange = vi.fn();
      render(
        <Shell
          defaultCollapsed
          nav={
            <Nav>
              <NavGroup label="Design" icon={ICON} onOpenChange={onOpenChange}>
                <NavItem href="/d">Deep dive</NavItem>
              </NavGroup>
            </Nav>
          }
        />,
      );
      fireEvent.click(groupButton());
      expect(showing.has(flyout())).toBe(true);
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('closes when a link in it is activated, and not for a link that is disabled', () => {
      render(
        <Shell
          defaultCollapsed
          nav={
            <Nav>
              <NavGroup label="Design" icon={ICON}>
                <NavItem href="/d">Deep dive</NavItem>
                <NavItem href="/e" disabled>
                  Gone
                </NavItem>
              </NavGroup>
            </Nav>
          }
        />,
      );
      fireEvent.click(groupButton());
      fireEvent.click(inFlyout('Gone'));
      expect(showing.has(flyout())).toBe(true);
      fireEvent.click(inFlyout('Deep dive'));
      expect(showing.has(flyout())).toBe(false);
      expect(groupButton()).toHaveAttribute('aria-expanded', 'false');
    });

    // As the sheet does: the person stays on this page, so the flyout stays open.
    it('stays open for a click that opens the link elsewhere (Ctrl, Cmd, Shift, Alt), or that a handler took', () => {
      render(
        <Shell
          defaultCollapsed
          nav={
            <Nav>
              <NavGroup label="Design" icon={ICON}>
                <NavItem href="/d">Deep dive</NavItem>
                <NavItem href="/k" onClick={(event) => event.preventDefault()}>
                  Kept
                </NavItem>
              </NavGroup>
            </Nav>
          }
        />,
      );
      fireEvent.click(groupButton());
      for (const key of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey']) {
        fireEvent.click(inFlyout('Deep dive'), { [key]: true });
        expect(showing.has(flyout()), key).toBe(true);
      }
      fireEvent.click(inFlyout('Kept'));
      expect(showing.has(flyout())).toBe(true);
      expect(groupButton()).toHaveAttribute('aria-expanded', 'true');
    });

    // A router's link prevents the click's default to navigate itself, after it has called the
    // handler it is given: the flyout closes from that handler, as the sheet does.
    it('closes for a router link, which calls the handler it is given before it navigates', () => {
      const navigate = vi.fn();
      function RouterLink({ onClick, ...props }: ComponentProps<'a'>) {
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
      render(
        <Shell
          defaultCollapsed
          nav={
            <Nav>
              <NavGroup label="Design" icon={ICON}>
                <NavItem asChild>
                  <RouterLink href="/d">Deep dive</RouterLink>
                </NavItem>
              </NavGroup>
            </Nav>
          }
        />,
      );
      fireEvent.click(groupButton());
      fireEvent.click(inFlyout('Deep dive'));
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(showing.has(flyout())).toBe(false);
    });

    it('closes when focus leaves both the button and the flyout, and not while it moves between them', () => {
      render(<Shell defaultCollapsed />);
      fireEvent.click(groupButton());
      const link = inFlyout('Mobile app');
      // From the button into the flyout, and back.
      fireEvent.blur(groupButton(), { relatedTarget: link });
      expect(showing.has(flyout())).toBe(true);
      fireEvent.blur(link, { relatedTarget: groupButton() });
      expect(showing.has(flyout())).toBe(true);
      // A press on the padding of the flyout leaves focus on nothing: the browser's own light dismiss
      // is for a press outside, not this.
      fireEvent.blur(groupButton(), { relatedTarget: null });
      expect(showing.has(flyout())).toBe(true);
      fireEvent.blur(link, { relatedTarget: screen.getByRole('button', { name: 'Elsewhere' }) });
      expect(showing.has(flyout())).toBe(false);
      expect(groupButton()).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes on Esc and on a press outside, which are the browser’s, and gives the focus back to the button', () => {
      render(<Shell defaultCollapsed />);
      groupButton().focus();
      fireEvent.click(groupButton());
      const link = inFlyout('Mobile app');
      link.focus();
      // The browser hides it, and says so.
      showing.delete(flyout());
      const toggle = new Event('toggle') as Event & { newState: string };
      toggle.newState = 'closed';
      act(() => {
        flyout().dispatchEvent(toggle);
      });
      expect(groupButton()).toHaveAttribute('aria-expanded', 'false');
      expect(flyout()).toHaveAttribute('hidden');
      expect(groupButton()).toHaveFocus();
    });

    it('shuts the tooltip of its button while it is open, so that it does not cover the arrow', () => {
      render(<Shell defaultCollapsed />);
      const tip = tooltips().find((element) => element.textContent === 'Design')!;
      hover(groupButton());
      expect(showing.has(tip)).toBe(true);
      fireEvent.click(groupButton());
      expect(showing.has(tip)).toBe(false);
    });

    it('does not bring the tooltip back by itself when it closes', () => {
      render(<Shell defaultCollapsed />);
      const tip = tooltips().find((element) => element.textContent === 'Design')!;
      hover(groupButton());
      // Opened from the keyboard, with no press to tell the tooltip.
      fireEvent.click(groupButton(), { detail: 0 });
      expect(showing.has(flyout())).toBe(true);
      // Esc: the browser hides it, and says so.
      showing.delete(flyout());
      const toggle = new Event('toggle') as Event & { newState: string };
      toggle.newState = 'closed';
      act(() => {
        flyout().dispatchEvent(toggle);
      });
      expect(groupButton()).toHaveAttribute('aria-expanded', 'false');
      expect(showing.has(tip)).toBe(false);
    });

    it('closes when the sidebar is expanded, loses its popover, and stays closed when the rail comes back', () => {
      render(<Shell defaultCollapsed />);
      fireEvent.click(groupButton());
      expect(showing.has(flyout())).toBe(true);
      fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
      expect(flyout()).not.toHaveAttribute('popover');
      expect(flyout()).not.toHaveClass('flg-popover');
      expect(showing.has(flyout())).toBe(false);
      expect(groupButton()).toHaveAttribute('aria-expanded', 'true');
      expect(flyout().querySelector('.flg-popover-arrow')).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
      expect(flyout()).toHaveAttribute('popover', 'auto');
      expect(flyout()).toHaveAttribute('hidden');
      expect(groupButton()).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes when the window narrows, where the sidebar is a sheet and never a rail', () => {
      render(<Shell defaultCollapsed />);
      fireEvent.click(groupButton());
      resize(false);
      expect(flyout()).not.toHaveAttribute('popover');
      expect(showing.has(flyout())).toBe(false);
      resize(true);
      expect(groupButton()).toHaveAttribute('aria-expanded', 'false');
    });

    it('puts the focus on the button when the sidebar is expanded while the focus is in the flyout', () => {
      render(<Shell defaultCollapsed />);
      fireEvent.click(groupButton());
      inFlyout('Mobile app').focus();
      fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
      expect(groupButton()).toHaveFocus();
    });

    it('keeps what the caller gave the group, and its own handlers, on the list item', () => {
      const onBlur = vi.fn();
      render(
        <Shell
          defaultCollapsed
          nav={
            <Nav>
              <NavGroup label="Design" icon={ICON} onBlur={onBlur} data-x="1">
                <NavItem href="/d">Deep dive</NavItem>
              </NavGroup>
            </Nav>
          }
        />,
      );
      fireEvent.click(groupButton());
      fireEvent.blur(groupButton(), { relatedTarget: document.body });
      expect(onBlur).toHaveBeenCalledTimes(1);
      expect(groupButton().closest('li')).toHaveAttribute('data-x', '1');
    });
  });

  // React's context crosses a portal and the CSS of the rail does not: it finds the Nav by its place in
  // the DOM, in the sidebar of the shell. A Nav that a portal takes out of there (into a dialog opened
  // from the rail, say) is drawn expanded, and so it is not a rail for the script either.
  describe('a Nav that a portal takes out of the sidebar', () => {
    let elsewhere: HTMLElement;
    beforeEach(() => {
      elsewhere = document.createElement('div');
      document.body.append(elsewhere);
    });
    afterEach(() => elsewhere.remove());

    it('is not a rail: no tooltips, and the group opens in place', () => {
      render(<Shell defaultCollapsed nav={createPortal(<Menu />, elsewhere)} />);
      expect(elsewhere.querySelector('.flg-nav')).not.toBeNull();
      expect(tooltips()).toHaveLength(0);
      expect(flyout()).not.toHaveAttribute('popover');
      expect(flyout()).not.toHaveClass('flg-popover');
      // Open from the start, as the current page is in it, and it closes in place.
      expect(groupButton()).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(groupButton());
      expect(groupButton()).toHaveAttribute('aria-expanded', 'false');
      expect(flyout()).toHaveAttribute('hidden');
      expect(showing.has(flyout())).toBe(false);
    });

    it('leaves the Nav that stays in the sidebar a rail', () => {
      render(
        <Shell
          defaultCollapsed
          nav={
            <>
              <Menu aria-label="Here" />
              {createPortal(<Menu aria-label="Away" />, elsewhere)}
            </>
          }
        />,
      );
      const here = screen.getByRole('navigation', { name: 'Here' });
      expect(here.querySelector('.flg-nav-sub')).toHaveAttribute('popover', 'auto');
      expect(elsewhere.querySelector('.flg-nav-sub')).not.toHaveAttribute('popover');
      expect(tooltips()).toHaveLength(3);
    });
  });
});
