---
'h2d-glass-ui': patch
---

Tooltip: Esc pressed while the pointer is on the trigger now works like a press. Hover does not open
it again until the pointer leaves the trigger. Browsers report a pointer that rests on the trigger
as entering it again when the page changes under it (seen in Safari), which brought the tooltip
straight back.
