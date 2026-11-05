---
'h2d-glass-ui': minor
---

Phase 3 of the roadmap. Components: Slider (single value or range), NumberInput, SegmentedControl
(with SegmentedControlItem), Combobox (with ComboboxItem, ComboboxGroup and ComboboxSeparator),
TagInput, FileUpload, Calendar (single day or range) and DatePicker. Each submits with a plain form
and resets with it, takes `form` to reach a form it is not inside of (so does Select), and keeps
its own live region for screen readers. Values are numbers and ISO date strings (`'YYYY-MM-DD'`),
and `null` means no value. `Field` takes an `aside` for content at the right of the label row.

There are no breaking changes.
