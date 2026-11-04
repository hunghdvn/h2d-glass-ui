# h2d-glass-ui — Thiết kế giai đoạn 3 (input nâng cao)

> Gói đổi tên từ `fl-glass-ui` thành `h2d-glass-ui` ở PR #13 (2026-11-04). Tên file và các liên kết tới spec, plan đã có giữ nguyên tên cũ, để các plan đã thực thi vẫn trỏ đúng; mọi code, import và lời cảnh báo dùng tên mới.

- **Ngày:** 2026-11-02
- **Trạng thái:** Chờ duyệt
- **Phạm vi spec này:** Giai đoạn 3: 8 component input nâng cao, các primitives nội bộ chúng cần, và bản phát hành `0.3.0`.
- **Spec trước:** [`2026-10-01-fl-glass-ui-phase-0-1-design.md`](2026-10-01-fl-glass-ui-phase-0-1-design.md), gọi tắt là "spec 0+1", và [`2026-10-05-fl-glass-ui-phase-2-design.md`](2026-10-05-fl-glass-ui-phase-2-design.md), gọi tắt là "spec giai đoạn 2". Mọi quy ước ở hai spec đó vẫn áp dụng, trừ chỗ spec này ghi rõ là thay thế.

---

## 1. Bối cảnh và mục tiêu

Giai đoạn 2 đã merge vào `main` (PR #5–#10, `main` ở `7bb3cf5`). Changeset `0.2.0` đã sẵn sàng; việc publish do chủ dự án quyết định. Giai đoạn 3 là dòng "Input nâng cao" của lộ trình ở spec 0+1 §2: Combobox, Slider, NumberInput, SegmentedControl, TagInput, FileUpload, Calendar, DatePicker.

Các ràng buộc của giai đoạn 1 và 2 giữ nguyên, spec này không nhắc lại:

- Mốc trình duyệt Safari/iOS 17.4 (spec giai đoạn 2 §3.1).
- Dependency lúc chạy chỉ có `clsx` và `@floating-ui/dom` (spec giai đoạn 2 §3.2).
- Theme mặc định đúng tuyệt đối mockup đã duyệt; tương phản AA bảo đảm ở các chế độ người dùng bật (spec 0+1 §1, §4.6, §4.9).
- Quy tắc React Server Components (spec 0+1 §6.2, spec giai đoạn 2 §3.6).
- Dùng sai thì `devWarn`, không bao giờ throw (spec 0+1 §5).
- Chữ mặc định bằng tiếng Anh, ghi đè được qua prop (spec 0+1 §6.1).

**Ai quyết định gì.** Chủ dự án bỏ qua các câu hỏi thiết kế của giai đoạn này. Vì vậy mọi quyết định về hành vi và API trong spec này là của Claude, kể cả chỗ không ghi "(Claude chốt)" từng dòng. Riêng giao diện ở §4 do chủ dự án chọn qua mockup ngày 2026-11-02. Chỗ ghi "(Claude chốt)" là các quyết định chủ dự án nên đọc kỹ khi duyệt, đặc biệt các chỗ phải đổi so với bản quyết định ban đầu vì code hoặc nền tảng không cho phép làm đúng như vậy.

### Quyết định đã chốt

| Chủ đề | Quyết định |
|---|---|
| Phạm vi | Đủ 8 component: Slider (một núm và khoảng), NumberInput, SegmentedControl, Combobox, TagInput, FileUpload, Calendar (một ngày và khoảng), DatePicker (Claude chốt) |
| Chia việc | 1 spec, 4 plan, mỗi plan một PR (§2) (Claude chốt) |
| Form | Mọi component (trừ Calendar) gửi được trong một `<form>` mà không cần JS nối thêm, và trở về giá trị mặc định khi form reset (§3.1) (Claude chốt) |
| Giá trị | Số là `number`; ngày là chuỗi ISO `'YYYY-MM-DD'`, không dùng `Date`; `null` là "chưa có giá trị" (§3.3) (Claude chốt) |
| Locale | Prop `locale` (BCP 47), mặc định cố định `'en-US'`; tuần bắt đầu Chủ nhật trừ khi đặt `weekStartsOn` (§3.4) (Claude chốt) |
| Popup | Dùng lại lớp nổi của giai đoạn 2: `popover="auto"`, `useFloating`, top layer (§3.5) (Claude chốt) |
| Giao diện | Theo các mockup chủ dự án chọn ngày 2026-11-02 (§4.1) |
| Phát hành | Một changeset `minor` cho `0.3.0`. Chủ dự án vẫn là người publish (Claude chốt) |

---

## 2. Phạm vi và chia plan

| Plan | Nội dung | Phụ thuộc |
|---|---|---|
| **A** | Primitives: `number.ts`, `use-form-reset.ts` (tách từ Select), ô `aside` của `Field` (§3.2), icon dùng chung (§5). Component: **Slider** (một núm và khoảng), **NumberInput**, **SegmentedControl** | — |
| **B** | Primitives: `list-rows.ts` (chuyển từ Select), `use-announce.ts`, kênh báo lỗi của control lên `Field` (§3.2). Component: **Combobox**, **TagInput** | A (Claude chốt) |
| **C** | Primitive: `date.ts`. Component: **Calendar**, **DatePicker** | A, B (phát hiện khi lập Plan A) |
| **D** | Component: **FileUpload**. Docs chung (mục "Build a form" của Getting started, trang Accessibility), fixtures dùng cả 8 component, changeset `0.3.0` | A–C |

- **Vì sao B và C phụ thuộc A** (Claude chốt). Bản quyết định ban đầu để B và C độc lập với A. Nhưng `use-form-reset` và icon dùng chung được cả A, B, C, D dùng. Nếu B và C chạy song song mà mỗi plan tự thêm chúng, hai PR sẽ cùng viết một file. Đặt chúng ở Plan A thì B và C chỉ dùng lại.
- **`use-announce` và kênh báo lỗi lên `Field` ở Plan B, và C phụ thuộc B** (phát hiện khi lập Plan A). Không component nào của Plan A dùng chúng (§3.2, §3.6: người dùng đầu tiên là Combobox và TagInput). Một module trong `src/internal/` không ai import thì không có file build, và `check:use-client` báo lỗi; code chưa ai dùng cũng là code chết khi review. Vì vậy chúng đi cùng người dùng đầu tiên, và các plan chạy lần lượt A, B, C, D như giai đoạn 2.
- **Mỗi plan tự mang đủ phần của mình,** như giai đoạn 2: stories, test các lớp ở §7, ảnh chuẩn visual, trang MDX của component, danh sách `check:use-client` và `check:dist-css`, và ghi lại ngưỡng `size-limit`. Plan D làm thêm docs chung, fixtures và phát hành.
- **Thay đổi ở code cũ** (không đổi hành vi, ảnh chuẩn visual giữ nguyên):
  - Plan A: Select dùng `useFormReset` thay cho đoạn tự viết; các chevron và dấu × đang vẽ riêng trong Select, Accordion, Menu, Breadcrumb, Pagination và Toaster chuyển sang icon dùng chung (§4.6).
  - Plan B: `select-rows.ts` chuyển thành `src/internal/list-rows.ts`, dùng chung cho Select và Combobox.
  - Plan B: `Field` có thêm kênh báo lỗi của control (§5).

**Ngoài phạm vi:**

- **Slider:**
  - Slider dọc.
  - Vạch chia có nhãn chữ (vạch chia dạng chấm thì có, §4.3).
  - Ba núm trở lên.
- **NumberInput:** mặt nạ nhập tiền tệ hay đơn vị ngoài những gì `Intl.NumberFormat` làm được qua `formatOptions`.
- **Combobox:**
  - Nạp item bất đồng bộ dựng sẵn trong lib. Người dùng tự lọc và truyền item vào; cờ `loading` hiện một dòng trạng thái (§6.3).
  - Ảo hoá danh sách dài.
  - Nhóm item cho phép tạo mới.
  - Chọn nhiều (TagInput lo việc nhập thẻ tự do).
- **TagInput:** gợi ý và tự hoàn thành.
- **FileUpload:**
  - Việc tải tệp lên server, tiến độ từng tệp.
  - Xem trước ảnh.
  - Thả cả thư mục.
- **Ngày giờ:**
  - Chọn giờ, chọn ngày kèm giờ.
  - DateRangePicker hai ô nhập. Calendar đã chọn được khoảng; ô chọn khoảng để giai đoạn sau.
  - Múi giờ. Ngày là ngày lịch, không có giờ.
  - Lịch không phải Dương lịch.
- **Hướng phải sang trái (RTL).**
- **Chữ số không phải Latin** khi nhập số và ngày (Claude chốt).
- **Hệ thống i18n.**

---

## 3. Kiến trúc

### 3.1 Form

Mọi component, trừ Calendar, chạy được trong một `<form>` không cần JS nối thêm: `FormData`, validation gốc và reset form đều như control gốc.

| Component | Phần tử mang giá trị khi gửi | `required` |
|---|---|---|
| Slider | Một `<input type="hidden" name>` cho mỗi núm. Khoảng: hai input cùng `name`, núm nhỏ trước. Giá trị là chuỗi số thường (`String(value)`) | Không áp dụng: slider luôn có giá trị (Claude chốt) |
| NumberInput | Một `<input type="hidden" name>` mang số thô, chuỗi rỗng khi `null`. Ô hiển thị không có `name` | `required` gốc trên ô hiển thị |
| SegmentedControl | Radio gốc (§6.3) | `required` gốc trên radio |
| Combobox | Một `<select>` gốc ẩn như của Select, gồm `<option value="">` và một option cho giá trị hiện tại (Claude chốt) | `required` gốc trên `<select>` ẩn |
| TagInput | Một `<input type="hidden" name>` cho mỗi thẻ, cùng `name` | `setCustomValidity(labels.required)` trên ô gõ khi `required` và chưa có thẻ nào; ô gõ mang `required` gốc chỉ khi `required` bật và chưa có thẻ nào, để HTML từ server chặn được lần gửi trống trước khi hydrate (Claude chốt; đổi khi review PR #12) |
| FileUpload | Chính `<input type="file" name>`. Tệp thả vào được gán vào `input.files` qua một `DataTransfer` | `required` gốc trên `<input type="file">` |
| DatePicker | Một `<input type="hidden" name>` mang ngày ISO `YYYY-MM-DD`, chuỗi rỗng khi `null` | `required` gốc trên ô gõ |

- **`<input type="hidden">` không tham gia validation.** Trình duyệt loại nó khỏi constraint validation, nên `required` trên input ẩn không có tác dụng. Vì vậy `required` luôn đặt trên một phần tử có tham gia: ô hiển thị, ô gõ, hoặc `<select>` ẩn.
- **Combobox gửi qua `<select>` ẩn, không qua input ẩn** (Claude chốt). Bản quyết định ban đầu dùng input ẩn kèm `required`. Không làm được, vì lý do trên. `required` đặt trên ô nhập thì chỉ kiểm có chữ hay không: chữ "abc" chưa chọn item nào vẫn qua. `<select>` ẩn của Select đã giải quyết đủ: `required` kiểm đúng giá trị, bong bóng validation hiện đúng chỗ (nó phủ trùng lên khung, `opacity: 0`), và khi trình duyệt focus nó thì lib chuyển focus sang ô nhập. `FormData` giống hệt input ẩn.
- **TagInput giữ input ẩn,** vì `required` được lo bằng ô gõ (Claude chốt):
  - `required` gốc coi chữ gõ dở (kể cả chỉ có dấu cách) là có giá trị, trong khi form chỉ gửi các thẻ. Vì vậy khi `required` bật mà chưa có thẻ nào, ô gõ mang `setCustomValidity(labels.required)` bất kể trong ô gõ có chữ gì; lời này thắng cái "đã có giá trị" của thuộc tính gốc. Ô gõ vẫn có `aria-required`, và thuộc tính `required` gốc chỉ đặt trong lúc chưa có thẻ nào, để HTML dựng từ server chặn được lần gửi trống trước khi hydrate. Lời báo của một thẻ bị từ chối được ưu tiên khi có (phát hiện khi review PR #12).
  - Chữ đang gõ dở được thêm thành thẻ khi focus rời TagInput (§6.3).
  - Khi chữ bị từ chối, ô gõ mang `setCustomValidity(<lời báo lỗi>)`, nên form không gửi được.
- **DatePicker giữ input ẩn,** vì ô gõ mang `required` (ô trống đúng khi giá trị là `null`, §6.3). Chữ không đọc được thành ngày làm ô gõ mang `setCustomValidity(labels.invalidDate)`, nên form không gửi được (Claude chốt).
- **Reset form** dùng `useFormReset` (§5), cách Select đang làm:
  - Component uncontrolled trở về `defaultValue` (và chữ tương ứng), trừ khi reset bị huỷ bằng `preventDefault()`. Listener của lib chạy trước `onReset` của React, nên lib chờ một task rồi mới xem.
  - Component controlled giữ nguyên giá trị; lib đồng bộ lại phần tử gốc theo giá trị đó.
  - Lời báo lỗi của control (TagInput, DatePicker) bị xoá.
  - SegmentedControl dùng radio gốc nên trình duyệt tự reset, như `RadioGroup`.
  - FileUpload: trình duyệt xoá `input.files`; lib gán lại `defaultValue` (thường là rỗng).
- **Phần tử bị `disabled` không được gửi**, như control gốc: input ẩn và `<select>` ẩn mang `disabled` theo component.

### 3.2 Field

`Field` cấp id nhãn, mô tả, lỗi, cùng `invalid`, `disabled` và `required` cho các control mới qua `useFieldProps`, đúng như với Input và Select (spec 0+1 §6.3, spec giai đoạn 2 §6.3).

| Component | Nhãn của Field gắn vào đâu | Marker |
|---|---|---|
| Slider | Nhóm: `aria-labelledby`. Một núm: trên núm. Khoảng: trên phần tử `role="group"` bọc hai núm | `markAsFieldGroup` |
| NumberInput | `<label for>` trỏ vào ô hiển thị | `markAsFieldControl` |
| SegmentedControl | Nhóm: `aria-labelledby` trên `role="radiogroup"`, như RadioGroup | `markAsFieldGroup` |
| Combobox | `<label for>` trỏ vào ô nhập | `markAsFieldControl` |
| TagInput | `<label for>` trỏ vào ô gõ | `markAsFieldControl` |
| FileUpload | `<label for>` trỏ vào `<input type="file">` | `markAsFieldControl` |
| DatePicker | `<label for>` trỏ vào ô gõ | `markAsFieldControl` |
| Calendar | Không phải control của Field: không có `name`, không gửi form (Claude chốt) | — |

- **Slider là nhóm của Field** (Claude chốt). `<label for>` chỉ gắn được vào phần tử nhận nhãn (input, button…), không gắn được vào phần tử `role="slider"`. Vì vậy Field render nhãn dạng `<span>` và slider lấy tên qua `aria-labelledby`, như RadioGroup.
- **Ô `aside` của Field** (chủ dự án chọn B, 2026-11-02): `Field` nhận thêm prop `aside?: ReactNode`.
  - Nó hiện ở bên phải hàng nhãn: hàng nhãn thành một hàng flex, nhãn bên trái, `aside` căn phải.
  - Chữ cỡ `--flg-text-xs`, màu `--flg-text-muted`, đậm thường, `font-variant-numeric: tabular-nums`, như giá trị bên phải nhãn trong mockup S3.
  - `aside` nằm ngoài `<label>`, nên không thuộc tên của control. Field không ẩn nó với screen reader; người dùng tự thêm `aria-hidden` khi nội dung đã được đọc theo cách khác (ví dụ giá trị của Slider).
  - Dùng được cho mọi control, ví dụ bộ đếm ký tự của Textarea ("12/200").
  - Không có `aside` thì hàng nhãn trông như trước, không đổi pixel nào.
- **Mô tả và lỗi** đến mọi phần tử nhận focus của control qua `aria-describedby` (hai núm của Slider khoảng đều nhận).
- **Lỗi do control tự báo** (Claude chốt). TagInput (thẻ bị từ chối) và DatePicker (ngày không hợp lệ) có lời báo lỗi của riêng chúng. Hiện `Field` chỉ hiện `error` do người dùng truyền vào, control không có cách nào đưa lỗi vào đó. Giai đoạn 3 thêm một kênh nội bộ (§5, `useControlError`):
  - Trong Field: lời báo lỗi hiện ở chỗ lỗi của Field (`flg-field-error`) và Field coi là `invalid`.
  - `error` do người dùng truyền vào Field thắng: khi có nó, lời của control không hiện. Prop truyền trực tiếp luôn thắng giá trị lib tự tính (spec 0+1 §5, `useFieldProps`).
  - Ngoài Field: control tự render `<p class="flg-field-error">` ngay dưới khung của nó, trong phần tử gốc, và nối vào `aria-describedby`.
  - Lời báo lỗi cũng được đọc qua vùng live của component (§3.6), vì một mô tả mới không tự được đọc.

### 3.3 Giá trị

- **Slider:** `number`; khoảng là `[number, number]`. Slider là khoảng khi giá trị là mảng (§6.3).
- **NumberInput:** `number | null`.
- **Ngày:** chuỗi ISO `'YYYY-MM-DD'` ở mọi chỗ trong API; tháng là `'YYYY-MM'`. Không dùng `Date`:
  - Không bị lệch ngày theo múi giờ.
  - Server và client ra cùng một chuỗi.
  - Trùng định dạng của `<input type="date">` gốc.
- **`null` là "chưa có giá trị"** cho Combobox, NumberInput, DatePicker và Calendar, ở chế độ controlled. Giống `value={null}` của Tabs: `undefined` nghĩa là uncontrolled.
- **`onValueChange` chỉ được gọi khi người dùng đổi giá trị.** Giá trị controlled do component cha đổi không gọi nó.
- **Giá trị sai kiểu hoặc ngoài khoảng** (số ngoài `min`/`max`, ISO sai định dạng): lib hiển thị giá trị đã kẹp hoặc bỏ qua giá trị đó, in cảnh báo dev, và không gọi `onValueChange` (Claude chốt).

### 3.4 Locale và "hôm nay"

- **Prop `locale`** (BCP 47) có trên NumberInput, Calendar, DatePicker và FileUpload (định dạng cỡ tệp). Mặc định `'en-US'`, cố định, để server và client render cùng một chữ. Thêm `locale` cho FileUpload là Claude chốt.
- **Mọi định dạng ngày** chạy qua `Intl.DateTimeFormat` với `timeZone: 'UTC'` trên một mốc `Date.UTC(năm, tháng - 1, ngày)`, để ngày không lệch theo múi giờ của máy (Claude chốt).
- **`weekStartsOn`** (0 = Chủ nhật … 6 = thứ Bảy) mặc định `0` cho mọi locale (Claude chốt):
  - `Intl.Locale#getWeekInfo` không có trên Firefox và khác nhau giữa các phiên bản, nên lib không suy ra ngày đầu tuần từ locale.
  - Docs ghi: "đặt `weekStartsOn={1}` cho locale bắt đầu tuần từ thứ Hai, như `vi-VN`".
- **"Hôm nay"** của Calendar được tính ở client sau khi mount, theo ngày giờ của máy người dùng. Server không biết ngày của người dùng, nên HTML từ server không đánh dấu ngày nào là hôm nay.
  - Prop `today` (ISO) ghi đè, cho test và demo.
  - Lib tính lại "hôm nay" khi trang được hiện lại (`visibilitychange`) và khi Calendar nhận focus, để trang mở qua nửa đêm không giữ ngày cũ.

### 3.5 Popup

Combobox và DatePicker dùng lại lớp nổi của giai đoạn 2 (spec giai đoạn 2 §3.3): top layer, nội dung render ngay sau control trong DOM, `usePopover` (đồng bộ `toggle`, trả focus), `useFloating` với `strategy: "fixed"`, và quy tắc với Dialog/Drawer (bấm khi popup đang mở trong Dialog chỉ đóng popup).

| Component | Cơ chế | Esc | Bấm ra ngoài |
|---|---|---|---|
| Listbox của Combobox | `popover="auto"`, như listbox của Select | Trình duyệt đóng listbox. Esc khi listbox đã đóng thuộc về lib (§6.3) | Light dismiss. Bấm vào chính ô nhập cũng đóng listbox (§6.3) |
| Lịch của DatePicker | `popover="auto"`, `role="dialog"` không modal, `aria-label` là `labels.dialog` ("Choose date") | Trình duyệt đóng, focus về ô gõ | Light dismiss |

- **Vị trí:**
  - Listbox của Combobox như của Select: `offset` 6px, `flip`, `size` (rộng tối thiểu bằng khung, cao tối đa `min(320px, chỗ còn trống)`).
  - Lịch của DatePicker: `offset` 6px, `flip`, `shift`; rộng cố định theo §4.3.
- **Focus của DatePicker** theo mẫu APG "date picker dialog": mở thì focus vào ngày đang focus được của lưới (§6.3, Calendar); đóng thì focus về ô gõ.
- **Con của popup chỉ render khi đang mở** (quy tắc chung của spec giai đoạn 2 §3.3). Option của Combobox và Calendar của DatePicker chỉ có trong DOM lúc mở (Claude chốt).

### 3.6 Thông báo cho screen reader

- **Mỗi component tự có một vùng live** (Claude chốt). Bản quyết định ban đầu nói "một vùng live dùng chung". Không làm được: khi một Dialog modal đang mở, mọi thứ ngoài `<dialog>` là `inert`, và vùng live nằm trong phần `inert` không được đọc. Combobox đặt trong Dialog sẽ câm. Vùng live nằm trong phần tử gốc của component thì luôn ở cùng chỗ với control.
- **Cấu trúc:** một `<div class="flg-visually-hidden" aria-live="polite" aria-atomic="true">`, có mặt ngay từ lúc mount (cả trong HTML từ server, rỗng), vì screen reader chỉ đọc thay đổi trong một vùng live mà nó đã biết (bài học Toaster, spec giai đoạn 2 §6.3).
- **Ai dùng:**
  - Combobox: số kết quả ("5 results", "No results"), "Loading…".
  - TagInput: thẻ được thêm, bị xoá, bị từ chối kèm lý do.
  - FileUpload: số tệp được thêm và bị từ chối.
  - DatePicker: "Invalid date" và lời báo ngày không chọn được.
  - Calendar không dùng: tiêu đề tháng của nó tự là vùng live (§6.3).
- **Primitive** là `useAnnounce` (§5).

### 3.7 Client và server

- **Client** (`"use client"`): cả 8 component và mọi phần con của chúng. Danh sách `check:use-client` thêm chúng.
- **Server-safe:** không có component mới nào.
- **Hàm thuần** (`number.ts`, `date.ts`, các helper riêng của component ở §5) không có directive và có unit test riêng.
- **Prop là hàm** (`getValueText`, `filter`, `validate`, `isDateUnavailable`, `onReject`, `labels` có hàm) không truyền được từ Server Component. Docs hướng dẫn bọc component trong một client component của người dùng, như `getHref` của Pagination.

### 3.8 Cấu trúc file bổ sung

```
src/internal/        number.ts, date.ts, use-form-reset.ts, use-announce.ts, list-rows.ts
                     (chuyển từ select/select-rows.ts); field-context.tsx và icons.tsx được mở rộng
src/components/      slider/ (kèm use-pointer-drag.ts), number-input/ (kèm use-press-repeat.ts),
                     segmented-control/, combobox/ (kèm match.ts), tag-input/ (kèm split-tags.ts),
                     file-upload/ (kèm accept.ts), calendar/, date-picker/
src/styles/components/
                     slider.css, number-input.css, segmented-control.css, combobox.css,
                     tag-input.css, file-upload.css, calendar.css, date-picker.css
```

---

## 4. Token và giao diện

### 4.1 Mockup đã duyệt

Các file nằm ở `docs/superpowers/specs/mockups/`. Mỗi file trình bày nhiều phương án; spec này chỉ dùng **phương án đã chọn**. Chủ dự án chọn cả tám ngày 2026-11-02.

| File | Nội dung | Đã chọn |
|---|---|---|
| `phase-3-slider-number-segmented.html` | Slider, NumberInput, SegmentedControl | **S3**: rãnh mảnh có vạch chia; **N2**: nút − và + ở hai đầu; **G1**: như Tabs `segmented` |
| `phase-3-combobox-taginput.html` | Combobox, TagInput | **C1**: như Select, phần khớp in đậm; **Ta1**: chip trung tính như Select chọn nhiều |
| `phase-3-calendar-datepicker.html` | Calendar, DatePicker | **K1**: ô tròn; **D1**: ô nhập có nút lịch |
| `phase-3-fileupload.html` | FileUpload | **F1**: vùng thả lớn |

Mọi số liệu ở §4.3 lấy từ CSS `mk-` của đúng phương án đã chọn, ở cả light và dark. Mockup dùng chung token của lib, nên dark khác light chỉ ở giá trị token.

### 4.2 Token mới

**Hai token dẫn xuất,** để script tương phản đo đúng thứ CSS dùng (cách làm của `--flg-highlight-*` và `--flg-selected-*` ở spec giai đoạn 2 §4.2) (Claude chốt):

| Token | Mặc định | `prefers-contrast: more` | Dùng ở |
|---|---|---|---|
| `--flg-dropzone-border` | `color-mix(in srgb, var(--flg-text-muted) 45%, transparent)` | `var(--flg-text-muted)` | Viền đứt nét của vùng thả FileUpload (F1) |
| `--flg-slider-tick` | `color-mix(in srgb, var(--flg-text-muted) 70%, transparent)` | `var(--flg-text-muted)` | Chấm vạch chia của Slider (S3) |

- **Viền vùng thả** trong mockup F1 từng là `--flg-control-border`, gần như không thấy lúc nghỉ, nên trang mockup đã đổi sang giá trị trên. Spec ghi nó thành token dẫn xuất thay vì một giá trị viết thẳng trong CSS.
- **Chấm vạch chia** trong mockup S3 là `--flg-text-muted` với `opacity: .7`. Trên một chấm một màu, `opacity: .7` và màu pha 70% trong suốt cho cùng một kết quả, nên token giữ đúng hình của mockup.
- Hai token có giá trị đặc ở `prefers-contrast: more` để đạt 3:1 (§4.4). Đây là quy tắc ngoài mockup, chỉ có hiệu lực khi người dùng bật tuỳ chọn.

**Quy tắc hiệu năng** (bổ sung danh sách `backdrop-filter` của spec giai đoạn 2 §4.2): thêm **bong bóng giá trị của Slider**, vì mockup S3 vẽ nó là một `Surface` kính. Popup lịch của DatePicker và listbox của Combobox thuộc nhóm "nội dung của Popover, menu và listbox" đã có.

### 4.3 Kích thước và giao diện từng component

**Slider (S3, chủ dự án chọn 2026-11-02):**

- **Vùng điều khiển:** cao 20px, rộng hết chỗ, lùi vào 10px ở mỗi bên để núm ở hai đầu không tràn ra.
- **Rãnh:** cao 4px, bo `--flg-radius-full`, nền `--flg-control-track`, căn giữa theo chiều dọc.
- **Phần đã chọn:** cao 4px, bo `--flg-radius-full`, nền `--flg-accent-gradient`. Một núm: từ `min` tới núm. Khoảng: giữa hai núm.
- **Núm:** tròn 16px, nền `--flg-control-thumb` (trắng, như núm Switch), bóng `0 1px 3px rgba(0,0,0,.3)`. Tâm núm nằm đúng vị trí giá trị.
- **Bong bóng giá trị:** luôn hiện phía trên mỗi núm khi slider không bị disabled.
  - Là một `Surface` (kính): cao 24px, padding 0 8px, bo `--flg-radius-md`.
  - Chữ `--flg-text-xs`, đậm `--flg-weight-medium`, màu `--flg-text`, không xuống dòng.
  - Căn giữa theo núm; mép dưới cách đỉnh núm 6px. Ở hai đầu slider, bong bóng vẫn căn giữa theo núm và có thể nhô ra ngoài vùng 10px (Claude chốt).
  - Nội dung là `getValueText(value)`, không có thì là số (§6.3).
  - Hai bong bóng của slider khoảng có thể chồng lên nhau khi hai núm gần nhau; bong bóng của núm đang focus hoặc đang kéo nằm trên (Claude chốt).
- **Chỗ chừa cho bong bóng:** 30px phía trên vùng điều khiển (24px bong bóng + 6px khoảng cách), có sẵn từ HTML của server, để bong bóng không đè lên nhãn.
- **Vạch chia:**
  - Chấm tròn 4px, màu `--flg-slider-tick` (§4.2), mỗi chấm ở vị trí của một bước, kể cả `min` và `max`.
  - Mép trên của chấm cách tâm rãnh 9px.
  - Slider có vạch chia chừa thêm 10px phía dưới.
  - Tự hiện khi slider có ít vị trí: `(max − min) / step ≤ 10`. Prop `ticks?: boolean` ép bật hoặc tắt (Claude chốt).
- **Focus:** đặt lên núm: `outline` như vòng focus chung, cùng `box-shadow: 0 1px 3px rgba(0,0,0,.3), var(--flg-focus-ring)`.
- **Disabled:** cả slider `opacity: .5`. Đúng như mockup S3, slider disabled không có bong bóng và không chừa 30px phía trên.
- **Không có `size`** (Claude chốt). Mockup S3 chỉ vẽ một cỡ; bản quyết định ban đầu có `size: 'sm' | 'md'`. Thêm cỡ sau này không phá vỡ gì.
- **Giá trị ở bên phải hàng nhãn** (ví dụ "60%", "20 – 75 triệu", "3 / 5" trong mockup) đặt qua ô `aside` của `Field` (§3.2; chủ dự án chọn B, 2026-11-02):
  - Slider không tự vẽ chữ này: chữ đó khác chữ của bong bóng (có đơn vị, có "/ 5"), nên lib không suy ra được.
  - Story và docs truyền nó vào `aside` với `aria-hidden="true"`: giá trị đã đến screen reader qua `aria-valuetext`.

**NumberInput (N2, chủ dự án chọn 2026-11-02):**

- **Khung:** khung của `Input` (cùng token kích thước, viền, nền; `size` `sm`/`md`/`lg`), padding 0, khoảng cách 0.
- **Nút − ở đầu trái, nút + ở đầu phải,** bên trong khung:
  - Rộng 32px ở mọi `size`, cao bằng khung.
  - Icon 16px (− và +), màu `--flg-text-muted`.
  - Ngăn với ô chữ bằng đường kẻ 1px `--flg-control-border` (nút − kẻ bên phải, nút + kẻ bên trái).
  - Góc phía ngoài bo `calc(var(--flg-radius-md) - 1px)`, khớp góc trong của khung.
  - Disabled (chạm giới hạn, hoặc cả control disabled hay chỉ đọc): `opacity: .4`.
  - Hover (ngoài mockup): nền `--flg-control-track`, như Button `ghost` (Claude chốt).
- **Ô chữ:** padding 0 11px, số căn giữa, `font-variant-numeric: tabular-nums`.
- **Focus và lỗi:** như `Input` (viền nhấn và ring trên khung; khi lỗi viền giữ màu danger).

**SegmentedControl (G1, chủ dự án chọn 2026-11-02):** đúng kiểu Tabs `segmented` đã duyệt (mockup T2, spec giai đoạn 2 §4.3).

- **Rãnh:** nền `--flg-control-track`, padding 3px, bo `--flg-radius-md`, rộng theo nội dung.
- Khi báo lỗi (`data-invalid`): viền trong 1px `--flg-danger` quanh rãnh, như viền đỏ của Input (chủ dự án chọn 2B, 2026-11-02).
- **Đoạn:**
  - `md` (mặc định): cao 28px, padding 0 14px, chữ `--flg-text-sm`. Cả control cao 34px, bằng `--flg-control-h-md`.
  - `sm`: cao 22px, padding 0 10px, chữ `--flg-text-xs`. Cả control cao 28px.
  - Chữ đậm `--flg-weight-medium`, màu `--flg-text-muted`, không xuống dòng.
  - Icon và chữ cách nhau 6px.
  - Bo `calc(var(--flg-radius-md) - 3px)`.
- **Đoạn đang chọn:** nền `--flg-control-bg`, bóng `0 1px 3px rgba(0,0,0,.12)`, chữ `--flg-text`.
- **Đoạn disabled:** `opacity: .45`.
- **Focus:** ring trên đoạn; đoạn đang chọn giữ bóng của nó: `box-shadow: 0 1px 3px rgba(0,0,0,.12), var(--flg-focus-ring)`.
- **`fullWidth`** (ngoài mockup): rộng 100%, các đoạn chia đều (Claude chốt).
- **Không có `lg`:** mockup vẽ `md` và `sm` (Claude chốt).

**Combobox (C1, chủ dự án chọn 2026-11-02):**

- **Khung:** như trigger của Select: khung của `Input` (`size` `sm`/`md`/`lg`), chevron 15px màu `--flg-text-muted` ở cuối, đặt trong `flg-input-adornment`.
- **Focus:** như `Input`. Khi listbox đang mở, khung có viền nhấn và ring, như Select khi mở.
- **Listbox:** đúng listbox của Select (spec giai đoạn 2 §4.3, "Menu … và listbox của Select"): panel `Surface`, padding 4px, item cao 30px, item đang được trỏ dùng `--flg-highlight-*`.
- **Option khi đang lọc:**
  - Chữ của option màu `--flg-text-muted`.
  - Phần khớp với chữ đang gõ đậm `--flg-weight-semibold`, màu `--flg-text`.
  - Option đang được trỏ: mọi chữ màu `--flg-highlight-text`; phần khớp vẫn đậm.
- **Option khi không lọc** (mở mà chưa gõ gì, §6.3): chữ `--flg-text`, như option của Select, vì không có phần khớp nào để làm nổi (Claude chốt).
- **Không có cột icon** ở đầu option và không có dấu check, đúng mockup C1. Option đang chọn chỉ mang `aria-selected` (Claude chốt; xem §4.5 cho forced colors).
- **Dòng trạng thái** ("No results", "Loading…"): cao 40px, chữ căn giữa, `--flg-text-sm` màu `--flg-text-muted`.
- **Không có nút xoá** (Claude chốt). Mockup C1 không vẽ; nút × chỉ có ở C2. Bản quyết định ban đầu có `labels.clear`; spec bỏ nó. Người dùng xoá giá trị bằng cách xoá hết chữ rồi rời ô (§6.3).

**TagInput (Ta1, chủ dự án chọn 2026-11-02):**

- **Khung:** khung của `Input`, cao theo nội dung, tối thiểu bằng chiều cao control; chip và ô gõ xếp chung một hàng, tự xuống dòng (`flex-wrap`), cách nhau 4px, `align-content: center`, padding 4px 8px, con trỏ `text`.
- **Chip:** `Badge` `neutral`, như thẻ của Select chọn nhiều (M1), padding `3px 4px 3px 8px`, chứa chữ của thẻ và nút xoá.
- **Nút xoá:** 14×14px, bo `--flg-radius-full`, icon × 10px, màu theo chữ của chip, `opacity: .75`. Khi focus: `opacity: 1`, vòng focus chung với `outline-offset: 1px`.
- **Ô gõ:** chiếm phần còn lại của hàng, rộng tối thiểu 70px, cao 22px, không viền, placeholder màu `--flg-text-muted`.
- **Focus ô gõ:** viền nhấn và ring trên khung, như `Input`.
- **Disabled:** cả khung `opacity: .5`, `cursor: not-allowed`.
- **Lỗi:** viền danger như `Input`.
- **`size`** (ngoài mockup, mockup chỉ vẽ `md`): chip và ô gõ giữ nguyên ở mọi cỡ; chiều cao tối thiểu theo `--flg-control-h-*`; `sm` dùng padding dọc 2px để khung vẫn cao 28px: ô gõ cao 22px cộng viền 2px đã là 24px, nên 3px sẽ ra 30px (Claude chốt; phát hiện khi lập Plan B: bản đầu ghi 3px).

**Calendar (K1, chủ dự án chọn 2026-11-02):**

- **Rộng 252px:** bảy cột 36px.
- **Hàng tiêu đề:** cao 34px, cách lưới 4px.
  - Tên tháng và năm lệch trái, `--flg-text-sm` đậm `--flg-weight-semibold`.
  - Hai `IconButton` `ghost` `sm` (28×28px) ở bên phải, cách nhau 4px, chevron 16px (không phải 14px của `sm`, như nút của Pagination).
- **Hàng thứ:** cao 26px, chữ `--flg-text-xs` đậm `--flg-weight-medium`, màu `--flg-text-muted`.
- **Ô ngày:** 36×36px; nút ngày tròn 36px, chữ `--flg-text-sm` đậm `--flg-weight-regular`, màu `--flg-text`.
- **Hover:** nền `--flg-control-track`.
- **Hôm nay:** viền trong 1px `--flg-accent-solid` (`box-shadow: inset 0 0 0 1px`).
- **Ngày đang chọn:** nền `--flg-accent-gradient`, chữ `--flg-on-accent` đậm `--flg-weight-semibold`, không có viền "hôm nay".
- **Khoảng:**
  - Ô ở giữa khoảng: cả ô 36px nền `--flg-accent-subtle`, chữ `--flg-accent-text`.
  - Ngày đầu và ngày cuối: hình tròn của ngày đang chọn, nằm trên nửa dải (ngày đầu: nửa phải; ngày cuối: nửa trái).
  - Ô của khoảng ở cột đầu hàng bo tròn bên trái, ở cột cuối hàng bo tròn bên phải (`--flg-radius-full`).
  - Dải xem trước khi đang chọn khoảng (§6.3) dùng cùng kiểu (Claude chốt).
  - Dải được vẽ ở một lớp riêng dưới hình tròn (`::before` của ô), bằng `--flg-selected-bg` và `--flg-selected-text`. Ở chế độ mặc định hai token này bằng `--flg-accent-subtle` và `--flg-accent-text`, nên dải đúng như mockup; ở `prefers-contrast: more` chúng đã đổi sẵn (§4.4). Lý do: `--flg-accent-subtle` của theme sáng là một gradient, không đặt được vào `linear-gradient` nửa ô như mockup vẽ ở ngày đầu và ngày cuối (phát hiện khi lập Plan C).
- **Ngày của tháng trước và tháng sau:** vẫn hiện trong lưới 6×7, màu `--flg-text-muted`, `opacity: .5`.
- **Ngày không chọn được:** màu `--flg-text-muted`, `opacity: .45`, gạch ngang, `cursor: not-allowed`.
- **Focus:** vòng focus chung trên nút ngày (tròn).

**DatePicker (D1, chủ dự án chọn 2026-11-02):**

- **Khung:** khung của `Input` (`size` `sm`/`md`/`lg`), gõ được ngày.
- **Nút lịch:** ở mép phải trong khung, 24×24px ở mọi `size`, bo `--flg-radius-xs`, icon lịch 16px màu `--flg-text-muted`.
- **Khi lịch mở:** khung có viền nhấn và ring, như Select khi mở.
- **Lỗi:** viền `--flg-danger`; lời báo lỗi ở chỗ lỗi của Field (§3.2).
- **Popup:** `Surface`, rộng 278px, padding 12px, bo `--flg-radius-md`, cách khung 6px, chứa Calendar K1.
- **Placeholder:** mẫu ngày của locale, ví dụ `mm/dd/yyyy` (en-US), `dd/mm/yyyy` (vi-VN), màu `--flg-text-muted` (§6.3).

**FileUpload (F1, chủ dự án chọn 2026-11-02):**

- **Vùng thả:**
  - Cao tối thiểu 140px, các phần xếp dọc, căn giữa, cách nhau 6px, padding 16px, chữ căn giữa.
  - Viền 1.5px đứt nét `--flg-dropzone-border` (§4.2), bo `--flg-radius-lg`, nền `--flg-control-bg-secondary`.
  - Màu viền và nền chuyển trong `--flg-duration-fast` với `--flg-ease`.
  - Khi danh sách có ít nhất một dòng: cao tối thiểu 0, padding 12px.
- **Icon tải lên:** 24px, màu `--flg-text-muted`.
- **Lời nhắc:** `--flg-text-sm` màu `--flg-text`, kết thúc bằng nút chọn tệp dạng link: đậm `--flg-weight-semibold`, màu `--flg-accent-text`, gạch chân cách chữ 2px, bo `--flg-radius-xs`.
- **Dòng gợi ý** (prop `hint`, ví dụ "PDF, PNG · up to 10 MB each · up to 3 files"): `--flg-text-xs` màu `--flg-text-muted`.
- **Khi đang kéo tệp qua:** viền `--flg-accent-solid`, nền `--flg-accent-subtle`, icon màu `--flg-accent-text`, lời nhắc thay bằng `labels.dropHere` ("Drop files to upload") đậm `--flg-weight-semibold`.
- **Focus:** vòng focus chung trên nút chọn tệp (§6.3 nói phần tử nào thật sự nhận focus).
- **Disabled:** cả vùng thả `opacity: .5`, `cursor: not-allowed`.
- **Danh sách tệp:** nằm dưới vùng thả, cách 4px (đúng khoảng cách mockup vẽ); các dòng cách nhau 6px.
- **Dòng tệp:**
  - Bố cục ngang, khoảng cách 10px, padding `6px 6px 6px 10px`, viền 1px `--flg-control-border`, bo `--flg-radius-md`, nền `--flg-control-bg`.
  - Icon tệp 16px màu `--flg-text-muted`.
  - Tên tệp `--flg-text-sm` màu `--flg-text`, một dòng, dài thì kết thúc bằng "…".
  - Cỡ tệp `--flg-text-xs` màu `--flg-text-muted`, dưới tên.
  - Nút xoá: `IconButton` `ghost` `sm`, icon × 14px.
- **Dòng bị từ chối:** viền `--flg-danger`; tên và icon màu `--flg-danger`; thay cho cỡ tệp là lời báo lỗi `--flg-text-xs` đậm `--flg-weight-medium` màu `--flg-danger`.

### 4.4 Tương phản (bổ sung cho §4.9 của spec 0+1)

`scripts/check-contrast.ts` đo thêm các cặp sau, trên kính thường và trên panel phủ lớp tối (spec giai đoạn 2 §4.4), lấy số thấp hơn. Plan làm component nào đo cặp của component đó.

**Cặp mới:**

| Check | Cặp | Ngưỡng |
|---|---|---|
| `slider-bubble-text` | Chữ `--flg-text` của bong bóng trên kính của bong bóng | 4.5:1 |
| `slider-tick` | Chấm vạch chia `--flg-slider-tick` so với bề mặt | 3:1 |
| `slider-track` | Rãnh `--flg-control-track` so với bề mặt | 3:1 |
| `slider-thumb` | Núm `--flg-control-thumb` so với rãnh và với phần đã chọn | 3:1 |
| `stepper-icon` | Icon −/+ `--flg-text-muted` trên `--flg-control-bg` của khung | 3:1 |
| `combobox-unmatched-text` | Chữ `--flg-text-muted` của option đang lọc trên panel listbox, và dòng trạng thái | 4.5:1 |
| `tag-chip-text` | Chữ `--flg-text` của chip trên `--flg-control-track`, đặt trên `--flg-control-bg` của khung | 4.5:1 |
| `tag-remove-icon` | Icon × (chữ của chip, `opacity: .75`) trên nền chip | 3:1 |
| `calendar-weekday-text` | Chữ `--flg-text-muted` của hàng thứ trên bề mặt | 4.5:1 |
| `calendar-outside-day` | Ngày của tháng khác: `--flg-text-muted` với `opacity: .5`, trên bề mặt | 4.5:1 |
| `date-picker-icon` | Icon lịch `--flg-text-muted` trên `--flg-control-bg` | 3:1 |
| `dropzone-border` | Viền `--flg-dropzone-border` so với bề mặt | 3:1 |
| `dropzone-link` | Chữ `--flg-accent-text` của nút chọn tệp trên `--flg-control-bg-secondary` | 4.5:1 |
| `file-meta-text` | Cỡ tệp `--flg-text-muted` trên `--flg-control-bg` | 4.5:1 |
| `file-error-text` | Lời báo lỗi `--flg-danger` trên `--flg-control-bg` | 4.5:1 |

**Cặp đã có trong §4.9, được mở rộng** (cùng cặp màu, nên cùng số đo):

| Dòng §4.9 | Vị trí mới |
|---|---|
| 1 (viền control so với nền) | Đường kẻ ngăn nút −/+ của NumberInput; viền dòng tệp của FileUpload |
| 4 (chữ trắng trên màu nhấn) | Số của ngày đang chọn trong Calendar (`--flg-on-accent` trên `--flg-accent-gradient`) |
| 5 (màu nhấn của trạng thái đã chọn) | Phần đã chọn của Slider; hình tròn của ngày đang chọn |
| 7 (`--flg-accent-text` trên `--flg-accent-subtle`) | Chữ của ngày trong khoảng; lời nhắc của vùng thả khi đang kéo |
| 8 (nền `--flg-accent-subtle` so với bề mặt) | Dải khoảng của Calendar; nền vùng thả khi đang kéo |
| 12, 13 (tab `segmented`) | SegmentedControl G1, cùng giao diện |
| 14 (`--flg-accent-solid` so với nền) | Viền "hôm nay" 1px của Calendar; viền vùng thả khi đang kéo |

**Không đo:**

- Ngày không chọn được và mọi phần disabled: đó là thành phần giao diện không hoạt động, nằm ngoài tiêu chí 1.4.3 và 1.4.11.
- Nền khi hover (ngày của Calendar, nút −/+): hover không phải cách duy nhất để thấy control.

**Cách xử lý kết quả:** như spec giai đoạn 2 §4.4. Cặp nào dưới ngưỡng mà đúng như mockup thì thành một dòng mới của §4.9, kèm số đo làm tròn xuống, và được nêu trong mô tả PR.

**`prefers-contrast: more`:** mọi cặp mới phải đạt (lớp 4 (b) ở §7, không có ngoại lệ). Ngoài phần token đã có của chế độ này, các quy tắc sau đều ngoài mockup và chỉ có hiệu lực khi người dùng bật tuỳ chọn:

- `--flg-dropzone-border` và `--flg-slider-tick` thành màu đặc (§4.2).
- Ngày của tháng khác bỏ `opacity: .5`.
- Nút xoá của chip bỏ `opacity: .75`.
- Ngày trong khoảng và tiêu đề vùng thả khi đang kéo dùng `--flg-selected-bg` và `--flg-selected-text`, như tab `pill` đang chọn.
- Rãnh và núm của Slider nhận viền 1px `--flg-text`, nếu số đo của `slider-track` hay `slider-thumb` cần (plan A chốt khi đo).

### 4.5 Forced colors

Mọi component mới có quy tắc riêng trong `preferences.css`:

- **Slider:** rãnh viền 1px `CanvasText`; phần đã chọn `Highlight`; núm nền `Canvas` viền 2px `CanvasText`; chấm vạch chia `CanvasText`; bong bóng viền 1px `CanvasText` (như Tooltip).
- **NumberInput:** icon −/+ `ButtonText`, khi disabled `GrayText`; đường kẻ ngăn `CanvasText`.
- **SegmentedControl:** như Tabs `segmented` (spec giai đoạn 2 §4.5): mọi đoạn có sẵn viền `Highlight` khi được chọn, `Canvas` khi không, để đoạn không rộng thêm khi đổi lựa chọn.
- **Combobox:** listbox như của Select. Phần khớp vẫn đậm, nên vẫn thấy được dù màu bị ép. Option đang chọn có thêm dấu check ở cuối dòng chỉ trong chế độ này, vì trạng thái đã chọn phải có dấu hiệu không dựa vào màu nền (spec giai đoạn 2 §4.5) (Claude chốt).
- **TagInput:** chip viền 1px `CanvasText` (nền của Badge bị bỏ); icon × `ButtonText`.
- **Calendar:**
  - Ngày đang chọn: `forced-color-adjust: none`, nền `Highlight`, chữ `HighlightText`.
  - Ngày trong khoảng: viền 1px `Highlight`.
  - Hôm nay: viền trong 1px `CanvasText`, khác vòng focus.
  - Ngày không chọn được: `GrayText`, vẫn gạch ngang.
  - Ngày của tháng khác: `GrayText`, bỏ `opacity`; chúng không phải nút, nên không lẫn với ngày không chọn được, vốn còn gạch ngang (phát hiện khi lập Plan C).
- **DatePicker:** popup viền 1px `CanvasText` (như mọi panel overlay); icon lịch `ButtonText`.
- **FileUpload:** viền đứt nét `CanvasText`, khi đang kéo `Highlight`; dòng bị từ chối giữ viền `CanvasText` và lời báo lỗi bằng chữ (lỗi không chỉ được báo bằng màu).
- **Icon** dùng `currentColor`, màu đặt trên phần tử bọc ngoài chứ không trên `<svg>` (bài học chevron của spec giai đoạn 2 §4.5).

### 4.6 Icon

- **Icon dùng chung** ở `src/internal/icons.tsx` (Claude chốt):
  - `ChevronIcon` với `direction` `"down" | "up" | "left" | "right"`. Select, Accordion, Menu, Breadcrumb và Pagination chuyển sang nó; đường vẽ giữ nguyên, nên ảnh chuẩn visual không đổi.
  - `CloseIcon` (dấu ×). Toaster chuyển sang nó.
  - Mới: `MinusIcon`, `PlusIcon`, `CalendarIcon`, `UploadIcon`, `FileIcon`.
- **Độ dày nét: cần chủ dự án xác nhận** (Claude chốt). Các mockup giai đoạn 3 vẽ icon nét 1.75; icon của lib (`strokeIcon`) và mọi mockup giai đoạn 2 dùng nét 2. Spec giữ nét 2, để chevron của Combobox giống hệt chevron của Select (C1 là "như Select") và icon của hai giai đoạn đồng bộ. Nếu chủ dự án muốn đúng 1.75, chỉ icon của các component giai đoạn 3 đổi theo.

---

## 5. Primitives nội bộ mới

| File | Export | Nhiệm vụ |
|---|---|---|
| `number.ts` | `clamp(value, min, max)`, `decimalsOf(n)`, `snapToStep(value, step, min)`, `stepFrom(value, step, min, direction)`, `formatNumber(value, locale, options?)`, `parseNumber(text, locale, options?)` | Số học an toàn với số thập phân: `snapToStep` làm tròn về lưới `min + k·step` theo số chữ số thập phân lớn nhất của `step` và `min`, nên `0.1 + 0.2` ra `0.3`. `stepFrom` cho giá trị kế tiếp trên lưới theo hướng lên hoặc xuống (từ 7 với bước 5 lên 10, không lên 12). `formatNumber` dùng một `Intl.NumberFormat` lưu sẵn theo `locale` và `options`. `parseNumber` bỏ khoảng trắng (cả NBSP, NNBSP), dấu nhóm của locale, và các phần mà chính formatter đó sinh ra (ký hiệu tiền, `%`, đơn vị, chữ đi kèm); nhận dấu thập phân của locale và dấu trừ `-` hoặc `−`; `style: "percent"` thì chia 100; chữ không đọc được trả `NaN`. Hai hàm nhận `options` để những gì `formatNumber` viết ra thì `parseNumber` đọc lại được (Claude chốt; bản quyết định ban đầu không có `options` ở `parseNumber`) |
| `date.ts` | `isIsoDate`, `isIsoMonth` (kiểm `month` và `defaultMonth` của Calendar; phát hiện khi lập Plan C), `parseIso`, `toIso`, `addDays`, `addMonths`, `addYears`, `compareIso`, `clampIso`, `isSameMonth`, `startOfWeek`, `endOfWeek`, `monthGrid(isoMonth, weekStartsOn)`, `formatMonthYear(isoMonth, locale)`, `weekdayNames(locale, weekStartsOn, width)`, `formatDate(iso, locale, options?)`, `datePattern(locale)`, `parseDate(text, locale)`, `todayIso()` | Hàm thuần trên chuỗi ISO. `addMonths` kẹp ngày: 31/1 cộng một tháng là 28/2 hoặc 29/2. `monthGrid` trả 6 hàng × 7 ô, mỗi ô `{ date, inMonth }`. `weekdayNames` nhận `width` `"short" \| "narrow" \| "long"` (`"long"` thêm cho tên đầy đủ đọc cho screen reader, Claude chốt). `formatDate` mặc định ra dạng số của locale (`11/14/2026`, `14/11/2026`, `14.11.2026`). `datePattern` ra mẫu cho placeholder (`mm/dd/yyyy`). `parseDate` lấy thứ tự ngày, tháng, năm từ `formatToParts` của locale, nhận mọi ký tự không phải chữ số làm dấu ngăn, năm 2 chữ số là 20xx, năm 4 chữ số giữ nguyên; ngày không có thật (31/2) trả `null`. `todayIso` đọc ngày theo giờ máy. Mọi định dạng dùng `timeZone: 'UTC'` (§3.4) |
| `use-form-reset.ts` | `useFormReset(elementRef, onReset)` | Tách từ Select (Plan A). Tìm `form` của phần tử, nghe `reset`, chờ một task, rồi gọi `onReset` nếu reset không bị huỷ. Select, Slider, NumberInput, Combobox, TagInput, FileUpload và DatePicker dùng nó |
| `use-announce.ts` | `useAnnounce()` trả `{ announce(text, { delay? }), region }` | Vùng live của §3.6. `region` là element component tự render (có từ lúc mount). `announce` xoá chữ cũ rồi đặt chữ mới ở task sau, để cùng một câu nói lại vẫn được đọc. `delay` gộp các lần gọi liên tiếp (Combobox dùng 500ms khi đang gõ) |
| `field-context.tsx` (mở rộng) | `useControlError(message)` | Kênh lỗi của §3.2. Trong Field: báo `message` lên Field trong một effect (về `null` khi unmount); Field giữ nó trong state và hiện nó khi người dùng không truyền `error`. Ngoài Field: trả `{ id, message }` để control tự render `<p class="flg-field-error">` và nối `id` vào `aria-describedby` |
| `list-rows.ts` | `readRows(children, { item, group, separator, owner })`, `textOf(node)`, kiểu `Option`, `Row` | Chuyển từ `select/select-rows.ts` (Plan B). Đọc item, nhóm và đường phân cách từ `children` qua `collectChildren`, với tên phần và tên component (cho cảnh báo dev) truyền vào. Select và Combobox dùng chung |
| `icons.tsx` (mở rộng) | Như §4.6 | |

**Helper riêng của component** (nằm trong thư mục của component, như `pagination-range.ts` ở giai đoạn 2; chuyển vào `src/internal/` khi có component thứ hai cần):

| File | Nhiệm vụ |
|---|---|
| `slider/use-pointer-drag.ts` | Kéo bằng con trỏ: `setPointerCapture`, giá trị tính từ toạ độ x trong rãnh, kết thúc ở `pointerup`, `pointercancel` và `lostpointercapture`, chặn bôi đen chữ trong lúc kéo. Bản quyết định ban đầu cho phép để nó trong Slider nếu chỉ Slider dùng |
| `number-input/use-press-repeat.ts` | Nhấn giữ: bước một lần ngay khi nhấn, rồi sau 400ms lặp mỗi 60ms, dừng ở `pointerup`, `pointercancel`, `pointerleave` hoặc khi chạm giới hạn |
| `combobox/match.ts` | Chuẩn hoá để so khớp và tìm đoạn khớp (§6.3, Combobox) |
| `tag-input/split-tags.ts` | Tách chữ dán vào theo `separators`, bỏ khoảng trắng hai đầu, bỏ phần rỗng |
| `file-upload/accept.ts` | `matchesAccept(file, accept)` theo đúng luật của `accept` gốc (kiểu MIME, `image/*`, đuôi `.pdf`; tệp kéo thả có `type` rỗng thì xét đuôi), `formatFileSize(bytes, locale)` |

**Primitives của giai đoạn 1 và 2 được dùng lại:**

- `useControllableState`: mọi giá trị, `inputValue`, `month` và trạng thái mở.
- `usePopoverState`, `useTriggerPress`, `usePopover`, `useFloating`: listbox của Combobox, lịch của DatePicker.
- `focus.ts` (`returnFocus`, `registerPopoverReturn`): trả focus khi popup đóng.
- `collectChildren`, `markPart`: item của Combobox (qua `list-rows.ts`).
- `useWriteOnCommit`: handler đọc giá trị của lần commit gần nhất (kéo Slider, lặp của nút −/+, phím của Combobox).
- `useRequireName`: Slider, SegmentedControl (với `otherName` là nhãn của Field).
- `useFieldProps`, `markAsFieldControl`, `markAsFieldGroup`: §3.2.
- `useIsoLayoutEffect`, `composeEventHandlers`, `mergeRefs`, `dataAttr`, `devWarn`.
- `roving.ts` (`hasModifier`): phím có kèm Alt, Ctrl hoặc Meta được để cho trình duyệt ở Slider, Calendar, TagInput. Điều hướng hai chiều của Calendar là phép tính ngày, không dùng `getNextIndex`.

**Cảnh báo dev mới:**

- Slider:
  - Thiếu tên: không có `aria-label`, `aria-labelledby`, cũng không nằm trong Field có nhãn.
  - `min` không nhỏ hơn `max`; `step` không phải số dương hữu hạn (dùng 1).
  - Giá trị khoảng không phải mảng hai số, hoặc số đầu lớn hơn số sau (lib đổi chỗ).
  - Giá trị đổi giữa số và mảng trong vòng đời component.
- NumberInput: `min` lớn hơn `max`; `step` không phải số dương hữu hạn.
- SegmentedControl: thiếu tên; `SegmentedControlItem` nằm ngoài `SegmentedControl`; hai item cùng `value`.
- Combobox:
  - Có con không phải `ComboboxItem`, `ComboboxGroup` hay `ComboboxSeparator`.
  - `ComboboxItem` có `value` rỗng hoặc không phải chuỗi.
  - Giá trị không khớp item nào, khi không có `allowCustomValue`.
  - Một phần của Combobox được render ngoài `Combobox`.
- TagInput: `separators` có phần tử dài hơn một ký tự mà không phải `"Enter"`; `value` có thẻ trùng khi `allowDuplicates` tắt.
- FileUpload: `value` có phần tử không phải `File`; `multiple={false}` mà `value` có hơn một tệp.
- Calendar và DatePicker: chuỗi ISO sai ở `value`, `defaultValue`, `min`, `max`, `month`, `today`; `min` sau `max`; khoảng có ngày đầu sau ngày cuối (lib đổi chỗ).
- Một component đổi giữa controlled và uncontrolled. Tên trong cảnh báo nêu prop: `Combobox value`, `Combobox inputValue`, `Combobox open`, `TagInput value`, `TagInput inputValue`, `Calendar value`, `Calendar month`, `DatePicker value`, `DatePicker open`…

---

## 6. Component giai đoạn 3

### 6.1 Quy ước API chung (bổ sung cho §6.1 của spec 0+1 và spec giai đoạn 2)

- **Giá trị:** `value`, `defaultValue`, `onValueChange(value)`, như giai đoạn 2. Chữ trong ô nhập của Combobox và TagInput: `inputValue`, `defaultInputValue`, `onInputValueChange(text)`.
- **`labels`:** mọi chữ mặc định (tiếng Anh) nằm trong một prop `labels`, ghi đè được từng khoá. Khoá nào cần chèn giá trị là một hàm, ví dụ `remove: (tag) => \`Remove ${tag}\``. Như Toaster.
- **`ref`** trỏ vào phần tử nhận focus chính: ô nhập của NumberInput, Combobox, TagInput, DatePicker; `<input type="file">` của FileUpload; phần tử gốc của Slider, SegmentedControl, Calendar. Đây là quy tắc của control dựa trên input ở spec 0+1 §6.1.
- **`className` và `style`** gắn vào phần tử gốc (bọc ngoài) của mọi component.
- **`id`** và các prop `aria-*` gắn vào phần tử mà nhãn của Field trỏ tới (§3.2). Với Slider và SegmentedControl, đó là phần tử nhóm hoặc núm (§6.3).
- **`size`:** các control dùng khung của `Input` nhận `"sm" | "md" | "lg"`, mặc định `"md"`. SegmentedControl nhận `"sm" | "md"`. Slider, Calendar và FileUpload không có `size` (§4.3).
- **`disabled`** dùng `disabled` gốc ở mọi chỗ có phần tử gốc. Riêng nút trước/sau tháng của Calendar dùng `aria-disabled` (§6.3).
- **Mỗi component export kiểu props của nó** (`SliderProps`, `ComboboxItemProps`, `FileRejection`…).

### 6.2 Phân loại client và server

Như §3.7: mọi component mới là client.

### 6.3 Đặc tả từng component

**`Slider`**

```ts
type SliderValue = number | [number, number];
type SliderProps<V extends SliderValue = number> =
  Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
    value?: V; defaultValue?: V;
    onValueChange?: (value: V) => void;
    onValueCommit?: (value: V) => void;
    min?: number; max?: number; step?: number; largeStep?: number;
    disabled?: boolean; invalid?: boolean; name?: string; ticks?: boolean;
    getValueText?: (value: number) => string;
    labels?: { minimum?: string; maximum?: string };
  };
```

- **Mặc định:** `min=0`, `max=100`, `step=1`, `largeStep` là bội của `step` gần với 10% của `max − min` nhất, ít nhất bằng `step` (Claude chốt), `labels={ minimum: "Minimum", maximum: "Maximum" }`.
- **Một núm hay khoảng** quyết định bởi `value` hoặc `defaultValue`: số là một núm, mảng `[number, number]` là khoảng.
  - `Slider` có kiểu generic: `V` suy ra từ `value` hoặc `defaultValue`, nên `onValueChange` của slider khoảng nhận đúng một tuple (Claude chốt). Không có cả hai thì là một núm.
- **Cấu trúc:**

  ```html
  <div class="flg-slider" data-range data-ticks data-disabled role="group" aria-labelledby>  <!-- role chỉ khi là khoảng -->
    <div class="flg-slider-control" style="--flg-slider-start: 20%; --flg-slider-end: 75%">
      <span class="flg-slider-track" aria-hidden="true"></span>
      <span class="flg-slider-fill" aria-hidden="true"></span>
      <span class="flg-slider-ticks" aria-hidden="true"><i style="left: 0%"></i>…</span>
      <span role="slider" tabindex="0" class="flg-slider-thumb"
            aria-valuemin aria-valuemax aria-valuenow aria-valuetext aria-orientation="horizontal"
            aria-label aria-labelledby aria-describedby aria-invalid aria-disabled>
        <span class="flg-surface flg-slider-bubble" aria-hidden="true">20</span>
      </span>
      …
    </div>
    <input type="hidden" name value="20" /> …
  </div>
  ```

  - Vị trí của núm và phần đã chọn đặt bằng custom property trong `style`, nên HTML từ server đã đúng chỗ trước khi hydrate.
  - Một núm: `aria-label`, `aria-labelledby` (hoặc nhãn của Field) và `id` gắn vào núm.
  - Khoảng: phần tử gốc mang `role="group"` và tên (`aria-label`, `aria-labelledby` hoặc nhãn của Field). Mỗi núm có `aria-label` là `labels.minimum` hoặc `labels.maximum`.
  - `ref` trỏ vào phần tử gốc.
- **ARIA của núm** (mẫu APG slider và multi-thumb slider):
  - `aria-valuetext` là `getValueText(value)`; không có thì không đặt (screen reader đọc `aria-valuenow`).
  - Khoảng: `aria-valuemax` của núm nhỏ là giá trị của núm lớn, `aria-valuemin` của núm lớn là giá trị của núm nhỏ.
  - `aria-orientation="horizontal"`.
  - Disabled: núm có `aria-disabled="true"` và không có `tabIndex`, nên không nhận focus, như control gốc bị `disabled`. Input ẩn có `disabled`.
- **Bàn phím** (trên núm đang focus):
  - ← và ↓: giảm một `step`. → và ↑: tăng một `step`.
  - PageDown và PageUp: giảm và tăng một `largeStep`.
  - Home và End: về giới hạn dưới và trên của núm đó. Với khoảng, giới hạn của mỗi núm là núm kia.
  - Giá trị luôn nằm trên lưới `min + k·step` và trong `[min, max]`.
  - Phím có kèm Alt, Ctrl hoặc Meta được để cho trình duyệt.
- **Con trỏ:**
  - Nhấn lên rãnh thì núm gần điểm nhấn nhất nhảy tới đó, và kéo tiếp được.
  - Nhấn lên núm thì giữ khoảng lệch giữa con trỏ và tâm núm, nên giá trị không nhảy (Claude chốt).
  - Hai núm của khoảng không vượt qua nhau: chúng dừng ở giá trị của núm kia (bằng nhau được).
  - Hai núm trùng giá trị: núm được kéo chọn theo hướng di chuyển đầu tiên (Claude chốt).
  - Nhấn thì focus núm (`preventScroll`), để bàn phím tiếp tục từ đó; vòng focus không hiện vì không phải focus bàn phím.
  - Khi đang kéo, nội dung không bị bôi đen.
- **Cảm ứng** (Claude chốt): núm có `touch-action: none`; rãnh có `touch-action: pan-y`. Bản quyết định ban đầu đặt `none` cho cả rãnh. Nhưng một slider rộng hết màn hình điện thoại khi đó chặn cuộn dọc mỗi lần ngón tay chạm vào rãnh; `pan-y` để trình duyệt cuộn dọc và giao chuyển động ngang cho slider.
- **`onValueChange`** được gọi mỗi khi giá trị đổi (từng bước khi kéo). **`onValueCommit`** được gọi một lần cuối mỗi lần kéo (ở `pointerup`, nếu giá trị đã đổi) và sau mỗi phím làm đổi giá trị.
- **Vạch chia, bong bóng:** như §4.3. Bong bóng hiện `getValueText(value)`, không có thì `String(value)`.
- **Form, Field:** §3.1, §3.2. `required` của Field không áp dụng. `invalid` chỉ đặt `aria-invalid` trên núm; mockup không vẽ trạng thái lỗi cho slider (Claude chốt).

**`NumberInput`**

```ts
Omit<InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "size" | "min" | "max" | "step"> & {
  value?: number | null; defaultValue?: number; onValueChange?: (value: number | null) => void;
  min?: number; max?: number; step?: number; largeStep?: number;
  locale?: string; formatOptions?: Intl.NumberFormatOptions; allowWheel?: boolean;
  size?: "sm" | "md" | "lg"; invalid?: boolean;
  labels?: { increment?: string; decrement?: string };
}
```

- **Mặc định:** `step=1`, `largeStep=10 × step`, `locale="en-US"`, `allowWheel=false`, `labels={ increment: "Increase", decrement: "Decrease" }`.
- **Cấu trúc:**

  ```html
  <div class="flg-input flg-number-input" data-size data-invalid data-disabled>
    <button type="button" tabindex="-1" aria-label="Decrease">−</button>
    <input type="text" role="spinbutton" inputmode
           aria-valuenow aria-valuemin aria-valuemax aria-valuetext autocomplete="off" />
    <button type="button" tabindex="-1" aria-label="Increase">+</button>
    <input type="hidden" name value />
  </div>
  ```

  - `ref`, `id`, `required`, `readOnly`, `aria-*` và các prop HTML còn lại gắn vào ô hiển thị. `name` gắn vào input ẩn.
  - `onChange`, `onKeyDown`, `onBlur` gốc của người dùng chạy trước handler của lib (`composeEventHandlers`). `onChange` gốc nhận từng lần gõ; `onValueChange` chỉ nhận giá trị đã chốt.
- **ARIA:** `role="spinbutton"` trên ô `type="text"` (ARIA in HTML cho phép). `aria-valuenow` chỉ có khi giá trị khác `null`. `aria-valuemin`, `aria-valuemax` khi có `min`, `max`. `aria-valuetext` là chữ đã định dạng.
- **`inputmode`** (Claude chốt): `"decimal"` khi `min` không âm; `"text"` khi không có `min` hoặc `min` âm. Bản quyết định ban đầu luôn dùng `"decimal"`. Nhưng bàn phím `decimal` của iOS không có dấu trừ, nên người dùng iPhone không gõ được số âm.
- **Gõ:**
  - Gõ tự do, không chặn ký tự.
  - Khi rời ô (`blur`) và khi Enter: chữ được đọc (`parseNumber`), kẹp vào `[min, max]`, làm tròn về lưới `step`, rồi định dạng lại.
  - Ô trống thì giá trị là `null`.
  - Chữ không đọc được thì chữ trở về giá trị cũ đã định dạng; giá trị không đổi.
  - Enter chốt giá trị rồi để form gửi như thường (không `preventDefault`).
- **Bàn phím:**
  - ↑ và ↓: lên và xuống một bước trên lưới (`stepFrom`).
  - PageUp và PageDown: một `largeStep`.
  - Home và End: về `min` và `max`, chỉ khi có; nếu không, phím đó di chuyển con trỏ chữ như thường.
  - Từ `null`, bước lên cho `min` (không có thì 0), bước xuống cho `max` (không có thì 0), kẹp vào khoảng (Claude chốt).
  - Chữ đang gõ dở được chốt trước khi bước (Claude chốt).
  - Phím có kèm Alt, Ctrl hoặc Meta được để cho trình duyệt.
- **Nút −/+:**
  - `tabIndex={-1}`, có nhãn từ `labels`; bàn phím đã có ↑/↓.
  - Disabled khi giá trị chạm giới hạn, khi control disabled hoặc chỉ đọc.
  - Nhấn giữ thì lặp (`use-press-repeat.ts`: 400ms rồi mỗi 60ms).
  - Nhấn không lấy focus (`preventDefault` ở `pointerdown`); focus ở đâu vẫn ở đó (Claude chốt).
  - Có `-webkit-touch-callout: none` và `user-select: none`, để nhấn giữ trên iOS không mở menu hệ thống.
- **Con lăn chuột:** chỉ khi `allowWheel` và ô đang có focus: lăn lên tăng một bước, lăn xuống giảm một bước, và trang không cuộn (listener không passive).
- **Định dạng:** `formatNumber(value, locale, formatOptions)`. Không có `formatOptions` thì `maximumFractionDigits` là số lớn nhất trong 3, số chữ số thập phân của `step` và của `min` (gốc của lưới) (Claude chốt).
- **Form, Field:** §3.1, §3.2. `readOnly` chặn gõ, phím bước, con lăn và nút −/+.

**`SegmentedControl`** và **`SegmentedControlItem`**

```ts
SegmentedControlProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: string | null; defaultValue?: string; onValueChange?: (value: string) => void;
  name?: string; disabled?: boolean; required?: boolean; invalid?: boolean;
  size?: "sm" | "md"; fullWidth?: boolean;
};
SegmentedControlItemProps = Omit<InputHTMLAttributes<HTMLInputElement>,
  "type" | "name" | "value" | "checked" | "defaultChecked"> & { value: string; children: ReactNode };
```

- **Cấu trúc** (radio gốc, theo nguyên tắc native-first của spec 0+1 §5):

  ```html
  <div role="radiogroup" class="flg-segmented" data-size data-full-width aria-labelledby aria-required aria-invalid>
    <label class="flg-segmented-item">
      <input type="radio" class="flg-segmented-input" name value />
      <span class="flg-segmented-label">{children}</span>
    </label>
    …
  </div>
  ```

  - **Radio gốc phủ trùng lên đoạn với `opacity: 0`,** như Checkbox, Radio và Switch ở giai đoạn 1 (`toggle.css`), không bị ẩn bằng `flg-visually-hidden` (Claude chốt). Bản quyết định ban đầu nói "ẩn khỏi mắt". Nhưng quy tắc native-first của spec 0+1 §5 giữ input gốc trùng lên phần hình ảnh: bong bóng validation của `required` hiện đúng ở đoạn, khung focus của screen reader nằm đúng chỗ, và mọi cú bấm trúng radio thật.
  - `SegmentedControlItem` là component render thật (như `Radio`), đọc `name`, `value` và `disabled` của nhóm qua context, không qua `collectChildren` (Claude chốt). `ref` của item trỏ vào radio.
  - `ref` của `SegmentedControl` trỏ vào phần tử `radiogroup`.
  - `name` tự sinh bằng `useId` khi người dùng không truyền, như RadioGroup.
- **Giá trị:** controlled thì `checked={value === item.value}`; uncontrolled thì `defaultChecked`. CSS đọc trạng thái chọn qua `:has(> input:checked)`, nên HTML từ server đã đúng.
- **Bàn phím:** hoàn toàn của trình duyệt: Tab vào radio đang chọn, các phím mũi tên di chuyển và chọn, bỏ qua radio disabled. Lib không tự viết roving.
- **Focus:** vòng focus hiện trên đoạn khi radio khớp `:focus-visible`.
- **Bố cục:** rộng theo nội dung; `fullWidth` thì rộng 100% và các đoạn chia đều (Claude chốt, theo bản quyết định ban đầu). Chữ trong đoạn không xuống dòng; một nhóm rộng hơn chỗ chứa thì tràn ra. Docs khuyên dùng ít lựa chọn ngắn.
- **Field:** §3.2; như RadioGroup.
- **Docs ghi rõ** khi nào dùng SegmentedControl (chọn một giá trị trong form, ngữ nghĩa radio) và khi nào dùng Tabs `segmented` (chuyển panel nội dung).

**`Combobox`**

```ts
type ComboboxProps = {
  value?: string | null; defaultValue?: string; onValueChange?: (value: string | null) => void;
  inputValue?: string; defaultInputValue?: string; onInputValueChange?: (text: string) => void;
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  filter?: ((item: { value: string; textValue: string }, inputValue: string) => boolean) | false;
  allowCustomValue?: boolean; loading?: boolean;
  placeholder?: string; disabled?: boolean; required?: boolean; invalid?: boolean;
  name?: string; size?: "sm" | "md" | "lg";
  id?: string; className?: string; style?: CSSProperties;
  "aria-label"?: string; "aria-labelledby"?: string; "aria-describedby"?: string;
  labels?: { noResults?: string; loading?: string; results?: (count: number) => string };
  children: ReactNode;
};
ComboboxItemProps = { value: string; textValue?: string; disabled?: boolean; children?: ReactNode };
ComboboxGroupProps = { label: ReactNode; children?: ReactNode };
ComboboxSeparatorProps = Record<string, never>;
```

- **Mặc định:** `allowCustomValue=false`, `labels={ noResults: "No results", loading: "Loading…", results: (n) => n === 1 ? "1 result" : \`${n} results\` }`. `results` là khoá mới, cho câu "5 results" mà bản quyết định ban đầu đã nói tới (Claude chốt).
- **Cấu trúc:**

  ```html
  <div class="flg-combobox" data-size data-invalid data-disabled>
    <div class="flg-input">
      <input type="text" role="combobox" aria-autocomplete="list" aria-expanded aria-controls
             aria-activedescendant autocomplete="off" />
      <span class="flg-input-adornment" aria-hidden="true"><!-- chevron --></span>
    </div>
    <select class="flg-select-native" aria-hidden="true" tabindex="-1" name required disabled>
      <option value=""></option><option value="hn" selected>Hà Nội</option>
    </select>
    <div popover="auto" role="listbox" class="flg-surface flg-menu flg-select-listbox">
      <div role="option" aria-selected data-highlighted>…</div>
    </div>
    <div class="flg-visually-hidden" aria-live="polite" aria-atomic="true"></div>
  </div>
  ```

  - Listbox và option dùng đúng class của Select (`flg-menu`, `flg-select-listbox`, `flg-menu-item`, `flg-select-option`), nên dùng lại giao diện của Select.
  - Dòng trạng thái ("No results", "Loading…") là một `<div role="presentation">` trong listbox. Khi không còn option nào, ô nhập có `aria-expanded="false"` và không có `aria-controls`, dù dòng trạng thái đang hiện: không có listbox nào để trỏ tới. Vùng live đọc lời trạng thái (Claude chốt). Khi chỉ còn dòng trạng thái, panel bỏ `role="listbox"` và tên của nó, vì một listbox phải chứa option (axe `aria-required-children`); có option trở lại thì role và tên trở lại (phát hiện khi lập Plan B).
  - Nhóm và đường phân cách như Select: nhóm là `role="group"` có `aria-labelledby`, đường phân cách là `<div role="none">`.
  - `ref` trỏ vào ô nhập. `id` và `aria-*` gắn vào ô nhập. Listbox có cùng tên với ô nhập.
- **Item** được đọc tĩnh từ `children` qua `readRows` (§5), như Select: `ComboboxItem` phải là con trực tiếp, hoặc nằm trong Fragment, mảng hay `ComboboxGroup`. Chữ của item là `textValue`, không có thì là chữ của children.
- **Lọc:**
  - Mặc định: "chứa", không phân biệt hoa thường và dấu: cả hai chuỗi qua `normalize("NFD")`, bỏ dấu (`\p{M}`), đổi `đ`/`Đ` thành `d`, rồi viết thường, và `ς` (sigma cuối từ) thành `σ`, để `ΟΔΟΣ` và `οδος` gặp nhau (phát hiện khi review PR #12). Mỗi ký tự được gấp riêng, một mã code point một lần, và cả bộ lọc lẫn phần in đậm dùng cùng một hàm gấp, nên hai bên không bất đồng ở ký tự có quy tắc theo ngữ cảnh. "ha noi" tìm thấy "Hà Nội"; "da nang" tìm thấy "Đà Nẵng" (Claude chốt). Bản quyết định ban đầu chỉ nói NFD và bỏ dấu; như vậy chưa đủ cho tiếng Việt, vì `đ` là một chữ riêng, NFD không tách nó ra.
  - `filter` là hàm thì lib dùng hàm đó. `filter={false}` tắt việc lọc: mọi item đều hiện, cho danh sách người dùng tự lọc (ví dụ tải từ server theo `onInputValueChange`).
  - Chỉ lọc theo chữ người dùng đã gõ. Mở listbox bằng phím hoặc bằng cú nhấn khi chưa gõ gì (chữ đang là chữ của item đã chọn) thì hiện mọi item, và item đã chọn được trỏ (Claude chốt).
  - Nhóm không còn item nào thì ẩn cả nhãn nhóm. Đường phân cách không đứng đầu, đứng cuối hay đứng liền nhau (Claude chốt).
- **Phần khớp in đậm** (mockup C1): với bộ lọc mặc định, chỗ khớp đầu tiên trong chữ của item được bọc trong `<span class="flg-combobox-match">`. Vị trí tính trên từng ký tự gốc, nên "ha" khớp đúng "Hà". Chỉ làm khi children của item là chữ thuần; children là element thì không đánh dấu (Claude chốt). Với `filter` riêng hoặc `filter={false}`, không có phần khớp.
- **Focus và highlight** theo mẫu APG "combobox list autocomplete, manual selection":
  - Focus DOM luôn ở ô nhập. Option được trỏ được báo qua `aria-activedescendant` và có `data-highlighted`.
  - Gõ chữ không tự trỏ hay chọn option nào.
  - Di chuột lên option thì option đó được trỏ (không áp dụng cho chạm). Bấm option thì chọn. Bấm trong listbox không lấy focus của ô nhập.
  - Danh sách chỉ cuộn theo option được trỏ khi trỏ bằng bàn phím (quy tắc của Select).
- **Bàn phím:**
  - Gõ chữ: lọc, mở listbox nếu đang đóng, bỏ trỏ.
  - ↓: listbox đóng thì mở và trỏ option đã chọn (nếu đang hiện), nếu không thì option đầu; listbox mở thì trỏ option kế tiếp. Không quay vòng (như Select).
  - ↑: như ↓, theo chiều ngược lại; mở thì trỏ option đã chọn hoặc option cuối.
  - Alt+↓: mở mà không trỏ. Alt+↑: đóng, giữ nguyên chữ.
  - Enter khi listbox mở:
    - Có option được trỏ: chọn nó, chữ thành chữ của item, đóng listbox.
    - Không có option được trỏ, có `allowCustomValue`: chốt chữ đang gõ làm giá trị, đóng listbox.
    - Không có option được trỏ, không có `allowCustomValue`: đóng listbox, không đổi gì.
    - Luôn `preventDefault`: Enter trong listbox đang mở không gửi form.
  - Enter khi listbox đóng: không bị chặn, form gửi như thường; có `allowCustomValue` thì chữ được chốt trước.
  - Esc khi listbox mở: trình duyệt đóng listbox (light dismiss), không đổi gì.
  - Esc khi listbox đóng:
    - Có `allowCustomValue` và còn chữ: xoá chữ và giá trị (`null`), `preventDefault`.
    - Không có `allowCustomValue` và chữ khác chữ của item đã chọn: chữ trở về chữ của item đã chọn, `preventDefault` (Claude chốt).
    - Không còn gì để làm: Esc không bị chặn, nên Dialog chứa Combobox đóng như thường.
  - Tab: đóng listbox, không chọn gì (khác Select), focus đi tiếp.
  - ←, →, Home, End: di chuyển con trỏ chữ và bỏ trỏ option.
- **Con trỏ:** cú nhấn vào ô nhập hoặc chevron bật/tắt listbox, như trigger của Select (`useTriggerPress`) (Claude chốt). Trình duyệt light-dismiss một `popover="auto"` với mọi cú nhấn ngoài nó, kể cả trên ô nhập, nên khi đang mở, nhấn vào ô nhập để đặt con trỏ chữ cũng đóng listbox; gõ tiếp thì nó mở lại. Đó là cách `<datalist>` gốc cư xử. Giữ listbox mở trong trường hợp này cần một popover `manual` và đổi quy tắc bấm ra ngoài của Dialog; spec chọn đi theo lớp nổi của giai đoạn 2.
- **Rời ô nhập** (blur, Tab):
  - Listbox đóng (quy tắc của Select: mọi phím nằm trên ô nhập).
  - Tiêu điểm sang cửa sổ khác (`relatedTarget` là `null` và `!document.hasFocus()`, như `handleBlur` của TagInput) không phải là rời: listbox vẫn đóng, nhưng chữ và giá trị giữ nguyên, không chốt cũng không trả về, vì người dùng sẽ quay lại chữ đang gõ (phát hiện khi review PR #12). Các quy tắc dưới đây chỉ áp dụng khi rời thật (Tab, bấm ra chỗ khác).
  - Chữ rỗng: giá trị thành `null` (Claude chốt). Đây là cách xoá giá trị, vì C1 không có nút xoá. Chỉ khi người dùng đã xoá chữ đang hiện giá trị: trước đó chữ không rỗng. Chữ cũng rỗng khi item của giá trị chưa về (hoặc không bao giờ về), và khi đó rời ô nhập, bằng Tab hay bấm ra chỗ khác, giữ nguyên giá trị đã lưu dù người dùng có gõ rồi xoá (phát hiện khi review PR #12).
  - Không có `allowCustomValue`: chữ trở về chữ của item đã chọn.
  - Có `allowCustomValue`: chữ được chốt làm giá trị. Nếu chữ, sau khi chuẩn hoá như bộ lọc, trùng chữ của một item, giá trị là `value` của item đó (Claude chốt).
- **Giá trị** là `value` của item, hoặc chính chữ đã gõ khi đó là giá trị tự do. `onInputValueChange` được gọi cả khi lib tự đổi chữ (chọn item, trả chữ về, reset).
- **`loading`:** dòng `labels.loading` hiện thay cho dòng "No results", và nằm dưới các option nếu có. Vùng live đọc nó một lần khi `loading` bật lên trong lúc listbox mở.
- **Thông báo số kết quả:** 500ms sau lần gõ cuối, vùng live đọc `labels.results(n)`, hoặc `labels.noResults` khi không có kết quả.
- **Form, Field:** §3.1, §3.2. `<select>` ẩn được đồng bộ và reset như của Select; khi trình duyệt focus nó để báo `required`, lib chuyển focus sang ô nhập.

**`TagInput`**

```ts
Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "size"> & {
  value?: string[]; defaultValue?: string[]; onValueChange?: (value: string[]) => void;
  inputValue?: string; defaultInputValue?: string; onInputValueChange?: (text: string) => void;
  separators?: string[]; validate?: (tag: string, tags: string[]) => boolean | string;
  maxTags?: number; allowDuplicates?: boolean;
  size?: "sm" | "md" | "lg"; invalid?: boolean;
  labels?: {
    remove?: (tag: string) => string; added?: (tag: string) => string; removed?: (tag: string) => string;
    invalid?: string; duplicate?: string; tooMany?: (max: number) => string; required?: string;
  };
}
```

- **Mặc định:** `separators=["Enter", ","]`, `allowDuplicates=false`, `labels={ remove: (t) => \`Remove ${t}\`, added: (t) => \`${t} added\`, removed: (t) => \`${t} removed\`, invalid: "Invalid tag", duplicate: "Already added", tooMany: (n) => \`Up to ${n} tags\`, required: "Add at least one tag." }`. Các khoá ngoài `remove` là Claude chốt; `required` thêm khi review PR #12.
- **Cấu trúc:**

  ```html
  <div class="flg-tag-input" data-size data-invalid data-disabled data-readonly>
    <div class="flg-input flg-tag-input-box">
      <ul class="flg-tag-input-list">
        <li class="flg-tag-input-item">
          <span class="flg-badge flg-tag" data-variant="neutral">React
            <button type="button" tabindex="-1" aria-label="Remove React">×</button></span>
        </li>
      </ul>
      <input type="text" />
    </div>
    <input type="hidden" name value="React" /> …
    <p class="flg-field-error">…</p>   <!-- chỉ khi nằm ngoài Field và có lời báo lỗi -->
    <div class="flg-visually-hidden" aria-live="polite" aria-atomic="true"></div>
  </div>
  ```

  - `ref`, `id`, `placeholder`, `required`, `readOnly`, `aria-*` và các prop HTML còn lại gắn vào ô gõ; riêng `required` thành `aria-required` cộng với `required` gốc chỉ khi chưa có thẻ nào (phát hiện khi review PR #12). `name` gắn vào các input ẩn.
  - `<ul>` và `<li>` có `display: contents`, để chip và ô gõ nằm chung một hàng `flex-wrap` của khung như mockup Ta1, mà danh sách vẫn giữ ngữ nghĩa (Claude chốt; xem §10).
  - Chip dùng `Badge` `neutral` như thẻ của Select chọn nhiều. Component `Chips` của Select không dùng lại được: nó `aria-hidden` và gộp phần dư thành "+N", còn thẻ của TagInput phải đọc được và xoá được.
  - Bấm vào khung, cả chip, thì focus ô gõ, như Input; nút xoá tự huỷ cú bấm nên focus cũng ở yên. Nhờ vậy chữ đang gõ dở không bị thêm thành thẻ vì một cú bấm vào chữ của chip (phát hiện khi review PR #12).
- **Thêm thẻ:**
  - Gõ một ký tự có trong `separators`, hoặc Enter khi `"Enter"` có trong `separators`: chữ trước đó thành thẻ. Enter khi ô gõ trống không bị chặn, nên form gửi như thường.
  - Chữ được bỏ khoảng trắng hai đầu; chữ rỗng bị bỏ qua.
  - Dán: chữ được tách theo các ký tự trong `separators` và theo xuống dòng (khi có `"Enter"`); mỗi phần được xét như một thẻ (`split-tags.ts`).
  - Focus rời TagInput (không phải sang nút xoá của chính nó) thì chữ đang gõ dở được thêm thành thẻ (Claude chốt, §3.1).
- **Thẻ bị từ chối:**
  - Thứ tự xét: trùng (khi `allowDuplicates` tắt, so đúng từng ký tự sau khi bỏ khoảng trắng), vượt `maxTags`, rồi `validate`. `validate` trả `false` thì lời báo là `labels.invalid`; trả chuỗi thì lời báo là chuỗi đó (Claude chốt).
  - Chữ được giữ lại trong ô gõ để người dùng sửa. Khi dán, các phần được chấp nhận được thêm vào, các phần bị từ chối được nối lại bằng ký tự ngăn đầu tiên không phải `"Enter"`; lời báo là lời của phần bị từ chối đầu tiên. Khi mọi ký tự ngăn đều là `"Enter"`, các phần được nối bằng một dấu cách (phát hiện khi lập Plan B). Chữ còn nguyên như sau lần từ chối gần nhất thì việc rời ô không xét lại: không thêm thẻ, không đọc lại lời báo, lời báo vẫn ở đó; nhờ vậy dấu cách nối không bao giờ thành một thẻ người dùng chưa gõ. Enter vẫn xét chữ đó (người dùng chủ động: khi chỉ có `"Enter"`, chữ đã nối thành một thẻ). Mọi chỉnh sửa hay reset đều xoá ghi nhớ này. Xoá một thẻ thì không xoá mà đánh dấu "xét lại" (thẻ vừa xoá có thể nhường chỗ cho một phần bị từ chối): việc rời ô khi đó xét lại các phần đã ghi nhớ, từng phần một, không bao giờ tách lại chữ đã nối bằng dấu cách (phát hiện khi review PR #12). Mỗi phần được xét với các thẻ đứng trước nó, kể cả các phần vừa được chấp nhận trong cùng lần dán.
  - TagInput thành `invalid`, ô gõ có `aria-invalid` và `setCustomValidity(lời báo)`, lời báo hiện qua `useControlError` (§3.2) và được đọc qua vùng live.
  - Lời báo mất khi chữ đổi, hoặc khi một thẻ được thêm hay xoá.
- **Bàn phím:**
  - Backspace trong ô gõ trống, hoặc ← khi con trỏ chữ ở đầu ô gõ, focus nút xoá của thẻ cuối. ← là Claude chốt.
  - Trên nút xoá: Backspace hoặc Delete xoá thẻ đó; Enter hoặc Space (click gốc của nút) cũng xoá.
  - Sau khi xoá bằng phím: focus sang nút xoá của thẻ kế tiếp; xoá thẻ cuối thì sang thẻ trước; hết thẻ thì về ô gõ (Claude chốt). Bấm chuột vào nút xoá thì focus về ô gõ, nơi thẻ kế tiếp được gõ; quy tắc "nút kế tiếp" chỉ dành cho phím, nếu không Backspace sau một cú bấm chuột sẽ xoá thêm thẻ kế (phát hiện khi lập Plan B).
  - ← và → di chuyển giữa các nút xoá; → ở thẻ cuối về ô gõ. Home và End về thẻ đầu và thẻ cuối.
  - Esc trên nút xoá về ô gõ (Claude chốt).
  - Gõ một ký tự in được khi đang ở nút xoá: focus về ô gõ và ký tự đó vào ô gõ.
  - Tab từ nút xoá đi tới ô gõ, vì ô gõ đứng sau danh sách trong DOM. Các nút xoá có `tabIndex={-1}`, nên Tab vào TagInput chỉ dừng ở ô gõ.
- **Thông báo:** vùng live đọc `labels.added(tag)` và `labels.removed(tag)`, vì thẻ mới hay thẻ mất không tự được đọc.
- **`readOnly`:** ô gõ chỉ đọc; nút xoá `disabled`; không thêm hay xoá được thẻ (Claude chốt).
- **Form, Field:** §3.1, §3.2.

**`FileUpload`**

```ts
type FileRejection = {
  file: File;
  errors: { code: "type" | "size" | "count" | "custom"; message: string }[];
};
type FileUploadProps = {
  value?: File[]; defaultValue?: File[]; onValueChange?: (files: File[]) => void;
  accept?: string; multiple?: boolean; maxSize?: number; maxFiles?: number;
  validate?: (file: File) => string | null; onReject?: (rejections: FileRejection[]) => void;
  disabled?: boolean; required?: boolean; invalid?: boolean; name?: string; locale?: string;
  hint?: ReactNode; id?: string; className?: string; style?: CSSProperties;
  "aria-label"?: string; "aria-labelledby"?: string; "aria-describedby"?: string;
  labels?: {
    prompt?: string; browse?: string; dropHere?: string; remove?: (name: string) => string;
    type?: string; size?: (max: string) => string; count?: (max: number) => string;
    added?: (count: number) => string; rejected?: (count: number) => string;
  };
};
```

- **Mặc định:** `multiple=true`, `locale="en-US"`, `labels={ prompt: "Drag and drop files here or", browse: "browse", dropHere: "Drop files to upload", remove: (n) => \`Remove ${n}\`, type: "File type not supported", size: (max) => \`File is larger than ${max}\`, count: (n) => \`Up to ${n} files\`, added: (n) => n === 1 ? "1 file added" : \`${n} files added\`, rejected: (n) => n === 1 ? "1 file rejected" : \`${n} files rejected\` }`. `maxSize` tính bằng byte. Lỗi có dạng `{ code, message }` và các khoá `labels` ngoài bản quyết định ban đầu là Claude chốt.
- **Cấu trúc:**

  ```html
  <div class="flg-file-upload" data-dragging data-disabled data-invalid>
    <div class="flg-file-upload-zone">
      <span class="flg-file-upload-icon" aria-hidden="true">…</span>
      <p class="flg-file-upload-prompt">Drag and drop files here or
        <span class="flg-file-upload-browse">
          <span aria-hidden="true">browse</span>
          <input type="file" name accept multiple required disabled />
        </span></p>
      <p class="flg-file-upload-hint">{hint}</p>
    </div>
    <ul class="flg-file-upload-list">
      <li class="flg-file-upload-file" data-rejected>…tên, cỡ hoặc lỗi, nút xoá…</li>
    </ul>
    <div class="flg-visually-hidden" aria-live="polite" aria-atomic="true"></div>
  </div>
  ```

- **`<input type="file">` gốc là phần tử nhận focus và cú bấm** (Claude chốt). Bản quyết định ban đầu nói input gốc "ẩn khỏi mắt, trong `<label>`/nút của vùng thả" và "nút chọn tệp là một button". Spec chọn cách native-first của spec 0+1 §5: input gốc phủ trùng lên chữ "browse" với `opacity: 0`.
  - Bấm vào nó mở hộp chọn tệp của hệ thống, kể cả trước khi hydrate; form gửi tệp như control gốc.
  - Bàn phím: input file gốc được trình duyệt đưa ra như một nút; Enter hoặc Space mở hộp chọn.
  - `required` và bong bóng validation là của trình duyệt, hiện đúng chỗ nút.
  - `<label for>` của Field trỏ thẳng vào nó.
  - Vòng focus vẽ trên chữ "browse" qua `:has(> input:focus-visible)`.
  - `ref` và `id` gắn vào nó. Ngoài Field mà không có `aria-label` hay `aria-labelledby`, nó lấy tên từ `labels.browse`. `aria-describedby` có cả `hint`.
  - Lib đặt `title=""` để Chromium không hiện tooltip "No file chosen" khi rê chuột.
- **Bấm vào chỗ trống của vùng thả** (không trúng control nào) cũng mở hộp chọn tệp (`input.click()`). Đây là tiện ích cho con trỏ; bàn phím chỉ dừng ở nút "browse" (Claude chốt).
- **Kéo thả:**
  - Vùng thả nghe `dragenter`, `dragover`, `dragleave`, `drop`, với một bộ đếm: phần tử con cũng phát `dragleave`, nên chỉ khi bộ đếm về 0 thì mới tính là kéo ra ngoài.
  - `data-dragging` chỉ bật khi thứ đang kéo có tệp (`dataTransfer.types` chứa `"Files"`).
  - `dragover` được `preventDefault` và đặt `dropEffect = "copy"` (khi disabled thì `"none"`).
  - `drop` được `preventDefault`, kể cả khi thả trúng input gốc, để trình duyệt không tự thay `input.files`.
  - Mục là thư mục (`webkitGetAsEntry().isDirectory`) bị bỏ qua (ngoài phạm vi, §2).
  - Kéo thả là tiện ích cho con trỏ: mọi thứ làm được bằng bàn phím qua hộp chọn tệp.
- **Thêm tệp** (từ hộp chọn hoặc từ thả):
  - Mỗi tệp được xét: `accept` (`type`), `maxSize` (`size`), `validate` (`custom`), rồi `maxFiles` tính trên số tệp đã nhận (`count`). Một tệp có thể có nhiều lỗi.
  - Tệp được nhận nối vào cuối danh sách; chọn tệp lần nữa không xoá các tệp đã có (Claude chốt). Lib gán lại cả danh sách vào `input.files` qua một `DataTransfer`, vì hộp chọn của trình duyệt thay chứ không cộng.
  - `multiple={false}`: tệp nhận được thay tệp cũ; thả nhiều tệp thì tệp đầu được xét, các tệp còn lại bị từ chối với `count` (Claude chốt).
  - `onValueChange(files)` nhận danh sách tệp được nhận. `onReject(rejections)` được gọi một lần cho mỗi lượt thêm có tệp bị từ chối.
  - Vùng live đọc `labels.added(n)` và `labels.rejected(n)`.
- **Danh sách:**
  - Tệp được nhận: tên, cỡ (`formatFileSize`), nút xoá `labels.remove(name)`.
  - Tệp bị từ chối: tên, lời báo lỗi đầu tiên, nút xoá; nằm trong danh sách cho tới khi người dùng xoá. Dòng bị từ chối là state nội bộ, không thuộc `value` (Claude chốt).
  - Sau khi xoá một dòng, focus sang nút xoá của dòng kế tiếp, nếu không có thì dòng trước, nếu hết dòng thì về input gốc (Claude chốt).
- **Cỡ tệp:** `Intl.NumberFormat(locale, { style: "unit", unit, maximumFractionDigits: 1 })`, với `unit` là `byte`, `kilobyte` hoặc `megabyte`. Lib dùng 1 kB = 1000 byte, khớp tên đơn vị của `Intl` (Claude chốt).
- **`value` controlled:** lib gán `value` vào `input.files` qua `DataTransfer` sau mỗi commit, để form gửi đúng các tệp đang hiện.
- **Form, Field:** §3.1, §3.2.

**`Calendar`**

```ts
type CalendarBaseProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  month?: string; defaultMonth?: string; onMonthChange?: (month: string) => void;
  min?: string; max?: string; isDateUnavailable?: (date: string) => boolean;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6; locale?: string; today?: string;
  labels?: { previousMonth?: string; nextMonth?: string };
};
type CalendarProps =
  | (CalendarBaseProps & { mode?: "single"; value?: string | null; defaultValue?: string;
      onValueChange?: (value: string) => void })
  | (CalendarBaseProps & { mode: "range"; value?: [string, string] | null; defaultValue?: [string, string];
      onValueChange?: (value: [string, string]) => void });
```

- **Mặc định:** `mode="single"`, `weekStartsOn=0`, `locale="en-US"`, `labels={ previousMonth: "Previous month", nextMonth: "Next month" }`.
- **Cấu trúc** (mẫu APG "date picker dialog", phần lưới):

  ```html
  <div class="flg-calendar" data-mode>
    <div class="flg-calendar-header">
      <div id="{titleId}" class="flg-calendar-title" aria-live="polite">November 2026</div>
      <button aria-label="Previous month" aria-disabled>‹</button>   <!-- IconButton ghost sm -->
      <button aria-label="Next month" aria-disabled>›</button>
    </div>
    <table role="grid" aria-labelledby="{titleId}" class="flg-calendar-grid">
      <thead><tr><th scope="col"><span aria-hidden="true">Sun</span><span class="flg-visually-hidden">Sunday</span></th>…</tr></thead>
      <tbody><tr>
        <td role="gridcell" aria-selected="true">
          <button type="button" tabindex="0" aria-label="Saturday, November 14, 2026" aria-current="date" aria-disabled>14</button>
        </td>…
      </tr></tbody>
    </table>
  </div>
  ```

  - Tiêu đề là `<div>`, không phải heading, vì Calendar thường nằm trong form hoặc popup (Claude chốt). Nó là vùng live polite, nên đổi tháng thì tên tháng mới được đọc.
  - Hàng thứ hiện tên ngắn (`weekdayNames(locale, weekStartsOn, "short")`) và đọc tên đầy đủ (`"long"`) (Claude chốt).
  - Tên của nút ngày là ngày đầy đủ theo locale ("Saturday, November 14, 2026").
  - **Trạng thái chọn:** `aria-selected="true"` trên `gridcell`, theo APG (Claude chốt). Bản quyết định ban đầu để ngỏ giữa `aria-pressed` trên nút và `aria-selected` trên ô; spec chọn một, vì đặt cả hai thì screen reader đọc trạng thái hai lần. Ở chế độ khoảng, mọi ô trong khoảng có `aria-selected`.
  - Hôm nay: `aria-current="date"` trên nút ngày (chỉ có sau khi mount, §3.4).
  - Ngày của tháng khác: ô `gridcell` chứa số với `aria-hidden`, không phải nút, không nhận focus, bấm không làm gì (Claude chốt).
  - `ref` trỏ vào phần tử gốc.
- **Tháng đang hiện:** `month` ?? `defaultMonth` ?? tháng của `value` (ngày đầu, với khoảng) ?? tháng của `today` ?? tháng hiện tại của máy người dùng (Claude chốt).
  - Trường hợp cuối chỉ biết được ở client. HTML từ server và lần render đầu ở client có tiêu đề và hàng thứ rỗng, lưới chưa có ngày; ngày hiện ra sau khi mount. Nhờ vậy không lệch khi hydrate, dù server ở múi giờ khác.
  - Khi `month` không được điều khiển mà `value` (controlled) được component cha đổi sang một tháng khác, tháng đang hiện theo giá trị mới, để một Calendar độc lập có giá trị đặt từ ngoài (ví dụ nút "Hôm nay") hiện ra ngày đó. Việc này không gọi `onMonthChange`, và chỉ xảy ra khi `value` đổi: người dùng đã sang tháng khác không bị kéo về (phát hiện khi lập Plan C).
- **Roving tabindex:** chỉ một nút ngày có `tabIndex=0`: ngày đang focus. Ngày đó mặc định là ngày đã chọn (nếu trong tháng đang hiện), không thì hôm nay (nếu trong tháng), không thì ngày chọn được đầu tiên của tháng (Claude chốt).
- **Bàn phím** (trên lưới):
  - ← và →: lùi, tiến một ngày. ↑ và ↓: lùi, tiến một tuần.
  - Home và End: ngày đầu và cuối của tuần (theo `weekStartsOn`).
  - PageUp và PageDown: tháng trước, tháng sau (cùng ngày, kẹp theo `addMonths`).
  - Shift+PageUp và Shift+PageDown: năm trước, năm sau.
  - Đi qua mép tháng thì đổi tháng đang hiện (`onMonthChange`), và focus theo sang ngày mới.
  - Focus không đi ra ngoài `[min, max]`: phím dừng ở mép (Claude chốt).
  - Enter và Space: chọn (click gốc của nút).
- **Nút tháng trước/sau:**
  - Đổi tháng; focus ở lại nút.
  - Khi cả tháng đích nằm ngoài `[min, max]`, nút có `aria-disabled="true"` và không làm gì, nhưng vẫn nhận focus: `disabled` gốc làm focus rơi về `<body>` khi người dùng vừa nhấn nút để tới tháng cuối, bài học Pagination (Claude chốt).
- **Ngày không chọn được** (`isDateUnavailable` trả `true`, hoặc ngoài `[min, max]`): nút có `aria-disabled="true"`, vẫn nhận focus và đi qua được bằng phím, bấm không làm gì.
- **Chọn một ngày:** bấm hoặc Enter/Space trên ngày chọn được thì gọi `onValueChange(iso)`. Không bỏ chọn được.
- **Chọn khoảng:**
  - Lần chọn thứ nhất đặt ngày đầu; lần thứ hai đặt ngày cuối. Ngày cuối sớm hơn ngày đầu thì hai ngày đổi chỗ.
  - Lần chọn thứ nhất không gọi `onValueChange`; lần thứ hai gọi với `[đầu, cuối]`. Chọn cùng một ngày hai lần cho khoảng một ngày (Claude chốt).
  - Giữa hai lần chọn, ngày đang được rê chuột hoặc focus hiện dải xem trước từ ngày đầu tới nó.
  - Esc giữa hai lần chọn bỏ ngày đầu và được `preventDefault` (để Dialog chứa Calendar không đóng); không có ngày đầu nào đang chờ thì Esc không bị chặn (Claude chốt).
  - Chỉ hai đầu khoảng phải chọn được; ngày không chọn được nằm giữa khoảng vẫn được (Claude chốt). Docs ghi rõ, vì đặt phòng qua đêm "hết phòng" là trường hợp người dùng phải tự chặn.

**`DatePicker`**

```ts
Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "size" | "min" | "max"> & {
  value?: string | null; defaultValue?: string; onValueChange?: (value: string | null) => void;
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  min?: string; max?: string; isDateUnavailable?: (date: string) => boolean;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6; locale?: string; today?: string;
  size?: "sm" | "md" | "lg"; invalid?: boolean;
  labels?: CalendarLabels & {
    openCalendar?: string; dialog?: string; invalidDate?: string; unavailableDate?: string;
  };
}
```

- **Mặc định:** `locale="en-US"`, `labels={ openCalendar: "Choose date", dialog: "Choose date", invalidDate: "Invalid date", unavailableDate: "This date is not available", …nhãn của Calendar }`. `placeholder` mặc định là `datePattern(locale)`. Chỉ chọn một ngày.
- **Cấu trúc (D1):**

  ```html
  <div class="flg-date-picker" data-size data-invalid data-disabled>
    <div class="flg-input">
      <input type="text" placeholder="mm/dd/yyyy" autocomplete="off" />
      <button type="button" class="flg-date-picker-button" aria-label="Choose date"
              aria-haspopup="dialog" aria-expanded aria-controls>…</button>
    </div>
    <input type="hidden" name value="2026-11-14" />
    <div popover="auto" role="dialog" aria-label="Choose date" class="flg-surface flg-date-picker-popup">
      <!-- Calendar, chỉ khi mở -->
    </div>
    <p class="flg-field-error">…</p>   <!-- chỉ khi nằm ngoài Field và có lời báo lỗi -->
    <div class="flg-visually-hidden" aria-live="polite" aria-atomic="true"></div>
  </div>
  ```

  - `ref`, `id`, `required`, `readOnly`, `aria-*` và các prop HTML còn lại gắn vào ô gõ. `name` gắn vào input ẩn.
  - Nút lịch nằm trong thứ tự Tab, ngay sau ô gõ, theo APG (Claude chốt). Mockup D1 vẽ nó với `tabindex="-1"`, nhưng mockup chỉ ràng buộc giao diện; Alt+↓ khó đoán với người dùng bàn phím. Vòng focus của nút (ngoài mockup) là vòng focus chung.
- **Gõ ngày:**
  - Gõ theo thứ tự ngày, tháng, năm của locale; dấu ngăn nào cũng được.
  - Chữ được đọc (`parseDate`) khi rời ô và khi Enter.
  - Ô trống: giá trị `null`.
  - Đọc được và chọn được: giá trị đổi, chữ được định dạng lại (`formatDate`).
  - Không đọc được: lời báo `labels.invalidDate`; giá trị giữ nguyên; chữ giữ nguyên để người dùng sửa; ô gõ có `aria-invalid` và `setCustomValidity`.
  - Đọc được nhưng ngoài `[min, max]` hoặc `isDateUnavailable` trả `true`: như trên, với lời báo `labels.unavailableDate` (Claude chốt).
  - Lời báo hiện qua `useControlError` (§3.2) và được đọc qua vùng live; mất khi chữ được sửa thành ngày hợp lệ, khi chọn trong lịch, hoặc khi reset.
  - Docs khuyên ghi định dạng ngày trong `description` của Field: placeholder biến mất khi người dùng bắt đầu gõ.
- **Mở lịch:** bấm nút lịch (`useTriggerPress`, như trigger của Popover), hoặc Alt+↓ trong ô gõ.
  - Chữ đang gõ dở được đọc trước khi mở, để lịch mở ở đúng tháng.
  - Focus vào ngày đang focus được của lưới (`onShown`, quy tắc roving của Calendar).
- **Trong lịch:**
  - Chọn một ngày: giá trị đổi, chữ được định dạng lại, lịch đóng, focus về ô gõ.
  - Esc: trình duyệt đóng lịch, focus về ô gõ (`restoreFocusTo`).
  - Focus rời lịch theo cách khác (Tab ra khỏi popup sang chỗ không phải ô gõ hay nút lịch) thì lịch đóng, không giành lại focus (Claude chốt).
  - Bấm ra ngoài: light dismiss (§3.5).
- **`readOnly`:** ô gõ chỉ đọc, nút lịch có `aria-disabled` và không mở lịch (Claude chốt).
- **Form, Field:** §3.1, §3.2.

### 6.4 Các điểm chốt thêm sau khi đọc soát

Một người đọc spec với vai người lập plan (builder check, 2026-11-02) nêu năm chỗ còn phải đoán. Không chỗ nào cần chủ dự án quyết; Claude chốt như sau:

- **Nét icon** (§4.6): dùng nét 2 như `strokeIcon` và mọi mockup giai đoạn 2. Các trang mockup giai đoạn 3 vẽ nét 1,75 do brief vẽ mockup ghi sai (Claude chốt).
- **DatePicker mở khi chữ đang gõ không đọc được:** lịch mở ở tháng của `value`; không có `value` thì ở tháng của "hôm nay"; chưa biết "hôm nay" (trước khi hydrate) thì ở tháng hiện tại của trình duyệt lúc mở (Claude chốt).
- **Calendar không có `value`, `month` và `today`:** HTML từ server là một lưới rỗng, tháng hiện lên sau khi hydrate. Mọi story và ảnh chuẩn visual đều truyền `today`, để ảnh không đổi theo ngày chạy (Claude chốt).
- **jsdom không có `DataTransfer` và Popover API:** FileUpload kiểm tra `DataTransfer` trước khi gán `input.files`. Unit test dùng một shim; hành vi thật (thả tệp, gửi form) kiểm ở lớp trình duyệt, như §7 đã ghi (Claude chốt).
- **Bong bóng giá trị của Slider** nằm trong phần tử `role="slider"` (một `<span>`), nên nó cũng là `<span>` (`display: block`), không phải `<div>`, để HTML lồng nhau hợp lệ (Claude chốt).

---

## 7. Kiểm thử

Các lớp 1–6 của spec 0+1 §7 và phần bổ sung của spec giai đoạn 2 §7 giữ nguyên, thêm phần sau.

| # | Lớp | Bổ sung ở giai đoạn 3 |
|---|---|---|
| 1 | Unit (jsdom, React 19 và 18.3) | **Hàm thuần, kiểm cạn:** `number.ts` (làm tròn về bước với số thập phân, `0.1 + 0.2`; `stepFrom`; đọc và viết số ở `en-US`, `vi-VN`, `de-DE`, kể cả `percent` và `currency`); `date.ts` (lưới tháng của mọi tháng 2024–2027 với cả `weekStartsOn` 0 và 1, `addMonths` kẹp ngày, năm nhuận, `parseDate` và `datePattern` ở ba locale, năm 2 chữ số); `match.ts` (tiếng Việt, kể cả `đ`); `split-tags.ts`; `accept.ts`; `list-rows.ts` (các test của `select-rows` chuyển theo); `useFormReset`; `useControlError` trong và ngoài Field; quy tắc tự hiện vạch chia |
| 2 | Trình duyệt thật (Chromium, Firefox, WebKit) | Kéo Slider bằng con trỏ (kể cả hai núm không vượt nhau); nhấn giữ nút −/+; bàn phím của từng component ở §6.3; lưới Calendar (mọi phím, đổi tháng, mép `min`/`max`); Combobox theo APG và trong Dialog (Esc chỉ đóng listbox); TagInput (Backspace, ←/→, dán); mở và đóng lịch của DatePicker, focus vào lưới và về ô gõ; kéo thả FileUpload bằng một `DataTransfer` tự tạo (Chromium; Firefox và WebKit nếu engine cho phát `drop` với nó); `FormData` và reset form của cả 7 control; bong bóng `required` của Combobox, TagInput, FileUpload, DatePicker, NumberInput; Enter chốt giá trị rồi form gửi đúng giá trị đó |
| 3 | Accessibility (axe) | Chạy sau play function, ở trạng thái mở |
| 4 | Tương phản | Các cặp mới ở §4.4, cả chế độ mặc định lẫn `prefers-contrast: more` |
| 5 | Visual regression | Mỗi component một story ở giao diện đã chọn, kèm trạng thái mở (listbox, lịch) và trạng thái lỗi, ở 4 chế độ × light/dark. Slider có cả một núm, khoảng và vạch chia; FileUpload có danh sách với dòng bị từ chối và trạng thái đang kéo |
| 6 | Screen reader (thủ công) | NVDA và VoiceOver: Combobox (số kết quả, option được trỏ), `aria-valuetext` của Slider, tên ngày và trạng thái chọn của Calendar, thông báo của TagInput, input file gốc của FileUpload, danh sách thẻ với `display: contents` |

**Kiểm tra bổ sung:**

- **Test kiểu:**
  - `Slider` với `defaultValue={[20, 75]}` cho `onValueChange` nhận `[number, number]`; với số thì nhận `number`.
  - `Calendar` có `mode: "range"` chỉ nhận `[string, string]`.
  - `value` của NumberInput, Combobox, DatePicker nhận `null`.
  - Union của `size` từ chối giá trị lạ, kể cả `"lg"` ở SegmentedControl.
- **Gói phát hành:**
  - `check:use-client` và `check:dist-css` thêm danh sách ở §3.7 và §3.8.
  - `size-limit` được ghi lại ngưỡng ở mỗi plan.
- **Fixtures** (Plan D):
  - `vite-app` và `next-app` mỗi app có một form dùng cả 8 component.
  - `next-app` gửi form qua một Server Action trả lại các trường nhận được; kịch bản kiểm tra so các giá trị đó: số, ngày ISO, các thẻ, tên tệp.
  - `vite-app` không có server nhận POST (`vite preview` chỉ phục vụ tệp tĩnh). Kịch bản của nó đọc `new FormData(form)` trong `onSubmit` và so cùng các giá trị (Claude chốt; bản quyết định ban đầu muốn cả hai app cùng gửi form lên server).
  - Console phải sạch, như các giai đoạn trước.

---

## 8. Docs và phát hành

- **Mỗi component mới có một trang MDX,** cùng khuôn với các giai đoạn trước: cách dùng, bảng props, ví dụ, ghi chú accessibility, "nên / không nên". Ghi chú accessibility nêu các hạn chế ở §6.3.
- **Getting started:** mục "Build a form" (bản quyết định ban đầu gọi là "Forms") thêm các control mới:
  - Mọi control gửi được bằng form thường và reset được.
  - Giá trị là số và chuỗi ISO; `null` là chưa có giá trị.
  - Prop `locale` và `weekStartsOn={1}` cho tuần bắt đầu từ thứ Hai.
  - Prop là hàm phải truyền từ client component.
- **Trang của từng component** ghi thêm:
  - Slider: cách đặt giá trị ở hàng nhãn (§4.3).
  - Combobox: lọc từ server với `filter={false}` và `loading`; cách xoá giá trị; bấm vào ô nhập khi đang mở thì đóng listbox.
  - Calendar: ngày không chọn được ở giữa khoảng.
  - DatePicker: ghi định dạng ngày trong `description`.
  - SegmentedControl: khác Tabs `segmented` ở đâu.
- **Accessibility:**
  - Bảng §4.9 gồm phần mở rộng và các dòng mới (nếu có) từ §4.4.
  - Ghi chú: `aria-valuetext` của Slider, số kết quả của Combobox, tên ngày đầy đủ của Calendar, vùng live của từng component.
- **Phát hành:**
  - Một changeset `minor` cho `0.3.0`: `.changeset/phase-3-inputs.md`, liệt kê 8 component mới. Không có thay đổi phá vỡ.
  - Nếu tới lúc đó `0.1.0` và `0.2.0` vẫn chưa publish, Changesets gộp các changeset thành một bản phát hành; changelog vẫn liệt kê đủ.
- **Việc của chủ dự án không đổi** (spec 0+1 §8.3).

---

## 9. Tiêu chí hoàn thành giai đoạn 3

1. Cả 8 họ component ở §2 qua các lớp 1–5 ở §7.
   - Cách đếm: mỗi component cùng các phần con của nó tính là một mục (`SegmentedControlItem` tính với `SegmentedControl`; `ComboboxItem`, `ComboboxGroup`, `ComboboxSeparator` tính với `Combobox`).
   - Lớp 6 đã làm, hoặc được ghi rõ "chưa kiểm tra" cho từng mục.
2. Toàn bộ kiểm tra bổ sung ở §7 xanh trong CI.
3. Fixture Vite và fixture Next.js chạy đủ kịch bản ở §7 từ tarball, kể cả gửi form.
4. Mọi cặp tương phản mới đã đạt, hoặc đã có trong §4.9 kèm số đo.
5. Changeset `0.3.0` đã sẵn sàng. Việc publish là quyết định của chủ dự án.

---

## 10. Rủi ro và cách xử lý

| Rủi ro | Cách xử lý |
|---|---|
| Sự kiện con trỏ trên màn hình cảm ứng (Slider): kéo bị trình duyệt cướp để cuộn trang | `touch-action: none` trên núm, `pan-y` trên rãnh (§6.3); `setPointerCapture`; xử lý `pointercancel`. Lớp 2 kiểm trên ba engine |
| Đọc ngày gõ tay mơ hồ giữa các locale (DatePicker) | Thứ tự cố định lấy từ `formatToParts` của `locale`; năm 2 chữ số là 20xx; ngày không có thật bị từ chối. Unit test ở ba locale |
| Gán `input.files` qua `DataTransfer` | Có trên mọi trình duyệt của mốc 17.4. Lớp 2 kiểm `FormData` sau khi thả và sau khi xoá một tệp |
| Combobox được đọc khác nhau giữa các screen reader | Theo đúng APG; lớp 6 kiểm NVDA và VoiceOver |
| "Hôm nay" sai khi trang mở qua nửa đêm | Tính lại khi trang hiện lại và khi Calendar nhận focus (§3.4) |
| Dữ liệu `Intl` (ICU) của Node trên server khác của trình duyệt, làm chữ số hay tên tháng lệch khi hydrate | `locale` mặc định cố định `en-US`, dạng ổn định nhất. Calendar không render ngày khi chưa biết tháng (§6.3). Nếu fixture gặp lệch ở một locale khác, chữ đó được render lại ở client sau khi mount |
| `display: contents` trên `<ul>` của TagInput làm mất ngữ nghĩa danh sách ở một engine | Lớp 6 kiểm VoiceOver và NVDA. Nếu mất, danh sách bỏ `display: contents` và ô gõ xuống hàng riêng dưới các chip; thay đổi giao diện đó cần chủ dự án duyệt |
| Vùng live của từng component đọc chồng lên nhau khi trang có nhiều control | Chỉ control đang được dùng mới nói; Combobox gộp lần gõ trong 500ms |
| Bấm vào ô nhập khi listbox của Combobox đang mở thì đóng nó (light dismiss) | Chấp nhận, giống `<datalist>` gốc; ghi trong docs (§6.3). Xem lại khi `showPopover({ source })` có trên mọi trình duyệt của mốc |
| Nhiều bong bóng kính của Slider trên một trang làm nặng `backdrop-filter` | Bong bóng nhỏ (24px); docs khuyến cáo như với Surface lồng nhau |
| Bundle tăng | `size-limit` ghi lại ngưỡng ở mỗi plan; `Intl` có sẵn trong trình duyệt nên không thêm dependency |
