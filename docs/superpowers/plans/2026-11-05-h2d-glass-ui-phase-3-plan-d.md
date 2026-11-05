# h2d-glass-ui: Plan D, FileUpload, `form` cho năm control, fixtures và docs (giai đoạn 3, phần 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm Plan D, plan cuối của giai đoạn 3: `FileUpload` (giao diện F1: chọn tệp, danh sách, form, kiểm tra tệp, dòng bị từ chối, kéo thả) cùng helper `accept.ts`, các cặp tương phản và ngưỡng kích thước; prop `form` tới phần tử gửi của năm control còn thiếu; fixtures dùng cả 8 component của giai đoạn 3; docs chung và changeset `0.3.0`.

**Architecture:**
- **`accept.ts`** (Task 1): `matchesAccept` theo luật của thuộc tính `accept` gốc, và `formatFileSize` qua `numberFormat` của `src/internal/intl.ts`. Hàm thuần, không `"use client"`, không export ra ngoài package.
- **`FileUpload`** (Task 2, 3, 4): `<input type="file">` gốc là control, phủ trùng lên chữ "browse" với `opacity: 0`. Lib giữ danh sách tệp, và sau mỗi commit ghi lại cả danh sách vào `input.files` qua một `DataTransfer`.
  - Task 2: chọn tệp, danh sách, xoá, controlled, form và Field.
  - Task 3: bốn bước kiểm tra tệp, dòng bị từ chối, `onReject` và kéo thả.
  - Task 4: bốn cặp tương phản, màu khi kéo qua token `--flg-selected-*`, ngưỡng kích thước.
- **`form` cho năm control** (Task 5): NumberInput, Slider, SegmentedControl, Combobox và Select đưa `form` tới mọi phần tử mà chúng gửi qua. `useFormReset` nhận thêm id của form, cho Slider và SegmentedControl, vốn có gốc là `<div>`.
- **Fixtures** (Task 6): một form đặt phòng dùng cả 8 component, ở `vite-app` (đọc `FormData` trong `onSubmit`) và ở `next-app` (Server Action qua `useActionState`). Hàm `checkInputs` của script nhập bằng bàn phím và chuột thật, gửi form, rồi so các giá trị nhận được.
- **Docs chung và changeset** (Task 7): mục "Build a form" của Getting started, mục "Advanced inputs" của trang Accessibility, `.changeset/phase-3-inputs.md` (`minor`, cho `0.3.0`).

**Tech Stack:** Như Plan A, B và C: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63, `@floating-ui/dom` 1.8.0. Plan này không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md`. Plan này làm các phần sau:
- §2 dòng D: FileUpload, docs chung, fixtures dùng cả 8 component, changeset `0.3.0` (Task 1 đến 7).
- §3.1: dòng FileUpload và ý reset của FileUpload (Task 2, 3); câu mới về `form` (Task 5).
- §3.2: dòng FileUpload (Task 2).
- §3.4: `locale` của FileUpload, cho cỡ tệp (Task 1, 2).
- §3.6: vùng live của FileUpload (Task 2, 3).
- §4.2: token `--flg-dropzone-border` (Task 2).
- §4.3, §4.4, §4.5: giao diện F1, các cặp tương phản và forced colors của FileUpload (Task 2, 3, 4).
- §5: `file-upload/accept.ts` (Task 1); cảnh báo dev của FileUpload (Task 2); `useFormReset` (Task 2, 5).
- §6.3: API của `FileUpload` (Task 2, 3); §6.4: `DataTransfer` trong jsdom (Task 2).
- §7: dòng 1 đến 5 cho FileUpload (Task 1 đến 4); **Fixtures** (Task 6).
- §8: trang MDX của FileUpload (Task 2, 3); Getting started, Accessibility, changeset (Task 7).
- §9: tiêu chí hoàn thành giai đoạn 3 (kiểm tra cuối ở Task 7).
- §4.9 của spec giai đoạn 0+1 (`docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`): dòng 19, 20, 21 mới (Task 4).

Chủ dự án đã duyệt spec và chọn giao diện F1 ngày 2026-11-02. Task 5 là quyết định của chủ dự án ngày 2026-11-05: "sửa trong Plan D" cho NumberInput và Slider, rồi "all 5" khi được hỏi thêm về SegmentedControl, Combobox và Select. Việc này đến từ comment 4 trong review PR #14.

**Đã chạy thử khi lập kế hoạch:**
- Toàn bộ code dưới đây đã chạy trên nhánh nháp `draft/phase-3-plan-d`, mỗi task một commit: bảy commit trên `e3126ca` (`main` sau PR #17). Mỗi test viết trước đã được chạy trên commit cha của task, trừ các chỗ ghi rõ ở phát hiện 15.
- Mọi task do subagent Claude Sonnet viết; chủ dự án chọn không dùng opencode cho Plan D. Claude (Opus) kiểm tra từng task, và sửa thêm ở Task 1 đến 4 (phát hiện 2).
- Mọi khối patch trong plan được lấy thẳng từ các commit đó.

Kết quả đo ở `ebb5a8f`, đầu nhánh nháp, ngày 2026-11-05. Story là ngoại lệ: chúng chạy ở commit của task đổi thư mục đó.

| Lệnh | Kết quả |
|---|---|
| `pnpm test:unit` | 2811 test PASS, 3 skip (149 file; project `unit`, `unit-react18` và `scripts`) |
| Story | file-upload 48 (Task 3 và Task 4); number-input 42, slider 48, segmented-control 24, combobox 84, select 84 (Task 5). PASS ở Chromium, Firefox và WebKit, theme sáng và tối, chạy từng thư mục một. Cả bộ story chưa chạy một lượt trên máy này vì thiếu bộ nhớ; CI chạy cả bộ |
| `pnpm check:contrast` | PASS, với dòng 19, 20 và 21 mới của §4.9 |
| `pnpm check:package` | PASS với ngưỡng mới: JS 47580 B (đo được 43.34 kB; ngưỡng trước 45038 B), CSS 9311 B (đo được 8.46 kB; ngưỡng trước 8880 B) |
| Fixtures | vite và next PASS, bản production và development, chạy qua bản sao tạm của script ở cổng 5174/4175 |
| `pnpm build-storybook` | PASS (Task 7) |
| `pnpm gen:theme`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm build` | PASS |

Bản nháp không chạy `pnpm check:name`. Kiểm tra cuối ở Task 7 có lệnh này.

Các phát hiện từ lần chạy thử đã được đưa vào plan:

1. **Bảy task nháp là bảy task của plan, cùng số thứ tự.** `accept.ts` là một task riêng (Task 1). Ở Task 1 chưa module nào import nó, nên nó không có file build, và `check:use-client` sẽ báo thiếu file build của nó (như phát hiện 1 của Plan C với `date.ts`). Vì vậy Task 1 không chạy `pnpm build && pnpm check:package`. Từ Task 2, FileUpload import `accept.ts`.
2. **Claude sửa thêm sau subagent** (đã gộp vào commit của task):
   - Task 1: chú thích của `matchesAccept` nói lib tự kiểm mọi tệp được thêm, vì trình duyệt chỉ dùng `accept` để lọc hộp chọn tệp.
   - Task 2: `contain: inline-size` trên cột tên của dòng tệp, và story `Look` bỏ cách lách `minmax(0, 1fr)` (phát hiện 5); giá trị mặc định của `prompt` trong spec có dấu cách ở cuối (phát hiện 3).
   - Task 3: `validate` trả `''` thì tệp được nhận, có test mới viết trước (phát hiện 7); khi kéo, chữ "browse" được ẩn thêm bằng `clip-path`.
   - Task 4: sửa một chú thích CSS đã cũ.
   - Task 5, 6 và 7 được nhận nguyên như subagent viết.
3. **Năm chỗ của spec giai đoạn 3 được sửa hoặc thêm:**
   - §6.3 FileUpload, **Cỡ tệp** (Task 1): thêm đơn vị `gigabyte`, đánh dấu "(phát hiện khi lập Plan D)". Không có nó, một video 2.5 GB đọc là "2,500 MB".
   - §4.3 **FileUpload (F1)** (Task 2): khi `invalid` (cả từ Field), viền đứt nét đổi sang `--flg-danger`, như cạnh khung của các control khác; mockup không vẽ trạng thái này. Đánh dấu "(phát hiện khi lập Plan D)".
   - §6.3 FileUpload, **Mặc định** (Task 2): `count` là ``n === 1 ? "Only 1 file" : `Up to ${n} files` ``, vì "Up to 1 files" sai ngữ pháp ("(phát hiện khi lập Plan D)"). Cùng dòng đó, `prompt` mặc định thành `"Drag and drop files here or "`, có dấu cách ở cuối: chữ "browse" đứng ngay sau nó, như code vẫn làm.
   - §4.4 (Task 4): đoạn **Đã đo ở Plan D** với số đo của bốn cặp FileUpload và ba dòng mới của §4.9 ("(phát hiện khi lập Plan D)"). Spec 0+1 §4.9 có thêm dòng 19, 20, 21, và câu "Cả mười tám điểm" thành "Cả hai mươi mốt điểm".
   - §3.1 (Task 5): một câu mới: mọi control nhận `form` và đưa nó tới mọi phần tử mà control gửi qua, cùng ô gõ của nó (để Enter gửi đúng form đó). Đánh dấu "(phát hiện khi review PR #14)".
   - Task 3, 6 và 7 không sửa dòng spec nào.
4. **`accept.ts`, các lựa chọn khi làm (Task 1):**
   - `formatFileSize` chọn đơn vị trên số **đã làm tròn** tới một chữ số thập phân: 999 960 byte là `1 MB`, không phải `1,000 kB`; 999 940 byte vẫn là `999.9 kB`.
   - Đơn vị là `byte`, `kilobyte`, `megabyte`, `gigabyte`, với `unitDisplay: 'short'` và 1 kB = 1000 byte. `en-US` in đúng `0 byte`, `999 byte`, `1 kB`, `1.5 kB`, `1 MB`, `1.2 MB`, `2.5 GB`; `vi-VN` và `de-DE` in `1,2 MB`.
   - Cỡ âm hoặc không hữu hạn được coi là 0.
   - `matchesAccept`: mỗi token được cắt khoảng trắng và so không phân biệt hoa thường. Phần tham số sau `;` bị bỏ ở cả token lẫn `type` của tệp.
   - Token không phải đuôi (`.pdf`), kiểu MIME (`application/pdf`) hay `type/*` bị bỏ qua (`pdf`, `*`, `image`, token rỗng, một dấu `.` đứng riêng). Không còn token hợp lệ nào, hoặc `accept` là `undefined` hay `''`, thì mọi tệp đều khớp.
   - Tệp có `type` rỗng (tệp kéo thả thường vậy) chỉ khớp được token đuôi.
5. **FileUpload, chọn tệp, danh sách và form (Task 2):**
   - **`form` là prop riêng.** `FileUploadProps` không kế thừa thuộc tính HTML nào, nên `form?: string` được khai báo riêng, như của DatePicker, và gắn vào input gốc. `useFormReset` không cần đối số thứ ba: input gốc tự biết form của nó qua `form`.
   - **Một cơ chế giữ `input.files` đúng.** Một layout effect chạy sau mỗi commit gọi `writeFiles`, ghi danh sách vào input qua `DataTransfer` khi input đang giữ thứ khác. Mỗi thay đổi của người dùng (chọn, huỷ hộp chọn, xoá, reset) ép thêm một commit (`useReducer`). Vì vậy một lần chọn bị huỷ, một component cha controlled từ chối thay đổi, và một lần reset đều trả input về đúng danh sách, không cần nhánh code riêng.
   - `writeFiles` coi hai tệp là một khi cùng đối tượng, hoặc cùng tên, cỡ, kiểu và `lastModified`, để không ghi lại khi input đã giữ đúng danh sách.
   - **Không có `DataTransfer`** (jsdom, engine cũ): lib giữ danh sách của nó và để input như trình duyệt đặt. Sau lần chọn thứ hai, form chỉ gửi lần chọn cuối. Chú thích của `writeFiles` nói điều đó, và có test.
   - Lần chọn mới nối vào cuối danh sách; với `multiple={false}` nó thay danh sách. Một `change` không có tệp (vài engine xoá input khi hộp chọn bị huỷ) giữ nguyên danh sách.
   - Dòng tệp có key từ một `WeakMap<File, string>`, nên cùng một `File` giữ dòng của nó.
   - Sau khi xoá, focus được dời trong cùng layout effect: nút xoá của dòng kế tiếp, nếu không có thì dòng trước, nếu hết dòng thì input gốc. Không dời khi component cha controlled giữ nguyên danh sách.
   - Bấm vào vùng thả mở hộp chọn (`input.click()`) chỉ với nút chuột chính, không khi disabled, và không khi cú bấm trúng `a[href]`, `button`, `input`, `select`, `textarea` hay `label`. Danh sách nằm ngoài vùng thả, nên bấm vào một dòng không bao giờ tới handler này.
   - Input gốc lấy `aria-label={labels.browse}` chỉ khi nằm ngoài Field và không có `aria-label` hay `aria-labelledby`. `aria-describedby` có các id của Field rồi tới id của dòng gợi ý; thẻ `<p>` gợi ý chỉ có khi có `hint`.
   - Cảnh báo dev (§5): `value` có phần tử không phải `File` (bị bỏ); `multiple={false}` mà `value` có hơn một tệp (chỉ tệp đầu được hiện và gửi). Hai kiểm tra này chạy ở mỗi render, nên bản production bỏ qua chúng.
   - **`contain: inline-size` trên `.flg-file-upload-file-main`.** Trong một track grid có cỡ theo nội dung, một tên tệp dài làm cả FileUpload rộng ra: min-content của gốc là cả tên không ngắt. `min-width: 0` của gốc chỉ đủ cho phần tử con của flex. Story `Look` đặt FileUpload trong một track grid thường rộng 360px; thiếu `contain`, `Look` fail ở cả ba engine, có nó thì pass. Bản đầu của story lách bằng `gridTemplateColumns: 'minmax(0, 1fr)'`; Claude bỏ cách lách đó, để story chứng minh cách sửa.
   - Ở Task 2, `maxSize`, `maxFiles`, `validate` và `onReject` đã được khai báo nhưng chưa làm gì (`void [...]`), và các chữ `dropHere`, `type`, `size`, `count`, `rejected` đã có mặc định mà chưa ai đọc. `accept` chỉ tới input (bộ lọc của hộp chọn). Task 3 làm chúng.
   - Vùng live vẫn đọc "N files added" khi component cha controlled từ chối lần chọn (nhỏ, để lại; phát hiện 14).
6. **Test của FileUpload trong jsdom (Task 2, 3):**
   - jsdom không có `DataTransfer`, và setter `input.files` của nó chỉ nhận một `FileList` thật, thứ mà test không dựng được. Test dùng `vi.stubGlobal('DataTransfer', FakeDataTransfer)`, một lớp gom tệp vào một mảng có `item()`, và định nghĩa lại `files` trên `HTMLInputElement.prototype`: getter trả danh sách đã gán (hoặc danh sách gốc của jsdom), setter ghi lại. `afterEach` trả lại thuộc tính gốc.
   - Patch trên prototype thay vì `Object.defineProperty` trên từng input, vì chính lib gán `input.files = ...` và test cần setter ghi nhận việc đó.
   - Hàm `pick(...)` làm như trình duyệt: đặt danh sách của lần chọn vào input rồi phát `change`.
   - Task 3 thêm `dragEvent(type, target, data)`: nó gắn `dataTransfer` vào sự kiện nguyên như truyền vào. `fireEvent` với `dataTransfer` sẽ chép các khoá sang một `new DataTransfer()`, tức bản giả ở trên, mà `dropEffect` và `files` của nó không ghi được.
   - Hành vi thật (`input.files` sau khi chọn và thả, `FormData`, bong bóng `required`) được kiểm trong story, như spec §6.4 nói.
7. **FileUpload, kiểm tra tệp, dòng bị từ chối và kéo thả (Task 3):**
   - Chọn và thả đi chung một đường, `addFiles`. Mỗi tệp được xét theo thứ tự `accept` (`type`), `maxSize` (`size`), `validate` (`custom`), rồi `maxFiles` (`count`). Một tệp gom mọi lỗi nó có; tệp chỉ được nhận khi không có lỗi nào.
   - `maxSize` so `file.size > maxSize`: tệp đúng bằng `maxSize` được nhận. Lời báo là `labels.size(formatFileSize(maxSize, locale))`.
   - **`validate` trả `''` thì tệp được nhận**, như `setCustomValidity('')`: một dòng không có lý do thì chẳng nói được gì. Bản của subagent coi mọi chuỗi là từ chối; Claude sửa, kèm một test fail trước trên bản đó.
   - **`count`** so số tệp đã nhận (các tệp đang giữ, cộng tệp được nhận trước đó trong cùng lượt) với giới hạn. Tệp bị từ chối vì lý do khác không được đếm.
   - **`multiple={false}`:** giới hạn là 1, và tệp đang giữ không được đếm. Tệp đầu của lượt được xét như thường và, nếu được nhận, thay tệp cũ; mọi tệp sau trong lượt bị từ chối với `count` (`labels.count(1)`, "Only 1 file"), kể cả khi tệp đầu bị từ chối. Tệp đầu bị từ chối thì tệp cũ ở lại.
   - **Dòng bị từ chối** là state nội bộ. Chúng đứng sau các dòng được nhận, theo thứ tự đến (quyết định của brief nháp: một `value` controlled không xen được với các dòng nội bộ). Dòng hiện tên và lời báo của lỗi **đầu tiên** thay cho cỡ tệp, mang `data-rejected`, và có nút xoá riêng; xoá nó không đổi gì khác và dời focus như mọi dòng.
   - Dòng bị từ chối không bao giờ vào `value`, `onValueChange` hay `input.files`, nên form không gửi chúng. Reset form xoá chúng. Chúng ở lại tới khi người dùng xoá, cả với `multiple={false}`. Mỗi dòng có id riêng làm key, vì cùng một tệp có thể bị từ chối hai lần.
   - `onValueChange` chỉ được gọi khi có tệp được nhận; `onReject` được gọi một lần cho mỗi lượt có tệp bị từ chối, với mọi lỗi của từng tệp.
   - **Một lời báo cho mỗi lượt:** các phần khác rỗng của `labels.added(n)` và `labels.rejected(n)`, nối bằng `'. '` ("2 files added. 1 file rejected").
   - **Kéo thả:** `dragenter`, `dragover` và `dragleave` chỉ xử lý thứ đang kéo có `"Files"`; kéo một đoạn chữ giữ hành vi của trình duyệt. `drop` luôn bị `preventDefault`, kể cả khi thả trúng input gốc, để trình duyệt không tự thay `input.files`.
   - Bộ đếm `dragenter`/`dragleave` giữ trạng thái kéo khi con trỏ đi qua phần tử con; nó về 0 khi `drop`. `data-dragging` chỉ có khi không disabled. `dragover` đặt `dropEffect` là `'copy'`, khi disabled là `'none'`; khi disabled, thả không thêm gì.
   - Mục là thư mục (`webkitGetAsEntry()?.isDirectory`) bị bỏ qua. Không có `items` thì lib dùng `dataTransfer.files`.
   - Khi kéo, lời nhắc được thay bằng `<span class="flg-file-upload-drop-message">` mang `labels.dropHere`. Chữ "browse" bị ẩn khỏi mắt (tuyệt đối, 1px, `clip-path: inset(50%)`) chứ không bị gỡ, để input đang có focus giữ focus và vẫn ở trong form.
   - Forced colors (§4.5): viền vùng thả khi kéo là `Highlight`; dòng bị từ chối giữ viền `CanvasText`, vì lý do đã được viết bằng chữ.
8. **Ghi chú cho story (Task 2, 3):**
   - Story chọn tệp qua `userEvent.upload` (hộp chọn tệp của Playwright), qua `realUserEvent()`. Cách này chạy ở cả ba engine. Trong giao diện Storybook (không có Playwright), story gán một `DataTransfer` vào input rồi phát `change`.
   - `DropFiles` dựng một `DataTransfer` trong trang và phát `dragenter`, `dragover`, `drop` lên input thật. Firefox và WebKit cũng phát `drop` với nó, nên không engine nào bị bỏ (spec §7 dòng 2).
   - Story không kiểm được `dropEffect`: một `DataTransfer` dựng trong trang giữ `'none'` ở Chromium và WebKit sau khi script đặt nó (Firefox thì đổi). Story kiểm `dragover` bị `preventDefault`; unit test kiểm `'copy'` và `'none'` với một object thường. Một lần kéo thật từ desktop thì không engine nào cho script làm.
   - Play function của `Look` thả hai tệp bị từ chối lên vùng thứ năm và bắt đầu một lần kéo trên vùng thứ sáu, nên ảnh chuẩn có cả dòng bị từ chối lẫn trạng thái đang kéo (spec §7 dòng 5).
   - Cú bấm vào vùng thả chỉ được kiểm trong jsdom (spy trên `input.click`). Hộp chọn tệp mở bằng cú bấm thì story không thấy được.
9. **Tương phản (Task 4).** `check:contrast` đo bốn cặp mới, trên kính thường và trên panel có scrim, giữ số thấp hơn:

   | Check | Sáng | Sáng, contrast-more | Tối | Tối, contrast-more | Ngưỡng |
   |---|---|---|---|---|---|
   | `dropzone-border` | 1.89 (dòng 19) | 7.65 | 1.99 (dòng 19) | 10.43 | 3 |
   | `dropzone-link` | 5.42 | 6.09 | 3.79 (dòng 20) | 7.90 | 4.5 |
   | `file-meta-text` | 7.44 | 7.87 | 3.71 (dòng 21) | 9.13 | 4.5 |
   | `file-error-text` | 7.93 | 8.40 | 5.65 | 11.80 | 4.5 |

   - Ba cặp dưới ngưỡng đúng như mockup F1 vẽ, nên chúng được ghi lại chứ không chỉnh: dòng 19, 20, 21 mới của §4.9, số làm tròn xuống. Bảng §4.9 thành 21 dòng, và `ExceptionTable.test.tsx` đòi 21 dòng.
   - `file-meta-text` tối (3.71) là dòng mới, không phải dòng 6 (chữ mờ, 4.10): chữ nằm trên `--flg-control-bg` của dòng tệp, không trên bề mặt.
   - Dưới `prefers-contrast: more` cả bốn cặp đạt mà không cần CSS mới: token `--flg-dropzone-border` thành màu đặc (§4.2), các token khác đã có giá trị của chế độ này.
   - Nền và chữ của vùng thả khi đang kéo chuyển sang `--flg-selected-bg` và `--flg-selected-text`. Ở chế độ mặc định chúng bằng `--flg-accent-subtle` và `--flg-accent-text`, nên giao diện không đổi; `prefers-contrast: more` đổi chúng sang cặp highlight, như tab `pill` đang chọn (spec §4.4). `preferences.css` không thêm quy tắc nào.
   - Chữ "browse" giữ `--flg-accent-text`; cặp `dropzone-link` đo nó, và nó đạt ở contrast-more.
   - Các dòng 1, 7, 8 và 14 mà spec §4.4 mở rộng sang FileUpload là cùng cặp màu, nên không có check mới.
10. **Cần chủ dự án duyệt (PR hỏi):**
    - Dòng 19 mới, `dropzone-border`: 1.89:1 sáng, 1.99:1 tối, ngưỡng 3:1.
    - Dòng 20 mới, `dropzone-link` tối: 3.79:1, ngưỡng 4.5:1.
    - Dòng 21 mới, `file-meta-text` tối: 3.71:1, ngưỡng 4.5:1.
    - Cả ba đúng như mockup F1 vẽ, và đều đạt dưới `prefers-contrast: more` (7.65 và 10.43; 7.90; 9.13).
11. **`form` cho năm control (Task 5):**
    - NumberInput: `form` vốn đã tới ô hiển thị qua các prop còn lại; nay tới cả input ẩn mang số. Prop được khai báo kèm JSDoc.
    - Slider: prop `form` mới, tới mọi input ẩn; `useFormReset(controlRef, …, form)`.
    - SegmentedControl: prop `form` mới, qua context tới từng radio; `form` riêng của một `SegmentedControlItem` thắng (`props.form ?? group?.form`). `useFormReset(rootRef, …, form)`.
    - Combobox: prop `form` mới, tới ô nhập (để Enter gửi đúng form đó) và `<select>` ẩn.
    - Select: prop `form` mới, chỉ tới `<select>` gốc ẩn: nút trigger không phải nút submit.
    - **`useFormReset(elementRef, onReset, form?)`.** Một `<div>` không có `.form` theo thuộc tính `form`. Khi có id, form là phần tử `document.getElementById(id)` nếu nó là `<form>`, nếu không thì không có form nào. Effect đăng ký lại khi id đổi. Không có id thì như cũ: `.form` của control, hoặc `closest('form')`. Shadow root không được xử lý (nhỏ, để lại; phát hiện 14).
    - Test Enter của Combobox kiểm `input.form` và Enter trên listbox đóng không bị `preventDefault`: jsdom không tự gửi form.
    - JSDoc của `form` ở mỗi component nói nó tới phần tử nào, như của DatePicker; trang MDX của mỗi component có một câu ở phần form.
12. **Fixtures (Task 6):**
    - `vite-app`: `src/Inputs.tsx`, render từ `App.tsx`. `onSubmit` chặn gửi, đọc `new FormData(form)` và ghi các giá trị (tên tệp cho tệp) vào `<output data-testid="submitted">` dạng JSON. `vite preview` chỉ phục vụ tệp tĩnh, nên app này không có server nhận POST (spec §7).
    - `next-app`: client component `app/inputs.tsx` gửi form tới Server Action `book` của `app/actions.ts` (`'use server'`) qua `useActionState`; trang (Server Component) ghép nó như các phần client khác.
    - Calendar có trên trang (không `today`) nhưng không gửi gì; bảy control còn lại gửi giá trị.
    - Script thêm tám gốc vào `COMPONENTS` (`.flg-slider`, `.flg-number-input`, `.flg-segmented`, `.flg-combobox`, `.flg-tag-input`, `.flg-file-upload`, `.flg-calendar`, `.flg-date-picker`) và hàm `checkInputs`.
    - **Combobox cần ArrowDown trước Enter:** gõ chữ không bao giờ trỏ một option, mà Enter chỉ chọn option đang được trỏ.
    - **DatePicker được chốt bằng Tab:** Enter với một ngày đọc được cũng gửi form (spec §7).
    - Lần chạy đầu của bản nháp fail ở đúng hai bước đó (`city` rỗng, và "submitted too early"); script trong plan đã có cách sửa.
    - Next trả giá trị đơn dạng chuỗi, còn vite trả mảng một phần tử. Script so qua `[x].flat()` (nhỏ, để lại; phát hiện 14).
    - Fixture nằm ngoài lint và `tsc` của gốc repo. Chúng được kiểm kiểu bởi `npm run typecheck` (vite) và `next build`, cả hai do script chạy.
13. **Docs và changeset (Task 7):**
    - Getting started, "Build a form": giữ nội dung cũ, thêm bốn ý của §8 và một ví dụ `BookingForm` (NumberInput, DatePicker với `weekStartsOn`, Slider với `getValueText`, Combobox). Khối code trong MDX là chữ, không được biên dịch; Claude đã kiểm kiểu ví dụ với `src/index` (Step 4 của Task 7 làm lại việc đó).
    - Accessibility: mục mới "Advanced inputs" (`aria-valuetext` của Slider, số kết quả của Combobox, tên ngày đầy đủ của Calendar, vùng live của từng component). Claude kiểm các ý với code: `labels.results` của Combobox, bong bóng của Slider là `aria-hidden`.
    - Bảng §4.9 của trang Accessibility do `ExceptionTable` dựng từ `KNOWN_EXCEPTIONS`, nên dòng 15 đến 21 đã có; trang không thêm bảng.
    - `.changeset/phase-3-inputs.md`: `minor` cho `h2d-glass-ui`, liệt kê tám component, `form` của các control (và của Select), `aside` của `Field`; không có thay đổi phá vỡ.
14. **Các mục để lại** (không làm ở plan này):
    - Vùng live của FileUpload vẫn đọc "N files added" khi component cha controlled từ chối lần chọn (Task 2).
    - `useFormReset` tìm form theo id bằng `document.getElementById`, nên không thấy form trong shadow root khác (Task 5).
    - Fixture next trả giá trị đơn dạng chuỗi, vite trả mảng (Task 6).
    - Kiểm tra screen reader (§7 dòng 6): input file gốc của FileUpload và các vùng live chưa thử với NVDA và VoiceOver.
    - Safari thật chưa thử; story chỉ chạy WebKit của Playwright.
15. **Chỗ bước fail-first không đầy đủ**, theo các báo cáo của bản nháp:
    - Task 1: cả file test fail vì `./accept` chưa có; không test nào được thấy fail vì lý do riêng.
    - Task 2: bản nháp chạy test với một `FileUpload` giả render `<div />`: 51 trong 53 test fail. Hai test pass trên bản giả là kiểm tra phủ định: `has no describedby when there is nothing to describe it` và `has no state attributes at rest`.
    - Task 3: 29 trong 38 test mới fail trên code của Task 2. Test thứ 39, `accepts a file when validate returns an empty string, as setCustomValidity('') does`, do Claude thêm sau: nó fail trên bản Task 3 của subagent, và pass trên code của Task 2 (ở đó `validate` chưa làm gì). Các test pass trên code cũ được nêu ở Step 2 của Task 3.
    - Task 4: bước fail-first của bản nháp là `pnpm check:contrast` với bốn check mới và chưa có dòng ngoại lệ (4 lỗi). Báo cáo nháp không ghi lỗi của `ExceptionTable.test.tsx`; các dòng "Expected" của test đó được suy ra từ patch khi lập plan.
    - Task 5: cả 10 test mới fail trên code cũ; các test của prop mới còn fail kiểm kiểu.
    - Task 6: không có unit test; kiểm tra là script fixture, nằm trong khối code (phát hiện 12).
    - Task 7: chỉ có docs, không có test fail trước.
    - Trên cây của plan, test patch của Task 1 và 2 fail vì module chưa tồn tại (`Failed to resolve import …`).
16. **Ảnh chuẩn của component cũ không đổi.**
    - Task 2 thêm `file-upload.css`, một token mới mà không gì cũ đọc (`--flg-dropzone-border`), một selector trong khối forced colors, một `@import`, và các dòng trong danh sách đăng ký.
    - Task 3 và 4 chỉ đổi CSS của FileUpload, cùng hai selector `.flg-file-upload*` trong khối forced colors.
    - Task 5 chỉ thêm thuộc tính `form`, và chỉ khi prop được truyền: React không render thuộc tính có giá trị `undefined`, và không CSS hay markup nào khác đổi. Bản nháp suy ra điều này từ diff, không render so trước và sau.
    - Bản nháp không chạy so sánh pixel (ảnh chuẩn cần Docker); CI visual xác nhận.

**Phạm vi:**
- **Không làm ở plan này:**
  - Tải tệp lên server, tiến độ từng tệp, xem trước ảnh, thả cả thư mục (spec §2, ngoài phạm vi).
  - Publish `0.3.0`: changeset sẵn sàng, việc publish là quyết định của chủ dự án (spec §9 mục 5).
  - Các mục để lại ở phát hiện 14.
- **Ảnh chuẩn visual:**
  - Story có ảnh: chỉ `Look` của FileUpload, với vùng trống có gợi ý, hai tệp (một tên dài), invalid, disabled, dòng bị từ chối, đang kéo, và trong một Field. Các story khác của FileUpload gắn `no-visual`.
  - `Look` có 8 ảnh (4 chế độ × sáng, tối).
  - Không tạo ảnh trên Windows. Ảnh chuẩn của FileUpload chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh.
  - Năm component nhận `form` ở Task 5, và mọi component khác, phải giữ ảnh giống từng byte.

## Global Constraints

- Tên package `h2d-glass-ui`; chỉ ESM; `exports` gồm `.` và `./styles.css`; `"sideEffects": ["**/*.css"]`.
- `pnpm check:name` fail khi tên cũ xuất hiện lại ngoài `docs/superpowers`. Import trong trang MDX và fixture dùng `'h2d-glass-ui'`.
- Cảnh báo dev bắt đầu bằng `[h2d-glass-ui]`: `devWarn` thêm `WARN_PREFIX` của `src/internal/warn.ts`. Test so cả câu cảnh báo thì đọc `WARN_PREFIX`, không viết tay tiền tố.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`). Plan này không thêm dependency.
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`. `new DataTransfer()` và việc gán `input.files` có ở mọi trình duyệt của mốc này (spec §10).
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Biến thể và trạng thái dùng data-attribute (`data-dragging`, `data-rejected`, `data-invalid`, `data-disabled`...).
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS component nằm trong `@layer flg.components`; quy tắc `forced-colors` và `prefers-contrast: more` nằm trong `src/styles/preferences.css`.
- **Mockup lock.** Không giá trị token nào đang có trong `src/styles/theme/values.ts` đổi. Plan D thêm đúng một token dẫn xuất, `--flg-dropzone-border` (spec §4.2), viết như `slider-tick` của Plan A; chạy `pnpm gen:theme` sau khi sửa `values.ts`. Component cũ phải giữ ảnh giống từng byte. FileUpload theo đúng F1, kể cả ba cặp dưới ngưỡng (phát hiện 9, 10).
- **Giá trị của FileUpload là `File[]`.** Dòng bị từ chối là state nội bộ, không bao giờ vào `value`, `onValueChange` hay `input.files`.
- Mọi component dùng `forwardRef`, export kiểu props của nó, và export phẳng từ `src/index.ts` (có trong `src/index.test.ts`). Module client bắt đầu bằng `"use client"` và có trong `scripts/check-use-client.ts`; class CSS mới có trong `scripts/check-dist-css.ts`.
- Chữ mặc định do lib cung cấp bằng tiếng Anh, ghi đè được qua `labels`. Cảnh báo dev đi qua `devWarn`. Lib không throw khi người dùng dùng sai. Trang docs (`*.mdx`) viết bằng tiếng Anh.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm, **không** push lên `main`, giữ `"private": true`. `main` được bảo vệ: plan kết thúc bằng một PR.
- **Changeset:** Plan D tạo `.changeset/phase-3-inputs.md`, `minor`, cho `0.3.0` (Task 7). Không task nào khác thêm changeset.
- **Ngưỡng `size-limit`:**
  - Ngưỡng ban đầu (do Plan C ghi): JS 45038 B, CSS 8880 B.
  - Task 1 không build (phát hiện 1). Task 2 và 3 chạy `pnpm build && pnpm check:package` và pass hoàn toàn. Theo lần chạy nháp: sau Task 2 JS 42.66 kB, CSS 8.36 kB; sau Task 3 JS 43.37 kB, CSS 8.48 kB.
  - Chỉ Task 4 chạy `pnpm size:record` và commit `.size-limit.json`. Plan không chép file này: `size:record` tự ghi ngưỡng. Kết quả ở bản nháp: JS 47580 B, CSS 9311 B.
  - Task 5 đến 7 nằm trong ngưỡng mới; ở đầu nhánh nháp JS 43.34 kB, CSS 8.46 kB.
- Trước mọi lệnh `pnpm vitest run --project storybook-*` chạy thẳng, chạy `pnpm gen:theme`. Lần chạy story đầu có thể fail với `Failed to import test file …` khi Vite tối ưu lại; chạy lại.
- **Không chạy cả bộ story một lượt trên máy thiếu bộ nhớ.** Chạy từng thư mục một, như các lệnh trong plan. CI chạy cả bộ. Không chạy hai lượt story cùng lúc.
- **Cổng 5173 và 4173 thuộc các app khác của chủ dự án**: không dùng, không tắt tiến trình đang giữ chúng. **Không chạy thẳng `pnpm test:fixtures`** trên máy này: fixture chạy qua một bản sao tạm của `scripts/test-fixtures.mjs` ở cổng 5174/4175, như Step 4 của Task 6 ghi. Xoá bản sao sau khi chạy; bản sao không bao giờ được commit. Storybook chạy tạm (nếu cần) dùng cổng khác. Không để server hay tiến trình Storybook chạy sót.
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows. Ảnh chuẩn của FileUpload đến từ workflow "Update visual baselines" sau khi đẩy nhánh; ảnh của năm component ở Task 5 không được đổi.
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.

**Cách áp patch.**
- Mọi file, kể cả file mới, được đưa dưới dạng patch (`git diff`). Lưu nguyên khối patch vào một file **ngoài** repo (ví dụ `../task.patch`), giữ LF, rồi chạy `git apply ../task.patch` ở gốc repo.
- Nếu `git apply` báo lỗi thì dừng lại và báo cáo: nghĩa là cây đang khác với cây mà plan đã chạy thử.
- Task 1 đến 5 có hai khối patch (test rồi code); Task 6 và 7 chỉ có khối code. Áp theo đúng thứ tự trong plan. Khối code của Task 4 được áp làm hai lần (`--include`, rồi `--exclude`), như Step 2 và Step 3 của Task 4 ghi.
- Khối code của Task 2, 3 và 7 có dòng bắt đầu bằng ba dấu backtick (khối code trong spec và MDX), nên chúng được rào bằng bốn dấu backtick. Nội dung patch là các dòng giữa hai hàng rào, như mọi khối khác.
- Task 3 và 4 sửa các file FileUpload mà Task 2 tạo (gồm test và story của Task 2). Task 1, 2, 4 và 5 cùng sửa spec giai đoạn 3; Task 2 và 3 cùng sửa `preferences.css` và `scripts/check-dist-css.ts`. Patch đã tính sẵn điều đó nếu áp đúng thứ tự.
- Plan này không xoá file nào.

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý. Mỗi dòng có test ở task tương ứng:

1. **Chọn tệp hai lần rồi gửi một form thường.** Form phải gửi tệp của cả hai lần chọn, dù trình duyệt đã thay `input.files` bằng lần chọn sau; tệp đã xoá thì không gửi; reset đưa danh sách về `defaultValue`. Test ở Task 2:
   - `adds a second pick to the first, and gives onValueChange the whole list` và `writes the whole list into input.files after every pick, not the last pick alone`;
   - `removes the row, tells onValueChange the rest and writes the rest into input.files` và `puts an uncontrolled FileUpload back to defaultValue when the form is reset`;
   - ba engine: story `Picking` và `InAForm` (hộp chọn tệp của Playwright, `FormData` đọc trong listener `submit` sau hai lần chọn, sau khi xoá và sau khi reset);
   - engine không có `DataTransfer`: `keeps its list and leaves the input as the browser set it where there is no DataTransfer`.
2. **Thả một thư mục, một PDF và một PNG lên FileUpload `accept=".pdf"`.** Thư mục bị bỏ qua; PDF được nhận; PNG thành một dòng bị từ chối "File type not supported", không vào `input.files` hay `FormData`; vùng live nói một câu; trình duyệt không tự thay `input.files`. Test ở Task 3: `skips a dropped folder`, `judges a dropped file with no type by its extension against accept`, `puts the rejected files of a drop in rows and tells onReject`, `keeps them out of value and out of input.files, after the accepted rows in order`, `says both in one sentence joined by a full stop` và `stops the browser from taking a file dropped on the input itself`; story `DropFiles` (ba engine, PDF và PNG; thư mục chỉ có ở unit test, vì một `DataTransfer` dựng trong trang không chứa được thư mục).
3. **FileUpload có một tên tệp dài, trong một cột hẹp.** Tên kết thúc bằng "…" trên một dòng, và FileUpload không làm cột rộng ra. Chỉ story bắt được điều này (jsdom không có layout): `Look` đặt FileUpload trong một track grid thường rộng 360px, và kiểm `textOverflow: ellipsis` cùng `scrollWidth > clientWidth` của tên. Thiếu `contain: inline-size`, story fail ở cả ba engine (phát hiện 5).
4. **Slider nằm ngoài `<form>` của nó, với `form="f"`, rồi form được reset.** Input ẩn mang `form`, `FormData` có giá trị, và reset tới được Slider dù gốc của nó là `<div>`. Test ở Task 5: `sends form to every hidden input, so a slider outside its form submits there and follows its reset`; cho hook: `listens to a form outside the tree of the element, a div that has no form of its own`, `prefers the id to the form that holds the element`, `listens to no form when the id names none, or names an element that is not a form` và `moves to the new form when the id changes, and leaves the old one`. SegmentedControl có cùng đường: `sends form to every radio, so a group outside its form submits there and follows its reset`.
5. **Server Action của fixture Next nhận các giá trị của form tám component.** Bảy control gửi: `budget` `25` và `75`, `guests` `4`, `view` `list`, `city` `hue`, `tags` `alpha` và `beta`, `files` `one.txt` và `two.txt`, `checkIn` `2026-11-14`; Calendar có trên trang nhưng không gửi. Test ở Task 6: `checkInputs` của `scripts/test-fixtures.mjs`, chạy cả bản production và development của hai app, qua bản sao tạm ở cổng 5174/4175. Console phải sạch.

Một chỗ **chỉ story bắt được**: tên tệp dài làm FileUpload rộng ra (tình huống 3). Mọi unit test pass cả khi không có `contain: inline-size`.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/components/file-upload/accept.ts` (và test) | `matchesAccept`, `formatFileSize` (Task 1) |
| `src/components/file-upload/*`, `src/styles/components/file-upload.css` | `FileUpload`: chọn tệp, danh sách, form (Task 2); kiểm tra tệp, dòng bị từ chối, kéo thả (Task 3); màu khi kéo (Task 4) |
| `src/styles/theme/values.ts` | Token `--flg-dropzone-border` (Task 2) |
| `src/styles/preferences.css`, `src/styles/index.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts` | Đăng ký, export, forced colors (Task 2, 3) |
| `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `src/docs/ExceptionTable.test.tsx`, spec 0+1 §4.9 | Bốn cặp tương phản, dòng 19 đến 21 (Task 4) |
| `.size-limit.json` | Ngưỡng mới (Task 4) |
| `src/internal/use-form-reset.ts` (và test); `src/components/number-input`, `slider`, `segmented-control`, `combobox`, `select` | `form` tới phần tử gửi của năm control (Task 5) |
| `fixtures/vite-app/src/Inputs.tsx`, `App.tsx`; `fixtures/next-app/app/inputs.tsx`, `actions.ts`, `page.tsx`; `scripts/test-fixtures.mjs` | Form tám component, `checkInputs` (Task 6) |
| `src/docs/GettingStarted.mdx`, `src/docs/Accessibility.mdx`, `.changeset/phase-3-inputs.md` | Docs chung, changeset `0.3.0` (Task 7) |
| `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md` | Các dòng "phát hiện khi lập Plan D" (Task 1, 2, 4) và "phát hiện khi review PR #14" (Task 5) |

---

### Task 1: `accept.ts`, khớp `accept` và viết cỡ tệp

Spec §5 (dòng `file-upload/accept.ts`), §6.3 **`FileUpload`** ý **Cỡ tệp**, §7 dòng 1 (`accept.ts`). FileUpload kiểm `accept` và viết cỡ tệp qua module này.
- Hàm thuần. File không có `"use client"`, không import React, không được export từ `src/index.ts`. Viết theo `src/internal/number.ts` và `src/components/tag-input/split-tags.ts`.
- `matchesAccept` theo luật của thuộc tính `accept` gốc; `formatFileSize` qua `numberFormat` của `src/internal/intl.ts`, chọn đơn vị sau khi làm tròn (phát hiện 4).
- Spec §6.3 **Cỡ tệp** được sửa: thêm `gigabyte` (phát hiện 3).
- Không chạy `pnpm build && pnpm check:package` ở task này (phát hiện 1).

**Files:**
- Create: `src/components/file-upload/accept.ts`, `src/components/file-upload/accept.test.ts`
- Modify: `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md` (§6.3, **Cỡ tệp**)

**Interfaces:**
- Produces trong `src/components/file-upload/accept.ts` (thuần, không `"use client"`):
  - `matchesAccept(file: { name: string; type: string }, accept: string | undefined): boolean`: tệp có qua `accept` không, theo luật của thuộc tính gốc (đuôi `.pdf`, kiểu MIME, `type/*`; không phân biệt hoa thường; tệp không có `type` chỉ khớp đuôi). `accept` rỗng hoặc không còn token hợp lệ thì mọi tệp khớp.
  - `formatFileSize(bytes: number, locale: string): string`: `1.5 kB`, `2.5 GB` theo locale; 1 kB = 1000 byte; cỡ âm hoặc không hữu hạn đọc là 0.
- Consumes: `numberFormat` của `src/internal/intl.ts` (bộ nhớ đệm `Intl` dùng chung, từ review PR #14).

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/file-upload/accept.test.ts b/src/components/file-upload/accept.test.ts
new file mode 100644
index 0000000..df46be4
--- /dev/null
+++ b/src/components/file-upload/accept.test.ts
@@ -0,0 +1,88 @@
+import { describe, expect, it } from 'vitest';
+import { formatFileSize, matchesAccept } from './accept';
+
+const file = (name: string, type = '') => ({ name, type });
+
+describe('matchesAccept', () => {
+  it('matches an extension token against the end of the name, ignoring case', () => {
+    expect(matchesAccept(file('A.PDF', 'application/pdf'), '.pdf')).toBe(true);
+    expect(matchesAccept(file('a.png', 'image/png'), '.pdf')).toBe(false);
+    expect(matchesAccept(file('a.pdf.png', 'image/png'), '.pdf')).toBe(false);
+  });
+
+  it('matches a multi-dot extension token', () => {
+    expect(matchesAccept(file('x.tar.gz'), '.tar.gz')).toBe(true);
+    expect(matchesAccept(file('x.gz'), '.tar.gz')).toBe(false);
+  });
+
+  it('matches a type/* token against the type of the file', () => {
+    expect(matchesAccept(file('a.png', 'image/png'), 'image/*')).toBe(true);
+    expect(matchesAccept(file('a.pdf', 'application/pdf'), 'image/*')).toBe(false);
+  });
+
+  it('matches a type/subtype token exactly, ignoring parameters after ";"', () => {
+    expect(matchesAccept(file('a.pdf', 'application/pdf'), 'application/pdf')).toBe(true);
+    expect(matchesAccept(file('a.txt', 'text/plain;charset=utf-8'), 'text/plain')).toBe(true);
+    expect(matchesAccept(file('a.txt', 'text/plain'), 'text/plain;charset=utf-8')).toBe(true);
+    expect(matchesAccept(file('a.png', 'image/png'), 'image/jpeg')).toBe(false);
+  });
+
+  it('compares MIME tokens case-insensitively', () => {
+    expect(matchesAccept(file('a.png', 'image/png'), 'IMAGE/*')).toBe(true);
+    expect(matchesAccept(file('a.png', 'IMAGE/PNG'), 'image/png')).toBe(true);
+  });
+
+  it('lets a file with an empty type match only extension tokens', () => {
+    expect(matchesAccept(file('a.png'), 'image/*')).toBe(false);
+    expect(matchesAccept(file('a.png'), 'image/png')).toBe(false);
+    expect(matchesAccept(file('a.png'), '.png')).toBe(true);
+  });
+
+  it('matches when any token of the list matches, trimming each token', () => {
+    expect(matchesAccept(file('a.pdf', 'application/pdf'), 'image/*,  .pdf ')).toBe(true);
+    expect(matchesAccept(file('a.txt', 'text/plain'), 'image/*, .pdf')).toBe(false);
+  });
+
+  it('ignores tokens that are no extension and no MIME type', () => {
+    expect(matchesAccept(file('a.png', 'image/png'), 'pdf, image, .jpg')).toBe(false);
+    expect(matchesAccept(file('a.png', 'image/png'), 'pdf, *, , image/png')).toBe(true);
+  });
+
+  it('matches every file when no valid token is left', () => {
+    expect(matchesAccept(file('a.png', 'image/png'), 'pdf, *, image, ,')).toBe(true);
+  });
+
+  it('matches every file when accept is undefined or empty', () => {
+    expect(matchesAccept(file('a.png', 'image/png'), undefined)).toBe(true);
+    expect(matchesAccept(file('a.png', 'image/png'), '')).toBe(true);
+  });
+});
+
+describe('formatFileSize', () => {
+  it.each([
+    [0, '0 byte'],
+    [999, '999 byte'],
+    [1000, '1 kB'],
+    [1500, '1.5 kB'],
+    [999_960, '1 MB'],
+    [1_200_000, '1.2 MB'],
+    [2_500_000_000, '2.5 GB'],
+  ])('writes %i bytes as "%s" in en-US', (bytes, text) => {
+    expect(formatFileSize(bytes, 'en-US')).toBe(text);
+  });
+
+  it('keeps 999 940 bytes in kilobytes, since it rounds to 999.9 kB', () => {
+    expect(formatFileSize(999_940, 'en-US')).toBe('999.9 kB');
+  });
+
+  it('uses the decimal separator of the locale', () => {
+    expect(formatFileSize(1_200_000, 'vi-VN')).toMatch(/^1,2\s+MB$/);
+    expect(formatFileSize(1_200_000, 'de-DE')).toMatch(/^1,2\s+MB$/);
+  });
+
+  it('treats negative and non-finite sizes as 0', () => {
+    expect(formatFileSize(-5, 'en-US')).toBe('0 byte');
+    expect(formatFileSize(Number.NaN, 'en-US')).toBe('0 byte');
+    expect(formatFileSize(Number.POSITIVE_INFINITY, 'en-US')).toBe('0 byte');
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit src/components/file-upload/accept.test.ts
```

Expected: FAIL cả file, nên 20 test không chạy được: `Error: Failed to resolve import "./accept" from "src/components/file-upload/accept.test.ts". Does the file exist?`. Không test nào được thấy fail vì lý do riêng (phát hiện 15). `accept.test.ts` là file `.ts`, nên chỉ project `unit` chạy nó: `unit-react18` chỉ nhận `*.test.tsx`.

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
index 99871d9..063b8b5 100644
--- a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
+++ b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
@@ -907,7 +907,7 @@ type FileUploadProps = {
   - Tệp được nhận: tên, cỡ (`formatFileSize`), nút xoá `labels.remove(name)`.
   - Tệp bị từ chối: tên, lời báo lỗi đầu tiên, nút xoá; nằm trong danh sách cho tới khi người dùng xoá. Dòng bị từ chối là state nội bộ, không thuộc `value` (Claude chốt).
   - Sau khi xoá một dòng, focus sang nút xoá của dòng kế tiếp, nếu không có thì dòng trước, nếu hết dòng thì về input gốc (Claude chốt).
-- **Cỡ tệp:** `Intl.NumberFormat(locale, { style: "unit", unit, maximumFractionDigits: 1 })`, với `unit` là `byte`, `kilobyte` hoặc `megabyte`. Lib dùng 1 kB = 1000 byte, khớp tên đơn vị của `Intl` (Claude chốt).
+- **Cỡ tệp:** `Intl.NumberFormat(locale, { style: "unit", unit, maximumFractionDigits: 1 })`, với `unit` là `byte`, `kilobyte`, `megabyte` hoặc `gigabyte` (phát hiện khi lập Plan D: một video trên 1 GB sẽ đọc là "2,500 MB"). Lib dùng 1 kB = 1000 byte, khớp tên đơn vị của `Intl` (Claude chốt).
 - **`value` controlled:** lib gán `value` vào `input.files` qua `DataTransfer` sau mỗi commit, để form gửi đúng các tệp đang hiện.
 - **Form, Field:** §3.1, §3.2.
 
diff --git a/src/components/file-upload/accept.ts b/src/components/file-upload/accept.ts
new file mode 100644
index 0000000..8247ca1
--- /dev/null
+++ b/src/components/file-upload/accept.ts
@@ -0,0 +1,60 @@
+import { numberFormat } from '../../internal/intl';
+
+/**
+ * Whether a file passes an `accept` string, by the rules of the native attribute: a comma-separated
+ * list of extensions (`.pdf`), MIME types (`application/pdf`) and MIME wildcards (`image/*`), all
+ * compared without regard to case. The library checks every added file itself: the browser uses
+ * `accept` only as the file dialog's filter, which the user can switch to all files, and not on a drop.
+ *
+ * A token that is none of the three (`pdf`, `*`, `image`, an empty one) is ignored, as browsers
+ * ignore it; when no valid token is left, every file matches. A file with no `type` (dropped files
+ * often have none) can match only an extension token.
+ */
+export function matchesAccept(
+  file: { name: string; type: string },
+  accept: string | undefined,
+): boolean {
+  if (!accept) return true;
+
+  const name = file.name.toLowerCase();
+  // Parameters such as `;charset=utf-8` are no part of the type that a token names.
+  const type = file.type.split(';')[0]!.trim().toLowerCase();
+
+  let valid = false;
+  for (const raw of accept.split(',')) {
+    const token = raw.split(';')[0]!.trim().toLowerCase();
+    if (token.length > 1 && token.startsWith('.')) {
+      valid = true;
+      if (name.endsWith(token)) return true;
+      continue;
+    }
+    const slash = token.indexOf('/');
+    if (slash <= 0 || slash === token.length - 1) continue;
+    valid = true;
+    if (type === '') continue;
+    if (token.endsWith('/*') ? type.startsWith(token.slice(0, -1)) : type === token) return true;
+  }
+  return !valid;
+}
+
+const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const;
+
+/**
+ * A file size for the locale: `1.5 kB`, `2.5 GB`. 1 kB is 1000 bytes, as the unit names of `Intl`
+ * say. The unit is picked on the value after rounding to one decimal, so 999 960 bytes reads
+ * `1 MB` and not `1,000 kB`. A negative or non-finite size is no File size; it reads as 0.
+ */
+export function formatFileSize(bytes: number, locale: string): string {
+  let value = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
+  let unit = 0;
+  while (unit < UNITS.length - 1 && Math.round(value * 10) / 10 >= 1000) {
+    value /= 1000;
+    unit += 1;
+  }
+  return numberFormat(locale, {
+    style: 'unit',
+    unit: UNITS[unit],
+    unitDisplay: 'short',
+    maximumFractionDigits: 1,
+  }).format(value);
+}
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit src/components/file-upload/accept.test.ts
```

Expected: 1 file, 20 test PASS (`matchesAccept` 10; `formatFileSize` 10, trong đó 7 dòng của `it.each`). Chuỗi in ra là của `Intl` thật ở `en-US`, `vi-VN` và `de-DE` (phát hiện 4). Không chạy `pnpm build && pnpm check:package`: chưa module nào import `accept.ts` (phát hiện 1). Không component, CSS hay output nào đổi, nên ảnh chuẩn giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md \
  src/components/file-upload/accept.test.ts \
  src/components/file-upload/accept.ts
```
```bash
git commit -m "feat(file-upload): accept matching and file size formatting helpers" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 2: `FileUpload`, chọn tệp, danh sách và form (giao diện F1)

Spec §3.1 (dòng FileUpload, ý reset của FileUpload), §3.2 (dòng FileUpload), §3.4 (`locale`), §3.6, §4.2 (`--flg-dropzone-border`), §4.3 **FileUpload (F1)** trừ **Khi đang kéo tệp qua** và **Dòng bị từ chối**, §4.5 **FileUpload** (viền đứt nét), §5 (`accept.ts`, cảnh báo dev của FileUpload), §6.1, §6.3 **`FileUpload`** trừ **Kéo thả** và các bước kiểm tra của **Thêm tệp**, §6.4 (`DataTransfer`), §7 dòng 1 đến 3, §8 (trang FileUpload). Một vùng thả lớn có chữ "browse" và danh sách tệp bên dưới. Dựng theo TagInput (dòng có nút xoá, focus sau khi xoá, vùng live) và DatePicker (`form`, reset form).
- **Phạm vi:** ở task này tệp chỉ đến từ hộp chọn (`change` của input gốc), và mọi tệp được nhận. Toàn bộ `FileUploadProps` và `FileRejection` của §6.3 (cùng `form`) được khai báo ngay, để API chỉ viết một lần; Task 3 làm các prop kiểm tra, `onReject` và kéo thả.
- **Cấu trúc** như HTML của §6.3: gốc `div.flg-file-upload`; vùng thả với icon, lời nhắc chứa chữ "browse" và input gốc phủ trên chữ đó (`opacity: 0`, `title=""`), dòng gợi ý; `<ul>` chỉ khi có dòng; vùng live của `useAnnounce`. `ref`, `id`, `aria-*`, `name`, `accept`, `multiple`, `required`, `disabled` và `form` lên input gốc; `className` và `style` lên gốc.
- **Vòng focus** vẽ trên chữ "browse" qua `:has(> input:focus-visible)`.
- **Dòng tệp:** `FileIcon` 16px, tên (một dòng, kết thúc bằng "…"), cỡ (`formatFileSize(file.size, locale)`), và `IconButton` `ghost` `sm` với `CloseIcon` 14px, tên `labels.remove(file.name)`.
- **Thêm, xoá, controlled, reset:** một layout effect ghi danh sách vào `input.files` sau mỗi commit (phát hiện 5). `useControllableState` tên `'FileUpload value'`, mặc định `[]`. `useFormReset` trên input gốc: uncontrolled về `defaultValue`, controlled ghi lại `value`; reset bị huỷ thì không làm gì.
- **Field:** `useFieldProps`, `markAsFieldControl`; `invalid` cho `aria-invalid` trên input và `data-invalid` trên gốc; viền đứt nét đổi sang `--flg-danger` (phát hiện 3).
- **Disabled:** input và nút xoá `disabled`; bấm vào vùng thả không làm gì; vùng thả `opacity: .5`, `cursor: not-allowed`.
- **Giao diện F1** (§4.3), theme sáng và tối. Vùng thả có dòng thì cao tối thiểu 0, padding 12px. Token `--flg-dropzone-border` (mặc định 45% `--flg-text-muted`, đặc ở `prefers-contrast: more`) được thêm vào `values.ts` như `slider-tick`, rồi chạy `pnpm gen:theme`. Forced colors: viền đứt nét `CanvasText`.
- Các lựa chọn khi làm ở phát hiện 5, 6 và 8. Spec §4.3 và §6.3 **Mặc định** được sửa (phát hiện 3).

**Files:**
- Create: `src/components/file-upload/FileUpload.tsx`, `index.ts`, `FileUpload.test.tsx`, `FileUpload.test-d.ts`, `FileUpload.stories.tsx`, `FileUpload.mdx`, `src/styles/components/file-upload.css`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `src/styles/theme/values.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md`

**Interfaces:**
- Produces trong `src/components/file-upload/FileUpload.tsx` (client), export qua `index.ts` và `src/index.ts`:
  - `FileUpload`: `markAsFieldControl(forwardRef<HTMLInputElement, FileUploadProps>)`; `ref` là input gốc.
  - `FileUploadProps`: `value?: File[]`, `defaultValue?: File[]`, `onValueChange?: (files: File[]) => void`, `accept`, `multiple` (mặc định `true`), `maxSize`, `maxFiles`, `validate?: (file: File) => string | null`, `onReject?: (rejections: FileRejection[]) => void`, `disabled`, `required`, `invalid`, `name`, `form`, `locale` (mặc định `'en-US'`), `hint?: ReactNode`, `id`, `className`, `style`, `aria-label`, `aria-labelledby`, `aria-describedby`, `labels`. Ở task này `maxSize`, `maxFiles`, `validate` và `onReject` chưa làm gì.
  - `FileUploadLabels`: `prompt` (`"Drag and drop files here or "`), `browse` (`"browse"`), `dropHere` (`"Drop files to upload"`), `remove(name)` (`"Remove <name>"`), `type` (`"File type not supported"`), `size(max)` (`"File is larger than <max>"`), `count(max)` (`"Only 1 file"` khi `max` là 1, nếu không `"Up to <max> files"`), `added(count)` (`"1 file added"`, `"<n> files added"`), `rejected(count)` (`"1 file rejected"`, `"<n> files rejected"`).
  - `FileRejection`: `{ file: File; errors: { code: 'type' | 'size' | 'count' | 'custom'; message: string }[] }`.
  - Class: `flg-file-upload`, `flg-file-upload-zone`, `flg-file-upload-icon`, `flg-file-upload-prompt`, `flg-file-upload-browse`, `flg-file-upload-hint`, `flg-file-upload-list`, `flg-file-upload-file`, `flg-file-upload-file-icon`, `flg-file-upload-file-main`, `flg-file-upload-file-name`, `flg-file-upload-file-size`.
  - Hook DOM: `data-disabled` và `data-invalid` trên gốc. Task 3 thêm `data-dragging` trên gốc và `data-rejected` trên dòng.
  - Token `--flg-dropzone-border`: `derivedTokens` (mặc định) và `contrastMore.shared` của `values.ts`.
  - Cảnh báo dev: `<FileUpload> value has entries that are not File objects. They are ignored.`; `<FileUpload> has more than one file in value and multiple is off. Only the first is shown and sent.`; chuyển controlled/uncontrolled với tên `FileUpload value`.
- Consumes: `formatFileSize` (Task 1); `useFieldContext`, `useFieldProps`, `markAsFieldControl`, `useAnnounce`, `useControllableState`, `useFormReset`, `useIsoLayoutEffect`, `mergeRefs`, `dataAttr`, `devWarn`, `isProduction`, `IconButton`, `UploadIcon`, `FileIcon`, `CloseIcon`; `realUserEvent` của `.storybook/real-input` trong story.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/file-upload/FileUpload.stories.tsx b/src/components/file-upload/FileUpload.stories.tsx
new file mode 100644
index 0000000..d62dbe9
--- /dev/null
+++ b/src/components/file-upload/FileUpload.stories.tsx
@@ -0,0 +1,329 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { useState } from 'react';
+import { expect, userEvent, waitFor } from 'storybook/test';
+import { realUserEvent } from '../../../.storybook/real-input';
+import { Field } from '../field/Field';
+import { FileUpload } from './FileUpload';
+
+const meta = {
+  title: 'Components/FileUpload',
+  component: FileUpload,
+  parameters: { stage: 'viewport' },
+} satisfies Meta<typeof FileUpload>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+// A plain grid track: a long file name is cut by its row and does not widen the column.
+const column = {
+  placeSelf: 'start',
+  display: 'grid',
+  gap: 16,
+  width: 360,
+} as const;
+const caption = {
+  fontSize: 'var(--flg-text-xs)',
+  color: 'var(--flg-text-muted)',
+  marginBottom: 6,
+} as const;
+
+/** A file of `size` bytes with nothing in it but zeros. */
+const file = (name: string, size: number, type: string) =>
+  new File([new Uint8Array(size)], name, { type });
+
+const hint = 'PDF, PNG · up to 10 MB each · up to 3 files';
+const attached = [
+  file(
+    'Annual report 2026 with the figures of every quarter, the notes and the signed annex.pdf',
+    2_411_724,
+    'application/pdf',
+  ),
+  file('floor-plan.png', 318_000, 'image/png'),
+];
+
+/** The look of the mockup (F1): the dashed zone, and the list of files under it. */
+export const Look: Story = {
+  render: () => (
+    <div style={column}>
+      <div>
+        <div style={caption}>Empty, with a hint</div>
+        <FileUpload aria-label="Attachments, empty" hint={hint} />
+      </div>
+      <div>
+        <div style={caption}>With two files</div>
+        <FileUpload aria-label="Attachments, with files" hint={hint} defaultValue={attached} />
+      </div>
+      <div>
+        <div style={caption}>Invalid</div>
+        <FileUpload aria-label="Attachments, invalid" hint={hint} invalid />
+      </div>
+      <div>
+        <div style={caption}>Disabled</div>
+        <FileUpload aria-label="Attachments, disabled" hint={hint} disabled />
+      </div>
+      <Field label="Attachments" description="Add the documents of the claim.">
+        <FileUpload hint={hint} />
+      </Field>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const zones = Array.from(canvasElement.querySelectorAll<HTMLElement>('.flg-file-upload-zone'));
+    const [empty, filled, invalid, disabled] = zones as [
+      HTMLElement,
+      HTMLElement,
+      HTMLElement,
+      HTMLElement,
+    ];
+    // The zone is 140px tall when empty, and a strip when it has files under it (spec §4.3).
+    await expect(Math.round(empty.getBoundingClientRect().height)).toBeGreaterThanOrEqual(140);
+    await expect(getComputedStyle(empty).borderTopStyle).toBe('dashed');
+    await expect(getComputedStyle(filled).minHeight).toBe('0px');
+    await expect(getComputedStyle(filled).paddingTop).toBe('12px');
+    // The edge of an invalid zone is the danger colour; the others have the dropzone token.
+    await expect(getComputedStyle(invalid).borderTopColor).not.toBe(
+      getComputedStyle(empty).borderTopColor,
+    );
+    await expect(getComputedStyle(disabled).opacity).toBe('0.5');
+    await expect(getComputedStyle(disabled).cursor).toBe('not-allowed');
+    // The input lies over the browse word, invisible, and is as big as it.
+    const input = canvas.getByLabelText('Attachments, empty');
+    const word = input.parentElement!;
+    await expect(getComputedStyle(input).opacity).toBe('0');
+    await expect(input.getBoundingClientRect().width).toBeCloseTo(
+      word.getBoundingClientRect().width,
+      0,
+    );
+    // A long name ends with an ellipsis on one line, and the size stays on its own line.
+    const name = canvasElement.querySelector<HTMLElement>('.flg-file-upload-file-name')!;
+    await expect(getComputedStyle(name).textOverflow).toBe('ellipsis');
+    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
+    await expect(canvas.getByRole('button', { name: 'Remove floor-plan.png' })).toBeInTheDocument();
+    await expect(canvas.getByRole('button', { name: /^Remove Annual report/ })).toBeEnabled();
+    await expect(canvasElement.querySelectorAll('.flg-file-upload-file-size')[1]).toHaveTextContent(
+      '318 kB',
+    );
+    // Disabled: the input and the buttons are off.
+    await expect(canvas.getByLabelText('Attachments, disabled')).toBeDisabled();
+    await expect(canvas.getByLabelText('Attachments, invalid')).toHaveAttribute(
+      'aria-invalid',
+      'true',
+    );
+  },
+};
+
+/**
+ * Gives the input files the way a dialog does: through Playwright's file chooser when the runner has
+ * it, and else by assigning the input a `DataTransfer` and firing `change`, which is what a browser
+ * does on its own (the Storybook UI has no chooser).
+ */
+async function choose(input: HTMLInputElement, ...files: File[]) {
+  const user = await realUserEvent();
+  if (user) {
+    await user.upload(input, files);
+    return;
+  }
+  const transfer = new DataTransfer();
+  files.forEach((one) => transfer.items.add(one));
+  input.files = transfer.files;
+  input.dispatchEvent(new Event('change', { bubbles: true }));
+}
+
+const heldBy = (input: HTMLInputElement) => Array.from(input.files ?? [], (one) => one.name);
+const rowsOf = (root: HTMLElement) =>
+  Array.from(root.querySelectorAll('.flg-file-upload-file-name'), (el) => el.textContent);
+
+/** A pick adds rows; a second pick adds to them; `input.files` holds all of them. */
+export const Picking: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={column}>
+      <FileUpload aria-label="Attachments" hint={hint} />
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const input = canvas.getByLabelText<HTMLInputElement>('Attachments');
+    await choose(input, file('a.pdf', 1500, 'application/pdf'));
+    await waitFor(() => expect(rowsOf(canvasElement)).toEqual(['a.pdf']));
+    await expect(heldBy(input)).toEqual(['a.pdf']);
+    await choose(input, file('b.png', 2_500_000, 'image/png'), file('c.png', 10, 'image/png'));
+    await waitFor(() => expect(rowsOf(canvasElement)).toEqual(['a.pdf', 'b.png', 'c.png']));
+    // The browser replaced input.files with the second pick, and the library put the first back.
+    await expect(heldBy(input)).toEqual(['a.pdf', 'b.png', 'c.png']);
+    await expect(canvasElement.querySelectorAll('.flg-file-upload-file-size')[1]).toHaveTextContent(
+      '2.5 MB',
+    );
+    // The live region says what was added.
+    await waitFor(() =>
+      expect(canvasElement.querySelector('[aria-live="polite"]')).toHaveTextContent(
+        '2 files added',
+      ),
+    );
+  },
+};
+
+/** One file: a second pick replaces the first. */
+export const SingleFile: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={column}>
+      <FileUpload aria-label="Avatar" multiple={false} accept="image/*" />
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const input = canvas.getByLabelText<HTMLInputElement>('Avatar');
+    await expect(input.multiple).toBe(false);
+    await choose(input, file('a.png', 100, 'image/png'));
+    await choose(input, file('b.png', 100, 'image/png'));
+    await waitFor(() => expect(rowsOf(canvasElement)).toEqual(['b.png']));
+    await expect(heldBy(input)).toEqual(['b.png']);
+  },
+};
+
+/** Removing: the row goes, `input.files` follows, and focus lands on the next row, the previous, the input. */
+export const Removing: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={column}>
+      <FileUpload
+        aria-label="Attachments"
+        defaultValue={[
+          file('a.pdf', 10, 'application/pdf'),
+          file('b.pdf', 10, 'application/pdf'),
+          file('c.pdf', 10, 'application/pdf'),
+        ]}
+      />
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const user = (await realUserEvent()) ?? userEvent;
+    const input = canvas.getByLabelText<HTMLInputElement>('Attachments');
+    await expect(heldBy(input)).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
+    await user.click(canvas.getByRole('button', { name: 'Remove b.pdf' }));
+    await expect(rowsOf(canvasElement)).toEqual(['a.pdf', 'c.pdf']);
+    await expect(heldBy(input)).toEqual(['a.pdf', 'c.pdf']);
+    await expect(canvas.getByRole('button', { name: 'Remove c.pdf' })).toHaveFocus();
+    await user.keyboard('{Enter}');
+    await expect(canvas.getByRole('button', { name: 'Remove a.pdf' })).toHaveFocus();
+    await user.keyboard(' ');
+    await expect(canvasElement.querySelector('ul')).toBeNull();
+    await expect(input).toHaveFocus();
+    await expect(heldBy(input)).toEqual([]);
+  },
+};
+
+function Controlled() {
+  const [files, setFiles] = useState<File[]>([file('first.pdf', 2000, 'application/pdf')]);
+  return (
+    <div style={column}>
+      <FileUpload aria-label="Attachments" value={files} onValueChange={setFiles} />
+      <button type="button" onClick={() => setFiles([])}>
+        Clear
+      </button>
+      <output aria-label="State">{files.map((one) => one.name).join(', ')}</output>
+    </div>
+  );
+}
+
+/** The parent owns the files: it can empty the list, and the input follows. */
+export const ControlledList: Story = {
+  tags: ['no-visual'],
+  render: () => <Controlled />,
+  play: async ({ canvas, canvasElement }) => {
+    const user = (await realUserEvent()) ?? userEvent;
+    const input = canvas.getByLabelText<HTMLInputElement>('Attachments');
+    await choose(input, file('second.pdf', 10, 'application/pdf'));
+    await waitFor(() =>
+      expect(canvas.getByLabelText('State')).toHaveTextContent('first.pdf, second.pdf'),
+    );
+    await expect(heldBy(input)).toEqual(['first.pdf', 'second.pdf']);
+    await user.click(canvas.getByRole('button', { name: 'Clear' }));
+    await waitFor(() => expect(rowsOf(canvasElement)).toEqual([]));
+    await expect(heldBy(input)).toEqual([]);
+  },
+};
+
+const submissions: string[][] = [];
+
+/** The form sends the files of every pick, and a reset goes back to the default. */
+export const InAForm: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <form
+      aria-label="Claim"
+      style={column}
+      onSubmit={(event) => {
+        event.preventDefault();
+        const sent = new FormData(event.currentTarget).getAll('documents') as File[];
+        submissions.push(sent.map((one) => one.name));
+      }}
+    >
+      <Field label="Documents">
+        <FileUpload name="documents" defaultValue={[file('start.pdf', 10, 'application/pdf')]} />
+      </Field>
+      <button type="submit">Send</button>
+      <button type="reset">Reset</button>
+    </form>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    submissions.length = 0;
+    const user = (await realUserEvent()) ?? userEvent;
+    const form = canvasElement.querySelector('form')!;
+    const input = canvas.getByLabelText<HTMLInputElement>('Documents');
+    await expect((new FormData(form).getAll('documents') as File[]).map((one) => one.name)).toEqual(
+      ['start.pdf'],
+    );
+    await choose(input, file('a.pdf', 10, 'application/pdf'));
+    await choose(input, file('b.pdf', 10, 'application/pdf'));
+    await waitFor(() => expect(rowsOf(canvasElement)).toEqual(['start.pdf', 'a.pdf', 'b.pdf']));
+    await user.click(canvas.getByRole('button', { name: 'Send' }));
+    await waitFor(() => expect(submissions).toEqual([['start.pdf', 'a.pdf', 'b.pdf']]));
+    // A removed file is not sent.
+    await user.click(canvas.getByRole('button', { name: 'Remove a.pdf' }));
+    await user.click(canvas.getByRole('button', { name: 'Send' }));
+    await waitFor(() => expect(submissions.at(-1)).toEqual(['start.pdf', 'b.pdf']));
+    // Reset: the browser empties the input, and the library puts the default back.
+    await user.click(canvas.getByRole('button', { name: 'Reset' }));
+    await waitFor(() => expect(rowsOf(canvasElement)).toEqual(['start.pdf']));
+    await expect(heldBy(input)).toEqual(['start.pdf']);
+  },
+};
+
+const requiredSent: string[][] = [];
+
+/** `required` is the browser's: the empty form does not submit, and one with a file does. */
+export const Required: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <form
+      aria-label="Claim"
+      style={column}
+      onSubmit={(event) => {
+        event.preventDefault();
+        const sent = new FormData(event.currentTarget).getAll('documents') as File[];
+        requiredSent.push(sent.map((one) => one.name));
+      }}
+    >
+      <Field label="Documents" required>
+        <FileUpload name="documents" />
+      </Field>
+      <button type="submit">Send</button>
+    </form>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    requiredSent.length = 0;
+    const user = (await realUserEvent()) ?? userEvent;
+    const input = canvas.getByLabelText<HTMLInputElement>(/^Documents/);
+    await expect(input).toBeRequired();
+    await user.click(canvas.getByRole('button', { name: 'Send' }));
+    await expect(input.validity.valueMissing).toBe(true);
+    await expect(requiredSent).toEqual([]);
+    await choose(input, file('a.pdf', 10, 'application/pdf'));
+    await waitFor(() => expect(rowsOf(canvasElement)).toEqual(['a.pdf']));
+    await expect(input.validity.valid).toBe(true);
+    await user.click(canvas.getByRole('button', { name: 'Send' }));
+    await waitFor(() => expect(requiredSent).toEqual([['a.pdf']]));
+    // Removing the file brings the requirement back.
+    await user.click(canvas.getByRole('button', { name: 'Remove a.pdf' }));
+    await expect(input.validity.valueMissing).toBe(true);
+  },
+};
diff --git a/src/components/file-upload/FileUpload.test-d.ts b/src/components/file-upload/FileUpload.test-d.ts
new file mode 100644
index 0000000..5c997b0
--- /dev/null
+++ b/src/components/file-upload/FileUpload.test-d.ts
@@ -0,0 +1,37 @@
+import { expectTypeOf, test } from 'vitest';
+import type { FileRejection, FileUploadProps } from './FileUpload';
+
+test('a FileUpload holds a list of files, and reports the whole list', () => {
+  expectTypeOf<FileUploadProps['value']>().toEqualTypeOf<File[] | undefined>();
+  expectTypeOf<FileUploadProps['defaultValue']>().toEqualTypeOf<File[] | undefined>();
+  expectTypeOf<FileUploadProps['onValueChange']>().toEqualTypeOf<
+    ((files: File[]) => void) | undefined
+  >();
+  // @ts-expect-error a file list is not a single File
+  const one: FileUploadProps = { value: new File([], 'a.pdf') };
+  expectTypeOf(one).toBeObject();
+});
+
+test('the labels that need a value are functions', () => {
+  type Labels = NonNullable<FileUploadProps['labels']>;
+  expectTypeOf<Labels['remove']>().toEqualTypeOf<((name: string) => string) | undefined>();
+  expectTypeOf<Labels['added']>().toEqualTypeOf<((count: number) => string) | undefined>();
+  expectTypeOf<Labels['prompt']>().toEqualTypeOf<string | undefined>();
+  // @ts-expect-error a label that takes the name is a function, not a string
+  const wrong: Labels = { remove: 'Remove' };
+  expectTypeOf(wrong).toBeObject();
+});
+
+test('the checks and the form props are declared', () => {
+  expectTypeOf<FileUploadProps['maxSize']>().toEqualTypeOf<number | undefined>();
+  expectTypeOf<FileUploadProps['validate']>().toEqualTypeOf<
+    ((file: File) => string | null) | undefined
+  >();
+  expectTypeOf<FileUploadProps['onReject']>().toEqualTypeOf<
+    ((rejections: FileRejection[]) => void) | undefined
+  >();
+  expectTypeOf<FileUploadProps['form']>().toEqualTypeOf<string | undefined>();
+  expectTypeOf<FileRejection['errors'][number]['code']>().toEqualTypeOf<
+    'type' | 'size' | 'count' | 'custom'
+  >();
+});
diff --git a/src/components/file-upload/FileUpload.test.tsx b/src/components/file-upload/FileUpload.test.tsx
new file mode 100644
index 0000000..971b972
--- /dev/null
+++ b/src/components/file-upload/FileUpload.test.tsx
@@ -0,0 +1,598 @@
+import { act, createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
+import { renderToString } from 'react-dom/server';
+import { createRef, useState } from 'react';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
+import { Field } from '../field/Field';
+import { FileUpload } from './FileUpload';
+import type { FileUploadProps } from './FileUpload';
+
+// jsdom has no DataTransfer, and its `input.files` takes only a FileList, which nothing in a test can
+// make. So the tests stand in for both: a DataTransfer that collects files into a list, and an
+// `input.files` that holds whatever list it is given. A real browser does the same through its own
+// classes; the stories check that.
+type FileListLike = File[] & { item: (index: number) => File | null };
+const listOf = (files: File[]): FileListLike =>
+  Object.assign([...files], { item: (index: number) => files[index] ?? null });
+
+class FakeDataTransfer {
+  private readonly collected: File[] = [];
+  items = { add: (file: File) => void this.collected.push(file) };
+  get files() {
+    return listOf(this.collected);
+  }
+}
+
+const held = new WeakMap<HTMLInputElement, FileListLike>();
+const nativeFiles = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files')!;
+
+const file = (name: string, size = 3, type = 'text/plain') =>
+  new File([new Uint8Array(size)], name, { type });
+const input = () => document.querySelector<HTMLInputElement>('input[type="file"]')!;
+const names = (list: ArrayLike<File> | null) => Array.from(list ?? [], (item) => item.name);
+const rowNames = () =>
+  Array.from(document.querySelectorAll('.flg-file-upload-file-name'), (el) => el.textContent);
+const removeButtons = () => Array.from(document.querySelectorAll<HTMLButtonElement>('li button'));
+/** What the browser does when the user picks: the input holds the pick alone, then `change`. */
+const pick = (...files: File[]) => {
+  held.set(input(), listOf(files));
+  fireEvent.change(input());
+};
+const aTaskLater = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
+const live = () => document.querySelector('[aria-live="polite"]')!;
+
+describe('FileUpload', () => {
+  beforeEach(() => {
+    resetDevWarnings();
+    vi.stubGlobal('DataTransfer', FakeDataTransfer);
+    Object.defineProperty(HTMLInputElement.prototype, 'files', {
+      configurable: true,
+      get(this: HTMLInputElement) {
+        return held.get(this) ?? nativeFiles.get!.call(this);
+      },
+      set(this: HTMLInputElement, list: FileListLike) {
+        held.set(this, list);
+      },
+    });
+  });
+  afterEach(() => {
+    vi.unstubAllGlobals();
+    vi.restoreAllMocks();
+    Object.defineProperty(HTMLInputElement.prototype, 'files', nativeFiles);
+  });
+
+  describe('markup and names', () => {
+    it('renders the zone with the icon, the prompt, the browse word and the file input over it', () => {
+      render(<FileUpload />);
+      const root = document.querySelector('.flg-file-upload')!;
+      const zone = root.querySelector(':scope > .flg-file-upload-zone')!;
+      expect(zone.querySelector(':scope > .flg-file-upload-icon svg')).not.toBeNull();
+      const prompt = zone.querySelector(':scope > p.flg-file-upload-prompt')!;
+      expect(prompt.firstChild?.textContent).toBe('Drag and drop files here or ');
+      const browse = prompt.querySelector(':scope > .flg-file-upload-browse')!;
+      expect(browse.querySelector(':scope > span[aria-hidden="true"]')).toHaveTextContent('browse');
+      expect(browse.querySelector(':scope > input[type="file"]')).toBe(input());
+      expect(input()).toHaveAttribute('title', '');
+      expect(root.querySelector('ul')).toBeNull();
+      expect(root.querySelector('.flg-file-upload-hint')).toBeNull();
+      expect(live()).toHaveClass('flg-visually-hidden');
+      expect(live()).toHaveAttribute('aria-atomic', 'true');
+      expect(live()).toBeEmptyDOMElement();
+    });
+
+    it('names the input from labels.browse outside a Field', () => {
+      render(<FileUpload />);
+      expect(input()).toHaveAccessibleName('browse');
+      expect(input()).toHaveAttribute('aria-label', 'browse');
+    });
+
+    it('takes the prompt and the browse word from labels', () => {
+      render(<FileUpload labels={{ prompt: 'Kéo thả tệp vào đây hoặc ', browse: 'chọn tệp' }} />);
+      expect(document.querySelector('.flg-file-upload-prompt')).toHaveTextContent(
+        'Kéo thả tệp vào đây hoặc chọn tệp',
+      );
+      expect(input()).toHaveAccessibleName('chọn tệp');
+    });
+
+    it('lets aria-label and aria-labelledby name the input instead', () => {
+      const { unmount } = render(<FileUpload aria-label="Résumé" />);
+      expect(input()).toHaveAccessibleName('Résumé');
+      unmount();
+      render(
+        <>
+          <span id="title">Attachments</span>
+          <FileUpload aria-labelledby="title" />
+        </>,
+      );
+      expect(input()).toHaveAccessibleName('Attachments');
+      expect(input()).not.toHaveAttribute('aria-label');
+    });
+
+    it('is named by the label of a Field, which points at the input', () => {
+      render(
+        <Field label="Attachments" description="PDF only">
+          <FileUpload />
+        </Field>,
+      );
+      expect(screen.getByLabelText('Attachments')).toBe(input());
+      expect(input()).not.toHaveAttribute('aria-label');
+      expect(input()).toHaveAccessibleDescription('PDF only');
+    });
+
+    it('puts the props of a native control on the input and the style on the root', () => {
+      render(
+        <FileUpload
+          id="cv"
+          name="cv"
+          accept=".pdf"
+          required
+          form="apply"
+          aria-label="CV"
+          aria-describedby="extra"
+          className="mine"
+          style={{ width: 300 }}
+        />,
+      );
+      expect(input()).toHaveAttribute('id', 'cv');
+      expect(input()).toHaveAttribute('name', 'cv');
+      expect(input()).toHaveAttribute('accept', '.pdf');
+      expect(input()).toHaveAttribute('form', 'apply');
+      expect(input()).toBeRequired();
+      expect(input()).toHaveAttribute('aria-describedby', 'extra');
+      expect(input()).toHaveAttribute('multiple');
+      const root = document.querySelector('.flg-file-upload')!;
+      expect(root).toHaveClass('mine');
+      expect(root).toHaveStyle({ width: '300px' });
+      expect(input()).not.toHaveClass('mine');
+    });
+
+    it('takes one file only with multiple={false}', () => {
+      render(<FileUpload multiple={false} />);
+      expect(input()).not.toHaveAttribute('multiple');
+    });
+
+    it('shows the hint under the prompt and adds it to aria-describedby, after the Field ids', () => {
+      render(
+        <Field label="Attachments" description="Optional">
+          <FileUpload hint="PDF, up to 10 MB" aria-describedby="extra" />
+        </Field>,
+      );
+      const hint = document.querySelector<HTMLElement>('p.flg-file-upload-hint')!;
+      expect(hint).toHaveTextContent('PDF, up to 10 MB');
+      expect(hint.id).not.toBe('');
+      const ids = input().getAttribute('aria-describedby')!.split(' ');
+      expect(ids).toHaveLength(3);
+      expect(ids.slice(1)).toEqual(['extra', hint.id]);
+    });
+
+    it('has no describedby when there is nothing to describe it', () => {
+      render(<FileUpload />);
+      expect(input()).not.toHaveAttribute('aria-describedby');
+    });
+
+    it('forwards ref to the file input', () => {
+      const ref = createRef<HTMLInputElement>();
+      render(<FileUpload ref={ref} />);
+      expect(ref.current).toBe(input());
+    });
+
+    it('renders on the server with the zone and the input', () => {
+      const html = renderToString(<FileUpload name="cv" hint="Hint" />);
+      expect(html).toContain('type="file"');
+      expect(html).toContain('flg-file-upload-zone');
+      expect(html).toContain('aria-live="polite"');
+    });
+  });
+
+  describe('picking files', () => {
+    it('lists a pick with its name and size, and tells onValueChange', () => {
+      const onValueChange = vi.fn();
+      render(<FileUpload onValueChange={onValueChange} />);
+      const a = file('a.pdf', 1500);
+      pick(a);
+      expect(rowNames()).toEqual(['a.pdf']);
+      expect(document.querySelector('.flg-file-upload-file-size')).toHaveTextContent('1.5 kB');
+      expect(onValueChange).toHaveBeenCalledTimes(1);
+      expect(onValueChange).toHaveBeenCalledWith([a]);
+    });
+
+    it('adds a second pick to the first, and gives onValueChange the whole list', () => {
+      const onValueChange = vi.fn();
+      render(<FileUpload onValueChange={onValueChange} />);
+      const [a, b, c] = [file('a.pdf'), file('b.pdf'), file('c.pdf')];
+      pick(a);
+      pick(b, c);
+      expect(rowNames()).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
+      expect(onValueChange).toHaveBeenCalledTimes(2);
+      expect(onValueChange).toHaveBeenLastCalledWith([a, b, c]);
+    });
+
+    it('writes the whole list into input.files after every pick, not the last pick alone', () => {
+      render(<FileUpload />);
+      pick(file('a.pdf'));
+      pick(file('b.pdf'));
+      expect(names(input().files)).toEqual(['a.pdf', 'b.pdf']);
+    });
+
+    it('replaces the list with the pick when multiple is off', () => {
+      const onValueChange = vi.fn();
+      render(<FileUpload multiple={false} onValueChange={onValueChange} />);
+      pick(file('a.pdf'));
+      const b = file('b.pdf');
+      pick(b);
+      expect(rowNames()).toEqual(['b.pdf']);
+      expect(names(input().files)).toEqual(['b.pdf']);
+      expect(onValueChange).toHaveBeenLastCalledWith([b]);
+    });
+
+    it('keeps the list when the input comes back empty, as when the dialog was cancelled', () => {
+      const onValueChange = vi.fn();
+      render(<FileUpload defaultValue={[file('a.pdf')]} onValueChange={onValueChange} />);
+      pick();
+      expect(rowNames()).toEqual(['a.pdf']);
+      expect(names(input().files)).toEqual(['a.pdf']);
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(live()).toBeEmptyDOMElement();
+    });
+
+    it('announces how many files were added', async () => {
+      render(<FileUpload />);
+      pick(file('a.pdf'));
+      await waitFor(() => expect(live()).toHaveTextContent('1 file added'));
+      pick(file('b.pdf'), file('c.pdf'));
+      await waitFor(() => expect(live()).toHaveTextContent('2 files added'));
+    });
+
+    it('announces in the words of labels.added', async () => {
+      render(<FileUpload labels={{ added: (count) => `Đã thêm ${count} tệp` }} />);
+      pick(file('a.pdf'), file('b.pdf'));
+      await waitFor(() => expect(live()).toHaveTextContent('Đã thêm 2 tệp'));
+    });
+
+    it('does not report the files of defaultValue as added', () => {
+      render(<FileUpload defaultValue={[file('a.pdf')]} />);
+      expect(rowNames()).toEqual(['a.pdf']);
+      expect(live()).toBeEmptyDOMElement();
+    });
+
+    it('keeps its list and leaves the input as the browser set it where there is no DataTransfer', () => {
+      vi.stubGlobal('DataTransfer', undefined);
+      render(<FileUpload />);
+      pick(file('a.pdf'));
+      const second = file('b.pdf');
+      pick(second);
+      expect(rowNames()).toEqual(['a.pdf', 'b.pdf']);
+      expect(names(input().files)).toEqual(['b.pdf']);
+    });
+  });
+
+  describe('the list', () => {
+    it('writes one row per file: the icon, the name, the size and the remove button', () => {
+      render(<FileUpload defaultValue={[file('a.pdf', 1500), file('b.png', 2_500_000)]} />);
+      const rows = document.querySelectorAll('ul.flg-file-upload-list > li.flg-file-upload-file');
+      expect(rows).toHaveLength(2);
+      const first = rows[0]!;
+      expect(first.querySelector('.flg-file-upload-file-icon svg')).not.toBeNull();
+      expect(first.querySelector('.flg-file-upload-file-name')).toHaveTextContent('a.pdf');
+      expect(first.querySelector('.flg-file-upload-file-size')).toHaveTextContent('1.5 kB');
+      expect(rows[1]!.querySelector('.flg-file-upload-file-size')).toHaveTextContent('2.5 MB');
+      const button = first.querySelector('button')!;
+      expect(button).toHaveAttribute('type', 'button');
+      expect(button).toHaveAccessibleName('Remove a.pdf');
+      expect(button).toHaveAttribute('data-variant', 'ghost');
+      expect(button).toHaveAttribute('data-size', 'sm');
+    });
+
+    it('names the remove button from labels.remove', () => {
+      render(
+        <FileUpload defaultValue={[file('a.pdf')]} labels={{ remove: (name) => `Xoá ${name}` }} />,
+      );
+      expect(screen.getByRole('button', { name: 'Xoá a.pdf' })).toBeInTheDocument();
+    });
+
+    it('writes the sizes in the locale', () => {
+      render(<FileUpload locale="de-DE" defaultValue={[file('a.pdf', 1500)]} />);
+      expect(document.querySelector('.flg-file-upload-file-size')?.textContent).toMatch(
+        /^1,5\skB$/,
+      );
+    });
+
+    it('keeps the row of a file when another is added or removed', () => {
+      render(<FileUpload defaultValue={[file('a.pdf'), file('b.pdf')]} />);
+      const rowOfB = document.querySelectorAll('li')[1]!;
+      pick(file('c.pdf'));
+      expect(document.querySelectorAll('li')[1]).toBe(rowOfB);
+      fireEvent.click(removeButtons()[0]!);
+      expect(document.querySelectorAll('li')[0]).toBe(rowOfB);
+    });
+
+    it('lists a file that is twice in the value twice', () => {
+      const a = file('a.pdf');
+      render(<FileUpload defaultValue={[a, a]} />);
+      expect(rowNames()).toEqual(['a.pdf', 'a.pdf']);
+    });
+  });
+
+  describe('removing a file', () => {
+    it('removes the row, tells onValueChange the rest and writes the rest into input.files', () => {
+      const onValueChange = vi.fn();
+      const [a, b, c] = [file('a.pdf'), file('b.pdf'), file('c.pdf')];
+      render(<FileUpload defaultValue={[a, b, c]} onValueChange={onValueChange} />);
+      expect(names(input().files)).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
+      fireEvent.click(screen.getByRole('button', { name: 'Remove b.pdf' }));
+      expect(rowNames()).toEqual(['a.pdf', 'c.pdf']);
+      expect(onValueChange).toHaveBeenCalledWith([a, c]);
+      expect(names(input().files)).toEqual(['a.pdf', 'c.pdf']);
+    });
+
+    it('moves focus to the remove button of the next row', () => {
+      render(<FileUpload defaultValue={[file('a.pdf'), file('b.pdf'), file('c.pdf')]} />);
+      fireEvent.click(removeButtons()[1]!);
+      expect(screen.getByRole('button', { name: 'Remove c.pdf' })).toHaveFocus();
+      fireEvent.click(removeButtons()[0]!);
+      expect(screen.getByRole('button', { name: 'Remove c.pdf' })).toHaveFocus();
+    });
+
+    it('moves focus to the previous row when the last one is removed', () => {
+      render(<FileUpload defaultValue={[file('a.pdf'), file('b.pdf')]} />);
+      fireEvent.click(removeButtons()[1]!);
+      expect(screen.getByRole('button', { name: 'Remove a.pdf' })).toHaveFocus();
+    });
+
+    it('moves focus to the input when no row is left', () => {
+      render(<FileUpload defaultValue={[file('a.pdf')]} />);
+      fireEvent.click(removeButtons()[0]!);
+      expect(document.querySelector('ul')).toBeNull();
+      expect(input()).toHaveFocus();
+      expect(names(input().files)).toEqual([]);
+    });
+
+    it('does not move focus when a controlled parent keeps the file', () => {
+      render(<FileUpload value={[file('a.pdf'), file('b.pdf')]} onValueChange={() => {}} />);
+      removeButtons()[0]!.focus();
+      fireEvent.click(removeButtons()[0]!);
+      expect(rowNames()).toEqual(['a.pdf', 'b.pdf']);
+      expect(removeButtons()[0]).toHaveFocus();
+    });
+  });
+
+  describe('controlled value', () => {
+    it('shows value and writes it into input.files', () => {
+      render(<FileUpload value={[file('a.pdf'), file('b.pdf')]} />);
+      expect(rowNames()).toEqual(['a.pdf', 'b.pdf']);
+      expect(names(input().files)).toEqual(['a.pdf', 'b.pdf']);
+    });
+
+    it('writes a new value into input.files, and an emptied one', () => {
+      const { rerender } = render(<FileUpload value={[file('a.pdf')]} />);
+      rerender(<FileUpload value={[file('b.pdf'), file('c.pdf')]} />);
+      expect(names(input().files)).toEqual(['b.pdf', 'c.pdf']);
+      rerender(<FileUpload value={[]} />);
+      expect(names(input().files)).toEqual([]);
+    });
+
+    it('puts value back into input.files when the parent turns a pick down', () => {
+      const onValueChange = vi.fn();
+      render(<FileUpload value={[file('a.pdf')]} onValueChange={onValueChange} />);
+      pick(file('b.pdf'));
+      expect(onValueChange).toHaveBeenCalledTimes(1);
+      expect(rowNames()).toEqual(['a.pdf']);
+      expect(names(input().files)).toEqual(['a.pdf']);
+    });
+
+    it('follows a parent that accepts the pick', () => {
+      function Parent() {
+        const [files, setFiles] = useState<File[]>([]);
+        return <FileUpload value={files} onValueChange={setFiles} />;
+      }
+      render(<Parent />);
+      pick(file('a.pdf'));
+      pick(file('b.pdf'));
+      expect(rowNames()).toEqual(['a.pdf', 'b.pdf']);
+      expect(names(input().files)).toEqual(['a.pdf', 'b.pdf']);
+      fireEvent.click(removeButtons()[0]!);
+      expect(rowNames()).toEqual(['b.pdf']);
+      expect(names(input().files)).toEqual(['b.pdf']);
+    });
+
+    it('warns once when it turns from uncontrolled to controlled', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const { rerender } = render(<FileUpload />);
+      rerender(<FileUpload value={[]} />);
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('FileUpload value'));
+    });
+  });
+
+  describe('clicking the zone', () => {
+    it('opens the file dialog from a press on the empty zone, the icon or the hint', () => {
+      render(<FileUpload hint="Hint" />);
+      const spy = vi.spyOn(input(), 'click').mockImplementation(() => {});
+      fireEvent.click(document.querySelector('.flg-file-upload-zone')!);
+      fireEvent.click(document.querySelector('.flg-file-upload-icon')!);
+      fireEvent.click(document.querySelector('.flg-file-upload-hint')!);
+      expect(spy).toHaveBeenCalledTimes(3);
+    });
+
+    it('leaves a press on the input, on a row and on a remove button alone', () => {
+      render(<FileUpload defaultValue={[file('a.pdf')]} />);
+      const spy = vi.spyOn(input(), 'click').mockImplementation(() => {});
+      fireEvent.click(input());
+      fireEvent.click(document.querySelector('li')!);
+      fireEvent.click(removeButtons()[0]!);
+      expect(spy).not.toHaveBeenCalled();
+    });
+
+    it('leaves a press of another button than the primary alone', () => {
+      render(<FileUpload />);
+      const spy = vi.spyOn(input(), 'click').mockImplementation(() => {});
+      fireEvent(
+        document.querySelector('.flg-file-upload-zone')!,
+        createEvent.click(document.querySelector('.flg-file-upload-zone')!, { button: 2 }),
+      );
+      expect(spy).not.toHaveBeenCalled();
+    });
+
+    it('opens nothing when disabled', () => {
+      render(<FileUpload disabled />);
+      const spy = vi.spyOn(input(), 'click').mockImplementation(() => {});
+      fireEvent.click(document.querySelector('.flg-file-upload-zone')!);
+      expect(spy).not.toHaveBeenCalled();
+    });
+  });
+
+  describe('states', () => {
+    it('disables the input and the remove buttons, and marks the root', () => {
+      render(<FileUpload disabled defaultValue={[file('a.pdf')]} />);
+      expect(input()).toBeDisabled();
+      expect(removeButtons()[0]).toBeDisabled();
+      expect(document.querySelector('.flg-file-upload')).toHaveAttribute('data-disabled');
+    });
+
+    it('is disabled by a disabled Field', () => {
+      render(
+        <Field label="Attachments" disabled>
+          <FileUpload />
+        </Field>,
+      );
+      expect(input()).toBeDisabled();
+      expect(document.querySelector('.flg-file-upload')).toHaveAttribute('data-disabled');
+    });
+
+    it('marks the input and the root invalid', () => {
+      render(<FileUpload invalid />);
+      expect(input()).toHaveAttribute('aria-invalid', 'true');
+      expect(document.querySelector('.flg-file-upload')).toHaveAttribute('data-invalid');
+    });
+
+    it('is invalid in a Field with an error, and required in a required Field', () => {
+      render(
+        <Field label="Attachments" error="Add a file" required>
+          <FileUpload />
+        </Field>,
+      );
+      expect(input()).toHaveAttribute('aria-invalid', 'true');
+      expect(input()).toBeRequired();
+      expect(document.querySelector('.flg-file-upload')).toHaveAttribute('data-invalid');
+      expect(input()).toHaveAccessibleDescription('Add a file');
+    });
+
+    it('has no state attributes at rest', () => {
+      render(<FileUpload />);
+      const root = document.querySelector('.flg-file-upload')!;
+      expect(root).not.toHaveAttribute('data-disabled');
+      expect(root).not.toHaveAttribute('data-invalid');
+      expect(root).not.toHaveAttribute('data-dragging');
+    });
+  });
+
+  describe('in a form', () => {
+    it('belongs to the form named by form, whatever the markup', () => {
+      render(
+        <>
+          <form id="apply" aria-label="Apply" />
+          <FileUpload name="cv" form="apply" />
+        </>,
+      );
+      expect(input().form).toBe(screen.getByRole('form'));
+    });
+
+    it('puts an uncontrolled FileUpload back to defaultValue when the form is reset', async () => {
+      const onValueChange = vi.fn();
+      const start = file('start.pdf');
+      render(
+        <form aria-label="Apply">
+          <FileUpload name="cv" defaultValue={[start]} onValueChange={onValueChange} />
+        </form>,
+      );
+      pick(file('a.pdf'));
+      expect(rowNames()).toEqual(['start.pdf', 'a.pdf']);
+      onValueChange.mockClear();
+      // The browser empties the input on a reset, then the library puts the files back.
+      held.set(input(), listOf([]));
+      fireEvent.reset(screen.getByRole('form'));
+      await aTaskLater();
+      expect(rowNames()).toEqual(['start.pdf']);
+      expect(names(input().files)).toEqual(['start.pdf']);
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('empties an uncontrolled FileUpload without a default when the form is reset', async () => {
+      render(
+        <form aria-label="Apply">
+          <FileUpload name="cv" />
+        </form>,
+      );
+      pick(file('a.pdf'));
+      held.set(input(), listOf([]));
+      fireEvent.reset(screen.getByRole('form'));
+      await aTaskLater();
+      expect(document.querySelector('ul')).toBeNull();
+      expect(names(input().files)).toEqual([]);
+    });
+
+    it('keeps the files of a controlled FileUpload when the form is reset, and writes them back', async () => {
+      render(
+        <form aria-label="Apply">
+          <FileUpload name="cv" value={[file('a.pdf')]} onValueChange={() => {}} />
+        </form>,
+      );
+      held.set(input(), listOf([]));
+      fireEvent.reset(screen.getByRole('form'));
+      await aTaskLater();
+      expect(rowNames()).toEqual(['a.pdf']);
+      expect(names(input().files)).toEqual(['a.pdf']);
+    });
+
+    it('does nothing when the reset is cancelled', async () => {
+      render(
+        <form aria-label="Apply" onReset={(event) => event.preventDefault()}>
+          <FileUpload name="cv" defaultValue={[file('start.pdf')]} />
+        </form>,
+      );
+      pick(file('a.pdf'));
+      fireEvent.reset(screen.getByRole('form'));
+      await aTaskLater();
+      expect(rowNames()).toEqual(['start.pdf', 'a.pdf']);
+    });
+  });
+
+  describe('warnings', () => {
+    it('warns about an entry of value that is not a File, and leaves it out', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(<FileUpload value={[file('a.pdf'), { name: 'b.pdf' } as unknown as File]} />);
+      expect(rowNames()).toEqual(['a.pdf']);
+      expect(warn).toHaveBeenCalledTimes(1);
+      expect(warn.mock.calls[0]![0]).toContain(WARN_PREFIX);
+      expect(warn.mock.calls[0]![0]).toContain('not File objects');
+    });
+
+    it('warns about more than one file with multiple off, and shows the first', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(<FileUpload multiple={false} defaultValue={[file('a.pdf'), file('b.pdf')]} />);
+      expect(rowNames()).toEqual(['a.pdf']);
+      expect(names(input().files)).toEqual(['a.pdf']);
+      expect(warn).toHaveBeenCalledTimes(1);
+      expect(warn.mock.calls[0]![0]).toContain('multiple is off');
+    });
+
+    it('does not warn about a value that is right', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(<FileUpload defaultValue={[file('a.pdf')]} />);
+      expect(warn).not.toHaveBeenCalled();
+    });
+  });
+
+  it('accepts the props of the whole API', () => {
+    const props: FileUploadProps = {
+      accept: 'image/*',
+      maxSize: 1000,
+      maxFiles: 2,
+      validate: () => null,
+      onReject: () => {},
+    };
+    render(<FileUpload {...props} />);
+    expect(input()).toHaveAttribute('accept', 'image/*');
+    expect(input()).not.toHaveAttribute('maxsize');
+    expect(input()).not.toHaveAttribute('maxfiles');
+  });
+});
diff --git a/src/index.test.ts b/src/index.test.ts
index 5968991..fc47204 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -51,6 +51,7 @@ describe('public API', () => {
       'DropdownMenuContent',
       'DropdownMenuTrigger',
       'Field',
+      'FileUpload',
       'IconButton',
       'Input',
       'MenuCheckboxItem',
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/file-upload src/index.test.ts
```

Expected: FAIL. Trên cây của plan, `FileUpload.test.tsx` không nạp được ở cả hai project React: `Failed to resolve import "./FileUpload" from "src/components/file-upload/FileUpload.test.tsx". Does the file exist?`. `FileUpload.test-d.ts` báo lỗi kiểu vì module chưa có, và `public API > exports exactly the documented components and nothing internal` fail vì danh sách export chưa có `FileUpload`. `accept.test.ts` của Task 1 vẫn pass.

Bản nháp chạy test với một `FileUpload` giả render `<div />`: 51 trong 53 test fail. Các lỗi đồng loạt, chủ yếu do cấu trúc: `TypeError: Invalid value used as weak map key` (15 test, input là `null`), `spyOn could not find an object` (4), `expected [] to deeply equal ['a.pdf']` (3), và thiếu thuộc tính. Hai test pass trên bản giả là kiểm tra phủ định (phát hiện 15).

- [ ] **Step 3: Viết code**

````diff
diff --git a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
index 063b8b5..9af1f8d 100644
--- a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
+++ b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
@@ -367,6 +367,7 @@ Mọi số liệu ở §4.3 lấy từ CSS `mk-` của đúng phương án đã
   - Viền 1.5px đứt nét `--flg-dropzone-border` (§4.2), bo `--flg-radius-lg`, nền `--flg-control-bg-secondary`.
   - Màu viền và nền chuyển trong `--flg-duration-fast` với `--flg-ease`.
   - Khi danh sách có ít nhất một dòng: cao tối thiểu 0, padding 12px.
+  - Khi `invalid` (cả từ Field): viền đứt nét đổi sang `--flg-danger`, như cạnh khung của các control khác; mockup không vẽ trạng thái này (phát hiện khi lập Plan D).
 - **Icon tải lên:** 24px, màu `--flg-text-muted`.
 - **Lời nhắc:** `--flg-text-sm` màu `--flg-text`, kết thúc bằng nút chọn tệp dạng link: đậm `--flg-weight-semibold`, màu `--flg-accent-text`, gạch chân cách chữ 2px, bo `--flg-radius-xs`.
 - **Dòng gợi ý** (prop `hint`, ví dụ "PDF, PNG · up to 10 MB each · up to 3 files"): `--flg-text-xs` màu `--flg-text-muted`.
@@ -860,7 +861,7 @@ type FileUploadProps = {
 };
 ```
 
-- **Mặc định:** `multiple=true`, `locale="en-US"`, `labels={ prompt: "Drag and drop files here or", browse: "browse", dropHere: "Drop files to upload", remove: (n) => \`Remove ${n}\`, type: "File type not supported", size: (max) => \`File is larger than ${max}\`, count: (n) => \`Up to ${n} files\`, added: (n) => n === 1 ? "1 file added" : \`${n} files added\`, rejected: (n) => n === 1 ? "1 file rejected" : \`${n} files rejected\` }`. `maxSize` tính bằng byte. Lỗi có dạng `{ code, message }` và các khoá `labels` ngoài bản quyết định ban đầu là Claude chốt.
+- **Mặc định:** `multiple=true`, `locale="en-US"`, `labels={ prompt: "Drag and drop files here or ", browse: "browse", dropHere: "Drop files to upload", remove: (n) => \`Remove ${n}\`, type: "File type not supported", size: (max) => \`File is larger than ${max}\`, count: (n) => n === 1 ? "Only 1 file" : \`Up to ${n} files\`, added: (n) => n === 1 ? "1 file added" : \`${n} files added\`, rejected: (n) => n === 1 ? "1 file rejected" : \`${n} files rejected\` }`. `maxSize` tính bằng byte. Lỗi có dạng `{ code, message }` và các khoá `labels` ngoài bản quyết định ban đầu là Claude chốt. `count` có dạng riêng cho 1 tệp, vì "Up to 1 files" sai ngữ pháp (phát hiện khi lập Plan D).
 - **Cấu trúc:**
 
   ```html
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 5974be7..977ab09 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -101,6 +101,18 @@ const SHIPPED_CLASSES = [
   'flg-date-picker',
   'flg-date-picker-button',
   'flg-date-picker-popup',
+  'flg-file-upload',
+  'flg-file-upload-zone',
+  'flg-file-upload-icon',
+  'flg-file-upload-prompt',
+  'flg-file-upload-browse',
+  'flg-file-upload-hint',
+  'flg-file-upload-list',
+  'flg-file-upload-file',
+  'flg-file-upload-file-icon',
+  'flg-file-upload-file-main',
+  'flg-file-upload-file-name',
+  'flg-file-upload-file-size',
   'flg-toaster',
   'flg-toaster-list',
   'flg-toast',
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index a7351f9..c7befa5 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -32,6 +32,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/pagination/Pagination.tsx',
   'src/components/calendar/Calendar.tsx',
   'src/components/date-picker/DatePicker.tsx',
+  'src/components/file-upload/FileUpload.tsx',
   'src/components/toast/toast.ts',
   'src/components/toast/Toaster.tsx',
 ];
diff --git a/src/components/file-upload/FileUpload.mdx b/src/components/file-upload/FileUpload.mdx
new file mode 100644
index 0000000..098b468
--- /dev/null
+++ b/src/components/file-upload/FileUpload.mdx
@@ -0,0 +1,139 @@
+import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './FileUpload.stories';
+
+<Meta of={Stories} />
+
+# FileUpload
+
+```tsx
+import { Field, FileUpload } from 'h2d-glass-ui';
+
+<Field label="Attachments" description="Add the documents of the claim.">
+  <FileUpload name="attachments" hint="PDF, PNG · up to 10 MB each · up to 3 files" />
+</Field>;
+```
+
+<Canvas of={Stories.Look} />
+<Controls />
+
+A FileUpload is a large dashed zone with a "browse" link, and the list of the files chosen under it.
+The control is a native `<input type="file">`: it lies over the word "browse", so a press on the word
+opens the system's file dialog, the form sends the files like any file input, and `required` is the
+browser's own check. The library keeps the files of every pick, which the browser would replace, and
+draws the list with a remove button for each file.
+
+## Picking files
+
+- **Browse** opens the file dialog. So does a press on the empty part of the zone, which is a
+  convenience for the pointer: the keyboard stops at the input, which the browser offers as a
+  button (Enter or Space opens the dialog).
+- **A second pick adds** to the files already there; it does not replace them. With
+  `multiple={false}` a new pick replaces the file.
+- **Cancelling** the dialog keeps the list, in engines that empty the input when it happens.
+- `accept` is passed to the input, so the dialog offers only those files. It is the native
+  attribute: `"image/*"`, `".pdf,.docx"`, `"application/pdf"`.
+
+<Canvas of={Stories.Picking} />
+
+`onValueChange` is called once per pick with all the files, in order. The live region of the
+FileUpload says how many were added (`labels.added`).
+
+<Canvas of={Stories.SingleFile} />
+
+## Removing files
+
+Each row has a remove button named by `labels.remove` ("Remove report.pdf"). After a removal the
+focus goes to the remove button of the next row, to the previous one when the last row was
+removed, and to the input when none is left, so a keyboard user does not lose their place.
+
+<Canvas of={Stories.Removing} />
+
+## Controlled use
+
+`value` is the list of files and `onValueChange` is called with the whole list when the user adds or
+removes files; it is not called when the parent changes `value`. The FileUpload writes `value` into
+the input after every change, so a form sends the files that are shown, whatever the parent did
+with a request.
+
+```tsx
+const [files, setFiles] = useState<File[]>([]);
+
+<FileUpload aria-label="Attachments" value={files} onValueChange={setFiles} />;
+```
+
+A `value` entry that is not a `File` is left out, and `multiple={false}` with more than one file
+shows the first only; the development build warns about both.
+
+<Canvas of={Stories.ControlledList} />
+
+## In a form
+
+The input carries `name`, `required`, `disabled` and `form`, so the form takes the files from it:
+
+- **FormData:** `formData.getAll(name)` has the files of all the picks, minus those removed. The
+  FileUpload writes the whole list into `input.files` through a `DataTransfer`. In an engine
+  without `DataTransfer` the form sends only the last pick.
+- **`required`:** the browser's own check, with its own bubble on the input: an empty FileUpload
+  stops the submit.
+- **Reset:** a form reset puts an uncontrolled FileUpload back to `defaultValue` (usually empty),
+  unless an `onReset` handler cancels the reset with `preventDefault()`. A controlled one keeps its
+  files.
+- **`form`:** the id of a form the input is not inside of.
+- **Disabled:** a disabled FileUpload is not submitted, and its remove buttons are off.
+
+<Canvas of={Stories.InAForm} />
+<Canvas of={Stories.Required} />
+
+Inside a `Field`, the label points at the file input, and the description and error are announced
+with it. The Field's `required`, `disabled` and error apply to it.
+
+## Hint, sizes and states
+
+`hint` is a line under the prompt, for the types and sizes that are accepted. It is a `ReactNode`,
+and it is part of the input's description (`aria-describedby`). File sizes are written for `locale`
+(default `"en-US"`: `2.4 MB`; `de-DE`: `2,4 MB`), with 1 kB being 1000 bytes.
+
+`invalid` gives the zone a danger-coloured dashed edge and the input `aria-invalid`; inside a Field
+with an error it is already invalid. `disabled` dims the zone and takes it out of the form.
+
+## Words
+
+Every word the FileUpload says is in `labels`, a function where it needs a value. The prompt ends
+with a space, because the browse word follows it.
+
+```tsx
+<FileUpload
+  labels={{
+    prompt: 'Kéo thả tệp vào đây hoặc ',
+    browse: 'chọn tệp',
+    remove: (name) => `Xoá ${name}`,
+    added: (count) => `Đã thêm ${count} tệp`,
+  }}
+/>
+```
+
+## Accessibility
+
+- The native `<input type="file">` is the control. It is named by the Field's label, by
+  `aria-label` or `aria-labelledby`; with none of them, and outside a Field, by `labels.browse`.
+  The ref, `id` and every `aria-*` prop go to it; `className` and `style` go on the element
+  around the zone and the list.
+- Its focus ring is drawn around the word "browse". The word itself is hidden from assistive
+  technology, since the input has the name.
+- Drag and drop is a convenience for the pointer: everything it does, the file dialog does with a
+  keyboard.
+- The list has list semantics, and each remove button has its own name. The FileUpload has its own live
+  region, in its root, so it is read inside a modal Dialog too.
+- With forced colors the dashed edge takes the text color.
+
+## Server Components
+
+In a React Server Component, use the FileUpload from a client component of your own when you pass
+`labels` with functions: a function cannot cross from the server to a client component.
+
+## Do and don't
+
+- Do say in `hint` what is accepted, in the words the user knows.
+- Do keep `name` on the FileUpload, so that a plain form sends the files.
+- Don't read `input.files` to get the files; use `value` and `onValueChange`.
+- Don't use it for pictures that should be cropped or shown larger: it lists names and sizes.
diff --git a/src/components/file-upload/FileUpload.tsx b/src/components/file-upload/FileUpload.tsx
new file mode 100644
index 0000000..6f2000f
--- /dev/null
+++ b/src/components/file-upload/FileUpload.tsx
@@ -0,0 +1,344 @@
+'use client';
+
+import { clsx } from 'clsx';
+import { forwardRef, useId, useMemo, useReducer, useRef } from 'react';
+import type { ChangeEvent, CSSProperties, MouseEvent, ReactNode } from 'react';
+import { dataAttr } from '../../internal/data-attr';
+import { markAsFieldControl, useFieldContext, useFieldProps } from '../../internal/field-context';
+import { CloseIcon, FileIcon, UploadIcon } from '../../internal/icons';
+import { mergeRefs } from '../../internal/merge-refs';
+import { useAnnounce } from '../../internal/use-announce';
+import { useControllableState } from '../../internal/use-controllable-state';
+import { useFormReset } from '../../internal/use-form-reset';
+import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
+import { devWarn, isProduction } from '../../internal/warn';
+import { IconButton } from '../icon-button/IconButton';
+import { formatFileSize } from './accept';
+
+/** A file that was turned down, and every reason why. */
+export interface FileRejection {
+  file: File;
+  errors: { code: 'type' | 'size' | 'count' | 'custom'; message: string }[];
+}
+
+/** The words the FileUpload says and labels its buttons with; translate them with the page. */
+export interface FileUploadLabels {
+  /** The text before the browse word; end it with a space. Default `"Drag and drop files here or "`. */
+  prompt?: string;
+  /** The word that opens the file dialog, and the name of the input outside a Field. Default `"browse"`. */
+  browse?: string;
+  /** What the zone says while files are dragged over it. Default `"Drop files to upload"`. */
+  dropHere?: string;
+  /** The name of a row's remove button. Default `(name) => "Remove <name>"`. */
+  remove?: (name: string) => string;
+  /** Why a file of the wrong type is turned down. Default `"File type not supported"`. */
+  type?: string;
+  /** Why a file that is too large is turned down. Default `(max) => "File is larger than <max>"`. */
+  size?: (max: string) => string;
+  /** Why a file over `maxFiles` is turned down. Default `"Only 1 file"` for 1, else `"Up to <n> files"`. */
+  count?: (max: number) => string;
+  /** What is said when files are added. Default `"1 file added"` or `"<n> files added"`. */
+  added?: (count: number) => string;
+  /** What is said when files are turned down. Default `"1 file rejected"` or `"<n> files rejected"`. */
+  rejected?: (count: number) => string;
+}
+
+export interface FileUploadProps {
+  /** The files. Pass it with `onValueChange` to control them. */
+  value?: File[];
+  /** The files at first, when `value` is not controlled. */
+  defaultValue?: File[];
+  /** Called with all the files whenever the user adds or removes some. */
+  onValueChange?: (files: File[]) => void;
+  /** Which files the file dialog offers, as the native attribute: `"image/*"`, `".pdf,.docx"`. */
+  accept?: string;
+  /** Whether more than one file can be held. Default `true`. With `false` a new pick replaces the file. */
+  multiple?: boolean;
+  /** The largest size of a file, in bytes. */
+  maxSize?: number;
+  /** The most files that can be held. */
+  maxFiles?: number;
+  /** Decides about a file: a string turns it down with that sentence, `null` accepts it. */
+  validate?: (file: File) => string | null;
+  /** Called once for every addition that had files turned down. */
+  onReject?: (rejections: FileRejection[]) => void;
+  disabled?: boolean;
+  /** The form must hold a file to be submitted; the browser's own check stops an empty submit. */
+  required?: boolean;
+  /** Marks the value as wrong. Inside a Field with an error this is already true. */
+  invalid?: boolean;
+  /** The name of the file input in the form data. */
+  name?: string;
+  /** The id of the form the input belongs to, when it is not inside it. */
+  form?: string;
+  /** BCP 47 locale of the file sizes. Default `"en-US"`. */
+  locale?: string;
+  /** A line under the prompt, such as the types and sizes that are accepted. */
+  hint?: ReactNode;
+  /** On the file input, which is where a Field's label points. */
+  id?: string;
+  /** On the element around the zone and the list. */
+  className?: string;
+  /** On the element around the zone and the list. */
+  style?: CSSProperties;
+  'aria-label'?: string;
+  'aria-labelledby'?: string;
+  'aria-describedby'?: string;
+  /** The words the FileUpload says. */
+  labels?: FileUploadLabels;
+}
+
+const NO_FILES: File[] = [];
+
+const DEFAULT_LABELS = {
+  prompt: 'Drag and drop files here or ',
+  browse: 'browse',
+  dropHere: 'Drop files to upload',
+  remove: (name: string) => `Remove ${name}`,
+  type: 'File type not supported',
+  size: (max: string) => `File is larger than ${max}`,
+  count: (max: number) => (max === 1 ? 'Only 1 file' : `Up to ${max} files`),
+  added: (count: number) => (count === 1 ? '1 file added' : `${count} files added`),
+  rejected: (count: number) => (count === 1 ? '1 file rejected' : `${count} files rejected`),
+};
+
+// A row keeps its key for as long as it holds the same File, whichever place in the list that is.
+const keys = new WeakMap<File, string>();
+let lastKey = 0;
+const keyOf = (file: File): string => {
+  let key = keys.get(file);
+  if (key === undefined) {
+    lastKey += 1;
+    key = String(lastKey);
+    keys.set(file, key);
+  }
+  return key;
+};
+
+const isFile = (item: unknown): item is File => typeof File !== 'undefined' && item instanceof File;
+
+const sameFile = (a: File, b: File) =>
+  a === b ||
+  (a.name === b.name &&
+    a.size === b.size &&
+    a.type === b.type &&
+    a.lastModified === b.lastModified);
+
+/**
+ * Puts `files` into `input.files`, unless it holds them already. A file input takes a `FileList`, and
+ * only a `DataTransfer` makes one. Where there is none (jsdom, old engines) the input stays as the
+ * browser set it, which after a second pick is that pick alone: the list on the screen is then the
+ * library's, and a form sends only the last pick.
+ */
+function writeFiles(input: HTMLInputElement, files: File[]): void {
+  if (typeof DataTransfer === 'undefined') return;
+  const held = input.files;
+  if (
+    held &&
+    held.length === files.length &&
+    files.every((file, at) => sameFile(file, held[at]!))
+  ) {
+    return;
+  }
+  const transfer = new DataTransfer();
+  files.forEach((file) => transfer.items.add(file));
+  input.files = transfer.files;
+}
+
+/**
+ * A zone with a native file input, and the list of the files held. The input is the control: it sits
+ * over the word "browse", so its click, its keyboard, its `required` check and its place in a form are
+ * the browser's; the library keeps the files of all the picks in `input.files`. `ref` is the input;
+ * `className` and `style` go on the element around the zone and the list.
+ */
+export const FileUpload = markAsFieldControl(
+  forwardRef<HTMLInputElement, FileUploadProps>(function FileUpload(props, ref) {
+    const {
+      value,
+      defaultValue,
+      onValueChange,
+      accept,
+      multiple = true,
+      locale = 'en-US',
+      invalid: invalidProp,
+      name,
+      form,
+      hint,
+      className,
+      style,
+      labels,
+      // Not attributes of the input: they must stay out of what is spread onto it.
+      maxSize,
+      maxFiles,
+      validate,
+      onReject,
+      ...rest
+    } = props;
+    void [maxSize, maxFiles, validate, onReject];
+    const field = useFieldContext();
+    const hintId = useId();
+    const { invalid, required, disabled, ...inputProps } = useFieldProps({
+      ...rest,
+      invalid: invalidProp,
+      'aria-describedby':
+        [rest['aria-describedby'], hint ? hintId : undefined].filter(Boolean).join(' ') ||
+        undefined,
+    });
+    const words = { ...DEFAULT_LABELS, ...labels };
+    const { announce, region } = useAnnounce();
+
+    const [held, setHeld, resetHeld] = useControllableState<File[]>({
+      value,
+      defaultValue: defaultValue ?? NO_FILES,
+      onChange: onValueChange,
+      name: 'FileUpload value',
+    });
+    // What is shown and written: only Files, and one at most when the input takes one. The list the
+    // parent passed is never changed.
+    const files = useMemo(() => {
+      const only = held.filter(isFile);
+      return multiple ? only : only.slice(0, 1);
+    }, [held, multiple]);
+    // The checks below only feed warnings, so production skips them: they run on every render.
+    if (!isProduction()) {
+      if (held.some((item) => !isFile(item))) {
+        devWarn('<FileUpload> value has entries that are not File objects. They are ignored.');
+      }
+      if (!multiple && held.filter(isFile).length > 1) {
+        devWarn(
+          '<FileUpload> has more than one file in value and multiple is off. Only the first is shown and sent.',
+        );
+      }
+    }
+
+    const inputRef = useRef<HTMLInputElement | null>(null);
+    const mergedRef = useMemo(() => mergeRefs(ref, inputRef), [ref]);
+    const listRef = useRef<HTMLUListElement>(null);
+
+    // A change of the user makes a commit even where it changes no state (a pick that was
+    // cancelled, a parent that kept its value): the browser has changed `input.files` on its own,
+    // and the commit puts it back.
+    const [, commit] = useReducer((count: number) => count + 1, 0);
+    // A removal moves focus once the rows are rendered: to the button that takes the removed one's
+    // place, which is only known then. `from` tells this commit from one that left the files as they
+    // were (a controlled parent that said no).
+    const focusAfter = useRef<{ from: File[]; index: number } | null>(null);
+    useIsoLayoutEffect(() => {
+      const input = inputRef.current;
+      if (input) writeFiles(input, files);
+      const pending = focusAfter.current;
+      if (!pending) return;
+      focusAfter.current = null;
+      if (pending.from === files) return;
+      const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('button');
+      (buttons?.[Math.min(pending.index, files.length - 1)] ?? input)?.focus();
+    });
+
+    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
+      const picked = Array.from(event.currentTarget.files ?? []);
+      // Some engines empty the input when the dialog is cancelled: the files held stay.
+      if (picked.length > 0) {
+        setHeld(multiple ? [...files, ...picked] : picked.slice(0, 1));
+        announce(words.added(picked.length));
+      }
+      commit();
+    };
+    const removeAt = (index: number) => {
+      focusAfter.current = { from: files, index };
+      setHeld(files.filter((_, at) => at !== index));
+      commit();
+    };
+
+    // The browser has emptied the input. The files of an uncontrolled FileUpload go back to the
+    // default and a controlled one keeps its value; the commit writes them into the input.
+    useFormReset(inputRef, () => {
+      resetHeld(defaultValue ?? NO_FILES);
+      commit();
+    });
+
+    // The zone is a pointer's convenience: a press anywhere that is no control opens the dialog.
+    // Keyboard users have the input.
+    const handleZoneClick = (event: MouseEvent<HTMLDivElement>) => {
+      if (disabled || event.button !== 0) return;
+      if ((event.target as Element).closest('a[href], button, input, select, textarea, label')) {
+        return;
+      }
+      inputRef.current?.click();
+    };
+
+    return (
+      <div
+        className={clsx('flg-file-upload', className)}
+        style={style}
+        data-disabled={dataAttr(disabled)}
+        data-invalid={dataAttr(invalid)}
+      >
+        {/* Only forwards a press to the input, which keyboard users reach directly. */}
+        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
+        <div className="flg-file-upload-zone" onClick={handleZoneClick}>
+          <span className="flg-file-upload-icon" aria-hidden="true">
+            <UploadIcon width={24} height={24} />
+          </span>
+          <p className="flg-file-upload-prompt">
+            {words.prompt}
+            <span className="flg-file-upload-browse">
+              <span aria-hidden="true">{words.browse}</span>
+              <input
+                aria-label={
+                  !field && !rest['aria-label'] && !rest['aria-labelledby']
+                    ? words.browse
+                    : undefined
+                }
+                {...inputProps}
+                ref={mergedRef}
+                type="file"
+                // Chromium would show "No file chosen" as a tooltip.
+                title=""
+                name={name}
+                form={form}
+                accept={accept}
+                multiple={multiple}
+                required={required}
+                disabled={disabled}
+                onChange={handleChange}
+              />
+            </span>
+          </p>
+          {hint ? (
+            <p id={hintId} className="flg-file-upload-hint">
+              {hint}
+            </p>
+          ) : null}
+        </div>
+        {files.length > 0 ? (
+          <ul ref={listRef} className="flg-file-upload-list">
+            {files.map((file, index) => (
+              <li key={keyOf(file)} className="flg-file-upload-file">
+                <span className="flg-file-upload-file-icon" aria-hidden="true">
+                  <FileIcon width={16} height={16} />
+                </span>
+                <span className="flg-file-upload-file-main">
+                  <span className="flg-file-upload-file-name">{file.name}</span>
+                  <span className="flg-file-upload-file-size">
+                    {formatFileSize(file.size, locale)}
+                  </span>
+                </span>
+                <IconButton
+                  type="button"
+                  variant="ghost"
+                  size="sm"
+                  aria-label={words.remove(file.name)}
+                  disabled={disabled}
+                  onClick={() => removeAt(index)}
+                >
+                  <CloseIcon width={14} height={14} aria-hidden="true" />
+                </IconButton>
+              </li>
+            ))}
+          </ul>
+        ) : null}
+        {region}
+      </div>
+    );
+  }),
+);
diff --git a/src/components/file-upload/index.ts b/src/components/file-upload/index.ts
new file mode 100644
index 0000000..464f659
--- /dev/null
+++ b/src/components/file-upload/index.ts
@@ -0,0 +1,2 @@
+export { FileUpload } from './FileUpload';
+export type { FileRejection, FileUploadLabels, FileUploadProps } from './FileUpload';
diff --git a/src/index.ts b/src/index.ts
index 63b789d..4a3cc2e 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -148,6 +148,8 @@ export { Calendar } from './components/calendar';
 export type { CalendarLabels, CalendarProps, CalendarRange } from './components/calendar';
 export { DatePicker } from './components/date-picker';
 export type { DatePickerLabels, DatePickerProps } from './components/date-picker';
+export { FileUpload } from './components/file-upload';
+export type { FileRejection, FileUploadLabels, FileUploadProps } from './components/file-upload';
 export type {
   BreadcrumbLinkProps,
   BreadcrumbPageProps,
diff --git a/src/styles/components/file-upload.css b/src/styles/components/file-upload.css
new file mode 100644
index 0000000..8493a96
--- /dev/null
+++ b/src/styles/components/file-upload.css
@@ -0,0 +1,135 @@
+/* FileUpload (spec phase 3 §4.3, mockup F1): a large dashed zone with the upload icon, the prompt
+   and a browse link, and the list of files under it. The native file input is the control; it lies
+   over the browse word and is drawn by it. */
+@layer flg.components {
+  .flg-file-upload {
+    display: flex;
+    flex-direction: column;
+    gap: 4px;
+    width: 100%;
+    min-width: 0;
+    box-sizing: border-box;
+    font-family: var(--flg-font-sans);
+  }
+  .flg-file-upload-zone {
+    box-sizing: border-box;
+    min-height: 140px;
+    display: flex;
+    flex-direction: column;
+    align-items: center;
+    justify-content: center;
+    gap: 6px;
+    padding: 16px;
+    text-align: center;
+    border: 1.5px dashed var(--flg-dropzone-border);
+    border-radius: var(--flg-radius-lg);
+    background: var(--flg-control-bg-secondary);
+    transition:
+      background-color var(--flg-duration-fast) var(--flg-ease),
+      border-color var(--flg-duration-fast) var(--flg-ease);
+  }
+  /* With files below it the zone shrinks to a strip. */
+  .flg-file-upload:has(> .flg-file-upload-list) > .flg-file-upload-zone {
+    min-height: 0;
+    padding: 12px;
+  }
+  .flg-file-upload[data-invalid] > .flg-file-upload-zone {
+    border-color: var(--flg-danger);
+  }
+  .flg-file-upload-icon {
+    display: inline-flex;
+    color: var(--flg-text-muted);
+  }
+  .flg-file-upload-prompt,
+  .flg-file-upload-hint {
+    margin: 0;
+  }
+  .flg-file-upload-prompt {
+    font-size: var(--flg-text-sm);
+    color: var(--flg-text);
+  }
+  .flg-file-upload-hint {
+    font-size: var(--flg-text-xs);
+    color: var(--flg-text-muted);
+  }
+  /* The word that looks like a link. The input fills it, invisible, so a press on the word is a
+     press on the input, and the ring on the focused input is drawn around the word. */
+  .flg-file-upload-browse {
+    position: relative;
+    display: inline;
+    font-size: var(--flg-text-sm);
+    font-weight: var(--flg-weight-semibold);
+    color: var(--flg-accent-text);
+    text-decoration: underline;
+    text-underline-offset: 2px;
+    border-radius: var(--flg-radius-xs);
+    cursor: pointer;
+  }
+  .flg-file-upload-browse > input {
+    position: absolute;
+    inset: 0;
+    width: 100%;
+    height: 100%;
+    margin: 0;
+    padding: 0;
+    opacity: 0;
+    cursor: pointer;
+  }
+  .flg-file-upload-browse:has(> input:focus-visible) {
+    outline: 2px solid var(--flg-focus-outline-color);
+    outline-offset: 2px;
+    box-shadow: var(--flg-focus-ring);
+  }
+  .flg-file-upload[data-disabled] > .flg-file-upload-zone {
+    opacity: 0.5;
+    cursor: not-allowed;
+  }
+  .flg-file-upload[data-disabled] .flg-file-upload-browse,
+  .flg-file-upload[data-disabled] .flg-file-upload-browse > input {
+    cursor: not-allowed;
+  }
+  .flg-file-upload-list {
+    display: flex;
+    flex-direction: column;
+    gap: 6px;
+    margin: 0;
+    padding: 0;
+    list-style: none;
+  }
+  .flg-file-upload-file {
+    display: flex;
+    align-items: center;
+    gap: 10px;
+    box-sizing: border-box;
+    padding: 6px 6px 6px 10px;
+    border: 1px solid var(--flg-control-border);
+    border-radius: var(--flg-radius-md);
+    background: var(--flg-control-bg);
+  }
+  .flg-file-upload-file-icon {
+    display: inline-flex;
+    flex: none;
+    color: var(--flg-text-muted);
+  }
+  /* Sized by its row, never by its text: a long name would otherwise widen the whole FileUpload
+     wherever it sits in a track sized by its content. */
+  .flg-file-upload-file-main {
+    display: flex;
+    flex: 1;
+    min-width: 0;
+    contain: inline-size;
+    flex-direction: column;
+    gap: 1px;
+  }
+  .flg-file-upload-file-name {
+    overflow: hidden;
+    text-overflow: ellipsis;
+    white-space: nowrap;
+    font-size: var(--flg-text-sm);
+    color: var(--flg-text);
+  }
+  .flg-file-upload-file-size {
+    font-size: var(--flg-text-xs);
+    color: var(--flg-text-muted);
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index bd4785c..bbb4acc 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -33,6 +33,7 @@
 @import './components/pagination.css';
 @import './components/calendar.css';
 @import './components/date-picker.css';
+@import './components/file-upload.css';
 @import './components/toast.css';
 @import './components/floating.css';
 @import './preferences.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 4ac5258..984b673 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -387,6 +387,10 @@
     .flg-input:has(> input:disabled) .flg-date-picker-button {
       color: GrayText;
     }
+    /* A FileUpload's zone keeps its dashed edge, in the text colour (spec §4.5). */
+    .flg-file-upload-zone {
+      border-color: CanvasText;
+    }
     /* The status bar of a toast (spec §4.5); the named icon still tells the status. */
     .flg-toast::before {
       background: CanvasText;
diff --git a/src/styles/theme/values.ts b/src/styles/theme/values.ts
index 598abe1..c21b116 100644
--- a/src/styles/theme/values.ts
+++ b/src/styles/theme/values.ts
@@ -127,6 +127,8 @@ export const derivedTokens: TokenMap = {
   'selected-text': 'var(--flg-accent-text)',
   // The tick dots under a Slider track (mockup S3): the muted text colour at 70%.
   'slider-tick': 'color-mix(in srgb, var(--flg-text-muted) 70%, transparent)',
+  // The dashed edge of a FileUpload zone (mockup F1): the muted text colour at 45%.
+  'dropzone-border': 'color-mix(in srgb, var(--flg-text-muted) 45%, transparent)',
 };
 
 /** No backdrop-filter support, or prefers-reduced-transparency: an almost opaque surface. */
@@ -155,6 +157,8 @@ export const contrastMore: Readonly<{ shared: TokenMap; light: TokenMap; dark: T
     'selected-text': 'var(--flg-highlight-text)',
     // Solid, so the dots keep 3:1 against the surface (spec phase 3 §4.2).
     'slider-tick': 'var(--flg-text-muted)',
+    // Solid, so the dashed edge keeps 3:1 against the surface (spec phase 3 §4.2).
+    'dropzone-border': 'var(--flg-text-muted)',
   },
   light: {
     'glass-tint': 'rgb(250,251,255)',
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/file-upload src/index.test.ts
pnpm vitest run --project storybook-light --project storybook-dark src/components/file-upload
pnpm build && pnpm check:package
```

Expected:
- Unit: 130 test PASS, không lỗi kiểu (`FileUpload.test.tsx` 53 ở mỗi project React, `FileUpload.test-d.ts` 3, `accept.test.ts` 20, `index.test.ts` 1).
- Story FileUpload: 42 test PASS (7 story × ba engine × hai theme). axe chạy sau play function, không có vi phạm. Play function của `Look` đo các số của F1: vùng thả trống cao ít nhất 140px, viền đứt nét, padding 12px khi có dòng, viền khác màu khi invalid, `opacity: .5` và `not-allowed` khi disabled, input phủ đúng bề rộng chữ "browse", tên dài kết thúc bằng "…" trong cột 360px (phát hiện 5).
- `check:package` PASS, gồm `check:use-client`, `check:dist-css` (mười hai class `flg-file-upload*`) và `size`. Theo lần chạy nháp: JS 42.66 kB trên 45.04 kB, CSS 8.36 kB trên 8.88 kB.
- FileUpload là component mới, và các file dùng chung chỉ được thêm vào (phát hiện 16), nên ảnh chuẩn của component cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md \
  scripts/check-dist-css.ts \
  scripts/check-use-client.ts \
  src/components/file-upload/FileUpload.mdx \
  src/components/file-upload/FileUpload.stories.tsx \
  src/components/file-upload/FileUpload.test-d.ts \
  src/components/file-upload/FileUpload.test.tsx \
  src/components/file-upload/FileUpload.tsx \
  src/components/file-upload/index.ts \
  src/index.test.ts \
  src/index.ts \
  src/styles/components/file-upload.css \
  src/styles/index.css \
  src/styles/preferences.css \
  src/styles/theme/values.ts
```
```bash
git commit -m "feat(file-upload): FileUpload with the picker, the list of files and the form (look F1)" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 3: FileUpload kiểm tra tệp, dòng bị từ chối và kéo thả

Spec §4.3 **FileUpload (F1)** ý **Khi đang kéo tệp qua** và **Dòng bị từ chối**; §4.5 **FileUpload** (khi kéo, dòng bị từ chối); §6.3 **`FileUpload`** ý **Kéo thả**, **Thêm tệp** và **Danh sách**; §7 dòng 1, 2 và 5; §10 (dòng `DataTransfer`).
- **Kiểm tra** mọi tệp được thêm, chọn hay thả, theo thứ tự `accept`, `maxSize`, `validate`, `maxFiles`; một tệp gom mọi lỗi của nó (phát hiện 7).
- **Dòng bị từ chối** đứng sau các dòng được nhận, với lời báo của lỗi đầu tiên, `data-rejected` và nút xoá riêng. Chúng không vào `value` hay `input.files`; reset form xoá chúng.
- **`onReject`** được gọi một lần cho mỗi lượt có tệp bị từ chối. Vùng live nói một câu cho mỗi lượt, các phần nối bằng `'. '`.
- **Kéo thả** trên vùng thả, đúng §6.3 **Kéo thả**: bộ đếm, `data-dragging` chỉ khi kéo tệp, `dropEffect`, `drop` luôn bị chặn, thư mục bị bỏ qua, disabled không thêm gì. Khi kéo, lời nhắc thành `labels.dropHere` (đậm `--flg-weight-semibold`).
- **Giao diện:** khi kéo, viền `--flg-accent-solid`, nền `--flg-accent-subtle`, icon và lời nhắc `--flg-accent-text` (Task 4 chuyển nền và chữ sang `--flg-selected-*`). Dòng bị từ chối: viền, tên và icon `--flg-danger`; lời báo `--flg-text-xs`, `--flg-weight-medium`, `--flg-danger`. Forced colors theo §4.5.
- Trang MDX có thêm mục "Limits and rejected files" và "Drag and drop".
- Task này không sửa dòng spec nào. Các lựa chọn khi làm ở phát hiện 6, 7 và 8.

**Files:**
- Modify: `src/components/file-upload/FileUpload.tsx`, `FileUpload.test.tsx`, `FileUpload.stories.tsx`, `FileUpload.mdx`, `src/styles/components/file-upload.css`, `src/styles/preferences.css`, `scripts/check-dist-css.ts`

**Interfaces:**
- Produces:
  - Các prop đã khai báo ở Task 2 nay có hiệu lực: `accept` (kiểm bằng `matchesAccept`), `maxSize`, `maxFiles`, `validate` (`null` hoặc `''` là nhận; JSDoc nói điều đó), `onReject`.
  - Lỗi `{ code, message }`: `type` với `labels.type`; `size` với `labels.size(formatFileSize(maxSize, locale))`; `custom` với chuỗi của `validate`; `count` với `labels.count(limit)`, trong đó `limit` là `maxFiles`, hoặc 1 khi `multiple={false}`.
  - Hook DOM: `data-dragging` trên gốc (đang kéo tệp và không disabled); `data-rejected` trên `li` của dòng bị từ chối.
  - Class mới: `flg-file-upload-file-error` (lời báo thay cho cỡ tệp), `flg-file-upload-drop-message` (lời nhắc khi kéo).
- Consumes: `FileUpload` của Task 2; `matchesAccept` và `formatFileSize` (Task 1).

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/file-upload/FileUpload.stories.tsx b/src/components/file-upload/FileUpload.stories.tsx
index d62dbe9..ac3ae37 100644
--- a/src/components/file-upload/FileUpload.stories.tsx
+++ b/src/components/file-upload/FileUpload.stories.tsx
@@ -31,6 +31,24 @@ const caption = {
 const file = (name: string, size: number, type: string) =>
   new File([new Uint8Array(size)], name, { type });
 
+/** A `DataTransfer` that holds `files`, as a drag from the desktop carries them. */
+function dragOf(...files: File[]) {
+  const transfer = new DataTransfer();
+  files.forEach((one) => transfer.items.add(one));
+  return transfer;
+}
+
+/** Fires a drag event of `type` on `target` carrying `files`; a real drag from the desktop cannot be scripted. */
+function drag(target: Element, type: string, ...files: File[]) {
+  const event = new DragEvent(type, {
+    bubbles: true,
+    cancelable: true,
+    dataTransfer: dragOf(...files),
+  });
+  target.dispatchEvent(event);
+  return event;
+}
+
 const hint = 'PDF, PNG · up to 10 MB each · up to 3 files';
 const attached = [
   file(
@@ -61,6 +79,20 @@ export const Look: Story = {
         <div style={caption}>Disabled</div>
         <FileUpload aria-label="Attachments, disabled" hint={hint} disabled />
       </div>
+      <div>
+        <div style={caption}>With files turned down (the play function drops them)</div>
+        <FileUpload
+          aria-label="Attachments, rejected"
+          hint={hint}
+          accept=".pdf,image/*"
+          maxSize={1_000_000}
+          defaultValue={[file('contract.pdf', 183_000, 'application/pdf')]}
+        />
+      </div>
+      <div>
+        <div style={caption}>Files dragged over (the play function starts the drag)</div>
+        <FileUpload aria-label="Attachments, dragging" hint={hint} />
+      </div>
       <Field label="Attachments" description="Add the documents of the claim.">
         <FileUpload hint={hint} />
       </Field>
@@ -108,6 +140,59 @@ export const Look: Story = {
       'aria-invalid',
       'true',
     );
+
+    // Two files are dropped on the fifth FileUpload: one of the wrong type, one that is too large.
+    // Each row says why, in place of its size, in the danger colours.
+    const rejectedZone = canvas
+      .getByLabelText('Attachments, rejected')
+      .closest('.flg-file-upload-zone')!;
+    drag(
+      rejectedZone,
+      'drop',
+      file('setup.exe', 1000, 'application/x-msdownload'),
+      file('scan-2026.pdf', 2_400_000, 'application/pdf'),
+    );
+    const rows = await waitFor(() => {
+      const found = canvasElement.querySelectorAll<HTMLElement>('[data-rejected]');
+      expect(found).toHaveLength(2);
+      return found;
+    });
+    await expect(rows[0]!.querySelector('.flg-file-upload-file-error')).toHaveTextContent(
+      'File type not supported',
+    );
+    await expect(rows[1]!.querySelector('.flg-file-upload-file-error')).toHaveTextContent(
+      'File is larger than 1 MB',
+    );
+    await expect(rows[0]!.querySelector('.flg-file-upload-file-size')).toBeNull();
+    const normal = canvasElement.querySelector<HTMLElement>(
+      '.flg-file-upload-file:not([data-rejected])',
+    )!;
+    await expect(getComputedStyle(rows[0]!).borderTopColor).not.toBe(
+      getComputedStyle(normal).borderTopColor,
+    );
+    await expect(
+      getComputedStyle(rows[0]!.querySelector('.flg-file-upload-file-name')!).color,
+    ).toBe(getComputedStyle(rows[0]!.querySelector('.flg-file-upload-file-error')!).color);
+
+    // A drag with a file is over the sixth: the accent edge, and the drop message for the prompt.
+    const dragged = canvas
+      .getByLabelText('Attachments, dragging')
+      .closest('.flg-file-upload-zone')!;
+    drag(dragged, 'dragenter', file('a.pdf', 10, 'application/pdf'));
+    await waitFor(() =>
+      expect(dragged.closest('.flg-file-upload')).toHaveAttribute('data-dragging'),
+    );
+    await expect(dragged).toHaveTextContent('Drop files to upload');
+    // The edge and the wash move over `--flg-duration-fast`.
+    await waitFor(() =>
+      expect(getComputedStyle(dragged).borderTopColor).not.toBe(
+        getComputedStyle(empty).borderTopColor,
+      ),
+    );
+    await expect(getComputedStyle(dragged).borderTopStyle).toBe('dashed');
+    await expect(
+      getComputedStyle(dragged.querySelector('.flg-file-upload-drop-message')!).fontWeight,
+    ).toBe('600');
   },
 };
 
@@ -327,3 +412,66 @@ export const Required: Story = {
     await expect(input.validity.valueMissing).toBe(true);
   },
 };
+
+const dropped: string[][] = [];
+
+/**
+ * A drop on the real input: a `DataTransfer` built in the page, and `dragenter`, `dragover` and
+ * `drop` dispatched on the input inside the zone. The files are judged, and the list and `FormData`
+ * hold the ones that pass; the one that does not stays out of the form (spec §10).
+ */
+export const DropFiles: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <form
+      aria-label="Claim"
+      style={column}
+      onSubmit={(event) => {
+        event.preventDefault();
+        const sent = new FormData(event.currentTarget).getAll('documents') as File[];
+        dropped.push(sent.map((one) => one.name));
+      }}
+    >
+      <FileUpload aria-label="Documents" name="documents" accept=".pdf" hint={hint} />
+      <button type="submit">Send</button>
+    </form>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    dropped.length = 0;
+    const user = (await realUserEvent()) ?? userEvent;
+    const input = canvas.getByLabelText<HTMLInputElement>('Documents');
+    const root = canvasElement.querySelector('.flg-file-upload')!;
+    const files = [file('a.pdf', 10, 'application/pdf'), file('b.png', 10, 'image/png')];
+
+    drag(input, 'dragenter', ...files);
+    await waitFor(() => expect(root).toHaveAttribute('data-dragging'));
+    const over = drag(input, 'dragover', ...files);
+    await expect(over.defaultPrevented).toBe(true);
+    // `dropEffect` is not checked here: a `DataTransfer` made in the page ignores it in Chromium and
+    // WebKit. The unit tests check it.
+    const drop = drag(input, 'drop', ...files);
+    // The browser would otherwise put the files into the input itself.
+    await expect(drop.defaultPrevented).toBe(true);
+    await waitFor(() => expect(root).not.toHaveAttribute('data-dragging'));
+    await waitFor(() => expect(rowsOf(canvasElement)).toEqual(['a.pdf', 'b.png']));
+    await expect(canvasElement.querySelectorAll('[data-rejected]')).toHaveLength(1);
+    await expect(heldBy(input)).toEqual(['a.pdf']);
+    const form = canvasElement.querySelector('form')!;
+    await expect((new FormData(form).getAll('documents') as File[]).map((one) => one.name)).toEqual(
+      ['a.pdf'],
+    );
+    await waitFor(() =>
+      expect(canvasElement.querySelector('[aria-live="polite"]')).toHaveTextContent(
+        '1 file added. 1 file rejected',
+      ),
+    );
+
+    // A second drop adds to the first, and a removal leaves the form with what is still there.
+    drag(input, 'drop', file('c.pdf', 10, 'application/pdf'));
+    await waitFor(() => expect(heldBy(input)).toEqual(['a.pdf', 'c.pdf']));
+    await user.click(canvas.getByRole('button', { name: 'Remove a.pdf' }));
+    await waitFor(() => expect(heldBy(input)).toEqual(['c.pdf']));
+    await user.click(canvas.getByRole('button', { name: 'Send' }));
+    await waitFor(() => expect(dropped).toEqual([['c.pdf']]));
+  },
+};
diff --git a/src/components/file-upload/FileUpload.test.tsx b/src/components/file-upload/FileUpload.test.tsx
index 971b972..68ef729 100644
--- a/src/components/file-upload/FileUpload.test.tsx
+++ b/src/components/file-upload/FileUpload.test.tsx
@@ -38,6 +38,26 @@ const pick = (...files: File[]) => {
   held.set(input(), listOf(files));
   fireEvent.change(input());
 };
+const zone = () => document.querySelector<HTMLElement>('.flg-file-upload-zone')!;
+/** What a drag carries: the types, the files, and the items with which of them are folders. */
+const dataOf = (files: File[], folders: string[] = []) => ({
+  types: ['Files'],
+  files: listOf(files),
+  items: files.map((one) => ({
+    kind: 'file',
+    getAsFile: () => one,
+    webkitGetAsEntry: () => ({ isDirectory: folders.includes(one.name) }),
+  })),
+});
+/**
+ * An event that carries `data` as it is. `fireEvent` would copy the data into a `DataTransfer`,
+ * which here is the stub above, with read-only properties.
+ */
+const dragEvent = (type: 'dragOver' | 'drop', target: Element, data: object) => {
+  const event = createEvent[type](target);
+  Object.defineProperty(event, 'dataTransfer', { value: data });
+  return event;
+};
 const aTaskLater = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
 const live = () => document.querySelector('[aria-live="polite"]')!;
 
@@ -556,6 +576,460 @@ describe('FileUpload', () => {
     });
   });
 
+  describe('checks', () => {
+    it('turns down a file of the wrong type with code type and labels.type', () => {
+      const onReject = vi.fn();
+      render(<FileUpload accept=".pdf" onReject={onReject} />);
+      const bad = file('a.png', 3, 'image/png');
+      pick(bad);
+      expect(onReject).toHaveBeenCalledWith([
+        { file: bad, errors: [{ code: 'type', message: 'File type not supported' }] },
+      ]);
+      expect(rowNames()).toEqual(['a.png']);
+    });
+
+    it('turns down a file over maxSize with the size written in the locale', () => {
+      const onReject = vi.fn();
+      render(<FileUpload maxSize={1500} locale="de-DE" onReject={onReject} />);
+      pick(file('a.pdf', 1501));
+      expect(onReject.mock.calls[0]![0][0].errors).toEqual([
+        { code: 'size', message: 'File is larger than 1,5 kB' },
+      ]);
+    });
+
+    it('accepts a file of exactly maxSize', () => {
+      const onReject = vi.fn();
+      render(<FileUpload maxSize={1500} onReject={onReject} />);
+      pick(file('a.pdf', 1500));
+      expect(onReject).not.toHaveBeenCalled();
+      expect(rowNames()).toEqual(['a.pdf']);
+    });
+
+    it("accepts a file when validate returns an empty string, as setCustomValidity('') does", () => {
+      const onReject = vi.fn();
+      render(<FileUpload validate={() => ''} onReject={onReject} />);
+      pick(file('a.pdf'));
+      expect(onReject).not.toHaveBeenCalled();
+      expect(rowNames()).toEqual(['a.pdf']);
+    });
+
+    it('turns down what validate refuses with its sentence, and accepts on null', () => {
+      const onReject = vi.fn();
+      render(
+        <FileUpload
+          validate={(one) => (one.name.startsWith('x') ? 'No x files' : null)}
+          onReject={onReject}
+        />,
+      );
+      pick(file('xa.pdf'), file('b.pdf'));
+      expect(onReject.mock.calls[0]![0]).toHaveLength(1);
+      expect(onReject.mock.calls[0]![0][0].errors).toEqual([
+        { code: 'custom', message: 'No x files' },
+      ]);
+      expect(rowNames()).toEqual(['b.pdf', 'xa.pdf']);
+    });
+
+    it('counts the files held and those added earlier in the same turn against maxFiles', () => {
+      const onReject = vi.fn();
+      const onValueChange = vi.fn();
+      render(<FileUpload maxFiles={3} onReject={onReject} onValueChange={onValueChange} />);
+      pick(file('a.pdf'), file('b.pdf'));
+      pick(file('c.pdf'), file('d.pdf'), file('e.pdf'));
+      expect(onValueChange.mock.lastCall![0].map((one: File) => one.name)).toEqual([
+        'a.pdf',
+        'b.pdf',
+        'c.pdf',
+      ]);
+      expect(onReject).toHaveBeenCalledTimes(1);
+      expect(onReject.mock.calls[0]![0].map((r: { file: File }) => r.file.name)).toEqual([
+        'd.pdf',
+        'e.pdf',
+      ]);
+      expect(onReject.mock.calls[0]![0][0].errors).toEqual([
+        { code: 'count', message: 'Up to 3 files' },
+      ]);
+    });
+
+    it('does not count a file that was turned down for another reason', () => {
+      render(<FileUpload accept=".pdf" maxFiles={1} />);
+      pick(file('a.png', 3, 'image/png'), file('b.pdf'));
+      expect(rowNames()).toEqual(['b.pdf', 'a.png']);
+      expect(document.querySelectorAll('[data-rejected]')).toHaveLength(1);
+    });
+
+    it('gives a file every error it has, in the order type, size, custom, count', () => {
+      const onReject = vi.fn();
+      render(
+        <FileUpload
+          accept=".pdf"
+          maxSize={1}
+          maxFiles={1}
+          validate={() => 'Nope'}
+          defaultValue={[file('held.pdf')]}
+          onReject={onReject}
+        />,
+      );
+      pick(file('a.png', 5, 'image/png'));
+      expect(onReject.mock.calls[0]![0][0].errors.map((e: { code: string }) => e.code)).toEqual([
+        'type',
+        'size',
+        'custom',
+        'count',
+      ]);
+    });
+
+    it('shows the first error of a file in its row, instead of the size', () => {
+      render(<FileUpload accept=".pdf" maxSize={1} />);
+      pick(file('a.png', 5, 'image/png'));
+      const row = document.querySelector('[data-rejected]')!;
+      expect(row.querySelector('.flg-file-upload-file-error')).toHaveTextContent(
+        'File type not supported',
+      );
+      expect(row.querySelector('.flg-file-upload-file-size')).toBeNull();
+      expect(row.querySelector('.flg-file-upload-file-name')).toHaveTextContent('a.png');
+    });
+
+    it('reads the messages from labels', () => {
+      const onReject = vi.fn();
+      render(
+        <FileUpload
+          accept=".pdf"
+          maxFiles={1}
+          defaultValue={[file('held.pdf')]}
+          labels={{ type: 'Sai loại', count: (max) => `Tối đa ${max}` }}
+          onReject={onReject}
+        />,
+      );
+      pick(file('a.png', 3, 'image/png'));
+      expect(onReject.mock.calls[0]![0][0].errors).toEqual([
+        { code: 'type', message: 'Sai loại' },
+        { code: 'count', message: 'Tối đa 1' },
+      ]);
+    });
+
+    it('judges a dropped file with no type by its extension against accept', () => {
+      const onReject = vi.fn();
+      render(<FileUpload accept=".pdf,image/*" onReject={onReject} />);
+      act(() => {
+        fireEvent.drop(zone(), { dataTransfer: dataOf([file('a.pdf', 3, ''), file('b', 3, '')]) });
+      });
+      expect(onReject.mock.calls[0]![0].map((r: { file: File }) => r.file.name)).toEqual(['b']);
+      expect(rowNames()).toEqual(['a.pdf', 'b']);
+    });
+
+    it('with multiple off judges the first file as usual and turns down the others with count', () => {
+      const onReject = vi.fn();
+      const onValueChange = vi.fn();
+      render(
+        <FileUpload
+          multiple={false}
+          defaultValue={[file('old.pdf')]}
+          onReject={onReject}
+          onValueChange={onValueChange}
+        />,
+      );
+      const [a, b, c] = [file('a.pdf'), file('b.pdf'), file('c.pdf')];
+      act(() => {
+        fireEvent.drop(zone(), { dataTransfer: dataOf([a, b, c]) });
+      });
+      expect(onValueChange).toHaveBeenCalledWith([a]);
+      expect(onReject.mock.calls[0]![0]).toEqual([
+        { file: b, errors: [{ code: 'count', message: 'Only 1 file' }] },
+        { file: c, errors: [{ code: 'count', message: 'Only 1 file' }] },
+      ]);
+      expect(rowNames()).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
+    });
+
+    it('with multiple off keeps the old file when the first of the turn is turned down', () => {
+      const onValueChange = vi.fn();
+      render(
+        <FileUpload
+          multiple={false}
+          accept=".pdf"
+          defaultValue={[file('old.pdf')]}
+          onValueChange={onValueChange}
+        />,
+      );
+      act(() => {
+        fireEvent.drop(zone(), {
+          dataTransfer: dataOf([file('a.png', 3, 'image/png'), file('b.pdf')]),
+        });
+      });
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(rowNames()).toEqual(['old.pdf', 'a.png', 'b.pdf']);
+      expect(document.querySelectorAll('[data-rejected]')).toHaveLength(2);
+    });
+
+    it('calls onValueChange only when something is accepted, and onReject only when something is turned down', () => {
+      const onValueChange = vi.fn();
+      const onReject = vi.fn();
+      render(<FileUpload accept=".pdf" onValueChange={onValueChange} onReject={onReject} />);
+      pick(file('a.png', 3, 'image/png'));
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(onReject).toHaveBeenCalledTimes(1);
+      pick(file('b.pdf'));
+      expect(onValueChange).toHaveBeenCalledTimes(1);
+      expect(onReject).toHaveBeenCalledTimes(1);
+    });
+  });
+
+  describe('rejected rows', () => {
+    it('keeps them out of value and out of input.files, after the accepted rows in order', () => {
+      const onValueChange = vi.fn();
+      render(<FileUpload accept=".pdf" onValueChange={onValueChange} />);
+      pick(file('a.png', 3, 'image/png'), file('b.pdf'));
+      pick(file('c.png', 3, 'image/png'));
+      pick(file('d.pdf'));
+      expect(rowNames()).toEqual(['b.pdf', 'd.pdf', 'a.png', 'c.png']);
+      expect(names(input().files)).toEqual(['b.pdf', 'd.pdf']);
+      expect(onValueChange.mock.lastCall![0].map((f: File) => f.name)).toEqual(['b.pdf', 'd.pdf']);
+      const rows = document.querySelectorAll('.flg-file-upload-file');
+      expect(rows[0]).not.toHaveAttribute('data-rejected');
+      expect(rows[2]).toHaveAttribute('data-rejected');
+    });
+
+    it('shows them under a controlled value that does not hold them', () => {
+      render(<FileUpload accept=".pdf" value={[file('a.pdf')]} onValueChange={() => {}} />);
+      pick(file('b.png', 3, 'image/png'));
+      expect(rowNames()).toEqual(['a.pdf', 'b.png']);
+      expect(names(input().files)).toEqual(['a.pdf']);
+    });
+
+    it('lists a file turned down twice as two rows', () => {
+      render(<FileUpload accept=".pdf" />);
+      const bad = file('a.png', 3, 'image/png');
+      pick(bad);
+      pick(bad);
+      expect(rowNames()).toEqual(['a.png', 'a.png']);
+    });
+
+    it('removes only that row, and moves focus to the button that takes its place', () => {
+      const onValueChange = vi.fn();
+      render(<FileUpload accept=".pdf" onValueChange={onValueChange} />);
+      pick(file('ok.pdf'));
+      pick(
+        file('a.png', 3, 'image/png'),
+        file('b.png', 3, 'image/png'),
+        file('c.png', 3, 'image/png'),
+      );
+      onValueChange.mockClear();
+      fireEvent.click(screen.getByRole('button', { name: 'Remove b.png' }));
+      expect(rowNames()).toEqual(['ok.pdf', 'a.png', 'c.png']);
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(names(input().files)).toEqual(['ok.pdf']);
+      expect(screen.getByRole('button', { name: 'Remove c.png' })).toHaveFocus();
+      fireEvent.click(screen.getByRole('button', { name: 'Remove c.png' }));
+      expect(screen.getByRole('button', { name: 'Remove a.png' })).toHaveFocus();
+    });
+
+    it('moves focus from a removed accepted row to the first rejected row after it', () => {
+      render(<FileUpload accept=".pdf" />);
+      pick(file('ok.pdf'), file('a.png', 3, 'image/png'));
+      fireEvent.click(screen.getByRole('button', { name: 'Remove ok.pdf' }));
+      expect(screen.getByRole('button', { name: 'Remove a.png' })).toHaveFocus();
+    });
+
+    it('moves focus to the input when the last rejected row goes', () => {
+      render(<FileUpload accept=".pdf" />);
+      pick(file('a.png', 3, 'image/png'));
+      fireEvent.click(screen.getByRole('button', { name: 'Remove a.png' }));
+      expect(document.querySelector('ul')).toBeNull();
+      expect(input()).toHaveFocus();
+    });
+
+    it('clears them when the form is reset', async () => {
+      render(
+        <form aria-label="Apply">
+          <FileUpload accept=".pdf" name="cv" />
+        </form>,
+      );
+      pick(file('a.png', 3, 'image/png'), file('b.pdf'));
+      held.set(input(), listOf([]));
+      fireEvent.reset(screen.getByRole('form'));
+      await aTaskLater();
+      expect(rowNames()).toEqual([]);
+    });
+
+    it('disables their remove buttons with the rest', () => {
+      const { rerender } = render(<FileUpload accept=".pdf" />);
+      pick(file('a.png', 3, 'image/png'));
+      rerender(<FileUpload accept=".pdf" disabled />);
+      expect(screen.getByRole('button', { name: 'Remove a.png' })).toBeDisabled();
+    });
+  });
+
+  describe('announcements of additions and rejections', () => {
+    it('says only what was added when nothing was turned down', async () => {
+      render(<FileUpload />);
+      pick(file('a.pdf'));
+      await waitFor(() => expect(live().textContent).toBe('1 file added'));
+    });
+
+    it('says only what was rejected when nothing was added', async () => {
+      render(<FileUpload accept=".pdf" />);
+      pick(file('a.png', 3, 'image/png'), file('b.png', 3, 'image/png'));
+      await waitFor(() => expect(live().textContent).toBe('2 files rejected'));
+    });
+
+    it('says both in one sentence joined by a full stop', async () => {
+      render(<FileUpload accept=".pdf" />);
+      pick(file('a.png', 3, 'image/png'), file('b.pdf'), file('c.pdf'));
+      await waitFor(() => expect(live().textContent).toBe('2 files added. 1 file rejected'));
+    });
+
+    it('says it in the words of labels', async () => {
+      render(
+        <FileUpload
+          accept=".pdf"
+          labels={{ added: (n) => `Thêm ${n}`, rejected: (n) => `Từ chối ${n}` }}
+        />,
+      );
+      pick(file('a.png', 3, 'image/png'), file('b.pdf'));
+      await waitFor(() => expect(live().textContent).toBe('Thêm 1. Từ chối 1'));
+    });
+  });
+
+  describe('drag and drop', () => {
+    const over = (types: string[] = ['Files']) => ({ dataTransfer: { types } });
+
+    it('marks the root while files are dragged over, and shows labels.dropHere for the prompt', () => {
+      render(<FileUpload />);
+      const root = document.querySelector('.flg-file-upload')!;
+      fireEvent.dragEnter(zone(), over());
+      expect(root).toHaveAttribute('data-dragging');
+      expect(zone().querySelector('.flg-file-upload-drop-message')).toHaveTextContent(
+        'Drop files to upload',
+      );
+      expect(zone()).not.toHaveTextContent('Drag and drop');
+      fireEvent.dragLeave(zone(), over());
+      expect(root).not.toHaveAttribute('data-dragging');
+      expect(zone()).toHaveTextContent('Drag and drop files here or');
+    });
+
+    it('reads the drop message from labels', () => {
+      render(<FileUpload labels={{ dropHere: 'Thả tệp' }} />);
+      fireEvent.dragEnter(zone(), over());
+      expect(zone()).toHaveTextContent('Thả tệp');
+    });
+
+    it('stays dragging when the drag goes from the zone onto a child, and ends on the last leave', () => {
+      render(<FileUpload />);
+      const root = document.querySelector('.flg-file-upload')!;
+      const icon = zone().querySelector('.flg-file-upload-icon')!;
+      fireEvent.dragEnter(zone(), over());
+      fireEvent.dragEnter(icon, over());
+      fireEvent.dragLeave(zone(), over());
+      expect(root).toHaveAttribute('data-dragging');
+      fireEvent.dragLeave(icon, over());
+      expect(root).not.toHaveAttribute('data-dragging');
+    });
+
+    it('is not dragging for a drag that carries no files', () => {
+      render(<FileUpload />);
+      fireEvent.dragEnter(zone(), over(['text/plain']));
+      expect(document.querySelector('.flg-file-upload')).not.toHaveAttribute('data-dragging');
+      const event = createEvent.dragOver(zone(), over(['text/plain']));
+      fireEvent(zone(), event);
+      expect(event.defaultPrevented).toBe(false);
+    });
+
+    it('allows the drop with a copy effect on dragover', () => {
+      render(<FileUpload />);
+      const data = { types: ['Files'], dropEffect: 'none' };
+      const event = dragEvent('dragOver', zone(), data);
+      fireEvent(zone(), event);
+      expect(event.defaultPrevented).toBe(true);
+      expect(data.dropEffect).toBe('copy');
+    });
+
+    it('answers dragover with the effect none when disabled, and shows no dragging', () => {
+      render(<FileUpload disabled />);
+      const data = { types: ['Files'], dropEffect: 'copy' };
+      fireEvent.dragEnter(zone(), { dataTransfer: data });
+      fireEvent(zone(), dragEvent('dragOver', zone(), data));
+      expect(data.dropEffect).toBe('none');
+      expect(document.querySelector('.flg-file-upload')).not.toHaveAttribute('data-dragging');
+    });
+
+    it('adds the dropped files, ends the dragging and tells once', async () => {
+      const onValueChange = vi.fn();
+      render(<FileUpload onValueChange={onValueChange} />);
+      const [a, b] = [file('a.pdf'), file('b.pdf')];
+      fireEvent.dragEnter(zone(), over());
+      act(() => {
+        fireEvent.drop(zone(), { dataTransfer: dataOf([a, b]) });
+      });
+      expect(document.querySelector('.flg-file-upload')).not.toHaveAttribute('data-dragging');
+      expect(rowNames()).toEqual(['a.pdf', 'b.pdf']);
+      expect(names(input().files)).toEqual(['a.pdf', 'b.pdf']);
+      expect(onValueChange).toHaveBeenCalledTimes(1);
+      expect(onValueChange).toHaveBeenCalledWith([a, b]);
+      await waitFor(() => expect(live()).toHaveTextContent('2 files added'));
+    });
+
+    it('resets the count on a drop, so the next drag starts from nothing', () => {
+      render(<FileUpload />);
+      const icon = zone().querySelector('.flg-file-upload-icon')!;
+      fireEvent.dragEnter(zone(), over());
+      fireEvent.dragEnter(icon, over());
+      fireEvent.drop(icon, { dataTransfer: dataOf([file('a.pdf')]) });
+      fireEvent.dragEnter(zone(), over());
+      fireEvent.dragLeave(zone(), over());
+      expect(document.querySelector('.flg-file-upload')).not.toHaveAttribute('data-dragging');
+    });
+
+    it('stops the browser from taking a file dropped on the input itself', () => {
+      render(<FileUpload />);
+      const event = createEvent.drop(input(), { dataTransfer: dataOf([file('a.pdf')]) });
+      act(() => {
+        fireEvent(input(), event);
+      });
+      expect(event.defaultPrevented).toBe(true);
+      expect(rowNames()).toEqual(['a.pdf']);
+    });
+
+    it('skips a dropped folder', () => {
+      render(<FileUpload />);
+      act(() => {
+        fireEvent.drop(zone(), {
+          dataTransfer: dataOf([file('docs', 0, ''), file('a.pdf')], ['docs']),
+        });
+      });
+      expect(rowNames()).toEqual(['a.pdf']);
+    });
+
+    it('uses dataTransfer.files where there are no items', () => {
+      render(<FileUpload />);
+      act(() => {
+        fireEvent(
+          zone(),
+          dragEvent('drop', zone(), { types: ['Files'], files: listOf([file('a.pdf')]) }),
+        );
+      });
+      expect(rowNames()).toEqual(['a.pdf']);
+    });
+
+    it('adds nothing when disabled, and still takes the drop from the browser', () => {
+      const onValueChange = vi.fn();
+      render(<FileUpload disabled onValueChange={onValueChange} />);
+      const event = createEvent.drop(zone(), { dataTransfer: dataOf([file('a.pdf')]) });
+      fireEvent(zone(), event);
+      expect(event.defaultPrevented).toBe(true);
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(document.querySelector('ul')).toBeNull();
+    });
+
+    it('puts the rejected files of a drop in rows and tells onReject', () => {
+      const onReject = vi.fn();
+      render(<FileUpload accept=".pdf" onReject={onReject} />);
+      act(() => {
+        fireEvent.drop(zone(), { dataTransfer: dataOf([file('a.png', 3, 'image/png')]) });
+      });
+      expect(onReject).toHaveBeenCalledTimes(1);
+      expect(document.querySelectorAll('[data-rejected]')).toHaveLength(1);
+    });
+  });
+
   describe('warnings', () => {
     it('warns about an entry of value that is not a File, and leaves it out', () => {
       const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/file-upload/FileUpload.test.tsx
```

Expected: FAIL. Ở mỗi project React, 29 trong 92 test fail và 63 pass: 29 trong 38 test mới fail trên code của Task 2, như bản nháp ghi, và test thứ 39 (Claude thêm sau) pass ở đó (phát hiện 15). Ví dụ các lỗi ghi được ở bản nháp:
- `turns down a file of the wrong type with code type and labels.type`: `expected vi.fn() to be called with arguments` (`onReject` chưa làm gì);
- `turns down a file over maxSize with the size written in the locale`, `gives a file every error it has, in the order type, size, custom, count`, `reads the messages from labels` và `judges a dropped file with no type by its extension against accept`: `Cannot read properties of undefined (reading '0')` (không có lần gọi `onReject`);
- `counts the files held and those added earlier in the same turn against maxFiles`: danh sách có 5 tệp, không phải 3;
- `with multiple off judges the first file as usual and turns down the others with count`: `expected vi.fn() to be called with [ [ File{} ] ]`;
- `calls onValueChange only when something is accepted, and onReject only when something is turned down`: `expected vi.fn() to not be called at all`;
- `keeps them out of value and out of input.files, after the accepted rows in order`: các dòng là `a.png, b.pdf, c.png, d.pdf` (mọi tệp được nhận); `shows them under a controlled value that does not hold them`: `expected ['a.pdf'] to deeply equal ['a.pdf', 'b.png']`;
- `says only what was rejected when nothing was added`, `says both in one sentence joined by a full stop` và `says it in the words of labels`: chữ của vùng live không bao giờ khớp (`waitFor` hết 1 s);
- `marks the root while files are dragged over, and shows labels.dropHere for the prompt` và `stays dragging when the drag goes from the zone onto a child, and ends on the last leave`: không có `data-dragging`;
- `allows the drop with a copy effect on dragover`, `stops the browser from taking a file dropped on the input itself` và `adds nothing when disabled, and still takes the drop from the browser`: `expected false to be true`;
- `adds the dropped files, ends the dragging and tells once`, `skips a dropped folder` và `uses dataTransfer.files where there are no items`: `expected [] to deeply equal [...]`; `puts the rejected files of a drop in rows and tells onReject`: `onReject` được gọi 0 lần.

Mười test mới pass trên code cũ: chúng là test đặc tả, hoặc pass vì code cũ chưa có dòng bị từ chối nào. Bản nháp đã kiểm chúng trên code mới: `accepts a file of exactly maxSize`, `accepts a file when validate returns an empty string, as setCustomValidity('') does`, `lists a file turned down twice as two rows`, `moves focus from a removed accepted row to the first rejected row after it`, `moves focus to the input when the last rejected row goes`, `clears them when the form is reset`, `disables their remove buttons with the rest`, `says only what was added when nothing was turned down`, `is not dragging for a drag that carries no files` và `resets the count on a drop, so the next drag starts from nothing`.

- [ ] **Step 3: Viết code**

````diff
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 977ab09..e9a6b23 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -113,6 +113,8 @@ const SHIPPED_CLASSES = [
   'flg-file-upload-file-main',
   'flg-file-upload-file-name',
   'flg-file-upload-file-size',
+  'flg-file-upload-file-error',
+  'flg-file-upload-drop-message',
   'flg-toaster',
   'flg-toaster-list',
   'flg-toast',
diff --git a/src/components/file-upload/FileUpload.mdx b/src/components/file-upload/FileUpload.mdx
index 098b468..77517da 100644
--- a/src/components/file-upload/FileUpload.mdx
+++ b/src/components/file-upload/FileUpload.mdx
@@ -30,13 +30,14 @@ draws the list with a remove button for each file.
 - **A second pick adds** to the files already there; it does not replace them. With
   `multiple={false}` a new pick replaces the file.
 - **Cancelling** the dialog keeps the list, in engines that empty the input when it happens.
-- `accept` is passed to the input, so the dialog offers only those files. It is the native
-  attribute: `"image/*"`, `".pdf,.docx"`, `"application/pdf"`.
+- `accept` is passed to the input, so the dialog offers only those files, and it is checked on every
+  added file (see Limits). It is the native attribute: `"image/*"`, `".pdf,.docx"`,
+  `"application/pdf"`.
 
 <Canvas of={Stories.Picking} />
 
-`onValueChange` is called once per pick with all the files, in order. The live region of the
-FileUpload says how many were added (`labels.added`).
+`onValueChange` is called once per addition with all the files, in order, when at least one file
+was accepted. The live region of the FileUpload says how many were added (`labels.added`).
 
 <Canvas of={Stories.SingleFile} />
 
@@ -48,6 +49,68 @@ removed, and to the input when none is left, so a keyboard user does not lose th
 
 <Canvas of={Stories.Removing} />
 
+## Limits and rejected files
+
+Every file that is added, from the dialog or by a drop, is checked in this order. A file can fail
+more than one check, and it is accepted only when it fails none.
+
+| Prop       | Check                                                              | Code     | Message                           |
+| ---------- | ------------------------------------------------------------------ | -------- | --------------------------------- |
+| `accept`   | The native attribute: extensions, MIME types, `image/*`            | `type`   | `labels.type`                     |
+| `maxSize`  | The most bytes a file may have                                     | `size`   | `labels.size(maxSize)`, as `1 MB` |
+| `validate` | `(file) => string \| null`; a non-empty string turns the file down | `custom` | The string                        |
+| `maxFiles` | The files held, with those accepted earlier in the turn            | `count`  | `labels.count(maxFiles)`          |
+
+A dropped file often has no `type`, so with a MIME type or a wildcard in `accept` it passes only if
+an extension in `accept` matches its name.
+
+With `multiple={false}` the first file of an addition is judged like any other and, when accepted,
+replaces the file held. Every other file of the same drop is turned down with `count`.
+
+A file turned down is not lost silently:
+
+- It gets a **rejected row** after the rows of the accepted files, in the order the files came,
+  with its name and the **first** of its errors in place of the size, in the danger colors. The
+  message is text, so the state does not rest on color. Its remove button takes the row away and
+  nothing else, and the focus goes where it goes after any removal.
+- **`onReject(rejections)`** is called once per addition that had files turned down. Each entry is
+  `{ file, errors: { code, message }[] }`, with every error of the file.
+- The live region says what happened in one sentence: `labels.added` and `labels.rejected`, the
+  parts that apply, joined by a full stop ("2 files added. 1 file rejected").
+
+Rejected files are state of the FileUpload only. They are not in `value`, `onValueChange` or
+`input.files`, so a form never sends them, and a form reset clears the rows.
+
+```tsx
+<FileUpload
+  name="attachments"
+  accept=".pdf,image/*"
+  maxSize={10_000_000}
+  maxFiles={3}
+  validate={(file) => (file.name.includes(' ') ? 'Rename the file without spaces' : null)}
+  onReject={(rejections) => report(rejections.map((r) => r.errors[0]!.message))}
+/>
+```
+
+## Drag and drop
+
+Files can be dropped on the zone. It is a convenience for the pointer: everything it does, the
+dialog does with a keyboard. While files are dragged over the zone, it takes the accent edge and
+wash, and the prompt reads `labels.dropHere`.
+
+- Only a drag that carries files counts; dragged text is left to the browser. The zone counts the
+  `dragenter` and `dragleave` of its children, so the state does not flicker over the icon.
+- A file dropped on the zone, on the word "browse" or on the input is added like a picked one. The
+  FileUpload cancels the browser's own handling of the drop, so the browser does not put the files
+  into the input behind its back.
+- A dropped folder is skipped. A disabled FileUpload adds nothing.
+
+A drop gives the FileUpload files that the page can read, and it puts the accepted ones into
+`input.files` through a `DataTransfer`, as a pick does. This works in every supported engine; where
+there is no `DataTransfer` the form sends only the last pick.
+
+<Canvas of={Stories.DropFiles} />
+
 ## Controlled use
 
 `value` is the list of files and `onValueChange` is called with the whole list when the user adds or
@@ -124,7 +187,7 @@ with a space, because the browse word follows it.
   keyboard.
 - The list has list semantics, and each remove button has its own name. The FileUpload has its own live
   region, in its root, so it is read inside a modal Dialog too.
-- With forced colors the dashed edge takes the text color.
+- With forced colors the dashed edge takes the text color, and the edge of a zone with files over it takes the highlight color. A rejected row keeps the edge of the other rows; its reason is written out.
 
 ## Server Components
 
diff --git a/src/components/file-upload/FileUpload.tsx b/src/components/file-upload/FileUpload.tsx
index 6f2000f..7ad599a 100644
--- a/src/components/file-upload/FileUpload.tsx
+++ b/src/components/file-upload/FileUpload.tsx
@@ -1,8 +1,8 @@
 'use client';
 
 import { clsx } from 'clsx';
-import { forwardRef, useId, useMemo, useReducer, useRef } from 'react';
-import type { ChangeEvent, CSSProperties, MouseEvent, ReactNode } from 'react';
+import { forwardRef, useId, useMemo, useReducer, useRef, useState } from 'react';
+import type { ChangeEvent, CSSProperties, DragEvent, MouseEvent, ReactNode } from 'react';
 import { dataAttr } from '../../internal/data-attr';
 import { markAsFieldControl, useFieldContext, useFieldProps } from '../../internal/field-context';
 import { CloseIcon, FileIcon, UploadIcon } from '../../internal/icons';
@@ -13,7 +13,7 @@ import { useFormReset } from '../../internal/use-form-reset';
 import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
 import { devWarn, isProduction } from '../../internal/warn';
 import { IconButton } from '../icon-button/IconButton';
-import { formatFileSize } from './accept';
+import { formatFileSize, matchesAccept } from './accept';
 
 /** A file that was turned down, and every reason why. */
 export interface FileRejection {
@@ -58,7 +58,7 @@ export interface FileUploadProps {
   maxSize?: number;
   /** The most files that can be held. */
   maxFiles?: number;
-  /** Decides about a file: a string turns it down with that sentence, `null` accepts it. */
+  /** Decides about a file: a sentence turns it down with that sentence; `null` or `""` accepts it. */
   validate?: (file: File) => string | null;
   /** Called once for every addition that had files turned down. */
   onReject?: (rejections: FileRejection[]) => void;
@@ -115,6 +115,13 @@ const keyOf = (file: File): string => {
   return key;
 };
 
+// A rejected row has no File of its own to key by: the same file can be turned down twice, or be
+// accepted after it was.
+let lastRejection = 0;
+interface RejectedRow extends FileRejection {
+  id: string;
+}
+
 const isFile = (item: unknown): item is File => typeof File !== 'undefined' && item instanceof File;
 
 const sameFile = (a: File, b: File) =>
@@ -145,6 +152,25 @@ function writeFiles(input: HTMLInputElement, files: File[]): void {
   input.files = transfer.files;
 }
 
+/**
+ * The files a drop carries. Folders are left out: a browser gives one as a File with nothing in it,
+ * and reading its tree is out of scope (spec §2). Call it while the `drop` event is being handled,
+ * since the browser empties the items afterwards.
+ */
+function droppedFiles(data: DataTransfer): File[] {
+  if (!data.items) return Array.from(data.files ?? []);
+  const dropped: File[] = [];
+  for (const item of Array.from(data.items)) {
+    if (item.kind !== 'file' || item.webkitGetAsEntry?.()?.isDirectory) continue;
+    const one = item.getAsFile();
+    if (one) dropped.push(one);
+  }
+  return dropped;
+}
+
+const carriesFiles = (event: DragEvent) =>
+  Array.from(event.dataTransfer?.types ?? []).includes('Files');
+
 /**
  * A zone with a native file input, and the list of the files held. The input is the control: it sits
  * over the word "browse", so its click, its keyboard, its `required` check and its place in a form are
@@ -174,7 +200,6 @@ export const FileUpload = markAsFieldControl(
       onReject,
       ...rest
     } = props;
-    void [maxSize, maxFiles, validate, onReject];
     const field = useFieldContext();
     const hintId = useId();
     const { invalid, required, disabled, ...inputProps } = useFieldProps({
@@ -211,6 +236,14 @@ export const FileUpload = markAsFieldControl(
       }
     }
 
+    // The files turned down stay in the list until the user removes them. They are no part of the
+    // value, so a controlled parent never sees them.
+    const [rejected, setRejected] = useState<RejectedRow[]>([]);
+    const [dragging, setDragging] = useState(false);
+    // A child of the zone sends its own `dragenter` and `dragleave`, so the drag is over the zone
+    // for as long as more entries than exits have been counted.
+    const depth = useRef(0);
+
     const inputRef = useRef<HTMLInputElement | null>(null);
     const mergedRef = useMemo(() => mergeRefs(ref, inputRef), [ref]);
     const listRef = useRef<HTMLUListElement>(null);
@@ -222,37 +255,108 @@ export const FileUpload = markAsFieldControl(
     // A removal moves focus once the rows are rendered: to the button that takes the removed one's
     // place, which is only known then. `from` tells this commit from one that left the files as they
     // were (a controlled parent that said no).
-    const focusAfter = useRef<{ from: File[]; index: number } | null>(null);
+    const focusAfter = useRef<{ from: File[]; fromRejected: RejectedRow[]; index: number } | null>(
+      null,
+    );
     useIsoLayoutEffect(() => {
       const input = inputRef.current;
       if (input) writeFiles(input, files);
       const pending = focusAfter.current;
       if (!pending) return;
       focusAfter.current = null;
-      if (pending.from === files) return;
+      if (pending.from === files && pending.fromRejected === rejected) return;
       const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('button');
-      (buttons?.[Math.min(pending.index, files.length - 1)] ?? input)?.focus();
+      (buttons?.[Math.min(pending.index, files.length + rejected.length - 1)] ?? input)?.focus();
     });
 
+    // The one way in for a pick and a drop: judges each file, then tells the value, the rows,
+    // `onReject` and the live region, once.
+    const addFiles = (candidates: File[]) => {
+      if (disabled || candidates.length === 0) return;
+      // A single-file input is replaced by the first file that passes; the others cannot be held.
+      const limit = multiple ? maxFiles : 1;
+      const added: File[] = [];
+      const rejections: FileRejection[] = [];
+      candidates.forEach((candidate, at) => {
+        const errors: FileRejection['errors'] = [];
+        if (!matchesAccept(candidate, accept)) errors.push({ code: 'type', message: words.type });
+        if (maxSize !== undefined && candidate.size > maxSize) {
+          errors.push({ code: 'size', message: words.size(formatFileSize(maxSize, locale)) });
+        }
+        // An empty string accepts, as `setCustomValidity('')` does: a row with no reason would say nothing.
+        const reason = validate?.(candidate);
+        if (reason) errors.push({ code: 'custom', message: reason });
+        const taken = (multiple ? files.length : 0) + added.length;
+        if (limit !== undefined && (taken >= limit || (!multiple && at > 0))) {
+          errors.push({ code: 'count', message: words.count(limit) });
+        }
+        if (errors.length === 0) added.push(candidate);
+        else rejections.push({ file: candidate, errors });
+      });
+      if (added.length > 0) setHeld(multiple ? [...files, ...added] : added);
+      if (rejections.length > 0) {
+        setRejected((rows) => [
+          ...rows,
+          ...rejections.map((rejection) => ({ ...rejection, id: `r${(lastRejection += 1)}` })),
+        ]);
+        onReject?.(rejections);
+      }
+      announce(
+        [
+          added.length > 0 ? words.added(added.length) : '',
+          rejections.length > 0 ? words.rejected(rejections.length) : '',
+        ]
+          .filter(Boolean)
+          .join('. '),
+      );
+    };
+
     const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
-      const picked = Array.from(event.currentTarget.files ?? []);
       // Some engines empty the input when the dialog is cancelled: the files held stay.
-      if (picked.length > 0) {
-        setHeld(multiple ? [...files, ...picked] : picked.slice(0, 1));
-        announce(words.added(picked.length));
-      }
+      addFiles(Array.from(event.currentTarget.files ?? []));
       commit();
     };
+    // The rows are the files held and then the files turned down; `index` counts across both.
     const removeAt = (index: number) => {
-      focusAfter.current = { from: files, index };
-      setHeld(files.filter((_, at) => at !== index));
+      focusAfter.current = { from: files, fromRejected: rejected, index };
+      if (index < files.length) setHeld(files.filter((_, at) => at !== index));
+      else setRejected(rejected.filter((_, at) => at !== index - files.length));
       commit();
     };
 
+    // Dragging is a convenience for the pointer. Only a drag that carries files counts: a dragged
+    // piece of text keeps the browser's own behaviour.
+    const zoneHandlers = {
+      onDragEnter: (event: DragEvent) => {
+        if (!carriesFiles(event)) return;
+        depth.current += 1;
+        setDragging(true);
+      },
+      onDragOver: (event: DragEvent) => {
+        if (!carriesFiles(event)) return;
+        event.preventDefault();
+        event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
+      },
+      onDragLeave: (event: DragEvent) => {
+        if (!carriesFiles(event)) return;
+        depth.current = Math.max(0, depth.current - 1);
+        if (depth.current === 0) setDragging(false);
+      },
+      onDrop: (event: DragEvent) => {
+        // Even on the input: the browser would otherwise put the dropped files into it itself.
+        event.preventDefault();
+        depth.current = 0;
+        setDragging(false);
+        addFiles(droppedFiles(event.dataTransfer));
+        commit();
+      },
+    };
+
     // The browser has emptied the input. The files of an uncontrolled FileUpload go back to the
     // default and a controlled one keeps its value; the commit writes them into the input.
     useFormReset(inputRef, () => {
       resetHeld(defaultValue ?? NO_FILES);
+      setRejected([]);
       commit();
     });
 
@@ -272,15 +376,20 @@ export const FileUpload = markAsFieldControl(
         style={style}
         data-disabled={dataAttr(disabled)}
         data-invalid={dataAttr(invalid)}
+        data-dragging={dataAttr(dragging && !disabled)}
       >
         {/* Only forwards a press to the input, which keyboard users reach directly. */}
         {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
-        <div className="flg-file-upload-zone" onClick={handleZoneClick}>
+        <div className="flg-file-upload-zone" onClick={handleZoneClick} {...zoneHandlers}>
           <span className="flg-file-upload-icon" aria-hidden="true">
             <UploadIcon width={24} height={24} />
           </span>
           <p className="flg-file-upload-prompt">
-            {words.prompt}
+            {dragging && !disabled ? (
+              <span className="flg-file-upload-drop-message">{words.dropHere}</span>
+            ) : (
+              words.prompt
+            )}
             <span className="flg-file-upload-browse">
               <span aria-hidden="true">{words.browse}</span>
               <input
@@ -310,7 +419,7 @@ export const FileUpload = markAsFieldControl(
             </p>
           ) : null}
         </div>
-        {files.length > 0 ? (
+        {files.length + rejected.length > 0 ? (
           <ul ref={listRef} className="flg-file-upload-list">
             {files.map((file, index) => (
               <li key={keyOf(file)} className="flg-file-upload-file">
@@ -335,6 +444,27 @@ export const FileUpload = markAsFieldControl(
                 </IconButton>
               </li>
             ))}
+            {rejected.map((row, at) => (
+              <li key={row.id} className="flg-file-upload-file" data-rejected="">
+                <span className="flg-file-upload-file-icon" aria-hidden="true">
+                  <FileIcon width={16} height={16} />
+                </span>
+                <span className="flg-file-upload-file-main">
+                  <span className="flg-file-upload-file-name">{row.file.name}</span>
+                  <span className="flg-file-upload-file-error">{row.errors[0]?.message}</span>
+                </span>
+                <IconButton
+                  type="button"
+                  variant="ghost"
+                  size="sm"
+                  aria-label={words.remove(row.file.name)}
+                  disabled={disabled}
+                  onClick={() => removeAt(files.length + at)}
+                >
+                  <CloseIcon width={14} height={14} aria-hidden="true" />
+                </IconButton>
+              </li>
+            ))}
           </ul>
         ) : null}
         {region}
diff --git a/src/styles/components/file-upload.css b/src/styles/components/file-upload.css
index 8493a96..0bd472a 100644
--- a/src/styles/components/file-upload.css
+++ b/src/styles/components/file-upload.css
@@ -132,4 +132,40 @@
     font-size: var(--flg-text-xs);
     color: var(--flg-text-muted);
   }
+  /* Files are over the zone (spec §4.3): the accent edge and wash, and the drop message for the
+     prompt. The browse word stays in the page, one pixel wide, so the input keeps its focus. */
+  .flg-file-upload[data-dragging] > .flg-file-upload-zone {
+    border-color: var(--flg-accent-solid);
+    background: var(--flg-accent-subtle);
+  }
+  .flg-file-upload[data-dragging] .flg-file-upload-icon {
+    color: var(--flg-accent-text);
+  }
+  .flg-file-upload-drop-message {
+    font-size: var(--flg-text-sm);
+    font-weight: var(--flg-weight-semibold);
+    color: var(--flg-accent-text);
+  }
+  .flg-file-upload[data-dragging] .flg-file-upload-browse {
+    position: absolute;
+    width: 1px;
+    height: 1px;
+    overflow: hidden;
+    clip-path: inset(50%);
+    white-space: nowrap;
+  }
+  /* A file that was turned down: the edge, the name and the icon in the danger colour, and the
+     reason where the size would be. */
+  .flg-file-upload-file[data-rejected] {
+    border-color: var(--flg-danger);
+  }
+  .flg-file-upload-file[data-rejected] .flg-file-upload-file-name,
+  .flg-file-upload-file[data-rejected] .flg-file-upload-file-icon {
+    color: var(--flg-danger);
+  }
+  .flg-file-upload-file-error {
+    font-size: var(--flg-text-xs);
+    font-weight: var(--flg-weight-medium);
+    color: var(--flg-danger);
+  }
 }
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 984b673..1a5dafb 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -391,6 +391,13 @@
     .flg-file-upload-zone {
       border-color: CanvasText;
     }
+    .flg-file-upload[data-dragging] > .flg-file-upload-zone {
+      border-color: Highlight;
+    }
+    /* A rejected row keeps the edge of every row; its reason is written, so it needs no colour. */
+    .flg-file-upload-file[data-rejected] {
+      border-color: CanvasText;
+    }
     /* The status bar of a toast (spec §4.5); the named icon still tells the status. */
     .flg-toast::before {
       background: CanvasText;
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/file-upload src/index.test.ts
pnpm vitest run --project storybook-light --project storybook-dark src/components/file-upload
pnpm build && pnpm check:package
```

Expected:
- Unit: 208 test PASS, không lỗi kiểu (`FileUpload.test.tsx` 92 ở mỗi project React, `FileUpload.test-d.ts` 3, `accept.test.ts` 20, `index.test.ts` 1).
- Story FileUpload: 48 test PASS (8 story × ba engine × hai theme). `DropFiles` pass ở cả ba engine (phát hiện 8). Play function của `Look` thấy hai dòng bị từ chối với lời báo và màu danger, và vùng thứ sáu đang kéo với `labels.dropHere` đậm và viền đổi màu.
- `check:package` PASS; `check:dist-css` có thêm hai class. Theo lần chạy nháp: JS 43.37 kB, CSS 8.48 kB, trong ngưỡng cũ.
- Chỉ CSS của FileUpload và hai selector `.flg-file-upload*` trong forced colors đổi, nên ảnh chuẩn của component cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  scripts/check-dist-css.ts \
  src/components/file-upload/FileUpload.mdx \
  src/components/file-upload/FileUpload.stories.tsx \
  src/components/file-upload/FileUpload.test.tsx \
  src/components/file-upload/FileUpload.tsx \
  src/styles/components/file-upload.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(file-upload): file checks, rejected rows, onReject and drag and drop" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 4: Cặp tương phản của FileUpload, màu khi kéo, ngưỡng kích thước

Spec §4.2, §4.4 (bốn cặp của FileUpload; dòng 1, 7, 8 và 14 mở rộng; quy tắc `prefers-contrast: more` của vùng thả), §4.9 của spec 0+1, §7 dòng 4 và **Gói phát hành**, §9.
- **Tương phản.** `check:contrast` đo thêm bốn cặp, trên kính thường và trên panel có scrim, giữ số thấp hơn:
  - `dropzone-border` (3): viền `--flg-dropzone-border` so với bề mặt, qua `paintOnSurface`, vì màu này bán trong suốt.
  - `dropzone-link` (4.5): chữ "browse" `--flg-accent-text` trên `--flg-control-bg-secondary` của vùng thả.
  - `file-meta-text` (4.5): cỡ tệp `--flg-text-muted` trên `--flg-control-bg` của dòng.
  - `file-error-text` (4.5): lời báo `--flg-danger` trên `--flg-control-bg` của dòng.
- Ba cặp dưới ngưỡng ở chế độ mặc định, đúng như F1 vẽ, thành dòng 19, 20 và 21 của §4.9 (phát hiện 9). Chúng chờ chủ dự án duyệt (phát hiện 10). Spec §4.4 có đoạn **Đã đo ở Plan D** (phát hiện 3).
- **Contrast-more.** Nền vùng thả khi kéo dùng `--flg-selected-bg`; icon và lời nhắc dùng `--flg-selected-text`. Giao diện mặc định không đổi, và `preferences.css` không thêm quy tắc nào (phát hiện 9).
- **Ngưỡng kích thước** ghi bằng `pnpm size:record` (không chép `.size-limit.json`).

**Files:**
- Modify: `src/docs/ExceptionTable.test.tsx`, `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `src/styles/components/file-upload.css`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`, `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md`, `.size-limit.json` (do `size:record` ghi)

**Interfaces:**
- Produces:
  - Bốn check mới trong `CHECKS` của `scripts/lib/contrast.ts`: `'dropzone-border': 3`, `'dropzone-link': 4.5`, `'file-meta-text': 4.5`, `'file-error-text': 4.5`.
  - `KNOWN_EXCEPTIONS` có thêm dòng 19 (`dropzone-border`, sáng `recorded: 1.89`, tối `1.99`, tiêu chí `1.4.11`), dòng 20 (`dropzone-link`, tối `3.79`, `1.4.3`) và dòng 21 (`file-meta-text`, tối `3.71`, `1.4.3`).
  - Bảng §4.9 của spec 0+1 có 21 dòng; `ExceptionTable` render 21 dòng, nên trang Accessibility có ngay ba dòng mới (Task 7).
  - Vùng thả khi kéo: nền `--flg-selected-bg`, icon và lời nhắc `--flg-selected-text`.
  - Ngưỡng mới JS 47580 B, CSS 9311 B.
- Consumes: mọi thứ ở Task 2 và 3; `paintOnSurface`, `composite`, `color` và `contrastRatio` của `scripts/lib/contrast.ts`.

- [ ] **Step 1: Viết test**

`ExceptionTable` render bảng §4.9 từ `KNOWN_EXCEPTIONS`. Test đòi 21 dòng, số đo của dòng 19, 20, 21 và tiêu chí của chúng.

```diff
diff --git a/src/docs/ExceptionTable.test.tsx b/src/docs/ExceptionTable.test.tsx
index d8e1f67..278a7fc 100644
--- a/src/docs/ExceptionTable.test.tsx
+++ b/src/docs/ExceptionTable.test.tsx
@@ -14,9 +14,9 @@ describe('ExceptionTable', () => {
       .getAllByRole('cell')
       .map((cell) => cell.textContent);
 
-  it('lists the eighteen rows of spec §4.9 with light and dark measurements', () => {
+  it('lists the twenty-one rows of spec §4.9 with light and dark measurements', () => {
     const rows = bodyRows();
-    expect(rows).toHaveLength(18);
+    expect(rows).toHaveLength(21);
     expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
       '1',
       '2',
@@ -36,6 +36,9 @@ describe('ExceptionTable', () => {
       '16',
       '17',
       '18',
+      '19',
+      '20',
+      '21',
     ]);
     expect(rows[3]).toHaveTextContent('meets AA (4.74:1)');
     expect(rows[3]).toHaveTextContent('3.63:1 / 2.24:1');
@@ -56,6 +59,10 @@ describe('ExceptionTable', () => {
     expect(cells(rows[16]!).slice(1, 3)).toEqual(['1.29:1', '2.24:1']);
     // The days of the months around in a Calendar (spec phase 3 §4.4).
     expect(cells(rows[17]!).slice(1, 3)).toEqual(['2.04:1', '2.14:1']);
+    // The zone edge, the browse word and the file size of a FileUpload (spec phase 3 §4.4).
+    expect(cells(rows[18]!).slice(1, 3)).toEqual(['1.89:1', '1.99:1']);
+    expect(cells(rows[19]!).slice(1, 3)).toEqual(['meets AA (5.42:1)', '3.79:1']);
+    expect(cells(rows[20]!).slice(1, 3)).toEqual(['meets AA (7.44:1)', '3.71:1']);
   });
 
   it('shows the live measurement for a theme with no exception in a row', () => {
@@ -86,6 +93,9 @@ describe('ExceptionTable', () => {
       '1.4.11',
       '1.4.11',
       '1.4.3',
+      '1.4.11',
+      '1.4.3',
+      '1.4.3',
     ]);
     expect(cells(rows[3]!).at(-2)).toBe('4.5:1 text, 3:1 check marks');
     expect(cells(rows[0]!).at(-2)).toBe('3:1');
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit src/docs/ExceptionTable.test.tsx
```

Expected: FAIL 2 trong 4 test. Hai lỗi này được suy ra từ patch khi lập plan; báo cáo nháp không ghi chúng (phát hiện 15):
- `lists the twenty-one rows of spec §4.9 with light and dark measurements`: mong 21 dòng, có 18;
- `names the WCAG criterion and minimum of every row`: danh sách tiêu chí có 18 phần tử, test mong 21.

Rồi lưu khối patch ở Step 3 vào `../task-4-code.patch` (giữ LF). Áp riêng phần `scripts/lib/contrast.ts` (bốn check mới), và chạy kiểm tra tương phản. Đây là bước fail-first của bản nháp:

```bash
git apply --include=scripts/lib/contrast.ts ../task-4-code.patch
pnpm check:contrast
```

Expected: FAIL (exit 1) với `4 contrast problem(s):`, cả bốn ở chế độ `default`, đúng các số bản nháp ghi:
- `light/default dropzone-border = 1.89 is below 3:1. …`
- `dark/default dropzone-border = 1.99 is below 3:1. …`
- `dark/default dropzone-link = 3.79 is below 4.5:1. …`
- `dark/default file-meta-text = 3.71 is below 4.5:1. …`

Ở `contrast-more` cả bốn check đều `pass`.

- [ ] **Step 3: Viết code**

Phần `scripts/lib/contrast.ts` của khối dưới đây đã được áp ở Step 2. Áp phần còn lại:

```bash
git apply --exclude=scripts/lib/contrast.ts ../task-4-code.patch
```

```diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index 1701cb1..defdfd1 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -330,10 +330,13 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 16 | Rãnh của Slider (`--flg-control-track`) so với nền | 1.23:1 | 1.30:1 | 3:1 | 1.4.11 |
 | 17 | Núm của Slider (`--flg-control-thumb`) so với rãnh và với phần đã chọn | 1.29:1 | 2.24:1 | 3:1 | 1.4.11 |
 | 18 | Số của ngày thuộc tháng khác trong Calendar (`--flg-text-muted`, `opacity: .5`) trên bề mặt | 2.04:1 | 2.14:1 | 4.5:1 | 1.4.3 |
+| 19 | Viền đứt nét của vùng thả FileUpload (`--flg-dropzone-border`, 45% `--flg-text-muted`) so với nền | 1.89:1 | 1.99:1 | 3:1 | 1.4.11 |
+| 20 | Chữ `--flg-accent-text` của nút chọn tệp trên nền vùng thả `--flg-control-bg-secondary` | đạt (5.42:1) | 3.79:1 | 4.5:1 | 1.4.3 |
+| 21 | Cỡ tệp (`--flg-text-muted`) trên nền dòng tệp `--flg-control-bg` của FileUpload | đạt (7.44:1) | 3.71:1 | 4.5:1 | 1.4.3 |
 
-Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Điểm 14 là icon `info` của toast theo mockup toast S2 (giai đoạn 2, Plan E1). Điểm 6 còn là chữ mờ của option Combobox đang lọc và dòng trạng thái (giai đoạn 3, Plan B) và chữ hàng thứ của Calendar (giai đoạn 3, Plan C): cùng cặp màu, nên cùng số đo. Điểm 18 là ngày của tháng khác theo mockup K1 (giai đoạn 3, Plan C), nửa độ mờ nên thấp hơn hẳn chữ mờ thường. Điểm 15–17 là chấm vạch, rãnh và núm của Slider theo mockup S3 (giai đoạn 3, Plan A). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
+Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Điểm 14 là icon `info` của toast theo mockup toast S2 (giai đoạn 2, Plan E1). Điểm 6 còn là chữ mờ của option Combobox đang lọc và dòng trạng thái (giai đoạn 3, Plan B) và chữ hàng thứ của Calendar (giai đoạn 3, Plan C): cùng cặp màu, nên cùng số đo. Điểm 18 là ngày của tháng khác theo mockup K1 (giai đoạn 3, Plan C), nửa độ mờ nên thấp hơn hẳn chữ mờ thường. Điểm 19–21 là viền vùng thả, nút chọn tệp và cỡ tệp của FileUpload theo mockup F1 (giai đoạn 3, Plan D). Điểm 15–17 là chấm vạch, rãnh và núm của Slider theo mockup S3 (giai đoạn 3, Plan A). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
 
-Cả mười tám điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
+Cả hai mươi mốt điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
 
 ---
 
diff --git a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
index 9af1f8d..b5a7c41 100644
--- a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
+++ b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
@@ -424,6 +424,8 @@ Mọi số liệu ở §4.3 lấy từ CSS `mk-` của đúng phương án đã
 - Ngày không chọn được và mọi phần disabled: đó là thành phần giao diện không hoạt động, nằm ngoài tiêu chí 1.4.3 và 1.4.11.
 - Nền khi hover (ngày của Calendar, nút −/+): hover không phải cách duy nhất để thấy control.
 
+**Đã đo ở Plan D (phát hiện khi lập Plan D):** bốn cặp của FileUpload, ở mặc định, `dropzone-border` 1.89:1 sáng và 1.99:1 tối (dưới 3:1), `dropzone-link` tối 3.79:1 (dưới 4.5:1), `file-meta-text` tối 3.71:1 (dưới 4.5:1); `file-error-text` đạt (7.93:1 và 5.65:1). Ba cặp dưới ngưỡng đúng như mockup F1, nên thành các dòng 19, 20, 21 của §4.9; cả bốn đạt ở `prefers-contrast: more`.
+
 **Cách xử lý kết quả:** như spec giai đoạn 2 §4.4. Cặp nào dưới ngưỡng mà đúng như mockup thì thành một dòng mới của §4.9, kèm số đo làm tròn xuống, và được nêu trong mô tả PR.
 
 **`prefers-contrast: more`:** mọi cặp mới phải đạt (lớp 4 (b) ở §7, không có ngoại lệ). Ngoài phần token đã có của chế độ này, các quy tắc sau đều ngoài mockup và chỉ có hiệu lực khi người dùng bật tuỳ chọn:
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 69ef1bc..977978d 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -90,6 +90,15 @@ const D = {
     description: 'A day of the month before or after in a Calendar, muted text at half opacity',
     criterion: '1.4.3',
   },
+  19: { description: 'Dashed edge of a FileUpload zone against the surface', criterion: '1.4.11' },
+  20: {
+    description: 'The browse word of a FileUpload zone, accent text on the zone background',
+    criterion: '1.4.3',
+  },
+  21: {
+    description: 'The size of a file in a FileUpload list, muted text on the row background',
+    criterion: '1.4.3',
+  },
 } as const satisfies Record<number, ExceptionRowInfo>;
 
 /** Spec §4.9. The default theme keeps the approved mockup values, so these gaps are accepted. */
@@ -132,4 +141,8 @@ export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
   { row: 17, theme: 'dark', check: 'slider-thumb', recorded: 2.24, ...D[17] },
   { row: 18, theme: 'light', check: 'calendar-outside-day', recorded: 2.04, ...D[18] },
   { row: 18, theme: 'dark', check: 'calendar-outside-day', recorded: 2.14, ...D[18] },
+  { row: 19, theme: 'light', check: 'dropzone-border', recorded: 1.89, ...D[19] },
+  { row: 19, theme: 'dark', check: 'dropzone-border', recorded: 1.99, ...D[19] },
+  { row: 20, theme: 'dark', check: 'dropzone-link', recorded: 3.79, ...D[20] },
+  { row: 21, theme: 'dark', check: 'file-meta-text', recorded: 3.71, ...D[21] },
 ];
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index a6376a1..29dc534 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -51,6 +51,10 @@ export const CHECKS = {
   'calendar-weekday-text': 4.5,
   'calendar-outside-day': 4.5,
   'date-picker-icon': 3,
+  'dropzone-border': 3,
+  'dropzone-link': 4.5,
+  'file-meta-text': 4.5,
+  'file-error-text': 4.5,
 } as const;
 export type CheckId = keyof typeof CHECKS;
 const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
@@ -375,6 +379,17 @@ export function measure(
       ),
       // The calendar icon of a DatePicker, muted text on the background of the frame.
       'date-picker-icon': contrastRatio(composite(color('text-muted'), control), control),
+      // The dashed edge of a FileUpload zone: its colour is semi-transparent in the default theme.
+      'dropzone-border': paintOnSurface('dropzone-border'),
+      // The browse word, in the accent text colour on the zone's background.
+      'dropzone-link': contrastRatio(
+        composite(color('accent-text'), composite(color('control-bg-secondary'), surface)),
+        composite(color('control-bg-secondary'), surface),
+      ),
+      // The size of a file, muted text on the background of its row.
+      'file-meta-text': contrastRatio(composite(color('text-muted'), control), control),
+      // The reason a file was turned down, the danger colour on the background of its row.
+      'file-error-text': contrastRatio(composite(color('danger'), control), control),
     };
     for (const id of SURFACE_CHECK_IDS) lowest[id] = Math.min(lowest[id], measured[id]);
   }
diff --git a/src/styles/components/file-upload.css b/src/styles/components/file-upload.css
index 0bd472a..4438bf9 100644
--- a/src/styles/components/file-upload.css
+++ b/src/styles/components/file-upload.css
@@ -133,18 +133,20 @@
     color: var(--flg-text-muted);
   }
   /* Files are over the zone (spec §4.3): the accent edge and wash, and the drop message for the
-     prompt. The browse word stays in the page, one pixel wide, so the input keeps its focus. */
+     prompt. The wash and the text are the selected-* tokens, which equal the accent wash and the
+     accent text here and which prefers-contrast: more swaps, as it does for a selected pill tab.
+     The browse word stays in the page, visually hidden, so the input keeps its focus. */
   .flg-file-upload[data-dragging] > .flg-file-upload-zone {
     border-color: var(--flg-accent-solid);
-    background: var(--flg-accent-subtle);
+    background: var(--flg-selected-bg);
   }
   .flg-file-upload[data-dragging] .flg-file-upload-icon {
-    color: var(--flg-accent-text);
+    color: var(--flg-selected-text);
   }
   .flg-file-upload-drop-message {
     font-size: var(--flg-text-sm);
     font-weight: var(--flg-weight-semibold);
-    color: var(--flg-accent-text);
+    color: var(--flg-selected-text);
   }
   .flg-file-upload[data-dragging] .flg-file-upload-browse {
     position: absolute;
```

Ghi ngưỡng kích thước. Plan không chép `.size-limit.json`: `size:record` tự ghi file đó:

```bash
pnpm gen:theme
pnpm build
pnpm size:record
```

Expected: ngưỡng mới gần JS 47580 B, CSS 9311 B (trước: 45038 B, 8880 B), là kết quả ở bản nháp (đo được JS 43.25 kB, CSS 8.46 kB; ngưỡng là số đo cộng 10%). Nếu số khác một chút, giữ số do `size:record` ghi và nêu trong báo cáo.

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm check:contrast
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/file-upload
pnpm build && pnpm check:package
```

Expected:
- `pnpm check:contrast`: PASS (`Contrast check passed.`). Bảng in ra có `dropzone-border` sáng và tối, `dropzone-link` tối và `file-meta-text` tối là `known-exception`, với số ở phát hiện 9; các dòng còn lại của bốn check là `pass`.
- `pnpm test:unit`: PASS, 3 skip. Bản nháp ghi 2740 test PASS ở `unit` và `unit-react18` (146 file); `ExceptionTable.test.tsx` 4 PASS; project `scripts` (gồm `scripts/lib/contrast.test.ts`) PASS.
- Story FileUpload: 48 test PASS.
- `check:package`: PASS với ngưỡng mới.
- Giao diện mặc định không đổi: ở chế độ mặc định `--flg-selected-bg` và `--flg-selected-text` là `var(--flg-accent-subtle)` và `var(--flg-accent-text)` (trong `theme.css` do `gen:theme` sinh), nên ảnh của FileUpload và của component cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  .size-limit.json \
  docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md \
  docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md \
  scripts/contrast-exceptions.ts \
  scripts/lib/contrast.ts \
  src/docs/ExceptionTable.test.tsx \
  src/styles/components/file-upload.css
```
```bash
git commit -m "feat(file-upload): measure the FileUpload contrast pairs, selected-* for the drag state, size limits" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 5: `form` tới phần tử gửi của NumberInput, Slider, SegmentedControl, Combobox và Select

Quyết định của chủ dự án ngày 2026-11-05, từ comment 4 của review PR #14. Spec §3.1 (đoạn đầu: mọi control chạy được trong `<form>`; câu mới về `form`). Làm theo cách DatePicker đã sửa ở PR #14: `form` tới mọi phần tử gửi, và test render control ngoài `<form id>`.
- **NumberInput:** `form` thêm vào input ẩn mang số; ô hiển thị đã nhận nó qua các prop còn lại.
- **Slider:** prop `form` mới, tới mọi input ẩn. Gốc là `<div>`, vốn không có `form`.
- **SegmentedControl:** prop `form` mới, tới mọi radio qua context; `form` riêng của một item thắng.
- **Combobox:** prop `form` mới, tới `<select>` ẩn và ô nhập, để Enter gửi đúng form đó.
- **Select:** prop `form` mới, tới `<select>` gốc ẩn.
- **Reset form:** `useFormReset` nhận đối số thứ ba `form?: string`, dùng cho Slider và SegmentedControl (phát hiện 11).
- JSDoc của `form` ở mỗi component nói nó tới đâu, như của DatePicker; trang MDX của mỗi component có một câu ở phần form. Spec §3.1 có câu mới (phát hiện 3).
- Không CSS hay markup nào khác đổi; khi không truyền `form`, DOM như cũ (phát hiện 16).

**Files:**
- Modify: `src/internal/use-form-reset.ts`, `src/internal/use-form-reset.test.tsx`, `src/components/number-input/NumberInput.tsx`, `NumberInput.test.tsx`, `NumberInput.mdx`, `src/components/slider/Slider.tsx`, `Slider.test.tsx`, `Slider.mdx`, `src/components/segmented-control/SegmentedControl.tsx`, `SegmentedControlContext.ts`, `SegmentedControlItem.tsx`, `SegmentedControl.test.tsx`, `SegmentedControl.mdx`, `src/components/combobox/Combobox.tsx`, `Combobox.test.tsx`, `Combobox.mdx`, `src/components/select/Select.tsx`, `Select.test.tsx`, `Select.mdx`, `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md`

**Interfaces:**
- Produces:
  - `useFormReset(elementRef, onReset, form?: string)` trong `src/internal/use-form-reset.ts`. Có `form` thì hook nghe `reset` của `document.getElementById(form)` khi phần tử đó là `<form>`, nếu không thì không nghe form nào; effect đăng ký lại khi `form` đổi. Không có `form` thì như cũ.
  - `form?: string` trong `NumberInputProps`, `SliderProps`, `SegmentedControlProps`, `ComboboxProps` và props của `Select`, mỗi cái có JSDoc.
  - `SegmentedControlContextValue` có thêm `form: string | undefined`.
  - Nơi `form` tới: NumberInput, ô hiển thị và input ẩn; Slider, mọi input ẩn; SegmentedControl, mọi radio; Combobox, ô nhập và `<select>` ẩn; Select, `<select>` ẩn.
- Consumes: `useFormReset` (Plan A); NumberInput, Slider, SegmentedControl (Plan A), Combobox (Plan B), Select (giai đoạn 2).

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/combobox/Combobox.test.tsx b/src/components/combobox/Combobox.test.tsx
index fd2ddd6..a5f8811 100644
--- a/src/components/combobox/Combobox.test.tsx
+++ b/src/components/combobox/Combobox.test.tsx
@@ -1081,6 +1081,45 @@ describe('Combobox', () => {
     }
     const dataOf = (form: HTMLFormElement) => new FormData(form).get('city');
 
+    it('sends form to the hidden select and the input, so a combobox outside its form submits there', async () => {
+      const { container } = render(
+        <>
+          <form id="f" />
+          <Combobox aria-label="City" name="city" form="f" defaultValue="hn">
+            {cities}
+          </Combobox>
+        </>,
+      );
+      const form = container.querySelector('form')!;
+      expect(input().form).toBe(form);
+      expect(container.querySelector('select')!.form).toBe(form);
+      expect(dataOf(form)).toBe('hn');
+      act(() => input().focus());
+      key('ArrowDown');
+      key('ArrowDown');
+      key('Enter');
+      expect(dataOf(form)).toBe('dn');
+      form.reset();
+      await aTaskLater();
+      expect(input()).toHaveValue('Hà Nội');
+      expect(dataOf(form)).toBe('hn');
+    });
+
+    it('lets Enter in the input submit the form it names, from outside that form', () => {
+      const { container } = render(
+        <>
+          <form id="f" />
+          <Combobox aria-label="City" name="city" form="f">
+            {cities}
+          </Combobox>
+        </>,
+      );
+      // The browser submits `input.form` on an Enter nothing prevented; jsdom has no implicit submit.
+      expect(input().form).toBe(container.querySelector('form'));
+      act(() => input().focus());
+      expect(key('Enter')).toBe(true);
+    });
+
     it('submits the value through the hidden select, and the empty string when nothing is chosen', () => {
       const { container } = render(<FormOf defaultValue="dn" />);
       const form = container.querySelector('form')!;
diff --git a/src/components/number-input/NumberInput.test.tsx b/src/components/number-input/NumberInput.test.tsx
index 4c37cb9..d24b97a 100644
--- a/src/components/number-input/NumberInput.test.tsx
+++ b/src/components/number-input/NumberInput.test.tsx
@@ -696,6 +696,29 @@ describe('NumberInput', () => {
   });
 
   describe('forms', () => {
+    it('sends form to the hidden input too, so a field outside its form still submits there', async () => {
+      const user = userEvent.setup();
+      const { container } = render(
+        <>
+          <form id="f" />
+          <Quantity name="qty" form="f" defaultValue={7} />
+        </>,
+      );
+      const form = container.querySelector('form') as HTMLFormElement;
+      const hidden = container.querySelector<HTMLInputElement>('input[type="hidden"]')!;
+      expect(spin()).toHaveProperty('form', form);
+      expect(hidden.form).toBe(form);
+      expect(new FormData(form).get('qty')).toBe('7');
+      await user.clear(spin());
+      await user.type(spin(), '9');
+      await user.tab();
+      expect(new FormData(form).get('qty')).toBe('9');
+      act(() => form.reset());
+      await settle();
+      expect(spin()).toHaveValue('7');
+      expect(new FormData(form).get('qty')).toBe('7');
+    });
+
     it('submits the raw number in the hidden input, and an empty string for null', async () => {
       const user = userEvent.setup();
       const { container } = render(
diff --git a/src/components/segmented-control/SegmentedControl.test.tsx b/src/components/segmented-control/SegmentedControl.test.tsx
index e2e8d82..d89c731 100644
--- a/src/components/segmented-control/SegmentedControl.test.tsx
+++ b/src/components/segmented-control/SegmentedControl.test.tsx
@@ -201,6 +201,24 @@ describe('SegmentedControl', () => {
     expect(new FormData(form).get('view')).toBe('table');
   });
 
+  it('sends form to every radio, so a group outside its form submits there and follows its reset', async () => {
+    const user = userEvent.setup();
+    const { container } = render(
+      <>
+        <form id="f" />
+        <Views name="view" form="f" defaultValue="grid" />
+      </>,
+    );
+    const form = container.querySelector('form') as HTMLFormElement;
+    screen.getAllByRole('radio').forEach((item) => expect(item).toHaveProperty('form', form));
+    expect(new FormData(form).get('view')).toBe('grid');
+    await user.click(radio('Table'));
+    expect(new FormData(form).get('view')).toBe('table');
+    act(() => form.reset());
+    await waitFor(() => expect(radio('Grid')).toBeChecked());
+    expect(new FormData(form).get('view')).toBe('grid');
+  });
+
   it('puts an uncontrolled group back to its default after a form reset', async () => {
     const user = userEvent.setup();
     const { container } = render(
diff --git a/src/components/select/Select.test.tsx b/src/components/select/Select.test.tsx
index fa51fbd..f6bf328 100644
--- a/src/components/select/Select.test.tsx
+++ b/src/components/select/Select.test.tsx
@@ -467,6 +467,28 @@ describe('Select', () => {
     expect(warn).not.toHaveBeenCalled();
   });
 
+  it('sends form to the native select, so a Select outside its form submits there and follows its reset', async () => {
+    const { container } = render(
+      <>
+        <form id="f" />
+        <Select aria-label="Sort" name="sort" form="f" defaultValue="a">
+          <SelectItem value="a">A</SelectItem>
+          <SelectItem value="b">B</SelectItem>
+        </Select>
+      </>,
+    );
+    const form = container.querySelector('form')!;
+    const trigger = screen.getByRole('combobox');
+    expect(container.querySelector('select')!.form).toBe(form);
+    expect(new FormData(form).get('sort')).toBe('a');
+    fireEvent.keyDown(trigger, { key: 'b' });
+    expect(new FormData(form).get('sort')).toBe('b');
+    form.reset();
+    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
+    expect(trigger.textContent).toBe('A');
+    expect(new FormData(form).get('sort')).toBe('a');
+  });
+
   it('keeps its value when the form reset is cancelled, and resets a task later otherwise', async () => {
     let allowReset = false;
     render(
diff --git a/src/components/slider/Slider.test.tsx b/src/components/slider/Slider.test.tsx
index 0175e56..47b690e 100644
--- a/src/components/slider/Slider.test.tsx
+++ b/src/components/slider/Slider.test.tsx
@@ -713,6 +713,27 @@ describe('Slider', () => {
   });
 
   describe('form', () => {
+    it('sends form to every hidden input, so a slider outside its form submits there and follows its reset', async () => {
+      const { container } = render(
+        <>
+          <form id="f" />
+          <Slider aria-label="Price" name="price" form="f" defaultValue={[20, 75]} />
+        </>,
+      );
+      const form = container.querySelector('form') as HTMLFormElement;
+      const hidden = container.querySelectorAll<HTMLInputElement>('input[type="hidden"]');
+      expect(hidden).toHaveLength(2);
+      hidden.forEach((input) => expect(input.form).toBe(form));
+      expect(new FormData(form).getAll('price')).toEqual(['20', '75']);
+      screen.getAllByRole('slider')[0]!.focus();
+      await userEvent.setup().keyboard('{ArrowRight}');
+      expect(new FormData(form).getAll('price')).toEqual(['21', '75']);
+      act(() => form.reset());
+      await settle();
+      expect(screen.getAllByRole('slider')[0]).toHaveAttribute('aria-valuenow', '20');
+      expect(new FormData(form).getAll('price')).toEqual(['20', '75']);
+    });
+
     it('submits the value under the name', () => {
       render(
         <form data-testid="form">
diff --git a/src/internal/use-form-reset.test.tsx b/src/internal/use-form-reset.test.tsx
index f0fda11..bb43370 100644
--- a/src/internal/use-form-reset.test.tsx
+++ b/src/internal/use-form-reset.test.tsx
@@ -100,6 +100,100 @@ describe('useFormReset', () => {
     expect(onReset).toHaveBeenCalledTimes(1);
   });
 
+  describe('with the id of a form', () => {
+    function Named({ id, onReset }: { id?: string; onReset: () => void }) {
+      const ref = useRef<HTMLDivElement>(null);
+      useFormReset(ref, onReset, id);
+      return <div ref={ref} />;
+    }
+
+    it('listens to a form outside the tree of the element, a div that has no form of its own', async () => {
+      const onReset = vi.fn();
+      const { getByTestId } = render(
+        <>
+          <form id="f" data-testid="form" />
+          <Named id="f" onReset={onReset} />
+        </>,
+      );
+      (getByTestId('form') as HTMLFormElement).reset();
+      await aTask();
+      expect(onReset).toHaveBeenCalledTimes(1);
+    });
+
+    it('prefers the id to the form that holds the element', async () => {
+      function Inside({ onReset }: { onReset: () => void }) {
+        const ref = useRef<HTMLDivElement>(null);
+        useFormReset(ref, onReset, 'other');
+        return (
+          <form data-testid="around">
+            <div ref={ref} />
+          </form>
+        );
+      }
+      const onReset = vi.fn();
+      const { getByTestId } = render(
+        <>
+          <form id="other" data-testid="other" />
+          <Inside onReset={onReset} />
+        </>,
+      );
+      (getByTestId('around') as HTMLFormElement).reset();
+      await aTask();
+      expect(onReset).not.toHaveBeenCalled();
+      (getByTestId('other') as HTMLFormElement).reset();
+      await aTask();
+      expect(onReset).toHaveBeenCalledTimes(1);
+    });
+
+    it('listens to no form when the id names none, or names an element that is not a form', async () => {
+      const onReset = vi.fn();
+      const { getByTestId, rerender } = render(
+        <form data-testid="around">
+          <Named id="missing" onReset={onReset} />
+        </form>,
+      );
+      (getByTestId('around') as HTMLFormElement).reset();
+      await aTask();
+      rerender(
+        <form data-testid="around">
+          <div id="notaform" />
+          <Named id="notaform" onReset={onReset} />
+        </form>,
+      );
+      (getByTestId('around') as HTMLFormElement).reset();
+      await aTask();
+      expect(onReset).not.toHaveBeenCalled();
+    });
+
+    it('moves to the new form when the id changes, and leaves the old one', async () => {
+      const onReset = vi.fn();
+      const forms = (
+        <>
+          <form id="a" data-testid="a" />
+          <form id="b" data-testid="b" />
+        </>
+      );
+      const { getByTestId, rerender } = render(
+        <>
+          {forms}
+          <Named id="a" onReset={onReset} />
+        </>,
+      );
+      rerender(
+        <>
+          {forms}
+          <Named id="b" onReset={onReset} />
+        </>,
+      );
+      (getByTestId('a') as HTMLFormElement).reset();
+      await aTask();
+      expect(onReset).not.toHaveBeenCalled();
+      (getByTestId('b') as HTMLFormElement).reset();
+      await aTask();
+      expect(onReset).toHaveBeenCalledTimes(1);
+    });
+  });
+
   it('does nothing for an element outside a form', async () => {
     function Alone({ onReset }: { onReset: () => void }) {
       const ref = useRef<HTMLInputElement>(null);
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/internal/use-form-reset.test.tsx src/components/number-input/NumberInput.test.tsx src/components/slider/Slider.test.tsx src/components/segmented-control/SegmentedControl.test.tsx src/components/combobox/Combobox.test.tsx src/components/select/Select.test.tsx
pnpm typecheck
```

Expected: FAIL. Ở mỗi project React, cả 10 test mới fail, mỗi lỗi một dòng như bản nháp ghi:
- `useFormReset > with the id of a form`, 4 test: `expected vi.fn() to be called 1 times, but got 0`, hoặc `expected vi.fn() to not be called` khi hook nghe nhầm form bao ngoài;
- NumberInput `sends form to the hidden input too, so a field outside its form still submits there`: `expected null to be <form id="f">` (`.form` của input ẩn);
- Slider `sends form to every hidden input, so a slider outside its form submits there and follows its reset`: `expected null to be <form id="f">`;
- SegmentedControl `sends form to every radio, so a group outside its form submits there and follows its reset`: `expected <input> to have property "form" with value <form id=f>`;
- Combobox `sends form to the hidden select and the input, so a combobox outside its form submits there` và `lets Enter in the input submit the form it names, from outside that form`: `expected null to be <form id="f">`;
- Select `sends form to the native select, so a Select outside its form submits there and follows its reset`: `expected null to be <form id="f">`.

`pnpm typecheck` báo lỗi trong test của Slider, SegmentedControl, Combobox và Select: `form` chưa có trong props của chúng. NumberInput đã nhận `form` qua `InputHTMLAttributes`.

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
index b5a7c41..bcb48af 100644
--- a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
+++ b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
@@ -88,7 +88,7 @@ Các ràng buộc của giai đoạn 1 và 2 giữ nguyên, spec này không nh
 
 ### 3.1 Form
 
-Mọi component, trừ Calendar, chạy được trong một `<form>` không cần JS nối thêm: `FormData`, validation gốc và reset form đều như control gốc.
+Mọi component, trừ Calendar, chạy được trong một `<form>` không cần JS nối thêm: `FormData`, validation gốc và reset form đều như control gốc. Mọi control nhận `form` và chuyền nó cho mọi phần tử mà control gửi qua, cùng ô gõ của nó (để Enter trong ô gõ gửi đúng form đó), nên một control nằm ngoài `<form>` vẫn gửi và reset cùng form đó (phát hiện khi review PR #14).
 
 | Component | Phần tử mang giá trị khi gửi | `required` |
 |---|---|---|
diff --git a/src/components/combobox/Combobox.mdx b/src/components/combobox/Combobox.mdx
index 9df60dc..006ff4e 100644
--- a/src/components/combobox/Combobox.mdx
+++ b/src/components/combobox/Combobox.mdx
@@ -172,6 +172,8 @@ forms like a native control:
   text (or to `defaultInputValue` when it is given), unless an `onReset` handler cancels the reset with `preventDefault()`. A controlled
   Combobox keeps its value, like a controlled React input, and the text of that value: its
   `defaultInputValue` is not used on reset.
+- **`form`:** goes to the input and to the hidden `<select>`, so a Combobox outside its `<form>`
+  submits there, follows that form's reset, and Enter in the input submits that form.
 - **Disabled:** a disabled Combobox is not submitted.
 
 Inside a `Field`, the label names the input, and the description and error are announced with it.
diff --git a/src/components/combobox/Combobox.tsx b/src/components/combobox/Combobox.tsx
index 0c09826..9b39262 100644
--- a/src/components/combobox/Combobox.tsx
+++ b/src/components/combobox/Combobox.tsx
@@ -86,6 +86,11 @@ export interface ComboboxProps {
   invalid?: boolean;
   /** The name the value is submitted under, through a hidden native `<select>`. */
   name?: string;
+  /**
+   * The id of the `<form>` the combobox belongs to, for one outside it. It goes to the input (so
+   * Enter submits that form) and to the hidden `<select>` that carries the value.
+   */
+  form?: string;
   size?: 'sm' | 'md' | 'lg';
   /** The input's id. */
   id?: string;
@@ -195,6 +200,7 @@ export const Combobox = markAsFieldControl(
   forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(props, ref) {
     const {
       name,
+      form,
       placeholder,
       size = 'md',
       filter,
@@ -734,6 +740,7 @@ export const Combobox = markAsFieldControl(
             ref={mergedRef}
             type="text"
             role="combobox"
+            form={form}
             id={fieldProps.id}
             autoComplete="off"
             placeholder={placeholder}
@@ -762,6 +769,7 @@ export const Combobox = markAsFieldControl(
           aria-hidden="true"
           tabIndex={-1}
           name={name}
+          form={form}
           required={required}
           disabled={disabled}
           defaultValue={nativeValue ?? ''}
diff --git a/src/components/number-input/NumberInput.mdx b/src/components/number-input/NumberInput.mdx
index ec426f5..5c7551d 100644
--- a/src/components/number-input/NumberInput.mdx
+++ b/src/components/number-input/NumberInput.mdx
@@ -81,6 +81,9 @@ form submits that value. A form reset puts an uncontrolled field back to its `de
 text that was typed but not settled; a controlled one keeps the value it is given. A `disabled` field
 sends nothing.
 
+`form` goes to the visible input and to the hidden one, so a field outside its `<form>` submits the
+number there and follows that form's reset.
+
 <Canvas of={Stories.Keys} />
 
 ## Accessibility
diff --git a/src/components/number-input/NumberInput.tsx b/src/components/number-input/NumberInput.tsx
index e471354..e429ad3 100644
--- a/src/components/number-input/NumberInput.tsx
+++ b/src/components/number-input/NumberInput.tsx
@@ -39,6 +39,11 @@ export interface NumberInputProps extends Omit<
   max?: number;
   /** The grid of values, which starts at `min` (or 0). Default 1. */
   step?: number;
+  /**
+   * The id of the `<form>` the field belongs to, for a field outside it. It goes to the visible input
+   * (so Enter submits that form) and to the hidden one that carries the number.
+   */
+  form?: string;
   /** What PageUp and PageDown move by. Default ten times `step`. */
   largeStep?: number;
   /** BCP 47 locale of the text shown and read. Default `"en-US"`. */
@@ -61,7 +66,7 @@ const DEFAULT_LABELS = { increment: 'Increase', decrement: 'Decrease' };
  * freely and the text is read when the field loses focus or on Enter; the arrow keys, the buttons
  * (which repeat while held) and, if allowed, the wheel step along the grid of `step`. The value the
  * form receives is a hidden input with the plain number. `className` and `style` go on the frame,
- * `name` on the hidden input, every other prop on the visible input.
+ * `name` on the hidden input, `form` on both inputs, every other prop on the visible input.
  */
 export const NumberInput = markAsFieldControl(
   forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
@@ -329,6 +334,7 @@ export const NumberInput = markAsFieldControl(
             ref={hiddenRef}
             type="hidden"
             name={name}
+            form={props.form}
             value={shown === null ? '' : String(shown)}
             disabled={disabled}
           />
diff --git a/src/components/segmented-control/SegmentedControl.mdx b/src/components/segmented-control/SegmentedControl.mdx
index 5bf9854..4c6dea0 100644
--- a/src/components/segmented-control/SegmentedControl.mdx
+++ b/src/components/segmented-control/SegmentedControl.mdx
@@ -58,7 +58,8 @@ an error), the track gets a thin danger edge inside it.
 
 The segments are native radios that share one `name` (generated when you do not pass one), so
 `FormData` carries the selected value and a form reset puts it back to its default. A disabled
-control, like any disabled input, sends nothing.
+control, like any disabled input, sends nothing. `form` goes to every radio, so a control outside its
+`<form>` submits there and follows that form's reset.
 
 <Canvas of={Stories.Keyboard} />
 
diff --git a/src/components/segmented-control/SegmentedControl.tsx b/src/components/segmented-control/SegmentedControl.tsx
index ef097ef..69b464e 100644
--- a/src/components/segmented-control/SegmentedControl.tsx
+++ b/src/components/segmented-control/SegmentedControl.tsx
@@ -29,6 +29,11 @@ export interface SegmentedControlProps extends Omit<
   onValueChange?: (value: string) => void;
   /** The form field name shared by every item. Generated when omitted. */
   name?: string;
+  /**
+   * The id of the `<form>` the control belongs to, for a control outside it. Every native radio has
+   * it, and the form's reset reaches the control.
+   */
+  form?: string;
   disabled?: boolean;
   required?: boolean;
   invalid?: boolean;
@@ -50,6 +55,7 @@ export const SegmentedControl = markAsFieldGroup(
       defaultValue,
       onValueChange,
       name,
+      form,
       size = 'md',
       fullWidth,
       className,
@@ -85,14 +91,18 @@ export const SegmentedControl = markAsFieldGroup(
     // The browser puts each radio back to the `checked` attribute React wrote at mount. A controlled
     // group holds a value the attribute may not know any more, so it is written back to the radios.
     const rootRef = useRef<HTMLDivElement>(null);
-    useFormReset(rootRef, () => {
-      if (value === undefined) return;
-      rootRef.current
-        ?.querySelectorAll<HTMLInputElement>('input.flg-segmented-input')
-        .forEach((input) => {
-          input.checked = input.value === value;
-        });
-    });
+    useFormReset(
+      rootRef,
+      () => {
+        if (value === undefined) return;
+        rootRef.current
+          ?.querySelectorAll<HTMLInputElement>('input.flg-segmented-input')
+          .forEach((input) => {
+            input.checked = input.value === value;
+          });
+      },
+      form,
+    );
 
     // How many mounted items have each value, to warn about a second one.
     const counts = useRef(new Map<string, number>());
@@ -114,6 +124,7 @@ export const SegmentedControl = markAsFieldGroup(
     const context = useMemo<SegmentedControlContextValue>(
       () => ({
         name: groupName,
+        form,
         value,
         defaultValue,
         onValueChange,
@@ -121,7 +132,7 @@ export const SegmentedControl = markAsFieldGroup(
         disabled,
         register,
       }),
-      [groupName, value, defaultValue, onValueChange, required, disabled, register],
+      [groupName, form, value, defaultValue, onValueChange, required, disabled, register],
     );
     return (
       <div
diff --git a/src/components/segmented-control/SegmentedControlContext.ts b/src/components/segmented-control/SegmentedControlContext.ts
index 9aaec31..700791e 100644
--- a/src/components/segmented-control/SegmentedControlContext.ts
+++ b/src/components/segmented-control/SegmentedControlContext.ts
@@ -3,6 +3,7 @@ import { createContext, useContext } from 'react';
 /** What a SegmentedControl tells each SegmentedControlItem inside it. */
 export interface SegmentedControlContextValue {
   name: string;
+  form: string | undefined;
   value: string | null | undefined;
   defaultValue: string | undefined;
   onValueChange: ((value: string) => void) | undefined;
diff --git a/src/components/segmented-control/SegmentedControlItem.tsx b/src/components/segmented-control/SegmentedControlItem.tsx
index 4b1ed1c..4bad7b6 100644
--- a/src/components/segmented-control/SegmentedControlItem.tsx
+++ b/src/components/segmented-control/SegmentedControlItem.tsx
@@ -39,6 +39,7 @@ export const SegmentedControlItem = forwardRef<HTMLInputElement, SegmentedContro
           className="flg-segmented-input"
           {...props}
           name={group?.name}
+          form={props.form ?? group?.form}
           value={value}
           checked={controlled ? group.value === value : undefined}
           defaultChecked={controlled ? undefined : group?.defaultValue === value}
diff --git a/src/components/select/Select.mdx b/src/components/select/Select.mdx
index 0404cba..77cf0e0 100644
--- a/src/components/select/Select.mdx
+++ b/src/components/select/Select.mdx
@@ -62,6 +62,8 @@ in forms like a native control:
 - **Reset:** a form reset puts an uncontrolled Select back to `defaultValue`, unless an `onReset`
   handler cancels the reset with `preventDefault()`. A controlled Select keeps its value, like a
   controlled React input.
+- **`form`:** goes to the hidden `<select>`, so a Select outside its `<form>` submits there and
+  follows that form's reset.
 - **Autofill:** a value the browser fills in reaches `onValueChange`.
 
 Inside a `Field`, the label names the Select, and a click on the label opens it, as a label does for
diff --git a/src/components/select/Select.tsx b/src/components/select/Select.tsx
index e83555a..cdb7087 100644
--- a/src/components/select/Select.tsx
+++ b/src/components/select/Select.tsx
@@ -39,6 +39,8 @@ const SELECT_PARTS: ListParts = {
 interface SelectBaseProps {
   /** The name the value is submitted under, through a hidden native `<select>`. */
   name?: string;
+  /** The id of the `<form>` the Select belongs to, for one outside it. The hidden native `<select>` has it. */
+  form?: string;
   /** Shown, muted, while nothing is chosen. */
   placeholder?: string;
   required?: boolean;
@@ -118,6 +120,7 @@ export const Select = markAsFieldControl(
   forwardRef<HTMLButtonElement, SelectProps>(function Select(props, ref) {
     const {
       name,
+      form,
       placeholder,
       size = 'md',
       autoComplete,
@@ -498,6 +501,7 @@ export const Select = markAsFieldControl(
           aria-hidden="true"
           tabIndex={-1}
           name={name}
+          form={form}
           multiple={multiple}
           required={required}
           disabled={disabled}
diff --git a/src/components/slider/Slider.mdx b/src/components/slider/Slider.mdx
index 5bec7a9..e15d84f 100644
--- a/src/components/slider/Slider.mdx
+++ b/src/components/slider/Slider.mdx
@@ -117,6 +117,9 @@ the slider is `disabled`. A range has two, with one `name`, the lower value firs
 `FormData.getAll(name)` is `["20", "75"]`. A form reset puts an uncontrolled slider back to its
 `defaultValue` (or `min`); a controlled one keeps the value it is given.
 
+`form` goes to every hidden input, so a slider outside its `<form>` submits its value there and
+follows that form's reset.
+
 <Canvas of={Stories.Keyboard} />
 <Canvas of={Stories.RangeKeyboard} />
 
diff --git a/src/components/slider/Slider.tsx b/src/components/slider/Slider.tsx
index 767179a..4d12f7d 100644
--- a/src/components/slider/Slider.tsx
+++ b/src/components/slider/Slider.tsx
@@ -52,6 +52,11 @@ export type SliderProps<V extends SliderValue = number> = Omit<
   invalid?: boolean;
   /** The form field name; the hidden input that carries the value has it. */
   name?: string;
+  /**
+   * The id of the `<form>` the slider belongs to, for a slider outside it. Every hidden input that
+   * carries a value has it, and the form's reset reaches the slider.
+   */
+  form?: string;
   /** Forces the tick dots on or off. By default they show when the range has at most 10 steps. */
   ticks?: boolean;
   /** The words for a value, in the bubble and in `aria-valuetext` (`"60%"`, `"3 of 5"`). */
@@ -94,6 +99,7 @@ export const Slider = markAsFieldGroup(
       step: stepProp,
       largeStep: largeStepProp,
       name,
+      form,
       ticks,
       getValueText,
       labels,
@@ -244,7 +250,7 @@ export const Slider = markAsFieldGroup(
     });
     // The form resets the native inputs behind React's back; put the value back with it. The control
     // is the element to watch, so a slider with no `name` is reset too.
-    useFormReset(controlRef, () => resetValue(defaultRef.current ?? min));
+    useFormReset(controlRef, () => resetValue(defaultRef.current ?? min), form);
 
     const commitRef = useRef(onValueCommit as ((value: SliderValue) => void) | undefined);
     useWriteOnCommit(() => {
@@ -461,7 +467,14 @@ export const Slider = markAsFieldGroup(
         {name === undefined
           ? null
           : shown.map((n, index) => (
-              <input key={index} type="hidden" name={name} value={String(n)} disabled={disabled} />
+              <input
+                key={index}
+                type="hidden"
+                name={name}
+                form={form}
+                value={String(n)}
+                disabled={disabled}
+              />
             ))}
       </div>
     );
diff --git a/src/internal/use-form-reset.ts b/src/internal/use-form-reset.ts
index 653d1fb..8558505 100644
--- a/src/internal/use-form-reset.ts
+++ b/src/internal/use-form-reset.ts
@@ -11,8 +11,17 @@ import { useWriteOnCommit } from './use-write-on-commit';
  * The listener of the library runs before React's `onReset`, so whether the reset was cancelled with
  * `preventDefault()` is only known a task later; the hook waits that task. It reads `onReset` at
  * that moment, so the caller does not have to keep it stable.
+ *
+ * `form` is the id a control was given in its `form` attribute. An element that is not a form
+ * control (the `<div>` of a Slider or of a SegmentedControl) has no `.form` that follows the
+ * attribute, so with an id the form is the element of that id when it is a `<form>`, and none
+ * otherwise. Without one the form is the control's own, or the one around the element.
  */
-export function useFormReset(elementRef: RefObject<HTMLElement | null>, onReset: () => void): void {
+export function useFormReset(
+  elementRef: RefObject<HTMLElement | null>,
+  onReset: () => void,
+  form?: string,
+): void {
   const latest = useRef(onReset);
   useWriteOnCommit(() => {
     latest.current = onReset;
@@ -20,9 +29,16 @@ export function useFormReset(elementRef: RefObject<HTMLElement | null>, onReset:
   useEffect(() => {
     const element = elementRef.current as (HTMLElement & { form?: HTMLFormElement | null }) | null;
     // A form control knows its form, even through the `form` attribute, and has none when that
-    // names an id that does not exist; any other element is looked up in the tree.
-    const form = element && 'form' in element ? element.form : element?.closest('form');
-    if (!form) return;
+    // names an id that does not exist; any other element is looked up in the tree. An id given
+    // here is the caller's `form` attribute for an element that cannot carry one.
+    let target: HTMLFormElement | null | undefined;
+    if (form !== undefined) {
+      const named = document.getElementById(form);
+      target = named instanceof HTMLFormElement ? named : null;
+    } else {
+      target = element && 'form' in element ? element.form : element?.closest('form');
+    }
+    if (!target) return;
     const pending = new Set<ReturnType<typeof setTimeout>>();
     const onFormReset = (event: Event) => {
       const timer = setTimeout(() => {
@@ -31,11 +47,11 @@ export function useFormReset(elementRef: RefObject<HTMLElement | null>, onReset:
       }, 0);
       pending.add(timer);
     };
-    form.addEventListener('reset', onFormReset);
+    target.addEventListener('reset', onFormReset);
     return () => {
-      form.removeEventListener('reset', onFormReset);
+      target.removeEventListener('reset', onFormReset);
       // A reset that is still waiting must not reach a component that is gone.
       pending.forEach(clearTimeout);
     };
-  }, [elementRef]);
+  }, [elementRef, form]);
 }
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/internal/use-form-reset.test.tsx src/components/number-input src/components/slider src/components/segmented-control src/components/combobox src/components/select
pnpm vitest run --project storybook-light --project storybook-dark src/components/number-input
pnpm vitest run --project storybook-light --project storybook-dark src/components/slider
pnpm vitest run --project storybook-light --project storybook-dark src/components/segmented-control
pnpm vitest run --project storybook-light --project storybook-dark src/components/combobox
pnpm vitest run --project storybook-light --project storybook-dark src/components/select
pnpm build && pnpm check:package
```

Expected:
- Unit: 18 file, 771 test PASS, không lỗi kiểu.
- Story, từng thư mục, ba engine × hai theme: number-input 42, slider 48, segmented-control 24, combobox 84, select 84, đều PASS.
- `check:package` PASS. Theo lần chạy nháp: JS 43.34 kB trên 47.58 kB, CSS 8.46 kB trên 9.31 kB.
- Ảnh chuẩn của năm component không đổi: không truyền `form` thì không thuộc tính nào được render, và không CSS nào đổi (phát hiện 16).

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md \
  src/components/combobox/Combobox.mdx \
  src/components/combobox/Combobox.test.tsx \
  src/components/combobox/Combobox.tsx \
  src/components/number-input/NumberInput.mdx \
  src/components/number-input/NumberInput.test.tsx \
  src/components/number-input/NumberInput.tsx \
  src/components/segmented-control/SegmentedControl.mdx \
  src/components/segmented-control/SegmentedControl.test.tsx \
  src/components/segmented-control/SegmentedControl.tsx \
  src/components/segmented-control/SegmentedControlContext.ts \
  src/components/segmented-control/SegmentedControlItem.tsx \
  src/components/select/Select.mdx \
  src/components/select/Select.test.tsx \
  src/components/select/Select.tsx \
  src/components/slider/Slider.mdx \
  src/components/slider/Slider.test.tsx \
  src/components/slider/Slider.tsx \
  src/internal/use-form-reset.test.tsx \
  src/internal/use-form-reset.ts
```
```bash
git commit -m "fix: form reaches the submitting element of NumberInput, Slider, SegmentedControl, Combobox and Select" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 6: Fixtures với cả 8 component của giai đoạn 3

Spec §7 **Fixtures**, §9 mục 3. Mỗi fixture có một form "Book a room" dùng cả 8 component, và script kiểm form đó bằng thao tác thật.
- **`vite-app`:** `src/Inputs.tsx`, render từ `App.tsx`. Một `Card` chứa form `aria-label="Booking"`: Slider khoảng (`name="budget"`, `defaultValue={[20, 80]}`), NumberInput (`guests`, mặc định 2), SegmentedControl (`view`, mặc định `grid`), Combobox (`city`), TagInput (`tags`), FileUpload (`files`), DatePicker (`checkIn`), mỗi control trong một `Field`, và nút "Book". Calendar nằm trong `Card`, ngoài form, không có `today`.
- `onSubmit` của vite chặn gửi, đọc `new FormData(form)` và ghi JSON vào `<output data-testid="submitted">`: `getAll` cho mỗi tên, tệp thành tên tệp.
- **`next-app`:** cùng form trong client component `app/inputs.tsx`, gửi tới Server Action `book` của `app/actions.ts` (`'use server'`) qua `useActionState`. Action trả các trường nhận được: giá trị đơn (số khách, đoạn, thành phố, ngày) dạng chuỗi; `budget`, thẻ và tệp dạng mảng; tệp thành tên tệp. Client ghi chúng vào cùng `<output>`. `page.tsx` ghép `<Inputs />` như các phần client khác. Kiểm tra render ở server vẫn phải pass.
- **Script:** tám gốc mới trong `COMPONENTS`; `checkInputs(page, problems)` được gọi từ `inspect`:
  - Slider: phím mũi tên trên từng núm, 20 lên 25 và 80 xuống 75.
  - NumberInput: ArrowUp hai lần, 2 lên 4.
  - SegmentedControl: bấm đoạn "List".
  - Combobox: gõ "Hu", rồi ArrowDown và Enter (`hue`).
  - TagInput: gõ `alpha` rồi Enter, `beta` rồi Enter.
  - FileUpload: `setInputFiles` với hai tệp trong bộ nhớ, `one.txt` và `two.txt`.
  - DatePicker: gõ `11/14/2026` rồi Tab (`2026-11-14`).
  - Trước khi bấm "Book", `<output>` phải còn rỗng ("the form was submitted too early"). Sau đó script chờ `<output>` và so từng trường. Console phải sạch.
- Các lựa chọn khi làm ở phát hiện 12.

**Files:**
- Create: `fixtures/vite-app/src/Inputs.tsx`, `fixtures/next-app/app/inputs.tsx`, `fixtures/next-app/app/actions.ts`
- Modify: `fixtures/vite-app/src/App.tsx`, `fixtures/next-app/app/page.tsx`, `scripts/test-fixtures.mjs`

**Interfaces:**
- Produces:
  - `Inputs`: `fixtures/vite-app/src/Inputs.tsx` và `fixtures/next-app/app/inputs.tsx` (client).
  - `book(previous: Booking, formData: FormData): Promise<Booking>` và kiểu `Booking` trong `fixtures/next-app/app/actions.ts`.
  - Form `aria-label="Booking"` với các tên `budget`, `guests`, `view`, `city`, `tags`, `files`, `checkIn`; kết quả trong `<output data-testid="submitted">`.
  - `COMPONENTS` của script có thêm `.flg-slider`, `.flg-number-input`, `.flg-segmented`, `.flg-combobox`, `.flg-tag-input`, `.flg-file-upload`, `.flg-calendar`, `.flg-date-picker`; hàm `checkInputs(page, problems)`.
- Consumes: cả 8 component của giai đoạn 3, cùng `Card`, `Field` và `Button`, từ tarball của package (`pnpm build` rồi `pnpm pack`, do script làm).

- [ ] **Step 1: Viết test**

Task này không có khối test riêng. Kiểm tra là hàm `checkInputs` trong `scripts/test-fixtures.mjs`, nằm trong khối code ở Step 3 cùng hai form mà nó kiểm.

- [ ] **Step 2: Chạy test, xác nhận fail**

Không có bước fail-first trên cây của plan: script và form đi cùng một khối. Ở bản nháp, lần chạy fixture đầu dùng bản đầu của `checkInputs` (gõ rồi Enter cho cả Combobox và DatePicker), và fail ở đúng hai bước:
- `city` rỗng: gõ chữ không trỏ option nào, mà Enter chỉ chọn option đang được trỏ;
- "the form was submitted too early": Enter với một ngày đọc được cũng gửi form.

Script trong plan dùng ArrowDown trước Enter cho Combobox, và Tab cho DatePicker (phát hiện 12).

- [ ] **Step 3: Viết code**

```diff
diff --git a/fixtures/next-app/app/actions.ts b/fixtures/next-app/app/actions.ts
new file mode 100644
index 0000000..32bf5e0
--- /dev/null
+++ b/fixtures/next-app/app/actions.ts
@@ -0,0 +1,27 @@
+'use server';
+
+// The Server Action of the booking form. It returns plain data only: strings, an array and the names
+// of the files, which is what a Server Action can send back to the client.
+export type Booking = {
+  budget: string[];
+  guests: string;
+  view: string;
+  city: string;
+  checkIn: string;
+  tags: string[];
+  files: string[];
+} | null;
+
+const text = (value: FormDataEntryValue | null) => (typeof value === 'string' ? value : '');
+
+export async function book(_previous: Booking, formData: FormData): Promise<Booking> {
+  return {
+    budget: formData.getAll('budget').map(text),
+    guests: text(formData.get('guests')),
+    view: text(formData.get('view')),
+    city: text(formData.get('city')),
+    checkIn: text(formData.get('checkIn')),
+    tags: formData.getAll('tags').map(text),
+    files: formData.getAll('files').map((entry) => (entry instanceof File ? entry.name : '')),
+  };
+}
diff --git a/fixtures/next-app/app/inputs.tsx b/fixtures/next-app/app/inputs.tsx
new file mode 100644
index 0000000..45a9fe2
--- /dev/null
+++ b/fixtures/next-app/app/inputs.tsx
@@ -0,0 +1,70 @@
+'use client';
+
+// The eight inputs of phase 3 in one form, posted to a Server Action. The action's answer is shown
+// in <output>, so the check can compare what the server received.
+import {
+  Button,
+  Calendar,
+  Card,
+  CardContent,
+  CardHeader,
+  CardTitle,
+  Combobox,
+  ComboboxItem,
+  DatePicker,
+  Field,
+  FileUpload,
+  NumberInput,
+  SegmentedControl,
+  SegmentedControlItem,
+  Slider,
+  TagInput,
+} from 'h2d-glass-ui';
+import { useActionState } from 'react';
+import { book, type Booking } from './actions';
+
+export function Inputs() {
+  const [booking, action] = useActionState<Booking, FormData>(book, null);
+  return (
+    <Card>
+      <CardHeader>
+        <CardTitle>Book a room</CardTitle>
+      </CardHeader>
+      <CardContent>
+        <form aria-label="Booking" action={action} style={{ display: 'grid', gap: 12 }}>
+          <Field label="Budget">
+            <Slider name="budget" defaultValue={[20, 80]} />
+          </Field>
+          <Field label="Guests">
+            <NumberInput name="guests" defaultValue={2} min={1} max={10} />
+          </Field>
+          <Field label="View">
+            <SegmentedControl name="view" defaultValue="grid">
+              <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+              <SegmentedControlItem value="list">List</SegmentedControlItem>
+            </SegmentedControl>
+          </Field>
+          <Field label="City">
+            <Combobox name="city" placeholder="Search a city…">
+              <ComboboxItem value="hn">Hà Nội</ComboboxItem>
+              <ComboboxItem value="dn">Đà Nẵng</ComboboxItem>
+              <ComboboxItem value="hue">Huế</ComboboxItem>
+            </Combobox>
+          </Field>
+          <Field label="Tags">
+            <TagInput name="tags" placeholder="Add a tag…" />
+          </Field>
+          <Field label="Attachments">
+            <FileUpload name="files" />
+          </Field>
+          <Field label="Check-in" description="Write it as mm/dd/yyyy.">
+            <DatePicker name="checkIn" />
+          </Field>
+          <Button type="submit">Book</Button>
+        </form>
+        <output data-testid="submitted">{booking ? JSON.stringify(booking) : ''}</output>
+      </CardContent>
+      <Calendar aria-label="Availability" />
+    </Card>
+  );
+}
diff --git a/fixtures/next-app/app/page.tsx b/fixtures/next-app/app/page.tsx
index 97da55a..f43cafd 100644
--- a/fixtures/next-app/app/page.tsx
+++ b/fixtures/next-app/app/page.tsx
@@ -23,6 +23,7 @@ import {
   Textarea,
 } from 'h2d-glass-ui';
 import { ClientControls } from './client-controls';
+import { Inputs } from './inputs';
 import { Menus } from './menus';
 import { Navigation } from './navigation';
 import { Overlays } from './overlays';
@@ -75,6 +76,7 @@ export default function Page() {
       <Menus />
       <Selects />
       <Navigation />
+      <Inputs />
     </main>
   );
 }
diff --git a/fixtures/vite-app/src/App.tsx b/fixtures/vite-app/src/App.tsx
index decbcf3..82a0cbc 100644
--- a/fixtures/vite-app/src/App.tsx
+++ b/fixtures/vite-app/src/App.tsx
@@ -23,6 +23,7 @@ import {
   Toaster,
 } from 'h2d-glass-ui';
 import { useEffect, useState } from 'react';
+import { Inputs } from './Inputs';
 import { Menus } from './Menus';
 import { Navigation } from './Navigation';
 import { Overlays } from './Overlays';
@@ -99,6 +100,7 @@ export function App() {
       <Menus />
       <Selects />
       <Navigation />
+      <Inputs />
     </main>
   );
 }
diff --git a/fixtures/vite-app/src/Inputs.tsx b/fixtures/vite-app/src/Inputs.tsx
new file mode 100644
index 0000000..a8bb871
--- /dev/null
+++ b/fixtures/vite-app/src/Inputs.tsx
@@ -0,0 +1,79 @@
+// The eight inputs of phase 3 in one form, with their values read back from FormData on submit. The
+// Next.js fixture posts the same form to a Server Action; `vite preview` serves static files only, so
+// this one reads the FormData in the browser instead.
+import {
+  Button,
+  Calendar,
+  Card,
+  CardContent,
+  CardHeader,
+  CardTitle,
+  Combobox,
+  ComboboxItem,
+  DatePicker,
+  Field,
+  FileUpload,
+  NumberInput,
+  SegmentedControl,
+  SegmentedControlItem,
+  Slider,
+  TagInput,
+} from 'h2d-glass-ui';
+import { useState, type FormEvent } from 'react';
+
+const NAMES = ['budget', 'guests', 'view', 'city', 'tags', 'files', 'checkIn'];
+
+export function Inputs() {
+  const [submitted, setSubmitted] = useState('');
+  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
+    event.preventDefault();
+    const data = new FormData(event.currentTarget);
+    const values: Record<string, string[]> = {};
+    for (const name of NAMES) {
+      values[name] = data.getAll(name).map((entry) => (entry instanceof File ? entry.name : entry));
+    }
+    setSubmitted(JSON.stringify(values));
+  };
+  return (
+    <Card>
+      <CardHeader>
+        <CardTitle>Book a room</CardTitle>
+      </CardHeader>
+      <CardContent>
+        <form aria-label="Booking" onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
+          <Field label="Budget">
+            <Slider name="budget" defaultValue={[20, 80]} />
+          </Field>
+          <Field label="Guests">
+            <NumberInput name="guests" defaultValue={2} min={1} max={10} />
+          </Field>
+          <Field label="View">
+            <SegmentedControl name="view" defaultValue="grid">
+              <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+              <SegmentedControlItem value="list">List</SegmentedControlItem>
+            </SegmentedControl>
+          </Field>
+          <Field label="City">
+            <Combobox name="city" placeholder="Search a city…">
+              <ComboboxItem value="hn">Hà Nội</ComboboxItem>
+              <ComboboxItem value="dn">Đà Nẵng</ComboboxItem>
+              <ComboboxItem value="hue">Huế</ComboboxItem>
+            </Combobox>
+          </Field>
+          <Field label="Tags">
+            <TagInput name="tags" placeholder="Add a tag…" />
+          </Field>
+          <Field label="Attachments">
+            <FileUpload name="files" />
+          </Field>
+          <Field label="Check-in" description="Write it as mm/dd/yyyy.">
+            <DatePicker name="checkIn" />
+          </Field>
+          <Button type="submit">Book</Button>
+        </form>
+        <output data-testid="submitted">{submitted}</output>
+      </CardContent>
+      <Calendar aria-label="Availability" />
+    </Card>
+  );
+}
diff --git a/scripts/test-fixtures.mjs b/scripts/test-fixtures.mjs
index 89b2f60..e1a9457 100644
--- a/scripts/test-fixtures.mjs
+++ b/scripts/test-fixtures.mjs
@@ -81,6 +81,14 @@ const COMPONENTS = [
   '.flg-breadcrumb',
   '.flg-pagination',
   '.flg-toaster',
+  '.flg-slider',
+  '.flg-number-input',
+  '.flg-segmented',
+  '.flg-combobox',
+  '.flg-tag-input',
+  '.flg-file-upload',
+  '.flg-calendar',
+  '.flg-date-picker',
 ];
 
 function run(command, args, cwd) {
@@ -204,6 +212,7 @@ async function inspect(page, url, problems) {
   await checkMenus(page, problems);
   await checkSelects(page, problems);
   await checkNavigation(page, problems);
+  await checkInputs(page, problems);
 }
 
 const hasFocus = (locator) => locator.evaluate((el) => el === document.activeElement);
@@ -358,6 +367,71 @@ async function checkNavigation(page, problems) {
   }
 }
 
+/** Phase 3: the eight inputs take real input, and the form delivers what was set. */
+async function checkInputs(page, problems) {
+  const form = page.getByRole('form', { name: 'Booking' });
+  // Slider: arrow keys move each thumb of the range from 20 to 25 and from 80 to 75.
+  const minimum = form.getByRole('slider', { name: 'Minimum' });
+  await minimum.focus();
+  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
+  const maximum = form.getByRole('slider', { name: 'Maximum' });
+  await maximum.focus();
+  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft');
+  // NumberInput: arrow keys step from 2 to 4.
+  await form.getByRole('spinbutton', { name: 'Guests' }).focus();
+  await page.keyboard.press('ArrowUp');
+  await page.keyboard.press('ArrowUp');
+  await form.getByRole('radio', { name: 'List' }).click();
+  // Combobox: typing filters the list; typing never highlights, so ArrowDown does, and Enter picks it.
+  const city = form.getByRole('combobox', { name: 'City' });
+  await city.click();
+  await page.keyboard.type('Hu');
+  await page.keyboard.press('ArrowDown');
+  await page.keyboard.press('Enter');
+  // TagInput: Enter turns the typed text into a tag.
+  await form.getByRole('textbox', { name: 'Tags' }).click();
+  await page.keyboard.type('alpha');
+  await page.keyboard.press('Enter');
+  await page.keyboard.type('beta');
+  await page.keyboard.press('Enter');
+  await form.locator('.flg-file-upload input[type="file"]').setInputFiles([
+    { name: 'one.txt', mimeType: 'text/plain', buffer: Buffer.from('one') },
+    { name: 'two.txt', mimeType: 'text/plain', buffer: Buffer.from('two') },
+  ]);
+  // DatePicker: the date is typed in the order of its locale (en-US) and committed with Tab (Enter would also submit the form).
+  await form.getByRole('textbox', { name: 'Check-in' }).click();
+  await page.keyboard.type('11/14/2026');
+  await page.keyboard.press('Tab');
+  const output = page.getByTestId('submitted');
+  if ((await output.textContent()) !== '') problems.push('the form was submitted too early');
+
+  await form.getByRole('button', { name: 'Book' }).click();
+  await page.waitForFunction(
+    () => document.querySelector('[data-testid="submitted"]')?.textContent,
+    undefined,
+    { timeout: 30_000 },
+  );
+  const received = JSON.parse((await output.textContent()) ?? '{}');
+  const expected = {
+    budget: ['25', '75'],
+    guests: ['4'],
+    view: ['list'],
+    city: ['hue'],
+    tags: ['alpha', 'beta'],
+    files: ['one.txt', 'two.txt'],
+    checkIn: ['2026-11-14'],
+  };
+  // The Server Action answers a string for the single values, the browser one array for each.
+  for (const [key, value] of Object.entries(expected)) {
+    const got = [received[key]].flat();
+    if (got.join('|') !== value.join('|')) {
+      problems.push(
+        `the form delivered ${key} = ${JSON.stringify(received[key])}, expected ${JSON.stringify(value)}`,
+      );
+    }
+  }
+}
+
 async function testApp(name, browser) {
   const app = APPS[name];
   const cwd = join(FIXTURES, app.dir);
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm build
sed -e 's/5173/5174/g' -e 's/4173/4175/g' scripts/test-fixtures.mjs > scripts/test-fixtures.tmp.mjs
node scripts/test-fixtures.tmp.mjs
rm scripts/test-fixtures.tmp.mjs
```

Expected:
- `lint`, `typecheck`, `format:check` PASS. Fixture nằm ngoài lint và `tsc` của gốc repo; script chạy `npm run typecheck` của vite và `next build` (phát hiện 12).
- Fixture: `Fixtures OK: vite, next.`, sau khi chạy bản production và development của mỗi app. Ba dòng cuối chạy bản sao tạm của `pnpm test:fixtures` ở cổng 5174/4175, vì 5173/4173 bận (Global Constraints); trên máy mà hai cổng đó rảnh, chạy `pnpm test:fixtures`.
- Xoá bản sao, và không để server nào chạy sót. Bản nháp kiểm: không còn tiến trình nghe ở cổng 3100, 3101, 4175, 5174.
- Không file nào trong `src/` đổi, nên unit, story và ảnh chuẩn không đổi.

- [ ] **Step 5: Commit**

```bash
git add \
  fixtures/next-app/app/actions.ts \
  fixtures/next-app/app/inputs.tsx \
  fixtures/next-app/app/page.tsx \
  fixtures/vite-app/src/App.tsx \
  fixtures/vite-app/src/Inputs.tsx \
  scripts/test-fixtures.mjs
```
```bash
git commit -m "test(fixtures): a form with all eight phase 3 inputs in both apps" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 7: Docs chung và changeset `0.3.0`

Spec §8 (Getting started, Accessibility, Phát hành), §9 mục 5.
- **Getting started, "Build a form":** giữ nội dung cũ. Thêm câu liệt kê các component của giai đoạn 3, bốn ý của §8 (form và reset, cùng `form`; số và chuỗi ISO, `null` là chưa có giá trị; `locale` và `weekStartsOn={1}`; prop là hàm phải đến từ client component), và ví dụ `BookingForm`.
- **Accessibility:** mục "Advanced inputs" với các ghi chú của §8. Bảng §4.9 do `ExceptionTable` dựng, nên dòng 15 đến 21 đã có (phát hiện 13).
- **Changeset:** `.changeset/phase-3-inputs.md`, `minor` cho `h2d-glass-ui`, theo kiểu của `.changeset/phase-2-overlays.md`.
- Task này chỉ đổi docs.

**Files:**
- Create: `.changeset/phase-3-inputs.md`
- Modify: `src/docs/GettingStarted.mdx`, `src/docs/Accessibility.mdx`

**Interfaces:**
- Produces: changeset `minor` cho `0.3.0`; ví dụ `BookingForm` trong `GettingStarted.mdx`; mục "Advanced inputs" trong `Accessibility.mdx`.
- Consumes: `ExceptionTable` với dòng 19 đến 21 (Task 4); `form` của các control (Task 5; TagInput và DatePicker đã có từ trước); `locale`, `weekStartsOn`, `getValueText` và `aside` của `Field` (Plan A đến C).

- [ ] **Step 1: Viết test**

Task này chỉ đổi docs, nên không có khối test. Ví dụ `BookingForm` được kiểm kiểu ở Step 4.

- [ ] **Step 2: Chạy test, xác nhận fail**

Không có test fail trước (phát hiện 15).

- [ ] **Step 3: Viết code**

````diff
diff --git a/.changeset/phase-3-inputs.md b/.changeset/phase-3-inputs.md
new file mode 100644
index 0000000..8f2d0f8
--- /dev/null
+++ b/.changeset/phase-3-inputs.md
@@ -0,0 +1,12 @@
+---
+'h2d-glass-ui': minor
+---
+
+Phase 3 of the roadmap. Components: Slider (single value or range), NumberInput, SegmentedControl
+(with SegmentedControlItem), Combobox (with ComboboxItem, ComboboxGroup and ComboboxSeparator),
+TagInput, FileUpload, Calendar (single day or range) and DatePicker. Each submits with a plain form
+and resets with it, takes `form` to reach a form it is not inside of (so does Select), and keeps
+its own live region for screen readers. Values are numbers and ISO date strings (`'YYYY-MM-DD'`),
+and `null` means no value. `Field` takes an `aside` for content at the right of the label row.
+
+There are no breaking changes.
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index e213cff..a8d356d 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -44,6 +44,25 @@ application's responsibility.
   and while the page is hidden, so there is time to read and reach a button.
 - A toast must not be the only way to do or learn something: it goes away.
 
+## Advanced inputs
+
+- **Slider:** with `getValueText` the thumb's `aria-valuetext` is that text ("60%"), so a screen
+  reader reads it where it would read "60". The bubble above the thumb repeats it and is
+  `aria-hidden`.
+- **Combobox:** its own live region says how many options are left ("5 results", "1 result", "No
+  results") shortly after typing stops, and "Loading…" while results are fetched. `labels.results`
+  changes the wording.
+- **Calendar:** every day is named with its full date in the locale ("Saturday, November 14, 2026")
+  and the weekday row reads the long names ("Sunday"). The month title is a polite live region.
+- **Live regions:** Combobox (results), TagInput (tags added, removed or turned down, with the
+  reason), FileUpload (files added or rejected) and DatePicker (an invalid date, or a date that
+  cannot be chosen) each carry their own visually hidden `aria-live="polite"` region in their root,
+  present from the first render. One shared region would go silent inside an open Dialog, whose
+  surroundings are inert. Changes your code makes to `value` are not announced.
+
+The contrast gaps of the Slider (rows 15 to 17), Calendar (row 18) and FileUpload (rows 19 to 21)
+are in the table above, which is built from the same data CI checks.
+
 ## A `<dialog>` the library did not create
 
 The library tracks the Dialogs and Drawers it opens. A modal `<dialog>` from anywhere else is not in
diff --git a/src/docs/GettingStarted.mdx b/src/docs/GettingStarted.mdx
index 9db903e..5154ac6 100644
--- a/src/docs/GettingStarted.mdx
+++ b/src/docs/GettingStarted.mdx
@@ -45,7 +45,9 @@ export function Upgrade() {
 
 Phase 1 components: Surface, Card, Button, IconButton, Badge, Avatar, Divider, Spinner, Field,
 Input, Textarea, Checkbox, RadioGroup and Switch. Phase 2 adds Dialog, Drawer, Popover, Tooltip,
-DropdownMenu, ContextMenu, Select, Tabs, Accordion, Breadcrumb, Pagination and Toast.
+DropdownMenu, ContextMenu, Select, Tabs, Accordion, Breadcrumb, Pagination and Toast. Phase 3 adds
+the advanced inputs: Slider, NumberInput, SegmentedControl, Combobox, TagInput, FileUpload, Calendar
+and DatePicker.
 
 ## Overlays
 
@@ -90,6 +92,72 @@ import { Field, Input } from 'h2d-glass-ui';
 </Field>;
 ```
 
+The advanced inputs of phase 3 work the same way:
+
+- **Every control submits with a plain form and resets with it.** Slider, NumberInput,
+  SegmentedControl, Combobox, TagInput, FileUpload and DatePicker (Calendar is the exception: it
+  holds no form value) put their value in the form's `FormData` under `name`, with no extra
+  JavaScript, and go back to their `defaultValue` when the form is reset. A controlled control keeps
+  the value its parent gives it. Each one, and Select, takes a `form` prop (a form id), so a control
+  outside the `<form>` still submits and resets with it.
+- **Values are numbers and ISO strings.** Slider and NumberInput give a `number` (a range Slider
+  gives `[number, number]`). Dates are `'YYYY-MM-DD'` strings and months `'YYYY-MM'`, never `Date`
+  objects, so a date does not move with the time zone and the server and the browser agree. In a
+  controlled Combobox, NumberInput, DatePicker or Calendar, `null` means no value; `undefined`
+  means uncontrolled. `onValueChange` runs when the user changes the value, not when your code does.
+- **`locale` and `weekStartsOn`.** NumberInput, Calendar, DatePicker and FileUpload (the size of a
+  file) take a BCP 47 `locale`, `'en-US'` by default so that the server and the browser print the
+  same text. The library does not guess the first day of the week from the locale: Calendar and
+  DatePicker start on Sunday, so set `weekStartsOn={1}` for a locale whose week starts on Monday,
+  such as `vi-VN`.
+- **Function props must come from a client component.** `getValueText`, `filter`, `validate`,
+  `isDateUnavailable`, `onReject` and a `labels` object with functions in it cannot cross from a
+  Server Component. Wrap the component in a client component of your own, as for Pagination's
+  `getHref`.
+
+```tsx
+'use client';
+
+import {
+  Button,
+  Combobox,
+  ComboboxItem,
+  DatePicker,
+  Field,
+  NumberInput,
+  Slider,
+} from 'h2d-glass-ui';
+
+export function BookingForm() {
+  return (
+    <form action="/book" method="post">
+      <Field label="Guests">
+        <NumberInput name="guests" defaultValue={2} min={1} max={8} />
+      </Field>
+      <Field label="Check-in" description="Write it as mm/dd/yyyy.">
+        <DatePicker name="checkin" weekStartsOn={1} />
+      </Field>
+      <Field label="Budget per night">
+        <Slider name="budget" defaultValue={120} min={40} max={400} getValueText={(v) => `$${v}`} />
+      </Field>
+      <Field label="City">
+        <Combobox name="city" placeholder="Search a city">
+          <ComboboxItem value="hanoi">Hanoi</ComboboxItem>
+          <ComboboxItem value="hue">Hue</ComboboxItem>
+        </Combobox>
+      </Field>
+      <Button type="reset" variant="ghost">
+        Clear
+      </Button>
+      <Button type="submit">Book</Button>
+    </form>
+  );
+}
+```
+
+`FormData` then holds `guests`, `checkin` (an ISO date, or an empty string with no date), `budget`
+and `city`. A TagInput adds one entry per tag under the same `name`, and a range Slider adds two.
+
 ## Pick a theme
 
 Without a `data-flg-theme` attribute the library follows the operating system's light or dark
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit src/docs
pnpm build-storybook
```

Expected:
- Docs: 6 test PASS (`ExceptionTable.test.tsx` 4, `TokenTable.test.tsx` 2).
- `pnpm build-storybook`: PASS, nên mọi trang MDX biên dịch được. Lệnh không mở cổng nào; thư mục `storybook-static` bị git bỏ qua.

Khối code trong MDX là chữ, không được biên dịch. Kiểm kiểu ví dụ `BookingForm`: chép nó ra một file tạm trong `src/`, đổi import `'h2d-glass-ui'` thành `'./index'`, chạy `tsc`, rồi xoá file:

```bash
awk '/^```tsx$/ { inblock = 1; buf = ""; next } inblock && /^```$/ { inblock = 0; if (buf ~ /BookingForm/) { printf "%s", buf; exit } next } inblock { buf = buf $0 "\n" }' src/docs/GettingStarted.mdx \
  | sed "s#'h2d-glass-ui'#'./index'#" > src/booking-form.tmp.tsx
npx tsc --noEmit -p .
rm src/booking-form.tmp.tsx
```

Expected: `tsc` không báo lỗi. Bản nháp kiểm kiểu ví dụ này với `src/index` (phát hiện 13); Claude chạy nguyên văn các lệnh trên ở `ebb5a8f`: `tsc` không báo lỗi.

Kiểm tra cuối của cả nhánh (spec §9), như bản nháp chạy ở `ebb5a8f`:

```bash
pnpm gen:theme
pnpm check:name
pnpm test:unit
pnpm check:contrast
pnpm build && pnpm check:package
pnpm vitest run --project storybook-light --project storybook-dark src/components/file-upload
sed -e 's/5173/5174/g' -e 's/4173/4175/g' scripts/test-fixtures.mjs > scripts/test-fixtures.tmp.mjs
node scripts/test-fixtures.tmp.mjs
rm scripts/test-fixtures.tmp.mjs
```

Expected:
- `pnpm check:name`: PASS, không có tên cũ ngoài `docs/superpowers`. Bản nháp không chạy lệnh này.
- `pnpm test:unit`: 2811 test PASS, 3 skip (149 file).
- `pnpm check:contrast`: PASS, với dòng 19 đến 21 là `known-exception`.
- `pnpm check:package`: PASS với ngưỡng của Task 4. Theo lần chạy nháp: JS 43.34 kB trên 47.58 kB, CSS 8.46 kB trên 9.31 kB.
- Story file-upload: 48 PASS. Bản nháp chạy thư mục này ở Task 3 và 4; Task 5 đổi `useFormReset`, mà FileUpload gọi không có đối số thứ ba, nên hành vi của nó không đổi. Story của năm thư mục ở Task 5 không đổi sau Task 5.
- Fixture: `Fixtures OK: vite, next.`. Xoá bản sao, và không để server nào chạy sót.

- [ ] **Step 5: Commit**

```bash
git add \
  .changeset/phase-3-inputs.md \
  src/docs/Accessibility.mdx \
  src/docs/GettingStarted.mdx
```
```bash
git commit -m "docs: phase 3 forms in Getting started, Accessibility notes and the 0.3.0 changeset" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```


## Sau khi thực thi

- Đẩy nhánh, rồi tạo ảnh chuẩn bằng workflow "Update visual baselines". Chỉ một story mới không mang thẻ `no-visual`: `Look` của FileUpload, 8 ảnh. Xem ảnh trước khi xin review:
  - khớp mockup F1 (vùng thả rỗng có dòng gợi ý, có tệp, disabled, invalid, dòng bị từ chối, đang kéo);
  - ở forced colors, viền đứt nét là `CanvasText`, khi đang kéo là `Highlight`;
  - ở `prefers-contrast: more`, khi đang kéo, chữ "Drop files to upload", icon và dòng gợi ý dùng `--flg-selected-text` trên `--flg-selected-bg`;
  - ảnh cũ của mọi component khác phải không đổi, kể cả năm component nhận `form` (Task 5 chỉ thêm thuộc tính khi có `form`).
- Mô tả PR nêu cho chủ dự án:
  - §4.9: các dòng 19, 20, 21, 22 mới và dòng 9 mở rộng cho dòng gợi ý khi đang kéo, chờ duyệt;
  - quy tắc `prefers-contrast: more` mới cho dòng gợi ý khi đang kéo (ngoài mockup, chỉ khi người dùng bật);
  - các dòng spec "phát hiện khi lập Plan D", "phát hiện khi review PR #14" và "phát hiện khi review cuối Plan D";
  - các quyết định Claude tự chốt (bên dưới) và các mục để lại; chưa thử Safari thật, VoiceOver và NVDA;
  - changeset `0.3.0` đã sẵn sàng; việc publish là của chủ dự án.

### Đã thực thi (2026-11-05)

- Bảy commit của nhánh nháp được cherry-pick lên `feat/phase-3-plan-d` (`ad04cf4`..`d4e1d30`); cây giống hệt đầu nhánh nháp, cộng file plan.
- Mỗi task có một reviewer riêng (bảy reviewer chạy song song, chỉ đọc). Cả bảy: Approved, không có phát hiện Critical hay Important. Các mục nhỏ được ghi lại và đưa cho review toàn nhánh phân loại.
- Review toàn nhánh trên Opus: "With fixes".
  - **Important 1:** dòng gợi ý (`hint`) chưa từng được đo. Ở `prefers-contrast: more`, khi đang kéo, nền vùng thả thành `--flg-selected-bg` đặc mà dòng gợi ý vẫn là `--flg-text-muted`: khoảng 1.25:1 (sáng) và 1.40:1 (tối). Sửa ở `9615851`: trong chế độ này dòng gợi ý khi đang kéo dùng `--flg-selected-text` (đo được 6.29 / 8.15).
  - **Important 2:** dòng gợi ý lúc nghỉ là chữ muted trên `--flg-control-bg-secondary`: 6.98:1 sáng, 3.64:1 tối. Sửa ở `6f7dd88`: hai cặp đo mới, `dropzone-hint-text` (dòng 22 mới của §4.9, tối 3.64) và `dropzone-hint-drag` (cùng cặp màu với dòng 9, 4.37 / 3.60, nên dòng 9 được mở rộng); bảng ở spec 0+1 có 22 dòng, ghi chú "Điểm 19–22" đứng sau "Điểm 15–17"; trang Accessibility và test của `ExceptionTable` theo đó. Đây là chỗ hở của spec (§4.4 không liệt kê dòng gợi ý), không phải lỗi khi làm.
  - **Important 3:** `accept="*/*"` từ chối mọi tệp. Sửa ở `a0f0629`: `*/*` khớp mọi tệp, như trình duyệt.
  - **Important 4:** cùng một `File` hai lần trong `value` cho hai dòng trùng key, và React in cảnh báo ra output của test. Sửa ở `a07ac7f`: key theo `File` cộng số lần nó đã xuất hiện.
  - Minor sửa luôn: id của dòng bị từ chối tạo trong handler, không trong updater (`7397b4c`); `aria-label={undefined}` không còn xoá tên `labels.browse` (`8dd200b`); nút xoá của dòng bị từ chối được mô tả bằng lý do (`aria-describedby`, `6c1eca6`); changeset không kể Calendar là control gửi form và chỉ kể đúng bốn component có vùng live, `FileUpload.mdx` nói `encType="multipart/form-data"` và kể đủ prop là hàm, spec §6.3 ghi rõ `dragenter`, `dragover`, `dragleave` chỉ xử lý khi thứ đang kéo có tệp (`b163168`).
  - Lần review lại thấy cả tám mục đã xử lý, không có lỗi mới Critical hay Important.
- **Quyết định Claude tự chốt khi thực thi** (chủ dự án có thể đảo lại):
  - Dòng gợi ý lúc nghỉ (tối 3.64:1) giữ đúng mockup F1 và thành dòng 22 của §4.9, như các dòng 19–21; chỉ `prefers-contrast: more` đổi màu.
  - M6 để lại: `form` đổi sau khi mount thì listener reset của các control gốc (FileUpload, NumberInput, Combobox, Select, TagInput, DatePicker) vẫn ở form cũ, cho tới khi component mount lại. Cùng loại với mục "`useFormReset` đọc form một lần" của Plan A.
- **Để lại** (ghi trong mô tả PR):
  - M6 như trên (đã xong ở review PR #18, comment `4478806019`).
  - Đổi `form` sau khi mount (đã xong ở review PR #18, comment `4478806019`), và một form mount ở commit sau control, cũng không được `useFormReset(ref, onReset, form)` theo (một câu JSDoc nên nói rõ); `form` riêng của một `SegmentedControlItem` không được reset của nhóm theo.
  - FileUpload: vùng live vẫn đọc "N files added" khi component cha controlled từ chối; một component cha từ chối việc xoá mà truyền một mảng mới bằng nhau thì focus vẫn dời (đã xong ở review PR #18, comment `4478805989`: focus chỉ dời khi dòng thật sự mất); khi disabled, kéo qua vẫn đếm (render ẩn đi).
  - `.jpg` không khớp `.jpeg`, như thuộc tính `accept` gốc; `en-US` viết `0 byte`, `999 byte` (chữ của `Intl`); không có đơn vị trên gigabyte.
  - Fixtures: app Next trả giá trị đơn là chuỗi, app Vite trả mảng (script so qua `[x].flat()`); script không chờ danh sách tệp hiện ra trước khi gửi; Server Action không trả lời thì báo lỗi timeout chung của Playwright.
  - Ví dụ `BookingForm` ghi "mm/dd/yyyy", chỉ đúng với `en-US`.
- Kiểm tra trên `b163168`:
  - lint, typecheck, format, `check:name`, contrast, build, package và fixtures (vite, next, bản production và development, qua bản sao ở cổng 5174/4175) đều đạt;
  - unit: 2818 passed, 3 skipped, không còn cảnh báo trùng key;
  - kích thước: JS 43,4 kB (giới hạn 47,58 kB), CSS 8,47 kB (giới hạn 9,31 kB);
  - story: file-upload 48/48 sau đợt sửa cuối; story của năm thư mục nhận `form` đạt ở Task 5. Máy thiếu bộ nhớ, nên toàn bộ bộ story do CI chạy.

### Review của chủ repo trên PR #18 (2026-11-05)

13 comment, đều thật. Claude (Opus) kiểm từng mục với code, rồi mỗi mục được viết test thấy fail trước khi sửa, mỗi mục một commit theo thứ tự dưới đây, kèm dòng spec "(phát hiện khi review PR #18)" và docs khi hành vi đổi.

- **Bug của FileUpload:**
  - `labels` có khóa `undefined` làm dòng đầu ném lỗi: mỗi khóa tự rơi về mặc định, như Combobox (`09c2f09`).
  - `value` không phải mảng: `null` và mọi thứ không phải danh sách là không có tệp, mảng giả hay iterable (`FileList`) được chép thành mảng, mỗi trường hợp có `devWarn` nói rõ đã nhận gì và dùng gì; `defaultValue` đọc cùng cách (`b9edcfe`).
  - `onDrop` không có `dataTransfer` ném lỗi: không thêm tệp, vẫn `preventDefault` (`f197d9c`).
  - `aria-label` dự phòng đè lên nhãn của tác giả: chỉ cho khi `input.labels` rỗng, đọc sau mount trong layout effect rồi giữ vào state; lần render đầu và HTML server vẫn có nó nên hydrate khớp (`ffbae89`).
  - Thả tệp lên danh sách hay khoảng hở thì trình duyệt mở tệp: bốn handler kéo thả chuyển từ vùng thả lên phần tử gốc (`646751f`).
  - `multiple={false}`: tệp đầu tiên qua đủ mọi kiểm tra được nhận, tệp bị từ chối trước nó không tính, mọi tệp sau nó bị `count` (`b69cde1`).
  - Quy tắc ẩn chữ "browse" khi kéo bị chép lại: dùng lớp chung `flg-visually-hidden` (`8139f00`).
  - Một `File` khác có cùng metadata không bao giờ được ghi vào input: nhớ danh sách đã ghi lần cuối, chỉ bỏ qua khi đúng danh sách đó và input vẫn khớp (`859a016`).
  - Tệp chọn trước khi hydrate bị xoá: layout effect đầu nhận chúng như một lượt chọn qua `addFiles` (`5fa06e2`).
  - Focus mất khi component cha controlled xoá ở commit sau: ý định chuyển focus giữ cho tới khi dòng thật sự mất; thao tác mới của người dùng thay hoặc bỏ nó (`4a5c46e`).
  - Layout effect chạy ở mọi lần render: có deps `files`, `rejected` và bộ đếm của reducer `commit`; cảnh báo dev dùng lại danh sách đã memo (`41417fc`).
- **Cùng loại ở nhiều component:**
  - NumberInput, Combobox, Select, TagInput, DatePicker và FileUpload không truyền `form` cho `useFormReset`, nên đổi `form` sau khi mount thì listener ở lại form cũ (`839cb1e`). Việc này đóng mục "M6 để lại" ở phần "Đã thực thi" phía trên.
  - `useFormReset` tìm id ở `document` toàn cục: control gốc luôn dùng `.form` của chính nó, phần tử khác tìm id trong `getRootNode()` (Document hay ShadowRoot), rồi mới tới `ownerDocument` (`2c2af3a`).
- **Hai quyết định Claude chốt:**
  - Mục 11 (`multiple={false}`): lấy tệp đầu tiên qua đủ mọi kiểm tra, `taken >= limit` quyết định `count`. Đổi hành vi cũ "tệp đầu được xét, các tệp còn lại bị `count`", nên spec §6.3 **Thêm tệp** và MDX đổi theo, và một test cũ đổi thành "mọi tệp trong lượt đều bị từ chối thì giữ tệp cũ".
  - Mục 12 (lớp ẩn): lớp tiện ích nằm trong `@layer flg.base`, mà `flg.components` thắng, nên `position: relative` của chữ "browse" sẽ thắng `position: absolute` của tiện ích. Chỉ giữ một khai báo, `.flg-file-upload-browse.flg-visually-hidden { position: absolute; }`, kèm chú thích; story `Look` kiểm hộp (1×1, absolute, clip) và nó giống nhau trước và sau, sáng và tối.
- Test của mục 9 chạy trong jsdom: render HTML server vào một container, gán `input.files` lên node DOM rồi `hydrateRoot`. jsdom không tính `required` từ `input.files` giả, nên "form có `required` gửi được" chưa có test; chỉ trình duyệt thật mới kiểm được.
- Kiểm tra trên `2c2af3a`: `gen:theme`, lint, typecheck, format, `tsc --noEmit -p .`, `test:unit` 2868 đạt / 3 bỏ qua (không có cảnh báo React), contrast, build và package (JS 43,87/47,58 kB, CSS 8,47/9,31 kB); story của file-upload 48, number-input 42, slider 48, segmented-control 24, combobox 84, select 84, tag-input 54, date-picker 96, sáng và tối, từng thư mục một, đều đạt. Chưa chạy fixtures.
- Vòng 2 sau review lại bằng Opus: hook `useFormReset` nhận form của iframe (`localName` thay cho `instanceof`, vì `HTMLFormElement` của iframe là constructor khác); reset của FileUpload dùng `defaultValue` đã chuẩn hoá; focus chỉ dời khi đang ở `body` hoặc trong FileUpload; các khẳng định hộp của story `Look` chờ `data-dragging`; MDX không còn gợi ý `<label>` bọc ngoài; chú thích rằng `<label>` mount hay bỏ ở commit sau không được theo; hai lỗi chữ.
