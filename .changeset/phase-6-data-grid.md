---
'h2d-glass-ui': minor
---

Phase 6 of the roadmap: a data grid, and the small parts it needed.

- Kbd: a key or a combination of keys, written for the platform (`keys="mod+k"` is ⌘K on a Mac and
  Ctrl K elsewhere), in text, in tooltips and in menus.
- MenuShortcut takes `keys`, so a menu item's shortcut is written for the platform as Kbd is.
- DialogContent gets `movable` (the user drags the dialog by its header, on screens 640px and wider)
  and `fullScreenOnPhone` (below 640px the dialog fills the screen). `movable` adds one theme token,
  `--flg-dialog-lift-shadow`.
- DataGrid, with `dataGridColumn` and its types: a grid for data you own. Typed columns, sorting,
  paging, virtual scrolling and a server mode, where you sort, filter and page yourself. Columns
  resize, reorder, pin and hide through a chooser. There are four ways to filter (a search box, a
  filter row, a menu on each header and a filter panel), grouping with totals, master-detail rows
  and row reordering. Five edit modes (cell, row, form, popup and batch) check what is typed with
  rules, send each change to your code and report what failed. The data goes out as a CSV file, and
  the saved-state recipe in the DataGrid page keeps the sort, filter, layout and groups across
  visits. It adds three theme tokens: `--flg-data-grid-pin-bg`, `--flg-data-grid-pin-shadow` and
  `--flg-column-resize-line`.

DataGrid is a client component. Its JavaScript stays out of an app that does not import it.

There are no breaking changes.
