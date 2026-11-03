# fl-glass-ui: Plan B, Combobox, TagInput và phần nền của chúng (giai đoạn 3, phần 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm Plan B của giai đoạn 3: bộ đọc hàng `list-rows.ts` dùng chung, kênh lỗi của control lên `Field` (`useControlError`), vùng live `useAnnounce`, rồi `Combobox` (giao diện C1, kèm `match.ts`) và `TagInput` (giao diện Ta1, kèm `split-tags.ts`), cùng các cặp tương phản mới và ngưỡng kích thước.

**Architecture:**
- **`list-rows.ts`** (Task 1): bộ đọc item, nhóm và đường phân cách của Select chuyển vào `src/internal/`. `readRows` nhận tên các phần và tên component, để Select và Combobox dùng chung. Select không đổi hành vi.
- **Kênh lỗi của control** (Task 2): `useControlError(message)` báo lời lên `Field` trong một effect; Field hiện nó ở chỗ lỗi và thành `invalid`, trừ khi có prop `error`. Ngoài Field, hook trả `{ id, message }` để control tự hiện.
- **`Combobox`** (Task 3, 4): ô nhập text có listbox lọc khi gõ, dựng trên lớp nổi, listbox và `<select>` ẩn của Select. Task 3 làm danh sách, bộ lọc bỏ dấu (`match.ts`), phím, con trỏ và form. Task 4 thêm giá trị tự do, `loading` và vùng live (`useAnnounce`).
- **`TagInput`** (Task 5, 6): ô gõ có các thẻ chip trong cùng một khung, mỗi thẻ một input ẩn. Task 5 làm thẻ, phím, dán (`split-tags.ts`), form và vùng live. Task 6 thêm phần từ chối (trùng, `maxTags`, `validate`) và lời báo lỗi qua `useControlError`.
- **Tương phản, ngưỡng kích thước, kiểm tra cuối** (Task 7).

**Tech Stack:** Như Plan A: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63, `@floating-ui/dom` 1.8.0. Plan này không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md`. Plan này làm các phần sau:
- §2 dòng B: danh sách thành phần của Plan B, và hai dòng "Thay đổi ở code cũ" của Plan B (Task 1, 2).
- §3.1: form của Combobox (`<select>` ẩn) và TagInput (input ẩn, `required` trên ô gõ, `setCustomValidity`, reset) (Task 3 đến 6).
- §3.2: dòng Combobox và TagInput; lỗi do control tự báo (Task 2, 3, 5, 6).
- §3.5: listbox của Combobox (Task 3).
- §3.6: vùng live riêng của từng component (Task 4, 5, 6).
- §4.3, §4.4, §4.5: giao diện C1 và Ta1, cặp tương phản, forced colors của hai component (Task 3, 5, 7).
- §5: `list-rows.ts` (Task 1), `useControlError` (Task 2), `combobox/match.ts` (Task 3), `use-announce.ts` (Task 4), `tag-input/split-tags.ts` (Task 5); cảnh báo dev của hai component.
- §6.3: API của `Combobox` và `TagInput`.
- §7: các test mà spec nêu cho phần này.
- §8: trang MDX của Combobox và TagInput.
- §4.9 của spec giai đoạn 0+1 (`docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`): dòng 6 mở rộng cho `combobox-unmatched-text` (Task 7).

Chủ dự án đã duyệt spec và chọn các giao diện C1 và Ta1 ngày 2026-11-02.

**Đã chạy thử khi lập kế hoạch:**
- Toàn bộ code dưới đây đã chạy trên nhánh nháp `draft/phase-3-plan-b`, mỗi task một commit (bảy commit trên `f7c8fd0`). Mỗi test viết trước đã được chạy trên commit cha của task, trừ các chỗ ghi rõ ở mục 15 bên dưới.
- `list-rows.ts` (Task 1) do model miễn phí `kilo/reflection/beam-free` viết qua opencode. `match.ts` (trong Task 3) và `split-tags.ts` (trong Task 5) do `dots-3-note-preview:free` (kilo) viết qua opencode. Claude kiểm tra và dọn lại cả ba. Các phần còn lại do subagent của Claude viết.
- Mọi khối patch trong plan được lấy thẳng từ các commit đó.

Kết quả ở commit cuối (`eee149b`):

| Lệnh | Kết quả |
|---|---|
| `pnpm test:unit` | 134 file, 1962 test PASS, 3 skip (`main` ở `f7c8fd0`: 1492 PASS, 3 skip, theo lần chạy của Plan A trên cùng cây) |
| Story | combobox 84, tag-input 54, select 84, field 30 PASS ở Chromium, Firefox và WebKit, theme sáng và tối, chạy từng thư mục một. Cả bộ story chưa chạy một lượt trên máy này vì thiếu bộ nhớ; CI chạy cả bộ |
| `pnpm check:contrast` | PASS, với dòng 6 của §4.9 mở rộng cho `combobox-unmatched-text` |
| `pnpm check:package` | PASS với ngưỡng mới (JS 40586 B, CSS 8309 B; trước: 35860 B, 7929 B) |
| `pnpm test:fixtures` | Cả hai fixture (vite, next) PASS, chạy qua bản sao tạm của script ở cổng 5174/4175 |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | PASS |

Các phát hiện từ lần chạy thử đã được đưa vào plan:

1. **Chín task nháp thành bảy task.** `match.ts` nằm trong Task 3, `use-announce.ts` trong Task 4, `split-tags.ts` trong Task 5: mỗi module đi cùng nơi đầu tiên import nó. Một module trong `src/` mà không ai import thì không có file build, và `check:use-client` báo lỗi (như phát hiện 2 của Plan A). Bản nháp viết hai hàm thuần trong một worktree riêng rồi cherry-pick.
2. **`useAnnounce` có sẵn từ lúc lập Plan A**, để riêng ngoài `src/`. Task 4 chuyển nó và test của nó vào `src/internal/` không sửa dòng nào; nó đúng với §3.6 và §5. Nó không nằm trong `check-use-client.ts`: module nội bộ không có `"use client"`, và build xuất nó qua Combobox.
3. **Bốn dòng của spec giai đoạn 3 được sửa, đánh dấu "(phát hiện khi lập Plan B)":**
   - §6.3 Combobox, cấu trúc (Task 3): khi chỉ còn dòng trạng thái, panel bỏ `role="listbox"` và tên của nó, vì axe (`aria-required-children`) từ chối một listbox không có option. Story `Empty` bắt được lỗi này. Có option trở lại thì role và tên trở lại.
   - §4.3 TagInput, `size` (Task 5): `sm` dùng padding dọc 2px, không phải 3px. Ô gõ 22px cộng viền 2px đã là 24px, nên 3px cho khung 30px (story đo được ở cả ba engine); 2px cho 28px.
   - §6.3 TagInput, **Bàn phím** (Task 5 làm, Task 6 ghi vào spec): bấm chuột vào nút xoá thì focus về ô gõ. Quy tắc "nút xoá kế tiếp" chỉ dành cho phím (nhận ra bằng `event.detail === 0`); nếu không, Backspace sau một cú bấm chuột sẽ xoá thêm thẻ kế.
   - §6.3 TagInput, **Thẻ bị từ chối** (Task 6): khi mọi ký tự ngăn đều là `"Enter"`, các phần bị từ chối được nối bằng một dấu cách. Mỗi phần được xét với các thẻ đứng trước nó, kể cả các phần vừa được nhận trong cùng lần dán.
4. **Firefox gửi form trước khi React render `<select>` ẩn của Combobox.**
   - Story `CustomValueSubmit` (Task 4): gõ chữ tự do với `allowCustomValue`, đóng listbox, nhấn Enter. Chromium và WebKit gửi đúng chữ; Firefox gửi `''` ở cả hai theme.
   - Cách sửa như `NumberInput` của Plan A: nhánh Enter trên listbox đóng tự ghi vào `<select>` ẩn. Khi chưa có option nào mang giá trị đó, nó thêm một `<option data-pending>` tạm; layout effect đồng bộ xoá option tạm khi React render option thật.
   - Hai test đơn vị phát keydown ngoài `act`, nên chỉ một lần ghi trực tiếp mới thấy được khi sự kiện trả về: `writes the hidden select on Enter itself, for the submit that follows the keydown` và `writes the item value on Enter when the text folds to an item`. Cả hai fail trước khi sửa, với `expected '' to be 'Quận 1'` và `'hn'`.
5. **TagInput không cần ghi trực tiếp như vậy.** Enter trên ô gõ trống, và bấm nút submit khi còn chữ gõ dở, đều gửi đủ thẻ ở cả ba engine. Thẻ được chốt ngay ở phím tạo ra nó, và React flush render của một sự kiện rời rạc trước keydown kế tiếp. Test `puts the pending text in the hidden inputs before the click that follows the blur` và story `LeavingWithText` giữ điều đó.
6. **Story `Paste` của TagInput từng chập chờn ở WebKit.**
   - Nguyên nhân: dưới Playwright, WebKit dùng clipboard của hệ thống, chung cho mọi tiến trình trình duyệt đang chạy. Một lượt chạy khác ghi đè clipboard giữa lúc copy và lúc paste. Không phải lỗi của component.
   - Cách sửa, chỉ ở story: `copyAndPaste()` copy, focus và paste trong một bước. Nếu sau 1 giây chưa thấy trạng thái mong đợi, nó xoá chữ lạc và làm lại, tối đa 3 lần. Vẫn là copy và paste bằng bàn phím thật. Sau khi sửa: 12/12 lượt chạy song song pass. Bản sửa nằm trong commit của Task 5.
   - Firefox bỏ qua `clipboardData` của một `ClipboardEvent` tự tạo, nên story dán bằng copy và paste thật từ một `textarea`. Test đơn vị dùng sự kiện tự tạo (`splits what is pasted at the separators and at line breaks`).
7. **Nút submit có thể chạy khỏi cú bấm.** Thẻ được thêm khi ô gõ mất focus vì cú nhấn nút submit có thể làm hàng chip xuống dòng. Nút bị đẩy xuống giữa `mousedown` và `mouseup`, nên cú click trượt (thấy ở Chromium và WebKit với cột rộng 280px). Đó là bản chất của một khung tự cao lên. Form của story rộng 420px; docs chưa nói điều này.
8. **Playwright WebKit đi lùi trang khi nhấn Backspace trong ô chỉ đọc**: trang đóng giữa lúc vitest chạy. Story `ReadOnly` không nhấn Backspace. Không phải lỗi của component.
9. **Combobox, các lựa chọn khi làm (Task 3):**
   - Trạng thái lọc là `query: string | null`. Chỉ chữ người dùng gõ mới lọc. Mở bằng phím hay cú nhấn, sau khi chọn và khi đóng thì `query` là `null` và mọi item hiện.
   - Listbox do component cha mở (`defaultOpen`, `open`) lấy chữ đang có làm `query` khi chữ đó khác chữ của item đã chọn. Đó là cách story `Open` mở sẵn ở trạng thái đang lọc.
   - Chữ theo giá trị: chọn chỉ đặt giá trị, rồi một layout effect theo khoá "giá trị + chữ của item" đặt chữ. Vì vậy component cha controlled từ chối một lựa chọn thì chữ cũ được giữ, và một item đến sau giá trị của nó mang chữ tới.
   - `<select>` ẩn chỉ có `<option value="">` và option của giá trị đang chọn (spec §3.1), không có mọi item như của Select. Vì vậy trình duyệt không tự điền (autofill) Combobox được.
   - `onInputValueChange` cũng được gọi khi component cha đổi `value` và chữ đổi theo. Đây là cách đọc câu "khi lib tự đổi chữ" của §6.3.
   - Phím bị bỏ qua khi IME đang soạn chữ (`isComposing`). Spec không nói, nhưng tiếng Việt được gõ qua IME.
   - Phần khớp in đậm chỉ có khi đủ bốn điều: bộ lọc mặc định, có chữ đã gõ, children là chuỗi thuần, và chuỗi đó bằng chữ của item (`textValue` khác thì vị trí sẽ lệch).
   - Story `Open` gõ "h" như mockup C1 (sáu dòng), không gõ "ha" như brief nháp ghi. `Look` và `Open` đã được chụp từ một Storybook chạy tạm (cổng 6107, đã tắt) và khớp C1.
10. **Combobox, giá trị tự do và thông báo (Task 4):**
    - Số kết quả được đọc từ một effect theo bộ đếm phím gõ, trạng thái mở, `loading` và câu cần đọc. Một phím gõ giữ nguyên số kết quả vẫn được đọc. Số đổi trong lúc listbox mở (kết quả về) được đọc lại. Trong lúc `loading`, số cũ không được đọc; số mới được đọc khi `loading` tắt. Đóng listbox bỏ câu đang chờ.
    - `labels.loading` được đọc một lần cho mỗi đợt `loading`, khi listbox đang mở, kể cả khi listbox mở ra trong lúc đang `loading`. Cách đọc này rộng hơn chữ của §6.3 một chút, để không lỡ trường hợp thường gặp: phím gõ vừa mở listbox vừa bật `loading` trong cùng một lần render.
    - Khi chốt chữ, việc đổi chữ thành item bỏ qua item `disabled`, và giữ item đang chọn khi chữ đã bằng chữ của nó (hai item cùng chữ không làm giá trị nhảy).
    - Cảnh báo dev "giá trị không khớp item nào" không in khi có `allowCustomValue`.
11. **TagInput, các lựa chọn khi làm (Task 5):**
    - Dán mà không có gì để tách (không có ký tự ngăn, và không có xuống dòng khi có `"Enter"`) được để cho trình duyệt: chữ vào ô gõ. §6.3 cũng có thể đọc là "mọi lần dán đều thành thẻ".
    - Blur không có `relatedTarget` trong lúc cửa sổ không có focus (người dùng chuyển cửa sổ) không chốt chữ.
    - Chữ do IME soạn được tách ở sự kiện input kế tiếp, hoặc khi rời ô.
    - `<ul>` rỗng không được render, để screen reader không đọc "list, 0 items". Quy tắc `display: contents` và rủi ro ở §10 giữ nguyên.
    - Enter khi `"Enter"` không phải ký tự ngăn thì form gửi mà không có chữ gõ dở: chữ đó chỉ thành thẻ khi rời ô. `TagInput.mdx` ghi điều này.
12. **TagInput, phần từ chối (Task 6):**
    - Trong Field, `aria-invalid` và `aria-describedby` theo lời từ chối chậm một lần render, vì lời báo đến Field trong một effect. Ngoài Field thì ngay.
    - `invalid={false}` truyền trực tiếp thắng lời từ chối (spec 0+1 §5), nhưng `setCustomValidity` vẫn chặn submit.
    - `error` của Field thắng về hiển thị, nhưng TagInput vẫn `invalid` và giữ lời validity của nó (Field đã `invalid` sẵn).
    - `validate` trả `''` hay `undefined` thì thẻ được nhận. Chỉ `false` và một chuỗi không rỗng mới từ chối; spec chỉ nói "false hoặc chuỗi".
    - Thẻ của một ký tự ngăn vừa gõ bị từ chối thì chữ ở lại không có ký tự ngăn đó, để người dùng sửa. Phần gõ sau ký tự ngăn cuối trong cùng một sự kiện `change` được nối phía sau.
13. **Tương phản (Task 7):**
    - `combobox-unmatched-text` ở theme tối là 4.10:1, dưới 4.5. Đó chính là cặp của dòng 6 §4.9 (`--flg-text-muted`, tối, 4.10). Vì vậy dòng 6 được mở rộng (mô tả trong `contrast-exceptions.ts`, chữ của dòng 6 và chú thích bảng ở spec 0+1), không thêm dòng mới. Bảng vẫn 17 dòng, `ExceptionTable.test.tsx` không đổi.
    - **Dòng 6 mở rộng chờ chủ dự án duyệt** (PR hỏi). Spec §4.3 (C1) cho chữ đó màu `--flg-text-muted`, nên giá trị không đổi (mockup lock).
    - Các cặp khác đạt. Sáng: 5.08 (`combobox-unmatched-text`), 11.53 (`tag-chip-text`), 5.76 (`tag-remove-icon`). Tối: chữ chip 4.66, icon × 3.38. Ở `prefers-contrast: more`: sáng 7.65 / 12.18 / 12.18, tối 10.43 / 9.13 / 9.13.
    - Dưới `prefers-contrast: more`, nút xoá của chip bỏ `opacity: .75` (`.flg-tag > button { opacity: 1 }`). Script mô phỏng opacity theo chế độ chứ không đọc CSS, nên quy tắc CSS này không có test máy.
14. **Các mục để lại** (không làm ở plan này):
    - Trình duyệt không tự điền Combobox (mục 9).
    - Component cha controlled từ chối xoá giá trị (rời ô với chữ rỗng gọi `onValueChange(null)`): ô nhập rỗng mà giá trị vẫn khác `null`, cho tới lần rời ô sau.
    - Component cha controlled từ chối giá trị sau Enter: `<option data-pending>` ở lại cho tới khi giá trị đổi lần sau.
    - Trong Field, `aria-*` của TagInput theo lời từ chối chậm một render (mục 12).
    - Esc trên listbox đóng mà còn chữ lạc, trong Dialog: Esc đầu xoá chữ, cần thêm một Esc để đóng Dialog. Đúng quy tắc của spec; giữ nguyên.
    - Kiểm tra screen reader (§7 dòng 6) chưa làm.
15. **Chỗ bước fail-first không đầy đủ**, theo các báo cáo của bản nháp:
    - Task 1 (refactor): sáu test fail chỉ vì module chưa có. Hai test chuyển từ `select-rows.test.tsx`, và test `keeps the Select warnings unchanged for owner "Select"` chép ba câu cảnh báo cũ: chúng đặc tả hành vi đã có.
    - Task 2: `renders the same DOM as before when the control never reports` là test đặc tả.
    - Task 3: cả file test fail vì `./Combobox` chưa có; không test nào được thấy fail vì lý do riêng. Khi có code, 79 trong 81 test pass ngay; hai test sai được sửa trong test. Assertion role của dòng trạng thái được thêm sau khi axe fail ở story `Empty`.
    - Task 4: 23 trong 30 test mới fail trên commit cha, cộng hai test của bản sửa Firefox; bảy test là đặc tả. `use-announce.test.tsx` pass ngay ở bản nháp, vì module được chuyển nguyên.
    - Task 5: cả file test fail vì `./TagInput` chưa có. Khi có code, bốn test fail vì chính test sai, và được sửa trong test.
    - Task 6: 23 test mới fail trên commit cha; các test còn lại là đặc tả.
    - Task 7 không có test mới: test có sẵn `passes with only the known exceptions of spec §4.9` fail khi ba cặp mới được đo (Step 2 áp riêng phần đó để thấy).
    - Trên cây của plan, test patch của Task 1, 3, 5 (và `use-announce.test.tsx` của Task 4) fail vì module chưa tồn tại (`Failed to resolve import …`); các dòng "Expected" bên dưới ghi lỗi quan sát được ở bản nháp.
16. **Ảnh chuẩn của component cũ không đổi.** Task 1 chỉ đổi đường import và đối số `readRows` của Select (story Select 84 test PASS). Task 2 không đổi DOM của Field khi không control nào báo lỗi (test đặc tả ở mục 15). Task 3, 5 và 7 chỉ thêm selector mới (`.flg-combobox-check`, `.flg-tag`) vào `preferences.css`. Bản nháp không chạy so sánh pixel (ảnh chuẩn cần Docker); CI visual xác nhận.

**Phạm vi:**
- **Không làm ở plan này:**
  - Changeset: Plan D tạo `0.3.0`; Plan B không có changeset.
  - Calendar, DatePicker (Plan C) và FileUpload (Plan D).
  - Các mục để lại ở phát hiện 14.
  - Kiểm tra Safari/VoiceOver và NVDA còn nợ.
- **Ảnh chuẩn visual:**
  - Story có ảnh: `Look`, `Open` và `Empty` của Combobox; `Look` của TagInput (Task 6 thêm vào đó một trường có thẻ bị từ chối). Các story còn lại gắn `no-visual`.
  - Không tạo ảnh trên Windows. Ảnh chuẩn của hai component chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh. Component cũ không đổi, nên ảnh cũ phải giữ nguyên từng byte.

## Global Constraints

- Tên package `fl-glass-ui`; chỉ ESM; `exports` gồm `.` và `./styles.css`; `"sideEffects": ["**/*.css"]`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`). Plan này không thêm dependency.
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Biến thể và trạng thái dùng data-attribute (`data-size`, `data-invalid`, `data-highlighted`, `data-pending`...).
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS component nằm trong `@layer flg.components`; quy tắc `forced-colors` và `prefers-contrast: more` nằm trong `src/styles/preferences.css`.
- **Mockup lock.** Giá trị token trong `src/styles/theme/values.ts` không đổi, và Plan B không thêm token. Component cũ (Select, Field, Input, Badge, menu) phải giữ ảnh giống từng byte. Quy tắc `opacity: 1` của nút xoá dưới `prefers-contrast: more` nằm ngoài mockup và chỉ có hiệu lực khi người dùng bật tuỳ chọn (spec §4.4).
- Mọi component dùng `forwardRef`, export kiểu props của nó, và export phẳng.
- Chữ mặc định do lib cung cấp bằng tiếng Anh, ghi đè được qua `labels`. Cảnh báo dev đi qua `devWarn`. Lib không throw khi người dùng dùng sai. Trang docs (`*.mdx`) viết bằng tiếng Anh.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm, **không** push lên `main`, giữ `"private": true`.
- **Không có changeset ở plan này.** Plan D tạo changeset `0.3.0`.
- **Ngưỡng `size-limit`:**
  - Ngưỡng ban đầu (do Plan A ghi): JS 35860 B, CSS 7929 B.
  - Task 1 đến 4 chạy `pnpm build && pnpm check:package` và pass hoàn toàn. Theo lần chạy nháp: sau Task 3 JS 34.71 kB, CSS 7.39 kB; sau Task 4 JS 35.19 kB.
  - Từ Task 5, `pnpm check:package` chỉ fail ở `size`, và chỉ ở JS; các check còn lại pass. Theo lần chạy nháp: sau Task 5 JS 36.45 kB (vượt 593 B), sau Task 6 JS 36.9 kB (vượt 1.04 kB), CSS 7.56 kB trong ngưỡng.
  - Chỉ Task 7 chạy `pnpm size:record` và commit `.size-limit.json`. Plan không chép file này: `size:record` tự ghi ngưỡng. Kết quả ở bản nháp: JS 40586 B, CSS 8309 B.
- Trước mọi lệnh `pnpm vitest run --project storybook-*` chạy thẳng, chạy `pnpm gen:theme`. Lần chạy story đầu có thể fail với `Failed to import test file …` khi Vite tối ưu lại; chạy lại.
- **Không chạy cả bộ story một lượt trên máy thiếu bộ nhớ.** Chạy từng thư mục một, như các lệnh trong plan. CI chạy cả bộ.
- Không chạy hai lượt story cùng lúc. Story `Paste` của TagInput dùng clipboard thật, và WebKit dưới Playwright dùng clipboard chung của hệ thống (phát hiện 6). Story tự thử lại tối đa 3 lần, nhưng không nên dựa vào đó.
- **Cổng 5173 và 4173 thuộc các app khác của chủ dự án**: không dùng, không tắt tiến trình đang giữ chúng. Fixture chạy qua một bản sao tạm của `scripts/test-fixtures.mjs` ở cổng 5174/4175, như Step 4 của Task 7 ghi; xoá bản sao sau khi chạy. Storybook chạy tạm (nếu cần) dùng cổng khác. Không để server hay tiến trình Storybook chạy sót.
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows. Ảnh chuẩn của Combobox và TagInput đến từ workflow "Update visual baselines" sau khi đẩy nhánh.
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.

**Cách áp patch.**
- Mọi file, kể cả file mới và file bị xoá, được đưa dưới dạng patch (`git diff`). Lưu nguyên khối patch vào một file **ngoài** repo (ví dụ `../task.patch`), giữ LF, rồi chạy `git apply ../task.patch` ở gốc repo.
- Nếu `git apply` báo lỗi thì dừng lại và báo cáo: nghĩa là cây đang khác với cây mà plan đã chạy thử.
- Task 1 đến 6 mỗi task có hai khối patch (test rồi code). Áp theo đúng thứ tự trong plan. Task 7 chỉ có khối code, và nó được áp làm hai lần (`--include`, rồi `--exclude`), như Step 2 và Step 3 của Task 7 ghi.
- Task 4 và 6 sửa file mà task trước đã tạo (`Combobox.tsx`, `TagInput.tsx`, các file test, story và MDX). Task 5 và 6 sửa spec mà Task 3 đã sửa; Task 5 và 7 sửa `preferences.css` sau Task 3. Patch đã tính sẵn điều đó nếu áp đúng thứ tự.
- Task 1 xoá `src/components/select/select-rows.ts` và `select-rows.test.tsx`. Lệnh `git add` ở Step 5 ghi cả việc xoá.

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý. Mỗi dòng có test ở task tương ứng:

1. **Gõ tiếng Việt không dấu vào Combobox.** "ha noi" phải tìm thấy "Hà Nội", "da nang" phải tìm thấy "Đà Nẵng" (NFD không tách `đ` ra), và phần in đậm phải rơi đúng chữ gốc có dấu. Test ở Task 3: `match.test.ts`, `finds Vietnamese text with a folded query` và `covers combining marks that follow the last matched character`; `Combobox.test.tsx`, `matches without case and without diacritics, so "ha noi" finds Hà Nội`, `matches đ as d, so "da nang" finds Đà Nẵng` và `wraps the first match of the default filter, by original characters`; story `Open`. Ở Task 4, rời ô với `allowCustomValue` đổi "ha noi" thành giá trị `hn` của item: `leaving maps text that folds to an item to its value, and shows the item text`.
2. **Enter trên Combobox đang đóng, có chữ tự do, trong Firefox.** Form phải gửi đúng chữ vừa gõ, không phải giá trị cũ. Test ở Task 4: `writes the hidden select on Enter itself, for the submit that follows the keydown`, `writes the item value on Enter when the text folds to an item` và `Enter on a closed listbox commits the text and leaves the event to the form`; story `CustomValueSubmit` (ba engine, đọc `FormData` trong listener `submit`). Không có `allowCustomValue` thì Enter trên listbox đóng để form gửi giá trị đang chọn: Task 3, `leaves Enter on a closed listbox to the browser, so the form submits`, story `InAForm`.
3. **Dán một danh sách nhiều dòng vào TagInput.** Mỗi dòng và mỗi phần giữa các dấu phẩy thành một thẻ; chữ đang gõ quanh con trỏ được nối vào trước khi tách. Test ở Task 5: `split-tags.test.ts`, `line breaks split only when "Enter" is a separator`; `TagInput.test.tsx`, `splits what is pasted at the separators and at line breaks`, `joins the pasted text to the text around the caret before it splits` và `does not split at a line break when "Enter" is not a separator`; story `Paste` (copy và paste thật). Ở Task 6, các phần bị từ chối ở lại trong ô: `adds the accepted parts of a paste and leaves the rejected ones joined by a separator`, `joins the rejected parts of a paste with a space when every separator is "Enter"` và `counts the parts of a paste that were just accepted, as duplicates and toward maxTags`.
4. **Thẻ bị từ chối trong một Field cũng có prop `error`.** Field chỉ hiện `error` của nó (một `.flg-field-error`); lời của TagInput hiện lại khi `error` mất. Test ở Task 6: nhóm `in a Field`, `shows the error of the Field instead, and the message returns when it goes` và `reports the message to the Field, which shows it and is invalid`. Ở Task 2: `lets the error prop of the Field win over the control message`. TagInput vẫn `invalid` và `setCustomValidity` vẫn chặn submit (phát hiện 12): `is invalid while rejected, with a validity message that blocks a submit` và story `Rejection` kiểm việc chặn submit, nhưng chỉ khi Field không có `error`.
5. **Combobox trong Dialog, nhấn Esc.** Esc đầu tiên chỉ đóng listbox. Esc trên listbox đã đóng mà không còn gì để trả lại thì để Dialog đóng. Test ở Task 3: `does not block Esc on an open listbox: the browser closes it`, `puts the text of the chosen item back on Esc when the listbox is closed` và `leaves Esc alone when there is nothing to put back, so a Dialog closes`; story `InADialog` (Esc đóng listbox, Esc thứ hai đóng Dialog). Ở Task 4: `Esc on a closed listbox with text clears the text and the value, and prevents the default`. TagInput giữ Esc của nó khỏi Dialog bao ngoài: Task 5, `goes back to the input with Esc, and keeps the Esc from a Dialog around it`.

Một chỗ **không có test**: nút submit chạy khỏi cú bấm khi thẻ được thêm lúc rời ô làm hàng chip xuống dòng (phát hiện 7). Story dùng form rộng 420px để tránh nó, và docs chưa nói. PR nêu để chủ dự án xem.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/internal/list-rows.ts` (và test), `src/components/select/Select.tsx`, `Chips.tsx`; xoá `select-rows.ts` (và test) | Bộ đọc hàng dùng chung (Task 1) |
| `src/internal/field-context.tsx` (và test), `src/components/field/Field.tsx` (và test) | Kênh lỗi của control (Task 2) |
| `src/components/combobox/*` (gồm `match.ts`), `src/styles/components/combobox.css` | `Combobox` (Task 3); giá trị tự do, `loading`, thông báo (Task 4) |
| `src/internal/use-announce.ts` (và test) | Vùng live (Task 4) |
| `src/components/tag-input/*` (gồm `split-tags.ts`), `src/styles/components/tag-input.css`, `src/components/field/Field.mdx` | `TagInput` (Task 5); từ chối thẻ (Task 6) |
| `src/styles/preferences.css`, `src/styles/index.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts` | Đăng ký, export, forced colors, contrast-more (Task 3, 5, 7) |
| `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md` | Các dòng "phát hiện khi lập Plan B" (Task 3, 5, 6) |
| `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, spec 0+1 §4.9 | Cặp tương phản, dòng 6 mở rộng (Task 7) |
| `.size-limit.json` | Ngưỡng mới (Task 7) |

---

### Task 1: `list-rows.ts`, bộ đọc hàng dùng chung của Select và Combobox

Spec §2 ("Thay đổi ở code cũ", dòng Plan B), §5 (dòng `list-rows.ts`), §7 dòng 1. Combobox đọc item, nhóm và đường phân cách từ `children` đúng như Select. Task này chuyển `src/components/select/select-rows.ts` thành `src/internal/list-rows.ts`, phục vụ mọi listbox:
- `readRows` nhận thêm `parts`: ba tên phần đưa cho `markPart` và tên component dùng trong cảnh báo dev.
- Ba cảnh báo dev dựng từ tên component. Với `owner: 'Select'` chúng giống từng byte câu cũ; chữ "a XItem" giữ nguyên, không thêm luật a/an.
- Cảnh báo về con không đọc được vẫn in lúc gom con, trước cảnh báo về item, đúng thứ tự cũ.
- Không đổi hành vi: Select chỉ đổi đường import và đối số của `readRows` (một hằng `SELECT_PARTS` ở mức module), nên DOM, CSS và ảnh chuẩn của Select giữ nguyên.
- File không có `"use client"`, như file cũ. Nó do `kilo/reflection/beam-free` viết qua opencode; Claude dọn lại (doc comment, hàm dựng câu cảnh báo cho dòng dưới 100 cột, thứ tự import).

**Files:**
- Create: `src/internal/list-rows.ts`, `src/internal/list-rows.test.tsx`
- Modify: `src/components/select/Select.tsx`, `src/components/select/Chips.tsx`
- Delete: `src/components/select/select-rows.ts`, `src/components/select/select-rows.test.tsx`

**Interfaces:**
- Produces trong `src/internal/list-rows.ts`:
  - `readRows(children, parts)` trả `{ rows: Row[]; options: Option[] }`.
  - `ListParts`: `{ item: string; group: string; separator: string; owner: string }`. Select dùng `'select-item'`, `'select-group'`, `'select-separator'`, owner `'Select'`; Task 3 dùng `'combobox-item'`, `'combobox-group'`, `'combobox-separator'`, owner `'Combobox'`.
  - `ListItemProps`: `{ value: string; textValue?: string; disabled?: boolean; children?: ReactNode }`, thay cho `SelectItemProps` trong bộ đọc.
  - `Option`, `Row`, `textOf(node)`: giữ nguyên như ở `select-rows.ts`.
  - Câu cảnh báo cho owner `X`: `<X> reads only XItem, XGroup and XSeparator, …`, `<XItem> needs a value that is not empty: …`, `<XItem> needs a value that is a string. …`.
- Consumes: `collectChildren`, `markPart` (`src/internal/collect-children`), `devWarn`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/select/select-rows.test.tsx b/src/components/select/select-rows.test.tsx
deleted file mode 100644
index 92ec975..0000000
--- a/src/components/select/select-rows.test.tsx
+++ /dev/null
@@ -1,71 +0,0 @@
-import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
-import { resetDevWarnings } from '../../internal/warn';
-import { SelectGroup, SelectItem, SelectSeparator } from './Select';
-import { readRows, textOf } from './select-rows';
-
-describe('textOf', () => {
-  it('joins the text of nested elements and collapses whitespace', () => {
-    expect(
-      textOf(
-        <>
-          New <b>York</b>
-          {'  '}
-          {2026}
-        </>,
-      ),
-    ).toBe('New York 2026');
-  });
-});
-
-describe('readRows', () => {
-  beforeEach(() => resetDevWarnings());
-  afterEach(() => vi.restoreAllMocks());
-
-  it('numbers the options in list order through groups, and keys rows by position', () => {
-    const { rows, options } = readRows(
-      <>
-        <SelectItem value="a">A</SelectItem>
-        <SelectGroup label="More">
-          <SelectItem value="b" disabled>
-            B
-          </SelectItem>
-          <SelectSeparator />
-          <SelectItem value="c" textValue="Sea">
-            C
-          </SelectItem>
-        </SelectGroup>
-      </>,
-    );
-    expect(
-      options.map(({ index, value, disabled, text }) => [index, value, disabled, text]),
-    ).toEqual([
-      [0, 'a', false, 'A'],
-      [1, 'b', true, 'B'],
-      [2, 'c', false, 'Sea'],
-    ]);
-    expect(rows.map((row) => row.kind)).toEqual(['option', 'group']);
-    const group = rows[1];
-    expect(group?.kind === 'group' && group.key).toBe('1');
-    expect(group?.kind === 'group' && group.rows.map((row) => row.kind)).toEqual([
-      'option',
-      'separator',
-      'option',
-    ]);
-    expect(
-      group?.kind === 'group' && group.rows[1]?.kind === 'separator' && group.rows[1].key,
-    ).toBe('1.1');
-  });
-
-  it('skips an item with an empty value, and anything that is not a part, with a warning', () => {
-    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
-    const { options } = readRows(
-      <>
-        <SelectItem value="">Empty</SelectItem>
-        <span>Not a part</span>
-        <SelectItem value="kept">Kept</SelectItem>
-      </>,
-    );
-    expect(options.map((option) => option.value)).toEqual(['kept']);
-    expect(warn).toHaveBeenCalledTimes(2);
-  });
-});
diff --git a/src/internal/list-rows.test.tsx b/src/internal/list-rows.test.tsx
new file mode 100644
index 0000000..7ad5773
--- /dev/null
+++ b/src/internal/list-rows.test.tsx
@@ -0,0 +1,153 @@
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import type { ReactNode } from 'react';
+import { markPart } from './collect-children';
+import { resetDevWarnings } from './warn';
+import { readRows, textOf } from './list-rows';
+import type { ListItemProps } from './list-rows';
+
+const ThingItem = markPart(function ThingItem(props: ListItemProps): null {
+  void props;
+  return null;
+}, 'thing-item');
+
+const ThingGroup = markPart(function ThingGroup(props: {
+  label: ReactNode;
+  children?: ReactNode;
+}): null {
+  void props;
+  return null;
+}, 'thing-group');
+
+const ThingSeparator = markPart(function ThingSeparator(): null {
+  return null;
+}, 'thing-separator');
+
+const OtherItem = markPart(function OtherItem(props: ListItemProps): null {
+  void props;
+  return null;
+}, 'select-item');
+
+const THING_PARTS = {
+  item: 'thing-item',
+  group: 'thing-group',
+  separator: 'thing-separator',
+  owner: 'Thing',
+} as const;
+
+describe('textOf', () => {
+  it('joins the text of nested elements and collapses whitespace', () => {
+    expect(
+      textOf(
+        <>
+          New <b>York</b>
+          {'  '}
+          {2026}
+        </>,
+      ),
+    ).toBe('New York 2026');
+  });
+});
+
+describe('readRows', () => {
+  beforeEach(() => resetDevWarnings());
+  afterEach(() => vi.restoreAllMocks());
+
+  it('numbers the options in list order through groups, and keys rows by position', () => {
+    const { rows, options } = readRows(
+      <>
+        <ThingItem value="a">A</ThingItem>
+        <ThingGroup label="More">
+          <ThingItem value="b" disabled>
+            B
+          </ThingItem>
+          <ThingSeparator />
+          <ThingItem value="c" textValue="Sea">
+            C
+          </ThingItem>
+        </ThingGroup>
+      </>,
+      THING_PARTS,
+    );
+    expect(
+      options.map(({ index, value, disabled, text }) => [index, value, disabled, text]),
+    ).toEqual([
+      [0, 'a', false, 'A'],
+      [1, 'b', true, 'B'],
+      [2, 'c', false, 'Sea'],
+    ]);
+    expect(rows.map((row) => row.kind)).toEqual(['option', 'group']);
+    const group = rows[1];
+    expect(group?.kind === 'group' && group.key).toBe('1');
+    expect(group?.kind === 'group' && group.rows.map((row) => row.kind)).toEqual([
+      'option',
+      'separator',
+      'option',
+    ]);
+    expect(
+      group?.kind === 'group' && group.rows[1]?.kind === 'separator' && group.rows[1].key,
+    ).toBe('1.1');
+  });
+
+  it('skips an item with an empty value, and anything that is not a part, with a warning', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    const { options } = readRows(
+      <>
+        <ThingItem value="">Empty</ThingItem>
+        <span>Not a part</span>
+        <ThingItem value="kept">Kept</ThingItem>
+      </>,
+      THING_PARTS,
+    );
+    expect(options.map((option) => option.value)).toEqual(['kept']);
+    expect(warn).toHaveBeenCalledTimes(2);
+    expect(warn.mock.calls[0]?.[0]).toBe(
+      '[fl-glass-ui] <Thing> reads only ThingItem, ThingGroup and ThingSeparator, directly or inside Fragments, arrays and ThingGroup. It skips anything else, including a component of your own that wraps a ThingItem.',
+    );
+    expect(warn.mock.calls[1]?.[0]).toBe(
+      '[fl-glass-ui] <ThingItem> needs a value that is not empty: the empty value is how the native select says nothing is chosen. The item is skipped.',
+    );
+  });
+
+  it('skips an item whose value is not a string, with a warning', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    const { options } = readRows(
+      <>
+        <ThingItem value={123 as unknown as string}>Bad</ThingItem>
+        <ThingItem value="kept">Kept</ThingItem>
+      </>,
+      THING_PARTS,
+    );
+    expect(options.map((option) => option.value)).toEqual(['kept']);
+    expect(warn).toHaveBeenCalledTimes(1);
+    expect(warn.mock.calls[0]?.[0]).toBe(
+      '[fl-glass-ui] <ThingItem> needs a value that is a string. The item is skipped.',
+    );
+  });
+
+  it('keeps the Select warnings unchanged for owner "Select"', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    readRows(
+      <>
+        <ThingItem value="">Empty</ThingItem>
+        <ThingItem value={123 as unknown as string}>Bad</ThingItem>
+        <span>Not a part</span>
+      </>,
+      { ...THING_PARTS, owner: 'Select' },
+    );
+    expect(warn.mock.calls.map((call) => call[0])).toEqual([
+      '[fl-glass-ui] <Select> reads only SelectItem, SelectGroup and SelectSeparator, directly or inside Fragments, arrays and SelectGroup. It skips anything else, including a component of your own that wraps a SelectItem.',
+      '[fl-glass-ui] <SelectItem> needs a value that is not empty: the empty value is how the native select says nothing is chosen. The item is skipped.',
+      '[fl-glass-ui] <SelectItem> needs a value that is a string. The item is skipped.',
+    ]);
+  });
+
+  it('treats parts of another owner as unknown', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    const { options } = readRows(<OtherItem value="x">X</OtherItem>, THING_PARTS);
+    expect(options).toEqual([]);
+    expect(warn).toHaveBeenCalledTimes(1);
+    expect(warn.mock.calls[0]?.[0]).toBe(
+      '[fl-glass-ui] <Thing> reads only ThingItem, ThingGroup and ThingSeparator, directly or inside Fragments, arrays and ThingGroup. It skips anything else, including a component of your own that wraps a ThingItem.',
+    );
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/internal/list-rows.test.tsx
```

Expected: FAIL cả file, nên sáu test không chạy được: `Failed to resolve import "./list-rows" from "src/internal/list-rows.test.tsx". Does the file exist?`. Đây là refactor: `joins the text of nested elements and collapses whitespace` và `numbers the options in list order through groups, and keys rows by position` chuyển từ `select-rows.test.tsx` (giữ assertion, đổi sang các phần `Thing` tự tạo trong file test); `keeps the Select warnings unchanged for owner "Select"` chép ba câu cảnh báo cũ của Select. Chúng đặc tả hành vi đã có.

- [ ] **Step 3: Viết code**

```diff
diff --git a/src/components/select/Chips.tsx b/src/components/select/Chips.tsx
index 8a4aef3..1f49853 100644
--- a/src/components/select/Chips.tsx
+++ b/src/components/select/Chips.tsx
@@ -1,7 +1,7 @@
 import { useRef, useState } from 'react';
 import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
 import { Badge } from '../badge/Badge';
-import type { Option } from './select-rows';
+import type { Option } from '../../internal/list-rows';
 
 /** Gap between chips, in px; matches `.flg-select-chips`. */
 const CHIP_GAP = 4;
diff --git a/src/components/select/Select.tsx b/src/components/select/Select.tsx
index 6bd4e92..e83555a 100644
--- a/src/components/select/Select.tsx
+++ b/src/components/select/Select.tsx
@@ -14,6 +14,8 @@ import { markPart } from '../../internal/collect-children';
 import { dataAttr } from '../../internal/data-attr';
 import { markAsFieldControl, useFieldContext, useFieldProps } from '../../internal/field-context';
 import { BoxCheckIcon, CheckIcon, ChevronIcon } from '../../internal/icons';
+import { readRows } from '../../internal/list-rows';
+import type { ListParts, Option, Row } from '../../internal/list-rows';
 import { mergeRefs } from '../../internal/merge-refs';
 import { getNextIndex } from '../../internal/roving';
 import { useControllableState } from '../../internal/use-controllable-state';
@@ -26,8 +28,13 @@ import { usePopoverState, useTriggerPress } from '../../internal/use-popover-tri
 import { useTypeahead } from '../../internal/use-typeahead';
 import { devWarn, isProduction } from '../../internal/warn';
 import { Chips } from './Chips';
-import { readRows } from './select-rows';
-import type { Option, Row } from './select-rows';
+
+const SELECT_PARTS: ListParts = {
+  item: 'select-item',
+  group: 'select-group',
+  separator: 'select-separator',
+  owner: 'Select',
+};
 
 interface SelectBaseProps {
   /** The name the value is submitted under, through a hidden native `<select>`. */
@@ -133,7 +140,7 @@ export const Select = markAsFieldControl(
 
     // --- Items, read from children without rendering them; again only when the children change, not
     // on every move of the highlight.
-    const { rows, options } = useMemo(() => readRows(children), [children]);
+    const { rows, options } = useMemo(() => readRows(children, SELECT_PARTS), [children]);
 
     // --- Value.
     const defaultValue = multiple
diff --git a/src/components/select/select-rows.ts b/src/components/select/select-rows.ts
deleted file mode 100644
index 61e4f93..0000000
--- a/src/components/select/select-rows.ts
+++ /dev/null
@@ -1,93 +0,0 @@
-import { Children, isValidElement } from 'react';
-import type { ReactNode } from 'react';
-import { collectChildren } from '../../internal/collect-children';
-import type { CollectedPart } from '../../internal/collect-children';
-import { devWarn } from '../../internal/warn';
-import type { SelectItemProps } from './Select';
-
-const PARTS = ['select-item', 'select-group', 'select-separator'] as const;
-
-const UNKNOWN_CHILD =
-  '<Select> reads only SelectItem, SelectGroup and SelectSeparator, directly or inside Fragments, ' +
-  'arrays and SelectGroup. It skips anything else, including a component of your own that wraps ' +
-  'a SelectItem.';
-const EMPTY_VALUE =
-  '<SelectItem> needs a value that is not empty: the empty value is how the native select says ' +
-  'nothing is chosen. The item is skipped.';
-const NOT_A_STRING = '<SelectItem> needs a value that is a string. The item is skipped.';
-
-/** One option of the Select, in the order the listbox shows it. */
-export interface Option {
-  index: number;
-  value: string;
-  disabled: boolean;
-  /** For typeahead, the native `<option>` and a chip. */
-  text: string;
-  children: ReactNode;
-}
-
-export type Row =
-  | { kind: 'option'; option: Option }
-  | { kind: 'group'; key: string; label: ReactNode; rows: Row[] }
-  | { kind: 'separator'; key: string };
-
-/** The text inside `node`, as a screen reader would read it. */
-export function textOf(node: ReactNode): string {
-  let text = '';
-  Children.forEach(node, (child) => {
-    if (typeof child === 'string' || typeof child === 'number') text += String(child);
-    else if (isValidElement<{ children?: ReactNode }>(child)) text += textOf(child.props.children);
-  });
-  return text.replace(/\s+/g, ' ').trim();
-}
-
-function toRows(parts: CollectedPart[], options: Option[], path: string): Row[] {
-  const rows: Row[] = [];
-  parts.forEach((part, position) => {
-    const key = `${path}${position}`;
-    if (part.part === 'select-group') {
-      rows.push({
-        kind: 'group',
-        key,
-        label: part.props.label as ReactNode,
-        rows: toRows(part.parts ?? [], options, `${key}.`),
-      });
-    } else if (part.part === 'select-separator') {
-      rows.push({ kind: 'separator', key });
-    } else {
-      const props = part.props as unknown as SelectItemProps;
-      if (typeof props.value !== 'string' || props.value === '') {
-        devWarn(typeof props.value === 'string' ? EMPTY_VALUE : NOT_A_STRING);
-        return;
-      }
-      const option: Option = {
-        index: options.length,
-        value: props.value,
-        disabled: props.disabled === true,
-        text: props.textValue ?? textOf(props.children),
-        children: props.children,
-      };
-      options.push(option);
-      rows.push({ kind: 'option', option });
-    }
-  });
-  return rows;
-}
-
-/**
- * The Select's rows (options, groups, separators) and its options in list order, read from
- * `children` without rendering them. Rows are keyed by position, never by the caller's keys.
- */
-export function readRows(children: ReactNode): { rows: Row[]; options: Option[] } {
-  const options: Option[] = [];
-  const rows = toRows(
-    collectChildren(children, {
-      parts: PARTS,
-      groups: ['select-group'],
-      onUnknown: () => devWarn(UNKNOWN_CHILD),
-    }),
-    options,
-    '',
-  );
-  return { rows, options };
-}
diff --git a/src/internal/list-rows.ts b/src/internal/list-rows.ts
new file mode 100644
index 0000000..9c0db3f
--- /dev/null
+++ b/src/internal/list-rows.ts
@@ -0,0 +1,123 @@
+import { Children, isValidElement } from 'react';
+import type { ReactNode } from 'react';
+import { collectChildren } from './collect-children';
+import type { CollectedPart } from './collect-children';
+import { devWarn } from './warn';
+
+const unknownChild = (owner: string) =>
+  `<${owner}> reads only ${owner}Item, ${owner}Group and ${owner}Separator, directly or inside ` +
+  `Fragments, arrays and ${owner}Group. It skips anything else, including a component of your ` +
+  `own that wraps a ${owner}Item.`;
+const emptyValue = (owner: string) =>
+  `<${owner}Item> needs a value that is not empty: the empty value is how the native select says ` +
+  'nothing is chosen. The item is skipped.';
+const notAString = (owner: string) =>
+  `<${owner}Item> needs a value that is a string. The item is skipped.`;
+
+/** The props `readRows` reads from an item part, such as `SelectItem`. */
+export interface ListItemProps {
+  value: string;
+  textValue?: string;
+  disabled?: boolean;
+  children?: ReactNode;
+}
+
+/**
+ * Which parts a listbox reads: the part names given to `markPart` for its item, group and
+ * separator, and the component name the dev warnings use.
+ */
+export interface ListParts {
+  item: string;
+  group: string;
+  separator: string;
+  owner: string;
+}
+
+/** One option of a listbox, in the order the listbox shows it. */
+export interface Option {
+  index: number;
+  value: string;
+  disabled: boolean;
+  /** For typeahead, the native `<option>` and a chip. */
+  text: string;
+  children: ReactNode;
+}
+
+export type Row =
+  | { kind: 'option'; option: Option }
+  | { kind: 'group'; key: string; label: ReactNode; rows: Row[] }
+  | { kind: 'separator'; key: string };
+
+/** The text inside `node`, as a screen reader would read it. */
+export function textOf(node: ReactNode): string {
+  let text = '';
+  Children.forEach(node, (child) => {
+    if (typeof child === 'string' || typeof child === 'number') text += String(child);
+    else if (isValidElement<{ children?: ReactNode }>(child)) text += textOf(child.props.children);
+  });
+  return text.replace(/\s+/g, ' ').trim();
+}
+
+function toRows(
+  parts: ListParts,
+  collected: CollectedPart[],
+  options: Option[],
+  path: string,
+): Row[] {
+  const rows: Row[] = [];
+  collected.forEach((part, position) => {
+    const key = `${path}${position}`;
+    if (part.part === parts.group) {
+      rows.push({
+        kind: 'group',
+        key,
+        label: part.props.label as ReactNode,
+        rows: toRows(parts, part.parts ?? [], options, `${key}.`),
+      });
+    } else if (part.part === parts.separator) {
+      rows.push({ kind: 'separator', key });
+    } else {
+      const props = part.props as unknown as ListItemProps;
+      if (typeof props.value !== 'string' || props.value === '') {
+        devWarn(
+          typeof props.value === 'string' ? emptyValue(parts.owner) : notAString(parts.owner),
+        );
+        return;
+      }
+      const option: Option = {
+        index: options.length,
+        value: props.value,
+        disabled: props.disabled === true,
+        text: props.textValue ?? textOf(props.children),
+        children: props.children,
+      };
+      options.push(option);
+      rows.push({ kind: 'option', option });
+    }
+  });
+  return rows;
+}
+
+/**
+ * The rows (options, groups, separators) and the options in list order, read from `children`
+ * without rendering them. Rows are keyed by position, never by the caller's keys. `item`, `group`
+ * and `separator` are the part names given to `markPart`; `owner` is the component name used in
+ * the dev warnings.
+ */
+export function readRows(
+  children: ReactNode,
+  parts: ListParts,
+): { rows: Row[]; options: Option[] } {
+  const options: Option[] = [];
+  const rows = toRows(
+    parts,
+    collectChildren(children, {
+      parts: [parts.item, parts.group, parts.separator],
+      groups: [parts.group],
+      onUnknown: () => devWarn(unknownChild(parts.owner)),
+    }),
+    options,
+    '',
+  );
+  return { rows, options };
+}
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/internal/list-rows.test.tsx src/components/select
pnpm vitest run --project storybook-light --project storybook-dark src/components/select
pnpm build && pnpm check:package
```

Expected: 5 file, 69 test đơn vị PASS; story Select 84 test PASS; `check:package` PASS, gồm `check:use-client` (102 module, 27 client), `check:dist-css` và `size`. Select chỉ đổi đường import và đối số của `readRows`, nên DOM và CSS không đổi và ảnh chuẩn giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  src/components/select/Chips.tsx \
  src/components/select/Select.tsx \
  src/components/select/select-rows.test.tsx \
  src/components/select/select-rows.ts \
  src/internal/list-rows.test.tsx \
  src/internal/list-rows.ts
```
```bash
git commit -m "refactor: move the Select's row reader to internal/list-rows" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 2: Kênh lỗi của control lên `Field` (`useControlError`)

Spec §2 ("Thay đổi ở code cũ"), §3.2 (**Lỗi do control tự báo**), §5 (dòng `field-context.tsx (mở rộng)`), §7 dòng 1. TagInput (thẻ bị từ chối, Task 6) và DatePicker (ngày không đọc được, Plan C) có lời báo lỗi riêng, mà `Field` chỉ hiện được prop `error`.
- Trong Field, `useControlError(message)` báo lời lên Field trong một effect (về `null` khi unmount) và trả `null`. Field giữ lời đó trong state, hiện nó ở chỗ lỗi (`<p class="flg-field-error">`, cùng id) và thành `invalid` (`data-invalid`, `invalid` và `errorId` của context). Control nhận id lỗi và `invalid` qua `useFieldProps` như mọi lỗi của Field.
- Ngoài Field, hook trả `{ id, message }` khi có lời, để control tự render `<p id={id} className="flg-field-error">` và nối `id` vào `aria-describedby`; không có lời thì trả `null`.
- `error` của Field thắng: khi có nó (`Boolean(error)`, như trước), lời của control không hiện.
- Không control nào báo và không có `error` thì DOM của Field như cũ. Test đặc tả so `innerHTML` với chuỗi lấy từ commit cha; id của `useId` được đổi thành `ID`, vì dạng của nó khác giữa React 18 và 19.
- RadioGroup và SegmentedControl không đổi: item của chúng nhận context `null`. Fixture `FIELD` của test có thêm `setControlError`.

**Files:**
- Modify: `src/internal/field-context.tsx`, `src/internal/field-context.test.tsx`, `src/components/field/Field.tsx`, `src/components/field/Field.test.tsx`

**Interfaces:**
- Produces:
  - `FieldContextValue.setControlError: (message: string | null) => void`: setter state của Field, ổn định giữa các lần render.
  - `useControlError(message: string | null): { id: string; message: string } | null`, export từ `src/internal/field-context.tsx`.
  - Task 6 (`TagInput`) dùng; Plan C (`DatePicker`) sẽ dùng.
- Consumes: `useFieldContext`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/field/Field.test.tsx b/src/components/field/Field.test.tsx
index 5cb1292..957fcfb 100644
--- a/src/components/field/Field.test.tsx
+++ b/src/components/field/Field.test.tsx
@@ -1,11 +1,12 @@
-import { render, screen } from '@testing-library/react';
-import { createRef, forwardRef } from 'react';
+import { act, render, screen } from '@testing-library/react';
+import { createRef, forwardRef, useState } from 'react';
 import type { ReactNode } from 'react';
 import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
 import { resetDevWarnings } from '../../internal/warn';
 import {
   markAsFieldControl,
   markAsFieldGroup,
+  useControlError,
   useFieldContext,
   useFieldProps,
 } from '../../internal/field-context';
@@ -17,6 +18,15 @@ const TextControl = markAsFieldControl(function TextControl(props: FieldControlP
   const { invalid, ...inputProps } = useFieldProps(props);
   return <input data-invalid={invalid ? '' : undefined} {...inputProps} />;
 });
+// A control that reports its own error, such as a rejected tag.
+const ReportingControl = markAsFieldControl(function ReportingControl(
+  props: FieldControlProps & { message: string | null },
+) {
+  const { message, ...rest } = props;
+  const { invalid, ...inputProps } = useFieldProps(rest);
+  useControlError(message);
+  return <input data-invalid={invalid ? '' : undefined} {...inputProps} />;
+});
 const GroupControl = markAsFieldGroup(
   forwardRef<HTMLDivElement, { children?: ReactNode }>(function GroupControl({ children }, ref) {
     const field = useFieldContext();
@@ -269,4 +279,83 @@ describe('Field', () => {
       expect(container.querySelector('label')).toBeNull();
     });
   });
+
+  describe('control error', () => {
+    it('shows the message the control reports and becomes invalid', () => {
+      const { container } = render(
+        <Field label="Tags">
+          <ReportingControl message="Not a valid tag" />
+        </Field>,
+      );
+      const input = screen.getByRole('textbox');
+      const error = container.querySelector('.flg-field-error') as HTMLElement;
+      expect(error).toHaveTextContent('Not a valid tag');
+      expect(container.firstElementChild).toHaveAttribute('data-invalid');
+      expect(input).toHaveAttribute('aria-invalid', 'true');
+      expect(input).toHaveAccessibleDescription('Not a valid tag');
+      expect(input.getAttribute('aria-describedby')).toBe(error.id);
+    });
+
+    it('lets the error prop of the Field win over the control message', () => {
+      const { container } = render(
+        <Field error="Required">
+          <ReportingControl message="Not a valid tag" />
+        </Field>,
+      );
+      const errors = container.querySelectorAll('.flg-field-error');
+      expect(errors).toHaveLength(1);
+      expect(errors[0]).toHaveTextContent('Required');
+      expect(screen.queryByText('Not a valid tag')).toBeNull();
+    });
+
+    it('removes the error and the invalid state when the message goes back to null', () => {
+      const { container, rerender } = render(
+        <Field>
+          <ReportingControl message="Not a valid tag" />
+        </Field>,
+      );
+      rerender(
+        <Field>
+          <ReportingControl message={null} />
+        </Field>,
+      );
+      expect(container.querySelector('.flg-field-error')).toBeNull();
+      expect(container.firstElementChild).not.toHaveAttribute('data-invalid');
+      const input = screen.getByRole('textbox');
+      expect(input).not.toHaveAttribute('aria-invalid');
+      expect(input).not.toHaveAttribute('aria-describedby');
+    });
+
+    it('drops the message when the control unmounts', () => {
+      function Host() {
+        const [shown, setShown] = useState(true);
+        return (
+          <Field>
+            {shown ? <ReportingControl message="Not a valid tag" /> : null}
+            <button type="button" onClick={() => setShown(false)}>
+              remove
+            </button>
+          </Field>
+        );
+      }
+      const { container } = render(<Host />);
+      expect(container.querySelector('.flg-field-error')).not.toBeNull();
+      act(() => screen.getByRole('button').click());
+      expect(container.querySelector('.flg-field-error')).toBeNull();
+      expect(container.firstElementChild).not.toHaveAttribute('data-invalid');
+    });
+
+    it('renders the same DOM as before when the control never reports', () => {
+      const { container } = render(
+        <Field label="Email" description="We never share it">
+          <TextControl />
+        </Field>,
+      );
+      // The ids come from useId, so they are normalised; the rest is taken from the parent commit.
+      const html = container.innerHTML.replace(/(?::r[0-9a-z]+:|_r_[0-9a-z]+_)/g, 'ID');
+      expect(html).toBe(
+        '<div class="flg-field"><label id="ID-label" for="ID-control" class="flg-field-label">Email</label><input id="ID-control" aria-describedby="ID-description"><p id="ID-description" class="flg-field-description">We never share it</p></div>',
+      );
+    });
+  });
 });
diff --git a/src/internal/field-context.test.tsx b/src/internal/field-context.test.tsx
index acf6d6f..e02296a 100644
--- a/src/internal/field-context.test.tsx
+++ b/src/internal/field-context.test.tsx
@@ -1,4 +1,4 @@
-import { render, screen } from '@testing-library/react';
+import { render, renderHook, screen } from '@testing-library/react';
 import { createElement, forwardRef } from 'react';
 import type { ElementType, ReactNode } from 'react';
 import { describe, expect, it } from 'vitest';
@@ -8,6 +8,7 @@ import {
   isFieldGroup,
   markAsFieldControl,
   markAsFieldGroup,
+  useControlError,
   useFieldProps,
 } from './field-context';
 import type { FieldContextValue, FieldControlProps } from './field-context';
@@ -21,6 +22,7 @@ const FIELD: FieldContextValue = {
   required: true,
   disabled: false,
   labelMode: 'for',
+  setControlError: () => {},
 };
 
 // A minimal control: what useFieldProps returns goes straight onto a native input.
@@ -138,3 +140,24 @@ describe('field markers', () => {
     expect(isFieldGroup(lazy(Control))).toBe(false);
   });
 });
+
+describe('useControlError', () => {
+  it('returns null inside a Field, where the Field shows the message', () => {
+    const { result } = renderHook(() => useControlError('Not a valid tag'), {
+      wrapper: ({ children }) => (
+        <FieldContext.Provider value={FIELD}>{children}</FieldContext.Provider>
+      ),
+    });
+    expect(result.current).toBeNull();
+  });
+
+  it('returns an id and the message outside a Field, and null without a message', () => {
+    const { result, rerender } = renderHook(({ message }) => useControlError(message), {
+      initialProps: { message: 'Not a valid tag' as string | null },
+    });
+    expect(result.current).toEqual({ id: expect.any(String), message: 'Not a valid tag' });
+    expect(result.current?.id).not.toBe('');
+    rerender({ message: null });
+    expect(result.current).toBeNull();
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/field/Field.test.tsx src/internal/field-context.test.tsx
```

Expected: FAIL với `TypeError: useControlError is not a function` ở sáu test:
- nhóm `control error` của `Field.test.tsx`: `shows the message the control reports and becomes invalid`, `lets the error prop of the Field win over the control message`, `removes the error and the invalid state when the message goes back to null`, `drops the message when the control unmounts`;
- nhóm `useControlError` của `field-context.test.tsx`: `returns null inside a Field, where the Field shows the message`, `returns an id and the message outside a Field, and null without a message`.

Test `renders the same DOM as before when the control never reports` là test đặc tả: pass cả trước lẫn sau.

- [ ] **Step 3: Viết code**

```diff
diff --git a/src/components/field/Field.tsx b/src/components/field/Field.tsx
index 4fbe035..3a8b2f1 100644
--- a/src/components/field/Field.tsx
+++ b/src/components/field/Field.tsx
@@ -1,7 +1,7 @@
 'use client';
 
 import { clsx } from 'clsx';
-import { forwardRef, useId, useMemo } from 'react';
+import { forwardRef, useId, useMemo, useState } from 'react';
 import type { HTMLAttributes, ReactNode } from 'react';
 import { dataAttr } from '../../internal/data-attr';
 import {
@@ -54,7 +54,10 @@ export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
   ref,
 ) {
   const baseId = useId();
-  const invalid = Boolean(error);
+  const [controlError, setControlError] = useState<string | null>(null);
+  // The error prop wins: a control's own message only shows when the Field was given none.
+  const shownError = error || controlError;
+  const invalid = Boolean(shownError);
   const direct = fieldChildren(children);
   // <label for> can only name a labelable element; a group is named through aria-labelledby.
   const labelMode = direct.some(isFieldGroup) ? 'group' : 'for';
@@ -83,6 +86,7 @@ export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
       required,
       disabled,
       labelMode,
+      setControlError,
     }),
     [controlId, labelId, descriptionId, errorId, invalid, required, disabled, labelMode],
   );
@@ -130,7 +134,7 @@ export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
       ) : null}
       {invalid ? (
         <p id={context.errorId} className="flg-field-error">
-          {error}
+          {shownError}
         </p>
       ) : null}
     </div>
diff --git a/src/internal/field-context.tsx b/src/internal/field-context.tsx
index 103c0e9..28e7c37 100644
--- a/src/internal/field-context.tsx
+++ b/src/internal/field-context.tsx
@@ -1,4 +1,12 @@
-import { Children, Fragment, createContext, isValidElement, useContext } from 'react';
+import {
+  Children,
+  Fragment,
+  createContext,
+  isValidElement,
+  useContext,
+  useEffect,
+  useId,
+} from 'react';
 import type { AriaAttributes, ReactElement, ReactNode } from 'react';
 import { resolveLazy } from './react-lazy';
 import { devWarn } from './warn';
@@ -17,6 +25,8 @@ export interface FieldContextValue {
   disabled: boolean;
   /** `"group"` when the label names a group (RadioGroup) through aria-labelledby instead of `for`. */
   labelMode: 'for' | 'group';
+  /** Lets the control inside report its own error message (null when it has none). */
+  setControlError: (message: string | null) => void;
 }
 
 export const FieldContext = createContext<FieldContextValue | null>(null);
@@ -85,6 +95,27 @@ export function useFieldProps<P extends FieldControlProps>({
   };
 }
 
+/**
+ * A control's own error message, such as a rejected tag or a date that cannot be read.
+ * Inside a Field: reports `message` to the Field in an effect (null again on unmount) and returns
+ * null; the Field shows it and becomes invalid, and the control gets the error id and `invalid`
+ * through `useFieldProps` like any Field error. Outside a Field: returns `{ id, message }` while
+ * `message` is not null, so the control renders `<p id={id} className="flg-field-error">` itself
+ * and adds `id` to its aria-describedby; null otherwise.
+ */
+export function useControlError(message: string | null): { id: string; message: string } | null {
+  const field = useFieldContext();
+  const id = useId();
+  const setControlError = field?.setControlError;
+  useEffect(() => {
+    if (!setControlError) return undefined;
+    setControlError(message);
+    // Cleared on unmount, and before a new message replaces the old one.
+    return () => setControlError(null);
+  }, [setControlError, message]);
+  return !field && message !== null ? { id, message } : null;
+}
+
 const FIELD_GROUP = Symbol.for('fl-glass-ui.field-group');
 const FIELD_CONTROL = Symbol.for('fl-glass-ui.field-control');
 
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/internal src/components
pnpm vitest run --project storybook-light --project storybook-dark src/components/field
pnpm build && pnpm check:package
```

Expected: 118 file, 1454 test đơn vị PASS, 3 skip; story Field 30 test PASS (bản nháp chạy thư mục này ở Task 7); `check:package` PASS (CSS 7.25 kB trên 7.93 kB). Không story hay CSS nào đổi, và DOM của Field không đổi khi không control nào báo lỗi, nên ảnh chuẩn giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  src/components/field/Field.test.tsx \
  src/components/field/Field.tsx \
  src/internal/field-context.test.tsx \
  src/internal/field-context.tsx
```
```bash
git commit -m "feat(field): let a control report its own error to the Field" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 3: `Combobox`, kèm `match.ts`

Spec §3.1 (dòng Combobox và `<select>` ẩn), §3.2, §3.3, §3.5, §4.3 (giao diện C1), §4.5, §5 (`list-rows.ts`, `use-form-reset.ts`, `combobox/match.ts`, các primitive dùng lại, cảnh báo dev), §6.1, §6.3 **`Combobox`** trừ phần của Task 4, §7, §8, §10 (light dismiss). Một ô nhập text có listbox lọc khi gõ, chọn một item, gửi form như Select.
- **Dựng trên Select.** Listbox, option, nhóm, đường phân cách, `<select>` ẩn, `usePopoverState`/`useTriggerPress`/`usePopover`/`useFloating`, việc chuyển focus từ `<select>` ẩn sang ô nhập, quy tắc chỉ cuộn khi trỏ bằng phím, và reset form đều có sẵn ở Select. Combobox dùng lại các primitive đó và các class `flg-menu`, `flg-select-listbox`, `flg-menu-item`, `flg-select-option`, `flg-select-native`, `flg-select-chevron`. Không file nào của Select hay Input đổi.
- **Lọc** (`match.ts`): mặc định là "chứa", không phân biệt hoa thường và dấu, `đ`/`Đ` thành `d`. Chỉ chữ người dùng gõ mới lọc (phát hiện 9). Nhóm không còn item thì ẩn; đường phân cách không đứng đầu, đứng cuối hay đứng liền nhau. `filter` là hàm thì dùng hàm đó; `filter={false}` hiện mọi item.
- **Phần khớp in đậm**: chỗ khớp đầu tiên trong chữ gốc được bọc trong `<span class="flg-combobox-match">`, chỉ với bộ lọc mặc định và children là chữ thuần.
- **Phím** theo APG "list autocomplete, manual selection": focus DOM luôn ở ô nhập, option được trỏ qua `aria-activedescendant` và `data-highlighted`, không quay vòng. Phím bị bỏ qua khi IME đang soạn chữ. Vị trí trỏ lưu theo chỉ số trong cả danh sách; di chuyển chạy trên các option đang hiện.
- **Con trỏ**: khung `.flg-input` (không phải component `Input`) mang handler của cú nhấn, nên cú nhấn vào ô nhập hoặc chevron bật/tắt listbox, và `mousedown` trên khung giữ focus ở ô nhập.
- **Rời ô nhập** theo quy tắc không có `allowCustomValue`: chữ rỗng thì giá trị thành `null`, chữ khác thì trở về chữ của item đã chọn.
- **Form**: `<select>` ẩn chỉ có `<option value="">` và option của giá trị hiện tại (spec §3.1); option của listbox chỉ render khi đang mở (spec §3.5).
- Task này **không có** `allowCustomValue`, `loading`, `labels.loading`, `labels.results`, vùng live và mọi thông báo (Task 4). Dòng "No results" có `role="presentation"`, chưa được đọc.
- Dấu check của option đang chọn chỉ hiện ở forced colors (§4.5), dùng `CheckIcon` có sẵn trong `icons.tsx`.
- `match.ts` do `dots-3-note-preview:free` (kilo) viết qua opencode; Claude kiểm tra và dọn lại các escape. Nó nằm ở task này vì `Combobox` là nơi đầu tiên import nó (phát hiện 1). Ở test `covers combining marks that follow the last matched character`, brief nháp ghi `'Hà Noi'` dạng tổ hợp sẵn; test dùng dạng tách `'Ha\u0300 Noi'`, đúng ý "chữ đã ở NFD".
- Spec §6.3 được sửa một dòng (phát hiện 3): panel chỉ còn dòng trạng thái thì bỏ `role="listbox"` và tên.

**Files:**
- Create: `src/components/combobox/Combobox.tsx`, `match.ts`, `index.ts`, `Combobox.test.tsx`, `Combobox.test-d.ts`, `match.test.ts`, `Combobox.stories.tsx`, `Combobox.mdx`, `src/styles/components/combobox.css`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md`

**Interfaces:**
- Produces trong `src/components/combobox/match.ts` (thuần, không `"use client"`):
  - `foldText(text)`: `normalize('NFD')`, bỏ mọi `\p{M}`, `đ`/`Đ` thành `d`, rồi viết thường.
  - `defaultFilter(item: { value: string; textValue: string }, inputValue: string)`: `true` khi chữ gõ sau khi gấp là rỗng, hoặc nằm trong `textValue` đã gấp.
  - `findMatch(text, query)`: `{ start, end } | null`, chỉ số UTF-16 vào chữ **gốc**. Gấp theo từng code point (cặp surrogate giữ nguyên); `end` loại trừ và gồm cả các dấu kết hợp đứng sau ký tự khớp cuối. Trả `null` khi query gấp xong là rỗng hoặc không có.
  - Task 4 dùng thêm `foldText` để đổi chữ thành item.
- Produces: `Combobox`, `ComboboxItem`, `ComboboxGroup`, `ComboboxSeparator` và các kiểu `ComboboxProps`, `ComboboxItemProps`, `ComboboxGroupProps`, `ComboboxSeparatorProps`, `ComboboxFilterItem` (export phẳng từ `src/index.ts`).
  - `ComboboxProps` ở task này: `value` (`string | null`) / `defaultValue` / `onValueChange`, `inputValue` / `defaultInputValue` / `onInputValueChange`, `open` / `defaultOpen` / `onOpenChange`, `filter` (hàm hoặc `false`), `placeholder`, `required`, `disabled`, `invalid`, `name`, `size` (`'sm' | 'md' | 'lg'`), `id`, `className`, `style`, `aria-label`, `aria-labelledby`, `aria-describedby`, `labels: { noResults? }`, `children`.
  - `ref` trỏ vào ô nhập; `id` và `aria-*` gắn vào ô nhập; `className` và `style` lên phần tử gốc. Listbox có cùng tên với ô nhập.
  - `ComboboxItemProps` là `ListItemProps` (Task 1); `ComboboxGroupProps` là `{ label: ReactNode; children?: ReactNode }`.
  - Class `flg-combobox`, `flg-combobox-chevron`, `flg-combobox-match`, `flg-combobox-status`, `flg-combobox-check`.
- Consumes: `readRows` (Task 1), `usePopoverState`, `useTriggerPress`, `usePopover`, `useFloating`, `useFormReset`, `useControllableState`, `useWriteOnCommit`, `getNextIndex`, `useFieldProps`, `markAsFieldControl`, `markPart`, `ChevronIcon`, `CheckIcon`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/combobox/Combobox.stories.tsx b/src/components/combobox/Combobox.stories.tsx
new file mode 100644
index 0000000..b3d46fe
--- /dev/null
+++ b/src/components/combobox/Combobox.stories.tsx
@@ -0,0 +1,577 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
+import { realUserEvent, settled } from '../../../.storybook/real-input';
+import {
+  Dialog,
+  DialogClose,
+  DialogContent,
+  DialogFooter,
+  DialogTitle,
+  DialogTrigger,
+} from '../dialog/Dialog';
+import { Field } from '../field/Field';
+import { Combobox, ComboboxGroup, ComboboxItem, ComboboxSeparator } from './Combobox';
+
+const meta = {
+  title: 'Components/Combobox',
+  component: Combobox,
+  args: { children: null, onValueChange: fn(), onOpenChange: fn() },
+  parameters: { stage: 'viewport' },
+} satisfies Meta<typeof Combobox>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+const column = { placeSelf: 'start', display: 'grid', gap: 12, width: 240 } as const;
+const caption = {
+  fontSize: 'var(--flg-text-xs)',
+  color: 'var(--flg-text-muted)',
+  marginBottom: 6,
+} as const;
+
+// The list of the approved mockup (C1): cities, typed "h".
+const cities = (
+  <>
+    <ComboboxItem value="hn">Hà Nội</ComboboxItem>
+    <ComboboxItem value="hp">Hải Phòng</ComboboxItem>
+    <ComboboxItem value="hue">Huế</ComboboxItem>
+    <ComboboxItem value="ha">Hội An</ComboboxItem>
+    <ComboboxItem value="hcm">Hồ Chí Minh</ComboboxItem>
+    <ComboboxItem value="ct">Cần Thơ</ComboboxItem>
+    <ComboboxItem value="dn">Đà Nẵng</ComboboxItem>
+    <ComboboxItem value="dl" disabled>
+      Đà Lạt (soon)
+    </ComboboxItem>
+  </>
+);
+
+const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
+
+/** The Combobox's listbox; the hidden native <select> has a listbox role of its own. */
+const listboxIn = (root: HTMLElement) => root.querySelector<HTMLElement>('.flg-select-listbox')!;
+
+/** The look of the mockup (C1): a Select's frame with the text typed in it, the chevron at the end. */
+export const Look: Story = {
+  render: () => (
+    <div style={{ ...column, gap: 16 }}>
+      <div>
+        <div style={caption}>With a value</div>
+        <Combobox aria-label="City, with a value" defaultValue="hn">
+          {cities}
+        </Combobox>
+      </div>
+      <div>
+        <div style={caption}>Empty, with a placeholder</div>
+        <Combobox aria-label="City, empty" placeholder="Search a city…">
+          {cities}
+        </Combobox>
+      </div>
+      <div>
+        <div style={caption}>Small</div>
+        <Combobox aria-label="City, small" size="sm" defaultValue="hn">
+          {cities}
+        </Combobox>
+      </div>
+      <div>
+        <div style={caption}>Large</div>
+        <Combobox aria-label="City, large" size="lg" defaultValue="hn">
+          {cities}
+        </Combobox>
+      </div>
+      <div>
+        <div style={caption}>Disabled</div>
+        <Combobox aria-label="City, disabled" defaultValue="hn" disabled>
+          {cities}
+        </Combobox>
+      </div>
+      <Field label="City" description="Where you live." error="Pick a city from the list." required>
+        <Combobox name="city" placeholder="Search a city…">
+          {cities}
+        </Combobox>
+      </Field>
+    </div>
+  ),
+  play: async ({ canvas }) => {
+    const sizes = ['City, small', 'City, with a value', 'City, large'].map((name) =>
+      canvas.getByRole('combobox', { name }).parentElement!.getBoundingClientRect(),
+    );
+    // The heights of Input's three sizes.
+    await expect(sizes.map((box) => Math.round(box.height))).toEqual([28, 34, 40]);
+    const invalid = canvas.getByRole('combobox', { name: 'City' });
+    await expect(invalid).toHaveAttribute('aria-invalid', 'true');
+    await expect(canvas.getByRole('combobox', { name: 'City, disabled' })).toBeDisabled();
+  },
+};
+
+/** Open while filtering "ha": the match in bold, the rest muted, one option highlighted. */
+export const Open: Story = {
+  render: () => (
+    <div style={column}>
+      <Field label="City">
+        <Combobox defaultOpen defaultInputValue="h">
+          {cities}
+        </Combobox>
+      </Field>
+    </div>
+  ),
+  play: async ({ canvas }) => {
+    const input = canvas.getByRole('combobox', { name: 'City' });
+    const listbox = canvas.getByRole('listbox', { name: 'City' });
+    await settled(listbox);
+    // Under the frame, 6px away, at least as wide.
+    const frame = input.parentElement!.getBoundingClientRect();
+    const box = listbox.getBoundingClientRect();
+    await expect(Math.round(box.top - frame.bottom)).toBe(6);
+    await expect(Math.round(box.left)).toBe(Math.round(frame.left));
+    await expect(box.width).toBeGreaterThanOrEqual(frame.width - 0.5);
+    // Typed "h": the matching text is bold.
+    const options = within(listbox).getAllByRole('option');
+    await expect(options.length).toBeGreaterThan(1);
+    const match = options[0]!.querySelector('.flg-combobox-match');
+    await expect(match).toHaveTextContent('H');
+    await expect(getComputedStyle(match!).fontWeight).toBe('600');
+    // One option is highlighted, by the keyboard; focus stays on the input.
+    input.focus();
+    await userEvent.keyboard('{ArrowDown}');
+    await expect(listbox.querySelectorAll('[data-highlighted]')).toHaveLength(1);
+    await expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id);
+  },
+};
+
+export const Empty: Story = {
+  render: () => (
+    <div style={column}>
+      <Field label="City">
+        <Combobox defaultOpen defaultInputValue="xyz">
+          {cities}
+        </Combobox>
+      </Field>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const input = canvas.getByRole('combobox', { name: 'City' });
+    const panel = listboxIn(canvasElement);
+    await settled(panel);
+    // A status row, no option, and nothing for the input to point at: with no option to hold, the
+    // panel is no listbox.
+    await expect(within(panel).queryAllByRole('option')).toHaveLength(0);
+    await expect(within(panel).getByText('No results')).toBeInTheDocument();
+    await expect(panel).not.toHaveAttribute('role');
+    await expect(input).toHaveAttribute('aria-expanded', 'false');
+    await expect(input).not.toHaveAttribute('aria-controls');
+  },
+};
+
+/** The APG keys, with the keyboard events of Testing Library. */
+export const Keys: Story = {
+  tags: ['no-visual'],
+  render: (args) => (
+    <div style={{ placeSelf: 'start', display: 'flex', gap: 16, alignItems: 'end' }}>
+      <div style={column}>
+        <Field label="City">
+          <Combobox
+            name="city"
+            placeholder="Search a city…"
+            onValueChange={args.onValueChange}
+            onOpenChange={args.onOpenChange}
+          >
+            {cities}
+          </Combobox>
+        </Field>
+      </div>
+      <button type="button">After</button>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement, args }) => {
+    const input = canvas.getByRole('combobox', { name: 'City' });
+    const listbox = listboxIn(canvasElement);
+    const isOpen = () => listbox.matches(':popover-open');
+    const highlighted = () => listbox.querySelector('[data-highlighted]')?.textContent;
+    const shown = () =>
+      within(listbox)
+        .queryAllByRole('option')
+        .map((option) => option.textContent);
+    await expect(input).toHaveAttribute('aria-expanded', 'false');
+
+    // ↓ opens it on the first option; focus stays on the input, which names the highlight.
+    input.focus();
+    await userEvent.keyboard('{ArrowDown}');
+    await expect(isOpen()).toBe(true);
+    await expect(input).toHaveFocus();
+    await expect(highlighted()).toBe('Hà Nội');
+    await expect(input).toHaveAttribute(
+      'aria-activedescendant',
+      within(listbox).getByRole('option', { name: 'Hà Nội' }).id,
+    );
+    // Arrows move it and skip the disabled option; they stop at the ends.
+    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
+    await expect(highlighted()).toBe('Huế');
+    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
+    await expect(highlighted()).toBe('Hà Nội');
+    await userEvent.keyboard('{End}');
+    // End and Home move the caret and drop the highlight.
+    await expect(highlighted()).toBeUndefined();
+    await userEvent.keyboard('{ArrowUp}');
+    await expect(highlighted()).toBe('Đà Nẵng');
+
+    // Typing filters, with no regard for case or diacritics, and points at nothing.
+    await userEvent.keyboard('{Escape}{Escape}');
+    await userEvent.clear(input);
+    await userEvent.keyboard('ha noi');
+    await expect(isOpen()).toBe(true);
+    await expect(shown()).toEqual(['Hà Nội']);
+    await expect(highlighted()).toBeUndefined();
+    await userEvent.clear(input);
+    await userEvent.keyboard('da nang');
+    await expect(shown()).toEqual(['Đà Nẵng']);
+    // Enter chooses the highlighted option, takes its text and closes.
+    await userEvent.keyboard('{ArrowDown}{Enter}');
+    await expect(isOpen()).toBe(false);
+    await expect(input).toHaveValue('Đà Nẵng');
+    await expect(args.onValueChange).toHaveBeenLastCalledWith('dn');
+
+    // Opened again by a key, it shows every item and points at the chosen one.
+    await userEvent.keyboard('{ArrowDown}');
+    await expect(shown()).toHaveLength(8);
+    await expect(highlighted()).toBe('Đà Nẵng');
+    // Alt+↑ closes it and keeps the text; Alt+↓ opens it without a highlight.
+    await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
+    await expect(isOpen()).toBe(false);
+    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
+    await expect(isOpen()).toBe(true);
+    await expect(highlighted()).toBeUndefined();
+    // Tab closes it and chooses nothing; focus moves on.
+    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
+    await userEvent.tab();
+    await expect(isOpen()).toBe(false);
+    await expect(input).toHaveValue('Đà Nẵng');
+    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();
+
+    // Text that matches nothing is put back on Esc, once the listbox is closed, and on leaving.
+    input.focus();
+    await userEvent.keyboard('xyz');
+    await expect(within(listbox).getByText('No results')).toBeInTheDocument();
+    await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
+    await userEvent.keyboard('{Escape}');
+    await expect(input).toHaveValue('Đà Nẵng');
+    await userEvent.clear(input);
+    await userEvent.keyboard('abc');
+    await userEvent.tab();
+    await expect(input).toHaveValue('Đà Nẵng');
+    // Emptied and left, the value is cleared: the way to clear it.
+    input.focus();
+    await userEvent.clear(input);
+    await userEvent.tab();
+    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
+    await expect(input).toHaveValue('');
+  },
+};
+
+/** The pointer, with the trusted input of the browser where there is one. */
+export const Pointer: Story = {
+  tags: ['no-visual'],
+  render: (args) => (
+    <div style={{ placeSelf: 'start', display: 'flex', gap: 16, alignItems: 'end' }}>
+      <div style={column}>
+        <Field label="City">
+          <Combobox
+            defaultValue="hn"
+            onValueChange={args.onValueChange}
+            onOpenChange={args.onOpenChange}
+          >
+            {cities}
+          </Combobox>
+        </Field>
+      </div>
+      <button type="button">After</button>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement, args }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const input = canvas.getByRole('combobox', { name: 'City' });
+    const chevron = canvasElement.querySelector<HTMLElement>('.flg-combobox-chevron')!;
+    const listbox = listboxIn(canvasElement);
+    const isOpen = () => listbox.matches(':popover-open');
+    const highlighted = () => listbox.querySelector('[data-highlighted]')?.textContent;
+    const option = (name: string) => within(listbox).getByRole('option', { name });
+
+    // A click opens it on the chosen option, with every item shown.
+    await real.click(input);
+    await waitFor(() => expect(isOpen()).toBe(true));
+    await expect(input).toHaveFocus();
+    await expect(highlighted()).toBe('Hà Nội');
+    await expect(within(listbox).getAllByRole('option')).toHaveLength(8);
+    // The pointer highlights what it is over, without taking focus.
+    await real.hover(option('Huế'));
+    await waitFor(() => expect(highlighted()).toBe('Huế'));
+    await expect(input).toHaveFocus();
+    // A click on the open input closes it, as on a native <datalist>; typing opens it again.
+    args.onOpenChange?.mockClear();
+    await real.click(input);
+    await waitFor(() => expect(isOpen()).toBe(false));
+    await delay(50);
+    await expect(args.onOpenChange).toHaveBeenCalledOnce();
+    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
+    await expect(input).toHaveFocus();
+    await real.keyboard('x');
+    await waitFor(() => expect(isOpen()).toBe(true));
+    await real.keyboard('{Backspace}');
+    // The chevron toggles it too, and the input keeps focus.
+    await real.click(chevron);
+    await waitFor(() => expect(isOpen()).toBe(false));
+    await real.click(chevron);
+    await waitFor(() => expect(isOpen()).toBe(true));
+    await expect(input).toHaveFocus();
+    // A click on an option chooses it and closes the listbox.
+    await real.click(option('Hải Phòng'));
+    await waitFor(() => expect(isOpen()).toBe(false));
+    await expect(input).toHaveValue('Hải Phòng');
+    await expect(args.onValueChange).toHaveBeenLastCalledWith('hp');
+    await expect(input).toHaveFocus();
+    // A disabled option cannot be chosen.
+    await real.click(input);
+    await waitFor(() => expect(isOpen()).toBe(true));
+    // Playwright will not click a disabled element, so this click is Testing Library's.
+    await userEvent.click(option('Đà Lạt (soon)'));
+    await expect(isOpen()).toBe(true);
+    await expect(input).toHaveValue('Hải Phòng');
+    // Esc closes it and changes nothing.
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(isOpen()).toBe(false));
+    await expect(input).toHaveValue('Hải Phòng');
+    // A click outside closes it, and the text that was typed goes back.
+    await real.click(input);
+    await waitFor(() => expect(isOpen()).toBe(true));
+    await real.keyboard('x');
+    await real.click(canvas.getByRole('button', { name: 'After' }));
+    await waitFor(() => expect(isOpen()).toBe(false));
+    await expect(input).toHaveValue('Hải Phòng');
+  },
+};
+
+export const Separators: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={column}>
+      <Combobox aria-label="Fruit">
+        <ComboboxItem value="apple">Apple</ComboboxItem>
+        <ComboboxSeparator />
+        <ComboboxGroup label="Berries">
+          <ComboboxItem value="blueberry">Blueberry</ComboboxItem>
+          <ComboboxItem value="cranberry">Cranberry</ComboboxItem>
+        </ComboboxGroup>
+        <ComboboxSeparator />
+        <ComboboxItem value="date">Date</ComboboxItem>
+      </Combobox>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const input = canvas.getByRole('combobox', { name: 'Fruit' });
+    const listbox = listboxIn(canvasElement);
+    await userEvent.click(input);
+    await expect(within(listbox).getAllByRole('option')).toHaveLength(4);
+    await expect(within(listbox).getByRole('group', { name: 'Berries' })).toBeInTheDocument();
+    // A group with no match goes, and the separators around it with it.
+    await userEvent.keyboard('dat');
+    await expect(within(listbox).getAllByRole('option')).toHaveLength(1);
+    await expect(within(listbox).queryByRole('group')).toBeNull();
+    await expect(listbox.querySelectorAll('.flg-menu-separator')).toHaveLength(0);
+  },
+};
+
+const server = ['Ha Long', 'Hanoi', 'Hue'];
+
+/** A list the app filters itself: `filter={false}` shows what it is given. */
+export const OwnFilter: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={column}>
+      <Combobox aria-label="Place" filter={false}>
+        {server.map((name) => (
+          <ComboboxItem key={name} value={name}>
+            {name}
+          </ComboboxItem>
+        ))}
+      </Combobox>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const input = canvas.getByRole('combobox', { name: 'Place' });
+    const listbox = listboxIn(canvasElement);
+    await userEvent.type(input, 'zzz');
+    await expect(within(listbox).getAllByRole('option')).toHaveLength(3);
+    await expect(listbox.querySelector('.flg-combobox-match')).toBeNull();
+  },
+};
+
+/** The look of an error, and a Field that names it, describes it and marks it required. */
+export const InAField: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={column}>
+      <Field label="City" description="Where you live." error="Pick one." required>
+        <Combobox placeholder="Search a city…">{cities}</Combobox>
+      </Field>
+      <Field label="Plan" disabled>
+        <Combobox defaultValue="hn">{cities}</Combobox>
+      </Field>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const input = canvas.getByRole('combobox', { name: 'City' });
+    await expect(input).toHaveAccessibleDescription('Where you live. Pick one.');
+    await expect(input).toHaveAttribute('aria-invalid', 'true');
+    await expect(input).toHaveAttribute('aria-required', 'true');
+    await expect(input.closest('.flg-combobox')).toHaveAttribute('data-invalid');
+    // A click on the label is a click on the input: it takes focus.
+    await userEvent.click(canvas.getByText('City', { selector: 'label' }));
+    await expect(input).toHaveFocus();
+    // The listbox has the name of the input.
+    await expect(listboxIn(canvasElement)).toHaveAccessibleName('City');
+    await expect(canvas.getByRole('combobox', { name: 'Plan' })).toBeDisabled();
+  },
+};
+
+/** Esc closes only the listbox; a second Esc closes the Dialog. */
+export const InADialog: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <Dialog>
+      <DialogTrigger variant="secondary">Edit address</DialogTrigger>
+      <DialogContent size="sm">
+        <DialogTitle>Edit address</DialogTitle>
+        <Field label="City">
+          <Combobox defaultValue="hn">{cities}</Combobox>
+        </Field>
+        <DialogFooter>
+          <DialogClose>Save</DialogClose>
+        </DialogFooter>
+      </DialogContent>
+    </Dialog>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await real.click(canvas.getByRole('button', { name: 'Edit address' }));
+    const dialog = canvasElement.querySelector('dialog')!;
+    await expect(dialog.open).toBe(true);
+    let input = within(dialog).getByRole('combobox', { name: 'City' });
+    let listbox = listboxIn(dialog);
+    const isOpen = () => listbox.matches(':popover-open');
+    // Esc closes only the listbox, the topmost layer; focus stays on the input.
+    input.focus();
+    await real.keyboard('{ArrowDown}');
+    await waitFor(() => expect(isOpen()).toBe(true));
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(isOpen()).toBe(false));
+    await delay(50);
+    await expect(dialog.open).toBe(true);
+    await expect(input).toHaveFocus();
+    // A second Esc has nothing left to do in the Combobox, so the Dialog closes.
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(dialog.open).toBe(false));
+    // Open again, a press on the open input closes only the listbox.
+    await real.click(canvas.getByRole('button', { name: 'Edit address' }));
+    await waitFor(() => expect(dialog.open).toBe(true));
+    // The Dialog's content is made anew.
+    input = within(dialog).getByRole('combobox', { name: 'City' });
+    listbox = listboxIn(dialog);
+    await real.click(input);
+    await waitFor(() => expect(isOpen()).toBe(true));
+    await real.click(input);
+    await waitFor(() => expect(isOpen()).toBe(false));
+    await expect(input).toHaveFocus();
+    // A click on the frame of the Dialog, outside the panel, closes only the listbox.
+    await real.click(input);
+    await waitFor(() => expect(isOpen()).toBe(true));
+    await real.click(dialog, { position: { x: 4, y: 4 } });
+    await waitFor(() => expect(isOpen()).toBe(false));
+    await delay(50);
+    await expect(dialog.open).toBe(true);
+    // Choosing an option closes the listbox and keeps the Dialog.
+    await real.click(input);
+    await waitFor(() => expect(isOpen()).toBe(true));
+    await real.click(within(listbox).getByRole('option', { name: 'Huế' }));
+    await waitFor(() => expect(isOpen()).toBe(false));
+    await expect(input).toHaveValue('Huế');
+    await expect(dialog.open).toBe(true);
+  },
+};
+
+function CityForm({ onSubmit }: { onSubmit: (city: FormDataEntryValue | null) => void }) {
+  return (
+    <form
+      aria-label="Address"
+      style={column}
+      onSubmit={(event) => {
+        event.preventDefault();
+        onSubmit(new FormData(event.currentTarget).get('city'));
+      }}
+    >
+      <Field label="City" required>
+        <Combobox name="city" placeholder="Search a city…" defaultValue="hn">
+          {cities}
+        </Combobox>
+      </Field>
+      <Field label="Other city" required>
+        <Combobox name="other" placeholder="Search a city…">
+          {cities}
+        </Combobox>
+      </Field>
+      <button type="submit">Save</button>
+    </form>
+  );
+}
+
+export const InAForm: Story = {
+  tags: ['no-visual'],
+  args: { onValueChange: fn() },
+  render: () => <CityForm onSubmit={fn()} />,
+  play: async ({ canvas, canvasElement }) => {
+    const form = canvasElement.querySelector('form')!;
+    const city = canvas.getByRole('combobox', { name: 'City' });
+    const other = canvas.getByRole('combobox', { name: 'Other city' });
+    const user = (await realUserEvent()) ?? userEvent;
+    let submitted = 0;
+    form.addEventListener('submit', () => (submitted += 1));
+
+    // Required and empty: the submit is stopped, and focus lands on the input, not on the hidden
+    // native <select> the browser focused to show its message.
+    form.requestSubmit();
+    await waitFor(() => expect(other).toHaveFocus());
+    await expect(submitted).toBe(0);
+    // Stray text is not a value.
+    await user.keyboard('xyz');
+    form.requestSubmit();
+    await expect(submitted).toBe(0);
+
+    // The value reaches FormData through the hidden native <select>.
+    await user.keyboard('{Backspace}{Backspace}{Backspace}{ArrowDown}');
+    await user.keyboard('{ArrowDown}{Enter}');
+    await expect(other).toHaveValue('Hải Phòng');
+    await expect(new FormData(form).get('city')).toBe('hn');
+    await expect(new FormData(form).get('other')).toBe('hp');
+
+    // Enter in an open listbox chooses and does not submit; on a closed one it submits.
+    city.focus();
+    await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}h');
+    await user.keyboard('{ArrowDown}{Enter}');
+    await expect(submitted).toBe(0);
+    await expect(city).toHaveValue('Hà Nội');
+    await user.keyboard('{Enter}');
+    await waitFor(() => expect(submitted).toBe(1));
+
+    // Reset: the Combobox with a default goes back to it, the other one to nothing.
+    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
+    await expect(new FormData(form).get('city')).toBe('hp');
+    form.reset();
+    await waitFor(() => expect(city).toHaveValue('Hà Nội'));
+    await waitFor(() => {
+      expect(other).toHaveValue('');
+      const data = new FormData(form);
+      expect(data.get('city')).toBe('hn');
+      expect(data.get('other')).toBe('');
+    });
+  },
+};
diff --git a/src/components/combobox/Combobox.test-d.ts b/src/components/combobox/Combobox.test-d.ts
new file mode 100644
index 0000000..f144cf0
--- /dev/null
+++ b/src/components/combobox/Combobox.test-d.ts
@@ -0,0 +1,37 @@
+import { expectTypeOf, test } from 'vitest';
+import type { ComboboxProps } from './Combobox';
+
+test('a Combobox takes null for no value, and reports a string or null', () => {
+  expectTypeOf<ComboboxProps['value']>().toEqualTypeOf<string | null | undefined>();
+  expectTypeOf<ComboboxProps['defaultValue']>().toEqualTypeOf<string | undefined>();
+  expectTypeOf<ComboboxProps['onValueChange']>().toEqualTypeOf<
+    ((value: string | null) => void) | undefined
+  >();
+  const cleared: ComboboxProps = { value: null, children: null };
+  expectTypeOf(cleared).toBeObject();
+});
+
+test('a Combobox accepts only the sizes of Input', () => {
+  expectTypeOf<ComboboxProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
+  // @ts-expect-error 'xl' is not a size
+  const unknownSize: ComboboxProps = { size: 'xl', children: null };
+  expectTypeOf(unknownSize).toBeObject();
+});
+
+test('the filter is a function of the item and the text, or false', () => {
+  expectTypeOf<ComboboxProps['filter']>().toEqualTypeOf<
+    | ((item: { value: string; textValue: string }, inputValue: string) => boolean)
+    | false
+    | undefined
+  >();
+  // @ts-expect-error true is not a filter: leave it out for the default
+  const on: ComboboxProps = { filter: true, children: null };
+  expectTypeOf(on).toBeObject();
+});
+
+test('the text is a string, and is reported as one', () => {
+  expectTypeOf<ComboboxProps['inputValue']>().toEqualTypeOf<string | undefined>();
+  expectTypeOf<ComboboxProps['onInputValueChange']>().toEqualTypeOf<
+    ((text: string) => void) | undefined
+  >();
+});
diff --git a/src/components/combobox/Combobox.test.tsx b/src/components/combobox/Combobox.test.tsx
new file mode 100644
index 0000000..c56711f
--- /dev/null
+++ b/src/components/combobox/Combobox.test.tsx
@@ -0,0 +1,1208 @@
+import { act, fireEvent, render, screen } from '@testing-library/react';
+import { renderToString } from 'react-dom/server';
+import { useState } from 'react';
+import type { ComponentProps, ReactNode } from 'react';
+import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import { Field } from '../field/Field';
+import { Combobox, ComboboxGroup, ComboboxItem, ComboboxSeparator } from './Combobox';
+
+// jsdom has no Popover API. This stand-in is enough for a Combobox to render, as for a Select.
+const original = {
+  showPopover: HTMLElement.prototype.showPopover,
+  hidePopover: HTMLElement.prototype.hidePopover,
+};
+beforeAll(() => {
+  HTMLElement.prototype.showPopover = () => {};
+  HTMLElement.prototype.hidePopover = () => {};
+  // jsdom does not lay out, so it has no scrollIntoView either.
+  Element.prototype.scrollIntoView = () => {};
+});
+afterAll(() => {
+  Object.assign(HTMLElement.prototype, original);
+  delete (Element.prototype as Partial<Element>).scrollIntoView;
+});
+
+const cities = (
+  <>
+    <ComboboxItem value="hn">Hà Nội</ComboboxItem>
+    <ComboboxItem value="dn">Đà Nẵng</ComboboxItem>
+    <ComboboxItem value="hp">Hải Phòng</ComboboxItem>
+    <ComboboxItem value="hue">Huế</ComboboxItem>
+  </>
+);
+
+const input = () => screen.getByRole<HTMLInputElement>('combobox');
+const listbox = () => document.querySelector<HTMLElement>('.flg-select-listbox')!;
+const optionTexts = () =>
+  Array.from(listbox().querySelectorAll('[role="option"]'), (option) => option.textContent);
+const highlighted = () => listbox().querySelector('[data-highlighted]')?.textContent;
+const option = (name: string) =>
+  Array.from(listbox().querySelectorAll<HTMLElement>('[role="option"]')).find(
+    (el) => el.textContent === name,
+  )!;
+const type = (text: string) => fireEvent.change(input(), { target: { value: text } });
+const key = (name: string, init: Partial<KeyboardEventInit> = {}) =>
+  fireEvent.keyDown(input(), { key: name, ...init });
+const aTaskLater = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
+
+function Wrapper({ children }: { children?: ReactNode }) {
+  return <>{children}</>;
+}
+
+describe('Combobox', () => {
+  beforeEach(() => resetDevWarnings());
+  afterEach(() => vi.restoreAllMocks());
+
+  describe('markup and ARIA', () => {
+    it('renders the text of the chosen item and one native option for it on the server', () => {
+      const html = renderToString(
+        <Combobox aria-label="City" name="city" defaultValue="hn">
+          {cities}
+        </Combobox>,
+      );
+      const doc = new DOMParser().parseFromString(html, 'text/html');
+      expect(doc.querySelector<HTMLInputElement>('input[role="combobox"]')?.value).toBe('Hà Nội');
+      const native = doc.querySelector('select[name="city"]');
+      expect(Array.from(native?.querySelectorAll('option') ?? [], (o) => o.value)).toEqual([
+        '',
+        'hn',
+      ]);
+      expect(native?.querySelector('option[value="hn"]')?.hasAttribute('selected')).toBe(true);
+      expect(doc.querySelectorAll('[role="option"]')).toHaveLength(0);
+    });
+
+    it('is a list-autocomplete combobox whose options exist only while it is open', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      expect(input()).toHaveAttribute('aria-autocomplete', 'list');
+      expect(input()).toHaveAttribute('autocomplete', 'off');
+      expect(input()).toHaveAttribute('aria-expanded', 'false');
+      expect(input()).not.toHaveAttribute('aria-controls');
+      expect(optionTexts()).toEqual([]);
+      act(() => input().focus());
+      key('ArrowDown');
+      expect(input()).toHaveAttribute('aria-expanded', 'true');
+      expect(input()).toHaveAttribute('aria-controls', listbox().id);
+      expect(listbox()).toHaveAttribute('role', 'listbox');
+      expect(optionTexts()).toEqual(['Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Huế']);
+      expect(input()).toHaveAttribute('aria-activedescendant', option('Hà Nội').id);
+    });
+
+    it('shows a status row, and points aria-controls at nothing, when no option is left', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      type('xyz');
+      expect(input()).toHaveAttribute('aria-expanded', 'false');
+      expect(input()).not.toHaveAttribute('aria-controls');
+      expect(input()).not.toHaveAttribute('aria-activedescendant');
+      // A listbox must hold options (axe): with only the status row the panel is none.
+      expect(listbox()).not.toHaveAttribute('role');
+      expect(listbox()).not.toHaveAttribute('aria-label');
+      const status = listbox().querySelector('.flg-combobox-status');
+      expect(status).toHaveAttribute('role', 'presentation');
+      expect(status).toHaveTextContent('No results');
+    });
+
+    it('takes the text of the status row from labels.noResults', () => {
+      render(
+        <Combobox aria-label="City" labels={{ noResults: 'Không có kết quả' }}>
+          {cities}
+        </Combobox>,
+      );
+      type('xyz');
+      expect(listbox().querySelector('.flg-combobox-status')).toHaveTextContent('Không có kết quả');
+    });
+
+    it('takes its id, name and description from a Field, and names the listbox like the input', () => {
+      render(
+        <Field label="City" description="Where you live.">
+          <Combobox>{cities}</Combobox>
+        </Field>,
+      );
+      expect(screen.getByRole('combobox', { name: 'City' })).toBe(input());
+      expect(input()).toHaveAccessibleDescription('Where you live.');
+      expect(listbox()).toHaveAttribute('aria-labelledby', screen.getByText('City').id);
+    });
+
+    it('gives the listbox the aria-label of the input', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      expect(listbox()).toHaveAttribute('aria-label', 'City');
+    });
+
+    it('marks the input invalid and required from a Field, and the frame too', () => {
+      render(
+        <Field label="City" error="Pick one." required>
+          <Combobox>{cities}</Combobox>
+        </Field>,
+      );
+      expect(input()).toHaveAttribute('aria-invalid', 'true');
+      expect(input()).toHaveAttribute('aria-required', 'true');
+      // The visible input is never natively required: the hidden select carries it.
+      expect(input()).not.toHaveAttribute('required');
+      expect(input().closest('.flg-combobox')).toHaveAttribute('data-invalid');
+      expect(input()).toHaveAccessibleDescription('Pick one.');
+    });
+
+    it('puts className and style on the root, and the ref on the input', () => {
+      let el: HTMLInputElement | null = null;
+      render(
+        <Combobox
+          aria-label="City"
+          className="custom"
+          style={{ width: 200 }}
+          size="lg"
+          ref={(node) => {
+            el = node;
+          }}
+        >
+          {cities}
+        </Combobox>,
+      );
+      const root = input().closest('.flg-combobox') as HTMLElement;
+      expect(root).toHaveClass('custom');
+      expect(root).toHaveStyle({ width: '200px' });
+      expect(root).toHaveAttribute('data-size', 'lg');
+      expect(el).toBe(input());
+    });
+
+    it('names a group by its label, and draws a separator as role none', () => {
+      render(
+        <Combobox aria-label="City" defaultOpen>
+          <ComboboxGroup label="North">
+            <ComboboxItem value="hn">Hà Nội</ComboboxItem>
+          </ComboboxGroup>
+          <ComboboxSeparator />
+          <ComboboxItem value="dn">Đà Nẵng</ComboboxItem>
+        </Combobox>,
+      );
+      // The popover is not shown in jsdom, so its group is not in the accessibility tree.
+      expect(screen.getByRole('group', { name: 'North', hidden: true })).toBeInTheDocument();
+      expect(listbox().querySelector('[role="none"].flg-menu-separator')).not.toBeNull();
+    });
+  });
+
+  describe('the filter', () => {
+    it('matches without case and without diacritics, so "ha noi" finds Hà Nội', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      type('ha noi');
+      expect(optionTexts()).toEqual(['Hà Nội']);
+    });
+
+    it('matches đ as d, so "da nang" finds Đà Nẵng', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      type('da nang');
+      expect(optionTexts()).toEqual(['Đà Nẵng']);
+    });
+
+    it('matches the textValue of an item, not what it shows', () => {
+      render(
+        <Combobox aria-label="City">
+          <ComboboxItem value="hn" textValue="Hà Nội">
+            <b>Capital</b>
+          </ComboboxItem>
+          <ComboboxItem value="dn" textValue="Đà Nẵng">
+            <b>Coast</b>
+          </ComboboxItem>
+        </Combobox>,
+      );
+      type('nang');
+      expect(optionTexts()).toEqual(['Coast']);
+    });
+
+    it('uses a filter function, given the item and what was typed', () => {
+      const filter = vi.fn(
+        (item: { value: string; textValue: string }, text: string) =>
+          item.value.startsWith(text) && item.textValue !== 'Huế',
+      );
+      render(
+        <Combobox aria-label="City" filter={filter}>
+          {cities}
+        </Combobox>,
+      );
+      type('h');
+      expect(optionTexts()).toEqual(['Hà Nội', 'Hải Phòng']);
+      expect(filter).toHaveBeenCalledWith({ value: 'hn', textValue: 'Hà Nội' }, 'h');
+    });
+
+    it('shows every item with filter={false}', () => {
+      render(
+        <Combobox aria-label="City" filter={false}>
+          {cities}
+        </Combobox>,
+      );
+      type('xyz');
+      expect(optionTexts()).toEqual(['Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Huế']);
+    });
+
+    it('filters only by what was typed: opening by key or press shows every item', () => {
+      render(
+        <Combobox aria-label="City" defaultValue="dn">
+          {cities}
+        </Combobox>,
+      );
+      expect(input()).toHaveValue('Đà Nẵng');
+      act(() => input().focus());
+      key('ArrowDown');
+      expect(optionTexts()).toEqual(['Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Huế']);
+      // The chosen one is pointed at.
+      expect(highlighted()).toBe('Đà Nẵng');
+      key('ArrowUp', { altKey: true });
+      expect(input()).toHaveAttribute('aria-expanded', 'false');
+      fireEvent.pointerDown(input());
+      fireEvent.click(input(), { detail: 1 });
+      expect(optionTexts()).toEqual(['Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Huế']);
+      expect(highlighted()).toBe('Đà Nẵng');
+    });
+
+    it('shows every item again after a choice, and when it opens anew', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      type('hu');
+      expect(optionTexts()).toEqual(['Huế']);
+      key('ArrowDown');
+      key('Enter');
+      expect(input()).toHaveValue('Huế');
+      key('ArrowDown');
+      expect(optionTexts()).toHaveLength(4);
+      key('ArrowUp', { altKey: true });
+      type('ha');
+      key('ArrowUp', { altKey: true });
+      key('ArrowDown', { altKey: true });
+      expect(optionTexts()).toHaveLength(4);
+    });
+
+    it('hides a group with no item left, and a separator that would lead or trail', () => {
+      render(
+        <Combobox aria-label="Item" defaultOpen>
+          <ComboboxItem value="a1">Apple</ComboboxItem>
+          <ComboboxSeparator />
+          <ComboboxGroup label="Berries">
+            <ComboboxItem value="b1">Blueberry</ComboboxItem>
+          </ComboboxGroup>
+          <ComboboxSeparator />
+          <ComboboxGroup label="Citrus">
+            <ComboboxItem value="c1">Cherry</ComboboxItem>
+            <ComboboxItem value="c2">Lemon</ComboboxItem>
+          </ComboboxGroup>
+          <ComboboxSeparator />
+          <ComboboxItem value="d1">Date</ComboboxItem>
+        </Combobox>,
+      );
+      const shape = () =>
+        Array.from(listbox().children, (el) =>
+          el.getAttribute('role') === 'group'
+            ? `group:${el.firstElementChild?.textContent}`
+            : el.getAttribute('role') === 'none'
+              ? '---'
+              : el.textContent,
+        );
+      expect(shape()).toEqual([
+        'Apple',
+        '---',
+        'group:Berries',
+        '---',
+        'group:Citrus',
+        '---',
+        'Date',
+      ]);
+      // Everything has an "e".
+      type('e');
+      expect(shape()).toHaveLength(7);
+      // Cherry and Date go: the separator after the last group left would trail.
+      type('l');
+      expect(shape()).toEqual(['Apple', '---', 'group:Berries', '---', 'group:Citrus']);
+      // Only Lemon: the separators before it would lead.
+      type('lem');
+      expect(shape()).toEqual(['group:Citrus']);
+      type('dat');
+      expect(shape()).toEqual(['Date']);
+      type('blu');
+      expect(shape()).toEqual(['group:Berries']);
+    });
+
+    it('does not let two separators meet when the group between them is hidden', () => {
+      render(
+        <Combobox aria-label="Item" defaultOpen>
+          <ComboboxItem value="a">Apple</ComboboxItem>
+          <ComboboxSeparator />
+          <ComboboxGroup label="Gone">
+            <ComboboxItem value="p">Plum</ComboboxItem>
+          </ComboboxGroup>
+          <ComboboxSeparator />
+          <ComboboxItem value="d">Date</ComboboxItem>
+        </Combobox>,
+      );
+      expect(listbox().querySelectorAll('[role="none"]')).toHaveLength(2);
+      type('a');
+      expect(optionTexts()).toEqual(['Apple', 'Date']);
+      expect(listbox().querySelectorAll('[role="none"]')).toHaveLength(1);
+    });
+  });
+
+  describe('the match highlight', () => {
+    it('wraps the first match of the default filter, by original characters', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      type('ha');
+      expect(optionTexts()).toEqual(['Hà Nội', 'Hải Phòng']);
+      // The span holds the characters of the item, with their diacritics: "ha" matches "Hà".
+      expect(option('Hà Nội').querySelector('.flg-combobox-match')).toHaveTextContent('Hà');
+      expect(option('Hải Phòng').querySelector('.flg-combobox-match')).toHaveTextContent('Hả');
+      expect(option('Hà Nội')).toHaveTextContent('Hà Nội');
+    });
+
+    it('marks nothing without something typed', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      act(() => input().focus());
+      key('ArrowDown');
+      expect(listbox().querySelector('.flg-combobox-match')).toBeNull();
+      expect(listbox()).not.toHaveAttribute('data-filtering');
+    });
+
+    it('marks the match inside the text, and keeps the text whole', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      type('noi');
+      expect(optionTexts()).toEqual(['Hà Nội']);
+      const match = option('Hà Nội').querySelector('.flg-combobox-match');
+      expect(match).toHaveTextContent('Nội');
+      expect(listbox()).toHaveAttribute('data-filtering');
+    });
+
+    it('marks nothing when the children of the item are not plain text', () => {
+      render(
+        <Combobox aria-label="City">
+          <ComboboxItem value="hn" textValue="Hà Nội">
+            <b>Hà Nội</b>
+          </ComboboxItem>
+        </Combobox>,
+      );
+      type('ha');
+      expect(optionTexts()).toEqual(['Hà Nội']);
+      expect(listbox().querySelector('.flg-combobox-match')).toBeNull();
+    });
+
+    it('marks nothing with a filter of its own, or with filter={false}', () => {
+      const { rerender } = render(
+        <Combobox aria-label="City" filter={() => true}>
+          {cities}
+        </Combobox>,
+      );
+      type('ha');
+      expect(listbox().querySelector('.flg-combobox-match')).toBeNull();
+      rerender(
+        <Combobox aria-label="City" filter={false}>
+          {cities}
+        </Combobox>,
+      );
+      expect(listbox().querySelector('.flg-combobox-match')).toBeNull();
+      expect(listbox()).not.toHaveAttribute('data-filtering');
+    });
+  });
+
+  describe('the keyboard', () => {
+    it('opens on ArrowDown at the chosen item, or at the first, and moves without looping', () => {
+      const { unmount } = render(<Combobox aria-label="City">{cities}</Combobox>);
+      act(() => input().focus());
+      key('ArrowDown');
+      expect(highlighted()).toBe('Hà Nội');
+      key('ArrowDown');
+      expect(highlighted()).toBe('Đà Nẵng');
+      key('ArrowDown');
+      key('ArrowDown');
+      key('ArrowDown');
+      expect(highlighted()).toBe('Huế');
+      expect(input()).toHaveAttribute('aria-activedescendant', option('Huế').id);
+      unmount();
+      render(
+        <Combobox aria-label="City" defaultValue="hp">
+          {cities}
+        </Combobox>,
+      );
+      act(() => input().focus());
+      key('ArrowDown');
+      expect(highlighted()).toBe('Hải Phòng');
+    });
+
+    it('opens on ArrowUp at the chosen item, or at the last, and moves up without looping', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      act(() => input().focus());
+      key('ArrowUp');
+      expect(highlighted()).toBe('Huế');
+      key('ArrowUp');
+      key('ArrowUp');
+      key('ArrowUp');
+      key('ArrowUp');
+      expect(highlighted()).toBe('Hà Nội');
+    });
+
+    it('skips a disabled item', () => {
+      render(
+        <Combobox aria-label="City">
+          <ComboboxItem value="a">A</ComboboxItem>
+          <ComboboxItem value="b" disabled>
+            B
+          </ComboboxItem>
+          <ComboboxItem value="c">C</ComboboxItem>
+        </Combobox>,
+      );
+      act(() => input().focus());
+      key('ArrowDown');
+      key('ArrowDown');
+      expect(highlighted()).toBe('C');
+    });
+
+    it('prevents the default of the arrows, so the caret stays put', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      act(() => input().focus());
+      expect(key('ArrowDown')).toBe(false);
+      expect(key('ArrowDown')).toBe(false);
+      expect(key('ArrowUp')).toBe(false);
+    });
+
+    it('opens on Alt+ArrowDown without pointing at anything, and closes on Alt+ArrowUp', () => {
+      render(
+        <Combobox aria-label="City" defaultValue="dn">
+          {cities}
+        </Combobox>,
+      );
+      act(() => input().focus());
+      key('ArrowDown', { altKey: true });
+      expect(input()).toHaveAttribute('aria-expanded', 'true');
+      expect(highlighted()).toBeUndefined();
+      expect(input()).not.toHaveAttribute('aria-activedescendant');
+      type('x');
+      key('ArrowUp', { altKey: true });
+      expect(input()).toHaveAttribute('aria-expanded', 'false');
+      // The text stays as it was typed.
+      expect(input()).toHaveValue('x');
+    });
+
+    it('opens when text is typed, and points at nothing', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      act(() => input().focus());
+      type('h');
+      expect(input()).toHaveAttribute('aria-expanded', 'true');
+      expect(highlighted()).toBeUndefined();
+      key('ArrowDown');
+      expect(highlighted()).toBe('Hà Nội');
+      // Typing again drops the highlight.
+      type('hu');
+      expect(highlighted()).toBeUndefined();
+      expect(input()).not.toHaveAttribute('aria-activedescendant');
+    });
+
+    it('does not choose anything by typing', () => {
+      const onValueChange = vi.fn();
+      render(
+        <Combobox aria-label="City" onValueChange={onValueChange}>
+          {cities}
+        </Combobox>,
+      );
+      type('Huế');
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('chooses the pointed item on Enter, takes its text, closes, and never submits', () => {
+      const onValueChange = vi.fn();
+      render(
+        <Combobox aria-label="City" onValueChange={onValueChange}>
+          {cities}
+        </Combobox>,
+      );
+      type('hu');
+      key('ArrowDown');
+      expect(key('Enter')).toBe(false);
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('hue');
+      expect(input()).toHaveValue('Huế');
+      expect(input()).toHaveAttribute('aria-expanded', 'false');
+    });
+
+    it('closes on Enter with nothing pointed at, changes nothing, and still never submits', () => {
+      const onValueChange = vi.fn();
+      render(
+        <Combobox aria-label="City" defaultValue="hn" onValueChange={onValueChange}>
+          {cities}
+        </Combobox>,
+      );
+      act(() => input().focus());
+      type('hu');
+      expect(key('Enter')).toBe(false);
+      expect(input()).toHaveAttribute('aria-expanded', 'false');
+      expect(input()).toHaveValue('hu');
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('leaves Enter on a closed listbox to the browser, so the form submits', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      act(() => input().focus());
+      expect(key('Enter')).toBe(true);
+    });
+
+    it('does not choose a disabled item on Enter', () => {
+      const onValueChange = vi.fn();
+      render(
+        <Combobox aria-label="City" onValueChange={onValueChange}>
+          <ComboboxItem value="a" disabled>
+            A
+          </ComboboxItem>
+        </Combobox>,
+      );
+      act(() => input().focus());
+      key('ArrowDown');
+      key('Enter');
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('does not act on keys of an input method composing text', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      act(() => input().focus());
+      key('ArrowDown');
+      expect(fireEvent.keyDown(input(), { key: 'Enter', isComposing: true })).toBe(true);
+      expect(input()).toHaveAttribute('aria-expanded', 'true');
+    });
+
+    it('does not block Esc on an open listbox: the browser closes it', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      act(() => input().focus());
+      type('h');
+      expect(key('Escape')).toBe(true);
+      expect(input()).toHaveValue('h');
+    });
+
+    it('puts the text of the chosen item back on Esc when the listbox is closed', () => {
+      const onInputValueChange = vi.fn();
+      render(
+        <Combobox aria-label="City" defaultValue="hn" onInputValueChange={onInputValueChange}>
+          {cities}
+        </Combobox>,
+      );
+      act(() => input().focus());
+      type('xyz');
+      key('ArrowUp', { altKey: true });
+      expect(input()).toHaveValue('xyz');
+      onInputValueChange.mockClear();
+      expect(key('Escape')).toBe(false);
+      expect(input()).toHaveValue('Hà Nội');
+      expect(onInputValueChange).toHaveBeenCalledExactlyOnceWith('Hà Nội');
+    });
+
+    it('clears stray text on Esc when nothing is chosen', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      act(() => input().focus());
+      type('xyz');
+      key('ArrowUp', { altKey: true });
+      expect(key('Escape')).toBe(false);
+      expect(input()).toHaveValue('');
+    });
+
+    it('leaves Esc alone when there is nothing to put back, so a Dialog closes', () => {
+      render(
+        <Combobox aria-label="City" defaultValue="hn">
+          {cities}
+        </Combobox>,
+      );
+      act(() => input().focus());
+      expect(key('Escape')).toBe(true);
+    });
+
+    it('closes on Tab and chooses nothing, even with an item pointed at', () => {
+      const onValueChange = vi.fn();
+      render(
+        <>
+          <Combobox aria-label="City" onValueChange={onValueChange}>
+            {cities}
+          </Combobox>
+          <button type="button">After</button>
+        </>,
+      );
+      act(() => input().focus());
+      key('ArrowDown');
+      expect(highlighted()).toBe('Hà Nội');
+      // Tab is not prevented: focus goes on.
+      expect(key('Tab')).toBe(true);
+      expect(input()).toHaveAttribute('aria-expanded', 'false');
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(input()).toHaveValue('');
+    });
+
+    it('lets the caret keys through and drops the highlight', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      act(() => input().focus());
+      for (const name of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
+        key('ArrowDown');
+        expect(highlighted()).toBeDefined();
+        expect(key(name)).toBe(true);
+        expect(highlighted()).toBeUndefined();
+        expect(input()).toHaveAttribute('aria-expanded', 'true');
+      }
+    });
+  });
+
+  describe('the pointer', () => {
+    it('points at the option under a mouse or pen, not under a touch', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      act(() => input().focus());
+      key('ArrowDown', { altKey: true });
+      fireEvent.pointerMove(option('Huế'), { pointerType: 'mouse' });
+      expect(highlighted()).toBe('Huế');
+      fireEvent.pointerMove(option('Đà Nẵng'), { pointerType: 'touch' });
+      expect(highlighted()).toBe('Huế');
+    });
+
+    it('chooses the clicked option, takes its text, and closes', () => {
+      const onValueChange = vi.fn();
+      render(
+        <Combobox aria-label="City" onValueChange={onValueChange}>
+          {cities}
+        </Combobox>,
+      );
+      act(() => input().focus());
+      type('h');
+      fireEvent.click(option('Huế'));
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('hue');
+      expect(input()).toHaveValue('Huế');
+      expect(input()).toHaveAttribute('aria-expanded', 'false');
+    });
+
+    it('does not choose a disabled option, nor point at it', () => {
+      const onValueChange = vi.fn();
+      render(
+        <Combobox aria-label="City" onValueChange={onValueChange}>
+          <ComboboxItem value="a" disabled>
+            A
+          </ComboboxItem>
+          <ComboboxItem value="b">B</ComboboxItem>
+        </Combobox>,
+      );
+      act(() => input().focus());
+      key('ArrowDown');
+      fireEvent.pointerMove(option('A'), { pointerType: 'mouse' });
+      expect(highlighted()).toBe('B');
+      fireEvent.click(option('A'));
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(input()).toHaveAttribute('aria-expanded', 'true');
+    });
+
+    it('keeps focus on the input when the listbox is pressed', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      act(() => input().focus());
+      key('ArrowDown');
+      expect(fireEvent.mouseDown(option('Huế'))).toBe(false);
+      expect(fireEvent.mouseDown(listbox())).toBe(false);
+    });
+
+    it('opens on a click of the input and closes on the next, as the trigger of a Select does', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      fireEvent.pointerDown(input());
+      fireEvent.click(input(), { detail: 1 });
+      expect(input()).toHaveAttribute('aria-expanded', 'true');
+      expect(input()).toHaveFocus();
+      fireEvent.pointerDown(input());
+      fireEvent.click(input(), { detail: 1 });
+      expect(input()).toHaveAttribute('aria-expanded', 'false');
+    });
+
+    it('toggles on the chevron too, without taking focus from the input', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      const chevron = input().parentElement!.querySelector('.flg-input-adornment')!;
+      expect(chevron).toHaveAttribute('aria-hidden', 'true');
+      // A press on the chevron keeps the input focused (no blur), as a press on Input's frame does.
+      expect(fireEvent.mouseDown(chevron)).toBe(false);
+      fireEvent.pointerDown(chevron);
+      fireEvent.click(chevron, { detail: 1 });
+      expect(input()).toHaveAttribute('aria-expanded', 'true');
+      expect(input()).toHaveFocus();
+      fireEvent.pointerDown(chevron);
+      fireEvent.click(chevron, { detail: 1 });
+      expect(input()).toHaveAttribute('aria-expanded', 'false');
+    });
+
+    it('does not take a press on the input itself away from the input, so the caret is placed', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      expect(fireEvent.mouseDown(input())).toBe(true);
+    });
+
+    it('does nothing for a click when it is disabled', () => {
+      render(
+        <Combobox aria-label="City" disabled>
+          {cities}
+        </Combobox>,
+      );
+      expect(input()).toBeDisabled();
+      fireEvent.click(input(), { detail: 1 });
+      expect(input()).toHaveAttribute('aria-expanded', 'false');
+      expect(input().closest('.flg-combobox')).toHaveAttribute('data-disabled');
+    });
+
+    it('closes when it becomes disabled while open', () => {
+      const { rerender } = render(<Combobox aria-label="City">{cities}</Combobox>);
+      act(() => input().focus());
+      key('ArrowDown');
+      rerender(
+        <Combobox aria-label="City" disabled>
+          {cities}
+        </Combobox>,
+      );
+      expect(input()).toHaveAttribute('aria-expanded', 'false');
+    });
+  });
+
+  describe('leaving the input', () => {
+    function setup(props: Partial<ComponentProps<typeof Combobox>> = {}) {
+      const onValueChange = vi.fn();
+      const onInputValueChange = vi.fn();
+      render(
+        <>
+          <Combobox
+            aria-label="City"
+            defaultValue="hn"
+            onValueChange={onValueChange}
+            onInputValueChange={onInputValueChange}
+            {...props}
+          >
+            {cities}
+          </Combobox>
+          <button type="button">After</button>
+        </>,
+      );
+      act(() => input().focus());
+      return { onValueChange, onInputValueChange };
+    }
+
+    it('closes the listbox', () => {
+      setup();
+      key('ArrowDown');
+      act(() => screen.getByRole('button', { name: 'After' }).focus());
+      expect(input()).toHaveAttribute('aria-expanded', 'false');
+    });
+
+    it('puts the text of the chosen item back when the text was changed', () => {
+      const { onValueChange } = setup();
+      type('xyz');
+      act(() => screen.getByRole('button', { name: 'After' }).focus());
+      expect(input()).toHaveValue('Hà Nội');
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('makes the value null when the text is empty: the way to clear it', () => {
+      const { onValueChange } = setup();
+      type('');
+      act(() => screen.getByRole('button', { name: 'After' }).focus());
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(null);
+      expect(input()).toHaveValue('');
+      expect(input().closest('.flg-combobox')!.querySelector('select')).toHaveValue('');
+    });
+
+    it('puts the text back to nothing when stray text is left and nothing is chosen', () => {
+      const { onValueChange } = setup({ defaultValue: undefined });
+      type('xyz');
+      act(() => screen.getByRole('button', { name: 'After' }).focus());
+      expect(input()).toHaveValue('');
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('does nothing when the text is already the chosen one', () => {
+      const { onValueChange, onInputValueChange } = setup();
+      act(() => screen.getByRole('button', { name: 'After' }).focus());
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(onInputValueChange).not.toHaveBeenCalled();
+    });
+  });
+
+  describe('the value and the text', () => {
+    it('shows the text of defaultValue, and of defaultInputValue when given', () => {
+      const { unmount } = render(
+        <Combobox aria-label="City" defaultValue="hue">
+          {cities}
+        </Combobox>,
+      );
+      expect(input()).toHaveValue('Huế');
+      unmount();
+      render(
+        <Combobox aria-label="City" defaultInputValue="hu">
+          {cities}
+        </Combobox>,
+      );
+      expect(input()).toHaveValue('hu');
+    });
+
+    it('shows nothing for a null value, and a placeholder', () => {
+      render(
+        <Combobox aria-label="City" value={null} placeholder="Choose a city">
+          {cities}
+        </Combobox>,
+      );
+      expect(input()).toHaveValue('');
+      expect(input()).toHaveAttribute('placeholder', 'Choose a city');
+    });
+
+    it('reports a choice, and keeps the old value when a controlled parent refuses', () => {
+      const onValueChange = vi.fn();
+      render(
+        <Combobox aria-label="City" value="hn" onValueChange={onValueChange}>
+          {cities}
+        </Combobox>,
+      );
+      act(() => input().focus());
+      key('ArrowDown');
+      fireEvent.click(option('Huế'));
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('hue');
+      // The parent kept "hn": leaving puts its text back.
+      act(() => input().blur());
+      expect(input()).toHaveValue('Hà Nội');
+    });
+
+    it('follows a value that the parent changes, and tells onInputValueChange of the new text', () => {
+      const onInputValueChange = vi.fn();
+      const onValueChange = vi.fn();
+      const { rerender } = render(
+        <Combobox
+          aria-label="City"
+          value="hn"
+          onValueChange={onValueChange}
+          onInputValueChange={onInputValueChange}
+        >
+          {cities}
+        </Combobox>,
+      );
+      rerender(
+        <Combobox
+          aria-label="City"
+          value="dn"
+          onValueChange={onValueChange}
+          onInputValueChange={onInputValueChange}
+        >
+          {cities}
+        </Combobox>,
+      );
+      expect(input()).toHaveValue('Đà Nẵng');
+      expect(onInputValueChange).toHaveBeenCalledExactlyOnceWith('Đà Nẵng');
+      // A change by the parent is not the user's: no onValueChange.
+      expect(onValueChange).not.toHaveBeenCalled();
+      rerender(
+        <Combobox aria-label="City" value={null} onValueChange={onValueChange}>
+          {cities}
+        </Combobox>,
+      );
+      expect(input()).toHaveValue('');
+    });
+
+    it('takes the text of an item that arrives after the value', () => {
+      vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const { rerender } = render(
+        <Combobox aria-label="City" value="hn">
+          {null}
+        </Combobox>,
+      );
+      expect(input()).toHaveValue('');
+      rerender(
+        <Combobox aria-label="City" value="hn">
+          {cities}
+        </Combobox>,
+      );
+      expect(input()).toHaveValue('Hà Nội');
+    });
+
+    it('controls the text with inputValue, reporting what is typed and what it changes itself', () => {
+      const onInputValueChange = vi.fn();
+      function Controlled() {
+        const [text, setText] = useState('');
+        return (
+          <Combobox
+            aria-label="City"
+            inputValue={text}
+            onInputValueChange={(next) => {
+              onInputValueChange(next);
+              setText(next);
+            }}
+          >
+            {cities}
+          </Combobox>
+        );
+      }
+      render(<Controlled />);
+      type('hu');
+      expect(onInputValueChange).toHaveBeenLastCalledWith('hu');
+      key('ArrowDown');
+      key('Enter');
+      expect(onInputValueChange).toHaveBeenLastCalledWith('Huế');
+      expect(input()).toHaveValue('Huế');
+    });
+
+    it('lets a parent that keeps inputValue keep it', () => {
+      render(
+        <Combobox aria-label="City" inputValue="fixed" onInputValueChange={() => {}}>
+          {cities}
+        </Combobox>,
+      );
+      type('hu');
+      expect(input()).toHaveValue('fixed');
+    });
+
+    it('chooses the item that is already chosen again, with the text put back', () => {
+      const onValueChange = vi.fn();
+      render(
+        <Combobox aria-label="City" defaultValue="hn" onValueChange={onValueChange}>
+          {cities}
+        </Combobox>,
+      );
+      act(() => input().focus());
+      type('ha');
+      fireEvent.click(option('Hà Nội'));
+      expect(input()).toHaveValue('Hà Nội');
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('marks the chosen option with aria-selected', () => {
+      render(
+        <Combobox aria-label="City" defaultValue="dn">
+          {cities}
+        </Combobox>,
+      );
+      act(() => input().focus());
+      key('ArrowDown');
+      expect(option('Đà Nẵng')).toHaveAttribute('aria-selected', 'true');
+      expect(option('Hà Nội')).toHaveAttribute('aria-selected', 'false');
+      // Only forced colours show the check mark of the chosen one.
+      expect(option('Đà Nẵng').querySelector('.flg-combobox-check')).not.toBeNull();
+      expect(option('Hà Nội').querySelector('.flg-combobox-check')).toBeNull();
+    });
+
+    it('follows a controlled open, and reports the closing a choice asks for', () => {
+      const onOpenChange = vi.fn();
+      render(
+        <Combobox aria-label="City" open onOpenChange={onOpenChange}>
+          {cities}
+        </Combobox>,
+      );
+      expect(input()).toHaveAttribute('aria-expanded', 'true');
+      expect(optionTexts()).toHaveLength(4);
+      fireEvent.click(option('Huế'));
+      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
+    });
+
+    it('filters by the text it already has when it is opened by its parent', () => {
+      render(
+        <Combobox aria-label="City" open defaultInputValue="hu" onOpenChange={() => {}}>
+          {cities}
+        </Combobox>,
+      );
+      expect(optionTexts()).toEqual(['Huế']);
+    });
+  });
+
+  describe('in a form', () => {
+    function FormOf(props: Partial<ComponentProps<typeof Combobox>> = {}) {
+      return (
+        <form>
+          <Combobox aria-label="City" name="city" {...props}>
+            {cities}
+          </Combobox>
+        </form>
+      );
+    }
+    const dataOf = (form: HTMLFormElement) => new FormData(form).get('city');
+
+    it('submits the value through the hidden select, and the empty string when nothing is chosen', () => {
+      const { container } = render(<FormOf defaultValue="dn" />);
+      const form = container.querySelector('form')!;
+      expect(dataOf(form)).toBe('dn');
+      const native = form.querySelector('select')!;
+      expect(native).toHaveAttribute('aria-hidden', 'true');
+      expect(native).toHaveAttribute('tabindex', '-1');
+      expect(native).toHaveClass('flg-select-native');
+      expect(input()).not.toHaveAttribute('name');
+      act(() => input().focus());
+      type('');
+      act(() => input().blur());
+      expect(dataOf(form)).toBe('');
+    });
+
+    it('follows a choice made by the user', () => {
+      const { container } = render(<FormOf />);
+      act(() => input().focus());
+      key('ArrowDown');
+      key('ArrowDown');
+      key('Enter');
+      expect(dataOf(container.querySelector('form')!)).toBe('dn');
+      expect(container.querySelector('select')!.options).toHaveLength(2);
+    });
+
+    it('is left out of FormData when disabled', () => {
+      const { container } = render(<FormOf defaultValue="dn" disabled />);
+      expect(dataOf(container.querySelector('form')!)).toBeNull();
+      expect(container.querySelector('select')).toBeDisabled();
+    });
+
+    it('stops the submit while required and empty, on the hidden select, not on the input', () => {
+      const { container } = render(<FormOf required />);
+      const form = container.querySelector('form')!;
+      expect(container.querySelector('select')).toBeRequired();
+      expect(input()).not.toHaveAttribute('required');
+      expect(form.checkValidity()).toBe(false);
+      act(() => input().focus());
+      key('ArrowDown');
+      key('Enter');
+      expect(form.checkValidity()).toBe(true);
+    });
+
+    it('does not count stray text as a value', () => {
+      const { container } = render(<FormOf required />);
+      type('abc');
+      expect(container.querySelector('form')!.checkValidity()).toBe(false);
+    });
+
+    it('sends focus to the input when the browser focuses the hidden select', () => {
+      const { container } = render(<FormOf required />);
+      act(() => container.querySelector('select')!.focus());
+      expect(input()).toHaveFocus();
+    });
+
+    it('resets an uncontrolled value to defaultValue, and the text to that of the item', async () => {
+      const { container } = render(<FormOf defaultValue="hn" />);
+      const form = container.querySelector('form')!;
+      act(() => input().focus());
+      key('ArrowDown');
+      key('ArrowDown');
+      key('Enter');
+      expect(input()).toHaveValue('Đà Nẵng');
+      expect(dataOf(form)).toBe('dn');
+      form.reset();
+      await aTaskLater();
+      expect(input()).toHaveValue('Hà Nội');
+      expect(dataOf(form)).toBe('hn');
+    });
+
+    it('resets typed text that was never chosen back to the text of the default', async () => {
+      const { container } = render(<FormOf defaultValue="hn" />);
+      act(() => input().focus());
+      type('xyz');
+      container.querySelector('form')!.reset();
+      await aTaskLater();
+      expect(input()).toHaveValue('Hà Nội');
+    });
+
+    it('keeps its value when the reset is cancelled', async () => {
+      let allowReset = false;
+      render(
+        <form
+          onReset={(event) => {
+            if (!allowReset) event.preventDefault();
+          }}
+        >
+          <Combobox aria-label="City" name="city" defaultValue="hn">
+            {cities}
+          </Combobox>
+        </form>,
+      );
+      const form = input().closest('form')!;
+      act(() => input().focus());
+      key('ArrowDown');
+      key('ArrowDown');
+      key('Enter');
+      form.reset();
+      await aTaskLater();
+      expect(input()).toHaveValue('Đà Nẵng');
+      expect(dataOf(form)).toBe('dn');
+      allowReset = true;
+      form.reset();
+      await aTaskLater();
+      expect(input()).toHaveValue('Hà Nội');
+      expect(dataOf(form)).toBe('hn');
+    });
+
+    it('keeps a controlled value on reset, and puts the hidden select back in step with it', async () => {
+      const { container } = render(<FormOf value="dn" onValueChange={() => {}} />);
+      const form = container.querySelector('form')!;
+      form.reset();
+      await aTaskLater();
+      expect(input()).toHaveValue('Đà Nẵng');
+      expect(dataOf(form)).toBe('dn');
+    });
+  });
+
+  describe('dev warnings', () => {
+    it('warns about children it cannot read, and skips them', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(
+        <Combobox aria-label="City" defaultOpen>
+          <ComboboxItem value="hn">Hà Nội</ComboboxItem>
+          <Wrapper>
+            <ComboboxItem value="dn">Đà Nẵng</ComboboxItem>
+          </Wrapper>
+        </Combobox>,
+      );
+      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/reads only ComboboxItem/));
+      expect(optionTexts()).toEqual(['Hà Nội']);
+    });
+
+    it('warns about an empty value and about one that is not a string', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(
+        <Combobox aria-label="City">
+          <ComboboxItem value="">Nothing</ComboboxItem>
+          <ComboboxItem value={5 as unknown as string}>Five</ComboboxItem>
+        </Combobox>,
+      );
+      expect(warn).toHaveBeenCalledWith(
+        expect.stringMatching(/ComboboxItem> needs a value that is not empty/),
+      );
+      expect(warn).toHaveBeenCalledWith(
+        expect.stringMatching(/ComboboxItem> needs a value that is a string/),
+      );
+    });
+
+    it('warns about a value that matches no item', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(
+        <Combobox aria-label="City" defaultValue="sg">
+          {cities}
+        </Combobox>,
+      );
+      expect(warn).toHaveBeenCalledWith(
+        '[fl-glass-ui] <Combobox> has a value that matches no ComboboxItem: "sg".',
+      );
+      expect(input()).toHaveValue('');
+    });
+
+    it('warns when a part is rendered outside a Combobox', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(
+        <>
+          <ComboboxItem value="a">A</ComboboxItem>
+          <ComboboxGroup label="G" />
+          <ComboboxSeparator />
+        </>,
+      );
+      for (const part of ['ComboboxItem', 'ComboboxGroup', 'ComboboxSeparator']) {
+        expect(warn).toHaveBeenCalledWith(
+          `[fl-glass-ui] <${part}> must be rendered inside a <Combobox>.`,
+        );
+      }
+    });
+
+    it('names the prop that switches between controlled and not', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const { rerender } = render(
+        <Combobox aria-label="City" defaultValue="hn">
+          {cities}
+        </Combobox>,
+      );
+      rerender(
+        <Combobox
+          aria-label="City"
+          value="hn"
+          inputValue="Hà Nội"
+          open={false}
+          onValueChange={() => {}}
+        >
+          {cities}
+        </Combobox>,
+      );
+      expect(warn).toHaveBeenCalledWith(
+        expect.stringMatching(/\] Combobox value is changing from/),
+      );
+      expect(warn).toHaveBeenCalledWith(
+        expect.stringMatching(/\] Combobox inputValue is changing from/),
+      );
+      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/\] Combobox open is changing from/));
+    });
+  });
+});
diff --git a/src/components/combobox/match.test.ts b/src/components/combobox/match.test.ts
new file mode 100644
index 0000000..808b76a
--- /dev/null
+++ b/src/components/combobox/match.test.ts
@@ -0,0 +1,54 @@
+import { describe, expect, it } from 'vitest';
+import { defaultFilter, findMatch, foldText } from './match';
+
+describe('foldText', () => {
+  it('lower cases, removes diacritics, and turns đ into d', () => {
+    expect(foldText('Đường Hà Nội')).toBe('duong ha noi');
+    expect(foldText('ĐÀ NẴNG')).toBe('da nang');
+  });
+});
+
+describe('defaultFilter', () => {
+  it('finds Vietnamese text with a folded query', () => {
+    expect(defaultFilter({ value: 'hn', textValue: 'Hà Nội' }, 'ha noi')).toBe(true);
+    expect(defaultFilter({ value: 'dn', textValue: 'Đà Nẵng' }, 'da nang')).toBe(true);
+    expect(defaultFilter({ value: 'da', textValue: 'Đà Nẵng' }, 'DA')).toBe(true);
+    expect(defaultFilter({ value: 'hue', textValue: 'Huế' }, 'huê')).toBe(true);
+  });
+
+  it('is true for an empty input and for an input of only combining marks', () => {
+    expect(defaultFilter({ value: 'hn', textValue: 'Hà Nội' }, '')).toBe(true);
+    expect(defaultFilter({ value: 'hn', textValue: 'Hà Nội' }, '\u0301')).toBe(true);
+    expect(defaultFilter({ value: 'hn', textValue: 'Hà Nội' }, 'xyz')).toBe(false);
+  });
+
+  it('compares textValue, not value', () => {
+    expect(defaultFilter({ value: 'hn', textValue: 'Hà Nội' }, 'hn')).toBe(false);
+  });
+});
+
+describe('findMatch', () => {
+  it('returns the first match as UTF-16 indices into the original text', () => {
+    expect(findMatch('Hà Nội', 'ha')).toEqual({ start: 0, end: 2 });
+    expect(findMatch('Thành phố Hà Nội', 'ha noi')).toEqual({ start: 10, end: 16 });
+    expect(findMatch('Đà Nẵng', 'nang')).toEqual({ start: 3, end: 7 });
+  });
+
+  it('the first occurrence wins', () => {
+    expect(findMatch('Ha Ha', 'ha')).toEqual({ start: 0, end: 2 });
+  });
+
+  it('covers combining marks that follow the last matched character', () => {
+    expect(findMatch('Ha\u0300 Noi', 'ha')).toEqual({ start: 0, end: 3 });
+  });
+
+  it('keeps indices right when a surrogate pair precedes the match', () => {
+    expect(findMatch('😀 Hà', 'ha')).toEqual({ start: 3, end: 5 });
+  });
+
+  it('returns null for an empty query, a query of only marks, and no occurrence', () => {
+    expect(findMatch('Hà Nội', '')).toBeNull();
+    expect(findMatch('Hà Nội', '\u0301')).toBeNull();
+    expect(findMatch('Hà Nội', 'xyz')).toBeNull();
+  });
+});
diff --git a/src/index.test.ts b/src/index.test.ts
index ed164fd..5932dab 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -21,6 +21,10 @@ describe('public API', () => {
       'CardHeader',
       'CardTitle',
       'Checkbox',
+      'Combobox',
+      'ComboboxGroup',
+      'ComboboxItem',
+      'ComboboxSeparator',
       'ContextMenu',
       'ContextMenuContent',
       'ContextMenuTrigger',
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/combobox src/index.test.ts
```

Expected: FAIL.
- `Combobox.test.tsx` fail cả file: `Failed to resolve import "./Combobox" from "src/components/combobox/Combobox.test.tsx"`. `Combobox.test-d.ts` lỗi kiểu vì module chưa có.
- `match.test.ts` fail cả file vì `./match` chưa có (bản nháp ghi `Cannot find module './match'`).
- `src/index.test.ts` fail vì danh sách export có `Combobox`, `ComboboxGroup`, `ComboboxItem`, `ComboboxSeparator` mà `src/index.ts` chưa có.

Không test nào được thấy fail vì lý do riêng (phát hiện 15). Ở bản nháp, khi có code, 79 trong 81 test của `Combobox.test.tsx` pass ngay. Hai test sai (một `getByLabelText` khớp cả listbox, một `getByRole('group')` trên popover mà jsdom ẩn) được sửa trong test.

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
index e4ee753..cf899d1 100644
--- a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
+++ b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
@@ -724,7 +724,7 @@ ComboboxSeparatorProps = Record<string, never>;
   ```
 
   - Listbox và option dùng đúng class của Select (`flg-menu`, `flg-select-listbox`, `flg-menu-item`, `flg-select-option`), nên dùng lại giao diện của Select.
-  - Dòng trạng thái ("No results", "Loading…") là một `<div role="presentation">` trong listbox. Khi không còn option nào, ô nhập có `aria-expanded="false"` và không có `aria-controls`, dù dòng trạng thái đang hiện: không có listbox nào để trỏ tới. Vùng live đọc lời trạng thái (Claude chốt).
+  - Dòng trạng thái ("No results", "Loading…") là một `<div role="presentation">` trong listbox. Khi không còn option nào, ô nhập có `aria-expanded="false"` và không có `aria-controls`, dù dòng trạng thái đang hiện: không có listbox nào để trỏ tới. Vùng live đọc lời trạng thái (Claude chốt). Khi chỉ còn dòng trạng thái, panel bỏ `role="listbox"` và tên của nó, vì một listbox phải chứa option (axe `aria-required-children`); có option trở lại thì role và tên trở lại (phát hiện khi lập Plan B).
   - Nhóm và đường phân cách như Select: nhóm là `role="group"` có `aria-labelledby`, đường phân cách là `<div role="none">`.
   - `ref` trỏ vào ô nhập. `id` và `aria-*` gắn vào ô nhập. Listbox có cùng tên với ô nhập.
 - **Item** được đọc tĩnh từ `children` qua `readRows` (§5), như Select: `ComboboxItem` phải là con trực tiếp, hoặc nằm trong Fragment, mảng hay `ComboboxGroup`. Chữ của item là `textValue`, không có thì là chữ của children.
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 16f6309..4521c96 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -51,6 +51,11 @@ const SHIPPED_CLASSES = [
   'flg-select-ruler',
   'flg-select-box',
   'flg-select-listbox',
+  'flg-combobox',
+  'flg-combobox-chevron',
+  'flg-combobox-match',
+  'flg-combobox-status',
+  'flg-combobox-check',
   'flg-tabs',
   'flg-tabs-list',
   'flg-tabs-trigger',
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index 068a91f..dc853a2 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -21,6 +21,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/dropdown-menu/DropdownMenu.tsx',
   'src/components/context-menu/ContextMenu.tsx',
   'src/components/select/Select.tsx',
+  'src/components/combobox/Combobox.tsx',
   'src/components/tabs/Tabs.tsx',
   'src/components/segmented-control/SegmentedControl.tsx',
   'src/components/segmented-control/SegmentedControlItem.tsx',
diff --git a/src/components/combobox/Combobox.mdx b/src/components/combobox/Combobox.mdx
new file mode 100644
index 0000000..4c816bb
--- /dev/null
+++ b/src/components/combobox/Combobox.mdx
@@ -0,0 +1,154 @@
+import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './Combobox.stories';
+
+<Meta of={Stories} />
+
+# Combobox
+
+```tsx
+import { Combobox, ComboboxItem, Field } from 'fl-glass-ui';
+
+<Field label="City">
+  <Combobox name="city" placeholder="Search a city…" defaultValue="hn">
+    <ComboboxItem value="hn">Hà Nội</ComboboxItem>
+    <ComboboxItem value="dn">Đà Nẵng</ComboboxItem>
+    <ComboboxItem value="hue">Huế</ComboboxItem>
+  </Combobox>
+</Field>;
+```
+
+<Canvas of={Stories.Open} />
+<Controls />
+
+A Combobox is a text input with a list of items that narrows as you type. The user picks one item:
+what they type is only a search, and text that matches no item is put back when they leave. Reach
+for a Select when the list is short and needs no search.
+
+## Items
+
+`ComboboxItem` takes a `value` (not empty), `disabled` and `textValue`. `ComboboxGroup` puts items
+under a `label`; `ComboboxSeparator` draws a line between them.
+
+The Combobox reads its items from `children` without rendering them, so the first HTML from the
+server already shows the text of the chosen item and carries it in the hidden native `<select>`.
+Put `ComboboxItem` directly inside the Combobox, or inside Fragments, arrays or a `ComboboxGroup`.
+A component of your own that wraps a `ComboboxItem` is not looked into: it is skipped, with a
+warning in development.
+
+`textValue` is the text the filter matches and the input shows once the item is chosen. It defaults
+to the item's text, so set it when the item shows something other than text.
+
+## Filtering
+
+By default an item matches when its text contains what was typed, ignoring case and diacritics:
+"ha noi" finds "Hà Nội" and "da nang" finds "Đà Nẵng". The first match in each item is shown in
+bold, and the rest of the item is muted. A group with no item left hides, and so do the separators
+that would then lead, trail or meet.
+
+Only text the user types filters. Opening the list with a key or a press shows every item, whatever
+the input says, and points at the chosen one.
+
+- **`filter`** takes a function of the item (`{ value, textValue }`) and the text, and replaces the
+  default. Nothing is shown in bold then, since the Combobox does not know what the function
+  matched.
+- **`filter={false}`** shows every item, for a list the app filters itself, such as one loaded from
+  a server in `onInputValueChange`. Nothing is shown in bold.
+
+The bold match needs the default filter and an item whose children are plain text. An item that
+shows an element (an icon, an avatar) is filtered as usual but not marked.
+
+<Canvas of={Stories.Empty} />
+
+When no item is left the list shows "No results" (`labels.noResults`). That row is no option, so the
+input reports the listbox as collapsed (`aria-expanded="false"`, no `aria-controls`).
+
+## Clearing the value
+
+There is no clear button. Delete the text and leave the input (Tab, or a click elsewhere): the value
+becomes `null` and `onValueChange` is called with it. Any other text that is not the chosen item's
+is put back when the user leaves, and Esc, with the list closed, puts it back at once.
+
+## Controlled use
+
+`value` is the value of the chosen item, or `null` for none; `onValueChange` is called with the
+value the user chooses, or `null` when they clear the text. It is not called when the parent changes
+`value` itself. `inputValue` and `onInputValueChange` do the same for the text; the Combobox
+reports the text it changes itself (a choice, text put back, a reset) as well as what the user
+types. `open` and `onOpenChange` control the list.
+
+A text that follows a controlled `value` needs no `inputValue`: when `value` changes, the input shows
+the new item's text.
+
+## In a form
+
+A hidden native `<select>` lies under the input and follows the value, so the Combobox takes part in
+forms like a native control:
+
+- **FormData:** the value of the chosen item is submitted under `name`; with nothing chosen, an
+  empty string. The text in the input is never submitted.
+- **`required`:** an empty Combobox stops the submit, and what is typed does not count: only a
+  chosen item does. The browser's message points at the input, and focus goes to the input.
+- **Reset:** a form reset puts an uncontrolled Combobox back to `defaultValue` and to that item's
+  text, unless an `onReset` handler cancels the reset with `preventDefault()`. A controlled
+  Combobox keeps its value, like a controlled React input.
+- **Disabled:** a disabled Combobox is not submitted.
+
+Inside a `Field`, the label names the input, and the description and error are announced with it.
+The Field's `required`, `disabled` and error apply to it.
+
+## Keyboard
+
+Focus stays on the input; the input tells assistive technology which option is highlighted, and
+typing never highlights or chooses one.
+
+| Key             | Closed                                           | Open                                                   |
+| --------------- | ------------------------------------------------ | ------------------------------------------------------ |
+| A character     | Filters, and opens the list                      | Filters; the highlight goes                            |
+| ↓ / ↑           | Opens it on the chosen item, or the first / last | Next / previous item, stopping at the ends             |
+| Alt+↓ / Alt+↑   | Opens it with nothing highlighted                | Closes it, keeping the text                            |
+| Enter           | Submits the form, as in any input                | Chooses the highlighted item and closes; never submits |
+| Esc             | Puts the chosen item's text back (see below)     | Closes it without changing anything                    |
+| Tab             |                                                  | Closes it, chooses nothing, and focus moves on         |
+| ←, →, Home, End | Move the caret                                   | Move the caret, and the highlight goes                 |
+
+Esc on a closed list does something only when the text differs from the chosen item's. When there
+is nothing to put back it is left alone, so a Dialog around the Combobox closes on it.
+
+## Pointer
+
+A press on the input or the chevron opens the list, and a press on the open input closes it, as a
+native `<datalist>` does: the browser dismisses the list on any press outside it, the input
+included. Typing opens it again. A press on an option chooses it, and a press in the list never
+takes focus from the input.
+
+<Canvas of={Stories.Look} />
+
+## Placement and size
+
+The list opens 6px below the input, at least as wide as it, and at most 320px tall (less when the
+room below or above is smaller); past that it scrolls. It flips above the input when there is no
+room below. A Combobox is as wide as its container; give it a width with `style` or `className`
+where it should be narrower. `size` is `"sm"`, `"md"` (default) or `"lg"`, as for an Input.
+
+## Accessibility
+
+- The input is a `combobox` with `aria-autocomplete="list"`, and the list a `listbox` with the
+  input's name, following the APG combobox with list autocomplete and manual selection pattern.
+- The highlighted option is named in `aria-activedescendant`. With no option shown, there is no
+  listbox to point at, so `aria-expanded` is `false` and `aria-controls` is absent.
+- The options exist only while the list is open.
+- Disabled options are announced and skipped by the keyboard.
+- The highlighted option uses the same accent wash as a menu item; see rows 8 and 9 on the
+  Accessibility page.
+- With forced colors, the chosen option shows a check mark at the end of its row, and the match
+  stays bold.
+
+## Do and don't
+
+- Do use a Combobox to pick one value from a list long enough to need a search.
+- Do give an item that shows more than text a `textValue`.
+- Don't use it for free text: the value is always an item. A field that takes any text is an
+  Input.
+- Don't use it for a short list that needs no search; use a Select.
+- Don't put thousands of items in it: the list is not virtualised. Filter on the server with
+  `filter={false}`.
diff --git a/src/components/combobox/Combobox.tsx b/src/components/combobox/Combobox.tsx
new file mode 100644
index 0000000..f62c82b
--- /dev/null
+++ b/src/components/combobox/Combobox.tsx
@@ -0,0 +1,645 @@
+'use client';
+
+import { clsx } from 'clsx';
+import { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react';
+import type {
+  ChangeEvent,
+  CSSProperties,
+  FocusEvent,
+  KeyboardEvent,
+  MouseEvent,
+  ReactElement,
+  ReactNode,
+} from 'react';
+import { markPart } from '../../internal/collect-children';
+import { dataAttr } from '../../internal/data-attr';
+import { markAsFieldControl, useFieldContext, useFieldProps } from '../../internal/field-context';
+import { CheckIcon, ChevronIcon } from '../../internal/icons';
+import { readRows } from '../../internal/list-rows';
+import type { ListParts, Option, Row } from '../../internal/list-rows';
+import { mergeRefs } from '../../internal/merge-refs';
+import { getNextIndex } from '../../internal/roving';
+import { useControllableState } from '../../internal/use-controllable-state';
+import { useFloating } from '../../internal/use-floating';
+import { useFormReset } from '../../internal/use-form-reset';
+import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
+import { usePopover } from '../../internal/use-popover';
+import { usePopoverState, useTriggerPress } from '../../internal/use-popover-trigger';
+import { useWriteOnCommit } from '../../internal/use-write-on-commit';
+import { devWarn, isProduction } from '../../internal/warn';
+import { defaultFilter, findMatch } from './match';
+
+const COMBOBOX_PARTS: ListParts = {
+  item: 'combobox-item',
+  group: 'combobox-group',
+  separator: 'combobox-separator',
+  owner: 'Combobox',
+};
+
+/** What a `filter` function is given: the item, by its value and its text. */
+export interface ComboboxFilterItem {
+  value: string;
+  textValue: string;
+}
+
+export interface ComboboxProps {
+  /** The chosen item's value; `null` chooses nothing. Pass it with `onValueChange` to control it. */
+  value?: string | null;
+  /** The chosen item's value at first, when uncontrolled. */
+  defaultValue?: string;
+  /** Called with the value the user chooses, or `null` when they clear the text and leave. */
+  onValueChange?: (value: string | null) => void;
+  /** The text in the input. Pass it with `onInputValueChange` to control it. */
+  inputValue?: string;
+  /** The text at first, when uncontrolled. Default: the text of the chosen item. */
+  defaultInputValue?: string;
+  /** Called with the text whenever it changes: typed by the user, or changed by the Combobox. */
+  onInputValueChange?: (text: string) => void;
+  /** Whether the listbox is open. Pass it with `onOpenChange` to control it. */
+  open?: boolean;
+  /** Whether the listbox starts open, when uncontrolled. */
+  defaultOpen?: boolean;
+  /** Called with the new state whenever the listbox opens or closes. */
+  onOpenChange?: (open: boolean) => void;
+  /**
+   * Which items match the text typed. Default: the item's text contains it, ignoring case and
+   * diacritics. `false` shows every item, for a list the app filters itself.
+   */
+  filter?: ((item: ComboboxFilterItem, inputValue: string) => boolean) | false;
+  /** Shown, muted, while the input is empty. */
+  placeholder?: string;
+  required?: boolean;
+  disabled?: boolean;
+  /** Marks the value as wrong. Inside a Field with an error this is already true. */
+  invalid?: boolean;
+  /** The name the value is submitted under, through a hidden native `<select>`. */
+  name?: string;
+  size?: 'sm' | 'md' | 'lg';
+  /** The input's id. */
+  id?: string;
+  /** On the element around the input. */
+  className?: string;
+  /** On the element around the input. */
+  style?: CSSProperties;
+  'aria-label'?: string;
+  'aria-labelledby'?: string;
+  'aria-describedby'?: string;
+  /** The words the Combobox shows. Default `{ noResults: "No results" }`. */
+  labels?: { noResults?: string };
+  /** `ComboboxItem`, `ComboboxGroup` and `ComboboxSeparator`, read without rendering them. */
+  children: ReactNode;
+}
+
+export interface ComboboxItemProps {
+  /** Not empty: an empty value is how the native `<select>` says nothing is chosen. */
+  value: string;
+  disabled?: boolean;
+  /** The text the filter matches and the input shows once chosen. Default: the item's text. */
+  textValue?: string;
+  children?: ReactNode;
+}
+
+export interface ComboboxGroupProps {
+  /** Names the group. */
+  label: ReactNode;
+  children?: ReactNode;
+}
+
+/** Takes no props. */
+export type ComboboxSeparatorProps = Record<string, never>;
+
+const OUTSIDE = (part: string) => `<${part}> must be rendered inside a <Combobox>.`;
+
+const CHEVRON = <ChevronIcon className="flg-select-chevron" direction="down" />;
+// Only forced colours show it (combobox.css): the chosen option has no other mark there.
+const CHECK = (
+  <span className="flg-combobox-check" aria-hidden="true">
+    <CheckIcon />
+  </span>
+);
+
+/** The options of `rows`, in list order. */
+function optionsOf(rows: Row[]): Option[] {
+  return rows.flatMap((row) =>
+    row.kind === 'option' ? [row.option] : row.kind === 'group' ? optionsOf(row.rows) : [],
+  );
+}
+
+/**
+ * The rows whose options `keep` accepts. A group with none left goes, and so does every separator
+ * that would lead, trail or follow another.
+ */
+function filterRows(rows: Row[], keep: (option: Option) => boolean): Row[] {
+  const out: Row[] = [];
+  const add = (row: Row) => {
+    const last = out[out.length - 1];
+    if (row.kind === 'separator' && (last === undefined || last.kind === 'separator')) return;
+    out.push(row);
+  };
+  for (const row of rows) {
+    if (row.kind === 'option') {
+      if (keep(row.option)) add(row);
+    } else if (row.kind === 'group') {
+      const inner = filterRows(row.rows, keep);
+      if (inner.length > 0) add({ ...row, rows: inner });
+    } else {
+      add(row);
+    }
+  }
+  if (out[out.length - 1]?.kind === 'separator') out.pop();
+  return out;
+}
+
+/** The text of an option with the first match of the typed text in bold. */
+function withMatch(option: Option, query: string): ReactNode {
+  const text = option.children;
+  // Only plain text can be cut: an element would need to be looked into. And only text that is the
+  // item's own (no other `textValue`), or the positions found would not be the shown text's.
+  if (typeof text !== 'string' || text !== option.text) return text;
+  const match = findMatch(text, query);
+  if (!match) return text;
+  return (
+    <>
+      {text.slice(0, match.start)}
+      <span className="flg-combobox-match">{text.slice(match.start, match.end)}</span>
+      {text.slice(match.end)}
+    </>
+  );
+}
+
+/**
+ * A text input with a listbox that filters as you type, and a hidden native `<select>` that takes
+ * part in forms (FormData, `required`, reset). The user chooses an item: text that matches none is
+ * put back when they leave. `ref` is the input; `className` and `style` go on the element around it.
+ */
+export const Combobox = markAsFieldControl(
+  forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(props, ref) {
+    const {
+      name,
+      placeholder,
+      size = 'md',
+      filter,
+      className,
+      style,
+      children,
+      labels,
+      'aria-label': ariaLabel,
+      'aria-labelledby': ariaLabelledBy,
+    } = props;
+    const field = useFieldContext();
+    const fieldProps = useFieldProps({
+      id: props.id,
+      invalid: props.invalid,
+      required: props.required,
+      disabled: props.disabled,
+      'aria-describedby': props['aria-describedby'],
+    });
+    const { invalid, required = false, disabled = false } = fieldProps;
+    const noResults = labels?.noResults ?? 'No results';
+
+    // --- Items, read from children without rendering them; again only when the children change.
+    const { rows, options } = useMemo(() => readRows(children, COMBOBOX_PARTS), [children]);
+
+    // --- Value, and the text that stands for it.
+    const [value, setValue, resetValue] = useControllableState<string | null>({
+      value: props.value,
+      defaultValue: props.defaultValue ?? null,
+      onChange: props.onValueChange,
+      name: 'Combobox value',
+    });
+    const chosen = options.find((option) => option.value === value);
+    const chosenText = chosen?.text ?? '';
+    if (!isProduction() && value !== null && value !== '' && !chosen) {
+      devWarn(`<Combobox> has a value that matches no ComboboxItem: "${value}".`);
+    }
+    const [text, setText] = useControllableState<string>({
+      value: props.inputValue,
+      defaultValue: props.defaultInputValue ?? chosenText,
+      onChange: props.onInputValueChange,
+      name: 'Combobox inputValue',
+    });
+    // A value that changes, or whose item arrives later, brings its text with it. What the user
+    // types does not: the text only follows the value when the value (or its item) is what moved.
+    const syncKey = `${value ?? ''}\u0000${chosenText}`;
+    const syncedKey = useRef(syncKey);
+    useIsoLayoutEffect(() => {
+      if (syncedKey.current === syncKey) return;
+      syncedKey.current = syncKey;
+      setText(chosenText);
+      // `chosenText` is part of the key; only a change of the key matters.
+    }, [syncKey]);
+
+    // --- Open state, the typed text that filters, and the highlighted option (its index in the whole
+    // list, not in what is left of it).
+    const { open, request, report, contentRef, pendingToggle } = usePopoverState<HTMLDivElement>({
+      open: props.open,
+      defaultOpen: props.defaultOpen ?? false,
+      onOpenChange: props.onOpenChange,
+      name: 'Combobox open',
+    });
+    // The text typed since the listbox opened or since the last choice, or null: then every item
+    // shows (opened by a key or a press, or just chosen).
+    const [query, setQuery] = useState<string | null>(null);
+    const [highlighted, setHighlighted] = useState<number | null>(null);
+    const predicate = filter === false ? null : (filter ?? defaultFilter);
+    const shown = useMemo(
+      () =>
+        query === null || predicate === null
+          ? rows
+          : filterRows(rows, (option) =>
+              predicate({ value: option.value, textValue: option.text }, query),
+            ),
+      [rows, query, predicate],
+    );
+    const visible = useMemo(() => optionsOf(shown), [shown]);
+    // The highlight can outlive its option (the filter or the list changed while open): only an
+    // enabled one that is still shown counts.
+    const active =
+      highlighted !== null &&
+      visible.some((option) => option.index === highlighted && !option.disabled)
+        ? highlighted
+        : null;
+    // The listbox is there to point at only while it holds an option; the status row is not one.
+    const expanded = open && visible.length > 0;
+    // Open with nothing left but the status row, the panel is no listbox: one must hold options.
+    const isListbox = !open || visible.length > 0;
+    const highlightsMatch = filter === undefined && query !== null && query !== '';
+
+    const frameRef = useRef<HTMLDivElement>(null);
+    const inputRef = useRef<HTMLInputElement | null>(null);
+    const mergedRef = useMemo(() => mergeRefs(ref, inputRef), [ref]);
+    const nativeRef = useRef<HTMLSelectElement>(null);
+    const baseId = useId();
+    const listboxId = `${baseId}-listbox`;
+    const optionId = (index: number) => `${baseId}-option-${index}`;
+
+    const flags = visible.map((option) => ({ disabled: option.disabled }));
+    /** The option a key moves to from `from` (an option index, or null for none). */
+    const move = (from: number | null, key: string) => {
+      const at = from === null ? -1 : visible.findIndex((option) => option.index === from);
+      const next = getNextIndex(flags, at, key, { orientation: 'vertical', loop: false });
+      return next === null ? null : visible[next]!.index;
+    };
+    /** Where an opening points: the chosen option, or the first or last that can be chosen. */
+    const startAt = (edge: 'Home' | 'End') =>
+      chosen && !chosen.disabled
+        ? chosen.index
+        : getNextIndex(
+            options.map((option) => ({ disabled: option.disabled })),
+            -1,
+            edge,
+            { orientation: 'vertical', loop: false },
+          );
+
+    // Whether the last change of the highlight came from the keyboard. Only that scrolls the list: a
+    // pointer over an option at the edge must not move what it is pointing at.
+    const keyed = useRef(false);
+    const highlight = (index: number | null, fromKeys: boolean) => {
+      keyed.current = fromKeys;
+      setHighlighted(index);
+    };
+    // Set by an opening the Combobox asks for, read by the effect below, which tells it from one the
+    // parent made (`defaultOpen`, a controlled `open`).
+    const openedByUs = useRef(false);
+    // `typed` filters; null shows every item. An opening scrolls once the listbox is placed
+    // (`onPlaced`), not when it commits.
+    const openAt = (index: number | null, typed: string | null) => {
+      openedByUs.current = true;
+      setQuery(typed);
+      highlight(index, false);
+      request(true);
+    };
+    useIsoLayoutEffect(() => {
+      if (!open) {
+        openedByUs.current = false;
+        setQuery(null);
+        setHighlighted(null);
+        return;
+      }
+      const byUs = openedByUs.current;
+      openedByUs.current = false;
+      // Opened by the parent: text that is not the chosen item's was typed (or given), so it filters.
+      if (!byUs) {
+        setQuery(text !== chosenText ? text : null);
+        highlight(null, false);
+      }
+      // Only an opening or a closing decides this; the query and the highlight change it after that.
+    }, [open]);
+
+    // A Combobox that becomes disabled while open closes, as a native control does.
+    useEffect(() => {
+      if (disabled && open) request(false);
+    }, [disabled, open, request]);
+
+    const choose = (option: Option | undefined) => {
+      if (disabled || !option || option.disabled) return;
+      // A new value brings its text (see `syncKey`); the one already chosen only puts it back.
+      if (option.value === value) setText(option.text);
+      else setValue(option.value);
+      setQuery(null);
+      request(false);
+    };
+
+    // --- Pointer: a press on the input, the chevron or the frame toggles the listbox, as the
+    // trigger of a Select does. The browser light-dismisses an open listbox on any press outside it,
+    // the input included, so a press on the open input closes it; typing opens it again.
+    const press = useTriggerPress(open, (wasOpen) => {
+      if (disabled) return;
+      inputRef.current?.focus({ preventScroll: true });
+      if (wasOpen) request(false);
+      else openAt(startAt('Home'), null);
+    });
+    // A press on the chevron or the padding keeps focus on the input, as a press on Input's frame
+    // focuses it; a press on the input itself places the caret as usual.
+    const handleFrameMouseDown = (event: MouseEvent<HTMLDivElement>) => {
+      if (event.button !== 0 || disabled || event.target === inputRef.current) return;
+      event.preventDefault();
+      inputRef.current?.focus();
+    };
+
+    // --- Keyboard (APG combobox, list autocomplete, manual selection): focus stays on the input,
+    // which points at the highlighted option with aria-activedescendant.
+    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
+      const next = event.target.value;
+      setText(next);
+      if (open) {
+        setQuery(next);
+        highlight(null, false);
+      } else {
+        openAt(null, next);
+      }
+    };
+    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
+      // Keys that pick or move through a composition belong to the input method.
+      if (event.nativeEvent.isComposing) return;
+      const { key } = event;
+      // The caret moves: the highlight no longer says where the user is.
+      if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End') {
+        if (active !== null) highlight(null, false);
+        return;
+      }
+      if (key === 'ArrowDown' || key === 'ArrowUp') {
+        if (event.ctrlKey || event.metaKey) return;
+        event.preventDefault();
+        if (event.altKey) {
+          // Alt+↓ opens without pointing at anything; Alt+↑ closes and keeps the text.
+          if (key === 'ArrowDown' && !open) openAt(null, null);
+          else if (key === 'ArrowUp' && open) request(false);
+        } else if (!open) {
+          openAt(startAt(key === 'ArrowUp' ? 'End' : 'Home'), null);
+        } else if (expanded) {
+          const next = move(active, key);
+          if (next !== null) highlight(next, true);
+        }
+      } else if (key === 'Enter') {
+        // Enter in an open listbox is for the listbox, never for the form. A closed one is left to
+        // the browser, which submits the form.
+        if (!open) return;
+        event.preventDefault();
+        const option = active === null ? undefined : options.find((one) => one.index === active);
+        if (option) choose(option);
+        else request(false);
+      } else if (key === 'Escape') {
+        // An open listbox is closed by the browser. Closed, Esc puts the chosen item's text back, and
+        // is left alone when there is nothing to put back, so that a Dialog around it closes.
+        if (open || text === chosenText) return;
+        event.preventDefault();
+        setText(chosenText);
+      } else if (key === 'Tab') {
+        // Focus moves on as usual, and nothing is chosen. Leaving settles the text (handleBlur).
+        if (open) request(false);
+      }
+    };
+    // All of the listbox's keyboard is on the input, so focus that leaves it any other way (app
+    // code, a screen reader moving on, another window) closes the listbox. A press in the listbox
+    // keeps focus here (see its onMouseDown). Leaving an empty input clears the value, which is how
+    // it is cleared (there is no clear button); any other text that is not the chosen item's goes.
+    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
+      if (contentRef.current?.contains(event.relatedTarget as Node | null)) return;
+      if (open) request(false);
+      if (text === '') setValue(null);
+      else if (text !== chosenText) setText(chosenText);
+    };
+
+    // --- The listbox: a native popover placed under the frame, as wide as it at least.
+    usePopover(contentRef, {
+      open,
+      onOpenChange: report,
+      pendingToggle,
+      restoreFocusTo: () => inputRef.current,
+    });
+    const latest = useRef(active);
+    useWriteOnCommit(() => {
+      latest.current = active;
+    });
+    const scrollToHighlighted = () => {
+      const index = latest.current;
+      if (index === null) return;
+      contentRef.current
+        ?.querySelector<HTMLElement>(`[data-index="${index}"]`)
+        ?.scrollIntoView({ block: 'nearest' });
+    };
+    useFloating({
+      open,
+      reference: () => frameRef.current,
+      floating: contentRef,
+      side: 'bottom',
+      align: 'start',
+      offset: 6,
+      // Also in select.css, so that the first placement measures the capped height.
+      maxHeight: 320,
+      matchWidth: true,
+      onPlaced: scrollToHighlighted,
+    });
+    useIsoLayoutEffect(() => {
+      if (open && keyed.current) scrollToHighlighted();
+      // Only the highlight decides this: an opening scrolls in `onPlaced`, and the flag says whether
+      // the keyboard moved it.
+    }, [highlighted]);
+
+    // --- The hidden native <select>: an empty option and one for the chosen item, kept in step with
+    // the value for forms. Synced again on `resync`: after a form reset, which changes the native
+    // <select> behind React's back (and a controlled parent may keep its value).
+    const [synced, resync] = useState(0);
+    useIsoLayoutEffect(() => {
+      const native = nativeRef.current;
+      if (!native) return;
+      for (const one of Array.from(native.options)) {
+        one.selected = one.value === '' ? !chosen : one.value === chosen?.value;
+      }
+      // `chosen` stands for the value and the items; they are new objects on every read of children.
+    }, [value, chosenText, synced]);
+    // The browser resets the native <select> after the form's reset event: put an uncontrolled
+    // Combobox back to its default value and that value's text, and the native one back in step with
+    // a controlled value. Read at that moment, so it is the state of the last commit.
+    useFormReset(nativeRef, () => {
+      const defaultValue = props.defaultValue ?? null;
+      resetValue(defaultValue);
+      setText(
+        options.find(
+          (option) => option.value === (props.value !== undefined ? value : defaultValue),
+        )?.text ?? '',
+      );
+      resync((count) => count + 1);
+    });
+
+    // --- Names: the listbox has the input's name.
+    const labelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : field?.labelId);
+    const label = labelledBy ? undefined : ariaLabel;
+
+    const renderRows = (list: Row[]): ReactElement[] =>
+      list.map((row) => {
+        if (row.kind === 'separator') {
+          return <div key={row.key} role="none" className="flg-menu-separator" />;
+        }
+        if (row.kind === 'group') {
+          const labelId = `${baseId}-group-${row.key}`;
+          return (
+            <div key={row.key} role="group" aria-labelledby={labelId}>
+              <div id={labelId} role="presentation" className="flg-menu-label">
+                {row.label}
+              </div>
+              {renderRows(row.rows)}
+            </div>
+          );
+        }
+        const { option } = row;
+        const selected = option.value === value;
+        return (
+          // The options take no focus: the input keeps it and points at the highlighted option with
+          // aria-activedescendant, and its keyboard handles them.
+          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
+          <div
+            key={`${option.index}-${option.value}`}
+            id={optionId(option.index)}
+            role="option"
+            aria-selected={selected}
+            aria-disabled={option.disabled || undefined}
+            data-highlighted={dataAttr(active === option.index)}
+            data-index={option.index}
+            className="flg-menu-item flg-select-option"
+            onPointerMove={(event) => {
+              if (event.pointerType !== 'touch' && !option.disabled) highlight(option.index, false);
+            }}
+            onClick={() => choose(option)}
+          >
+            <span>{highlightsMatch ? withMatch(option, query) : option.children}</span>
+            {selected ? CHECK : null}
+          </div>
+        );
+      });
+
+    return (
+      <div
+        className={clsx('flg-combobox', className)}
+        style={style}
+        data-size={size}
+        data-invalid={dataAttr(invalid)}
+        data-disabled={dataAttr(disabled)}
+      >
+        {/* The frame only forwards presses to the input; keyboard users reach the input directly. */}
+        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
+        <div
+          ref={frameRef}
+          className="flg-input"
+          data-size={size}
+          data-invalid={dataAttr(invalid)}
+          data-disabled={dataAttr(disabled)}
+          onMouseDown={handleFrameMouseDown}
+          onPointerDown={press.onPointerDown}
+          onPointerCancel={press.onPointerCancel}
+          onClick={press.onClick}
+        >
+          <input
+            ref={mergedRef}
+            type="text"
+            role="combobox"
+            id={fieldProps.id}
+            autoComplete="off"
+            placeholder={placeholder}
+            value={text}
+            disabled={disabled}
+            aria-autocomplete="list"
+            aria-expanded={expanded}
+            aria-controls={expanded ? listboxId : undefined}
+            aria-activedescendant={expanded && active !== null ? optionId(active) : undefined}
+            aria-label={ariaLabel}
+            aria-labelledby={ariaLabelledBy}
+            aria-describedby={fieldProps['aria-describedby']}
+            aria-invalid={fieldProps['aria-invalid']}
+            aria-required={required || undefined}
+            onChange={handleChange}
+            onKeyDown={handleKeyDown}
+            onBlur={handleBlur}
+          />
+          <span className="flg-input-adornment flg-combobox-chevron" aria-hidden="true">
+            {CHEVRON}
+          </span>
+        </div>
+        <select
+          ref={nativeRef}
+          className="flg-select-native"
+          aria-hidden="true"
+          tabIndex={-1}
+          name={name}
+          required={required}
+          disabled={disabled}
+          defaultValue={chosen?.value ?? ''}
+          // The browser focuses an invalid native control to show its message: the input stands for
+          // it.
+          onFocus={() => inputRef.current?.focus()}
+        >
+          <option value="" />
+          {chosen ? (
+            <option key={chosen.value} value={chosen.value}>
+              {chosen.text}
+            </option>
+          ) : null}
+        </select>
+        {/* No focus here either: the input keeps it (see the options). */}
+        <div
+          ref={contentRef}
+          popover="auto"
+          role={isListbox ? 'listbox' : undefined}
+          id={listboxId}
+          className="flg-surface flg-menu flg-select-listbox"
+          data-filtering={dataAttr(highlightsMatch)}
+          aria-label={isListbox ? label : undefined}
+          aria-labelledby={isListbox ? labelledBy : undefined}
+          // Focus stays on the input: a press in the listbox must not take it.
+          onMouseDown={(event) => event.preventDefault()}
+        >
+          {open ? renderRows(shown) : null}
+          {open && visible.length === 0 ? (
+            <div role="presentation" className="flg-combobox-status">
+              {noResults}
+            </div>
+          ) : null}
+        </div>
+      </div>
+    );
+  }),
+);
+
+/** One item of a Combobox. Read by the Combobox, never rendered on its own. */
+export const ComboboxItem = markPart(function ComboboxItem(props: ComboboxItemProps): null {
+  void props;
+  devWarn(OUTSIDE('ComboboxItem'));
+  return null;
+}, 'combobox-item');
+
+/** Items under a label. Read by the Combobox, never rendered on its own. */
+export const ComboboxGroup = markPart(function ComboboxGroup(props: ComboboxGroupProps): null {
+  void props;
+  devWarn(OUTSIDE('ComboboxGroup'));
+  return null;
+}, 'combobox-group');
+
+/** A line between items. Read by the Combobox, never rendered on its own. */
+export const ComboboxSeparator = markPart(function ComboboxSeparator(
+  props: ComboboxSeparatorProps,
+): null {
+  void props;
+  devWarn(OUTSIDE('ComboboxSeparator'));
+  return null;
+}, 'combobox-separator');
diff --git a/src/components/combobox/index.ts b/src/components/combobox/index.ts
new file mode 100644
index 0000000..e129d00
--- /dev/null
+++ b/src/components/combobox/index.ts
@@ -0,0 +1,8 @@
+export { Combobox, ComboboxGroup, ComboboxItem, ComboboxSeparator } from './Combobox';
+export type {
+  ComboboxFilterItem,
+  ComboboxGroupProps,
+  ComboboxItemProps,
+  ComboboxProps,
+  ComboboxSeparatorProps,
+} from './Combobox';
diff --git a/src/components/combobox/match.ts b/src/components/combobox/match.ts
new file mode 100644
index 0000000..90339f2
--- /dev/null
+++ b/src/components/combobox/match.ts
@@ -0,0 +1,84 @@
+/** Lower case, without diacritics, with đ/Đ as d: the form both sides are compared in. */
+export function foldText(text: string): string {
+  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase();
+}
+
+/** The default filter: true when the folded input is empty or the folded textValue contains it. */
+export function defaultFilter(
+  item: { value: string; textValue: string },
+  inputValue: string,
+): boolean {
+  const foldedInput = foldText(inputValue);
+  if (foldedInput === '') return true;
+  return foldText(item.textValue).includes(foldedInput);
+}
+
+/**
+ * Where the folded query first occurs in the folded text, as UTF-16 indices into the ORIGINAL text.
+ */
+export function findMatch(text: string, query: string): { start: number; end: number } | null {
+  const foldedQuery = foldText(query);
+  if (foldedQuery === '') return null;
+
+  const { folded, map } = foldWithMap(text);
+  const queryChars = [...foldedQuery];
+  const textChars = [...folded];
+
+  let found = -1;
+  for (let i = 0; i <= textChars.length - queryChars.length; i++) {
+    let ok = true;
+    for (let j = 0; j < queryChars.length; j++) {
+      if (textChars[i + j] !== queryChars[j]) {
+        ok = false;
+        break;
+      }
+    }
+    if (ok) {
+      found = i;
+      break;
+    }
+  }
+  if (found === -1) return null;
+
+  const codePoints = [...text];
+  const startCodePoint = map[found];
+  const lastCodePoint = map[found + queryChars.length - 1];
+  if (startCodePoint === undefined || lastCodePoint === undefined) return null;
+  const start = utf16StartOf(codePoints, startCodePoint);
+  let end = utf16StartOf(codePoints, lastCodePoint) + codePoints[lastCodePoint]!.length;
+  for (let k = lastCodePoint + 1; k < codePoints.length; k++) {
+    const ch = codePoints[k];
+    if (ch === undefined || !/\p{M}/u.test(ch)) break;
+    end += ch.length;
+  }
+  return { start, end };
+}
+
+/** The UTF-16 start index of the i-th code point in `codePoints`. */
+function utf16StartOf(codePoints: string[], codePointIndex: number): number {
+  let u16 = 0;
+  for (let i = 0; i < codePointIndex; i++) u16 += codePoints[i]!.length;
+  return u16;
+}
+
+/**
+ * Folds `text` code point by code point (a surrogate pair stays whole), keeping for each folded
+ * character the index of the original code point it came from.
+ */
+function foldWithMap(text: string): { folded: string; map: number[] } {
+  const codePoints = [...text];
+  const map: number[] = [];
+  let folded = '';
+  for (let i = 0; i < codePoints.length; i++) {
+    const ch = codePoints[i]!;
+    let foldedCh = ch.normalize('NFD').replace(/\p{M}/gu, '');
+    if (foldedCh === 'đ' || foldedCh === 'Đ') foldedCh = 'd';
+    foldedCh = foldedCh.toLowerCase();
+    if (foldedCh === '') continue;
+    for (const fc of [...foldedCh]) {
+      map.push(i);
+      folded += fc;
+    }
+  }
+  return { folded, map };
+}
diff --git a/src/index.ts b/src/index.ts
index 3097dbd..90795bf 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -130,6 +130,14 @@ export type {
   SelectSeparatorProps,
   SelectSingleProps,
 } from './components/select';
+export { Combobox, ComboboxGroup, ComboboxItem, ComboboxSeparator } from './components/combobox';
+export type {
+  ComboboxFilterItem,
+  ComboboxGroupProps,
+  ComboboxItemProps,
+  ComboboxProps,
+  ComboboxSeparatorProps,
+} from './components/combobox';
 export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/tabs';
 export { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from './components/breadcrumb';
 export { Pagination } from './components/pagination';
diff --git a/src/styles/components/combobox.css b/src/styles/components/combobox.css
new file mode 100644
index 0000000..e44dccc
--- /dev/null
+++ b/src/styles/components/combobox.css
@@ -0,0 +1,71 @@
+/* Combobox (spec phase 3 §4.3, mockup C1): the frame of Input with a chevron at the end, over the
+   listbox and options of Select (select.css, menu.css). Only what Select does not already give is
+   here: the match in bold, the muted text of an option while filtering, the status row. */
+@layer flg.components {
+  /* As wide as its container, like an Input in a Field. */
+  .flg-combobox {
+    position: relative;
+    display: block;
+    width: 100%;
+    min-width: 0;
+  }
+  /* A press on the chevron toggles the listbox, as on a Select. Input's rule for the adornment's
+     icon (16px) is for icons in general; the chevron is the 15px of a Select's. */
+  .flg-combobox-chevron {
+    cursor: pointer;
+  }
+  .flg-combobox .flg-combobox-chevron > svg {
+    width: 15px;
+    height: 15px;
+  }
+  .flg-combobox .flg-input:has(> input:disabled) .flg-combobox-chevron {
+    cursor: not-allowed;
+  }
+  /* An open listbox marks the frame as a focused Input is marked (mockup C1, as a Select when open).
+     An invalid one keeps its danger border. */
+  .flg-combobox .flg-input:has(> input[aria-expanded='true']) {
+    outline: 2px solid var(--flg-focus-outline-color);
+    outline-offset: 2px;
+    box-shadow: var(--flg-focus-ring);
+  }
+  .flg-combobox:not([data-invalid]) .flg-input:has(> input[aria-expanded='true']) {
+    border-color: var(--flg-accent-solid);
+  }
+  /* While text filters the list, an option is muted and what matches stands out; with nothing typed
+     (opened by a key or a press) it reads as a Select's option does. The highlighted option takes the
+     highlight's text colour whole, the match included, and the match stays bold. */
+  .flg-select-listbox[data-filtering] .flg-select-option {
+    color: var(--flg-text-muted);
+  }
+  .flg-select-listbox[data-filtering] .flg-select-option[data-highlighted] {
+    color: var(--flg-highlight-text);
+  }
+  .flg-combobox-match {
+    color: var(--flg-text);
+    font-weight: var(--flg-weight-semibold);
+  }
+  .flg-select-option[data-highlighted] .flg-combobox-match {
+    color: inherit;
+  }
+  /* "No results": a row that is no option. */
+  .flg-combobox-status {
+    display: flex;
+    align-items: center;
+    justify-content: center;
+    box-sizing: border-box;
+    height: 40px;
+    color: var(--flg-text-muted);
+    font-size: var(--flg-text-sm);
+  }
+  /* The mark of the chosen option for forced colours (preferences.css); a Combobox option has no
+     icon column, so every other mode tells the chosen one by aria-selected alone. */
+  .flg-combobox-check {
+    display: none;
+    flex: none;
+    margin-left: auto;
+  }
+  .flg-combobox-check > svg {
+    width: 15px;
+    height: 15px;
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index 10f8056..c11f9bc 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -22,6 +22,7 @@
 @import './components/tooltip.css';
 @import './components/menu.css';
 @import './components/select.css';
+@import './components/combobox.css';
 @import './components/tabs.css';
 @import './components/segmented-control.css';
 @import './components/number-input.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 26c4d0f..f6e4f7e 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -192,6 +192,12 @@
       background: HighlightText;
       color: Highlight;
     }
+    /* A Combobox: the match stays bold, which the mode leaves alone, and the chosen option, which has
+       no icon column, gets a check at the end of its row: the state needs a mark that is not a
+       colour (spec §4.5). The check takes the row's colour, so it follows a highlighted one. */
+    .flg-select-option[aria-selected='true'] .flg-combobox-check {
+      display: inline-flex;
+    }
     .flg-popover-arrow {
       border-color: CanvasText;
       background: Canvas;
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 --project scripts src/components/combobox src/components/select src/internal src/index.test.ts scripts
pnpm vitest run --project storybook-light --project storybook-dark src/components/combobox
pnpm build && pnpm check:package
```

Expected: 50 file, 588 test PASS, 3 skip; riêng `combobox` 171 test (81 × 2 project, và 9 của `match.test.ts`), cùng 4 test kiểu. Story `combobox` 60 test PASS (10 story × 3 engine × 2 theme), axe chạy sau mỗi play function. `check:package` PASS, gồm `check:use-client`, `check:dist-css` và `size` (JS 34.71 kB trên 35.86 kB, CSS 7.39 kB trên 7.93 kB). Không file nào của Select, Input hay menu đổi; `preferences.css` chỉ thêm selector `.flg-combobox-check` mà component cũ không có, nên ảnh chuẩn cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md \
  scripts/check-dist-css.ts \
  scripts/check-use-client.ts \
  src/components/combobox/Combobox.mdx \
  src/components/combobox/Combobox.stories.tsx \
  src/components/combobox/Combobox.test-d.ts \
  src/components/combobox/Combobox.test.tsx \
  src/components/combobox/Combobox.tsx \
  src/components/combobox/index.ts \
  src/components/combobox/match.test.ts \
  src/components/combobox/match.ts \
  src/index.test.ts \
  src/index.ts \
  src/styles/components/combobox.css \
  src/styles/index.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(combobox): list, filter, keyboard, pointer and form" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 4: Combobox có giá trị tự do, `loading` và thông báo, kèm `useAnnounce`

Spec §3.6, §5 (dòng `use-announce.ts`), §6.3 **`Combobox`**: `allowCustomValue` trong **Bàn phím** (Enter, Esc) và **Rời ô nhập**, **Giá trị**, **`loading`**, **Thông báo số kết quả**, mặc định của `labels`; §7; §8 (lọc từ server với `filter={false}` và `loading`).
- **`useAnnounce()`** cho mỗi component một vùng live trong phần tử gốc của nó, có từ render đầu (cả HTML từ server, rỗng). Vùng live dùng chung ngoài component sẽ câm khi một Dialog modal làm mọi thứ ngoài nó `inert`. Module có sẵn từ lúc lập Plan A và được chuyển vào nguyên văn (phát hiện 2).
- **`allowCustomValue`**: Enter khi không có option được trỏ, hoặc rời ô, chốt chữ đang gõ làm giá trị. Nếu chữ, sau khi gấp như bộ lọc, trùng chữ của một item thì giá trị là `value` của item đó. Esc trên listbox đóng mà còn chữ thì xoá chữ và giá trị (`null`), có `preventDefault`. `<select>` ẩn mang giá trị tự do làm option của nó.
- **Enter trên listbox đóng** tự ghi vào `<select>` ẩn, vì Firefox gửi form trước khi React render (phát hiện 4). `textFor(value)` cho chữ của một giá trị: chữ của item, hoặc chính giá trị khi có `allowCustomValue`. Effect "chữ theo giá trị", reset form và `<select>` ẩn đều đi qua nó.
- **`loading`**: dòng `labels.loading` hiện dưới các option, hoặc thay cho "No results" khi không còn option nào.
- **Thông báo**: vùng live đọc `labels.results(n)` (hoặc `labels.noResults`) 500ms sau lần gõ cuối, và `labels.loading` một lần cho mỗi đợt `loading` khi listbox mở (phát hiện 10).

**Files:**
- Create: `src/internal/use-announce.ts`, `src/internal/use-announce.test.tsx`
- Modify: `src/components/combobox/Combobox.tsx`, `Combobox.test.tsx`, `Combobox.test-d.ts`, `Combobox.stories.tsx`, `Combobox.mdx`

**Interfaces:**
- Produces trong `src/internal/use-announce.ts`: `useAnnounce()` trả `UseAnnounceResult`, `{ announce(text, options?: { delay?: number }), region }`.
  - `announce` xoá chữ cũ rồi đặt chữ mới một task sau, nên cùng một câu nói lại vẫn được đọc. `delay` gộp các lần gọi liên tiếp và chỉ đọc câu cuối. Chữ rỗng xoá vùng và bỏ câu đang chờ. Không đặt state sau khi unmount.
  - `region` là `<div class="flg-visually-hidden" aria-live="polite" aria-atomic="true">` mà component tự render.
  - Task 5 (`TagInput`) dùng; Plan C và D sẽ dùng.
- Produces thêm cho `ComboboxProps`:
  - `allowCustomValue?: boolean` (mặc định `false`), `loading?: boolean`.
  - `labels: { noResults?: string; loading?: string; results?: (count: number) => string }`, mặc định `"No results"`, `"Loading…"`, và `"1 result"` hoặc `"<n> results"`.
- Consumes: `foldText` (Task 3), `devWarn`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/combobox/Combobox.stories.tsx b/src/components/combobox/Combobox.stories.tsx
index b3d46fe..08e9ffb 100644
--- a/src/components/combobox/Combobox.stories.tsx
+++ b/src/components/combobox/Combobox.stories.tsx
@@ -1,4 +1,5 @@
 import type { Meta, StoryObj } from '@storybook/react-vite';
+import { useRef, useState } from 'react';
 import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
 import { realUserEvent, settled } from '../../../.storybook/real-input';
 import {
@@ -575,3 +576,190 @@ export const InAForm: Story = {
     });
   },
 };
+
+const liveRegionIn = (root: HTMLElement) => root.querySelector<HTMLElement>('[aria-live]')!;
+
+/** `allowCustomValue`: Enter commits the text, leaving commits it, Esc on a closed list clears it. */
+export const CustomValue: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <form aria-label="Address" style={column} onSubmit={(event) => event.preventDefault()}>
+      <Field label="City">
+        <Combobox name="city" allowCustomValue placeholder="Search or type a city…">
+          {cities}
+        </Combobox>
+      </Field>
+      <button type="submit">Save</button>
+    </form>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const form = canvasElement.querySelector('form')!;
+    const input = canvas.getByRole('combobox', { name: 'City' });
+    const user = (await realUserEvent()) ?? userEvent;
+    const city = () => new FormData(form).get('city');
+
+    // Enter commits what was typed, in a form that does not submit while the list is open.
+    let submitted = 0;
+    form.addEventListener('submit', () => (submitted += 1));
+    await user.click(input);
+    await user.keyboard('Quận 1{Enter}');
+    await expect(input).toHaveValue('Quận 1');
+    await waitFor(() => expect(city()).toBe('Quận 1'));
+    await expect(submitted).toBe(0);
+
+    // Leaving commits it too, and text that folds to an item becomes that item.
+    await user.clear(input);
+    await user.keyboard('ha noi{Tab}');
+    await waitFor(() => expect(city()).toBe('hn'));
+    await expect(input).toHaveValue('Hà Nội');
+    await user.click(input);
+    await user.keyboard('{Control>}a{/Control}Biên Hòa{Tab}');
+    await waitFor(() => expect(city()).toBe('Biên Hòa'));
+
+    // Esc on a closed list clears the text and the value.
+    input.focus();
+    await user.keyboard('{Escape}');
+    await waitFor(() => expect(input).toHaveValue(''));
+    await expect(city()).toBe('');
+  },
+};
+
+const places = ['Ha Long', 'Hanoi', 'Hue', 'Da Nang', 'Hoi An'];
+
+/** Server filtering: `filter={false}`, `loading` while a fake request resolves. */
+function ServerSearch() {
+  const [found, setFound] = useState<string[]>([]);
+  const [loading, setLoading] = useState(false);
+  const request = useRef(0);
+  return (
+    <div style={column}>
+      <Field label="Place">
+        <Combobox
+          filter={false}
+          loading={loading}
+          placeholder="Search a place…"
+          onInputValueChange={(text) => {
+            const mine = (request.current += 1);
+            setLoading(true);
+            setTimeout(() => {
+              // An older answer must not replace a newer one.
+              if (mine !== request.current) return;
+              setFound(places.filter((name) => name.toLowerCase().includes(text.toLowerCase())));
+              setLoading(false);
+            }, 150);
+          }}
+        >
+          {found.map((name) => (
+            <ComboboxItem key={name} value={name}>
+              {name}
+            </ComboboxItem>
+          ))}
+        </Combobox>
+      </Field>
+    </div>
+  );
+}
+
+export const ServerFiltering: Story = {
+  tags: ['no-visual'],
+  render: () => <ServerSearch />,
+  play: async ({ canvas, canvasElement }) => {
+    const input = canvas.getByRole('combobox', { name: 'Place' });
+    const listbox = listboxIn(canvasElement);
+    const live = liveRegionIn(canvasElement);
+    const user = (await realUserEvent()) ?? userEvent;
+    await user.click(input);
+    await user.keyboard('h');
+    // The request is out: the status row says so, and the region says it once.
+    await waitFor(() => expect(listbox).toHaveTextContent('Loading…'));
+    await waitFor(() => expect(live).toHaveTextContent('Loading…'));
+    // It resolves: the options come, the loading row goes, and the count is said after the typing.
+    await waitFor(() => expect(within(listbox).getAllByRole('option')).toHaveLength(4));
+    await expect(listbox).not.toHaveTextContent('Loading…');
+    await waitFor(() => expect(live).toHaveTextContent('4 results'), { timeout: 3000 });
+    // No match: the answer is empty and says so.
+    await user.keyboard('zz');
+    await waitFor(() => expect(listbox).toHaveTextContent('No results'));
+    await waitFor(() => expect(live).toHaveTextContent('No results'), { timeout: 3000 });
+  },
+};
+
+/** What the live region says while the user types. */
+export const Announcements: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={column}>
+      <Field label="City">
+        <Combobox placeholder="Search a city…">{cities}</Combobox>
+      </Field>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const input = canvas.getByRole('combobox', { name: 'City' });
+    const listbox = listboxIn(canvasElement);
+    const live = liveRegionIn(canvasElement);
+    const user = (await realUserEvent()) ?? userEvent;
+    // Present and empty before anything happens.
+    await expect(live).toHaveAttribute('aria-live', 'polite');
+    await expect(live).toBeEmptyDOMElement();
+    await user.click(input);
+    await user.keyboard('h');
+    await waitFor(
+      () =>
+        expect(live).toHaveTextContent(`${within(listbox).getAllByRole('option').length} results`),
+      { timeout: 3000 },
+    );
+    await user.keyboard('ue');
+    await waitFor(() => expect(live).toHaveTextContent('1 result'), { timeout: 3000 });
+    await user.keyboard('zzz');
+    await waitFor(() => expect(live).toHaveTextContent('No results'), { timeout: 3000 });
+  },
+};
+
+function SubmitForm({ onSubmit }: { onSubmit: (city: FormDataEntryValue | null) => void }) {
+  return (
+    <form
+      aria-label="Address"
+      style={column}
+      onSubmit={(event) => {
+        event.preventDefault();
+        onSubmit(new FormData(event.currentTarget).get('city'));
+      }}
+    >
+      <Field label="City">
+        <Combobox name="city" allowCustomValue placeholder="Search or type a city…">
+          {cities}
+        </Combobox>
+      </Field>
+    </form>
+  );
+}
+
+/** Enter on a closed list submits the value the Enter itself settled, not the one before it. */
+export const CustomValueSubmit: Story = {
+  tags: ['no-visual'],
+  render: () => <SubmitForm onSubmit={fn()} />,
+  play: async ({ canvas, canvasElement }) => {
+    const form = canvasElement.querySelector('form')!;
+    const input = canvas.getByRole('combobox', { name: 'City' });
+    const user = (await realUserEvent()) ?? userEvent;
+    const sent: Array<FormDataEntryValue | null> = [];
+    form.addEventListener('submit', (event) => {
+      sent.push(new FormData(event.currentTarget as HTMLFormElement).get('city'));
+    });
+
+    // Free text, the list closed with Alt+ArrowUp (which keeps the text), then Enter.
+    await user.click(input);
+    await user.keyboard('Quận 1{Alt>}{ArrowUp}{/Alt}');
+    await expect(listboxIn(canvasElement).matches(':popover-open')).toBe(false);
+    await user.keyboard('{Enter}');
+    await waitFor(() => expect(sent).toEqual(['Quận 1']));
+
+    // An item picked, then Enter on the closed list submits that item's value.
+    await user.clear(input);
+    await user.keyboard('h{ArrowDown}{Enter}');
+    await expect(input).toHaveValue('Hà Nội');
+    await user.keyboard('{Enter}');
+    await waitFor(() => expect(sent).toEqual(['Quận 1', 'hn']));
+  },
+};
diff --git a/src/components/combobox/Combobox.test-d.ts b/src/components/combobox/Combobox.test-d.ts
index f144cf0..d710e68 100644
--- a/src/components/combobox/Combobox.test-d.ts
+++ b/src/components/combobox/Combobox.test-d.ts
@@ -35,3 +35,13 @@ test('the text is a string, and is reported as one', () => {
     ((text: string) => void) | undefined
   >();
 });
+
+test('the labels are words, and the results label is a function of the count', () => {
+  expectTypeOf<NonNullable<ComboboxProps['labels']>>().toEqualTypeOf<{
+    noResults?: string;
+    loading?: string;
+    results?: (count: number) => string;
+  }>();
+  expectTypeOf<ComboboxProps['allowCustomValue']>().toEqualTypeOf<boolean | undefined>();
+  expectTypeOf<ComboboxProps['loading']>().toEqualTypeOf<boolean | undefined>();
+});
diff --git a/src/components/combobox/Combobox.test.tsx b/src/components/combobox/Combobox.test.tsx
index c56711f..6005f5a 100644
--- a/src/components/combobox/Combobox.test.tsx
+++ b/src/components/combobox/Combobox.test.tsx
@@ -1205,4 +1205,378 @@ describe('Combobox', () => {
       expect(warn).toHaveBeenCalledWith(expect.stringMatching(/\] Combobox open is changing from/));
     });
   });
+
+  describe('allowCustomValue', () => {
+    function setup(props: Partial<ComponentProps<typeof Combobox>> = {}) {
+      const onValueChange = vi.fn();
+      render(
+        <form aria-label="F">
+          <Combobox
+            aria-label="City"
+            name="city"
+            allowCustomValue
+            onValueChange={onValueChange}
+            {...props}
+          >
+            {cities}
+          </Combobox>
+          <button type="button">After</button>
+        </form>,
+      );
+      act(() => input().focus());
+      return { onValueChange };
+    }
+    const native = () => document.querySelector<HTMLSelectElement>('select')!;
+    const leave = () => act(() => screen.getByRole('button', { name: 'After' }).focus());
+    /** A key press whose default can be told apart from a prevented one. */
+    const press = (name: string) => {
+      const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
+      act(() => {
+        input().dispatchEvent(event);
+      });
+      return event;
+    };
+
+    it('Enter with no highlighted option commits the typed text, closes, and prevents the submit', () => {
+      const { onValueChange } = setup();
+      type('Quận 1');
+      expect(input()).toHaveAttribute('aria-expanded', 'false');
+      expect(listbox()).toHaveTextContent('No results');
+      const event = press('Enter');
+      expect(event.defaultPrevented).toBe(true);
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('Quận 1');
+      expect(input()).toHaveValue('Quận 1');
+      expect(listbox()).not.toHaveTextContent('No results');
+    });
+
+    it('Enter on a highlighted option still chooses the option', () => {
+      const { onValueChange } = setup();
+      type('h');
+      key('ArrowDown');
+      key('Enter');
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('hn');
+      expect(input()).toHaveValue('Hà Nội');
+    });
+
+    it('Enter on a closed listbox commits the text and leaves the event to the form', () => {
+      const { onValueChange } = setup({ defaultInputValue: 'Quận 1' });
+      const event = press('Enter');
+      expect(event.defaultPrevented).toBe(false);
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('Quận 1');
+    });
+
+    it('writes the hidden select on Enter itself, for the submit that follows the keydown', async () => {
+      // The browser submits right after the keydown, perhaps before React has rendered: outside act
+      // nothing is rendered when the event returns, so only a direct write is seen here.
+      vi.spyOn(console, 'error').mockImplementation(() => {});
+      setup({ defaultInputValue: 'Quận 1' });
+      input().dispatchEvent(
+        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
+      );
+      expect(new FormData(native().form!).get('city')).toBe('Quận 1');
+      await aTaskLater();
+      expect(new FormData(native().form!).get('city')).toBe('Quận 1');
+      expect(Array.from(native().options, (o) => o.value)).toEqual(['', 'Quận 1']);
+    });
+
+    it('writes the item value on Enter when the text folds to an item', async () => {
+      vi.spyOn(console, 'error').mockImplementation(() => {});
+      setup({ defaultInputValue: 'ha noi' });
+      input().dispatchEvent(
+        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
+      );
+      expect(new FormData(native().form!).get('city')).toBe('hn');
+      await aTaskLater();
+      expect(new FormData(native().form!).get('city')).toBe('hn');
+      expect(input()).toHaveValue('Hà Nội');
+    });
+
+    it('leaving commits the text as the value', () => {
+      const { onValueChange } = setup();
+      type('Quận 1');
+      leave();
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('Quận 1');
+      expect(input()).toHaveValue('Quận 1');
+    });
+
+    it('leaving maps text that folds to an item to its value, and shows the item text', () => {
+      const { onValueChange } = setup();
+      type('ha noi');
+      leave();
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('hn');
+      expect(input()).toHaveValue('Hà Nội');
+    });
+
+    it('leaving with the text of the chosen item changes nothing', () => {
+      const { onValueChange } = setup({ defaultValue: 'hn' });
+      leave();
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('leaving with empty text makes the value null', () => {
+      const { onValueChange } = setup({ defaultValue: 'hn' });
+      type('');
+      leave();
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(null);
+    });
+
+    it('shows a custom defaultValue as the text', () => {
+      setup({ defaultValue: 'Quận 1' });
+      expect(input()).toHaveValue('Quận 1');
+    });
+
+    it('Esc on a closed listbox with text clears the text and the value, and prevents the default', () => {
+      const { onValueChange } = setup({ defaultValue: 'hn' });
+      const event = press('Escape');
+      expect(event.defaultPrevented).toBe(true);
+      expect(input()).toHaveValue('');
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(null);
+    });
+
+    it('Esc on a closed listbox with no text is left alone', () => {
+      setup();
+      expect(press('Escape').defaultPrevented).toBe(false);
+    });
+
+    it('Esc on an open listbox changes nothing: the browser closes it', () => {
+      const { onValueChange } = setup({ defaultValue: 'hn' });
+      key('ArrowDown');
+      expect(press('Escape').defaultPrevented).toBe(false);
+      expect(input()).toHaveValue('Hà Nội');
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('carries a custom value as the option of the hidden select, and in FormData', () => {
+      setup();
+      type('Quận 1');
+      leave();
+      expect(native()).toHaveValue('Quận 1');
+      expect(Array.from(native().options, (o) => o.value)).toEqual(['', 'Quận 1']);
+      expect(new FormData(native().form!).get('city')).toBe('Quận 1');
+    });
+
+    it('submits the item value once the text maps to an item', () => {
+      setup();
+      type('hue');
+      leave();
+      expect(new FormData(native().form!).get('city')).toBe('hue');
+    });
+
+    it('resets to a custom defaultValue', async () => {
+      setup({ defaultValue: 'Quận 1' });
+      type('x');
+      leave();
+      act(() => {
+        native().form!.reset();
+      });
+      await aTaskLater();
+      expect(input()).toHaveValue('Quận 1');
+      expect(native()).toHaveValue('Quận 1');
+    });
+
+    it('does not warn that a custom value matches no item', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      setup({ defaultValue: 'Quận 1' });
+      expect(warn).not.toHaveBeenCalled();
+    });
+
+    it('without allowCustomValue, Enter on text only closes, and the value stays the item', () => {
+      setup({ allowCustomValue: false, defaultValue: 'hn' });
+      type('Quận 1');
+      key('Enter');
+      expect(native()).toHaveValue('hn');
+      expect(input()).toHaveValue('Quận 1');
+    });
+  });
+
+  describe('loading', () => {
+    it('shows the loading label below the options', () => {
+      render(
+        <Combobox aria-label="City" loading defaultOpen>
+          {cities}
+        </Combobox>,
+      );
+      const status = listbox().querySelector('.flg-combobox-status')!;
+      expect(status).toHaveTextContent('Loading…');
+      expect(status).toHaveAttribute('role', 'presentation');
+      expect(listbox().lastElementChild).toBe(status);
+      expect(optionTexts()).toHaveLength(4);
+      expect(listbox()).toHaveAttribute('role', 'listbox');
+    });
+
+    it('shows it instead of "No results" when nothing is left', () => {
+      render(
+        <Combobox aria-label="City" loading defaultOpen filter={false}>
+          <></>
+        </Combobox>,
+      );
+      expect(listbox().querySelectorAll('.flg-combobox-status')).toHaveLength(1);
+      expect(listbox()).toHaveTextContent('Loading…');
+      expect(listbox()).not.toHaveTextContent('No results');
+    });
+
+    it('takes its words from labels.loading', () => {
+      render(
+        <Combobox aria-label="City" loading defaultOpen labels={{ loading: 'Đang tải…' }}>
+          {cities}
+        </Combobox>,
+      );
+      expect(listbox()).toHaveTextContent('Đang tải…');
+    });
+
+    it('shows "No results" again once loading ends', () => {
+      const { rerender } = render(
+        <Combobox aria-label="City" loading defaultOpen filter={false}>
+          <></>
+        </Combobox>,
+      );
+      rerender(
+        <Combobox aria-label="City" defaultOpen filter={false}>
+          <></>
+        </Combobox>,
+      );
+      expect(listbox()).toHaveTextContent('No results');
+    });
+  });
+
+  describe('announcements', () => {
+    const region = () => document.querySelector<HTMLElement>('[aria-live]')!;
+    beforeEach(() => vi.useFakeTimers());
+    afterEach(() => vi.useRealTimers());
+    const advance = (ms: number) =>
+      act(() => {
+        vi.advanceTimersByTime(ms);
+      });
+
+    it('has an empty polite live region in the root from the first render, on the server too', () => {
+      expect(renderToString(<Combobox aria-label="City">{cities}</Combobox>)).toContain(
+        '<div class="flg-visually-hidden" aria-live="polite" aria-atomic="true"></div>',
+      );
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      expect(region()).toHaveAttribute('aria-live', 'polite');
+      expect(region()).toBeEmptyDOMElement();
+      expect(region().parentElement).toHaveClass('flg-combobox');
+    });
+
+    it('says the number of results 500ms after the last keystroke, not before', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      type('h');
+      advance(300);
+      type('ha');
+      advance(499);
+      expect(region()).toBeEmptyDOMElement();
+      advance(1);
+      expect(region()).toHaveTextContent('2 results');
+    });
+
+    it('says "1 result" for one, and labels.noResults for none', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      type('hue');
+      advance(500);
+      expect(region()).toHaveTextContent('1 result');
+      type('zzz');
+      advance(500);
+      expect(region()).toHaveTextContent('No results');
+    });
+
+    it('takes its words from labels.results and labels.noResults', () => {
+      render(
+        <Combobox
+          aria-label="City"
+          labels={{ results: (n) => `${n} kết quả`, noResults: 'Không có' }}
+        >
+          {cities}
+        </Combobox>,
+      );
+      type('hue');
+      advance(500);
+      expect(region()).toHaveTextContent('1 kết quả');
+      type('zzz');
+      advance(500);
+      expect(region()).toHaveTextContent('Không có');
+    });
+
+    it('says the same sentence twice by clearing the region first', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      type('hue');
+      advance(500);
+      expect(region()).toHaveTextContent('1 result');
+      type('huế');
+      expect(region()).toBeEmptyDOMElement();
+      advance(500);
+      expect(region()).toHaveTextContent('1 result');
+    });
+
+    it('does not announce results while nothing was typed', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      key('ArrowDown');
+      advance(1000);
+      expect(region()).toBeEmptyDOMElement();
+    });
+
+    it('says labels.loading once when loading turns on while the listbox is open', () => {
+      const { rerender } = render(
+        <Combobox aria-label="City" defaultOpen>
+          {cities}
+        </Combobox>,
+      );
+      rerender(
+        <Combobox aria-label="City" defaultOpen loading>
+          {cities}
+        </Combobox>,
+      );
+      advance(0);
+      expect(region()).toHaveTextContent('Loading…');
+      // Still loading after another render: not cleared and set again.
+      const node = region().firstChild;
+      rerender(
+        <Combobox aria-label="City" defaultOpen loading className="x">
+          {cities}
+        </Combobox>,
+      );
+      advance(10);
+      expect(region().firstChild).toBe(node);
+    });
+
+    it('does not say it for a closed listbox', () => {
+      render(
+        <Combobox aria-label="City" loading>
+          {cities}
+        </Combobox>,
+      );
+      advance(1000);
+      expect(region()).toBeEmptyDOMElement();
+    });
+
+    it('says the count once the results arrive after typing while loading', () => {
+      const { rerender } = render(
+        <Combobox aria-label="City" filter={false}>
+          <></>
+        </Combobox>,
+      );
+      type('h');
+      rerender(
+        <Combobox aria-label="City" filter={false} loading>
+          <></>
+        </Combobox>,
+      );
+      advance(1000);
+      expect(region()).toHaveTextContent('Loading…');
+      rerender(
+        <Combobox aria-label="City" filter={false}>
+          {cities}
+        </Combobox>,
+      );
+      advance(500);
+      expect(region()).toHaveTextContent('4 results');
+    });
+
+    it('stays quiet once the listbox closes', () => {
+      render(<Combobox aria-label="City">{cities}</Combobox>);
+      type('h');
+      key('Tab');
+      advance(1000);
+      expect(region()).toBeEmptyDOMElement();
+    });
+  });
 });
diff --git a/src/internal/use-announce.test.tsx b/src/internal/use-announce.test.tsx
new file mode 100644
index 0000000..3f724e6
--- /dev/null
+++ b/src/internal/use-announce.test.tsx
@@ -0,0 +1,113 @@
+import { act, render } from '@testing-library/react';
+import { renderToString } from 'react-dom/server';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { useAnnounce } from './use-announce';
+
+type Announce = ReturnType<typeof useAnnounce>['announce'];
+let announce: Announce;
+
+function Probe() {
+  const live = useAnnounce();
+  announce = live.announce;
+  return (
+    <div data-testid="root">
+      <button type="button">x</button>
+      {live.region}
+    </div>
+  );
+}
+
+const region = (container: HTMLElement) => container.querySelector('[aria-live]') as HTMLElement;
+
+describe('useAnnounce', () => {
+  beforeEach(() => vi.useFakeTimers());
+  afterEach(() => vi.useRealTimers());
+
+  it('renders an empty polite live region from the first render, on the server too', () => {
+    expect(renderToString(<Probe />)).toContain(
+      '<div class="flg-visually-hidden" aria-live="polite" aria-atomic="true"></div>',
+    );
+    const { container } = render(<Probe />);
+    expect(region(container)).toHaveClass('flg-visually-hidden');
+    expect(region(container)).toHaveAttribute('aria-live', 'polite');
+    expect(region(container)).toHaveAttribute('aria-atomic', 'true');
+    expect(region(container).textContent).toBe('');
+  });
+
+  it('sets the text a task later', () => {
+    const { container } = render(<Probe />);
+    act(() => announce('5 results'));
+    expect(region(container).textContent).toBe('');
+    act(() => {
+      vi.advanceTimersByTime(0);
+    });
+    expect(region(container).textContent).toBe('5 results');
+  });
+
+  it('clears the old text first, so the same sentence said again is a new change', () => {
+    const { container } = render(<Probe />);
+    act(() => announce('No results'));
+    act(() => {
+      vi.advanceTimersByTime(0);
+    });
+    act(() => announce('No results'));
+    expect(region(container).textContent).toBe('');
+    act(() => {
+      vi.advanceTimersByTime(0);
+    });
+    expect(region(container).textContent).toBe('No results');
+  });
+
+  it('with a delay, joins calls made in a row and says only the last', () => {
+    const { container } = render(<Probe />);
+    act(() => announce('1 result', { delay: 500 }));
+    act(() => {
+      vi.advanceTimersByTime(300);
+    });
+    act(() => announce('2 results', { delay: 500 }));
+    act(() => {
+      vi.advanceTimersByTime(300);
+    });
+    expect(region(container).textContent).toBe('');
+    act(() => {
+      vi.advanceTimersByTime(200);
+    });
+    expect(region(container).textContent).toBe('2 results');
+  });
+
+  it('an empty text clears the region and drops a pending announcement', () => {
+    const { container } = render(<Probe />);
+    act(() => announce('Loading…'));
+    act(() => {
+      vi.advanceTimersByTime(0);
+    });
+    act(() => announce('later', { delay: 500 }));
+    act(() => announce(''));
+    act(() => {
+      vi.advanceTimersByTime(1000);
+    });
+    expect(region(container).textContent).toBe('');
+  });
+
+  it('does not set state after unmount', () => {
+    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
+    const { unmount } = render(<Probe />);
+    act(() => announce('bye', { delay: 100 }));
+    unmount();
+    vi.advanceTimersByTime(200);
+    expect(error).not.toHaveBeenCalled();
+    error.mockRestore();
+  });
+
+  it('keeps each instance to its own region, and is read inside a modal dialog', () => {
+    // The region sits beside the control, so it is inside the dialog, not in the inert page behind.
+    const { container } = render(
+      <dialog open>
+        <Probe />
+      </dialog>,
+    );
+    const dialog = container.querySelector('dialog') as HTMLElement;
+    expect(dialog.contains(region(container))).toBe(true);
+    expect(container.querySelectorAll('[aria-live]')).toHaveLength(1);
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/combobox src/internal/use-announce.test.tsx
```

Expected: FAIL.
- `use-announce.test.tsx` fail cả file vì `./use-announce` chưa có (module nằm ở Step 3). Ở bản nháp, module được chuyển vào cùng lúc với test và pass ngay: bảy test của nó là test đặc tả.
- `Combobox.test.tsx`: ở bản nháp, 23 trong 30 test mới fail trên commit cha. Ví dụ:
  - `Enter with no highlighted option commits the typed text, closes, and prevents the submit`: `onValueChange` không được gọi với `'Quận 1'`;
  - `leaving maps text that folds to an item to its value, and shows the item text`: không được gọi với `'hn'`;
  - `shows a custom defaultValue as the text`: giá trị của ô nhập là `''`;
  - `Esc on a closed listbox with text clears the text and the value, and prevents the default`: `defaultPrevented` là `false`;
  - `carries a custom value as the option of the hidden select, and in FormData`: giá trị của `<select>` là `''` thay vì `'Quận 1'`;
  - ba test đầu của nhóm `loading`: không có `.flg-combobox-status` với chữ `Loading…`;
  - `has an empty polite live region in the root from the first render, on the server too`: HTML không có vùng live; các test thông báo còn lại cũng fail vì chưa có vùng live.
- Hai test của bản sửa Firefox fail với `expected '' to be 'Quận 1'` (`writes the hidden select on Enter itself, for the submit that follows the keydown`) và `expected '' to be 'hn'` (`writes the item value on Enter when the text folds to an item`).
- Bảy test là test đặc tả, pass cả trước lẫn sau: `Enter on a highlighted option still chooses the option`, `Esc on a closed listbox with no text is left alone`, `Esc on an open listbox changes nothing: the browser closes it`, `without allowCustomValue, Enter on text only closes, and the value stays the item`, `shows "No results" again once loading ends`, `does not announce results while nothing was typed`, `does not say it for a closed listbox`.
- Test kiểu mới `the labels are words, and the results label is a function of the count` lỗi kiểu, vì `ComboboxProps` chưa có `allowCustomValue`, `loading` và hai khoá mới của `labels`.

- [ ] **Step 3: Viết code**

```diff
diff --git a/src/components/combobox/Combobox.mdx b/src/components/combobox/Combobox.mdx
index 4c816bb..5cdc540 100644
--- a/src/components/combobox/Combobox.mdx
+++ b/src/components/combobox/Combobox.mdx
@@ -21,8 +21,9 @@ import { Combobox, ComboboxItem, Field } from 'fl-glass-ui';
 <Controls />
 
 A Combobox is a text input with a list of items that narrows as you type. The user picks one item:
-what they type is only a search, and text that matches no item is put back when they leave. Reach
-for a Select when the list is short and needs no search.
+what they type is only a search, and text that matches no item is put back when they leave, unless
+`allowCustomValue` lets them keep it. Reach for a Select when the list is short and needs no
+search.
 
 ## Items
 
@@ -62,6 +63,63 @@ shows an element (an icon, an avatar) is filtered as usual but not marked.
 When no item is left the list shows "No results" (`labels.noResults`). That row is no option, so the
 input reports the listbox as collapsed (`aria-expanded="false"`, no `aria-controls`).
 
+## Server filtering
+
+For a list that lives on a server, turn the filter off, search in `onInputValueChange`, and set
+`loading` while the request is out:
+
+```tsx
+function PlaceSearch() {
+  const [places, setPlaces] = useState<string[]>([]);
+  const [loading, setLoading] = useState(false);
+  const latest = useRef(0);
+
+  return (
+    <Combobox
+      filter={false}
+      loading={loading}
+      onInputValueChange={async (text) => {
+        const mine = ++latest.current;
+        setLoading(true);
+        const found = await searchPlaces(text);
+        if (mine !== latest.current) return; // a newer search is running
+        setPlaces(found);
+        setLoading(false);
+      }}
+    >
+      {places.map((name) => (
+        <ComboboxItem key={name} value={name}>
+          {name}
+        </ComboboxItem>
+      ))}
+    </Combobox>
+  );
+}
+```
+
+While `loading` is on, the list ends with a "Loading…" row (`labels.loading`), below any options
+already there, and it takes the place of "No results". `onInputValueChange` also fires when the
+Combobox puts text back (a choice, a reset), so a search started from it should ignore text that
+is an item's own.
+
+## Custom values
+
+With `allowCustomValue` the text the user types can be the value, for a field that suggests but
+does not insist (a city that may not be on the list):
+
+- **Enter** with no option highlighted makes the typed text the value and closes the list. The form
+  does not submit on that Enter; on a closed list Enter commits the text and then submits.
+- **Leaving the input** (Tab, or a click elsewhere) does the same. When the text, folded the way
+  the filter folds it (case, diacritics, `đ`), equals an item's text, the value is that item's
+  `value` and the input shows the item's own spelling: "ha noi" becomes "Hà Nội".
+- **Esc** on a closed list clears the text and sets the value to `null`. On an open list it only
+  closes the list. With nothing typed, Esc is left alone, so a Dialog around it closes.
+- The value is then either an item's `value` or the text itself, so `onValueChange` and the
+  hidden `<select>` (the `FormData` entry under `name`) carry whichever it is. A custom
+  `value` or `defaultValue` that matches no item shows as the text, with no warning.
+
+<Canvas of={Stories.CustomValue} />
+
 ## Clearing the value
 
 There is no clear button. Delete the text and leave the input (Tab, or a click elsewhere): the value
@@ -130,6 +188,29 @@ room below or above is smaller); past that it scrolls. It flips above the input
 room below. A Combobox is as wide as its container; give it a width with `style` or `className`
 where it should be narrower. `size` is `"sm"`, `"md"` (default) or `"lg"`, as for an Input.
 
+## Announcements
+
+The Combobox has its own live region (a visually hidden `aria-live="polite"` element in its root,
+there from the first render, also in the server HTML), so it is read inside a modal Dialog too:
+
+- 500ms after the last keystroke it says how many options are left: "5 results", "1 result", or
+  "No results". Keystrokes in a row are joined, so a fast typist hears one sentence. It says the
+  count again when it changes while the list stays open, as when the results of a search arrive.
+- When `loading` turns on while the list is open it says "Loading…" once; the count follows when
+  loading ends.
+
+`labels.results` is a function of the count, for other languages and wording:
+
+```tsx
+<Combobox
+  labels={{
+    results: (n) => `${n} kết quả`,
+    noResults: 'Không có kết quả',
+    loading: 'Đang tải…',
+  }}
+>
+```
+
 ## Accessibility
 
 - The input is a `combobox` with `aria-autocomplete="list"`, and the list a `listbox` with the
@@ -137,6 +218,8 @@ where it should be narrower. `size` is `"sm"`, `"md"` (default) or `"lg"`, as fo
 - The highlighted option is named in `aria-activedescendant`. With no option shown, there is no
   listbox to point at, so `aria-expanded` is `false` and `aria-controls` is absent.
 - The options exist only while the list is open.
+- The number of results and "Loading…" are announced through the Combobox's own live region (see
+  Announcements).
 - Disabled options are announced and skipped by the keyboard.
 - The highlighted option uses the same accent wash as a menu item; see rows 8 and 9 on the
   Accessibility page.
@@ -147,8 +230,8 @@ where it should be narrower. `size` is `"sm"`, `"md"` (default) or `"lg"`, as fo
 
 - Do use a Combobox to pick one value from a list long enough to need a search.
 - Do give an item that shows more than text a `textValue`.
-- Don't use it for free text: the value is always an item. A field that takes any text is an
-  Input.
+- Don't use it for free text unless that is the point: without `allowCustomValue` the value is
+  always an item. A field that takes any text and suggests nothing is an Input.
 - Don't use it for a short list that needs no search; use a Select.
 - Don't put thousands of items in it: the list is not virtualised. Filter on the server with
   `filter={false}`.
diff --git a/src/components/combobox/Combobox.tsx b/src/components/combobox/Combobox.tsx
index f62c82b..7f2dee7 100644
--- a/src/components/combobox/Combobox.tsx
+++ b/src/components/combobox/Combobox.tsx
@@ -21,13 +21,14 @@ import { mergeRefs } from '../../internal/merge-refs';
 import { getNextIndex } from '../../internal/roving';
 import { useControllableState } from '../../internal/use-controllable-state';
 import { useFloating } from '../../internal/use-floating';
+import { useAnnounce } from '../../internal/use-announce';
 import { useFormReset } from '../../internal/use-form-reset';
 import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
 import { usePopover } from '../../internal/use-popover';
 import { usePopoverState, useTriggerPress } from '../../internal/use-popover-trigger';
 import { useWriteOnCommit } from '../../internal/use-write-on-commit';
 import { devWarn, isProduction } from '../../internal/warn';
-import { defaultFilter, findMatch } from './match';
+import { defaultFilter, findMatch, foldText } from './match';
 
 const COMBOBOX_PARTS: ListParts = {
   item: 'combobox-item',
@@ -66,6 +67,16 @@ export interface ComboboxProps {
    * diacritics. `false` shows every item, for a list the app filters itself.
    */
   filter?: ((item: ComboboxFilterItem, inputValue: string) => boolean) | false;
+  /**
+   * Lets the user commit text that is no item: Enter, or leaving the input, makes the text the value
+   * (the item's value when the text folds to an item's text). Esc on a closed list clears both.
+   */
+  allowCustomValue?: boolean;
+  /**
+   * Shows `labels.loading` below the options (instead of "No results"), for a list the app is
+   * fetching. Pair it with `filter={false}`.
+   */
+  loading?: boolean;
   /** Shown, muted, while the input is empty. */
   placeholder?: string;
   required?: boolean;
@@ -84,8 +95,11 @@ export interface ComboboxProps {
   'aria-label'?: string;
   'aria-labelledby'?: string;
   'aria-describedby'?: string;
-  /** The words the Combobox shows. Default `{ noResults: "No results" }`. */
-  labels?: { noResults?: string };
+  /**
+   * The words the Combobox shows and announces. Default `{ noResults: "No results", loading:
+   * "Loading…", results: (n) => "1 result" | "n results" }`.
+   */
+  labels?: { noResults?: string; loading?: string; results?: (count: number) => string };
   /** `ComboboxItem`, `ComboboxGroup` and `ComboboxSeparator`, read without rendering them. */
   children: ReactNode;
 }
@@ -170,7 +184,8 @@ function withMatch(option: Option, query: string): ReactNode {
 /**
  * A text input with a listbox that filters as you type, and a hidden native `<select>` that takes
  * part in forms (FormData, `required`, reset). The user chooses an item: text that matches none is
- * put back when they leave. `ref` is the input; `className` and `style` go on the element around it.
+ * put back when they leave, unless `allowCustomValue` makes it the value. `ref` is the input;
+ * `className` and `style` go on the element around it.
  */
 export const Combobox = markAsFieldControl(
   forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(props, ref) {
@@ -183,6 +198,8 @@ export const Combobox = markAsFieldControl(
       style,
       children,
       labels,
+      allowCustomValue = false,
+      loading = false,
       'aria-label': ariaLabel,
       'aria-labelledby': ariaLabelledBy,
     } = props;
@@ -196,6 +213,10 @@ export const Combobox = markAsFieldControl(
     });
     const { invalid, required = false, disabled = false } = fieldProps;
     const noResults = labels?.noResults ?? 'No results';
+    const loadingLabel = labels?.loading ?? 'Loading…';
+    const resultsLabel =
+      labels?.results ?? ((count: number) => (count === 1 ? '1 result' : `${count} results`));
+    const { announce, region } = useAnnounce();
 
     // --- Items, read from children without rendering them; again only when the children change.
     const { rows, options } = useMemo(() => readRows(children, COMBOBOX_PARTS), [children]);
@@ -208,8 +229,11 @@ export const Combobox = markAsFieldControl(
       name: 'Combobox value',
     });
     const chosen = options.find((option) => option.value === value);
-    const chosenText = chosen?.text ?? '';
-    if (!isProduction() && value !== null && value !== '' && !chosen) {
+    /** The text that stands for a value: its item's, or for a custom value, the value itself. */
+    const textFor = (of: string | null) =>
+      options.find((option) => option.value === of)?.text ?? (allowCustomValue && of ? of : '');
+    const chosenText = textFor(value);
+    if (!isProduction() && !allowCustomValue && value !== null && value !== '' && !chosen) {
       devWarn(`<Combobox> has a value that matches no ComboboxItem: "${value}".`);
     }
     const [text, setText] = useControllableState<string>({
@@ -229,6 +253,15 @@ export const Combobox = markAsFieldControl(
       // `chosenText` is part of the key; only a change of the key matters.
     }, [syncKey]);
 
+    // --- Announcements. The count of results is said 500ms after the last keystroke (`announce` joins
+    // the calls made in a row), and again when it changes after that while the listbox stays open,
+    // as when results arrive from a server. `typed` counts keystrokes: a keystroke that leaves the
+    // count as it was still says it. While loading the count is stale, so only the loading label is
+    // said (once per loading), and the count follows when loading ends.
+    const resultsDue = useRef(false);
+    const [typed, setTyped] = useState(0);
+    const loadingSaid = useRef(false);
+
     // --- Open state, the typed text that filters, and the highlighted option (its index in the whole
     // list, not in what is left of it).
     const { open, request, report, contentRef, pendingToggle } = usePopoverState<HTMLDivElement>({
@@ -263,6 +296,22 @@ export const Combobox = markAsFieldControl(
     const expanded = open && visible.length > 0;
     // Open with nothing left but the status row, the panel is no listbox: one must hold options.
     const isListbox = !open || visible.length > 0;
+    const resultsText = visible.length === 0 ? noResults : resultsLabel(visible.length);
+    useEffect(() => {
+      if (!loading) loadingSaid.current = false;
+      else if (open && !loadingSaid.current) {
+        loadingSaid.current = true;
+        announce(loadingLabel);
+      }
+    }, [loading, open, loadingLabel, announce]);
+    useEffect(() => {
+      if (!open) {
+        // Closing drops an announcement still waiting: its count is no longer on screen.
+        if (resultsDue.current) announce('');
+        resultsDue.current = false;
+      } else if (resultsDue.current && !loading) announce(resultsText, { delay: 500 });
+      // `typed` is there to say the text again after a keystroke that changed nothing in it.
+    }, [typed, open, loading, resultsText, announce]);
     const highlightsMatch = filter === undefined && query !== null && query !== '';
 
     const frameRef = useRef<HTMLDivElement>(null);
@@ -331,6 +380,23 @@ export const Combobox = markAsFieldControl(
       if (disabled && open) request(false);
     }, [disabled, open, request]);
 
+    // Makes the text the value, for `allowCustomValue`: empty clears it, text that folds to an item
+    // is that item (a disabled one cannot be chosen), anything else is a custom value.
+    // Returns the value it settles on, for the caller that must hand it to a form at once.
+    const commitText = (): string | null => {
+      if (text === '') {
+        setValue(null);
+        return null;
+      }
+      if (text === chosenText) return value;
+      const folded = foldText(text);
+      const match = options.find((one) => !one.disabled && foldText(one.text) === folded);
+      const next = match ? match.value : text;
+      // The value stays, but the text may be another spelling of it: put its own back.
+      if (next === value) setText(textFor(next));
+      else setValue(next);
+      return next;
+    };
     const choose = (option: Option | undefined) => {
       if (disabled || !option || option.disabled) return;
       // A new value brings its text (see `syncKey`); the one already chosen only puts it back.
@@ -362,6 +428,8 @@ export const Combobox = markAsFieldControl(
     const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
       const next = event.target.value;
       setText(next);
+      resultsDue.current = true;
+      setTyped((count) => count + 1);
       if (open) {
         setQuery(next);
         highlight(null, false);
@@ -394,17 +462,45 @@ export const Combobox = markAsFieldControl(
       } else if (key === 'Enter') {
         // Enter in an open listbox is for the listbox, never for the form. A closed one is left to
         // the browser, which submits the form.
-        if (!open) return;
+        if (!open) {
+          if (!allowCustomValue) return;
+          // The form submits right after this keydown, perhaps before React has rendered the new
+          // value into the hidden <select>, so it goes there now (as NumberInput does for its
+          // hidden input). The option stands in until the render replaces it (`data-pending`).
+          const settled = commitText();
+          const native = nativeRef.current;
+          if (native) {
+            native.querySelector('option[data-pending]')?.remove();
+            if (settled !== null && !Array.from(native.options).some((o) => o.value === settled)) {
+              const pending = new Option(textFor(settled) || settled, settled);
+              pending.setAttribute('data-pending', '');
+              native.append(pending);
+            }
+            native.value = settled ?? '';
+          }
+          return;
+        }
         event.preventDefault();
         const option = active === null ? undefined : options.find((one) => one.index === active);
-        if (option) choose(option);
-        else request(false);
+        if (option) {
+          choose(option);
+        } else {
+          if (allowCustomValue) commitText();
+          request(false);
+        }
       } else if (key === 'Escape') {
-        // An open listbox is closed by the browser. Closed, Esc puts the chosen item's text back, and
-        // is left alone when there is nothing to put back, so that a Dialog around it closes.
-        if (open || text === chosenText) return;
+        // An open listbox is closed by the browser. Closed, Esc puts the chosen item's text back (with
+        // `allowCustomValue`, it clears the text and the value), and is left alone when there is
+        // nothing to do, so that a Dialog around it closes.
+        if (open) return;
+        if (allowCustomValue ? text === '' : text === chosenText) return;
         event.preventDefault();
-        setText(chosenText);
+        if (allowCustomValue) {
+          setValue(null);
+          setText('');
+        } else {
+          setText(chosenText);
+        }
       } else if (key === 'Tab') {
         // Focus moves on as usual, and nothing is chosen. Leaving settles the text (handleBlur).
         if (open) request(false);
@@ -413,11 +509,13 @@ export const Combobox = markAsFieldControl(
     // All of the listbox's keyboard is on the input, so focus that leaves it any other way (app
     // code, a screen reader moving on, another window) closes the listbox. A press in the listbox
     // keeps focus here (see its onMouseDown). Leaving an empty input clears the value, which is how
-    // it is cleared (there is no clear button); any other text that is not the chosen item's goes.
+    // it is cleared (there is no clear button); any other text that is not the chosen item's goes, or
+    // with `allowCustomValue` becomes the value.
     const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
       if (contentRef.current?.contains(event.relatedTarget as Node | null)) return;
       if (open) request(false);
-      if (text === '') setValue(null);
+      if (allowCustomValue) commitText();
+      else if (text === '') setValue(null);
       else if (text !== chosenText) setText(chosenText);
     };
 
@@ -460,26 +558,26 @@ export const Combobox = markAsFieldControl(
     // --- The hidden native <select>: an empty option and one for the chosen item, kept in step with
     // the value for forms. Synced again on `resync`: after a form reset, which changes the native
     // <select> behind React's back (and a controlled parent may keep its value).
+    // The chosen item's value, or a custom value, which is its own option.
+    const nativeValue = chosen ? chosen.value : allowCustomValue && value ? value : null;
     const [synced, resync] = useState(0);
     useIsoLayoutEffect(() => {
       const native = nativeRef.current;
       if (!native) return;
+      native.querySelector('option[data-pending]')?.remove();
       for (const one of Array.from(native.options)) {
-        one.selected = one.value === '' ? !chosen : one.value === chosen?.value;
+        one.selected = one.value === '' ? nativeValue === null : one.value === nativeValue;
       }
-      // `chosen` stands for the value and the items; they are new objects on every read of children.
-    }, [value, chosenText, synced]);
+      // `nativeValue` and `chosenText` stand for the value and the items, which are new objects on
+      // every read of children.
+    }, [nativeValue, chosenText, synced]);
     // The browser resets the native <select> after the form's reset event: put an uncontrolled
     // Combobox back to its default value and that value's text, and the native one back in step with
     // a controlled value. Read at that moment, so it is the state of the last commit.
     useFormReset(nativeRef, () => {
       const defaultValue = props.defaultValue ?? null;
       resetValue(defaultValue);
-      setText(
-        options.find(
-          (option) => option.value === (props.value !== undefined ? value : defaultValue),
-        )?.text ?? '',
-      );
+      setText(textFor(props.value !== undefined ? value : defaultValue));
       resync((count) => count + 1);
     });
 
@@ -584,15 +682,15 @@ export const Combobox = markAsFieldControl(
           name={name}
           required={required}
           disabled={disabled}
-          defaultValue={chosen?.value ?? ''}
+          defaultValue={nativeValue ?? ''}
           // The browser focuses an invalid native control to show its message: the input stands for
           // it.
           onFocus={() => inputRef.current?.focus()}
         >
           <option value="" />
-          {chosen ? (
-            <option key={chosen.value} value={chosen.value}>
-              {chosen.text}
+          {nativeValue !== null ? (
+            <option key={nativeValue} value={nativeValue}>
+              {chosen ? chosen.text : nativeValue}
             </option>
           ) : null}
         </select>
@@ -610,12 +708,13 @@ export const Combobox = markAsFieldControl(
           onMouseDown={(event) => event.preventDefault()}
         >
           {open ? renderRows(shown) : null}
-          {open && visible.length === 0 ? (
+          {open && (loading || visible.length === 0) ? (
             <div role="presentation" className="flg-combobox-status">
-              {noResults}
+              {loading ? loadingLabel : noResults}
             </div>
           ) : null}
         </div>
+        {region}
       </div>
     );
   }),
diff --git a/src/internal/use-announce.ts b/src/internal/use-announce.ts
new file mode 100644
index 0000000..e5c5860
--- /dev/null
+++ b/src/internal/use-announce.ts
@@ -0,0 +1,45 @@
+import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
+import type { ReactElement } from 'react';
+
+export interface UseAnnounceResult {
+  /**
+   * Says `text` through the live region. The old text goes first and the new text is set a task
+   * later, so the same sentence said twice is still read. With `delay`, calls made within that many
+   * milliseconds of each other are joined and only the last is said. An empty text clears the
+   * region and drops what is waiting.
+   */
+  announce: (text: string, options?: { delay?: number }) => void;
+  /** The live region, for the component to render; it is there from the first render, empty. */
+  region: ReactElement;
+}
+
+/**
+ * One live region for one component. It sits in the component's own root and not in a shared place
+ * outside it, because a modal Dialog makes everything outside itself inert and a region in the
+ * inert part is not read. Screen readers only read changes in a region they already know, so the
+ * region is rendered from the first render, empty.
+ */
+export function useAnnounce(): UseAnnounceResult {
+  const [text, setText] = useState('');
+  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
+
+  const announce = useCallback((next: string, options?: { delay?: number }) => {
+    clearTimeout(timer.current);
+    setText('');
+    if (next === '') return;
+    timer.current = setTimeout(() => setText(next), options?.delay ?? 0);
+  }, []);
+
+  useEffect(() => () => clearTimeout(timer.current), []);
+
+  const region = useMemo(
+    () =>
+      createElement(
+        'div',
+        { className: 'flg-visually-hidden', 'aria-live': 'polite', 'aria-atomic': 'true' },
+        text,
+      ),
+    [text],
+  );
+  return { announce, region };
+}
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/combobox src/components/select src/internal
pnpm vitest run --project storybook-light --project storybook-dark src/components/combobox
pnpm build && pnpm check:package
```

Expected: 615 test đơn vị PASS, 3 skip (`Combobox.test.tsx` 113 test mỗi project). Story `combobox` 84 test PASS (14 story × 3 engine × 2 theme), gồm `CustomValueSubmit` ở Firefox. `check:package` PASS, gồm `check:use-client` (build xuất `use-announce` qua Combobox) và `size` (JS 35.19 kB trên 35.86 kB, CSS 7.39 kB trên 7.93 kB). Combobox chỉ có thêm một phần tử ẩn (`flg-visually-hidden`) và một dòng trạng thái khi `loading`, nên `Look`, `Open` và `Empty` không đổi.

- [ ] **Step 5: Commit**

```bash
git add \
  src/components/combobox/Combobox.mdx \
  src/components/combobox/Combobox.stories.tsx \
  src/components/combobox/Combobox.test-d.ts \
  src/components/combobox/Combobox.test.tsx \
  src/components/combobox/Combobox.tsx \
  src/internal/use-announce.test.tsx \
  src/internal/use-announce.ts
```
```bash
git commit -m "feat(combobox): custom values, loading and announcements" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 5: `TagInput`, kèm `split-tags.ts`

Spec §3.1 (dòng TagInput, **TagInput giữ input ẩn**), §3.2, §3.6, §4.3 (giao diện Ta1), §4.5, §5 (`tag-input/split-tags.ts`, các primitive dùng lại, cảnh báo dev), §6.1, §6.3 **`TagInput`** trừ phần từ chối, §7, §10 (`display: contents`). Một ô gõ nhận nhiều thẻ tự do.
- **Cấu trúc**: các thẻ là chip `Badge` `neutral` có nút xoá (`CloseIcon`), nằm chung một hàng `flex-wrap` với ô gõ trong khung của `Input`. `<ul>` và `<li>` có `display: contents` để giữ ngữ nghĩa danh sách; `<ul>` rỗng không được render. Bấm vào khung (ngoài chip và nút) thì focus ô gõ.
- **Thêm thẻ**: một ký tự ngăn thêm chữ trước nó, phần sau vẫn ở trong ô. Enter thêm khi `"Enter"` là ký tự ngăn và ô có chữ; Enter trên ô trống không bị chặn, nên form gửi. Dán đi qua `splitTags`, nối với chữ quanh con trỏ trước khi tách. Focus rời TagInput (không phải sang nút xoá của chính nó) thì chữ gõ dở thành thẻ.
- **IME**: không làm gì với phím hay sự kiện input khi IME đang soạn chữ (`isComposing`, `keyCode === 229`), vì tiếng Việt được gõ qua IME.
- **Phím trên nút xoá** đúng §6.3 **Bàn phím**. Các nút có `tabIndex={-1}`. Backspace trên ô trống, hoặc ← khi con trỏ chữ ở đầu ô, tới nút của thẻ cuối. Backspace, Delete, Enter, Space xoá thẻ; focus sang nút kế, nút trước, hoặc về ô gõ. ←/→/Home/End di chuyển giữa các nút. Esc về ô gõ và không để Esc tới Dialog bao ngoài. Ký tự in được về ô gõ. Phím giữ lâu và phím có Alt, Ctrl, Meta được bỏ qua. Bấm chuột vào nút xoá thì focus về ô gõ (phát hiện 3).
- **Thông báo**: vùng live riêng (`useAnnounce`) đọc `labels.added(tag)` và `labels.removed(tag)`, một câu cho cả lần dán; thay đổi do component cha không được đọc.
- **Form**: mỗi thẻ một `<input type="hidden" name>`, mang cả `form` và `disabled` của TagInput. Ô gõ `required` chỉ khi chưa có thẻ nào. Reset về `defaultValue` và `defaultInputValue`, trừ khi reset bị huỷ; giá trị controlled được giữ.
- **`readOnly`**, **`disabled`**, **`size`** (`sm` padding dọc 2px, phát hiện 3), giao diện lỗi từ Field hoặc `invalid`.
- **Cảnh báo dev**: `separators` có phần tử dài hơn một ký tự mà không phải `"Enter"` (một câu liệt kê chúng); `TagInput value` và `TagInput inputValue` đổi giữa controlled và uncontrolled.
- Task này **chưa có** phần từ chối (`validate`, `maxTags`, `allowDuplicates`, lời báo lỗi): mọi chữ không rỗng sau khi bỏ khoảng trắng thành thẻ, kể cả thẻ trùng (Task 6).
- `split-tags.ts` do `dots-3-note-preview:free` (kilo) viết qua opencode, Claude kiểm tra. Nó nằm ở task này vì `TagInput` là nơi đầu tiên import nó.
- Story `Paste` copy và paste thật qua `copyAndPaste()` (phát hiện 6). Form của story `LeavingWithText` rộng 420px (phát hiện 7).

**Files:**
- Create: `src/components/tag-input/TagInput.tsx`, `split-tags.ts`, `index.ts`, `TagInput.test.tsx`, `TagInput.test-d.ts`, `split-tags.test.ts`, `TagInput.stories.tsx`, `TagInput.mdx`, `src/styles/components/tag-input.css`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md`

**Interfaces:**
- Produces trong `src/components/tag-input/split-tags.ts` (thuần, không `"use client"`): `splitTags(text: string, separators: readonly string[]): string[]`.
  - Tách ở mọi phần tử một code point của `separators` (`'😀'` cũng được), và ở xuống dòng (`\r\n`, `\n`, `\r`) khi có `"Enter"`. Phần tử dài hơn mà không phải `"Enter"` bị bỏ qua.
  - Tách bằng vòng lặp trên code point, không dựng regex, nên `.`, `|`, `\` tách đúng chữ.
  - Mỗi phần được bỏ khoảng trắng hai đầu (cả NBSP); phần rỗng bị bỏ; giữ thứ tự và thẻ trùng.
- Produces: `TagInput`, `TagInputProps` (export phẳng từ `src/index.ts`).
  - `TagInputProps` là `Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'size'>` cộng: `value` / `defaultValue` / `onValueChange` (`string[]`), `inputValue` / `defaultInputValue` / `onInputValueChange`, `separators` (mặc định `["Enter", ","]`), `size` (`'sm' | 'md' | 'lg'`), `invalid`, `labels: { remove?, added?, removed? }` (mặc định `Remove <tag>`, `<tag> added`, `<tag> removed`).
  - `ref`, `id`, `placeholder`, `required`, `readOnly`, `aria-*` và các prop HTML còn lại gắn vào ô gõ; `name` và `form` gắn vào các input ẩn; `className` và `style` lên phần tử gốc.
  - Class `flg-tag-input`, `flg-tag-input-box`, `flg-tag-input-list`, `flg-tag-input-item`, `flg-tag`.
  - Task 6 thêm phần từ chối vào `add(parts)` của component.
- Consumes: `useAnnounce` (Task 4), `useFormReset`, `useFieldProps`, `markAsFieldControl`, `useControllableState`, `useWriteOnCommit`, `composeEventHandlers`, `hasModifier`, `CloseIcon`, `Badge`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/tag-input/TagInput.stories.tsx b/src/components/tag-input/TagInput.stories.tsx
new file mode 100644
index 0000000..ac57477
--- /dev/null
+++ b/src/components/tag-input/TagInput.stories.tsx
@@ -0,0 +1,435 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { useState } from 'react';
+import { expect, userEvent, waitFor } from 'storybook/test';
+import { expectBorderWhileFocused } from '../../../.storybook/focus-border';
+import { realUserEvent } from '../../../.storybook/real-input';
+import { Field } from '../field/Field';
+import { TagInput } from './TagInput';
+
+const meta = {
+  title: 'Components/TagInput',
+  component: TagInput,
+  parameters: { stage: 'viewport' },
+} satisfies Meta<typeof TagInput>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+const column = { placeSelf: 'start', display: 'grid', gap: 16, width: 280 } as const;
+const caption = {
+  fontSize: 'var(--flg-text-xs)',
+  color: 'var(--flg-text-muted)',
+  marginBottom: 6,
+} as const;
+
+// The skills of the approved mockup (Ta1): enough chips to wrap in the width of the column.
+// A form wide enough that a new chip does not wrap the row: the frame would grow, move the submit button
+// under the pointer between its press and its release, and the click would miss it.
+const wide = { ...column, width: 420 } as const;
+
+const skills = ['React', 'TypeScript', 'Accessibility', 'CSS'];
+
+const frameOf = (input: HTMLElement) => input.closest<HTMLElement>('.flg-tag-input-box')!;
+const removeButtons = (root: HTMLElement) =>
+  Array.from(root.querySelectorAll<HTMLButtonElement>('li button'));
+const tagsOf = (root: HTMLElement) =>
+  Array.from(root.querySelectorAll('li .flg-tag'), (tag) => tag.firstChild?.textContent);
+
+/** The look of the mockup (Ta1): neutral chips with a ×, and the text input, in one wrapping frame. */
+export const Look: Story = {
+  render: () => (
+    <div style={column}>
+      <div>
+        <div style={caption}>Resting, the chips wrap</div>
+        <TagInput aria-label="Skills, resting" defaultValue={skills} />
+      </div>
+      <div>
+        <div style={caption}>A tag being typed</div>
+        <TagInput
+          aria-label="Skills, typing"
+          defaultValue={skills.slice(0, 2)}
+          defaultInputValue="Sv"
+        />
+      </div>
+      <div>
+        <div style={caption}>Empty, with a placeholder</div>
+        <TagInput aria-label="Skills, empty" placeholder="Add a skill…" />
+      </div>
+      <div>
+        <div style={caption}>Invalid</div>
+        <TagInput aria-label="Skills, invalid" defaultValue={skills.slice(0, 2)} invalid />
+      </div>
+      <div>
+        <div style={caption}>Disabled</div>
+        <TagInput aria-label="Skills, disabled" defaultValue={skills.slice(0, 2)} disabled />
+      </div>
+      <div>
+        <div style={caption}>Small</div>
+        <TagInput aria-label="Skills, small" size="sm" defaultValue={skills.slice(0, 2)} />
+      </div>
+      <div>
+        <div style={caption}>Small, empty</div>
+        <TagInput aria-label="Skills, small and empty" size="sm" placeholder="Add a skill…" />
+      </div>
+      <div>
+        <div style={caption}>Large</div>
+        <TagInput aria-label="Skills, large" size="lg" defaultValue={skills.slice(0, 2)} />
+      </div>
+      <Field
+        label="Skills"
+        description="Press Enter or comma after each."
+        error="Add a skill."
+        required
+      >
+        <TagInput name="skills" placeholder="Add a skill…" />
+      </Field>
+    </div>
+  ),
+  play: async ({ canvas }) => {
+    // The frame is the height of an Input of its size while it holds one row.
+    const heights = ['Skills, small and empty', 'Skills, empty', 'Skills, large'].map((name) =>
+      Math.round(frameOf(canvas.getByRole('textbox', { name })).getBoundingClientRect().height),
+    );
+    await expect(heights).toEqual([28, 34, 40]);
+    // A small frame with chips is still 28px: its padding is 2px (spec §4.3).
+    const small = canvas.getByRole('textbox', { name: 'Skills, small' });
+    await expect(Math.round(frameOf(small).getBoundingClientRect().height)).toBe(28);
+    // The chips wrap: the last chip is below the first.
+    const resting = canvas.getByRole('textbox', { name: 'Skills, resting' });
+    const chips = Array.from(frameOf(resting).querySelectorAll('.flg-tag'));
+    await expect(chips.at(-1)!.getBoundingClientRect().top).toBeGreaterThan(
+      chips[0]!.getBoundingClientRect().top,
+    );
+    // The list keeps its semantics and takes no box.
+    await expect(getComputedStyle(frameOf(resting).querySelector('ul')!).display).toBe('contents');
+    // Disabled: the whole frame dims, the input and the buttons are off.
+    const disabled = canvas.getByRole('textbox', { name: 'Skills, disabled' });
+    await expect(disabled).toBeDisabled();
+    await expect(removeButtons(frameOf(disabled))[0]).toBeDisabled();
+    await expect(getComputedStyle(frameOf(disabled)).opacity).toBe('0.5');
+    // Invalid, by prop and from the Field.
+    await expect(canvas.getByRole('textbox', { name: 'Skills, invalid' })).toHaveAttribute(
+      'aria-invalid',
+      'true',
+    );
+    await expect(canvas.getByRole('textbox', { name: /^Skills$|^Skills \*/ })).toBeRequired();
+    // Focus keeps the danger border on an invalid frame, so the error stays visible while it is fixed.
+    const invalid = canvas.getByRole('textbox', { name: 'Skills, invalid' });
+    await expectBorderWhileFocused(invalid, frameOf(invalid), 'var(--flg-danger)');
+  },
+};
+
+function Controlled() {
+  const [tags, setTags] = useState(['React']);
+  const [text, setText] = useState('');
+  return (
+    <div style={column}>
+      <TagInput
+        aria-label="Skills"
+        value={tags}
+        onValueChange={setTags}
+        inputValue={text}
+        onInputValueChange={setText}
+      />
+      <output aria-label="State">{`${JSON.stringify(tags)} / ${text}`}</output>
+    </div>
+  );
+}
+
+/** Real keys: Backspace and ← reach the tags, ← → Home End move along them, Delete removes. */
+export const Keyboard: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={column}>
+      <TagInput aria-label="Skills" defaultValue={['Ann', 'Bob', 'Cy']} />
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const user = (await realUserEvent()) ?? userEvent;
+    const input = canvas.getByRole('textbox', { name: 'Skills' });
+    const names = () => removeButtons(canvasElement).map((button) => button.ariaLabel);
+    await expect(names()).toEqual(['Remove Ann', 'Remove Bob', 'Remove Cy']);
+    // The buttons are out of the tab order: Tab from the page lands on the text input.
+    await user.tab();
+    await expect(input).toHaveFocus();
+
+    // Backspace in the empty input reaches the last tag; ← → Home End move along them.
+    await user.keyboard('{Backspace}');
+    await expect(canvas.getByRole('button', { name: 'Remove Cy' })).toHaveFocus();
+    await user.keyboard('{ArrowLeft}');
+    await expect(canvas.getByRole('button', { name: 'Remove Bob' })).toHaveFocus();
+    await user.keyboard('{Home}');
+    await expect(canvas.getByRole('button', { name: 'Remove Ann' })).toHaveFocus();
+    await user.keyboard('{End}');
+    await expect(canvas.getByRole('button', { name: 'Remove Cy' })).toHaveFocus();
+    await user.keyboard('{ArrowRight}');
+    await expect(input).toHaveFocus();
+
+    // Esc on a button goes back to the input.
+    await user.keyboard('{Backspace}{Escape}');
+    await expect(input).toHaveFocus();
+
+    // Delete removes the focused tag; the focus goes to the one before when the last was removed.
+    await user.keyboard('{Backspace}{Delete}');
+    await expect(tagsOf(canvasElement)).toEqual(['Ann', 'Bob']);
+    await expect(canvas.getByRole('button', { name: 'Remove Bob' })).toHaveFocus();
+
+    // A printable key on a button is typed into the input.
+    await user.keyboard('x');
+    await expect(input).toHaveFocus();
+    await expect(input).toHaveValue('x');
+
+    // ← at the start of the text reaches the tags, and Backspace removes the one focused.
+    await user.keyboard('{Home}{ArrowLeft}');
+    await expect(canvas.getByRole('button', { name: 'Remove Bob' })).toHaveFocus();
+    await user.keyboard('{Backspace}');
+    await expect(tagsOf(canvasElement)).toEqual(['Ann']);
+    await expect(canvas.getByRole('button', { name: 'Remove Ann' })).toHaveFocus();
+    // With none left, the input gets the focus, and its text is still there.
+    await user.keyboard('{Delete}');
+    await expect(tagsOf(canvasElement)).toEqual([]);
+    await expect(input).toHaveFocus();
+    await expect(input).toHaveValue('x');
+
+    // Enter and Space on a button are its click.
+    await user.clear(input);
+    await user.keyboard('a,b,c,');
+    await expect(tagsOf(canvasElement)).toEqual(['a', 'b', 'c']);
+    removeButtons(canvasElement)[1]!.focus();
+    await user.keyboard('{Enter}');
+    await expect(tagsOf(canvasElement)).toEqual(['a', 'c']);
+    await expect(canvas.getByRole('button', { name: 'Remove c' })).toHaveFocus();
+    await user.keyboard(' ');
+    await expect(tagsOf(canvasElement)).toEqual(['a']);
+  },
+};
+
+/** Typing: a separator ends a tag, Enter too, blank text is no tag, and the live region says it. */
+export const Typing: Story = {
+  tags: ['no-visual'],
+  render: () => <Controlled />,
+  play: async ({ canvas, canvasElement }) => {
+    const user = (await realUserEvent()) ?? userEvent;
+    const input = canvas.getByRole('textbox', { name: 'Skills' });
+    const state = canvas.getByLabelText('State');
+    await user.click(input);
+    await user.keyboard('Vue,Sv');
+    await expect(state).toHaveTextContent('["React","Vue"] / Sv');
+    await user.keyboard('elte{Enter}');
+    await expect(state).toHaveTextContent('["React","Vue","Svelte"] /');
+    await user.keyboard('   ,{Enter}');
+    await expect(state).toHaveTextContent('["React","Vue","Svelte"] /');
+    const live = canvasElement.querySelector('[aria-live]')!;
+    await user.keyboard('Solid,');
+    await waitFor(() => expect(live).toHaveTextContent('Solid added'));
+    await user.keyboard('{Backspace}{Delete}');
+    await waitFor(() => expect(live).toHaveTextContent('Solid removed'));
+  },
+};
+
+/**
+ * Text in a textarea, copied with the keyboard and pasted into the TagInput, so that it gets a paste
+ * the browser made. WebKit's clipboard is the system's, shared by every browser process that runs: a
+ * second run, or the owner's other apps, can replace it between the copy and the paste (the paste
+ * then holds another run's text, or nothing). So the paste follows the copy at once, and when it
+ * does not show `expected` the text it left behind is cleared and the copy and paste are tried again.
+ */
+async function copyAndPaste(
+  user: NonNullable<Awaited<ReturnType<typeof realUserEvent>>>,
+  source: HTMLTextAreaElement,
+  input: HTMLInputElement,
+  text: string,
+  expected: () => Promise<void>,
+) {
+  for (let attempt = 1; ; attempt += 1) {
+    source.value = text;
+    source.focus();
+    source.select();
+    await user.copy();
+    input.focus();
+    await user.paste();
+    try {
+      await waitFor(expected, { timeout: 1000 });
+      return;
+    } catch (error) {
+      if (attempt === 3) throw error;
+      input.select();
+      await user.keyboard('{Delete}');
+    }
+  }
+}
+
+/** Paste is split at the separators and at line breaks; text with nothing to split stays text. */
+export const Paste: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={column}>
+      <Controlled />
+      <textarea aria-label="Source" />
+    </div>
+  ),
+  play: async ({ canvas }) => {
+    // A paste needs the browser's own clipboard, which only trusted input reaches.
+    const user = await realUserEvent();
+    if (!user) return;
+    const input = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Skills' });
+    const source = canvas.getByRole<HTMLTextAreaElement>('textbox', { name: 'Source' });
+    const state = canvas.getByLabelText('State');
+    await copyAndPaste(user, source, input, 'Vue, Svelte\nSolid,, ', () =>
+      expect(state).toHaveTextContent('["React","Vue","Svelte","Solid"] /'),
+    );
+    // Nothing to split at: the browser pastes it as text, to be made a tag by Enter or by leaving.
+    await copyAndPaste(user, source, input, 'Qwik', () =>
+      expect(state).toHaveTextContent('["React","Vue","Svelte","Solid"] / Qwik'),
+    );
+    await user.keyboard('{Enter}');
+    await expect(state).toHaveTextContent('["React","Vue","Svelte","Solid","Qwik"] /');
+  },
+};
+
+function SkillsForm({ onSubmit }: { onSubmit: (tags: string[]) => void }) {
+  return (
+    <form
+      aria-label="Profile"
+      style={wide}
+      onSubmit={(event) => {
+        event.preventDefault();
+        onSubmit(new FormData(event.currentTarget).getAll('skills') as string[]);
+      }}
+    >
+      <Field label="Skills">
+        <TagInput name="skills" defaultValue={['React', 'Vue']} />
+      </Field>
+      <button type="submit">Save</button>
+      <button type="reset">Reset</button>
+    </form>
+  );
+}
+
+const submissions: string[][] = [];
+
+/** Leaving with text pending adds it as a tag, and the submit that the leave leads to carries it. */
+export const LeavingWithText: Story = {
+  tags: ['no-visual'],
+  render: () => <SkillsForm onSubmit={(tags) => submissions.push(tags)} />,
+  play: async ({ canvas, canvasElement }) => {
+    submissions.length = 0;
+    const user = (await realUserEvent()) ?? userEvent;
+    const input = canvas.getByRole('textbox', { name: 'Skills' });
+
+    // The pending text becomes a tag when focus leaves with Tab.
+    await user.click(input);
+    await user.keyboard('Svelte');
+    await user.tab();
+    await expect(tagsOf(canvasElement)).toEqual(['React', 'Vue', 'Svelte']);
+    await expect(input).toHaveValue('');
+
+    // The submit button pressed without Enter: the blur adds the tag, the submit carries it.
+    await user.click(input);
+    await user.keyboard('Solid');
+    await user.click(canvas.getByRole('button', { name: 'Save' }));
+    await waitFor(() => expect(submissions).toHaveLength(1));
+    await expect(submissions[0]).toEqual(['React', 'Vue', 'Svelte', 'Solid']);
+
+    // Moving to the TagInput's own remove button is not leaving.
+    await user.click(input);
+    await user.keyboard('Qwik{Home}{ArrowLeft}');
+    await expect(removeButtons(canvasElement).at(-1)).toHaveFocus();
+    await expect(tagsOf(canvasElement)).toEqual(['React', 'Vue', 'Svelte', 'Solid']);
+    await expect(input).toHaveValue('Qwik');
+  },
+};
+
+/** FormData: several values under one name; Enter on empty text submits them; reset. */
+export const InAForm: Story = {
+  tags: ['no-visual'],
+  render: () => <SkillsForm onSubmit={(tags) => submissions.push(tags)} />,
+  play: async ({ canvas, canvasElement }) => {
+    submissions.length = 0;
+    const user = (await realUserEvent()) ?? userEvent;
+    const form = canvasElement.querySelector('form')!;
+    const input = canvas.getByRole('textbox', { name: 'Skills' });
+    await expect(new FormData(form).getAll('skills')).toEqual(['React', 'Vue']);
+
+    // Enter with text adds the tag and does not submit; on empty text it submits, with every tag.
+    await user.click(input);
+    await user.keyboard('Svelte{Enter}');
+    await expect(tagsOf(canvasElement)).toEqual(['React', 'Vue', 'Svelte']);
+    await expect(submissions).toEqual([]);
+    await user.keyboard('{Enter}');
+    await waitFor(() => expect(submissions).toEqual([['React', 'Vue', 'Svelte']]));
+
+    // A tag typed a moment ago is in what the next Enter submits (Firefox submits at once).
+    await user.keyboard('Solid,{Enter}');
+    await waitFor(() => expect(submissions).toHaveLength(2));
+    await expect(submissions[1]).toEqual(['React', 'Vue', 'Svelte', 'Solid']);
+
+    // Reset: the tags and the text go back to their defaults.
+    await user.keyboard('typed');
+    await user.click(canvas.getByRole('button', { name: 'Reset' }));
+    await waitFor(() => expect(tagsOf(canvasElement)).toEqual(['React', 'Vue']));
+    await expect(input).toHaveValue('');
+    await expect(new FormData(form).getAll('skills')).toEqual(['React', 'Vue']);
+  },
+};
+
+const requiredSent: string[][] = [];
+
+/** `required` stands on the text input while there is no tag: the native check blocks the submit. */
+export const Required: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <form
+      aria-label="Profile"
+      style={column}
+      onSubmit={(event) => {
+        event.preventDefault();
+        requiredSent.push(new FormData(event.currentTarget).getAll('skills') as string[]);
+      }}
+    >
+      <Field label="Skills" required>
+        <TagInput name="skills" />
+      </Field>
+      <button type="submit">Save</button>
+    </form>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    requiredSent.length = 0;
+    const user = (await realUserEvent()) ?? userEvent;
+    const input = canvas.getByRole<HTMLInputElement>('textbox', { name: /^Skills/ });
+    await expect(input).toBeRequired();
+    await user.click(canvas.getByRole('button', { name: 'Save' }));
+    // The browser stops the submit, and shows its message on the text input.
+    await expect(input.validity.valueMissing).toBe(true);
+    await waitFor(() => expect(input).toHaveFocus());
+    await expect(requiredSent).toEqual([]);
+    // Once a tag is there, the text input no longer asks for text.
+    await user.keyboard('React,');
+    await expect(input.validity.valid).toBe(true);
+    await user.click(canvas.getByRole('button', { name: 'Save' }));
+    await waitFor(() => expect(requiredSent).toEqual([['React']]));
+    // Removing the last tag brings the requirement back.
+    await user.click(input);
+    await user.keyboard('{Backspace}{Delete}');
+    await expect(tagsOf(canvasElement)).toEqual([]);
+    await expect(input.validity.valueMissing).toBe(true);
+  },
+};
+
+/** Read-only: the tags stay, and cannot be added to or removed. */
+export const ReadOnly: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={column}>
+      <TagInput aria-label="Skills" readOnly defaultValue={['Ann', 'Bob']} />
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const user = (await realUserEvent()) ?? userEvent;
+    const input = canvas.getByRole('textbox', { name: 'Skills' });
+    await user.click(input);
+    await user.keyboard('x,');
+    await expect(tagsOf(canvasElement)).toEqual(['Ann', 'Bob']);
+    await expect(removeButtons(canvasElement)[0]).toBeDisabled();
+  },
+};
diff --git a/src/components/tag-input/TagInput.test-d.ts b/src/components/tag-input/TagInput.test-d.ts
new file mode 100644
index 0000000..05768f1
--- /dev/null
+++ b/src/components/tag-input/TagInput.test-d.ts
@@ -0,0 +1,38 @@
+import { expectTypeOf, test } from 'vitest';
+import type { TagInputProps } from './TagInput';
+
+test('a TagInput holds a list of strings, and reports the whole list', () => {
+  expectTypeOf<TagInputProps['value']>().toEqualTypeOf<string[] | undefined>();
+  expectTypeOf<TagInputProps['defaultValue']>().toEqualTypeOf<string[] | undefined>();
+  expectTypeOf<TagInputProps['onValueChange']>().toEqualTypeOf<
+    ((value: string[]) => void) | undefined
+  >();
+  // @ts-expect-error a tag list is not a string
+  const text: TagInputProps = { value: 'a,b' };
+  expectTypeOf(text).toBeObject();
+});
+
+test('the text typed has its own value, default and callback', () => {
+  expectTypeOf<TagInputProps['inputValue']>().toEqualTypeOf<string | undefined>();
+  expectTypeOf<TagInputProps['defaultInputValue']>().toEqualTypeOf<string | undefined>();
+  expectTypeOf<TagInputProps['onInputValueChange']>().toEqualTypeOf<
+    ((text: string) => void) | undefined
+  >();
+});
+
+test('a TagInput accepts only the sizes of Input', () => {
+  expectTypeOf<TagInputProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
+  // @ts-expect-error 'xl' is not a size
+  const unknownSize: TagInputProps = { size: 'xl' };
+  expectTypeOf(unknownSize).toBeObject();
+});
+
+test('the labels are optional functions of the tag', () => {
+  type Labels = NonNullable<TagInputProps['labels']>;
+  expectTypeOf<Labels['remove']>().toEqualTypeOf<((tag: string) => string) | undefined>();
+  expectTypeOf<Labels['added']>().toEqualTypeOf<((tag: string) => string) | undefined>();
+  expectTypeOf<Labels['removed']>().toEqualTypeOf<((tag: string) => string) | undefined>();
+  // @ts-expect-error a label that takes a tag is a function, not a string
+  const wrong: Labels = { added: 'added' };
+  expectTypeOf(wrong).toBeObject();
+});
diff --git a/src/components/tag-input/TagInput.test.tsx b/src/components/tag-input/TagInput.test.tsx
new file mode 100644
index 0000000..9a78296
--- /dev/null
+++ b/src/components/tag-input/TagInput.test.tsx
@@ -0,0 +1,756 @@
+import { act, fireEvent, render, screen } from '@testing-library/react';
+import { renderToString } from 'react-dom/server';
+import { useState } from 'react';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import { Field } from '../field/Field';
+import { TagInput } from './TagInput';
+
+const input = () => screen.getByRole<HTMLInputElement>('textbox');
+const removeButtons = () => Array.from(document.querySelectorAll<HTMLButtonElement>('li button'));
+const tagTexts = () =>
+  Array.from(document.querySelectorAll('li .flg-tag'), (tag) => tag.firstChild?.textContent);
+const hidden = () =>
+  Array.from(document.querySelectorAll<HTMLInputElement>('input[type="hidden"]'), (el) => el.value);
+const type = (text: string) => fireEvent.change(input(), { target: { value: text } });
+const key = (name: string, init: Partial<KeyboardEventInit> = {}, target: Element = input()) =>
+  fireEvent.keyDown(target, { key: name, ...init });
+const aTaskLater = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
+const paste = (text: string) =>
+  fireEvent.paste(input(), { clipboardData: { getData: () => text } });
+
+describe('TagInput', () => {
+  beforeEach(() => resetDevWarnings());
+  afterEach(() => vi.restoreAllMocks());
+
+  describe('markup and ARIA', () => {
+    it('renders a root, a framed list of chips, the text input and one hidden input per tag', () => {
+      render(<TagInput aria-label="Skills" name="skills" defaultValue={['React', 'Vue']} />);
+      const root = document.querySelector('.flg-tag-input')!;
+      expect(root).toHaveAttribute('data-size', 'md');
+      const box = root.querySelector('.flg-input.flg-tag-input-box')!;
+      expect(box.querySelector(':scope > ul.flg-tag-input-list')).not.toBeNull();
+      expect(box.querySelector(':scope > input[type="text"]')).toBe(input());
+      expect(tagTexts()).toEqual(['React', 'Vue']);
+      expect(document.querySelectorAll('li .flg-badge[data-variant="neutral"]')).toHaveLength(2);
+      expect(hidden()).toEqual(['React', 'Vue']);
+      expect(root.querySelectorAll('input[type="hidden"][name="skills"]')).toHaveLength(2);
+    });
+
+    it('exposes the tags as a list, and names each remove button from labels.remove', () => {
+      render(
+        <TagInput
+          aria-label="Skills"
+          defaultValue={['React', 'Vue']}
+          labels={{ remove: (tag) => `Xoá ${tag}` }}
+        />,
+      );
+      expect(screen.getAllByRole('listitem')).toHaveLength(2);
+      expect(screen.getByRole('list')).toBeInTheDocument();
+      expect(screen.getByRole('button', { name: 'Xoá React' })).toBeInTheDocument();
+    });
+
+    it('names a remove button "Remove <tag>" by default and keeps it out of the tab order', () => {
+      render(<TagInput aria-label="Skills" defaultValue={['React']} />);
+      const button = screen.getByRole('button', { name: 'Remove React' });
+      expect(button).toHaveAttribute('tabindex', '-1');
+      expect(button).toHaveAttribute('type', 'button');
+    });
+
+    it('puts className and style on the root, the ref and the other props on the text input', () => {
+      const ref = { current: null as HTMLInputElement | null };
+      render(
+        <TagInput
+          ref={ref}
+          aria-label="Skills"
+          className="mine"
+          style={{ width: 300 }}
+          placeholder="Add"
+          id="skills"
+          autoComplete="off"
+        />,
+      );
+      const root = document.querySelector('.flg-tag-input')!;
+      expect(root).toHaveClass('mine');
+      expect(root).toHaveStyle({ width: '300px' });
+      expect(ref.current).toBe(input());
+      expect(input()).toHaveAttribute('placeholder', 'Add');
+      expect(input()).toHaveAttribute('id', 'skills');
+      expect(input()).toHaveAttribute('autocomplete', 'off');
+      expect(input()).not.toHaveAttribute('name');
+    });
+
+    it('takes its id, label, description and state from a Field', () => {
+      render(
+        <Field label="Skills" description="What you know." error="Add one." required>
+          <TagInput name="skills" />
+        </Field>,
+      );
+      expect(screen.getByRole('textbox', { name: /Skills/ })).toBe(input());
+      expect(input()).toHaveAccessibleDescription('What you know. Add one.');
+      expect(input()).toHaveAttribute('aria-invalid', 'true');
+      expect(input()).toBeRequired();
+      expect(document.querySelector('.flg-tag-input')).toHaveAttribute('data-invalid');
+      expect(document.querySelector('.flg-tag-input-box')).toHaveAttribute('data-invalid');
+    });
+
+    it('marks itself invalid with the invalid prop, disabled and read-only on the root', () => {
+      const { rerender } = render(<TagInput aria-label="Skills" invalid />);
+      expect(input()).toHaveAttribute('aria-invalid', 'true');
+      rerender(<TagInput aria-label="Skills" disabled value={['a']} />);
+      expect(document.querySelector('.flg-tag-input')).toHaveAttribute('data-disabled');
+      expect(input()).toBeDisabled();
+      expect(removeButtons()[0]).toBeDisabled();
+      rerender(<TagInput aria-label="Skills" readOnly value={['a']} />);
+      expect(document.querySelector('.flg-tag-input')).toHaveAttribute('data-readonly');
+      expect(input()).toHaveAttribute('readonly');
+      expect(removeButtons()[0]).toBeDisabled();
+    });
+
+    it('takes the three sizes', () => {
+      const { rerender } = render(<TagInput aria-label="Skills" size="sm" />);
+      expect(document.querySelector('.flg-tag-input')).toHaveAttribute('data-size', 'sm');
+      expect(document.querySelector('.flg-tag-input-box')).toHaveAttribute('data-size', 'sm');
+      rerender(<TagInput aria-label="Skills" size="lg" />);
+      expect(document.querySelector('.flg-tag-input-box')).toHaveAttribute('data-size', 'lg');
+    });
+
+    it('focuses the text input when the frame, but not a chip or a button, is pressed', () => {
+      render(<TagInput aria-label="Skills" defaultValue={['React']} />);
+      const box = document.querySelector<HTMLElement>('.flg-tag-input-box')!;
+      fireEvent.mouseDown(box);
+      expect(input()).toHaveFocus();
+      input().blur();
+      const pressed = fireEvent.mouseDown(removeButtons()[0]!);
+      expect(pressed).toBe(true);
+      expect(input()).not.toHaveFocus();
+    });
+
+    it('renders on the server with its tags, hidden inputs and an empty live region', () => {
+      const html = renderToString(
+        <TagInput aria-label="Skills" name="skills" defaultValue={['React']} />,
+      );
+      expect(html).toContain('<input type="hidden" name="skills" value="React"/>');
+      expect(html).toContain(
+        '<div class="flg-visually-hidden" aria-live="polite" aria-atomic="true"></div>',
+      );
+    });
+  });
+
+  describe('adding tags by typing', () => {
+    it('turns the text before a comma into a tag and keeps what follows it typed', () => {
+      render(<TagInput aria-label="Skills" />);
+      type('React,');
+      expect(tagTexts()).toEqual(['React']);
+      expect(input()).toHaveValue('');
+      type('Vue,Sv');
+      expect(tagTexts()).toEqual(['React', 'Vue']);
+      expect(input()).toHaveValue('Sv');
+    });
+
+    it('trims the text and ignores empty text', () => {
+      render(<TagInput aria-label="Skills" />);
+      type('  React  ,');
+      type(' ,');
+      type(',');
+      expect(tagTexts()).toEqual(['React']);
+    });
+
+    it('adds on Enter when "Enter" is a separator and the input has text, and stops the form', () => {
+      render(<TagInput aria-label="Skills" />);
+      type('React');
+      const notPrevented = key('Enter');
+      expect(notPrevented).toBe(false);
+      expect(tagTexts()).toEqual(['React']);
+      expect(input()).toHaveValue('');
+    });
+
+    it('leaves Enter alone on an empty input, so the form submits', () => {
+      render(<TagInput aria-label="Skills" defaultValue={['React']} />);
+      expect(key('Enter')).toBe(true);
+      type('   ');
+      expect(key('Enter')).toBe(true);
+      expect(tagTexts()).toEqual(['React']);
+    });
+
+    it('does not add on Enter when "Enter" is not a separator', () => {
+      render(<TagInput aria-label="Skills" separators={[',']} />);
+      type('React');
+      expect(key('Enter')).toBe(true);
+      expect(tagTexts()).toEqual([]);
+      expect(input()).toHaveValue('React');
+    });
+
+    it('splits at the separators it is given and at no other', () => {
+      render(<TagInput aria-label="Skills" separators={[';', 'Enter']} />);
+      type('a,b');
+      expect(tagTexts()).toEqual([]);
+      type('a,b;');
+      expect(tagTexts()).toEqual(['a,b']);
+    });
+
+    it('keeps duplicates in this task: every non-empty text becomes a tag', () => {
+      render(<TagInput aria-label="Skills" />);
+      type('a,');
+      type('a,');
+      expect(tagTexts()).toEqual(['a', 'a']);
+    });
+
+    it('leaves text that is being composed alone, and splits it at the next input event', () => {
+      render(<TagInput aria-label="Skills" />);
+      type('xin');
+      // Enter, and a key with the IME's keyCode 229, belong to the input method.
+      expect(key('Enter', { isComposing: true })).toBe(true);
+      expect(key('Enter', { keyCode: 229 })).toBe(true);
+      expect(tagTexts()).toEqual([]);
+      // An input event during composition changes the text and splits nothing.
+      fireEvent.compositionStart(input());
+      fireEvent.change(input(), { target: { value: 'xin,' } });
+      expect(tagTexts()).toEqual([]);
+      expect(input()).toHaveValue('xin,');
+      fireEvent.compositionEnd(input());
+      expect(tagTexts()).toEqual([]);
+      // The input event after it, or leaving, takes the text.
+      fireEvent.change(input(), { target: { value: 'xin,c' } });
+      expect(tagTexts()).toEqual(['xin']);
+      expect(input()).toHaveValue('c');
+    });
+
+    it('splits the separators still in text that was composed when focus leaves', () => {
+      render(<TagInput aria-label="Skills" />);
+      fireEvent.compositionStart(input());
+      fireEvent.change(input(), { target: { value: 'xin,chào' } });
+      fireEvent.compositionEnd(input());
+      fireEvent.blur(input(), { relatedTarget: document.body });
+      expect(tagTexts()).toEqual(['xin', 'chào']);
+    });
+
+    it('does not let Backspace or ← move into the tags during composition', () => {
+      render(<TagInput aria-label="Skills" defaultValue={['a']} />);
+      key('Backspace', { isComposing: true });
+      key('ArrowLeft', { keyCode: 229 });
+      expect(removeButtons()[0]).not.toHaveFocus();
+    });
+
+    it('adds nothing when read-only or disabled', () => {
+      render(<TagInput aria-label="Skills" readOnly />);
+      type('a,');
+      key('Enter');
+      paste('a,b');
+      expect(tagTexts()).toEqual([]);
+    });
+  });
+
+  describe('paste', () => {
+    it('splits what is pasted at the separators and at line breaks', () => {
+      render(<TagInput aria-label="Skills" />);
+      input().focus();
+      const proceeded = paste('React, Vue\nSvelte,, ');
+      expect(proceeded).toBe(false);
+      expect(tagTexts()).toEqual(['React', 'Vue', 'Svelte']);
+      expect(input()).toHaveValue('');
+    });
+
+    it('joins the pasted text to the text around the caret before it splits', () => {
+      render(<TagInput aria-label="Skills" defaultInputValue="ab" />);
+      input().focus();
+      input().setSelectionRange(1, 1);
+      paste('X,Y');
+      expect(tagTexts()).toEqual(['aX', 'Yb']);
+    });
+
+    it('leaves a paste with nothing to split to the browser, as text in the input', () => {
+      render(<TagInput aria-label="Skills" />);
+      expect(paste('React')).toBe(true);
+      expect(tagTexts()).toEqual([]);
+    });
+
+    it('does not split at a line break when "Enter" is not a separator', () => {
+      render(<TagInput aria-label="Skills" separators={[',']} />);
+      expect(paste('a\nb')).toBe(true);
+      expect(tagTexts()).toEqual([]);
+    });
+  });
+
+  describe('leaving with text pending', () => {
+    it('adds the pending text as a tag when focus leaves the TagInput', () => {
+      render(
+        <>
+          <TagInput aria-label="Skills" />
+          <button>Elsewhere</button>
+        </>,
+      );
+      type('React');
+      fireEvent.blur(input(), { relatedTarget: screen.getByRole('button', { name: 'Elsewhere' }) });
+      expect(tagTexts()).toEqual(['React']);
+      expect(input()).toHaveValue('');
+    });
+
+    it('puts the pending text in the hidden inputs before the click that follows the blur', () => {
+      // A form's submit button is pressed: the blur adds the tag, and the submit that follows the
+      // press must already carry it (spec §3.1).
+      render(
+        <form>
+          <TagInput aria-label="Skills" name="skills" defaultValue={['a']} />
+          <button type="submit">Save</button>
+        </form>,
+      );
+      type('React');
+      fireEvent.blur(input(), { relatedTarget: screen.getByRole('button', { name: 'Save' }) });
+      const form = document.querySelector('form')!;
+      expect(new FormData(form).getAll('skills')).toEqual(['a', 'React']);
+    });
+
+    it('does not add it when focus moves to the remove button of its own tag', () => {
+      render(<TagInput aria-label="Skills" defaultValue={['a']} />);
+      type('React');
+      fireEvent.blur(input(), { relatedTarget: removeButtons()[0] });
+      expect(tagTexts()).toEqual(['a']);
+      expect(input()).toHaveValue('React');
+    });
+
+    it('adds it when focus leaves from a remove button to outside', () => {
+      render(
+        <>
+          <TagInput aria-label="Skills" defaultValue={['a']} />
+          <button>Elsewhere</button>
+        </>,
+      );
+      type('React');
+      fireEvent.blur(removeButtons()[0]!, {
+        relatedTarget: screen.getByRole('button', { name: 'Elsewhere' }),
+      });
+      expect(tagTexts()).toEqual(['a', 'React']);
+    });
+
+    it('adds nothing for empty text, and nothing when read-only', () => {
+      const { rerender } = render(<TagInput aria-label="Skills" />);
+      type('  ');
+      fireEvent.blur(input());
+      expect(tagTexts()).toEqual([]);
+      rerender(<TagInput aria-label="Skills" readOnly defaultInputValue="x" />);
+      fireEvent.blur(input());
+      expect(tagTexts()).toEqual([]);
+    });
+  });
+
+  describe('keyboard on the tags', () => {
+    const three = () => render(<TagInput aria-label="Skills" defaultValue={['a', 'b', 'c']} />);
+
+    it('moves to the last tag with Backspace on an empty input, and with ← at the start', () => {
+      three();
+      expect(key('Backspace')).toBe(false);
+      expect(removeButtons()[2]).toHaveFocus();
+      input().focus();
+      type('xy');
+      input().setSelectionRange(0, 0);
+      key('ArrowLeft');
+      expect(removeButtons()[2]).toHaveFocus();
+    });
+
+    it('leaves Backspace and ← alone when the input has text to act on', () => {
+      three();
+      type('xy');
+      input().setSelectionRange(1, 1);
+      expect(key('Backspace')).toBe(true);
+      expect(key('ArrowLeft')).toBe(true);
+      expect(removeButtons().some((button) => button === document.activeElement)).toBe(false);
+    });
+
+    it('leaves keys with Alt, Ctrl or Meta to the browser, and a held key to the input', () => {
+      three();
+      key('ArrowLeft', { ctrlKey: true });
+      key('Backspace', { altKey: true });
+      key('Backspace', { repeat: true });
+      expect(removeButtons().some((button) => button === document.activeElement)).toBe(false);
+    });
+
+    it('removes the tag with Backspace or Delete and focuses the next one', () => {
+      three();
+      removeButtons()[0]!.focus();
+      key('Backspace', {}, removeButtons()[0]!);
+      expect(tagTexts()).toEqual(['b', 'c']);
+      expect(removeButtons()[0]).toHaveFocus();
+      key('Delete', {}, removeButtons()[0]!);
+      expect(tagTexts()).toEqual(['c']);
+      expect(removeButtons()[0]).toHaveFocus();
+    });
+
+    it('focuses the tag before when the last one is removed, and the input when none is left', () => {
+      three();
+      removeButtons()[2]!.focus();
+      key('Delete', {}, removeButtons()[2]!);
+      expect(tagTexts()).toEqual(['a', 'b']);
+      expect(removeButtons()[1]).toHaveFocus();
+      key('Delete', {}, removeButtons()[1]!);
+      key('Delete', {}, removeButtons()[0]!);
+      expect(tagTexts()).toEqual([]);
+      expect(input()).toHaveFocus();
+    });
+
+    it('removes a tag with the native click of Enter and Space, keeping the keyboard focus rule', () => {
+      three();
+      removeButtons()[1]!.focus();
+      // A keyboard click has detail 0.
+      fireEvent.click(removeButtons()[1]!, { detail: 0 });
+      expect(tagTexts()).toEqual(['a', 'c']);
+      expect(removeButtons()[1]).toHaveFocus();
+    });
+
+    it('puts focus in the input after a pointer click removes a tag', () => {
+      three();
+      fireEvent.click(removeButtons()[0]!, { detail: 1 });
+      expect(tagTexts()).toEqual(['b', 'c']);
+      expect(input()).toHaveFocus();
+    });
+
+    it('moves between the buttons with ← and →, and to the input past the last', () => {
+      three();
+      removeButtons()[1]!.focus();
+      key('ArrowLeft', {}, removeButtons()[1]!);
+      expect(removeButtons()[0]).toHaveFocus();
+      key('ArrowLeft', {}, removeButtons()[0]!);
+      expect(removeButtons()[0]).toHaveFocus();
+      key('ArrowRight', {}, removeButtons()[0]!);
+      key('ArrowRight', {}, removeButtons()[1]!);
+      expect(removeButtons()[2]).toHaveFocus();
+      key('ArrowRight', {}, removeButtons()[2]!);
+      expect(input()).toHaveFocus();
+    });
+
+    it('goes to the first and the last tag with Home and End', () => {
+      three();
+      removeButtons()[1]!.focus();
+      key('End', {}, removeButtons()[1]!);
+      expect(removeButtons()[2]).toHaveFocus();
+      key('Home', {}, removeButtons()[2]!);
+      expect(removeButtons()[0]).toHaveFocus();
+    });
+
+    it('goes back to the input with Esc, and keeps the Esc from a Dialog around it', () => {
+      const onKeyDown = vi.fn();
+      render(
+        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
+        <div onKeyDown={onKeyDown}>
+          <TagInput aria-label="Skills" defaultValue={['a']} />
+        </div>,
+      );
+      removeButtons()[0]!.focus();
+      key('Escape', {}, removeButtons()[0]!);
+      expect(input()).toHaveFocus();
+      expect(onKeyDown).not.toHaveBeenCalled();
+    });
+
+    it('sends a printable key from a button to the input, as typed text', () => {
+      three();
+      type('x');
+      removeButtons()[0]!.focus();
+      const notDefault = key('y', {}, removeButtons()[0]!);
+      expect(notDefault).toBe(false);
+      expect(input()).toHaveFocus();
+      expect(input()).toHaveValue('xy');
+    });
+
+    it('splits a typed separator coming from a button like any other', () => {
+      three();
+      type('x');
+      removeButtons()[0]!.focus();
+      key(',', {}, removeButtons()[0]!);
+      expect(tagTexts()).toEqual(['a', 'b', 'c', 'x']);
+      expect(input()).toHaveFocus();
+    });
+
+    it('does not take Space, Enter, Tab, a held key, or a key with a modifier as typing', () => {
+      three();
+      const button = removeButtons()[0]!;
+      button.focus();
+      for (const init of [
+        { key: ' ' },
+        { key: 'Enter' },
+        { key: 'Tab' },
+        { key: 'a', ctrlKey: true },
+        { key: 'a', metaKey: true },
+        { key: 'a', isComposing: true },
+        { key: 'a', keyCode: 229 },
+      ]) {
+        fireEvent.keyDown(button, init);
+      }
+      expect(button).toHaveFocus();
+      expect(input()).toHaveValue('');
+    });
+
+    it('ignores a held Backspace on a button, so one press cannot delete the row', () => {
+      three();
+      removeButtons()[2]!.focus();
+      key('Backspace', { repeat: true }, removeButtons()[2]!);
+      expect(tagTexts()).toEqual(['a', 'b', 'c']);
+    });
+
+    it('cannot remove or move to a tag when read-only', () => {
+      render(<TagInput aria-label="Skills" readOnly defaultValue={['a']} />);
+      key('Backspace');
+      expect(tagTexts()).toEqual(['a']);
+      expect(removeButtons()[0]).not.toHaveFocus();
+    });
+  });
+
+  describe('announcements', () => {
+    const region = () => document.querySelector<HTMLElement>('[aria-live]')!;
+    beforeEach(() => vi.useFakeTimers());
+    afterEach(() => vi.useRealTimers());
+    const advance = (ms: number) =>
+      act(() => {
+        vi.advanceTimersByTime(ms);
+      });
+
+    it('has an empty polite live region in the root from the first render', () => {
+      render(<TagInput aria-label="Skills" />);
+      expect(region()).toHaveAttribute('aria-live', 'polite');
+      expect(region()).toBeEmptyDOMElement();
+      expect(region().parentElement).toHaveClass('flg-tag-input');
+    });
+
+    it('says labels.added for a tag that is added, and labels.removed for one that is removed', () => {
+      render(<TagInput aria-label="Skills" />);
+      type('React,');
+      advance(1);
+      expect(region()).toHaveTextContent('React added');
+      removeButtons()[0]!.focus();
+      key('Delete', {}, removeButtons()[0]!);
+      advance(1);
+      expect(region()).toHaveTextContent('React removed');
+    });
+
+    it('takes its words from labels and says every tag of a paste', () => {
+      render(
+        <TagInput
+          aria-label="Skills"
+          labels={{ added: (tag) => `Đã thêm ${tag}`, removed: (tag) => `Đã xoá ${tag}` }}
+        />,
+      );
+      paste('a,b');
+      advance(1);
+      expect(region()).toHaveTextContent('Đã thêm a. Đã thêm b');
+    });
+
+    it('does not announce what the parent changes', () => {
+      const { rerender } = render(<TagInput aria-label="Skills" value={['a']} />);
+      rerender(<TagInput aria-label="Skills" value={['a', 'b']} />);
+      advance(1);
+      expect(region()).toBeEmptyDOMElement();
+    });
+  });
+
+  describe('value and text', () => {
+    it('starts from defaultValue and defaultInputValue', () => {
+      render(<TagInput aria-label="Skills" defaultValue={['a']} defaultInputValue="xy" />);
+      expect(tagTexts()).toEqual(['a']);
+      expect(input()).toHaveValue('xy');
+    });
+
+    it('reports every change of the tags, whole, and of the text', () => {
+      const onValueChange = vi.fn();
+      const onInputValueChange = vi.fn();
+      render(
+        <TagInput
+          aria-label="Skills"
+          defaultValue={['a']}
+          onValueChange={onValueChange}
+          onInputValueChange={onInputValueChange}
+        />,
+      );
+      type('b,c');
+      expect(onValueChange).toHaveBeenLastCalledWith(['a', 'b']);
+      expect(onInputValueChange).toHaveBeenCalledWith('c');
+      removeButtons()[0]!.focus();
+      key('Delete', {}, removeButtons()[0]!);
+      expect(onValueChange).toHaveBeenLastCalledWith(['b']);
+    });
+
+    it('keeps the tags of a controlled value that the parent does not change', () => {
+      const onValueChange = vi.fn();
+      render(<TagInput aria-label="Skills" value={['a']} onValueChange={onValueChange} />);
+      type('b,');
+      expect(onValueChange).toHaveBeenCalledWith(['a', 'b']);
+      expect(tagTexts()).toEqual(['a']);
+    });
+
+    it('follows a controlled value and text', () => {
+      function Controlled() {
+        const [tags, setTags] = useState(['a']);
+        const [text, setText] = useState('');
+        return (
+          <TagInput
+            aria-label="Skills"
+            value={tags}
+            onValueChange={setTags}
+            inputValue={text}
+            onInputValueChange={setText}
+          />
+        );
+      }
+      render(<Controlled />);
+      type('b,c');
+      expect(tagTexts()).toEqual(['a', 'b']);
+      expect(input()).toHaveValue('c');
+    });
+
+    it('adds two tags of one paste in a controlled TagInput without losing the first', () => {
+      const onValueChange = vi.fn();
+      render(<TagInput aria-label="Skills" value={['a']} onValueChange={onValueChange} />);
+      paste('b,c');
+      expect(onValueChange).toHaveBeenCalledTimes(1);
+      expect(onValueChange).toHaveBeenCalledWith(['a', 'b', 'c']);
+    });
+  });
+
+  describe('forms', () => {
+    const form = () => document.querySelector('form')!;
+
+    it('submits one value per tag under one name', () => {
+      render(
+        <form>
+          <TagInput aria-label="Skills" name="skills" defaultValue={['React', 'Vue']} />
+        </form>,
+      );
+      expect(new FormData(form()).getAll('skills')).toEqual(['React', 'Vue']);
+      type('Svelte,');
+      expect(new FormData(form()).getAll('skills')).toEqual(['React', 'Vue', 'Svelte']);
+    });
+
+    it('submits nothing for the text input, and has no hidden input without a name', () => {
+      const { container } = render(
+        <form>
+          <TagInput aria-label="Skills" defaultValue={['a']} defaultInputValue="pending" />
+        </form>,
+      );
+      expect(Array.from(new FormData(form()).keys())).toEqual([]);
+      expect(container.querySelector('input[type="hidden"]')).toBeNull();
+    });
+
+    it('does not submit the hidden inputs of a disabled TagInput', () => {
+      render(
+        <form>
+          <TagInput aria-label="Skills" name="skills" defaultValue={['a']} disabled />
+        </form>,
+      );
+      expect(new FormData(form()).getAll('skills')).toEqual([]);
+    });
+
+    it('gives the hidden inputs the form attribute of the TagInput', () => {
+      render(
+        <>
+          <form id="f" />
+          <TagInput aria-label="Skills" name="skills" form="f" defaultValue={['a']} />
+        </>,
+      );
+      expect(new FormData(document.querySelector('form')!).getAll('skills')).toEqual(['a']);
+    });
+
+    it('requires the text input only while there is no tag', () => {
+      render(
+        <form>
+          <TagInput aria-label="Skills" name="skills" required />
+        </form>,
+      );
+      expect(input().required).toBe(true);
+      expect(form().checkValidity()).toBe(false);
+      type('a,');
+      expect(input().required).toBe(false);
+      expect(input()).toHaveAttribute('aria-required', 'true');
+      expect(form().checkValidity()).toBe(true);
+      removeButtons()[0]!.focus();
+      key('Delete', {}, removeButtons()[0]!);
+      expect(input().required).toBe(true);
+    });
+
+    it('resets an uncontrolled value and text to their defaults', async () => {
+      render(
+        <form>
+          <TagInput
+            aria-label="Skills"
+            name="skills"
+            defaultValue={['a']}
+            defaultInputValue="pending"
+          />
+        </form>,
+      );
+      type('b,');
+      type('typed');
+      form().reset();
+      await aTaskLater();
+      expect(tagTexts()).toEqual(['a']);
+      expect(input()).toHaveValue('pending');
+      expect(new FormData(form()).getAll('skills')).toEqual(['a']);
+    });
+
+    it('resets to no tags and no text without defaults', async () => {
+      render(
+        <form>
+          <TagInput aria-label="Skills" name="skills" />
+        </form>,
+      );
+      type('b,c');
+      form().reset();
+      await aTaskLater();
+      expect(tagTexts()).toEqual([]);
+      expect(input()).toHaveValue('');
+    });
+
+    it('keeps its tags when the reset is cancelled', async () => {
+      render(
+        <form onReset={(event) => event.preventDefault()}>
+          <TagInput aria-label="Skills" name="skills" defaultValue={['a']} />
+        </form>,
+      );
+      type('b,');
+      form().reset();
+      await aTaskLater();
+      expect(tagTexts()).toEqual(['a', 'b']);
+    });
+
+    it('keeps the tags and the text of a controlled TagInput on reset', async () => {
+      render(
+        <form>
+          <TagInput
+            aria-label="Skills"
+            name="skills"
+            value={['a', 'b']}
+            inputValue="kept"
+            defaultValue={['z']}
+          />
+        </form>,
+      );
+      form().reset();
+      await aTaskLater();
+      expect(tagTexts()).toEqual(['a', 'b']);
+      expect(input()).toHaveValue('kept');
+      expect(new FormData(form()).getAll('skills')).toEqual(['a', 'b']);
+    });
+  });
+
+  describe('development warnings', () => {
+    it('warns about a separator longer than one character other than "Enter", once', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(<TagInput aria-label="Skills" separators={['Enter', ', ', 'Tab']} />);
+      const messages = warn.mock.calls.map((call) => String(call[0]));
+      expect(messages.filter((m) => m.includes('separators'))).toHaveLength(1);
+      expect(messages.join()).toContain('", "');
+    });
+
+    it('does not warn about "Enter" or one-character separators', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(<TagInput aria-label="Skills" separators={['Enter', ',', ';']} />);
+      expect(warn).not.toHaveBeenCalled();
+    });
+
+    it('names TagInput value and TagInput inputValue when they switch to controlled', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const { rerender } = render(<TagInput aria-label="Skills" />);
+      rerender(<TagInput aria-label="Skills" value={['a']} inputValue="x" />);
+      const messages = warn.mock.calls.map((call) => String(call[0])).join('\n');
+      expect(messages).toContain('TagInput value is changing from uncontrolled to controlled');
+      expect(messages).toContain('TagInput inputValue is changing from uncontrolled to controlled');
+    });
+  });
+});
diff --git a/src/components/tag-input/split-tags.test.ts b/src/components/tag-input/split-tags.test.ts
new file mode 100644
index 0000000..077e444
--- /dev/null
+++ b/src/components/tag-input/split-tags.test.ts
@@ -0,0 +1,43 @@
+import { describe, expect, it } from 'vitest';
+import { splitTags } from './split-tags';
+
+describe('splitTags', () => {
+  it('splits on every one-character separator, trims and drops empties', () => {
+    expect(splitTags('a, b,,c ', ['Enter', ','])).toEqual(['a', 'b', 'c']);
+  });
+
+  it('line breaks split only when "Enter" is a separator', () => {
+    expect(splitTags('a\nb\r\nc\rd', ['Enter', ','])).toEqual(['a', 'b', 'c', 'd']);
+    expect(splitTags('a\nb\r\nc\rd', [','])).toEqual(['a\nb\r\nc\rd']);
+  });
+
+  it('splits on multiple separators', () => {
+    expect(splitTags('x y;z', [';', ' '])).toEqual(['x', 'y', 'z']);
+  });
+
+  it('regex-special characters split literally', () => {
+    expect(splitTags('a.b|c\\d', ['.', '|', '\\'])).toEqual(['a', 'b', 'c', 'd']);
+  });
+
+  it('ignores multi-character entries', () => {
+    expect(splitTags('xaby', ['ab'])).toEqual(['xaby']);
+  });
+
+  it('works with a non-BMP separator and a non-ASCII one', () => {
+    expect(splitTags('a😀b', ['😀'])).toEqual(['a', 'b']);
+    expect(splitTags('đỏ、xanh', ['、'])).toEqual(['đỏ', 'xanh']);
+  });
+
+  it('returns [] when there is nothing to add', () => {
+    expect(splitTags('', [','])).toEqual([]);
+    expect(splitTags(' , ,, ', [','])).toEqual([]);
+  });
+
+  it('keeps duplicates and order', () => {
+    expect(splitTags('b,a,b', [','])).toEqual(['b', 'a', 'b']);
+  });
+
+  it('keeps whitespace inside a tag and trims the ends, NBSP included', () => {
+    expect(splitTags('\u00A0New York\u00A0,LA', [','])).toEqual(['New York', 'LA']);
+  });
+});
diff --git a/src/index.test.ts b/src/index.test.ts
index 5932dab..f7c8802 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -84,6 +84,7 @@ describe('public API', () => {
       'TabsContent',
       'TabsList',
       'TabsTrigger',
+      'TagInput',
       'Textarea',
       'Toaster',
       'Tooltip',
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/tag-input src/index.test.ts
```

Expected: FAIL.
- `TagInput.test.tsx` fail cả file: `Failed to resolve import "./TagInput"`. `TagInput.test-d.ts` lỗi kiểu vì module chưa có.
- `split-tags.test.ts` fail cả file vì `./split-tags` chưa có. Ở bản nháp, `split-tags.ts` được viết cùng chín test của nó trước TagInput; lỗi duy nhất ghi được là module chưa có.
- `src/index.test.ts` fail vì danh sách export có `TagInput` mà `src/index.ts` chưa có.

Không test nào được thấy fail vì lý do riêng. Ở bản nháp, khi có code, bốn test fail vì chính test sai và được sửa trong test: một `rerender` giữ state uncontrolled, một sự kiện `change` với giá trị mà DOM đã có, một lần chờ `onInputValueChange('')` khi chữ đã là `''`, và `toBeRequired` đọc cả `aria-required`.

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
index cf899d1..0a21b63 100644
--- a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
+++ b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
@@ -323,7 +323,7 @@ Mọi số liệu ở §4.3 lấy từ CSS `mk-` của đúng phương án đã
 - **Focus ô gõ:** viền nhấn và ring trên khung, như `Input`.
 - **Disabled:** cả khung `opacity: .5`, `cursor: not-allowed`.
 - **Lỗi:** viền danger như `Input`.
-- **`size`** (ngoài mockup, mockup chỉ vẽ `md`): chip và ô gõ giữ nguyên ở mọi cỡ; chiều cao tối thiểu theo `--flg-control-h-*`; `sm` dùng padding dọc 3px để khung vẫn cao 28px (Claude chốt).
+- **`size`** (ngoài mockup, mockup chỉ vẽ `md`): chip và ô gõ giữ nguyên ở mọi cỡ; chiều cao tối thiểu theo `--flg-control-h-*`; `sm` dùng padding dọc 2px để khung vẫn cao 28px: ô gõ cao 22px cộng viền 2px đã là 24px, nên 3px sẽ ra 30px (Claude chốt; phát hiện khi lập Plan B: bản đầu ghi 3px).
 
 **Calendar (K1, chủ dự án chọn 2026-11-02):**
 
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 4521c96..9d079c4 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -56,6 +56,11 @@ const SHIPPED_CLASSES = [
   'flg-combobox-match',
   'flg-combobox-status',
   'flg-combobox-check',
+  'flg-tag-input',
+  'flg-tag-input-box',
+  'flg-tag-input-list',
+  'flg-tag-input-item',
+  'flg-tag',
   'flg-tabs',
   'flg-tabs-list',
   'flg-tabs-trigger',
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index dc853a2..954daa6 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -22,6 +22,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/context-menu/ContextMenu.tsx',
   'src/components/select/Select.tsx',
   'src/components/combobox/Combobox.tsx',
+  'src/components/tag-input/TagInput.tsx',
   'src/components/tabs/Tabs.tsx',
   'src/components/segmented-control/SegmentedControl.tsx',
   'src/components/segmented-control/SegmentedControlItem.tsx',
diff --git a/src/components/tag-input/TagInput.mdx b/src/components/tag-input/TagInput.mdx
new file mode 100644
index 0000000..2ba77f7
--- /dev/null
+++ b/src/components/tag-input/TagInput.mdx
@@ -0,0 +1,150 @@
+import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './TagInput.stories';
+
+<Meta of={Stories} />
+
+# TagInput
+
+```tsx
+import { Field, TagInput } from 'fl-glass-ui';
+
+<Field label="Skills" description="Press Enter or comma after each.">
+  <TagInput name="skills" placeholder="Add a skill…" defaultValue={['React', 'TypeScript']} />
+</Field>;
+```
+
+<Canvas of={Stories.Look} />
+<Controls />
+
+A TagInput is a text input whose tags sit in the same frame as chips, each with a button that
+removes it. The user types a tag and ends it with a separator; the frame grows as tags are added.
+Reach for a Combobox when the value is one item chosen from a list.
+
+## Adding tags
+
+A tag is the trimmed text before a separator. Blank text is never a tag.
+
+- **A separator typed** ends the text before it as a tag, and what follows stays in the input. The
+  default `separators` are `["Enter", ","]`: a comma, or the Enter key. Every other entry is one
+  character, such as `";"` or `" "`.
+- **Enter** with text in the input adds it, and does not submit the form. With the input empty
+  Enter is left alone, so the form submits as in any input. When `"Enter"` is not a separator,
+  Enter is always left alone.
+- **Paste** is split at the separators, and at line breaks when `"Enter"` is a separator: pasting
+  `React, Vue` makes two tags. The pasted text joins the text around the caret before it is
+  split. Text with nothing to split at is pasted into the input as it is.
+- **Leaving** the TagInput with text typed makes that text a tag, so the text is not lost to a
+  click on a submit button. Moving focus to one of the TagInput's own remove buttons is not
+  leaving. Leaving the window is not either.
+
+Every non-empty text becomes a tag, duplicates included.
+
+<Canvas of={Stories.Typing} />
+
+Text is never taken while it is being composed with an input method (Vietnamese Telex and VNI,
+Japanese, Chinese): keys and input events during a composition belong to the input method. What
+was typed is split at the next input event, or when the user leaves.
+
+## Removing tags
+
+Each chip has a remove button named by `labels.remove` ("Remove React"). The buttons are out of the
+tab order, so Tab goes from the page to the input and on to the next control.
+
+| Key                     | In the input                             | On a remove button                         |
+| ----------------------- | ---------------------------------------- | ------------------------------------------ |
+| Backspace               | With the input empty: the last button    | Removes the tag                            |
+| Delete                  |                                          | Removes the tag                            |
+| ←                       | With the caret at the start: last button | The button before                          |
+| →                       |                                          | The button after; from the last, the input |
+| Home / End              |                                          | The first / the last button                |
+| Esc                     |                                          | Back to the input                          |
+| Enter / Space           |                                          | Click: removes the tag                     |
+| A character (not Space) |                                          | Back to the input, and into it             |
+
+After a key removes a tag the focus goes to the button that took its place, to the one before when
+the last tag was removed, and to the input when none is left. A press on a button removes the tag
+and puts the focus in the input. Keys with Alt, Ctrl or Meta are left to the browser, and a held
+Backspace does not run on from the input into the tags.
+
+<Canvas of={Stories.Keyboard} />
+
+## Controlled use
+
+`value` is the list of tags and `onValueChange` is called with the whole list when the user adds or
+removes tags; it is not called when the parent changes `value`. `inputValue` and
+`onInputValueChange` do the same for the text that is typed and not yet a tag. Pass both to keep
+the text in your own state.
+
+```tsx
+const [tags, setTags] = useState(['React']);
+
+<TagInput aria-label="Skills" value={tags} onValueChange={setTags} />;
+```
+
+## In a form
+
+A TagInput takes part in forms like a native control, with `name` on the hidden inputs and not on
+the text input:
+
+- **FormData:** one `<input type="hidden" name>` per tag, so `formData.getAll(name)` is the list.
+  The text that is typed and not yet a tag is not submitted: it becomes a tag when focus leaves,
+  which a click on the submit button does before the form is submitted.
+- **`required`:** the text input is required while there is no tag, so an empty TagInput stops the
+  submit and the browser's message points at it. With a tag in, the input no longer asks for text.
+  `aria-required` stays.
+- **Reset:** a form reset puts an uncontrolled TagInput back to `defaultValue` and
+  `defaultInputValue`, unless an `onReset` handler cancels the reset with `preventDefault()`. A
+  controlled one keeps its tags and its text.
+- **Disabled:** the hidden inputs of a disabled TagInput are not submitted.
+
+<Canvas of={Stories.InAForm} />
+
+Inside a `Field`, the label names the text input, and the description and error are announced with
+it. The Field's `required`, `disabled` and error apply to it.
+
+## Sizes and states
+
+`size` is `"sm"`, `"md"` (default) or `"lg"`. The frame is as tall as an Input of that size while the
+tags fit one row and grows by a row each time they wrap; the chips and the text input are the same
+at every size. A TagInput is as wide as its container.
+
+`readOnly` keeps the tags and the input readable and focusable, but nothing is added or removed:
+the remove buttons are disabled. `disabled` dims the frame and takes it out of the form. `invalid`
+gives the frame the danger border, which stays while it has focus; inside a Field with an error it
+is already invalid.
+
+## Announcements
+
+The TagInput has its own live region (a visually hidden `aria-live="polite"` element in its root,
+there from the first render, also in the server HTML), so it is read inside a modal Dialog too. It
+says `labels.added(tag)` when tags are added (all of a paste, in one sentence) and
+`labels.removed(tag)` when one is removed. Changes the parent makes to `value` are not announced.
+
+The words are in `labels`, a function of the tag where it needs one:
+
+```tsx
+<TagInput
+  labels={{
+    remove: (tag) => `Xoá ${tag}`,
+    added: (tag) => `Đã thêm ${tag}`,
+    removed: (tag) => `Đã xoá ${tag}`,
+  }}
+/>
+```
+
+## Accessibility
+
+- The text input is a native `<input>` named by the Field's label or by `aria-label`. The ref and
+  every prop except `className`, `style` and `name` go to it; `className` and `style` go on the
+  element around the frame.
+- The tags are a list of items, and each remove button has its own name. The list takes no box of
+  its own (`display: contents`), so that chips and input share a row; the list semantics are meant
+  to survive that, and are checked with VoiceOver and NVDA.
+- With forced colors, a chip has a 1px edge and its × takes the button color.
+
+## Do and don't
+
+- Do use it for free-form lists the user builds: skills, recipients, labels.
+- Do tell the user which separators work, in the description.
+- Don't use it to choose among known options; use a Combobox or a Select.
+- Don't rely on the text that is typed and not yet a tag: it is not in the form data.
diff --git a/src/components/tag-input/TagInput.tsx b/src/components/tag-input/TagInput.tsx
new file mode 100644
index 0000000..b04a7a9
--- /dev/null
+++ b/src/components/tag-input/TagInput.tsx
@@ -0,0 +1,391 @@
+'use client';
+
+import { clsx } from 'clsx';
+import { forwardRef, useMemo, useRef } from 'react';
+import type {
+  ChangeEvent,
+  ClipboardEvent,
+  FocusEvent,
+  InputHTMLAttributes,
+  KeyboardEvent,
+  MouseEvent,
+} from 'react';
+import { composeEventHandlers } from '../../internal/compose-event-handlers';
+import { dataAttr } from '../../internal/data-attr';
+import { markAsFieldControl, useFieldProps } from '../../internal/field-context';
+import { CloseIcon } from '../../internal/icons';
+import { mergeRefs } from '../../internal/merge-refs';
+import { hasModifier } from '../../internal/roving';
+import { useAnnounce } from '../../internal/use-announce';
+import { useControllableState } from '../../internal/use-controllable-state';
+import { useFormReset } from '../../internal/use-form-reset';
+import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
+import { useWriteOnCommit } from '../../internal/use-write-on-commit';
+import { devWarn } from '../../internal/warn';
+import { Badge } from '../badge/Badge';
+import { splitTags } from './split-tags';
+
+export interface TagInputProps extends Omit<
+  InputHTMLAttributes<HTMLInputElement>,
+  'value' | 'defaultValue' | 'size'
+> {
+  /** The tags. Pass it with `onValueChange` to control them. */
+  value?: string[];
+  /** The tags at first, when uncontrolled. */
+  defaultValue?: string[];
+  /** Called with all the tags whenever one is added or removed by the user. */
+  onValueChange?: (value: string[]) => void;
+  /** The text typed and not yet a tag. Pass it with `onInputValueChange` to control it. */
+  inputValue?: string;
+  /** The text at first, when uncontrolled. */
+  defaultInputValue?: string;
+  /** Called with the text whenever it changes: typed by the user, or changed by the TagInput. */
+  onInputValueChange?: (text: string) => void;
+  /**
+   * What ends a tag: one-character strings, and `"Enter"` for the Enter key (and, in pasted text, for
+   * line breaks). Default `["Enter", ","]`.
+   */
+  separators?: string[];
+  size?: 'sm' | 'md' | 'lg';
+  /** Marks the value as wrong. Inside a Field with an error this is already true. */
+  invalid?: boolean;
+  /**
+   * The words the TagInput announces and labels its buttons with. Default `{ remove: (tag) =>
+   * "Remove <tag>", added: (tag) => "<tag> added", removed: (tag) => "<tag> removed" }`.
+   */
+  labels?: {
+    remove?: (tag: string) => string;
+    added?: (tag: string) => string;
+    removed?: (tag: string) => string;
+  };
+}
+
+const NO_TAGS: string[] = [];
+const DEFAULT_SEPARATORS = ['Enter', ','];
+
+/** Keys the input method owns while text is being composed (keyCode 229 is how Safari says so). */
+const composing = (event: KeyboardEvent) => event.nativeEvent.isComposing || event.keyCode === 229;
+
+/**
+ * A text input whose tags sit in the same frame as chips with a remove button. A separator, Enter, a
+ * paste, or leaving with text typed makes a tag; the tags go into forms as one hidden input each.
+ * `ref` is the text input; `className` and `style` go on the element around the frame.
+ */
+export const TagInput = markAsFieldControl(
+  forwardRef<HTMLInputElement, TagInputProps>(function TagInput(props, ref) {
+    const {
+      value,
+      defaultValue,
+      onValueChange,
+      inputValue,
+      defaultInputValue,
+      onInputValueChange,
+      separators = DEFAULT_SEPARATORS,
+      size = 'md',
+      invalid: invalidProp,
+      labels,
+      name,
+      form,
+      className,
+      style,
+      onChange,
+      onKeyDown,
+      onPaste,
+      onCompositionStart,
+      onCompositionEnd,
+      ...rest
+    } = props;
+    const { invalid, required, disabled, ...inputProps } = useFieldProps({
+      ...rest,
+      invalid: invalidProp,
+    });
+    const readOnly = props.readOnly === true;
+    const removeLabel = labels?.remove ?? ((tag: string) => `Remove ${tag}`);
+    const addedLabel = labels?.added ?? ((tag: string) => `${tag} added`);
+    const removedLabel = labels?.removed ?? ((tag: string) => `${tag} removed`);
+    const { announce, region } = useAnnounce();
+
+    const longOnes = separators.filter((one) => one !== 'Enter' && [...one].length !== 1);
+    if (longOnes.length > 0) {
+      devWarn(
+        `<TagInput> separators has entries that are longer than one character and not "Enter": ` +
+          `${longOnes.map((one) => JSON.stringify(one)).join(', ')}. They never match a typed key.`,
+      );
+    }
+    const hasEnter = separators.includes('Enter');
+    const characters = useMemo(
+      () => new Set(separators.filter((one) => [...one].length === 1)),
+      [separators],
+    );
+
+    const [tags, setTags, resetTags] = useControllableState<string[]>({
+      value,
+      defaultValue: defaultValue ?? NO_TAGS,
+      onChange: onValueChange,
+      name: 'TagInput value',
+    });
+    const [text, setText, resetText] = useControllableState<string>({
+      value: inputValue,
+      defaultValue: defaultInputValue ?? '',
+      onChange: onInputValueChange,
+      name: 'TagInput inputValue',
+    });
+
+    // The tags a handler adds to: those of the last commit, or what an earlier call in the same
+    // event made them (a paste, a key that sends a text on, two blurs in a row). A controlled value
+    // is the parent's to change, so only the commit writes it then.
+    const latestTags = useRef(tags);
+    useWriteOnCommit(() => {
+      latestTags.current = tags;
+    });
+    const controlled = value !== undefined;
+    const changeTags = (next: string[]) => {
+      if (!controlled) latestTags.current = next;
+      setTags(next);
+    };
+    const add = (parts: string[]) => {
+      if (parts.length === 0) return;
+      changeTags([...latestTags.current, ...parts]);
+      announce(parts.map(addedLabel).join('. '));
+    };
+
+    const rootRef = useRef<HTMLDivElement>(null);
+    const listRef = useRef<HTMLUListElement>(null);
+    const inputRef = useRef<HTMLInputElement | null>(null);
+    const mergedRef = useMemo(() => mergeRefs(ref, inputRef), [ref]);
+    const buttons = () =>
+      Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
+
+    // A removal moves focus once the tags are rendered: the button that takes the removed one's
+    // place, which is only known then. `from` tells this commit from one that left the tags as they
+    // were (a controlled parent that said no).
+    const focusAfter = useRef<{ from: string[]; index: number } | null>(null);
+    useIsoLayoutEffect(() => {
+      const pending = focusAfter.current;
+      if (!pending || pending.from === tags) return;
+      focusAfter.current = null;
+      const target = buttons()[Math.min(pending.index, tags.length - 1)];
+      (target ?? inputRef.current)?.focus();
+    });
+    const removeAt = (index: number, focus: 'keyboard' | 'pointer') => {
+      const removed = latestTags.current[index];
+      if (removed === undefined) return;
+      // A press on the button is a pointer's business: the focus goes to the input, where the next
+      // tag is typed. Keys follow the rule of the keyboard: the button that took its place.
+      if (focus === 'keyboard') focusAfter.current = { from: tags, index };
+      else inputRef.current?.focus();
+      changeTags(latestTags.current.filter((_, at) => at !== index));
+      announce(removedLabel(removed));
+    };
+
+    // --- Text. A separator typed ends the text before it as a tag; the rest stays typed. Text that
+    // is being composed is left alone: it is not the user's yet. The same goes for the text of a
+    // composition that ends: the input event that follows it, or a leave, takes it.
+    const isComposing = useRef(false);
+    const setTyped = (next: string, composingNow = isComposing.current) => {
+      if (composingNow || readOnly) {
+        setText(next);
+        return;
+      }
+      const chars = [...next];
+      const cut = chars.findLastIndex((char) => characters.has(char));
+      if (cut === -1) {
+        setText(next);
+        return;
+      }
+      add(splitTags(chars.slice(0, cut + 1).join(''), separators));
+      setText(chars.slice(cut + 1).join(''));
+    };
+    /** Makes what is typed tags, all of it: the separators it still holds split it. */
+    const flush = () => {
+      if (readOnly || text.trim() === '') return;
+      add(splitTags(text, separators));
+      setText('');
+    };
+    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
+      setTyped(
+        event.target.value,
+        isComposing.current || (event.nativeEvent as InputEvent).isComposing === true,
+      );
+    };
+    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
+      if (readOnly) return;
+      const input = event.currentTarget;
+      const pasted = event.clipboardData?.getData('text') ?? '';
+      // Text with nothing to split at is text: it goes into the input as it does anywhere.
+      if (![...pasted].some((char) => characters.has(char) || (hasEnter && /[\r\n]/.test(char)))) {
+        return;
+      }
+      event.preventDefault();
+      const before = input.value.slice(0, input.selectionStart ?? input.value.length);
+      const after = input.value.slice(input.selectionEnd ?? input.value.length);
+      add(splitTags(before + pasted + after, separators));
+      setText('');
+    };
+
+    // --- Keyboard in the input.
+    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
+      if (composing(event) || hasModifier(event)) return;
+      const input = event.currentTarget;
+      if (event.key === 'Enter') {
+        // Enter on empty text is left alone: the form submits, with the tags it has.
+        if (!hasEnter || readOnly || text.trim() === '') return;
+        event.preventDefault();
+        flush();
+      } else if (
+        (event.key === 'Backspace' && text === '') ||
+        (event.key === 'ArrowLeft' &&
+          !event.shiftKey &&
+          input.selectionStart === 0 &&
+          input.selectionEnd === 0)
+      ) {
+        // A held Backspace would run on into the tags, and past them.
+        const last = buttons().at(-1);
+        if (event.repeat || !last || last.disabled) return;
+        event.preventDefault();
+        last.focus();
+      }
+    };
+
+    // --- Keyboard on a remove button. Its Enter and Space are the click of the button.
+    const handleButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
+      if (composing(event) || hasModifier(event)) return;
+      const all = buttons();
+      const { key } = event;
+      if (key === 'Backspace' || key === 'Delete') {
+        event.preventDefault();
+        if (!event.repeat) removeAt(index, 'keyboard');
+      } else if (key === 'ArrowLeft') {
+        event.preventDefault();
+        all[Math.max(index - 1, 0)]?.focus();
+      } else if (key === 'ArrowRight') {
+        event.preventDefault();
+        (all[index + 1] ?? inputRef.current)?.focus();
+      } else if (key === 'Home' || key === 'End') {
+        event.preventDefault();
+        all[key === 'Home' ? 0 : all.length - 1]?.focus();
+      } else if (key === 'Escape') {
+        // The Esc is the TagInput's: a Dialog around it stays open.
+        event.preventDefault();
+        event.stopPropagation();
+        inputRef.current?.focus();
+      } else if ([...key].length === 1 && key !== ' ') {
+        // A printable key is typing: back to the input, and into it.
+        event.preventDefault();
+        inputRef.current?.focus();
+        setTyped(text + key);
+      }
+    };
+
+    // --- Leaving. Focus moving to the TagInput's own buttons is not leaving; focus moving out of the
+    // window is not either, the user comes back to the text.
+    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
+      const to = event.relatedTarget as Node | null;
+      if (to && rootRef.current?.contains(to)) return;
+      if (!to && !document.hasFocus()) return;
+      flush();
+    };
+    // A press on the frame, but not on a chip or a button, focuses the input, as on Input's frame.
+    const handleFrameMouseDown = (event: MouseEvent<HTMLDivElement>) => {
+      const target = event.target as Element;
+      if (event.button !== 0 || disabled || target === inputRef.current) return;
+      if (target.closest('.flg-tag')) return;
+      event.preventDefault();
+      inputRef.current?.focus();
+    };
+
+    // The browser resets the text input by itself; the tags and the text are React's to put back.
+    useFormReset(inputRef, () => {
+      resetTags(defaultValue ?? NO_TAGS);
+      resetText(defaultInputValue ?? '');
+    });
+
+    const seen = new Map<string, number>();
+    const items = tags.map((tag, index) => {
+      const times = seen.get(tag) ?? 0;
+      seen.set(tag, times + 1);
+      return (
+        <li key={`${times}:${tag}`} className="flg-tag-input-item">
+          <Badge variant="neutral" className="flg-tag">
+            {tag}
+            <button
+              type="button"
+              tabIndex={-1}
+              aria-label={removeLabel(tag)}
+              disabled={disabled || readOnly}
+              onKeyDown={(event) => handleButtonKeyDown(event, index)}
+              // A click with a detail came from a pointer; Enter and Space click with none.
+              onClick={(event) => removeAt(index, event.detail === 0 ? 'keyboard' : 'pointer')}
+            >
+              <CloseIcon width={10} height={10} aria-hidden="true" />
+            </button>
+          </Badge>
+        </li>
+      );
+    });
+
+    return (
+      // The root only watches where focus goes.
+      <div
+        ref={rootRef}
+        className={clsx('flg-tag-input', className)}
+        style={style}
+        data-size={size}
+        data-invalid={dataAttr(invalid)}
+        data-disabled={dataAttr(disabled)}
+        data-readonly={dataAttr(readOnly)}
+        onBlur={handleBlur}
+      >
+        {/* The frame only forwards presses to the input; keyboard users reach it directly. */}
+        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
+        <div
+          className="flg-input flg-tag-input-box"
+          data-size={size}
+          data-invalid={dataAttr(invalid)}
+          data-disabled={dataAttr(disabled)}
+          onMouseDown={handleFrameMouseDown}
+        >
+          {tags.length > 0 ? (
+            <ul ref={listRef} className="flg-tag-input-list">
+              {items}
+            </ul>
+          ) : null}
+          <input
+            {...inputProps}
+            ref={mergedRef}
+            type="text"
+            form={form}
+            value={text}
+            disabled={disabled}
+            // Only the text input is validated (a hidden input is not), and only while there is no
+            // tag to show for it; the attribute says it to assistive technology all the time.
+            required={required && tags.length === 0}
+            aria-required={required || undefined}
+            onChange={composeEventHandlers(onChange, handleChange)}
+            onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
+            onPaste={composeEventHandlers(onPaste, handlePaste)}
+            onCompositionStart={composeEventHandlers(onCompositionStart, () => {
+              isComposing.current = true;
+            })}
+            onCompositionEnd={composeEventHandlers(onCompositionEnd, () => {
+              isComposing.current = false;
+            })}
+          />
+        </div>
+        {name
+          ? tags.map((tag, index) => (
+              <input
+                key={index}
+                type="hidden"
+                name={name}
+                value={tag}
+                form={form}
+                disabled={disabled}
+              />
+            ))
+          : null}
+        {region}
+      </div>
+    );
+  }),
+);
diff --git a/src/components/tag-input/index.ts b/src/components/tag-input/index.ts
new file mode 100644
index 0000000..fdc811a
--- /dev/null
+++ b/src/components/tag-input/index.ts
@@ -0,0 +1,2 @@
+export { TagInput } from './TagInput';
+export type { TagInputProps } from './TagInput';
diff --git a/src/components/tag-input/split-tags.ts b/src/components/tag-input/split-tags.ts
new file mode 100644
index 0000000..28c9fef
--- /dev/null
+++ b/src/components/tag-input/split-tags.ts
@@ -0,0 +1,32 @@
+/**
+ * Splits pasted text into tags: at every one-character entry of `separators`, and at line breaks
+ * when `separators` has "Enter". Each part is trimmed; empty parts are dropped; order and
+ * duplicates are kept (the TagInput decides about duplicates).
+ */
+export function splitTags(text: string, separators: readonly string[]): string[] {
+  const sepSet = new Set<string>();
+  let hasEnter = false;
+  for (const s of separators) {
+    if (s === 'Enter') hasEnter = true;
+    else if ([...s].length === 1) sepSet.add(s);
+  }
+
+  const parts: string[] = [];
+  let current = '';
+  for (const ch of [...text]) {
+    if (hasEnter && (ch === '\n' || ch === '\r')) {
+      parts.push(current);
+      current = '';
+      continue;
+    }
+    if (sepSet.has(ch)) {
+      parts.push(current);
+      current = '';
+      continue;
+    }
+    current += ch;
+  }
+  parts.push(current);
+
+  return parts.map((part) => part.trim()).filter((part) => part !== '');
+}
diff --git a/src/index.ts b/src/index.ts
index 90795bf..548d2cf 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -138,6 +138,8 @@ export type {
   ComboboxProps,
   ComboboxSeparatorProps,
 } from './components/combobox';
+export { TagInput } from './components/tag-input';
+export type { TagInputProps } from './components/tag-input';
 export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/tabs';
 export { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from './components/breadcrumb';
 export { Pagination } from './components/pagination';
diff --git a/src/styles/components/tag-input.css b/src/styles/components/tag-input.css
new file mode 100644
index 0000000..f418737
--- /dev/null
+++ b/src/styles/components/tag-input.css
@@ -0,0 +1,76 @@
+/* TagInput (spec phase 3 §4.3, mockup Ta1): the frame of Input that grows with its content, with
+   neutral chips like those of a multiple Select and the text input after them, in one wrapping row. */
+@layer flg.components {
+  /* As wide as its container, like an Input in a Field. */
+  .flg-tag-input {
+    display: block;
+    width: 100%;
+    min-width: 0;
+  }
+  /* Input's frame, but as tall as its rows and no less than a control: the chips and the text input
+     share the row and wrap, the row group centred in the frame. */
+  .flg-tag-input-box {
+    flex-wrap: wrap;
+    align-content: center;
+    gap: 4px;
+    height: auto;
+    min-height: var(--flg-input-h);
+    padding: 4px 8px;
+  }
+  /* A small frame is 28px: 22px for the input and 2px of border leave 2px of padding on each side. */
+  .flg-tag-input-box[data-size='sm'] {
+    padding-block: 2px;
+  }
+  /* The list and its items give the chips list semantics and take no box of their own, so that the
+     chips and the text input are siblings in the frame's row (spec §10 has the fallback). */
+  .flg-tag-input-list,
+  .flg-tag-input-item {
+    display: contents;
+  }
+  .flg-tag-input-list {
+    margin: 0;
+    padding: 0;
+    list-style: none;
+  }
+  /* The same chip at every size. A tag longer than the row wraps instead of pushing the frame wide. */
+  .flg-tag-input .flg-tag {
+    max-width: 100%;
+    padding: 3px 4px 3px 8px;
+    white-space: normal;
+    overflow-wrap: anywhere;
+  }
+  .flg-tag > button {
+    display: inline-flex;
+    flex: none;
+    align-items: center;
+    justify-content: center;
+    width: 14px;
+    height: 14px;
+    margin: 0;
+    padding: 0;
+    border: 0;
+    border-radius: var(--flg-radius-full);
+    background: transparent;
+    color: inherit;
+    opacity: 0.75;
+    cursor: pointer;
+  }
+  .flg-tag > button:focus-visible {
+    opacity: 1;
+    outline: 2px solid var(--flg-focus-outline-color);
+    outline-offset: 1px;
+    box-shadow: var(--flg-focus-ring);
+  }
+  .flg-tag > button:disabled {
+    cursor: default;
+  }
+  .flg-tag-input[data-disabled] .flg-tag > button {
+    cursor: not-allowed;
+  }
+  /* The text input takes what is left of the row, and wraps to the next when it would be narrower
+     than 70px. Input's own rule makes it as tall as the frame, which here is not its row. */
+  .flg-tag-input .flg-tag-input-box > input {
+    min-width: 70px;
+    height: 22px;
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index c11f9bc..7c77007 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -23,6 +23,7 @@
 @import './components/menu.css';
 @import './components/select.css';
 @import './components/combobox.css';
+@import './components/tag-input.css';
 @import './components/tabs.css';
 @import './components/segmented-control.css';
 @import './components/number-input.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index f6e4f7e..f6c41ff 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -255,6 +255,16 @@
     .flg-number-input > button:disabled {
       color: GrayText;
     }
+    /* A TagInput's chip has the edge of every Badge and loses its fill; its × is a button's icon. */
+    .flg-tag {
+      border: 1px solid CanvasText;
+    }
+    .flg-tag > button {
+      color: ButtonText;
+    }
+    .flg-tag > button:disabled {
+      color: GrayText;
+    }
     /* A Slider: the track has a line, the fill is the selection colour, the thumb is a ring in the
        text colour on the canvas, and the dots are text-coloured. The bubble is a Surface, which
        already has its line above. Opting out of colour adjustment keeps the system colours named
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 --project scripts src/components/tag-input src/index.test.ts scripts
pnpm vitest run --project storybook-light --project storybook-dark src/components/tag-input
pnpm build && pnpm check:package
```

Expected: 195 test PASS (`TagInput.test.tsx` 65 test mỗi project, 9 của `split-tags.test.ts`, các test kiểu, `src/index.test.ts` và `scripts`). Story `tag-input` 48 test PASS (8 story × 3 engine × 2 theme). `check:package`: `check:dist-css`, `check:use-client` (109 module, 29 client), `check:rsc`, `check:publint`, `check:types` PASS; **`size` fail**: JS 36.45 kB trên 35.86 kB (vượt 593 B), CSS trong ngưỡng. Chưa ghi ngưỡng; Task 7 làm. CSS chỉ thêm `tag-input.css`, một dòng import và một khối `.flg-tag` trong `preferences.css` (class mới), nên ảnh chuẩn cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md \
  scripts/check-dist-css.ts \
  scripts/check-use-client.ts \
  src/components/tag-input/TagInput.mdx \
  src/components/tag-input/TagInput.stories.tsx \
  src/components/tag-input/TagInput.test-d.ts \
  src/components/tag-input/TagInput.test.tsx \
  src/components/tag-input/TagInput.tsx \
  src/components/tag-input/index.ts \
  src/components/tag-input/split-tags.test.ts \
  src/components/tag-input/split-tags.ts \
  src/index.test.ts \
  src/index.ts \
  src/styles/components/tag-input.css \
  src/styles/index.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(tag-input): tags, keyboard, paste and form (Ta1)" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 6: TagInput từ chối thẻ trùng, thẻ quá số và thẻ không hợp lệ

Spec §3.1 (`setCustomValidity`; reset xoá lời báo của control), §3.2 (**Lỗi do control tự báo**), §5 (cảnh báo dev về `value` có thẻ trùng), §6.3 **`TagInput`**: **Thẻ bị từ chối**, mặc định của `labels`, các prop `validate`, `maxTags`, `allowDuplicates`.
- **Thứ tự xét**: trùng (khi `allowDuplicates` tắt; so đúng từng ký tự sau khi bỏ khoảng trắng, nên khác hoa thường là thẻ khác), vượt `maxTags`, rồi `validate`. `validate` trả `false` thì lời báo là `labels.invalid`; trả chuỗi không rỗng thì lời báo là chuỗi đó; giá trị khác thì thẻ được nhận (phát hiện 12).
- **`add(parts)`** xét từng phần với các thẻ đứng trước nó, kể cả phần vừa được nhận. Nó thêm các phần được nhận, đặt lời báo của phần bị từ chối đầu tiên, đọc "X added. <lời báo>" trong một câu, và trả các phần bị từ chối.
- Gõ ký tự ngăn, Enter, rời ô và dán đều đưa các phần bị từ chối về ô gõ, nối bằng ký tự ngăn một ký tự đầu tiên không phải `"Enter"`, nếu không có thì bằng dấu cách.
- **Khi bị từ chối**: TagInput `invalid`, ô gõ có `aria-invalid` và `setCustomValidity(lời báo)` (đặt trong một layout effect). Lời báo đến Field qua `useControlError` (Task 2); ngoài Field nó là `<p class="flg-field-error">` sau các input ẩn, trước vùng live, trong phần tử gốc, và id của nó đứng sau id của người dùng trong `aria-describedby`. Vùng live đọc lời báo.
- Lời báo mất khi chữ đổi, khi xoá một thẻ, khi form reset; mỗi lần `add` đặt lại hoặc xoá nó.
- `allowDuplicates` mặc định là `false`, nên test có sẵn `keeps duplicates in this task: …` đổi tên thành `keeps duplicates with allowDuplicates: …` và truyền `allowDuplicates`.
- CSS: `.flg-tag-input > .flg-field-error { margin-top: 5px }`, bằng khoảng cách của Field; không có class mới.
- Docs: `TagInput.mdx` có mục "Validation and limits"; `Field.mdx` có đoạn "Errors the control reports".
- Story `Look` thêm trường "Skills, rejected" (một thẻ trùng được gõ, Enter, rời ô). Story `Rejection` (`no-visual`, input thật): thẻ trùng chặn submit, sửa chữ thì lời báo mất và submit qua; thông báo của `maxTags`, xoá thẻ thì có chỗ.
- Spec §6.3 được sửa hai dòng (phát hiện 3).

**Files:**
- Modify: `src/components/tag-input/TagInput.tsx`, `TagInput.test.tsx`, `TagInput.test-d.ts`, `TagInput.stories.tsx`, `TagInput.mdx`, `src/components/field/Field.mdx`, `src/styles/components/tag-input.css`, `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md`

**Interfaces:**
- Produces thêm cho `TagInputProps`:
  - `validate?: (tag: string, tags: string[]) => boolean | string`: nhận thẻ đã bỏ khoảng trắng và các thẻ tới lúc đó.
  - `maxTags?: number`, `allowDuplicates?: boolean` (mặc định `false`).
  - `labels.invalid?: string` (mặc định `"Invalid tag"`), `labels.duplicate?: string` (`"Already added"`), `labels.tooMany?: (max: number) => string` (`Up to <max> tags`).
- Produces: cảnh báo dev khi `value` có thẻ trùng mà `allowDuplicates` tắt (một câu liệt kê các thẻ trùng).
- Consumes: `useControlError` (Task 2), `splitTags` (Task 5), `useAnnounce` (Task 4).

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/tag-input/TagInput.stories.tsx b/src/components/tag-input/TagInput.stories.tsx
index ac57477..84687d3 100644
--- a/src/components/tag-input/TagInput.stories.tsx
+++ b/src/components/tag-input/TagInput.stories.tsx
@@ -83,9 +83,25 @@ export const Look: Story = {
       >
         <TagInput name="skills" placeholder="Add a skill…" />
       </Field>
+      <Field label="Skills, rejected" description="Press Enter or comma after each.">
+        <TagInput defaultValue={skills.slice(0, 2)} defaultInputValue="React" />
+      </Field>
     </div>
   ),
   play: async ({ canvas }) => {
+    // A tag that is already there is turned down: its text stays, and the Field shows why. Enter
+    // asks for it, and leaving puts the focus ring away from the picture.
+    const rejected = canvas.getByRole('textbox', { name: 'Skills, rejected' });
+    rejected.focus();
+    await userEvent.keyboard('{Enter}');
+    rejected.blur();
+    await waitFor(() => expect(canvas.getByText('Already added')).toHaveClass('flg-field-error'));
+    await expect(rejected).toHaveAttribute('aria-invalid', 'true');
+    await expect(rejected).toHaveValue('React');
+    await expect(rejected).toHaveAccessibleDescription(
+      'Press Enter or comma after each. Already added',
+    );
+
     // The frame is the height of an Input of its size while it holds one row.
     const heights = ['Skills, small and empty', 'Skills, empty', 'Skills, large'].map((name) =>
       Math.round(frameOf(canvas.getByRole('textbox', { name })).getBoundingClientRect().height),
@@ -433,3 +449,59 @@ export const ReadOnly: Story = {
     await expect(removeButtons(canvasElement)[0]).toBeDisabled();
   },
 };
+
+const rejectionSent: string[][] = [];
+
+/** A tag that is turned down blocks the submit; fixing the text lets it through. */
+export const Rejection: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <form
+      aria-label="Profile"
+      style={wide}
+      onSubmit={(event) => {
+        event.preventDefault();
+        rejectionSent.push(new FormData(event.currentTarget).getAll('skills') as string[]);
+      }}
+    >
+      <Field label="Skills">
+        <TagInput name="skills" defaultValue={['React']} maxTags={3} />
+      </Field>
+      <button type="submit">Save</button>
+    </form>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    rejectionSent.length = 0;
+    const user = (await realUserEvent()) ?? userEvent;
+    const input = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Skills' });
+    const error = () => canvasElement.querySelector('.flg-field-error');
+
+    // A duplicate stays in the input, the Field says why, and the browser will not submit.
+    await user.click(input);
+    await user.keyboard('React,');
+    await expect(tagsOf(canvasElement)).toEqual(['React']);
+    await expect(input).toHaveValue('React');
+    await waitFor(() => expect(error()).toHaveTextContent('Already added'));
+    await expect(input).toHaveAttribute('aria-invalid', 'true');
+    await expect(input.validity.customError).toBe(true);
+    await user.click(canvas.getByRole('button', { name: 'Save' }));
+    await expect(rejectionSent).toEqual([]);
+
+    // Changing the text takes the message away; a new tag goes through, and the submit with it.
+    await user.clear(input);
+    await waitFor(() => expect(error()).toBeNull());
+    await expect(input.validity.valid).toBe(true);
+    await user.keyboard('Vue,');
+    await expect(tagsOf(canvasElement)).toEqual(['React', 'Vue']);
+    await user.click(canvas.getByRole('button', { name: 'Save' }));
+    await waitFor(() => expect(rejectionSent).toEqual([['React', 'Vue']]));
+
+    // maxTags: the fourth is turned down, and a removal makes room.
+    await user.click(input);
+    await user.keyboard('Svelte,Solid,');
+    await expect(tagsOf(canvasElement)).toEqual(['React', 'Vue', 'Svelte']);
+    await waitFor(() => expect(error()).toHaveTextContent('Up to 3 tags'));
+    await user.keyboard('{Home}{ArrowLeft}{Delete}');
+    await waitFor(() => expect(error()).toBeNull());
+  },
+};
diff --git a/src/components/tag-input/TagInput.test-d.ts b/src/components/tag-input/TagInput.test-d.ts
index 05768f1..fa1a501 100644
--- a/src/components/tag-input/TagInput.test-d.ts
+++ b/src/components/tag-input/TagInput.test-d.ts
@@ -36,3 +36,15 @@ test('the labels are optional functions of the tag', () => {
   const wrong: Labels = { added: 'added' };
   expectTypeOf(wrong).toBeObject();
 });
+
+test('validate judges a tag, and the labels have the words of the three messages', () => {
+  expectTypeOf<TagInputProps['validate']>().toEqualTypeOf<
+    ((tag: string, tags: string[]) => boolean | string) | undefined
+  >();
+  expectTypeOf<TagInputProps['maxTags']>().toEqualTypeOf<number | undefined>();
+  expectTypeOf<TagInputProps['allowDuplicates']>().toEqualTypeOf<boolean | undefined>();
+  type Labels = NonNullable<TagInputProps['labels']>;
+  expectTypeOf<Labels['invalid']>().toEqualTypeOf<string | undefined>();
+  expectTypeOf<Labels['duplicate']>().toEqualTypeOf<string | undefined>();
+  expectTypeOf<Labels['tooMany']>().toEqualTypeOf<((max: number) => string) | undefined>();
+});
diff --git a/src/components/tag-input/TagInput.test.tsx b/src/components/tag-input/TagInput.test.tsx
index 9a78296..11730c3 100644
--- a/src/components/tag-input/TagInput.test.tsx
+++ b/src/components/tag-input/TagInput.test.tsx
@@ -1,4 +1,4 @@
-import { act, fireEvent, render, screen } from '@testing-library/react';
+import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
 import { renderToString } from 'react-dom/server';
 import { useState } from 'react';
 import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
@@ -189,8 +189,8 @@ describe('TagInput', () => {
       expect(tagTexts()).toEqual(['a,b']);
     });
 
-    it('keeps duplicates in this task: every non-empty text becomes a tag', () => {
-      render(<TagInput aria-label="Skills" />);
+    it('keeps duplicates with allowDuplicates: every non-empty text becomes a tag', () => {
+      render(<TagInput aria-label="Skills" allowDuplicates />);
       type('a,');
       type('a,');
       expect(tagTexts()).toEqual(['a', 'a']);
@@ -729,6 +729,283 @@ describe('TagInput', () => {
     });
   });
 
+  describe('rejection', () => {
+    const message = () => document.querySelector('.flg-field-error');
+
+    it('rejects a duplicate by default, keeps its text in the input, and says why', () => {
+      render(<TagInput aria-label="Skills" defaultValue={['a']} />);
+      type('a,');
+      expect(tagTexts()).toEqual(['a']);
+      expect(input()).toHaveValue('a');
+      expect(message()).toHaveTextContent('Already added');
+    });
+
+    it('compares a duplicate exactly after trimming, so a different case is another tag', () => {
+      render(<TagInput aria-label="Skills" defaultValue={['a']} />);
+      type(' A ,');
+      expect(tagTexts()).toEqual(['a', 'A']);
+      type(' a ,');
+      expect(tagTexts()).toEqual(['a', 'A']);
+      expect(input()).toHaveValue('a');
+    });
+
+    it('takes a duplicate when allowDuplicates is on', () => {
+      render(<TagInput aria-label="Skills" allowDuplicates />);
+      type('a,');
+      type('a,');
+      expect(tagTexts()).toEqual(['a', 'a']);
+      expect(message()).toBeNull();
+    });
+
+    it('rejects a tag over maxTags with labels.tooMany, and takes it after a removal', () => {
+      render(<TagInput aria-label="Skills" maxTags={2} defaultValue={['a', 'b']} />);
+      type('c,');
+      expect(tagTexts()).toEqual(['a', 'b']);
+      expect(message()).toHaveTextContent('Up to 2 tags');
+      fireEvent.click(removeButtons()[0]!);
+      expect(message()).toBeNull();
+      type('c,');
+      expect(tagTexts()).toEqual(['b', 'c']);
+    });
+
+    it('lets validate say no with labels.invalid, or with its own sentence', () => {
+      const validate = (tag: string) => (tag === 'x' ? false : tag === 'y' ? 'No y' : true);
+      render(<TagInput aria-label="Skills" validate={validate} />);
+      type('x,');
+      expect(message()).toHaveTextContent('Invalid tag');
+      expect(input()).toHaveValue('x');
+      type('y,');
+      expect(message()).toHaveTextContent('No y');
+      type('z,');
+      expect(tagTexts()).toEqual(['z']);
+      expect(message()).toBeNull();
+    });
+
+    it('gives validate the trimmed tag and the tags so far', () => {
+      const validate = vi.fn(() => true);
+      render(<TagInput aria-label="Skills" defaultValue={['a']} validate={validate} />);
+      type(' b ,');
+      expect(validate).toHaveBeenCalledWith('b', ['a']);
+    });
+
+    it('checks in the order duplicate, maxTags, then validate', () => {
+      const validate = vi.fn(() => 'validate said no');
+      render(<TagInput aria-label="Skills" maxTags={1} validate={validate} defaultValue={['a']} />);
+      type('a,');
+      expect(message()).toHaveTextContent('Already added');
+      type('b,');
+      expect(message()).toHaveTextContent('Up to 1 tags');
+      expect(validate).not.toHaveBeenCalled();
+    });
+
+    it('uses the words of labels for the three messages', () => {
+      const labels = {
+        invalid: 'Sai',
+        duplicate: 'Trùng',
+        tooMany: (max: number) => `Tối đa ${max}`,
+      };
+      render(
+        <TagInput
+          aria-label="Skills"
+          labels={labels}
+          maxTags={2}
+          validate={(tag) => tag !== 'bad'}
+          defaultValue={['a']}
+        />,
+      );
+      type('a,');
+      expect(message()).toHaveTextContent('Trùng');
+      type('bad,');
+      expect(message()).toHaveTextContent('Sai');
+      type('b,');
+      type('c,');
+      expect(message()).toHaveTextContent('Tối đa 2');
+    });
+
+    it('rejects when Enter or leaving makes the tag, and leaves the text in the input', () => {
+      render(<TagInput aria-label="Skills" defaultValue={['a']} />);
+      type('a');
+      key('Enter');
+      expect(input()).toHaveValue('a');
+      expect(message()).toHaveTextContent('Already added');
+      fireEvent.blur(input(), { relatedTarget: document.body });
+      expect(tagTexts()).toEqual(['a']);
+      expect(input()).toHaveValue('a');
+    });
+
+    it('adds the accepted parts of a paste and leaves the rejected ones joined by a separator', () => {
+      render(<TagInput aria-label="Skills" defaultValue={['a']} separators={[';', 'Enter']} />);
+      paste('b;a;c;a;d');
+      expect(tagTexts()).toEqual(['a', 'b', 'c', 'd']);
+      expect(input()).toHaveValue('a;a');
+      expect(message()).toHaveTextContent('Already added');
+    });
+
+    it('joins by the first separator that is not "Enter"', () => {
+      render(
+        <TagInput aria-label="Skills" defaultValue={['a']} separators={['Enter', ';', ',']} />,
+      );
+      paste('a;b;a');
+      expect(input()).toHaveValue('a;a');
+    });
+
+    it('joins the rejected parts of a paste with a space when every separator is "Enter"', () => {
+      render(<TagInput aria-label="Skills" defaultValue={['a', 'b']} separators={['Enter']} />);
+      paste('a\nc\nb');
+      expect(tagTexts()).toEqual(['a', 'b', 'c']);
+      expect(input()).toHaveValue('a b');
+    });
+
+    it('takes the message of the first rejected part of a paste', () => {
+      render(
+        <TagInput
+          aria-label="Skills"
+          defaultValue={['a']}
+          maxTags={2}
+          validate={(tag) => tag !== 'bad'}
+        />,
+      );
+      paste('bad,a,c,d');
+      expect(tagTexts()).toEqual(['a', 'c']);
+      expect(message()).toHaveTextContent('Invalid tag');
+      expect(input()).toHaveValue('bad,a,d');
+    });
+
+    it('counts the parts of a paste that were just accepted, as duplicates and toward maxTags', () => {
+      render(<TagInput aria-label="Skills" maxTags={2} />);
+      paste('a,a,b,c');
+      expect(tagTexts()).toEqual(['a', 'b']);
+      expect(input()).toHaveValue('a,c');
+    });
+
+    it('is invalid while rejected, with a validity message that blocks a submit', () => {
+      render(
+        <form>
+          <TagInput aria-label="Skills" defaultValue={['a']} />
+        </form>,
+      );
+      const form = document.querySelector('form')!;
+      expect(form.checkValidity()).toBe(true);
+      type('a,');
+      expect(input()).toHaveAttribute('aria-invalid', 'true');
+      expect(document.querySelector('.flg-tag-input')).toHaveAttribute('data-invalid');
+      expect(input().validationMessage).toBe('Already added');
+      expect(form.checkValidity()).toBe(false);
+    });
+
+    it('shows the message under the frame, in the root, and describes the input by it', () => {
+      render(<TagInput aria-label="Skills" defaultValue={['a']} aria-describedby="hint" />);
+      type('a,');
+      const error = message()!;
+      expect(error.tagName).toBe('P');
+      expect(error.parentElement).toBe(document.querySelector('.flg-tag-input'));
+      expect(error.previousElementSibling).toBe(document.querySelector('.flg-tag-input-box'));
+      expect(input().getAttribute('aria-describedby')!.split(' ')).toEqual(['hint', error.id]);
+    });
+
+    it('says the message through the live region', async () => {
+      render(<TagInput aria-label="Skills" defaultValue={['a']} />);
+      type('a,');
+      await aTaskLater();
+      expect(document.querySelector('[aria-live]')).toHaveTextContent('Already added');
+    });
+
+    it('says what a paste added, and then why the rest was not', async () => {
+      render(<TagInput aria-label="Skills" defaultValue={['a']} />);
+      paste('a,b');
+      await aTaskLater();
+      expect(document.querySelector('[aria-live]')).toHaveTextContent('b added. Already added');
+    });
+
+    it('loses the message when the text changes', () => {
+      render(<TagInput aria-label="Skills" defaultValue={['a']} />);
+      type('a,');
+      type('ab');
+      expect(message()).toBeNull();
+      expect(input()).not.toHaveAttribute('aria-invalid');
+      expect(input().validationMessage).toBe('');
+    });
+
+    it('loses the message when a tag is added', () => {
+      render(<TagInput aria-label="Skills" defaultValue={['a']} />);
+      type('a,');
+      expect(message()).not.toBeNull();
+      type('b,');
+      expect(message()).toBeNull();
+    });
+
+    it('loses the message when a tag is removed', () => {
+      render(<TagInput aria-label="Skills" defaultValue={['a']} />);
+      type('a,');
+      fireEvent.click(removeButtons()[0]!);
+      expect(message()).toBeNull();
+    });
+
+    it('loses the message when the form resets', async () => {
+      render(
+        <form>
+          <TagInput aria-label="Skills" defaultValue={['a']} />
+        </form>,
+      );
+      type('a,');
+      expect(message()).not.toBeNull();
+      act(() => document.querySelector('form')!.reset());
+      await aTaskLater();
+      expect(message()).toBeNull();
+      expect(input().validationMessage).toBe('');
+    });
+
+    describe('in a Field', () => {
+      it('reports the message to the Field, which shows it and is invalid', async () => {
+        render(
+          <Field label="Skills" description="Hint">
+            <TagInput defaultValue={['a']} />
+          </Field>,
+        );
+        type('a,');
+        await waitFor(() => expect(message()).not.toBeNull());
+        const error = message()!;
+        expect(error).toHaveTextContent('Already added');
+        expect(error.parentElement).toHaveClass('flg-field');
+        expect(document.querySelector('.flg-tag-input > .flg-field-error')).toBeNull();
+        expect(input()).toHaveAttribute('aria-invalid', 'true');
+        expect(input()).toHaveAccessibleDescription('Hint Already added');
+      });
+
+      it('shows the error of the Field instead, and the message returns when it goes', async () => {
+        const { rerender } = render(
+          <Field label="Skills" error="Field says">
+            <TagInput defaultValue={['a']} />
+          </Field>,
+        );
+        type('a,');
+        await aTaskLater();
+        expect(screen.getByText('Field says')).toBeInTheDocument();
+        expect(document.querySelectorAll('.flg-field-error')).toHaveLength(1);
+        rerender(
+          <Field label="Skills">
+            <TagInput defaultValue={['a']} />
+          </Field>,
+        );
+        await waitFor(() => expect(message()).toHaveTextContent('Already added'));
+      });
+
+      it('takes the message from the Field when the text changes', async () => {
+        render(
+          <Field label="Skills">
+            <TagInput defaultValue={['a']} />
+          </Field>,
+        );
+        type('a,');
+        await waitFor(() => expect(message()).not.toBeNull());
+        type('ab');
+        await aTaskLater();
+        expect(message()).toBeNull();
+        expect(input()).not.toHaveAttribute('aria-invalid');
+      });
+    });
+  });
+
   describe('development warnings', () => {
     it('warns about a separator longer than one character other than "Enter", once', () => {
       const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
@@ -744,6 +1021,20 @@ describe('TagInput', () => {
       expect(warn).not.toHaveBeenCalled();
     });
 
+    it('warns about duplicate values when allowDuplicates is off, once, and not when it is on', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const { rerender } = render(
+        <TagInput aria-label="Skills" allowDuplicates value={['a', 'a']} />,
+      );
+      expect(warn).not.toHaveBeenCalled();
+      rerender(<TagInput aria-label="Skills" value={['a', 'b', 'a']} />);
+      rerender(<TagInput aria-label="Skills" value={['a', 'b', 'a']} />);
+      const messages = warn.mock.calls.map((call) => String(call[0]));
+      expect(messages).toHaveLength(1);
+      expect(messages[0]).toContain('allowDuplicates');
+      expect(messages[0]).toContain('"a"');
+    });
+
     it('names TagInput value and TagInput inputValue when they switch to controlled', () => {
       const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
       const { rerender } = render(<TagInput aria-label="Skills" />);
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/tag-input
```

Expected: FAIL. Ở bản nháp, 23 test mới fail trên commit cha. Ví dụ:
- `rejects a duplicate by default, keeps its text in the input, and says why`: `expected ['a','a'] to deeply equal ['a']`;
- `rejects a tag over maxTags with labels.tooMany, and takes it after a removal`: `expected ['a','b','c'] to deeply equal ['a','b']`;
- `is invalid while rejected, with a validity message that blocks a submit`: ô gõ không có `aria-invalid`;
- `shows the message under the frame, in the root, and describes the input by it`: `Cannot read properties of null (reading 'tagName')`;
- ba test của nhóm `in a Field`: hết giờ chờ lời báo;
- `warns about duplicate values when allowDuplicates is off, once, and not when it is on`: không có cảnh báo.

Các test pass ngay là test đặc tả của điều phải giữ: thẻ trùng được nhận khi có `allowDuplicates`; lời báo mất khi chữ đổi và khi xoá thẻ; `error` của Field che lời báo. Test kiểu mới `validate judges a tag, and the labels have the words of the three messages` lỗi kiểu, vì `TagInputProps` chưa có `validate`, `maxTags`, `allowDuplicates` và ba khoá mới của `labels`.

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
index 0a21b63..b998c86 100644
--- a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
+++ b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
@@ -815,13 +815,13 @@ Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "size"> &
   - Focus rời TagInput (không phải sang nút xoá của chính nó) thì chữ đang gõ dở được thêm thành thẻ (Claude chốt, §3.1).
 - **Thẻ bị từ chối:**
   - Thứ tự xét: trùng (khi `allowDuplicates` tắt, so đúng từng ký tự sau khi bỏ khoảng trắng), vượt `maxTags`, rồi `validate`. `validate` trả `false` thì lời báo là `labels.invalid`; trả chuỗi thì lời báo là chuỗi đó (Claude chốt).
-  - Chữ được giữ lại trong ô gõ để người dùng sửa. Khi dán, các phần bị từ chối được nối lại bằng ký tự ngăn đầu tiên không phải `"Enter"`; lời báo là lời của phần bị từ chối đầu tiên.
+  - Chữ được giữ lại trong ô gõ để người dùng sửa. Khi dán, các phần được chấp nhận được thêm vào, các phần bị từ chối được nối lại bằng ký tự ngăn đầu tiên không phải `"Enter"`; lời báo là lời của phần bị từ chối đầu tiên. Khi mọi ký tự ngăn đều là `"Enter"`, các phần được nối bằng một dấu cách (phát hiện khi lập Plan B). Mỗi phần được xét với các thẻ đứng trước nó, kể cả các phần vừa được chấp nhận trong cùng lần dán.
   - TagInput thành `invalid`, ô gõ có `aria-invalid` và `setCustomValidity(lời báo)`, lời báo hiện qua `useControlError` (§3.2) và được đọc qua vùng live.
   - Lời báo mất khi chữ đổi, hoặc khi một thẻ được thêm hay xoá.
 - **Bàn phím:**
   - Backspace trong ô gõ trống, hoặc ← khi con trỏ chữ ở đầu ô gõ, focus nút xoá của thẻ cuối. ← là Claude chốt.
   - Trên nút xoá: Backspace hoặc Delete xoá thẻ đó; Enter hoặc Space (click gốc của nút) cũng xoá.
-  - Sau khi xoá: focus sang nút xoá của thẻ kế tiếp; xoá thẻ cuối thì sang thẻ trước; hết thẻ thì về ô gõ (Claude chốt).
+  - Sau khi xoá bằng phím: focus sang nút xoá của thẻ kế tiếp; xoá thẻ cuối thì sang thẻ trước; hết thẻ thì về ô gõ (Claude chốt). Bấm chuột vào nút xoá thì focus về ô gõ, nơi thẻ kế tiếp được gõ; quy tắc "nút kế tiếp" chỉ dành cho phím, nếu không Backspace sau một cú bấm chuột sẽ xoá thêm thẻ kế (phát hiện khi lập Plan B).
   - ← và → di chuyển giữa các nút xoá; → ở thẻ cuối về ô gõ. Home và End về thẻ đầu và thẻ cuối.
   - Esc trên nút xoá về ô gõ (Claude chốt).
   - Gõ một ký tự in được khi đang ở nút xoá: focus về ô gõ và ký tự đó vào ô gõ.
diff --git a/src/components/field/Field.mdx b/src/components/field/Field.mdx
index c197716..b8580be 100644
--- a/src/components/field/Field.mdx
+++ b/src/components/field/Field.mdx
@@ -51,6 +51,12 @@ for example a value that the control announces itself, pass it with `aria-hidden
 </Field>
 ```
 
+## Errors the control reports
+
+Some controls have an error of their own, such as a tag a TagInput turned down (a DatePicker will
+too). Inside a Field they report it to the Field, which shows it as its error and becomes invalid.
+The `error` you pass wins: while it is there, the control's message is not shown.
+
 ## Accessibility
 
 - The label points at the control through `for`, and the description and error are linked with
diff --git a/src/components/tag-input/TagInput.mdx b/src/components/tag-input/TagInput.mdx
index 2ba77f7..f383315 100644
--- a/src/components/tag-input/TagInput.mdx
+++ b/src/components/tag-input/TagInput.mdx
@@ -37,7 +37,7 @@ A tag is the trimmed text before a separator. Blank text is never a tag.
   click on a submit button. Moving focus to one of the TagInput's own remove buttons is not
   leaving. Leaving the window is not either.
 
-Every non-empty text becomes a tag, duplicates included.
+Every non-empty text becomes a tag, unless it is turned down (see Validation and limits).
 
 <Canvas of={Stories.Typing} />
 
@@ -45,6 +45,48 @@ Text is never taken while it is being composed with an input method (Vietnamese
 Japanese, Chinese): keys and input events during a composition belong to the input method. What
 was typed is split at the next input event, or when the user leaves.
 
+## Validation and limits
+
+A tag can be turned down. The checks run in this order, and the first that fails gives the message:
+
+1. **Duplicate:** a tag already there, compared exactly after trimming (`React` and `react` are
+   different tags), is turned down with `labels.duplicate`, unless `allowDuplicates` is set.
+2. **`maxTags`:** a tag that would make more than that many is turned down with
+   `labels.tooMany(max)`.
+3. **`validate(tag, tags)`:** called with the trimmed tag and the tags so far. `false` turns it
+   down with `labels.invalid`; a non-empty string turns it down with that sentence; anything else
+   accepts it.
+
+```tsx
+<TagInput
+  aria-label="Recipients"
+  maxTags={5}
+  validate={(tag) => /^S+@S+$/.test(tag) || 'Enter an email address.'}
+/>
+```
+
+A tag that is turned down stays in the input as text, to be fixed. A paste adds the parts that are
+accepted and leaves the others in the input, joined by the first separator that is not `"Enter"`
+(by a space when every separator is `"Enter"`); the message is the first rejected part's. Each part
+is judged against the tags before it, the ones just added from the same paste included.
+
+While a tag is turned down the TagInput is invalid: the text input has `aria-invalid` and a
+validity message (`setCustomValidity`), so the browser will not submit the form. The message goes
+as soon as the text changes, a tag is added or removed, or the form resets. It is also said through
+the live region.
+
+Where the message appears depends on the context:
+
+- **Inside a Field** it becomes the Field's error, with the Field's error style, and the Field is
+  invalid. An `error` passed to the Field wins, and the message of the TagInput is not shown while
+  it is there.
+- **Outside a Field** the TagInput renders it as a `<p class="flg-field-error">` under the frame,
+  inside its root, and adds it to the text input's `aria-describedby`.
+
+When `value` holds the same tag twice and `allowDuplicates` is off, the development build warns.
+
+<Canvas of={Stories.Rejection} />
+
 ## Removing tags
 
 Each chip has a remove button named by `labels.remove` ("Remove React"). The buttons are out of the
@@ -100,7 +142,8 @@ the text input:
 <Canvas of={Stories.InAForm} />
 
 Inside a `Field`, the label names the text input, and the description and error are announced with
-it. The Field's `required`, `disabled` and error apply to it.
+it. The Field's `required`, `disabled` and error apply to it, and so does the message of a tag that
+was turned down.
 
 ## Sizes and states
 
diff --git a/src/components/tag-input/TagInput.tsx b/src/components/tag-input/TagInput.tsx
index b04a7a9..ee00161 100644
--- a/src/components/tag-input/TagInput.tsx
+++ b/src/components/tag-input/TagInput.tsx
@@ -1,7 +1,7 @@
 'use client';
 
 import { clsx } from 'clsx';
-import { forwardRef, useMemo, useRef } from 'react';
+import { forwardRef, useMemo, useRef, useState } from 'react';
 import type {
   ChangeEvent,
   ClipboardEvent,
@@ -12,7 +12,7 @@ import type {
 } from 'react';
 import { composeEventHandlers } from '../../internal/compose-event-handlers';
 import { dataAttr } from '../../internal/data-attr';
-import { markAsFieldControl, useFieldProps } from '../../internal/field-context';
+import { markAsFieldControl, useControlError, useFieldProps } from '../../internal/field-context';
 import { CloseIcon } from '../../internal/icons';
 import { mergeRefs } from '../../internal/merge-refs';
 import { hasModifier } from '../../internal/roving';
@@ -46,17 +46,30 @@ export interface TagInputProps extends Omit<
    * line breaks). Default `["Enter", ","]`.
    */
   separators?: string[];
+  /**
+   * Decides about a tag before it is added, with the trimmed tag and the tags so far. `false` rejects
+   * it with `labels.invalid`; a non-empty string rejects it with that sentence.
+   */
+  validate?: (tag: string, tags: string[]) => boolean | string;
+  /** The most tags there can be. A tag over it is rejected. */
+  maxTags?: number;
+  /** Whether a tag already there can be added again. Default `false`. */
+  allowDuplicates?: boolean;
   size?: 'sm' | 'md' | 'lg';
   /** Marks the value as wrong. Inside a Field with an error this is already true. */
   invalid?: boolean;
   /**
    * The words the TagInput announces and labels its buttons with. Default `{ remove: (tag) =>
-   * "Remove <tag>", added: (tag) => "<tag> added", removed: (tag) => "<tag> removed" }`.
+   * "Remove <tag>", added: (tag) => "<tag> added", removed: (tag) => "<tag> removed", invalid: "Invalid
+   * tag", duplicate: "Already added", tooMany: (max) => "Up to <max> tags" }`.
    */
   labels?: {
     remove?: (tag: string) => string;
     added?: (tag: string) => string;
     removed?: (tag: string) => string;
+    invalid?: string;
+    duplicate?: string;
+    tooMany?: (max: number) => string;
   };
 }
 
@@ -81,6 +94,9 @@ export const TagInput = markAsFieldControl(
       defaultInputValue,
       onInputValueChange,
       separators = DEFAULT_SEPARATORS,
+      validate,
+      maxTags,
+      allowDuplicates = false,
       size = 'md',
       invalid: invalidProp,
       labels,
@@ -95,9 +111,14 @@ export const TagInput = markAsFieldControl(
       onCompositionEnd,
       ...rest
     } = props;
+    // The text that was turned down, and why. Its message goes to the Field, or under the frame.
+    const [rejection, setRejection] = useState<string | null>(null);
+    const ownError = useControlError(rejection);
     const { invalid, required, disabled, ...inputProps } = useFieldProps({
       ...rest,
-      invalid: invalidProp,
+      invalid: invalidProp ?? (rejection === null ? undefined : true),
+      'aria-describedby':
+        [rest['aria-describedby'], ownError?.id].filter(Boolean).join(' ') || undefined,
     });
     const readOnly = props.readOnly === true;
     const removeLabel = labels?.remove ?? ((tag: string) => `Remove ${tag}`);
@@ -112,6 +133,14 @@ export const TagInput = markAsFieldControl(
           `${longOnes.map((one) => JSON.stringify(one)).join(', ')}. They never match a typed key.`,
       );
     }
+    if (!allowDuplicates && value && new Set(value).size !== value.length) {
+      const twice = value.filter((tag, at) => value.indexOf(tag) !== at);
+      devWarn(
+        `<TagInput> value has the same tag more than once (${[...new Set(twice)]
+          .map((tag) => JSON.stringify(tag))
+          .join(', ')}) and allowDuplicates is off. Pass allowDuplicates, or remove the repeats.`,
+      );
+    }
     const hasEnter = separators.includes('Enter');
     const characters = useMemo(
       () => new Set(separators.filter((one) => [...one].length === 1)),
@@ -143,10 +172,46 @@ export const TagInput = markAsFieldControl(
       if (!controlled) latestTags.current = next;
       setTags(next);
     };
-    const add = (parts: string[]) => {
-      if (parts.length === 0) return;
-      changeTags([...latestTags.current, ...parts]);
-      announce(parts.map(addedLabel).join('. '));
+    const duplicateLabel = labels?.duplicate ?? 'Already added';
+    const invalidLabel = labels?.invalid ?? 'Invalid tag';
+    const tooManyLabel = labels?.tooMany ?? ((max: number) => `Up to ${max} tags`);
+    /** Why `tag` cannot be added to `tags`, or null when it can: duplicate, too many, then validate. */
+    const rejectionOf = (tag: string, tags: string[]): string | null => {
+      if (!allowDuplicates && tags.includes(tag)) return duplicateLabel;
+      if (maxTags !== undefined && tags.length >= maxTags) return tooManyLabel(maxTags);
+      const verdict = validate?.(tag, tags);
+      if (verdict === false) return invalidLabel;
+      return typeof verdict === 'string' && verdict !== '' ? verdict : null;
+    };
+    // What a rejected text is joined by, when several stay in the input: the first separator that is
+    // a character, and a space when the only one is "Enter".
+    const joiner = separators.find((one) => one !== 'Enter' && [...one].length === 1) ?? ' ';
+    /**
+     * Adds the parts that can be tags, in order, each judged against the tags before it, and says what
+     * was added and why the rest was not. Returns the rejected parts, for the caller to leave in the
+     * input; the message is that of the first of them.
+     */
+    const add = (parts: string[]): string[] => {
+      let tags = latestTags.current;
+      const accepted: string[] = [];
+      const turnedDown: string[] = [];
+      let message: string | null = null;
+      for (const part of parts) {
+        const why = rejectionOf(part, tags);
+        if (why === null) {
+          tags = [...tags, part];
+          accepted.push(part);
+        } else {
+          turnedDown.push(part);
+          message ??= why;
+        }
+      }
+      if (accepted.length > 0) changeTags(tags);
+      setRejection(message);
+      const said = accepted.map(addedLabel);
+      if (message !== null) said.push(message);
+      if (said.length > 0) announce(said.join('. '));
+      return turnedDown;
     };
 
     const rootRef = useRef<HTMLDivElement>(null);
@@ -170,6 +235,7 @@ export const TagInput = markAsFieldControl(
     const removeAt = (index: number, focus: 'keyboard' | 'pointer') => {
       const removed = latestTags.current[index];
       if (removed === undefined) return;
+      setRejection(null);
       // A press on the button is a pointer's business: the focus goes to the input, where the next
       // tag is typed. Keys follow the rule of the keyboard: the button that took its place.
       if (focus === 'keyboard') focusAfter.current = { from: tags, index };
@@ -183,6 +249,8 @@ export const TagInput = markAsFieldControl(
     // composition that ends: the input event that follows it, or a leave, takes it.
     const isComposing = useRef(false);
     const setTyped = (next: string, composingNow = isComposing.current) => {
+      // New text is a new chance: what was said about the old text no longer holds.
+      setRejection(null);
       if (composingNow || readOnly) {
         setText(next);
         return;
@@ -193,14 +261,14 @@ export const TagInput = markAsFieldControl(
         setText(next);
         return;
       }
-      add(splitTags(chars.slice(0, cut + 1).join(''), separators));
-      setText(chars.slice(cut + 1).join(''));
+      const left = add(splitTags(chars.slice(0, cut + 1).join(''), separators));
+      const rest = chars.slice(cut + 1).join('');
+      setText([...left, ...(rest === '' ? [] : [rest])].join(joiner));
     };
     /** Makes what is typed tags, all of it: the separators it still holds split it. */
     const flush = () => {
       if (readOnly || text.trim() === '') return;
-      add(splitTags(text, separators));
-      setText('');
+      setText(add(splitTags(text, separators)).join(joiner));
     };
     const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
       setTyped(
@@ -219,8 +287,7 @@ export const TagInput = markAsFieldControl(
       event.preventDefault();
       const before = input.value.slice(0, input.selectionStart ?? input.value.length);
       const after = input.value.slice(input.selectionEnd ?? input.value.length);
-      add(splitTags(before + pasted + after, separators));
-      setText('');
+      setText(add(splitTags(before + pasted + after, separators)).join(joiner));
     };
 
     // --- Keyboard in the input.
@@ -298,7 +365,12 @@ export const TagInput = markAsFieldControl(
     useFormReset(inputRef, () => {
       resetTags(defaultValue ?? NO_TAGS);
       resetText(defaultInputValue ?? '');
+      setRejection(null);
     });
+    // The browser's own check is what stops a submit: the text input says it is not valid.
+    useIsoLayoutEffect(() => {
+      inputRef.current?.setCustomValidity(rejection ?? '');
+    }, [rejection]);
 
     const seen = new Map<string, number>();
     const items = tags.map((tag, index) => {
@@ -384,6 +456,11 @@ export const TagInput = markAsFieldControl(
               />
             ))
           : null}
+        {ownError ? (
+          <p id={ownError.id} className="flg-field-error">
+            {ownError.message}
+          </p>
+        ) : null}
         {region}
       </div>
     );
diff --git a/src/styles/components/tag-input.css b/src/styles/components/tag-input.css
index f418737..d6df6ce 100644
--- a/src/styles/components/tag-input.css
+++ b/src/styles/components/tag-input.css
@@ -23,6 +23,10 @@
   }
   /* The list and its items give the chips list semantics and take no box of their own, so that the
      chips and the text input are siblings in the frame's row (spec §10 has the fallback). */
+  /* Its own error, when there is no Field to show it: the Field's gap, as the frame's sibling. */
+  .flg-tag-input > .flg-field-error {
+    margin-top: 5px;
+  }
   .flg-tag-input-list,
   .flg-tag-input-item {
     display: contents;
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/tag-input src/components/field src/internal src/index.test.ts
pnpm vitest run --project storybook-light --project storybook-dark src/components/tag-input
pnpm build && pnpm check:package
```

Expected: 565 test đơn vị PASS, 3 skip (`TagInput.test.tsx` 91 test mỗi project). Story `tag-input` 54 test PASS (9 story × 3 engine × 2 theme). `check:package`: mọi check PASS trừ **`size`**: JS 36.9 kB trên 35.86 kB (vượt 1.04 kB), CSS 7.56 kB trong ngưỡng. Chưa ghi ngưỡng. CSS chỉ thêm một quy tắc trên selector riêng của TagInput, và DOM của Field không đổi khi không có lời báo (test đặc tả của Task 2), nên ảnh chuẩn cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md \
  src/components/field/Field.mdx \
  src/components/tag-input/TagInput.mdx \
  src/components/tag-input/TagInput.stories.tsx \
  src/components/tag-input/TagInput.test-d.ts \
  src/components/tag-input/TagInput.test.tsx \
  src/components/tag-input/TagInput.tsx \
  src/styles/components/tag-input.css
```
```bash
git commit -m "feat(tag-input): reject duplicates, too many and invalid tags" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 7: Cặp tương phản, ngưỡng kích thước, kiểm tra cuối

Spec §4.4 (các cặp `combobox-unmatched-text`, `tag-chip-text`, `tag-remove-icon`; quy tắc `prefers-contrast: more` của nút xoá), §4.9 của spec 0+1, §7 dòng 4.
- **Tương phản.** `check:contrast` đo thêm ba cặp, trên kính thường và trên panel có scrim, giữ số thấp hơn:
  - `combobox-unmatched-text` (4.5): chữ `--flg-text-muted` của option đang lọc và của dòng trạng thái, trên panel listbox (một `Surface`). Option đang được trỏ có màu chữ riêng, đã đo là `highlight-text`.
  - `tag-chip-text` (4.5): chữ `--flg-text` của chip trên `--flg-control-track`, đặt trên `--flg-control-bg` của khung.
  - `tag-remove-icon` (3): icon × là chữ của chip với `opacity: .75` (1 ở contrast-more), trên nền chip.
- `combobox-unmatched-text` ở theme tối là 4.10:1, đúng cặp của dòng 6 §4.9, nên dòng 6 được mở rộng thay vì thêm dòng (phát hiện 13). Bảng vẫn 17 dòng, câu "Cả mười bảy điểm" không đổi.
- **Contrast-more.** `preferences.css`: `.flg-tag > button { opacity: 1 }`. Sau đó cả ba cặp đạt ở chế độ này. Giao diện mặc định không đổi, nên không đổi ảnh chuẩn.
- **Ngưỡng kích thước** ghi bằng `pnpm size:record` (không chép `.size-limit.json`).
- **Kiểm tra cuối**: unit đủ bộ, tương phản, package, story từng thư mục, fixtures.

**Files:**
- Modify: `.size-limit.json`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`, `scripts/contrast-exceptions.ts`, `scripts/lib/contrast.ts`, `src/styles/preferences.css`

**Interfaces:**
- Produces: ba check mới trong `CHECKS` của `scripts/lib/contrast.ts`; dòng 6 của `KNOWN_EXCEPTIONS` có thêm `{ row: 6, theme: 'dark', check: 'combobox-unmatched-text', recorded: 4.1 }`; ngưỡng mới JS 40586 B, CSS 8309 B.
- Consumes: mọi thứ ở Task 1 đến 6.

- [ ] **Step 1: Viết test**

Task này không có test mới, nên không có khối patch test. Test là `passes with only the known exceptions of spec §4.9`, có sẵn trong `scripts/lib/contrast.test.ts`: nó đòi `evaluate(values, KNOWN_EXCEPTIONS).findings` rỗng. Một cặp mới dưới ngưỡng mà chưa có trong danh sách ngoại lệ làm nó fail; test `records exactly the measured value of every known exception` giữ số ghi của dòng 6 mới đúng bằng số đo. Quy tắc `opacity: 1` là CSS mà không test đơn vị nào thấy: script tự mô phỏng opacity theo chế độ.

- [ ] **Step 2: Chạy test, xác nhận fail**

Lưu khối patch ở Step 3 vào `../task-7-code.patch` (giữ LF). Áp riêng phần `scripts/lib/contrast.ts` (ba check mới), rồi chạy test:

```bash
git apply --include=scripts/lib/contrast.ts ../task-7-code.patch
pnpm gen:theme
pnpm vitest run --project scripts scripts/lib/contrast.test.ts
```

Expected: FAIL ở `evaluate with the shipped values > passes with only the known exceptions of spec §4.9`: một finding `below-threshold` cho `combobox-unmatched-text`, theme `dark`, chế độ `default` (4.10 < 4.5). Đó là lỗi bản nháp ghi được khi ba check mới có mà dòng 6 chưa mở rộng; cặp này là cặp duy nhất dưới ngưỡng ở chế độ mặc định.

- [ ] **Step 3: Viết code**

Phần `scripts/lib/contrast.ts` của khối dưới đây đã được áp ở Step 2. Áp phần còn lại:

```bash
git apply --exclude=scripts/lib/contrast.ts ../task-7-code.patch
```

```diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index 2869219..eb5eb33 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -317,7 +317,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 3 | Viền Input/Textarea khi focus (control không lỗi) | đạt (4.45:1) | 2.06:1 | 3:1 | 1.4.11 |
 | 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
 | 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) và vạch dưới tab `underline` đang chọn, so với nền | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
-| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
+| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
 | 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn, trang hiện tại của Pagination | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
 | 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn, trang hiện tại của Pagination | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
 | 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
@@ -330,7 +330,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 16 | Rãnh của Slider (`--flg-control-track`) so với nền | 1.23:1 | 1.30:1 | 3:1 | 1.4.11 |
 | 17 | Núm của Slider (`--flg-control-thumb`) so với rãnh và với phần đã chọn | 1.29:1 | 2.24:1 | 3:1 | 1.4.11 |
 
-Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Điểm 14 là icon `info` của toast theo mockup toast S2 (giai đoạn 2, Plan E1). Điểm 15–17 là chấm vạch, rãnh và núm của Slider theo mockup S3 (giai đoạn 3, Plan A). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
+Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Điểm 14 là icon `info` của toast theo mockup toast S2 (giai đoạn 2, Plan E1). Điểm 6 còn là chữ mờ của option Combobox đang lọc và dòng trạng thái (giai đoạn 3, Plan B): cùng cặp màu, nên cùng số đo. Điểm 15–17 là chấm vạch, rãnh và núm của Slider theo mockup S3 (giai đoạn 3, Plan A). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
 
 Cả mười bảy điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
 
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 4906853..da4615c 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -45,7 +45,12 @@ const D = {
       'selected underline tab, against the surface',
     criterion: '1.4.11',
   },
-  6: { description: 'Muted text on the brightest reference backdrop', criterion: '1.4.3' },
+  6: {
+    description:
+      'Muted text on the brightest reference backdrop, and the muted text of a Combobox option ' +
+      'while filtering and of its status row',
+    criterion: '1.4.3',
+  },
   7: {
     description:
       'Accent text on the accent wash: an accent Badge, a selected pill tab, the current page',
@@ -95,6 +100,7 @@ export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
   { row: 5, theme: 'dark', check: 'checked-fill', recorded: 2.26, ...D[5] },
   { row: 5, theme: 'dark', check: 'tab-indicator', recorded: 2.26, ...D[5] },
   { row: 6, theme: 'dark', check: 'text-muted', recorded: 4.1, ...D[6] },
+  { row: 6, theme: 'dark', check: 'combobox-unmatched-text', recorded: 4.1, ...D[6] },
   { row: 7, theme: 'light', check: 'badge-accent', recorded: 3.4, ...D[7] },
   { row: 7, theme: 'dark', check: 'badge-accent', recorded: 3.76, ...D[7] },
   { row: 7, theme: 'light', check: 'selected-text', recorded: 3.4, ...D[7] },
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index ada9630..fc3ed34 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -45,6 +45,9 @@ export const CHECKS = {
   'slider-track': 3,
   'slider-thumb': 3,
   'stepper-icon': 3,
+  'combobox-unmatched-text': 4.5,
+  'tag-chip-text': 4.5,
+  'tag-remove-icon': 3,
 } as const;
 export type CheckId = keyof typeof CHECKS;
 const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
@@ -263,6 +266,12 @@ export function measure(
           contrastRatio(composite(stop, surface), surface),
         ),
       );
+    // A TagInput chip: the neutral Badge track over the frame, which is control-bg over the surface.
+    const chipBg = composite(color('control-track'), control);
+    const removeIcon = (opacity: number): Rgba => {
+      const [r, g, b, a] = color('text');
+      return [r, g, b, a * opacity];
+    };
     const measured: Omit<Record<CheckId, number>, OverlayCheck> = {
       text: onSurface('text'),
       'text-muted': onSurface('text-muted'),
@@ -340,6 +349,18 @@ export function measure(
             ),
       // The − and + of a NumberInput, muted text on the background of the frame.
       'stepper-icon': contrastRatio(composite(color('text-muted'), control), control),
+      // The muted text of a Combobox option while text filters the list, and of its status row, both
+      // on the listbox panel, which is a Surface (combobox.css). The highlighted option has its own
+      // text colour, measured as highlight-text.
+      'combobox-unmatched-text': onSurface('text-muted'),
+      // The chip of a TagInput is a neutral Badge on the frame's own background (tag-input.css).
+      'tag-chip-text': contrastRatio(composite(color('text'), chipBg), chipBg),
+      // Its × is the chip's text at 75% opacity; under contrast-more the button drops the opacity
+      // (preferences.css).
+      'tag-remove-icon': contrastRatio(
+        composite(removeIcon(mode === 'contrast-more' ? 1 : 0.75), chipBg),
+        chipBg,
+      ),
     };
     for (const id of SURFACE_CHECK_IDS) lowest[id] = Math.min(lowest[id], measured[id]);
   }
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index f6c41ff..7898730 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -28,6 +28,11 @@
       border: 2px solid var(--flg-text);
       background: var(--flg-glass-tint);
     }
+    /* A TagInput chip's remove button is drawn at 75% in the mockup; here it is the chip's text
+       colour whole (spec phase 3 §4.4). */
+    .flg-tag > button {
+      opacity: 1;
+    }
   }
   @media (forced-colors: active) {
     .flg-surface {
```

Ghi ngưỡng kích thước. Plan không chép `.size-limit.json`: `size:record` tự ghi file đó:

```bash
pnpm gen:theme
pnpm build
pnpm size:record
```

Expected: ngưỡng mới gần JS 40586 B, CSS 8309 B (trước: 35860 B, 7929 B), là kết quả ở bản nháp (đo được JS 36.9 kB, CSS 7.55 kB; ngưỡng là số đo cộng 10%). Nếu số khác một chút, giữ số do `size:record` ghi và nêu trong báo cáo.

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm check:contrast
pnpm build && pnpm check:package
pnpm vitest run --project storybook-light --project storybook-dark src/components/combobox
pnpm vitest run --project storybook-light --project storybook-dark src/components/tag-input
pnpm vitest run --project storybook-light --project storybook-dark src/components/select
pnpm vitest run --project storybook-light --project storybook-dark src/components/field
sed -e 's/5173/5174/g' -e 's/4173/4175/g' scripts/test-fixtures.mjs > scripts/test-fixtures.tmp.mjs
node scripts/test-fixtures.tmp.mjs
rm scripts/test-fixtures.tmp.mjs
```

Expected:
- `pnpm test:unit`: 134 file, 1962 test PASS, 3 skip.
- `pnpm check:contrast`: PASS. Bảng in ra có `combobox-unmatched-text` tối là `known-exception` 4.10, các cặp khác `pass` với số ở phát hiện 13.
- `pnpm check:package`: PASS với ngưỡng mới.
- Story, từng thư mục, ở ba engine và hai theme: combobox 84, tag-input 54, select 84, field 30, đều PASS.
- Fixture: `Fixtures OK: vite, next`. Ba dòng cuối chạy bản sao tạm của `pnpm test:fixtures` ở cổng 5174/4175, vì 5173/4173 bận (Global Constraints); trên máy mà hai cổng đó rảnh, chạy `pnpm test:fixtures`. Xoá bản sao, và không để server nào chạy sót.

- [ ] **Step 5: Commit**

```bash
git add \
  .size-limit.json \
  docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md \
  scripts/contrast-exceptions.ts \
  scripts/lib/contrast.ts \
  src/styles/preferences.css
```
```bash
git commit -m "feat: contrast pairs of Combobox and TagInput, size limits" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```


## Sau khi thực thi
