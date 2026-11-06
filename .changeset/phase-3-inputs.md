---
'h2d-glass-ui': minor
---

Phase 3 of the roadmap, completed. New component: FileUpload, a drop zone over the native file
input, with a list of the files held, checks (`accept`, `maxSize`, `maxFiles`, `validate`) whose
rejected files stay in the list with their reason, and drag and drop. It submits with a plain form
(a plain HTML POST needs `encType="multipart/form-data"`) and resets with it.

`form` now reaches the element that submits in NumberInput, Slider, SegmentedControl, Combobox and
Select, so a control outside its `<form>` submits and resets with it, as TagInput, DatePicker and
FileUpload already do.

There are no breaking changes.
