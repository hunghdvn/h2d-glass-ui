import { fireEvent, render, screen } from '@testing-library/react';
import { forwardRef, useContext } from 'react';
import type { AnchorHTMLAttributes } from 'react';
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
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
} from './Menu';
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
