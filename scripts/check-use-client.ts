import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { clientBoundaryProblems, librarySources } from './lib/use-client';

/** Spec §6.2: the modules that must be client components. */
const CLIENT_MODULES: readonly string[] = [
  'src/components/button/Button.tsx',
  'src/components/icon-button/IconButton.tsx',
  'src/components/avatar/Avatar.tsx',
  'src/components/field/Field.tsx',
  'src/components/input/Input.tsx',
  'src/components/textarea/Textarea.tsx',
  'src/components/checkbox/Checkbox.tsx',
  'src/components/radio-group/RadioGroup.tsx',
  'src/components/radio-group/Radio.tsx',
  'src/components/switch/Switch.tsx',
  'src/components/dialog/Dialog.tsx',
  'src/components/drawer/Drawer.tsx',
  'src/components/popover/Popover.tsx',
  'src/components/tooltip/Tooltip.tsx',
  'src/components/menu/Menu.tsx',
  'src/components/dropdown-menu/DropdownMenu.tsx',
  'src/components/context-menu/ContextMenu.tsx',
  'src/components/select/Select.tsx',
  'src/components/combobox/Combobox.tsx',
  'src/components/tag-input/TagInput.tsx',
  'src/components/tabs/Tabs.tsx',
  'src/components/segmented-control/SegmentedControl.tsx',
  'src/components/segmented-control/SegmentedControlItem.tsx',
  'src/components/number-input/NumberInput.tsx',
  'src/components/slider/Slider.tsx',
  'src/components/accordion/Accordion.tsx',
  'src/components/pagination/Pagination.tsx',
  'src/components/progress/Progress.tsx',
  'src/components/table/Table.tsx',
  'src/components/data-grid/DataGrid.tsx',
  'src/components/app-shell/AppShell.tsx',
  'src/components/nav/Nav.tsx',
  'src/components/search-field/SearchField.tsx',
  'src/components/kbd/kbd-keys.tsx',
  'src/components/user-menu/UserMenu.tsx',
  'src/components/theme-switch/ThemeSwitch.tsx',
  'src/components/calendar/Calendar.tsx',
  'src/components/date-picker/DatePicker.tsx',
  'src/components/file-upload/FileUpload.tsx',
  'src/components/toast/toast.ts',
  'src/components/toast/Toaster.tsx',
];

const files = librarySources(readdirSync('src', { recursive: true, encoding: 'utf8' }));
const problems = clientBoundaryProblems(files, CLIENT_MODULES, {
  read: (file) => readFileSync(file, 'utf8'),
  exists: existsSync,
});
if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`use client: ${files.length} module(s) checked, ${CLIENT_MODULES.length} client.`);
