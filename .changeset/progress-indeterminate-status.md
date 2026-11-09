---
'h2d-glass-ui': patch
---

An indeterminate `Progress` with a `status` of `success` or `error` no longer slides: it fills the track in the status colour, and tells screen readers the status through its description (`aria-describedby`) while still having no `aria-valuetext`.
