# h2d-glass-ui

## 0.1.0

### Minor Changes

- e961b84: First release, completing phase 1 of the roadmap. Components: Surface, Card (with CardHeader,
  CardTitle, CardDescription, CardContent and CardFooter), Button, IconButton, Badge, Avatar,
  Divider, Spinner, Field, Input, Textarea, Checkbox, RadioGroup with Radio, and Switch. Styles ship
  as plain CSS in `h2d-glass-ui/styles.css`, with light and dark themes that follow the operating
  system or `data-flg-theme`.
- 9e2ffcc: Phase 2 of the roadmap. Components: Dialog (with DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter and DialogClose), Drawer (with the same parts), Popover
  (with PopoverTrigger, PopoverContent and PopoverClose), Tooltip (with TooltipTrigger and
  TooltipContent), DropdownMenu and ContextMenu (with the shared Menu parts: MenuItem,
  MenuCheckboxItem, MenuRadioGroup, MenuRadioItem, MenuGroup, MenuLabel, MenuSeparator, MenuShortcut,
  MenuSub, MenuSubTrigger and MenuSubContent for submenus), Select (single and multiple, with
  SelectItem, SelectGroup and SelectSeparator), Tabs, Accordion,
  Breadcrumb, Pagination (with `renderLink` for the links of a router), and Toast (`toast()` and
  `Toaster`). The overlays are built on the native `<dialog>` element and the Popover API, so there is
  no portal or z-index to manage; the exception is Toast, whose region moves into the host of an open
  Dialog or Drawer so that it can still be seen and clicked.
  
  **Breaking:** the supported browsers now start at Safari and iOS 17.4, the first versions in which
  a dialog's `::backdrop` reads the theme's custom properties.
  
  `asChild` now accepts a child passed from a Server Component.
- Phase 3 of the roadmap, the advanced inputs so far. Components: Slider (single value or range),
  NumberInput, SegmentedControl (with SegmentedControlItem), Combobox (with ComboboxItem,
  ComboboxGroup and ComboboxSeparator), TagInput, Calendar (single day or range) and DatePicker. Each
  except Calendar submits with a plain form and resets with it. Values are numbers and ISO date
  strings (`'YYYY-MM-DD'`), and `null` means no value; dates never move with the time zone. Combobox,
  TagInput and DatePicker speak through a live region of their own, so they are heard inside an open
  Dialog too. `Field` takes an `aside` for content at the right of the label row.
  
  There are no breaking changes.
