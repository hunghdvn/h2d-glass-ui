# h2d-glass-ui: Plan B, `Nav` và `Indicator` (giai đoạn 5, phần 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm Plan B, plan thứ hai của giai đoạn 5: điều hướng `Nav` cùng `NavSection`, `NavItem`, `NavGroup`, với hai giao diện `variant="pill"` (N1) và `variant="bar"` (N2) theo mockup đã duyệt, ở dạng mở rộng và ở rail của AppShell (tooltip, chấm số đếm, chữ cái đầu, flyout của nhóm); việc kích hoạt một `NavItem` đóng tấm trượt của AppShell; `Indicator` (B1, B3) cùng hai token `--flg-indicator-accent` và `--flg-on-status`; tuỳ chọn nội bộ `describe` của `Tooltip`; móc `data-visual-hover="tooltip"` của harness visual; các check tương phản của Nav và Indicator, dòng 35 của §4.9; trang `Indicator.mdx`, `Nav.mdx`, mục Nav và Indicator của trang Accessibility, và ngưỡng kích thước.

**Architecture:**
- **`Indicator`** (Task 1): server-safe, không hook, không `"use client"` (`src/components/indicator/Indicator.tsx`). Vỏ `span.flg-indicator` luôn được render, kể cả với `show={false}`; viên `span.flg-indicator-mark` (`data-status`, `data-dot`) đứng sau `children`, luôn `aria-hidden`, không prop nào của người dùng tới được nó (props vào vỏ). Vị trí theo `status` (B1 ở góc, B3 lệch ra ngoài), ghi đè bằng `--flg-indicator-top` và `--flg-indicator-right`.
- **Hai token** (Task 1): `indicator-accent` (light `var(--flg-accent-solid)`, dark `color-mix(in srgb, var(--flg-accent-start) 78%, #000)`, `prefers-contrast: more` `var(--flg-accent-solid)`) và `on-status` trong `src/styles/theme/values.ts`. `scripts/lib/contrast.ts` đọc `color-mix(in srgb, <màu> N%, <màu đặc>)` (trộn theo alpha như CSS), nên giá trị dark được đo từ chính token.
- **Nav ở dạng mở rộng** (Task 2): client (`src/components/nav/Nav.tsx`, `"use client"`). `Nav` gom các mục đứng liền nhau ngoài `NavSection` thành một `<ul role="list">` (qua `flattenChildren` và `partOf`); mỗi `NavSection` là `<div role="group">` có `<ul>` riêng; `NavItem` và `NavGroup` tự render `<li>` của mình. Một `NavContext` nội bộ (`variant`, `level`) cho mục biết giao diện và cho các cảnh báo biết chỗ của phần. `NavGroup` mở sẵn từ props `active` của các `NavItem` con trực tiếp (`collectChildren`), nên đúng ngay trong HTML từ server.
- **Đóng tấm trượt** (Task 2): `NavItem` ghép `closeSheet` sau `onClick` của người dùng; một click thường gọi `setOpen(false)` của context AppShell, nên focus về nút trigger (spec §3.4, Plan A chốt).
- **Context của AppShell tách đôi** (Task 2; mục M8 để lại từ Plan A): `labels` và `brand` chuyển sang `AppShellTextContext`, nên một `brand` hay `labels` viết inline không làm mọi `NavItem` render lại.
- **Rail** (Task 3): quy tắc rail của Nav nằm trong mẫu màn rộng của `scripts/lib/app-shell-css.ts` (`railRules`, mọi selector bắt đầu từ `[data-collapsed] > .flg-app-shell-sidebar .flg-nav` của đúng điểm gãy), nên HTML từ server đã là rail; forced colors của rail là một khối `@layer flg.preferences` sinh riêng (`railForcedColorsRules`). Chữ cái đầu và chấm số đếm có sẵn trong HTML; JS chỉ thêm tooltip (`TooltipRoot describe={false}`) và flyout (chính `.flg-nav-sub` nhận `popover="auto"`, qua `usePopover` và `useFloating`) sau khi hydrate. `AppShellSidebarContext` giữ rail cho Nav nằm trong thân sidebar.
- **Tooltip** (Task 3): `TooltipRoot` (export từ `tooltip/Tooltip.tsx`, không từ `tooltip/index.ts`) mang `describe`; `Tooltip` công khai chỉ chuyển các prop công khai xuống nó.
- **Harness** (Task 3): `tests/visual/stories.visual.ts` chờ một `[role='tooltip']:popover-open` trước khi chụp, khi phần tử được trỏ có `data-visual-hover="tooltip"`.
- **Docs và ngưỡng**: `Indicator.mdx` (Task 1); `Nav.mdx`, có rail nhúng bằng `StoryFrame` (iframe của story), và mục "Navigation and the Indicator" của trang Accessibility (Task 4); `pnpm size:record` một lần cho cả Plan B (Task 4).

**Tech Stack:** Như Plan A: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63, `@floating-ui/dom` 1.8.0. Plan này không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md`. Plan này làm các phần sau:
- §2 dòng B: `Indicator` và hai token (Task 1); `Nav`, `NavSection`, `NavItem`, `NavGroup` (Task 2), cả rail, tooltip và flyout (Task 3); tuỳ chọn nội bộ của `Tooltip` và móc `data-visual-hover="tooltip"` (Task 3); docs (Task 1, 4). §2 "Thay đổi ở code cũ", dòng Plan B (Task 3).
- §1: các dòng Nav và Indicator của bảng "Các điểm Claude chốt"; dòng "Tương phản: cần duyệt" (dòng 35) (Task 2); phần Tooltip của dòng "Thay đổi ở component cũ" và phần tooltip của dòng "Kiểm thử" (Task 3).
- §3.1: dòng Indicator (server-safe; bốn ca `check:rsc`) (Task 1); dòng Nav (client; `check:use-client` thêm `src/components/nav/Nav.tsx`) (Task 2).
- §3.2: dòng B và đoạn về mặc định `'accent'` (Task 1); dòng N (Task 2).
- §3.4: dòng "Đóng", phần kích hoạt một `NavItem` (Task 2).
- §3.5: dòng "NavGroup mở sẵn" (Task 2); phần rail của dòng "Màn rộng hay hẹp trong JS" (tooltip, `popover` của flyout) (Task 3).
- §3.6: dòng chevron và nhóm của Nav (Task 2); rail của Nav không có animation (Task 3).
- §3.7: các file của Plan B.
- §4.1: mockup B1, B3 (`phase-5-header.html`, chuông) (Task 1); N1, N2 (`phase-5-nav.html`: cột mở rộng ở Task 2; cột rail, tooltip và flyout ở Task 3).
- §4.2: hai token, `contrast.ts`, bảng `MOCKUP` của `theme-css.test.ts` (Task 1); nền nhuộm N2 (Task 2).
- §4.3 **Indicator** (Task 1). **Nav**: phần chung, `pill`, `bar` (Task 2); "Rail", tooltip, flyout (Task 3).
- §4.4: `indicator-count-text`, `indicator-dot` (Task 1); `nav-bar-indicator`, `nav-bar-text`, `nav-bar-icon`, dòng 35, các dòng 2, 6, 7, 8, 12, 29, 32 mở rộng (Task 2). Dòng 6 (tiêu đề flyout) và 14 (vạch N2 ở rail) mở rộng ở Task 3 (phát hiện 20).
- §4.5: Indicator (Task 1); Nav (Task 2; phần rail ở Task 3).
- §4.6: chevron của nhóm dùng `ChevronIcon` có sẵn (Task 2).
- §5: các cảnh báo của Indicator (Task 1); các cảnh báo của Nav (Task 2; cảnh báo mục cấp 1 không có icon ở Task 3); context của AppShell tách đôi (Task 2); `AppShellSidebarContext` và tuỳ chọn `describe` của Tooltip (Task 3).
- §6.1: quy ước API (`ref`, `className`, `labels`, controlled, export kiểu giá trị `NavVariant`, `IndicatorStatus`).
- §6.3: `Indicator` (Task 1); `Nav` và các phần (Task 2); "Ở rail" của `NavItem` và `NavGroup` (Task 3).
- §7: lớp 1–5 của Indicator (Task 1) và của Nav (Task 2, 3); test kiểu; kiểm tra gói; story giao diện của Plan B (`Indicator`; `Pill`, `Bar`; `PillRail`, `BarRail`); harness: móc `data-visual-hover="tooltip"` (Task 3).
- §8: `Indicator.mdx` (Task 1); `Nav.mdx` và ghi chú Nav, Indicator của trang Accessibility (Task 4).
- §9: Task 4 kết thúc bằng kiểm tra cuối của cả nhánh. Tiêu chí của §9 chỉ đủ sau Plan C.
- §10: các dòng ảnh chuẩn, CSS tăng, `NavGroup` không nhận ra con bọc, vị trí viên số của Indicator, flyout gắn `popover` sau khi mount, vòng focus của mục N2.
- §4.9 của spec 0+1 (`docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`): dòng 35, nhãn các dòng 2, 6, 7, 8, 12, 29, 32, một đoạn mới về dòng 35 và các vị trí khác của Nav, "Cả ba mươi lăm điểm" (Task 2).

Chủ dự án chọn mockup ngày 2026-11-10 ("Cả S1 và S2, cả N1 và N2, …, B1 và B3") và duyệt spec cùng ngày, kể cả dòng 35–36 của §4.9 (dòng 35 là của Plan B). Plan A đã merge (PR #37, `main` ở `8dc4eb1`).

**Đã chạy thử khi lập kế hoạch:**
- Toàn bộ code dưới đây đã chạy trên nhánh nháp `draft/phase-5-plan-b`, mỗi task một commit: bốn commit trên `8dc4eb1` (`main` sau PR #37): `2277d0b` (Task 1), `f3d715b` (Task 2), `120055a` (Task 3), `7855f42` (Task 4).
- Mỗi test viết trước đã được chạy trên code trước nó (commit cha, hay một stub của component khi module chưa có) và được thấy fail. Các test viết sau code, và cách chúng được kiểm bằng đột biến, nằm ở phát hiện 16.
- Cả bốn task do subagent Claude Sonnet viết, lần lượt từng task. Plan B không dùng opencode: việc đó không được đề xuất trong phiên này (mỗi phiên cần chủ dự án đồng ý). Claude (Opus) kiểm tra từng task.
- Claude chụp các story giao diện từ Storybook đã build và đối chiếu với mockup: `Indicator` (sáng, tối) với chuông của b1, b3; `Pill` (sáng) và `Bar` (tối) với cột mở rộng của n1, n2; `PillRail` và `BarRail` với cột rail của n1, n2 (chấm, tooltip, flyout). Tất cả khớp. Claude cũng xem trang docs đã build của Nav: bảng, hai `Canvas` và khung rail hiện đúng.
- Task 3 được trả lại một lần. Lần dò của Claude thấy vòng focus còn trên nút "Design" sau play function của story rail (mockup không vẽ vòng đó). Nguyên nhân: Claude dò trên một bản Storybook build trước khi `blur()` được thêm. Trên bản build lại, focus ở `<body>` và flyout mở; play function nay khẳng định cả hai trước khi trả về (commit của Task 3 được sửa lại thành `397b6e4`, trước là `f1379c2`).
- Mọi khối patch trong plan được lấy thẳng từ bốn commit đó (`patches/make-patches.sh` của bản nháp tách mỗi commit thành patch test và patch code).

Kết quả đo ở đầu nhánh nháp `7196936` (trước khi Claude gộp vào Task 3 và Task 4 hai sửa chỉ ở nhãn và ngắt dòng, phát hiện 20; code không đổi, đầu nhánh nay là `7855f42`), ngày 2026-11-11, do Claude chạy (`check-p5b.sh` của bản nháp):

| Lệnh | Kết quả |
|---|---|
| `pnpm test:unit` | 4120 test PASS, 4 skip (197 file; project `unit`, `unit-react18` và `scripts`) |
| Story | nav 42, indicator 15, tooltip 42, app-shell 165, docs 30, ở mỗi project (`storybook-light`, `storybook-dark`). PASS ở Chromium, Firefox và WebKit, chạy từng thư mục một và từng project một. Cả bộ story chưa chạy một lượt trên máy này; CI chạy cả bộ |
| `pnpm check:contrast` | PASS (`Contrast check passed.`). Năm check mới; một ngoại lệ mới, dòng 35 (`nav-bar-indicator`: 2.52 light, 2.03 dark) |
| `pnpm check:package` | PASS với ngưỡng mới: JS 56792 B, CSS 16869 B (đo được JS 51.63 kB, CSS 15.34 kB; ngưỡng trước 54614 B và 15486 B) |
| `pnpm gen:theme`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `npx tsc --noEmit -p .`, `pnpm check:name`, `pnpm build` | PASS |
| `pnpm build-storybook`, `pnpm check:docs-tables` | PASS (`no table built as text in 186 files`). Index đã build có đúng một trang docs cho mỗi component mới: `components-indicator--docs`, `components-nav--docs` |
| Fixtures | Không chạy: Plan B không đổi fixture (Plan C thêm trang khung vào hai fixture) |
| Visual | Chưa chạy. 40 ảnh chuẩn mới của năm story giao diện chạy lần đầu trong CI |

Các phát hiện từ lần chạy thử đã được đưa vào plan:

1. **Bốn task nháp là bốn task của plan, cùng số thứ tự** (Claude chốt cách chia, để mỗi commit review được riêng).
   - Task 1: `Indicator`, hai token, `color-mix` với màu đặc trong `contrast.ts`, hai check của Indicator, `Indicator.mdx`.
   - Task 2: `Nav`, `NavSection`, `NavItem`, `NavGroup` ở dạng mở rộng, `pill` và `bar`; đóng tấm trượt khi đi trang; context của AppShell tách đôi; ba check của Nav `bar` và dòng 35.
   - Task 3: Nav ở rail: tooltip (tuỳ chọn `describe` của Tooltip), chấm số đếm, chữ cái đầu, flyout của nhóm; quy tắc rail trong bộ sinh; móc `data-visual-hover="tooltip"`.
   - Task 4: `Nav.mdx`, ghi chú Accessibility của Nav và Indicator, ngưỡng kích thước.
   - Mỗi task thêm những story giao diện nó vẽ đúng được: `Indicator` ở Task 1; `Pill`, `Bar` ở Task 2; `PillRail`, `BarRail` ở Task 3.
2. **Indicator** (Task 1):
   - **`show={false}` giữ vỏ và chỉ bỏ viên** (spec §6.3 đã sửa). Đọc "chỉ `children`" theo chữ thì vỏ mất: bật tắt `show` sẽ mount lại phần tử bên trong và làm nó mất focus, còn `ref` và `className` không có chỗ gắn.
   - **`status` ngoài union thành `accent`** trong `data-status`, lặng lẽ (tìm bằng `find` trong danh sách, không ép kiểu). Spec không liệt kê cảnh báo nào cho nó, nên không thêm.
   - Cảnh báo chỉ khi giá trị được đọc (không với `dot`, không với `show={false}`), lời cố định: `count` không hữu hạn hay âm (không hiện), `count` không nguyên (làm tròn xuống), `max` không phải số nguyên dương (dùng 99). Gọi thẳng trong render (không hook, nên vẫn server-safe); `devWarn` in mỗi lời một lần.
   - **Chấm cũng theo `--flg-indicator-top` và `--flg-indicator-right`** (mặc định 7px, 7px): cách đọc câu "ghi đè được" mà spec nói cho viên nói chung.
   - **Story giao diện tên `Indicator` trùng tên component**, nên file story import component dưới tên `IndicatorComponent`; ví dụ trong `Indicator.mdx` dùng tên thật.
   - Viên `danger` ở góc che một phần chuông khi là "99+", đúng như mockup B1 đặt; giữ nguyên vì giao diện là ràng buộc.
3. **`contrast.ts` và hai check của Indicator** (Task 1):
   - `paintStops` đọc `color-mix(in srgb, <màu> N%, <màu | transparent>)`, trộn theo alpha (premultiplied) như CSS; trộn với `transparent` cho đúng kết quả như trước. Toán hạng thứ hai nhận cả `#rgb`, vì giá trị mockup viết `#000`.
   - `indicator-count-text` (4.5): chữ của mỗi trạng thái trên nền của nó, thấp nhất của bốn. `indicator-dot` (3): chấm (màu nền của trạng thái) đặt trên bề mặt, so với vòng `glass-tint-solid` vẽ trên cùng bề mặt; thấp nhất của bốn trạng thái (dark: `danger-fill` thấp nhất, 3.06; `accent-solid` trong mờ của dark là 3.98).
   - Số đo bằng đúng số của spec: `indicator-count-text` 4.74, 5.44, 6.28, 5.44; `indicator-dot` 4.48, 3.06, 6.07, 3.16 (light, dark, light +, dark +). Không cặp nào là ngoại lệ, nên `contrast-exceptions.ts`, bảng §4.9 và `ExceptionTable.test.tsx` không đổi ở task này.
4. **Cấu trúc của Nav** (Task 2):
   - `NavItem` render `<li>` của chính nó (ref và `className` vào link, như spec), `NavGroup` cũng vậy. Nhờ đó `Nav` và `NavSection` không bọc từng con: chúng chỉ gom các đoạn con liền nhau thành `<ul role="list">`. Phần tử không nhận ra (component bọc của người dùng) vào `<ul>` của đoạn như một mục; mỗi con được bọc trong `<Fragment key>` lấy từ `childKeys`.
   - **Một đoạn được key theo chỗ của nó giữa các khối (`list-<n>`), không theo key của mục đầu.** Bản đầu dùng key của mục đầu, và test `keeps the state of an item whose key stays when another is put before it` fail: thêm một mục ở đầu thì đoạn mount lại và nhóm đang mở đóng lại.
   - Một `NavSection` hay `NavGroup` mà người dùng tự đặt tên (`aria-label`, `aria-labelledby`) không nhận `aria-labelledby` của lib. Bản đầu thì có, và nó thắng `aria-label` của người dùng; test `keeps the role and the name the caller gives` bắt được.
   - **Một component của người dùng trả về `NavSection` bị coi là một mục** và vào `<ul>` của đoạn (`<ul><div role="group">`). Không có cảnh báo dev cho trường hợp này: context mà section đọc vẫn là của `Nav`. `Nav.mdx` (Task 4) nói `NavSection` phải là con trực tiếp, và cách viết thay (một hàm được gọi, không phải một component).
   - `badge`: số hay chuỗi khác rỗng được vẽ theo giao diện (`<Badge className="flg-nav-item-badge">` ở `pill`, `span.flg-nav-item-count` ở `bar`); nội dung khác (element) đặt nguyên vào ô cuối; `0` vẫn hiện.
   - **Trạng thái mở của `NavGroup` chỉ là lúc bắt đầu.** `useControllableState` với `defaultValue: defaultOpen ?? hasActive`, và `hasActive` tính bằng `collectChildren(children, { parts: ['nav-item'] })` (có ngay ở lần render đầu trên server, kể cả với tham chiếu lazy). `data-has-active` theo `active` trên một nhóm đã mount; trạng thái mở thì không: một trang tới sau không mở lại nhóm người dùng đã đóng. `Nav.mdx` nói điều đó.
   - **Mục rộng bằng hàng qua chuỗi `stretch` của `stepper.css`**, không `width: 100%` (spec viết `100%`; bài học từ review của chủ dự án cấm `100%` trần, và nút của nhóm không tự giãn như thẻ `<a>`). Mục con cách trái 28px bằng `margin-left`. Spec §4.3 đã sửa.
   - Nhóm chứa trang hiện tại ở N1 dùng `--flg-accent-text` cho cả nhãn và icon (spec chốt), không phải `--flg-selected-text` của mockup.
5. **Đóng tấm trượt** (Task 2):
   - `closeSheet` được ghép sau `onClick` của người dùng bằng `composeEventHandlers`. Nó bỏ qua Shift, Ctrl, Meta, Alt (`hasModifier` không có Shift, nên Shift được kiểm riêng) và gọi `setOpen(false)`, mà Plan A đã làm thành không làm gì khi tấm không hiện. Focus về nút trigger đã mở tấm (Plan A chốt).
   - Với `asChild`, `Slot` chạy `onClick` của chính phần tử con trước, nên link của router (React Router, Next), vốn gọi prop `onClick` của nó trước khi đi trang, vẫn đóng tấm; phần tử con tự gọi `preventDefault()` thì không đóng (spec: `defaultPrevented` không đóng). Nút của nhóm không bao giờ đóng tấm.
6. **Context của AppShell tách đôi** (Task 2; M8 của Plan A; spec §5 đã sửa):
   - `labels` và `brand` chuyển sang `AppShellTextContext` (`{ labels, brand }`), mà header, sidebar và trigger đọc; `AppShellContext` không còn hai khoá đó. `NavItem` chỉ đọc `AppShellContext?.setOpen`.
   - Test `inside an AppShell > does not render again when the shell renders with a new brand and new labels` được viết trên Nav thật khi `NavItem` còn đọc context cũ, và fail ở cả hai project: `expected "vi.fn()" to be called 1 times, but got 3 times`. Bản đầu đo bằng `Profiler`, nhưng React 19 không gọi `onRender` cho lần cập nhật đó; test nay dùng `asChild` với một component đếm: `Slot` clone phần tử con ở mọi lần render của mục, nên nó render đúng khi mục render.
   - `AppShell.test.tsx` thêm `hands a new brand and new words to the header, the sidebar and the trigger of a mounted shell` (test đặc tả: pass trước và sau, giữ cho context thứ hai vẫn tới các phần vẽ nó).
7. **Tương phản của Nav và §4.9** (Task 2):
   - Ba check `nav-bar-indicator` (3), `nav-bar-text` (4.5), `nav-bar-icon` (3) trên nền nhuộm `color-mix` 18% và 3% của `accent-solid` đặt trên bề mặt: vạch đo ở đầu 18% (mép trái, nơi có vạch), chữ và icon lấy số thấp hơn của hai đầu. Số bằng số của spec: 2.52, 8.24, 3.28 (light); 2.03, 5.82, 3.80 (dark); 4.65, 11.44, 4.55 (light +); 5.30, 10.17, 6.64 (dark +).
   - Lần chạy `check:contrast` đầu chỉ fail ở `nav-bar-indicator` 2.52 / 2.03: đó là dòng 35 (chủ dự án duyệt cùng spec ngày 2026-11-10), thêm vào `scripts/contrast-exceptions.ts` (hai ngoại lệ, 1.4.11), bảng §4.9 và một đoạn sau bảng của spec 0+1. `ExceptionTable.test.tsx` đếm 35 dòng.
   - Nhãn của các dòng 2, 6, 7, 8, 12, 29, 32 thêm vị trí của Nav, ở `contrast-exceptions.ts` và bảng §4.9 (cùng cặp màu nên cùng số đo). Câu trỏ của trang Accessibility thêm "Nav (row 35, and its part in rows 2, 6, 7, 8, 12, 29 and 32)".
8. **Vòng focus** (Task 2):
   - Ở `prefers-contrast: more` và forced colors (hai chế độ dùng `outline` làm dấu hiệu focus), mục `bar` vẽ `outline` vào trong (`outline-offset: -2px`), như Table `lined`. Ở forced colors, mục đang chọn `pill` có `outline` `Highlight` vẽ vào trong; khi có focus, vòng focus `CanvasText` ở bên ngoài.
   - Story `FocusRings` (vòng mặc định không bị thân sidebar cắt ở hàng đầu và hàng cuối; vòng của `bar` vẽ vào trong, đọc từ điểm ảnh) và `PillCurrentItemKeepsItsFocusRing` chỉ chạy ở Chromium (giả lập qua protocol, như story của Table). Đột biến `outline-offset: 2px` cho quy tắc `bar` thì `FocusRings` fail: `prefers-contrast, Inbox12: drawn inside: expected '2px' to be '-2px'`.
   - Trong jsdom, tên của link có số đếm là "Inbox12" (không có layout, nên không có khoảng trắng giữa các ô flex); unit test dùng `withCount` nhận cả hai cách, story `Names` kiểm "Inbox 12" ở ba engine.
9. **Rail trong CSS** (Task 3):
   - Quy tắc rail nằm trong `wideRules` của bộ sinh (`railRules(shell)`), mọi selector bắt đầu từ `.flg-app-shell[data-breakpoint='<bp>'][data-collapsed] > .flg-app-shell-sidebar .flg-nav`. `data-rail` của Plan A là để cho người dùng; CSS của lib không đọc nó. Mục của chính Nav là `.flg-nav-item:not(.flg-nav-sub .flg-nav-item)`, nên link trong flyout không bị đụng.
   - Forced colors của rail sinh bằng `railForcedColorsRules(breakpoint)` vào một khối `@layer flg.preferences` của file sinh, mỗi điểm gãy một `@media (forced-colors: active) and (min-width: N)`: rail là trạng thái ở một bề rộng, điều `preferences.css` không nói được. File sinh có chín khối `@media` (trước: sáu).
   - Hằng `VISUALLY_HIDDEN` (kỹ thuật của `flg-visually-hidden`) dùng chung cho nhãn và số đếm ở rail và cho tên brand ở rail.
   - **Đường chia thay tiêu đề mục ở rail là `::before` của `NavSection`**, không phải một phần tử `flg-divider` (spec §4.3 đã sửa): một phần tử thật sẽ đổi DOM của mọi section mà Task 2 đã chốt. Khối đầu tiên của Nav không có đường này.
   - Trong `nav.css`, các phần chỉ rail có (chữ cái đầu, chấm, tiêu đề của flyout) là `display: none` ở dạng mở rộng; chữ cái đầu lấy màu của icon. Quy tắc của flyout: `.flg-nav-sub.flg-popover` rộng 166px, padding 6px, khoảng cách 2px, có tiêu đề, không thụt và không đường dẫn; N2 padding trái 0, mục padding trái 16px, vạch của link đang chọn như mục cấp 1.
10. **Rail trong JS** (Task 3; spec §5, §6.3 đã sửa):
    - Một phần "railable" khi là phần cấp 1 trong thân sidebar (`AppShellSidebarContext`) của một AppShell `collapsible`; là rail khi thêm `collapsed && isWide`, cùng quy tắc với CSS sinh. Một Nav trong Drawer mở từ main không bao giờ là rail.
    - Tooltip luôn nằm trong cây và chỉ hiện ở rail (controlled, `open: rail && wanted`), nên phần tử link là một trước và sau khi rail tới (test: cùng node, cùng focus).
    - **Mục `disabled` không có tooltip ở rail.** Tooltip cảnh báo khi trigger không nhận được focus, nên đã cảnh báo cho mọi mục tắt ở mọi chế độ. Hệ quả: người dùng chuột không đọc được nhãn của mục tắt ở rail, và đổi `disabled` trên một mục cấp 1 đã mount nay mount lại link của nó (cây khác đi). Chủ dự án nên xem (mô tả PR).
    - Chữ cái đầu lấy trọn một ký tự qua `Intl.Segmenter` (emoji, chữ có dấu viết rời), không có thì `Array.from`. Mục cấp 1 không có icon trong sidebar thu gọn được thì cảnh báo dev; `NavGroup` có lời riêng. Các unit test `inside an AppShell` của Task 2 (mục "One", "Two" không icon) vì vậy in cảnh báo đó; chúng không kiểm nó.
11. **Flyout của nhóm** (Task 3):
    - `.flg-nav-sub` nhận `popover="auto"` và lớp `flg-surface flg-popover` chỉ ở rail. Trạng thái qua `usePopoverState`; `usePopover` với `restoreFocusTo` là nút và không có `onShown`, nên focus ở yên trên nút; `useFloating` (`right`, `start`, cách 26px, `alignOffset` −6, mũi tên); `useTriggerPress` trên nút.
    - Ở rail, `aria-expanded` của nút và `hidden` của danh sách theo flyout; ngoài rail theo `open` của nhóm, được giữ nguyên cho lúc sidebar mở rộng lại.
    - Đóng khi focus đi tới một phần tử ngoài `<li>`, khi một link không tắt trong nó được bấm, và khi rail mất (trạng thái được đặt lại bằng effect, nên không mở lại với rail sau). Lần nhấn trên padding của flyout để focus về không đâu (`relatedTarget` là `null`), điều đó không tính là rời; vì vậy cửa sổ mất focus cũng không đóng flyout (lần nhấn ra ngoài sau đó đóng).
    - Tooltip của nút nhường chỗ khi flyout mở (nó sẽ che mũi tên). `flg-nav-flyout-title` (`aria-hidden`) có trong HTML của mọi nhóm; CSS chỉ hiện nó trong flyout.
    - jsdom: `matches` giả lập phải trả lời `:popover-open`, và jsdom không biết popover đang hiện là đang hiển thị, nên unit test tìm link trong flyout với `hidden: true`.
12. **Tooltip** (Task 3; spec §5 đã sửa): `describe` là prop của `TooltipRoot`; `Tooltip` công khai chỉ chuyển `open`, `defaultOpen`, `onOpenChange`, `delay`, `children`, nên người gọi không chạm được tuỳ chọn đó, kể cả từ JavaScript thuần. `describe: false` thì `TooltipTrigger` để yên `aria-describedby`.
13. **Harness và story của rail** (Task 3):
    - Móc `data-visual-hover="tooltip"` chỉ được thử bằng tay (Playwright, cùng lệnh chờ như harness); bộ visual chạy trong container ghim của CI.
    - `PillRail`, `BarRail`: AppShell S1 thu gọn, `stage: 'page'`, 1280×720; "Calendar" mang `data-visual-hover="tooltip"`; play function mở flyout của "Design" bằng một cú bấm, `blur()`, rồi khẳng định focus ở `<body>`, flyout `:popover-open` và nút không có focus (lần trả lại Task 3, ở trên).
    - `RailFlyout` làm đứt kết nối tới trình duyệt khi cú bấm trên `href="#mobile"` đi trang trong iframe; sửa như `ClosesTheSheet`: trang giữ cú bấm sau khi lib đã thấy nó, như router của ứng dụng.
    - **WebKit (Safari) không đưa link vào thứ tự Tab:** ở đó bước Tab vào flyout bị bỏ, và bước "focus rời thì đóng" dời focus bằng script (bản Tab chạy ở Chromium và Firefox).
    - `RailTooltips` lần đầu fail `the tooltip is 20px from the item: 16 against 20`, vì tooltip trượt vào từ bên cạnh; nay đo sau `settled(tip)`.
14. **Docs** (Task 1, 4):
    - `Indicator.mdx` (Task 1) thay trang autodocs: Props, "The count is only seen" (một ví dụ đúng và một ví dụ sai), "Statuses" (vì sao `'accent'` là mặc định), "Position" (ghi đè vị trí), "Do and don't".
    - `Nav.mdx` (Task 4) thay trang autodocs: Props, Looks (hai `Canvas` của `Pill`, `Bar`), Two levels (`NavSection` phải là con trực tiếp), Groups: open at the start, The current page, and Next.js (`usePathname`, `asChild` với `Link`, đóng tấm trượt), The count, The rail, Do and don't, Accessibility.
    - **Rail trên trang docs là `StoryFrame` (iframe của story), không phải `Canvas`:** rail chỉ có khi khung rộng hơn điểm gãy, mà cột docs hẹp hơn, như `AppShell.mdx`. Trang phụ thuộc id `components-nav--pill-rail`: đổi tên story đó là hỏng khung.
    - Trang Accessibility: mục mới "Navigation and the Indicator", sau "The app shell" (tên ở rail, tên và số đếm, trang hiện tại và nhóm, Indicator chỉ để nhìn).
    - Ví dụ Next.js (`AppNavItem`) trong `Nav.mdx` không được chạy; nó dùng `NavItem asChild` như `Nav.test.tsx` kiểm. Fixture của Plan C chạy đường đó.
15. **Ngưỡng kích thước và `check:package` giữa các task:**
    - Ngưỡng ban đầu (ghi sau các sửa của PR #37): JS 54614 B, CSS 15486 B.
    - Sau Task 1: PASS (JS 49.87 kB, CSS 14.34 kB). Sau Task 2: PASS (JS 50.79 kB, CSS 14.88 kB). Sau Task 3: PASS, CSS 15.34 kB trên 15.49 kB (còn 151 B; rail thêm khoảng 0.5 kB CSS).
    - Task 4 chạy `pnpm size:record`: JS 56792 B, CSS 16869 B (số đo JS 51.63 kB, CSS 15.34 kB, cộng 10%). Việc gì thêm CSS hay JS sau Task 4 phải chạy lại `size:record`.
16. **Chỗ bước fail-first không đầy đủ**, theo các báo cáo của bản nháp:
    - Task 1: unit test của component viết trước, chạy trên một stub chỉ render vỏ với `children`: 20 trong 24 test fail; các test pass trên stub là đặc tả (stub đã giữ vỏ và không cảnh báo gì). Test của `contrast.ts` viết trước và fail trước. Test kiểu viết sau component; dòng `MOCKUP` của `theme-css.test.ts` viết sau token (đặc tả ở bản nháp; trên cây của plan chúng fail cho tới khi có token). Story viết cùng code; `Ring` được kiểm bằng đột biến.
    - Task 2: unit test viết trước, chạy trên một stub (cả bốn phần là `<div>{children}</div>`): 64 trong 67 test lúc đó fail ở một project. Test M8 viết trước khi tách context. Test của ba check tương phản và test kiểu viết sau code (đặc tả ở bản nháp; trên cây của plan, test tương phản fail cho tới khi có check). Story viết cùng code; `FocusRings` được kiểm bằng đột biến.
    - Task 3: unit test viết trước: hai test của Tooltip fail, test thứ ba là đặc tả; 24 trong 33 test rail fail, 9 test còn lại là ca vắng mặt (đặc tả). 15 test của bộ sinh viết sau CSS và được kiểm bằng đột biến. Story viết cùng code.
    - Task 4 không có test: không có hành vi mới.
    - Trên cây của plan, patch test của Task 1 và Task 2 làm file test của component mới fail vì module chưa có (`Failed to resolve import …`).
17. **Các chỗ spec được sửa khi lập Plan B** (đánh dấu "(phát hiện khi lập Plan B)" ở chỗ nêu lý do):
    - §6.3 `Indicator`, "Hiện gì" (Task 1): `show={false}` giữ vỏ.
    - §5, danh sách helper (Task 2): context của AppShell không có `labels` và `brand`; `AppShellTextContext`, và vì sao.
    - §4.3 Nav, "Mục" và "Mục con của nhóm" (Task 2): rộng bằng hàng bằng `stretch`; mục con cách trái 28px bằng `margin-left`.
    - §4.3 Nav, Rail, "Tiêu đề mục" (Task 3): đường chia là `::before` của `NavSection`; khối đầu không có; forced colors là `CanvasText`.
    - §5 (Task 3): `describe` là prop của `TooltipRoot`; `AppShellSidebarContext`; cảnh báo của `NavGroup` có lời riêng, và chỉ cảnh báo cho Nav nằm trong sidebar.
    - §6.3 `NavItem`, "Ở rail" (Task 3): trọn một ký tự; mục tắt không có tooltip; rail chỉ cho Nav trong thân sidebar của AppShell `collapsible`; chữ cái đầu và chấm có trong HTML từ server, tooltip và flyout chỉ sau khi hydrate.
    - Spec 0+1 §4.9 (Task 2): dòng 35, nhãn các dòng 2, 6, 7, 8, 12, 29, 32, đoạn mới về dòng 35 và các vị trí khác của Nav, "Cả ba mươi lăm điểm".
    - Task 4 không sửa dòng spec nào.
18. **Ảnh chuẩn của component cũ không đổi.**
    - CSS mới nằm trong `indicator.css`, `nav.css` và các quy tắc rail của file sinh, đều dưới `.flg-indicator…` hay `.flg-nav…`; quy tắc rail chỉ áp cho Nav trong sidebar của khung đang thu gọn. `preferences.css` chỉ thêm quy tắc cho `.flg-indicator-mark` và `.flg-nav…`.
    - Hai token mới chỉ là tên mới; không giá trị token nào đổi.
    - `Tooltip` công khai render đúng như trước (`describe` mặc định `true`).
    - Tách context không đổi DOM của AppShell. Story của AppShell (Plan A) dùng nav trung tính của `.storybook/app-shell-demo.tsx`, mà Plan B không đụng; `Pill` và `Bar` nằm ngoài AppShell, nên không render phần nào của rail.
    - Số story có ảnh đi từ 125 lên 130, đúng năm story của Plan B. Bản nháp không chạy so sánh pixel (ảnh chuẩn cần Docker); CI visual xác nhận.
19. **Duyệt của chủ dự án.** Không có gì chờ duyệt ngoài review PR (dòng 35 được duyệt cùng spec). Mô tả PR vẫn liệt kê:
    - các dòng spec sửa trong bản nháp (phát hiện 17);
    - mục tắt không có tooltip ở rail, và việc đổi `disabled` mount lại link của nó (phát hiện 10);
    - dòng 35 mới và các dòng 2, 6, 7, 8, 12, 14, 29, 32 mở rộng (phát hiện 20);
    - 40 ảnh chuẩn mới cần duyệt: năm story giao diện × 4 chế độ × sáng, tối, đếm từ index đã build (lệnh ở Step 4 của Task 4);
    - merge PR này không phát hành gì (Global Constraints, "Changeset").
20. **Nhãn dòng 6 và 14 của §4.9, Claude bổ sung khi duyệt plan.** Spec §4.4 mở rộng dòng 14 (`--flg-accent-solid` so với nền; dark 2.29:1) cho vạch của mục đang chọn N2 ở rail, vì ở rail vạch nằm trên kính (`left: -13px`), và dòng 6 cho tiêu đề của flyout. Bản nháp đầu thiếu hai nhãn đó; Claude thêm vào `scripts/contrast-exceptions.ts`, bảng §4.9 của spec 0+1 và câu trỏ của trang Accessibility, gộp vào commit Task 3, và ngắt lại một dòng 101 ký tự của trang Accessibility trong commit Task 4. Cùng cặp màu nên số đo không đổi.
21. **Các mục để lại** (không làm ở plan này):
    - Nhãn dài: không story hay test nào dựng nó (Review Focus 4).
    - Component trả về `NavSection`: chỉ docs nói, không có cảnh báo (phát hiện 4).
    - Kiểm tra screen reader (§7 lớp 6): tên của mục ở rail (nhãn và số), flyout, `aria-current`, chuông có `Indicator` với số trong tên.
    - Safari thật: không Tab tới link theo mặc định, nên link trong flyout được tới bằng Option+Tab; story chỉ chạy WebKit của Playwright, và bỏ bước Tab ở đó.
    - Các bước `prefers-contrast` và forced colors của story vòng focus chỉ chạy ở Chromium.
    - Móc `data-visual-hover="tooltip"` chỉ được thử bằng tay; CI là lần chạy đầu của nó.
    - Cửa sổ mất focus không đóng flyout (phát hiện 11).

**Phạm vi:**
- **Không làm ở plan này:**
  - Plan C: `SearchField`, `ThemeSwitch`, `ThemeMenuGroup`, `ThemeScript`, `UserMenu`; `SearchIcon`, `SunIcon`, `MoonIcon`, `MonitorIcon` và hướng `left` của `ArrowIcon`; `isEditable` chuyển vào `src/internal/`; `theme-store`; prop `surface` của `List`; công thức bảng thông báo (chuông trong `Indicator status="danger"`); trang "Examples/App shell" và mục "App shell" của Getting started; fixtures (nav render từ server, `NavItem asChild` với `Link`); changeset `minor` cho `0.4.0`; dòng 36 của §4.9.
  - Ngoài phạm vi của spec §2: menu ngang trên header, hộp lệnh, điều hướng sâu quá 2 cấp, sidebar phải, kéo đổi độ rộng sidebar, animation khi thu gọn rail hay khi mở nhóm, hướng phải sang trái, hệ thống i18n.
  - Các mục để lại ở phát hiện 21.
- **Ảnh chuẩn visual:**
  - Story có ảnh: `Indicator` của Indicator; `Pill`, `Bar`, `PillRail`, `BarRail` của Nav; mỗi story 8 ảnh (4 chế độ × sáng, tối): 40 ảnh mới. Không story nào gắn `reduced-motion` hay `viewport-…`.
  - `Indicator`: năm dải kính như dải header của mockup (danger 2, accent 2, chấm, "99+", bốn trạng thái).
  - `Pill`, `Bar`: Nav mở rộng trong một tấm kính 264px; harness rê chuột lên "Members" (`data-visual-hover`), play function đưa focus bàn phím lên "Calendar" bằng ba lần Tab.
  - `PillRail`, `BarRail`: `stage: 'page'`, 1280×720 (cỡ mặc định); harness rê chuột lên "Calendar" (`data-visual-hover="tooltip"`) và chờ tooltip của nó; play function mở flyout của "Design" rồi bỏ focus, nên ảnh không có vòng focus.
  - Mọi story khác của Indicator và Nav gắn `no-visual`. Index đã build có 130 story có ảnh (125 trước Plan B).
  - Story của Plan A dùng nav trung tính của story, nên Plan B không chụp lại chúng (§10).
  - Không tạo ảnh trên Windows. Ảnh chuẩn mới chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh; mọi story mới chạy lần đầu với ảnh chuẩn trong CI.
  - Ảnh của mọi component cũ phải giữ giống từng byte.

## Global Constraints

- Tên package `h2d-glass-ui`; chỉ ESM; `exports` gồm `.`, `./styles.css` và `./package.json`; `"sideEffects": ["**/*.css"]`.
- `pnpm check:name` fail khi tên cũ xuất hiện lại ngoài `docs/superpowers`. Import trong trang MDX dùng `'h2d-glass-ui'`.
- Cảnh báo dev bắt đầu bằng `[h2d-glass-ui]`: `devWarn` thêm `WARN_PREFIX` của `src/internal/warn.ts`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`). Plan này không thêm dependency.
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`.
  - Thuộc tính `popover`, `:popover-open`, `color-mix(in srgb, …)` và `Intl.Segmenter` có ở mọi trình duyệt của mốc này; chữ cái đầu vẫn lùi về `Array.from` khi không có `Intl.Segmenter`.
  - Bề rộng của mục dùng `stretch` cùng `-webkit-fill-available`, `-moz-available` và `100%` làm dự phòng, như `stepper.css`.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Giao diện và trạng thái dùng data-attribute, đặt sau props của người dùng: `data-variant` trên `<nav>` (các phần không nhận `variant`: CSS đọc nó từ gốc); `data-bottom` trên `NavSection`; `data-open`, `data-has-active` trên `NavGroup`; `data-status`, `data-dot` trên viên của Indicator. Mục đọc trạng thái từ `aria-current="page"` và `aria-disabled`; rail đọc từ `data-collapsed` trên gốc của AppShell.
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`.
  - Indicator: `src/styles/components/indicator.css`.
  - Nav: `src/styles/components/nav.css` (dạng mở rộng và flyout), và quy tắc rail trong `src/styles/generated/app-shell.css` (sinh bởi `pnpm gen:theme` từ `scripts/lib/app-shell-css.ts`; git bỏ qua; không sửa tay), gồm cả khối forced colors của rail trong `@layer flg.preferences`.
  - Các quy tắc `forced-colors` và `prefers-contrast: more` khác nằm trong `src/styles/preferences.css`. Một selector forced colors phải cụ thể ít nhất bằng selector contrast-more của cùng phần: Chromium khớp cả hai khi màu bị ép.
- Mỗi điểm gãy đúng một ranh giới: quy tắc rail và forced colors của rail chỉ dùng `min-width`, cùng số với khối màn rộng; không bao giờ một cặp 1023/1024 hay `max-width`.
- **Mockup lock.** Không giá trị token nào có sẵn trong `src/styles/theme/values.ts` đổi; Plan B chỉ thêm hai token (`indicator-accent`, `on-status`). Component cũ phải giữ ảnh giống từng byte. Nav theo đúng N1, N2; Indicator theo đúng B1, B3.
- Mọi component dùng `forwardRef`, export kiểu props của nó, và export phẳng từ `src/index.ts` (có trong `src/index.test.ts`).
  - `Nav.tsx` là client: bắt đầu bằng `"use client"` và có trong `scripts/check-use-client.ts`.
  - `Indicator.tsx` là server-safe: không `"use client"`, không hook, có bốn ca trong `scripts/rsc-probe.mjs`.
  - Class CSS mới có trong `scripts/check-dist-css.ts`.
  - `TooltipRoot` không được export từ `tooltip/index.ts` hay `src/index.ts`, và `Tooltip` công khai không nhận `describe`.
- Cặp tương phản mới nằm trong `scripts/lib/contrast.ts`. Cặp dưới ngưỡng ở theme mặc định là ngoại lệ trong `scripts/contrast-exceptions.ts`, kèm số dòng §4.9. Bảng §4.9 cùng đoạn sau nó trong spec 0+1, `src/docs/ExceptionTable.test.tsx` và câu trỏ của `src/docs/Accessibility.mdx` đi cùng nhau.
- Cảnh báo dev đi qua `devWarn`; lời cảnh báo không chứa giá trị đổi theo mỗi lần render. Lib không throw khi người dùng dùng sai. Trang docs (`*.mdx`) viết bằng tiếng Anh, dòng văn ngắt ở 100 ký tự.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm bằng tay, **không** push lên `main`. `main` được bảo vệ (chỉ nhận PR, các check phải xanh): plan kết thúc bằng một PR từ `feat/phase-5-plan-b`. Nhánh đó cắt từ `main` (`8dc4eb1`), nên PR chỉ mang các commit của Plan B và file plan.
- **Changeset:** Plan B **không** thêm changeset. Changeset `minor` cho `0.4.0` là của Plan C. Merge PR của Plan B là một push lên `main`, nên workflow "Release" (`.github/workflows/release.yml`) vẫn chạy:
  - `changesets/action@v2` không thấy changeset nào (`No changesets found. Attempting to publish any unpublished packages to npm`), nên chạy `publish-script`, tức `pnpm release` (`pnpm build && changeset publish`).
  - `changeset publish` thấy phiên bản `0.3.1` của `package.json` đã có trên npm và in `No unpublished projects to publish.`: không publish, không đẩy tag, không mở PR "Version Packages". Lượt chạy sau khi merge PR #37 (2026-11-11) đi đúng đường đó.
  - Code của Plan A và Plan B nằm trên `main` mà chưa phát hành, cho tới khi changeset của Plan C và PR "Version Packages" của nó được merge. Nếu trước đó có một changeset khác (ví dụ một bản sửa `patch`) được merge, bản phát hành đó sẽ mang theo AppShell, Nav và Indicator.
  - Claude không chạy `changeset version`, `changeset publish` hay `npm publish`.
- **Ngưỡng `size-limit`:**
  - Ngưỡng ban đầu (ghi sau các sửa của PR #37): JS 54614 B, CSS 15486 B.
  - Task 1 đến Task 3: `check:package` PASS với ngưỡng cũ; sau Task 3, CSS chỉ còn 151 B dưới ngưỡng.
  - Chỉ Task 4 chạy `pnpm size:record` và commit `.size-limit.json`. Plan không chép file này: `size:record` tự ghi ngưỡng. Kết quả ở bản nháp: JS 56792 B, CSS 16869 B.
- Trước mọi lệnh `pnpm vitest run` chạy thẳng, chạy `pnpm gen:theme`: nó ghi `src/styles/generated/theme.css` (hai token mới từ Task 1) và `src/styles/generated/app-shell.css` (rail từ Task 3), mà story cần. Lần chạy story đầu có thể fail với `Failed to import test file …` khi Vite tối ưu lại; chạy lại.
- **Không chạy cả bộ story một lượt trên máy thiếu bộ nhớ.** Chạy từng thư mục một, và từng project một (`storybook-light` rồi `storybook-dark`: chạy cả hai trong một tiến trình đã làm đứt kết nối tới trình duyệt trên máy này), như các lệnh trong plan. CI chạy cả bộ. Không chạy hai lượt story cùng lúc. Unit thì bản nháp của Plan B chạy được một lượt trên máy này (`pnpm test:unit`, 197 file).
- **Cổng 5173, 4173 và 5174 thuộc các app khác của chủ dự án**: không dùng, không tắt tiến trình đang giữ chúng. **Không chạy thẳng `pnpm test:fixtures`**: script ghim cổng 5173 và 4173. Plan B không đổi fixture nào, nên không chạy fixture. Storybook chạy tạm (nếu cần) dùng cổng khác; không để server hay tiến trình Storybook chạy sót.
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows. Ảnh chuẩn của Indicator và Nav (40 ảnh) đến từ workflow "Update visual baselines" sau khi đẩy nhánh. Không ảnh cũ nào được đổi; story của AppShell (Plan A) giữ nav trung tính của chúng.
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.

**Cách áp patch.**
- Mọi file, kể cả file mới, được đưa dưới dạng patch (`git diff`). Lưu nguyên khối patch vào một file **ngoài** repo (ví dụ `../task.patch`), giữ LF, rồi chạy `git apply ../task.patch` ở gốc repo.
- Nếu `git apply` báo lỗi thì dừng lại và báo cáo: nghĩa là cây đang khác với cây mà plan đã chạy thử.
- Task 1 đến Task 3 mỗi task có hai khối patch, test rồi code; áp theo đúng thứ tự trong plan. Khối test chứa file `*.test.ts(x)`, `*.test-d.ts`, `*.stories.tsx` và helper chỉ story dùng (`.storybook/icons.tsx`). Task 4 chỉ có khối code (docs).
- Khối code của Task 1 và Task 4 có dòng bắt đầu bằng ba dấu backtick (khối code trong `Indicator.mdx` và `Nav.mdx`), nên chúng được rào bằng bốn dấu backtick. Nội dung patch là các dòng giữa hai hàng rào, như mọi khối khác.
- Task 1, 2 và 3 cùng sửa spec giai đoạn 5 và `scripts/check-dist-css.ts`. Task 1 và 2 cùng sửa `scripts/lib/contrast.ts` và test của nó, `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`. Task 2 và 3 cùng sửa `Nav.tsx`, `Nav.stories.tsx`, `nav.css`, `AppShell.tsx`, `app-shell-context.ts`. Task 2 và 4 cùng sửa `src/docs/Accessibility.mdx`. Patch đã tính sẵn điều đó nếu áp đúng thứ tự.
- Plan này không xoá file nào. `.size-limit.json` không có trong patch nào: Task 4 ghi nó bằng `pnpm size:record`. `src/styles/generated/*.css` không có trong patch nào: `pnpm gen:theme` sinh chúng.

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý. Mỗi dòng có test ở task tương ứng, trừ chỗ ghi rõ là chưa có:

1. **Chạm một link của nav trong tấm trượt trên điện thoại.** Tấm đóng và focus về nút trigger đã mở nó. Ctrl, Meta, Shift, Alt (mở chỗ khác, tải về) hay một handler đã `preventDefault()` thì tấm vẫn mở; link của router (`asChild`) cũng đóng tấm; mục tắt và nút của nhóm không đóng; cha controlled được hỏi đúng một lần. Test ở Task 2:
   - story `ClosesTheSheet` (390px, ba engine: mỗi phím bổ trợ để tấm mở, click thường đóng và focus về "Open navigation"; trang giữ cú bấm như router của ứng dụng);
   - `inside an AppShell > closes the sheet on a plain click and gives the focus back to the trigger`, `leaves the sheet open for a click with %s` (bốn phím), `leaves the sheet open when the caller’s handler took the click (defaultPrevented)`, `closes the sheet for a router link, which calls the handler it is given before it navigates`, `leaves the sheet open for a disabled item`, `leaves the sheet open for the button of a group`, `closes a sheet that the parent owns by asking it, once`, `asks nothing of a shell whose sheet is closed`.
2. **Flyout của một nhóm ở rail: mở, rồi Esc, bấm ra ngoài, hay Tab đi chỗ khác.** Mở bằng click mà focus ở yên trên nút; Esc và bấm ra ngoài đóng và trả focus về nút; focus rời cả nút lẫn flyout thì đóng, đi giữa hai bên thì không; một link trong flyout đóng nó; mở rộng sidebar hay thu hẹp cửa sổ thì đóng, bỏ `popover`, và không mở lại khi rail trở lại. Test ở Task 3:
   - `the Nav as a rail > the flyout of a group > opens on a click of the button, and focus stays on the button`, `closes on Esc and on a press outside, which are the browser’s, and gives the focus back to the button`, `closes when focus leaves both the button and the flyout, and not while it moves between them`, `closes when a link in it is activated, and not for a link that is disabled`, `closes when the sidebar is expanded, loses its popover, and stays closed when the rail comes back`, `closes when the window narrows, where the sidebar is a sheet and never a rail`, `puts the focus on the button when the sidebar is expanded while the focus is in the flyout`;
   - story `RailFlyout` (ba engine: cách nút 26px, lùi lên 6px, rộng 166px, mũi tên; Esc trả focus về nút; bấm ra ngoài; focus rời; Tab vào các link, trừ WebKit; một link đóng nó) và `RailFlyoutAndTheExpandedSidebar` (cửa sổ hẹp lại, nút của header mở rộng sidebar, trạng thái của nhóm còn nguyên, flyout không mở lại).
   - Chỗ hở đã biết: cửa sổ mất focus không đóng flyout (phát hiện 11); Safari thật chỉ tới link bằng Option+Tab (phát hiện 13).
3. **`NavGroup` có link `active` nằm trong component riêng của ứng dụng.** Nhóm không tự mở (lib chỉ đọc `NavItem` con trực tiếp, qua Fragment, mảng và tham chiếu lazy của RSC); `defaultOpen` mở nó. `active` đổi sau khi mount thì `data-has-active` theo, trạng thái mở thì không. Test ở Task 2:
   - `NavGroup > does not see an active link inside a component of the user’s own; defaultOpen opens it`, `finds an active link through Fragments and arrays`, `finds an active link that came as a lazy reference` (chỉ React 19), `is open in the HTML from the server, where no effect has run`, `follows a change of the active link on a mounted group: it says it has the page, and keeps its state`;
   - `Nav > takes a component of the user’s own around an item for an item`.
   - Chỗ hở đã biết: một component trả về `NavSection` thành một mục, không có cảnh báo (phát hiện 4). `Nav.mdx` (Task 4) nói cả hai giới hạn.
4. **Nhãn dài, ở dạng mở rộng, ở rail và trong flyout.** `.flg-nav-item-label` có `min-width: 0` và kết thúc bằng "…" ở dạng mở rộng và trong flyout (cột 166px), mà link trong flyout không có tooltip (`the tooltip of an item > is not for the links in the list of a group: they are drawn with their labels in the flyout`); ở rail, nhãn nằm trong tooltip (rộng tối đa 240px của Tooltip). Tên của link luôn là nhãn đầy đủ. **Chưa có story hay test nào dựng một nhãn dài**: reviewer nên đọc quy tắc của `.flg-nav-item-label` và `.flg-nav-sub.flg-popover` trong `nav.css`, và thử một nhãn dài ở cả ba chỗ.
5. **Số đếm chỉ được đọc qua tên của nút.** Viên của Indicator luôn `aria-hidden`, không prop nào ghi đè được, nên con số phải nằm trong tên của nút bên trong; cú bấm trên viên tới nút. Số đếm của `NavItem` là chữ trong link ("Inbox 12"), còn chấm ở rail bị ẩn với screen reader. Test:
   - Task 1: `Indicator > structure > is only seen: the button keeps the name its caller gave it, without the number`, `Indicator > accessibility > keeps the mark aria-hidden whatever the caller passes`, story `PressThrough` (`elementFromPoint` ở tâm viên là nút); `Indicator.mdx` có một ví dụ đúng và một ví dụ sai.
   - Task 2: `NavItem > badge > is a neutral Badge in the pill look, and part of the name of the link`, `is a bare count in the bar look, with no Badge`; story `Names` ("Inbox 12", "Reports 3" ở ba engine).
   - Task 3: `the Nav as a rail > the count > is a dot of the Indicator in the link of an item that has a badge, hidden from screen readers`.
   - Chưa kiểm bằng screen reader thật (§7 lớp 6).

Các chỗ **chỉ story bắt được**: vị trí, vòng và cú bấm xuyên qua viên Indicator (`Position`, `PositionOverride`, `Ring`, `PressThrough`); danh sách con không chiếm chỗ khi nhóm đóng (`GroupToggles`); thứ tự Tab (`TabOrder`); tên thật có khoảng trắng (`Names`); vòng focus ở mép sidebar và vẽ vào trong (`FocusRings`, `PillCurrentItemKeepsItsFocusRing`, chỉ Chromium); tấm trượt đóng ở 390px (`ClosesTheSheet`); hình học của rail (`RailGeometry`: cột 68px, ô 40px cách mép 14px, icon 20px, chấm 8px cách góc 7px, đường chia 28×1); tooltip cách mục 20px và ngang hàng (`RailTooltips`); chỗ và hành vi của flyout (`RailFlyout`, `RailFlyoutAndTheExpandedSidebar`). jsdom không có layout, và popover của jsdom chỉ là giả lập.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/components/indicator/Indicator.tsx`, `index.ts` | `Indicator`, server-safe (Task 1) |
| `src/components/indicator/Indicator.test.tsx`, `Indicator.test-d.ts`, `Indicator.stories.tsx` | Unit test, test kiểu, story (Task 1) |
| `src/components/indicator/Indicator.mdx` | Trang docs (Task 1) |
| `src/styles/components/indicator.css` | Vỏ, viên số, chấm (Task 1) |
| `src/styles/theme/values.ts`, `scripts/lib/theme-css.test.ts` | Hai token (Task 1) |
| `scripts/lib/contrast.ts` (và test), `scripts/contrast-exceptions.ts` | `color-mix` với màu đặc, check của Indicator (Task 1); check của Nav `bar`, dòng 35, nhãn các dòng mở rộng (Task 2) |
| `src/components/nav/Nav.tsx`, `index.ts` | `Nav`, `NavSection`, `NavItem`, `NavGroup` (Task 2); rail, tooltip, chấm, chữ cái đầu, flyout (Task 3) |
| `src/components/nav/Nav.test.tsx`, `Nav.test-d.ts` | Unit test và test kiểu của dạng mở rộng (Task 2) |
| `src/components/nav/Nav.rail.test.tsx` | Unit test ở rail (Task 3) |
| `src/components/nav/Nav.stories.tsx` | Story (Task 2, 3) |
| `src/components/nav/Nav.mdx` | Trang docs (Task 4) |
| `src/styles/components/nav.css` | Dạng mở rộng (Task 2); phần chỉ rail có và flyout (Task 3) |
| `scripts/lib/app-shell-css.ts` (và test) | Quy tắc rail của Nav trong bộ sinh, forced colors của rail (Task 3) |
| `src/components/app-shell/app-shell-context.ts`, `AppShell.tsx`, `AppShell.test.tsx` | `AppShellTextContext` (Task 2); `AppShellSidebarContext` (Task 3) |
| `src/components/tooltip/Tooltip.tsx` (và test) | `TooltipRoot`, tuỳ chọn `describe` (Task 3) |
| `tests/visual/stories.visual.ts` | Móc `data-visual-hover="tooltip"` (Task 3) |
| `.storybook/icons.tsx` | `BellIcon` cho story (Task 1) |
| `src/index.ts`, `src/index.test.ts` | Export (Task 1, 2) |
| `src/styles/index.css`, `src/styles/preferences.css` | Import CSS; forced colors và `prefers-contrast: more` (Task 1, 2) |
| `scripts/check-dist-css.ts`, `scripts/check-use-client.ts`, `scripts/rsc-probe.mjs` | Kiểm tra gói (Task 1, 2, 3) |
| `src/docs/ExceptionTable.test.tsx`, spec 0+1 §4.9 | Dòng 35 và các dòng mở rộng (Task 2) |
| `src/docs/Accessibility.mdx` | Câu trỏ (Task 2); mục "Navigation and the Indicator" (Task 4) |
| `docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md` | Các dòng sửa khi lập Plan B (Task 1, 2, 3) |
| `.size-limit.json` | Ngưỡng mới (Task 4) |

---

### Task 1: `Indicator`, hai token và các check tương phản của nó

Spec §1 (dòng Indicator), §3.1 (dòng Indicator; bốn ca `check:rsc`), §3.2 (dòng B, đoạn về mặc định `'accent'`), §4.1 (B1, B3), §4.2 (hai token; `contrast.ts`; `theme-css.test.ts`), §4.3 **Indicator**, §4.4 (`indicator-count-text`, `indicator-dot`; vòng không đo), §4.5 **Indicator**, §5 (các cảnh báo của Indicator), §6.1, §6.3 `Indicator`, §7 lớp 1–5 cho Indicator, "Test kiểu", danh sách kiểm tra gói, §8 `Indicator.mdx`, §10 (dòng vị trí của viên số). Mockup B1, B3 (`phase-5-header.html`, chuông của header). Bắt đầu từ `main` `8dc4eb1`.
- **`Indicator`** (server-safe, `Indicator.tsx`): đúng §6.3: hiện gì và khi nào, `max` thành "99+", viên `aria-hidden` sau props của người dùng, các cảnh báo (phát hiện 2).
- **Hai token** trong `values.ts` theo §4.2 (light, dark, `contrastMore.shared`), sinh lại bằng `pnpm gen:theme`; `indicator-accent` vào bảng `MOCKUP` của `theme-css.test.ts`; `on-status` ghi "(outside mockup)".
- **`contrast.ts`** đọc `color-mix(in srgb, <màu> N%, <màu đặc>)`; hai check của §4.4 với số của spec (phát hiện 3). Không có ngoại lệ mới.
- **CSS**: `indicator.css` (vị trí theo `status`, ghi đè bằng `--flg-indicator-top`/`-right`, cả cho chấm); forced colors trong `preferences.css` (`Highlight`, `HighlightText`, vòng `Canvas`).
- **Story:** `Indicator` là story giao diện (năm dải header: danger, accent, chấm, "99+", bốn trạng thái); `Position`, `PositionOverride`, `Ring`, `PressThrough` gắn `no-visual`. `BellIcon` vào `.storybook/icons.tsx`.
- **`Indicator.mdx`** thay trang autodocs (phát hiện 14).
- Spec §6.3 được sửa (phát hiện 17). Cuối task, `check:package` PASS với ngưỡng cũ (phát hiện 15).

**Files:**
- Create: `src/components/indicator/Indicator.tsx`, `index.ts`, `Indicator.test.tsx`, `Indicator.test-d.ts`, `Indicator.stories.tsx`, `Indicator.mdx`, `src/styles/components/indicator.css`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `src/styles/theme/values.ts`, `scripts/lib/contrast.ts`, `scripts/lib/contrast.test.ts`, `scripts/lib/theme-css.test.ts`, `scripts/check-dist-css.ts`, `scripts/rsc-probe.mjs`, `.storybook/icons.tsx`, `docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md`

**Interfaces:**
- Produces trong `src/components/indicator/Indicator.tsx` (server-safe), export qua `indicator/index.ts` và `src/index.ts`:
  - `Indicator`: `forwardRef<HTMLSpanElement, IndicatorProps>`; `ref`, `className` và mọi prop vào vỏ.
  - `IndicatorStatus = 'accent' | 'danger' | 'success' | 'warning'`.
  - `IndicatorProps = HTMLAttributes<HTMLSpanElement> & { count?: number; max?: number; dot?: boolean; showZero?: boolean; show?: boolean; status?: IndicatorStatus; children: ReactNode }`. Mặc định `max` 99, `dot` `false`, `showZero` `false`, `show` `true`, `status` `'accent'`.
- DOM: `span.flg-indicator` > `children`, rồi `span.flg-indicator-mark` (`data-status`, `data-dot` khi là chấm, `aria-hidden="true"`) chứa số, `"${max}+"`, hay không gì (chấm). Không có viên khi `show={false}` hay không có gì để hiện; vỏ luôn có.
- CSS: biến cho người dùng `--flg-indicator-top`, `--flg-indicator-right` (mặc định −3px, −4px; `danger` 0, 0; chấm 7px, 7px); biến nội bộ `--flg-indicator-fill`, `--flg-indicator-text`.
- Token: `--flg-indicator-accent`, `--flg-on-status`.
- Cảnh báo dev (sau tiền tố `[h2d-glass-ui] `):
  - `Indicator: max must be a positive integer; using 99.`
  - `Indicator: count must be a finite number, 0 or more; no number is shown.`
  - `Indicator: count is not an integer; it is rounded down.`
- `scripts/lib/contrast.ts`: `CHECKS` thêm `'indicator-count-text': 4.5`, `'indicator-dot': 3`; `paintStops` nhận `color-mix(in srgb, <màu> N%, <màu | transparent | #rgb>)`.
- Danh sách kiểm tra gói: `scripts/check-dist-css.ts` thêm `flg-indicator`, `flg-indicator-mark`; `scripts/rsc-probe.mjs` thêm `Indicator with a count`, `Indicator past max`, `Indicator as a dot`, `Indicator with show false`. `Indicator.tsx` không có trong `check-use-client.ts`.
- Story: `.storybook/icons.tsx` thêm `BellIcon`. `Indicator.stories.tsx`: meta `title: 'Components/Indicator'`; story `Indicator` (giao diện), `Position`, `PositionOverride`, `Ring`, `PressThrough` (`no-visual`); component được import là `IndicatorComponent`.
- Consumes: `clsx`, `dataAttr`, `isNumber` (`internal/number.ts`), `devWarn`; trong story: `paintedPixels`, `IconButton`, `Surface`, `Avatar`, `GearIcon`.
- Task sau dùng: Task 3 vẽ chấm số đếm của rail bằng `span.flg-indicator-mark[data-dot][data-status='accent']`. Plan C: công thức bảng thông báo đặt chuông trong `Indicator status="danger"`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/.storybook/icons.tsx b/.storybook/icons.tsx
index 00404cd..af89a0d 100644
--- a/.storybook/icons.tsx
+++ b/.storybook/icons.tsx
@@ -117,3 +117,12 @@ export function TrashIcon(props: SVGProps<SVGSVGElement>) {
     </svg>
   );
 }
+
+export function BellIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...base} {...props}>
+      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
+      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
+    </svg>
+  );
+}
diff --git a/scripts/lib/contrast.test.ts b/scripts/lib/contrast.test.ts
index fd1b2fc..0c3521a 100644
--- a/scripts/lib/contrast.test.ts
+++ b/scripts/lib/contrast.test.ts
@@ -68,6 +68,27 @@ describe('color math', () => {
     expect(paintStops('linear-gradient(#000000, #ffffff)')).toHaveLength(2);
   });
 
+  it('reads a colour mixed with an opaque colour, as CSS mixes in sRGB', () => {
+    expect(paintStops('color-mix(in srgb, #5b7cff 78%, #000)')).toEqual([
+      [expect.closeTo(70.98), expect.closeTo(96.72), expect.closeTo(198.9), 1],
+    ]);
+    expect(paintStops('color-mix(in srgb, #ffffff 25%, rgb(0, 0, 100))')).toEqual([
+      [63.75, 63.75, 138.75, 1],
+    ]);
+    // Two translucent colours are weighted by their alpha (CSS mixes premultiplied), so the result
+    // is not a mix of the channels alone.
+    const [red, , , alpha] = paintStops('color-mix(in srgb, rgba(255,0,0,.5) 50%, #000000)')[0]!;
+    expect(red).toBeCloseTo(85);
+    expect(alpha).toBeCloseTo(0.75);
+  });
+
+  it('resolves the dark token of the Indicator through its var() to a colour', () => {
+    const tokens = { ...values.derivedTokens, ...values.themes.dark };
+    const [stop] = paintStops(resolveToken(tokens, 'indicator-accent'));
+    expect(stop?.[3]).toBe(1);
+    expect(stop?.[0]).toBeCloseTo(70.98);
+  });
+
   it('refuses a paint it cannot measure, so a check never passes on nothing', () => {
     expect(() => paintStops('color-mix(in oklch, #92222b 16%, transparent)')).toThrow(
       /Unsupported color-mix/,
@@ -194,6 +215,36 @@ describe('evaluate catches regressions', () => {
   });
 });
 
+describe('the Indicator checks (spec phase 5 §4.4)', () => {
+  const INDICATOR_CHECKS = ['indicator-count-text', 'indicator-dot'] as const;
+
+  it('are the text of the number at 4.5:1 and the dot against its ring at 3:1', () => {
+    expect(CHECKS['indicator-count-text']).toBe(4.5);
+    expect(CHECKS['indicator-dot']).toBe(3);
+  });
+
+  // The numbers are the spec's, measured over every reference backdrop and border stop.
+  it.each([
+    ['light', 'default', [4.74, 4.48]],
+    ['dark', 'default', [5.44, 3.06]],
+    ['light', 'contrast-more', [6.28, 6.07]],
+    ['dark', 'contrast-more', [5.44, 3.16]],
+  ] as const)('measure %s, %s mode: %j', (theme, mode, expected) => {
+    const measured = measure(values, theme, mode);
+    expect(INDICATOR_CHECKS.map((id) => measured[id])).toEqual(expected);
+  });
+
+  it('measures every status, so a weak one cannot hide behind the others', () => {
+    const patched = {
+      ...values,
+      themes: { ...values.themes, light: { ...values.themes.light, warning: '#ffd37a' } },
+    };
+    const measured = measure(patched, 'light', 'default');
+    expect(measured['indicator-count-text']).toBeLessThan(2);
+    expect(measured['indicator-dot']).toBeLessThan(1.5);
+  });
+});
+
 describe('the Table checks (spec phase 4 §4.4)', () => {
   const TABLE_CHECKS = [
     'table-row-text',
diff --git a/scripts/lib/theme-css.test.ts b/scripts/lib/theme-css.test.ts
index a01e8df..bf7f91a 100644
--- a/scripts/lib/theme-css.test.ts
+++ b/scripts/lib/theme-css.test.ts
@@ -51,6 +51,7 @@ const MOCKUP: Record<values.ThemeName, Record<string, string>> = {
     'list-card-shadow': '0 1px 2px #0000000a, 0 6px 16px #3c5fd21f',
     'list-card-shadow-hover': '0 2px 4px #0000000f, 0 12px 26px #3c5fd238',
     'list-card-hover-bg': 'var(--flg-control-bg)',
+    'indicator-accent': 'var(--flg-accent-solid)',
     scrim: 'rgba(15,20,40,.28)',
   },
   dark: {
@@ -80,6 +81,7 @@ const MOCKUP: Record<values.ThemeName, Record<string, string>> = {
     'list-card-shadow': '0 6px 18px #00000047',
     'list-card-shadow-hover': '0 12px 28px #00000073',
     'list-card-hover-bg': 'var(--flg-control-track)',
+    'indicator-accent': 'color-mix(in srgb, var(--flg-accent-start) 78%, #000)',
     scrim: 'rgba(0,0,0,.45)',
   },
 };
diff --git a/src/components/indicator/Indicator.stories.tsx b/src/components/indicator/Indicator.stories.tsx
new file mode 100644
index 0000000..9f22538
--- /dev/null
+++ b/src/components/indicator/Indicator.stories.tsx
@@ -0,0 +1,285 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import type { CSSProperties, ReactNode } from 'react';
+import { expect } from 'storybook/test';
+import { paintedPixels } from '../../../.storybook/painted-pixel';
+import { BellIcon, GearIcon } from '../../../.storybook/icons';
+import { Avatar } from '../avatar/Avatar';
+import { IconButton } from '../icon-button/IconButton';
+import { Surface } from '../surface/Surface';
+import { Indicator as IndicatorComponent } from './Indicator';
+import type { IndicatorProps } from './Indicator';
+
+const meta = {
+  title: 'Components/Indicator',
+  component: IndicatorComponent,
+  args: { children: <BellIcon width={18} height={18} /> },
+} satisfies Meta<typeof IndicatorComponent>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+/** The bell of a header, as the mockup draws it: a ghost icon button with the mark on its corner. */
+function Bell({
+  name = 'Notifications',
+  ...props
+}: Omit<IndicatorProps, 'children'> & { name?: string }) {
+  return (
+    <IndicatorComponent {...props}>
+      <IconButton variant="ghost" aria-label={name}>
+        <BellIcon />
+      </IconButton>
+    </IndicatorComponent>
+  );
+}
+
+/**
+ * A strip like the header strip of the mockup (a glass bar, 56px high, the widgets at the end), one
+ * for each state. Several bars cannot be a whole AppShell each, so they are drawn as in the page of
+ * the mockup (spec phase 5 §7).
+ */
+function Strip({ caption, children }: { caption: string; children: ReactNode }) {
+  return (
+    <div style={{ display: 'grid', gap: 6 }}>
+      <span style={{ fontSize: 'var(--flg-text-xs)', color: 'var(--flg-text)' }}>{caption}</span>
+      <Surface
+        style={
+          {
+            display: 'flex',
+            alignItems: 'center',
+            gap: 4,
+            height: 56,
+            minWidth: 0,
+            padding: '0 10px 0 8px',
+            boxSizing: 'border-box',
+            '--flg-button-icon': '18px',
+          } as CSSProperties
+        }
+      >
+        <span style={{ flex: 1 }} />
+        {children}
+        <IconButton variant="ghost" aria-label="Settings">
+          <GearIcon />
+        </IconButton>
+        <Avatar alt="Mia Anders" fallback="MA" />
+      </Surface>
+    </div>
+  );
+}
+
+/**
+ * The two looks of the mockup on the bell (B1: a red number, `danger`; B3: an accent number,
+ * `accent`), the dot, a count past the largest number written out, and the four statuses.
+ */
+export const Indicator: Story = {
+  render: () => (
+    <div style={{ display: 'grid', gap: 14, width: 360 }}>
+      <Strip caption="Danger, 2 unread">
+        <Bell status="danger" count={2} name="Notifications, 2 unread" />
+      </Strip>
+      <Strip caption="Accent, 2 unread">
+        <Bell status="accent" count={2} name="Notifications, 2 unread" />
+      </Strip>
+      <Strip caption="Dot">
+        <Bell dot name="Notifications, some unread" />
+      </Strip>
+      <Strip caption="99+">
+        <Bell status="danger" count={120} name="Notifications, more than 99 unread" />
+      </Strip>
+      <Strip caption="Accent, danger, success, warning">
+        <Bell status="accent" count={4} name="Accent" />
+        <Bell status="danger" count={4} name="Danger" />
+        <Bell status="success" count={4} name="Success" />
+        <Bell status="warning" count={4} name="Warning" />
+      </Strip>
+    </div>
+  ),
+};
+
+const STATUSES = ['accent', 'danger', 'success', 'warning'] as const;
+
+/** Where the mark of a wrapper is, relative to the wrapper: how far its top is below the wrapper's top, and its right is outside the wrapper's right. */
+function offsets(wrapper: Element) {
+  const box = wrapper.getBoundingClientRect();
+  const mark = wrapper.querySelector('.flg-indicator-mark')!.getBoundingClientRect();
+  return {
+    top: mark.top - box.top,
+    right: mark.right - box.right,
+    width: mark.width,
+    height: mark.height,
+  };
+}
+
+/**
+ * The mark of each status is where its mockup puts it: the red number in the corner (B1), the others
+ * a little outside it (B3); the dot is the same for all. Measured in each engine, because the
+ * position is arithmetic of the engine and an absolutely placed box in an inline flex box has been
+ * different between them.
+ */
+export const Position: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ display: 'grid', gap: 24, padding: 12 }}>
+      <div style={{ display: 'flex', gap: 24 }}>
+        {STATUSES.map((status) => (
+          <Bell key={status} status={status} count={7} name={`${status} count`} />
+        ))}
+      </div>
+      <div style={{ display: 'flex', gap: 24 }}>
+        {STATUSES.map((status) => (
+          <Bell key={status} status={status} dot name={`${status} dot`} />
+        ))}
+      </div>
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const wrappers = [...canvasElement.querySelectorAll('.flg-indicator')];
+    await expect(wrappers).toHaveLength(8);
+    wrappers.forEach((wrapper, index) => {
+      const status = STATUSES[index % 4]!;
+      const dot = index >= 4;
+      const found = offsets(wrapper);
+      if (dot) {
+        expect(found.width, `${status} dot width`).toBeCloseTo(8, 0);
+        expect(found.height, `${status} dot height`).toBeCloseTo(8, 0);
+        expect(found.top, `${status} dot top`).toBeCloseTo(7, 0);
+        expect(found.right, `${status} dot right`).toBeCloseTo(-7, 0);
+      } else {
+        expect(found.height, `${status} height`).toBeCloseTo(17, 0);
+        expect(found.width, `${status} width`).toBeGreaterThanOrEqual(17);
+        // `danger` is in the corner; the others stick out by 3px above and 4px to the right.
+        expect(found.top, `${status} top`).toBeCloseTo(status === 'danger' ? 0 : -3, 0);
+        expect(found.right, `${status} right`).toBeCloseTo(status === 'danger' ? 0 : 4, 0);
+      }
+    });
+  },
+};
+
+/**
+ * `--flg-indicator-top` and `--flg-indicator-right` move the mark, from the wrapper or from any
+ * element above it, for a number and for a dot, whatever the status.
+ */
+export const PositionOverride: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div
+      style={
+        {
+          display: 'flex',
+          gap: 24,
+          padding: 16,
+          '--flg-indicator-top': '10px',
+          '--flg-indicator-right': '12px',
+        } as CSSProperties
+      }
+    >
+      <Bell status="danger" count={7} name="danger count" />
+      <Bell status="accent" count={7} name="accent count" />
+      <Bell dot name="dot" />
+      <Bell
+        status="danger"
+        count={7}
+        name="its own"
+        style={{ '--flg-indicator-top': '-2px', '--flg-indicator-right': '3px' } as CSSProperties}
+      />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const wrappers = [...canvasElement.querySelectorAll('.flg-indicator')];
+    await expect(wrappers).toHaveLength(4);
+    for (const wrapper of wrappers.slice(0, 3)) {
+      const found = offsets(wrapper);
+      await expect(found.top).toBeCloseTo(10, 0);
+      await expect(found.right).toBeCloseTo(-12, 0);
+    }
+    // The nearest value wins: the wrapper's own beats the one set above it.
+    const own = offsets(wrappers[3]!);
+    await expect(own.top).toBeCloseTo(-2, 0);
+    await expect(own.right).toBeCloseTo(-3, 0);
+  },
+};
+
+/** Parses `rgb(…)` or `rgba(…)` as the browser writes it, the first four numbers of it. */
+function channels(color: string): [number, number, number, number] {
+  const [r = 0, g = 0, b = 0, a = 1] = color.match(/[\d.]+/g)?.map(Number) ?? [];
+  return [r, g, b, a];
+}
+
+/** A colour of any opacity laid over a grey of one value, as the engine paints it. */
+function overGrey([r, g, b, a]: [number, number, number, number], grey: number) {
+  return [r, g, b].map((channel) => channel * a + grey * (1 - a));
+}
+
+const GREY = 128;
+
+/**
+ * The 2px ring of the tint of the glass around the mark is what sets it apart from the icon, so it
+ * must be painted where the mark's edge is, and not wider. A dot has no text in its middle: its
+ * middle is the colour of the fill, a pixel just outside it is the ring, and one a little further is
+ * what is behind. Read from painted pixels, since neither a hit test nor a computed style shows a
+ * shadow. The grey behind makes the ring's colour known whatever the stage is.
+ */
+export const Ring: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div
+      data-testid="ground"
+      style={{
+        width: 120,
+        height: 80,
+        display: 'grid',
+        placeItems: 'center',
+        background: `rgb(${GREY} ${GREY} ${GREY})`,
+      }}
+    >
+      {/* Nothing under the mark but the grey: an icon would be in the way of the pixels read. */}
+      <IndicatorComponent status="danger" dot>
+        <span style={{ display: 'block', width: 34, height: 34 }} />
+      </IndicatorComponent>
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const ground = canvasElement.querySelector<HTMLElement>('[data-testid="ground"]')!;
+    const mark = ground.querySelector<HTMLElement>('.flg-indicator-mark')!;
+    const markBox = mark.getBoundingClientRect();
+    const groundBox = ground.getBoundingClientRect();
+    const x = markBox.left + markBox.width / 2 - groundBox.left;
+    const y = markBox.top + markBox.height / 2 - groundBox.top;
+    // The dot is 8px wide and the ring 2px: the pixel at 4.5px from the middle is the first one of the
+    // ring (at 5.5px the curve of the edge is only part covered), and 7.5px is past it.
+    const pixels = await paintedPixels(ground, [
+      [x, y],
+      [x + 4.5, y],
+      [x + 7.5, y],
+    ]);
+    // Without a browser to take the screenshot (the Storybook UI) only the declaration is checked.
+    await expect(getComputedStyle(mark).boxShadow).toContain('2px');
+    if (!pixels) return;
+    const near = (found: readonly number[], wanted: readonly number[]) =>
+      found.forEach((channel, i) => expect(Math.abs(channel - wanted[i]!)).toBeLessThanOrEqual(4));
+    near(pixels[0]!, overGrey(channels(getComputedStyle(mark).backgroundColor), GREY));
+    near(pixels[1]!, overGrey(channels(getComputedStyle(mark).boxShadow), GREY));
+    near(pixels[2]!, [GREY, GREY, GREY]);
+  },
+};
+
+/** The mark takes no pointer: a press on it, where it overlaps the button, is a press on the button. */
+export const PressThrough: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ padding: 16 }}>
+      <Bell status="danger" count={7} />
+      <Bell status="accent" count={7} />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const marks = [...canvasElement.querySelectorAll('.flg-indicator-mark')];
+    await expect(marks).toHaveLength(2);
+    for (const mark of marks) {
+      const box = mark.getBoundingClientRect();
+      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
+      await expect(hit?.closest('button')).toBe(
+        mark.closest('.flg-indicator')!.querySelector('button'),
+      );
+    }
+  },
+};
diff --git a/src/components/indicator/Indicator.test-d.ts b/src/components/indicator/Indicator.test-d.ts
new file mode 100644
index 0000000..75324dc
--- /dev/null
+++ b/src/components/indicator/Indicator.test-d.ts
@@ -0,0 +1,32 @@
+import { expectTypeOf, test } from 'vitest';
+import type { IndicatorProps, IndicatorStatus } from './Indicator';
+
+test('an Indicator takes only the four documented statuses', () => {
+  expectTypeOf<IndicatorStatus>().toEqualTypeOf<'accent' | 'danger' | 'success' | 'warning'>();
+  expectTypeOf<IndicatorProps['status']>().toEqualTypeOf<IndicatorStatus | undefined>();
+  // @ts-expect-error an unknown status
+  const unknown: IndicatorProps = { status: 'info', children: 'x' };
+  // @ts-expect-error `error` is a status of Alert and Progress, `danger` is this one
+  const other: IndicatorProps = { status: 'error', children: 'x' };
+  expectTypeOf(unknown).toBeObject();
+  expectTypeOf(other).toBeObject();
+});
+
+test('what shows is a number or a flag, and every one may be left out', () => {
+  expectTypeOf<IndicatorProps['count']>().toEqualTypeOf<number | undefined>();
+  expectTypeOf<IndicatorProps['max']>().toEqualTypeOf<number | undefined>();
+  expectTypeOf<IndicatorProps['dot']>().toEqualTypeOf<boolean | undefined>();
+  expectTypeOf<IndicatorProps['showZero']>().toEqualTypeOf<boolean | undefined>();
+  expectTypeOf<IndicatorProps['show']>().toEqualTypeOf<boolean | undefined>();
+  const bare: IndicatorProps = { children: 'x' };
+  expectTypeOf(bare).toBeObject();
+  // @ts-expect-error the count is a number
+  const text: IndicatorProps = { count: '3', children: 'x' };
+  expectTypeOf(text).toBeObject();
+});
+
+test('an Indicator sits on something, so the children are required', () => {
+  // @ts-expect-error nothing to put the mark on
+  const empty: IndicatorProps = { count: 3 };
+  expectTypeOf(empty).toBeObject();
+});
diff --git a/src/components/indicator/Indicator.test.tsx b/src/components/indicator/Indicator.test.tsx
new file mode 100644
index 0000000..897081b
--- /dev/null
+++ b/src/components/indicator/Indicator.test.tsx
@@ -0,0 +1,325 @@
+import { render, screen } from '@testing-library/react';
+import { createRef } from 'react';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import { Indicator } from './Indicator';
+
+const mark = (container: HTMLElement) => container.querySelector('.flg-indicator-mark');
+
+describe('Indicator', () => {
+  beforeEach(() => resetDevWarnings());
+  afterEach(() => vi.restoreAllMocks());
+
+  describe('structure', () => {
+    it('wraps its child and puts an aria-hidden mark after it, as the spec draws it', () => {
+      const ref = createRef<HTMLSpanElement>();
+      const { container } = render(
+        <Indicator ref={ref} count={3} className="mine" style={{ margin: 4 }} data-testid="root">
+          <button type="button">Bell</button>
+        </Indicator>,
+      );
+      const root = container.firstElementChild as HTMLElement;
+      expect(ref.current).toBe(root);
+      expect(root.tagName).toBe('SPAN');
+      expect(root).toHaveClass('flg-indicator', 'mine');
+      expect(root).toHaveStyle({ margin: '4px' });
+      expect(root).toHaveAttribute('data-testid', 'root');
+      expect([...root.children].map((child) => child.tagName)).toEqual(['BUTTON', 'SPAN']);
+      const badge = root.lastElementChild as HTMLElement;
+      expect(badge).toHaveClass('flg-indicator-mark');
+      expect(badge).toHaveAttribute('aria-hidden', 'true');
+      expect(badge).toHaveAttribute('data-status', 'accent');
+      expect(badge).toHaveTextContent('3');
+    });
+
+    it('is only seen: the button keeps the name its caller gave it, without the number', () => {
+      render(
+        <Indicator count={3}>
+          <button type="button" aria-label="Notifications, 3 unread">
+            Bell
+          </button>
+        </Indicator>,
+      );
+      expect(screen.getByRole('button', { name: 'Notifications, 3 unread' })).toBeInTheDocument();
+      expect(screen.getByText('3')).toHaveAttribute('aria-hidden', 'true');
+    });
+  });
+
+  describe('what shows', () => {
+    it('shows the count, and nothing for none, for 0 and for a negative or lost number', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const shows = (count: number | undefined) => {
+        const { container, unmount } = render(
+          <Indicator count={count}>
+            <i />
+          </Indicator>,
+        );
+        const text = mark(container)?.textContent ?? null;
+        unmount();
+        return text;
+      };
+      expect(shows(1)).toBe('1');
+      expect(shows(42)).toBe('42');
+      expect(shows(undefined)).toBeNull();
+      expect(shows(0)).toBeNull();
+      expect(shows(-3)).toBeNull();
+      expect(shows(Number.NaN)).toBeNull();
+      expect(shows(Number.POSITIVE_INFINITY)).toBeNull();
+      expect(warn).toHaveBeenCalled();
+    });
+
+    it('shows 0 with showZero', () => {
+      const { container } = render(
+        <Indicator count={0} showZero>
+          <i />
+        </Indicator>,
+      );
+      expect(mark(container)).toHaveTextContent('0');
+    });
+
+    it('writes a count past max as max+, and a count at max in full', () => {
+      const { container, rerender } = render(
+        <Indicator count={99}>
+          <i />
+        </Indicator>,
+      );
+      expect(mark(container)?.textContent).toBe('99');
+      rerender(
+        <Indicator count={100}>
+          <i />
+        </Indicator>,
+      );
+      expect(mark(container)?.textContent).toBe('99+');
+      rerender(
+        <Indicator count={10} max={9}>
+          <i />
+        </Indicator>,
+      );
+      expect(mark(container)?.textContent).toBe('9+');
+      rerender(
+        <Indicator count={1500} max={999}>
+          <i />
+        </Indicator>,
+      );
+      expect(mark(container)?.textContent).toBe('999+');
+    });
+
+    it('writes plain digits, whatever the language of the page', () => {
+      const { container } = render(
+        <Indicator count={1234} max={9999} lang="ar">
+          <i />
+        </Indicator>,
+      );
+      expect(mark(container)?.textContent).toBe('1234');
+    });
+
+    it('shows a dot with no text, and reads no count then', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const { container } = render(
+        <Indicator dot count={Number.NaN} max={-1}>
+          <i />
+        </Indicator>,
+      );
+      const dot = mark(container);
+      expect(dot).toHaveAttribute('data-dot');
+      expect(dot).toBeEmptyDOMElement();
+      expect(dot).toHaveAttribute('aria-hidden', 'true');
+      expect(warn).not.toHaveBeenCalled();
+    });
+
+    it('shows a dot for a count of 0, which a number would not', () => {
+      const { container } = render(
+        <Indicator dot count={0}>
+          <i />
+        </Indicator>,
+      );
+      expect(mark(container)).toHaveAttribute('data-dot');
+    });
+
+    it('hides the mark with show={false}, dot or number, and keeps the child and the wrapper', () => {
+      const ref = createRef<HTMLSpanElement>();
+      const { container } = render(
+        <Indicator ref={ref} show={false} count={5} dot>
+          <button type="button">Bell</button>
+        </Indicator>,
+      );
+      expect(mark(container)).toBeNull();
+      expect(screen.getByRole('button', { name: 'Bell' })).toBeInTheDocument();
+      expect(ref.current).toHaveClass('flg-indicator');
+    });
+
+    it('keeps the child mounted, with its focus, while the mark comes and goes', () => {
+      const { rerender } = render(
+        <Indicator count={0}>
+          <button type="button">Bell</button>
+        </Indicator>,
+      );
+      const button = screen.getByRole('button');
+      button.focus();
+      rerender(
+        <Indicator count={3}>
+          <button type="button">Bell</button>
+        </Indicator>,
+      );
+      expect(screen.getByRole('button')).toBe(button);
+      expect(button).toHaveFocus();
+      rerender(
+        <Indicator count={3} show={false}>
+          <button type="button">Bell</button>
+        </Indicator>,
+      );
+      expect(screen.getByRole('button')).toBe(button);
+      expect(button).toHaveFocus();
+    });
+
+    it('rounds a count that is not whole down', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const { container, rerender } = render(
+        <Indicator count={3.9}>
+          <i />
+        </Indicator>,
+      );
+      expect(mark(container)?.textContent).toBe('3');
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('rounded down'));
+      rerender(
+        <Indicator count={0.5}>
+          <i />
+        </Indicator>,
+      );
+      expect(mark(container)).toBeNull();
+    });
+
+    it('follows a change of count on a mounted Indicator', () => {
+      const { container, rerender } = render(
+        <Indicator count={2}>
+          <i />
+        </Indicator>,
+      );
+      const root = container.firstElementChild;
+      expect(mark(container)).toHaveTextContent('2');
+      rerender(
+        <Indicator count={120}>
+          <i />
+        </Indicator>,
+      );
+      expect(mark(container)).toHaveTextContent('99+');
+      rerender(
+        <Indicator count={0}>
+          <i />
+        </Indicator>,
+      );
+      expect(mark(container)).toBeNull();
+      expect(container.firstElementChild).toBe(root);
+    });
+  });
+
+  describe('status', () => {
+    it.each(['accent', 'danger', 'success', 'warning'] as const)('reflects status %s', (status) => {
+      const { container } = render(
+        <Indicator count={1} status={status}>
+          <i />
+        </Indicator>,
+      );
+      expect(mark(container)).toHaveAttribute('data-status', status);
+    });
+
+    it('is accent by default, as the mockup of the rail draws it', () => {
+      const { container } = render(
+        <Indicator dot>
+          <i />
+        </Indicator>,
+      );
+      expect(mark(container)).toHaveAttribute('data-status', 'accent');
+    });
+
+    it('takes a status outside the union as the default, with no stray value in the DOM', () => {
+      const { container } = render(
+        <Indicator count={1} status={'info' as never}>
+          <i />
+        </Indicator>,
+      );
+      expect(mark(container)).toHaveAttribute('data-status', 'accent');
+    });
+  });
+
+  describe('accessibility', () => {
+    it('keeps the mark aria-hidden whatever the caller passes', () => {
+      const { container } = render(
+        <Indicator count={3} aria-hidden={false} role="status" aria-label="3 unread">
+          <i />
+        </Indicator>,
+      );
+      expect(mark(container)).toHaveAttribute('aria-hidden', 'true');
+      // The caller's own props go on the wrapper, as on any component.
+      expect(container.firstElementChild).toHaveAttribute('aria-label', '3 unread');
+    });
+  });
+
+  describe('warnings', () => {
+    it('warns about a max that is not a positive integer, and uses 99', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      for (const bad of [0, -5, 2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
+        resetDevWarnings();
+        warn.mockClear();
+        const { container, unmount } = render(
+          <Indicator count={120} max={bad}>
+            <i />
+          </Indicator>,
+        );
+        expect(mark(container)).toHaveTextContent('99+');
+        expect(warn).toHaveBeenCalledTimes(1);
+        expect(warn).toHaveBeenCalledWith(
+          expect.stringContaining('max must be a positive integer'),
+        );
+        unmount();
+      }
+    });
+
+    it('warns about a count that is not a finite number of 0 or more', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(
+        <Indicator count={-2}>
+          <i />
+        </Indicator>,
+      );
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('count must be a finite number'));
+    });
+
+    it('prints the same text for every value, so a changing count is not a new warning', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const { rerender } = render(
+        <Indicator count={-1}>
+          <i />
+        </Indicator>,
+      );
+      for (const count of [-2, -3, Number.NaN]) {
+        rerender(
+          <Indicator count={count}>
+            <i />
+          </Indicator>,
+        );
+      }
+      expect(warn).toHaveBeenCalledTimes(1);
+    });
+
+    it('does not warn about a count or a max that is not read, because of `show`', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(
+        <Indicator count={-1} max={0} show={false}>
+          <i />
+        </Indicator>,
+      );
+      expect(warn).not.toHaveBeenCalled();
+    });
+
+    it('does not warn for valid props', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(
+        <Indicator count={7} max={9} status="danger">
+          <i />
+        </Indicator>,
+      );
+      expect(warn).not.toHaveBeenCalled();
+    });
+  });
+});
diff --git a/src/index.test.ts b/src/index.test.ts
index e120ac4..eb37012 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -64,6 +64,7 @@ describe('public API', () => {
       'Field',
       'FileUpload',
       'IconButton',
+      'Indicator',
       'Input',
       'List',
       'ListItem',
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/indicator src/index.test.ts
pnpm vitest run --project scripts scripts/lib/contrast.test.ts scripts/lib/theme-css.test.ts
```

Expected: FAIL.
- `Indicator.test.tsx` không nạp được ở cả hai project React (`Failed to resolve import "./Indicator" from "src/components/indicator/Indicator.test.tsx". Does the file exist?`), nên không test nào của nó chạy. `Indicator.test-d.ts` báo lỗi kiểu vì module chưa có.
- `public API > exports exactly the documented components and nothing internal`: danh sách export nhận được thiếu `Indicator`.
- `contrast.test.ts`:
  - `color math > reads a colour mixed with an opaque colour, as CSS mixes in sRGB` fail với `Unsupported color-mix: color-mix(in srgb, #5b7cff 78%, #000). Only "color-mix(in srgb, <color> N%, transparent)" is measured.`
  - `color math > resolves the dark token of the Indicator through its var() to a colour` fail với `Unknown token --flg-indicator-accent`.
  - `the Indicator checks (spec phase 5 §4.4)` fail: `expected undefined to be 4.5`, và ở bốn chế độ `expected [ undefined, undefined ] to deeply equal [ 4.74, 4.48 ]` (cùng dạng cho các số còn lại).
- `theme-css.test.ts`: `theme values > keeps every light mockup token exactly as approved` và bản `dark` fail vì token chưa có (`indicator-accent: expected undefined to be …`).

Story không chạy ở bước này: `Indicator.stories.tsx` import `Indicator`, chưa có.

Theo báo cáo của bản nháp (phát hiện 16):
- Unit test của component được viết trước và chạy trên một stub chỉ render vỏ `span.flg-indicator` với `children`: 20 trong 24 test fail. Ví dụ: `structure > wraps its child and puts an aria-hidden mark after it, as the spec draws it` (`toHaveClass('flg-indicator mine')`), `what shows > shows the count, and nothing for none, for 0 and for a negative or lost number` (`expected null to be '1'`), `warnings > warns about a max that is not a positive integer, and uses 99` (`expected "warn" to be called 1 times, but got 0`). Các test pass trên stub là đặc tả của những gì stub đã làm đúng: `is only seen: the button keeps the name its caller gave it, without the number`, `hides the mark with show={false}, dot or number, and keeps the child and the wrapper`, `keeps the child mounted, with its focus, while the mark comes and goes`, và các test "không cảnh báo".
- Test của `contrast.ts` viết trước và fail đúng như trên. Hai kỳ vọng đầu của chính người viết sai (trộn trắng 25% với `rgb(0,0,100)` cho kênh xanh 138.75, không phải 175), không phải code.
- `Indicator.test-d.ts` và dòng `MOCKUP` của `theme-css.test.ts` viết sau code: ở bản nháp chúng là đặc tả (fail nếu giá trị trôi).
- Story viết cùng code. `Position` và `PositionOverride` pass ở ba engine. `Ring` bản đầu fail với `expected 10.68 to be <= 4` (lấy mẫu ở 5px ra ngoài là mép cong của vòng, bị che một phần), nay lấy ở 4.5px; đột biến `box-shadow: none` thì nó fail ở cả ba engine với `expected 'none' to contain '2px'`.

- [ ] **Step 3: Viết code**

````diff
diff --git a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
index f6a539e..a7fc2b0 100644
--- a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
+++ b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
@@ -763,7 +763,7 @@ type IndicatorProps = HTMLAttributes<HTMLSpanElement> & {
 
 - **Mặc định:** `max=99`, `dot=false`, `showZero=false`, `show=true`, `status="accent"` (có chủ ý: Indicator là phần chung và mockup Nav vẽ chấm số đếm màu nhấn; công thức chuông truyền `'danger'`; §3.2; Claude chốt; phát hiện khi đọc soát spec).
 - **Cấu trúc:** `<span class="flg-indicator">{children}<span class="flg-indicator-mark" data-status="danger" aria-hidden="true">3</span></span>`; chấm: `data-dot`, không có chữ.
-- **Hiện gì:** `show={false}` → chỉ `children`. `dot` → chấm (bỏ qua `count`). Không thì `count` > 0 (hoặc `count === 0` với `showZero`) → số; `count > max` → `"${max}+"` ("99+"). Chữ số thường, không qua `Intl` (Claude chốt: số đếm nhỏ, giống nhau ở mọi locale được hỗ trợ).
+- **Hiện gì:** `show={false}` → không có viên, chỉ còn `children` (vỏ `.flg-indicator` vẫn được render, như khi không có gì để hiện: phần tử bên trong giữ chỗ trong cây và giữ focus khi viên hiện rồi mất, và `ref`, `className` vẫn có chỗ gắn; phát hiện khi lập Plan B). `dot` → chấm (bỏ qua `count`). Không thì `count` > 0 (hoặc `count === 0` với `showZero`) → số; `count > max` → `"${max}+"` ("99+"). Chữ số thường, không qua `Intl` (Claude chốt: số đếm nhỏ, giống nhau ở mọi locale được hỗ trợ).
 - **Chỉ để nhìn:** viên luôn `aria-hidden`, đặt sau props của người dùng. Con số phải nằm trong tên của nút bên trong (`aria-label="Notifications, 3 unread"`); docs nói rõ, ví dụ làm đúng.
 
 **`SearchField`**
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 9b19f0a..7b68c4d 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -20,6 +20,8 @@ const SHIPPED_CLASSES = [
   'flg-button',
   'flg-badge',
   'flg-avatar',
+  'flg-indicator',
+  'flg-indicator-mark',
   'flg-divider',
   'flg-card',
   'flg-field',
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index 3531c9f..8898621 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -81,6 +81,8 @@ export const CHECKS = {
   'table-stripe-text-muted': 4.5,
   'table-stripe-badge': 4.5,
   'table-selected-badge': 4.5,
+  'indicator-count-text': 4.5,
+  'indicator-dot': 3,
 } as const;
 export type CheckId = keyof typeof CHECKS;
 const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
@@ -163,21 +165,38 @@ export function colorsIn(input: string): Rgba[] {
   return colors;
 }
 
+/** The second colour of a `color-mix`: any colour, `transparent`, or a `#rgb` the mockup writes. */
+function mixOperand(input: string): Rgba {
+  const value = input.trim();
+  if (value.toLowerCase() === 'transparent') return [0, 0, 0, 0];
+  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
+  if (short)
+    return parseColor(`#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`);
+  return parseColor(value);
+}
+
 /**
- * The colours a background paints: one colour, the stops of a gradient, or a colour mixed with
- * `transparent` by `color-mix(in srgb, <colour> N%, transparent)`. Anything else throws: a check
- * that measured no colour would pass without measuring anything.
+ * The colours a background paints: one colour, the stops of a gradient, or a colour mixed in sRGB
+ * by `color-mix(in srgb, <colour> N%, <other colour>)`, where the other colour is `transparent` or
+ * an opaque colour. The mix is weighted by alpha, as CSS does it (premultiplied), so a mix with
+ * `transparent` keeps the colour and scales its alpha. Anything else throws: a check that measured
+ * no colour would pass without measuring anything.
  */
 export function paintStops(input: string): Rgba[] {
   const value = input.trim();
-  const mix = /^color-mix\(\s*in srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*transparent\s*\)$/i.exec(value);
-  if (mix?.[1] && mix[2]) {
-    const [r, g, b, a] = parseColor(mix[1]);
-    return [[r, g, b, (a * Number(mix[2])) / 100]];
+  const mix = /^color-mix\(\s*in srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*(.+?)\s*\)$/i.exec(value);
+  if (mix?.[1] && mix[2] && mix[3]) {
+    const share = Number(mix[2]) / 100;
+    const first = parseColor(mix[1]);
+    const second = mixOperand(mix[3]);
+    const alpha = first[3] * share + second[3] * (1 - share);
+    const weigh = (i: 0 | 1 | 2) =>
+      alpha === 0 ? 0 : (first[i] * first[3] * share + second[i] * second[3] * (1 - share)) / alpha;
+    return [[weigh(0), weigh(1), weigh(2), alpha]];
   }
   if (/color-mix\(/i.test(value)) {
     throw new Error(
-      `Unsupported color-mix: ${input}. Only "color-mix(in srgb, <color> N%, transparent)" is measured.`,
+      `Unsupported color-mix: ${input}. Only "color-mix(in srgb, <color> N%, <color or transparent>)" is measured.`,
     );
   }
   const stops = colorsIn(value);
@@ -411,6 +430,24 @@ export function measure(
           ),
         ),
       );
+    // An Indicator (indicator.css). The number is the colour made for each status on that status's
+    // fill; the lowest of the four counts. The fill of `accent` is a `color-mix` in the dark theme.
+    // The dot is drawn in the fill colour of its status over what is behind it, and the ring of
+    // `glass-tint-solid` around it is what it must stand out from; the ring is painted over the same
+    // surface.
+    const indicatorFills = [
+      { fg: 'on-accent', bg: paintStops(resolveToken(t, 'indicator-accent'))[0]! },
+      { fg: 'on-danger', bg: color('danger-fill') },
+      { fg: 'on-status', bg: color('success') },
+      { fg: 'on-status', bg: color('warning') },
+    ];
+    const indicatorRing = composite(color('glass-tint-solid'), surface);
+    const indicatorDots = [
+      color('accent-solid'),
+      color('danger-fill'),
+      color('success'),
+      color('warning'),
+    ];
     const measured: Omit<Record<CheckId, number>, OverlayCheck> = {
       text: onSurface('text'),
       'text-muted': onSurface('text-muted'),
@@ -583,6 +620,12 @@ export function measure(
       'table-stripe-text-muted': textOnRows('text-muted', tableRows.stripe),
       'table-stripe-badge': badgesOnRows(tableRows.stripe),
       'table-selected-badge': badgesOnRows(tableRows.selected),
+      'indicator-count-text': Math.min(
+        ...indicatorFills.map(({ fg, bg }) => contrastRatio(color(fg), bg)),
+      ),
+      'indicator-dot': Math.min(
+        ...indicatorDots.map((dot) => contrastRatio(composite(dot, surface), indicatorRing)),
+      ),
     };
     for (const id of SURFACE_CHECK_IDS) lowest[id] = Math.min(lowest[id], measured[id]);
   }
diff --git a/scripts/rsc-probe.mjs b/scripts/rsc-probe.mjs
index ca164ce..ae959ca 100644
--- a/scripts/rsc-probe.mjs
+++ b/scripts/rsc-probe.mjs
@@ -50,6 +50,20 @@ const CASES = [
     element: (C) => createElement(C, null, 'x'),
     expect: { type: 'span', className: 'flg-badge' },
   },
+  // An Indicator in each form it can take. The mark is rendered by the probe as React would, so a hook
+  // in it fails here; the probe checks the wrapper, and the unit tests the mark.
+  ...[
+    ['with a count', { count: 3 }],
+    ['past max', { count: 120, max: 99 }],
+    ['as a dot', { dot: true, status: 'danger' }],
+    ['with show false', { count: 3, show: false }],
+  ].map(([what, props]) => ({
+    label: `Indicator ${what}`,
+    file: '../dist/components/indicator/Indicator.js',
+    exportName: 'Indicator',
+    element: (C) => createElement(C, props, createElement('button', { type: 'button' }, 'Bell')),
+    expect: { type: 'span', className: 'flg-indicator' },
+  })),
   {
     label: 'Divider',
     file: '../dist/components/divider/Divider.js',
diff --git a/src/components/indicator/Indicator.mdx b/src/components/indicator/Indicator.mdx
new file mode 100644
index 0000000..3665277
--- /dev/null
+++ b/src/components/indicator/Indicator.mdx
@@ -0,0 +1,107 @@
+import { Canvas, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './Indicator.stories';
+
+<Meta of={Stories} />
+
+# Indicator
+
+A small mark on the corner of one element: a count of unread items on a bell, a dot on an avatar, a
+number on a button. The mark is drawn over the element and takes no pointer, so the element under it
+is pressed as before.
+
+```tsx
+import { IconButton, Indicator } from 'h2d-glass-ui';
+
+<Indicator status="danger" count={3}>
+  <IconButton variant="ghost" aria-label="Notifications, 3 unread">
+    <BellIcon />
+  </IconButton>
+</Indicator>;
+```
+
+<Canvas of={Stories.Indicator} />
+
+## Props
+
+| Prop       | Type                                             | Default    | Does                                                       |
+| ---------- | ------------------------------------------------ | ---------- | ---------------------------------------------------------- |
+| `count`    | `number`                                         | none       | The number to show. Nothing shows for none, or for 0       |
+| `max`      | `number`                                         | `99`       | The largest number written out; a bigger count shows `99+` |
+| `dot`      | `boolean`                                        | `false`    | A small dot with no number. `count` is not read then       |
+| `showZero` | `boolean`                                        | `false`    | Shows the number for a count of 0                          |
+| `show`     | `boolean`                                        | `true`     | `false` hides the mark, whatever else is set               |
+| `status`   | `'accent' \| 'danger' \| 'success' \| 'warning'` | `'accent'` | The colour of the mark (see Statuses)                      |
+| `children` | `ReactNode`                                      | required   | The one element the mark sits on                           |
+
+`ref`, `className`, `style` and the other attributes of a `span` go to the wrapper, which is as
+large as the element inside it. The wrapper is there when nothing shows, so the element keeps its
+place in the tree, and its focus, while the mark comes and goes.
+
+A count is written in plain digits, in every language. A `count` that is not a finite number, or is
+negative, shows nothing, and one that is not whole is rounded down; a `max` that is not a positive
+integer is read as 99. Each is warned about in development. An Indicator has no hook, so it can be
+rendered in a React Server Component.
+
+## The count is only seen
+
+The mark is always hidden from assistive technology, and nothing a caller passes changes that. A
+screen reader user hears the name of the element under it, so **the number must be in that name**:
+
+```tsx
+// Right: the name says how many.
+<Indicator status="danger" count={unread}>
+  <IconButton variant="ghost" aria-label={`Notifications, ${unread} unread`}>
+    <BellIcon />
+  </IconButton>
+</Indicator>
+
+// Wrong: the number is on the screen and in no name.
+<Indicator status="danger" count={unread}>
+  <IconButton variant="ghost" aria-label="Notifications">
+    <BellIcon />
+  </IconButton>
+</Indicator>
+```
+
+The same holds for a dot, which says only "there is something": write it into the name
+("Notifications, some unread"). A count past `max` is written in the name in full or as "more than
+99", as suits the page.
+
+## Statuses
+
+- `status="accent"` (default): the accent of the library, a bluer fill that keeps white text above
+  4.5:1 in both themes.
+- `status="danger"`: a red fill, the look of the bell in the notifications recipe, for a count that
+  is urgent.
+- `status="success"` and `status="warning"`: green and amber, for the counts that mean those
+  things. Their text colour is the token `--flg-on-status`.
+
+The default is `accent` on purpose, though the bell of the header is red. An Indicator is not only
+for a bell: it is also the count on an item of a navigation rail and the dot on an avatar, and the
+neutral colour of the library is the accent. The urgency of unread notifications is a choice of the
+page, so the bell passes `status="danger"`.
+
+The colour is a reinforcement. In forced colours every status becomes the selection colour, and the
+name of the element says what the colour could not.
+
+## Position
+
+The mark sits in the corner for `danger` and a little outside it for the other statuses, as the two
+approved looks draw it, and a dot sits 7px in from the corner. To place the mark somewhere else, set
+`--flg-indicator-top` and `--flg-indicator-right` on the Indicator, or on any element above it:
+
+```tsx
+<Indicator count={3} style={{ '--flg-indicator-top': '-6px', '--flg-indicator-right': '-6px' }}>
+  <Avatar alt="Mia Anders" fallback="MA" />
+</Indicator>
+```
+
+The two values are measured from the top and the right edges of the element. They move the mark of
+every status, and a dot as well.
+
+## Do and don't
+
+- Do put the count in the name of the element under the mark.
+- Do keep the element a single control or image: the mark is placed on the corner of the wrapper.
+- Don't use an Indicator to say something that no name says, such as a state shown only by colour.
+- Don't put it on a wide element, such as a text field: the corner is the corner of the whole box.
diff --git a/src/components/indicator/Indicator.tsx b/src/components/indicator/Indicator.tsx
new file mode 100644
index 0000000..e36f645
--- /dev/null
+++ b/src/components/indicator/Indicator.tsx
@@ -0,0 +1,99 @@
+import { clsx } from 'clsx';
+import { forwardRef } from 'react';
+import type { HTMLAttributes, ReactNode } from 'react';
+import { dataAttr } from '../../internal/data-attr';
+import { isNumber } from '../../internal/number';
+import { devWarn } from '../../internal/warn';
+
+export type IndicatorStatus = 'accent' | 'danger' | 'success' | 'warning';
+
+export type IndicatorProps = HTMLAttributes<HTMLSpanElement> & {
+  /** The number to show, such as the unread count. Nothing shows for 0, unless `showZero`. */
+  count?: number;
+  /** The largest number written out; a bigger count shows as `99+`. Default 99. */
+  max?: number;
+  /** Shows a small dot with no number (and no `count` is read). Default false. */
+  dot?: boolean;
+  /** Shows the mark for a count of 0. Default false. */
+  showZero?: boolean;
+  /** `false` hides the mark whatever the other props say. The children stay. Default true. */
+  show?: boolean;
+  /**
+   * The colour of the mark. `accent` is the default: the Indicator is not only for the bell (the
+   * count of a navigation rail, a dot on an avatar), and the neutral colour of the library is the
+   * accent. Pass `danger` where the unread count is urgent, as on a bell.
+   */
+  status?: IndicatorStatus;
+  /** The one element the mark sits on, such as an icon button or an avatar. */
+  children: ReactNode;
+};
+
+const STATUSES: readonly IndicatorStatus[] = ['accent', 'danger', 'success', 'warning'];
+// A value outside the union (from JavaScript) is the default one. Searching the list returns the
+// member itself, so there is no cast to hide what the caller passed.
+const toStatus = (status: string): IndicatorStatus =>
+  STATUSES.find((known) => known === status) ?? 'accent';
+
+/**
+ * A mark on the corner of an element: a number, "99+" or a dot. It is only for the eyes, so it is
+ * always `aria-hidden`: the number must be in the name of the element it sits on (an icon button
+ * that says "Notifications, 3 unread"). Safe to render in React Server Components.
+ *
+ * The wrapper is there whatever shows, so the element inside keeps its place in the tree, and so
+ * its focus, when the mark comes and goes.
+ */
+export const Indicator = forwardRef<HTMLSpanElement, IndicatorProps>(function Indicator(
+  {
+    count,
+    max: maxProp = 99,
+    dot = false,
+    showZero = false,
+    show = true,
+    status = 'accent',
+    children,
+    className,
+    ...props
+  },
+  ref,
+) {
+  // The warnings are about what is shown: a count nobody reads, because of `dot` or `show`, is no
+  // mistake. `devWarn` prints each text once, so a render that repeats it is not a flood.
+  const reading = show && !dot;
+  const maxValid = Number.isInteger(maxProp) && maxProp > 0;
+  const max = maxValid ? maxProp : 99;
+  if (reading && !maxValid) {
+    devWarn('Indicator: max must be a positive integer; using 99.');
+  }
+
+  let text: string | null = null;
+  if (reading && count !== undefined) {
+    if (!isNumber(count) || count < 0) {
+      devWarn('Indicator: count must be a finite number, 0 or more; no number is shown.');
+    } else {
+      if (!Number.isInteger(count))
+        devWarn('Indicator: count is not an integer; it is rounded down.');
+      const whole = Math.floor(count);
+      if (whole > 0 || (whole === 0 && showZero)) text = whole > max ? `${max}+` : String(whole);
+    }
+  }
+
+  const mark =
+    show && (dot || text !== null) ? (
+      // After the props of the caller, which go on the wrapper: nothing can make the mark readable.
+      <span
+        className="flg-indicator-mark"
+        data-status={toStatus(status)}
+        data-dot={dataAttr(dot)}
+        aria-hidden="true"
+      >
+        {dot ? null : text}
+      </span>
+    ) : null;
+
+  return (
+    <span {...props} ref={ref} className={clsx('flg-indicator', className)}>
+      {children}
+      {mark}
+    </span>
+  );
+});
diff --git a/src/components/indicator/index.ts b/src/components/indicator/index.ts
new file mode 100644
index 0000000..504385c
--- /dev/null
+++ b/src/components/indicator/index.ts
@@ -0,0 +1,2 @@
+export { Indicator } from './Indicator';
+export type { IndicatorProps, IndicatorStatus } from './Indicator';
diff --git a/src/index.ts b/src/index.ts
index 114cba2..82a9354 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -279,3 +279,5 @@ export type {
   AppShellSidebarProps,
   AppShellSidebarTriggerProps,
 } from './components/app-shell';
+export { Indicator } from './components/indicator';
+export type { IndicatorProps, IndicatorStatus } from './components/indicator';
diff --git a/src/styles/components/indicator.css b/src/styles/components/indicator.css
new file mode 100644
index 0000000..ee3b9c5
--- /dev/null
+++ b/src/styles/components/indicator.css
@@ -0,0 +1,69 @@
+@layer flg.components {
+  /* The wrapper is only the box the mark is placed against: it is as large as the one element it
+     holds. */
+  .flg-indicator {
+    position: relative;
+    display: inline-flex;
+  }
+  /* The mark sits on the corner of the element. The positions are those of the two approved mockups:
+     the red number of the bell sits in the corner (B1), the accent one a little outside it (B3); a
+     caller who wants another puts `--flg-indicator-top` and `--flg-indicator-right` on the wrapper or
+     on any element above it. The ring of the tint of the glass is what sets it apart from the icon.
+     It takes no pointer, so the button under it is pressed there. */
+  .flg-indicator-mark {
+    --flg-indicator-fill: var(--flg-indicator-accent);
+    --flg-indicator-text: var(--flg-on-accent);
+    position: absolute;
+    top: var(--flg-indicator-top, -3px);
+    right: var(--flg-indicator-right, -4px);
+    box-sizing: border-box;
+    min-width: 17px;
+    height: 17px;
+    padding: 0 5px;
+    border-radius: var(--flg-radius-full);
+    background: var(--flg-indicator-fill);
+    color: var(--flg-indicator-text);
+    box-shadow: 0 0 0 2px var(--flg-glass-tint-solid);
+    font: var(--flg-weight-semibold) var(--flg-text-2xs) / 17px var(--flg-font-sans);
+    text-align: center;
+    font-variant-numeric: tabular-nums;
+    pointer-events: none;
+  }
+  .flg-indicator-mark[data-status='danger'] {
+    --flg-indicator-fill: var(--flg-danger-fill);
+    --flg-indicator-text: var(--flg-on-danger);
+    top: var(--flg-indicator-top, 0);
+    right: var(--flg-indicator-right, 0);
+  }
+  /* `success` and `warning` are outside the mockups; the text on them is `--flg-on-status`, which is
+     white on the dark fills of the light theme and dark on the pale ones of the dark theme. */
+  .flg-indicator-mark[data-status='success'] {
+    --flg-indicator-fill: var(--flg-success);
+    --flg-indicator-text: var(--flg-on-status);
+  }
+  .flg-indicator-mark[data-status='warning'] {
+    --flg-indicator-fill: var(--flg-warning);
+    --flg-indicator-text: var(--flg-on-status);
+  }
+  /* The dot has no text, so it has no minimum width or padding. Its accent is the solid accent, as
+     the count dot of the navigation rail draws it. */
+  .flg-indicator-mark[data-dot] {
+    --flg-indicator-fill: var(--flg-accent-solid);
+    top: var(--flg-indicator-top, 7px);
+    right: var(--flg-indicator-right, 7px);
+    min-width: 0;
+    width: 8px;
+    height: 8px;
+    padding: 0;
+    border-radius: 50%;
+  }
+  .flg-indicator-mark[data-dot][data-status='danger'] {
+    --flg-indicator-fill: var(--flg-danger-fill);
+  }
+  .flg-indicator-mark[data-dot][data-status='success'] {
+    --flg-indicator-fill: var(--flg-success);
+  }
+  .flg-indicator-mark[data-dot][data-status='warning'] {
+    --flg-indicator-fill: var(--flg-warning);
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index 0b1c832..c98c011 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -8,6 +8,7 @@
 @import './components/button.css';
 @import './components/badge.css';
 @import './components/avatar.css';
+@import './components/indicator.css';
 @import './components/divider.css';
 @import './components/card.css';
 @import './components/field.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index d7c0940..9a4419f 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -201,6 +201,16 @@
     .flg-avatar {
       border: 1px solid CanvasText;
     }
+    /* The mark of an Indicator, number or dot, is the selection colour with its text colour, and the
+       ring around it is the canvas. Opting out of colour adjustment keeps `Highlight`, and keeps the
+       `box-shadow` that would otherwise be dropped. The colour of the status is lost, but an
+       Indicator tells no status that the name of the button under it does not (spec phase 5 §4.5). */
+    .flg-indicator-mark {
+      forced-color-adjust: none;
+      background: Highlight;
+      color: HighlightText;
+      box-shadow: 0 0 0 2px Canvas;
+    }
     .flg-divider {
       background: CanvasText;
     }
diff --git a/src/styles/theme/values.ts b/src/styles/theme/values.ts
index 1902679..4d94ead 100644
--- a/src/styles/theme/values.ts
+++ b/src/styles/theme/values.ts
@@ -81,6 +81,10 @@ export const themes: Readonly<Record<ThemeName, TokenMap>> = {
     danger: '#92222b', // (outside mockup) darkened 3% to pass over the Dialog scrim (I1)
     'danger-fill': '#96232c', // (outside mockup) Plan 2 mockup option B: danger button fill
     'on-danger': '#ffffff', // (outside mockup)
+    // The fill of an Indicator `accent` (mockup B3, copied as it is), and the text on the `success` and
+    // `warning` ones.
+    'indicator-accent': 'var(--flg-accent-solid)',
+    'on-status': '#ffffff', // (outside mockup)
     'status-bg-alpha': '12%', // (outside mockup)
     scrim: 'rgba(15,20,40,.28)',
   },
@@ -118,6 +122,9 @@ export const themes: Readonly<Record<ThemeName, TokenMap>> = {
     danger: '#ffdbdd', // (outside mockup)
     'danger-fill': '#c2343f', // (outside mockup) Plan 2 mockup option B: danger button fill
     'on-danger': '#ffffff', // (outside mockup)
+    // 22% black over the accent, so that white text on it reaches 4.5:1 (mockup B3).
+    'indicator-accent': 'color-mix(in srgb, var(--flg-accent-start) 78%, #000)',
+    'on-status': '#0b1020', // (outside mockup)
     'status-bg-alpha': '16%', // (outside mockup)
     scrim: 'rgba(0,0,0,.45)',
   },
@@ -176,6 +183,8 @@ export const contrastMore: Readonly<{ shared: TokenMap; light: TokenMap; dark: T
     'dropzone-border': 'var(--flg-text-muted)',
     // Solid, so the ring keeps 3:1 against the surface (spec phase 4 §4.2).
     'stepper-ring': 'var(--flg-text-muted)',
+    // The solid accent, so the white (or dark) text on it follows `on-accent` of this mode.
+    'indicator-accent': 'var(--flg-accent-solid)',
   },
   light: {
     'glass-tint': 'rgb(250,251,255)',
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/indicator src/index.test.ts src/docs
pnpm vitest run --project scripts
pnpm check:contrast
pnpm vitest run --project storybook-light src/components/indicator
pnpm vitest run --project storybook-dark src/components/indicator
pnpm build && pnpm check:package
pnpm build-storybook
pnpm check:docs-tables
```

Expected:
- `pnpm gen:theme` in `Wrote src/styles/generated/theme.css, src/styles/generated/simulate.css and src/styles/generated/app-shell.css`; `theme.css` có hai token mới.
- `lint`, `typecheck`, `format:check`: PASS.
- Unit: 58 test PASS (hai project React cộng lại; `Indicator.test.tsx` 24 test ở mỗi project), không lỗi kiểu.
- `scripts`: 92 test PASS (5 file).
- `pnpm check:contrast`: PASS (`Contrast check passed.`). Hai check mới đạt ở mọi chế độ với số của phát hiện 3; không ngoại lệ mới.
- Story indicator: 15 test PASS ở mỗi project (5 story × ba engine). axe chạy sau play function, không có vi phạm.
- `pnpm build && pnpm check:package`: PASS. `check:dist-css` thấy `flg-indicator`, `flg-indicator-mark`; `check:rsc` in `ok` cho bốn ca `Indicator`; `size`: JS 49.87 kB trên 54.61 kB, CSS 14.34 kB trên 15.49 kB. Không chạy `size:record`.
- `pnpm build-storybook`: PASS. `Indicator.mdx` thay trang autodocs (`components-indicator--docs`); trong `storybook-static/index.json`, chỉ `Indicator` của Indicator không gắn `no-visual` (126 story có ảnh).
- `pnpm check:docs-tables`: PASS.
- Indicator là component mới và các file dùng chung chỉ được thêm vào (phát hiện 18), nên ảnh chuẩn của component cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  .storybook/icons.tsx \
  docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md \
  scripts/check-dist-css.ts \
  scripts/lib/contrast.test.ts \
  scripts/lib/contrast.ts \
  scripts/lib/theme-css.test.ts \
  scripts/rsc-probe.mjs \
  src/components/indicator/Indicator.mdx \
  src/components/indicator/Indicator.stories.tsx \
  src/components/indicator/Indicator.test-d.ts \
  src/components/indicator/Indicator.test.tsx \
  src/components/indicator/Indicator.tsx \
  src/components/indicator/index.ts \
  src/index.test.ts \
  src/index.ts \
  src/styles/components/indicator.css \
  src/styles/index.css \
  src/styles/preferences.css \
  src/styles/theme/values.ts
```
```bash
git commit -m "feat(indicator): add Indicator, its two tokens and the contrast checks" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 2: `Nav`, `NavSection`, `NavItem`, `NavGroup` ở dạng mở rộng, `pill` và `bar`

Spec §1 (dòng Nav, trừ phần rail; dòng "Tương phản: cần duyệt", dòng 35), §3.1 (dòng Nav), §3.2 (dòng N), §3.4 (dòng "Đóng": kích hoạt một `NavItem`), §3.5 (dòng NavGroup mở sẵn), §3.6 (chevron; nhóm mở, đóng), §4.1 (N1, N2, cột mở rộng), §4.2 (nền nhuộm N2), §4.3 **Nav** (phần chung, `pill`, `bar`; không có "Rail"), §4.4 (`nav-bar-*`, dòng 35, dòng 2, 6, 7, 8, 12, 29, 32 mở rộng), §4.5 **Nav** (trừ rail), §4.6 (`ChevronIcon`), §5 (các cảnh báo của Nav trừ cảnh báo icon; `collectChildren`, `markPart`, `flattenChildren`; context của AppShell), §6.1, §6.3 `Nav`, `NavSection`, `NavItem`, `NavGroup` (trừ "Ở rail"), §7 lớp 1–3 cho các phần này, "Test kiểu", §10 (dòng NavGroup, dòng vòng focus N2). Mockup N1, N2 (`phase-5-nav.html`). Spec 0+1 §4.9. Báo cáo và code của Task 1 là điểm bắt đầu.
- **Bốn phần** (client, `Nav.tsx`) với DOM của §6.3: danh sách `role="list"`, section là `role="group"` được tiêu đề gọi tên, nút nhóm có `aria-expanded` và `aria-controls`, danh sách con được nút gọi tên, `data-has-active` (phát hiện 4).
- **`NavItem`**: `<a href>`; `asChild` cho link của router (phần tử con giữ props của nó, nội dung của nó là nhãn); `disabled` ở cả hai cách; `badge` theo giao diện.
- **`NavGroup`** mở sẵn khi một con trực tiếp `active` (Fragment, mảng, tham chiếu lazy của RSC); click, Enter, Space; controlled và uncontrolled (phát hiện 4).
- **Đóng tấm trượt** khi một click thường trên `NavItem` trong tấm trượt của AppShell (phát hiện 5). Ngoài AppShell, Nav chạy độc lập.
- **Tách context của AppShell** (`AppShellTextContext`) để mục không render lại theo `brand`, `labels` viết inline; một unit test đếm số lần render (phát hiện 6).
- **CSS**: `nav.css` (dạng mở rộng, hai giao diện); `preferences.css` (contrast-more, `outline` vào trong của `bar`, forced colors) (phát hiện 8).
- **Tương phản**: ba check `nav-bar-*`, dòng 35, nhãn các dòng mở rộng, `ExceptionTable` 35 dòng, câu trỏ của trang Accessibility (phát hiện 7).
- **Story:** `Pill`, `Bar` là story giao diện (Nav mở rộng trong tấm kính 264px, mọi trạng thái mockup ghi); `GroupToggles`, `TabOrder`, `Names`, `FocusRings`, `PillCurrentItemKeepsItsFocusRing`, `ClosesTheSheet` gắn `no-visual`.
- Spec giai đoạn 5 (§4.3, §5) và spec 0+1 (§4.9) được sửa (phát hiện 17). Cuối task, `check:package` PASS với ngưỡng cũ.

**Files:**
- Create: `src/components/nav/Nav.tsx`, `index.ts`, `Nav.test.tsx`, `Nav.test-d.ts`, `Nav.stories.tsx`, `src/styles/components/nav.css`
- Modify: `src/components/app-shell/AppShell.tsx`, `src/components/app-shell/app-shell-context.ts`, `src/components/app-shell/AppShell.test.tsx`, `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/lib/contrast.ts`, `scripts/lib/contrast.test.ts`, `scripts/contrast-exceptions.ts`, `scripts/check-dist-css.ts`, `scripts/check-use-client.ts`, `src/docs/ExceptionTable.test.tsx`, `src/docs/Accessibility.mdx`, `docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`

**Interfaces:**
- Produces trong `src/components/nav/Nav.tsx` (client, `"use client"`), export qua `nav/index.ts` và `src/index.ts`:
  - `Nav`: `forwardRef<HTMLElement, NavProps>` (`<nav>`); không có con nào thì render `null` (không có landmark rỗng).
  - `NavSection`: `forwardRef<HTMLDivElement, NavSectionProps>`; đánh dấu `markPart(…, 'nav-section')`.
  - `NavItem`: `forwardRef<HTMLAnchorElement, NavItemProps>`; tự render `<li>`; `ref`, `className`, `style` và mọi prop vào link (hay phần tử của `asChild`); đánh dấu `'nav-item'`.
  - `NavGroup`: `forwardRef<HTMLLIElement, NavGroupProps>`; `ref`, `className` và mọi prop vào `<li>`.
  - `NavVariant = 'pill' | 'bar'`; `NavLabels { nav: string }` (mặc định `'Main'`).
  - `NavProps = HTMLAttributes<HTMLElement> & { variant?: NavVariant; labels?: Partial<NavLabels> }`. Mặc định `variant` `'pill'`; giá trị ngoài union thành `'pill'`.
  - `NavSectionProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & { title?: ReactNode; bottom?: boolean }`.
  - `NavItemProps = AnchorHTMLAttributes<HTMLAnchorElement> & { icon?: ReactNode; badge?: ReactNode; active?: boolean; disabled?: boolean; asChild?: boolean; children: ReactNode }`.
  - `NavGroupProps = Omit<LiHTMLAttributes<HTMLLIElement>, 'title'> & { label: ReactNode; icon?: ReactNode; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode }`.
- DOM và class (dạng mở rộng):
  - `nav.flg-nav` với `data-variant` (sau props) và `aria-label` (của người dùng, hay `aria-labelledby` của người dùng, không thì `labels.nav`).
  - Mỗi đoạn mục ngoài section: `ul.flg-nav-list[role="list"]`.
  - `div.flg-nav-section` (`role="group"` và `aria-labelledby` tiêu đề chỉ khi có `title` và người dùng không tự đặt tên; `data-bottom`) > `Divider decorative` (chỉ `bottom`), `div.flg-nav-section-title`, `ul.flg-nav-list`.
  - `li` > `a.flg-nav-item` (`href`; `aria-current="page"` khi `active`, giữ `aria-current` của người dùng; tắt: không `href`, `role="link"`, `aria-disabled="true"`; tắt với `asChild`: `aria-disabled`, `tabIndex={-1}`, cú bấm bị chặn ở pha capture) > `span.flg-nav-item-icon[aria-hidden]`, `span.flg-nav-item-label`, rồi số đếm `span.flg-badge.flg-nav-item-badge` (`pill`) hay `span.flg-nav-item-count` (`bar`).
  - `li.flg-nav-group` (`data-open`, `data-has-active`, sau props) > `button.flg-nav-item[type="button"]` (`aria-expanded`, `aria-controls`; icon, nhãn, `svg.flg-nav-group-chevron`) và `div.flg-nav-sub[hidden]` > `ul.flg-nav-list[aria-labelledby=<id của nút>]`.
- `src/components/app-shell/app-shell-context.ts`: `AppShellContextValue` bỏ `labels` và `brand`; thêm `AppShellTextValue { labels: AppShellLabels; brand: ReactNode }` và `AppShellTextContext`. `AppShell.tsx` có provider thứ hai; `AppShellHeader` (brand), `AppShellSidebar` (brand, `labels.closeNavigation`, `labels.navigation`) và `AppShellSidebarTrigger` (labels) đọc nó.
- CSS: `src/styles/components/nav.css`, import trong `src/styles/index.css`; biến nội bộ `--flg-nav-tint` (nền nhuộm N2) trên `.flg-nav[data-variant='bar']`.
- Cảnh báo dev (sau tiền tố `[h2d-glass-ui] `):
  - `<NavItem> must be rendered inside <Nav>, <NavSection> or <NavGroup>.` (và cùng mẫu cho `<NavGroup>`)
  - `<NavSection> must be a direct child of <Nav>.`
  - `<NavGroup> inside <NavGroup> is not supported: navigation has at most two levels.`
  - `asChild` mà con không phải một element: cảnh báo có sẵn của `Slot`.
- `scripts/lib/contrast.ts`: `CHECKS` thêm `'nav-bar-indicator': 3`, `'nav-bar-text': 4.5`, `'nav-bar-icon': 3`. `scripts/contrast-exceptions.ts`: dòng 35 (`nav-bar-indicator`, light 2.52, dark 2.03, 1.4.11) và nhãn mở rộng của các dòng 2, 6, 7, 8, 12, 29, 32.
- Danh sách kiểm tra gói: `scripts/check-use-client.ts` thêm `src/components/nav/Nav.tsx`; `scripts/check-dist-css.ts` thêm 12 class: `flg-nav`, `flg-nav-list`, `flg-nav-section`, `flg-nav-section-title`, `flg-nav-item`, `flg-nav-item-icon`, `flg-nav-item-label`, `flg-nav-item-badge`, `flg-nav-item-count`, `flg-nav-group`, `flg-nav-group-chevron`, `flg-nav-sub`. Nav là client nên không có ca `check:rsc`.
- Story: `Nav.stories.tsx`, meta `title: 'Components/Nav'`; helper `Menu({ variant })` (cả menu của mockup), `Panel` (tấm kính 264px), `InAShell`, `focusCalendar`.
- Consumes: `collectChildren`, `flattenChildren`, `markPart`, `partOf`, `childKeys`, `composeEventHandlers`, `dataAttr`, `hasContent`, `ChevronIcon`, `resolveLazy`, `hasModifier`, `Slot`, `useControllableState`, `devWarn`, `withDefaults`, `Badge`, `Divider`; `AppShellContext` (`setOpen`).
- Task sau dùng: Task 3 thêm rail vào `NavItem`, `NavGroup`, `nav.css` và story. Plan C: trang Examples và fixture dùng `Nav`, `NavGroup`, `NavItem asChild`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/scripts/lib/contrast.test.ts b/scripts/lib/contrast.test.ts
index 0c3521a..606c6ac 100644
--- a/scripts/lib/contrast.test.ts
+++ b/scripts/lib/contrast.test.ts
@@ -245,6 +245,49 @@ describe('the Indicator checks (spec phase 5 §4.4)', () => {
   });
 });
 
+describe('the Nav `bar` checks (spec phase 5 §4.4)', () => {
+  const NAV_CHECKS = ['nav-bar-indicator', 'nav-bar-text', 'nav-bar-icon'] as const;
+
+  it('are the bar and the icon at 3:1 and the text at 4.5:1', () => {
+    expect(CHECKS['nav-bar-indicator']).toBe(3);
+    expect(CHECKS['nav-bar-text']).toBe(4.5);
+    expect(CHECKS['nav-bar-icon']).toBe(3);
+  });
+
+  // The numbers are the spec's, measured over every reference backdrop and border stop, with the tint
+  // of the current item laid over the surface.
+  it.each([
+    ['light', 'default', [2.52, 8.24, 3.28]],
+    ['dark', 'default', [2.03, 5.82, 3.8]],
+    ['light', 'contrast-more', [4.65, 11.44, 4.55]],
+    ['dark', 'contrast-more', [5.3, 10.17, 6.64]],
+  ] as const)('measure %s, %s mode: %j', (theme, mode, expected) => {
+    const measured = measure(values, theme, mode);
+    expect(NAV_CHECKS.map((id) => measured[id])).toEqual(expected);
+  });
+
+  it('records the bar as the two exceptions of row 35, and nothing else of the Nav', () => {
+    const { findings } = evaluate(values, KNOWN_EXCEPTIONS);
+    expect(findings.filter((finding) => finding.check.startsWith('nav-'))).toEqual([]);
+    expect(
+      KNOWN_EXCEPTIONS.filter((exception) => exception.check.startsWith('nav-')).map(
+        ({ row, theme, check }) => [row, theme, check],
+      ),
+    ).toEqual([
+      [35, 'light', 'nav-bar-indicator'],
+      [35, 'dark', 'nav-bar-indicator'],
+    ]);
+  });
+
+  it('measures the tint at both ends, so a weak text colour cannot hide at the 3% end', () => {
+    const patched = {
+      ...values,
+      themes: { ...values.themes, light: { ...values.themes.light, text: '#c9d6ff' } },
+    };
+    expect(measure(patched, 'light', 'default')['nav-bar-text']).toBeLessThan(2);
+  });
+});
+
 describe('the Table checks (spec phase 4 §4.4)', () => {
   const TABLE_CHECKS = [
     'table-row-text',
diff --git a/src/components/app-shell/AppShell.test.tsx b/src/components/app-shell/AppShell.test.tsx
index 4a6d783..9ec4e9f 100644
--- a/src/components/app-shell/AppShell.test.tsx
+++ b/src/components/app-shell/AppShell.test.tsx
@@ -419,4 +419,34 @@ describe('AppShell', () => {
       expect(warn).toHaveBeenCalledTimes(1);
     });
   });
+
+  // The brand and the words are in a context of their own, apart from the state, so that the links of a
+  // Nav do not render again with them (Nav.test.tsx); the parts that draw them must still follow.
+  it('hands a new brand and new words to the header, the sidebar and the trigger of a mounted shell', () => {
+    const shell = (tick: number) => (
+      <AppShell
+        defaultOpen
+        brand={<span data-testid="brand">Brand {tick}</span>}
+        labels={{
+          openNavigation: `Open ${tick}`,
+          closeNavigation: `Close ${tick}`,
+          navigation: `Nav ${tick}`,
+        }}
+      >
+        <AppShellHeader>Header</AppShellHeader>
+        <AppShellSidebar>Sidebar</AppShellSidebar>
+        <AppShellMain>Main</AppShellMain>
+      </AppShell>
+    );
+    const { rerender } = render(shell(0));
+    rerender(shell(1));
+    // The brand is drawn twice, in the header and in the sidebar; the sheet is open on a narrow screen.
+    expect(screen.getAllByTestId('brand').map((brand) => brand.textContent)).toEqual([
+      'Brand 1',
+      'Brand 1',
+    ]);
+    expect(screen.getByRole('button', { name: 'Open 1' })).toBeInTheDocument();
+    expect(screen.getByRole('button', { name: 'Close 1' })).toBeInTheDocument();
+    expect(screen.getByRole('dialog', { name: 'Nav 1' })).toBeInTheDocument();
+  });
 });
diff --git a/src/components/nav/Nav.stories.tsx b/src/components/nav/Nav.stories.tsx
new file mode 100644
index 0000000..2559961
--- /dev/null
+++ b/src/components/nav/Nav.stories.tsx
@@ -0,0 +1,529 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import type { ReactNode } from 'react';
+import { expect, userEvent, waitFor, within } from 'storybook/test';
+import { paintedPixels } from '../../../.storybook/painted-pixel';
+import { realUserEvent } from '../../../.storybook/real-input';
+import { afterLayout, withViewport } from '../../../.storybook/viewport';
+import { strokeIcon } from '../../internal/icons';
+import { AppShell, AppShellHeader, AppShellMain, AppShellSidebar } from '../app-shell/AppShell';
+import { Surface } from '../surface/Surface';
+import { Nav, NavGroup, NavItem, NavSection } from './Nav';
+import type { NavVariant } from './Nav';
+
+const meta = {
+  title: 'Components/Nav',
+  component: Nav,
+  // The stories hand each Nav its items, so the controls have nothing to drive.
+  args: { children: null },
+} satisfies Meta<typeof Nav>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+// The icons of the application "Lumen" of the mockup. They are the user's, not the library's (spec
+// phase 5 §4.6): the paths are those of the mockup page.
+const Icon = ({ children }: { children: ReactNode }) => <svg {...strokeIcon}>{children}</svg>;
+const ICONS = {
+  home: (
+    <Icon>
+      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
+      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
+    </Icon>
+  ),
+  inbox: (
+    <Icon>
+      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
+      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
+    </Icon>
+  ),
+  calendar: (
+    <Icon>
+      <rect x="3" y="4" width="18" height="18" rx="2" />
+      <path d="M16 2v4M8 2v4M3 10h18" />
+    </Icon>
+  ),
+  folder: (
+    <Icon>
+      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
+    </Icon>
+  ),
+  archive: (
+    <Icon>
+      <rect x="2" y="3" width="20" height="5" rx="1" />
+      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
+      <path d="M10 12h4" />
+    </Icon>
+  ),
+  users: (
+    <Icon>
+      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
+      <circle cx="9" cy="7" r="4" />
+      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
+      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
+    </Icon>
+  ),
+  chart: (
+    <Icon>
+      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
+      <path d="M18 17V9" />
+      <path d="M13 17V5" />
+      <path d="M8 17v-3" />
+    </Icon>
+  ),
+  gear: (
+    <Icon>
+      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
+      <circle cx="12" cy="12" r="3" />
+    </Icon>
+  ),
+};
+
+/**
+ * The navigation of the mockup (phase-5-nav), item for item. The page of the app is the top-level
+ * "Overview" and, to compare on one picture as the mockup does, the child "Design system" too: in an
+ * application only one item is current. "Members" is the item the harness hovers
+ * (`data-visual-hover`).
+ */
+function Menu({ variant }: { variant: NavVariant }) {
+  return (
+    <Nav variant={variant} aria-label="Main">
+      <NavItem href="#overview" icon={ICONS.home} active>
+        Overview
+      </NavItem>
+      <NavItem href="#inbox" icon={ICONS.inbox} badge={12}>
+        Inbox
+      </NavItem>
+      <NavItem href="#calendar" icon={ICONS.calendar}>
+        Calendar
+      </NavItem>
+      <NavSection title="Projects">
+        <NavGroup label="Design" icon={ICONS.folder}>
+          <NavItem href="#design-system" active>
+            Design system
+          </NavItem>
+          <NavItem href="#mobile">Mobile app</NavItem>
+        </NavGroup>
+        <NavGroup label="Engineering" icon={ICONS.folder}>
+          <NavItem href="#platform">Platform</NavItem>
+        </NavGroup>
+        <NavItem href="#archive" icon={ICONS.archive} disabled>
+          Archive
+        </NavItem>
+      </NavSection>
+      <NavSection title="Team">
+        <NavItem href="#members" icon={ICONS.users} data-visual-hover="">
+          Members
+        </NavItem>
+        <NavItem href="#reports" icon={ICONS.chart} badge={3}>
+          Reports
+        </NavItem>
+      </NavSection>
+      <NavSection bottom>
+        <NavItem href="#settings" icon={ICONS.gear}>
+          Settings
+        </NavItem>
+      </NavSection>
+    </Nav>
+  );
+}
+
+/** The sidebar of the mockup: a 264px pane of glass, tall enough for the item at the foot to be pushed down. */
+function Panel({ children }: { children: ReactNode }) {
+  return (
+    <Surface
+      style={{
+        boxSizing: 'border-box',
+        display: 'flex',
+        flexDirection: 'column',
+        width: 264,
+        minHeight: 600,
+      }}
+    >
+      {children}
+    </Surface>
+  );
+}
+
+/** Tabs to Calendar, so the keyboard ring is drawn on the row the mockup draws it on. */
+async function focusCalendar() {
+  for (let stop = 0; stop < 3; stop += 1) await userEvent.tab();
+}
+
+/**
+ * N1 (mockup phase-5-nav, the expanded column of option n1): the current page is a soft pill of the
+ * accent; the count of "Inbox" and "Reports" is a neutral Badge; the keyboard ring is on "Calendar", a
+ * row is under the pointer ("Members", which the harness hovers), "Design" is open and holds the
+ * current page, "Engineering" is closed, "Archive" is disabled, and "Settings" is the item at the foot.
+ */
+export const Pill: Story = {
+  render: () => (
+    <Panel>
+      <Menu variant="pill" />
+    </Panel>
+  ),
+  play: focusCalendar,
+};
+
+/** N2 (option n2): an accent bar on the left edge with a tint that fades out; the count is a bare number. */
+export const Bar: Story = {
+  render: () => (
+    <Panel>
+      <Menu variant="bar" />
+    </Panel>
+  ),
+  play: focusCalendar,
+};
+
+// The behaviour stories below are about what a screenshot cannot say: they are `no-visual`.
+
+const isShown = (element: Element) => element.getBoundingClientRect().height > 0;
+
+/**
+ * A group opens and closes by a click, by Enter and by Space; its links are laid out only while it is
+ * open (a hidden list has no box), and the state is on the button and on the item of the list.
+ */
+export const GroupToggles: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <Panel>
+      <Menu variant="pill" />
+    </Panel>
+  ),
+  play: async ({ canvasElement }) => {
+    const canvas = within(canvasElement);
+    const group = canvasElement.querySelector<HTMLElement>('.flg-nav-group:not([data-open])')!;
+    const button = within(group).getByRole('button', { name: 'Engineering' });
+    const link = () => group.querySelector<HTMLElement>('.flg-nav-sub a')!;
+    await expect(button).toHaveAttribute('aria-expanded', 'false');
+    await expect(isShown(link())).toBe(false);
+    // The group that holds the current page is open from the start.
+    await expect(canvas.getByRole('button', { name: 'Design' })).toHaveAttribute(
+      'aria-expanded',
+      'true',
+    );
+    await expect(isShown(canvas.getByRole('link', { name: 'Design system' }))).toBe(true);
+
+    await userEvent.click(button);
+    await expect(button).toHaveAttribute('aria-expanded', 'true');
+    await expect(group).toHaveAttribute('data-open');
+    await expect(isShown(link())).toBe(true);
+    await userEvent.click(button);
+    await expect(button).toHaveAttribute('aria-expanded', 'false');
+    await expect(isShown(link())).toBe(false);
+
+    for (const key of ['{Enter}', ' ']) {
+      button.focus();
+      await userEvent.keyboard(key);
+      await expect(button, `${JSON.stringify(key)} opens it`).toHaveAttribute(
+        'aria-expanded',
+        'true',
+      );
+      await expect(isShown(link())).toBe(true);
+      await userEvent.keyboard(key);
+      await expect(button, `${JSON.stringify(key)} closes it`).toHaveAttribute(
+        'aria-expanded',
+        'false',
+      );
+      await expect(isShown(link())).toBe(false);
+    }
+  },
+};
+
+/**
+ * Tab goes through the links and the buttons of the groups in the order they are drawn: a disabled
+ * item is skipped, and the links of a closed group are not reached until it is open.
+ */
+export const TabOrder: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <Panel>
+      <Menu variant="bar" />
+    </Panel>
+  ),
+  play: async ({ canvasElement }) => {
+    const names = async () => {
+      const seen: string[] = [];
+      for (let stop = 0; stop < 12; stop += 1) {
+        await userEvent.tab();
+        const active = document.activeElement as HTMLElement;
+        if (!canvasElement.contains(active)) break;
+        seen.push(active.textContent ?? '');
+      }
+      return seen;
+    };
+    await expect(await names()).toEqual([
+      'Overview',
+      'Inbox12',
+      'Calendar',
+      'Design',
+      'Design system',
+      'Mobile app',
+      'Engineering',
+      'Members',
+      'Reports3',
+      'Settings',
+    ]);
+  },
+};
+
+/** The count is part of the name of the link, as the engine reads it: "Inbox 12". */
+export const Names: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <Panel>
+      <Menu variant="pill" />
+    </Panel>
+  ),
+  play: async ({ canvasElement }) => {
+    const canvas = within(canvasElement);
+    for (const name of ['Inbox 12', 'Reports 3', 'Overview', 'Archive']) {
+      await expect(canvas.getByRole('link', { name })).toBeInTheDocument();
+    }
+    await expect(canvas.getByRole('link', { name: 'Overview' })).toHaveAttribute(
+      'aria-current',
+      'page',
+    );
+    // The group of links is named by the button, and the section by its title.
+    await expect(canvas.getByRole('list', { name: 'Design' })).toBeInTheDocument();
+    await expect(canvas.getByRole('group', { name: 'Projects' })).toBeInTheDocument();
+  },
+};
+
+const WIDE = { width: 1280, height: 720 };
+
+/** A sidebar of a whole shell, so the ring is drawn where the body of the sidebar scrolls and clips. */
+function InAShell({ variant, narrow = false }: { variant: NavVariant; narrow?: boolean }) {
+  return (
+    <AppShell>
+      <AppShellHeader>Lumen</AppShellHeader>
+      <AppShellSidebar>
+        <Nav variant={variant} aria-label="Main">
+          <NavItem href="#overview" icon={ICONS.home} active>
+            Overview
+          </NavItem>
+          <NavItem href="#inbox" icon={ICONS.inbox} badge={12}>
+            Inbox
+          </NavItem>
+          <NavItem href="#calendar" icon={ICONS.calendar}>
+            Calendar
+          </NavItem>
+          <NavSection bottom>
+            <NavItem href="#settings" icon={ICONS.gear}>
+              Settings
+            </NavItem>
+          </NavSection>
+        </Nav>
+      </AppShellSidebar>
+      <AppShellMain>{narrow ? 'Narrow' : 'Main'}</AppShellMain>
+    </AppShell>
+  );
+}
+
+/**
+ * How far a channel must move for a ring to be seen. By default the ring is a translucent shadow
+ * around the row (the outline is transparent), a few levels over the glass; with more contrast and in
+ * forced colours it is a 2px outline of a solid colour.
+ */
+const SHADOW_SHOWN = 4;
+const OUTLINE_SHOWN = 60;
+const ACROSS = [0.5, 1.5, 2.5] as const;
+
+/**
+ * The ring of a row at the edge of the sidebar. By default it is drawn outside the row, and the body
+ * of the sidebar, which scrolls, must not clip it above the first row, under the last and to the
+ * right; the row of `bar` runs to the left edge of the glass, where the ring is beyond the screen.
+ * With `prefers-contrast: more` and in forced colours, the two modes where the outline is the sign of
+ * focus, a row of `bar` draws it inside. Read from the painted pixels (and the offset), as in a `lined`
+ * Table. The preferences are emulated through the protocol, which only Chromium has.
+ */
+export const FocusRings: Story = {
+  tags: ['no-visual'],
+  parameters: { stage: 'page' },
+  render: () => <InAShell variant="bar" />,
+  play: async ({ canvasElement }) => {
+    const { cdp, server } = await import('vitest/browser');
+    if (server.browser !== 'chromium') return;
+    const real = await realUserEvent();
+    if (!real) return;
+    const session = cdp();
+    const panel = canvasElement.querySelector<HTMLElement>('.flg-app-shell-sidebar-panel')!;
+    const nav = panel.querySelector<HTMLElement>('.flg-nav')!;
+    const links = () => [...nav.querySelectorAll<HTMLElement>('.flg-nav-item')];
+    const pixelsAround = async (
+      link: HTMLElement,
+      at: (box: DOMRect) => Array<[number, number]>,
+    ) => {
+      const outer = panel.getBoundingClientRect();
+      return (await paintedPixels(
+        panel,
+        at(link.getBoundingClientRect()).map(([x, y]) => [x - outer.x, y - outer.y] as const),
+      ))!;
+    };
+    const differs = (after: number[][], before: number[][], shown: number) =>
+      after.some((pixel, point) =>
+        pixel.some((channel, index) => Math.abs(channel - before[point]![index]!) > shown),
+      );
+
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      await waitFor(() => expect(panel.getBoundingClientRect().width).toBeGreaterThan(200));
+      const first = links()[0]!;
+      const last = links().at(-1)!;
+      // By default: the ring is outside, above the first row and under the last one.
+      for (const [name, link, at] of [
+        [
+          'first row, above',
+          first,
+          (box: DOMRect): Array<[number, number]> =>
+            [2.5, 3, 3.5].map((depth) => [box.x + box.width / 2, box.y - depth]),
+        ],
+        [
+          'last row, under',
+          last,
+          (box: DOMRect): Array<[number, number]> =>
+            [2.5, 3, 3.5].map((depth) => [box.x + box.width / 2, box.bottom + depth]),
+        ],
+      ] as const) {
+        (document.activeElement as HTMLElement | null)?.blur();
+        const before = await pixelsAround(link, at);
+        link.focus({ focusVisible: true });
+        await expect(link, `${name}: it has the focus`).toHaveFocus();
+        const after = await pixelsAround(link, at);
+        await expect(differs(after, before, SHADOW_SHOWN), `${name}: the ring is not clipped`).toBe(
+          true,
+        );
+        link.blur();
+      }
+
+      // More contrast and forced colours: a row of `bar` draws the ring inside.
+      for (const feature of [
+        { name: 'prefers-contrast', value: 'more' },
+        { name: 'forced-colors', value: 'active' },
+      ]) {
+        await session.send('Emulation.setEmulatedMedia', { features: [feature] });
+        try {
+          await waitFor(() =>
+            expect(matchMedia(`(${feature.name}: ${feature.value})`).matches).toBe(true),
+          );
+          // The current row is not one of them: its 3px bar is the colour of the ring, at the same edge.
+          for (const link of [links()[1]!, last]) {
+            const label = `${feature.name}, ${link.textContent}`;
+            (document.activeElement as HTMLElement | null)?.blur();
+            const inside = (box: DOMRect): Array<[number, number]> =>
+              ACROSS.map((depth) => [box.x + depth, box.y + box.height / 2]);
+            const before = await pixelsAround(link, inside);
+            link.focus({ focusVisible: true });
+            await expect(link, `${label}: it has the focus`).toHaveFocus();
+            await expect(getComputedStyle(link).outlineOffset, `${label}: drawn inside`).toBe(
+              '-2px',
+            );
+            const after = await pixelsAround(link, inside);
+            await expect(
+              differs(after, before, OUTLINE_SHOWN),
+              `${label}: the ring is painted inside the edge (${JSON.stringify(before)} before, ${JSON.stringify(after)} after)`,
+            ).toBe(true);
+            link.blur();
+          }
+        } finally {
+          await session.send('Emulation.setEmulatedMedia', { features: [] });
+        }
+      }
+    });
+  },
+};
+
+/**
+ * In forced colours the current item of a `pill` Nav has an outline of its own, drawn inside; with
+ * the keyboard focus it keeps the focus, whose ring is outside, in the text colour. Looked up in the
+ * computed style, since the colours are the system's.
+ */
+export const PillCurrentItemKeepsItsFocusRing: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <Panel>
+      <Menu variant="pill" />
+    </Panel>
+  ),
+  play: async ({ canvasElement }) => {
+    const { cdp, server } = await import('vitest/browser');
+    if (server.browser !== 'chromium') return;
+    const real = await realUserEvent();
+    if (!real) return;
+    const session = cdp();
+    const current = within(canvasElement).getByRole('link', { name: 'Overview' });
+    const colorOf = (name: string) => {
+      const probe = document.createElement('div');
+      probe.style.outline = `2px solid ${name}`;
+      document.body.append(probe);
+      const color = getComputedStyle(probe).outlineColor;
+      probe.remove();
+      return color;
+    };
+    await session.send('Emulation.setEmulatedMedia', {
+      features: [{ name: 'forced-colors', value: 'active' }],
+    });
+    try {
+      await waitFor(() => expect(matchMedia('(forced-colors: active)').matches).toBe(true));
+      const resting = getComputedStyle(current);
+      await expect(resting.outlineOffset).toBe('-2px');
+      await expect(resting.outlineColor).toBe(colorOf('Highlight'));
+      current.focus({ focusVisible: true });
+      await expect(current).toHaveFocus();
+      const focused = getComputedStyle(current);
+      await expect(focused.outlineOffset).toBe('2px');
+      await expect(focused.outlineColor).toBe(colorOf('CanvasText'));
+    } finally {
+      await session.send('Emulation.setEmulatedMedia', { features: [] });
+    }
+  },
+};
+
+/**
+ * On a phone the sidebar is a sheet, and a plain click on a link closes it and puts the focus back on
+ * the button that opened it. A click with a modifier key, which opens the link elsewhere, leaves it
+ * open. The click does not leave the story: the page, as an application's router would, takes it.
+ */
+export const ClosesTheSheet: Story = {
+  tags: ['no-visual'],
+  parameters: { stage: 'page' },
+  render: () => <InAShell variant="pill" narrow />,
+  play: async ({ canvasElement }) => {
+    await withViewport(async (viewport) => {
+      await viewport.set(390, 844);
+      const canvas = within(canvasElement);
+      const trigger = canvas.getByRole('button', { name: 'Open navigation' });
+      // The page takes the click after the library's handler has seen it, as a router does.
+      const keepHere = (event: Event) => event.preventDefault();
+      canvasElement.ownerDocument.addEventListener('click', keepHere);
+      try {
+        await userEvent.click(trigger);
+        const sheet = await canvas.findByRole('dialog', { name: 'Navigation' });
+        await expect(canvasElement.querySelector('.flg-app-shell')).toHaveAttribute('data-open');
+
+        // A click with a modifier key is the browser's, to open the link in another tab.
+        const inbox = within(sheet).getByRole('link', { name: 'Inbox 12' });
+        for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'] as const) {
+          inbox.dispatchEvent(
+            new MouseEvent('click', { bubbles: true, cancelable: true, [modifier]: true }),
+          );
+          await afterLayout();
+          await expect(canvasElement.querySelector('.flg-app-shell'), modifier).toHaveAttribute(
+            'data-open',
+          );
+        }
+
+        inbox.focus();
+        await userEvent.click(inbox);
+        await waitFor(() =>
+          expect(canvasElement.querySelector('.flg-app-shell')).not.toHaveAttribute('data-open'),
+        );
+        await expect(canvas.queryByRole('dialog')).toBeNull();
+        await waitFor(() =>
+          expect(canvas.getByRole('button', { name: 'Open navigation' })).toHaveFocus(),
+        );
+      } finally {
+        canvasElement.ownerDocument.removeEventListener('click', keepHere);
+      }
+    });
+  },
+};
diff --git a/src/components/nav/Nav.test-d.ts b/src/components/nav/Nav.test-d.ts
new file mode 100644
index 0000000..87ee4ad
--- /dev/null
+++ b/src/components/nav/Nav.test-d.ts
@@ -0,0 +1,66 @@
+import type { ReactNode, Ref } from 'react';
+import { expectTypeOf, test } from 'vitest';
+import type {
+  NavGroupProps,
+  NavItemProps,
+  NavLabels,
+  NavProps,
+  NavSectionProps,
+  NavVariant,
+} from './Nav';
+import { Nav, NavGroup, NavItem, NavSection } from './Nav';
+
+test('a Nav takes only the two looks of the mockup', () => {
+  expectTypeOf<NavVariant>().toEqualTypeOf<'pill' | 'bar'>();
+  expectTypeOf<NavProps['variant']>().toEqualTypeOf<NavVariant | undefined>();
+  // @ts-expect-error a look that was not chosen
+  const gradient: NavProps = { variant: 'gradient' };
+  // @ts-expect-error the look of another component
+  const inset: NavProps = { variant: 'inset' };
+  expectTypeOf(gradient).toBeObject();
+  expectTypeOf(inset).toBeObject();
+});
+
+test('the words of a Nav may be given in part', () => {
+  expectTypeOf<NonNullable<NavProps['labels']>>().toEqualTypeOf<Partial<NavLabels>>();
+  expectTypeOf<keyof NavLabels>().toEqualTypeOf<'nav'>();
+});
+
+test('a NavGroup needs a label, and takes its open state as the other components do', () => {
+  expectTypeOf<NavGroupProps['label']>().toEqualTypeOf<ReactNode>();
+  // @ts-expect-error a group without a name has no button to read
+  const missing: NavGroupProps = { children: null };
+  expectTypeOf(missing).toBeObject();
+  expectTypeOf<NavGroupProps['open']>().toEqualTypeOf<boolean | undefined>();
+  expectTypeOf<NavGroupProps['defaultOpen']>().toEqualTypeOf<boolean | undefined>();
+  expectTypeOf<NonNullable<NavGroupProps['onOpenChange']>>().parameters.toEqualTypeOf<[boolean]>();
+});
+
+test('a NavItem is an anchor with an icon, a badge and the state of the page', () => {
+  expectTypeOf<NavItemProps['href']>().toEqualTypeOf<string | undefined>();
+  expectTypeOf<NavItemProps['active']>().toEqualTypeOf<boolean | undefined>();
+  expectTypeOf<NavItemProps['disabled']>().toEqualTypeOf<boolean | undefined>();
+  expectTypeOf<NavItemProps['asChild']>().toEqualTypeOf<boolean | undefined>();
+  expectTypeOf<NavItemProps['badge']>().toEqualTypeOf<ReactNode>();
+  // @ts-expect-error a link without a label has no name
+  const missing: NavItemProps = { href: '/' };
+  expectTypeOf(missing).toBeObject();
+});
+
+test('the title of a section is any content, and a group or a section has no HTML title', () => {
+  expectTypeOf<NavSectionProps['title']>().toEqualTypeOf<ReactNode>();
+  expectTypeOf<NavSectionProps['bottom']>().toEqualTypeOf<boolean | undefined>();
+});
+
+test('each part forwards its ref to the element that carries its meaning', () => {
+  expectTypeOf<Parameters<typeof Nav>[0]['ref']>().toEqualTypeOf<Ref<HTMLElement> | undefined>();
+  expectTypeOf<Parameters<typeof NavSection>[0]['ref']>().toEqualTypeOf<
+    Ref<HTMLDivElement> | undefined
+  >();
+  expectTypeOf<Parameters<typeof NavItem>[0]['ref']>().toEqualTypeOf<
+    Ref<HTMLAnchorElement> | undefined
+  >();
+  expectTypeOf<Parameters<typeof NavGroup>[0]['ref']>().toEqualTypeOf<
+    Ref<HTMLLIElement> | undefined
+  >();
+});
diff --git a/src/components/nav/Nav.test.tsx b/src/components/nav/Nav.test.tsx
new file mode 100644
index 0000000..9247a22
--- /dev/null
+++ b/src/components/nav/Nav.test.tsx
@@ -0,0 +1,1159 @@
+import { fireEvent, render, screen, within } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { Fragment, createRef } from 'react';
+import type { ComponentProps, MouseEvent, ReactNode } from 'react';
+import { renderToString } from 'react-dom/server';
+import { beforeEach, describe, expect, it, vi } from 'vitest';
+import { IS_REACT_19 } from '../../internal/react-version';
+import { resetDevWarnings } from '../../internal/warn';
+import { AppShell, AppShellHeader, AppShellMain, AppShellSidebar } from '../app-shell/AppShell';
+import { Nav, NavGroup, NavItem, NavSection } from './Nav';
+
+beforeEach(() => {
+  resetDevWarnings();
+  vi.restoreAllMocks();
+});
+
+const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
+const warnings = (warn: ReturnType<typeof spyWarn>) => warn.mock.calls.map((call) => call[0]);
+const ICON = <svg data-testid="icon" />;
+// The name of a link with a count. The label and the count are two flex items, and the engines put a
+// space between flex items when they read a name; jsdom has no layout and writes them together, so the
+// tests allow either, and the stories (Names) check the real name in the three engines.
+const withCount = (label: string, count: string) => new RegExp(`^${label}\\s?${count}$`);
+
+/** The three kinds of item of the mockup, with its first and last parts: a plain list, a group, a foot. */
+function Sample(props: ComponentProps<typeof Nav>) {
+  return (
+    <Nav {...props}>
+      <NavItem href="/" icon={ICON} active>
+        Overview
+      </NavItem>
+      <NavItem href="/inbox" badge={12}>
+        Inbox
+      </NavItem>
+      <NavSection title="Projects">
+        <NavGroup label="Design" icon={ICON}>
+          <NavItem href="/design/system" active>
+            Design system
+          </NavItem>
+          <NavItem href="/design/mobile">Mobile</NavItem>
+        </NavGroup>
+        <NavGroup label="Engineering">
+          <NavItem href="/eng">Engineering home</NavItem>
+        </NavGroup>
+      </NavSection>
+      <NavSection bottom>
+        <NavItem href="/settings">Settings</NavItem>
+      </NavSection>
+    </Nav>
+  );
+}
+
+describe('Nav', () => {
+  it('is a navigation landmark named Main, in the pill look, with a list of its links', () => {
+    const { container } = render(<Sample />);
+    const nav = container.firstElementChild!;
+    expect(nav.tagName).toBe('NAV');
+    expect(nav).toHaveClass('flg-nav');
+    expect(nav).toHaveAttribute('data-variant', 'pill');
+    expect(screen.getByRole('navigation', { name: 'Main' })).toBe(nav);
+  });
+
+  it.each(['pill', 'bar'] as const)('reflects variant %s', (variant) => {
+    const { container } = render(<Sample variant={variant} />);
+    expect(container.firstElementChild).toHaveAttribute('data-variant', variant);
+  });
+
+  it('takes a variant outside the union for the default look', () => {
+    // @ts-expect-error not a variant: what plain JavaScript can pass
+    const { container } = render(<Sample variant="gradient" />);
+    expect(container.firstElementChild).toHaveAttribute('data-variant', 'pill');
+  });
+
+  it('keeps the look when `data-variant` is forwarded by a wrapper', () => {
+    const { container } = render(<Sample variant="bar" {...{ 'data-variant': 'pill' }} />);
+    expect(container.firstElementChild).toHaveAttribute('data-variant', 'bar');
+  });
+
+  it('takes its default name from `labels`, a key at a time, and keeps one given as undefined', () => {
+    const { rerender } = render(<Sample labels={{ nav: 'Principal' }} />);
+    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
+    rerender(<Sample labels={{ nav: undefined }} />);
+    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
+  });
+
+  it('keeps the name the caller gives, with aria-label or aria-labelledby, and adds none beside it', () => {
+    const { rerender } = render(<Sample aria-label="Docs" />);
+    expect(screen.getByRole('navigation', { name: 'Docs' })).toBeInTheDocument();
+    rerender(
+      <>
+        <h2 id="title">Site</h2>
+        <Sample aria-labelledby="title" />
+      </>,
+    );
+    const nav = screen.getByRole('navigation', { name: 'Site' });
+    expect(nav).not.toHaveAttribute('aria-label');
+  });
+
+  it('forwards the ref to the <nav> and puts className, style and other props on it', () => {
+    const ref = createRef<HTMLElement>();
+    const { container } = render(
+      <Nav ref={ref} className="mine" style={{ margin: 3 }} id="side">
+        <NavItem href="/a">A</NavItem>
+      </Nav>,
+    );
+    expect(ref.current).toBe(container.firstElementChild);
+    expect(ref.current).toHaveClass('flg-nav', 'mine');
+    expect(ref.current).toHaveStyle({ margin: '3px' });
+    expect(ref.current).toHaveAttribute('id', 'side');
+  });
+
+  it('renders nothing when there is nothing to show, and no landmark', () => {
+    const { container } = render(
+      <Nav>
+        {null}
+        {false}
+        <Fragment>{[]}</Fragment>
+      </Nav>,
+    );
+    expect(container).toBeEmptyDOMElement();
+  });
+
+  it('keeps the items that stand together outside a section in one list, and each section in its own', () => {
+    render(
+      <Nav>
+        <NavItem href="/a">A</NavItem>
+        <NavItem href="/b">B</NavItem>
+        <NavSection title="Group">
+          <NavItem href="/c">C</NavItem>
+        </NavSection>
+        <NavItem href="/d">D</NavItem>
+      </Nav>,
+    );
+    const lists = screen.getAllByRole('list');
+    expect(lists).toHaveLength(3);
+    expect(within(lists[0]!).getAllByRole('listitem')).toHaveLength(2);
+    expect(within(lists[1]!).getAllByRole('link', { name: 'C' })).toHaveLength(1);
+    expect(within(lists[2]!).getAllByRole('link', { name: 'D' })).toHaveLength(1);
+    // Safari drops the list semantics of a list with no bullets, so each list says it is one.
+    for (const list of lists) expect(list).toHaveAttribute('role', 'list');
+    expect(lists[1]!.closest('.flg-nav-section')).toHaveAttribute('role', 'group');
+  });
+
+  it('reads items and sections through Fragments and arrays, in order', () => {
+    render(
+      <Nav>
+        <Fragment>
+          <NavItem href="/a">A</NavItem>
+          {[
+            <NavItem key="b" href="/b">
+              B
+            </NavItem>,
+            <NavSection key="s" title="S">
+              <NavItem href="/c">C</NavItem>
+            </NavSection>,
+          ]}
+        </Fragment>
+      </Nav>,
+    );
+    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(['A', 'B', 'C']);
+    expect(screen.getAllByRole('list')).toHaveLength(2);
+  });
+
+  it('takes a component of the user’s own around an item for an item', () => {
+    function Mine() {
+      return <NavItem href="/mine">Mine</NavItem>;
+    }
+    render(
+      <Nav>
+        <Mine />
+        <NavItem href="/b">B</NavItem>
+      </Nav>,
+    );
+    const [list] = screen.getAllByRole('list');
+    expect(within(list!).getAllByRole('link')).toHaveLength(2);
+  });
+
+  it('keeps the state of an item whose key stays when another is put before it', async () => {
+    const user = userEvent.setup();
+    function Counted({ extra }: { extra: boolean }) {
+      return (
+        <Nav>
+          {extra ? (
+            <NavItem key="x" href="/x">
+              X
+            </NavItem>
+          ) : null}
+          <NavGroup key="g" label="G">
+            <NavItem href="/g">In G</NavItem>
+          </NavGroup>
+        </Nav>
+      );
+    }
+    const { rerender } = render(<Counted extra={false} />);
+    await user.click(screen.getByRole('button', { name: 'G' }));
+    expect(screen.getByRole('button', { name: 'G' })).toHaveAttribute('aria-expanded', 'true');
+    rerender(<Counted extra />);
+    expect(screen.getByRole('button', { name: 'G' })).toHaveAttribute('aria-expanded', 'true');
+  });
+
+  it('warns about a part outside a Nav, once each, and still renders it', () => {
+    const warn = spyWarn();
+    render(
+      <>
+        <NavItem href="/a">A</NavItem>
+        <NavGroup label="G" defaultOpen>
+          <NavItem href="/g">G</NavItem>
+        </NavGroup>
+        <NavSection title="S">
+          <NavItem href="/s">S</NavItem>
+        </NavSection>
+      </>,
+    );
+    expect(warnings(warn)).toEqual(
+      expect.arrayContaining([
+        expect.stringContaining(
+          '<NavItem> must be rendered inside <Nav>, <NavSection> or <NavGroup>.',
+        ),
+        expect.stringContaining(
+          '<NavGroup> must be rendered inside <Nav>, <NavSection> or <NavGroup>.',
+        ),
+        expect.stringContaining('<NavSection> must be a direct child of <Nav>.'),
+      ]),
+    );
+    expect(screen.getAllByRole('link')).toHaveLength(3);
+  });
+
+  it('warns about a NavSection that is not a direct child of the Nav', () => {
+    const warn = spyWarn();
+    render(
+      <Nav>
+        <NavSection title="Outer">
+          <NavSection title="Inner">
+            <NavItem href="/a">A</NavItem>
+          </NavSection>
+        </NavSection>
+      </Nav>,
+    );
+    expect(warnings(warn)).toEqual([
+      expect.stringContaining('<NavSection> must be a direct child of <Nav>.'),
+    ]);
+  });
+
+  it('warns about a group in a group, and renders it as a link of the first', () => {
+    const warn = spyWarn();
+    render(
+      <Nav>
+        <NavGroup label="Outer" defaultOpen>
+          <NavGroup label="Inner" defaultOpen>
+            <NavItem href="/a">A</NavItem>
+          </NavGroup>
+        </NavGroup>
+      </Nav>,
+    );
+    expect(warnings(warn)).toEqual([
+      expect.stringContaining('<NavGroup> inside <NavGroup> is not supported'),
+    ]);
+    expect(screen.getByRole('link', { name: 'A' })).toBeInTheDocument();
+  });
+
+  it('does not warn for a Nav that is used as it should be', () => {
+    const warn = spyWarn();
+    render(<Sample />);
+    expect(warn).not.toHaveBeenCalled();
+  });
+});
+
+describe('NavSection', () => {
+  it('is a group named by its title, with the title above its list', () => {
+    render(
+      <Nav>
+        <NavSection title="Projects">
+          <NavItem href="/a">A</NavItem>
+        </NavSection>
+      </Nav>,
+    );
+    const group = screen.getByRole('group', { name: 'Projects' });
+    expect(group).toHaveClass('flg-nav-section');
+    expect(group.firstElementChild).toHaveClass('flg-nav-section-title');
+    expect(group.firstElementChild).toHaveTextContent('Projects');
+    expect(group.lastElementChild!.tagName).toBe('UL');
+  });
+
+  it('is only a gap without a title: no role, no title', () => {
+    const { container } = render(
+      <Nav>
+        <NavSection>
+          <NavItem href="/a">A</NavItem>
+        </NavSection>
+      </Nav>,
+    );
+    const section = container.querySelector('.flg-nav-section')!;
+    expect(section).not.toHaveAttribute('role');
+    expect(section).not.toHaveAttribute('aria-labelledby');
+    expect(section.querySelector('.flg-nav-section-title')).toBeNull();
+  });
+
+  it('puts a rule above the items of the one at the foot, and marks it', () => {
+    const { container } = render(
+      <Nav>
+        <NavSection bottom>
+          <NavItem href="/a">A</NavItem>
+        </NavSection>
+        <NavSection>
+          <NavItem href="/b">B</NavItem>
+        </NavSection>
+      </Nav>,
+    );
+    const [bottom, other] = container.querySelectorAll('.flg-nav-section');
+    expect(bottom).toHaveAttribute('data-bottom');
+    expect(other).not.toHaveAttribute('data-bottom');
+    const rule = bottom!.firstElementChild!;
+    expect(rule).toHaveClass('flg-divider');
+    // A rule that only decorates is not a separator for a screen reader.
+    expect(rule).toHaveAttribute('role', 'none');
+    expect(other!.querySelector('.flg-divider')).toBeNull();
+  });
+
+  it('forwards the ref to its element and puts className and other props on it', () => {
+    const ref = createRef<HTMLDivElement>();
+    render(
+      <Nav>
+        <NavSection ref={ref} title="T" className="mine" data-x="1">
+          <NavItem href="/a">A</NavItem>
+        </NavSection>
+      </Nav>,
+    );
+    expect(ref.current).toBe(screen.getByRole('group', { name: 'T' }));
+    expect(ref.current).toHaveClass('flg-nav-section', 'mine');
+    expect(ref.current).toHaveAttribute('data-x', '1');
+  });
+
+  it('keeps the role and the name the caller gives', () => {
+    render(
+      <Nav>
+        <NavSection title="T" role="region" aria-label="Mine">
+          <NavItem href="/a">A</NavItem>
+        </NavSection>
+      </Nav>,
+    );
+    expect(screen.getByRole('region', { name: 'Mine' })).toBeInTheDocument();
+  });
+});
+
+describe('NavItem', () => {
+  it('is a link in a list item: the icon, then the label', () => {
+    render(
+      <Nav>
+        <NavItem href="/inbox" icon={ICON}>
+          Inbox
+        </NavItem>
+      </Nav>,
+    );
+    const link = screen.getByRole('link', { name: 'Inbox' });
+    expect(link.parentElement!.tagName).toBe('LI');
+    expect(link).toHaveClass('flg-nav-item');
+    expect(link).toHaveAttribute('href', '/inbox');
+    expect(Array.from(link.children).map((child) => child.className)).toEqual([
+      'flg-nav-item-icon',
+      'flg-nav-item-label',
+    ]);
+    expect(link.firstElementChild).toHaveAttribute('aria-hidden', 'true');
+    expect(link.firstElementChild).toContainElement(screen.getByTestId('icon'));
+  });
+
+  it('has no icon cell without an icon', () => {
+    const { container } = render(
+      <Nav>
+        <NavItem href="/a">A</NavItem>
+      </Nav>,
+    );
+    expect(container.querySelector('.flg-nav-item-icon')).toBeNull();
+  });
+
+  it('sets aria-current="page" for the active page, and for no other', () => {
+    render(
+      <Nav>
+        <NavItem href="/a" active>
+          A
+        </NavItem>
+        <NavItem href="/b">B</NavItem>
+      </Nav>,
+    );
+    expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('aria-current', 'page');
+    expect(screen.getByRole('link', { name: 'B' })).not.toHaveAttribute('aria-current');
+  });
+
+  it('follows `active` on a mounted item', () => {
+    const { rerender } = render(
+      <Nav>
+        <NavItem href="/a">A</NavItem>
+      </Nav>,
+    );
+    rerender(
+      <Nav>
+        <NavItem href="/a" active>
+          A
+        </NavItem>
+      </Nav>,
+    );
+    expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('aria-current', 'page');
+    rerender(
+      <Nav>
+        <NavItem href="/a">A</NavItem>
+      </Nav>,
+    );
+    expect(screen.getByRole('link', { name: 'A' })).not.toHaveAttribute('aria-current');
+  });
+
+  it('keeps an aria-current the caller gives', () => {
+    render(
+      <Nav>
+        <NavItem href="/a" active aria-current="step">
+          A
+        </NavItem>
+      </Nav>,
+    );
+    expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('aria-current', 'step');
+  });
+
+  it('forwards the ref to the link and puts className, style and other props on it', () => {
+    const ref = createRef<HTMLAnchorElement>();
+    render(
+      <Nav>
+        <NavItem
+          ref={ref}
+          href="/a"
+          className="mine"
+          style={{ margin: 3 }}
+          target="_blank"
+          title="T"
+        >
+          A
+        </NavItem>
+      </Nav>,
+    );
+    const link = screen.getByRole('link', { name: 'A' });
+    expect(ref.current).toBe(link);
+    expect(link).toHaveClass('flg-nav-item', 'mine');
+    expect(link).toHaveStyle({ margin: '3px' });
+    expect(link).toHaveAttribute('target', '_blank');
+    expect(link).toHaveAttribute('title', 'T');
+  });
+
+  describe('disabled', () => {
+    it('is a link that goes nowhere: no href, aria-disabled, out of the tab order', async () => {
+      const onClick = vi.fn();
+      render(
+        <Nav>
+          <NavItem href="/a" disabled onClick={onClick}>
+            Archive
+          </NavItem>
+          <NavItem href="/b">B</NavItem>
+        </Nav>,
+      );
+      const link = screen.getByRole('link', { name: 'Archive' });
+      expect(link).not.toHaveAttribute('href');
+      expect(link).toHaveAttribute('role', 'link');
+      expect(link).toHaveAttribute('aria-disabled', 'true');
+      await userEvent.setup().tab();
+      expect(screen.getByRole('link', { name: 'B' })).toHaveFocus();
+      fireEvent.click(link);
+      expect(onClick).not.toHaveBeenCalled();
+    });
+
+    it('with asChild: the child keeps its href, is marked, leaves the tab order and ignores presses', () => {
+      const onClick = vi.fn();
+      const onChildClick = vi.fn();
+      render(
+        <Nav>
+          <NavItem asChild disabled onClick={onClick}>
+            <a href="/a" onClick={onChildClick}>
+              Archive
+            </a>
+          </NavItem>
+        </Nav>,
+      );
+      const link = screen.getByRole('link', { name: 'Archive' });
+      expect(link).toHaveAttribute('href', '/a');
+      expect(link).toHaveAttribute('aria-disabled', 'true');
+      expect(link).toHaveAttribute('tabindex', '-1');
+      const notPrevented = fireEvent.click(link);
+      // The press is stopped before it reaches either handler, and the navigation with it.
+      expect(notPrevented).toBe(false);
+      expect(onClick).not.toHaveBeenCalled();
+      expect(onChildClick).not.toHaveBeenCalled();
+    });
+
+    it('is a link again when it stops being disabled', () => {
+      const { rerender } = render(
+        <Nav>
+          <NavItem href="/a" disabled>
+            A
+          </NavItem>
+        </Nav>,
+      );
+      rerender(
+        <Nav>
+          <NavItem href="/a">A</NavItem>
+        </Nav>,
+      );
+      const link = screen.getByRole('link', { name: 'A' });
+      expect(link).toHaveAttribute('href', '/a');
+      expect(link).not.toHaveAttribute('aria-disabled');
+    });
+  });
+
+  describe('asChild', () => {
+    it('renders the child as the link: it keeps its props, its content is the label, the cells wrap it', () => {
+      const ref = createRef<HTMLAnchorElement>();
+      const onClick = vi.fn((event) => event.preventDefault());
+      render(
+        <Nav>
+          <NavItem asChild ref={ref} icon={ICON} badge={3} active className="mine">
+            <a href="/inbox" className="router" data-router onClick={onClick}>
+              Inbox
+            </a>
+          </NavItem>
+        </Nav>,
+      );
+      const link = screen.getByRole('link', { name: withCount('Inbox', '3') });
+      expect(ref.current).toBe(link);
+      expect(link).toHaveAttribute('href', '/inbox');
+      expect(link).toHaveAttribute('data-router');
+      expect(link).toHaveAttribute('aria-current', 'page');
+      expect(link).toHaveClass('flg-nav-item', 'router', 'mine');
+      expect(Array.from(link.children).map((child) => child.className)).toEqual([
+        'flg-nav-item-icon',
+        'flg-nav-item-label',
+        'flg-badge flg-nav-item-badge',
+      ]);
+      expect(link.querySelector('.flg-nav-item-label')).toHaveTextContent('Inbox');
+      fireEvent.click(link);
+      expect(onClick).toHaveBeenCalledTimes(1);
+    });
+
+    it('takes a child that a Server Component handed over as a lazy reference', () => {
+      if (!IS_REACT_19) return;
+      const lazy = {
+        $$typeof: Symbol.for('react.lazy'),
+        _payload: <a href="/a">Lazy</a>,
+        _init: (value: unknown) => value,
+      } as unknown as ReactNode;
+      render(
+        <Nav>
+          <NavItem asChild icon={ICON}>
+            {lazy}
+          </NavItem>
+        </Nav>,
+      );
+      const link = screen.getByRole('link', { name: 'Lazy' });
+      expect(link).toHaveClass('flg-nav-item');
+      expect(link.querySelector('.flg-nav-item-icon')).not.toBeNull();
+    });
+
+    it('warns, and renders nothing, when the child is not one element', () => {
+      const warn = spyWarn();
+      render(
+        <Nav>
+          <NavItem asChild>text</NavItem>
+        </Nav>,
+      );
+      expect(warnings(warn)).toEqual([expect.stringContaining('`asChild` expects exactly one')]);
+    });
+  });
+
+  describe('badge', () => {
+    it('is a neutral Badge in the pill look, and part of the name of the link', () => {
+      render(
+        <Nav>
+          <NavItem href="/inbox" badge={12}>
+            Inbox
+          </NavItem>
+        </Nav>,
+      );
+      const link = screen.getByRole('link', { name: withCount('Inbox', '12') });
+      const badge = link.lastElementChild!;
+      expect(badge).toHaveClass('flg-badge', 'flg-nav-item-badge');
+      expect(badge).toHaveAttribute('data-variant', 'neutral');
+      expect(badge).toHaveTextContent('12');
+    });
+
+    it('is a bare count in the bar look, with no Badge', () => {
+      const { container } = render(
+        <Nav variant="bar">
+          <NavItem href="/inbox" badge="12">
+            Inbox
+          </NavItem>
+        </Nav>,
+      );
+      expect(container.querySelector('.flg-badge')).toBeNull();
+      const count = container.querySelector('.flg-nav-item-count')!;
+      expect(count).toHaveTextContent('12');
+      expect(screen.getByRole('link', { name: withCount('Inbox', '12') })).toContainElement(
+        count as HTMLElement,
+      );
+    });
+
+    it('shows 0 and a short text, and nothing for what renders nothing', () => {
+      const { container } = render(
+        <Nav>
+          <NavItem href="/a" badge={0}>
+            A
+          </NavItem>
+          <NavItem href="/b" badge="new">
+            B
+          </NavItem>
+          <NavItem href="/c" badge="">
+            C
+          </NavItem>
+          <NavItem href="/d" badge={null}>
+            D
+          </NavItem>
+          <NavItem href="/e" badge={false}>
+            E
+          </NavItem>
+        </Nav>,
+      );
+      expect(screen.getByRole('link', { name: withCount('A', '0') })).toBeInTheDocument();
+      expect(screen.getByRole('link', { name: withCount('B', 'new') })).toBeInTheDocument();
+      expect(container.querySelectorAll('.flg-badge')).toHaveLength(2);
+      for (const name of ['C', 'D', 'E']) {
+        expect(screen.getByRole('link', { name })).toBeInTheDocument();
+      }
+    });
+
+    it('puts an element in the last cell as it is, in either look', () => {
+      const badge = <em data-testid="mine">12 unread</em>;
+      const { rerender } = render(
+        <Nav>
+          <NavItem href="/a" badge={badge}>
+            A
+          </NavItem>
+        </Nav>,
+      );
+      const link = screen.getByRole('link', { name: withCount('A', '12 unread') });
+      expect(link.lastElementChild).toBe(screen.getByTestId('mine'));
+      rerender(
+        <Nav variant="bar">
+          <NavItem href="/a" badge={badge}>
+            A
+          </NavItem>
+        </Nav>,
+      );
+      expect(screen.getByRole('link', { name: withCount('A', '12 unread') }).lastElementChild).toBe(
+        screen.getByTestId('mine'),
+      );
+    });
+
+    it('is drawn again when the look of a mounted Nav changes', () => {
+      const { container, rerender } = render(
+        <Nav variant="pill">
+          <NavItem href="/a" badge={5}>
+            A
+          </NavItem>
+        </Nav>,
+      );
+      expect(container.querySelector('.flg-badge')).not.toBeNull();
+      rerender(
+        <Nav variant="bar">
+          <NavItem href="/a" badge={5}>
+            A
+          </NavItem>
+        </Nav>,
+      );
+      expect(container.querySelector('.flg-badge')).toBeNull();
+      expect(container.querySelector('.flg-nav-item-count')).toHaveTextContent('5');
+    });
+  });
+
+  it('does not need an AppShell: a click goes to the handler and nothing else happens', () => {
+    const onClick = vi.fn((event) => event.preventDefault());
+    render(
+      <Nav>
+        <NavItem href="/a" onClick={onClick}>
+          A
+        </NavItem>
+      </Nav>,
+    );
+    fireEvent.click(screen.getByRole('link', { name: 'A' }));
+    expect(onClick).toHaveBeenCalledTimes(1);
+  });
+});
+
+describe('NavGroup', () => {
+  it('is a list item with a button and a list of links that the button names', () => {
+    const { container } = render(
+      <Nav>
+        <NavGroup label="Design" icon={ICON} defaultOpen>
+          <NavItem href="/a">A</NavItem>
+        </NavGroup>
+      </Nav>,
+    );
+    const group = container.querySelector('li.flg-nav-group')!;
+    const button = screen.getByRole('button', { name: 'Design' });
+    expect(button.parentElement).toBe(group);
+    expect(button).toHaveAttribute('type', 'button');
+    expect(button).toHaveClass('flg-nav-item');
+    expect(Array.from(button.children).map((child) => child.getAttribute('class'))).toEqual([
+      'flg-nav-item-icon',
+      'flg-nav-item-label',
+      'flg-nav-group-chevron',
+    ]);
+    // The chevron only shows the state, which `aria-expanded` says.
+    expect(button.lastElementChild).toHaveAttribute('aria-hidden', 'true');
+    const sub = group.querySelector('.flg-nav-sub')!;
+    expect(button).toHaveAttribute('aria-controls', sub.id);
+    expect(sub.id).not.toBe('');
+    const list = screen.getByRole('list', { name: 'Design' });
+    expect(sub).toContainElement(list);
+    expect(list).toHaveAttribute('role', 'list');
+    expect(within(list).getByRole('link', { name: 'A' })).toBeInTheDocument();
+  });
+
+  it('is closed from the start, with its links hidden, when no link of it is active', () => {
+    const { container } = render(
+      <Nav>
+        <NavGroup label="Design">
+          <NavItem href="/a">A</NavItem>
+        </NavGroup>
+      </Nav>,
+    );
+    const button = screen.getByRole('button', { name: 'Design' });
+    expect(button).toHaveAttribute('aria-expanded', 'false');
+    expect(container.querySelector('.flg-nav-sub')).toHaveAttribute('hidden');
+    expect(container.querySelector('.flg-nav-group')).not.toHaveAttribute('data-open');
+    expect(screen.queryByRole('link', { name: 'A' })).toBeNull();
+  });
+
+  it('is open from the start when a direct link is active, and says it has the page', () => {
+    const { container } = render(
+      <Nav>
+        <NavGroup label="Design">
+          <NavItem href="/a">A</NavItem>
+          <NavItem href="/b" active>
+            B
+          </NavItem>
+        </NavGroup>
+      </Nav>,
+    );
+    expect(screen.getByRole('button', { name: 'Design' })).toHaveAttribute('aria-expanded', 'true');
+    const group = container.querySelector('.flg-nav-group')!;
+    expect(group).toHaveAttribute('data-open');
+    expect(group).toHaveAttribute('data-has-active');
+    expect(container.querySelector('.flg-nav-sub')).not.toHaveAttribute('hidden');
+  });
+
+  it('is open in the HTML from the server, where no effect has run', () => {
+    const html = renderToString(
+      <Nav>
+        <NavGroup label="Design">
+          <NavItem href="/a" active>
+            A
+          </NavItem>
+        </NavGroup>
+        <NavGroup label="Other">
+          <NavItem href="/b">B</NavItem>
+        </NavGroup>
+      </Nav>,
+    );
+    const root = document.createElement('div');
+    root.innerHTML = html;
+    const [design, other] = root.querySelectorAll('.flg-nav-group');
+    expect(design).toHaveAttribute('data-open');
+    expect(design!.querySelector('.flg-nav-sub')).not.toHaveAttribute('hidden');
+    expect(design!.querySelector('button')).toHaveAttribute('aria-expanded', 'true');
+    expect(other).not.toHaveAttribute('data-open');
+    expect(other!.querySelector('.flg-nav-sub')).toHaveAttribute('hidden');
+  });
+
+  it('finds an active link through Fragments and arrays', () => {
+    render(
+      <Nav>
+        <NavGroup label="Design">
+          <Fragment>
+            <NavItem href="/a">A</NavItem>
+            {[
+              <NavItem key="b" href="/b" active>
+                B
+              </NavItem>,
+            ]}
+          </Fragment>
+        </NavGroup>
+      </Nav>,
+    );
+    expect(screen.getByRole('button', { name: 'Design' })).toHaveAttribute('aria-expanded', 'true');
+  });
+
+  // Only Server Components hand a child over as a lazy reference, and they need React 19.
+  it.runIf(IS_REACT_19)('finds an active link that came as a lazy reference', () => {
+    const lazy = {
+      $$typeof: Symbol.for('react.lazy'),
+      _payload: (
+        <NavItem href="/b" active>
+          B
+        </NavItem>
+      ),
+      _init: (value: unknown) => value,
+    } as unknown as ReactNode;
+    render(
+      <Nav>
+        <NavGroup label="Design">{lazy}</NavGroup>
+      </Nav>,
+    );
+    expect(screen.getByRole('button', { name: 'Design' })).toHaveAttribute('aria-expanded', 'true');
+  });
+
+  it('does not see an active link inside a component of the user’s own; defaultOpen opens it', () => {
+    function Mine() {
+      return (
+        <NavItem href="/b" active>
+          B
+        </NavItem>
+      );
+    }
+    const { container, unmount } = render(
+      <Nav>
+        <NavGroup label="Design">
+          <Mine />
+        </NavGroup>
+      </Nav>,
+    );
+    expect(screen.getByRole('button', { name: 'Design' })).toHaveAttribute(
+      'aria-expanded',
+      'false',
+    );
+    expect(container.querySelector('.flg-nav-group')).not.toHaveAttribute('data-has-active');
+    unmount();
+    render(
+      <Nav>
+        <NavGroup label="Design" defaultOpen>
+          <Mine />
+        </NavGroup>
+      </Nav>,
+    );
+    expect(screen.getByRole('button', { name: 'Design' })).toHaveAttribute('aria-expanded', 'true');
+  });
+
+  it('opens with defaultOpen whatever its links say, and stays closed with defaultOpen={false}', () => {
+    render(
+      <Nav>
+        <NavGroup label="One" defaultOpen>
+          <NavItem href="/a">A</NavItem>
+        </NavGroup>
+        <NavGroup label="Two" defaultOpen={false}>
+          <NavItem href="/b" active>
+            B
+          </NavItem>
+        </NavGroup>
+      </Nav>,
+    );
+    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-expanded', 'true');
+    expect(screen.getByRole('button', { name: 'Two' })).toHaveAttribute('aria-expanded', 'false');
+  });
+
+  it('opens and closes on a click, and tells onOpenChange', async () => {
+    const user = userEvent.setup();
+    const onOpenChange = vi.fn();
+    const { container } = render(
+      <Nav>
+        <NavGroup label="Design" onOpenChange={onOpenChange}>
+          <NavItem href="/a">A</NavItem>
+        </NavGroup>
+      </Nav>,
+    );
+    const button = screen.getByRole('button', { name: 'Design' });
+    await user.click(button);
+    expect(button).toHaveAttribute('aria-expanded', 'true');
+    expect(container.querySelector('.flg-nav-group')).toHaveAttribute('data-open');
+    expect(screen.getByRole('link', { name: 'A' })).toBeVisible();
+    expect(onOpenChange).toHaveBeenLastCalledWith(true);
+    await user.click(button);
+    expect(button).toHaveAttribute('aria-expanded', 'false');
+    expect(container.querySelector('.flg-nav-sub')).toHaveAttribute('hidden');
+    expect(container.querySelector('.flg-nav-group')).not.toHaveAttribute('data-open');
+    expect(onOpenChange).toHaveBeenLastCalledWith(false);
+  });
+
+  it.each([['{Enter}'], [' ']])('opens and closes from the keyboard with %j', async (key) => {
+    const user = userEvent.setup();
+    render(
+      <Nav>
+        <NavGroup label="Design">
+          <NavItem href="/a">A</NavItem>
+        </NavGroup>
+      </Nav>,
+    );
+    await user.tab();
+    const button = screen.getByRole('button', { name: 'Design' });
+    expect(button).toHaveFocus();
+    await user.keyboard(key);
+    expect(button).toHaveAttribute('aria-expanded', 'true');
+    await user.keyboard(key);
+    expect(button).toHaveAttribute('aria-expanded', 'false');
+  });
+
+  it('is the parent’s to open when controlled: a click only asks', async () => {
+    const user = userEvent.setup();
+    const onOpenChange = vi.fn();
+    const { rerender } = render(
+      <Nav>
+        <NavGroup label="Design" open={false} onOpenChange={onOpenChange}>
+          <NavItem href="/a">A</NavItem>
+        </NavGroup>
+      </Nav>,
+    );
+    const button = screen.getByRole('button', { name: 'Design' });
+    await user.click(button);
+    expect(onOpenChange).toHaveBeenCalledWith(true);
+    expect(button).toHaveAttribute('aria-expanded', 'false');
+    rerender(
+      <Nav>
+        <NavGroup label="Design" open onOpenChange={onOpenChange}>
+          <NavItem href="/a">A</NavItem>
+        </NavGroup>
+      </Nav>,
+    );
+    expect(button).toHaveAttribute('aria-expanded', 'true');
+  });
+
+  it('follows a change of the active link on a mounted group: it says it has the page, and keeps its state', () => {
+    const Group = ({ active }: { active: boolean }) => (
+      <Nav>
+        <NavGroup label="Design">
+          <NavItem href="/a" active={active}>
+            A
+          </NavItem>
+        </NavGroup>
+      </Nav>
+    );
+    const { container, rerender } = render(<Group active={false} />);
+    expect(container.querySelector('.flg-nav-group')).not.toHaveAttribute('data-has-active');
+    rerender(<Group active />);
+    expect(container.querySelector('.flg-nav-group')).toHaveAttribute('data-has-active');
+    // Opening is the start state only: a page reached later does not open a group the person closed.
+    expect(screen.getByRole('button', { name: 'Design' })).toHaveAttribute(
+      'aria-expanded',
+      'false',
+    );
+  });
+
+  it('forwards the ref to the <li> and puts className, style and other props on it', () => {
+    const ref = createRef<HTMLLIElement>();
+    const { container } = render(
+      <Nav>
+        <NavGroup ref={ref} label="G" className="mine" style={{ margin: 3 }} data-x="1">
+          <NavItem href="/a">A</NavItem>
+        </NavGroup>
+      </Nav>,
+    );
+    const group = container.querySelector('li.flg-nav-group');
+    expect(ref.current).toBe(group);
+    expect(group).toHaveClass('mine');
+    expect(group).toHaveStyle({ margin: '3px' });
+    expect(group).toHaveAttribute('data-x', '1');
+  });
+
+  it('keeps the state it draws from after the props of a wrapper', () => {
+    const { container } = render(
+      <Nav>
+        <NavGroup label="G" {...{ 'data-open': '' }}>
+          <NavItem href="/a">A</NavItem>
+        </NavGroup>
+      </Nav>,
+    );
+    expect(container.querySelector('.flg-nav-group')).not.toHaveAttribute('data-open');
+  });
+});
+
+describe('inside an AppShell', () => {
+  const trigger = () => document.querySelector<HTMLElement>('.flg-app-shell-trigger')!;
+
+  function Shell({ nav, ...props }: { nav?: ReactNode } & ComponentProps<typeof AppShell>) {
+    return (
+      <AppShell {...props}>
+        <AppShellHeader>Header</AppShellHeader>
+        <AppShellSidebar>
+          {nav ?? (
+            <Nav>
+              <NavItem href="#one">One</NavItem>
+              <NavItem href="#two">Two</NavItem>
+            </Nav>
+          )}
+        </AppShellSidebar>
+        <AppShellMain>Main</AppShellMain>
+      </AppShell>
+    );
+  }
+
+  const isOpen = (container: HTMLElement) => container.firstElementChild!.hasAttribute('data-open');
+
+  it('closes the sheet on a plain click and gives the focus back to the trigger', () => {
+    const { container } = render(<Shell />);
+    fireEvent.click(trigger());
+    expect(isOpen(container)).toBe(true);
+    const link = screen.getByRole('link', { name: 'One' });
+    link.focus();
+    // After the commit React gives the focus back to the element that had it, which jsdom still
+    // shows (a sidebar that is not displayed is not a thing here), so the test asks what the shell
+    // focused; the stories check where the focus ends in the real engines.
+    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
+    fireEvent.click(link);
+    expect(isOpen(container)).toBe(false);
+    expect(focus.mock.contexts).toContain(trigger());
+  });
+
+  it.each([['ctrlKey'], ['metaKey'], ['shiftKey'], ['altKey']])(
+    'leaves the sheet open for a click with %s',
+    (modifier) => {
+      const { container } = render(<Shell defaultOpen />);
+      fireEvent.click(screen.getByRole('link', { name: 'One' }), { [modifier]: true });
+      expect(isOpen(container)).toBe(true);
+    },
+  );
+
+  it('leaves the sheet open when the caller’s handler took the click (defaultPrevented)', () => {
+    const { container } = render(
+      <Shell
+        defaultOpen
+        nav={
+          <Nav>
+            <NavItem href="#one" onClick={(event) => event.preventDefault()}>
+              One
+            </NavItem>
+          </Nav>
+        }
+      />,
+    );
+    fireEvent.click(screen.getByRole('link', { name: 'One' }));
+    expect(isOpen(container)).toBe(true);
+  });
+
+  it('closes the sheet for a router link, which calls the handler it is given before it navigates', () => {
+    const navigate = vi.fn();
+    function RouterLink({
+      onClick,
+      ...props
+    }: ComponentProps<'a'> & { onClick?: (event: MouseEvent<HTMLAnchorElement>) => void }) {
+      return (
+        // The content is the `children` that the item hands to the link it clones.
+        // eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
+        <a
+          {...props}
+          onClick={(event) => {
+            onClick?.(event);
+            if (!event.defaultPrevented) {
+              event.preventDefault();
+              navigate();
+            }
+          }}
+        />
+      );
+    }
+    const { container } = render(
+      <Shell
+        defaultOpen
+        nav={
+          <Nav>
+            <NavItem asChild>
+              <RouterLink href="/one">One</RouterLink>
+            </NavItem>
+          </Nav>
+        }
+      />,
+    );
+    fireEvent.click(screen.getByRole('link', { name: 'One' }));
+    expect(navigate).toHaveBeenCalledTimes(1);
+    expect(isOpen(container)).toBe(false);
+  });
+
+  it('leaves the sheet open for a disabled item', () => {
+    const { container } = render(
+      <Shell
+        defaultOpen
+        nav={
+          <Nav>
+            <NavItem href="#one" disabled>
+              One
+            </NavItem>
+          </Nav>
+        }
+      />,
+    );
+    fireEvent.click(screen.getByRole('link', { name: 'One' }));
+    expect(isOpen(container)).toBe(true);
+  });
+
+  it('leaves the sheet open for the button of a group', () => {
+    const { container } = render(
+      <Shell
+        defaultOpen
+        nav={
+          <Nav>
+            <NavGroup label="G">
+              <NavItem href="#one">One</NavItem>
+            </NavGroup>
+          </Nav>
+        }
+      />,
+    );
+    fireEvent.click(screen.getByRole('button', { name: 'G' }));
+    expect(isOpen(container)).toBe(true);
+    fireEvent.click(screen.getByRole('link', { name: 'One' }));
+    expect(isOpen(container)).toBe(false);
+  });
+
+  it('closes a sheet that the parent owns by asking it, once', () => {
+    const onOpenChange = vi.fn();
+    render(<Shell open onOpenChange={onOpenChange} />);
+    fireEvent.click(screen.getByRole('link', { name: 'One' }));
+    expect(onOpenChange).toHaveBeenCalledTimes(1);
+    expect(onOpenChange).toHaveBeenCalledWith(false);
+  });
+
+  it('asks nothing of a shell whose sheet is closed', () => {
+    const onOpenChange = vi.fn();
+    render(<Shell onOpenChange={onOpenChange} />);
+    fireEvent.click(screen.getByRole('link', { name: 'One' }));
+    expect(onOpenChange).not.toHaveBeenCalled();
+  });
+
+  // The links read the part of the shell that does not change with its brand and its words. A shell
+  // whose parent passes `brand` and `labels` inline gives both a new identity at every render, and
+  // would otherwise render every link of the navigation again. The link below is an element of the
+  // test's own that the item clones at each render of its own, so it renders exactly when the item does.
+  it('does not render again when the shell renders with a new brand and new labels', () => {
+    const renders = vi.fn();
+    function CountedLink(props: ComponentProps<'a'>) {
+      renders();
+      // eslint-disable-next-line jsx-a11y/anchor-has-content
+      return <a {...props} />;
+    }
+    // One element, made once: the parent's render does not make the items again, as for a navigation
+    // that comes from another component.
+    const navigation = (
+      <Nav>
+        <NavItem asChild>
+          <CountedLink href="#one">One</CountedLink>
+        </NavItem>
+      </Nav>
+    );
+    function Page({ tick }: { tick: number }) {
+      return (
+        <AppShell brand={<b>Brand {tick}</b>} labels={{ skipToContent: `Skip ${tick}` }}>
+          <AppShellSidebar>{navigation}</AppShellSidebar>
+          <AppShellMain>Main</AppShellMain>
+        </AppShell>
+      );
+    }
+    const { rerender } = render(<Page tick={0} />);
+    const mounted = renders.mock.calls.length;
+    expect(mounted).toBeGreaterThan(0);
+    rerender(<Page tick={1} />);
+    rerender(<Page tick={2} />);
+    expect(screen.getAllByText(/Brand 2/).length).toBeGreaterThan(0);
+    expect(screen.getByRole('link', { name: 'Skip 2' })).toBeInTheDocument();
+    expect(renders).toHaveBeenCalledTimes(mounted);
+  });
+});
diff --git a/src/docs/ExceptionTable.test.tsx b/src/docs/ExceptionTable.test.tsx
index 37202a1..5597658 100644
--- a/src/docs/ExceptionTable.test.tsx
+++ b/src/docs/ExceptionTable.test.tsx
@@ -14,9 +14,9 @@ describe('ExceptionTable', () => {
       .getAllByRole('cell')
       .map((cell) => cell.textContent);
 
-  it('lists the thirty-four rows of spec §4.9 with light and dark measurements', () => {
+  it('lists the thirty-five rows of spec §4.9 with light and dark measurements', () => {
     const rows = bodyRows();
-    expect(rows).toHaveLength(34);
+    expect(rows).toHaveLength(35);
     expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
       '1',
       '2',
@@ -52,6 +52,7 @@ describe('ExceptionTable', () => {
       '32',
       '33',
       '34',
+      '35',
     ]);
     expect(rows[3]).toHaveTextContent('meets AA (4.74:1)');
     expect(rows[3]).toHaveTextContent('3.63:1 / 2.24:1');
@@ -98,6 +99,8 @@ describe('ExceptionTable', () => {
     expect(cells(rows[31]!).slice(1, 3)).toEqual(['2.80:1', '3.03:1']);
     expect(cells(rows[32]!).slice(1, 3)).toEqual(['3.09:1', '3.71:1 / 3.37:1']);
     expect(cells(rows[33]!).slice(1, 3)).toEqual(['2.97:1', '3.27:1']);
+    // The bar of the current item of a Nav `bar` on its tint (spec phase 5 §4.4): under 3:1 in both.
+    expect(cells(rows[34]!).slice(1, 3)).toEqual(['2.52:1', '2.03:1']);
   });
 
   it('shows the live measurement for a theme with no exception in a row', () => {
@@ -144,6 +147,7 @@ describe('ExceptionTable', () => {
       '1.4.3',
       '1.4.3',
       '1.4.3',
+      '1.4.11',
     ]);
     expect(cells(rows[3]!).at(-2)).toBe('4.5:1 text, 3:1 check marks');
     expect(cells(rows[0]!).at(-2)).toBe('3:1');
diff --git a/src/index.test.ts b/src/index.test.ts
index eb37012..f53dd03 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -79,6 +79,10 @@ describe('public API', () => {
       'MenuSub',
       'MenuSubContent',
       'MenuSubTrigger',
+      'Nav',
+      'NavGroup',
+      'NavItem',
+      'NavSection',
       'NumberInput',
       'Pagination',
       'Popover',
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/nav src/components/app-shell src/index.test.ts src/docs
pnpm vitest run --project scripts scripts/lib/contrast.test.ts
```

Expected: FAIL.
- `Nav.test.tsx` không nạp được ở cả hai project React (`Failed to resolve import "./Nav" from "src/components/nav/Nav.test.tsx". Does the file exist?`), nên không test nào của nó chạy. `Nav.test-d.ts` báo lỗi kiểu vì module chưa có.
- `public API > exports exactly the documented components and nothing internal`: thiếu `Nav`, `NavGroup`, `NavItem`, `NavSection`.
- `ExceptionTable > lists the thirty-five rows of spec §4.9 with light and dark measurements` và `names the WCAG criterion and minimum of every row` fail: bảng còn 34 dòng.
- `contrast.test.ts`, ``the Nav `bar` checks (spec phase 5 §4.4)``: fail vì ba check chưa có (`expected undefined to be 3`; ở bốn chế độ `expected [ undefined, undefined, undefined ] to deeply equal [ 2.52, 8.24, 3.28 ]` và cùng dạng); `records the bar as the two exceptions of row 35, and nothing else of the Nav` fail vì chưa có ngoại lệ của dòng 35.
- `AppShell > hands a new brand and new words to the header, the sidebar and the trigger of a mounted shell` PASS: test đặc tả (phát hiện 6). Mọi test khác của `src/components/app-shell` và `src/docs` pass.

Story không chạy ở bước này: `Nav.stories.tsx` import `Nav`, chưa có.

Theo báo cáo của bản nháp (phát hiện 16):
- Unit test được viết trước và chạy trên một stub (cả bốn phần là `<div>{children}</div>`): 64 trong 67 test lúc đó fail ở một project; 3 test pass là test cảnh báo mà stub thoả tình cờ. Ví dụ: `Nav > is a navigation landmark named Main, in the pill look, with a list of its links` (không có phần tử `nav`), `keeps the items that stand together outside a section in one list, and each section in its own` (`getAllByRole('list')` không thấy gì), `NavGroup > is open in the HTML from the server, where no effect has run`, các ca `inside an AppShell` (không có link để bấm).
- Với component thật, hai test bắt được hai lỗi thật, đã sửa: `keeps the state of an item whose key stays when another is put before it` (đoạn mount lại) và `NavSection > keeps the role and the name the caller gives` (`aria-labelledby` của lib thắng `aria-label` của người dùng) (phát hiện 4).
- `inside an AppShell > does not render again when the shell renders with a new brand and new labels` fail trước khi tách context, ở cả hai project: `expected "vi.fn()" to be called 1 times, but got 3 times` (phát hiện 6).
- Test của ba check tương phản viết sau code (số ra bằng số của spec ngay lần đầu): ở bản nháp chúng là đặc tả, fail nếu một token trôi. Lần chạy `check:contrast` đầu chỉ fail ở `nav-bar-indicator` 2.52 / 2.03, tức dòng 35 (phát hiện 7). `Nav.test-d.ts` viết sau code (đặc tả).
- Story viết cùng code. `FocusRings` bản đầu lấy mẫu hàng đầu ở `prefers-contrast` và không thấy đổi, vì hàng đang chọn có vạch 3px cùng màu với vòng ở mép đó; nay đọc hàng thứ hai và hàng cuối. Đột biến `outline-offset: 2px` ở quy tắc `bar` thì nó fail ở Chromium: `prefers-contrast, Inbox12: drawn inside: expected '2px' to be '-2px'`.

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index b7e38ff..517940c 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -313,17 +313,17 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | # | Điểm | Light | Dark | Ngưỡng | Tiêu chí WCAG |
 |---|---|---|---|---|---|
 | 1 | Viền control (input, ô checkbox, radio, switch tắt) so với nền | 1.28:1 | 1.31:1 | 3:1 | 1.4.11 |
-| 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus), và nút của bước Stepper, và hàng của List, và nút sắp xếp cùng khung cuộn của Table, và liên kết của AppShellBrand cùng skip link của AppShell | 1.20:1 | 1.23:1 | 3:1 | 1.4.11 |
+| 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus), và nút của bước Stepper, và hàng của List, và nút sắp xếp cùng khung cuộn của Table, và liên kết của AppShellBrand cùng skip link của AppShell, và mục cùng nút nhóm của Nav | 1.20:1 | 1.23:1 | 3:1 | 1.4.11 |
 | 3 | Viền Input/Textarea khi focus (control không lỗi) | đạt (4.45:1) | 2.06:1 | 3:1 | 1.4.11 |
 | 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
 | 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) và vạch dưới tab `underline` đang chọn, so với nền; thanh của bước đã xong (Stepper `bars`) | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
-| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin`; ở Stepper: số, tên và mô tả của bước chưa tới, mô tả của mọi bước, dòng "Step N" của bước chưa tới; ở List: mô tả và chữ ở ô cuối của hàng; ở Table `striped` và `minimal`: tiêu đề cột và icon của cột chưa sắp; ở AppShell: chữ của footer | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
-| 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn, trang hiện tại của Pagination; tiêu đề bước hiện tại của Stepper `compact`, tiêu đề hàng hiện tại của List | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
-| 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn, trang hiện tại của Pagination; viên thuốc của bước hiện tại (Stepper `compact`), nền hàng hiện tại của List | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
+| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin`; ở Stepper: số, tên và mô tả của bước chưa tới, mô tả của mọi bước, dòng "Step N" của bước chưa tới; ở List: mô tả và chữ ở ô cuối của hàng; ở Table `striped` và `minimal`: tiêu đề cột và icon của cột chưa sắp; ở AppShell: chữ của footer; ở Nav: tiêu đề mục và số đếm trần của `bar` | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
+| 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn, trang hiện tại của Pagination; tiêu đề bước hiện tại của Stepper `compact`, tiêu đề hàng hiện tại của List, chữ và icon của mục đang chọn Nav `pill` | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
+| 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn, trang hiện tại của Pagination; viên thuốc của bước hiện tại (Stepper `compact`), nền hàng hiện tại của List, nền mục đang chọn của Nav `pill` | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
 | 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ; dòng gợi ý của vùng thả FileUpload khi đang kéo; mô tả của bước hiện tại trong viên thuốc (Stepper `compact`), mô tả và chữ ở ô cuối của hàng hiện tại List; chữ mờ trên hàng đã chọn của Table | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
 | 10 | Chữ `--flg-danger` trên item `danger` đang được trỏ (nền danger 16%); tiêu đề và mô tả của bước lỗi trong viên thuốc (Stepper `compact`) | 4.24:1 | đạt (4.57:1) | 4.5:1 | 1.4.3 |
 | 11 | Ô checkbox đã chọn (màu nhấn) trên option đang được trỏ của Select chọn nhiều, so với nền `--flg-accent-subtle` của hàng | 2.61:1 | 1.91:1 | 3:1 | 1.4.11 |
-| 12 | Chữ `--flg-text-muted` của tab `segmented` trên rãnh `--flg-control-track`; mô tả của hàng List bấm được, và mô tả của bước Stepper bấm được, và chữ mờ trên hàng của Table, khi hover (`inset`, `plain`; `cards` ở dark) | 4.10:1 | 3.36:1 | 4.5:1 | 1.4.3 |
+| 12 | Chữ `--flg-text-muted` của tab `segmented` trên rãnh `--flg-control-track`; mô tả của hàng List bấm được, và mô tả của bước Stepper bấm được, và chữ mờ trên hàng của Table, khi hover (`inset`, `plain`; `cards` ở dark), và số đếm trần của Nav `bar` khi hover | 4.10:1 | 3.36:1 | 4.5:1 | 1.4.3 |
 | 13 | Tab `segmented` đang chọn (nền `--flg-control-bg`) so với rãnh | 1.24:1 | 1.12:1 | 3:1 | 1.4.11 |
 | 14 | Icon và vạch của toast `info` (`--flg-accent-solid`) so với nền; viền 2px của dấu tròn bước hiện tại (Stepper `circles`); viền 1.5px của hàng hiện tại (List `cards`) | đạt (3.04:1) | 2.29:1 | 3:1 | 1.4.11 |
 | 15 | Chấm vạch chia của Slider (`--flg-slider-tick`, 70% `--flg-text-muted`) so với nền | 2.88:1 | 2.82:1 | 3:1 | 1.4.11 |
@@ -340,12 +340,13 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 26 | Chữ `--flg-accent-text` trên `--flg-control-bg`: tiêu đề Alert `plain` `info`; số của bước hiện tại, Stepper `circles` và `compact` | đạt (5.78:1 Alert, 5.67:1 Stepper) | 3.90:1 Alert, 3.33:1 Stepper | 4.5:1 | 1.4.3 |
 | 27 | Phần đã chạy của Progress `thin` và `inline` (các điểm của `--flg-accent-gradient`, `--flg-success`, `--flg-danger`) so với rãnh `--flg-control-track`; nửa đã chạy của thanh bước hiện tại (Stepper `bars`) | 2.45:1 | 1.74:1 | 3:1 | 1.4.11 |
 | 28 | Phần đã chạy của Progress `glow`, kể cả lớp ánh sáng trắng 24% ở nửa trên, so với rãnh | 1.62:1 | 1.74:1 | 3:1 | 1.4.11 |
-| 29 | Chữ `--flg-accent-text` trên bề mặt: giá trị của Progress `glow`; dòng "Step N" của bước xong và bước hiện tại (Stepper `bars`) | 3.95:1 | 4.44:1 | 4.5:1 | 1.4.3 |
+| 29 | Chữ `--flg-accent-text` trên bề mặt: giá trị của Progress `glow`; dòng "Step N" của bước xong và bước hiện tại (Stepper `bars`); nhãn của nhóm chứa trang hiện tại (Nav `pill`) | 3.95:1 | 4.44:1 | 4.5:1 | 1.4.3 |
 | 30 | Vòng của bước chưa tới (`--flg-stepper-ring`, 65% `--flg-text-muted`) so với nền: Stepper `circles` và `compact` | 2.63:1 | 2.63:1 | 3:1 | 1.4.11 |
 | 31 | Vạch `--flg-accent-solid` trên nền nhấn nhạt `--flg-selected-bg`: viền 2px của dấu tròn bước hiện tại, Stepper `compact`; vạch 3px của hàng hiện tại, List `inset` | 2.61:1 | 2.01:1 | 3:1 | 1.4.11 |
-| 32 | Chữ của Badge trên hàng đang hover (`--flg-control-track`): Table (cả ba variant); Badge ở ô cuối của hàng List bấm được | 2.80:1 `accent` (trạng thái 3.69:1) | 3.03:1 `accent` (trạng thái 3.67:1, `neutral` 4.15:1) | 4.5:1 | 1.4.3 |
+| 32 | Chữ của Badge trên hàng đang hover (`--flg-control-track`): Table (cả ba variant); Badge ở ô cuối của hàng List bấm được; số đếm `Badge` của mục Nav `pill` | 2.80:1 `accent` (trạng thái 3.69:1) | 3.03:1 `accent` (trạng thái 3.67:1, `neutral` 4.15:1) | 4.5:1 | 1.4.3 |
 | 33 | Chữ trên hàng lẻ của Table `striped` (`--flg-control-track` pha 50%): chữ mờ `--flg-text-muted`; chữ của Badge | đạt (4.57:1) chữ mờ; Badge 3.09:1 `accent` (trạng thái 4.09:1) | chữ mờ 3.71:1; Badge 3.37:1 `accent` (trạng thái 4.08:1) | 4.5:1 | 1.4.3 |
 | 34 | Chữ của Badge trên hàng đã chọn của Table (`--flg-accent-subtle`) | 2.97:1 `accent` (trạng thái 3.91:1) | 3.27:1 `accent` (trạng thái 3.98:1) | 4.5:1 | 1.4.3 |
+| 35 | Vạch 3px `--flg-accent-solid` của mục đang chọn, Nav `bar` (N2), trên nền nhuộm 18% `--flg-accent-solid` của mục | 2.52:1 | 2.03:1 | 3:1 | 1.4.11 |
 
 Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Điểm 14 là icon `info` của toast theo mockup toast S2 (giai đoạn 2, Plan E1). Điểm 6 còn là chữ mờ của option Combobox đang lọc và dòng trạng thái (giai đoạn 3, Plan B) và chữ hàng thứ của Calendar (giai đoạn 3, Plan C): cùng cặp màu, nên cùng số đo. Điểm 18 là ngày của tháng khác theo mockup K1 (giai đoạn 3, Plan C), nửa độ mờ nên thấp hơn hẳn chữ mờ thường. Điểm 15–17 là chấm vạch, rãnh và núm của Slider theo mockup S3 (giai đoạn 3, Plan A). Điểm 19–22 là viền vùng thả, nút chọn tệp, cỡ tệp và dòng gợi ý của FileUpload theo mockup F1 (giai đoạn 3, Plan D); dòng gợi ý khi đang kéo (chữ mờ trên nền nhấn) cùng cặp màu với điểm 9, nên được ghi ở điểm 9 (phát hiện khi review cuối Plan D). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
 
@@ -359,7 +360,9 @@ Các số được **làm tròn xuống** 2 chữ số thập phân, và là đ
 
 Điểm 2 và 6 còn có các vị trí của AppShell (giai đoạn 5, Plan A): vòng focus của liên kết `AppShellBrand` và của skip link (điểm 2), chữ của footer (điểm 6, `--flg-text-muted` trên kính; liên kết trong footer dùng `--flg-text`). Cùng cặp màu nên cùng số đo, không thêm dòng (spec giai đoạn 5 §4.4).
 
-Cả ba mươi bốn điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
+Điểm 35 là vạch của mục đang chọn Nav `bar` theo mockup N2 (giai đoạn 5, Plan B): vạch `--flg-accent-solid` rộng 3px trên nền nhuộm `color-mix` 18% của chính màu đó, nên thấp ở cả hai theme; mục đó còn có chữ đậm và `aria-current="page"`, nên vạch không phải dấu hiệu duy nhất. Chữ `--flg-text` của mục (và số đếm của nó) đạt (8.24:1 light, 5.82:1 dark, thấp nhất của hai điểm 18% và 3% của nền) và icon `--flg-accent-text` đạt (3.28:1, 3.80:1), nên không phải ngoại lệ. Các vị trí khác của Nav cùng cặp màu với các điểm 2 (vòng focus của mục và nút nhóm), 6 (tiêu đề mục, số đếm trần của `bar`), 7 và 8 (chữ, icon và nền của mục đang chọn `pill`), 12 (số đếm trần của `bar` khi hover), 29 (nhãn của nhóm chứa trang hiện tại, `pill`) và 32 (`Badge` đếm của `pill` khi hover, dark 4.15:1 `neutral`), nên được ghi ở đó. Ở `prefers-contrast: more` cả ba cặp mới đều đạt (4.65:1, 11.44:1 và 4.55:1 ở light; 5.30:1, 10.17:1 và 6.64:1 ở dark).
+
+Cả ba mươi lăm điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
 
 ---
 
diff --git a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
index a7fc2b0..74e1040 100644
--- a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
+++ b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
@@ -329,14 +329,14 @@ Bảng là của khung có sidebar; không có sidebar thì chỉ có ô brand c
 
 - **Gốc** `<nav class="flg-nav">`: cột `flex`, `flex-grow: 1` khi nằm trong thân sidebar (để mục ở đáy đẩy được xuống cuối thân), padding 10px. N2: padding trái 0 (các hàng chạy tới mép kính).
 - **Danh sách:** cột, khoảng cách 2px, margin và padding 0, `list-style: none`.
-- **Mục** (`.flg-nav-item`, cả link lẫn nút của nhóm): `flex`, căn giữa dọc, khoảng cách 10px, `box-sizing: border-box`, rộng 100%, cao 36px, padding `0 10px`, bo `--flg-radius-md`, không viền, không nền, chữ `--flg-text`, font `--flg-weight-medium` `--flg-text-sm` / 1.2 `--flg-font-sans`, căn trái, không gạch chân, một dòng.
+- **Mục** (`.flg-nav-item`, cả link lẫn nút của nhóm): `flex`, căn giữa dọc, khoảng cách 10px, `box-sizing: border-box`, rộng bằng hàng (từ khoá `stretch` kèm `-webkit-fill-available` và `-moz-available`, `100%` làm dự phòng, như `stepper.css`: nút không tự giãn như thẻ `<a>`, và mục con có margin trái 28px; phát hiện khi lập Plan B), cao 36px, padding `0 10px`, bo `--flg-radius-md`, không viền, không nền, chữ `--flg-text`, font `--flg-weight-medium` `--flg-text-sm` / 1.2 `--flg-font-sans`, căn trái, không gạch chân, một dòng.
   - Icon (`.flg-nav-item-icon`): khối 18×18px không co, màu `--flg-text-muted`; svg con 18px.
   - Nhãn: chiếm phần còn lại, `min-width: 0`, dài thì "…".
   - Chevron của nhóm: 16px, màu `--flg-text-muted`; nhóm đóng chỉ sang phải, nhóm mở chỉ xuống (xoay, §3.6).
 - **Hover** (`@media (hover: hover)`, mục không đang chọn, không tắt): nền `--flg-control-track`, icon lấy `--flg-text`.
 - **Focus:** vòng focus chung trên mục (`outline` 2px `--flg-focus-outline-color` cách 2px, `--flg-focus-ring`), như `.mk-item[data-st=focus]`.
 - **Tắt:** `opacity: .5`, `cursor: not-allowed`, không hover.
-- **Mục con của nhóm:** cao 32px, cách trái 28px (`width: calc(100% - 28px)`), đậm `--flg-weight-regular`, không icon. Danh sách con cách nút nhóm 2px.
+- **Mục con của nhóm:** cao 32px, cách trái 28px (`margin-left`, rộng phần còn lại), đậm `--flg-weight-regular`, không icon. Danh sách con cách nút nhóm 2px.
 - **Tiêu đề mục** (`NavSection` có `title`): khối bọc cách phía trên 14px (khối đầu tiên của Nav không cách); tiêu đề cao 28px, `flex`, căn giữa dọc, padding `0 10px`, màu `--flg-text-muted`, font `--flg-weight-medium` `--flg-text-xs` / 1.2. `NavSection` không có `title`: chỉ là khoảng cách 14px (rail: đường chia).
 - **Mục ở đáy** (`NavSection bottom`): `margin-top: auto`, padding trên 16px, cột khoảng cách 8px: một `Divider` ngang (`flg-divider`) rồi các mục.
 - **Số đếm** (`badge` là số hay chuỗi): N1 là một `Badge` `neutral` (đúng lớp `flg-badge`); N2 là chữ số trần (§N2). `badge` là một element thì lib đặt nó vào ô cuối nguyên vậy.
@@ -545,7 +545,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`. Icon dùng `
 | `editable.ts` (C) | `isEditable(target)` | Chuyển nguyên từ `Toaster.tsx` (ô nhập văn bản, `textarea`, `select`, `[contenteditable]`, hay con của chúng); Toaster và phím tắt của SearchField dùng chung |
 | `theme-store.ts` (C) | `useThemeValue({ value, defaultValue, onValueChange, storageKey })`, `applyTheme(value)` | Store theo `storageKey`: đọc `localStorage` một lần khi có người đăng ký đầu tiên và khi có sự kiện `storage` cho đúng khoá; ghi khi người dùng chọn; báo cho mọi `ThemeSwitch` và `ThemeMenuGroup` cùng khoá (cả hai luôn khớp nhau). `useSyncExternalStore` với giá trị phía server là `defaultValue`. Controlled (`value` có mặt) thì chỉ trả `value` và gọi `onValueChange`, không đọc, không ghi, không chạm `<html>`. `applyTheme`: `'light'`/`'dark'` đặt `data-flg-theme` trên `document.documentElement`, `'system'` bỏ thuộc tính. `localStorage` bị chặn (chế độ riêng tư, chính sách) thì mọi lần đọc ghi được bọc `try/catch`: giá trị chỉ sống trong store |
 
-**Helper riêng của component** (trong thư mục của component): `app-shell/app-shell-context.ts` (context của AppShell: `layout`, `breakpoint`, `isWide`, `collapsible`, `collapsed`, `setCollapsed`, `open`, `modal` (`open && !isWide`: tấm đang là dialog; phần nào cần biết thì đọc nó, không tự tính lại; phát hiện khi review cuối Plan A), `setOpen(open, { returnFocus, opener })` (`returnFocus` mặc định `true`: sau khi đóng, focus về `opener`, là nút trigger đã mở tấm, không có thì trigger đầu tiên còn hiện; `opener` chỉ do `AppShellSidebarTrigger` truyền khi mở; phát hiện khi lập Plan A. Focus cũng về như vậy khi cha controlled tự đóng không qua `setOpen`; lần đóng do cửa sổ rộng ra không dùng `setOpen` mà được nhận ra bằng `matchMedia` (§3.4); `opener` và cờ `returnFocus: false` bị quên sau mỗi lần đóng; phát hiện khi review cuối Plan A; cờ chỉ được ghi khi lời gọi đóng một tấm đang hiện, và cũng bị quên mỗi khi tấm hiện ra, §3.4; phát hiện khi review PR #37), id của sidebar và main, `labels`, `brand`, đăng ký phần và trigger); `app-shell/use-sheet.ts` (`useSheet`: layout effect của tấm trượt (`inert`, khoá cuộn, focus vào và về), Esc, lớp nền, việc đóng khi cửa sổ rộng ra; `AppShell.tsx` chỉ gọi nó; phát hiện khi review cuối Plan A); `app-shell/use-header-offset.ts` (`useHeaderOffset(header)`, với `header` là phần tử (lưu bằng state của `AppShell`, nên một header mount sau khung vẫn được đo; (phát hiện khi lập Plan A)): `ResizeObserver` trên header, ghi `--flg-app-shell-header-offset` lên `<html>` khi chiều cao đổi, xoá khi unmount; không có `ResizeObserver` (jsdom) thì không ghi gì, CSS dùng giá trị dự phòng; §3.3; Claude chốt; phát hiện khi đọc soát spec); `theme-switch/theme-script.ts` (hàm thuần `themeScriptSource(storageKey)`, §6.3, để test được chuỗi).
+**Helper riêng của component** (trong thư mục của component): `app-shell/app-shell-context.ts` (context của AppShell: `layout`, `breakpoint`, `isWide`, `collapsible`, `collapsed`, `setCollapsed`, `open`, `modal` (`open && !isWide`: tấm đang là dialog; phần nào cần biết thì đọc nó, không tự tính lại; phát hiện khi review cuối Plan A), `setOpen(open, { returnFocus, opener })` (`returnFocus` mặc định `true`: sau khi đóng, focus về `opener`, là nút trigger đã mở tấm, không có thì trigger đầu tiên còn hiện; `opener` chỉ do `AppShellSidebarTrigger` truyền khi mở; phát hiện khi lập Plan A. Focus cũng về như vậy khi cha controlled tự đóng không qua `setOpen`; lần đóng do cửa sổ rộng ra không dùng `setOpen` mà được nhận ra bằng `matchMedia` (§3.4); `opener` và cờ `returnFocus: false` bị quên sau mỗi lần đóng; phát hiện khi review cuối Plan A; cờ chỉ được ghi khi lời gọi đóng một tấm đang hiện, và cũng bị quên mỗi khi tấm hiện ra, §3.4; phát hiện khi review PR #37), id của sidebar và main, đăng ký phần và trigger; **không** có `labels` và `brand`: hai thứ đó nằm ở một context thứ hai, `AppShellTextContext` (`{ labels, brand }`), vì cha thường truyền chúng inline nên chúng là giá trị mới ở mọi lần render, và `NavItem` đọc context của AppShell (để đóng tấm trượt), nên nếu chúng cùng một context thì mọi mục nav render lại theo mọi lần render của cha; chỉ header, sidebar và trigger đọc context thứ hai; phát hiện khi lập Plan B, từ M8 của Plan A); `app-shell/use-sheet.ts` (`useSheet`: layout effect của tấm trượt (`inert`, khoá cuộn, focus vào và về), Esc, lớp nền, việc đóng khi cửa sổ rộng ra; `AppShell.tsx` chỉ gọi nó; phát hiện khi review cuối Plan A); `app-shell/use-header-offset.ts` (`useHeaderOffset(header)`, với `header` là phần tử (lưu bằng state của `AppShell`, nên một header mount sau khung vẫn được đo; (phát hiện khi lập Plan A)): `ResizeObserver` trên header, ghi `--flg-app-shell-header-offset` lên `<html>` khi chiều cao đổi, xoá khi unmount; không có `ResizeObserver` (jsdom) thì không ghi gì, CSS dùng giá trị dự phòng; §3.3; Claude chốt; phát hiện khi đọc soát spec); `theme-switch/theme-script.ts` (hàm thuần `themeScriptSource(storageKey)`, §6.3, để test được chuỗi).
 
 **Thay đổi ở primitive và component có sẵn:**
 
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 7b68c4d..b693d58 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -187,6 +187,18 @@ const SHIPPED_CLASSES = [
   'flg-app-shell-brand',
   'flg-app-shell-brand-logo',
   'flg-app-shell-brand-name',
+  'flg-nav',
+  'flg-nav-list',
+  'flg-nav-section',
+  'flg-nav-section-title',
+  'flg-nav-item',
+  'flg-nav-item-icon',
+  'flg-nav-item-label',
+  'flg-nav-item-badge',
+  'flg-nav-item-count',
+  'flg-nav-group',
+  'flg-nav-group-chevron',
+  'flg-nav-sub',
 ];
 
 // The rules of the AppShell that depend on the width are generated, one `@media` block per breakpoint
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index 22e3c55..0079a40 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -33,6 +33,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/progress/Progress.tsx',
   'src/components/table/Table.tsx',
   'src/components/app-shell/AppShell.tsx',
+  'src/components/nav/Nav.tsx',
   'src/components/calendar/Calendar.tsx',
   'src/components/date-picker/DatePicker.tsx',
   'src/components/file-upload/FileUpload.tsx',
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index fa79cc1..5f55722 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -28,8 +28,8 @@ const D = {
     description:
       'Focus ring on Button, IconButton, Checkbox, Radio and Switch, on the button of a Stepper ' +
       'step, on a row of a List, on the sort button and the scroll frame of a Table, on the link of ' +
-      'an AppShellBrand and the skip link of an AppShell, and on an invalid Input or Textarea, ' +
-      'whose border stays red while focused',
+      'an AppShellBrand and the skip link of an AppShell, on an item and the button of a group of ' +
+      'a Nav, and on an invalid Input or Textarea, whose border stays red while focused',
     criterion: '1.4.11',
   },
   3: {
@@ -54,20 +54,23 @@ const D = {
       'Progress `thin`, in a Stepper the number, title and description of a step not reached, the ' +
       'description of every step and the "Step N" line of a step not reached, in a List the ' +
       'description and the end cell of a row, and in a Table `striped` and `minimal` the column ' +
-      'headings and the icon of a column that is not sorted, and the text of an AppShell footer',
+      'headings and the icon of a column that is not sorted, the text of an AppShell footer, and in ' +
+      'a Nav the title of a section and the count of `bar`',
     criterion: '1.4.3',
   },
   7: {
     description:
       'Accent text on the accent wash: an accent Badge, a selected pill tab, the current page, the ' +
-      'title of the current step of a Stepper `compact`, the title of the current row of a List',
+      'title of the current step of a Stepper `compact`, the title of the current row of a List, the ' +
+      'text and icon of the current item of a Nav `pill`',
     criterion: '1.4.3',
   },
   8: {
     description:
       'The accent wash against the panel or surface: a highlighted menu item or Select option, a ' +
       'selected pill tab, the current page, the pill of the current step of a Stepper `compact`, ' +
-      'the background of the current row of a List',
+      'the background of the current row of a List, the background of the current item of a Nav ' +
+      '`pill`',
     criterion: '1.4.11',
   },
   9: {
@@ -95,7 +98,8 @@ const D = {
     description:
       'Muted text of a segmented tab on its track, the description of a row of a List that can ' +
       'be pressed, the description of a pressable Stepper step, and the muted text on a row of a ' +
-      'Table, under the pointer (`inset` and `plain`; `cards` in dark)',
+      'Table, under the pointer (`inset` and `plain`; `cards` in dark), and the count of a Nav ' +
+      '`bar` under the pointer',
     criterion: '1.4.3',
   },
   13: { description: 'Selected segmented tab against its track', criterion: '1.4.11' },
@@ -172,8 +176,9 @@ const D = {
   },
   29: {
     description:
-      'Accent text on the surface: the value of a Progress `glow`, and the "Step N" line of a ' +
-      'done or current step in a Stepper `bars`',
+      'Accent text on the surface: the value of a Progress `glow`, the "Step N" line of a ' +
+      'done or current step in a Stepper `bars`, and the label of the group of a Nav `pill` that ' +
+      'holds the current page',
     criterion: '1.4.3',
   },
   30: {
@@ -190,8 +195,9 @@ const D = {
   },
   32: {
     description:
-      'The text of a Badge on a row of a Table under the pointer (the control track), and of a ' +
-      'Badge in the end cell of a List row that can be pressed, under the pointer',
+      'The text of a Badge on a row of a Table under the pointer (the control track), of a ' +
+      'Badge in the end cell of a List row that can be pressed, under the pointer, and of the ' +
+      'count Badge of an item of a Nav `pill` under the pointer',
     criterion: '1.4.3',
   },
   33: {
@@ -204,6 +210,12 @@ const D = {
     description: 'The text of a Badge on a chosen row of a Table (the accent wash)',
     criterion: '1.4.3',
   },
+  35: {
+    description:
+      'The 3px bar of the current item of a Nav `bar` (the solid accent) against the 18% tint of ' +
+      'the accent that the item has behind it',
+    criterion: '1.4.11',
+  },
 } as const satisfies Record<number, ExceptionRowInfo>;
 
 /** Spec §4.9. The default theme keeps the approved mockup values, so these gaps are accepted. */
@@ -277,4 +289,6 @@ export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
   { row: 33, theme: 'dark', check: 'table-stripe-badge', recorded: 3.37, ...D[33] },
   { row: 34, theme: 'light', check: 'table-selected-badge', recorded: 2.97, ...D[34] },
   { row: 34, theme: 'dark', check: 'table-selected-badge', recorded: 3.27, ...D[34] },
+  { row: 35, theme: 'light', check: 'nav-bar-indicator', recorded: 2.52, ...D[35] },
+  { row: 35, theme: 'dark', check: 'nav-bar-indicator', recorded: 2.03, ...D[35] },
 ];
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index 8898621..dd26a47 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -83,6 +83,9 @@ export const CHECKS = {
   'table-selected-badge': 4.5,
   'indicator-count-text': 4.5,
   'indicator-dot': 3,
+  'nav-bar-indicator': 3,
+  'nav-bar-text': 4.5,
+  'nav-bar-icon': 3,
 } as const;
 export type CheckId = keyof typeof CHECKS;
 const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
@@ -448,6 +451,15 @@ export function measure(
       color('success'),
       color('warning'),
     ];
+    // The current item of a Nav `bar` (nav.css): a tint of the solid accent that fades from 18% to 3%
+    // over the surface, `color-mix(<accent-solid> N%, transparent)`, which keeps the alpha the dark
+    // accent has. What sits on it is measured on both ends, and the lowest counts.
+    const navTints = [0.18, 0.03].map((share) => {
+      const [r, g, b, a] = color('accent-solid');
+      return composite([r, g, b, a * share], surface);
+    });
+    const onNavTint = (name: string, tints: Rgba[]) =>
+      Math.min(...tints.map((tint) => contrastRatio(composite(color(name), tint), tint)));
     const measured: Omit<Record<CheckId, number>, OverlayCheck> = {
       text: onSurface('text'),
       'text-muted': onSurface('text-muted'),
@@ -626,6 +638,11 @@ export function measure(
       'indicator-dot': Math.min(
         ...indicatorDots.map((dot) => contrastRatio(composite(dot, surface), indicatorRing)),
       ),
+      // The 3px bar on the tint, where it is strongest (18%, at the left edge, where the bar is). The
+      // text of the item, and its count, are `text`; the icon is `accent-text`.
+      'nav-bar-indicator': onNavTint('accent-solid', navTints.slice(0, 1)),
+      'nav-bar-text': onNavTint('text', navTints),
+      'nav-bar-icon': onNavTint('accent-text', navTints),
     };
     for (const id of SURFACE_CHECK_IDS) lowest[id] = Math.min(lowest[id], measured[id]);
   }
diff --git a/src/components/app-shell/AppShell.tsx b/src/components/app-shell/AppShell.tsx
index 70af630..bf00d53 100644
--- a/src/components/app-shell/AppShell.tsx
+++ b/src/components/app-shell/AppShell.tsx
@@ -23,13 +23,19 @@ import { devWarn } from '../../internal/warn';
 import { withDefaults } from '../../internal/with-defaults';
 import type { ButtonProps } from '../button/Button';
 import { IconButton } from '../icon-button/IconButton';
-import { AppShellContext, PART_NAMES, useAppShellPart } from './app-shell-context';
+import {
+  AppShellContext,
+  AppShellTextContext,
+  PART_NAMES,
+  useAppShellPart,
+} from './app-shell-context';
 import type {
   AppShellBreakpoint,
   AppShellContextValue,
   AppShellLabels,
   AppShellLayout,
   AppShellPart,
+  AppShellTextValue,
 } from './app-shell-context';
 import { wideQuery } from './breakpoints';
 import { useHeaderOffset } from './use-header-offset';
@@ -229,7 +235,6 @@ export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppSh
     () => ({
       layout: shellLayout,
       breakpoint: shellBreakpoint,
-      labels: words,
       isWide,
       collapsible: canCollapse,
       collapsed,
@@ -237,7 +242,6 @@ export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppSh
       open,
       modal,
       setOpen,
-      brand,
       mainId,
       sidebarId,
       registerPart,
@@ -247,7 +251,6 @@ export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppSh
     [
       shellLayout,
       shellBreakpoint,
-      words,
       isWide,
       canCollapse,
       collapsed,
@@ -255,13 +258,13 @@ export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppSh
       open,
       modal,
       setOpen,
-      brand,
       mainId,
       sidebarId,
       registerPart,
       registerTrigger,
     ],
   );
+  const text = useMemo<AppShellTextValue>(() => ({ labels: words, brand }), [words, brand]);
   const mergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref]);
 
   // The link keeps its `href`, so it works before the page is hydrated. Once it is, the shell does
@@ -280,37 +283,39 @@ export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppSh
 
   return (
     <AppShellContext.Provider value={context}>
-      {/* The state attributes come after the caller's props: the CSS draws from them, so a
+      <AppShellTextContext.Provider value={text}>
+        {/* The state attributes come after the caller's props: the CSS draws from them, so a
           `data-*` that a wrapper forwards must not make it draw another state than the shell keeps. */}
-      <div
-        {...props}
-        ref={mergedRef}
-        className={clsx('flg-app-shell', className)}
-        data-layout={shellLayout}
-        data-breakpoint={shellBreakpoint}
-        data-collapsible={dataAttr(canCollapse)}
-        data-collapsed={dataAttr(collapsed)}
-        data-rail={dataAttr(rail)}
-        data-open={dataAttr(open)}
-      >
-        <a
-          ref={skipRef}
-          className="flg-app-shell-skip flg-visually-hidden"
-          href={`#${mainId}`}
-          onClick={skipToMain}
+        <div
+          {...props}
+          ref={mergedRef}
+          className={clsx('flg-app-shell', className)}
+          data-layout={shellLayout}
+          data-breakpoint={shellBreakpoint}
+          data-collapsible={dataAttr(canCollapse)}
+          data-collapsed={dataAttr(collapsed)}
+          data-rail={dataAttr(rail)}
+          data-open={dataAttr(open)}
         >
-          {words.skipToContent}
-        </a>
-        {children}
-        {modal ? (
-          <div
-            className="flg-app-shell-scrim"
-            aria-hidden="true"
-            onPointerDown={onScrimPointerDown}
-            onClick={onScrimClick}
-          />
-        ) : null}
-      </div>
+          <a
+            ref={skipRef}
+            className="flg-app-shell-skip flg-visually-hidden"
+            href={`#${mainId}`}
+            onClick={skipToMain}
+          >
+            {words.skipToContent}
+          </a>
+          {children}
+          {modal ? (
+            <div
+              className="flg-app-shell-scrim"
+              aria-hidden="true"
+              onPointerDown={onScrimPointerDown}
+              onClick={onScrimClick}
+            />
+          ) : null}
+        </div>
+      </AppShellTextContext.Provider>
     </AppShellContext.Provider>
   );
 });
@@ -327,6 +332,7 @@ export const AppShellHeader = forwardRef<HTMLElement, AppShellHeaderProps>(funct
 ) {
   const own = useRef<HTMLElement>(null);
   const context = useAppShellPart('header', own);
+  const brand = useContext(AppShellTextContext)?.brand;
   const setHeader = context?.setHeader;
   const mergedRef = useMemo(() => mergeRefs<HTMLElement>(ref, own, setHeader), [ref, setHeader]);
   return (
@@ -336,9 +342,7 @@ export const AppShellHeader = forwardRef<HTMLElement, AppShellHeaderProps>(funct
       {...props}
     >
       {sidebarTrigger ? <AppShellSidebarTrigger /> : null}
-      {hasContent(context?.brand) ? (
-        <span className="flg-app-shell-header-brand">{context?.brand}</span>
-      ) : null}
+      {hasContent(brand) ? <span className="flg-app-shell-header-brand">{brand}</span> : null}
       {children}
     </header>
   );
@@ -367,7 +371,7 @@ export const AppShellSidebarTrigger = forwardRef<HTMLButtonElement, AppShellSide
       return register(element);
     }, [register]);
 
-    const labels = context?.labels ?? DEFAULT_LABELS;
+    const labels = useContext(AppShellTextContext)?.labels ?? DEFAULT_LABELS;
     const rail = context?.isWide === true;
     const collapsed = context?.collapsed === true;
     const name = rail
@@ -411,6 +415,7 @@ export const AppShellSidebar = forwardRef<HTMLDivElement, AppShellSidebarProps>(
   function AppShellSidebar({ className, children, ...props }, ref) {
     const own = useRef<HTMLDivElement>(null);
     const context = useAppShellPart('sidebar', own);
+    const text = useContext(AppShellTextContext);
     const fallbackId = useId();
     const mergedRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, own), [ref]);
     // A sheet while it is open on a narrow screen: a dialog, with the name of the navigation. The
@@ -421,7 +426,7 @@ export const AppShellSidebar = forwardRef<HTMLDivElement, AppShellSidebarProps>(
         variant="ghost"
         size="md"
         className="flg-app-shell-sidebar-close"
-        aria-label={context.labels.closeNavigation}
+        aria-label={(text?.labels ?? DEFAULT_LABELS).closeNavigation}
         onClick={() => context.setOpen(false)}
       >
         <CloseIcon />
@@ -432,7 +437,7 @@ export const AppShellSidebar = forwardRef<HTMLDivElement, AppShellSidebarProps>(
         ref={mergedRef}
         className={clsx('flg-app-shell-sidebar', className)}
         role={sheet ? 'dialog' : undefined}
-        aria-label={sheet ? context.labels.navigation : undefined}
+        aria-label={sheet ? (text?.labels ?? DEFAULT_LABELS).navigation : undefined}
         {...props}
         id={context?.sidebarId ?? fallbackId}
       >
@@ -441,7 +446,7 @@ export const AppShellSidebar = forwardRef<HTMLDivElement, AppShellSidebarProps>(
               where the brand is the sidebar's (S1), before it where the header has the trigger (S2). */}
           <div className="flg-app-shell-sidebar-head">
             {context?.layout === 'header' ? close : null}
-            {context?.brand}
+            {text?.brand}
             {context?.layout === 'header' ? null : close}
           </div>
           <div className="flg-app-shell-sidebar-body">{children}</div>
diff --git a/src/components/app-shell/app-shell-context.ts b/src/components/app-shell/app-shell-context.ts
index aed80b6..98a3bd1 100644
--- a/src/components/app-shell/app-shell-context.ts
+++ b/src/components/app-shell/app-shell-context.ts
@@ -41,11 +41,14 @@ export const PART_NAMES: Record<AppShellPart, string> = {
   footer: 'AppShellFooter',
 };
 
-/** What the shell hands to its parts: the ids they point at, the brand to draw, its state and the registry. */
+/**
+ * What the shell hands to its parts: the ids they point at, its state and the registry. It holds
+ * nothing that a caller passes inline (`brand`, `labels`), so it only changes when the state does, and
+ * a part that reads only this, a `NavItem`, is not rendered again by a render of the caller's.
+ */
 export interface AppShellContextValue {
   layout: AppShellLayout;
   breakpoint: AppShellBreakpoint;
-  labels: AppShellLabels;
   /**
    * Whether the window is at least as wide as the breakpoint. It is `false` on the server and while
    * hydrating, so the first render is the narrow one the HTML was written for.
@@ -61,8 +64,6 @@ export interface AppShellContextValue {
   /** Whether the sheet is open on a narrow screen: a modal dialog, with the rest of the frame inert. */
   modal: boolean;
   setOpen: (open: boolean, options?: AppShellSetOpenOptions) => void;
-  /** Drawn twice, at the head of the header and at the head of the sidebar; CSS shows one. */
-  brand: ReactNode;
   mainId: string;
   sidebarId: string;
   /** Tells the shell that a part is mounted, for the dev warnings; returns the way to take it back. */
@@ -75,6 +76,18 @@ export interface AppShellContextValue {
 
 export const AppShellContext = createContext<AppShellContextValue | null>(null);
 
+/**
+ * What the shell says and draws, which its parent usually writes inline and so makes anew at every
+ * render: the words, and the brand drawn twice, at the head of the header and at the head of the
+ * sidebar (CSS shows one). Kept apart from the state so that only the parts that draw it follow it.
+ */
+export interface AppShellTextValue {
+  labels: AppShellLabels;
+  brand: ReactNode;
+}
+
+export const AppShellTextContext = createContext<AppShellTextValue | null>(null);
+
 /**
  * Registers a part with the shell once it is mounted, or warns that it is not inside one. A part
  * outside an `AppShell` still renders: it is only a misuse, and the library does not throw on those.
diff --git a/src/components/nav/Nav.tsx b/src/components/nav/Nav.tsx
new file mode 100644
index 0000000..f1dc2f1
--- /dev/null
+++ b/src/components/nav/Nav.tsx
@@ -0,0 +1,376 @@
+'use client';
+
+import { clsx } from 'clsx';
+import {
+  cloneElement,
+  createContext,
+  forwardRef,
+  Fragment,
+  isValidElement,
+  useContext,
+  useId,
+  useMemo,
+} from 'react';
+import type {
+  AnchorHTMLAttributes,
+  HTMLAttributes,
+  LiHTMLAttributes,
+  MouseEvent,
+  ReactNode,
+  Ref,
+} from 'react';
+import { childKeys } from '../../internal/child-keys';
+import {
+  collectChildren,
+  flattenChildren,
+  markPart,
+  partOf,
+} from '../../internal/collect-children';
+import { composeEventHandlers } from '../../internal/compose-event-handlers';
+import { dataAttr } from '../../internal/data-attr';
+import { hasContent } from '../../internal/has-content';
+import { ChevronIcon } from '../../internal/icons';
+import { resolveLazy } from '../../internal/react-lazy';
+import { hasModifier } from '../../internal/roving';
+import { Slot } from '../../internal/slot';
+import { useControllableState } from '../../internal/use-controllable-state';
+import { devWarn } from '../../internal/warn';
+import { withDefaults } from '../../internal/with-defaults';
+import { AppShellContext } from '../app-shell/app-shell-context';
+import { Badge } from '../badge/Badge';
+import { Divider } from '../divider/Divider';
+
+export type NavVariant = 'pill' | 'bar';
+
+/** The words a Nav says; translate them here. */
+export interface NavLabels {
+  /** The name of the navigation landmark, unless the caller gives `aria-label` or `aria-labelledby`. */
+  nav: string;
+}
+
+export type NavProps = HTMLAttributes<HTMLElement> & {
+  /** The look of the items: a soft pill, or an accent bar on the left edge. Default `pill`. */
+  variant?: NavVariant;
+  /** Default English words; any of them can be replaced. */
+  labels?: Partial<NavLabels>;
+};
+export type NavSectionProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
+  /** The heading of the section; it also names the group of links. */
+  title?: ReactNode;
+  /** Pushes the section to the foot of the sidebar, under a rule. */
+  bottom?: boolean;
+};
+export type NavItemProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
+  /** The icon before the label. */
+  icon?: ReactNode;
+  /**
+   * A number or a short text is drawn as the look asks (a Badge in `pill`, a plain count in `bar`); an
+   * element is put in the last cell as it is. The text is part of the name of the link.
+   */
+  badge?: ReactNode;
+  /** The page the person is on: `aria-current="page"`. Compute it from the current path. */
+  active?: boolean;
+  /** Not a link that goes anywhere: it stays in the list and cannot be reached. */
+  disabled?: boolean;
+  /** Render the single child element (a router's `Link`) as the link; its content is the label. */
+  asChild?: boolean;
+  children: ReactNode;
+};
+export type NavGroupProps = Omit<LiHTMLAttributes<HTMLLIElement>, 'title'> & {
+  /** The name of the group, and the text of its button. */
+  label: ReactNode;
+  icon?: ReactNode;
+  /** Whether the links of the group show. Controlled. */
+  open?: boolean;
+  /** Not given with `open`: the group starts open when one of its direct `NavItem`s is `active`. */
+  defaultOpen?: boolean;
+  onOpenChange?: (open: boolean) => void;
+  children: ReactNode;
+};
+
+const DEFAULT_LABELS: NavLabels = { nav: 'Main' };
+
+/** Where in a Nav a part is, so that a part out of place is told and a NavItem knows its look. */
+type NavLevel = 'nav' | 'section' | 'group';
+interface NavContextValue {
+  variant: NavVariant;
+  level: NavLevel;
+}
+const NavContext = createContext<NavContextValue | null>(null);
+
+// A value outside the union is a mistake that TypeScript did not see (plain JavaScript): the default.
+const toVariant = (variant: unknown): NavVariant => (variant === 'bar' ? 'bar' : 'pill');
+
+/** The list of links. Safari drops the list semantics of a list with `list-style: none`. */
+const NavList = forwardRef<HTMLUListElement, HTMLAttributes<HTMLUListElement>>(
+  function NavList(props, ref) {
+    // eslint-disable-next-line jsx-a11y/no-redundant-roles
+    return <ul ref={ref} role="list" className="flg-nav-list" {...props} />;
+  },
+);
+
+/**
+ * The navigation of an application: a landmark that holds the links, in sections and in groups of
+ * links. It works on its own (in a Drawer, in a Card) and in the sidebar of an `AppShell`, where
+ * its links close the sheet on a narrow screen. The items that stand next to each other outside a
+ * `NavSection` are one list; each `NavSection` is another.
+ */
+export const Nav = forwardRef<HTMLElement, NavProps>(function Nav(
+  { variant, labels, className, children, 'aria-label': ariaLabel, ...props },
+  ref,
+) {
+  const words = withDefaults(DEFAULT_LABELS, labels);
+  const look = toVariant(variant);
+  const context = useMemo<NavContextValue>(() => ({ variant: look, level: 'nav' }), [look]);
+  const nodes = flattenChildren(children);
+  // An empty <nav> would still be a landmark that screen readers list.
+  if (nodes.length === 0) return null;
+  const keys = childKeys(nodes.map((node) => (isValidElement(node) ? node.key : null)));
+
+  const blocks: ReactNode[] = [];
+  let run: ReactNode[] = [];
+  // A run is keyed by its place among the blocks, not by the key of its first item: an item that
+  // comes or goes at the head of the list must not remount the run, and the groups open in it.
+  const endRun = () => {
+    if (run.length > 0) blocks.push(<NavList key={`list-${blocks.length}`}>{run}</NavList>);
+    run = [];
+  };
+  nodes.forEach((node, index) => {
+    // The child keeps its own key when it has one, so that reordering keyed children keeps the state
+    // and the DOM node of each.
+    const keyed = <Fragment key={keys[index]}>{node}</Fragment>;
+    if (partOf(node) === 'nav-section') {
+      endRun();
+      blocks.push(keyed);
+      return;
+    }
+    // What is not recognised (a component of the user's own around an item) is taken for an item.
+    run.push(keyed);
+  });
+  endRun();
+
+  const named = ariaLabel !== undefined || props['aria-labelledby'] !== undefined;
+  return (
+    <NavContext.Provider value={context}>
+      {/* The look is written after the caller's props: the CSS draws from it. */}
+      <nav
+        ref={ref}
+        aria-label={named ? ariaLabel : words.nav}
+        {...props}
+        className={clsx('flg-nav', className)}
+        data-variant={look}
+      >
+        {blocks}
+      </nav>
+    </NavContext.Provider>
+  );
+});
+
+/**
+ * A block of items under a title. Without a title it is only the gap between two blocks; with
+ * `bottom` it goes to the foot of the sidebar. It must be a direct child of `Nav`.
+ */
+export const NavSection = markPart(
+  forwardRef<HTMLDivElement, NavSectionProps>(function NavSection(
+    { title, bottom = false, className, children, ...props },
+    ref,
+  ) {
+    const nav = useContext(NavContext);
+    const titleId = useId();
+    const look = nav?.variant ?? 'pill';
+    const context = useMemo<NavContextValue>(() => ({ variant: look, level: 'section' }), [look]);
+    if (nav?.level !== 'nav') devWarn('<NavSection> must be a direct child of <Nav>.');
+    const titled = hasContent(title);
+    // A name the caller gives is theirs: `aria-labelledby` would win over their `aria-label`.
+    const named = props['aria-label'] !== undefined || props['aria-labelledby'] !== undefined;
+    return (
+      <NavContext.Provider value={context}>
+        <div
+          ref={ref}
+          role={titled ? 'group' : undefined}
+          aria-labelledby={titled && !named ? titleId : undefined}
+          {...props}
+          className={clsx('flg-nav-section', className)}
+          data-bottom={dataAttr(bottom)}
+        >
+          {bottom ? <Divider decorative /> : null}
+          {titled ? (
+            <div className="flg-nav-section-title" id={titleId}>
+              {title}
+            </div>
+          ) : null}
+          <NavList>{children}</NavList>
+        </div>
+      </NavContext.Provider>
+    );
+  }),
+  'nav-section',
+);
+
+// Runs in the capture phase, so neither the link's own `onClick` nor one of a child's fires, and
+// `preventDefault()` stops the navigation.
+function blockActivation(event: MouseEvent<HTMLElement>) {
+  event.preventDefault();
+  event.stopPropagation();
+}
+
+/**
+ * A link of the navigation. In the sheet that the sidebar of an `AppShell` is on a narrow screen, a
+ * plain click on it closes the sheet and focus goes back to the button that opened it.
+ */
+export const NavItem = markPart(
+  forwardRef<HTMLAnchorElement, NavItemProps>(function NavItem(
+    {
+      icon,
+      badge,
+      active = false,
+      disabled = false,
+      asChild = false,
+      className,
+      children,
+      href,
+      onClick,
+      ...props
+    },
+    ref,
+  ) {
+    const nav = useContext(NavContext);
+    // Only the part of the shell that does not change with its brand and its words, so that an inline
+    // `brand` or `labels` does not render every link again.
+    const setOpen = useContext(AppShellContext)?.setOpen;
+    if (!nav) devWarn('<NavItem> must be rendered inside <Nav>, <NavSection> or <NavGroup>.');
+    const look = nav?.variant ?? 'pill';
+
+    // A plain click: Ctrl, Meta and Shift open the link somewhere else, Alt downloads it, and a
+    // handler that called `preventDefault()` has taken the click for something of its own.
+    // `setOpen(false)` does nothing when the sheet is not open.
+    const closeSheet = (event: MouseEvent<HTMLElement>) => {
+      if (event.shiftKey || hasModifier(event)) return;
+      setOpen?.(false);
+    };
+
+    const count =
+      typeof badge === 'number' || (typeof badge === 'string' && badge !== '') ? (
+        look === 'bar' ? (
+          <span className="flg-nav-item-count">{badge}</span>
+        ) : (
+          <Badge className="flg-nav-item-badge">{badge}</Badge>
+        )
+      ) : hasContent(badge) ? (
+        badge
+      ) : null;
+    const inside = (label: ReactNode) => (
+      <>
+        {hasContent(icon) ? (
+          <span className="flg-nav-item-icon" aria-hidden="true">
+            {icon}
+          </span>
+        ) : null}
+        <span className="flg-nav-item-label">{label}</span>
+        {count}
+      </>
+    );
+
+    const shared = {
+      ...props,
+      className: clsx('flg-nav-item', className),
+      'aria-current': props['aria-current'] ?? (active ? ('page' as const) : undefined),
+      'aria-disabled': disabled ? true : props['aria-disabled'],
+      onClick: composeEventHandlers(onClick, closeSheet),
+      onClickCapture: disabled ? blockActivation : props.onClickCapture,
+      onAuxClickCapture: disabled ? blockActivation : props.onAuxClickCapture,
+    };
+
+    let link: ReactNode;
+    if (asChild) {
+      // A Server Component can pass the child as a lazy reference, which says nothing about the
+      // element until it is resolved.
+      const element = resolveLazy(children);
+      const child = isValidElement<{ children?: ReactNode }>(element)
+        ? cloneElement(element, undefined, inside(element.props.children))
+        : element;
+      link = (
+        <Slot ref={ref as Ref<HTMLElement>} {...shared} tabIndex={disabled ? -1 : props.tabIndex}>
+          {child}
+        </Slot>
+      );
+    } else if (disabled) {
+      // An <a> without an `href` is not a link and cannot be reached, which is what a disabled one
+      // is; the role says it is a link all the same, so its name and state are read.
+      link = (
+        <a ref={ref} role="link" {...shared}>
+          {inside(children)}
+        </a>
+      );
+    } else {
+      link = (
+        <a ref={ref} href={href} {...shared}>
+          {inside(children)}
+        </a>
+      );
+    }
+    return <li>{link}</li>;
+  }),
+  'nav-item',
+);
+
+/**
+ * A button that shows or hides a list of links under it: two levels at most. It is open from the
+ * start when one of its direct `NavItem`s is `active`; a link that a component of the user's own
+ * wraps is not seen, and then `defaultOpen` says it.
+ */
+export const NavGroup = forwardRef<HTMLLIElement, NavGroupProps>(function NavGroup(
+  { label, icon, open: openProp, defaultOpen, onOpenChange, className, children, ...props },
+  ref,
+) {
+  const nav = useContext(NavContext);
+  const buttonId = useId();
+  const listId = useId();
+  const look = nav?.variant ?? 'pill';
+  const context = useMemo<NavContextValue>(() => ({ variant: look, level: 'group' }), [look]);
+  if (!nav) devWarn('<NavGroup> must be rendered inside <Nav>, <NavSection> or <NavGroup>.');
+  else if (nav.level === 'group') {
+    devWarn('<NavGroup> inside <NavGroup> is not supported: navigation has at most two levels.');
+  }
+  // Read from the elements, not from what they render, so that it is the same on the server.
+  const hasActive = collectChildren(children, { parts: ['nav-item'] }).some(
+    (item) => item.props.active === true,
+  );
+  const [open, setOpen] = useControllableState({
+    value: openProp,
+    defaultValue: defaultOpen ?? hasActive,
+    onChange: onOpenChange,
+    name: 'NavGroup `open`',
+  });
+  return (
+    <NavContext.Provider value={context}>
+      <li
+        ref={ref}
+        {...props}
+        className={clsx('flg-nav-group', className)}
+        data-open={dataAttr(open)}
+        data-has-active={dataAttr(hasActive)}
+      >
+        <button
+          type="button"
+          id={buttonId}
+          className="flg-nav-item"
+          aria-expanded={open}
+          aria-controls={listId}
+          onClick={() => setOpen(!open)}
+        >
+          {hasContent(icon) ? (
+            <span className="flg-nav-item-icon" aria-hidden="true">
+              {icon}
+            </span>
+          ) : null}
+          <span className="flg-nav-item-label">{label}</span>
+          <ChevronIcon className="flg-nav-group-chevron" />
+        </button>
+        <div className="flg-nav-sub" id={listId} hidden={!open}>
+          <NavList aria-labelledby={buttonId}>{children}</NavList>
+        </div>
+      </li>
+    </NavContext.Provider>
+  );
+});
diff --git a/src/components/nav/index.ts b/src/components/nav/index.ts
new file mode 100644
index 0000000..41045af
--- /dev/null
+++ b/src/components/nav/index.ts
@@ -0,0 +1,9 @@
+export { Nav, NavGroup, NavItem, NavSection } from './Nav';
+export type {
+  NavGroupProps,
+  NavItemProps,
+  NavLabels,
+  NavProps,
+  NavSectionProps,
+  NavVariant,
+} from './Nav';
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index 35ee7b5..2f42258 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -63,8 +63,8 @@ application's responsibility.
 The contrast gaps of the Slider (rows 15 to 17), Calendar (row 18), FileUpload (rows 19 to 22),
 Alert (rows 23 to 26), Progress (rows 27 to 29), Stepper (rows 30 and 31, and its part in rows 26,
 27 and 29), List (its part in rows 31 and 32) and Table (rows 32 to 34, and its part in rows 2, 6,
-9, 12 and 22) and AppShell (its part in rows 2 and 6) are in the table above, which is built from
-the same data CI checks.
+9, 12 and 22), AppShell (its part in rows 2 and 6) and Nav (row 35, and its part in rows 2, 6, 7, 8,
+12, 29 and 32) are in the table above, which is built from the same data CI checks.
 
 A List row that can be pressed has one link or button, the title, stretched over the whole row. It
 is named by the title alone: the description and the end cell are read when the person browses the
diff --git a/src/index.ts b/src/index.ts
index 82a9354..bec7207 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -281,3 +281,12 @@ export type {
 } from './components/app-shell';
 export { Indicator } from './components/indicator';
 export type { IndicatorProps, IndicatorStatus } from './components/indicator';
+export { Nav, NavGroup, NavItem, NavSection } from './components/nav';
+export type {
+  NavGroupProps,
+  NavItemProps,
+  NavLabels,
+  NavProps,
+  NavSectionProps,
+  NavVariant,
+} from './components/nav';
diff --git a/src/styles/components/nav.css b/src/styles/components/nav.css
new file mode 100644
index 0000000..fe7873b
--- /dev/null
+++ b/src/styles/components/nav.css
@@ -0,0 +1,256 @@
+/* Nav (spec phase 5 §4.3 Nav, mockup N1 and N2): the links of an application, in a column. The parts at
+   the top are shared; each look writes only what differs from them. The state is read from
+   `aria-current="page"` on the link, `aria-disabled` on a link that goes nowhere, and `data-open` and
+   `data-has-active` on a group, so the HTML from the server is already right. This file is the
+   expanded form; the rail is written in the generated rules of the AppShell. */
+@layer flg.components {
+  /* It grows in the body of a sidebar, which is a column, so that the items at the foot are pushed to
+     the end of it. */
+  .flg-nav {
+    box-sizing: border-box;
+    display: flex;
+    flex-direction: column;
+    flex-grow: 1;
+    padding: 10px;
+  }
+  /* The rows of `bar` run to the left edge of the glass. */
+  .flg-nav[data-variant='bar'] {
+    padding-left: 0;
+  }
+  .flg-nav-list {
+    display: flex;
+    flex-direction: column;
+    gap: 2px;
+    margin: 0;
+    padding: 0;
+    list-style: none;
+  }
+
+  /* A block of items under a title, or only the gap before the next block. The first block of the Nav
+     has no gap above it. `margin-top: auto` of the one at the foot comes after, so it wins. */
+  .flg-nav-section {
+    margin-top: 14px;
+  }
+  .flg-nav > :first-child {
+    margin-top: 0;
+  }
+  .flg-nav-section[data-bottom] {
+    display: flex;
+    flex-direction: column;
+    gap: 8px;
+    margin-top: auto;
+    padding-top: 16px;
+  }
+  .flg-nav-section-title {
+    display: flex;
+    align-items: center;
+    height: 28px;
+    padding: 0 10px;
+    color: var(--flg-text-muted);
+    font: var(--flg-weight-medium) var(--flg-text-xs) / 1.2 var(--flg-font-sans);
+  }
+
+  /* A link or the button of a group. A row fills its list: a button does not do that by itself, so it
+     takes the stretch keyword, which fills with the margin box (a child item has a margin on the
+     left); each engine takes the spelling it knows, and `100%` is the fallback for one that knows
+     none. */
+  .flg-nav-item {
+    position: relative;
+    display: flex;
+    align-items: center;
+    gap: 10px;
+    box-sizing: border-box;
+    width: 100%;
+    width: -webkit-fill-available;
+    width: -moz-available;
+    width: stretch;
+    height: 36px;
+    margin: 0;
+    padding: 0 10px;
+    border: 0;
+    border-radius: var(--flg-radius-md);
+    background: none;
+    color: var(--flg-text);
+    font: var(--flg-weight-medium) var(--flg-text-sm) / 1.2 var(--flg-font-sans);
+    text-align: left;
+    text-decoration: none;
+    cursor: pointer;
+    outline: none;
+  }
+  .flg-nav-item-icon {
+    display: inline-flex;
+    flex: none;
+    width: 18px;
+    height: 18px;
+    color: var(--flg-text-muted);
+  }
+  .flg-nav-item-icon > svg {
+    flex: none;
+    width: 18px;
+    height: 18px;
+  }
+  /* A flex item does not shrink below its text unless it may, and a long label ends in an ellipsis. */
+  .flg-nav-item-label {
+    flex: 1;
+    min-width: 0;
+    overflow: hidden;
+    text-overflow: ellipsis;
+    white-space: nowrap;
+  }
+  .flg-nav-item-badge {
+    flex: none;
+  }
+  /* The count of `bar` is a bare number. */
+  .flg-nav-item-count {
+    flex: none;
+    min-width: 16px;
+    color: var(--flg-text-muted);
+    font-size: var(--flg-text-xs);
+    font-weight: var(--flg-weight-semibold);
+    font-variant-numeric: tabular-nums;
+    text-align: right;
+  }
+  .flg-nav-group-chevron {
+    flex: none;
+    width: 16px;
+    height: 16px;
+    color: var(--flg-text-muted);
+    rotate: -90deg;
+    transition: rotate var(--flg-duration-fast) var(--flg-ease);
+  }
+  .flg-nav-group[data-open] > .flg-nav-item > .flg-nav-group-chevron {
+    rotate: 0deg;
+  }
+  @media (hover: hover) {
+    .flg-nav-item:not([aria-current='page'], [aria-disabled='true']):hover {
+      background: var(--flg-control-track);
+    }
+    .flg-nav-item:not([aria-current='page'], [aria-disabled='true']):hover > .flg-nav-item-icon {
+      color: var(--flg-text);
+    }
+  }
+  /* The ring reaches 4px beyond the row, into the next row (2px away), which is positioned and comes
+     later and would paint over it: the row that has the focus is raised above its neighbours. */
+  .flg-nav-item:focus-visible {
+    z-index: 1;
+    outline: 2px solid var(--flg-focus-outline-color);
+    outline-offset: 2px;
+    box-shadow: var(--flg-focus-ring);
+  }
+  .flg-nav-item[aria-disabled='true'] {
+    opacity: 0.5;
+    cursor: not-allowed;
+  }
+
+  /* The links of a group, indented under its icon. The line that joins them to the group is a pseudo
+     element of each link, and takes no pointer. */
+  .flg-nav-sub {
+    margin-top: 2px;
+  }
+  .flg-nav-sub .flg-nav-item {
+    height: 32px;
+    margin-left: 28px;
+    font-weight: var(--flg-weight-regular);
+  }
+  .flg-nav-sub .flg-nav-item::before {
+    content: '';
+    position: absolute;
+    top: -1px;
+    bottom: -1px;
+    left: -9px;
+    width: 1px;
+    background: var(--flg-control-border);
+    pointer-events: none;
+  }
+  /* The first link joins the button of the group, which is above the gap. */
+  .flg-nav-sub .flg-nav-list > li:first-child > .flg-nav-item::before {
+    top: -7px;
+  }
+
+  /* N1: the current page is a soft pill of the accent. The text of the group that holds the page is
+     the accent text on the glass, where the mockup has the selected text: they are one colour here,
+     but with prefers-contrast: more the selected text is made for the solid accent behind it. */
+  .flg-nav[data-variant='pill'] .flg-nav-item[aria-current='page'] {
+    background: var(--flg-selected-bg);
+    color: var(--flg-selected-text);
+    font-weight: var(--flg-weight-semibold);
+  }
+  .flg-nav[data-variant='pill'] .flg-nav-item[aria-current='page'] > .flg-nav-item-icon {
+    color: var(--flg-selected-text);
+  }
+  .flg-nav[data-variant='pill'] .flg-nav-group[data-has-active] > .flg-nav-item {
+    color: var(--flg-accent-text);
+    font-weight: var(--flg-weight-semibold);
+  }
+  .flg-nav[data-variant='pill']
+    .flg-nav-group[data-has-active]
+    > .flg-nav-item
+    > .flg-nav-item-icon {
+    color: var(--flg-accent-text);
+  }
+
+  /* N2: an accent bar on the left edge and a tint that fades out. The tint is not a token (spec
+     §4.2); the contrast checks of the Nav read it from the same tokens. */
+  .flg-nav[data-variant='bar'] {
+    --flg-nav-tint: linear-gradient(
+      90deg,
+      color-mix(in srgb, var(--flg-accent-solid) 18%, transparent),
+      color-mix(in srgb, var(--flg-accent-solid) 3%, transparent)
+    );
+  }
+  .flg-nav[data-variant='bar'] .flg-nav-item {
+    padding-left: 20px;
+    border-radius: 0 var(--flg-radius-md) var(--flg-radius-md) 0;
+  }
+  .flg-nav[data-variant='bar'] .flg-nav-section-title {
+    padding-left: 20px;
+    font-size: var(--flg-text-2xs);
+    font-weight: var(--flg-weight-semibold);
+    letter-spacing: 0.08em;
+    text-transform: uppercase;
+  }
+  .flg-nav[data-variant='bar'] .flg-nav-section[data-bottom] > .flg-divider {
+    width: calc(100% - 10px);
+    margin-left: 10px;
+  }
+  .flg-nav[data-variant='bar'] .flg-nav-sub .flg-nav-item::before {
+    left: 0;
+  }
+  .flg-nav[data-variant='bar'] .flg-nav-item[aria-current='page'] {
+    background: var(--flg-nav-tint);
+    font-weight: var(--flg-weight-semibold);
+  }
+  .flg-nav[data-variant='bar'] .flg-nav-item[aria-current='page'] > .flg-nav-item-icon,
+  .flg-nav[data-variant='bar']
+    .flg-nav-group[data-has-active]
+    > .flg-nav-item
+    > .flg-nav-item-icon {
+    color: var(--flg-accent-text);
+  }
+  .flg-nav[data-variant='bar'] .flg-nav-group[data-has-active] > .flg-nav-item {
+    font-weight: var(--flg-weight-semibold);
+  }
+  /* The count on the current page is the text colour: the muted one is below 4.5:1 on the tint
+     (outside the mockup, which draws no count there). */
+  .flg-nav[data-variant='bar'] .flg-nav-item[aria-current='page'] > .flg-nav-item-count {
+    color: var(--flg-text);
+  }
+  .flg-nav[data-variant='bar'] .flg-nav-item[aria-current='page']::after {
+    content: '';
+    position: absolute;
+    top: 6px;
+    bottom: 6px;
+    left: 0;
+    width: 3px;
+    border-radius: 0 3px 3px 0;
+    background: var(--flg-accent-solid);
+    pointer-events: none;
+  }
+  /* In a group the bar sits on the line that joins the links. */
+  .flg-nav[data-variant='bar'] .flg-nav-sub .flg-nav-item[aria-current='page']::after {
+    top: 3px;
+    bottom: 3px;
+    left: -1px;
+    border-radius: 3px;
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index c98c011..95c4f3c 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -42,6 +42,7 @@
 @import './components/stepper.css';
 @import './components/list.css';
 @import './components/table.css';
+@import './components/nav.css';
 @import './components/app-shell.css';
 @import './generated/app-shell.css';
 @import './components/floating.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 9a4419f..fd9e84b 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -98,6 +98,13 @@
     .flg-list[data-variant='inset'] > .flg-list-item[data-current]::after {
       background: var(--flg-selected-text);
     }
+    /* The current item of a `pill` Nav is the solid accent here, so the Badge of its count drops its
+       track and takes the text colour made for that accent: a neutral Badge on it is 2.19:1 in light
+       and 1.74:1 in dark (spec phase 5 §4.4). */
+    .flg-nav[data-variant='pill'] .flg-nav-item[aria-current='page'] .flg-nav-item-badge {
+      background: none;
+      color: var(--flg-selected-text);
+    }
     /* A row that can be pressed does not change its background under the pointer: a Badge in its end
        cell would fall below 4.5:1 on the hover background. `cards` still lifts and darkens its shadow,
        and the current row keeps its own background. */
@@ -173,6 +180,12 @@
       ) {
       outline-offset: -2px;
     }
+    /* A row of `bar` runs to the edge of the glass, and the ring of a row at the edge would be cut by
+       what clips it (the body of the sidebar scrolls): it is drawn inside the row instead, as in a
+       `lined` Table. Only the offset changes, so one rule serves both modes (spec phase 5 §4.3). */
+    .flg-nav[data-variant='bar'] .flg-nav-item:focus-visible {
+      outline-offset: -2px;
+    }
   }
   @media (forced-colors: active) {
     /* A Surface, and each card of a `cards` List, which takes its glass (surface.css). */
@@ -779,6 +792,35 @@
       > *::before {
       background-color: Canvas;
     }
+    /* The current item of a `pill` Nav loses its background, so it has an outline drawn inside it,
+       as the current row of a List does; one with the focus keeps the focus: its ring is outside, in
+       the text colour, and the rule is one selector more specific than the one above (spec phase 5
+       §4.5). */
+    .flg-nav[data-variant='pill'] .flg-nav-item[aria-current='page'] {
+      outline: 2px solid Highlight;
+      outline-offset: -2px;
+    }
+    .flg-nav[data-variant='pill'] .flg-nav-item[aria-current='page']:focus-visible {
+      outline: 2px solid CanvasText;
+      outline-offset: 2px;
+    }
+    /* The tint of `bar` is a gradient, which the system drops; the bar is the selection colour. */
+    .flg-nav[data-variant='bar'] .flg-nav-item[aria-current='page'] {
+      background-image: none;
+    }
+    .flg-nav[data-variant='bar'] .flg-nav-item[aria-current='page']::after {
+      forced-color-adjust: none;
+      background: Highlight;
+    }
+    /* The line that joins the links of a group to it is decoration, and a background is dropped. */
+    .flg-nav-sub .flg-nav-item::before {
+      forced-color-adjust: none;
+      background: CanvasText;
+    }
+    .flg-nav-item[aria-disabled='true'],
+    .flg-nav-item[aria-disabled='true'] > :is(.flg-nav-item-icon, .flg-nav-item-count) {
+      color: GrayText;
+    }
   }
   /* Repeating motion cannot be stopped by a duration of 0ms, which would repeat for ever (spec
      phase 4 §3.3), so what moves without end is stopped by hand here. Motion that happens once keeps
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/nav src/components/app-shell src/index.test.ts src/docs src/internal
pnpm vitest run --project scripts
pnpm check:contrast
pnpm vitest run --project storybook-light src/components/nav
pnpm vitest run --project storybook-dark src/components/nav
pnpm vitest run --project storybook-light src/components/app-shell
pnpm vitest run --project storybook-dark src/components/app-shell
pnpm build && pnpm check:package
pnpm build-storybook
pnpm check:docs-tables
```

Expected:
- `lint`, `typecheck`, `format:check`: PASS.
- Unit: 69 file, 865 test PASS, 4 skip (hai project React cộng lại; ca tham chiếu lazy chỉ chạy ở React 19), không lỗi kiểu. `Nav.test.tsx` có 73 test và `Nav.test-d.ts` 6 test kiểu ở mỗi project. `src/docs`: `ExceptionTable` đòi 35 dòng.
- `scripts`: 99 test PASS (thêm 7 test của Nav).
- `pnpm check:contrast`: PASS (`Contrast check passed.`). Ngoại lệ mới duy nhất là dòng 35 (`nav-bar-indicator`, light 2.52, dark 2.03); ở `prefers-contrast: more` ba check đều đạt (ví dụ `pass dark contrast-more nav-bar-text 10.17 (min 4.5)`).
- Story nav: 24 test PASS ở mỗi project (8 story × ba engine). `FocusRings` và `PillCurrentItemKeepsItsFocusRing` chỉ kiểm ở Chromium (phát hiện 8).
- Story app-shell: 165 test PASS ở mỗi project, sau khi tách context.
- `pnpm build && pnpm check:package`: PASS. `check:dist-css` thấy 12 class `flg-nav*`; `check:use-client` có `Nav.tsx` (36 module client); `size`: JS 50.79 kB trên 54.61 kB, CSS 14.88 kB trên 15.49 kB.
- `pnpm build-storybook`: PASS. Trong index, chỉ `Pill` và `Bar` của Nav không gắn `no-visual` (128 story có ảnh). Trang autodocs của `Components/Nav` có ở task này; Task 4 thay nó bằng `Nav.mdx`.
- `pnpm check:docs-tables`: PASS.
- Nav là component mới, tách context không đổi DOM của AppShell, và các file dùng chung chỉ được thêm vào (phát hiện 18), nên ảnh chuẩn cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md \
  docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md \
  scripts/check-dist-css.ts \
  scripts/check-use-client.ts \
  scripts/contrast-exceptions.ts \
  scripts/lib/contrast.test.ts \
  scripts/lib/contrast.ts \
  src/components/app-shell/AppShell.test.tsx \
  src/components/app-shell/AppShell.tsx \
  src/components/app-shell/app-shell-context.ts \
  src/components/nav/Nav.stories.tsx \
  src/components/nav/Nav.test-d.ts \
  src/components/nav/Nav.test.tsx \
  src/components/nav/Nav.tsx \
  src/components/nav/index.ts \
  src/docs/Accessibility.mdx \
  src/docs/ExceptionTable.test.tsx \
  src/index.test.ts \
  src/index.ts \
  src/styles/components/nav.css \
  src/styles/index.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(nav): add Nav, NavSection, NavItem and NavGroup, expanded, in pill and bar" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 3: Nav ở rail: tooltip, chấm số đếm, chữ cái đầu và flyout của nhóm

Spec §1 (phần rail của dòng Nav; phần Tooltip của dòng "Thay đổi ở component cũ"; phần tooltip của dòng "Kiểm thử"), §2 "Thay đổi ở code cũ" (Plan B), §3.5 (phần rail của dòng "Màn rộng hay hẹp trong JS"), §3.6 (rail không có animation), §4.1 (N1, N2: cột rail, tooltip, flyout), §4.3 **Nav** "Rail" (hai variant, tooltip, flyout), §4.4 (dòng 2, 6, 7, 8 ở rail và flyout), §4.5 **Nav** (phần rail), §5 (tuỳ chọn `describe` của Tooltip; cảnh báo mục cấp 1 không có icon; `usePopover`, `useFloating`), §6.3 `NavItem` "Ở rail" và `NavGroup` "Ở rail", §7 lớp 1–3 cho rail và móc `data-visual-hover="tooltip"`, §10 (dòng flyout). Báo cáo và code của Task 2 là điểm bắt đầu.
- **Tooltip**: `TooltipRoot` với tuỳ chọn nội bộ `describe` (phát hiện 12).
- **`AppShellSidebarContext`**: `true` trong thân sidebar; rail chỉ ở đó (phát hiện 10).
- **Quy tắc rail** trong mẫu màn rộng của bộ sinh, khoá trên `[data-collapsed]` của khung ở từng điểm gãy, nên HTML từ server đúng; forced colors của rail trong một khối `@layer flg.preferences` sinh riêng; test của bộ sinh thêm 15 test (phát hiện 9).
- **`NavItem` ở rail**: tooltip với nhãn (`describe: false`), số đếm thành chấm của Indicator, không icon thì chữ cái đầu (`aria-hidden`), và cảnh báo của §5 (phát hiện 10).
- **`NavGroup` ở rail**: tooltip, chữ cái đầu, cảnh báo, và flyout đúng §6.3 (phát hiện 11).
- **`nav.css`**: phần chỉ rail có bị ẩn ở dạng mở rộng; quy tắc của flyout (phát hiện 9).
- **Harness**: `tests/visual/stories.visual.ts` chờ tooltip mở khi móc là `data-visual-hover="tooltip"` (phát hiện 13).
- **Story:** `PillRail`, `BarRail` là story giao diện (AppShell S1 thu gọn, `stage: 'page'`, 1280×720); `RailGeometry`, `RailTooltips`, `RailFlyout`, `RailFlyoutAndTheExpandedSidebar` gắn `no-visual`.
- Spec §4.3, §5, §6.3 được sửa (phát hiện 17). Cuối task, `check:package` PASS, CSS còn 151 B dưới ngưỡng cũ (phát hiện 15).

**Files:**
- Create: `src/components/nav/Nav.rail.test.tsx`
- Modify: `src/components/nav/Nav.tsx`, `src/components/nav/Nav.stories.tsx`, `src/components/tooltip/Tooltip.tsx`, `src/components/tooltip/Tooltip.test.tsx`, `src/components/app-shell/AppShell.tsx`, `src/components/app-shell/app-shell-context.ts`, `src/styles/components/nav.css`, `scripts/lib/app-shell-css.ts`, `scripts/lib/app-shell-css.test.ts`, `scripts/check-dist-css.ts`, `tests/visual/stories.visual.ts`, `docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md`

**Interfaces:**
- Produces trong `src/components/tooltip/Tooltip.tsx` (không export từ `tooltip/index.ts` hay `src/index.ts`): `TooltipRoot(props: TooltipProps & { describe?: boolean })`, `describe` mặc định `true`. `Tooltip` công khai chỉ chuyển `open`, `defaultOpen`, `onOpenChange`, `delay`, `children` xuống `TooltipRoot`. Context của Tooltip thêm `describe`; `TooltipTrigger` chỉ nối `aria-describedby` khi nó `true`.
- Produces trong `src/components/app-shell/app-shell-context.ts`: `AppShellSidebarContext = createContext(false)`. `AppShellSidebar` bọc `children` của thân (`.flg-app-shell-sidebar-body`) bằng `<AppShellSidebarContext.Provider value>`.
- Nội bộ trong `Nav.tsx`: `useRailState(level)` → `{ railable, rail }` (railable: phần cấp 1, trong sidebar, AppShell `collapsible`; rail: thêm `collapsed && isWide`); `useRailTooltip(show)`; `firstLetter(label)`; `CountDot`; `RAIL_TOOLTIP_OFFSET = 20`, `FLYOUT_OFFSET = 26`, `FLYOUT_ALIGN_OFFSET = -6`.
- DOM thêm:
  - Mục railable (không tắt): `TooltipRoot describe={false}` quanh link; `TooltipContent side="right" sideOffset={20}` chỉ render ở rail. Không có icon: `span.flg-nav-item-letter[aria-hidden]` ở chỗ của icon. Có số đếm: `span.flg-indicator-mark[data-dot][data-status="accent"][aria-hidden]` sau số đếm.
  - `NavGroup`: nút có tooltip và chữ cái đầu như mục. `div.flg-nav-sub` có `div.flg-nav-flyout-title[aria-hidden]` (ở mọi nhóm) trước `ul`; ở rail thêm `popover="auto"`, lớp `flg-surface flg-popover`, `data-side="right"`, `data-align="start"`, và `span.flg-popover-arrow` khi mở. Ở rail `aria-expanded` và `hidden` theo flyout.
- `scripts/lib/app-shell-css.ts`: `railRules(shell)` (nội bộ, gọi trong `wideRules`); `railForcedColorsRules(breakpoint: AppShellBreakpointName): string` (export); `buildAppShellCss()` thêm một khối `@layer flg.preferences` với ba `@media (forced-colors: active) and (min-width: N)`; hằng `VISUALLY_HIDDEN`. Selector: `.flg-app-shell[data-breakpoint='<bp>'][data-collapsed] > .flg-app-shell-sidebar .flg-nav`, mục là `.flg-nav-item:not(.flg-nav-sub .flg-nav-item)`.
- `src/styles/components/nav.css`: `.flg-nav-item-letter`, `.flg-nav-item > .flg-indicator-mark`, `.flg-nav-flyout-title` là `display: none` ở dạng mở rộng; `.flg-nav-sub.flg-popover` và các quy tắc của flyout.
- Cảnh báo dev (sau tiền tố `[h2d-glass-ui] `), chỉ cho Nav trong sidebar của một AppShell `collapsible`:
  - `<NavItem> at the top level needs an icon when the sidebar can collapse to a rail; the rail shows the first letter of its label instead.`
  - `<NavGroup> at the top level needs an icon when the sidebar can collapse to a rail; the rail shows the first letter of its label instead.`
- Danh sách kiểm tra gói: `scripts/check-dist-css.ts` thêm `flg-nav-item-letter`, `flg-nav-flyout-title`, và ở mỗi điểm gãy một kiểm tra khối rail (mục của sidebar, link của flyout bị loại ra) và một kiểm tra khối forced colors của rail.
- Harness: `tests/visual/stories.visual.ts`, sau `hover.hover()`: nếu `data-visual-hover` của phần tử được trỏ là `'tooltip'` thì `await page.locator("[role='tooltip']:popover-open").waitFor()` trước khi chụp.
- Story: `Menu({ variant, rail })` (ở rail "Calendar" mang `data-visual-hover="tooltip"`, "Members" không còn móc), `RailShell`, `railDrawn`, `openFlyout`; `PillRail`, `BarRail` (giao diện, `stage: 'page'`); `RailGeometry`, `RailTooltips`, `RailFlyout`, `RailFlyoutAndTheExpandedSidebar` (`no-visual`, `stage: 'page'`).
- Consumes: `usePopover`, `useFloating`, `usePopoverState`, `useTriggerPress`, `TooltipRoot`, `TooltipTrigger`, `TooltipContent`; `AppShellContext` (`collapsible`, `collapsed`, `isWide`); `.flg-indicator-mark` của Task 1; trong story: `settled`, `APP_SHELL_BREAKPOINTS`.
- Plan C dùng: `TooltipRoot describe={false}` cho nút thu gọn của SearchField và cho ThemeSwitch; `data-visual-hover="tooltip"` cho story `SearchFieldCollapsible`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/scripts/lib/app-shell-css.test.ts b/scripts/lib/app-shell-css.test.ts
index d5ff73c..104f042 100644
--- a/scripts/lib/app-shell-css.test.ts
+++ b/scripts/lib/app-shell-css.test.ts
@@ -1,5 +1,11 @@
 import { describe, expect, it } from 'vitest';
-import { APP_SHELL_BREAKPOINTS, buildAppShellCss, sheetRules, wideRules } from './app-shell-css';
+import {
+  APP_SHELL_BREAKPOINTS,
+  buildAppShellCss,
+  railForcedColorsRules,
+  sheetRules,
+  wideRules,
+} from './app-shell-css';
 
 const flat = (text: string) => text.replace(/\s+/g, ' ').trim();
 
@@ -51,7 +57,16 @@ describe('buildAppShellCss', () => {
       'not all and (min-width: 1024px)',
       'not all and (min-width: 1280px)',
     ]);
-    expect(all).toHaveLength(6);
+    // The rail in forced colours has a block per breakpoint too, in the preferences layer, bounded by
+    // that one width and no other.
+    expect(
+      all.filter(([query]) => query.startsWith('(forced-colors')).map(([query]) => query),
+    ).toEqual([
+      '(forced-colors: active) and (min-width: 768px)',
+      '(forced-colors: active) and (min-width: 1024px)',
+      '(forced-colors: active) and (min-width: 1280px)',
+    ]);
+    expect(all).toHaveLength(9);
     expect(css).not.toMatch(/1023|767|1279/);
   });
 
@@ -257,4 +272,179 @@ describe('buildAppShellCss', () => {
       );
     });
   });
+
+  describe('the Nav as a rail', () => {
+    const body = wideRules('lg');
+    const shell = ".flg-app-shell[data-breakpoint='lg']";
+    // Every selector of the rail goes through the sidebar of the collapsed shell: a Nav elsewhere in
+    // the page is never a rail.
+    const rail = `${shell}[data-collapsed] > .flg-app-shell-sidebar .flg-nav`;
+    const item = `${rail} .flg-nav-item:not(.flg-nav-sub .flg-nav-item)`;
+    const rule = (selector: string) => {
+      const start = body.indexOf(`${selector} {`);
+      expect(start, `${selector} has a rule`).toBeGreaterThanOrEqual(0);
+      return body.slice(start, body.indexOf('}', start));
+    };
+    /** The selectors of every rule that mentions the Nav. */
+    const navSelectors = [...body.matchAll(/^([^\n{}/]*\.flg-nav[^\n{}]*)[{,]/gm)].map((match) =>
+      match[1]!.trim(),
+    );
+
+    it('starts every selector at the sidebar of the shell that is collapsed, at its own breakpoint', () => {
+      expect(navSelectors.length).toBeGreaterThan(10);
+      for (const selector of navSelectors) {
+        expect(selector, selector).toMatch(
+          /^\.flg-app-shell\[data-breakpoint='lg'\]\[data-collapsed\] > \.flg-app-shell-sidebar \.flg-nav/,
+        );
+      }
+    });
+
+    it('makes an item a 40px square with no padding and 20px icons, a group button too', () => {
+      const square = rule(item);
+      expect(square).toContain('width: 40px');
+      expect(square).toContain('height: 40px');
+      expect(square).toContain('padding: 0');
+      expect(square).toContain('justify-content: center');
+      expect(square).toContain('border-radius: var(--flg-radius-md)');
+      expect(rule(`${item} > .flg-nav-item-icon`)).toContain('width: 20px');
+      expect(rule(`${item} > .flg-nav-item-icon > svg`)).toContain('height: 20px');
+    });
+
+    it('never touches the links of a flyout, which are drawn with their labels', () => {
+      // The item selector leaves out whatever is inside `.flg-nav-sub`, and no rule of the rail
+      // reaches `.flg-nav-item` without it.
+      for (const selector of navSelectors.filter((selector) =>
+        /\.flg-nav-item(?![-\w])/.test(selector),
+      )) {
+        expect(selector, selector).toMatch(
+          /:not\(\.flg-nav-sub \.flg-nav-item\)|\.flg-nav-group\[data-has-active\] > \.flg-nav-item/,
+        );
+      }
+    });
+
+    it('hides the label and the count from the eye only, and the chevron altogether', () => {
+      const hidden = rule(
+        `${item} > :not(.flg-nav-item-icon, .flg-nav-item-letter, .flg-indicator-mark)`,
+      );
+      // The technique of `flg-visually-hidden`: they stay in the page, as the name of the link.
+      expect(hidden).toContain('position: absolute');
+      expect(hidden).toContain('clip-path: inset(50%)');
+      expect(hidden).not.toContain('display: none');
+      expect(rule(`${item} > .flg-nav-group-chevron`)).toContain('display: none');
+      // The chevron's rule comes after, so that it wins over the one above at equal specificity.
+      expect(body.indexOf(`${item} > .flg-nav-group-chevron {`)).toBeGreaterThan(
+        body.indexOf(`${item} > :not(`),
+      );
+    });
+
+    it('shows the dot and the first letter, which the expanded form hides', () => {
+      expect(rule(`${item} > .flg-indicator-mark`)).toContain('display: block');
+      expect(rule(`${item} > .flg-nav-item-letter`)).toContain('display: block');
+      expect(rule(`${item} > .flg-nav-item-letter`)).toContain(
+        'font: var(--flg-weight-semibold) var(--flg-text-sm)',
+      );
+    });
+
+    it('draws the title of a section out of sight, and a rule of 28px in its place', () => {
+      expect(rule(`${rail} .flg-nav-section-title`)).toContain('clip-path: inset(50%)');
+      const line = rule(`${rail} > .flg-nav-section:not([data-bottom])::before`);
+      expect(line).toContain('width: 28px');
+      expect(line).toContain('height: 1px');
+      expect(line).toContain('margin: 4px 0');
+      expect(line).toContain('background: var(--flg-control-border)');
+      // Nothing above the first block to be set off from.
+      expect(rule(`${rail} > .flg-nav-section:first-child::before`)).toContain('display: none');
+    });
+
+    it('keeps the section at the foot at the foot, with its divider at the width of the rule', () => {
+      const foot = rule(`${rail} > .flg-nav-section[data-bottom]`);
+      expect(foot).toContain('margin-top: auto');
+      expect(foot).toContain('padding-top: 12px');
+      expect(foot).toContain('gap: 8px');
+      expect(rule(`${rail} > .flg-nav-section[data-bottom] > .flg-divider`)).toContain(
+        'width: 28px',
+      );
+      // After the rule for every section, which sets the gap and the margin the foot changes.
+      expect(body.indexOf(`${rail} > .flg-nav-section[data-bottom] {`)).toBeGreaterThan(
+        body.indexOf(`${rail} > .flg-nav-section {`),
+      );
+    });
+
+    it('draws the list of links of a group only while it is the open flyout', () => {
+      expect(rule(`${rail} .flg-nav-sub:not(:popover-open)`)).toContain('display: none');
+    });
+
+    it('makes the group that holds the current page look as the current page does', () => {
+      const pill = `${rail}[data-variant='pill'] .flg-nav-group[data-has-active] > .flg-nav-item`;
+      const bar = `${rail}[data-variant='bar'] .flg-nav-group[data-has-active] > .flg-nav-item`;
+      expect(rule(pill)).toContain('background: var(--flg-selected-bg)');
+      expect(rule(`${pill} > :is(.flg-nav-item-icon, .flg-nav-item-letter)`)).toContain(
+        'color: var(--flg-selected-text)',
+      );
+      expect(rule(bar)).toContain('background: var(--flg-nav-tint)');
+    });
+
+    it('puts the bar of N2 1px inside the rail, 8px from the top and the bottom, and takes no pointer', () => {
+      const group = `${rail}[data-variant='bar'] .flg-nav-group[data-has-active] > .flg-nav-item::after`;
+      const bar = rule(
+        `${group},\n${rail}[data-variant='bar'] .flg-nav-item[aria-current='page']:not(.flg-nav-sub .flg-nav-item)::after`,
+      );
+      expect(bar).toContain('left: -13px');
+      expect(bar).toContain('top: 8px');
+      expect(bar).toContain('bottom: 8px');
+      expect(bar).toContain('width: 3px');
+      expect(bar).toContain('border-radius: 0 3px 3px 0');
+      expect(bar).toContain('background: var(--flg-accent-solid)');
+      expect(bar).toContain('pointer-events: none');
+    });
+
+    it('is the same rules at each breakpoint, picked by the data-breakpoint of the root', () => {
+      const strip = (name: 'md' | 'lg' | 'xl') => wideRules(name).replaceAll(`'${name}'`, "'BP'");
+      expect(strip('md')).toBe(strip('xl'));
+      expect(wideRules('md')).toContain(
+        ".flg-app-shell[data-breakpoint='md'][data-collapsed] > .flg-app-shell-sidebar .flg-nav {",
+      );
+    });
+
+    describe('in forced colours', () => {
+      const css = buildAppShellCss();
+      const layer = css.slice(css.indexOf('@layer flg.preferences'));
+      const block = mediaBlocks(layer)[1]![1];
+
+      it('is in the preferences layer, once per breakpoint, bounded by the width of its own', () => {
+        expect(css.indexOf('@layer flg.preferences')).toBeGreaterThan(
+          css.indexOf('@layer flg.components'),
+        );
+        expect(mediaBlocks(layer)).toHaveLength(3);
+        for (const [index, name] of (['md', 'lg', 'xl'] as const).entries()) {
+          const [, text] = mediaBlocks(layer)[index]!;
+          expect([...new Set(text.match(/data-breakpoint='[a-z]+'/g))]).toEqual([
+            `data-breakpoint='${name}'`,
+          ]);
+          expect(flat(text)).toBe(flat(railForcedColorsRules(name)));
+        }
+      });
+
+      it('outlines a group that holds the current page in N1, unless it has the focus', () => {
+        expect(block).toMatch(
+          /\[data-variant='pill'\] \.flg-nav-group\[data-has-active\] > \.flg-nav-item:not\(:focus-visible\) \{\s*outline: 2px solid Highlight;\s*outline-offset: -2px;/,
+        );
+      });
+
+      it('drops the tint of N2 and draws its bar in the selection colour', () => {
+        expect(block).toMatch(
+          /\[data-variant='bar'\] \.flg-nav-group\[data-has-active\] > \.flg-nav-item \{\s*background-image: none;/,
+        );
+        expect(block).toMatch(
+          /\[data-variant='bar'\] \.flg-nav-group\[data-has-active\] > \.flg-nav-item::after \{\s*forced-color-adjust: none;\s*background: Highlight;/,
+        );
+      });
+
+      it('draws the rule between two blocks in the text colour', () => {
+        expect(block).toMatch(
+          /\.flg-nav-section:not\(\[data-bottom\]\)::before \{\s*forced-color-adjust: none;\s*background: CanvasText;/,
+        );
+      });
+    });
+  });
 });
diff --git a/src/components/nav/Nav.rail.test.tsx b/src/components/nav/Nav.rail.test.tsx
new file mode 100644
index 0000000..825d9f3
--- /dev/null
+++ b/src/components/nav/Nav.rail.test.tsx
@@ -0,0 +1,599 @@
+import { act, fireEvent, render, screen, within } from '@testing-library/react';
+import { createRef } from 'react';
+import type { ComponentProps, ReactNode } from 'react';
+import { renderToString } from 'react-dom/server';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import { resize, stubWindow } from '../../../tests/app-shell-window';
+import { AppShell, AppShellHeader, AppShellMain, AppShellSidebar } from '../app-shell/AppShell';
+import { Nav, NavGroup, NavItem, NavSection } from './Nav';
+
+// The rail is the sidebar of a wide AppShell that is collapsed. jsdom has no `matchMedia` and no
+// Popover API, so the window is stubbed (tests/app-shell-window.ts) and so is the part of the Popover
+// API the library asks: which popovers show.
+const showing = new Set<Element>();
+const original = {
+  showPopover: HTMLElement.prototype.showPopover,
+  hidePopover: HTMLElement.prototype.hidePopover,
+  matches: Element.prototype.matches,
+};
+
+beforeEach(() => {
+  resetDevWarnings();
+  showing.clear();
+  HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
+    showing.add(this);
+  };
+  HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
+    showing.delete(this);
+  };
+  Element.prototype.matches = function matches(this: Element, selector: string) {
+    return selector === ':popover-open' ? showing.has(this) : original.matches.call(this, selector);
+  } as typeof Element.prototype.matches;
+});
+afterEach(() => {
+  Object.assign(HTMLElement.prototype, {
+    showPopover: original.showPopover,
+    hidePopover: original.hidePopover,
+  });
+  Element.prototype.matches = original.matches;
+  vi.restoreAllMocks();
+  vi.unstubAllGlobals();
+  vi.useRealTimers();
+});
+
+const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
+const warnings = (warn: ReturnType<typeof spyWarn>) => warn.mock.calls.map((call) => call[0]);
+const ICON = <svg data-testid="icon" />;
+const NO_ICON_WARNING =
+  '<NavItem> at the top level needs an icon when the sidebar can collapse to a rail; the rail shows the first letter of its label instead.';
+// The label and the count are two flex items, and jsdom, with no layout, writes them together.
+const named = (label: string, count: string) => new RegExp(`^${label}\\s?${count}$`);
+const tooltips = () => [...document.querySelectorAll<HTMLElement>('[role="tooltip"]')];
+const flyout = () => document.querySelector<HTMLElement>('.flg-nav-sub')!;
+// jsdom does not know that a popover that shows is displayed, so its links are looked up as hidden.
+const inFlyout = (name: string) => within(flyout()).getByRole('link', { name, hidden: true });
+const groupButton = () => screen.getByRole('button', { name: 'Design' });
+
+function Menu(props: ComponentProps<typeof Nav>) {
+  return (
+    <Nav {...props}>
+      <NavItem href="/" icon={ICON} active>
+        Overview
+      </NavItem>
+      <NavItem href="/inbox" icon={ICON} badge={12}>
+        Inbox
+      </NavItem>
+      <NavItem href="/archive" icon={ICON} disabled>
+        Archive
+      </NavItem>
+      <NavSection title="Projects">
+        <NavGroup label="Design" icon={ICON}>
+          <NavItem href="/design/system" badge={2} active>
+            Design system
+          </NavItem>
+          <NavItem href="/design/mobile">Mobile app</NavItem>
+        </NavGroup>
+      </NavSection>
+    </Nav>
+  );
+}
+
+function Shell({ nav, ...props }: { nav?: ReactNode } & ComponentProps<typeof AppShell>) {
+  return (
+    <AppShell {...props}>
+      <AppShellHeader>Header</AppShellHeader>
+      <AppShellSidebar>{nav ?? <Menu />}</AppShellSidebar>
+      <AppShellMain>
+        <button type="button">Elsewhere</button>
+      </AppShellMain>
+    </AppShell>
+  );
+}
+
+/** Lets the delay of a tooltip pass. */
+const hover = (element: Element) => {
+  fireEvent.pointerEnter(element, { pointerType: 'mouse' });
+  act(() => {
+    vi.advanceTimersByTime(600);
+  });
+};
+
+describe('the Nav as a rail', () => {
+  beforeEach(() => {
+    vi.useFakeTimers();
+    stubWindow(true);
+  });
+
+  describe('the tooltip of an item', () => {
+    it('shows the label, on the right, 20px from the item, and does not describe the link by it', () => {
+      render(<Shell defaultCollapsed />);
+      const link = screen.getByRole('link', { name: named('Inbox', '12') });
+      // The label is the name already: a description would be read a second time.
+      expect(link).not.toHaveAttribute('aria-describedby');
+      const tip = tooltips().find((element) => element.textContent === 'Inbox')!;
+      expect(tip).toBeDefined();
+      expect(tip).toHaveAttribute('data-side', 'right');
+      expect(showing.has(tip)).toBe(false);
+      hover(link);
+      expect(showing.has(tip)).toBe(true);
+      fireEvent.pointerLeave(link);
+      act(() => {
+        vi.advanceTimersByTime(200);
+      });
+      expect(showing.has(tip)).toBe(false);
+    });
+
+    it('is the label of a group button too', () => {
+      render(<Shell defaultCollapsed />);
+      expect(groupButton()).not.toHaveAttribute('aria-describedby');
+      const tip = tooltips().find((element) => element.textContent === 'Design')!;
+      hover(groupButton());
+      expect(showing.has(tip)).toBe(true);
+    });
+
+    it.each([
+      ['expanded', { defaultCollapsed: false }],
+      ['collapsed on a narrow screen', { defaultCollapsed: true }],
+    ])('is not in the page while the sidebar is %s', (name, props) => {
+      stubWindow(name === 'expanded');
+      render(<Shell {...props} />);
+      expect(tooltips()).toHaveLength(0);
+    });
+
+    it('is not for an item that is disabled, which cannot be reached', () => {
+      const warn = spyWarn();
+      render(<Shell defaultCollapsed />);
+      expect(tooltips().map((element) => element.textContent)).not.toContain('Archive');
+      expect(warnings(warn)).toEqual([]);
+    });
+
+    it('is not for the links in the list of a group: they are drawn with their labels in the flyout', () => {
+      render(<Shell defaultCollapsed />);
+      expect(tooltips().map((element) => element.textContent)).toEqual([
+        'Overview',
+        'Inbox',
+        'Design',
+      ]);
+    });
+
+    it('goes away when the sidebar is expanded and comes back with the rail, on a mounted nav', () => {
+      render(<Shell defaultCollapsed />);
+      expect(tooltips()).toHaveLength(3);
+      fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
+      expect(tooltips()).toHaveLength(0);
+      fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
+      expect(tooltips()).toHaveLength(3);
+    });
+
+    it('keeps the link element, and its focus, when the rail comes and goes', () => {
+      render(<Shell />);
+      const link = screen.getByRole('link', { name: named('Inbox', '12') });
+      link.focus();
+      fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
+      expect(screen.getByRole('link', { name: named('Inbox', '12') })).toBe(link);
+      expect(link).toHaveFocus();
+      fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
+      expect(screen.getByRole('link', { name: named('Inbox', '12') })).toBe(link);
+    });
+
+    it('works for the link of asChild, and the caller’s ref still reaches the element', () => {
+      const ref = createRef<HTMLAnchorElement>();
+      render(
+        <Shell
+          defaultCollapsed
+          nav={
+            <Nav>
+              <NavItem asChild icon={ICON}>
+                <a href="/inbox" ref={ref}>
+                  Inbox
+                </a>
+              </NavItem>
+            </Nav>
+          }
+        />,
+      );
+      const link = screen.getByRole('link', { name: 'Inbox' });
+      expect(ref.current).toBe(link);
+      expect(link).not.toHaveAttribute('aria-describedby');
+      hover(link);
+      expect(tooltips().some((element) => showing.has(element))).toBe(true);
+    });
+
+    it('keeps the description the caller gave the link, and adds none', () => {
+      render(
+        <Shell
+          defaultCollapsed
+          nav={
+            <Nav>
+              <NavItem href="/inbox" icon={ICON} aria-describedby="hint">
+                Inbox
+              </NavItem>
+            </Nav>
+          }
+        />,
+      );
+      expect(screen.getByRole('link', { name: 'Inbox' })).toHaveAttribute(
+        'aria-describedby',
+        'hint',
+      );
+    });
+  });
+
+  describe('the count', () => {
+    it('is a dot of the Indicator in the link of an item that has a badge, hidden from screen readers', () => {
+      render(<Shell defaultCollapsed />);
+      const link = screen.getByRole('link', { name: named('Inbox', '12') });
+      const dot = link.querySelector('.flg-indicator-mark')!;
+      expect(dot).toHaveAttribute('data-dot');
+      expect(dot).toHaveAttribute('data-status', 'accent');
+      expect(dot).toHaveAttribute('aria-hidden', 'true');
+      expect(dot).toBeEmptyDOMElement();
+      // The number stays, for the name of the link and for the expanded form.
+      expect(within(link).getByText('12')).toBeInTheDocument();
+    });
+
+    it('is only in the item that has a badge, 0 included, and not in the links of a group', () => {
+      render(
+        <Shell
+          nav={
+            <Nav>
+              <NavItem href="/a" icon={ICON}>
+                A
+              </NavItem>
+              <NavItem href="/b" icon={ICON} badge={0}>
+                B
+              </NavItem>
+              <NavItem href="/c" icon={ICON} badge={<b>new</b>}>
+                C
+              </NavItem>
+              <NavItem href="/d" icon={ICON} badge="">
+                D
+              </NavItem>
+              <NavGroup label="G" icon={ICON}>
+                <NavItem href="/e" badge={3}>
+                  E
+                </NavItem>
+              </NavGroup>
+            </Nav>
+          }
+        />,
+      );
+      const dotted = [...document.querySelectorAll('.flg-nav-item')]
+        .filter((item) => item.querySelector('.flg-indicator-mark'))
+        .map((item) => item.textContent);
+      expect(dotted).toEqual(['B0', 'Cnew']);
+    });
+
+    it('is in the HTML from the server, so the rail is right before anything runs', () => {
+      const html = renderToString(<Shell defaultCollapsed />);
+      expect(html).toContain('data-collapsed');
+      expect(html).toContain('flg-indicator-mark');
+      // There is no window on the server: it is the narrow form until the page is hydrated.
+      expect(html).not.toContain('role="tooltip"');
+      expect(html).not.toContain('popover=');
+    });
+  });
+
+  describe('the first letter', () => {
+    const Letters = ({ collapsible = true }: { collapsible?: boolean }) => (
+      <Shell
+        collapsible={collapsible}
+        {...(collapsible ? { defaultCollapsed: true } : {})}
+        nav={
+          <Nav>
+            <NavItem href="/inbox">Inbox</NavItem>
+            <NavItem href="/b" icon={ICON}>
+              Boards
+            </NavItem>
+            <NavItem href="/c">
+              <i>Calendar</i>
+            </NavItem>
+            <NavGroup label="Design">
+              <NavItem href="/d">Deep dive</NavItem>
+            </NavGroup>
+            <NavItem asChild>
+              <a href="/f">Files</a>
+            </NavItem>
+          </Nav>
+        }
+      />
+    );
+
+    it('stands where the icon would, hidden from screen readers, for an item and a group with no icon', () => {
+      spyWarn();
+      render(<Letters />);
+      const letter = (name: string | RegExp) =>
+        screen.getByRole('link', { name }).querySelector('.flg-nav-item-letter');
+      expect(letter('Inbox')).toHaveTextContent('I');
+      expect(letter('Inbox')).toHaveAttribute('aria-hidden', 'true');
+      expect(letter('Files')).toHaveTextContent('F');
+      expect(groupButton().querySelector('.flg-nav-item-letter')).toHaveTextContent('D');
+      // The letter is not part of the name.
+      expect(screen.getByRole('link', { name: 'Inbox' })).toBeInTheDocument();
+    });
+
+    it('is not drawn for an item that has an icon, a label that is not a string, or a link of a group', () => {
+      spyWarn();
+      render(<Letters />);
+      expect(
+        screen.getByRole('link', { name: 'Boards' }).querySelector('.flg-nav-item-letter'),
+      ).toBeNull();
+      expect(
+        screen.getByRole('link', { name: 'Calendar' }).querySelector('.flg-nav-item-letter'),
+      ).toBeNull();
+      expect(
+        screen
+          .getAllByRole('link', { hidden: true })
+          .find((link) => link.textContent === 'Deep dive')!
+          .querySelector('.flg-nav-item-letter'),
+      ).toBeNull();
+    });
+
+    it('takes the first character whole, an emoji or a letter with a mark, not half of it', () => {
+      render(
+        <Shell
+          defaultCollapsed
+          nav={
+            <Nav>
+              <NavItem href="/a" icon={ICON}>
+                Alpha
+              </NavItem>
+              <NavItem href="/e">{'\u{1F680} Launch'}</NavItem>
+            </Nav>
+          }
+        />,
+      );
+      expect(document.querySelector('.flg-nav-item-letter')).toHaveTextContent('\u{1F680}');
+    });
+
+    it('warns once about a top-level item without an icon in a shell that can collapse', () => {
+      const warn = spyWarn();
+      render(<Letters />);
+      // Three items have none, and the text holds none of their labels, so it is said once.
+      expect(warnings(warn).filter((text) => String(text).includes(NO_ICON_WARNING))).toHaveLength(
+        1,
+      );
+    });
+
+    it('warns about a group without an icon, with its own text', () => {
+      const warn = spyWarn();
+      render(
+        <Shell
+          nav={
+            <Nav>
+              <NavGroup label="Design">
+                <NavItem href="/d">Deep dive</NavItem>
+              </NavGroup>
+            </Nav>
+          }
+        />,
+      );
+      expect(warnings(warn).join('\n')).toContain(
+        '<NavGroup> at the top level needs an icon when the sidebar can collapse to a rail; the rail shows the first letter of its label instead.',
+      );
+    });
+
+    it('does not warn when the sidebar cannot collapse, outside a shell, with an icon or in a group', () => {
+      const warn = spyWarn();
+      render(<Letters collapsible={false} />);
+      render(
+        <Nav>
+          <NavItem href="/inbox">Inbox</NavItem>
+        </Nav>,
+      );
+      render(
+        <Shell
+          nav={
+            <Nav>
+              <NavItem href="/a" icon={ICON}>
+                A
+              </NavItem>
+              <NavGroup label="G" icon={ICON}>
+                <NavItem href="/b">B</NavItem>
+              </NavGroup>
+            </Nav>
+          }
+        />,
+      );
+      expect(warnings(warn)).toEqual([]);
+    });
+  });
+
+  describe('the flyout of a group', () => {
+    it('is the list of links itself, a popover only at the rail, with the glass of the library', () => {
+      render(<Shell defaultCollapsed />);
+      expect(flyout()).toHaveAttribute('popover', 'auto');
+      expect(flyout()).toHaveClass('flg-nav-sub', 'flg-surface', 'flg-popover');
+      expect(flyout()).toHaveAttribute('hidden');
+      expect(flyout()).toHaveAttribute('data-side', 'right');
+      expect(groupButton()).toHaveAttribute('aria-expanded', 'false');
+      expect(groupButton()).toHaveAttribute('aria-controls', flyout().id);
+    });
+
+    it('is not a popover while the sidebar is expanded, and the group follows its own state', () => {
+      render(<Shell />);
+      expect(flyout()).not.toHaveAttribute('popover');
+      expect(flyout()).not.toHaveClass('flg-popover');
+      // Open from the start, as the current page is in it.
+      expect(flyout()).not.toHaveAttribute('hidden');
+      expect(groupButton()).toHaveAttribute('aria-expanded', 'true');
+    });
+
+    it('has the name of the group as a title that screen readers skip, over the list that the button names', () => {
+      render(<Shell defaultCollapsed />);
+      const title = flyout().querySelector('.flg-nav-flyout-title')!;
+      expect(title).toHaveTextContent('Design');
+      expect(title).toHaveAttribute('aria-hidden', 'true');
+      expect(screen.getByRole('list', { name: 'Design', hidden: true })).toBeInTheDocument();
+    });
+
+    it('opens on a click of the button, and focus stays on the button', () => {
+      render(<Shell defaultCollapsed />);
+      groupButton().focus();
+      fireEvent.click(groupButton());
+      expect(flyout()).not.toHaveAttribute('hidden');
+      expect(showing.has(flyout())).toBe(true);
+      expect(groupButton()).toHaveAttribute('aria-expanded', 'true');
+      expect(groupButton()).toHaveFocus();
+      expect(flyout().querySelector('.flg-popover-arrow')).toHaveAttribute('aria-hidden', 'true');
+      fireEvent.click(groupButton());
+      expect(showing.has(flyout())).toBe(false);
+      expect(groupButton()).toHaveAttribute('aria-expanded', 'false');
+      expect(flyout().querySelector('.flg-popover-arrow')).toBeNull();
+    });
+
+    it('leaves the open state of the group alone: it is the state of the expanded sidebar', () => {
+      render(<Shell defaultCollapsed />);
+      const group = groupButton().closest('li')!;
+      expect(group).toHaveAttribute('data-open');
+      fireEvent.click(groupButton());
+      fireEvent.click(groupButton());
+      expect(group).toHaveAttribute('data-open');
+      fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
+      expect(groupButton()).toHaveAttribute('aria-expanded', 'true');
+    });
+
+    it('is not the open state of the group: the caller’s onOpenChange is not told', () => {
+      const onOpenChange = vi.fn();
+      render(
+        <Shell
+          defaultCollapsed
+          nav={
+            <Nav>
+              <NavGroup label="Design" icon={ICON} onOpenChange={onOpenChange}>
+                <NavItem href="/d">Deep dive</NavItem>
+              </NavGroup>
+            </Nav>
+          }
+        />,
+      );
+      fireEvent.click(groupButton());
+      expect(showing.has(flyout())).toBe(true);
+      expect(onOpenChange).not.toHaveBeenCalled();
+    });
+
+    it('closes when a link in it is activated, and not for a link that is disabled', () => {
+      render(
+        <Shell
+          defaultCollapsed
+          nav={
+            <Nav>
+              <NavGroup label="Design" icon={ICON}>
+                <NavItem href="/d">Deep dive</NavItem>
+                <NavItem href="/e" disabled>
+                  Gone
+                </NavItem>
+              </NavGroup>
+            </Nav>
+          }
+        />,
+      );
+      fireEvent.click(groupButton());
+      fireEvent.click(inFlyout('Gone'));
+      expect(showing.has(flyout())).toBe(true);
+      fireEvent.click(inFlyout('Deep dive'));
+      expect(showing.has(flyout())).toBe(false);
+      expect(groupButton()).toHaveAttribute('aria-expanded', 'false');
+    });
+
+    it('closes when focus leaves both the button and the flyout, and not while it moves between them', () => {
+      render(<Shell defaultCollapsed />);
+      fireEvent.click(groupButton());
+      const link = inFlyout('Mobile app');
+      // From the button into the flyout, and back.
+      fireEvent.blur(groupButton(), { relatedTarget: link });
+      expect(showing.has(flyout())).toBe(true);
+      fireEvent.blur(link, { relatedTarget: groupButton() });
+      expect(showing.has(flyout())).toBe(true);
+      // A press on the padding of the flyout leaves focus on nothing: the browser's own light dismiss
+      // is for a press outside, not this.
+      fireEvent.blur(groupButton(), { relatedTarget: null });
+      expect(showing.has(flyout())).toBe(true);
+      fireEvent.blur(link, { relatedTarget: screen.getByRole('button', { name: 'Elsewhere' }) });
+      expect(showing.has(flyout())).toBe(false);
+      expect(groupButton()).toHaveAttribute('aria-expanded', 'false');
+    });
+
+    it('closes on Esc and on a press outside, which are the browser’s, and gives the focus back to the button', () => {
+      render(<Shell defaultCollapsed />);
+      groupButton().focus();
+      fireEvent.click(groupButton());
+      const link = inFlyout('Mobile app');
+      link.focus();
+      // The browser hides it, and says so.
+      showing.delete(flyout());
+      const toggle = new Event('toggle') as Event & { newState: string };
+      toggle.newState = 'closed';
+      act(() => {
+        flyout().dispatchEvent(toggle);
+      });
+      expect(groupButton()).toHaveAttribute('aria-expanded', 'false');
+      expect(flyout()).toHaveAttribute('hidden');
+      expect(groupButton()).toHaveFocus();
+    });
+
+    it('shuts the tooltip of its button while it is open, so that it does not cover the arrow', () => {
+      render(<Shell defaultCollapsed />);
+      const tip = tooltips().find((element) => element.textContent === 'Design')!;
+      hover(groupButton());
+      expect(showing.has(tip)).toBe(true);
+      fireEvent.click(groupButton());
+      expect(showing.has(tip)).toBe(false);
+    });
+
+    it('closes when the sidebar is expanded, loses its popover, and stays closed when the rail comes back', () => {
+      render(<Shell defaultCollapsed />);
+      fireEvent.click(groupButton());
+      expect(showing.has(flyout())).toBe(true);
+      fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
+      expect(flyout()).not.toHaveAttribute('popover');
+      expect(flyout()).not.toHaveClass('flg-popover');
+      expect(showing.has(flyout())).toBe(false);
+      expect(groupButton()).toHaveAttribute('aria-expanded', 'true');
+      expect(flyout().querySelector('.flg-popover-arrow')).toBeNull();
+      fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
+      expect(flyout()).toHaveAttribute('popover', 'auto');
+      expect(flyout()).toHaveAttribute('hidden');
+      expect(groupButton()).toHaveAttribute('aria-expanded', 'false');
+    });
+
+    it('closes when the window narrows, where the sidebar is a sheet and never a rail', () => {
+      render(<Shell defaultCollapsed />);
+      fireEvent.click(groupButton());
+      resize(false);
+      expect(flyout()).not.toHaveAttribute('popover');
+      expect(showing.has(flyout())).toBe(false);
+      resize(true);
+      expect(groupButton()).toHaveAttribute('aria-expanded', 'false');
+    });
+
+    it('puts the focus on the button when the sidebar is expanded while the focus is in the flyout', () => {
+      render(<Shell defaultCollapsed />);
+      fireEvent.click(groupButton());
+      inFlyout('Mobile app').focus();
+      fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
+      expect(groupButton()).toHaveFocus();
+    });
+
+    it('keeps what the caller gave the group, and its own handlers, on the list item', () => {
+      const onBlur = vi.fn();
+      render(
+        <Shell
+          defaultCollapsed
+          nav={
+            <Nav>
+              <NavGroup label="Design" icon={ICON} onBlur={onBlur} data-x="1">
+                <NavItem href="/d">Deep dive</NavItem>
+              </NavGroup>
+            </Nav>
+          }
+        />,
+      );
+      fireEvent.click(groupButton());
+      fireEvent.blur(groupButton(), { relatedTarget: document.body });
+      expect(onBlur).toHaveBeenCalledTimes(1);
+      expect(groupButton().closest('li')).toHaveAttribute('data-x', '1');
+    });
+  });
+});
diff --git a/src/components/nav/Nav.stories.tsx b/src/components/nav/Nav.stories.tsx
index 2559961..4eedb3e 100644
--- a/src/components/nav/Nav.stories.tsx
+++ b/src/components/nav/Nav.stories.tsx
@@ -2,10 +2,11 @@ import type { Meta, StoryObj } from '@storybook/react-vite';
 import type { ReactNode } from 'react';
 import { expect, userEvent, waitFor, within } from 'storybook/test';
 import { paintedPixels } from '../../../.storybook/painted-pixel';
-import { realUserEvent } from '../../../.storybook/real-input';
+import { realUserEvent, settled } from '../../../.storybook/real-input';
 import { afterLayout, withViewport } from '../../../.storybook/viewport';
 import { strokeIcon } from '../../internal/icons';
 import { AppShell, AppShellHeader, AppShellMain, AppShellSidebar } from '../app-shell/AppShell';
+import { APP_SHELL_BREAKPOINTS } from '../app-shell/breakpoints';
 import { Surface } from '../surface/Surface';
 import { Nav, NavGroup, NavItem, NavSection } from './Nav';
 import type { NavVariant } from './Nav';
@@ -82,9 +83,10 @@ const ICONS = {
  * The navigation of the mockup (phase-5-nav), item for item. The page of the app is the top-level
  * "Overview" and, to compare on one picture as the mockup does, the child "Design system" too: in an
  * application only one item is current. "Members" is the item the harness hovers
- * (`data-visual-hover`).
+ * (`data-visual-hover`); at the rail it hovers "Calendar" and waits for its tooltip
+ * (`data-visual-hover="tooltip"`).
  */
-function Menu({ variant }: { variant: NavVariant }) {
+function Menu({ variant, rail = false }: { variant: NavVariant; rail?: boolean }) {
   return (
     <Nav variant={variant} aria-label="Main">
       <NavItem href="#overview" icon={ICONS.home} active>
@@ -93,7 +95,11 @@ function Menu({ variant }: { variant: NavVariant }) {
       <NavItem href="#inbox" icon={ICONS.inbox} badge={12}>
         Inbox
       </NavItem>
-      <NavItem href="#calendar" icon={ICONS.calendar}>
+      <NavItem
+        href="#calendar"
+        icon={ICONS.calendar}
+        {...(rail ? { 'data-visual-hover': 'tooltip' } : undefined)}
+      >
         Calendar
       </NavItem>
       <NavSection title="Projects">
@@ -111,7 +117,11 @@ function Menu({ variant }: { variant: NavVariant }) {
         </NavItem>
       </NavSection>
       <NavSection title="Team">
-        <NavItem href="#members" icon={ICONS.users} data-visual-hover="">
+        <NavItem
+          href="#members"
+          icon={ICONS.users}
+          {...(rail ? undefined : { 'data-visual-hover': '' })}
+        >
           Members
         </NavItem>
         <NavItem href="#reports" icon={ICONS.chart} badge={3}>
@@ -527,3 +537,371 @@ export const ClosesTheSheet: Story = {
     });
   },
 };
+
+// The rail: the sidebar of an AppShell that is collapsed on a wide screen. The rail is a state of the
+// window, so its stories run at 1280 wide (the harness shoots at that size; the runner sets it).
+
+/**
+ * An AppShell in its rail, with the whole menu of the mockup in the sidebar. The main has a button
+ * that is not part of the sidebar, to press when a story presses outside.
+ */
+function RailShell({ variant, press = false }: { variant: NavVariant; press?: boolean }) {
+  return (
+    <AppShell defaultCollapsed>
+      <AppShellHeader>Lumen</AppShellHeader>
+      <AppShellSidebar>
+        <Menu variant={variant} rail />
+      </AppShellSidebar>
+      <AppShellMain>
+        {press ? <button type="button">Elsewhere</button> : <p>Overview</p>}
+      </AppShellMain>
+    </AppShell>
+  );
+}
+
+/** Waits until the sidebar is a rail: the flyouts are popovers only from then on. */
+async function railDrawn(canvasElement: HTMLElement) {
+  await waitFor(() =>
+    expect(canvasElement.querySelector('.flg-nav-sub')).toHaveAttribute('popover', 'auto'),
+  );
+}
+
+/** The list of links of the group of that name, the flyout when the sidebar is a rail. */
+const flyoutOf = (button: HTMLElement) =>
+  button.closest('li')!.querySelector<HTMLElement>('.flg-nav-sub')!;
+
+/**
+ * The flyout of "Design" opened as a person opens it, by pressing its button. Where the window is
+ * narrower than the breakpoint (a runner with a small window) there is no rail and so no flyout, and
+ * the story stays as it is.
+ */
+async function openFlyout(canvasElement: HTMLElement) {
+  if (window.innerWidth < APP_SHELL_BREAKPOINTS.lg) return;
+  await railDrawn(canvasElement);
+  const button = within(canvasElement).getByRole('button', { name: 'Design' });
+  await userEvent.click(button);
+  await waitFor(() => expect(flyoutOf(button).matches(':popover-open')).toBe(true));
+  await settled(flyoutOf(button));
+  // The press left the focus ring on the button, which the mockup does not draw. Focus that goes to
+  // nothing leaves the flyout open: only focus that goes to another element closes it.
+  (document.activeElement as HTMLElement | null)?.blur();
+  // The picture is a flyout that is open with the focus on nothing; both are asserted, and the focus
+  // is waited for in case something gives it back to the button a moment later.
+  await waitFor(() => expect(document.activeElement).toBe(document.body));
+  await expect(flyoutOf(button).matches(':popover-open')).toBe(true);
+  await expect(button).not.toHaveFocus();
+}
+
+/**
+ * N1 as a rail (mockup phase-5-nav, the rail column of option n1): the current page is the icon in the
+ * soft pill, and so is the group that holds the current page, the counts are dots, the pointer is on
+ * "Calendar" (the harness hovers it, through `data-visual-hover="tooltip"`, and waits for its tooltip),
+ * and the flyout of "Design", which the play function opens, shows the name of the group and its links.
+ */
+export const PillRail: Story = {
+  parameters: { stage: 'page' },
+  render: () => <RailShell variant="pill" />,
+  play: ({ canvasElement }) => openFlyout(canvasElement),
+};
+
+/** N2 as a rail (the rail column of option n2): the bar is on the edge of the rail, with a tint behind it. */
+export const BarRail: Story = {
+  parameters: { stage: 'page' },
+  render: () => <RailShell variant="bar" />,
+  play: ({ canvasElement }) => openFlyout(canvasElement),
+};
+
+const near = (actual: number, expected: number, what: string, tolerance = 1.5) =>
+  expect(Math.abs(actual - expected), `${what}: ${actual} against ${expected}`).toBeLessThanOrEqual(
+    tolerance,
+  );
+
+/**
+ * What the rail is made of, measured: the column, the squares and the icons, the label and the count
+ * out of sight yet in the name of the link, the dot in the corner, the first letter, no chevron and no
+ * list of links, the title of a section out of sight with the rule that stands for it.
+ */
+export const RailGeometry: Story = {
+  tags: ['no-visual'],
+  parameters: { stage: 'page' },
+  render: () => (
+    <AppShell defaultCollapsed>
+      <AppShellHeader>Lumen</AppShellHeader>
+      <AppShellSidebar>
+        <Nav aria-label="Main">
+          <NavItem href="#inbox" icon={ICONS.inbox} badge={12}>
+            Inbox
+          </NavItem>
+          <NavItem href="#zebra">Zebra</NavItem>
+          <NavSection title="Projects">
+            <NavGroup label="Design" icon={ICONS.folder}>
+              <NavItem href="#mobile">Mobile app</NavItem>
+            </NavGroup>
+          </NavSection>
+        </Nav>
+      </AppShellSidebar>
+      <AppShellMain>Main</AppShellMain>
+    </AppShell>
+  ),
+  play: async ({ canvasElement }) => {
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      await railDrawn(canvasElement);
+      const canvas = within(canvasElement);
+      const panel = canvasElement.querySelector<HTMLElement>('.flg-app-shell-sidebar-panel')!;
+      near(panel.getBoundingClientRect().width, 68, 'the column is the rail width');
+
+      // The name keeps the label and the count, which are out of sight.
+      const inbox = canvas.getByRole('link', { name: 'Inbox 12' });
+      const box = inbox.getBoundingClientRect();
+      near(box.width, 40, 'an item is 40 wide');
+      near(box.height, 40, 'an item is 40 high');
+      near(box.left - panel.getBoundingClientRect().left, 14, 'and stands in the middle');
+      const icon = inbox.querySelector('.flg-nav-item-icon')!.getBoundingClientRect();
+      near(icon.width, 20, 'its icon is 20 wide');
+      for (const part of ['.flg-nav-item-label', '.flg-badge']) {
+        const hidden = inbox.querySelector(part)!.getBoundingClientRect();
+        await expect(hidden.width, `${part} is out of sight`).toBeLessThanOrEqual(1);
+      }
+      // The count is a dot: 8px, 7px from the corner.
+      const dot = inbox.querySelector('.flg-indicator-mark')!.getBoundingClientRect();
+      near(dot.width, 8, 'the dot is 8 wide');
+      near(dot.height, 8, 'and 8 high');
+      near(box.right - dot.right, 7, 'and 7px from the right');
+      near(dot.top - box.top, 7, 'and 7px from the top');
+
+      // An item with no icon shows the first letter of its label, which is not part of the name.
+      const zebra = canvas.getByRole('link', { name: 'Zebra' });
+      const letter = zebra.querySelector('.flg-nav-item-letter')!;
+      await expect(letter).toHaveTextContent('Z');
+      await expect(letter.getBoundingClientRect().width).toBeGreaterThan(4);
+      near(zebra.getBoundingClientRect().width, 40, 'it is a square too');
+
+      // The group: no chevron, no list, and its title is out of sight with a rule in its place.
+      const design = canvas.getByRole('button', { name: 'Design' });
+      await expect(getComputedStyle(design.querySelector('.flg-nav-group-chevron')!).display).toBe(
+        'none',
+      );
+      await expect(getComputedStyle(flyoutOf(design)).display).toBe('none');
+      const title = canvasElement.querySelector('.flg-nav-section-title')!;
+      await expect(title.getBoundingClientRect().width).toBeLessThanOrEqual(1);
+      const rule = getComputedStyle(canvasElement.querySelector('.flg-nav-section')!, '::before');
+      await expect(rule.width).toBe('28px');
+      await expect(rule.height).toBe('1px');
+      // The title still names the group.
+      await expect(canvas.getByRole('group', { name: 'Projects' })).toBeInTheDocument();
+    });
+  },
+};
+
+const isTipOpen = (canvasElement: HTMLElement) =>
+  canvasElement.querySelector<HTMLElement>("[role='tooltip']:popover-open");
+
+/**
+ * The tooltip of an item at the rail: it shows the label, to the right of the item and 20px from it, on
+ * hover and on keyboard focus, and goes with the pointer and with Esc. The link does not take it for a
+ * description: its label is its name already. Needs trusted input, which Chromium, Firefox and WebKit
+ * have under Vitest and the Storybook UI has not.
+ */
+export const RailTooltips: Story = {
+  tags: ['no-visual'],
+  parameters: { stage: 'page' },
+  render: () => <RailShell variant="pill" press />,
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      await railDrawn(canvasElement);
+      const canvas = within(canvasElement);
+      const calendar = canvas.getByRole('link', { name: 'Calendar' });
+      await expect(isTipOpen(canvasElement)).toBeNull();
+
+      await real.hover(calendar);
+      await waitFor(() => expect(isTipOpen(canvasElement)).not.toBeNull(), { timeout: 4000 });
+      const tip = isTipOpen(canvasElement)!;
+      // It slides in from the side: measured where it lands.
+      await settled(tip);
+      await expect(tip).toHaveTextContent('Calendar');
+      await expect(calendar).not.toHaveAttribute('aria-describedby');
+      const link = calendar.getBoundingClientRect();
+      const shown = tip.getBoundingClientRect();
+      near(shown.left - link.right, 20, 'the tooltip is 20px from the item', 2);
+      near(shown.top + shown.height / 2, link.top + link.height / 2, 'and level with it', 2);
+      await real.unhover(calendar);
+      await waitFor(() => expect(isTipOpen(canvasElement)).toBeNull());
+
+      // The keyboard: a key press makes the focus that follows a keyboard one, in every engine. Safari
+      // does not Tab to links, so the item is focused by the script after the key.
+      (document.activeElement as HTMLElement | null)?.blur();
+      await real.keyboard('{Tab}');
+      calendar.focus();
+      await expect(calendar).toHaveFocus();
+      await waitFor(() => expect(isTipOpen(canvasElement)).not.toBeNull());
+      await expect(isTipOpen(canvasElement)).toHaveTextContent('Calendar');
+      await real.keyboard('{Escape}');
+      await waitFor(() => expect(isTipOpen(canvasElement)).toBeNull());
+    });
+  },
+};
+
+/**
+ * The flyout of a group, in the real engines: where it stands, what it shows, and how it opens and
+ * closes. The button opens it and keeps the focus (Tab goes in, since the flyout follows the button
+ * in the page); Esc and a press outside close it, and Esc gives the focus back to the button, and
+ * focus that leaves both the button and the flyout closes it, and so does a link that is activated.
+ */
+export const RailFlyout: Story = {
+  tags: ['no-visual'],
+  parameters: { stage: 'page' },
+  render: () => <RailShell variant="bar" press />,
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      await railDrawn(canvasElement);
+      const canvas = within(canvasElement);
+      const button = canvas.getByRole('button', { name: 'Design' });
+      const flyout = flyoutOf(button);
+      const isOpen = () => flyout.matches(':popover-open');
+      const open = async () => {
+        await real.click(button);
+        await waitFor(() => expect(isOpen()).toBe(true));
+        await settled(flyout);
+      };
+      await expect(isOpen()).toBe(false);
+      await expect(button).toHaveAttribute('aria-expanded', 'false');
+
+      await open();
+      await expect(button).toHaveAttribute('aria-expanded', 'true');
+      // The button keeps the focus (a click focuses it, except in Safari, which focuses nothing).
+      await expect(flyout.contains(document.activeElement)).toBe(false);
+      const at = button.getBoundingClientRect();
+      const box = flyout.getBoundingClientRect();
+      near(box.left - at.right, 26, 'the flyout is 26px from the button', 2);
+      near(box.top - at.top, -6, 'and 6px above it', 2);
+      near(box.width, 166, 'and 166px wide', 2);
+      await expect(flyout.querySelector('.flg-popover-arrow')).not.toBeNull();
+      // Its links are drawn with their labels, under the name of the group.
+      const title = flyout.querySelector<HTMLElement>('.flg-nav-flyout-title')!;
+      await expect(title).toBeVisible();
+      await expect(title).toHaveTextContent('Design');
+      const link = within(flyout).getByRole('link', { name: 'Design system' });
+      await expect(link.getBoundingClientRect().height).toBeGreaterThan(30);
+      await expect(
+        link.querySelector('.flg-nav-item-label')!.getBoundingClientRect().width,
+      ).toBeGreaterThan(40);
+      await expect(link).toHaveAttribute('aria-current', 'page');
+      // The links of a group in a flyout have no indent: the row runs from the padding of the flyout.
+      near(link.getBoundingClientRect().left - box.left, 0, 'the row of N2 runs to the edge', 2);
+
+      // Esc closes it and the focus is on the button.
+      button.focus();
+      await real.keyboard('{Escape}');
+      await waitFor(() => expect(isOpen()).toBe(false));
+      await expect(button).toHaveFocus();
+      await expect(button).toHaveAttribute('aria-expanded', 'false');
+
+      // A press outside closes it, and the focus stays where the press put it.
+      await open();
+      const elsewhere = canvas.getByRole('button', { name: 'Elsewhere' });
+      await real.click(elsewhere);
+      await waitFor(() => expect(isOpen()).toBe(false));
+      await expect(button).toHaveAttribute('aria-expanded', 'false');
+
+      // Focus that leaves both the button and the flyout closes it, and not while it is inside.
+      await open();
+      button.focus();
+      within(flyout).getByRole('link', { name: 'Design system' }).focus();
+      await afterLayout();
+      await expect(isOpen()).toBe(true);
+      elsewhere.focus();
+      await waitFor(() => expect(isOpen()).toBe(false));
+      await expect(button).toHaveAttribute('aria-expanded', 'false');
+
+      // Tab goes from the button into the flyout, which follows it in the page, and Tab past its last
+      // link closes it. Safari does not Tab to links (it does with Option), so it is left out there.
+      const { server } = await import('vitest/browser');
+      if (server.browser !== 'webkit') {
+        await open();
+        button.focus();
+        await real.keyboard('{Tab}');
+        await expect(flyout.contains(document.activeElement)).toBe(true);
+        await expect(isOpen()).toBe(true);
+        for (let stop = 0; stop < 4 && isOpen(); stop += 1) await real.keyboard('{Tab}');
+        await waitFor(() => expect(isOpen()).toBe(false));
+        await expect(button).toHaveAttribute('aria-expanded', 'false');
+      }
+
+      // A link that is activated closes it. The page, as an application's router would, takes the
+      // click after the library's handler has seen it, so the story does not leave itself.
+      const keepHere = (event: Event) => event.preventDefault();
+      canvasElement.ownerDocument.addEventListener('click', keepHere);
+      try {
+        await open();
+        await real.click(within(flyout).getByRole('link', { name: 'Mobile app' }));
+        await waitFor(() => expect(isOpen()).toBe(false));
+      } finally {
+        canvasElement.ownerDocument.removeEventListener('click', keepHere);
+      }
+    });
+  },
+};
+
+/**
+ * Between the rail and the expanded sidebar with the flyout open: the flyout closes and stops being a
+ * popover, the group shows its links in the list again, with the state it had, and the flyout does not
+ * come back by itself with the next rail. Done by the window narrowing under the breakpoint and by the
+ * button that folds the sidebar.
+ */
+export const RailFlyoutAndTheExpandedSidebar: Story = {
+  tags: ['no-visual'],
+  parameters: { stage: 'page' },
+  render: () => <RailShell variant="pill" press />,
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const canvas = within(canvasElement);
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      await railDrawn(canvasElement);
+      const button = canvas.getByRole('button', { name: 'Design' });
+      const flyout = flyoutOf(button);
+      const open = async () => {
+        await real.click(button);
+        await waitFor(() => expect(flyout.matches(':popover-open')).toBe(true));
+        await settled(flyout);
+      };
+      const isRail = () => flyout.hasAttribute('popover');
+
+      // The window narrows: the sidebar is a sheet, never a rail.
+      await open();
+      await viewport.set(800, WIDE.height);
+      await waitFor(() => expect(isRail()).toBe(false));
+      await expect(flyout.matches(':popover-open')).toBe(false);
+      await expect(flyout).not.toHaveClass('flg-popover');
+      await expect(button).toHaveAttribute('aria-expanded', 'true');
+      await viewport.set(WIDE.width, WIDE.height);
+      await waitFor(() => expect(isRail()).toBe(true));
+      await expect(flyout.matches(':popover-open')).toBe(false);
+      await expect(button).toHaveAttribute('aria-expanded', 'false');
+
+      // The button of the header folds the sidebar out while the flyout is open.
+      await open();
+      await real.click(canvas.getByRole('button', { name: 'Expand sidebar' }));
+      await waitFor(() => expect(isRail()).toBe(false));
+      await expect(flyout.matches(':popover-open')).toBe(false);
+      // The group is open as it was (it holds the current page), in the list of the sidebar.
+      await expect(button).toHaveAttribute('aria-expanded', 'true');
+      await waitFor(() => expect(flyout.getBoundingClientRect().height).toBeGreaterThan(0));
+      await expect(
+        within(flyout).getByRole('link', { name: 'Design system' }).getBoundingClientRect().left,
+      ).toBeGreaterThan(button.getBoundingClientRect().left);
+      // And back to the rail: closed.
+      await real.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
+      await waitFor(() => expect(isRail()).toBe(true));
+      await expect(flyout.matches(':popover-open')).toBe(false);
+    });
+  },
+};
diff --git a/src/components/tooltip/Tooltip.test.tsx b/src/components/tooltip/Tooltip.test.tsx
index 85f3649..af31c6c 100644
--- a/src/components/tooltip/Tooltip.test.tsx
+++ b/src/components/tooltip/Tooltip.test.tsx
@@ -2,7 +2,7 @@ import { act, fireEvent, render, screen } from '@testing-library/react';
 import type { ButtonHTMLAttributes, ReactElement } from 'react';
 import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
 import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
-import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';
+import { Tooltip, TooltipContent, TooltipRoot, TooltipTrigger } from './Tooltip';
 
 // jsdom has no Popover API. This stand-in is enough for a tooltip to open.
 const original = {
@@ -256,3 +256,42 @@ describe('Tooltip after Esc', () => {
     expect(onOpenChange).toHaveBeenLastCalledWith(true);
   });
 });
+
+describe('the description of the trigger', () => {
+  const described = (describe: boolean | undefined) => {
+    render(
+      <TooltipRoot {...(describe === undefined ? {} : { describe })}>
+        <TooltipTrigger>
+          <button type="button" aria-describedby="mine">
+            Save
+          </button>
+        </TooltipTrigger>
+        <TooltipContent>Hint</TooltipContent>
+      </TooltipRoot>,
+    );
+    return screen.getByRole('button', { name: 'Save' });
+  };
+
+  it('is wired by default, after the description the trigger already has', () => {
+    const content = () => document.querySelector('[role="tooltip"]')!;
+    const button = described(undefined);
+    expect(button.getAttribute('aria-describedby')).toBe(`mine ${content().id}`);
+  });
+
+  it('is left out with describe={false}, and the trigger keeps its own', () => {
+    expect(described(false)).toHaveAttribute('aria-describedby', 'mine');
+  });
+
+  it('is not an option of the public Tooltip: it is wired whatever a caller passes', () => {
+    render(
+      // @ts-expect-error describe is for the library's own parts
+      <Tooltip describe={false}>
+        <TooltipTrigger>
+          <button type="button">Save</button>
+        </TooltipTrigger>
+        <TooltipContent>Hint</TooltipContent>
+      </Tooltip>,
+    );
+    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-describedby');
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/nav src/components/tooltip
pnpm vitest run --project scripts scripts/lib/app-shell-css.test.ts
```

Expected: FAIL.
- `Tooltip.test.tsx`: `the description of the trigger > is wired by default, after the description the trigger already has` và `is left out with describe={false}, and the trigger keeps its own` fail với `Element type is invalid: … got: undefined` (`TooltipRoot` chưa có). `is not an option of the public Tooltip: it is wired whatever a caller passes` pass: test đặc tả.
- `Nav.rail.test.tsx`: 24 trong 33 test fail ở mỗi project React. Ví dụ: `the tooltip of an item > shows the label, on the right, 20px from the item, and does not describe the link by it` (`expected false to be true`: không có tooltip); `the count > is a dot of the Indicator in the link of an item that has a badge, hidden from screen readers` (không có `.flg-indicator-mark`); `the flyout of a group > is the list of links itself, a popover only at the rail, with the glass of the library` (không có `popover`); `opens on a click of the button, and focus stays on the button` (flyout không hiện); `the first letter > warns about a group without an icon, with its own text` (`expected '' to contain '<NavGroup> at the top level needs an icon…'`); `the count > is in the HTML from the server, so the rail is right before anything runs` (`flg-indicator-mark` không có trong HTML). 9 test pass ngay là các ca vắng mặt (không tooltip khi mở rộng hay ở màn hẹp, không gì cho mục tắt, không cảnh báo ngoài sidebar hay khi có icon, không `popover` khi mở rộng, link của nhóm không có tooltip, không gọi `onOpenChange`): chúng không fail trước được và giữ những gì phải đúng.
- `app-shell-css.test.ts`: các test mới của `the Nav as a rail` fail vì `wideRules` chưa có quy tắc rail và `railForcedColorsRules` chưa có; `has one boundary per breakpoint: no max-width, no second bound` fail vì file sinh còn sáu khối, không có khối forced colors nào.
- Mọi test khác của `src/components/nav` (dạng mở rộng) và `src/components/tooltip` pass.

Theo báo cáo của bản nháp (phát hiện 16):
- Unit test của Tooltip và của rail được viết trước và chạy trên code của Task 2, với các lỗi như trên. Khi viết chúng, bản nháp thấy `matches` giả lập của jsdom phải trả lời `:popover-open`, và link trong flyout phải được tìm với `hidden: true` (phát hiện 11).
- 15 test của bộ sinh viết sau CSS (CSS được vẽ theo mockup trước), nên ở bản nháp chúng là đặc tả. Kiểm bằng đột biến: `left: -13px` thành `-12px` thì `puts the bar of N2 1px inside the rail, 8px from the top and the bottom, and takes no pointer` fail; bỏ `:not(.flg-nav-sub .flg-nav-item)` khỏi selector của mục thì bốn test fail (`makes an item a 40px square with no padding and 20px icons, a group button too`, `never touches the links of a flyout, which are drawn with their labels`, `hides the label and the count from the eye only, and the chevron altogether`, `shows the dot and the first letter, which the expanded form hides`).
- Story viết cùng code: `RailTooltips` lần đầu fail `the tooltip is 20px from the item: 16 against 20`; `RailFlyout` làm đứt kết nối tới trình duyệt rồi fail ở WebKit (phát hiện 13).

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index 517940c..1f6ded4 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -317,7 +317,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 3 | Viền Input/Textarea khi focus (control không lỗi) | đạt (4.45:1) | 2.06:1 | 3:1 | 1.4.11 |
 | 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
 | 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) và vạch dưới tab `underline` đang chọn, so với nền; thanh của bước đã xong (Stepper `bars`) | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
-| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin`; ở Stepper: số, tên và mô tả của bước chưa tới, mô tả của mọi bước, dòng "Step N" của bước chưa tới; ở List: mô tả và chữ ở ô cuối của hàng; ở Table `striped` và `minimal`: tiêu đề cột và icon của cột chưa sắp; ở AppShell: chữ của footer; ở Nav: tiêu đề mục và số đếm trần của `bar` | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
+| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin`; ở Stepper: số, tên và mô tả của bước chưa tới, mô tả của mọi bước, dòng "Step N" của bước chưa tới; ở List: mô tả và chữ ở ô cuối của hàng; ở Table `striped` và `minimal`: tiêu đề cột và icon của cột chưa sắp; ở AppShell: chữ của footer; ở Nav: tiêu đề mục, tiêu đề flyout của nhóm ở rail và số đếm trần của `bar` | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
 | 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn, trang hiện tại của Pagination; tiêu đề bước hiện tại của Stepper `compact`, tiêu đề hàng hiện tại của List, chữ và icon của mục đang chọn Nav `pill` | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
 | 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn, trang hiện tại của Pagination; viên thuốc của bước hiện tại (Stepper `compact`), nền hàng hiện tại của List, nền mục đang chọn của Nav `pill` | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
 | 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ; dòng gợi ý của vùng thả FileUpload khi đang kéo; mô tả của bước hiện tại trong viên thuốc (Stepper `compact`), mô tả và chữ ở ô cuối của hàng hiện tại List; chữ mờ trên hàng đã chọn của Table | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
@@ -325,7 +325,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 11 | Ô checkbox đã chọn (màu nhấn) trên option đang được trỏ của Select chọn nhiều, so với nền `--flg-accent-subtle` của hàng | 2.61:1 | 1.91:1 | 3:1 | 1.4.11 |
 | 12 | Chữ `--flg-text-muted` của tab `segmented` trên rãnh `--flg-control-track`; mô tả của hàng List bấm được, và mô tả của bước Stepper bấm được, và chữ mờ trên hàng của Table, khi hover (`inset`, `plain`; `cards` ở dark), và số đếm trần của Nav `bar` khi hover | 4.10:1 | 3.36:1 | 4.5:1 | 1.4.3 |
 | 13 | Tab `segmented` đang chọn (nền `--flg-control-bg`) so với rãnh | 1.24:1 | 1.12:1 | 3:1 | 1.4.11 |
-| 14 | Icon và vạch của toast `info` (`--flg-accent-solid`) so với nền; viền 2px của dấu tròn bước hiện tại (Stepper `circles`); viền 1.5px của hàng hiện tại (List `cards`) | đạt (3.04:1) | 2.29:1 | 3:1 | 1.4.11 |
+| 14 | Icon và vạch của toast `info` (`--flg-accent-solid`) so với nền; viền 2px của dấu tròn bước hiện tại (Stepper `circles`); viền 1.5px của hàng hiện tại (List `cards`); vạch 3px của mục đang chọn ở rail (Nav `bar`) | đạt (3.04:1) | 2.29:1 | 3:1 | 1.4.11 |
 | 15 | Chấm vạch chia của Slider (`--flg-slider-tick`, 70% `--flg-text-muted`) so với nền | 2.88:1 | 2.82:1 | 3:1 | 1.4.11 |
 | 16 | Rãnh của Slider và của Progress (`--flg-control-track`) so với nền; thanh của bước chưa tới (Stepper `bars`) | 1.23:1 | 1.30:1 | 3:1 | 1.4.11 |
 | 17 | Núm của Slider (`--flg-control-thumb`) so với rãnh và với phần đã chọn | 1.29:1 | 2.24:1 | 3:1 | 1.4.11 |
diff --git a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
index 74e1040..156a868 100644
--- a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
+++ b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
@@ -362,7 +362,7 @@ Bảng là của khung có sidebar; không có sidebar thì chỉ có ô brand c
 - Mục: 40×40px, padding 0, căn giữa, bo `--flg-radius-md`, màu `--flg-text-muted`, icon 20px. Nhãn và số đếm ẩn khỏi mắt (`flg-visually-hidden`, vẫn là tên của link: "Inbox 12"); chevron và danh sách con ẩn hẳn (trừ khi danh sách con đang là flyout mở, bên dưới). Mục không có icon hiện chữ cái đầu của nhãn (`--flg-text-sm` đậm `--flg-weight-semibold`, `aria-hidden`).
 - Hover: nền `--flg-control-track`, màu `--flg-text`.
 - Chấm số đếm (mục có `badge`): chấm của Indicator (§Indicator), tuyệt đối `top: 7px; right: 7px`, 8px, `--flg-accent-solid`, vòng 2px `--flg-glass-tint-solid`, `aria-hidden`.
-- Tiêu đề mục: tiêu đề ẩn khỏi mắt (vẫn là tên của nhóm), thay bằng đường chia `flg-divider` rộng 28px, cách trên dưới 4px. Mục ở đáy: `margin-top: auto`, padding trên 12px, đường chia 28px rồi mục, khoảng cách 8px.
+- Tiêu đề mục: tiêu đề ẩn khỏi mắt (vẫn là tên của nhóm), thay bằng một đường chia rộng 28px, cách trên dưới 4px: là `::before` của `NavSection` (không thêm phần tử vào DOM của dạng mở rộng, nên cấu trúc HTML của §6.3 giữ nguyên; khối đầu tiên của Nav không có đường này; ở forced colors nó là `CanvasText`; phát hiện khi lập Plan B). Mục ở đáy: `margin-top: auto`, padding trên 12px, đường chia 28px rồi mục, khoảng cách 8px.
 - N1, mục đang chọn và nhóm chứa trang hiện tại: nền `--flg-selected-bg`, icon `--flg-selected-text`.
 - N2, như trên: nền nhuộm N2, icon `--flg-accent-text`, vạch 3px tại `left: -13px` (sát mép trong của kính rail), cách trên dưới 8px, bo `0 3px 3px 0`, `--flg-accent-solid`.
 - **Tooltip:** Tooltip của lib, `side="right"`, cách mục 20px (6px ngoài mép rail), chữ là nhãn. Hiện khi hover và focus bàn phím, như mọi Tooltip.
@@ -545,11 +545,11 @@ Mọi component mới có quy tắc riêng trong `preferences.css`. Icon dùng `
 | `editable.ts` (C) | `isEditable(target)` | Chuyển nguyên từ `Toaster.tsx` (ô nhập văn bản, `textarea`, `select`, `[contenteditable]`, hay con của chúng); Toaster và phím tắt của SearchField dùng chung |
 | `theme-store.ts` (C) | `useThemeValue({ value, defaultValue, onValueChange, storageKey })`, `applyTheme(value)` | Store theo `storageKey`: đọc `localStorage` một lần khi có người đăng ký đầu tiên và khi có sự kiện `storage` cho đúng khoá; ghi khi người dùng chọn; báo cho mọi `ThemeSwitch` và `ThemeMenuGroup` cùng khoá (cả hai luôn khớp nhau). `useSyncExternalStore` với giá trị phía server là `defaultValue`. Controlled (`value` có mặt) thì chỉ trả `value` và gọi `onValueChange`, không đọc, không ghi, không chạm `<html>`. `applyTheme`: `'light'`/`'dark'` đặt `data-flg-theme` trên `document.documentElement`, `'system'` bỏ thuộc tính. `localStorage` bị chặn (chế độ riêng tư, chính sách) thì mọi lần đọc ghi được bọc `try/catch`: giá trị chỉ sống trong store |
 
-**Helper riêng của component** (trong thư mục của component): `app-shell/app-shell-context.ts` (context của AppShell: `layout`, `breakpoint`, `isWide`, `collapsible`, `collapsed`, `setCollapsed`, `open`, `modal` (`open && !isWide`: tấm đang là dialog; phần nào cần biết thì đọc nó, không tự tính lại; phát hiện khi review cuối Plan A), `setOpen(open, { returnFocus, opener })` (`returnFocus` mặc định `true`: sau khi đóng, focus về `opener`, là nút trigger đã mở tấm, không có thì trigger đầu tiên còn hiện; `opener` chỉ do `AppShellSidebarTrigger` truyền khi mở; phát hiện khi lập Plan A. Focus cũng về như vậy khi cha controlled tự đóng không qua `setOpen`; lần đóng do cửa sổ rộng ra không dùng `setOpen` mà được nhận ra bằng `matchMedia` (§3.4); `opener` và cờ `returnFocus: false` bị quên sau mỗi lần đóng; phát hiện khi review cuối Plan A; cờ chỉ được ghi khi lời gọi đóng một tấm đang hiện, và cũng bị quên mỗi khi tấm hiện ra, §3.4; phát hiện khi review PR #37), id của sidebar và main, đăng ký phần và trigger; **không** có `labels` và `brand`: hai thứ đó nằm ở một context thứ hai, `AppShellTextContext` (`{ labels, brand }`), vì cha thường truyền chúng inline nên chúng là giá trị mới ở mọi lần render, và `NavItem` đọc context của AppShell (để đóng tấm trượt), nên nếu chúng cùng một context thì mọi mục nav render lại theo mọi lần render của cha; chỉ header, sidebar và trigger đọc context thứ hai; phát hiện khi lập Plan B, từ M8 của Plan A); `app-shell/use-sheet.ts` (`useSheet`: layout effect của tấm trượt (`inert`, khoá cuộn, focus vào và về), Esc, lớp nền, việc đóng khi cửa sổ rộng ra; `AppShell.tsx` chỉ gọi nó; phát hiện khi review cuối Plan A); `app-shell/use-header-offset.ts` (`useHeaderOffset(header)`, với `header` là phần tử (lưu bằng state của `AppShell`, nên một header mount sau khung vẫn được đo; (phát hiện khi lập Plan A)): `ResizeObserver` trên header, ghi `--flg-app-shell-header-offset` lên `<html>` khi chiều cao đổi, xoá khi unmount; không có `ResizeObserver` (jsdom) thì không ghi gì, CSS dùng giá trị dự phòng; §3.3; Claude chốt; phát hiện khi đọc soát spec); `theme-switch/theme-script.ts` (hàm thuần `themeScriptSource(storageKey)`, §6.3, để test được chuỗi).
+**Helper riêng của component** (trong thư mục của component): `app-shell/app-shell-context.ts` (context của AppShell: `layout`, `breakpoint`, `isWide`, `collapsible`, `collapsed`, `setCollapsed`, `open`, `modal` (`open && !isWide`: tấm đang là dialog; phần nào cần biết thì đọc nó, không tự tính lại; phát hiện khi review cuối Plan A), `setOpen(open, { returnFocus, opener })` (`returnFocus` mặc định `true`: sau khi đóng, focus về `opener`, là nút trigger đã mở tấm, không có thì trigger đầu tiên còn hiện; `opener` chỉ do `AppShellSidebarTrigger` truyền khi mở; phát hiện khi lập Plan A. Focus cũng về như vậy khi cha controlled tự đóng không qua `setOpen`; lần đóng do cửa sổ rộng ra không dùng `setOpen` mà được nhận ra bằng `matchMedia` (§3.4); `opener` và cờ `returnFocus: false` bị quên sau mỗi lần đóng; phát hiện khi review cuối Plan A; cờ chỉ được ghi khi lời gọi đóng một tấm đang hiện, và cũng bị quên mỗi khi tấm hiện ra, §3.4; phát hiện khi review PR #37), id của sidebar và main, đăng ký phần và trigger; **không** có `labels` và `brand`: hai thứ đó nằm ở một context thứ hai, `AppShellTextContext` (`{ labels, brand }`), vì cha thường truyền chúng inline nên chúng là giá trị mới ở mọi lần render, và `NavItem` đọc context của AppShell (để đóng tấm trượt), nên nếu chúng cùng một context thì mọi mục nav render lại theo mọi lần render của cha; chỉ header, sidebar và trigger đọc context thứ hai; phát hiện khi lập Plan B, từ M8 của Plan A); `app-shell/app-shell-context.ts` còn `AppShellSidebarContext` (boolean, `true` trong thân của `AppShellSidebar`: chỗ duy nhất khung vẽ rail; `NavItem` và `NavGroup` chỉ là rail khi nó `true`, AppShell `collapsible`, `collapsed` và `isWide`; phát hiện khi lập Plan B); `app-shell/use-sheet.ts` (`useSheet`: layout effect của tấm trượt (`inert`, khoá cuộn, focus vào và về), Esc, lớp nền, việc đóng khi cửa sổ rộng ra; `AppShell.tsx` chỉ gọi nó; phát hiện khi review cuối Plan A); `app-shell/use-header-offset.ts` (`useHeaderOffset(header)`, với `header` là phần tử (lưu bằng state của `AppShell`, nên một header mount sau khung vẫn được đo; (phát hiện khi lập Plan A)): `ResizeObserver` trên header, ghi `--flg-app-shell-header-offset` lên `<html>` khi chiều cao đổi, xoá khi unmount; không có `ResizeObserver` (jsdom) thì không ghi gì, CSS dùng giá trị dự phòng; §3.3; Claude chốt; phát hiện khi đọc soát spec); `theme-switch/theme-script.ts` (hàm thuần `themeScriptSource(storageKey)`, §6.3, để test được chuỗi).
 
 **Thay đổi ở primitive và component có sẵn:**
 
-- **Tooltip** (Plan B): tuỳ chọn nội bộ `describe` (mặc định `true`) trên context của `Tooltip`, không có trong type công khai và không export từ `src/index.ts`. `false` thì `TooltipTrigger` không nối `aria-describedby`. Dùng khi chữ của tooltip đúng bằng tên của trigger (mục rail, nút thu gọn của SearchField) hoặc đã được nói theo cách khác (ThemeSwitch, §6.3), để screen reader không đọc hai lần.
+- **Tooltip** (Plan B): tuỳ chọn nội bộ `describe` (mặc định `true`) trên context của `Tooltip`, không có trong type công khai và không export từ `src/index.ts`: nó là prop của `TooltipRoot` (export từ `tooltip/Tooltip.tsx`, không từ `tooltip/index.ts`), còn `Tooltip` công khai chỉ chuyển các prop công khai xuống nó (phát hiện khi lập Plan B). `false` thì `TooltipTrigger` không nối `aria-describedby`. Dùng khi chữ của tooltip đúng bằng tên của trigger (mục rail, nút thu gọn của SearchField) hoặc đã được nói theo cách khác (ThemeSwitch, §6.3), để screen reader không đọc hai lần.
 - **List** (Plan C): prop `surface` (§4.3).
 - **Icon** (A, C): §4.6.
 
@@ -569,7 +569,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`. Icon dùng `
   - `NavItem` hay `NavGroup` render ngoài một danh sách của Nav: "<NavItem> must be rendered inside <Nav>, <NavSection> or <NavGroup>."
   - `NavSection` không phải con trực tiếp của `Nav`.
   - `NavGroup` trong `NavGroup`: "<NavGroup> inside <NavGroup> is not supported: navigation has at most two levels."
-  - Mục cấp 1 (`NavItem` không nằm trong nhóm, hoặc `NavGroup`) không có `icon` trong một AppShell thu gọn được: "<NavItem> at the top level needs an icon when the sidebar can collapse to a rail; the rail shows the first letter of its label instead."
+  - Mục cấp 1 (`NavItem` không nằm trong nhóm, hoặc `NavGroup`) không có `icon` trong một AppShell thu gọn được: "<NavItem> at the top level needs an icon when the sidebar can collapse to a rail; the rail shows the first letter of its label instead." `NavGroup` có lời riêng, chỉ khác tên phần tử ("<NavGroup> at the top level needs…"); chỉ cảnh báo khi Nav nằm trong sidebar của AppShell đó (phát hiện khi lập Plan B).
 - Indicator: `count` không phải số nguyên không âm hữu hạn (`NaN`, âm: không hiện; số lẻ: làm tròn xuống); `max` không phải số nguyên dương (lib dùng 99).
 - SearchField: không có tên sau khi mount (không `aria-label`, `aria-labelledby`, cũng không có nhãn `<label>` trỏ vào): "<SearchField> needs a name: a Field label or aria-label. A placeholder is not a name."; `shortcut` không phải `'/'` hay `'mod+k'` (bị bỏ qua).
 - UserMenu: `name` rỗng.
@@ -741,7 +741,7 @@ type NavGroupProps = Omit<LiHTMLAttributes<HTMLLIElement>, 'title'> & {
   - `disabled`: không `asChild` → `<a role="link" aria-disabled="true">` không có `href` (không đi, không nhận focus), như List; có `asChild` → phần tử con mang `aria-disabled="true"` và `tabIndex={-1}`, lần bấm bị chặn ở pha capture như `Button` (link của router bắt buộc có `href`; Claude chốt).
   - `badge` là số hay chuỗi: lib vẽ theo variant (§4.3); là element: đặt nguyên vào ô cuối. Số đếm là chữ trong link, nên là một phần của tên ("Inbox 12"); docs khuyên chữ rõ hơn khi cần (`badge={<>12<span className="flg-visually-hidden"> unread</span></>}`).
   - Trong tấm trượt: click thường (không Ctrl, Meta, Shift, Alt; chưa `defaultPrevented`) đóng tấm và trả focus về trigger.
-  - Ở rail: tooltip với nhãn (tuỳ chọn nội bộ `describe: false`, vì nhãn đã là tên); chấm số đếm thay số; không có `icon` thì chữ cái đầu của nhãn (khi nhãn là chuỗi; không thì để trống).
+  - Ở rail: tooltip với nhãn (tuỳ chọn nội bộ `describe: false`, vì nhãn đã là tên); chấm số đếm thay số; không có `icon` thì chữ cái đầu của nhãn (khi nhãn là chuỗi; không thì để trống; lấy trọn một ký tự, kể cả emoji). Mục `disabled` không có tooltip: Tooltip đòi trigger nhận được focus bàn phím mà mục tắt thì không, và người không dùng được mục đó không cần nhãn của nó (phát hiện khi lập Plan B). Rail chỉ áp cho Nav nằm trong thân của `AppShellSidebar` của một AppShell `collapsible`: một Nav trong Drawer mở từ main thì không bao giờ là rail, dù AppShell đang thu gọn (context `AppShellSidebarContext`, §5; phát hiện khi lập Plan B). Chữ cái đầu và chấm có trong HTML từ server (CSS hiện chúng ở rail); tooltip và flyout chỉ có sau khi hydrate.
 - **`NavGroup`:**
   - Nút có icon, nhãn, chevron; `aria-expanded`, `aria-controls` trỏ vào `.flg-nav-sub`. Danh sách con được gọi tên bằng nút (`aria-labelledby`). Ở rail, nút nhóm cũng có tooltip với nhãn, như mục.
   - Mở sẵn: đọc props `active` của các `NavItem` con trực tiếp (qua Fragment và mảng, kể cả tham chiếu lazy của RSC). Con bọc trong component của người dùng thì không nhận ra: docs nói truyền `defaultOpen` khi đó. `data-has-active` cũng tính như vậy.
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index b693d58..943b69d 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -196,6 +196,8 @@ const SHIPPED_CLASSES = [
   'flg-nav-item-label',
   'flg-nav-item-badge',
   'flg-nav-item-count',
+  'flg-nav-item-letter',
+  'flg-nav-flyout-title',
   'flg-nav-group',
   'flg-nav-group-chevron',
   'flg-nav-sub',
@@ -216,6 +218,18 @@ const APP_SHELL_BLOCKS: Array<[string, boolean]> = Object.entries(APP_SHELL_BREA
         `@media\\s*${minWidth(width)}\\s*\\{[\\s\\S]*?\\.flg-app-shell\\[data-breakpoint=["']?${name}["']?\\]`,
       ).test(css),
     ],
+    [
+      `ships the Nav as a rail for breakpoint ${name}: the sidebar's own items, and the flyout kept out of it`,
+      new RegExp(
+        `@media\\s*${minWidth(width)}\\s*\\{[\\s\\S]*?\\.flg-app-shell\\[data-breakpoint=["']?${name}["']?\\]\\[data-collapsed\\]\\s*>\\s*\\.flg-app-shell-sidebar\\s+\\.flg-nav\\s+\\.flg-nav-item:not\\(\\.flg-nav-sub \\.flg-nav-item\\)`,
+      ).test(css),
+    ],
+    [
+      `ships the Nav rail for forced colours for breakpoint ${name}, bounded by ${width}px`,
+      new RegExp(
+        `@media\\s*\\(forced-colors:\\s*active\\)\\s*and\\s*${minWidth(width)}\\s*\\{[\\s\\S]*?\\.flg-app-shell\\[data-breakpoint=["']?${name}["']?\\]\\[data-collapsed\\][^{]*\\.flg-nav-group`,
+      ).test(css),
+    ],
     [
       `ships the sheet of the AppShell for breakpoint ${name}: a fixed scrim below ${width}px`,
       new RegExp(
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 5f55722..7ce0693 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -55,7 +55,7 @@ const D = {
       'description of every step and the "Step N" line of a step not reached, in a List the ' +
       'description and the end cell of a row, and in a Table `striped` and `minimal` the column ' +
       'headings and the icon of a column that is not sorted, the text of an AppShell footer, and in ' +
-      'a Nav the title of a section and the count of `bar`',
+      'a Nav the title of a section and of the flyout of a group at the rail, and the count of `bar`',
     criterion: '1.4.3',
   },
   7: {
@@ -106,8 +106,8 @@ const D = {
   14: {
     description:
       'The icon and bar of an info toast, the 2px border of the dot of the current step in a ' +
-      'Stepper `circles`, and the 1.5px outline of the current row of a List `cards`, against the ' +
-      'surface',
+      'Stepper `circles`, the 1.5px outline of the current row of a List `cards`, and the 3px bar of ' +
+      'the current item of a Nav `bar` at the rail, against the surface',
     criterion: '1.4.11',
   },
   15: { description: 'Tick dots under a Slider track, against the surface', criterion: '1.4.11' },
diff --git a/scripts/lib/app-shell-css.ts b/scripts/lib/app-shell-css.ts
index c8ec361..fbb5f0d 100644
--- a/scripts/lib/app-shell-css.ts
+++ b/scripts/lib/app-shell-css.ts
@@ -31,6 +31,22 @@ const TRIGGER = '.flg-app-shell-trigger';
 const HEADER_BRAND = '.flg-app-shell-header-brand';
 const SCRIM = '.flg-app-shell-scrim';
 
+/**
+ * The technique of `flg-visually-hidden` (utilities.css): what is hidden this way stays in the page,
+ * and stays the name of the link or the group that holds it.
+ */
+const VISUALLY_HIDDEN = [
+  'position: absolute;',
+  'width: 1px;',
+  'height: 1px;',
+  'margin: -1px;',
+  'padding: 0;',
+  'overflow: hidden;',
+  'clip-path: inset(50%);',
+  'white-space: nowrap;',
+  'border: 0;',
+].join('\n  ');
+
 /**
  * The rules for one breakpoint, without indentation. They are in the order the cascade needs: each
  * rule that must win over an earlier one is more specific than it, or later.
@@ -114,15 +130,7 @@ ${sidebarLayout}[data-collapsed] > ${SIDEBAR} > ${PANEL} > ${HEAD} {
   padding: 0;
 }
 ${shell}[data-collapsed] ${HEAD} .flg-app-shell-brand-name {
-  position: absolute;
-  width: 1px;
-  height: 1px;
-  margin: -1px;
-  padding: 0;
-  overflow: hidden;
-  clip-path: inset(50%);
-  white-space: nowrap;
-  border: 0;
+  ${VISUALLY_HIDDEN}
 }
 ${sidebarLayout} > ${FOOTER} {
   grid-column: 2;
@@ -171,6 +179,8 @@ ${noSidebar} > :is(${HEADER}, ${MAIN}, ${FOOTER}) {
   grid-column: 1;
 }
 
+${railRules(shell)}
+
 /* The padding of the page keeps what is scrolled to clear of the header; 60px is what a header is
    before the shell has measured it. */
 :root:has(${shell} > ${HEADER}) {
@@ -178,6 +188,160 @@ ${noSidebar} > :is(${HEADER}, ${MAIN}, ${FOOTER}) {
 }`;
 }
 
+/**
+ * The Nav as a rail (spec phase 5 §4.3, "Rail"): the rules of the navigation in a sidebar that is
+ * collapsed on a wide screen. They are here and not in nav.css because the rail is a state of the
+ * shell at a width, which the server already knows from `data-collapsed` and the breakpoint, so its
+ * HTML is right before anything runs. Every selector goes through the sidebar of the shell, so a Nav
+ * that sits elsewhere in the page is never a rail, and each one names the Nav's own parts and not the
+ * links of a flyout, which are drawn with their labels (nav.css). The colours of the states are those
+ * of nav.css: the icon and the first letter take the same one, so the rail adds only the geometry, the
+ * background of a group that holds the current page, and the bar.
+ */
+function railRules(shell: string): string {
+  const rail = `${shell}[data-collapsed] > ${SIDEBAR} .flg-nav`;
+  // A part of the sidebar's own list: not one of the links of a flyout, which come after its button
+  // inside `.flg-nav-sub`.
+  const item = `${rail} .flg-nav-item:not(.flg-nav-sub .flg-nav-item)`;
+  const pillGroup = `${rail}[data-variant='pill'] .flg-nav-group[data-has-active] > .flg-nav-item`;
+  const barGroup = `${rail}[data-variant='bar'] .flg-nav-group[data-has-active] > .flg-nav-item`;
+  const barCurrent = `${rail}[data-variant='bar'] .flg-nav-item[aria-current='page']:not(.flg-nav-sub .flg-nav-item)`;
+  return `/* The rail: the navigation is a column of 40px squares in the middle of the column. */
+${rail} {
+  align-items: center;
+  gap: 4px;
+  padding: 12px 0;
+}
+${rail} > .flg-nav-list,
+${rail} > .flg-nav-section > .flg-nav-list {
+  align-items: center;
+  gap: 4px;
+}
+${item} {
+  justify-content: center;
+  width: 40px;
+  height: 40px;
+  padding: 0;
+  border-radius: var(--flg-radius-md);
+}
+${item} > .flg-nav-item-icon {
+  width: 20px;
+  height: 20px;
+}
+${item} > .flg-nav-item-icon > svg {
+  width: 20px;
+  height: 20px;
+}
+/* An item with no icon shows the first letter of its label. */
+${item} > .flg-nav-item-letter {
+  display: block;
+  font: var(--flg-weight-semibold) var(--flg-text-sm) / 1 var(--flg-font-sans);
+}
+/* The label and the count go out of sight and stay the name of the link ("Inbox 12"); the count is
+   the dot, in the corner, and a button's chevron is not drawn at all. */
+${item} > :not(.flg-nav-item-icon, .flg-nav-item-letter, .flg-indicator-mark) {
+  ${VISUALLY_HIDDEN}
+}
+${item} > .flg-nav-group-chevron {
+  display: none;
+}
+${item} > .flg-indicator-mark {
+  display: block;
+}
+
+/* A section is a rule between the blocks, and its title goes out of sight and stays the name of its
+   group. The first block has nothing above it to be set off from. The section at the foot keeps its
+   own rule, the divider that it holds, at the width of the rail's. */
+${rail} > .flg-nav-section {
+  display: flex;
+  flex-direction: column;
+  align-items: center;
+  gap: 4px;
+  margin-top: 0;
+}
+${rail} > .flg-nav-section:not([data-bottom])::before {
+  content: '';
+  flex: none;
+  width: 28px;
+  height: 1px;
+  margin: 4px 0;
+  background: var(--flg-control-border);
+}
+${rail} > .flg-nav-section:first-child::before {
+  display: none;
+}
+${rail} > .flg-nav-section[data-bottom] {
+  gap: 8px;
+  margin-top: auto;
+  padding-top: 12px;
+}
+${rail} > .flg-nav-section[data-bottom] > .flg-divider {
+  width: 28px;
+  margin-left: 0;
+}
+${rail} .flg-nav-section-title {
+  ${VISUALLY_HIDDEN}
+}
+
+/* The list of links of a group is not drawn in the rail, unless it is the open flyout. */
+${rail} .flg-nav-sub:not(:popover-open) {
+  display: none;
+}
+
+/* The group that holds the current page looks as the current page does, since its links are out of
+   sight. N1 fills it as it fills the current item; N2 tints it and draws the bar at the edge of the
+   rail, 1px inside the glass. */
+${pillGroup} {
+  background: var(--flg-selected-bg);
+}
+${pillGroup} > :is(.flg-nav-item-icon, .flg-nav-item-letter) {
+  color: var(--flg-selected-text);
+}
+${barGroup} {
+  background: var(--flg-nav-tint);
+}
+${barGroup}::after,
+${barCurrent}::after {
+  content: '';
+  position: absolute;
+  top: 8px;
+  bottom: 8px;
+  left: -13px;
+  width: 3px;
+  border-radius: 0 3px 3px 0;
+  background: var(--flg-accent-solid);
+  pointer-events: none;
+}`;
+}
+
+/**
+ * The rules of the rail for forced colours, for the screens of one breakpoint. They are in the
+ * preferences layer, as the other forced-colour rules are, and are generated because the rail is a
+ * state of the shell at a width (see `railRules`).
+ */
+export function railForcedColorsRules(breakpoint: AppShellBreakpointName): string {
+  const rail = `.flg-app-shell[data-breakpoint='${breakpoint}'][data-collapsed] > ${SIDEBAR} .flg-nav`;
+  return `/* The group that holds the current page has no background to show it by, so N1 draws an outline
+   inside it, as the current item has. One with the focus keeps the ring of the focus. */
+${rail}[data-variant='pill'] .flg-nav-group[data-has-active] > .flg-nav-item:not(:focus-visible) {
+  outline: 2px solid Highlight;
+  outline-offset: -2px;
+}
+/* N2: the tint is a gradient, which the system drops, and the bar is the selection colour. */
+${rail}[data-variant='bar'] .flg-nav-group[data-has-active] > .flg-nav-item {
+  background-image: none;
+}
+${rail}[data-variant='bar'] .flg-nav-group[data-has-active] > .flg-nav-item::after {
+  forced-color-adjust: none;
+  background: Highlight;
+}
+/* The rule between two blocks is a background, which is dropped. */
+${rail} > .flg-nav-section:not([data-bottom])::before {
+  forced-color-adjust: none;
+  background: CanvasText;
+}`;
+}
+
 /**
  * The rules of the sidebar as a sheet (spec phase 5 §3.4, §4.3), for the screens narrower than the
  * breakpoint, without indentation. The sidebar is the one element of the grid, and while the root is
@@ -245,11 +409,20 @@ export function buildAppShellCss(): string {
         `@media not all and (min-width: ${APP_SHELL_BREAKPOINTS[name]}px) {\n${indent(sheetRules(name))}\n}`,
     ),
   ];
+  // The rail in forced colours is a preference, so it is in the preferences layer, with one
+  // `min-width` per block like the rest.
+  const forced = names.map(
+    (name) =>
+      `@media (forced-colors: active) and (min-width: ${APP_SHELL_BREAKPOINTS[name]}px) {\n${indent(railForcedColorsRules(name))}\n}`,
+  );
   return `/* The rules of the AppShell that depend on the width, one block per breakpoint: the wide screens,
    then the narrow ones, where the sidebar is a sheet. Generated by scripts/build-theme.ts
    from scripts/lib/app-shell-css.ts; do not edit. */
 @layer flg.components {
 ${indent(blocks.join('\n'))}
 }
+@layer flg.preferences {
+${indent(forced.join('\n'))}
+}
 `;
 }
diff --git a/src/components/app-shell/AppShell.tsx b/src/components/app-shell/AppShell.tsx
index bf00d53..e8ad708 100644
--- a/src/components/app-shell/AppShell.tsx
+++ b/src/components/app-shell/AppShell.tsx
@@ -25,6 +25,7 @@ import type { ButtonProps } from '../button/Button';
 import { IconButton } from '../icon-button/IconButton';
 import {
   AppShellContext,
+  AppShellSidebarContext,
   AppShellTextContext,
   PART_NAMES,
   useAppShellPart,
@@ -449,7 +450,9 @@ export const AppShellSidebar = forwardRef<HTMLDivElement, AppShellSidebarProps>(
             {text?.brand}
             {context?.layout === 'header' ? null : close}
           </div>
-          <div className="flg-app-shell-sidebar-body">{children}</div>
+          <div className="flg-app-shell-sidebar-body">
+            <AppShellSidebarContext.Provider value>{children}</AppShellSidebarContext.Provider>
+          </div>
         </div>
       </div>
     );
diff --git a/src/components/app-shell/app-shell-context.ts b/src/components/app-shell/app-shell-context.ts
index 98a3bd1..fdc698c 100644
--- a/src/components/app-shell/app-shell-context.ts
+++ b/src/components/app-shell/app-shell-context.ts
@@ -88,6 +88,12 @@ export interface AppShellTextValue {
 
 export const AppShellTextContext = createContext<AppShellTextValue | null>(null);
 
+/**
+ * True inside the body of the sidebar, the one place the shell draws a rail: a Nav that sits in another
+ * part of the page (a Drawer opened from the main content) is never one, whatever the shell does.
+ */
+export const AppShellSidebarContext = createContext(false);
+
 /**
  * Registers a part with the shell once it is mounted, or warns that it is not inside one. A part
  * outside an `AppShell` still renders: it is only a misuse, and the library does not throw on those.
diff --git a/src/components/nav/Nav.tsx b/src/components/nav/Nav.tsx
index f1dc2f1..c72eb58 100644
--- a/src/components/nav/Nav.tsx
+++ b/src/components/nav/Nav.tsx
@@ -8,14 +8,19 @@ import {
   Fragment,
   isValidElement,
   useContext,
+  useEffect,
   useId,
   useMemo,
+  useRef,
+  useState,
 } from 'react';
 import type {
   AnchorHTMLAttributes,
+  FocusEvent,
   HTMLAttributes,
   LiHTMLAttributes,
   MouseEvent,
+  ReactElement,
   ReactNode,
   Ref,
 } from 'react';
@@ -34,11 +39,16 @@ import { resolveLazy } from '../../internal/react-lazy';
 import { hasModifier } from '../../internal/roving';
 import { Slot } from '../../internal/slot';
 import { useControllableState } from '../../internal/use-controllable-state';
+import { useFloating } from '../../internal/use-floating';
+import { usePopover } from '../../internal/use-popover';
+import { usePopoverState, useTriggerPress } from '../../internal/use-popover-trigger';
 import { devWarn } from '../../internal/warn';
 import { withDefaults } from '../../internal/with-defaults';
-import { AppShellContext } from '../app-shell/app-shell-context';
+import { AppShellContext, AppShellSidebarContext } from '../app-shell/app-shell-context';
+import type { AppShellContextValue } from '../app-shell/app-shell-context';
 import { Badge } from '../badge/Badge';
 import { Divider } from '../divider/Divider';
+import { TooltipContent, TooltipRoot, TooltipTrigger } from '../tooltip/Tooltip';
 
 export type NavVariant = 'pill' | 'bar';
 
@@ -101,6 +111,63 @@ const NavContext = createContext<NavContextValue | null>(null);
 // A value outside the union is a mistake that TypeScript did not see (plain JavaScript): the default.
 const toVariant = (variant: unknown): NavVariant => (variant === 'bar' ? 'bar' : 'pill');
 
+// The rail is 68px wide and its items 40px, so an item stands 14px in from its edge: a tooltip 20px
+// from the item is 6px beyond the rail, as the mockup draws it (spec phase 5 §4.3).
+const RAIL_TOOLTIP_OFFSET = 20;
+
+const noIconWarning = (part: 'NavItem' | 'NavGroup') =>
+  `<${part}> at the top level needs an icon when the sidebar can collapse to a rail; the rail shows the first letter of its label instead.`;
+
+/** The count at the rail: the dot of the Indicator, in the corner of the item. */
+function CountDot() {
+  return <span className="flg-indicator-mark" data-dot data-status="accent" aria-hidden="true" />;
+}
+// The flyout stands 16px from the button, and 10px more is the room of its arrow, as a Popover's.
+const FLYOUT_OFFSET = 26;
+// It starts 6px above the button, so that its arrow, 20px from its top, points at the middle of it.
+const FLYOUT_ALIGN_OFFSET = -6;
+
+/** What a part of a Nav knows about the rail, which only the sidebar of an `AppShell` can be. */
+interface RailState {
+  /** The rail can be drawn here: a top-level part in the sidebar of a shell that can collapse. */
+  railable: boolean;
+  /** The rail is drawn now: the sidebar is collapsed on a wide screen (the generated CSS says the same). */
+  rail: boolean;
+}
+
+function useRailState(level: NavLevel | undefined): RailState {
+  const shell: AppShellContextValue | null = useContext(AppShellContext);
+  const inSidebar = useContext(AppShellSidebarContext);
+  if (!inSidebar || shell === null || !shell.collapsible || level === 'group') {
+    return { railable: false, rail: false };
+  }
+  return { railable: true, rail: shell.collapsed && shell.isWide };
+}
+
+/** The first character of a label that is text, whole: what the rail shows for a part with no icon. */
+function firstLetter(label: ReactNode): string | undefined {
+  if (typeof label !== 'string') return undefined;
+  const text = label.trim();
+  // A character is more than a code unit: an emoji, or a letter with a mark written apart from it.
+  if (typeof Intl.Segmenter === 'function') {
+    return new Intl.Segmenter().segment(text)[Symbol.iterator]().next().value?.segment;
+  }
+  return Array.from(text)[0];
+}
+
+/**
+ * The tooltip of a part of the rail. The Tooltip is in the tree all the time and only shown at the
+ * rail, so that the link is not mounted again, and does not lose its focus, when the rail comes and
+ * goes; that is why its state is controlled here.
+ */
+function useRailTooltip(show: boolean) {
+  const [wanted, setWanted] = useState(false);
+  return {
+    open: show && wanted,
+    onOpenChange: (next: boolean) => setWanted(show && next),
+  };
+}
+
 /** The list of links. Safari drops the list semantics of a list with `list-style: none`. */
 const NavList = forwardRef<HTMLUListElement, HTMLAttributes<HTMLUListElement>>(
   function NavList(props, ref) {
@@ -238,8 +305,12 @@ export const NavItem = markPart(
     // Only the part of the shell that does not change with its brand and its words, so that an inline
     // `brand` or `labels` does not render every link again.
     const setOpen = useContext(AppShellContext)?.setOpen;
+    const { railable, rail } = useRailState(nav?.level);
+    const tip = useRailTooltip(rail);
     if (!nav) devWarn('<NavItem> must be rendered inside <Nav>, <NavSection> or <NavGroup>.');
     const look = nav?.variant ?? 'pill';
+    const iconless = !hasContent(icon);
+    if (railable && iconless) devWarn(noIconWarning('NavItem'));
 
     // A plain click: Ctrl, Meta and Shift open the link somewhere else, Alt downloads it, and a
     // handler that called `preventDefault()` has taken the click for something of its own.
@@ -259,17 +330,28 @@ export const NavItem = markPart(
       ) : hasContent(badge) ? (
         badge
       ) : null;
-    const inside = (label: ReactNode) => (
-      <>
-        {hasContent(icon) ? (
-          <span className="flg-nav-item-icon" aria-hidden="true">
-            {icon}
-          </span>
-        ) : null}
-        <span className="flg-nav-item-label">{label}</span>
-        {count}
-      </>
-    );
+    // What the link holds. The parts of the rail are in the HTML all the time and the CSS shows them
+    // (the server does not know the window): the first letter where the icon would be, and the count
+    // as a dot. A sidebar that cannot collapse has no rail, and a link outside a sidebar none.
+    const inside = (label: ReactNode) => {
+      const letter = railable && iconless ? firstLetter(label) : undefined;
+      return (
+        <>
+          {!iconless ? (
+            <span className="flg-nav-item-icon" aria-hidden="true">
+              {icon}
+            </span>
+          ) : letter ? (
+            <span className="flg-nav-item-letter" aria-hidden="true">
+              {letter}
+            </span>
+          ) : null}
+          <span className="flg-nav-item-label">{label}</span>
+          {count}
+          {railable && count !== null ? <CountDot /> : null}
+        </>
+      );
+    };
 
     const shared = {
       ...props,
@@ -281,13 +363,17 @@ export const NavItem = markPart(
       onAuxClickCapture: disabled ? blockActivation : props.onAuxClickCapture,
     };
 
-    let link: ReactNode;
+    // A Server Component can pass the child of `asChild` as a lazy reference, which says nothing about
+    // the element until it is resolved.
+    const element = asChild ? resolveLazy(children) : null;
+    const label = isValidElement<{ children?: ReactNode }>(element)
+      ? element.props.children
+      : children;
+
+    let link: ReactElement;
     if (asChild) {
-      // A Server Component can pass the child as a lazy reference, which says nothing about the
-      // element until it is resolved.
-      const element = resolveLazy(children);
       const child = isValidElement<{ children?: ReactNode }>(element)
-        ? cloneElement(element, undefined, inside(element.props.children))
+        ? cloneElement(element, undefined, inside(label))
         : element;
       link = (
         <Slot ref={ref as Ref<HTMLElement>} {...shared} tabIndex={disabled ? -1 : props.tabIndex}>
@@ -309,7 +395,21 @@ export const NavItem = markPart(
         </a>
       );
     }
-    return <li>{link}</li>;
+    // A link that is disabled cannot be reached, which the Tooltip asks of its trigger, and its label
+    // is not worth a tooltip to a person who cannot use it.
+    if (!railable || disabled) return <li>{link}</li>;
+    return (
+      <li>
+        <TooltipRoot describe={false} {...tip}>
+          <TooltipTrigger>{link}</TooltipTrigger>
+          {rail ? (
+            <TooltipContent side="right" sideOffset={RAIL_TOOLTIP_OFFSET}>
+              {label}
+            </TooltipContent>
+          ) : null}
+        </TooltipRoot>
+      </li>
+    );
   }),
   'nav-item',
 );
@@ -320,7 +420,7 @@ export const NavItem = markPart(
  * wraps is not seen, and then `defaultOpen` says it.
  */
 export const NavGroup = forwardRef<HTMLLIElement, NavGroupProps>(function NavGroup(
-  { label, icon, open: openProp, defaultOpen, onOpenChange, className, children, ...props },
+  { label, icon, open: openProp, defaultOpen, onOpenChange, onBlur, className, children, ...props },
   ref,
 ) {
   const nav = useContext(NavContext);
@@ -342,33 +442,129 @@ export const NavGroup = forwardRef<HTMLLIElement, NavGroupProps>(function NavGro
     onChange: onOpenChange,
     name: 'NavGroup `open`',
   });
+
+  // At the rail the button opens a flyout instead: the list of links itself becomes a popover. Its
+  // state is the group's own and is not the `open` of the group, which is what the expanded sidebar
+  // shows when it comes back (spec §6.3).
+  const { railable, rail } = useRailState(nav?.level);
+  const iconless = !hasContent(icon);
+  if (railable && iconless) devWarn(noIconWarning('NavGroup'));
+  const flyoutState = usePopoverState<HTMLDivElement>({
+    open: undefined,
+    defaultOpen: false,
+    onOpenChange: undefined,
+    name: 'NavGroup flyout',
+  });
+  const { report: setFlyout, request: requestFlyout } = flyoutState;
+  const flyoutOpen = rail && flyoutState.open;
+  // Leaving the rail closes the flyout for good: it does not open again with the next rail.
+  useEffect(() => {
+    if (!rail) setFlyout(false);
+  }, [rail, setFlyout]);
+  const buttonRef = useRef<HTMLButtonElement>(null);
+  const arrowRef = useRef<HTMLSpanElement>(null);
+  // Focus stays on the button when it opens (a disclosure), so there is no `onShown`.
+  usePopover(flyoutState.contentRef, {
+    open: flyoutOpen,
+    onOpenChange: setFlyout,
+    pendingToggle: flyoutState.pendingToggle,
+    restoreFocusTo: () => buttonRef.current,
+  });
+  useFloating({
+    open: flyoutOpen,
+    reference: () => buttonRef.current,
+    floating: flyoutState.contentRef,
+    side: 'right',
+    align: 'start',
+    offset: FLYOUT_OFFSET,
+    alignOffset: FLYOUT_ALIGN_OFFSET,
+    arrow: arrowRef,
+  });
+  const press = useTriggerPress(flyoutOpen, (wasOpen) => requestFlyout(!wasOpen));
+  // The tooltip of the button would cover the arrow of the flyout, so it gives way while that shows.
+  const tip = useRailTooltip(rail && !flyoutOpen);
+
+  // Focus that leaves both the button and the flyout closes it. A press on the padding of the flyout
+  // leaves focus on nothing (`relatedTarget` is null), which is not leaving: a press outside is the
+  // browser's own light dismiss.
+  const closeOnFocusLeaving = (event: FocusEvent<HTMLLIElement>) => {
+    const next = event.relatedTarget;
+    if (flyoutOpen && next instanceof Node && !event.currentTarget.contains(next)) {
+      requestFlyout(false);
+    }
+  };
+  // A link that is activated has taken the person where they were going.
+  const closeOnLink = (event: MouseEvent<HTMLUListElement>) => {
+    const link = event.target instanceof Element ? event.target.closest('a') : null;
+    if (flyoutOpen && link && link.getAttribute('aria-disabled') !== 'true') requestFlyout(false);
+  };
+
+  const letter = railable && iconless ? firstLetter(label) : undefined;
+  const button = (
+    <button
+      ref={buttonRef}
+      type="button"
+      id={buttonId}
+      className="flg-nav-item"
+      aria-expanded={rail ? flyoutOpen : open}
+      aria-controls={listId}
+      onPointerDown={rail ? press.onPointerDown : undefined}
+      onPointerCancel={rail ? press.onPointerCancel : undefined}
+      onClick={(event) => (rail ? press.onClick(event) : setOpen(!open))}
+    >
+      {!iconless ? (
+        <span className="flg-nav-item-icon" aria-hidden="true">
+          {icon}
+        </span>
+      ) : letter ? (
+        <span className="flg-nav-item-letter" aria-hidden="true">
+          {letter}
+        </span>
+      ) : null}
+      <span className="flg-nav-item-label">{label}</span>
+      <ChevronIcon className="flg-nav-group-chevron" />
+    </button>
+  );
   return (
     <NavContext.Provider value={context}>
       <li
         ref={ref}
         {...props}
+        onBlur={composeEventHandlers(onBlur, closeOnFocusLeaving)}
         className={clsx('flg-nav-group', className)}
         data-open={dataAttr(open)}
         data-has-active={dataAttr(hasActive)}
       >
-        <button
-          type="button"
-          id={buttonId}
-          className="flg-nav-item"
-          aria-expanded={open}
-          aria-controls={listId}
-          onClick={() => setOpen(!open)}
+        {railable ? (
+          <TooltipRoot describe={false} {...tip}>
+            <TooltipTrigger>{button}</TooltipTrigger>
+            {rail ? (
+              <TooltipContent side="right" sideOffset={RAIL_TOOLTIP_OFFSET}>
+                {label}
+              </TooltipContent>
+            ) : null}
+          </TooltipRoot>
+        ) : (
+          button
+        )}
+        <div
+          ref={flyoutState.contentRef}
+          id={listId}
+          className={clsx('flg-nav-sub', rail && 'flg-surface flg-popover')}
+          popover={rail ? 'auto' : undefined}
+          data-side={rail ? 'right' : undefined}
+          data-align={rail ? 'start' : undefined}
+          hidden={rail ? !flyoutOpen : !open}
         >
-          {hasContent(icon) ? (
-            <span className="flg-nav-item-icon" aria-hidden="true">
-              {icon}
-            </span>
+          {flyoutOpen ? (
+            <span ref={arrowRef} className="flg-popover-arrow" aria-hidden="true" />
           ) : null}
-          <span className="flg-nav-item-label">{label}</span>
-          <ChevronIcon className="flg-nav-group-chevron" />
-        </button>
-        <div className="flg-nav-sub" id={listId} hidden={!open}>
-          <NavList aria-labelledby={buttonId}>{children}</NavList>
+          <div className="flg-nav-flyout-title" aria-hidden="true">
+            {label}
+          </div>
+          <NavList aria-labelledby={buttonId} onClick={closeOnLink}>
+            {children}
+          </NavList>
         </div>
       </li>
     </NavContext.Provider>
diff --git a/src/components/tooltip/Tooltip.tsx b/src/components/tooltip/Tooltip.tsx
index 049baca..8f12205 100644
--- a/src/components/tooltip/Tooltip.tsx
+++ b/src/components/tooltip/Tooltip.tsx
@@ -89,6 +89,8 @@ interface TooltipContextValue {
   closeNow: () => void;
   /** Set by a press, or by Esc with the pointer on the trigger, until the pointer leaves it. */
   held: MutableRefObject<boolean>;
+  /** Whether the trigger is described by the tooltip (`aria-describedby`). */
+  describe: boolean;
 }
 
 const TooltipContext = createContext<TooltipContextValue | null>(null);
@@ -123,14 +125,29 @@ export interface TooltipContentProps extends Omit<HTMLAttributes<HTMLDivElement>
   sideOffset?: number;
 }
 
-/** A short text label for its trigger, on hover and keyboard focus. Renders no element. */
-export function Tooltip({
+/** What only the library's own parts say to a Tooltip: not in the public props (spec phase 5 §5). */
+interface TooltipInternalProps {
+  /**
+   * Whether the trigger gets `aria-describedby` to the tooltip. Default `true`; `false` when the text
+   * of the tooltip is the name of the trigger (an item of the rail), or is said another way, so that
+   * a screen reader does not read it twice.
+   */
+  describe?: boolean;
+}
+
+/**
+ * The Tooltip with the internal options. Not exported from the package: the parts of the library
+ * that need `describe` use it, and `Tooltip` hands it only the public props, so a caller cannot reach
+ * the option from plain JavaScript either.
+ */
+export function TooltipRoot({
   open,
   defaultOpen = false,
   onOpenChange,
   delay = 500,
+  describe = true,
   children,
-}: TooltipProps) {
+}: TooltipProps & TooltipInternalProps) {
   const [isOpen, setOpen] = useControllableState({
     value: open,
     defaultValue: defaultOpen,
@@ -222,12 +239,22 @@ export function Tooltip({
       closeSoon,
       closeNow,
       held,
+      describe,
     }),
-    [isOpen, contentId, openSoon, openNow, closeSoon, closeNow],
+    [isOpen, contentId, openSoon, openNow, closeSoon, closeNow, describe],
   );
   return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
 }
 
+/** A short text label for its trigger, on hover and keyboard focus. Renders no element. */
+export function Tooltip({ open, defaultOpen, onOpenChange, delay, children }: TooltipProps) {
+  return (
+    <TooltipRoot open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} delay={delay}>
+      {children}
+    </TooltipRoot>
+  );
+}
+
 const isTouch = (event: PointerEvent) => event.pointerType === 'touch';
 
 /** The key of the last `keydown` on the page, shared by every TooltipTrigger. */
@@ -327,13 +354,14 @@ export const TooltipTrigger = forwardRef<HTMLElement, TooltipTriggerProps>(funct
   // The child keeps its own description, and the tooltip's is added after it. Slot lets the child's
   // props win, so the merged value goes on the child itself.
   const child = resolveLazy(children);
-  const described = isValidElement<HTMLAttributes<HTMLElement>>(child)
-    ? cloneElement(child, {
-        'aria-describedby': [child.props['aria-describedby'], ctx.contentId]
-          .filter(Boolean)
-          .join(' '),
-      })
-    : child;
+  const described =
+    ctx.describe && isValidElement<HTMLAttributes<HTMLElement>>(child)
+      ? cloneElement(child, {
+          'aria-describedby': [child.props['aria-describedby'], ctx.contentId]
+            .filter(Boolean)
+            .join(' '),
+        })
+      : child;
   return (
     <Slot
       ref={mergedRef}
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index 2f42258..1ce42bf 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -64,7 +64,7 @@ The contrast gaps of the Slider (rows 15 to 17), Calendar (row 18), FileUpload (
 Alert (rows 23 to 26), Progress (rows 27 to 29), Stepper (rows 30 and 31, and its part in rows 26,
 27 and 29), List (its part in rows 31 and 32) and Table (rows 32 to 34, and its part in rows 2, 6,
 9, 12 and 22), AppShell (its part in rows 2 and 6) and Nav (row 35, and its part in rows 2, 6, 7, 8,
-12, 29 and 32) are in the table above, which is built from the same data CI checks.
+12, 14, 29 and 32) are in the table above, which is built from the same data CI checks.
 
 A List row that can be pressed has one link or button, the title, stretched over the whole row. It
 is named by the title alone: the description and the end cell are read when the person browses the
diff --git a/src/styles/components/nav.css b/src/styles/components/nav.css
index fe7873b..3660474 100644
--- a/src/styles/components/nav.css
+++ b/src/styles/components/nav.css
@@ -2,7 +2,8 @@
    the top are shared; each look writes only what differs from them. The state is read from
    `aria-current="page"` on the link, `aria-disabled` on a link that goes nowhere, and `data-open` and
    `data-has-active` on a group, so the HTML from the server is already right. This file is the
-   expanded form; the rail is written in the generated rules of the AppShell. */
+   expanded form and the flyout of a group; the rail is written in the generated rules of the AppShell
+   (scripts/lib/app-shell-css.ts), which show the parts that this form hides. */
 @layer flg.components {
   /* It grows in the body of a sidebar, which is a column, so that the items at the foot are pushed to
      the end of it. */
@@ -100,6 +101,17 @@
   .flg-nav-item-badge {
     flex: none;
   }
+  /* The parts that only the rail shows are in the HTML all the time, because the server does not know
+     the window; here they are not drawn. The first letter takes the colours of the icon it stands for. */
+  .flg-nav-item-letter,
+  .flg-nav-item > .flg-indicator-mark,
+  .flg-nav-flyout-title {
+    display: none;
+  }
+  .flg-nav-item-letter {
+    flex: none;
+    color: var(--flg-text-muted);
+  }
   /* The count of `bar` is a bare number. */
   .flg-nav-item-count {
     flex: none;
@@ -125,7 +137,8 @@
     .flg-nav-item:not([aria-current='page'], [aria-disabled='true']):hover {
       background: var(--flg-control-track);
     }
-    .flg-nav-item:not([aria-current='page'], [aria-disabled='true']):hover > .flg-nav-item-icon {
+    .flg-nav-item:not([aria-current='page'], [aria-disabled='true']):hover
+      > :is(.flg-nav-item-icon, .flg-nav-item-letter) {
       color: var(--flg-text);
     }
   }
@@ -175,7 +188,9 @@
     color: var(--flg-selected-text);
     font-weight: var(--flg-weight-semibold);
   }
-  .flg-nav[data-variant='pill'] .flg-nav-item[aria-current='page'] > .flg-nav-item-icon {
+  .flg-nav[data-variant='pill']
+    .flg-nav-item[aria-current='page']
+    > :is(.flg-nav-item-icon, .flg-nav-item-letter) {
     color: var(--flg-selected-text);
   }
   .flg-nav[data-variant='pill'] .flg-nav-group[data-has-active] > .flg-nav-item {
@@ -220,11 +235,13 @@
     background: var(--flg-nav-tint);
     font-weight: var(--flg-weight-semibold);
   }
-  .flg-nav[data-variant='bar'] .flg-nav-item[aria-current='page'] > .flg-nav-item-icon,
+  .flg-nav[data-variant='bar']
+    .flg-nav-item[aria-current='page']
+    > :is(.flg-nav-item-icon, .flg-nav-item-letter),
   .flg-nav[data-variant='bar']
     .flg-nav-group[data-has-active]
     > .flg-nav-item
-    > .flg-nav-item-icon {
+    > :is(.flg-nav-item-icon, .flg-nav-item-letter) {
     color: var(--flg-accent-text);
   }
   .flg-nav[data-variant='bar'] .flg-nav-group[data-has-active] > .flg-nav-item {
@@ -253,4 +270,45 @@
     left: -1px;
     border-radius: 3px;
   }
+
+  /* The flyout of a group at the rail (spec phase 5 §4.3): the list of links itself, as a Popover's
+     glass, with the name of the group over its links. It has the class of a Popover only while it is
+     one, so none of this reaches the expanded form. The links are drawn with their labels, as the look
+     draws a top-level link, and without the indent and the line that joins them to the group. */
+  .flg-nav-sub.flg-popover {
+    width: 166px;
+    margin: 0;
+    padding: 6px;
+  }
+  .flg-nav-sub.flg-popover:popover-open {
+    gap: 2px;
+  }
+  .flg-nav-sub.flg-popover > .flg-nav-flyout-title {
+    display: block;
+    padding: 6px 10px 4px;
+    color: var(--flg-text-muted);
+    font: var(--flg-weight-semibold) var(--flg-text-xs) / 1.2 var(--flg-font-sans);
+  }
+  .flg-nav-sub.flg-popover .flg-nav-item {
+    margin-left: 0;
+  }
+  .flg-nav-sub.flg-popover .flg-nav-item::before {
+    content: none;
+  }
+  /* N2: the rows run to the left edge of the glass, with the bar of the current one on it. */
+  .flg-nav[data-variant='bar'] .flg-nav-sub.flg-popover {
+    padding-left: 0;
+  }
+  .flg-nav[data-variant='bar'] .flg-nav-sub.flg-popover > .flg-nav-flyout-title {
+    padding-left: 16px;
+  }
+  .flg-nav[data-variant='bar'] .flg-nav-sub.flg-popover .flg-nav-item {
+    padding-left: 16px;
+  }
+  .flg-nav[data-variant='bar'] .flg-nav-sub.flg-popover .flg-nav-item[aria-current='page']::after {
+    top: 6px;
+    bottom: 6px;
+    left: 0;
+    border-radius: 0 3px 3px 0;
+  }
 }
diff --git a/tests/visual/stories.visual.ts b/tests/visual/stories.visual.ts
index 637b1e5..4b7ae9e 100644
--- a/tests/visual/stories.visual.ts
+++ b/tests/visual/stories.visual.ts
@@ -85,6 +85,12 @@ for (const story of stories) {
         // the AppShell, so no older baseline is shot any later than before.
         if (hovered || viewport !== DEFAULT_VIEWPORT) await page.waitForFunction(renderFinished);
         if (hovered) await hover.hover();
+        // `data-visual-hover="tooltip"` says that what is hovered has a tooltip, which opens after its
+        // delay (500ms): two shots taken before it opens would be the same, and would pass. So the shot
+        // waits for a tooltip that is open (spec phase 5 §7).
+        if (hovered && (await hover.getAttribute('data-visual-hover')) === 'tooltip') {
+          await page.locator("[role='tooltip']:popover-open").waitFor();
+        }
         await expect(stage).toHaveScreenshot(`${story.id}--${theme}--${mode.name}.png`);
       });
     }
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components src/internal src/index.test.ts src/docs
pnpm vitest run --project scripts
pnpm check:contrast
pnpm vitest run --project storybook-light src/components/nav
pnpm vitest run --project storybook-dark src/components/nav
pnpm vitest run --project storybook-light src/components/tooltip
pnpm vitest run --project storybook-dark src/components/tooltip
pnpm vitest run --project storybook-light src/components/app-shell
pnpm vitest run --project storybook-dark src/components/app-shell
pnpm build && pnpm check:package
pnpm build-storybook
```

Expected:
- `pnpm gen:theme`: `src/styles/generated/app-shell.css` có chín khối `@media` (sáu trong `flg.components`, ba khối forced colors trong `flg.preferences`).
- `lint`, `typecheck`, `format:check`: PASS.
- Unit: 192 file, 4006 test PASS, 4 skip (hai project React), không lỗi kiểu. `Nav.rail.test.tsx` có 33 test ở mỗi project. Các test `inside an AppShell` của Task 2 in cảnh báo mục không icon; chúng không kiểm nó (phát hiện 10).
- `scripts`: 114 test PASS (5 file; thêm 15 test của bộ sinh).
- `pnpm check:contrast`: PASS, không cặp mới, không ngoại lệ mới.
- Story nav: 42 test PASS ở mỗi project (14 story × ba engine). Story tooltip: 42. Story app-shell: 165.
- `pnpm build && pnpm check:package`: PASS. `check:dist-css` thấy hai class mới, và ở mỗi điểm gãy khối rail và khối forced colors; `size`: JS 51.63 kB trên 54.61 kB, CSS 15.34 kB trên 15.49 kB (còn 151 B). Không chạy `size:record`.
- `pnpm build-storybook`: PASS. Trong các story mới, chỉ `PillRail` và `BarRail` không gắn `no-visual` (130 story có ảnh).
- Dạng mở rộng chỉ thêm quy tắc `display: none` cho các phần mới; `Pill` và `Bar` nằm ngoài AppShell nên không phần nào railable; `Tooltip` công khai không đổi (phát hiện 18). Ảnh chuẩn cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md \
  docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md \
  scripts/check-dist-css.ts \
  scripts/contrast-exceptions.ts \
  scripts/lib/app-shell-css.test.ts \
  scripts/lib/app-shell-css.ts \
  src/components/app-shell/AppShell.tsx \
  src/components/app-shell/app-shell-context.ts \
  src/components/nav/Nav.rail.test.tsx \
  src/components/nav/Nav.stories.tsx \
  src/components/nav/Nav.tsx \
  src/components/tooltip/Tooltip.test.tsx \
  src/components/tooltip/Tooltip.tsx \
  src/docs/Accessibility.mdx \
  src/styles/components/nav.css \
  tests/visual/stories.visual.ts
```
```bash
git commit -m "feat(nav): draw the Nav as a rail, with tooltips, count dots, first letters and a group flyout" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 4: `Nav.mdx`, ghi chú Accessibility và ngưỡng kích thước của Plan B

Spec §8 (`Nav.mdx`; ghi chú của Nav và Indicator trên trang Accessibility), §9. Không có code của lib. Task này kết thúc bằng kiểm tra cuối của cả nhánh.
- **`Nav.mdx`** thay trang autodocs, và có mọi điểm Nav của §8: hai variant và khi nào dùng cái nào; `asChild` với `Link` của Next.js; `active` do ứng dụng tính từ đường dẫn hiện tại; `NavGroup` mở sẵn và giới hạn của nó với con bọc (`defaultOpen`), trạng thái mở chỉ là lúc bắt đầu; hai cấp và `NavSection` là con trực tiếp; icon cho mục cấp 1; số đếm trong tên; rail (mục tắt không có tooltip; Nav ngoài sidebar không bao giờ là rail) (phát hiện 4, 10, 14).
- **Ví dụ sống:** `Canvas` của `Pill` và `Bar`; rail là `StoryFrame` (iframe của `PillRail`), như `AppShell.mdx` (phát hiện 14).
- **Trang Accessibility:** mục mới "Navigation and the Indicator" (phát hiện 14).
- **Ngưỡng kích thước** cho cả Plan B, ghi bằng `pnpm size:record` (không chép `.size-limit.json`).

**Files:**
- Create: `src/components/nav/Nav.mdx`
- Modify: `src/docs/Accessibility.mdx`, `.size-limit.json` (do `size:record` ghi)

**Interfaces:**
- `Nav.mdx`: `<Meta of={Stories} />` của `Nav.stories.tsx`; mở đầu có một ví dụ mã và `<Canvas of={Stories.Pill} />`; các mục `## Props` (`### Nav`, `### NavSection`, `### NavItem`, `### NavGroup`), `## Looks` (`<Canvas of={Stories.Bar} />`), `## Two levels`, `## Groups: open at the start`, `## The current page, and Next.js`, `## The count`, `## The rail`, `## Do and don't`, `## Accessibility`.
- `<StoryFrame title="The Nav as a rail on a wide screen" id="components-nav--pill-rail" />` (`.storybook/story-frame.tsx` của Plan A). Đổi tên story `PillRail` là hỏng khung.
- `src/docs/Accessibility.mdx`: mục `## Navigation and the Indicator`, sau "The app shell", trước "A `<dialog>` the library did not create".
- `.size-limit.json`: ngưỡng mới JS 56792 B, CSS 16869 B (do `size:record` ghi).
- Không có export, class, CSS hay token mới.
- Consumes: story `Pill`, `Bar`, `PillRail` của Task 2, 3; `StoryFrame`.
- Plan C dùng: mục "App shell" của Getting started và trang "Examples/App shell" trỏ về trang này.

- [ ] **Step 1: Viết test**

Task này không có patch test: nó chỉ viết docs và ghi ngưỡng, không có hành vi nào để một test fail trước (phát hiện 16). Đi thẳng tới Step 3.

- [ ] **Step 2: Chạy test, xác nhận fail**

Không có (Step 1).

- [ ] **Step 3: Viết code**

````diff
diff --git a/src/components/nav/Nav.mdx b/src/components/nav/Nav.mdx
new file mode 100644
index 0000000..e1d5b9d
--- /dev/null
+++ b/src/components/nav/Nav.mdx
@@ -0,0 +1,260 @@
+import { Canvas, Meta } from '@storybook/addon-docs/blocks';
+import { StoryFrame } from '../../../.storybook/story-frame';
+import * as Stories from './Nav.stories';
+
+<Meta of={Stories} />
+
+# Nav
+
+The list of places in an application: links in a column, in sections, with groups that open to show
+the pages under them. It is made for the sidebar of an `AppShell`, where it is a column of 264px on a
+wide screen, a rail of icons when the sidebar is folded, and a sheet on a narrow one. It also works
+anywhere else a column of links is wanted.
+
+```tsx
+import { Nav, NavGroup, NavItem, NavSection } from 'h2d-glass-ui';
+
+<Nav aria-label="Main">
+  <NavItem href="/" icon={<HomeIcon />} active>
+    Overview
+  </NavItem>
+  <NavItem href="/inbox" icon={<InboxIcon />} badge={12}>
+    Inbox
+  </NavItem>
+  <NavSection title="Projects">
+    <NavGroup label="Design" icon={<FolderIcon />}>
+      <NavItem href="/design/system">Design system</NavItem>
+      <NavItem href="/design/mobile">Mobile app</NavItem>
+    </NavGroup>
+  </NavSection>
+  <NavSection bottom>
+    <NavItem href="/settings" icon={<GearIcon />}>
+      Settings
+    </NavItem>
+  </NavSection>
+</Nav>;
+```
+
+<Canvas of={Stories.Pill} />
+
+## Props
+
+### Nav
+
+| Prop      | Type                 | Default  | Does                                                               |
+| --------- | -------------------- | -------- | ------------------------------------------------------------------ |
+| `variant` | `'pill' \| 'bar'`    | `'pill'` | The look of the items (see Looks)                                  |
+| `labels`  | `Partial<NavLabels>` | English  | The one word of the Nav: `nav`, the name of the landmark, `"Main"` |
+
+`Nav` is a `<nav>`. Its name is `labels.nav` unless you give `aria-label` or `aria-labelledby`, which
+win. `ref`, `className`, `style` and the other attributes of a `nav` go to the element. A value of
+`variant` outside the union gets the default. A `Nav` with nothing in it renders nothing.
+
+### NavSection
+
+| Prop     | Type        | Does                                                         |
+| -------- | ----------- | ------------------------------------------------------------ |
+| `title`  | `ReactNode` | The heading of the section; it also names its group of links |
+| `bottom` | `boolean`   | Pushes the section to the foot of the sidebar, under a rule  |
+
+A section is a `role="group"` named by its title. Items that stand together outside any section are
+one list, and each section is a list of its own.
+
+### NavItem
+
+| Prop       | Type        | Does                                                                              |
+| ---------- | ----------- | --------------------------------------------------------------------------------- |
+| `icon`     | `ReactNode` | The icon before the label. Give one to every item at the top level (see The rail) |
+| `badge`    | `ReactNode` | A count or a short text at the end of the row (see The count)                     |
+| `active`   | `boolean`   | The page the person is on: `aria-current="page"`                                  |
+| `disabled` | `boolean`   | Stays in the list and goes nowhere: it cannot be reached with Tab                 |
+| `asChild`  | `boolean`   | Renders the one child element (a router's `Link`) as the link                     |
+
+The other attributes of an `a` go to the link. A `NavItem` renders its own `<li>`; `ref` and
+`className` go to the link. With `asChild` the child keeps its own props and its content is the
+label, as with `Button asChild`.
+
+### NavGroup
+
+| Prop           | Type                      | Does                                             |
+| -------------- | ------------------------- | ------------------------------------------------ |
+| `label`        | `ReactNode`               | The name of the group and the text of its button |
+| `icon`         | `ReactNode`               | The icon before the label                        |
+| `open`         | `boolean`                 | Whether the links show. Controlled               |
+| `defaultOpen`  | `boolean`                 | Whether they show at the start, uncontrolled     |
+| `onOpenChange` | `(open: boolean) => void` | Called when the person opens or closes the group |
+
+A group is a `<li>` with a button and, under it, a list of links. `ref`, `className` and the other
+attributes of a `li` go to the element.
+
+## Looks
+
+`variant` picks how the current page and the hovered row are drawn. The default theme draws both as
+approved, in the light and the dark theme.
+
+- `variant="pill"` (default): the current page is a soft pill of the accent, and a count is a
+  neutral `Badge`. It is the gentler look, for a navigation that sits beside content and does not
+  want to be the loudest thing on the page: an admin console, a settings area.
+- `variant="bar"`: the current page has a bar of the accent on the left edge and a tint that fades
+  out to the right, and a count is a bare number. It is the sharper look, for a navigation with many
+  items that has to say where the person is at a glance: a tool with deep sections, a docs site.
+
+<Canvas of={Stories.Bar} />
+
+The bar and its tint are below 3:1 against the glass in the default theme (row 35 of the table on
+the Accessibility page). The current page is also told by the text weight and by `aria-current`, and
+`prefers-contrast: more` draws a solid accent instead.
+
+## Two levels
+
+A `NavGroup` holds links, which are shown indented under its button. A group does not hold another
+group: navigation has two levels at most, and a group in a group is warned about in development. If
+a third level is needed, the page the group leads to should carry it.
+
+`NavSection` must be a **direct child** of `Nav`. The Nav splits what it is given into lists and
+sections by looking at the elements; a component of yours that returns a `NavSection` is taken for
+an item and put in a list, where a section does not belong. Write the `NavSection` in the Nav's own
+JSX, or build it in a function you call (`{renderSection()}`), not in a component.
+
+## Groups: open at the start
+
+A `NavGroup` is open at the start when one of its direct `NavItem`s is `active`, so the page the
+person is on is never hidden, and the HTML from the server is already open. `defaultOpen` says it
+yourself, and `open` with `onOpenChange` controls it.
+
+That is only the start. A later change to the `active` of a child updates the look of the group (it
+is drawn as holding the current page), but it does not open a closed group: a person who closed it
+keeps it closed, and a page reached from somewhere else does not pull it open. If you want that, own
+the state with `open`.
+
+The group finds the active child by reading the props of its children, which it can do only for a
+`NavItem` written in it. A link that a component of your own wraps is not seen, so the group does
+not open for it: pass `defaultOpen`.
+
+```tsx
+// Not seen: the group cannot read the props of DesignLink.
+<NavGroup label="Design" icon={<FolderIcon />} defaultOpen={pathname.startsWith('/design')}>
+  <DesignLink href="/design/mobile" />
+</NavGroup>
+```
+
+## The current page, and Next.js
+
+The Nav does not know where the application is: you say which item is the current one with `active`,
+computed from the current path. In Next.js, read the path with `usePathname`, which makes the part
+that draws the items a client component:
+
+```tsx
+'use client';
+
+import Link from 'next/link';
+import { usePathname } from 'next/navigation';
+import { NavItem } from 'h2d-glass-ui';
+import type { ComponentProps } from 'react';
+
+export function AppNavItem({ href, ...props }: ComponentProps<typeof NavItem> & { href: string }) {
+  const pathname = usePathname();
+  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
+  return (
+    <NavItem asChild active={active} {...props}>
+      <Link href={href} />
+    </NavItem>
+  );
+}
+```
+
+`asChild` renders the `Link` as the link, with the icon, the label and the count in it, and the
+`Link` keeps its prefetching and its client-side navigation. A component like `AppNavItem` is taken
+for an item, which is right; it is not one for a section (see Two levels), and a group does not see
+`active` through it (see Groups).
+
+Inside an `AppShell`, a plain click on a link closes the sheet on a narrow screen, whether it is an
+`a` or a router's `Link`. A click with Ctrl, Meta, Shift or Alt, which opens the page somewhere else,
+and a click that your own handler has stopped, leave the sheet open. The button of a group never
+closes it.
+
+## The count
+
+`badge` takes a number or a short text. A number (`0` included) or a non-empty string is drawn as
+the look asks: a `Badge` in `pill`, a bare number in `bar`. Anything else, such as an element, is
+put in the last cell as it is. The count is **part of the link's name**: this one is read "Inbox
+12".
+
+```tsx
+<NavItem href="/inbox" icon={<InboxIcon />} badge={12}>
+  Inbox
+</NavItem>
+```
+
+When "Inbox 12" is not clear enough, give a clearer word. An `aria-label` replaces the whole name, so
+keep the count in it:
+
+```tsx
+<NavItem href="/inbox" icon={<InboxIcon />} badge={12} aria-label="Inbox, 12 unread">
+  Inbox
+</NavItem>
+```
+
+At the rail the number is not drawn: the item shows a small dot, and the number stays in the name,
+so it is still read.
+
+## The rail
+
+When the `AppShell` folds the sidebar into a rail, every top-level item becomes a 40px square with
+its icon, and the label goes out of sight and stays in the name of the link. A group is a square
+too, and its button opens its links as a flyout with an arrow, to the right of the rail. A section's
+title is replaced by a rule. Nothing needs a prop: a `Nav` in the sidebar of a collapsible
+`AppShell` does it by itself.
+
+<StoryFrame title="The Nav as a rail on a wide screen" id="components-nav--pill-rail" />
+
+- **Every top-level item needs an icon,** since the icon is what a person sees at the rail. An item
+  without one is drawn as its first letter, and the Nav warns in development.
+- **The label is a tooltip.** Hovering or focusing an item at the rail shows its label on the right.
+  The label is already the name of the link, so the tooltip is not added to it as a description.
+- **A disabled item has no tooltip,** because it cannot take the focus, and a tooltip that only the
+  pointer can show says nothing to the keyboard. At the rail, give a disabled item an icon that a
+  person can recognise by itself, or leave it out of the rail.
+- **The count is a dot** (see The count).
+- **Where it applies.** The rail is only the sidebar's. A `Nav` anywhere else, in a `Drawer`, a `Card`
+  or the main content, is never a rail, even when the shell is folded, and an `AppShell` with
+  `collapsible={false}` has no rail.
+
+The flyout of a group closes on Esc, on a press outside it, when focus leaves it and when a link in
+it is pressed. Focus stays on the button when it opens, and Tab moves into the links.
+
+## Do and don't
+
+- Do give every top-level item an icon, and tell the disabled ones apart by it at the rail.
+- Do compute `active` from the current path, and use `asChild` with the router's `Link`.
+- Do pass `defaultOpen` to a group whose active link is wrapped in a component of yours.
+- Do name each `Nav` (`aria-label`) when the page has more than one.
+- Don't return a `NavSection` from a component: it must be a direct child of `Nav`.
+- Don't put a group in a group.
+- Don't count on the dot to tell the number: it is in the name.
+- Don't put a `Nav` in a `Drawer` or a `Card` and expect a rail.
+
+## Accessibility
+
+- **A navigation landmark with a name.** `Nav` is a `<nav>` named "Main" by default. A page with more
+  than one gives each its own name.
+- **Lists.** Items are `<li>` in `<ul role="list">`, so a screen reader says how many links a list
+  has even where the styling would drop its role. A section is a group named by its title, and the
+  list under a group's button is named by the button.
+- **The current page** is `aria-current="page"` on its link and on that link only, and is not told
+  by colour alone: the pill or the bar and the text weight come with it.
+- **A group is a button** with `aria-expanded`, named by its label. While it is closed, the links
+  under it are not reached with Tab. At the rail it shows its links in a popover and keeps the focus
+  on the button.
+- **Names at the rail.** The label stays in the link as text out of sight, so the name is the one of
+  the wide column. The tooltip is a convenience for sighted pointer and keyboard users. A disabled
+  item has none (see The rail).
+- **A disabled item** is a link with `aria-disabled` and no `href`: it stays in the list so that its
+  place is told, and it cannot be reached with Tab.
+- **The count is in the name** ("Inbox 12"); the dot and the number drawn are hidden from screen
+  readers, so nothing is read twice.
+- **The focus ring** is drawn on every item in every mode: inside the row for the `bar` look, and
+  with `prefers-contrast: more` and forced colours, where the current page is a solid fill or the
+  system's selection colours.
+- **On a narrow screen**, a plain click on a link in the sheet of an `AppShell` closes it and gives
+  the focus back to the button that opened it.
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index 1ce42bf..4356294 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -139,6 +139,26 @@ when a change is announced.
 - **Where a scrolled-to element lands.** The shell gives `<html>` a `scroll-padding-top` equal to
   the height of the sticky header, so focus, an `#anchor` and find-in-page never end up under it.
 
+## Navigation and the Indicator
+
+- **Names at the rail.** When the sidebar is folded into a rail, a `Nav` item shows only its icon,
+  and the label stays in the link, out of sight, as its name. The label is also a tooltip, on hover
+  and on focus, which is not a description of the link. A disabled item has no tooltip, since it
+  cannot take the focus: give it an icon a person can recognise, or leave it out of the rail. An
+  item with no icon is drawn as its first letter, and the Nav warns in development.
+- **Names and counts.** The count of an item is part of the name of its link ("Inbox 12"), and at
+  the rail the dot that stands for it is hidden from screen readers, so the number is read once.
+  When that is not clear, give the item an `aria-label` that keeps the count.
+- **The current page** is `aria-current="page"` on its link, alone. The group that holds it is
+  drawn so by colour only; a screen reader says a button named by its label, with `aria-expanded`.
+  A group opens only at the start (or as you control it), so the current page can sit in a group
+  the person closed.
+- **The Indicator is only seen.** Its number or dot is always `aria-hidden`, and nothing a caller
+  passes changes that. A screen reader says the name of the element under it, so the number must be
+  in that name ("Notifications, 3 unread"), and a dot needs words too ("Notifications, some
+  unread"). The colour of the mark only reinforces: in forced colours every status is the selection
+  colour.
+
 ## A `<dialog>` the library did not create
 
 The library tracks the Dialogs and Drawers it opens. A modal `<dialog>` from anywhere else is not in
````

Build, rồi kiểm tra gói trước khi ghi ngưỡng:

```bash
pnpm gen:theme
pnpm build
pnpm check:package
```

Expected: PASS với ngưỡng cũ (CSS 15.34 kB trên 15.49 kB, JS 51.63 kB trên 54.61 kB): task này không đổi CSS hay JS.

Ghi ngưỡng kích thước. Plan không chép `.size-limit.json`: `size:record` tự ghi file đó:

```bash
pnpm size:record
```

Expected: ngưỡng mới gần JS 56792 B, CSS 16869 B (trước: 54614 B, 15486 B), là kết quả ở bản nháp; ngưỡng là số đo cộng 10%. Nếu số khác một chút, giữ số do `size:record` ghi và nêu trong báo cáo.

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/docs
pnpm build && pnpm check:package
pnpm build-storybook
pnpm check:docs-tables
```

Expected:
- `lint`, `typecheck`, `format:check`: PASS. Dòng văn của hai trang MDX không quá 100 ký tự.
- `src/docs`: 6 test PASS (`ExceptionTable` vẫn đòi 35 dòng).
- `pnpm check:package`: PASS với ngưỡng mới: JS 51.63 kB trên 56.79 kB, CSS 15.34 kB trên 16.87 kB.
- `pnpm build-storybook`: PASS, nên `Nav.mdx` và `Accessibility.mdx` biên dịch được. Index có đúng một mục docs của Nav, `components-nav--docs`. Lệnh không mở cổng nào.
- `pnpm check:docs-tables`: `Docs tables: no table built as text in 186 files.`
- Task này không đổi file nào trong `src` ngoài hai trang MDX, nên unit, story và ảnh chuẩn không đổi.

Kiểm tra cuối của cả nhánh, như Claude chạy ở đầu nhánh nháp `7196936` (nay là `7855f42`, chỉ khác nhãn và ngắt dòng):

```bash
pnpm gen:theme
pnpm check:name
npx tsc --noEmit -p .
pnpm test:unit
pnpm check:contrast
pnpm build && pnpm check:package
pnpm build-storybook
pnpm vitest run --project storybook-light src/components/nav
pnpm vitest run --project storybook-dark src/components/nav
pnpm vitest run --project storybook-light src/components/indicator
pnpm vitest run --project storybook-dark src/components/indicator
pnpm vitest run --project storybook-light src/components/tooltip
pnpm vitest run --project storybook-dark src/components/tooltip
pnpm vitest run --project storybook-light src/components/app-shell
pnpm vitest run --project storybook-dark src/components/app-shell
pnpm vitest run --project storybook-light src/docs
pnpm vitest run --project storybook-dark src/docs
node -e "const e=Object.values(require('./storybook-static/index.json').entries);const v=e.filter((x)=>x.type==='story'&&!(x.tags||[]).includes('no-visual'));console.log(v.length);console.log(v.filter((x)=>/^components-(indicator|nav)--/.test(x.id)).map((x)=>x.id).join(' '));console.log(e.filter((x)=>x.type==='docs'&&/^components-(indicator|nav)--/.test(x.id)).map((x)=>x.id).join(' '))"
```

Expected:
- `pnpm check:name`: PASS (`check:name: no "fl-glass-ui" outside docs/superpowers.`).
- `npx tsc --noEmit -p .`: PASS.
- `pnpm test:unit`: 4120 test PASS, 4 skip (197 file).
- `pnpm check:contrast`: PASS (`Contrast check passed.`).
- `pnpm check:package`: PASS với ngưỡng của Step 3.
- `pnpm build-storybook`: PASS. Thư mục `storybook-static` bị git bỏ qua.
- Story, ở mỗi project: nav 42, indicator 15, tooltip 42, app-shell 165, docs 30 test PASS.
- Lệnh `node` in `130`, rồi `components-indicator--indicator components-nav--pill components-nav--bar components-nav--pill-rail components-nav--bar-rail`, rồi `components-indicator--docs components-nav--docs`: năm story giao diện, 40 ảnh chuẩn mới, như mô tả PR phải nêu (phát hiện 19).
- Không chạy cả bộ story một lượt; CI chạy cả bộ. Không chạy fixture: Plan B không đổi fixture.

- [ ] **Step 5: Commit**

```bash
git add \
  .size-limit.json \
  src/components/nav/Nav.mdx \
  src/docs/Accessibility.mdx
```
```bash
git commit -m "docs(nav): add the Nav page, the Accessibility notes for Nav and Indicator, and the size limits" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

## Sau khi thực thi

- Đẩy nhánh, rồi tạo ảnh chuẩn bằng workflow "Update visual baselines": 40 ảnh mới của năm story giao diện (`Indicator`, `Pill`, `Bar`, `PillRail`, `BarRail`, mỗi story 4 chế độ × sáng, tối). Xem ảnh trước khi xin review: khớp b1, b3, n1, n2 ở chế độ `normal`; ảnh rail có tooltip của "Calendar" và flyout của "Design", không có vòng focus; ảnh cũ của mọi component khác không đổi.
- Mô tả PR nêu cho chủ dự án những gì phát hiện 19 liệt kê, các quyết định Claude tự chốt và các mục để lại (phát hiện 21); merge PR này không phát hành gì (không có changeset).

### Đã thực thi (2026-11-11)

- Bốn commit của nhánh nháp được cherry-pick lên `feat/phase-5-plan-b` (`73db019`, `26b40e7`, `870ffb7`, `e46b26e`). Cây giống hệt đầu nhánh nháp (`7855f42`), cộng file plan.
- Mỗi task có một reviewer riêng (bốn reviewer chạy song song, chỉ đọc). Task 1–3: Approved. Task 4: Needs fixes, vì ví dụ `AppNavItem` trong `Nav.mdx` làm link mất nhãn. Reviewer Task 1 hỏi về chấm của Indicator so với mockup header; Claude chốt code đúng: chấm ở trang header là của phương án B2, không được chọn, còn chấm của Indicator lấy theo chấm số đếm ở rail (n1, n2).
- Review toàn nhánh trên Opus, dùng góp ý của chủ dự án ở PR #37 trước tiên, rồi PR #27, #28, #29, #34 làm lăng kính: "With fixes" (3 Important, 11 Minor). Sửa trong một đợt, mỗi mục một commit (`9242bfb`..`9603159`):
  - **Một mục có điều kiện làm các nhóm sau nó mount lại** (nhóm đang mở đóng lại, focus về `<body>`): key của con `Nav` theo đúng vị trí đã viết, như `Children.toArray`, và key của mỗi dãy mục theo thứ tự giữa các dãy (`9242bfb`); phần rail và flyout chuyển sang `nav-rail.tsx`.
  - **Ví dụ Next.js mất nhãn:** `<Link href={href}>{children}</Link>`, so đường dẫn bằng `pathname === href || pathname.startsWith(href + '/')` (`ff86469`).
  - **Vạch N2 và tooltip ở rail chỉ đúng với rail 68px:** vạch tính từ `--flg-app-shell-rail-width`, khoảng cách tooltip đo khi mở; story `RailWidths` kiểm ở 56, 68, 80px (`d0143e3`).
  - Minor sửa luôn: quy tắc "click thường" và chặn kích hoạt dùng chung trong `internal/click.ts` cho Button, Pagination, Nav (`6a83328`); flyout chỉ đóng khi click thường, chưa bị chặn (`bb86f4b`); tooltip rail không tự mở lại (`1f75574`); `flex-grow` chỉ trong thân sidebar (`426bcd0`); tiêu đề mục dài một dòng có "…" (`0d284c1`); một `Intl.Segmenter` (`4417b48`); khoảng cách và đường chia cho dãy mục sau một mục có tiêu đề (`4c0458f`); câu chữ của docs (`fcb1e2e`); test không còn in cảnh báo (`5d47747`); ngưỡng kích thước JS 57127 B, CSS 16957 B (`9603159`).
  - Các dòng spec sửa, đánh dấu "(phát hiện khi review cuối Plan B)": §4.3, §5, §6.3.
  - Lần review lại: cả 13 mục đã xử lý, không có lỗi mới; hai câu docs (mục tắt dùng `Link` của router, "prevented" thay "stopped") Claude sửa ở `494ff9f`.
- **Quyết định Claude tự chốt khi thực thi** (chủ dự án có thể đảo lại):
  - Khoảng cách tooltip ở rail làm tròn xuống, nên rail 68px giữ đúng 20px của mockup; ở bề rộng chẵn khác tooltip cách rail 5.5px.
  - Flyout đóng từ chính `NavItem` (link của router chặn hành động mặc định trước khi danh sách thấy lần bấm); một `<a>` trơn không phải `NavItem` trong nhóm không đóng flyout.
  - Mục tắt dùng `Link` của router: docs khuyên render thành `NavItem disabled` trơn, không có `Link`.
- **Để lại** (ghi trong mô tả PR): flyout rộng 166px nên nhãn dài bị cắt, flyout không có tooltip (câu hỏi cho chủ dự án, mockup là chuẩn); một `Nav` trong popup mở từ rail cũng vẽ thành rail; link `target="_blank"` hay `download` vẫn đóng tấm trượt; mục tắt ở rail không có tooltip; cửa sổ mất focus không đóng flyout; nếu mọi mục trước `NavSection` đầu tiên đều có điều kiện, dãy sau đổi key khi dãy đầu xuất hiện hay biến mất; Safari thật, VoiceOver và NVDA chưa thử.
- Kiểm tra trên `9603159` (người sửa) và `494ff9f` (Claude): lint, typecheck, format, unit + unit-react18 + scripts 199 file, 4166 passed, 4 skipped; build, `check:package` (JS 51,94/57,13 kB, CSS 15,42/16,96 kB), build Storybook, `check:docs-tables`; story nav 54 + 54, button 21, pagination 9, app-shell 165, indicator 15 ở ba engine (người sửa).
