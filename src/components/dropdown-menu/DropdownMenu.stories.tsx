import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
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
