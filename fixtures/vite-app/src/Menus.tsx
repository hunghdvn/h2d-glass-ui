// The menus of phase 2, plan B. The Next.js fixture renders the same markup from a Server Component.
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  MenuCheckboxItem,
  MenuItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
} from 'h2d-glass-ui';

export function Menus() {
  return (
    <section style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <DropdownMenu>
        <DropdownMenuTrigger variant="secondary">Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuItem>
            Rename <MenuShortcut>F2</MenuShortcut>
          </MenuItem>
          <MenuSub>
            <MenuSubTrigger>Move to</MenuSubTrigger>
            <MenuSubContent>
              <MenuItem>Design</MenuItem>
              <MenuItem>Archive</MenuItem>
            </MenuSubContent>
          </MenuSub>
          <MenuSeparator />
          <MenuCheckboxItem defaultChecked>Show grid</MenuCheckboxItem>
          <MenuItem variant="danger">Delete</MenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ContextMenu>
        <ContextMenuTrigger
          style={{ padding: '12px 16px', border: '1px dashed currentColor', borderRadius: 8 }}
        >
          Right-click report.pdf
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="report.pdf">
          <MenuItem>Open</MenuItem>
          <MenuItem>Duplicate</MenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </section>
  );
}
