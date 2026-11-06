---
'h2d-glass-ui': patch
---

Tooltip: after Esc closes it, a pointer that has not moved no longer opens it again. Safari reports a
pointer resting on the trigger as entering it again when the page changes under it, which brought
the tooltip straight back. Moving the pointer off the trigger, or onto it from elsewhere, works as
before.
