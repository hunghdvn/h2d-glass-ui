import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, spyOn, userEvent, waitFor, within } from 'storybook/test';
import { CopyIcon, EditIcon, FileIcon, TrashIcon } from '../../../.storybook/icons';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import { Button } from '../button/Button';
import { MenuItem, MenuSeparator, MenuShortcut } from '../menu/Menu';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from './ContextMenu';

const meta = {
  title: 'Components/ContextMenu',
  component: ContextMenu,
  args: { onOpenChange: fn() },
  parameters: { stage: 'viewport' },
  tags: ['no-visual'],
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const icon = { width: 15, height: 15 };
const area = {
  display: 'grid',
  placeItems: 'center',
  gap: 8,
  width: 320,
  height: 180,
  border: '1px dashed var(--flg-control-border)',
  borderRadius: 'var(--flg-radius-md)',
  color: 'var(--flg-text-muted)',
} as const;

const onOpen = fn();

function FileMenu() {
  return (
    <ContextMenuContent aria-label="report.pdf">
      <MenuItem icon={<FileIcon {...icon} />} onSelect={onOpen}>
        Open
      </MenuItem>
      <MenuItem icon={<EditIcon {...icon} />}>
        Rename <MenuShortcut>F2</MenuShortcut>
      </MenuItem>
      <MenuItem icon={<CopyIcon {...icon} />}>Duplicate</MenuItem>
      <MenuSeparator />
      <MenuItem icon={<TrashIcon {...icon} />} variant="danger">
        Delete
      </MenuItem>
    </ContextMenuContent>
  );
}

function Scene(args: Story['args']) {
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <Button variant="secondary" size="sm">
        Before
      </Button>
      <ContextMenu {...args}>
        <ContextMenuTrigger style={area} data-testid="area">
          <span>Right-click report.pdf</span>
          <Button variant="ghost" size="sm">
            report.pdf
          </Button>
        </ContextMenuTrigger>
        <FileMenu />
      </ContextMenu>
    </div>
  );
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const Default: Story = {
  render: (args) => <Scene {...args} />,
  play: async ({ canvas, args }) => {
    onOpen.mockClear();
    const before = canvas.getByRole('button', { name: 'Before' });
    const file = canvas.getByRole('button', { name: 'report.pdf' });
    const menu = canvas.getByRole('menu', { hidden: true });

    // Shift+F10 on the focused element opens the menu below it, on its first item.
    file.focus();
    await userEvent.keyboard('{Shift>}{F10}{/Shift}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    await expect(canvas.getByRole('menuitem', { name: 'Open' })).toHaveFocus();
    await settled(menu);
    const f = file.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    await expect(Math.abs(m.top - f.bottom)).toBeLessThanOrEqual(1);
    await expect(Math.abs(m.left - (f.left + 2))).toBeLessThanOrEqual(1);
    // Choosing an item closes it, and focus goes back to the element it opened from.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(onOpen).toHaveBeenCalledTimes(1);
    await expect(file).toHaveFocus();
    // So does the ContextMenu key.
    await userEvent.keyboard('{ContextMenu}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await expect(canvas.getByRole('menuitem', { name: 'Open' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();

    const real = await realUserEvent();
    if (!real) return;
    await real.keyboard('{Escape}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(file).toHaveFocus();

    // A right click opens it at the pointer. The press ends before it opens: in WebKit and Firefox
    // the browser fires `contextmenu` while the button is still down.
    before.focus();
    const zone = canvas.getByTestId('area');
    const z = zone.getBoundingClientRect();
    await real.click(zone, { button: 'right', position: { x: 40, y: 30 } });
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await expect(canvas.getByRole('menuitem', { name: 'Open' })).toHaveFocus();
    await settled(menu);
    const opened = menu.getBoundingClientRect();
    await expect(Math.abs(opened.left - (z.left + 40 + 2))).toBeLessThanOrEqual(1);
    await expect(Math.abs(opened.top - (z.top + 30))).toBeLessThanOrEqual(1);
    // Another right click in the area, clear of the menu, opens it afresh at the new point.
    await real.click(zone, { button: 'right', position: { x: 280, y: 160 } });
    await waitFor(() => {
      const again = menu.getBoundingClientRect();
      expect(menu.matches(':popover-open')).toBe(true);
      expect(Math.abs(again.left - (z.left + 280 + 2))).toBeLessThanOrEqual(1);
      expect(Math.abs(again.top - (z.top + 160))).toBeLessThanOrEqual(1);
    });
    await expect(canvas.getByRole('menuitem', { name: 'Open' })).toHaveFocus();
    // Esc closes it; focus goes back to where it was before the first right click.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(before).toHaveFocus();
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
  },
};

// Touch has no trusted input here, so these presses are synthetic pointer events. They exercise the
// timer and the slop; the browser's light dismiss, which ignores synthetic input, is covered above.
function touch(target: Element, type: string, x: number, y: number) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 7,
      pointerType: 'touch',
      isPrimary: true,
      clientX: x,
      clientY: y,
    }),
  );
}

export const LongPress: Story = {
  render: (args) => <Scene {...args} />,
  play: async ({ canvas, args }) => {
    const zone = canvas.getByTestId('area');
    const menu = canvas.getByRole('menu', { hidden: true });
    const z = zone.getBoundingClientRect();
    const x = z.left + 50;
    const y = z.top + 40;

    // Lifted too soon: nothing.
    touch(zone, 'pointerdown', x, y);
    await delay(200);
    touch(zone, 'pointerup', x, y);
    await delay(50);
    await expect(menu.matches(':popover-open')).toBe(false);

    // Moved more than 10px while held: nothing.
    touch(zone, 'pointerdown', x, y);
    touch(zone, 'pointermove', x + 12, y);
    await delay(600);
    touch(zone, 'pointerup', x + 12, y);
    await delay(50);
    await expect(menu.matches(':popover-open')).toBe(false);

    // Held for 500ms, then moved more than 10px before the browser took the gesture over, as when the
    // touch turns into a scroll: nothing opens at a spot that has scrolled away.
    touch(zone, 'pointerdown', x, y);
    await delay(600);
    touch(zone, 'pointermove', x, y + 20);
    touch(zone, 'pointercancel', x, y + 20);
    await delay(50);
    await expect(menu.matches(':popover-open')).toBe(false);

    // Held still for 500ms: it opens at the touch point when the finger lifts.
    args.onOpenChange?.mockClear();
    touch(zone, 'pointerdown', x, y);
    touch(zone, 'pointermove', x + 4, y + 3);
    await delay(600);
    await expect(menu.matches(':popover-open')).toBe(false);
    // The lift opens a 400ms window in which the click that follows it, and a `contextmenu` that
    // follows it, are dropped. The clock that the window reads stands still from the lift to the last
    // click, so a slow runner cannot close the window before the checks run.
    const clicked = fn();
    const file = canvas.getByRole('button', { name: 'report.pdf' });
    const clock = spyOn(performance, 'now').mockReturnValue(performance.now());
    try {
      touch(zone, 'pointerup', x + 4, y + 3);
      await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
      await expect(args.onOpenChange).toHaveBeenCalledOnce();
      // Where the browser fires `contextmenu` after the lift (Chrome on Windows), the menu that the
      // lift opened stays as it is: it is not closed and opened again.
      zone.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: x + 4,
          clientY: y + 3,
        }),
      );
      await expect(args.onOpenChange).toHaveBeenCalledOnce();
      // The click that follows the lifted finger does not reach what it rested on; the next one does.
      file.addEventListener('click', clicked);
      file.click();
      await expect(clicked).not.toHaveBeenCalled();
      file.click();
      await expect(clicked).toHaveBeenCalledTimes(1);
    } finally {
      file.removeEventListener('click', clicked);
      clock.mockRestore();
    }
    await settled(menu);
    const m = menu.getBoundingClientRect();
    await expect(Math.abs(m.left - (x + 2))).toBeLessThanOrEqual(1);
    await expect(Math.abs(m.top - y)).toBeLessThanOrEqual(1);
    await expect(within(menu).getByRole('menuitem', { name: 'Open' })).toHaveFocus();
    await expect(menu.matches(':popover-open')).toBe(true);
    await expect(args.onOpenChange).toHaveBeenCalledOnce();
    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
  },
};

// A descendant may stop or prevent its own `pointerdown` (row checkboxes, drag handles, a
// don't-steal-focus trick). The press is still recorded, so the menu opens on release and the release
// does not light-dismiss it.
export const PressHandledByChild: Story = {
  render: (args) => (
    <ContextMenu {...args}>
      <ContextMenuTrigger style={area} data-testid="area">
        <span
          data-testid="stopper"
          onPointerDown={(event) => event.stopPropagation()}
          style={{ padding: 12 }}
        >
          Stops pointerdown
        </span>
        <span
          data-testid="preventer"
          onPointerDown={(event) => event.preventDefault()}
          style={{ padding: 12 }}
        >
          Prevents pointerdown
        </span>
      </ContextMenuTrigger>
      <FileMenu />
    </ContextMenu>
  ),
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const menu = canvas.getByRole('menu', { hidden: true });
    for (const id of ['stopper', 'preventer']) {
      await real.click(canvas.getByTestId(id), { button: 'right' });
      await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
      // The button is up by now; a menu opened mid-press would have been dismissed.
      await delay(150);
      await expect(menu.matches(':popover-open')).toBe(true);
      await real.keyboard('{Escape}');
      await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    }
  },
};
