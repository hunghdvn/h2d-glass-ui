import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, forwardRef, useContext } from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../dropdown-menu/DropdownMenu';
import {
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
} from './Menu';
import type { MenuShortcutProps } from './Menu';
import { MenuTreeContext } from './menu-context';

// jsdom has no Popover API. This stand-in is enough for a menu to render.
const original = {
  showPopover: HTMLElement.prototype.showPopover,
  hidePopover: HTMLElement.prototype.hidePopover,
};
beforeAll(() => {
  HTMLElement.prototype.showPopover = () => {};
  HTMLElement.prototype.hidePopover = () => {};
});
afterAll(() => Object.assign(HTMLElement.prototype, original));

const outside = (part: string) =>
  `${WARN_PREFIX} <${part}> must be rendered inside a DropdownMenuContent, ContextMenuContent or MenuSubContent.`;

describe('Menu parts', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('warn when rendered outside a menu, and still render', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <>
        <MenuItem>Rename</MenuItem>
        <MenuCheckboxItem>Show grid</MenuCheckboxItem>
        <MenuSub>
          <MenuSubTrigger>Move to</MenuSubTrigger>
        </MenuSub>
      </>,
    );
    expect(warn).toHaveBeenCalledWith(outside('MenuItem'));
    expect(warn).toHaveBeenCalledWith(outside('MenuCheckboxItem'));
    expect(warn).toHaveBeenCalledWith(outside('MenuSub'));
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeInTheDocument();
  });

  it('warns about a radio item outside a radio group', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Sort</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuRadioItem value="name">Name</MenuRadioItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(warn).toHaveBeenCalledWith(
      WARN_PREFIX + ' <MenuRadioItem> must be rendered inside a <MenuRadioGroup>.',
    );
  });

  it('warns about submenu parts outside a MenuSub', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>File</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuSubTrigger>Move to</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Archive</MenuItem>
          </MenuSubContent>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(warn).toHaveBeenCalledWith(
      WARN_PREFIX + ' <MenuSubTrigger> must be rendered inside a <MenuSub>.',
    );
    expect(warn).toHaveBeenCalledWith(
      WARN_PREFIX + ' <MenuSubContent> must be rendered inside a <MenuSub>.',
    );
  });

  // jsdom treats the panel as hidden (it has no :popover-open), so the queries include hidden nodes.
  it('names a group by its label, and marks the chosen radio item', () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>View</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuGroup>
            <MenuLabel>Sort by</MenuLabel>
            <MenuRadioGroup defaultValue="name">
              <MenuRadioItem value="name">Name</MenuRadioItem>
              <MenuRadioItem value="date">Date</MenuRadioItem>
            </MenuRadioGroup>
          </MenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByRole('group', { name: 'Sort by', hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Name', hidden: true })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('menuitemradio', { name: 'Date', hidden: true })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('names a radio group by the label inside it', () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>View</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuRadioGroup defaultValue="name">
            <MenuLabel>Sort by</MenuLabel>
            <MenuRadioItem value="name">Name</MenuRadioItem>
          </MenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByRole('group', { name: 'Sort by', hidden: true })).toContainElement(
      screen.getByRole('menuitemradio', { name: 'Name', hidden: true }),
    );
  });

  it('renders an item as its child element without a React error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Go to</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuItem asChild>
            <a href="#x">Go</a>
          </MenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const link = screen.getByRole('menuitem', { name: 'Go', hidden: true });
    expect(link).toHaveAttribute('href', '#x');
    expect(link.querySelector('.flg-menu-item-icon')).toBeInTheDocument();
    expect(error).not.toHaveBeenCalled();
  });

  it('calls onSelect when an asChild item cannot reach its element', () => {
    // A child that takes the item's props but not its ref: the item never sees its element.
    const LinkWithoutRef = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
      function LinkWithoutRef({ children, ...props }, ref) {
        void ref; // Dropped on purpose.
        return <a {...props}>{children}</a>;
      },
    );
    const onSelect = vi.fn();
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Go to</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuItem asChild onSelect={onSelect}>
            <LinkWithoutRef href="#x">Go</LinkWithoutRef>
          </MenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Go', hidden: true }), { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect.mock.calls[0]?.[0]).toBeInstanceOf(Event);
  });

  it('keeps the tree context the same object while the menu opens and closes', () => {
    const trees = new Set<unknown>();
    function Probe() {
      trees.add(useContext(MenuTreeContext));
      return null;
    }
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>View</DropdownMenuTrigger>
        <DropdownMenuContent>
          <Probe />
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const trigger = screen.getByRole('button', { name: 'View' });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trees.size).toBe(1);
  });

  it('keeps the generated ids when an id is forced through a cast', () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>File</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuSub defaultOpen>
            <MenuSubTrigger {...({ id: 'evil-trigger' } as unknown as { id: string })}>
              Move to
            </MenuSubTrigger>
            <MenuSubContent>
              <MenuItem>Archive</MenuItem>
            </MenuSubContent>
          </MenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const trigger = screen.getByRole('menuitem', { name: /Move to/, hidden: true });
    const panel = trigger.getAttribute('aria-controls')
      ? document.getElementById(trigger.getAttribute('aria-controls')!)
      : null;
    expect(trigger.id).not.toBe('evil-trigger');
    expect(panel).not.toBeNull();
    expect(panel).toHaveAttribute('aria-labelledby', trigger.id);
    expect(trigger).toHaveAttribute('aria-controls', panel!.id);
  });

  it('keeps its items mounted while closed', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>View</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuCheckboxItem defaultChecked>Show grid</MenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const item = screen.getByText('Show grid');
    expect(item).toHaveAttribute('aria-checked', 'true');
    expect(item.closest('[role="menu"]')).toHaveAttribute('popover', 'auto');
    expect(screen.getByRole('button', { name: 'View' })).not.toHaveAttribute('aria-controls');
  });
});

describe('MenuShortcut', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  /** A menu that is open, with one item and the shortcut under test. */
  const inItem = (shortcut: ReactNode) =>
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Edit</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuItem>Paste {shortcut}</MenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

  it('keeps the text it is given, as it did before keys', () => {
    inItem(<MenuShortcut>F2</MenuShortcut>);
    const shortcut = screen.getByText('F2');
    expect(shortcut.tagName).toBe('SPAN');
    expect(shortcut).toHaveClass('flg-menu-shortcut');
    expect(shortcut.querySelector('.flg-kbd')).toBeNull();
  });

  it('draws the keys in a Kbd inside the span of the menu', () => {
    const ref = createRef<HTMLSpanElement>();
    inItem(<MenuShortcut ref={ref} keys="mod+v" className="mine" title="Paste" data-extra="1" />);
    const shortcut = ref.current!;
    expect(shortcut.tagName).toBe('SPAN');
    expect(shortcut).toHaveClass('flg-menu-shortcut', 'mine');
    expect(shortcut).toHaveAttribute('title', 'Paste');
    expect(shortcut).toHaveAttribute('data-extra', '1');
    const kbd = shortcut.querySelector(':scope > kbd.flg-kbd');
    expect(kbd).not.toBeNull();
    expect(kbd).toHaveTextContent('Ctrl');
    expect(kbd).toHaveTextContent('V');
  });

  it('passes labels to the Kbd', () => {
    inItem(<MenuShortcut keys="mod+v" labels={{ separator: ' und ' }} />);
    expect(document.querySelector('.flg-kbd > .flg-visually-hidden')).toHaveTextContent('und');
  });

  it('names the item with its keys, so a screen reader hears them', () => {
    inItem(<MenuShortcut keys="mod+v" />);
    const item = screen.getByRole('menuitem', { name: /Paste\s*Ctrl\s*\+\s*V/, hidden: true });
    expect(item).toBeInTheDocument();
  });

  it('lets the item be named by its label when the shortcut is hidden from assistive technology', () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Edit</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuItem aria-keyshortcuts="Meta+V">
            Paste <MenuShortcut keys="mod+v" aria-hidden="true" />
          </MenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const item = screen.getByRole('menuitem', { name: 'Paste', hidden: true });
    expect(item).toHaveAttribute('aria-keyshortcuts', 'Meta+V');
    expect(item.querySelector('.flg-menu-shortcut')).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws the symbols of a Mac once it has mounted', () => {
    vi.spyOn(window.navigator, 'platform', 'get').mockReturnValue('MacIntel');
    inItem(<MenuShortcut keys="mod+v" />);
    const kbd = document.querySelector('.flg-menu-shortcut > .flg-kbd');
    expect(kbd).toHaveAttribute('data-platform', 'apple');
    expect(kbd?.querySelector('[aria-hidden="true"]')).toHaveTextContent('⌘');
  });

  it('shows the keys and says so when it is given both keys and children', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // The types forbid it; a caller in JavaScript, or behind a cast, can still do it.
    const both = { keys: 'mod+v', children: 'Ctrl+V' } as unknown as MenuShortcutProps;
    inItem(<MenuShortcut {...both} />);
    expect(screen.queryByText('Ctrl+V')).toBeNull();
    expect(document.querySelector('.flg-menu-shortcut > .flg-kbd')).not.toBeNull();
    expect(warn).toHaveBeenCalledWith(
      WARN_PREFIX + ' <MenuShortcut> takes keys or children, not both; keys is used.',
    );
  });

  // `keys={cond && 'mod+v'}` from JavaScript, or behind a cast: the types forbid it.
  it.each([null, false])('takes keys={%s} as no keys: no warning, and nothing throws', (keys) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const props = { keys, children: 'F2' } as unknown as MenuShortcutProps;
    inItem(<MenuShortcut {...props} />);
    const shortcut = screen.getByText('F2');
    expect(shortcut).toHaveClass('flg-menu-shortcut');
    expect(shortcut.querySelector('.flg-kbd')).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn for keys alone or for text alone', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    inItem(
      <>
        <MenuShortcut keys="mod+v" />
        <MenuShortcut>F2</MenuShortcut>
      </>,
    );
    expect(warn).not.toHaveBeenCalled();
  });
});
