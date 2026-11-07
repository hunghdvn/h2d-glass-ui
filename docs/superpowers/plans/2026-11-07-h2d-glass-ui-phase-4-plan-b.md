# h2d-glass-ui: Plan B, `ExclamationIcon`, Stepper và List (giai đoạn 4, phần 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm Plan B, plan thứ hai của giai đoạn 4: `Stepper` và `Step` (cùng icon `ExclamationIcon` và hàm thuần `step-states.ts`), `List` và `ListItem`, mỗi component ba `variant` theo mockup đã duyệt; móc `data-visual-hover` của harness visual; các cặp tương phản mới (dòng 30 và 31 của §4.9, check `stepper-current-number` dưới dòng 26) và ngưỡng kích thước.

**Architecture:**
- **`ExclamationIcon`** (Task 1): dấu "!" của bước lỗi, khung 12×12, nét 2, trong `src/internal/icons.tsx`. Dấu ✓ của bước đã xong là `BoxCheckIcon` có sẵn.
- **`stepStates`** (Task 1): hàm thuần trong `src/components/stepper/step-states.ts`, trả trạng thái (`complete`, `current`, `upcoming`, `error`) và việc bấm được của từng bước. `status` của `Step` thắng vị trí.
- **`Stepper`, `Step`** (Task 1): server-safe, không hook, không context. `Stepper` đọc các `Step` từ `children` bằng `collectChildren` và tự render `<li>` của chúng; `Step` là marker không có `ref`. Gốc `ol.flg-stepper` mang `data-variant` (`circles`, `compact`, `bars`) và `data-orientation`; mỗi `<li>` mang `data-state`. Bước bấm được là `<button>`, chỉ khi có `onValueChange`. Stepper ngang là container `flg-stepper`, nên bản hẹp là một container query và HTML từ server đã đúng.
- **`List`, `ListItem`** (Task 2): server-safe, không hook. Gốc `ul.flg-list` mang `data-variant` (`inset`, `cards`, `plain`) và `data-size`; `inset` thêm lớp `flg-surface`. Tiêu đề của hàng bấm được là `<a>` hoặc `<button>`, kéo giãn phủ cả hàng bằng `::after`. `renderLink` chạy cả trên server.
- **Móc `data-visual-hover`** (Task 2): harness visual rê chuột thật lên phần tử `[data-visual-hover]` đầu tiên trước khi chụp, để hover của mockup có ảnh chuẩn.
- **Tương phản** (Task 1, 2): bốn check mới trong `scripts/lib/contrast.ts`; dòng 30 và 31 mới của §4.9; mười ba dòng cũ mở rộng nhãn. Ngưỡng kích thước được ghi một lần, ở Task 2.

**Tech Stack:** Như Plan A của giai đoạn 4: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63, `@floating-ui/dom` 1.8.0. Plan này không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md`. Plan này làm các phần sau:
- §2 dòng B: `ExclamationIcon` và Stepper (Task 1), List (Task 2); ý "Thay đổi ở code cũ" của Plan B: harness rê chuột lên `[data-visual-hover]` (Task 2).
- §3.1: dòng Stepper (Task 1) và List (Task 2); đoạn về các `Step` viết trong Server Component (Task 1); ca `check:rsc` của Stepper chỉ hiển thị (Task 1) và của List có một hàng `href` và một hàng tĩnh (Task 2). Stepper và List không có trong `check:use-client`.
- §3.2: `variant` của hai component (Task 1, 2).
- §3.3: dòng List `cards` khi hover (Task 2).
- §3.5: container của Stepper ngang (Task 1), kể cả dòng mới về `width: 100%` (phát hiện 3).
- §3.6: các file của Plan B.
- §4.1: mockup St1–St3 và L1–L3 (`phase-4-stepper-list.html`).
- §4.2: token dẫn xuất `--flg-stepper-ring` (Task 1); ba token theo theme của List (Task 2); các màu trang trí viết thẳng bằng `color-mix` của Stepper (Task 1); quy tắc hiệu năng của `cards` (Task 2).
- §4.3, §4.4, §4.5: giao diện, các cặp tương phản và forced colors của Stepper (Task 1) và List (Task 2), kể cả mục "Không đo" và các quy tắc `prefers-contrast: more` của hai component.
- §4.6: `ExclamationIcon` (Task 1).
- §5: `step-states.ts` và các cảnh báo dev của Stepper (Task 1); các cảnh báo của List (Task 2).
- §6.1, §6.2, §6.3: API của `Stepper` và `Step` (Task 1), `List` và `ListItem` (Task 2).
- §7: Stepper và List ở lớp 1, 2, 3 và 5; story giao diện; móc `data-visual-hover`; test kiểu; kiểm tra gói.
- §8: trang MDX của Stepper (kèm ví dụ đúng và sai) và của List; đoạn về link của hàng List trên trang Accessibility (Task 2).
- §10: container query của Stepper (story hẹp chạy cả ở WebKit); `cards` cho danh sách ngắn (docs).
- §4.9 của spec giai đoạn 0+1 (`docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`): dòng 30 và 31 mới (dòng 31 chỉ có nửa Stepper), check `stepper-current-number` dưới dòng 26, phần Stepper ở dòng 2, 5, 6, 7, 8, 9, 10, 14, 16, 26, 27 và 29 (Task 1); nửa List của dòng 31, phần List ở dòng 2, 6, 7, 8, 9, 12 và 14 (Task 2). Plan A đã thêm dòng 23 đến 29; Plan C thêm dòng 32 đến 34.

Chủ dự án chọn "tất cả lựa chọn" ngày 2026-11-06: mỗi phương án của mockup thành một giá trị `variant`. Chủ dự án duyệt spec ngày 2026-11-07, kể cả các dòng 23 đến 34 của §4.9.

**Đã chạy thử khi lập kế hoạch:**
- Toàn bộ code dưới đây đã chạy trên nhánh nháp `draft/phase-4-plan-b`, mỗi task một commit: hai commit trên `443f507` (`main` sau PR #27, tức đã có Plan A): `e8b4800` (Task 1) và `e4f0ec5` (Task 2). Mỗi test viết trước đã được chạy trên commit cha của task, trừ các chỗ ghi rõ ở phát hiện 9.
- Cả hai task do subagent Claude Sonnet viết. Plan B không dùng opencode: task nào cũng cần phán đoán (chép đúng CSS của mockup, viết đúng ARIA), và `step-states.ts`, hàm thuần duy nhất, quá nhỏ để giao riêng. Claude (Opus) kiểm tra từng task. Task 1 qua một vòng sửa (F1–F3, phát hiện 2) trước khi được nhận; Task 2 được nhận nguyên như subagent viết.
- Mọi khối patch trong plan được lấy thẳng từ hai commit đó.

Kết quả đo ở `3948d8e`, ngày 2026-11-07. Story là ngoại lệ: chúng chạy ở commit của task đổi thư mục đó. Đầu nhánh nháp giờ là `e4f0ec5`: sau khi viết plan, Claude gộp vào commit của Task 1 câu "Cả ba mươi mốt điểm" sau bảng §4.9 của spec 0+1 (trước là "hai mươi chín") và comment đầu `stepper.css` (rule hover đọc `aria-current`, vì một bước lỗi có thể là bước hiện tại); code chạy không đổi.

| Lệnh | Kết quả |
|---|---|
| `pnpm test:unit` | 3330 test PASS, 3 skip (166 file; project `unit`, `unit-react18` và `scripts`) |
| Story | stepper 30 (Task 1), list 36 (Task 2). PASS ở Chromium, Firefox và WebKit, theme sáng và tối, chạy từng thư mục một. Cả bộ story chưa chạy một lượt trên máy này vì thiếu bộ nhớ; CI chạy cả bộ |
| `pnpm check:contrast` | PASS, với dòng 30 và 31 mới của §4.9 và check `stepper-current-number` của dòng 26 là `known-exception` |
| `pnpm check:package` | PASS với ngưỡng mới: JS 50772 B, CSS 12656 B (đo được JS 46.16 kB, CSS 11.51 kB; ngưỡng trước 49547 B và 10530 B) |
| `pnpm gen:theme`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `npx tsc --noEmit -p .`, `pnpm check:name`, `pnpm build` | PASS |
| `pnpm build-storybook` | PASS, kể cả trang `Stepper.mdx` và `List.mdx` |
| Visual | Chưa chạy. Ảnh chuẩn mới và móc `data-visual-hover` chạy lần đầu trong CI |

Bản nháp không chạy fixtures: Plan B không đổi fixture nào (Plan C đưa Stepper và List vào fixtures).

Các phát hiện từ lần chạy thử đã được đưa vào plan:

1. **Hai task nháp là hai task của plan, cùng số thứ tự.** Stepper đi trước vì nó thêm dòng 30 và 31 của §4.9; List chỉ mở rộng dòng 31, nên bảng không bao giờ có chỗ trống. Móc `data-visual-hover` đi cùng List (Task 2), story đầu tiên cần nó. Ngưỡng kích thước được ghi một lần, ở Task 2, cho cả Plan B (phát hiện 8).
2. **Vòng sửa của Task 1** (gộp vào cùng commit: commit nháp `4ec4681` thành `0f65710`, rồi `e8b4800` sau hai sửa nhỏ ở trên):
   - **F1, forced colors thắng `prefers-contrast: more`.** Mọi selector forced colors của Stepper trong `preferences.css` mang thêm `.flg-stepper[data-variant]` (và `[data-orientation][data-variant]` cho thanh của bước hiện tại), nên ít nhất cũng cụ thể bằng quy tắc contrast-more cho cùng phần đó; chúng đứng sau trong layer. Chromium khớp cả `prefers-contrast: more` khi màu bị ép. Đây là cùng loại lỗi chủ dự án bắt ở phần đã chạy của Progress `glow` khi review Plan A (`c7f90f1`).
   - Bằng chứng F1 là một probe Playwright chạy một lần ở Chromium (`emulateMedia({ forcedColors: 'active', contrast: 'more' })`, HTML tĩnh nạp `dist/styles.css` qua `file://`, không mở server; script để ngoài repo). Trước khi sửa: viền dấu tròn của bước hiện tại `compact` là `rgb(255,255,255)` (token `--flg-selected-text`, không phải `Highlight`), và thanh chưa tới có `box-shadow: rgba(31,36,51,.5) 0 0 0 1px inset`. Sau khi sửa: dấu tròn nền `rgb(255,255,255)` (`Canvas`), viền `rgb(55,0,110)` (`Highlight`); cả ba thanh `box-shadow: none`, ở `compact` và `bars`.
   - **F2, viền của thanh bước hiện tại.** Ở `prefers-contrast: more`, thanh của bước hiện tại `bars` có cùng viền trong 1px `--flg-control-border` như thanh chưa tới, vì nửa trống của nó cũng là rãnh. Selector là `.flg-step:is([data-state='upcoming'], [data-state='current']) .flg-step-bar`. Spec §4.4 được sửa (phát hiện 3).
   - **F3, ", " giữa tiêu đề và mô tả.** Một span `flg-visually-hidden` chứa ", " đứng trước mô tả. Nó nằm ngoài luồng (định vị tuyệt đối), nên không chiếm ô flex hay khoảng cách nào ở cả ba variant. `textContent` được ghim theo dạng câu của §6.3: "Step 1 of 2: Cart, Completed" và "Step 2 of 2: Delivery, Home delivery, 2–3 days, Current". Khối HTML mẫu ở §6.3 không vẽ span này; câu đọc ở §6.3 là chuẩn.
3. **Các chỗ spec được sửa hoặc thêm**, đánh dấu "(phát hiện khi lập Plan B)":
   - Spec giai đoạn 4 §3.5 (Task 1): gốc `<ol>` ngang có `width: 100%` (phát hiện 5).
   - Spec giai đoạn 4 §4.4, các quy tắc "+" (Task 1, F2): thanh của bước hiện tại `bars` cũng có viền 1px; forced colors thắng quy tắc này.
   - Spec giai đoạn 4 §5, Stepper (Task 1): `NaN` coi là 0, vô cực kẹp như mọi số khác; câu cảnh báo chính xác, không chứa giá trị.
   - Spec giai đoạn 4 §4.3 **List** (Task 2): tiêu đề một dòng, dài thì "…"; liên kết kéo giãn bo theo `--flg-list-item-radius`; gốc có `min-width: 0`; hàng disabled mang `data-disabled` và không mang `data-interactive`; danh sách `inset` chỉ có một hàng thì hàng đó bo bốn góc.
   - Spec giai đoạn 4 §5, List (Task 2): ba câu cảnh báo, không chứa giá trị.
   - Spec giai đoạn 4 §6.3 `disabled` của `ListItem` (Task 2): hàng disabled không gọi `renderLink` (Claude chốt).
   - Spec 0+1 §4.9 (Task 1): dòng 30 và 31 mới (dòng 31 chỉ có nửa Stepper); dòng 26 thêm số của Stepper (sáng "đạt (5.78:1 Alert, 5.67:1 Stepper)", tối "3.90:1 Alert, 3.33:1 Stepper"); dòng 2, 5, 6, 7, 8, 9, 10, 14, 16, 27 và 29 thêm vị trí của Stepper; một đoạn mới về điểm 30–31.
   - Spec 0+1 §4.9 (Task 2): dòng 31 thêm vạch của hàng hiện tại List `inset`; dòng 2, 6, 7, 8, 9, 12 và 14 thêm vị trí của List; đoạn về điểm 30–31 thêm List.
4. **Tương phản (Task 1, 2).** `check:contrast` đo bốn cặp mới, trên kính thường và trên panel có scrim, lấy số thấp nhất trên mọi nền tham chiếu và mọi điểm màu. Số của script trùng số của spec §4.4 tới hàng phần trăm, ở cả bốn cột:

   | Check | Sáng | Sáng, contrast-more | Tối | Tối, contrast-more | Ngưỡng |
   |---|---|---|---|---|---|
   | `stepper-ring` | 2.63 (dòng 30) | 7.65 | 2.63 (dòng 30) | 10.43 | 3 |
   | `stepper-current-number` | 5.67 | 6.12 | 3.33 (dòng 26) | 8.13 | 4.5 |
   | `stepper-done-mark` | 3.40 | 4.94 | 3.59 | 7.31 | 3 |
   | `current-edge` | 2.61 (dòng 31) | 6.28 | 2.01 (dòng 31) | 8.15 | 3 |

   - `stepper-ring`: vòng `--flg-stepper-ring` của bước chưa tới so với bề mặt.
   - `stepper-current-number`: số `--flg-accent-text` của bước hiện tại trên `--flg-control-bg` (`circles`), và trên dấu tròn nằm trong viên thuốc `--flg-selected-bg` (`compact`). Ở contrast-more viên thuốc là màu nhấn đặc và dấu tròn đảo màu, nên check đo số `--flg-selected-bg` trên dấu tròn `--flg-selected-text` thay cho dấu tròn trong viên thuốc.
   - `stepper-done-mark`: dấu ✓ `--flg-on-accent` trên `--flg-accent-solid` (`circles`) và `--flg-accent-text` trên `--flg-accent-subtle` (`compact`). Nó đạt, nên không phải ngoại lệ.
   - `current-edge`: vạch `--flg-accent-solid` trên nền `--flg-selected-bg`, tức viền dấu tròn bước hiện tại `compact` (Task 1) và vạch 3px của hàng hiện tại List `inset` (Task 2, cùng cặp màu nên không thêm check). Ở contrast-more check đo `--flg-selected-text` trên `--flg-selected-bg`.
   - Dòng mới của §4.9, số làm tròn xuống: dòng 30 (`stepper-ring`, sáng và tối) và dòng 31 (`current-edge`, sáng và tối), cả hai tiêu chí `1.4.11`; dòng 26 có thêm `stepper-current-number` (tối 3.33). Bảng §4.9 thành 31 dòng sau Task 1; `ExceptionTable.test.tsx` đòi đúng số đó, và Task 2 không đổi số dòng.
   - Các vị trí khác cùng cặp màu với dòng cũ chỉ mở rộng nhãn, không thêm check: dòng 27 có nửa đã chạy của thanh `bars`, dòng 29 có dòng "Step N" của `bars`; dòng 12 có mô tả của hàng List bấm được khi hover.
   - Nền hover của `cards` ở sáng là `--flg-control-bg`, không phải `--flg-control-track`. Cặp chữ mờ trên nền đó là dòng 21, và dòng 21 đạt ở sáng; ở tối hover là `--flg-control-track`, đã nằm trong dòng 12.
   - Dưới `prefers-contrast: more` mọi cặp mới đạt. Quy tắc ngoài mockup của Plan B: vòng `--flg-stepper-ring` thành màu đặc (token); thanh chưa tới và thanh hiện tại `bars` có viền trong 1px; viên thuốc của bước hiện tại `compact` đảo màu dấu tròn, mô tả lấy `--flg-selected-text`; hàng hiện tại của List: ô đầu, mô tả, ô cuối và vạch `inset` lấy `--flg-selected-text`; hàng List bấm được không đổi nền khi hover (`cards` vẫn nổi lên).
5. **Stepper (Task 1):**
   - **Server-safe.** Không `"use client"`, không hook. `collectChildren` đọc các `Step` qua Fragment và mảng; con không phải `Step` bị bỏ, kèm cảnh báo. `Step` là marker `markPart(…, 'step')` không có `ref`; React chỉ render nó khi nó nằm ngoài `Stepper`, và khi đó nó trả `null` kèm cảnh báo nêu nguyên nhân và cách sửa. `check:rsc` pass với ba ca Stepper chỉ hiển thị, một ca mỗi variant.
   - `labels` đi qua `withDefaults(DEFAULT_LABELS, labels)`: khoá truyền `undefined` giữ chữ mặc định (bài học từ review Plan A, có test). Mô tả rỗng được nhận ra bằng `hasContent`.
   - **`value`:** làm tròn bằng `Math.round`, `NaN` coi là 0, rồi kẹp vào `[0, số bước]` bằng `clamp`; vô cực kẹp như mọi số khác. Cảnh báo khi giá trị dùng khác giá trị nhận. Câu cảnh báo không chứa giá trị, nên sáu giá trị sai khác nhau chỉ cảnh báo một lần (`devWarn` gộp câu trùng).
   - **Gốc ngang có `width: 100%`.** Một container `inline-size` không lấy kích thước từ nội dung, nên khi là một mục của hàng flex nó co về 0. Story `InAFlexRow` đo một Stepper ngang cạnh một ô 40px: nó chiếm phần còn lại của hàng (sai số 1px). Trong một cha co theo nội dung nó vẫn co về 0, như rủi ro ở §10; `Stepper.mdx` nói điều đó.
   - **Bấm:** bước bấm được khác bước hiện tại gọi `onValueChange(index)`. Bước hiện tại vẫn là nút (để focus ở yên sau khi quay lại), nhưng `onClick` của nó là `undefined`, nên bấm không gọi gì.
   - **`aria-current` theo `index === value`.** Nó nằm trên nút khi bước bấm được, trên `<li>` khi không. Một bước có `status="error"` đứng ở `value` vẫn là bước hiện tại với `aria-current`, còn `data-state` của nó là `error`.
   - **Chữ đọc:** chữ ẩn số thứ tự trước tiêu đề, ", " ẩn trước mô tả (F3), chữ ẩn trạng thái ở cuối. Dấu tròn, thanh và dòng "Step N" mang `aria-hidden`. Lib chỉ render phần của variant đang dùng.
   - **Hover** (ngoài mockup, spec §4.3): bước bấm được, không phải bước hiện tại, có nền `--flg-control-track` khi `@media (hover: hover)`. Selector là `.flg-step-inner:is(button):not([aria-current]):hover`: bước hiện tại bấm được luôn mang `aria-current` trên nút của nó.
   - **Forced colors:** như spec §4.5, với các selector của F1. Chỉ được probe ở Chromium; Firefox và WebKit chưa thử với màu bị ép.
   - **Contrast-more, viên thuốc lỗi của `compact`:** viên thuốc thành nền đỏ đặc, và đĩa của dấu tròn cũng vậy, nên đĩa lẫn vào viên thuốc và chỉ còn dấu "!". Spec không nói gì về trường hợp này; dấu "!" đạt (`on-danger`). Plan để nguyên và nêu trong mô tả PR.
   - **Test `ref`:** project `unit-react18` không cho truyền `ref` qua một component của người dùng (helper `Checkout`), nên test `ref` render thẳng `Stepper`.
   - **Kiểu:** `StepperProps` vẫn nhận `defaultValue`, vì đó là thuộc tính HTML chung của `HTMLAttributes`. Lần chạy đầu của test kiểu fail ở chính khẳng định đòi từ chối nó (`Unused '@ts-expect-error' directive`); khẳng định đó đã bị bỏ.
   - Story `Circles`, `Compact`, `Bars` dựng lại thẻ "Checkout" của mockup, rộng 600px: ngang (2 xong, 1 hiện tại, 1 chưa tới), bước hiện tại lỗi, focus bàn phím trên bước "Delivery" đã xong (Tab hai lần), dọc có mô tả, bản hẹp trong khung 320px. `Narrow` và `InAFlexRow` gắn `no-visual`. Không story nào gắn `reduced-motion`: Stepper không có chuyển động lặp.
   - So giao diện: subagent mở Storybook một lần ở cổng 6017 (đã tắt), chụp ba story giao diện ở sáng và tối, đối chiếu với mockup. Không so pixel; ảnh chuẩn đến từ CI.
6. **List (Task 2):**
   - **Server-safe.** Không `"use client"`, không hook. `renderLink` chạy ngay trên server khi List nằm trong Server Component. `check:rsc` pass với hai ca: một hàng `href` cạnh một hàng tĩnh, và `cards` có `renderLink`.
   - **Tiêu đề:** `<span>` khi hàng không bấm được; `<a href>` với `href` (hoặc kết quả của `renderLink`); `<button type="button">` với `onSelect`. Hàng bấm được khi có (`href` hoặc `onSelect`) và có tiêu đề (`hasContent`). Ô đầu, mô tả, ô cuối và cột giữa rỗng thì không render.
   - **Gốc có `min-width: 0`.** Story `LongText` bắt lỗi trước khi sửa: một List là mục của hàng flex bị chữ dài đẩy rộng hơn khung (`inset flex: expected 1052.625 to be less than or equal to 760.5`).
   - **Tiêu đề một dòng, dài thì "…"**, như mô tả. Không cắt thì tiêu đề dài đẩy ô cuối ra ngoài hàng.
   - **Liên kết kéo giãn** bo theo biến `--flg-list-item-radius` mà mỗi variant đặt trên hàng. `border-radius: inherit` như mockup lấy từ tiêu đề, vốn không bo. Tiêu đề không có `position`, nên `overflow: hidden` của nó không cắt lớp phủ.
   - **Hàng disabled** mang `data-disabled` và không mang `data-interactive`, nên không đổi khi rê chuột. Link disabled là `<a role="link" aria-disabled="true">` của lib, không có `href` và không gọi `renderLink`; nút disabled có `disabled` gốc. JSDoc của `renderLink` và `List.mdx` nói điều đó.
   - Danh sách `inset` chỉ có một hàng thì hàng đó bo cả bốn góc (`:only-child`).
   - **Ba câu cảnh báo** (spec §5) không chứa giá trị. Bốn hàng sai với hai lỗi khác nhau, render hai lần, chỉ in hai câu.
   - **`cards`** chép các khai báo kính của `.flg-surface` cho mỗi hàng (hàng không biết variant của List), có `isolation: isolate`, và nhận cùng quy tắc forced colors của `.flg-surface`.
   - **`plain`** có margin `0 -8px`, nên rộng hơn vùng chứa 8px mỗi bên, đúng spec. Story `LongText` tính phần tràn đó.
   - **Forced colors:** hàng hiện tại có `outline: 2px solid Highlight` vẽ vào trong (`-2px`); gradient của nền hàng hiện tại và của `::before` ở `cards` bị bỏ (`background-image: none`), vì gradient không bị ép thành `Canvas`; vạch `inset` là `Highlight`; chữ của hàng disabled là `GrayText`; outline focus (`2px CanvasText`, cách 2px) thắng outline của hàng hiện tại. Selector của các quy tắc trùng thuộc tính với contrast-more cụ thể bằng quy tắc đó và đứng sau.
   - Bằng chứng: một probe Playwright chạy một lần ở Chromium, giả lập cả hai chế độ, trên Storybook tĩnh do một server Node tạm phục vụ ở cổng 5199 (đã tắt; script để ngoài repo). Kết quả khớp các quy tắc trên ở cả ba variant. Tiêu đề của hàng hiện tại là `<a href>`, nên trình duyệt vẽ nó màu `LinkText`, không phải `CanvasText`; đó là hành vi của trình duyệt với link.
   - Trang Accessibility có thêm câu trỏ dòng của List và một đoạn về link của hàng List (tên là tiêu đề; hàng hiện tại ở contrast-more chỉ nên có chữ và icon).
   - Story `Inset`, `Cards`, `Plain` dựng lại mockup, rộng 420px: danh sách thành viên (hàng tĩnh có Badge, hàng link có `data-visual-hover`, hàng có nút "…", focus bàn phím trên hàng cuối sau bốn lần Tab) và danh sách cài đặt `sm` (hàng hiện tại, hàng link, hàng có mô tả, hàng disabled). `plain` nằm trong `Card` như mockup. `PressAnywhere`, `HoverOnlyOnPressableRows` và `LongText` gắn `no-visual`.
7. **Móc `data-visual-hover` (Task 2):**
   - Sau khi trang ổn định (ảnh, `data-status="loading"`, font) và play function đã chạy, trước khi chụp: nếu sân khấu có phần tử `[data-visual-hover]`, harness rê chuột thật của Playwright lên phần tử đầu tiên.
   - Mỗi test có `page` riêng, nên chuột không mang sang story sau.
   - Story không có thuộc tính đó được chụp đúng như trước. Chỉ `List.stories.tsx` dùng nó, một hàng trong mỗi story giao diện, ở cả bốn chế độ.
   - Harness không có test tự động ở máy này (nó cần Storybook đã build và ảnh chuẩn từ Docker); `pnpm typecheck` kiểm kiểu file. Một probe chạy một lần cho thấy nền của hàng được đánh dấu đổi từ `rgba(0, 0, 0, 0)` sang `rgba(31, 36, 51, 0.12)`.
8. **Ngưỡng kích thước:**
   - Ngưỡng ban đầu (do Plan A ghi): JS 49547 B, CSS 10530 B.
   - Sau Task 1: JS 45.81 kB, CSS 10.76 kB. CSS vượt ngưỡng 233 B, nên `check:package` fail chỉ ở `size` giữa hai task.
   - Sau Task 2: JS 46.16 kB, CSS 11.51 kB. `pnpm size:record` ở Task 2 ghi JS 50772 B, CSS 12656 B (số đo cộng 10%).
9. **Chỗ bước fail-first không đầy đủ**, theo các báo cáo của bản nháp:
   - Task 1: test mới của `icons.test.tsx` fail trên code cũ (`Element type is invalid … got: undefined`). `step-states.test.ts` và `Stepper.test.tsx` fail cả file vì module chưa có, nên không test nào được thấy fail vì lý do riêng, trừ `reads exactly as the sentence of the spec, with and without a description`: test này viết trước F3 và fail trên code trước F3 (`Received: "Step 2 of 2: DeliveryHome delivery, 2–3 days, Current"`). `ExceptionTable.test.tsx` được thấy fail trước (`expected [ … ] to have a length of 31 but got 29`, rồi danh sách tiêu chí). `public API` chưa được thấy fail. `check:contrast` không chạy đỏ trước: check và ngoại lệ được viết cùng lúc, nên số đo là đặc tả của script. Story viết sau code (test đặc tả). `check:dist-css` là một danh sách.
   - Task 2: `List.test.tsx` fail cả file vì module chưa có. `theme-css.test.ts` fail đúng ở token mới (`list-card-shadow: expected undefined to be '0 1px 2px #0000000a, 0 6px 16px #3c5f…'`). `List.test-d.ts` viết sau `List.tsx` và pass ngay (test đặc tả). `public API` chưa được thấy fail. `LongText` fail trước vì component (phát hiện 6). Lần fail đầu của `PressAnywhere` là lỗi của chính story (toạ độ cũ sau khi trang cuộn, rồi `elementFromPoint` trả về con SVG); component đúng ngay. `HoverOnlyOnPressableRows` pass ngay. Harness không có test. `check:package` fail chỉ ở `size` trước khi ghi ngưỡng.
   - Trên cây của plan, test patch của cả hai task làm file test của component fail vì module chưa có (`Failed to resolve import …`).
10. **Ảnh chuẩn của component cũ không đổi.**
    - Plan B thêm file CSS mới, các selector `.flg-stepper`, `.flg-step*` và `.flg-list*` trong `preferences.css`, các `@import` và các dòng trong danh sách đăng ký.
    - Token mới chỉ được CSS mới đọc: `--flg-stepper-ring` (`stepper.css`) và ba token `--flg-list-card-*` (`list.css`). Không token cũ nào đổi giá trị.
    - `ExclamationIcon` là icon mới; không component cũ nào dùng nó.
    - Móc của harness chỉ hành động khi story có `data-visual-hover` (phát hiện 7).
    - Bản nháp không chạy so sánh pixel (ảnh chuẩn cần Docker); CI visual xác nhận.
11. **Duyệt của chủ dự án.** Không có gì chờ chủ dự án duyệt ngoài review PR. Dòng 30 và 31 được duyệt cùng spec ngày 2026-11-07. Mô tả PR vẫn liệt kê dòng 30, 31 và phần Stepper của dòng 26 kèm số đo, cùng các dòng spec sửa trong bản nháp (phát hiện 3).
12. **Các mục để lại** (không làm ở plan này):
    - Kiểm tra screen reader (§7 dòng 6): chữ ẩn của bước và bản hẹp của Stepper, liên kết kéo giãn của List chưa thử với NVDA và VoiceOver.
    - Safari thật chưa thử; story chỉ chạy WebKit của Playwright.
    - Forced colors của Stepper và List chỉ được probe ở Chromium, một lần, khi giả lập cả hai chế độ. Không có test tự động cho trường hợp forced colors và contrast-more cùng bật: lượt `forced-colors` của harness chỉ giả lập `forcedColors: 'active'`.
    - Đĩa của dấu tròn bước lỗi `compact` lẫn vào viên thuốc ở contrast-more (phát hiện 5); nêu trong mô tả PR.
    - Móc `data-visual-hover` không có test tự động (phát hiện 7).
    - Stepper ngang trong một cha co theo nội dung co về 0 (§10; docs nói).
    - Liên kết kéo giãn của List làm khó bôi đen chữ trong hàng (§6.3; docs nói).
    - `StepperProps` nhận `defaultValue` (thuộc tính HTML chung), không có tác dụng.

**Phạm vi:**
- **Không làm ở plan này:**
  - Plan C: `ArrowIcon`, `ChevronsUpDownIcon`, Table, dòng 32 đến 34 của §4.9, mục "Loading states" và "Show data" của Getting started, các ghi chú còn lại của trang Accessibility, fixtures (kể cả Stepper bấm được với các `Step` viết trong client component, và List có `renderLink` với `Link` của Next), changeset `minor` cho `0.3.0`.
  - Ngoài phạm vi của spec §2: nội dung của từng bước, bước tuỳ chọn hay bị bỏ qua, bước `disabled`, phím mũi tên (Stepper); chọn hàng, kéo sắp xếp, ảo hoá, danh sách lồng nhau, DescriptionList (List).
  - Các mục để lại ở phát hiện 12.
- **Ảnh chuẩn visual:**
  - Story có ảnh: `Circles`, `Compact`, `Bars` của Stepper và `Inset`, `Cards`, `Plain` của List, mỗi story 8 ảnh (4 chế độ × sáng, tối). Tổng cộng 48 ảnh mới (24 + 24). Không story nào của Plan B gắn `reduced-motion`. Mọi story khác của hai component gắn `no-visual`.
  - Ở ba story của List, harness rê chuột lên một hàng link trước khi chụp, ở cả bốn chế độ (phát hiện 7).
  - Không tạo ảnh trên Windows. Ảnh chuẩn mới chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh.
  - Ảnh của mọi component cũ phải giữ giống từng byte.

## Global Constraints

- Tên package `h2d-glass-ui`; chỉ ESM; `exports` gồm `.`, `./styles.css` và `./package.json`; `"sideEffects": ["**/*.css"]`.
- `pnpm check:name` fail khi tên cũ xuất hiện lại ngoài `docs/superpowers`. Import trong trang MDX dùng `'h2d-glass-ui'`.
- Cảnh báo dev bắt đầu bằng `[h2d-glass-ui]`: `devWarn` thêm `WARN_PREFIX` của `src/internal/warn.ts`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`). Plan này không thêm dependency.
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`. Container query (Stepper hẹp) và `:has()` (vòng focus và đường ngăn của List) có ở mọi trình duyệt của mốc này (spec §10).
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Biến thể và trạng thái dùng data-attribute (`data-variant`, `data-orientation`, `data-state`, `data-size`, `data-interactive`, `data-current`, `data-disabled`). Trạng thái của bước và của hàng được CSS đọc từ `data-state` và `data-current` trên `<li>`, vì `aria-current` có thể nằm trên nút hay link.
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS component nằm trong `@layer flg.components`. Quy tắc `forced-colors` và `prefers-contrast: more` nằm trong `src/styles/preferences.css`. Selector forced colors của một phần mà contrast-more cũng chỉnh phải cụ thể ít nhất bằng selector contrast-more đó (phát hiện 2).
- **Mockup lock.** Không giá trị token nào đang có trong `src/styles/theme/values.ts` đổi. Plan B thêm token dẫn xuất `--flg-stepper-ring` (kèm giá trị `prefers-contrast: more`) và ba token theo theme `--flg-list-card-shadow`, `--flg-list-card-shadow-hover`, `--flg-list-card-hover-bg` (spec §4.2), giá trị chép nguyên từ mockup; chạy `pnpm gen:theme` sau khi sửa `values.ts`. Các màu chỉ để trang trí (đường mờ, quầng của Stepper) được viết thẳng bằng `color-mix` trong CSS của component. Component cũ phải giữ ảnh giống từng byte. Stepper và List theo đúng St1–St3, L1–L3, kể cả các cặp dưới ngưỡng của dòng 26, 30 và 31.
- Mọi component dùng `forwardRef` (trừ `Step`, marker không có `ref`), export kiểu props và kiểu `variant` của nó, và export phẳng từ `src/index.ts` (có trong `src/index.test.ts`). Stepper và List là server-safe: không `"use client"`, không hook, không có trong `scripts/check-use-client.ts`, có ca trong `scripts/rsc-probe.mjs`. Class CSS mới có trong `scripts/check-dist-css.ts`.
- `labels` gộp bằng `withDefaults`; slot rỗng nhận ra bằng `hasContent`; câu cảnh báo không chứa giá trị đổi theo mỗi lần render (bài học từ review Plan A).
- Chữ mặc định do lib cung cấp bằng tiếng Anh, ghi đè được qua `labels`. Cảnh báo dev đi qua `devWarn`. Lib không throw khi người dùng dùng sai. Trang docs (`*.mdx`) viết bằng tiếng Anh.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm bằng tay, **không** push lên `main`. `main` được bảo vệ (chỉ nhận PR, các check phải xanh): plan kết thúc bằng một PR.
- **Changeset:** Plan B không thêm changeset. Changeset `minor` cho `0.3.0` đến ở Plan C, nên merge Plan B không phát hành gì.
- **Ngưỡng `size-limit`:**
  - Ngưỡng ban đầu (do Plan A ghi): JS 49547 B, CSS 10530 B.
  - Task 1 chạy `pnpm build && pnpm check:package`, và nó fail chỉ ở `size` (CSS vượt 233 B). Đó là điều đã biết; không ghi ngưỡng ở Task 1 (phát hiện 8).
  - Chỉ Task 2 chạy `pnpm size:record` và commit `.size-limit.json`. Plan không chép file này: `size:record` tự ghi ngưỡng. Kết quả ở bản nháp: JS 50772 B, CSS 12656 B.
- Trước mọi lệnh `pnpm vitest run --project storybook-*` chạy thẳng, chạy `pnpm gen:theme`. Lần chạy story đầu có thể fail với `Failed to import test file …` khi Vite tối ưu lại; chạy lại.
- **Không chạy cả bộ story một lượt trên máy thiếu bộ nhớ.** Chạy từng thư mục một, như các lệnh trong plan. CI chạy cả bộ. Không chạy hai lượt story cùng lúc.
- **Cổng 5173, 4173 và 5174 thuộc các app khác của chủ dự án**: không dùng, không tắt tiến trình đang giữ chúng. Plan B không đổi fixture; **không chạy `pnpm test:fixtures`** trên máy này. Storybook chạy tạm (nếu cần) dùng cổng khác. Không để server hay tiến trình Storybook chạy sót.
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows. Ảnh chuẩn của Stepper và List (24 + 24 ảnh) đến từ workflow "Update visual baselines" sau khi đẩy nhánh. Không ảnh cũ nào được đổi: móc hover chỉ hành động trên story có `data-visual-hover`.
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.

**Cách áp patch.**
- Mọi file, kể cả file mới, được đưa dưới dạng patch (`git diff`). Lưu nguyên khối patch vào một file **ngoài** repo (ví dụ `../task.patch`), giữ LF, rồi chạy `git apply ../task.patch` ở gốc repo.
- Nếu `git apply` báo lỗi thì dừng lại và báo cáo: nghĩa là cây đang khác với cây mà plan đã chạy thử.
- Mỗi task có hai khối patch, test rồi code. Áp theo đúng thứ tự trong plan.
- Khối code của Task 1 và Task 2 có dòng bắt đầu bằng ba dấu backtick (khối code trong `Stepper.mdx` và `List.mdx`), nên chúng được rào bằng bốn dấu backtick. Nội dung patch là các dòng giữa hai hàng rào, như mọi khối khác.
- Task 1 và Task 2 cùng sửa `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `src/styles/theme/values.ts`, `scripts/check-dist-css.ts`, `scripts/rsc-probe.mjs`, `scripts/contrast-exceptions.ts`, `src/docs/Accessibility.mdx`, spec 0+1 và spec giai đoạn 4. Patch đã tính sẵn điều đó nếu áp đúng thứ tự.
- Plan này không xoá file nào. `.size-limit.json` không có trong patch nào: Task 2 ghi nó bằng `pnpm size:record`.

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý. Mỗi dòng có test ở task tương ứng:

1. **Một trang Server Component truyền các `Step` vào client component render một Stepper bấm được.** RSC đã render từng `Step` trên server (thành `null`), nên Stepper không có bước nào: nó render một `<ol>` rỗng, không throw, và hai cảnh báo dev nêu nguyên nhân và cách sửa. Viết các `Step` trong chính component render `Stepper` thì đủ bước. Test ở Task 1:
   - `says what to do when a Step is rendered outside a Stepper`, `warns that a Stepper with no steps cannot read any, and renders an empty list` (đúng hai câu của spec §5);
   - `does not read a Step that a component of its own wraps, and says so` (cùng cơ chế: Stepper chỉ đọc được `Step` viết thẳng) và `reads the Steps of a Stepper written in the component that renders it`;
   - ba ca Stepper chỉ hiển thị của `check:rsc` (render từ `dist` với điều kiện `react-server`);
   - ranh giới RSC thật chỉ được kiểm ở fixture Next.js của Plan C; `Stepper.mdx` có ví dụ đúng và sai.
2. **Một Stepper nhận `value` vượt quá bước cuối, hoặc `NaN`.** `value` bằng số bước thì mọi bước đã xong và không bước nào là hiện tại; lớn hơn thì kẹp về số bước; `NaN` là bước đầu; mọi giá trị sai chỉ cảnh báo một lần; không gì throw. Test ở Task 1: `rounds and clamps it, and takes NaN as 0, with one warning` (1.6, -3, `NaN`, 9, ±`Infinity`), `marks every step complete, and none current, when value is the number of steps`, `does not warn for any whole number from 0 to the number of steps`; `step-states.test.ts` (`covers every value from 0 to the count, for every count up to six`).
3. **Một Stepper ngang trong một hàng flex, và trong khung 320px.** Trong hàng flex nó chiếm phần còn lại của hàng, không co về 0. Trong khung 320px chữ của các bước không phải bước hiện tại hay bước lỗi bị ẩn khỏi mắt nhưng vẫn được đọc; Tab tới từng bước bấm được, Enter và Space bấm nó, và focus ở lại trên bước vừa bấm. Test ở Task 1: story `InAFlexRow` (`circles`) và `Narrow` (chữ ẩn ở ba variant, bàn phím ở `circles`), cả hai ở ba engine; bản hẹp trong ảnh chuẩn của `Circles`, `Compact`, `Bars`. jsdom không có layout, nên mọi unit test vẫn pass khi CSS của chúng sai.
4. **Một hàng List có nút ở ô cuối, được bấm bằng chuột và bằng bàn phím.** Bấm bất kỳ đâu trong hàng là bấm tiêu đề; bấm nút ở ô cuối chỉ là bấm nút đó; hàng disabled không làm gì. Bằng bàn phím, Tab tới link của hàng rồi tới nút ở ô cuối. Test ở Task 2:
   - story `PressAnywhere` (chuột thật, kiểm `elementFromPoint` ở ô đầu, mô tả, tiêu đề, phần trống của hàng và nút; ba variant, ba engine);
   - play function của `Inset`, `Cards`, `Plain` (bốn lần Tab: link, link của hàng có nút "…", nút "…", link của hàng cuối);
   - `is a <button type="button"> with onSelect, and calls onSelect with the click` và `gives a button the native disabled attribute, and does not call onSelect`;
   - không test nào bấm nút ở ô cuối bằng Enter: đó là hành vi gốc của `<button>`.
5. **Hàng hiện tại của List khi màu bị ép và `prefers-contrast: more` cùng bật** (Chromium khớp cả hai khi màu bị ép, phát hiện 2). Hàng có outline 2px `Highlight` vẽ vào trong; vạch `inset` là `Highlight`; gradient của nền bị bỏ; khi hàng có focus, outline focus (`CanvasText`, bên ngoài hàng) thay outline của hàng hiện tại; chữ của hàng disabled là `GrayText`. Test: chỉ có probe Chromium chạy một lần ở bản nháp (phát hiện 6), cùng ảnh chuẩn `forced-colors` và `contrast-more` của `Inset`, `Cards`, `Plain` (mỗi lượt một chế độ, chạy lần đầu trong CI). Không có test tự động cho hai chế độ cùng bật; Stepper cũng vậy (phát hiện 2).

Hai chỗ **chỉ story bắt được**: kích thước của Stepper ngang trong hàng flex (`InAFlexRow`) và của List với chữ dài (`LongText`), và vùng bấm của liên kết kéo giãn (`PressAnywhere`). jsdom không có layout hay hit test.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/internal/icons.tsx` (và test) | `ExclamationIcon` (Task 1) |
| `src/components/stepper/*`, `src/styles/components/stepper.css` | `Stepper`, `Step`, `stepStates` (Task 1) |
| `src/components/list/*`, `src/styles/components/list.css` | `List`, `ListItem` (Task 2) |
| `src/styles/theme/values.ts`, `scripts/lib/theme-css.test.ts` | Token dẫn xuất `--flg-stepper-ring` (Task 1); ba token theo theme của List (Task 2) |
| `src/styles/preferences.css` | `prefers-contrast: more` và forced colors của Stepper (Task 1) và List (Task 2) |
| `src/styles/index.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-dist-css.ts`, `scripts/rsc-probe.mjs` | Đăng ký, export, kiểm tra gói (Task 1, 2) |
| `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `src/docs/ExceptionTable.test.tsx`, `src/docs/Accessibility.mdx`, spec 0+1 §4.9 | Bốn cặp tương phản, dòng 30 và 31, phần Stepper của các dòng cũ (Task 1); phần List của dòng 31 và các dòng cũ, đoạn về link của hàng List (Task 2) |
| `tests/visual/stories.visual.ts` | Móc `data-visual-hover` (Task 2) |
| `.size-limit.json` | Ngưỡng mới (Task 2) |
| `docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md` | Các dòng "phát hiện khi lập Plan B" (Task 1, 2) |

---

### Task 1: `ExclamationIcon`, `step-states.ts` và Stepper (`circles`, `compact`, `bars`)

Spec §1 (dòng Stepper của bảng quyết định), §2 (dòng B), §3.1 (dòng Stepper, đoạn về các `Step` viết trong Server Component, ca `check:rsc`), §3.2, §3.5, §4.1, §4.2 (`--flg-stepper-ring`, các màu trang trí của Stepper), §4.3 **Stepper**, §4.4 (bốn check mới; dòng 26, 30, 31; dòng 2, 5, 6, 7, 8, 9, 10, 14, 16, 27, 29 mở rộng; "Không đo" và các quy tắc "+" của Stepper), §4.5 **Stepper**, §4.6 (`ExclamationIcon`, `BoxCheckIcon`), §5 (`step-states.ts`, cảnh báo của Stepper), §6.1, §6.2, §6.3 **`Stepper`** và **`Step`**, §7 (Stepper ở dòng 1, 2, 3, 5; test kiểu; kiểm tra gói), §8 (trang Stepper, ví dụ đúng và sai), §10 (container query trên Safari). Mockup St1, St2, St3. Các bước của một quy trình; nội dung của từng bước là của trang, không thuộc Stepper.
- **Server-safe:** không `"use client"`, không hook. `Stepper` đọc các `Step` bằng `collectChildren` (qua Fragment và mảng); `Step` là marker `markPart` không có `ref`, render `null` và cảnh báo khi nằm ngoài `Stepper`. `labels` qua `withDefaults`, mô tả rỗng nhận ra bằng `hasContent` (phát hiện 5).
- **`value`** chỉ có dạng controlled: làm tròn, `NaN` thành 0, kẹp vào `[0, số bước]`; một cảnh báo không chứa giá trị. `value` bằng số bước nghĩa là mọi bước đã xong.
- **`stepStates`** tính trạng thái và việc bấm được của từng bước: `status` của `Step` thắng; bước bấm được khi có `onValueChange` và (`linear={false}`, hoặc bước không ở sau bước hiện tại, hoặc `status="complete"`).
- **Bấm:** bước bấm được là `<button type="button">`; bấm bước khác bước hiện tại gọi `onValueChange(index)`, bấm bước hiện tại không gọi gì. `aria-current="step"` trên nút khi bước bấm được, trên `<li>` khi không.
- **Cấu trúc** như HTML của §6.3, cộng ", " ẩn trước mô tả (phát hiện 2, F3). `bars` thay dấu tròn bằng thanh và thêm dòng "Step N" (`labels.caption`).
- **Giao diện St1–St3** (§4.3): phần chung viết một lần, mỗi variant chỉ ghi phần khác; ngang, dọc và bản hẹp (`@container flg-stepper (max-width: 479px)`). Gốc ngang có `width: 100%` (phát hiện 5). Hover của bước bấm được là ngoài mockup.
- **`prefers-contrast: more` và forced colors** trong `preferences.css`. Selector forced colors cụ thể ít nhất bằng selector contrast-more của cùng phần (phát hiện 2, F1, F2).
- **Tương phản:** bốn check mới; dòng 30 và 31 mới, check `stepper-current-number` dưới dòng 26, mười hai dòng cũ thêm vị trí của Stepper (phát hiện 4). `ExceptionTable.test.tsx` đòi 31 dòng; câu trỏ của `Accessibility.mdx` thêm Stepper.
- Spec giai đoạn 4 §3.5, §4.4 và §5 được sửa (phát hiện 3).
- Cuối task, `check:package` fail chỉ ở `size`; Task 2 ghi ngưỡng (phát hiện 8).

**Files:**
- Create: `src/components/stepper/Stepper.tsx`, `index.ts`, `step-states.ts`, `step-states.test.ts`, `Stepper.test.tsx`, `Stepper.test-d.ts`, `Stepper.stories.tsx`, `Stepper.mdx`, `src/styles/components/stepper.css`
- Modify: `src/internal/icons.tsx`, `src/internal/icons.test.tsx`, `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `src/styles/theme/values.ts`, `scripts/check-dist-css.ts`, `scripts/rsc-probe.mjs`, `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `src/docs/ExceptionTable.test.tsx`, `src/docs/Accessibility.mdx`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`, `docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md`

**Interfaces:**
- Produces trong `src/internal/icons.tsx` (không export ra ngoài package): `ExclamationIcon(props: SVGProps<SVGSVGElement>)`, SVG khung `0 0 12 12`, nét 2, đường `M6 2.75v3.75M6 9.25h.01`. `aria-hidden` và `focusable="false"` đến từ `strokeIcon`; props ghi đè được.
- Produces trong `src/components/stepper/step-states.ts` (nội bộ, không export ra ngoài package):
  - `type StepState = 'complete' | 'current' | 'upcoming' | 'error'`; `type StepStatus = 'complete' | 'error'`.
  - `stepStates({ count, value, statuses, linear, interactive }: StepStatesInput): StepInfo[]`, với `StepInfo = { state: StepState; clickable: boolean }`. `value` là số nguyên từ 0 tới `count` (Stepper đã kẹp); `statuses` thiếu phần tử nghĩa là không có `status`.
- Produces trong `src/components/stepper/Stepper.tsx` (server-safe), export qua `index.ts` và `src/index.ts`:
  - `Stepper`: `forwardRef<HTMLOListElement, StepperProps>`; `ref` là `<ol>`.
  - `Step`: marker `markPart(…, 'step')`, nhận `StepProps`, không có `ref`; render ngoài `Stepper` thì trả `null`.
  - `StepperProps = Omit<HTMLAttributes<HTMLOListElement>, 'onChange' | 'children'> & { value: number; onValueChange?: (index: number) => void; linear?: boolean; orientation?: 'horizontal' | 'vertical'; variant?: StepperVariant; labels?: Partial<StepperLabels>; children: ReactNode }`. Mặc định: `linear` `true`, `orientation` `'horizontal'`, `variant` `'circles'`.
  - `StepProps = { title: ReactNode; description?: ReactNode; status?: StepStatus; className?: string; style?: CSSProperties }`; `className` và `style` gắn vào `<li>`.
  - `StepperVariant = 'circles' | 'compact' | 'bars'`.
  - `StepperLabels`: `step` (`` (n, total) => `Step ${n} of ${total}` ``), `caption` (`` (n) => `Step ${n}` ``), `completed` (`"Completed"`), `current` (`"Current"`), `notStarted` (`"Not started"`), `error` (`"Error"`).
  - Class: `flg-stepper`, `flg-step`, `flg-step-inner`, `flg-step-indicator`, `flg-step-bar`, `flg-step-text`, `flg-step-caption`, `flg-step-title`, `flg-step-description`; chữ ẩn dùng `flg-visually-hidden` có sẵn. Biến cục bộ `--flg-step-line`. Container có tên `flg-stepper`, chỉ khi ngang.
  - Hook DOM: `data-variant` và `data-orientation` trên `<ol>`; `data-state` (`complete`, `current`, `upcoming`, `error`) trên `<li>`.
  - Token dẫn xuất `--flg-stepper-ring`: `color-mix(in srgb, var(--flg-text-muted) 65%, transparent)`; `var(--flg-text-muted)` ở `prefers-contrast: more`.
  - Cảnh báo dev (sau tiền tố `[h2d-glass-ui] `): `<Stepper> has a child that is not a <Step>; it is left out.`; `<Stepper> has no steps. Its children must be <Step> elements written in the component that renders the Stepper (not passed in from a Server Component).`; `<Stepper> value must be a whole number from 0 to the number of steps; it was rounded into that range.`; `<Stepper> linear={false} has no effect without onValueChange.`; `<Step> rendered outside <Stepper>. Write the Steps in the same component that renders the Stepper: Steps passed from a Server Component into a client component arrive already rendered, and the Stepper cannot read them.`
  - Bốn check mới trong `CHECKS` của `scripts/lib/contrast.ts`: `'stepper-ring': 3`, `'stepper-current-number': 4.5`, `'stepper-done-mark': 3`, `'current-edge': 3`.
  - `KNOWN_EXCEPTIONS` có thêm: dòng 26 (`stepper-current-number`, tối, `recorded: 3.33`), dòng 30 (`stepper-ring`, sáng 2.63 và tối 2.63) và dòng 31 (`current-edge`, sáng 2.61 và tối 2.01), hai dòng mới tiêu chí `1.4.11`. Mô tả của dòng 2, 5, 6, 7, 8, 9, 10, 14, 16, 26, 27 và 29 thêm Stepper.
  - `scripts/rsc-probe.mjs`: ba ca `Stepper circles, display only`, `Stepper compact, display only`, `Stepper bars, display only`.
- Consumes: `collectChildren`, `markPart`, `hasContent`, `withDefaults`, `clamp`, `devWarn`, `strokeIcon`, `BoxCheckIcon`; `paintStops`, `resolveToken` và các hàm đo trong `measure` của `scripts/lib/contrast.ts`; `Card`, `CardHeader`, `CardTitle` trong story.
- Task sau dùng: Task 2 dùng `current-edge` cho vạch của hàng hiện tại List `inset` và mở rộng dòng 31; Plan C dùng Stepper trong fixtures và mục "Show data".

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/stepper/Stepper.stories.tsx b/src/components/stepper/Stepper.stories.tsx
new file mode 100644
index 0000000..2bb88ff
--- /dev/null
+++ b/src/components/stepper/Stepper.stories.tsx
@@ -0,0 +1,188 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { useState } from 'react';
+import { expect, userEvent } from 'storybook/test';
+import { Card, CardHeader, CardTitle } from '../card/Card';
+import { Step, Stepper } from './Stepper';
+import type { StepperProps } from './Stepper';
+
+const meta = {
+  title: 'Components/Stepper',
+  component: Stepper,
+  // The stories hand each Stepper its steps, so the controls have nothing to drive.
+  args: { value: 0, children: null },
+} satisfies Meta<typeof Stepper>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+const caption = {
+  marginBottom: 6,
+  color: 'var(--flg-text-muted)',
+  fontSize: 'var(--flg-text-xs)',
+} as const;
+
+/** The dashed frame the mockup draws around the 320px form. */
+const narrowFrame = {
+  width: 320,
+  boxSizing: 'border-box',
+  outline: '1px dashed color-mix(in srgb, var(--flg-text-muted) 50%, transparent)',
+  outlineOffset: 6,
+  margin: '6px 0 4px',
+} as const;
+
+type Look = Pick<StepperProps, 'variant'>;
+
+function Checkout({ value = 2, status, ...rest }: Partial<StepperProps> & { status?: 'error' }) {
+  return (
+    <Stepper value={value} {...rest}>
+      <Step title="Cart" />
+      <Step title="Delivery" />
+      <Step title="Payment" status={status} description={status ? 'Card declined' : undefined} />
+      <Step title="Confirm" />
+    </Stepper>
+  );
+}
+
+/**
+ * The states of the approved mockup (stepper St1-St3), in a card as there: two steps done, one
+ * current and one ahead; the current step failed; keyboard focus on a step that is done, which can be
+ * pressed to go back; vertical with a description under each name; and the narrow form in a 320px
+ * frame. The steps of the focus block are the only ones that can be pressed, so Tab reaches them
+ * first.
+ */
+function Order({ variant }: Look) {
+  return (
+    <Card style={{ gap: 14, width: 600 }}>
+      <CardHeader>
+        <CardTitle>Checkout</CardTitle>
+      </CardHeader>
+      <div>
+        <div style={caption}>Horizontal · 2 steps done, 1 current, 1 ahead</div>
+        <Checkout variant={variant} />
+      </div>
+      <div>
+        <div style={caption}>The current step failed</div>
+        <Checkout variant={variant} status="error" />
+      </div>
+      <div>
+        <div style={caption}>Keyboard focus on a step that is done (it can be pressed)</div>
+        <Checkout variant={variant} onValueChange={() => {}} />
+      </div>
+      <div>
+        <div style={caption}>Vertical, with descriptions</div>
+        <Stepper value={2} variant={variant} orientation="vertical">
+          <Step title="Cart" description="3 items" />
+          <Step title="Delivery" description="Home delivery, 2–3 days" />
+          <Step title="Payment" description="Card or bank transfer" />
+          <Step title="Confirm" description="Review and place the order" />
+        </Stepper>
+      </div>
+      <div>
+        <div style={caption}>Narrow · 320px frame</div>
+        <div style={narrowFrame}>
+          <Checkout variant={variant} />
+        </div>
+      </div>
+    </Card>
+  );
+}
+
+// Tab twice: the first stop is the first step, the mockup draws the focus on the second one.
+const focusSecondStep: Story['play'] = async ({ canvas }) => {
+  await userEvent.tab();
+  await userEvent.tab();
+  const focused = canvas.getAllByRole('button', { name: /Delivery/ })[0]!;
+  await expect(focused).toHaveFocus();
+  await expect(focused.matches(':focus-visible')).toBe(true);
+};
+
+export const Circles: Story = { render: () => <Order variant="circles" />, play: focusSecondStep };
+export const Compact: Story = { render: () => <Order variant="compact" />, play: focusSecondStep };
+export const Bars: Story = { render: () => <Order variant="bars" />, play: focusSecondStep };
+
+/** A Stepper the user walks back through: the content of each step is the page's, driven by `value`. */
+function Wizard({ variant, width }: Look & { width?: number }) {
+  const [value, setValue] = useState(2);
+  return (
+    <div style={{ width }} data-wizard={variant}>
+      <Checkout variant={variant} value={value} onValueChange={setValue} />
+    </div>
+  );
+}
+
+/**
+ * Narrow, in a 320px frame, in each look: the words of the steps other than the current one are out
+ * of sight, and are still in the accessibility tree. Tab reaches each step that can be pressed, Enter
+ * and Space press it, and the focus stays on the step that was pressed when it becomes the current one.
+ */
+export const Narrow: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ display: 'grid', gap: 24 }}>
+      <Wizard variant="circles" width={320} />
+      <Wizard variant="compact" width={320} />
+      <Wizard variant="bars" width={320} />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const seen = (element: Element) => {
+      const { width, height } = element.getBoundingClientRect();
+      return width > 2 && height > 2;
+    };
+    for (const variant of ['circles', 'compact', 'bars']) {
+      const frame = canvasElement.querySelector<HTMLElement>(`[data-wizard="${variant}"]`)!;
+      const [cart, delivery, payment] = Array.from(frame.querySelectorAll('.flg-step-text'));
+      // Out of sight, but a screen reader still gets the whole phrase.
+      await expect(seen(cart!)).toBe(false);
+      await expect(seen(delivery!)).toBe(false);
+      await expect(seen(payment!)).toBe(true);
+      await expect(cart!.textContent).toContain('Step 1 of 4: ');
+      const accessible = frame.querySelector('button');
+      await expect(accessible).toHaveAccessibleName(/^Step 1 of 4:\s*Cart.*Completed$/);
+    }
+    const circles = canvasElement.querySelector<HTMLElement>('[data-wizard="circles"]')!;
+    const stepButton = (title: string) =>
+      Array.from(circles.querySelectorAll('button')).find((button) =>
+        button.textContent?.includes(title),
+      )!;
+    const current = () => circles.querySelector('[aria-current="step"]');
+    await expect(current()).toBe(stepButton('Payment'));
+    await userEvent.tab();
+    await expect(stepButton('Cart')).toHaveFocus();
+    await userEvent.tab();
+    await expect(stepButton('Delivery')).toHaveFocus();
+    await userEvent.keyboard('{Enter}');
+    await expect(current()).toBe(stepButton('Delivery'));
+    // Pressed, it is the current step, and it is still the focused button.
+    await expect(stepButton('Delivery')).toHaveFocus();
+    await userEvent.tab({ shift: true });
+    await expect(stepButton('Cart')).toHaveFocus();
+    await userEvent.keyboard(' ');
+    await expect(current()).toBe(stepButton('Cart'));
+    await expect(stepButton('Cart')).toHaveFocus();
+    // Back at the first step, the steps ahead are out of reach: only the current one is a button.
+    await expect(circles.querySelectorAll('button')).toHaveLength(1);
+  },
+};
+
+/**
+ * A horizontal Stepper fills the row it is in, also as an item of a flex row beside a box: as a
+ * container its content does not size it, so without `width: 100%` it would be 0px wide. Only a real
+ * layout can show it.
+ */
+export const InAFlexRow: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div data-row style={{ display: 'flex', alignItems: 'center', gap: 12, width: 480 }}>
+      <span data-box style={{ flex: 'none', width: 40, height: 40 }} />
+      <Checkout />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const row = canvasElement.querySelector<HTMLElement>('[data-row]')!;
+    const stepper = canvasElement.querySelector<HTMLElement>('.flg-stepper')!;
+    // The rest of the row: the row less the box and the 12px gap.
+    const rest = row.getBoundingClientRect().width - 40 - 12;
+    await expect(Math.abs(stepper.getBoundingClientRect().width - rest)).toBeLessThanOrEqual(1);
+  },
+};
diff --git a/src/components/stepper/Stepper.test-d.ts b/src/components/stepper/Stepper.test-d.ts
new file mode 100644
index 0000000..07129b3
--- /dev/null
+++ b/src/components/stepper/Stepper.test-d.ts
@@ -0,0 +1,55 @@
+import { createRef } from 'react';
+import type { ComponentProps } from 'react';
+import { expectTypeOf, test } from 'vitest';
+import type { StepProps, StepperLabels, StepperProps } from './Stepper';
+import { Step, Stepper } from './Stepper';
+
+test('a Stepper takes only the documented variants and orientations', () => {
+  expectTypeOf<StepperProps['variant']>().toEqualTypeOf<
+    'circles' | 'compact' | 'bars' | undefined
+  >();
+  expectTypeOf<StepperProps['orientation']>().toEqualTypeOf<
+    'horizontal' | 'vertical' | undefined
+  >();
+  // @ts-expect-error an unknown variant
+  const unknownVariant: StepperProps = { value: 0, children: null, variant: 'dots' };
+  // @ts-expect-error the variant of another component
+  const otherVariant: StepperProps = { value: 0, children: null, variant: 'inset' };
+  expectTypeOf(unknownVariant).toBeObject();
+  expectTypeOf(otherVariant).toBeObject();
+});
+
+test('a Stepper needs a value', () => {
+  expectTypeOf<StepperProps['value']>().toEqualTypeOf<number>();
+  // @ts-expect-error `value` is required: there is no uncontrolled form
+  const missing: StepperProps = { children: null };
+  expectTypeOf(missing).toBeObject();
+});
+
+test('onValueChange reports the index of the step', () => {
+  expectTypeOf<NonNullable<StepperProps['onValueChange']>>().parameters.toEqualTypeOf<[number]>();
+});
+
+test('labels may be given in part, and two of them are functions', () => {
+  expectTypeOf<NonNullable<StepperProps['labels']>>().toEqualTypeOf<Partial<StepperLabels>>();
+  expectTypeOf<StepperLabels['step']>().toEqualTypeOf<(n: number, total: number) => string>();
+  expectTypeOf<StepperLabels['caption']>().toEqualTypeOf<(n: number) => string>();
+  expectTypeOf<keyof StepperLabels>().toEqualTypeOf<
+    'step' | 'caption' | 'completed' | 'current' | 'notStarted' | 'error'
+  >();
+});
+
+test('a Stepper takes a ref to its <ol>', () => {
+  expectTypeOf(createRef<HTMLOListElement>()).toExtend<ComponentProps<typeof Stepper>['ref']>();
+});
+
+test('a Step has a title, takes only the two statuses, and takes no ref', () => {
+  expectTypeOf<StepProps['status']>().toEqualTypeOf<'complete' | 'error' | undefined>();
+  // @ts-expect-error `title` is required
+  const untitled: StepProps = { description: 'x' };
+  // @ts-expect-error `upcoming` is a place, not a status
+  const place: StepProps = { title: 'x', status: 'upcoming' };
+  expectTypeOf(untitled).toBeObject();
+  expectTypeOf(place).toBeObject();
+  expectTypeOf<ComponentProps<typeof Step>>().not.toHaveProperty('ref');
+});
diff --git a/src/components/stepper/Stepper.test.tsx b/src/components/stepper/Stepper.test.tsx
new file mode 100644
index 0000000..c0deaf3
--- /dev/null
+++ b/src/components/stepper/Stepper.test.tsx
@@ -0,0 +1,518 @@
+import { render, screen, within } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { Fragment, createRef } from 'react';
+import type { ComponentProps } from 'react';
+import { beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import { Step, Stepper } from './Stepper';
+
+beforeEach(() => {
+  resetDevWarnings();
+  vi.restoreAllMocks();
+});
+
+/** The four steps of the mockup's checkout. */
+function Checkout(props: Partial<ComponentProps<typeof Stepper>>) {
+  return (
+    <Stepper value={1} {...props}>
+      <Step title="Cart" description="3 items" />
+      <Step title="Delivery" description="Home delivery" />
+      <Step title="Payment" />
+      <Step title="Confirm" />
+    </Stepper>
+  );
+}
+
+const items = (container: HTMLElement) => Array.from(container.querySelectorAll('li.flg-step'));
+const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
+const CHECK = 'M2.5 6.2 5 8.5l4.5-5';
+const EXCLAMATION = 'M6 2.75v3.75M6 9.25h.01';
+
+describe('Stepper', () => {
+  it('renders an ordered list with the variant and orientation, circles and horizontal by default', () => {
+    const { container } = render(<Checkout />);
+    const list = container.firstElementChild!;
+    expect(list.tagName).toBe('OL');
+    expect(list).toHaveClass('flg-stepper');
+    expect(list).toHaveAttribute('data-variant', 'circles');
+    expect(list).toHaveAttribute('data-orientation', 'horizontal');
+    expect(items(container)).toHaveLength(4);
+  });
+
+  it.each(['circles', 'compact', 'bars'] as const)('reflects variant %s', (variant) => {
+    const { container } = render(<Checkout variant={variant} orientation="vertical" />);
+    expect(container.firstElementChild).toHaveAttribute('data-variant', variant);
+    expect(container.firstElementChild).toHaveAttribute('data-orientation', 'vertical');
+  });
+
+  it('forwards the ref to the <ol> and puts className, style and other props on it', () => {
+    const ref = createRef<HTMLOListElement>();
+    const { container } = render(
+      <Stepper ref={ref} value={0} className="mine" style={{ margin: 3 }} aria-label="Checkout">
+        <Step title="Cart" />
+      </Stepper>,
+    );
+    expect(ref.current).toBe(container.firstElementChild);
+    expect(ref.current).toHaveClass('flg-stepper', 'mine');
+    expect(ref.current).toHaveStyle({ margin: '3px' });
+    expect(screen.getByRole('list', { name: 'Checkout' })).toBe(ref.current);
+  });
+
+  it('reads the steps through fragments and arrays, in order', () => {
+    const { container } = render(
+      <Stepper value={0}>
+        <Fragment>
+          <Step title="A" />
+          {[<Step key="b" title="B" />, <Step key="c" title="C" />]}
+        </Fragment>
+        {false}
+        {null}
+      </Stepper>,
+    );
+    expect(items(container).map((li) => li.querySelector('.flg-step-title')?.textContent)).toEqual([
+      'A',
+      'B',
+      'C',
+    ]);
+  });
+
+  describe('states', () => {
+    it('marks the steps before value complete, the one at it current, the rest upcoming', () => {
+      const { container } = render(<Checkout value={1} />);
+      expect(items(container).map((li) => li.getAttribute('data-state'))).toEqual([
+        'complete',
+        'current',
+        'upcoming',
+        'upcoming',
+      ]);
+    });
+
+    it('marks every step complete, and none current, when value is the number of steps', () => {
+      const { container } = render(<Checkout value={4} />);
+      expect(items(container).map((li) => li.getAttribute('data-state'))).toEqual([
+        'complete',
+        'complete',
+        'complete',
+        'complete',
+      ]);
+      expect(container.querySelector('[aria-current]')).toBeNull();
+    });
+
+    it('lets the status of a Step win', () => {
+      const { container } = render(
+        <Stepper value={1}>
+          <Step title="A" />
+          <Step title="B" status="error" />
+          <Step title="C" status="complete" />
+          <Step title="D" />
+        </Stepper>,
+      );
+      expect(items(container).map((li) => li.getAttribute('data-state'))).toEqual([
+        'complete',
+        'error',
+        'complete',
+        'upcoming',
+      ]);
+    });
+
+    it('shows a number until the step is done, then a check, and a mark for an error', () => {
+      const { container } = render(
+        <Stepper value={2}>
+          <Step title="A" />
+          <Step title="B" status="error" />
+          <Step title="C" />
+          <Step title="D" />
+        </Stepper>,
+      );
+      const marks = items(container).map((li) => li.querySelector('.flg-step-indicator')!);
+      expect(marks[0]!.querySelector('svg path')).toHaveAttribute('d', CHECK);
+      expect(marks[1]!.querySelector('svg path')).toHaveAttribute('d', EXCLAMATION);
+      expect(marks[2]).toHaveTextContent('3');
+      expect(marks[3]).toHaveTextContent('4');
+      for (const mark of marks) expect(mark).toHaveAttribute('aria-hidden', 'true');
+    });
+
+    it('puts className and style of a Step on its <li>', () => {
+      const { container } = render(
+        <Stepper value={0}>
+          <Step title="A" className="mine" style={{ opacity: 0.5 }} />
+        </Stepper>,
+      );
+      const li = items(container)[0]!;
+      expect(li).toHaveClass('flg-step', 'mine');
+      expect(li).toHaveStyle({ opacity: '0.5' });
+    });
+  });
+
+  describe('the bars look', () => {
+    it('has a bar and a caption in place of the circle', () => {
+      const { container } = render(
+        <Stepper value={1} variant="bars">
+          <Step title="Cart" />
+          <Step title="Delivery" status="error" />
+          <Step title="Payment" />
+        </Stepper>,
+      );
+      expect(container.querySelector('.flg-step-indicator')).toBeNull();
+      const [first, second, third] = items(container);
+      expect(first!.querySelector('.flg-step-bar')).toHaveAttribute('aria-hidden', 'true');
+      const caption = (li: Element) => li.querySelector('.flg-step-caption')!;
+      expect(caption(first!)).toHaveAttribute('aria-hidden', 'true');
+      expect(caption(first!)).toHaveTextContent('Step 1');
+      // The done step has a check and the failed one an exclamation mark before the words.
+      expect(caption(first!).querySelector('path')).toHaveAttribute('d', CHECK);
+      expect(caption(second!).querySelector('path')).toHaveAttribute('d', EXCLAMATION);
+      expect(caption(third!).querySelector('svg')).toBeNull();
+    });
+
+    it('renders only the part of the look in use', () => {
+      const { container, rerender } = render(<Checkout variant="circles" />);
+      expect(container.querySelector('.flg-step-bar, .flg-step-caption')).toBeNull();
+      rerender(<Checkout variant="compact" />);
+      expect(container.querySelector('.flg-step-bar, .flg-step-caption')).toBeNull();
+    });
+  });
+
+  describe('reading it', () => {
+    it('says the place and the state in hidden text around the title and the description', () => {
+      const { container } = render(<Checkout value={1} />);
+      const second = items(container)[1]!;
+      const hidden = Array.from(second.querySelectorAll('.flg-visually-hidden')).map(
+        (node) => node.textContent,
+      );
+      expect(hidden).toEqual(['Step 2 of 4: ', ', ', ', Current']);
+      expect(second.querySelector('.flg-step-title')).toHaveTextContent('Delivery');
+      expect(second.querySelector('.flg-step-description')).toHaveTextContent('Home delivery');
+      // The order the screen reader reads them in.
+      const text = second.querySelector('.flg-step-text')!;
+      expect(Array.from(text.children).map((child) => child.className)).toEqual([
+        'flg-visually-hidden',
+        'flg-step-title',
+        'flg-visually-hidden',
+        'flg-step-description',
+        'flg-visually-hidden',
+      ]);
+    });
+
+    it('reads exactly as the sentence of the spec, with and without a description', () => {
+      const { container } = render(
+        <Stepper value={1}>
+          <Step title="Cart" />
+          <Step title="Delivery" description="Home delivery, 2–3 days" />
+        </Stepper>,
+      );
+      const [cart, delivery] = items(container);
+      expect(cart!.querySelector('.flg-step-text')!.textContent).toBe(
+        'Step 1 of 2: Cart, Completed',
+      );
+      expect(delivery!.querySelector('.flg-step-text')!.textContent).toBe(
+        'Step 2 of 2: Delivery, Home delivery, 2–3 days, Current',
+      );
+    });
+
+    it('gives each state its word', () => {
+      const { container } = render(
+        <Stepper value={2}>
+          <Step title="A" />
+          <Step title="B" status="error" />
+          <Step title="C" />
+          <Step title="D" />
+        </Stepper>,
+      );
+      const words = items(container).map((li) => {
+        const hidden = li.querySelectorAll('.flg-visually-hidden');
+        return hidden[hidden.length - 1]!.textContent;
+      });
+      expect(words).toEqual([', Completed', ', Error', ', Current', ', Not started']);
+    });
+
+    it('leaves out the description when there is none or it renders nothing', () => {
+      const { container } = render(
+        <Stepper value={0}>
+          <Step title="A" />
+          <Step title="B" description={false} />
+          <Step title="C" description={<></>} />
+          <Step title="D" description="" />
+        </Stepper>,
+      );
+      expect(container.querySelector('.flg-step-description')).toBeNull();
+    });
+
+    it('takes every word from `labels`', () => {
+      const { container } = render(
+        <Checkout
+          variant="bars"
+          value={1}
+          labels={{
+            step: (n, total) => `Bước ${n}/${total}`,
+            caption: (n) => `Bước ${n}`,
+            completed: 'Xong',
+            current: 'Hiện tại',
+            notStarted: 'Chưa tới',
+          }}
+        />,
+      );
+      const [first, second, third] = items(container);
+      const hidden = (li: Element) =>
+        Array.from(li.querySelectorAll('.flg-visually-hidden')).map((node) => node.textContent);
+      expect(hidden(first!)).toEqual(['Bước 1/4: ', ', ', ', Xong']);
+      expect(hidden(second!)).toEqual(['Bước 2/4: ', ', ', ', Hiện tại']);
+      expect(hidden(third!)).toEqual(['Bước 3/4: ', ', Chưa tới']);
+      expect(first!.querySelector('.flg-step-caption')).toHaveTextContent('Bước 1');
+    });
+
+    it('takes the word of an error from `labels`', () => {
+      const { container } = render(
+        <Stepper value={0} labels={{ error: 'Lỗi' }}>
+          <Step title="A" status="error" />
+        </Stepper>,
+      );
+      expect(container.querySelector('li')).toHaveTextContent(', Lỗi');
+    });
+
+    it('keeps the default of a label given as undefined', () => {
+      const { container } = render(
+        <Checkout labels={{ completed: undefined, step: undefined, error: undefined }} />,
+      );
+      const first = items(container)[0]!;
+      const hidden = Array.from(first.querySelectorAll('.flg-visually-hidden')).map(
+        (node) => node.textContent,
+      );
+      expect(hidden).toEqual(['Step 1 of 4: ', ', ', ', Completed']);
+    });
+
+    it('is read as one phrase by its accessible name', () => {
+      render(<Checkout value={1} onValueChange={() => {}} />);
+      // jsdom has no layout, so the spaces between the lines of a real browser are not there.
+      const name = /^Step 2 of 4:\s*Delivery.*, Current$/;
+      expect(screen.getByRole('button', { name })).toBeVisible();
+    });
+  });
+
+  describe('pressing a step', () => {
+    it('has no buttons without onValueChange, so it only shows', () => {
+      const { container } = render(<Checkout value={2} />);
+      expect(screen.queryByRole('button')).toBeNull();
+      for (const li of items(container)) {
+        expect(li.querySelector('.flg-step-inner')!.tagName).toBe('SPAN');
+      }
+    });
+
+    it('makes the steps up to the current one buttons, and the rest plain', () => {
+      const { container } = render(<Checkout value={1} onValueChange={() => {}} />);
+      const tags = items(container).map((li) => li.querySelector('.flg-step-inner')!.tagName);
+      expect(tags).toEqual(['BUTTON', 'BUTTON', 'SPAN', 'SPAN']);
+      const button = screen.getAllByRole('button')[0]!;
+      expect(button).toHaveAttribute('type', 'button');
+      expect(button).toHaveClass('flg-step-inner');
+    });
+
+    it('makes every step a button when not linear', () => {
+      render(<Checkout value={1} linear={false} onValueChange={() => {}} />);
+      expect(screen.getAllByRole('button')).toHaveLength(4);
+    });
+
+    it('makes a step ahead a button when its status says it is complete', () => {
+      render(
+        <Stepper value={0} onValueChange={() => {}}>
+          <Step title="A" />
+          <Step title="B" status="complete" />
+          <Step title="C" status="error" />
+        </Stepper>,
+      );
+      expect(screen.getAllByRole('button')).toHaveLength(2);
+    });
+
+    it('calls onValueChange with the index of another step, and does nothing for the current one', async () => {
+      const user = userEvent.setup();
+      const onValueChange = vi.fn();
+      render(<Checkout value={2} onValueChange={onValueChange} />);
+      const buttons = screen.getAllByRole('button');
+      expect(buttons).toHaveLength(3);
+      await user.click(buttons[0]!);
+      expect(onValueChange).toHaveBeenLastCalledWith(0);
+      await user.click(buttons[1]!);
+      expect(onValueChange).toHaveBeenLastCalledWith(1);
+      onValueChange.mockClear();
+      // The current step is a button too, and pressing it calls nothing.
+      await user.click(buttons[2]!);
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('reaches each button with Tab, and Enter and Space press it', async () => {
+      const user = userEvent.setup();
+      const onValueChange = vi.fn();
+      render(<Checkout value={2} onValueChange={onValueChange} />);
+      const [first, second] = screen.getAllByRole('button');
+      await user.tab();
+      expect(first).toHaveFocus();
+      await user.keyboard('{Enter}');
+      expect(onValueChange).toHaveBeenLastCalledWith(0);
+      await user.tab();
+      expect(second).toHaveFocus();
+      await user.keyboard(' ');
+      expect(onValueChange).toHaveBeenLastCalledWith(1);
+    });
+  });
+
+  describe('aria-current', () => {
+    it('is on the button of the current step when it is a button', () => {
+      const { container } = render(<Checkout value={1} onValueChange={() => {}} />);
+      const current = container.querySelectorAll('[aria-current]');
+      expect(current).toHaveLength(1);
+      expect(current[0]).toHaveAttribute('aria-current', 'step');
+      expect(current[0]!.tagName).toBe('BUTTON');
+      expect(current[0]).toHaveTextContent('Delivery');
+    });
+
+    it('is on the <li> of the current step when nothing is pressable', () => {
+      const { container } = render(<Checkout value={1} />);
+      const current = container.querySelectorAll('[aria-current]');
+      expect(current).toHaveLength(1);
+      expect(current[0]!.tagName).toBe('LI');
+      expect(current[0]).toHaveAttribute('aria-current', 'step');
+      expect(current[0]).toHaveTextContent('Delivery');
+    });
+
+    it('stays on the current step when its status is an error', () => {
+      const { container } = render(
+        <Stepper value={1}>
+          <Step title="A" />
+          <Step title="B" status="error" />
+        </Stepper>,
+      );
+      expect(container.querySelector('[aria-current]')).toHaveTextContent('B');
+    });
+
+    it('moves with value, and the button stays a button after going back', () => {
+      const { container, rerender } = render(<Checkout value={2} onValueChange={() => {}} />);
+      expect(container.querySelector('[aria-current]')).toHaveTextContent('Payment');
+      rerender(<Checkout value={0} onValueChange={() => {}} />);
+      const current = container.querySelector('[aria-current]')!;
+      expect(current).toHaveTextContent('Cart');
+      expect(current.tagName).toBe('BUTTON');
+    });
+  });
+
+  describe('value', () => {
+    it('rounds and clamps it, and takes NaN as 0, with one warning', () => {
+      const warn = spyWarn();
+      const current = (value: number) => {
+        const { container, unmount } = render(<Checkout value={value} />);
+        const states = items(container).map((li) => li.getAttribute('data-state'));
+        unmount();
+        return states.indexOf('current');
+      };
+      expect(current(1.6)).toBe(2);
+      expect(current(-3)).toBe(0);
+      expect(current(NaN)).toBe(0);
+      // Past the end: every step is done and none is current.
+      expect(current(9)).toBe(-1);
+      expect(current(Infinity)).toBe(-1);
+      expect(current(-Infinity)).toBe(0);
+      // The text does not carry the value, so six different values warn once.
+      expect(warn).toHaveBeenCalledTimes(1);
+      expect(warn).toHaveBeenCalledWith(
+        '[h2d-glass-ui] <Stepper> value must be a whole number from 0 to the number of steps; it was rounded into that range.',
+      );
+    });
+
+    it('does not warn for any whole number from 0 to the number of steps', () => {
+      const warn = spyWarn();
+      for (let value = 0; value <= 4; value += 1) {
+        const { unmount } = render(<Checkout value={value} />);
+        unmount();
+      }
+      expect(warn).not.toHaveBeenCalled();
+    });
+  });
+
+  describe('warnings', () => {
+    it('warns about a child that is not a Step and leaves it out', () => {
+      const warn = spyWarn();
+      const { container } = render(
+        <Stepper value={0}>
+          <Step title="A" />
+          <div>stray</div>
+        </Stepper>,
+      );
+      expect(items(container)).toHaveLength(1);
+      expect(container).not.toHaveTextContent('stray');
+      expect(warn).toHaveBeenCalledWith(
+        '[h2d-glass-ui] <Stepper> has a child that is not a <Step>; it is left out.',
+      );
+    });
+
+    it('does not warn about whitespace, null or false between the Steps', () => {
+      const warn = spyWarn();
+      render(
+        <Stepper value={0}>
+          {' '}
+          <Step title="A" /> {null}
+          {false}
+        </Stepper>,
+      );
+      expect(warn).not.toHaveBeenCalled();
+    });
+
+    it('warns that a Stepper with no steps cannot read any, and renders an empty list', () => {
+      const warn = spyWarn();
+      const { container } = render(<Stepper value={0}>{[]}</Stepper>);
+      expect(container.querySelector('ol')).toBeEmptyDOMElement();
+      expect(warn).toHaveBeenCalledWith(
+        '[h2d-glass-ui] <Stepper> has no steps. Its children must be <Step> elements written in the component that renders the Stepper (not passed in from a Server Component).',
+      );
+    });
+
+    it('does not read a Step that a component of its own wraps, and says so', () => {
+      const warn = spyWarn();
+      function Steps() {
+        return <Step title="A" />;
+      }
+      render(
+        <Stepper value={0}>
+          <Steps />
+        </Stepper>,
+      );
+      expect(warn).toHaveBeenCalledWith(
+        expect.stringContaining('has a child that is not a <Step>'),
+      );
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('has no steps'));
+    });
+
+    it('warns that linear={false} does nothing without onValueChange', () => {
+      const warn = spyWarn();
+      render(<Checkout linear={false} onValueChange={() => {}} />);
+      render(<Checkout />);
+      expect(warn).not.toHaveBeenCalled();
+      render(<Checkout linear={false} />);
+      expect(warn).toHaveBeenCalledWith(
+        '[h2d-glass-ui] <Stepper> linear={false} has no effect without onValueChange.',
+      );
+    });
+
+    it('says what to do when a Step is rendered outside a Stepper', () => {
+      const warn = spyWarn();
+      const { container } = render(<Step title="Lonely" />);
+      expect(container).toBeEmptyDOMElement();
+      expect(warn).toHaveBeenCalledWith(
+        '[h2d-glass-ui] <Step> rendered outside <Stepper>. Write the Steps in the same component that renders the Stepper: Steps passed from a Server Component into a client component arrive already rendered, and the Stepper cannot read them.',
+      );
+    });
+  });
+
+  it('reads the Steps of a Stepper written in the component that renders it', () => {
+    function Wizard() {
+      return (
+        <Stepper value={0} onValueChange={() => {}}>
+          <Step title="One" />
+          <Step title="Two" />
+        </Stepper>
+      );
+    }
+    const { container } = render(<Wizard />);
+    expect(
+      within(container.firstElementChild as HTMLElement).getAllByRole('listitem'),
+    ).toHaveLength(2);
+  });
+});
diff --git a/src/components/stepper/step-states.test.ts b/src/components/stepper/step-states.test.ts
new file mode 100644
index 0000000..66300cd
--- /dev/null
+++ b/src/components/stepper/step-states.test.ts
@@ -0,0 +1,151 @@
+import { describe, expect, it } from 'vitest';
+import { stepStates } from './step-states';
+import type { StepStatus } from './step-states';
+
+const states = (value: number, count: number) =>
+  stepStates({ count, value, statuses: [], linear: true, interactive: false }).map(
+    (step) => step.state,
+  );
+
+describe('stepStates', () => {
+  it('is empty for no steps', () => {
+    expect(
+      stepStates({ count: 0, value: 0, statuses: [], linear: true, interactive: true }),
+    ).toEqual([]);
+  });
+
+  it.each([
+    [0, ['current', 'upcoming', 'upcoming', 'upcoming']],
+    [1, ['complete', 'current', 'upcoming', 'upcoming']],
+    [2, ['complete', 'complete', 'current', 'upcoming']],
+    [3, ['complete', 'complete', 'complete', 'current']],
+    // A value equal to the count means every step is done and none is current.
+    [4, ['complete', 'complete', 'complete', 'complete']],
+  ])(
+    'puts the steps before value %i behind it, the step at it current, the rest ahead',
+    (value, expected) => {
+      expect(states(value, 4)).toEqual(expected);
+    },
+  );
+
+  it('covers every value from 0 to the count, for every count up to six', () => {
+    for (let count = 1; count <= 6; count += 1) {
+      for (let value = 0; value <= count; value += 1) {
+        const result = states(value, count);
+        expect(result).toHaveLength(count);
+        expect(result.filter((state) => state === 'complete')).toHaveLength(value);
+        expect(result.filter((state) => state === 'current')).toHaveLength(value < count ? 1 : 0);
+        expect(result.filter((state) => state === 'upcoming')).toHaveLength(
+          Math.max(0, count - value - 1),
+        );
+      }
+    }
+  });
+
+  it('lets the status of a step win, whatever its place', () => {
+    const statuses: Array<StepStatus | undefined> = [undefined, 'error', 'complete', undefined];
+    const result = stepStates({ count: 4, value: 1, statuses, linear: true, interactive: false });
+    expect(result.map((step) => step.state)).toEqual(['complete', 'error', 'complete', 'upcoming']);
+  });
+
+  it('keeps a step with the status error as the error even when it is behind the value', () => {
+    const result = stepStates({
+      count: 3,
+      value: 2,
+      statuses: ['error'],
+      linear: true,
+      interactive: false,
+    });
+    expect(result.map((step) => step.state)).toEqual(['error', 'complete', 'current']);
+  });
+
+  it('takes a status list shorter than the steps as no status for the rest', () => {
+    const result = stepStates({
+      count: 2,
+      value: 0,
+      statuses: ['error'],
+      linear: true,
+      interactive: false,
+    });
+    expect(result.map((step) => step.state)).toEqual(['error', 'upcoming']);
+  });
+
+  it('ignores the statuses past the last step', () => {
+    const result = stepStates({
+      count: 1,
+      value: 0,
+      statuses: ['complete', 'error'],
+      linear: true,
+      interactive: false,
+    });
+    expect(result.map((step) => step.state)).toEqual(['complete']);
+  });
+
+  describe('clickable', () => {
+    const clickable = (options: {
+      value: number;
+      statuses?: Array<StepStatus | undefined>;
+      linear: boolean;
+      interactive: boolean;
+    }) => stepStates({ count: 4, statuses: [], ...options }).map((step) => step.clickable);
+
+    it('is false for every step when the stepper is not interactive', () => {
+      expect(clickable({ value: 2, linear: true, interactive: false })).toEqual([
+        false,
+        false,
+        false,
+        false,
+      ]);
+      expect(clickable({ value: 2, linear: false, interactive: false })).toEqual([
+        false,
+        false,
+        false,
+        false,
+      ]);
+    });
+
+    it('is true up to and including the current step when linear', () => {
+      expect(clickable({ value: 0, linear: true, interactive: true })).toEqual([
+        true,
+        false,
+        false,
+        false,
+      ]);
+      expect(clickable({ value: 2, linear: true, interactive: true })).toEqual([
+        true,
+        true,
+        true,
+        false,
+      ]);
+    });
+
+    it('is true for every step when the value is the count', () => {
+      expect(clickable({ value: 4, linear: true, interactive: true })).toEqual([
+        true,
+        true,
+        true,
+        true,
+      ]);
+    });
+
+    it('is true for every step when not linear', () => {
+      expect(clickable({ value: 1, linear: false, interactive: true })).toEqual([
+        true,
+        true,
+        true,
+        true,
+      ]);
+    });
+
+    it('is true for a step ahead whose status is complete, and false for one that is an error', () => {
+      expect(
+        clickable({
+          value: 0,
+          statuses: [undefined, 'complete', 'error'],
+          linear: true,
+          interactive: true,
+        }),
+      ).toEqual([true, true, false, false]);
+    });
+  });
+});
diff --git a/src/docs/ExceptionTable.test.tsx b/src/docs/ExceptionTable.test.tsx
index d9c8972..2ddcc11 100644
--- a/src/docs/ExceptionTable.test.tsx
+++ b/src/docs/ExceptionTable.test.tsx
@@ -14,9 +14,9 @@ describe('ExceptionTable', () => {
       .getAllByRole('cell')
       .map((cell) => cell.textContent);
 
-  it('lists the twenty-nine rows of spec §4.9 with light and dark measurements', () => {
+  it('lists the thirty-one rows of spec §4.9 with light and dark measurements', () => {
     const rows = bodyRows();
-    expect(rows).toHaveLength(29);
+    expect(rows).toHaveLength(31);
     expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
       '1',
       '2',
@@ -47,6 +47,8 @@ describe('ExceptionTable', () => {
       '27',
       '28',
       '29',
+      '30',
+      '31',
     ]);
     expect(rows[3]).toHaveTextContent('meets AA (4.74:1)');
     expect(rows[3]).toHaveTextContent('3.63:1 / 2.24:1');
@@ -77,11 +79,17 @@ describe('ExceptionTable', () => {
     expect(cells(rows[22]!).slice(1, 3)).toEqual(['meets AA (3.60:1)', '2.02:1 / 1.84:1 / 1.88:1']);
     expect(cells(rows[23]!).slice(1, 3)).toEqual(['meets AA (4.68:1)', '3.37:1']);
     expect(cells(rows[24]!).slice(1, 3)).toEqual(['meets AA (11.14:1)', '4.16:1']);
-    expect(cells(rows[25]!).slice(1, 3)).toEqual(['meets AA (5.78:1)', '3.90:1']);
+    // Row 26 also holds the number of the current step of a Stepper, which is the lower of the two in
+    // light and has its own number in dark.
+    expect(cells(rows[25]!).slice(1, 3)).toEqual(['meets AA (5.67:1)', '3.90:1 / 3.33:1']);
     // The Progress rows (spec phase 4 §4.4): the fill is under the threshold in both themes.
     expect(cells(rows[26]!).slice(1, 3)).toEqual(['2.45:1', '1.74:1']);
     expect(cells(rows[27]!).slice(1, 3)).toEqual(['1.62:1', '1.74:1']);
     expect(cells(rows[28]!).slice(1, 3)).toEqual(['3.95:1', '4.44:1']);
+    // The Stepper rows (spec phase 4 §4.4): the ring of a step not reached yet, and the edge of the
+    // current step of a `compact` Stepper on its pill.
+    expect(cells(rows[29]!).slice(1, 3)).toEqual(['2.63:1', '2.63:1']);
+    expect(cells(rows[30]!).slice(1, 3)).toEqual(['2.61:1', '2.01:1']);
   });
 
   it('shows the live measurement for a theme with no exception in a row', () => {
@@ -123,6 +131,8 @@ describe('ExceptionTable', () => {
       '1.4.11',
       '1.4.11',
       '1.4.3',
+      '1.4.11',
+      '1.4.11',
     ]);
     expect(cells(rows[3]!).at(-2)).toBe('4.5:1 text, 3:1 check marks');
     expect(cells(rows[0]!).at(-2)).toBe('3:1');
diff --git a/src/index.test.ts b/src/index.test.ts
index c6a6833..4c58800 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -88,6 +88,8 @@ describe('public API', () => {
       'SkeletonText',
       'Slider',
       'Spinner',
+      'Step',
+      'Stepper',
       'Surface',
       'Switch',
       'Tabs',
diff --git a/src/internal/icons.test.tsx b/src/internal/icons.test.tsx
index d11494c..511cb70 100644
--- a/src/internal/icons.test.tsx
+++ b/src/internal/icons.test.tsx
@@ -7,6 +7,7 @@ import {
   CheckIcon,
   ChevronIcon,
   CloseIcon,
+  ExclamationIcon,
   FileIcon,
   MinusIcon,
   PlusIcon,
@@ -40,6 +41,15 @@ describe('shared icons', () => {
     expect(container.querySelector('path')?.getAttribute('d')).toBe('M2.5 6.2 5 8.5l4.5-5');
   });
 
+  it('ExclamationIcon uses a 12x12 viewBox and the stroke of the other icons', () => {
+    const { container } = render(<ExclamationIcon />);
+    const svg = container.querySelector('svg')!;
+    expect(svg.getAttribute('viewBox')).toBe('0 0 12 12');
+    expect(svg.getAttribute('aria-hidden')).toBe('true');
+    expect(svg.getAttribute('stroke-width')).toBe('2');
+    expect(container.querySelector('path')?.getAttribute('d')).toBe('M6 2.75v3.75M6 9.25h.01');
+  });
+
   it('ChevronIcon defaults to down', () => {
     const { container } = render(<ChevronIcon />);
     expect(container.querySelector('path')?.getAttribute('d')).toBe('m6 9 6 6 6-6');
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/stepper src/internal/icons.test.tsx src/docs/ExceptionTable.test.tsx src/index.test.ts
```

Expected: FAIL.
- `step-states.test.ts` không nạp được (project `unit`), nên 16 test không chạy: `Failed to resolve import "./step-states" from "src/components/stepper/step-states.test.ts". Does the file exist?`.
- `Stepper.test.tsx` không nạp được ở cả hai project React, nên 40 test không chạy: `Failed to resolve import "./Stepper" from "src/components/stepper/Stepper.test.tsx". Does the file exist?`.
- `Stepper.test-d.ts` báo lỗi kiểu vì module chưa có.
- `shared icons > ExclamationIcon uses a 12x12 viewBox and the stroke of the other icons` fail ở mỗi project React: `Element type is invalid … got: undefined`, vì `ExclamationIcon` chưa được export.
- `ExceptionTable > lists the thirty-one rows of spec §4.9 with light and dark measurements`: `expected [ … ] to have a length of 31 but got 29`. `names the WCAG criterion and minimum of every row`: danh sách tiêu chí có 29 phần tử, test mong 31.
- `public API > exports exactly the documented components and nothing internal`: danh sách export chưa có `Step`, `Stepper`. Bản nháp không thấy lỗi này (phát hiện 9).

`pnpm check:contrast` không có bước fail riêng: bản nháp viết check và ngoại lệ cùng lúc, nên bốn số của phát hiện 4 là đặc tả của script (phát hiện 9). Story viết sau code và là test đặc tả.

- [ ] **Step 3: Viết code**

````diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index b26bf82..fd15bdf 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -313,21 +313,21 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | # | Điểm | Light | Dark | Ngưỡng | Tiêu chí WCAG |
 |---|---|---|---|---|---|
 | 1 | Viền control (input, ô checkbox, radio, switch tắt) so với nền | 1.28:1 | 1.31:1 | 3:1 | 1.4.11 |
-| 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus) | 1.20:1 | 1.23:1 | 3:1 | 1.4.11 |
+| 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus), và nút của bước Stepper | 1.20:1 | 1.23:1 | 3:1 | 1.4.11 |
 | 3 | Viền Input/Textarea khi focus (control không lỗi) | đạt (4.45:1) | 2.06:1 | 3:1 | 1.4.11 |
 | 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
-| 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) và vạch dưới tab `underline` đang chọn, so với nền | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
-| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin` | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
-| 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn, trang hiện tại của Pagination | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
-| 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn, trang hiện tại của Pagination | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
-| 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ; dòng gợi ý của vùng thả FileUpload khi đang kéo | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
-| 10 | Chữ `--flg-danger` trên item `danger` đang được trỏ (nền danger 16%) | 4.24:1 | đạt (4.57:1) | 4.5:1 | 1.4.3 |
+| 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) và vạch dưới tab `underline` đang chọn, so với nền; thanh của bước đã xong (Stepper `bars`) | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
+| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin`; ở Stepper: số, tên và mô tả của bước chưa tới, mô tả của mọi bước, dòng "Step N" của bước chưa tới | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
+| 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn, trang hiện tại của Pagination; tiêu đề bước hiện tại của Stepper `compact` | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
+| 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn, trang hiện tại của Pagination; viên thuốc của bước hiện tại (Stepper `compact`) | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
+| 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ; dòng gợi ý của vùng thả FileUpload khi đang kéo; mô tả của bước hiện tại trong viên thuốc (Stepper `compact`) | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
+| 10 | Chữ `--flg-danger` trên item `danger` đang được trỏ (nền danger 16%); tiêu đề và mô tả của bước lỗi trong viên thuốc (Stepper `compact`) | 4.24:1 | đạt (4.57:1) | 4.5:1 | 1.4.3 |
 | 11 | Ô checkbox đã chọn (màu nhấn) trên option đang được trỏ của Select chọn nhiều, so với nền `--flg-accent-subtle` của hàng | 2.61:1 | 1.91:1 | 3:1 | 1.4.11 |
 | 12 | Chữ `--flg-text-muted` của tab `segmented` trên rãnh `--flg-control-track` | 4.10:1 | 3.36:1 | 4.5:1 | 1.4.3 |
 | 13 | Tab `segmented` đang chọn (nền `--flg-control-bg`) so với rãnh | 1.24:1 | 1.12:1 | 3:1 | 1.4.11 |
-| 14 | Icon và vạch của toast `info` (`--flg-accent-solid`) so với nền | đạt (3.04:1) | 2.29:1 | 3:1 | 1.4.11 |
+| 14 | Icon và vạch của toast `info` (`--flg-accent-solid`) so với nền; viền 2px của dấu tròn bước hiện tại (Stepper `circles`) | đạt (3.04:1) | 2.29:1 | 3:1 | 1.4.11 |
 | 15 | Chấm vạch chia của Slider (`--flg-slider-tick`, 70% `--flg-text-muted`) so với nền | 2.88:1 | 2.82:1 | 3:1 | 1.4.11 |
-| 16 | Rãnh của Slider và của Progress (`--flg-control-track`) so với nền | 1.23:1 | 1.30:1 | 3:1 | 1.4.11 |
+| 16 | Rãnh của Slider và của Progress (`--flg-control-track`) so với nền; thanh của bước chưa tới (Stepper `bars`) | 1.23:1 | 1.30:1 | 3:1 | 1.4.11 |
 | 17 | Núm của Slider (`--flg-control-thumb`) so với rãnh và với phần đã chọn | 1.29:1 | 2.24:1 | 3:1 | 1.4.11 |
 | 18 | Số của ngày thuộc tháng khác trong Calendar (`--flg-text-muted`, `opacity: .5`) trên bề mặt | 2.04:1 | 2.14:1 | 4.5:1 | 1.4.3 |
 | 19 | Viền đứt nét của vùng thả FileUpload (`--flg-dropzone-border`, 45% `--flg-text-muted`) so với nền | 1.89:1 | 1.99:1 | 3:1 | 1.4.11 |
@@ -337,10 +337,12 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 23 | Icon và vạch `info` (`--flg-accent-solid`) của Alert so với nền của Alert | đạt (4.18:1 `stripe`, 3.60:1 `tinted`, 3.62:1 `plain`) | 2.02:1 `stripe`, 1.84:1 `tinted`, 1.88:1 `plain` | 3:1 | 1.4.11 |
 | 24 | Tiêu đề của Alert `tinted` (màu trạng thái; `--flg-accent-text` cho `info`) trên nền nhuộm | đạt (4.68:1) | 3.37:1 | 4.5:1 | 1.4.3 |
 | 25 | Mô tả `--flg-text` của Alert `tinted` trên nền nhuộm | đạt (11.14:1) | 4.16:1 | 4.5:1 | 1.4.3 |
-| 26 | Chữ `--flg-accent-text` trên `--flg-control-bg`: tiêu đề Alert `plain` `info` | đạt (5.78:1) | 3.90:1 | 4.5:1 | 1.4.3 |
-| 27 | Phần đã chạy của Progress `thin` và `inline` (các điểm của `--flg-accent-gradient`, `--flg-success`, `--flg-danger`) so với rãnh `--flg-control-track` | 2.45:1 | 1.74:1 | 3:1 | 1.4.11 |
+| 26 | Chữ `--flg-accent-text` trên `--flg-control-bg`: tiêu đề Alert `plain` `info`; số của bước hiện tại, Stepper `circles` và `compact` | đạt (5.78:1 Alert, 5.67:1 Stepper) | 3.90:1 Alert, 3.33:1 Stepper | 4.5:1 | 1.4.3 |
+| 27 | Phần đã chạy của Progress `thin` và `inline` (các điểm của `--flg-accent-gradient`, `--flg-success`, `--flg-danger`) so với rãnh `--flg-control-track`; nửa đã chạy của thanh bước hiện tại (Stepper `bars`) | 2.45:1 | 1.74:1 | 3:1 | 1.4.11 |
 | 28 | Phần đã chạy của Progress `glow`, kể cả lớp ánh sáng trắng 24% ở nửa trên, so với rãnh | 1.62:1 | 1.74:1 | 3:1 | 1.4.11 |
-| 29 | Chữ `--flg-accent-text` trên bề mặt: giá trị của Progress `glow` | 3.95:1 | 4.44:1 | 4.5:1 | 1.4.3 |
+| 29 | Chữ `--flg-accent-text` trên bề mặt: giá trị của Progress `glow`; dòng "Step N" của bước xong và bước hiện tại (Stepper `bars`) | 3.95:1 | 4.44:1 | 4.5:1 | 1.4.3 |
+| 30 | Vòng của bước chưa tới (`--flg-stepper-ring`, 65% `--flg-text-muted`) so với nền: Stepper `circles` và `compact` | 2.63:1 | 2.63:1 | 3:1 | 1.4.11 |
+| 31 | Vạch `--flg-accent-solid` trên nền nhấn nhạt `--flg-selected-bg`: viền 2px của dấu tròn bước hiện tại, Stepper `compact` | 2.61:1 | 2.01:1 | 3:1 | 1.4.11 |
 
 Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Điểm 14 là icon `info` của toast theo mockup toast S2 (giai đoạn 2, Plan E1). Điểm 6 còn là chữ mờ của option Combobox đang lọc và dòng trạng thái (giai đoạn 3, Plan B) và chữ hàng thứ của Calendar (giai đoạn 3, Plan C): cùng cặp màu, nên cùng số đo. Điểm 18 là ngày của tháng khác theo mockup K1 (giai đoạn 3, Plan C), nửa độ mờ nên thấp hơn hẳn chữ mờ thường. Điểm 15–17 là chấm vạch, rãnh và núm của Slider theo mockup S3 (giai đoạn 3, Plan A). Điểm 19–22 là viền vùng thả, nút chọn tệp, cỡ tệp và dòng gợi ý của FileUpload theo mockup F1 (giai đoạn 3, Plan D); dòng gợi ý khi đang kéo (chữ mờ trên nền nhấn) cùng cặp màu với điểm 9, nên được ghi ở điểm 9 (phát hiện khi review cuối Plan D). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
 
@@ -348,7 +350,9 @@ Các số được **làm tròn xuống** 2 chữ số thập phân, và là đ
 
 Điểm 27–29 là Progress theo mockup P1–P3 (giai đoạn 4, Plan A): phần đã chạy so với rãnh (điểm 27 cho `thin` và `inline`, điểm 28 cho `glow` có thêm lớp ánh sáng), và giá trị của `glow` (điểm 29). Số của điểm 27 và 28 là thấp nhất trong các điểm màu của phần đã chạy (gradient nhấn, `success`, `danger`) và trên mọi nền tham chiếu. Giá trị của `thin` là chữ `--flg-text-muted` trên bề mặt, cùng cặp màu với điểm 6, và rãnh của Progress cùng cặp màu với điểm 16, nên được ghi ở đó. Ở `prefers-contrast: more` rãnh có viền và `glow` bỏ ánh sáng, nên cả ba điểm đều đạt.
 
-Cả hai mươi chín điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
+Điểm 30–31 là Stepper theo mockup St1–St3 (giai đoạn 4, Plan B): vòng của bước chưa tới (điểm 30, `circles` và `compact`) và viền dấu tròn của bước hiện tại trên viên thuốc của `compact` (điểm 31; Plan B chỉ ghi phần Stepper). Số của bước hiện tại (`--flg-accent-text` trên `--flg-control-bg`, và trên dấu tròn trong viên thuốc) cùng cặp màu với điểm 26 nên được ghi ở đó; dấu ✓ của bước đã xong đạt (3.40 light, 3.59 dark), nên không phải ngoại lệ. Các vị trí khác của Stepper cùng cặp màu với các điểm 2, 5, 6, 7, 8, 9, 10, 14, 16, 27 và 29, nên được ghi ở đó. Ở `prefers-contrast: more` vòng thành màu đặc, thanh chưa tới có viền và viên thuốc của bước hiện tại là màu nhấn đặc, nên cả hai điểm đều đạt.
+
+Cả ba mươi mốt điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
 
 ---
 
diff --git a/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md b/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md
index 2ac02ea..ade2eab 100644
--- a/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md
+++ b/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md
@@ -143,6 +143,7 @@ Không component nào của giai đoạn 4 tự có vùng live (Claude chốt).
 - **Stepper ngang hẹp** dùng container query, không dùng JS: HTML từ server đã đúng.
   - Phần tử gốc `<ol>` ngang là container có tên: `container: flg-stepper / inline-size`. Quy tắc hẹp là `@container flg-stepper (max-width: 479px)`. Có tên để một Stepper dọc (không phải container) nằm trong một container của người dùng không bị quy tắc hẹp áp nhầm (Claude chốt).
   - Chỉ Stepper ngang là container (Claude chốt). `inline-size` chặn chiều rộng của phần tử phụ thuộc nội dung; Stepper dọc trong một cha co theo nội dung sẽ bị ép về 0 nếu cũng là container.
+  - Gốc `<ol>` ngang có `width: 100%` (Claude chốt, phát hiện khi lập Plan B). Một container `inline-size` không lấy kích thước từ nội dung, nên là một mục của hàng flex nó co về 0; Plan A cũng làm Progress và Skeleton đầy hàng vì lý do tương tự. Trong luồng khối không có gì đổi. Một story `no-visual` đo một Stepper ngang trong hàng flex cạnh một ô 40px: nó chiếm phần còn lại của hàng. Trong một cha co theo nội dung (không phải hàng flex có chiều rộng) nó vẫn co về 0, như rủi ro ở §10.
 - **Table** đo khung cuộn bằng `ResizeObserver` trên cả khung lẫn `<table>`: khung "cuộn được" khi `scrollWidth > clientWidth` hoặc `scrollHeight > clientHeight`. Chỉ khi đó khung mới mang `role="region"`, `tabIndex={0}` và tên (§6.3). HTML từ server không có ba thuộc tính này; chúng xuất hiện sau khi mount. Trạng thái chỉ được đặt khi kết quả đổi, để không gây vòng lặp `ResizeObserver`.
   - Bản thân khung luôn là scroll container (`overflow: auto`) ngay từ HTML của server, ở mọi variant: `stickyHeader` cần nó, và bảng rộng hơn khung cuộn được trước khi hydrate.
   - Một scroll container cắt mọi thứ vẽ ra ngoài mép padding của nó, kể cả vòng focus của control nằm sát mép bảng. Cách giữ vòng focus nguyên vẹn ở §4.3 ("Khung cuộn và vòng focus"; Claude chốt, phát hiện khi đọc soát spec).
@@ -560,7 +561,7 @@ Icon của cột đang sắp (`--flg-accent-text` trên bề mặt) là cặp c
 **`prefers-contrast: more`:** mọi cặp mới phải đạt (lớp 4 (b) ở §7, không có ngoại lệ). Ngoài phần token đã có của chế độ này, các quy tắc sau đều ngoài mockup và chỉ có hiệu lực khi người dùng bật tuỳ chọn:
 
 - `--flg-stepper-ring` thành màu đặc (§4.2).
-- Rãnh của Progress và thanh chưa tới của Stepper `bars` có viền trong 1px `--flg-control-border`, như rãnh Slider.
+- Rãnh của Progress, thanh chưa tới và thanh của bước hiện tại của Stepper `bars` có viền trong 1px `--flg-control-border`, như rãnh Slider (nửa trống của thanh hiện tại cũng là rãnh, và rãnh của Progress giữ viền khi có phần đã chạy bên trong; phát hiện khi lập Plan B). Forced colors thắng quy tắc này (§4.5).
 - Progress `glow` bỏ lớp ánh sáng ở nửa trên (phần đã chạy chỉ còn màu của nó, nên `progress-glow-fill` đạt như `progress-fill`) và bỏ quầng sáng (Claude chốt: một quầng nhoè quanh thanh không giúp gì cho người cần tương phản cao). Quầng là một `color-mix` riêng, không đi theo token `--flg-glow` vốn đã về `none` ở chế độ này, nên phải bỏ bằng quy tắc.
 - Hàng hiện tại của List: mọi chữ và icon trong hàng (tiêu đề, mô tả, ô đầu, ô cuối) lấy `--flg-selected-text`, vì nền hàng thành màu nhấn đặc; vạch của `inset` lấy `--flg-selected-text`. Docs nói hàng hiện tại nên chỉ có chữ và icon: một Badge hay nút trong hàng đó tự mang màu của nó (§8).
 - Bước hiện tại của Stepper `compact`: viên thuốc thành màu nhấn đặc (qua `--flg-selected-bg`), nên dấu tròn trong nó đảo màu: nền `--flg-selected-text`, viền `--flg-selected-text`, số màu `--flg-selected-bg`; mô tả của bước lấy `--flg-selected-text` (giữ `--flg-text-muted` thì chỉ còn 1.25 light, 1.40 dark).
@@ -640,7 +641,7 @@ Giai đoạn 4 không thêm module mới vào `src/internal/` ngoài các icon 
 - Skeleton: `size` trên hình không phải `circle` (bị bỏ qua); `SkeletonText` có `lines` không phải số nguyên dương (lib dùng 1).
 - Stepper:
   - Có con không phải `Step` (bị bỏ qua).
-  - `value` không phải số nguyên trong `[0, số bước]` (lib làm tròn và kẹp).
+  - `value` không phải số nguyên trong `[0, số bước]` (lib làm tròn và kẹp; `NaN` coi là 0, vô cực kẹp như mọi số khác, phát hiện khi lập Plan B). Lời cảnh báo không chứa giá trị, để `devWarn` gộp được các lần lặp: "<Stepper> value must be a whole number from 0 to the number of steps; it was rounded into that range."
   - `linear={false}` mà không có `onValueChange` (không có tác dụng).
   - `Step` được render ngoài `Stepper`. Lời cảnh báo nêu nguyên nhân hay gặp nhất và cách sửa (Claude chốt, phát hiện khi đọc soát spec; §3.1): "<Step> rendered outside <Stepper>. Write the Steps in the same component that renders the Stepper: Steps passed from a Server Component into a client component arrive already rendered, and the Stepper cannot read them."
   - `Stepper` không đọc được bước nào (Claude chốt, cùng lý do): "<Stepper> has no steps. Its children must be <Step> elements written in the component that renders the Stepper (not passed in from a Server Component)." Stepper khi đó render một `<ol>` rỗng.
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index a75b07b..62f0d27 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -140,6 +140,15 @@ const SHIPPED_CLASSES = [
   'flg-progress-fill',
   'flg-skeleton',
   'flg-skeleton-text',
+  'flg-stepper',
+  'flg-step',
+  'flg-step-inner',
+  'flg-step-indicator',
+  'flg-step-bar',
+  'flg-step-text',
+  'flg-step-caption',
+  'flg-step-title',
+  'flg-step-description',
 ];
 
 const requirements: Array<[string, boolean]> = [
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 7369635..67c8c90 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -26,8 +26,8 @@ const D = {
   },
   2: {
     description:
-      'Focus ring on Button, IconButton, Checkbox, Radio and Switch, and on an invalid Input or ' +
-      'Textarea, whose border stays red while focused',
+      'Focus ring on Button, IconButton, Checkbox, Radio and Switch, on the button of a Stepper ' +
+      'step, and on an invalid Input or Textarea, whose border stays red while focused',
     criterion: '1.4.11',
   },
   3: {
@@ -41,36 +41,44 @@ const D = {
   },
   5: {
     description:
-      'Accent fill of checked states (checkbox, radio dot, switch on) and the bar under the ' +
-      'selected underline tab, against the surface',
+      'Accent fill of checked states (checkbox, radio dot, switch on), the bar under the ' +
+      'selected underline tab and the bar of a done step in a Stepper `bars`, against the surface',
     criterion: '1.4.11',
   },
   6: {
     description:
       'Muted text on the brightest reference backdrop, the muted text of a Combobox option ' +
-      'while filtering and of its status row, the weekday row of a Calendar, and the value of a ' +
-      'Progress `thin`',
+      'while filtering and of its status row, the weekday row of a Calendar, the value of a ' +
+      'Progress `thin`, and in a Stepper the number, title and description of a step not reached, ' +
+      'the description of every step and the "Step N" line of a step not reached',
     criterion: '1.4.3',
   },
   7: {
     description:
-      'Accent text on the accent wash: an accent Badge, a selected pill tab, the current page',
+      'Accent text on the accent wash: an accent Badge, a selected pill tab, the current page, the ' +
+      'title of the current step of a Stepper `compact`',
     criterion: '1.4.3',
   },
   8: {
     description:
       'The accent wash against the panel or surface: a highlighted menu item or Select option, a ' +
-      'selected pill tab, the current page',
+      'selected pill tab, the current page, the pill of the current step of a Stepper `compact`',
     criterion: '1.4.11',
   },
   9: {
     description:
-      'Muted icon, shortcut and submenu chevron on a highlighted menu item or option, and the hint ' +
-      'of a FileUpload zone while files are over it',
+      'Muted icon, shortcut and submenu chevron on a highlighted menu item or option, the hint ' +
+      'of a FileUpload zone while files are over it, and the description of the current step of a ' +
+      'Stepper `compact`',
     criterion: '1.4.3, 1.4.11',
     minimum: '4.5:1 shortcut text, 3:1 icons',
   },
-  10: { description: 'Danger text on a highlighted danger menu item', criterion: '1.4.3' },
+  10: {
+    description:
+      'Danger text on a highlighted danger menu item, and the title and description of a failed ' +
+      'step in a Stepper `compact`',
+    criterion: '1.4.3',
+  },
   11: {
     description:
       'Accent fill of a chosen checkbox on a highlighted option of a multiple Select, against the ' +
@@ -80,12 +88,16 @@ const D = {
   12: { description: 'Muted text of a segmented tab on its track', criterion: '1.4.3' },
   13: { description: 'Selected segmented tab against its track', criterion: '1.4.11' },
   14: {
-    description: 'The icon and bar of an info toast against the surface',
+    description:
+      'The icon and bar of an info toast, and the 2px border of the dot of the current step in a ' +
+      'Stepper `circles`, against the surface',
     criterion: '1.4.11',
   },
   15: { description: 'Tick dots under a Slider track, against the surface', criterion: '1.4.11' },
   16: {
-    description: 'Slider and Progress track against the surface',
+    description:
+      'Slider and Progress track, and the bar of a step not reached in a Stepper `bars`, against ' +
+      'the surface',
     criterion: '1.4.11',
   },
   17: {
@@ -128,13 +140,16 @@ const D = {
     criterion: '1.4.3',
   },
   26: {
-    description: 'Accent text on the control background: the title of an info Alert `plain`',
+    description:
+      'Accent text on the control background: the title of an info Alert `plain`, and the number ' +
+      'of the current step in a Stepper `circles` and `compact`',
     criterion: '1.4.3',
   },
   27: {
     description:
       'The filled part of a Progress `thin` or `inline` (accent gradient, success and danger ' +
-      'colours) against its track',
+      'colours) against its track, and the filled half of the bar of the current step in a Stepper ' +
+      '`bars`',
     criterion: '1.4.11',
   },
   28: {
@@ -143,9 +158,23 @@ const D = {
     criterion: '1.4.11',
   },
   29: {
-    description: 'Accent text on the surface: the value of a Progress `glow`',
+    description:
+      'Accent text on the surface: the value of a Progress `glow`, and the "Step N" line of a ' +
+      'done or current step in a Stepper `bars`',
     criterion: '1.4.3',
   },
+  30: {
+    description:
+      'The ring of a step not reached yet (the muted text colour at 65%) against the surface, in a ' +
+      'Stepper `circles` and `compact`',
+    criterion: '1.4.11',
+  },
+  31: {
+    description:
+      'The accent line on the accent wash of the current step: the border of its dot in a Stepper ' +
+      '`compact`',
+    criterion: '1.4.11',
+  },
 } as const satisfies Record<number, ExceptionRowInfo>;
 
 /** Spec §4.9. The default theme keeps the approved mockup values, so these gaps are accepted. */
@@ -201,10 +230,15 @@ export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
   { row: 24, theme: 'dark', check: 'alert-tinted-title', recorded: 3.37, ...D[24] },
   { row: 25, theme: 'dark', check: 'alert-tinted-text', recorded: 4.16, ...D[25] },
   { row: 26, theme: 'dark', check: 'alert-plain-title', recorded: 3.9, ...D[26] },
+  { row: 26, theme: 'dark', check: 'stepper-current-number', recorded: 3.33, ...D[26] },
   { row: 27, theme: 'light', check: 'progress-fill', recorded: 2.45, ...D[27] },
   { row: 27, theme: 'dark', check: 'progress-fill', recorded: 1.74, ...D[27] },
   { row: 28, theme: 'light', check: 'progress-glow-fill', recorded: 1.62, ...D[28] },
   { row: 28, theme: 'dark', check: 'progress-glow-fill', recorded: 1.74, ...D[28] },
   { row: 29, theme: 'light', check: 'accent-text-on-surface', recorded: 3.95, ...D[29] },
   { row: 29, theme: 'dark', check: 'accent-text-on-surface', recorded: 4.44, ...D[29] },
+  { row: 30, theme: 'light', check: 'stepper-ring', recorded: 2.63, ...D[30] },
+  { row: 30, theme: 'dark', check: 'stepper-ring', recorded: 2.63, ...D[30] },
+  { row: 31, theme: 'light', check: 'current-edge', recorded: 2.61, ...D[31] },
+  { row: 31, theme: 'dark', check: 'current-edge', recorded: 2.01, ...D[31] },
 ];
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index 9085d14..e092527 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -67,6 +67,10 @@ export const CHECKS = {
   'progress-fill': 3,
   'progress-glow-fill': 3,
   'accent-text-on-surface': 4.5,
+  'stepper-ring': 3,
+  'stepper-current-number': 4.5,
+  'stepper-done-mark': 3,
+  'current-edge': 3,
 } as const;
 export type CheckId = keyof typeof CHECKS;
 const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
@@ -338,6 +342,29 @@ export function measure(
           ...(lit ? [contrastRatio(composite([255, 255, 255, 0.24], fill), progressTrack)] : []),
         ]),
       );
+    // A Stepper (stepper.css). The dot of the current step is control-bg in the `circles` look, and in
+    // the `compact` look it sits in a pill of selected-bg; contrast-more fills that pill with the solid
+    // accent and swaps the colours of the dot (preferences.css). The dot of a done step is the solid
+    // accent with the on-accent check (`circles`) or the accent wash with an accent check (`compact`).
+    const dotsInPill =
+      mode === 'contrast-more'
+        ? []
+        : paintStops(resolveToken(t, 'selected-bg')).map((stop) =>
+            composite(color('control-bg'), composite(stop, surface)),
+          );
+    const stepperNumber = Math.min(
+      contrastRatio(composite(color('accent-text'), control), control),
+      ...dotsInPill.map((dot) => contrastRatio(composite(color('accent-text'), dot), dot)),
+      ...(mode === 'contrast-more' ? [onPaint('selected-bg', 'selected-text')] : []),
+    );
+    const accentSolid = composite(color('accent-solid'), surface);
+    const stepperDone = Math.min(
+      contrastRatio(composite(color('on-accent'), accentSolid), accentSolid),
+      ...paintStops(resolveToken(t, 'accent-subtle')).map((stop) => {
+        const dot = composite(stop, surface);
+        return contrastRatio(composite(color('accent-text'), dot), dot);
+      }),
+    );
     const measured: Omit<Record<CheckId, number>, OverlayCheck> = {
       text: onSurface('text'),
       'text-muted': onSurface('text-muted'),
@@ -483,6 +510,22 @@ export function measure(
       'progress-glow-fill': progressWorst(mode !== 'contrast-more'),
       // The value of a `glow` Progress, in the accent text colour on the surface it sits on.
       'accent-text-on-surface': onSurface('accent-text'),
+      // The ring of a step not reached yet, against the surface.
+      'stepper-ring': paintOnSurface('stepper-ring'),
+      'stepper-current-number': stepperNumber,
+      'stepper-done-mark': stepperDone,
+      // The accent line on the accent wash: the edge of the current dot of a `compact` Stepper (and
+      // the bar of the current row of an `inset` List). Contrast-more draws it in the text colour of
+      // the wash, which is the solid accent there (preferences.css).
+      'current-edge':
+        mode === 'contrast-more'
+          ? onPaint('selected-text', 'selected-bg')
+          : Math.min(
+              ...paintStops(resolveToken(t, 'selected-bg')).map((stop) => {
+                const wash = composite(stop, surface);
+                return contrastRatio(composite(color('accent-solid'), wash), wash);
+              }),
+            ),
     };
     for (const id of SURFACE_CHECK_IDS) lowest[id] = Math.min(lowest[id], measured[id]);
   }
diff --git a/scripts/rsc-probe.mjs b/scripts/rsc-probe.mjs
index 98e17c8..7477667 100644
--- a/scripts/rsc-probe.mjs
+++ b/scripts/rsc-probe.mjs
@@ -180,6 +180,26 @@ const CASES = [
     element: (C) => createElement(C, { lines: 2 }),
     expect: { type: 'span', className: 'flg-skeleton-text' },
   },
+  // A Stepper that only shows (no onValueChange): the Steps are read from its children without being
+  // rendered, which is what lets it run in a Server Component.
+  ...['circles', 'compact', 'bars'].map((variant) => ({
+    label: `Stepper ${variant}, display only`,
+    file: '../dist/components/stepper/Stepper.js',
+    exportName: 'Stepper',
+    element: async (C) => {
+      const { Step } = await import(
+        new URL('../dist/components/stepper/Stepper.js', import.meta.url)
+      );
+      return createElement(
+        C,
+        { value: 1, variant },
+        createElement(Step, { title: 'Cart', description: '3 items' }),
+        createElement(Step, { title: 'Delivery', status: 'error' }),
+        createElement(Step, { title: 'Payment' }),
+      );
+    },
+    expect: { type: 'ol', className: 'flg-stepper' },
+  })),
 ];
 
 let failed = 0;
diff --git a/src/components/stepper/Stepper.mdx b/src/components/stepper/Stepper.mdx
new file mode 100644
index 0000000..a549479
--- /dev/null
+++ b/src/components/stepper/Stepper.mdx
@@ -0,0 +1,194 @@
+import { Canvas, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './Stepper.stories';
+
+<Meta of={Stories} />
+
+# Stepper
+
+The steps of a process, such as a checkout or a setup wizard, with the one the person is on marked.
+It does not hold the content of a step: you render that yourself from `value`, so you always know
+where the process is.
+
+```tsx
+import { Step, Stepper } from 'h2d-glass-ui';
+
+<Stepper value={1}>
+  <Step title="Cart" />
+  <Step title="Delivery" />
+  <Step title="Payment" />
+  <Step title="Confirm" />
+</Stepper>;
+```
+
+<Canvas of={Stories.Circles} />
+
+## Props
+
+### Stepper
+
+| Prop            | Type                               | Default        | Does                                                                                     |
+| --------------- | ---------------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
+| `value`         | `number`                           | required       | The index, from 0, of the current step. The number of steps means every step is done     |
+| `onValueChange` | `(index: number) => void`          | none           | Makes the steps that can be pressed buttons, and is called with the one that was pressed |
+| `linear`        | `boolean`                          | `true`         | Keeps a step ahead of the current one out of reach; `false` lets any step be pressed     |
+| `orientation`   | `'horizontal' \| 'vertical'`       | `'horizontal'` | The direction of the steps                                                               |
+| `variant`       | `'circles' \| 'compact' \| 'bars'` | `'circles'`    | The look (see Variants)                                                                  |
+| `labels`        | `Partial<StepperLabels>`           | English        | The words read to a screen reader, and the line above a step in `bars`                   |
+
+`ref`, `className`, `style` and the other attributes of an `ol` go to the list. There is no
+`defaultValue`: a Stepper is always controlled.
+
+### Step
+
+| Prop                 | Type                      | Does                                                                                                  |
+| -------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------- |
+| `title`              | `ReactNode`               | The name of the step                                                                                  |
+| `description`        | `ReactNode`               | A line under the name; left out when it renders nothing                                               |
+| `status`             | `'complete' \| 'error'`   | Wins over the place of the step: `error` for a step that failed, `complete` for one done out of order |
+| `className`, `style` | `string`, `CSSProperties` | Go to the `li` of the step                                                                            |
+
+A `Step` is never rendered on its own, so it takes no `ref`; the Stepper reads it and renders the
+`li`.
+
+`labels` has `step` (`(n, total) => "Step 2 of 4"`), `caption` (`(n) => "Step 2"`, the line above
+the name in `bars`), `completed`, `current`, `notStarted` and `error`. A key given as `undefined`
+keeps its English default.
+
+A `value` that is not a whole number from 0 to the number of steps is rounded into that range (`NaN`
+counts as 0) and warned about in development. So is a Stepper with no steps, a child that is not a
+`Step`, and `linear={false}` without `onValueChange`.
+
+## Variants
+
+- `variant="circles"` (default): a 30px dot with the number, and the name under it. The dots are
+  joined by a line that is filled in as the steps are done. Familiar and even; each step needs a
+  column wide enough for its name.
+- `variant="compact"`: a 22px dot with the name beside it, the lines stretching to fill the row, and
+  the current step in a pill. The lowest of the three, and the current step stands out most; a long
+  name makes the lines shorter, to 12px.
+- `variant="bars"`: a 6px bar for each step and no dot, with a line "Step 1" above the name. It reads
+  as a progress bar cut into parts: done bars are full, the current one is half full.
+
+<Canvas of={Stories.Compact} />
+<Canvas of={Stories.Bars} />
+
+## Showing what the step holds
+
+The Stepper draws the line of steps and nothing else. Render the content of the step that is current
+from the same `value`:
+
+```tsx
+'use client';
+
+import { useState } from 'react';
+import { Step, Stepper } from 'h2d-glass-ui';
+
+export function Checkout() {
+  const [value, setValue] = useState(0);
+  return (
+    <>
+      <Stepper value={value} onValueChange={setValue}>
+        <Step title="Cart" />
+        <Step title="Delivery" />
+        <Step title="Payment" />
+      </Stepper>
+      {value === 0 ? <CartForm onDone={() => setValue(1)} /> : null}
+      {value === 1 ? <DeliveryForm onDone={() => setValue(2)} /> : null}
+      {value === 2 ? <PaymentForm /> : null}
+    </>
+  );
+}
+```
+
+## Going back
+
+With an `onValueChange` the steps that can be pressed are buttons: the steps done, the current one,
+and a step whose `status` is `complete`. With `linear={false}` every step is a button. Pressing a step
+other than the current one calls `onValueChange(index)`; the current step is a button too, so that
+the focus stays on a step after it becomes the current one, and pressing it calls nothing.
+
+Without `onValueChange` the Stepper only shows where the process is, and has no buttons.
+
+Tab goes through the buttons in the order of the page, and Enter and Space press one. The arrow keys
+do nothing: a Stepper has few steps, and each one is an action of its own.
+
+## Write the Steps where the Stepper is
+
+The Stepper reads its `Step` elements from `children`; it never renders them. That works when the
+`Step`s are written in the same component that renders the Stepper, and it does not work when a
+Server Component passes them into a client component:
+
+```tsx
+// Right: the client component writes its own Steps.
+'use client';
+export function Wizard() {
+  const [value, setValue] = useState(0);
+  return (
+    <Stepper value={value} onValueChange={setValue}>
+      <Step title="Cart" />
+      <Step title="Delivery" />
+    </Stepper>
+  );
+}
+```
+
+```tsx
+// Wrong: this page is a Server Component. It renders each <Step> on the server, where it is
+// nothing, and hands the result to the client component.
+export default function Page() {
+  return (
+    <Wizard>
+      <Step title="Cart" />
+      <Step title="Delivery" />
+    </Wizard>
+  );
+}
+// where Wizard renders <Stepper value={value} onValueChange={setValue}>{children}</Stepper>
+```
+
+In the wrong case the Stepper finds no steps. In development it says so:
+
+- `<Step> rendered outside <Stepper>. Write the Steps in the same component that renders the
+Stepper: Steps passed from a Server Component into a client component arrive already rendered, and
+the Stepper cannot read them.`
+- `<Stepper> has no steps. Its children must be <Step> elements written in the component that
+renders the Stepper (not passed in from a Server Component).`
+
+A Stepper that only shows (no `onValueChange`) can be written directly in a Server Component, since
+it needs no function.
+
+## Narrow
+
+A horizontal Stepper that is under 480px wide keeps the words of the current step and of a step that
+failed, and hides the others from sight: `circles` and `compact` are left with the dots, `bars` with
+the bars. The hidden words are still read by a screen reader. It is a container query on the Stepper
+itself, so the HTML from the server is already right and no script measures anything.
+
+A horizontal Stepper is as wide as its container. Put it in a parent that shrinks to its content and
+it shrinks to nothing; give the parent a width.
+
+<Canvas of={Stories.Narrow} />
+
+## Accessibility
+
+- It is an ordered list. Each step reads as "Step 2 of 4: Delivery, Home delivery, 2–3 days,
+  Completed": the number, the name, the description and the state are text, hidden from sight, and the
+  dot, the bar and the line "Step 2" are hidden from screen readers since they say the same.
+- `aria-current="step"` is on the button of the current step when it has one, and on the `li` when it
+  does not. A screen reader reads it only from the element that has the focus.
+- The ring of a step not reached yet is 2.63:1 against its surface in both themes, and the number
+  of the current step is 3.33:1 in dark in the `compact` look (rows 26, 30 and 31 of the table on the
+  Accessibility page). With `prefers-contrast: more` the ring is solid and the current pill is the
+  solid accent, and they all meet AA.
+- In forced colours the dots and bars take system colours: a ring in the text colour for a step not
+  reached, the selection colour for a step done, a ring in the selection colour for the current one
+  and the text colour filled for one that failed. The mark inside and the hidden words say the state
+  as well.
+
+## Do and don't
+
+- Do write the `Step`s in the component that renders the `Stepper`.
+- Do render the content of the step from `value`.
+- Do give a long process a `description` under the steps in a vertical Stepper.
+- Don't use it for tabs that switch content the person can visit in any order; use `Tabs`.
+- Don't put more steps than fit the width in a horizontal one; use the vertical form.
diff --git a/src/components/stepper/Stepper.tsx b/src/components/stepper/Stepper.tsx
new file mode 100644
index 0000000..393cadb
--- /dev/null
+++ b/src/components/stepper/Stepper.tsx
@@ -0,0 +1,213 @@
+import { clsx } from 'clsx';
+import { forwardRef } from 'react';
+import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
+import { collectChildren, markPart } from '../../internal/collect-children';
+import { hasContent } from '../../internal/has-content';
+import { BoxCheckIcon, ExclamationIcon } from '../../internal/icons';
+import { clamp } from '../../internal/number';
+import { devWarn } from '../../internal/warn';
+import { withDefaults } from '../../internal/with-defaults';
+import { stepStates } from './step-states';
+import type { StepState, StepStatus } from './step-states';
+
+export type StepperVariant = 'circles' | 'compact' | 'bars';
+
+/** The words a Stepper says to a screen reader; translate them here. */
+export interface StepperLabels {
+  /** The place of a step, said before its title: "Step 2 of 4". */
+  step: (n: number, total: number) => string;
+  /** The line above the title in the `bars` look, which is seen: "Step 2". */
+  caption: (n: number) => string;
+  completed: string;
+  current: string;
+  notStarted: string;
+  error: string;
+}
+
+export type StepperProps = Omit<HTMLAttributes<HTMLOListElement>, 'onChange' | 'children'> & {
+  /**
+   * The index (from 0) of the current step. A number equal to the number of steps means every step
+   * is done. There is no uncontrolled form: the content of each step is yours, so you hold this.
+   */
+  value: number;
+  /**
+   * Called with the index of the step the user presses. Giving it makes the steps that can be
+   * pressed buttons; pressing the current step calls nothing.
+   */
+  onValueChange?: (index: number) => void;
+  /** Whether a step ahead of the current one stays out of reach. Default `true`. */
+  linear?: boolean;
+  orientation?: 'horizontal' | 'vertical';
+  variant?: StepperVariant;
+  /** Default English words; any of them can be replaced. */
+  labels?: Partial<StepperLabels>;
+  /** `Step` elements, written in the component that renders the Stepper. */
+  children: ReactNode;
+};
+
+export type StepProps = {
+  title: ReactNode;
+  description?: ReactNode;
+  /** Wins over the place of the step: `error`, or `complete` for a step done out of order. */
+  status?: StepStatus;
+  /** On the `<li>` of the step. */
+  className?: string;
+  style?: CSSProperties;
+};
+
+const DEFAULT_LABELS: StepperLabels = {
+  step: (n, total) => `Step ${n} of ${total}`,
+  caption: (n) => `Step ${n}`,
+  completed: 'Completed',
+  current: 'Current',
+  notStarted: 'Not started',
+  error: 'Error',
+};
+
+/** The word for each state, read after the description. */
+const STATE_LABELS = {
+  complete: 'completed',
+  current: 'current',
+  upcoming: 'notStarted',
+  error: 'error',
+} as const satisfies Record<StepState, keyof StepperLabels>;
+
+/**
+ * The steps of a process, in one of three looks, horizontal or vertical. `value` says where the
+ * process is; the content of each step is the caller's. The Steps are read from `children` without
+ * rendering them, and the Stepper has no state and no hook, so it renders in a Server Component.
+ * Write the Steps in the component that renders the Stepper: Steps handed to a client component by a
+ * Server Component arrive already rendered, and cannot be read.
+ */
+export const Stepper = forwardRef<HTMLOListElement, StepperProps>(function Stepper(
+  {
+    value,
+    onValueChange,
+    linear = true,
+    orientation = 'horizontal',
+    variant = 'circles',
+    labels,
+    className,
+    children,
+    ...props
+  },
+  ref,
+) {
+  const words = withDefaults(DEFAULT_LABELS, labels);
+  const steps = collectChildren(children, {
+    parts: ['step'],
+    onUnknown: () => devWarn('<Stepper> has a child that is not a <Step>; it is left out.'),
+  });
+  const count = steps.length;
+  if (count === 0) {
+    devWarn(
+      '<Stepper> has no steps. Its children must be <Step> elements written in the component that renders the Stepper (not passed in from a Server Component).',
+    );
+  }
+  // `NaN` is the first step; infinities clamp like any other number. The warning leaves the value
+  // out of its text, so that `devWarn` can dedupe it.
+  const rounded = Math.round(value);
+  const current = Number.isNaN(rounded) ? 0 : clamp(rounded, 0, count);
+  if (current !== value) {
+    devWarn(
+      '<Stepper> value must be a whole number from 0 to the number of steps; it was rounded into that range.',
+    );
+  }
+  if (!linear && !onValueChange) {
+    devWarn('<Stepper> linear={false} has no effect without onValueChange.');
+  }
+  const states = stepStates({
+    count,
+    value: current,
+    statuses: steps.map((step) => (step.props as StepProps).status),
+    linear,
+    interactive: onValueChange !== undefined,
+  });
+  return (
+    <ol
+      ref={ref}
+      className={clsx('flg-stepper', className)}
+      data-variant={variant}
+      data-orientation={orientation}
+      {...props}
+    >
+      {steps.map((step, index) => {
+        const { title, description, className: stepClass, style } = step.props as StepProps;
+        const { state, clickable } = states[index]!;
+        const isCurrent = index === current;
+        // A screen reader reads `aria-current` only from the element that has the focus, so the
+        // attribute is on the button when there is one, and on the <li> when there is not.
+        const currentMark = isCurrent ? ({ 'aria-current': 'step' } as const) : undefined;
+        const mark =
+          variant === 'bars' ? (
+            <span className="flg-step-bar" aria-hidden="true" />
+          ) : (
+            <span className="flg-step-indicator" aria-hidden="true">
+              {state === 'complete' ? <BoxCheckIcon /> : null}
+              {state === 'error' ? <ExclamationIcon /> : null}
+              {state === 'upcoming' || state === 'current' ? index + 1 : null}
+            </span>
+          );
+        const text = (
+          <span className="flg-step-text">
+            <span className="flg-visually-hidden">{`${words.step(index + 1, count)}: `}</span>
+            {variant === 'bars' ? (
+              <span className="flg-step-caption" aria-hidden="true">
+                {state === 'complete' ? <BoxCheckIcon /> : null}
+                {state === 'error' ? <ExclamationIcon /> : null}
+                {words.caption(index + 1)}
+              </span>
+            ) : null}
+            <span className="flg-step-title">{title}</span>
+            {hasContent(description) ? (
+              <>
+                {/* So that a step reads "Delivery, Home delivery"; it takes no room in the column. */}
+                <span className="flg-visually-hidden">, </span>
+                <span className="flg-step-description">{description}</span>
+              </>
+            ) : null}
+            <span className="flg-visually-hidden">{`, ${words[STATE_LABELS[state]]}`}</span>
+          </span>
+        );
+        return (
+          <li
+            key={step.key ?? index}
+            className={clsx('flg-step', stepClass)}
+            style={style}
+            data-state={state}
+            {...(clickable ? undefined : currentMark)}
+          >
+            {clickable ? (
+              <button
+                type="button"
+                className="flg-step-inner"
+                onClick={isCurrent ? undefined : () => onValueChange?.(index)}
+                {...currentMark}
+              >
+                {mark}
+                {text}
+              </button>
+            ) : (
+              <span className="flg-step-inner">
+                {mark}
+                {text}
+              </span>
+            )}
+          </li>
+        );
+      })}
+    </ol>
+  );
+});
+
+/**
+ * One step of a Stepper. Read by the Stepper and never rendered on its own, so it takes no `ref`;
+ * rendered anywhere else it renders nothing and says why.
+ */
+export const Step = markPart(function Step(props: StepProps): null {
+  void props;
+  devWarn(
+    '<Step> rendered outside <Stepper>. Write the Steps in the same component that renders the Stepper: Steps passed from a Server Component into a client component arrive already rendered, and the Stepper cannot read them.',
+  );
+  return null;
+}, 'step');
diff --git a/src/components/stepper/index.ts b/src/components/stepper/index.ts
new file mode 100644
index 0000000..9d3d001
--- /dev/null
+++ b/src/components/stepper/index.ts
@@ -0,0 +1,2 @@
+export { Step, Stepper } from './Stepper';
+export type { StepProps, StepperLabels, StepperProps, StepperVariant } from './Stepper';
diff --git a/src/components/stepper/step-states.ts b/src/components/stepper/step-states.ts
new file mode 100644
index 0000000..27ea47d
--- /dev/null
+++ b/src/components/stepper/step-states.ts
@@ -0,0 +1,45 @@
+/** What a step can be: the three that `value` gives, and the error that only a `status` sets. */
+export type StepState = 'complete' | 'current' | 'upcoming' | 'error';
+/** What the author of a `Step` can say about it, which wins over the place of the step. */
+export type StepStatus = 'complete' | 'error';
+
+export interface StepStatesInput {
+  /** How many steps there are. */
+  count: number;
+  /** The index of the current step, a whole number from 0 to `count`. */
+  value: number;
+  /** The `status` of each step, by index; a missing entry is no status. */
+  statuses: ReadonlyArray<StepStatus | undefined>;
+  linear: boolean;
+  /** Whether the Stepper has an `onValueChange`, which is what makes a step something to press. */
+  interactive: boolean;
+}
+
+export interface StepInfo {
+  state: StepState;
+  clickable: boolean;
+}
+
+/**
+ * The state of every step and whether it is pressable (spec phase 4 §5). A `status` wins; without
+ * one the steps before `value` are done, the one at it is current and the rest are ahead. A step is
+ * pressable when the Stepper is interactive and it is not ahead of the current step, unless the
+ * Stepper is not `linear` or the step says it is complete.
+ */
+export function stepStates({
+  count,
+  value,
+  statuses,
+  linear,
+  interactive,
+}: StepStatesInput): StepInfo[] {
+  return Array.from({ length: count }, (_, index) => {
+    const status = statuses[index];
+    const state: StepState =
+      status ?? (index < value ? 'complete' : index === value ? 'current' : 'upcoming');
+    return {
+      state,
+      clickable: interactive && (!linear || index <= value || status === 'complete'),
+    };
+  });
+}
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index 79bbb8e..7379f58 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -61,8 +61,8 @@ application's responsibility.
   surroundings are inert. Changes your code makes to `value` are not announced.
 
 The contrast gaps of the Slider (rows 15 to 17), Calendar (row 18), FileUpload (rows 19 to 22),
-Alert (rows 23 to 26) and Progress (rows 27 to 29) are in the table above, which is built from the
-same data CI checks.
+Alert (rows 23 to 26), Progress (rows 27 to 29) and Stepper (rows 30 and 31, and its part in rows 26,
+27 and 29) are in the table above, which is built from the same data CI checks.
 
 ## A `<dialog>` the library did not create
 
diff --git a/src/index.ts b/src/index.ts
index c5ee662..a0ec07f 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -221,6 +221,8 @@ export type {
   SkeletonTextProps,
   SkeletonVariant,
 } from './components/skeleton';
+export { Step, Stepper } from './components/stepper';
+export type { StepProps, StepperLabels, StepperProps, StepperVariant } from './components/stepper';
 export { Toaster, toast } from './components/toast';
 export type {
   ToastAction,
diff --git a/src/internal/icons.tsx b/src/internal/icons.tsx
index f993653..a150d72 100644
--- a/src/internal/icons.tsx
+++ b/src/internal/icons.tsx
@@ -67,6 +67,15 @@ export const STATUS_WORDS: Readonly<Record<StatusIconStatus, string>> = {
   error: 'Error',
 };
 
+/** The "!" inside the mark of a Stepper step that failed, in a 12px box. */
+export function ExclamationIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} viewBox="0 0 12 12" {...props}>
+      <path d="M6 2.75v3.75M6 9.25h.01" />
+    </svg>
+  );
+}
+
 export type ChevronDirection = 'down' | 'up' | 'left' | 'right';
 
 const CHEVRON_PATHS: Record<ChevronDirection, string> = {
diff --git a/src/styles/components/stepper.css b/src/styles/components/stepper.css
new file mode 100644
index 0000000..c27bd42
--- /dev/null
+++ b/src/styles/components/stepper.css
@@ -0,0 +1,456 @@
+/* Stepper (spec phase 4 §4.3 Stepper, mockup St1-St3): the steps of a process, in three looks and two
+   directions. The parts at the top are shared; each look writes only what differs, and the vertical
+   form of each follows its horizontal one. The looks read `data-state` of the <li>, not
+   `aria-current`, which sits on the button when the step has one. Only the hover reads it: a failed
+   step can be the current one, and `data-state` then says `error`. The narrow form is a container
+   query, so the HTML from the server is already right; only a horizontal Stepper is a container
+   (spec §3.5). */
+@layer flg.components {
+  .flg-stepper {
+    /* The line that has not been walked yet is decoration, so it is a colour of its own and not a
+       token (spec §4.2). */
+    --flg-step-line: color-mix(in srgb, var(--flg-text-muted) 45%, transparent);
+    margin: 0;
+    padding: 0;
+    list-style: none;
+    color: var(--flg-text);
+    font-family: var(--flg-font-sans);
+    font-size: var(--flg-text-sm);
+  }
+  /* A container sizes itself from outside, never from its content, so in a flex row it would shrink
+     to nothing: it fills the row instead, as it does in a block. Named, so that a vertical Stepper
+     inside a container of the user's is not taken for one. */
+  .flg-stepper[data-orientation='horizontal'] {
+    container: flg-stepper / inline-size;
+    width: 100%;
+  }
+  .flg-step {
+    position: relative;
+    min-width: 0;
+  }
+
+  /* The inside of a step is a <button> when the step can be pressed and a <span> when it cannot. */
+  .flg-step-inner {
+    appearance: none;
+    margin: 0;
+    padding: 0;
+    border: 0;
+    background: none;
+    color: inherit;
+    font: inherit;
+    text-align: inherit;
+  }
+  button.flg-step-inner {
+    cursor: pointer;
+  }
+  .flg-step-inner:focus-visible {
+    outline: 2px solid var(--flg-focus-outline-color);
+    outline-offset: 2px;
+    box-shadow: var(--flg-focus-ring);
+  }
+  /* Outside the mockup, which shows no hover: a step that can be pressed, and is not the current
+     one, reacts as a ghost button does. Nothing else marks a step as pressable. */
+  @media (hover: hover) {
+    .flg-step-inner:is(button):not([aria-current]):hover {
+      background: var(--flg-control-track);
+    }
+  }
+
+  .flg-step-text {
+    display: flex;
+    flex-direction: column;
+    min-width: 0;
+  }
+  .flg-step-title {
+    font-size: var(--flg-text-sm);
+    font-weight: var(--flg-weight-medium);
+    line-height: 1.3;
+    color: var(--flg-text);
+  }
+  .flg-step-description {
+    font-size: var(--flg-text-xs);
+    line-height: 1.35;
+    color: var(--flg-text-muted);
+  }
+  .flg-step[data-state='current'] .flg-step-title {
+    font-weight: var(--flg-weight-semibold);
+  }
+  .flg-step[data-state='upcoming'] .flg-step-title {
+    font-weight: var(--flg-weight-regular);
+    color: var(--flg-text-muted);
+  }
+  .flg-step[data-state='error'] .flg-step-title,
+  .flg-step[data-state='error'] .flg-step-description {
+    color: var(--flg-danger);
+  }
+  .flg-step[data-state='error'] .flg-step-title {
+    font-weight: var(--flg-weight-semibold);
+  }
+
+  /* The dot of `circles` and `compact`: a number, or the mark of a step that is done or failed. */
+  .flg-step-indicator {
+    box-sizing: border-box;
+    flex: none;
+    display: inline-flex;
+    align-items: center;
+    justify-content: center;
+    border-radius: 50%;
+    border: 1.5px solid var(--flg-stepper-ring);
+    color: var(--flg-text-muted);
+    font-weight: var(--flg-weight-semibold);
+    line-height: 1;
+    font-variant-numeric: tabular-nums;
+  }
+
+  /* ---- circles (St1): a 30px dot with the name under it ---- */
+  .flg-stepper[data-variant='circles'][data-orientation='horizontal'] {
+    display: grid;
+    grid-auto-flow: column;
+    grid-auto-columns: minmax(0, 1fr);
+  }
+  .flg-stepper[data-variant='circles'][data-orientation='vertical'] {
+    display: flex;
+    flex-direction: column;
+  }
+  .flg-stepper[data-variant='circles'] .flg-step {
+    display: flex;
+    justify-content: center;
+  }
+  /* The line before a step runs from the dot of the step before to its own, 7px short of each. */
+  .flg-stepper[data-variant='circles'][data-orientation='horizontal']
+    .flg-step
+    + .flg-step::before {
+    content: '';
+    position: absolute;
+    top: 18px;
+    left: calc(-50% + 22px);
+    right: calc(50% + 22px);
+    height: 2px;
+    border-radius: 2px;
+    background: var(--flg-step-line);
+  }
+  .flg-stepper[data-variant='circles'][data-orientation='horizontal']
+    .flg-step[data-state='complete']
+    + .flg-step::before {
+    background: var(--flg-accent-solid);
+  }
+  .flg-stepper[data-variant='circles'] .flg-step-inner {
+    display: flex;
+    flex-direction: column;
+    align-items: center;
+    gap: 6px;
+    min-width: 0;
+    padding: 4px 8px;
+    border-radius: var(--flg-radius-md);
+    text-align: center;
+  }
+  .flg-stepper[data-variant='circles'] .flg-step-text {
+    gap: 2px;
+  }
+  .flg-stepper[data-variant='circles'] .flg-step-indicator {
+    width: 30px;
+    height: 30px;
+    font-size: var(--flg-text-sm);
+  }
+  .flg-stepper[data-variant='circles'] .flg-step-indicator > svg {
+    width: 14px;
+    height: 14px;
+  }
+  .flg-stepper[data-variant='circles'] .flg-step[data-state='complete'] .flg-step-indicator {
+    background: var(--flg-accent-solid);
+    border-color: transparent;
+    color: var(--flg-on-accent);
+  }
+  .flg-stepper[data-variant='circles'] .flg-step[data-state='current'] .flg-step-indicator {
+    background: var(--flg-control-bg);
+    border: 2px solid var(--flg-accent-solid);
+    color: var(--flg-accent-text);
+    box-shadow: 0 0 0 4px color-mix(in srgb, var(--flg-accent-solid) 18%, transparent);
+  }
+  .flg-stepper[data-variant='circles'] .flg-step[data-state='error'] .flg-step-indicator {
+    background: var(--flg-danger-fill);
+    border-color: transparent;
+    color: var(--flg-on-danger);
+    box-shadow: 0 0 0 4px color-mix(in srgb, var(--flg-danger) 16%, transparent);
+  }
+  .flg-stepper[data-variant='circles'][data-orientation='vertical'] .flg-step {
+    justify-content: flex-start;
+    padding-bottom: 22px;
+  }
+  .flg-stepper[data-variant='circles'][data-orientation='vertical'] .flg-step:last-child {
+    padding-bottom: 0;
+  }
+  .flg-stepper[data-variant='circles'][data-orientation='vertical']
+    .flg-step:not(:last-child)::after {
+    content: '';
+    position: absolute;
+    left: 14px;
+    top: 34px;
+    bottom: 4px;
+    width: 2px;
+    border-radius: 2px;
+    background: var(--flg-step-line);
+  }
+  .flg-stepper[data-variant='circles'][data-orientation='vertical']
+    .flg-step[data-state='complete']::after {
+    background: var(--flg-accent-solid);
+  }
+  .flg-stepper[data-variant='circles'][data-orientation='vertical'] .flg-step-inner {
+    flex-direction: row;
+    align-items: flex-start;
+    gap: 12px;
+    padding: 0;
+    text-align: left;
+  }
+  .flg-stepper[data-variant='circles'][data-orientation='vertical'] .flg-step-text {
+    padding-top: 6px;
+  }
+
+  /* ---- compact (St2): a 22px dot with the name beside it, the current step in a pill ---- */
+  .flg-stepper[data-variant='compact'][data-orientation='horizontal'] {
+    display: flex;
+    align-items: center;
+  }
+  .flg-stepper[data-variant='compact'][data-orientation='horizontal'] .flg-step {
+    display: flex;
+    align-items: center;
+  }
+  .flg-stepper[data-variant='compact'][data-orientation='horizontal'] .flg-step:not(:last-child) {
+    flex: 1 1 auto;
+  }
+  /* The line stretches to fill what the names leave; a long name makes it shorter, to 12px. */
+  .flg-stepper[data-variant='compact'][data-orientation='horizontal']
+    .flg-step:not(:last-child)::after {
+    content: '';
+    flex: 1;
+    min-width: 12px;
+    height: 2px;
+    margin: 0 6px;
+    border-radius: 2px;
+    background: var(--flg-step-line);
+  }
+  .flg-stepper[data-variant='compact'][data-orientation='horizontal']
+    .flg-step[data-state='complete']::after {
+    background: var(--flg-accent-solid);
+  }
+  .flg-stepper[data-variant='compact'] .flg-step-inner {
+    display: inline-flex;
+    align-items: center;
+    gap: 8px;
+    padding: 4px 12px 4px 4px;
+    border-radius: var(--flg-radius-full);
+    white-space: nowrap;
+  }
+  .flg-stepper[data-variant='compact'] .flg-step[data-state='current'] > .flg-step-inner {
+    background: var(--flg-selected-bg);
+  }
+  .flg-stepper[data-variant='compact'] .flg-step[data-state='error'] > .flg-step-inner {
+    background: var(--flg-highlight-danger-bg);
+  }
+  .flg-stepper[data-variant='compact'] .flg-step-indicator {
+    width: 22px;
+    height: 22px;
+    font-size: var(--flg-text-xs);
+  }
+  .flg-stepper[data-variant='compact'] .flg-step-indicator > svg {
+    width: 12px;
+    height: 12px;
+  }
+  .flg-stepper[data-variant='compact'] .flg-step[data-state='complete'] .flg-step-indicator {
+    background: var(--flg-accent-subtle);
+    border-color: transparent;
+    color: var(--flg-accent-text);
+  }
+  .flg-stepper[data-variant='compact'] .flg-step[data-state='current'] .flg-step-indicator {
+    background: var(--flg-control-bg);
+    border: 2px solid var(--flg-accent-solid);
+    color: var(--flg-accent-text);
+  }
+  .flg-stepper[data-variant='compact'] .flg-step[data-state='error'] .flg-step-indicator {
+    background: var(--flg-danger-fill);
+    border-color: transparent;
+    color: var(--flg-on-danger);
+  }
+  .flg-stepper[data-variant='compact'] .flg-step-text {
+    gap: 1px;
+  }
+  .flg-stepper[data-variant='compact'] .flg-step[data-state='current'] .flg-step-title {
+    color: var(--flg-selected-text);
+  }
+  /* The failed step reads in the text colour of its pill, which is the same red as the mockup's by
+     default and turns to the colour on a solid red under contrast-more. */
+  .flg-stepper[data-variant='compact'] .flg-step[data-state='error'] .flg-step-title,
+  .flg-stepper[data-variant='compact'] .flg-step[data-state='error'] .flg-step-description {
+    color: var(--flg-highlight-danger-text);
+  }
+  .flg-stepper[data-variant='compact'][data-orientation='vertical'] {
+    display: flex;
+    flex-direction: column;
+    align-items: stretch;
+  }
+  .flg-stepper[data-variant='compact'][data-orientation='vertical'] .flg-step {
+    padding-bottom: 12px;
+  }
+  .flg-stepper[data-variant='compact'][data-orientation='vertical'] .flg-step:last-child {
+    padding-bottom: 0;
+  }
+  .flg-stepper[data-variant='compact'][data-orientation='vertical']
+    .flg-step:not(:last-child)::after {
+    content: '';
+    position: absolute;
+    left: 14px;
+    top: 30px;
+    bottom: -2px;
+    width: 2px;
+    border-radius: 2px;
+    background: var(--flg-step-line);
+  }
+  .flg-stepper[data-variant='compact'][data-orientation='vertical']
+    .flg-step[data-state='complete']::after {
+    background: var(--flg-accent-solid);
+  }
+  /* A button does not stretch to its row as a <span> that is a flex box does. */
+  .flg-stepper[data-variant='compact'][data-orientation='vertical'] .flg-step-inner {
+    box-sizing: border-box;
+    display: flex;
+    align-items: flex-start;
+    width: 100%;
+    border-radius: var(--flg-radius-lg);
+    white-space: normal;
+  }
+  .flg-stepper[data-variant='compact'][data-orientation='vertical'] .flg-step-text {
+    padding: 3px 0 2px;
+  }
+
+  /* ---- bars (St3): a 6px bar per step and no dot ---- */
+  .flg-stepper[data-variant='bars'][data-orientation='horizontal'] {
+    display: grid;
+    grid-auto-flow: column;
+    grid-auto-columns: minmax(0, 1fr);
+    gap: 8px;
+  }
+  .flg-stepper[data-variant='bars'][data-orientation='vertical'] {
+    display: flex;
+    flex-direction: column;
+    gap: 6px;
+  }
+  .flg-stepper[data-variant='bars'] .flg-step {
+    display: flex;
+  }
+  /* The focus and the hover reach 6px beyond the bar on each side. */
+  .flg-stepper[data-variant='bars'] .flg-step-inner {
+    box-sizing: content-box;
+    display: flex;
+    flex-direction: column;
+    gap: 8px;
+    width: 100%;
+    min-width: 0;
+    padding: 6px;
+    margin: -6px;
+    border-radius: var(--flg-radius-md);
+  }
+  .flg-stepper[data-variant='bars'] .flg-step-bar {
+    display: block;
+    height: 6px;
+    border-radius: var(--flg-radius-full);
+    background: var(--flg-control-track);
+  }
+  /* The accent gradient is the fill, since the solid accent of dark is only about 2.77:1. */
+  .flg-stepper[data-variant='bars'] .flg-step[data-state='complete'] .flg-step-bar {
+    background: linear-gradient(90deg, var(--flg-accent-start), var(--flg-accent-end));
+  }
+  .flg-stepper[data-variant='bars'] .flg-step[data-state='current'] .flg-step-bar {
+    background:
+      linear-gradient(90deg, var(--flg-accent-start), var(--flg-accent-end)) 0 0 / 50% 100%
+        no-repeat,
+      var(--flg-control-track);
+  }
+  .flg-stepper[data-variant='bars'] .flg-step[data-state='error'] .flg-step-bar {
+    background: var(--flg-danger);
+  }
+  .flg-stepper[data-variant='bars'] .flg-step-text {
+    gap: 2px;
+  }
+  .flg-step-caption {
+    display: inline-flex;
+    align-items: center;
+    gap: 4px;
+    font-size: var(--flg-text-2xs);
+    font-weight: var(--flg-weight-semibold);
+    letter-spacing: 0.05em;
+    text-transform: uppercase;
+    line-height: 1.3;
+    color: var(--flg-text-muted);
+  }
+  .flg-step-caption > svg {
+    flex: none;
+    width: 12px;
+    height: 12px;
+  }
+  .flg-step[data-state='complete'] .flg-step-caption,
+  .flg-step[data-state='current'] .flg-step-caption {
+    color: var(--flg-accent-text);
+  }
+  .flg-step[data-state='error'] .flg-step-caption {
+    color: var(--flg-danger);
+  }
+  .flg-stepper[data-variant='bars'][data-orientation='vertical'] .flg-step-inner {
+    flex-direction: row;
+    gap: 12px;
+    padding: 0;
+    margin: 0;
+  }
+  .flg-stepper[data-variant='bars'][data-orientation='vertical'] .flg-step-bar {
+    flex: none;
+    align-self: stretch;
+    width: 4px;
+    height: auto;
+  }
+  .flg-stepper[data-variant='bars'][data-orientation='vertical']
+    .flg-step[data-state='complete']
+    .flg-step-bar {
+    background: linear-gradient(180deg, var(--flg-accent-start), var(--flg-accent-end));
+  }
+  .flg-stepper[data-variant='bars'][data-orientation='vertical']
+    .flg-step[data-state='current']
+    .flg-step-bar {
+    background:
+      linear-gradient(180deg, var(--flg-accent-start), var(--flg-accent-end)) 0 0 / 100% 50%
+        no-repeat,
+      var(--flg-control-track);
+  }
+  .flg-stepper[data-variant='bars'][data-orientation='vertical'] .flg-step-text {
+    padding: 2px 0 6px;
+  }
+
+  /* ---- Narrow: only the current step and a failed one keep their words in sight. The others are
+     hidden the way `flg-visually-hidden` hides, so a screen reader still reads them. The words that
+     stay do not wrap, and may spill into the column beside them, which has none. ---- */
+  @container flg-stepper (max-width: 479px) {
+    .flg-step:not([data-state='current'], [data-state='error']) .flg-step-text {
+      position: absolute;
+      width: 1px;
+      height: 1px;
+      padding: 0;
+      margin: -1px;
+      overflow: hidden;
+      clip-path: inset(50%);
+      white-space: nowrap;
+      border: 0;
+    }
+    .flg-stepper[data-variant='circles'] .flg-step-title {
+      white-space: nowrap;
+    }
+    .flg-stepper[data-variant='compact']
+      .flg-step:not([data-state='current'], [data-state='error'])
+      .flg-step-inner {
+      padding: 4px;
+    }
+    .flg-stepper[data-variant='compact'] .flg-step:not(:last-child)::after {
+      margin: 0 4px;
+    }
+    .flg-stepper[data-variant='bars'] .flg-step-text {
+      white-space: nowrap;
+    }
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index a83c9a2..d4c4a76 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -38,5 +38,6 @@
 @import './components/alert.css';
 @import './components/progress.css';
 @import './components/skeleton.css';
+@import './components/stepper.css';
 @import './components/floating.css';
 @import './preferences.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 9af5407..6f8e907 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -56,6 +56,23 @@
       background: var(--flg-progress-color);
       box-shadow: none;
     }
+    /* A Stepper bar is drawn faint in the mockup. Here the bars that are not full, one not reached
+       yet and the current one (its empty half is the same track), have an edge of the control
+       border, as a Progress track does (spec phase 4 §4.4). */
+    .flg-step:is([data-state='upcoming'], [data-state='current']) .flg-step-bar {
+      box-shadow: inset 0 0 0 1px var(--flg-control-border);
+    }
+    /* The pill of the current step of a `compact` Stepper is the solid accent here, so what sits in
+       it turns over: the dot is the colour of the pill's text with its number or edge in the colour
+       of the pill, and the description, muted in the mockup, takes the pill's text colour. */
+    .flg-stepper[data-variant='compact'] .flg-step[data-state='current'] .flg-step-indicator {
+      background: var(--flg-selected-text);
+      border-color: var(--flg-selected-text);
+      color: var(--flg-selected-bg);
+    }
+    .flg-stepper[data-variant='compact'] .flg-step[data-state='current'] .flg-step-description {
+      color: var(--flg-selected-text);
+    }
   }
   @media (forced-colors: active) {
     .flg-surface {
@@ -456,6 +473,89 @@
     .flg-skeleton::after {
       display: none;
     }
+    /* A Stepper's dots and bars are drawn in system colours, since colour adjustment would turn each
+       of their backgrounds into `Canvas` and leave the states looking alike (spec phase 4 §4.5). Not
+       reached: a ring in the text colour on the canvas. Done: the selection colour with its mark in
+       the colour on it. Current: a 2px ring in the selection colour. Failed: the text colour filled,
+       with the mark in the canvas colour. The state is also in the mark and in the hidden words.
+       The selectors are as specific as the `contrast-more` rules for the same parts above (the
+       compact current dot, the edge of a bar), which Chromium matches too while colours are forced,
+       and they come later in the layer: a shorter selector would lose to them whatever the order. */
+    .flg-stepper[data-variant] .flg-step .flg-step-indicator,
+    .flg-stepper[data-variant] .flg-step .flg-step-bar {
+      forced-color-adjust: none;
+    }
+    .flg-stepper[data-variant] .flg-step .flg-step-indicator {
+      border-color: CanvasText;
+      background: Canvas;
+      color: CanvasText;
+      box-shadow: none;
+    }
+    .flg-stepper[data-variant] .flg-step[data-state='complete'] .flg-step-indicator {
+      border-color: Highlight;
+      background: Highlight;
+      color: HighlightText;
+    }
+    .flg-stepper[data-variant] .flg-step[data-state='current'] .flg-step-indicator {
+      border: 2px solid Highlight;
+      background: Canvas;
+      color: CanvasText;
+    }
+    .flg-stepper[data-variant] .flg-step[data-state='error'] .flg-step-indicator {
+      border-color: CanvasText;
+      background: CanvasText;
+      color: Canvas;
+    }
+    /* The lines between the steps: walked in the selection colour, not yet in the text colour. */
+    .flg-step::before,
+    .flg-step::after {
+      forced-color-adjust: none;
+      background: CanvasText;
+    }
+    .flg-step[data-state='complete']::after,
+    .flg-step[data-state='complete'] + .flg-step::before {
+      background: Highlight;
+    }
+    /* Every pill of a `compact` Stepper has an edge of the canvas colour, so that a step does not grow
+       when it turns current or failed (the lesson of the tabs, spec phase 2 §4.5). */
+    .flg-stepper[data-variant='compact'] .flg-step-inner {
+      border: 1px solid Canvas;
+    }
+    .flg-stepper[data-variant='compact'] .flg-step[data-state='current'] > .flg-step-inner {
+      border-color: Highlight;
+    }
+    .flg-stepper[data-variant='compact'] .flg-step[data-state='error'] > .flg-step-inner {
+      border-color: CanvasText;
+    }
+    /* A bar has a line in the text colour: empty before the step, filled once it is done, half filled
+       while it is current, and solid when it failed. */
+    .flg-stepper[data-variant] .flg-step .flg-step-bar {
+      box-sizing: border-box;
+      border: 1px solid CanvasText;
+      background: Canvas;
+      box-shadow: none;
+    }
+    .flg-stepper[data-variant] .flg-step[data-state='complete'] .flg-step-bar {
+      border-color: Highlight;
+      background: Highlight;
+    }
+    .flg-stepper[data-orientation='horizontal'][data-variant]
+      .flg-step[data-state='current']
+      .flg-step-bar {
+      background:
+        linear-gradient(Highlight, Highlight) 0 0 / 50% 100% no-repeat,
+        Canvas;
+    }
+    .flg-stepper[data-orientation='vertical'][data-variant]
+      .flg-step[data-state='current']
+      .flg-step-bar {
+      background:
+        linear-gradient(Highlight, Highlight) 0 0 / 100% 50% no-repeat,
+        Canvas;
+    }
+    .flg-stepper[data-variant] .flg-step[data-state='error'] .flg-step-bar {
+      background: CanvasText;
+    }
   }
   /* Repeating motion cannot be stopped by a duration of 0ms, which would repeat for ever (spec
      phase 4 §3.3), so what moves without end is stopped by hand here. Motion that happens once keeps
diff --git a/src/styles/theme/values.ts b/src/styles/theme/values.ts
index 77eea97..eddce2a 100644
--- a/src/styles/theme/values.ts
+++ b/src/styles/theme/values.ts
@@ -133,6 +133,8 @@ export const derivedTokens: TokenMap = {
   'slider-tick': 'color-mix(in srgb, var(--flg-text-muted) 70%, transparent)',
   // The dashed edge of a FileUpload zone (mockup F1): the muted text colour at 45%.
   'dropzone-border': 'color-mix(in srgb, var(--flg-text-muted) 45%, transparent)',
+  // The ring of a Stepper step that is not reached yet (mockup St1, St2): the muted text colour at 65%.
+  'stepper-ring': 'color-mix(in srgb, var(--flg-text-muted) 65%, transparent)',
 };
 
 /** No backdrop-filter support, or prefers-reduced-transparency: an almost opaque surface. */
@@ -163,6 +165,8 @@ export const contrastMore: Readonly<{ shared: TokenMap; light: TokenMap; dark: T
     'slider-tick': 'var(--flg-text-muted)',
     // Solid, so the dashed edge keeps 3:1 against the surface (spec phase 3 §4.2).
     'dropzone-border': 'var(--flg-text-muted)',
+    // Solid, so the ring keeps 3:1 against the surface (spec phase 4 §4.2).
+    'stepper-ring': 'var(--flg-text-muted)',
   },
   light: {
     'glass-tint': 'rgb(250,251,255)',
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm check:contrast
pnpm vitest run --project unit --project unit-react18 src/components/stepper src/internal src/docs src/index.test.ts
pnpm vitest run --project storybook-light --project storybook-dark src/components/stepper
pnpm build && pnpm check:package
```

Expected:
- `pnpm check:contrast`: PASS (`Contrast check passed.`). `stepper-ring` (sáng, tối), `current-edge` (sáng, tối) và `stepper-current-number` (tối) là `known-exception`; `stepper-done-mark` là `pass`. Số như phát hiện 4.
- Unit: 54 file, 512 test PASS, 3 skip, không lỗi kiểu. Trong đó `Stepper.test.tsx` 40 test ở mỗi project React, `step-states.test.ts` 16 (chỉ project `unit`), `Stepper.test-d.ts` 6, `ExceptionTable.test.tsx` 4, `index.test.ts` 1.
- Story Stepper: 30 test PASS (5 story × ba engine × hai theme). axe chạy sau play function, không có vi phạm. `Narrow` kiểm chữ ẩn của bản hẹp ở cả ba variant và bàn phím ở `circles`; `InAFlexRow` kiểm chiều rộng trong hàng flex.
- `pnpm build && pnpm check:package`: FAIL chỉ ở bước `size`: CSS 10.76 kB trên ngưỡng 10.53 kB (vượt 233 B); JS 45.81 kB trên 49.55 kB. Các bước trước đó pass: `check:dist-css` (chín class `flg-stepper`, `flg-step*`), `check:use-client`, `check:rsc` (`ok` cho ba ca Stepper), `check:publint`, `check:types`. Không chạy `pnpm size:record` ở task này: Task 2 ghi ngưỡng cho cả Plan B (phát hiện 8).
- Stepper là component mới, và các file dùng chung chỉ được thêm vào (phát hiện 10), nên ảnh chuẩn của component cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md \
  docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md \
  scripts/check-dist-css.ts \
  scripts/contrast-exceptions.ts \
  scripts/lib/contrast.ts \
  scripts/rsc-probe.mjs \
  src/components/stepper/Stepper.mdx \
  src/components/stepper/Stepper.stories.tsx \
  src/components/stepper/Stepper.test-d.ts \
  src/components/stepper/Stepper.test.tsx \
  src/components/stepper/Stepper.tsx \
  src/components/stepper/index.ts \
  src/components/stepper/step-states.test.ts \
  src/components/stepper/step-states.ts \
  src/docs/Accessibility.mdx \
  src/docs/ExceptionTable.test.tsx \
  src/index.test.ts \
  src/index.ts \
  src/internal/icons.test.tsx \
  src/internal/icons.tsx \
  src/styles/components/stepper.css \
  src/styles/index.css \
  src/styles/preferences.css \
  src/styles/theme/values.ts
```
```bash
git commit -m "feat(stepper): add Stepper and Step with circles, compact and bars looks" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 2: List (`inset`, `cards`, `plain`), móc `data-visual-hover` và ngưỡng kích thước của Plan B

Spec §1 (dòng List của bảng quyết định), §2 (dòng B: thay đổi của harness), §3.1 (dòng List, ca `check:rsc`), §3.2, §3.3 (dòng List `cards` khi hover), §4.1, §4.2 (ba token của List; quy tắc hiệu năng của `cards`), §4.3 **List**, §4.4 (`current-edge`: dòng 31 thêm vạch `inset`; dòng 2, 6, 7, 8, 9, 12, 14 mở rộng; "Không đo" và các quy tắc "+" của List), §4.5 **List**, §5 (cảnh báo của List), §6.1, §6.2, §6.3 **`List`** và **`ListItem`**, §7 (List ở dòng 1, 2, 3, 5; móc `data-visual-hover`; test kiểu; kiểm tra gói), §8 (trang List; ghi chú trên trang Accessibility), §10 (dòng `cards`). Mockup L1, L2, L3. Một danh sách để đọc, không phải listbox chọn giá trị.
- **Server-safe:** không `"use client"`, không hook. `renderLink` chạy cả trên server. Slot rỗng (ô đầu, mô tả, ô cuối, cột giữa) nhận ra bằng `hasContent` (phát hiện 6).
- **Cấu trúc** như HTML của §6.3: `<ul role="list">` (Safari bỏ ngữ nghĩa danh sách khi `list-style: none`), `inset` thêm lớp `flg-surface`; mỗi `li.flg-list-item` có ô đầu, cột giữa (tiêu đề, mô tả, rồi `children`) và ô cuối.
- **Tiêu đề:** `<span>`, `<a href>` (hoặc kết quả của `renderLink`) hay `<button type="button">` (`onSelect`). `href` thắng `onSelect`. Không có tiêu đề thì hàng không bấm được. Liên kết kéo giãn (`::after`) phủ cả hàng; phần tử tương tác trong ô cuối nằm trên nó.
- **`current`:** `aria-current="page"` trên tiêu đề khi hàng bấm được, trên `<li>` khi không; `data-current` trên `<li>`. **`disabled`:** `data-disabled`, không `data-interactive`; link thành `<a role="link" aria-disabled="true">` không có `href` và không gọi `renderLink`; nút có `disabled` gốc.
- **Giao diện L1–L3** (§4.3), cỡ `sm` (44px) và `md` (52px). Gốc có `min-width: 0`; tiêu đề một dòng có "…"; liên kết kéo giãn bo theo `--flg-list-item-radius`; `inset` một hàng bo bốn góc; `cards` chép lớp kính của `.flg-surface` cho mỗi hàng (phát hiện 6). Hover chỉ ở hàng có `data-interactive`, khi `@media (hover: hover)`.
- **Ba token theo theme** trong `values.ts` và trong bảng `MOCKUP` của `theme-css.test.ts`; chạy `pnpm gen:theme` sau khi sửa.
- **`prefers-contrast: more` và forced colors** trong `preferences.css`, với selector forced colors cụ thể ít nhất bằng selector contrast-more của cùng phần (phát hiện 6).
- **Tương phản:** không có check mới. Vạch `inset` là cặp của `current-edge` (dòng 31); dòng 2, 6, 7, 8, 9, 12 và 14 thêm vị trí của List (phát hiện 4). `ExceptionTable.test.tsx` không đổi (vẫn 31 dòng). Trang Accessibility thêm List vào câu trỏ và một đoạn về link của hàng List.
- **Móc `data-visual-hover`** của harness visual (phát hiện 7).
- **Ngưỡng kích thước** cho cả Plan B, ghi bằng `pnpm size:record` (không chép `.size-limit.json`).
- Spec giai đoạn 4 §4.3, §5 và §6.3 được sửa (phát hiện 3).
- Task này kết thúc bằng kiểm tra cuối của cả nhánh.

**Files:**
- Create: `src/components/list/List.tsx`, `index.ts`, `List.test.tsx`, `List.test-d.ts`, `List.stories.tsx`, `List.mdx`, `src/styles/components/list.css`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `src/styles/theme/values.ts`, `scripts/lib/theme-css.test.ts`, `scripts/check-dist-css.ts`, `scripts/rsc-probe.mjs`, `scripts/contrast-exceptions.ts`, `src/docs/Accessibility.mdx`, `tests/visual/stories.visual.ts`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`, `docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md`, `.size-limit.json` (do `size:record` ghi)

**Interfaces:**
- Produces trong `src/components/list/List.tsx` (server-safe), export qua `index.ts` và `src/index.ts`:
  - `List`: `forwardRef<HTMLUListElement, ListProps>`; `ListItem`: `forwardRef<HTMLLIElement, ListItemProps>`.
  - `ListProps = HTMLAttributes<HTMLUListElement> & { variant?: ListVariant; size?: 'sm' | 'md' }`. Mặc định: `variant` `'inset'`, `size` `'md'`.
  - `ListItemLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; className: string; children: ReactNode }`: props lib đưa cho `renderLink` (`href`, `className`, `children`, và `aria-current` ở hàng hiện tại).
  - `ListItemProps = Omit<LiHTMLAttributes<HTMLLIElement>, 'title' | 'onSelect' | 'value'> & { title?: ReactNode; description?: ReactNode; start?: ReactNode; end?: ReactNode; href?: string; renderLink?: (props: ListItemLinkProps) => ReactElement; onSelect?: (event: MouseEvent<HTMLButtonElement>) => void; current?: boolean; disabled?: boolean }`. Mặc định: `current` `false`, `disabled` `false`.
  - `ListVariant = 'inset' | 'cards' | 'plain'`.
  - Class: `flg-list` (cộng `flg-surface` ở `inset`), `flg-list-item`, `flg-list-item-start`, `flg-list-item-main`, `flg-list-item-title`, `flg-list-item-description`, `flg-list-item-end`. Biến cục bộ `--flg-list-item-radius`, mỗi variant đặt trên hàng.
  - Hook DOM: `data-variant` và `data-size` trên `<ul>`; `data-interactive` (hàng bấm được và không disabled), `data-current`, `data-disabled` (hàng bấm được và disabled) trên `<li>`.
  - Token theo theme: `--flg-list-card-shadow` (sáng `0 1px 2px #0000000a, 0 6px 16px #3c5fd21f`, tối `0 6px 18px #00000047`), `--flg-list-card-shadow-hover` (sáng `0 2px 4px #0000000f, 0 12px 26px #3c5fd238`, tối `0 12px 28px #00000073`), `--flg-list-card-hover-bg` (sáng `var(--flg-control-bg)`, tối `var(--flg-control-track)`); có trong bảng `MOCKUP` của `theme-css.test.ts`.
  - Cảnh báo dev: `<ListItem> has both href and onSelect; the href wins and onSelect is ignored.`; `<ListItem> href, onSelect and renderLink need a title: the link or button is the title, stretched over the row. Without one the row is not pressable.`; `<ListItem> renderLink has no effect without href.`
  - Không có check tương phản mới; `KNOWN_EXCEPTIONS` không thêm phần tử. Mô tả của dòng 2, 6, 7, 8, 9, 12, 14 và 31 thêm List.
  - `scripts/rsc-probe.mjs`: hai ca `List with a link row and a static row` và `List cards with renderLink`.
- Produces trong `tests/visual/stories.visual.ts`: thuộc tính `data-visual-hover`. Phần tử đầu tiên mang nó trong sân khấu được rê chuột thật trước khi chụp, ở mọi chế độ. Plan C dùng được nó cho hàng hover của Table.
- Ngưỡng mới: JS 50772 B, CSS 12656 B.
- Consumes: `dataAttr`, `hasContent`, `devWarn`; lớp `flg-surface` của `Surface`; check `current-edge` (Task 1); `realUserEvent` của `.storybook/real-input.ts`, `ChevronIcon`, `strokeIcon`, `Avatar`, `Badge`, `Card`, `CardTitle`, `IconButton` trong story.

- [ ] **Step 1: Viết test**

```diff
diff --git a/scripts/lib/theme-css.test.ts b/scripts/lib/theme-css.test.ts
index 3ea6f29..a01e8df 100644
--- a/scripts/lib/theme-css.test.ts
+++ b/scripts/lib/theme-css.test.ts
@@ -48,6 +48,9 @@ const MOCKUP: Record<values.ThemeName, Record<string, string>> = {
     'control-track': 'rgba(31,36,51,.12)',
     'control-thumb': '#ffffff',
     'skeleton-shine': 'rgba(255,255,255,.75)',
+    'list-card-shadow': '0 1px 2px #0000000a, 0 6px 16px #3c5fd21f',
+    'list-card-shadow-hover': '0 2px 4px #0000000f, 0 12px 26px #3c5fd238',
+    'list-card-hover-bg': 'var(--flg-control-bg)',
     scrim: 'rgba(15,20,40,.28)',
   },
   dark: {
@@ -74,6 +77,9 @@ const MOCKUP: Record<values.ThemeName, Record<string, string>> = {
     'control-track': 'rgba(255,255,255,.10)',
     'control-thumb': '#ffffff',
     'skeleton-shine': 'rgba(255,255,255,.12)',
+    'list-card-shadow': '0 6px 18px #00000047',
+    'list-card-shadow-hover': '0 12px 28px #00000073',
+    'list-card-hover-bg': 'var(--flg-control-track)',
     scrim: 'rgba(0,0,0,.45)',
   },
 };
diff --git a/src/components/list/List.stories.tsx b/src/components/list/List.stories.tsx
new file mode 100644
index 0000000..171d00c
--- /dev/null
+++ b/src/components/list/List.stories.tsx
@@ -0,0 +1,401 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import type { ReactNode } from 'react';
+import { expect, fn, userEvent, waitFor } from 'storybook/test';
+import { realUserEvent } from '../../../.storybook/real-input';
+import { ChevronIcon, strokeIcon } from '../../internal/icons';
+import { Avatar } from '../avatar/Avatar';
+import { Badge } from '../badge/Badge';
+import { Card, CardTitle } from '../card/Card';
+import { IconButton } from '../icon-button/IconButton';
+import { List, ListItem } from './List';
+import type { ListProps } from './List';
+
+const meta = {
+  title: 'Components/List',
+  component: List,
+  // The stories hand each List its rows, so the controls have nothing to drive.
+  args: { children: null },
+} satisfies Meta<typeof List>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+type Look = Pick<ListProps, 'variant'>;
+
+const chevron = <ChevronIcon direction="right" />;
+
+/** The "…" of the mockup's row menu: the icon is the page's, not the library's. */
+const MoreIcon = () => (
+  <svg {...strokeIcon}>
+    <circle cx="5" cy="12" r="1" />
+    <circle cx="12" cy="12" r="1" />
+    <circle cx="19" cy="12" r="1" />
+  </svg>
+);
+const UserIcon = () => (
+  <svg {...strokeIcon}>
+    <circle cx="12" cy="8" r="4" />
+    <path d="M4 21a8 8 0 0 1 16 0" />
+  </svg>
+);
+const BellIcon = () => (
+  <svg {...strokeIcon}>
+    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
+    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
+  </svg>
+);
+const LockIcon = () => (
+  <svg {...strokeIcon}>
+    <rect x="3" y="11" width="18" height="11" rx="2" />
+    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
+  </svg>
+);
+const CardIcon = () => (
+  <svg {...strokeIcon}>
+    <rect x="2" y="5" width="20" height="14" rx="2" />
+    <path d="M2 10h20" />
+  </svg>
+);
+
+const heading = {
+  margin: '0 2px 8px',
+  color: 'var(--flg-text)',
+  fontSize: 'var(--flg-text-md)',
+  fontWeight: 'var(--flg-weight-semibold)',
+} as const;
+
+/** The list of people, with the four rows of the mockup: static, hovered, with a button, focused. */
+function Members(props: Look) {
+  return (
+    <List {...props} aria-label="Team members">
+      <ListItem
+        start={<Avatar alt="" fallback="AL" />}
+        title="Ada Lovelace"
+        description="ada@example.com"
+        end={<Badge variant="accent">Admin</Badge>}
+      />
+      <ListItem
+        data-visual-hover=""
+        start={<Avatar alt="" fallback="GH" />}
+        title="Grace Hopper"
+        description="grace@example.com"
+        href="#grace"
+        end={
+          <>
+            <span>2 hours ago</span>
+            {chevron}
+          </>
+        }
+      />
+      <ListItem
+        start={<Avatar alt="" fallback="AT" />}
+        title="Alan Turing"
+        description="alan@example.com"
+        href="#alan"
+        end={
+          <IconButton variant="ghost" size="sm" aria-label="Options for Alan Turing">
+            <MoreIcon />
+          </IconButton>
+        }
+      />
+      <ListItem
+        start={<Avatar alt="" fallback="KJ" />}
+        title="Katherine Johnson"
+        description="katherine@example.com"
+        href="#katherine"
+        end={
+          <>
+            <span>Yesterday</span>
+            {chevron}
+          </>
+        }
+      />
+    </List>
+  );
+}
+
+/** The navigation list, `sm`: the current row, a link, a link with a description, a disabled one. */
+function Settings(props: Look) {
+  return (
+    <List {...props} size="sm" aria-label="Settings">
+      <ListItem start={<UserIcon />} title="Profile" href="#profile" current end={chevron} />
+      <ListItem start={<BellIcon />} title="Notifications" href="#notifications" end={chevron} />
+      <ListItem
+        start={<LockIcon />}
+        title="Security"
+        description="Password, two-step sign-in"
+        href="#security"
+        end={chevron}
+      />
+      <ListItem
+        start={<CardIcon />}
+        title="Billing"
+        description="Only the team owner can open it"
+        href="#billing"
+        disabled
+        end={chevron}
+      />
+    </List>
+  );
+}
+
+/** A list of the mockup's width, with the heading above it that the mockup draws. */
+function Frame({ title, children }: { title: string; children: ReactNode }) {
+  return (
+    <div style={{ width: 420 }}>
+      <div style={heading}>{title}</div>
+      {children}
+    </div>
+  );
+}
+
+/**
+ * The states of the approved mockup (list L1-L3): the member list, with a static row that holds a
+ * Badge, a link row under the pointer (the harness hovers it, through `data-visual-hover`), a link row
+ * with a "…" button and a row with keyboard focus; and the `sm` settings list, with the current row, a
+ * link, a link with a description and a disabled link. Tab four times: the first stop is the link under
+ * the pointer, the mockup draws the focus on the last row of the members.
+ */
+function Lists({ variant }: Look) {
+  return (
+    <div style={{ display: 'grid', gap: 18 }}>
+      <Frame title="Team members">
+        <Members variant={variant} />
+      </Frame>
+      <Frame title="Settings">
+        <Settings variant={variant} />
+      </Frame>
+    </div>
+  );
+}
+
+/** `plain` sits on a card in the mockup, so the card gives the lists their headings. */
+function PlainLists() {
+  return (
+    <div style={{ display: 'grid', gap: 18 }}>
+      <Card style={{ gap: 10, width: 420 }}>
+        <CardTitle>Team members</CardTitle>
+        <Members variant="plain" />
+      </Card>
+      <Card style={{ gap: 10, width: 420 }}>
+        <CardTitle>Settings</CardTitle>
+        <Settings variant="plain" />
+      </Card>
+    </div>
+  );
+}
+
+// Tab four times: the link under the pointer, the link of the row with the button, the button, and
+// the link of the last row, where the mockup draws the focus.
+const focusLastMember: Story['play'] = async ({ canvas }) => {
+  for (let stop = 0; stop < 4; stop += 1) await userEvent.tab();
+  const focused = canvas.getByRole('link', { name: 'Katherine Johnson' });
+  await expect(focused).toHaveFocus();
+  await expect(focused.matches(':focus-visible')).toBe(true);
+};
+
+export const Inset: Story = { render: () => <Lists variant="inset" />, play: focusLastMember };
+export const Cards: Story = { render: () => <Lists variant="cards" />, play: focusLastMember };
+export const Plain: Story = { render: () => <PlainLists />, play: focusLastMember };
+
+const THREE_VARIANTS = ['inset', 'cards', 'plain'] as const;
+
+/**
+ * A press anywhere on a row that can be pressed is a press of its title, which is stretched over the
+ * row; a press on the button in the end cell is that button's alone, and does not reach the title. A
+ * disabled row does nothing. Real mouse input, because a hit test is what the stretched link is for.
+ */
+export const PressAnywhere: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ display: 'grid', gap: 18, width: 420 }}>
+      {THREE_VARIANTS.map((variant) => (
+        <List key={variant} variant={variant} aria-label={variant}>
+          <ListItem
+            start={<Avatar alt="" fallback="AL" />}
+            title="Ada Lovelace"
+            description="ada@example.com"
+            onSelect={fn()}
+            end={
+              <IconButton variant="ghost" size="sm" aria-label="Options for Ada" onClick={fn()}>
+                <MoreIcon />
+              </IconButton>
+            }
+          />
+          <ListItem
+            title="Billing"
+            description="Only the owner"
+            onSelect={fn()}
+            disabled
+            end={chevron}
+          />
+        </List>
+      ))}
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    for (const variant of THREE_VARIANTS) {
+      const list = canvasElement.querySelector<HTMLElement>(`[aria-label="${variant}"]`)!;
+      const [row, disabledRow] = Array.from(list.querySelectorAll<HTMLElement>('li'));
+      const title = row!.querySelector<HTMLButtonElement>('.flg-list-item-title')!;
+      const optionsButton = row!.querySelector<HTMLButtonElement>('.flg-list-item-end button')!;
+      let presses = 0;
+      title.addEventListener('click', () => (presses += 1));
+      let optionPresses = 0;
+      optionsButton.addEventListener('click', () => (optionPresses += 1));
+
+      // Over the start cell, the description, the title and the empty part of the row, as offsets from
+      // the corner of the row: a press scrolls the page, so a point on the screen would go stale.
+      const corner = row!.getBoundingClientRect();
+      const centreOf = (element: Element) => {
+        const rect = element.getBoundingClientRect();
+        return { x: rect.x + rect.width / 2 - corner.x, y: rect.y + rect.height / 2 - corner.y };
+      };
+      const spots = [
+        centreOf(row!.querySelector('.flg-list-item-start')!),
+        centreOf(row!.querySelector('.flg-list-item-description')!),
+        centreOf(title),
+        { x: corner.width * 0.75, y: corner.height / 2 },
+      ];
+      for (const [index, spot] of spots.entries()) {
+        const now = row!.getBoundingClientRect();
+        // What lies under the pointer is the title, or something inside it.
+        await expect(
+          title.contains(document.elementFromPoint(now.x + spot.x, now.y + spot.y)),
+        ).toBe(true);
+        await real.click(row!, { position: spot });
+        await waitFor(() => expect(presses).toBe(index + 1));
+      }
+      await expect(optionPresses).toBe(0);
+
+      // The button is above the stretched link: a press on it reaches it, and not the title.
+      const button = optionsButton.getBoundingClientRect();
+      await expect(
+        optionsButton.contains(
+          document.elementFromPoint(button.x + button.width / 2, button.y + button.height / 2),
+        ),
+      ).toBe(true);
+      await real.click(optionsButton);
+      await waitFor(() => expect(optionPresses).toBe(1));
+      await expect(presses).toBe(spots.length);
+
+      // A disabled row: the whole row says so, and a press does nothing.
+      const disabledTitle = disabledRow!.querySelector<HTMLButtonElement>('.flg-list-item-title')!;
+      await expect(disabledTitle).toBeDisabled();
+      await expect(getComputedStyle(disabledTitle).cursor).toBe('not-allowed');
+      let disabledPresses = 0;
+      disabledTitle.addEventListener('click', () => (disabledPresses += 1));
+      await real.click(disabledRow!);
+      await expect(disabledPresses).toBe(0);
+    }
+  },
+};
+
+/**
+ * Only a row that can be pressed carries `data-interactive`, and only such a row reacts to the
+ * pointer: the link row takes the hover background, the static row stays as it is. The hover is a
+ * real mouse move, since `:hover` cannot be turned on from a play function otherwise.
+ */
+export const HoverOnlyOnPressableRows: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ display: 'grid', gap: 18, width: 420 }}>
+      <List variant="inset" aria-label="Rows">
+        <ListItem title="Static" description="Cannot be pressed" />
+        <ListItem title="Link" description="Can be pressed" href="#link" />
+        <ListItem title="Disabled" href="#disabled" disabled />
+      </List>
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const [staticRow, linkRow, disabledRow] = Array.from(
+      canvasElement.querySelectorAll<HTMLElement>('li'),
+    );
+    await expect(
+      [staticRow, linkRow, disabledRow].map((row) => row!.hasAttribute('data-interactive')),
+    ).toEqual([false, true, false]);
+    const real = await realUserEvent();
+    if (!real) return;
+    const transparent = 'rgba(0, 0, 0, 0)';
+    const background = (row: HTMLElement | undefined) => getComputedStyle(row!).backgroundColor;
+    await real.hover(linkRow!);
+    await waitFor(() => expect(background(linkRow)).not.toBe(transparent));
+    await real.hover(staticRow!);
+    await expect(background(staticRow)).toBe(transparent);
+    await real.hover(disabledRow!);
+    await expect(background(disabledRow)).toBe(transparent);
+    await expect(background(linkRow)).toBe(transparent);
+  },
+};
+
+/**
+ * A long title and description in a 320px frame are cut short with an ellipsis, and the end cell keeps
+ * its place and its width, in each look: in a block, and as an item of a flex row beside a box, where a
+ * list that did not shrink would push the row wider than the frame.
+ */
+export const LongText: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ display: 'grid', gap: 24 }}>
+      {THREE_VARIANTS.map((variant) => (
+        <div key={variant} style={{ display: 'grid', gap: 12 }}>
+          <div data-frame={`${variant}-block`} style={{ width: 320 }}>
+            <LongRow variant={variant} />
+          </div>
+          <div
+            data-frame={`${variant}-flex`}
+            style={{ display: 'flex', alignItems: 'start', gap: 12, width: 320 }}
+          >
+            <span style={{ flex: 'none', width: 40, height: 40 }} />
+            <LongRow variant={variant} />
+          </div>
+        </div>
+      ))}
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    for (const variant of THREE_VARIANTS) {
+      for (const kind of ['block', 'flex']) {
+        const frame = canvasElement.querySelector<HTMLElement>(
+          `[data-frame="${variant}-${kind}"]`,
+        )!;
+        const list = frame.querySelector<HTMLElement>('.flg-list')!;
+        const row = list.querySelector<HTMLElement>('li')!;
+        const title = row.querySelector<HTMLElement>('.flg-list-item-title')!;
+        const description = row.querySelector<HTMLElement>('.flg-list-item-description')!;
+        const end = row.querySelector<HTMLElement>('.flg-list-item-end')!;
+        const label = `${variant} ${kind}`;
+        const frameBox = frame.getBoundingClientRect();
+        // Inside the frame, the end cell inside the row, and the words cut short.
+        // `plain` runs 8px beyond the frame on each side, by design (spec phase 4 §4.3).
+        const bleed = variant === 'plain' ? 8 : 0;
+        await expect(row.getBoundingClientRect().right, label).toBeLessThanOrEqual(
+          frameBox.right + bleed + 0.5,
+        );
+        await expect(end.getBoundingClientRect().right, label).toBeLessThanOrEqual(
+          row.getBoundingClientRect().right + 0.5,
+        );
+        await expect(end.getBoundingClientRect().width, label).toBeGreaterThan(20);
+        await expect(title.scrollWidth, label).toBeGreaterThan(title.clientWidth);
+        await expect(description.scrollWidth, label).toBeGreaterThan(description.clientWidth);
+        await expect(getComputedStyle(title).textOverflow, label).toBe('ellipsis');
+      }
+    }
+  },
+};
+
+function LongRow({ variant }: Look) {
+  return (
+    <List variant={variant} aria-label={`Long ${variant}`}>
+      <ListItem
+        start={<Avatar alt="" fallback="LT" />}
+        title="A title that is much too long to fit in a column of this width, however it is set"
+        description="A description that runs on and on, well past the end of the line it is given"
+        href="#long"
+        end={<Badge variant="accent">Admin</Badge>}
+      />
+    </List>
+  );
+}
diff --git a/src/components/list/List.test-d.ts b/src/components/list/List.test-d.ts
new file mode 100644
index 0000000..e59ce84
--- /dev/null
+++ b/src/components/list/List.test-d.ts
@@ -0,0 +1,46 @@
+import { createRef } from 'react';
+import type { MouseEvent, ReactElement, ReactNode } from 'react';
+import { expectTypeOf, test } from 'vitest';
+import type { ListItemLinkProps, ListItemProps, ListProps } from './List';
+import { List, ListItem } from './List';
+
+test('a List takes only the documented variants and sizes', () => {
+  expectTypeOf<ListProps['variant']>().toEqualTypeOf<'inset' | 'cards' | 'plain' | undefined>();
+  expectTypeOf<ListProps['size']>().toEqualTypeOf<'sm' | 'md' | undefined>();
+  // @ts-expect-error an unknown variant
+  const unknownVariant: ListProps = { variant: 'grouped' };
+  // @ts-expect-error the variant of another component
+  const otherVariant: ListProps = { variant: 'lined' };
+  // @ts-expect-error an unknown size
+  const unknownSize: ListProps = { size: 'lg' };
+  expectTypeOf(unknownVariant).toBeObject();
+  expectTypeOf(otherVariant).toBeObject();
+  expectTypeOf(unknownSize).toBeObject();
+});
+
+test('the ref of a List is the <ul> and the ref of a ListItem is the <li>', () => {
+  expectTypeOf(List).toBeCallableWith({ ref: createRef<HTMLUListElement>() });
+  expectTypeOf(ListItem).toBeCallableWith({ ref: createRef<HTMLLIElement>() });
+  // @ts-expect-error a List is a <ul>, not a <div>
+  expectTypeOf(List).toBeCallableWith({ ref: createRef<HTMLDivElement>() });
+});
+
+test('title is a node, not the string attribute of an <li>', () => {
+  expectTypeOf<ListItemProps['title']>().toEqualTypeOf<ReactNode>();
+  expectTypeOf<ListItemProps>().not.toHaveProperty('value');
+});
+
+test('onSelect reports the click on the button of the title', () => {
+  expectTypeOf<NonNullable<ListItemProps['onSelect']>>().parameters.toEqualTypeOf<
+    [MouseEvent<HTMLButtonElement>]
+  >();
+});
+
+test('renderLink gets the props of the <a>, with href, className and children given', () => {
+  expectTypeOf<ListItemLinkProps['href']>().toEqualTypeOf<string>();
+  expectTypeOf<ListItemLinkProps['className']>().toEqualTypeOf<string>();
+  expectTypeOf<ListItemLinkProps['children']>().toEqualTypeOf<ReactNode>();
+  expectTypeOf<NonNullable<ListItemProps['renderLink']>>().toEqualTypeOf<
+    (props: ListItemLinkProps) => ReactElement
+  >();
+});
diff --git a/src/components/list/List.test.tsx b/src/components/list/List.test.tsx
new file mode 100644
index 0000000..e450a00
--- /dev/null
+++ b/src/components/list/List.test.tsx
@@ -0,0 +1,487 @@
+import { render, screen } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { Fragment, createRef } from 'react';
+import type { AnchorHTMLAttributes } from 'react';
+import { beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import { List, ListItem } from './List';
+import type { ListItemLinkProps } from './List';
+
+beforeEach(() => {
+  resetDevWarnings();
+  vi.restoreAllMocks();
+});
+
+const plainLink = ({ children, ...props }: ListItemLinkProps) => <a {...props}>{children}</a>;
+const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
+const rows = (container: HTMLElement) => Array.from(container.querySelectorAll('li.flg-list-item'));
+const part = (row: Element, name: string) => row.querySelector(`.flg-list-item-${name}`);
+
+const HREF_AND_ON_SELECT =
+  '<ListItem> has both href and onSelect; the href wins and onSelect is ignored.';
+const NEEDS_TITLE =
+  '<ListItem> href, onSelect and renderLink need a title: the link or button is the title, stretched over the row. Without one the row is not pressable.';
+const RENDER_LINK_WITHOUT_HREF = '<ListItem> renderLink has no effect without href.';
+
+describe('List', () => {
+  it('renders a <ul role="list"> with inset and md by default, and the glass surface only for inset', () => {
+    const { container } = render(
+      <List>
+        <ListItem title="A" />
+      </List>,
+    );
+    const list = container.firstElementChild!;
+    expect(list.tagName).toBe('UL');
+    // Safari drops the list semantics of a list that has `list-style: none`.
+    expect(list).toHaveAttribute('role', 'list');
+    expect(list).toHaveClass('flg-list', 'flg-surface');
+    expect(list).toHaveAttribute('data-variant', 'inset');
+    expect(list).toHaveAttribute('data-size', 'md');
+    expect(screen.getByRole('list')).toBe(list);
+  });
+
+  it.each([
+    ['inset', true],
+    ['cards', false],
+    ['plain', false],
+  ] as const)('reflects variant %s, with flg-surface: %s', (variant, surface) => {
+    const { container } = render(
+      <List variant={variant} size="sm">
+        <ListItem title="A" />
+      </List>,
+    );
+    const list = container.firstElementChild!;
+    expect(list).toHaveAttribute('data-variant', variant);
+    expect(list).toHaveAttribute('data-size', 'sm');
+    expect(list.classList.contains('flg-surface')).toBe(surface);
+  });
+
+  it('forwards the ref to the <ul> and puts className, style and other props on it', () => {
+    const ref = createRef<HTMLUListElement>();
+    const { container } = render(
+      <List ref={ref} className="mine" style={{ margin: 3 }} aria-label="Members">
+        <ListItem title="A" />
+      </List>,
+    );
+    expect(ref.current).toBe(container.firstElementChild);
+    expect(ref.current).toHaveClass('flg-list', 'mine');
+    expect(ref.current).toHaveStyle({ margin: '3px' });
+    expect(screen.getByRole('list', { name: 'Members' })).toBe(ref.current);
+  });
+});
+
+describe('ListItem structure', () => {
+  it('renders start, a main column with title and description, and end, in that order', () => {
+    const { container } = render(
+      <List>
+        <ListItem
+          start={<i data-testid="start" />}
+          title="Ada"
+          description="ada@example.com"
+          end={<b data-testid="end" />}
+        />
+      </List>,
+    );
+    const [row] = rows(container);
+    expect(Array.from(row!.children).map((child) => child.className)).toEqual([
+      'flg-list-item-start',
+      'flg-list-item-main',
+      'flg-list-item-end',
+    ]);
+    expect(part(row!, 'start')).toContainElement(screen.getByTestId('start'));
+    expect(part(row!, 'end')).toContainElement(screen.getByTestId('end'));
+    const main = part(row!, 'main')!;
+    expect(Array.from(main.children).map((child) => child.className)).toEqual([
+      'flg-list-item-title',
+      'flg-list-item-description',
+    ]);
+    expect(main.querySelector('.flg-list-item-description')).toHaveTextContent('ada@example.com');
+  });
+
+  it.each([
+    ['false', false],
+    ['null', null],
+    ['an empty string', ''],
+    ['an empty array', []],
+    ['an empty fragment', <Fragment key="f" />],
+    ['a fragment of nothing', <Fragment key="f">{[null, false]}</Fragment>],
+  ])('leaves out a slot that holds %s', (_label, nothing) => {
+    const { container } = render(
+      <List>
+        <ListItem start={nothing} title="A" description={nothing} end={nothing} />
+        <ListItem start={nothing} title={nothing} description={nothing} end={nothing} />
+      </List>,
+    );
+    const [first, second] = rows(container);
+    expect(part(first!, 'start')).toBeNull();
+    expect(part(first!, 'description')).toBeNull();
+    expect(part(first!, 'end')).toBeNull();
+    expect(part(first!, 'title')).not.toBeNull();
+    // A row with nothing in it has no column either.
+    expect(second!.children).toHaveLength(0);
+  });
+
+  it('keeps a slot that holds the number 0', () => {
+    const { container } = render(
+      <List>
+        <ListItem title="Unread" end={0} />
+      </List>,
+    );
+    expect(part(rows(container)[0]!, 'end')).toHaveTextContent('0');
+  });
+
+  it('puts children after the description, in the main column, as the free content of a row without a title', () => {
+    const { container } = render(
+      <List>
+        <ListItem title="With" description="d">
+          <em>after</em>
+        </ListItem>
+        <ListItem>
+          <em>free</em>
+        </ListItem>
+      </List>,
+    );
+    const [withTitle, free] = rows(container);
+    const main = part(withTitle!, 'main')!;
+    expect(main.lastElementChild!.tagName).toBe('EM');
+    expect(main.children).toHaveLength(3);
+    expect(part(free!, 'title')).toBeNull();
+    expect(part(free!, 'main')).toHaveTextContent('free');
+    expect(free).not.toHaveAttribute('data-interactive');
+  });
+
+  it('forwards the ref to the <li> and puts className, style and other props on it', () => {
+    const ref = createRef<HTMLLIElement>();
+    const { container } = render(
+      <List>
+        <ListItem ref={ref} title="A" className="mine" style={{ margin: 3 }} id="row" />
+      </List>,
+    );
+    expect(ref.current).toBe(rows(container)[0]);
+    expect(ref.current).toHaveClass('flg-list-item', 'mine');
+    expect(ref.current).toHaveStyle({ margin: '3px' });
+    expect(ref.current).toHaveAttribute('id', 'row');
+  });
+
+  it('does not put the title or onSelect on the <li> as attributes', () => {
+    const { container } = render(
+      <List>
+        <ListItem title="A" onSelect={() => {}} />
+      </List>,
+    );
+    const [row] = rows(container);
+    expect(row).not.toHaveAttribute('title');
+    expect(row).not.toHaveAttribute('onselect');
+  });
+});
+
+describe('the title', () => {
+  it('is a <span> on a row that cannot be pressed', () => {
+    const { container } = render(
+      <List>
+        <ListItem title="Static" />
+      </List>,
+    );
+    const title = part(rows(container)[0]!, 'title')!;
+    expect(title.tagName).toBe('SPAN');
+    expect(screen.queryByRole('link')).toBeNull();
+    expect(screen.queryByRole('button')).toBeNull();
+  });
+
+  it('is an <a href> with href', () => {
+    render(
+      <List>
+        <ListItem title="Profile" href="/profile" />
+      </List>,
+    );
+    const link = screen.getByRole('link', { name: 'Profile' });
+    expect(link).toHaveAttribute('href', '/profile');
+    expect(link).toHaveClass('flg-list-item-title');
+  });
+
+  it('is a <button type="button"> with onSelect, and calls onSelect with the click', async () => {
+    const onSelect = vi.fn();
+    render(
+      <List>
+        <ListItem title="Open" onSelect={onSelect} />
+      </List>,
+    );
+    const button = screen.getByRole('button', { name: 'Open' });
+    expect(button).toHaveAttribute('type', 'button');
+    expect(button).toHaveClass('flg-list-item-title');
+    await userEvent.click(button);
+    expect(onSelect).toHaveBeenCalledTimes(1);
+    expect(onSelect.mock.calls[0]![0]).toMatchObject({ type: 'click', target: button });
+  });
+
+  it('names the link or button by the title alone: the description and the end slot are not in the name', () => {
+    render(
+      <List>
+        <ListItem
+          title="Security"
+          description="Password, two steps"
+          end={<span>New</span>}
+          href="/s"
+        />
+      </List>,
+    );
+    expect(screen.getByRole('link')).toHaveAccessibleName('Security');
+  });
+
+  it('wins with href over onSelect, which is not called, and warns once', async () => {
+    const warn = spyWarn();
+    const onSelect = vi.fn();
+    const tree = (
+      <List>
+        <ListItem title="Both" href="#x" onSelect={onSelect} />
+      </List>
+    );
+    const { rerender } = render(tree);
+    expect(screen.queryByRole('button')).toBeNull();
+    await userEvent.click(screen.getByRole('link', { name: 'Both' }));
+    expect(onSelect).not.toHaveBeenCalled();
+    rerender(tree);
+    expect(warn).toHaveBeenCalledTimes(1);
+    expect(warn).toHaveBeenCalledWith(expect.stringContaining(HREF_AND_ON_SELECT));
+  });
+});
+
+describe('renderLink', () => {
+  const TestLink = ({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
+    <a data-router="yes" {...props}>
+      {children}
+    </a>
+  );
+
+  it('is called with the props of the <a>, and what it returns is the title', () => {
+    const renderLink = vi.fn((props: ListItemLinkProps) => <TestLink {...props} />);
+    render(
+      <List>
+        <ListItem title="Profile" href="/profile" renderLink={renderLink} current />
+      </List>,
+    );
+    expect(renderLink).toHaveBeenCalledTimes(1);
+    expect(renderLink.mock.calls[0]![0]).toEqual({
+      href: '/profile',
+      className: 'flg-list-item-title',
+      children: 'Profile',
+      'aria-current': 'page',
+    });
+    const link = screen.getByRole('link', { name: 'Profile' });
+    expect(link).toHaveAttribute('data-router', 'yes');
+    expect(link).toHaveAttribute('href', '/profile');
+    expect(link).toHaveAttribute('aria-current', 'page');
+  });
+
+  it('is given no aria-current on a row that is not current', () => {
+    const renderLink = vi.fn((props: ListItemLinkProps) => <TestLink {...props} />);
+    render(
+      <List>
+        <ListItem title="Profile" href="/profile" renderLink={renderLink} />
+      </List>,
+    );
+    expect(renderLink.mock.calls[0]![0]).not.toHaveProperty('aria-current');
+  });
+
+  it('is not called for a disabled row, which gets the library link without href', () => {
+    const renderLink = vi.fn((props: ListItemLinkProps) => <TestLink {...props} />);
+    render(
+      <List>
+        <ListItem title="Billing" href="/billing" renderLink={renderLink} disabled />
+      </List>,
+    );
+    expect(renderLink).not.toHaveBeenCalled();
+    const link = screen.getByRole('link', { name: 'Billing' });
+    expect(link).not.toHaveAttribute('data-router');
+    expect(link).not.toHaveAttribute('href');
+  });
+
+  it('has no effect without href: the title is not a link, and it says so', () => {
+    const warn = spyWarn();
+    const renderLink = vi.fn((props: ListItemLinkProps) => <TestLink {...props} />);
+    render(
+      <List>
+        <ListItem title="Nowhere" renderLink={renderLink} />
+      </List>,
+    );
+    expect(renderLink).not.toHaveBeenCalled();
+    expect(screen.queryByRole('link')).toBeNull();
+    expect(warn).toHaveBeenCalledWith(expect.stringContaining(RENDER_LINK_WITHOUT_HREF));
+  });
+
+  it('is not called for a row without a title, which cannot be pressed', () => {
+    spyWarn();
+    const renderLink = vi.fn((props: ListItemLinkProps) => <TestLink {...props} />);
+    render(
+      <List>
+        <ListItem href="/x" renderLink={renderLink} />
+      </List>,
+    );
+    expect(renderLink).not.toHaveBeenCalled();
+  });
+});
+
+describe('disabled', () => {
+  it('makes a link <a role="link" aria-disabled="true"> with no href, so it is neither followed nor focused', async () => {
+    const { container } = render(
+      <List>
+        <ListItem title="Billing" href="/billing" disabled />
+      </List>,
+    );
+    const link = screen.getByRole('link', { name: 'Billing' });
+    expect(link.tagName).toBe('A');
+    expect(link).not.toHaveAttribute('href');
+    expect(link).toHaveAttribute('aria-disabled', 'true');
+    expect(link).toHaveClass('flg-list-item-title');
+    await userEvent.tab();
+    expect(link).not.toHaveFocus();
+    expect(rows(container)[0]).toHaveAttribute('data-disabled');
+  });
+
+  it('gives a button the native disabled attribute, and does not call onSelect', async () => {
+    const onSelect = vi.fn();
+    const { container } = render(
+      <List>
+        <ListItem title="Archive" onSelect={onSelect} disabled />
+      </List>,
+    );
+    const button = screen.getByRole('button', { name: 'Archive' });
+    expect(button).toBeDisabled();
+    await userEvent.click(button);
+    expect(onSelect).not.toHaveBeenCalled();
+    expect(rows(container)[0]).toHaveAttribute('data-disabled');
+  });
+
+  it('does nothing on a row that cannot be pressed', () => {
+    const { container } = render(
+      <List>
+        <ListItem title="Static" disabled />
+      </List>,
+    );
+    expect(rows(container)[0]).not.toHaveAttribute('data-disabled');
+    expect(part(rows(container)[0]!, 'title')).not.toHaveAttribute('aria-disabled');
+  });
+});
+
+describe('current', () => {
+  it('puts aria-current="page" on the link, and data-current on the <li>', () => {
+    const { container } = render(
+      <List>
+        <ListItem title="Profile" href="/p" current />
+        <ListItem title="Alerts" href="/a" />
+      </List>,
+    );
+    const [profile, alerts] = rows(container);
+    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('aria-current', 'page');
+    expect(profile).not.toHaveAttribute('aria-current');
+    expect(profile).toHaveAttribute('data-current');
+    expect(alerts).not.toHaveAttribute('data-current');
+    expect(screen.getByRole('link', { name: 'Alerts' })).not.toHaveAttribute('aria-current');
+  });
+
+  it('puts it on the button of a row with onSelect', () => {
+    render(
+      <List>
+        <ListItem title="Open" onSelect={() => {}} current />
+      </List>,
+    );
+    expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute('aria-current', 'page');
+  });
+
+  it('puts it on the <li> when the row cannot be pressed', () => {
+    const { container } = render(
+      <List>
+        <ListItem title="Here" current />
+      </List>,
+    );
+    const [row] = rows(container);
+    expect(row).toHaveAttribute('aria-current', 'page');
+    expect(row).toHaveAttribute('data-current');
+    expect(part(row!, 'title')).not.toHaveAttribute('aria-current');
+  });
+
+  it('keeps aria-current on the disabled link', () => {
+    render(
+      <List>
+        <ListItem title="Here" href="/h" current disabled />
+      </List>,
+    );
+    expect(screen.getByRole('link', { name: 'Here' })).toHaveAttribute('aria-current', 'page');
+  });
+});
+
+describe('data-interactive', () => {
+  it('is on the rows that can be pressed and on no other', () => {
+    const { container } = render(
+      <List>
+        <ListItem title="Static" description="d" end={<span>x</span>} />
+        <ListItem title="Link" href="/l" />
+        <ListItem title="Button" onSelect={() => {}} />
+        <ListItem>free</ListItem>
+      </List>,
+    );
+    expect(rows(container).map((row) => row.hasAttribute('data-interactive'))).toEqual([
+      false,
+      true,
+      true,
+      false,
+    ]);
+  });
+
+  it('is not on a disabled row, which does not react to the pointer', () => {
+    const { container } = render(
+      <List>
+        <ListItem title="Link" href="/l" disabled />
+        <ListItem title="Button" onSelect={() => {}} disabled />
+      </List>,
+    );
+    expect(rows(container).map((row) => row.hasAttribute('data-interactive'))).toEqual([
+      false,
+      false,
+    ]);
+  });
+});
+
+describe('warnings', () => {
+  it.each([
+    ['href', <ListItem key="h" href="/x" />],
+    ['onSelect', <ListItem key="o" onSelect={() => {}} />],
+    ['renderLink', <ListItem key="r" href="/x" renderLink={plainLink} />],
+    ['an empty title', <ListItem key="e" title={false} href="/x" />],
+  ])('warns that %s without a title leaves the row not pressable', (_label, item) => {
+    const warn = spyWarn();
+    const { container } = render(<List>{item}</List>);
+    expect(warn).toHaveBeenCalledWith(expect.stringContaining(NEEDS_TITLE));
+    expect(rows(container)[0]).not.toHaveAttribute('data-interactive');
+    expect(screen.queryByRole('link')).toBeNull();
+    expect(screen.queryByRole('button')).toBeNull();
+  });
+
+  it('does not warn for rows that are used as documented', () => {
+    const warn = spyWarn();
+    render(
+      <List>
+        <ListItem title="Static" description="d" />
+        <ListItem title="Link" href="/l" renderLink={plainLink} />
+        <ListItem title="Button" onSelect={() => {}} />
+        <ListItem>free content</ListItem>
+      </List>,
+    );
+    expect(warn).not.toHaveBeenCalled();
+  });
+
+  it('prints each warning once however often the rows render', () => {
+    const warn = spyWarn();
+    const tree = (
+      <List>
+        <ListItem href="/a" />
+        <ListItem href="/b" />
+        <ListItem title="x" href="/c" onSelect={() => {}} />
+        <ListItem title="y" href="/d" onSelect={() => {}} />
+      </List>
+    );
+    const { rerender } = render(tree);
+    rerender(tree);
+    expect(warn).toHaveBeenCalledTimes(2);
+  });
+});
diff --git a/src/index.test.ts b/src/index.test.ts
index 4c58800..fcc7766 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -58,6 +58,8 @@ describe('public API', () => {
       'FileUpload',
       'IconButton',
       'Input',
+      'List',
+      'ListItem',
       'MenuCheckboxItem',
       'MenuGroup',
       'MenuItem',
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 --project scripts src/components/list src/index.test.ts scripts/lib/theme-css.test.ts
```

Expected: FAIL.
- `List.test.tsx` không nạp được ở cả hai project React, nên 41 test không chạy: `Failed to resolve import "./List" from "src/components/list/List.test.tsx". Does the file exist?`.
- `List.test-d.ts` báo lỗi kiểu vì module chưa có.
- `theme values > keeps every light mockup token exactly as approved`: `list-card-shadow: expected undefined to be '0 1px 2px #0000000a, 0 6px 16px #3c5f…'`; bản `dark`: `list-card-shadow: expected undefined to be '0 6px 18px #00000047'`.
- `public API > exports exactly the documented components and nothing internal`: danh sách export chưa có `List`, `ListItem`. Bản nháp không thấy lỗi này (phát hiện 9).

Story viết cùng code; lần fail đầu có ý nghĩa của chúng là `LongText` trên CSS chưa có `min-width: 0` (phát hiện 6, 9). Móc của harness không có test tự động (phát hiện 7).

- [ ] **Step 3: Viết code**

````diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index fd15bdf..b59c923 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -313,19 +313,19 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | # | Điểm | Light | Dark | Ngưỡng | Tiêu chí WCAG |
 |---|---|---|---|---|---|
 | 1 | Viền control (input, ô checkbox, radio, switch tắt) so với nền | 1.28:1 | 1.31:1 | 3:1 | 1.4.11 |
-| 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus), và nút của bước Stepper | 1.20:1 | 1.23:1 | 3:1 | 1.4.11 |
+| 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus), và nút của bước Stepper, và hàng của List | 1.20:1 | 1.23:1 | 3:1 | 1.4.11 |
 | 3 | Viền Input/Textarea khi focus (control không lỗi) | đạt (4.45:1) | 2.06:1 | 3:1 | 1.4.11 |
 | 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
 | 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) và vạch dưới tab `underline` đang chọn, so với nền; thanh của bước đã xong (Stepper `bars`) | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
-| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin`; ở Stepper: số, tên và mô tả của bước chưa tới, mô tả của mọi bước, dòng "Step N" của bước chưa tới | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
-| 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn, trang hiện tại của Pagination; tiêu đề bước hiện tại của Stepper `compact` | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
-| 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn, trang hiện tại của Pagination; viên thuốc của bước hiện tại (Stepper `compact`) | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
-| 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ; dòng gợi ý của vùng thả FileUpload khi đang kéo; mô tả của bước hiện tại trong viên thuốc (Stepper `compact`) | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
+| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin`; ở Stepper: số, tên và mô tả của bước chưa tới, mô tả của mọi bước, dòng "Step N" của bước chưa tới; ở List: mô tả và chữ ở ô cuối của hàng | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
+| 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn, trang hiện tại của Pagination; tiêu đề bước hiện tại của Stepper `compact`, tiêu đề hàng hiện tại của List | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
+| 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn, trang hiện tại của Pagination; viên thuốc của bước hiện tại (Stepper `compact`), nền hàng hiện tại của List | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
+| 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ; dòng gợi ý của vùng thả FileUpload khi đang kéo; mô tả của bước hiện tại trong viên thuốc (Stepper `compact`), mô tả và chữ ở ô cuối của hàng hiện tại List | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
 | 10 | Chữ `--flg-danger` trên item `danger` đang được trỏ (nền danger 16%); tiêu đề và mô tả của bước lỗi trong viên thuốc (Stepper `compact`) | 4.24:1 | đạt (4.57:1) | 4.5:1 | 1.4.3 |
 | 11 | Ô checkbox đã chọn (màu nhấn) trên option đang được trỏ của Select chọn nhiều, so với nền `--flg-accent-subtle` của hàng | 2.61:1 | 1.91:1 | 3:1 | 1.4.11 |
-| 12 | Chữ `--flg-text-muted` của tab `segmented` trên rãnh `--flg-control-track` | 4.10:1 | 3.36:1 | 4.5:1 | 1.4.3 |
+| 12 | Chữ `--flg-text-muted` của tab `segmented` trên rãnh `--flg-control-track`; mô tả của hàng List bấm được khi hover (`inset`, `plain`; `cards` ở dark) | 4.10:1 | 3.36:1 | 4.5:1 | 1.4.3 |
 | 13 | Tab `segmented` đang chọn (nền `--flg-control-bg`) so với rãnh | 1.24:1 | 1.12:1 | 3:1 | 1.4.11 |
-| 14 | Icon và vạch của toast `info` (`--flg-accent-solid`) so với nền; viền 2px của dấu tròn bước hiện tại (Stepper `circles`) | đạt (3.04:1) | 2.29:1 | 3:1 | 1.4.11 |
+| 14 | Icon và vạch của toast `info` (`--flg-accent-solid`) so với nền; viền 2px của dấu tròn bước hiện tại (Stepper `circles`); viền 1.5px của hàng hiện tại (List `cards`) | đạt (3.04:1) | 2.29:1 | 3:1 | 1.4.11 |
 | 15 | Chấm vạch chia của Slider (`--flg-slider-tick`, 70% `--flg-text-muted`) so với nền | 2.88:1 | 2.82:1 | 3:1 | 1.4.11 |
 | 16 | Rãnh của Slider và của Progress (`--flg-control-track`) so với nền; thanh của bước chưa tới (Stepper `bars`) | 1.23:1 | 1.30:1 | 3:1 | 1.4.11 |
 | 17 | Núm của Slider (`--flg-control-thumb`) so với rãnh và với phần đã chọn | 1.29:1 | 2.24:1 | 3:1 | 1.4.11 |
@@ -342,7 +342,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 28 | Phần đã chạy của Progress `glow`, kể cả lớp ánh sáng trắng 24% ở nửa trên, so với rãnh | 1.62:1 | 1.74:1 | 3:1 | 1.4.11 |
 | 29 | Chữ `--flg-accent-text` trên bề mặt: giá trị của Progress `glow`; dòng "Step N" của bước xong và bước hiện tại (Stepper `bars`) | 3.95:1 | 4.44:1 | 4.5:1 | 1.4.3 |
 | 30 | Vòng của bước chưa tới (`--flg-stepper-ring`, 65% `--flg-text-muted`) so với nền: Stepper `circles` và `compact` | 2.63:1 | 2.63:1 | 3:1 | 1.4.11 |
-| 31 | Vạch `--flg-accent-solid` trên nền nhấn nhạt `--flg-selected-bg`: viền 2px của dấu tròn bước hiện tại, Stepper `compact` | 2.61:1 | 2.01:1 | 3:1 | 1.4.11 |
+| 31 | Vạch `--flg-accent-solid` trên nền nhấn nhạt `--flg-selected-bg`: viền 2px của dấu tròn bước hiện tại, Stepper `compact`; vạch 3px của hàng hiện tại, List `inset` | 2.61:1 | 2.01:1 | 3:1 | 1.4.11 |
 
 Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Điểm 14 là icon `info` của toast theo mockup toast S2 (giai đoạn 2, Plan E1). Điểm 6 còn là chữ mờ của option Combobox đang lọc và dòng trạng thái (giai đoạn 3, Plan B) và chữ hàng thứ của Calendar (giai đoạn 3, Plan C): cùng cặp màu, nên cùng số đo. Điểm 18 là ngày của tháng khác theo mockup K1 (giai đoạn 3, Plan C), nửa độ mờ nên thấp hơn hẳn chữ mờ thường. Điểm 15–17 là chấm vạch, rãnh và núm của Slider theo mockup S3 (giai đoạn 3, Plan A). Điểm 19–22 là viền vùng thả, nút chọn tệp, cỡ tệp và dòng gợi ý của FileUpload theo mockup F1 (giai đoạn 3, Plan D); dòng gợi ý khi đang kéo (chữ mờ trên nền nhấn) cùng cặp màu với điểm 9, nên được ghi ở điểm 9 (phát hiện khi review cuối Plan D). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
 
@@ -350,7 +350,7 @@ Các số được **làm tròn xuống** 2 chữ số thập phân, và là đ
 
 Điểm 27–29 là Progress theo mockup P1–P3 (giai đoạn 4, Plan A): phần đã chạy so với rãnh (điểm 27 cho `thin` và `inline`, điểm 28 cho `glow` có thêm lớp ánh sáng), và giá trị của `glow` (điểm 29). Số của điểm 27 và 28 là thấp nhất trong các điểm màu của phần đã chạy (gradient nhấn, `success`, `danger`) và trên mọi nền tham chiếu. Giá trị của `thin` là chữ `--flg-text-muted` trên bề mặt, cùng cặp màu với điểm 6, và rãnh của Progress cùng cặp màu với điểm 16, nên được ghi ở đó. Ở `prefers-contrast: more` rãnh có viền và `glow` bỏ ánh sáng, nên cả ba điểm đều đạt.
 
-Điểm 30–31 là Stepper theo mockup St1–St3 (giai đoạn 4, Plan B): vòng của bước chưa tới (điểm 30, `circles` và `compact`) và viền dấu tròn của bước hiện tại trên viên thuốc của `compact` (điểm 31; Plan B chỉ ghi phần Stepper). Số của bước hiện tại (`--flg-accent-text` trên `--flg-control-bg`, và trên dấu tròn trong viên thuốc) cùng cặp màu với điểm 26 nên được ghi ở đó; dấu ✓ của bước đã xong đạt (3.40 light, 3.59 dark), nên không phải ngoại lệ. Các vị trí khác của Stepper cùng cặp màu với các điểm 2, 5, 6, 7, 8, 9, 10, 14, 16, 27 và 29, nên được ghi ở đó. Ở `prefers-contrast: more` vòng thành màu đặc, thanh chưa tới có viền và viên thuốc của bước hiện tại là màu nhấn đặc, nên cả hai điểm đều đạt.
+Điểm 30–31 là Stepper và List theo mockup St1–St3 và L1–L3 (giai đoạn 4, Plan B): vòng của bước chưa tới (điểm 30, `circles` và `compact`) và viền dấu tròn của bước hiện tại trên viên thuốc của `compact`, cùng vạch 3px của hàng hiện tại List `inset` trên nền hàng (điểm 31, cùng cặp màu nên cùng số đo). Số của bước hiện tại (`--flg-accent-text` trên `--flg-control-bg`, và trên dấu tròn trong viên thuốc) cùng cặp màu với điểm 26 nên được ghi ở đó; dấu ✓ của bước đã xong đạt (3.40 light, 3.59 dark), nên không phải ngoại lệ. Các vị trí khác của Stepper cùng cặp màu với các điểm 2, 5, 6, 7, 8, 9, 10, 14, 16, 27 và 29, nên được ghi ở đó. Ở `prefers-contrast: more` vòng thành màu đặc, thanh chưa tới có viền và viên thuốc của bước hiện tại là màu nhấn đặc, nên cả hai điểm đều đạt. Các vị trí khác của List cùng cặp màu với các điểm 2 (vòng focus vẽ trên hàng), 6 (mô tả và chữ ở ô cuối), 7 và 8 (tiêu đề và nền của hàng hiện tại), 9 (mô tả và chữ ở ô cuối của hàng hiện tại), 12 (mô tả của hàng bấm được khi hover) và 14 (viền 1.5px của `cards`), nên được ghi ở đó. Ở `prefers-contrast: more` hàng hiện tại là màu nhấn đặc, mọi chữ trong hàng và vạch của `inset` lấy `--flg-selected-text`, và hàng không đổi nền khi hover, nên điểm 31 đạt.
 
 Cả ba mươi mốt điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
 
diff --git a/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md b/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md
index ade2eab..558cf83 100644
--- a/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md
+++ b/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md
@@ -376,12 +376,13 @@ Trong mục này, "màu trạng thái" của Alert và Progress là: `info` →
 - **Hàng:** `position: relative`, `flex`, căn giữa dọc, khoảng cách 12px, `box-sizing: border-box`, padding `8px 12px`, `--flg-text-sm`. Cao tối thiểu 52px (`size` `md`, danh sách thành viên của mockup) hoặc 44px (`size` `sm`, danh sách điều hướng của mockup).
 - **Ô đầu** (`start`): `inline-flex`, căn giữa, không co, tối thiểu 32×32px, màu `--flg-text-muted`; icon con trực tiếp 18px. Avatar `md` (32px) vừa đúng ô.
 - **Cột giữa:** chiếm phần còn lại, `min-width: 0`, cột dọc, khoảng cách 2px.
-  - Tiêu đề: màu `--flg-text`, đậm `--flg-weight-medium`, `line-height: 1.3`, không gạch chân.
+  - Tiêu đề: màu `--flg-text`, đậm `--flg-weight-medium`, `line-height: 1.3`, không gạch chân; một dòng, dài thì "…" như mô tả (phát hiện khi lập Plan B: không cắt thì tiêu đề dài đẩy ô cuối ra ngoài hàng).
   - Mô tả: `--flg-text-xs`, `line-height: 1.35`, màu `--flg-text-muted`, một dòng, dài thì "…".
 - **Ô cuối** (`end`): `inline-flex`, căn giữa dọc, khoảng cách 8px, không co, màu `--flg-text-muted`, `--flg-text-xs`; icon con trực tiếp 16px. Mọi phần tử tương tác trong ô cuối (`a`, `button`, `input`, `select`, `textarea`, `[tabindex]`) có `position: relative; z-index: 1`, để nằm trên liên kết kéo giãn; `Button` trong ô cuối có margin `-4px -6px -4px 0`.
-- **Liên kết kéo giãn:** tiêu đề là `<a>` hoặc `<button>` (§6.3) với `::after` phủ kín cả hàng (`position: absolute; inset: 0`), bo theo hàng; nó tự bỏ `outline` vì vòng focus vẽ trên hàng.
+- **Liên kết kéo giãn:** tiêu đề là `<a>` hoặc `<button>` (§6.3) với `::after` phủ kín cả hàng (`position: absolute; inset: 0`), bo theo hàng; nó tự bỏ `outline` vì vòng focus vẽ trên hàng. Mức bo là biến `--flg-list-item-radius` mà mỗi variant đặt trên hàng (phát hiện khi lập Plan B: `border-radius: inherit` như mockup lấy từ tiêu đề, vốn không bo, nên vùng bấm vuông góc). Tiêu đề không có `position`, nên `overflow: hidden` của nó không cắt lớp phủ.
+- **Gốc** có `min-width: 0` (phát hiện khi lập Plan B): List là một mục của hàng flex cạnh một ô khác thì co về phần còn lại, không bị chữ dài đẩy rộng hơn khung. Story `no-visual` đo cả khối lẫn hàng flex.
 - **Hàng hiện tại** (`current`): tiêu đề màu `--flg-selected-text`, đậm `--flg-weight-semibold`; ô đầu màu `--flg-selected-text`.
-- **Hàng disabled:** cả hàng `opacity: .5`; tiêu đề `cursor: not-allowed`.
+- **Hàng disabled:** cả hàng `opacity: .5`; tiêu đề `cursor: not-allowed`. Hàng disabled không mang `data-interactive` (chỉ hàng bấm được và không disabled mới có), nên không đổi khi rê chuột; nó mang `data-disabled`.
 - **Hover:** chỉ hàng bấm được và không disabled (`data-interactive`), khi `@media (hover: hover)`. Mockup chỉ vẽ hover trên một hàng liên kết; hàng tĩnh không đổi khi rê chuột (Claude chốt). Ở `prefers-contrast: more` hàng không đổi nền khi hover (`cards` vẫn nổi lên và đậm bóng), cùng lý do với hàng của Table: một Badge `accent` ở ô cuối chỉ còn 3.99:1 light trên nền hover ở chế độ đó (Claude chốt, phát hiện khi đọc soát spec).
 - **Focus:** vòng focus chung vẽ trên hàng khi tiêu đề khớp `:focus-visible` (`.flg-list-item:has(> .flg-list-item-main > .flg-list-item-title:focus-visible)`), như `.mk-focus` của mockup.
 
@@ -389,7 +390,7 @@ Trong mục này, "màu trạng thái" của Alert và Progress là: `info` →
 
 - Gốc là một `Surface` (lớp `flg-surface`: kính, bo `--flg-radius-lg`, viền gradient 1px), padding 0.
 - Đường ngăn: `::before` của mỗi hàng trừ hàng đầu, cao 1px, sát mép trên, từ 56px (sau ô đầu 32px: 12 + 32 + 12) tới mép phải, màu `--flg-control-border`. Hàng không có ô đầu thì đường bắt đầu từ 12px (Claude chốt; mockup luôn có ô đầu).
-- Hàng đầu bo hai góc trên, hàng cuối bo hai góc dưới, bằng `calc(var(--flg-radius-lg) - 1px)`, để nền hover và nền hàng hiện tại khớp góc trong của khối.
+- Hàng đầu bo hai góc trên, hàng cuối bo hai góc dưới, bằng `calc(var(--flg-radius-lg) - 1px)`, để nền hover và nền hàng hiện tại khớp góc trong của khối. Danh sách chỉ có một hàng thì hàng đó bo cả bốn góc (phát hiện khi lập Plan B; mockup luôn có nhiều hàng).
 - Hover: nền `--flg-control-track`.
 - Hàng hiện tại: nền `--flg-selected-bg`; vạch `::after` ở mép trái, cách trên và dưới 8px, rộng 3px, bo `0 3px 3px 0`, màu `--flg-accent-solid`.
 - Focus: hàng có focus có `z-index: 1`, để vòng focus tràn ra ngoài khối mà không bị hàng bên cạnh che (mockup ghi nhận vòng focus tràn ra ngoài khối).
@@ -646,9 +647,9 @@ Giai đoạn 4 không thêm module mới vào `src/internal/` ngoài các icon 
   - `Step` được render ngoài `Stepper`. Lời cảnh báo nêu nguyên nhân hay gặp nhất và cách sửa (Claude chốt, phát hiện khi đọc soát spec; §3.1): "<Step> rendered outside <Stepper>. Write the Steps in the same component that renders the Stepper: Steps passed from a Server Component into a client component arrive already rendered, and the Stepper cannot read them."
   - `Stepper` không đọc được bước nào (Claude chốt, cùng lý do): "<Stepper> has no steps. Its children must be <Step> elements written in the component that renders the Stepper (not passed in from a Server Component)." Stepper khi đó render một `<ol>` rỗng.
 - List:
-  - `ListItem` có cả `href` lẫn `onSelect` (`href` thắng).
-  - `href`, `onSelect` hay `renderLink` mà không có `title` (hàng không bấm được, vì liên kết kéo giãn cần tiêu đề).
-  - `renderLink` mà không có `href`.
+  - `ListItem` có cả `href` lẫn `onSelect` (`href` thắng): "<ListItem> has both href and onSelect; the href wins and onSelect is ignored."
+  - `href`, `onSelect` hay `renderLink` mà không có `title` (hàng không bấm được, vì liên kết kéo giãn cần tiêu đề): "<ListItem> href, onSelect and renderLink need a title: the link or button is the title, stretched over the row. Without one the row is not pressable." Lời cảnh báo không chứa giá trị, để `devWarn` gộp được các lần lặp của nhiều hàng.
+  - `renderLink` mà không có `href`: "<ListItem> renderLink has no effect without href."
 - Table: khung cuộn được mà không có tên (không có `TableCaption`, `aria-label` hay `aria-labelledby`); `sort` không có `onSort` thì không cảnh báo (đó là chỉ báo tĩnh, §6.3).
 - Alert: không có cảnh báo mới.
 
@@ -898,7 +899,7 @@ type ListItemProps = Omit<LiHTMLAttributes<HTMLLIElement>, 'title' | 'onSelect'
   - Không có hai prop đó → `<span>`.
   - Liên kết kéo giãn (`::after`) phủ cả hàng, nên bấm đâu trong hàng cũng là bấm tiêu đề; phần tử tương tác trong ô cuối nằm trên lớp phủ nên vẫn bấm riêng được, và không có phần tử tương tác nào lồng nhau.
 - **`current`:** `aria-current="page"` trên tiêu đề khi hàng bấm được, trên `<li>` khi không; hàng có `data-current`.
-- **`disabled`** (chỉ có tác dụng ở hàng bấm được): link thành `<a role="link" aria-disabled="true">` không có `href`, nên không đi theo và không nhận focus (như mũi tên ở đầu của Pagination); nút có `disabled` gốc.
+- **`disabled`** (chỉ có tác dụng ở hàng bấm được): link thành `<a role="link" aria-disabled="true">` không có `href`, nên không đi theo và không nhận focus (như mũi tên ở đầu của Pagination); nút có `disabled` gốc. **Hàng disabled không gọi `renderLink`** (Claude chốt, phát hiện khi lập Plan B): link của router cần một đích để đi tới, nên hàng disabled luôn dùng `<a>` của lib, như Pagination ở hai đầu. `renderLink` và docs nói rõ điều này.
 - **Screen reader:** tên của link hay nút là tiêu đề; mô tả và ô cuối được đọc khi duyệt nội dung, không nằm trong tên (Claude chốt: List là server-safe nên không sinh id cho `aria-describedby`). Docs khuyên đặt chữ quan trọng trong `title`.
 - **Hạn chế đã biết** (docs ghi): liên kết kéo giãn làm khó bôi đen chữ trong hàng.
 
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 62f0d27..f695de9 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -149,6 +149,13 @@ const SHIPPED_CLASSES = [
   'flg-step-caption',
   'flg-step-title',
   'flg-step-description',
+  'flg-list',
+  'flg-list-item',
+  'flg-list-item-start',
+  'flg-list-item-main',
+  'flg-list-item-title',
+  'flg-list-item-description',
+  'flg-list-item-end',
 ];
 
 const requirements: Array<[string, boolean]> = [
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 67c8c90..7de124a 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -27,7 +27,8 @@ const D = {
   2: {
     description:
       'Focus ring on Button, IconButton, Checkbox, Radio and Switch, on the button of a Stepper ' +
-      'step, and on an invalid Input or Textarea, whose border stays red while focused',
+      'step, on a row of a List, and on an invalid Input or Textarea, whose border stays red while ' +
+      'focused',
     criterion: '1.4.11',
   },
   3: {
@@ -49,27 +50,29 @@ const D = {
     description:
       'Muted text on the brightest reference backdrop, the muted text of a Combobox option ' +
       'while filtering and of its status row, the weekday row of a Calendar, the value of a ' +
-      'Progress `thin`, and in a Stepper the number, title and description of a step not reached, ' +
-      'the description of every step and the "Step N" line of a step not reached',
+      'Progress `thin`, in a Stepper the number, title and description of a step not reached, the ' +
+      'description of every step and the "Step N" line of a step not reached, and in a List the ' +
+      'description and the end cell of a row',
     criterion: '1.4.3',
   },
   7: {
     description:
       'Accent text on the accent wash: an accent Badge, a selected pill tab, the current page, the ' +
-      'title of the current step of a Stepper `compact`',
+      'title of the current step of a Stepper `compact`, the title of the current row of a List',
     criterion: '1.4.3',
   },
   8: {
     description:
       'The accent wash against the panel or surface: a highlighted menu item or Select option, a ' +
-      'selected pill tab, the current page, the pill of the current step of a Stepper `compact`',
+      'selected pill tab, the current page, the pill of the current step of a Stepper `compact`, ' +
+      'the background of the current row of a List',
     criterion: '1.4.11',
   },
   9: {
     description:
       'Muted icon, shortcut and submenu chevron on a highlighted menu item or option, the hint ' +
-      'of a FileUpload zone while files are over it, and the description of the current step of a ' +
-      'Stepper `compact`',
+      'of a FileUpload zone while files are over it, the description of the current step of a ' +
+      'Stepper `compact`, and the description and end cell of the current row of a List',
     criterion: '1.4.3, 1.4.11',
     minimum: '4.5:1 shortcut text, 3:1 icons',
   },
@@ -85,12 +88,18 @@ const D = {
       'accent wash of the row',
     criterion: '1.4.11',
   },
-  12: { description: 'Muted text of a segmented tab on its track', criterion: '1.4.3' },
+  12: {
+    description:
+      'Muted text of a segmented tab on its track, and the description of a row of a List that can ' +
+      'be pressed, under the pointer (`inset` and `plain`; `cards` in dark)',
+    criterion: '1.4.3',
+  },
   13: { description: 'Selected segmented tab against its track', criterion: '1.4.11' },
   14: {
     description:
-      'The icon and bar of an info toast, and the 2px border of the dot of the current step in a ' +
-      'Stepper `circles`, against the surface',
+      'The icon and bar of an info toast, the 2px border of the dot of the current step in a ' +
+      'Stepper `circles`, and the 1.5px outline of the current row of a List `cards`, against the ' +
+      'surface',
     criterion: '1.4.11',
   },
   15: { description: 'Tick dots under a Slider track, against the surface', criterion: '1.4.11' },
@@ -171,8 +180,8 @@ const D = {
   },
   31: {
     description:
-      'The accent line on the accent wash of the current step: the border of its dot in a Stepper ' +
-      '`compact`',
+      'The accent line on the accent wash of the current step or row: the border of the dot of the ' +
+      'current step in a Stepper `compact`, and the bar of the current row of a List `inset`',
     criterion: '1.4.11',
   },
 } as const satisfies Record<number, ExceptionRowInfo>;
diff --git a/scripts/rsc-probe.mjs b/scripts/rsc-probe.mjs
index 7477667..aeef8ea 100644
--- a/scripts/rsc-probe.mjs
+++ b/scripts/rsc-probe.mjs
@@ -200,6 +200,45 @@ const CASES = [
     },
     expect: { type: 'ol', className: 'flg-stepper' },
   })),
+  // A List with a link row and a static row. The rows are rendered by the probe as React would, so a
+  // hook or a context in either part fails here; `renderLink` runs on the server too.
+  {
+    label: 'List with a link row and a static row',
+    file: '../dist/components/list/List.js',
+    exportName: 'List',
+    element: async (C) => {
+      const { ListItem } = await import(
+        new URL('../dist/components/list/List.js', import.meta.url)
+      );
+      return createElement(
+        C,
+        null,
+        createElement(ListItem, { title: 'Profile', href: '/profile', current: true }),
+        createElement(ListItem, { title: 'Ada', description: 'ada@example.com', end: 'Admin' }),
+      );
+    },
+    expect: { type: 'ul', className: 'flg-list flg-surface' },
+  },
+  {
+    label: 'List cards with renderLink',
+    file: '../dist/components/list/List.js',
+    exportName: 'List',
+    element: async (C) => {
+      const { ListItem } = await import(
+        new URL('../dist/components/list/List.js', import.meta.url)
+      );
+      return createElement(
+        C,
+        { variant: 'cards', size: 'sm' },
+        createElement(ListItem, {
+          title: 'Profile',
+          href: '/profile',
+          renderLink: (props) => createElement('a', { ...props, 'data-router': '' }),
+        }),
+      );
+    },
+    expect: { type: 'ul', className: 'flg-list' },
+  },
 ];
 
 let failed = 0;
diff --git a/src/components/list/List.mdx b/src/components/list/List.mdx
new file mode 100644
index 0000000..3f24b60
--- /dev/null
+++ b/src/components/list/List.mdx
@@ -0,0 +1,150 @@
+import { Canvas, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './List.stories';
+
+<Meta of={Stories} />
+
+# List
+
+Rows to read, such as the members of a team or the pages of a settings area, with the rows that lead
+somewhere pressable anywhere on them. It is a list of things to show, not a listbox that chooses a
+value: it has no selection, and no state of its own.
+
+```tsx
+import { Avatar, Badge, List, ListItem } from 'h2d-glass-ui';
+
+<List aria-label="Team members">
+  <ListItem
+    start={<Avatar alt="" fallback="AL" />}
+    title="Ada Lovelace"
+    description="ada@example.com"
+    end={<Badge variant="accent">Admin</Badge>}
+  />
+  <ListItem title="Grace Hopper" href="/members/grace" />
+</List>;
+```
+
+<Canvas of={Stories.Inset} />
+
+## Props
+
+### List
+
+| Prop      | Type                            | Default   | Does                              |
+| --------- | ------------------------------- | --------- | --------------------------------- |
+| `variant` | `'inset' \| 'cards' \| 'plain'` | `'inset'` | The look (see Variants)           |
+| `size`    | `'sm' \| 'md'`                  | `'md'`    | The height of a row: 44px or 52px |
+
+`ref`, `className`, `style` and the other attributes of a `ul` go to the list. It carries
+`role="list"`, since Safari drops the list semantics of a list that has `list-style: none`.
+
+### ListItem
+
+| Prop                 | Type                                             | Does                                                                              |
+| -------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
+| `title`              | `ReactNode`                                      | The name of the row, and the link or button when the row can be pressed           |
+| `description`        | `ReactNode`                                      | A line under the title, cut short with an ellipsis when it is too long            |
+| `start`              | `ReactNode`                                      | The cell before the text: an `Avatar` or an icon (18px)                           |
+| `end`                | `ReactNode`                                      | The cell after the text: a `Badge`, a date, a chevron (16px) or a button          |
+| `href`               | `string`                                         | Makes the title a link                                                            |
+| `renderLink`         | `(props: ListItemLinkProps) => ReactElement`     | Renders that link, for a router (see Links in a router)                           |
+| `onSelect`           | `(event: MouseEvent<HTMLButtonElement>) => void` | Makes the title a button. When there is an `href` it is ignored                   |
+| `current`            | `boolean`                                        | Marks the row of the page the person is on                                        |
+| `disabled`           | `boolean`                                        | Only has an effect on a row that can be pressed                                   |
+| `children`           | `ReactNode`                                      | After the description in the main column; the free content of a row with no title |
+| `className`, `style` | `string`, `CSSProperties`                        | Go to the `li`, with `ref` and the other attributes of an `li`                    |
+
+A slot that renders nothing (`false`, `null`, `''`, an empty array or an empty fragment) is left out,
+and so is the cell or column that would have held it. `0` is something and is kept.
+
+A row can be pressed when it has an `href` or an `onSelect` **and a `title`**: the link or button is
+the title, stretched over the whole row. In development, an `href`, `onSelect` or `renderLink` with no
+`title` is warned about, and so is a row with both `href` and `onSelect` (the `href` wins).
+
+## Pressing a row
+
+A press anywhere on a row that can be pressed is a press of its title: on the icon, the description
+or the empty part of the row. What you put in `end` and can be pressed (a button, a link, an input) sits
+above that cover, and is pressed by itself, so there is never a button inside a link. Only a row that
+can be pressed reacts to the pointer; a static row does not change when it is hovered.
+
+The one thing this takes from the person is selecting the text of a row with the mouse, which the
+cover gets in the way of.
+
+<Canvas of={Stories.PressAnywhere} />
+
+## Links in a router
+
+`renderLink` receives the props of the `<a>` (`href`, `className`, `children`, and `aria-current` on the
+current row) and returns the element to render. Pass every prop on:
+
+```tsx
+import Link from 'next/link';
+
+<ListItem title="Profile" href="/settings/profile" renderLink={(props) => <Link {...props} />} />;
+```
+
+List is safe in a Server Component, and `renderLink` runs there too, so a `Link` of the router works
+in a page that is not a client component.
+
+A **disabled** row does not call `renderLink`. It gets the library's own `<a role="link"
+aria-disabled="true">` with no `href`: a router link needs somewhere to go, and a disabled row goes
+nowhere. Without an `href` a link is neither followed nor given the focus, and `role="link"` keeps its
+name and state readable.
+
+## Variants
+
+- `variant="inset"` (default): one block of glass with a rule between the rows, the way a grouped list
+  looks on a phone. The rule starts after the start cell. The hovered row takes a grey background and the
+  current row the accent wash with a 3px bar on its edge. It is a `Surface`, so it is the one for
+  settings and navigation.
+- `variant="cards"`: a pane of glass for each row, set 6px apart. A hovered row lifts by 1px and its
+  shadow deepens. Each row has its own `backdrop-filter`, which costs more than the others: use it for a
+  short list, about ten rows or fewer, and `inset` or `plain` for a long one.
+- `variant="plain"`: flat rows with no rule, for a list that sits on a card. The list is 8px wider than
+  its container on each side, so that the hover background runs into the padding of the card while the
+  text stays in line with what is around it.
+
+<Canvas of={Stories.Cards} />
+<Canvas of={Stories.Plain} />
+
+## Sizes
+
+`size="md"` (52px) fits a list of people with an avatar and two lines. `size="sm"` (44px) is for a
+navigation list with one line to a row.
+
+## Long text
+
+The title and the description are one line each and are cut short with an ellipsis; the end cell keeps
+its place and its width. A List in a flex row, beside a button or an avatar, shrinks to what is left
+(`min-width: 0`) instead of pushing the row wider.
+
+<Canvas of={Stories.LongText} />
+
+## Accessibility
+
+- It is a list. The name of a link or button is the title alone; the description and the end cell are
+  read when the person browses the content, and are not part of the name. Put what matters in the
+  `title`.
+- `aria-current="page"` is on the link or button of the current row, since a screen reader reads it from
+  the element that has the focus, and on the `li` for a row that cannot be pressed.
+- A disabled row is `aria-disabled` (a link) or `disabled` (a button), is half faded, and shows a
+  `not-allowed` cursor over the whole row.
+- The focus ring is drawn on the row. In `cards` it replaces the shadow of the card, and on a row that
+  is both current and focused the focus outline is the one that shows.
+- With `prefers-contrast: more` the current row is the solid accent and everything in it takes that
+  accent's text colour, and a row does not change its background under the pointer. A Badge or a button
+  you put in the current row keeps its own colours, so keep that row to text and icons.
+- The bar of an `inset` current row, 3px of the accent on its wash, is 2.61:1 in light and 2.01:1 in
+  dark (row 31 of the table on the Accessibility page); the title, the wash and the rest of the row's
+  colours are the pairs of rows 2, 6 to 9, 12 and 14. In forced colours the rule between rows is the
+  text colour, the current row has a 2px outline in the selection colour, a disabled row is grey, and
+  each card of `cards` is a plain panel with a border.
+
+## Do and don't
+
+- Do give every row that can be pressed a `title`: the link or button is the title.
+- Do use `size="sm"` for navigation and `renderLink` for the links of a router.
+- Do keep the current row to text and icons.
+- Don't use `cards` for a long list.
+- Don't put a long description in `title`: it is cut to one line.
+- Don't use a List to choose a value; use `Select` or `RadioGroup`.
diff --git a/src/components/list/List.tsx b/src/components/list/List.tsx
new file mode 100644
index 0000000..cb2f610
--- /dev/null
+++ b/src/components/list/List.tsx
@@ -0,0 +1,181 @@
+import { clsx } from 'clsx';
+import { forwardRef } from 'react';
+import type {
+  AnchorHTMLAttributes,
+  HTMLAttributes,
+  LiHTMLAttributes,
+  MouseEvent,
+  ReactElement,
+  ReactNode,
+} from 'react';
+import { dataAttr } from '../../internal/data-attr';
+import { hasContent } from '../../internal/has-content';
+import { devWarn } from '../../internal/warn';
+
+export type ListVariant = 'inset' | 'cards' | 'plain';
+
+export type ListProps = HTMLAttributes<HTMLUListElement> & {
+  variant?: ListVariant;
+  size?: 'sm' | 'md';
+};
+
+/** What the library puts on the `<a>` of a link row, for `renderLink` to pass on. */
+export type ListItemLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
+  href: string;
+  className: string;
+  children: ReactNode;
+};
+
+export type ListItemProps = Omit<
+  LiHTMLAttributes<HTMLLIElement>,
+  'title' | 'onSelect' | 'value'
+> & {
+  /** The name of the row, and the link or button that a pressable row stretches over itself. */
+  title?: ReactNode;
+  description?: ReactNode;
+  /** The cell before the text: an Avatar or an icon. */
+  start?: ReactNode;
+  /** The cell after the text: a Badge, a date, a chevron or a button. */
+  end?: ReactNode;
+  /** Makes the title a link. Needs a `title`. */
+  href?: string;
+  /**
+   * Renders the link of a row that has an `href`, for a router's `Link`:
+   * `renderLink={(props) => <Link {...props} />}`. Pass every prop on. It is not called for a
+   * disabled row, which gets the library's own `<a role="link" aria-disabled="true">` without an
+   * `href`: a router link needs somewhere to go. Ignored, with a warning, without `href`.
+   */
+  renderLink?: (props: ListItemLinkProps) => ReactElement;
+  /** Makes the title a button. Ignored when there is an `href`. Needs a `title`. */
+  onSelect?: (event: MouseEvent<HTMLButtonElement>) => void;
+  /** The row of the page the person is on. */
+  current?: boolean;
+  /** Only has an effect on a row that can be pressed. */
+  disabled?: boolean;
+};
+
+/**
+ * A list of rows to read, in one of three looks, with the rows that lead somewhere pressable
+ * anywhere on them. It is a list of things to show, not a listbox that chooses a value. It has no
+ * state and no hook, so it renders in a Server Component.
+ */
+export const List = forwardRef<HTMLUListElement, ListProps>(function List(
+  { variant = 'inset', size = 'md', className, ...props },
+  ref,
+) {
+  return (
+    // Safari drops the list semantics of a list with `list-style: none`, so the role says it again.
+    // eslint-disable-next-line jsx-a11y/no-redundant-roles
+    <ul
+      ref={ref}
+      role="list"
+      className={clsx('flg-list', variant === 'inset' && 'flg-surface', className)}
+      data-variant={variant}
+      data-size={size}
+      {...props}
+    />
+  );
+});
+
+/**
+ * One row of a List: a cell before, a column with the title and the description, and a cell after.
+ * The title of a pressable row is its link or button, and covers the whole row, so a press anywhere
+ * on the row is a press of the title. What sits in `end` and can be pressed is above that cover.
+ */
+export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(function ListItem(
+  {
+    title,
+    description,
+    start,
+    end,
+    href,
+    renderLink,
+    onSelect,
+    current = false,
+    disabled = false,
+    className,
+    children,
+    ...props
+  },
+  ref,
+) {
+  const hasTitle = hasContent(title);
+  const pressable = href !== undefined || onSelect !== undefined;
+  if (href !== undefined && onSelect !== undefined) {
+    devWarn('<ListItem> has both href and onSelect; the href wins and onSelect is ignored.');
+  }
+  if ((pressable || renderLink) && !hasTitle) {
+    devWarn(
+      '<ListItem> href, onSelect and renderLink need a title: the link or button is the title, stretched over the row. Without one the row is not pressable.',
+    );
+  }
+  if (renderLink && href === undefined) {
+    devWarn('<ListItem> renderLink has no effect without href.');
+  }
+  const interactive = pressable && hasTitle;
+  const currentMark = current ? ({ 'aria-current': 'page' } as const) : undefined;
+
+  let titleElement: ReactNode = null;
+  if (hasTitle) {
+    const titleClass = 'flg-list-item-title';
+    if (!interactive) {
+      titleElement = <span className={titleClass}>{title}</span>;
+    } else if (href === undefined) {
+      titleElement = (
+        <button
+          type="button"
+          className={titleClass}
+          disabled={disabled}
+          onClick={onSelect}
+          {...currentMark}
+        >
+          {title}
+        </button>
+      );
+    } else if (disabled) {
+      // An <a> without href has no role of its own, so its name and state would not be read.
+      titleElement = (
+        <a role="link" aria-disabled="true" className={titleClass} {...currentMark}>
+          {title}
+        </a>
+      );
+    } else {
+      const linkProps: ListItemLinkProps = {
+        href,
+        className: titleClass,
+        children: title,
+        ...currentMark,
+      };
+      // The content is in `children`, which the linter cannot see through the object.
+      // eslint-disable-next-line jsx-a11y/anchor-has-content
+      titleElement = renderLink ? renderLink(linkProps) : <a {...linkProps} />;
+    }
+  }
+
+  const showMain = hasTitle || hasContent(description) || hasContent(children);
+  return (
+    <li
+      ref={ref}
+      className={clsx('flg-list-item', className)}
+      data-interactive={dataAttr(interactive && !disabled)}
+      data-current={dataAttr(current)}
+      data-disabled={dataAttr(interactive && disabled)}
+      // A screen reader reads `aria-current` from the element that has the focus, so a row with a
+      // link or button has it there, and the rest of the rows on the <li>.
+      {...(interactive ? undefined : currentMark)}
+      {...props}
+    >
+      {hasContent(start) ? <span className="flg-list-item-start">{start}</span> : null}
+      {showMain ? (
+        <span className="flg-list-item-main">
+          {titleElement}
+          {hasContent(description) ? (
+            <span className="flg-list-item-description">{description}</span>
+          ) : null}
+          {children}
+        </span>
+      ) : null}
+      {hasContent(end) ? <span className="flg-list-item-end">{end}</span> : null}
+    </li>
+  );
+});
diff --git a/src/components/list/index.ts b/src/components/list/index.ts
new file mode 100644
index 0000000..c8c78f1
--- /dev/null
+++ b/src/components/list/index.ts
@@ -0,0 +1,2 @@
+export { List, ListItem } from './List';
+export type { ListItemLinkProps, ListItemProps, ListProps, ListVariant } from './List';
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index 7379f58..acc618d 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -61,8 +61,15 @@ application's responsibility.
   surroundings are inert. Changes your code makes to `value` are not announced.
 
 The contrast gaps of the Slider (rows 15 to 17), Calendar (row 18), FileUpload (rows 19 to 22),
-Alert (rows 23 to 26), Progress (rows 27 to 29) and Stepper (rows 30 and 31, and its part in rows 26,
-27 and 29) are in the table above, which is built from the same data CI checks.
+Alert (rows 23 to 26), Progress (rows 27 to 29), Stepper (rows 30 and 31, and its part in rows 26,
+27 and 29) and List (its part in row 31) are in the table above, which is built from the same data CI
+checks.
+
+A List row that can be pressed has one link or button, the title, stretched over the whole row. It
+is named by the title alone: the description and the end cell are read when the person browses the
+content, and are not part of the name, so put what matters in `title`. With `prefers-contrast: more`
+the current row is the solid accent and everything in it takes that accent's text colour; a Badge or
+button you put in a current row keeps its own colours, so keep that row to text and icons.
 
 ## A `<dialog>` the library did not create
 
diff --git a/src/index.ts b/src/index.ts
index a0ec07f..ed7bef8 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -223,6 +223,8 @@ export type {
 } from './components/skeleton';
 export { Step, Stepper } from './components/stepper';
 export type { StepProps, StepperLabels, StepperProps, StepperVariant } from './components/stepper';
+export { List, ListItem } from './components/list';
+export type { ListItemLinkProps, ListItemProps, ListProps, ListVariant } from './components/list';
 export { Toaster, toast } from './components/toast';
 export type {
   ToastAction,
diff --git a/src/styles/components/list.css b/src/styles/components/list.css
new file mode 100644
index 0000000..054f2ec
--- /dev/null
+++ b/src/styles/components/list.css
@@ -0,0 +1,272 @@
+/* List (spec phase 4 §4.3 List, mockup L1-L3): rows to read, in three looks. The parts at the top are
+   shared; each look writes only what differs. The rows read `data-interactive`, `data-current` and
+   `data-disabled` of the <li>, never `aria-current`, which sits on the link or button when the row
+   has one. */
+@layer flg.components {
+  .flg-list {
+    /* A list beside another box in a flex row shrinks to what is left, so that the long text of its
+       rows is cut short and does not push the row wider than its frame. */
+    min-width: 0;
+    margin: 0;
+    padding: 0;
+    list-style: none;
+    color: var(--flg-text);
+    font-family: var(--flg-font-sans);
+  }
+  .flg-list-item {
+    /* A look sets the rounding of its rows here; the row and the cover of its link both use it. */
+    --flg-list-item-radius: 0;
+    position: relative;
+    display: flex;
+    align-items: center;
+    gap: 12px;
+    box-sizing: border-box;
+    min-height: 52px;
+    padding: 8px 12px;
+    border-radius: var(--flg-list-item-radius);
+    font-size: var(--flg-text-sm);
+  }
+  .flg-list[data-size='sm'] > .flg-list-item {
+    min-height: 44px;
+  }
+
+  .flg-list-item-start {
+    display: inline-flex;
+    align-items: center;
+    justify-content: center;
+    flex: none;
+    min-width: 32px;
+    min-height: 32px;
+    color: var(--flg-text-muted);
+  }
+  .flg-list-item-start > svg {
+    width: 18px;
+    height: 18px;
+  }
+
+  /* `min-width: 0` lets the column shrink below its content, so that a long title and description are
+     cut short and the end cell keeps its place, in a block and as an item of a flex row. */
+  .flg-list-item-main {
+    flex: 1;
+    min-width: 0;
+    display: flex;
+    flex-direction: column;
+    gap: 2px;
+  }
+  .flg-list-item-title {
+    min-width: 0;
+    overflow: hidden;
+    color: var(--flg-text);
+    font-weight: var(--flg-weight-medium);
+    line-height: 1.3;
+    text-decoration: none;
+    text-overflow: ellipsis;
+    white-space: nowrap;
+  }
+  .flg-list-item-description {
+    overflow: hidden;
+    color: var(--flg-text-muted);
+    font-size: var(--flg-text-xs);
+    line-height: 1.35;
+    text-overflow: ellipsis;
+    white-space: nowrap;
+  }
+
+  /* The title of a row that can be pressed is a link or a button. It takes no outline of its own: the
+     focus ring is drawn on the row (the last rules of this block). */
+  button.flg-list-item-title {
+    appearance: none;
+    margin: 0;
+    padding: 0;
+    border: 0;
+    background: none;
+    font-family: inherit;
+    font-size: inherit;
+    text-align: start;
+  }
+  :is(a, button).flg-list-item-title {
+    cursor: pointer;
+    outline: none;
+  }
+  /* The link stretched over the row: a press anywhere on it is a press of the title. It is positioned
+     against the row, since the title itself is not positioned, so the title's `overflow: hidden` does
+     not cut it. */
+  :is(a, button).flg-list-item-title::after {
+    content: '';
+    position: absolute;
+    inset: 0;
+    border-radius: var(--flg-list-item-radius);
+  }
+
+  .flg-list-item-end {
+    display: inline-flex;
+    align-items: center;
+    gap: 8px;
+    flex: none;
+    color: var(--flg-text-muted);
+    font-size: var(--flg-text-xs);
+  }
+  .flg-list-item-end > svg {
+    width: 16px;
+    height: 16px;
+  }
+  /* What can be pressed in the end cell sits above the stretched link. */
+  .flg-list-item-end :is(a, button, input, select, textarea, [tabindex]) {
+    position: relative;
+    z-index: 1;
+  }
+  .flg-list-item-end .flg-button {
+    margin: -4px -6px -4px 0;
+  }
+
+  .flg-list-item[data-current] > .flg-list-item-start {
+    color: var(--flg-selected-text);
+  }
+  .flg-list-item[data-current] .flg-list-item-title {
+    color: var(--flg-selected-text);
+    font-weight: var(--flg-weight-semibold);
+  }
+  .flg-list-item[data-disabled] {
+    opacity: 0.5;
+  }
+  .flg-list-item[data-disabled] .flg-list-item-title {
+    cursor: not-allowed;
+  }
+
+  /* inset (L1): one block of glass with a rule between the rows. The root is also a `.flg-surface`. */
+  /* A row is rounded at the corners it shares with the block, a pixel less than the block, so that the
+     hover and current backgrounds meet its inner edge. The last rule is for the only row. */
+  .flg-list[data-variant='inset'] > .flg-list-item:first-child {
+    --flg-list-item-radius: calc(var(--flg-radius-lg) - 1px) calc(var(--flg-radius-lg) - 1px) 0 0;
+  }
+  .flg-list[data-variant='inset'] > .flg-list-item:last-child {
+    --flg-list-item-radius: 0 0 calc(var(--flg-radius-lg) - 1px) calc(var(--flg-radius-lg) - 1px);
+  }
+  .flg-list[data-variant='inset'] > .flg-list-item:only-child {
+    --flg-list-item-radius: calc(var(--flg-radius-lg) - 1px);
+  }
+  /* The rule starts after the start cell (12px + 32px + 12px); a row without one starts it at 12px. */
+  .flg-list[data-variant='inset'] > .flg-list-item + .flg-list-item::before {
+    content: '';
+    position: absolute;
+    top: 0;
+    right: 0;
+    left: 56px;
+    height: 1px;
+    background: var(--flg-control-border);
+  }
+  .flg-list[data-variant='inset']
+    > .flg-list-item
+    + .flg-list-item:not(:has(> .flg-list-item-start))::before {
+    left: 12px;
+  }
+  .flg-list[data-variant='inset'] > .flg-list-item[data-current] {
+    background: var(--flg-selected-bg);
+  }
+  .flg-list[data-variant='inset'] > .flg-list-item[data-current]::after {
+    content: '';
+    position: absolute;
+    top: 8px;
+    bottom: 8px;
+    left: 0;
+    width: 3px;
+    border-radius: 0 3px 3px 0;
+    background: var(--flg-accent-solid);
+  }
+
+  /* cards (L2): a pane of glass for each row. A row does not know the variant of its list (neither is
+     a client component, so there is no context), so it cannot carry `.flg-surface`; the glass of that
+     class is written again here. Its tokens change in the solid and high-contrast modes, so those
+     modes apply to the rows with no rule of their own. */
+  .flg-list[data-variant='cards'] {
+    display: flex;
+    flex-direction: column;
+    gap: 6px;
+  }
+  .flg-list[data-variant='cards'] > .flg-list-item {
+    --flg-list-item-radius: var(--flg-radius-md);
+    border: 1px solid transparent;
+    background-image:
+      var(--flg-glass-noise), linear-gradient(var(--flg-glass-tint), var(--flg-glass-tint)),
+      var(--flg-glass-border);
+    background-origin: padding-box, padding-box, border-box;
+    background-clip: padding-box, padding-box, border-box;
+    -webkit-backdrop-filter: var(--flg-glass-filter);
+    backdrop-filter: var(--flg-glass-filter);
+    box-shadow: var(--flg-list-card-shadow);
+    /* Its own stacking context, so that the `z-index: -1` layer below stays above the glass even
+       where `backdrop-filter` is off (the solid mode), which would otherwise bury it. */
+    isolation: isolate;
+    transition:
+      box-shadow var(--flg-duration-fast) var(--flg-ease),
+      translate var(--flg-duration-fast) var(--flg-ease);
+  }
+  /* The hover and current backgrounds, under the content and over the glass. */
+  .flg-list[data-variant='cards'] > .flg-list-item::before {
+    content: '';
+    position: absolute;
+    inset: 0;
+    z-index: -1;
+    border-radius: inherit;
+    pointer-events: none;
+    transition: background-color var(--flg-duration-fast) var(--flg-ease);
+  }
+  .flg-list[data-variant='cards'] > .flg-list-item[data-current] {
+    outline: 1.5px solid var(--flg-accent-solid);
+    outline-offset: -1px;
+  }
+  .flg-list[data-variant='cards'] > .flg-list-item[data-current]::before {
+    background: var(--flg-selected-bg);
+  }
+
+  /* plain (L3): flat rows. The negative margin lets the hover background run into the padding of the
+     card the list is in, while the text stays in line with what is around it. */
+  .flg-list[data-variant='plain'] {
+    display: flex;
+    flex-direction: column;
+    gap: 2px;
+    margin: 0 -8px;
+  }
+  .flg-list[data-variant='plain'] > .flg-list-item {
+    --flg-list-item-radius: var(--flg-radius-md);
+    padding: 8px;
+  }
+  .flg-list[data-variant='plain'] > .flg-list-item[data-current] {
+    background: var(--flg-selected-bg);
+  }
+
+  /* Only a row that can be pressed reacts, and the row that is current keeps its own background. */
+  @media (hover: hover) {
+    .flg-list:is([data-variant='inset'], [data-variant='plain'])
+      > .flg-list-item[data-interactive]:not([data-current]):hover {
+      background: var(--flg-control-track);
+    }
+    .flg-list[data-variant='cards'] > .flg-list-item[data-interactive]:hover {
+      box-shadow: var(--flg-list-card-shadow-hover);
+      translate: 0 -1px;
+    }
+    .flg-list[data-variant='cards']
+      > .flg-list-item[data-interactive]:not([data-current]):hover::before {
+      background: var(--flg-list-card-hover-bg);
+    }
+  }
+
+  /* The focus ring is drawn on the row when its title has the keyboard focus. These rules come last,
+     so that they win over the outline of a current row of `cards`: in the modes that draw no shadow
+     the outline is the only sign of focus, and it must not give way. The row is raised above its
+     neighbours in `inset`, so that the ring is not covered by the next row. */
+  .flg-list-item:has(> .flg-list-item-main > .flg-list-item-title:focus-visible) {
+    outline: 2px solid var(--flg-focus-outline-color);
+    outline-offset: 2px;
+    box-shadow: var(--flg-focus-ring);
+  }
+  .flg-list[data-variant='inset']
+    > .flg-list-item:has(> .flg-list-item-main > .flg-list-item-title:focus-visible) {
+    z-index: 1;
+  }
+  /* In `cards` the ring takes the place of the shadow of the card, also while the row is hovered. */
+  .flg-list[data-variant='cards']
+    > .flg-list-item:has(> .flg-list-item-main > .flg-list-item-title:focus-visible) {
+    box-shadow: var(--flg-focus-ring);
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index d4c4a76..9bbef9c 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -39,5 +39,6 @@
 @import './components/progress.css';
 @import './components/skeleton.css';
 @import './components/stepper.css';
+@import './components/list.css';
 @import './components/floating.css';
 @import './preferences.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 6f8e907..9b14cd8 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -73,6 +73,28 @@
     .flg-stepper[data-variant='compact'] .flg-step[data-state='current'] .flg-step-description {
       color: var(--flg-selected-text);
     }
+    /* The current row of a List is the solid accent here, so everything in it takes the text colour of
+       that accent: the title already does, and so do the start cell, the description and the end
+       cell, which are muted in the mockup, and the bar of `inset`. What a caller puts in the end cell
+       (a Badge, a button) keeps its own colours (spec phase 4 §4.4). */
+    .flg-list-item[data-current]
+      :is(.flg-list-item-start, .flg-list-item-description, .flg-list-item-end) {
+      color: var(--flg-selected-text);
+    }
+    .flg-list[data-variant='inset'] > .flg-list-item[data-current]::after {
+      background: var(--flg-selected-text);
+    }
+    /* A row that can be pressed does not change its background under the pointer: a Badge in its end
+       cell would fall below 4.5:1 on the hover background. `cards` still lifts and darkens its shadow,
+       and the current row keeps its own background. */
+    .flg-list:is([data-variant='inset'], [data-variant='plain'])
+      > .flg-list-item[data-interactive]:not([data-current]):hover {
+      background: none;
+    }
+    .flg-list[data-variant='cards']
+      > .flg-list-item[data-interactive]:not([data-current]):hover::before {
+      background: none;
+    }
   }
   @media (forced-colors: active) {
     .flg-surface {
@@ -556,6 +578,56 @@
     .flg-stepper[data-variant] .flg-step[data-state='error'] .flg-step-bar {
       background: CanvasText;
     }
+    /* The rule between the rows of an `inset` List is in the text colour. The glass of the block is
+       dropped by the `.flg-surface` rule above, and each card of `cards` gets the same treatment
+       here, since a row does not carry that class (spec phase 4 §4.3). */
+    .flg-list[data-variant='inset'] > .flg-list-item + .flg-list-item::before {
+      forced-color-adjust: none;
+      background: CanvasText;
+    }
+    .flg-list[data-variant='cards'] > .flg-list-item {
+      background-image: none;
+      background-color: Canvas;
+      border-color: CanvasText;
+      color: CanvasText;
+      box-shadow: none;
+    }
+    /* The background of the current row is dropped, and without one `plain` would show only bold text,
+       so the row has an outline drawn inside it. The gradients of the wash are not colours and stay
+       unless they are removed. */
+    .flg-list-item[data-current],
+    .flg-list[data-variant='cards'] > .flg-list-item[data-current]::before {
+      background-image: none;
+    }
+    .flg-list[data-variant] > .flg-list-item[data-current] {
+      outline: 2px solid Highlight;
+      outline-offset: -2px;
+    }
+    /* The selectors of the two rules below are as specific as the `contrast-more` rules for the same
+       parts above (the bar of the current row, the text of the current row), which Chromium matches
+       too while colours are forced, and they come later in the layer: a shorter selector would lose
+       to them whatever the order. */
+    .flg-list[data-variant='inset'] > .flg-list-item[data-current]::after {
+      forced-color-adjust: none;
+      background: Highlight;
+    }
+    .flg-list-item[data-disabled]
+      :is(
+        .flg-list-item-start,
+        .flg-list-item-title,
+        .flg-list-item-description,
+        .flg-list-item-end
+      ) {
+      color: GrayText;
+    }
+    /* A row that is current and has the focus keeps the focus: the outline above is drawn inside the
+       row, and this one outside it, in the text colour. It is the only sign of focus here, and it is
+       as specific as the rule above (the lower the specificity, the sooner it would be lost). */
+    .flg-list[data-variant]
+      > .flg-list-item:has(> .flg-list-item-main > .flg-list-item-title:focus-visible) {
+      outline: 2px solid CanvasText;
+      outline-offset: 2px;
+    }
   }
   /* Repeating motion cannot be stopped by a duration of 0ms, which would repeat for ever (spec
      phase 4 §3.3), so what moves without end is stopped by hand here. Motion that happens once keeps
diff --git a/src/styles/theme/values.ts b/src/styles/theme/values.ts
index eddce2a..1902679 100644
--- a/src/styles/theme/values.ts
+++ b/src/styles/theme/values.ts
@@ -70,6 +70,12 @@ export const themes: Readonly<Record<ThemeName, TokenMap>> = {
     'control-thumb': '#ffffff',
     // The sweep of a Skeleton `shimmer` (mockup Sk2): white at 75% on light glass.
     'skeleton-shine': 'rgba(255,255,255,.75)',
+    // The shadow of each row of a List `cards` (mockup L2), lighter than the glass shadow so that the
+    // shadows of rows set close do not add up to a dark patch; the rise on hover, and the colour the
+    // row brightens to (control-bg on light glass, control-track on dark).
+    'list-card-shadow': '0 1px 2px #0000000a, 0 6px 16px #3c5fd21f',
+    'list-card-shadow-hover': '0 2px 4px #0000000f, 0 12px 26px #3c5fd238',
+    'list-card-hover-bg': 'var(--flg-control-bg)',
     success: '#115934', // (outside mockup) darkened 3% to pass over the Dialog scrim (I1)
     warning: '#734200', // (outside mockup) darkened 3% to pass over the Dialog scrim (I1)
     danger: '#92222b', // (outside mockup) darkened 3% to pass over the Dialog scrim (I1)
@@ -104,6 +110,9 @@ export const themes: Readonly<Record<ThemeName, TokenMap>> = {
     'control-thumb': '#ffffff',
     // A faint sweep on dark glass, 12% white (mockup Sk2).
     'skeleton-shine': 'rgba(255,255,255,.12)',
+    'list-card-shadow': '0 6px 18px #00000047',
+    'list-card-shadow-hover': '0 12px 28px #00000073',
+    'list-card-hover-bg': 'var(--flg-control-track)',
     success: '#bbf1d7', // (outside mockup)
     warning: '#fae0ad', // (outside mockup)
     danger: '#ffdbdd', // (outside mockup)
diff --git a/tests/visual/stories.visual.ts b/tests/visual/stories.visual.ts
index 9c412d4..66aeeb2 100644
--- a/tests/visual/stories.visual.ts
+++ b/tests/visual/stories.visual.ts
@@ -51,6 +51,14 @@ for (const story of stories) {
         await page.evaluate(async () => {
           await document.fonts.ready;
         });
+        // A story that must be shot while the pointer is over something marks it with
+        // `data-visual-hover`. `:hover` cannot be turned on from a play function, since the pointer
+        // events it sends are synthetic and the browser's hover state ignores them, so the harness
+        // moves the real mouse here, after the play function and before the shot. Only the first
+        // such element is hovered, and each test has a page of its own, so the mouse does not carry
+        // over to the next story. A story without the attribute is shot exactly as before.
+        const hover = stage.locator('[data-visual-hover]').first();
+        if ((await hover.count()) > 0) await hover.hover();
         await expect(stage).toHaveScreenshot(`${story.id}--${theme}--${mode.name}.png`);
       });
     }
````

Build, rồi kiểm tra gói trước khi ghi ngưỡng:

```bash
pnpm gen:theme
pnpm build
pnpm check:package
```

Expected: FAIL chỉ ở bước `size`: CSS 11.51 kB trên ngưỡng 10.53 kB; JS 46.16 kB, còn chỗ. Các bước trước đó pass, gồm `check:dist-css` (bảy class `flg-list*`) và `check:rsc` (`ok` cho `List with a link row and a static row` và `List cards with renderLink`).

Ghi ngưỡng kích thước. Plan không chép `.size-limit.json`: `size:record` tự ghi file đó:

```bash
pnpm size:record
```

Expected: ngưỡng mới gần JS 50772 B, CSS 12656 B (trước: 49547 B, 10530 B), là kết quả ở bản nháp; ngưỡng là số đo cộng 10%. Nếu số khác một chút, giữ số do `size:record` ghi và nêu trong báo cáo.

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm check:contrast
pnpm vitest run --project unit --project unit-react18 --project scripts src/components/list src/internal src/docs src/index.test.ts scripts/lib/theme-css.test.ts
pnpm vitest run --project storybook-light --project storybook-dark src/components/list
pnpm build && pnpm check:package
```

Expected:
- `pnpm typecheck` không lỗi, kể cả `tests/visual/stories.visual.ts`: đó là kiểm tra duy nhất của móc hover ở máy này (phát hiện 7).
- `pnpm check:contrast`: PASS. Không có check mới; các `known-exception` và số của chúng như sau Task 1.
- Unit: 54 file, 514 test PASS, 3 skip, không lỗi kiểu. Trong đó `List.test.tsx` 41 test ở mỗi project React, `List.test-d.ts` 5, `theme-css.test.ts` 17, `ExceptionTable.test.tsx` 4 (vẫn 31 dòng), `index.test.ts` 1.
- Story List: 36 test PASS (6 story × ba engine × hai theme). axe chạy sau play function, không có vi phạm. `PressAnywhere` và `HoverOnlyOnPressableRows` dùng chuột thật; `LongText` đo ba variant trong khối và trong hàng flex, khung 320px.
- `check:package` PASS với ngưỡng mới. Theo lần chạy nháp: JS 46.16 kB trên 50.77 kB, CSS 11.51 kB trên 12.66 kB.
- List là component mới, ba token mới chỉ `list.css` đọc, và móc hover chỉ hành động khi có `data-visual-hover` (phát hiện 10), nên ảnh chuẩn của component cũ giữ nguyên.

Kiểm tra cuối của cả nhánh, như bản nháp chạy ở `3948d8e`:

```bash
pnpm gen:theme
pnpm check:name
pnpm test:unit
pnpm check:contrast
pnpm build && pnpm check:package
pnpm build-storybook
```

Expected:
- `pnpm check:name`: PASS, không có tên cũ ngoài `docs/superpowers`.
- `pnpm test:unit`: 3330 test PASS, 3 skip (166 file).
- `pnpm check:contrast`: PASS, với dòng 23 đến 31 là `known-exception`.
- `pnpm check:package`: PASS với ngưỡng của Step 3.
- `pnpm build-storybook`: PASS, nên `Stepper.mdx` và `List.mdx` biên dịch được. Lệnh không mở cổng nào; thư mục `storybook-static` bị git bỏ qua.
- Story của stepper và list đã chạy ở task của chúng. Không chạy cả bộ story một lượt; CI chạy cả bộ.

- [ ] **Step 5: Commit**

```bash
git add \
  .size-limit.json \
  docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md \
  docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md \
  scripts/check-dist-css.ts \
  scripts/contrast-exceptions.ts \
  scripts/lib/theme-css.test.ts \
  scripts/rsc-probe.mjs \
  src/components/list/List.mdx \
  src/components/list/List.stories.tsx \
  src/components/list/List.test-d.ts \
  src/components/list/List.test.tsx \
  src/components/list/List.tsx \
  src/components/list/index.ts \
  src/docs/Accessibility.mdx \
  src/index.test.ts \
  src/index.ts \
  src/styles/components/list.css \
  src/styles/index.css \
  src/styles/preferences.css \
  src/styles/theme/values.ts \
  tests/visual/stories.visual.ts
```
```bash
git commit -m "feat(list): add List and ListItem with inset, cards and plain looks" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

## Sau khi thực thi

- Đẩy nhánh, rồi tạo ảnh chuẩn bằng workflow "Update visual baselines": 48 ảnh mới của sáu story nhìn (Phạm vi). Xem ảnh trước khi xin review:
  - khớp mockup st1–st3, l1–l3 ở chế độ `normal`, kể cả bản hẹp 320px của Stepper và hàng được rê chuột của List (qua `data-visual-hover`);
  - forced colors: dấu tròn và thanh của Stepper mang màu hệ thống; hàng hiện tại của List có outline `Highlight` và vạch `inset` `Highlight`;
  - contrast-more: dấu tròn trong viên thuốc của bước hiện tại `compact` đảo màu; thanh chưa tới và thanh hiện tại của `bars` có viền 1px; hàng hiện tại của List có chữ `--flg-selected-text`;
  - ảnh cũ của mọi component khác không đổi (Breadcrumb đổi cách sinh `key`, DOM không đổi).
- Mô tả PR nêu cho chủ dự án:
  - §4.9 dòng 30, 31 và phần Stepper của dòng 26 (đã duyệt cùng spec), kèm số đo; nhãn dòng 12 thêm mô tả của bước Stepper khi rê chuột;
  - các dòng spec "phát hiện khi lập Plan B" và "phát hiện khi review cuối Plan B";
  - các quyết định Claude tự chốt và các mục để lại; chưa thử Safari thật, VoiceOver và NVDA;
  - Plan B không có changeset: merge không publish gì; changeset `minor` cho `0.3.0` có ở Plan C.

### Đã thực thi (2026-11-07)

- Hai commit của nhánh nháp được cherry-pick lên `feat/phase-4-plan-b` (`6cdbb0c`, `3187bea`). Cây giống hệt đầu nhánh nháp (`e4f0ec5`), cộng file plan.
- Mỗi task có một reviewer riêng (hai reviewer chạy song song, chỉ đọc). Cả hai: Approved, không có phát hiện Critical hay Important. Sáu mục nhỏ được ghi lại và đưa cho review toàn nhánh phân loại. Reviewer đối chiếu CSS với mockup st1–st3, l1–l3, và lớp kính của `cards` với `.flg-surface`: khớp.
- Review toàn nhánh trên Opus, dùng 15 góp ý của chủ dự án ở PR #27 làm lăng kính: "With fixes" (1 Critical, 3 Important, 9 Minor). Sửa trong một đợt, mỗi mục một commit (`7e420e7`..`a19c948`):
  - **Critical, ô cuối của List:** quy tắc nâng phần tử tương tác trong ô cuối (`position: relative; z-index: 1` cho `a, button, input, select, textarea, [tabindex]`, spec §4.3) ghi đè cách định vị của chính các control của thư viện. Switch trong một hàng List rộng 80px thay vì 36px, và điểm bấm rơi vào phần `aria-hidden`; Select co thành một ô trống 24px; nút kéo của Slider không nằm ở giá trị. Sửa ở `7e420e7`: quy tắc chuyển xuống `@layer flg.base` với `:where(...)`, nên component nào tự định vị phần của nó thì thắng, còn nút thường và `IconButton` vẫn nằm trên liên kết kéo giãn. Story `ControlsInTheEndCell` (`no-visual`) fail trước khi sửa ("switch: expected 80 to be close to 36", ở ba engine). Nguồn của lỗi là spec: mockup chỉ nâng `.flg-button`, spec mở rộng ra mọi phần tử tương tác.
  - **`compact` ngang, tên dài:** các bước chồng lên nhau và đường nối không giữ được 12px, vì mỗi `<li>` có `min-width: 0` (như mockup). Sửa ở `38ab8a8` và `c171271`: ở dạng rộng (`@container flg-stepper (min-width: 480px)`), tên không vừa bị cắt bằng "…"; tên vừa chỗ không đổi; tên đầy đủ vẫn nằm trong chữ truy cập. Story `LongNames` (520px).
  - **Bản hẹp, bước đầu và bước cuối:** chữ của chúng tràn ra ngoài Stepper; ở bước cuối của `bars`, trang 320px cuộn ngang. Sửa ở `b673480` và `c171271`: chữ của bước đầu neo về đầu, của bước cuối neo về cuối (`circles`, `bars`: `align-self`; `compact`: `<li>` cuối căn `flex-end`). Story `Narrow` được mở rộng: 24 Stepper sát mép trang 16px, tiêu đề `compact` ngang tâm dấu tròn, và các trạng thái đã duyệt không bị cắt chữ.
  - **`key` trùng** khi trộn `Step` có `key` với `Step` không có. Sửa ở `f029f55`: helper `src/internal/child-keys.ts` theo đúng cách Breadcrumb đã làm; Stepper và Breadcrumb cùng dùng nó.
  - Minor sửa luôn:
    - bỏ quy tắc margin 4px của bản hẹp `compact`, vốn không bao giờ áp dụng; ảnh đã duyệt là 6px, nên spec sửa theo (`5c43b96`);
    - không cảnh báo về `value` khi Stepper không có bước nào (`9ab7040`);
    - `value` lẻ được làm tròn xuống (`2cdbf62`);
    - docs: số tương phản ở theme tối của số bước hiện tại (3.90:1 `circles`, 3.33:1 `compact`); chỉ ô cuối nằm trên liên kết kéo giãn; một câu về chữ ẩn của Stepper trên trang Accessibility (`fabc463`);
    - comment về forced colors viết lại thành biện pháp đề phòng; `button.flg-step-inner`; comment phân biệt check `stepper-icon` của NumberInput; nhãn dòng 12 (`a19c948`).
  - Lần review lại: mọi mục đã xử lý, trừ bản hẹp của `compact`: neo bằng `align-self` trên một hàng làm chữ lệch khỏi tâm dấu tròn, và dấu "…" tác động cả ở bản hẹp. Một vòng sửa thêm (`c171271`, ghi trong sổ); Claude đọc diff và xác nhận.
  - Docs của Plan B được ngắt dòng ở 100 ký tự (`52b9aa7`, chỉ đổi chỗ xuống dòng).
  - Các dòng spec sửa, đánh dấu "(phát hiện khi review cuối Plan B)": §4.3 ô cuối của List; §4.3 Stepper "Ngang và đủ rộng", `compact` ngang, bản hẹp, khoảng cách 6px của `compact` hẹp; §5 làm tròn xuống; dòng 12 của §4.9 trong spec 0+1.
- **Quyết định Claude tự chốt khi thực thi** (chủ dự án có thể đảo lại):
  - Tên dài của `compact` bị cắt bằng "…" ở dạng rộng, như tiêu đề List và nhãn Progress; ở bản hẹp, chữ vẫn tràn như spec.
  - `value` lẻ của Stepper được làm tròn xuống, theo quy tắc chủ dự án đặt cho phần trăm của Progress: không báo xong trước khi xong.
  - Khoảng cách của đường nối ở bản hẹp `compact` giữ 6px như ảnh đã duyệt; spec sửa theo, thay vì đổi ảnh.
  - Tên các check `stepper-*` giữ như spec; chỉ thêm comment phân biệt với `stepper-icon` của NumberInput.
- **Để lại** (ghi trong mô tả PR), ngoài các mục ở phát hiện 12:
  - Ở contrast-more, đĩa của dấu tròn bước lỗi `compact` lẫn vào viên thuốc đỏ; chỉ còn dấu "!".
  - Forced colors của Stepper và List chỉ được thử ở Chromium. Chromium tự bỏ gradient không có lớp `url()`; Firefox chưa thử.
  - Móc `data-visual-hover` không có test tự động.
  - Các mục nhỏ giữ nguyên: `{...props}` đứng sau `data-variant` (cách của cả thư viện); `void props;` trong `Step` (như `SelectItem`); `preferences.css` ngày càng dài; hai cảnh báo khi `renderLink` thiếu cả `href` lẫn `title`.
- Kiểm tra trên `52b9aa7`:
  - gen:theme, lint, typecheck, format, `tsc --noEmit -p .`, `check:name`, `check:contrast`, build, `check:package` (gồm `check:rsc`) và build Storybook đều đạt;
  - unit: 167 file, 3336 passed, 3 skipped;
  - kích thước: JS 46,21 kB (giới hạn 50,77 kB), CSS 11,56 kB (giới hạn 12,66 kB);
  - story, từng thư mục một và từng theme một (chạy hai theme trong một tiến trình từng làm mất kết nối trình duyệt trên máy này), ba engine: stepper 18 + 18, list 21 + 21, breadcrumb 6 + 6. Máy thiếu bộ nhớ, nên toàn bộ bộ story do CI chạy.
