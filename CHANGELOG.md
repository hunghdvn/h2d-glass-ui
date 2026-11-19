# h2d-glass-ui

## 0.4.0

### Minor Changes

- 21b660e: Phase 5 of the roadmap: the frame of an application, and the widgets of its header.
  
  - AppShell (with AppShellHeader, AppShellSidebar, AppShellMain, AppShellFooter,
    AppShellSidebarTrigger and AppShellBrand): a header, a sidebar, the page and a footer on one grid,
    laid out by CSS alone, so the HTML from the server is right at every width. `layout` puts the
    sidebar full height (`sidebar`) or under a full-width header (`header`). Wide, the sidebar is a
    column that folds into a rail (`collapsed`, `defaultCollapsed`, `onCollapsedChange`; keep it in a
    cookie and the server draws the rail from the first HTML); narrow, it is a sheet with a scrim,
    `inert` behind it, Esc and focus return. It has a skip link, and on a page that has one it keeps
    `scroll-padding-top` of `<html>` equal to the header and the margin of `<body>` at zero.
  - Nav (with NavSection, NavItem and NavGroup): `pill` and `bar`. Items are links (`asChild` takes a
    router's `Link`), can show a count, and groups open from an active child. In a rail an item keeps
    its name and count, with a tooltip, and a group is a flyout.
  - Indicator: a count, a dot or a status on the corner of what it wraps, in four statuses. The number
    is for the eyes: put it in the name of the button.
  - SearchField: a field with a key hint, a clear button and `shortcut` (`/` or `mod+k`); with
    `collapsible` it rests as a button and opens over the header on a narrow screen.
  - ThemeSwitch, ThemeMenuGroup and ThemeScript: a button that goes round Light, Dark and System, the
    same choice as three radio items for a menu, and a script for the `<head>` that sets the stored
    theme on `<html>` before the first paint. They share one `localStorage` key and follow other tabs.
  - UserMenu: the avatar of the person signed in as a menu button, with a header that says who it is;
    `showName` adds their name.
  - List gets `surface`, so a list can sit inside a panel that is already glass.
  - Two new theme tokens: `--flg-indicator-accent` and `--flg-on-status`.
  
  AppShellBrand and Indicator render in a Server Component, and so does ThemeScript. The other parts
  are client components that take server-rendered children: a Server Component page can render the
  whole frame, its navigation included.
  
  There are no breaking changes.

## 0.3.1

### Patch Changes

- 16ffeff: An indeterminate `Progress` with a `status` of `success` or `error` no longer slides: it fills the track in the status colour, and tells screen readers the status through its description (`aria-describedby`) while still having no `aria-valuetext`.

## 0.3.0

### Minor Changes

- 9b0d741: Phase 4 of the roadmap. Six components for showing data and progress, each in three looks chosen
  with `variant`:
  
  - Alert (with AlertTitle, AlertDescription and AlertActions): `stripe`, `tinted` and `plain`.
    It shows a close button when it has `onDismiss`.
  - Progress: `thin`, `glow` and `inline`, determinate or indeterminate, with `status`, `showValue`
    and `getValueText`.
  - Skeleton and SkeletonText: `pulse`, `shimmer` and `glass`.
  - Stepper (with Step): `circles`, `compact` and `bars`, horizontal or vertical. `value` says where
    the process is; with `onValueChange` the steps that can be reached are buttons.
  - List (with ListItem): `inset`, `cards` and `plain`. A row can be a link (`href`, and `renderLink`
    for a router's `Link`) or a button (`onSelect`).
  - Table (with TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell and
    TableCaption): `lined`, `striped` and `minimal`. It sorts nothing itself: `sort` and `onSort`
    on TableHead show and ask for the direction. The frame scrolls, can keep the heading in view
    with `stickyHeader`, and becomes a named region a keyboard can reach once the table is wider
    than its room.
  
  Alert, Skeleton, Stepper and List render in a Server Component, and so do the parts inside a
  Table. Write the Steps of a Stepper in the component that renders the Stepper.
  
  A label given as `undefined` (or `null`) in `labels` now keeps its default name (NumberInput and
  Toaster), a fix made during phase 4.
  
  There are no breaking changes.

## 0.2.1

### Patch Changes

- ea33f2d: Tooltip: Esc pressed while the pointer is on the trigger now works like a press. Hover does not open
  it again until the pointer leaves the trigger. Browsers report a pointer that rests on the trigger
  as entering it again when the page changes under it (seen in Safari), which brought the tooltip
  straight back.

## 0.2.0

### Minor Changes

- d4e1d30: Phase 3 of the roadmap, completed. New component: FileUpload, a drop zone over the native file
  input, with a list of the files held, checks (`accept`, `maxSize`, `maxFiles`, `validate`) whose
  rejected files stay in the list with their reason, and drag and drop. It submits with a plain form
  (a plain HTML POST needs `encType="multipart/form-data"`) and resets with it.
  
  `form` now reaches the element that submits in NumberInput, Slider, SegmentedControl, Combobox and
  Select, so a control outside its `<form>` submits and resets with it, as TagInput, DatePicker and
  FileUpload already do.
  
  There are no breaking changes.

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
