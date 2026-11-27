import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as api from './index';

// This file checks the package root: what the grid's index exports must reach `src/index.ts`, and nothing internal.
// `src/components/data-grid/index.exports.test.ts` checks the grid's types file against the grid's index.

describe('public API', () => {
  it('exports exactly the documented components and nothing internal', () => {
    expect(Object.keys(api).sort()).toEqual([
      'Accordion',
      'AccordionContent',
      'AccordionItem',
      'AccordionTrigger',
      'Alert',
      'AlertActions',
      'AlertDescription',
      'AlertTitle',
      'AppShell',
      'AppShellBrand',
      'AppShellFooter',
      'AppShellHeader',
      'AppShellMain',
      'AppShellSidebar',
      'AppShellSidebarTrigger',
      'Avatar',
      'Badge',
      'Breadcrumb',
      'BreadcrumbLink',
      'BreadcrumbPage',
      'Button',
      'Calendar',
      'Card',
      'CardContent',
      'CardDescription',
      'CardFooter',
      'CardHeader',
      'CardTitle',
      'Checkbox',
      'Combobox',
      'ComboboxGroup',
      'ComboboxItem',
      'ComboboxSeparator',
      'ContextMenu',
      'ContextMenuContent',
      'ContextMenuTrigger',
      'DataGrid',
      'DatePicker',
      'Dialog',
      'DialogClose',
      'DialogContent',
      'DialogDescription',
      'DialogFooter',
      'DialogHeader',
      'DialogTitle',
      'DialogTrigger',
      'Divider',
      'Drawer',
      'DrawerClose',
      'DrawerContent',
      'DrawerDescription',
      'DrawerFooter',
      'DrawerHeader',
      'DrawerTitle',
      'DrawerTrigger',
      'DropdownMenu',
      'DropdownMenuContent',
      'DropdownMenuTrigger',
      'Field',
      'FileUpload',
      'IconButton',
      'Indicator',
      'Input',
      'Kbd',
      'List',
      'ListItem',
      'MenuCheckboxItem',
      'MenuGroup',
      'MenuItem',
      'MenuLabel',
      'MenuRadioGroup',
      'MenuRadioItem',
      'MenuSeparator',
      'MenuShortcut',
      'MenuSub',
      'MenuSubContent',
      'MenuSubTrigger',
      'Nav',
      'NavGroup',
      'NavItem',
      'NavSection',
      'NumberInput',
      'Pagination',
      'Popover',
      'PopoverClose',
      'PopoverContent',
      'PopoverTrigger',
      'Progress',
      'Radio',
      'RadioGroup',
      'SearchField',
      'SegmentedControl',
      'SegmentedControlItem',
      'Select',
      'SelectGroup',
      'SelectItem',
      'SelectSeparator',
      'Skeleton',
      'SkeletonText',
      'Slider',
      'Spinner',
      'Step',
      'Stepper',
      'Surface',
      'Switch',
      'Table',
      'TableBody',
      'TableCaption',
      'TableCell',
      'TableFooter',
      'TableHead',
      'TableHeader',
      'TableRow',
      'Tabs',
      'TabsContent',
      'TabsList',
      'TabsTrigger',
      'TagInput',
      'Textarea',
      'ThemeMenuGroup',
      'ThemeScript',
      'ThemeSwitch',
      'Toaster',
      'Tooltip',
      'TooltipContent',
      'TooltipTrigger',
      'UserMenu',
      'dataGridColumn',
      'toast',
    ]);
  });

  // The export list above sees only what exists at run time, and a type does not exist there: the
  // sources are read. Every name the grid's own entry exports is exported by the package entry, in
  // values and in types alike, so a name added to the grid cannot be left out of the package.
  it('exports every name the DataGrid folder exports, values and types alike', () => {
    const names = (file: string) => {
      const found = new Map<string, 'value' | 'type'>();
      const source = readFileSync(file, 'utf8');
      for (const [, type, list = ''] of source.matchAll(/export\s+(type\s+)?\{([^}]*)\}/g)) {
        for (const item of list.split(',')) {
          const name = item
            .trim()
            .split(/\s+as\s+/)
            .pop();
          if (name) found.set(name, type ? 'type' : 'value');
        }
      }
      return found;
    };
    const grid = names('src/components/data-grid/index.ts');
    const root = names('src/index.ts');
    expect(grid.size).toBeGreaterThan(40);
    for (const [name, kind] of grid) expect(root.get(name), `${name} is exported`).toBe(kind);
  });
});
