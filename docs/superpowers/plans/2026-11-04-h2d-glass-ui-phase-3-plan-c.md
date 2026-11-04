# h2d-glass-ui: Plan C, Calendar, DatePicker và `date.ts` (giai đoạn 3, phần 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm Plan C của giai đoạn 3: các hàm ngày ISO `date.ts`, `Calendar` (giao diện K1, chọn một ngày và chọn khoảng) và `DatePicker` (giao diện D1: gõ ngày theo locale, lịch trong popup, form, lời báo lỗi), cùng các cặp tương phản mới và ngưỡng kích thước.

**Architecture:**
- **`date.ts`** (Task 1): hàm thuần trên chuỗi ISO `'YYYY-MM-DD'` và `'YYYY-MM'`. Mọi định dạng đi qua `Intl.DateTimeFormat` với `timeZone: 'UTC'`, nên không múi giờ nào làm lệch ngày. Không `"use client"`, không export ra ngoài package.
- **`Calendar`** (Task 2, 3): lưới tháng `role="grid"` theo mẫu "date picker dialog" của APG, roving tabindex, `min`/`max`/`isDateUnavailable`, "hôm nay" đọc sau khi mount. Task 2 làm chế độ một ngày. Task 3 thêm `mode="range"`: ngày đầu chờ, dải xem trước, Esc bỏ ngày đầu.
- **`DatePicker`** (Task 4, 5): ô gõ trong khung `Input` có nút lịch, popup `popover="auto"` chứa một Calendar, và input ẩn mang ngày ISO cho form. Task 4 làm phần gõ, mở lịch, chọn ngày, form và Field. Task 5 thêm lời báo cho chữ không đọc được và ngày không chọn được (`useControlError`, `setCustomValidity`, `useAnnounce`).
- **Tương phản, ngưỡng kích thước, kiểm tra cuối** (Task 6).

**Tech Stack:** Như Plan A và B: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63, `@floating-ui/dom` 1.8.0. Plan này không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md`. Plan này làm các phần sau:
- §2 dòng C: `date.ts`, Calendar và DatePicker (Task 1 đến 6).
- §3.1: dòng DatePicker và ý **DatePicker giữ input ẩn** (Task 4, 5).
- §3.2: dòng DatePicker và Calendar; lỗi do control tự báo (Task 4, 5).
- §3.3, §3.4: giá trị là chuỗi ISO; locale và "hôm nay" (Task 1, 2, 4).
- §3.5: popup của DatePicker (Task 4).
- §3.6: tiêu đề tháng của Calendar là vùng live; vùng live riêng của DatePicker (Task 2, 5).
- §4.3, §4.4, §4.5: giao diện K1 và D1, cặp tương phản, forced colors của hai component (Task 2, 3, 4, 6).
- §5: `date.ts` (Task 1); các primitive dùng lại và cảnh báo dev của Calendar và DatePicker (Task 2 đến 5).
- §6.3: API của `Calendar` và `DatePicker`; §6.4: lịch mở khi chữ không đọc được, Calendar không có `value`, `month` và `today` (Task 2 đến 5).
- §7: các test mà spec nêu cho phần này.
- §8: trang MDX của Calendar và DatePicker.
- §4.9 của spec giai đoạn 0+1 (`docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`): dòng 6 mở rộng cho `calendar-weekday-text`, dòng 18 mới cho `calendar-outside-day` (Task 6).

Chủ dự án đã duyệt spec và chọn các giao diện K1 và D1 ngày 2026-11-02.

**Đã chạy thử khi lập kế hoạch:**
- Toàn bộ code dưới đây đã chạy trên nhánh nháp `draft/phase-3-plan-c`, mỗi task một commit (sáu commit trên `3727bb2`). Mỗi test viết trước đã được chạy trên commit cha của task, trừ các chỗ ghi rõ ở mục 13 bên dưới.
- Bản nháp được làm trên `0bf86ae`, rồi rebase lên `3727bb2` sau khi PR #13 đổi tên package (mục 2).
- `date.ts` (Task 1) do model miễn phí `kilo/reflection/beam-free` viết qua opencode; Claude kiểm tra và dọn lại. Các phần còn lại do subagent của Claude viết.
- Mọi khối patch trong plan được lấy thẳng từ các commit đó.

Kết quả đo ở `29f02b1`, sau rebase. Sau đó hai sửa nhỏ đưa đầu nhánh nháp lên `0f9282c`: một regex trong test cảnh báo của DatePicker dựng từ `WARN_PREFIX` (Task 4), và story `Controlled` của Calendar gắn `no-visual` (Task 2). Ở `0f9282c`, unit của `calendar` và `date-picker` (433 test, cả hai project React), lint, format và `check:name` chạy lại, PASS:

| Lệnh | Kết quả |
|---|---|
| `pnpm test:unit` | 2510 test PASS, 3 skip |
| Story | calendar 72, date-picker 96 PASS ở Chromium, Firefox và WebKit, theme sáng và tối, chạy từng thư mục một. Cả bộ story chưa chạy một lượt trên máy này vì thiếu bộ nhớ; CI chạy cả bộ |
| `pnpm check:contrast` | PASS, với dòng 6 của §4.9 mở rộng cho `calendar-weekday-text` và dòng 18 mới `calendar-outside-day` |
| `pnpm check:package` | PASS với ngưỡng mới: JS 45038 B (đo được 40943 B; trước: 40586 B), CSS 8880 B (đo được 8072 B; trước: 8309 B) |
| `pnpm test:fixtures` | Cả hai fixture (vite, next) PASS, chạy qua bản sao tạm của script ở cổng 5174/4175 |
| `pnpm gen:theme`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:name`, `pnpm build` | PASS |

Các phát hiện từ lần chạy thử đã được đưa vào plan:

1. **Sáu task nháp là sáu task của plan, cùng số thứ tự.** `date.ts` là một task riêng (Task 1). Ở Task 1 chưa module nào import nó, nên nó không có file build, và `check:use-client` sẽ báo `dist/internal/date.js: missing build output.` (như phát hiện 1 của Plan B). Vì vậy Task 1 không chạy `pnpm build && pnpm check:package`. Từ Task 2, Calendar import `date.ts`.
2. **Bản nháp được rebase lên `main` đã đổi tên.**
   - PR #13 đổi tên package thành `h2d-glass-ui` (merge ở `3727bb2`). Tiền tố `flg-` của CSS giữ nguyên.
   - Lúc rebase, file mới của từng commit được đổi sang tên mới: import trong MDX là `'h2d-glass-ui'`, và tiền tố cảnh báo viết tay trong test thành `WARN_PREFIX` (`src/internal/warn.ts`).
   - Bốn chỗ sửa spec (§4.5 và §4.3 của Calendar, hai chỗ ở §6.3 DatePicker; mục 3) được gộp vào commit của Task 2 đến 5 lúc rebase.
   - Mọi số ở bảng trên đo ở `29f02b1`, sau rebase (hai sửa nhỏ sau đó: xem đoạn trên bảng). Số ở bước kiểm tra của từng task là số của bản nháp trước rebase; rebase chỉ đổi tên, không thêm hay bớt test.
3. **Sáu chỗ của spec giai đoạn 3 được sửa hoặc thêm, đánh dấu "(phát hiện khi lập Plan C)":**
   - §5, dòng `date.ts` (Task 1): thêm `isIsoMonth`, để Calendar kiểm `month` và `defaultMonth`.
   - §4.5 **Calendar** (Task 2): ngày của tháng khác cũng là `GrayText` và bỏ `opacity`. Spec chỉ nêu ngày không chọn được; ngày của tháng khác không phải nút, và ngày không chọn được còn gạch ngang, nên hai loại không lẫn nhau.
   - §6.3 **Tháng đang hiện** (Task 2): khi `month` không được điều khiển mà component cha đổi `value` sang tháng khác, tháng đang hiện theo giá trị mới. Việc này không gọi `onMonthChange` và chỉ xảy ra khi `value` đổi: người dùng đã sang tháng khác không bị kéo về.
   - §4.3 **Khoảng** (Task 3): dải được vẽ ở một lớp `::before` của ô, bằng `--flg-selected-bg` và `--flg-selected-text` (mục 6).
   - §6.3 DatePicker, **Gõ ngày** (Task 4): rời ô gồm cả khi focus đi qua nút lịch ra ngoài; Enter với chữ đọc được (hoặc ô trống) chốt giá trị rồi để form gửi đúng giá trị đó (mục 7).
   - §6.3 DatePicker, lời báo (Task 5): lời báo mất khi chữ được chốt, khi chọn trong lịch, khi component cha đổi `value` hoặc khi reset; không mất theo từng phím gõ (mục 8).
4. **`date.ts`, các lựa chọn khi làm (Task 1):**
   - `formatDate` mặc định ra ngày và tháng hai chữ số (`{ year: 'numeric', month: '2-digit', day: '2-digit' }`): `11/14/2026`, `14/11/2026`, `14.11.2026`, như ví dụ của spec. `options` thay các trường đó.
   - Múi giờ của `formatDate` luôn là UTC, kể cả khi `options.timeZone` nói khác.
   - `clampIso(iso, min, max)` kiểm `min` trước. Calendar và DatePicker không gặp trường hợp `min` sau `max`, vì chúng bỏ cả hai (mục 5).
   - `parseDate` cần đúng ba nhóm chữ số: ngày và tháng 1–2 chữ số, năm 2 hoặc 4 chữ số. Năm 2 chữ số luôn là 20xx (`1/1/99` là `2099-01-01`). Mọi ký tự không phải chữ số là dấu ngăn.
   - Mọi ngày được dựng qua `setUTCFullYear`, không qua `Date.UTC` hay `new Date(iso)`: `Date.UTC` đọc năm 0–99 thành 1900–1999.
   - `todayIso` đọc ngày theo giờ máy (local), không theo UTC.
5. **Calendar, các lựa chọn khi làm (Task 2):**
   - `min` sau `max`: cả hai bị bỏ, kèm cảnh báo. Giữ một trong hai thì mọi ngày đều không chọn được.
   - `month` hay `defaultMonth` không hợp lệ bị bỏ như không truyền, nên tháng vẫn do Calendar giữ. `value` không hợp lệ: Calendar vẫn controlled, nhưng không có ngày (`null`).
   - `aria-selected` chỉ mang `"true"`, trên ô của ngày đang chọn; các ô khác không có `aria-selected="false"`.
   - `data-date="YYYY-MM-DD"` nằm trên nút ngày và trên số của tháng khác; `data-today`, `data-outside` là hook của CSS. HTML ở §6.3 không có các thuộc tính này; story, test và việc tìm nút để focus dùng chúng.
   - Khi chưa biết tháng (server, render đầu), Calendar vẫn render header, hai nút tháng `aria-disabled`, `thead` và `tbody` rỗng.
   - Phím đi qua ngày không chọn được, nhưng đích của phím được kẹp trong `[min, max]`: phím không bao giờ đưa focus ra ngoài khoảng.
   - Nút tháng `aria-disabled` khi cả tháng đích nằm ngoài `[min, max]`, so theo tháng: tháng có một ngày trong khoảng vẫn đi tới được.
   - Số ngày viết bằng chữ số Latin ở mọi locale; chỉ `aria-label` dùng chữ số của locale.
   - Tháng theo `value` được đặt trong một layout effect, nên tháng cũ không hiện ra khung hình nào.
6. **Calendar, chọn khoảng (Task 3):**
   - Dải được vẽ trên `td::before`, không trên `td`. Ở theme sáng `--flg-accent-subtle` là một gradient, nên `linear-gradient(90deg, transparent 50%, var(--flg-accent-subtle) 50%)` của mockup cho nửa ô ở hai đầu không hợp lệ và không vẽ gì. Lớp giả cũng giữ `border-collapse: collapse` của bảng, nên giao diện một ngày không đổi.
   - Dải dùng `--flg-selected-bg` và `--flg-selected-text`. Ở chế độ mặc định chúng bằng `--flg-accent-subtle` và `--flg-accent-text`, đúng mockup và đúng cặp của các dòng 7, 8 ở §4.9. `prefers-contrast: more` đã đổi sẵn cặp này (spec §4.4), nên Task 6 không thêm quy tắc cho khoảng. Bản nháp kiểm trong Chromium với chế độ contrast giả lập: dải `rgb(53, 84, 209)` (`--flg-selected-bg`, `#3554d1`), chữ ngày giữa `#fff`.
   - `data-chosen` trên `td` là hook của ngày tròn: ngày đang chọn, hoặc một đầu của khoảng, cả ở forced colors. Chế độ một ngày đổi hook CSS từ `[aria-selected='true']` sang `[data-chosen]` (cùng các ô).
   - `data-range` trên `td` là `start`, `middle`, `end` hoặc `single`; `data-preview` có khi ngày đầu đang chờ.
   - Khi ngày đầu đang chờ, khoảng đã chọn trước đó không được vẽ và không `aria-selected`; Esc trả nó lại.
   - Xem trước không với tới ngày không chọn được. Chọn lại đúng khoảng đang có không gọi `onValueChange`. Ngày của tháng khác không có dải.
   - Component cha controlled truyền cùng các ngày trong một mảng mới ở mỗi render không bị coi là đổi giá trị: tháng theo chuỗi ngày đầu, không theo mảng.
   - `onKeyDown` của người dùng chạy trước; nó gọi `preventDefault` thì Calendar không bỏ ngày đầu. Esc với Alt, Ctrl hay Meta bị bỏ qua.
   - Ngày đầu ở cột đầu và ngày cuối ở cột cuối không bo góc ở phía đó, vì dải của chúng bắt đầu ở giữa ô.
   - Ngày đang có focus mang `z-index: 1`, để dải của ô kế tiếp (vẽ sau) không che vòng focus.
   - Forced colors: mỗi ô trong khoảng có `outline: 1px solid Highlight` (forced colors bỏ `box-shadow`), và dải bị bỏ.
   - `CalendarRange` được export như một kiểu, vì docs và app cần tên của tuple.
   - Một dòng chỉ về kiểu trong test của Task 2 đổi: `setup` của nhóm `keys` nhận `Partial<Extract<CalendarProps, { mode?: 'single' }>>`, vì `Partial` của union không còn nhận `defaultValue: string`. Hai type test của Task 2 đọc kiểu từ `SingleProps`.
7. **DatePicker (Task 4):**
   - **Enter chốt rồi để form gửi.** Spec §7 ("Enter chốt giá trị rồi form gửi đúng giá trị đó") thắng brief nháp, vốn muốn Enter không gửi form khi chữ vừa đổi giá trị. Chữ đọc được (hoặc ô trống) được chốt, và Enter để cho trình duyệt.
   - Input ẩn được ghi thẳng trong keydown, vì Firefox gửi form trước khi React render (bài học PR #12). Một task sau, nó được trả về giá trị React đang giữ, cho trường hợp component cha controlled từ chối ngày đó.
   - Chữ không đọc được hay không chọn được: Enter bị `preventDefault`, form không gửi kèm ngày cũ.
   - Nếu chủ dự án muốn "Enter đầu chốt, Enter sau gửi": một `preventDefault` trong `handleKeyDown`, và bỏ phần ghi thẳng vào input ẩn.
   - **Rời qua nút lịch cũng là rời ô.** `onBlur` của nút đọc chữ khi focus đi ra ngoài ô gõ, nút và popup. Không có nó, chữ gõ rồi Tab hai lần không bao giờ được đọc.
   - **Cú nhấn ngày được đọc từ `click` của popup** (`button[data-date]` không `aria-disabled`), không từ `onValueChange` của Calendar. Calendar chỉ báo khi giá trị đổi, nên nhấn lại ngày đang chọn sẽ để popup mở mà con trỏ không có lối ra. Calendar chỉ nhận `value`. Enter và Space trên một ngày là một `click`, nên bàn phím đi cùng đường.
   - **Popup đóng một task sau khi focus rời nó** (`setTimeout 0`). Trong lúc `focusout` được phát, `document.activeElement` là `body` ở cả ba engine, và `returnFocus` của `usePopover` sẽ đưa focus về ô gõ. `relatedTarget` rỗng (Safari không focus nút được nhấn) không đóng popup.
   - **Hôm nay cho Calendar.** Không có `today`, DatePicker đọc `todayIso()` trong một layout effect khi mở và đưa xuống Calendar, để lưới có hôm nay trước khi focus vào. Nếu popup hiện trước khi lưới có (mở bằng `defaultOpen`, không có ngày, không có `today`), một cờ hoàn tất việc focus ở render mang đồng hồ tới.
   - Chữ và giá trị là hai state. Chữ theo giá trị và locale qua một layout effect có khoá (như `syncKey` của Combobox). Component cha từ chối thì chữ gõ ở lại.
   - Blur khi cửa sổ khác lấy focus (`relatedTarget` rỗng và `document.hasFocus()` là `false`) không đọc chữ.
   - `aria-controls` của nút lịch luôn có, vì phần tử popup luôn tồn tại.
   - `.flg-date-picker-popup` được thêm vào các danh sách `:is()` của năm quy tắc `@starting-style` trong `floating.css` (hiệu ứng mở). So `dist/styles.css` ở commit cha và ở commit của task, từng quy tắc: chỉ năm quy tắc đó có thêm selector, khai báo giữ nguyên.
   - `value` không hợp lệ: controlled, không có ngày (như Calendar). `defaultValue` không hợp lệ: không có ngày.
8. **DatePicker, lời báo lỗi (Task 5):**
   - Mở lịch không xét chữ không đọc được: người dùng chưa rời ô. Chữ đọc được vẫn được chốt khi mở, và việc chốt xoá lời báo.
   - Lời báo mất khi chữ được chốt (rời ô, Enter, ô trống), khi chọn trong lịch (kể cả ngày đang chọn), khi component cha đổi `value` và khi reset. Nó không mất theo từng phím gõ, khác TagInput, để lời báo không nhấp nháy khi ngày còn đang gõ dở.
   - Enter với chữ lỗi đọc lại lời báo (một hành động rõ ràng, như TagInput). Rời ô lần hai với cùng chữ thì không đọc lại; sửa chữ thì quên chữ cũ.
   - `invalid={false}` truyền trực tiếp thắng lời báo (như TagInput); `setCustomValidity` vẫn chặn submit.
   - Khi lời báo mất, `setCustomValidity('')` được gọi thẳng trên ô gõ, để một submit theo sau keydown Enter thấy ô hợp lệ trước khi React render.
   - Trong Field, lời báo đến Field chậm một render (qua effect của `useControlError`). Story `Invalid` chờ nó.
   - Gốc của DatePicker có thêm vùng live (luôn có) và, ngoài Field, `<p class="flg-field-error">` khi có lời báo.
9. **Ghi chú Playwright cho story:**
   - Một cú click thật chờ mãi trên phần tử `aria-disabled`, vì Playwright đợi nó "enabled". Story nhấn ngày không chọn được và nút `aria-disabled` bằng `userEvent.click` tổng hợp (`Pointer` của Calendar, `ReadOnly` của DatePicker).
   - WebKit không focus nút được nhấn. `MonthButtons` đặt focus lên nút rồi dùng Enter và Space.
   - Firefox tốn thêm một Tab trên đường vào lưới. `tabToGrid` lặp tới khi focus ở một ngày.
   - Bong bóng validation của Firefox chỉ ẩn khi có sự kiện `input` hoặc blur. `BlockedSubmit` rời ô bằng Tab trước khi nhấn Submit (bài học PR #12).
   - `Preview` đặt con trỏ thật lên ngày 18. Bản đầu dùng `userEvent.hover` tổng hợp và fail một lần ở Firefox (tối): con trỏ thật của story trước làm Firefox phát một mouse move sau khi layout đổi, và dải xem trước nhảy tới ngày đó.
   - Một assertion hover so `backgroundImage` với `'none'` thay cho màu nền trong suốt. Bản đầu fail một lần ở WebKit (tối) vì con trỏ thật của story trước nằm trên ngày đó.
   - Story `TabOut` là chỗ duy nhất bắt được lỗi focus-out của mục 7. Test jsdom tương ứng pass cả khi không có bộ hẹn giờ, vì jsdom có phần tử đang focus trong lúc `focusout`.
10. **Tương phản (Task 6).** `check:contrast` đo ba cặp mới, trên kính thường và trên panel có scrim, giữ số thấp hơn:

    | Check | Sáng | Sáng, contrast-more | Tối | Tối, contrast-more | Ngưỡng |
    |---|---|---|---|---|---|
    | `calendar-weekday-text` | 5.08 | 7.65 | 4.10 (dòng 6) | 10.43 | 4.5 |
    | `calendar-outside-day` | 2.04 (dòng 18) | 7.65 | 2.14 (dòng 18) | 10.43 | 4.5 |
    | `date-picker-icon` | 7.44 | 7.87 | 3.71 | 9.13 | 3 |

    - `calendar-weekday-text` ở theme tối là đúng cặp của dòng 6 §4.9 (`--flg-text-muted`, tối, 4.10). Dòng 6 được mở rộng (mô tả trong `contrast-exceptions.ts`, chữ của dòng 6 và chú thích bảng ở spec 0+1), như Plan B đã làm cho `combobox-unmatched-text`.
    - `calendar-outside-day` là dòng 18 mới: chữ mờ với `opacity: .5`, đúng như K1 vẽ. Bảng §4.9 thành 18 dòng, câu "Cả mười bảy điểm" thành "Cả mười tám điểm", và `ExceptionTable.test.tsx` đòi 18 dòng.
    - Dưới `prefers-contrast: more`, ngày của tháng khác bỏ `opacity: .5` (`.flg-calendar-day[data-outside] { opacity: 1 }` trong `preferences.css`). Script mô phỏng opacity theo chế độ chứ không đọc CSS, nên quy tắc này không có test máy.
    - Các dòng 4, 5, 7, 8 và 14 mà spec §4.4 mở rộng sang Calendar là cùng cặp màu, nên không có check mới. Bảng §4.9 của spec 0+1 không ghi thêm các vị trí đó.
11. **Cần chủ dự án duyệt (PR hỏi):**
    - §4.9 dòng 6 mở rộng cho `calendar-weekday-text` (tối 4.10:1, cùng cặp chữ mờ).
    - Dòng 18 mới `calendar-outside-day`: 2.04:1 sáng, 2.14:1 tối, chữ mờ với `opacity: .5` như K1 vẽ; 7.65 và 10.43 ở `prefers-contrast: more`.
    - Spec §4.3 (K1) cho đúng các giá trị này, nên giá trị không đổi (mockup lock).
12. **Các mục để lại** (không làm ở plan này):
    - "Enter đầu chốt, Enter sau gửi", nếu chủ dự án muốn (mục 7).
    - Kiểm tra screen reader (§7 dòng 6): tên ngày và trạng thái chọn của Calendar chưa thử với NVDA và VoiceOver.
    - Safari thật chưa thử; story chỉ chạy WebKit của Playwright.
13. **Chỗ bước fail-first không đầy đủ**, theo các báo cáo của bản nháp:
    - Task 1: cả file test fail vì `./date` chưa có; không test nào được thấy fail vì lý do riêng.
    - Task 2: cả file test fail vì `./Calendar` chưa có. Test `follows a controlled value that moves to another month while month is uncontrolled` được làm chặt hơn sau một lần thử đột biến: bỏ dòng `resetMonth(…)` mà bản đầu của test vẫn pass (tháng còn suy ra từ giá trị). Test bấm Next trước để tháng nằm trong state; sau đó nó fail khi bỏ dòng đó.
    - Task 3: 35 test fail trên code của Task 2. Các test của chế độ khoảng đã đúng trên code cũ là test đặc tả (Step 2 của Task 3 nêu tên).
    - Task 4: bản nháp viết test trước với một `DatePicker` giả trả `null`. Hai hành vi được thêm sau khi gặp ở story, không viết test trước:
      - rời qua nút lịch: `reads the text once focus goes on past the calendar button` được viết sau code; nó fail khi bỏ `onBlur` của nút;
      - bộ hẹn giờ focus-out: `closes when focus leaves it for anything but the input or the button, and keeps no focus` pass cả khi không có nó; story `TabOut` mới là test thật (mục 9).
    - Task 5: 24 test fail trên code của Task 4; hai test là test đặc tả.
    - Task 6: báo cáo nháp không ghi lỗi của bước fail-first. Hai lỗi ở Step 2 của Task 6 được đo khi lập plan, trên các file của bản nháp (code của Task 5 cùng test của Task 6).
    - Trên cây của plan, test patch của Task 1, 2 và 4 fail vì module chưa tồn tại (`Failed to resolve import …`). Các dòng "Expected" bên dưới ghi lỗi quan sát được ở bản nháp.
14. **Ảnh chuẩn của component cũ không đổi.**
    - Task 2 và 3 thêm `calendar.css` và các quy tắc `.flg-calendar*` vào `preferences.css`.
    - Task 4 thêm `date-picker.css`, các quy tắc `.flg-date-picker*` và selector `.flg-date-picker-popup` trong `floating.css` (so từng quy tắc, mục 7).
    - Task 5 không đổi CSS. Task 6 chỉ thêm `.flg-calendar-day[data-outside]` dưới `prefers-contrast: more`.
    - Bản nháp không chạy so sánh pixel (ảnh chuẩn cần Docker); CI visual xác nhận.
    - `Look`, `Range` và `Preview` của Calendar đã được chụp từ một Storybook chạy tạm (cổng 6012, đã tắt), ở theme sáng và tối, và so bằng mắt với K1. Play function của `Look` và `Open` của DatePicker đo các số của D1 (khung 28/34/40px, nút 24px, popup 278px cách khung 6px).

**Phạm vi:**
- **Không làm ở plan này:**
  - Changeset: Plan D tạo `0.3.0`; Plan C không có changeset.
  - FileUpload, fixtures dùng cả 8 component, docs chung (Plan D).
  - Chọn giờ, ô chọn khoảng hai ô nhập (DateRangePicker), múi giờ, lịch không phải Dương lịch (spec §2, ngoài phạm vi).
  - Các mục để lại ở phát hiện 12.
- **Ảnh chuẩn visual:**
  - Story có ảnh: `Look`, `Range` và `Preview` của Calendar; `Look`, `Open` và `Invalid` của DatePicker. Các story còn lại gắn `no-visual`, kể cả `Controlled` của Calendar (story thao tác thật: bấm "Today" rồi chọn ngày).
  - Mỗi story có 8 ảnh (4 chế độ × sáng, tối), tổng cộng 48 ảnh.
  - Không tạo ảnh trên Windows. Ảnh chuẩn của hai component chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh. Component cũ không đổi, nên ảnh cũ phải giữ nguyên từng byte.

## Global Constraints

- Tên package `h2d-glass-ui` (đổi từ `fl-glass-ui` ở PR #13); chỉ ESM; `exports` gồm `.` và `./styles.css`; `"sideEffects": ["**/*.css"]`.
- `pnpm check:name` fail khi tên cũ xuất hiện lại ngoài `docs/superpowers`. Import trong trang MDX dùng `'h2d-glass-ui'`.
- Cảnh báo dev bắt đầu bằng `[h2d-glass-ui]`: `devWarn` thêm `WARN_PREFIX` của `src/internal/warn.ts` (dựng từ `LIB_NAME`). Test so cả câu cảnh báo thì đọc `WARN_PREFIX`, không viết tay tiền tố.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`). Plan này không thêm dependency.
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-` (không đổi theo tên package). Biến thể và trạng thái dùng data-attribute (`data-size`, `data-invalid`, `data-outside`, `data-range`...).
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS component nằm trong `@layer flg.components`; quy tắc `forced-colors` và `prefers-contrast: more` nằm trong `src/styles/preferences.css`.
- **Mockup lock.** Giá trị token trong `src/styles/theme/values.ts` không đổi, và Plan C không thêm token. Component cũ phải giữ ảnh giống từng byte. Quy tắc `opacity: 1` của ngày tháng khác dưới `prefers-contrast: more` nằm ngoài mockup và chỉ có hiệu lực khi người dùng bật tuỳ chọn (spec §4.4).
- **Ngày là chuỗi ISO** (`'YYYY-MM-DD'`, tháng `'YYYY-MM'`) ở mọi nơi, không bao giờ là `Date` trong API. Mọi định dạng đi qua `src/internal/date.ts` với `timeZone: 'UTC'` (spec §3.3, §3.4).
- Mọi story truyền `today`, để ảnh và kiểm tra không đổi theo ngày chạy (spec §6.4).
- Mọi component dùng `forwardRef`, export kiểu props của nó, và export phẳng.
- Chữ mặc định do lib cung cấp bằng tiếng Anh, ghi đè được qua `labels`. Cảnh báo dev đi qua `devWarn`. Lib không throw khi người dùng dùng sai. Trang docs (`*.mdx`) viết bằng tiếng Anh.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm, **không** push lên `main`, giữ `"private": true`. `main` được bảo vệ: plan kết thúc bằng một PR.
- **Không có changeset ở plan này.** Plan D tạo changeset `0.3.0`.
- **Ngưỡng `size-limit`:**
  - Ngưỡng ban đầu (do Plan B ghi): JS 40586 B, CSS 8309 B.
  - Task 1 không build (phát hiện 1). Task 2 và 3 chạy `pnpm build && pnpm check:package` và pass hoàn toàn. Theo lần chạy nháp: sau Task 2 JS 39.04 kB, CSS 7.82 kB; sau Task 3 JS 39.52 kB, CSS 7.93 kB.
  - Từ Task 4, `pnpm check:package` chỉ fail ở `size`, và chỉ ở JS; các check còn lại pass. Theo lần chạy nháp: sau Task 4 JS 40.8 kB (vượt 213 B), sau Task 5 JS 40.94 kB (vượt 357 B); CSS trong ngưỡng.
  - Chỉ Task 6 chạy `pnpm size:record` và commit `.size-limit.json`. Plan không chép file này: `size:record` tự ghi ngưỡng. Kết quả ở bản nháp: JS 45038 B, CSS 8880 B.
- Trước mọi lệnh `pnpm vitest run --project storybook-*` chạy thẳng, chạy `pnpm gen:theme`. Lần chạy story đầu có thể fail với `Failed to import test file …` khi Vite tối ưu lại; chạy lại.
- **Không chạy cả bộ story một lượt trên máy thiếu bộ nhớ.** Chạy từng thư mục một, như các lệnh trong plan. CI chạy cả bộ. Không chạy hai lượt story cùng lúc.
- **Cổng 5173 và 4173 thuộc các app khác của chủ dự án**: không dùng, không tắt tiến trình đang giữ chúng. **Không chạy thẳng `pnpm test:fixtures`** trên máy này: fixture chạy qua một bản sao tạm của `scripts/test-fixtures.mjs` ở cổng 5174/4175, như Step 4 của Task 6 ghi; xoá bản sao sau khi chạy. Storybook chạy tạm (nếu cần) dùng cổng khác. Không để server hay tiến trình Storybook chạy sót.
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows. Ảnh chuẩn của Calendar và DatePicker đến từ workflow "Update visual baselines" sau khi đẩy nhánh.
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.

**Cách áp patch.**
- Mọi file, kể cả file mới, được đưa dưới dạng patch (`git diff`). Lưu nguyên khối patch vào một file **ngoài** repo (ví dụ `../task.patch`), giữ LF, rồi chạy `git apply ../task.patch` ở gốc repo.
- Nếu `git apply` báo lỗi thì dừng lại và báo cáo: nghĩa là cây đang khác với cây mà plan đã chạy thử.
- Mỗi task có hai khối patch (test rồi code). Áp theo đúng thứ tự trong plan. Khối code của Task 6 được áp làm hai lần (`--include`, rồi `--exclude`), như Step 2 và Step 3 của Task 6 ghi.
- Task 3 sửa các file Calendar mà Task 2 đã tạo (gồm test và story của Task 2). Task 5 sửa các file DatePicker mà Task 4 đã tạo. Task 1 đến 5 cùng sửa spec giai đoạn 3; Task 2, 3, 4 và 6 cùng sửa `preferences.css`; Task 2, 3 và 4 cùng sửa `src/index.ts`. Patch đã tính sẵn điều đó nếu áp đúng thứ tự.
- Plan này không xoá file nào.

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý. Mỗi dòng có test ở task tương ứng:

1. **Gõ `14/11/26` vào DatePicker `vi-VN` trong một form rồi nhấn Enter.** Chữ phải được đọc theo thứ tự ngày, tháng, năm thành `2026-11-14`, viết lại thành `14/11/2026`, và form phải gửi `2026-11-14`, kể cả ở Firefox. Không test nào gõ đúng chuỗi đó; ba phần được kiểm riêng:
   - thứ tự của locale và năm 2 chữ số: Task 1, `parses other locales` và `handles two-digit years`; Task 4, `reads in the order of the locale: vi-VN and de-DE, any separator, two-digit years` (`de-DE` gõ `3 5 26`) và story `Locales`;
   - Enter rồi form gửi: Task 4, `reads the text on Enter, and the form submits unless the text stays` (kể cả `11/14/26` viết lại thành `11/14/2026`) và `writes the hidden input on Enter, before a render, for the form that submits right after`;
   - ba engine: story `InAForm` đọc `FormData` trong listener `submit`, gõ `11/20/2026{Enter}` và thấy `2026-11-20` chứ không phải ngày cũ.
2. **Calendar có `min`/`max`, đi bằng phím tới mép tháng.** Focus không bao giờ ra ngoài `[min, max]`, phím vẫn sang được tháng của `min`, và nút tháng thành `aria-disabled` nhưng giữ focus và chỗ trong thứ tự Tab. Test ở Task 2: `stops at min and at max, and never leaves them`, `crosses into the month of min but not past it`, `changes the month when a key crosses its edge, and the focus follows`, `get aria-disabled when the whole month they lead to is outside min and max`, `stay enabled while any day of the month they lead to is inside the range` và `do nothing at an end, and keep their place in the tab order and their focus`; story `MinMax` và `MonthEdges`.
3. **Chọn khoảng trong một Dialog rồi nhấn Esc.** Esc đầu chỉ bỏ ngày đầu đang chờ (Dialog còn mở, khoảng cũ hiện lại); Esc khi không có gì chờ thì để Dialog đóng. Test ở Task 3: `drops a pending start and is prevented, so a Dialog around it stays open`, `keeps the committed range that a dropped start had replaced`, `is left alone when nothing is pending` và `works from the month buttons too, and runs the handler of the parent first`; story `RangeInADialog` (Esc thứ hai đóng Dialog). Với DatePicker trong Dialog, Esc chỉ đóng lịch: Task 4, `goes back to the input, with the value kept, when the browser closes it on Esc`, story `InADialog`.
4. **Trang render ở server, không truyền `today`.** HTML của Calendar không có tháng hay ngày nào (không lệch giữa server và client); tháng và "hôm nay" hiện sau khi hydrate, và được đọc lại khi trang hiện lại hoặc focus vào. Test ở Task 2: `renders on the server with an empty title, no weekday names and no day buttons`, `takes the machine's month after mount when it has no today either`, `reads the clock after mount without a today prop`, `reads the clock again when the page becomes visible` và `reads the clock again when focus enters the calendar`. Ở Task 4: `renders the text, the hidden value and a closed popup on the server`, `focuses today when it is read from the clock, after the first render` và `opens on today when there is no value, and on a fresh month each time`.
5. **Ngày không đọc được chặn submit.** Form không gửi; ô gõ mang lời báo của nó (bong bóng của trình duyệt, `aria-invalid`, lời dưới khung hoặc trong Field, vùng live); sửa chữ và rời ô thì gửi được. Test ở Task 5: `makes the input custom-invalid with the message, and stops the form submitting`, `stops the form for a date that cannot be chosen, with its message`, `when the text is fixed on Enter, before the form that submits reads the input` và `does not say the same unreadable text again when it is left a second time`; story `BlockedSubmit` (ba engine, rời ô bằng Tab trước khi Submit vì Firefox). Ở Task 4: `reads the text on Enter, and the form submits unless the text stays`.

Một chỗ **chỉ story bắt được**: popup đóng một task sau khi focus rời nó (phát hiện 7). Test jsdom pass cả khi không có bộ hẹn giờ; story `TabOut` fail ở cả ba engine khi thiếu nó.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/internal/date.ts` (và test) | Hàm ngày ISO (Task 1) |
| `src/components/calendar/*`, `src/styles/components/calendar.css` | `Calendar` một ngày (Task 2); chọn khoảng (Task 3) |
| `src/components/date-picker/*`, `src/styles/components/date-picker.css`, `src/styles/components/floating.css` | `DatePicker` (Task 4); lời báo lỗi (Task 5) |
| `src/styles/preferences.css`, `src/styles/index.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts` | Đăng ký, export, forced colors, contrast-more (Task 2, 3, 4, 6) |
| `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md` | Các dòng "phát hiện khi lập Plan C" (Task 1 đến 5) |
| `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `src/docs/ExceptionTable.test.tsx`, spec 0+1 §4.9 | Cặp tương phản, dòng 6 mở rộng, dòng 18 mới (Task 6) |
| `.size-limit.json` | Ngưỡng mới (Task 6) |

---

### Task 1: `date.ts`, các hàm ngày ISO

Spec §3.3, §3.4, §5 (dòng `date.ts`), §7 dòng 1 (hàm thuần, kiểm cạn). Calendar và DatePicker làm mọi phép tính và mọi định dạng ngày qua module này.
- Hàm thuần trên chuỗi ISO. File không có `"use client"`, không import React, không được export từ `src/index.ts`.
- Mọi ngày được dựng qua một hàm `utc()` riêng dùng `setUTCFullYear`, và đọc bằng `getUTC*` (phát hiện 4).
- Các `Intl.DateTimeFormat` được lưu sẵn trong một `Map`, theo locale và options.
- `parseDate` lấy thứ tự ngày, tháng, năm từ `formatToParts` của locale.
- `isIsoMonth` không có trong danh sách export ban đầu của spec §5; dòng `date.ts` của §5 được sửa (phát hiện 3).
- Module do `kilo/reflection/beam-free` viết qua opencode; Claude kiểm tra và dọn lại.
- Không chạy `pnpm build && pnpm check:package` ở task này (phát hiện 1).

**Files:**
- Create: `src/internal/date.ts`, `src/internal/date.test.ts`
- Modify: `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md` (§5, dòng `date.ts`)

**Interfaces:**
- Produces trong `src/internal/date.ts` (thuần, không `"use client"`):
  - `isIsoDate(value: unknown): value is string`: ngày có thật viết `'YYYY-MM-DD'`, năm 0001–9999 (`'2026-02-29'` là `false`).
  - `isIsoMonth(value: unknown): value is string`: `'YYYY-MM'`, năm 0001–9999, tháng 01–12.
  - `parseIso(iso)`: `{ year, month, day }`, hoặc `null` khi `isIsoDate` là `false`.
  - `toIso(year, month, day)`: viết `'YYYY-MM-DD'` có đệm số 0, không kiểm.
  - `addDays(iso, days)`, `addMonths(iso, months)`, `addYears(iso, years)`. `addMonths` kẹp ngày (31/1 cộng một tháng là 28/2 hoặc 29/2); `addYears` là `addMonths` 12 tháng mỗi năm (29/2 cộng một năm là 28/2). Chuỗi không hợp lệ được trả lại nguyên.
  - `compareIso(a, b): -1 | 0 | 1`, cho hai ngày hoặc hai tháng.
  - `clampIso(iso, min?, max?)`: `min` khi `iso` trước nó, rồi `max` khi `iso` sau nó; `min` được kiểm trước.
  - `isSameMonth(a, b)`: cùng năm và tháng; mỗi bên là ngày hoặc tháng.
  - `startOfWeek(iso, weekStartsOn)`, `endOfWeek(iso, weekStartsOn)`; `weekStartsOn` từ 0 (Chủ nhật) đến 6.
  - `monthGrid(month, weekStartsOn)`: 6 hàng × 7 ô `{ date: string; inMonth: boolean }`, từ `startOfWeek` của ngày 1. `month` là `'YYYY-MM'`; một ngày đầy đủ thì dùng tháng của nó.
  - `formatMonthYear(month, locale)`: tên tháng dài và năm (`'November 2026'`).
  - `weekdayNames(locale, weekStartsOn, width: 'short' | 'narrow' | 'long')`: bảy tên thứ, bắt đầu từ `weekStartsOn`.
  - `formatDate(iso, locale, options?)`: mặc định ngày và tháng hai chữ số (`11/14/2026`, `14/11/2026`, `14.11.2026`); `options` thay các trường; luôn UTC.
  - `datePattern(locale)`: placeholder để gõ (`'mm/dd/yyyy'`, `'dd/mm/yyyy'`, `'dd.mm.yyyy'`).
  - `parseDate(text, locale)`: ngày ISO, hoặc `null` khi chữ không phải ngày có thật.
  - `todayIso()`: hôm nay theo giờ máy, `'YYYY-MM-DD'`.
- Consumes: không có.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/internal/date.test.ts b/src/internal/date.test.ts
new file mode 100644
index 0000000..b135693
--- /dev/null
+++ b/src/internal/date.test.ts
@@ -0,0 +1,394 @@
+import { afterEach, describe, expect, it, vi } from 'vitest';
+import {
+  addDays,
+  addMonths,
+  addYears,
+  clampIso,
+  compareIso,
+  datePattern,
+  formatDate,
+  formatMonthYear,
+  isIsoDate,
+  isIsoMonth,
+  isSameMonth,
+  monthGrid,
+  parseDate,
+  parseIso,
+  startOfWeek,
+  endOfWeek,
+  toIso,
+  todayIso,
+  weekdayNames,
+} from './date';
+
+describe('isIsoDate', () => {
+  it('is true for valid dates including leap day and bounds', () => {
+    expect(isIsoDate('2026-11-14')).toBe(true);
+    expect(isIsoDate('2024-02-29')).toBe(true);
+    expect(isIsoDate('0001-01-01')).toBe(true);
+    expect(isIsoDate('9999-12-31')).toBe(true);
+  });
+
+  it('is false for invalid dates, shapes and non-strings', () => {
+    expect(isIsoDate('2026-02-29')).toBe(false);
+    expect(isIsoDate('2026-13-01')).toBe(false);
+    expect(isIsoDate('2026-00-10')).toBe(false);
+    expect(isIsoDate('2026-11-31')).toBe(false);
+    expect(isIsoDate('2026-1-05')).toBe(false);
+    expect(isIsoDate('26-11-14')).toBe(false);
+    expect(isIsoDate('2026-11-14T00:00')).toBe(false);
+    expect(isIsoDate(' 2026-11-14')).toBe(false);
+    expect(isIsoDate('0000-01-01')).toBe(false);
+    expect(isIsoDate(20261114)).toBe(false);
+    expect(isIsoDate(null)).toBe(false);
+    expect(isIsoDate(undefined)).toBe(false);
+  });
+});
+
+describe('isIsoMonth', () => {
+  it('is true for valid months and false otherwise', () => {
+    expect(isIsoMonth('2026-11')).toBe(true);
+    expect(isIsoMonth('0001-01')).toBe(true);
+    expect(isIsoMonth('2026-13')).toBe(false);
+    expect(isIsoMonth('2026-00')).toBe(false);
+    expect(isIsoMonth('2026-1')).toBe(false);
+    expect(isIsoMonth('2026-11-01')).toBe(false);
+    expect(isIsoMonth('0000-05')).toBe(false);
+    expect(isIsoMonth(202611)).toBe(false);
+  });
+});
+
+describe('parseIso', () => {
+  it('returns parts for a valid date and null otherwise', () => {
+    expect(parseIso('2026-11-14')).toEqual({ year: 2026, month: 11, day: 14 });
+    expect(parseIso('2026-02-30')).toBeNull();
+  });
+});
+
+describe('toIso', () => {
+  it('zero-pads the parts', () => {
+    expect(toIso(2026, 1, 5)).toBe('2026-01-05');
+    expect(toIso(5, 1, 2)).toBe('0005-01-02');
+  });
+});
+
+describe('addDays', () => {
+  it('adds and subtracts days across month and year boundaries', () => {
+    expect(addDays('2026-11-14', 1)).toBe('2026-11-15');
+    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
+    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
+    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
+    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
+    expect(addDays('2026-11-14', 0)).toBe('2026-11-14');
+    expect(addDays('2026-11-14', 7)).toBe('2026-11-21');
+    expect(addDays('2026-11-14', -14)).toBe('2026-10-31');
+  });
+
+  it('handles years below 100', () => {
+    expect(addDays('0099-12-31', 1)).toBe('0100-01-01');
+    expect(addDays('0050-03-01', -1)).toBe('0050-02-28');
+  });
+});
+
+describe('addMonths', () => {
+  it('adds months and clamps the day', () => {
+    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
+    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
+    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
+    expect(addMonths('2026-05-31', 1)).toBe('2026-06-30');
+    expect(addMonths('2026-11-14', 2)).toBe('2027-01-14');
+    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15');
+    expect(addMonths('2026-11-14', 0)).toBe('2026-11-14');
+    expect(addMonths('2026-11-14', 24)).toBe('2028-11-14');
+    expect(addMonths('2026-11-14', -13)).toBe('2025-10-14');
+  });
+
+  it('handles years below 100', () => {
+    expect(addMonths('0050-01-31', 1)).toBe('0050-02-28');
+  });
+});
+
+describe('addYears', () => {
+  it('adds years and handles 29 February', () => {
+    expect(addYears('2024-02-29', 1)).toBe('2025-02-28');
+    expect(addYears('2024-02-29', 4)).toBe('2028-02-29');
+    expect(addYears('2026-11-14', -1)).toBe('2025-11-14');
+  });
+});
+
+describe('compareIso', () => {
+  it('compares dates and months', () => {
+    expect(compareIso('2026-11-14', '2026-11-15')).toBe(-1);
+    expect(compareIso('2026-11-14', '2026-11-14')).toBe(0);
+    expect(compareIso('2027-01-01', '2026-12-31')).toBe(1);
+    expect(compareIso('2026-11', '2026-12')).toBe(-1);
+  });
+});
+
+describe('clampIso', () => {
+  it('clamps to min or max, min checked first', () => {
+    expect(clampIso('2026-11-14', '2026-11-20')).toBe('2026-11-20');
+    expect(clampIso('2026-11-14', undefined, '2026-11-10')).toBe('2026-11-10');
+    expect(clampIso('2026-11-14')).toBe('2026-11-14');
+    expect(clampIso('2026-11-14', '2026-11-10', '2026-11-20')).toBe('2026-11-14');
+    expect(clampIso('2026-11-14', '2026-11-20', '2026-11-10')).toBe('2026-11-20');
+  });
+});
+
+describe('isSameMonth', () => {
+  it('compares year and month', () => {
+    expect(isSameMonth('2026-11-01', '2026-11-30')).toBe(true);
+    expect(isSameMonth('2026-11-30', '2026-12-01')).toBe(false);
+    expect(isSameMonth('2026-11', '2026-11-14')).toBe(true);
+    expect(isSameMonth('2025-11-14', '2026-11-14')).toBe(false);
+  });
+});
+
+describe('startOfWeek', () => {
+  it('returns the start of the week', () => {
+    expect(startOfWeek('2026-11-14', 0)).toBe('2026-11-08');
+    expect(startOfWeek('2026-11-14', 1)).toBe('2026-11-09');
+    expect(startOfWeek('2026-11-14', 6)).toBe('2026-11-14');
+    expect(startOfWeek('2026-11-01', 0)).toBe('2026-11-01');
+    expect(startOfWeek('2026-11-01', 1)).toBe('2026-10-26');
+    expect(startOfWeek('2027-01-01', 1)).toBe('2026-12-28');
+  });
+});
+
+describe('endOfWeek', () => {
+  it('returns the end of the week', () => {
+    expect(endOfWeek('2026-11-14', 0)).toBe('2026-11-14');
+    expect(endOfWeek('2026-11-14', 1)).toBe('2026-11-15');
+    expect(endOfWeek('2026-11-14', 6)).toBe('2026-11-20');
+  });
+});
+
+describe('monthGrid', () => {
+  it('has the expected first and last cells for weekStartsOn 0', () => {
+    const grid = monthGrid('2026-11', 0);
+    expect(grid).toHaveLength(6);
+    grid.forEach((row) => expect(row).toHaveLength(7));
+    expect(grid[0]![0]!).toEqual({ date: '2026-11-01', inMonth: true });
+    expect(grid[5]![6]!).toEqual({ date: '2026-12-12', inMonth: false });
+  });
+
+  it('has the expected first and last cells for weekStartsOn 1', () => {
+    const grid = monthGrid('2026-11', 1);
+    expect(grid[0]![0]!).toEqual({ date: '2026-10-26', inMonth: false });
+    expect(grid[0]![6]!).toEqual({ date: '2026-11-01', inMonth: true });
+    expect(grid[5]![6]!).toEqual({ date: '2026-12-06', inMonth: false });
+  });
+
+  it('covers every month 2024-2027 for weekStartsOn 0 and 1', () => {
+    for (let y = 2024; y <= 2027; y++) {
+      for (let m = 1; m <= 12; m++) {
+        for (const ws of [0, 1]) {
+          const month = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}`;
+          const grid = monthGrid(month, ws);
+          expect(grid).toHaveLength(6);
+          grid.forEach((row) => expect(row).toHaveLength(7));
+          const first = grid[0]![0]!.date;
+          const firstParts = first.split('-');
+          const fy = Number(firstParts[0]!);
+          const fm = Number(firstParts[1]!);
+          const fd = Number(firstParts[2]!);
+          expect(new Date(Date.UTC(fy, fm - 1, fd)).getUTCDay()).toBe(ws);
+          const firstOfMonth = `${month}-01`;
+          let foundRow = -1;
+          for (let r = 0; r < 6; r++) {
+            for (let c = 0; c < 7; c++) {
+              if (grid[r]![c]!.date === firstOfMonth) foundRow = r;
+            }
+          }
+          expect(foundRow).toBe(0);
+          const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
+          const inMonthDates = grid
+            .flat()
+            .filter((c) => c.inMonth)
+            .map((c) => c.date);
+          expect(inMonthDates).toHaveLength(n);
+          for (let d = 1; d <= n; d++) {
+            expect(inMonthDates[d - 1]!).toBe(`${month}-${String(d).padStart(2, '0')}`);
+          }
+          // Consecutive days, checked without the helpers under test.
+          const flat = grid.flat().map((c) => c.date);
+          for (let i = 1; i < flat.length; i++) {
+            const [py, pm, pd] = flat[i - 1]!.split('-').map(Number);
+            const next = new Date(Date.UTC(py!, pm! - 1, pd! + 1)).toISOString().slice(0, 10);
+            expect(flat[i]!).toBe(next);
+          }
+        }
+      }
+    }
+  });
+
+  it('uses the month of a full date', () => {
+    expect(monthGrid('2026-11-14', 0)).toEqual(monthGrid('2026-11', 0));
+  });
+});
+
+describe('formatMonthYear', () => {
+  it('formats the month and year', () => {
+    expect(formatMonthYear('2026-11', 'en-US')).toBe('November 2026');
+    expect(formatMonthYear('2026-11', 'de-DE')).toBe('November 2026');
+    expect(formatMonthYear('2026-11', 'vi-VN')).toBe('tháng 11 năm 2026');
+    expect(formatMonthYear('2026-11-14', 'en-US')).toBe('November 2026');
+  });
+});
+
+describe('weekdayNames', () => {
+  it('returns weekday names for the given start', () => {
+    expect(weekdayNames('en-US', 0, 'short')).toEqual([
+      'Sun',
+      'Mon',
+      'Tue',
+      'Wed',
+      'Thu',
+      'Fri',
+      'Sat',
+    ]);
+    expect(weekdayNames('en-US', 1, 'short')).toEqual([
+      'Mon',
+      'Tue',
+      'Wed',
+      'Thu',
+      'Fri',
+      'Sat',
+      'Sun',
+    ]);
+    expect(weekdayNames('en-US', 0, 'narrow')).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
+    expect(weekdayNames('en-US', 1, 'long')).toEqual([
+      'Monday',
+      'Tuesday',
+      'Wednesday',
+      'Thursday',
+      'Friday',
+      'Saturday',
+      'Sunday',
+    ]);
+    expect(weekdayNames('vi-VN', 1, 'short')).toEqual([
+      'Thứ 2',
+      'Thứ 3',
+      'Thứ 4',
+      'Thứ 5',
+      'Thứ 6',
+      'Thứ 7',
+      'CN',
+    ]);
+    expect(weekdayNames('de-DE', 6, 'short')).toEqual(['Sa', 'So', 'Mo', 'Di', 'Mi', 'Do', 'Fr']);
+  });
+});
+
+describe('formatDate', () => {
+  it('uses the default numeric form', () => {
+    expect(formatDate('2026-11-14', 'en-US')).toBe('11/14/2026');
+    expect(formatDate('2026-11-14', 'vi-VN')).toBe('14/11/2026');
+    expect(formatDate('2026-11-14', 'de-DE')).toBe('14.11.2026');
+    expect(formatDate('2026-01-05', 'en-US')).toBe('01/05/2026');
+  });
+
+  it('replaces fields with options', () => {
+    expect(
+      formatDate('2026-11-14', 'en-US', {
+        weekday: 'long',
+        year: 'numeric',
+        month: 'long',
+        day: 'numeric',
+      }),
+    ).toBe('Saturday, November 14, 2026');
+    expect(
+      formatDate('2026-11-14', 'vi-VN', {
+        weekday: 'long',
+        year: 'numeric',
+        month: 'long',
+        day: 'numeric',
+      }),
+    ).toBe('Thứ Bảy, 14 tháng 11, 2026');
+  });
+
+  it('always uses UTC', () => {
+    expect(
+      formatDate('2026-11-14', 'en-US', {
+        year: 'numeric',
+        month: '2-digit',
+        day: '2-digit',
+        timeZone: 'Pacific/Kiritimati',
+      }),
+    ).toBe('11/14/2026');
+    expect(
+      formatDate('2026-11-14', 'en-US', {
+        year: 'numeric',
+        month: '2-digit',
+        day: '2-digit',
+        timeZone: 'America/Los_Angeles',
+      }),
+    ).toBe('11/14/2026');
+  });
+});
+
+describe('datePattern', () => {
+  it('returns the typing placeholder', () => {
+    expect(datePattern('en-US')).toBe('mm/dd/yyyy');
+    expect(datePattern('vi-VN')).toBe('dd/mm/yyyy');
+    expect(datePattern('de-DE')).toBe('dd.mm.yyyy');
+    expect(datePattern('ko-KR')).toBe('yyyy. mm. dd.');
+  });
+});
+
+describe('parseDate', () => {
+  it('parses en-US text in locale order', () => {
+    expect(parseDate('11/14/2026', 'en-US')).toBe('2026-11-14');
+    expect(parseDate('11-14-2026', 'en-US')).toBe('2026-11-14');
+    expect(parseDate('11.14.2026', 'en-US')).toBe('2026-11-14');
+    expect(parseDate(' 11 14 2026 ', 'en-US')).toBe('2026-11-14');
+    expect(parseDate('1/5/2026', 'en-US')).toBe('2026-01-05');
+  });
+
+  it('parses other locales', () => {
+    expect(parseDate('14/11/2026', 'vi-VN')).toBe('2026-11-14');
+    expect(parseDate('14.11.2026', 'de-DE')).toBe('2026-11-14');
+    expect(parseDate('2026. 11. 14.', 'ko-KR')).toBe('2026-11-14');
+  });
+
+  it('handles two-digit years', () => {
+    expect(parseDate('11/14/26', 'en-US')).toBe('2026-11-14');
+    expect(parseDate('1/1/99', 'en-US')).toBe('2099-01-01');
+    expect(parseDate('1/1/00', 'en-US')).toBe('2000-01-01');
+  });
+
+  it('returns null for invalid text', () => {
+    expect(parseDate('2/30/2026', 'en-US')).toBeNull();
+    expect(parseDate('13/01/2026', 'en-US')).toBeNull();
+    expect(parseDate('0/10/2026', 'en-US')).toBeNull();
+    expect(parseDate('11/14', 'en-US')).toBeNull();
+    expect(parseDate('11/14/2026/1', 'en-US')).toBeNull();
+    expect(parseDate('11/14/202', 'en-US')).toBeNull();
+    expect(parseDate('11/14/02026', 'en-US')).toBeNull();
+    expect(parseDate('111/14/2026', 'en-US')).toBeNull();
+    expect(parseDate('11/14/0000', 'en-US')).toBeNull();
+    expect(parseDate('', 'en-US')).toBeNull();
+    expect(parseDate('abc', 'en-US')).toBeNull();
+  });
+
+  it('round trips formatDate output', () => {
+    for (const locale of ['en-US', 'vi-VN', 'de-DE']) {
+      for (const d of ['2026-01-05', '2024-02-29', '2026-12-31']) {
+        expect(parseDate(formatDate(d, locale), locale)).toBe(d);
+      }
+    }
+  });
+});
+
+describe('todayIso', () => {
+  afterEach(() => {
+    vi.useRealTimers();
+  });
+
+  it('reads the local date', () => {
+    vi.useFakeTimers();
+    vi.setSystemTime(new Date(2026, 10, 14, 23, 59));
+    expect(todayIso()).toBe('2026-11-14');
+    vi.setSystemTime(new Date(2026, 0, 1, 0, 0));
+    expect(todayIso()).toBe('2026-01-01');
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit src/internal/date.test.ts
```

Expected: FAIL cả file, nên 31 test không chạy được: `Error: Failed to resolve import "./date" from "src/internal/date.test.ts". Does the file exist?`. Không test nào được thấy fail vì lý do riêng (phát hiện 13). `date.test.ts` là file `.ts`, nên chỉ project `unit` chạy nó: `unit-react18` chỉ nhận `*.test.tsx`.

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
index 42ac95a..573ae01 100644
--- a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
+++ b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
@@ -462,7 +462,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`:
 | File | Export | Nhiệm vụ |
 |---|---|---|
 | `number.ts` | `clamp(value, min, max)`, `decimalsOf(n)`, `snapToStep(value, step, min)`, `stepFrom(value, step, min, direction)`, `formatNumber(value, locale, options?)`, `parseNumber(text, locale, options?)` | Số học an toàn với số thập phân: `snapToStep` làm tròn về lưới `min + k·step` theo số chữ số thập phân lớn nhất của `step` và `min`, nên `0.1 + 0.2` ra `0.3`. `stepFrom` cho giá trị kế tiếp trên lưới theo hướng lên hoặc xuống (từ 7 với bước 5 lên 10, không lên 12). `formatNumber` dùng một `Intl.NumberFormat` lưu sẵn theo `locale` và `options`. `parseNumber` bỏ khoảng trắng (cả NBSP, NNBSP), dấu nhóm của locale, và các phần mà chính formatter đó sinh ra (ký hiệu tiền, `%`, đơn vị, chữ đi kèm); nhận dấu thập phân của locale và dấu trừ `-` hoặc `−`; `style: "percent"` thì chia 100; chữ không đọc được trả `NaN`. Hai hàm nhận `options` để những gì `formatNumber` viết ra thì `parseNumber` đọc lại được (Claude chốt; bản quyết định ban đầu không có `options` ở `parseNumber`) |
-| `date.ts` | `isIsoDate`, `parseIso`, `toIso`, `addDays`, `addMonths`, `addYears`, `compareIso`, `clampIso`, `isSameMonth`, `startOfWeek`, `endOfWeek`, `monthGrid(isoMonth, weekStartsOn)`, `formatMonthYear(isoMonth, locale)`, `weekdayNames(locale, weekStartsOn, width)`, `formatDate(iso, locale, options?)`, `datePattern(locale)`, `parseDate(text, locale)`, `todayIso()` | Hàm thuần trên chuỗi ISO. `addMonths` kẹp ngày: 31/1 cộng một tháng là 28/2 hoặc 29/2. `monthGrid` trả 6 hàng × 7 ô, mỗi ô `{ date, inMonth }`. `weekdayNames` nhận `width` `"short" \| "narrow" \| "long"` (`"long"` thêm cho tên đầy đủ đọc cho screen reader, Claude chốt). `formatDate` mặc định ra dạng số của locale (`11/14/2026`, `14/11/2026`, `14.11.2026`). `datePattern` ra mẫu cho placeholder (`mm/dd/yyyy`). `parseDate` lấy thứ tự ngày, tháng, năm từ `formatToParts` của locale, nhận mọi ký tự không phải chữ số làm dấu ngăn, năm 2 chữ số là 20xx, năm 4 chữ số giữ nguyên; ngày không có thật (31/2) trả `null`. `todayIso` đọc ngày theo giờ máy. Mọi định dạng dùng `timeZone: 'UTC'` (§3.4) |
+| `date.ts` | `isIsoDate`, `isIsoMonth` (kiểm `month` và `defaultMonth` của Calendar; phát hiện khi lập Plan C), `parseIso`, `toIso`, `addDays`, `addMonths`, `addYears`, `compareIso`, `clampIso`, `isSameMonth`, `startOfWeek`, `endOfWeek`, `monthGrid(isoMonth, weekStartsOn)`, `formatMonthYear(isoMonth, locale)`, `weekdayNames(locale, weekStartsOn, width)`, `formatDate(iso, locale, options?)`, `datePattern(locale)`, `parseDate(text, locale)`, `todayIso()` | Hàm thuần trên chuỗi ISO. `addMonths` kẹp ngày: 31/1 cộng một tháng là 28/2 hoặc 29/2. `monthGrid` trả 6 hàng × 7 ô, mỗi ô `{ date, inMonth }`. `weekdayNames` nhận `width` `"short" \| "narrow" \| "long"` (`"long"` thêm cho tên đầy đủ đọc cho screen reader, Claude chốt). `formatDate` mặc định ra dạng số của locale (`11/14/2026`, `14/11/2026`, `14.11.2026`). `datePattern` ra mẫu cho placeholder (`mm/dd/yyyy`). `parseDate` lấy thứ tự ngày, tháng, năm từ `formatToParts` của locale, nhận mọi ký tự không phải chữ số làm dấu ngăn, năm 2 chữ số là 20xx, năm 4 chữ số giữ nguyên; ngày không có thật (31/2) trả `null`. `todayIso` đọc ngày theo giờ máy. Mọi định dạng dùng `timeZone: 'UTC'` (§3.4) |
 | `use-form-reset.ts` | `useFormReset(elementRef, onReset)` | Tách từ Select (Plan A). Tìm `form` của phần tử, nghe `reset`, chờ một task, rồi gọi `onReset` nếu reset không bị huỷ. Select, Slider, NumberInput, Combobox, TagInput, FileUpload và DatePicker dùng nó |
 | `use-announce.ts` | `useAnnounce()` trả `{ announce(text, { delay? }), region }` | Vùng live của §3.6. `region` là element component tự render (có từ lúc mount). `announce` xoá chữ cũ rồi đặt chữ mới ở task sau, để cùng một câu nói lại vẫn được đọc. `delay` gộp các lần gọi liên tiếp (Combobox dùng 500ms khi đang gõ) |
 | `field-context.tsx` (mở rộng) | `useControlError(message)` | Kênh lỗi của §3.2. Trong Field: báo `message` lên Field trong một effect (về `null` khi unmount); Field giữ nó trong state và hiện nó khi người dùng không truyền `error`. Ngoài Field: trả `{ id, message }` để control tự render `<p class="flg-field-error">` và nối `id` vào `aria-describedby` |
diff --git a/src/internal/date.ts b/src/internal/date.ts
new file mode 100644
index 0000000..2295a02
--- /dev/null
+++ b/src/internal/date.ts
@@ -0,0 +1,276 @@
+/** Pure date helpers shared by Calendar and DatePicker (and any future date control). */
+
+const dateTimeCache = new Map<string, Intl.DateTimeFormat>();
+
+function cacheKey(locale: string, options: Intl.DateTimeFormatOptions | undefined): string {
+  return `${locale}\u0001${JSON.stringify(options ?? null)}`;
+}
+
+function getFormatter(locale: string, options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
+  const key = cacheKey(locale, options);
+  let formatter = dateTimeCache.get(key);
+  if (!formatter) {
+    formatter = new Intl.DateTimeFormat(locale, options);
+    dateTimeCache.set(key, formatter);
+  }
+  return formatter;
+}
+
+// The instant of a calendar date at UTC midnight. `Date.UTC(y, …)` would read years 0–99 as
+// 1900–1999, and parsing an ISO string would depend on the engine; `setUTCFullYear` takes the year
+// as written. Every date is handled in UTC, so no time zone or daylight saving shifts a day.
+function utc(year: number, month: number, day: number): number {
+  const date = new Date(0);
+  date.setUTCFullYear(year, month - 1, day);
+  return date.getTime();
+}
+
+// Day 0 of the next month is the last day of this one.
+function daysInMonth(year: number, month: number): number {
+  const date = new Date(0);
+  date.setUTCFullYear(year, month, 0);
+  return date.getUTCDate();
+}
+
+function readDate(instant: number): { year: number; month: number; day: number } {
+  const date = new Date(instant);
+  return {
+    year: date.getUTCFullYear(),
+    month: date.getUTCMonth() + 1,
+    day: date.getUTCDate(),
+  };
+}
+
+// 'YYYY-MM' from a month or a date.
+function isoMonthOf(iso: string): string {
+  return iso.slice(0, 7);
+}
+
+/** A real calendar date written 'YYYY-MM-DD', year 0001–9999 ('2026-02-29' is false). */
+export function isIsoDate(value: unknown): value is string {
+  if (typeof value !== 'string') return false;
+  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
+  const year = Number(value.slice(0, 4));
+  const month = Number(value.slice(5, 7));
+  const day = Number(value.slice(8, 10));
+  if (year < 1 || year > 9999) return false;
+  if (month < 1 || month > 12) return false;
+  if (day < 1 || day > daysInMonth(year, month)) return false;
+  return true;
+}
+
+/** A month written 'YYYY-MM', year 0001–9999, month 01–12. */
+export function isIsoMonth(value: unknown): value is string {
+  if (typeof value !== 'string') return false;
+  if (!/^\d{4}-\d{2}$/.test(value)) return false;
+  const year = Number(value.slice(0, 4));
+  const month = Number(value.slice(5, 7));
+  if (year < 1 || year > 9999) return false;
+  if (month < 1 || month > 12) return false;
+  return true;
+}
+
+/** The parts of a valid ISO date, or null when `isIsoDate` is false. */
+export function parseIso(iso: string): { year: number; month: number; day: number } | null {
+  if (!isIsoDate(iso)) return null;
+  return {
+    year: Number(iso.slice(0, 4)),
+    month: Number(iso.slice(5, 7)),
+    day: Number(iso.slice(8, 10)),
+  };
+}
+
+/** Writes the parts as 'YYYY-MM-DD', zero-padded (year to 4 digits). No validation. */
+export function toIso(year: number, month: number, day: number): string {
+  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
+}
+
+export function addDays(iso: string, days: number): string {
+  const parts = parseIso(iso);
+  if (!parts) return iso;
+  const instant = utc(parts.year, parts.month, parts.day) + days * 86400000;
+  const next = readDate(instant);
+  return toIso(next.year, next.month, next.day);
+}
+
+/** Adds months and keeps the day when it exists; otherwise the last day of the month (31 Jan + 1 → 28/29 Feb). */
+export function addMonths(iso: string, months: number): string {
+  const parts = parseIso(iso);
+  if (!parts) return iso;
+  const total = parts.year * 12 + (parts.month - 1) + months;
+  const newYear = Math.floor(total / 12);
+  const newMonth = (((total % 12) + 12) % 12) + 1;
+  const maxDay = daysInMonth(newYear, newMonth);
+  const newDay = Math.min(parts.day, maxDay);
+  return toIso(newYear, newMonth, newDay);
+}
+
+/** addMonths by 12 × years (29 Feb + 1 year → 28 Feb). */
+export function addYears(iso: string, years: number): string {
+  return addMonths(iso, years * 12);
+}
+
+/** -1, 0 or 1. Works on two dates or on two months. */
+export function compareIso(a: string, b: string): -1 | 0 | 1 {
+  if (a < b) return -1;
+  if (a > b) return 1;
+  return 0;
+}
+
+/** `min` when iso is before it, else `max` when iso is after it, else iso. `min` is checked first. */
+export function clampIso(iso: string, min?: string, max?: string): string {
+  if (min !== undefined && compareIso(iso, min) < 0) return min;
+  if (max !== undefined && compareIso(iso, max) > 0) return max;
+  return iso;
+}
+
+/** Same year and month. Each side may be a date or a month. */
+export function isSameMonth(a: string, b: string): boolean {
+  return isoMonthOf(a) === isoMonthOf(b);
+}
+
+/** The last date on or before iso whose weekday (0 = Sunday … 6 = Saturday) is weekStartsOn. */
+export function startOfWeek(iso: string, weekStartsOn: number): string {
+  const parts = parseIso(iso);
+  if (!parts) return iso;
+  const instant = utc(parts.year, parts.month, parts.day);
+  const weekday = new Date(instant).getUTCDay();
+  const diff = (weekday - weekStartsOn + 7) % 7;
+  return addDays(iso, -diff);
+}
+
+/** startOfWeek + 6 days. */
+export function endOfWeek(iso: string, weekStartsOn: number): string {
+  return addDays(startOfWeek(iso, weekStartsOn), 6);
+}
+
+/** 6 rows × 7 cells from startOfWeek(the 1st of the month); `month` is 'YYYY-MM' (a full date uses its month). */
+export function monthGrid(
+  month: string,
+  weekStartsOn: number,
+): { date: string; inMonth: boolean }[][] {
+  const monthStr = isoMonthOf(month);
+  const monthParts = monthStr.split('-');
+  const year = Number(monthParts[0]!);
+  const monthNum = Number(monthParts[1]!);
+  const firstOfMonth = toIso(year, monthNum, 1);
+  let cursor = startOfWeek(firstOfMonth, weekStartsOn);
+  const rows: { date: string; inMonth: boolean }[][] = [];
+  for (let r = 0; r < 6; r++) {
+    const row: { date: string; inMonth: boolean }[] = [];
+    for (let c = 0; c < 7; c++) {
+      row.push({ date: cursor, inMonth: isoMonthOf(cursor) === monthStr });
+      cursor = addDays(cursor, 1);
+    }
+    rows.push(row);
+  }
+  return rows;
+}
+
+const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
+  year: 'numeric',
+  month: '2-digit',
+  day: '2-digit',
+};
+
+/** The month's long name and year in the locale ('November 2026'). `month` may be a date. */
+export function formatMonthYear(month: string, locale: string): string {
+  const monthStr = isoMonthOf(month);
+  const monthParts = monthStr.split('-');
+  const year = Number(monthParts[0]!);
+  const monthNum = Number(monthParts[1]!);
+  const options: Intl.DateTimeFormatOptions = {
+    month: 'long',
+    year: 'numeric',
+    timeZone: 'UTC',
+  };
+  return getFormatter(locale, options).format(utc(year, monthNum, 1));
+}
+
+/** Seven weekday names starting at weekStartsOn. */
+export function weekdayNames(
+  locale: string,
+  weekStartsOn: number,
+  width: 'short' | 'narrow' | 'long',
+): string[] {
+  const options: Intl.DateTimeFormatOptions = { weekday: width, timeZone: 'UTC' };
+  const formatter = getFormatter(locale, options);
+  const base = utc(2026, 11, 1);
+  const names: string[] = [];
+  for (let i = 0; i < 7; i++) {
+    const dayIndex = (weekStartsOn + i) % 7;
+    names.push(formatter.format(new Date(base + dayIndex * 86400000)));
+  }
+  return names;
+}
+
+/**
+ * The date in the locale. Without options: the locale's numeric form with two-digit day and month
+ * ({ year: 'numeric', month: '2-digit', day: '2-digit' }). Options replace those fields. The time zone
+ * is always UTC, whatever `options.timeZone` says, so the day never shifts.
+ */
+export function formatDate(
+  iso: string,
+  locale: string,
+  options?: Intl.DateTimeFormatOptions,
+): string {
+  const parts = parseIso(iso);
+  if (!parts) return iso;
+  const finalOptions: Intl.DateTimeFormatOptions = {
+    ...(options ?? DEFAULT_DATE_OPTIONS),
+    timeZone: 'UTC',
+  };
+  return getFormatter(locale, finalOptions).format(utc(parts.year, parts.month, parts.day));
+}
+
+/** The placeholder for typing a date: formatDate's default form with yyyy, mm, dd ('mm/dd/yyyy'). */
+export function datePattern(locale: string): string {
+  const formatter = getFormatter(locale, { ...DEFAULT_DATE_OPTIONS, timeZone: 'UTC' });
+  const parts = formatter.formatToParts(utc(2026, 11, 14));
+  return parts
+    .map((part) => {
+      if (part.type === 'year') return 'yyyy';
+      if (part.type === 'month') return 'mm';
+      if (part.type === 'day') return 'dd';
+      return part.value;
+    })
+    .join('');
+}
+
+/** Reads typed text in the locale's day, month, year order; null when it is not a real date. */
+export function parseDate(text: string, locale: string): string | null {
+  const formatter = getFormatter(locale, { ...DEFAULT_DATE_OPTIONS, timeZone: 'UTC' });
+  const order = formatter
+    .formatToParts(utc(2026, 11, 14))
+    .filter((part) => part.type === 'day' || part.type === 'month' || part.type === 'year')
+    .map((part) => part.type);
+
+  const groups = text.match(/\d+/g);
+  if (!groups || groups.length !== 3) return null;
+
+  const values: Record<string, string> = {};
+  order.forEach((type, index) => {
+    values[type] = groups[index]!;
+  });
+
+  const dayStr = values.day;
+  const monthStr = values.month;
+  const yearStr = values.year;
+  if (!dayStr || !monthStr || !yearStr) return null;
+  if (dayStr.length < 1 || dayStr.length > 2) return null;
+  if (monthStr.length < 1 || monthStr.length > 2) return null;
+  if (yearStr.length !== 2 && yearStr.length !== 4) return null;
+
+  const day = Number(dayStr);
+  const month = Number(monthStr);
+  const year = yearStr.length === 2 ? 2000 + Number(yearStr) : Number(yearStr);
+  const iso = toIso(year, month, day);
+  if (!isIsoDate(iso)) return null;
+  return iso;
+}
+
+/** Today on the user's machine (local time, not UTC), as 'YYYY-MM-DD'. */
+export function todayIso(): string {
+  const now = new Date();
+  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
+}
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit src/internal/date.test.ts
```

Expected: 1 file, 31 test PASS. Không chạy `pnpm build && pnpm check:package`: chưa module nào import `date.ts`, nên `check:use-client` sẽ báo `dist/internal/date.js: missing build output.` cho tới Task 2 (phát hiện 1). Không component, CSS hay output nào đổi, nên ảnh chuẩn giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md \
  src/internal/date.test.ts \
  src/internal/date.ts
```
```bash
git commit -m "feat: ISO date helpers for Calendar and DatePicker" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 2: `Calendar`, chọn một ngày (giao diện K1)

Spec §3.3, §3.4, §3.6 (tiêu đề tháng là vùng live; Calendar không dùng `useAnnounce`), §4.3 **Calendar (K1)** trừ **Khoảng**, §4.5 **Calendar**, §5 (dòng `date.ts`, các primitive dùng lại, cảnh báo dev của Calendar), §6.1, §6.3 **`Calendar`** trừ **Chọn khoảng**, §6.4 (Calendar không có `value`, `month` và `today`), §7 dòng 1 đến 3 và test kiểu, §8. Một tháng ngày để chọn một ngày, với các phím của lưới "date picker dialog" của APG.
- **Chỉ chế độ một ngày.** Chưa có prop `mode`; gốc mang `data-mode="single"`. Task 3 thêm `mode` và union của props.
- **Tháng đang hiện** theo đúng thứ tự của spec: `month`, `defaultMonth`, tháng của `value`, tháng của `today`, tháng của đồng hồ máy sau khi mount. Chưa biết tháng (server, render đầu) thì tiêu đề và hàng thứ rỗng, lưới không có hàng ngày. `useControllableState` tên `'Calendar month'` giữ tháng.
- **Tháng theo `value`**: `month` không controlled mà component cha đổi `value` sang tháng khác thì tháng theo, không gọi `onMonthChange` (phát hiện 3 và 5).
- **Hôm nay**: prop `today` khi hợp lệ; nếu không, `todayIso()` trong một effect sau khi mount, đọc lại khi trang hiện lại (`visibilitychange`) và khi focus vào Calendar (§3.4). `aria-current="date"` và viền "hôm nay" chỉ có khi đã biết hôm nay.
- **Cấu trúc và ARIA** như HTML của §6.3: tiêu đề `<div aria-live="polite">` đặt tên cho `role="grid"`; hàng thứ có tên ngắn `aria-hidden` và tên dài trong `flg-visually-hidden`; nút ngày có `aria-label` là ngày đầy đủ của locale; `aria-selected="true"` trên ô của ngày đang chọn, không có `aria-pressed`. Ngày của tháng khác là số `aria-hidden`, không phải nút.
- **Roving tabindex**: một nút ngày có `tabIndex=0`. Mặc định là ngày đang chọn trong tháng đang hiện, rồi hôm nay, rồi ngày đầu chọn được, rồi ngày 1. Phím dời nó; nút tháng đặt lại nó theo quy tắc đó, focus vẫn ở nút.
- **Phím**: ←/→ một ngày, ↑/↓ một tuần, Home/End theo `weekStartsOn`, PageUp/PageDown một tháng, Shift+PageUp/PageDown một năm. Đích được kẹp trong `[min, max]`; sang tháng khác thì đổi tháng (`onMonthChange`) và focus theo. Mọi phím được xử lý đều `preventDefault`; phím có Alt, Ctrl, Meta bị bỏ qua. Enter và Space là `click` của nút.
- **Ngày không chọn được** (`isDateUnavailable`, hoặc ngoài `[min, max]`): `aria-disabled`, vẫn nhận focus, nhấn không làm gì. Nút tháng `aria-disabled` khi cả tháng đích ở ngoài khoảng, và giữ chỗ trong thứ tự Tab (như Pagination).
- **Giao diện K1** (§4.3): rộng 252px, bảy cột 36px, header 34px cách lưới 4px, hàng thứ 26px, ngày tròn 36px. Ngày chọn dùng `--flg-accent-gradient`; hôm nay có viền trong 1px `--flg-accent-solid`; ngày của tháng khác mờ `opacity: .5`; ngày không chọn được `opacity: .45` và gạch ngang. Hover `--flg-control-track` (ngoài mockup, mọi ngày chọn được).
- **Forced colors** (§4.5): ngày chọn `Highlight`/`HighlightText` với `forced-color-adjust: none`; hôm nay viền trong 1px `CanvasText`; ngày không chọn được và ngày của tháng khác `GrayText` (phát hiện 3). Quy tắc `prefers-contrast: more` thuộc Task 6.
- Các lựa chọn khi làm ở phát hiện 5. Spec §4.5 và §6.3 **Tháng đang hiện** được sửa (phát hiện 3).

**Files:**
- Create: `src/components/calendar/Calendar.tsx`, `index.ts`, `Calendar.test.tsx`, `Calendar.test-d.ts`, `Calendar.stories.tsx`, `Calendar.mdx`, `src/styles/components/calendar.css`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md`

**Interfaces:**
- Produces trong `src/components/calendar/Calendar.tsx` (client), export qua `index.ts` và `src/index.ts`:
  - `Calendar`: `forwardRef<HTMLDivElement, CalendarProps>`; `ref` và các prop còn lại lên `<div class="flg-calendar">` gốc.
  - `CalendarLabels`: `{ previousMonth?: string; nextMonth?: string }`, mặc định `"Previous month"`, `"Next month"`.
  - `CalendarProps` (ở task này): `CalendarBaseProps & { value?: string | null; defaultValue?: string; onValueChange?: (value: string) => void }`. `CalendarBaseProps` (không export) là `Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'>` cùng `month`, `defaultMonth`, `onMonthChange(month)`, `min`, `max`, `isDateUnavailable(date)`, `weekStartsOn` (`0 | 1 | 2 | 3 | 4 | 5 | 6`, mặc định 0), `locale` (mặc định `'en-US'`), `today`, `labels`.
  - Class: `flg-calendar`, `flg-calendar-header`, `flg-calendar-title`, `flg-calendar-grid`, `flg-calendar-weekday`, `flg-calendar-cell`, `flg-calendar-day`.
  - Hook DOM: `data-mode` trên gốc; `data-date="YYYY-MM-DD"` trên nút ngày và trên số của tháng khác; `data-today` trên nút của hôm nay; `data-outside` trên số của tháng khác; `aria-selected="true"` trên ô (`td`) của ngày chọn. Task 3 thêm `data-chosen`, `data-range`, `data-preview`; Task 4 tìm nút ngày bằng `button[data-date]`.
  - Cảnh báo dev: `Calendar: <prop> "<x>" is not a date written YYYY-MM-DD; it is ignored.` (hoặc `a month written YYYY-MM` cho `month`, `defaultMonth`); `Calendar: min (<min>) is after max (<max>); both are ignored.`; chuyển controlled/uncontrolled với tên `Calendar value` và `Calendar month`.
- Consumes: mọi hàm của `date.ts` mà Calendar cần (Task 1), `IconButton`, `ChevronIcon`, `useControllableState`, `useIsoLayoutEffect`, `hasModifier`, `mergeRefs`, `composeEventHandlers`, `devWarn`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/calendar/Calendar.stories.tsx b/src/components/calendar/Calendar.stories.tsx
new file mode 100644
index 0000000..4c7a11a
--- /dev/null
+++ b/src/components/calendar/Calendar.stories.tsx
@@ -0,0 +1,357 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { useState } from 'react';
+import { expect, fn, userEvent, waitFor } from 'storybook/test';
+import { realUserEvent } from '../../../.storybook/real-input';
+import { Button } from '../button/Button';
+import { Card } from '../card/Card';
+import { Calendar } from './Calendar';
+import type { CalendarProps } from './Calendar';
+
+const meta = {
+  title: 'Components/Calendar',
+  component: Calendar,
+  // Every story passes `today`: without it the calendar reads the clock, and the images and the
+  // checks below would change with the day they run.
+  args: { today: '2026-11-04', onValueChange: fn(), onMonthChange: fn() },
+} satisfies Meta<typeof Calendar>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+/** The day button or the outside-day number of an ISO date. */
+const dayOf = (root: HTMLElement, iso: string) =>
+  root.querySelector(`[data-date="${iso}"]`) as HTMLElement;
+
+const title = (root: HTMLElement) => root.querySelector('.flg-calendar-title') as HTMLElement;
+
+/** The two days that the mockup (K1) draws as "fully booked". */
+const booked = (date: string) => date === '2026-11-09' || date === '2026-11-10';
+
+/**
+ * The calendar of the mockup (K1): November 2026, today the 4th, the 14th chosen, two booked days,
+ * and `min` greying the first days. Beside it the same month in vi-VN with the week from Monday.
+ */
+export const Look: Story = {
+  render: (args) => (
+    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
+      <Card style={{ padding: 16 }}>
+        <Calendar
+          {...args}
+          defaultValue="2026-11-14"
+          min="2026-11-03"
+          isDateUnavailable={booked}
+          aria-label="November 2026"
+        />
+      </Card>
+      <Card style={{ padding: 16 }}>
+        <Calendar
+          {...args}
+          locale="vi-VN"
+          weekStartsOn={1}
+          defaultValue="2026-11-14"
+          min="2026-11-03"
+          isDateUnavailable={booked}
+          labels={{ previousMonth: 'Tháng trước', nextMonth: 'Tháng sau' }}
+          aria-label="Tháng 11 năm 2026"
+        />
+      </Card>
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const [english, vietnamese] = Array.from(
+      canvasElement.querySelectorAll<HTMLElement>('.flg-calendar'),
+    ) as [HTMLElement, HTMLElement];
+    const box = (el: Element) => el.getBoundingClientRect();
+    // 252px wide, a 34px header 4px above the grid, a 26px weekday row, 36px days.
+    await expect(box(english).width).toBe(252);
+    const header = english.querySelector('.flg-calendar-header') as HTMLElement;
+    const grid = english.querySelector('.flg-calendar-grid') as HTMLElement;
+    await expect(box(header).height).toBe(34);
+    await expect(box(grid).top - box(header).bottom).toBe(4);
+    await expect(box(english.querySelector('th') as Element).height).toBe(26);
+    await expect(box(dayOf(english, '2026-11-14')).width).toBe(36);
+    await expect(box(dayOf(english, '2026-11-14')).height).toBe(36);
+    await expect(
+      box(dayOf(english, '2026-11-14')).left - box(dayOf(english, '2026-11-13')).left,
+    ).toBe(36);
+    // The month buttons are 28px, 4px apart, with a 16px chevron.
+    const [previous, next] = Array.from(header.querySelectorAll<HTMLElement>('button')) as [
+      HTMLElement,
+      HTMLElement,
+    ];
+    await expect(box(previous).width).toBe(28);
+    await expect(box(next).left - box(previous).right).toBe(4);
+    await expect(box(previous.querySelector('svg') as Element).width).toBe(16);
+    await expect(title(english)).toHaveTextContent('November 2026');
+    await expect(getComputedStyle(title(english)).fontWeight).toBe('600');
+    // The chosen day wears the accent gradient and no edge; today has the accent edge.
+    const chosen = getComputedStyle(dayOf(english, '2026-11-14'));
+    await expect(chosen.backgroundImage).toContain('gradient');
+    await expect(chosen.boxShadow).toBe('none');
+    await expect(chosen.fontWeight).toBe('600');
+    await expect(getComputedStyle(dayOf(english, '2026-11-04')).boxShadow).toContain('inset');
+    await expect(dayOf(english, '2026-11-04')).toHaveAttribute('aria-current', 'date');
+    // Booked and too early days are struck through at .45; the next month's days are numbers at .5.
+    for (const date of ['2026-11-09', '2026-11-02']) {
+      const style = getComputedStyle(dayOf(english, date));
+      await expect(style.textDecorationLine).toBe('line-through');
+      await expect(style.opacity).toBe('0.45');
+      await expect(style.cursor).toBe('not-allowed');
+    }
+    await expect(getComputedStyle(dayOf(english, '2026-12-01')).opacity).toBe('0.5');
+    // The Vietnamese calendar: the week starts on Monday and its words are Vietnamese.
+    await expect(title(vietnamese)).toHaveTextContent(/11/);
+    await expect(title(vietnamese).textContent).not.toBe('November 2026');
+    await expect(vietnamese.querySelector('td > [data-date]')).toHaveAttribute(
+      'data-date',
+      '2026-10-26',
+    );
+    await expect(vietnamese.querySelector('button[aria-label="Tháng trước"]')).not.toBeNull();
+  },
+};
+
+/** An uncontrolled calendar with the tab stop on the chosen day, as the keys below expect. */
+const keyArgs = { defaultValue: '2026-11-11', 'aria-label': 'Date' } as const;
+
+/**
+ * Tabs from the page to the day with the tab stop, past the two month buttons. The number of presses
+ * is not fixed: Firefox spends one on its way in, so it stops where the focus is on the day.
+ */
+async function tabToGrid(real: NonNullable<Awaited<ReturnType<typeof realUserEvent>>>) {
+  for (let presses = 0; presses < 6; presses += 1) {
+    await real.tab();
+    if (document.activeElement?.matches('button[data-date]')) return;
+  }
+}
+
+/** Every key of the grid on a real keyboard, on one month. */
+export const Keys: Story = {
+  tags: ['no-visual'],
+  args: keyArgs,
+  render: (args) => <Calendar {...args} />,
+  play: async ({ canvasElement, args }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
+    await tabToGrid(real);
+    await expect(dayOf(root, '2026-11-11')).toHaveFocus();
+    // The ring shows for the keyboard.
+    await expect(getComputedStyle(dayOf(root, '2026-11-11')).outlineStyle).toBe('solid');
+    const steps: Array<[string, string]> = [
+      ['{ArrowRight}', '2026-11-12'],
+      ['{ArrowLeft}', '2026-11-11'],
+      ['{ArrowDown}', '2026-11-18'],
+      ['{ArrowUp}', '2026-11-11'],
+      ['{Home}', '2026-11-08'],
+      ['{End}', '2026-11-14'],
+    ];
+    for (const [key, date] of steps) {
+      await real.keyboard(key);
+      await expect(dayOf(root, date)).toHaveFocus();
+    }
+    // One tab stop follows the focus.
+    await expect(root.querySelectorAll('button[data-date][tabindex="0"]')).toHaveLength(1);
+    await expect(dayOf(root, '2026-11-14')).toHaveAttribute('tabindex', '0');
+    // Enter and Space choose the focused day.
+    await real.keyboard('{Enter}');
+    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-11-14');
+    await expect(dayOf(root, '2026-11-14').closest('td')).toHaveAttribute('aria-selected', 'true');
+    await real.keyboard('{ArrowLeft} ');
+    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-11-13');
+    // No key moved the month.
+    await expect(args.onMonthChange).not.toHaveBeenCalled();
+    // Alt+→ is the browser's, not the calendar's.
+    await real.keyboard('{Alt>}{ArrowRight}{/Alt}');
+    await expect(dayOf(root, '2026-11-13')).toHaveFocus();
+  },
+};
+
+/** The keys that cross the edge of the month and the year, and stop at `min` and `max`. */
+export const MonthEdges: Story = {
+  tags: ['no-visual'],
+  args: { defaultValue: '2026-11-30', 'aria-label': 'Date' },
+  render: (args) => <Calendar {...args} />,
+  play: async ({ canvasElement, args }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
+    await tabToGrid(real);
+    await expect(dayOf(root, '2026-11-30')).toHaveFocus();
+    // → past the end of November: December, and the focus follows to the 1st.
+    await real.keyboard('{ArrowRight}');
+    await expect(title(root)).toHaveTextContent('December 2026');
+    await expect(dayOf(root, '2026-12-01')).toHaveFocus();
+    await expect(args.onMonthChange).toHaveBeenLastCalledWith('2026-12');
+    await real.keyboard('{ArrowLeft}');
+    await expect(title(root)).toHaveTextContent('November 2026');
+    await expect(dayOf(root, '2026-11-30')).toHaveFocus();
+    // PageDown keeps the day or takes the last one of a shorter month.
+    await real.keyboard('{PageDown}{PageDown}{PageDown}');
+    await expect(title(root)).toHaveTextContent('February 2027');
+    await expect(dayOf(root, '2027-02-28')).toHaveFocus();
+    // Shift+PageUp is a year back, across the new year.
+    await real.keyboard('{Shift>}{PageUp}{/Shift}');
+    await expect(title(root)).toHaveTextContent('February 2026');
+    await expect(dayOf(root, '2026-02-28')).toHaveFocus();
+    await real.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}');
+    await expect(title(root)).toHaveTextContent('January 2026');
+    await expect(dayOf(root, '2026-01-31')).toHaveFocus();
+  },
+};
+
+/** The focus never leaves `[min, max]`: a key stops at the edge, and the buttons say so. */
+export const MinMax: Story = {
+  tags: ['no-visual'],
+  args: {
+    defaultValue: '2026-11-06',
+    min: '2026-11-05',
+    max: '2026-12-04',
+    'aria-label': 'Date',
+  },
+  render: (args) => <Calendar {...args} />,
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
+    const buttons = Array.from(root.querySelectorAll<HTMLElement>('.flg-calendar-header button'));
+    const [previous, next] = buttons as [HTMLElement, HTMLElement];
+    // November holds days inside the range, and so does December: only October is out.
+    await expect(previous).toHaveAttribute('aria-disabled', 'true');
+    await expect(next).not.toHaveAttribute('aria-disabled');
+    await tabToGrid(real);
+    await real.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');
+    await expect(dayOf(root, '2026-11-05')).toHaveFocus();
+    await real.keyboard('{PageUp}');
+    await expect(dayOf(root, '2026-11-05')).toHaveFocus();
+    await expect(title(root)).toHaveTextContent('November 2026');
+    // PageDown reaches December 5, past max, so it stops on the 4th.
+    await real.keyboard('{PageDown}');
+    await expect(title(root)).toHaveTextContent('December 2026');
+    await expect(dayOf(root, '2026-12-04')).toHaveFocus();
+    await real.keyboard('{ArrowRight}{ArrowDown}{End}');
+    await expect(dayOf(root, '2026-12-04')).toHaveFocus();
+    // The 5th is shown, and it cannot be chosen.
+    await expect(dayOf(root, '2026-12-05')).toHaveAttribute('aria-disabled', 'true');
+    await expect(next).toHaveAttribute('aria-disabled', 'true');
+    await expect(previous).not.toHaveAttribute('aria-disabled');
+  },
+};
+
+/**
+ * The month buttons: a real press changes the month, and at an end the button does nothing but keeps
+ * the focus. WebKit does not focus a button that is pressed, so the focus is put there as a keyboard
+ * user has it, and the end is reached with Enter.
+ */
+export const MonthButtons: Story = {
+  tags: ['no-visual'],
+  args: { defaultValue: '2026-11-14', max: '2026-12-31', 'aria-label': 'Date' },
+  render: (args) => <Calendar {...args} />,
+  play: async ({ canvasElement, args }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
+    const [previous, next] = Array.from(
+      root.querySelectorAll<HTMLElement>('.flg-calendar-header button'),
+    ) as [HTMLElement, HTMLElement];
+    await real.click(next);
+    await expect(title(root)).toHaveTextContent('December 2026');
+    await expect(args.onMonthChange).toHaveBeenLastCalledWith('2026-12');
+    // The tab stop is the first day of the new month, as nothing there is chosen or today.
+    await expect(dayOf(root, '2026-12-01')).toHaveAttribute('tabindex', '0');
+    // December is the last month: the button says so, keeps the focus, and does nothing.
+    await expect(next).toHaveAttribute('aria-disabled', 'true');
+    next.focus();
+    await real.keyboard('{Enter}{Enter}');
+    await expect(title(root)).toHaveTextContent('December 2026');
+    await expect(args.onMonthChange).toHaveBeenCalledTimes(1);
+    await expect(next).toHaveFocus();
+    // Back: the tab stop returns to the chosen day.
+    await real.click(previous);
+    await expect(title(root)).toHaveTextContent('November 2026');
+    await expect(dayOf(root, '2026-11-14')).toHaveAttribute('tabindex', '0');
+    previous.focus();
+    await real.keyboard(' ');
+    await expect(title(root)).toHaveTextContent('October 2026');
+    await expect(previous).toHaveFocus();
+  },
+};
+
+/** The pointer: a day is chosen by a press; a booked day, an early day and another month's day are not. */
+export const Pointer: Story = {
+  tags: ['no-visual'],
+  args: { isDateUnavailable: booked, min: '2026-11-03', 'aria-label': 'Date' },
+  render: (args) => <Calendar {...args} />,
+  play: async ({ canvasElement, args }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
+    const day = dayOf(root, '2026-11-18');
+    const transparent = 'rgba(0, 0, 0, 0)';
+    await real.hover(day);
+    await waitFor(() => expect(getComputedStyle(day).backgroundColor).not.toBe(transparent));
+    await real.click(day);
+    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
+    await expect(args.onValueChange).toHaveBeenCalledWith('2026-11-18');
+    await expect(day.closest('td')).toHaveAttribute('aria-selected', 'true');
+    // A booked day, a day before min, and a number from December do nothing. The browser's own
+    // click would wait for an enabled element; these are `aria-disabled`, so a plain click is sent.
+    await userEvent.click(dayOf(root, '2026-11-09'));
+    await userEvent.click(dayOf(root, '2026-11-02'));
+    await userEvent.click(dayOf(root, '2026-12-01'));
+    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
+    await expect(title(root)).toHaveTextContent('November 2026');
+    await expect(day.closest('td')).toHaveAttribute('aria-selected', 'true');
+    // The same day again is not a change, and a booked day shows no hover.
+    await real.click(day);
+    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
+    await real.hover(dayOf(root, '2026-11-09'));
+    await expect(getComputedStyle(dayOf(root, '2026-11-09')).backgroundColor).toBe(transparent);
+  },
+};
+
+function ControlledDemo({ args }: { args: CalendarProps }) {
+  const [value, setValue] = useState<string | null>(null);
+  return (
+    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
+      <Button variant="secondary" onClick={() => setValue('2026-11-04')}>
+        Today
+      </Button>
+      <Card style={{ padding: 16 }}>
+        <Calendar
+          {...args}
+          value={value}
+          onValueChange={(next) => {
+            args.onValueChange?.(next);
+            setValue(next);
+          }}
+        />
+      </Card>
+      <output>{value ?? 'No date'}</output>
+    </div>
+  );
+}
+
+/**
+ * A controlled calendar whose value is also set from outside: the button chooses today in November,
+ * and the calendar, showing December, goes to that month. The parent's change is not reported.
+ */
+export const Controlled: Story = {
+  tags: ['no-visual'],
+  args: { defaultMonth: '2026-12', 'aria-label': 'Date' },
+  render: (args) => <ControlledDemo args={args} />,
+  play: async ({ canvas, canvasElement, args }) => {
+    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
+    await expect(title(root)).toHaveTextContent('December 2026');
+    await expect(canvas.getByRole('status')).toHaveTextContent('No date');
+    canvas.getByRole('button', { name: 'Today' }).click();
+    await waitFor(() => expect(title(root)).toHaveTextContent('November 2026'));
+    await expect(dayOf(root, '2026-11-04').closest('td')).toHaveAttribute('aria-selected', 'true');
+    await expect(canvas.getByRole('status')).toHaveTextContent('2026-11-04');
+    await expect(args.onValueChange).not.toHaveBeenCalled();
+    await expect(args.onMonthChange).not.toHaveBeenCalled();
+    // A press on a day goes through the parent, which holds the value.
+    dayOf(root, '2026-11-20').click();
+    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('2026-11-20'));
+    await expect(args.onValueChange).toHaveBeenCalledWith('2026-11-20');
+  },
+};
diff --git a/src/components/calendar/Calendar.test-d.ts b/src/components/calendar/Calendar.test-d.ts
new file mode 100644
index 0000000..d4a5b3d
--- /dev/null
+++ b/src/components/calendar/Calendar.test-d.ts
@@ -0,0 +1,31 @@
+import { expectTypeOf, test } from 'vitest';
+import { Calendar } from './Calendar';
+import type { CalendarProps } from './Calendar';
+
+test('Calendar value takes null, so a controlled calendar can have no date', () => {
+  expectTypeOf<CalendarProps['value']>().toEqualTypeOf<string | null | undefined>();
+  Calendar({ value: null });
+  Calendar({ value: '2026-11-14', onValueChange: (value) => expectTypeOf(value).toBeString() });
+  Calendar({ defaultValue: '2026-11-14' });
+});
+
+test('Calendar defaultValue does not take null, and onValueChange always gets a date', () => {
+  // @ts-expect-error null is "no value" only for a controlled calendar.
+  Calendar({ defaultValue: null });
+  expectTypeOf<NonNullable<CalendarProps['onValueChange']>>().parameter(0).toBeString();
+});
+
+test('Calendar weekStartsOn rejects a day that is not 0 to 6', () => {
+  Calendar({ weekStartsOn: 0 });
+  Calendar({ weekStartsOn: 6 });
+  // @ts-expect-error the week has days 0 (Sunday) to 6 (Saturday).
+  Calendar({ weekStartsOn: 7 });
+});
+
+test('Calendar months and dates are strings, never a Date', () => {
+  // @ts-expect-error an ISO string, not a Date.
+  Calendar({ value: new Date() });
+  // @ts-expect-error an ISO month, not a Date.
+  Calendar({ month: new Date() });
+  Calendar({ min: '2026-01-01', max: '2026-12-31', today: '2026-11-04', month: '2026-11' });
+});
diff --git a/src/components/calendar/Calendar.test.tsx b/src/components/calendar/Calendar.test.tsx
new file mode 100644
index 0000000..6583d8e
--- /dev/null
+++ b/src/components/calendar/Calendar.test.tsx
@@ -0,0 +1,829 @@
+import { act, fireEvent, render, screen } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { createRef, useState } from 'react';
+import { renderToString } from 'react-dom/server';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { formatDate, formatMonthYear } from '../../internal/date';
+import { resetDevWarnings } from '../../internal/warn';
+import { Calendar } from './Calendar';
+import type { CalendarProps } from './Calendar';
+
+const day = (iso: string) => document.querySelector(`[data-date="${iso}"]`) as HTMLElement;
+const dayButtons = () => Array.from(document.querySelectorAll<HTMLElement>('button[data-date]'));
+const title = () => document.querySelector('.flg-calendar-title') as HTMLElement;
+const previous = () => screen.getByRole('button', { name: 'Previous month' });
+const next = () => screen.getByRole('button', { name: 'Next month' });
+const tabStop = () => dayButtons().filter((button) => button.tabIndex === 0);
+
+/** A Calendar on a fixed "today", so no test depends on the day it runs. */
+function Cal(props: CalendarProps) {
+  return <Calendar today="2026-11-04" {...props} />;
+}
+
+function Controlled(props: { onValueChange?: (value: string) => void }) {
+  const [value, setValue] = useState<string | null>(null);
+  return (
+    <>
+      <button type="button" onClick={() => setValue('2027-02-03')}>
+        Pick
+      </button>
+      <Cal
+        value={value}
+        onValueChange={(next) => {
+          props.onValueChange?.(next);
+          setValue(next);
+        }}
+      />
+    </>
+  );
+}
+
+describe('Calendar', () => {
+  beforeEach(() => resetDevWarnings());
+  afterEach(() => {
+    vi.useRealTimers();
+    vi.restoreAllMocks();
+  });
+
+  describe('the month it shows', () => {
+    it('takes month before everything else', () => {
+      render(<Cal month="2027-03" defaultMonth="2026-05" value="2026-08-10" />);
+      expect(title()).toHaveTextContent('March 2027');
+    });
+
+    it('takes defaultMonth before the month of the value', () => {
+      render(<Cal defaultMonth="2026-05" value="2026-08-10" />);
+      expect(title()).toHaveTextContent('May 2026');
+    });
+
+    it('takes the month of value before the month of today', () => {
+      render(<Cal value="2026-08-10" />);
+      expect(title()).toHaveTextContent('August 2026');
+    });
+
+    it('takes the month of defaultValue too', () => {
+      render(<Cal defaultValue="2026-09-30" />);
+      expect(title()).toHaveTextContent('September 2026');
+    });
+
+    it('takes the month of today when it has nothing else', () => {
+      render(<Cal />);
+      expect(title()).toHaveTextContent('November 2026');
+    });
+
+    it("takes the machine's month after mount when it has no today either", () => {
+      vi.useFakeTimers({ toFake: ['Date'] });
+      vi.setSystemTime(new Date(2026, 11, 10, 12));
+      render(<Calendar />);
+      expect(title()).toHaveTextContent('December 2026');
+      expect(day('2026-12-10')).toHaveAttribute('aria-current', 'date');
+    });
+
+    it('renders on the server with an empty title, no weekday names and no day buttons', () => {
+      const doc = new DOMParser().parseFromString(renderToString(<Calendar />), 'text/html');
+      expect(doc.querySelector('.flg-calendar-title')?.textContent).toBe('');
+      expect(doc.querySelectorAll('th')).toHaveLength(0);
+      expect(doc.querySelectorAll('button[data-date]')).toHaveLength(0);
+      expect(doc.querySelectorAll('td')).toHaveLength(0);
+      // The live region is there from the first byte, so a later month is read out.
+      expect(doc.querySelector('.flg-calendar-title')?.getAttribute('aria-live')).toBe('polite');
+    });
+
+    it('renders the month on the server when it is told which', () => {
+      const doc = new DOMParser().parseFromString(
+        renderToString(<Calendar month="2026-11" />),
+        'text/html',
+      );
+      expect(doc.querySelector('.flg-calendar-title')?.textContent).toBe('November 2026');
+      expect(doc.querySelectorAll('button[data-date]')).toHaveLength(30);
+      expect(doc.querySelector('[aria-current]')).toBeNull();
+    });
+
+    it('follows a controlled value that moves to another month while month is uncontrolled', () => {
+      render(<Controlled />);
+      expect(title()).toHaveTextContent('November 2026');
+      // Once the user has moved the month it is held in state, and the value must still win.
+      fireEvent.click(next());
+      expect(title()).toHaveTextContent('December 2026');
+      fireEvent.click(screen.getByRole('button', { name: 'Pick' }));
+      expect(title()).toHaveTextContent('February 2027');
+      expect(day('2027-02-03')).toHaveAttribute('tabindex', '0');
+    });
+
+    it('does not report the month that followed the value', () => {
+      const onMonthChange = vi.fn();
+      const { rerender } = render(<Cal value="2026-11-10" onMonthChange={onMonthChange} />);
+      rerender(<Cal value="2027-02-03" onMonthChange={onMonthChange} />);
+      expect(title()).toHaveTextContent('February 2027');
+      expect(onMonthChange).not.toHaveBeenCalled();
+    });
+
+    it('does not pull the month back to the value once the user has moved away', () => {
+      const { rerender } = render(<Cal value="2026-11-10" />);
+      fireEvent.click(next());
+      rerender(<Cal value="2026-11-10" />);
+      expect(title()).toHaveTextContent('December 2026');
+    });
+
+    it('keeps a controlled month where the parent put it', () => {
+      const onMonthChange = vi.fn();
+      const { rerender } = render(<Cal month="2026-11" onMonthChange={onMonthChange} />);
+      fireEvent.click(next());
+      expect(onMonthChange).toHaveBeenCalledWith('2026-12');
+      expect(title()).toHaveTextContent('November 2026');
+      rerender(<Cal month="2027-06" onMonthChange={onMonthChange} />);
+      expect(title()).toHaveTextContent('June 2027');
+      // A controlled month does not follow the value: the parent owns both.
+      rerender(<Cal month="2027-06" value="2026-01-01" onMonthChange={onMonthChange} />);
+      expect(title()).toHaveTextContent('June 2027');
+    });
+  });
+
+  describe('today', () => {
+    it('marks today with aria-current once it is known, and no other day', () => {
+      render(<Cal />);
+      const marked = document.querySelectorAll('[aria-current]');
+      expect(marked).toHaveLength(1);
+      expect(marked[0]).toBe(day('2026-11-04'));
+      expect(marked[0]).toHaveAttribute('aria-current', 'date');
+    });
+
+    it('marks nothing when today is not in the month shown', () => {
+      render(<Cal defaultMonth="2026-12" />);
+      expect(document.querySelector('[aria-current]')).toBeNull();
+    });
+
+    it('lets the today prop win over the clock', () => {
+      vi.useFakeTimers({ toFake: ['Date'] });
+      vi.setSystemTime(new Date(2026, 10, 20, 12));
+      render(<Cal today="2026-11-04" />);
+      expect(day('2026-11-04')).toHaveAttribute('aria-current', 'date');
+      expect(day('2026-11-20')).not.toHaveAttribute('aria-current');
+    });
+
+    it('reads the clock after mount without a today prop', () => {
+      vi.useFakeTimers({ toFake: ['Date'] });
+      vi.setSystemTime(new Date(2026, 10, 20, 12));
+      render(<Calendar />);
+      expect(day('2026-11-20')).toHaveAttribute('aria-current', 'date');
+    });
+
+    it('reads the clock again when the page becomes visible', () => {
+      vi.useFakeTimers({ toFake: ['Date'] });
+      vi.setSystemTime(new Date(2026, 10, 20, 23, 59));
+      render(<Calendar />);
+      expect(day('2026-11-20')).toHaveAttribute('aria-current', 'date');
+      vi.setSystemTime(new Date(2026, 10, 21, 0, 1));
+      const visibility = vi.spyOn(document, 'visibilityState', 'get');
+      visibility.mockReturnValue('hidden');
+      act(() => {
+        document.dispatchEvent(new Event('visibilitychange'));
+      });
+      expect(day('2026-11-20')).toHaveAttribute('aria-current', 'date');
+      visibility.mockReturnValue('visible');
+      act(() => {
+        document.dispatchEvent(new Event('visibilitychange'));
+      });
+      expect(day('2026-11-21')).toHaveAttribute('aria-current', 'date');
+      expect(day('2026-11-20')).not.toHaveAttribute('aria-current');
+    });
+
+    it('reads the clock again when focus enters the calendar', () => {
+      vi.useFakeTimers({ toFake: ['Date'] });
+      vi.setSystemTime(new Date(2026, 10, 20, 23, 59));
+      render(<Calendar />);
+      vi.setSystemTime(new Date(2026, 10, 21, 0, 1));
+      fireEvent.focusIn(day('2026-11-05'));
+      expect(day('2026-11-21')).toHaveAttribute('aria-current', 'date');
+    });
+
+    it('does not read the clock when it has a today prop', () => {
+      vi.useFakeTimers({ toFake: ['Date'] });
+      vi.setSystemTime(new Date(2026, 10, 20, 12));
+      render(<Cal today="2026-11-04" />);
+      vi.setSystemTime(new Date(2026, 10, 21, 12));
+      fireEvent.focusIn(day('2026-11-05'));
+      expect(day('2026-11-04')).toHaveAttribute('aria-current', 'date');
+    });
+
+    it('stops listening to the page when it unmounts', () => {
+      const remove = vi.spyOn(document, 'removeEventListener');
+      const { unmount } = render(<Calendar />);
+      unmount();
+      expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
+    });
+  });
+
+  describe('structure and ARIA', () => {
+    it('renders a root div with the mode, the class, the ref and the rest props', () => {
+      const ref = createRef<HTMLDivElement>();
+      const { container } = render(
+        <Calendar
+          ref={ref}
+          today="2026-11-04"
+          className="mine"
+          data-testid="cal"
+          id="c"
+          aria-label="Pick a date"
+        />,
+      );
+      const root = container.firstElementChild as HTMLElement;
+      expect(ref.current).toBe(root);
+      expect(root.tagName).toBe('DIV');
+      expect(root).toHaveClass('flg-calendar', 'mine');
+      expect(root).toHaveAttribute('data-mode', 'single');
+      expect(root).toHaveAttribute('data-testid', 'cal');
+      expect(root).toHaveAttribute('id', 'c');
+      expect(root).toHaveAttribute('aria-label', 'Pick a date');
+    });
+
+    it('names the grid by the title, which is a polite live region and not a heading', () => {
+      render(<Cal />);
+      const grid = screen.getByRole('grid', { name: 'November 2026' });
+      expect(grid.tagName).toBe('TABLE');
+      expect(grid).toHaveAttribute('aria-labelledby', title().id);
+      expect(title().tagName).toBe('DIV');
+      expect(title()).toHaveAttribute('aria-live', 'polite');
+      expect(screen.queryByRole('heading')).toBeNull();
+    });
+
+    it('shows short weekday names and reads the long ones', () => {
+      render(<Cal />);
+      const headers = screen.getAllByRole('columnheader', { hidden: true });
+      expect(headers).toHaveLength(7);
+      const first = headers[0] as HTMLElement;
+      expect(first).toHaveAttribute('scope', 'col');
+      expect(first.querySelector('[aria-hidden="true"]')).toHaveTextContent('Sun');
+      expect(first.querySelector('.flg-visually-hidden')).toHaveTextContent('Sunday');
+      expect(screen.getByRole('columnheader', { name: 'Saturday' })).toBeInTheDocument();
+    });
+
+    it('lays out six rows of seven cells', () => {
+      render(<Cal />);
+      expect(document.querySelectorAll('tbody tr')).toHaveLength(6);
+      expect(document.querySelectorAll('tbody td[role="gridcell"]')).toHaveLength(42);
+      expect(dayButtons()).toHaveLength(30);
+    });
+
+    it('names each day with its full date in the locale', () => {
+      render(<Cal />);
+      expect(day('2026-11-14')).toHaveAccessibleName('Saturday, November 14, 2026');
+      expect(day('2026-11-14')).toHaveTextContent('14');
+      expect(day('2026-11-14')).toHaveAttribute('type', 'button');
+    });
+
+    it('names each day in vi-VN and de-DE', () => {
+      const long = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' } as const;
+      const { rerender } = render(<Cal locale="vi-VN" />);
+      expect(day('2026-11-14')).toHaveAccessibleName(formatDate('2026-11-14', 'vi-VN', long));
+      expect(day('2026-11-14').getAttribute('aria-label')).toMatch(/Thứ Bảy/);
+      rerender(<Cal locale="de-DE" />);
+      expect(day('2026-11-14')).toHaveAccessibleName(formatDate('2026-11-14', 'de-DE', long));
+      expect(day('2026-11-14').getAttribute('aria-label')).toMatch(/Samstag/);
+    });
+
+    it('sets aria-selected on the gridcell of the chosen day, and no aria-pressed anywhere', () => {
+      render(<Cal defaultValue="2026-11-14" />);
+      const cell = day('2026-11-14').closest('td') as HTMLElement;
+      expect(cell).toHaveAttribute('aria-selected', 'true');
+      expect(document.querySelectorAll('[aria-selected]')).toHaveLength(1);
+      expect(document.querySelector('[aria-pressed]')).toBeNull();
+      expect(day('2026-11-14')).not.toHaveAttribute('aria-selected');
+    });
+
+    it('does not select a day of another month that shows in the grid', () => {
+      render(<Cal value="2026-10-31" />);
+      expect(title()).toHaveTextContent('October 2026');
+      fireEvent.click(next());
+      expect(document.querySelector('[aria-selected]')).toBeNull();
+    });
+
+    it('puts the days of the months around as hidden numbers, not buttons', () => {
+      render(<Cal />);
+      // 1 November 2026 is a Sunday, so the grid starts on it and ends on 12 December.
+      const outside = document.querySelectorAll('td > span[data-date]');
+      expect(outside).toHaveLength(12);
+      for (const cell of outside) {
+        expect(cell).toHaveAttribute('aria-hidden', 'true');
+        expect(cell).toHaveAttribute('data-outside');
+        expect(cell.closest('td')).toHaveAttribute('role', 'gridcell');
+        expect((cell as HTMLElement).tabIndex).toBe(-1);
+      }
+      expect(outside[0]).toHaveAttribute('data-date', '2026-12-01');
+      expect(outside[0]).toHaveTextContent('1');
+    });
+
+    it('ignores a press on a day of another month', () => {
+      const onValueChange = vi.fn();
+      const onMonthChange = vi.fn();
+      render(<Cal weekStartsOn={1} onValueChange={onValueChange} onMonthChange={onMonthChange} />);
+      const outside = document.querySelector('span[data-date="2026-10-31"]') as HTMLElement;
+      fireEvent.click(outside);
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(onMonthChange).not.toHaveBeenCalled();
+      expect(title()).toHaveTextContent('November 2026');
+    });
+
+    it('labels the month buttons, and lets the labels be translated', () => {
+      const { rerender } = render(<Cal />);
+      expect(previous()).toHaveClass('flg-button');
+      expect(previous().querySelector('svg')).toBeInTheDocument();
+      rerender(<Cal labels={{ previousMonth: 'Tháng trước', nextMonth: 'Tháng sau' }} />);
+      expect(screen.getByRole('button', { name: 'Tháng trước' })).toBeInTheDocument();
+      expect(screen.getByRole('button', { name: 'Tháng sau' })).toBeInTheDocument();
+      rerender(<Cal labels={{ nextMonth: 'Suivant' }} />);
+      expect(previous()).toBeInTheDocument();
+      expect(screen.getByRole('button', { name: 'Suivant' })).toBeInTheDocument();
+    });
+  });
+
+  describe('the focused day (roving tabindex)', () => {
+    it('is the chosen day when it is in the month shown', () => {
+      render(<Cal defaultValue="2026-11-14" />);
+      expect(tabStop()).toEqual([day('2026-11-14')]);
+    });
+
+    it('is today when nothing is chosen in the month shown', () => {
+      render(<Cal defaultValue="2026-10-14" month="2026-11" />);
+      expect(tabStop()).toEqual([day('2026-11-04')]);
+    });
+
+    it('is the first day that can be chosen when neither is in the month', () => {
+      render(
+        <Cal
+          month="2026-12"
+          isDateUnavailable={(date) => date === '2026-12-01' || date === '2026-12-02'}
+        />,
+      );
+      expect(tabStop()).toEqual([day('2026-12-03')]);
+    });
+
+    it('is the first day of the month when none can be chosen', () => {
+      render(<Cal month="2026-12" isDateUnavailable={() => true} />);
+      expect(tabStop()).toEqual([day('2026-12-01')]);
+    });
+
+    it('skips the days before min', () => {
+      render(<Cal month="2026-12" min="2026-12-09" />);
+      expect(tabStop()).toEqual([day('2026-12-09')]);
+    });
+
+    it('has exactly one tab stop, and the days of other months are not in the tab order', () => {
+      render(<Cal defaultValue="2026-11-14" />);
+      expect(tabStop()).toHaveLength(1);
+      expect(dayButtons().filter((button) => button.tabIndex === -1)).toHaveLength(29);
+    });
+
+    it('moves with the focus', () => {
+      render(<Cal defaultValue="2026-11-14" />);
+      act(() => day('2026-11-20').focus());
+      expect(tabStop()).toEqual([day('2026-11-20')]);
+    });
+
+    it('is chosen again by the rule when a month button is pressed, and focus stays on the button', () => {
+      render(<Cal defaultValue="2026-11-14" />);
+      act(() => day('2026-11-20').focus());
+      fireEvent.click(next());
+      expect(tabStop()).toEqual([day('2026-12-01')]);
+      fireEvent.click(previous());
+      expect(tabStop()).toEqual([day('2026-11-14')]);
+    });
+  });
+
+  describe('keys', () => {
+    const start = '2026-11-11'; // a Wednesday
+
+    function setup(props: Partial<CalendarProps> = {}) {
+      const onMonthChange = vi.fn();
+      render(<Cal defaultValue={start} onMonthChange={onMonthChange} {...props} />);
+      const origin = day((props.defaultValue as string | undefined) ?? start);
+      act(() => origin.focus());
+      return { onMonthChange, origin };
+    }
+
+    it.each([
+      ['ArrowLeft', '2026-11-10'],
+      ['ArrowRight', '2026-11-12'],
+      ['ArrowUp', '2026-11-04'],
+      ['ArrowDown', '2026-11-18'],
+      ['Home', '2026-11-08'],
+      ['End', '2026-11-14'],
+    ])('%s moves the focus to %s', (key, target) => {
+      setup();
+      fireEvent.keyDown(document.activeElement as Element, { key });
+      expect(day(target)).toHaveFocus();
+      expect(tabStop()).toEqual([day(target)]);
+    });
+
+    it('moves Home and End by weekStartsOn', () => {
+      setup({ weekStartsOn: 1 });
+      fireEvent.keyDown(document.activeElement as Element, { key: 'Home' });
+      expect(day('2026-11-09')).toHaveFocus();
+      fireEvent.keyDown(document.activeElement as Element, { key: 'End' });
+      expect(day('2026-11-15')).toHaveFocus();
+    });
+
+    it('moves PageUp and PageDown by a month, and keeps the day when it exists', () => {
+      const { onMonthChange } = setup();
+      fireEvent.keyDown(document.activeElement as Element, { key: 'PageDown' });
+      expect(title()).toHaveTextContent('December 2026');
+      expect(day('2026-12-11')).toHaveFocus();
+      expect(onMonthChange).toHaveBeenLastCalledWith('2026-12');
+      fireEvent.keyDown(document.activeElement as Element, { key: 'PageUp' });
+      fireEvent.keyDown(document.activeElement as Element, { key: 'PageUp' });
+      expect(title()).toHaveTextContent('October 2026');
+      expect(day('2026-10-11')).toHaveFocus();
+      expect(onMonthChange).toHaveBeenLastCalledWith('2026-10');
+    });
+
+    it('clamps the day to the end of a shorter month', () => {
+      setup({ defaultValue: '2027-01-31' });
+      fireEvent.keyDown(document.activeElement as Element, { key: 'PageDown' });
+      expect(title()).toHaveTextContent('February 2027');
+      expect(day('2027-02-28')).toHaveFocus();
+    });
+
+    it('moves Shift+PageUp and Shift+PageDown by a year', () => {
+      const { onMonthChange } = setup();
+      fireEvent.keyDown(document.activeElement as Element, { key: 'PageDown', shiftKey: true });
+      expect(title()).toHaveTextContent('November 2027');
+      expect(day('2027-11-11')).toHaveFocus();
+      expect(onMonthChange).toHaveBeenLastCalledWith('2027-11');
+      fireEvent.keyDown(document.activeElement as Element, { key: 'PageUp', shiftKey: true });
+      fireEvent.keyDown(document.activeElement as Element, { key: 'PageUp', shiftKey: true });
+      expect(title()).toHaveTextContent('November 2025');
+      expect(day('2025-11-11')).toHaveFocus();
+    });
+
+    it('changes the month when a key crosses its edge, and the focus follows', () => {
+      const { onMonthChange } = setup({ defaultValue: '2026-11-30' });
+      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowRight' });
+      expect(title()).toHaveTextContent('December 2026');
+      expect(day('2026-12-01')).toHaveFocus();
+      expect(onMonthChange).toHaveBeenCalledTimes(1);
+      expect(onMonthChange).toHaveBeenCalledWith('2026-12');
+      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowLeft' });
+      expect(title()).toHaveTextContent('November 2026');
+      expect(day('2026-11-30')).toHaveFocus();
+    });
+
+    it('crosses the edge by weeks, and across a year', () => {
+      setup({ defaultValue: '2026-12-29' });
+      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowDown' });
+      expect(title()).toHaveTextContent('January 2027');
+      expect(day('2027-01-05')).toHaveFocus();
+      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowUp' });
+      expect(title()).toHaveTextContent('December 2026');
+      expect(day('2026-12-29')).toHaveFocus();
+    });
+
+    it('does not report the month when the key stays inside it', () => {
+      const { onMonthChange } = setup();
+      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowRight' });
+      expect(onMonthChange).not.toHaveBeenCalled();
+    });
+
+    it('stops at min and at max, and never leaves them', () => {
+      const { onMonthChange } = setup({
+        defaultValue: '2026-11-06',
+        min: '2026-11-05',
+        max: '2026-11-20',
+      });
+      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowLeft' });
+      expect(day('2026-11-05')).toHaveFocus();
+      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowLeft' });
+      expect(day('2026-11-05')).toHaveFocus();
+      fireEvent.keyDown(document.activeElement as Element, { key: 'PageUp' });
+      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowUp' });
+      expect(day('2026-11-05')).toHaveFocus();
+      fireEvent.keyDown(document.activeElement as Element, { key: 'PageDown' });
+      expect(day('2026-11-20')).toHaveFocus();
+      fireEvent.keyDown(document.activeElement as Element, { key: 'PageDown', shiftKey: true });
+      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowRight' });
+      fireEvent.keyDown(document.activeElement as Element, { key: 'End' });
+      expect(day('2026-11-20')).toHaveFocus();
+      expect(title()).toHaveTextContent('November 2026');
+      expect(onMonthChange).not.toHaveBeenCalled();
+    });
+
+    it('crosses into the month of min but not past it', () => {
+      setup({ defaultValue: '2026-11-03', min: '2026-10-30' });
+      fireEvent.keyDown(document.activeElement as Element, { key: 'PageUp' });
+      expect(title()).toHaveTextContent('October 2026');
+      expect(day('2026-10-30')).toHaveFocus();
+    });
+
+    it('prevents the default of every key it handles', () => {
+      setup();
+      for (const key of [
+        'ArrowLeft',
+        'ArrowRight',
+        'ArrowUp',
+        'ArrowDown',
+        'Home',
+        'End',
+        'PageUp',
+        'PageDown',
+      ]) {
+        // fireEvent returns false when the handler called preventDefault.
+        expect(fireEvent.keyDown(document.activeElement as Element, { key })).toBe(false);
+      }
+      expect(fireEvent.keyDown(document.activeElement as Element, { key: 'a' })).toBe(true);
+      expect(fireEvent.keyDown(document.activeElement as Element, { key: 'Tab' })).toBe(true);
+    });
+
+    it('leaves a key with Alt, Ctrl or Meta to the browser', () => {
+      const { origin } = setup();
+      for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
+        for (const key of ['ArrowRight', 'Home', 'PageDown']) {
+          expect(fireEvent.keyDown(origin, { key, [modifier]: true })).toBe(true);
+        }
+      }
+      expect(origin).toHaveFocus();
+      expect(title()).toHaveTextContent('November 2026');
+    });
+
+    it('chooses with Enter and with Space', async () => {
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      setup({ onValueChange });
+      await user.keyboard('{ArrowRight}{Enter}');
+      expect(onValueChange).toHaveBeenLastCalledWith('2026-11-12');
+      await user.keyboard('{ArrowRight} ');
+      expect(onValueChange).toHaveBeenLastCalledWith('2026-11-13');
+      expect(day('2026-11-13').closest('td')).toHaveAttribute('aria-selected', 'true');
+    });
+  });
+
+  describe('days that cannot be chosen', () => {
+    const unavailable = (date: string) => date === '2026-11-10';
+
+    it('are aria-disabled but stay buttons that take focus', () => {
+      render(<Cal isDateUnavailable={unavailable} min="2026-11-03" max="2026-11-26" />);
+      for (const date of ['2026-11-10', '2026-11-02', '2026-11-27']) {
+        expect(day(date)).toHaveAttribute('aria-disabled', 'true');
+        expect(day(date)).not.toBeDisabled();
+        act(() => day(date).focus());
+        expect(day(date)).toHaveFocus();
+      }
+      expect(day('2026-11-11')).not.toHaveAttribute('aria-disabled');
+    });
+
+    it('are passed over by the keys, which can land on them, and cannot be chosen', async () => {
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      render(
+        <Cal
+          defaultValue="2026-11-09"
+          isDateUnavailable={unavailable}
+          onValueChange={onValueChange}
+        />,
+      );
+      act(() => day('2026-11-09').focus());
+      await user.keyboard('{ArrowRight}');
+      expect(day('2026-11-10')).toHaveFocus();
+      await user.keyboard('{Enter}');
+      await user.keyboard(' ');
+      await user.click(day('2026-11-10'));
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(day('2026-11-09').closest('td')).toHaveAttribute('aria-selected', 'true');
+      await user.keyboard('{ArrowRight}');
+      expect(day('2026-11-11')).toHaveFocus();
+    });
+
+    it('include every day outside min and max', () => {
+      const onValueChange = vi.fn();
+      render(<Cal min="2026-11-10" onValueChange={onValueChange} />);
+      fireEvent.click(day('2026-11-09'));
+      expect(onValueChange).not.toHaveBeenCalled();
+      fireEvent.click(day('2026-11-10'));
+      expect(onValueChange).toHaveBeenCalledWith('2026-11-10');
+    });
+  });
+
+  describe('the month buttons', () => {
+    it('change the month, report it, and keep the focus on the button', async () => {
+      const onMonthChange = vi.fn();
+      const user = userEvent.setup();
+      render(<Cal onMonthChange={onMonthChange} />);
+      await user.click(next());
+      expect(title()).toHaveTextContent('December 2026');
+      expect(onMonthChange).toHaveBeenLastCalledWith('2026-12');
+      expect(next()).toHaveFocus();
+      await user.click(previous());
+      await user.click(previous());
+      expect(title()).toHaveTextContent('October 2026');
+      expect(onMonthChange).toHaveBeenLastCalledWith('2026-10');
+      expect(previous()).toHaveFocus();
+    });
+
+    it('cross a year', async () => {
+      const user = userEvent.setup();
+      render(<Cal defaultMonth="2026-12" />);
+      await user.click(next());
+      expect(title()).toHaveTextContent('January 2027');
+      await user.click(previous());
+      await user.click(previous());
+      expect(title()).toHaveTextContent('November 2026');
+    });
+
+    it('get aria-disabled when the whole month they lead to is outside min and max', () => {
+      render(<Cal min="2026-11-05" max="2026-11-25" />);
+      expect(previous()).toHaveAttribute('aria-disabled', 'true');
+      expect(next()).toHaveAttribute('aria-disabled', 'true');
+      expect(previous()).not.toBeDisabled();
+    });
+
+    it('stay enabled while any day of the month they lead to is inside the range', () => {
+      render(<Cal min="2026-10-31" max="2026-12-01" />);
+      expect(previous()).not.toHaveAttribute('aria-disabled');
+      expect(next()).not.toHaveAttribute('aria-disabled');
+    });
+
+    it('do nothing at an end, and keep their place in the tab order and their focus', async () => {
+      const onMonthChange = vi.fn();
+      const user = userEvent.setup();
+      render(<Cal max="2026-12-15" onMonthChange={onMonthChange} />);
+      await user.click(next());
+      expect(title()).toHaveTextContent('December 2026');
+      expect(next()).toHaveAttribute('aria-disabled', 'true');
+      expect(next()).toHaveFocus();
+      await user.click(next());
+      await user.keyboard('{Enter}');
+      expect(title()).toHaveTextContent('December 2026');
+      expect(onMonthChange).toHaveBeenCalledTimes(1);
+      expect(next()).toHaveFocus();
+      expect(next().tabIndex).toBe(0);
+    });
+  });
+
+  describe('choosing a day', () => {
+    it('calls onValueChange with the ISO date and selects it when uncontrolled', () => {
+      const onValueChange = vi.fn();
+      render(<Cal onValueChange={onValueChange} />);
+      fireEvent.click(day('2026-11-18'));
+      expect(onValueChange).toHaveBeenCalledTimes(1);
+      expect(onValueChange).toHaveBeenCalledWith('2026-11-18');
+      expect(day('2026-11-18').closest('td')).toHaveAttribute('aria-selected', 'true');
+      fireEvent.click(day('2026-11-19'));
+      expect(day('2026-11-18').closest('td')).not.toHaveAttribute('aria-selected');
+      expect(day('2026-11-19').closest('td')).toHaveAttribute('aria-selected', 'true');
+    });
+
+    it('does not select by itself when controlled, and shows what the parent gives', () => {
+      const onValueChange = vi.fn();
+      const { rerender } = render(<Cal value={null} onValueChange={onValueChange} />);
+      fireEvent.click(day('2026-11-18'));
+      expect(onValueChange).toHaveBeenCalledWith('2026-11-18');
+      expect(document.querySelector('[aria-selected]')).toBeNull();
+      rerender(<Cal value="2026-11-18" onValueChange={onValueChange} />);
+      expect(day('2026-11-18').closest('td')).toHaveAttribute('aria-selected', 'true');
+    });
+
+    it('does not call onValueChange when the parent changes the value', () => {
+      const onValueChange = vi.fn();
+      const { rerender } = render(<Cal value="2026-11-18" onValueChange={onValueChange} />);
+      rerender(<Cal value="2026-11-20" onValueChange={onValueChange} />);
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('does nothing when the day is already the value, and cannot be unchosen', () => {
+      const onValueChange = vi.fn();
+      render(<Cal defaultValue="2026-11-18" onValueChange={onValueChange} />);
+      fireEvent.click(day('2026-11-18'));
+      fireEvent.click(day('2026-11-18'));
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(day('2026-11-18').closest('td')).toHaveAttribute('aria-selected', 'true');
+    });
+
+    it('works inside a form without submitting it', () => {
+      const onSubmit = vi.fn((event) => event.preventDefault());
+      const { container } = render(
+        <form onSubmit={onSubmit}>
+          <Cal />
+        </form>,
+      );
+      fireEvent.click(day('2026-11-18'));
+      expect(onSubmit).not.toHaveBeenCalled();
+      expect(container.querySelector('input')).toBeNull();
+    });
+
+    it('is reachable through user-event with the pointer', async () => {
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      render(<Cal onValueChange={onValueChange} />);
+      await user.click(day('2026-11-18'));
+      expect(onValueChange).toHaveBeenCalledWith('2026-11-18');
+      expect(day('2026-11-18')).toHaveFocus();
+    });
+  });
+
+  describe('the week and the locale', () => {
+    it.each([
+      [0, 'Sun', '2026-11-01'],
+      [1, 'Mon', '2026-10-26'],
+      [6, 'Sat', '2026-10-31'],
+    ] as const)('weekStartsOn %i starts the week on %s', (weekStartsOn, name, firstCell) => {
+      render(<Cal weekStartsOn={weekStartsOn} />);
+      const headers = screen.getAllByRole('columnheader', { hidden: true });
+      expect(headers[0]?.querySelector('[aria-hidden]')).toHaveTextContent(name);
+      expect((document.querySelector('tbody td') as HTMLElement).firstElementChild).toBe(
+        document.querySelector(`[data-date="${firstCell}"]`),
+      );
+    });
+
+    it('writes the title and the weekdays in the locale', () => {
+      const { rerender } = render(<Cal locale="vi-VN" month="2026-11" />);
+      expect(title()).toHaveTextContent(formatMonthYear('2026-11', 'vi-VN'));
+      expect(title().textContent).not.toBe('November 2026');
+      expect(
+        screen.getAllByRole('columnheader', { hidden: true })[0]?.querySelector('[aria-hidden]'),
+      ).toHaveTextContent('CN');
+      rerender(<Cal locale="de-DE" month="2026-12" />);
+      expect(title()).toHaveTextContent('Dezember 2026');
+    });
+  });
+
+  describe('dev warnings', () => {
+    it.each([
+      ['value', { value: '2026-02-30' }, 'value "2026-02-30"'],
+      ['defaultValue', { defaultValue: 'tomorrow' }, 'defaultValue "tomorrow"'],
+      ['min', { min: '2026-13-01' }, 'min "2026-13-01"'],
+      ['max', { max: '11/20/2026' }, 'max "11/20/2026"'],
+      ['month', { month: '2026-13' }, 'month "2026-13"'],
+      ['defaultMonth', { defaultMonth: '2026-11-01' }, 'defaultMonth "2026-11-01"'],
+      ['today', { today: 'now' }, 'today "now"'],
+    ] as const)(
+      'names %s when it is not an ISO date or month, and ignores it',
+      (_, props, text) => {
+        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+        render(<Calendar today="2026-11-04" {...(props as object)} />);
+        expect(warn).toHaveBeenCalledWith(expect.stringContaining(`Calendar: ${text}`));
+        // Whatever is ignored, the calendar still renders a month.
+        expect(title().textContent).not.toBe('');
+        expect(document.querySelector('[aria-selected]')).toBeNull();
+      },
+    );
+
+    it('falls back to the clock when today is invalid', () => {
+      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      vi.useFakeTimers({ toFake: ['Date'] });
+      vi.setSystemTime(new Date(2026, 10, 20, 12));
+      render(<Calendar today="nope" />);
+      expect(day('2026-11-20')).toHaveAttribute('aria-current', 'date');
+    });
+
+    it('warns when min is after max, and ignores both', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      render(<Cal min="2026-11-20" max="2026-11-10" />);
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('min (2026-11-20) is after max'));
+      expect(day('2026-11-05')).not.toHaveAttribute('aria-disabled');
+      expect(day('2026-11-25')).not.toHaveAttribute('aria-disabled');
+    });
+
+    it('does not warn for good props', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      render(
+        <Cal
+          value="2026-11-10"
+          min="2026-01-01"
+          max="2026-12-31"
+          month="2026-11"
+          today="2026-11-04"
+        />,
+      );
+      expect(warn).not.toHaveBeenCalled();
+    });
+
+    it('warns when value switches between controlled and uncontrolled', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      const { rerender } = render(<Cal defaultValue="2026-11-10" />);
+      rerender(<Cal value="2026-11-10" />);
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Calendar value is changing'));
+    });
+
+    it('warns when month switches between controlled and uncontrolled', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      const { rerender } = render(<Cal />);
+      rerender(<Cal month="2026-12" />);
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Calendar month is changing'));
+    });
+
+    it('never throws for bad props', () => {
+      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      expect(() =>
+        render(
+          <Calendar
+            value="x"
+            defaultValue="y"
+            min="z"
+            max="w"
+            month="m"
+            defaultMonth="n"
+            today="t"
+          />,
+        ),
+      ).not.toThrow();
+    });
+  });
+});
diff --git a/src/index.test.ts b/src/index.test.ts
index f7c8802..671479f 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -14,6 +14,7 @@ describe('public API', () => {
       'BreadcrumbLink',
       'BreadcrumbPage',
       'Button',
+      'Calendar',
       'Card',
       'CardContent',
       'CardDescription',
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/calendar src/index.test.ts
```

Expected: FAIL. `Calendar.test.tsx` không nạp được ở cả hai project React: `Failed to resolve import "./Calendar" from "src/components/calendar/Calendar.test.tsx". Does the file exist?`. `Calendar.test-d.ts` báo lỗi kiểu vì module chưa có, và `public API > exports exactly the documented components and nothing internal` fail vì danh sách export chưa có `Calendar`. Không test nào được thấy fail vì lý do riêng; test `follows a controlled value that moves to another month while month is uncontrolled` đã được kiểm bằng đột biến (phát hiện 13).

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
index 573ae01..6881dd8 100644
--- a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
+++ b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
@@ -443,6 +443,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`:
   - Ngày trong khoảng: viền 1px `Highlight`.
   - Hôm nay: viền trong 1px `CanvasText`, khác vòng focus.
   - Ngày không chọn được: `GrayText`, vẫn gạch ngang.
+  - Ngày của tháng khác: `GrayText`, bỏ `opacity`; chúng không phải nút, nên không lẫn với ngày không chọn được, vốn còn gạch ngang (phát hiện khi lập Plan C).
 - **DatePicker:** popup viền 1px `CanvasText` (như mọi panel overlay); icon lịch `ButtonText`.
 - **FileUpload:** viền đứt nét `CanvasText`, khi đang kéo `Highlight`; dòng bị từ chối giữ viền `CanvasText` và lời báo lỗi bằng chữ (lỗi không chỉ được báo bằng màu).
 - **Icon** dùng `currentColor`, màu đặt trên phần tử bọc ngoài chứ không trên `<svg>` (bài học chevron của spec giai đoạn 2 §4.5).
@@ -952,6 +953,7 @@ type CalendarProps =
   - `ref` trỏ vào phần tử gốc.
 - **Tháng đang hiện:** `month` ?? `defaultMonth` ?? tháng của `value` (ngày đầu, với khoảng) ?? tháng của `today` ?? tháng hiện tại của máy người dùng (Claude chốt).
   - Trường hợp cuối chỉ biết được ở client. HTML từ server và lần render đầu ở client có tiêu đề và hàng thứ rỗng, lưới chưa có ngày; ngày hiện ra sau khi mount. Nhờ vậy không lệch khi hydrate, dù server ở múi giờ khác.
+  - Khi `month` không được điều khiển mà `value` (controlled) được component cha đổi sang một tháng khác, tháng đang hiện theo giá trị mới, để một Calendar độc lập có giá trị đặt từ ngoài (ví dụ nút "Hôm nay") hiện ra ngày đó. Việc này không gọi `onMonthChange`, và chỉ xảy ra khi `value` đổi: người dùng đã sang tháng khác không bị kéo về (phát hiện khi lập Plan C).
 - **Roving tabindex:** chỉ một nút ngày có `tabIndex=0`: ngày đang focus. Ngày đó mặc định là ngày đã chọn (nếu trong tháng đang hiện), không thì hôm nay (nếu trong tháng), không thì ngày chọn được đầu tiên của tháng (Claude chốt).
 - **Bàn phím** (trên lưới):
   - ← và →: lùi, tiến một ngày. ↑ và ↓: lùi, tiến một tuần.
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 9d079c4..179ffc4 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -91,6 +91,13 @@ const SHIPPED_CLASSES = [
   'flg-pagination',
   'flg-pagination-page',
   'flg-pagination-ellipsis',
+  'flg-calendar',
+  'flg-calendar-header',
+  'flg-calendar-title',
+  'flg-calendar-grid',
+  'flg-calendar-weekday',
+  'flg-calendar-cell',
+  'flg-calendar-day',
   'flg-toaster',
   'flg-toaster-list',
   'flg-toast',
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index 954daa6..d82cd87 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -30,6 +30,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/slider/Slider.tsx',
   'src/components/accordion/Accordion.tsx',
   'src/components/pagination/Pagination.tsx',
+  'src/components/calendar/Calendar.tsx',
   'src/components/toast/toast.ts',
   'src/components/toast/Toaster.tsx',
 ];
diff --git a/src/components/calendar/Calendar.mdx b/src/components/calendar/Calendar.mdx
new file mode 100644
index 0000000..f2e4ade
--- /dev/null
+++ b/src/components/calendar/Calendar.mdx
@@ -0,0 +1,149 @@
+import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './Calendar.stories';
+
+<Meta of={Stories} />
+
+# Calendar
+
+```tsx
+import { Calendar } from 'h2d-glass-ui';
+
+<Calendar defaultValue="2026-11-14" onValueChange={(date) => save(date)} />;
+```
+
+<Canvas of={Stories.Look} />
+<Controls />
+
+## Dates are strings
+
+Every date in the API is an ISO string, `'2026-11-14'`, and every month is `'2026-11'`. There is no
+`Date`: no time zone can move a day, the server and the browser write the same text, and the strings
+match the value of a native `<input type="date">`. This holds for `value`, `defaultValue`, `min`, `max`,
+`today`, `month`, `defaultMonth`, and for what `onValueChange`, `onMonthChange` and
+`isDateUnavailable` receive. A string that is not a real date (`'2026-02-30'`) is ignored, with a
+warning in development that names the prop.
+
+## Choosing a date
+
+`value` is the chosen date, or `null` for none. With `onValueChange` it is controlled; with
+`defaultValue` the calendar keeps it. `onValueChange` is called with the date the user chooses (a press,
+Enter or Space), not when you change `value` yourself, and not for the date that is already chosen.
+A date cannot be unchosen by the user: clear it from outside with `value={null}`.
+
+```tsx
+const [date, setDate] = useState<string | null>(null);
+
+<Calendar value={date} onValueChange={setDate} />;
+<Button onClick={() => setDate('2026-11-04')}>Today</Button>;
+```
+
+## The month shown
+
+The month shown is the first of these that you gave: `month`, `defaultMonth`, the month of `value`, the
+month of today. `month` with `onMonthChange` controls it; the previous and next buttons and the keys
+that cross the edge of a month report the month they go to.
+
+A calendar whose month is not controlled follows a `value` that you move to another month, so the
+"Today" button above shows the date it chooses. It does not pull a user back who has gone to another
+month while the value stayed.
+
+<Canvas of={Stories.Controlled} />
+
+## Today is read on the client
+
+The calendar marks today (`aria-current="date"` and an accent edge) from the clock of the user's
+machine, after the first render, and again when the page is shown after being hidden and when focus
+enters the calendar, so a page left open past midnight does not keep yesterday. The server does not
+know the user's date. With no `month`, `defaultMonth`, `value` or `today`, the server HTML is an empty
+frame and the month appears after hydration; nothing mismatches whatever time zone the server is in.
+
+**Pass `today` for tests and demos.** It replaces the clock, so a screenshot or an assertion does not
+change with the day it runs. Every story of this page does.
+
+## Limits and unavailable dates
+
+`min` and `max` are the first and last date that can be chosen. `isDateUnavailable(date)` returns
+`true` for a date that cannot, such as a day that is fully booked. Both kinds are drawn the same way,
+struck through and dimmed, and have `aria-disabled="true"`: they stay in the grid and take focus, so a
+user of the keys passes over them and a screen reader finds them, but a press does nothing.
+
+The previous and next buttons have `aria-disabled` too, when every day of the month they lead to is
+outside `[min, max]`. They are not natively `disabled`, because that would drop the focus of a
+keyboard user who pressed the button to get there.
+
+`min` after `max` is a mistake: both are ignored, with a warning.
+
+## The week and the language
+
+`locale` (BCP 47, default `"en-US"`) sets the month, the weekday names and the names of the days. The
+default is fixed, not the browser's language, so the server and the browser write the same text.
+
+The first day of the week is `weekStartsOn`, from `0` (Sunday, the default for every locale) to `6`
+(Saturday). The library does not guess it from the locale, because the browsers do not agree on how to
+ask: **set `weekStartsOn={1}` for a locale whose week starts on Monday, such as `vi-VN`.** Translate the
+buttons with `labels={{ previousMonth, nextMonth }}`.
+
+```tsx
+<Calendar
+  locale="vi-VN"
+  weekStartsOn={1}
+  labels={{ previousMonth: 'Tháng trước', nextMonth: 'Tháng sau' }}
+/>
+```
+
+## Keys
+
+The grid has one tab stop: the chosen day if it is in the month shown, otherwise today, otherwise the
+first date that can be chosen. Tab goes to it, and the keys move from there. A key with Alt, Ctrl or
+Meta is left to the browser.
+
+| Key                          | Moves the focus to                                    |
+| ---------------------------- | ----------------------------------------------------- |
+| ← or →                       | The day before or after                               |
+| ↑ or ↓                       | The same day a week before or after                   |
+| Home, End                    | The first and the last day of the week                |
+| PageUp, PageDown             | The same day a month before or after (kept inside it) |
+| Shift+PageUp, Shift+PageDown | The same day a year before or after                   |
+| Enter, Space                 | Nowhere: they choose the focused day                  |
+
+A key that goes past the edge of the month shows the other month, and the focus goes with it. The focus
+does not leave `[min, max]`: a key stops at the edge. Pressing a month button changes the month and
+leaves the focus on the button.
+
+<Canvas of={Stories.Keys} />
+<Canvas of={Stories.MonthEdges} />
+<Canvas of={Stories.MinMax} />
+<Canvas of={Stories.MonthButtons} />
+<Canvas of={Stories.Pointer} />
+
+## Accessibility
+
+- The calendar is a `table` with `role="grid"`, named by its title ("November 2026"). The title is a
+  `<div>`, not a heading, because a calendar sits in forms and popups; it is a polite live region, so a
+  new month is read out when it is shown.
+- The weekday row shows the short names and reads the long ones ("Sunday"), so a screen reader does not
+  say "Sun".
+- **Each day is named with its full date**, in the locale: "Saturday, November 14, 2026". The number
+  alone would not say which month it is.
+- The chosen day is `aria-selected="true"` on its cell, as in the ARIA pattern, and not also
+  `aria-pressed`, which a screen reader would read twice. Today is `aria-current="date"`.
+- Days of the months around are numbers in the grid, `aria-hidden`, not buttons and not focusable.
+- Unavailable dates are `aria-disabled` and still focusable, so they can be found. Say why a date is
+  unavailable somewhere near the calendar if it matters.
+- In forced-colors mode the chosen day is `Highlight` with `HighlightText`, today has an inner line in
+  `CanvasText`, and unavailable days are `GrayText` and still struck through.
+- A Calendar is not a form control: it has no `name`, sends nothing with a form and does not belong in
+  a Field.
+- `isDateUnavailable` is a function, so it cannot be passed from a Server Component. Wrap the calendar
+  in a client component of yours, as for `getHref` of Pagination.
+
+## Do and don't
+
+- Do pass `today` in tests and demos, and `weekStartsOn={1}` for locales that start the week on Monday.
+- Do keep the value as the ISO string and format it for display with `Intl.DateTimeFormat` and
+  `timeZone: 'UTC'`.
+- Do use `isDateUnavailable` for days that are taken, and `min` and `max` for the ends.
+- Don't build a date with `new Date('2026-11-14')` for the value: that reads UTC and writes local time.
+  Pass the string on.
+- Don't rely on the calendar to unchoose a date; give the user a clear button that sets `value` to
+  `null`.
diff --git a/src/components/calendar/Calendar.tsx b/src/components/calendar/Calendar.tsx
new file mode 100644
index 0000000..6fd6bd0
--- /dev/null
+++ b/src/components/calendar/Calendar.tsx
@@ -0,0 +1,389 @@
+'use client';
+
+import { clsx } from 'clsx';
+import { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react';
+import type { FocusEvent, HTMLAttributes, KeyboardEvent } from 'react';
+import { composeEventHandlers } from '../../internal/compose-event-handlers';
+import {
+  addDays,
+  addMonths,
+  addYears,
+  clampIso,
+  compareIso,
+  endOfWeek,
+  formatDate,
+  formatMonthYear,
+  isIsoDate,
+  isIsoMonth,
+  isSameMonth,
+  monthGrid,
+  startOfWeek,
+  todayIso,
+  weekdayNames,
+} from '../../internal/date';
+import { ChevronIcon } from '../../internal/icons';
+import { mergeRefs } from '../../internal/merge-refs';
+import { hasModifier } from '../../internal/roving';
+import { useControllableState } from '../../internal/use-controllable-state';
+import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
+import { devWarn } from '../../internal/warn';
+import { IconButton } from '../icon-button/IconButton';
+
+/** The words the calendar says itself; translate them with the rest of the page. */
+export interface CalendarLabels {
+  /** Default `"Previous month"`. */
+  previousMonth?: string;
+  /** Default `"Next month"`. */
+  nextMonth?: string;
+}
+
+type CalendarBaseProps = Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> & {
+  /** The month shown, `'YYYY-MM'`. Pass it with `onMonthChange` to control it. */
+  month?: string;
+  /** The month shown at first, when `month` is not controlled. */
+  defaultMonth?: string;
+  /** Called with the month the user goes to, by the buttons or by the keys. */
+  onMonthChange?: (month: string) => void;
+  /** The first date that can be chosen, `'YYYY-MM-DD'`. Earlier dates are shown but cannot be chosen. */
+  min?: string;
+  /** The last date that can be chosen, `'YYYY-MM-DD'`. */
+  max?: string;
+  /** Marks a date that cannot be chosen, for example a day that is fully booked. */
+  isDateUnavailable?: (date: string) => boolean;
+  /** The day the week starts on, 0 (Sunday) to 6 (Saturday). Default 0, for every locale. */
+  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
+  /** BCP 47 locale of the month, the weekdays and the day names. Default `"en-US"`. */
+  locale?: string;
+  /**
+   * The date to call today, `'YYYY-MM-DD'`. Without it today is read from the clock after the first
+   * render, so the server cannot mark it. Pass it in tests and demos so that nothing changes with the
+   * day they run.
+   */
+  today?: string;
+  /** The words of the buttons. */
+  labels?: CalendarLabels;
+};
+
+export type CalendarProps = CalendarBaseProps & {
+  /** The chosen date, `'YYYY-MM-DD'`; `null` is no date. Pass it with `onValueChange` to control it. */
+  value?: string | null;
+  /** The chosen date at first, when `value` is not controlled. */
+  defaultValue?: string;
+  /** Called with the date the user chooses; not called when the parent changes `value`. */
+  onValueChange?: (value: string) => void;
+};
+
+/** `value` as it is, or undefined with a warning that names the prop when it is not a date or month. */
+function checked(
+  name: string,
+  value: string | null | undefined,
+  kind: 'date' | 'month',
+): string | undefined {
+  if (value === undefined || value === null) return undefined;
+  if (kind === 'date' ? isIsoDate(value) : isIsoMonth(value)) return value;
+  devWarn(
+    `Calendar: ${name} "${String(value)}" is not ${
+      kind === 'date' ? 'a date written YYYY-MM-DD' : 'a month written YYYY-MM'
+    }; it is ignored.`,
+  );
+  return undefined;
+}
+
+/** 'YYYY-MM' of a date (or of a month). */
+const monthOf = (iso: string) => iso.slice(0, 7);
+
+const FULL_DATE: Intl.DateTimeFormatOptions = {
+  weekday: 'long',
+  year: 'numeric',
+  month: 'long',
+  day: 'numeric',
+};
+
+const PREVIOUS = <ChevronIcon direction="left" />;
+const NEXT = <ChevronIcon direction="right" />;
+
+/**
+ * A month of days to choose one from, with the keys of the ARIA "date picker dialog" grid. Dates are
+ * ISO strings (`'2026-11-14'`), never `Date`s, so no time zone moves a day.
+ */
+export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
+  {
+    value: valueProp,
+    defaultValue,
+    onValueChange,
+    month: monthProp,
+    defaultMonth,
+    onMonthChange,
+    min: minProp,
+    max: maxProp,
+    isDateUnavailable,
+    weekStartsOn = 0,
+    locale = 'en-US',
+    today: todayProp,
+    labels,
+    className,
+    onFocus,
+    ...props
+  },
+  forwardedRef,
+) {
+  const titleId = useId();
+  const rootRef = useRef<HTMLDivElement>(null);
+  const ref = useMemo(() => mergeRefs(forwardedRef, rootRef), [forwardedRef]);
+
+  // A date or month that cannot be read is left out, so a typo shows a calendar without it, not none.
+  let min = checked('min', minProp, 'date');
+  let max = checked('max', maxProp, 'date');
+  if (min !== undefined && max !== undefined && compareIso(min, max) > 0) {
+    devWarn(`Calendar: min (${min}) is after max (${max}); both are ignored.`);
+    min = undefined;
+    max = undefined;
+  }
+  const todayGiven = checked('today', todayProp, 'date');
+
+  const [value, setValue] = useControllableState<string | null>({
+    // `null` is a controlled calendar without a date; `undefined` leaves the value to the calendar.
+    value: valueProp === undefined ? undefined : (checked('value', valueProp, 'date') ?? null),
+    defaultValue: checked('defaultValue', defaultValue, 'date') ?? null,
+    onChange: (next) => {
+      if (next !== null) onValueChange?.(next);
+    },
+    name: 'Calendar value',
+  });
+  const [monthState, setMonth, resetMonth] = useControllableState<string | null>({
+    // A month that cannot be read is ignored whole, so the month stays the calendar's to move.
+    value: checked('month', monthProp, 'month'),
+    defaultValue: checked('defaultMonth', defaultMonth, 'month') ?? null,
+    onChange: (next) => {
+      if (next !== null) onMonthChange?.(next);
+    },
+    name: 'Calendar month',
+  });
+
+  // Today comes from the clock only after mount, so the server and the first client render agree.
+  const [clock, setClock] = useState<string | null>(null);
+  const today = todayGiven ?? clock;
+  const hasTodayProp = todayGiven !== undefined;
+  useEffect(() => {
+    if (hasTodayProp) return undefined;
+    setClock(todayIso());
+    // A page left open past midnight reads the clock again when it is shown.
+    const onVisible = () => {
+      if (document.visibilityState === 'visible') setClock(todayIso());
+    };
+    document.addEventListener('visibilitychange', onVisible);
+    return () => document.removeEventListener('visibilitychange', onVisible);
+  }, [hasTodayProp]);
+
+  // `null` until it is known: with no month, value or today the month is the machine's, read above.
+  const shown: string | null =
+    monthState ??
+    (value !== null ? monthOf(value) : null) ??
+    (today !== null ? monthOf(today) : null);
+
+  // An uncontrolled month follows a value that the parent moves to another month, so a calendar
+  // whose value is set from outside (a "Today" button) shows it. Not on the first render, and not on
+  // later renders: a user who has gone to another month is not pulled back.
+  const lastValue = useRef(value);
+  useIsoLayoutEffect(() => {
+    if (lastValue.current === value) return;
+    lastValue.current = value;
+    if (value !== null && shown !== null && !isSameMonth(value, shown)) resetMonth(monthOf(value));
+  }, [value, shown, resetMonth]);
+
+  const unavailable = (date: string) =>
+    (min !== undefined && compareIso(date, min) < 0) ||
+    (max !== undefined && compareIso(date, max) > 0) ||
+    isDateUnavailable?.(date) === true;
+
+  const rows = shown === null ? [] : monthGrid(shown, weekStartsOn);
+
+  // The day with the tab stop: the one the user last moved to, while it is in the month shown;
+  // otherwise the chosen day, today, or the first day that can be chosen.
+  const [focusIso, setFocusIso] = useState<string | null>(null);
+  let focusDate: string | null = null;
+  if (shown !== null) {
+    if (focusIso !== null && isSameMonth(focusIso, shown)) focusDate = focusIso;
+    else if (value !== null && isSameMonth(value, shown)) focusDate = value;
+    else if (today !== null && isSameMonth(today, shown)) focusDate = today;
+    else {
+      const days = rows.flat().filter((cell) => cell.inMonth);
+      focusDate = (days.find((cell) => !unavailable(cell.date)) ?? days[0])?.date ?? null;
+    }
+  }
+
+  // A key that crosses into another month asks for focus on a button that exists only after the
+  // render that shows that month.
+  const pendingFocus = useRef<string | null>(null);
+  const focusButton = (date: string) =>
+    rootRef.current?.querySelector<HTMLElement>(`button[data-date="${date}"]`)?.focus();
+  useIsoLayoutEffect(() => {
+    const date = pendingFocus.current;
+    if (date === null) return;
+    pendingFocus.current = null;
+    focusButton(date);
+  });
+
+  const target = (from: string, key: string, shift: boolean): string | null => {
+    switch (key) {
+      case 'ArrowLeft':
+        return addDays(from, -1);
+      case 'ArrowRight':
+        return addDays(from, 1);
+      case 'ArrowUp':
+        return addDays(from, -7);
+      case 'ArrowDown':
+        return addDays(from, 7);
+      case 'Home':
+        return startOfWeek(from, weekStartsOn);
+      case 'End':
+        return endOfWeek(from, weekStartsOn);
+      case 'PageUp':
+        return shift ? addYears(from, -1) : addMonths(from, -1);
+      case 'PageDown':
+        return shift ? addYears(from, 1) : addMonths(from, 1);
+      default:
+        return null;
+    }
+  };
+
+  const onDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: string) => {
+    if (hasModifier(event)) return;
+    const next = target(date, event.key, event.shiftKey);
+    if (next === null) return;
+    event.preventDefault();
+    // The focus stops at the edge of [min, max] instead of going where no date can be chosen.
+    const clamped = clampIso(next, min, max);
+    setFocusIso(clamped);
+    if (shown !== null && !isSameMonth(clamped, shown)) {
+      pendingFocus.current = clamped;
+      setMonth(monthOf(clamped));
+    } else {
+      focusButton(clamped);
+    }
+  };
+
+  const choose = (date: string) => {
+    setFocusIso(date);
+    if (!unavailable(date)) setValue(date);
+  };
+
+  // Whole months compare as months: a month with one day inside [min, max] can be visited.
+  const monthOutOfRange = (month: string) =>
+    (min !== undefined && compareIso(month, monthOf(min)) < 0) ||
+    (max !== undefined && compareIso(month, monthOf(max)) > 0);
+  const step = (delta: number) => {
+    if (shown === null) return;
+    const month = monthOf(addMonths(`${shown}-01`, delta));
+    if (monthOutOfRange(month)) return;
+    // The focus stays on the button; the tab stop goes to where the rule puts it in the new month.
+    setFocusIso(null);
+    setMonth(month);
+  };
+  const stepDisabled = (delta: number) =>
+    shown === null || monthOutOfRange(monthOf(addMonths(`${shown}-01`, delta)));
+
+  const short = shown === null ? [] : weekdayNames(locale, weekStartsOn, 'short');
+  const long = shown === null ? [] : weekdayNames(locale, weekStartsOn, 'long');
+
+  return (
+    <div
+      ref={ref}
+      className={clsx('flg-calendar', className)}
+      data-mode="single"
+      onFocus={composeEventHandlers<FocusEvent<HTMLDivElement>>(onFocus, () => {
+        // Focus entering a page that was left open past midnight reads the date again.
+        if (!hasTodayProp) setClock(todayIso());
+      })}
+      {...props}
+    >
+      <div className="flg-calendar-header">
+        <div id={titleId} className="flg-calendar-title" aria-live="polite">
+          {shown === null ? '' : formatMonthYear(shown, locale)}
+        </div>
+        {/* At an end a month button does nothing but keeps `aria-disabled` and its place in the Tab
+            order: a native `disabled` would drop the focus of a keyboard user who pressed it to get
+            there (as in Pagination). */}
+        <IconButton
+          variant="ghost"
+          size="sm"
+          aria-label={labels?.previousMonth ?? 'Previous month'}
+          aria-disabled={stepDisabled(-1) || undefined}
+          onClick={() => step(-1)}
+        >
+          {PREVIOUS}
+        </IconButton>
+        <IconButton
+          variant="ghost"
+          size="sm"
+          aria-label={labels?.nextMonth ?? 'Next month'}
+          aria-disabled={stepDisabled(1) || undefined}
+          onClick={() => step(1)}
+        >
+          {NEXT}
+        </IconButton>
+      </div>
+      <table role="grid" aria-labelledby={titleId} className="flg-calendar-grid">
+        <thead>
+          <tr>
+            {short.map((name, index) => (
+              <th key={index} scope="col" className="flg-calendar-weekday">
+                <span aria-hidden="true">{name}</span>
+                <span className="flg-visually-hidden">{long[index]}</span>
+              </th>
+            ))}
+          </tr>
+        </thead>
+        <tbody>
+          {rows.map((row) => (
+            <tr key={row[0]?.date}>
+              {row.map(({ date, inMonth }) => {
+                const number = String(Number(date.slice(8)));
+                if (!inMonth) {
+                  return (
+                    <td key={date} role="gridcell" className="flg-calendar-cell">
+                      <span
+                        className="flg-calendar-day"
+                        data-date={date}
+                        data-outside=""
+                        aria-hidden="true"
+                      >
+                        {number}
+                      </span>
+                    </td>
+                  );
+                }
+                const selected = value === date;
+                const off = unavailable(date);
+                return (
+                  <td
+                    key={date}
+                    role="gridcell"
+                    className="flg-calendar-cell"
+                    aria-selected={selected || undefined}
+                  >
+                    <button
+                      type="button"
+                      className="flg-calendar-day"
+                      data-date={date}
+                      data-today={date === today ? '' : undefined}
+                      tabIndex={date === focusDate ? 0 : -1}
+                      aria-label={formatDate(date, locale, FULL_DATE)}
+                      aria-current={date === today ? 'date' : undefined}
+                      aria-disabled={off || undefined}
+                      onFocus={() => setFocusIso(date)}
+                      onClick={() => choose(date)}
+                      onKeyDown={(event) => onDayKeyDown(event, date)}
+                    >
+                      {number}
+                    </button>
+                  </td>
+                );
+              })}
+            </tr>
+          ))}
+        </tbody>
+      </table>
+    </div>
+  );
+});
diff --git a/src/components/calendar/index.ts b/src/components/calendar/index.ts
new file mode 100644
index 0000000..7961ed0
--- /dev/null
+++ b/src/components/calendar/index.ts
@@ -0,0 +1,2 @@
+export { Calendar } from './Calendar';
+export type { CalendarLabels, CalendarProps } from './Calendar';
diff --git a/src/index.ts b/src/index.ts
index 548d2cf..5def550 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -144,6 +144,8 @@ export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/tabs';
 export { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from './components/breadcrumb';
 export { Pagination } from './components/pagination';
 export type { PaginationLinkProps, PaginationProps } from './components/pagination';
+export { Calendar } from './components/calendar';
+export type { CalendarLabels, CalendarProps } from './components/calendar';
 export type {
   BreadcrumbLinkProps,
   BreadcrumbPageProps,
diff --git a/src/styles/components/calendar.css b/src/styles/components/calendar.css
new file mode 100644
index 0000000..6975bbc
--- /dev/null
+++ b/src/styles/components/calendar.css
@@ -0,0 +1,102 @@
+/* Calendar (spec phase 3 §4.3, mockup K1): 252px wide, seven 36px columns, round days. */
+@layer flg.components {
+  .flg-calendar {
+    width: 252px;
+    box-sizing: border-box;
+    font-family: var(--flg-font-sans);
+    color: var(--flg-text);
+  }
+  .flg-calendar-header {
+    display: flex;
+    align-items: center;
+    gap: 4px;
+    height: 34px;
+    margin-bottom: 4px;
+  }
+  .flg-calendar-title {
+    flex: 1;
+    min-width: 0;
+    font: var(--flg-weight-semibold) var(--flg-text-sm) var(--flg-font-sans);
+  }
+  /* The previous and next IconButtons hold a 16px chevron, not the 14px of `sm`, as in Pagination. */
+  .flg-calendar-header .flg-button {
+    flex: none;
+  }
+  .flg-calendar-header .flg-button > svg {
+    width: 16px;
+    height: 16px;
+  }
+  .flg-calendar-grid {
+    width: 100%;
+    border-collapse: collapse;
+    table-layout: fixed;
+  }
+  .flg-calendar-weekday {
+    height: 26px;
+    padding: 0;
+    text-align: center;
+    font: var(--flg-weight-medium) var(--flg-text-xs) var(--flg-font-sans);
+    color: var(--flg-text-muted);
+  }
+  .flg-calendar-cell {
+    width: 36px;
+    height: 36px;
+    padding: 0;
+    text-align: center;
+  }
+  .flg-calendar-day {
+    position: relative;
+    display: grid;
+    place-items: center;
+    box-sizing: border-box;
+    width: 36px;
+    height: 36px;
+    margin: 0;
+    padding: 0;
+    border: 0;
+    border-radius: var(--flg-radius-full);
+    background: transparent;
+    color: var(--flg-text);
+    font: var(--flg-weight-regular) var(--flg-text-sm) var(--flg-font-sans);
+    cursor: pointer;
+    transition: background-color var(--flg-duration-fast) var(--flg-ease);
+  }
+  /* The days of the months around are numbers, not buttons: nothing to press. */
+  .flg-calendar-day[data-outside] {
+    color: var(--flg-text-muted);
+    opacity: 0.5;
+    cursor: default;
+  }
+  .flg-calendar-day[aria-disabled='true'] {
+    color: var(--flg-text-muted);
+    opacity: 0.45;
+    text-decoration: line-through;
+    cursor: not-allowed;
+  }
+  /* Outside the mockup, which shows a hover on one day: any day that can be chosen reacts. */
+  @media (hover: hover) {
+    .flg-calendar-cell:not([aria-selected='true'])
+      > .flg-calendar-day[type='button']:not([aria-disabled='true']):hover {
+      background: var(--flg-control-track);
+    }
+  }
+  .flg-calendar-cell:not([aria-selected='true']) > .flg-calendar-day[data-today] {
+    box-shadow: inset 0 0 0 1px var(--flg-accent-solid);
+  }
+  .flg-calendar-cell[aria-selected='true'] > .flg-calendar-day {
+    background: var(--flg-accent-gradient);
+    color: var(--flg-on-accent);
+    font-weight: var(--flg-weight-semibold);
+  }
+  /* The ring, with the edge of today under it where a day is both. */
+  .flg-calendar-day:focus-visible {
+    outline: 2px solid var(--flg-focus-outline-color);
+    outline-offset: 2px;
+    box-shadow: var(--flg-focus-ring);
+  }
+  .flg-calendar-cell:not([aria-selected='true']) > .flg-calendar-day[data-today]:focus-visible {
+    box-shadow:
+      var(--flg-focus-ring),
+      inset 0 0 0 1px var(--flg-accent-solid);
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index 915673f..6752d88 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -31,6 +31,7 @@
 @import './components/accordion.css';
 @import './components/breadcrumb.css';
 @import './components/pagination.css';
+@import './components/calendar.css';
 @import './components/toast.css';
 @import './components/floating.css';
 @import './preferences.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 7898730..848f76d 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -334,6 +334,22 @@
     .flg-breadcrumb-separator {
       opacity: 1;
     }
+    /* The chosen day loses its gradient: it is Highlight with HighlightText, and the system does not
+       adjust that pair. Today is an edge of CanvasText, which the focus ring is not. A day that cannot
+       be chosen stays struck through, so it is not marked by colour alone. */
+    .flg-calendar-cell[aria-selected='true'] > .flg-calendar-day {
+      forced-color-adjust: none;
+      background: Highlight;
+      color: HighlightText;
+    }
+    .flg-calendar-cell:not([aria-selected='true']) > .flg-calendar-day[data-today] {
+      box-shadow: inset 0 0 0 1px CanvasText;
+    }
+    .flg-calendar-day[aria-disabled='true'],
+    .flg-calendar-day[data-outside] {
+      color: GrayText;
+      opacity: 1;
+    }
     /* The status bar of a toast (spec §4.5); the named icon still tells the status. */
     .flg-toast::before {
       background: CanvasText;
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/calendar src/index.test.ts src/internal/date.test.ts
pnpm vitest run --project storybook-light --project storybook-dark src/components/calendar
pnpm build && pnpm check:package
```

Expected:
- Unit: 212 test PASS, không lỗi kiểu (`Calendar.test.tsx` 88 test ở mỗi project React, `Calendar.test-d.ts` 4, `date.test.ts` 31, `index.test.ts` 1).
- Story Calendar: 42 test PASS (7 story × ba engine × hai theme). axe chạy sau play function, không có vi phạm.
- `check:package` PASS, gồm `check:use-client`, `check:dist-css` (bảy class `flg-calendar*`) và `size`. Theo lần chạy nháp: JS 39.04 kB trên 40.59 kB, CSS 7.82 kB trên 8.31 kB.
- Calendar là component mới. `preferences.css` chỉ thêm quy tắc `.flg-calendar*` trong `forced-colors`, nên ảnh chuẩn của component cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md \
  scripts/check-dist-css.ts \
  scripts/check-use-client.ts \
  src/components/calendar/Calendar.mdx \
  src/components/calendar/Calendar.stories.tsx \
  src/components/calendar/Calendar.test-d.ts \
  src/components/calendar/Calendar.test.tsx \
  src/components/calendar/Calendar.tsx \
  src/components/calendar/index.ts \
  src/index.test.ts \
  src/index.ts \
  src/styles/components/calendar.css \
  src/styles/index.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(calendar): Calendar, single date, in the K1 look" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 3: Calendar chọn khoảng

Spec §4.3 **Calendar (K1)**, ý **Khoảng**; §4.4 dòng 7 và 8 (chỉ vị trí, Task 6 đo); §4.5 **Calendar** (ngày trong khoảng); §5 (cảnh báo dev về khoảng); §6.3 **`Calendar`**, ý **Chọn khoảng** và union `CalendarProps`; §7 test kiểu; §8 (ngày không chọn được bên trong một khoảng).
- **Props**: union của spec. `mode?: 'single'` với giá trị là chuỗi; `mode: 'range'` với `[string, string]`. `data-mode` theo `mode`.
- **Chọn**: lần chọn đầu đặt ngày đầu đang chờ, không gọi lại; lần sau đặt ngày cuối và gọi `onValueChange([start, end])`, ngày sớm hơn đứng trước. Cùng một ngày hai lần là khoảng một ngày. Chỉ hai đầu phải chọn được; ngày bị chặn bên trong khoảng được phép.
- **Xem trước**: khi ngày đầu đang chờ, ngày dưới con trỏ hoặc ngày có focus vẽ dải từ ngày đầu tới nó, xuôi hay ngược.
- **Esc**: có ngày đầu đang chờ thì bỏ nó và `preventDefault` (Dialog bao ngoài vẫn mở); không có gì chờ thì để yên. Ngày đầu đang chờ còn khi focus rời Calendar và khi đổi tháng.
- **ARIA**: mọi ô từ đầu tới cuối của khoảng đã chốt có `aria-selected="true"`; ngày giữ tab stop mặc định là ngày đầu của khoảng khi nó ở trong tháng đang hiện.
- **Giao diện** (§4.3 **Khoảng**): ô giữa phủ cả ô 36px; hai đầu giữ hình tròn trên nửa dải; dải ngắt ở cuối tuần và bo tròn ở cột đầu, cột cuối. Dải vẽ ở `td::before` bằng `--flg-selected-bg`/`--flg-selected-text` (phát hiện 6). Forced colors: mỗi ô trong khoảng có viền 1px `Highlight`.
- **Cảnh báo dev**: ngày đầu sau ngày cuối thì đổi chỗ, kèm cảnh báo; khoảng sai dạng thì bị bỏ, kèm cảnh báo, và Calendar vẫn controlled, không có khoảng.
- Các lựa chọn khi làm ở phát hiện 6. Spec §4.3 **Khoảng** được sửa (phát hiện 3).
- Test của chế độ một ngày giữ nguyên, trừ một dòng chỉ về kiểu (phát hiện 6).

**Files:**
- Modify: `src/components/calendar/Calendar.tsx`, `index.ts`, `Calendar.test.tsx`, `Calendar.test-d.ts`, `Calendar.stories.tsx`, `Calendar.mdx`, `src/styles/components/calendar.css`, `src/styles/preferences.css`, `src/index.ts`, `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md`

**Interfaces:**
- Produces:
  - `CalendarProps` thành union: `CalendarBaseProps & { mode?: 'single'; value?: string | null; defaultValue?: string; onValueChange?: (value: string) => void }` hoặc `CalendarBaseProps & { mode: 'range'; value?: CalendarRange | null; defaultValue?: CalendarRange; onValueChange?: (value: CalendarRange) => void }`.
  - `CalendarRange = [string, string]`: kiểu mới, export qua `index.ts` và `src/index.ts`.
  - Hook DOM trên ô (`td`): `data-chosen` (ngày tròn: ngày chọn, hoặc một đầu khoảng), `data-range` (`start`, `middle`, `end`, `single`), `data-preview` (khi ngày đầu đang chờ). CSS của ngày chọn chuyển từ `[aria-selected='true']` sang `[data-chosen]`.
  - Cảnh báo dev: `Calendar: <prop> starts on <start>, which is after its end <end>; the two are swapped.`; `Calendar: <prop> <JSON> is not a range written [YYYY-MM-DD, YYYY-MM-DD]; it is ignored.`
  - Task 4 dùng Calendar ở chế độ một ngày, chỉ truyền `value`.
- Consumes: `Calendar` của Task 2, `compareIso`, `hasModifier`, `composeEventHandlers`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/calendar/Calendar.stories.tsx b/src/components/calendar/Calendar.stories.tsx
index 4c7a11a..daa8a8d 100644
--- a/src/components/calendar/Calendar.stories.tsx
+++ b/src/components/calendar/Calendar.stories.tsx
@@ -4,9 +4,26 @@ import { expect, fn, userEvent, waitFor } from 'storybook/test';
 import { realUserEvent } from '../../../.storybook/real-input';
 import { Button } from '../button/Button';
 import { Card } from '../card/Card';
+import {
+  Dialog,
+  DialogClose,
+  DialogContent,
+  DialogFooter,
+  DialogTitle,
+  DialogTrigger,
+} from '../dialog/Dialog';
 import { Calendar } from './Calendar';
 import type { CalendarProps } from './Calendar';
 
+/** The props of a calendar that chooses one date; the other kind is written with `mode="range"`. */
+type SingleProps = Extract<CalendarProps, { mode?: 'single' }>;
+
+/** Story args are the union of both kinds; these stories pick one date. */
+const single = (args: CalendarProps) => args as SingleProps;
+
+/** Story args of a calendar that chooses a range. */
+const ranged = (args: CalendarProps) => args as Extract<CalendarProps, { mode: 'range' }>;
+
 const meta = {
   title: 'Components/Calendar',
   component: Calendar,
@@ -36,7 +53,7 @@ export const Look: Story = {
     <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
       <Card style={{ padding: 16 }}>
         <Calendar
-          {...args}
+          {...single(args)}
           defaultValue="2026-11-14"
           min="2026-11-03"
           isDateUnavailable={booked}
@@ -45,7 +62,7 @@ export const Look: Story = {
       </Card>
       <Card style={{ padding: 16 }}>
         <Calendar
-          {...args}
+          {...single(args)}
           locale="vi-VN"
           weekStartsOn={1}
           defaultValue="2026-11-14"
@@ -309,7 +326,7 @@ export const Pointer: Story = {
   },
 };
 
-function ControlledDemo({ args }: { args: CalendarProps }) {
+function ControlledDemo({ args }: { args: SingleProps }) {
   const [value, setValue] = useState<string | null>(null);
   return (
     <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
@@ -338,7 +355,7 @@ function ControlledDemo({ args }: { args: CalendarProps }) {
 export const Controlled: Story = {
   tags: ['no-visual'],
   args: { defaultMonth: '2026-12', 'aria-label': 'Date' },
-  render: (args) => <ControlledDemo args={args} />,
+  render: (args) => <ControlledDemo args={single(args)} />,
   play: async ({ canvas, canvasElement, args }) => {
     const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
     await expect(title(root)).toHaveTextContent('December 2026');
@@ -355,3 +372,255 @@ export const Controlled: Story = {
     await expect(args.onValueChange).toHaveBeenCalledWith('2026-11-20');
   },
 };
+
+/** The cell (`td`) of a day, which carries the band, the range place and `aria-selected`. */
+const cellOf = (root: HTMLElement, iso: string) => dayOf(root, iso).closest('td') as HTMLElement;
+
+/** The ISO dates whose cell matches `selector`, in grid order. */
+const datesWhere = (root: HTMLElement, selector: string) =>
+  Array.from(root.querySelectorAll<HTMLElement>(`td${selector}`)).map(
+    (td) => td.querySelector<HTMLElement>('[data-date]')!.dataset.date,
+  );
+
+const days = (from: number, to: number) =>
+  Array.from({ length: to - from + 1 }, (_, i) => `2026-11-${String(from + i).padStart(2, '0')}`);
+
+const transparent = 'rgba(0, 0, 0, 0)';
+/** The band of a cell is painted on its `::before`: a colour in the dark theme, a gradient in the light. */
+const bandOf = (cell: Element) => getComputedStyle(cell, '::before');
+const hasBand = (cell: Element) => {
+  const band = bandOf(cell);
+  return (
+    band.content !== 'none' &&
+    (band.backgroundImage !== 'none' || band.backgroundColor !== transparent)
+  );
+};
+
+/**
+ * A range across a week break (the mockup, K1): on the left the week starts on Sunday and the band
+ * breaks after Saturday the 14th; on the right it starts on Monday, the range starts on a Sunday that
+ * ends its row, and the two booked days inside it are struck through but inside the band.
+ */
+export const Range: Story = {
+  render: (args) => (
+    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
+      <Card style={{ padding: 16 }}>
+        <Calendar
+          {...ranged(args)}
+          mode="range"
+          defaultValue={['2026-11-12', '2026-11-16']}
+          aria-label="November 2026, from Sunday"
+        />
+      </Card>
+      <Card style={{ padding: 16 }}>
+        <Calendar
+          {...ranged(args)}
+          mode="range"
+          weekStartsOn={1}
+          defaultValue={['2026-11-08', '2026-11-12']}
+          isDateUnavailable={booked}
+          aria-label="November 2026, from Monday"
+        />
+      </Card>
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const [sunday, monday] = Array.from(
+      canvasElement.querySelectorAll<HTMLElement>('.flg-calendar'),
+    ) as [HTMLElement, HTMLElement];
+    const style = (el: Element) => getComputedStyle(el);
+    await expect(sunday).toHaveAttribute('data-mode', 'range');
+    // Every day of the range is selected, and nothing else is.
+    await expect(datesWhere(sunday, '[aria-selected="true"]')).toEqual(days(12, 16));
+    await expect(cellOf(sunday, '2026-11-12')).toHaveAttribute('data-range', 'start');
+    await expect(cellOf(sunday, '2026-11-16')).toHaveAttribute('data-range', 'end');
+    // A middle day has the accent wash over its whole 36px cell, with the accent text; the day itself
+    // has no gradient of its own.
+    const middle = cellOf(sunday, '2026-11-13');
+    await expect(middle.getBoundingClientRect().width).toBe(36);
+    await expect(middle.getBoundingClientRect().height).toBe(36);
+    await expect(hasBand(middle)).toBe(true);
+    await expect(bandOf(middle).width).toBe('36px');
+    await expect(bandOf(middle).backgroundImage).toBe(
+      bandOf(cellOf(sunday, '2026-11-15')).backgroundImage,
+    );
+    await expect(bandOf(middle).backgroundColor).toBe(
+      bandOf(cellOf(sunday, '2026-11-15')).backgroundColor,
+    );
+    await expect(style(dayOf(sunday, '2026-11-13')).color).not.toBe(
+      style(dayOf(sunday, '2026-11-20')).color,
+    );
+    await expect(style(dayOf(sunday, '2026-11-13')).backgroundImage).toBe('none');
+    // The ends keep the round day, with half a band behind it: the start's on its right, the end's
+    // on its left.
+    for (const date of ['2026-11-12', '2026-11-16']) {
+      await expect(style(dayOf(sunday, date)).backgroundImage).toContain('gradient');
+      await expect(hasBand(cellOf(sunday, date))).toBe(true);
+      await expect(bandOf(cellOf(sunday, date)).width).toBe('18px');
+    }
+    await expect(bandOf(cellOf(sunday, '2026-11-12')).left).toBe('18px');
+    await expect(bandOf(cellOf(sunday, '2026-11-16')).left).toBe('0px');
+    // The band breaks at the end of the week: Saturday is round on the right, Sunday on the left.
+    const saturday = bandOf(cellOf(sunday, '2026-11-14'));
+    const nextSunday = bandOf(cellOf(sunday, '2026-11-15'));
+    await expect(parseFloat(saturday.borderTopRightRadius)).toBeGreaterThan(0);
+    await expect(parseFloat(saturday.borderTopLeftRadius)).toBe(0);
+    await expect(parseFloat(nextSunday.borderTopLeftRadius)).toBeGreaterThan(0);
+    await expect(parseFloat(nextSunday.borderTopRightRadius)).toBe(0);
+    // The Monday calendar: the range starts on the last day of its row, so the start is round on
+    // the right too; the booked days inside stay struck through and in the band.
+    await expect(datesWhere(monday, '[aria-selected="true"]')).toEqual(days(8, 12));
+    await expect(
+      parseFloat(bandOf(cellOf(monday, '2026-11-08')).borderTopRightRadius),
+    ).toBeGreaterThan(0);
+    await expect(
+      parseFloat(bandOf(cellOf(monday, '2026-11-09')).borderTopLeftRadius),
+    ).toBeGreaterThan(0);
+    for (const date of ['2026-11-09', '2026-11-10']) {
+      await expect(cellOf(monday, date)).toHaveAttribute('data-range', 'middle');
+      await expect(hasBand(cellOf(monday, date))).toBe(true);
+      await expect(style(dayOf(monday, date)).textDecorationLine).toBe('line-through');
+    }
+    // The months around are still plain numbers, with no band.
+    await expect(cellOf(sunday, '2026-12-01')).not.toHaveAttribute('data-range');
+  },
+};
+
+/**
+ * A start is picked and the pointer is over the 18th: the band runs from the 12th to it, in the
+ * look of a range, and nothing is announced as selected except the start.
+ */
+export const Preview: Story = {
+  render: (args) => (
+    <Card style={{ padding: 16, width: 'fit-content' }}>
+      <Calendar {...ranged(args)} mode="range" aria-label="Dates" />
+    </Card>
+  ),
+  play: async ({ canvasElement, args }) => {
+    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
+    // A real pointer where the browser can drive one: a pointer left over a day from an earlier story
+    // would otherwise move the preview when the layout changes (Firefox sends it a mouse move).
+    const pointer = (await realUserEvent()) ?? userEvent;
+    await pointer.click(dayOf(root, '2026-11-12'));
+    await pointer.hover(dayOf(root, '2026-11-18'));
+    await expect(args.onValueChange).not.toHaveBeenCalled();
+    await expect(datesWhere(root, '[data-preview]')).toEqual(days(12, 18));
+    await expect(datesWhere(root, '[aria-selected="true"]')).toEqual(['2026-11-12']);
+    // The band is drawn as a committed range is: the wash on the middle, the round day on both ends.
+    await expect(hasBand(cellOf(root, '2026-11-15'))).toBe(true);
+    await expect(getComputedStyle(dayOf(root, '2026-11-12')).backgroundImage).toContain('gradient');
+    await expect(getComputedStyle(dayOf(root, '2026-11-18')).backgroundImage).toContain('gradient');
+    await expect(
+      parseFloat(bandOf(cellOf(root, '2026-11-15')).borderTopLeftRadius),
+    ).toBeGreaterThan(0);
+  },
+};
+
+/** Picking a range with a real pointer: the preview follows it, the end calls back, the ends swap. */
+export const RangePointer: Story = {
+  tags: ['no-visual'],
+  args: { 'aria-label': 'Dates' },
+  render: (args) => <Calendar {...ranged(args)} mode="range" />,
+  play: async ({ canvasElement, args }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
+    await real.click(dayOf(root, '2026-11-12'));
+    await expect(args.onValueChange).not.toHaveBeenCalled();
+    await expect(datesWhere(root, '[aria-selected="true"]')).toEqual(['2026-11-12']);
+    // The band follows the pointer, forwards and backwards.
+    await real.hover(dayOf(root, '2026-11-17'));
+    await waitFor(() => expect(datesWhere(root, '[data-preview]')).toEqual(days(12, 17)));
+    await real.hover(dayOf(root, '2026-11-10'));
+    await waitFor(() => expect(datesWhere(root, '[data-preview]')).toEqual(days(10, 12)));
+    // The pointer leaves the days: only the start is left.
+    await real.hover(root.querySelector('.flg-calendar-title') as HTMLElement);
+    await waitFor(() => expect(datesWhere(root, '[data-preview]')).toEqual(['2026-11-12']));
+    await real.click(dayOf(root, '2026-11-17'));
+    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
+    await expect(args.onValueChange).toHaveBeenLastCalledWith(['2026-11-12', '2026-11-17']);
+    await expect(datesWhere(root, '[aria-selected="true"]')).toEqual(days(12, 17));
+    await expect(datesWhere(root, '[data-preview]')).toEqual([]);
+    // A later end first: the two days change places.
+    await real.click(dayOf(root, '2026-11-24'));
+    await real.click(dayOf(root, '2026-11-19'));
+    await expect(args.onValueChange).toHaveBeenLastCalledWith(['2026-11-19', '2026-11-24']);
+    await expect(datesWhere(root, '[aria-selected="true"]')).toEqual(days(19, 24));
+    // The same day twice is a range of one day, with no band.
+    await real.click(dayOf(root, '2026-11-27'));
+    await real.click(dayOf(root, '2026-11-27'));
+    await expect(args.onValueChange).toHaveBeenLastCalledWith(['2026-11-27', '2026-11-27']);
+    await expect(datesWhere(root, '[aria-selected="true"]')).toEqual(['2026-11-27']);
+    await expect(cellOf(root, '2026-11-27')).toHaveAttribute('data-range', 'single');
+    await expect(args.onValueChange).toHaveBeenCalledTimes(3);
+  },
+};
+
+/** The keys pick a range too: Enter and Space pick, and the arrows move the preview. */
+export const RangeKeys: Story = {
+  tags: ['no-visual'],
+  args: { 'aria-label': 'Dates' },
+  render: (args) => <Calendar {...ranged(args)} mode="range" />,
+  play: async ({ canvasElement, args }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
+    await tabToGrid(real);
+    // With nothing chosen the tab stop is today, the 4th.
+    await expect(dayOf(root, '2026-11-04')).toHaveFocus();
+    await real.keyboard('{Enter}');
+    await expect(args.onValueChange).not.toHaveBeenCalled();
+    await real.keyboard('{ArrowDown}{ArrowRight}');
+    await expect(dayOf(root, '2026-11-12')).toHaveFocus();
+    await expect(datesWhere(root, '[data-preview]')).toEqual(days(4, 12));
+    await real.keyboard(' ');
+    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
+    await expect(args.onValueChange).toHaveBeenLastCalledWith(['2026-11-04', '2026-11-12']);
+    await expect(datesWhere(root, '[aria-selected="true"]')).toEqual(days(4, 12));
+    // A start, and then an end before it: the swap, by keys.
+    await real.keyboard('{ArrowDown}{ArrowDown}{Enter}');
+    await expect(dayOf(root, '2026-11-26')).toHaveFocus();
+    await real.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{Enter}');
+    await expect(args.onValueChange).toHaveBeenLastCalledWith(['2026-11-05', '2026-11-26']);
+    await expect(datesWhere(root, '[aria-selected="true"]')).toEqual(days(5, 26));
+  },
+};
+
+/** Esc drops the start without touching what is around the calendar; a second one is the Dialog's. */
+export const RangeInADialog: Story = {
+  tags: ['no-visual'],
+  render: (args) => (
+    <Dialog>
+      <DialogTrigger variant="secondary">Pick dates</DialogTrigger>
+      <DialogContent size="sm">
+        <DialogTitle>Pick dates</DialogTitle>
+        <Calendar {...ranged(args)} mode="range" aria-label="Dates" />
+        <DialogFooter>
+          <DialogClose>Done</DialogClose>
+        </DialogFooter>
+      </DialogContent>
+    </Dialog>
+  ),
+  play: async ({ canvas, canvasElement, args }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await real.click(canvas.getByRole('button', { name: 'Pick dates' }));
+    const dialog = canvasElement.querySelector('dialog')!;
+    await waitFor(() => expect(dialog.open).toBe(true));
+    const root = dialog.querySelector('.flg-calendar') as HTMLElement;
+    const start = dayOf(root, '2026-11-04');
+    start.focus();
+    await real.keyboard('{Enter}');
+    await expect(datesWhere(root, '[aria-selected="true"]')).toEqual(['2026-11-04']);
+    // The first Esc is the calendar's: the start goes, the Dialog stays, the focus stays.
+    await real.keyboard('{Escape}');
+    await expect(datesWhere(root, '[aria-selected="true"]')).toEqual([]);
+    await new Promise((resolve) => setTimeout(resolve, 100));
+    await expect(dialog.open).toBe(true);
+    await expect(start).toHaveFocus();
+    await expect(args.onValueChange).not.toHaveBeenCalled();
+    // Nothing is pending now, so the second one closes the Dialog.
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(dialog.open).toBe(false));
+  },
+};
diff --git a/src/components/calendar/Calendar.test-d.ts b/src/components/calendar/Calendar.test-d.ts
index d4a5b3d..ee7e0aa 100644
--- a/src/components/calendar/Calendar.test-d.ts
+++ b/src/components/calendar/Calendar.test-d.ts
@@ -2,8 +2,11 @@ import { expectTypeOf, test } from 'vitest';
 import { Calendar } from './Calendar';
 import type { CalendarProps } from './Calendar';
 
+/** The props of a calendar that chooses one date. */
+type SingleProps = Extract<CalendarProps, { mode?: 'single' }>;
+
 test('Calendar value takes null, so a controlled calendar can have no date', () => {
-  expectTypeOf<CalendarProps['value']>().toEqualTypeOf<string | null | undefined>();
+  expectTypeOf<SingleProps['value']>().toEqualTypeOf<string | null | undefined>();
   Calendar({ value: null });
   Calendar({ value: '2026-11-14', onValueChange: (value) => expectTypeOf(value).toBeString() });
   Calendar({ defaultValue: '2026-11-14' });
@@ -12,7 +15,7 @@ test('Calendar value takes null, so a controlled calendar can have no date', ()
 test('Calendar defaultValue does not take null, and onValueChange always gets a date', () => {
   // @ts-expect-error null is "no value" only for a controlled calendar.
   Calendar({ defaultValue: null });
-  expectTypeOf<NonNullable<CalendarProps['onValueChange']>>().parameter(0).toBeString();
+  expectTypeOf<NonNullable<SingleProps['onValueChange']>>().parameter(0).toBeString();
 });
 
 test('Calendar weekStartsOn rejects a day that is not 0 to 6', () => {
@@ -29,3 +32,33 @@ test('Calendar months and dates are strings, never a Date', () => {
   Calendar({ month: new Date() });
   Calendar({ min: '2026-01-01', max: '2026-12-31', today: '2026-11-04', month: '2026-11' });
 });
+
+test('Calendar mode "range" takes only a [string, string] and reports a tuple', () => {
+  Calendar({
+    mode: 'range',
+    value: ['2026-11-12', '2026-11-16'],
+    onValueChange: (value) => expectTypeOf(value).toEqualTypeOf<[string, string]>(),
+  });
+  Calendar({ mode: 'range', value: null });
+  Calendar({ mode: 'range', defaultValue: ['2026-11-12', '2026-11-16'] });
+  // @ts-expect-error a range is two dates, not one.
+  Calendar({ mode: 'range', value: '2026-11-12' });
+  // @ts-expect-error a range is a pair, not a list of any length.
+  Calendar({ mode: 'range', value: ['2026-11-12', '2026-11-13', '2026-11-14'] });
+  // @ts-expect-error a range is a pair of strings, never of Dates.
+  Calendar({ mode: 'range', value: [new Date(), new Date()] });
+  // @ts-expect-error null is "no value" only for a controlled calendar.
+  Calendar({ mode: 'range', defaultValue: null });
+});
+
+test('Calendar in single mode takes a string, with or without mode', () => {
+  Calendar({
+    mode: 'single',
+    value: '2026-11-12',
+    onValueChange: (value) => expectTypeOf(value).toBeString(),
+  });
+  // @ts-expect-error a string is one date; a pair needs mode "range".
+  Calendar({ value: ['2026-11-12', '2026-11-16'] });
+  // @ts-expect-error the handler of a single calendar gets a string, not a tuple.
+  Calendar({ mode: 'single', onValueChange: (value: [string, string]) => value });
+});
diff --git a/src/components/calendar/Calendar.test.tsx b/src/components/calendar/Calendar.test.tsx
index 6583d8e..4a89393 100644
--- a/src/components/calendar/Calendar.test.tsx
+++ b/src/components/calendar/Calendar.test.tsx
@@ -1,4 +1,4 @@
-import { act, fireEvent, render, screen } from '@testing-library/react';
+import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
 import userEvent from '@testing-library/user-event';
 import { createRef, useState } from 'react';
 import { renderToString } from 'react-dom/server';
@@ -393,7 +393,7 @@ describe('Calendar', () => {
   describe('keys', () => {
     const start = '2026-11-11'; // a Wednesday
 
-    function setup(props: Partial<CalendarProps> = {}) {
+    function setup(props: Partial<Extract<CalendarProps, { mode?: 'single' }>> = {}) {
       const onMonthChange = vi.fn();
       render(<Cal defaultValue={start} onMonthChange={onMonthChange} {...props} />);
       const origin = day((props.defaultValue as string | undefined) ?? start);
@@ -826,4 +826,442 @@ describe('Calendar', () => {
       ).not.toThrow();
     });
   });
+
+  describe('range mode', () => {
+    const cell = (iso: string) => day(iso).closest('td') as HTMLElement;
+    /** The dates whose cell says it is selected, in grid order. */
+    const selectedDates = () =>
+      Array.from(document.querySelectorAll<HTMLElement>('td[aria-selected="true"]')).map(
+        (td) => td.querySelector<HTMLElement>('[data-date]')?.dataset.date,
+      );
+    /** The dates of the cells that wear the preview band. */
+    const previewDates = () =>
+      Array.from(document.querySelectorAll<HTMLElement>('td[data-preview]')).map(
+        (td) => td.querySelector<HTMLElement>('[data-date]')?.dataset.date,
+      );
+    const range = (from: number, to: number) =>
+      Array.from(
+        { length: to - from + 1 },
+        (_, i) => `2026-11-${String(from + i).padStart(2, '0')}`,
+      );
+    /** Presses Esc on a day and says whether the calendar called `preventDefault`. */
+    const pressEscape = (iso: string) => {
+      const event = createEvent.keyDown(day(iso), { key: 'Escape' });
+      fireEvent(day(iso), event);
+      return event.defaultPrevented;
+    };
+
+    function ControlledRange(props: { onValueChange?: (value: [string, string]) => void }) {
+      const [value, setValue] = useState<[string, string] | null>(null);
+      return (
+        <Calendar
+          mode="range"
+          today="2026-11-04"
+          value={value}
+          onValueChange={(next) => {
+            props.onValueChange?.(next);
+            setValue(next);
+          }}
+        />
+      );
+    }
+
+    it('says its mode, and single is the default', () => {
+      const { rerender } = render(<Cal mode="range" />);
+      expect(document.querySelector('.flg-calendar')).toHaveAttribute('data-mode', 'range');
+      rerender(<Cal />);
+      expect(document.querySelector('.flg-calendar')).toHaveAttribute('data-mode', 'single');
+      rerender(<Cal mode="single" />);
+      expect(document.querySelector('.flg-calendar')).toHaveAttribute('data-mode', 'single');
+    });
+
+    it('sets a pending start on the first pick and does not call back', () => {
+      const onValueChange = vi.fn();
+      render(<Cal mode="range" onValueChange={onValueChange} />);
+      fireEvent.click(day('2026-11-12'));
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(selectedDates()).toEqual(['2026-11-12']);
+      expect(cell('2026-11-12')).toHaveAttribute('data-range', 'single');
+    });
+
+    it('sets the end on the second pick and calls back once with [start, end]', () => {
+      const onValueChange = vi.fn();
+      render(<Cal mode="range" onValueChange={onValueChange} />);
+      fireEvent.click(day('2026-11-12'));
+      fireEvent.click(day('2026-11-16'));
+      expect(onValueChange).toHaveBeenCalledTimes(1);
+      expect(onValueChange).toHaveBeenCalledWith(['2026-11-12', '2026-11-16']);
+      // An uncontrolled calendar keeps the range, and every cell inside it is selected.
+      expect(selectedDates()).toEqual(range(12, 16));
+      expect(cell('2026-11-12')).toHaveAttribute('data-range', 'start');
+      expect(cell('2026-11-14')).toHaveAttribute('data-range', 'middle');
+      expect(cell('2026-11-16')).toHaveAttribute('data-range', 'end');
+      expect(cell('2026-11-17')).not.toHaveAttribute('data-range');
+    });
+
+    it('swaps the two days when the end is earlier than the start', () => {
+      const onValueChange = vi.fn();
+      render(<Cal mode="range" onValueChange={onValueChange} />);
+      fireEvent.click(day('2026-11-20'));
+      fireEvent.click(day('2026-11-15'));
+      expect(onValueChange).toHaveBeenCalledWith(['2026-11-15', '2026-11-20']);
+      expect(selectedDates()).toEqual(range(15, 20));
+    });
+
+    it('makes a one-day range of the same day twice, with no band', () => {
+      const onValueChange = vi.fn();
+      render(<Cal mode="range" onValueChange={onValueChange} />);
+      fireEvent.click(day('2026-11-12'));
+      fireEvent.click(day('2026-11-12'));
+      expect(onValueChange).toHaveBeenCalledTimes(1);
+      expect(onValueChange).toHaveBeenCalledWith(['2026-11-12', '2026-11-12']);
+      expect(selectedDates()).toEqual(['2026-11-12']);
+      expect(cell('2026-11-12')).toHaveAttribute('data-range', 'single');
+    });
+
+    it('starts a new range on the pick after a finished one', () => {
+      const onValueChange = vi.fn();
+      render(
+        <Cal
+          mode="range"
+          defaultValue={['2026-11-12', '2026-11-16']}
+          onValueChange={onValueChange}
+        />,
+      );
+      fireEvent.click(day('2026-11-20'));
+      expect(onValueChange).not.toHaveBeenCalled();
+      // Only the pending start is drawn and selected; the range it replaces is not.
+      expect(selectedDates()).toEqual(['2026-11-20']);
+      fireEvent.click(day('2026-11-22'));
+      expect(onValueChange).toHaveBeenCalledWith(['2026-11-20', '2026-11-22']);
+    });
+
+    it('picks with Enter and Space on the keyboard', async () => {
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      render(
+        <Cal
+          mode="range"
+          defaultValue={['2026-11-11', '2026-11-11']}
+          onValueChange={onValueChange}
+        />,
+      );
+      act(() => day('2026-11-11').focus());
+      await user.keyboard('{ArrowDown}{Enter}');
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(selectedDates()).toEqual(['2026-11-18']);
+      await user.keyboard('{ArrowRight}{ArrowRight} ');
+      expect(onValueChange).toHaveBeenCalledWith(['2026-11-18', '2026-11-20']);
+      expect(selectedDates()).toEqual(range(18, 20));
+    });
+
+    it('does not take a pick on a date that cannot be chosen, as start or as end', () => {
+      const onValueChange = vi.fn();
+      render(
+        <Cal
+          mode="range"
+          isDateUnavailable={(date) => date === '2026-11-09'}
+          onValueChange={onValueChange}
+        />,
+      );
+      fireEvent.click(day('2026-11-09'));
+      expect(selectedDates()).toEqual([]);
+      fireEvent.click(day('2026-11-12'));
+      fireEvent.click(day('2026-11-09'));
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(selectedDates()).toEqual(['2026-11-12']);
+    });
+
+    it('allows an unavailable date inside the range, and selects it', () => {
+      const onValueChange = vi.fn();
+      render(
+        <Cal
+          mode="range"
+          isDateUnavailable={(date) => date === '2026-11-09' || date === '2026-11-10'}
+          onValueChange={onValueChange}
+        />,
+      );
+      fireEvent.click(day('2026-11-08'));
+      fireEvent.click(day('2026-11-12'));
+      expect(onValueChange).toHaveBeenCalledWith(['2026-11-08', '2026-11-12']);
+      expect(selectedDates()).toEqual(range(8, 12));
+      expect(day('2026-11-09')).toHaveAttribute('aria-disabled', 'true');
+      expect(cell('2026-11-09')).toHaveAttribute('data-range', 'middle');
+    });
+
+    it('does not take a pick on a day of another month', () => {
+      render(<Cal mode="range" />);
+      fireEvent.click(day('2026-12-01'));
+      expect(selectedDates()).toEqual([]);
+    });
+
+    describe('the preview band', () => {
+      it('shows the days from the start to the one under the pointer, and follows it', async () => {
+        const user = userEvent.setup();
+        render(<Cal mode="range" />);
+        await user.click(day('2026-11-12'));
+        expect(previewDates()).toEqual(['2026-11-12']);
+        await user.hover(day('2026-11-16'));
+        expect(previewDates()).toEqual(range(12, 16));
+        expect(cell('2026-11-12')).toHaveAttribute('data-range', 'start');
+        expect(cell('2026-11-14')).toHaveAttribute('data-range', 'middle');
+        expect(cell('2026-11-16')).toHaveAttribute('data-range', 'end');
+        // Before the start, the band runs the other way, with the start at its end.
+        await user.hover(day('2026-11-10'));
+        expect(previewDates()).toEqual(range(10, 12));
+        expect(cell('2026-11-12')).toHaveAttribute('data-range', 'end');
+        // A preview is not a selection: only the start is announced as selected.
+        expect(selectedDates()).toEqual(['2026-11-12']);
+        await user.unhover(day('2026-11-10'));
+        expect(previewDates()).toEqual(['2026-11-12']);
+      });
+
+      it('shows nothing before a start is picked, nor for a committed range', async () => {
+        const user = userEvent.setup();
+        render(<Cal mode="range" defaultValue={['2026-11-12', '2026-11-16']} />);
+        await user.hover(day('2026-11-20'));
+        expect(previewDates()).toEqual([]);
+        expect(selectedDates()).toEqual(range(12, 16));
+      });
+
+      it('follows the focus of the keys too', async () => {
+        const user = userEvent.setup();
+        render(<Cal mode="range" defaultValue={['2026-11-12', '2026-11-12']} />);
+        act(() => day('2026-11-12').focus());
+        await user.keyboard('{Enter}');
+        await user.keyboard('{ArrowRight}{ArrowRight}');
+        expect(previewDates()).toEqual(range(12, 14));
+        await user.keyboard('{ArrowDown}');
+        expect(previewDates()).toEqual(range(12, 21));
+      });
+
+      it('does not preview up to a date that cannot be chosen', async () => {
+        const user = userEvent.setup();
+        render(<Cal mode="range" isDateUnavailable={(date) => date === '2026-11-16'} />);
+        await user.click(day('2026-11-12'));
+        await user.hover(day('2026-11-16'));
+        expect(previewDates()).toEqual(['2026-11-12']);
+      });
+
+      it('goes when the range is finished', async () => {
+        const user = userEvent.setup();
+        render(<Cal mode="range" />);
+        await user.click(day('2026-11-12'));
+        await user.click(day('2026-11-16'));
+        expect(previewDates()).toEqual([]);
+        await user.hover(day('2026-11-20'));
+        expect(previewDates()).toEqual([]);
+      });
+    });
+
+    describe('Esc', () => {
+      it('drops a pending start and is prevented, so a Dialog around it stays open', () => {
+        const onValueChange = vi.fn();
+        render(<Cal mode="range" onValueChange={onValueChange} />);
+        fireEvent.click(day('2026-11-12'));
+        expect(pressEscape('2026-11-12')).toBe(true);
+        expect(selectedDates()).toEqual([]);
+        expect(onValueChange).not.toHaveBeenCalled();
+        // The next pick starts again.
+        fireEvent.click(day('2026-11-20'));
+        expect(onValueChange).not.toHaveBeenCalled();
+        expect(selectedDates()).toEqual(['2026-11-20']);
+      });
+
+      it('keeps the committed range that a dropped start had replaced', () => {
+        render(<Cal mode="range" defaultValue={['2026-11-12', '2026-11-16']} />);
+        fireEvent.click(day('2026-11-20'));
+        pressEscape('2026-11-20');
+        expect(selectedDates()).toEqual(range(12, 16));
+      });
+
+      it('is left alone when nothing is pending', () => {
+        render(<Cal mode="range" defaultValue={['2026-11-12', '2026-11-16']} />);
+        expect(pressEscape('2026-11-12')).toBe(false);
+        fireEvent.click(day('2026-11-20'));
+        fireEvent.click(day('2026-11-22'));
+        expect(pressEscape('2026-11-22')).toBe(false);
+      });
+
+      it('is left alone in single mode', () => {
+        render(<Cal />);
+        fireEvent.click(day('2026-11-12'));
+        expect(pressEscape('2026-11-12')).toBe(false);
+        expect(selectedDates()).toEqual(['2026-11-12']);
+      });
+
+      it('works from the month buttons too, and runs the handler of the parent first', () => {
+        const onKeyDown = vi.fn();
+        render(<Cal mode="range" onKeyDown={onKeyDown} />);
+        fireEvent.click(day('2026-11-12'));
+        const event = createEvent.keyDown(next(), { key: 'Escape' });
+        fireEvent(next(), event);
+        expect(event.defaultPrevented).toBe(true);
+        expect(onKeyDown).toHaveBeenCalledTimes(1);
+        expect(selectedDates()).toEqual([]);
+      });
+    });
+
+    describe('the pending start', () => {
+      it('is not dropped when the focus leaves the calendar', async () => {
+        const onValueChange = vi.fn();
+        const user = userEvent.setup();
+        render(
+          <>
+            <button type="button">Outside</button>
+            <Cal mode="range" onValueChange={onValueChange} />
+          </>,
+        );
+        await user.click(day('2026-11-12'));
+        await user.click(screen.getByRole('button', { name: 'Outside' }));
+        expect(selectedDates()).toEqual(['2026-11-12']);
+        await user.click(day('2026-11-15'));
+        expect(onValueChange).toHaveBeenCalledWith(['2026-11-12', '2026-11-15']);
+      });
+
+      it('stays while the month changes, so a range can cross months', () => {
+        const onValueChange = vi.fn();
+        render(<Cal mode="range" onValueChange={onValueChange} />);
+        fireEvent.click(day('2026-11-25'));
+        fireEvent.click(next());
+        expect(selectedDates()).toEqual([]);
+        fireEvent.click(day('2026-12-03'));
+        expect(onValueChange).toHaveBeenCalledWith(['2026-11-25', '2026-12-03']);
+      });
+    });
+
+    describe('a controlled range', () => {
+      it('shows what the parent gives, and the pick goes through the parent', () => {
+        const onValueChange = vi.fn();
+        const { rerender } = render(
+          <Cal mode="range" value={null} onValueChange={onValueChange} />,
+        );
+        fireEvent.click(day('2026-11-12'));
+        fireEvent.click(day('2026-11-16'));
+        expect(onValueChange).toHaveBeenCalledWith(['2026-11-12', '2026-11-16']);
+        expect(selectedDates()).toEqual([]);
+        rerender(
+          <Cal mode="range" value={['2026-11-12', '2026-11-16']} onValueChange={onValueChange} />,
+        );
+        expect(selectedDates()).toEqual(range(12, 16));
+      });
+
+      it('does not call back when the parent changes the range', () => {
+        const onValueChange = vi.fn();
+        const { rerender } = render(
+          <Cal mode="range" value={['2026-11-12', '2026-11-16']} onValueChange={onValueChange} />,
+        );
+        rerender(
+          <Cal mode="range" value={['2026-11-20', '2026-11-22']} onValueChange={onValueChange} />,
+        );
+        expect(onValueChange).not.toHaveBeenCalled();
+        expect(selectedDates()).toEqual(range(20, 22));
+      });
+
+      it('works with state in the parent', () => {
+        const onValueChange = vi.fn();
+        render(<ControlledRange onValueChange={onValueChange} />);
+        fireEvent.click(day('2026-11-18'));
+        fireEvent.click(day('2026-11-14'));
+        expect(onValueChange).toHaveBeenCalledWith(['2026-11-14', '2026-11-18']);
+        expect(selectedDates()).toEqual(range(14, 18));
+      });
+
+      it('does not call back for the range that is already chosen', () => {
+        const onValueChange = vi.fn();
+        render(
+          <Cal
+            mode="range"
+            defaultValue={['2026-11-12', '2026-11-16']}
+            onValueChange={onValueChange}
+          />,
+        );
+        fireEvent.click(day('2026-11-12'));
+        fireEvent.click(day('2026-11-16'));
+        expect(onValueChange).not.toHaveBeenCalled();
+        expect(selectedDates()).toEqual(range(12, 16));
+      });
+
+      it('follows the month of the start when the parent moves the range, not on a new array', () => {
+        const { rerender } = render(<Cal mode="range" value={['2026-11-12', '2026-11-16']} />);
+        fireEvent.click(next());
+        expect(title()).toHaveTextContent('December 2026');
+        // The same dates in a new array are not a change: the user is not pulled back.
+        rerender(<Cal mode="range" value={['2026-11-12', '2026-11-16']} />);
+        expect(title()).toHaveTextContent('December 2026');
+        rerender(<Cal mode="range" value={['2027-02-03', '2027-02-05']} />);
+        expect(title()).toHaveTextContent('February 2027');
+      });
+    });
+
+    describe('the month and the tab stop', () => {
+      it('shows the month of the start, and the tab stop is on it', () => {
+        render(<Cal mode="range" defaultValue={['2026-09-30', '2026-11-10']} />);
+        expect(title()).toHaveTextContent('September 2026');
+        expect(tabStop().map((button) => button.dataset.date)).toEqual(['2026-09-30']);
+      });
+
+      it('puts the tab stop on the start of the range when it is in the month shown', () => {
+        render(<Cal mode="range" defaultValue={['2026-11-12', '2026-11-16']} />);
+        expect(tabStop().map((button) => button.dataset.date)).toEqual(['2026-11-12']);
+      });
+
+      it('falls back to today when the start is not in the month shown', () => {
+        render(<Cal mode="range" month="2026-11" value={['2026-10-28', '2026-11-10']} />);
+        expect(tabStop().map((button) => button.dataset.date)).toEqual(['2026-11-04']);
+        // The days of the range that are in the month are still drawn.
+        expect(selectedDates()).toEqual(range(1, 10));
+      });
+    });
+
+    describe('a range that cannot be used', () => {
+      it('swaps a start that is after its end, and warns', () => {
+        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+        render(<Cal mode="range" value={['2026-11-16', '2026-11-12']} />);
+        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Calendar: value'));
+        expect(warn).toHaveBeenCalledWith(expect.stringContaining('is after'));
+        expect(selectedDates()).toEqual(range(12, 16));
+      });
+
+      it('swaps a defaultValue too', () => {
+        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+        render(<Cal mode="range" defaultValue={['2026-11-16', '2026-11-12']} />);
+        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Calendar: defaultValue'));
+        expect(selectedDates()).toEqual(range(12, 16));
+      });
+
+      it.each([
+        ['one item', ['2026-11-12']],
+        ['three items', ['2026-11-12', '2026-11-13', '2026-11-14']],
+        ['a bad date', ['2026-11-12', '2026-02-30']],
+        ['a non-string', ['2026-11-12', 5]],
+        ['a single date', '2026-11-12'],
+        ['an object', { start: '2026-11-12', end: '2026-11-14' }],
+      ])('ignores %s, and warns', (_, value) => {
+        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+        render(<Cal mode="range" value={value as never} />);
+        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Calendar: value'));
+        expect(warn).toHaveBeenCalledWith(expect.stringContaining('range'));
+        expect(selectedDates()).toEqual([]);
+        // The calendar still renders a month, and is still controlled (nothing chosen).
+        expect(title().textContent).not.toBe('');
+      });
+
+      it('ignores a malformed defaultValue, and warns', () => {
+        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+        render(<Cal mode="range" defaultValue={['2026-11-12', 'x'] as never} />);
+        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Calendar: defaultValue'));
+        expect(selectedDates()).toEqual([]);
+      });
+
+      it('does not warn for a good range, and never throws', () => {
+        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+        render(<Cal mode="range" value={['2026-11-12', '2026-11-16']} />);
+        expect(warn).not.toHaveBeenCalled();
+        expect(() =>
+          render(<Cal mode="range" value={[1, 2] as never} defaultValue={{} as never} />),
+        ).not.toThrow();
+      });
+    });
+  });
 });
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/calendar
```

Expected: FAIL. Ở mỗi project React, 35 trong 128 test của `Calendar.test.tsx` fail, 93 pass. Ví dụ các lỗi ghi được ở bản nháp:
- `says its mode, and single is the default`: `data-mode` là `single` dù có `mode="range"`;
- `sets a pending start on the first pick and does not call back`: không có `aria-selected` sau lần chọn đầu;
- `sets the end on the second pick and calls back once with [start, end]`: `onValueChange` không bao giờ được gọi với một cặp;
- `drops a pending start and is prevented, so a Dialog around it stays open`: `defaultPrevented` là `false`;
- `swaps a start that is after its end, and warns` và sáu trường hợp `ignores %s, and warns`: không có cảnh báo.

`Calendar.test-d.ts` fail với `'mode' does not exist in type ...`.

93 test pass là 88 test của chế độ một ngày và các test của chế độ khoảng mà code cũ đã đúng (test đặc tả), trong đó có `is left alone in single mode`, `is left alone when nothing is pending`, `shows nothing before a start is picked, nor for a committed range` và `does not take a pick on a day of another month`.

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
index 6881dd8..936d40b 100644
--- a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
+++ b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
@@ -343,6 +343,7 @@ Mọi số liệu ở §4.3 lấy từ CSS `mk-` của đúng phương án đã
   - Ngày đầu và ngày cuối: hình tròn của ngày đang chọn, nằm trên nửa dải (ngày đầu: nửa phải; ngày cuối: nửa trái).
   - Ô của khoảng ở cột đầu hàng bo tròn bên trái, ở cột cuối hàng bo tròn bên phải (`--flg-radius-full`).
   - Dải xem trước khi đang chọn khoảng (§6.3) dùng cùng kiểu (Claude chốt).
+  - Dải được vẽ ở một lớp riêng dưới hình tròn (`::before` của ô), bằng `--flg-selected-bg` và `--flg-selected-text`. Ở chế độ mặc định hai token này bằng `--flg-accent-subtle` và `--flg-accent-text`, nên dải đúng như mockup; ở `prefers-contrast: more` chúng đã đổi sẵn (§4.4). Lý do: `--flg-accent-subtle` của theme sáng là một gradient, không đặt được vào `linear-gradient` nửa ô như mockup vẽ ở ngày đầu và ngày cuối (phát hiện khi lập Plan C).
 - **Ngày của tháng trước và tháng sau:** vẫn hiện trong lưới 6×7, màu `--flg-text-muted`, `opacity: .5`.
 - **Ngày không chọn được:** màu `--flg-text-muted`, `opacity: .45`, gạch ngang, `cursor: not-allowed`.
 - **Focus:** vòng focus chung trên nút ngày (tròn).
diff --git a/src/components/calendar/Calendar.mdx b/src/components/calendar/Calendar.mdx
index f2e4ade..a294f31 100644
--- a/src/components/calendar/Calendar.mdx
+++ b/src/components/calendar/Calendar.mdx
@@ -28,7 +28,8 @@ warning in development that names the prop.
 `value` is the chosen date, or `null` for none. With `onValueChange` it is controlled; with
 `defaultValue` the calendar keeps it. `onValueChange` is called with the date the user chooses (a press,
 Enter or Space), not when you change `value` yourself, and not for the date that is already chosen.
-A date cannot be unchosen by the user: clear it from outside with `value={null}`.
+A date cannot be unchosen by the user: clear it from outside with `value={null}`. This is the default
+`mode="single"`; a range is described below.
 
 ```tsx
 const [date, setDate] = useState<string | null>(null);
@@ -37,6 +38,65 @@ const [date, setDate] = useState<string | null>(null);
 <Button onClick={() => setDate('2026-11-04')}>Today</Button>;
 ```
 
+## Choosing a range
+
+`mode="range"` chooses two dates, the start and the end. `value` and `defaultValue` are a pair of ISO
+strings, `['2026-11-12', '2026-11-16']`, and `onValueChange` receives the same pair, the earlier day
+first.
+
+```tsx
+const [stay, setStay] = useState<[string, string] | null>(null);
+
+<Calendar mode="range" value={stay} onValueChange={setStay} />;
+```
+
+- The first pick sets the start and calls nothing. The second sets the end and calls
+  `onValueChange([start, end])`. An end that is earlier than the start swaps the two. The same day
+  twice is a range of one day.
+- While the start waits, the day under the pointer or with the focus shows a preview band from the
+  start to it, in the look of a chosen range.
+- **Esc** between the two picks drops the start, and the key is stopped, so a `Dialog` around the
+  calendar stays open. The next Esc, with nothing waiting, is left alone and closes the Dialog.
+- Leaving the calendar does not drop the start: a user can go to another month, or press a button
+  outside, and then pick the end. The start waits until it is finished or dropped.
+- The range is drawn from the start to the end on the days of the month shown. Picking a new start
+  replaces the range that was chosen: from then on only the start is drawn and selected, until the end
+  is picked. Esc brings the chosen range back.
+- The month shown follows the start of `value`, and the tab stop is on the start when it is in the
+  month shown.
+- A range whose start is after its end is swapped, with a warning in development. A value that is not
+  a pair of valid dates is ignored, with a warning that names the prop.
+
+<Canvas of={Stories.Range} />
+<Canvas of={Stories.Preview} />
+
+### Unavailable dates inside a range
+
+Only the two ends have to be chosen from dates that can be chosen. A date that is unavailable
+(`isDateUnavailable`, `min`, `max`) **can be inside the range**: it stays struck through, and it
+is in the band and selected like the others.
+
+The calendar does not reject such a range, because what it means is yours to say. A night in a hotel
+that is sold out in the middle of a stay is the case to watch: the guest picks the 8th and the 12th,
+and the 9th and the 10th are fully booked. **If that matters, check the range in `onValueChange` and
+refuse it yourself**, for example by looking for a booked date between the two ends, and tell the user
+why.
+
+```tsx
+const hasBookedNight = ([start, end]: [string, string]) => nights(start, end).some(isBooked);
+
+<Calendar
+  mode="range"
+  isDateUnavailable={isBooked}
+  value={stay}
+  onValueChange={(next) => (hasBookedNight(next) ? showError() : setStay(next))}
+/>;
+```
+
+<Canvas of={Stories.RangePointer} />
+<Canvas of={Stories.RangeKeys} />
+<Canvas of={Stories.RangeInADialog} />
+
 ## The month shown
 
 The month shown is the first of these that you gave: `month`, `defaultMonth`, the month of `value`, the
@@ -126,12 +186,15 @@ leaves the focus on the button.
 - **Each day is named with its full date**, in the locale: "Saturday, November 14, 2026". The number
   alone would not say which month it is.
 - The chosen day is `aria-selected="true"` on its cell, as in the ARIA pattern, and not also
-  `aria-pressed`, which a screen reader would read twice. Today is `aria-current="date"`.
+  `aria-pressed`, which a screen reader would read twice. Today is `aria-current="date"`. In range
+  mode every cell from the start to the end is `aria-selected`, so a screen reader says so for each
+  day of the stay; while a start waits, only that start is, and the preview band is not announced.
 - Days of the months around are numbers in the grid, `aria-hidden`, not buttons and not focusable.
 - Unavailable dates are `aria-disabled` and still focusable, so they can be found. Say why a date is
   unavailable somewhere near the calendar if it matters.
 - In forced-colors mode the chosen day is `Highlight` with `HighlightText`, today has an inner line in
-  `CanvasText`, and unavailable days are `GrayText` and still struck through.
+  `CanvasText`, and unavailable days are `GrayText` and still struck through. The wash of a range is
+  dropped, so each day of it has a 1px `Highlight` edge instead.
 - A Calendar is not a form control: it has no `name`, sends nothing with a form and does not belong in
   a Field.
 - `isDateUnavailable` is a function, so it cannot be passed from a Server Component. Wrap the calendar
@@ -145,5 +208,7 @@ leaves the focus on the button.
 - Do use `isDateUnavailable` for days that are taken, and `min` and `max` for the ends.
 - Don't build a date with `new Date('2026-11-14')` for the value: that reads UTC and writes local time.
   Pass the string on.
+- Don't leave a range with an unavailable date inside it unchecked when the days between the ends
+  matter: the calendar allows it.
 - Don't rely on the calendar to unchoose a date; give the user a clear button that sets `value` to
   `null`.
diff --git a/src/components/calendar/Calendar.tsx b/src/components/calendar/Calendar.tsx
index 6fd6bd0..bdff542 100644
--- a/src/components/calendar/Calendar.tsx
+++ b/src/components/calendar/Calendar.tsx
@@ -64,14 +64,35 @@ type CalendarBaseProps = Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | '
   labels?: CalendarLabels;
 };
 
-export type CalendarProps = CalendarBaseProps & {
-  /** The chosen date, `'YYYY-MM-DD'`; `null` is no date. Pass it with `onValueChange` to control it. */
-  value?: string | null;
-  /** The chosen date at first, when `value` is not controlled. */
-  defaultValue?: string;
-  /** Called with the date the user chooses; not called when the parent changes `value`. */
-  onValueChange?: (value: string) => void;
-};
+/** The two ends of a range, `['2026-11-12', '2026-11-16']`, the first not after the second. */
+export type CalendarRange = [string, string];
+
+export type CalendarProps =
+  | (CalendarBaseProps & {
+      /** One date (the default) or a range of dates. */
+      mode?: 'single';
+      /** The chosen date, `'YYYY-MM-DD'`; `null` is no date. Pass it with `onValueChange` to control it. */
+      value?: string | null;
+      /** The chosen date at first, when `value` is not controlled. */
+      defaultValue?: string;
+      /** Called with the date the user chooses; not called when the parent changes `value`. */
+      onValueChange?: (value: string) => void;
+    })
+  | (CalendarBaseProps & {
+      mode: 'range';
+      /** The chosen range, `[start, end]`; `null` is no range. Pass it with `onValueChange` to control it. */
+      value?: CalendarRange | null;
+      /** The chosen range at first, when `value` is not controlled. */
+      defaultValue?: CalendarRange;
+      /**
+       * Called with `[start, end]` when the user picks the end, the earlier day first. Picking the start
+       * calls nothing; not called when the parent changes `value`.
+       */
+      onValueChange?: (value: CalendarRange) => void;
+    });
+
+/** What the calendar holds: a date in single mode, a pair of dates in range mode, or nothing. */
+type CalendarValue = string | CalendarRange | null;
 
 /** `value` as it is, or undefined with a warning that names the prop when it is not a date or month. */
 function checked(
@@ -89,6 +110,33 @@ function checked(
   return undefined;
 }
 
+/**
+ * `value` as a range with its ends in order, or undefined with a warning that names the prop when it
+ * is not a pair of dates. A start after the end has an obvious meaning, so the two change places.
+ */
+function checkedRange(name: string, value: unknown): CalendarRange | undefined {
+  if (value === undefined || value === null) return undefined;
+  if (Array.isArray(value) && value.length === 2) {
+    const [start, end] = value as unknown[];
+    if (
+      typeof start === 'string' &&
+      typeof end === 'string' &&
+      isIsoDate(start) &&
+      isIsoDate(end)
+    ) {
+      if (compareIso(start, end) <= 0) return [start, end];
+      devWarn(
+        `Calendar: ${name} starts on ${start}, which is after its end ${end}; the two are swapped.`,
+      );
+      return [end, start];
+    }
+  }
+  devWarn(
+    `Calendar: ${name} ${JSON.stringify(value)} is not a range written [YYYY-MM-DD, YYYY-MM-DD]; it is ignored.`,
+  );
+  return undefined;
+}
+
 /** 'YYYY-MM' of a date (or of a month). */
 const monthOf = (iso: string) => iso.slice(0, 7);
 
@@ -108,6 +156,7 @@ const NEXT = <ChevronIcon direction="right" />;
  */
 export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
   {
+    mode = 'single',
     value: valueProp,
     defaultValue,
     onValueChange,
@@ -123,6 +172,7 @@ export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calen
     labels,
     className,
     onFocus,
+    onKeyDown,
     ...props
   },
   forwardedRef,
@@ -141,15 +191,31 @@ export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calen
   }
   const todayGiven = checked('today', todayProp, 'date');
 
-  const [value, setValue] = useControllableState<string | null>({
+  const isRange = mode === 'range';
+  // The union of the props types `onValueChange` by `mode`. Here the mode is a value, so the handler
+  // is taken as one that gets whatever the calendar holds: it is given the shape of its own mode.
+  const notify = onValueChange as ((value: CalendarValue) => void) | undefined;
+  const readValue = (name: string, raw: unknown): CalendarValue | undefined =>
+    isRange ? checkedRange(name, raw) : checked(name, raw as string | null | undefined, 'date');
+  const [value, setValue] = useControllableState<CalendarValue>({
     // `null` is a controlled calendar without a date; `undefined` leaves the value to the calendar.
-    value: valueProp === undefined ? undefined : (checked('value', valueProp, 'date') ?? null),
-    defaultValue: checked('defaultValue', defaultValue, 'date') ?? null,
+    value: valueProp === undefined ? undefined : (readValue('value', valueProp) ?? null),
+    defaultValue: readValue('defaultValue', defaultValue) ?? null,
     onChange: (next) => {
-      if (next !== null) onValueChange?.(next);
+      if (next !== null) notify?.(next);
     },
     name: 'Calendar value',
   });
+  // The shape that the other mode left in the state (a `mode` that changes) is not read.
+  const committed: CalendarRange | null = isRange && Array.isArray(value) ? value : null;
+  const single: string | null = !isRange && typeof value === 'string' ? value : null;
+  // The date that sets the month and the tab stop: the chosen date, or the start of the range.
+  const anchor = committed?.[0] ?? single;
+
+  // The first pick of a range, until the second one finishes it (or Esc drops it).
+  const [pending, setPending] = useState<string | null>(null);
+  // The day under the pointer or with the focus, for the preview band.
+  const [pointed, setPointed] = useState<string | null>(null);
   const [monthState, setMonth, resetMonth] = useControllableState<string | null>({
     // A month that cannot be read is ignored whole, so the month stays the calendar's to move.
     value: checked('month', monthProp, 'month'),
@@ -178,18 +244,21 @@ export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calen
   // `null` until it is known: with no month, value or today the month is the machine's, read above.
   const shown: string | null =
     monthState ??
-    (value !== null ? monthOf(value) : null) ??
+    (anchor !== null ? monthOf(anchor) : null) ??
     (today !== null ? monthOf(today) : null);
 
   // An uncontrolled month follows a value that the parent moves to another month, so a calendar
   // whose value is set from outside (a "Today" button) shows it. Not on the first render, and not on
   // later renders: a user who has gone to another month is not pulled back.
-  const lastValue = useRef(value);
+  // A range counts by its start, a string: a parent that passes the same dates in a new array on
+  // every render has not moved the value.
+  const lastAnchor = useRef(anchor);
   useIsoLayoutEffect(() => {
-    if (lastValue.current === value) return;
-    lastValue.current = value;
-    if (value !== null && shown !== null && !isSameMonth(value, shown)) resetMonth(monthOf(value));
-  }, [value, shown, resetMonth]);
+    if (lastAnchor.current === anchor) return;
+    lastAnchor.current = anchor;
+    if (anchor !== null && shown !== null && !isSameMonth(anchor, shown))
+      resetMonth(monthOf(anchor));
+  }, [anchor, shown, resetMonth]);
 
   const unavailable = (date: string) =>
     (min !== undefined && compareIso(date, min) < 0) ||
@@ -204,7 +273,7 @@ export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calen
   let focusDate: string | null = null;
   if (shown !== null) {
     if (focusIso !== null && isSameMonth(focusIso, shown)) focusDate = focusIso;
-    else if (value !== null && isSameMonth(value, shown)) focusDate = value;
+    else if (anchor !== null && isSameMonth(anchor, shown)) focusDate = anchor;
     else if (today !== null && isSameMonth(today, shown)) focusDate = today;
     else {
       const days = rows.flat().filter((cell) => cell.inMonth);
@@ -265,7 +334,37 @@ export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calen
 
   const choose = (date: string) => {
     setFocusIso(date);
-    if (!unavailable(date)) setValue(date);
+    if (unavailable(date)) return;
+    if (!isRange) {
+      setValue(date);
+    } else if (pending === null) {
+      setPending(date);
+    } else {
+      const range: CalendarRange =
+        compareIso(date, pending) < 0 ? [date, pending] : [pending, date];
+      setPending(null);
+      // The range that is already chosen is not a change, as the date that is already chosen is not.
+      if (committed?.[0] !== range[0] || committed[1] !== range[1]) setValue(range);
+    }
+  };
+
+  // What is drawn as the range: while a start waits, the band from it to the day pointed at (or just
+  // the start); otherwise the chosen range. The range that a new start replaces is not drawn.
+  const reaching =
+    pending !== null && pointed !== null && !unavailable(pointed) ? pointed : pending;
+  let band: CalendarRange | null = committed;
+  if (pending !== null && reaching !== null) {
+    band = compareIso(reaching, pending) < 0 ? [reaching, pending] : [pending, reaching];
+  }
+  const pointAt = (date: string | null) => {
+    if (isRange) setPointed(date);
+  };
+  // The pointer leaving a day hands the preview back to the day that has the focus, if there is one.
+  const focusedDate = () => {
+    const active = rootRef.current?.ownerDocument.activeElement;
+    return active?.matches('button[data-date]')
+      ? ((active as HTMLElement).dataset.date ?? null)
+      : null;
   };
 
   // Whole months compare as months: a month with one day inside [min, max] can be visited.
@@ -287,14 +386,25 @@ export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calen
   const long = shown === null ? [] : weekdayNames(locale, weekStartsOn, 'long');
 
   return (
+    // The root only catches the Esc of the keys that go through the grid and the month buttons, which
+    // are the controls; it is not a control itself.
+    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
     <div
       ref={ref}
       className={clsx('flg-calendar', className)}
-      data-mode="single"
+      data-mode={mode}
       onFocus={composeEventHandlers<FocusEvent<HTMLDivElement>>(onFocus, () => {
         // Focus entering a page that was left open past midnight reads the date again.
         if (!hasTodayProp) setClock(todayIso());
       })}
+      onKeyDown={composeEventHandlers<KeyboardEvent<HTMLDivElement>>(onKeyDown, (event) => {
+        // Esc between the two picks drops the start. It is stopped here so that a Dialog around the
+        // calendar, which closes on Esc, stays open: the first Esc is the calendar's, the next is the
+        // Dialog's. With no start to drop it is left alone.
+        if (event.key !== 'Escape' || hasModifier(event) || pending === null) return;
+        event.preventDefault();
+        setPending(null);
+      })}
       {...props}
     >
       <div className="flg-calendar-header">
@@ -353,14 +463,35 @@ export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calen
                     </td>
                   );
                 }
-                const selected = value === date;
                 const off = unavailable(date);
+                // Where the day is in the range that is drawn: an end, between the ends, or the
+                // only day (a start with no end yet, or a range of one day).
+                let place: 'start' | 'middle' | 'end' | 'single' | undefined;
+                if (
+                  band !== null &&
+                  compareIso(date, band[0]) >= 0 &&
+                  compareIso(date, band[1]) <= 0
+                ) {
+                  if (band[0] === band[1]) place = 'single';
+                  else place = date === band[0] ? 'start' : date === band[1] ? 'end' : 'middle';
+                }
+                // The round day: the date, or an end of the range. A day of the preview is not chosen
+                // yet, so only the start that waits is announced as selected.
+                const round = isRange ? place !== undefined && place !== 'middle' : single === date;
+                const selected = isRange
+                  ? pending === null
+                    ? place !== undefined
+                    : date === pending
+                  : round;
                 return (
                   <td
                     key={date}
                     role="gridcell"
                     className="flg-calendar-cell"
                     aria-selected={selected || undefined}
+                    data-chosen={round ? '' : undefined}
+                    data-range={place}
+                    data-preview={pending !== null && place !== undefined ? '' : undefined}
                   >
                     <button
                       type="button"
@@ -371,7 +502,13 @@ export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calen
                       aria-label={formatDate(date, locale, FULL_DATE)}
                       aria-current={date === today ? 'date' : undefined}
                       aria-disabled={off || undefined}
-                      onFocus={() => setFocusIso(date)}
+                      onFocus={() => {
+                        setFocusIso(date);
+                        pointAt(date);
+                      }}
+                      onBlur={() => pointAt(null)}
+                      onMouseEnter={() => pointAt(date)}
+                      onMouseLeave={() => pointAt(focusedDate())}
                       onClick={() => choose(date)}
                       onKeyDown={(event) => onDayKeyDown(event, date)}
                     >
diff --git a/src/components/calendar/index.ts b/src/components/calendar/index.ts
index 7961ed0..b0fab68 100644
--- a/src/components/calendar/index.ts
+++ b/src/components/calendar/index.ts
@@ -1,2 +1,2 @@
 export { Calendar } from './Calendar';
-export type { CalendarLabels, CalendarProps } from './Calendar';
+export type { CalendarLabels, CalendarProps, CalendarRange } from './Calendar';
diff --git a/src/index.ts b/src/index.ts
index 5def550..8f002c7 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -145,7 +145,7 @@ export { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from './components/breadcr
 export { Pagination } from './components/pagination';
 export type { PaginationLinkProps, PaginationProps } from './components/pagination';
 export { Calendar } from './components/calendar';
-export type { CalendarLabels, CalendarProps } from './components/calendar';
+export type { CalendarLabels, CalendarProps, CalendarRange } from './components/calendar';
 export type {
   BreadcrumbLinkProps,
   BreadcrumbPageProps,
diff --git a/src/styles/components/calendar.css b/src/styles/components/calendar.css
index 6975bbc..73eadad 100644
--- a/src/styles/components/calendar.css
+++ b/src/styles/components/calendar.css
@@ -1,4 +1,5 @@
-/* Calendar (spec phase 3 §4.3, mockup K1): 252px wide, seven 36px columns, round days. */
+/* Calendar (spec phase 3 §4.3, mockup K1): 252px wide, seven 36px columns, round days; a range is a
+   band painted on the cells, with the round ends of the range on half of it. */
 @layer flg.components {
   .flg-calendar {
     width: 252px;
@@ -75,26 +76,67 @@
   }
   /* Outside the mockup, which shows a hover on one day: any day that can be chosen reacts. */
   @media (hover: hover) {
-    .flg-calendar-cell:not([aria-selected='true'])
+    .flg-calendar-cell:not([data-chosen])
       > .flg-calendar-day[type='button']:not([aria-disabled='true']):hover {
       background: var(--flg-control-track);
     }
   }
-  .flg-calendar-cell:not([aria-selected='true']) > .flg-calendar-day[data-today] {
+  .flg-calendar-cell:not([data-chosen]) > .flg-calendar-day[data-today] {
     box-shadow: inset 0 0 0 1px var(--flg-accent-solid);
   }
-  .flg-calendar-cell[aria-selected='true'] > .flg-calendar-day {
+  /* The chosen day, or an end of the range. */
+  .flg-calendar-cell[data-chosen] > .flg-calendar-day {
     background: var(--flg-accent-gradient);
     color: var(--flg-on-accent);
     font-weight: var(--flg-weight-semibold);
   }
-  /* The ring, with the edge of today under it where a day is both. */
+  /* The range, and the preview of it while a start waits (the same look, spec §4.3). The band is
+     painted on a pseudo-element of the cell, not on the cell: the accent wash is a gradient in the
+     light theme, and a gradient cannot be a colour stop of the half band of an end. A one-day range
+     has no band. The tokens are the wash and the text of the spec; `prefers-contrast: more` swaps
+     them for the stronger pair, as for the selected tab. The button sits above the band. */
+  .flg-calendar-cell[data-range] {
+    position: relative;
+  }
+  .flg-calendar-cell[data-range]::before {
+    content: '';
+    position: absolute;
+    inset: 0;
+    background: var(--flg-selected-bg);
+  }
+  .flg-calendar-cell[data-range='single']::before {
+    content: none;
+  }
+  /* The start has its band on the right half of the cell, the end on the left half. */
+  .flg-calendar-cell[data-range='start']::before {
+    left: 50%;
+  }
+  .flg-calendar-cell[data-range='end']::before {
+    right: 50%;
+  }
+  .flg-calendar-cell[data-range='middle'] > .flg-calendar-day {
+    color: var(--flg-selected-text);
+  }
+  /* A band breaks at the end of the week: where it reaches the first cell of a row it is round on the
+     left, where it reaches the last cell on the right (the start and the end reach it from one side
+     only). */
+  .flg-calendar-cell[data-range='middle']:first-child::before,
+  .flg-calendar-cell[data-range='end']:first-child::before {
+    border-radius: var(--flg-radius-full) 0 0 var(--flg-radius-full);
+  }
+  .flg-calendar-cell[data-range='middle']:last-child::before,
+  .flg-calendar-cell[data-range='start']:last-child::before {
+    border-radius: 0 var(--flg-radius-full) var(--flg-radius-full) 0;
+  }
+  /* The ring, with the edge of today under it where a day is both. It rises above the band of the
+     next cell, which is painted later and would cover its edge. */
   .flg-calendar-day:focus-visible {
+    z-index: 1;
     outline: 2px solid var(--flg-focus-outline-color);
     outline-offset: 2px;
     box-shadow: var(--flg-focus-ring);
   }
-  .flg-calendar-cell:not([aria-selected='true']) > .flg-calendar-day[data-today]:focus-visible {
+  .flg-calendar-cell:not([data-chosen]) > .flg-calendar-day[data-today]:focus-visible {
     box-shadow:
       var(--flg-focus-ring),
       inset 0 0 0 1px var(--flg-accent-solid);
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 848f76d..72597c5 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -337,14 +337,23 @@
     /* The chosen day loses its gradient: it is Highlight with HighlightText, and the system does not
        adjust that pair. Today is an edge of CanvasText, which the focus ring is not. A day that cannot
        be chosen stays struck through, so it is not marked by colour alone. */
-    .flg-calendar-cell[aria-selected='true'] > .flg-calendar-day {
+    .flg-calendar-cell[data-chosen] > .flg-calendar-day {
       forced-color-adjust: none;
       background: Highlight;
       color: HighlightText;
     }
-    .flg-calendar-cell:not([aria-selected='true']) > .flg-calendar-day[data-today] {
+    .flg-calendar-cell:not([data-chosen]) > .flg-calendar-day[data-today] {
       box-shadow: inset 0 0 0 1px CanvasText;
     }
+    /* The wash of a range is dropped, so each cell of it has a 1px edge instead (an outline, since
+       the forced colours keep it and drop a `box-shadow`). */
+    .flg-calendar-cell[data-range] {
+      outline: 1px solid Highlight;
+      outline-offset: -1px;
+    }
+    .flg-calendar-cell[data-range]::before {
+      background: none;
+    }
     .flg-calendar-day[aria-disabled='true'],
     .flg-calendar-day[data-outside] {
       color: GrayText;
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/calendar src/index.test.ts src/internal/date.test.ts
pnpm vitest run --project storybook-light --project storybook-dark src/components/calendar
pnpm build && pnpm check:package
```

Expected:
- Unit: 294 test PASS, không lỗi kiểu (`Calendar.test.tsx` 128 test ở mỗi project React, `Calendar.test-d.ts` 6, `date.test.ts` 31, `index.test.ts` 1).
- Story Calendar: 72 test PASS (12 story × ba engine × hai theme). `Look` của Task 2, với các số đo của nó, vẫn pass.
- `check:package` PASS. Không có class mới (giao diện khoảng treo trên data-attribute), nên `check-dist-css.ts` và `check-use-client.ts` không đổi. Theo lần chạy nháp: JS 39.52 kB, CSS 7.93 kB.
- Giao diện một ngày không đổi: cùng khai báo CSS, với `[data-chosen]` thay cho `[aria-selected='true']` trên cùng các ô, và `border-collapse` giữ nguyên. Không CSS nào của component khác đổi.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md \
  src/components/calendar/Calendar.mdx \
  src/components/calendar/Calendar.stories.tsx \
  src/components/calendar/Calendar.test-d.ts \
  src/components/calendar/Calendar.test.tsx \
  src/components/calendar/Calendar.tsx \
  src/components/calendar/index.ts \
  src/index.ts \
  src/styles/components/calendar.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(calendar): range mode, with a preview band and Esc to drop the start" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 4: `DatePicker`, gõ ngày, lịch trong popup và form (giao diện D1)

Spec §3.1 (dòng DatePicker và ý **DatePicker giữ input ẩn**), §3.2 (dòng DatePicker), §3.3 đến §3.5, §4.3 **DatePicker (D1)**, §4.5 **DatePicker**, §5 (các primitive dùng lại, cảnh báo dev của DatePicker), §6.1, §6.3 **`DatePicker`** trừ lời báo lỗi (Task 5), §6.4 (lịch mở khi chữ không đọc được), §7, §8. Một ô gõ đọc ngày theo thứ tự của locale, có nút mở lịch bên dưới, và input ẩn mang ngày ISO cho form. Dựng theo Combobox (Plan B): popup trên ô nhập, focus trở về, giá trị form ẩn, reset form.
- **Cấu trúc** như HTML của §6.3: khung `.flg-input` (`size`, `invalid`, `disabled`) chứa ô gõ và nút lịch; `<input type="hidden" name>` mang ngày ISO (`''` khi `null`, `disabled` theo component); popup `<div popover="auto" role="dialog">` là một `Surface`, chỉ chứa Calendar khi mở. `ref`, `id`, `required`, `readOnly`, `aria-*` và các prop HTML khác lên ô gõ; `name` lên input ẩn; `className` và `style` lên phần tử gốc. `placeholder` mặc định là `datePattern(locale)`; `autoComplete="off"`.
- **Nút lịch**: đứng sau ô gõ trong thứ tự Tab, 24×24px ở mọi cỡ, icon `CalendarIcon` 16px màu mờ; `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`; mở bằng `useTriggerPress` như trigger của Popover; `readOnly` thì `aria-disabled` và không mở.
- **Gõ**: chữ được đọc (`parseDate`) khi rời DatePicker (kể cả qua nút lịch) và khi Enter. Ô trống thành `null`; ngày đọc được và chọn được thành giá trị, và chữ được viết lại bằng `formatDate`. Chữ khác ở lại như đã gõ, giá trị giữ nguyên (Task 5 thêm lời báo). Enter: phát hiện 7.
- **Mở**: nút lịch, hoặc Alt+↓ trong ô gõ. Chữ đang chờ được đọc trước, nên lịch mở ở tháng của nó; chữ không đọc được thì mở ở tháng của `value`, rồi của hôm nay (§6.4). Khi hiện, focus vào ngày giữ tab stop của lưới.
- **Trong popup**: nhấn một ngày (kể cả ngày đang chọn) đặt giá trị, viết lại chữ, đóng lịch và đưa focus về ô gõ. Esc là của trình duyệt (focus về ô gõ qua `restoreFocusTo`). Focus rời popup sang chỗ khác ngoài ô gõ và nút thì lịch đóng, focus ở lại nơi người dùng đưa tới. Nhấn ra ngoài đóng lịch (light dismiss). Khi mở, khung có viền nhấn và vòng focus như Select đang mở.
- **Form và Field**: `required` gốc trên ô gõ; `useFormReset` (uncontrolled về `defaultValue` và chữ của nó; reset bị huỷ thì không làm gì; controlled giữ giá trị và trả lại chữ của nó); trong Field, `<label for>` trỏ vào ô gõ (`markAsFieldControl`), cùng id của mô tả và lỗi.
- **Giao diện D1** (§4.3): popup rộng 278px, padding 12px, `--flg-radius-md`, cách khung 6px, canh trái. `.flg-date-picker-popup` được thêm vào hiệu ứng mở của `floating.css` (phát hiện 7). Forced colors: icon lịch `ButtonText`, khi khung disabled thì `GrayText`; popup là một `Surface` nên đã có viền `CanvasText`.
- Các lựa chọn khi làm ở phát hiện 7. Spec §6.3 **Gõ ngày** được sửa (phát hiện 3).

**Files:**
- Create: `src/components/date-picker/DatePicker.tsx`, `index.ts`, `DatePicker.test.tsx`, `DatePicker.test-d.ts`, `DatePicker.stories.tsx`, `DatePicker.mdx`, `src/styles/components/date-picker.css`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `src/styles/components/floating.css`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md`

**Interfaces:**
- Produces trong `src/components/date-picker/DatePicker.tsx` (client), export qua `index.ts` và `src/index.ts`:
  - `DatePicker`: `markAsFieldControl(forwardRef<HTMLInputElement, DatePickerProps>)`; `ref` là ô gõ.
  - `DatePickerProps`: `Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'size' | 'min' | 'max'>` cùng `value?: string | null`, `defaultValue?: string`, `onValueChange?: (value: string | null) => void`, `open`, `defaultOpen`, `onOpenChange(open)`, `min`, `max`, `isDateUnavailable(date)`, `weekStartsOn`, `locale` (mặc định `'en-US'`), `today`, `size?: 'sm' | 'md' | 'lg'` (mặc định `'md'`), `invalid`, `labels`, `className`, `style`.
  - `DatePickerLabels extends CalendarLabels`: `openCalendar` và `dialog`, cả hai mặc định `"Choose date"`. Task 5 thêm `invalidDate` và `unavailableDate`.
  - Class: `flg-date-picker`, `flg-date-picker-button`, `flg-date-picker-popup`. Gốc `div.flg-date-picker` mang `data-size`, `data-invalid`, `data-disabled`.
  - Cảnh báo dev: `DatePicker: <prop> "<x>" is not a date written YYYY-MM-DD; it is ignored.`; `DatePicker: min (<min>) is after max (<max>); both are ignored.`; chuyển controlled/uncontrolled với tên `DatePicker value` và `DatePicker open`.
- Consumes: `Calendar` và `CalendarLabels` (Task 2, 3), `compareIso`, `datePattern`, `formatDate`, `isIsoDate`, `parseDate`, `todayIso` (Task 1), hook `data-date` của Calendar; từ Plan A và B: `usePopoverState`, `useTriggerPress`, `usePopover`, `useFloating`, `useFormReset`, `useWriteOnCommit`, `useFieldProps`, `markAsFieldControl`, `focusInput`, `CalendarIcon`, `hasModifier`, `isComposing`, `useControllableState`, `useIsoLayoutEffect`, `mergeRefs`, `dataAttr`, `devWarn`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/date-picker/DatePicker.stories.tsx b/src/components/date-picker/DatePicker.stories.tsx
new file mode 100644
index 0000000..b7c1e0e
--- /dev/null
+++ b/src/components/date-picker/DatePicker.stories.tsx
@@ -0,0 +1,644 @@
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
+import { DatePicker } from './DatePicker';
+
+// Every story passes `today`: without it the calendar reads the clock, and the images and the checks
+// below would change with the day they run.
+const TODAY = '2026-11-04';
+
+const meta = {
+  title: 'Components/DatePicker',
+  component: DatePicker,
+  args: { today: TODAY, onValueChange: fn(), onOpenChange: fn() },
+  parameters: { stage: 'viewport' },
+} satisfies Meta<typeof DatePicker>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+const column = { placeSelf: 'start', display: 'grid', gap: 12, width: 260 } as const;
+const caption = {
+  fontSize: 'var(--flg-text-xs)',
+  color: 'var(--flg-text-muted)',
+  marginBottom: 6,
+} as const;
+
+const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
+
+/** The popup of the DatePicker in `root`, and whether the browser shows it. */
+const popupIn = (root: HTMLElement) => root.querySelector<HTMLElement>('.flg-date-picker-popup')!;
+const isShown = (root: HTMLElement) => popupIn(root).matches(':popover-open');
+const dayIn = (root: HTMLElement, iso: string) =>
+  root.querySelector<HTMLElement>(`button[data-date="${iso}"]`)!;
+const titleIn = (root: HTMLElement) => root.querySelector('.flg-calendar-title')!;
+
+/** The look of the mockup (D1): the frame of Input with the calendar button in it, three sizes. */
+export const Look: Story = {
+  render: () => (
+    <div style={{ ...column, gap: 16 }}>
+      <div>
+        <div style={caption}>With a value</div>
+        <DatePicker aria-label="Date, with a value" defaultValue="2026-11-14" today={TODAY} />
+      </div>
+      <div>
+        <div style={caption}>Empty, with the placeholder of the locale</div>
+        <DatePicker aria-label="Date, empty" today={TODAY} />
+      </div>
+      <div>
+        <div style={caption}>Vietnamese</div>
+        <DatePicker
+          aria-label="Date, Vietnamese"
+          defaultValue="2026-11-14"
+          locale="vi-VN"
+          weekStartsOn={1}
+          today={TODAY}
+        />
+      </div>
+      <div>
+        <div style={caption}>Small</div>
+        <DatePicker aria-label="Date, small" size="sm" defaultValue="2026-11-14" today={TODAY} />
+      </div>
+      <div>
+        <div style={caption}>Large</div>
+        <DatePicker aria-label="Date, large" size="lg" defaultValue="2026-11-14" today={TODAY} />
+      </div>
+      <div>
+        <div style={caption}>Disabled</div>
+        <DatePicker aria-label="Date, disabled" disabled defaultValue="2026-11-14" today={TODAY} />
+      </div>
+      <div>
+        <div style={caption}>Invalid</div>
+        <DatePicker aria-label="Date, invalid" invalid defaultValue="2026-11-14" today={TODAY} />
+      </div>
+      <Field
+        label="Check-in"
+        description="Write it as mm/dd/yyyy."
+        error="Pick a date from today on."
+        required
+      >
+        <DatePicker name="checkin" today={TODAY} />
+      </Field>
+    </div>
+  ),
+  play: async ({ canvas }) => {
+    const frame = (name: string) =>
+      canvas.getByRole('textbox', { name }).parentElement!.getBoundingClientRect();
+    // The heights of Input's three sizes.
+    await expect(
+      ['Date, small', 'Date, with a value', 'Date, large'].map((name) =>
+        Math.round(frame(name).height),
+      ),
+    ).toEqual([28, 34, 40]);
+    // The button is 24px at every size, with a 16px icon, at the end of the frame.
+    for (const name of ['Date, small', 'Date, with a value', 'Date, large']) {
+      const input = canvas.getByRole('textbox', { name });
+      const button = input.parentElement!.querySelector('button')!.getBoundingClientRect();
+      await expect([Math.round(button.width), Math.round(button.height)]).toEqual([24, 24]);
+      const icon = input.parentElement!.querySelector('svg')!.getBoundingClientRect();
+      await expect([Math.round(icon.width), Math.round(icon.height)]).toEqual([16, 16]);
+    }
+    await expect(canvas.getByRole('textbox', { name: 'Date, with a value' })).toHaveValue(
+      '11/14/2026',
+    );
+    await expect(canvas.getByRole('textbox', { name: 'Date, Vietnamese' })).toHaveValue(
+      '14/11/2026',
+    );
+    await expect(canvas.getByRole('textbox', { name: 'Date, empty' })).toHaveAttribute(
+      'placeholder',
+      'mm/dd/yyyy',
+    );
+    await expect(canvas.getByRole('textbox', { name: 'Date, invalid' })).toHaveAttribute(
+      'aria-invalid',
+      'true',
+    );
+    await expect(canvas.getByRole('textbox', { name: 'Check-in' })).toHaveAttribute(
+      'aria-invalid',
+      'true',
+    );
+    await expect(canvas.getByRole('textbox', { name: 'Date, disabled' })).toBeDisabled();
+  },
+};
+
+/** Open on November 2026, the 14th chosen, today the 4th: a glass popup 6px under the frame. */
+export const Open: Story = {
+  render: () => (
+    <div style={column}>
+      <Field label="Check-in" description="Write it as mm/dd/yyyy.">
+        <DatePicker defaultOpen defaultValue="2026-11-14" today={TODAY} />
+      </Field>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const input = canvas.getByRole('textbox', { name: 'Check-in' });
+    const popup = popupIn(canvasElement);
+    await settled(popup);
+    const frame = input.parentElement!;
+    const box = popup.getBoundingClientRect();
+    const frameBox = frame.getBoundingClientRect();
+    // Under the frame, 6px away, lined up with its start; 252px of calendar and 12px of padding.
+    await expect(Math.round(box.top - frameBox.bottom)).toBe(6);
+    await expect(Math.round(box.left)).toBe(Math.round(frameBox.left));
+    await expect(Math.round(box.width)).toBe(278);
+    await expect(
+      Math.round(canvasElement.querySelector('.flg-calendar')!.getBoundingClientRect().width),
+    ).toBe(252);
+    await expect(getComputedStyle(popup).paddingTop).toBe('12px');
+    await expect(getComputedStyle(popup).borderTopLeftRadius).toBe(
+      getComputedStyle(frame).borderTopLeftRadius,
+    );
+    // The frame is marked as an open Select is: an accent edge and a ring.
+    await expect(getComputedStyle(frame).outlineStyle).toBe('solid');
+    await expect(popup).toHaveAttribute('role', 'dialog');
+    await expect(titleIn(popup)).toHaveTextContent('November 2026');
+    await expect(dayIn(popup, '2026-11-14').closest('td')).toHaveAttribute('aria-selected', 'true');
+    // The calendar took the focus when it showed; the picture is of the look, not of a ring.
+    (document.activeElement as HTMLElement | null)?.blur();
+  },
+};
+
+/** Typing a date: it is read when the DatePicker is left, with the focus on its button or past it. */
+export const Typing: Story = {
+  tags: ['no-visual'],
+  render: (args) => (
+    <div style={column}>
+      <DatePicker aria-label="Check-in" {...args} />
+      <button type="button">Next</button>
+    </div>
+  ),
+  play: async ({ canvas, args }) => {
+    const user = (await realUserEvent()) ?? userEvent;
+    const input = canvas.getByRole('textbox', { name: 'Check-in' });
+    const hidden = input
+      .closest('.flg-date-picker')!
+      .querySelector<HTMLInputElement>('input[type="hidden"]')!;
+    await user.click(input);
+    await user.keyboard('1/2/26');
+    await expect(args.onValueChange).not.toHaveBeenCalled();
+    // The calendar button is part of the DatePicker: the text waits.
+    await user.tab();
+    await expect(canvas.getByRole('button', { name: 'Choose date' })).toHaveFocus();
+    await expect(args.onValueChange).not.toHaveBeenCalled();
+    await user.tab();
+    await expect(canvas.getByRole('button', { name: 'Next' })).toHaveFocus();
+    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-01-02');
+    // The text goes back in the format of the locale.
+    await expect(input).toHaveValue('01/02/2026');
+    await expect(hidden).toHaveValue('2026-01-02');
+
+    // Text that cannot be read stays, as typed, and the value stays.
+    await user.clear(input);
+    await user.keyboard('31/31/2026');
+    await user.tab({ shift: true });
+    await expect(input).toHaveValue('31/31/2026');
+    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
+    await expect(hidden).toHaveValue('2026-01-02');
+
+    // Empty text is no date.
+    await user.clear(input);
+    await user.tab();
+    await user.tab();
+    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
+    await expect(hidden).toHaveValue('');
+  },
+};
+
+/** The order of day, month and year is the locale's; any separator, two-digit years. */
+export const Locales: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={column}>
+      <DatePicker aria-label="English" today={TODAY} />
+      <DatePicker aria-label="Vietnamese" locale="vi-VN" weekStartsOn={1} today={TODAY} />
+      <DatePicker aria-label="German" locale="de-DE" weekStartsOn={1} today={TODAY} />
+      <button type="button">Next</button>
+    </div>
+  ),
+  play: async ({ canvas }) => {
+    const user = (await realUserEvent()) ?? userEvent;
+    const cases: Array<[string, string, string, string]> = [
+      ['English', 'mm/dd/yyyy', '3-5-26', '03/05/2026'],
+      ['Vietnamese', 'dd/mm/yyyy', '3.5.26', '03/05/2026'],
+      ['German', 'dd.mm.yyyy', '3/5/2026', '03.05.2026'],
+    ];
+    for (const [name, placeholder, typed, shown] of cases) {
+      const input = canvas.getByRole('textbox', { name });
+      await expect(input).toHaveAttribute('placeholder', placeholder);
+      await user.click(input);
+      await user.keyboard(typed);
+      await user.click(canvas.getByRole('button', { name: 'Next' }));
+      await waitFor(() => expect(input).toHaveValue(shown));
+    }
+    // The same digits are the 5th of March for the first and the 3rd of May for the other two.
+    const hiddenOf = (name: string) =>
+      canvas
+        .getByRole('textbox', { name })
+        .closest('.flg-date-picker')!
+        .querySelector<HTMLInputElement>('input[type="hidden"]')!;
+    await expect(hiddenOf('English')).toHaveValue('2026-03-05');
+    await expect(hiddenOf('Vietnamese')).toHaveValue('2026-05-03');
+    await expect(hiddenOf('German')).toHaveValue('2026-05-03');
+  },
+};
+
+/** The button and Alt+ArrowDown open the calendar, on the month of the date typed; Esc closes it. */
+export const Opening: Story = {
+  tags: ['no-visual'],
+  render: (args) => (
+    <div style={column}>
+      <DatePicker aria-label="Check-in" defaultValue="2026-11-14" {...args} />
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const input = canvas.getByRole('textbox', { name: 'Check-in' });
+    const button = canvas.getByRole('button', { name: 'Choose date' });
+    await expect(button).toHaveAttribute('aria-expanded', 'false');
+    // The button opens it, and the focus goes to the day with the tab stop: the chosen one.
+    await real.click(button);
+    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
+    await expect(button).toHaveAttribute('aria-expanded', 'true');
+    await expect(button).toHaveAttribute('aria-controls', popupIn(canvasElement).id);
+    await waitFor(() => expect(dayIn(canvasElement, '2026-11-14')).toHaveFocus());
+    // Esc is the browser's: it closes the popup and the focus goes back to the input.
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
+    await expect(button).toHaveAttribute('aria-expanded', 'false');
+    await waitFor(() => expect(input).toHaveFocus());
+    await expect(input).toHaveValue('11/14/2026');
+
+    // Alt+ArrowDown opens it from the input. The text that waits is read first: the calendar opens
+    // on its month, and the date is the value.
+    await real.click(input);
+    await real.clear(input);
+    await real.keyboard('03/05/2027');
+    await real.keyboard('{Alt>}{ArrowDown}{/Alt}');
+    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
+    await expect(titleIn(canvasElement)).toHaveTextContent('March 2027');
+    await waitFor(() => expect(dayIn(canvasElement, '2027-03-05')).toHaveFocus());
+    await expect(input).toHaveValue('03/05/2027');
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
+
+    // Text that cannot be read opens the month of the value, and stays as typed.
+    await real.clear(input);
+    await real.keyboard('garbage');
+    await real.keyboard('{Alt>}{ArrowDown}{/Alt}');
+    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
+    await expect(titleIn(canvasElement)).toHaveTextContent('March 2027');
+    await expect(input).toHaveValue('garbage');
+  },
+};
+
+/** Choosing with the keyboard: the keys of the grid, then Enter. The focus goes back to the input. */
+export const Keys: Story = {
+  tags: ['no-visual'],
+  render: (args) => (
+    <div style={column}>
+      <DatePicker aria-label="Check-in" {...args} />
+      <button type="button">Next</button>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement, args }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const input = canvas.getByRole('textbox', { name: 'Check-in' });
+    await real.click(input);
+    await real.keyboard('{Alt>}{ArrowDown}{/Alt}');
+    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
+    // No date yet: the focus is on today.
+    await waitFor(() => expect(dayIn(canvasElement, TODAY)).toHaveFocus());
+    await real.keyboard('{ArrowRight}{ArrowRight}{ArrowDown}');
+    await expect(dayIn(canvasElement, '2026-11-13')).toHaveFocus();
+    await real.keyboard('{Enter}');
+    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
+    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
+    await expect(args.onValueChange).toHaveBeenCalledWith('2026-11-13');
+    await expect(input).toHaveValue('11/13/2026');
+    await waitFor(() => expect(input).toHaveFocus());
+
+    // Open again: the focus is on the chosen day; Space chooses it, with nothing to report.
+    await real.keyboard('{Alt>}{ArrowDown}{/Alt}');
+    await waitFor(() => expect(dayIn(canvasElement, '2026-11-13')).toHaveFocus());
+    await real.keyboard(' ');
+    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
+    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
+    await waitFor(() => expect(input).toHaveFocus());
+  },
+};
+
+/** Tab out of the calendar closes it and leaves the focus where Tab sent it. */
+export const TabOut: Story = {
+  tags: ['no-visual'],
+  render: (args) => (
+    <div style={column}>
+      <DatePicker aria-label="Check-in" defaultValue="2026-11-14" {...args} />
+      <button type="button">Next</button>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const input = canvas.getByRole('textbox', { name: 'Check-in' });
+    const next = canvas.getByRole('button', { name: 'Next' });
+    await real.click(input);
+    await real.keyboard('{Alt>}{ArrowDown}{/Alt}');
+    await waitFor(() => expect(dayIn(canvasElement, '2026-11-14')).toHaveFocus());
+    await real.tab();
+    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
+    await expect(next).toHaveFocus();
+    await expect(input).toHaveValue('11/14/2026');
+
+    // Shift+Tab from the first control of the popup goes back to the calendar button, which is the
+    // DatePicker's own: the popup stays.
+    await real.click(input);
+    await real.keyboard('{Alt>}{ArrowDown}{/Alt}');
+    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
+    canvasElement.querySelector<HTMLElement>('.flg-calendar-header button')!.focus();
+    await real.tab({ shift: true });
+    await expect(canvas.getByRole('button', { name: 'Choose date' })).toHaveFocus();
+    await delay(50);
+    await expect(isShown(canvasElement)).toBe(true);
+  },
+};
+
+/** A press outside closes the calendar; a press on the open input closes it too. A day is chosen by a press. */
+export const Pointer: Story = {
+  tags: ['no-visual'],
+  render: (args) => (
+    <div style={column}>
+      <p>Elsewhere on the page</p>
+      <DatePicker aria-label="Check-in" defaultValue="2026-11-14" {...args} />
+    </div>
+  ),
+  play: async ({ canvas, canvasElement, args }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const input = canvas.getByRole('textbox', { name: 'Check-in' });
+    const button = canvas.getByRole('button', { name: 'Choose date' });
+    // Light dismiss on a press elsewhere.
+    await real.click(button);
+    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
+    await real.click(canvas.getByText('Elsewhere on the page'));
+    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
+    await expect(button).toHaveAttribute('aria-expanded', 'false');
+    await expect(args.onValueChange).not.toHaveBeenCalled();
+
+    // A press on the input closes it, and the focus is the input's.
+    await real.click(button);
+    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
+    await real.click(input);
+    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
+    await waitFor(() => expect(input).toHaveFocus());
+
+    // A press on the button while it is open closes it.
+    await real.click(button);
+    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
+    await real.click(button);
+    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
+
+    // A press on a day chooses it, closes the popup and puts the focus on the input.
+    await real.click(button);
+    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
+    await real.click(dayIn(canvasElement, '2026-11-18'));
+    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
+    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
+    await expect(args.onValueChange).toHaveBeenCalledWith('2026-11-18');
+    await expect(input).toHaveValue('11/18/2026');
+    await waitFor(() => expect(input).toHaveFocus());
+
+    // The day that is already chosen closes it too, and reports nothing.
+    await real.click(button);
+    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
+    await real.click(dayIn(canvasElement, '2026-11-18'));
+    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
+    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
+  },
+};
+
+/** The limits: days outside `min` and `max` and unavailable ones cannot be chosen, typed or pressed. */
+export const Limits: Story = {
+  tags: ['no-visual'],
+  render: (args) => (
+    <div style={column}>
+      <DatePicker
+        aria-label="Check-in"
+        defaultValue="2026-11-14"
+        min="2026-11-10"
+        max="2026-11-20"
+        isDateUnavailable={(date) => date === '2026-11-18'}
+        {...args}
+      />
+      <button type="button">Next</button>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement, args }) => {
+    const user = (await realUserEvent()) ?? userEvent;
+    const input = canvas.getByRole('textbox', { name: 'Check-in' });
+    // Typed: they stay as typed, and the value stays.
+    for (const text of ['11/09/2026', '11/21/2026', '11/18/2026']) {
+      await user.click(input);
+      await user.clear(input);
+      await user.keyboard(text);
+      await user.click(canvas.getByRole('button', { name: 'Next' }));
+      await expect(input).toHaveValue(text);
+    }
+    await expect(args.onValueChange).not.toHaveBeenCalled();
+    // Pressed: nothing happens, and the popup stays open.
+    await user.click(input);
+    await user.clear(input);
+    await user.keyboard('11/14/2026');
+    await userEvent.click(canvas.getByRole('button', { name: 'Choose date' }));
+    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
+    await expect(dayIn(canvasElement, '2026-11-18')).toHaveAttribute('aria-disabled', 'true');
+    await userEvent.click(dayIn(canvasElement, '2026-11-18'));
+    await userEvent.click(dayIn(canvasElement, '2026-11-09'));
+    await expect(isShown(canvasElement)).toBe(true);
+    await expect(args.onValueChange).not.toHaveBeenCalled();
+    await userEvent.click(dayIn(canvasElement, '2026-11-19'));
+    await expect(args.onValueChange).toHaveBeenCalledWith('2026-11-19');
+  },
+};
+
+/** Read-only: the text cannot be changed and the button opens nothing. */
+export const ReadOnly: Story = {
+  tags: ['no-visual'],
+  render: (args) => (
+    <div style={column}>
+      <DatePicker aria-label="Check-in" readOnly defaultValue="2026-11-14" {...args} />
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const user = (await realUserEvent()) ?? userEvent;
+    const input = canvas.getByRole('textbox', { name: 'Check-in' });
+    const button = canvas.getByRole('button', { name: 'Choose date' });
+    await expect(input).toHaveAttribute('readonly');
+    await expect(button).toHaveAttribute('aria-disabled', 'true');
+    // Playwright waits for an element that is `aria-disabled` to be enabled, so this press is
+    // synthetic, which is all the DatePicker sees of it.
+    await userEvent.click(button);
+    await user.click(input);
+    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
+    await delay(50);
+    await expect(isShown(canvasElement)).toBe(false);
+    await expect(input).toHaveValue('11/14/2026');
+  },
+};
+
+/** In a Dialog: Esc closes only the calendar, and a day chosen leaves the Dialog open. */
+export const InADialog: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <Dialog>
+      <DialogTrigger variant="secondary">Book a room</DialogTrigger>
+      <DialogContent size="sm">
+        <DialogTitle>Book a room</DialogTitle>
+        <Field label="Check-in">
+          <DatePicker defaultValue="2026-11-14" today={TODAY} />
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
+    await real.click(canvas.getByRole('button', { name: 'Book a room' }));
+    const dialog = canvasElement.querySelector('dialog')!;
+    await expect(dialog.open).toBe(true);
+    const input = within(dialog).getByRole('textbox', { name: 'Check-in' });
+    const button = within(dialog).getByRole('button', { name: 'Choose date' });
+    // Esc closes only the calendar, the topmost layer; the focus goes to the input.
+    await real.click(button);
+    await waitFor(() => expect(isShown(dialog)).toBe(true));
+    await waitFor(() => expect(dayIn(dialog, '2026-11-14')).toHaveFocus());
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(isShown(dialog)).toBe(false));
+    await delay(50);
+    await expect(dialog.open).toBe(true);
+    await waitFor(() => expect(input).toHaveFocus());
+    // Opened from the keyboard, the same.
+    await real.keyboard('{Alt>}{ArrowDown}{/Alt}');
+    await waitFor(() => expect(isShown(dialog)).toBe(true));
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(isShown(dialog)).toBe(false));
+    await delay(50);
+    await expect(dialog.open).toBe(true);
+    // A day chosen closes the calendar and keeps the Dialog.
+    await real.click(button);
+    await waitFor(() => expect(isShown(dialog)).toBe(true));
+    await real.click(dayIn(dialog, '2026-11-18'));
+    await waitFor(() => expect(isShown(dialog)).toBe(false));
+    await expect(input).toHaveValue('11/18/2026');
+    await expect(dialog.open).toBe(true);
+    // A press on the frame of the Dialog, outside the panel, closes only the calendar.
+    await real.click(button);
+    await waitFor(() => expect(isShown(dialog)).toBe(true));
+    await real.click(dialog, { position: { x: 4, y: 4 } });
+    await waitFor(() => expect(isShown(dialog)).toBe(false));
+    await delay(50);
+    await expect(dialog.open).toBe(true);
+    // A second Esc has nothing left to do in the DatePicker, so the Dialog closes.
+    await real.click(input);
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(dialog.open).toBe(false));
+  },
+};
+
+function BookingForm({ onSubmit }: { onSubmit: (data: Array<FormDataEntryValue | null>) => void }) {
+  return (
+    <form
+      aria-label="Booking"
+      style={column}
+      onSubmit={(event) => {
+        event.preventDefault();
+        const data = new FormData(event.currentTarget);
+        onSubmit([data.get('checkin'), data.get('checkout')]);
+      }}
+    >
+      <Field label="Check-in" description="Write it as mm/dd/yyyy." required>
+        <DatePicker name="checkin" defaultValue="2026-11-14" today={TODAY} />
+      </Field>
+      <Field label="Check-out" required>
+        <DatePicker name="checkout" today={TODAY} />
+      </Field>
+      <button type="submit">Book</button>
+    </form>
+  );
+}
+
+/** FormData through the hidden input, `required` on the text input, Enter and reset. */
+export const InAForm: Story = {
+  tags: ['no-visual'],
+  render: () => <BookingForm onSubmit={fn()} />,
+  play: async ({ canvas, canvasElement }) => {
+    const form = canvasElement.querySelector('form')!;
+    const checkin = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Check-in' });
+    const checkout = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Check-out' });
+    const user = (await realUserEvent()) ?? userEvent;
+    const sent: Array<Array<FormDataEntryValue | null>> = [];
+    form.addEventListener('submit', (event) => {
+      const data = new FormData(event.currentTarget as HTMLFormElement);
+      sent.push([data.get('checkin'), data.get('checkout')]);
+    });
+    const data = () => {
+      const all = new FormData(form);
+      return [all.get('checkin'), all.get('checkout')];
+    };
+
+    // The text input is the one that is required: a submit with it empty is stopped there, and the
+    // browser shows its bubble on it and focuses it.
+    await expect(checkout).toBeRequired();
+    await expect(data()).toEqual(['2026-11-14', '']);
+    form.requestSubmit();
+    await waitFor(() => expect(checkout).toHaveFocus());
+    await expect(checkout.validationMessage).not.toBe('');
+    await expect(sent).toHaveLength(0);
+
+    // Text that cannot be read: Enter leaves it and does not submit.
+    await user.keyboard('abc{Enter}');
+    await delay(50);
+    await expect(sent).toHaveLength(0);
+    await expect(checkout).toHaveValue('abc');
+
+    // Enter reads a date and the form submits that date, not the one from before the keystroke.
+    await user.clear(checkout);
+    await user.keyboard('11/20/2026{Enter}');
+    await waitFor(() => expect(sent).toHaveLength(1));
+    await expect(sent[0]).toEqual(['2026-11-14', '2026-11-20']);
+    await expect(checkout).toHaveValue('11/20/2026');
+
+    // A date typed and left is in FormData.
+    await user.clear(checkin);
+    await user.keyboard('12/25/2026');
+    await user.click(checkout);
+    await expect(data()).toEqual(['2026-12-25', '2026-11-20']);
+
+    // A day chosen in the calendar too.
+    const checkoutRoot = checkout.closest<HTMLElement>('.flg-date-picker')!;
+    await user.click(within(checkoutRoot).getByRole('button', { name: 'Choose date' }));
+    await waitFor(() => expect(isShown(checkoutRoot)).toBe(true));
+    await user.click(dayIn(checkoutRoot, '2026-11-22'));
+    await expect(data()).toEqual(['2026-12-25', '2026-11-22']);
+
+    // Reset: the one with a default goes back to it, the other to nothing.
+    form.reset();
+    await waitFor(() => expect(checkin).toHaveValue('11/14/2026'));
+    await waitFor(() => {
+      expect(checkout).toHaveValue('');
+      expect(data()).toEqual(['2026-11-14', '']);
+    });
+  },
+};
diff --git a/src/components/date-picker/DatePicker.test-d.ts b/src/components/date-picker/DatePicker.test-d.ts
new file mode 100644
index 0000000..8802f0b
--- /dev/null
+++ b/src/components/date-picker/DatePicker.test-d.ts
@@ -0,0 +1,46 @@
+import { expectTypeOf, test } from 'vitest';
+import type { DatePickerLabels, DatePickerProps } from './DatePicker';
+
+test('a DatePicker takes null for no date, and reports a string or null', () => {
+  expectTypeOf<DatePickerProps['value']>().toEqualTypeOf<string | null | undefined>();
+  expectTypeOf<DatePickerProps['defaultValue']>().toEqualTypeOf<string | undefined>();
+  expectTypeOf<DatePickerProps['onValueChange']>().toEqualTypeOf<
+    ((value: string | null) => void) | undefined
+  >();
+  const cleared: DatePickerProps = { value: null };
+  expectTypeOf(cleared).toBeObject();
+});
+
+test('a DatePicker accepts only the sizes of Input', () => {
+  expectTypeOf<DatePickerProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
+  // @ts-expect-error 'xl' is not a size
+  const unknownSize: DatePickerProps = { size: 'xl' };
+  expectTypeOf(unknownSize).toBeObject();
+});
+
+test('min and max are dates written as strings, never Date objects', () => {
+  expectTypeOf<DatePickerProps['min']>().toEqualTypeOf<string | undefined>();
+  expectTypeOf<DatePickerProps['max']>().toEqualTypeOf<string | undefined>();
+  // @ts-expect-error a Date is no ISO string
+  const dated: DatePickerProps = { min: new Date() };
+  expectTypeOf(dated).toBeObject();
+});
+
+test('the labels hold the calendar button, the dialog and the calendar words', () => {
+  expectTypeOf<DatePickerLabels>().toHaveProperty('openCalendar');
+  expectTypeOf<DatePickerLabels>().toHaveProperty('dialog');
+  expectTypeOf<DatePickerLabels>().toHaveProperty('previousMonth');
+  expectTypeOf<DatePickerLabels>().toHaveProperty('nextMonth');
+});
+
+test('the text input takes the HTML props of an input, the root takes className', () => {
+  const props: DatePickerProps = {
+    required: true,
+    readOnly: true,
+    name: 'checkin',
+    placeholder: 'Pick a day',
+    'aria-label': 'Check-in',
+    onBlur: () => {},
+  };
+  expectTypeOf(props).toBeObject();
+});
diff --git a/src/components/date-picker/DatePicker.test.tsx b/src/components/date-picker/DatePicker.test.tsx
new file mode 100644
index 0000000..92e769f
--- /dev/null
+++ b/src/components/date-picker/DatePicker.test.tsx
@@ -0,0 +1,863 @@
+import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
+import { createRef, useState } from 'react';
+import type { ComponentProps } from 'react';
+import { renderToString } from 'react-dom/server';
+import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
+import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
+import { Field } from '../field/Field';
+import { DatePicker } from './DatePicker';
+
+// jsdom has no Popover API. This stand-in is enough for the popup to render, as for a Combobox.
+const original = {
+  showPopover: HTMLElement.prototype.showPopover,
+  hidePopover: HTMLElement.prototype.hidePopover,
+};
+beforeAll(() => {
+  HTMLElement.prototype.showPopover = () => {};
+  HTMLElement.prototype.hidePopover = () => {};
+});
+afterAll(() => {
+  Object.assign(HTMLElement.prototype, original);
+});
+
+const input = () => screen.getByRole<HTMLInputElement>('textbox');
+const button = () => screen.getByRole<HTMLButtonElement>('button', { name: 'Choose date' });
+const hidden = () => document.querySelector<HTMLInputElement>('input[type="hidden"]')!;
+const popup = () => document.querySelector<HTMLElement>('.flg-date-picker-popup')!;
+const root = () => document.querySelector<HTMLElement>('.flg-date-picker')!;
+const day = (iso: string) => document.querySelector<HTMLElement>(`button[data-date="${iso}"]`)!;
+const title = () => document.querySelector('.flg-calendar-title')!.textContent;
+// jsdom has no Popover API, and takes the popup for hidden: its buttons are found by name anyway.
+const nextMonth = () => within(popup()).getByRole('button', { name: 'Next month', hidden: true });
+const isOpen = () => button().getAttribute('aria-expanded') === 'true';
+const type = (text: string) => fireEvent.change(input(), { target: { value: text } });
+const key = (name: string, init: Partial<KeyboardEventInit> = {}) =>
+  fireEvent.keyDown(input(), { key: name, ...init });
+// The input has the focus before it is left, as in a browser; a blur of an input without it does nothing.
+const leave = () =>
+  act(() => {
+    input().focus();
+    input().blur();
+  });
+const aTaskLater = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
+
+/** A DatePicker on a fixed "today", so no test depends on the day it runs. */
+function DP(props: Partial<ComponentProps<typeof DatePicker>>) {
+  return <DatePicker aria-label="Check-in" today="2026-11-04" {...props} />;
+}
+
+describe('DatePicker', () => {
+  beforeEach(() => {
+    resetDevWarnings();
+    // jsdom's document has no focus once the input is blurred, which would read as a window switch.
+    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
+  });
+  afterEach(() => {
+    vi.restoreAllMocks();
+    vi.useRealTimers();
+    cleanup();
+  });
+
+  describe('markup and ARIA', () => {
+    it('renders the text, the hidden value and a closed popup on the server', () => {
+      const html = renderToString(<DP name="checkin" defaultValue="2026-11-14" />);
+      const doc = new DOMParser().parseFromString(html, 'text/html');
+      expect(doc.querySelector<HTMLInputElement>('input[type="text"]')?.value).toBe('11/14/2026');
+      expect(doc.querySelector<HTMLInputElement>('input[type="hidden"]')?.value).toBe('2026-11-14');
+      expect(doc.querySelector('.flg-calendar')).toBeNull();
+    });
+
+    it('is a frame holding the text input and the calendar button, then the hidden input and popup', () => {
+      render(<DP name="checkin" size="lg" />);
+      expect(root().children).toHaveLength(3);
+      const frame = root().querySelector('.flg-input')!;
+      expect(frame).toHaveAttribute('data-size', 'lg');
+      expect(root()).toHaveAttribute('data-size', 'lg');
+      expect(Array.from(frame.children)).toEqual([input(), button()]);
+      expect(input()).toHaveAttribute('type', 'text');
+      expect(input()).toHaveAttribute('autocomplete', 'off');
+      expect(hidden()).toHaveAttribute('name', 'checkin');
+      expect(input()).not.toHaveAttribute('name');
+      expect(root().children[1]).toBe(hidden());
+      expect(root().children[2]).toBe(popup());
+    });
+
+    it('takes the pattern of the locale as its placeholder, unless one is given', () => {
+      const { rerender } = render(<DP />);
+      expect(input()).toHaveAttribute('placeholder', 'mm/dd/yyyy');
+      rerender(<DP locale="vi-VN" />);
+      expect(input()).toHaveAttribute('placeholder', 'dd/mm/yyyy');
+      rerender(<DP locale="de-DE" />);
+      expect(input()).toHaveAttribute('placeholder', 'dd.mm.yyyy');
+      rerender(<DP placeholder="Pick a day" />);
+      expect(input()).toHaveAttribute('placeholder', 'Pick a day');
+    });
+
+    it('sends ref, id, required, aria-* and the other HTML props to the text input', () => {
+      const ref = createRef<HTMLInputElement>();
+      render(
+        <DatePicker
+          aria-label="Check-in"
+          ref={ref}
+          id="checkin"
+          required
+          aria-describedby="hint"
+          title="When?"
+          className="mine"
+          style={{ width: 200 }}
+        />,
+      );
+      expect(ref.current).toBe(input());
+      expect(input()).toHaveAttribute('id', 'checkin');
+      expect(input()).toBeRequired();
+      expect(input()).toHaveAttribute('aria-describedby', 'hint');
+      expect(input()).toHaveAttribute('title', 'When?');
+      // className and style belong to the element around.
+      expect(root()).toHaveClass('flg-date-picker', 'mine');
+      expect(root()).toHaveStyle({ width: '200px' });
+      expect(input()).not.toHaveClass('mine');
+    });
+
+    it('marks the frame invalid and disabled', () => {
+      render(<DP invalid disabled />);
+      expect(root()).toHaveAttribute('data-invalid');
+      expect(root()).toHaveAttribute('data-disabled');
+      expect(root().querySelector('.flg-input')).toHaveAttribute('data-invalid');
+      expect(input()).toHaveAttribute('aria-invalid', 'true');
+    });
+
+    it('has a calendar button that follows the input in the Tab order and names the dialog', () => {
+      render(<DP />);
+      expect(button()).toHaveAttribute('type', 'button');
+      expect(button()).not.toHaveAttribute('tabindex');
+      expect(button()).toHaveAttribute('aria-haspopup', 'dialog');
+      expect(button()).toHaveAttribute('aria-expanded', 'false');
+      expect(button()).toHaveAttribute('aria-controls', popup().id);
+      expect(button()).toHaveClass('flg-date-picker-button');
+      expect(button().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
+    });
+
+    it('has a popup that is a non-modal dialog with a Calendar in it only while open', () => {
+      render(<DP />);
+      expect(popup()).toHaveAttribute('popover', 'auto');
+      expect(popup()).toHaveAttribute('role', 'dialog');
+      expect(popup()).toHaveAttribute('aria-label', 'Choose date');
+      expect(popup()).toHaveClass('flg-surface', 'flg-date-picker-popup');
+      expect(popup()).not.toHaveAttribute('aria-modal');
+      expect(popup().querySelector('.flg-calendar')).toBeNull();
+      fireEvent.click(button());
+      expect(popup().querySelector('.flg-calendar')).not.toBeNull();
+    });
+
+    it('takes every word from labels', () => {
+      render(
+        <DP
+          labels={{
+            openCalendar: 'Mở lịch',
+            dialog: 'Chọn ngày',
+            previousMonth: 'Tháng trước',
+            nextMonth: 'Tháng sau',
+          }}
+        />,
+      );
+      const open = screen.getByRole('button', { name: 'Mở lịch' });
+      expect(popup()).toHaveAttribute('aria-label', 'Chọn ngày');
+      fireEvent.click(open);
+      expect(
+        within(popup()).getByRole('button', { name: 'Tháng trước', hidden: true }),
+      ).toBeInTheDocument();
+      expect(
+        within(popup()).getByRole('button', { name: 'Tháng sau', hidden: true }),
+      ).toBeInTheDocument();
+    });
+  });
+
+  describe('the text and the value', () => {
+    it('shows the date of defaultValue and of value in the locale', () => {
+      render(<DP defaultValue="2026-11-14" />);
+      expect(input()).toHaveValue('11/14/2026');
+      cleanup();
+      const { rerender } = render(
+        <DP locale="vi-VN" value="2026-11-14" onValueChange={() => {}} />,
+      );
+      expect(input()).toHaveValue('14/11/2026');
+      rerender(<DP locale="de-DE" value="2026-11-14" onValueChange={() => {}} />);
+      expect(input()).toHaveValue('14.11.2026');
+    });
+
+    it('reads typed text when the input is left, and writes the date back in the format', () => {
+      const onValueChange = vi.fn();
+      render(<DP name="d" onValueChange={onValueChange} />);
+      act(() => input().focus());
+      type('1/2/26');
+      expect(onValueChange).not.toHaveBeenCalled();
+      leave();
+      expect(onValueChange).toHaveBeenCalledTimes(1);
+      expect(onValueChange).toHaveBeenCalledWith('2026-01-02');
+      expect(input()).toHaveValue('01/02/2026');
+      expect(hidden()).toHaveValue('2026-01-02');
+    });
+
+    it('reads in the order of the locale: vi-VN and de-DE, any separator, two-digit years', () => {
+      const onValueChange = vi.fn();
+      const { rerender } = render(<DP locale="vi-VN" onValueChange={onValueChange} />);
+      type('14-11-2026');
+      leave();
+      expect(onValueChange).toHaveBeenLastCalledWith('2026-11-14');
+      expect(input()).toHaveValue('14/11/2026');
+      rerender(<DP locale="de-DE" onValueChange={onValueChange} />);
+      expect(input()).toHaveValue('14.11.2026');
+      type('3 5 26');
+      leave();
+      expect(onValueChange).toHaveBeenLastCalledWith('2026-05-03');
+      expect(input()).toHaveValue('03.05.2026');
+    });
+
+    it('turns empty text into null, and reports it when there was a date', () => {
+      const onValueChange = vi.fn();
+      render(<DP name="d" defaultValue="2026-11-14" onValueChange={onValueChange} />);
+      type('   ');
+      leave();
+      expect(onValueChange).toHaveBeenCalledWith(null);
+      expect(input()).toHaveValue('');
+      expect(hidden()).toHaveValue('');
+      // Empty text over no date is no change.
+      onValueChange.mockClear();
+      leave();
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('keeps text it cannot read, and the value', () => {
+      const onValueChange = vi.fn();
+      render(<DP defaultValue="2026-11-14" onValueChange={onValueChange} />);
+      for (const text of ['abc', '2/30/2026', '11/14', '11/14/202']) {
+        type(text);
+        leave();
+        expect(input()).toHaveValue(text);
+      }
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(hidden()).toHaveValue('2026-11-14');
+    });
+
+    it('keeps a date that cannot be chosen (before min, after max, unavailable), and the value', () => {
+      const onValueChange = vi.fn();
+      render(
+        <DP
+          defaultValue="2026-11-14"
+          min="2026-11-10"
+          max="2026-11-20"
+          isDateUnavailable={(date) => date === '2026-11-18'}
+          onValueChange={onValueChange}
+        />,
+      );
+      for (const text of ['11/09/2026', '11/21/2026', '11/18/2026']) {
+        type(text);
+        leave();
+        expect(input()).toHaveValue(text);
+      }
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(hidden()).toHaveValue('2026-11-14');
+      type('11/19/2026');
+      leave();
+      expect(onValueChange).toHaveBeenCalledWith('2026-11-19');
+    });
+
+    it('does not read the text when focus goes to its own button or into the popup', () => {
+      const onValueChange = vi.fn();
+      render(<DP onValueChange={onValueChange} />);
+      type('11/14/2026');
+      fireEvent.blur(input(), { relatedTarget: button() });
+      expect(onValueChange).not.toHaveBeenCalled();
+      fireEvent.blur(input(), { relatedTarget: popup() });
+      expect(onValueChange).not.toHaveBeenCalled();
+      leave();
+      expect(onValueChange).toHaveBeenCalledWith('2026-11-14');
+    });
+
+    it('reads the text once focus goes on past the calendar button', () => {
+      const onValueChange = vi.fn();
+      render(
+        <>
+          <DP onValueChange={onValueChange} />
+          <button type="button">Next</button>
+        </>,
+      );
+      act(() => input().focus());
+      type('11/14/2026');
+      act(() => button().focus());
+      expect(onValueChange).not.toHaveBeenCalled();
+      act(() => screen.getByRole('button', { name: 'Next' }).focus());
+      expect(onValueChange).toHaveBeenCalledWith('2026-11-14');
+      expect(input()).toHaveValue('11/14/2026');
+    });
+
+    it('does not read the text when another window takes the focus', () => {
+      const onValueChange = vi.fn();
+      render(<DP onValueChange={onValueChange} />);
+      type('11/14/2026');
+      vi.spyOn(document, 'hasFocus').mockReturnValue(false);
+      leave();
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('reads the text on Enter, and the form submits unless the text stays', () => {
+      const onValueChange = vi.fn();
+      render(<DP defaultValue="2026-11-14" onValueChange={onValueChange} />);
+      // A date that changes the value is read, and Enter is left to the browser: the form submits it.
+      type('11/20/2026');
+      expect(key('Enter')).toBe(true);
+      expect(onValueChange).toHaveBeenCalledWith('2026-11-20');
+      expect(input()).toHaveValue('11/20/2026');
+      // Text that stays unread must not submit the form with the old date next to it.
+      type('abc');
+      expect(key('Enter')).toBe(false);
+      expect(input()).toHaveValue('abc');
+      type('11/30/2099');
+      expect(key('Enter')).toBe(true);
+      // A date that cannot be chosen is no more submitted than text that cannot be read.
+      cleanup();
+      render(<DP min="2026-11-10" />);
+      type('11/09/2026');
+      expect(key('Enter')).toBe(false);
+      // The same date in another spelling is no change; it is written back in the format.
+      cleanup();
+      render(<DP defaultValue="2026-11-14" onValueChange={onValueChange} />);
+      onValueChange.mockClear();
+      type('11/14/26');
+      expect(key('Enter')).toBe(true);
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(input()).toHaveValue('11/14/2026');
+    });
+
+    it('writes the hidden input on Enter, before a render, for the form that submits right after', async () => {
+      // A parent that refuses the change never renders the new value: the hidden input shows what
+      // Enter wrote until the task after the keydown, when the submit has read it.
+      render(<DP name="d" value="2026-11-14" onValueChange={() => {}} />);
+      type('11/20/2026');
+      key('Enter');
+      expect(hidden()).toHaveValue('2026-11-20');
+      await aTaskLater();
+      expect(hidden()).toHaveValue('2026-11-14');
+    });
+
+    it('leaves Enter and the text alone while read-only', () => {
+      const onValueChange = vi.fn();
+      render(<DP readOnly defaultValue="2026-11-14" onValueChange={onValueChange} />);
+      expect(input()).toHaveAttribute('readonly');
+      expect(key('Enter')).toBe(true);
+      leave();
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('follows a value that the parent changes, without reporting it', () => {
+      const onValueChange = vi.fn();
+      function Parent() {
+        const [value, setValue] = useState<string | null>('2026-11-14');
+        return (
+          <>
+            <button type="button" onClick={() => setValue('2026-12-25')}>
+              Set
+            </button>
+            <button type="button" onClick={() => setValue(null)}>
+              Clear
+            </button>
+            <DP
+              value={value}
+              onValueChange={(next) => {
+                onValueChange(next);
+                setValue(next);
+              }}
+            />
+          </>
+        );
+      }
+      render(<Parent />);
+      fireEvent.click(screen.getByRole('button', { name: 'Set' }));
+      expect(input()).toHaveValue('12/25/2026');
+      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
+      expect(input()).toHaveValue('');
+      expect(hidden()).toHaveValue('');
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+  });
+
+  describe('opening', () => {
+    it('opens on the button, and puts focus on the day with the tab stop', () => {
+      const onOpenChange = vi.fn();
+      render(<DP defaultValue="2026-11-14" onOpenChange={onOpenChange} />);
+      fireEvent.click(button());
+      expect(isOpen()).toBe(true);
+      expect(onOpenChange).toHaveBeenCalledWith(true);
+      expect(day('2026-11-14')).toHaveFocus();
+      expect(day('2026-11-14').closest('td')).toHaveAttribute('aria-selected', 'true');
+    });
+
+    it('opens on Alt+ArrowDown in the input, and on nothing else', () => {
+      render(<DP />);
+      expect(key('ArrowDown')).toBe(true);
+      expect(isOpen()).toBe(false);
+      expect(key('ArrowDown', { altKey: true, ctrlKey: true })).toBe(true);
+      expect(isOpen()).toBe(false);
+      // The key is the DatePicker's: the page must not scroll.
+      expect(key('ArrowDown', { altKey: true })).toBe(false);
+      expect(isOpen()).toBe(true);
+      // Without a value or a month the focus lands on today.
+      expect(day('2026-11-04')).toHaveFocus();
+    });
+
+    it('focuses today when it is read from the clock, after the first render', () => {
+      vi.useFakeTimers({ toFake: ['Date'] });
+      vi.setSystemTime(new Date(2027, 2, 9, 12));
+      render(<DatePicker aria-label="Check-in" />);
+      fireEvent.click(button());
+      expect(title()).toBe('March 2027');
+      expect(day('2027-03-09')).toHaveFocus();
+    });
+
+    it('closes on the button when it is open', () => {
+      render(<DP />);
+      fireEvent.click(button());
+      expect(isOpen()).toBe(true);
+      fireEvent.click(button());
+      expect(isOpen()).toBe(false);
+    });
+
+    it('opens on the month of the value', () => {
+      render(<DP defaultValue="2027-02-03" />);
+      fireEvent.click(button());
+      expect(title()).toBe('February 2027');
+    });
+
+    it('opens on today when there is no value, and on a fresh month each time', () => {
+      render(<DP />);
+      fireEvent.click(button());
+      expect(title()).toBe('November 2026');
+      fireEvent.click(nextMonth());
+      expect(title()).toBe('December 2026');
+      fireEvent.click(button());
+      fireEvent.click(button());
+      expect(title()).toBe('November 2026');
+    });
+
+    it('reads the typed text first, and opens on its month', () => {
+      const onValueChange = vi.fn();
+      render(<DP defaultValue="2026-11-14" onValueChange={onValueChange} />);
+      type('03/05/2027');
+      fireEvent.click(button());
+      expect(onValueChange).toHaveBeenCalledWith('2027-03-05');
+      expect(title()).toBe('March 2027');
+      expect(day('2027-03-05')).toHaveFocus();
+      expect(input()).toHaveValue('03/05/2027');
+    });
+
+    it('opens on the month of the value when the text cannot be read or chosen', () => {
+      render(<DP defaultValue="2026-11-14" max="2026-12-31" />);
+      type('garbage');
+      fireEvent.click(button());
+      expect(title()).toBe('November 2026');
+      expect(input()).toHaveValue('garbage');
+      fireEvent.click(button());
+      type('03/05/2027');
+      fireEvent.click(button());
+      expect(title()).toBe('November 2026');
+      expect(input()).toHaveValue('03/05/2027');
+    });
+
+    it('opens on the month of today when the text cannot be read and there is no value', () => {
+      render(<DP today="2026-08-20" />);
+      type('garbage');
+      key('ArrowDown', { altKey: true });
+      expect(title()).toBe('August 2026');
+    });
+
+    it('hands the Calendar its limits, locale and words', () => {
+      render(
+        <DP
+          defaultValue="2026-11-14"
+          locale="vi-VN"
+          weekStartsOn={1}
+          min="2026-11-10"
+          max="2026-11-20"
+          isDateUnavailable={(date) => date === '2026-11-18'}
+        />,
+      );
+      fireEvent.click(button());
+      expect(title()).toBe('tháng 11 năm 2026');
+      expect(day('2026-11-09')).toHaveAttribute('aria-disabled', 'true');
+      expect(day('2026-11-18')).toHaveAttribute('aria-disabled', 'true');
+      expect(day('2026-11-21')).toHaveAttribute('aria-disabled', 'true');
+      expect(day('2026-11-19')).not.toHaveAttribute('aria-disabled');
+      // The week starts on Monday: the first column is Thứ Hai.
+      expect(document.querySelector('.flg-calendar-weekday')).toHaveTextContent('Thứ Hai');
+    });
+
+    it('opens by defaultOpen, and asks a controlling parent instead of opening', () => {
+      render(<DP defaultOpen />);
+      expect(isOpen()).toBe(true);
+      cleanup();
+      const onOpenChange = vi.fn();
+      render(<DP open={false} onOpenChange={onOpenChange} />);
+      expect(isOpen()).toBe(false);
+      fireEvent.click(button());
+      expect(onOpenChange).toHaveBeenCalledWith(true);
+      expect(isOpen()).toBe(false);
+    });
+
+    it('closes when it becomes disabled while open', () => {
+      const { rerender } = render(<DP />);
+      fireEvent.click(button());
+      rerender(<DP disabled />);
+      expect(isOpen()).toBe(false);
+    });
+  });
+
+  describe('in the popup', () => {
+    it('chooses a day: the value, the text, the popup closed, the focus on the input', () => {
+      const onValueChange = vi.fn();
+      const onOpenChange = vi.fn();
+      render(<DP name="d" onValueChange={onValueChange} onOpenChange={onOpenChange} />);
+      fireEvent.click(button());
+      fireEvent.click(day('2026-11-18'));
+      expect(onValueChange).toHaveBeenCalledTimes(1);
+      expect(onValueChange).toHaveBeenCalledWith('2026-11-18');
+      expect(input()).toHaveValue('11/18/2026');
+      expect(hidden()).toHaveValue('2026-11-18');
+      expect(isOpen()).toBe(false);
+      expect(onOpenChange).toHaveBeenLastCalledWith(false);
+      expect(popup().querySelector('.flg-calendar')).toBeNull();
+      expect(input()).toHaveFocus();
+    });
+
+    it('closes on the day that is already chosen, with nothing reported, and writes the text again', () => {
+      const onValueChange = vi.fn();
+      render(<DP defaultValue="2026-11-14" onValueChange={onValueChange} />);
+      type('11/14/26');
+      fireEvent.click(button());
+      expect(input()).toHaveValue('11/14/2026');
+      type('11/14/26');
+      fireEvent.click(day('2026-11-14'));
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(isOpen()).toBe(false);
+      expect(input()).toHaveValue('11/14/2026');
+      expect(input()).toHaveFocus();
+    });
+
+    it('chooses with the keyboard: Enter on a day', () => {
+      const onValueChange = vi.fn();
+      render(<DP defaultValue="2026-11-14" onValueChange={onValueChange} />);
+      fireEvent.click(button());
+      fireEvent.keyDown(day('2026-11-14'), { key: 'ArrowRight' });
+      expect(day('2026-11-15')).toHaveFocus();
+      // The browser turns Enter on a button into a click.
+      fireEvent.click(day('2026-11-15'));
+      expect(onValueChange).toHaveBeenCalledWith('2026-11-15');
+      expect(isOpen()).toBe(false);
+    });
+
+    it('does not choose a day that cannot be chosen, and stays open', () => {
+      const onValueChange = vi.fn();
+      render(<DP min="2026-11-10" onValueChange={onValueChange} />);
+      fireEvent.click(button());
+      fireEvent.click(day('2026-11-05'));
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(isOpen()).toBe(true);
+    });
+
+    it('does not choose when a month button is pressed, and keeps the popup open', () => {
+      render(<DP />);
+      fireEvent.click(button());
+      fireEvent.click(nextMonth());
+      expect(isOpen()).toBe(true);
+      expect(title()).toBe('December 2026');
+    });
+
+    it('goes back to the input, with the value kept, when the browser closes it on Esc', () => {
+      const onOpenChange = vi.fn();
+      render(<DP defaultValue="2026-11-14" onOpenChange={onOpenChange} />);
+      fireEvent.click(button());
+      expect(day('2026-11-14')).toHaveFocus();
+      // The browser closes a `popover="auto"` on Esc and says so with these two events.
+      const closed = (type: string) => {
+        const event = new Event(type);
+        Object.assign(event, { newState: 'closed', oldState: 'open' });
+        popup().dispatchEvent(event);
+      };
+      act(() => {
+        closed('beforetoggle');
+        closed('toggle');
+      });
+      expect(isOpen()).toBe(false);
+      expect(onOpenChange).toHaveBeenLastCalledWith(false);
+      expect(input()).toHaveFocus();
+      expect(input()).toHaveValue('11/14/2026');
+    });
+
+    it('closes when focus leaves it for anything but the input or the button, and keeps no focus', async () => {
+      render(
+        <>
+          <DP defaultValue="2026-11-14" />
+          <button type="button">Elsewhere</button>
+        </>,
+      );
+      fireEvent.click(button());
+      expect(day('2026-11-14')).toHaveFocus();
+      const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
+      act(() => elsewhere.focus());
+      // A task later, when the focus has arrived: it must not be sent back to the input.
+      await aTaskLater();
+      expect(isOpen()).toBe(false);
+      expect(elsewhere).toHaveFocus();
+    });
+
+    it('stays open while focus moves inside, to nowhere, or to the calendar button', async () => {
+      render(<DP defaultValue="2026-11-14" />);
+      fireEvent.click(button());
+      act(() => nextMonth().focus());
+      expect(isOpen()).toBe(true);
+      // A press on a day that takes no focus (Safari) or on a blank part leaves focus nowhere.
+      fireEvent.blur(nextMonth(), { relatedTarget: null });
+      expect(isOpen()).toBe(true);
+      fireEvent.blur(nextMonth(), {
+        relatedTarget: button(),
+      });
+      await aTaskLater();
+      expect(isOpen()).toBe(true);
+    });
+  });
+
+  describe('read-only and disabled', () => {
+    it('shows the button as aria-disabled when read-only, and opens nothing', () => {
+      render(<DP readOnly defaultValue="2026-11-14" />);
+      expect(button()).toHaveAttribute('aria-disabled', 'true');
+      expect(button()).not.toBeDisabled();
+      fireEvent.click(button());
+      expect(isOpen()).toBe(false);
+      expect(key('ArrowDown', { altKey: true })).toBe(false);
+      expect(isOpen()).toBe(false);
+    });
+
+    it('disables the text input, the button and the hidden input together', () => {
+      const { container } = render(
+        <form>
+          <DP name="d" disabled defaultValue="2026-11-14" />
+        </form>,
+      );
+      expect(input()).toBeDisabled();
+      expect(button()).toBeDisabled();
+      expect(hidden()).toBeDisabled();
+      expect(new FormData(container.querySelector('form')!).get('d')).toBeNull();
+      fireEvent.click(button());
+      expect(isOpen()).toBe(false);
+    });
+  });
+
+  describe('in a form', () => {
+    function FormOf(props: Partial<ComponentProps<typeof DatePicker>> = {}) {
+      return (
+        <form>
+          <DP name="checkin" {...props} />
+        </form>
+      );
+    }
+    const dataOf = (form: HTMLFormElement) => new FormData(form).get('checkin');
+
+    it('submits the ISO date through the hidden input, and the empty string for no date', () => {
+      const { container } = render(<FormOf defaultValue="2026-11-14" />);
+      const form = container.querySelector('form')!;
+      expect(dataOf(form)).toBe('2026-11-14');
+      type('');
+      leave();
+      expect(dataOf(form)).toBe('');
+      type('02/03/2027');
+      leave();
+      expect(dataOf(form)).toBe('2027-02-03');
+    });
+
+    it('follows a day chosen in the calendar', () => {
+      const { container } = render(<FormOf />);
+      fireEvent.click(button());
+      fireEvent.click(day('2026-11-18'));
+      expect(dataOf(container.querySelector('form')!)).toBe('2026-11-18');
+    });
+
+    it('stops the submit while required and empty, on the text input, not on the hidden one', () => {
+      const { container } = render(<FormOf required />);
+      const form = container.querySelector('form')!;
+      expect(input()).toBeRequired();
+      expect(hidden()).not.toHaveAttribute('required');
+      expect(form.checkValidity()).toBe(false);
+      type('11/14/2026');
+      leave();
+      expect(form.checkValidity()).toBe(true);
+    });
+
+    it('resets an uncontrolled value to defaultValue, and the text to that date', async () => {
+      const { container } = render(<FormOf defaultValue="2026-11-14" />);
+      const form = container.querySelector('form')!;
+      type('12/25/2026');
+      leave();
+      expect(dataOf(form)).toBe('2026-12-25');
+      form.reset();
+      await aTaskLater();
+      expect(input()).toHaveValue('11/14/2026');
+      expect(dataOf(form)).toBe('2026-11-14');
+    });
+
+    it('resets to nothing without a default, and drops text that was never read', async () => {
+      const { container } = render(<FormOf />);
+      const form = container.querySelector('form')!;
+      type('abc');
+      leave();
+      form.reset();
+      await aTaskLater();
+      expect(input()).toHaveValue('');
+      expect(dataOf(form)).toBe('');
+    });
+
+    it('drops unread text on reset when the value is already the default', async () => {
+      const { container } = render(<FormOf defaultValue="2026-11-14" />);
+      type('garbage');
+      leave();
+      container.querySelector('form')!.reset();
+      await aTaskLater();
+      expect(input()).toHaveValue('11/14/2026');
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
+          <DP name="checkin" defaultValue="2026-11-14" />
+        </form>,
+      );
+      const form = input().closest('form')!;
+      type('12/25/2026');
+      leave();
+      form.reset();
+      await aTaskLater();
+      expect(input()).toHaveValue('12/25/2026');
+      expect(dataOf(form)).toBe('2026-12-25');
+      allowReset = true;
+      form.reset();
+      await aTaskLater();
+      expect(input()).toHaveValue('11/14/2026');
+      expect(dataOf(form)).toBe('2026-11-14');
+    });
+
+    it('keeps a controlled value on reset, and puts its text back', async () => {
+      const { container } = render(
+        <FormOf value="2026-11-14" onValueChange={() => {}} defaultValue="2026-01-01" />,
+      );
+      const form = container.querySelector('form')!;
+      type('garbage');
+      form.reset();
+      await aTaskLater();
+      expect(input()).toHaveValue('11/14/2026');
+      expect(dataOf(form)).toBe('2026-11-14');
+    });
+  });
+
+  describe('in a Field', () => {
+    it('takes its id, description and invalid state from the Field, and has its label', () => {
+      render(
+        <Field label="Check-in" description="Write it mm/dd/yyyy." error="Pick a later date.">
+          <DatePicker today="2026-11-04" />
+        </Field>,
+      );
+      const field = screen.getByRole('textbox', { name: 'Check-in' });
+      expect(field).toBe(input());
+      expect(document.querySelector('label')).toHaveAttribute('for', input().id);
+      expect(input()).toHaveAttribute('aria-invalid', 'true');
+      const described = input().getAttribute('aria-describedby')!.split(' ');
+      expect(described).toHaveLength(2);
+      expect(root()).toHaveAttribute('data-invalid');
+      expect(screen.getByText('Write it mm/dd/yyyy.').id).toBe(described[0]);
+      expect(screen.getByText('Pick a later date.').id).toBe(described[1]);
+    });
+
+    it('takes required and disabled from the Field', () => {
+      render(
+        <Field label="Check-in" required disabled>
+          <DatePicker name="d" />
+        </Field>,
+      );
+      expect(input()).toBeRequired();
+      expect(input()).toBeDisabled();
+      expect(button()).toBeDisabled();
+      expect(hidden()).toBeDisabled();
+    });
+  });
+
+  describe('dev warnings', () => {
+    it('ignores a date that is no ISO date, and says which prop', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(
+        <DP
+          defaultValue="14/11/2026"
+          min="soon"
+          max="2026-02-30"
+          today="today"
+          onValueChange={() => {}}
+        />,
+      );
+      // The prefix, escaped for a regular expression.
+      const prefix = WARN_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
+      for (const name of ['defaultValue', 'min', 'max', 'today']) {
+        expect(warn).toHaveBeenCalledWith(
+          expect.stringMatching(
+            new RegExp(`^${prefix} DatePicker: ${name} ".*" is not a date written`),
+          ),
+        );
+      }
+      expect(input()).toHaveValue('');
+      // Ignored dates limit nothing, and today is read from the clock.
+      type('01/01/2000');
+      leave();
+      expect(input()).toHaveValue('01/01/2000');
+      expect(hidden()).toHaveValue('2000-01-01');
+    });
+
+    it('treats an invalid value as a controlled DatePicker with no date', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(<DP value="2026-13-01" onValueChange={() => {}} />);
+      expect(warn).toHaveBeenCalledWith(
+        WARN_PREFIX +
+          ' DatePicker: value "2026-13-01" is not a date written YYYY-MM-DD; it is ignored.',
+      );
+      expect(input()).toHaveValue('');
+    });
+
+    it('warns when min is after max, and ignores both', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(<DP min="2026-12-01" max="2026-11-01" />);
+      expect(warn).toHaveBeenCalledWith(
+        WARN_PREFIX + ' DatePicker: min (2026-12-01) is after max (2026-11-01); both are ignored.',
+      );
+      type('11/14/2026');
+      leave();
+      expect(hidden()).toHaveValue('2026-11-14');
+    });
+
+    it('names the prop that switches between controlled and not', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const { rerender } = render(<DP defaultValue="2026-11-14" />);
+      rerender(<DP value="2026-11-14" open={false} onValueChange={() => {}} />);
+      expect(warn).toHaveBeenCalledWith(
+        expect.stringMatching(/\] DatePicker value is changing from/),
+      );
+      expect(warn).toHaveBeenCalledWith(
+        expect.stringMatching(/\] DatePicker open is changing from/),
+      );
+    });
+
+    it('says nothing for dates that are fine', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(<DP defaultValue="2026-11-14" min="2026-11-01" max="2026-11-30" />);
+      expect(warn).not.toHaveBeenCalled();
+    });
+  });
+});
diff --git a/src/index.test.ts b/src/index.test.ts
index 671479f..5968991 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -29,6 +29,7 @@ describe('public API', () => {
       'ContextMenu',
       'ContextMenuContent',
       'ContextMenuTrigger',
+      'DatePicker',
       'Dialog',
       'DialogClose',
       'DialogContent',
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/date-picker src/index.test.ts
```

Expected: FAIL. Trên cây của plan, `DatePicker.test.tsx` không nạp được ở cả hai project React: `Failed to resolve import "./DatePicker" from "src/components/date-picker/DatePicker.test.tsx". Does the file exist?`; `DatePicker.test-d.ts` báo lỗi kiểu vì module chưa có; `public API > exports exactly the documented components and nothing internal` fail vì danh sách export chưa có `DatePicker`.

Bản nháp chạy test với một `DatePicker` giả trả `null`: 60 fail, 2 pass (hai type test mà bản giả lỏng không làm fail được). Mọi test của `DatePicker.test.tsx` fail với `Unable to find an accessible element with the role "textbox"`. Hai hành vi không có test viết trước (phát hiện 13): `reads the text once focus goes on past the calendar button` và `closes when focus leaves it for anything but the input or the button, and keeps no focus`.

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
index 936d40b..e2e2bf4 100644
--- a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
+++ b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
@@ -1014,7 +1014,8 @@ Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "size" |
   - Nút lịch nằm trong thứ tự Tab, ngay sau ô gõ, theo APG (Claude chốt). Mockup D1 vẽ nó với `tabindex="-1"`, nhưng mockup chỉ ràng buộc giao diện; Alt+↓ khó đoán với người dùng bàn phím. Vòng focus của nút (ngoài mockup) là vòng focus chung.
 - **Gõ ngày:**
   - Gõ theo thứ tự ngày, tháng, năm của locale; dấu ngăn nào cũng được.
-  - Chữ được đọc (`parseDate`) khi rời ô và khi Enter.
+  - Chữ được đọc (`parseDate`) khi rời ô và khi Enter. Rời ô gồm cả khi focus đi qua nút lịch ra ngoài DatePicker, để chữ gõ rồi Tab hai lần vẫn được đọc (phát hiện khi lập Plan C).
+  - Enter với chữ đọc được (hoặc ô trống) chốt giá trị rồi để form gửi đúng giá trị đó (§7); input ẩn được ghi ngay trong lúc nhấn phím, như Combobox, vì Firefox gửi form trước khi React render. Enter với chữ không đọc được hay không chọn được thì không gửi form (phát hiện khi lập Plan C).
   - Ô trống: giá trị `null`.
   - Đọc được và chọn được: giá trị đổi, chữ được định dạng lại (`formatDate`).
   - Không đọc được: lời báo `labels.invalidDate`; giá trị giữ nguyên; chữ giữ nguyên để người dùng sửa; ô gõ có `aria-invalid` và `setCustomValidity`.
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 179ffc4..5974be7 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -98,6 +98,9 @@ const SHIPPED_CLASSES = [
   'flg-calendar-weekday',
   'flg-calendar-cell',
   'flg-calendar-day',
+  'flg-date-picker',
+  'flg-date-picker-button',
+  'flg-date-picker-popup',
   'flg-toaster',
   'flg-toaster-list',
   'flg-toast',
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index d82cd87..a7351f9 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -31,6 +31,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/accordion/Accordion.tsx',
   'src/components/pagination/Pagination.tsx',
   'src/components/calendar/Calendar.tsx',
+  'src/components/date-picker/DatePicker.tsx',
   'src/components/toast/toast.ts',
   'src/components/toast/Toaster.tsx',
 ];
diff --git a/src/components/date-picker/DatePicker.mdx b/src/components/date-picker/DatePicker.mdx
new file mode 100644
index 0000000..ba1076b
--- /dev/null
+++ b/src/components/date-picker/DatePicker.mdx
@@ -0,0 +1,211 @@
+import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './DatePicker.stories';
+
+<Meta of={Stories} />
+
+# DatePicker
+
+```tsx
+import { DatePicker, Field } from 'h2d-glass-ui';
+
+<Field label="Check-in" description="Write it as mm/dd/yyyy.">
+  <DatePicker name="checkin" defaultValue="2026-11-14" onValueChange={(date) => save(date)} />
+</Field>;
+```
+
+<Canvas of={Stories.Open} />
+<Controls />
+
+A DatePicker is a text input that reads a date typed in the order of its locale, with a button that
+opens a [Calendar](?path=/docs/components-calendar--docs) under it. The user can type the date or press
+it in the calendar; either way the value is an ISO string and the text is written back in the format of
+the locale. Reach for the Calendar alone when the calendar should always be on the page.
+
+## Dates are strings
+
+Every date in the API is an ISO string, `'2026-11-14'`: `value`, `defaultValue`, `min`, `max`, `today`,
+and what `onValueChange` and `isDateUnavailable` receive. There is no `Date`, so no time zone can move a
+day, and the string is what a native `<input type="date">` would submit. A string that is not a real
+date (`'2026-02-30'`) is ignored, with a warning in development that names the prop.
+
+## The value
+
+`value` is the chosen date, or `null` for none. With `onValueChange` it is controlled; with
+`defaultValue` the DatePicker keeps it. `onValueChange` is called with the date the user chooses, or
+with `null` when they empty the text, and not when you change `value` yourself.
+
+```tsx
+const [date, setDate] = useState<string | null>(null);
+
+<DatePicker value={date} onValueChange={setDate} />;
+```
+
+`open`, `defaultOpen` and `onOpenChange` do the same for the calendar.
+
+## Typing a date
+
+The text is read when the user leaves the DatePicker (the input, or the calendar button after it) and
+when they press Enter. The order of day, month and year is the locale's, any separator works, and a year
+of two digits is 20xx.
+
+| `locale`          | Placeholder  | `3-5-26` is  |
+| ----------------- | ------------ | ------------ |
+| `en-US` (default) | `mm/dd/yyyy` | 5 March 2026 |
+| `vi-VN`           | `dd/mm/yyyy` | 3 May 2026   |
+| `de-DE`           | `dd.mm.yyyy` | 3 May 2026   |
+
+- A date that is read and can be chosen becomes the value, and the text is written back, `11/14/2026`
+  for `11/14/26`.
+- Empty text is `null`.
+- Text that cannot be read, or a date outside `min` and `max` or that `isDateUnavailable` refuses, stays
+  as typed, and the value stays what it was.
+- Enter reads the text. When it stays, Enter does not submit the form, so the form cannot go out with
+  an old date beside text that says another. Otherwise Enter is left to the browser: in a form it
+  submits the date that was just read.
+
+<Canvas of={Stories.Typing} />
+<Canvas of={Stories.Locales} />
+
+**Write the date format in the `description` of the Field.** The placeholder is the pattern of the
+locale, but it disappears as soon as the user starts typing, and a user who looks away has no hint left.
+
+## The calendar
+
+The calendar button follows the input in the Tab order. It, or **Alt+↓** in the input, opens the
+calendar. Text that waits is read first, so the calendar opens on the month of that date; when the text
+cannot be read it opens on the month of the value, else today's. The focus goes to the day with the tab
+stop in the grid (the chosen day, else today), and the keys are the Calendar's.
+
+- Choosing a day sets the value, writes the text, closes the calendar and puts the focus on the input.
+  The day that is already chosen closes it too.
+- **Esc** closes it and the focus goes back to the input.
+- Tab out of the calendar to anything but the input or the button closes it, and the focus stays where
+  Tab sent it.
+- A press outside closes it; so does a press on the open input or on the button.
+- While it is open the frame has the accent edge and the ring, as an open Select does.
+
+<Canvas of={Stories.Opening} />
+<Canvas of={Stories.Keys} />
+<Canvas of={Stories.TabOut} />
+<Canvas of={Stories.Pointer} />
+
+## Limits and unavailable dates
+
+`min` and `max` are the first and last date that can be chosen, and `isDateUnavailable(date)` returns
+`true` for a date that cannot, such as a day that is fully booked. They limit both ways of choosing:
+the days are struck through in the calendar and do nothing when pressed, and a typed date like that
+stays as typed. `min` after `max` is a mistake: both are ignored, with a warning.
+
+`isDateUnavailable` is a function, so it cannot be passed from a Server Component. Wrap the DatePicker
+in a client component of yours, as for `getHref` of Pagination.
+
+```tsx
+'use client';
+
+import { DatePicker } from 'h2d-glass-ui';
+
+const booked = new Set(['2026-11-09', '2026-11-10']);
+
+export function CheckIn() {
+  return (
+    <DatePicker
+      name="checkin"
+      min="2026-11-04"
+      max="2027-02-28"
+      isDateUnavailable={(date) => booked.has(date)}
+    />
+  );
+}
+```
+
+<Canvas of={Stories.Limits} />
+
+## The week and the language
+
+`locale` (BCP 47, default `"en-US"`) sets the order and the format of the text, the placeholder and the
+language of the calendar. The default is fixed, not the browser's language, so the server and the
+browser write the same text. `weekStartsOn` is from `0` (Sunday, the default for every locale) to `6`:
+**set `weekStartsOn={1}` for a locale whose week starts on Monday, such as `vi-VN`.** Translate the
+words with `labels`.
+
+```tsx
+<DatePicker
+  locale="vi-VN"
+  weekStartsOn={1}
+  labels={{
+    openCalendar: 'Chọn ngày',
+    dialog: 'Chọn ngày',
+    previousMonth: 'Tháng trước',
+    nextMonth: 'Tháng sau',
+  }}
+/>
+```
+
+`today` (an ISO date) replaces the clock. Pass it in tests and demos, so a screenshot or an assertion
+does not change with the day it runs. Every story of this page does.
+
+## In a form
+
+The DatePicker works in a plain `<form>`, with no code to join it up:
+
+- **`name`** goes to a hidden `<input type="hidden">` that holds the ISO date, `2026-11-14`, or the
+  empty string for no date. The text input has no `name`: what the user sees is not what is sent.
+- **`required`** is on the text input, so the browser's own message appears on it, and it is empty
+  exactly when the value is `null`.
+- **Enter** reads the date and the form submits that date.
+- **Reset**: an uncontrolled DatePicker goes back to `defaultValue` and its text, unless the reset is
+  cancelled with `preventDefault()`. A controlled one keeps its value and puts its text back.
+- **`disabled`** disables the text input, the button and the hidden input, so nothing is submitted.
+
+<Canvas of={Stories.InAForm} />
+
+## In a Field
+
+Inside a `Field` the label points at the text input and the description and error are read with it
+(`aria-describedby`); `required`, `disabled` and the invalid state come from the Field. `invalid` marks
+the frame with the danger border on its own.
+
+## Read only
+
+With `readOnly` the text cannot be changed, the calendar button is `aria-disabled` and opens nothing,
+and Enter and leaving the input read nothing. The button stays in the Tab order, as a button of the
+Calendar does at the end of its range.
+
+<Canvas of={Stories.ReadOnly} />
+
+## In a Dialog
+
+Esc closes only the calendar, the layer on top; the next Esc closes the Dialog. A press on the Dialog
+outside the panel closes only the calendar too.
+
+<Canvas of={Stories.InADialog} />
+
+## Accessibility
+
+- The text input is a plain `type="text"` input with the `aria-label` or the Field's label, and the
+  pattern of the locale as its placeholder (which is not a name). `aria-invalid` and `aria-describedby`
+  come from `invalid`, a Field and your own props.
+- The calendar button is named `labels.openCalendar` ("Choose date"), with `aria-haspopup="dialog"`,
+  `aria-expanded` and `aria-controls` that point at the popup.
+- The popup is a non-modal `role="dialog"` named `labels.dialog`, on the native `popover="auto"`:
+  nothing around it becomes inert. It holds the Calendar only while it is open, and its keys and
+  names are the Calendar's (full dates, "Saturday, November 14, 2026").
+- Opening puts the focus on the day with the tab stop and closing puts it back on the input, as in
+  the ARIA "date picker dialog" pattern.
+- Alt+↓ is the usual key to open it; the button is there for users who do not know it.
+- In forced-colors mode the popup has the edge of `CanvasText` like every panel that floats, and the
+  calendar icon takes the colour of a button.
+- `isDateUnavailable` and the other function props cannot be passed from a Server Component. Wrap the
+  DatePicker in a client component of yours.
+
+## Do and don't
+
+- Do write the format of the date in the `description` of the Field, and pass `weekStartsOn={1}` for
+  locales that start the week on Monday.
+- Do pass `today` in tests and demos, and keep the value as the ISO string.
+- Do use `min`, `max` and `isDateUnavailable` for the dates that cannot be chosen, and tell the user
+  why near the field.
+- Don't build the value with `new Date('2026-11-14')`: that reads UTC and writes local time. Pass the
+  string on.
+- Don't rely on the placeholder to say the format: it goes when the user types.
+- Don't put a DatePicker where the user must pick a range: use the Calendar with `mode="range"`.
diff --git a/src/components/date-picker/DatePicker.tsx b/src/components/date-picker/DatePicker.tsx
new file mode 100644
index 0000000..da8cc78
--- /dev/null
+++ b/src/components/date-picker/DatePicker.tsx
@@ -0,0 +1,456 @@
+'use client';
+
+import { clsx } from 'clsx';
+import { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react';
+import type {
+  ChangeEvent,
+  CSSProperties,
+  FocusEvent,
+  InputHTMLAttributes,
+  KeyboardEvent,
+  MouseEvent,
+} from 'react';
+import { composeEventHandlers } from '../../internal/compose-event-handlers';
+import { dataAttr } from '../../internal/data-attr';
+import {
+  compareIso,
+  datePattern,
+  formatDate,
+  isIsoDate,
+  parseDate,
+  todayIso,
+} from '../../internal/date';
+import { markAsFieldControl, useFieldProps } from '../../internal/field-context';
+import { focusInput } from '../../internal/focus-input';
+import { CalendarIcon } from '../../internal/icons';
+import { mergeRefs } from '../../internal/merge-refs';
+import { hasModifier, isComposing } from '../../internal/roving';
+import { useControllableState } from '../../internal/use-controllable-state';
+import { useFloating } from '../../internal/use-floating';
+import { useFormReset } from '../../internal/use-form-reset';
+import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
+import { usePopover } from '../../internal/use-popover';
+import { usePopoverState, useTriggerPress } from '../../internal/use-popover-trigger';
+import { useWriteOnCommit } from '../../internal/use-write-on-commit';
+import { devWarn } from '../../internal/warn';
+import { Calendar } from '../calendar/Calendar';
+import type { CalendarLabels } from '../calendar/Calendar';
+
+/** The words the DatePicker says itself, and the ones of its calendar; translate them with the page. */
+export interface DatePickerLabels extends CalendarLabels {
+  /** The name of the calendar button. Default `"Choose date"`. */
+  openCalendar?: string;
+  /** The name of the calendar's dialog. Default `"Choose date"`. */
+  dialog?: string;
+}
+
+export interface DatePickerProps extends Omit<
+  InputHTMLAttributes<HTMLInputElement>,
+  'value' | 'defaultValue' | 'size' | 'min' | 'max'
+> {
+  /** The chosen date, `'YYYY-MM-DD'`; `null` is no date. Pass it with `onValueChange` to control it. */
+  value?: string | null;
+  /** The chosen date at first, when `value` is not controlled. */
+  defaultValue?: string;
+  /**
+   * Called with the date the user chooses, typed or picked, or `null` when they empty the text. Not
+   * called when the parent changes `value`.
+   */
+  onValueChange?: (value: string | null) => void;
+  /** Whether the calendar is open. Pass it with `onOpenChange` to control it. */
+  open?: boolean;
+  /** Whether the calendar starts open, when `open` is not controlled. */
+  defaultOpen?: boolean;
+  /** Called with the new state whenever the calendar opens or closes. */
+  onOpenChange?: (open: boolean) => void;
+  /** The first date that can be chosen, `'YYYY-MM-DD'`. */
+  min?: string;
+  /** The last date that can be chosen, `'YYYY-MM-DD'`. */
+  max?: string;
+  /** Marks a date that cannot be chosen, for example a day that is fully booked. */
+  isDateUnavailable?: (date: string) => boolean;
+  /** The day the week starts on, 0 (Sunday) to 6 (Saturday). Default 0, for every locale. */
+  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
+  /**
+   * BCP 47 locale of the text (its order of day, month and year, and its placeholder) and of the
+   * calendar. Default `"en-US"`.
+   */
+  locale?: string;
+  /**
+   * The date to call today, `'YYYY-MM-DD'`. Without it today is read from the clock when the calendar
+   * opens. Pass it in tests and demos so that nothing changes with the day they run.
+   */
+  today?: string;
+  size?: 'sm' | 'md' | 'lg';
+  /** Marks the value as wrong. Inside a Field with an error this is already true. */
+  invalid?: boolean;
+  /** The words of the button, the dialog and the calendar. */
+  labels?: DatePickerLabels;
+  /** On the element around the input. */
+  className?: string;
+  /** On the element around the input. */
+  style?: CSSProperties;
+}
+
+const CALENDAR = <CalendarIcon />;
+
+/** `value` as it is, or undefined with a warning that names the prop when it is not a date. */
+function checked(name: string, value: string | null | undefined): string | undefined {
+  if (value === undefined || value === null) return undefined;
+  if (isIsoDate(value)) return value;
+  devWarn(
+    `DatePicker: ${name} "${String(value)}" is not a date written YYYY-MM-DD; it is ignored.`,
+  );
+  return undefined;
+}
+
+/**
+ * A text input that reads a date typed in the order of its locale, with a calendar button that opens a
+ * calendar under it, and a hidden input that takes the ISO date to a form. Dates are ISO strings
+ * (`'2026-11-14'`), never `Date`s. `ref` is the text input; `className` and `style` go on the element
+ * around it.
+ */
+export const DatePicker = markAsFieldControl(
+  forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(props, ref) {
+    const {
+      value: valueProp,
+      defaultValue,
+      onValueChange,
+      open: openProp,
+      defaultOpen = false,
+      onOpenChange,
+      min: minProp,
+      max: maxProp,
+      isDateUnavailable,
+      weekStartsOn,
+      locale = 'en-US',
+      today: todayProp,
+      size = 'md',
+      invalid: invalidProp,
+      labels,
+      name,
+      placeholder,
+      className,
+      style,
+      id,
+      required,
+      disabled: disabledProp,
+      readOnly = false,
+      'aria-describedby': describedBy,
+      'aria-invalid': ariaInvalid,
+      onBlur,
+      onChange,
+      onKeyDown,
+      ...rest
+    } = props;
+    const fieldProps = useFieldProps({
+      id,
+      invalid: invalidProp,
+      required,
+      disabled: disabledProp,
+      'aria-describedby': describedBy,
+      'aria-invalid': ariaInvalid,
+    });
+    const { invalid, disabled = false } = fieldProps;
+
+    // A date that cannot be read is left out, so a typo shows a picker without it, not none.
+    let min = checked('min', minProp);
+    let max = checked('max', maxProp);
+    if (min !== undefined && max !== undefined && compareIso(min, max) > 0) {
+      devWarn(`DatePicker: min (${min}) is after max (${max}); both are ignored.`);
+      min = undefined;
+      max = undefined;
+    }
+    const todayGiven = checked('today', todayProp);
+    const defaultDate = checked('defaultValue', defaultValue) ?? null;
+
+    // --- The value, and the text that stands for it.
+    const [value, setValue, resetValue] = useControllableState<string | null>({
+      // `null` is a controlled picker without a date; `undefined` leaves the value to the picker.
+      value: valueProp === undefined ? undefined : (checked('value', valueProp) ?? null),
+      defaultValue: defaultDate,
+      onChange: onValueChange,
+      name: 'DatePicker value',
+    });
+    const textOf = (date: string | null) => (date === null ? '' : formatDate(date, locale));
+    const [text, setText] = useState(() => textOf(value));
+    // A value that changes brings its text with it, and so does a locale. What the user types does
+    // not: the text only follows the value when the value is what moved.
+    const syncKey = `${value ?? ''}|${locale}`;
+    const syncedKey = useRef(syncKey);
+    useIsoLayoutEffect(() => {
+      if (syncedKey.current === syncKey) return;
+      syncedKey.current = syncKey;
+      setText(textOf(value));
+      // `value` and `locale` are the key; only a change of the key matters.
+    }, [syncKey]);
+    const latestValue = useRef(value);
+    useWriteOnCommit(() => {
+      latestValue.current = value;
+    });
+
+    const unavailable = (date: string) =>
+      (min !== undefined && compareIso(date, min) < 0) ||
+      (max !== undefined && compareIso(date, max) > 0) ||
+      isDateUnavailable?.(date) === true;
+    /**
+     * What the text says: a date that can be chosen, or `null` for no date (empty text). `undefined`
+     * when it cannot be read, or is a date that cannot be chosen: it stays as typed.
+     */
+    const read = (): { date: string | null } | undefined => {
+      if (text.trim() === '') return { date: null };
+      const date = parseDate(text, locale);
+      return date === null || unavailable(date) ? undefined : { date };
+    };
+    /** Makes what the text says the value, and writes the text in the format of the locale. */
+    const commit = (reading: { date: string | null }) => {
+      // A value that changes brings its text (see `syncKey`); the one already chosen only has its
+      // text put back in the format, as typed another way ("11/14/26").
+      if (reading.date === value) setText(textOf(value));
+      else setValue(reading.date);
+    };
+
+    // --- Open state.
+    const { open, request, report, contentRef, pendingToggle } = usePopoverState<HTMLDivElement>({
+      open: openProp,
+      defaultOpen,
+      onOpenChange,
+      name: 'DatePicker open',
+    });
+    // A DatePicker that becomes disabled while open closes, as a native control does.
+    useIsoLayoutEffect(() => {
+      if (disabled && open) request(false);
+    }, [disabled, open, request]);
+
+    const frameRef = useRef<HTMLDivElement>(null);
+    const inputRef = useRef<HTMLInputElement | null>(null);
+    const mergedRef = useMemo(() => mergeRefs(ref, inputRef), [ref]);
+    const buttonRef = useRef<HTMLButtonElement>(null);
+    const hiddenRef = useRef<HTMLInputElement>(null);
+    const popupId = useId();
+
+    // The calendar reads the clock for today only after it mounts, which is after the focus should
+    // have gone into its grid. An open DatePicker reads the clock first and hands the day down, so
+    // that the grid has today on it when the focus goes in.
+    const [clock, setClock] = useState<string | null>(null);
+    useIsoLayoutEffect(() => {
+      if (open && todayGiven === undefined) setClock(todayIso());
+    }, [open, todayGiven]);
+    // The day that has the tab stop, which is where the focus goes: the chosen day, else today.
+    const focusGrid = () => {
+      const target = contentRef.current?.querySelector<HTMLElement>(
+        'button[data-date][tabindex="0"]',
+      );
+      target?.focus({ preventScroll: true });
+      return target != null;
+    };
+    // Set when the popup showed before its grid was drawn (opened by the parent, with no date and no
+    // `today` yet): the render that brings the clock finishes the job.
+    const focusWanted = useRef(false);
+    useIsoLayoutEffect(() => {
+      if (!open) focusWanted.current = false;
+      else if (focusWanted.current && focusGrid()) focusWanted.current = false;
+      // The grid appears with the clock; the open state resets the flag.
+    }, [open, clock]);
+
+    // --- Opening: the button, or Alt+ArrowDown. The text that waits is read first, so the calendar
+    // opens on its month (text that cannot be read leaves the month of the value, or today's).
+    const openCalendar = () => {
+      if (disabled || readOnly) return;
+      const reading = read();
+      if (reading) commit(reading);
+      request(true);
+    };
+    // A press on the button light-dismisses an open popup before the click arrives: it closes it.
+    const press = useTriggerPress(open, (wasOpen) => {
+      if (wasOpen) request(false);
+      else openCalendar();
+    });
+
+    // A press on the input while the popup is open light-dismisses it too, and focus goes back to
+    // the input, which is `restoreFocusTo`: nothing else to do for it here.
+    usePopover(contentRef, {
+      open,
+      onOpenChange: report,
+      pendingToggle,
+      restoreFocusTo: () => inputRef.current,
+      onShown: () => {
+        focusWanted.current = !focusGrid();
+      },
+    });
+    useFloating({
+      open,
+      reference: () => frameRef.current,
+      floating: contentRef,
+      side: 'bottom',
+      align: 'start',
+      offset: 6,
+    });
+
+    // --- The text.
+    const handleChange = (event: ChangeEvent<HTMLInputElement>) => setText(event.target.value);
+    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
+      // Keys that pick or move through a composition belong to the input method.
+      if (isComposing(event)) return;
+      if (event.key === 'ArrowDown' && event.altKey && !event.ctrlKey && !event.metaKey) {
+        event.preventDefault();
+        if (!open) openCalendar();
+      } else if (event.key === 'Enter' && !hasModifier(event) && !readOnly) {
+        const reading = read();
+        if (!reading) {
+          // Text that stays must not submit the form with the old date beside it.
+          event.preventDefault();
+          return;
+        }
+        commit(reading);
+        // The form submits right after this keydown, perhaps before React has rendered the new date
+        // into the hidden input, so it goes there now (as NumberInput does for its hidden input). It
+        // is put back in step a task later, when the submit has read it: a parent that refuses the
+        // date never renders a new one, and the hidden input must not keep what was written here.
+        const hiddenInput = hiddenRef.current;
+        if (hiddenInput) {
+          hiddenInput.value = reading.date ?? '';
+          setTimeout(() => {
+            if (hiddenRef.current) hiddenRef.current.value = latestValue.current ?? '';
+          }, 0);
+        }
+      }
+    };
+    // Leaving the DatePicker reads the text: from the input, or from the button after it (a user who
+    // types and tabs past the button has left it too). Focus that stays among the input, the button
+    // and the popup is no leaving; opening reads the text itself. Another window taking the focus is
+    // no leaving of the text either: the user comes back to what they were typing.
+    const handleLeave = (event: FocusEvent<HTMLElement>) => {
+      const to = event.relatedTarget as Node | null;
+      if (
+        inputRef.current?.contains(to) ||
+        buttonRef.current?.contains(to) ||
+        contentRef.current?.contains(to)
+      ) {
+        return;
+      }
+      if (!to && !document.hasFocus()) return;
+      if (readOnly) return;
+      const reading = read();
+      if (reading) commit(reading);
+    };
+
+    // --- The popup.
+    // A day pressed is chosen, the one already chosen too: the Calendar reports only a change of
+    // value, and a popup that stays open on the chosen day would be no way out for the pointer. A
+    // day that cannot be chosen is `aria-disabled`, and a press on it does nothing.
+    const handlePopupClick = (event: MouseEvent<HTMLDivElement>) => {
+      const target = (event.target as Element).closest<HTMLElement>('button[data-date]');
+      const date = target?.dataset.date;
+      if (!date || target.getAttribute('aria-disabled') === 'true') return;
+      if (date === value) setText(textOf(value));
+      else setValue(date);
+      inputRef.current?.focus({ preventScroll: true });
+      request(false);
+    };
+    // Focus that moves on from the popup to anything but the input or the button closes it, and the
+    // focus stays where the user sent it (Tab out of the grid). A press that leaves focus nowhere
+    // (Safari does not focus a pressed button) is no leaving.
+    // It closes a task later, when the focus has arrived: while the `focusout` is dispatched the
+    // document has no focused element, and a popup that closes then would send the focus to the input.
+    const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
+    useEffect(() => () => clearTimeout(leaveTimer.current), []);
+    const handlePopupBlur = (event: FocusEvent<HTMLDivElement>) => {
+      const to = event.relatedTarget as Node | null;
+      if (!to || contentRef.current?.contains(to)) return;
+      if (to === inputRef.current || buttonRef.current?.contains(to)) return;
+      clearTimeout(leaveTimer.current);
+      leaveTimer.current = setTimeout(() => request(false), 0);
+    };
+
+    // --- Form. The hidden input is what is submitted, and the browser does not reset it: a hidden
+    // input has no value of its own to go back to. An uncontrolled picker goes back to its default, a
+    // controlled one keeps its value, and either way the text is put back to the value's.
+    useFormReset(inputRef, () => {
+      resetValue(defaultDate);
+      setText(textOf(valueProp === undefined ? defaultDate : latestValue.current));
+    });
+
+    return (
+      <div
+        className={clsx('flg-date-picker', className)}
+        style={style}
+        data-size={size}
+        data-invalid={dataAttr(invalid)}
+        data-disabled={dataAttr(disabled)}
+      >
+        {/* The frame only forwards presses to the input; keyboard users reach the input directly. */}
+        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
+        <div
+          ref={frameRef}
+          className="flg-input"
+          data-size={size}
+          data-invalid={dataAttr(invalid)}
+          data-disabled={dataAttr(disabled)}
+          onMouseDown={focusInput}
+        >
+          <input
+            {...rest}
+            ref={mergedRef}
+            type="text"
+            id={fieldProps.id}
+            autoComplete="off"
+            placeholder={placeholder ?? datePattern(locale)}
+            value={text}
+            required={fieldProps.required}
+            disabled={disabled}
+            readOnly={readOnly}
+            aria-describedby={fieldProps['aria-describedby']}
+            aria-invalid={fieldProps['aria-invalid']}
+            onChange={composeEventHandlers(onChange, handleChange)}
+            onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
+            onBlur={composeEventHandlers(onBlur, handleLeave)}
+          />
+          <button
+            ref={buttonRef}
+            type="button"
+            className="flg-date-picker-button"
+            aria-label={labels?.openCalendar ?? 'Choose date'}
+            aria-haspopup="dialog"
+            aria-expanded={open}
+            aria-controls={popupId}
+            aria-disabled={readOnly || undefined}
+            disabled={disabled}
+            onBlur={handleLeave}
+            onPointerDown={press.onPointerDown}
+            onPointerCancel={press.onPointerCancel}
+            onClick={press.onClick}
+          >
+            {CALENDAR}
+          </button>
+        </div>
+        <input ref={hiddenRef} type="hidden" name={name} value={value ?? ''} disabled={disabled} />
+        {/* The click is a day's, a button of the Calendar inside; its keys are the Calendar's. */}
+        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
+        <div
+          ref={contentRef}
+          popover="auto"
+          role="dialog"
+          id={popupId}
+          aria-label={labels?.dialog ?? 'Choose date'}
+          className="flg-surface flg-date-picker-popup"
+          onClick={handlePopupClick}
+          onBlur={handlePopupBlur}
+        >
+          {open ? (
+            <Calendar
+              value={value}
+              min={min}
+              max={max}
+              isDateUnavailable={isDateUnavailable}
+              weekStartsOn={weekStartsOn}
+              locale={locale}
+              today={todayGiven ?? clock ?? undefined}
+              labels={labels}
+            />
+          ) : null}
+        </div>
+      </div>
+    );
+  }),
+);
diff --git a/src/components/date-picker/index.ts b/src/components/date-picker/index.ts
new file mode 100644
index 0000000..4404929
--- /dev/null
+++ b/src/components/date-picker/index.ts
@@ -0,0 +1,2 @@
+export { DatePicker } from './DatePicker';
+export type { DatePickerLabels, DatePickerProps } from './DatePicker';
diff --git a/src/index.ts b/src/index.ts
index 8f002c7..63b789d 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -146,6 +146,8 @@ export { Pagination } from './components/pagination';
 export type { PaginationLinkProps, PaginationProps } from './components/pagination';
 export { Calendar } from './components/calendar';
 export type { CalendarLabels, CalendarProps, CalendarRange } from './components/calendar';
+export { DatePicker } from './components/date-picker';
+export type { DatePickerLabels, DatePickerProps } from './components/date-picker';
 export type {
   BreadcrumbLinkProps,
   BreadcrumbPageProps,
diff --git a/src/styles/components/date-picker.css b/src/styles/components/date-picker.css
new file mode 100644
index 0000000..4b544bf
--- /dev/null
+++ b/src/styles/components/date-picker.css
@@ -0,0 +1,69 @@
+/* DatePicker (spec phase 3 §4.3, mockup D1): the frame of Input with a calendar button at the end,
+   over a popup that holds a Calendar (calendar.css) on a glass surface. The browser's styles for
+   [popover] are undone here; Floating UI writes `left`, `top`, `data-side` and `data-align`. */
+@layer flg.components {
+  /* As wide as its container, like an Input in a Field. */
+  .flg-date-picker {
+    position: relative;
+    display: block;
+    width: 100%;
+    min-width: 0;
+  }
+  /* 24px at every size of the frame, which is 28px or more high. */
+  .flg-date-picker-button {
+    display: inline-grid;
+    flex: none;
+    place-items: center;
+    box-sizing: border-box;
+    width: 24px;
+    height: 24px;
+    margin: 0;
+    padding: 0;
+    border: 0;
+    border-radius: var(--flg-radius-xs);
+    background: transparent;
+    color: var(--flg-text-muted);
+    cursor: pointer;
+  }
+  .flg-date-picker-button > svg {
+    width: 16px;
+    height: 16px;
+  }
+  .flg-date-picker-button:focus-visible {
+    outline: 2px solid var(--flg-focus-outline-color);
+    outline-offset: 2px;
+    box-shadow: var(--flg-focus-ring);
+  }
+  .flg-date-picker-button[aria-disabled='true'],
+  .flg-date-picker-button:disabled {
+    cursor: not-allowed;
+  }
+  /* An open calendar marks the frame as a focused Input is marked (mockup D1, as a Select when
+     open): the focus is in the popup then, not in the input. An invalid one keeps its danger border. */
+  .flg-date-picker .flg-input:has(> .flg-date-picker-button[aria-expanded='true']) {
+    outline: 2px solid var(--flg-focus-outline-color);
+    outline-offset: 2px;
+    box-shadow: var(--flg-focus-ring);
+  }
+  .flg-date-picker:not([data-invalid])
+    .flg-input:has(> .flg-date-picker-button[aria-expanded='true']) {
+    border-color: var(--flg-accent-solid);
+  }
+  /* 252px of calendar, 12px of padding and 1px of edge on each side. */
+  .flg-date-picker-popup {
+    position: fixed;
+    inset: auto;
+    box-sizing: border-box;
+    width: 278px;
+    max-width: calc(100vw - 32px);
+    margin: 0;
+    padding: 12px;
+    border-radius: var(--flg-radius-md);
+    background-color: transparent;
+    overflow: visible;
+    outline: none;
+    transition:
+      opacity var(--flg-duration-normal) var(--flg-ease),
+      translate var(--flg-duration-normal) var(--flg-ease);
+  }
+}
diff --git a/src/styles/components/floating.css b/src/styles/components/floating.css
index 7be4e65..030fc3c 100644
--- a/src/styles/components/floating.css
+++ b/src/styles/components/floating.css
@@ -2,19 +2,39 @@
    moves 4px away from the trigger. `data-side` is where Floating UI placed it. */
 @layer flg.components {
   @starting-style {
-    :is(.flg-popover, .flg-tooltip, .flg-menu):popover-open {
+    :is(.flg-popover, .flg-tooltip, .flg-menu, .flg-date-picker-popup):popover-open {
       opacity: 0;
     }
-    :is(.flg-popover, .flg-tooltip, .flg-menu)[data-side='bottom']:popover-open {
+    :is(
+        .flg-popover,
+        .flg-tooltip,
+        .flg-menu,
+        .flg-date-picker-popup
+      )[data-side='bottom']:popover-open {
       translate: 0 -4px;
     }
-    :is(.flg-popover, .flg-tooltip, .flg-menu)[data-side='top']:popover-open {
+    :is(
+        .flg-popover,
+        .flg-tooltip,
+        .flg-menu,
+        .flg-date-picker-popup
+      )[data-side='top']:popover-open {
       translate: 0 4px;
     }
-    :is(.flg-popover, .flg-tooltip, .flg-menu)[data-side='right']:popover-open {
+    :is(
+        .flg-popover,
+        .flg-tooltip,
+        .flg-menu,
+        .flg-date-picker-popup
+      )[data-side='right']:popover-open {
       translate: -4px 0;
     }
-    :is(.flg-popover, .flg-tooltip, .flg-menu)[data-side='left']:popover-open {
+    :is(
+        .flg-popover,
+        .flg-tooltip,
+        .flg-menu,
+        .flg-date-picker-popup
+      )[data-side='left']:popover-open {
       translate: 4px 0;
     }
   }
diff --git a/src/styles/index.css b/src/styles/index.css
index 6752d88..bd4785c 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -32,6 +32,7 @@
 @import './components/breadcrumb.css';
 @import './components/pagination.css';
 @import './components/calendar.css';
+@import './components/date-picker.css';
 @import './components/toast.css';
 @import './components/floating.css';
 @import './preferences.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 72597c5..b546924 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -359,6 +359,15 @@
       color: GrayText;
       opacity: 1;
     }
+    /* A DatePicker: its popup is a Surface, which already has the edge of CanvasText. The calendar
+       icon takes the colour of a button, set on the button and not on the <svg>; it goes grey with
+       a disabled frame. */
+    .flg-date-picker-button {
+      color: ButtonText;
+    }
+    .flg-input:has(> input:disabled) .flg-date-picker-button {
+      color: GrayText;
+    }
     /* The status bar of a toast (spec §4.5); the named icon still tells the status. */
     .flg-toast::before {
       background: CanvasText;
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/date-picker src/components/calendar src/index.test.ts
pnpm vitest run --project storybook-light --project storybook-dark src/components/date-picker
pnpm build && pnpm check:package
```

Expected:
- Unit: date-picker 121 test PASS (`DatePicker.test.tsx` 58 ở mỗi project React, `DatePicker.test-d.ts` 5); calendar 262 PASS, không đổi; `index.test.ts` 1 PASS. Không lỗi kiểu.
- Story DatePicker: 72 test PASS (12 story × ba engine × hai theme).
- `check:package`: `check:dist-css` (ba class mới), `check:use-client`, `check:rsc`, publint và attw PASS. **`size` fail, chỉ ở JS**: theo lần chạy nháp 40.8 kB trên ngưỡng 40.59 kB (vượt 213 B); CSS trong ngưỡng. Đây là điều dự kiến (Global Constraints). Không chạy `pnpm size:record` ở task này.
- Ảnh chuẩn của component cũ giữ nguyên: so `dist/styles.css` ở commit cha và ở commit này, chỉ năm quy tắc `@starting-style` của `floating.css` có thêm `.flg-date-picker-popup` (phát hiện 7); các quy tắc khác là `.flg-date-picker*` mới và hai quy tắc forced colors.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md \
  scripts/check-dist-css.ts \
  scripts/check-use-client.ts \
  src/components/date-picker/DatePicker.mdx \
  src/components/date-picker/DatePicker.stories.tsx \
  src/components/date-picker/DatePicker.test-d.ts \
  src/components/date-picker/DatePicker.test.tsx \
  src/components/date-picker/DatePicker.tsx \
  src/components/date-picker/index.ts \
  src/index.test.ts \
  src/index.ts \
  src/styles/components/date-picker.css \
  src/styles/components/floating.css \
  src/styles/index.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(date-picker): DatePicker, typing, the calendar popup and the form, in the D1 look" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 5: DatePicker báo chữ không phải ngày, hoặc ngày không chọn được

Spec §3.1 (ý **DatePicker giữ input ẩn**: `setCustomValidity`), §3.2 (**Lỗi do control tự báo**), §3.6 (vùng live của DatePicker), §5 (`useAnnounce`, `useControlError`), §6.3 **`DatePicker`**, ý **Gõ ngày** (các dòng về lời báo) và `labels`, §8. Làm theo cách TagInput báo thẻ bị từ chối (Plan B).
- **Hai lời báo**: chữ không đọc được thì `labels.invalidDate` (`"Invalid date"`); đọc được nhưng ngoài `[min, max]` hoặc bị `isDateUnavailable` chặn thì `labels.unavailableDate` (`"This date is not available"`). Lời được dựng từ `labels` lúc render, nên bản dịch đến sau được dùng ngay.
- Khi có lời báo, chữ và giá trị ở lại; ô gõ có `aria-invalid="true"` và `setCustomValidity(message)`; khung có `data-invalid`.
- Lời báo lên Field bao ngoài qua `useControlError` (`error` của Field thắng về hiển thị); ngoài Field, nó hiện dưới khung (`<p class="flg-field-error">`) và nối vào `aria-describedby`. Vùng live (`useAnnounce`) đọc nó.
- Khi nào lời báo mất, khi nào được đọc lại: phát hiện 8. Spec §6.3 được sửa (phát hiện 3).
- Không đổi CSS: `.flg-field-error` và `data-invalid` của khung đã có.

**Files:**
- Modify: `src/components/date-picker/DatePicker.tsx`, `DatePicker.test.tsx`, `DatePicker.stories.tsx`, `DatePicker.mdx`, `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md`

**Interfaces:**
- Produces:
  - `DatePickerLabels` có thêm `invalidDate` (mặc định `"Invalid date"`) và `unavailableDate` (mặc định `"This date is not available"`).
  - Gốc của DatePicker có thêm vùng live (luôn có, phần tử cuối) và, ngoài Field, `<p class="flg-field-error">` khi có lời báo. Test `is a frame holding the text input and the calendar button, then the hidden input and popup` đổi số con của gốc từ 3 thành 4.
- Consumes: `useControlError` (Plan B, `src/internal/field-context.tsx`), `useAnnounce` (Plan B, `src/internal/use-announce.ts`), `DatePicker` của Task 4.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/date-picker/DatePicker.stories.tsx b/src/components/date-picker/DatePicker.stories.tsx
index b7c1e0e..6785dae 100644
--- a/src/components/date-picker/DatePicker.stories.tsx
+++ b/src/components/date-picker/DatePicker.stories.tsx
@@ -642,3 +642,208 @@ export const InAForm: Story = {
     });
   },
 };
+
+/** The message under the frame, outside a Field, and as the error of a Field, with the red frame. */
+export const Invalid: Story = {
+  render: () => (
+    <div style={{ ...column, gap: 20 }}>
+      <div>
+        <div style={caption}>Outside a Field: the message is under the frame</div>
+        <DatePicker aria-label="Date, unreadable" defaultValue="2026-11-14" today={TODAY} />
+      </div>
+      <div>
+        <div style={caption}>Outside a Field: a date that is not available</div>
+        <DatePicker aria-label="Date, unavailable" min="2026-11-10" today={TODAY} />
+      </div>
+      <Field label="Check-in" description="Write it as mm/dd/yyyy.">
+        <DatePicker name="checkin" today={TODAY} />
+      </Field>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const user = (await realUserEvent()) ?? userEvent;
+    const typeAndLeave = async (name: string, text: string) => {
+      const input = canvas.getByRole('textbox', { name });
+      await user.click(input);
+      await user.clear(input);
+      await user.keyboard(text);
+      await user.tab();
+      await user.tab();
+      return input;
+    };
+    const unreadable = await typeAndLeave('Date, unreadable', '31/31/2026');
+    const unavailable = await typeAndLeave('Date, unavailable', '11/09/2026');
+    const inField = await typeAndLeave('Check-in', 'abc');
+    // A Field shows the message a render after the DatePicker has it.
+    await waitFor(() =>
+      expect(
+        Array.from(canvasElement.querySelectorAll('.flg-field-error')).map(
+          (one) => one.textContent,
+        ),
+      ).toEqual(['Invalid date', 'This date is not available', 'Invalid date']),
+    );
+    for (const input of [unreadable, unavailable, inField]) {
+      await expect(input).toHaveAttribute('aria-invalid', 'true');
+      await expect(input.closest('.flg-date-picker')).toHaveAttribute('data-invalid');
+    }
+    // Outside a Field the message is in the root, under the frame; inside, it is the Field's.
+    const own = unreadable.closest('.flg-date-picker')!.querySelector('.flg-field-error')!;
+    await expect(unreadable.getAttribute('aria-describedby')).toBe(own.id);
+    await expect(inField.closest('.flg-date-picker')!.querySelector('.flg-field-error')).toBeNull();
+    // The image shows the messages, not a focus ring.
+    (document.activeElement as HTMLElement | null)?.blur();
+  },
+};
+
+/** An unreadable date: said, kept as typed, and gone once it is fixed, in a real browser. */
+export const Fixing: Story = {
+  tags: ['no-visual'],
+  render: (args) => (
+    <div style={column}>
+      <DatePicker aria-label="Check-in" defaultValue="2026-11-14" {...args} />
+      <button type="button">Next</button>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement, args }) => {
+    const user = (await realUserEvent()) ?? userEvent;
+    const input = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Check-in' });
+    const message = () => canvasElement.querySelector('.flg-field-error');
+    const live = () => canvasElement.querySelector('[aria-live]')!.textContent;
+    const leave = async () => {
+      await user.tab();
+      await user.tab();
+    };
+    await user.click(input);
+    await user.clear(input);
+    await user.keyboard('2/30/2026');
+    await leave();
+    await expect(canvas.getByRole('button', { name: 'Next' })).toHaveFocus();
+    await expect(message()).toHaveTextContent('Invalid date');
+    await expect(input).toHaveValue('2/30/2026');
+    await expect(input).toHaveAttribute('aria-invalid', 'true');
+    await expect(input.validity.customError).toBe(true);
+    await expect(args.onValueChange).not.toHaveBeenCalled();
+    await waitFor(() => expect(live()).toBe('Invalid date'));
+    // Leaving with the same text again says nothing new: the region is not cleared and set again.
+    await user.click(input);
+    await leave();
+    await expect(live()).toBe('Invalid date');
+    // Fixed, and left: the message goes, and the date is the value.
+    await user.click(input);
+    await user.clear(input);
+    await user.keyboard('2/28/2026');
+    await leave();
+    await expect(message()).toBeNull();
+    await expect(input).not.toHaveAttribute('aria-invalid');
+    await expect(input.validity.customError).toBe(false);
+    await expect(input).toHaveValue('02/28/2026');
+    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-02-28');
+    // Emptied: no date, and no message.
+    await user.click(input);
+    await user.clear(input);
+    await user.keyboard('x');
+    await leave();
+    await expect(message()).not.toBeNull();
+    await user.click(input);
+    await user.clear(input);
+    await leave();
+    await expect(message()).toBeNull();
+    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
+  },
+};
+
+/** A date outside min and max, or marked unavailable: its own message; a day in the calendar clears it. */
+export const Unavailable: Story = {
+  tags: ['no-visual'],
+  render: (args) => (
+    <div style={column}>
+      <DatePicker
+        aria-label="Check-in"
+        defaultValue="2026-11-14"
+        min="2026-11-10"
+        max="2026-11-20"
+        isDateUnavailable={(date) => date === '2026-11-18'}
+        {...args}
+      />
+      <button type="button">Next</button>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const user = (await realUserEvent()) ?? userEvent;
+    const input = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Check-in' });
+    const message = () => canvasElement.querySelector('.flg-field-error');
+    for (const text of ['11/09/2026', '11/21/2026', '11/18/2026']) {
+      await user.click(input);
+      await user.clear(input);
+      await user.keyboard(text);
+      await user.tab();
+      await user.tab();
+      await expect(message()).toHaveTextContent('This date is not available');
+      await expect(input).toHaveValue(text);
+      await expect(input.validationMessage).toBe('This date is not available');
+    }
+    await waitFor(() =>
+      expect(canvasElement.querySelector('[aria-live]')).toHaveTextContent(
+        'This date is not available',
+      ),
+    );
+    // A day chosen in the calendar replaces the text and clears the message.
+    await user.click(canvas.getByRole('button', { name: 'Choose date' }));
+    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
+    await user.click(dayIn(canvasElement, '2026-11-19'));
+    await waitFor(() => expect(input).toHaveValue('11/19/2026'));
+    await expect(message()).toBeNull();
+    await expect(input.validity.customError).toBe(false);
+  },
+};
+
+/** Text that stays stops the submit, on the input, with its message; Enter does not submit it either. */
+export const BlockedSubmit: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <form aria-label="Booking" style={column} onSubmit={(event) => event.preventDefault()}>
+      <Field label="Check-in" description="Write it as mm/dd/yyyy.">
+        <DatePicker name="checkin" defaultValue="2026-11-14" today={TODAY} />
+      </Field>
+      <button type="submit">Book</button>
+    </form>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const form = canvasElement.querySelector('form')!;
+    const user = (await realUserEvent()) ?? userEvent;
+    const sent: Array<FormDataEntryValue | null> = [];
+    form.addEventListener('submit', (event) => {
+      sent.push(new FormData(event.currentTarget as HTMLFormElement).get('checkin'));
+    });
+    const input = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Check-in' });
+    await user.click(input);
+    await user.clear(input);
+    await user.keyboard('abc');
+    // Pressing Submit leaves the input, which says why; the browser then stops the submit there.
+    await user.click(canvas.getByRole('button', { name: 'Book' }));
+    await waitFor(() => expect(input).toHaveFocus());
+    await expect(input.validationMessage).toBe('Invalid date');
+    await expect(sent).toEqual([]);
+    // Enter on it does not submit either.
+    await user.keyboard('{Enter}');
+    await delay(50);
+    await expect(sent).toEqual([]);
+    // Firefox hides its message bubble only on an `input` event or when focus leaves the input, and a
+    // press elsewhere while it is up only closes it. The text is fixed by typing, then the input is
+    // left first, as a user would, before Submit is pressed.
+    await user.clear(input);
+    await user.keyboard('11/21/2026');
+    await user.tab();
+    await user.tab();
+    await expect(input.validity.valid).toBe(true);
+    await user.click(canvas.getByRole('button', { name: 'Book' }));
+    await waitFor(() => expect(sent).toEqual(['2026-11-21']));
+    // Enter reads the date, and it is the date that is sent.
+    await user.click(input);
+    await user.clear(input);
+    await user.keyboard('x{Enter}');
+    await user.clear(input);
+    await user.keyboard('12/01/2026{Enter}');
+    await waitFor(() => expect(sent).toEqual(['2026-11-21', '2026-12-01']));
+  },
+};
diff --git a/src/components/date-picker/DatePicker.test.tsx b/src/components/date-picker/DatePicker.test.tsx
index 92e769f..973a2a2 100644
--- a/src/components/date-picker/DatePicker.test.tsx
+++ b/src/components/date-picker/DatePicker.test.tsx
@@ -69,7 +69,7 @@ describe('DatePicker', () => {
 
     it('is a frame holding the text input and the calendar button, then the hidden input and popup', () => {
       render(<DP name="checkin" size="lg" />);
-      expect(root().children).toHaveLength(3);
+      expect(root().children).toHaveLength(4);
       const frame = root().querySelector('.flg-input')!;
       expect(frame).toHaveAttribute('data-size', 'lg');
       expect(root()).toHaveAttribute('data-size', 'lg');
@@ -792,6 +792,350 @@ describe('DatePicker', () => {
     });
   });
 
+  describe('errors', () => {
+    const message = () => document.querySelector<HTMLElement>('.flg-field-error');
+    const live = () => document.querySelector<HTMLElement>('[aria-live]')!.textContent;
+    const saidAfterATask = async () => {
+      await aTaskLater();
+      return live();
+    };
+
+    it('says "Invalid date" for text it cannot read, under the frame, and keeps text and value', () => {
+      render(<DP defaultValue="2026-11-14" />);
+      type('abc');
+      leave();
+      expect(message()).toHaveTextContent('Invalid date');
+      expect(message()!.tagName).toBe('P');
+      expect(message()!.parentElement).toBe(root());
+      expect(message()!.previousElementSibling).toBe(popup());
+      expect(input()).toHaveValue('abc');
+      expect(hidden()).toHaveValue('2026-11-14');
+    });
+
+    it('says "This date is not available" for a date outside min and max or marked unavailable', () => {
+      render(
+        <DP
+          min="2026-11-10"
+          max="2026-11-20"
+          isDateUnavailable={(date) => date === '2026-11-18'}
+        />,
+      );
+      for (const text of ['11/09/2026', '11/21/2026', '11/18/2026']) {
+        type(text);
+        leave();
+        expect(message()).toHaveTextContent('This date is not available');
+        expect(input()).toHaveValue(text);
+      }
+      type('abc');
+      leave();
+      expect(message()).toHaveTextContent('Invalid date');
+    });
+
+    it('takes both messages from labels', () => {
+      render(
+        <DP
+          min="2026-11-10"
+          labels={{ invalidDate: 'Ngày sai', unavailableDate: 'Ngày không chọn được' }}
+        />,
+      );
+      type('abc');
+      leave();
+      expect(message()).toHaveTextContent('Ngày sai');
+      type('11/09/2026');
+      leave();
+      expect(message()).toHaveTextContent('Ngày không chọn được');
+    });
+
+    it('marks the input and the frame invalid, and joins the message to aria-describedby', () => {
+      render(<DP aria-describedby="hint" />);
+      expect(input()).not.toHaveAttribute('aria-invalid');
+      expect(root()).not.toHaveAttribute('data-invalid');
+      type('abc');
+      leave();
+      expect(input()).toHaveAttribute('aria-invalid', 'true');
+      expect(root()).toHaveAttribute('data-invalid');
+      expect(root().querySelector('.flg-input')).toHaveAttribute('data-invalid');
+      expect(input().getAttribute('aria-describedby')!.split(' ')).toEqual(['hint', message()!.id]);
+    });
+
+    it('makes the input custom-invalid with the message, and stops the form submitting', () => {
+      const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
+      const { container } = render(
+        <form onSubmit={onSubmit}>
+          <DP name="d" defaultValue="2026-11-14" />
+        </form>,
+      );
+      const form = container.querySelector('form')!;
+      expect(input().validity.customError).toBe(false);
+      type('abc');
+      leave();
+      expect(input().validity.customError).toBe(true);
+      expect(input().validationMessage).toBe('Invalid date');
+      expect(form.checkValidity()).toBe(false);
+      form.requestSubmit();
+      expect(onSubmit).not.toHaveBeenCalled();
+      type('11/20/2026');
+      leave();
+      expect(input().validity.customError).toBe(false);
+      form.requestSubmit();
+      expect(onSubmit).toHaveBeenCalledTimes(1);
+    });
+
+    it('stops the form for a date that cannot be chosen, with its message', () => {
+      const { container } = render(
+        <form>
+          <DP min="2026-11-10" />
+        </form>,
+      );
+      type('11/09/2026');
+      leave();
+      expect(input().validationMessage).toBe('This date is not available');
+      expect(container.querySelector('form')!.checkValidity()).toBe(false);
+    });
+
+    it('says the message through the live region', async () => {
+      render(<DP min="2026-11-10" />);
+      expect(live()).toBe('');
+      type('abc');
+      leave();
+      expect(await saidAfterATask()).toBe('Invalid date');
+      type('11/09/2026');
+      leave();
+      expect(await saidAfterATask()).toBe('This date is not available');
+    });
+
+    it('has the live region in the root, after the message, from the first render', () => {
+      render(<DP />);
+      const region = document.querySelector('[aria-live]')!;
+      expect(region).toHaveAttribute('aria-live', 'polite');
+      expect(region).toHaveAttribute('aria-atomic', 'true');
+      expect(region).toBeEmptyDOMElement();
+      expect(region.parentElement).toBe(root());
+      type('abc');
+      leave();
+      expect(message()!.nextElementSibling).toBe(region);
+    });
+
+    it('does not say the same unreadable text again when it is left a second time', async () => {
+      render(<DP />);
+      type('abc');
+      leave();
+      await aTaskLater();
+      expect(live()).toBe('Invalid date');
+      // An announcement clears the region first, so a second one shows an empty region at once.
+      leave();
+      expect(live()).toBe('Invalid date');
+      expect(message()).toHaveTextContent('Invalid date');
+      // Enter is the user's explicit act: it says it again.
+      key('Enter');
+      expect(live()).toBe('');
+      expect(await saidAfterATask()).toBe('Invalid date');
+    });
+
+    it('says it again for text that was edited and left again, and for another message', async () => {
+      render(<DP min="2026-11-10" />);
+      type('abc');
+      leave();
+      await aTaskLater();
+      type('abcd');
+      type('abc');
+      leave();
+      expect(live()).toBe('');
+      expect(await saidAfterATask()).toBe('Invalid date');
+      type('11/09/2026');
+      leave();
+      expect(await saidAfterATask()).toBe('This date is not available');
+    });
+
+    it('does not judge the text while focus only moves to the calendar button', async () => {
+      render(<DP />);
+      type('abc');
+      act(() => {
+        input().focus();
+        button().focus();
+      });
+      expect(message()).toBeNull();
+      expect(await saidAfterATask()).toBe('');
+    });
+
+    it('goes to a Field, which shows it as its error, and the DatePicker draws none of its own', () => {
+      render(
+        <Field label="Check-in" description="Write it mm/dd/yyyy.">
+          <DatePicker today="2026-11-04" />
+        </Field>,
+      );
+      type('abc');
+      leave();
+      expect(document.querySelectorAll('.flg-field-error')).toHaveLength(1);
+      const error = message()!;
+      expect(error).toHaveTextContent('Invalid date');
+      expect(root().contains(error)).toBe(false);
+      expect(input()).toHaveAttribute('aria-invalid', 'true');
+      const described = input().getAttribute('aria-describedby')!.split(' ');
+      expect(described).toContain(error.id);
+      expect(described).toHaveLength(2);
+      expect(input().validity.customError).toBe(true);
+      type('11/14/2026');
+      leave();
+      expect(message()).toBeNull();
+      expect(input()).not.toHaveAttribute('aria-invalid');
+    });
+
+    it('lets the error of a Field win over its own message, and still marks the input', async () => {
+      render(
+        <Field label="Check-in" error="Pick a later date.">
+          <DatePicker today="2026-11-04" />
+        </Field>,
+      );
+      type('abc');
+      leave();
+      expect(document.querySelectorAll('.flg-field-error')).toHaveLength(1);
+      expect(message()).toHaveTextContent('Pick a later date.');
+      // The message is still the input's own, for the browser and the screen reader.
+      expect(input().validationMessage).toBe('Invalid date');
+      expect(await saidAfterATask()).toBe('Invalid date');
+    });
+
+    describe('goes away', () => {
+      const gone = () => {
+        expect(message()).toBeNull();
+        expect(input()).not.toHaveAttribute('aria-invalid');
+        expect(root()).not.toHaveAttribute('data-invalid');
+        expect(input().validity.customError).toBe(false);
+        expect(input().getAttribute('aria-describedby')).toBeNull();
+      };
+      const fail = (props: Partial<ComponentProps<typeof DatePicker>> = {}) => {
+        render(<DP defaultValue="2026-11-14" name="d" {...props} />);
+        type('abc');
+        leave();
+        expect(message()).not.toBeNull();
+      };
+
+      it('when the text is fixed to a date it can read', () => {
+        fail();
+        type('11/20/2026');
+        leave();
+        gone();
+        expect(hidden()).toHaveValue('2026-11-20');
+      });
+
+      it('when the text is fixed to the date it already has', () => {
+        fail();
+        type('11/14/2026');
+        leave();
+        gone();
+        expect(hidden()).toHaveValue('2026-11-14');
+      });
+
+      it('when the text is fixed on Enter, before the form that submits reads the input', () => {
+        fail();
+        type('11/20/2026');
+        key('Enter');
+        // Nothing is awaited: the form's own check runs right after the keydown.
+        expect(input().validity.customError).toBe(false);
+        gone();
+      });
+
+      it('when the text is emptied, and the value is null', () => {
+        const onValueChange = vi.fn();
+        fail({ onValueChange });
+        type('');
+        leave();
+        gone();
+        expect(onValueChange).toHaveBeenCalledWith(null);
+        expect(hidden()).toHaveValue('');
+      });
+
+      it('when a date is chosen in the calendar', () => {
+        fail();
+        fireEvent.click(button());
+        fireEvent.click(day('2026-11-18'));
+        gone();
+        expect(input()).toHaveValue('11/18/2026');
+      });
+
+      it('when the day chosen in the calendar is the one already the value', () => {
+        fail();
+        fireEvent.click(button());
+        fireEvent.click(day('2026-11-14'));
+        gone();
+        expect(input()).toHaveValue('11/14/2026');
+      });
+
+      it('when the parent changes the value, which brings its text', () => {
+        function Parent() {
+          const [value, setValue] = useState<string | null>('2026-11-14');
+          return (
+            <>
+              <DP value={value} onValueChange={setValue} />
+              <button type="button" onClick={() => setValue('2026-12-01')}>
+                Parent
+              </button>
+            </>
+          );
+        }
+        render(<Parent />);
+        type('abc');
+        leave();
+        expect(message()).not.toBeNull();
+        fireEvent.click(screen.getByRole('button', { name: 'Parent' }));
+        gone();
+        expect(input()).toHaveValue('12/01/2026');
+      });
+
+      it('on reset of the form', async () => {
+        const { container } = render(
+          <form>
+            <DP defaultValue="2026-11-14" name="d" />
+          </form>,
+        );
+        type('abc');
+        leave();
+        expect(message()).not.toBeNull();
+        container.querySelector('form')!.reset();
+        await aTaskLater();
+        gone();
+        expect(input()).toHaveValue('11/14/2026');
+      });
+    });
+
+    it('stays while the calendar is opened and a month is browsed', () => {
+      render(<DP />);
+      type('abc');
+      leave();
+      fireEvent.click(button());
+      fireEvent.click(nextMonth());
+      expect(message()).toHaveTextContent('Invalid date');
+    });
+
+    it('does not judge text on opening the calendar', () => {
+      render(<DP />);
+      type('abc');
+      fireEvent.click(button());
+      expect(message()).toBeNull();
+    });
+
+    it('keeps the invalid prop beside a message, and shows no message without one', () => {
+      render(<DP invalid />);
+      expect(input()).toHaveAttribute('aria-invalid', 'true');
+      expect(message()).toBeNull();
+      expect(input().validity.customError).toBe(false);
+      type('abc');
+      leave();
+      expect(message()).toHaveTextContent('Invalid date');
+      type('11/14/2026');
+      leave();
+      expect(message()).toBeNull();
+      expect(input()).toHaveAttribute('aria-invalid', 'true');
+    });
+
+    it('does not judge read-only text', () => {
+      render(<DP readOnly defaultValue="2026-11-14" />);
+      leave();
+      expect(message()).toBeNull();
+    });
+  });
+
   describe('dev warnings', () => {
     it('ignores a date that is no ISO date, and says which prop', () => {
       const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/date-picker/DatePicker.test.tsx
```

Expected: FAIL. Ở mỗi project React, 24 test fail và 59 pass. Mỗi lỗi một dòng, như bản nháp ghi:
- `is a frame holding the text input and the calendar button, then the hidden input and popup` (đã sửa): mong 4 con, có 3;
- `says "Invalid date" for text it cannot read, under the frame, and keeps text and value`, `says "This date is not available" for a date outside min and max or marked unavailable`, `takes both messages from labels`: `toHaveTextContent` trên một phần tử không có (chưa có lời báo);
- `marks the input and the frame invalid, and joins the message to aria-describedby`: không có `aria-invalid`;
- `makes the input custom-invalid with the message, and stops the form submitting`: `validity.customError` là `false`;
- `stops the form for a date that cannot be chosen, with its message`: `validationMessage` rỗng;
- `says the message through the live region`, `does not say the same unreadable text again when it is left a second time`, `says it again for text that was edited and left again, and for another message`, `does not judge the text while focus only moves to the calendar button`: không có phần tử `[aria-live]`;
- `has the live region in the root, after the message, from the first render`: không có vùng live;
- `goes to a Field, which shows it as its error, and the DatePicker draws none of its own`, `lets the error of a Field win over its own message, and still marks the input`: không có `.flg-field-error`, không có lời validity;
- tám test của nhóm `goes away`: điều kiện đầu "đang có lời báo" fail;
- `stays while the calendar is opened and a month is browsed`, `keeps the invalid prop beside a message, and shows no message without one`: không có lời báo.

Hai test pass trên code cũ là test đặc tả, giữ những gì phải giữ: `does not judge text on opening the calendar` và `does not judge read-only text`.

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
index e2e2bf4..7b56d54 100644
--- a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
+++ b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
@@ -1020,7 +1020,7 @@ Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "size" |
   - Đọc được và chọn được: giá trị đổi, chữ được định dạng lại (`formatDate`).
   - Không đọc được: lời báo `labels.invalidDate`; giá trị giữ nguyên; chữ giữ nguyên để người dùng sửa; ô gõ có `aria-invalid` và `setCustomValidity`.
   - Đọc được nhưng ngoài `[min, max]` hoặc `isDateUnavailable` trả `true`: như trên, với lời báo `labels.unavailableDate` (Claude chốt).
-  - Lời báo hiện qua `useControlError` (§3.2) và được đọc qua vùng live; mất khi chữ được sửa thành ngày hợp lệ, khi chọn trong lịch, hoặc khi reset.
+  - Lời báo hiện qua `useControlError` (§3.2) và được đọc qua vùng live; mất khi chữ được chốt (rời ô, Enter) thành ngày hợp lệ hoặc ô trống, khi chọn trong lịch, khi component cha đổi `value`, hoặc khi reset; gõ từng phím không làm nó mất, để lời báo không nhấp nháy khi ngày còn đang gõ dở (phát hiện khi lập Plan C).
   - Docs khuyên ghi định dạng ngày trong `description` của Field: placeholder biến mất khi người dùng bắt đầu gõ.
 - **Mở lịch:** bấm nút lịch (`useTriggerPress`, như trigger của Popover), hoặc Alt+↓ trong ô gõ.
   - Chữ đang gõ dở được đọc trước khi mở, để lịch mở ở đúng tháng.
diff --git a/src/components/date-picker/DatePicker.mdx b/src/components/date-picker/DatePicker.mdx
index ba1076b..10132b1 100644
--- a/src/components/date-picker/DatePicker.mdx
+++ b/src/components/date-picker/DatePicker.mdx
@@ -58,7 +58,7 @@ of two digits is 20xx.
   for `11/14/26`.
 - Empty text is `null`.
 - Text that cannot be read, or a date outside `min` and `max` or that `isDateUnavailable` refuses, stays
-  as typed, and the value stays what it was.
+  as typed, and the value stays what it was. The DatePicker says why ([Errors](#errors)).
 - Enter reads the text. When it stays, Enter does not submit the form, so the form cannot go out with
   an old date beside text that says another. Otherwise Enter is left to the browser: in a form it
   submits the date that was just read.
@@ -144,6 +144,49 @@ words with `labels`.
 `today` (an ISO date) replaces the clock. Pass it in tests and demos, so a screenshot or an assertion
 does not change with the day it runs. Every story of this page does.
 
+## Errors
+
+Text that stays as typed is a mistake the DatePicker reports itself, so the user is never left with a
+red frame and no reason:
+
+| The text is                                                        | The message                  | The label         |
+| ------------------------------------------------------------------ | ---------------------------- | ----------------- |
+| Not a date in the order of the locale (`abc`, `2/30/2026`)         | `Invalid date`               | `invalidDate`     |
+| A date outside `min` and `max`, or one `isDateUnavailable` refuses | `This date is not available` | `unavailableDate` |
+
+While there is a message, the value and the text stay, the input has `aria-invalid="true"` and
+`setCustomValidity(message)` (so a form does not submit, and the browser's own bubble says why), and the
+frame has the danger border.
+
+- **Inside a Field** the message is shown as the Field's error, in the place of an error that you
+  pass, unless you pass one: an `error` of the Field wins on screen.
+- **Outside a Field** it is drawn under the frame and joined to `aria-describedby`.
+- **Screen readers** hear it through a live region of the DatePicker when the text is left or Enter is
+  pressed. Leaving again with the same text says nothing new; changing the text and leaving does.
+- **It goes away** when the text is fixed to a date it can read (on leaving or Enter), when the text is
+  emptied, when a date is chosen in the calendar, when a parent changes `value`, and when the form
+  resets.
+- **Opening the calendar** does not judge unreadable text: the user has not left it, and the calendar
+  opens on the month of the value.
+
+Translate both messages with the rest of the words:
+
+```tsx
+<DatePicker
+  locale="vi-VN"
+  labels={{
+    invalidDate: 'Ngày không hợp lệ',
+    unavailableDate: 'Không thể chọn ngày này',
+    openCalendar: 'Chọn ngày',
+    dialog: 'Chọn ngày',
+  }}
+/>
+```
+
+<Canvas of={Stories.Invalid} />
+<Canvas of={Stories.Fixing} />
+<Canvas of={Stories.Unavailable} />
+
 ## In a form
 
 The DatePicker works in a plain `<form>`, with no code to join it up:
@@ -152,18 +195,21 @@ The DatePicker works in a plain `<form>`, with no code to join it up:
   empty string for no date. The text input has no `name`: what the user sees is not what is sent.
 - **`required`** is on the text input, so the browser's own message appears on it, and it is empty
   exactly when the value is `null`.
-- **Enter** reads the date and the form submits that date.
+- **Enter** reads the date and the form submits that date. Text that stays stops the submit, on the
+  text input, with its message.
 - **Reset**: an uncontrolled DatePicker goes back to `defaultValue` and its text, unless the reset is
   cancelled with `preventDefault()`. A controlled one keeps its value and puts its text back.
 - **`disabled`** disables the text input, the button and the hidden input, so nothing is submitted.
 
 <Canvas of={Stories.InAForm} />
+<Canvas of={Stories.BlockedSubmit} />
 
 ## In a Field
 
 Inside a `Field` the label points at the text input and the description and error are read with it
 (`aria-describedby`); `required`, `disabled` and the invalid state come from the Field. `invalid` marks
-the frame with the danger border on its own.
+the frame with the danger border on its own. The message of a typed date that stays (see
+[Errors](#errors)) is passed up to the Field, which shows it as its error.
 
 ## Read only
 
@@ -204,7 +250,7 @@ outside the panel closes only the calendar too.
   locales that start the week on Monday.
 - Do pass `today` in tests and demos, and keep the value as the ISO string.
 - Do use `min`, `max` and `isDateUnavailable` for the dates that cannot be chosen, and tell the user
-  why near the field.
+  why near the field: the DatePicker says only that the date is not available, not why.
 - Don't build the value with `new Date('2026-11-14')`: that reads UTC and writes local time. Pass the
   string on.
 - Don't rely on the placeholder to say the format: it goes when the user types.
diff --git a/src/components/date-picker/DatePicker.tsx b/src/components/date-picker/DatePicker.tsx
index da8cc78..2904887 100644
--- a/src/components/date-picker/DatePicker.tsx
+++ b/src/components/date-picker/DatePicker.tsx
@@ -20,11 +20,12 @@ import {
   parseDate,
   todayIso,
 } from '../../internal/date';
-import { markAsFieldControl, useFieldProps } from '../../internal/field-context';
+import { markAsFieldControl, useControlError, useFieldProps } from '../../internal/field-context';
 import { focusInput } from '../../internal/focus-input';
 import { CalendarIcon } from '../../internal/icons';
 import { mergeRefs } from '../../internal/merge-refs';
 import { hasModifier, isComposing } from '../../internal/roving';
+import { useAnnounce } from '../../internal/use-announce';
 import { useControllableState } from '../../internal/use-controllable-state';
 import { useFloating } from '../../internal/use-floating';
 import { useFormReset } from '../../internal/use-form-reset';
@@ -42,6 +43,10 @@ export interface DatePickerLabels extends CalendarLabels {
   openCalendar?: string;
   /** The name of the calendar's dialog. Default `"Choose date"`. */
   dialog?: string;
+  /** What is said of text that is no date. Default `"Invalid date"`. */
+  invalidDate?: string;
+  /** What is said of a date outside `min` and `max`, or one `isDateUnavailable` marks. Default `"This date is not available"`. */
+  unavailableDate?: string;
 }
 
 export interface DatePickerProps extends Omit<
@@ -143,12 +148,24 @@ export const DatePicker = markAsFieldControl(
       onKeyDown,
       ...rest
     } = props;
+    // What is wrong with the text that stays in the input, if anything. The message is made from the
+    // labels when it is shown, so a translation that arrives later is used.
+    const [fault, setFault] = useState<'invalid' | 'unavailable' | null>(null);
+    const messageOf = (why: 'invalid' | 'unavailable') =>
+      why === 'invalid'
+        ? (labels?.invalidDate ?? 'Invalid date')
+        : (labels?.unavailableDate ?? 'This date is not available');
+    const message = fault === null ? null : messageOf(fault);
+    // The message goes to the Field, which shows it unless it has an `error` of its own, or comes back
+    // here to be shown under the frame.
+    const ownError = useControlError(message);
+    const { announce, region } = useAnnounce();
     const fieldProps = useFieldProps({
       id,
-      invalid: invalidProp,
+      invalid: invalidProp ?? (message === null ? undefined : true),
       required,
       disabled: disabledProp,
-      'aria-describedby': describedBy,
+      'aria-describedby': [describedBy, ownError?.id].filter(Boolean).join(' ') || undefined,
       'aria-invalid': ariaInvalid,
     });
     const { invalid, disabled = false } = fieldProps;
@@ -182,6 +199,9 @@ export const DatePicker = markAsFieldControl(
       if (syncedKey.current === syncKey) return;
       syncedKey.current = syncKey;
       setText(textOf(value));
+      // The text is the value's again, so whatever was wrong with the typed text is gone.
+      lastFaulty.current = null;
+      setFault(null);
       // `value` and `locale` are the key; only a change of the key matters.
     }, [syncKey]);
     const latestValue = useRef(value);
@@ -193,17 +213,37 @@ export const DatePicker = markAsFieldControl(
       (min !== undefined && compareIso(date, min) < 0) ||
       (max !== undefined && compareIso(date, max) > 0) ||
       isDateUnavailable?.(date) === true;
+    type Reading = { date: string | null } | { fault: 'invalid' | 'unavailable' };
     /**
-     * What the text says: a date that can be chosen, or `null` for no date (empty text). `undefined`
-     * when it cannot be read, or is a date that cannot be chosen: it stays as typed.
+     * What the text says: a date that can be chosen, or `null` for no date (empty text); else why it
+     * stays as typed: it cannot be read, or it is a date that cannot be chosen.
      */
-    const read = (): { date: string | null } | undefined => {
+    const read = (): Reading => {
       if (text.trim() === '') return { date: null };
       const date = parseDate(text, locale);
-      return date === null || unavailable(date) ? undefined : { date };
+      if (date === null) return { fault: 'invalid' };
+      return unavailable(date) ? { fault: 'unavailable' } : { date };
+    };
+    // The text as it stood when its fault was last said. Leaving with that very text is not a new
+    // request: judging it again would say the same message again. Any edit forgets it; Enter, being
+    // the user's explicit act, says it again.
+    const lastFaulty = useRef<string | null>(null);
+    const clearFault = () => {
+      lastFaulty.current = null;
+      setFault(null);
+      // The browser's check is what stops a submit, and a submit can follow before React renders.
+      inputRef.current?.setCustomValidity('');
+    };
+    /** Says why the text stays, once for each text unless `again`. */
+    const refuse = (reading: { fault: 'invalid' | 'unavailable' }, again: boolean) => {
+      setFault(reading.fault);
+      if (!again && lastFaulty.current === text) return;
+      lastFaulty.current = text;
+      announce(messageOf(reading.fault));
     };
     /** Makes what the text says the value, and writes the text in the format of the locale. */
     const commit = (reading: { date: string | null }) => {
+      clearFault();
       // A value that changes brings its text (see `syncKey`); the one already chosen only has its
       // text put back in the format, as typed another way ("11/14/26").
       if (reading.date === value) setText(textOf(value));
@@ -257,8 +297,10 @@ export const DatePicker = markAsFieldControl(
     // opens on its month (text that cannot be read leaves the month of the value, or today's).
     const openCalendar = () => {
       if (disabled || readOnly) return;
+      // Text that cannot be read is not judged here: the user has not left it, and the calendar
+      // opens on the month of the value.
       const reading = read();
-      if (reading) commit(reading);
+      if ('date' in reading) commit(reading);
       request(true);
     };
     // A press on the button light-dismisses an open popup before the click arrives: it closes it.
@@ -288,7 +330,10 @@ export const DatePicker = markAsFieldControl(
     });
 
     // --- The text.
-    const handleChange = (event: ChangeEvent<HTMLInputElement>) => setText(event.target.value);
+    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
+      lastFaulty.current = null;
+      setText(event.target.value);
+    };
     const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
       // Keys that pick or move through a composition belong to the input method.
       if (isComposing(event)) return;
@@ -297,9 +342,10 @@ export const DatePicker = markAsFieldControl(
         if (!open) openCalendar();
       } else if (event.key === 'Enter' && !hasModifier(event) && !readOnly) {
         const reading = read();
-        if (!reading) {
+        if ('fault' in reading) {
           // Text that stays must not submit the form with the old date beside it.
           event.preventDefault();
+          refuse(reading, true);
           return;
         }
         commit(reading);
@@ -332,7 +378,8 @@ export const DatePicker = markAsFieldControl(
       if (!to && !document.hasFocus()) return;
       if (readOnly) return;
       const reading = read();
-      if (reading) commit(reading);
+      if ('date' in reading) commit(reading);
+      else refuse(reading, false);
     };
 
     // --- The popup.
@@ -343,6 +390,7 @@ export const DatePicker = markAsFieldControl(
       const target = (event.target as Element).closest<HTMLElement>('button[data-date]');
       const date = target?.dataset.date;
       if (!date || target.getAttribute('aria-disabled') === 'true') return;
+      clearFault();
       if (date === value) setText(textOf(value));
       else setValue(date);
       inputRef.current?.focus({ preventScroll: true });
@@ -367,10 +415,16 @@ export const DatePicker = markAsFieldControl(
     // input has no value of its own to go back to. An uncontrolled picker goes back to its default, a
     // controlled one keeps its value, and either way the text is put back to the value's.
     useFormReset(inputRef, () => {
+      clearFault();
       resetValue(defaultDate);
       setText(textOf(valueProp === undefined ? defaultDate : latestValue.current));
     });
 
+    // The input says it is not valid, which is what stops a submit and what its bubble reads.
+    useIsoLayoutEffect(() => {
+      inputRef.current?.setCustomValidity(message ?? '');
+    }, [message]);
+
     return (
       <div
         className={clsx('flg-date-picker', className)}
@@ -450,6 +504,12 @@ export const DatePicker = markAsFieldControl(
             />
           ) : null}
         </div>
+        {ownError ? (
+          <p id={ownError.id} className="flg-field-error">
+            {ownError.message}
+          </p>
+        ) : null}
+        {region}
       </div>
     );
   }),
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/date-picker src/index.test.ts
pnpm vitest run --project storybook-light --project storybook-dark src/components/date-picker
pnpm build && pnpm check:package
```

Expected:
- Unit: 172 test PASS, không lỗi kiểu (`DatePicker.test.tsx` 83 ở mỗi project React, `DatePicker.test-d.ts` 5, `index.test.ts` 1).
- Story DatePicker: 96 test PASS (16 story × ba engine × hai theme).
- `check:package`: mọi check trừ `size` PASS. **`size` fail, chỉ ở JS**: theo lần chạy nháp 40.94 kB trên ngưỡng 40.59 kB (vượt 357 B); CSS trong ngưỡng. Không chạy `pnpm size:record` ở task này.
- Không CSS nào đổi; chỉ DOM của DatePicker (component mới) có thêm lời báo và vùng live, nên ảnh chuẩn của component cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md \
  src/components/date-picker/DatePicker.mdx \
  src/components/date-picker/DatePicker.stories.tsx \
  src/components/date-picker/DatePicker.test.tsx \
  src/components/date-picker/DatePicker.tsx
```
```bash
git commit -m "feat(date-picker): say why text that stays is not a date, or not an available one" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 6: Cặp tương phản, ngưỡng kích thước, kiểm tra cuối

Spec §4.4 (các cặp `calendar-weekday-text`, `calendar-outside-day`, `date-picker-icon`; quy tắc `prefers-contrast: more` của ngày tháng khác và ngày trong khoảng), §4.9 của spec 0+1, §7 dòng 4 và các kiểm tra gói phát hành.
- **Tương phản.** `check:contrast` đo thêm ba cặp, trên kính thường và trên panel có scrim, giữ số thấp hơn:
  - `calendar-weekday-text` (4.5): chữ `--flg-text-muted` của hàng thứ trên bề mặt mà Calendar nằm trên: trang, với một Calendar đứng riêng; popup (một `Surface`), với DatePicker, là trường hợp panel có scrim.
  - `calendar-outside-day` (4.5): ngày của tháng khác, `--flg-text-muted` với `opacity: .5` (1 ở contrast-more), trên bề mặt.
  - `date-picker-icon` (3): icon lịch `--flg-text-muted` trên `--flg-control-bg` của khung.
- Hàm `removeIcon` của script thành `withOpacity(name, opacity)`, dùng chung cho icon × của TagInput và ngày tháng khác.
- `calendar-weekday-text` tối là 4.10:1, đúng cặp của dòng 6 §4.9, nên dòng 6 được mở rộng. `calendar-outside-day` là dòng 18 mới (phát hiện 10). Hai điều này chờ chủ dự án duyệt (phát hiện 11).
- **Contrast-more.** `preferences.css`: `.flg-calendar-day[data-outside] { opacity: 1 }`. Dải khoảng đã dùng `--flg-selected-*`, mà chế độ này đổi sẵn, nên không thêm quy tắc (phát hiện 6). Giao diện mặc định không đổi, nên không đổi ảnh chuẩn.
- **Ngưỡng kích thước** ghi bằng `pnpm size:record` (không chép `.size-limit.json`).
- **Kiểm tra cuối**: unit đủ bộ, tương phản, package, tên package, story từng thư mục, fixtures.

**Files:**
- Modify: `src/docs/ExceptionTable.test.tsx`, `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`, `src/styles/preferences.css`, `.size-limit.json`

**Interfaces:**
- Produces:
  - Ba check mới trong `CHECKS` của `scripts/lib/contrast.ts`: `'calendar-weekday-text': 4.5`, `'calendar-outside-day': 4.5`, `'date-picker-icon': 3`.
  - `KNOWN_EXCEPTIONS` có thêm `{ row: 6, theme: 'dark', check: 'calendar-weekday-text', recorded: 4.1 }`, và dòng 18 với `{ theme: 'light', check: 'calendar-outside-day', recorded: 2.04 }`, `{ theme: 'dark', …, recorded: 2.14 }`, tiêu chí `1.4.3`.
  - Bảng §4.9 của spec 0+1 có 18 dòng; `ExceptionTable` render 18 dòng.
  - Ngưỡng mới JS 45038 B, CSS 8880 B.
- Consumes: mọi thứ ở Task 1 đến 5.

- [ ] **Step 1: Viết test**

`ExceptionTable` render bảng §4.9 từ `KNOWN_EXCEPTIONS`. Test đòi 18 dòng, số đo của dòng 18 và tiêu chí `1.4.3` của nó.

```diff
diff --git a/src/docs/ExceptionTable.test.tsx b/src/docs/ExceptionTable.test.tsx
index 7bf9b8a..d8e1f67 100644
--- a/src/docs/ExceptionTable.test.tsx
+++ b/src/docs/ExceptionTable.test.tsx
@@ -14,9 +14,9 @@ describe('ExceptionTable', () => {
       .getAllByRole('cell')
       .map((cell) => cell.textContent);
 
-  it('lists the seventeen rows of spec §4.9 with light and dark measurements', () => {
+  it('lists the eighteen rows of spec §4.9 with light and dark measurements', () => {
     const rows = bodyRows();
-    expect(rows).toHaveLength(17);
+    expect(rows).toHaveLength(18);
     expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
       '1',
       '2',
@@ -35,6 +35,7 @@ describe('ExceptionTable', () => {
       '15',
       '16',
       '17',
+      '18',
     ]);
     expect(rows[3]).toHaveTextContent('meets AA (4.74:1)');
     expect(rows[3]).toHaveTextContent('3.63:1 / 2.24:1');
@@ -53,6 +54,8 @@ describe('ExceptionTable', () => {
     expect(cells(rows[14]!).slice(1, 3)).toEqual(['2.88:1', '2.82:1']);
     expect(cells(rows[15]!).slice(1, 3)).toEqual(['1.23:1', '1.30:1']);
     expect(cells(rows[16]!).slice(1, 3)).toEqual(['1.29:1', '2.24:1']);
+    // The days of the months around in a Calendar (spec phase 3 §4.4).
+    expect(cells(rows[17]!).slice(1, 3)).toEqual(['2.04:1', '2.14:1']);
   });
 
   it('shows the live measurement for a theme with no exception in a row', () => {
@@ -82,6 +85,7 @@ describe('ExceptionTable', () => {
       '1.4.11',
       '1.4.11',
       '1.4.11',
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

Expected: FAIL 2 trong 4 test:
- `lists the eighteen rows of spec §4.9 with light and dark measurements`: `AssertionError: expected [ <tr>…(6)</tr>, <tr>…(6)</tr>, …(15) ] to have a length of 18 but got 17`;
- `names the WCAG criterion and minimum of every row`: `AssertionError: expected [ '1.4.11', '1.4.11', '1.4.11', …(14) ] to deeply equal [ '1.4.11', '1.4.11', '1.4.11', …(15) ]`.

Rồi lưu khối patch ở Step 3 vào `../task-6-code.patch` (giữ LF). Áp riêng phần `scripts/lib/contrast.ts` (ba check mới), và chạy test của script:

```bash
git apply --include=scripts/lib/contrast.ts ../task-6-code.patch
pnpm vitest run --project scripts scripts/lib/contrast.test.ts
```

Expected: FAIL ở `evaluate with the shipped values > passes with only the known exceptions of spec §4.9`: `AssertionError: expected [ { theme: 'light', …(5) }, …(2) ] to deeply equal []`. Ba finding `below-threshold`, đều ở chế độ `default`: `calendar-outside-day` sáng (2.04), `calendar-weekday-text` tối (4.10) và `calendar-outside-day` tối (2.14). Hai lỗi của Step 2 được đo khi lập plan, trên các file của bản nháp (phát hiện 13).

- [ ] **Step 3: Viết code**

Phần `scripts/lib/contrast.ts` của khối dưới đây đã được áp ở Step 2. Áp phần còn lại:

```bash
git apply --exclude=scripts/lib/contrast.ts ../task-6-code.patch
```

```diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index eb5eb33..1701cb1 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -317,7 +317,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 3 | Viền Input/Textarea khi focus (control không lỗi) | đạt (4.45:1) | 2.06:1 | 3:1 | 1.4.11 |
 | 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
 | 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) và vạch dưới tab `underline` đang chọn, so với nền | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
-| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
+| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
 | 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn, trang hiện tại của Pagination | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
 | 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn, trang hiện tại của Pagination | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
 | 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
@@ -329,10 +329,11 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 15 | Chấm vạch chia của Slider (`--flg-slider-tick`, 70% `--flg-text-muted`) so với nền | 2.88:1 | 2.82:1 | 3:1 | 1.4.11 |
 | 16 | Rãnh của Slider (`--flg-control-track`) so với nền | 1.23:1 | 1.30:1 | 3:1 | 1.4.11 |
 | 17 | Núm của Slider (`--flg-control-thumb`) so với rãnh và với phần đã chọn | 1.29:1 | 2.24:1 | 3:1 | 1.4.11 |
+| 18 | Số của ngày thuộc tháng khác trong Calendar (`--flg-text-muted`, `opacity: .5`) trên bề mặt | 2.04:1 | 2.14:1 | 4.5:1 | 1.4.3 |
 
-Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Điểm 14 là icon `info` của toast theo mockup toast S2 (giai đoạn 2, Plan E1). Điểm 6 còn là chữ mờ của option Combobox đang lọc và dòng trạng thái (giai đoạn 3, Plan B): cùng cặp màu, nên cùng số đo. Điểm 15–17 là chấm vạch, rãnh và núm của Slider theo mockup S3 (giai đoạn 3, Plan A). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
+Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Điểm 14 là icon `info` của toast theo mockup toast S2 (giai đoạn 2, Plan E1). Điểm 6 còn là chữ mờ của option Combobox đang lọc và dòng trạng thái (giai đoạn 3, Plan B) và chữ hàng thứ của Calendar (giai đoạn 3, Plan C): cùng cặp màu, nên cùng số đo. Điểm 18 là ngày của tháng khác theo mockup K1 (giai đoạn 3, Plan C), nửa độ mờ nên thấp hơn hẳn chữ mờ thường. Điểm 15–17 là chấm vạch, rãnh và núm của Slider theo mockup S3 (giai đoạn 3, Plan A). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
 
-Cả mười bảy điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
+Cả mười tám điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
 
 ---
 
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index da4615c..69ef1bc 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -47,8 +47,8 @@ const D = {
   },
   6: {
     description:
-      'Muted text on the brightest reference backdrop, and the muted text of a Combobox option ' +
-      'while filtering and of its status row',
+      'Muted text on the brightest reference backdrop, the muted text of a Combobox option ' +
+      'while filtering and of its status row, and the weekday row of a Calendar',
     criterion: '1.4.3',
   },
   7: {
@@ -86,6 +86,10 @@ const D = {
     description: 'Slider thumb against its track and against the filled part',
     criterion: '1.4.11',
   },
+  18: {
+    description: 'A day of the month before or after in a Calendar, muted text at half opacity',
+    criterion: '1.4.3',
+  },
 } as const satisfies Record<number, ExceptionRowInfo>;
 
 /** Spec §4.9. The default theme keeps the approved mockup values, so these gaps are accepted. */
@@ -101,6 +105,7 @@ export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
   { row: 5, theme: 'dark', check: 'tab-indicator', recorded: 2.26, ...D[5] },
   { row: 6, theme: 'dark', check: 'text-muted', recorded: 4.1, ...D[6] },
   { row: 6, theme: 'dark', check: 'combobox-unmatched-text', recorded: 4.1, ...D[6] },
+  { row: 6, theme: 'dark', check: 'calendar-weekday-text', recorded: 4.1, ...D[6] },
   { row: 7, theme: 'light', check: 'badge-accent', recorded: 3.4, ...D[7] },
   { row: 7, theme: 'dark', check: 'badge-accent', recorded: 3.76, ...D[7] },
   { row: 7, theme: 'light', check: 'selected-text', recorded: 3.4, ...D[7] },
@@ -125,4 +130,6 @@ export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
   { row: 16, theme: 'dark', check: 'slider-track', recorded: 1.3, ...D[16] },
   { row: 17, theme: 'light', check: 'slider-thumb', recorded: 1.29, ...D[17] },
   { row: 17, theme: 'dark', check: 'slider-thumb', recorded: 2.24, ...D[17] },
+  { row: 18, theme: 'light', check: 'calendar-outside-day', recorded: 2.04, ...D[18] },
+  { row: 18, theme: 'dark', check: 'calendar-outside-day', recorded: 2.14, ...D[18] },
 ];
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index fc3ed34..a6376a1 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -48,6 +48,9 @@ export const CHECKS = {
   'combobox-unmatched-text': 4.5,
   'tag-chip-text': 4.5,
   'tag-remove-icon': 3,
+  'calendar-weekday-text': 4.5,
+  'calendar-outside-day': 4.5,
+  'date-picker-icon': 3,
 } as const;
 export type CheckId = keyof typeof CHECKS;
 const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
@@ -268,8 +271,8 @@ export function measure(
       );
     // A TagInput chip: the neutral Badge track over the frame, which is control-bg over the surface.
     const chipBg = composite(color('control-track'), control);
-    const removeIcon = (opacity: number): Rgba => {
-      const [r, g, b, a] = color('text');
+    const withOpacity = (name: string, opacity: number): Rgba => {
+      const [r, g, b, a] = color(name);
       return [r, g, b, a * opacity];
     };
     const measured: Omit<Record<CheckId, number>, OverlayCheck> = {
@@ -358,9 +361,20 @@ export function measure(
       // Its × is the chip's text at 75% opacity; under contrast-more the button drops the opacity
       // (preferences.css).
       'tag-remove-icon': contrastRatio(
-        composite(removeIcon(mode === 'contrast-more' ? 1 : 0.75), chipBg),
+        composite(withOpacity('text', mode === 'contrast-more' ? 1 : 0.75), chipBg),
         chipBg,
       ),
+      // The weekday row of a Calendar is muted text on the surface it sits on: the page for a bare
+      // Calendar, the popup (a Surface) for a DatePicker, which the scrim case covers.
+      'calendar-weekday-text': onSurface('text-muted'),
+      // A day of the month before or after is muted text at half opacity; under contrast-more it
+      // drops the opacity (preferences.css).
+      'calendar-outside-day': contrastRatio(
+        composite(withOpacity('text-muted', mode === 'contrast-more' ? 1 : 0.5), surface),
+        surface,
+      ),
+      // The calendar icon of a DatePicker, muted text on the background of the frame.
+      'date-picker-icon': contrastRatio(composite(color('text-muted'), control), control),
     };
     for (const id of SURFACE_CHECK_IDS) lowest[id] = Math.min(lowest[id], measured[id]);
   }
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index b546924..c66134c 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -33,6 +33,12 @@
     .flg-tag > button {
       opacity: 1;
     }
+    /* The days of the months around are drawn at half opacity in the mockup; here they keep the
+       muted text whole, which is the pair that is measured (spec phase 3 §4.4). The chosen days of
+       a range keep their own colours: the band uses the selected-* tokens, swapped above. */
+    .flg-calendar-day[data-outside] {
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

Expected: ngưỡng mới gần JS 45038 B, CSS 8880 B (trước: 40586 B, 8309 B), là kết quả ở bản nháp (đo được JS 40943 B, CSS 8072 B; ngưỡng là số đo cộng 10%). Nếu số khác một chút, giữ số do `size:record` ghi và nêu trong báo cáo.

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm check:name
pnpm test:unit
pnpm check:contrast
pnpm build && pnpm check:package
pnpm vitest run --project storybook-light --project storybook-dark src/components/calendar
pnpm vitest run --project storybook-light --project storybook-dark src/components/date-picker
sed -e 's/5173/5174/g' -e 's/4173/4175/g' scripts/test-fixtures.mjs > scripts/test-fixtures.tmp.mjs
node scripts/test-fixtures.tmp.mjs
rm scripts/test-fixtures.tmp.mjs
```

Expected:
- `pnpm check:name`: PASS, không có tên cũ ngoài `docs/superpowers`.
- `pnpm test:unit`: 2510 test PASS, 3 skip.
- `pnpm check:contrast`: PASS (`Contrast check passed.`). Bảng in ra có `calendar-weekday-text` tối và `calendar-outside-day` sáng, tối là `known-exception` với số ở phát hiện 10; các cặp khác `pass`.
- `pnpm check:package`: PASS với ngưỡng mới.
- Story, từng thư mục, ở ba engine và hai theme: calendar 72, date-picker 96, đều PASS.
- Fixture: `Fixtures OK: vite, next.`. Ba dòng cuối chạy bản sao tạm của `pnpm test:fixtures` ở cổng 5174/4175, vì 5173/4173 bận (Global Constraints); trên máy mà hai cổng đó rảnh, chạy `pnpm test:fixtures`. Xoá bản sao, và không để server nào chạy sót.

- [ ] **Step 5: Commit**

```bash
git add \
  .size-limit.json \
  docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md \
  scripts/contrast-exceptions.ts \
  scripts/lib/contrast.ts \
  src/docs/ExceptionTable.test.tsx \
  src/styles/preferences.css
```
```bash
git commit -m "feat: contrast pairs of Calendar and DatePicker, size limits" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```


## Sau khi thực thi

- Đẩy nhánh, rồi tạo ảnh chuẩn bằng workflow "Update visual baselines". Có 6 story mới không mang thẻ `no-visual`: `Look`, `Range` và `Preview` của Calendar; `Look`, `Open` và `Invalid` của DatePicker. Mỗi story có 8 ảnh, tổng cộng 48 ảnh. Xem ảnh trước khi xin review:
  - Calendar khớp mockup K1, DatePicker khớp D1;
  - ở forced colors, ngày hôm nay có viền 1px `CanvasText` (vẽ bằng `::after`), ngày đang chọn là `Highlight`;
  - `Invalid` có khoảng 5px giữa khung và lời báo lỗi;
  - ảnh cũ của mọi component khác phải không đổi.
- Mô tả PR nêu cho chủ dự án:
  - §4.9: dòng 6 mở rộng cho `calendar-weekday-text` (tối 4.10:1) và dòng 18 mới `calendar-outside-day` (2.04:1 sáng, 2.14:1 tối) chờ duyệt;
  - các dòng spec "phát hiện khi lập Plan C" và "phát hiện khi review cuối Plan C";
  - Enter trong DatePicker chốt rồi gửi form (spec §7);
  - các quyết định Claude tự chốt khi thực thi (bên dưới);
  - các mục để lại; chưa thử Safari thật, VoiceOver và NVDA.

### Đã thực thi (2026-11-04)

- Sáu commit của nhánh nháp được cherry-pick lên `feat/phase-3-plan-c` (`6b04d7a`..`03ae57e`); cây giống hệt đầu nhánh nháp.
- Mỗi task có một reviewer riêng (sáu reviewer chạy song song, chỉ đọc):
  - Task 1, 3, 6: không có phát hiện Critical hay Important.
  - **Task 2, một phát hiện Important:** ở forced colors, viền "hôm nay" là `box-shadow`, mà chế độ này bỏ `box-shadow`, nên hôm nay mất dấu (spec §4.5). Sửa ở `73811bc`: viền 1px `CanvasText` vẽ bằng `::after`, tách khỏi vòng focus.
  - **Task 4, Claude nâng một Minor lên:** `required` và ô gõ chỉ có dấu cách, Enter gửi form với ngày rỗng (cùng loại với comment Important của chủ dự án ở PR #12). Sửa ở `0090a62`.
  - **Task 5:** ngoài Field, lời báo lỗi nằm sát khung, thiếu khoảng 5px như TagInput. Sửa ở `643f38a`.
  - Lần review lại thấy cả ba mục đã xử lý.
- Review toàn nhánh trên Opus: "With fixes", mọi phát hiện được chứng minh bằng test chạy thật:
  - **Critical:** locale có lịch khác hoặc chữ số khác làm hỏng ngày: `th-TH` và `fa-IR` lưu `2026-11-14` thành `2569-11-14`, rồi `3112-11-14`; `ar-EG`, `bn-BD`, `mr-IN`, `ne-NP` báo lỗi chính chữ DatePicker viết ra. Sửa ở `3bad59a`: mọi định dạng dùng `calendar: 'gregory'`, chữ gõ dùng `numberingSystem: 'latn'`.
  - **Important:** chọn ngày cuối của khoảng ở tháng sau làm lịch nhảy về tháng trước và mất focus (`ed8750e`); ngày đang chọn không có vòng focus ở forced colors (`d8d7e89`); rời DatePicker từ trong lịch không xét chữ (`4ba993d`); `required` thoả bởi chữ khi component cha từ chối ngày (`abdeae9`); lời báo "không chọn được" cũ chặn submit sau khi `min`/`max` đổi (`5e0b2d3`).
  - Bốn minor rẻ (`0d83dfe`): `aria-multiselectable` ở chế độ khoảng; `readOnly` bỏ qua cú nhấn ngày; cảnh báo khoảng không bao giờ throw; phím kẹp trong 0001-01-01 … 9999-12-31. `a39b3e7`: lint và prettier.
  - Lần review lại (Opus) thấy cả bảy mục đã xử lý, không có lỗi mới Critical hay Important.
- **Quyết định Claude tự chốt khi thực thi** (chủ dự án có thể đảo lại):
  - Task 4: dấu cách không thoả `required` khi Enter (nâng từ Minor, theo comment PR #12).
  - Important 5: một task sau khi component cha từ chối ngày (gõ hoặc chọn trong lịch), chữ trở về chữ của giá trị. Nếu sai: chữ người dùng gõ bị thay bằng ngày cũ thay vì ở lại để sửa.
  - Important 6: khi `min`, `max` hay `isDateUnavailable` đổi lúc đang có lời báo, chữ đã lưu được xét lại; đọc được và chọn được thì được chốt, `onValueChange` được gọi (đó là ngày người dùng đã gõ, không phải component cha đổi giá trị). Nếu sai: component cha nhận một `onValueChange` mà nó không trực tiếp gây ra.
  - Task 6: không thêm quy tắc cho ngày tháng khác bị `aria-disabled` hay nằm trong dải: ngày tháng khác không bao giờ mang hai trạng thái đó.
- **Để lại** (ghi trong mô tả PR):
  - Component cha dời khoảng mà một đầu đang hiện thì tháng không đổi; comment ở `Calendar.tsx` và câu §6.3 nên nói rõ.
  - `Calendar.mdx` nói "chữ số Latin ở mọi locale", nhưng tiêu đề và `aria-label` giữ chữ số của locale; chỉ số ngày trong lưới luôn là Latin.
  - `DatePicker.mdx` và §6.3 nói `required` theo giá trị, nhưng một lần Enter với component cha từ chối vẫn gửi ngày bị từ chối một lần (input ẩn ghi trước cho Firefox, như Combobox ở PR #12).
  - Spec §3.4 và comment ở `date.ts` mất dấu `\` trong `\d`.
  - Chưa có test cho chữ gõ sau một lần bị từ chối được giữ (đoạn kiểm đã có).
  - `monthGrid` hỏng ở hai mép phạm vi năm: tháng 9999-12 có tám ô `10000-01-01`, tháng 0001-01 (tuần bắt đầu Chủ nhật) không có nút ngày nào.
  - Các minor của từng task: lịch Phật giáo/TZ khác/ICU trong test, thứ tự `data-mode`, kiểu `Reading`, thuộc tính `form` của input ẩn (M1), nhãn rỗng.
- Kiểm tra trên `a39b3e7`:
  - lint, typecheck, format, `check:name`, contrast, build, package và fixtures (vite, next, qua bản sao ở cổng 5174/4175) đều đạt;
  - unit: 2543 passed, 3 skipped;
  - kích thước: JS 41,19 kB (giới hạn 45,04 kB), CSS 8,09 kB (giới hạn 8,88 kB);
  - story: calendar 72 và date-picker 96 đạt sau đợt sửa cuối. Máy thiếu bộ nhớ, nên toàn bộ bộ story do CI chạy.
