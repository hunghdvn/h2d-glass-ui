---
'fl-glass-ui': minor
---

Overlays, the first part of phase 2 of the roadmap. Components: Dialog (with DialogTrigger,
DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter and DialogClose), Drawer
(with the same parts), Popover (with PopoverTrigger, PopoverContent and PopoverClose) and Tooltip
(with TooltipTrigger and TooltipContent). They are built on the native `<dialog>` element and the
Popover API, so there is no portal or z-index to manage.

**Breaking:** the supported browsers now start at Safari and iOS 17.4, the first versions in which
a dialog's `::backdrop` reads the theme's custom properties.

`asChild` now accepts a child passed from a Server Component.
