# h2d-glass-ui: Plan A, `StatusIcon`, Alert, Progress và Skeleton (giai đoạn 4, phần 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm Plan A, plan đầu của giai đoạn 4: icon trạng thái dùng chung `StatusIcon` (Toaster chuyển sang dùng nó, HTML không đổi); `Alert`, `Progress` và `Skeleton`, mỗi component ba `variant` theo mockup đã duyệt; lượt `reduced-motion` của harness visual; các cặp tương phản mới (dòng 23 đến 29 của §4.9) và ngưỡng kích thước.

**Architecture:**
- **`StatusIcon`** (Task 1): bốn icon trạng thái của Toaster chuyển vào `src/internal/icons.tsx`, để Toaster, Alert và Progress dùng chung. HTML của icon Toast giữ nguyên từng ký tự.
- **`Alert`** (Task 2): server-safe, không hook. Gốc `div.flg-alert` mang `data-variant` (`stripe`, `tinted`, `plain`) và `data-status`; `AlertTitle`, `AlertDescription` và `AlertActions` nằm trong thân. Nút đóng là `IconButton` (client), chỉ có khi có `onDismiss`. Lib không tự gán `role`.
- **`Progress`** (Task 3): client (`useId`, `useRequireName`). Gốc là `role="progressbar"`; chữ giá trị nhìn thấy mang `aria-hidden`. Chiều rộng phần đã chạy là `--flg-progress-value` trong `style`, nên HTML từ server đã đúng. Đoạn chưa xác định trượt bằng `translate`.
- **`Skeleton`, `SkeletonText`** (Task 4): server-safe, chỉ là markup, luôn `aria-hidden`. Token mới `--flg-skeleton-shine`.
- **Giảm chuyển động** (Task 3, 4): một khối `@media (prefers-reduced-motion: reduce)` viết tay trong `preferences.css` dừng các animation lặp. Harness visual chụp thêm lượt `reduced-motion` cho story gắn tag cùng tên (Task 3).
- **Tương phản** (Task 2, 3): mười check mới trong `scripts/lib/contrast.ts`, bảy dòng mới của §4.9. Ngưỡng kích thước được ghi một lần, ở Task 4.

**Tech Stack:** Như Plan D của giai đoạn 3: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63, `@floating-ui/dom` 1.8.0. Plan này không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md`. Plan này làm các phần sau:
- §2 dòng A và hai ý "Thay đổi ở code cũ" của Plan A: Toaster dùng `StatusIcon` (Task 1); lượt `reduced-motion` của harness (Task 3).
- §3.1: dòng Alert (Task 2), Progress (Task 3) và Skeleton (Task 4); `check:use-client` thêm Progress (Task 3); các ca `check:rsc` của Alert (Task 2) và Skeleton (Task 4).
- §3.2: `variant` của ba component (Task 2, 3, 4).
- §3.3: animation của Progress (Task 3) và Skeleton (Task 4); khối `prefers-reduced-motion` viết tay (Task 3 tạo, Task 4 thêm Skeleton).
- §3.4: Alert (Task 2), Progress (Task 3), Skeleton (Task 4).
- §3.6: các file của Plan A.
- §4.1: mockup A1–A3, P1–P3, Sk1–Sk3 (`phase-4-alert-progress-skeleton.html`).
- §4.2: token `--flg-skeleton-shine` (Task 4); các màu viết thẳng bằng `color-mix` của Alert, Progress `glow` và Skeleton `glass` (Task 2, 3, 4).
- §4.3, §4.4, §4.5: giao diện, các cặp tương phản và forced colors của Alert (Task 2), Progress (Task 3) và Skeleton (Task 4; §4.4 xếp Skeleton vào "Không đo").
- §4.6: `StatusIcon` (Task 1).
- §5: cảnh báo dev của Progress (Task 3) và Skeleton (Task 4).
- §6.1, §6.2, §6.3: API của Alert và các phần của nó (Task 2), Progress (Task 3), Skeleton và SkeletonText (Task 4).
- §7: lớp 1 đến 5 cho Toaster (Task 1) và ba component; khung hình animation qua `getAnimations()`; lượt `reduced-motion` của harness; test kiểu; kiểm tra gói.
- §8: trang MDX của Alert, Progress và Skeleton (Task 2, 3, 4).
- §4.9 của spec giai đoạn 0+1 (`docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`): dòng 23 đến 26 mới, dòng 21 và 22 mở rộng (Task 2); dòng 27 đến 29 mới, dòng 6 và 16 mở rộng (Task 3). Dòng 26 chỉ có tiêu đề Alert `plain`; Plan B mở rộng dòng 26, 27 và 29.

Chủ dự án chọn "tất cả lựa chọn" ngày 2026-11-06: mỗi phương án của mockup thành một giá trị `variant`. Chủ dự án duyệt spec ngày 2026-11-07, kể cả các dòng 23 đến 34 của §4.9.

**Đã chạy thử khi lập kế hoạch:**
- Toàn bộ code dưới đây đã chạy trên nhánh nháp `draft/phase-4-plan-a`, mỗi task một commit: bốn commit trên `354496b` (`main` ở `82a4318`, cộng spec giai đoạn 4 và ba trang mockup đã duyệt). Mỗi test viết trước đã được chạy trên commit cha của task, trừ các chỗ ghi rõ ở phát hiện 11.
- Mọi task do subagent Claude Sonnet viết. Plan A không dùng opencode: không task nào là logic thuần, task nào cũng cần chép đúng CSS của mockup và viết đúng ARIA. Claude (Opus) kiểm tra từng task, và sửa thêm ở Task 3 (phát hiện 2).
- Mọi khối patch trong plan được lấy thẳng từ các commit đó.

Kết quả đo ở `1e717cf`, đầu nhánh nháp trước khi sửa hai chú thích (nay là `ce899f7`; chỉ hai chú thích của story `ReducedMotion` khác), ngày 2026-11-07. Story là ngoại lệ: chúng chạy ở commit của task đổi thư mục đó.

| Lệnh | Kết quả |
|---|---|
| `pnpm test:unit` | 3083 test PASS, 3 skip (158 file; project `unit`, `unit-react18` và `scripts`) |
| Story | toast 42 (Task 1), alert 42 (Task 2), progress 36 (Task 3), skeleton 36 (Task 4). PASS ở Chromium, Firefox và WebKit, theme sáng và tối, chạy từng thư mục một. Cả bộ story chưa chạy một lượt trên máy này vì thiếu bộ nhớ; CI chạy cả bộ |
| `pnpm check:contrast` | PASS, với dòng 23 đến 29 mới của §4.9 là `known-exception` |
| `pnpm check:package` | PASS với ngưỡng mới: JS 49547 B, CSS 10530 B (đo được CSS 9.57 kB; ngưỡng trước 47580 B và 9311 B) |
| `pnpm gen:theme`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `npx tsc --noEmit -p .`, `pnpm check:name`, `pnpm build` | PASS |
| Visual | Chưa chạy. Lượt `reduced-motion` và mọi ảnh chuẩn mới chạy lần đầu trong CI |

Bản nháp không chạy fixtures: Plan A không đổi fixture nào. `pnpm build-storybook` chạy ở Task 3 (để so giao diện) và Claude chạy lại ở đầu nhánh nháp sau Task 4: PASS, kể cả `Skeleton.mdx`. Job visual của CI cũng chạy nó.

Các phát hiện từ lần chạy thử đã được đưa vào plan:

1. **Bốn task nháp là bốn task của plan, cùng số thứ tự.** Lượt `reduced-motion` của harness đi cùng Progress (Task 3), component đầu tiên cần nó; Skeleton (Task 4) chỉ gắn tag. Ngưỡng kích thước được ghi một lần, ở Task 4, cho cả Plan A (phát hiện 10).
2. **Claude sửa thêm sau subagent** (đã gộp vào commit của task):
   - Task 3: hai dòng của spec giai đoạn 4 (phát hiện 3), cho hai lựa chọn mà subagent đã làm và đã báo: rãnh của Progress ở forced colors là một `outline`, và `glow` mất quầng khi giảm chuyển động. Commit nháp `6a73374` thành `e1bac02`. Sau đó Claude sửa chú thích của hai story `ReducedMotion` (Task 3 và 4), vì chúng nói ảnh chuẩn che Firefox và WebKit trong khi harness visual chỉ chụp ở Chromium (phát hiện 14): nhánh nháp nay là `4b6c2f8`, `29c247b`, `ccf36ad`, `ce899f7`.
   - Task 1, 2 và 4 được nhận nguyên như subagent viết.
3. **Các chỗ spec được sửa hoặc thêm:**
   - Spec giai đoạn 4 §4.5 **Progress** (Task 3): rãnh là `outline: 1px solid CanvasText`, không phải viền 1px như rãnh Slider. Một viền 1px chiếm hết chỗ của phần đã chạy trong rãnh `sm` cao 2px; outline nằm ngoài hộp nên không lấy chỗ. Đánh dấu "(phát hiện khi lập Plan A)".
   - Spec giai đoạn 4 §4.3 **Progress**, đoạn **Khi giảm chuyển động** (Task 3): ở `glow`, mask cắt luôn quầng sáng, nên thanh chưa xác định của `glow` khi đó không có quầng. Đánh dấu "(phát hiện khi lập Plan A)".
   - Spec 0+1 §4.9 (Task 2): dòng 23 đến 26 mới; dòng 21 thêm mô tả của Alert `plain`, dòng 22 thêm mô tả của Alert `stripe`; một đoạn mới về điểm 23–26; "Cả hai mươi hai điểm" thành "Cả hai mươi sáu điểm".
   - Spec 0+1 §4.9 (Task 3): dòng 27 đến 29 mới; dòng 6 thêm giá trị của Progress `thin`, dòng 16 thành rãnh "của Slider và của Progress"; một đoạn mới về điểm 27–29; "hai mươi sáu" thành "hai mươi chín".
   - Task 1, 2 và 4 không sửa dòng nào của spec giai đoạn 4.
4. **`StatusIcon` (Task 1):**
   - `StatusIcon({ status, ...props })` trải `strokeIcon` rồi tới props, nên mặc định nó ẩn (`aria-hidden`) như mọi icon khác của lib. Chỗ nào để icon nói trạng thái thì truyền `aria-hidden={undefined}`, `role="img"` và `aria-label`, như Toaster và Alert.
   - Bảng đường vẽ chuyển nguyên từ Toaster. `ToastStatus` thành bí danh của `StatusIconStatus`: cùng union, nên kiểu public không đổi. `AlertStatus` của Task 2 cũng là bí danh đó.
   - Bằng chứng giao diện Toast không đổi là một test DOM: `innerHTML` của `.flg-toast-icon` được so với chuỗi viết sẵn, đúng thứ tự thuộc tính và thứ tự con, cho cả bốn trạng thái. CSS của Toast không đổi. Bản nháp không chụp ảnh so trước và sau.
5. **Alert (Task 2):**
   - **Server-safe.** File không có `"use client"` và không có hook. Nó import `IconButton` (client), nên file ranh giới client có mặt trong đồ thị module của server; nút chỉ được render khi có `onDismiss`, một hàm, tức chỉ khi Alert nằm trong client component (§3.1). `check:rsc` pass với bốn ca của Alert.
   - **`rsc-probe.mjs` học Fragment.** `StatusIcon` trả các Fragment của bảng đường vẽ, mà `renderTree` của probe chưa biết Fragment: lần chạy đầu fail với `FAIL Alert without onDismiss: Unsupported element type: Symbol(react.fragment)`. Đó là giới hạn của probe, không phải lỗi RSC. Probe nay render con của Fragment.
   - **`icon`:** `undefined` là icon của trạng thái. Một node thì thay icon, và khối bọc mang `aria-hidden`. `false` bỏ icon; `null` cũng vậy, vì `null` không render gì (spec chỉ nói `false`). Icon bị thay hoặc bỏ thì tên trạng thái thành chữ ẩn `"<labels[status]>: "` ở đầu thân.
   - **`stripe` có `overflow: hidden`**, như mockup A1 và như Toast. Outline focus của nút đóng (2px, cách nút 2px) nằm trọn trong 5px còn lại tới mép; quầng `--flg-focus-ring` quanh nó bị cắt, đúng như nút đóng của Toast. Bản nháp nhận cách này; chưa chụp ảnh khi nút có focus bàn phím.
   - Không có quy tắc `prefers-contrast: more` cho Alert: §4.4 không đòi, và mọi cặp mới đạt ở chế độ đó chỉ nhờ token.
   - Forced colors: viền của cả ba variant và vạch của `stripe` là `CanvasText`.
   - `.flg-alert-body` có `overflow-wrap: break-word`, như chữ của Toast. Không trạng thái nào của mockup đổi vì nó.
   - Dạng gọn (chỉ có tiêu đề) được nhận ra bằng `:not(:has(.flg-alert-description, .flg-alert-actions))`, nên HTML từ server đã đúng.
   - Brief nháp sót ba file phải đổi: `src/docs/ExceptionTable.test.tsx` (test đếm các dòng của §4.9), `src/docs/Accessibility.mdx` (câu trỏ tới các dòng của từng component) và `scripts/rsc-probe.mjs` (Fragment). Plan có đủ cả ba; Task 3 sửa lại hai file đầu.
   - Story `Stripe`, `Tinted`, `Plain` dựng lại thẻ "Billing" của mockup: bốn trạng thái có tiêu đề và mô tả, một Alert có hai nút, một Alert đóng được, một Alert gọn. `Dismiss` (focus về tiêu đề của vùng chứa), `PoliteRecipe`, `UrgentRecipe` và `Icons` gắn `no-visual`.
   - So giao diện: Storybook dev ở cổng 6007 (đã tắt); ảnh của `Stripe`, `Tinted`, `Plain` sáng và tối được đọc đối chiếu với CSS của mockup. Không so pixel; ảnh chuẩn đến từ CI.
6. **Tương phản (Task 2, 3).** `check:contrast` đo mười cặp mới, trên kính thường và trên panel có scrim, lấy số thấp nhất trên mọi nền tham chiếu và mọi điểm màu. Số của script trùng số của spec §4.4 tới hàng phần trăm, ở cả bốn cột:

   | Check | Sáng | Sáng, contrast-more | Tối | Tối, contrast-more | Ngưỡng |
   |---|---|---|---|---|---|
   | `alert-stripe-text` | 13.63 | 15.30 | 5.81 | 12.09 | 4.5 |
   | `alert-stripe-icon` | 4.18 | 6.22 | 2.02 (dòng 23) | 6.31 | 3 |
   | `alert-tinted-title` | 4.68 | 5.10 | 3.37 (dòng 24) | 5.84 | 4.5 |
   | `alert-tinted-text` | 11.14 | 12.43 | 4.16 (dòng 25) | 7.73 | 4.5 |
   | `alert-tinted-icon` | 3.60 | 5.21 | 1.84 (dòng 23) | 4.66 | 3 |
   | `alert-plain-title` | 5.78 | 6.12 | 3.90 (dòng 26) | 8.13 | 4.5 |
   | `alert-plain-icon` | 3.62 | 4.92 | 1.88 (dòng 23) | 4.80 | 3 |
   | `progress-fill` | 2.45 (dòng 27) | 4.82 | 1.74 (dòng 27) | 5.56 | 3 |
   | `progress-glow-fill` | 1.62 (dòng 28) | 4.82 | 1.74 (dòng 28) | 5.56 | 3 |
   | `accent-text-on-surface` | 3.95 (dòng 29) | 5.95 | 4.44 (dòng 29) | 9.29 | 4.5 |

   - Mỗi check của Alert lấy số thấp nhất trong bốn trạng thái: `info` (icon `--flg-accent-solid`, tiêu đề `--flg-accent-text`), `success`, `warning`, `error`.
   - Bản đầu của `alertTint` và `alertCircle` pha màu trạng thái theo `statusAlpha` mà bỏ alpha riêng của màu. Màu nhấn của dark là `rgba(110,150,255,.75)`, và `color-mix(<màu> N%, transparent)` giữ alpha đó, nên lớp nhuộm là 0.75 × 16%. Sửa xong (trước commit), dark ra đúng 2.02 / 3.37 / 4.16 / 1.84 / 3.90 / 1.88 như spec.
   - `progress-fill` đo các điểm của `--flg-accent-gradient`, `--flg-success` và `--flg-danger` trên rãnh `--flg-control-track`. `progress-glow-fill` đo thêm lớp trắng 24% ở nửa trên, trừ ở `contrast-more`, nơi lớp đó bị bỏ.
   - Bảy dòng mới của §4.9, số làm tròn xuống. Bảng §4.9 thành 26 dòng sau Task 2 và 29 dòng sau Task 3; `ExceptionTable.test.tsx` đòi đúng số đó.
   - Dưới `prefers-contrast: more` mọi cặp mới đạt. Alert không cần quy tắc mới. Progress có hai quy tắc ngoài mockup: rãnh có viền trong 1px `--flg-control-border`; `glow` bỏ lớp ánh sáng và quầng.
   - Mô tả của Alert `plain` và `stripe`, giá trị của Progress `thin` và rãnh của Progress là các cặp màu đã có (dòng 21, 22, 6 và 16), nên không có check mới; mô tả của các dòng đó được mở rộng.
7. **Progress (Task 3):**
   - Cấu trúc đúng HTML của §6.3: gốc `role="progressbar"`; `.flg-progress-head` có nhãn, và giá trị ở `thin`, `glow`; `.flg-progress-line` có rãnh, và giá trị ở `inline`.
   - **Giá trị:** `value` không hữu hạn (`NaN`, ±`Infinity`) được coi là chưa xác định; `max` không phải số dương hữu hạn thì dùng 100; giá trị ngoài `[0, max]` bị kẹp. Mỗi trường hợp có một `devWarn`, gọi trong `useEffect` khi lời báo đổi.
   - **Tên:** `aria-label` và `aria-labelledby` của người dùng thắng `label`. Lib không đặt `aria-labelledby` cạnh `aria-label` của người dùng, vì `aria-labelledby` sẽ thắng nó. Cảnh báo thiếu tên là câu chung của `useRequireName` (`needs a name: pass aria-label or aria-labelledby.`), không nhắc `label`; trang MDX nhắc.
   - Props của người dùng được trải trước; `role` và các thuộc tính ARIA tính ra đặt sau, nên không ghi đè được.
   - `aria-valuetext` là `getValueText(value, max)` khi có. Với `success` và `error`, tên trạng thái được thêm sau ("62%, Error"). Không có cả hai thì không đặt.
   - Icon trạng thái hiện cả khi không có `showValue`. `inline` giữ cột giá trị 52px (rỗng) khi chưa xác định nếu `showValue` bật, để thanh dài bằng các thanh khác.
   - **Forced colors:** rãnh dùng `outline`, không dùng viền (phát hiện 3). Phần đã chạy có `forced-color-adjust: none`, nền `Highlight`, không bóng.
   - **Giảm chuyển động:** đoạn chưa xác định phủ cả rãnh, đứng yên, và được cắt sọc bằng `mask-image`. Mask cắt luôn quầng của `glow` (phát hiện 3); chú thích trong `preferences.css` nói điều đó.
   - `mask-image` không có tiền tố `-webkit-`, như vùng mờ của Tabs; bản nháp đã xem output của Lightning CSS.
   - `IndeterminateMotion` đọc khung hình qua `getAnimations()`: một animation, 1400ms, lặp vô hạn, `alternate`, delay 0, `translate` từ 0 tới `185.714%`, đoạn rộng 35% rãnh. `animation-timing-function` là easing của từng keyframe (`keyframes[0].easing`); `getTiming().easing` là `linear`. Lần chạy đầu của story fail vì kiểm sai chỗ đó.
   - **`ReducedMotion` chỉ kiểm ở Chromium.** Story bật `prefers-reduced-motion` qua CDP (`Emulation.setEmulatedMedia`), thứ chỉ Chromium có; ở Firefox và WebKit nó thoát sớm và pass. Harness visual cũng chỉ có project `chromium` (`playwright.visual.config.ts`), nên ở Firefox và WebKit không có kiểm tra tự động nào cho quy tắc này; chú thích của hai story `ReducedMotion` nói đúng như vậy (bản nháp đầu viết rằng ảnh chuẩn che các engine khác; Claude đã sửa chú thích trước khi lập plan) (phát hiện 14).
   - So giao diện: Storybook tĩnh ở cổng 6011 (đã tắt), đo ở Chromium. Chiều cao của `thin` / `glow` / `inline` (28 / 39 / 40px; dạng `sm` không nhãn 2 / 6 / 4px; chưa xác định 28 / 36 / 32px) và của rãnh (4 / 10 / 8px; `sm` 2 / 6 / 4px) đúng như mockup. Ảnh `Glow` sáng, và `Glow` chưa xác định ở dark khi giảm chuyển động, khớp mockup.
8. **Lượt `reduced-motion` của harness (Task 3):**
   - `MODES` của `tests/visual/stories.visual.ts` có thêm `{ name: 'reduced-motion', simulate: 'none', media: { reducedMotion: 'reduce' }, onlyTagged: 'reduced-motion' }`. Vòng lặp bỏ mode này với story không có tag `reduced-motion`. Ảnh tên `<story-id>--<theme>--reduced-motion.png`, hai ảnh mỗi story (sáng, tối).
   - Bốn mode cũ giữ tên và cách chụp, nên không ảnh chuẩn cũ nào đổi.
   - Playwright chụp với `animations: 'disabled'`, nên ở các mode khác đoạn của Progress nằm ở mép trái và Skeleton đứng ở khung đầu (§3.3). Lượt `reduced-motion` cho thấy thứ người dùng giảm chuyển động thấy.
   - Harness không có test tự động ở máy này: `pnpm typecheck` kiểm kiểu file, tên được kiểm bằng mắt. Lượt này chạy lần đầu trong CI.
   - Story gắn tag: `Thin`, `Glow`, `Inline` (Task 3) và `Pulse`, `Shimmer`, `Glass` (Task 4).
9. **Skeleton (Task 4):**
   - `circle` lấy `width` và `height` trước `size` khi có cả hai (`width ?? size`); spec chỉ nói `size`.
   - Chỉ gốc của `SkeletonText` mang `aria-hidden`; các dòng bên trong là `span.flg-skeleton` thường, như HTML của §6.3. Ở cả hai component, `aria-hidden="true"` đặt sau props, nên không ghi đè được.
   - Cảnh báo dev được gọi thẳng trong render, vì Skeleton không có hook (server-safe).
   - `AnimationFrames` đọc khung hình qua `getAnimations()`, delay 0 ở cả ba:
     - `pulse`: 1600ms, easing `ease-in-out` trên keyframe, độ mờ 1 ở 0ms và .4 ở 800ms.
     - `shimmer`: một animation trên `::after`, 1600ms, translate -100%, -50% và 0 ở 0, 400 và 800ms (tức tuyến tính), nền `linear-gradient(90deg` màu trắng.
     - `glass`: 2000ms, `ease-in-out`, màu ở 0ms bằng màu nghỉ, màu ở 1000ms bằng một mẫu tô cùng `color-mix(... 20% ...)`.
   - Màu đang animate được so bằng kênh của canvas, vì mỗi engine viết nó theo không gian màu riêng (`oklab(...)`, `color(srgb ...)`). Hai khẳng định sai đầu tiên của story (chỗ của easing, cách so màu) được sửa trước khi commit.
   - `TextLines` kiểm luận điểm của §4.3 bằng layout: hai khối `text` chồng nhau và một `SkeletonText` hai dòng đều cao 42px trong line-height 21px; một khối cao 21px, vạch cao 9.8px (70% của 14px).
   - Forced colors: `forced-color-adjust: none`, nền `GrayText`, không bóng, không animation, `::after` ẩn. Giảm chuyển động: không animation, `::after` ẩn, để vệt sáng không nằm lại ở mép.
   - `ReducedMotion` của Skeleton cũng chỉ kiểm ở Chromium, như của Progress (phát hiện 7).
   - Skeleton không phải module client, nên không có trong `check-use-client.ts`. `check:rsc` render nó từ `dist`, không có ranh giới client.
   - Không có cặp tương phản (§4.4, "Không đo"). `Skeleton.mdx` không đụng Getting started: mục "Loading states" thuộc Plan C (§8).
   - Chú thích của `shimmer` và `glass` trong `skeleton.css` nói vì sao một cái rẻ (`transform`) và một cái tốn (vẽ lại nền); trang MDX nói `glass` tốn hơn khi có nhiều khối (§10).
   - Story dựng lại thẻ hồ sơ, danh sách ba dòng và các thẻ đã tải bên cạnh của mockup, chữ tiếng Anh. Không tạo file ảnh; so pixel chờ ảnh chuẩn của CI.
10. **Ngưỡng kích thước:**
    - Ngưỡng ban đầu (do Plan D của giai đoạn 3 ghi): JS 47580 B, CSS 9311 B.
    - Sau Task 2: JS 44.21 kB, CSS 8.83 kB. Sau Task 3: CSS chỉ còn 13 B dưới ngưỡng.
    - Sau Task 4, `check:package` fail chỉ ở `size`: CSS 9.57 kB trên ngưỡng 9.31 kB; JS còn chỗ.
    - `pnpm size:record` ở Task 4 ghi JS 49547 B, CSS 10530 B (số đo cộng 10%).
    - Task 1 không chạy `pnpm build`: không export, CSS hay danh sách gói nào đổi.
11. **Chỗ bước fail-first không đầy đủ**, theo các báo cáo của bản nháp:
    - Task 1: sáu test của `StatusIcon` fail trên code cũ. `draws the %s icon with unchanged markup` là test đặc tả (characterization): nó pass trên code cũ (4 test), và có mặt để chứng minh HTML không đổi.
    - Task 2: `Alert.test.tsx` fail cả file vì `./Alert` chưa có, nên không test nào được thấy fail vì lý do riêng. `public API` được thấy fail khi bản nháp cất `src/index.ts` đi. Bản nháp thấy `ExceptionTable.test.tsx` fail theo chiều ngược (test cũ trên dữ liệu mới: `expected [ <tr>…(6)</tr>, … ] to have a length of 22 but got 26`); lỗi trên cây của plan ở Step 2 được suy ra từ patch. `check:contrast` fail trước với 6 lỗi. `check:dist-css` là một danh sách, không chạy đỏ trước. Story viết sau khi unit test pass, nên không có lần fail riêng.
    - Task 3: `Progress.test.tsx` fail cả file. `ExceptionTable.test.tsx` được thấy fail khi `contrast-exceptions.ts` trả về bản cũ, đúng như trên cây của plan. `public API` chưa được thấy fail (export và dòng test được thêm cùng lúc); trên cây của plan nó fail vì danh sách thiếu `Progress`. `check:contrast` fail trước với 6 lỗi. `ValueChange` và `ReducedMotion` viết cùng CSS. Harness không có test.
    - Task 4: `Skeleton.test.tsx` fail cả file, và `theme-css.test.ts` fail đúng ở token mới. `public API` và `ReducedMotion` không được thấy fail trước. Story viết sau CSS; lần đỏ duy nhất của chúng là hai khẳng định sai của chính story (phát hiện 9). `check:package` fail chỉ ở `size` trước khi ghi ngưỡng.
    - Trên cây của plan, test patch của Task 2, 3 và 4 làm file test của component fail vì module chưa có (`Failed to resolve import …`).
12. **Ảnh chuẩn của component cũ không đổi.**
    - Task 1 đổi Toaster sang `StatusIcon`, mà HTML ra giống từng ký tự (phát hiện 4). CSS của Toast không đổi.
    - Task 2, 3 và 4 thêm file CSS mới, một token mới mà không gì cũ đọc (`--flg-skeleton-shine`), các selector `.flg-alert*`, `.flg-progress*`, `.flg-skeleton*` trong `preferences.css`, các `@import` và các dòng trong danh sách đăng ký.
    - Khối `prefers-reduced-motion` mới chỉ chọn `.flg-progress` và `.flg-skeleton`.
    - Harness: bốn mode cũ giữ nguyên; mode mới chỉ chạy với story có tag (phát hiện 8).
    - Bản nháp không chạy so sánh pixel (ảnh chuẩn cần Docker); CI visual xác nhận.
13. **Duyệt của chủ dự án.** Không có gì chờ chủ dự án duyệt ngoài review PR. Dòng 23 đến 29 được duyệt cùng spec ngày 2026-11-07. Mô tả PR vẫn liệt kê từng dòng kèm số đo; dòng 26 ở Plan A chỉ có tiêu đề Alert `plain`.
14. **Các mục để lại** (không làm ở plan này):
    - Kiểm tra screen reader (§7 dòng 6): hai công thức `role="status"` và `role="alert"` của Alert, tên, giá trị và trạng thái của Progress chưa thử với NVDA và VoiceOver.
    - Safari thật chưa thử; story chỉ chạy WebKit của Playwright.
    - Quy tắc giảm chuyển động chỉ được kiểm tự động ở Chromium: story `ReducedMotion` thoát sớm ở Firefox và WebKit, và ảnh chuẩn chỉ chụp ở Chromium. Chú thích của hai story `ReducedMotion` nói rõ điều đó (phát hiện 7).
    - Quầng focus của nút đóng trong Alert `stripe` bị `overflow: hidden` cắt, như ở Toast; outline vẫn nguyên (phát hiện 5).
    - Cảnh báo thiếu tên của Progress không nhắc `label`.
    - `Alert` đưa `IconButton` (client) vào đồ thị module của server, kể cả khi không render nó.

**Phạm vi:**
- **Không làm ở plan này:**
  - Plan B: `ExclamationIcon`, móc `data-visual-hover` của harness, List, Stepper, và phần của Stepper ở dòng 26, 27 và 29 của §4.9.
  - Plan C: `ArrowIcon`, `ChevronsUpDownIcon`, Table, mục "Loading states" và "Show data" của Getting started, các ghi chú mới của trang Accessibility, fixtures, changeset `minor` cho `0.3.0`.
  - Ngoài phạm vi của spec §2: banner dính đầu trang, tự đóng, hàng đợi (Alert); vòng tròn, nhiều đoạn, Meter, chữ trong thanh (Progress); cấu hình chung cho cả app, tự đo theo nội dung (Skeleton).
  - Các mục để lại ở phát hiện 14.
- **Ảnh chuẩn visual:**
  - Story có ảnh: `Stripe`, `Tinted`, `Plain` của Alert, mỗi story 8 ảnh (4 chế độ × sáng, tối); `Thin`, `Glow`, `Inline` của Progress và `Pulse`, `Shimmer`, `Glass` của Skeleton, mỗi story 10 ảnh (8 ảnh cộng 2 ảnh `reduced-motion`). Tổng cộng 84 ảnh mới. Mọi story khác của ba component gắn `no-visual`.
  - Không tạo ảnh trên Windows. Ảnh chuẩn mới chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh.
  - Ảnh của Toast và của mọi component cũ phải giữ giống từng byte.

## Global Constraints

- Tên package `h2d-glass-ui`; chỉ ESM; `exports` gồm `.`, `./styles.css` và `./package.json`; `"sideEffects": ["**/*.css"]`.
- `pnpm check:name` fail khi tên cũ xuất hiện lại ngoài `docs/superpowers`. Import trong trang MDX dùng `'h2d-glass-ui'`.
- Cảnh báo dev bắt đầu bằng `[h2d-glass-ui]`: `devWarn` thêm `WARN_PREFIX` của `src/internal/warn.ts`. Test so cả câu cảnh báo thì đọc `WARN_PREFIX`, không viết tay tiền tố.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`). Plan này không thêm dependency.
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`. `:has()` (dạng gọn của Alert) và đơn vị `lh` (Skeleton) có ở mọi trình duyệt của mốc này (spec §10).
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Biến thể và trạng thái dùng data-attribute (`data-variant`, `data-status`, `data-size`, `data-indeterminate`, `data-shape`).
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS component nằm trong `@layer flg.components`. Quy tắc `forced-colors`, `prefers-contrast: more` và khối `prefers-reduced-motion` viết tay nằm trong `src/styles/preferences.css` (spec §3.3).
- **Mockup lock.** Không giá trị token nào đang có trong `src/styles/theme/values.ts` đổi. Plan A thêm đúng một token theo theme, `--flg-skeleton-shine` (spec §4.2), giá trị chép nguyên từ mockup; chạy `pnpm gen:theme` sau khi sửa `values.ts`. Các màu chỉ để trang trí được viết thẳng bằng `color-mix` trong CSS của component (spec §4.2). Component cũ phải giữ ảnh giống từng byte. Alert, Progress và Skeleton theo đúng A1–A3, P1–P3, Sk1–Sk3, kể cả các cặp dưới ngưỡng của dòng 23 đến 29 (phát hiện 6).
- Mọi component dùng `forwardRef`, export kiểu props và kiểu `variant` của nó, và export phẳng từ `src/index.ts` (có trong `src/index.test.ts`). Module client bắt đầu bằng `"use client"` và có trong `scripts/check-use-client.ts` (ở Plan A chỉ có `Progress.tsx`). Phần server-safe có ca trong `scripts/rsc-probe.mjs` như §3.1 liệt kê. Class CSS mới có trong `scripts/check-dist-css.ts`.
- Chữ mặc định do lib cung cấp bằng tiếng Anh, ghi đè được qua `labels`. Cảnh báo dev đi qua `devWarn`. Lib không throw khi người dùng dùng sai. Trang docs (`*.mdx`) viết bằng tiếng Anh.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm bằng tay, **không** push lên `main`. `main` được bảo vệ (chỉ nhận PR, các check phải xanh): plan kết thúc bằng một PR.
- **Changeset:** Plan A không thêm changeset. Changeset `minor` cho `0.3.0` đến ở Plan C, nên merge Plan A không phát hành gì.
- **Ngưỡng `size-limit`:**
  - Ngưỡng ban đầu (do Plan D của giai đoạn 3 ghi): JS 47580 B, CSS 9311 B.
  - Task 1 không build. Task 2 và 3 chạy `pnpm build && pnpm check:package` và pass trong ngưỡng cũ; sau Task 3 CSS chỉ còn 13 B (phát hiện 10).
  - Chỉ Task 4 chạy `pnpm size:record` và commit `.size-limit.json`. Plan không chép file này: `size:record` tự ghi ngưỡng. Kết quả ở bản nháp: JS 49547 B, CSS 10530 B.
- Trước mọi lệnh `pnpm vitest run --project storybook-*` chạy thẳng, chạy `pnpm gen:theme`. Lần chạy story đầu có thể fail với `Failed to import test file …` khi Vite tối ưu lại; chạy lại.
- **Không chạy cả bộ story một lượt trên máy thiếu bộ nhớ.** Chạy từng thư mục một, như các lệnh trong plan. CI chạy cả bộ. Không chạy hai lượt story cùng lúc.
- **Cổng 5173, 4173 và 5174 thuộc các app khác của chủ dự án**: không dùng, không tắt tiến trình đang giữ chúng. Plan A không đổi fixture; **không chạy `pnpm test:fixtures`** trên máy này. Storybook chạy tạm (nếu cần) dùng cổng khác. Không để server hay tiến trình Storybook chạy sót.
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows. Ảnh chuẩn của Alert, Progress và Skeleton, kể cả các ảnh `--reduced-motion` mới, đến từ workflow "Update visual baselines" sau khi đẩy nhánh. Ảnh của Toast không được đổi.
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.

**Cách áp patch.**
- Mọi file, kể cả file mới, được đưa dưới dạng patch (`git diff`). Lưu nguyên khối patch vào một file **ngoài** repo (ví dụ `../task.patch`), giữ LF, rồi chạy `git apply ../task.patch` ở gốc repo.
- Nếu `git apply` báo lỗi thì dừng lại và báo cáo: nghĩa là cây đang khác với cây mà plan đã chạy thử.
- Mỗi task có hai khối patch, test rồi code. Áp theo đúng thứ tự trong plan. Khối code của Task 2 và Task 3 được áp làm hai lần (`--include=scripts/lib/contrast.ts`, rồi `--exclude=scripts/lib/contrast.ts`), như Step 2 và Step 3 của hai task đó ghi.
- Khối code của Task 2, 3 và 4 có dòng bắt đầu bằng ba dấu backtick (khối code trong MDX), nên chúng được rào bằng bốn dấu backtick. Nội dung patch là các dòng giữa hai hàng rào, như mọi khối khác.
- Task 2, 3 và 4 cùng sửa `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css` và `scripts/check-dist-css.ts`. Task 2 và 3 cùng sửa `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `src/docs/ExceptionTable.test.tsx`, `src/docs/Accessibility.mdx` và spec 0+1. Task 2 và 4 cùng sửa `scripts/rsc-probe.mjs`. Patch đã tính sẵn điều đó nếu áp đúng thứ tự.
- Plan này không xoá file nào. `.size-limit.json` không có trong patch nào: Task 4 ghi nó bằng `pnpm size:record`.

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý. Mỗi dòng có test ở task tương ứng:

1. **Một Alert render thẳng trong Server Component, không có `onDismiss`.** Không cần ranh giới client; trạng thái được nói bằng tên của icon, không chỉ bằng màu; không có nút đóng; lib không tự gán `role`. Test ở Task 2:
   - ca `Alert without onDismiss` của `check:rsc` (trong `pnpm check:package`, render từ `dist` với điều kiện `react-server`), cùng ba ca `AlertTitle asChild`, `AlertDescription`, `AlertActions`; probe chỉ chạy được ca này sau khi biết Fragment (phát hiện 5);
   - `renders a stripe info alert with no role of its own`, `names the %s icon so the status is not told by colour alone` và `shows the dismiss button only with onDismiss, and reports the click`.
2. **Một Progress đang tải lên nhận `NaN`, hoặc một giá trị lớn hơn `max`.** `NaN` thành chưa xác định (không có `aria-valuenow`); giá trị quá lớn bị kẹp ở `max` và phần đã chạy đầy đúng 100%; mỗi lỗi có một cảnh báo dev; không gì throw. Test ở Task 3:
   - `treats %s as indeterminate and says so in development` (`NaN`, ±`Infinity`), `clamps a value outside the range, and says so in development` và ``uses 100 for `max` %s, and says so in development``;
   - ba engine: story `ValueChange` (`aria-valuenow` và `aria-valuetext` theo giá trị, tới "100 of 100 MB, Success").
3. **Một Progress chưa xác định, với người dùng đã bật giảm chuyển động.** Thanh đứng yên; đoạn sọc phủ cả rãnh để không bị đọc thành một giá trị, và giữ màu của phần đã chạy; ở `glow` không có quầng. Test ở Task 3: story `ReducedMotion` (`getAnimations()` rỗng, `mask-image` là `repeating-linear-gradient`, đoạn rộng bằng rãnh; chỉ ở Chromium); `IndeterminateMotion` cho animation khi không giảm chuyển động; lượt ảnh `reduced-motion` của `Thin`, `Glow`, `Inline` (Chromium, chạy lần đầu trong CI). Firefox và WebKit không có kiểm tra tự động cho quy tắc này (phát hiện 7).
4. **Một danh sách Skeleton trong vùng chứa `aria-busy`.** Không khối nào được đọc, kể cả khi người dùng truyền `aria-hidden={false}`; vùng chứa tự nói "đang tải" một lần; mỗi dòng `text` chiếm đúng một dòng chữ. Test ở Task 4: `is always hidden from assistive technology, whatever the caller passes` và `is hidden whatever the caller passes`; story `TextLines` (42px và 21px); axe chạy sau khi render ở `Pulse`, `Shimmer`, `Glass` (thẻ hồ sơ và danh sách ba dòng). Công thức `aria-busy` cộng `Spinner` chỉ có trong `Skeleton.mdx`; không story nào dựng vùng chứa đó.
5. **Toast sau khi icon chuyển sang `StatusIcon`.** Mỗi toast vẫn có icon `role="img"` mang tên trạng thái; HTML giống từng ký tự; ảnh chuẩn không đổi. Test ở Task 1: `draws the %s icon with unchanged markup` (bốn trạng thái, test đặc tả); story của toast (42, ba engine); ảnh chuẩn cũ của Toast trong CI visual.

Hai chỗ **chỉ story bắt được**: khung hình của animation (`IndeterminateMotion`, `AnimationFrames`) và chiều cao dòng của Skeleton (`TextLines`). jsdom không có animation hay layout, nên mọi unit test vẫn pass khi CSS của chúng sai.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/internal/icons.tsx` (và test); `src/components/toast/Toaster.tsx`, `store.ts` (và `Toaster.test.tsx`) | `StatusIcon`, `StatusIconStatus`; Toaster dùng nó (Task 1) |
| `src/components/alert/*`, `src/styles/components/alert.css` | `Alert`, `AlertTitle`, `AlertDescription`, `AlertActions` (Task 2) |
| `src/components/progress/*`, `src/styles/components/progress.css` | `Progress` (Task 3) |
| `src/components/skeleton/*`, `src/styles/components/skeleton.css` | `Skeleton`, `SkeletonText` (Task 4) |
| `src/styles/theme/values.ts`, `scripts/lib/theme-css.test.ts` | Token `--flg-skeleton-shine` (Task 4) |
| `src/styles/preferences.css` | Forced colors (Task 2, 3, 4); `prefers-contrast: more` của Progress (Task 3); khối `prefers-reduced-motion` (Task 3, 4) |
| `src/styles/index.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `scripts/rsc-probe.mjs` | Đăng ký, export, kiểm tra gói (Task 2, 3, 4) |
| `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `src/docs/ExceptionTable.test.tsx`, `src/docs/Accessibility.mdx`, spec 0+1 §4.9 | Mười cặp tương phản, dòng 23 đến 29 (Task 2, 3) |
| `tests/visual/stories.visual.ts` | Lượt `reduced-motion` (Task 3) |
| `.size-limit.json` | Ngưỡng mới (Task 4) |
| `docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md` | Hai dòng "phát hiện khi lập Plan A" (Task 3) |

---

### Task 1: `StatusIcon` dùng chung, Toaster dùng nó

Spec §2 (dòng A, "Thay đổi ở code cũ"), §4.6, §7 dòng 1 (**Toaster**). Bốn icon trạng thái của Toaster chuyển vào `src/internal/icons.tsx`, để Alert (Task 2) và Progress (Task 3) dùng lại mà không import từ thư mục Toast.
- `StatusIcon({ status, ...props })` trải `strokeIcon` rồi tới props: mặc định nó ẩn như các icon khác. Toaster truyền `aria-hidden={undefined}`, `role="img"` và `aria-label` như trước (phát hiện 4).
- Bảng đường vẽ chuyển nguyên. `ToastStatus` thành bí danh của `StatusIconStatus`.
- HTML của icon Toast phải giữ nguyên từng ký tự. Một test đặc tả, viết trước trên code cũ, so `innerHTML` của `.flg-toast-icon` với chuỗi viết sẵn cho cả bốn trạng thái.
- Không chạy `pnpm build && pnpm check:package` ở task này: không export, CSS hay danh sách gói nào đổi. Task 2 chạy nó.

**Files:**
- Modify: `src/internal/icons.tsx`, `src/internal/icons.test.tsx`, `src/components/toast/Toaster.tsx`, `src/components/toast/Toaster.test.tsx`, `src/components/toast/store.ts`

**Interfaces:**
- Produces trong `src/internal/icons.tsx` (không export ra ngoài package):
  - `type StatusIconStatus = 'info' | 'success' | 'warning' | 'error'`.
  - `StatusIcon({ status, ...props }: { status: StatusIconStatus } & SVGProps<SVGSVGElement>)`: SVG 24×24 nét 2 với đường vẽ của trạng thái (vòng tròn chữ i, vòng tròn dấu ✓, tam giác dấu !, vòng tròn dấu ×). `aria-hidden` và `focusable="false"` đến từ `strokeIcon`; props ghi đè được chúng.
  - `ToastStatus` (public, `src/components/toast/store.ts`) là `StatusIconStatus`: cùng union, kiểu public không đổi.
- Consumes: `strokeIcon`.
- Task sau dùng: Alert (Task 2, icon có tên), Progress (Task 3, icon ẩn).

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/toast/Toaster.test.tsx b/src/components/toast/Toaster.test.tsx
index 25674bc..686316a 100644
--- a/src/components/toast/Toaster.test.tsx
+++ b/src/components/toast/Toaster.test.tsx
@@ -131,6 +131,30 @@ describe('Toaster', () => {
     expect(items()).toHaveLength(0);
   });
 
+  // Characterization: the glyphs moved out of Toaster into the shared StatusIcon, and the markup
+  // of every toast icon must stay byte for byte what it was (spec phase 4 §4.6, §7 row 1).
+  const SVG_OPEN =
+    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" role="img" aria-label=';
+  const CIRCLE = '<circle cx="12" cy="12" r="10"></circle>';
+  it.each([
+    ['info', 'Info', `${CIRCLE}<path d="M12 16v-4M12 8h.01"></path>`],
+    ['success', 'Success', `${CIRCLE}<path d="m9 12 2 2 4-4"></path>`],
+    [
+      'warning',
+      'Warning',
+      '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"></path><path d="M12 9v4M12 17h.01"></path>',
+    ],
+    ['error', 'Error', `${CIRCLE}<path d="m15 9-6 6M9 9l6 6"></path>`],
+  ] as const)('draws the %s icon with unchanged markup', (status, name, children) => {
+    mount();
+    show(() => toast[status]({ title: 'T' }));
+    const [item] = items();
+    if (!item) throw new Error('no toast');
+    expect(item.querySelector('.flg-toast-icon')?.innerHTML).toBe(
+      `${SVG_OPEN}"${name}">${children}</svg>`,
+    );
+  });
+
   it('closes a toast after its time, and takes `duration` and `max`', () => {
     mount({ duration: 1000, max: 2 });
     show(() => {
diff --git a/src/internal/icons.test.tsx b/src/internal/icons.test.tsx
index 374f8a8..d11494c 100644
--- a/src/internal/icons.test.tsx
+++ b/src/internal/icons.test.tsx
@@ -10,6 +10,7 @@ import {
   FileIcon,
   MinusIcon,
   PlusIcon,
+  StatusIcon,
   UploadIcon,
   strokeIcon,
 } from './icons';
@@ -101,6 +102,49 @@ describe('shared icons', () => {
     ]);
   });
 
+  it.each([
+    ['info', ['M12 16v-4M12 8h.01'], 1],
+    ['success', ['m9 12 2 2 4-4'], 1],
+    [
+      'warning',
+      [
+        'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
+        'M12 9v4M12 17h.01',
+      ],
+      0,
+    ],
+    ['error', ['m15 9-6 6M9 9l6 6'], 1],
+  ] as const)('StatusIcon %s draws its glyph', (status, paths, circles) => {
+    const { container } = render(<StatusIcon status={status} />);
+    expect(Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('d'))).toEqual(
+      paths,
+    );
+    expect(container.querySelectorAll('circle')).toHaveLength(circles);
+    const svg = container.querySelector('svg')!;
+    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
+    expect(svg.getAttribute('stroke-width')).toBe('2');
+  });
+
+  it('StatusIcon is hidden by default and lets a caller name it', () => {
+    const { container, rerender } = render(<StatusIcon status="info" />);
+    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
+    rerender(<StatusIcon status="info" aria-hidden={undefined} role="img" aria-label="Info" />);
+    const svg = container.querySelector('svg')!;
+    expect(svg.hasAttribute('aria-hidden')).toBe(false);
+    expect(svg.getAttribute('role')).toBe('img');
+    expect(svg.getAttribute('aria-label')).toBe('Info');
+  });
+
+  it('StatusIcon forwards size and className', () => {
+    const { container } = render(
+      <StatusIcon status="error" width={14} height={14} className="x" />,
+    );
+    const svg = container.querySelector('svg')!;
+    expect(svg.getAttribute('width')).toBe('14');
+    expect(svg.getAttribute('height')).toBe('14');
+    expect(svg.getAttribute('class')).toBe('x');
+  });
+
   it('forwards extra props such as className', () => {
     const { container } = render(<ChevronIcon direction="down" className="flg-select-chevron" />);
     expect(container.querySelector('svg')?.getAttribute('class')).toBe('flg-select-chevron');
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/internal/icons.test.tsx src/components/toast/Toaster.test.tsx
```

Expected: FAIL 6 test ở mỗi project React, cả sáu trong `icons.test.tsx`: `StatusIcon %s draws its glyph` (bốn trạng thái), `StatusIcon is hidden by default and lets a caller name it` và `StatusIcon forwards size and className`. Lỗi: `Element type is invalid … got: undefined`, vì `StatusIcon` chưa được export.

Test đặc tả `Toaster > draws the %s icon with unchanged markup` PASS cả bốn trên code cũ (phát hiện 11). Nó ghi lại HTML hiện có, để Step 4 chứng minh HTML không đổi.

- [ ] **Step 3: Viết code**

```diff
diff --git a/src/components/toast/Toaster.tsx b/src/components/toast/Toaster.tsx
index c8740d0..a18ffd1 100644
--- a/src/components/toast/Toaster.tsx
+++ b/src/components/toast/Toaster.tsx
@@ -11,11 +11,11 @@ import {
   useState,
   useSyncExternalStore,
 } from 'react';
-import type { FocusEvent, HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
+import type { FocusEvent, HTMLAttributes, KeyboardEvent } from 'react';
 import { createPortal } from 'react-dom';
 import { composeEventHandlers } from '../../internal/compose-event-handlers';
 import { returnFocus } from '../../internal/focus';
-import { CloseIcon, strokeIcon } from '../../internal/icons';
+import { CloseIcon, StatusIcon } from '../../internal/icons';
 import { mergeRefs } from '../../internal/merge-refs';
 import { getTopModal, subscribeModals } from '../../internal/modal-stack';
 import { hasModifier } from '../../internal/roving';
@@ -23,7 +23,7 @@ import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
 import { devWarn } from '../../internal/warn';
 import { Button } from '../button/Button';
 import { toastStore } from './store';
-import type { ToastEntry, ToastState, ToastStatus } from './store';
+import type { ToastEntry, ToastState } from './store';
 
 export type ToastPosition =
   'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
@@ -98,33 +98,6 @@ const DEFAULT_LABELS: ToasterLabels = {
 const EMPTY: ToastState = { toasts: [], shown: [] };
 const noModal = () => undefined;
 
-const ICONS: Record<ToastStatus, ReactNode> = {
-  success: (
-    <>
-      <circle cx="12" cy="12" r="10" />
-      <path d="m9 12 2 2 4-4" />
-    </>
-  ),
-  error: (
-    <>
-      <circle cx="12" cy="12" r="10" />
-      <path d="m15 9-6 6M9 9l6 6" />
-    </>
-  ),
-  warning: (
-    <>
-      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
-      <path d="M12 9v4M12 17h.01" />
-    </>
-  ),
-  info: (
-    <>
-      <circle cx="12" cy="12" r="10" />
-      <path d="M12 16v-4M12 8h.01" />
-    </>
-  ),
-};
-
 interface ToastItemProps {
   entry: ToastEntry;
   labels: ToasterLabels;
@@ -154,9 +127,12 @@ function ToastItem({ entry, labels, register, moved }: ToastItemProps) {
         {/* Named, so the status is not told by its colour alone. */}
         {/* `aria-hidden` is left undefined: the icon carries its own name (`role="img"` +
             `aria-label`), so it must not be hidden from assistive tech. */}
-        <svg {...strokeIcon} aria-hidden={undefined} role="img" aria-label={labels[status]}>
-          {ICONS[status]}
-        </svg>
+        <StatusIcon
+          status={status}
+          aria-hidden={undefined}
+          role="img"
+          aria-label={labels[status]}
+        />
       </span>
       <div className="flg-toast-text">
         <div className="flg-toast-title">{entry.title}</div>
diff --git a/src/components/toast/store.ts b/src/components/toast/store.ts
index 3fee323..8fd0300 100644
--- a/src/components/toast/store.ts
+++ b/src/components/toast/store.ts
@@ -1,7 +1,8 @@
 import type { MouseEvent, ReactNode } from 'react';
+import type { StatusIconStatus } from '../../internal/icons';
 import { devWarn } from '../../internal/warn';
 
-export type ToastStatus = 'info' | 'success' | 'warning' | 'error';
+export type ToastStatus = StatusIconStatus;
 
 export interface ToastAction {
   label: string;
diff --git a/src/internal/icons.tsx b/src/internal/icons.tsx
index aefc475..1ea58f3 100644
--- a/src/internal/icons.tsx
+++ b/src/internal/icons.tsx
@@ -1,4 +1,4 @@
-import type { SVGProps } from 'react';
+import type { ReactNode, SVGProps } from 'react';
 
 /** What every stroked 24×24 icon of the library shares; hidden, since its control is named. */
 export const strokeIcon = {
@@ -30,6 +30,33 @@ export function BoxCheckIcon(props: SVGProps<SVGSVGElement>) {
   );
 }
 
+const STATUS_GLYPHS: Record<StatusIconStatus, ReactNode> = {
+  success: (
+    <>
+      <circle cx="12" cy="12" r="10" />
+      <path d="m9 12 2 2 4-4" />
+    </>
+  ),
+  error: (
+    <>
+      <circle cx="12" cy="12" r="10" />
+      <path d="m15 9-6 6M9 9l6 6" />
+    </>
+  ),
+  warning: (
+    <>
+      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
+      <path d="M12 9v4M12 17h.01" />
+    </>
+  ),
+  info: (
+    <>
+      <circle cx="12" cy="12" r="10" />
+      <path d="M12 16v-4M12 8h.01" />
+    </>
+  ),
+};
+
 export type ChevronDirection = 'down' | 'up' | 'left' | 'right';
 
 const CHEVRON_PATHS: Record<ChevronDirection, string> = {
@@ -60,6 +87,24 @@ export function CloseIcon(props: SVGProps<SVGSVGElement>) {
   );
 }
 
+export type StatusIconStatus = 'info' | 'success' | 'warning' | 'error';
+
+/**
+ * The glyph of a status: a circled i, a circled check, a triangle with an exclamation mark and a
+ * circled ×. Toaster, Alert and Progress share it. It is hidden like the other icons; a caller
+ * that lets it carry the status passes `aria-hidden={undefined}`, `role="img"` and an `aria-label`.
+ */
+export function StatusIcon({
+  status,
+  ...props
+}: { status: StatusIconStatus } & SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      {STATUS_GLYPHS[status]}
+    </svg>
+  );
+}
+
 /** A minus sign. */
 export function MinusIcon(props: SVGProps<SVGSVGElement>) {
   return (
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/internal src/components/toast
pnpm vitest run --project storybook-light --project storybook-dark src/components/toast
```

Expected:
- Unit: 52 file, 546 test PASS, 3 skip. `icons.test.tsx` có 21 test và `Toaster.test.tsx` có 62 test ở mỗi project React, trong đó 6 và 4 test mới.
- Story toast: 42 test PASS (ba engine × hai theme).
- HTML của icon Toast không đổi (test đặc tả vẫn pass) và CSS của Toast không đổi, nên ảnh chuẩn của Toast giữ nguyên.
- Không chạy `pnpm build && pnpm check:package` (phát hiện 10).

- [ ] **Step 5: Commit**

```bash
git add \
  src/components/toast/Toaster.test.tsx \
  src/components/toast/Toaster.tsx \
  src/components/toast/store.ts \
  src/internal/icons.test.tsx \
  src/internal/icons.tsx
```
```bash
git commit -m "refactor(toast): share the status glyphs as StatusIcon" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 2: Alert (`stripe`, `tinted`, `plain`)

Spec §1, §3.1 (dòng Alert, các ca `check:rsc`), §3.2, §3.4 (Alert), §4.1, §4.3 **Alert**, §4.4 (bảy check `alert-*`; dòng 23 đến 26; dòng 21 và 22 mở rộng), §4.5 **Alert**, §6.1, §6.2, §6.3 **`Alert`**, `AlertTitle`, `AlertDescription`, `AlertActions`, §7 (Alert ở dòng 1, 3, 4, 5; test kiểu; kiểm tra gói), §8 (trang Alert, mục "Variants", hai công thức thông báo). Mockup A1, A2, A3. Một thông báo nằm yên trong trang, khác Toast: không tự biến mất, không có hàng đợi.
- **Server-safe:** không `"use client"`, không hook. Nút đóng là `IconButton` `ghost` `sm` với `CloseIcon`, trong `span.flg-alert-dismiss`, chỉ khi có `onDismiss` (phát hiện 5).
- **Cấu trúc** như HTML của §6.3: `div.flg-alert` với `data-variant` và `data-status`; `span.flg-alert-icon`; `div.flg-alert-body` nhận `children`; nút đóng. `AlertTitle` là `<div>`, thành phần tử con với `asChild` (`Slot`); `AlertDescription` và `AlertActions` là `<div>`.
- **Icon:** mặc định là `StatusIcon` có tên (`role="img"`, `aria-label` từ `labels`). `icon` là node thì thay icon, `false` hoặc `null` thì bỏ; khi đó tên trạng thái thành chữ ẩn ở đầu thân (phát hiện 5).
- **Không có `role` mặc định;** `role` của người dùng đi qua (§3.4). Story `PoliteRecipe` và `UrgentRecipe` dựng hai công thức của docs.
- **Giao diện A1–A3** (§4.3): phần chung viết một lần, mỗi variant chỉ ghi phần khác. Forced colors: viền và vạch `CanvasText`. Không có quy tắc `prefers-contrast: more`.
- **Tương phản:** bảy check mới; sáu số tối dưới ngưỡng thành dòng 23 đến 26 của §4.9 (phát hiện 6). `ExceptionTable.test.tsx` đòi 26 dòng; câu trỏ của `Accessibility.mdx` thêm Alert.
- `rsc-probe.mjs` học Fragment (phát hiện 5).

**Files:**
- Create: `src/components/alert/Alert.tsx`, `index.ts`, `Alert.test.tsx`, `Alert.test-d.ts`, `Alert.stories.tsx`, `Alert.mdx`, `src/styles/components/alert.css`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/check-dist-css.ts`, `scripts/rsc-probe.mjs`, `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `src/docs/ExceptionTable.test.tsx`, `src/docs/Accessibility.mdx`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`

**Interfaces:**
- Produces trong `src/components/alert/Alert.tsx` (server-safe), export qua `index.ts` và `src/index.ts`:
  - `Alert`: `forwardRef<HTMLDivElement, AlertProps>`. `AlertTitle`, `AlertDescription`, `AlertActions`: `forwardRef<HTMLDivElement, …>`.
  - `AlertProps extends HTMLAttributes<HTMLDivElement>`: `status?: AlertStatus` (mặc định `'info'`), `variant?: AlertVariant` (mặc định `'stripe'`), `icon?: ReactNode | false`, `onDismiss?: (event: MouseEvent<HTMLButtonElement>) => void`, `labels?: Partial<AlertLabels>`.
  - `AlertTitleProps` (`asChild?: boolean`), `AlertDescriptionProps` và `AlertActionsProps` (`HTMLAttributes<HTMLDivElement>`).
  - `AlertStatus` là `StatusIconStatus`; `AlertVariant = 'stripe' | 'tinted' | 'plain'`.
  - `AlertLabels`: `info` (`"Info"`), `success` (`"Success"`), `warning` (`"Warning"`), `error` (`"Error"`), `dismiss` (`"Dismiss"`).
  - Class: `flg-alert`, `flg-alert-icon`, `flg-alert-body`, `flg-alert-title`, `flg-alert-description`, `flg-alert-actions`, `flg-alert-dismiss`. Biến cục bộ `--flg-alert-color`, `--flg-alert-title-color`, `--flg-alert-tint`.
  - Hook DOM: `data-variant` và `data-status` trên gốc.
  - Bảy check mới trong `CHECKS` của `scripts/lib/contrast.ts`: `'alert-stripe-text': 4.5`, `'alert-stripe-icon': 3`, `'alert-tinted-title': 4.5`, `'alert-tinted-text': 4.5`, `'alert-tinted-icon': 3`, `'alert-plain-title': 4.5`, `'alert-plain-icon': 3`.
  - `KNOWN_EXCEPTIONS` có thêm, cả sáu ở tối: dòng 23 (`alert-stripe-icon` `recorded: 2.02`, `alert-tinted-icon` 1.84, `alert-plain-icon` 1.88, tiêu chí `1.4.11`), dòng 24 (`alert-tinted-title` 3.37), dòng 25 (`alert-tinted-text` 4.16) và dòng 26 (`alert-plain-title` 3.9), ba dòng sau tiêu chí `1.4.3`. Mô tả của dòng 21 và 22 thêm Alert.
  - `scripts/rsc-probe.mjs`: `renderTree` đi qua Fragment; bốn ca `Alert without onDismiss`, `AlertTitle asChild`, `AlertDescription`, `AlertActions`.
- Consumes: `StatusIcon`, `StatusIconStatus` (Task 1); `CloseIcon`, `Slot`, `IconButton`; `Button`, `Card` trong story.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/alert/Alert.stories.tsx b/src/components/alert/Alert.stories.tsx
new file mode 100644
index 0000000..4563d56
--- /dev/null
+++ b/src/components/alert/Alert.stories.tsx
@@ -0,0 +1,193 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { useRef, useState } from 'react';
+import { expect, userEvent, waitFor } from 'storybook/test';
+import { Button } from '../button/Button';
+import { Card, CardHeader, CardTitle } from '../card/Card';
+import { Alert, AlertActions, AlertDescription, AlertTitle } from './Alert';
+import type { AlertProps } from './Alert';
+
+const meta = {
+  title: 'Components/Alert',
+  component: Alert,
+} satisfies Meta<typeof Alert>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+const column = { display: 'grid', gap: 12, width: 400 } as const;
+
+/**
+ * The states of the approved mockup (alert A1-A3), in a card as there: the four statuses with a
+ * title and a description, one with two actions, one that closes, and the compact form, a title alone.
+ */
+function Billing({ variant }: Pick<AlertProps, 'variant'>) {
+  return (
+    <Card style={{ gap: 12, width: 400 }}>
+      <CardHeader>
+        <CardTitle>Billing</CardTitle>
+      </CardHeader>
+      <Alert variant={variant} status="info">
+        <AlertTitle>The next billing period starts on 1 December</AlertTitle>
+        <AlertDescription>
+          November&apos;s invoice will be emailed to you within 3 days.
+        </AlertDescription>
+      </Alert>
+      <Alert variant={variant} status="success">
+        <AlertTitle>Payment method saved</AlertTitle>
+        <AlertDescription>The Visa ending 4242 will be used from now on.</AlertDescription>
+      </Alert>
+      <Alert variant={variant} status="warning">
+        <AlertTitle>Close to your spending limit</AlertTitle>
+        <AlertDescription>You have used 90% of this month&apos;s $500 limit.</AlertDescription>
+      </Alert>
+      <Alert variant={variant} status="error">
+        <AlertTitle>The payment did not go through</AlertTitle>
+        <AlertDescription>
+          The bank declined the charge. Check the balance or use another card.
+        </AlertDescription>
+      </Alert>
+      <Alert variant={variant} status="warning">
+        <AlertTitle>Your card is about to expire</AlertTitle>
+        <AlertDescription>
+          The Visa ending 4242 expires in 12/2026. Update it to avoid an interruption.
+        </AlertDescription>
+        <AlertActions>
+          <Button variant="secondary" size="sm">
+            Update card
+          </Button>
+          <Button variant="ghost" size="sm">
+            Later
+          </Button>
+        </AlertActions>
+      </Alert>
+      <Alert variant={variant} status="info" onDismiss={() => {}}>
+        <AlertTitle>Your e-invoice is ready</AlertTitle>
+        <AlertDescription>Download the VAT invoice from the payment history.</AlertDescription>
+      </Alert>
+      <Alert variant={variant} status="success">
+        <AlertTitle>Auto-renewal is on</AlertTitle>
+      </Alert>
+    </Card>
+  );
+}
+
+export const Stripe: Story = { render: () => <Billing variant="stripe" /> };
+export const Tinted: Story = { render: () => <Billing variant="tinted" /> };
+export const Plain: Story = { render: () => <Billing variant="plain" /> };
+
+/** A closing Alert: the parent drops it, and sends focus where the page goes on. */
+function Dismissible() {
+  const [open, setOpen] = useState(true);
+  const heading = useRef<HTMLHeadingElement>(null);
+  return (
+    <div style={column}>
+      <h2 ref={heading} tabIndex={-1} style={{ margin: 0, font: 'inherit' }}>
+        Notifications
+      </h2>
+      {open ? (
+        <Alert
+          onDismiss={() => {
+            setOpen(false);
+            // The button that had focus is gone with the Alert; without this, focus falls to the body.
+            heading.current?.focus();
+          }}
+        >
+          <AlertTitle>Your e-invoice is ready</AlertTitle>
+        </Alert>
+      ) : null}
+    </div>
+  );
+}
+
+export const Dismiss: Story = {
+  tags: ['no-visual'],
+  render: () => <Dismissible />,
+  play: async ({ canvas }) => {
+    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
+    await expect(canvas.queryByText('Your e-invoice is ready')).toBeNull();
+    await expect(canvas.getByRole('heading', { name: 'Notifications' })).toHaveFocus();
+  },
+};
+
+/** The polite recipe: the live region is in the page from the start, empty; the Alert goes into it. */
+function Polite() {
+  const [saved, setSaved] = useState(false);
+  return (
+    <div style={column}>
+      <Button variant="secondary" onClick={() => setSaved(true)}>
+        Save
+      </Button>
+      <div role="status">
+        {saved ? (
+          <Alert status="success">
+            <AlertTitle>Changes saved</AlertTitle>
+          </Alert>
+        ) : null}
+      </div>
+    </div>
+  );
+}
+
+export const PoliteRecipe: Story = {
+  tags: ['no-visual'],
+  render: () => <Polite />,
+  play: async ({ canvas }) => {
+    const region = canvas.getByRole('status');
+    await expect(region).toBeEmptyDOMElement();
+    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
+    await waitFor(() => expect(region).toHaveTextContent('Changes saved'));
+  },
+};
+
+/** The urgent recipe: the Alert carries `role="alert"` and is put into the tree after the action. */
+function Urgent() {
+  const [failed, setFailed] = useState(false);
+  return (
+    <div style={column}>
+      <Button variant="secondary" onClick={() => setFailed(true)}>
+        Pay
+      </Button>
+      {failed ? (
+        <Alert role="alert" status="error">
+          <AlertTitle>The payment did not go through</AlertTitle>
+        </Alert>
+      ) : null}
+    </div>
+  );
+}
+
+export const UrgentRecipe: Story = {
+  tags: ['no-visual'],
+  render: () => <Urgent />,
+  play: async ({ canvas }) => {
+    await expect(canvas.queryByRole('alert')).toBeNull();
+    await userEvent.click(canvas.getByRole('button', { name: 'Pay' }));
+    await expect(await canvas.findByRole('alert')).toHaveTextContent(
+      'The payment did not go through',
+    );
+  },
+};
+
+export const Icons: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={column}>
+      <Alert status="warning" icon={<span aria-hidden>!</span>}>
+        <AlertTitle asChild>
+          <h3>Own icon</h3>
+        </AlertTitle>
+      </Alert>
+      <Alert status="error" icon={false} labels={{ error: 'Failed' }}>
+        <AlertTitle>No icon</AlertTitle>
+      </Alert>
+    </div>
+  ),
+  play: async ({ canvas }) => {
+    // The status is not lost with the icon: it is read out as text, before the title.
+    await expect(canvas.getByRole('heading', { level: 3 }).parentElement).toHaveTextContent(
+      'Warning: Own icon',
+    );
+    await expect(canvas.getByText('No icon').parentElement).toHaveTextContent('Failed: No icon');
+    await expect(canvas.queryByRole('img')).toBeNull();
+  },
+};
diff --git a/src/components/alert/Alert.test-d.ts b/src/components/alert/Alert.test-d.ts
new file mode 100644
index 0000000..5d5ad0f
--- /dev/null
+++ b/src/components/alert/Alert.test-d.ts
@@ -0,0 +1,37 @@
+import { expectTypeOf, test } from 'vitest';
+import type { MouseEvent, ReactNode } from 'react';
+import type { AlertLabels, AlertProps, AlertTitleProps } from './Alert';
+
+test('an Alert takes only the documented variants and statuses', () => {
+  expectTypeOf<AlertProps['variant']>().toEqualTypeOf<'stripe' | 'tinted' | 'plain' | undefined>();
+  expectTypeOf<AlertProps['status']>().toEqualTypeOf<
+    'info' | 'success' | 'warning' | 'error' | undefined
+  >();
+  // @ts-expect-error an unknown variant
+  const unknownVariant: AlertProps = { variant: 'solid' };
+  // @ts-expect-error the variant of another component
+  const otherVariant: AlertProps = { variant: 'inset' };
+  // @ts-expect-error an unknown status
+  const unknownStatus: AlertProps = { status: 'danger' };
+  expectTypeOf(unknownVariant).toBeObject();
+  expectTypeOf(otherVariant).toBeObject();
+  expectTypeOf(unknownStatus).toBeObject();
+});
+
+test('the icon is a node or false, and a dismissal reports the click', () => {
+  expectTypeOf<AlertProps['icon']>().toEqualTypeOf<ReactNode | false>();
+  expectTypeOf<NonNullable<AlertProps['onDismiss']>>().parameters.toEqualTypeOf<
+    [MouseEvent<HTMLButtonElement>]
+  >();
+});
+
+test('labels may be given in part, with a name for each status and the button', () => {
+  expectTypeOf<NonNullable<AlertProps['labels']>>().toEqualTypeOf<Partial<AlertLabels>>();
+  expectTypeOf<keyof AlertLabels>().toEqualTypeOf<
+    'info' | 'success' | 'warning' | 'error' | 'dismiss'
+  >();
+});
+
+test('only the title can render as its child', () => {
+  expectTypeOf<AlertTitleProps['asChild']>().toEqualTypeOf<boolean | undefined>();
+});
diff --git a/src/components/alert/Alert.test.tsx b/src/components/alert/Alert.test.tsx
new file mode 100644
index 0000000..4be7b81
--- /dev/null
+++ b/src/components/alert/Alert.test.tsx
@@ -0,0 +1,159 @@
+import { render, screen } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { createRef } from 'react';
+import { describe, expect, it, vi } from 'vitest';
+import { Alert, AlertActions, AlertDescription, AlertTitle } from './Alert';
+
+const STATUSES = ['info', 'success', 'warning', 'error'] as const;
+const NAMES = { info: 'Info', success: 'Success', warning: 'Warning', error: 'Error' };
+
+describe('Alert', () => {
+  it('renders a stripe info alert with no role of its own', () => {
+    const { container } = render(<Alert>Saved</Alert>);
+    const alert = container.firstElementChild!;
+    expect(alert.tagName).toBe('DIV');
+    expect(alert).toHaveClass('flg-alert');
+    expect(alert).toHaveAttribute('data-variant', 'stripe');
+    expect(alert).toHaveAttribute('data-status', 'info');
+    // A static message in the page is not a live region (spec §3.4); the caller adds a role.
+    expect(alert).not.toHaveAttribute('role');
+    expect(alert.querySelector('.flg-alert-body')).toHaveTextContent('Saved');
+  });
+
+  it.each(['stripe', 'tinted', 'plain'] as const)('reflects variant %s', (variant) => {
+    const { container } = render(<Alert variant={variant}>x</Alert>);
+    expect(container.firstElementChild).toHaveAttribute('data-variant', variant);
+  });
+
+  it.each(STATUSES)('names the %s icon so the status is not told by colour alone', (status) => {
+    const { container } = render(<Alert status={status}>x</Alert>);
+    expect(container.firstElementChild).toHaveAttribute('data-status', status);
+    const icon = screen.getByRole('img', { name: NAMES[status] });
+    expect(icon.tagName.toLowerCase()).toBe('svg');
+    expect(icon.closest('.flg-alert-icon')).not.toHaveAttribute('aria-hidden');
+    // The icon names the status, so no hidden text repeats it.
+    expect(container.querySelector('.flg-visually-hidden')).toBeNull();
+  });
+
+  it('says the status in the words of `labels`', () => {
+    render(
+      <Alert status="warning" labels={{ warning: 'Cảnh báo' }}>
+        x
+      </Alert>,
+    );
+    expect(screen.getByRole('img', { name: 'Cảnh báo' })).toBeInTheDocument();
+  });
+
+  it('passes a role through, for a live region', () => {
+    render(
+      <Alert role="alert" status="error">
+        Payment failed
+      </Alert>,
+    );
+    expect(screen.getByRole('alert')).toHaveTextContent('Payment failed');
+  });
+
+  it('takes an icon of the caller and keeps the status in hidden text', () => {
+    const { container } = render(
+      <Alert status="warning" icon={<svg data-testid="mine" />}>
+        <AlertTitle>Low disk</AlertTitle>
+      </Alert>,
+    );
+    const wrapper = container.querySelector('.flg-alert-icon')!;
+    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
+    expect(wrapper).toContainElement(screen.getByTestId('mine'));
+    expect(screen.queryByRole('img')).toBeNull();
+    const hidden = container.querySelector('.flg-alert-body > .flg-visually-hidden');
+    expect(hidden).toHaveTextContent('Warning:');
+    // It comes before the title, so it reads as "Warning: Low disk".
+    expect(hidden!.nextElementSibling).toHaveClass('flg-alert-title');
+  });
+
+  it('drops the icon with `icon={false}` and still says the status', () => {
+    const { container } = render(
+      <Alert status="error" icon={false} labels={{ error: 'Lỗi' }}>
+        <AlertTitle>Failed</AlertTitle>
+      </Alert>,
+    );
+    expect(container.querySelector('.flg-alert-icon')).toBeNull();
+    expect(container.querySelector('.flg-visually-hidden')).toHaveTextContent('Lỗi:');
+  });
+
+  it('shows the dismiss button only with onDismiss, and reports the click', async () => {
+    const onDismiss = vi.fn();
+    const { rerender } = render(<Alert>x</Alert>);
+    expect(screen.queryByRole('button')).toBeNull();
+    rerender(<Alert onDismiss={onDismiss}>x</Alert>);
+    const button = screen.getByRole('button', { name: 'Dismiss' });
+    expect(button).toHaveClass('flg-button');
+    expect(button).toHaveAttribute('data-variant', 'ghost');
+    expect(button).toHaveAttribute('data-size', 'sm');
+    expect(button.closest('.flg-alert-dismiss')).not.toBeNull();
+    await userEvent.click(button);
+    expect(onDismiss).toHaveBeenCalledTimes(1);
+    expect(onDismiss.mock.calls[0]![0]).toHaveProperty('type', 'click');
+  });
+
+  it('names the dismiss button from `labels`', () => {
+    render(
+      <Alert onDismiss={() => {}} labels={{ dismiss: 'Đóng' }}>
+        x
+      </Alert>,
+    );
+    expect(screen.getByRole('button', { name: 'Đóng' })).toBeInTheDocument();
+  });
+
+  it('joins a className and forwards the ref, style and other props', () => {
+    const ref = createRef<HTMLDivElement>();
+    render(
+      <Alert ref={ref} className="mine" style={{ margin: 3 }} data-testid="a">
+        x
+      </Alert>,
+    );
+    expect(ref.current).toBe(screen.getByTestId('a'));
+    expect(ref.current).toHaveClass('flg-alert', 'mine');
+    expect(ref.current).toHaveStyle({ margin: '3px' });
+  });
+});
+
+describe('AlertTitle, AlertDescription and AlertActions', () => {
+  it('render the parts of the body, each with its ref', () => {
+    const title = createRef<HTMLDivElement>();
+    const description = createRef<HTMLDivElement>();
+    const actions = createRef<HTMLDivElement>();
+    const { container } = render(
+      <Alert>
+        <AlertTitle ref={title} className="t">
+          Card expires
+        </AlertTitle>
+        <AlertDescription ref={description}>Update it soon.</AlertDescription>
+        <AlertActions ref={actions}>
+          <button type="button">Update</button>
+        </AlertActions>
+      </Alert>,
+    );
+    const body = container.querySelector('.flg-alert-body')!;
+    expect(Array.from(body.children).map((child) => child.className)).toEqual([
+      'flg-alert-title t',
+      'flg-alert-description',
+      'flg-alert-actions',
+    ]);
+    expect(title.current!.tagName).toBe('DIV');
+    expect(description.current).toHaveTextContent('Update it soon.');
+    expect(actions.current).toContainElement(screen.getByRole('button', { name: 'Update' }));
+  });
+
+  it('turns the title into the child element with asChild', () => {
+    const ref = createRef<HTMLDivElement>();
+    render(
+      <Alert>
+        <AlertTitle asChild ref={ref} className="t">
+          <h2>Heading</h2>
+        </AlertTitle>
+      </Alert>,
+    );
+    const heading = screen.getByRole('heading', { level: 2, name: 'Heading' });
+    expect(heading).toHaveClass('flg-alert-title', 't');
+    expect(ref.current).toBe(heading);
+  });
+});
diff --git a/src/docs/ExceptionTable.test.tsx b/src/docs/ExceptionTable.test.tsx
index 6f3e16a..0c67c83 100644
--- a/src/docs/ExceptionTable.test.tsx
+++ b/src/docs/ExceptionTable.test.tsx
@@ -14,9 +14,9 @@ describe('ExceptionTable', () => {
       .getAllByRole('cell')
       .map((cell) => cell.textContent);
 
-  it('lists the twenty-two rows of spec §4.9 with light and dark measurements', () => {
+  it('lists the twenty-six rows of spec §4.9 with light and dark measurements', () => {
     const rows = bodyRows();
-    expect(rows).toHaveLength(22);
+    expect(rows).toHaveLength(26);
     expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
       '1',
       '2',
@@ -40,6 +40,10 @@ describe('ExceptionTable', () => {
       '20',
       '21',
       '22',
+      '23',
+      '24',
+      '25',
+      '26',
     ]);
     expect(rows[3]).toHaveTextContent('meets AA (4.74:1)');
     expect(rows[3]).toHaveTextContent('3.63:1 / 2.24:1');
@@ -66,6 +70,11 @@ describe('ExceptionTable', () => {
     expect(cells(rows[20]!).slice(1, 3)).toEqual(['meets AA (7.44:1)', '3.71:1']);
     // The hint under the prompt of the zone, muted text on the zone (found in the final review).
     expect(cells(rows[21]!).slice(1, 3)).toEqual(['meets AA (6.98:1)', '3.64:1']);
+    // The Alert rows (spec phase 4 §4.4): three icons share row 23, each with its own number.
+    expect(cells(rows[22]!).slice(1, 3)).toEqual(['meets AA (3.60:1)', '2.02:1 / 1.84:1 / 1.88:1']);
+    expect(cells(rows[23]!).slice(1, 3)).toEqual(['meets AA (4.68:1)', '3.37:1']);
+    expect(cells(rows[24]!).slice(1, 3)).toEqual(['meets AA (11.14:1)', '4.16:1']);
+    expect(cells(rows[25]!).slice(1, 3)).toEqual(['meets AA (5.78:1)', '3.90:1']);
   });
 
   it('shows the live measurement for a theme with no exception in a row', () => {
@@ -100,6 +109,10 @@ describe('ExceptionTable', () => {
       '1.4.3',
       '1.4.3',
       '1.4.3',
+      '1.4.11',
+      '1.4.3',
+      '1.4.3',
+      '1.4.3',
     ]);
     expect(cells(rows[3]!).at(-2)).toBe('4.5:1 text, 3:1 check marks');
     expect(cells(rows[0]!).at(-2)).toBe('3:1');
diff --git a/src/index.test.ts b/src/index.test.ts
index fc47204..bb4a60c 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -8,6 +8,10 @@ describe('public API', () => {
       'AccordionContent',
       'AccordionItem',
       'AccordionTrigger',
+      'Alert',
+      'AlertActions',
+      'AlertDescription',
+      'AlertTitle',
       'Avatar',
       'Badge',
       'Breadcrumb',
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/alert src/docs/ExceptionTable.test.tsx src/index.test.ts
```

Expected: FAIL.
- `Alert.test.tsx` không nạp được ở cả hai project React, nên 17 test không chạy: `Failed to resolve import "./Alert" from "src/components/alert/Alert.test.tsx". Does the file exist?`.
- `Alert.test-d.ts` báo lỗi kiểu vì module chưa có.
- `public API > exports exactly the documented components and nothing internal`: danh sách export chưa có `Alert`, `AlertActions`, `AlertDescription`, `AlertTitle`.
- `ExceptionTable > lists the twenty-six rows of spec §4.9 with light and dark measurements`: `expected [ … ] to have a length of 26 but got 22`. `names the WCAG criterion and minimum of every row`: danh sách tiêu chí có 22 phần tử, test mong 26. Hai lỗi này được suy ra từ patch; bản nháp thấy chúng theo chiều ngược (phát hiện 11).

Rồi lưu khối patch ở Step 3 vào `../task-2-code.patch` (giữ LF). Áp riêng phần `scripts/lib/contrast.ts` (bảy check mới), rồi chạy kiểm tra tương phản. Đây là bước fail-first của bản nháp cho các cặp mới:

```bash
git apply --include=scripts/lib/contrast.ts ../task-2-code.patch
pnpm check:contrast
```

Expected: FAIL (exit 1) với `6 contrast problem(s):`, cả sáu ở `dark/default`:
- `dark/default alert-stripe-icon = 2.02 is below 3:1. …`
- `dark/default alert-tinted-title = 3.37 is below 4.5:1. …`
- `dark/default alert-tinted-text = 4.16 is below 4.5:1. …`
- `dark/default alert-tinted-icon = 1.84 is below 3:1. …`
- `dark/default alert-plain-title = 3.90 is below 4.5:1. …`
- `dark/default alert-plain-icon = 1.88 is below 3:1. …`

Ở `light` và ở `contrast-more`, cả bảy check đều `pass`. Báo cáo nháp ghi số lỗi và dòng đầu; năm dòng sau là số script in ra cho các check đó ở đầu nhánh nháp.

- [ ] **Step 3: Viết code**

Phần `scripts/lib/contrast.ts` của khối dưới đây đã được áp ở Step 2. Áp phần còn lại:

```bash
git apply --exclude=scripts/lib/contrast.ts ../task-2-code.patch
```

````diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index fa073a4..5bd2ae3 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -332,12 +332,18 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 18 | Số của ngày thuộc tháng khác trong Calendar (`--flg-text-muted`, `opacity: .5`) trên bề mặt | 2.04:1 | 2.14:1 | 4.5:1 | 1.4.3 |
 | 19 | Viền đứt nét của vùng thả FileUpload (`--flg-dropzone-border`, 45% `--flg-text-muted`) so với nền | 1.89:1 | 1.99:1 | 3:1 | 1.4.11 |
 | 20 | Chữ `--flg-accent-text` của nút chọn tệp trên nền vùng thả `--flg-control-bg-secondary` | đạt (5.42:1) | 3.79:1 | 4.5:1 | 1.4.3 |
-| 21 | Cỡ tệp (`--flg-text-muted`) trên nền dòng tệp `--flg-control-bg` của FileUpload | đạt (7.44:1) | 3.71:1 | 4.5:1 | 1.4.3 |
-| 22 | Dòng gợi ý (`--flg-text-muted`) trên nền vùng thả `--flg-control-bg-secondary` của FileUpload | đạt (6.98:1) | 3.64:1 | 4.5:1 | 1.4.3 |
+| 21 | Cỡ tệp (`--flg-text-muted`) trên nền dòng tệp `--flg-control-bg` của FileUpload; mô tả của Alert `plain` | đạt (7.44:1) | 3.71:1 | 4.5:1 | 1.4.3 |
+| 22 | Dòng gợi ý (`--flg-text-muted`) trên nền vùng thả `--flg-control-bg-secondary` của FileUpload; mô tả của Alert `stripe` | đạt (6.98:1) | 3.64:1 | 4.5:1 | 1.4.3 |
+| 23 | Icon và vạch `info` (`--flg-accent-solid`) của Alert so với nền của Alert | đạt (4.18:1 `stripe`, 3.60:1 `tinted`, 3.62:1 `plain`) | 2.02:1 `stripe`, 1.84:1 `tinted`, 1.88:1 `plain` | 3:1 | 1.4.11 |
+| 24 | Tiêu đề của Alert `tinted` (màu trạng thái; `--flg-accent-text` cho `info`) trên nền nhuộm | đạt (4.68:1) | 3.37:1 | 4.5:1 | 1.4.3 |
+| 25 | Mô tả `--flg-text` của Alert `tinted` trên nền nhuộm | đạt (11.14:1) | 4.16:1 | 4.5:1 | 1.4.3 |
+| 26 | Chữ `--flg-accent-text` trên `--flg-control-bg`: tiêu đề Alert `plain` `info` | đạt (5.78:1) | 3.90:1 | 4.5:1 | 1.4.3 |
 
 Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Điểm 14 là icon `info` của toast theo mockup toast S2 (giai đoạn 2, Plan E1). Điểm 6 còn là chữ mờ của option Combobox đang lọc và dòng trạng thái (giai đoạn 3, Plan B) và chữ hàng thứ của Calendar (giai đoạn 3, Plan C): cùng cặp màu, nên cùng số đo. Điểm 18 là ngày của tháng khác theo mockup K1 (giai đoạn 3, Plan C), nửa độ mờ nên thấp hơn hẳn chữ mờ thường. Điểm 15–17 là chấm vạch, rãnh và núm của Slider theo mockup S3 (giai đoạn 3, Plan A). Điểm 19–22 là viền vùng thả, nút chọn tệp, cỡ tệp và dòng gợi ý của FileUpload theo mockup F1 (giai đoạn 3, Plan D); dòng gợi ý khi đang kéo (chữ mờ trên nền nhấn) cùng cặp màu với điểm 9, nên được ghi ở điểm 9 (phát hiện khi review cuối Plan D). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
 
-Cả hai mươi hai điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
+Điểm 23–26 là Alert theo mockup A1–A3 (giai đoạn 4, Plan A): icon và vạch `info`, tiêu đề và mô tả của `tinted`, tiêu đề của `plain`; mô tả của `plain` và `stripe` cùng cặp màu với điểm 21 và 22 nên được ghi ở đó. Số của điểm 23–26 là thấp nhất trong bốn trạng thái (`info`, `success`, `warning`, `error`).
+
+Cả hai mươi sáu điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
 
 ---
 
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index e9a6b23..a9385d1 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -123,6 +123,13 @@ const SHIPPED_CLASSES = [
   'flg-toast-title',
   'flg-toast-description',
   'flg-toast-close',
+  'flg-alert',
+  'flg-alert-icon',
+  'flg-alert-body',
+  'flg-alert-title',
+  'flg-alert-description',
+  'flg-alert-actions',
+  'flg-alert-dismiss',
 ];
 
 const requirements: Array<[string, boolean]> = [
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 019960d..9786419 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -98,11 +98,33 @@ const D = {
     criterion: '1.4.3',
   },
   21: {
-    description: 'The size of a file in a FileUpload list, muted text on the row background',
+    description:
+      'The size of a file in a FileUpload list, muted text on the row background, and the ' +
+      'description of an Alert `plain`',
     criterion: '1.4.3',
   },
   22: {
-    description: 'The hint of a FileUpload zone, muted text on the zone background',
+    description:
+      'The hint of a FileUpload zone, muted text on the zone background, and the description of ' +
+      'an Alert `stripe`',
+    criterion: '1.4.3',
+  },
+  23: {
+    description:
+      'The icon of an info Alert (accent colour) against its background: the bar and icon of ' +
+      '`stripe`, the icon on the tint of `tinted`, the icon on its circle in `plain`',
+    criterion: '1.4.11',
+  },
+  24: {
+    description: 'The title of an Alert `tinted`, in its status colour, on the tinted background',
+    criterion: '1.4.3',
+  },
+  25: {
+    description: 'The description of an Alert `tinted`, text on the tinted background',
+    criterion: '1.4.3',
+  },
+  26: {
+    description: 'Accent text on the control background: the title of an info Alert `plain`',
     criterion: '1.4.3',
   },
 } as const satisfies Record<number, ExceptionRowInfo>;
@@ -154,4 +176,10 @@ export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
   { row: 20, theme: 'dark', check: 'dropzone-link', recorded: 3.79, ...D[20] },
   { row: 21, theme: 'dark', check: 'file-meta-text', recorded: 3.71, ...D[21] },
   { row: 22, theme: 'dark', check: 'dropzone-hint-text', recorded: 3.64, ...D[22] },
+  { row: 23, theme: 'dark', check: 'alert-stripe-icon', recorded: 2.02, ...D[23] },
+  { row: 23, theme: 'dark', check: 'alert-tinted-icon', recorded: 1.84, ...D[23] },
+  { row: 23, theme: 'dark', check: 'alert-plain-icon', recorded: 1.88, ...D[23] },
+  { row: 24, theme: 'dark', check: 'alert-tinted-title', recorded: 3.37, ...D[24] },
+  { row: 25, theme: 'dark', check: 'alert-tinted-text', recorded: 4.16, ...D[25] },
+  { row: 26, theme: 'dark', check: 'alert-plain-title', recorded: 3.9, ...D[26] },
 ];
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index 36ff11e..cc77423 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -57,6 +57,13 @@ export const CHECKS = {
   'dropzone-hint-drag': 4.5,
   'file-meta-text': 4.5,
   'file-error-text': 4.5,
+  'alert-stripe-text': 4.5,
+  'alert-stripe-icon': 3,
+  'alert-tinted-title': 4.5,
+  'alert-tinted-text': 4.5,
+  'alert-tinted-icon': 3,
+  'alert-plain-title': 4.5,
+  'alert-plain-icon': 3,
 } as const;
 export type CheckId = keyof typeof CHECKS;
 const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
@@ -281,6 +288,37 @@ export function measure(
       const [r, g, b, a] = color(name);
       return [r, g, b, a * opacity];
     };
+    // An Alert (alert.css). Its status colour is `accent-solid` for info and the status token
+    // otherwise; its title is `accent-text` for info, which is darker in light. The `stripe` panel is
+    // control-bg-secondary on the surface; `tinted` lays the status colour over that panel at the status
+    // alpha of the Badges; `plain` is control-bg with the icon in a circle of 16% of its colour. The
+    // lowest of the four statuses counts for each check.
+    const alertPanel = composite(color('control-bg-secondary'), surface);
+    const alertStatuses = [
+      { icon: 'accent-solid', title: 'accent-text' },
+      { icon: 'success', title: 'success' },
+      { icon: 'warning', title: 'warning' },
+      { icon: 'danger', title: 'danger' },
+    ] as const;
+    const alertWorst = (
+      fg: (status: (typeof alertStatuses)[number]) => string,
+      bg: (status: (typeof alertStatuses)[number]) => Rgba,
+    ) =>
+      Math.min(
+        ...alertStatuses.map((status) => {
+          const under = bg(status);
+          return contrastRatio(composite(color(fg(status)), under), under);
+        }),
+      );
+    // `color-mix(<colour> N%, transparent)` keeps the colour's own alpha, which the dark accent has.
+    const alertWash = (status: (typeof alertStatuses)[number], share: number, under: Rgba) => {
+      const [r, g, b, a] = color(status.icon);
+      return composite([r, g, b, a * share], under);
+    };
+    const alertTint = (status: (typeof alertStatuses)[number]) =>
+      alertWash(status, statusAlpha, alertPanel);
+    const alertCircle = (status: (typeof alertStatuses)[number]) =>
+      alertWash(status, 0.16, control);
     const measured: Omit<Record<CheckId, number>, OverlayCheck> = {
       text: onSurface('text'),
       'text-muted': onSurface('text-muted'),
@@ -403,6 +441,24 @@ export function measure(
       'file-meta-text': contrastRatio(composite(color('text-muted'), control), control),
       // The reason a file was turned down, the danger colour on the background of its row.
       'file-error-text': contrastRatio(composite(color('danger'), control), control),
+      // The title of an Alert `stripe` is the text colour on its panel; its icon and bar are the
+      // status colour on it.
+      'alert-stripe-text': contrastRatio(composite(color('text'), alertPanel), alertPanel),
+      'alert-stripe-icon': alertWorst(
+        (status) => status.icon,
+        () => alertPanel,
+      ),
+      // `tinted`: the title in the status colour, the description in the text colour, the icon in
+      // the status colour, all on the tinted panel.
+      'alert-tinted-title': alertWorst((status) => status.title, alertTint),
+      'alert-tinted-text': alertWorst(() => 'text', alertTint),
+      'alert-tinted-icon': alertWorst((status) => status.icon, alertTint),
+      // `plain`: the title in the status colour on control-bg, the icon on its circle.
+      'alert-plain-title': alertWorst(
+        (status) => status.title,
+        () => control,
+      ),
+      'alert-plain-icon': alertWorst((status) => status.icon, alertCircle),
     };
     for (const id of SURFACE_CHECK_IDS) lowest[id] = Math.min(lowest[id], measured[id]);
   }
diff --git a/scripts/rsc-probe.mjs b/scripts/rsc-probe.mjs
index 539b296..8634804 100644
--- a/scripts/rsc-probe.mjs
+++ b/scripts/rsc-probe.mjs
@@ -4,6 +4,7 @@
 import { createElement } from 'react';
 
 const FORWARD_REF = Symbol.for('react.forward_ref');
+const FRAGMENT = Symbol.for('react.fragment');
 
 function renderTree(node) {
   if (node === null || node === undefined || typeof node !== 'object') return node;
@@ -12,6 +13,7 @@ function renderTree(node) {
   if (typeof type === 'string') {
     return { type, props: { ...props, children: renderTree(props.children) } };
   }
+  if (type === FRAGMENT) return renderTree(props.children);
   if (typeof type === 'function') return renderTree(type(props));
   if (type && type.$$typeof === FORWARD_REF) return renderTree(type.render(props, null));
   throw new Error(`Unsupported element type: ${String(type)}`);
@@ -136,6 +138,34 @@ const CASES = [
     element: (C) => createElement(C, null, 'x'),
     expect: { type: 'span', className: 'flg-breadcrumb-page' },
   },
+  {
+    label: 'Alert without onDismiss',
+    file: '../dist/components/alert/Alert.js',
+    exportName: 'Alert',
+    element: (C) => createElement(C, { status: 'warning', variant: 'tinted' }, 'x'),
+    expect: { type: 'div', className: 'flg-alert' },
+  },
+  {
+    label: 'AlertTitle asChild',
+    file: '../dist/components/alert/Alert.js',
+    exportName: 'AlertTitle',
+    element: (C) => createElement(C, { asChild: true }, createElement('h2', null, 'x')),
+    expect: { type: 'h2', className: 'flg-alert-title' },
+  },
+  {
+    label: 'AlertDescription',
+    file: '../dist/components/alert/Alert.js',
+    exportName: 'AlertDescription',
+    element: (C) => createElement(C, null, 'x'),
+    expect: { type: 'div', className: 'flg-alert-description' },
+  },
+  {
+    label: 'AlertActions',
+    file: '../dist/components/alert/Alert.js',
+    exportName: 'AlertActions',
+    element: (C) => createElement(C, null, 'x'),
+    expect: { type: 'div', className: 'flg-alert-actions' },
+  },
 ];
 
 let failed = 0;
diff --git a/src/components/alert/Alert.mdx b/src/components/alert/Alert.mdx
new file mode 100644
index 0000000..e4793db
--- /dev/null
+++ b/src/components/alert/Alert.mdx
@@ -0,0 +1,125 @@
+import { Canvas, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './Alert.stories';
+
+<Meta of={Stories} />
+
+# Alert
+
+A message that stays in the page: a saved payment method, a limit that is near, a charge that failed.
+It does not disappear and has no queue; for a message that comes and goes, use a toast.
+
+```tsx
+import { Alert, AlertActions, AlertDescription, AlertTitle } from 'h2d-glass-ui';
+
+<Alert status="warning">
+  <AlertTitle>Your card is about to expire</AlertTitle>
+  <AlertDescription>The Visa ending 4242 expires in 12/2026.</AlertDescription>
+  <AlertActions>
+    <Button variant="secondary" size="sm">
+      Update card
+    </Button>
+  </AlertActions>
+</Alert>;
+```
+
+<Canvas of={Stories.Stripe} />
+
+## Props
+
+| Prop        | Type                                                  | Default    | Does                                                        |
+| ----------- | ----------------------------------------------------- | ---------- | ----------------------------------------------------------- |
+| `status`    | `'info' \| 'success' \| 'warning' \| 'error'`         | `'info'`   | The colour and the icon                                     |
+| `variant`   | `'stripe' \| 'tinted' \| 'plain'`                     | `'stripe'` | The look (see Variants)                                     |
+| `icon`      | `ReactNode \| false`                                  | the status | Replaces the icon; `false` leaves it out                    |
+| `onDismiss` | `(event: MouseEvent<HTMLButtonElement>) => void`      | none       | Shows a close button, and is called when it is pressed      |
+| `labels`    | `Partial<{ info, success, warning, error, dismiss }>` | English    | The words: the name of each status, and of the close button |
+
+`ref`, `className`, `style` and the other attributes of a `div` go to the root.
+
+## Parts
+
+- `AlertTitle` is bold text in a `div`, not a heading: the level depends on the page. Pass `asChild`
+  to make it your own element, for example `<AlertTitle asChild><h2>…</h2></AlertTitle>`.
+- `AlertDescription` is a `div`, so it can hold paragraphs or lists.
+- `AlertActions` is a row for your buttons or links. `secondary` and `ghost` buttons of size `sm`
+  sit well in it.
+
+An Alert with only a title is drawn compact, with less space around it.
+
+## Variants
+
+- `variant="stripe"` (default): a pale panel like an input, with a 3px bar of the status colour at
+  the left edge, like the toast. Quiet, and the right choice when a page has several Alerts; the
+  status takes only a narrow strip, so it stands out less.
+- `variant="tinted"`: the whole Alert takes the status colour, like a status Badge, with a title of
+  that colour. The type of message shows at a glance; four of them side by side are loud on glass,
+  and a button inside sits on a coloured background.
+- `variant="plain"`: a neutral panel with the icon in a soft circle of the status colour and a
+  title of that colour. Colour sits only in the icon and the title; the block is a little taller
+  because of the 32px circle.
+
+<Canvas of={Stories.Tinted} />
+<Canvas of={Stories.Plain} />
+
+## Telling screen readers
+
+An Alert has no `role`. Content that is in the page when it loads is not read out whatever its
+role, and an error that a server rendered is not news, so the library does not make `error` an
+`alert`. You choose, with `role`, when the Alert appears after something the user did.
+
+- **Polite:** keep an empty `<div role="status">` in the page from the first render, and render
+  the Alert into it after the action. A screen reader only reads what changes inside a live region
+  it already knows.
+
+  ```tsx
+  <div role="status">
+    {saved ? (
+      <Alert status="success">
+        <AlertTitle>Changes saved</AlertTitle>
+      </Alert>
+    ) : null}
+  </div>
+  ```
+
+- **Urgent:** give the Alert `role="alert"` and put it into the tree after the action.
+
+  ```tsx
+  {
+    failed ? (
+      <Alert role="alert" status="error">
+        <AlertTitle>The payment did not go through</AlertTitle>
+      </Alert>
+    ) : null;
+  }
+  ```
+
+## Closing
+
+`onDismiss` shows a close button named by `labels.dismiss`. The Alert does not hide itself: you
+decide, and remove it from the tree. When the button had focus, it is gone with the Alert and focus
+falls to the page. Send focus where the user will go on: the element that caused the Alert, or the
+heading of its container (give it `tabIndex={-1}`).
+
+## Icons
+
+The icon is named from the status (`labels.info`, …), so the status is not told by colour alone.
+With your own `icon`, or `icon={false}`, the name is written as hidden text before the title
+("Warning: Low disk") and the wrapper of your icon is hidden from screen readers. Your icon takes
+its colour from the wrapper, which has the status colour already.
+
+## Accessibility
+
+- Alerts are not controls, so their panel, edge and tint are not measured. The icon, title and
+  description are. In the default theme some are below the WCAG minimums in dark, as the mockup is
+  (rows 21 to 26 of the table on the Accessibility page): the info icon and bar, the title and
+  description of `tinted`, and the title of an info `plain`. With `prefers-contrast: more` they all
+  meet AA.
+- In forced colours the edge and the bar are the text colour; the tint and the circle are dropped by
+  the system, and the shape and name of the icon tell the status.
+
+## Do and don't
+
+- Do use an Alert for a message that must stay until it is dealt with or the page changes.
+- Do write a title that says what happened, and a description that says what to do.
+- Don't use it for a short confirmation of an action; use a toast.
+- Don't put an Alert in a live region that is created at the same time as the Alert: it is not read.
diff --git a/src/components/alert/Alert.tsx b/src/components/alert/Alert.tsx
new file mode 100644
index 0000000..3bfa37d
--- /dev/null
+++ b/src/components/alert/Alert.tsx
@@ -0,0 +1,137 @@
+import { clsx } from 'clsx';
+import { forwardRef } from 'react';
+import type { HTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';
+import { CloseIcon, StatusIcon } from '../../internal/icons';
+import type { StatusIconStatus } from '../../internal/icons';
+import { Slot } from '../../internal/slot';
+import { IconButton } from '../icon-button/IconButton';
+
+export type AlertStatus = StatusIconStatus;
+export type AlertVariant = 'stripe' | 'tinted' | 'plain';
+
+/** The words an Alert says; translate them here. */
+export interface AlertLabels {
+  info: string;
+  success: string;
+  warning: string;
+  error: string;
+  /** The name of the close button. */
+  dismiss: string;
+}
+
+export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
+  status?: AlertStatus;
+  variant?: AlertVariant;
+  /** Replaces the icon of the status; `false` leaves it out. */
+  icon?: ReactNode | false;
+  /** Shows a close button. The Alert does not hide itself: the parent drops it from the tree. */
+  onDismiss?: (event: MouseEvent<HTMLButtonElement>) => void;
+  /** Default English words; any of them can be replaced. */
+  labels?: Partial<AlertLabels>;
+}
+
+export interface AlertTitleProps extends HTMLAttributes<HTMLDivElement> {
+  /** Render the single child element (a heading, say) instead of a `div`. */
+  asChild?: boolean;
+}
+export type AlertDescriptionProps = HTMLAttributes<HTMLDivElement>;
+export type AlertActionsProps = HTMLAttributes<HTMLDivElement>;
+
+const DEFAULT_LABELS: AlertLabels = {
+  info: 'Info',
+  success: 'Success',
+  warning: 'Warning',
+  error: 'Error',
+  dismiss: 'Dismiss',
+};
+
+/**
+ * A message that stays in the page, in one of three looks. It has no role of its own: content that
+ * is there when the page loads is not read out whatever its role, so the caller puts the role it
+ * needs on it (see the docs for `status` and `alert`). Safe to render in React Server Components;
+ * the close button is a client component that only appears with `onDismiss`.
+ */
+export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
+  { status = 'info', variant = 'stripe', icon, onDismiss, labels, className, children, ...props },
+  ref,
+) {
+  const words = { ...DEFAULT_LABELS, ...labels };
+  // `undefined` is "no choice": the glyph of the status. `null` renders nothing, so it means no icon.
+  const ownIcon = icon !== undefined;
+  const hasIcon = icon !== false && icon !== null;
+  return (
+    <div
+      ref={ref}
+      className={clsx('flg-alert', className)}
+      data-variant={variant}
+      data-status={status}
+      {...props}
+    >
+      {hasIcon ? (
+        // The colour is on the span, not on the <svg>: in forced colours an <svg> keeps its own.
+        <span className="flg-alert-icon" aria-hidden={ownIcon ? true : undefined}>
+          {ownIcon ? (
+            icon
+          ) : (
+            // Named, so the status is not told by its colour alone. `aria-hidden` is left undefined:
+            // the icon carries its own name.
+            <StatusIcon
+              status={status}
+              aria-hidden={undefined}
+              role="img"
+              aria-label={words[status]}
+            />
+          )}
+        </span>
+      ) : null}
+      <div className="flg-alert-body">
+        {/* An icon of the caller says nothing, and none says less: the status is read out as text. */}
+        {ownIcon || !hasIcon ? (
+          <span className="flg-visually-hidden">{`${words[status]}: `}</span>
+        ) : null}
+        {children}
+      </div>
+      {onDismiss ? (
+        <span className="flg-alert-dismiss">
+          <IconButton variant="ghost" size="sm" aria-label={words.dismiss} onClick={onDismiss}>
+            <CloseIcon />
+          </IconButton>
+        </span>
+      ) : null}
+    </div>
+  );
+});
+
+/** The title: bold text, not a heading, since the level depends on the page. */
+export const AlertTitle = forwardRef<HTMLDivElement, AlertTitleProps>(function AlertTitle(
+  { asChild = false, className, children, ...props },
+  ref,
+) {
+  const classes = clsx('flg-alert-title', className);
+  if (asChild) {
+    return (
+      <Slot ref={ref as Ref<HTMLElement>} className={classes} {...props}>
+        {children}
+      </Slot>
+    );
+  }
+  return (
+    <div ref={ref} className={classes} {...props}>
+      {children}
+    </div>
+  );
+});
+
+export const AlertDescription = forwardRef<HTMLDivElement, AlertDescriptionProps>(
+  function AlertDescription({ className, ...props }, ref) {
+    return <div ref={ref} className={clsx('flg-alert-description', className)} {...props} />;
+  },
+);
+
+/** A row for the buttons or links of the Alert; they are the caller's own. */
+export const AlertActions = forwardRef<HTMLDivElement, AlertActionsProps>(function AlertActions(
+  { className, ...props },
+  ref,
+) {
+  return <div ref={ref} className={clsx('flg-alert-actions', className)} {...props} />;
+});
diff --git a/src/components/alert/index.ts b/src/components/alert/index.ts
new file mode 100644
index 0000000..6e2d894
--- /dev/null
+++ b/src/components/alert/index.ts
@@ -0,0 +1,10 @@
+export { Alert, AlertActions, AlertDescription, AlertTitle } from './Alert';
+export type {
+  AlertActionsProps,
+  AlertDescriptionProps,
+  AlertLabels,
+  AlertProps,
+  AlertStatus,
+  AlertTitleProps,
+  AlertVariant,
+} from './Alert';
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index 0b175a5..0bbcfdd 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -60,7 +60,7 @@ application's responsibility.
   present from the first render. One shared region would go silent inside an open Dialog, whose
   surroundings are inert. Changes your code makes to `value` are not announced.
 
-The contrast gaps of the Slider (rows 15 to 17), Calendar (row 18) and FileUpload (rows 19 to 22)
+The contrast gaps of the Slider (rows 15 to 17), Calendar (row 18), FileUpload (rows 19 to 22) and Alert (rows 23 to 26)
 are in the table above, which is built from the same data CI checks.
 
 ## A `<dialog>` the library did not create
diff --git a/src/index.ts b/src/index.ts
index 4a3cc2e..616a636 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -197,6 +197,16 @@ export type {
   DropdownMenuProps,
   DropdownMenuTriggerProps,
 } from './components/dropdown-menu';
+export { Alert, AlertActions, AlertDescription, AlertTitle } from './components/alert';
+export type {
+  AlertActionsProps,
+  AlertDescriptionProps,
+  AlertLabels,
+  AlertProps,
+  AlertStatus,
+  AlertTitleProps,
+  AlertVariant,
+} from './components/alert';
 export { Toaster, toast } from './components/toast';
 export type {
   ToastAction,
diff --git a/src/styles/components/alert.css b/src/styles/components/alert.css
new file mode 100644
index 0000000..c65ab01
--- /dev/null
+++ b/src/styles/components/alert.css
@@ -0,0 +1,157 @@
+/* Alert (spec phase 4 §4.3 Alert, mockup A1-A3): a message that stays in the page, in three looks. The
+   parts below the variants are shared; each variant writes only what differs. The status colour sits in
+   a local variable, as the Toast's does. */
+@layer flg.components {
+  .flg-alert {
+    --flg-alert-color: var(--flg-accent-solid);
+    /* A title in the status colour: the info one is the accent text colour, which is darker in light. */
+    --flg-alert-title-color: var(--flg-accent-text);
+    position: relative;
+    box-sizing: border-box;
+    display: flex;
+    align-items: flex-start;
+    gap: 10px;
+    padding: 10px 12px;
+    border-radius: var(--flg-radius-md);
+    color: var(--flg-text);
+    font-family: var(--flg-font-sans);
+  }
+  .flg-alert[data-status='success'] {
+    --flg-alert-color: var(--flg-success);
+    --flg-alert-title-color: var(--flg-success);
+  }
+  .flg-alert[data-status='warning'] {
+    --flg-alert-color: var(--flg-warning);
+    --flg-alert-title-color: var(--flg-warning);
+  }
+  .flg-alert[data-status='error'] {
+    --flg-alert-color: var(--flg-danger);
+    --flg-alert-title-color: var(--flg-danger);
+  }
+  /* The colour is on the span, not the <svg>: in forced colours an <svg> keeps a colour set on it. */
+  .flg-alert-icon {
+    display: inline-flex;
+    flex: none;
+    margin-top: 1px;
+    color: var(--flg-alert-color);
+  }
+  .flg-alert-icon > svg {
+    width: 17px;
+    height: 17px;
+  }
+  .flg-alert-body {
+    flex: 1;
+    min-width: 0;
+    overflow-wrap: break-word;
+  }
+  .flg-alert-title {
+    font-size: var(--flg-text-sm);
+    font-weight: var(--flg-weight-semibold);
+    line-height: 1.35;
+  }
+  .flg-alert-description {
+    margin-top: 2px;
+    color: var(--flg-text-muted);
+    font-size: var(--flg-text-xs);
+    line-height: 1.45;
+  }
+  .flg-alert-actions {
+    display: flex;
+    flex-wrap: wrap;
+    gap: 8px;
+    margin-top: 10px;
+  }
+  .flg-alert-dismiss {
+    display: inline-flex;
+    flex: none;
+    margin: -5px -6px -5px 0;
+  }
+  /* The compact form: a title alone. It is found from the markup, so the HTML a server renders is
+     already right. */
+  .flg-alert:not(:has(.flg-alert-description, .flg-alert-actions)) {
+    align-items: center;
+    padding-block: 7px;
+  }
+  .flg-alert:not(:has(.flg-alert-description, .flg-alert-actions)) > .flg-alert-icon {
+    margin-top: 0;
+  }
+
+  /* stripe (A1): an inner panel with a bar of the status colour at the left edge, like the Toast. */
+  .flg-alert[data-variant='stripe'] {
+    overflow: hidden;
+    padding-left: 15px;
+    border: 1px solid var(--flg-control-border);
+    background: var(--flg-control-bg-secondary);
+  }
+  .flg-alert[data-variant='stripe']::before {
+    content: '';
+    position: absolute;
+    inset: 0 auto 0 0;
+    width: 3px;
+    background: var(--flg-alert-color);
+  }
+
+  /* tinted (A2): the whole alert takes the status colour, like a status Badge. */
+  .flg-alert[data-variant='tinted'] {
+    --flg-alert-tint: color-mix(
+      in srgb,
+      var(--flg-alert-color) var(--flg-status-bg-alpha),
+      transparent
+    );
+    border: 1px solid color-mix(in srgb, var(--flg-alert-color) 45%, transparent);
+    background:
+      linear-gradient(var(--flg-alert-tint), var(--flg-alert-tint)), var(--flg-control-bg-secondary);
+  }
+  .flg-alert[data-variant='tinted'] .flg-alert-title {
+    color: var(--flg-alert-title-color);
+  }
+  .flg-alert[data-variant='tinted'] .flg-alert-description {
+    color: var(--flg-text);
+  }
+
+  /* plain (A3): a neutral panel, the icon in a soft circle of the status colour, a coloured title. */
+  .flg-alert[data-variant='plain'] {
+    gap: 12px;
+    padding: 12px 14px;
+    border: 1px solid var(--flg-control-border);
+    border-radius: var(--flg-radius-lg);
+    background: var(--flg-control-bg);
+  }
+  .flg-alert[data-variant='plain'] > .flg-alert-icon {
+    align-items: center;
+    justify-content: center;
+    width: 32px;
+    height: 32px;
+    margin: 0;
+    border-radius: 50%;
+    background: color-mix(in srgb, var(--flg-alert-color) 16%, transparent);
+  }
+  /* The body starts 7px down, so the title lines up with the middle of the circle. */
+  .flg-alert[data-variant='plain'] > .flg-alert-body {
+    padding-top: 7px;
+  }
+  .flg-alert[data-variant='plain'] .flg-alert-title {
+    color: var(--flg-alert-title-color);
+  }
+  .flg-alert[data-variant='plain'] > .flg-alert-dismiss {
+    margin: 2px -4px 0 0;
+  }
+  .flg-alert[data-variant='plain']:not(:has(.flg-alert-description, .flg-alert-actions)) {
+    padding-block: 8px;
+  }
+  .flg-alert[data-variant='plain']:not(:has(.flg-alert-description, .flg-alert-actions))
+    > .flg-alert-icon {
+    width: 26px;
+    height: 26px;
+  }
+  .flg-alert[data-variant='plain']:not(:has(.flg-alert-description, .flg-alert-actions))
+    > .flg-alert-icon
+    > svg {
+    width: 15px;
+    height: 15px;
+  }
+  .flg-alert[data-variant='plain']:not(:has(.flg-alert-description, .flg-alert-actions))
+    > .flg-alert-body {
+    padding-top: 0;
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index bbb4acc..ed94fee 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -35,5 +35,6 @@
 @import './components/date-picker.css';
 @import './components/file-upload.css';
 @import './components/toast.css';
+@import './components/alert.css';
 @import './components/floating.css';
 @import './preferences.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index a80bf7a..0598841 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -408,5 +408,14 @@
     .flg-toast::before {
       background: CanvasText;
     }
+    /* An Alert's edge is the text colour in all three looks, and the bar of `stripe` too (spec
+       phase 4 §4.5). The system drops the tint of `tinted` and the circle of `plain`; the shape and
+       the name of the icon still tell the status. */
+    .flg-alert {
+      border-color: CanvasText;
+    }
+    .flg-alert[data-variant='stripe']::before {
+      background: CanvasText;
+    }
   }
 }
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm check:contrast
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/alert
pnpm build && pnpm check:package
```

Expected:
- `pnpm check:contrast`: PASS (`Contrast check passed.`). Sáu số ở Step 2 là `known-exception`; các dòng còn lại của bảy check là `pass`, với số ở phát hiện 6.
- `pnpm test:unit`: 2946 test PASS, 3 skip (152 file). Trong đó `Alert.test.tsx` 17 ở mỗi project React, `Alert.test-d.ts` 4, `ExceptionTable.test.tsx` 4, `index.test.ts` 1.
- Story Alert: 42 test PASS (7 story × ba engine × hai theme). axe chạy sau play function, không có vi phạm.
- `check:package` PASS, gồm `check:dist-css` (bảy class `flg-alert*`), `check:rsc` (`ok` cho bốn ca của Alert) và `size`. Theo lần chạy nháp: JS 44.21 kB trên 47.58 kB, CSS 8.83 kB trên 9.31 kB.
- Alert là component mới, và các file dùng chung chỉ được thêm vào (phát hiện 12), nên ảnh chuẩn của component cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md \
  scripts/check-dist-css.ts \
  scripts/contrast-exceptions.ts \
  scripts/lib/contrast.ts \
  scripts/rsc-probe.mjs \
  src/components/alert/Alert.mdx \
  src/components/alert/Alert.stories.tsx \
  src/components/alert/Alert.test-d.ts \
  src/components/alert/Alert.test.tsx \
  src/components/alert/Alert.tsx \
  src/components/alert/index.ts \
  src/docs/Accessibility.mdx \
  src/docs/ExceptionTable.test.tsx \
  src/index.test.ts \
  src/index.ts \
  src/styles/components/alert.css \
  src/styles/index.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(alert): add Alert with stripe, tinted and plain looks" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 3: Progress (`thin`, `glow`, `inline`) và lượt `reduced-motion` của harness visual

Spec §1, §3.1 (dòng Progress), §3.2, §3.3, §3.4 (Progress), §4.1, §4.3 **Progress**, §4.4 (`progress-fill`, `progress-glow-fill`, `accent-text-on-surface`; dòng 27 đến 29; dòng 6 và 16 mở rộng; các quy tắc `prefers-contrast: more` của Progress), §4.5 **Progress**, §5 (cảnh báo của Progress), §6.1, §6.2, §6.3 **`Progress`**, §7 (Progress ở dòng 1 đến 5; khung hình animation; lượt `reduced-motion`; test kiểu; kiểm tra gói), §8 (trang Progress). Mockup P1, P2, P3.
- **Client** (`"use client"`): `useId` nối nhãn nhìn thấy với `aria-labelledby`, `useRequireName` cảnh báo khi thiếu tên. Có trong `check-use-client.ts`; không có ca `check:rsc` (§3.1 không liệt kê).
- **Cấu trúc** như HTML của §6.3. Gốc `role="progressbar"`; chữ giá trị mang `aria-hidden`; `role` và thuộc tính ARIA không ghi đè được.
- **Giá trị:** chuẩn hoá, kẹp và cảnh báo như phát hiện 7. Chữ phần trăm qua `numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })`. Icon trạng thái là `StatusIcon` ẩn.
- **Chuyển động:** đoạn chưa xác định rộng 35%, trượt bằng `translate` từ 0 tới `185.714%`, 1.4s, `cubic-bezier(.65, 0, .35, 1)`, `alternate`, delay 0. Chiều rộng chuyển trong `--flg-duration-normal`. Khối `@media (prefers-reduced-motion: reduce)` viết tay, mới trong `preferences.css`: đoạn phủ cả rãnh, cắt sọc bằng mask.
- **Giao diện P1–P3** (§4.3), cỡ `sm` và `md`. `prefers-contrast: more`: rãnh có viền trong 1px `--flg-control-border`; `glow` bỏ ánh sáng và quầng. Forced colors: rãnh `outline`, phần đã chạy `Highlight`.
- **Tương phản:** ba check mới; sáu số dưới ngưỡng thành dòng 27 đến 29 (phát hiện 6). Dòng 6 và 16 mở rộng. `ExceptionTable.test.tsx` đòi 29 dòng.
- **Harness visual:** lượt `reduced-motion` (phát hiện 8). Ba story giao diện gắn tag đó.
- Spec giai đoạn 4 §4.3 và §4.5 được sửa (phát hiện 3).

**Files:**
- Create: `src/components/progress/Progress.tsx`, `index.ts`, `Progress.test.tsx`, `Progress.test-d.ts`, `Progress.stories.tsx`, `Progress.mdx`, `src/styles/components/progress.css`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `src/docs/ExceptionTable.test.tsx`, `src/docs/Accessibility.mdx`, `tests/visual/stories.visual.ts`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`, `docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md`

**Interfaces:**
- Produces trong `src/components/progress/Progress.tsx` (client), export qua `index.ts` và `src/index.ts`:
  - `Progress`: `forwardRef<HTMLDivElement, ProgressProps>`; `ref` là phần tử `role="progressbar"`.
  - `ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'children'> & { … }` với `value?: number | null`, `max?: number`, `label?: ReactNode`, `showValue?: boolean`, `getValueText?: (value: number, max: number) => string`, `locale?: string`, `status?: ProgressStatus`, `size?: 'sm' | 'md'`, `variant?: ProgressVariant`, `labels?: Partial<ProgressLabels>`. Mặc định: `value` `null`, `max` 100, `showValue` `false`, `locale` `'en-US'`, `status` `'default'`, `size` `'md'`, `variant` `'thin'`.
  - `ProgressVariant = 'thin' | 'glow' | 'inline'`; `ProgressStatus = 'default' | 'success' | 'error'`; `ProgressLabels`: `success` (`"Success"`), `error` (`"Error"`).
  - Class: `flg-progress`, `flg-progress-head`, `flg-progress-label`, `flg-progress-value`, `flg-progress-icon`, `flg-progress-line`, `flg-progress-track`, `flg-progress-fill`. Custom property `--flg-progress-value` trong `style` của phần đã chạy; biến cục bộ `--flg-progress-color`.
  - Hook DOM: `data-variant`, `data-size`, `data-status` và `data-indeterminate` trên gốc.
  - Cảnh báo dev: `Progress: value <v> is outside 0 to <max>; it is clamped.`, `Progress: value <v> is not a finite number; the progress is shown as indeterminate.`, `Progress: max must be a positive finite number, not <max>; using 100.`; thiếu tên: `<Progress> needs a name: pass aria-label or aria-labelledby.` (của `useRequireName`).
  - Ba check mới: `'progress-fill': 3`, `'progress-glow-fill': 3`, `'accent-text-on-surface': 4.5`. `KNOWN_EXCEPTIONS` có thêm dòng 27 (`progress-fill`, sáng `recorded: 2.45`, tối 1.74, `1.4.11`), dòng 28 (`progress-glow-fill`, 1.62 và 1.74, `1.4.11`) và dòng 29 (`accent-text-on-surface`, 3.95 và 4.44, `1.4.3`). Mô tả của dòng 6 và 16 thêm Progress.
  - Khối `@media (prefers-reduced-motion: reduce)` trong `@layer flg.preferences` của `preferences.css`. Task 4 thêm Skeleton vào đó.
  - Harness: mode `reduced-motion` của `tests/visual/stories.visual.ts`, chỉ cho story có tag `reduced-motion`; ảnh `<story-id>--<theme>--reduced-motion.png`. Plan B thêm móc `data-visual-hover` vào cùng file.
- Consumes: `StatusIcon` (Task 1); `numberFormat`, `useRequireName`, `devWarn`, `dataAttr`; `paintStops`, `resolveToken` của `scripts/lib/contrast.ts`; `Card`, `Button`, `IconButton`, `FileIcon`, `CloseIcon` trong story.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/progress/Progress.stories.tsx b/src/components/progress/Progress.stories.tsx
new file mode 100644
index 0000000..f73bf57
--- /dev/null
+++ b/src/components/progress/Progress.stories.tsx
@@ -0,0 +1,206 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { useState } from 'react';
+import { expect, userEvent, waitFor } from 'storybook/test';
+import { CloseIcon, FileIcon } from '../../internal/icons';
+import { Button } from '../button/Button';
+import { Card, CardHeader, CardTitle } from '../card/Card';
+import { IconButton } from '../icon-button/IconButton';
+import { Progress } from './Progress';
+import type { ProgressProps } from './Progress';
+
+const meta = {
+  title: 'Components/Progress',
+  component: Progress,
+} satisfies Meta<typeof Progress>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+/**
+ * The states of the approved mockup (progress P1-P3), in a card as there: a value with its label,
+ * 0%, a finished upload, a failed one, an indeterminate one, and a small bar under a file row with
+ * no label of its own.
+ */
+function Upload({ variant }: Pick<ProgressProps, 'variant'>) {
+  return (
+    <Card style={{ gap: 12, width: 400 }}>
+      <CardHeader>
+        <CardTitle>Upload documents</CardTitle>
+      </CardHeader>
+      <Progress variant={variant} label="Uploading contract.pdf" value={45} showValue />
+      <Progress variant={variant} label="Waiting for quote.xlsx" value={0} showValue />
+      <Progress
+        variant={variant}
+        label="Uploaded invoice.pdf"
+        value={100}
+        showValue
+        status="success"
+      />
+      <Progress
+        variant={variant}
+        label="Upload failed · id-scan.png"
+        value={62}
+        showValue
+        status="error"
+      />
+      <Progress variant={variant} label="Processing photos.zip" showValue />
+      <div
+        style={{
+          display: 'flex',
+          alignItems: 'center',
+          gap: 10,
+          padding: '6px 6px 8px 10px',
+          border: '1px solid var(--flg-control-border)',
+          borderRadius: 'var(--flg-radius-md)',
+          background: 'var(--flg-control-bg)',
+        }}
+      >
+        <span style={{ display: 'inline-flex', color: 'var(--flg-text-muted)' }}>
+          <FileIcon width={18} height={18} />
+        </span>
+        <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: 6 }}>
+          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
+            <span style={{ fontSize: 'var(--flg-text-sm)', color: 'var(--flg-text)' }}>
+              meeting-minutes.docx
+            </span>
+            <span
+              style={{
+                fontSize: 'var(--flg-text-xs)',
+                color: 'var(--flg-text-muted)',
+                fontVariantNumeric: 'tabular-nums',
+              }}
+            >
+              1.2 MB · 70%
+            </span>
+          </div>
+          <Progress
+            variant={variant}
+            size="sm"
+            value={70}
+            aria-label="Upload of meeting-minutes.docx"
+          />
+        </div>
+        <IconButton variant="ghost" size="sm" aria-label="Cancel the upload">
+          <CloseIcon />
+        </IconButton>
+      </div>
+    </Card>
+  );
+}
+
+// The tag adds a pass with the motion stopped (tests/visual/stories.visual.ts).
+export const Thin: Story = { tags: ['reduced-motion'], render: () => <Upload variant="thin" /> };
+export const Glow: Story = { tags: ['reduced-motion'], render: () => <Upload variant="glow" /> };
+export const Inline: Story = {
+  tags: ['reduced-motion'],
+  render: () => <Upload variant="inline" />,
+};
+
+/** Work that advances: the attributes of the bar follow the value. */
+function Advancing() {
+  const [value, setValue] = useState(20);
+  return (
+    <div style={{ display: 'grid', gap: 12, width: 400 }}>
+      <Progress
+        label="Uploading"
+        value={value}
+        showValue
+        status={value >= 100 ? 'success' : 'default'}
+        getValueText={(current, max) => `${current} of ${max} MB`}
+      />
+      <Button
+        variant="secondary"
+        onClick={() => setValue((current) => Math.min(100, current + 40))}
+      >
+        Advance
+      </Button>
+    </div>
+  );
+}
+
+export const ValueChange: Story = {
+  tags: ['no-visual'],
+  render: () => <Advancing />,
+  play: async ({ canvas }) => {
+    const bar = canvas.getByRole('progressbar', { name: 'Uploading' });
+    await expect(bar).toHaveAttribute('aria-valuenow', '20');
+    await expect(bar).toHaveAttribute('aria-valuetext', '20 of 100 MB');
+    await userEvent.click(canvas.getByRole('button', { name: 'Advance' }));
+    await expect(bar).toHaveAttribute('aria-valuenow', '60');
+    await expect(bar).toHaveAttribute('aria-valuetext', '60 of 100 MB');
+    await userEvent.click(canvas.getByRole('button', { name: 'Advance' }));
+    await waitFor(() => expect(bar).toHaveAttribute('aria-valuetext', '100 of 100 MB, Success'));
+    await expect(bar).toHaveAttribute('aria-valuenow', '100');
+  },
+};
+
+/**
+ * The frames of the indeterminate animation, which the reference screenshots cannot show: they are
+ * taken with animations cancelled, so the segment is always at its start (spec §3.3). It is 35% of
+ * the track wide, and slides to 65 / 35 of its own width on `translate`.
+ */
+export const IndeterminateMotion: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ width: 400 }}>
+      <Progress label="Processing photos.zip" />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const fill = canvasElement.querySelector<HTMLElement>('.flg-progress-fill')!;
+    const track = canvasElement.querySelector<HTMLElement>('.flg-progress-track')!;
+    const [animation, ...others] = fill.getAnimations();
+    await expect(others).toHaveLength(0);
+    const effect = animation!.effect as KeyframeEffect;
+    const timing = effect.getTiming();
+    await expect(timing.duration).toBe(1400);
+    await expect(timing.iterations).toBe(Number.POSITIVE_INFINITY);
+    await expect(timing.direction).toBe('alternate');
+    // A start from 0: the negative delay of the mockup only froze its screenshot at a good frame.
+    await expect(timing.delay).toBe(0);
+    const keyframes = effect.getKeyframes();
+    await expect(keyframes).toHaveLength(2);
+    // `animation-timing-function` is the easing of each keyframe, not of the effect as a whole.
+    await expect(keyframes[0]!.easing).toBe('cubic-bezier(0.65, 0, 0.35, 1)');
+    await expect(Number.parseFloat(String(keyframes[0]!.translate))).toBe(0);
+    await expect(keyframes[1]!.translate).toBe('185.714%');
+    await expect(
+      fill.getBoundingClientRect().width / track.getBoundingClientRect().width,
+    ).toBeCloseTo(0.35, 2);
+  },
+};
+
+/**
+ * With reduced motion there is no animation left, and the segment covers the track in stripes. The
+ * preference is emulated through the protocol, which only Chromium has, and the reduced-motion
+ * screenshots are taken in Chromium too: Firefox and WebKit have no automated check of this rule.
+ */
+export const ReducedMotion: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ width: 400 }}>
+      <Progress label="Processing photos.zip" />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const { cdp, server } = await import('vitest/browser');
+    if (server.browser !== 'chromium') return;
+    const session = cdp();
+    const fill = canvasElement.querySelector<HTMLElement>('.flg-progress-fill')!;
+    const track = canvasElement.querySelector<HTMLElement>('.flg-progress-track')!;
+    await expect(fill.getAnimations()).toHaveLength(1);
+    await session.send('Emulation.setEmulatedMedia', {
+      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
+    });
+    try {
+      await waitFor(() => expect(fill.getAnimations()).toHaveLength(0));
+      await expect(getComputedStyle(fill).maskImage).toContain('repeating-linear-gradient');
+      await expect(fill.getBoundingClientRect().width).toBeCloseTo(
+        track.getBoundingClientRect().width,
+        0,
+      );
+    } finally {
+      await session.send('Emulation.setEmulatedMedia', { features: [] });
+    }
+  },
+};
diff --git a/src/components/progress/Progress.test-d.ts b/src/components/progress/Progress.test-d.ts
new file mode 100644
index 0000000..dce284c
--- /dev/null
+++ b/src/components/progress/Progress.test-d.ts
@@ -0,0 +1,44 @@
+import { expectTypeOf, test } from 'vitest';
+import type { ProgressLabels, ProgressProps } from './Progress';
+
+test('a Progress takes only the documented variants, statuses and sizes', () => {
+  expectTypeOf<ProgressProps['variant']>().toEqualTypeOf<'thin' | 'glow' | 'inline' | undefined>();
+  expectTypeOf<ProgressProps['status']>().toEqualTypeOf<
+    'default' | 'success' | 'error' | undefined
+  >();
+  expectTypeOf<ProgressProps['size']>().toEqualTypeOf<'sm' | 'md' | undefined>();
+  // @ts-expect-error an unknown variant
+  const unknownVariant: ProgressProps = { variant: 'thick' };
+  // @ts-expect-error the variant of another component
+  const otherVariant: ProgressProps = { variant: 'stripe' };
+  // @ts-expect-error `info` is a status of Alert, not of Progress
+  const otherStatus: ProgressProps = { status: 'info' };
+  expectTypeOf(unknownVariant).toBeObject();
+  expectTypeOf(otherVariant).toBeObject();
+  expectTypeOf(otherStatus).toBeObject();
+});
+
+test('the value is a number or null, and may be left out', () => {
+  expectTypeOf<ProgressProps['value']>().toEqualTypeOf<number | null | undefined>();
+  const indeterminate: ProgressProps = { value: null };
+  const unknownAmount: ProgressProps = {};
+  expectTypeOf(indeterminate).toBeObject();
+  expectTypeOf(unknownAmount).toBeObject();
+});
+
+test('a Progress has a role of its own and takes none', () => {
+  // @ts-expect-error the root is always a progressbar
+  const role: ProgressProps = { role: 'meter' };
+  // @ts-expect-error the content is made by the component
+  const children: ProgressProps = { children: 'x' };
+  expectTypeOf(role).toBeObject();
+  expectTypeOf(children).toBeObject();
+});
+
+test('getValueText reads the value and the maximum, and the labels may be given in part', () => {
+  expectTypeOf<NonNullable<ProgressProps['getValueText']>>().toEqualTypeOf<
+    (value: number, max: number) => string
+  >();
+  expectTypeOf<NonNullable<ProgressProps['labels']>>().toEqualTypeOf<Partial<ProgressLabels>>();
+  expectTypeOf<keyof ProgressLabels>().toEqualTypeOf<'success' | 'error'>();
+});
diff --git a/src/components/progress/Progress.test.tsx b/src/components/progress/Progress.test.tsx
new file mode 100644
index 0000000..bf97b89
--- /dev/null
+++ b/src/components/progress/Progress.test.tsx
@@ -0,0 +1,344 @@
+import { render, screen } from '@testing-library/react';
+import { createRef } from 'react';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import { Progress } from './Progress';
+
+const bar = () => screen.getByRole('progressbar');
+
+describe('Progress', () => {
+  beforeEach(() => resetDevWarnings());
+  afterEach(() => vi.restoreAllMocks());
+
+  describe('structure', () => {
+    it('is a progressbar root with a head, a track and a fill, as the spec draws it', () => {
+      const ref = createRef<HTMLDivElement>();
+      const { container } = render(
+        <Progress
+          ref={ref}
+          label="Uploading contract.pdf"
+          value={45}
+          showValue
+          className="mine"
+          style={{ width: 300 }}
+          data-testid="root"
+        />,
+      );
+      const root = container.firstElementChild as HTMLElement;
+      expect(ref.current).toBe(root);
+      expect(root).toBe(bar());
+      expect(root).toHaveClass('flg-progress', 'mine');
+      expect(root).toHaveAttribute('data-testid', 'root');
+      expect(root.style.width).toBe('300px');
+      expect(root).toHaveAttribute('data-variant', 'thin');
+      expect(root).toHaveAttribute('data-size', 'md');
+      expect(root).toHaveAttribute('data-status', 'default');
+      expect(root).not.toHaveAttribute('data-indeterminate');
+      expect(Array.from(root.children).map((child) => child.className)).toEqual([
+        'flg-progress-head',
+        'flg-progress-line',
+      ]);
+      const head = root.children[0] as HTMLElement;
+      expect(Array.from(head.children).map((child) => child.className)).toEqual([
+        'flg-progress-label',
+        'flg-progress-value',
+      ]);
+      const line = root.children[1] as HTMLElement;
+      expect(Array.from(line.children).map((child) => child.className)).toEqual([
+        'flg-progress-track',
+      ]);
+      const fill = line.querySelector('.flg-progress-fill') as HTMLElement;
+      expect(fill.parentElement).toHaveClass('flg-progress-track');
+      // The width is a custom property, so the HTML from a server already has it right.
+      expect(fill.style.getPropertyValue('--flg-progress-value')).toBe('45%');
+    });
+
+    it('puts the data attributes of variant, size and status on the root', () => {
+      render(<Progress aria-label="Upload" variant="glow" size="sm" status="error" value={62} />);
+      expect(bar()).toHaveAttribute('data-variant', 'glow');
+      expect(bar()).toHaveAttribute('data-size', 'sm');
+      expect(bar()).toHaveAttribute('data-status', 'error');
+    });
+
+    it('has only a track without a label and without a value (a bar under a file row)', () => {
+      render(<Progress aria-label="Upload of notes.docx" value={70} size="sm" />);
+      expect(bar().querySelector('.flg-progress-head')).toBeNull();
+      expect(bar().querySelector('.flg-progress-value')).toBeNull();
+      expect(bar().querySelector('.flg-progress-track')).not.toBeNull();
+    });
+
+    it('keeps the value in the head of thin and glow, and at the end of the bar in inline', () => {
+      const { rerender } = render(<Progress aria-label="Upload" value={45} showValue />);
+      expect(bar().querySelector('.flg-progress-head > .flg-progress-value')).toHaveTextContent(
+        '45%',
+      );
+      rerender(<Progress aria-label="Upload" variant="glow" value={45} showValue />);
+      expect(bar().querySelector('.flg-progress-head > .flg-progress-value')).toHaveTextContent(
+        '45%',
+      );
+      rerender(<Progress aria-label="Upload" variant="inline" value={45} showValue />);
+      expect(bar().querySelector('.flg-progress-head')).toBeNull();
+      expect(bar().querySelector('.flg-progress-line > .flg-progress-value')).toHaveTextContent(
+        '45%',
+      );
+    });
+
+    it('puts only the label in the head of inline', () => {
+      render(<Progress variant="inline" label="Uploading" value={45} showValue />);
+      const head = bar().querySelector('.flg-progress-head') as HTMLElement;
+      expect(head.children).toHaveLength(1);
+      expect(head.firstElementChild).toHaveClass('flg-progress-label');
+    });
+
+    it('hides the visible value from assistive technology: the ARIA attributes carry it', () => {
+      render(<Progress aria-label="Upload" value={45} showValue />);
+      expect(bar().querySelector('.flg-progress-value')).toHaveAttribute('aria-hidden', 'true');
+    });
+  });
+
+  describe('ARIA', () => {
+    it('sets the range, and the value as given when it is inside it', () => {
+      render(<Progress aria-label="Upload" value={45} />);
+      expect(bar()).toHaveAttribute('aria-valuemin', '0');
+      expect(bar()).toHaveAttribute('aria-valuemax', '100');
+      expect(bar()).toHaveAttribute('aria-valuenow', '45');
+      expect(bar()).not.toHaveAttribute('aria-valuetext');
+    });
+
+    it('measures the fill against `max`', () => {
+      const { container } = render(<Progress aria-label="Upload" value={30} max={60} />);
+      expect(bar()).toHaveAttribute('aria-valuemax', '60');
+      expect(bar()).toHaveAttribute('aria-valuenow', '30');
+      const fill = container.querySelector('.flg-progress-fill') as HTMLElement;
+      expect(fill.style.getPropertyValue('--flg-progress-value')).toBe('50%');
+    });
+
+    it('clamps a value outside the range, and says so in development', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const { container, rerender } = render(<Progress aria-label="Upload" value={140} />);
+      expect(bar()).toHaveAttribute('aria-valuenow', '100');
+      const fill = container.querySelector('.flg-progress-fill') as HTMLElement;
+      expect(fill.style.getPropertyValue('--flg-progress-value')).toBe('100%');
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('value 140 is outside 0 to 100'));
+      rerender(<Progress aria-label="Upload" value={-5} />);
+      expect(bar()).toHaveAttribute('aria-valuenow', '0');
+      expect(fill.style.getPropertyValue('--flg-progress-value')).toBe('0%');
+    });
+
+    it('is indeterminate without a value: no `aria-valuenow`, no `aria-valuetext`', () => {
+      const { rerender } = render(<Progress aria-label="Upload" />);
+      expect(bar()).toHaveAttribute('data-indeterminate');
+      expect(bar()).not.toHaveAttribute('aria-valuenow');
+      expect(bar()).not.toHaveAttribute('aria-valuetext');
+      rerender(<Progress aria-label="Upload" value={null} status="error" />);
+      expect(bar()).toHaveAttribute('data-indeterminate');
+      expect(bar()).not.toHaveAttribute('aria-valuenow');
+      expect(bar()).not.toHaveAttribute('aria-valuetext');
+    });
+
+    it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
+      'treats %s as indeterminate and says so in development',
+      (value) => {
+        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+        render(<Progress aria-label="Upload" value={value} />);
+        expect(bar()).toHaveAttribute('data-indeterminate');
+        expect(bar()).not.toHaveAttribute('aria-valuenow');
+        expect(warn).toHaveBeenCalledWith(expect.stringContaining('is not a finite number'));
+      },
+    );
+
+    it.each([0, -10, Number.NaN, Number.POSITIVE_INFINITY])(
+      'uses 100 for `max` %s, and says so in development',
+      (max) => {
+        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+        render(<Progress aria-label="Upload" value={20} max={max} />);
+        expect(bar()).toHaveAttribute('aria-valuemax', '100');
+        expect(bar()).toHaveAttribute('aria-valuenow', '20');
+        expect(warn).toHaveBeenCalledWith(expect.stringContaining('max must be a positive'));
+      },
+    );
+
+    it('says nothing for a value inside the range', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(<Progress aria-label="Upload" value={100} />);
+      expect(warn).not.toHaveBeenCalled();
+    });
+  });
+
+  describe('aria-valuetext', () => {
+    it('is the result of `getValueText`', () => {
+      const getValueText = vi.fn((value: number, max: number) => `${value} of ${max} files`);
+      render(<Progress aria-label="Upload" value={3} max={8} getValueText={getValueText} />);
+      expect(getValueText).toHaveBeenCalledWith(3, 8);
+      expect(bar()).toHaveAttribute('aria-valuetext', '3 of 8 files');
+    });
+
+    it('names the status after the percent, since progressbar has no ARIA for an error', () => {
+      const { rerender } = render(<Progress aria-label="Upload" value={62} status="error" />);
+      expect(bar()).toHaveAttribute('aria-valuetext', '62%, Error');
+      rerender(<Progress aria-label="Upload" value={100} status="success" />);
+      expect(bar()).toHaveAttribute('aria-valuetext', '100%, Success');
+    });
+
+    it('names the status after the text of `getValueText` when there is one', () => {
+      render(
+        <Progress
+          aria-label="Upload"
+          value={5}
+          max={8}
+          status="error"
+          getValueText={(value, max) => `${value} of ${max} files`}
+        />,
+      );
+      expect(bar()).toHaveAttribute('aria-valuetext', '5 of 8 files, Error');
+    });
+
+    it('takes the name of the status from `labels`, and the percent from `locale`', () => {
+      render(
+        <Progress
+          aria-label="Tai len"
+          value={62}
+          status="error"
+          locale="vi-VN"
+          labels={{ error: 'Loi' }}
+        />,
+      );
+      expect(bar()).toHaveAttribute('aria-valuetext', '62%, Loi');
+    });
+
+    it('is left out for the default status without `getValueText`: the screen reader says the percent', () => {
+      render(<Progress aria-label="Upload" value={62} status="default" />);
+      expect(bar()).not.toHaveAttribute('aria-valuetext');
+    });
+  });
+
+  describe('the visible value', () => {
+    it('is a percent of `max`, rounded to whole numbers', () => {
+      render(<Progress aria-label="Upload" value={1} max={3} showValue />);
+      expect(bar().querySelector('.flg-progress-value')).toHaveTextContent('33%');
+    });
+
+    it.each([
+      ['en-US', '45%'],
+      ['vi-VN', '45%'],
+      // German puts a no-break space before the sign.
+      ['de-DE', '45 %'],
+    ])('is written for %s as %s', (locale, text) => {
+      render(<Progress aria-label="Upload" value={45} showValue locale={locale} />);
+      expect(bar().querySelector('.flg-progress-value')?.textContent).toBe(text);
+    });
+
+    it('is the text of `getValueText` when there is one', () => {
+      render(
+        <Progress
+          aria-label="Upload"
+          value={3}
+          max={8}
+          showValue
+          getValueText={(value, max) => `${value}/${max}`}
+        />,
+      );
+      expect(bar().querySelector('.flg-progress-value')).toHaveTextContent('3/8');
+    });
+
+    it('is not shown without `showValue`', () => {
+      render(<Progress aria-label="Upload" value={45} />);
+      expect(bar().querySelector('.flg-progress-value')).toBeNull();
+    });
+
+    it('is not shown while the progress is indeterminate', () => {
+      render(<Progress aria-label="Upload" showValue />);
+      expect(bar().querySelector('.flg-progress-value')).toBeNull();
+    });
+
+    it('keeps an empty column in inline while indeterminate, so the bar is as long as the others', () => {
+      render(<Progress aria-label="Upload" variant="inline" showValue />);
+      const cell = bar().querySelector('.flg-progress-line > .flg-progress-value');
+      expect(cell).not.toBeNull();
+      expect(cell).toBeEmptyDOMElement();
+    });
+  });
+
+  describe('the status icon', () => {
+    it.each(['success', 'error'] as const)(
+      'shows the glyph of %s, hidden, before the value',
+      (status) => {
+        render(<Progress aria-label="Upload" value={62} status={status} showValue />);
+        const cell = bar().querySelector('.flg-progress-value') as HTMLElement;
+        const icon = cell.firstElementChild as HTMLElement;
+        expect(icon).toHaveClass('flg-progress-icon');
+        const svg = icon.querySelector('svg') as SVGElement;
+        expect(svg).toHaveAttribute('aria-hidden', 'true');
+        // The same path as the circled check or the circled cross of Toast and Alert.
+        expect(svg.querySelector('path')?.getAttribute('d')).toBe(
+          status === 'success' ? 'm9 12 2 2 4-4' : 'm15 9-6 6M9 9l6 6',
+        );
+        expect(cell).toHaveTextContent('62%');
+      },
+    );
+
+    it('shows the icon without `showValue`, so the status is not told by colour alone', () => {
+      render(<Progress aria-label="Upload" value={100} status="success" />);
+      const cell = bar().querySelector('.flg-progress-value') as HTMLElement;
+      expect(cell.querySelector('svg')).not.toBeNull();
+      expect(cell.textContent).toBe('');
+    });
+
+    it('has no icon for the default status', () => {
+      render(<Progress aria-label="Upload" value={45} showValue />);
+      expect(bar().querySelector('svg')).toBeNull();
+    });
+  });
+
+  describe('the name', () => {
+    it('is the visible label, which `aria-labelledby` points at', () => {
+      render(<Progress label="Uploading contract.pdf" value={45} />);
+      const label = screen.getByText('Uploading contract.pdf');
+      expect(label).toHaveClass('flg-progress-label');
+      expect(label.id).not.toBe('');
+      expect(bar()).toHaveAttribute('aria-labelledby', label.id);
+      expect(bar()).toHaveAccessibleName('Uploading contract.pdf');
+    });
+
+    it('is the `aria-label` of the caller over the label, which then does not name it', () => {
+      render(<Progress label="Uploading" aria-label="Upload of contract.pdf" value={45} />);
+      expect(bar()).not.toHaveAttribute('aria-labelledby');
+      expect(bar()).toHaveAccessibleName('Upload of contract.pdf');
+    });
+
+    it('is the `aria-labelledby` of the caller over the label', () => {
+      render(
+        <>
+          <h2 id="title">Documents</h2>
+          <Progress label="Uploading" aria-labelledby="title" value={45} />
+        </>,
+      );
+      expect(bar()).toHaveAttribute('aria-labelledby', 'title');
+      expect(bar()).toHaveAccessibleName('Documents');
+    });
+
+    it('warns in development when nothing names it', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(<Progress value={45} />);
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('<Progress> needs a name'));
+    });
+
+    it.each([
+      ['a label', <Progress key="a" label="Uploading" value={45} />],
+      ['an aria-label', <Progress key="b" aria-label="Upload" value={45} />],
+      ['an aria-labelledby', <Progress key="c" aria-labelledby="x" value={45} />],
+    ])('does not warn with %s', (_name, element) => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(element);
+      expect(warn).not.toHaveBeenCalled();
+    });
+  });
+
+  it('does not let the caller replace the role or the value attributes', () => {
+    // The type refuses `role`; this is a JavaScript caller, or a spread of unknown props.
+    const loose = { role: 'meter', 'aria-valuenow': 3 } as object;
+    render(<Progress aria-label="Upload" value={45} {...loose} />);
+    expect(bar()).toHaveAttribute('role', 'progressbar');
+    expect(bar()).toHaveAttribute('aria-valuenow', '45');
+  });
+});
diff --git a/src/docs/ExceptionTable.test.tsx b/src/docs/ExceptionTable.test.tsx
index 0c67c83..d9c8972 100644
--- a/src/docs/ExceptionTable.test.tsx
+++ b/src/docs/ExceptionTable.test.tsx
@@ -14,9 +14,9 @@ describe('ExceptionTable', () => {
       .getAllByRole('cell')
       .map((cell) => cell.textContent);
 
-  it('lists the twenty-six rows of spec §4.9 with light and dark measurements', () => {
+  it('lists the twenty-nine rows of spec §4.9 with light and dark measurements', () => {
     const rows = bodyRows();
-    expect(rows).toHaveLength(26);
+    expect(rows).toHaveLength(29);
     expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
       '1',
       '2',
@@ -44,6 +44,9 @@ describe('ExceptionTable', () => {
       '24',
       '25',
       '26',
+      '27',
+      '28',
+      '29',
     ]);
     expect(rows[3]).toHaveTextContent('meets AA (4.74:1)');
     expect(rows[3]).toHaveTextContent('3.63:1 / 2.24:1');
@@ -75,6 +78,10 @@ describe('ExceptionTable', () => {
     expect(cells(rows[23]!).slice(1, 3)).toEqual(['meets AA (4.68:1)', '3.37:1']);
     expect(cells(rows[24]!).slice(1, 3)).toEqual(['meets AA (11.14:1)', '4.16:1']);
     expect(cells(rows[25]!).slice(1, 3)).toEqual(['meets AA (5.78:1)', '3.90:1']);
+    // The Progress rows (spec phase 4 §4.4): the fill is under the threshold in both themes.
+    expect(cells(rows[26]!).slice(1, 3)).toEqual(['2.45:1', '1.74:1']);
+    expect(cells(rows[27]!).slice(1, 3)).toEqual(['1.62:1', '1.74:1']);
+    expect(cells(rows[28]!).slice(1, 3)).toEqual(['3.95:1', '4.44:1']);
   });
 
   it('shows the live measurement for a theme with no exception in a row', () => {
@@ -113,6 +120,9 @@ describe('ExceptionTable', () => {
       '1.4.3',
       '1.4.3',
       '1.4.3',
+      '1.4.11',
+      '1.4.11',
+      '1.4.3',
     ]);
     expect(cells(rows[3]!).at(-2)).toBe('4.5:1 text, 3:1 check marks');
     expect(cells(rows[0]!).at(-2)).toBe('3:1');
diff --git a/src/index.test.ts b/src/index.test.ts
index bb4a60c..2ac3f9a 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -75,6 +75,7 @@ describe('public API', () => {
       'PopoverClose',
       'PopoverContent',
       'PopoverTrigger',
+      'Progress',
       'Radio',
       'RadioGroup',
       'SegmentedControl',
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/progress src/docs/ExceptionTable.test.tsx src/index.test.ts
```

Expected: FAIL.
- `Progress.test.tsx` không nạp được ở cả hai project React, nên 43 test không chạy: `Failed to resolve import "./Progress" from "src/components/progress/Progress.test.tsx". Does the file exist?`.
- `Progress.test-d.ts` báo lỗi kiểu vì module chưa có.
- `ExceptionTable > lists the twenty-nine rows of spec §4.9 with light and dark measurements`: `expected [ … ] to have a length of 29 but got 26`; `names the WCAG criterion and minimum of every row` fail vì danh sách tiêu chí thiếu ba dòng.
- `public API > exports exactly the documented components and nothing internal`: danh sách export chưa có `Progress`. Bản nháp không thấy lỗi này (phát hiện 11).

Rồi lưu khối patch ở Step 3 vào `../task-3-code.patch` (giữ LF). Áp riêng phần `scripts/lib/contrast.ts` (ba check mới), rồi chạy kiểm tra tương phản:

```bash
git apply --include=scripts/lib/contrast.ts ../task-3-code.patch
pnpm check:contrast
```

Expected: FAIL (exit 1) với `6 contrast problem(s):`:
- `light/default progress-fill = 2.45 is below 3:1. …`
- `light/default progress-glow-fill = 1.62 is below 3:1. …`
- `light/default accent-text-on-surface = 3.95 is below 4.5:1. …`
- `dark/default progress-fill = 1.74 is below 3:1. …`
- `dark/default progress-glow-fill = 1.74 is below 3:1. …`
- `dark/default accent-text-on-surface = 4.44 is below 4.5:1. …`

Các check của Alert vẫn là `known-exception`; ở `contrast-more` cả ba check mới đều `pass`. Báo cáo nháp ghi số lỗi (6); các dòng là số script in ra ở đầu nhánh nháp.

- [ ] **Step 3: Viết code**

Phần `scripts/lib/contrast.ts` của khối dưới đây đã được áp ở Step 2. Áp phần còn lại:

```bash
git apply --exclude=scripts/lib/contrast.ts ../task-3-code.patch
```

````diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index 5bd2ae3..b26bf82 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -317,7 +317,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 3 | Viền Input/Textarea khi focus (control không lỗi) | đạt (4.45:1) | 2.06:1 | 3:1 | 1.4.11 |
 | 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
 | 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) và vạch dưới tab `underline` đang chọn, so với nền | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
-| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
+| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin` | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
 | 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn, trang hiện tại của Pagination | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
 | 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn, trang hiện tại của Pagination | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
 | 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ; dòng gợi ý của vùng thả FileUpload khi đang kéo | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
@@ -327,7 +327,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 13 | Tab `segmented` đang chọn (nền `--flg-control-bg`) so với rãnh | 1.24:1 | 1.12:1 | 3:1 | 1.4.11 |
 | 14 | Icon và vạch của toast `info` (`--flg-accent-solid`) so với nền | đạt (3.04:1) | 2.29:1 | 3:1 | 1.4.11 |
 | 15 | Chấm vạch chia của Slider (`--flg-slider-tick`, 70% `--flg-text-muted`) so với nền | 2.88:1 | 2.82:1 | 3:1 | 1.4.11 |
-| 16 | Rãnh của Slider (`--flg-control-track`) so với nền | 1.23:1 | 1.30:1 | 3:1 | 1.4.11 |
+| 16 | Rãnh của Slider và của Progress (`--flg-control-track`) so với nền | 1.23:1 | 1.30:1 | 3:1 | 1.4.11 |
 | 17 | Núm của Slider (`--flg-control-thumb`) so với rãnh và với phần đã chọn | 1.29:1 | 2.24:1 | 3:1 | 1.4.11 |
 | 18 | Số của ngày thuộc tháng khác trong Calendar (`--flg-text-muted`, `opacity: .5`) trên bề mặt | 2.04:1 | 2.14:1 | 4.5:1 | 1.4.3 |
 | 19 | Viền đứt nét của vùng thả FileUpload (`--flg-dropzone-border`, 45% `--flg-text-muted`) so với nền | 1.89:1 | 1.99:1 | 3:1 | 1.4.11 |
@@ -338,12 +338,17 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 24 | Tiêu đề của Alert `tinted` (màu trạng thái; `--flg-accent-text` cho `info`) trên nền nhuộm | đạt (4.68:1) | 3.37:1 | 4.5:1 | 1.4.3 |
 | 25 | Mô tả `--flg-text` của Alert `tinted` trên nền nhuộm | đạt (11.14:1) | 4.16:1 | 4.5:1 | 1.4.3 |
 | 26 | Chữ `--flg-accent-text` trên `--flg-control-bg`: tiêu đề Alert `plain` `info` | đạt (5.78:1) | 3.90:1 | 4.5:1 | 1.4.3 |
+| 27 | Phần đã chạy của Progress `thin` và `inline` (các điểm của `--flg-accent-gradient`, `--flg-success`, `--flg-danger`) so với rãnh `--flg-control-track` | 2.45:1 | 1.74:1 | 3:1 | 1.4.11 |
+| 28 | Phần đã chạy của Progress `glow`, kể cả lớp ánh sáng trắng 24% ở nửa trên, so với rãnh | 1.62:1 | 1.74:1 | 3:1 | 1.4.11 |
+| 29 | Chữ `--flg-accent-text` trên bề mặt: giá trị của Progress `glow` | 3.95:1 | 4.44:1 | 4.5:1 | 1.4.3 |
 
 Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Điểm 14 là icon `info` của toast theo mockup toast S2 (giai đoạn 2, Plan E1). Điểm 6 còn là chữ mờ của option Combobox đang lọc và dòng trạng thái (giai đoạn 3, Plan B) và chữ hàng thứ của Calendar (giai đoạn 3, Plan C): cùng cặp màu, nên cùng số đo. Điểm 18 là ngày của tháng khác theo mockup K1 (giai đoạn 3, Plan C), nửa độ mờ nên thấp hơn hẳn chữ mờ thường. Điểm 15–17 là chấm vạch, rãnh và núm của Slider theo mockup S3 (giai đoạn 3, Plan A). Điểm 19–22 là viền vùng thả, nút chọn tệp, cỡ tệp và dòng gợi ý của FileUpload theo mockup F1 (giai đoạn 3, Plan D); dòng gợi ý khi đang kéo (chữ mờ trên nền nhấn) cùng cặp màu với điểm 9, nên được ghi ở điểm 9 (phát hiện khi review cuối Plan D). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
 
 Điểm 23–26 là Alert theo mockup A1–A3 (giai đoạn 4, Plan A): icon và vạch `info`, tiêu đề và mô tả của `tinted`, tiêu đề của `plain`; mô tả của `plain` và `stripe` cùng cặp màu với điểm 21 và 22 nên được ghi ở đó. Số của điểm 23–26 là thấp nhất trong bốn trạng thái (`info`, `success`, `warning`, `error`).
 
-Cả hai mươi sáu điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
+Điểm 27–29 là Progress theo mockup P1–P3 (giai đoạn 4, Plan A): phần đã chạy so với rãnh (điểm 27 cho `thin` và `inline`, điểm 28 cho `glow` có thêm lớp ánh sáng), và giá trị của `glow` (điểm 29). Số của điểm 27 và 28 là thấp nhất trong các điểm màu của phần đã chạy (gradient nhấn, `success`, `danger`) và trên mọi nền tham chiếu. Giá trị của `thin` là chữ `--flg-text-muted` trên bề mặt, cùng cặp màu với điểm 6, và rãnh của Progress cùng cặp màu với điểm 16, nên được ghi ở đó. Ở `prefers-contrast: more` rãnh có viền và `glow` bỏ ánh sáng, nên cả ba điểm đều đạt.
+
+Cả hai mươi chín điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
 
 ---
 
diff --git a/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md b/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md
index b2ebd3e..3098282 100644
--- a/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md
+++ b/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md
@@ -289,7 +289,7 @@ Trong mục này, "màu trạng thái" của Alert và Progress là: `info` →
 - Giá trị: căn phải trong một cột rộng tối thiểu 52px (các thanh thẳng hàng), màu `--flg-text`, đậm `--flg-weight-medium`. Icon trạng thái vẫn mang màu trạng thái. Khi chưa xác định, cột 52px vẫn được giữ (rỗng), để thanh dài bằng các thanh khác.
 - `sm`: rãnh cao 4px, bo 2px.
 
-**Khi giảm chuyển động** (ngoài mockup, theo bản quyết định ban đầu): đoạn chưa xác định không chạy, phủ cả rãnh, và được cắt thành sọc chéo bằng `mask-image: repeating-linear-gradient(-45deg, #000 0 4px, transparent 4px 8px)`. Dùng mask chứ không dùng nền sọc, để sọc giữ đúng màu (kể cả gradient) của phần đã chạy. Phủ cả rãnh để đoạn sọc không bị đọc nhầm thành một giá trị (Claude chốt).
+**Khi giảm chuyển động** (ngoài mockup, theo bản quyết định ban đầu): đoạn chưa xác định không chạy, phủ cả rãnh, và được cắt thành sọc chéo bằng `mask-image: repeating-linear-gradient(-45deg, #000 0 4px, transparent 4px 8px)`. Dùng mask chứ không dùng nền sọc, để sọc giữ đúng màu (kể cả gradient) của phần đã chạy. Phủ cả rãnh để đoạn sọc không bị đọc nhầm thành một giá trị (Claude chốt). Ở `glow`, mask cũng cắt luôn quầng sáng, nên khi giảm chuyển động thanh chưa xác định của `glow` không có quầng (phát hiện khi lập Plan A).
 
 **Dark:** chỉ khác giá trị token.
 
@@ -577,7 +577,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`. Icon dùng `
   - Vạch của `stripe`: `CanvasText`, như vạch của Toast.
   - Viền của cả ba variant: `CanvasText`. Nền nhuộm của `tinted` và vòng tròn của `plain` bị hệ thống bỏ; trạng thái vẫn do hình icon và tên của nó nói.
 - **Progress:**
-  - Rãnh: viền 1px `CanvasText`, như rãnh Slider.
+  - Rãnh: `outline: 1px solid CanvasText` (phát hiện khi lập Plan A: một viền 1px chiếm hết chỗ của phần đã chạy trong rãnh `sm` cao 2px; outline nằm ngoài hộp nên không lấy chỗ).
   - Phần đã chạy: `forced-color-adjust: none`, nền `Highlight` (khai báo `background` đầy đủ, nên ánh sáng và gradient của `glow` cũng mất); quầng sáng mất cùng `box-shadow`.
   - Trạng thái `success`, `error`: icon và `aria-valuetext` nói, không dựa vào màu.
 - **Skeleton:** `forced-color-adjust: none`, nền `GrayText`, không viền trong, không animation (`::after` của `shimmer` bị ẩn). Không có quy tắc này, khối nền sẽ thành `Canvas` trên `Canvas` và biến mất.
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index a9385d1..9a9674a 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -130,6 +130,14 @@ const SHIPPED_CLASSES = [
   'flg-alert-description',
   'flg-alert-actions',
   'flg-alert-dismiss',
+  'flg-progress',
+  'flg-progress-head',
+  'flg-progress-label',
+  'flg-progress-value',
+  'flg-progress-icon',
+  'flg-progress-line',
+  'flg-progress-track',
+  'flg-progress-fill',
 ];
 
 const requirements: Array<[string, boolean]> = [
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index c7befa5..c91b75d 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -30,6 +30,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/slider/Slider.tsx',
   'src/components/accordion/Accordion.tsx',
   'src/components/pagination/Pagination.tsx',
+  'src/components/progress/Progress.tsx',
   'src/components/calendar/Calendar.tsx',
   'src/components/date-picker/DatePicker.tsx',
   'src/components/file-upload/FileUpload.tsx',
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 9786419..7369635 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -48,7 +48,8 @@ const D = {
   6: {
     description:
       'Muted text on the brightest reference backdrop, the muted text of a Combobox option ' +
-      'while filtering and of its status row, and the weekday row of a Calendar',
+      'while filtering and of its status row, the weekday row of a Calendar, and the value of a ' +
+      'Progress `thin`',
     criterion: '1.4.3',
   },
   7: {
@@ -83,7 +84,10 @@ const D = {
     criterion: '1.4.11',
   },
   15: { description: 'Tick dots under a Slider track, against the surface', criterion: '1.4.11' },
-  16: { description: 'Slider track against the surface', criterion: '1.4.11' },
+  16: {
+    description: 'Slider and Progress track against the surface',
+    criterion: '1.4.11',
+  },
   17: {
     description: 'Slider thumb against its track and against the filled part',
     criterion: '1.4.11',
@@ -127,6 +131,21 @@ const D = {
     description: 'Accent text on the control background: the title of an info Alert `plain`',
     criterion: '1.4.3',
   },
+  27: {
+    description:
+      'The filled part of a Progress `thin` or `inline` (accent gradient, success and danger ' +
+      'colours) against its track',
+    criterion: '1.4.11',
+  },
+  28: {
+    description:
+      'The filled part of a Progress `glow`, with the light on its upper half, against its track',
+    criterion: '1.4.11',
+  },
+  29: {
+    description: 'Accent text on the surface: the value of a Progress `glow`',
+    criterion: '1.4.3',
+  },
 } as const satisfies Record<number, ExceptionRowInfo>;
 
 /** Spec §4.9. The default theme keeps the approved mockup values, so these gaps are accepted. */
@@ -182,4 +201,10 @@ export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
   { row: 24, theme: 'dark', check: 'alert-tinted-title', recorded: 3.37, ...D[24] },
   { row: 25, theme: 'dark', check: 'alert-tinted-text', recorded: 4.16, ...D[25] },
   { row: 26, theme: 'dark', check: 'alert-plain-title', recorded: 3.9, ...D[26] },
+  { row: 27, theme: 'light', check: 'progress-fill', recorded: 2.45, ...D[27] },
+  { row: 27, theme: 'dark', check: 'progress-fill', recorded: 1.74, ...D[27] },
+  { row: 28, theme: 'light', check: 'progress-glow-fill', recorded: 1.62, ...D[28] },
+  { row: 28, theme: 'dark', check: 'progress-glow-fill', recorded: 1.74, ...D[28] },
+  { row: 29, theme: 'light', check: 'accent-text-on-surface', recorded: 3.95, ...D[29] },
+  { row: 29, theme: 'dark', check: 'accent-text-on-surface', recorded: 4.44, ...D[29] },
 ];
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index cc77423..9085d14 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -64,6 +64,9 @@ export const CHECKS = {
   'alert-tinted-icon': 3,
   'alert-plain-title': 4.5,
   'alert-plain-icon': 3,
+  'progress-fill': 3,
+  'progress-glow-fill': 3,
+  'accent-text-on-surface': 4.5,
 } as const;
 export type CheckId = keyof typeof CHECKS;
 const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
@@ -319,6 +322,22 @@ export function measure(
       alertWash(status, statusAlpha, alertPanel);
     const alertCircle = (status: (typeof alertStatuses)[number]) =>
       alertWash(status, 0.16, control);
+    // A Progress (progress.css). The track is control-track on the surface. The fill is the accent
+    // gradient, or the success or danger colour; the lowest of those counts. `glow` lays a white
+    // light of 24% over the top half of the fill, which contrast-more takes away (preferences.css).
+    const progressTrack = composite(color('control-track'), surface);
+    const progressFills = [
+      ...paintStops(resolveToken(t, 'accent-gradient')),
+      color('success'),
+      color('danger'),
+    ].map((stop) => composite(stop, progressTrack));
+    const progressWorst = (lit: boolean) =>
+      Math.min(
+        ...progressFills.flatMap((fill) => [
+          contrastRatio(fill, progressTrack),
+          ...(lit ? [contrastRatio(composite([255, 255, 255, 0.24], fill), progressTrack)] : []),
+        ]),
+      );
     const measured: Omit<Record<CheckId, number>, OverlayCheck> = {
       text: onSurface('text'),
       'text-muted': onSurface('text-muted'),
@@ -459,6 +478,11 @@ export function measure(
         () => control,
       ),
       'alert-plain-icon': alertWorst((status) => status.icon, alertCircle),
+      // The fill of a Progress against its track, for `thin` and `inline`; `glow` adds the light.
+      'progress-fill': progressWorst(false),
+      'progress-glow-fill': progressWorst(mode !== 'contrast-more'),
+      // The value of a `glow` Progress, in the accent text colour on the surface it sits on.
+      'accent-text-on-surface': onSurface('accent-text'),
     };
     for (const id of SURFACE_CHECK_IDS) lowest[id] = Math.min(lowest[id], measured[id]);
   }
diff --git a/src/components/progress/Progress.mdx b/src/components/progress/Progress.mdx
new file mode 100644
index 0000000..c5e0d98
--- /dev/null
+++ b/src/components/progress/Progress.mdx
@@ -0,0 +1,95 @@
+import { Canvas, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './Progress.stories';
+
+<Meta of={Stories} />
+
+# Progress
+
+A bar that shows how far some work is: an upload, an import, a step of a long task. With no value it
+shows that something is going on without saying how far. For a wait of a few seconds that has no
+end in sight, a `Spinner` is the lighter choice.
+
+```tsx
+import { Progress } from 'h2d-glass-ui';
+
+<Progress label="Uploading contract.pdf" value={45} showValue />;
+```
+
+<Canvas of={Stories.Thin} />
+
+## Props
+
+| Prop           | Type                                     | Default     | Does                                                                           |
+| -------------- | ---------------------------------------- | ----------- | ------------------------------------------------------------------------------ |
+| `value`        | `number \| null`                         | `null`      | How far, from 0 to `max`. `null`, or no value, means the amount is not known   |
+| `max`          | `number`                                 | `100`       | The value that is all of it                                                    |
+| `label`        | `ReactNode`                              | none        | The visible name; it also names the bar                                        |
+| `showValue`    | `boolean`                                | `false`     | Shows the value as text, by default a percent                                  |
+| `getValueText` | `(value: number, max: number) => string` | none        | Writes the value for the text shown and for screen readers ("3 of 8 files")    |
+| `locale`       | `string`                                 | `'en-US'`   | The language of the percent ("45%", and "45 %" in `de-DE`)                     |
+| `status`       | `'default' \| 'success' \| 'error'`      | `'default'` | The colour, an icon, and the status added to the value text for screen readers |
+| `size`         | `'sm' \| 'md'`                           | `'md'`      | `sm` is a thinner bar                                                          |
+| `variant`      | `'thin' \| 'glow' \| 'inline'`           | `'thin'`    | The look (see Variants)                                                        |
+| `labels`       | `Partial<{ success, error }>`            | English     | The words that name the status for screen readers                              |
+
+`ref`, `className`, `style` and the other attributes of a `div` go to the root, which is the element
+with `role="progressbar"`. The `role` cannot be changed.
+
+A `value` outside 0 to `max` is clamped, and a `value` that is not a finite number is read as none;
+both are warned about in development. So is a `max` that is not a positive number, which is read as 100.
+
+## Variants
+
+- `variant="thin"` (default): the 4px track of a Slider, the label above it and the value at the
+  right. Light, and in step with the other controls; `size="sm"` makes it 2px.
+- `variant="glow"`: a thick 10px pill with a light on its face and a halo of its own colour, and a
+  bold value. It stands out most, which suits the main upload of a screen; the halo is noisy when
+  there are many bars in a list. `size="sm"` makes it 6px.
+- `variant="inline"`: an 8px flat bar with the value at its end, in a column of 52px so that the bars
+  of a list line up. Easy to read at a glance, at the cost of that column. `size="sm"` makes it 4px.
+
+<Canvas of={Stories.Glow} />
+<Canvas of={Stories.Inline} />
+
+## Name and value
+
+A Progress needs a name. Give it a `label`, or an `aria-label` or `aria-labelledby` when the name is
+written elsewhere; without one the library warns in development. With neither a `label` nor a value
+a Progress is only a track, which is how a small bar sits under a file row (`size="sm"`): give it an
+`aria-label` there.
+
+The value that people see is hidden from screen readers; they get it from the attributes of the
+bar instead, when they reach it. Nothing is announced as the value moves. Use `showValue` or
+`getValueText` when the value matters to the person: a bar with no number says only about how far.
+`aria-valuetext` carries the status as well ("62%, Error"), since a progressbar has no attribute
+for an error.
+
+<Canvas of={Stories.ValueChange} />
+
+## Not knowing how far
+
+Without a `value` the bar has a segment of 35% that slides to and fro. When the work reports its
+amount, pass it; the bar then widens in `--flg-duration-normal`.
+
+## Reduced motion
+
+With `prefers-reduced-motion: reduce` the segment of an indeterminate bar does not move. It covers
+the whole track and is cut into diagonal stripes, so it is not mistaken for a value. A change of
+value does not animate either, since the duration tokens are 0ms in this mode.
+
+## Accessibility
+
+- The fill of a bar is below 3:1 against its track in the default theme, as the mockup is: `thin`
+  and `inline` 2.45 light and 1.74 dark, `glow` 1.62 and 1.74, and the value of `glow` is 3.95 in
+  light and 4.44 in dark, below 4.5 (rows 27 to 29 of the table on the Accessibility page). With
+  `prefers-contrast: more` the track has an edge, `glow` loses its light and halo, and they all meet
+  AA. Show the value as text when it matters.
+- In forced colours the track has a line in the text colour and the fill is the selection colour.
+  The status is told by the icon and by the value text, not by colour.
+
+## Do and don't
+
+- Do give every Progress a name.
+- Do use `getValueText` when "45%" is not the useful way to say it ("3 of 8 files").
+- Don't use it for a wait with no visible end that lasts a moment; use a `Spinner`.
+- Don't put many `glow` bars in a list; use `thin` or `inline`.
diff --git a/src/components/progress/Progress.tsx b/src/components/progress/Progress.tsx
new file mode 100644
index 0000000..159a203
--- /dev/null
+++ b/src/components/progress/Progress.tsx
@@ -0,0 +1,179 @@
+'use client';
+
+import { clsx } from 'clsx';
+import { forwardRef, useEffect, useId } from 'react';
+import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
+import { dataAttr } from '../../internal/data-attr';
+import { StatusIcon } from '../../internal/icons';
+import { numberFormat } from '../../internal/intl';
+import { useRequireName } from '../../internal/use-require-name';
+import { devWarn } from '../../internal/warn';
+
+export type ProgressVariant = 'thin' | 'glow' | 'inline';
+export type ProgressStatus = 'default' | 'success' | 'error';
+
+/** The words a Progress says; translate them here. */
+export interface ProgressLabels {
+  success: string;
+  error: string;
+}
+
+export type ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'children'> & {
+  /**
+   * How far the work is, from 0 to `max`. `null` or no value means the progress is indeterminate:
+   * the amount is not known.
+   */
+  value?: number | null;
+  /** The value that is all of it. Default 100. */
+  max?: number;
+  /** The visible name of the progress. It names the bar unless `aria-label` or `aria-labelledby` does. */
+  label?: ReactNode;
+  /** Shows the value as text, by default a percent. Default false. */
+  showValue?: boolean;
+  /** Writes the value, for the text shown and for screen readers, such as "3 of 8 files". */
+  getValueText?: (value: number, max: number) => string;
+  /** The language of the percent. Default `'en-US'`. */
+  locale?: string;
+  /** `success` and `error` change the colour, show an icon and add the status to the value text. */
+  status?: ProgressStatus;
+  size?: 'sm' | 'md';
+  variant?: ProgressVariant;
+  /** Default English words; any of them can be replaced. */
+  labels?: Partial<ProgressLabels>;
+};
+
+const DEFAULT_LABELS: ProgressLabels = { success: 'Success', error: 'Error' };
+
+const hasContent = (node: ReactNode) =>
+  node !== undefined && node !== null && node !== false && node !== '';
+
+/**
+ * A bar that shows how far some work is, in one of three looks. The root is the `progressbar`, so
+ * the whole component is one thing to assistive technology: the name, the value and the status
+ * are attributes on it, and the visible value is hidden from it. Not the native `<progress>`: the
+ * fill needs the glow, the stripes and the slide that the engines do not let a native one have.
+ */
+export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
+  {
+    value = null,
+    max: maxProp = 100,
+    label,
+    showValue = false,
+    getValueText,
+    locale = 'en-US',
+    status = 'default',
+    size = 'md',
+    variant = 'thin',
+    labels,
+    className,
+    ...props
+  },
+  ref,
+) {
+  const labelId = useId();
+  const words = { ...DEFAULT_LABELS, ...labels };
+
+  const maxValid = Number.isFinite(maxProp) && maxProp > 0;
+  const max = maxValid ? maxProp : 100;
+  // A value that is not a finite number is the same as none: the amount is not known.
+  const valueFinite = typeof value === 'number' && Number.isFinite(value);
+  const determinate = valueFinite;
+  const clamped = valueFinite ? Math.min(Math.max(value, 0), max) : 0;
+
+  const problems: string[] = [];
+  if (!maxValid) {
+    problems.push(
+      `Progress: max must be a positive finite number, not ${String(maxProp)}; using 100.`,
+    );
+  }
+  if (typeof value === 'number' && !valueFinite) {
+    problems.push(
+      `Progress: value ${String(value)} is not a finite number; the progress is shown as indeterminate.`,
+    );
+  }
+  if (valueFinite && clamped !== value) {
+    problems.push(`Progress: value ${value} is outside 0 to ${max}; it is clamped.`);
+  }
+  const report = problems.join('\n');
+  useEffect(() => {
+    for (const problem of report.split('\n')) if (problem) devWarn(problem);
+  }, [report]);
+
+  const named = hasContent(label);
+  // The attribute of the caller wins. `aria-label` is not set beside `aria-labelledby`, which would
+  // win over it: a caller who gives the former means it to be the name.
+  const labelledBy =
+    props['aria-labelledby'] ?? (named && props['aria-label'] === undefined ? labelId : undefined);
+  useRequireName({ 'aria-label': props['aria-label'], 'aria-labelledby': labelledBy }, 'Progress');
+
+  const percent = determinate
+    ? numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(clamped / max)
+    : '';
+  const valueText = determinate ? (getValueText?.(clamped, max) ?? percent) : '';
+  // A progressbar has no ARIA for an error, so the status goes in the text of the value.
+  const ariaValueText = determinate
+    ? status === 'default'
+      ? getValueText?.(clamped, max)
+      : `${valueText}, ${words[status]}`
+    : undefined;
+
+  // The icon is there without `showValue`, so the status is not told by colour alone.
+  const icon =
+    status === 'default' ? null : (
+      <span className="flg-progress-icon">
+        <StatusIcon status={status} />
+      </span>
+    );
+  const inline = variant === 'inline';
+  // `inline` keeps the column of the value while the progress is indeterminate, so its bar is as
+  // long as the others; `thin` and `glow` have nothing to show then.
+  const showText = determinate && showValue;
+  const hasCell = showText || icon !== null || (inline && showValue);
+  const cell = hasCell ? (
+    <span className="flg-progress-value" aria-hidden="true">
+      {icon}
+      {showText ? valueText : null}
+    </span>
+  ) : null;
+
+  const fillStyle = determinate
+    ? ({
+        '--flg-progress-value': `${Number(((clamped / max) * 100).toFixed(4))}%`,
+      } as CSSProperties)
+    : undefined;
+
+  return (
+    <div
+      {...props}
+      ref={ref}
+      className={clsx('flg-progress', className)}
+      data-variant={variant}
+      data-size={size}
+      data-status={status}
+      data-indeterminate={dataAttr(!determinate)}
+      role="progressbar"
+      aria-labelledby={labelledBy}
+      aria-valuemin={0}
+      aria-valuemax={max}
+      aria-valuenow={determinate ? clamped : undefined}
+      aria-valuetext={ariaValueText}
+    >
+      {named || (!inline && cell) ? (
+        <div className="flg-progress-head">
+          {named ? (
+            <span className="flg-progress-label" id={labelId}>
+              {label}
+            </span>
+          ) : null}
+          {inline ? null : cell}
+        </div>
+      ) : null}
+      <div className="flg-progress-line">
+        <div className="flg-progress-track">
+          <div className="flg-progress-fill" style={fillStyle} />
+        </div>
+        {inline ? cell : null}
+      </div>
+    </div>
+  );
+});
diff --git a/src/components/progress/index.ts b/src/components/progress/index.ts
new file mode 100644
index 0000000..8a5859d
--- /dev/null
+++ b/src/components/progress/index.ts
@@ -0,0 +1,2 @@
+export { Progress } from './Progress';
+export type { ProgressLabels, ProgressProps, ProgressStatus, ProgressVariant } from './Progress';
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index 0bbcfdd..fb8f311 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -60,7 +60,7 @@ application's responsibility.
   present from the first render. One shared region would go silent inside an open Dialog, whose
   surroundings are inert. Changes your code makes to `value` are not announced.
 
-The contrast gaps of the Slider (rows 15 to 17), Calendar (row 18), FileUpload (rows 19 to 22) and Alert (rows 23 to 26)
+The contrast gaps of the Slider (rows 15 to 17), Calendar (row 18), FileUpload (rows 19 to 22) Alert (rows 23 to 26) and Progress (rows 27 to 29)
 are in the table above, which is built from the same data CI checks.
 
 ## A `<dialog>` the library did not create
diff --git a/src/index.ts b/src/index.ts
index 616a636..1affb63 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -207,6 +207,13 @@ export type {
   AlertTitleProps,
   AlertVariant,
 } from './components/alert';
+export { Progress } from './components/progress';
+export type {
+  ProgressLabels,
+  ProgressProps,
+  ProgressStatus,
+  ProgressVariant,
+} from './components/progress';
 export { Toaster, toast } from './components/toast';
 export type {
   ToastAction,
diff --git a/src/styles/components/progress.css b/src/styles/components/progress.css
new file mode 100644
index 0000000..39a2dec
--- /dev/null
+++ b/src/styles/components/progress.css
@@ -0,0 +1,164 @@
+/* Progress (spec phase 4 §4.3 Progress, mockup P1-P3): a bar that shows how far some work is, in three
+   looks. The parts below the variants are shared; each variant writes only what differs. The colour
+   of the fill, the colour of the glow and the colour of the icon sit in local variables, set by the
+   status, as the Alert's and the Toast's do. */
+@layer flg.components {
+  .flg-progress {
+    --flg-progress-color: var(--flg-accent-gradient);
+    --flg-progress-glow: var(--flg-accent-solid);
+    --flg-progress-status-color: var(--flg-text-muted);
+    box-sizing: border-box;
+    display: flex;
+    flex-direction: column;
+    gap: 6px;
+    font-family: var(--flg-font-sans);
+  }
+  /* `inline` fills with the first stop of the gradient, a flat colour. It comes before the statuses,
+     which have the same weight and win by coming later. */
+  .flg-progress[data-variant='inline'] {
+    --flg-progress-color: var(--flg-accent-start);
+  }
+  .flg-progress[data-status='success'] {
+    --flg-progress-color: var(--flg-success);
+    --flg-progress-glow: var(--flg-success);
+    --flg-progress-status-color: var(--flg-success);
+  }
+  .flg-progress[data-status='error'] {
+    --flg-progress-color: var(--flg-danger);
+    --flg-progress-glow: var(--flg-danger);
+    --flg-progress-status-color: var(--flg-danger);
+  }
+
+  .flg-progress-head {
+    display: flex;
+    align-items: center;
+    justify-content: space-between;
+    gap: 12px;
+    min-height: 18px;
+  }
+  .flg-progress-label {
+    min-width: 0;
+    overflow: hidden;
+    color: var(--flg-text);
+    font-size: var(--flg-text-sm);
+    text-overflow: ellipsis;
+    white-space: nowrap;
+  }
+  /* At the end edge even without a label (the mockup does not draw that case). */
+  .flg-progress-value {
+    display: inline-flex;
+    flex: none;
+    align-items: center;
+    gap: 4px;
+    margin-inline-start: auto;
+    color: var(--flg-text-muted);
+    font-size: var(--flg-text-sm);
+    font-variant-numeric: tabular-nums;
+    white-space: nowrap;
+  }
+  .flg-progress-icon {
+    display: inline-flex;
+    color: var(--flg-progress-status-color);
+  }
+  .flg-progress-icon > svg {
+    width: 14px;
+    height: 14px;
+  }
+
+  .flg-progress-line {
+    display: flex;
+    align-items: center;
+    gap: 10px;
+  }
+  .flg-progress-track {
+    position: relative;
+    flex: 1;
+    min-width: 0;
+    height: 4px;
+    overflow: hidden;
+    border-radius: var(--flg-radius-full);
+    background: var(--flg-control-track);
+  }
+  /* The width is a custom property in `style`, so the HTML a server renders is already right. */
+  .flg-progress-fill {
+    position: absolute;
+    top: 0;
+    bottom: 0;
+    left: 0;
+    width: var(--flg-progress-value, 0%);
+    border-radius: inherit;
+    background: var(--flg-progress-color);
+    transition: width var(--flg-duration-normal) var(--flg-ease);
+  }
+  .flg-progress[data-size='sm'] > .flg-progress-line > .flg-progress-track {
+    height: 2px;
+  }
+
+  /* Indeterminate: a segment of 35% slides to and fro. It moves by `translate`, which the browser
+     does not lay out again at each frame, from the left edge to 65% of the track: 65 / 35 of the
+     segment's own width (spec §3.3). It starts at 0 where the mockup starts part way. A reduced-motion
+     preference stops it, in preferences.css. */
+  .flg-progress[data-indeterminate] .flg-progress-fill {
+    width: 35%;
+    animation: flg-progress-slide 1.4s cubic-bezier(0.65, 0, 0.35, 1) infinite alternate;
+  }
+  @keyframes flg-progress-slide {
+    from {
+      translate: 0;
+    }
+    to {
+      translate: 185.714%;
+    }
+  }
+
+  /* thin (P1): the track of a Slider, the label above it and the value at its end. Nothing more. */
+
+  /* glow (P2): a thick pill with a light on its face and a halo of its own colour. The track lets
+     the halo out. */
+  .flg-progress[data-variant='glow'] {
+    gap: 8px;
+  }
+  .flg-progress[data-variant='glow'] > .flg-progress-line > .flg-progress-track {
+    height: 10px;
+    overflow: visible;
+    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.12);
+  }
+  .flg-progress[data-variant='glow'][data-size='sm'] > .flg-progress-line > .flg-progress-track {
+    height: 6px;
+  }
+  .flg-progress[data-variant='glow'] .flg-progress-fill {
+    background:
+      linear-gradient(rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0) 50%),
+      var(--flg-progress-color);
+    box-shadow: 0 0 10px color-mix(in srgb, var(--flg-progress-glow) 60%, transparent);
+  }
+  .flg-progress[data-variant='glow'] .flg-progress-value {
+    color: var(--flg-progress-status-color);
+    font-size: var(--flg-text-md);
+    font-weight: var(--flg-weight-semibold);
+  }
+  .flg-progress[data-variant='glow'][data-status='default'] .flg-progress-value {
+    color: var(--flg-accent-text);
+  }
+  .flg-progress[data-variant='glow'] .flg-progress-icon > svg {
+    width: 16px;
+    height: 16px;
+  }
+
+  /* inline (P3): a flat bar of 8px with the value at its end, in a column wide enough that the bars
+     of a list line up. The column stays while the progress is indeterminate. */
+  .flg-progress[data-variant='inline'] > .flg-progress-line > .flg-progress-track {
+    height: 8px;
+    border-radius: 3px;
+  }
+  .flg-progress[data-variant='inline'][data-size='sm'] > .flg-progress-line > .flg-progress-track {
+    height: 4px;
+    border-radius: 2px;
+  }
+  .flg-progress[data-variant='inline'] .flg-progress-value {
+    justify-content: flex-end;
+    min-width: 52px;
+    color: var(--flg-text);
+    font-weight: var(--flg-weight-medium);
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index ed94fee..c50ad1d 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -36,5 +36,6 @@
 @import './components/file-upload.css';
 @import './components/toast.css';
 @import './components/alert.css';
+@import './components/progress.css';
 @import './components/floating.css';
 @import './preferences.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 0598841..e9ce0cf 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -45,6 +45,17 @@
     .flg-file-upload[data-dragging] .flg-file-upload-hint {
       color: var(--flg-selected-text);
     }
+    /* A Progress track is drawn faint in the mockup. Here it has an edge of the control border, as a
+       Slider's does. A glow has no light on its face and no halo: a blur around the bar helps no one
+       who needs the contrast, and the `--flg-glow` token that is none in this mode does not reach it,
+       since the halo is a colour of its own (spec phase 4 §4.4). */
+    .flg-progress-track {
+      box-shadow: inset 0 0 0 1px var(--flg-control-border);
+    }
+    .flg-progress[data-variant='glow'] .flg-progress-fill {
+      background: var(--flg-progress-color);
+      box-shadow: none;
+    }
   }
   @media (forced-colors: active) {
     .flg-surface {
@@ -417,5 +428,32 @@
     .flg-alert[data-variant='stripe']::before {
       background: CanvasText;
     }
+    /* A Progress track has a line in the text colour, and the fill is the selection colour. The line
+       is an outline, not a border like the Slider's: a border would leave the 2px track of size `sm`
+       with no room for the fill. Opting out of colour adjustment keeps `Highlight`, and the
+       declaration is the whole `background`, so the light and the gradient of the glow go with it,
+       and so does its halo. The status is told by the icon and by `aria-valuetext`, not by colour. */
+    .flg-progress-track {
+      outline: 1px solid CanvasText;
+    }
+    .flg-progress-fill {
+      forced-color-adjust: none;
+      background: Highlight;
+      box-shadow: none;
+    }
+  }
+  /* Repeating motion cannot be stopped by a duration of 0ms, which would repeat for ever (spec
+     phase 4 §3.3), so what moves without end is stopped by hand here. Motion that happens once keeps
+     following the duration tokens, which the theme sets to 0ms in this mode.
+     An indeterminate Progress does not slide: its segment covers the track and is cut into diagonal
+     stripes by a mask rather than a striped background, so the stripes keep the colour of the fill,
+     a gradient included. Covering the track keeps the stripes from being read as a value. The mask
+     cuts the halo of a glow with the rest of the segment. */
+  @media (prefers-reduced-motion: reduce) {
+    .flg-progress[data-indeterminate] .flg-progress-fill {
+      width: 100%;
+      animation: none;
+      mask-image: repeating-linear-gradient(-45deg, #000 0 4px, transparent 4px 8px);
+    }
   }
 }
diff --git a/tests/visual/stories.visual.ts b/tests/visual/stories.visual.ts
index b502b21..9c412d4 100644
--- a/tests/visual/stories.visual.ts
+++ b/tests/visual/stories.visual.ts
@@ -21,11 +21,21 @@ const MODES = [
   { name: 'solid', simulate: 'solid' },
   { name: 'contrast-more', simulate: 'none', media: { contrast: 'more' } },
   { name: 'forced-colors', simulate: 'none', media: { forcedColors: 'active' } },
+  // Only for the stories that move without end: the same look as `normal`, with the motion stopped by
+  // hand (spec phase 4 §3.3). Playwright's `animations: 'disabled'` cancels a repeating animation back
+  // to its start, so without this pass nothing would show what a reduced-motion user sees.
+  {
+    name: 'reduced-motion',
+    simulate: 'none',
+    media: { reducedMotion: 'reduce' },
+    onlyTagged: 'reduced-motion',
+  },
 ] as const;
 
 for (const story of stories) {
   for (const theme of THEMES) {
     for (const mode of MODES) {
+      if ('onlyTagged' in mode && !story.tags?.includes(mode.onlyTagged)) continue;
       test(`${story.id} · ${theme} · ${mode.name}`, async ({ page }) => {
         if ('media' in mode) await page.emulateMedia(mode.media);
         await page.goto(
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm check:contrast
pnpm vitest run --project unit --project unit-react18 --project scripts src/components/progress src/docs src/internal src/index.test.ts scripts
pnpm vitest run --project storybook-light --project storybook-dark src/components/progress
pnpm build && pnpm check:package
```

Expected:
- `pnpm typecheck` không lỗi, kể cả `tests/visual/stories.visual.ts`: đó là kiểm tra duy nhất của harness ở máy này (phát hiện 8).
- `pnpm check:contrast`: PASS. Sáu số ở Step 2 là `known-exception`; ở `contrast-more` là 4.82, 4.82, 5.95 (sáng) và 5.56, 5.56, 9.29 (tối).
- Unit: 55 file, 539 test PASS, 3 skip, không lỗi kiểu. `Progress.test.tsx` có 43 test ở mỗi project React, `Progress.test-d.ts` 4, `ExceptionTable.test.tsx` 4.
- Story Progress: 36 test PASS (6 story × ba engine × hai theme). `IndeterminateMotion` đọc khung hình (phát hiện 7). `ReducedMotion` chỉ kiểm ở Chromium, và pass ở Firefox, WebKit vì thoát sớm.
- `check:package` PASS, gồm `check:use-client` (125 module, 33 client, có `Progress.tsx`), `check:dist-css` (tám class `flg-progress*`) và `size`. CSS chỉ còn 13 B dưới ngưỡng 9311 B (phát hiện 10). Nếu `size` fail vì CSS, báo lại và để Task 4 ghi ngưỡng; không chạy `pnpm size:record` ở task này.
- Lượt `reduced-motion` không chạy ở máy này; ảnh của nó tạo trong CI. Ảnh chuẩn của component cũ giữ nguyên (phát hiện 12).

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md \
  docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md \
  scripts/check-dist-css.ts \
  scripts/check-use-client.ts \
  scripts/contrast-exceptions.ts \
  scripts/lib/contrast.ts \
  src/components/progress/Progress.mdx \
  src/components/progress/Progress.stories.tsx \
  src/components/progress/Progress.test-d.ts \
  src/components/progress/Progress.test.tsx \
  src/components/progress/Progress.tsx \
  src/components/progress/index.ts \
  src/docs/Accessibility.mdx \
  src/docs/ExceptionTable.test.tsx \
  src/index.test.ts \
  src/index.ts \
  src/styles/components/progress.css \
  src/styles/index.css \
  src/styles/preferences.css \
  tests/visual/stories.visual.ts
```
```bash
git commit -m "feat(progress): add Progress with thin, glow and inline looks" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 4: Skeleton (`pulse`, `shimmer`, `glass`) và ngưỡng kích thước của Plan A

Spec §1, §3.1 (dòng Skeleton, các ca `check:rsc`), §3.2 (không có cấu hình chung cho cả app), §3.3 (dòng Skeleton, giảm chuyển động), §3.4 (Skeleton), §4.1, §4.2 (`--flg-skeleton-shine`; ánh nhấn của `glass`), §4.3 **Skeleton** và **`SkeletonText`**, §4.4 ("Không đo"), §4.5 **Skeleton**, §5 (cảnh báo của Skeleton), §6.3 **`Skeleton`** và **`SkeletonText`**, §7 (Skeleton ở dòng 1, 2, 5; khung hình animation; tag `reduced-motion`; test kiểu; kiểm tra gói), §8 (trang Skeleton). Mockup Sk1, Sk2, Sk3.
- **Server-safe**, chỉ là markup: một `<span>` luôn mang `aria-hidden="true"`, đặt sau props. `SkeletonText` là `span.flg-skeleton-text` chứa các dòng `text`; khi có hơn một dòng, dòng cuối rộng 64%.
- **Kích thước:** `width`, `height`, `size` là số thì thành px, là chuỗi thì là giá trị CSS; `style` thắng. `circle` mặc định 40px; `width` và `height` thắng `size` (phát hiện 9).
- **Hình:** `rect` cao `1lh`; `circle` bo 50%; `text` là `inline-block` cao `.7em` với margin dọc `calc((1lh - .7em) / 2)`, nên mỗi dòng chiếm đúng một dòng chữ.
- **Giao diện Sk1–Sk3:** `pulse` (độ mờ, 1.6s), `shimmer` (vệt `--flg-skeleton-shine` trên `::after`, đi bằng `transform`, 1.6s tuyến tính), `glass` (nền "thở" sang ánh nhấn 20%, 2s). Token mới `--flg-skeleton-shine` trong `values.ts`; chạy `pnpm gen:theme` sau khi sửa.
- **Forced colors và giảm chuyển động** trong `preferences.css` (phát hiện 9). Ba story giao diện gắn tag `reduced-motion`.
- **Ngưỡng kích thước** cho cả Plan A, ghi bằng `pnpm size:record` (không chép `.size-limit.json`).
- Task này kết thúc bằng kiểm tra cuối của cả nhánh.

**Files:**
- Create: `src/components/skeleton/Skeleton.tsx`, `index.ts`, `Skeleton.test.tsx`, `Skeleton.test-d.ts`, `Skeleton.stories.tsx`, `Skeleton.mdx`, `src/styles/components/skeleton.css`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `src/styles/theme/values.ts`, `scripts/lib/theme-css.test.ts`, `scripts/check-dist-css.ts`, `scripts/rsc-probe.mjs`, `.size-limit.json` (do `size:record` ghi)

**Interfaces:**
- Produces trong `src/components/skeleton/Skeleton.tsx` (server-safe), export qua `index.ts` và `src/index.ts`:
  - `Skeleton`: `forwardRef<HTMLSpanElement, SkeletonProps>`; `SkeletonText`: `forwardRef<HTMLSpanElement, SkeletonTextProps>`.
  - `SkeletonProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & { shape?: SkeletonShape; variant?: SkeletonVariant; width?: number | string; height?: number | string; size?: number | string }`. Mặc định: `shape` `'rect'`, `variant` `'pulse'`, `size` 40 (chỉ cho `circle`).
  - `SkeletonTextProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & { lines?: number; variant?: SkeletonVariant }`, `lines` mặc định 3.
  - `SkeletonVariant = 'pulse' | 'shimmer' | 'glass'`; `SkeletonShape = 'rect' | 'circle' | 'text'`.
  - Class: `flg-skeleton`, `flg-skeleton-text`. Hook DOM: `data-variant`, `data-shape`. Keyframes `flg-skeleton-pulse`, `flg-skeleton-shimmer`, `flg-skeleton-breathe`.
  - Token `--flg-skeleton-shine`: sáng `rgba(255,255,255,.75)`, tối `rgba(255,255,255,.12)`; có trong bảng `MOCKUP` của `theme-css.test.ts`.
  - Cảnh báo dev: ``Skeleton: `size` only applies to a circle, so it is ignored. Use `width` and `height`.``; ``SkeletonText: `lines` must be a positive integer, got <n>; using 1.``
  - `scripts/rsc-probe.mjs`: các ca `Skeleton rect`, `Skeleton circle`, `Skeleton text`, `SkeletonText`.
  - Ngưỡng mới: JS 49547 B, CSS 10530 B.
- Consumes: khối `prefers-reduced-motion` và lượt `reduced-motion` của harness (Task 3); `devWarn`; `Avatar`, `Card` trong story.

- [ ] **Step 1: Viết test**

```diff
diff --git a/scripts/lib/theme-css.test.ts b/scripts/lib/theme-css.test.ts
index 087e1e0..3ea6f29 100644
--- a/scripts/lib/theme-css.test.ts
+++ b/scripts/lib/theme-css.test.ts
@@ -47,6 +47,7 @@ const MOCKUP: Record<values.ThemeName, Record<string, string>> = {
     'control-border': 'rgba(31,36,51,.14)',
     'control-track': 'rgba(31,36,51,.12)',
     'control-thumb': '#ffffff',
+    'skeleton-shine': 'rgba(255,255,255,.75)',
     scrim: 'rgba(15,20,40,.28)',
   },
   dark: {
@@ -72,6 +73,7 @@ const MOCKUP: Record<values.ThemeName, Record<string, string>> = {
     'control-border': 'rgba(255,255,255,.11)',
     'control-track': 'rgba(255,255,255,.10)',
     'control-thumb': '#ffffff',
+    'skeleton-shine': 'rgba(255,255,255,.12)',
     scrim: 'rgba(0,0,0,.45)',
   },
 };
diff --git a/src/components/skeleton/Skeleton.stories.tsx b/src/components/skeleton/Skeleton.stories.tsx
new file mode 100644
index 0000000..aaf047b
--- /dev/null
+++ b/src/components/skeleton/Skeleton.stories.tsx
@@ -0,0 +1,339 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { expect, waitFor } from 'storybook/test';
+import { Avatar } from '../avatar/Avatar';
+import { Card, CardHeader, CardTitle } from '../card/Card';
+import { Skeleton, SkeletonText } from './Skeleton';
+import type { SkeletonVariant } from './Skeleton';
+
+const meta = {
+  title: 'Components/Skeleton',
+  component: Skeleton,
+} satisfies Meta<typeof Skeleton>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+const column = { display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 } as const;
+const card = { gap: 12, padding: 16 } as const;
+
+/** A line of the text a Skeleton stands for: the line box of that text, sized as the text is. */
+const line = (fontSize: string, lineHeight: number) => ({ fontSize, lineHeight }) as const;
+
+const ACTIVITY = [
+  ['MA', 'Minh Anh Nguyen', 'Commented on your post'],
+  ['QH', 'Quoc Huy Tran', 'Shared a file'],
+  ['PL', 'Ngoc Lan Pham', 'Liked your photo'],
+] as const;
+const ROWS = [
+  { name: '58%', note: '78%' },
+  { name: '44%', note: '60%' },
+  { name: '52%', note: '70%' },
+];
+
+/**
+ * The profile card and the list of three rows of the approved mockup (skeleton Sk1-Sk3), loading
+ * on the left and the same content loaded on the right, to compare. Each line is a `text` Skeleton
+ * in a box with the font size and line height of the text it replaces.
+ */
+function Loading({ variant }: { variant: SkeletonVariant }) {
+  return (
+    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: 680 }}>
+      <div style={column}>
+        <Card style={card}>
+          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
+            <Skeleton variant={variant} shape="circle" size={40} />
+            <div style={{ flex: 1, ...line('var(--flg-text-md)', 1.3) }}>
+              <Skeleton variant={variant} shape="text" width="52%" />
+            </div>
+          </div>
+          <Skeleton variant={variant} height={112} />
+          <div style={line('var(--flg-text-sm)', 1.5)}>
+            <SkeletonText variant={variant} lines={2} />
+          </div>
+        </Card>
+        <Card style={card}>
+          <CardHeader>
+            <CardTitle>Recent activity</CardTitle>
+          </CardHeader>
+          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
+            {ROWS.map((row) => (
+              <div key={row.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
+                <Skeleton variant={variant} shape="circle" size={32} />
+                <div style={{ flex: 1, minWidth: 0 }}>
+                  <div style={line('var(--flg-text-sm)', 1.5)}>
+                    <Skeleton variant={variant} shape="text" width={row.name} />
+                  </div>
+                  <div style={line('var(--flg-text-xs)', 1.4)}>
+                    <Skeleton variant={variant} shape="text" width={row.note} />
+                  </div>
+                </div>
+              </div>
+            ))}
+          </div>
+        </Card>
+      </div>
+      <div style={column}>
+        <Card style={card}>
+          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
+            <Avatar size="lg" fallback="LT" alt="" />
+            <span
+              style={{
+                flex: 1,
+                color: 'var(--flg-text)',
+                fontSize: 'var(--flg-text-md)',
+                fontWeight: 'var(--flg-weight-semibold)',
+                lineHeight: 1.3,
+              }}
+            >
+              Lê Thu Trang
+            </span>
+          </div>
+          <div
+            style={{
+              height: 112,
+              borderRadius: 'var(--flg-radius-md)',
+              background:
+                'radial-gradient(circle at 74% 30%, #ffe9a8 0 13px, rgba(255,233,168,0) 14px), linear-gradient(170deg, transparent 58%, #3d7a6a 59%), linear-gradient(200deg, transparent 52%, #5f9e8a 53%), linear-gradient(180deg, #8fb8f0, #cfe3f7)',
+            }}
+          />
+          <p
+            style={{
+              margin: 0,
+              color: 'var(--flg-text)',
+              fontSize: 'var(--flg-text-sm)',
+              lineHeight: 1.5,
+            }}
+          >
+            Redesigning the checkout flow for the mobile app. Likes coffee and houseplants.
+          </p>
+        </Card>
+        <Card style={card}>
+          <CardHeader>
+            <CardTitle>Recent activity</CardTitle>
+          </CardHeader>
+          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
+            {ACTIVITY.map(([initials, name, note]) => (
+              <div key={initials} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
+                <Avatar size="md" fallback={initials} alt="" />
+                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
+                  <span
+                    style={{
+                      color: 'var(--flg-text)',
+                      fontSize: 'var(--flg-text-sm)',
+                      fontWeight: 'var(--flg-weight-medium)',
+                      lineHeight: 1.5,
+                    }}
+                  >
+                    {name}
+                  </span>
+                  <span
+                    style={{
+                      color: 'var(--flg-text-muted)',
+                      fontSize: 'var(--flg-text-xs)',
+                      lineHeight: 1.4,
+                    }}
+                  >
+                    {note}
+                  </span>
+                </div>
+              </div>
+            ))}
+          </div>
+        </Card>
+      </div>
+    </div>
+  );
+}
+
+// The tag adds a pass with the motion stopped (tests/visual/stories.visual.ts).
+export const Pulse: Story = { tags: ['reduced-motion'], render: () => <Loading variant="pulse" /> };
+export const Shimmer: Story = {
+  tags: ['reduced-motion'],
+  render: () => <Loading variant="shimmer" />,
+};
+export const Glass: Story = { tags: ['reduced-motion'], render: () => <Loading variant="glass" /> };
+
+/** One block of each look, to read the animations of; they are not a look to compare. */
+function Blocks() {
+  return (
+    <div style={{ display: 'grid', gap: 8, width: 240 }}>
+      <Skeleton variant="pulse" height={24} data-look="pulse" />
+      <Skeleton variant="shimmer" height={24} data-look="shimmer" />
+      <Skeleton variant="glass" height={24} data-look="glass" />
+    </div>
+  );
+}
+
+const blockOf = (root: HTMLElement, look: string) =>
+  root.querySelector<HTMLElement>(`[data-look="${look}"]`)!;
+
+/** The animations that run on a block or on its `::after`; the page's list has both. */
+const animationsOf = (block: HTMLElement) =>
+  document
+    .getAnimations()
+    .filter((animation) => (animation.effect as KeyframeEffect | null)?.target === block);
+
+/** Stops an animation and puts it at a time, to read the frame there. */
+const seek = (animation: Animation, time: number) => {
+  animation.pause();
+  animation.currentTime = time;
+};
+
+/**
+ * The frames of the animations, which the reference screenshots cannot show: they are taken with
+ * animations cancelled, so every block is at its first frame (spec §3.3). Each one is read at the
+ * frame of the mockup that the screenshot misses.
+ */
+export const AnimationFrames: Story = {
+  tags: ['no-visual'],
+  render: () => <Blocks />,
+  play: async ({ canvasElement }) => {
+    // `pulse`: opacity 1, then .4 at the middle of 1.6s, then 1.
+    const pulse = blockOf(canvasElement, 'pulse');
+    const [pulseAnimation, ...pulseOthers] = animationsOf(pulse);
+    await expect(pulseOthers).toHaveLength(0);
+    const pulseTiming = (pulseAnimation!.effect as KeyframeEffect).getTiming();
+    await expect(pulseTiming.duration).toBe(1600);
+    await expect(pulseTiming.iterations).toBe(Number.POSITIVE_INFINITY);
+    // A start from 0: the negative delay of the mockup only froze its screenshot at a good frame.
+    await expect(pulseTiming.delay).toBe(0);
+    // The easing of `animation-timing-function` is the one of each keyframe, not of the effect.
+    await expect((pulseAnimation!.effect as KeyframeEffect).getKeyframes()[0]!.easing).toBe(
+      'ease-in-out',
+    );
+    seek(pulseAnimation!, 0);
+    await expect(Number.parseFloat(getComputedStyle(pulse).opacity)).toBeCloseTo(1, 2);
+    seek(pulseAnimation!, 800);
+    await expect(Number.parseFloat(getComputedStyle(pulse).opacity)).toBeCloseTo(0.4, 2);
+
+    // `shimmer`: the light of `--flg-skeleton-shine` crosses the block from -100% to 100%, linear.
+    const shimmer = blockOf(canvasElement, 'shimmer');
+    const [shimmerAnimation, ...shimmerOthers] = animationsOf(shimmer);
+    await expect(shimmerOthers).toHaveLength(0);
+    const shimmerEffect = shimmerAnimation!.effect as KeyframeEffect;
+    await expect(shimmerEffect.pseudoElement).toBe('::after');
+    const shimmerTiming = shimmerEffect.getTiming();
+    await expect(shimmerTiming.duration).toBe(1600);
+    await expect(shimmerTiming.iterations).toBe(Number.POSITIVE_INFINITY);
+    await expect(shimmerTiming.delay).toBe(0);
+    const width = shimmer.getBoundingClientRect().width;
+    const shift = () => new DOMMatrix(getComputedStyle(shimmer, '::after').transform).m41;
+    seek(shimmerAnimation!, 0);
+    await expect(shift()).toBeCloseTo(-width, 0);
+    // Linear: a quarter of the way in, a quarter of the way across.
+    seek(shimmerAnimation!, 400);
+    await expect(shift()).toBeCloseTo(-width / 2, 0);
+    seek(shimmerAnimation!, 800);
+    await expect(shift()).toBeCloseTo(0, 0);
+    // The light is the token, in a gradient that is clear at both ends.
+    const light = getComputedStyle(shimmer, '::after').backgroundImage;
+    await expect(light).toContain('linear-gradient(90deg');
+    await expect(light).toContain('rgba(255, 255, 255');
+
+    // `glass`: the fill breathes to the accent at 20% over its own colour at the middle of 2s. The
+    // two colours are what a probe painted with the same `color-mix` computes to.
+    const glass = blockOf(canvasElement, 'glass');
+    const [glassAnimation, ...glassOthers] = animationsOf(glass);
+    await expect(glassOthers).toHaveLength(0);
+    const glassTiming = (glassAnimation!.effect as KeyframeEffect).getTiming();
+    await expect(glassTiming.duration).toBe(2000);
+    await expect(glassTiming.iterations).toBe(Number.POSITIVE_INFINITY);
+    await expect(glassTiming.delay).toBe(0);
+    await expect((glassAnimation!.effect as KeyframeEffect).getKeyframes()[0]!.easing).toBe(
+      'ease-in-out',
+    );
+    // The browsers write an animated colour in their own colour space ("oklab(...)", "color(srgb
+    // ...)"), so the colours are compared as the four channels they paint, within a step or two.
+    const channels = (color: string) => {
+      const context = document
+        .createElement('canvas')
+        .getContext('2d', { willReadFrequently: true })!;
+      context.clearRect(0, 0, 1, 1);
+      context.fillStyle = color;
+      context.fillRect(0, 0, 1, 1);
+      return Array.from(context.getImageData(0, 0, 1, 1).data);
+    };
+    const probe = (color: string) => {
+      const element = document.createElement('span');
+      element.style.backgroundColor = color;
+      glass.after(element);
+      const computed = getComputedStyle(element).backgroundColor;
+      element.remove();
+      return channels(computed);
+    };
+    const rest = probe('var(--flg-control-bg-secondary)');
+    const peak = probe(
+      'color-mix(in srgb, var(--flg-accent-solid) 20%, var(--flg-control-bg-secondary))',
+    );
+    await expect(peak).not.toEqual(rest);
+    const near = (actual: number[], expected: number[]) =>
+      actual.forEach((channel, index) => expect(channel).toBeCloseTo(expected[index]!, -0.5));
+    seek(glassAnimation!, 0);
+    near(channels(getComputedStyle(glass).backgroundColor), rest);
+    seek(glassAnimation!, 1000);
+    near(channels(getComputedStyle(glass).backgroundColor), peak);
+  },
+};
+
+/**
+ * With reduced motion nothing moves: no animation runs on any look, and the light of `shimmer` is
+ * gone. The preference is emulated through the protocol, which only Chromium has, and the
+ * reduced-motion screenshots are taken in Chromium too: Firefox and WebKit have no automated check of
+ * this rule.
+ */
+export const ReducedMotion: Story = {
+  tags: ['no-visual'],
+  render: () => <Blocks />,
+  play: async ({ canvasElement }) => {
+    const { cdp, server } = await import('vitest/browser');
+    if (server.browser !== 'chromium') return;
+    const session = cdp();
+    const blocks = ['pulse', 'shimmer', 'glass'].map((look) => blockOf(canvasElement, look));
+    for (const block of blocks) await expect(animationsOf(block)).toHaveLength(1);
+    await session.send('Emulation.setEmulatedMedia', {
+      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
+    });
+    try {
+      for (const block of blocks) await waitFor(() => expect(animationsOf(block)).toHaveLength(0));
+      await expect(getComputedStyle(blocks[0]!).opacity).toBe('1');
+      await expect(getComputedStyle(blocks[1]!, '::after').display).toBe('none');
+    } finally {
+      await session.send('Emulation.setEmulatedMedia', { features: [] });
+    }
+  },
+};
+
+/**
+ * A `text` Skeleton takes the room of one line of the text it stands for (spec §4.3): two of them
+ * one under the other are as high as two lines of that text, in the line height of the place, and
+ * a `SkeletonText` of two lines is the same. The margins of two blocks would collapse into one,
+ * which is why the shape is an inline-block.
+ */
+export const TextLines: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ width: 240, fontSize: 14, lineHeight: '21px' }}>
+      <div data-box="stacked">
+        <Skeleton shape="text" />
+        <Skeleton shape="text" />
+      </div>
+      <div data-box="lines">
+        <SkeletonText lines={2} />
+      </div>
+      <div data-box="sentence">
+        <Skeleton shape="text" width="40%" />
+      </div>
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const height = (box: string) =>
+      canvasElement.querySelector<HTMLElement>(`[data-box="${box}"]`)!.getBoundingClientRect()
+        .height;
+    await expect(height('stacked')).toBeCloseTo(42, 1);
+    await expect(height('lines')).toBeCloseTo(42, 1);
+    await expect(height('sentence')).toBeCloseTo(21, 1);
+    const bar = canvasElement.querySelector<HTMLElement>('[data-box="sentence"] > .flg-skeleton')!;
+    // 70% of 14px, in the middle of the 21px line.
+    await expect(bar.getBoundingClientRect().height).toBeCloseTo(9.8, 1);
+  },
+};
diff --git a/src/components/skeleton/Skeleton.test-d.ts b/src/components/skeleton/Skeleton.test-d.ts
new file mode 100644
index 0000000..aace4cb
--- /dev/null
+++ b/src/components/skeleton/Skeleton.test-d.ts
@@ -0,0 +1,35 @@
+import { expectTypeOf, test } from 'vitest';
+import type { SkeletonProps, SkeletonTextProps } from './Skeleton';
+
+test('a Skeleton takes only the documented variants and shapes', () => {
+  expectTypeOf<SkeletonProps['variant']>().toEqualTypeOf<
+    'pulse' | 'shimmer' | 'glass' | undefined
+  >();
+  expectTypeOf<SkeletonTextProps['variant']>().toEqualTypeOf<SkeletonProps['variant']>();
+  expectTypeOf<SkeletonProps['shape']>().toEqualTypeOf<'rect' | 'circle' | 'text' | undefined>();
+  // @ts-expect-error an unknown variant
+  const unknownVariant: SkeletonProps = { variant: 'wave' };
+  // @ts-expect-error the variant of another component
+  const otherVariant: SkeletonProps = { variant: 'stripe' };
+  // @ts-expect-error an unknown shape
+  const unknownShape: SkeletonProps = { shape: 'square' };
+  expectTypeOf(unknownVariant).toBeObject();
+  expectTypeOf(otherVariant).toBeObject();
+  expectTypeOf(unknownShape).toBeObject();
+});
+
+test('the sizes are numbers or CSS strings', () => {
+  expectTypeOf<SkeletonProps['width']>().toEqualTypeOf<number | string | undefined>();
+  expectTypeOf<SkeletonProps['height']>().toEqualTypeOf<number | string | undefined>();
+  expectTypeOf<SkeletonProps['size']>().toEqualTypeOf<number | string | undefined>();
+  expectTypeOf<SkeletonTextProps['lines']>().toEqualTypeOf<number | undefined>();
+});
+
+test('a Skeleton is empty: it takes no children', () => {
+  // @ts-expect-error the block is drawn by the component
+  const children: SkeletonProps = { children: 'x' };
+  // @ts-expect-error the lines are drawn by the component
+  const textChildren: SkeletonTextProps = { children: 'x' };
+  expectTypeOf(children).toBeObject();
+  expectTypeOf(textChildren).toBeObject();
+});
diff --git a/src/components/skeleton/Skeleton.test.tsx b/src/components/skeleton/Skeleton.test.tsx
new file mode 100644
index 0000000..7c481f1
--- /dev/null
+++ b/src/components/skeleton/Skeleton.test.tsx
@@ -0,0 +1,133 @@
+import { render } from '@testing-library/react';
+import { createRef } from 'react';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import { Skeleton, SkeletonText } from './Skeleton';
+
+const block = (container: HTMLElement) => container.firstElementChild as HTMLElement;
+
+describe('Skeleton', () => {
+  beforeEach(() => resetDevWarnings());
+  afterEach(() => vi.restoreAllMocks());
+
+  it('is a hidden pulse rect span by default', () => {
+    const ref = createRef<HTMLSpanElement>();
+    const { container } = render(<Skeleton ref={ref} />);
+    const skeleton = block(container);
+    expect(skeleton.tagName).toBe('SPAN');
+    expect(skeleton).toBe(ref.current);
+    expect(skeleton).toHaveClass('flg-skeleton');
+    expect(skeleton).toHaveAttribute('data-variant', 'pulse');
+    expect(skeleton).toHaveAttribute('data-shape', 'rect');
+    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
+    expect(skeleton).toBeEmptyDOMElement();
+  });
+
+  it.each(['pulse', 'shimmer', 'glass'] as const)('reflects variant %s', (variant) => {
+    const { container } = render(<Skeleton variant={variant} />);
+    expect(block(container)).toHaveAttribute('data-variant', variant);
+  });
+
+  it.each(['rect', 'circle', 'text'] as const)('reflects shape %s', (shape) => {
+    const { container } = render(<Skeleton shape={shape} />);
+    expect(block(container)).toHaveAttribute('data-shape', shape);
+  });
+
+  it('is always hidden from assistive technology, whatever the caller passes', () => {
+    const { container } = render(<Skeleton aria-hidden={false} />);
+    expect(block(container)).toHaveAttribute('aria-hidden', 'true');
+  });
+
+  it('turns a number into px and keeps a string as the CSS value it is', () => {
+    const { container } = render(<Skeleton width={120} height="2rem" />);
+    expect(block(container).style.width).toBe('120px');
+    expect(block(container).style.height).toBe('2rem');
+  });
+
+  it('is 40px square as a circle, and takes `size` for both sides', () => {
+    const { container, rerender } = render(<Skeleton shape="circle" />);
+    expect(block(container).style.width).toBe('40px');
+    expect(block(container).style.height).toBe('40px');
+    rerender(<Skeleton shape="circle" size={32} />);
+    expect(block(container).style.width).toBe('32px');
+    expect(block(container).style.height).toBe('32px');
+    rerender(<Skeleton shape="circle" size="2em" />);
+    expect(block(container).style.width).toBe('2em');
+    expect(block(container).style.height).toBe('2em');
+  });
+
+  it('lets `style` win over the size props', () => {
+    const { container } = render(<Skeleton width={120} style={{ width: 50 }} />);
+    expect(block(container).style.width).toBe('50px');
+  });
+
+  it('ignores `size` off a circle, and says so in development', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    const { container } = render(<Skeleton size={32} />);
+    expect(block(container).style.width).toBe('');
+    expect(block(container).style.height).toBe('');
+    expect(warn).toHaveBeenCalledWith(expect.stringContaining('`size` only applies to a circle'));
+  });
+
+  it('passes className and other attributes on to the span', () => {
+    const { container } = render(<Skeleton className="mine" id="a" />);
+    expect(block(container)).toHaveClass('flg-skeleton', 'mine');
+    expect(block(container)).toHaveAttribute('id', 'a');
+  });
+});
+
+describe('SkeletonText', () => {
+  beforeEach(() => resetDevWarnings());
+  afterEach(() => vi.restoreAllMocks());
+
+  const lines = (container: HTMLElement) =>
+    Array.from(container.querySelectorAll<HTMLElement>('.flg-skeleton'));
+
+  it('is three hidden text lines by default, the last one short', () => {
+    const ref = createRef<HTMLSpanElement>();
+    const { container } = render(<SkeletonText ref={ref} />);
+    const root = block(container);
+    expect(root).toBe(ref.current);
+    expect(root).toHaveClass('flg-skeleton-text');
+    expect(root).toHaveAttribute('data-variant', 'pulse');
+    expect(root).toHaveAttribute('aria-hidden', 'true');
+    const rows = lines(container);
+    expect(rows).toHaveLength(3);
+    for (const row of rows) {
+      expect(row).toHaveAttribute('data-shape', 'text');
+      expect(row).toHaveAttribute('data-variant', 'pulse');
+    }
+    expect(rows[0]!.style.width).toBe('');
+    expect(rows[1]!.style.width).toBe('');
+    expect(rows[2]!.style.width).toBe('64%');
+  });
+
+  it('leaves a single line at full width', () => {
+    const { container } = render(<SkeletonText lines={1} />);
+    expect(lines(container)).toHaveLength(1);
+    expect(lines(container)[0]!.style.width).toBe('');
+  });
+
+  it('gives every line the variant', () => {
+    const { container } = render(<SkeletonText variant="glass" lines={2} />);
+    expect(block(container)).toHaveAttribute('data-variant', 'glass');
+    for (const row of lines(container)) expect(row).toHaveAttribute('data-variant', 'glass');
+  });
+
+  it('is hidden whatever the caller passes', () => {
+    const { container } = render(<SkeletonText aria-hidden={false} />);
+    expect(block(container)).toHaveAttribute('aria-hidden', 'true');
+  });
+
+  it.each([0, -2, 2.5, Number.NaN, Number.POSITIVE_INFINITY])(
+    'uses one line for `lines` %s, and says so in development',
+    (count) => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const { container } = render(<SkeletonText lines={count} />);
+      expect(lines(container)).toHaveLength(1);
+      expect(warn).toHaveBeenCalledWith(
+        expect.stringContaining('`lines` must be a positive integer'),
+      );
+    },
+  );
+});
diff --git a/src/index.test.ts b/src/index.test.ts
index 2ac3f9a..c6a6833 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -84,6 +84,8 @@ describe('public API', () => {
       'SelectGroup',
       'SelectItem',
       'SelectSeparator',
+      'Skeleton',
+      'SkeletonText',
       'Slider',
       'Spinner',
       'Surface',
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 --project scripts src/components/skeleton src/index.test.ts scripts/lib/theme-css.test.ts
```

Expected: FAIL.
- `Skeleton.test.tsx` không nạp được ở cả hai project React, nên 22 test không chạy: `Failed to resolve import "./Skeleton" from "src/components/skeleton/Skeleton.test.tsx". Does the file exist?`.
- `Skeleton.test-d.ts` báo lỗi kiểu vì module chưa có.
- `theme values > keeps every light mockup token exactly as approved`: `skeleton-shine: expected undefined to be 'rgba(255,255,255,.75)'`; bản `dark`: `expected undefined to be 'rgba(255,255,255,.12)'`.
- `public API > exports exactly the documented components and nothing internal`: danh sách export chưa có `Skeleton`, `SkeletonText`. Bản nháp không thấy lỗi này (phát hiện 11).

- [ ] **Step 3: Viết code**

````diff
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 9a9674a..a75b07b 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -138,6 +138,8 @@ const SHIPPED_CLASSES = [
   'flg-progress-line',
   'flg-progress-track',
   'flg-progress-fill',
+  'flg-skeleton',
+  'flg-skeleton-text',
 ];
 
 const requirements: Array<[string, boolean]> = [
diff --git a/scripts/rsc-probe.mjs b/scripts/rsc-probe.mjs
index 8634804..98e17c8 100644
--- a/scripts/rsc-probe.mjs
+++ b/scripts/rsc-probe.mjs
@@ -166,6 +166,20 @@ const CASES = [
     element: (C) => createElement(C, null, 'x'),
     expect: { type: 'div', className: 'flg-alert-actions' },
   },
+  ...['rect', 'circle', 'text'].map((shape) => ({
+    label: `Skeleton ${shape}`,
+    file: '../dist/components/skeleton/Skeleton.js',
+    exportName: 'Skeleton',
+    element: (C) => createElement(C, { shape, variant: 'shimmer' }),
+    expect: { type: 'span', className: 'flg-skeleton' },
+  })),
+  {
+    label: 'SkeletonText',
+    file: '../dist/components/skeleton/Skeleton.js',
+    exportName: 'SkeletonText',
+    element: (C) => createElement(C, { lines: 2 }),
+    expect: { type: 'span', className: 'flg-skeleton-text' },
+  },
 ];
 
 let failed = 0;
diff --git a/src/components/skeleton/Skeleton.mdx b/src/components/skeleton/Skeleton.mdx
new file mode 100644
index 0000000..a94bd12
--- /dev/null
+++ b/src/components/skeleton/Skeleton.mdx
@@ -0,0 +1,117 @@
+import { Canvas, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './Skeleton.stories';
+
+<Meta of={Stories} />
+
+# Skeleton
+
+A grey block that stands where content is still loading, so the page keeps its shape while the data
+arrives. `Skeleton` is one block; `SkeletonText` is a few lines of text. Both are plain `span`s with
+no client code, so they work in a React Server Component and in a Suspense `fallback`.
+
+```tsx
+import { Skeleton, SkeletonText } from 'h2d-glass-ui';
+
+<Skeleton shape="circle" size={40} />
+<SkeletonText lines={3} />
+```
+
+<Canvas of={Stories.Pulse} />
+
+## Props
+
+### Skeleton
+
+| Prop      | Type                              | Default   | Does                                                        |
+| --------- | --------------------------------- | --------- | ----------------------------------------------------------- |
+| `shape`   | `'rect' \| 'circle' \| 'text'`    | `'rect'`  | The form of the block (see Shapes)                          |
+| `variant` | `'pulse' \| 'shimmer' \| 'glass'` | `'pulse'` | The look (see Variants)                                     |
+| `width`   | `number \| string`                | see below | A number is px, a string is a CSS value                     |
+| `height`  | `number \| string`                | see below | A number is px, a string is a CSS value                     |
+| `size`    | `number \| string`                | `40`      | The width and height of a `circle`; ignored on other shapes |
+
+### SkeletonText
+
+| Prop      | Type                              | Default   | Does                                                                      |
+| --------- | --------------------------------- | --------- | ------------------------------------------------------------------------- |
+| `lines`   | `number`                          | `3`       | How many lines; a number that is not a positive whole number is read as 1 |
+| `variant` | `'pulse' \| 'shimmer' \| 'glass'` | `'pulse'` | The look of every line                                                    |
+
+`ref`, `className`, `style` and the other attributes of a `span` go to the block. `width`, `height`
+and `size` become `style`, and a `style` of your own wins over them; or set the size with a
+`className`. A Skeleton takes no children.
+
+## Shapes
+
+- `rect` is as wide as its container and one line high (`1lh`), so it is never flat; give it a
+  `height` for an image or a card.
+- `circle` is `size` wide and high, 40px by default, the size of a large Avatar. Set it to the size
+  of the Avatar it stands for.
+- `text` is a bar 70% as tall as the text, in the middle of a line of that text. A line of Skeleton
+  takes the room of one line of the text in the place it sits, so put it where the text will be and
+  it takes that font size and line height; the layout does not move when the text arrives.
+
+`SkeletonText` stacks `text` lines with nothing between them. With more than one line, the last is
+64% wide, as the end of a paragraph is.
+
+## Variants
+
+- `variant="pulse"` (default): a solid block that fades to 40% and back every 1.6 seconds. Quiet,
+  and the cheapest to draw.
+- `variant="shimmer"`: a light that sweeps from left to right over each block every 1.6 seconds. The
+  clearest sign that something is loading. The light is `--flg-skeleton-shine`: white at 75% on
+  light glass, and a faint 12% on dark glass.
+- `variant="glass"`: the glass of the library with a 1px edge like an input; the fill breathes toward
+  the accent colour every 2 seconds. It suits the library best, but at its palest in a light theme
+  the block is told apart by its edge alone, so it is less clear than a solid block. It repaints its
+  background at each frame, so many of them cost more than the other two looks.
+
+<Canvas of={Stories.Shimmer} />
+<Canvas of={Stories.Glass} />
+
+There is no setting for the whole app: each block takes its own `variant`. To fix it in one place,
+wrap `Skeleton` in a component of your own.
+
+```tsx
+import { Skeleton } from 'h2d-glass-ui';
+import type { SkeletonProps } from 'h2d-glass-ui';
+
+export const AppSkeleton = (props: Omit<SkeletonProps, 'variant'>) => (
+  <Skeleton variant="shimmer" {...props} />
+);
+```
+
+## Loading and screen readers
+
+A Skeleton is always `aria-hidden="true"`, and that cannot be changed. It does not announce that
+something is loading: with many blocks that would be many announcements. The container says it
+once. Mark it `aria-busy="true"`, and give it a `Spinner` (a `role="status"` with a hidden label) or
+a piece of hidden text:
+
+```tsx
+<section aria-busy="true">
+  <Spinner label="Loading the profile" />
+  <Skeleton shape="circle" size={40} />
+  <SkeletonText lines={2} />
+</section>
+```
+
+## Reduced motion
+
+With `prefers-reduced-motion: reduce` nothing moves. `pulse` stays at full opacity, `glass` stays on
+its own fill, and `shimmer` has no light. A repeating animation cannot be stopped by the duration
+tokens (a duration of 0ms would repeat for ever), so the library stops them with a rule of its own.
+
+## Accessibility
+
+- A Skeleton is decoration, so it has no text to measure: it is not part of the contrast checks.
+- In forced colours a block is the grey of disabled text and has no edge and no motion. Without the
+  rule the block would take the page's background colour and disappear.
+
+## Do and don't
+
+- Do put the Skeleton where the content will be, with the same size, so the page does not jump.
+- Do mark the container `aria-busy` and say once that it is loading.
+- Do use a `circle` the size of the Avatar it stands for.
+- Don't use many `glass` blocks on a slow device; use `pulse` or `shimmer`.
+- Don't put text inside a Skeleton: it takes no children and is hidden from screen readers.
diff --git a/src/components/skeleton/Skeleton.tsx b/src/components/skeleton/Skeleton.tsx
new file mode 100644
index 0000000..2c034ae
--- /dev/null
+++ b/src/components/skeleton/Skeleton.tsx
@@ -0,0 +1,101 @@
+import { clsx } from 'clsx';
+import { forwardRef } from 'react';
+import type { CSSProperties, HTMLAttributes } from 'react';
+import { devWarn } from '../../internal/warn';
+
+export type SkeletonVariant = 'pulse' | 'shimmer' | 'glass';
+export type SkeletonShape = 'rect' | 'circle' | 'text';
+
+export type SkeletonProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
+  shape?: SkeletonShape;
+  variant?: SkeletonVariant;
+  /** A number is px, a string is a CSS value. A `rect` is as wide as its container by default. */
+  width?: number | string;
+  /** A number is px, a string is a CSS value. A `rect` is one line high by default. */
+  height?: number | string;
+  /** The width and height of a `circle`. Default 40, the size of a large Avatar. */
+  size?: number | string;
+};
+
+export type SkeletonTextProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
+  /** How many lines. Default 3. */
+  lines?: number;
+  variant?: SkeletonVariant;
+};
+
+/** The width of the last of several lines, the short line of the approved mockup. */
+const LAST_LINE_WIDTH = '64%';
+const CIRCLE_SIZE = 40;
+
+const px = (length: number | string) => (typeof length === 'number' ? `${length}px` : length);
+
+/**
+ * A grey block that stands where content is still loading, in one of three looks. It is always
+ * hidden from assistive technology: saying that something is loading is the job of the container
+ * (`aria-busy` and a `Spinner` or hidden text, see the docs), not of every block, which would be
+ * one announcement each. A plain `span`, so a block can sit inside a sentence or a table cell. Safe
+ * to render in React Server Components.
+ */
+export const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(
+  { shape = 'rect', variant = 'pulse', width, height, size, className, style, ...props },
+  ref,
+) {
+  if (size !== undefined && shape !== 'circle') {
+    devWarn(
+      'Skeleton: `size` only applies to a circle, so it is ignored. Use `width` and `height`.',
+    );
+  }
+  const circle = shape === 'circle';
+  const side = circle ? (size ?? CIRCLE_SIZE) : undefined;
+  const wide = width ?? side;
+  const high = height ?? side;
+  const own: CSSProperties = {
+    ...(wide === undefined ? null : { width: px(wide) }),
+    ...(high === undefined ? null : { height: px(high) }),
+    ...style,
+  };
+  return (
+    <span
+      ref={ref}
+      className={clsx('flg-skeleton', className)}
+      data-variant={variant}
+      data-shape={shape}
+      style={own}
+      {...props}
+      aria-hidden="true"
+    />
+  );
+});
+
+/**
+ * Lines of text still to come, one `text` block each. Each line is as tall as a line of the text
+ * it stands for, so the block takes the room the text will. With more than one line the last is
+ * shorter, as the end of a paragraph is.
+ */
+export const SkeletonText = forwardRef<HTMLSpanElement, SkeletonTextProps>(function SkeletonText(
+  { lines = 3, variant = 'pulse', className, ...props },
+  ref,
+) {
+  const valid = Number.isInteger(lines) && lines > 0;
+  if (!valid) devWarn(`SkeletonText: \`lines\` must be a positive integer, got ${lines}; using 1.`);
+  const count = valid ? lines : 1;
+  return (
+    <span
+      ref={ref}
+      className={clsx('flg-skeleton-text', className)}
+      data-variant={variant}
+      {...props}
+      aria-hidden="true"
+    >
+      {Array.from({ length: count }, (_, index) => (
+        <span
+          key={index}
+          className="flg-skeleton"
+          data-variant={variant}
+          data-shape="text"
+          style={count > 1 && index === count - 1 ? { width: LAST_LINE_WIDTH } : undefined}
+        />
+      ))}
+    </span>
+  );
+});
diff --git a/src/components/skeleton/index.ts b/src/components/skeleton/index.ts
new file mode 100644
index 0000000..5639f10
--- /dev/null
+++ b/src/components/skeleton/index.ts
@@ -0,0 +1,2 @@
+export { Skeleton, SkeletonText } from './Skeleton';
+export type { SkeletonProps, SkeletonShape, SkeletonTextProps, SkeletonVariant } from './Skeleton';
diff --git a/src/index.ts b/src/index.ts
index 1affb63..c5ee662 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -214,6 +214,13 @@ export type {
   ProgressStatus,
   ProgressVariant,
 } from './components/progress';
+export { Skeleton, SkeletonText } from './components/skeleton';
+export type {
+  SkeletonProps,
+  SkeletonShape,
+  SkeletonTextProps,
+  SkeletonVariant,
+} from './components/skeleton';
 export { Toaster, toast } from './components/toast';
 export type {
   ToastAction,
diff --git a/src/styles/components/skeleton.css b/src/styles/components/skeleton.css
new file mode 100644
index 0000000..dfb0238
--- /dev/null
+++ b/src/styles/components/skeleton.css
@@ -0,0 +1,92 @@
+/* Skeleton (spec phase 4 §4.3 Skeleton, mockup Sk1-Sk3): a block that stands where content is still
+   loading, in three looks. The shapes and the block come first; each variant writes only the colour
+   and the motion it adds. Motion is stopped by hand under prefers-reduced-motion, in preferences.css. */
+@layer flg.components {
+  /* A `span` that is a block, so it can sit inside a sentence or a table cell. */
+  .flg-skeleton {
+    display: block;
+    box-sizing: border-box;
+    background: var(--flg-control-track);
+  }
+  /* One line high, so a block never has no height at all. */
+  .flg-skeleton[data-shape='rect'] {
+    height: 1lh;
+    border-radius: var(--flg-radius-md);
+  }
+  /* The size is in `style`, by default 40px (the component writes it), so the HTML of a server is right. */
+  .flg-skeleton[data-shape='circle'] {
+    flex: none;
+    border-radius: 50%;
+  }
+  /* A bar as tall as 70% of the text, in the middle of a line of that text: the margin is what is
+     left of the line, so a Skeleton takes the room of one line of the text it stands for. It is an
+     inline-block and not a block because the vertical margins of two blocks one under the other
+     collapse into one, which would put two lines closer than two lines of text. Being 100% wide it
+     still takes a row of its own. */
+  .flg-skeleton[data-shape='text'] {
+    display: inline-block;
+    width: 100%;
+    height: 0.7em;
+    margin-block: calc((1lh - 0.7em) / 2);
+    border-radius: var(--flg-radius-xs);
+    vertical-align: top;
+  }
+  .flg-skeleton-text {
+    display: block;
+  }
+
+  .flg-skeleton[data-variant='pulse'] {
+    animation: flg-skeleton-pulse 1.6s ease-in-out infinite;
+  }
+  @keyframes flg-skeleton-pulse {
+    0%,
+    100% {
+      opacity: 1;
+    }
+    50% {
+      opacity: 0.4;
+    }
+  }
+
+  /* A light sweeps from the left to the right edge over each block. It moves by `transform`, which
+     the browser does not lay out or repaint again at each frame. */
+  .flg-skeleton[data-variant='shimmer'] {
+    position: relative;
+    overflow: hidden;
+  }
+  .flg-skeleton[data-variant='shimmer']::after {
+    content: '';
+    position: absolute;
+    inset: 0;
+    transform: translateX(-100%);
+    background: linear-gradient(90deg, transparent, var(--flg-skeleton-shine) 50%, transparent);
+    animation: flg-skeleton-shimmer 1.6s linear infinite;
+  }
+  @keyframes flg-skeleton-shimmer {
+    to {
+      transform: translateX(100%);
+    }
+  }
+
+  /* The glass of the library with the edge of an input; the fill breathes toward the accent. A
+     background colour is painted again at each frame, so many of these cost more than the other
+     two looks (see the docs). */
+  .flg-skeleton[data-variant='glass'] {
+    background: var(--flg-control-bg-secondary);
+    box-shadow: inset 0 0 0 1px var(--flg-control-border);
+    animation: flg-skeleton-breathe 2s ease-in-out infinite;
+  }
+  @keyframes flg-skeleton-breathe {
+    0%,
+    100% {
+      background-color: var(--flg-control-bg-secondary);
+    }
+    50% {
+      background-color: color-mix(
+        in srgb,
+        var(--flg-accent-solid) 20%,
+        var(--flg-control-bg-secondary)
+      );
+    }
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index c50ad1d..a83c9a2 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -37,5 +37,6 @@
 @import './components/toast.css';
 @import './components/alert.css';
 @import './components/progress.css';
+@import './components/skeleton.css';
 @import './components/floating.css';
 @import './preferences.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index e9ce0cf..b58afd2 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -441,6 +441,19 @@
       background: Highlight;
       box-shadow: none;
     }
+    /* A Skeleton is a block of colour and nothing else. Colour adjustment would turn its background
+       into `Canvas`, and a block of Canvas on Canvas is gone, so it opts out and takes the grey of
+       disabled text. It has no inner edge (the glass look draws one with a shadow) and no motion:
+       the sweep of `shimmer` is hidden with its animation. */
+    .flg-skeleton {
+      forced-color-adjust: none;
+      background: GrayText;
+      box-shadow: none;
+      animation: none;
+    }
+    .flg-skeleton::after {
+      display: none;
+    }
   }
   /* Repeating motion cannot be stopped by a duration of 0ms, which would repeat for ever (spec
      phase 4 §3.3), so what moves without end is stopped by hand here. Motion that happens once keeps
@@ -455,5 +468,14 @@
       animation: none;
       mask-image: repeating-linear-gradient(-45deg, #000 0 4px, transparent 4px 8px);
     }
+    /* A Skeleton stands still: `pulse` at full opacity, `glass` on its own fill, and `shimmer` with
+       no light, which is hidden rather than left at its start edge. */
+    .flg-skeleton,
+    .flg-skeleton::after {
+      animation: none;
+    }
+    .flg-skeleton::after {
+      display: none;
+    }
   }
 }
diff --git a/src/styles/theme/values.ts b/src/styles/theme/values.ts
index c21b116..77eea97 100644
--- a/src/styles/theme/values.ts
+++ b/src/styles/theme/values.ts
@@ -68,6 +68,8 @@ export const themes: Readonly<Record<ThemeName, TokenMap>> = {
     'control-border': 'rgba(31,36,51,.14)',
     'control-track': 'rgba(31,36,51,.12)',
     'control-thumb': '#ffffff',
+    // The sweep of a Skeleton `shimmer` (mockup Sk2): white at 75% on light glass.
+    'skeleton-shine': 'rgba(255,255,255,.75)',
     success: '#115934', // (outside mockup) darkened 3% to pass over the Dialog scrim (I1)
     warning: '#734200', // (outside mockup) darkened 3% to pass over the Dialog scrim (I1)
     danger: '#92222b', // (outside mockup) darkened 3% to pass over the Dialog scrim (I1)
@@ -100,6 +102,8 @@ export const themes: Readonly<Record<ThemeName, TokenMap>> = {
     'control-border': 'rgba(255,255,255,.11)',
     'control-track': 'rgba(255,255,255,.10)',
     'control-thumb': '#ffffff',
+    // A faint sweep on dark glass, 12% white (mockup Sk2).
+    'skeleton-shine': 'rgba(255,255,255,.12)',
     success: '#bbf1d7', // (outside mockup)
     warning: '#fae0ad', // (outside mockup)
     danger: '#ffdbdd', // (outside mockup)
````

Build, rồi kiểm tra gói trước khi ghi ngưỡng:

```bash
pnpm gen:theme
pnpm build
pnpm check:package
```

Expected: FAIL chỉ ở bước `size`: CSS 9.57 kB trên ngưỡng 9.31 kB; JS còn chỗ. Các bước trước đó pass, gồm `check:dist-css` (`flg-skeleton`, `flg-skeleton-text`) và `check:rsc` (`ok` cho `Skeleton rect`, `Skeleton circle`, `Skeleton text` và `SkeletonText`).

Ghi ngưỡng kích thước. Plan không chép `.size-limit.json`: `size:record` tự ghi file đó:

```bash
pnpm size:record
```

Expected: ngưỡng mới gần JS 49547 B, CSS 10530 B (trước: 47580 B, 9311 B), là kết quả ở bản nháp; ngưỡng là số đo cộng 10%. Nếu số khác một chút, giữ số do `size:record` ghi và nêu trong báo cáo.

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 --project scripts src/components/skeleton src/index.test.ts scripts/lib/theme-css.test.ts
pnpm vitest run --project storybook-light --project storybook-dark src/components/skeleton
pnpm build && pnpm check:package
```

Expected:
- Unit: 5 file, 65 test PASS, không lỗi kiểu (`Skeleton.test.tsx` 22 ở mỗi project React, `Skeleton.test-d.ts` 3, `index.test.ts` 1, `theme-css.test.ts` 17).
- Story Skeleton: 36 test PASS (6 story × ba engine × hai theme). `AnimationFrames` và `TextLines` đo như phát hiện 9. `ReducedMotion` chỉ kiểm ở Chromium.
- `check:package`: PASS với ngưỡng mới. Theo lần chạy nháp: CSS 9.57 kB trên 10.53 kB.
- Skeleton không có cặp tương phản, và token mới không đổi token nào khác, nên ảnh chuẩn của component cũ giữ nguyên.

Kiểm tra cuối của cả nhánh, như bản nháp chạy ở `1e717cf` (nay là `ce899f7`, chỉ khác hai chú thích):

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
- `pnpm test:unit`: 3083 test PASS, 3 skip (158 file).
- `pnpm check:contrast`: PASS, với dòng 23 đến 29 là `known-exception`.
- `pnpm check:package`: PASS với ngưỡng của Step 3.
- `pnpm build-storybook`: PASS, nên mọi trang MDX biên dịch được. Lệnh không mở cổng nào; thư mục `storybook-static` bị git bỏ qua. Bản nháp chạy lệnh này ở Task 3, và Claude chạy lại ở đầu nhánh nháp sau Task 4 (PASS).
- Story của toast, alert, progress và skeleton đã chạy ở task của chúng. Không chạy cả bộ story một lượt; CI chạy cả bộ.

- [ ] **Step 5: Commit**

```bash
git add \
  .size-limit.json \
  scripts/check-dist-css.ts \
  scripts/lib/theme-css.test.ts \
  scripts/rsc-probe.mjs \
  src/components/skeleton/Skeleton.mdx \
  src/components/skeleton/Skeleton.stories.tsx \
  src/components/skeleton/Skeleton.test-d.ts \
  src/components/skeleton/Skeleton.test.tsx \
  src/components/skeleton/Skeleton.tsx \
  src/components/skeleton/index.ts \
  src/index.test.ts \
  src/index.ts \
  src/styles/components/skeleton.css \
  src/styles/index.css \
  src/styles/preferences.css \
  src/styles/theme/values.ts
```
```bash
git commit -m "feat(skeleton): add Skeleton and SkeletonText with pulse, shimmer and glass looks" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

## Sau khi thực thi
