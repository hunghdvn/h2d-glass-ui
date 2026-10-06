import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, spyOn, userEvent, waitFor, within } from 'storybook/test';
import {
  CopyIcon,
  EditIcon,
  FileIcon,
  FolderIcon,
  MoreIcon,
  TrashIcon,
} from '../../../.storybook/icons';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import { TYPEAHEAD_TIMEOUT } from '../../internal/use-typeahead';
import { Button } from '../button/Button';
import { Checkbox } from '../checkbox/Checkbox';
import { Input } from '../input/Input';
import {
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
} from '../menu/Menu';
import type { MenuSubProps } from '../menu/Menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './DropdownMenu';

const meta = {
  title: 'Components/DropdownMenu',
  component: DropdownMenu,
  args: { onOpenChange: fn() },
  parameters: { stage: 'viewport' },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const icon = { width: 15, height: 15 };
const corner = { placeSelf: 'start', display: 'flex', gap: 8 } as const;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The menu from the approved mockup: commands with icons and shortcuts, a submenu, a checkbox item,
// a radio group, a disabled item and a danger item.
function ProjectMenu({ onRename, sub }: { onRename?: (event: Event) => void; sub?: MenuSubProps }) {
  return (
    <DropdownMenuContent>
      <MenuGroup>
        <MenuLabel>Project</MenuLabel>
        <MenuItem icon={<EditIcon {...icon} />} onSelect={onRename}>
          Rename <MenuShortcut>F2</MenuShortcut>
        </MenuItem>
        <MenuItem icon={<CopyIcon {...icon} />}>
          Duplicate <MenuShortcut>Ctrl+D</MenuShortcut>
        </MenuItem>
        <MenuSub {...sub}>
          <MenuSubTrigger icon={<FolderIcon {...icon} />}>Move to</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Design</MenuItem>
            <MenuItem>Marketing</MenuItem>
            <MenuItem>Archive</MenuItem>
          </MenuSubContent>
        </MenuSub>
      </MenuGroup>
      <MenuSeparator />
      <MenuCheckboxItem defaultChecked>Show grid</MenuCheckboxItem>
      <MenuRadioGroup defaultValue="name">
        <MenuLabel>Sort by</MenuLabel>
        <MenuRadioItem value="name">Name</MenuRadioItem>
        <MenuRadioItem value="date">Date modified</MenuRadioItem>
      </MenuRadioGroup>
      <MenuSeparator />
      <MenuItem icon={<FileIcon {...icon} />} disabled>
        Export PDF
      </MenuItem>
      <MenuItem icon={<TrashIcon {...icon} />} variant="danger">
        Delete project
      </MenuItem>
    </DropdownMenuContent>
  );
}

const onRename = fn();

export const Default: Story = {
  // The closed state is a Button, which has its own baselines; the open states have theirs.
  tags: ['no-visual'],
  render: (args) => (
    <div style={corner}>
      <DropdownMenu {...args}>
        <DropdownMenuTrigger variant="secondary">Project</DropdownMenuTrigger>
        <ProjectMenu onRename={onRename} />
      </DropdownMenu>
      <Button variant="secondary">After</Button>
    </div>
  ),
  play: async ({ canvas, args }) => {
    onRename.mockClear();
    const trigger = canvas.getByRole('button', { name: 'Project' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // The keyboard opens it on the first item and moves through the items, skipping the disabled one.
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const menu = canvas.getByRole('menu', { name: 'Project' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-controls', menu.id);
    await expect(canvas.getByRole('menuitem', { name: 'Rename F2' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('menuitem', { name: 'Duplicate Ctrl+D' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('menuitem', { name: 'Delete project' })).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(canvas.getByRole('menuitemradio', { name: 'Date modified' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expect(canvas.getByRole('menuitem', { name: 'Rename F2' })).toHaveFocus();
    // Typeahead: "d" goes to the next item starting with it.
    await userEvent.keyboard('d');
    await expect(canvas.getByRole('menuitem', { name: 'Duplicate Ctrl+D' })).toHaveFocus();
    // A Space inside a running search is part of it: it does not choose the item it is on.
    await new Promise((resolve) => setTimeout(resolve, TYPEAHEAD_TIMEOUT));
    await userEvent.keyboard('show g');
    const grid = canvas.getByRole('menuitemcheckbox', { name: 'Show grid' });
    await expect(grid).toHaveFocus();
    await expect(grid).toHaveAttribute('aria-checked', 'true');
    await expect(menu.matches(':popover-open')).toBe(true);
    // A lone Space still chooses it.
    await new Promise((resolve) => setTimeout(resolve, TYPEAHEAD_TIMEOUT));
    await userEvent.keyboard(' ');
    await expect(grid).toHaveAttribute('aria-checked', 'false');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    // Choosing an item closes the menu and returns focus to the trigger.
    await userEvent.keyboard('{Home}{Enter}');
    await expect(onRename).toHaveBeenCalledOnce();
    await expect(onRename.mock.calls[0]?.[0]).toBeInstanceOf(Event);
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(trigger).toHaveFocus();
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);

    // ↑ opens it on the last item.
    await userEvent.keyboard('{ArrowUp}');
    await expect(canvas.getByRole('menuitem', { name: 'Delete project' })).toHaveFocus();

    const real = await realUserEvent();
    if (!real) return;
    // Esc closes it and returns focus to the trigger.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(trigger).toHaveFocus();
    // Tab closes it, and focus moves on as usual.
    await real.keyboard('{ArrowDown}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await real.keyboard('{Tab}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();
    // A click opens it on the menu itself, with no item lit; a click outside closes it.
    await real.click(trigger);
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await expect(menu).toHaveFocus();
    await real.click(canvas.getByRole('button', { name: 'After' }));
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    // A click on the trigger of the open menu closes it, returns focus to the trigger, and reports
    // the close once: the press already light-dismissed it, and the browser's late `toggle` for
    // that is not reported again.
    await real.click(trigger);
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    args.onOpenChange?.mockClear();
    await real.click(trigger);
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(trigger).toHaveFocus();
    await delay(50);
    await expect(menu.matches(':popover-open')).toBe(false);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(args.onOpenChange).toHaveBeenCalledOnce();
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
  },
};

// An auto-repeated keydown, as the browser sends while a key is held. The user-event bundled with
// Storybook does not mark its repeats, so this one is dispatched directly.
async function repeatKey(key: string) {
  document.activeElement?.dispatchEvent(
    new KeyboardEvent('keydown', { key, code: key, repeat: true, bubbles: true, cancelable: true }),
  );
  await delay(20);
}

export const HeldKey: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={corner}>
      <DropdownMenu {...args}>
        <DropdownMenuTrigger variant="secondary">Project</DropdownMenuTrigger>
        <ProjectMenu onRename={onRename} />
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvas }) => {
    onRename.mockClear();
    const trigger = canvas.getByRole('button', { name: 'Project' });
    const rename = canvas.getByRole('menuitem', { name: 'Rename F2', hidden: true });
    const menu = rename.closest('[role="menu"]') as HTMLElement;
    // A repeat alone, of a key that went down before focus came here, does not open it.
    trigger.focus();
    await repeatKey('Enter');
    await repeatKey('ArrowDown');
    await expect(menu.matches(':popover-open')).toBe(false);
    // A held Enter opens it on its first item. The repeats that follow land on that item and choose
    // nothing, so the menu does not close and reopen while the key is down.
    await userEvent.keyboard('{Enter>}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await expect(rename).toHaveFocus();
    await repeatKey('Enter');
    await repeatKey('Enter');
    await userEvent.keyboard('{/Enter}');
    await expect(onRename).not.toHaveBeenCalled();
    await expect(menu.matches(':popover-open')).toBe(true);
    await expect(rename).toHaveFocus();
  },
};

export const Open: Story = {
  render: (args) => (
    <div style={corner}>
      <DropdownMenu {...args} defaultOpen>
        <DropdownMenuTrigger variant="secondary">Project</DropdownMenuTrigger>
        <ProjectMenu sub={{ defaultOpen: true }} />
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvas }) => {
    const menu = canvas.getByRole('menu', { name: 'Project' });
    await settled(menu);
    // Below the trigger, lined up with its start edge, 4px away.
    const t = canvas.getByRole('button', { name: 'Project' }).getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    await expect(Math.round(m.left)).toBe(Math.round(t.left));
    await expect(Math.round(m.top - t.bottom)).toBe(4);
  },
};

export const CheckboxAndRadioItems: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={corner}>
      <DropdownMenu {...args}>
        <DropdownMenuTrigger variant="secondary" size="sm" aria-label="View options">
          <MoreIcon {...icon} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuCheckboxItem onSelect={(event) => event.preventDefault()}>
            Show grid
          </MenuCheckboxItem>
          <MenuRadioGroup defaultValue="name">
            <MenuRadioItem value="name">Name</MenuRadioItem>
            <MenuRadioItem value="date">Date modified</MenuRadioItem>
          </MenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'View options' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const menu = canvas.getByRole('menu', { name: 'View options' });
    const grid = canvas.getByRole('menuitemcheckbox', { name: 'Show grid' });
    await expect(grid).toHaveAttribute('aria-checked', 'false');
    // preventDefault in onSelect keeps the menu open.
    await userEvent.keyboard(' ');
    await expect(grid).toHaveAttribute('aria-checked', 'true');
    await expect(menu.matches(':popover-open')).toBe(true);
    await expect(canvas.getByRole('menuitemradio', { name: 'Name' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await userEvent.click(canvas.getByRole('menuitemradio', { name: 'Date modified' }));
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    // Uncontrolled values survive closing and reopening.
    await expect(grid).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByRole('menuitemradio', { name: 'Date modified' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(within(menu).getByRole('group')).toBeInTheDocument();
  },
};

export const Submenu: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={corner}>
      <DropdownMenu {...args}>
        <DropdownMenuTrigger variant="secondary">Project</DropdownMenuTrigger>
        <ProjectMenu />
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Project' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const menu = canvas.getByRole('menu', { name: 'Project' });
    const moveTo = canvas.getByRole('menuitem', { name: 'Move to' });
    await expect(moveTo).toHaveAttribute('aria-haspopup', 'menu');
    // A highlighted danger item keeps its icon in the danger colour; others turn it muted.
    await userEvent.keyboard('{End}');
    const danger = canvas.getByRole('menuitem', { name: 'Delete project' });
    await expect(danger).toHaveFocus();
    const iconOf = (el: Element) =>
      getComputedStyle(el.querySelector('.flg-menu-item-icon')!).color;
    await expect(iconOf(danger)).toBe(getComputedStyle(danger).color);
    await userEvent.keyboard('{Home}');
    await expect(iconOf(canvas.getByRole('menuitem', { name: 'Rename F2' }))).not.toBe(
      getComputedStyle(canvas.getByRole('menuitem', { name: 'Rename F2' })).color,
    );
    // → opens the submenu on its first item; ← closes it and returns to its trigger.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}');
    const sub = canvas.getByRole('menu', { name: 'Move to' });
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(true));
    await expect(moveTo).toHaveAttribute('aria-expanded', 'true');
    await expect(within(sub).getByRole('menuitem', { name: 'Design' })).toHaveFocus();
    // The submenu opens to the right, its first item level with the trigger.
    await settled(sub);
    const t = moveTo.getBoundingClientRect();
    const firstItem = within(sub).getByRole('menuitem', { name: 'Design' }).getBoundingClientRect();
    await expect(Math.abs(firstItem.top - t.top)).toBeLessThanOrEqual(1);
    await expect(sub.getBoundingClientRect().left).toBeGreaterThan(t.right - 4);
    // ↑ and ↓ stay inside the submenu.
    await userEvent.keyboard('{ArrowDown}');
    await expect(within(sub).getByRole('menuitem', { name: 'Marketing' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(false));
    await expect(moveTo).toHaveFocus();
    // Choosing an item in the submenu closes the whole menu.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(true));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(trigger).toHaveFocus();
    // The items stay mounted while the menu is closed; the submenu does not stay open with them.
    await expect(moveTo).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await expect(sub.matches(':popover-open')).toBe(false);
    await userEvent.click(trigger);
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(trigger).toHaveFocus();
    // The pointer on the sub-trigger opens the submenu 100ms later, unless the menu has closed in
    // the meantime: then the submenu stays closed, and the next opening does not show it.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    const on = moveTo.getBoundingClientRect();
    moveTo.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        pointerType: 'mouse',
        clientX: on.left + 20,
        clientY: on.top + 10,
      }),
    );
    await expect(moveTo).toHaveFocus();
    trigger.click();
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await delay(150);
    await expect(moveTo).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await delay(50);
    await expect(sub.matches(':popover-open')).toBe(false);
    await userEvent.click(trigger);
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(trigger).toHaveFocus();

    const real = await realUserEvent();
    if (!real) return;
    // Esc closes only the submenu.
    await real.keyboard('{Enter}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await real.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}');
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(true));
    await real.keyboard('{Escape}');
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(false));
    await expect(menu.matches(':popover-open')).toBe(true);
    await expect(moveTo).toHaveFocus();
    // Resting the pointer on the trigger opens it after a short delay; another item closes it.
    await real.hover(moveTo);
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(true));
    await expect(moveTo).toHaveFocus();
    await real.hover(canvas.getByRole('menuitem', { name: 'Rename F2' }));
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(false));
    // A click on the trigger of the open submenu leaves it open, though the press light-dismisses
    // it: no frame shows it closed. Esc still closes it afterwards.
    await real.hover(moveTo);
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(true));
    let closedFrames = 0;
    let sampling = true;
    const sample = () => {
      if (!sub.matches(':popover-open')) closedFrames += 1;
      if (sampling) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
    await real.click(moveTo);
    await new Promise((resolve) => setTimeout(resolve, 150));
    sampling = false;
    await expect(closedFrames).toBe(0);
    await expect(sub.matches(':popover-open')).toBe(true);
    await expect(moveTo).toHaveAttribute('aria-expanded', 'true');
    await real.keyboard('{Escape}');
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(false));
    await expect(moveTo).toHaveAttribute('aria-expanded', 'false');
    await expect(menu.matches(':popover-open')).toBe(true);
    // The grace triangle: on its way to the submenu, the pointer may cross another item inside the
    // triangle between where it left the sub-trigger and the submenu's near edge. That item does
    // not take the highlight, and the submenu stays open. Outside the triangle it does.
    await real.hover(canvas.getByRole('menuitem', { name: 'Rename F2' }));
    await real.hover(moveTo);
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(true));
    await expect(moveTo).toHaveFocus();
    await settled(sub);
    const grid = canvas.getByRole('menuitemcheckbox', { name: 'Show grid' });
    const box = menu.getBoundingClientRect();
    const from = moveTo.getBoundingClientRect();
    const across = grid.getBoundingClientRect();
    // Positions relative to the menu. The pointer leaves the sub-trigger downwards, onto the
    // separator, towards the submenu; then it crosses "Show grid" near its right end, inside the
    // triangle, and then near its left end, behind where it left: outside.
    const leave = { x: box.width - 40, y: (from.bottom + across.top) / 2 - box.top };
    const inside = { x: across.right - 8 - box.left, y: across.top + 10 - box.top };
    const outside = { x: across.left + 12 - box.left, y: inside.y };
    // The triangle holds for 300ms from the moment the pointer leaves, and each move here takes a
    // varying time to arrive (up to 250ms in WebKit, measured). The clock that the window reads
    // stands still while the pointer crosses, so these steps test where it is, not how fast.
    const now = performance.now();
    const clock = spyOn(performance, 'now').mockReturnValue(now);
    try {
      await real.hover(menu, { position: leave });
      await real.hover(menu, { position: inside });
      await expect(moveTo).toHaveFocus();
      await expect(sub.matches(':popover-open')).toBe(true);
      await real.hover(menu, { position: outside });
      await expect(grid).toHaveFocus();
    } finally {
      clock.mockRestore();
    }
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(false));
    await expect(moveTo).toHaveAttribute('aria-expanded', 'false');
  },
};

const onSubOpenChange = fn();

export const SubmenuOpenByDefault: Story = {
  tags: ['no-visual'],
  // Cleared before the render, which is when a wrong report would come.
  beforeEach: () => {
    onSubOpenChange.mockClear();
  },
  render: (args) => (
    <div style={corner}>
      <DropdownMenu {...args}>
        <DropdownMenuTrigger variant="secondary">Project</DropdownMenuTrigger>
        <ProjectMenu sub={{ defaultOpen: true, onOpenChange: onSubOpenChange }} />
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Project' });
    const moveTo = canvas.getByRole('menuitem', { name: 'Move to', hidden: true });
    // Mounted in the closed menu, a submenu that starts open stays open, and nothing is reported.
    await delay(50);
    await expect(onSubOpenChange).not.toHaveBeenCalled();
    await expect(moveTo).toHaveAttribute('aria-expanded', 'true');
    // It shows once the menu opens. A press opens the menu on itself, with no item lit, so no other
    // item takes the highlight and closes the submenu.
    await userEvent.click(trigger);
    const menu = canvas.getByRole('menu', { name: 'Project' });
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    const sub = canvas.getByRole('menu', { name: 'Move to' });
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(true));
    await expect(onSubOpenChange).not.toHaveBeenCalled();
  },
};

// A submenu whose first entry is a submenu of its own, with a disabled trigger.
export const NestedSubmenu: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={corner}>
      <DropdownMenu {...args}>
        <DropdownMenuTrigger variant="secondary">Project</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuItem>Rename</MenuItem>
          <MenuSub>
            <MenuSubTrigger>Move to</MenuSubTrigger>
            <MenuSubContent>
              <MenuSub>
                <MenuSubTrigger disabled>Recent</MenuSubTrigger>
                <MenuSubContent>
                  <MenuItem>Old project</MenuItem>
                </MenuSubContent>
              </MenuSub>
              <MenuItem>Design</MenuItem>
              <MenuItem>Marketing</MenuItem>
            </MenuSubContent>
          </MenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Project' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const moveTo = canvas.getByRole('menuitem', { name: 'Move to' });
    // The pointer opens the submenu and leaves focus on its trigger.
    await userEvent.click(moveTo);
    await waitFor(() => expect(moveTo).toHaveAttribute('aria-expanded', 'true'));
    const sub = canvas.getByRole('menu', { name: 'Move to' });
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(true));
    await expect(moveTo).toHaveFocus();
    // → then moves into it, onto its first item that can take focus: not the disabled sub-trigger,
    // nor an item of the closed submenu behind it.
    await userEvent.keyboard('{ArrowRight}');
    await expect(within(sub).getByRole('menuitem', { name: 'Design' })).toHaveFocus();
  },
};

// A filter field in a row of its own, above the items. ARIA lets a menu own only items, separators
// and groups of them, so axe reports the field whatever wraps it; the story is about the keys.
export const FieldInTheMenu: Story = {
  tags: ['no-visual'],
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'region', enabled: false },
          { id: 'aria-required-children', enabled: false },
        ],
      },
    },
  },
  render: (args) => (
    <div style={corner}>
      <DropdownMenu {...args}>
        <DropdownMenuTrigger variant="secondary">Move to</DropdownMenuTrigger>
        <DropdownMenuContent>
          <div style={{ padding: 4 }}>
            <Input size="sm" aria-label="Filter folders" />
          </div>
          <MenuItem>Design</MenuItem>
          <MenuItem>Development</MenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Move to' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const menu = canvas.getByRole('menu', { name: 'Move to' });
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    const filter = within(menu).getByRole('textbox', { name: 'Filter folders' });
    filter.focus();
    // Typing goes into the field: typeahead leaves it alone, and so do Home and End.
    await userEvent.keyboard('de');
    await expect(filter).toHaveValue('de');
    await expect(filter).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(filter).toHaveFocus();
    await expect(filter).toHaveProperty('selectionStart', 0);
    await userEvent.keyboard('{End}');
    await expect(filter).toHaveFocus();
    await expect(filter).toHaveProperty('selectionStart', 2);
    // ↓ still moves on to the items.
    await userEvent.keyboard('{ArrowDown}');
    await expect(within(menu).getByRole('menuitem', { name: 'Design' })).toHaveFocus();
  },
};

export const LinkItems: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={corner}>
      <DropdownMenu {...args}>
        <DropdownMenuTrigger variant="secondary">Go to</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuItem asChild>
            <a href="#settings">Settings</a>
          </MenuItem>
          <MenuItem asChild>
            <a href="#billing">Billing</a>
          </MenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvas }) => {
    // Records the links the menu follows, and stops the navigation. It listens on window, after
    // React has handled the click.
    const followed: string[] = [];
    const follow = (event: MouseEvent) => {
      const link = (event.target as Element).closest('a');
      if (!link) return;
      followed.push(link.getAttribute('href') ?? '');
      event.preventDefault();
    };
    window.addEventListener('click', follow);
    try {
      const trigger = canvas.getByRole('button', { name: 'Go to' });
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      const menu = canvas.getByRole('menu', { name: 'Go to' });
      await expect(canvas.getByRole('menuitem', { name: 'Settings' })).toHaveFocus();
      // Enter on an item rendered as a link follows the link, and closes the menu.
      await userEvent.keyboard('{ArrowDown}{Enter}');
      await expect(followed).toEqual(['#billing']);
      await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
      await expect(trigger).toHaveFocus();
    } finally {
      window.removeEventListener('click', follow);
    }
  },
};

// The parent owns `open`. While "Keep the menu open" is checked, it refuses to close the menu.
function ControlledMenu({
  onOpenChange,
}: {
  onOpenChange?: ((open: boolean) => void) | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  return (
    <div style={corner}>
      <DropdownMenu
        open={open}
        onOpenChange={(next) => {
          onOpenChange?.(next);
          if (next || !locked) setOpen(next);
        }}
      >
        <DropdownMenuTrigger variant="secondary">Project</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuItem>Rename</MenuItem>
          <MenuItem>Duplicate</MenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Checkbox checked={locked} onCheckedChange={setLocked}>
        Keep the menu open
      </Checkbox>
      <Button variant="secondary">After</Button>
    </div>
  );
}

export const Controlled: Story = {
  tags: ['no-visual'],
  render: (args) => <ControlledMenu onOpenChange={args.onOpenChange} />,
  play: async ({ canvas, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const trigger = canvas.getByRole('button', { name: 'Project' });
    const menu = canvas.getByRole('menu', { hidden: true });
    const isOpen = () => menu.matches(':popover-open');

    // Each change asks the parent once, with the new value: the trigger opens it...
    args.onOpenChange?.mockClear();
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(true));
    await delay(50);
    await expect(args.onOpenChange).toHaveBeenCalledOnce();
    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    // ...Esc closes it...
    args.onOpenChange?.mockClear();
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isOpen()).toBe(false));
    await delay(50);
    await expect(args.onOpenChange).toHaveBeenCalledOnce();
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(trigger).toHaveFocus();
    // ...and so does choosing an item.
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(true));
    args.onOpenChange?.mockClear();
    await real.click(canvas.getByRole('menuitem', { name: 'Rename' }));
    await waitFor(() => expect(isOpen()).toBe(false));
    await delay(50);
    await expect(args.onOpenChange).toHaveBeenCalledOnce();
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(trigger).toHaveFocus();

    // A parent that keeps `open` true: the browser closes the menu on Esc or a click outside, and
    // the menu shows again.
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Keep the menu open' }));
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(true));
    args.onOpenChange?.mockClear();
    await real.keyboard('{Escape}');
    await waitFor(() => expect(args.onOpenChange).toHaveBeenCalledWith(false));
    await waitFor(() => expect(isOpen()).toBe(true));
    await delay(50);
    await expect(isOpen()).toBe(true);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    args.onOpenChange?.mockClear();
    await real.click(canvas.getByRole('button', { name: 'After' }));
    await waitFor(() => expect(args.onOpenChange).toHaveBeenCalledWith(false));
    await waitFor(() => expect(isOpen()).toBe(true));
    await delay(50);
    await expect(isOpen()).toBe(true);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  },
};
