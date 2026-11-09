---
'h2d-glass-ui': minor
---

Phase 4 of the roadmap. Six components for showing data and progress, each in three looks chosen
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
